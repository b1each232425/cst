<!-- /*
 * @Author:cpf chenlucas1370@gmail.com
 * @Date: 2025-06-13 22:00:00
 * @LastEditors: cpf chenlucas1370@gmail.com
 * @LastEditTime: 2025-06-13 22:00:00
 * @FilePath: /tutorial-platform-fe/src/lib/component/PaparAnalysis/ObjetctiveQuestion.svelte
 * @Description: 单一题目分析展示组件
 */ -->

<script>
  import { onMount, onDestroy } from "svelte";
  import * as echarts from "echarts/core";
  import { init, use } from "echarts/core";
  import { BarChart } from "echarts/charts";
  import { GridComponent, TitleComponent } from "echarts/components";
  import { CanvasRenderer } from "echarts/renderers";
  import "@3min/cst-tiptap/dist/style.css";

  /**
   * @typedef {Object} Option
   * @property {string} label - 选项标识，例如 "A"、"B"、"C"、"D"
   * @property {string} text - 选项内容
   * @property {number} selectionRate - 被选择的比例百分比（例如 39 表示 39%）
   */

  /**
   * @typedef {Object} Question
   * @property {number} id - 题目 ID
   * @property {string} type - 题目类型编号
   *   - "00" = 单选题
   *   - "02" = 多选题
   *   - "04" = 判断题
   *   - "06" = 填空题
   *   - "08" = 简答题
   * @property {string} content - 题干内容，通常是 HTML 字符串
   * @property {Option[]} [options] - 题目选项内容（选择题、判断题使用）
   * @property {string|string[]} [answer] - 正确答案
   *   - 选择题/判断题/填空题: string[] 例如 ["A", "B"] 或 ["let", "const"]
   *   - 简答题: string 参考答案
   * @property {number} [index] - 题目在试卷中的索引位置
   * @property {number} [score] - 题目总分（填空题、简答题使用）
   * @property {number} [averageScore] - 平均得分（填空题、简答题使用）
   * @property {number} [groupId] - 题目所属题组 ID
   */

  // 接收传入题目
  let { question } = $props();
  // 确保 question 是一个对象
  if (typeof question !== "object" || question === null) {
    question = {};
  }

  // 柱状图内容配置
  use([BarChart, GridComponent, TitleComponent, CanvasRenderer]);

  /**
   * @type {echarts.ECharts | null}
   */
  let chartInstance = null;

  /** @type {HTMLDivElement | null} */
  let chartDom = null;

  // 图表数据
  let chartData = [
    { name: "A", value: 79, color: "#6699ff" },
    { name: "B", value: 23, color: "#999999" },
    { name: "C", value: 68, color: "#6699ff" },
    { name: "D", value: 32, color: "#999999" },
  ];

  $effect(() => {
    if (
      question.options &&
      Array.isArray(question.options) &&
      (question.type === "00" ||
        question.type === "02" ||
        question.type === "04")
    ) {
      chartData = question.options.map((opt) => ({
        name: opt.label,
        value: opt.selectionRate,
        color: question.answer.includes(opt.label) ? "#6699ff" : "#999999",
      }));

      // 更新 options 的 Y 轴标签和 series 数据
      options.yAxis.data = chartData.map((item) => item.name);
      options.series[0].data = chartData.map((item) => ({
        value: item.value,
        itemStyle: {
          color: item.color,
          borderRadius: [0, 3, 3, 0],
        },
      }));
    }
  });

  // ECharts配置选项
  const options = {
    // 网格配置 - 控制图表区域位置
    grid: {
      left: "10%", // 左边距，给Y轴标签留空间
      right: "15%", // 右边距，给数值标签留空间
      top: "10%", // 上边距
      bottom: "10%", // 下边距
    },

    // X轴配置（横轴，显示数值）
    xAxis: {
      type: "value",
      max: 100, // 最大值设为100（百分比）
      axisLine: { show: false }, // 隐藏轴线
      axisTick: { show: false }, // 隐藏刻度线
      axisLabel: { show: false }, // 隐藏轴标签
      splitLine: { show: false }, // 隐藏网格线
    },

    // Y轴配置（纵轴，显示类别）
    yAxis: {
      type: "category",
      data: chartData.map((item) => item.name),
      inverse: true, // 反转Y轴顺序，使得第一项在顶部
      axisLine: { show: false }, // 隐藏轴线
      axisTick: { show: false }, // 隐藏刻度线
      axisLabel: {
        fontSize: 14,
        color: "#666",
        margin: 15, // 标签与轴的距离
      },
    },

    // 系列数据配置
    series: [
      {
        type: "bar",
        data: chartData.map((item) => ({
          value: item.value,
          itemStyle: {
            color: item.color,
            borderRadius: [0, 3, 3, 0],
          },
        })),
        barWidth: "50%",

        // 数据标签配置
        label: {
          show: true,
          position: "right", // 标签位置在柱子右侧
          formatter: "{c}%", // 显示格式：数值%
          fontSize: 14,
          color: "#666",
          offset: [8, 0], // 标签偏移量
        },
      },
    ],
  };
  onMount(() => {
    chartInstance = echarts.init(chartDom);
    chartInstance.setOption(options);
    // 延迟执行 resize，确保容器已完全渲染
    setTimeout(() => {
      chartInstance?.resize();
    }, 100);
  });

  onDestroy(() => {
    chartInstance?.dispose();
  });

  $effect(() => {
    if (chartInstance && chartDom) {
      // 当数据更新时，也调用 resize
      chartInstance.resize();
    }
  });
