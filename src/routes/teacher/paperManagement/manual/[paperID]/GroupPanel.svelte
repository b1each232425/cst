<!-- /*
 * @Author: wusaber33 
 * @Date: 2025-04-15 22:19:04 
 * @Last Modified by:   wusaber 
 * @Last Modified time: 2025-04-15 22:19:04 
 */
 -->

<script>
    import QuestionList from "./QuestionList.svelte";
    import { tick } from "svelte";
    import { PaperQuestion, QuestionGroup } from "$lib/type/paper_type";

    /**
     * @type {{group:QuestionGroup;
     *  crossGroupDrop: (question_id: string, source_group_id: string,target_group_id:string|number) => void,
     * isNameUnique: (name: string,exclude_id :string|number) => boolean;
     * onListTableClickEdit: (question:PaperQuestion) => void,
     * updateGroupScorePerQuestion:()=>void,
     * openQuestionImportModal:(group_id:string|number)=>void}}
     *
     * }}
     */
    let {
        group = $bindable(),
        crossGroupDrop,
        isNameUnique,
        onListTableClickEdit,
        updateGroupScorePerQuestion,
        openQuestionImportModal,
    } = $props();

    /** @type {Record<string,string>} */
    const QUESTION_TYPE = {
        "00": "单选题",
        "02": "多选题",
        "04": "判断题",
        "06": "填空题",
        "08": "简答题",
        "10": "编程题",
    };

    /**
     * 是否正在编辑题组名称
     * @type {boolean}
     */
    let is_editing_name = $state(false);

    /**
     * 编辑中的题组名称
     * @type {string}
     */
    let editing_name = $state("");
    let editing_validation_failed = $state(false);
    let editing_group_name_error = $state("");
    /**
     * @type {any}
     */
    let editInput = $state(null);

    /**
     * 处理分数变化事件
     */
    function handleScoreChange() {
        group.questions.forEach((/** @type {PaperQuestion} */ question) => {
            // 填空题（06）和简答题（08）需要处理 sub_score
            if ((question.type === "06" || question.type === "08") && Array.isArray(question.sub_score)) {
                const n = question.sub_score.length;
                const totalScore = Number(group.score_per_question) || 0;
                if (n > 0) {
                    const base = Math.floor(totalScore / n);
                    const remainder = totalScore % n;
                    // 前 remainder 个小题多 1 分
                    question.sub_score = question.sub_score.map((_, idx) => base + (idx < remainder ? 1 : 0));
                    question.score = question.sub_score.reduce((sum, s) => sum + (s ?? 0), 0);
                } else {
                    question.score = totalScore;
                }
            } else {
                // 其他题型直接赋值
                question.score = group.score_per_question;
            }
        });
        updateGroupScorePerQuestion();
    }

    /**
     * 切换展开/收起状态
     */
    function toggleExpanded() {
        group.expanded = !group.expanded;
    }

    /**
     * 开始编辑题组名称
     */
    async function startEditingName() {
        is_editing_name = true;
        editing_name = group.name;
        editing_validation_failed = false;
        editing_group_name_error = "";
        await tick();
        editInput?.focus();
    }

    /**
     * 保存题组名称
     */
    function saveGroupName() {
        const new_name = editing_name.trim();

        // 空值校验
        if (!new_name) {
            editing_validation_failed = true;
            editing_group_name_error = "名称不能为空";
            return;
        }

        // 唯一性校验
        if (!isNameUnique(new_name, group.id)) {
            editing_validation_failed = true;
            editing_group_name_error = "名称已被使用";
            return;
        }

        group.name = new_name;
        cancelEditing();
    }

    /**
     * 取消编辑
     */
    function cancelEditing() {
        is_editing_name = false;
        editing_name = "";
        editing_validation_failed = false;
        editing_group_name_error = "";
    }

    /**
     * 处理键盘事件
     * @param {KeyboardEvent} event - 键盘事件
     */
    function handleKeyDown(event) {
        if (event.key === "Enter") {
            event.preventDefault();
            saveGroupName();
        } else if (event.key === "Escape") {
            event.preventDefault();
            cancelEditing();
        }
    }
</script>

