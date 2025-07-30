<!--
/**
 * Toast 提示组件
 * 
 * 作者：段春茂
 * 邮箱：2162105974@qq.com
 * 
 * 参数说明：
 * @param {string} type        提示类型，可选 'success' | 'error' | 'warning'，默认 'success'
 * @param {string} message     提示文本内容
 * @param {number} duration    自动关闭时间，单位毫秒，默认 3000ms
 * @param {boolean} showClose  是否显示关闭按钮，默认 true
 * @param {boolean} plain      是否为朴素风格（无背景色），默认 true
 * 
 * 功能说明：
 * - 根据 type 显示不同的图标和背景色
 * - duration 时间后自动关闭
 * - 点击关闭按钮手动关闭，带淡出动画效果
 * 
 * 使用示例：
 * <Toast type="error" message="操作失败" duration={4000} showClose={false} plain={false} />
 */
-->
<script>
  import { onMount } from 'svelte';
  let { type = 'success', message = '', duration = 3000, showClose = true, plain = true } = $props();
  let visible = $state(true);
  let isClosing = $state(false);
  const icons = {
    success: '/paper/action_success.svg',
    error: '/paper/action_fail.svg',
    warning: '/student_answer_exam/preview-tip.svg',
  };
  const close = () => {
    isClosing = true;
    setTimeout(() => {
      visible = false;
    }, 500);
  };
  onMount(() => {
    const timer = setTimeout(close, duration);
    return () => clearTimeout(timer);
  });
</script>

{#if visible}
  <div class="toast-box {plain ? 'plain' : type} {isClosing ? 'fade-out' : ''}">
    <img src={icons[type]} class="icon" alt="icon" />
    <span class="toast-box-message">{message}</span>
    {#if showClose}
      <button onclick={close}>
        <img src="/theory_question_bank/icons/Xacross_grey.svg" class="close" alt="close" />
      </button>
    {/if}
  </div>
{/if}

<style lang="scss" scoped>
  button {
    all: unset;
  }
  .toast-box {
    min-width: 200px;
    max-width: 400px;
    position: relative;
    padding: 10px 16px;
    border-radius: 6px;
    display: flex;
    align-items: center;
    gap: 10px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
    animation: fadeIn 0.5s ease;
  }
  .plain {
    background-color: #ffffff;
  }
  .success {
    background-color: #e6f7e8;
  }
  .error {
    background-color: #ffe7e6;
  }
  .warning {
    background-color: #fffbe6;
  }
  .icon {
    width: 20px;
    height: 20px;
  }
  .close {
    cursor: pointer;
    width: 12px;
    height: 12px;
    margin-left: auto;
  }
  .toast-box-message {
    font-size: 14px;
    font-weight: 500;
    color: #333;
    flex: 1;
  }
  .fade-out {
    animation: fadeOut 0.5s ease forwards;
  }
  @keyframes fadeIn {
    from {
      opacity: 0;
      transform: translateY(-10px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }
  @keyframes fadeOut {
    from {
      opacity: 1;
      transform: translateY(0);
    }
    to {
      opacity: 0;
      transform: translateY(-10px);
    }
  }
  :global(.toast-container) {
    position: fixed;
    top: 80px;
    left: 50%;
    transform: translateX(-50%);
    display: flex;
    flex-direction: column;
    gap: 10px;
    z-index: 9999;
    pointer-events: none;
  }
  :global(.toast-container > div) {
    pointer-events: all;
  }
</style>
