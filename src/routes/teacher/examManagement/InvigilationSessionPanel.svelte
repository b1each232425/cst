<script>
    import { goto } from "$app/navigation";
    import ActionToast from "$lib/component/ActionToast.svelte";

    let {
        show_panel = false,
        onClose = ()=>{

        },
        exam_id
    } = $props();

    const EXAM_SESSION_STATUS_MAP = {
        "": "--",
        "01": "未开始",
        "02": "进行中",
        "04": "已结束",
        "08": "批改中",
        "10": "已批改",
    }

    //是否加载中
    let loading = $state(false);
    let session_list = $state({})

    async function getExamSession() {
        if(exam_id <= 0){
            action_toast?.show("error", "考试不存在");
        }
        loading = true;


        const response = await fetch(
            `/api/teacher/exam/inviligationExamInfo?exam_id=${exam_id}`,
            {
                method: "GET",
                credentials: 'include',
                headers: {
                    "Content-Type": "application/json",
                },
            },
        );

        const result = await response.json();

        if (result.Status != 0) {
            let error = result.Msg || "获取考试信息失败";
            session_list = [];
            action_toast?.show("error", error);
        } else {
           session_list = result.Data.exam_session_list === null? []:result.Data.exam_session_list;
        }
        loading = false;
    }

    let show_action_toast = $state(false);
    /**
     * @type {any}
     */
    let action_toast = $state(null);

    let initial_load = $derived(show_panel);

    //当打开面板时自动搜索试卷列表
    $effect(() => {
        if (show_panel && initial_load) {
            initial_load = false;
            session_list = [];
            getExamSession()
        }
    });
</script>

