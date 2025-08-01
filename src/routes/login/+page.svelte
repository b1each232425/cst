<script>
    // import {goto} from '$app/navigation';
    import MessageBox from '$lib/components/MessageBox/MessageBox.svelte';
    import {goto} from "$app/navigation";

    const DomainsMap = {
        "cst.school^superAdmin": "超级管理员",
        "cst.school^admin": "管理员",
        "cst.school^teacher": "教师",
        "cst.school.academicAffair^admin": "教务员",
        "cst.school^examSupervisor": "监考员",
        "cst.school^examGrader": "阅卷员",
        "cst.school.examSite^admin": "考点负责人",
        "cst.school^scoreChecker": "核分员",
        "cst.school^student": "学生",
    }

    // 登录页面组件
    let credential = $state('');
    let password = $state('');
    let agreeTerms = $state(false);

    // 消息框状态
    let messageBoxVisible = $state(false);
    let messageBoxTitle = $state('提示');
    let messageBoxContent = $state('');

    // 角色选择状态
    let roleSelectVisible = $state(false);
    let availableRoles = $state([]);
    let selectedRole = $state('');

    /**
     * 处理登录提交
     */
    function handleLogin() {
        if (!credential || !password) {
            showMessage('提示', '请输入登录凭证和密码');
            return;
        }
        if (!agreeTerms) {
            showMessage('提示', '请先同意用户协议');
            return;
        }

        fetch('/api/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            credentials: 'include',
            body: JSON.stringify({
                name: credential,
                cert: password,
            }),
        })
            .then((response) => {
                if (!response.ok) {
                    throw new Error('网络错误');
                }
                return response.json();
            })
            .then((data) => {
                if (data.status !== 0) {
                    showMessage('登录失败', data.msg || '登录失败，请重试');
                } else {
                    // 登录成功后选择角色
                    selectLoginRole();
                }
            })
            .catch((e) => {
                console.log(e);
                showMessage('登录失败', '网络错误，请检查网络连接后重试');
            });
    }

    /**
     * 选择登录角色
     */
    function selectLoginRole() {
        // 请求获取我的角色信息
        fetch('/api/user/me', {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
            },
        })
            .then((response) => {
                if (!response.ok) {
                    throw new Error('网络错误');
                }
                return response.json();
            })
            .then((data) => {
                // 检查数据结构是否正确
                if (!data || !data.data || !Array.isArray(data.data.Domains)) {
                    throw new Error('角色数据格式错误');
                }
                
                const myDomains = data.data.Domains;
                availableRoles = myDomains;

                // 如果只有一个角色，则直接以该角色登录
                if (myDomains.length === 1) {
                    confirmRoleSelection(myDomains[0]);
                } else {
                    // 多个角色时弹出选择框
                    selectedRole = myDomains[0]; // 默认选择第一个角色
                    roleSelectVisible = true;
                }
            })
            .catch((e) => {
                console.log(e);
                showMessage('获取角色失败', '网络错误，请检查网络连接后重试');
            });
    }

    /**
     * 确认角色选择
     */
    function confirmRoleSelection(targetDomain = selectedRole) {
        // 发请求选择登录角色
        fetch('/api/user/login-domain', {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                data: targetDomain,
            }),
        })
            .then((response) => {
                if (!response.ok) {
                    throw new Error('网络错误');
                }
                return response.json();
            })
            .then((data) => {
                if (data.status !== 0) {
                    roleSelectVisible = false;
                    showMessage('选择角色失败', data.msg || '选择角色失败，请重试');
                } else {
                    roleSelectVisible = false;
                    // 根据角色跳转到对应页面
                    redirectByRole(targetDomain);
                }
            })
            .catch((e) => {
                console.log(e);
                roleSelectVisible = false;
                showMessage('选择角色失败', '网络错误，请检查网络连接后重试');
            });
    }

    /**
     * 根据角色跳转页面
     */
    function redirectByRole(domain) {
        if (domain.includes('student')) {
            goto('/student/practice')
        } else {
            goto('/teacher/question-bank/theory');
        }
    }

    /**
     * 取消角色选择
     */
    function cancelRoleSelection() {
        roleSelectVisible = false;
        selectedRole = '';
    }

    /**
     * 显示消息框
     */
    function showMessage(title, content) {
        messageBoxTitle = title;
        messageBoxContent = content;
        messageBoxVisible = true;
    }

    /**
     * 关闭消息框
     */
    function closeMessage() {
        messageBoxVisible = false;
    }
</script>

