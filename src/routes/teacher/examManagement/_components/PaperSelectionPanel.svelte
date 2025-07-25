<script>
    import DropdownGray from "$lib/component/DropdownGray.svelte";
    import Pagination from "$lib/component/Pagination.svelte";
    import SearchInput from "$lib/component/SearchInput.svelte";
    import UneditableTag from "$lib/component/UneditableTag.svelte";
    import { onDestroy } from "svelte";

    // 难度颜色常量
    export const DIFFICULTY_COLOR_SIMPLE = "green";
    export const DIFFICULTY_COLOR_MEDIUM = "orange";
    export const DIFFICULTY_COLOR_HARD = "red";
    export const DIFFICULTY_COLOR_DEFAULT = "black";

    const mockData = {
  status: 0,
  msg: "success",
  data: {
    total_count: 3,
    paper_list: [
      {
        id: 8881,
        name: "模拟试卷-前端基础",
        category: "00",
        assembly_type: "00",
        level: "02",
        duration: 60,
        total_score: 100,
        question_count: 10,
        tags: ["mock", "前端"],
        creator: 0,
        create_time: "2025-07-25T09:00:00Z",
        update_time: "2025-07-25T09:00:00Z",
        status: "00",
        access_mode: "00"
      },
      {
        id: 8882,
        name: "模拟试卷-数据结构",
        category: "00",
        assembly_type: "02",
        level: "04",
        duration: 90,
        total_score: 120,
        question_count: 8,
        tags: ["mock", "算法"],
        creator: 0,
        create_time: "2025-07-25T09:00:00Z",
        update_time: "2025-07-25T09:00:00Z",
        status: "00",
        access_mode: "00"
      },
      {
        id: 8883,
        name: "模拟试卷-网络协议",
        category: "00",
        assembly_type: "00",
        level: "00",
        duration: 45,
        total_score: 80,
        question_count: 12,
        tags: ["mock", "网络"],
        creator: 0,
        create_time: "2025-07-25T09:00:00Z",
        update_time: "2025-07-25T09:00:00Z",
        status: "00",
        access_mode: "00"
      }
    ]
  },
  rowCount: 3,
  method: "GET"
};

    const ASSEMBLY_TYPE_MAP = {
        '00': '自定义组卷',
        '02': '随机组卷',
        '04': '智能刷题'
    };

    const CATEGORY_MAP = {
        '00': '考试',
        '02': '练习'
    }

    const LEVEL_MAP = {
        '00': '简单',
        '02': '中等',
        '04': '困难',
    }

    let {
        show_panel = false,
        selected_id,
        selected_name,
        selected_type,
        onCancel = () => {
            console.log("取消选择");
        },
        onConfirm = (/** @type {any} */ selected_id, /** @type {any} */ selected_name, /** @type {any} */ selected_type) => {
            console.log("确定选择");
        },
    } = $props();

    //选中的试卷ID
    let paper_selected_id = $state(selected_id);

    //选中的试卷名称
    let paper_selected_name = $state(selected_name);

    //选中的试卷类型
    let paper_selected_type = $state(selected_type);

    //总数据条数
    let totals = $state(0);

    //搜索参数
    let search_params = $state({
        name: "",
        tags: "",
        page: 1,
        pageSize: 6,
    });

    //总页数
    let total_page = $derived(
        totals / search_params.pageSize
            ? Math.ceil(totals / search_params.pageSize)
            : 1,
    );

    let current_page = $state(1);

    //是否加载中
    let loading = $state(false);

    //报错
    let error = $state("");

    let paper_list = $state([]);

    /**
     * @type {number|null}
     * 防抖计时器
     */
    let name_search_timer = null;

    /**
     * @type {number|null}
     * 防抖计时器
     */
    let tags_search_timer = null;

    /**
     * @type {number|null}
     * 防抖计时器
     */
    let page_search_timer = null;

    // 获取难度颜色
    /**
     * @param {string} level - 难度等级（简单、中等、困难）
     * @returns {string} 难度对应的背景色
     */
    function getDifficultyColor(level) {
        if (level === "00") {
            return DIFFICULTY_COLOR_SIMPLE; // 简单难度为绿色
        } else if (level === "02") {
            return DIFFICULTY_COLOR_MEDIUM; // 中等难度为橙色
        } else if (level === "04") {
            return DIFFICULTY_COLOR_HARD; // 困难难度为红色
        }
        return DIFFICULTY_COLOR_DEFAULT; // 默认颜色为黑色
    }

    /**
     * @param {string} value
     * 试卷名搜索
     */
    function onSearchName(value) {
        search_params.name = value;

        //防抖逻辑
        if (name_search_timer) {
            clearTimeout(name_search_timer);
        }
        name_search_timer = setTimeout(() => {
            search_params.page = 1;
            searchPaper();
            name_search_timer = null;
        }, 300);
    }

    /**
     * @param {string} value
     * 标签搜索
     */
    function onSearchTags(value) {
        search_params.tags = value;

        //防抖逻辑
        if (tags_search_timer) {
            clearTimeout(tags_search_timer);
        }
        tags_search_timer = setTimeout(() => {
            searchPaper();
            tags_search_timer = null;
        }, 300);
    }

    /**
     * @param {string} value
     * 搜索页数
     */
    function onSearchPageFunc(value) {
        const numericValue = parseFloat(value);
        if (isNaN(numericValue) || numericValue < 1 || numericValue === null) {
            search_params.page = 1;
        } else {
            search_params.page = numericValue;
        }

        //防抖逻辑
        if (page_search_timer) {
            clearTimeout(page_search_timer);
        }
        page_search_timer = setTimeout(() => {
            searchPaper();
            page_search_timer = null;
        }, 300);
    }

    /**
     * @param {boolean} is_next
     * 上一页/下一页
     */
    function onNextOrLastPage(is_next) {
        if (loading === true) {
            return;
        }
        if (is_next && search_params.page < total_page) {
            search_params.page += 1;
            searchPaper();
        }
        if (!is_next && search_params.page > 1) {
            search_params.page -= 1;
            searchPaper();
        }
    }

    /**
     * @param {number} page
     * 页数跳转
     */
    function onPageChooseFunc(page) {
        if (loading === true) {
            return;
        }
        search_params.page = page;
        searchPaper();
    }

    //请求考试列表
    async function searchPaper() {
        loading = true;
        error = "";

        // 构建查询参数
        let query_params = new URLSearchParams();

        // 添加基础参数
        query_params.append("page", search_params.page.toString());
        query_params.append("pageSize", search_params.pageSize.toString());
        query_params.append("category","00")

        // 添加可选参数
        if (search_params.name) {
            query_params.append("name", search_params.name);
        }
        if (search_params.tags) {
            query_params.append("tags", search_params.tags);
        }

        const response = await fetch(
            `/api/paper?${query_params.toString()}`,
            {
                method: "GET",
                credentials: 'include',
                headers: {
                    "Content-Type": "application/json",
                },
            },
        );
// 如果响应状态不是200，且状态码为500，则使用mock数据
        if (!response.ok && response.status === 500) {
            const result = mockData;
            paper_list = result.data.paper_list;
            totals = result.data.total_count;
            current_page = search_params.page;
            loading = false;
            return;
        }

        const result = await response.json();

        if (result.status!== 0 ) {
            error = result.msg || "搜索失败";
            paper_list = [];
            totals = 0;
            console.error(error);
            search_params.page = current_page;
            
        } else {
            paper_list = result.data.paper_list;
            totals = result.data.total_count;
            current_page = search_params.page;
        }
        
        loading = false;
    }

    // 格式化成日期：2025-04-21
    /**
     * @param {string} iso_string
     */
    function formatDate(iso_string) {
        const date = new Date(iso_string);
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, "0");
        const day = String(date.getDate()).padStart(2, "0");
        return `${year}-${month}-${day}`;
    }

    // 格式化成日期+时分：2025-04-21 20:00
    /**
     * @param {string | number | Date} iso_string
     */
    function formatDateTime(iso_string) {
        const date = new Date(iso_string);
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, "0");
        const day = String(date.getDate()).padStart(2, "0");
        const hour = String(date.getHours()).padStart(2, "0");
        const minute = String(date.getMinutes()).padStart(2, "0");
        return `${year}-${month}-${day} ${hour}:${minute}`;
    }

    let initial_load = $derived(show_panel);

    //当打开面板时自动搜索试卷列表
    $effect(() => {
        if (show_panel && initial_load) {
            initial_load = false;
            
            paper_selected_id = selected_id;

            searchPaper();
        }
    });

    onDestroy(() => {
        if (name_search_timer !== null) {
            clearTimeout(name_search_timer);
            name_search_timer = null;
        }
        if (page_search_timer !== null) {
            clearTimeout(page_search_timer);
            page_search_timer = null;
        }
        if (tags_search_timer !== null) {
            clearTimeout(tags_search_timer);
            tags_search_timer = null;
        }
    });
