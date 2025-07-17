<!-- /*
 * @Author: wusaber33 
 * @Date: 2025-04-15 22:19:26 
 * @Last Modified by:   wusaber 
 * @Last Modified time: 2025-04-15 22:19:26 
 */
 -->
<script>
    import QuestionPreview from "$lib/component/QuestionPreview/QuestionPreview.svelte";
    import "@3min/cst-tiptap/dist/style.css";
    import { PaperQuestion } from "$lib/type/paper_type";

    /**
     * @description 题目类型枚举
     */
    /** @type {Record<string,string>} */
    const QUESTION_TYPE = {
        "00": "单选题",
        "02": "多选题",
        "04": "判断题",
        "06": "填空题",
        "08": "简答题",
        "10": "编程题",
    };

    // 修改 LEVEL 定义，键改为字符串
    /** @type {Record<number, { label: string; value: string }>} */
    const LEVEL = {
        1: { label: "简单", value: "easy" },
        2: { label: "中等", value: "medium" },
        3: { label: "困难", value: "hard" },
    };

    // 在组件中定义一个辅助函数
    /**
     * @param {any} difficulty
     */
    function getLevelValue(difficulty) {
        // 处理字符串类型的数字（如 "1"）
        const numDifficulty =
            typeof difficulty === "string"
                ? parseInt(difficulty, 10)
                : difficulty;

        // 验证是否为有效数值
        if (
            typeof numDifficulty !== "number" ||
            isNaN(numDifficulty) ||
            numDifficulty < 1 ||
            numDifficulty > 3
        ) {
            return "unknown";
        }

        // 获取对应等级
        const level = LEVEL[numDifficulty];
        return level?.value || "unknown";
    }
    /**
     * @param {number} difficulty
     */
    function getLevelLabel(difficulty) {
        const level = LEVEL[difficulty];
        return level ? level.label : "未知";
    }
    /**
     * @type {{question:PaperQuestion;
     *          move?: (question: PaperQuestion,diurection:number) => void,
     *          deleteQuestion?: (id: any) => void,
     *          onListTableClickEdit:(question: PaperQuestion) => void,
     * updateGroupScorePerQuestion:()=>void
     *     }}
     */
    let {
        question = $bindable(),
        move,
        deleteQuestion,
        onListTableClickEdit,
        updateGroupScorePerQuestion,
    } = $props();

    /**
     *
     */
    function toggleExpand() {
        question.expanded = !question.expanded;
    }

    function handleDelete() {
        deleteQuestion?.(question.id);
    }

    /**
     * 处理上移题目
     */
    function handleMoveUp() {
        move?.(question, -1);
    }

    /**
     * 处理下移题目
     */
    function handleMoveDown() {
        move?.(question, +1);
    }

    /**
     * 判断是否可以编辑
     */
    function isEditable() {
        return question.type !== "10";
    }

    /**
     * 处理填空题和简答题分值
     */
    function handleScoreChange() {
        if (question.type === "06" || question.type === "08") {
            if (question.sub_score != null) {
                question.score = question.sub_score?.reduce((sum, score) => {
                    return sum + (score ?? 0); // 使用 nullish coalescing operator to handle undefined
                }, 0);
            }
            updateGroupScorePerQuestion();
        }
    }

    /**
     * 处理改变填空题和简答题分值时每题分数变化
     */
    function handleScoreInputChange() {
        if (question.type === "06" || question.type === "08") {
            const totalScore = Number(question.score) || 0;

            if (Array.isArray(question.sub_score)) {
                // 增加类型检查
                const answerCount = question.sub_score.length;

                if (answerCount > 0) {
                    // 平均分配分数（保留整数，总和为 totalScore）
                    const baseScore = Math.floor(totalScore / answerCount);
                    const remainder = totalScore % answerCount;

                    // 使用 map 生成新数组
                    question.sub_score = question.sub_score.map(
                        (_, index) => baseScore + (index < remainder ? 1 : 0),
                    );
                }
            }
        }
        updateGroupScorePerQuestion();
    }
</script>

