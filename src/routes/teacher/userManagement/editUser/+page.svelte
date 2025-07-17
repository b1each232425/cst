<script>
    // @ts-nocheck
    import { goto } from "$app/navigation";
    import { onMount } from "svelte";
    import { page } from "$app/stores";
    import { fetchAuthMetadata, sendOperationLog } from "../utils.js";
    import { get } from "svelte/store";
    import { authMetadata } from "$lib/stores/permission";
    import DropdownGray from "$lib/component/DropdownGray.svelte";
    import Title from "$lib/component/Title.svelte";

    // 用户账号 - 从URL参数获取
    let userAccount = $state("");

    // 用户详细信息
    let userInfo = $state(null);

    // 可编辑字段
    let editableFields = $state({
        name: "",
        gender: "",
        phone: "",
        account: "",
        password: "",
        email: "",
        id_card_no: "",
    });

    let selectedRoles = $state([]); // 数字数组

    // 角色元数据
    let user_role_metadata = $state([]);
    let menu_permissions_metadata = $state([]);
    let rolePermissions = $state({}); // { [role_id]: Set<permission_id> }

    // 表单验证状态
    let formErrors = $state({
        name: "",
        gender: "",
        phone: "",
        account: "",
        password: "",
        email: "",
        role: "",
        adminPerm: "",
    });

    // 保存状态
    let saving = $state(false);
    let saveSuccess = $state(false);
    let saveError = $state("");

    // 加载状态
    let loading = $state(true);
    let error = $state(null);

    // 密码显示状态
    let showPassword = $state(false);

    // 切换密码显示状态
    function togglePasswordVisibility() {
        showPassword = !showPassword;
    }

    // 选择性别
    function handleGenderSelect(value) {
        editableFields.gender = value;
    }

    // 状态映射
    const statusMap = {
        "00": "已启用",
        "02": "已停用",
        "04": "已删除",
    };

    // 状态类名映射
    const statusClassMap = {
        "00": "status-enabled",
        "02": "status-disabled",
        "04": "status-deleted",
    };

    // 页面加载时获取角色元数据和用户详情
    onMount(async () => {
        // 权限元数据加载
        if (get(authMetadata).length === 0) {
            let authData = await fetchAuthMetadata();
            user_role_metadata = authData.roles;
            menu_permissions_metadata = authData.menu_permissions;
        } else {
            user_role_metadata = get(authMetadata).roles;
            console.log(user_role_metadata)
            menu_permissions_metadata = get(authMetadata).menu_permissions;
            console.log(menu_permissions_metadata)
        }
        // 从URL参数中获取用户账号
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
            const response = await fetch(
                `/api/user-details?${params.toString()}`,
                {
                    method: "GET",
                    headers: { "Content-Type": "application/json" },
                    credentials: "include",
                },
            );

            if (!response.ok) throw new Error(`请求失败: ${response.status}`);

            const result = await response.json();
            if (result && result.data) {
                userInfo = result.data;

                // 初始化可编辑字段
                editableFields = {
                    name: userInfo.name || "",
                    gender: userInfo.gender || "",
                    phone: userInfo.phone || "",
                    account: userInfo.account || "",
                    password: userInfo.password || "",
                    email: userInfo.email || "",
                    id_card_no: userInfo.id_card_no || "",
                };
                // 初始化角色
                selectedRoles = Array.isArray(userInfo.roles)
                    ? userInfo.roles
                    : [];
                // 初始化普通管理员权限
                if (Array.isArray(userInfo.role_permissions)) {
                    const adminPerm = userInfo.role_permissions.find(rp => rp.role_id === 3);
                    if (adminPerm) {
                        // 反向推导禁用的模块
                        const allPerms = user_role_metadata.find(r => r.id === 3)?.default_permissions || [];
                        const enabled = new Set(adminPerm.permissions || []);
                        const disabled = allPerms.filter(id => !enabled.has(id));
                        rolePermissions = {
                            ...rolePermissions,
                            3: new Set(disabled),
                        };
                    }
                }
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

    // 验证表单
    function validateForm() {
        let isValid = true;
        // 重置错误信息
        formErrors = {
            name: "",
            gender: "",
            phone: "",
            account: "",
            password: "",
            email: "",
            role: "",
            adminPerm: "",
        };
        // 账号必填
        if (!editableFields.account.trim()) {
            formErrors.account = "账号不能为空";
            isValid = false;
        }
        // 密码必填
        if (!editableFields.password.trim()) {
            formErrors.password = "密码不能为空";
            isValid = false;
        }
        // 角色必填
        if (!selectedRoles.length) {
            formErrors.role = "请至少选择一个角色";
            isValid = false;
        }
        // 普通管理员必须至少选一个模块
        if (selectedRoles.includes(3)) {
            const allPermIds = user_role_metadata.find(r => r.id === 3)?.default_permissions || [];
            if (rolePermissions[3] && rolePermissions[3].size === allPermIds.length) {
                formErrors.adminPerm = "请至少选择一个模块权限";
                isValid = false;
            }
        }
        // 姓名填写了才校验长度
        if (editableFields.name && (editableFields.name.length < 1 || editableFields.name.length > 20)) {
            formErrors.name = "姓名长度需为1-20个字符";
            isValid = false;
        }
        // 性别填写了才校验
        if (editableFields.gender && !["男", "女"].includes(editableFields.gender)) {
            formErrors.gender = "性别格式不正确";
            isValid = false;
        }
        // 手机号填写了才校验
        if (editableFields.phone && !/^1[3-9]\d{9}$/.test(editableFields.phone)) {
            formErrors.phone = "请输入正确的手机号码";
            isValid = false;
        }
        // 邮箱填写了才校验
        if (editableFields.email && !/^\S+@\S+\.\S+$/.test(editableFields.email)) {
            formErrors.email = "请输入正确的邮箱地址";
            isValid = false;
        }
        return isValid;
    }

    /**
     * 检查表单数据是否发生变化，并返回变更字段列表
     * @returns {{ changed: boolean, changedFields: string[] }}
     */
    function getChangedFields() {
        const changedFields = [];

        // 基本字段比较
        if (editableFields.name?.trim() !== (userInfo.name || "")?.trim()) {
            changedFields.push("name");
        }

        if (editableFields.gender !== (userInfo.gender || "")) {
            changedFields.push("gender");
        }

        if (editableFields.phone?.trim() !== (userInfo.phone || "")?.trim()) {
            changedFields.push("phone");
        }

        if (editableFields.email?.trim() !== (userInfo.email || "")?.trim()) {
            changedFields.push("email");
        }

        if (editableFields.password && editableFields.password.trim() !== (userInfo.password || "")?.trim()) {
            console.log()
            changedFields.push("password");
        }

        if (editableFields.id_card_no?.trim() !== (userInfo.id_card_no || "")?.trim()) {
            changedFields.push("id_card_no");
        }

        // 角色变更
        const originalRoles = Array.isArray(userInfo.roles) ? userInfo.roles : [];
        const originalRolesSet = new Set(originalRoles);
        const selectedRolesSet = new Set(selectedRoles);

        if (
            originalRoles.length !== selectedRoles.length ||
            [...originalRolesSet].some(role => !selectedRolesSet.has(role)) ||
            [...selectedRolesSet].some(role => !originalRolesSet.has(role))
        ) {
            changedFields.push("roles");
        }

        // 权限变更（仅当选中普通管理员）
        if (selectedRoles.includes(3)) {
            let originalPermissions = new Set();
            if (Array.isArray(userInfo.role_permissions)) {
                const adminPerm = userInfo.role_permissions.find(rp => rp.role_id === 3);
                if (adminPerm && Array.isArray(adminPerm.permissions)) {
                    originalPermissions = new Set(adminPerm.permissions);
                }
            }

            const currentPermissions = rolePermissions[3] || new Set();

            if (
                originalPermissions.size !== currentPermissions.size ||
                [...originalPermissions].some(p => !currentPermissions.has(p)) ||
                [...currentPermissions].some(p => !originalPermissions.has(p))
            ) {
                changedFields.push("permissions");
            }
        }

        return {
            changed: changedFields.length > 0,
            changedFields,
        };
    }

    // 保存用户信息
    async function saveUserInfo() {
        if (!validateForm()) {
            return;
        }

        const { changed, changedFields } = getChangedFields();
        if (changed) {
            console.log("表单发生变更，字段如下:", changedFields.join(", "));
        } else {
            // 如果没有变化，显示提示并返回
            saveSuccess = true;
            setTimeout(() => {
                goto("/teacher/userManagement");
            }, 1500);
            return;
        }

        saving = true;
        saveError = "";
        saveSuccess = false;

        try {
            // 构造后端需要的字段
            const data = {
                id: userInfo.id,
                account: editableFields.account,
                name: editableFields.name,
                gender: editableFields.gender,
                phone: editableFields.phone,
                email: editableFields.email,
                category: userInfo.category || "",
                status: userInfo.status || "",
                id_card_no: editableFields.id_card_no || userInfo.id_card_no || "",
                exam_card: userInfo.exam_card || "",
                passwd: editableFields.password,
                role_permissions: buildRolePermissions(),
            };

            // 移除值为''、undefined、null的字段
            Object.keys(data).forEach(key => {
                if (data[key] === '' || data[key] === undefined || data[key] === null) {
                    delete data[key];
                }
            });

            const response = await fetch("/api/user", {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                },
                credentials: "include",
                body: JSON.stringify({ data }),
            });

            if (!response.ok) {
                console.error("保存失败:", response.statusText);
                throw new Error(`保存失败: ${response.status}`);
            }

            const result = await response.json();
            if (result && result.status === 0) {
                saveSuccess = true;

                // 记录操作日志
                sendOperationLog(`编辑了用户 ${userInfo.account} 的以下信息 (${changedFields.join(", ")})`);

                setTimeout(() => {
                    goto("/teacher/userManagement");
                }, 1500);
            } else {
                saveError = result.message || "保存失败";
            }
        } catch (err) {
            console.error("保存用户信息失败:", err);
            saveError = err.message;
        } finally {
            saving = false;
        }
    }

    // 格式化日期时间
    function formatDateTime(timestamp) {
        if (!timestamp) return "-";

        // 判断是否为数字字符串，如果是则转换为数字
        if (typeof timestamp === "string" && !isNaN(Number(timestamp))) {
            timestamp = Number(timestamp);
        }

        const date = new Date(timestamp);

        // 检查是否为有效日期
        if (isNaN(date.getTime())) return "-";

        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, "0");
        const day = String(date.getDate()).padStart(2, "0");
        const hours = String(date.getHours()).padStart(2, "0");
        const minutes = String(date.getMinutes()).padStart(2, "0");
        const seconds = String(date.getSeconds()).padStart(2, "0");

        return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
    }

    // 获取状态文本
    function getStatusText(status) {
        return statusMap[status] || "未知状态";
    }

    // 获取状态类名
    function getStatusClass(status) {
        return statusClassMap[status] || "";
    }

    function handleRoleToggle(roleId, checked) {
        if (checked) {
            if (!selectedRoles.includes(roleId)) {
                selectedRoles = [...selectedRoles, roleId];
                if (roleId === 3) {
                    // 如果是第一次勾选普通管理员且没有权限记录，则默认全选（禁用权限为空）
                    if (!rolePermissions[3]) {
                        rolePermissions = {
                            ...rolePermissions,
                            3: new Set(),
                        };
                    }
                }
            }
        } else {
            selectedRoles = selectedRoles.filter((id) => id !== roleId);
            // 不清空rolePermissions[3]，保留已选模块权限
        }
    }

    function handlePermissionToggle(roleId, permissionId) {
        if (roleId !== 3) return;
        const set = new Set(rolePermissions[roleId] || []);
        if (set.has(permissionId)) {
            set.delete(permissionId);
        } else {
            set.add(permissionId);
        }
        rolePermissions = { ...rolePermissions, [roleId]: set };
    }

    function buildRolePermissions() {
        
        return selectedRoles
            .filter((roleId) => roleId !== 2)
            .map((roleId) => {
                const role = user_role_metadata.find((r) => r.id === roleId);
                if (roleId === 3) {
                    // permissions为被禁用的模块id数组
                    return {
                        role_id: 3,
                        permissions: Array.from(rolePermissions[3] || []),
                    };
                } else {  
                    return {
                        role_id: roleId,
                    };
                }
            });
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
                <!-- 账号 -->
                <div class="form-item">
                    <div class="form-label">
                        <span class="required-mark">*</span>
                        <span>账号</span>
                    </div>
                    <div class="form-input-container">
                        <input
                            type="text"
                            class="form-input {formErrors.account
                                ? 'input-error'
                                : ''}"
                            bind:value={editableFields.account}
                            placeholder="请输入账号"
                            readonly
                            disabled
                        />
                        {#if formErrors.account}
                            <div class="error-message">
                                {formErrors.account}
                            </div>
                        {/if}
                    </div>
                </div>

                <!-- 密码 -->
                <div class="form-item">
                    <div class="form-label">
                        <span class="required-mark">*</span>
                        <span>密码</span>
                    </div>
                    <div class="form-input-container">
                        <div
                            class="password-input-container password-container"
                        >
                            <input
                                type={showPassword ? "text" : "password"}
                                class="form-input {formErrors.password
                                    ? 'input-error'
                                    : ''}"
                                bind:value={editableFields.password}
                                placeholder="请输入密码"
                            />
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
                        {#if formErrors.password}
                            <div class="error-message">
                                {formErrors.password}
                            </div>
                        {/if}
                    </div>
                </div>
                <!-- 姓名 -->
                <div class="form-item">
                    <div class="form-label">
                        <span>姓名</span>
                    </div>
                    <div class="form-input-container">
                        <input
                            type="text"
                            class="form-input {formErrors.name
                                ? 'input-error'
                                : ''}"
                            bind:value={editableFields.name}
                            placeholder="请输入姓名"
                        />
                        {#if formErrors.name}
                            <div class="error-message">
                                {formErrors.name}
                            </div>
                        {/if}
                    </div>
                </div>

                <!-- 性别 -->
                <div class="form-item">
                    <div class="form-label">
                        <span>性别</span>
                    </div>
                    <div class="form-input-container">
                        <div class="dropdown-container">
                            <DropdownGray
                            selected={editableFields.gender}
                            options={[
                                { label: "男", value: "男" },
                                { label: "女", value: "女" },
                            ]}
                            placeholder="请选择性别"
                            selectOptionFunc={handleGenderSelect}
                        />
                        </div>
                        {#if formErrors.gender}
                            <div class="error-message">{formErrors.gender}</div>
                        {/if}
                    </div>
                </div>
                <!-- 身份证号 -->
                <div class="form-item">
                    <div class="form-label">
                        <span>身份证号</span>
                    </div>
                    <div class="form-input-container">
                        <input
                            type="text"
                            class="form-input {formErrors.id_card_no
                                ? 'input-error'
                                : ''}"
                            bind:value={editableFields.id_card_no}
                            placeholder="请输入身份证号"
                        />
                        {#if formErrors.id_card_no}
                            <div class="error-message">
                                {formErrors.id_card_no}
                            </div>
                        {/if}
                    </div>
                </div>
                <!-- 手机号 -->
                <div class="form-item">
                    <div class="form-label">
                        <span>手机号</span>
                    </div>
                    <div class="form-input-container">
                        <input
                            type="tel"
                            class="form-input {formErrors.phone
                                ? 'input-error'
                                : ''}"
                            bind:value={editableFields.phone}
                            placeholder="请输入手机号"
                        />
                        {#if formErrors.phone}
                            <div class="error-message">{formErrors.phone}</div>
                        {/if}
                    </div>
                </div>

                <!-- 邮箱 -->
                <div class="form-item">
                    <div class="form-label">
                        <span>邮箱</span>
                    </div>
                    <div class="form-input-container">
                        <input
                            type="email"
                            class="form-input {formErrors.email
                                ? 'input-error'
                                : ''}"
                            bind:value={editableFields.email}
                            placeholder="请输入邮箱"
                        />
                        {#if formErrors.email}
                            <div class="error-message">{formErrors.email}</div>
                        {/if}
                    </div>
                </div>

                <!-- 创建者 -->
                <div class="form-item">
                    <div class="form-label">
                        <span>创建者</span>
                    </div>
                    <div class="form-value">
                        {userInfo.creator_name
                            ?userInfo.creator_name:"-"}
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

                <!-- 更新时间 -->
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

                <!-- 分类 -->
                <div class="form-item">
                    <div class="form-label">
                        <span>分类</span>
                    </div>
                    <div class="form-value">
                        {userInfo.category
                            ? userInfo.category
                            : "-"}
                    </div>
                </div>
            </div>
        </div>

        <!-- 授权信息部分-->
        <div class="section-container">
            <Title title="授权信息" />

            <div class="auth-form">
                <!-- 角色多选 -->
                <div class="form-item" style="position: relative; min-height: 48px;">
                    <div class="form-label">角色</div>
                    <div class="form-checkbox-and-error">
                        <div class="form-checkbox-group">
                            {#each user_role_metadata.filter((role) => role.id !== 2) as role}
                                <label class="checkbox-label">
                                    <input
                                        type="checkbox"
                                        class="checkbox-item"
                                        checked={selectedRoles.includes(role.id)}
                                        onchange={(e) =>
                                            handleRoleToggle(
                                                role.id,
                                                e.target.checked,
                                            )}
                                    />
                                    <span>{role.description}</span>
                                </label>
                            {/each}
                        </div>
                        {#if formErrors.role}
                            <div class="error-message error-below-checkbox">{formErrors.role}</div>
                        {/if}
                    </div>
                </div>
                <!-- 仅普通管理员显示模块权限可编辑 -->
                {#if selectedRoles.includes(3)}
                    <div class="form-item" style="position: relative; min-height: 48px;">
                        <div class="form-label">
                            {user_role_metadata.find((r) => r.id === 3)?.description}模块权限
                        </div>
                        <div class="form-checkbox-and-error">
                            <div class="form-checkbox-group">
                                {#each user_role_metadata.find((r) => r.id === 3)?.default_permissions as permId}
                                    {#if menu_permissions_metadata.find((p) => p.id === permId)}
                                        <label class="checkbox-label">
                                            <input
                                                type="checkbox"
                                                class="checkbox-item"
                                                checked={!rolePermissions[3]?.has(
                                                    permId,
                                                )}
                                                onchange={() =>
                                                    handlePermissionToggle(
                                                        3,
                                                        permId,
                                                    )}
                                            />
                                            <span
                                                >{menu_permissions_metadata.find(
                                                    (p) => p.id === permId,
                                                ).description}</span
                                            >
                                        </label>
                                    {/if}
                                {/each}
                            </div>
                            {#if formErrors.adminPerm}
                                <div class="error-message error-below-checkbox">{formErrors.adminPerm}</div>
                            {/if}
                        </div>
                    </div>
                {/if}
            </div>
        </div>

        <!-- 按钮区域 -->
        <div class="button-container">
            <button class="back-button" onclick={goBack}>返回</button>
            <button
                class="save-button"
                onclick={saveUserInfo}
                disabled={saving}
            >
                {#if saving}
                    保存中...
                {:else}
                    保存
                {/if}
            </button>
        </div>

        <!-- 保存结果提示 -->
        {#if saveSuccess}
            <div class="save-success-message">保存成功！即将返回列表页...</div>
        {/if}

        {#if saveError}
            <div class="save-error-message">{saveError}</div>
        {/if}
    {/if}
</div>

<style lang="scss">
    $border-color: #ddd;
    /* 状态指示器样式 */
    .status-indicator {
        display: flex;
        align-items: center;
        font-size: 14px;
        color: #0052d9;
    }

    @keyframes spin {
        0% {
            transform: rotate(0deg);
        }
        100% {
            transform: rotate(360deg);
        }
    }

    .error-indicator {
        font-size: 14px;
        color: #e34d59;
    }

    /* 状态指示器样式 */
    .status-indicator {
        display: flex;
        align-items: center;
        font-size: 14px;
        color: #0052d9;
    }

    @keyframes spin {
        0% {
            transform: rotate(0deg);
        }
        100% {
            transform: rotate(360deg);
        }
    }

    .error-indicator {
        font-size: 14px;
        color: #e34d59;
    }
    $primary-color: #0052d9;
    $gray-color: rgba(0, 0, 0, 0.6);
    $border-color: #ddd;

    // 表单输入样式
    .form-input-container {
        position: relative;
        flex: 1;
        display: flex;
        flex-direction: column;
    }

    .form-input {
        height: 36px;
        padding: 0 12px;
        border: 1px solid #ddd;
        border-radius: 4px;
        font-size: 14px;
        width: 60%;

        &:focus {
            border-color: $primary-color;
            outline: none;
            box-shadow: 0 0 0 2px rgba(0, 82, 217, 0.2);
        }

        &.input-error {
            border-color: #e34d59;
        }
    }

    .error-message {
        color: #e34d59;
        font-size: 12px;
        position: absolute;
        left: 0;
        top: 38px;
        line-height: 1.4;
    }

    .required-mark {
        color: #e34d59;
        margin-left: 2px;
    }

    .password-input-container {
        position: relative;
        width: 100%;
    }

    // 保存按钮样式
    .save-button {
        background-color: $primary-color;
        color: white;
        border: none;
        border-radius: 4px;
        padding: 8px 24px;
        font-size: 14px;
        cursor: pointer;
        transition: background-color 0.3s;
        margin-left: 16px;
        width: 100px;

        &:disabled {
            background-color: #ccc;
            cursor: not-allowed;
        }
    }

    // 保存结果提示
    .save-success-message {
        position: fixed;
        top: 20px;
        left: 50%;
        transform: translateX(-50%);
        background-color: #52c41a;
        color: white;
        padding: 10px 20px;
        border-radius: 4px;
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
        z-index: 1000;
    }

    .save-error-message {
        position: fixed;
        top: 20px;
        left: 50%;
        transform: translateX(-50%);
        background-color: #e34d59;
        color: white;
        padding: 10px 20px;
        border-radius: 4px;
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
        z-index: 1000;
    }
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
            flex: 1 1 calc(50% - 10px);
            width: calc(70% - 10px);
            min-width: 300px;
            display: inline-flex;
            align-items: flex-start;
            .form-checkbox-and-error {
                display: flex;
                flex-direction: column;
                flex: 1;
            }
            .error-below-checkbox {
                margin-top: 4px;
                margin-left: 0;
                color: #e34d59;
                font-size: 13px;
                position: relative;
                left: 0;
                top: 0;
                text-align: left;
            }
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

        .big-title-right {
            display: flex;
            align-items: center;

            .status-indicator {
                display: flex;
                align-items: center;

                .loading-spinner {
                    width: 16px;
                    height: 16px;
                    border: 2px solid rgba(0, 82, 217, 0.3);
                    border-radius: 50%;
                    border-top-color: $primary-color;
                    animation: spin 1s linear infinite;
                    margin-right: 8px;
                }

                span {
                    font-size: 14px;
                    color: $gray-color;
                }
            }

            .error-indicator {
                color: #e34d59;
                font-size: 14px;
            }

            @keyframes spin {
                to {
                    transform: rotate(360deg);
                }
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

        .dropdown-container {
            width: 20%;
            height: 100%;
        }

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
        width: 50%;

        &.password-field {
            letter-spacing: 2px;
            position: relative;
        }
    }

    .password-container {
        display: flex;
        align-items: center;

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
        gap: 10px;
        margin-top: 10px;
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
