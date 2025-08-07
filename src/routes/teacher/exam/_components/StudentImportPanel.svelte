<script>  
    import Pagination from "$lib/components/Pagination/Pagination.svelte";
    import InputBox from "$lib/components/Input/InputBox.svelte";

    // 字段映射表
    const errorType = {
        "duplicate_id_card":"身份证号重复",
        "duplicate_phone":"手机号重复",
        "phone_used":"手机号已被其他用户使用",
        "缺少必填项":"缺少必填项",
        "手机号格式错误":"手机号格式错误",
        "身份证号格式错误":"身份证号格式错误",
    }

    let {
        show = $bindable(),
        onCancel = () => {
            console.log("取消选择");
        },
        onImport= (/** @type {any} */ successStudent, /** @type {boolean} */ has_error) => {
            console.log(successStudent);
        },
    } = $props();

    /**
     * @type {any[]}
     */
    let failureStudentList = $state([
        {
            officialName:"张三",
            phone:"13824087366",
            idCardNo:"440711200408223917",
            serialNumber:1,
            errorType:"duplicate_id_card"
        }
    ]);

    let fileInput = $state(null);

    //搜索参数
    let searchParams = $state({
        name: "",
        page: 1,
        pageSize: 10,
    });

    //每页显示的数据条数
    const PAGE_SIZE = 10;

    // 计算总页数
    let totalPages = $derived(Math.ceil(failureStudentList.length / searchParams.pageSize));

    // 搜索关键词
    let searchKeyword = $state("");

    // 过滤后的数据
    let filteredStudentList = $derived(filterStudentList());

    // 获取当前页的数据
    let currentPageData = $derived(getCurrentPage());

    // 更新总数据条数
    let totals = $derived(filteredStudentList.length);

    // 更新当前页
    let currentPage = $derived(searchParams.page);

    // 更新总页数
    let totalPage = $derived(totalPages === 0 ?1 : totalPages);

    //是否加载中
    let loading = $state(false);

    //报错
    let error = $state("");

    /**
     * @type {{ serialNumber: number; name: string; phone_number: string; id_card: string; }[]}
     */
    let selectedIDs = $state([]);

    let showActionToast = $state(0)

    let actionToast = $state(null)

    // 计算成功和失败的考生数量
    let successCount = $state(0)
    let failureCount = $derived(failureStudentList.filter(item => !item.isOk).length)

    // 编辑相关状态
    let editingIndex = $state(-1);
    let editingSerialNumber = $state(null);
    let editingRow = $state({ officialName: '', phone: '', idCardNo: '', serialNumber: null, errorType: "" });

    // 导入学生函数
    async function handleImport(student_list){
        try {
            // 转换数据格式，只处理isOk为true的学生
            const students = student_list
                .filter(student => student.isOk)
                .map(student => ({
                    officialName: student.officialName,
                    idCardNo: student.idCardNo,
                    phone: student.phone
                }));

            // 如果没有成功的学生，直接返回
            if (students.length === 0) {
                failureStudentList = student_list;
                actionToast.show("error","有"+failureCount+"名学生导入失败")
                return;
            }

            // 构造请求体
            const requestBody = {
                data: students
            };

            // 发送请求
            const response = await fetch('/api/teacher/student/import', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(requestBody),
                credentials: 'include'
            });

            if (!response.ok) {
                const resp = await response.text()
                throw new Error(`导入学生失败: ${resp}`);
            }

            const result = await response.json();

            if (result.status !== 0) {
                throw new Error(result.msg || '导入失败');
            }

            if (result.data.has_error === false && failureStudentList.length<=0) {

                let successStudent = result.data.success_ids
                successCount += successStudent.length

                // 导入成功
                onImport(successStudent, false);
                actionToast.show("success", "导入成功");
            } else {
                // 存在有导入失败的学生，进行处理
                let tempFailureStudentList = result.data.error_items;

                // 获取当前failureStudentList的最大serialNumber
                let maxSerialNumber = failureStudentList.length > 0 
                    ? Math.max(...failureStudentList.map(item => item.serialNumber))
                    : 0;

                // 为失败的学生添加serialNumber
                tempFailureStudentList = tempFailureStudentList.map((item, index) => ({
                    ...item,
                    serialNumber: maxSerialNumber + index + 1,
                    isOk: false
                }));

                // 更新failureStudentList
                failureStudentList = [...failureStudentList, ...tempFailureStudentList];

                // 将导入成功的学生传递出去
                let successStudent = result.data.success_ids
                successCount += successStudent.length
                actionToast.show("error","有"+failureStudentList.length+"名学生导入失败")

                onImport(successStudent, true)
            }
        } catch (error) {
            console.error('导入失败:', error);
            actionToast.show("error", error.message || '导入失败，请稍后重试');
        }
    }

    function filterStudentList() {
        let filtered = failureStudentList;
        
        // 根据搜索关键词过滤
        if (searchKeyword) {
            filtered = filtered.filter((student) => {
                const name = student.officialName || '';
                const phone = student.phone || '';
                const idCardNo = student.idCardNo || '';
                
                return (
                    name.includes(searchKeyword) ||
                    phone.includes(searchKeyword) ||
                    idCardNo.includes(searchKeyword)
                );
            });
        }
        
        return filtered;
    }

    // 替换现有的分页处理函数
    function handlePageChange(event) {
        searchParams.page = event.detail;
    }

    function handlePageSizeChange(event) {
        searchParams.pageSize = event.detail;
        searchParams.page = 1; // 改变每页条数时重置到第一页
    }
    function getCurrentPage() {
        // 先对数据进行排序：失败的在前，成功的按序号排序
        const sortedList = [...filteredStudentList].sort((a, b) => {
            // 如果两个考生的isOk不同，失败的排在前面
            if (a.isOk !== b.isOk) {
                return a.isOk ? 1 : -1;
            }
            // 如果都是成功的，按序号排序
            if (a.isOk && b.isOk) {
                return (a.serialNumber || 0) - (b.serialNumber || 0);
            }
            return 0;
        });

        const start = (searchParams.page - 1) * searchParams.pageSize;
        const end = start + searchParams.pageSize;
        return sortedList.slice(start, end);
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
    }

    /**
     * @param {boolean} is_next
     * 上一页/下一页
     */
    function onNextOrLastPage(is_next) {
        if (loading === true) {
            return;
        }
        if (is_next && searchParams.page < totalPage) {
            searchParams.page += 1;
        }
        if (!is_next && searchParams.page > 1) {
            searchParams.page -= 1;
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
    }

    /**
     * @param {string} value
     * 搜索
     */
    function onSearch(value) {
        searchKeyword = value;
        searchParams.page = 1; // 搜索时重置到第一页
    }

    

    export function triggerFileInput() {
        failureStudentList = [];
        successCount = 0;
        searchKeyword = "";
        searchParams.name = "";
        searchParams.page = 1;
        searchParams.pageSize = 10;
        if (fileInput) {
            fileInput.click();
        }
    }

    function handleEdit(student, idx) {
        editingIndex = idx;
        editingSerialNumber = student.serialNumber;
        editingRow = { ...student };
    }

    function handleCancelEdit() {
        editingIndex = -1;
        editingSerialNumber = null;
        editingRow = { officialName: '', phone: '', idCardNo: '', serialNumber: null, errorType:"" };
    }

    async function handleSaveEdit() {

        if (!editingRow.officialName) {
            editingRow.errorType = '姓名不能为空';
            return;
        }
        if (!/^1[3-9]\d{9}$/.test(editingRow.phone)) {
            editingRow.errorType = '手机号格式错误';
            return;
        }
        if (!/(^\d{15}$)|(^\d{17}(\d|X|x)$)/.test(editingRow.idCardNo)) {
            editingRow.errorType = '身份证号格式错误';
            return;
        }

        let newStudent = {
            ...$state.snapshot(editingRow),
        };
        
        // 校验通过，更新数据
        failureStudentList = failureStudentList.map(item => {
            if (item.serialNumber === editingSerialNumber) {
                return {
                    ...newStudent,
                    serialNumber: editingSerialNumber,
                    errorType: "",
                    isOk: true,
                };
            }
            return item;
        });
        
        editingIndex = -1;
        editingSerialNumber = null;
        editingRow = { officialName: '', phone: '', idCardNo: '', serialNumber: null, errorType:"" };
    }

    function handleDelete(student) {
        // 从student_list中删除该考生
        failureStudentList = failureStudentList.filter(item => item.serialNumber !== student.serialNumber);
    }
</script>

<div class={show ? "student-panel-container" : "hide"}>
    <div class="student-panel">
        <div class="panel-header">
            <span class="panel-header-text">导入考生</span>
            <button
                class="close-btn"
                onclick={() => {
                    searchParams.page = 1;
                    selectedIDs = [];
                    failureStudentList = [];
                    onCancel();
                }}>×</button
            >
        </div>
        <div class="panel-body">
            <div class="action-container">
                <div
                    class="student-search-container"
                    style="height: 32px;width:350px; margin-left:10px"
                >
                    <InputBox>
                        label="搜索考生"
                        placeholder="请输入姓名/手机号/身份证号"
                        onInput={e => {
                            searchKeyword = e.target.value;
                        }}
                    </InputBox>
                </div>
                <div class="checkbox-container">
                    <span style="font-size: 12px;">
                        导入成功
                        <span style="color: #00A870; margin:0 2px 0 2px;">
                            {successCount}
                        </span>
                        名
                    </span>
                    <span style="font-size: 12px; margin-right:15px">
                        导入失败
                        <span style="color: #FF4D4F; margin:0 2px 0 2px;">
                            {failureCount}
                        </span>
                        名
                    </span>
                </div>
                <input
                    type="file"
                    id="fileInput"
                    style="display: none"
                    bind:this={fileInput}
                />
            </div>
            <div>
                <div class="student-selection-table-container">
                    <table class="table">
                        <thead class="student-table-head">
                            <tr class="table-head-row">
                                <th class="table-head">姓名</th>
                                <th class="table-head">手机号</th>
                                <th class="table-head">身份证号</th>
                                <th class="table-head">错误信息</th>
                                <th class="table-head">操作</th>
                            </tr>
                        </thead>
                        <tbody>
                            {#each currentPageData as student, index}
                                {#if editingSerialNumber === student.serialNumber}
                                    <tr class={`student failed-row`}>
                                        <td><input type="text" bind:value={editingRow.officialName} style="width:90px" /></td>
                                        <td><input type="text" bind:value={editingRow.phone} style="width:120px" /></td>
                                        <td><input type="text" bind:value={editingRow.idCardNo} style="width:180px" /></td>
                                        <td style={editingRow.errorType === null || editingRow.errorType === "" ? "" : "color: #ff4d4f;"}>{editingRow.errorType === null || editingRow.errorType === ""? "--":errorType[editingRow.errorType]}</td>
                                        <td style="width:260px">
                                            <button class="action-btn" onclick={handleSaveEdit}>保存</button>
                                            <button class="action-btn" onclick={handleCancelEdit}>取消</button>
                                        </td>
                                    </tr>
                                {:else}
                                    <tr class={`student ${!student.isOk ? "failed-row" : "selected"}`}>
                                        <td>{student.officialName}</td>
                                        <td>{student.phone}</td>
                                        <td>{student.idCardNo}</td>
                                        <td style={student.errorType === null || student.errorType === "" ? "" : "color: #ff4d4f;"}>{student.errorType === null || student.errorType === ""? "--":errorType[student.errorType]}</td>
                                        <td style="width:260px">
                                            {#if !student.isOk}
                                                <button class="action-btn" onclick={() => handleEdit(student, index)}>编辑</button>
                                            {/if}
                                            <button class="action-btn" onclick={() => handleDelete(student)}>删除</button>
                                        </td>
                                    </tr>
                                {/if}
                            {/each}
                        </tbody>
                    </table>
                    {#if failureStudentList.length === 0}
                        <div class="no-data-text">暂无数据</div>
                    {/if}
                </div>
                <div class="pagination-container">
                    <span style="font-size: 12px; margin-right:10px">
                        已选 <span style="color: #00A870; margin:0 5px 0 5px;">{selectedIDs.length}</span> 条
                    </span>
                    <!-- <Pagination
                        show_per_page={false}
                        total_data_num={totals}
                        totalPage_num={totalPage}
                        currentPage_num={currentPage}
                        onPageChangeFunc={onNextOrLastPage}
                        onPageSearchFunc={onSearchPageFunc}
                        {onPageChooseFunc}
                    ></Pagination> -->
                     <Pagination
                        totalItems={totals}
                        pageSize={searchParams.pageSize}
                        currentPage={searchParams.page}
                        on:pageChange={handlePageChange}
                        on:pageSizeChange={handlePageSizeChange}
                        pageSizeOptions={[10, 20, 30, 40, 50]}
                        />
                </div>
            </div>
        </div>
        <div class="panel-footer">
            <button
                class="btn"
                onclick={() => {
                    searchParams.page = 1;
                    selectedIDs = [];
                    failureStudentList = [];
                    onCancel();
                }}>返回</button
            >
            <button
                class="btn save"
                onclick={() => {
                    const students = failureStudentList
                    .filter(student => student.isOk)
                    .map(student => ({
                        officialName: student.officialName,
                        idCardNo: student.idCardNo,
                        phone: student.phone
                    }));

                    if (students.length <= 0) {
                        actionToast.show("error","没有符合格式要求的学生，请确保学生信息格式正确")
                        return
                    }
                    handleImport(students);
                }}>重新导入</button
            >
        </div>
    </div>
</div>

<!-- <ActionToast
    bind:isShow={showActionToast}
    bind:this={actionToast}
/> -->

<style lang="scss" scoped>
    .hide {
        display: none;
    }

    .student-table-head {
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

    .table {
        max-height: 40px;
        width: 100%;
        border-collapse: collapse;
        flex: 1;

        th, td {
            font-size: 14px;
            color: rgba(51, 51, 51);
            border: none;
            padding: 0 8px;
            text-align: center;
            overflow: visible;
            border-top: none;
            border-left: none;
            border-right: none;
            height: 40px;
            min-height: 40px;
            max-height: 40px;
            line-height: 40px;
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
        position: relative;
    }

    .student-panel-container {
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

    .student-panel {
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
    }

    .student-search-container {
        flex: 0 0 350px;
    }

    .student-selection-table-container {
        margin: 20px 0px 0 0px;
        flex: 1;
        min-height: 450px;
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

    .action-btn {
        border: none;
        padding: 4px 6px;
        font-size: 14px;
        cursor: pointer;
        margin: 0 4px;
        background: rgba(0, 0, 0, 0);
        color: var(--blue);
    }
    .action-btn:hover {
        font-weight: bold;
    }

    .failed-row {
        background-color: #ffeaea !important;
    }
    .failed-row:hover {
        background-color: #ffd6d6 !important;
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

    .button-group {
        display: flex;
        gap: 16px;
    }

    .download-template-button {
        border: none;
        border-radius: 3px;
        background-color: #e3e3e3;
        width: 100px;
        height: 32px;
        color: var(--primary-color);
        font-size: 14px;
        cursor: pointer;
    }

    .upload-file-button {
        border: none;
        border-radius: 3px;
        background-color: var(--primary-color);
        width: 100px;
        height: 32px;
        color: white;
        font-size: 14px;
        cursor: pointer;
    }
</style>
