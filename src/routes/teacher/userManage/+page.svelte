<script>
    import { onMount } from "svelte";
    import Title from "$lib/components/Title/Title.svelte";
    import Pagination from '$lib/components/Pagination/Pagination.svelte';
    import { debounce } from "./_utils/debounce.js";
    import { goto } from "$app/navigation";

    let users = $state([]); // 用户列表

    //全选状态
    let selectAll = $state(false);

    // 搜索状态
    let searchAccount = $state("");
    let searchName = $state("");
    let searchPhone = $state("");
    let searchEmail = $state("");

    // 选择筛选状态
    let filterCreateTime = $state("");
    let filterRole = $state([]);
    let filterGender = $state("all"); // 性别值(发送后端)
    let filterStatus = $state("all"); // 状态值(发送后端)

    let isDropdownOpen = $state(false); // 状态下拉框展开状态
    let isGenderDropdownOpen = $state(false); // 性别下拉框展开状态
    let isRoleDropdownOpen = $state(false); // 角色下拉框展开状态

    // 分页相关状态
    let currentPage = $state(1);
    let pageSize = $state(10);
    let totalItems = $state(0); // 总记录数
    let totalPages = $state(0); // 总页数

    // 加载状态
    let loading = $state(false);
    let error = $state(null);

    const TypeMap = {
        "00": "匿名用户",
        "02": "注册用户",
        "04": "试用用户",
        "08": "机构上帝",
        "10": "测试用户",
        "80": "系统上帝",
    };

    // 角色下拉选项(用于筛选 TODO:后端暂不返回 roles)
    const roleOptions = [
        { value: "超级管理员", label: "超级管理员" },
        { value: "普通管理员", label: "普通管理员" },
        { value: "批阅员", label: "批阅员" },
        { value: "教师", label: "教师" },
        { value: "监考员", label: "监考员" },
        { value: "核分员", label: "核分员" },
        { value: "考点负责人", label: "考点负责人" },
        { value: "学生", label: "学生" },
    ];

    // 性别下拉选项(用于筛选)
    const genderOptions = [
        { value: "all", label: "全部" },
        { value: "男", label: "男" },
        { value: "女", label: "女" },
    ];

    // 状态下拉选项(用于筛选)
    const statusOptions = [
        { value: "all", label: "全部" },
        { value: "00", label: "启用" },
        { value: "02", label: "停用" },
    ];

    // 状态码到CSS类名的映射(用于CSS样式不同值显示不同颜色)
    const StateClassMap = {
        "00": "enabled",
        "02": "disabled",
        "04": "deleted",
    };

    // 状态映射(将值转换为显示文本)
    const statusLabelMap = {
        all: "全部",
        "00": "启用",
        "02": "停用",
    };

    // 性别映射(将值转换为显示文本)
    const genderLabelMap = {
        all: "全部",
        男: "男",
        女: "女",
    };

    //处理获取用户列表 TODO：替换为统一接口请求
    function fetchUsers() {
        loading = true;
        error = null;

        //构建请求参数
        const params = {
            page: String(currentPage),
            pageSize: String(pageSize),
        };
        if (searchName) params.officialName = searchName;
        if (searchPhone) params.mobilePhone = searchPhone;
        if (searchEmail) params.email = searchEmail;
        if (filterGender && filterGender !== "all")
            params.gender = filterGender;
        if (filterStatus && filterStatus !== "all")
            params.status = filterStatus; //all则不传值，显示全部
        if (searchAccount) params.account = searchAccount;
        if (filterCreateTime) {
            const [y, m, d] = filterCreateTime.split("-").map(Number);
            const localDate = new Date(y, m - 1, d); //monthIndex 从 0 开始
            params.createTime = localDate.getTime();
        }
        1;
        //TODO:角色的筛选，后端暂不返回 roles

        fetch(`/api/user?${new URLSearchParams(params)}`, {
            method: "GET",
            headers: {
                "Content-Type": "application/json",
            },
            credentials: "include",
        })
            .then((response) => response.json())
            .then((res) => {
                if (res && Array.isArray(res.data)) {
                    users = res.data.map((user) => ({
                        id: user.ID,
                        account: user.Account,
                        name: user.OfficialName || "-",
                        gender: user.Gender || "-",
                        phone: user.MobilePhone || "-",
                        email: user.Email || "-",
                        type: TypeMap[user.Type] || user.Type || "-",
                        category: user.Category || "-",
                        roles: user.Roles || ["-"], // TODO:后端暂不返回 roles
                        createTime: user.CreateTime
                            ? new Date(user.CreateTime).toLocaleDateString()
                            : "",
                        Status: user.Status,
                        selected: false,
                        has_relation: false,
                    }));
                    totalItems = res.rowCount || res.data.length;
                    totalPages = Math.ceil(totalItems / pageSize);
                    selectAll = false;
                } else {
                    users = [];
                    totalItems = 0;
                    totalPages = 0;
                    selectAll = false;
                }
                loading = false;
            })
            .catch((errorInfo) => {
                error = `获取用户列表失败: ${errorInfo.message}`;
                users = [];
                totalItems = 0;
                totalPages = 0;
                selectAll = false;
                loading = false;
            });
    }

    // 防抖处理搜索函数
    const handleSearchDebounced = debounce(() => {
        currentPage = 1;
        fetchUsers();
    }, 400);

    // 清空搜索
    function clearSearch(field) {
        switch (field) {
            case "account":
                searchAccount = "";
                break;
            case "name":
                searchName = "";
                break;
            case "phone":
                searchPhone = "";
                break;
            case "email":
                searchEmail = "";
                break;
        }
        fetchUsers();
    }

    // 状态筛选处理函数(点击下拉选项的重新调用)
    function handleStatusFilter(value) {
        filterStatus = value;
        currentPage = 1;
        isDropdownOpen = false;
        fetchUsers();
    }

    // 性别筛选处理函数(点击下拉选项的重新调用)
    function handleGenderFilter(value) {
        filterGender = value;
        currentPage = 1;
        isGenderDropdownOpen = false;
        fetchUsers();
    }

    // 创建时间筛选处理函数
    const handleCreateTimeChange = debounce(() => {
        currentPage = 1;
        fetchUsers();
    }, 400);

    //切换全选状态
    function toggleSelectAll() {
        users = users.map((user) => ({
            ...user,
            selected: selectAll,
        }));
    }

    //处理用户状态切换
    function toggleStatus(id) {
        const user = users.find((s) => s.id === id);
        if (!user) return;
        const newStatus = user.currentStatus === "00" ? "02" : "00";
        users = users.map((s) =>
            s.id === id ? { ...s, currentStatus: newStatus } : s,
        );
    }

    // 页码选择处理
    function handlePageChange(event) {
        currentPage = event.detail;
        fetchUsers();
    }

    // 每页大小变更处理
    function handlePageSizeChange(event) {
        pageSize = event.detail;
        currentPage = 1;
        fetchUsers();
    }

    // 导出用户
    function handleExport() {
        // TODO: 实现导出逻辑
    }

    // 导入用户
    function handleImport() {
        // TODO: 实现导入逻辑
    }

    // 删除选中用户
    function handleBatchDelete() {
        const selectedIds = users
            .filter((user) => user.selected)
            .map((user) => user.id);

        if (selectedIds.length === 0) {
            return;
        }
        // TODO: 实现批量删除逻辑
    }

    // 启用选中用户
    function handleBatchEnable() {
        const selectedIds = users
            .filter((user) => user.selected)
            .map((user) => user.id);

        if (selectedIds.length === 0) {
            return;
        }
        // TODO: 实现批量启用逻辑
    }

    // 停用选中用户
    function handleBatchDisable() {
        const selectedIds = users
            .filter((user) => user.selected)
            .map((user) => user.id);

        if (selectedIds.length === 0) {
            return;
        }
        // TODO: 实现批量停用逻辑
    }

    // 查看操作日志
    function handleViewLogs() {
        // TODO: 实现查看操作日志逻辑
    }

    //处理详情按钮
    function handleDetail(id) {
        // TODO: 实现查看详情逻辑
    }

    //处理编辑按钮
    function handleEdit(id) {
        // TODO: 实现编辑逻辑
    }

    //处理移除按钮
    function handleUnbind(id) {
        const user = users.find((s) => s.id === id);
        //TODO: 实现移除逻辑
    }

    //处理删除按钮
    function handleDelete(id) {
        const user = users.find((s) => s.id === id);
        //TODO: 实现删除逻辑
    }

    onMount(() => {
        //点击页面空白处自动关闭下拉框
        const closeDropdowns = (event) => {
            if (!event.target.closest(".input-container")) {
                isDropdownOpen = false;
                isGenderDropdownOpen = false;
                isRoleDropdownOpen = false;
            }
        };
        document.addEventListener("click", closeDropdowns);
        fetchUsers();
        return () => document.removeEventListener("click", closeDropdowns);
    });
