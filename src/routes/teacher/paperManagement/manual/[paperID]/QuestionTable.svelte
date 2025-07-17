<!-- /*
 * @Author: wusaber33 
 * @Date: 2025-04-15 22:19:31 
 * @Last Modified by:   wusaber 
 * @Last Modified time: 2025-04-15 22:19:31 
 */
 -->
<script>
    import UneditableTags from "$lib/component/UneditableTag.svelte";
    import { formatTimestamp } from "$lib/common/time_utils";

    // 难度颜色常量
    const DIFFICULTY_COLOR_SIMPLE = "green";
    const DIFFICULTY_COLOR_MEDIUM = "orange";
    const DIFFICULTY_COLOR_HARD = "red";
    const DIFFICULTY_COLOR_DEFAULT = "black";
    // 修改 LEVEL 定义，键改为字符串
    /** @type {Record<number, { label: string; value: string }>} */
    const LEVEL = {
        1: { label: "简单", value: "easy" },
        2: { label: "中等", value: "medium" },
        3: { label: "困难", value: "hard" },
    };
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

    /**
     * @typedef {Object} BankQuestion
     * @property {number} id - 题目ID
     * @property {number} bank_id - 所属题库ID
     * @property {string} type - 题目类型
     * @property {string} content - 题目内容
     * @property {Object} options - 题目选项
     * @property {string[]|Object} answers - 题目答案
     * @property {number} score - 题目分数
     * @property {number} difficulty - 题目难度
     * @property {string[]} tags - 题目标签
     * @property {string} analysis - 题目解析
     * @property {number} update_time - 最后修改时间
     * @property {string} title - 题目标题
     * @property {string} answer_file_path - 题目答案附件路径
     * @property {string} test_file_path - 题目测试附件路径
     * @property {string} input - 题目输入
     * @property {string} output - 题目输出
     * @property {Object} example - 示例
     * @property {boolean} expanded - 是否展开
     * @property {boolean} selected - 题目是否被选中
     * @property {boolean} isVisible - 题目是否在筛选结果中
     */
    /**
     * @type {{questions:BankQuestion[];
     *          importedQuestionIds: Set<number>
     * }}
     */
    let { questions = $bindable(), importedQuestionIds } = $props();

    let unimported = $derived.by(() => {
        return questions.filter((q) => 
            !importedQuestionIds.has(q.id) && q.isVisible
        );
    });
    // 修改后的全选逻辑
    let is_all_selected = $derived.by(() => {
        return unimported.length > 0 && unimported.every((q) => q.selected);
    });
    function toggleSelectAllState() {
        const newSelected = !is_all_selected;
        unimported.forEach((q) => {
            q.selected = newSelected;
        });
        is_all_selected = newSelected;
    }

    // 切换单行的选中状态
    /**
     * @param {number} index - 题目索引
     */
    function toggleSelectQuestion(index) {
        const question = questions[index];
        if (importedQuestionIds.has(question.id)) return;

        question.selected = !question.selected;
        updateAllSelectedState();
    }

    // 更新全选状态
    function updateAllSelectedState() {
        is_all_selected = questions.every(
            (q) => !importedQuestionIds.has(q.id) && q.selected,
        );
    }

    // 获取难度颜色
    /**
     * @param {number} difficulty - 题目难度
     * @returns {string} - 对应的颜色
     */
    function getDifficultyColor(difficulty) {
        if (difficulty === 1) return DIFFICULTY_COLOR_SIMPLE;
        else if (difficulty === 2) return DIFFICULTY_COLOR_MEDIUM;
        else if (difficulty === 3) return DIFFICULTY_COLOR_HARD;
        return DIFFICULTY_COLOR_DEFAULT;
    }

    // 阻止事件冒泡，避免触发复选框的点击事件
    /**
     * @param {MouseEvent} event - 事件对象
     * @param {number} index - 题目索引
     */
    function handleRowClick(event, index) {
        event.stopPropagation();
        toggleSelectQuestion(index);
    }
</script>

