<script>
    import Upload from "$lib/components/Upload/UploadImage.svelte";
    import Title from "$lib/components/Title/Title.svelte";
    import InputBox from "$lib/components/Input/InputBox.svelte";
    import InforInput from "$lib/components/Input/InforInput.svelte";
    import Select from "$lib/components/Select/Select.svelte";
    import Option from "$lib/components/Select/Option.svelte";
    import Button from "$lib/components/Button/Button.svelte";
    import { toast } from "$lib/components/Toast/Toast.js";
    import MessageBox from "$lib/components/MessageBox/MessageBox.js";

    import {
        validMobile,
        validEmail,
        validIdCard,
    } from "$lib/utils/validate.js";
    import { goto } from "$app/navigation";
    import { onMount } from "svelte";

    let account = $state("");
    let password = $state("");
    let name = $state("");
    let gender = $state("");
    let email = $state("");
    let phone = $state("");
    let selectedRoles = $state([]);
    let selectedPermissions = $state([]);
    let showPermColumn = $derived(selectedRoles.includes(1));

    let hasError = false;
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

    // 用户角色列表
    const userRoles = $state([
        { id: 1, name: "普通管理员" },
        { id: 2, name: "教师" },
        { id: 3, name: "批阅员" },
        { id: 4, name: "监考员" },
        { id: 5, name: "核分员" },
        { id: 6, name: "考点负责人" },
        { id: 7, name: "学生" },
    ]);

    // 管理员权限列表
    const userPermissions = $state([
        { id: 1, name: "题库管理" },
        { id: 2, name: "试卷管理" },
        { id: 3, name: "练习管理" },
        { id: 4, name: "考试管理" },
        { id: 5, name: "试卷批改" },
        { id: 6, name: "成绩管理" },
        { id: 7, name: "学生管理" },
        { id: 8, name: "用户管理" },
        { id: 9, name: "考点管理" },
    ]);

    function cancelForm() {
        MessageBox({
            title: "确认退出",
            content: "你还未提交数据，确定要退出吗？",
            onConfirm: () => {
                goto("/teacher/user-management");
            },
        });
    }

    function submitForm() {
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
        hasError = false;

        //密码校验
        if (!password) {
            formErrors.password = "请输入密码";
            hasError = true;
        }
        //手机号位数校验
        if (phone.trim() && !validMobile(phone)) {
            formErrors.phone = "请输入正确的手机号码";
            hasError = true;
        }
        //邮箱格式校验
        if (email.trim() && !validEmail(email)) {
            formErrors.email = "请输入正确的邮箱地址";
            hasError = true;
        }
        //姓名长度校验
        if (name && (name.length < 1 || name.length > 20)) {
            formErrors.name = "姓名长度需为1-20个字符";
            hasError = true;
        }

        //角色校验
        if (selectedRoles.length === 0) {
            formErrors.role = "请至少选择一个角色";
            hasError = true;
        }

        // 普通管理员角色校验
        if (selectedRoles.includes(1) && selectedPermissions.length === 0) {
            formErrors.adminPerm = "请至少选择一个模块权限";
            hasError = true;
        }

        if (hasError) {
            toast.warning("请检查输入信息是否正确！");
            return;
        }

        const payload = {
            Account: account.trim(),
            OfficialName: name.trim() || null,
            Gender: gender.trim() || null,
            MobilePhone: phone.trim() || null,
            Email: email.trim() || null,
        };
        const requestBody = { data: [payload] };
        fetch("/api/user", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            credentials: "include",
            body: JSON.stringify(requestBody),
        })
            .then((res) => {
                if (!res.ok) {
                    return res.text().then((msg) => {
                        throw new Error(
                            `请求失败: ${res.status} ${res.statusText} - ${msg}`,
                        );
                    });
                }
                return res.json();
            })
            .then(() => goto("/teacher/user-management"))
            .then(() => {
                toast.success("操作成功");
            })
            .catch((err) => {
                toast.warning("创建失败");
            });
    }

    onMount(() => {
        // 生成随机账号 TODO:后续需改为从后端获取
        const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz";
        account = Array.from(
            { length: 12 },
            () => chars[Math.floor(Math.random() * chars.length)],
        ).join("");

        // 固定密码 TODO:后续需改为用户输入
        password = "abc123456";

        // 普通管理员默认全选
        selectedPermissions = userPermissions.map((p) => p.id);
    });
