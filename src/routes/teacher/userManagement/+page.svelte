<script>
    // @ts-nocheck

    import Pagination from "$lib/component/Pagination.svelte";
    import DropdownGray from "$lib/component/DropdownGray.svelte";
    import Dialog from "../practiceManagement/components/Dialog.svelte";
    import SingleDatePicker from "$lib/component/DatePicker/SingleDatePicker.svelte";
    import { authMetadata } from "$lib/stores/permission";
    import ActionToast from "$lib/component/ActionToast.svelte";
    import MultipleChoicesDropdown from "$lib/component/MultipleChoicesDropdown.svelte";
    import Title from "$lib/component/Title.svelte";
    import { get } from "svelte/store";
    import { fetchAuthMetadata, sendOperationLog } from "./utils.js";
    import { goto } from "$app/navigation";
    import { onMount } from "svelte";
    import LogPanel from "$lib/component/AwesomeLogPanel.svelte";

    let operationLogPanel;

    // 用户权限元数据
    let user_role_metadata = $state([]);
    let menu_permissions_metadata = $state([]);
    let showSearchClearBtn = $state(false);

    // 分页相关状态
    let currentPage = $state(1);
    let pageSize = $state(10);
    let totalItems = $state(0); // 总记录数（来自 rowCount）
    let totalPages = $state(0); // 总页数

    // 加载状态
    let loading = $state(false);
    let error = $state(null);

    // 筛选相关状态
    let account = $state(""); // 账号搜索
    let name = $state(""); // 姓名搜索
    let phone = $state(""); // 电话搜索
    let email = $state(""); // 邮箱搜索
    let gender = $state("all"); // 性别筛选
    let roles = $state([]); // 角色筛选，数字数组
    let status = $state("all"); // 账号状态筛选
    let create_time = $state(null); // 创建时间筛选

    // 操作成功提示
    let actionToast = $state(null);

    // 更新搜索框清除按钮状态
    function updateSearchClearButtonVisibility() {
        showSearchClearBtn = !!(account || name || phone || email);
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

    /**
     * 将时间戳转换为可读格式: YYYY-MM-DD
     * @param {number} timestamp - 时间戳
     */
    function formatDate(timestamp) {
        if (!timestamp) return "-";

        const date = new Date(timestamp);
        const year = date.getFullYear();
        const month = (date.getMonth() + 1).toString().padStart(2, "0");
        const day = date.getDate().toString().padStart(2, "0");

        return `${year}-${month}-${day}`;
    }

    // 用户列表数据
    let user_list = $state([]);

    // 判断搜索值是性别还是账号
    function determineSearchType(value) {
        // 如果是空值，返回空对象
        if (!value || value.trim() === "") {
            return { account: null, gender: null };
        }

        // 判断是否为性别
        const trimmedValue = value.trim();
        if (trimmedValue === "男" || trimmedValue === "女") {
            return { account: null, gender: trimmedValue };
        } else {
            // 如果不是性别，则认为是账号
            return { account: trimmedValue, gender: null };
        }
    }

    // 构建筛选条件
    function buildFilterConditions() {
        const params = new URLSearchParams();

        // 添加分页参数
        params.append("page", currentPage.toString());
        params.append("page_size", pageSize.toString());

        // 只添加有值的筛选条件
        if (account) params.append("account", account);
        if (name) params.append("name", name);
        if (phone) params.append("phone", phone);
        if (email) params.append("email", email);
        if (gender !== "all") params.append("gender", gender);
        if (roles.length > 0) params.append("roles", roles.join(","));
        if (status !== "all") params.append("status", status);
        if (create_time) params.append("create_time", create_time.toString());

        return params;
    }

    // 获取用户列表数据
    async function fetchUsersList() {
        loading = true;
        error = null;
        resetSelection(); // 重置选中状态

        try {
            // 构建筛选条件
            const params = buildFilterConditions();

            const response = await fetch(
                `/api/user-list?${params.toString()}`,
                {
                    method: "GET",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    credentials: "include",
                },
            );

            if (!response.ok) {
                throw new Error(`请求失败: ${response.status}`);
            }

            const result = await response.json();

            if (result && result.data) {
                console.log(result.data);
                // 处理返回的数据
                user_list = result.data.map((user) => ({
                    id: user.id,
                    account: user.account,
                    name: user.name,
                    gender: user.gender || "-",
                    phone: user.phone || "-",
                    email: user.email || "-",
                    category: user.category || "-",
                    roles: user.roles || "-",
                    create_time: user.create_time,
                    account_status: "正常",
                    state: user.status,
                    action_expended: false,
                }));

                // 使用 rowCount 作为总记录数并更新分页信息
                if (result.rowCount !== undefined) {
                    totalItems = result.rowCount; // 总记录数就是 rowCount
                    totalPages = Math.ceil(totalItems / pageSize);
                } else {
                    // 如果后端没有返回 rowCount，则使用当前页的数据长度
                    totalItems = user_list.length;
                    totalPages = 1; // 如果没有总数，假设只有1页
                }
            } else {
                user_list = [];
                totalItems = 0;
                totalPages = 0;
            }
        } catch (err) {
            console.error("获取用户列表失败:", err);
            error = err.message;
            user_list = [];
        } finally {
            loading = false;
        }
    }

    // 切换页面 - 点击上一页/下一页
    function handlePageNavigation(is_next) {
        if (is_next && currentPage < totalPages) {
            currentPage++;
        } else if (!is_next && currentPage > 1) {
            currentPage--;
        }
        fetchUsersList();
    }

    // 点击具体页码
    function handlePageSelect(page) {
        currentPage = page;
        fetchUsersList();
    }

    // 改变每页显示数量
    function handlePageSizeChange(value) {
        pageSize = parseInt(value);
        currentPage = 1; // 重置到第一页
        fetchUsersList();
    }

    // 输入页码跳转
    function handlePageSearch(value) {
        const pageNum = parseInt(value);
        if (!isNaN(pageNum) && pageNum > 0 && pageNum <= totalPages) {
            currentPage = pageNum;
            fetchUsersList();
        }
    }

    // 复选框相关状态
    let selectedUsers = $state(new Set()); // 存储选中的用户ID
    let allSelected = $state(false); // 是否全选

    // 切换单个用户的选中状态
    function toggleUserSelection(id) {
        if (selectedUsers.has(id)) {
            selectedUsers.delete(id);
            allSelected = false;
        } else {
            selectedUsers.add(id);
            // 检查是否所有用户都被选中
            allSelected =
                user_list.length > 0 && selectedUsers.size === user_list.length;
        }
    }

    // 切换全选状态
    function toggleAllSelection() {
        if (allSelected) {
            // 如果当前是全选状态，则取消全选
            // 使用新的空 Set 而不是 clear() 来确保响应式更新
            selectedUsers = new Set();
            allSelected = false;
        } else {
            // 如果当前不是全选状态，则全选
            selectedUsers = new Set(user_list.map((user) => user.id));
            allSelected = true;
        }
    }

    // 页面加载时获取用户列表
    onMount(async () => {
        if (get(authMetadata).length === 0) {
            let authData = await fetchAuthMetadata();
            user_role_metadata = authData.roles;
            menu_permissions_metadata = authData.menu_permissions;
        } else {
            user_role_metadata = get(authMetadata).roles;
            menu_permissions_metadata = get(authMetadata).menu_permissions;
        }
        // 获取用户列表
        await fetchUsersList();
    });

    // 当数据变化时重置选中状态
    function resetSelection() {
        // 使用新的空 Set 而不是 clear() 来确保响应式更新
        selectedUsers = new Set();
        allSelected = false;
    }

    // 删除确认对话框状态
    let deleteDialogOpen = $state(false);
    // 当前要删除的用户ID
    let userToDelete = $state(null);
    // 是否批量删除
    let isBatchDelete = $state(false);

    // 启用单个用户
    async function activateUser(userId) {
        try {
            // 根据ID查找用户账号
            const user = user_list.find((t) => t.id === userId);
            if (!user) {
                throw new Error("未找到用户信息");
            }

            const response = await fetch("/api/user/enable", {
                method: "PATCH",
                headers: {
                    "Content-Type": "application/json",
                },
                credentials: "include",
                body: JSON.stringify({
                    data: {
                        accounts: [user.account],
                    },
                }),
            });

            if (!response.ok) {
                throw new Error(`请求失败: ${response.status}`);
            }

            const result = await response.json();
            if (result && result.status === 0) {
                // 更新本地用户状态
                user_list = user_list.map((t) => {
                    if (t.id === userId) {
                        return { ...t, state: "00" };
                    }
                    return t;
                });
                actionToast.show("success", "启用成功");

                // 发送操作日志
                sendOperationLog(`启用了用户 (${user.account})`);
            } else {
                throw new Error(result.message || "未知错误");
            }
        } catch (error) {
            console.error("启用失败:", error);
            actionToast.show("error", `启用失败: ${error.message}`);
        }
    }

    // 停用单个用户
    async function deactivateUser(userId) {
        try {
            // 根据ID查找用户账号
            const user = user_list.find((t) => t.id === userId);
            if (!user) {
                throw new Error("未找到用户信息");
            }
            const response = await fetch("/api/user/disable", {
                method: "PATCH",
                headers: {
                    "Content-Type": "application/json",
                },
                credentials: "include",
                body: JSON.stringify({
                    data: {
                        accounts: [user.account],
                    },
                }),
            });

            if (!response.ok) {
                throw new Error(`请求失败: ${response.status}`);
            }

            const result = await response.json();
            if (result && result.status === 0) {
                // 更新本地用户状态
                user_list = user_list.map((t) => {
                    if (t.id === userId) {
                        return { ...t, state: "02" };
                    }
                    return t;
                });
                actionToast.show("success", "停用成功");

                // 发送操作日志
                sendOperationLog(`停用了用户 (${user.account})`);
            } else {
                throw new Error(result.message || "未知错误");
            }
        } catch (error) {
            console.error("停用失败:", error);
            actionToast.show("error", `停用失败: ${error.message}`);
        }
    }

    // 启用选中的用户
    async function activateSelectedUsers() {
        if (selectedUsers.size === 0) {
            actionToast.show("error", "请先选择要启用的用户");
            return;
        }

        try {
            // 获取选中用户的账号列表
            const selectedIds = Array.from(selectedUsers);
            const userAccounts = user_list
                .filter((user) => selectedIds.includes(user.id))
                .map((user) => user.account);

            if (userAccounts.length === 0) {
                throw new Error("未找到选中用户的账号信息");
            }

            const response = await fetch("/api/user/enable", {
                method: "PATCH",
                headers: {
                    "Content-Type": "application/json",
                },
                credentials: "include",
                body: JSON.stringify({
                    data: {
                        accounts: userAccounts,
                    },
                }),
            });

            if (!response.ok) {
                throw new Error(`请求失败: ${response.status}`);
            }

            const result = await response.json();
            if (result && result.status === 0) {
                // 更新本地用户状态
                user_list = user_list.map((user) => {
                    if (selectedUsers.has(user.id)) {
                        return { ...user, state: "00" };
                    }
                    return user;
                });
                actionToast.show("success", "启用成功");
                resetSelection(); // 重置选中状态

                // 发送操作日志
                sendOperationLog(`启用了用户 (${userAccounts.join(", ")})`);
            } else {
                throw new Error(result.message || "未知错误");
            }
        } catch (error) {
            console.error("启用失败:", error);
            actionToast.show("error", `启用失败: ${error.message}`);
        }
    }

    // 停用选中的用户
    async function deactivateSelectedUsers() {
        if (selectedUsers.size === 0) {
            actionToast.show("error", "请先选择要停用的用户");
            return;
        }

        try {
            // 获取选中用户的账号列表
            const selectedIds = Array.from(selectedUsers);
            const userAccounts = user_list
                .filter((user) => selectedIds.includes(user.id))
                .map((user) => user.account);

            if (userAccounts.length === 0) {
                throw new Error("未找到选中用户的账号信息");
            }

            const response = await fetch("/api/user/disable", {
                method: "PATCH",
                headers: {
                    "Content-Type": "application/json",
                },
                credentials: "include",
                body: JSON.stringify({
                    data: {
                        accounts: userAccounts,
                    },
                }),
            });

            if (!response.ok) {
                throw new Error(`请求失败: ${response.status}`);
            }

            const result = await response.json();
            if (result && result.status === 0) {
                // 更新本地用户状态
                user_list = user_list.map((user) => {
                    if (selectedUsers.has(user.id)) {
                        return { ...user, state: "02" };
                    }
                    return user;
                });
                actionToast.show("success", "停用成功");
                resetSelection(); // 重置选中状态

                // 发送操作日志
                sendOperationLog(`停用了用户 (${userAccounts.join(", ")})`);
            } else {
                throw new Error(result.message || "未知错误");
            }
        } catch (error) {
            console.error("停用失败:", error);
            actionToast.show("error", `停用失败: ${error.message}`);
        }
    }

    // 删除单个用户
    function deleteUser(userId) {
        userToDelete = userId;
        isBatchDelete = false;
        deleteDialogOpen = true;
    }

    // 删除选中的用户
    function deleteSelectedUsers() {
        if (selectedUsers.size === 0) {
            actionToast.show("error", "请先选择要删除的用户");
            return;
        }

        isBatchDelete = true;
        deleteDialogOpen = true;
    }

    // 确认删除用户
    async function confirmDeleteUsers() {
        try {
            let userAccounts = [];

            if (isBatchDelete) {
                // 批量删除
                const selectedIds = Array.from(selectedUsers);
                userAccounts = user_list
                    .filter((user) => selectedIds.includes(user.id))
                    .map((user) => user.account);
            } else {
                // 单个删除
                const user = user_list.find((t) => t.id === userToDelete);
                if (!user) {
                    throw new Error("未找到用户信息");
                }
                userAccounts = [user.account];
            }

            if (userAccounts.length === 0) {
                throw new Error("未找到用户账号信息");
            }

            const response = await fetch("/api/user", {
                method: "DELETE",
                headers: {
                    "Content-Type": "application/json",
                },
                credentials: "include",
                body: JSON.stringify({
                    data: {
                       accounts: userAccounts
                    },
                }),
            });

            if (!response.ok) {
                throw new Error(`请求失败: ${response.status}`);
            }

            const result = await response.json();
            if (result && result.status === 0) {
                // 删除成功，从列表中移除用户
                if (isBatchDelete) {
                    // 批量删除
                    user_list = user_list.filter(
                        (user) => !selectedUsers.has(user.id),
                    );
                    resetSelection(); // 重置选中状态
                } else {
                    // 单个删除
                    user_list = user_list.filter(
                        (user) => user.id !== userToDelete,
                    );
                }

                // 发送操作日志
                sendOperationLog(`删除了用户 (${userAccounts.join(", ")})`);

                // 更新总记录数
                totalItems = totalItems-userAccounts.length;
                totalPages = Math.ceil(totalItems / pageSize);

                // 如果当前页空了，则返回上一页
                if (user_list.length === 0 && currentPage > 1) {
                    currentPage--;
                    await fetchUsersList();
                }
                
                actionToast.show("success", "删除成功");
                deleteDialogOpen = false;
            } else {
                throw new Error(result.message || "未知错误");
            }
        } catch (error) {
            console.error("删除失败:", error);
            actionToast.show("error", `删除失败: ${error.message}`);
        }
    }

    // 修改下拉菜单选项
    const genderOptions = [
        { value: "all", label: "全部" },
        { value: "男", label: "男" },
        { value: "女", label: "女" },
    ];

    const statusOptions = [
        { value: "all", label: "全部" },
        { value: "00", label: "已启用" },
        { value: "02", label: "已停用" },
    ];

    /**
     * @description 获取并显示用户管理操作日志
     * @param {number} page 页码
     * @param {number} page_size 每页数量
     */
    /**
     * @description: 获取操作日志数据的函数
     * @param {number} page - 页码
     * @param {number} page_size - 每页数量
     * @returns {Promise<Object>} 返回包含日志数据和总数的对象
     */
    async function fetchOperationLogs(page = 1, page_size = 10) {
        try {
            const res = await fetch(`/api/user-mgt/operation-log?page=${page}&page_size=${page_size}`, {
                method: "GET",
                credentials: "include",
            });
            
            if (!res.ok) {
                console.error("获取操作日志失败", await res.text());
                actionToast.show("error", "获取操作日志失败");
                throw new Error("网络请求失败");
            }
            
            const result = await res.json();
            if (result.status !== 0) {
                console.error("获取操作日志失败", result.message || "未知错误");
                actionToast.show("error", "获取操作日志失败");
                throw new Error(result.message || "获取数据失败");
            }

            console.log("获取操作日志成功", result);
            
            return {
                data: result.data || [],
                total: result.rowCount || 0
            };
        } catch (error) {
            console.error("获取操作日志失败:", error);
            actionToast.show("error", `获取操作日志失败: ${error.message}`);
            throw error;
        }
    }

    /**
     * @description: 显示用户操作日志面板
     */
    async function showUserOperationLogs() {
        try {
            await operationLogPanel.showLogPanelWithPagination(fetchOperationLogs);
        } catch (error) {
            console.error("显示操作日志失败:", error);
        }
    }

    function getRoleDescriptionsByIds(ids) {
        if (!Array.isArray(ids)) return "";
        return ids
            .map((id) => {
                const found = user_role_metadata.find((r) => r.id === id);
                return found ? found.description : id;
            })
            .join(", ");
    }
</script>

<!-- 表头 -->
{#snippet tableHead()}
    <tr class="table-head-row">
        <th style="width: 3%;" class="table-head">
            <input
                type="checkbox"
                class="checkbox-all"
                checked={allSelected}
                onclick={toggleAllSelection}
            />
        </th>
        <th style="width: 10%;" class="table-head">账号</th>
        <th style="width: 5%;" class="table-head">姓名</th>
        <th style="width: 5%;" class="table-head">性别</th>
        <th style="width: 7%;" class="table-head">电话</th>
        <th style="width: 5%;" class="table-head">邮箱</th>
        <th style="width: 5%;" class="table-head">账号状态</th>
        <th style="width: 5%;" class="table-head">分类</th>
        <th style="width: 7%;" class="table-head">角色</th>
        <th style="width: 5%;" class="table-head">创建时间</th>
        <th style="width: 5%;" class="table-head">当前状态</th>
        <th style="width: 12%;" class="table-head">操作</th>
    </tr>
{/snippet}

<!--状态标签-->
{#snippet stateRender(
    /** @type {"00" | "02"} */ state,
    /** @type {string} */ addi,
)}
    <span class="status-text {StateClassMap[state]}">{StateMap[state]}</span>
{/snippet}

<!--操作按钮-->
{#snippet actionRender(
    /** @type {"00" | "02"} */ state,
    /** @type {number} */ index,
)}
    <div class="button-container" style="background-color: rgb(0, 0, 0, 0);">
        <button
            class="view-details-button action-button"
            onclick={() =>
                goto(
                    `/teacher/userManagement/userDetail?account=${user_list[index].account}`,
                )}>详情</button
        >
        <button
            class="edit-user-button action-button"
            onclick={() =>
                goto(
                    `/teacher/userManagement/editUser?account=${user_list[index].account}`,
                )}>修改</button
        >
        {#if state === "00"}
            <button
                class="disable-user-button action-button"
                onclick={() => deactivateUser(user_list[index].id)}>停用</button
            >
        {:else if state === "02"}
            <button
                class="enable-user-button action-button"
                onclick={() => activateUser(user_list[index].id)}>启用</button
            >
        {/if}
        <button
            class="delete-user-button action-button"
            style="color: red;"
            onclick={() => deleteUser(user_list[index].id)}>删除</button
        >
    </div>
{/snippet}

{#snippet tableData(
    /** @type {{ account: string; name: string; gender: string; phone: string; account_status: string; course_number: string; student_number: string; class_number: string; join_time: string; state: string; addi?: string}} */ data,
    /** @type {any} */ index,
)}
    <tr class="table-data-tr">
        <td class="user-checkbox default-td">
            <input
                type="checkbox"
                class="checkbox-item"
                checked={selectedUsers.has(data.id)}
                onclick={() => toggleUserSelection(data.id)}
            />
        </td>
        <td class="user-account default-td">
            {data.account}
        </td>
        <td class="user-name default-td">
            {data.name}
        </td>
        <td class="user-gender default-td">
            {data.gender}
        </td>
        <td class="user-phone default-td">
            {data.phone}
        </td>
        <td class="user-email default-td">
            {data.email}
        </td>
        <td class="user-account-status default-td">
            {data.account_status}
        </td>
        <td class="user-category default-td">
            {data.category}
        </td>
        <td class="user-role default-td">
            {getRoleDescriptionsByIds(data.roles)}
        </td>
        <td class="user-create-time default-td">
            {formatDate(data.create_time)}
        </td>
        <td class="user-status default-td">
            {@render stateRender(data.state, data.addi)}
        </td>
        <td class="default-td">
            {@render actionRender(data.state, index)}
        </td>
    </tr>
{/snippet}

