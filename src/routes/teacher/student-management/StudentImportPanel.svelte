<script>
    import Pagination from "$lib/components/Pagination/Pagination.svelte";
    import InputBox from "$lib/components/Input/InputBox.svelte";
    import Button from "$lib/components/Button/Button.svelte";
    import Empty from "$lib/components/Table/Empty.svelte";

    import { toast } from "$lib/components/Toast/Toast.js";
    import { debounce } from "./_utils/debounce.js";
    import { checkData } from "./_utils/batch_check/check_examinee";
    import { fail } from "@sveltejs/kit";

    let searchText = $state(""); // 搜索框文本内容
    let failureStudentList = $state([]);
    let successCount = $derived(
        failureStudentList.filter((item) => item.is_ok).length,
    );
    let failureCount = $derived(
        failureStudentList.filter((item) => !item.is_ok).length,
    );
    let filteredStudentList = $derived(filterStudentList());

    let currentPageData = $derived(getCurrentPage());

    //搜索参数
    let searchParams = $state({
        name: "",
        page: 1,
        pageSize: 10,
    });

    // 分页相关状态
    const PAGE_SIZE = 10;
    let currentPage = $state(1);
    let pageSize = $state(10);
    let totalItems = $derived(filteredStudentList.length);
    let totalPages = $derived(Math.ceil(failureStudentList.length / PAGE_SIZE));

    // 编辑状态
    let editingIndex = $state(-1);
    let editingSerialNumber = $state(null);
    let editingRow = $state({
        official_name: "",
        phone: "",
        id_card_no: "",
        serial_number: null,
        error_type: "",
    });

    //报错
    let error = $state("");
    const ERROR_TYPE = {
        duplicate_id_card: "身份证号重复",
        duplicate_phone: "手机号重复",
        phone_used: "手机号已被其他用户使用",
        缺少必填项: "缺少必填项",
        手机号格式错误: "手机号格式错误",
        身份证号格式错误: "身份证号格式错误",
    };

    let {
        show = $bindable(false), // 是否显示弹窗
        onImport = (isAllOk) => {},
    } = $props();

    let fileInput = $state(null);

    // 文件上传处理 TODO:待优化
    async function handleFileUpload(event) {
        // 获取上传的文件
        const files = event.target.files;
        if (!files || files.length === 0) {
            toast.warning("请重新选择要导入的文件");
            return;
        }
        const file = files[0];

        // 检查文件类型
        const validTypes = [
            "application/vnd.ms-excel", // Excel 97-2003
            "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", // Excel 2007+
        ];
        const ext = file.name.split(".").pop().toLowerCase();
        if (
            !validTypes.includes(file.type) &&
            ext !== "xls" &&
            ext !== "xlsx"
        ) {
            toast.error("只支持Excel文件（.xls, .xlsx）");
            return;
        }
        if (file) {
            let result = await checkData(file);
            if (result.error) {
                error = result.error;
                toast.error(error);
                return;
            }
            if (result.data.length <= 0) {
                return;
            }
            // 转换字段名
            const convertedData = result.data.map((item) => ({
                official_name: item["姓名"],
                phone: item["手机号"],
                id_card_no: item["身份证号"],
                serial_number: item["编号"],
                error_type: item.error_type,
                is_ok: item.is_ok,
            }));
            failureStudentList = convertedData;
            show = true;
            if (fileInput) {
                fileInput.value = null;
            }
        }
    }

    // 过滤学生列表 TODO:待优化
    function filterStudentList() {
        let filtered = failureStudentList;
        // 如果搜索框有内容
        if (searchText) {
            filtered = filtered.filter((student) => {
                const name = student.official_name || "";
                const phone = student.phone || "";
                const idCard = student.id_card_no || "";
                return (
                    name.includes(searchText) ||
                    phone.includes(searchText) ||
                    idCard.includes(searchText)
                );
            });
        }
        return filtered;
    }


    function getCurrentPage() {
        const sortedList = [...filteredStudentList].sort((a, b) => {
            if (a.is_ok !== b.is_ok) return a.is_ok ? 1 : -1; // 失败在前
            if (a.is_ok && b.is_ok) return a.serial_number - b.serial_number;
            return 0;
        });

        const start = (searchParams.page - 1) * PAGE_SIZE;
        const end = start + PAGE_SIZE;
        return sortedList.slice(start, end);
    }

    //搜索处理
    function onSearch(value) {
        searchText = value;
        searchParams.page = 1; // 搜索时重置到第一页
    }

    //与父页面通信
    export function triggerFileInput() {
        //重置数据
        failureStudentList = [];
        successCount = 0;
        //TODO:搜索框
        if (fileInput) {
            fileInput.click();
        }
    }

    //编辑按钮
    function handleEdit(student, idx) {
        editingIndex = idx;
        editingSerialNumber = student.serial_number;
        editingRow = { ...student };
    }

    //关闭按钮
    function closePanel() {
        show = false;
        onImport(false);
    }

    //编辑后的保存按钮
    function handleSaveEdit() {
        // 先将编辑行的内容应用到列表副本
        let tempList = failureStudentList.map((item) => {
            if (item.serial_number === editingSerialNumber) {
                return { ...editingRow };
            }
            return item;
        });
        const phoneCount = {};
        const idCardCount = {};

        tempList.forEach((item) => {
            if (item.phone)
                phoneCount[item.phone] = (phoneCount[item.phone] || 0) + 1;
            if (item.id_card_no)
                idCardCount[item.id_card_no] =
                    (idCardCount[item.id_card_no] || 0) + 1;
        });

        // 先处理重复，所有重复项都直接标记为重复错误
        let hasDuplicate = false;
        tempList = tempList.map((item) => {
            if (phoneCount[item.phone] > 1) {
                hasDuplicate = true;
                return { ...item, error_type: "duplicate_phone", is_ok: false };
            }
            if (idCardCount[item.id_card_no] > 1) {
                hasDuplicate = true;
                return {
                    ...item,
                    error_type: "duplicate_id_card",
                    is_ok: false,
                };
            }
            return { ...item };
        });
        // 如果有重复，直接更新列表并退出编辑
        if (hasDuplicate) {
            failureStudentList = tempList;
            editingIndex = -1;
            editingSerialNumber = null;
            editingRow = {
                official_name: "",
                phone: "",
                id_card_no: "",
                serial_number: null,
                error_type: "",
            };
            return;
        }
        // 没有重复，再判断格式、缺项等
        tempList = tempList.map((item) => {
            if (!item.official_name) {
                return { ...item, error_type: "姓名不能为空", is_ok: false };
            }
            if (!/^1[3-9]\d{9}$/.test(item.phone)) {
                return { ...item, error_type: "手机号格式错误", is_ok: false };
            }
            if (!/(^\d{15}$)|(^\d{17}(\d|X|x)$)/.test(item.id_card_no)) {
                return {
                    ...item,
                    error_type: "身份证号格式错误",
                    is_ok: false,
                };
            }
            return { ...item, error_type: "", is_ok: true };
        });
        failureStudentList = tempList;
        editingIndex = -1;
        editingSerialNumber = null;
        editingRow = {
            official_name: "",
            phone: "",
            id_card_no: "",
            serial_number: null,
            error_type: "",
        };
    }

    //取消编辑按钮
    function handleCancelEdit() {
        editingIndex = -1;
        editingSerialNumber = null;
        editingRow = {
            official_name: "",
            phone: "",
            id_card_no: "",
            serial_number: null,
            error_type: "",
        };
    }

    // 删除按钮
    function handleDelete(student) {
        failureStudentList = failureStudentList.filter(
            (item) => item.serial_number !== student.serial_number,
        );
    }

    // 生成随机账号TODO:改为使用后端接口
    function generateRandomAccount() {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz";
    return Array.from({ length: 12 }, () =>
        chars.charAt(Math.floor(Math.random() * chars.length))
    ).join("");
}


    // 确认导入按钮TODO:待优化
   function handleImport() {
    const validStudents = failureStudentList.filter(s => s.is_ok);
    if (validStudents.length === 0) {
        toast.warning("没有可导入的学生，请先修正错误数据");
        return;
    }

    const payloads = validStudents.map(student => ({
        IDCardNo: student.id_card_no?.trim() || null,
        OfficialName: student.official_name?.trim() || null,
        MobilePhone: student.phone?.trim() || null,
        Account: generateRandomAccount(),
        Gender: null,
        Email: null,
        IDCardType: "居民身份证"
    }));

    const requestBody = { data: payloads };

    fetch("/api/user", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(requestBody),
    })
        .then(res => {
            if (!res.ok) {
                return res.text().then(msg => {
                    throw new Error(`导入失败: ${res.status} ${res.statusText} - ${msg}`);
                });
            }
            return res.json();
        })
        .then(result => {
            if (result.status !== 0) {
                throw new Error(result.msg || "导入失败");
            }
            toast.success(`成功导入 ${payloads.length} 名学生`);
            failureStudentList = failureStudentList.filter(s => !s.is_ok);
            onImport(true);
        })
        .catch(err => {
            toast.error(err.message || "导入失败，请稍后重试");
        });
}


    // 页码选择处理
    function handlePageChange(event) {
        currentPage = event.detail;
        // TODO: 添加页码变更逻辑
    }

    // 每页大小变更处理
    function handlePageSizeChange(event) {
        pageSize = event.detail;
        currentPage = 1;
        // TODO: 添加每页大小变更逻辑
    }