</script>

<div class={show_panel ? "paper-selection-panel-container" : "hide"}>
    <div class="paper-selection-panel">
        <div class="panel-header">
            <span>选择试卷</span>
            <button class="close-btn" onclick={() => {
                paper_selected_id = selected_id;
                paper_selected_name = selected_name;
                paper_selected_type = selected_type;
                onCancel();
            }}>×</button>
        </div>
        <div class="panel-body">
            <div class="action-container">
                <div class="paper-selection-search-container">
                    <SearchInput
                        purpose_text={"搜索试卷"}
                        place_holder={"请输入试卷名"}
                        onSearchFunc={onSearchName}
                    ></SearchInput>
                </div>
                <div class="paper-selection-search-container">
                    <SearchInput
                        purpose_text={"搜索标签"}
                        place_holder={"请输入标签名"}
                        onSearchFunc={onSearchTags}
                    ></SearchInput>
                </div>
                <div class="paper-type-container">
                    <span class="paper-type-label">试卷类型</span>
                    <div class="paper-type-dropdown">
                        <DropdownGray
                            options={[
                                { value: "04", label: "全部" },
                                { value: "00", label: "自定义组卷" },
                                { value: "02", label: "随机组卷" },
                            ]}
                            selected={"04"}
                        ></DropdownGray>
                    </div>
                </div>
            </div>
            <div class="paper-selection-table-container">
                <table class="table">
                    <thead class="paper-table-head">
                        <tr class="table-head-row">
                            <th class="table-head" style="width: 30px;"></th>
                            <th class="table-head">试卷名称</th>
                            <th class="table-head">组卷方式</th>
                            <th class="table-head">试卷用途</th>
                            <th class="table-head">试题数量</th>
                            <th class="table-head">试卷总分</th>
                            <th class="table-head">建议时长(分)</th>
                            <th class="table-head">试卷标签</th>
                            <th class="table-head">试卷难度</th>
                            <th class="table-head">更新时间</th>
                            <th class="table-head">创建日期</th>
                        </tr>
                    </thead>
                    <tbody>
                        {#each paper_list as paper, index}
                            <tr class="paper-list">
                                <td>
                                    <input
                                        type="radio"
                                        class="custom-checkbox"
                                        value={paper.id}
                                        bind:group={paper_selected_id}
                                        onchange={() => {
                                            paper_list.forEach((element) => {
                                                if (
                                                    element.id === paper_selected_id
                                                ) {
                                                    paper_selected_name =
                                                        element.name;
                                                    paper_selected_type =
                                                        element.assembly_type;
                                                }
                                            });
                                        }}
                                    />
                                </td>
                                <td class="body-row paper-name-cell">
                                    {paper.name}
                                </td>
                                <td class="body-row">{ASSEMBLY_TYPE_MAP[paper.assembly_type]}</td>
                                <td class="body-row">{CATEGORY_MAP[paper.category]}</td>
                                <td class="body-row">{paper.question_count}</td>
                                <td class="body-row">{paper.total_score}</td>
                                <td class="body-row">{paper.duration}</td>
                                <td class="body-row">
                                    {#if paper.tags && paper?.tags.length>0}
                                        {#each paper?.tags ?? [] as tag, index}
                                            <div class="paper-tags-item">
                                                <UneditableTag content={tag} />
                                            </div>
                                        {/each}
                                    {:else}
                                        <span>--</span>
                                    {/if}
                                </td>
                                <td style="color: {getDifficultyColor(paper.level)};" class="body-row">{LEVEL_MAP[paper.level]}</td>
                                <td class="updated-time body-row">
                                    {formatDateTime(paper.update_time)}
                                </td>
                                <td class="body-row">{formatDate(paper.create_time)}</td>
                            </tr>
                        {/each}
                    </tbody>
                </table>
                {#if paper_list.length === 0}
                    <div class="no-data-text">暂无数据</div>
                {/if}
            </div>
            <div class="pagination-container">
                <Pagination
                    show_per_page={false}
                    current_page_num={current_page}
                    total_data_num={totals}
                    total_page_num={total_page}
                    onPageSearchFunc={onSearchPageFunc}
                    onPageChangeFunc={onNextOrLastPage}
                    {onPageChooseFunc}
                ></Pagination>
            </div>
        </div>
        <div class="panel-footer">
            <button class="btn" onclick={() => {
                paper_selected_id = selected_id;
                paper_selected_name = selected_name;
                paper_selected_type = selected_type;
                onCancel();
            }}>取消</button>
            <button class="btn save" onclick={() => {
                //将选中的试卷传递给外部
                onConfirm(
                    paper_selected_id,
                    paper_selected_name,
                    paper_selected_type,
                );
            }}>确定</button>
        </div>
    </div>
</div>

<style lang="scss" scoped>
    .hide {
        display: none;
    }

    .table {
        width: 100%;
        border-collapse: collapse;
        flex: 1;
        max-height:100px;

        th, td {
            font-size: 14px;
            color: var(--text-primary);
            color:blue;
            border: none;
            padding: 8px;
            text-align: center;
            border-top: none;
            border-left: none;
            border-right: none;
            box-sizing: border-box;
            word-wrap: break-word;
            word-break: break-all;
            white-space: normal;
            vertical-align: middle;
            height: 40px;
        }

        td {
            border-bottom: 1px solid #ddd;
            color:var(--text-primary);
        }

        th {
            color: var(--text-disabled);
            background: #fafafa;
            white-space: nowrap;
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

    .paper-table-head {
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

    .body-row{
        min-height: 50px;
        max-width: 200px;
        word-wrap: break-word;
        word-break: break-all;
        
    }

    // 自定义复选框
    .custom-checkbox {
        accent-color: var(--blue);
    }

    .paper-selection-panel-container {
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

    .paper-selection-panel {
        width: 1400px;
        min-width: 1200px;
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

    .action-container {
        display: flex;
        flex-direction: row;
        align-items: center;
        justify-content: space-between;
        padding: 0 16px;
        margin-bottom: 20px;
    }

    .paper-selection-search-container {
        flex: 0 0 300px;
    }

    .paper-type-container {
        display: flex;
        align-items: center;
        gap: 10px;
    }

    .paper-type-label {
        font-size: 14px;
        color: rgb(0, 0, 0, 0.6);
    }

    .paper-type-dropdown {
        width: 130px;
        height: 32px;
    }

    .paper-selection-table-container {
        margin: 20px 0px 0 0px;
        flex: 1;
        min-height: 450px;
        position: relative;
        display: flex;
        flex-direction: column;
    }

    .pagination-container {
        display: flex;
        justify-content: right;
        align-items: center;
        margin: 16px 0;
        padding: 0 16px;
        position: relative;
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

    .paper-list{
        border-top: none;
        border-bottom: 1px solid #ddd;
        border-left: none;
        border-right: none;
    }

    .paper-tags-item {
        display: inline-block;
        margin-right: 5px;
        margin-bottom: 2px;
    }

    .paper-name-cell {
        max-width: 250px;
        min-width: 200px;
        text-align: left;
        padding-left: 12px;
        padding-right: 12px;
    }
</style>
