<!-- /*
 * @Author: wusaber33 
 * @Date: 2025-04-15 22:19:29 
 * @Last Modified by:   wusaber 
 * @Last Modified time: 2025-04-15 22:19:29 
 */
 -->
<script>
    import QuestionItem from "./QuestionItem.svelte";
    import { PaperQuestion, QuestionGroup } from "$lib/type/paper_type";

    /**
     * @type {{ questions: Array<PaperQuestion>;
     *  group_id: string|number;
     * crossGroupDrop: (question_id:string,source_group_id: string,group_id:string|number) => void;
     * onListTableClickEdit:(question:PaperQuestion)=>void,
     * updateGroupScorePerQuestion:()=>void,
     * openQuestionImportModal:(group_id:string|number)=>void, }}
     *
     * }}
     */
    let {
        questions = $bindable(),
        group_id,
        crossGroupDrop,
        onListTableClickEdit,
        updateGroupScorePerQuestion,
        openQuestionImportModal,
    } = $props();

    // 拖拽相关状态
    /** @type {PaperQuestion|null} */
    let dragged_item = $state(null); // 是否可拖拽
    /** @type {PaperQuestion|null} */
    let dragged_over_item = $state(null); // 拖拽时的目标元素
    /** @type {boolean} */
    let is_drag_over = $state(false); // 是否有拖拽物体悬停在当前题组上

    // 处理删除题目
    /**
     * @param {string} question_id - 题目ID
     * @description 删除题目
     * @returns {void}
     */
    function handleDeleteQuestion(question_id) {
        questions = questions.filter(
            (/** @type {PaperQuestion} */ question) =>
                question.id !== question_id,
        );
    }

    // 处理题目移动
    /**
     * @param {PaperQuestion} question - 题目对象
     * @param {number} direction - 移动方向，1表示向下，-1表示向上
     * @description 移动题目
     * @returns {void}
     */
    function handleMove(question, direction) {
        const index = questions.findIndex(
            (/** @type {{ id: any; }} */ q) => q.id === question.id,
        );
        if (index === -1) return; // 如果没有找到该题目，直接返回

        const new_index = index + direction;
        if (new_index < 0 || new_index >= questions.length) return; // 越界检查

        // 交换位置
        const new_questions = [...questions];
        [new_questions[index], new_questions[new_index]] = [
            new_questions[new_index],
            new_questions[index],
        ];
        questions = new_questions;
    }

    // 拖拽开始
    /**
     * @param {DragEvent} event - 拖拽事件
     * @param {PaperQuestion} question - 题目对象
     * @description 处理拖拽开始事件
     * @returns {void}
     */
    function handleDragStart(event, question) {
        if (!dragged_item) {
            dragged_item = question;
        }
        if (event.dataTransfer) {
            event.dataTransfer.effectAllowed = "move";
            event.dataTransfer.setData(
                "application/json",
                JSON.stringify({
                    question_id: question.id,
                    source_group_id: group_id,
                }),
            );
        }
    }

    // 拖拽结束
    function handleDragEnd() {
        handleDragCancel();
    }

    // 拖拽进入
    /**
     * @param {DragEvent} event - 拖拽事件
     * @description 处理拖拽进入事件
     * @returns {void}
     */
    function handleDragOver(event) {
        event.preventDefault();
        is_drag_over = true;
    }

    // 拖拽离开
    /**
     * @param {DragEvent} event - 拖拽事件
     * @description 处理拖拽离开事件
     * @returns {void}
     */
    function handleDragLeave(event) {
        is_drag_over = false;
    }

    // 处理拖拽放下
    /**
     * @param {DragEvent} event - 拖拽事件
     * @description 处理拖拽放下事件
     * @returns {void}
     */
    function handleDrop(event) {
        event.preventDefault();

        // 尝试获取跨题组拖拽数据
        try {
            if (!event.dataTransfer) {
                return;
            }
            const json = event.dataTransfer.getData("application/json");
            if (!json) return;

            const data = JSON.parse(json);
            const { question_id, source_group_id } = data;

            // 如果是来自不同题组的拖拽
            if (source_group_id && source_group_id !== group_id) {
                crossGroupDrop(question_id, source_group_id, group_id);
            }
            // 如果是同一题组内的排序
            else if (
                dragged_item &&
                dragged_over_item &&
                source_group_id === group_id
            ) {
                const from_index = questions.findIndex(
                    (/** @type {{ id: string|number; }} */ q) =>
                        dragged_item && q.id === dragged_item.id,
                );
                const to_index = questions.findIndex(
                    (/** @type {{ id: string|number; }} */ q) =>
                        dragged_over_item && q.id === dragged_over_item.id,
                );

                if (from_index !== -1 && to_index !== -1) {
                    const new_questions = [...questions];
                    // 从数组中删除拖拽项
                    const [moved_item] = new_questions.splice(from_index, 1);
                    // 插入到目标位置
                    new_questions.splice(to_index, 0, moved_item);

                    // 更新问题列表
                    questions = new_questions;
                    // 更新索引
                }
            }
        } catch (error) {
            console.error("Error handling drop:", error);
        } finally {
            handleDragCancel();
        }
    }

    // 处理拖拽取消
    function handleDragCancel() {
        dragged_item = null;
        dragged_over_item = null;
        is_drag_over = false;
    }

    /**
     * @param {DragEvent} event - 拖拽事件
     * @param {PaperQuestion} question - 题目对象
     * @description 处理拖拽悬停在题目上事件
     * @returns {void}
     */
    function handleItemDragOver(event, question) {
        event.preventDefault();
        if (!dragged_item || dragged_item.id === question.id) return;
        dragged_over_item = question;
    }
