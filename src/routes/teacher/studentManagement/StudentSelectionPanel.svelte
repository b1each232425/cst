<!-- 
 /*
 * @Author: Mayux dbs45412@163.com
 * @Date: 2025-04-18 11:48:06
 * @LastEditors: Mayux && 1243805308@qq.com
 * @LastEditTime: 2025-06-15 16:02:58
 * @FilePath: \tutorial-platform-fe\src\routes\teacher\examManagement\ExamineeSelectionPanel.svelte
 * @Description: 学生选择面板（支持搜索系统学生并绑定、导入新学生并自动归属自己）
 * Copyright (c) 2025 by Mayux, All Rights Reserved. 
 */ 
 -->
<script>
    import ActionToast from "$lib/component/ActionToast.svelte";
    import Pagination from "$lib/component/Pagination.svelte";
    import SearchInput from "$lib/component/SearchInput.svelte";

    let {
        show_panel = false,
        onCancel = () => {},
        onConfirm = () => {},
    } = $props();

    /** @type {any[]} */
    let student_list = $state([]);
    /** @type {any[]} */
    let selected_ids = $state([]); // 选中的学生id
    let search_params = $state({ keyword: "", page: 1, pageSize: 10 });
    let totals = $state(0);
    let total_page = $derived(Math.ceil(totals / search_params.pageSize) || 1);
    let current_page = $state(1);
    let loading = $state(false);
    let error = $state("");
    let is_all_selected = $state(false);
    let show_action_toast = $state(false);
    /** @type {any} */
    let action_toast = $state(null);

    // 搜索学生（系统中未归属当前老师的学生）
    async function searchStudents(
        keyword = search_params.keyword,
        page = search_params.page,
    ) {
        loading = true;
        error = "";
        let query_params = new URLSearchParams();
        query_params.append("search_text", keyword || "");
        query_params.append("page", page.toString());
        query_params.append("page_size", search_params.pageSize.toString());
        try {
            const response = await fetch(
                `/api/teacher/student/search?${query_params.toString()}`,
                {
                    method: "GET",
                    credentials: "include",
                    headers: { "Content-Type": "application/json" },
                },
            );
            const result = await response.json();
            if (result.status !== 0) {
                error = result.msg || "搜索失败";
                student_list = [];
                totals = 0;
                if (action_toast && typeof action_toast.show === "function")
                    action_toast.show("error", error);
            } else {
                console.log(result.data);
                student_list = result.data.students || [];
                totals = result.data.total || 0;
                current_page = page;
                // 更新选中状态
                let selected_id_set = new Set(selected_ids);
                student_list.forEach((stu) => {
                    stu.selected = selected_id_set.has(stu.id);
                });
                is_all_selected = isAllSelected();
            }
        } catch (e) {
            error = "网络错误";
            student_list = [];
            totals = 0;
            if (action_toast && typeof action_toast.show === "function")
                action_toast.show("error", error);
        }
        loading = false;
    }

    /** @param {string} keyword */
    function onSearch(keyword) {
        search_params.keyword = keyword;
        if (keyword.length > 0) {
            search_params.page = 1;
            searchStudents(keyword, 1);
        }
    }
    /** @param {number} page */
    function onPageChooseFunc(page) {
        search_params.page = page;
        searchStudents(search_params.keyword, page);
    }
    /** @param {string} value */
    function onSearchPageFunc(value) {
        const pageNum = parseInt(value);
        if (!isNaN(pageNum) && pageNum > 0 && pageNum <= total_page) {
            search_params.page = pageNum;
            searchStudents(search_params.keyword, pageNum);
        }
    }
    /** @param {boolean} is_next */
    function onPageChangeFunc(is_next) {
        let page = search_params.page;
        if (is_next && page < total_page) page++;
        if (!is_next && page > 1) page--;
        search_params.page = page;
        searchStudents(search_params.keyword, page);
    }
    function toggleSelectAll() {
        is_all_selected = !is_all_selected;
        if (is_all_selected) {
            selected_ids = student_list.map((stu) => stu.id);
            student_list.forEach((stu) => (stu.selected = true));
        } else {
            selected_ids = [];
            student_list.forEach((stu) => (stu.selected = false));
        }
    }
    function isAllSelected() {
        return (
            student_list.length > 0 && student_list.every((stu) => stu.selected)
        );
    }
    /** @param {any} stu */
    function toggleSelect(stu) {
        stu.selected = !stu.selected;
        if (stu.selected) {
            if (!selected_ids.includes(stu.id))
                selected_ids = [...selected_ids, stu.id];
        } else {
            selected_ids = selected_ids.filter((id) => id !== stu.id);
        }
        is_all_selected = isAllSelected();
    }
    // 绑定选中学生到自己名下
    async function bindSelectedStudents() {
        if (selected_ids.length === 0) {
            if (action_toast && typeof action_toast.show === "function")
                action_toast.show("error", "请先选择学生");
            return;
        }
        let data = {
            student_ids: selected_ids,
        };
        const response = await fetch("/api/teacher/student/bind", {
            method: "POST",
            credentials: "include",
            body: JSON.stringify({ data: data }),
        });
        if (response.status !== 200) {
            const responseText = await response.text();
            if (action_toast && typeof action_toast.show === "function")
                action_toast.show("error", responseText);
            return;
        }
        const result = await response.json();
        if (result.status === 0) {
            if (action_toast && typeof action_toast.show === "function")
                action_toast.show("success", "绑定成功");
            show_panel = false;
            onConfirm(); // 通知父组件刷新学生列表
        } else {
            if (action_toast && typeof action_toast.show === "function")
                action_toast.show("error", result.msg || "绑定失败");
        }
    }
