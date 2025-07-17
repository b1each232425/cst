<script>
    // @ts-nocheck
    import { goto } from "$app/navigation";
    import DropdownGray from "$lib/component/DropdownGray.svelte";
    import { onMount } from "svelte";
    import { fetchAuthMetadata, sendOperationLog } from "../utils.js";
    import { get } from "svelte/store";
    import { authMetadata } from "$lib/stores/permission";
    import ActionToast from "$lib/component/ActionToast.svelte";
    import Title from "$lib/component/Title.svelte";

    // 基本信息相关状态
    let account = $state('');
    let password = $state("");
    let email = $state("");
    let phone = $state("");
    let selectedRoles = $state([]);

    // 角色元数据
    let user_role_metadata = $state([]);
    let menu_permissions_metadata = $state([]);

    // 角色与权限选择相关状态
    let rolePermissions = $state({}); // { [role_id]: Set<permission_id> }

    // 表单错误状态
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

    // ActionToast 组件引用
    let actionToast;

    /**
     * 获取新账号
     */
    async function fetchNewAccount() {
        try {
            const response = await fetch('/api/new-account', {
                method: 'GET',
                credentials: 'include'
            });

            if (response.ok) {
                const result = await response.json();
                if (result.data) {
                    account = result.data;
                } else {
                    console.error('获取新账号失败：响应数据格式错误');
                    alert('获取新账号失败，请刷新页面重试');
                }
            } else {
                console.error('获取新账号失败：', response.status);
                alert('获取新账号失败，请刷新页面重试');
            }
        } catch (error) {
            console.error('获取新账号出错：', error);
            alert('获取新账号出错，请刷新页面重试');
        }
    }

    // 页面加载时获取新账号
    onMount(() => {
        fetchNewAccount();
    });

    // 身份证识别结果
    let name = $state("");
    let gender = $state("男");

    function handleGenderSelect(value) {
        gender = value;
    }

    // 页面加载时获取角色元数据
    onMount(async() => {
        if(get(authMetadata).length === 0){
            let authData = await fetchAuthMetadata()
            user_role_metadata = authData.roles
            menu_permissions_metadata = authData.menu_permissions
        }else{
            user_role_metadata = get(authMetadata).roles
            menu_permissions_metadata = get(authMetadata).menu_permissions
        }
    });

    // 角色勾选逻辑
    function handleRoleToggle(roleId, checked) {
        if (checked) {
            if (!selectedRoles.includes(roleId)) {
                selectedRoles = [...selectedRoles, roleId];
                if (roleId === 3) {
                    // 普通管理员默认全选（禁用权限为空）
                    rolePermissions = { ...rolePermissions, [roleId]: new Set() };
                }
            }
        } else {
            selectedRoles = selectedRoles.filter(id => id !== roleId);
            const { [roleId]: _, ...rest } = rolePermissions;
            rolePermissions = rest;
        }
    }

    // 权限勾选逻辑（只对普通管理员生效）
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

    // 构建提交参数
    function buildRolePermissions() {
        return selectedRoles
            .filter(roleId => roleId !== 2)
            .map(roleId => {
                const role = user_role_metadata.find(r => r.id === roleId);
                if (roleId === 3) {
                    return {
                        role_id: 3,
                        permissions: Array.from(rolePermissions[3] || [])
                    };
                } else {
                    return {
                        role_id: roleId,
                    };
                }
            });
    }

    // 提交表单
    async function submitForm() {
        // 重置错误状态
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

        let hasError = false;

        if (!account) {
            formErrors.account = "请输入账号";
            hasError = true;
        }
        if (!password) {
            formErrors.password = "请输入密码";
            hasError = true;
        }
        if (selectedRoles.length === 0) {
            formErrors.role = "请至少选择一个角色";
            hasError = true;
        }
        // 手机号存在时才校验格式
        if (phone && !/^1[3-9]\d{9}$/.test(phone)) {
            formErrors.phone = "请输入正确的手机号码";
            hasError = true;
        }
        // 邮箱存在时才校验格式
        if (email && !/^\S+@\S+\.\S+$/.test(email)) {
            formErrors.email = "请输入正确的邮箱地址";
            hasError = true;
        }
        // 姓名存在时校验长度（1-20字符）
        if (name && (name.length < 1 || name.length > 20)) {
            formErrors.name = "姓名长度需为1-20个字符";
            hasError = true;
        }
        // 普通管理员必须至少选一个模块
        if (selectedRoles.includes(3)) {
            const allPermIds = user_role_metadata.find(r => r.id === 3)?.default_permissions || [];
            if (rolePermissions[3] && rolePermissions[3].size === allPermIds.length) {
                formErrors.adminPerm = "请至少选择一个模块权限";
                hasError = true;
            }
        }

        if (hasError) {
            actionToast.show("error", "请检查表单填写是否正确");
            return;
        }

        try {
            // 创建JSON数据
            const jsonData = {
                account: account,
                password: password,
                role_permissions: buildRolePermissions(),
            };
            if (name) jsonData.name = name;
            if (gender) jsonData.gender = gender;
            if (phone) jsonData.phone = phone;
            if (email) jsonData.email = email;

            // 显示提交中状态
            const submitButton = document.querySelector(".submit-button");
            const originalText = submitButton.textContent;
            submitButton.textContent = "提交中...";
            submitButton.disabled = true;

            // 发送POST请求，直接用JSON
            const response = await fetch("/api/user", {
                method: "POST",
                credentials: "include",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ data: jsonData }),
            });

            // 处理响应
            if (response.ok) {
                // 添加成功后，发送操作日志
                sendOperationLog(`添加了用户 ${account}`);
                
                actionToast.show("success", "用户添加成功");
                // 提交成功后返回用户管理页面
                setTimeout(() => {
                    goto("/teacher/userManagement");
                }, 1500);
            } else {
                const errorData = await response.json();
                actionToast.show("error", `添加失败: ${errorData.message || "未知错误"}`);
                // 恢复按钮状态
                submitButton.textContent = originalText;
                submitButton.disabled = false;
            }
        } catch (error) {
            console.error("提交表单时出错:", error);
            actionToast.show("error", `提交表单时出错: ${error.message || "未知错误"}`);
            // 恢复按钮状态
            const submitButton = document.querySelector(".submit-button");
            if (submitButton) {
                submitButton.textContent = "提交";
                submitButton.disabled = false;
            }
        }
    }

    // 取消操作
    function cancelForm() {
        goto("/teacher/userManagement");
    }
