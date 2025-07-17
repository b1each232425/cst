<!-- /*
 * @Author: wusaber33 
 * @Date: 2025-04-15 22:19:16 
 * @Last Modified by:   wusaber 
 * @Last Modified time: 2025-04-15 22:19:16 
 */
 -->

<script>
    import { generateId } from "$lib/common/randomid_utils.js";
    import {tick} from 'svelte'
    import {QuestionGroup} from "$lib/type/paper_type"
    /**
     * 题组列表组件
     * @module QuestionGroupList
     * @description 该组件用于显示和管理题组列表，包括添加、删除、编辑题组名称等功能。
     */
    /**
     * @type {{ groups: QuestionGroup[];
     *          scrollToGroup?:(group_id: string|number) => void;
     *          deleteGroup?:(group_id: string|number) => void;
     * }}
     */
    let { groups = $bindable(), scrollToGroup, deleteGroup } = $props();

    /**
     * 当前正在编辑的题组ID
     * @type {string|number}
     */
    let editing_group_id = $state("");
    /**
     * 编辑中的题组名称
     * @type {string}
     */
    let editing_group_name_value = $state("");
    /**
     * 编辑状态下的输入验证失败标志
     * @type {any}
     */
    let editing_validation_failed = $state(false);
    let editing_group_name_error = $state("");

    /**
     * @type {any}
     */
    let editInput = $state(null)

    /**
     * 题组列表数据
     * @type {QuestionGroup|null}
     */
    let dragged_item = $state(null); // 被拖拽的元素
    /**
     * 被拖拽的元素上方的元素
     * @type {QuestionGroup|null}
     */
    let drag_over_item = $state(null); // 被拖拽的元素上方的元素

    /**
     * 添加新题组
     */
    async function addGroup() {
        const new_id = `temp_group_${generateId()}`;
        console.log(new_id);
        const new_name = `题组${groups.length + 1}`;
        const new_group = {
            id: new_id,
            name: new_name,
            question_count: 0,
            total_score: 0,
            questions: [],
            score_per_question: 0,
            expanded: true,
        };
        groups = [...groups, new_group];

        editing_group_id  = new_id;
        editing_group_name_value = new_name;
        editing_validation_failed = false;
        editing_group_name_error=""

        await tick();
        editInput?.focus();

    }

    // 修改的名称校验唯一性
    /**
     * @param {string} new_name
     * @param {string|number} exclude_id
     */
    function isNameUnique(new_name, exclude_id = "") {
        return !groups.some(
            (g) => g.id !== exclude_id && g.name === new_name.trim(),
        );
    }

    /**
     * 双击编辑题组名称
     * @param {QuestionGroup} group - 题组数据
     */
    async function editGroupName(group) {
        if (editing_group_id === group.id) {
            return; // 如果已经在编辑状态，则不再处理
        }
        editing_group_id = group.id;
        editing_group_name_value = group.name;
        editing_group_name_error = "";
        editing_validation_failed = false;
        await tick();
        editInput?.focus();
    }

    /**
     * 保存编辑的题组名称
     * @param {QuestionGroup} group - 题组数据
     */
    async function saveGroupName(group) {
        // 输入验证
        const new_name = editing_group_name_value?.trim();
        if (!new_name) {
            editing_validation_failed = true;
            editing_group_name_error = "名称不能为空";
            return;
        }

        if (!isNameUnique(new_name, group.id)) {
            editing_validation_failed = true;
            editing_group_name_error = "名称已被使用";
            return;
        }

        try {
            const updatedGroups = groups.map((g) =>
                g.id === group.id ? { ...g, name: new_name } : g,
            );
            groups = updatedGroups;
        } finally {
            cancelEdit();
        }
    }
    /**
     * 取消编辑的题组名称
     */
    function cancelEdit() {
        if (editing_group_id) {
            const group = groups.find(
                (/** @type {{ id: string | number; }} */ g) =>
                    g.id === editing_group_id,
            );
            if (group) {
                editing_group_name_value = group.name;
            }
        }
        editing_group_id = "";
        editing_group_name_value = "";
        editing_group_name_error = "";
        editing_validation_failed = false;
    }

    /**
     * 处理拖拽开始事件
     * @param {DragEvent} event - 拖拽事件
     * @param {QuestionGroup} group - 题组数据
     */
    async function handleDragStart(event, group) {
        dragged_item = group;
        if (event.dataTransfer) {
            event.dataTransfer.effectAllowed = "move";
            event.dataTransfer.setData("text/plain", String(group.id));
        }
    }

    /**
     * 处理拖拽结束事件
     * @param {DragEvent} event - 拖拽事件
     */
    function handleDragEnd(event) {
        dragged_item = null;
        drag_over_item = null;
    }

    /**
     * 处理拖拽经过事件
     * @param {DragEvent} event - 拖拽事件
     * @param {QuestionGroup} group - 题组数据
     */
    function handleDragOver(event, group) {
        event.preventDefault();
        if (!dragged_item || dragged_item.id === group.id) {
            return;
        }
        drag_over_item = group;
    }

    /**
     * 处理拖拽放下事件
     * @param {DragEvent} event - 拖拽事件
     */
    function handleDrop(event) {
        event.preventDefault();
        if (
            !dragged_item ||
            !drag_over_item ||
            dragged_item.id === drag_over_item.id
        ) {
            return;
        }
        const dragged_index = groups.findIndex(
            (/** @type {{ id: string|number; }} */ group) =>
                dragged_item && group.id === dragged_item.id,
        );
        const drop_index = groups.findIndex(
            (/** @type {{ id: string|number; }} */ group) =>
                drag_over_item && group.id === drag_over_item.id,
        );
        if (dragged_index !== -1 && drop_index !== -1) {
            const new_groups = [...groups];
            const [removed] = new_groups.splice(dragged_index, 1);
            new_groups.splice(drop_index, 0, removed);
            groups = new_groups;
        }
        dragged_item = null;
        drag_over_item = null;
    }
