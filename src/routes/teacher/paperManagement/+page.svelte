<script>
    import { onDestroy, onMount } from "svelte";
    import Pagination from "$lib/component/Pagination.svelte";
    import Table from "./PaperTable.svelte";
    import { formatTimestamp } from "$lib/common/time_utils";
    import ActionToast from "$lib/component/ActionToast.svelte";
    import { goto } from "$app/navigation";
    import PaperSharePanel from "./PaperSharePanel.svelte";
    import { PaperInList } from "$lib/type/paper_type";
    import OperationLogPanel from "$lib/component/OperationLogPanel.svelte";
    import Title from "$lib/component/Title.svelte";
    import Dialog from "$lib/component/Dialog.svelte";
    import AwesomeLogPanel from "$lib/component/AwesomeLogPanel.svelte";
    // 转换后端数据用于显示
    /**
     * @param {Array<any>} backendData - 后端返回的数据
     */
    function transformPaperData(backendData) {
        // 处理非数组情况（如后端返回单个对象）
        const data = Array.isArray(backendData) ? backendData : [backendData];
        return backendData.map((paper) => ({
            id: paper.id,
            name: paper.name,
            assembly_type: paper.assembly_type,
            category: paper.category,
            question_count: paper.question_count,
            total_score: paper.total_score,
            duration: paper.duration,
            tags: paper.tags,
            level: paper.level,
            update_time: formatTimestamp(paper.update_time),
            create_time: formatTimestamp(paper.create_time, {
                show_date: true,
                show_time: false,
            }),
            selected: selected_papers.includes(paper.id),
            is_creator: paper.is_creator,
            creator: paper.creator,
            access_mode: paper.access_mode,
        }));
    }

    // 试卷名称搜索框的值
    /**
     * @type {string}
     * @property {string} search_name_query - 搜索框的值
     */
    let search_name_query = $state("");

    // 试卷标签搜索框的值
    /**
     * @type {string}
     * @property {string} search_tag_query - 试卷标签搜索框的值
     */
    let search_tag_query = $state("");

    // 添加防抖相关变量
    /**
     * @type {ReturnType<typeof setTimeout>}
     */
    let debounceTimeout;

    // 防抖搜索函数
    async function debouncedSearch() {
        clearTimeout(debounceTimeout);
        debounceTimeout = setTimeout(async () => {
            await fetchPaperList(
                search_name_query,
                search_tag_query,
                page,
                page_size,
            );
        }, 300); // 300ms防抖间隔
    }

    // 在组件卸载时清除定时器
    onDestroy(() => {
        clearTimeout(debounceTimeout);
    });

    // 试卷总数
    /**
     *  @type {number}
     */
    let total_paper_count = $state(0);
    // 按多少分页
    let page_size = $state(10);
    // 当前页
    let page = $state(1);
    // 总页数
    let total_page = $derived.by(() =>
        Math.ceil(total_paper_count / page_size),
    );

    /**
     *
     * @param {boolean} is_next
     */
    function handlePageChange(is_next) {
        if (is_next) {
            page += 1;
        } else {
            page -= 1;
        }
        fetchPaperList(search_name_query, search_tag_query, page, page_size);
    }

    /**
     *
     * @param {number} choose_page
     */
    function handlePageChoose(choose_page) {
        page = choose_page;
        fetchPaperList(search_name_query, search_tag_query, page, page_size);
    }

    /**
     *
     * @param {any} value
     */
    function handleSelectOption(value) {
        page_size = value;
        fetchPaperList(search_name_query, search_tag_query, page, page_size);
    }

    /**
     * @type {boolean}
     */
    let isLoading = $state(false);

    /**
     * @type {string}
     */
    let errorMessage = $state("");

    /**
     * 试卷列表数据
     * @type {Array<PaperInList>}
     */
    let paper_list = $state([]);

    onMount(async () => {
        isLoading = true;
        errorMessage = "";
        try {
            await fetchPaperList();
        } catch (error) {
            if (error instanceof Error) {
                errorMessage = `加载失败: ${error.message}`;
            } else {
                errorMessage = "加载失败: 未知错误";
            }
        } finally {
            isLoading = false;
        }
    });

    // 处理从后端获取的试卷列表数据

    async function fetchPaperList(
        name = "",
        tags = "",
        page = 1,
        page_size = 10,
    ) {
        // 构造查询参数
        const searchParams = new URLSearchParams({
            name: name,
            tags: tags,
            page: page.toString(),
            page_size: page_size.toString(),
        });

        // 发送带参数的GET请求
        const response = await fetch(`/api/paper?${searchParams}`, {
            method: "GET",
            credentials: "include",
        });

        if (!response.ok) {
            const responseMsg = await response.text();
            console.error("获取试卷列表失败", responseMsg);
            actionToast.show("error", responseMsg);
            return;
        }
        const result = await response.json();
        if (result.status === 0) {
            if (result.data.paper_list == null) {
                actionToast.show(
                    "custom",
                    "没有找到符合条件的试卷",
                    "/dialog/tip.svg",
                );
                return;
            }
            paper_list = transformPaperData(result.data.paper_list);
            total_paper_count = result.data.total_count;
            total_page = Math.ceil(total_paper_count / page_size);
        } else {
            console.error("获取试卷列表失败", result.msg);
            actionToast.show("error", "获取试卷列表失败" + result.msg);
        }
    }

    /**
     * @type {number[]}
     */
    let selected_papers = $state([]);
    // 重置搜索框和标签选择状态
    function resetFilters() {
        search_name_query = ""; // 重置搜索框
        search_tag_query = ""; // 重置标签选择
        selected_papers = []; // 重置已选试卷
        fetchPaperList(search_name_query, search_tag_query, 1, page_size);
    }

    // 删除试卷
    async function deletePaper() {
        if (!current_delete_paper_id) {
            actionToast.show("error", "请先选择想要删除的试卷");
            return;
        }
        const paper_ids = [current_delete_paper_id];
        const data = {
            paper_ids: paper_ids,
        };
        fetch(`/api/paper`, {
            credentials: "include",
            method: "DELETE",
            body: JSON.stringify({ data }),
        })
            .then((response) => response.json())
            .then((data) => {
                if (data.status == 0) {
                    console.log("删除试卷成功");
                    paper_list = paper_list.filter(
                        (row) => row.id !== current_delete_paper_id,
                    );
                    fetchPaperList(
                        search_name_query,
                        search_tag_query,
                        page,
                        page_size,
                    );
                    actionToast.show("success", "删除试卷成功");
                } else {
                    console.error("删除试卷失败");
                }
            });
    }

    // 批量删除试卷
    async function deletePapers() {
        if (selected_papers.length === 0) {
            actionToast.show("error", "请先选择想要删除的试卷");
            return;
        }
        const paper_ids = selected_papers;
        const data = {
            paper_ids: paper_ids,
        };
        const response = await fetch(`/api/paper`, {
            credentials: "include",
            method: "DELETE",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({ data }),
        });

        if (!response.ok) {
            const responseMgs = response.text();
            console.error("删除试卷失败", responseMgs);
            actionToast.show("error", "删除试卷失败");
            return;
        }
        const result = await response.json();

        if (result.status === 0) {
            // 成功提示
            actionToastIsShow = true;

            // 1. 过滤已删除的试卷（支持跨页删除）
            paper_list = paper_list.filter(
                (paper) => !paper_ids.includes(paper.id),
            );

            // 2. 清空选择状态
            selected_papers = [];

            // 3. 如果当前页已无数据，自动回退页码
            if (paper_list.length === 0 && page > 1) {
                page -= 1;
                fetchPaperList(
                    search_name_query,
                    search_tag_query,
                    page,
                    page_size,
                );
            }
            actionToast.show("success", "删除成功");
        } else {
            console.error("删除试卷失败", result.msg);
            actionToast.show("error", result.msg || "删除失败");
        }
    }

    //跳转编辑页面
    /**
     * @param {PaperInList} paper
     */
    function handleEditPaper(paper) {
        window.location.href = `${window.location.pathname}/manual/${paper.id}`;
    }

    /**
     * 预览试卷
     * @param {number} paperId
     */
    function handlePreview(paperId) {
        if (paperId && typeof paperId === "string") {
            return;
        }
        try {
            // 获取试卷详情
            fetch(`/api/paper/manual/${paperId}`, {
                method: "GET",
                credentials: "include",
            })
                .then((response) => response.json())
                .then((result) => {
                    if (result.status == 0) {
                        const preview_questions =
                            result.data.question_groups.flatMap(
                                (/** @type {any} */ group) =>
                                    group.questions.map(
                                        (
                                            /** @type {{ answers: string | any[]; }} */ question,
                                        ) => {
                                            return {
                                                ...question,
                                                group_name: group.name,
                                                answer_num:
                                                    question.answers.length,
                                            };
                                        },
                                    ),
                            );
                        localStorage.setItem(
                            "examQuestions",
                            JSON.stringify(preview_questions),
                        );
                        if (result.data.category == "00") {
                            window.location.href = "/student/studentAnswerExam";
                        } else if (result.data.category == "02") {
                            window.location.href =
                                "/student/studentAnswerPractice";
                        }
                    }
                });
        } catch (error) {
            console.error("获取试卷详情失败", error);
        }
    }

    //创建自定义组卷
    function createManualPaper() {
        goto(`${window.location.pathname}/manual/newpaper`);
    }

    // handleDeletePaper
    let deleteDialogOpen = $state(false);
    let deleteMoreDialogOpen = $state(false);
    /**
     * @type {number|null}
     */
    let current_delete_paper_id = $state(null);
    /**
     * @param {number} paper_id - 试卷
     */
    function handleDeletePaper(paper_id) {
        current_delete_paper_id = paper_id;
        deleteDialogOpen = true;
    }

    function handleDeletePapers() {
        deleteMoreDialogOpen = true;
    }

    //-----------------------------------------操作提示--------------------------------------
    //操作提示开关变量
    let actionToastIsShow = $state(false);
    /**
     * @type {any}
     */
    let actionToast = $state(null);

    //---------------------------------------共享面板---------------------------------------
    //选择设置共享的试卷
    /**
     * @type {PaperInList|null}
     */
    let currentPaper = $state(null);
    let paperSharepanelOpen = $state(false);
    /**
     * @param {PaperInList} paper
     */
    function handleSharePanelOpen(paper) {
        currentPaper = paper;
        paperSharepanelOpen = true;
    }
    //---------------------------------------操作日志面板--------------------------------------
    /**
     * @description 显示题库操作日志
     * @param {number} paper_id
     */
    async function fetchPaperLogs(page = 1, page_size = 10, paper_id) {
        console.log(page, page_size, paper_id);
        // 构建queryParams
        try {
            const res = await fetch(
                `/api/operation_logs/10/${paper_id}?page=${page}&page_size=${page_size}`,
                {
                    method: "GET",
                    credentials: "include",
                },
            );
            console.log(res);
            if (!res.ok) {
                const responseMgs = res.text();
                console.error("获取操作日志失败", responseMgs);
                actionToast.show("error", "获取操作日志失败");
                throw new Error("获取操作日志失败");
            }
            const result = await res.json();
            console.log(result);
            if (result.status !== 0) {
                console.error("获取操作日志失败", result.msg);
                actionToast.show("error", "获取操作日志失败");
                throw new Error("获取操作日志失败");
            }
            return {
                data: result.data || [],
                total: result.rowCount || 0,
            };
        } catch (error) {
            console.error("获取操作日志失败:", error);
            actionToast.show("error", "获取操作日志失败");
            throw new Error("获取操作日志失败");
        }
    }

    /**
     * @param {number} paper_id
     */
    async function showPaperLogs(paper_id) {
        try {
            const fetchFunc = (/** @type {number | undefined} */ page, /** @type {number | undefined} */ page_size) =>
                fetchPaperLogs(page, page_size, paper_id);
            await operationLogPanel.showLogPanelWithPagination(fetchFunc);
        } catch (error) {
            console.error("显示操作日志失败:", error);
        }
    }

    /**
     * @type {AwesomeLogPanel}
     */
    let operationLogPanel;
