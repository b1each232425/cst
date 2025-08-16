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
   * @property {string} examTimeText - 多场考试时间汇总字符串
   * @property {number} totalScore - 整场考试总分（可取首场试卷分值）
   * @property {number} averageScore - 加权平均分
   * @property {number} totalExaminees - 应考人数总和
   * @property {number} passExaminees - 及格人数总和
   * @property {boolean} submitted - 是否提交
   * @property {PaperInfo[]} papers - 各试卷详情
   */

  /**
   * @typedef {Object} PaperInfo
   * @property {number} id - 试卷ID(目前是考试场次ID)
   * @property {string} idText - 试卷编号文本，如 "试卷1"
   * @property {string} name - 试卷名称
   * @property {number} actualExaminees - 实考人数
   * @property {number} totalScore - 单张试卷总分
   * @property {number} averageScore - 平均分
   * @property {string} markMode - 批改模式
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
  let isShow = $state(false);

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
      // 格式化考试时间文字，如：试卷1:2025-01-22 09:00-10:00
      return sessions
        .map((session, i) => {
          if (!session.start_time) return `试卷${i + 1}:--`;

          const start = new Date(session.start_time);
          const end = session.end_time ? new Date(session.end_time) : null;

          const startStr = start.toLocaleString('zh-CN', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
          });

          if (end) {
            const endStr = end.toLocaleString('zh-CN', {
              hour: '2-digit',
              minute: '2-digit',
            });
            const [startDay, startTime] = startStr.split(' ');
            return `试卷${i + 1}:${startDay} ${startTime}-${endStr}`;
          }

          return `试卷${i + 1}:${startStr}`;
        })
        .join('  ');
    } catch (error) {
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
    const examTimeText = formatExamTime(sessions);

    // 总应考人数
    const totalExaminees = sessions.reduce((sum, s) => sum + (s.scheduled_examinees || 0), 0);

    const passExaminees = sessions.reduce((sum, s) => sum + (s.pass_examinees || 0), 0);

    // 总分，取每个试卷的分数之和
    const totalScore = sessions.reduce((sum, s) => sum + (s.total_score || 0), 0);

    // 平均分：加权计算
    const totalActual = sessions.reduce((sum, s) => sum + (s.actual_examinees || 0), 0);
    const weightedTotalScore = sessions.reduce((sum, s) => sum + (s.average_score || 0) * (s.actual_examinees || 0), 0);
    const averageScore = totalActual === 0 ? 0 : parseFloat((weightedTotalScore / totalActual).toFixed(1));

    // 试卷详情
    const papers = sessions.map((s, i) => ({
      id: s.exam_session_id,
      idText: `试卷${i + 1}`,
      name: s.paper_name,
      actualExaminees: s.actual_examinees || 0,
      totalScore: s.total_score || 0,
      averageScore: s.average_score || 0,
      markMode: MARK_MODE_MAP[s.mark_mode] || s.mark_mode || '自动批改',
    }));

    return {
      id: raw.id,
      title: raw.name,
      type: EXAM_TYPE_MAP[raw.type] || raw.type || '其他考试',
      examTimeText,
      totalScore: totalScore,
      averageScore,
      totalExaminees,
      passExaminees,
      submitted: raw.submitted || false,
      papers,
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

    isShow = true;
  });
</script>

{#if isShow}
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
          <GradeChart type="exam" resourceId={examId} papers={examData?.papers || []} />
        </section>
      </div>
      <div class="second-row">
        <!-- 学生成绩表格 -->
        <section class="card grade-section">
          <StudentGradeTable type="exam" resourceId={examId} papers={examData?.papers || []} />
        </section>
      </div>

      <div class="third-row">
        <!-- 试卷分析 -->
        <!-- <section class="card analysis-section">
			<AnalysisPanel
				type="exam"
				resourceId={examId}
				papers={examData?.papers || []}
			/>
		</section> -->
      </div>

      <div class="buttons-container">
        <button
          class="submit-button"
          onclick={() => handleExamSubmitted([Number(examId)])}
          disabled={examData?.submitted}
        >
          提交成绩
        </button>
      </div>
    </div>
  </div>
{/if}

<style lang="scss" scoped>
  .page-container {
    position: absolute;
    top: 0px;
    left: -16px;
    right: -16px;
    bottom: -50px; // 覆盖 Footer 的 50px 高度
    z-index: 10; // 高于 Footer
    background-color: var(--bg-primary);
    padding: 16px;
    overflow: hidden;

    .detail-container {
      display: flex;
      flex-direction: column;
      height: 100%;
      width: 100%;
      background-color: var(--bg-primary);
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
</style>
