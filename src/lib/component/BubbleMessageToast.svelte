<!--
 * @Author: MIOZD && l317101@163.com
 * @Date: 2025-05-03 16:02:42
 * @LastEditors: MIOZD && l317101@163.com
 * @LastEditTime: 2025-05-26 19:26:33
 * @FilePath: \tutorial-platform-fe\src\lib\component\BubbleMessageToast.svelte
 * @Description: 气泡消息提示
-->
<script>
    /**
     * @typedef MessageType 消息
     * @property {number} id 消息id
     * @property {"info" | "success" | "warn" | "error"} level  类型
     * @property {string} content 内容
     * @property {number} duration 显示时间
     * @property {boolean} is_visible 显示状态
     * @property {NodeJS.Timeout | undefined | null} timer 显示定时器
     */

    /**
     * @description 消息队列
     * @type {MessageType[]}
     */
    let message_chan = $state([]);

    let message_id = 0;

    let animation_duration = 400; // 动画持续时间

    /**
     * @description 转换ms为s字符串
     * @param {number} ms 毫秒数
    */
    const msToS = (ms) => {
        return `${(ms / 1000)}s`;
    };

    /**
     * @description 新增消息气泡
     * @param  {"info" | "success" | "warn" | "error"} level 信息类型
     * @param {string} content 内容
     * @param {number} duration 显示时间 默认值2000（单位：ms）
     */
    export const show = (level, content, duration = 2000) => {

        message_id += 1;
        const cur_id = message_id;
        const newMsg = {
            id: cur_id,
            level,
            content,
            duration,
            is_visible: false,
            timer: null,
        };

        message_chan = [...message_chan, newMsg];

        // 延迟到下一帧
        requestAnimationFrame(() => {
            const msg = message_chan.find((m) => m.id === cur_id);
            if (!msg) return;
            msg.is_visible = true;
            msg.timer = setTimeout(() => {
                msg.is_visible = false;
                msg.timer = setTimeout(() => {
                    message_chan = message_chan.filter((m) => m.id !== cur_id);
                }, 400);
            }, duration + 400);
        });
    };

    /**
     * @description 清理消息队列
     */
    export const cleanMessageChan = () => {
        message_chan.forEach((message) => {
            if (message.timer !== null && message.timer !== undefined)
                clearTimeout(message.timer);
        });
        message_id = 0;
        message_chan = [];
    };
</script>