</script>

<div class="add-user-container">
    <!-- 基本信息部分 -->
    <div class="section-container">
        <Title title="基本信息" line={false} />
        <div class="basic-info-container">
            <!-- 账号 -->
            <div class="form-item">
                <div class="form-label">
                    <span class="required-mark">*</span>
                    <span class="label-text">账号</span>
                </div>
                <div class="form-input-container">
                    <InputBox
                        type="text"
                        bind:value={account}
                        showLabel={false}
                        clearable={false}
                        readonly
                    ></InputBox>
                </div>
            </div>

            <!-- 密码 TODO:后续改为用户手动输入 -->
            <div class="form-item">
                <div class="form-label">
                    <span class="required-mark">*</span>
                    <span class="label-text">密码</span>
                </div>
                <div class="form-input-container">
                    <InputBox
                        placeholder="请输入密码"
                        type="password"
                        bind:value={password}
                        showLabel={false}
                        clearable={false}
                        readonly
                    ></InputBox>
                    <div class="error-message" class:show={formErrors.password}>
                        {formErrors.password}
                    </div>
                </div>
            </div>

            <!-- 姓名 -->
            <div class="form-item">
                <div class="form-label">
                    <span class="label-text">姓名</span>
                </div>
                <div class="form-input-container">
                    <InputBox
                        placeholder="请输入姓名"
                        type="text"
                        bind:value={name}
                        showLabel={false}
                    ></InputBox>
                    <div class="error-message" class:show={formErrors.name}>
                        {formErrors.name}
                    </div>
                </div>
            </div>

            <!-- 性别 -->
            <div class="gender-container">
                <div class="form-label">
                    <span class="label-text">性别</span>
                </div>
                <div class="form-input-container">
                    <Select bind:value={gender} placeholder="请选择性别">
                        <Option value="男" label="男"></Option>
                        <Option value="女" label="女"></Option>
                    </Select>
                </div>
            </div>

            <!-- 手机号 -->
            <div class="form-item">
                <div class="form-label">
                    <span class="label-text">手机号</span>
                </div>
                <div class="form-input-container">
                    <InputBox
                        placeholder="请输入手机号"
                        type="text"
                        bind:value={phone}
                        showLabel={false}
                    ></InputBox>
                    <div class="error-message" class:show={formErrors.phone}>
                        {formErrors.phone}
                    </div>
                </div>
            </div>

            <!-- 邮箱 -->
            <div class="form-item">
                <div class="form-label">
                    <span class="label-text">邮箱</span>
                </div>
                <div class="form-input-container">
                    <InputBox
                        placeholder="请输入邮箱"
                        type="email"
                        bind:value={email}
                        showLabel={false}
                    ></InputBox>
                    <div class="error-message" class:show={formErrors.email}>
                        {formErrors.email}
                    </div>
                </div>
            </div>
        </div>
    </div>

    <!-- 授权信息部分 -->
    <div class="section-container">
        <Title title="授权信息" line={false} />
        <div class="auth-form">
            <!-- 角色选择 -->
            <div class="form-item">
                <div class="form-label">
                    <span class="required-mark">*</span>
                    <span class="label-text">角色</span>
                </div>
                <div class="form-checkbox-and-error">
                    <div class="form-checkbox-group">
                        {#each userRoles as role}
                            <label class="form-checkbox">
                                <input
                                    type="checkbox"
                                    class="checkbox-item"
                                    bind:group={selectedRoles}
                                    value={role.id}
                                />
                                <span class="checkbox-text">{role.name}</span>
                            </label>
                        {/each}
                    </div>
                    <div class="error-message" class:show={formErrors.role}>
                        {formErrors.role}
                    </div>
                </div>
            </div>

            <div
                class="form-item perm-column {showPermColumn
                    ? 'visible'
                    : 'hidden'}"
            >
                <div class="form-label">普通管理员模块权限</div>
                <div class="form-checkbox-and-error">
                    <div class="form-checkbox-group">
                        {#each userPermissions as perm}
                            <label class="form-checkbox">
                                <input
                                    type="checkbox"
                                    class="checkbox-item"
                                    bind:group={selectedPermissions}
                                    value={perm.id}
                                />
                                <span class="checkbox-text">{perm.name}</span>
                            </label>
                        {/each}
                    </div>
                    <div
                        class="error-message"
                        class:show={formErrors.adminPerm}
                    >
                        {formErrors.adminPerm}
                    </div>
                </div>
            </div>
        </div>
    </div>

    <!-- 按钮区域 -->
    <div class="button-container">
        <button class="cancel-button" onclick={cancelForm}>取消</button>
        <button class="submit-button" onclick={submitForm}>提交</button>
    </div>
</div>

<style lang="scss" scoped>
    $primary-color: #0052d9;
    $normal-font-size: 14px;
    $gray-font-color: rgba(0, 0, 0, 0.6);
    $border-color: #ddd;

    .add-user-container {
        position: relative;
        background-color: white;
        display: flex;
        flex-direction: column;
        width: 100%;
        height: 100%;
        min-width: 800px;

        @media (max-width: 1200px) {
            min-width: 700px;
        }

        @media (max-width: 768px) {
            min-width: 500px;
        }
    }

    .basic-info-container {
        display: grid;
        grid-template-columns: repeat(2, 1fr);
        gap: 30px;
        flex: 1;
        margin-top: 40px;
        margin-bottom: 40px;
        width: 80%;

        .form-item {
            display: flex;
            align-items: center;
            gap: 20px;
        }

        .form-label {
            font-size: $normal-font-size;
            color: $gray-font-color;
            min-width: 260px;
            text-align: right; //放在容器右侧TODO:后续需确定放哪

            .required-mark {
                color: red;
            }
        }

        .form-input-container {
            position: relative;
            display: flex;
            width: 31.5%; //为与性别框对齐

            .error-message {
                color: #e34d59;
                font-size: 12px;
                position: absolute;
                top: 38px;
                left: 0;
                line-height: 1.4;
                display: none;
            }

            .error-message.show {
                display: block;
            }
        }

        .gender-container {
            display: flex;
            align-items: center;
            gap: 20px;
        }
    }

    .auth-form {
        display: flex;
        flex-direction: column;
        gap: 25px;
        margin-top: 40px;
        margin-bottom: 40px;
        width: 80%;

        .form-item {
            display: flex;
            align-items: flex-start;
            justify-content: center;
            gap: 20px;

            .form-label {
                font-size: $normal-font-size;
                color: $gray-font-color;
                text-align: right;
                min-width: 260px; //与上方基本信息保持一致

                .required-mark {
                    color: red;
                }
            }

            .form-checkbox-and-error {
                display: flex;
                flex-direction: column;
                flex: 1;
                position: relative;

                font-size: $normal-font-size;

                .form-checkbox-group {
                    display: flex;
                    flex-wrap: wrap;
                    gap: 18px 32px;
                    align-items: center;
                }

                .error-message {
                    color: #e34d59;
                    font-size: 12px;
                    position: absolute;
                    top: 25px;
                    left: 0;
                    line-height: 1.4;
                }
                
                .error-message.show {
                    display: block;
                }
            }
        }
    }

    .perm-column {
        margin-top: 10px;
        visibility: hidden;
        &.visible {
            visibility: visible;
        }
    }

    .checkbox-item {
        min-width: 16px;
        min-height: 16px;
        cursor: pointer;
        vertical-align: middle;
        accent-color: #0052d9;
    }
    .form-checkbox {
        display: flex;
        align-items: center;
        font-size: 14px;
        cursor: pointer;
        input[type="checkbox"] {
            margin-right: 6px;
            accent-color: $primary-color;
        }
    }
    .checkbox-text {
        min-width: 70px;
    }

    .button-container {
        display: flex;
        justify-content: center;
        gap: 20px;
        margin-top: 100px;

        .cancel-button {
            width: 100px;
            height: 36px;
            border-radius: 3px;
            font-size: 14px;
            cursor: pointer;
            background-color: white;
            color: #333;
            border: 1px solid $border-color;
        }

        .submit-button {
            width: 100px;
            height: 36px;
            border-radius: 3px;
            font-size: 14px;
            cursor: pointer;
            background-color: $primary-color;
            color: white;
            border: none;
        }
    }
</style>
