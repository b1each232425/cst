<script>
    // @ts-nocheck
    import { goto } from "$app/navigation";
    import { onMount } from "svelte";
    import { page } from "$app/stores";
    import { authMetadata } from "$lib/stores/permission";
    import { get } from "svelte/store";
    import { fetchAuthMetadata } from "../utils.js";
    import Title from "$lib/component/Title.svelte";

    // 用户权限元数据
    let user_role_metadata = $state([]);
    let menu_permissions_metadata = $state([]);
    // 用户账号 - 从URL参数获取
    let userAccount = $state("");

    // 用户详细信息
    let userInfo = $state(null);

    // 加载状态
    let loading = $state(true);
    let error = $state(null);

    // 密码显示状态
    let showPassword = $state(false);

    // 切换密码显示状态
    function togglePasswordVisibility() {
        showPassword = !showPassword;
    }

    // 状态映射
    const statusMap = {
        "00": "已启用",
        "02": "已停用",
        "04": "已删除",
    };
    const statusClassMap = {
        "00": "status-enabled",
        "02": "status-disabled",
        "04": "status-deleted",
    };

    // 角色描述辅助函数
    function getRoleDescriptionsByIds(ids) {
        if (!Array.isArray(ids)) return '';
        return ids
            .map(id => {
                const found = user_role_metadata.find(r => r.id === id);
                return found ? found.description : id;
            })
            .join(', ');
    }

    // 在组件挂载时获取用户详情和角色元数据
    onMount(async () => {
       if(get(authMetadata).length === 0){
        let authData = await fetchAuthMetadata()
        user_role_metadata = authData.roles
        menu_permissions_metadata = authData.menu_permissions
       }else{
        user_role_metadata = get(authMetadata).roles
        menu_permissions_metadata = get(authMetadata).menu_permissions
       }

        // 获取用户账号
        const urlParams = new URLSearchParams($page.url.search);
        userAccount = urlParams.get("account");
        if (!userAccount) {
            error = "未提供用户账号";
            loading = false;
            return;
        }
        await fetchUserDetail();
    });

    // 获取用户详情
    async function fetchUserDetail() {
        loading = true;
        error = null;
        try {
            const params = new URLSearchParams({ account: userAccount });
            const response = await fetch(`/api/user-details?${params.toString()}`, {
                method: "GET",
                headers: { "Content-Type": "application/json" },
                credentials: "include",
            });
            if (!response.ok) throw new Error(`请求失败: ${response.status}`);
            const result = await response.json();
            if (result && result.data) {
                userInfo = result.data;
            } else {
                error = "未找到用户信息";
            }
        } catch (err) {
            console.error("获取用户详情失败:", err);
            error = err.message;
        } finally {
            loading = false;
        }
    }

    // 返回用户管理页面
    function goBack() {
        goto("/teacher/userManagement");
    }

    // 格式化日期时间
    function formatDateTime(timestamp) {
        if (!timestamp) return "-";
        if (typeof timestamp === "string" && !isNaN(Number(timestamp))) {
            timestamp = Number(timestamp);
        }
        const date = new Date(timestamp);
        if (isNaN(date.getTime())) return "-";
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, "0");
        const day = String(date.getDate()).padStart(2, "0");
        const hours = String(date.getHours()).padStart(2, "0");
        const minutes = String(date.getMinutes()).padStart(2, "0");
        const seconds = String(date.getSeconds()).padStart(2, "0");
        return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
    }
    function getStatusText(status) {
        return statusMap[status] || "未知状态";
    }
    function getStatusClass(status) {
        return statusClassMap[status] || "";
    }
</script>

