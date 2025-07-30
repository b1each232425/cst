<script>
    import Pagination from "$lib/components/Pagination/Pagination.svelte";
    import StudentImportPanel from "./StudentImportPanel.svelte";
    import InputBox from "$lib/components/Input/InputBox.svelte";
    
    let {
        show_panel = false,
        ids = [],
        onCancel = (/** @type {boolean} */ load_new_file) => {
            console.log("取消选择");
        },
        onConfirm = (/** @type {any} */ selectedIDs) => {
            console.log(selectedIDs);
        },
    } = $props();

    /**
     * @type {any[]}
     */
    let examineeList = $state([]);

    // 是否处于选择模式（true为选择模式，false为查看已选择模式）
    let isSelectionMode = $state(false);

    //搜索参数
    let searchParams = $state({
        name: "",
        page: 1,
        pageSize: 10,
    });

    /**
     * @type {any[]}
     */
    let selectedIDs = $state([]);

    // 已选择学生的分页参数
    let selectedSearchParams = $state({
        name: "",
        page: 1,
        pageSize: 10,
    });

    // 已选择学生的总页数
    let selectedTotalPage = $derived(
        selectedIDs.length / selectedSearchParams.pageSize
            ? Math.ceil(selectedIDs.length / selectedSearchParams.pageSize)
            : 1,
    );

    function getFilteredSelectedIds() {
        let filtered = selectedIDs;
        if (selectedSearchParams.name) {
            filtered = selectedIDs.filter(examinee => 
                (examinee.OfficialName && examinee.OfficialName.toLowerCase().includes(selectedSearchParams.name.toLowerCase())) ||
                (examinee.MobilePhone && examinee.MobilePhone.includes(selectedSearchParams.name)) ||
                (examinee.IDCardNo && examinee.IDCardNo.includes(selectedSearchParams.name))
            );
        }
        return filtered;
    }

    function getCurrentPageSelectedIds() {
        const startIndex = (selectedSearchParams.page - 1) * selectedSearchParams.pageSize;
        const endIndex = startIndex + selectedSearchParams.pageSize;
        const filtered = filteredSelectedIDs;
        return filtered.slice(startIndex, endIndex);
    }

    // 过滤后的已选择学生列表
    let filteredSelectedIDs = $derived(getFilteredSelectedIds());

    // 当前页显示的已选择学生
    let currentPageSelectedIDs = $derived(getCurrentPageSelectedIds());

    //总数据条数
    let totals = $state(0);

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

    /**
     * @type {any}
     * 防抖计时器
     */
    let nameSearchTimer = null;

    /**
     * @type {any}
     * 防抖计时器
     */
    let pageSearchTimer = null;

    // 全选/取消全选状态
    /**
     * @type {boolean} 表示是否全选
     */
    let isAllSelected = $state(false);

    let showActionToast = $state(false);
    /**
     * @type {any}
     */
    let actionToast = $state(null);

    let showStudentImportPanel = $state(false);

    /**
     * @type {any}
     */
    let studentImportPanel = $state(null);

    // 获取当前最大的serialNumber
    function getMaxSerialNumber() {
        if (selectedIDs.length === 0) return 0;
        return Math.max(...selectedIDs.map((item) => item.serialNumber || 0));
    }

    /**
     * @param {string} value
     * 搜索页数
     */
    function onSearchPageFunc(value) {
        const numericValue = parseFloat(value);
        if (isNaN(numericValue) || numericValue < 1 || numericValue === null) {
            searchParams.page = 1;
        } else {
            searchParams.page = numericValue;
        }

        //防抖逻辑
        if (pageSearchTimer) {
            clearTimeout(pageSearchTimer);
        }
        pageSearchTimer = setTimeout(() => {
            searchExaminee();
            pageSearchTimer = null;
        }, 300);
    }

    /**
     * @param {boolean} isNext
     * 上一页/下一页
     */
    function onNextOrLastPage(isNext) {
        if (loading === true) {
            return;
        }
        if (isNext && searchParams.page < totalPage) {
            searchParams.page += 1;
            searchExaminee();
        }
        if (!isNext && searchParams.page > 1) {
            searchParams.page -= 1;
            searchExaminee();
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
        searchParams.page = page;
        searchExaminee();
    }

    /**
     * @param {string} value
     * 搜索
     */
    function onSearch(event) {
        const value = event.target.value;
        searchParams.name = value === "" ? "" : value;

        //防抖逻辑
        if (nameSearchTimer) {
            clearTimeout(nameSearchTimer);
        }
        nameSearchTimer = setTimeout(() => {
            nameSearchTimer = null;
            searchParams.page = 1;
            searchExaminee();
        }, 300);
    }

    /**
     * @param {string} value
     * 已选择学生搜索
     */
    function onSelectedSearch(event) {
        const value = event.target.value;
        selectedSearchParams.name = value;
        selectedSearchParams.page = 1;
        // 搜索功能通过响应式更新自动触发，不需要额外调用
    }

    /**
     * @param {boolean} isNext
     * 已选择学生上一页/下一页
     */
    function onSelectedNextOrLastPage(isNext) {
        if (isNext && selectedSearchParams.page < selectedTotalPage) {
            selectedSearchParams.page += 1;
        }
        if (!isNext && selectedSearchParams.page > 1) {
            selectedSearchParams.page -= 1;
        }
    }

    /**
     * @param {number} page
     * 已选择学生页数跳转
     */
    function onSelectedPageChooseFunc(page) {
        selectedSearchParams.page = page;
    }

    /**
     * @param {string} value
     * 已选择学生搜索页数
     */
    function onSelectedSearchPageFunc(value) {
        const numericValue = parseFloat(value);
        if (isNaN(numericValue) || numericValue < 1 || numericValue === null) {
            selectedSearchParams.page = 1;
        } else {
            selectedSearchParams.page = numericValue;
        }
    }

    async function searchExaminee() {
        loading = true;
        error = "";

        // 构建查询参数
        const queryParams = new URLSearchParams();
        queryParams.append("page", searchParams.page.toString());
        queryParams.append("pageSize", searchParams.pageSize.toString());

        if (searchParams.name) {
            queryParams.append("name", searchParams.name);
        }

        await fetch(`/api/user?${queryParams.toString()}`, {
            method: "GET",
            credentials: "include",
            headers: {
                "Content-Type": "application/json",
            },
        })
        .then(response => {
            if (response.status === 404) {
                throw new Error("404 Not Found");
            }
            return response.json();
        })
        .then(result => {
            if (result.status !== 0) {
                error = result.msg || "搜索失败";
                examineeList = [];
                totals = 0;
                searchParams.page = currentPage;
                actionToast?.show("error", error);
            } else {
                examineeList = result.data === null ? [] : result.data;
                totals = result.rowCount;
                currentPage = searchParams.page;

                if (examineeList !== null) {
                    // 更新选中状态
                    const selected_id_set = new Set(
                        selectedIDs.map((item) => item.id)
                    );
                    examineeList.forEach((examinee) => {
                        examinee.selected = selected_id_set.has(examinee.id);
                    });
                }

                isAllSelected = isAllSelected();
            }
        })
        .catch(error => {
            console.error("搜索用户失败:", error);
            if (!error.message.includes("404")) {
                actionToast?.show("error", "搜索失败，请稍后重试");
            }
            examineeList = [];
            totals = 0;
        })
        .finally(() => {
            loading = false;
        });
    }

    // 重新计算所有selectedIDs的serialNumber
    function recalculateSerialNumbers() {
        selectedIDs = selectedIDs.map((item, index) => ({
            ...item,
            serialNumber: index + 1,
        }));
    }

    // 修复：切换全选状态
    function toggleSelectAll() {
        isAllSelected = !isAllSelected;
        
        examineeList.forEach((examinee) => {
            examinee.selected = isAllSelected;
        });

        if (isAllSelected) {
            // 全选：添加当前页面所有未选中的考生
            examineeList.forEach((examinee) => {
                const exists = selectedIDs.find((item) => item.id === examinee.id);
                if (!exists) {
                    selectedIDs.push({
                        id: examinee.id,
                        OfficialName: examinee.OfficialName || "",
                        gender: examinee.gender || "",
                        account: examinee.account || "",
                        MobilePhone: examinee.MobilePhone || "",
                        IDCardNo: examinee.IDCardNo || "",
                        serialNumber: 0, // 临时设置，稍后重新计算
                    });
                }
            });
        } else {
            // 取消全选：移除当前页面的所有考生
            examineeList.forEach((examinee) => {
                const index = selectedIDs.findIndex((item) => item.id === examinee.id);
                if (index !== -1) {
                    selectedIDs.splice(index, 1);
                }
            });
        }
        
        // 重新计算序列号
        recalculateSerialNumbers();
    }

    // 切换到选择模式
    function switchToSelectionMode() {
        isSelectionMode = true;
        searchParams.page = 1;
        searchExaminee();
    }

    // 返回查看模式
    function backToViewMode() {
        isSelectionMode = false;
        // 重置已选择学生的分页参数
        selectedSearchParams.page = 1;
        selectedSearchParams.name = "";
    }

    // 判断是否全选
    function isAllSelected() {
        if (examineeList !== null && examineeList.length > 0) {
            return examineeList.every((examinee) => examinee.selected);
        } else {
            return false;
        }
    }

    async function downloadTemplate() {
        try {
            const response = await fetch(
                "/api/files/exam/d0a9rv6slh1c714h2fkg.xlsx",
                {
                    method: "GET",
                },
            );

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            let filename = "考生导入模板.xlsx";

            // 获取文件内容
            const blob = await response.blob();

            // 创建下载链接
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = filename;
            document.body.appendChild(a);
            a.click();

            // 清理
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);
        } catch (error) {
            console.error("下载模板失败:", error);
            alert("下载模板失败，请稍后重试");
        }
    }

    // 修复：单个复选框选择事件处理
    function handleCheckboxChange(examinee, event) {
        const target = /** @type {HTMLInputElement} */ (event.target);
        const checked = target.checked;
        
        if (checked) {
            // 选中：添加到已选列表
            if (!selectedIDs.find((g) => g.id === examinee.id)) {
                selectedIDs.push({
                    id: examinee.ID,
                    OfficialName: examinee.OfficialName || "",
                    Account: examinee.Account || "",
                    Gender: examinee.Gender || "",
                    MobilePhone: examinee.MobilePhone || "",
                    IDCardNo: examinee.IDCardNo || "",
                    serialNumber: 0, // 临时设置，稍后重新计算
                });
            }
            examinee.selected = true;
        } else {
            // 取消选中：从已选列表移除
            const index = selectedIDs.findIndex((g) => g.id === examinee.id);
            if (index !== -1) {
                selectedIDs.splice(index, 1);
            }
            examinee.selected = false;
        }
        
        // 重新计算序列号
        recalculateSerialNumbers();
        
        // 更新全选状态
        isAllSelected = isAllSelected();
        console.log("当前已选中的用户：", selectedIDs);
    }

    // 初始化选中的考生
    $effect(() => {
        if (show_panel && ids && ids.length > 0) {
            selectedIDs = ids.map((item, index) => ({
                ...item,
                serialNumber: index + 1
            }));
        }
    });