</script>

<div class="user-management-container">
    <Title title="用户列表" />
    <div class="table-action-container">
        <div class="action-layout">
            <!-- 左侧筛选区 -->
            <div class="left-section">
                <!-- 账号搜索 -->
                <div class="input-item">
                    <span class="item-label">账号</span>
                    <div class="input-container">
                        <div class="search-container">
                            <input
                                type="text"
                                bind:value={searchAccount}
                                placeholder="请输入账号"
                                class="search-input"
                                oninput={handleSearchDebounced}
                            />
                            <button
                                class="clear-btn {searchAccount ? '' : 'hide'}"
                                onclick={() => clearSearch("account")}>×</button
                            >
                        </div>
                    </div>
                </div>
                <!-- 姓名搜索 -->
                <div class="input-item">
                    <span class="item-label">姓名</span>
                    <div class="input-container">
                        <div class="search-container">
                            <input
                                type="text"
                                bind:value={searchName}
                                placeholder="请输入姓名"
                                class="search-input"
                                oninput={handleSearchDebounced}
                            />
                            <button
                                class="clear-btn {searchName ? '' : 'hide'}"
                                onclick={() => clearSearch("name")}>×</button
                            >
                        </div>
                    </div>
                </div>
                <!-- 电话搜索 -->
                <div class="input-item">
                    <span class="item-label">电话</span>
                    <div class="input-container">
                        <div class="search-container">
                            <input
                                type="text"
                                bind:value={searchPhone}
                                placeholder="请输入电话"
                                class="search-input"
                                oninput={handleSearchDebounced}
                            />
                            <button
                                class="clear-btn {searchPhone ? '' : 'hide'}"
                                onclick={() => clearSearch("phone")}>×</button
                            >
                        </div>
                    </div>
                </div>
                <!-- 邮箱搜索 -->
                <div class="input-item">
                    <span class="item-label">邮箱</span>
                    <div class="input-container">
                        <div class="search-container">
                            <input
                                type="text"
                                bind:value={searchEmail}
                                placeholder="请输入邮箱"
                                class="search-input"
                                oninput={handleSearchDebounced}
                            />
                            <button
                                class="clear-btn {searchEmail ? '' : 'hide'}"
                                onclick={() => clearSearch("email")}>×</button
                            >
                        </div>
                    </div>
                </div>

                <!-- 创建时间筛选 -->
                <div class="input-item">
                    <span class="item-label">创建时间</span>
                    <div class="input-container">
                        <input
                            type="date"
                            bind:value={filterCreateTime}
                            onchange={handleCreateTimeChange}
                            class="date-input"
                        />
                    </div>
                </div>

                <!-- 角色筛选TODO:后端暂不返回 roles -->
                <div class="input-item">
                    <span class="item-label">角色</span>
                    <div class="input-container">
                        <button
                            class="dropdown-btn"
                            onclick={() =>
                                (isRoleDropdownOpen = !isRoleDropdownOpen)}
                        >
                            {filterRole.length === 0
                                ? "全部角色"
                                : filterRole.length === roleOptions.length
                                  ? "全部角色"
                                  : filterRole.join(", ")}
                            <img
                                src="/student_management/down_arrow.svg"
                                alt="toggle"
                                class="dropdown-icon {isRoleDropdownOpen
                                    ? 'rotate'
                                    : ''}"
                            />
                        </button>

                        <div
                            class="dropdown-options {isRoleDropdownOpen
                                ? 'show'
                                : 'hide'}"
                        >
                            <!-- 全部角色选项 -->
                            <button
                                onclick={() => (filterRole = [])}
                                class="dropdown-option {filterRole.length === 0
                                    ? 'active'
                                    : ''}"
                            >
                                全部角色
                            </button>
                            <!-- 各角色选项 -->
                            {#each roleOptions as option}
                                <button
                                    onclick={() =>
                                        (filterRole = filterRole.includes(
                                            option.value,
                                        )
                                            ? filterRole.filter(
                                                  (r) => r !== option.value,
                                              )
                                            : [...filterRole, option.value])}
                                    class="dropdown-option {filterRole.includes(
                                        option.value,
                                    )
                                        ? 'active'
                                        : ''}"
                                >
                                    {option.label}
                                </button>
                            {/each}
                        </div>
                    </div>
                </div>

                <!-- 性别筛选 -->
                <div class="input-item">
                    <span class="item-label">性别</span>
                    <div class="input-container">
                        <button
                            class="dropdown-btn"
                            onclick={() =>
                                (isGenderDropdownOpen = !isGenderDropdownOpen)}
                        >
                            {genderLabelMap[filterGender]}
                            <img
                                src="/student_management/down_arrow.svg"
                                alt="toggle"
                                class="dropdown-icon {isGenderDropdownOpen
                                    ? 'rotate'
                                    : ''}"
                            />
                        </button>

                        <div
                            class="dropdown-options {isGenderDropdownOpen
                                ? 'show'
                                : 'hide'}"
                        >
                            {#each genderOptions as option}
                                <button
                                    onclick={() =>
                                        handleGenderFilter(option.value)}
                                    class="dropdown-option {filterGender ===
                                    option.value
                                        ? 'active'
                                        : ''}"
                                >
                                    {option.label}
                                </button>
                            {/each}
                        </div>
                    </div>
                </div>

                <!-- 状态筛选 -->
                <div class="input-item">
                    <span class="item-label">账号状态</span>
                    <div class="input-container">
                        <button
                            class="dropdown-btn"
                            onclick={() => (isDropdownOpen = !isDropdownOpen)}
                        >
                            {statusLabelMap[filterStatus]}
                            <img
                                src="/student_management/down_arrow.svg"
                                alt="toggle"
                                class="dropdown-icon {isDropdownOpen
                                    ? 'rotate'
                                    : ''}"
                            />
                        </button>
                        <div
                            class="dropdown-options {isDropdownOpen
                                ? 'show'
                                : 'hide'}"
                        >
                            {#each statusOptions as option}
                                <button
                                    onclick={() =>
                                        handleStatusFilter(option.value)}
                                    class="dropdown-option {filterStatus ===
                                    option.value
                                        ? 'active'
                                        : ''}"
                                >
                                    {option.label}
                                </button>
                            {/each}
                        </div>
                    </div>
                </div>
            </div>
            <!-- 右侧按钮区 -->
            <div class="right-section">
                <button class="action-btn export-btn" onclick={handleExport}>
                    导出
                </button>
                <button class="action-btn import-btn" onclick={handleImport}>
                    导入
                </button>
                <button
                    class="action-btn add-btn"
                    onclick={() => goto("/userManage/addUser")}
                >
                    新增
                </button>
                <button
                    class="action-btn delete-btn"
                    onclick={handleBatchDelete}
                >
                    删除
                </button>

                <button
                    class="action-btn enable-btn"
                    onclick={handleBatchEnable}
                >
                    启用
                </button>
                <button
                    class="action-btn disable-btn"
                    onclick={handleBatchDisable}
                >
                    停用
                </button>
                <button
                    class="action-btn view-logs-btn"
                    onclick={handleViewLogs}
                >
                    查看操作日志
                </button>
            </div>
        </div>
    </div>
    <div class="table-container">
        <!-- 表格 -->
        <table class="user-table">
            <thead>
                <tr class="table-header-row">
                    <th class="col-checkbox table-head">
                        <input
                            type="checkbox"
                            class="checkbox-all"
                            bind:checked={selectAll}
                            onchange={toggleSelectAll}
                        />
                    </th>
                    <th class="col-account table-head">账号</th>
                    <th class="col-name table-head">姓名</th>
                    <th class="col-gender table-head">性别</th>
                    <th class="col-phone table-head">电话</th>
                    <th class="col-email table-head">邮箱</th>
                    <th class="col-status table-head">账号状态</th>
                    <th class="col-category table-head">分类</th>
                    <th class="col-role table-head">角色</th>
                    <th class="col-creation table-head">创建时间</th>
                    <th class="col-current-status table-head">当前状态</th>
                    <th class="col-actions table-head">操作</th>
                </tr>
            </thead>
            <tbody>
                {#each users as user (user.id)}
                    <tr class="table-row" data-id={user.id}>
                        <td class="col-checkbox">
                            <input
                                type="checkbox"
                                class="checkbox-item"
                                bind:checked={user.selected}
                            />
                        </td>
                        <td class="col-account" title={user.account}>
                            {user.account}
                        </td>
                        <td class="col-name" title={user.name}>
                            {user.name}
                        </td>
                        <td class="col-gender">{user.gender}</td>
                        <td class="col-phone">{user.phone}</td>
                        <td class="col-email">{user.email}</td>
                        <td class="col-status">{user.type}</td>
                        <td class="col-category">{user.category}</td>
                        <td class="col-role">{user.roles.join(", ")}</td>
                        <td class="col-creation">{user.createTime}</td>
                        <td class="col-current-status">
                            <span
                                class="status-text {StateClassMap[user.Status]}"
                            >
                                {statusLabelMap[user.Status] || "-"}
                            </span>
                        </td>
                        <td class="col-actions">
                            <div class="actions">
                                <button
                                    class="btn-link btn-detail"
                                    onclick={() => handleDetail(user.id)}
                                    >详情</button
                                >
                                <button
                                    class="btn-link btn-edit"
                                    onclick={() => handleEdit(user.id)}
                                    >修改</button
                                >
                                <button
                                    class="btn-link {user.status === '02'
                                        ? 'btn-enable'
                                        : 'btn-disable'}"
                                    onclick={() => toggleStatus(user.id)}
                                >
                                    {user.status === "02" ? "启用" : "停用"}
                                </button>
                                <!-- 移除按钮 -->
                                <button
                                    class="btn-link btn-unbind"
                                    style="display: {user.has_relation
                                        ? 'inline-block'
                                        : 'none'}"
                                    onclick={() => handleUnbind(user.id)}
                                    >移除</button
                                >

                                <!-- 删除按钮 -->
                                <button
                                    class="btn-link btn-delete"
                                    style="display: {user.has_relation
                                        ? 'none'
                                        : 'inline-block'}"
                                    onclick={() => handleDelete(user.id)}
                                    >删除</button
                                >
                            </div>
                        </td>
                    </tr>
                {/each}
            </tbody>
        </table>
        <!-- 分页器 -->
        <div class="pagination-wrapper">
            <div class="pagination-container {totalItems > 0 ? '' : 'hide'}">
                <Pagination
                    totalItems={totalItems}
                    currentPage={currentPage}
                    pageSize={pageSize}
                    pageSizeOptions={[10, 20, 50]}
                    on:pageChange={handlePageChange} 
                    on:pageSizeChange={handlePageSizeChange}
                />
            </div>
        </div>
    </div>
