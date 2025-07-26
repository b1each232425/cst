<script>
  import { goto } from "$app/navigation";

  const gotoBank = () => {
    goto("/teacher/question-bank-management/theory/11");
  };
</script>

<div>
  <h1>理论题库管理</h1>
  <p>这是理论题库的内容。</p>
  <button onclick={() => gotoBank()}>跳转至题目管理页面</button>
</div>