<div class="user-detail-container">
    {#if loading}
        <div class="loading-container">
            <div class="loading-spinner"></div>
            <span>加载中...</span>
        </div>
    {:else if error}
        <div class="error-container">
            <div class="error-icon">!</div>
            <span>{error}</span>
            <button class="back-button" onclick={goBack}>返回</button>
        </div>
    {:else if userInfo}
        <!-- 基本信息部分 -->
        <div class="section-container">
            <Title title="基本信息" />

            <div class="basic-info-container">
                <!-- 姓名 -->
                <div class="form-item">
                    <div class="form-label">
                        <span>姓名</span>
                    </div>
                    <div class="form-value">
                        {userInfo.name || "-"}
                    </div>
                </div>
                <!-- 性别 -->
                <div class="form-item">
                    <div class="form-label">
                        <span>性别</span>
                    </div>
                    <div class="form-value">
                        {userInfo.gender || "-"}
                    </div>
                </div>
                <!-- 账号 -->
                <div class="form-item">
                    <div class="form-label">
                        <span>账号</span>
                    </div>
                    <div class="form-value">
                        {userInfo.account || "-"}
                    </div>
                </div>
                <!-- 密码 -->
                <div class="form-item">
                    <div class="form-label">
                        <span>密码</span>
                    </div>
                    <div class="password-container">
                        <div class="form-value password-field">
                            {#if showPassword}
                                {userInfo.password || "••••••••"}
                            {:else}
                                ••••••••
                            {/if}
                        </div>
                        <button
                            class="password-toggle"
                            onclick={togglePasswordVisibility}
                            title={showPassword ? "隐藏密码" : "显示密码"}
                        >
                            <img
                                src="/teacher_mgt/{showPassword
                                    ? 'hide.svg'
                                    : 'show.svg'}"
                                alt="{showPassword ? '隐藏' : '显示'}密码"
                            />
                        </button>
                    </div>
                </div>
                <!-- 身份证号 -->
                <div class="form-item">
                    <div class="form-label">
                        <span>身份证号</span>
                    </div>
                    <div class="form-value">
                        {userInfo.id_card_no || "-"}
                    </div>
                </div>
                <!-- 手机号 -->
                <div class="form-item">
                    <div class="form-label">
                        <span>手机号</span>
                    </div>
                    <div class="form-value">
                        {userInfo.phone || "-"}
                    </div>
                </div>
                <!-- 邮箱 -->
                <div class="form-item">
                    <div class="form-label">
                        <span>邮箱</span>
                    </div>
                    <div class="form-value">
                        {userInfo.email || "-"}
                    </div>
                </div>
                <!-- 创建者-->
                <div class="form-item">
                    <div class="form-label">
                        <span>创建者</span>
                    </div>
                    <div class="form-value">
                        {userInfo.creator_name || "-"}
                    </div>
                </div>
                <!-- 创建时间 -->
                <div class="form-item">
                    <div class="form-label">
                        <span>创建时间</span>
                    </div>
                    <div class="form-value">
                        {userInfo.create_time
                            ? formatDateTime(userInfo.create_time)
                            : "-"}
                    </div>
                </div>
                <!-- 更新时间-->
                <div class="form-item">
                    <div class="form-label">
                        <span>更新时间</span>
                    </div>
                    <div class="form-value">
                        {userInfo.update_time
                            ? formatDateTime(userInfo.update_time)
                            : "-"}
                    </div>
                </div>
                <!-- 最近登录时间 -->
                <div class="form-item">
                    <div class="form-label">
                        <span>最近登录</span>
                    </div>
                    <div class="form-value">
                        {userInfo.logon_time
                            ? formatDateTime(userInfo.logon_time)
                            : "-"}
                    </div>
                </div>
                <!-- 状态 -->
                <div class="form-item">
                    <div class="form-label">
                        <span>状态</span>
                    </div>
                    <div class="form-value">
                        <span
                            class="status-badge {getStatusClass(
                                userInfo.status,
                            )}"
                        >
                            {getStatusText(userInfo.status)}
                        </span>
                    </div>
                </div>
                <!-- 分类-->
                <div class="form-item">
                    <div class="form-label">
                        <span>分类</span>
                    </div>
                    <div class="form-value">
                        {userInfo.category || "-"}
                    </div>
                </div>
            </div>

            <!-- 授权信息部分-->
            <div class="section-container">
                <Title title="授权信息" />

                <div class="auth-form">
                    <!-- 角色多选只读 -->
                    <div class="form-item">
                        <div class="form-label">角色</div>
                        <div class="form-checkbox-group">
                            {#each user_role_metadata as role}
                                <label class="checkbox-label">
                                    <input
                                        type="checkbox"
                                        class="checkbox-item"
                                        disabled
                                        checked={userInfo.roles && userInfo.roles.includes(role.id)}
                                    />
                                    <span>{role.description}</span>
                                </label>
                            {/each}
                        </div>
                    </div>
                    <!-- 普通管理员模块权限（仅当有普通管理员角色时显示） -->
                    {#if userInfo.roles && userInfo.roles.includes(3)}
                        <div class="form-item">
                            <div class="form-label">{user_role_metadata.find(r => r.id === 3)?.description}模块权限</div>
                            <div class="form-checkbox-group">
                                {#each user_role_metadata.find(r => r.id === 3)?.default_permissions as permId}
                                    <label class="checkbox-label">
                                        <input
                                            type="checkbox"
                                            class="checkbox-item"
                                            disabled
                                            checked={userInfo.role_permissions && userInfo.role_permissions.find(rp => rp.role_id === 3)?.permissions.includes(permId)}
                                        />
                                        <span>{menu_permissions_metadata.find(p => p.id === permId)?.description || permId}</span>
                                    </label>
                                {/each}
                            </div>
                        </div>
                    {/if}
                </div>
            </div>
        </div>

        <!-- 按钮区域 -->
        <div class="button-container">
            <button class="back-button" onclick={goBack}>返回</button>
        </div>
    {/if}
</div>

<style lang="scss">
    $primary-color: #0052d9;
    $gray-color: rgba(0, 0, 0, 0.6);
    $border-color: #ddd;

    .user-detail-container {
        position: relative;
        background-color: white;
        display: flex;
        flex-direction: column;
        width: 100%;
        height: 100%;
        overflow-y: auto;
        padding: 20px 20px 40px 20px;
        min-width: 800px;

        @media (max-width: 1200px) {
            min-width: 700px;
        }

        @media (max-width: 768px) {
            min-width: 500px;
        }
    }

    .loading-container,
    .error-container {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        height: 300px;
        gap: 20px;
    }

    .loading-spinner {
        width: 40px;
        height: 40px;
        border: 4px solid rgba(0, 82, 217, 0.3);
        border-radius: 50%;
        border-top-color: $primary-color;
        animation: spin 1s linear infinite;
    }

    .error-icon {
        width: 40px;
        height: 40px;
        border-radius: 50%;
        background-color: #e34d59;
        color: white;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 24px;
        font-weight: bold;
    }

    @keyframes spin {
        to {
            transform: rotate(360deg);
        }
    }

    .section-container {
        margin-bottom: 30px;
    }

    .big-title {
        display: flex;
        align-items: center;
        height: 60px;
        min-height: 60px;
        padding: 0 32px;
        gap: 20px;

        .big-title-left {
            display: flex;
            align-items: center;

            .big-title-icon {
                width: 7px;
                height: 24px;
                background-color: $primary-color;
            }

            .big-title-text {
                font-size: 20px;
                font-weight: bold;
                padding-left: 2px;
            }
        }
    }

    .id-card-info-container {
        display: flex;
        flex-direction: column;
        gap: 20px;
        width: 90%;
        max-width: 1200px;

        @media (max-width: 1200px) {
            padding: 20px 0 0 20px;
        }

        @media (max-width: 768px) {
            padding: 20px 0 0 10px;
        }
    }

    .info-row {
        display: flex;
        flex-wrap: wrap;
        gap: 20px;
        width: 100%; /* Use full width of the container */

        @media (max-width: 1200px) {
            gap: 20px;
        }

        @media (max-width: 992px) {
            flex-direction: column;
            width: 100%;
            max-width: 600px;
        }

        @media (max-width: 768px) {
            gap: 15px;
        }

        /* Ensure form items in this row have the same styling as basic info */
        .form-item {
            width: calc(50% - 10px); /* Same width as in basic info */

            @media (max-width: 992px) {
                width: 100%;
            }
        }
    }

    .basic-info-container {
        display: flex;
        flex-wrap: wrap;
        gap: 20px;
        padding: 20px 0 0 40px;
        width: 90%;
        max-width: 1200px;

        @media (max-width: 1200px) {
            padding: 20px 0 0 20px;
        }

        @media (max-width: 992px) {
            flex-direction: column;
            width: 100%;
            max-width: 600px;
        }

        @media (max-width: 768px) {
            padding: 20px 0 0 10px;
        }
    }

    .auth-form {
        display: flex;
        gap: 20px;
        padding: 20px 0 0 40px;
        flex-direction: column;
        width: 90%;
        max-width: 1200px;

        @media (max-width: 1200px) {
            padding: 20px 0 0 20px;
        }

        @media (max-width: 992px) {
            flex-direction: column;
            width: 100%;
            max-width: 600px;
        }

        @media (max-width: 768px) {
            padding: 20px 0 0 10px;
        }

        .form-item {
            width: calc(70% - 10px);
            min-width: 300px;
            display: inline-flex;
            align-items: flex-start;
        }
        .form-label {
            width: 130px;
            text-align: right;
            font-size: 14px;
            color: $gray-color;
            margin-right: 10px;
            white-space: nowrap;
            flex-shrink: 0; /* Prevent label from shrinking */

            @media (max-width: 768px) {
                width: 90px;
            }

            .required-mark {
                color: red;
                margin-right: 4px;
            }
        }
        .form-checkbox-group {
            display: flex;
            flex-wrap: wrap;
            gap: 18px 32px;
            align-items: center;
        }
        .checkbox-item {
            width: 16px;
            height: 16px;
            cursor: pointer;
            vertical-align: middle;
            accent-color: #0052d9;
        }
        .checkbox-label {
            display: flex;
            align-items: center;
            font-size: 14px;
            cursor: pointer;
            input[type="checkbox"] {
                margin-right: 6px;
                accent-color: $primary-color;
            }
        }
    }

    .form-item {
        display: flex;
        align-items: center;
        width: calc(50% - 10px); /* 50% width minus half the gap */
        min-width: 250px;
        margin-bottom: 5px; /* Add a small margin for better spacing */

        @media (max-width: 992px) {
            width: 100%;
        }

        @media (max-width: 768px) {
            width: 100%;
            min-width: auto;
        }
    }

    .form-label {
        width: 90px;
        text-align: right;
        font-size: 14px;
        color: $gray-color;
        margin-right: 10px;
        white-space: nowrap;
        flex-shrink: 0; /* Prevent label from shrinking */

        @media (max-width: 768px) {
            width: 90px;
        }
    }

    .form-value {
        min-width: 150px;
        height: 32px;
        line-height: 32px;
        font-size: 14px;
        color: #333;
        padding: 0 10px;
        background-color: #f9f9f9;
        border-radius: 3px;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
        width: 60%;

        &.password-field {
            letter-spacing: 2px;
            position: relative;
        }
    }

    .password-container {
        display: flex;
        align-items: center;
        width: 60%;

        .form-value {
            width: 100%;
            margin-right: 5px;
        }

        .password-toggle {
            background: none;
            border: none;
            cursor: pointer;
            padding: 0;
            margin-left: 5px;
            display: flex;
            align-items: center;
            justify-content: center;
            flex-shrink: 0;

            img {
                width: 20px;
                height: 20px;
                opacity: 0.6;
                transition: opacity 0.2s;
            }

            &:hover img {
                opacity: 1;
            }
        }
    }

    .button-container {
        display: flex;
        justify-content: center;
        gap: 20px;
        margin-top: 40px;
    }

    .back-button {
        width: 100px;
        height: 36px;
        border-radius: 3px;
        font-size: 14px;
        cursor: pointer;
        background-color: $primary-color;
        color: white;
        border: none;
    }

    .close-button {
        position: absolute;
        top: 10px;
        right: 10px;
        width: 30px;
        height: 30px;
        border-radius: 50%;
        background-color: rgba(0, 0, 0, 0.5);
        color: white;
        border: none;
        font-size: 20px;
        line-height: 1;
        cursor: pointer;
        display: flex;
        justify-content: center;
        align-items: center;
        transition: background-color 0.2s ease;

        &:hover {
            background-color: rgba(0, 0, 0, 0.7);
        }
    }

    /* 状态标签样式 */
    .status-badge {
        display: inline-block;
        border-radius: 10px;
        font-size: 12px;
        font-weight: 500;
        text-align: center;
    }

    .status-enabled {
        color: #00b42a;
    }

    .status-disabled {
        color: #e34d59;
    }

    .status-deleted {
        background-color: rgba(0, 0, 0, 0.1);
        color: rgba(0, 0, 0, 0.5);
    }
</style>
