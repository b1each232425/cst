<script>
  /**
   * @component Toast
   * @description 提示组件
   *
   * @props
   * @property {'success' | 'error' | 'warning'} [type='success']   - 提示类型
   * @property {string} [message='']   - 提示文本内容
   * @property {number} [duration=3000]   - 自动关闭时间，单位毫秒
   * @property {boolean} [showClose=true]  - 是否显示关闭按钮
   */
  import { onMount } from 'svelte';

  let { type = 'success', message = '', duration = 3000, showClose = true } = $props();

  /** 是否可见 @type {boolean}*/
  let visible = $state(true);

  /** 是否正在关闭 @type {boolean} */
  let isClosing = $state(false);

  /**
   * 定义图标
   * @type {{success: string, error: string, warning: string}}
   */
  const icons = {
    success: '/paper/action_success.svg',
    error: '/paper/action_fail.svg',
    warning: '/student_answer_exam/preview-tip.svg',
  };

  /**
   * 关闭提示
   * @param {ClickEvent}
   */
  function close() {
    isClosing = true;
    setTimeout(() => {
      visible = false;
    }, 500);
  }

  onMount(() => {
    const timer = setTimeout(close, duration);
    return () => clearTimeout(timer);
  });
</script>

{#if visible}
  <div class="toast-box {isClosing ? 'fade-out' : ''}">
    <img src={icons[type]} class="icon" alt="icon" />
    <span class="message">{message}</span>
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
    background-color: #ffffff;
    &.fade-out {
      animation: fadeOut 0.5s ease forwards;
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
    .message {
      font-size: 14px;
      font-weight: 500;
      color: #333;
      flex: 1;
    }
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
