<script>
  import { page } from '$app/state';
  import { goto } from '$app/navigation';
  import Brand from '$lib/components/Brand/Brand.svelte';
  import { toast } from '$lib/components/Toast/Toast.js';
  import MessageBox from '$lib/components/MessageBox/MessageBox.js';

  const practicePath = '/student/practice';
  const examPath = '/student/exam';

  let { children } = $props();

  function gotoPractice() {
    goto(practicePath);
  }

  function gotoExam() {
    goto(examPath);
  }

  function logout() {
    fetch(`/api/logout`)
      .then((res) => {
        if (!res.ok) throw new Error('网络错误');
        return res.json();
      })
      .then((res) => {
        if (!res.status) {
          toast.success('登出成功');
          goto('/login');
        } else throw new Error(res.msg ?? '登出失败');
      })
      .catch((err) => {
        toast.error(err.message);
      });
  }

  function handleLogout() {
    MessageBox({
      title: '确认操作',
      content: '你确定要执行这个操作吗？',
      onConfirm: () => logout(),
    });
  }
</script>

{#snippet logo()}
  <div
    class="logo"
    style="
        display: flex;
        font-family: 'Comic Sans MS';
        font-weight: 700;
        font-size: 2.5rem;
        color: #0336ff;
        justify-content: center;
        align-items: center;
    "
  >
    <span>3min</span>
  </div>
{/snippet}

<div class="header">
  <div class="logo-nav">
    {@render logo()}
    <button class:selected={page.url.pathname === practicePath} onclick={gotoPractice}> 练习 </button>
    <button class:selected={page.url.pathname === examPath} onclick={gotoExam}>考试</button>
  </div>
  <button class="logout" onclick={handleLogout}>退出登录</button>
</div>

<div class="student-layout">{@render children()}</div>

<footer>广州近邻信息有限公司 Copyright © 2024-2034 w2w.me. All Rights Reserved.</footer>

<style lang="scss">
  .header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    flex-wrap: wrap;
    padding: 0 0.5rem;

    .logo-nav {
      display: flex;
      align-items: center;
      gap: 2rem;
      flex-wrap: wrap;

      button {
        font-size: 1.2rem;
        width: 5rem;
        margin-top: 1rem;
        padding-bottom: 0.5rem;

        &.selected {
          border-bottom: 2px solid blue;
        }
      }
    }

    .logout {
      font-size: large;
    }

    button {
      cursor: pointer;
      border: 0;
      background-color: white;
      box-sizing: border-box;

      &:hover {
        font-weight: bold;
      }
    }
  }

  .student-layout {
    display: flex;
    flex-direction: column;
    gap: 2rem;
    width: 85%;
    margin: 0 auto;
    padding: 2rem 0;
  }

  footer {
    display: flex;
    justify-content: center;
    align-items: center;
    background-color: #f5f5f5;
    height: 3rem;
    width: 100vw;
    position: fixed;
    bottom: 0;
  }
</style>
