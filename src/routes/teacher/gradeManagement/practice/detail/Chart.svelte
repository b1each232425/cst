<script>
  import { onMount, getContext } from "svelte";
  import BarChart from "$lib/component/charts/BarChart.svelte";

  // 获取考试基本信息
  const Context = getContext("practice");
  const practiceData = Context.practiceData;

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
   * @typedef {Object} PracticeDistribution
   * @property {number} practiceId - 练习ID
   * @property {string} practiceName - 练习名称
   * @property {number} totalScore - 总分
   * @property {number} totalStudents - 完成练习人数
   * @property {number[]} gradeDistribution - 成绩分布，每一项代表一个分段的人数
   */

  /**
   * @type {PracticeDistribution}
   */
  let practiceDistribution = $state({
    practiceId: 0,
    practiceName: "",
    totalScore: 0,
    totalStudents: 0,
    gradeDistribution: [],
  });

  /**
   * @description 根据总分划分区间段
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
   * @returns {Promise<PracticeDistribution>}
   */
  async function getExamDistributionData() {
    let url = `
/api/teacher/practice-grade/distribution?practiceID=${practiceData.id}&columnNum=${columnNum}`;

    let response = await fetch(url, {
      method: "GET",
      credentials: "include",
    });
    let response_data = await response.json();

    if (response_data.status < 0) {
      throw new Error(response_data.msg);
    }

    return {
      practiceId: response_data.data.practice_id,
      practiceName: response_data.data.practice_name,
      totalScore: response_data.data.total_score,
      totalStudents: response_data.data.total_students,
      gradeDistribution: response_data.data.grade_distribution,
    };
  }

  onMount(async () => {
    practiceDistribution = await getExamDistributionData();
    series_data = practiceDistribution.gradeDistribution.slice().reverse();
    xAxis_data = getScoreSegments(practiceData.totalScore, columnNum);
  });
</script>

{#if practiceData}
  <div class="chart-container">
    <div class="title">成绩分析</div>
    <div class="chart">
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
    .chart {
      width: 100%;
      height: 80%;
      border: 1px solid #e5e7eb;
    }
  }
</style>
