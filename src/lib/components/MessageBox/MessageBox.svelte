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