</script>

<div class="question-group-list">
    <div class="header">
        <div class="title-container">
            <h3 class="section-title">题组列表</h3>
            <div class="total-groups">共有 {groups.length} 个题组</div>
        </div>
        <div class="add-group">
            <button class="add-group-btn" onclick={addGroup}>添加题组</button>
        </div>
    </div>
    <div class="group-list">
        {#each groups as group (group.id)}
            <div
                role="button"
                tabindex="0"
                class="group-item {drag_over_item === group ? 'drag-over' : ''}"
                onclick={() => scrollToGroup?.(group.id)}
                ondragstart={(event) => handleDragStart(event, group)}
                ondragend={handleDragEnd}
                ondragover={(event) => handleDragOver(event, group)}
                ondrop={handleDrop}
                onkeydown={(event) => {
                    if (event.key === "Enter") editGroupName(group);
                }}
                draggable="true"
            >
                <div class="group-info">
                    {#if editing_group_id === group.id}
                        <div class="group-name-edit">
                            <input
                                type="text"
                                bind:value={editing_group_name_value}
                                onkeydown={(event) => {
                                    if (event.key === "Enter")
                                        saveGroupName(group);
                                    if (event.key === "Escape") cancelEdit();
                                }}
                                bind:this={editInput}
                                onblur={() => saveGroupName(group)}
                                class:invalid={editing_validation_failed}
                                aria-invalid={editing_validation_failed}
                            />
                        </div>
                        {#if editing_validation_failed}
                            <div class="error-message" role="alert">
                                {editing_group_name_error}
                            </div>
                        {/if}
                    {:else}
                        <div class="group-name">
                            {group.name}
                            <span class="group-meta"
                                >（共{group.question_count}题，共{group.total_score}分）</span
                            >
                        </div>
                    {/if}
                </div>
                <div class="group-actions">
                    <button
                        class="action-btn edit"
                        title="编辑"
                        onclick={() => {
                            editGroupName(group);
                        }}
                        aria-label="编辑题目"
                        ><svg
                            class="rename-icon"
                            viewBox="0 0 1025 1024"
                            fill="none"
                            stroke="currentColor"
                            stroke-width="2"
                            stroke-linecap="round"
                            stroke-linejoin="round"
                            width="14"
                            height="14"
                        >
                            <path
                                d="M114.445959 666.607355c-20.078238 20.078238-20.078238 46.179948 0 68.266011l174.680675 174.680675c20.078238 20.078238 54.211244 20.078238 68.266011 0l477.862075-477.862076c20.078238-20.078238 20.078238-46.179948 0-68.26601l-174.680675-174.680675c-20.078238-20.078238-54.211244-20.078238-68.26601 0L114.445959 666.607355zM760.965238 14.064605l-100.391193 100.391193 248.970157 248.970157 100.391193-100.391193c34.133005-34.133005 0-68.266011 0-68.266011L835.25472 20.088077c-2.007824-6.023472-34.133005-38.148653-74.289482-6.023472zM46.179948 728.849895L0 1024l295.150105-46.179948L46.179948 728.849895z"
                                fill="currentColor"
                            />
                        </svg></button
                    >
                    <button
                        class="action-btn delete"
                        title="删除"
                        onclick={() => deleteGroup?.(group.id)}
                    >
                        x
                    </button>
                </div>
            </div>
        {/each}
    </div>
</div>

<style lang="scss" scoped>
    // 通用变量（可考虑在全局变量文件中集中管理）
    $primary-color: #1890ff;
    $hover-primary: #40a9ff;
    $error-color: var(--red);
    $error-bg: var(--bg-thirdary);
    $border-color: var(--border-light);
    $divider-color: #eaeaea;
    $title-color: var(--text-primary);
    $text-color: var(--text-secondary);
    $hover-bg: #f5f5f5;
    $active-bg: #e6f7ff;
    $font-size-lg: 16px;
    $font-size-md: 14px;
    $font-size-sm: 12px;

    .question-group-list {
        border-radius: var(--border-radius-sm);
        padding: 10px;

        // 头部区域：标题和添加按钮
        .header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 10px;

            .title-container {
                display: flex;
                flex-direction: column;
                align-items: flex-start;

                .section-title {
                    font-size: 20px;
                    font-weight: 1000;
                    margin: 0;
                    padding-bottom: 8px;
                    color: $title-color;
                }

                .total-groups {
                    font-size: $font-size-md;
                    color: $title-color;
                    margin: 0;
                }
            }

            .add-group {
                display: flex;
                justify-content: flex-end;

                .add-group-btn {
                    padding: 6px 12px;
                    background-color: #ffffff;
                    border: 1px solid $border-color;
                    border-radius: var(--btn-border-radius);
                    cursor: pointer;
                    color: $primary-color;
                    transition: all 0.3s;
                    display: flex;
                    align-items: center;
                    gap: 4px;
                    font-size: $font-size-lg;

                    &:hover {
                        border-color: $primary-color;
                        color: $hover-primary;
                    }
                }
            }
        }

        // 题组列表区域
        .group-list {
            max-height: 450px;
            overflow-y: auto;
            border: 1px solid $divider-color;
            border-radius: var(--border-radius-sm);
        }

        // 单个题组项
        .group-item {
            position: relative;
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 12px 16px;
            margin: 5px 5px;
            border-bottom: 1px solid $divider-color;
            cursor: grab;

            // 拖拽悬停时添加顶部指示线
            &.drag-over {
                &::before {
                    content: "";
                    position: absolute;
                    top: -1px;
                    left: 0;
                    right: 0;
                    height: 1px;
                    background-color: $primary-color;
                    z-index: 2;
                }
            }

            &:last-child {
                border-bottom: none;
            }

            &:hover {
                background-color: $hover-bg;
            }

            // 题组信息（左侧内容）
            .group-info {
                display: flex;
                flex-direction: column;
                max-width: 300px;

                .group-name {
                    font-size: $font-size-lg;
                    font-weight: 500;
                    color: $title-color;
                    margin-bottom: 4px;
                    display: inline-block; // 必须设置为inline-block
                    max-width: 100%; // 限制最大宽度
                    white-space: nowrap; // 禁止换行
                    overflow: hidden; // 隐藏溢出内容
                    text-overflow: ellipsis; // 显示省略号
                }
            }

            // 题组操作按钮（右侧按钮）
            .group-actions {
                display: flex;
                gap: 4px;

                .action-btn {
                    width: 24px;
                    height: 24px;
                    border-radius: var(--btn-border-radius);
                    border: 1px solid $border-color;
                    background-color: #ffffff;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    cursor: pointer;
                    font-size: $font-size-md;
                    transition: all 0.3s;

                    &.delete {
                        &:hover {
                            border-color: $error-color;
                            color: $error-color;
                        }
                    }

                    &.edit {
                        &:hover {
                            border-color: var(--green);
                            color: var(--green);
                        }
                    }
                }
            }

            // 编辑题组名称输入框及错误信息
            .group-name-edit {
                width: 100%;
                margin-bottom: 4px;

                input {
                    width: 100%;
                    padding: 4px 8px;
                    border: 1px solid $hover-primary;
                    border-radius: var(--input-border-radius);
                    font-size: 14px;
                    font-weight: 500;
                    background-color: #ffffff;
                    outline: none;
                    box-shadow: 0 0 0 2px rgba(24, 144, 255, 0.2);

                    &.invalid {
                        border-color: $error-color;
                        background-color: $error-bg;
                    }
                }
            }

            /* 调整错误提示样式 */
            .error-message {
                color: var(--red);
                font-size: 12px;
                margin-top: 4px;
                padding: 4px;
                background: #fff1f0;
                border: 1px solid #ffccc7;
                border-radius: 4px;
                display: block; /* 确保显示 */
                animation: slide-up 0.3s ease;
            }

            @keyframes slide-up {
                from {
                    opacity: 0;
                    transform: translateY(-5px);
                }
                to {
                    opacity: 1;
                    transform: translateY(0);
                }
            }
        }
    }
</style>
