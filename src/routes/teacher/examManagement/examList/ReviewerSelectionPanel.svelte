<!-- 
 /*
 * @Author: Mayux dbs45412@163.com
 * @Date: 2025-04-18 11:48:06
 * @LastEditors: Mayux && 1243805308@qq.com
 * @LastEditTime: 2025-06-20 21:45:45
 * @FilePath: \tutorial-platform-fe\src\routes\teacher\examManagement\examList\ReviewerSelectionPanel.svelte
 * @Description: 考生选择面板
 * Copyright (c) 2025 by Mayux, All Rights Reserved. 
 */ 
 -->
 <script>
    import ActionToast from "$lib/component/ActionToast.svelte";
    import GradersSelectionPanel from "../GradersSelectionPanel.svelte";

    let {
        show_panel = false,
        onCancel = () => {
            console.log("取消选择");
        },
        onConfirm = () => {},
        exam_id = 0,
    } = $props();

    const TIP_TEXT = {
        auto_mark:
            "批改方式仅适用于填空题和简答题，其他题型将默认由系统批改，自动批改：AI根据提示词对学生的答案进行打分",
        ai_mark:
            "批改方式仅适用于填空题和简答题，其他题型将默认使用自动批改，AI批改：根据提示词对学生的答案进行打分",
        multiply_mark: "每位批阅员分别批阅所有考生的试卷，最终得分取平均值",
        assignment_of_paper: "将试卷平分或按一定比例分配给不同批阅员",
        question_group_mark: "每位批阅员负责批阅某一特定题型",
        paper_by_paper: "一次批改一份完整试卷，依次完成所有题目",
        question_by_question:
            "一次批改一个题型，完成所有试卷的该题型后，再到下一个题型",
    };

    const ASSEMBLY_TYPE_MAP = {
        "00": "自定义组卷",
        "02": "随机组卷",
        "04": "智能刷题",
    };

    /**
     * @type {any[]}
     */
    let examinee_list = $state([]);

    let exam_name = $state("");
    let exam_method = $state("00")

    /**
     * @type {any[]}
     */
    let paper_configs = $state([])

    //是否加载中
    let loading = $state(false);

    //报错
    let error = $state("");

    let show_action_toast = $state(false);
    let action_toast = $state(null);

    let lockCheckTimer = $state(null);

    /**
     * @type {{ id: any; invigilator_count: any; capacity: any; }[]}
     */
    let room_selected_ids = $state([]);

    let total_capacity = $derived(
        room_selected_ids.reduce((sum, room) => sum + (room.capacity || 0), 0),
    );

    let initial_load = $derived(show_panel);

    //当打开面板时自动搜索考生列表
    $effect(() => {
        if (show_panel && initial_load) {
            initial_load = false;
            initializePanel();
        }
    });

    async function getExamDetails() {
        if (exam_id && typeof exam_id === "string") {
            console.error("examID is string");
            return;
        }

        // 获取考试详情
        const response = await fetch(
            `/api/teacher/exam/getExamDetails?exam_id=${exam_id}`,
            {
                method: "GET",
                credentials: "include",
            },
        );

        const data = await response.json();

        if (data.Status === 0) {
            //处理响应
            let exam_info = data.Data.exam_info;
            exam_id = exam_info.ID;
            exam_name = exam_info.Name;
            exam_method = exam_info.Mode;

            let exam_sessions = data.Data.exam_sessions;

            exam_sessions.forEach((element) => {
                //处理需要计算出来的属性

                const start = new Date(element.start_time);
                const end = new Date(element.end_time);
                const diffInMinutes = Math.floor(
                    (end.getTime() - start.getTime()) / (1000 * 60),
                );
                element.max_duration = diffInMinutes;

                //乱序方式
                switch (element.question_shuffled_mode) {
                    case "00":
                        element.is_question_shuffled = true;
                        element.is_option_shuffled = true;
                        break;
                    case "02":
                        element.is_question_shuffled = false;
                        element.is_option_shuffled = true;
                        break;
                    case "04":
                        element.is_question_shuffled = true;
                        element.is_option_shuffled = false;
                        break;
                    case "06":
                        element.is_question_shuffled = false;
                        element.is_option_shuffled = false;
                        break;
                    default:
                        element.is_question_shuffled = false;
                        element.is_option_shuffled = false;
                        break;
                }

                element.is_hide = false;
                element.show_graders_selection_panel = false;
                if (element.mark_config.teacher_mark_configs === null) {
                    element.mark_config.teacher_mark_configs = [];
                }
                if (element.mark_method === "00") {
                    element.mark_mode = "10";
                }
            });
            paper_configs = exam_sessions

            room_selected_ids = data.Data.exam_rooms;

            let students = data.Data.students.imported_students;
            examinee_list = students?students:[];

            // 启动计时器，每过段时间刷新用户对这个试卷的锁
            startLockCheckTimer();
        } else {
            action_toast.show("error", "获取考试详情失败");
        }
    }

    /**
     * 获取考试锁
     */
    async function getExamLock() {
        const response = await fetch(`/api/exam/${exam_id}/lock`, {
            method: "GET",
            credentials: "include",
        });
        if (response.ok) {
            const result = await response.json();
            if (result.status == -18) {
                action_toast.show("error", "考试正在被编辑，请稍后重试");
                return -18;
            } else if (result.status == -20) {
                action_toast.show("error", "用户无权访问");
                return -20;
            }
            return 0;
        } else {
            const responseMsg = await response.text();
            console.error(`获取编辑考试权限失败：${responseMsg}`);
            return -1;
        }
    }

    // 退出后释放锁
    async function releaseLock() {
        const response = await fetch(`/api/exam/${exam_id}/lock`, {
            method: "DELETE",
            credentials: "include",
        });
        if (response.ok) {
            const result = await response.json();
            if (result.status == -19) {
                action_toast.show("error", "释放编辑考试权限失败");
                return false;
            }
            return true;
        } else {
            const responseMsg = await response.text();
            action_toast.show("error", "释放编辑考试权限失败");
            console.error(`释放编辑考试权限失败：${responseMsg}`);
            return false;
        }
    }

    // 启动计时器，每过段时间刷新用户对这个试卷的锁
    function startLockCheckTimer() {
        lockCheckTimer = setInterval(() => {
            refreshLock();
        }, 60000);
    }

    //  刷新用户对考试的锁
    async function refreshLock() {
        const response = await fetch(`/api/exam/${exam_id}/lock`, {
            method: "PUT",
            credentials: "include",
        });
        if (response.ok) {
            const result = await response.json();
            if (result.status == -1) {
                action_toast.show("error", "获取编辑考试权限失败");
                clearInterval(lockCheckTimer);
                lockCheckTimer = null;
                return false;
            }
            return true;
        } else {
            const responseMsg = await response.text();
            action_toast.show("error", "获取编辑考试权限失败");
            console.error(`获取编辑考试权限失败：${responseMsg}`);
            return false;
        }
    }

    async function initializePanel() {

        // 重置存储的数组
        examinee_list = [];
        paper_configs = [];
        
        // 获取考试锁
        await getExamLock();

        // 获取考试详情
        await getExamDetails();
    }

    async function handleSave() {
        try {
            // 批阅员配置
            let reviewer_configs = []

            // 添加批阅员配置
            paper_configs.forEach(element => {
                let reviewer_config = {
                    session_id:0,
                    mark_method:"00",
                    mark_mode:"00",
                    reviewer:[],
                }

                reviewer_config.session_id = element.exam_session_id
                reviewer_config.mark_method = element.mark_method
                reviewer_config.mark_mode = element.mark_mode

                // 如果是人工批改，则记录批阅员信息
                if(element.mark_method == "00"){
                    element.mark_config.teacher_mark_configs.forEach(element => {
                        reviewer_config.reviewer.push(element.id);
                    });
                }

                if(element.mark_method === "02"){
                    reviewer_config.mark_mode = "00"
                }
                reviewer_configs.push(reviewer_config)
            });


            // 构建请求数据
            const requestData = {
                exam_id:exam_id,
                reviewer_configs:reviewer_configs,
            };

            // 创建 FormData 对象
            const formData = new FormData();
            formData.append("data", JSON.stringify(requestData));

            // 发送请求
            const response = await fetch("/api/teacher/exam/reviewer", {
                method: "PUT",
                credentials: "include",
                body: formData,
            });

            const result = await response.json();

            if (result.Status === 0) {
                action_toast?.show("success", "保存成功");
                show_panel = false;
                onConfirm();
            } else {
                action_toast?.show("error", result.Msg || "保存失败");
            }
        } catch (error) {
            console.error("保存失败:", error);
            action_toast?.show("error", "保存失败，请稍后重试");
        }
    }

    // 更新批改模式
    function updateMarkMode(paper_index) {
        const graderCount = paper_configs[paper_index].mark_config.teacher_mark_configs.length;
        if (graderCount <= 1 && paper_configs[paper_index].mark_method === "00") {
            paper_configs[paper_index].mark_mode = "10";
        } else {
            if (paper_configs[paper_index].mark_mode === "10") {
                paper_configs[paper_index].mark_mode = "02";
            }
        }
    }

    // 修改批阅员选择面板的确认回调
    function onGradersConfirm(paper_index, selected_ids) {
        paper_configs[paper_index].show_graders_selection_panel = false;
        paper_configs[paper_index].mark_config.teacher_mark_configs = selected_ids.map(
            (element) => ({
                id: element.id,
                name: element.name,
            }),
        );
        updateMarkMode(paper_index);
    }
