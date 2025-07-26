<!--
 * @Author: wusaber33
 * @Date: 2025-04-26 15:27:09
 * @LastEditors: wusaber33
 * @LastEditTime: 2025-04-26 15:50:11
 * @FilePath: \tutorial-platform-fe\src\lib\component\ActionToast.svelte
 * @Description: 操作提示组件 --支持 success、error、其他自定义图片的操作提示
 * @Copyright (c) 2025 by wusaber33, All Rights Reserved.
-->
<script>
    import { onDestroy, tick } from "svelte";

    /**
     * @type {{
     *  isShow: boolean; 
     *  type?: "success" | "error" | string;
     * message?: string;
     * duration?: number;
     * iconSrc?: string;}}
    */
    let {
        isShow = $bindable(false), //控制显示/隐藏状态   
        type = "success", //提示类型 (success/error/custom)
        message = "操作成功", //提示文本内容     
        duration = 2000, //自动关闭倒计时   
        iconSrc = "", //自定义图标地址
    } = $props();

    // 内置图标路径
    const icons = {
        success: "/paper/action_success.svg",
        error: "/paper/action_fail.svg",
    };

    // 最终显示的图片地址
    let finalIconSrc = $derived.by(() => {
        if(iconSrc){
            return iconSrc;
        }
        if (type === "success" || type === "error") {
            return icons[type];
        }
    });

    /**
     * @type {ReturnType<typeof setTimeout>}
     */
    let timer;
    $effect(() => {
        if (isShow) {
            clearTimeout(timer);
            timer = setTimeout(() => {
                isShow = false;
            }, duration);
        }
    });

    onDestroy(() => {
        clearTimeout(timer);
    });

    export async function show(newType = "success", newMessage = "操作成功", newIconSrc = "", newDuration = 2000) {
        type = newType;
        message = newMessage;
        iconSrc = newIconSrc;
        duration = newDuration;
        clearTimeout(timer);
        isShow = false;
        await tick();
        isShow = true;
    }
</script>

{#if isShow}
  <div
    class="toast-container"
    style="--toast-duration: {duration}ms; --toast-delay: {duration - 500}ms;"
  >
    <img class="toast-icon" src={finalIconSrc} alt="提示图标" />
    <div class="toast-message">{message}</div>
  </div>
{/if}

<style lang="scss" scoped>
.toast-container {
  position: fixed;
  top: 20%;
  left: 50%;
  transform: translateX(-50%);
  background: white;
  border-radius: var(--border-radius-md);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  display: flex;
  align-items: center;
  padding: 12px 20px;
  z-index: 1001;
  animation: toast-fade-in 0.3s ease, toast-fade-out 0.5s ease var(--toast-delay, 0ms) forwards;
}

.toast-icon {
    width: 24px;
    height: 24px;
    margin-right: 12px;
}

.toast-message {
    font-size: 14px;
    color: #333;
}

@keyframes toast-fade-in {
  from {
    opacity: 0;
    transform: translate(-50%, -20%);
  }
  to {
    opacity: 1;
    transform: translate(-50%, 0);
  }
}

@keyframes toast-fade-out {
  to {
    opacity: 0;
    transform: translate(-50%, -20%);
  }
}
</style>