<table class="table">
    <thead>
        <tr>
            <th>
                <input
                    type="checkbox"
                    class="custom-checkbox"
                    onchange={toggleSelectAllState}
                    checked={is_all_selected}
                />
            </th>
            <th>题目内容</th>
            <th>题目类型</th>
            <th>题目难度</th>
            <th>分值</th>
            <th>更新时间</th>
            <th>标签</th>
        </tr>
    </thead>
    <tbody>
        {#each questions as question, index}
            {#if question.isVisible}
                <tr
                    class={`question ${question.selected ? "selected" : ""} ${importedQuestionIds.has(question.id) ? "disabled-row" : ""}`}
                    onclick={(event) => handleRowClick(event, index)}
                >
                    <td style="min-width:60px;">
                        {#if importedQuestionIds.has(question.id)}
                            <span class="imported-hint">已导入</span>
                        {:else}
                            <input
                                type="checkbox"
                                class="custom-checkbox"
                                disabled={importedQuestionIds.has(question.id)}
                                checked={question.selected}
                            />
                        {/if}
                    </td>
                    <td style="width:300px;"><div class="question-content">{@html question.content}</div></td>
                    <td style="width:15%;">{QUESTION_TYPE[question.type]}</td>
                    <td
                        style="width:15%;color: {getDifficultyColor(
                            question.difficulty,
                        )}"
                    >
                        {LEVEL[question.difficulty].label}
                    </td>
                    <td style="width:10%;">{question.score}</td>
                    <td style="min-width:100px">{formatTimestamp(question.update_time)}</td>
                    <td style="width:20%;">
                        <div class="paper-tags-list">
                            {#if question?.tags?.length > 0}
                            {#each question?.tags ?? [] as tag}
                                <div class="paper-tags-item">
                                    <UneditableTags content={tag} />
                                </div>
                                {/each}
                            {:else}
                                <div class="paper-tags-item">
                                    -
                                </div>
                            {/if}
                        </div></td
                    >
                </tr>
            {/if}
        {/each}
    </tbody>
</table>

<style lang="scss" scoped>
    .table {
        width: 100%;
        border-collapse: collapse;

        th {
            font-size: 12px;
            color: rgba(0, 0, 0, 0.4);
            border: none;
        }

        td {
            font-size: 14px;
            color: var(--text-primary);
            border: none;
            text-align: center;
            border-bottom: 1px solid var(--border-light);
            overflow: hidden;
        }

        thead {
            position: sticky;
            top: 0;
            background-color: white;
            z-index: 9;
        }

        th:nth-child(7),
        td:nth-child(7) {
            overflow: hidden;
            text-overflow: ellipsis;
            white-space: nowrap;
        }

        // 在 <style> 标签中添加：
        .question-content {
            width: 300px;
            max-height: 100px;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
            // 兼容性增强
            display: block;
            position: relative;

            // 可选：悬停显示完整内容
            &:hover {
                max-height: 1000px;
                white-space: normal;
                overflow: visible;
                background: white;
                box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1);
            }
        }

        // 表格行样式
        tbody {
            tr {
                &:hover {
                    background-color: #e0f0ff;
                    cursor: pointer;
                }

                &.selected {
                    background-color: #d0e8ff;

                    &:hover {
                        background-color: #c0d8ff;
                    }
                }
            }
        }
    }

    // 自定义复选框
    .custom-checkbox {
        width: 16px;
        height: 16px;
        cursor: pointer;
        accent-color: var(--blue);

        &:disabled {
            opacity: 0.6;
            cursor: not-allowed;
        }
    }

    // 新增不可用状态样式
    .disabled-row {
        opacity: 0.6;

        td:first-child {
            position: relative;
        }

        .imported-hint {
            position: absolute;
            right: 8px;
            top: 50%;
            transform: translateY(-50%);
            background: rgba(0, 0, 0, 0.7);
            color: white;
            padding: 2px 6px;
            border-radius: var(--btn-border-radius);
            font-size: 12px;
        }
    }

    // 全选复选框状态
    input[type="checkbox"]:disabled {
        cursor: not-allowed;
        background-color: #f5f5f5;
    }

    // 禁用复选框悬停提示
    .custom-checkbox[disabled]:hover {
        cursor: not-allowed;
    }
</style>
