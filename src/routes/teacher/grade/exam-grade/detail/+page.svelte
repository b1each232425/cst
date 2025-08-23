<script>
  import { onMount, setContext } from 'svelte';
  import { goto } from '$app/navigation';
  import { page } from '$app/stores';
  import InfoCard from '../../_components/detail/InfoCard.svelte';
  import StudentGradeTable from '../../_components/detail/StudentGradeTable.svelte';
  import GradeChart from '../../_components/detail/GradeChart.svelte';
  import AnalysisPanel from '../../_components/detail/AnalysisPanel.svelte';
  import { toast } from '$lib/components/Toast/Toast.js';


  // 后端返回数据类型
  /**
   * @typedef {Object} Session
   * @property {number} exam_id - 考试ID
   * @property {number} exam_session_id - 考试场次ID
   * @property {string} paper_name - 考卷名称
   * @property {string} start_time - 考试开始时间（ISO格式）
   * @property {string} end_time - 考试结束时间（ISO格式）
   * @property {string} status - 考试状态
   * @property {number} total_score - 试卷总分
   * @property {number} average_score - 平均分
   * @property {number} scheduled_examinees - 应考人数
   * @property {number} actual_examinees - 实考人数
   * @property {number} pass_examinees - 及格人数（总得分 >= 0.6 * 试卷总分）
   * @property {string} mark_mode - 批改模式
   */

  /**
   * @typedef {Object} ResponseData
   * @property {number} id - 考试ID
   * @property {string} name - 考试名称
   * @property {string} type - 考试类型
   * @property {string} class - 考试班级
   * @property {Session[]} sessions - 考试场次（使用的试卷名称）
   * @property {boolean} submitted - 是否已提交成绩
   */

  // 整合为更适合使用的数据类型
  /**
   * @typedef {Object} ExamData
   * @property {number} id - 考试ID
   * @property {string} title - 考试名称
   * @property {string} type - 考试类型
   * @property {string} exam_time_text - 多场考试时间汇总字符串
   * @property {number} total_score - 整场考试总分（可取首场试卷分值）
   * @property {number} average_score - 加权平均分
   * @property {number} total_examinees - 应考人数总和
   * @property {number} pass_examinees - 及格人数总和
   * @property {boolean} submitted - 是否提交
   * @property {boolean} canSubmit - 是否可以提交（所有session状态都为'10'）
   * @property {PaperInfo[]} papers - 各试卷详情
   */

  /**
   * @typedef {Object} PaperInfo
   * @property {number} id - 试卷ID(目前是考试场次ID)
   * @property {string} idText - 试卷编号文本，如 "试卷1"
   * @property {string} name - 试卷名称
   * @property {number} actual_examinees - 实考人数
   * @property {number} total_score - 单张试卷总分
   * @property {number} average_score - 平均分
   * @property {number} pass_examinees - 通过人数
   * @property {string} mark_mode - 批改模式
   * @property {string} status - 考试状态
   */

  // 常量定义
  const MARK_MODE_MAP = {
    '00': '自动批改',
    '02': '全卷多评',
    '04': '试卷分配',
    '06': '题组专评',
    '08': '题目分配',
    '10': '单人批改',
  };

  const EXAM_TYPE_MAP = {
    '00': '平时考试',
    '02': '期末考试',
    '04': '资格证考试',
  };

  /**
   * @type {string|null}
   */
  let examId = $state('');

  /**
   * @type {ExamData|null}
   * @description 当前考试数据
   */
  let examData = $state(null);

  /**
   * @type {boolean}
   * @description 在获取到examId前不显示页面内容
   * @default false
   */
  let is_show = $state(false);

  // 设置上下文
  setContext('exam', {
    get examId() {
      return examId;
    },
    get examData() {
      return examData;
    },
  });

  /**
   * 格式化考试时间
   */
  function formatExamTime(sessions) {
  if (!Array.isArray(sessions) || sessions.length === 0) return '--';

  try {
    const pad = (n) => n.toString().padStart(2, '0');

    const fmt = (date) => {
      const y = date.getFullYear();
      const m = pad(date.getMonth() + 1);
      const d = pad(date.getDate());
      const h = pad(date.getHours());
      const min = pad(date.getMinutes());
      const s = pad(date.getSeconds());
      return `${y}-${m}-${d} ${h}:${min}:${s}`;
    };

    return sessions
      .map((s, i) => {
        if (!s.start_time) return `试卷${i + 1}:--`;

        const start = new Date(s.start_time);
        const end   = s.end_time ? new Date(s.end_time) : null;

        const startStr = fmt(start);
        const endStr   = end ? fmt(end) : '--';

        return `试卷${i + 1}:${startStr} - ${endStr}`;
      })
      .join('  ');
  } catch {
    return '--';
  }
}

  /**
   * 将原始考试数据转换为更适合展示的结构
   * @param {ResponseData} raw
   * @returns {ExamData}
   */
  function transformResponseData(raw) {
    const sessions = raw.sessions || [];

    // 格式化考试时间文字
    const exam_time_text = formatExamTime(sessions);

    // 总应考人数
    const total_examinees = sessions.reduce((sum, s) => sum + (s.scheduled_examinees || 0), 0);

    const pass_examinees = sessions.reduce((sum, s) => sum + (s.pass_examinees || 0), 0);

    // 总分，取每个试卷的分数之和
    const total_score = sessions.reduce((sum, s) => sum + (s.total_score || 0), 0);

    // 平均分：加权计算
    const totalActual = sessions.reduce((sum, s) => sum + (s.actual_examinees || 0), 0);
    const weightedTotalScore = sessions.reduce((sum, s) => sum + (s.average_score || 0) * (s.actual_examinees || 0), 0);
    const average_score = totalActual === 0 ? 0 : parseFloat((weightedTotalScore / totalActual).toFixed(1));

    // 试卷详情
    const papers = sessions.map((s, i) => ({
      id: s.exam_session_id,
      idText: `试卷${i + 1}`,
      name: s.paper_name,
      actual_examinees: s.actual_examinees || 0,
      total_score: s.total_score || 0,
      average_score: s.average_score || 0,
      pass_examinees: s.pass_examinees || 0,
      mark_mode: MARK_MODE_MAP[s.mark_mode] || s.mark_mode || '自动批改',
      status: s.status, // 添加状态字段
    }));

    // 检查所有session的状态是否都为'10'
    const canSubmit = sessions.every(s => s.status === '10');


    return {
      id: raw.id,
      title: raw.name,
      type: EXAM_TYPE_MAP[raw.type] || raw.type || '其他考试',
      exam_time_text,
      total_score,
      average_score,
      total_examinees,
      pass_examinees,
      submitted: raw.submitted || false,
      papers,
      canSubmit, // 添加是否可以提交的标志
    };
  }

  /**
   * 获取考试数据
   * @param {string} examId - 考试ID
   * @returns {Promise<ExamData|null>} 返回考试数据
   */
  function fetchExamData(examId) {
    const query = new URLSearchParams({
      category: 'exam',
      page: '1',
      pageSize: '10',
      submitted: '-1',
      examID: examId,
    });

    return fetch(`/api/grade/list?${query.toString()}`, {
      method: 'GET',
      credentials: 'include',
    })
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json();
      })
      .then((json) => {
        if (json.status !== 0) throw new Error(json.msg || '接口返回异常');

        // 后端按 examID 过滤，数组里只有 1 条或为空
        const raw = (json.data || [])[0];
        if (!raw) throw new Error('未找到对应考试');

        return transformResponseData(raw);
      })
      .catch((err) => {
        console.error('获取考试数据失败:', err);
        toast.error(`获取考试数据失败: ${err.message}`);
        return null;
      });
  }

  /**
   * 提交考试成绩
   */
  function handleExamSubmitted(examIds) {
    const body = JSON.stringify({ data: { exam_ids: examIds } });

    return fetch('/api/grade/submission', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body,
    })
      .then((response) => {
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        return response.json();
      })
      .then((result) => {
        if (result.status === 0) {
          console.log('成绩提交成功');
          toast.success('成绩提交成功');
          // 更新本地提交状态
          if (examData) {
            examData.submitted = true;
          }
        } else {
          throw new Error(result.msg || '提交失败');
        }
      })
      .catch((err) => {
        console.error('提交成绩失败:', err);
        toast.error(`提交成绩失败: ${err.message}`);
      });
  }

  // 页面初始化
  onMount(async () => {
    // 从 URL 参数获取考试 ID
    examId = $page.url.searchParams.get('id');
    console.log('Exam ID:', examId);

    if (!examId) {
      console.error('缺少考试ID参数');

      goto('/teacher/grade/exam-grade');
      return;
    }

    // 获取考试数据
    examData = await fetchExamData(examId);

    is_show = true;
  });