<div class="user-management-container">
    <Title title="用户列表" />

    <div class="table-action-container">
        <div class="action-layout">
            <!-- 左侧：填写框部分 -->
            <div class="left-section">
                <!-- 账号搜索 -->
                <div class="input-item">
                    <span class="item-label">账号</span>
                    <div class="input-container">
                        <div class="search-input-container">
                            <input
                                type="text"
                                bind:value={account}
                                oninput={updateSearchClearButtonVisibility}
                                placeholder="请输入账号"
                                class="search-input"
                                onkeydown={(e) => {
                                    if (e.key === "Enter") {
                                        fetchUsersList();
                                    }
                                }}
                                onblur={() => {
                                    fetchUsersList();
                                }}
                            />
                            {#if account}
                                <button
                                    class="clear-button"
                                    onclick={() => {
                                        account = "";
                                        fetchUsersList();
                                    }}>×</button
                                >
                            {/if}
                        </div>
                    </div>
                </div>

                <!-- 姓名搜索 -->
                <div class="input-item">
                    <span class="item-label">姓名</span>
                    <div class="input-container">
                        <div class="search-input-container">
                            <input
                                type="text"
                                bind:value={name}
                                oninput={updateSearchClearButtonVisibility}
                                placeholder="请输入姓名"
                                class="search-input"
                                onkeydown={(e) => {
                                    if (e.key === "Enter") {
                                        fetchUsersList();
                                    }
                                }}
                                onblur={() => {
                                    fetchUsersList();
                                }}
                            />
                            {#if name}
                                <button
                                    class="clear-button"
                                    onclick={() => {
                                        name = "";
                                        fetchUsersList();
                                    }}>×</button
                                >
                            {/if}
                        </div>
                    </div>
                </div>

                <!-- 电话搜索 -->
                <div class="input-item">
                    <span class="item-label">电话</span>
                    <div class="input-container">
                        <div class="search-input-container">
                            <input
                                type="text"
                                bind:value={phone}
                                oninput={updateSearchClearButtonVisibility}
                                placeholder="请输入电话"
                                class="search-input"
                                onkeydown={(e) => {
                                    if (e.key === "Enter") {
                                        fetchUsersList();
                                    }
                                }}
                                onblur={() => {
                                    fetchUsersList();
                                }}
                            />
                            {#if phone}
                                <button
                                    class="clear-button"
                                    onclick={() => {
                                        phone = "";
                                        fetchUsersList();
                                    }}>×</button
                                >
                            {/if}
                        </div>
                    </div>
                </div>

                <!-- 邮箱搜索 -->
                <div class="input-item">
                    <span class="item-label">邮箱</span>
                    <div class="input-container">
                        <div class="search-input-container">
                            <input
                                type="text"
                                bind:value={email}
                                oninput={updateSearchClearButtonVisibility}
                                placeholder="请输入邮箱"
                                class="search-input"
                                onkeydown={(e) => {
                                    if (e.key === "Enter") {
                                        fetchUsersList();
                                    }
                                }}
                                onblur={() => {
                                    fetchUsersList();
                                }}
                            />
                            {#if email}
                                <button
                                    class="clear-button"
                                    onclick={() => {
                                        email = "";
                                        fetchUsersList();
                                    }}>×</button
                                >
                            {/if}
                        </div>
                    </div>
                </div>

                <!-- 创建时间日期选择器 -->
                <div class="input-item">
                    <span class="item-label">创建时间</span>
                    <div class="input-container">
                        <SingleDatePicker
                            onSelectDate={(date) => {
                                create_time = date ? date.getTime() : null;
                                fetchUsersList();
                            }}
                            onClearDate={() => {
                                create_time = null;
                                fetchUsersList();
                            }}
                        />
                    </div>
                </div>

                <!-- 角色下拉菜单-->
                <div class="input-item">
                    <span class="item-label">角色</span>
                    <div class="input-container">
                            <MultipleChoicesDropdown
                            options={user_role_metadata.map((r) => ({
                                value: r.id,
                                label: r.description,
                            }))}
                            selected={roles}
                            selectOptionFunc={(selected) => {
                                roles = selected;
                                fetchUsersList();
                            }}
                        />
                    </div>
                </div>

                <!-- 性别下拉菜单-->
                <div class="input-item">
                    <span class="item-label">性别</span>
                    <div class="input-container">
                        <DropdownGray
                            options={genderOptions}
                            selected={gender}
                            selectOptionFunc={(value) => {
                                gender = value;
                                fetchUsersList();
                            }}
                        ></DropdownGray>
                    </div>
                </div>

                <!-- 账号状态下拉菜单 -->
                <div class="input-item">
                    <span class="item-label">账号状态</span>
                    <div class="input-container">
                        <DropdownGray
                            options={statusOptions}
                            selected={status}
                            selectOptionFunc={(value) => {
                                status = value;
                                fetchUsersList();
                            }}
                        ></DropdownGray>
                    </div>
                </div>
            </div>

            <!-- 右侧：操作按钮部分 -->
            <div class="right-section">
                <!-- 导出按钮 -->
                <div class="button-item">
                    <button class="export-button action-btn">导出</button>
                </div>
                <!-- 导入按钮 -->
                <div class="button-item">
                    <button class="import-button action-btn">导入</button>
                </div>
                <!-- 新增按钮 -->
                <div class="button-item">
                    <button
                            class="add-user-button action-btn"
                            onclick={() => goto("/teacher/userManagement/addUser")}
                    >新增</button
                    >
                </div>
                <!-- 删除按钮 -->
                <div class="button-item">
                    <button
                        class="delete-button action-btn"
                        onclick={deleteSelectedUsers}>删除</button
                    >
                </div>
                <!-- 启用按钮 -->
                <div class="button-item">
                    <button
                        class="enable-button action-btn"
                        onclick={activateSelectedUsers}>启用</button
                    >
                </div>
                <!-- 停用按钮 -->
                <div class="button-item">
                    <button
                        class="disable-button action-btn"
                        onclick={deactivateSelectedUsers}>停用</button
                    >
                </div>
                <!-- 查看操作日志按钮 -->
                <div class="button-item">
                    <button
                        class="log-button action-btn"
                        onclick={() => showUserOperationLogs()}>查看操作日志</button
                    >
                </div>
            </div>
        </div>
    </div>

    <div class="table-container">
        <table class="user-list-table">
            <thead class="user-list-table-head">
                {@render tableHead()}
            </thead>
            <tbody class="user-list-table-data">
                {#each user_list as data, index (data.id)}
                    {@render tableData(data, index)}
                {/each}
            </tbody>
        </table>
        <div class="pagination-container">
            {#if loading}
                <div class="loading-indicator">加载中...</div>
            {:else if error}
                <div class="error-message">加载失败: {error}</div>
            {:else if user_list.length === 0}
                <div class="empty-message">暂无用户数据</div>
            {:else}
                <Pagination
                    total_data_num={totalItems}
                    total_page_num={totalPages}
                    current_page_num={currentPage}
                    max_show_page_num={5}
                    data_num_per_page_options={[
                        { value: 10, label: "10条/页" },
                        { value: 20, label: "20条/页" },
                        { value: 50, label: "50条/页" },
                    ]}
                    selected={pageSize}
                    onPageChangeFunc={handlePageNavigation}
                    onPageChooseFunc={handlePageSelect}
                    selectOptionFunc={handlePageSizeChange}
                    onPageSearchFunc={handlePageSearch}
                    expand_direction="up"
                ></Pagination>
            {/if}
        </div>
    </div>

    <!-- 删除确认对话框 -->
    <Dialog
        bind:isOpen={deleteDialogOpen}
        title="确认删除所选用户？"
        content="该操作不可逆，请谨慎操作。"
        confirmTextBackgroundColor="#E34D59"
        onConfirm={confirmDeleteUsers}
    />
</div>

<ActionToast
    type="success"
    message="操作成功"
    duration={2000}
    bind:this={actionToast}
/>

<!-- 操作日志面板 -->
<LogPanel bind:this={operationLogPanel} />

<style lang="scss">
    $normal-font-size: 14px;
    $gray-font-color: rgb(0, 0, 0, 0.6);

    .user-management-container {
        position: relative;
        background-color: white;
        display: flex;
        flex-direction: column;
        width: 100%;
        height: 100%;
        overflow-y: auto;
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

    .big-title {
        display: flex;
        align-items: center;
        height: 60px;
        min-height: 60px;
        padding-left: 32px;
        .big-title-icon {
            width: 7px;
            height: 24px;
            background-color: #0052d9;
        }

        .big-title-text {
            font-size: 20px;
            font-weight: bold;
            padding-left: 2px;
        }
    }

    .table-action-container {
        display: flex;
        flex-direction: column;
        padding: 17px 0 0 36px;

        @media (max-width: 1200px) {
            padding: 17px 20px 0 20px;
        }

        @media (max-width: 768px) {
            padding: 17px 10px 0 10px;
        }

        .action-layout {
            display: flex;
            justify-content: space-between;
            width: 100%;
            margin-bottom: 20px;
            flex-wrap: wrap; /* 允许在必要时换行 */
            gap: 20px; /* 减小间距以适应更窄的屏幕 */
            align-items: flex-start; /* 确保顶部对齐 */

            @media (max-width: 1400px) {
                gap: 15px;
            }

            @media (max-width: 1200px) {
                gap: 15px;
            }

            @media (max-width: 992px) {
                gap: 15px;
                flex-direction: row; /* 确保在中等屏幕上保持行布局 */
            }

            @media (max-width: 768px) {
                gap: 10px;
                flex-direction: column; /* 在非常窄的屏幕上改为列布局 */
            }
        }

        /* 左侧填写框部分 */
        .left-section {
            display: grid;
            grid-template-columns: repeat(
                3,
                minmax(280px, 2fr)
            ); /* 设置最小宽度 */
            grid-template-rows: repeat(2, 1fr);
            gap: 20px;
            flex: 1; /* 使用弹性布局 */
            min-width: 600px; /* 设置最小宽度 */
            max-width: 100%; /* 设置最大宽度 */

            @media (max-width: 1600px) {
                min-width: 550px;
                grid-template-columns: repeat(2, minmax(240px, 1fr));
                grid-template-rows: repeat(3, 1fr);
            }

            @media (max-width: 1200px) {
                min-width: 500px;
                grid-template-columns: repeat(2, minmax(240px, 1fr));
                grid-template-rows: repeat(3, 1fr);
            }

            @media (max-width: 992px) {
                min-width: 400px;
                max-width: 100%;
                width: 100%;
                margin-bottom: 20px;
                flex-basis: 100%; /* 确保在小屏幕上占据整行 */
                order: 1; /* 确保在小屏幕上显示在最前面 */
            }
        }

        .input-item {
            display: flex;
            align-items: center;

            .item-label {
                font-size: $normal-font-size;
                color: $gray-font-color;
                min-width: 70px;
                display: inline-block;
                text-align: right;
                margin-right: 10px;
            }

            .input-container {
                width: 100%;
                height: 32px;
                display: flex;
            }

            .search-input-container {
                height: 100%;
                width: 100%;
                flex: 1;
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
            }

            .range-container {
                display: flex;
                align-items: center;
                border: 1px solid #ddd;
                border-radius: 3px;
                padding: 0 10px;
                height: 32px;
                width: 100%;
                box-sizing: border-box; /* 确保padding不会增加元素总高度 */
                position: relative;

                .range-input {
                    border: none;
                    outline: none;
                    width: 100%;
                    height: 28px;
                    font-size: $normal-font-size;
                    color: #333;
                    background: transparent;
                    text-align: center; /* 添加文本居中 */

                    &::placeholder {
                        color: #999;
                        font-size: $normal-font-size;
                        text-align: center; /* 添加占位符文本居中 */
                    }
                }

                .range-separator {
                    margin: 0 5px;
                    color: #999;
                    line-height: 32px; /* 使分隔符垂直居中 */
                    text-align: center; /* 添加分隔符居中 */
                }

                .clear-button {
                    position: absolute;
                    right: 5px;
                    top: 50%;
                    transform: translateY(-50%);
                    background: none;
                    border: none;
                    color: #999;
                    cursor: pointer;
                    font-size: 16px;
                    padding: 0;
                    width: 16px;
                    height: 16px;
                    display: flex;
                    align-items: center;
                    justify-content: center;

                    &:hover {
                        color: #666;
                    }
                }
            }
        }

        /* 右侧按钮部分 */
        .right-section {
            display: grid;
            grid-template-columns: repeat(
                3,
                minmax(70px, 1fr)
            ); /* 减小最小宽度以适应更窄的屏幕 */
            grid-template-rows: repeat(2, 1fr);
            gap: 20px; /* 减小间距以适应更窄的屏幕 */
            flex: 0 0 auto; /* 不伸缩但保持自身大小 */
            min-width: 280px; /* 减小最小宽度 */
            margin-right: 40px; /* 减小右边距 */

            /* 大屏幕布局 - 3列2行 */
            @media (min-width: 1401px) {
                grid-template-columns: repeat(3, minmax(70px, 1fr));
                grid-template-rows: repeat(2, 1fr);
            }

            /* 中等屏幕布局 - 先减小按钮宽度 */
            @media (max-width: 1400px) and (min-width: 1201px) {
                grid-template-columns: repeat(3, minmax(60px, 1fr));
                grid-template-rows: repeat(2, 1fr);
                gap: 20px;
                margin-right: 30px;
            }

            /* 较小屏幕布局 - 2列3行 */
            @media (max-width: 1600px) and (min-width: 992px) {
                grid-template-columns: repeat(2, minmax(60px, 1fr));
                grid-template-rows: repeat(3, 1fr);
                gap: 20px;
                margin-right: 20px;
            }

            /* 小屏幕布局 - 换行后的布局 */
            @media (max-width: 992px) {
                grid-template-columns: repeat(3, minmax(60px, 1fr));
                grid-template-rows: repeat(2, 1fr);
                gap: 10px;
                margin-right: 0;
                margin-top: 15px;
                width: 100%;
                flex-basis: 100%; /* 确保在小屏幕上占据整行 */
                order: 2; /* 确保在小屏幕上显示在左侧部分之后 */
            }

            /* 最小屏幕布局 - 2列3行，更小的间距 */
            @media (max-width: 768px) {
                grid-template-columns: repeat(2, 1fr);
                grid-template-rows: repeat(3, 1fr);
                gap: 8px;
                margin-right: 0;
                width: 100%;
            }
        }

        .button-item {
            display: flex;
            justify-content: center;
            align-items: center;
            width: 100%;

            @media (max-width: 1200px) {
                min-width: 0; /* 移除最小宽度限制 */
            }
        }

        .action-btn {
            border-radius: 3px;
            height: 32px;
            padding: 0 10px; /* 减小内边距 */
            font-size: 14px;
            cursor: pointer;
            min-width: 60px; /* 减小最小宽度 */
            text-align: center;
            width: 100%; /* 使按钮填充容器 */
            max-width: 120px; /* 设置最大宽度 */
            white-space: nowrap; /* 防止文本换行 */
            overflow: hidden; /* 隐藏溢出内容 */
            text-overflow: ellipsis; /* 显示省略号 */
            transition: all 0.3s ease; /* 添加过渡效果 */

            /* 响应式调整按钮内边距和字体大小 */
            @media (max-width: 1400px) and (min-width: 1201px) {
                padding: 0 8px;
                min-width: 50px;
            }

            @media (max-width: 1200px) and (min-width: 992px) {
                padding: 0 6px;
                min-width: 45px;
                font-size: 13px;
            }

            @media (max-width: 992px) {
                padding: 0 6px;
                min-width: 40px;
                font-size: 13px;
            }
        }

        /* 按钮样式 */
        .add-user-button {
            background-color: #0052d9;
            color: white;
            border: none;
        }

        .search-button {
            background-color: #0052d9;
            color: white;
            border: none;
        }

        .export-button,
        .import-button {
            background-color: white;
            color: #333;
            border: 1px solid #ddd;
        }

        .delete-button {
            background-color: var(--red);
            color: white;
            border: none;
        }

        .enable-button {
            background-color: var(--green);
            color: white;
            border: none;
        }

        .disable-button {
            background-color: var(--orange);
            color: white;
            border: none;
        }

        .log-button {
            background-color: var(--gray);
            color: white;
            border: none;
        }
    }

    .state-tag {
        border: none;
        border-radius: 10px;
        color: rgba(0, 0, 0, 0.75);
        font-size: 12px;
        width: 74px;
        height: 26px;
        display: flex;
        align-items: center;
        justify-content: center;
        margin: auto;
        &.unpublished {
            background-color: #689bff;
        }
        &.to-start {
            background-color: #0052d9;
        }
        &.ended {
            background-color: #001b9f;
        }
        &.archived {
            background-color: #7f7f7f;
        }
        &.on-going {
            background-color: #117c00;
        }
        &.error {
            background-color: #d90000;
        }
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

    .user-list-table {
        font-size: 14px;
        border-collapse: collapse;
        width: 100%;

        .checkbox-all,
        .checkbox-item {
            width: 16px;
            height: 16px;
            cursor: pointer;
            vertical-align: middle;
            accent-color: #0052d9;
        }
        .user-list-table-head {
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
                }
                .user-time-sort-button {
                    border: none;
                    background-color: white;
                    font-size: 14px;
                    font-weight: normal;
                    color: rgb(0, 0, 0, 0.3);
                    display: flex;
                    align-items: center;
                    margin: auto;
                    cursor: pointer;
                }
            }
        }
        .user-list-table-data {
            .table-data-tr {
                border-top: none;
                border-bottom: 1px solid #ddd;
                border-left: none;
                border-right: none;
                padding: 8px;
                font-size: 14px;
                text-align: center;
                color: rgb(0, 0, 0, 0.75);
                height: 60px;
            }
            .table-data-tr:hover {
                background-color: #ecf2fe;
            }
        }
    }

    .table-container {
        padding: 5px 37px 50px 37px;
        overflow-x: auto;

        @media (max-width: 1200px) {
            padding: 5px 20px 50px 20px;
        }

        @media (max-width: 768px) {
            padding: 5px 10px 50px 10px;
        }
    }

    .action-button {
        border: none;
        background-color: rgb(0, 0, 0, 0);
        color: #0052d9;
        cursor: pointer;
        font-size: 14px;
    }
    .action-button:hover {
        font-weight: bold;
    }
    .pagination-container {
        justify-self: right;
        padding: 20px 0 0 0;
        display: flex;
        justify-content: right;
        align-items: center;
        width: 100%;

        .loading-indicator {
            color: $gray-font-color;
            font-size: $normal-font-size;
            padding: 20px;
        }

        .error-message {
            color: #d9001b;
            font-size: $normal-font-size;
            padding: 20px;
        }

        .empty-message {
            color: $gray-font-color;
            font-size: $normal-font-size;
            padding: 20px;
        }
    }

    .tip {
        position: absolute;
        border: none;
        background-color: rgb(0, 0, 0, 0);
        left: 95%;
        display: flex;
        align-items: center;
        justify-content: center;
        top: 4px;
    }

    .tooltip-text {
        visibility: hidden;
        width: max-content;
        max-width: 200px;
        background-color: white;
        border: 1px solid #d7d7d7;
        color: black;
        text-align: left;
        padding: 6px 8px;
        border-radius: 4px;
        position: absolute;
        z-index: 1;
        bottom: 150%;
        left: 50%;
        transform: translateX(-50%);
        white-space: pre-line;
        font-size: 12px;
        line-height: 1.4;
    }

    .tip:hover .tooltip-text {
        visibility: visible;
    }

    .more-action-list {
        position: absolute;
        box-sizing: border-box;
        overflow-y: auto;
        background-color: white;
        z-index: 1000;
        display: flex;
        flex-direction: column;
        align-items: center;
        padding: 4px 0;
        width: 110px;
        max-height: 115px;
        border: 1px solid rgb(0, 0, 0, 0.3);
        border-radius: 3px;
    }
    .more-action-button {
        border: none;
        background-color: white;
        font-size: 14px;
        color: rgb(0, 0, 0, 0.75);
        height: 26px;
        width: 100%;
        cursor: pointer;
    }
    .more-action-button:hover {
        background-color: rgba(242, 242, 242, 0.35);
        border-radius: 5px;
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
</style>
