<!-- /*
 * @Author:cpf chenlucas1370@gmail.com
 * @Date: 2025-06-13 22:00:00
 * @LastEditors: cpf chenlucas1370@gmail.com
 * @LastEditTime: 2025-06-13 22:00:00
 * @FilePath: /tutorial-platform-fe/src/lib/component/PaparAnalysis/ObjetctiveQuestion.svelte
 * @Description: 题目列表分析展示组件
 */ -->

<script>
  import Question from "./Question.svelte";
  import { onMount } from "svelte";
  import "@3min/cst-tiptap/dist/style.css";

  /**
   * @typedef {Object} QuestionGroup
   * @property {string} name - 分组标题，例如 "一、单选题"
   * @property {number} id - 分组 ID
   * @property {Question[]} questions - 本组题目列表
   */

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

  let { questionGroup, questions } = $props();

  /**
   * @type {QuestionGroup[]}
   * @description 当前题目分组列表
   */
  let currentQuestionGroup = $state([]);

  onMount(() => {
    // 将题目按照index进行排序
    questions.sort((a, b) => a.index - b.index);
    // 初始化题目分组
    if (Array.isArray(questionGroup) && questionGroup.length > 0) {
      currentQuestionGroup = questionGroup.map(({ id, name }) => {
        return {
          id,
          name,
          questions: questions.filter(
            (/** @type {Question} */ q) => q.groupId === id
          ),
        };
      });
    } else {
      currentQuestionGroup = [];
    }
  });
</script>

{#each currentQuestionGroup as group}
  <h2>{group.name}</h2>
  {#each group.questions as question}
    <Question {question} />
  {/each}
{/each}