</script>

<div class={show_panel ? "reviewer-panel-container" : "hide"}>
    <div class="reviewer-panel">
        <div class="panel-header">
            <span class="panel-header-text">配置批阅员</span>
            <button
                class="close-btn"
                onclick={async () => {
                    if (lockCheckTimer) {
                        clearInterval(lockCheckTimer);
                        lockCheckTimer = null;
                    }
                    await releaseLock();
                    show_panel = false;
                    onCancel();
                }}>×</button
            >
        </div>
        <div class="panel-body">
            <div class="exam-info">
                <div class="exam-info-row">
                    <b class="label">考试名称：</b>
                    <span>{exam_name}</span>
                </div>
                <div class="exam-info-row">
                    <b class="label">考生数量：</b>
                    <span>{examinee_list.length}</span>
                </div>
            </div>

            <div class="tabs-container">
                <div class="tabs">
                    <button class="tab-btn active"> 批阅配置 </button>
                </div>
                <div class="tab-content">
                    {#each paper_configs as _, index}
                        {@render paperConfig(index)}
                    {/each}
                </div>
            </div>
        </div>
        <div class="panel-footer">
            <button
                class="btn"
                onclick={async () => {
                    show_panel = false;
                    if (lockCheckTimer) {
                        clearInterval(lockCheckTimer);
                        lockCheckTimer = null;
                    }
                    await releaseLock();
                    onCancel();
                }}>取消</button
            >
            <button
                class="btn save"
                onclick={async () => {
                    await handleSave();
                    if (lockCheckTimer) {
                        clearInterval(lockCheckTimer);
                        lockCheckTimer = null;
                    }
                    await releaseLock();
                }}>确定</button
            >
        </div>
    </div>
</div>

{#snippet paperConfig(/** @type {number} */ paper_config_index)}
    <div class="paper-config-container">
        <div class="paper-config-head">
            <span class="paper-num">试卷{paper_config_index + 1}</span>
            <button
                class="arrow"
                onclick={() => {
                    paper_configs[paper_config_index].is_hide =
                        !paper_configs[paper_config_index].is_hide;
                }}
                ><img src="/dropdown/arrow_black.png" alt="展开/收起" /></button
            >
        </div>
        <div
            class="paper-config-body {paper_configs[paper_config_index].is_hide
                ? 'hide'
                : 'show'}"
        >
            <div class="paper-choose-container config-row">
                <span class="label-wrapper">
                    试卷：
                </span>
                <div class="config-row-content">
                    <div class = "paper-container">
                    {#if !paper_configs[paper_config_index].paper_type || !paper_configs[paper_config_index].paper_name}
                        <span class="paper-type-text">未知试卷</span
                        >
                    {:else}
                        <span class="paper-type-text"
                            >{ASSEMBLY_TYPE_MAP[
                                paper_configs[paper_config_index]
                                    .paper_type
                            ]}：</span
                        >
                        <span class="paper-name-text"
                            >{paper_configs[paper_config_index]
                                .paper_name}</span
                        >
                    {/if}
                </div>
            </div>
            </div>
            <div class="exam-time-container config-row">
                <span class="label-wrapper">
                    考试时段：
                </span>
                <div class="config-row-content">
                    <span class = "paper-name-text paper-container">
                        {new Date(paper_configs[paper_config_index].start_time).toLocaleString()} - {new Date(paper_configs[paper_config_index].end_time).toLocaleString()}
                    </span>
                </div>
            </div>
            <div class="marking-method-container config-row">
                <span class="label-wrapper">
                    <span class="required-icon">*</span>
                    批卷方式：
                </span>
                <div class="config-row-content">
                    <label class="label">
                        <input
                            type="radio"
                            bind:group={
                                paper_configs[paper_config_index].mark_method
                            }
                            value={"00"}
                            class="choice-radio-input"
                        />
                        人工批卷
                    </label>
                    <label class="label">
                        <input
                            type="radio"
                            bind:group={
                                paper_configs[paper_config_index].mark_method
                            }
                            value={"02"}
                            class="choice-radio-input"
                        />
                        自动批卷
                        <span class="tip-wrapper">
                            <img
                                src="/exam_list/tip.png"
                                alt="提示"
                                style="width: 14px; height:auto"
                            />
                            <div class="tooltip-text" style="min-width: 255px;">
                                {TIP_TEXT["auto_mark"]}
                            </div>
                        </span>
                    </label>
                </div>
            </div>
            <div
                class="grading-config-container {paper_configs[paper_config_index]
                    .mark_method !== '00'
                    ? 'hide'
                    : ' config-row'}"
            >
                <span class="label-wrapper">
                    批改配置：
                </span>
                <div class="config-row-content graders-container">
                    <div class="graders-type-1">
                        <button
                            class="add-graders-button"
                            onclick={() => {
                                paper_configs[
                                    paper_config_index
                                ].show_graders_selection_panel = true;
                            }}
                            ><img
                                src="/exam_list/add.svg"
                                alt="添加"
                                style="height: 14px; margin-right:5px"
                            />添加批阅员</button
                        >
                        {#each paper_configs[paper_config_index].mark_config.teacher_mark_configs as grader, index}
                            {#if grader.id !== 0}
                                <div class="grader-item">
                                    {grader.name}
                                    <button
                                        class="delete-button"
                                        onclick={() => {
                                            paper_configs[
                                                paper_config_index
                                            ].mark_config.teacher_mark_configs.splice(
                                                index,
                                                1,
                                            );
                                            updateMarkMode(paper_config_index);
                                        }}
                                    >
                                        x
                                    </button>
                                </div>
                            {/if}
                        {/each}
                    </div>
                </div>
            </div>
            <div class="grading-mode-container {paper_configs[paper_config_index]
                .mark_method !== '00'
                ? 'hide'
                : ' config-row'}">
                <span class="label-wrapper">
                    <span class="required-icon">*</span>
                    批改模式：
                </span>
                <div
                    class="config-row-content"
                    style="display: flex;flex-direction:column"
                >
                    {#if paper_configs[paper_config_index].mark_config.teacher_mark_configs.length > 1}
                        <span
                            class="grading-config-row-text"
                            style="padding: 2px 0 5px 0;">多人阅卷</span
                        >
                        <div class="config-row-content">
                            <label class="label" style="color: #757575;">
                                <input
                                    type="radio"
                                    bind:group={
                                        paper_configs[paper_config_index].mark_mode
                                    }
                                    value={"02"}
                                    class="choice-radio-input"
                                />
                                全卷多评
                                <span class="tip-wrapper">
                                    <img
                                        src="/exam_list/tip.png"
                                        alt="提示"
                                        style="width: 14px; height:auto"
                                    />
                                    <div
                                        class="tooltip-text"
                                        style="min-width: 200px;"
                                    >
                                        {TIP_TEXT["multiply_mark"]}
                                    </div>
                                </span>
                            </label>
                            <label class="label" style="color: #757575;">
                                <input
                                    type="radio"
                                    bind:group={
                                        paper_configs[paper_config_index].mark_mode
                                    }
                                    value={"04"}
                                    class="choice-radio-input"
                                />
                                试卷分配
                                <span class="tip-wrapper">
                                    <img
                                        src="/exam_list/tip.png"
                                        alt="提示"
                                        style="width: 14px; height:auto"
                                    />
                                    <div
                                        class="tooltip-text"
                                        style="min-width: 200px;"
                                    >
                                        {TIP_TEXT["assignment_of_paper"]}
                                    </div>
                                </span>
                            </label>
                            <label class="label" style="color: #757575;">
                                <input
                                    type="radio"
                                    bind:group={
                                        paper_configs[paper_config_index].mark_mode
                                    }
                                    value={"06"}
                                    class="choice-radio-input"
                                />
                                按题分配
                                <span class="tip-wrapper">
                                    <img
                                        src="/exam_list/tip.png"
                                        alt="提示"
                                        style="width: 14px; height:auto"
                                    />
                                    <div
                                        class="tooltip-text"
                                        style="min-width: 200px;"
                                    >
                                        {TIP_TEXT["question_group_mark"]}
                                    </div>
                                </span>
                            </label>
                        </div>
                    {:else}
                        <span
                            class="grading-config-row-text"
                            style="padding: 2px 0 5px 0;">单人阅卷</span
                        >
                        <div class="config-row-content">
                            <label class="label" style="color: #757575;">
                                <input
                                    type="radio"
                                    bind:group={
                                        paper_configs[paper_config_index].mark_mode
                                    }
                                    value={"10"}
                                    class="choice-radio-input"
                                />
                                单人批改
                            </label>
                        </div>
                    {/if}
                </div>
            </div>
        </div>
        <GradersSelectionPanel
            show_panel={paper_configs[paper_config_index]
                .show_graders_selection_panel}
            onCancel={() => {
                paper_configs[paper_config_index].show_graders_selection_panel =
                    false;
            }}
            onConfirm={(/** @type {any[]} */ selected_ids) => {
                onGradersConfirm(paper_config_index, selected_ids);
            }}
            ids={paper_configs[paper_config_index].mark_config
                .teacher_mark_configs}
        ></GradersSelectionPanel>
    </div>
{/snippet}

<ActionToast bind:isShow={show_action_toast} bind:this={action_toast} />

<style lang="scss" scoped>
    .hide {
        display: none;
    }

    .label-wrapper {
        font-size: 14px;
        width: 120px;
        text-align: right;
        display: inline-block;
        padding-right: 26px;
        .required-icon {
            color: var(--red);
            margin-right: 2px;
        }
    }

    .normal-button-container {
        width: 65%;
    }

    .paper-type-text {
                color: var(--blue);
                font-size: 14px;
            }
            .paper-name-text {
                color: black;
                font-size: 14px;
                max-width: 350px;
                word-wrap: break-word;
            }

    .grading-config-row-text {
        font-size: 12px;
    }

    .label {
        display: inline-flex;
        align-items: center;
        font-size: 14px;
        margin-right: 32px;
        gap: 4px;
        .choice-radio-input {
            margin: auto;
            accent-color: var(--blue);
        }
    }

    .tip-wrapper {
        position: relative;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        .tooltip-text {
            visibility: hidden;
            opacity: 0;
            transition: opacity 0.2s ease-in-out;
            position: absolute;
            bottom: 150%;
            left: 50%;
            transform: translateX(-50%);
            white-space: pre-line;
            background-color: white;
            border: 1px solid #d7d7d7;
            border-radius: 4px;
            padding: 6px 8px;
            font-size: 12px;
            line-height: 1.4;
            z-index: 1;
            max-width: 200px;
            min-width: 120px;
        }

        &:hover .tooltip-text {
            visibility: visible;
            opacity: 1;
        }
    }

    .paper-container{
        display: flex;
        align-items: center;
    }

    .paper-config-container {
        position: relative;
        width: 100%;
        margin-bottom: 10px;
        .paper-config-head {
            height: 40px;
            background-color: #dcdcdc;
            display: flex;
            align-items: center;
            justify-content: center;
            .paper-num {
                margin: auto;
            }
            .arrow {
                position: absolute;
                top: 10px;
                right: 10px;
                width: 26px;
                border: none;
                background-color: rgb(0, 0, 0, 0);
                cursor: pointer;
            }
        }
        .paper-config-body {
            background-color: #f2f2f2;
            padding-top: 10px;
        }
    }

    .graders-container {
        display: flex;
        flex-direction: column;
        gap: 10px;
        .graders-type-1 {
            display: flex;
            flex-direction: row;
            align-items: center;
            gap: 10px;
            flex-wrap: wrap;
        }
    }

    .reviewer-panel-container {
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

    .add-graders-button {
        border: none;
        color: #757575;
        font-size: 14px;
        display: flex;
        flex-direction: row;
        align-items: center;
        justify-content: center;
        cursor: pointer;
        padding: 0 0 0 0;
    }

    .grader-item {
        color: #757575;
        margin-right: 5px;
        font-size: 14px;
        display: flex;
        flex-direction: row;
        align-items: center;
        background-color: #dcdcdc;
        padding: 0 5px 0 10px;
        border-radius: 20px;
        min-height: 25px;
        white-space: nowrap;
        overflow: hidden; 
        text-overflow: ellipsis; 
    }

    .reviewer-panel {
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
            color: var(--test-secondary);
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

        .exam-info {
            font-size: 15px;
            margin-bottom: 16px;
            color: #444;
            background: #f5f7fa;
            padding: 12px 16px;
            border-radius: 8px;
            .exam-info-row {
                display: flex;
                align-items: center;
                margin-top: 8px;
                &:first-child {
                    margin-top: 0;
                }
                .label {
                    color: #222;
                    width: 100px;
                    text-align: right;
                    margin-right: 12px;
                }
            }
        }
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

    .delete-button {
        border: none;
        background-color: rgb(0, 0, 0, 0);
        cursor: pointer;
        color: #757575;
    }

    .config-row {
        display: flex;
        flex-direction: row;
        justify-content: center;
        padding: 5px 0 15px 0;
    }

    .paper-configs {
        width: 65%;
    }

    .config-row-content {
        width: 80%;
    }

    .tabs-container {
        margin-top: 5px;
        flex: 1;
        display: flex;
        flex-direction: column;

        .tabs {
            display: flex;
            border-bottom: 1px solid #e8e8e8;
            margin-bottom: 16px;

            .tab-btn {
                padding: 12px 24px;
                font-size: 15px;
                color: var(--text-secondary);
                background: none;
                border: none;
                cursor: pointer;
                position: relative;
                transition: all 0.3s;

                &:hover {
                    color: var(--blue);
                }

                &.active {
                    color: var(--blue);
                    font-weight: 500;

                    &::after {
                        content: "";
                        position: absolute;
                        bottom: -1px;
                        left: 0;
                        width: 100%;
                        height: 2px;
                        background-color: var(--blue);
                    }
                }
            }
        }

        .tab-content {
            flex: 1;
            display: flex;
            flex-direction: column;
            overflow: hidden;
        }
    }
</style>
