<!-- /*
 * @Author: wusaber33 
 * @Date: 2025-04-15 22:19:20 
 * @Last Modified by:   wusaber 
 * @Last Modified time: 2025-04-15 22:19:20 
 */
 -->

<script>
    import Pagination from "$lib/component/Pagination.svelte";
    import { onMount } from "svelte";
    import QuestionTable from "./QuestionTable.svelte";
    import ReverseDropDown from "./ReverseDropDown.svelte";
    import { generateId } from "$lib/common/randomid_utils.js";
    import {
        PaperQuestion,
        PaperInfo,
        Option,
        QuestionGroup,
    } from "$lib/type/paper_type";

    /**
     * @type {{groups: Array<QuestionGroup> ;
     * selected_group: string|number | null;
     *  is_open: boolean;
     *  action_toast: any;
     * updateGroupScorePerQuestion:()=>void
     *   }}
     * }}
     */
    let {
        is_open = $bindable(),
        groups = $bindable(),
        selected_group = $bindable(null),
        action_toast,
        updateGroupScorePerQuestion,
    } = $props();
    let is_initial_loaded = $derived(is_open);
    /**
     * @typedef {Object} QuestionBank
     * @property {number} id - 题库ID
     * @property {string} name - 题库名称
     * @property {number} question_count - 题库题目数量
     * @property {boolean} selected - 是否选中
     * @property {boolean} isVisible - 题目是否在筛选结果中
     */
    /**
     * @type {Array<QuestionBank>}
     */
    let question_banks = $state([]);

    // 查询题库
    async function queryQuestionBanks() {
        // 调用查询题库接口查找题库
        const response = await fetch("/api/question-banks/list", {
            method: "GET",
            credentials: "include",
        });
        const data = await response.json();
        console.log(data);
        if (data.status === 0) {
            console.log(data.data.bank_list);
            question_banks = data.data.bank_list.map(
                (/** @type {QuestionBank} */ bank) => ({
                    ...bank,
                    selected: false,
                    isVisible: true,
                }),
            );
        } else {
            console.error("查询题库列表失败", data);
            action_toast.show("error", "查询题库列表失败");
        }
    }
    /**
     * 查询所选题库所有题目
     * @param {number} bank_id
     */
    async function queryQuestionFromBank(bank_id) {
        // 调用查询题库接口查找 bank_id 对应的题目
        const response = await fetch(
            `/api/question-banks/${bank_id}/bank-questions`,
            {
                method: "GET",
                credentials: "include",
            },
        );
        const data = await response.json();
        console.log(data);
        if (data.status === 0) {
            // 添加题库ID标识
            const newQuestions = data.data.question_list.map(
                (/** @type {BankQuestion} */ question) => ({
                    ...question,
                    bank_id: bank_id,
                    expanded: false,
                    selected: false,
                    isVisible: true,
                    // 过滤空标签并确保数组类型
                    tags: Array.isArray(question.tags)
                        ? question.tags.filter((tag) => tag.trim() !== "")
                        : [],
                }),
            );

            // 创建ID集合用于去重
            const existingIds = new Set(questions.map((q) => q.id));

            // 合并时清理旧题目标签
            const mergedQuestions = [...newQuestions, ...questions];

            // 合并时保留新题目，过滤旧重复项
            questions.forEach((oldQ) => {
                if (!existingIds.has(oldQ.id)) {
                    mergedQuestions.push(oldQ);
                    existingIds.add(oldQ.id);
                }
            });

            // 更新最终题目列表
            questions = mergedQuestions;
            // 更新标签数组（排除空值并去重）
            tags = Array.from(
                new Set(
                    questions
                        .flatMap((q) => q.tags)
                        .filter((tag) => tag.trim() !== ""),
                ),
            );
            questions.sort((a, b) => {
                const aImported = importedQuestionIds.has(a.id);
                const bImported = importedQuestionIds.has(b.id);
                return aImported === bImported ? 0 : aImported ? 1 : -1;
            });
        } else {
            console.error("查询题目列表失败", data.message);
            action_toast.show("error", "查询题目列表失败");
        }
    }

    let importedQuestionIds = $state(new Set());
    onMount(async () => {
        is_initial_loaded = true;
    });

    let bank_search_query = $state("");

    /**
     * 选择题库
     * @param {QuestionBank} bank - 题库ID
     */
    async function handleSelectBank(bank) {
        try {
            if (bank.selected) {
                await queryQuestionFromBank(bank.id);
            } else {
                questions = questions.filter(
                    (question) => question.bank_id !== bank.id,
                );
            }
        } catch (error) {
            console.error("Error selecting bank:", error);
            bank.selected = false;
        }
    }

    let question_search_query = $state("");

    let is_filter_open = $state(true);

    /** @type {string[]} */
    let tags = $state([]);
    /** @type {Array<{id: string; name: string}>} */
    const QUESTION_TYPE = [
        { id: "00", name: "单选题" },
        { id: "02", name: "多选题" },
        { id: "04", name: "判断题" },
        { id: "06", name: "填空题" },
        { id: "08", name: "简答题" },
        { id: "10", name: "编程题" },
    ];
    /** @type {Array<{id: number; label: string,value:string}>} */
    const LEVEL = [
        { id: 1, label: "简单", value: "easy" },
        { id: 2, label: "中等", value: "medium" },
        { id: 3, label: "困难", value: "hard" },
    ];

    // 选中的题型、难度和标签
    /**
     * @type {Array<string>}
     */
    let selected_question_types = $state([]);
    /**
     * @type {Array<number>}
     */
    let selected_difficulties = $state([]);
    /**
     * @type {Array<string>}
     */
    let selected_tags = $state([]);

    /**
     * 依据题型过滤
     * @param {string} type
     */
    function toggleQuestionTypeFilter(type) {
        if (selected_question_types.includes(type)) {
            selected_question_types = selected_question_types.filter(
                (t) => t !== type,
            );
        } else {
            selected_question_types = [...selected_question_types, type];
        }
        filterQuestions();
    }
    /**
     * 依据难度过滤
     * @param {number} difficulty
     */
    function toggleDifficultyFilter(difficulty) {
        if (selected_difficulties.includes(difficulty)) {
            selected_difficulties = selected_difficulties.filter(
                (l) => l !== difficulty,
            );
        } else {
            selected_difficulties = [...selected_difficulties, difficulty];
        }
        filterQuestions();
    }
    /**
     * 依据标签过滤
     * @param {string} tag
     */
    function toggleTagFilter(tag) {
        if (selected_tags.includes(tag)) {
            selected_tags = selected_tags.filter((t) => t !== tag);
        } else {
            selected_tags = [...selected_tags, tag];
        }
        filterQuestions();
    }

    //清空过滤条件
    function clearFilter() {
        selected_question_types = [];
        selected_difficulties = [];
        selected_tags = [];
        question_search_query = "";
        filterQuestions();
    }
    /**
     * @type {Array<BankQuestion>} questions - 题目列表
     * @typedef {Object} BankQuestion
     * @property {number} id - 题目ID
     * @property {number} bank_id - 所属题库ID
     * @property {string} type - 题目类型
     * @property {string} content - 题目内容
     * @property {Option[]} options - 题目选项
     * @property {(string | {index:number,answer:string,alternative_answers?:string[],score:number,grading_rule:string})[]} answers - 题目答案
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
     * */
    let questions = $state([]);

    /**
     * @type {Array<{ value: string|number; label: string;}>}
     */
    let dropdown_options = $state([]);

    let selected_count = $derived.by(() => {
        return questions.filter((q) => q.selected === true).length;
    });
    let selected_question_ids = $derived.by(() => {
        return new Set(questions.filter((q) => q.selected).map((q) => q.id));
    });

    // 按多少分页
    let page_size = $state(10);
    // 当前页
    let page = $state(1);
    // 总页数
    let total_page = $derived.by(() =>
        Math.ceil(
            questions.filter((question) => question.isVisible === true).length /
                page_size,
        ),
    );
    // 新增当前页数据派生状态
    let currentPageData = $derived.by(() => {
        const start = (page - 1) * page_size;
        const end = start + page_size;
        return questions
            .filter((question) => question.isVisible === true)
            .slice(start, end);
    });

    /**
     * 处理页数变化
     * @param {boolean} is_next
     */
    function handlePageChange(is_next) {
        if (is_next) {
            page = Math.min(page + 1, total_page);
        } else {
            page = Math.max(page - 1, 1);
        }
    }

    /**
     * 处理页数选择变化
     * @param {number} choose_page
     */
    function handlePageChoose(choose_page) {
        page = Math.max(1, Math.min(choose_page, total_page));
    }

    /**
     * 处理选择每页多少条数据
     * @param {any} value
     */
    function handleSelectOption(value) {
        page_size = value;
    }

    /**
     * 处理跳转
     * @param {string} page_input
     */
    function handleJump(page_input) {
        const new_page = parseInt(page_input);
        if (!isNaN(new_page) && new_page >= 1 && new_page <= total_page) {
            page = new_page;
        }
    }

    // 导入题目到试卷
    function confirmImportAction() {
        if (!selected_group) {
            action_toast.show("error", "请先选择题组");
            return;
        }

        //收集所有题组中已存在的bank_question_id
        const existingBankQuestionIds = new Set();
        groups.forEach((/** @type {QuestionGroup} */ group) => {
            group.questions.forEach((question) => {
                existingBankQuestionIds.add(question.bank_question_id);
            });
        });
        // 过滤出未导入的bank_question_id
        const newQuestions = questions
            .filter(
                (question) =>
                    selected_question_ids.has(question.id) &&
                    !existingBankQuestionIds.has(question.id),
            )
            .map((question) => ({
                ...question,
                id: `temp_question_${generateId()}`,
                bank_question_id: question.id,
                expanded: true,
                sub_score:
                    question.type == "06" || question.type == "08"
                        ? question.answers
                              .filter((answer) => typeof answer !== "string")
                              .map((answer) => answer.score)
                        : null,
                order: 0,
            }));
        const targetGroup = groups.find(
            (/** @type {QuestionGroup} */ group) => group.id === selected_group,
        );
        if (targetGroup) {
            // 添加新题目到题组
            targetGroup.questions = [...targetGroup.questions, ...newQuestions];

            questions = questions.map((q) => ({
                ...q,
                selected: false,
            }));
        }
        is_open = false;
        updateGroupScorePerQuestion();
        action_toast.show("success", "导入题目成功");
    }

    // 关闭导入题目面板
    function handleCloseModal() {
        is_open = false;
        clearFilter();
    }

    onMount(async () => {
        await queryQuestionBanks();
    });

    //初始化导入题目面板
    async function handleOpenModal() {
        try {
            importedQuestionIds = new Set();
            dropdown_options = [];
            // 初始化选择题组
            groups.forEach((/** @type {QuestionGroup} */ group) => {
                const suffix = `（共${group.question_count}题，共${group.total_score}分）`;
                dropdown_options.push({
                    value: group.id,
                    label: group.name + suffix,
                });
                group.questions.forEach((/** @type {PaperQuestion} */ question) => {
                    importedQuestionIds.add(question.bank_question_id);
                });
            });
            questions.sort((a, b) => {
                const aImported = importedQuestionIds.has(a.id);
                const bImported = importedQuestionIds.has(b.id);
                return aImported === bImported ? 0 : aImported ? 1 : -1;
            });
        } catch (err) {
            console.error(err);
        }
    }

    //过滤题目
    function filterQuestions() {
        if (questions.length === 0) return;
        if (
            selected_question_types.length === 0 &&
            selected_difficulties.length === 0 &&
            selected_tags.length === 0 &&
            question_search_query === ""
        ) {
            questions.forEach((q) => (q.isVisible = true));
            return;
        }

        questions.forEach((q) => {
            // 题型匹配逻辑
            const typeMatch =
                selected_question_types.length === 0 ||
                selected_question_types.includes(q.type);

            // 难度匹配逻辑
            const difficultyMatch =
                selected_difficulties.length === 0 ||
                selected_difficulties.includes(q.difficulty);

            // 标签匹配逻辑（必须包含所有选中标签）
            const tagMatch =
                selected_tags.length === 0 ||
                (q.tags.length > 0 &&
                    selected_tags.every((tag) => q.tags.includes(tag)));

            // 内容匹配逻辑
            const contentMatch =
                question_search_query === "" ||
                q.content
                    .toLowerCase()
                    .includes(question_search_query.toLowerCase());

            q.isVisible =
                typeMatch && difficultyMatch && tagMatch && contentMatch;
        });
    }

    //过滤题库
    function filterQuestionBank() {
        if (question_banks.length === 0) return;
        if (bank_search_query === "") {
            console.log(question_banks);
            question_banks.forEach((bank) => {
                bank.isVisible = true;
            });
            return;
        }
        question_banks.forEach((bank) => {
            bank.isVisible =
                bank_search_query === "" ||
                bank.name
                    .toLowerCase()
                    .includes(bank_search_query.toLowerCase());
        });
    }

    $effect(() => {
        if (is_open && is_initial_loaded) {
            is_initial_loaded = false;
            handleOpenModal();
        }
    });
