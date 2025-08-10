<!--
 * @Author: 段春茂 2162105974@qq.com
 * @Date: 2025-07-24 9:30:00
 * @LastEditors: 段春茂 2162105974@qq.com
 * @LastEditTime: 2025-08-10 09:56:07
 * @FilePath: src\lib\components\MessageBox\MessageBox.svelte
 * @Description: MessageBox-消息弹窗
 * @Copyright (c) 2025 by 广州近邻信息有限公司, All Rights Reserved. 
-->
<script>
  /**
   * @component MessageBox
   * @description 弹出窗提示组件
   *
   * @props
   * @property {Object} options 配置项
   * @property {boolean} [options.visible=false] 是否显示弹窗
   * @property {string} [options.title="温馨提示"] 弹窗标题
   * @property {string} [options.content=""] 弹窗内容
   * @property {boolean} [options.center=false] 是否居中显示内容
   * @property {string} [options.cancel_text="取消"] 取消按钮文本
   * @property {string} [options.confirm_text="确定"] 确认按钮文本
   * @property {boolean} [options.show_cancel_icon=true] 是否显示右上角取消图标
   * @property {boolean} [options.show_cancel_button=true] 是否显示取消按钮
   * @property {boolean} [options.show_confirm_button=true] 是否显示确认按钮
   * @property {boolean} [options.on_close_by_click_outside=true] 点击空白区域是否关闭弹窗
   * @property {'primary' | 'success' | 'danger' | 'warning' | 'info'} [options.type="primary"] 弹窗类型
   * @property {'primary' | 'success' | 'danger' | 'warning' | 'info'} [options.cancel_button_type="info"] 取消按钮类型
   * @property {'primary' | 'success' | 'danger' | 'warning' | 'info'} [options.confirm_button_type="primary"] 确认按钮类型
   * @property {Function} [options.onCancel] 点击取消的回调函数
   * @property {Function} [options.onConfirm] 点击确认的回调函数
   */
  import Button from '$lib/components/Button/Button.svelte';

  let {
    visible = false,
    show_cancel_icon = true,
    title = '温馨提示',
    content = '',
    cancel_text = 'cancel',
    confirm_text = 'confirm',
    center = false,
    type = 'primary',
    show_cancel_button = true,
    show_confirm_button = true,
    on_close_by_click_outside = true,
    confirm_button_type = 'primary',
    cancel_button_type = 'info',
    onCancel = () => {},
    onConfirm = () => {},
  } = $props();

  /**
   * 图标集合
   * @type {Object}
   */
  const ICON_URL = {
    primary: '/dialog/tip.svg',
    success: '/paper/action_success.svg',
    danger: '/paper/action_fail.svg',
    warning: '/student_answer_exam/preview-tip.svg',
    info: '/student_practice_list/tip.svg',
  };

  /**
   * 取消按钮回调函数
   *  @type {Function}
   */
  async function handlecancel() {
    await onCancel();
    close();
  }

  /**
   * 确认按钮回调函数
   *  @type {Function}
   */
  async function handleconfirm() {
    await onConfirm();
    close();
  }

  /***
   * 关闭弹窗
   * @type {Function}
   */
  function close() {
    visible = false;
  }

  /**
   * 阻止事件冒泡
   * @param {ClickEvent} event 事件对象
   * @type {Function}
   */
  function stopPropagation(event) {
    event.stopPropagation();
  }

  /**
   * 键盘按下事件关闭弹窗
   * @param {KeyboardEvent} event 事件对象
   * @type {Function}
   */
  function handleKeyDownClose(event) {
    if (event.key === 'Escape' && on_close_by_click_outside) close();
  }

  /**
   * 键盘按下事件停止事件冒泡
   * @param {KeyboardEvent} event 事件对象
   * @type {Function}
   */
  function handleKeyDownStop(event) {
    if (event.key === 'Escape') stopPropagation(event);
  }
</script>

{#if visible}
  <div
    class="is-show"
    onclick={on_close_by_click_outside ? close : null}
    role="dialog"
    tabindex="-1"
    aria-label="关闭弹窗"
    onkeydown={handleKeyDownClose}
  >
    <div
      class="MessageBox {center ? 'is-center' : ''}"
      onclick={stopPropagation}
      tabindex="0"
      role="button"
      aria-label="弹窗内容"
      onkeydown={handleKeyDownStop}
    >
      {#if show_cancel_icon}
        <button onclick={handlecancel} class="cancel">
          <img src="/theory_question_bank/icons/Xacross_grey.svg" alt="关闭" />
        </button>
      {/if}
      <div class="content">
        <div class="title {center ? 'is-center' : ''}">
          <img class="title-icon" src={ICON_URL[type]} alt="icon" />
          {title}
        </div>
        <div class="text">
          {content}
        </div>
        <div class="buttons {center ? 'button-center' : ''}">
          {#if show_cancel_button && cancel_text}
            <Button type={cancel_button_type} size="small" onclick={handlecancel}>{cancel_text}</Button>
          {/if}
          {#if confirm_text && show_confirm_button}
            <Button type={confirm_button_type} size="small" onclick={handleconfirm}>{confirm_text}</Button>
          {/if}
        </div>
      </div>
    </div>
  </div>
{/if}

<style lang="scss" scoped>
  .is-show {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: rgba(154, 154, 154, 0.5);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 1003;
    .MessageBox {
      background: #fff;
      border-radius: 4px;
      padding: 18px;
      min-width: 390px;
      max-width: 600px;
      position: relative;
      box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
      &.is-center {
        display: flex;
        justify-content: center;
        text-align: center;
      }
      .cancel {
        position: absolute;
        top: 18px;
        right: 18px;
        width: 14px;
        height: 14px;
        cursor: pointer;
        img {
          width: 100%;
          height: 100%;
        }
      }
      .content {
        .title {
          font-size: 18px;
          font-weight: bold;
          margin-bottom: 13px;
          display: flex;
          align-items: center;
          &.is-center {
            justify-content: center;
          }
          .title-icon {
            width: 22px;
            height: 22px;
            margin-right: 10px;
          }
        }
        .text {
          color: rgb(102, 102, 102);
          font-size: 16px;
          margin-bottom: 24px;
          line-height: 1.5;
        }
        .buttons {
          display: flex;
          justify-content: flex-end;
          gap: 10px;
          &.button-center {
            display: flex;
            justify-content: center;
            gap: 10px;
            align-items: center;
          }
        }
      }
    }
  }
  button {
    all: unset;
  }
</style>
