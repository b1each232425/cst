<!--
 * @Author: MIOZD && l317101@163.com
 * @Date: 2025-05-23 20:11:59
 * @LastEditors: MIOZD && l317101@163.com
 * @LastEditTime: 2025-05-25 16:44:24
 * @FilePath: \tutorial-platform-fe\src\lib\component\OperationLogPanel.svelte
 * @Description: 日志面板
-->

<script>
    import { formatTimestamp } from "$lib/common/time_utils";

    /**
     * @description: 日志数据
     * @type {{
     * id: number,
     * creator_name: string,
     * module : string,
     * entity_id: number,
     * content: string | Array<string>
     * update_time:string}[]}
     */
    let logDatas = $state([]);
    /**
     * @description: 是否显示日志面板
     * @type {boolean}
     */
    let show_log_panel = $state(false);

    /**
     * @description：显示日志面板
     * @param {{
     * id: number,
     * creator_name: string,
     * module : string,
     * entity_id: number,
     * content: string | Array<string>
     * update_time:string}[]} newLogData
     */
    export const showLogPanel = (newLogData) => {
        logDatas = newLogData;
        show_log_panel = true;
    };


    
</script>

<div class="modal" style="display: {show_log_panel ? 'flex' : 'none'};">
    <div class="Panel">
        <div class="topBar">
            <span class="title">操作日志</span>
            <button
                class="closeBtn"
                onclick={async () => {
                    show_log_panel = false;
                }}>X</button
            >
        </div>
        <div class="logView">
            {#each logDatas as logData}
                <div class="logItem">
                    <div class="timeStr">
                        [{formatTimestamp(
                            new Date(logData.update_time).getTime(),
                        )}]
                    </div>
                    <div style="display: flex;">
                        <div class="userStr">
                            用户:{logData.creator_name}
                        </div>
                        <div class="logsContainer">
                            {#if typeof logData.content === "string"}
                                <span class="logStr"
                                    >{logData.content}</span
                                >
                            {:else if Array.isArray(logData.content)}
                                {#each logData.content as changeContent}
                                    <span class="logStr">{changeContent}</span>
                                {/each}
                            {/if}
                        </div>
                    </div>
                </div>
            {/each}
        </div>
        <div class="bottomBar">
            <button
                class="confirmBtn"
                onclick={async () => {
                    show_log_panel = false;
                }}
            >
                关闭</button
            >
        </div>
    </div>
</div>

<style lang="scss" scoped>
    button {
        margin: 0px;
        padding: 0px;
        border: 0px;
        background-color: transparent;
        cursor: pointer;
        user-select: none;

        transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        transform: translateY(0);
        box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);

        &:focus {
            outline: none;
        }
    }
    .modal {
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background-color: rgba(0, 0, 0, 0.5);
        justify-content: center;
        align-items: center;
        z-index: 100;

        .Panel {
            background-color: white;
            border-radius: 8px;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
            width: 560px;
            max-width: 90%;
            padding: 20px;
            display: flex;
            flex-direction: column;
            gap: 20px;

            height: 600px;
            max-height: 90%;

            .topBar {
                .title {
                    font-size: 18px;
                    font-weight: bold;
                }

                .closeBtn {
                    font-size: 18px;
                }

                display: flex;
                justify-content: space-between;
            }

            .logView {
                flex-grow: 1;
                overflow-y: auto;
                padding: 10px 0px;
                background-color: #f9f9f9;
                border-top: 1px solid #ccc;
                border-bottom: 1px solid #ccc;
                font-family: Arial, sans-serif;
                font-size: 14px;

                display: flex;
                flex-direction: column;

                scrollbar-gutter: stable both-edges;
            }

            .logItem {
                font-family: SimSun、Microsoft YaHei;
                padding: 6px 0;
                border-bottom: 1px solid #eee;

                .timeStr {
                    flex-shrink: 0;
                    margin-right: 0.5em;
                }

                .userStr {
                    flex-shrink: 0;
                    margin-right: 0.5em;
                }

                .logsContainer {
                    display: flex;
                    flex-direction: column;
                }

                display: flex;
            }

            .logItem:last-child {
                border-bottom: none;
            }

            .bottomBar {
                display: flex;
                justify-content: flex-end;
            }
        }

        .confirmBtn {
            padding: 8px 16px;
            border-radius: 4px;
            font-size: 14px;
            cursor: pointer;
            transition: all 0.3s;

            background-color: white;
            color: #333;
            border: 1px solid #d9d9d9;

            &:hover {
                color: #1890ff;
                border-color: #1890ff;
            }
        }
    }
</style>
