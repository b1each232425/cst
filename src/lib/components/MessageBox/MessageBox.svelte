
<!-- /**
  * 弹窗提示组件使用说明
  *
  * 作者：段春茂
  * 邮箱：2162105974@qq.com
  *
  * 参数配置：
  * @param {Boolean} visible                是否显示弹窗，默认：false
  * @param {Boolean} show_cancel_icon       是否显示右上角关闭图标，默认：true
  * @param {String}  title                  弹窗标题文本，默认："温馨提示"
  * @param {String}  content                弹窗内容正文，支持 HTML 字符串，默认：""
  * @param {String}  cancel_text            取消按钮文本，默认："Cancel"
  * @param {String}  confirm_text           确认按钮文本，默认："Confirm"
  * @param {Boolean} center                 是否居中显示标题、按钮等，默认：false
  * @param {Boolean} show_cancel_button     是否显示取消按钮，默认：true
  * @param {Boolean} show_confirm_button    是否显示确认按钮，默认：true
  * @param {String}  confirm_button_type    确认按钮类型（样式），如 "primary"、"success"，默认："primary"
  * @param {String}  cancel_button_type     取消按钮类型，默认："info"
  * @param {Function} onCancel              点击取消按钮或关闭图标时的回调函数，支持异步
  * @param {Function} onConfirm             点击确认按钮时的回调函数，支持异步
  *
  * 功能说明：
  * - 支持基本的提示弹窗 UI，包括标题、正文、按钮
  * - 可自定义是否展示按钮、按钮文案、对齐方式等
  * - 支持点击确认/取消后自动关闭弹窗
  * - 样式美观，默认带遮罩背景
  *
  * 使用示例：
  * <MessageBox
  *   visible={visible}
  *   title="删除提示"
  *   content="您确定要删除这条数据吗？"
  *   cancel_text="取消"
  *   confirm_text="确定"
  *   confirm_button_type="danger"
  *   onCancel={() => visible = false}
  *   onConfirm={() => {
  *     // 执行删除操作
  *     deleteItem();
  *     visible = false;
  *   }}
  * />
  *
  * 注意事项：
  * - `visible` 需要父组件传入控制（如通过状态变量）
  * - `onCancel` / `onConfirm` 可以为异步函数
  * - 弹窗内容高度自适应，最大宽度 500px，移动端建议加媒体查询优化
  */ -->
<script>
  import Button from '$lib/components/Button/Button.svelte';
  let {
    visible = false,
    show_cancel_icon = true,
    title = '温馨提示',
    content = '',
    cancel_text = 'Cancel',
    confirm_text = 'Confirm',
    center = false,
    show_cancel_button = true,
    show_confirm_button = true,
    confirm_button_type = 'primary',
    cancel_button_type = 'info',
    onCancel = () => {},
    onConfirm = () => {},
  } = $props();
  async function handleCancel() {
    await onCancel();
    visible = false;
  }
  async function handleConfirm() {
    await onConfirm();
    visible = false;
  }
</script>

{#if visible}
  <div class="overlay">
    <div class="message-box {center ? 'center' : ''}">
      {#if show_cancel_icon}
        <button onclick={handleCancel} class="message-box-cancel">
          <img src="/theory_question_bank/icons/Xacross_grey.svg" alt="关闭" />
        </button>
      {/if}
      <div class="message-box-content">
        <div class="message-box-title {center ? 'center' : ''}">
          <img class="message-box-title-icon" src="/dialog/tip.svg" alt="" />
          {title}
        </div>
        <div class="message-box-text">
          {content}
        </div>
        <div class="message-box-buttons {center ? 'button-center' : ''}">
          {#if show_cancel_button && cancel_text}
            <Button type={cancel_button_type} size="small" onclick={handleCancel}>{cancel_text}</Button>
          {/if}
          {#if confirm_text && show_confirm_button}
            <Button type={confirm_button_type} size="small" onclick={handleConfirm}>{confirm_text}</Button>
          {/if}
        </div>
      </div>
    </div>
  </div>
{/if}

<style lang="scss" scoped>
  button {
    all: unset;
  }
  .overlay {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: rgba(154, 154, 154, 0.5);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 1000;
  }
  .message-box {
    background: #fff;
    border-radius: 4px;
    padding: 18px;
    min-width: 350px;
    max-width: 500px;
    position: relative;
    box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
  }
  .message-box.center {
    display: flex;
    justify-content: center;
    text-align: center;
  }
  .message-box-cancel {
    position: absolute;
    top: 16px;
    right: 16px;
    width: 10px;
    height: 10px;
    cursor: pointer;
    img {
      width: 100%;
      height: 100%;
    }
  }
  .message-box-title {
    font-size: 14px;
    font-weight: bold;
    margin-bottom: 12px;
    display: flex;
    align-items: center;
  }
  .message-box-title-icon {
    width: 20px;
    height: 20px;
    margin-right: 10px;
  }
  .message-box-title.center {
    justify-content: center;
  }
  .message-box-text {
    color: rgb(102, 102, 102);
    font-size: 12px;
    margin-bottom: 20px;
    line-height: 1.5;
  }
  .message-box-buttons {
    display: flex;
    justify-content: flex-end;
    gap: 10px;
  }
  .button-center {
    display: flex;
    justify-content: center;
    gap: 10px;
    align-items: center;
  }
</style>