</div>

<style lang="scss" scoped>
    $normal-font-size: 14px;
    $gray-font-color: rgb(0, 0, 0, 0.6);

    .user-management-container {
        position: relative;
        background-color: var(--bg-primary);
        display: flex;
        flex-direction: column;
        width: 100%;
        min-height: 100vh;
        overflow-y: auto;
        min-width: 1000px;
    }

    .table-action-container {
        display: flex;
        flex-direction: column;

        .action-layout {
            display: flex;
            justify-content: space-between;
            flex-wrap: wrap;
            width: 100%;
            margin-bottom: 20px;
            gap: 20px;
            align-items: flex-start;

            @media (max-width: 1200px) {
                gap: 15px;
            }
            @media (max-width: 768px) {
                gap: 10px;
                flex-direction: column;
            }
        }

        .left-section {
            display: grid;
            grid-template-columns: repeat(3, minmax(280px, 2fr));
            grid-template-rows: repeat(2, 1fr);
            gap: 20px;
            flex: 1;
            min-width: 600px;
            max-width: 100%;

            .input-item {
                display: flex;
                align-items: center;

                .item-label {
                    font-size: $normal-font-size;
                    color: $gray-font-color;
                    min-width: 70px;
                    display: inline-block;
                    text-align: right; //放在容器右侧TODO:后续需确定放哪
                }

                .input-container {
                    position: relative;
                    display: flex;
                    width: 100%;
                    min-height: 32px;
                    border: 1px solid #ddd;
                    border-radius: 3px;
                    padding: 0 5px;
                    margin-left: 20px;
                    align-items: center;
                    justify-items: center;

                    .search-container {
                        position: relative;
                        display: flex;
                        flex: 1;
                        align-items: center;
                        width: 100%;
                    }

                    .dropdown-btn {
                        display: flex;
                        padding: 0 12px;
                        min-height: 32px;
                        width: 100%;
                        color: #1d2129;
                        align-items: center;
                        justify-content: space-between;
                        font-size: $normal-font-size;
                        border: none;
                        background: transparent;
                        border-radius: 3px;

                        cursor: pointer;

                        .dropdown-icon {
                            min-width: 12px;
                            height: auto;
                            transition: transform 0.3s ease;
                            &.rotate {
                                transform: rotate(180deg);
                            }
                        }
                    }
                    .dropdown-options {
                        position: absolute;
                        display: flex;
                        flex-direction: column;
                        top: calc(100% + 5px);
                        left: 0;
                        right: 0;
                        border: 1px solid #e5e5e5;
                        border-radius: 4px;
                        background: #fff;
                        z-index: 10;

                        &.hide {
                            visibility: hidden;
                        }

                        &.show {
                            visibility: visible;
                        }

                        .dropdown-option {
                            width: 100%;
                            min-height: 32px;
                            padding: 0 10px;
                            font-size: $normal-font-size;
                            border: none;
                            background: transparent;
                            cursor: pointer;
                            text-align: left;
                            display: flex;
                            align-items: center;
                            padding: 8px 10px;
                            cursor: pointer;
                            input[type="checkbox"] {
                                margin-right: 8px;
                                cursor: pointer;
                            }

                            &:hover {
                                background-color: #cccccc;
                            }

                            &.active {
                                background: #cccccc;
                            }
                        }
                    }
                }

                .search-input {
                    flex: 1;
                    border: none;
                    outline: none;
                    height: 100%;
                    padding: 0 25px 0 5px;
                    font-size: $normal-font-size;
                    background-color: transparent;

                    &::placeholder {
                        color: #999;
                    }
                }

                .date-input,
                .select-input {
                    width: 100%;
                    min-height: 32px;
                    border: 1px solid rgb(255, 255, 255);
                    border-radius: 3px;
                    padding: 0 8px;
                    font-size: $normal-font-size;
                    outline: none;
                    box-sizing: border-box;
                }

                .clear-btn {
                    position: absolute;
                    display: flex;
                    right: 5px;
                    background: none;
                    border: none;
                    cursor: pointer;
                    color: #999;
                    font-size: 16px;
                    padding: 0;
                    align-items: center;
                    justify-self: center;

                    &.hide {
                        visibility: hidden;
                    }

                    &.show {
                        visibility: visible;
                    }
                }
            }
        }

        .right-section {
            display: grid;
            grid-template-columns: repeat(3, minmax(70px, 1fr));
            grid-template-rows: repeat(3, 1fr);
            gap: 20px;
            flex: 0 0 auto;
            min-width: 280px;
            margin-right: 40px; //TODO：后续删除
            @media (max-width: 1400px) and (min-width: 1201px) {
                grid-template-columns: repeat(3, minmax(60px, 1fr));
                grid-template-rows: repeat(2, 1fr);
                gap: 20px;
                margin-right: 30px;
            }
            @media (max-width: 768px) {
                grid-template-columns: repeat(2, 1fr);
                grid-template-rows: repeat(3, 1fr);
                gap: 8px;
                margin-left: 40px;
                margin-right: 0;
            }

            .button-item {
                display: flex;
                justify-items: center;
                width: 100%;

                @media (max-width: 1200px) {
                    min-width: 0;
                }
            }

            .action-btn {
                border-radius: 3px;
                min-height: 32px;
                padding: 0 10px;
                font-size: $normal-font-size;
                cursor: pointer;
                min-width: 60px;
                max-width: 120px;
                text-align: center;
                white-space: nowrap;
                overflow: hidden;
                text-overflow: ellipsis;
                transition: all 0.3s ease;
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
                    font-size: 12px;
                }
            }

            .add-btn {
                background-color: #0052d9;
                color: white;
                border: none;
            }

            .export-btn,
            .import-btn {
                background-color: white;
                color: #333;
                border: 1px solid #ddd;
            }

            .delete-btn {
                background-color: #e34d59;
                color: white;
                border: none;
            }

            .enable-btn {
                background-color: #00b42a;
                color: white;
                border: none;
            }

            .disable-btn {
                background-color: #ff7d00;
                color: white;
                border: none;
            }

            .view-logs-btn {
                background-color: #86909c;
                color: white;
                border: none;
            }
        }
    }

    .table-container {
        overflow-x: auto;

        @media (max-width: 1200px) {
            padding: 5px 20px 50px 20px;
        }
        @media (max-width: 768px) {
            padding: 5px 10px 50px 10px;
        }
    }

    .user-table {
        font-size: $normal-font-size;
        border-collapse: collapse;
        width: 100%;

        th {
            font-weight: normal;
            height: 40px;
            padding: 8px;
            text-align: center;
            background-color: #ffffff;
        }

        td {
            padding: 12px 8px;
            text-align: center;
            border-bottom: 1px solid #eee;
            color: rgb(0, 0, 0, 0.75);
            height: 60px;
        }

        .table-row:hover {
            background-color: #ecf2fe;
        }

        .col-checkbox {
            width: 3%;
        }
        .col-account {
            width: 10%;
        }
        .col-name {
            width: 5%;
        }
        .col-gender {
            width: 5%;
        }
        .col-phone {
            width: 8%;
        }
        .col-email {
            width: 10%;
        }
        .col-status {
            width: 7%;
        }
        .col-category {
            width: 7%;
        }
        .col-role {
            width: 8%;
        }
        .col-creation {
            width: 7%;
        }
        .col-current-status {
            width: 7%;
        }
        .col-actions {
            width: 13%;
        }
    }

    .status-text {
        font-size: $normal-font-size;

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

    .actions {
        display: flex;
        gap: 20px;
        justify-content: center;

        .btn-link {
            background: none;
            border: none;
            cursor: pointer;
            padding: 0;
            font-size: $normal-font-size;

            &:hover {
                font-weight: bold;
            }
        }

        .btn-detail,
        .btn-edit {
            color: blue;
        }
        .btn-enable {
            color: green;
        }

        .btn-disable {
            color: orange;
        }

        .btn-delete,
        .btn-unbind {
            color: red;
        }
    }

    .pagination-wrapper {
        .pagination-container {
            position: fixed;
            bottom: 40px; //留出页脚位置
            right: 20px;
            z-index: 1000;
            visibility: visible;
            &.hide {
                visibility: hidden;
            }
        }
    }
</style>
