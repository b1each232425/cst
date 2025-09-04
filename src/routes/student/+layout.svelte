<!--
 * @Author: 林炜佳 wj2144632819@qq.com
 * @Date: 2025-07-23 9:00:00
 * @LastEditors: 林炜佳 wj2144632819@qq.com
 * @LastEditTime: 2025-08-06 14:18:07
 * @FilePath: \exam-fe\src\routes\student\+layout.svelte
 * @Description: 学生端 layout
 * @Copyright (c) 2025 by 广州近邻信息有限公司, All Rights Reserved.
-->

<script>
  import { page } from '$app/state';
  import { goto } from '$app/navigation';
  import Brand from '$lib/components/Brand/Brand.svelte';
  import { toast } from '$lib/components/Toast/Toast.js';
  import MessageBox from '$lib/components/MessageBox/MessageBox.js';

  const PRACTICE_PATH = '/student/practice';
  const EXAM_PATH = '/student/exam';
  const ENROLL_PLAN_PATH = '/student/enroll-plan';

  let { children } = $props();

  function gotoPractice() {
    goto(PRACTICE_PATH);
  }

  function gotoExam() {
    goto(EXAM_PATH);
  }

  function gotoEnrollPlan() {
    goto(ENROLL_PLAN_PATH);
  }

  function logout() {
    fetch(`/api/user/logout`, {
      method: 'POST',
    })
      .then((res) => {
        if (!res.ok)
          return res.text().then((error_text) => {
            throw new Error(`请求失败：${res.status} ${res.statusText}` + (error_text ? '-' + error_text : ''));
          });
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
      content: '你确定要退出登录吗？',
      onConfirm: () => logout(),
    });
  }
</script>

{#snippet logo()}
  <div
    class="logo"
    style="
        display: flex;
        font-family: 'ComicSansMS-Bold', 'Comic Sans MS Bold', 'Comic Sans MS', sans-serif;
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
    <button class:selected={page.url.pathname === PRACTICE_PATH} onclick={gotoPractice}> 练习 </button>
    <button class:selected={page.url.pathname === EXAM_PATH} onclick={gotoExam}>考试</button>
    <button class:selected={page.url.pathname === ENROLL_PLAN_PATH} onclick={gotoEnrollPlan}>报名计划</button>
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
        width: 6rem;
        margin-top: 1rem;
        padding-bottom: 0.5rem;

        &.selected {
          color: var(--blue);
          border-bottom: 2px solid var(--blue);
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
