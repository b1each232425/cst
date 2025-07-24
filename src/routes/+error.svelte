<script>
  // @ts-nocheck
  import { page } from "$app/state";

  const { status } = page;
</script>

{#if status === 404}
  <div class="not-found">
    <h1>404 - 页面未找到</h1>
    <p>{page.error.message}</p>
    <button
      onclick={() => {
        window.history.back();
      }}>返回上一页</button
    >
  </div>
{/if}

<style scoped>
  .not-found {
    min-width: 320px;
    min-height: 100vh;
    position: fixed;
    left: 0;
    top: 0;
    right: 0;
    bottom: 0;
    padding-bottom: 4rem;
    background: url("/404.svg") no-repeat center center;
    background-size: cover;
    z-index: 9999;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 10px;
    font-family: "Segoe UI", "PingFang SC", "Microsoft YaHei", Arial, sans-serif;
  }
  .not-found h1 {
    font-weight: 800;
    font-size: 38px;
    color: #2d3748;
    letter-spacing: 2px;
  }
  .not-found p {
    font-size: 18px;
    color: #718096;
    margin: 0;
    margin-bottom: 1rem;
  }
  .not-found button {
    display: inline-block;
    padding: 10px 24px;
    background: #4299e1;
    color: #fff;
    border-radius: 6px;
    border: none;
    text-decoration: none;
    font-size: 15px;
    font-weight: 700;
    margin: 0 8px;
    cursor: pointer;
    transition: background 0.2s;
  }
</style>
