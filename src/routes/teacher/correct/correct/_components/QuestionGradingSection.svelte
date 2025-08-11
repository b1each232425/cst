<script>
  let { question } = $props();

  let details_open1 = $state(false);
  let details_open2 = $state(false);
</script>

<section>
  <div class="question-stem">{question.Order}. {@html question.Content}</div>
  <div class="student-answer">
    <div>学生作答：</div>
  </div>
  <div class="correction">
    <div class="scores">
      <span>得分：</span>
      <div></div>
    </div>
    <div class="details">
      <details bind:open={details_open1}>
        <summary>{details_open1 ? '【批改规则/提示词】' : '【参考答案】'}</summary>
        {#each question.Answers as answer, index}
          <p>({index + 1}) {answer.answer}</p>
        {/each}
      </details>
      <details bind:open={details_open2}>
        <summary>{details_open2 ? '【答案】' : '【题目解析】'}</summary>
        {#each question.Answers as answer, index}
          <p>({index + 1}) {answer.grading_rule}</p>
        {/each}
      </details>
    </div>
  </div>
</section>

<style lang="scss">
  section {
    display: flex;
    flex-direction: column;
    gap: 1rem;
    margin: 0.5rem 0;
    padding: 1rem;

    .question-stem {
      display: flex;
      justify-content: left;
      flex-wrap: wrap;
    }

    .student-answer,
    .correction {
      background-color: rgb(247, 248, 251);
      padding: 0.5rem 1rem;
      display: flex;
      flex-direction: column;
    }

    .correction {
      .scores,
      details {
        padding: 0.8rem;
      }

      .scores {
        border-bottom: 1px lightgray dashed;
      }

      .details {
        summary {
          cursor: pointer;
          border-radius: 3px;

          &:hover {
            background-color: rgb(230, 233, 240);
          }
        }
      }
    }
  }
</style>