<div class="login-container">
    <div class="login-panel">
        <!-- 左侧登录表单 -->
        <div class="login-form">
            <h1 class="title">3min</h1>

            <div class="form-content">
                <div class="input-container">
                    <input type="text" bind:value={credential} placeholder="请输入ID/帐号/手机号/邮箱/姓名"
                           class="token-input"/>
                </div>

                <div class="input-container">
                    <input type="password" bind:value={password} placeholder="请输入密码" class="password-input"/>
                </div>

                <button type="button" class="login-btn" onclick={handleLogin}>登录</button>

                <div class="agreement-container">
                    <label class="agreement-label">
                        <input type="checkbox" bind:checked={agreeTerms} class="agreement-checkbox"/>
                        <span class="agreement-text">
              我已阅读并同意<a href="#">用户协议</a>、
              <a href="#">隐私政策</a>、
              <a href="#">产品服务协议</a>
            </span>
                    </label>
                </div>
            </div>
        </div>

        <!-- 右侧微信扫码 -->
        <div class="qr-section">
            <h3 class="qr-title">微信扫码登录</h3>
            <div class="qr-code">
                <!-- 这里应该是实际的二维码，暂时用占位符 -->
                <div class="qr-placeholder">
                    <div class="qr-pattern"></div>
                </div>
            </div>
        </div>
    </div>
</div>

<!-- 消息提示框 -->
<MessageBox
        visible={messageBoxVisible}
        title={messageBoxTitle}
        content={messageBoxContent}
        show_cancel_button={false}
        confirm_text="确定"
        onConfirm={closeMessage}
/>