</script>

<div class="page-container">
    <Title title="试卷管理" />
    <div class="header">
        <div class="actions">
            <div class="action-item">
                <label for="search" class="label">试卷名称</label>
                <input
                    id="search"
                    type="text"
                    placeholder="搜索试卷名称"
                    bind:value={search_name_query}
                    oninput={debouncedSearch}
                    class="search-box"
                />
            </div>
            <div class="action-item">
                <label for="label-selector" class="label">试卷标签</label>
                <input
                    id="label-search"
                    type="text"
                    placeholder="搜索试卷标签"
                    bind:value={search_tag_query}
                    oninput={debouncedSearch}
                    class="search-box"
                />
            </div>
        </div>
        <div class="buttons">
            <button class="button reset" onclick={resetFilters}>重置</button>
            <button class="button delete" onclick={handleDeletePapers}
                >删除</button
            >
            <button class="button" onclick={() => createManualPaper()}>
                自定义组卷
            </button>
            <button
                class="button"
                onclick={() => actionToast.show("error", "开发中")}
            >
                随机组卷
            </button>
            <button
                class="button"
                onclick={() => {
                    actionToast.show("error", "开发中");
                }}
            >
                智能刷题
            </button>
        </div>
    </div>
    <div class="table-container">
        {#if paper_list.length === 0}
            <div class="empty-state">
                <div class="empty-icon"></div>
                <h3>暂无试卷数据</h3>
                <p>请移动到右上方"新建试卷"处创建试卷</p>
            </div>
        {:else}
            <Table
                bind:papers={paper_list}
                bind:selected_papers
                handle_funcs={{
                    deletePaper: (id) => {
                        handleDeletePaper(id);
                    },
                    handleEditPaper: (paper) => {
                        handleEditPaper(paper);
                    },
                    handlePreview: (paperId) => {
                        handlePreview(paperId);
                    },
                    handleShare: (paper) => {
                        handleSharePanelOpen(paper);
                    },
                    handleShowLogs: (paper_id) => {
                        showPaperLogs(paper_id);
                    },
                }}
            />
        {/if}
        <div class="pagination-container">
            <Pagination
                total_data_num={total_paper_count}
                total_page_num={total_page}
                selected={page_size}
                data_num_per_page_options={[
                    { value: 10, label: "10条/页" },
                    { value: 20, label: "20条/页" },
                ]}
                current_page_num={page}
                expand_direction={"up"}
                onPageChangeFunc={handlePageChange}
                onPageChooseFunc={handlePageChoose}
                onPageSearchFunc={handlePageChoose}
                selectOptionFunc={handleSelectOption}
            />
        </div>
    </div>
</div>

<PaperSharePanel
    bind:isOpen={paperSharepanelOpen}
    paper={currentPaper}
    {actionToast}
/>

<Dialog
    bind:isOpen={deleteDialogOpen}
    title="确认删除该试卷?"
    content="删除后无法恢复，请谨慎操作"
    confirmTextBackgroundColor="#E34D59"
    onConfirm={deletePaper}
/>

<Dialog
    bind:isOpen={deleteMoreDialogOpen}
    title="确认删除该试卷?"
    content="删除后无法恢复，请谨慎操作"
    confirmTextBackgroundColor="#E34D59"
    onConfirm={deletePapers}
/>

<ActionToast
    bind:isShow={actionToastIsShow}
    type="success"
    message="删除试卷成功"
    duration={2000}
    bind:this={actionToast}
/>

<AwesomeLogPanel bind:this={operationLogPanel} />

<style lang="scss" scoped>
    // 变量
    $primary-color: var(--blue);
    $primary-hover: #2563eb;
    $danger-color: var(--red);
    $danger-bg: #fff0f0;
    $success-color: var(--green);
    $gray-100: #f7f8fa;
    $gray-200: #f0f0f0;
    $gray-300: #e5e6eb;
    $gray-500: #a3a3a3;
    $gray-700: #666;
    $border-color: #e5e6eb;
    $radius: var(--btn-border-radius);
    $shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
    $font-size-sm: 14px;
    $font-size-md: 16px;
    $font-size-lg: 20px;
    $spacing: 20px;

    .page-container {
        position: relative;
        background: #fff;
        border-radius: $radius;
        box-shadow: $shadow;
        width: 100%;
        height: 100%;
        display: flex;
        flex-direction: column;
        overflow: hidden;
    }

    // Header area
    .header {
        display: flex;
        flex-wrap: wrap;
        justify-content: space-between;
        align-items: center;
        padding: 20px 20px 0 20px;

        .actions {
            display: flex;
            align-items: center;
            gap: 32px;

            .action-item {
                display: flex;
                align-items: center;
                gap: 8px;

                .label {
                    width: 80px;
                    font-size: $font-size-sm;
                    color: $gray-700;
                }

                .search-box {
                    max-width: 300px;
                    padding: 7px 12px;
                    font-size: $font-size-sm;
                    border: 1px solid $border-color;
                    border-radius: var(--input-border-radius);
                    min-height: 20px;
                    transition: all 0.3s;
                    &:focus {
                        border-color: $primary-color;
                        outline: none;
                    }
                }
            }
        }

        .buttons {
            display: flex;
            align-items: center;
            gap: 12px;
            .button {
                padding: 7px 20px;
                font-size: $font-size-sm;
                border: 1px solid var(--border-light);
                border-radius: $radius;
                background: #fff;
                min-width: 80px;
                cursor: pointer;
                transition:
                    background 0.2s,
                    border-color 0.2s,
                    color 0.2s;

                &:hover {
                    border-color: $primary-color;
                    color: $primary-color;
                }

                &.delete {
                    border-color: var(--red);
                    color: var(--red);
                    background: #fff1f0;

                    &:hover {
                        background: $danger-color;
                        color: #fff;
                    }
                }

                &.reset {
                    color: #666;
                    border-color: #e5e6eb;
                    &:hover {
                        background: #f0f6ff;
                        color: $primary-color;
                        border-color: $primary-color;
                    }
                }
            }
        }
    }

    // Pagination
    .table-container {
        flex: 1 1 auto;
        width: 100%;
        height: 100%;
        padding: 0 $spacing;
        margin-top: $spacing;
        background: #fff;
        border-radius: $radius;
        overflow: auto;
    }
    .pagination-container {
        display: flex;
        justify-content: right;
        margin: 24px 32px 0 0;
    }

    .empty-state {
        display: flex;
        flex: 1 1 auto;
        height: 100%;
        align-items: center;
        justify-content: center;
        flex-direction: column;
        text-align: center;
        padding: 0px 0 40px 0;
        background: $gray-100;
        border-radius: $radius;
        box-shadow: $shadow;

        .empty-icon {
            color: $gray-500;
            font-size: 48px;
        }

        h3 {
            color: #333;
            font-size: 28px;
            margin-bottom: 10px;
        }

        p {
            color: $gray-700;
            font-size: 16px;
            margin-bottom: 20px;
        }
    }

    // 响应式
    @media (max-width: 900px) {
        .header {
            flex-direction: column;
            align-items: flex-start;
            gap: 18px;
        }
        .table-container {
            padding: 0 4px;
        }
        .pagination-container {
            margin-right: 8px;
        }
    }
    @media (max-width: 600px) {
        .big-title {
            padding-left: 12px;
            .big-title-text {
                font-size: 16px;
            }
        }
        .header {
            padding: 10px 4px 0 4px;
            .actions {
                gap: 12px;
                .action-item .label {
                    width: 60px;
                }
            }
            .buttons .button {
                min-width: 60px;
                padding: 6px 10px;
            }
        }
        .table-container {
            margin-top: 8px;
        }
        .empty-state {
            padding: 30px 0 20px 0;
            h3 {
                font-size: 18px;
            }
            p {
                font-size: 13px;
            }
        }
    }
</style>
