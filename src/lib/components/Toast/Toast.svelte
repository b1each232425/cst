<!--
 * @Author: 段春茂 2162105974@qq.com
 * @Date: 2025-07-24 9:35:00
 * @LastEditors: 段春茂 2162105974@qq.com
 * @LastEditTime: 2025-08-10 21:28:07
 * @FilePath: src\lib\components\Toast\Toast.svelte
 * @Description: Toast-信息提示
 * @Copyright (c) 2025 by 广州近邻信息有限公司, All Rights Reserved. 
-->
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

  /**
   * 对传入的数据进行处理,立即执行函数
   * @type {function}
   */
  (
    () => {
      const TOAST_TYPES = ['success', 'error', 'warning'];

      // 获取精确的数据类型
      function getType(value) {
        return Object.prototype.toString.call(value).slice(8, -1).toLowerCase();
      }

      // type 校验
      if (getType(type) !== 'string' || !TOAST_TYPES.includes(type.trim())) {
        console.warn(`[Toast] 类型无效: '${type}',应为 ${TOAST_TYPES.join(', ')},当前为: ${getType(type)}`);
        type = 'success';
      }

      // message 校验
      if (getType(message) !== 'string' || message.trim() === '') {
        console.warn(`[Toast] 内容无效: '${message}',应为非空字符串`);
        message = '';
      }

      // duration 校验
      if (getType(duration) !== 'number' || duration < 500) {
        console.warn(`[Toast] 自动关闭时间无效: '${duration}',应为 >= 500 的数字`);
        duration = 3000;
      }

      // showClose 校验
      if (getType(showClose) !== 'boolean') {
        console.warn(`[Toast] 是否显示关闭按钮无效: '${showClose}',应为布尔值boolean`);
        showClose = true;
      }
    }
  )();

  /**
   * 是否可见
   * @type {boolean}
   */
  let visible = $state(true);

  /**
   * 是否正在关闭
   * @type {boolean}
   */
  let isClosing = $state(false);

  /**
   * 定义图标
   * @type {{success: string, error: string, warning: string}}
   */
  const ICON_URL = {
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
  <div class="toast" class:is-fadeOut={isClosing}>
    <img src={ICON_URL[type]} class="toast__icon" alt="icon" loading="lazy" data-testid="typeIcon" />
    <span class="toast__message">{message}</span>
    {#if showClose}
      <button onclick={close} class="toast__close" aria-label="关闭" title="点击关闭" data-testid="closeBtn"></button>
    {/if}
  </div>
{/if}

<style lang="scss" scoped>
  @mixin when($name) {
    @at-root {
      &.#{'is-' + $name} {
        @content;
      }
    }
  }
  .toast {
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
    @include when(fadeOut) {
      animation: fadeOut 0.5s ease forwards;
    }
    &__icon {
      width: 20px;
      height: 20px;
    }
    &__close {
      all: unset;
      cursor: pointer;
      width: 12px;
      height: 12px;
      margin-left: auto;
      background-image: url('/theory_question_bank/icons/Xacross.svg');
      background-size: contain;
      background-position: center;
      background-repeat: no-repeat;
    }
    &__message {
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
  // 全局容器，用来统一管理多个toast信息提示
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
