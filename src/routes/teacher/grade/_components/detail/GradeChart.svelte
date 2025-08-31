<script>
  import { onMount, getContext } from 'svelte';
  import Select from '$lib/components/Select/Select.svelte';
  import Option from '$lib/components/Select/Option.svelte';
  import Empty from '$lib/components/Table/Empty.svelte';
  import BarChart from './charts/BarChart.svelte';
  import '$lib/components/Button/index.scss';
  import Loading from '$lib/components/Loading/Loading.svelte';


  /**
   * @typedef {Object} Props
   * @property {'practice' | 'exam'} type - 类型
   * @property {string|number} resource_id - 资源ID
   * @property {Array} [papers] - 试卷选项（考试类型需要）
   */

  /**
   * @type {Props}
   */
  let { type, resource_id, papers = [] } = $props();

  // 获取 Context 数据
  let context_data = $state(null);
  try {
    if (type === 'practice') {
      const context = getContext('practice');
      context_data = context;
    } else {
      const context = getContext('exam');
      context_data = context;
    }
  } catch {
    // Context 不存在时忽略
  }

  // 状态变量
  let xAxis_data = $state(['0-19', '20-39', '40-59', '60-79', '80-100']);
  let series_data = $state([]);
  let column_num = $state(5); //直方图列数（动态计算）
  let current_paper_id = $state('');
  let options = $state([]);
  let loading = $state(false);
  let error = $state(null);

  // 分布数据
  let distribution_data = $state(null);

  /**
   * 根据总分计算合适的列数
   * @param {number} total_score - 试卷总分
   * @returns {number} 合适的列数
   */
  function calculateOptimalColumnNum(total_score) {
    if (!total_score || total_score <= 0) return 5;

    const idealIntervalSize = 10; // 设置理想的区间大小
    let optimalColumns = Math.round(total_score / idealIntervalSize);

    // 根据分数范围调整列数
    if (total_score < 5) {
      optimalColumns = total_score;
    } else if (total_score <= 10) {
      optimalColumns = 4;
    }  else if (total_score <= 50) {
      optimalColumns = 5;
    } else if (total_score <= 100) {
      optimalColumns = Math.max(5, Math.min(8, optimalColumns));
    } else {
      optimalColumns = Math.max(6, Math.min(10, optimalColumns));
    }
    return optimalColumns;
  }

  /**
   * 根据总分划分区间段（从低到高）
   * @param {number} total_score - 当前试卷总分
   * @param {number} column_count - 划分列数
   * @returns {string[]} 区间段数组（从低到高）
   */
  function getScoreSegments(total_score, column_count) {
    //切割总分
    const step = Math.ceil(total_score / column_count);
    const segments = [];

    for (let i = 0; i < column_count; i++) {
      const start = i * step;
      const end = i === column_count - 1 ? total_score : (i + 1) * step - 1;
      segments.push(`${start}-${end}`);
    }

    return segments;
  }

  /**
   * 获取考试成绩分布数据
   */
  function getExamDistributionData() {
    if (!resource_id) {
      error = '缺少资源ID';
      return Promise.resolve();
    }

    loading = true;
    error = null;

    // 动态计算合适的列数
    const total_score = getCurrentTotalScore();
    column_num = calculateOptimalColumnNum(total_score);
    // console.log(`根据总分 ${total_score} 最佳列数: ${column_num}`);

    const params = new URLSearchParams({
      category: type,
      columnNum: column_num,
      ...(type === 'practice' ? { practiceID: String(resource_id) } : { examID: String(resource_id) }),
    });

    return fetch(`/api/grade/distribution?${params.toString()}`, {
      method: 'GET',
      credentials: 'include',
    })
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json();
      })
      .then((json) => {
        if (json.status !== 0) throw new Error(json.msg || '获取数据失败');

        const src = json.data; // 后端原始 data
        const isPractice = type === 'practice';

        console.log('API 返回的原始数据:', { src, isPractice, type });

        distribution_data = {
          // id / name 兼容两种场景
          id: isPractice ? src.practice_id : src.exam_id,
          name: isPractice ? src.practice_name : src.exam_name,

          // 修正练习数据的解析逻辑
          gradeDistribution: isPractice
            ? (src.grade_distribution ?? []) // 练习直接使用分布数据数组
            : (src.grade_distribution ?? []).map((s) => ({
                exam_session_id: s.exam_session_id,
                exam_paper_id: s.exam_paper_id,
                exam_paper_name: s.exam_paper_name,
                total_score: s.total_score,
                score_distribution: s.score_distribution,
              })),
        };
      })
      .catch((err) => {
        console.error('获取成绩分布数据失败:', err);
        error = err.message;
      })
      .finally(() => {
        loading = false;
        // 数据加载完成后更新图表
        updateSeriesData();
      });
  }

  /**
   * 将试卷数据转换为下拉选项
   */
  function examDataToOptions() {
    // 先按照exam_session_id（即session.id）排序，然后转换为选项
    return [...papers]
      .sort((a, b) => Number(a.id) - Number(b.id))
      .map((session) => ({
        value: session.id,
        label: session.name,
      }));
  }

  /**
   * 更新系列数据
   */
  function updateSeriesData() {
    // console.log('updateSeriesData调用:', { type, current_paper_id, distribution_data, papers, context_data });

    if (type === 'practice') {
      if (distribution_data && distribution_data.gradeDistribution) {
        console.log('练习数据处理:', {
          distribution_data,
          gradeDistribution: distribution_data.gradeDistribution,
          context_data: context_data?.practiceData,
          total_score: context_data?.practiceData?.total_score,
        });

        series_data = distribution_data.gradeDistribution.slice().reverse();
        // 使用 context 中的练习数据获取总分
        const total_score = context_data?.practiceData?.total_score || 100;
        xAxis_data = getScoreSegments(total_score, column_num);

        // console.log('练习图表数据设置:', { series_data, xAxis_data, total_score });
      } else {
        // console.warn('练习缺少分布数据:', { distribution_data });
        series_data = [];
        xAxis_data = [];
      }
    } else {
      // 考试类型
      if (distribution_data && distribution_data.gradeDistribution) {
        console.log('考试数据处理:', {
          current_paper_id,
          gradeDistribution: distribution_data.gradeDistribution,
          papers,
          papers结构: papers.map((p) => ({ id: p.id, name: p.name })),
          分布数据结构: distribution_data.gradeDistribution.map((g) => ({
            exam_session_id: g.exam_session_id,
            exam_paper_name: g.exam_paper_name,
            score_distribution: g.score_distribution,
          })),
        });

        // 如果没有选择试卷ID，使用第一个试卷
        const targetPaperId = current_paper_id || papers[0]?.id;
        // console.log('目标试卷ID:', targetPaperId);

        const selectedPaper = papers.find((paper) => paper.id == targetPaperId);
        const selectedSession = distribution_data.gradeDistribution.find(
          (session) => session.exam_session_id == selectedPaper?.id,
        );

        // console.log('匹配过程:', {
        //   targetPaperId,
        //   selectedPaper,
        //   selectedSession,
        //   匹配条件: selectedPaper ? `${selectedPaper.id} == session.exam_session_id` : '无选中试卷',
        //   所有session的exam_session_id: distribution_data.gradeDistribution.map((s) => s.exam_session_id),
        // });

        if (selectedSession && selectedPaper) {
          series_data = selectedSession.score_distribution.slice().reverse();
          xAxis_data = getScoreSegments(selectedPaper.total_score || selectedSession.total_score || 100, column_num);
          console.log('设置图表数据:', { series_data, xAxis_data });
        } else {
          console.warn('未找到匹配的试卷或会话');
          series_data = [];
          xAxis_data = [];
        }
      } else {
        console.warn('缺少分布数据');
        series_data = [];
        xAxis_data = [];
      }
    }

    // console.log('最终图表数据:', { series_data, xAxis_data });
  }

  /**
   * 处理试卷选择变化
   */
  function handlePaperChange(value) {
    current_paper_id = value;

    // 切换试卷时重新获取数据（这会重新计算列数）
    getExamDistributionData();
  }

  /**
   * 获取当前的总分
   * @returns {number} 当前试卷的总分
   */
  function getCurrentTotalScore() {
    if (type === 'practice' && context_data?.practiceData?.total_score) {
      return context_data.practiceData.total_score;
    } else if (type === 'exam') {
      // 对于考试，使用当前选中试卷的总分
      const selectedPaper = papers.find((p) => p.id == current_paper_id) || papers[0];
      if (selectedPaper?.total_score) {
        return selectedPaper.total_score;
      }
      // 如果从 papers 中找不到，尝试从 context 中获取
      if (context_data?.examData?.papers) {
        const contextPaper =
          context_data.examData.papers.find((p) => p.id == current_paper_id) || context_data.examData.papers[0];
        if (contextPaper?.total_score) {
          return contextPaper.total_score;
        }
      }
    }
    return 100; // 默认值
  }

  // 初始化
  onMount(async () => {
    console.log('初始化 GradeChart:', { type, resource_id, papers });

    // 先设置考试类型的选项和默认试卷ID
    if (type === 'exam' && papers && papers.length > 0) {
      options = examDataToOptions();
      current_paper_id = options.length > 0 ? options[0].value : '';
      console.log('设置默认试卷ID:', current_paper_id);
    }

    await getExamDistributionData();
  });
