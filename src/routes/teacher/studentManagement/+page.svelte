<!--/**
 * @Author: ZouYingXiong && 1584637407@qq.com
 * @Date: 2025-04-25 09:03:19
 * @LastEditors: wusaber33
 * @LastEditTime: 2025-07-05 16:43:33
 * @FilePath: \tutorial-platform-fe\src\routes\teacher\studentManagement\+page.svelte
 * @Description: 学生管理页
 * @Copyright (c) 2025 by ZouYingXiong, All Rights Reserved. 
 */ -->

<script>
    // @ts-nocheck
    import { onMount } from "svelte";
    import Title from "$lib/component/Title.svelte";
    import Pagination from "$lib/component/Pagination.svelte";
    import ToggleSwitch from "./ToggleSwitch.svelte";
    import Dialog from "./Dialog.svelte";
    import StudentSelectionPanel from "./StudentSelectionPanel.svelte";
    import StudentImportPanel from "./StudentImportPanel.svelte";
    import { error } from "@sveltejs/kit";
    import ActionToast from "$lib/component/ActionToast.svelte";
    import DropdownGray from "$lib/component/DropdownGray.svelte";
    /**
     * @type {Array<{id: number,  official_name: string,account: string, gender: string,passwd:string, phone: string, status: string, id_card_no: string,selected:boolean}>}
     */
    let students = $state([]);
    // 搜索和筛选状态
    let search_text = $state("");
    let account_status = $state("全部");
    let status_list = [
        {value: "全部", label: "全部"},
        {value: "启用", label: "启用"},
        {value: "停用", label: "停用"},
    ];
    let is_open = $state(false); // 控制下拉菜单的展开状态

    let deleteDialogOpen = $state(false);
    let deleteMoreDialogOpen = $state(false);
    let current_delete_student_id = $state(null);
    let deleteDialogTitle = $state("");
    let deleteDialogContent = $state("");

    let unbindDialogOpen = $state(false);
    let unbindMoreDialogOpen = $state(false);
    let current_unbind_student_id = $state(null);
    let unbindDialogTitle = $state("");
    let unbindDialogContent = $state("");
    let show_action_toast = $state(false);
    let action_toast = $state(null);

    // 分页状态
    let current_page = $state(1);
    let page_size = $state(10);
    let total_num = $state(0);
    let total_pages = $state(0);

    let showSelectionPanel = $state(false);
    let showImportPanel = $state(false);
    let student_import_panel = $state(null);

    const TIP_TEXT = {
        deleted: "删除学生后，学生的账号信息将被清除，无法恢复。请谨慎操作。",
        removed:
            "移除学生后，学生将不再归属于您，但账号不会被删除。请谨慎操作。",
    };
    // 获取学生数据的异步函数
    async function fetchStudents(
        page = 1,
        pageSize = 10,
        accountStatus = "全部",
        searchText = "",
    ) {
        try {
            // 根据 account_status 设置 statusFilter 的值
            let statusFilter;
            if (accountStatus === "全部") {
                statusFilter = "";
            } else if (accountStatus === "启用") {
                statusFilter = "00";
            } else if (accountStatus === "停用") {
                statusFilter = "02";
            }
            const queryParams = new URLSearchParams({
                page: page.toString(),
                page_size: page_size.toString(),
                status: statusFilter,
                search_text: search_text,
            });
            const response = await fetch(
                `/api/teacher/student/list?${queryParams}`,
                {
                    method: "GET",
                    credentials: "include",
                },
            );
            if (!response.ok) {
                throw new Error("Network response was not ok");
            }
            const responseData = await response.json();
            if (responseData.status !== 0) {
                console.error("获取学生数据失败:", responseData.msg);
            }
            if (responseData.data === null || responseData.data.length === 0) {
                students = [];
                total_num = 0;
                total_pages = 0;
            } else {
                students = responseData.data.map((student) => ({
                    ...student,
                    selected: false, // 添加 selected 字段
                }));
                total_num = responseData.rowCount;
                total_pages = Math.ceil(total_num / page_size);
            }
        } catch (error) {
            console.error("Error fetching students:", error);
        }
    }

    onMount(async () => {
        // 获取用户角色和权限
        await fetchUserRoleAndPermissions();
        await fetchStudents();
    });

    // 切换学生状态的函数
    /**
     * @param {number} id
     */
    function toggleStatus(id) {
        const newStatus =
            students.find((student) => student.id === id)?.status === "00"
                ? "02"
                : "00";
        const endpoint =
            newStatus === "00"
                ? "/api/teacher/student/activate"
                : "/api/teacher/student/deactivate";

        // 调用新的激活/禁用API
        fetch(endpoint, {
            method: "PATCH",
            headers: {
                "Content-Type": "application/json",
            },
            credentials: "include",
            body: JSON.stringify({
                data: [id],
            }),
        })
            .then(async (response) => {
                if (!response.ok) {
                    throw new Error("状态更新失败");
                }
                const result = await response.json();
                if (result.status === 0) {
                    // 更新本地状态
                    students = students.map((student) =>
                        student.id === id
                            ? { ...student, status: newStatus }
                            : student,
                    );
                } else {
                    console.error("状态更新失败:", result.msg);
                }
            })
            .catch((error) => {
                console.error("Error updating status:", error);
            });
    }

    // 切换页码的函数
    /**
     * @param {number} page
     */
    function changePage(page) {
        current_page = page;
    }

    // 批量启用学生
    function enableStudents() {
        const selectedIds = students
            .filter((student) => student.selected)
            .map((student) => student.id);

        if (selectedIds.length === 0) {
            return;
        }

        fetch("/api/teacher/student/activate", {
            method: "PATCH",
            headers: {
                "Content-Type": "application/json",
            },
            credentials: "include",
            body: JSON.stringify({
                data: selectedIds,
            }),
        })
            .then(async (response) => {
                if (!response.ok) {
                    responseText = await response.text();
                    throw new Error(responseText || "批量启用失败");
                }
                const result = await response.json();
                if (result.status === 0) {
                    fetchStudents();
                    selectAll = false; // 取消全选
                    action_toast.show("success", "批量启用成功");
                } else {
                    action_toast.show("error", "批量启用失败");
                    console.error("批量启用失败:", result.msg);
                }
            })
            .catch((error) => {
                action_toast.show("error", "批量启用失败");
                console.error("Error enabling students:", error);
            });
    }

    // 批量停用学生
    function disableStudents() {
        const selectedIds = students
            .filter((student) => student.selected)
            .map((student) => student.id);

        if (selectedIds.length === 0) {
            return;
        }

        fetch("/api/teacher/student/deactivate", {
            method: "PATCH",
            headers: {
                "Content-Type": "application/json",
            },
            credentials: "include",
            body: JSON.stringify({
                data: selectedIds,
            }),
        })
            .then(async (response) => {
                if (!response.ok) {
                    responseText = await response.text();
                    throw new Error(responseText || "批量停用失败");
                }
                const result = await response.json();
                if (result.status === 0) {
                    fetchStudents();
                    selectAll = false; // 取消全选
                    action_toast.show("success", "批量停用成功");
                } else {
                    action_toast.show("error", result.msg || "批量停用失败");
                }
            })
            .catch((error) => {
                action_toast.show("error", "批量停用失败");
                console.error("Error disabling students:", error);
            });
    }

    // 添加一个状态来跟踪全选复选框的状态
    let selectAll = $state(false);

    // 更新全选状态的函数
    function toggleSelectAll() {
        students = students.map((student) => ({
            ...student,
            selected: selectAll,
        }));
    }

    // 通用删除学生的函数
    async function deleteStudents() {
        try {
            const response = await fetch("/api/teacher/student", {
                method: "DELETE",
                credentials: "include",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    data: current_delete_student_id,
                }),
            });
            if (!response.ok) {
                responseText = await response.text();
                throw new Error(responseText || "删除失败");
            }
            const responseData = await response.json();

            if (responseData.status !== 0) {
                action_toast.show("error", responseData.msg || "删除失败");
            } else {
                // 成功处理
                await fetchStudents(); // 重新获取学生数据
                
                selectAll = false; // 取消全选
                // 关闭对应的对话框
                deleteDialogOpen = false;
                deleteMoreDialogOpen = false;
                action_toast.show("success", "删除成功");
            }
        } catch (err) {
            action_toast.show("error", "删除失败");
            console.error("删除失败：", err);
        }
    }

    // 批量删除学生的函数
    async function deleteSelectedStudents() {
        const selectedIds = students
            .filter((student) => student.selected)
            .map((student) => student.id);

        if (selectedIds.length === 0) {
            action_toast.show("error", "请至少选择一名学生进行删除");
            return;
        }

        current_delete_student_id = selectedIds;
        deleteMoreDialogOpen = true;
        deleteDialogTitle = `确认删除选中的 ${selectedIds.length} 名学生?`;
        deleteDialogContent = TIP_TEXT["deleted"];
    }

    // 单个删除学生的函数
    function deleteStudent(id) {
        const student = students.find((s) => s.id === id);
        current_delete_student_id = [id];
        deleteDialogOpen = true;
        deleteDialogTitle = `确认删除学生 ${student?.official_name || ""}?`;
        deleteDialogContent = TIP_TEXT["deleted"];
    }

    // 切换页面 - 点击上一页/下一页
    function handlePageNavigation(is_next) {
        if (is_next && current_page < totalPages) {
            current_page++;
        } else if (!is_next && current_page > 1) {
            current_page--;
        }
        fetchStudents(current_page, page_size, account_status, search_text);
    }

    // 点击具体页码
    function handlePageSelect(page) {
        current_page = page;
        fetchStudents(current_page, page_size, account_status, search_text);
    }

    // 改变每页显示数量
    function handlePageSizeChange(value) {
        page_size = parseInt(value);
        current_page = 1; // 重置到第一页
        fetchStudents(current_page, page_size, account_status, search_text);
    }

    // 输入页码跳转
    function handlePageSearch(value) {
        const pageNum = parseInt(value);
        if (!isNaN(pageNum) && pageNum > 0 && pageNum <= total_pages) {
            current_page = pageNum;
            fetchStudents(current_page, page_size, account_status, search_text);
        }
    }

    function openImportPanel() {
        if (student_import_panel) {
            student_import_panel.triggerFileInput();
        }
    }
    function closeImportPanel() {
        showImportPanel = false;
    }
    async function handleSelectionSuccess() {
        await handlePageSelect(1);
        showSelectionPanel = false;
    }

    async function handleImportSuccess(is_all_ok) {
        if (is_all_ok) {
            await handlePageSelect(1);
        }
        showImportPanel = false;
    }

    function openSelectionPanel() {
        showSelectionPanel = true;
    }
    function closeSelectionPanel() {
        showSelectionPanel = false;
    }

    // 批量解绑学生
    async function unbindSelectedStudents() {
        // 只解绑带有归属关系的学生
        const selectedIds = students
            .filter((student) => student.selected && student.has_relation)
            .map((student) => student.id);
        if (selectedIds.length === 0) {
            action_toast.show("error", "当前选择学生中没有归属于您的学生");
            return;
        }
        current_unbind_student_id = selectedIds;
        unbindMoreDialogOpen = true;
        unbindDialogTitle = `确认解绑选中的 ${selectedIds.length} 名学生?`;
        unbindDialogContent = TIP_TEXT["removed"];
    }

    // 单个解绑学生
    function unbindStudent(id) {
        const student = students.find((s) => s.id === id);
        //判断这个学生是否存在归属关系
        if (!student || !student.has_relation) {
            action_toast.show("error", "该学生没有归属关系");
            return;
        }
        current_unbind_student_id = [id];
        unbindDialogOpen = true;
        unbindDialogTitle = `确认解绑学生 ${student?.official_name || ""}?`;
        unbindDialogContent = TIP_TEXT["removed"];
    }

    // 通用解绑学生的函数
    async function unbindStudents() {
        try {
            if (current_unbind_student_id.length === 0) {
                return;
            }
            const request_data = {
                student_ids: current_unbind_student_id,
            };
            const response = await fetch("/api/teacher/student/unbind", {
                method: "POST",
                credentials: "include",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ data: request_data }),
            });
            const responseData = await response.json();
            if (responseData.status !== 0) {
                action_toast.show("error", "解绑失败");
                console.error("解绑失败:", responseData.msg);
            } else {
                await fetchStudents();
                selectAll = false;
                unbindDialogOpen = false;
                unbindMoreDialogOpen = false;
            }
        } catch (err) {
            console.error("解绑失败：", err);
        }
    }

    // 状态映射常量
    const StateMap = {
        "00": "已启用",
        "02": "已停用",
        "04": "已删除",
    };
    const StateClassMap = {
        "00": "enabled",
        "02": "disabled",
        "04": "deleted",
    };

    let user_permission = $state("04");
    async function fetchUserRoleAndPermissions() {
        // Fetch user role and permissions from the server
        const response = await fetch("/api/teacher/student/role", {
            method: "GET",
            credentials: "include",
        });
        const responseData = await response.json();

        if (responseData.status === 0) {
            user_permission = responseData.data.permission_level;
        } else {
            console.error("获取用户角色与权限失败:", responseData.msg);
        }
    }

    //下载考生模板
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
</script>

