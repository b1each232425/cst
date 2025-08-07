<script>
  import Option from "../QuestionAnswer/option.svelte";
  let { question } = $props();
  const defaultAnswer = $state("未填")

  function getCompleteAnswer(index) {
    const prefix = question.answer_num > 1 ? `(${index + 1})` : '';
    const studentAnswer = question.student_answers?.answer?.[index];
    const answer = studentAnswer && studentAnswer !== "" ? studentAnswer : defaultAnswer;
    return prefix + answer;
  }
</script>

<div class="layout">
    <!-- 单/多选  这里的多选主要是为了区分这个圆角的大小 判断题 -->
  {#if question.type === "00" || question.type === "02" || question.type === "04"}
    <div class="options">
      {#each question.options as option}
        <label class="option">
          <input
            type="checkbox"
            name="question-{question.id}"
            value={option.label}
            checked={question.student_answers.answer?.includes(option.label)}
            class="hidden-radio"
            disabled
          />
          <!-- 圆形选项 根据类型区分方形还是圆形-->
          <span class="option-id" class:single-yesOrNo={question.type === "00" || question.type === "04"} class:multple={question.type === "02"}>{option.label}</span>
          <!-- 选项内容 -->
          <Option {option} />
        </label>
      {/each}
    </div>
  {:else if question.type === "06" ||question.type === "08"  }
  <div class="analysis-container">
  <div class="system-tips">您的回答</div>
    {#each Array(question.answer_num) as _, index}
  <div class="fill-blank">
    {@html getCompleteAnswer(index)}
  </div>
{/each}
    </div>
  {/if}
</div>


<style scoped lang="scss">
  .layout {
    max-width: 100%;
    width: 100%;
  }
    .option {
    display: flex;
    align-items: center;
    padding: 10px;
    border-radius: 4px;
    transition: background-color 0.2s;


    input {
      margin-right: 10px;
    }
    //选项label样式
    .option-id {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 30px;
      min-width: 30px;
      height: 30px;
      text-align: center;
      
      background-color: white;
      border: 1px solid #797979;
      margin-right: 10px;
      font-size: 16px;
    }
    .single-yesOrNo{
      border-radius: 50%;
    }
    .multple{
      border-radius: 8px;
    }
    /* 选中样式：当 input 被选中时，改变 option-id 的外观 */
    input:checked + .option-id {
      background-color: #e8f3ff;
      border: 1px solid #165dff;
      color: #165dff;
    }


  }
    .analysis-container {
    background-color: #f0f4ff;
    border-radius: 8px;
    padding: 16px 20px;
    margin: 12px 0;
    width: 100%;
    margin-bottom: 40px;
  }

  .hidden-radio {
    display: none;
  }

    .fill-blank {
    display: flex;
    justify-content: flex-start;
    align-items: center;
    width: 100%;
    max-width: 100%;
    margin-bottom: 5px;
  }
  .question-id {
    width: 5%;
    max-width: 5%;
    font-size: 14px;
  }
  .system-tips{
        color: #3b82f6;
    font-size: 20px;
    font-weight: 600;
    margin-bottom: 12px;
    line-height: 1.4;
  }

  
</style>
