<script>
  // @ts-nocheck
  import QuestionList from "$lib/component/PaparAnalysis/QuestionList.svelte";
  import DropdownGray from "$lib/component/DropdownGray.svelte";
  import { getContext, onMount } from "svelte";
  const examContext = getContext("exam");
  const examData = examContext.examData;

  // 数据结构
  /**
   * @typedef ResponseData
   * @property {number} status - 状态码
   * @property {string} msg - 提示消息
   * @property {ResponseExamData} data - 返回的主数据体
   */

  /**
   * @typedef {Object} ResponseExamData
   * @property {number} exam_paper_id - 当前试卷ID
   * @property {number} exam_session_id - 当前考试场次ID
   * @property {ResponseSubjectAverageScore} subjective_scores - 每道主观题的平均分数
   * @property {ResponseQuestion[]} questions - 试卷中的所有题目
   * @property {ResponseQuestionAnswerStats} question_answers_stats - 每道选择题的选项答题人数统计
   *  @property {QuestionGroup[]} question_groups - 题目分组数组
   */

  /**
   * @typedef {Object} QuestionGroup
   * @property {number} id - 题目分组的唯一标识符
   * @property {string} name - 分组名称，通常包括题型、题数和总分说明
   */

  /**
   * @typedef {Object} ResponseSubjectAverageScore
   * @property {Object<string, number>} question_id - 每道主观题的平均分数
   * @example
   * {
   *   "1": 4.5,
   *   "2": 3
   * }
   */

  /**
   * @typedef {Object} ResponseQuestionAnswerStats
   * @property {Object<string, { [option: string]: number }>} question_id - 每道选择题的统计数据
   * @example
   * {
   *   "1": {
   *     "A": 12, --答案：选择人数
   *     "B": 8
   *   },
   *   "2": {
   *     "C": 5,
   *     "D": 10
   *   }
   * }
   */

  /**
   * @typedef {Object} ResponseQuestion
   * @property {number} ID - 题目ID
   * @property {number} ExamPaperID - 所属试卷ID
   * @property {number} Score - 分值
   * @property {string} Type - 题型，如单选、多选、判断等
   * @property {string} Content - 题目内容
   * @property {ParsedOption[]} Options - 选项列表
   * @property {AnswerObject[]} Answers - 正确答案列表
   * @property {string} Analysis - 答案解析
   * @property {number} Order - 题目在试卷中的顺序
   * @property {number} GroupID - 所属题组ID
   */

  /**
   * @typedef {Object} AnswerObject
   * @property {number} index
   * @property {number} score
   * @property {string} answer
   * @property {string} grading_rule
   * @property {string|null} alternative_answer
   */

  //更符合使用的数据格式
  /**
   * @typedef {Object} ParsedOption
   * @property {string} label - 选项标签（如 A、B）
   * @property {string} text - 选项内容
   * @property {number} selectionRate - 被选择的百分比
   */

  /**
   * @typedef {Object} ParsedQuestion
   * @property {number} id - 题目 ID
   * @property {string} type - 题目类型（如 "00" 单选，"08" 简答等）
   * @property {string} content - 题干 HTML
   * @property {ParsedOption[]=} options - 选项（仅客观题有）
   * @property {string[] | string} answer - 正确答案
   * @property {number} index - 题目顺序
   * @property {number} score - 分值
   * @property {number=} averageScore - 平均得分（仅主观题）
   * @property {number} groupId - 所属题组 ID
   */

  /**
   * @typedef {Object} option
   * @property {string} value - 下拉选项的值(考场ID)
   * @property {string} label - 下拉选项的显示文本(试卷名称)
   */

  /**
   * @type {ParsedQuestion[]}
   */
  let questions = $state([]);

  /**
   * @type {QuestionGroup[]}
   */
  let questionGroup = $state([]);

  let isLoaded = $state(false);
  /**
   * @type {boolean}
   * 是否折叠面板状态
   */
  let isfolded = $state(false);

  /**
   * @type {string}
   * @description 当前选中的试卷ID
   */
  let currentPaperId = $state("");

  /**
   * @type {option[]}
   */
  let options = $state([]);

  /*
   * 切换折叠状态
   * @returns {void}
   */
  function toggleFold() {
    isfolded = !isfolded;
  }

  /**
   * 将后端返回的原始题目数据转换为前端所需格式
   * @param {ResponseQuestion[]} rawQuestions
   * @param {ResponseQuestionAnswerStats} answerStats
   * @param {ResponseSubjectAverageScore} subjectiveAvgScores
   * @returns {ParsedQuestion[]}
   */
  function transformQuestions(rawQuestions, answerStats, subjectiveAvgScores) {
    return rawQuestions.map((q) => {
      const isObjective = q.Type === "00" || q.Type === "02" || q.Type === "04";
      const stat = answerStats[String(q.ID)] || {};
      const avgScore = subjectiveAvgScores[String(q.ID)];

      /** @type {ParsedOption[]|undefined} */
      let options = undefined;

      if (isObjective && Array.isArray(q.Options)) {
        const total = Object.values(stat).reduce((sum, val) => sum + val, 0);

        options = q.Options.map((opt) => {
          const label = opt.label;
          const count = stat[label] || 0;
          const rate =
            total > 0 ? parseFloat(((count / total) * 100).toFixed(1)) : 0;

          return {
            label,
            text: opt.value,
            selectionRate: rate,
          };
        });
      }

      return {
        id: q.ID,
        type: q.Type,
        content: q.Content,
        options: options,
        answer: (() => {
          if (isObjective) {
            return Array.isArray(q.Answers) ? q.Answers : [];
          } else {
            const list = Array.isArray(q.Answers)
              ? q.Answers.map((a) => a.answer)
              : [];
            return list;
          }
        })(),
        index: q.Order,
        score: q.Score,
        averageScore: isObjective ? undefined : avgScore || 0,
        groupId: q.GroupID,
      };
    });
  }

  async function fetchAnalysisDataBySessionId(sessionId) {
    isLoaded = false;
    try {
      const response = await fetch(
        `/api/teacher/exam-analysis?examSessionID=${sessionId}`,
        {
          method: "GET",
          credentials: "include",
        },
      );

      /**
       * @type {ResponseData}
       */
      const resp_data = await response.json();
      if (resp_data.status < 0) {
        throw new Error(resp_data.msg);
      }
      questions = transformQuestions(
        resp_data.data.questions,
        resp_data.data.question_answers_stats,
        resp_data.data.subjective_scores,
      );
      console.log("获取考试数据成功:", questions);
      questionGroup = resp_data.data.question_groups;
      isLoaded = true; // 加载完毕
    } catch (error) {
      console.error("获取考试数据失败:", error);
    }
  }

  function examDataToOptions() {
    return examData.papers.map((session) => ({
      value: session.id,
      label: session.name,
    }));
  }

  function updateData() {
    if (currentPaperId) {
      const selectedSession = examData.papers.find(
        (session) => session.id === currentPaperId,
      );

      if (selectedSession) {
        fetchAnalysisDataBySessionId(selectedSession.id);
      } else {
        fetchAnalysisDataBySessionId(examData.papers[0].id);
      }
    }
  }
  onMount(async () => {
    options = examDataToOptions();
    currentPaperId = options.length > 0 ? options[0].value : "";
    await fetchAnalysisDataBySessionId(currentPaperId);
  });