<div class="group-panel" id={String(group.id)}>
    <div class="group-header">
        <div class="header-left">
            <button
                class="toggle-btn {group.expanded ? 'expanded' : ''}"
                onclick={toggleExpanded}
            >
                <img
                    src="/paper/expand.svg"
                    alt={group.expanded ? "收起" : "展开"}
                    class="toggle-icon"
                />
            </button>
            {#if is_editing_name}
                <div class="group-title-edit">
                    <input
                        bind:this={editInput}
                        type="text"
                        bind:value={editing_name}
                        onkeydown={handleKeyDown}
                        onblur={saveGroupName}
                        class:invalid={editing_validation_failed}
                        aria-invalid={editing_validation_failed}
                    />
                    <!-- 错误提示样式与QuestionGroupList统一 -->
                    {#if editing_validation_failed}
                        <div class="error-message" role="alert">
                            {editing_group_name_error}
                        </div>
                    {/if}
                </div>
            {:else}
                <div
                    class="group-title-wrapper"
                    ondblclick={startEditingName}
                    role="button"
                    tabindex="0"
                >
                    <div
                        class="group-title-wrapper"
                        ondblclick={startEditingName}
                        role="button"
                        tabindex="0"
                    >
                        <span class="group-title"
                            >{group.name}（共{group.question_count}题，共{group.total_score}分）
                            <svg
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
                            </svg></span
                        >
                    </div>
                </div>
            {/if}
        </div>
        <div class="header-right">
            <div class="score-setting">
                <label for="score-per-question">每题分值：</label>
                <input
                    type="number"
                    id="score-per-question"
                    min="0"
                    bind:value={group.score_per_question}
                    oninput={handleScoreChange}
                />
            </div>
            <button
                class="import-btn"
                type="button"
                title="导入题目"
                onclick={() => openQuestionImportModal(group.id)}
            >
            导入题目
            </button>
        </div>
    </div>

    {#if group.expanded}
        <div class="group-content">
            <QuestionList
                bind:questions={group.questions}
                group_id={group.id}
                {crossGroupDrop}
                {onListTableClickEdit}
                {updateGroupScorePerQuestion}
                {openQuestionImportModal}
            />
        </div>
    {/if}
</div>

<style lang="scss" scoped>
    $font-size-lg: 16px;
    $font-size-md: 14px;
    $font-size-sm: 12px;
    .group-panel {
        margin-bottom: 10px;
        border: 1px solid var(--border-light);
        border-radius: var(--border-radius-md);
        background-color: var(--bg-primary);

        .group-header {
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: 10px;
            padding: 12px 16px;
            background-color: var(--bg-secondary);
            border-bottom: 1px solid var(--border-light);
            transition: background-color 0.3s;

            &:hover {
                background-color: #edf2f7;
            }

            .header-left {
                display: flex;
                align-items: center;
                width: 70%;
                gap: 8px;

                .toggle-btn {
                    background: none;
                    border: none;
                    cursor: pointer;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    border-radius: var(--btn-border-radius);
                    color: #1890ff;
                    transition: background-color 0.3s;
                    transform: rotate(180deg);

                    .toggle-icon {
                        width: 20px;
                        height: 20px;
                    }

                    &.expanded {
                        transform: rotate(0deg);
                    }
                }
                .group-title-wrapper {
                    .group-title {
                        margin: 0;
                        font-size: $font-size-lg;
                        font-weight: 600;
                        color: var(--text-primary);
                        cursor: pointer;
                        white-space: normal; // 允许换行
                        overflow-wrap: break-word; // 兼容性更好
                        word-break: break-word; // 字符内折行

                        &:hover {
                            color: #1890ff;
                        }
                    }
                }

                .group-title-edit {
                    margin: 0;
                    display: inline-flex;
                    gap: 10px;
                    align-items: center;
                    justify-content: center;
                    input {
                        font-size: $font-size-md;
                        font-weight: 500;
                        padding: 4px 8px;
                        border: 1px solid #40a9ff;
                        border-radius: var(--input-border-radius);
                        width: 30vw;
                        outline: none;
                        box-shadow: 0 0 0 2px rgba(24, 144, 255, 0.2);
                    }
                }
            }

            .header-right {
                display: flex;
                align-items: center;
                justify-content: right;
                width: 25%;
                gap: 24px;

                .score-setting {
                    display: flex;
                    align-items: center;
                    gap: 8px;

                    label {
                        min-width: 80px;
                        font-size: $font-size-md;
                        color: rgba(0, 0, 0, 0.65);
                    }

                    input {
                        width: 60px;
                        padding: 4px 8px;
                        border: 1px solid #d9d9d9;
                        border-radius: var(--input-border-radius);
                        font-size: $font-size-lg;
                        text-align: center;
                    }
                }
            }
        }

        .group-content {
            padding: 8px;
        }
    }
    /* 新增错误提示样式 */
    .error-message {
        color: var(--error-color);
        font-size: 12px;
        padding: 4px;
        background: var(--bg-secondary);
        border: 1px solid var(--border-light);
        border-radius: var(--input-border-radius);
        display: block;
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

    .import-btn {
        margin-left: 12px;
        padding: 4px 12px;
        background: #f0f6ff;
        border: 1px solid #d9d9d9;
        border-radius: var(--btn-border-radius);
        min-width: 85px;
        color: var(--blue);
        font-size: 14px;
        cursor: pointer;
        display: flex;
        align-items: center;
        gap: 4px;
        transition: background 0.2s;
        &:hover {
            background: #e6f2ff;
        }
        svg {
            vertical-align: middle;
        }
    }
</style>