</script>

<div class="question">
  <div class="question-content">
    {#if question.index !== null && question.index !== undefined}
      <div class="question-index">{question.index}.</div>
    {/if}
    <div class="piptap-content" style="display: flex; flex-wrap: wrap;">
      <div style="flex: 0 1 auto;">
        {@html question.content}
      </div>
      <span class="question-score">【{question.score}分】</span>
    </div>
  </div>
  {#if question.type === "00" || question.type === "02" || question.type === "04"}
    <div class="objective-question-options">
      {#each question.options as option}
        <div class="option-item">
          <span
            class="option-label {question.answer.includes(option.label)
              ? 'correct'
              : ''}"
          >
            {option.label}</span
          >
          <span class="option-text">{@html option.text}</span>
        </div>
      {/each}
    </div>
    <div class="objective-question-analysis">
      <div class="label">【选取率】</div>
      <div class="chart">
        <div class="chart-container" bind:this={chartDom}></div>
      </div>
    </div>
  {:else if question.type === "06" || question.type === "08"}
    <div class="subjective-question">
      {#if question.type === "06"}
        <div class="subjective-question-analysis">
          <div class="label">【参考答案】</div>
          {#each question.answer as answer, index}
            <div class="option-text1">
              {String.fromCharCode(9312 + index)}
              {answer}
            </div>
          {/each}
        </div>
      {:else if question.type === "08"}
        <div class="subjective-question-analysis">
          <div class="label">【参考答案】</div>
          <div class="option-text2">{question.answer}</div>
        </div>
      {/if}
      <div class="subjective-question-analysis">
        <div class="label">【平均得分】</div>
        <div class="option-text2">
          {question.averageScore}
        </div>
      </div>
    </div>
  {/if}
</div>

<style lang="scss" scoped>
  .question {
    background-color: #fff;
    border-radius: 8px;
    margin-bottom: 25px;
    width: 100%;
    min-width: 100%;
    max-width: 100%;

    .question-content {
      display: flex;
      align-items: flex-start;
      padding-bottom: 10px;
      margin-bottom: 20px;

      .question-index {
        font-size: 16px;
        display: flex;
        align-items: flex-start;
        margin-right: 10px;
      }
    }

    .objective-question-options {
      margin-bottom: 40px;
      .option-item {
        display: flex;
        align-items: center;
        margin-bottom: 20px;
        margin-left: 1rem;

        .option-label {
          width: 32px;
          height: 32px;
          border: 1px solid #999;
          border-radius: 50%;
          text-align: center;
          line-height: 32px;
          font-weight: bold;
          margin-right: 30px;
          background-color: transparent;
          color: #333;
          &.correct {
            background-color: #28a745;
            color: white;
          }
        }

        .option-text {
          flex: 1;
          font-size: 18px;
          color: #333;
        }
      }
    }

    .objective-question-analysis {
      display: flex;
      align-items: flex-start;

      .label {
        font-weight: bold;
        margin-top: 1.5rem;
        font-size: 18px;
        color: #6699ff;
        flex-shrink: 0;
      }

      .chart {
        width: 500px;
        height: 200px;
        .chart-container {
          width: 100%;
          height: 100%;
        }
      }
    }

    .subjective-question {
      display: flex;
      flex-direction: column;
      gap: 2rem;
      .subjective-question-analysis {
        display: flex;
        align-items: flex-start;
        gap: 2rem;

        .label {
          font-weight: bold;
          font-size: 18px;
          color: #6699ff;
          flex-shrink: 0;
        }

        .option-text1 {
          font-size: 18px;
          color: #333;
        }

        .option-text2 {
          width: 80%;
          font-size: 18px;
          color: #333;
        }
      }
    }
  }
</style>
