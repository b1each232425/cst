<script>

    let {question} = $props()

    // 这里要加上答案然后换行
    const defaultAnalysis = $state("略")
</script>   

<!--- 这里还要区分不同的提醒-->
<div class="analysis-container">
  <div class="analysis-title">答案:</div>
  <div class="answer-content">
  {#if question.Type == "02" || question.Type == "04" || question.Type == "00"}
  <span>选</span>
    {#each question.Answers as answer, i}
      <span>{answer}</span>
    {/each}
  {:else}
    {#each Array(question.AnswerNum) as _, index}
      <div class="single-answer">
         {#if question.AnswerNum > 1}
            ({index + 1}){@html question.Answers[index].answer}
          {:else}
          {@html question.Answers[index].answer}
         {/if}
      </div>
    {/each}
  {/if}
  </div>
  <div class="analysis-title">解析:</div>
  <div class="analysis-content">
    {#if question.Analysis}
    {@html question.Analysis}
    {:else}
    {@html defaultAnalysis}
    {/if}
  </div>
</div>

<style>
  .analysis-container {
    background-color: #f0f4ff;
    border-radius: 8px;
    padding: 16px 20px;
    margin: 12px 0;
    width: 100%;
    margin-bottom: 40px;
  }
  
  .analysis-title {
    color: #3b82f6;
    font-size: 20px;
    font-weight: 600;
    line-height: 1.4;
  }
  
  .analysis-content {
    color: #3b82f6;
    font-size: 16px;
    line-height: 1.6;
    margin-bottom: 5px;
    font-weight: 600;
  }
  .answer-content{
    color: #3b82f6;
        font-size: 16px;
        font-weight: 600;
    line-height: 1.6;
    margin-bottom: 12px;
  }
  
  /* 响应式设计 */
  @media (max-width: 480px) {
    .analysis-container {
      padding: 12px 16px;
    }
    
    .analysis-title {
      font-size: 15px;
      margin-bottom: 10px;
    }
    
    .analysis-content {
      font-size: 13px;
    }
  }
</style>