<div class="questionPrviewPanel">
    {#each message_chan as message}
        <div
            class="bubbleMessage"
            style:opacity={message.is_visible ? 1 : 0}
            style:transform={message.is_visible
                ? "translateX(0)"
                : "translateX(120%)"}
            style:transition={`transform ${msToS(animation_duration)} ease-in-out, opacity 0.3s ease-in-out`}
            style:pointer-events={message.is_visible ? "auto" : "none"}
            style:background-color={message.level === "info"
                ? "rgba(217, 227, 252, 1.0)"
                : message.level === "success"
                  ? "rgba(188, 235, 220, 1.0)"
                  : message.level === "warn"
                    ? "rgba(249, 244, 199, 1.0)"
                    : message.level === "error"
                      ? "rgba(249, 215, 217, 1.0)"
                      : ""}
        >
            <div class="icon">
                {#if message.level === "info"}
                    <svg
                        version="1.1"
                        xmlns:xlink="http://www.w3.org/1999/xlink"
                        xmlns="http://www.w3.org/2000/svg"
                    >
                        <g transform="matrix(1 0 0 1 -56 -54 )">
                            <path
                                d="M 0.277777777777828 10  C 0.277777777777828 15.3694444444444  4.63056666666671 19.7222222222222  10 19.7222222222222  C 15.3694444444444 19.7222222222222  19.7222222222222 15.3694444444444  19.7222222222222 10  C 19.7222222222222 4.63056666666667  15.3694444444444 0.277777777777771  10 0.277777777777771  C 4.63056666666671 0.277777777777771  0.277777777777828 4.63056666666667  0.277777777777828 10  Z M 9.16653333333329 6.11104444444445  L 9.16653333333329 4.44444444444444  L 10.8331111111111 4.44444444444444  L 10.8331111111111 6.11104444444445  L 9.16653333333329 6.11104444444445  Z M 9.31335555555552 15.5552222222222  L 9.31335555555552 7.91666666666667  L 10.7022222222222 7.91666666666667  L 10.7022222222222 15.5552222222222  L 9.31335555555552 15.5552222222222  Z "
                                fill-rule="nonzero"
                                fill="#0052d9"
                                stroke="none"
                                transform="matrix(1 0 0 1 56 54 )"
                            />
                        </g>
                    </svg>
                {:else if message.level === "success"}
                    <svg
                        version="1.1"
                        xmlns:xlink="http://www.w3.org/1999/xlink"
                        xmlns="http://www.w3.org/2000/svg"
                    >
                        <g transform="matrix(1 0 0 1 -56 -116 )">
                            <path
                                d="M 0.835000000000001 10  C 0.835000000000001 4.93831027  4.93831027 0.834999999999994  10 0.834999999999994  C 15.0616897 0.834999999999994  19.165 4.93831027  19.165 10  C 19.165 15.0616897  15.0616897 19.165  10 19.165  C 4.93831027 19.165  0.835000000000001 15.0616897  0.835000000000001 10  Z M 14.9376515 7.50701023000001  L 13.9406309 6.50998967  L 8.95544585 11.4949897  L 5.96446641 8.50403079  L 4.96744585 9.50105135  L 8.95552809 13.4891336  L 14.9376515 7.50701023000001  Z "
                                fill-rule="nonzero"
                                fill="#00a870"
                                stroke="none"
                                transform="matrix(1 0 0 1 56 116 )"
                            />
                        </g>
                    </svg>
                {:else if message.level === "warn"}
                    <svg
                        version="1.1"
                        xmlns:xlink="http://www.w3.org/1999/xlink"
                        xmlns="http://www.w3.org/2000/svg"
                    >
                        <g transform="matrix(1 0 0 1 -56 -178 )">
                            <path
                                d="M 0.835000000000001 10  C 0.835000000000001 4.93831026999999  4.93831027 0.835000000000008  10 0.835000000000008  C 15.0616897 0.835000000000008  19.165 4.93831026999999  19.165 10  C 19.165 15.0616897  15.0616897 19.165  10 19.165  C 4.93831027 19.165  0.835000000000001 15.0616897  0.835000000000001 10  Z M 10.705 14.935  L 10.705 13.525  L 9.295 13.525  L 9.295 14.935  L 10.705 14.935  Z M 10.705 12.115  L 10.705 5.065  L 9.295 5.065  L 9.295 12.115  L 10.705 12.115  Z "
                                fill-rule="nonzero"
                                fill="#ed7b2f"
                                stroke="none"
                                transform="matrix(1 0 0 1 56 178 )"
                            />
                        </g>
                    </svg>
                {:else if message.level === "error"}
                    <svg
                        version="1.1"
                        xmlns:xlink="http://www.w3.org/1999/xlink"
                        xmlns="http://www.w3.org/2000/svg"
                    >
                        <g transform="matrix(1 0 0 1 -56 -240 )">
                            <path
                                d="M 0.836666666999999 9.99833333000001  C 0.836666666999999 4.9366436  4.93997693 0.833333333000013  10.0016667 0.833333333000013  C 15.0633564 0.833333333000013  19.1666667 4.9366436  19.1666667 9.99833333000001  C 19.1666667 15.0600231  15.0633564 19.1633333  10.0016667 19.1633333  C 4.93997693 19.1633333  0.836666666999999 15.0600231  0.836666666999999 9.99833333000001  Z M 10.7066667 14.9333333  L 10.7066667 13.5233333  L 9.29666667 13.5233333  L 9.29666667 14.9333333  L 10.7066667 14.9333333  Z M 10.7066667 12.1133333  L 10.7066667 5.06333333000001  L 9.29666667 5.06333333000001  L 9.29666667 12.1133333  L 10.7066667 12.1133333  Z "
                                fill-rule="nonzero"
                                fill="#e34d59"
                                stroke="none"
                                transform="matrix(1 0 0 1 56 240 )"
                            />
                        </g>
                    </svg>
                {/if}
            </div>
            <span class="content">{message.content}</span>
        </div>
    {/each}
</div>

<style lang="scss" scoped>
    span {
        font-family: PingFang FC;
    }

    .questionPrviewPanel {
        position: fixed;
        top: 10%;
        right: 30px;

        z-index: 1001;

        flex-direction: column-reverse;
        display: flex;
        align-items: flex-end;
        gap: 10px;
    }

    .bubbleMessage {
        width: fit-content;
        max-width: 500px;
        border-radius: 10px;

        padding: 8px;

        display: flex;
        align-items: center;

        .icon {
            display: flex;
            justify-content: center;
            align-items: center;
            pointer-events: none;
            margin-right: 10px;
            svg {
                width: 20px;
                height: 20px;
            }
        }

        .content {
            word-break: break-all;
        }
    }
</style>