</script>

<div class={show_panel ? "examinee-panel-container" : "hide"}>
    <div class="examinee-panel">
        <div class="panel-header">
            <span class="panel-header-text">选择学生</span>
            <button
                class="close-btn"
                onclick={() => {
                    show_panel = false;
                    onCancel();
                }}>×</button
            >
        </div>
        <div class="panel-body">
            <div class="action-container">
                <div
                    class="examinee-search-container"
                    style="height: 32px;width:350px; margin-left:10px"
                >
                    <SearchInput
                        purpose_text={"搜索学生"}
                        place_holder={"请输入姓名/手机号/身份证号"}
                        onSearchFunc={onSearch}
                    />
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
                                    checked={is_all_selected}
                                />
                            </th>
                            <th class="table-head">姓名</th>
                            <th class="table-head">性别</th>
                            <th class="table-head">手机号</th>
                            <th class="table-head">身份证号</th>
                        </tr>
                    </thead>
                    <tbody>
                        {#each student_list as stu}
                            <tr
                                class={`examinee ${stu.selected ? "selected" : ""}`}
                            >
                                <td>
                                    <input
                                        type="checkbox"
                                        class="custom-checkbox"
                                        checked={stu.selected}
                                        onchange={() => toggleSelect(stu)}
                                    />
                                </td>
                                <td>{stu.official_name || "--"}</td>
                                <td>{stu.gender || "--"}</td>
                                <td>{stu.phone || "--"}</td>
                                <td>{stu.id_card_no || "--"}</td>
                            </tr>
                        {/each}
                    </tbody>
                </table>
                {#if student_list.length === 0}
                    <div class="no-data-text">请搜索学生</div>
                {/if}
            </div>
            <div class="pagination-container">
                <span style="font-size: 12px; margin-right:10px">
                    已选 <span style="color: #00A870; margin:0 5px 0 5px;"
                        >{selected_ids.length}</span
                    > 条
                </span>
                <Pagination
                    show_per_page={false}
                    total_data_num={totals}
                    total_page_num={total_page}
                    current_page_num={search_params.page}
                    {onPageChangeFunc}
                    onPageSearchFunc={onSearchPageFunc}
                    {onPageChooseFunc}
                />
            </div>
        </div>
        <div class="panel-footer">
            <button
                class="btn"
                onclick={() => {
                    show_panel = false;
                    onCancel();
                }}>取消</button
            >
            <button class="btn save" onclick={bindSelectedStudents}>确定</button
            >
        </div>
    </div>
</div>

<ActionToast bind:isShow={show_action_toast} bind:this={action_toast} />

<style lang="scss" scoped>
    .hide {
        display: none;
    }

    .table {
        width: 100%;
        border-collapse: collapse;

        th,
        td {
            font-size: 14px;
            color: (0, 0, 0, 0.3);
            border: none;
            padding: 0 8px;
            text-align: center;
            overflow: visible;
            border-top: none;
            border-left: none;
            border-right: none;
            min-height: 40px;
            height: 40px;
            max-height: 40px;
            box-sizing: border-box;
        }

        td {
            min-height: 40px;
            max-height: 40px;
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
    }

    .button-group {
        display: flex;
        gap: 16px;
    }

    .examinee-selection-table-container {
        margin: 20px 0px 0 0px;
        flex: 1;
        min-height: 400px;
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
        color: #0052d9;
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
            background: #0052d9;
            color: #fff;
            border-color: #0052d9;
            &:hover {
                background: #2563eb;
                border-color: #2563eb;
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
        color: #165dff;
        font-size: 14px;
        cursor: pointer;
    }

    .upload-file-button {
        border: none;
        border-radius: 3px;
        background-color: #165dff;
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
        color: #999;
        font-size: 14px;
        font-weight: normal;
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
            min-height: 40px;
            max-height: 40px;
            .table-head {
                font-weight: normal;
                background: #fff;
                color: rgb(0, 0, 0, 0.3);
            }
        }
    }
</style>
