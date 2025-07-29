<script>  
    import Pagination from "$lib/components/Pagination/Pagination.svelte";
    import InputBox from "$lib/components/Input/InputBox.svelte";
    import InforInput from "$lib/components/Input/InforInput.svelte";

    // 字段映射表
    const ERROR_TYPE = {
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
        onImport= (/** @type {any} */ success_student, /** @type {boolean} */ has_error) => {
            console.log(success_student);
        },
    } = $props();

    /**
     * @type {any[]}
     */
    let failure_student_list = $state([
        {
            official_name:"张三",
            phone:"13824087366",
            id_card_no:"440711200408223917",
            serial_number:1,
            error_type:"duplicate_id_card"
        }
    ]);

    let file_input = $state(null);

    //搜索参数
    let search_params = $state({
        name: "",
        page: 1,
        pageSize: 10,
    });

    //每页显示的数据条数
    const PAGE_SIZE = 10;

    // 计算总页数
    let total_pages = $derived(Math.ceil(failure_student_list.length / search_params.pageSize));

    // 搜索关键词
    let search_keyword = $state("");

    // 过滤后的数据
    let filtered_student_list = $derived(filterStudentList());

    // 获取当前页的数据
    let current_page_data = $derived(getCurrentPage());

    // 更新总数据条数
    let totals = $derived(filtered_student_list.length);

    // 更新当前页
    let current_page = $derived(search_params.page);

    // 更新总页数
    let total_page = $derived(total_pages === 0 ?1 : total_pages);

    //是否加载中
    let loading = $state(false);

    //报错
    let error = $state("");

    /**
     * @type {{ serial_number: number; name: string; phone_number: string; id_card: string; }[]}
     */
    let selected_ids = $state([]);

    let show_action_toast = $state(0)

    let action_toast = $state(null)

    // 计算成功和失败的考生数量
    let success_count = $state(0)
    let failure_count = $derived(failure_student_list.filter(item => !item.is_ok).length)

    // 编辑相关状态
    let editing_index = $state(-1);
    let editing_serial_number = $state(null);
    let editing_row = $state({ official_name: '', phone: '', id_card_no: '', serial_number: null, error_type: "" });

    // 导入学生函数
    async function handleImport(student_list){
        try {
            // 转换数据格式，只处理is_ok为true的学生
            const students = student_list
                .filter(student => student.is_ok)
                .map(student => ({
                    official_name: student.official_name,
                    id_card_no: student.id_card_no,
                    phone: student.phone
                }));

            // 如果没有成功的学生，直接返回
            if (students.length === 0) {
                failure_student_list = student_list;
                action_toast.show("error","有"+failure_count+"名学生导入失败")
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

            if (result.data.has_error === false && failure_student_list.length<=0) {

                let success_student = result.data.success_ids
                success_count += success_student.length

                // 导入成功
                onImport(success_student, false);
                action_toast.show("success", "导入成功");
            } else {
                // 存在有导入失败的学生，进行处理
                let temp_failure_student_list = result.data.error_items;

                // 获取当前failure_student_list的最大serial_number
                let maxSerialNumber = failure_student_list.length > 0 
                    ? Math.max(...failure_student_list.map(item => item.serial_number))
                    : 0;

                // 为失败的学生添加serial_number
                temp_failure_student_list = temp_failure_student_list.map((item, index) => ({
                    ...item,
                    serial_number: maxSerialNumber + index + 1,
                    is_ok: false
                }));

                // 更新failure_student_list
                failure_student_list = [...failure_student_list, ...temp_failure_student_list];

                // 将导入成功的学生传递出去
                let success_student = result.data.success_ids
                success_count += success_student.length
                action_toast.show("error","有"+failure_student_list.length+"名学生导入失败")

                onImport(success_student, true)
            }
        } catch (error) {
            console.error('导入失败:', error);
            action_toast.show("error", error.message || '导入失败，请稍后重试');
        }
    }

    function filterStudentList() {
        let filtered = failure_student_list;
        
        // 根据搜索关键词过滤
        if (search_keyword) {
            filtered = filtered.filter((student) => {
                const name = student.official_name || '';
                const phone = student.phone || '';
                const id_card_no = student.id_card_no || '';
                
                return (
                    name.includes(search_keyword) ||
                    phone.includes(search_keyword) ||
                    id_card_no.includes(search_keyword)
                );
            });
        }
        
        return filtered;
    }

    // 替换现有的分页处理函数
    function handlePageChange(event) {
        search_params.page = event.detail;
    }

    function handlePageSizeChange(event) {
        search_params.pageSize = event.detail;
        search_params.page = 1; // 改变每页条数时重置到第一页
    }
    function getCurrentPage() {
        // 先对数据进行排序：失败的在前，成功的按序号排序
        const sortedList = [...filtered_student_list].sort((a, b) => {
            // 如果两个考生的is_ok不同，失败的排在前面
            if (a.is_ok !== b.is_ok) {
                return a.is_ok ? 1 : -1;
            }
            // 如果都是成功的，按序号排序
            if (a.is_ok && b.is_ok) {
                return (a.serial_number || 0) - (b.serial_number || 0);
            }
            return 0;
        });

        const start = (search_params.page - 1) * search_params.pageSize;
        const end = start + search_params.pageSize;
        return sortedList.slice(start, end);
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
        }
        if (!is_next && search_params.page > 1) {
            search_params.page -= 1;
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
    }

    /**
     * @param {string} value
     * 搜索
     */
    function onSearch(value) {
        search_keyword = value;
        search_params.page = 1; // 搜索时重置到第一页
    }

    

    export function triggerFileInput() {
        failure_student_list = [];
        success_count = 0;
        search_keyword = "";
        search_params.name = "";
        search_params.page = 1;
        search_params.pageSize = 10;
        if (file_input) {
            file_input.click();
        }
    }

    function handleEdit(student, idx) {
        editing_index = idx;
        editing_serial_number = student.serial_number;
        editing_row = { ...student };
    }

    function handleCancelEdit() {
        editing_index = -1;
        editing_serial_number = null;
        editing_row = { official_name: '', phone: '', id_card_no: '', serial_number: null, error_type:"" };
    }

    async function handleSaveEdit() {

        if (!editing_row.official_name) {
            editing_row.error_type = '姓名不能为空';
            return;
        }
        if (!/^1[3-9]\d{9}$/.test(editing_row.phone)) {
            editing_row.error_type = '手机号格式错误';
            return;
        }
        if (!/(^\d{15}$)|(^\d{17}(\d|X|x)$)/.test(editing_row.id_card_no)) {
            editing_row.error_type = '身份证号格式错误';
            return;
        }

        let new_student = {
            ...$state.snapshot(editing_row),
        };
        
        // 校验通过，更新数据
        failure_student_list = failure_student_list.map(item => {
            if (item.serial_number === editing_serial_number) {
                return {
                    ...new_student,
                    serial_number: editing_serial_number,
                    error_type: "",
                    is_ok: true,
                };
            }
            return item;
        });
        
        editing_index = -1;
        editing_serial_number = null;
        editing_row = { official_name: '', phone: '', id_card_no: '', serial_number: null, error_type:"" };
    }

    function handleDelete(student) {
        // 从student_list中删除该考生
        failure_student_list = failure_student_list.filter(item => item.serial_number !== student.serial_number);
    }
</script>

<div class={show ? "student-panel-container" : "hide"}>
    <div class="student-panel">
        <div class="panel-header">
            <span class="panel-header-text">导入考生</span>
            <button
                class="close-btn"
                onclick={() => {
                    search_params.page = 1;
                    selected_ids = [];
                    failure_student_list = [];
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
                            search_keyword = e.target.value;
                        }}
                    </InputBox>
                </div>
                <div class="checkbox-container">
                    <span style="font-size: 12px;">
                        导入成功
                        <span style="color: #00A870; margin:0 2px 0 2px;">
                            {success_count}
                        </span>
                        名
                    </span>
                    <span style="font-size: 12px; margin-right:15px">
                        导入失败
                        <span style="color: #FF4D4F; margin:0 2px 0 2px;">
                            {failure_count}
                        </span>
                        名
                    </span>
                </div>
                <input
                    type="file"
                    id="fileInput"
                    style="display: none"
                    bind:this={file_input}
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
                            {#each current_page_data as student, index}
                                {#if editing_serial_number === student.serial_number}
                                    <tr class={`student failed-row`}>
                                        <td><input type="text" bind:value={editing_row.official_name} style="width:90px" /></td>
                                        <td><input type="text" bind:value={editing_row.phone} style="width:120px" /></td>
                                        <td><input type="text" bind:value={editing_row.id_card_no} style="width:180px" /></td>
                                        <td style={editing_row.error_type === null || editing_row.error_type === "" ? "" : "color: #ff4d4f;"}>{editing_row.error_type === null || editing_row.error_type === ""? "--":ERROR_TYPE[editing_row.error_type]}</td>
                                        <td style="width:260px">
                                            <button class="action-btn" onclick={handleSaveEdit}>保存</button>
                                            <button class="action-btn" onclick={handleCancelEdit}>取消</button>
                                        </td>
                                    </tr>
                                {:else}
                                    <tr class={`student ${!student.is_ok ? "failed-row" : "selected"}`}>
                                        <td>{student.official_name}</td>
                                        <td>{student.phone}</td>
                                        <td>{student.id_card_no}</td>
                                        <td style={student.error_type === null || student.error_type === "" ? "" : "color: #ff4d4f;"}>{student.error_type === null || student.error_type === ""? "--":ERROR_TYPE[student.error_type]}</td>
                                        <td style="width:260px">
                                            {#if !student.is_ok}
                                                <button class="action-btn" onclick={() => handleEdit(student, index)}>编辑</button>
                                            {/if}
                                            <button class="action-btn" onclick={() => handleDelete(student)}>删除</button>
                                        </td>
                                    </tr>
                                {/if}
                            {/each}
                        </tbody>
                    </table>
                    {#if failure_student_list.length === 0}
                        <div class="no-data-text">暂无数据</div>
                    {/if}
                </div>
                <div class="pagination-container">
                    <span style="font-size: 12px; margin-right:10px">
                        已选 <span style="color: #00A870; margin:0 5px 0 5px;">{selected_ids.length}</span> 条
                    </span>
                    <!-- <Pagination
                        show_per_page={false}
                        total_data_num={totals}
                        total_page_num={total_page}
                        current_page_num={current_page}
                        onPageChangeFunc={onNextOrLastPage}
                        onPageSearchFunc={onSearchPageFunc}
                        {onPageChooseFunc}
                    ></Pagination> -->
                     <Pagination
                        totalItems={totals}
                        pageSize={search_params.pageSize}
                        currentPage={search_params.page}
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
                    search_params.page = 1;
                    selected_ids = [];
                    failure_student_list = [];
                    onCancel();
                }}>返回</button
            >
            <button
                class="btn save"
                onclick={() => {
                    const students = failure_student_list
                    .filter(student => student.is_ok)
                    .map(student => ({
                        official_name: student.official_name,
                        id_card_no: student.id_card_no,
                        phone: student.phone
                    }));

                    if (students.length <= 0) {
                        action_toast.show("error","没有符合格式要求的学生，请确保学生信息格式正确")
                        return
                    }
                    handleImport(students);
                }}>重新导入</button
            >
        </div>
    </div>
</div>

<!-- <ActionToast
    bind:isShow={show_action_toast}
    bind:this={action_toast}
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
