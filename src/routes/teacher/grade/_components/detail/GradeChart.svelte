<script>
  import { onMount, getContext } from 'svelte';
  import Select from '$lib/components/Select/Select.svelte';
  import Option from '$lib/components/Select/Option.svelte';
  import BarChart from '../../_components/detail/charts/BarChart.svelte';

  /**
   * @typedef {Object} Props
   * @property {'practice' | 'exam'} type - 类型
   * @property {string|number} resourceId - 资源ID
   * @property {Array} [papers] - 试卷选项（考试类型需要）
   */

  /**
   * @type {Props}
   */
  let { type, resourceId, papers = [] } = $props();

  // 获取 Context 数据
  let contextData = $state(null);
  try {
    if (type === 'practice') {
      const context = getContext('practice');
      contextData = context?.practiceData;
    } else {
      const context = getContext('exam');
      contextData = context?.examData;
    }
  } catch {
    // Context 不存在时忽略
  }

  // 状态变量
  let xAxis_data = $state(['0-19', '20-39', '40-59', '60-79', '80-100']);
  let series_data = $state([]);
  let columnNum = $state(5); //直方图列数
  let currentPaperId = $state('');
  let options = $state([]);
  let loading = $state(false);
  let error = $state(null);

  // 分布数据
  let distributionData = $state(null);

  /**
   * 根据总分划分区间段（从低到高）
   * @param {number} totalScore - 当前试卷总分
   * @param {number} columnCount - 划分列数
   * @returns {string[]} 区间段数组（从低到高）
   */
  function getScoreSegments(totalScore, columnCount) {
    const step = Math.floor(totalScore / columnCount);
    const segments = [];

    for (let i = 0; i < columnCount; i++) {
      const start = i * step;
      const end = i === columnCount - 1 ? totalScore : (i + 1) * step - 1;
      segments.push(`${start}-${end}`);
    }

    return segments;
  }

  /**
   * 获取考试成绩分布数据
   */
  function getExamDistributionData() {
    if (!resourceId) {
    error = '缺少资源ID';
    return Promise.resolve();
  }

    loading = true;
    error = null;

    const params = new URLSearchParams({
      category: type, 
      columnNum,
       ...(type === 'practice' ? { practiceID: String(resourceId) }
                            : { examID: String(resourceId) })
    });

    return fetch(`/api/grade/distribution?${params.toString()}`, {
    method: 'GET',
    credentials: 'include'
  })
    .then(res => {
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return res.json();
    })
    .then(json => {
      if (json.status !== 0) throw new Error(json.msg || '获取数据失败');

      /* 统一成前端需要的数据结构（兼容练习/考试） */
      const src = json.data;               // 后端原始 data
      const isPractice = type === 'practice';

      distributionData = {
        // id / name 兼容两种场景
        id          : isPractice ? src.practice_id  : src.exam_id,
        name        : isPractice ? src.practice_name : src.exam_name,

        // 练习时后端返回结构与考试一致，直接取第一条
        gradeDistribution: isPractice
          ? (src.grade_distribution?.[0]?.score_distribution ?? [])
          : (src.grade_distribution ?? [])
            .map(s => ({
              exam_session_id : s.exam_session_id,
              exam_paper_id   : s.exam_paper_id,
              exam_paper_name : s.exam_paper_name,
              total_score     : s.total_score,
              score_distribution: s.score_distribution
            }))
      };

        console.log('成绩分布数据:', distributionData);
      })
      .catch((err) => {
        console.error('获取成绩分布数据失败:', err);
        error = err.message;
      })
      .finally(() => {
        loading = false;
      });
  }

  /**
   * 将试卷数据转换为下拉选项
   */
  function examDataToOptions() {
    return papers.map((session) => ({
      value: session.id,
      label: session.name,
    }));
  }

  /**
   * 更新系列数据
   */
  function updateSeriesData() {
    if (type === 'practice') {
      if (distributionData) {
        series_data = distributionData.gradeDistribution.slice().reverse();
        xAxis_data = getScoreSegments(contextData?.totalScore || 100, columnNum);
      }
    } else {
      // 考试类型
      if (currentPaperId && distributionData) {
        const selectedPaper = papers.find((paper) => paper.id == currentPaperId);
        const selectedSession = distributionData.grade_distribution?.find(
          (session) => session.exam_session_id == selectedPaper?.id,
        );

        if (selectedSession && selectedPaper) {
          series_data = selectedSession.score_distribution.slice().reverse();
          xAxis_data = getScoreSegments(selectedPaper.totalScore || 100, columnNum);
        } else {
          series_data = [];
          xAxis_data = [];
        }
      } else {
        series_data = [];
        xAxis_data = [];
      }
    }
  }

  /**
   * 处理试卷选择变化
   */
  function handlePaperChange(event) {
    currentPaperId = event.detail;
    updateSeriesData();
  }

  // 初始化
  onMount(async () => {
	console.log('初始化 GradeChart:', { type, resourceId, papers });
    await getExamDistributionData();

    updateSeriesData();
    if (type === 'exam') {
      options = examDataToOptions();
      currentPaperId = options.length > 0 ? options[0].value : '';
    }
  });