</script>

{#if is_open}
    <div class="modal-overlay">
        <div class="modal-container">
            <div class="modal-header">
                <h2>从题库导入题目</h2>
                <button class="close-button" onclick={handleCloseModal}
                    >×</button
                >
            </div>
            <div class="modal-body">
                <div class="modal-layout">
                    <div class="banks-panel">
                        <div class="banks-header">
                            <h3>题库列表</h3>
                        </div>
                        <div class="banks-action">
                            <div class="banks-search">
                                <input
                                    type="text"
                                    placeholder="搜索题库"
                                    bind:value={bank_search_query}
                                    oninput={filterQuestionBank}
                                />
                            </div>
                            <span class="selected-info">
                                已选择 <strong
                                    >{question_banks.filter(
                                        (bank) => bank.selected,
                                    ).length}</strong
                                > 个题库
                            </span>
                        </div>
                        <div class="bank-list">
                            {#if question_banks.length > 0}
                                {#each question_banks as bank}
                                    {#if bank.isVisible}
                                    <div
                                        role="button"
                                        tabindex="0"
                                        class="bank-item {bank.selected
                                            ? 'selected'
                                            : ''}"
                                        onclick={() => {
                                            bank.selected = !bank.selected;
                                            handleSelectBank(bank);
                                        }}
                                        onkeydown={(event) => {
                                            if (event.key === "Enter") {
                                                bank.selected = !bank.selected;
                                                handleSelectBank(bank);
                                            }
                                        }}
                                    >
                                        <input
                                            type="checkbox"
                                            class="custom-checkbox"
                                            checked={bank.selected}
                                        />
                                        <span class="bank-name"
                                            >{bank.name}</span
                                        >
                                        <span class="bank-count"
                                            >{bank.question_count}</span
                                            >
                                        </div>
                                    {/if}
                                {/each}
                            {:else}
                                <div class="no-data">
                                    暂无题库，请教师先去创建题库
                                </div>
                            {/if}
                        </div>
                    </div>
                    <div class="questions-panel">
                        <div class="questions-action">
                            <div class="questions-search">
                                <input
                                    type="text"
                                    placeholder="搜索题目内容"
                                    bind:value={question_search_query}
                                    oninput={filterQuestions}
                                />
                            </div>
                            <div class="filter-row">
                                <div
                                    role="listbox"
                                    tabindex="0"
                                    class="filter-header"
                                    onclick={() =>
                                        (is_filter_open = !is_filter_open)}
                                    onkeydown={(event) => {
                                        if (event.key === "Enter") {
                                            is_filter_open = !is_filter_open;
                                        }
                                    }}
                                >
                                    <h3>筛选</h3>
                                    <span
                                        class="filter-icon {is_filter_open
                                            ? 'open'
                                            : ''}"
                                    >
                                        <img
                                            src="/dropdown/arrow_blue.png"
                                            alt="Dropdown Arrow"
                                            class="dropdown-arrow"
                                        />
                                    </span>
                                </div>
                                {#if is_filter_open}
                                    <div class="filter-panel">
                                        <div class="filter-item">
                                            <span class="tag-label">题型：</span
                                            >
                                            <div class="tag-list">
                                                {#each QUESTION_TYPE as type}
                                                    <span
                                                        role="button"
                                                        tabindex="0"
                                                        class="tag {selected_question_types.includes(
                                                            type.id,
                                                        )
                                                            ? 'selected'
                                                            : ''}"
                                                        onclick={() =>
                                                            toggleQuestionTypeFilter(
                                                                type.id,
                                                            )}
                                                        onkeydown={(event) => {
                                                            if (
                                                                event.key ===
                                                                "Enter"
                                                            ) {
                                                                toggleQuestionTypeFilter(
                                                                    type.id,
                                                                );
                                                            }
                                                        }}>{type.name}</span
                                                    >
                                                {/each}
                                            </div>
                                            <span class="tag-label">难度：</span
                                            >
                                            <div class="tag-list">
                                                {#each LEVEL as difficulty}
                                                    <span
                                                        role="button"
                                                        tabindex="0"
                                                        class="tag {selected_difficulties.includes(
                                                            difficulty.id,
                                                        )
                                                            ? 'selected'
                                                            : ''}"
                                                        onclick={() =>
                                                            toggleDifficultyFilter(
                                                                difficulty.id,
                                                            )}
                                                        onkeydown={(event) => {
                                                            if (
                                                                event.key ===
                                                                "Enter"
                                                            ) {
                                                                toggleDifficultyFilter(
                                                                    difficulty.id,
                                                                );
                                                            }
                                                        }}
                                                        >{difficulty.label}</span
                                                    >
                                                {/each}
                                            </div>
                                        </div>
                                        <div class="filter-item">
                                            {#if tags.length > 0}
                                                <span class="tag-label"
                                                    >标签：</span
                                                >
                                                <div class="tag-list">
                                                    {#each tags as tag}
                                                        <span
                                                            role="button"
                                                            tabindex="0"
                                                            class="tag {selected_tags.includes(
                                                                tag,
                                                            )
                                                                ? 'selected'
                                                                : ''}"
                                                            onclick={() =>
                                                                toggleTagFilter(
                                                                    tag,
                                                                )}
                                                            onkeydown={(
                                                                event,
                                                            ) => {
                                                                if (
                                                                    event.key ===
                                                                    "Enter"
                                                                ) {
                                                                    toggleTagFilter(
                                                                        tag,
                                                                    );
                                                                }
                                                            }}>{tag}</span
                                                        >
                                                    {/each}
                                                </div>
                                            {/if}
                                        </div>
                                        <button
                                            class="clear-btn"
                                            onclick={clearFilter}
                                            >清空条件</button
                                        >
                                    </div>
                                {/if}
                            </div>
                        </div>
                        <div class="questions-table-container">
                            {#if questions.length === 0}
                                <div class="empty-tip">
                                    {question_banks.some(
                                        (bank) => bank.selected,
                                    )
                                        ? "没有符合条件的题目"
                                        : "请在左侧选择题库"}
                                </div>
                            {:else}
                                <div class="question-table">
                                    <QuestionTable
                                        bind:questions={currentPageData}
                                        {importedQuestionIds}
                                    />
                                </div>
                                <div class="pagination">
                                    <Pagination
                                        total_data_num={questions.filter(
                                            (question) =>
                                                question.isVisible === true,
                                        ).length}
                                        total_page_num={total_page}
                                        selected={page_size}
                                        data_num_per_page_options={[
                                            { value: 5, label: "5条/页" },
                                            { value: 10, label: "10条/页" },
                                            { value: 20, label: "20条/页" },
                                        ]}
                                        expand_direction={"up"}
                                        current_page_num={page}
                                        onPageChangeFunc={handlePageChange}
                                        onPageChooseFunc={handlePageChoose}
                                        onPageSearchFunc={handleJump}
                                        selectOptionFunc={handleSelectOption}
                                    />
                                </div>
                            {/if}
                        </div>
                    </div>
                </div>
            </div>
            <div class="modal-footer">
                <div class="selected-count">
                    已选择 <span class="count">{selected_count}</span> 道题目
                </div>
                <div class="target-group">
                    <span>导入到题组:</span>
                    <div class="dropdown-container">
                        <ReverseDropDown
                            options={dropdown_options}
                            bind:value={selected_group}
                            placeholder="请选择题组"
                        />
                    </div>
                </div>
                <div class="action-buttons">
                    <button class="cancel-btn" onclick={handleCloseModal}
                        >取消</button
                    >
                    <button
                        class="import-btn"
                        onclick={confirmImportAction}
                        disabled={selected_question_ids.size === 0}
                    >
                        确认导入
                    </button>
                </div>
            </div>
        </div>
    </div>
{/if}

<style lang="scss" scoped>
    .modal-overlay {
        position: fixed;
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background-color: rgba(0, 0, 0, 0.5);
        display: flex;
        justify-content: center;
        align-items: center;
        z-index: 1000;
    }

    .modal-container {
        height: 90vh;
        min-width: 1100px;
        max-width: max-content;
        background-color: #fff;
        border-radius: var(--border-radius-md);
        display: flex;
        flex-direction: column;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
    }

    .modal-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 16px 24px;
        border-bottom: 1px solid var(--border-light);

        h2 {
            margin: 0;
            font-size: 20px;
            color: #333;
        }

        .close-button {
            background: none;
            border: none;
            font-size: 24px;
            cursor: pointer;
            color: #333;
        }
    }

    .modal-body {
        flex: 1;
        display: flex;
        padding: 16px;
        overflow-y: auto;
    }
    .modal-layout {
        display: flex;
        width: 100%;
        height: 100%;
        gap: 16px;
    }

    .banks-panel {
        min-width: 20%;
        border: 1px solid var(--border-light);
        border-radius: var(--border-radius-md);
        display: flex;
        flex-direction: column;
        overflow: hidden;

        .banks-header {
            padding: 12px 16px;
            background-color: var(--bg-primary);
            border-bottom: 1px solid var(--border-light);
            display: flex;
            flex-direction: column;

            h3 {
                margin: 0 0 12px 0;
                font-size: 20px;
            }
        }

        .banks-action {
            display: flex;
            flex-direction: column;
            padding: 12px 16px;
            background-color: var(--bg-primary);
            gap: 8px;
            border-bottom: 1px solid var(--border-light);

            .banks-search {
                display: flex;
                align-items: center;
                gap: 8px;

                input {
                    flex: 1;
                    width: 100%;
                    padding: 8px 12px;
                    border: 1px solid var(--border-light);
                    border-radius: var(--input-border-radius);
                    outline: none;
                }
            }

            .selected-info {
                font-size: 14px;
                color: var(--text-primary);
                display: flex;
                justify-content: right;
                strong {
                    color: #1890ff;
                }
            }
        }
        .bank-list {
            display: flex;
            flex-direction: column;
            gap: 8px;
            flex: 1;
            padding: 12px 16px;
            overflow-y: auto;

            .bank-item {
                display: flex;
                align-items: center;
                padding: 8px 12px;
                border-radius: var(--border-radius-sm);
                cursor: pointer;

                &:hover {
                    background-color: #f5f5f5;
                }

                &.selected {
                    background-color: #e6f7ff;
                }

                input[type="checkbox"] {
                    margin-right: 8px;
                }

                .bank-name {
                    flex: 1;
                    margin-left: 8px;
                    overflow: hidden;
                    text-overflow: ellipsis;
                    white-space: nowrap;
                }

                .bank-count {
                    padding: 2px 8px;
                    border-radius: var(--border-radius-lg);
                    font-size: 14px;
                }
            }

            .no-data {
                display: flex;
                text-align: center;
                justify-content: center;
                font-size: 20px;
            }
        }
    }

    .questions-panel {
        flex-grow: 1;
        border: 1px solid var(--border-light);
        border-radius: 4px;
        display: flex;
        flex-direction: column;
        overflow-y: hidden;

        .questions-action {
            display: flex;
            justify-content: space-between;
            flex-direction: column;
            padding: 12px 16px;
            background-color: var(--bg-primary);
            border-bottom: 1px solid var(--border-light);

            .questions-search {
                display: flex;
                align-items: center;
                gap: 8px;

                input {
                    flex: 1;
                    width: 100%;
                    padding: 8px 12px;
                    border: 1px solid var(--border-light);
                    border-radius: var(--input-border-radius);
                    outline: none;
                }
            }

            .filter-row {
                display: flex;
                flex-direction: column;
                background-color: #f9f9f9;

                .filter-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    padding: 12px 16px;
                    cursor: pointer;

                    h3 {
                        margin: 0;
                        font-size: 16px;
                    }

                    .filter-icon {
                        width: 16px;
                        height: 16px;
                        background-size: cover;
                        background-repeat: no-repeat;
                        display: flex;
                        justify-content: center;
                        align-items: center;
                        transform: rotate(180deg);

                        &.open {
                            transform: rotate(0deg);
                        }
                    }
                }

                .filter-panel {
                    display: flex;
                    flex-direction: column;
                    gap: 12px;
                    padding: 0 16px 12px;

                    .filter-item {
                        display: flex;
                        align-items: center;
                        gap: 8px;

                        .tag-label {
                            font-size: 12px;
                        }

                        .tag-list {
                            display: flex;
                            flex-wrap: wrap;
                            gap: 8px;

                            .tag {
                                padding: 2px 8px;
                                background-color: #f5f5f5;
                                border: 1px solid #d9d9d9;
                                border-radius: var(--btn-border-radius);
                                font-size: 12px;
                                cursor: pointer;

                                &.selected {
                                    background-color: #e6f7ff;
                                    border-color: #91d5ff;
                                    color: #1890ff;
                                }

                                &:hover {
                                    border-color: #40a9ff;
                                }
                            }
                        }
                    }

                    .clear-btn {
                        padding: 4px 8px;
                        background: none;
                        border: 1px solid #d9d9d9;
                        border-radius: var(--btn-border-radius);
                        cursor: pointer;
                        margin-left: auto;

                        &:hover {
                            color: #40a9ff;
                            border-color: #40a9ff;
                        }
                    }
                }
            }
        }
    }

    .questions-table-container {
        display: flex;
        flex-direction: column;
        flex-grow: 1;
        padding: 5px 16px;
        background-color: #fff;
        position: relative; /* 添加相对定位 */
        overflow: hidden;
        min-width: 1000px;

        .empty-tip {
            display: flex;
            align-items: center;
            justify-content: center;
            height: 200px;
            color: #00000073;
            font-size: 14px;
        }

        .question-table {
            flex-grow: 1;
            width: 100%;
            border-radius: var(--border-radius-md);
            overflow: auto;
        }

        .pagination {
            display: flex;
            position: sticky;
            justify-content: right;
            background-color: #fff; /* 与背景色一致，避免滚动时出现视觉差异 */
            z-index: 1000;
        }
    }

    .modal-footer {
        display: flex;
        justify-content: right; // 左右两侧分离
        align-items: center;
        padding: 16px 24px;
        border-top: 1px solid var(--border-light);
        gap: 30px;

        .selected-count {
            .count {
                color: var(--primary-color);
                font-weight: bold;
            }
        }
        .action-buttons {
            display: flex;
            gap: 8px;

            button {
                padding: 8px 16px;
                border-radius: var(--btn-border-radius);
                cursor: pointer;

                &.cancel-btn {
                    background: none;
                    border: 1px solid var(--border-light);

                    &:hover {
                        color: var(--primary-color);
                        border-color: var(--border-medium);
                    }
                }

                &.import-btn {
                    background-color: var(--primary-color);
                    color: white;
                    border: none;

                    &:hover {
                        background-color: var(--primary-hover);
                    }

                    &:disabled {
                        background-color: var(--border-light);
                        cursor: not-allowed;
                    }
                }
            }
        }
        .target-group {
            display: flex;
            align-items: center;
            gap: 10px;

            .dropdown-container {
                min-width: 300px;
            }

            span {
                font-size: 14px;
                color: var(--text-primary);
            }
        }
    }

    // 自定义复选框
    .custom-checkbox {
        width: 16px;
        height: 16px;
        cursor: pointer;
        accent-color: var(--primary-color);

        &:disabled {
            opacity: 0.6;
            cursor: not-allowed;
        }
    }
</style>