</script>

<div class="add-user-container">
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
                        bind:value={account}
                        placeholder="请输入账号"
                        class="form-input {formErrors.account ? 'input-error' : ''}"
                        readonly
                        title="账号已自动生成"
                    />
                    {#if formErrors.account}
                        <div class="error-message">{formErrors.account}</div>
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
                    <input
                        type="password"
                        bind:value={password}
                        placeholder="请输入密码"
                        class="form-input {formErrors.password ? 'input-error' : ''}"
                    />
                    {#if formErrors.password}
                        <div class="error-message">{formErrors.password}</div>
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
                        bind:value={name}
                        placeholder="请输入姓名"
                        class="form-input {formErrors.name ? 'input-error' : ''}"
                    />
                    {#if formErrors.name}
                        <div class="error-message">{formErrors.name}</div>
                    {/if}
                </div>
            </div>
            <!-- 性别 -->
            <div class="form-item">
                <div class="form-label">
                    <span>性别</span>
                </div>
                <div class="dropdown-container">
                    <DropdownGray
                        selected={gender}
                        options={[
                            { label: "男", value: "男" },
                            { label: "女", value: "女" },
                        ]}
                        placeholder="请选择性别"
                        selectOptionFunc={handleGenderSelect}
                    />
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
                        bind:value={phone}
                        placeholder="请输入手机号"
                        class="form-input {formErrors.phone ? 'input-error' : ''}"
                        pattern="[0-9]{11}"
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
                        bind:value={email}
                        placeholder="请输入邮箱"
                        class="form-input {formErrors.email ? 'input-error' : ''}"
                    />
                    {#if formErrors.email}
                        <div class="error-message">{formErrors.email}</div>
                    {/if}
                </div>
            </div>
        </div>
    </div>

    <!-- 授权信息部分-->
    <div class="section-container">
        <Title title="授权信息" />

        <div class="auth-form">
            <!-- 角色多选 -->
            <div class="form-item">
                <div class="form-label">角色</div>
                <div class="form-checkbox-and-error">
                    <div class="form-checkbox-group">
                        {#each user_role_metadata.filter(role => role.id !== 2) as role}
                            <label class="checkbox-label">
                                <input
                                    type="checkbox"
                                    class="checkbox-item"
                                    checked={selectedRoles.includes(role.id)}
                                    onchange={e => handleRoleToggle(role.id, e.target.checked)}
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
                <div class="form-item">
                    <div class="form-label">{user_role_metadata.find(r => r.id === 3)?.description}模块权限</div>
                    <div class="form-checkbox-and-error">
                        <div class="form-checkbox-group">
                            {#each user_role_metadata.find(r => r.id === 3)?.default_permissions as permId}
                                {#if menu_permissions_metadata.find(p => p.id === permId)}
                                    <label class="checkbox-label">
                                        <input
                                            type="checkbox"
                                            class="checkbox-item"
                                            checked={!rolePermissions[3]?.has(permId)}
                                            onchange={() => handlePermissionToggle(3, permId)}
                                        />
                                        <span>{menu_permissions_metadata.find(p => p.id === permId).description}</span>
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
        <button class="cancel-button" onclick={cancelForm}>取消</button>
        <button class="submit-button" onclick={submitForm}>提交</button>
    </div>

    <!-- 操作提示组件 -->
    <ActionToast bind:this={actionToast} isShow={false} />
</div>

<style lang="scss" scoped>
    $primary-color: #0052d9;
    $gray-color: rgba(0, 0, 0, 0.6);
    $border-color: #ddd;

    .add-user-container {
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
            min-width: 300px;
        }

        .dropdown-container {
            width: 20%;
            height: 100%;
        }
    }

    .auth-form {
        display: flex;
        gap: 20px;
        padding: 20px 0 0 40px;
        flex-direction: column;
        width: 100%;
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
            width: calc(90% - 10px);
            min-width: 300px;
            display: inline-flex;
            align-items: flex-start;
            gap: 30px;
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
        .module-checkbox-group {
            gap: 12px 24px;
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

        .error-message {
            position: relative;
            margin-top: 4px;
            left: 0;
            top: 0;
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

    /* 识别状态和错误信息样式已移动到big-title中 */

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

        .required-mark {
            color: red;
            margin-right: 4px;
        }
    }

    .form-input-container {
        position: relative;
        flex: 1;
    }

    .error-message {
        color: #e34d59;
        font-size: 12px;
        position: absolute;
        left: 0;
        top: 38px;
        line-height: 1.4;
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
    }

    .button-container {
        display: flex;
        justify-content: center;
        gap: 20px;
        margin-top: 40px;
    }

    .cancel-button,
    .submit-button {
        width: 100px;
        height: 36px;
        border-radius: 3px;
        font-size: 14px;
        cursor: pointer;
    }

    .cancel-button {
        background-color: white;
        color: #333;
        border: 1px solid $border-color;
    }

    .submit-button {
        background-color: $primary-color;
        color: white;
        border: none;
    }

    .readonly-permission {
        display: inline-block;
        margin-right: 16px;
        padding: 2px 8px;
        background: #f5f5f5;
        border-radius: 3px;
        color: #888;
        font-size: 13px;
    }
</style>
