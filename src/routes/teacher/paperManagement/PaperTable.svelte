<!-- /*
 * @Author: wusaber33 
 * @Date: 2025-04-15 22:19:46 
 * @Last Modified by:   wusaber 
 * @Last Modified time: 2025-04-15 22:19:46 
 */
 -->
<script>
    // 引入 goto 函数，用于页面跳转
    import UneditableTags from "$lib/component/UneditableTag.svelte";
    import { PaperInList } from "$lib/type/paper_type";

    // 难度颜色常量
    const DIFFICULTY_COLOR_SIMPLE = "var(--green)";
    const DIFFICULTY_COLOR_MEDIUM = "var(--orange)";
    const DIFFICULTY_COLOR_HARD = "var(--red)";
    const DIFFICULTY_COLOR_DEFAULT = "var(--gray)";

    /** @type {{[key: string]: string}} */
    const ASSEMBLY_TYPE_MAP = {
        "00": "自定义组卷",
        "02": "随机组卷",
        "04": "智能刷题",
    };

    /** @type {{[key: string]: string}} */
    const LEVEL_MAP = {
        "00": "简单",
        "02": "中等",
        "04": "困难",
    };

    /** @type {{[key: string]: string}} */
    const CATEGORY_MAP = {
        "00": "考试",
        "02": "练习",
    };

    /** @type {{[key: string]: string}} */
    const ACCESS_MODE_MAP = {
        "00": "私有",
        "02": "共享",
        "04": "公有",
    };

    /**
     * 试卷列表数据
     * @type {{papers:PaperInList[];
     *         selected_papers: number[],
     *          handle_funcs: {
     *          deletePaper?: (id: number) => void,
     *          handleEditPaper?: (paper: PaperInList) => void,
     *          handlePreview?:(id:number) => void,
     *          handleShare?:(paper:PaperInList)=>void,
     *          handleShowLogs?:(id:number)=>void,
     *      };}}
     */
    let { papers = $bindable(), selected_papers = $bindable(), handle_funcs } = $props();

    // 全选/取消全选状态
    /**
     * @type {boolean} 表示是否全选
     */
    //let is_all_selected = $state(false);
    let is_all_selected = $derived.by(() =>
        papers.every((paper) => paper.selected),
    );

    // 切换全选状态
    function toggleSelectAll() {
        const currentPageIds = papers.map((paper) => paper.id); // 获取所有试卷的 id
        if (is_all_selected) {
            selected_papers = selected_papers.filter(
                (id) => !currentPageIds.includes(id),
            ); // 去除所有已选中的试卷
        } else {
            selected_papers = [
                ...new Set([...selected_papers, ...currentPageIds]),
            ];
            console.log(selected_papers); // 输出已选中的试卷 id，方便调试
        }
        is_all_selected = !is_all_selected; // 更新全选状态
        papers = papers.map((paper) => {
            return {
                ...paper,
                selected: is_all_selected,
            };
        });
    }

    // 切换单行的选中状态
    /**
     * @param {number} index - 表格行的索引
     */
    function toggleSelect(index) {
        const paper = papers[index];
        handleSelectPaper(paper.id, !paper.selected);
        paper.selected = !paper.selected;
        is_all_selected = papers.every((p) => p.selected);
    }

    // 修改：表格组件绑定使用新的选择方式
    /**
     * @param {boolean} isSelected
     * @param {number} paperId - 试卷的 ID
     */
    function handleSelectPaper(paperId, isSelected) {
        if (isSelected) {
            selected_papers = [...new Set([...selected_papers, paperId])];
        } else {
            selected_papers = selected_papers.filter((id) => id !== paperId);
        }
    }

    // 获取难度颜色
    /**
     * @param {string} level - 难度等级
     */
    function getDifficultyColor(level) {
        const levelText = LEVEL_MAP[level];
        if (levelText === "简单") {
            return DIFFICULTY_COLOR_SIMPLE;
        } else if (levelText === "中等") {
            return DIFFICULTY_COLOR_MEDIUM;
        } else if (levelText === "困难") {
            return DIFFICULTY_COLOR_HARD;
        }
        return DIFFICULTY_COLOR_DEFAULT;
    }

    // 阻止事件冒泡，避免触发复选框的点击事件
    /**
     * @param {Event} event - 事件对象
     * @param {number} index - 表格行的索引
     */
    function handleRowClick(event, index) {
        event.stopPropagation();
        toggleSelect(index);
    }