</script>

<div class={show_panel ? "examinee-panel-container" : "hide"}>
    <div class="examinee-panel">
        <div class="panel-header">
            <span class="panel-header-text">{isSelectionMode ? "选择考生" : "考生列表"}</span>
            <button
                class="close-btn"
                onclick={() => {
                    show_panel = false;
                    searchParams.page = 1;
                    isSelectionMode = false;
                    onCancel(false);
                }}>×</button
            >
        </div>
        <div class="panel-body">
            {#if !isSelectionMode}
                <!-- 查看已选择模式 -->
                <div class="selected-examinees-container">
                    <div class="action-container">
                        <div class="examinee-search-container">
                            <InputBox
                                label={"搜索考生"}
                                placeholder={"请输姓名/手机号/身份证号"}
                                onInput={onSelectedSearch}
                            ></InputBox>
                        </div>
                        <div class="button-group">
                            <button class="upload-file-button" onclick={switchToSelectionMode}>
                                选择考生
                            </button>
                        </div>
                    </div>
                    <div class="examinee-selection-table-container">
                        <table class="table">
                            <thead class="student-table-head">
                                <tr class="table-head-row">
                                    <th class="table-head">姓名</th>
                                    <th class="table-head">性别</th>
                                    <th class="table-head">手机号</th>
                                    <th class="table-head">身份证号</th>
                                </tr>
                            </thead>
                            <tbody>
                                {#each currentPageSelectedIDs as examinee}
                                    <tr class="examinee">
                                        <td>{examinee.OfficialName || "--"}</td>
                                        <td>{examinee.gender || "--"}</td>
                                        <td>{examinee.MobilePhone || "--"}</td>
                                        <td>{examinee.IDCardNo || "--"}</td>
                                    </tr>
                                {/each}
                            </tbody>
                        </table>
                        {#if filteredSelectedIDs.length === 0}
                            <div class="no-data-text">暂无数据</div>
                        {/if}
                    </div>
                    <div class="pagination-container">
                        <span style="font-size: 12px; margin-right:10px">
                            已选 <span style="color: #00A870; margin:0 5px 0 5px;">{filteredSelectedIDs.length}</span> 条
                        </span>
                        
                        <Pagination
                        totalItems={filteredSelectedIDs.length}
                        currentPage={selectedSearchParams.page}
                        pageSizeOptions={[10]}
                        on:pageChange={(e) => {
                            selectedSearchParams.page = e.detail;
                        }}
                        />
                        
                    </div>
                </div>
            {:else}
                <!-- 选择模式 -->
                <div class="action-container">
                    <div class="examinee-search-container">
                        <InputBox
                                label={"搜索考生"}
                                placeholder={"请输姓名/手机号/身份证号"}
                                onInput={onSearch}
                            ></InputBox>
                    </div>
                    <div class="button-group">
                        <button class="back-btn" onclick={backToViewMode}>返回考生列表</button>
                        <button class="download-template-button" onclick={downloadTemplate}>
                            下载模板
                        </button>
                        <button class="upload-file-button" onclick={() => {
                            if (studentImportPanel) {
                                studentImportPanel.triggerFileInput();
                            }
                        }}>导入学生</button>
                    </div>
                </div>
                <div class="examinee-selection-table-container">
                    <table class="table">
                        <thead class="student-table-head">
                            <tr class="table-head-row">
                                <th class="table-head" style="width: 30px;">
                                    <input
                                        type="checkbox"
                                        class="custom-checkbox"
                                        onchange={toggleSelectAll}
                                        checked={isAllSelected}
                                    />
                                </th>
                                <th class="table-head">姓名</th>
                                <th class="table-head">性别</th>
                                <th class="table-head">手机号</th>
                                <th class="table-head">身份证号</th>
                            </tr>
                        </thead>
                        <tbody>
                            {#each examineeList as examinee, index}
                                <tr
                                    class={`examinee ${examinee.selected ? "selected" : ""}`}
                                >
                                    <td>
                                        <input
                                            type="checkbox"
                                            class="custom-checkbox"
                                            checked={examinee.selected}
                                            onchange={(event) => handleCheckboxChange(examinee, event)}
                                        />
                                    </td>
                                    <td
                                        >{examinee.OfficialName === null ||
                                        examinee.OfficialName === ""
                                            ? "--"
                                            : examinee.OfficialName}</td
                                    >
                                    <td
                                        >{examinee.Gender === null ||
                                        examinee.Gender === ""
                                            ? "--"
                                            : examinee.Gender}</td
                                    >
                                    <td
                                        >{examinee.MobilePhone === null ||
                                        examinee.MobilePhone === ""
                                            ? "--"
                                            : examinee.MobilePhone}</td
                                    >
                                    <td
                                        >{examinee.IDCardNo === null ||
                                        examinee.IDCardNo === ""
                                            ? "--"
                                            : examinee.IDCardNo}</td
                                    >
                                </tr>
                            {/each}
                        </tbody>
                    </table>
                    {#if examineeList.length === 0}
                        <div class="no-data-text">暂无数据</div>
                    {/if}
                </div>
                <div class="pagination-container">
                    <span style="font-size: 12px; margin-right:10px">
                        已选 <span style="color: #00A870; margin:0 5px 0 5px;"
                            >{selectedIDs.length}</span
                        > 条
                    </span>
                    <Pagination
                        totalItems={totals}
                        currentPage={searchParams.page}
                        pageSizeOptions={[10]}
                        on:pageChange={(e) => {
                        searchParams.page = e.detail;
                        searchExaminee();
                    }}>
                    </Pagination>
                </div>
            {/if}
        </div>
        <div class="panel-footer">
            <button
                class="btn"
                onclick={() => {
                    show_panel = false;
                    searchParams.page = 1;
                    selectedIDs = [];
                    onCancel(false);
                    isSelectionMode = false;
                }}>取消</button
            >
            <button
                class="btn save"
                onclick={() => {
                    show_panel = false;
                    onConfirm(selectedIDs);
                    isSelectionMode = false;
                }}>确定</button
            >
        </div>
    </div>
</div>

<StudentImportPanel
    onImport={(/** @type {any} */ success_student, /** @type {any} */ has_error) => {
        if (success_student && success_student.length > 0) {
            // 过滤掉已存在的id
            const newStudents = success_student
                .filter(
                    (/** @type {any} */ student) =>
                        !selectedIDs.some((item) => item.id === student),
                )
                .map((/** @type {any} */ student, /** @type {any} */ index) => ({
                    id: student,
                    OfficialName: `学生${student}`, // 临时名称
                    gender: "",
                    account: "",
                    MobilePhone: "",
                    IDCardNo: "",
                    serialNumber: 0, // 临时设置
                }));

            // 更新selectedIDs
            selectedIDs = [...selectedIDs, ...newStudents];

            // 重新计算序列号
            recalculateSerialNumbers();

            searchExaminee();
        }

        if (!has_error) {
            showStudentImportPanel = false;
        }
    }}
    onCancel={() => {
        showStudentImportPanel = false;
    }}
    bind:show={showStudentImportPanel}
    bind:this={studentImportPanel}
/>

<style lang="scss" scoped>
    .hide {
        display: none;
    }

    .table {
        width: 100%;
        border-collapse: collapse;
        flex: 1;
        max-height: 40px;

        th,
        td {
            font-size: 14px;
            color: rgba(51, 51, 51);
            border: none;
            padding: 8px;
            text-align: center;
            overflow: visible;
            border-top: none;
            border-left: none;
            border-right: none;
            height: 40px;
            box-sizing: border-box;
        }

        td {
            border-bottom: 1px solid #ddd;
        }

        th {
            color: rgba(0, 0, 0, 0.3);
            background: #fafafa;
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

    .pagination-container {
        display: flex;
        justify-content: right;
        align-items: center;
        margin: 16px 0;
        padding: 0 16px;
    }

    .examinee-panel-container {
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

    .examinee-panel {
        width: 1000px;
        min-width: 800px;
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
            color: var(--text-secondary);
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
    }

    .examinee-search-container {
        flex: 0 0 350px;
        display: flex;
        justify-content: flex-start;
        align-items: center;
        margin-left: -5%; //维持组件位置在行左侧对齐
    }

    .button-group {
        display: flex;
        gap: 16px;
    }

    .back-btn {
        background: none;
        border: 1px solid #d9d9d9;
        padding: 6px 12px;
        height: 32px;
        border-radius: 4px;
        color: var(--text-primary);
        cursor: pointer;
        font-size: 14px;
        transition: all 0.2s;

        &:hover {
            background: #f5f5f5;
        }
    }

    .remove-btn {
        background: none;
        border: 1px solid #dc3545;
        color: #dc3545;
        font-size: 12px;
        cursor: pointer;
        padding: 4px 8px;
        border-radius: 4px;
        transition: all 0.2s;

        &:hover {
            background: #dc3545;
            color: white;
        }
    }

    .selected-examinees-container {
        flex: 1;
        display: flex;
        flex-direction: column;
        min-height: 450px;
    }

    .examinee-selection-table-container {
        margin: 20px 0px 0 0px;
        flex: 1;
        min-height: 440px;
        position: relative;
        display: flex;
        flex-direction: column;
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

    // 自定义复选框
    .custom-checkbox {
        width: 16px;
        height: 16px;
        border: 1px solid rgb(0, 0, 0, 0.3);
        cursor: pointer;
        accent-color: #0052d9;

        &:disabled {
            opacity: 0.6;
            cursor: not-allowed;
        }
    }

    .download-template-button {
        border: none;
        border-radius: 3px;
        background-color: #e3e3e3;
        width: 100px;
        height: 32px;
        color: var(--blue);
        font-size: 14px;
        cursor: pointer;
    }

    .upload-file-button {
        border: none;
        border-radius: 3px;
        background-color: var(--blue);
        width: 100px;
        height: 32px;
        color: white;
        font-size: 14px;
        cursor: pointer;
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

    .student-table-head {
        background-color: #ffffff;
        font-size: 14px;
        font-weight: normal;
        color: var(--text-disabled);
        border: none;
        padding: 8px;
        text-align: center;
        .table-head-row {
            height: 40px;
            .table-head {
                font-weight: normal;
                background: #fff;
                color: var(--text-disabled);
            }
        }
    }
</style>