</script>

{#if type === 'practice' || type === 'exam'}
  <div class="chart-container">
    <div class="title">成绩分析</div>
    {#if type === 'exam' && papers.length > 1}
      <div class="dropdown">
        <Select value={currentPaperId} placeholder="选择试卷" on:change={handlePaperChange}>
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
          <div class="loading-state">加载中...</div>
        {:else if error}
          <div class="error-state">
            <div class="error-message">暂时无法加载数据</div>
            <button class="retry-button" onclick={() => getExamDistributionData()}>重试</button>
          </div>
        {:else if series_data.length === 0}
          <div class="empty-state">暂无成绩分布数据</div>
        {:else}
          <div class="bar-chart">
            {#each xAxis_data as category, index}
              {@const value = series_data[index] || 0}
              {@const maxValue = Math.max(...series_data)}
              {@const height = maxValue > 0 ? (value / maxValue) * 200 : 0}

              <div class="bar-item">
                <div class="bar-wrapper">
                  <div class="bar" style="height: {height}px" title="{category}: {value}人"></div>
                  <div class="bar-value">{value}</div>
                </div>
                <div class="bar-label">{category}</div>
              </div>
            {/each}
          </div>
        {/if}
      </div>
    </div>
  </div>
{/if}

<style lang="scss" scoped>
  .chart-container {
    width: 100%;
    height: 100%;
    min-width: 600px;
    margin-bottom: 40px;

    .title {
      font-size: 22px;
      font-weight: bold;
      margin-top: 10px;
      margin-bottom: 20px;
    }

    .dropdown {
      margin-bottom: 20px;
    }

    .chart {
      width: 100%;
      height: 80%;
      border: 1px solid #e5e7eb;

      &.small {
        height: 60%;
      }

      .chart-content {
        width: 100%;
        height: 100%;
        padding: 20px;
        display: flex;
        flex-direction: column;

        .chart-title {
          text-align: center;
          font-size: 18px;
          font-weight: normal;
          color: #333;
          margin-bottom: 20px;
        }

        .empty-state {
          display: flex;
          align-items: center;
          justify-content: center;
          height: 100%;
          color: #666;
          font-size: 14px;
        }

        .loading-state {
          display: flex;
          align-items: center;
          justify-content: center;
          height: 100%;
          color: #666;
          font-size: 14px;
        }

        .error-state {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          height: 100%;
          gap: 10px;

          .error-message {
            color: #e74c3c;
            font-size: 14px;
          }

          .retry-button {
            padding: 6px 12px;
            background-color: #3498db;
            color: white;
            border: none;
            border-radius: 4px;
            cursor: pointer;
            font-size: 12px;

            &:hover {
              background-color: #2980b9;
            }
          }
        }

        .bar-chart {
          display: flex;
          align-items: flex-end;
          justify-content: center;
          gap: 20px;
          height: 100%;
          padding: 20px 0;

          .bar-item {
            display: flex;
            flex-direction: column;
            align-items: center;
            min-width: 60px;

            .bar-wrapper {
              display: flex;
              flex-direction: column;
              align-items: center;
              height: 220px;
              justify-content: flex-end;
              margin-bottom: 8px;

              .bar {
                width: 35px;
                background-color: #5c7bd9;
                border-radius: 0;
                transition: all 0.3s ease;
                cursor: pointer;
                min-height: 2px;

                &:hover {
                  opacity: 0.8;
                }
              }

              .bar-value {
                margin-top: 4px;
                font-size: 12px;
                color: #333;
                font-weight: normal;
              }
            }

            .bar-label {
              font-size: 12px;
              color: #333;
              text-align: center;
              white-space: nowrap;
            }
          }
        }
      }
    }
  }
</style>
