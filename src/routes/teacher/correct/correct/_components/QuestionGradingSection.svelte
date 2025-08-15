<!--
 * @Author: 林炜佳 wj2144632819@qq.com
 * @Date: 2025-08-06 16:00:00
 * @LastEditors: 林炜佳 wj2144632819@qq.com
 * @LastEditTime: 2025-08-07 00:18:07
 * @FilePath: \exam\src\routes\teacher\correct\correct\_components\QuestionGradingSection.svelte
 * @Description: 教师端试卷批改页面题组题目组件
 * @Copyright (c) 2025 by 广州近邻信息有限公司, All Rights Reserved. 
-->

<script>
  import { createEventDispatcher } from 'svelte';
  import Score from '../../../../student/answer/_component/QuestionCheck/score.svelte';
  // TODO 属性检查，比如批改，是否真的存在

  // 做到，本地保存批改的分数的同时（修改外部的old_mark_result，这样逐题模式和全卷模式的分数不一致问题就可以解决），发送更新批改的请求即可；下一次接收响应就能获取新的分数

  // 一道题目的输入框全部输入，失焦后自动保存（把数据传出去，外部保存）

  // 题型映射
  const QUESTION_TYPE_MAP = {
    '00': '单选题',
    '02': '多选题',
    '04': '判断题',
    '06': '填空题',
    '08': '简答题',
    '10': '编程题',
  };

  let { question, student, answer_object, old_mark_result } = $props();

  const dispatch = createEventDispatcher();

  // index --> score
  // 一次性计算映射
  let index_score_map = $derived(
    old_mark_result.reduce((acc, cur) => {
      acc[cur.Index] = cur.Score;
      return acc;
    }, {}),
  );

  // 保证显示的值正确
  function checkScore(event, answer_score) {
    // console.log(event.target.value);
    let val = Number(event.target.value);

    if (val > answer_score) event.target.value = answer_score;
    else if (val < 0) event.target.value = '';
  }

  // 注意，一个空没有批改，就算做"未批改"
  // 以一道题目为单位
  // input 失去焦点时，检查该题所有的 input 是否都有 value
  // 所以必须记录一道题目所有的 input 的值（index_score_map）
  function handleScoreChange(event, index, answer_length) {
    const score_str = event.target.value;
    if (score_str === '') {
      delete index_score_map[index]; // 删除对应的记录

      // 特殊情况：
      // 一道题目已经有旧的批改记录，但是此时把一个分数删除了，那么这道题目就是未批改
      // 虽然不会保存这个批改，但是要显示未批改的状态
      // 此时需要暴露一个事件，让外部知道这道题目是未批改的，在右侧总览中显示“未批改”
      // dispatch('handleNoMark', question.ID);

      return;
    }

    console.log(answer_length);

    index_score_map[index] = Number(score_str);

    // 所有的空都批改了分数，那么就会保存（就说，只会出现一次“未批阅”）
    if (answer_length === Object.keys(index_score_map).length) {
      const new_mark_result = [];

      for (const key in index_score_map) {
        new_mark_result.push({ Index: Number(key), Score: Number(index_score_map[key]) });
      }

      const total_score = new_mark_result.reduce((acc, cur) => acc + cur.Score, 0);

      dispatch('saveMark', {
        question_id: question.ID,
        new_mark_result,
        total_score,
      });
    }
  }
</script>

<section id="question-{question.ID}">
  <!-- 题干 -->
  <div class="question-stem">
    <div class="question-basic">
      <span>{question.Order}.</span>
      <span>{QUESTION_TYPE_MAP[question.Type]}</span>
      <span>({question.Score}分)</span>
    </div>
    <div>{@html question.Content}</div>
  </div>

  <!-- 学生的答案 -->
  <div class="student-answer">
    <div>学生作答：</div>
    <div class="answers">
      {#each answer_object.answer as answer, index}
        <div class="answer-item">
          {answer_object.answer.length !== 1 ? `(${index + 1})` : ''} <span class="answer-content">{@html answer}</span>
        </div>
      {/each}
    </div>
  </div>

  <div class="correction">
    <!-- 批改的分数 -->
    <div class="scores">
      <span>得分：</span>
      {#each question.Answers as answer}
        <div class="score-item">
          {question.Answers.length !== 1 ? `(${answer.index})` : ''}
          <input
            type="number"
            placeholder="输入得分"
            value={index_score_map[answer.index]}
            oninput={(e) => checkScore(e, answer.score)}
            onchange={(e) => handleScoreChange(e, answer.index, question.Answers.length)}
          />({answer.score}分)
        </div>
      {/each}
    </div>

    <!-- 折叠页面 -->
    <div class="details">
      {#if old_mark_result.length !== 0}
        <details open>
          <summary>【解析】</summary>
          {#each old_mark_result as mark}
            <p>
              {old_mark_result.length !== 1 ? `(${mark.Index})` : ''} <span class="details-text"> {mark.Analyze}</span>
            </p>
          {/each}
        </details>
      {/if}
      <details open>
        <summary>【批改规则/提示词】</summary>
        {#each question.Answers as answer}
          <p>
            {question.Answers.length !== 1 ? `(${answer.index})` : ''}
            <span class="details-text"
              >{answer.answer} {answer.alternative_answer ? ' / ' + answer.alternative_answer : ''}</span
            >
          </p>
        {/each}
      </details>
      <details open>
        <summary>【答案】</summary>
        {#each question.Answers as answer}
          <p>
            {question.Answers.length !== 1 ? `(${answer.index})` : ''}
            <span class="details-text">{answer.grading_rule}</span>
          </p>
        {/each}
      </details>
    </div>
  </div>
</section>

<style lang="scss">
  @mixin flex-column {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }

  section {
    display: flex;
    flex-direction: column;
    gap: 1rem;
    margin: 0.5rem 0;
    padding: 1rem;

    .question-stem {
      display: flex;
      align-items: start;
      flex-direction: column;
      flex-wrap: wrap;
      gap: 0.5rem;

      .question-basic {
        display: flex;
        justify-content: center;
        gap: 0.5rem;
      }
    }

    .student-answer,
    .correction {
      background-color: rgb(247, 248, 251);
      padding: 0.5rem 1rem;
      display: flex;
      flex-direction: column;
    }

    .student-answer {
      @include flex-column;

      .answers {
        @include flex-column;

        .answer-item {
          padding-left: 1rem;

          .answer-content {
            color: #3399ff;
          }
        }
      }
    }

    .correction {
      .scores,
      details {
        padding: 0.5rem;
      }

      details {
        .details-text {
          color: #5c4b3b;
        }
      }

      .scores {
        display: flex;
        justify-content: left;
        align-items: center;
        border-bottom: 1px lightgray dashed;
        gap: 1rem;
        flex-wrap: wrap;

        .score-item {
          display: flex;
          align-items: center;
          gap: 0.5rem;

          input {
            width: 4.5rem;
            height: 2rem;
            border: 1px solid #ccc;
            font-size: 1rem;
            border-radius: 5px;
            text-align: center;
            line-height: 2rem;

            &:focus {
              outline: none;
            }

            /* 针对 Chrome / Edge / Safari ，去掉上下调节的功能*/
            &::-webkit-inner-spin-button,
            &::-webkit-outer-spin-button {
              -webkit-appearance: none;
              margin: 0;
            }
          }
        }
      }

      .details {
        summary {
          cursor: pointer;
          border-radius: 3px;

          &:hover {
            background-color: rgb(230, 233, 240);
          }
        }

        p {
          padding-left: 1rem;
        }
      }
    }
  }
</style>