<div class="question-item" draggable="true">
    <div class="question-header">
        <div class="header-left">
            <button
                class="toggle-btn {question.expanded ? 'expanded' : ''}"
                title="收起/展开"
                onclick={toggleExpand}
            >
                <img
                    src="/paper/expand.svg"
                    alt={question.expanded ? "收起" : "展开"}
                    class="toggle-icon"
                />
            </button>
            <div class="question-index">{question.order || "-"}</div>
            <div class="question-type">{QUESTION_TYPE[question.type]}</div>
            <div class="question-level {getLevelValue(question.difficulty)}">
                {getLevelLabel(question.difficulty)}
            </div>
        </div>
        <div class="header-right">
            <div class="score-input">
                <label for="score">分值：</label>
                <input
                    type="number"
                    id="question-score"
                    bind:value={question.score}
                    oninput={handleScoreInputChange}
                    min="0"
                />
            </div>
            <div class="question-actions">
                <button
                    class="action-btn move-up"
                    title="上移"
                    onclick={handleMoveUp}>↑</button
                >
                <button
                    class="action-btn move-down"
                    title="下移"
                    onclick={handleMoveDown}>↓</button
                >
                {#if isEditable()}
                    <button
                        class="action-btn edit"
                        title="编辑"
                        onclick={() => {
                            onListTableClickEdit(question);
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
                {/if}
                <button
                    class="action-btn delete"
                    title="删除"
                    onclick={handleDelete}>×</button
                >
            </div>
        </div>
    </div>
    <!-- 题目内容（HTML）后续需拓展其他题型 -->
    {#if question.expanded}
        <QuestionPreview {question} {handleScoreChange} />
    {/if}
</div>

<style lang="scss" scoped>
    // 通用变量（可在全局统一管理）
    $primary-color: var(--primary-color);
    $hover-primary: var(--primary-hover);
    $error-color: var(--error-color);
    $success-color: var(--green);
    $border-color: var(--border-light);
    $divider-color: var(--border-light);
    $title-color: var(--text-primary);
    $text-color: var(--text-secondary);
    $bg-header: #fafafa;
    $bg-item: #ffffff;
    $font-size-md: 14px;
    $font-size-lg: 16px;
    $shadow-light: 0 1px 2px rgba(0, 0, 0, 0.05);
    $shadow-dark: 0 3px 6px rgba(0, 0, 0, 0.1);

    .question-item {
        margin-bottom: 16px;
        border: 1px solid $divider-color;
        border-radius: var(--border-radius-sm);
        background-color: $bg-item;
        box-shadow: $shadow-light;
        max-width: 100%;
        transition: box-shadow 0.3s;
        &:hover {
            box-shadow: $shadow-dark;
        }

        .question-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            cursor: grab;
            padding: 10px 16px;
            background-color: $bg-header;
            border-bottom: 1px solid $divider-color;

            .header-left {
                display: flex;
                align-items: center;
                gap: 10px;
                flex-wrap: wrap;

                .question-index {
                    font-weight: 500;
                    font-size: $font-size-lg;
                    min-width: 24px;
                }

                .question-type {
                    padding: 2px 8px;
                    background-color: #e8f8f2;
                    color: $primary-color;
                    border-radius: var(--border-radius-sm);
                    font-size: $font-size-lg;
                }

                .question-level {
                    padding: 2px 8px;
                    border-radius: var(--border-radius-sm);
                    font-size: $font-size-lg;
                    &.easy {
                        background-color: #e8f8f2;
                        color: var(--green);
                    }
                    &.medium {
                        background-color: #fef3e6;
                        color: var(--orange);
                    }
                    &.hard {
                        background-color: #fdecee;
                        // 注意：确保颜色值带上井号
                        color: var(--red);
                    }
                }

                .question-tags {
                    display: flex;
                    flex-wrap: wrap;
                    gap: 8px;
                }
            }

            .header-right {
                display: flex;
                align-items: center;
                gap: 16px;

                .score-input {
                    display: inline-flex;
                    align-items: center;
                    gap: 4px;
                    label {
                        font-size: $font-size-md;
                        color: $text-color;
                    }
                    input {
                        width: 50px;
                        padding: 4px 8px;
                        border: 1px solid $border-color;
                        border-radius: var(--input-border-radius);
                        text-align: center;
                        font-size: $font-size-lg;
                    }
                }

                .question-actions {
                    display: flex;
                    gap: 4px;
                    .action-btn {
                        width: 30px;
                        height: 30px;
                        border-radius: var(--btn-border-radius);
                        border: 1px solid $border-color;
                        background-color: $bg-item;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        cursor: pointer;
                        font-size: $font-size-md;
                        transition: all 0.3s;

                        &:hover {
                            border-color: $primary-color;
                            color: $primary-color;
                        }

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
            }
        }

        .toggle-btn {
            width: 24px;
            height: 24px;
            border: none;
            color: $primary-color;
            display: flex;
            align-items: center;
            justify-content: center;
            background: none;
            .toggle-icon {
                width: 20px;
                height: 20px;
                transform: rotate(270deg);
            }
            &.expanded {
                .toggle-icon {
                    transform: rotate(0deg);
                }
            }
        }
    }
</style>