</script>

<table class="table">
    <thead>
        <tr>
            <th style="width: 48px;">
                <input
                    type="checkbox"
                    class="checkbox-all"
                    checked={is_all_selected}
                    onclick={toggleSelectAll}
                />
            </th>
            <th style="max-width: 180px; min-width: 120px; word-break: break-all;">试卷名称</th>
            <th style="width: 10%;">组卷方式</th>
            <th style="width: 3%;">试卷用途</th>
            <th style="width: 3%;">试题数量</th>
            <th style="width: 3%;">试卷总分</th>
            <th style="width: 3%;">建议时长(分)</th>
            <th style="max-width: 200px; min-width: 120px; word-break: break-all;">试卷标签</th>
            <th style="width: 80px;">试卷难度</th>
            <th style="width: 80px;">共享状态</th>
            <th style="min-width: 80px;">更新时间</th>
            <th style="min-width: 80px;">创建日期</th>
            <th style="width: 180px;">操作</th>
        </tr>
    </thead>
    <tbody>
        {#each papers as paper, index}
            <tr class={`paper ${paper.selected ? "selected" : ""}`}>
                <td
                    class="td-checkbox"
                    onclick={(event) => handleRowClick(event, index)}
                >
                    <input
                        type="checkbox"
                        class="checkbox-item"
                        checked={paper.selected}
                    />
                </td>
                <td
                    class="paper-name"
                    style="max-width: 180px; min-width: 120px; word-break: break-all; white-space: pre-line;"
                >
                    {paper.name}
                </td>
                <td>{ASSEMBLY_TYPE_MAP[paper.assembly_type]}</td>
                <td>{CATEGORY_MAP[paper.category]}</td>
                <td>{paper.question_count}</td>
                <td>{paper.total_score}</td>
                <td>{paper.duration}</td>
                <td
                    class="paper-tags-cell"
                    style="max-width: 200px; min-width: 120px; word-break: break-all; white-space: pre-line;"
                >
                    <div class="paper-tags-list">
                        {#if paper?.tags && paper.tags.length > 0}
                            <div class="paper-tags-list">
                                {#each paper.tags as tag, index}
                                    <div class="paper-tags-item">
                                        <UneditableTags content={tag} />
                                    </div>
                                {/each}
                            </div>
                        {:else}
                            <div class="no-tags-tip">暂无标签</div>
                        {/if}
                    </div>
                </td>
                <td style="color: {getDifficultyColor(paper.level)}">{LEVEL_MAP[paper.level]}</td>
                <td>
                    <span class="access-mode-tag mode-{paper.access_mode}">
                        {ACCESS_MODE_MAP[paper.access_mode]}
                    </span>
                </td>
                <td class="update_time-time">{paper.update_time}</td>
                <td>{paper.create_time}</td>
                <td>
                    <div class="actions">
                        <div class="action-row">
                            <button
                                class="action-btn"
                                onclick={() => handle_funcs?.handleEditPaper?.(paper)}
                            >修改</button>
                            <button
                                class="action-btn"
                                onclick={() => handle_funcs?.handleShare?.(paper)}
                            >共享</button>
                            <button
                                class="action-btn"
                                onclick={() => handle_funcs?.handlePreview?.(paper.id)}
                            >预览</button>
                        </div>
                        <div class="action-row">
                            <button
                                class="action-btn"
                                onclick={() => handle_funcs?.handleShowLogs?.(paper.id)}
                            >日志</button>
                            <button
                                class="action-btn delete"
                                onclick={() => handle_funcs?.deletePaper?.(paper.id)}
                            >删除</button>
                        </div>
                    </div>
                </td>
            </tr>
        {/each}
    </tbody>
</table>

<style lang="scss" scoped>
    .table {
        width: 100%;
        border-collapse: separate;
        border-spacing: 0;
        background: #fff;
        font-size: 15px;
        th,
        td {
            border: none;
            padding: 8px 6px;
            text-align: center;
            vertical-align: middle;
        }
        th {
            white-space: nowrap;
            background-color: #ffffff;
            font-size: 14px;
            font-weight: normal;
            color: rgb(0, 0, 0, 0.3);
            border: none;
            padding: 8px;
            text-align: center;
        }
        td {
            color: #222;
            background: #fff;
            word-break: break-all;
            border-bottom: 1px solid #e0e0e0;
        }

        .paper-name {
            overflow-wrap: break-word;
            white-space: pre-line;
            word-break: break-all;
        }

        .paper-tags-cell {
            overflow-wrap: break-word;
            white-space: pre-line;
            word-break: break-all;
        }

        .paper-tags-list {
            display: flex;
            flex-wrap: wrap;
            gap: 4px 6px;
            max-height: 60px;
            overflow-y: auto;
            justify-content: center;
            align-items: flex-start;
        }

        .paper-tags-item {
            margin-bottom: 2px;
        }

        .no-tags-tip {
            color: #bbb;
            font-size: 13px;
            padding: 4px 0;
            text-align: center;
            min-height: 24px;
            width: 100%;
            display: flex;
            align-items: center;
            justify-content: center;
        }
        thead {
            position: sticky;
            top: 0;
            z-index: 2;
        }

        tbody tr {
            transition: background 0.2s;
            &:hover {
                background: #f0f6ff;
            }
            &.selected {
                background: #e6f7ff;
            }
        }
    }

    .actions {
        display: flex;
        flex-direction: column;
        gap: 4px;
        padding: 4px 0;

        .action-row {
            display: flex;
            justify-content: center;
            gap: 4px;
        }

        .action-btn {
            background: none;
            color: var(--blue);
            border: none;
            cursor: pointer;
            font-size: 14px;
            padding: 2px 8px;
            border-radius: var(--btn-border-radius);
            transition: all 0.2s;
            white-space: nowrap;

            &:hover {
                background: #e6f7ff;
                color: var(--blue-hover);
            }

            &.delete {
                color: var(--red);
                &:hover {
                    background: #fff2f0;
                    color: var(--red-hover);
                }
            }
        }
    }

    .access-mode-tag {
        display: inline-block;
        padding: 2px 8px;
        border-radius: var(--border-radius-sm);
        font-size: 13px;
        font-weight: 500;

        &.mode-00 {
            background: #f5f5f5;
            color: #666;
        }

        &.mode-02 {
            background: #e6f4ff;
            color: var(--blue);
        }

        &.mode-04 {
            background: #f6ffed;
            color: var(--green);
        }
    }

    .checkbox-all,
    .checkbox-item {
        width: 16px;
        height: 16px;
        cursor: pointer;
        accent-color: var(--blue);
    }

    // 响应式
    @media (max-width: 1200px) {
        .table th,
        .table td {
            font-size: 13px;
            padding: 6px 3px;
        }
        .paper-name,
        .paper-tags-cell {
            max-width: 120px !important;
            min-width: 80px !important;
        }
        .paper-tags-list {
            max-height: 40px;
        }
        .actions {
            .action-btn {
                font-size: 13px;
                padding: 2px 6px;
            }
        }
    }
    @media (max-width: 900px) {
        .table {
            font-size: 12px;
        }
        .paper-name,
        .paper-tags-cell {
            max-width: 80px !important;
            min-width: 60px !important;
        }
        .actions {
            flex-direction: row;
            flex-wrap: wrap;
            
            .action-row {
                flex: 1;
                min-width: 120px;
            }

            .action-btn {
                font-size: 12px;
                padding: 2px 4px;
            }
        }
    }
    @media (max-width: 700px) {
        .table {
            display: block;
            overflow-x: auto;
            white-space: nowrap;
        }
        .table th,
        .table td {
            min-width: 80px;
            font-size: 12px;
        }
        .paper-name,
        .paper-tags-cell {
            max-width: 60px !important;
            min-width: 40px !important;
        }
    }
</style>
