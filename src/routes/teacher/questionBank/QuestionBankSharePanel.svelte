<script>
    import Pagination from "$lib/component/Pagination.svelte";
    import SearchInput from "$lib/component/SearchInput.svelte";

    /** @typedef {Object} Teacher
     * @property {number} id - Teacher ID
     * @property {string} account - Teacher account
     * @property {string} official_name - Teacher name
     * @property {string} gender - Teacher gender
     */

    /** @typedef {Object} QuestionBank
     * @property {number} id - QuestionBank ID
     * @property {string} name - QuestionBank name
     * @property {string} access_mode - QuestionBank access mode
     * @property {number} creator - Creator ID
     */

    /** @typedef {Object} UserListItem
     * @property {number} id - User ID
     * @property {string} account - User account
     * @property {string} name - User name
     * @property {string} gender - User gender
     * @property {boolean} selected - Whether user is selected
     */

    /** @typedef {Object} ShareApiResponse
     * @property {number} status - Response status
     * @property {string} msg - Response message
     * @property {Object} data - Response data
     * @property {number[]} data.shared_users - Shared users list
     * @property {number} data.user_id - Current user ID
     */

    /** @typedef {Object} ShareUserInfo
     * @property {number} user_id - User ID
     * @property {string} user_name - User name
     * @property {string} account - User account
     */

    /** @typedef {Object} GetSharedUserListResponse
     * @property {ShareUserInfo[]} shared_users - List of shared users
     * @property {ShareUserInfo} creator - Bank creator info
     */

    let { isOpen = $bindable(), bank, actionToast } = $props();

    // 共享状态选项
    const shareOptions = [
        { label: "私有", value: "00" },
        { label: "共享", value: "02" },
        { label: "公有", value: "04" },
    ];

    // 当前共享状态
    let shareStatus = $state("00");
    /** @type {ShareUserInfo[]} */
    let sharedUsers = $state([]);
    /** @type {UserListItem[]} */
    let userList = $state([]);
    /** @type {ShareUserInfo | null} */
    let creator = $state(null);
    let searchKeyword = $state("");
    let isOwner = $state(false);
    let UserID = $state(0);
    /** @type {number[]} */
    let selectedUserIds = $state([]);
    let loading = $state(false);
    let saving = $state(false);
    let errorMsg = $state("");

    let currentPage = $state(1);
    let pageSize = $state(10);
    let total = $state(0);
    let totalPages = $derived(Math.ceil(total / pageSize));

    let isAllSelected = $state(false);

    /** @type {NodeJS.Timeout | null} */
    let searchTimer = $state(null);

    /**
     * 获取试卷共享信息
     * @returns {Promise<void>}
     */
    async function fetchSharedUsers() {
        if (!bank) return;
        loading = true;
        errorMsg = "";
        try {
            const resp = await fetch(`/api/question-banks/${bank.id}/share`, {
                method: "GET",
                credentials: "include",
            });
            if (!resp.ok) throw new Error(await resp.text());
            /** @type {ShareApiResponse & { data: GetSharedUserListResponse }} */
            const result = await resp.json();
            console.log("获取共享信息结果:", result);
            if (result.status != 0) {
                throw new Error(result.msg);
            }
            sharedUsers = result.data.shared_users || [];
            creator = result.data.creator;
            shareStatus = bank.access_mode || "00";
            UserID = result.data.user_id;
            isOwner = UserID === creator?.user_id;
            selectedUserIds = sharedUsers.map((user) => user.user_id);
        } catch (error) {
            errorMsg =
                "获取共享信息失败:" +
                (error instanceof Error ? error.message : "未知错误");
        } finally {
            loading = false;
        }
    }

    /**
     * 获取教师列表
     * @returns {Promise<void>}
     */
    async function searchUsers() {
        loading = true;
        try {
            const params = new URLSearchParams();
            params.append("page", currentPage.toString());
            params.append("page_size", pageSize.toString());
            if (searchKeyword.trim()) {
                params.append("account", searchKeyword.trim());
            }

            const response = await fetch(
                `/api/admin/teacher/list?${params.toString()}`,
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
            console.log("获取教师列表结果:", result);

            if (result && result.data) {
                // 处理返回的数据，标记是否已选中
                userList = result.data.map(
                    (/** @type {Teacher} */ teacher) => ({
                        id: teacher.id,
                        account: teacher.account,
                        name: teacher.official_name || "-",
                        gender: teacher.gender || "-",
                        selected: selectedUserIds.includes(teacher.id),
                    }),
                );
                total = result.rowCount ?? userList.length;
                isAllSelected =
                    userList.length > 0 && userList.every((u) => u.selected);
            } else {
                userList = [];
                total = 0;
            }
        } catch (error) {
            userList = [];
            total = 0;
            errorMsg = error instanceof Error ? error.message : "搜索失败";
        } finally {
            loading = false;
        }
    }

    /**
     * 处理搜索输入
     * @param {string} value - 搜索关键字
     */
    function handleSearch(value) {
        searchKeyword = value;
        currentPage = 1;
        if (searchTimer) clearTimeout(searchTimer);
        searchTimer = setTimeout(() => {
            searchUsers();
        }, 300);
    }

    /**
     * 处理分页
     * @param {boolean} isNext - 是否下一页
     */
    function handlePageChange(isNext) {
        if (loading) return;
        if (isNext && currentPage < totalPages) {
            currentPage++;
            searchUsers();
        }
        if (!isNext && currentPage > 1) {
            currentPage--;
            searchUsers();
        }
    }

    /**
     * 处理页码输入
     * @param {string | number} value - 页码
     */
    function handlePageInput(value) {
        const page = parseInt(value.toString());
        if (page < 1) {
            currentPage = 1;
        } else if (page > totalPages) {
            currentPage = totalPages;
        } else {
            currentPage = page;
        }
        searchUsers();
    }

    /**
     * 处理全选
     * @param {Event} e - 事件对象
     */
    function toggleSelectAll(e) {
        e.preventDefault();
        isAllSelected = !isAllSelected;
        userList = userList.map((user) => ({
            ...user,
            selected: isAllSelected,
        }));

        if (isAllSelected) {
            const currentPageIds = userList.map((user) => user.id);
            selectedUserIds = [
                ...new Set([...selectedUserIds, ...currentPageIds]),
            ];
        } else {
            const currentPageIds = new Set(userList.map((user) => user.id));
            selectedUserIds = selectedUserIds.filter(
                (id) => !currentPageIds.has(id),
            );
        }
    }

    /**
     * 处理单个选择
     * @param {UserListItem} user - 用户对象
     */
    function toggleSelect(user) {
        user.selected = !user.selected;
        if (user.selected) {
            selectedUserIds = [...selectedUserIds, user.id];
        } else {
            selectedUserIds = selectedUserIds.filter((id) => id !== user.id);
        }
        isAllSelected = userList.every((u) => u.selected);
    }

    /**
     * 保存共享设置
     * @returns {Promise<void>}
     */
    async function saveShareSettings() {
        saving = true;
        errorMsg = "";
        const data = {
            bank_id: bank.id,
            access_mode: shareStatus,
            share_users: shareStatus === "02" ? selectedUserIds : [],
        };
        console.log("保存共享设置数据:", data);
        try {
            const resp = await fetch(`/api/question-banks/${bank.id}/share`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                credentials: "include",
                body: JSON.stringify({data:data}),
            });
            if (!resp.ok) throw new Error(await resp.text());

            if (bank) {
                bank.access_mode = shareStatus;
            }
            closePanel();
            actionToast.show("success", "保存成功");
        } catch (error) {
            errorMsg = error instanceof Error ? error.message : "保存失败";
        } finally {
            saving = false;
        }
    }

    // 监听面板打开时加载数据
    let is_initial_loaded = $state(true);
    $effect(() => {
        console.log(
            "面板状态变化:",
            isOpen,
            "试卷信息:",
            bank,
            "初始加载:",
            is_initial_loaded,
        );
        if (isOpen && bank && is_initial_loaded) {
            is_initial_loaded = false;
            fetchSharedUsers();
            searchUsers();
        }
    });

    // 关闭面板
    function closePanel() {
        isOpen = false;
        // 重置状态
        searchKeyword = "";
        currentPage = 1;
        userList = [];
        selectedUserIds = [];
        is_initial_loaded = true;
    }

    /**
     * 处理键盘事件
     * @param {KeyboardEvent} e - 键盘事件对象
     */
    function handleKeyDown(e) {
        if (e.key === "Escape") {
            closePanel();
        }
    }