</script>

{#if is_show}
  <div class="page-container">
    <!-- 主要内容 -->
    <div class="detail-container">
      <!-- 基本信息卡片 -->
      <div class="first-row">
        <section class="card info-section">
          <InfoCard type="exam" data={examData} />
        </section>
        <!-- 成绩分布图表 -->
        <section class="card chart-section">
          <GradeChart type="exam" resource_id={examId} papers={examData?.papers || []} />
        </section>
      </div>
      <div class="second-row">
        <!-- 学生成绩表格 -->
        <section class="card grade-section">
          <StudentGradeTable type="exam" resource_id={examId} papers={examData?.papers || []} />
        </section>
      </div>

      <div class="third-row">
        <!-- 试卷分析 -->
        <!-- <section class="card analysis-section">
			<AnalysisPanel
				type="exam"
				resource_id={examId}
				papers={examData?.papers || []}
			/>
		</section> -->
      </div>

      <div class="buttons-container">
        <button
          class="submit-button"
          onclick={() => handleExamSubmitted([Number(examId)])}
          disabled={examData?.submitted || !examData?.canSubmit}
          title={examData?.submitted ? '成绩已提交' : (!examData?.canSubmit ? '所有试卷状态必须为已批改才能提交' : '点击提交成绩')}
        >
          提交成绩
        </button>
      </div>
    </div>
  </div>
{/if}
<!-- <div class="bottom-action-panel-fixed">
      <button class="import-button">导出学生</button
      >
      <button class="submit-button">提交成绩</button
      >
    </div> -->
<style lang="scss" scoped>
  .page-container {
    background-color: var(--bg-primary);
    height: 100%;
    width: 100%;
    

    .detail-container {
      display: flex;
      flex-direction: column;
      height: 98%;
      gap: 20px;
      overflow: auto;
      padding: 10px;

      .card {
        box-sizing: border-box;
        border: 1px solid #d7d7d7;
        border-radius: 4px;
        padding: 10px;
      }
      
      .first-row {
        display: flex;
        gap: 10px;
        flex-shrink: 0;
        .info-section {
          flex: 0 0 calc(55% - 5px);
          min-width: 800px;
        }
        .chart-section {
          flex: 0 0 calc(45% - 5px);
          min-width: 680px;
        }
      }
      .second-row {
        .grade-section {
          min-width: 1490px;
        }
      }

      .third-row {
        .analysis-section {
          min-width: 1490px;
        }
      }
    }
    .buttons-container {
      display: flex;
      position: fixed;
      bottom: 24px;
      right: 24px;
      z-index: 1000;
      gap: 20px;
      
      .submit-button {
        padding: 10px 20px;
        font-size: 14px;
        color: white;
        background-color: var(--green);
        border: none;
        border-radius: var(--btn-border-radius);
        cursor: pointer;
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
        transition: background-color 0.3s;

        &:hover {
          opacity: 0.8;
        }
        &:disabled {
          background-color: var(--gray);
          cursor: not-allowed;
          opacity: 0.6;
        }
      }
    }
  }

  // .bottom-action-panel-fixed {
  //   display: flex;
  //   position: fixed;
  //   gap: 20%;
  //   bottom: 0;
  //   left: 0;
  //   right: 0;
  //   display: flex;
  //   justify-content: center;
  //   background-color: #fff;
  //   padding: 15px 20px;
  //   box-shadow: 0 -2px 10px rgba(0, 0, 0, 0.1);
  //   border-top: 1px solid #eee;
  //   z-index: 100;

  //   .import-button {
  //       padding: 10px 20px;
  //       font-size: 14px;
  //       color: white;
  //       background-color: var(--blue);
  //       border: none;
  //       border-radius: var(--btn-border-radius);
  //       cursor: pointer;
  //       box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
  //       transition: background-color 0.3s;

  //       &:hover {
  //         opacity: 0.8;
  //       }
  //       &:disabled {
  //         background-color: var(--gray);
  //         cursor: not-allowed;
  //         opacity: 0.6;
  //       }
  //     }

  //   .submit-button {
  //       padding: 10px 20px;
  //       font-size: 14px;
  //       color: white;
  //       background-color: var(--green);
  //       border: none;
  //       border-radius: var(--btn-border-radius);
  //       cursor: pointer;
  //       box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
  //       transition: background-color 0.3s;

  //       &:hover {
  //         opacity: 0.8;
  //       }
  //       &:disabled {
  //         background-color: var(--gray);
  //         cursor: not-allowed;
  //         opacity: 0.6;
  //       }
  //     }
  //  }
</style>
