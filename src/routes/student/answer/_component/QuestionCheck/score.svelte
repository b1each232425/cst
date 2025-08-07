<script>
  let { question } = $props();
  import "@3min/cst-tiptap/dist/style.css";

  import Feedback from "./feedback.svelte";
  import Analysis from "./analysis.svelte";

  // 还得区分是什么题目，一种是选择判断 另外是另一种
</script>

<Feedback {question} />
<Analysis {question} />

<style scoped lang="scss">
  .score-container {
    width: 100%;
    border-radius: 10px;
    display: flex;
    flex-direction: column;
  }
  .right {
    background-color: #e8ffea;
  }
  .halfRight {
    background-color: #ffe8abfe;
  }
  .wrong {
    background-color: #f8d2d8;
  }
</style>
