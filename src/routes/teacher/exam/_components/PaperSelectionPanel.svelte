<script>
    // import DropdownGray from "$lib/component/DropdownGray.svelte";
    import Pagination from "$lib/components/Pagination/Pagination.svelte";
    // import SearchInput from "$lib/component/SearchInput.svelte";
    // import UneditableTag from "$lib/component/UneditableTag.svelte";
    import { onDestroy } from "svelte";
    import Select from "$lib/components/Select/Select.svelte";
    import Option from "$lib/components/Select/Option.svelte";
    import {toast} from "$lib/components/Toast/Toast.js"
    // 难度颜色常量
    export const DIFFICULTY_COLOR_SIMPLE = "green";
    export const DIFFICULTY_COLOR_MEDIUM = "orange";
    export const DIFFICULTY_COLOR_HARD = "red";
    export const DIFFICULTY_COLOR_DEFAULT = "black";

    const AssemblyType_MAP = {
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
        showPanel = false,
        selectedID,
        selectedName,
        selectedType,
        onCancel = () => {
            console.log("取消选择");
        },
        onConfirm = (/** @type {any} */ selectedID, /** @type {any} */ selectedName, /** @type {any} */ selectedType) => {
            console.log("确定选择");
        },
    } = $props();

    //选中的试卷ID
    let paperSelectedID = $state(selectedID);

    //选中的试卷名称
    let paperSelectedName = $state(selectedName);

    //选中的试卷类型
    let paperSelectedType = $state(selectedType);

    //总数据条数
    let totals = $state(0);

    //搜索参数
    let searchParams = $state({
        name: "",
        tags: "",
        page: 1,
        pageSize: 10,
        category: "",
    });

    //总页数
    let totalPage = $derived(
        totals / searchParams.pageSize
            ? Math.ceil(totals / searchParams.pageSize)
            : 1,
    );

    let currentPage = $state(1);

    //是否加载中
    let loading = $state(false);

    //报错
    let error = $state("");

    let paperList = $state([]);

    /**
     * @type {number|null}
     * 防抖计时器
     */
    let nameSearchTimer = null;

    /**
     * @type {number|null}
     * 防抖计时器
     */
    let tagsSearchTimer = null;

    /**
     * @type {number|null}
     * 防抖计时器
     */
    let pageSearchTimer = null;

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
        searchParams.name = value;

        //防抖逻辑
        if (nameSearchTimer) {
            clearTimeout(nameSearchTimer);
        }
        nameSearchTimer = setTimeout(() => {
            searchParams.page = 1;
            searchPaper();
            nameSearchTimer = null;
        }, 300);
    }

    /**
     * @param {string} value
     * 标签搜索
     */
    function onSearchTags(value) {
        searchParams.tags = value;

        //防抖逻辑
        if (tagsSearchTimer) {
            clearTimeout(tagsSearchTimer);
        }
        tagsSearchTimer = setTimeout(() => {
            searchPaper();
            tagsSearchTimer = null;
        }, 300);
    }
    function handlePageChange(event) {
    if (loading === true) {
        return;
    }
    searchParams.page = event.detail;
    searchPaper();
}

    // 处理每页条数变化
    function handlePageSizeChange(event) {
        console.log("每页条数变化:", event.detail);
        searchParams.pageSize = event.detail;
        searchParams.page = 1; // 重置到第一页
        searchExam();
    }
    

    //请求考试列表
    async function searchPaper() {
        loading = true;
        error = "";

        // 构建查询参数
        let queryParams = new URLSearchParams();

        // 添加基础参数
        queryParams.append("page", searchParams.page.toString());
        queryParams.append("pageSize", searchParams.pageSize.toString());
       // queryParams.append("category","00")

        // 添加可选参数
        if (searchParams.name) {
            queryParams.append("name", searchParams.name);
        }
        if (searchParams.tags) {
            queryParams.append("tags", searchParams.tags);
        }

        if (searchParams.category) {
        queryParams.append("category", searchParams.category);
}
        const response = await fetch(
            `/api/paper?${queryParams.toString()}`,
            {
                method: "GET",
                credentials: 'include',
                headers: {
                    "Content-Type": "application/json",
                },
            },
        );
        
        const result = await response.json();
        console.log("result",result);
        if (result.status!== 0 ) {
            error = result.msg || "搜索失败";
            paperList = [];
            totals = 0;
            console.error(error);
            searchParams.page = currentPage;
            
        } else {
            paperList = result.data;
            totals = result.rowCount;
            currentPage = searchParams.page;
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
    // 添加 Select 相关状态和函数
    let selected_paper_type = $state("04");

    function onPaperTypeChange(value) {
        selected_paper_type = value;
        // 根据选择的值设置搜索参数
        if (value === "04") {
            searchParams.AssemblyType = ""; // 全部，不筛选
        } else {
            searchParams.AssemblyType = value;
        }
        searchParams.page = 1;
        searchPaper();
    }

    

        //当打开面板时自动搜索试卷列表
        $effect(() => {
           
                
                paperSelectedID = selectedID;

                searchPaper();
            
        });

    onDestroy(() => {
        if (nameSearchTimer !== null) {
            clearTimeout(nameSearchTimer);
            nameSearchTimer = null;
        }
        if (pageSearchTimer !== null) {
            clearTimeout(pageSearchTimer);
            pageSearchTimer = null;
        }
        if (tagsSearchTimer !== null) {
            clearTimeout(tagsSearchTimer);
            tagsSearchTimer = null;
        }
    });
</script>

<div class={showPanel ? "paper-selection-panel-container" : "hide"}>
    <div class="paper-selection-panel">
        <div class="panel-header">
            <span>选择试卷</span>
            <button class="close-btn" onclick={() => {
                paperSelectedID = selectedID;
                paperSelectedName = selectedName;
                paperSelectedType = selectedType;
                onCancel();
            }}>×</button>
        </div>
        <div class="panel-body">
            <div class="action-container">
                <div class="paper-selection-search-container">
                    <!-- <SearchInput
                        purpose_text={"搜索试卷"}
                        place_holder={"请输入试卷名"}
                        onSearchFunc={onSearchName}
                    ></SearchInput> -->
                </div>
                <div class="paper-selection-search-container">
                    <!-- <SearchInput
                        purpose_text={"搜索标签"}
                        place_holder={"请输入标签名"}
                        onSearchFunc={onSearchTags}
                    ></SearchInput> -->
                </div>
                <div class="paper-type-container">
                    <div class="paper-type-dropdown">

                        <Select 
                        bind:value={selected_paper_type} 
                        placeholder="试卷类型"
                        onChangeValue={onPaperTypeChange}
                    >
                        <Option value="04" label="全部"/>
                        <Option value="00" label="自定义组卷"/>
                        <Option value="02" label="随机组卷"/>
                    </Select>
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
                        {#each paperList as paper, index}
                            <tr class="paper-list">
                                <td>
                                    <input
                                        type="radio"
                                        class="custom-checkbox"
                                        value={paper.ID}
                                        bind:group={paperSelectedID}
                                        onchange={() => {
                                            paperList.forEach((element) => {
                                                if (
                                                    element.ID === paperSelectedID
                                                ) {
                                                    paperSelectedName =
                                                        element.Name;
                                                    paperSelectedType =
                                                        element.AssemblyType;
                                                }
                                            });
                                        }}
                                    />
                                </td>
                                <td class="body-row paper-name-cell">
                                    {paper.Name}
                                </td>
                                <td class="body-row">{AssemblyType_MAP[paper.AssemblyType]}</td>
                                <td class="body-row">{CATEGORY_MAP[paper.Category]}</td>
                                <td class="body-row">{paper.QuestionCount}</td>
                                <td class="body-row">{paper.TotalScore}</td>
                                <td class="body-row">{paper.SuggestedDuration}</td>
                                <td class="body-row">
                                    {#if paper.Tags && paper?.Tags.length>0}
                                        {#each paper?.Tags ?? [] as tag, index}
                                            <div class="paper-tags-item">
                                                <!-- <UneditableTag content={tag} /> -->
                                            </div>
                                        {/each}
                                    {:else}
                                        <span>--</span>
                                    {/if}
                                </td>
                                <td style="color: {getDifficultyColor(paper.Level)};" class="body-row">{LEVEL_MAP[paper.Level]}</td>
                                <td class="updated-time body-row">
                                    {formatDateTime(paper.UpdateTime)}
                                </td>
                                <td class="body-row">{formatDate(paper.CreateTime)}</td>
                            </tr>
                        {/each}
                    </tbody>
                </table>
                <!-- {#if paperList.length === 0}
                    <div class="no-data-text">暂无数据</div>
                {/if} -->
            </div>
               

        </div>
         <div class="pagination-container">
                    <Pagination
                        totalItems={totals}
                        currentPage={currentPage}
                        pageSize={10}
                        on:pageChange={handlePageChange}
                        on:pageSizeChange={handlePageSizeChange}
                        pageSizeOptions={[10, 20, 30]}
                    ></Pagination>
                </div>
        <div class="panel-footer">
            <button class="btn" onclick={() => {
                paperSelectedID = selectedID;
                paperSelectedName = selectedName;
                paperSelectedType = selectedType;
                onCancel();
            }}>取消</button>
            <button class="btn save" onclick={() => {
                if(!paperSelectedID){
                    toast.warning("请选择一张试卷")
                    return;
                }
                //将选中的试卷传递给外部
                onConfirm(
                    paperSelectedID,
                    paperSelectedName,
                    paperSelectedType,
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
        // max-height:100px;

        th, td {
            position: relative;
            font-size: 14px;
            color: var(--text-primary);
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
             // 小屏幕适配 - 降低行高和字体大小
        @media (max-width: 1440px) {
            height: 36px;
            padding: 6px;
            font-size: 13px;
        }
        
        @media (max-width: 1080px) {
            height: 32px;
            padding: 4px;
            font-size: 12px;
        }
        
        @media (max-width: 768px) {
            height: 28px;
            padding: 3px;
            font-size: 11px;
        }
        
        @media (max-width: 480px) {
            height: 24px;
            padding: 2px;
            font-size: 10px;
        }
        }

        td {
            border-bottom: 1px solid #ddd;
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
        position: relative;
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
        z-index: 2000;

    }

    .paper-selection-panel {
        margin-left: 130px;
        justify-content: center;
        width: 60%;
        min-width: 900px;
        max-height: 90vh;
        overflow-y: auto;
        background-color: white;
        display: flex;
        flex-direction: column;
        border-radius: 12px;
        box-shadow: 0 8px 32px rgba(0, 0, 0, 0.12);
        z-index: 1001;
         @media (max-width: 1440px) {
            width: 75%;
            min-width: 800px;
            height: 85vh;
            margin-left: 12%;
        }
        
        @media (max-width: 768px) {
            width: 95%;
            min-width: 320px;
            max-height: 90vh;
            height: 90vh;
            margin-left: 0;
            margin: 0 auto;
        }
        
        @media (max-width: 480px) {
            width: 98%;
            height: 95vh;
            max-height: 95vh;
            border-radius: 8px;
        }
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
        position:relative;
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
        display: flex;
        justify-content: flex-end;
    }

    .paper-selection-table-container {
        margin: 10px 0px 0 0px;
        flex: 1;
        min-height: 0px;
        position: relative;
        display: flex;
        flex-direction: column;
       
    }

    .pagination-container {
        display: flex;
        justify-content: flex-end;
        align-items: center;
        margin: 16px 0;
        //padding: 0px 16px;
        
        position: relative;
         @media (max-width: 1080px) {
        padding: 8px 12px;
    }
    
    @media (max-width: 480px) {
        justify-content: center; /* 小屏幕下居中显示 */
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
