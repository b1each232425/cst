<script>
  // 传入问题本身，还有总索引
  let { question, index } = $props();
  import Answer from "./answer.svelte";
  import "@3min/cst-tiptap/dist/style.css";
</script>


<div class="quesions-container">
    <!---题目题干 -->
  <div class="question-content">
    {#if index !== null && index !== undefined}
      <h2>{index + 1}.</h2>
      {#if question.Score !== undefined}
         <span class="question-score-inline">（{question.Score}分）</span>
       {/if}
    {/if}
    <div class="piptap-content" style="width: 80%;">
      {@html question.Content}
    </div>


  </div>
  <!---题目内容 也就是学生作答地方 -->
  <Answer {question} />
</div>


<style scoped lang="scss">
      .quesions-container {
    background-color: #fff;
    border-radius: 8px;
    margin-bottom: 25px;
    width: 100%;
    min-width: 100%;
    max-width: 100%;
  }
  .question-score-inline {
      color: #ff7e08;
      font-weight: bold;
      font-size: 15px;
    }
  //内容容器
  .question-content {
    display: flex;
    padding-bottom: 10px;

    h2 {
      font-weight: 500;
      margin-right: 10px;
      font-size: 16px;
    }
  }
    .quesion-answer {
    max-width: 100%;
    width: 100%;
  }
</style>
