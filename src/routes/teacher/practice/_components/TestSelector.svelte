<!-- /*
 * @Author: 李乐毅 
 * @Date: 2025-07-27 16:36:22 
 * @Last Modified by:   李乐毅 
 * @Last Modified time: 2025-07-27 16:36:22 
 */ -->
<script>
  
    import UneditableHashTags from "../../../../lib/components/Tag/UneditableHashTags.svelte";
    import Pagination from "$lib/components/Pagination/Pagination.svelte";
  import InputBox  from "$lib/components/Input/InputBox.svelte";
  import Option from "$lib/components/Select/Option.svelte";
  import Button from "$lib/components/Button/Button.svelte";
  import Select from "$lib/components/Select/Select.svelte"
  import Empty from "$lib/components/Table/Empty.svelte";

    let {
        show = $bindable(false),
        onConfirmFunc = () => {
            console.log("试卷选择确认");
        },
        onTestSelectFunc = (
            /** @type {{id: number, name: string, assembly_type: string, level?: string, question_count?: number, total_score?: number, tags?: string[], update_time?: string, create_time?: string}} */ test,
        ) => {
            console.log("试卷选择:", test);
        },
        selectedTestId = $bindable(null),
        paper_list = [],
    } = $props();

    let searchText = $state("");
    let tagSearchText = $state("");

    let selectedStructure = $state("全部");

    // 组卷方式选项 - 适配CustomSelect的格式
    let structureOptions = $state([
        "全部",
        "自定义组卷",
        "随机组卷",
        "智能刷题",
    ]);

    // 当前页的试卷，直接使用paper_list，不需要再次切片
    let currentPageTests = $derived(paper_list);

    // 分页相关
    let currentPage = $state(1);
    let pageSize = $state(10);
    let totalTests = $state(0);
    let totalPages = $derived(Math.ceil(totalTests / pageSize));

    // 当页码改变时的处理函数
    /**
     * @param {boolean} isNext - 是否前往下一页
     */
    function handlePageChange(isNext) {
        const newPage = isNext
            ? Math.min(totalPages, currentPage + 1)
            : Math.max(1, currentPage - 1);

        if (newPage !== currentPage) {
            currentPage = newPage;
            fetchPaperList({
                name: searchText,
                tags: tagSearchText,
                assembly_type: selectedStructure,
                page: String(newPage),
            });
        }
    }

    // 当选择特定页码时的处理函数
    /**
     * @param {number} pageNum - 要跳转的页码
     */
    function handlePageChoose(event) {
        if (event.detail !== currentPage) {
            currentPage = event.detail;
            fetchPaperList({
                name: searchText,
                tags: tagSearchText,
                assembly_type: selectedStructure,
                page: String(event.detail),
            });
        }
    }

    // 当选择每页条数时的处理函数
    /**
     * @param {string|number} value - 每页显示的条数
     */
    function handlePageSizeChange(event) {
        // 确保value是数字类型
      
        pageSize = event.detail;
        currentPage = 1; // 重置到第一页
        fetchPaperList({
            name: searchText,
            tags: tagSearchText,
            assembly_type: selectedStructure,
            page: "1",
            page_size: String(event.detail),
        });
    }

    // 当输入页码跳转时的处理函数
    /**
     * @param {string} value - 输入的页码字符串
     */
    function handlePageSearch(value) {
        const pageNum = parseInt(value);
        if (!isNaN(pageNum) && pageNum > 0 && pageNum <= totalPages) {
            currentPage = pageNum;
            fetchPaperList({
                name: searchText,
                tags: tagSearchText,
                assembly_type: selectedStructure,
                page: String(pageNum),
            });
        }
    }

    // 选择试卷
    /**
     * @param {number} testId
     */
    function selectTest(testId) {
        selectedTestId = testId === selectedTestId ? null : testId;
    }

    // 确认选择
    function confirmSelection() {
        const selected = paper_list.find(
            (
                /** @type {{ID: number, Name: string, assembly_type: string}} */ test,
            ) => test.ID === selectedTestId,
        );
        if (selected) {
            // 确保传递正确的数据结构给父组件
            onTestSelectFunc({
                id: selected.ID,
                name: selected.Name,
                assembly_type: selected.assembly_type,
                suggest_duration: selected.SuggestedDuration,
            });
            onConfirmFunc();
        }
        closeModal();
    }

    // 关闭弹窗
    function closeModal() {
        show = false;
    }

    // 重置筛选
    function resetFilters() {
        searchText = "";
        tagSearchText = "";
        selectedStructure = "全部";
        
        fetchPaperList({
            page: "1",
        });
        currentPage = 1;
    }

    /**
     * 获取试卷列表
     * @param {Object} params 查询参数对象
     * @param {string} [params.name] 试卷名称
     * @param {string} [params.tags] 试卷标签
     * @param {string} [params.assembly_type] 组卷方式
     * @param {string} [params.page] 页码
     * @param {string} [params.page_size] 每页数量
     * @returns {Promise<void>}
     */
    async function fetchPaperList(params = {}) {
            // 构造查询参数
            const searchParams = new URLSearchParams({
                name: params.name || "",
                tags: params.tags || "",
                page: params.page || String(currentPage),
                pageSize: params.page_size || String(pageSize),
                category: "02", // 默认分类
                ...(params.assembly_type && params.assembly_type !== "全部"
                    ? { assembly_type: params.assembly_type }
                    : {}),
            });

            // 发送带参数的GET请求
            const response = await fetch(
                `/api/paper?${searchParams}`,
                {
                    method: "GET",
                    credentials: "include",
                },
            ).then((response)=>{

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            return response.json();
            }).then((result)=>{
            console.log("获取试卷列表响应:", result);
            if (!result.data ) {
                paper_list = [];
                totalTests = 0;
                return;
            }
            //获取试卷的记录
            const records = result.data;

            // 更新总数 - 从total_count字段获取
            totalTests = result.rowCount || 0;
            console.log("总数据条数:", totalTests);

            // 更新试卷列表
            paper_list = records.map((/** @type {any} */ item) => {
                // 处理时间格式
                let updateTimeObj = new Date(
                    item.UpdateTime || item.CreateTime,
                );
                let updateDate = updateTimeObj
                    .toLocaleDateString("zh-CN")
                    .replace(/\//g, "-");
                let updateTime = updateTimeObj.toLocaleTimeString("zh-CN", {
                    hour: "2-digit",
                    minute: "2-digit",
                });

                // 创建日期只取年月日
                let createTimeObj = new Date(
                    item.CreateTime || item.UpdateTime,
                );
                let createDate = createTimeObj.toISOString().split("T")[0];

                return {
                    ...item,
                    assembly_type:
                        item.AssemblyType === "00"
                            ? "自定义组卷（经典巩固）"
                            : item.AssemblyType === "02"
                              ? "随机组卷（随机组卷）"
                              : "智能刷题（智能提升）",
                    level:
                        item.Level === "00"
                            ? "简单"
                            : item.Level === "02"
                              ? "中等"
                              : "困难",
                    // 添加格式化后的时间
                    update_time: `${updateDate} ${updateTime}`,
                    create_time: createDate,
                    // 确保有tags属性
                    tags: item.Tags || [],
                    duration:item.SuggestedDuration,
                };
            });
            }).catch(error => {
            console.error("获取试卷列表失败", error);
            paper_list = [];
            totalTests = 0;
            throw error;
            });
    }

    // 初始加载试卷
    $effect(() => {
        if (show) {
            fetchPaperList();
        }
    });

    // 搜索试卷
    function searchPapers() {
        currentPage = 1; // 重置到第一页
        fetchPaperList({
            name: searchText,
            tags: tagSearchText,
            assembly_type: selectedStructure,
            page: "1", // 重置到第一页
        });
    }
</script>

{#if show}
    <div
        class="modal-overlay"
        onclick={closeModal}
        onkeydown={(e) => e.key === "Escape" && closeModal()}
        tabindex="0"
        role="dialog"
        aria-modal="true"
    >
        <div
            class="modal-content"
            onclick={(e) => e.stopPropagation()}
            onkeydown={(e) => e.stopPropagation()}
            tabindex="0"
            role="dialog"
        >
            <div class="modal-header">
                <h2>选择试卷</h2>
            </div>

            <div class="search-container">
                <div class="search-items">
                    <div class="search-item">
                        <InputBox
                        label="试卷名称"
                            id="search-text"
                            type="text"
                            placeholder="搜索试卷名称"
                            bind:value={searchText}
                        />
                    </div>

                    <div class="search-item">
                        <InputBox
                        label="试卷标签"
                            id="tag-search"
                            type="text"
                            placeholder="搜索试卷标签"
                            bind:value={tagSearchText}
                        />
                    </div>

                </div>

                <div class="search-btns">
                    <Button class="search-btn" onclick={searchPapers}
                        >搜索</Button
                    >
                    <Button class="reset-btn" onclick={resetFilters}
                        >重置</Button
                    >
                </div>
            </div>

            <div class="modal-body">
                <div class="test-table">
                    <div class="table-header">
                        <div class="header-cell select-cell"></div>
                        <div class="header-cell name-cell">试卷名称</div>
                        <div class="header-cell type-cell">
                            组卷方式(练习类型)
                        </div>
                        <div class="header-cell count-cell">试题数量</div>
                        <div class="header-cell score-cell">试卷总分</div>
                        <div class="header-cell standard-cell">试卷标签</div>
                        <div class="header-cell suggest-cell">建议时长（分钟）</div>
                        <div class="header-cell diff-cell">试卷难度</div>
                        <div class="header-cell update-cell">更新时间</div>
                        <div class="header-cell create-cell">创建日期</div>
                    </div>

                    <div class="table-body">
              {#if currentPageTests.length > 0}
                        {#each currentPageTests as test (test.ID)}
                        
                            <div class="table-row">
                                <div class="cell select-cell">
                                    <label class="custom-radio">
                                        <input
                                            type="radio"
                                            name="test-selection"
                                            value={test.ID}
                                            onclick={() => selectTest(test.ID)}
                                            checked={selectedTestId === test.ID}
                                        />
                                        <span class="radio-checkmark"></span>
                                    </label>
                                </div>
                                <div class="cell name-cell">{test.Name}</div>
                                <div class="cell type-cell">
                                    {test.assembly_type}
                                </div>
                                <div class="cell count-cell">
                                    {test.QuestionCount}
                                </div>
                                <div class="cell score-cell">
                                    {test.TotalScore}
                                </div>
                                <div class="cell standard-cell">
                                    <UneditableHashTags tags={test.tags} />
                                </div>
                                <div class="cell suggest-cell">{test.SuggestedDuration}</div>
                                <div class="cell diff-cell">
                                    <span
                                        class={`level ${test.level === "简单" ? "easy" : test.level === "中等" ? "medium" : "hard"}`}
                                    >
                                        {test.level}
                                    </span>
                                </div>
                                <div class="cell update-cell">
                                    <div class="date-time">
                                        <div class="date">
                                            {test.update_time.split(" ")[0]}
                                        </div>
                                        <div class="time">
                                            {test.update_time.split(" ")[1]}
                                        </div>
                                    </div>
                                </div>
                                <div class="cell create-cell">
                                    {test.create_time}
                                </div>
                            </div>
                        {/each}
                        {:else}
                        
      <div  style="height: 200px; padding: 0;">
        <div class="empty-wrapper">
          <Empty text="暂无试卷数据" />
        </div>
      </div>
   
              {/if}
                    </div>
                </div>
                <div class="pagination-container">
                    <div class="total-count"></div>
                    <Pagination
                        totalItems={totalTests}
                        currentPage={currentPage}
                        pageSize={pageSize}
                        on:pageChange={handlePageChoose}
                        on:pageSizeChange={handlePageSizeChange}
                    /> 
                </div>
            </div>

            <div class="modal-footer">
                <Button class="cancel-btn" onclick={closeModal} round>取消</Button>
                <Button class="confirm-btn" onclick={confirmSelection} round
                    >确定</Button
                >
            </div>
        </div>
    </div>
{/if}

<style lang="scss">
    
    /* 基础样式 */
    .modal-overlay {
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background-color: rgba(0, 0, 0, 0.5);
        display: flex;
        align-items: center;
        justify-content: center;
        
    }

    .modal-content {
        background-color: white;
        border-radius: 4px;
        width:  90%;
        max-width: 1200px;
        height: 80vh; /* 固定高度而不是max-height */
        display: flex;
        flex-direction: column;
        overflow: hidden;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
        
    }

    .modal-header {
        padding: 12px 16px;
        display: flex;
        justify-content: center;
        align-items: center;
        flex-shrink: 0; /* 防止header被压缩 */

        h2 {
            margin: 0;
            font-size: 24px;
            font-weight: bold;
            color: #333;
        }
    }

    /* 搜索区域样式 */
    .search-container {
        display: flex;
        padding: 16px;
        justify-content: space-between;
        align-items: flex-start;
    }

    .search-items {
        display: flex;
        gap: 16px;
        flex-wrap: wrap;
    }

    .search-item {
        display: flex;
        flex-direction: row;
        align-items: center;

        label {
            font-size: 14px;
            color: #606266;
            white-space: nowrap;
            min-width: 70px;
            text-align: left;
        }

        input {
            width: 200px;
            height: 32px;
            border: 1px solid #dcdfe6;
            border-radius: 4px;
            padding: 0 10px;
            font-size: 14px;
            outline: none;

            &:focus {
                border-color: #0336ff;
            }
        }
    }

    .search-btns {
        display: flex;
        gap: 16px;
        white-space: nowrap;
    }

    .search-btn {
        border: none;
        height: 32px;
        padding: 0 20px;
        border-radius: 4px;
        font-size: 14px;
        cursor: pointer;
        background-color: #0336ff;
        color: white;

        &:hover {
            background-color: #0329e0;
        }
    }

    .reset-btn {
        border: 1px solid #dcdfe6;
        height: 32px;
        padding: 0 20px;
        border-radius: 4px;
        font-size: 14px;
        cursor: pointer;
        background-color: white;
        color: #606266;
        white-space: nowrap;
        &:hover {
            border-color: #0336ff;
            color: #0336ff;
        }
    }

    /* 表格样式 */
    .modal-body {
        padding: 0 16px;
        overflow: hidden; /* 改为hidden，防止出现滚动条 */
        flex: 1; /* 占用所有剩余空间 */
        display: flex;
        flex-direction: column;
    }

    .test-table {
        width: 100%;
        flex: 1; /* 表格占满整个modal-body */
        display: flex;
        flex-direction: column;
        overflow: hidden; /* 防止出现滚动条 */

        .table-header {
            display: flex;
            font-weight: bold;
            flex-shrink: 0; /* 表头不压缩 */
            position: sticky;
            top: 0;
            background-color: white;
            z-index: 1;
            width: 100%; /* 确保表头宽度与表体一致 */
        }

        .header-cell {
            padding: 12px 8px;
            font-size: 14px;
            text-align: left;
            color: #606266;
            display: flex;
            justify-content: center;
            align-items: center;
        }

        .table-body {
            flex: 1;
            overflow-y: auto; /* 只有表体有垂直滚动 */
            overflow-x: hidden; /* 防止水平滚动 */
            /* 确保表格体至少有一定高度 */
            min-height: 0; /* 解决Flex布局中的滚动问题 */
        }

        .table-row {
            display: flex;

            &:nth-child(even) {
                background-color: #f9f9f9;
            }

            &:hover {
                background-color: #f5f7fa;
            }
        }

        .cell {
            padding: 12px 8px;
            font-size: 14px;
            color: #606266;
            display: flex;
            align-items: center;
            justify-content: center;
        }
    }

    .select-cell {
        width: 20px;
        padding: 12px 0px;
        justify-content: left;
    }

    /* 自定义单选按钮 */
    .custom-radio {
        position: relative;
        display: inline-block;
        width: 12px;
        height: 12px;
        cursor: pointer;

        input {
            position: absolute;
            opacity: 0;
            cursor: pointer;
            height: 0;
            width: 0;
        }

        .radio-checkmark {
            position: absolute;
            top: 0;
            left: 0;
            height: 10px; /* 去掉边框的实际尺寸 */
            width: 10px; /* 去掉边框的实际尺寸 */
            background-color: white;
            border: 1px solid #0336ff;
            border-radius: 50%;
            box-sizing: content-box; /* 确保边框不计入尺寸 */

            &:after {
                content: "";
                position: absolute;
                display: none;
                top: 2px; /* 精确居中位置: (10px - 6px)/2 = 2px */
                left: 2px; /* 精确居中位置: (10px - 6px)/2 = 2px */
                width: 6px;
                height: 6px;
                border-radius: 50%;
                background: #0336ff;
            }
        }

        &:hover input ~ .radio-checkmark {
            background-color: #f0f7ff;
        }

        input:checked ~ .radio-checkmark {
            background-color: white;

            &:after {
                display: block;
            }
        }
    }

    .name-cell {
        width: 150px;
        word-break: break-word;
        overflow-wrap: break-word;
    }

    .type-cell {
        width: 200px;
        word-break: break-word;
        overflow-wrap: break-word;
    }

    .count-cell {
        width: 80px;
        justify-content: center;
    }

    .score-cell {
        width: 80px;
        justify-content: center;
    }

    .standard-cell {
        width: 150px;
        flex-wrap: wrap;
    }

    .diff-cell {
        width: 80px;
        justify-content: center;
    }

    .level {
        padding: 2px 8px;
        border-radius: 2px;

        &.easy {
            color: #008000;
        }

        &.medium {
            color: #ffa500;
        }

        &.hard {
            color: #ff0000;
        }
    }

    .update-cell {
        width: 150px;
        word-break: break-word;
        overflow-wrap: break-word;
        text-align: center;
    }

    .suggest-cell{
        width: 125px;
        word-break: break-word;
        overflow-wrap: break-word;
        text-align: center;
    }

    .date-time {
        display: flex;
        flex-direction: column;
        gap: 2px;
        align-items: center;
        text-align: center;
        width: 100%;

        .date,
        .time {
            font-size: 14px;
            text-align: center;
        }
    }

    .create-cell {
        width: 130px;
        word-break: break-word;
        overflow-wrap: break-word;
    }

    .standard-tag {
        display: inline-block;
        background-color: #ecf5ff;
        color: #409eff;
        padding: 0 5px;
        height: 22px;
        line-height: 22px;
        font-size: 12px;
        border-radius: 2px;
        margin-right: 5px;
        margin-bottom: 3px;
    }

    /* 分页容器样式 */
    .pagination-container {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-top: 16px;
        padding: 0 16px 16px;

        .total-count {
            font-size: 14px;
            color: #606266;
        }
    }

    /* 底部按钮 */
    .modal-footer {
        padding: 30px 0;
        display: flex;
        justify-content: center;
        gap: 30px;
        flex-shrink: 0; /* 防止footer被压缩 */

        button {
            padding: 8px 40px;
            border-radius: 4px;
            font-size: 14px;
            cursor: pointer;
        }

        .cancel-btn {
            background-color: white;
            border: 1px solid #dcdfe6;
            color: #606266;

            &:hover {
                border-color: #0336ff;
                color: #0336ff;
            }
        }

        .confirm-btn {
            background-color: #0336ff;
            border: none;
            color: white;

            &:hover {
                background-color: #0329e0;
            }
        }
    }
</style>
