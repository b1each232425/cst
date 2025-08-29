<!--
 * @Author: chenyijun
 * @Date: 2025-04-20 20:20:00
 * @LastEditors: chenyijun
 * @LastEditTime: 2025-04-20 22:08:02
 -->

<script>
    let {
        isOpen = $bindable(false),
        title = "提示",
        content = "",
        width = "400px",
        showFooter = true,
        confirmText = "确定",
        confirmTextBackgroundColor = "#0336ff",
        cancelText = "取消",
        onConfirm = () => {
            console.log("点击确认");
        },
        onCancel = () => {
            console.log("点击取消");
        },
        onClose = () => {
            console.log("关闭对话框");
        },
    } = $props();

    /**
     * 打开对话框
     */

    /**
     * 关闭对话框
     */
    function close() {
        isOpen = false;
        onClose();
    }

    /**
     * 处理确认按钮事件
     */
    function handleConfirm() {
        onConfirm();
        close();
    }

    /**
     * 处理取消按钮事件
     */
    function handleCancel() {
        onCancel();
        close();
    }
    /**
     * 处理点击背景事件
     * @param {MouseEvent} event - 点击事件
     */
    function handleBackdropClick(event) {
        // 如果点击的是背景层而不是对话框内容，则关闭对话框
        if (event.target === event.currentTarget) {
            close();
        }
    }
</script>

{#if isOpen}
    <div
        class="dialog-backdrop"
        onclick={handleBackdropClick}
        onkeydown={(e) => e.key === "Escape" && close()}
        tabindex="-1"
        role="dialog"
        aria-modal="true"
    >
        <div class="dialog-container" style="width: {width}">
            <div class="dialog-header">
                <div class="title-container">
                    <img
                        src="/dialog/tip.svg"
                        alt="提示图标"
                        class="tip-icon"
                    />
                    <h3 class="dialog-title">{title}</h3>
                </div>
                <button class="close-button" onclick={close} aria-label="关闭"
                    >×</button
                >
            </div>

            <div class="dialog-content">
                <p>{content}</p>
            </div>

            {#if showFooter}
                <div class="dialog-footer">
                    <button class="cancel-button" onclick={handleCancel}
                        >{cancelText}</button
                    >
                    <button
                        class="confirm-button"
                        onclick={handleConfirm}
                        style="background-color: {confirmTextBackgroundColor}; border-color: {confirmTextBackgroundColor};"
                        >{confirmText}</button
                    >
                </div>
            {/if}
        </div>
    </div>
{/if}

<style lang="scss">
    .dialog-backdrop {
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background-color: rgba(0, 0, 0, 0.5);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 1000;

        .dialog-container {
            background-color: white;
            border-radius: 4px;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
            max-width: 90%;
            max-height: 80%;
            display: flex;
            flex-direction: column;
            overflow: hidden;
            animation: dialog-fade-in 0.3s ease;

            .dialog-header {
                display: flex;
                justify-content: space-between;
                align-items: center;
                padding: 20px;
                .title-container {
                    display: flex;
                    align-items: center;

                    .tip-icon {
                        width: 20px;
                        height: 20px;
                        margin-right: 8px;
                    }

                    .dialog-title {
                        margin: 0;
                        font-size: 16px;
                        font-weight: 500;
                        color: #333;
                    }
                }

                .close-button {
                    background: none;
                    border: none;
                    font-size: 20px;
                    color: #999;
                    cursor: pointer;
                    padding: 4px 8px;
                    line-height: 1;

                    &:hover {
                        color: #666;
                    }
                }
            }

            .dialog-content {
                padding: 0px 30px;
                overflow-y: auto;
                flex: 1;
                min-height: 40px;
                p {
                    margin: 0;
                    font-size: 12px;
                    color: rgba(0, 0, 0, 0.6);
                }
            }

            .dialog-footer {
                display: flex;
                justify-content: flex-end;
                padding: 10px 20px 16px;

                button {
                    padding: 6px 16px;
                    border-radius: 2px;
                    font-size: 14px;
                    cursor: pointer;
                    transition: all 0.3s ease;
                    margin-left: 10px;
                }

                .cancel-button {
                    background-color: white;
                    border: 1px solid #d9d9d9;
                    color: #666;

                    &:hover {
                        color: #0336ff;
                        border-color: #0336ff;
                    }
                }

                .confirm-button {
                    background-color: #0336ff;
                    border: 1px solid #0336ff;
                    color: white;

                    &:hover {
                        opacity: 0.9;
                    }
                }
            }
        }
    }

    @keyframes dialog-fade-in {
        from {
            opacity: 0;
            transform: translateY(-20px);
        }
        to {
            opacity: 1;
            transform: translateY(0);
        }
    }
</style>