<div class={show_panel ? "session-panel-container" : "hide"}>
    <div class="session-panel">
        <div class="panel-header">
            <span>监考管理</span>
            <button class="close-btn" onclick={() => {
                show_panel = false;
                session_list = [];
                onClose();
            }}>×</button>
        </div>
        <div class="panel-body">
            <div class="session-selection-table-container">
                <table class="table">
                    <thead class="session-table-head">
                        <tr class="table-head-row">
                            <th class="table-head">考试场次</th>
                            <th class="table-head">开始时间</th>
                            <th class="table-head">结束时间</th>
                            <th class="table-head">状态</th>
                            <th class="table-head">操作</th>
                        </tr>
                    </thead>
                    <tbody>
                        {#each session_list as session, index}
                            <tr>
                                <td class="word-break">{session.paper_name === null || session.paper_name === "" ? "--" : session.paper_name}</td>
                                <td>{session.start_time === null || session.start_time === "" ? "--" : new Date(session.start_time).toLocaleString()}</td>
                                <td>{session.end_time === null || session.end_time === "" ? "--" : new Date(session.end_time).toLocaleString()}</td>
                                <td>
                                    <span
                                    class="status-text"
                                        class:incoming={session.status == "01"}
                                        class:underway={session.status == "02"}
                                        class:ended={session.status == "04"}
                                        class:marking={session.status == "08"}
                                        class:marked={session.status == "10"}
                                        class:submitted={session.status == "12"}
                                    >
                                        {session.status === null || session.status === "" ? "--" : EXAM_SESSION_STATUS_MAP[session.status]}
                                    </span>
                                    
                                </td>
                                <td><button
                                    class = "action-button"
                                    onclick={()=>{
                                        localStorage.setItem(
                                            "invigilation_session_info",
                                            JSON.stringify({
                                                exam_session_id:session.session_id,
                                                is_admin:true,
                                                exam_room_id:-1
                                            }),
                                        );
                                        goto(`/teacher/invigilationList/invigilation`);
                                    }}
                                >
                                    进入监考
                                </button></td>
                            </tr>
                        {/each}
                    </tbody>
                </table>
                {#if session_list.length === 0}
                    <div class="no-data-text">暂无数据</div>
                {/if}
            </div>
        </div>
        <div class="panel-footer">
            <button class="btn" onclick={() => {
                show_panel = false;
                session_list = [];
                onClose();
            }}>取消</button>
            <button class="btn save" onclick={() => {
                show_panel = false;
                session_list = [];
                onClose();
            }}>确定</button>
        </div>
    </div>
</div>

<ActionToast bind:isShow={show_action_toast} bind:this={action_toast} />


<style lang="scss" scoped>
    .hide {
        display: none;
    }

    .table {
        width: 100%;
        border-collapse: collapse;
        flex: 1;
        max-height: 60px;

        th, td {
            font-size: 14px;
            color: var(--text-primary);
            border: none;
            padding: 8px;
            text-align: center;
            overflow: visible;
            border-top: none;
            border-left: none;
            border-right: none;
            box-sizing: border-box;
        }

        td {
            border-bottom: 1px solid #ddd;
            height: 60px;
        }

        th {
            color: var(--text-disabled);
            background: #fafafa;
        }

        // 表格行样式
        tbody {
            tr {
                &:hover {
                    background-color: #e0f0ff;
                    cursor: pointer;
                }
            }
        }
    }

    .session-table-head {
        background-color: #ffffff;
        font-size: 14px;
        font-weight: normal;
        color: rgb(0, 0, 0, 0.3);
        border: none;
        padding: 8px;
        text-align: center;
        .table-head-row {
            height: 40px;
            .table-head {
                font-weight: normal;
                background: #fff;
                color: rgb(0, 0, 0, 0.3);
            }
        }
    }
    
    .session-panel-container {
        position: fixed;
        top: 0%;
        left: 0%;
        width: 100vw;
        height: 100vh;
        background-color: rgba(0, 0, 0, 0.25); /* 半透明遮罩层 */
        display: flex;
        justify-content: center;
        align-items: center;
        z-index: 100;
    }

    .session-panel {
        width: 1000px;
        min-width: 800px;
        max-height: 90vh;
        overflow-y: auto;
        background-color: white;
        display: flex;
        flex-direction: column;
        border-radius: 12px;
        box-shadow: 0 8px 32px rgba(0, 0, 0, 0.12);
        z-index: 1001;
    }

    .panel-header {
        display: flex;
        flex-direction: row;
        align-items: center;
        justify-content: space-between;
        padding: 20px 24px;
        border-bottom: 1px solid #eee;
        color: var(--text-primary);
        font-size: 20px;
        font-weight: 600;

        .close-btn {
            background: none;
            border: none;
            font-size: 24px;
            width: 32px;
            height: 32px;
            text-align: center;
            color: #666;
            cursor: pointer;
            transition: color 0.2s;
            padding: 4px;
            border-radius: 4px;
            display: flex;
            align-items: center;
            justify-content: center;
            &:hover {
                color: var(--red);
                background: rgba(0, 0, 0, 0.04);
            }
        }
    }

    .panel-body {
        padding: 24px;
        flex: 1;
        display: flex;
        flex-direction: column;
        min-height: 0;
        overflow-y: auto;
    }

    .session-selection-table-container {
        flex: 1;
        min-height: 450px;
        position: relative;
        display: flex;
        flex-direction: column;
    }

    .btn {
        min-width: 80px;
        padding: 7px 18px;
        border-radius: 5px;
        border: 1.5px solid #d9d9d9;
        background: #fff;
        color: var(--blue);
        font-size: 15px;
        cursor: pointer;
        font-weight: 500;
        transition: all 0.2s;

        @media (max-width: 768px) {
            min-width: 70px;
            padding: 6px 16px;
            font-size: 14px;
        }

        &:hover {
            background: #f0f6ff;
        }
        &.save {
            background: var(--blue);
            color: #fff;
            border-color: var(--blue);
            &:hover {
                background: var(--primary-hover);
                border-color: var(--primary-hover);
            }
        }
        &:disabled {
            opacity: 0.6;
            cursor: not-allowed;
        }
    }

    .panel-footer {
        display: flex;
        justify-content: flex-end;
        gap: 16px;
        padding: 12px 24px 18px;
        border-top: 1px solid #eee;

        @media (max-width: 768px) {
            padding: 12px 16px 16px;
        }

        @media (max-width: 480px) {
            flex-direction: column;
            gap: 8px;

            .btn {
                width: 100%;
            }
        }
    }

    .no-data-text {
        position: absolute;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        color: var(--text-disabled);
        font-size: 14px;
        font-weight: normal;
    }

    .action-button {
        border: none;
        background-color: rgb(0, 0, 0, 0);
        color: var(--blue);
        cursor: pointer;
        font-size: 14px;
        min-width: 70px;
    }
    .action-button:hover {
        font-weight: bold;
    }
    .status-text {
        &.incoming {
            color: #ff8100;
        }

        &.underway {
            color: #39bb4c;
        }

        &.ended {
            color: #787d81;
        }

        &.marking {
            color: #c6690b;
        }

        &.marked {
            color: #027213;
        }

        &.submitted {
            color: var(--blue);
        }
    }
    .word-break {
        word-break: break-all;
        white-space: normal;
        max-width: 240px;
    }
</style>