</script>

<div class={show ? "student-panel-container" : "hide"}>
    <div class="student-panel">
        <div class="panel-header">
            <span class="panel-header-text">导入学生</span>
            <button
                class="close-btn"
                onclick={() => {
                    closePanel();
                }}>×</button
            >
        </div>
        <div class="panel-body">
            <div class="action-container">
                <div class="filter-item">
                    <span class="filter-label">搜索学生</span>
                    <div class="search-container">
                        <InputBox
                            placeholder="请输入姓名/手机号/身份证号"
                            type="text"
                            bind:value={searchText}
                            showLabel={false}
                            oninput={onSearch}
                        ></InputBox>
                    </div>
                </div>
                <div class="checkbox-container">
                    <span class="checkbox-item">导入成功{successCount}名</span>
                    <span class="checkbox-item">导入失败{failureCount}名</span>
                </div>
                <input
                    type="file"
                    id="fileInput"
                    class="file-input-hidden"
                    accept=".xls,.xlsx,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
                    onchange={handleFileUpload}
                    bind:this={fileInput}
                />
            </div>
            <div class="student-table-container">
                <table class="student-table">
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
                            <!-- 如果这正在编辑 -->
                            {#if editingSerialNumber === student.serial_number}
                                <tr class="student failed-row">
                                    <td
                                        ><input
                                            type="text"
                                            bind:value={
                                                editingRow.official_name
                                            }
                                            class="input-name"
                                        /></td
                                    >
                                    <td class="table-data"
                                        ><input
                                            type="text"
                                            bind:value={editingRow.phone}
                                            class="input-phone"
                                        /></td
                                    >
                                    <td class="table-data"
                                        ><input
                                            type="text"
                                            bind:value={editingRow.id_card_no}
                                            class="input-id"
                                        /></td
                                    >
                                    <td
                                        class:error-text={editingRow.error_type}
                                    >
                                        {editingRow.error_type === null ||
                                        editingRow.error_type === ""
                                            ? "--"
                                            : ERROR_TYPE[editingRow.error_type]}
                                    </td>

                                    <td class="table-data action-btn-container">
                                        <button
                                            class="action-btn"
                                            onclick={handleSaveEdit}
                                            >保存</button
                                        >
                                        <button
                                            class="action-btn"
                                            onclick={handleCancelEdit}
                                            >取消</button
                                        >
                                    </td>
                                </tr>
                            {:else}
                                <tr
                                    class={`student ${!student.is_ok ? "failed-row" : "selected"}`}
                                >
                                    <td>{student.official_name}</td>
                                    <td>{student.phone}</td>
                                    <td>{student.id_card_no}</td>
                                    <td
                                        class:error-text={student.error_type &&
                                            student.error_type !== ""}
                                    >
                                        {student.error_type === null ||
                                        student.error_type === ""
                                            ? "--"
                                            : ERROR_TYPE[
                                                  student.error_type
                                              ]}</td
                                    >
                                    <td class="action-btn-container">
                                        {#if !student.is_ok}
                                            <button
                                                class="action-btn"
                                                onclick={() =>
                                                    handleEdit(student, index)}
                                                >编辑</button
                                            >
                                        {/if}
                                        <button
                                            class="action-btn"
                                            onclick={() =>
                                                handleDelete(student)}
                                            >删除</button
                                        >
                                    </td>
                                </tr>
                            {/if}
                        {/each}
                        <tr class="empty-row {failureStudentList.length > 0 ? 'hide' : ''}">
                            <td colspan="5" class="empty-cell">
                                <div class="empty-container">
                                    <Empty text="暂无学生数据" />
                                </div>
                            </td>
                        </tr>
                    </tbody>
                </table>
            </div>
            <div class="pagination-container">
                <Pagination
                    {totalItems}
                    {currentPage}
                    {pageSize}
                    pageSizeOptions={[10]}
                    on:pageChange={handlePageChange}
                    on:pageSizeChange={handlePageSizeChange}
                />
            </div>
        </div>
        <div class="panel-footer">
            <Button type="primary" plain>返回</Button>
            <Button type="primary" onclick={handleImport}>确认导入</Button>
        </div>
    </div>
</div>

<style lang="scss" scoped>
    $normal-font-size: 14px;
    $gray-font-color: rgb(0, 0, 0, 0.6);

    .student-panel-container {
        position: fixed;
        top: 0%;
        left: 0%;
        width: 100vw;
        height: 100vh;
        background-color: rgba(0, 0, 0, 0.25);
        display: flex;
        justify-content: center;
        align-items: center;
        z-index: 10001;
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
        color: #1a1a1a;
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
                color: #ff4d4f;
                background: rgba(0, 0, 0, 0.04);
            }
        }
    }

    .hide {
        display: none;
    }

    .student-table-head {
        background-color: #ffffff;
        font-size: $normal-font-size;
        color: rgb(0, 0, 0, 0.3);
        border: none;
        text-align: center;
        .table-head-row {
            .table-head {
                background: #fff;
                color: rgb(0, 0, 0, 0.3);
            }
        }
    }

    .panel-body {
        padding: 24px;
        flex: 1;
        display: flex;
        flex-direction: column;

        .file-input-hidden {
            display: none;
        }
    }

    .action-container {
        display: flex;
        flex-direction: row;
        align-items: center;
        justify-content: space-between;
        padding: 0 16px;

        .filter-item {
            display: flex;
            font-size: $normal-font-size;
            min-width: 100px;
            color: $gray-font-color;
            white-space: nowrap;
            align-items: center;
            justify-items: center;
            gap: 10px;

            .search-container {
                position: relative;
                display: flex;
                min-width: 250px;
            }
        }

        .checkbox-container {
            display: flex;
            font-size: 16px;
            gap: 8px;
        }
    }

    .student-table-container {
        margin: 20px 0px 0 0px;
        flex: 1;
        min-height: 400px;
        position: relative;
        display: flex;
        flex-direction: column;
    }

    .student-table {
        max-height: 40px;
        width: 100%;
        border-collapse: collapse;
        flex: 1;

        th,
        td {
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

        .empty-row td{
            border-bottom: none;
        }

        th {
            color: rgba(0, 0, 0, 0.3);
            background: #fafafa;
        }

        tbody {
            tr {
                &:hover {
                    background-color: #e0f0ff;
                }

                &.selected {
                    background-color: #d0e8ff;
                    &:hover {
                        background-color: #c0d8ff;
                    }
                }
            }
        }

        .input-phone {
            width: 90px;
        }

        .input-phone {
            width: 120px;
        }

        .input-id {
            width: 180px;
        }

        .action-btn-container {
            width: 260px;
        }

        .error-text {
            color: #ff4d4f;
        }

        .failed-row {
            background-color: #ffeaea;
        }
        .failed-row:hover {
            background-color: #ffd6d6;
        }

        .action-btn {
            border: none;
            padding: 4px 6px;
            font-size: 14px;
            cursor: pointer;
            margin: 0 4px;
            background: rgba(0, 0, 0, 0);
            color: #0052d9;
        }
        .action-btn:hover {
            font-weight: bold;
        }
    }
    

    .empty-row.hide {
        display: none;
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
</style>