</script>

{#if type === 'practice' || type === 'exam'}
  <div class="chart-container">
    <div class="title">成绩分析</div>
    {#if type === 'exam' && papers.length > 1}
      <div class="dropdown">
        <Select value={current_paper_id} placeholder="选择试卷" changeValue={handlePaperChange}>
          {#each options as option}
            <Option value={option.value} label={option.label}>{option.label}</Option>
          {/each}
        </Select>
      </div>
    {/if}
    <div class="chart {type === 'exam' && papers.length > 1 ? 'small' : ''}">
      <div class="chart-content">
        <div class="chart-title">成绩分布图</div>
        {#if loading}
        <div class="loading-state">
          <Loading bind:value={loading} loading_text="正在加载" is_fullscreen={false}></Loading>
</div>
        {:else if error}
          <div class="error-state">
            <Empty text="暂无试卷数据" />
          </div>
        {:else if series_data.length === 0}
          <div class="empty-state">
            <Empty text="暂无该试卷数据" />
          </div>
        {:else}
          <div class="echarts-wrapper">
            <BarChart 
              title_text="成绩分布图"
              xAxis_data={xAxis_data}
              series_data={series_data}
              loading={loading}
              show_title={false}
            />
          </div>
        {/if}
      </div>
    </div>
  </div>
{/if}

<style lang="scss" scoped>
  .chart-container {
    width: 100%;
    min-width: 600px;

    .title {
      font-size: 22px;
      font-weight: bold;
      margin-top:5px;
      margin-bottom: 10px;
    }

    .dropdown {
      margin-bottom: 15px;
    }

    .chart {
      width: 100%;
      height: 400px;
      border: 1px solid #e5e7eb;

      &.small {
        height: 350px;
      }

      .chart-content {
        width: 100%;
        height: 100%;
        padding: 10px;
        display: flex;
        flex-direction: column;

        .chart-title {
          text-align: center;
          font-size: 18px;
          font-weight: normal;
          color: #333;
          margin-bottom: 5px;
          
        }

        .empty-state {
          display: flex;
          align-items: center;
          justify-content: center;
          height: 100%;
          margin-top: 45px;
          margin-bottom: 60px;
        }

        .loading-state {
          position: relative;
          display: flex;
          align-items: center;
          justify-content: center;
          height: 100%;
        }

        .error-state {
          display: flex;
          align-items: center;
          justify-content: center;
          height: 100%;
          margin-top: 45px;
          margin-bottom: 60px;
        }

        .echarts-wrapper {
          height: 100%;
          width: 100%;
          min-height: 280px;
        }
      }
    }
  }
</style>