</script>

<div class="analysis-card">
  <div class="card-header">
    <button class="card-title-button" onclick={toggleFold}>
      {#if isfolded}
        <img src="/sidebar/nav_icon/unfold.svg" alt="收起" />
      {:else}
        <img src="/sidebar/nav_icon/fold.svg" alt="展开" />
      {/if}
      <div class="title">试卷分析</div>
    </button>
  </div>
  {#if examData.papers.length > 1}
    <div class="dropdown">
      <DropdownGray
        {options}
        selected={currentPaperId}
        selectOptionFunc={(value) => {
          currentPaperId = value;
          updateData();
        }}
        placeholder="选择试卷"
      />
    </div>
  {/if}
  {#if !isfolded && isLoaded}
    <div class="analysis-content">
      <QuestionList {questionGroup} {questions} />
    </div>
  {/if}
  {#if !isLoaded}
    <div class="loading-indicator">
      <div class="spinner"></div>
      <span>正在加载，请稍候...</span>
    </div>
  {/if}
</div>

<style lang="scss" scoped>
  .analysis-card {
    width: 100%;
    height: 100%;
    margin-bottom: 40px;

    .card-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 40px;
      padding-bottom: 10px;
      border-bottom: 2px solid #f0f0f0;

      .card-title-button {
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 10px;
        cursor: pointer;
        background: none;
        border: none;

        img {
          width: 32px;
          height: 32px;
        }
        .title {
          font-size: 22px;
          font-weight: bold;
        }
      }
    }

    .dropdown {
      margin-bottom: 40px;
      margin-left: 40px;
      width: 400px;
    }

    .analysis-content {
      margin-top: 30px;
      margin-left: 50px;
    }

    .loading-indicator {
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 20px;
      flex-direction: column;
      color: var(--gray);

      .spinner {
        width: 40px;
        height: 40px;
        border: 4px solid #ccc;
        border-top-color: var(--blue);
        border-radius: 50%;
        animation: spin 0.8s linear infinite;
        margin-bottom: 10px;
      }

      @keyframes spin {
        to {
          transform: rotate(360deg);
        }
      }
    }
  }
</style>