</script>

<div
    class="question-list {is_drag_over ? 'drag-over' : ''}"
    role="list"
    ondragover={(e) => handleDragOver(e)}
    ondragleave={handleDragLeave}
    ondrop={handleDrop}
>
    {#if questions.length > 0}
        {#each questions as question, index (question.id)}
            <div
                draggable="true"
                role="listitem"
                ondragstart={(e) => handleDragStart(e, question)}
                ondragend={handleDragEnd}
                ondragover={(e) => handleItemDragOver(e, question)}
                class="question-wrapper {dragged_item === question
                    ? 'dragging'
                    : ''} {dragged_over_item === question ? 'drag-over' : ''}"
            >
                <QuestionItem
                    bind:question={questions[index]}
                    move={handleMove}
                    deleteQuestion={handleDeleteQuestion}
                    {onListTableClickEdit}
                    {updateGroupScorePerQuestion}
                ></QuestionItem>
            </div>
        {/each}
    {:else}
        <div class="empty-state">
            <div class="empty-icon">
            </div>
            <div class="empty-content">
                <h3 class="empty-title">题组暂无题目</h3>
                <p class="empty-description">可以通过以下方式快速添加题目：</p>
                <ul class="empty-actions">
                    <li>
                        <button
                            type="button"
                            class="action-item"
                            onclick={() => openQuestionImportModal(group_id)}
                            >导入题目</button
                        >
                    </li>
                </ul>
            </div>
        </div>
    {/if}
</div>

<style lang="scss" scoped>
    // 通用变量
    $primary-color: var(--primary-color);
    $hover-bg: rgba(24, 144, 255, 0.05);
    $border-color: var(--border-light);
    $text-muted: var(--text-secondary);
    $background-empty: #f9f9f9;

    // 题目列表区域
    .question-list {
        padding: 8px 0;
        min-height: 60px;
        border: 2px dashed transparent;
        transition: all 0.3s;

        &.drag-over {
            border-color: $primary-color;
            background-color: $hover-bg;
            border-radius: var(--border-radius-md);
        }

        .empty-state {
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            min-height: 300px;
            text-align: center;
            padding: 2rem;

            .empty-icon {
                margin-bottom: 1.5rem;
                color: var(--text-secondary);
            }

            .empty-title {
                color: var(--text-primary);
                font-size: 1.5rem;
                margin: 0 0 0.5rem;
            }

            .empty-description {
                color: var(--text-secondary);
                margin: 0 0 1rem;
                font-size: 0.9rem;
            }

            .empty-actions {
                list-style: none;
                padding: 0;
                margin: 0;
                display: flex;
                gap: 1rem;
                flex-wrap: wrap;
                justify-content: center;

                .action-item {
                    display: inline-flex;
                    align-items: center;
                    justify-content: center;
                    padding: 0.5rem 1rem;
                    background: #f0f6ff;
                    border-radius: var(--btn-border-radius);
                    color: $primary-color;
                    border: none;
                    cursor: pointer;
                    transition: all 0.3s ease;

                    &:hover {
                        background: #e6f2ff;
                        transform: translateY(-1px);
                    }

                    &:active {
                        transform: translateY(0);
                    }
                }
            }
        }
    }

    // 单个题目项容器
    .question-wrapper {
        position: relative;

        &.dragging {
            opacity: 0.5;
        }

        // 拖拽悬停时添加顶部指示线
        &.drag-over {
            &::before {
                content: "";
                position: absolute;
                top: -2px;
                left: 0;
                right: 0;
                height: 2px;
                background-color: $primary-color;
                z-index: 1;
            }
        }
    }
</style>