<!-- 角色选择对话框 -->
{#if roleSelectVisible}
    <div class="role-select-overlay">
        <div class="role-select-dialog">
            <div class="role-select-header">
                <h3 class="role-select-title">选择登录角色</h3>
                <button class="role-select-close" onclick={cancelRoleSelection}>
                    ×
                </button>
            </div>
            <div class="role-select-content">
                <div class="role-options">
                    {#each availableRoles as role (role)}
                        <label class="role-option">
                            <input 
                                type="radio" 
                                bind:group={selectedRole} 
                                value={role} 
                                name="role"
                                class="role-radio"
                            />
                            <span class="role-label">{DomainsMap[role] || role}</span>
                        </label>
                    {/each}
                </div>
            </div>
            <div class="role-select-footer">
                <button class="role-btn role-btn-cancel" onclick={cancelRoleSelection}>
                    取消
                </button>
                <button class="role-btn role-btn-confirm" onclick={() => confirmRoleSelection()}>
                    确定
                </button>
            </div>
        </div>
    </div>
{/if}

<style>
    @import '/src/lib/styles/global.css';

    :global(body) {
        overflow: hidden;
    }

    .login-container {
        display: flex;
        justify-content: center;
        align-items: center;
        min-height: 100vh;
        background-color: #f5f5f5;
        padding: 2rem;
        transform: translateY(-3rem);
    }

    .login-panel {
        display: flex;
        background: white;
        border-radius: var(--border-radius-lg);
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
        overflow: hidden;
        max-width: 65rem;
        width: 100%;
    }

    .login-form {
        flex: 1;
        padding: 4rem 5.5rem;
        min-width: 0;
        max-width: 60%;
    }

    .title {
        font-size: 2.5rem;
        font-weight: bold;
        color: var(--primary-color);
        margin: 0 0 2rem 0;
        text-align: center;
    }

    .form-content {
        display: flex;
        flex-direction: column;
        gap: 1.5rem;
    }

    .input-container {
        display: flex;
        align-items: center;
        border-bottom: 2px solid #e0e0e0;
        padding-bottom: 0.5rem;
    }

    .token-input,
    .password-input {
        flex: 1;
        border: none;
        outline: none;
        font-size: 1.2rem;
        padding: 0.5rem 0;
        background: transparent;
        width: 100%;
    }

    .token-input::placeholder,
    .password-input::placeholder {
        color: #999;
        font-size: 1.1rem;
    }

    .login-btn {
        background: var(--primary-color);
        color: white;
        border: none;
        border-radius: 4px;
        padding: 1rem;
        font-size: 1rem;
        cursor: pointer;
        transition: background-color 0.2s;
        width: 100%;
        margin-top: 1.5rem;
    }

    .login-btn:hover {
        background: var(--primary-hover);
    }

    .agreement-container {
        display: flex;
        justify-content: center;
    }

    .agreement-label {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        cursor: pointer;
    }

    .agreement-checkbox {
        margin: 0;
        cursor: pointer;
    }

    .agreement-text {
        font-size: 0.9rem;
        color: #666;
        line-height: 1.4;
    }

    .agreement-text a {
        color: var(--primary-color);
        text-decoration: none;
    }

    .agreement-text a:hover {
        text-decoration: underline;
    }

    .qr-section {
        flex: 1;
        padding: 3rem 2.5rem;
        background: #fafafa;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        min-width: 0;
        max-width: 50%;
        text-align: center;
    }

    .qr-title {
        font-size: 1.2rem;
        color: #333;
        margin: 0 0 2rem 0;
        text-align: center;
    }

    .qr-code {
        width: 80%;
        max-width: 200px;
        aspect-ratio: 1;
        border: 2px solid #e0e0e0;
        border-radius: 8px;
        display: flex;
        align-items: center;
        justify-content: center;
        background: #f9f9f9;
        margin: 0 auto;
        position: relative;
    }

    .qr-placeholder {
        width: 90%;
        aspect-ratio: 1;
        border: 2px dashed #ccc;
        border-radius: 4px;
        display: flex;
        align-items: center;
        justify-content: center;
        color: #999;
        font-size: 0.875rem;
        position: relative;
        overflow: hidden;
    }

    .qr-pattern {
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background-image: repeating-linear-gradient(0deg, #333 0px, #333 10px, transparent 10px, transparent 20px),
        repeating-linear-gradient(90deg, #333 0px, #333 10px, transparent 10px, transparent 20px);
        opacity: 0.3;
    }

    /* 角色选择对话框样式 */
    .role-select-overlay {
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.5);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 1001;
    }

    .role-select-dialog {
        background: white;
        border-radius: var(--border-radius-lg);
        box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
        min-width: 25rem;
        max-width: 90%;
        max-height: 80%;
        overflow: hidden;
    }

    .role-select-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 1.1rem 2rem;
        border-bottom: 1px solid var(--border-light);
    }

    .role-select-title {
        margin: 0;
        font-size: 1.2rem;
        font-weight: 600;
        color: var(--text-primary);
    }

    .role-select-close {
        background: none;
        border: none;
        font-size: 1.5rem;
        color: var(--text-secondary);
        cursor: pointer;
        padding: 0;
        width: 2rem;
        height: 2rem;
        display: flex;
        align-items: center;
        justify-content: center;
        border-radius: 50%;
        transition: background-color 0.2s;
    }

    .role-select-close:hover {
        background-color: var(--bg-secondary);
    }

    .role-select-content {
        padding: 1.5rem 2rem;
    }

    .role-options {
        display: flex;
        flex-direction: column;
        gap: 0.75rem;
    }

    .role-option {
        display: flex;
        align-items: center;
        gap: 0.75rem;
        padding: 0.75rem 1rem;
        border: 1px solid var(--border-light);
        border-radius: var(--border-radius-md);
        cursor: pointer;
        transition: all 0.2s;
    }

    .role-option:hover {
        border-color: var(--primary-color);
        background-color: rgba(0, 82, 217, 0.05);
    }

    .role-radio {
        margin: 0;
        cursor: pointer;
    }

    .role-label {
        font-size: 0.95rem;
        color: var(--text-primary);
        cursor: pointer;
        flex: 1;
    }

    .role-select-footer {
        display: flex;
        justify-content: center;
        gap: 1rem;
        padding: 1.5rem 2rem;
        border-top: 1px solid var(--border-light);
        background-color: var(--bg-secondary);
    }

    .role-btn {
        padding: 0.5rem 1.5rem;
        border: none;
        border-radius: var(--btn-border-radius);
        font-size: 0.9rem;
        cursor: pointer;
        transition: all 0.2s;
        min-width: 5rem;
    }

    .role-btn-cancel {
        background: var(--bg-primary);
        color: var(--text-secondary);
        border: 1px solid var(--border-medium);
    }

    .role-btn-cancel:hover {
        background: var(--bg-secondary);
        border-color: var(--border-dark);
    }

    .role-btn-confirm {
        background: var(--primary-color);
        color: white;
    }

    .role-btn-confirm:hover {
        background: var(--primary-hover);
    }

    /* 响应式设计 */
    @media (max-width: 1200px) {
        .login-panel {
            flex-direction: column;
            max-width: 80%;
            min-width: 30rem;
            width: 100%;
        }

        .login-form {
            max-width: 80%;
        }

        .qr-section {
            min-width: auto;
            max-width: 100%;
            padding: 2rem 1.5rem;
        }

        .qr-code {
            width: 70%;
            max-width: 170px;
        }

        .qr-placeholder {
            width: 85%;
        }

        .qr-pattern {
            background-size: 1rem 1rem;
            background-position: 0 0,
            0 0.5rem,
            0.5rem -0.5rem,
            -0.5rem 0;
        }

        .role-select-dialog {
            min-width: 20rem;
            margin: 1rem;
        }

        .role-select-header,
        .role-select-content,
        .role-select-footer {
            padding-left: 1.5rem;
            padding-right: 1.5rem;
        }
    }
</style>
