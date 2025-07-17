<script>
  // @ts-nocheck
  import { onMount, getContext } from "svelte";
  import BarChart from "$lib/component/charts/BarChart.svelte";
  import DropdownGray from "$lib/component/DropdownGray.svelte";

  // 获取考试基本信息
  const examContext = getContext("exam");
  const examData = examContext.examData;
  const papers = examData.papers;

  let xAxis_data = $state(["0-19", "20-39", "40-59", "60-79", "80-100"]);

  /**
   * @type {number[]}
   */
  let series_data = $state([]);

  /**
   * @description 直方图列数，默认为5列
   * @type {number}
   */
  let columnNum = $state(5);

  /**
   * @typedef {Object} responseData
   * @property {number} status - 响应状态码
   * @property {string} msg - 响应消息
   * @property {ExamDistributionData} data - 实际数据体
   */

  /**
   * @typedef {Object} ExamDistributionData
   * @property {number} exam_id - 考试 ID
   * @property {string} exam_name - 考试名称
   * @property {ExamSessionDistribution[]} grade_distribution - 考试场次的成绩分布列表
   */

  /**
   * @typedef {Object} ExamSessionDistribution
   * @property {string} exam_id - 考试 ID
   * @property {string} exam_session_id - 考试场次 ID
   * @property {string} exam_paper_id - 试卷 ID
   * @property {string} exam_paper_name - 试卷名称
   * @property {number[]} score_distribution - 成绩分布，每一项代表一个分段的人数
   */

  /**
   * @typedef {Object} option
   * @property {string} value - 下拉选项的值(考场ID)
   * @property {string} label - 下拉选项的显示文本(试卷名称)
   */

  /**
   * @type {ExamDistributionData}
   */
  let examDistributionData = $state({
    exam_id: examData.id,
    exam_name: examData.name,
    grade_distribution: [],
  });

  /**
   * @type {option[]}
   */
  let options = $state([]);

  /**
   * @type {string}
   * @description 当前选中的试卷ID
   */
  let currentPaperId = $state("");

  /**
   * @description 根据总分划分区间段（从低到高）
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
   * @description 获取考试成绩分布数据
   * @returns {Promise<void>}
   */
  async function getExamDistributionData() {
    let url = `/api/teacher/exam-grade/distribution?examID=${examData.id}&columnNum=${columnNum}`;

    let response = await fetch(url, {
      method: "GET",
      credentials: "include",
    });

    /**
     * @type {responseData}
     * @description 响应数据
     */
    let response_data = await response.json();

    if (response_data.status < 0) {
      throw new Error(response_data.msg);
    }

    examDistributionData = response_data.data;
  }

  // 将试卷数据转换为下拉选项
  function examDataToOptions() {
    return papers.map((session) => ({
      value: session.id,
      label: session.name,
    }));
  }

  // 更新系列数据
  function updateSeriesData() {
    if (currentPaperId) {
      const selectedPaper = papers.find((paper) => paper.id === currentPaperId);
      const selectedSession = examDistributionData.grade_distribution.find(
        (session) => session.exam_session_id === selectedPaper.id,
      );

      if (selectedSession && selectedPaper) {
        series_data = selectedSession.score_distribution.slice().reverse();
        xAxis_data = getScoreSegments(selectedPaper.totalScore, columnNum);
      } else {
        series_data = [];
        xAxis_data = [];
      }
    } else {
      series_data = [];
      xAxis_data = [];
    }
  }

  onMount(async () => {
    await getExamDistributionData();
    options = examDataToOptions();
    currentPaperId = options.length > 0 ? options[0].value : "";
    updateSeriesData();
  });
</script>

{#if examData}
  <div class="chart-container">
    <div class="title">成绩分析</div>
    {#if examData.papers.length > 1}
      <div class="dropdown">
        <DropdownGray
          {options}
          selected={currentPaperId}
          selectOptionFunc={(value) => {
            currentPaperId = value;
            updateSeriesData();
          }}
          placeholder="选择试卷"
        />
      </div>
    {/if}
    <div class="chart {examData.papers.length > 1 ? 'small' : ''}">
      <BarChart {xAxis_data} {series_data} />
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
    }
  }
</style>