</script>

{#if isOpen}
    <div
        role="dialog"
        tabindex="-1"
        onkeydown={handleKeyDown}
        class="share-panel-mask"
        onclick={closePanel}
    ></div>
    <div class="share-panel">
        <div class="panel-header">
            <span>试卷共享设置</span>
            <button class="close-btn" onclick={closePanel}>×</button>
        </div>
        <div class="panel-body">
            <div class="bank-info">
                <div><b>试卷名称：</b>{bank?.name}</div>
                <div class="creator-info">
                    <b>创建者：</b>
                    <span class="creator-name">{creator?.user_name}</span>
                    <span class="creator-account">({creator?.account})</span>
                </div>
            </div>
            <div class="share-status-row">
                <span><b>共享状态：</b></span>
                {#if isOwner}
                    {#each shareOptions as opt}
                        <label
                            class="radio-label"
                            data-tip={opt.value === "00"
                                ? "仅自己可见"
                                : opt.value === "02"
                                  ? "选择指定教师可见"
                                  : "所有教师可见"}
                        >
                            <input
                                type="radio"
                                class="radio-option"
                                bind:group={shareStatus}
                                value={opt.value}
                            />
                            {opt.label}
                        </label>
                    {/each}
                {:else}
                    <span class="readonly-status">
                        {shareOptions.find((o) => o.value === shareStatus)
                            ?.label || "未知"}
                    </span>
                {/if}
            </div>

            {#if shareStatus === "02"}
                <!-- 已共享用户列表 -->
                {#if sharedUsers.length > 0}
                    <div class="shared-users-section">
                        <div class="section-title">已共享用户</div>
                        <div class="shared-users-list">
                            {#each sharedUsers as user}
                                <div class="shared-user-tag">
                                    <span class="user-name"
                                        >{user.user_name}</span
                                    >
                                    <span class="user-account"
                                        >({user.account})</span
                                    >
                                </div>
                            {/each}
                        </div>
                    </div>
                {/if}

                <div class="user-select-container">
                    <div class="search-container">
                        <SearchInput
                            purpose_text="搜索"
                            place_holder="请输入账号或姓名"
                            onSearchFunc={handleSearch}
                        />
                    </div>
                    <div class="table-container">
                        <table class="table" class:loading>
                            <thead>
                                <tr>
                                    <th style="width: 30px;">
                                        <input
                                            type="checkbox"
                                            class="custom-checkbox"
                                            checked={isAllSelected}
                                            onchange={toggleSelectAll}
                                            disabled={!isOwner}
                                        />
                                    </th>
                                    <th>账号</th>
                                    <th>姓名</th>
                                    <th>状态</th>
                                </tr>
                            </thead>
                            <tbody>
                                {#each userList as user}
                                    <tr
                                        class={`user-row ${user.selected ? "selected" : ""}`}
                                    >
                                        <td>
                                            <input
                                                type="checkbox"
                                                class="custom-checkbox"
                                                checked={user.selected}
                                                disabled={!isOwner}
                                                onchange={() =>
                                                    toggleSelect(user)}
                                            />
                                        </td>
                                        <td>{user.account}</td>
                                        <td>{user.name}</td>
                                        <td>
                                            {#if sharedUsers.some((shared) => shared.user_id === user.id)}
                                                <span class="status-tag"
                                                    >已共享</span
                                                >
                                            {/if}
                                        </td>
                                    </tr>
                                {/each}
                            </tbody>
                        </table>
                    </div>
                    <div class="pagination-container">
                        <span class="selected-count">
                            已选 <span class="count"
                                >{selectedUserIds.length}</span
                            > 条
                        </span>
                        <Pagination
                            show_per_page={false}
                            total_data_num={total}
                            total_page_num={totalPages}
                            current_page_num={currentPage}
                            onPageChangeFunc={handlePageChange}
                            onPageSearchFunc={handlePageInput}
                            onPageChooseFunc={handlePageInput}
                        />
                    </div>
                </div>
            {/if}

            {#if errorMsg}
                <div class="error-msg">{errorMsg}</div>
            {/if}
        </div>
        <div class="panel-footer">
            <button class="btn" onclick={closePanel}>取消</button>
            {#if isOwner || shareStatus === "02"}
                <button
                    class="btn primary"
                    onclick={saveShareSettings}
                    disabled={saving}
                >
                    {saving ? "保存中..." : "保存"}
                </button>
            {/if}
        </div>
    </div>
{/if}

<style lang="scss" scoped>
    .share-panel-mask {
        position: fixed;
        left: 0;
        top: 0;
        right: 0;
        bottom: 0;
        background: rgba(0, 0, 0, 0.25);
        z-index: 1000;
    }
    .share-panel {
        position: fixed;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        width: min(900px, 95vw);
        max-height: 90vh;
        background: #fff;
        border-radius: 12px;
        box-shadow: 0 8px 32px rgba(0, 0, 0, 0.12);
        z-index: 1001;
        display: flex;
        flex-direction: column;

        @media (max-width: 768px) {
            width: 95vw;
            max-height: 95vh;
            border-radius: 8px;
        }
    }
    .panel-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 20px 24px;
        font-size: 20px;
        font-weight: 600;
        color: #1a1a1a;
        border-bottom: 1px solid #eee;

        @media (max-width: 768px) {
            padding: 16px;
            font-size: 18px;
        }

        .close-btn {
            background: none;
            border: none;
            font-size: 24px;
            color: #666;
            cursor: pointer;
            transition: color 0.2s;
            padding: 4px;
            border-radius: 4px;
            &:hover {
                color: #ff4d4f;
                background: rgba(0, 0, 0, 0.04);
            }
        }
    }
    .panel-body {
        flex: 1;
        padding: 20px 24px;
        overflow-y: auto;
        min-height: 200px;

        @media (max-width: 768px) {
            padding: 16px;
            min-height: 150px;
        }

        .bank-info {
            font-size: 15px;
            margin-bottom: 16px;
            color: #444;
            background: #f5f7fa;
            padding: 12px 16px;
            border-radius: 8px;

            @media (max-width: 768px) {
                font-size: 14px;
                padding: 10px 12px;
            }

            b {
                color: #222;
                margin-right: 4px;
            }
            div + div {
                margin-top: 8px;
            }
            .creator-info {
                display: flex;
                align-items: center;
                flex-wrap: wrap;
                gap: 4px;

                .creator-name {
                    color: #1a1a1a;
                    font-weight: 500;
                }

                .creator-account {
                    color: #666;
                    font-size: 13px;
                }
            }
        }
        .share-status-row {
            margin-bottom: 20px;
            padding: 4px 0;
            display: flex;
            align-items: center;
            flex-wrap: wrap;
            gap: 8px;

            @media (max-width: 480px) {
                flex-direction: column;
                align-items: flex-start;
            }

            .radio-label {
                margin-right: 24px;
                font-size: 15px;
                display: inline-flex;
                align-items: center;
                cursor: pointer;
                position: relative;

                &:hover::after {
                    content: attr(data-tip);
                    position: absolute;
                    bottom: 100%;
                    left: 50%;
                    transform: translateX(-50%);
                    padding: 4px 8px;
                    background: rgba(0, 0, 0, 0.75);
                    color: white;
                    border-radius: 4px;
                    font-size: 12px;
                    white-space: nowrap;
                    margin-bottom: 5px;
                }

                .radio-option {
                    appearance: none;
                    width: 16px;
                    height: 16px;
                    border: 1.5px solid #d9d9d9;
                    border-radius: 50%;
                    margin-right: 6px;
                    position: relative;
                    cursor: pointer;
                    transition: all 0.2s;

                    &:checked {
                        border-color: #0052d9;

                        &::after {
                            content: "";
                            position: absolute;
                            width: 8px;
                            height: 8px;
                            background-color: #0052d9;
                            border-radius: 50%;
                            left: 50%;
                            top: 50%;
                            transform: translate(-50%, -50%);
                        }
                    }

                    &:hover:not(:checked) {
                        border-color: #0052d9;
                    }

                    &:disabled {
                        opacity: 0.6;
                        cursor: not-allowed;
                    }
                }
            }
            .readonly-status {
                color: #0052d9;
                font-weight: 600;
                font-size: 15px;
            }
        }
    }
    .user-select-container {
        margin-top: 24px;
        .search-container {
            margin-bottom: 20px;
            width: 350px;

            @media (max-width: 768px) {
                width: 100%;
                margin-bottom: 16px;
            }
        }
        .table-container {
            margin: 0 -24px;
            overflow-x: auto;
            position: relative;

            @media (max-width: 768px) {
                margin: 0 -16px;
            }

            .table {
                width: 100%;
                border-collapse: collapse;
                transition: opacity 0.2s;
                opacity: 1;

                &.loading {
                    opacity: 0.6;
                }

                th {
                    font-size: 13px;
                    color: rgba(0, 0, 0, 0.6);
                    border: none;
                    height: 44px;
                    text-align: center;
                    padding: 8px;
                    background: #f5f7fa;
                    white-space: nowrap;

                    @media (max-width: 480px) {
                        font-size: 12px;
                        padding: 6px;
                        height: 36px;
                    }
                }
                td {
                    font-size: 14px;
                    color: #333;
                    border: none;
                    padding: 12px 8px;
                    text-align: center;
                    border-bottom: 1px solid #eee;
                    white-space: nowrap;

                    @media (max-width: 480px) {
                        font-size: 13px;
                        padding: 8px 6px;
                    }
                }
                tbody tr {
                    transition: all 0.2s;
                    position: relative;

                    &:hover {
                        background-color: #f0f6ff;
                        cursor: pointer;
                    }
                    &.selected {
                        background-color: #e6f4ff;
                        &:hover {
                            background-color: #d6ebff;
                        }
                    }
                    &:hover .row-tip {
                        display: block;
                    }

                    .row-tip {
                        display: none;
                        position: absolute;
                        right: -8px;
                        top: 50%;
                        transform: translateY(-50%);
                        background: rgba(0, 0, 0, 0.75);
                        color: white;
                        padding: 4px 8px;
                        border-radius: 4px;
                        font-size: 12px;
                        white-space: nowrap;
                        z-index: 1;
                    }
                }
            }
        }
    }
    .pagination-container {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin: 16px 0;
        padding: 0 24px;
        flex-wrap: wrap;
        gap: 12px;

        @media (max-width: 768px) {
            padding: 0 16px;
            justify-content: center;
        }

        .selected-count {
            font-size: 12px;
            .count {
                color: #00a870;
                margin: 0 5px;
            }
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
        &.primary {
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
    .custom-checkbox {
        width: 16px;
        height: 16px;
        cursor: pointer;
        accent-color: #0052d9;

        &:disabled {
            opacity: 0.6;
            cursor: not-allowed;
        }
    }
    @media (max-width: 600px) {
        .share-panel {
            width: 95vw;
        }
        .panel-header,
        .panel-body,
        .panel-footer {
            padding-left: 12px;
            padding-right: 12px;
        }
    }

    .shared-users-section {
        margin: 0 0 20px;
        padding: 16px;
        background: #f5f7fa;
        border-radius: 8px;

        @media (max-width: 768px) {
            padding: 12px;
            margin-bottom: 16px;
        }

        .section-title {
            font-size: 14px;
            font-weight: 600;
            color: #1a1a1a;
            margin-bottom: 12px;
        }

        .shared-users-list {
            display: flex;
            flex-wrap: wrap;
            gap: 8px;
        }

        .shared-user-tag {
            display: inline-flex;
            align-items: center;
            padding: 4px 12px;
            background: #fff;
            border: 1px solid #e6e8eb;
            border-radius: 16px;
            font-size: 13px;

            @media (max-width: 480px) {
                width: 100%;
                justify-content: space-between;
                padding: 8px 12px;
            }

            .user-name {
                color: #1a1a1a;
                font-weight: 500;
            }

            .user-account {
                color: #666;
                margin-left: 4px;
            }

            &:hover {
                background: #f0f6ff;
                border-color: #d6e4ff;
            }
        }
    }

    .status-tag {
        display: inline-block;
        padding: 2px 8px;
        background: #e6f4ff;
        color: #0052d9;
        border-radius: 4px;
        font-size: 12px;
        font-weight: 500;
    }
</style>