<div class="student-management-container">
    <Title title="学生列表" />
    <div class="table-action-container">
        <div class="action-layout">
            <!-- 左侧筛选区 -->
            <div class="left-section">
                <div class="input-item">
                    <span class="item-label">搜索</span>
                    <div class="input-container">
                        <div class="search-input-container">
                            <input
                                type="text"
                                bind:value={search_text}
                                placeholder="请输入姓名/账号/身份证号/手机号"
                                class="search-input"
                                onkeydown={(event) => {
                                    if (event.key === "Enter") {
                                        fetchStudents(
                                            current_page,
                                            page_size,
                                            account_status,
                                            search_text,
                                        );
                                    }
                                }}
                            />
                            {#if search_text}
                                <button
                                    class="clear-button"
                                    onclick={() => {
                                        search_text = "";
                                        fetchStudents(
                                            current_page,
                                            page_size,
                                            account_status,
                                            search_text,
                                        );
                                    }}>×</button
                                >
                            {/if}
                        </div>
                    </div>
                </div>
                <div class="input-item">
                    <span class="item-label">账号状态</span>
                    <div class="input-container">
                    <DropdownGray
                    options={status_list}
                    selected={account_status}
                    selectOptionFunc={(selected) => {
                        account_status = selected;
                        fetchStudents(current_page, page_size, account_status, search_text);
                    }}
                />
                </div>
                </div>
            </div>
            <!-- 右侧按钮区 -->
            <div class="right-section">
                <div class="button-item">
                    <button
                        class="download-template-button action-btn"
                        onclick={downloadTemplate}>下载导入模板</button
                    >
                </div>
                <div class="button-item">
                    <button
                        class="import-button action-btn"
                        onclick={openImportPanel}>导入</button
                    >
                </div>
                <div class="button-item">
                    <button
                        class="add-button action-btn"
                        onclick={openSelectionPanel}>添加</button
                    >
                </div>
                <div class="button-item">
                    <button
                        class="unbind-button action-btn"
                        onclick={unbindSelectedStudents}>移除</button
                    >
                    <span class="tip-wrapper">
                        <img
                            src="/exam_list/tip.png"
                            alt="提示"
                            style="width: 14px; height:auto"
                        />
                        <div class="tooltip-text" style="min-width: 255px;">
                            {TIP_TEXT["removed"]}
                        </div>
                    </span>
                </div>
                <div class="button-item">
                    <button
                        class="create-button action-btn"
                        onclick={() =>
                            (window.location.href =
                                "/teacher/studentManagement/add")}>创建</button
                    >
                </div>
                {#if user_permission === "00"}
                    <div class="button-item">
                        <button
                            class="delete-button action-btn"
                            onclick={deleteSelectedStudents}>删除</button
                        >
                        <span class="tip-wrapper">
                            <img
                                src="/exam_list/tip.png"
                                alt="提示"
                                style="width: 14px; height:auto"
                            />
                            <div class="tooltip-text" style="min-width: 255px;">
                                {TIP_TEXT["deleted"]}
                            </div>
                        </span>
                    </div>
                {/if}
                <div class="button-item">
                    <button
                        class="enable-button action-btn"
                        onclick={enableStudents}>启用</button
                    >
                </div>
                <div class="button-item">
                    <button
                        class="disable-button action-btn"
                        onclick={disableStudents}>停用</button
                    >
                </div>
            </div>
        </div>
    </div>
    <div class="table-container">
        <table class="student-list-table">
            <thead>
                <tr class="table-head-row">
                    <th style="width: 3%;" class="table-head">
                        <input
                            type="checkbox"
                            class="checkbox-all"
                            bind:checked={selectAll}
                            onchange={toggleSelectAll}
                        />
                    </th>
                    <th style="width: 12.52%;" class="table-head">账号</th>
                    <th style="width: 12.52%;" class="table-head">姓名</th>
                    <th style="width: 18.29%;" class="table-head">身份证号</th>
                    <th style="width: 6.76%;" class="table-head">账号状态</th>
                    <th style="width: 6.76%;" class="table-head">性别</th>
                    <th style="width: 13.92%;" class="table-head">电话</th>
                    <th style="width: 23.15%;" class="table-head">操作</th>
                </tr>
            </thead>
            <tbody>
                {#if students.length === 0}
                    <tr>
                        <td class="no-data-td" colspan="9">
                            <div class="no-data-container">
                                <p>暂无数据</p>
                            </div>
                        </td>
                    </tr>
                {/if}
                {#each students as student (student.id)}
                    <tr class="table-data-tr" data-id={student.id}>
                        <td class="student-checkbox default-td">
                            <input
                                type="checkbox"
                                class="checkbox-item"
                                bind:checked={student.selected}
                            />
                        </td>
                        <td
                            class="account-cell default-td"
                            title={student.account}>{student.account}</td
                        >
                        <td
                            class="name-cell default-td"
                            title={student.official_name}
                            >{student.official_name}</td
                        >
                        <td
                            class="id-card-no-cell default-td"
                            title={student.id_card_no}>{student.id_card_no}</td
                        >
                        <td class="default-td">
                            <span
                                class="status-text {StateClassMap[
                                    student.status
                                ]}">{StateMap[student.status] || "-"}</span
                            >
                        </td>
                        <td class="default-td">{student.gender}</td>
                        <td class="default-td">{student.phone}</td>
                        <td class="default-td">
                            <div class="actions">
                                <button
                                    class="btn-link btn-detail"
                                    onclick={() =>
                                        (window.location.href = `/teacher/studentManagement/details/${student.id}`)}
                                    >详情</button
                                >
                                <button
                                    class="btn-link btn-edit"
                                    onclick={() =>
                                        (window.location.href = `/teacher/studentManagement/edit/${student.id}`)}
                                    >修改</button
                                >
                                <button
                                    class="btn-link {student.status === '02'
                                        ? 'btn-enable'
                                        : 'btn-disable'}"
                                    onclick={() => toggleStatus(student.id)}
                                    >{student.status === "02"
                                        ? "启用"
                                        : "停用"}</button
                                >
                                {#if user_permission === "00"}
                                    <div class="btn-link btn-delete-wrapper">
                                        <button
                                            class="btn-link btn-delete"
                                            onclick={() =>
                                                deleteStudent(student.id)}
                                            >删除</button
                                        >
                                        <span class="tip-wrapper">
                                            <img
                                                src="/exam_list/tip.png"
                                                alt="提示"
                                                style="width: 14px; height:auto"
                                            />
                                            <div
                                                class="tooltip-text"
                                                style="min-width: 200px;"
                                            >
                                                {TIP_TEXT["deleted"]}
                                            </div>
                                        </span>
                                    </div>
                                {/if}
                                {#if student.has_relation}
                                    <div class="btn-link btn-unbind-wrapper">
                                        <button
                                            class="btn-link btn-unbind"
                                            onclick={() =>
                                                unbindStudent(student.id)}
                                        >移除</button
                                        >
                                              <span class="tip-wrapper">
                                        <img
                                            src="/exam_list/tip.png"
                                            alt="提示"
                                            style="width: 14px; height:auto"
                                        />
                                        <div
                                            class="tooltip-text"
                                            style="min-width: 200px;"
                                        >
                                            {TIP_TEXT["removed"]}
                                        </div>
                                    </span>
                                    </div>
                                {/if}
                            </div>
                        </td>
                    </tr>
                {/each}
            </tbody>
        </table>
        <div class="pagination-container">
            <Pagination
                total_data_num={total_num}
                total_page_num={total_pages}
                current_page_num={current_page}
                max_show_page_num={5}
                data_num_per_page_options={[
                    { value: 10, label: "10条/页" },
                    { value: 20, label: "20条/页" },
                    { value: 50, label: "50条/页" },
                ]}
                selected={{ value: page_size, label: `${page_size}条/页` }}
                onPageChangeFunc={handlePageNavigation}
                onPageChooseFunc={handlePageSelect}
                selectOptionFunc={handlePageSizeChange}
                onPageSearchFunc={handlePageSearch}
                expand_direction="up"
            ></Pagination>
        </div>
    </div>
    <!-- 单个删除对话框 -->
    <Dialog
        bind:isOpen={deleteDialogOpen}
        title={deleteDialogTitle}
        content={deleteDialogContent}
        confirmTextBackgroundColor="#E34D59"
        onConfirm={deleteStudents}
    />
    <!-- 批量删除对话框 -->
    <Dialog
        bind:isOpen={deleteMoreDialogOpen}
        title={deleteDialogTitle}
        content={deleteDialogContent}
        confirmTextBackgroundColor="#E34D59"
        onConfirm={deleteStudents}
    />
    <!-- 单个解绑对话框 -->
    <Dialog
        bind:isOpen={unbindDialogOpen}
        title={unbindDialogTitle}
        content={unbindDialogContent}
        confirmTextBackgroundColor="#E34D59"
        onConfirm={unbindStudents}
    />
    <!-- 批量解绑对话框 -->
    <Dialog
        bind:isOpen={unbindMoreDialogOpen}
        title={unbindDialogTitle}
        content={unbindDialogContent}
        confirmTextBackgroundColor="#E34D59"
        onConfirm={unbindStudents}
    />
    <StudentSelectionPanel
        show_panel={showSelectionPanel}
        onCancel={closeSelectionPanel}
        onConfirm={handleSelectionSuccess}
    />
    <StudentImportPanel
        bind:show={showImportPanel}
        onImport={handleImportSuccess}
        bind:this={student_import_panel}
    />
</div>

<ActionToast bind:isShow={show_action_toast} bind:this={action_toast} />

<style lang="scss" scoped>
    $normal-font-size: 14px;
    $gray-font-color: rgb(0, 0, 0, 0.6);

    .student-management-container {
        position: relative;
        background-color: var(--bg-primary);
        display: flex;
        flex-direction: column;
        width: 100%;
        height: 100%;
        overflow-y: hidden;
        min-width: 1000px;
        @media (max-width: 1200px) {
            min-width: 800px;
        }
        @media (max-width: 992px) {
            min-width: 700px;
        }
        @media (max-width: 768px) {
            min-width: 600px;
        }
    }

    .table-action-container {
        padding: 17px 0 0 30px;
        @media (max-width: 1200px) {
            padding: 17px 20px 0 20px;
        }
        @media (max-width: 768px) {
            padding: 17px 10px 0 10px;
        }
        .action-layout {
            display: flex;
            justify-content: space-between;
            flex-wrap: wrap;
            width: 100%;
            margin-bottom: 20px;
            gap: 20px;
            @media (max-width: 1400px) {
                gap: 15px;
            }
            @media (max-width: 1200px) {
                gap: 15px;
            }
            @media (max-width: 992px) {
                gap: 15px;
                flex-direction: row;
            }
            @media (max-width: 768px) {
                gap: 10px;
                flex-direction: column;
            }
        }
    }

    .left-section {
        display: flex;
        flex: 1;
        @media (max-width: 1600px) {
            min-width: 550px;
        }
        @media (max-width: 1200px) {
            min-width: 500px;
        }
        @media (max-width: 992px) {
            min-width: 400px;
            max-width: 100%;
            width: 100%;
            margin-bottom: 20px;
            flex-basis: 100%;
            order: 1;
        }
    }

    .input-item {
        display: flex;
        align-items: center;
        justify-content: flex-start;
        .item-label {
            font-size: $normal-font-size;
            color: $gray-font-color;
            min-width: 80px;
            display: inline-block;
            text-align: right;
            margin-right: 10px;
            white-space: nowrap;
        }
        .input-container {
            width: 100%;
            min-width: 200px;
            height: 32px;
            display: flex;
            flex: 1;
        }
        .search-input-container {
            height: 100%;
            width: 100%;
            flex: 1;
            min-width: 300px;
            border: 1px solid rgb(221, 221, 221, 1);
            border-radius: 3px;
            box-sizing: border-box;
            display: flex;
            align-items: center;
            padding: 0 0 0 5px;
            position: relative;
        }
        .search-input {
            flex: 1;
            border: none;
            outline: none;
            height: 100%;
            width: 100%;
            padding: 0 25px 0 5px;
            font-size: 14px;
            background-color: transparent;
            box-sizing: border-box;
            &::placeholder {
                color: #999;
            }
        }
    }

    .clear-button {
        position: absolute;
        right: 5px;
        background: none;
        border: none;
        cursor: pointer;
        color: #999;
        font-size: 16px;
        padding: 0;
        display: flex;
        align-items: center;
        justify-content: center;
    }

    .custom-select {
        position: relative;
        width: 200px;
        height: 32px;
        .selected {
            padding: 0 12px;
            height: 100%;
            width: 100%;
            color: #1d2129;
            display: flex;
            align-items: center;
            justify-content: space-between;
            font-size: 12px;
            border: 1px solid #d7d7d7;
            border-radius: 3px;
            background: #fff;
            cursor: pointer;
            &.active {
                border-color: #165dff;
                outline: none;
            }
        }
        .toggle-icon {
            width: 12px;
            height: auto;
            &.rotate {
                transform: rotate(180deg);
            }
        }
        .options {
            display: block;
            position: absolute;
            padding: 0;
            margin: 0;
            top: calc(100% + 5px);
            left: 0;
            right: 0;
            border: 1px solid #e5e5e5;
            border-radius: 4px;
            background: #fff;
            z-index: 10;
            button {
                width: 100%;
                height: 32px;
                padding: 0 10px;
                font-size: 12px;
                border: none;
                background: transparent;
                cursor: pointer;
                text-align: left;
                &:hover {
                    background: #cccccc;
                }
                &.active {
                    background: #cccccc;
                }
            }
        }
    }

    .right-section {
        display: flex;
        gap: 20px;
        flex: 0 0 auto;
        min-width: 280px;
        margin-right: 40px;
        @media (min-width: 1401px) {
            grid-template-columns: repeat(4, minmax(70px, 1fr));
            grid-template-rows: repeat(2, 1fr);
        }
        @media (max-width: 1400px) and (min-width: 1201px) {
            grid-template-columns: repeat(3, minmax(60px, 1fr));
            grid-template-rows: repeat(2, 1fr);
            gap: 20px;
            margin-right: 30px;
        }
        @media (max-width: 1600px) and (min-width: 992px) {
            grid-template-columns: repeat(2, minmax(60px, 1fr));
            grid-template-rows: repeat(3, 1fr);
            gap: 20px;
            margin-right: 20px;
        }
        @media (max-width: 992px) {
            grid-template-columns: repeat(3, minmax(60px, 1fr));
            grid-template-rows: repeat(2, 1fr);
            gap: 10px;
            margin-right: 0;
            margin-top: 15px;
            width: 100%;
            flex-basis: 100%;
            order: 2;
        }
        @media (max-width: 768px) {
            gap: 8px;
            margin-right: 0;
            width: 100%;
        }
        .button-item {
            display: flex;
            justify-content: center;
            align-items: center;
            width: 100%;

            .tip-wrapper {
                position: relative;
                display: inline-flex;
                align-items: center;
                justify-content: center;
                margin-left: 5px;
                .tooltip-text {
                    visibility: hidden;
                    opacity: 0;
                    transition: opacity 0.2s ease-in-out;
                    position: absolute;
                    bottom: 150%;
                    left: 50%;
                    transform: translateX(-50%);
                    white-space: pre-line;
                    background-color: white;
                    border: 1px solid #d7d7d7;
                    border-radius: 4px;
                    padding: 6px 8px;
                    font-size: 12px;
                    line-height: 1.4;
                    z-index: 1;
                    max-width: 200px;
                    min-width: 120px;
                }

                &:hover .tooltip-text {
                    visibility: visible;
                    opacity: 1;
                }
            }
        }

        .action-btn {
            border-radius: var(--btn-border-radius);
            height: 32px;
            padding: 0 10px;
            font-size: 14px;
            cursor: pointer;
            min-width: 60px;
            text-align: center;
            width: 100%;
            max-width: 120px;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
            transition: all 0.3s ease;
            border: 1px solid;
            background: #fff;

            &.import-button {
                background-color: white;
                color: #333;
                border: 1px solid #ddd;
            }
            &.add-button {
                background-color: var(--blue);
                color: white;
                border: 1px solid #ddd;
            }
            &.unbind-button {
                background-color: var(--red);
                color: white;
                border: none;
            }
            &.create-button {
                background-color: var(--blue);
                color: white;
                border: none;
            }
            &.delete-button {
                background-color: var(--red);
                color: white;
                border: none;
            }
            &.enable-button {
                background-color: var(--green);
                color: white;
                border: none;
            }
            &.disable-button {
                background-color: var(--orange);
                color: white;
                border: none;
            }

            &.download-template-button {
                background-color: white;
                color: #333;
                border: 1px solid #ddd;
            }
        }
    }

    .table-container {
        padding: 5px 37px 50px 37px;
        overflow-y: auto;
        overflow-x: hidden;
        @media (max-width: 1200px) {
            padding: 5px 20px 50px 20px;
        }
        @media (max-width: 768px) {
            padding: 5px 10px 50px 10px;
        }
    }

    .student-list-table {
        font-size: 14px;
        border-collapse: collapse;
        width: 100%;
        th {
            color: rgba(0, 0, 0, 0.3);
            font-weight: normal;
            height: 40px;
            padding: 8px;
            text-align: center;
            background-color: #ffffff;
        }
        td {
            padding: 12px 0;
            border-bottom: 1px solid #ddd;
            text-align: center;
            color: rgb(0, 0, 0, 0.75);
            height: 60px;
        }
        tr:hover {
            background-color: #ecf2fe;
        }
        input[type="checkbox"] {
            width: 16px;
            height: 16px;
            cursor: pointer;
            vertical-align: middle;
            accent-color: #0052d9;
        }
    }
    .account-cell,
    .name-cell,
    .id-card-no-cell {
        text-overflow: ellipsis;
        overflow: hidden;
        white-space: nowrap;
        position: relative;
    }
    .account-cell {
        max-width: 142px;
    }
    .name-cell {
        max-width: 142px;
    }
    .id-card-no-cell {
        max-width: 276px;
    }
    .actions {
        display: flex;
        gap: 20px;
        justify-content: center;


        .btn-delete-wrapper,
        .btn-unbind-wrapper {
            position: relative;
            display: inline-flex;
            align-items: center;
            justify-content: center;
            gap: 5px;

            .tip-wrapper {
            position: relative;
            display: inline-flex;
            align-items: center;
            justify-content: center;
            .tooltip-text {
                visibility: hidden;
                opacity: 0;
                transition: opacity 0.2s ease-in-out;
                position: absolute;
                bottom: 150%;
                left: 50%;
                transform: translateX(-50%);
                white-space: pre-line;
                background-color: white;
                border: 1px solid #d7d7d7;
                border-radius: 4px;
                padding: 6px 8px;
                font-size: 12px;
                line-height: 1.4;
                z-index: 1;
                max-width: 200px;
                min-width: 120px;
            }

            &:hover .tooltip-text {
                visibility: visible;
                opacity: 1;
            }
        }
        }

        
        .btn-link {
            background: none;
            border: none;
            cursor: pointer;
            padding: 0;
            font-size: 14px;
            &:hover {
                font-weight: bold;
            }
        }
        .btn-detail,
        .btn-edit {
            color: var(--blue);
        }
        .btn-enable {
            color: var(--green);
        }
        .btn-disable {
            color: var(--orange);
        }
        .btn-delete {
            color: var(--red);
        }
        .btn-unbind {
            color: var(--red);
        }
    }
    .pagination-container {
        justify-self: right;
        padding: 20px 0 0 0;
        display: flex;
        justify-content: right;
        align-items: center;
        width: 100%;
    }
    .status-text {
        font-size: 14px;
        &.enabled {
            color: #00b42a;
            font-weight: 500;
        }
        &.disabled {
            color: #e34d59;
            font-weight: 500;
        }
        &.deleted {
            color: rgba(0, 0, 0, 0.5);
        }
    }
</style>
