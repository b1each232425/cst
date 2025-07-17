<!--
 * @Author: Zpekii 3156752796@qq.com
 * @Date: 2025-04-01 14:09:37
 * @LastEditors: Zpekii 3156752796@qq.com
 * @LastEditTime: 2025-05-03 18:08:50
 * @FilePath: \exam-fe\src\routes\student\Login.svelte
 * @Description: 登录组件
 * @Copyright (c) 2025 by Zpekii, All Rights Reserved.
-->
<!--                         o8o                 .
                             `"'               .o8
 .oooo.o  .ooooo.  oooo d8b oooo  oo.ooooo.  .o888oo
d88(  "8 d88' `"Y8 `888""8P `888   888' `88b   888
`"Y88b.  888        888      888   888   888   888
o.  )88b 888   .o8  888      888   888   888   888 .
8""888P' `Y8bod8P' d888b    o888o  888bod8P'   "888"
                                   888
                                  o888o
                                                      -->
<script>
    // @ts-nocheck
    const serverPort = import.meta.env.VITE_SERVER_PORT;

    /**
     * @type {{
     *      logo?: import("svelte").Snippet;                // logo组件
     *      public_user_agreement_url?: string;             // 用户协议链接
     *      public_privacy_policy_url?: string;             // 隐私政策链接
     *      public_product_service_agreement_url?: string;  // 产品服务协议链接
     *      handle_funcs?: {
     *          login: () => void; // 登录按钮点击事件
     *      };                                              // 处理函数
     * }}
     */
    let {
        logo,
        public_user_agreement_url,
        public_privacy_policy_url,
        public_product_service_agreement_url,
        handle_funcs,
    } = $props();

    if (!logo) {
        logo = defaultLogo;
    }

    let panel = $state("login");

    let panel_switch_str = $state("联系管理员注册");

    let active_tab = $state("phone");

    let user_agreement_is_checked = $state(false);

    // 账号密码登录相关状态
    let identifier = $state("");
    let password = $state("");
    let loginError = $state("");

    $effect(() => {
        switch (active_tab) {
            case "phone":
                document.documentElement.style.setProperty(
                    "--active-tab-position",
                    "0px",
                );
                break;
            case "account":
                document.documentElement.style.setProperty(
                    "--active-tab-position",
                    "100%",
                );
                break;
            default:
                document.documentElement.style.setProperty(
                    "--active-tab-position",
                    "0px",
                );
                break;
        }
    });

    /**
     * 切换面板
     * @param {string} panelName 面板名称: "login" 或 "register"
     */
    function handlePanelChange(panelName) {
        switch (panelName) {
            case "login":
                panel = "login";
                panel_switch_str = "联系管理员注册";
                break;
            case "register":
                panel = "register";
                panel_switch_str = "返回登录";
                break;
            default:
                panel = "login";
                break;
        }
    }

    /**
     * 登录按钮点击事件
     */
    async function handleLoginClick() {
        // 清除之前的错误信息
        loginError = "";

        // 检查用户协议是否勾选
        if (!user_agreement_is_checked) {
            loginError = "请阅读并同意用户协议和隐私政策";
            return;
        }

        if (active_tab === "account") {
            // 账号密码登录
            if (!identifier) {
                loginError = "请输入账号或手机号";
                return;
            }

            if (!password) {
                loginError = "请输入密码";
                return;
            }

            try {
                const response = await fetch("/api/login/by-static", {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    credentials: "include",
                    body: JSON.stringify({
                        data: {
                            identifier: identifier,
                            password: password,
                        },
                    }),
                });

                if (!response.ok) {
                    throw new Error(`请求失败: ${response.status}`);
                }

                const result = await response.json();
                if (result && result.status === 0) {
                    // 登录成功，调用传入的登录回调函数
                    handle_funcs?.login?.();
                } else {
                    // 登录失败，显示错误信息
                    loginError = result.message || "登录失败，请检查账号和密码";
                }
            } catch (error) {
                console.error("登录失败:", error);
                loginError = `登录失败: ${error.message}`;
            }
        } else {
            // 手机号登录
            // 获取手机号和验证码输入框的值
            const phoneInput = document.querySelector(".phone-input-field");
            const verificationCodeInput = document.querySelector(
                ".verification-code-input-field",
            );

            const phone = phoneInput?.value || "";
            const verificationCode = verificationCodeInput?.value || "";

            if (!phone) {
                loginError = "请输入手机号";
                return;
            }

            if (!verificationCode) {
                loginError = "请输入验证码";
                return;
            }

            // 如果所有验证通过，调用原有登录逻辑
            handle_funcs?.login?.();
        }
    }

    /**
     * Microsoft登录按钮点击事件
     */
    function handleMicrosoftLoginClick() {
        // 检查用户协议是否勾选
        if (!user_agreement_is_checked) {
            loginError = "请阅读并同意用户协议和隐私政策";
            return;
        }

        window.location.href = `${window.location.protocol}//${window.location.hostname}:${serverPort}/api/oauth/login/microsoft?role=8&target=/student/exam`;
    }
</script>

<!--
    .                                          oooo                .
  .o8                                          `888              .o8
.o888oo  .ooooo.  ooo. .oo.  .oo.   oo.ooooo.   888   .oooo.   .o888oo  .ooooo.
  888   d88' `88b `888P"Y88bP"Y88b   888' `88b  888  `P  )88b    888   d88' `88b
  888   888ooo888  888   888   888   888   888  888   .oP"888    888   888ooo888
  888 . 888    .o  888   888   888   888   888  888  d8(  888    888 . 888    .o
  "888" `Y8bod8P' o888o o888o o888o  888bod8P' o888o `Y888""8o   "888" `Y8bod8P'
                                     888
                                    o888o

-->

{#snippet defaultLogo()}
    <div
        class="logo"
        style="
        width: fit-content;
        height: auto;
        width: 100%;
        margin-top: 5px;
        margin-bottom: 12px;
        border-radius: 3px;
        background-color: rgba(255, 255, 255, 0);
        box-sizing: border-box;
        font-family: 'ComicSansMS-Bold', 'Comic Sans MS Bold', 'Comic Sans MS', sans-serif;
        font-weight: 700;
        font-size: 32px;
        color: #0336ff;
        text-align: center;
        line-height: 25px;
        padding: 0;"
    >
        Logo
    </div>
{/snippet}

<div class="login-container">
    {#if panel == "login"}
        <!-- 左半部分: 账号密码或手机短信输入区 -->
        <div class="login-left-container">
            <div class="logo">
                {@render logo()}
            </div>

            <div class="login-content">
                <div class="login-method-switch-tab">
                    <button
                        class="login-method-phone"
                        class:active={active_tab === "phone"}
                        onclick={() => (active_tab = "phone")}
                    >
                        <span> 手机号登录 </span>
                    </button>

                    <button
                        class="login-method-account"
                        class:active={active_tab === "account"}
                        onclick={() => (active_tab = "account")}
                    >
                        <span> 账号密码登录 </span>
                    </button>

                    <div class="login-method-current-selected"></div>
                </div>

                <div class="login-input-container">
                    {#if active_tab == "phone"}
                        <!-- 手机号输入 -->
                        <div class="phone-input">
                            <div id="phone-prefix">
                                <span>+86</span>
                            </div>

                            <input
                                type="text"
                                placeholder="请输入手机号"
                                class="phone-input-field"
                                maxlength="11"
                            />
                        </div>

                        <!-- 验证码输入 -->
                        <div class="phone-verification-code-input">
                            <input
                                type="text"
                                placeholder="请输入验证码"
                                class="verification-code-input-field"
                                maxlength="11"
                            />

                            <button
                                id="reacquire-code-btn"
                                onclick={() => {
                                    console.log("获取验证码");
                                }}
                            >
                                <span
                                    style="
                                    position: absolute;
                                    left: 0px;
                                    width: 100%;
                                    height: 80%;
                                    border-left: 2px solid #cccccc"
                                ></span>

                                <span>获取验证码</span>
                            </button>
                        </div>

                        {#if loginError}
                            <div class="login-error-message">
                                {loginError}
                            </div>
                        {/if}
                    {:else if active_tab == "account"}
                        <div class="account-input">
                            <input
                                type="text"
                                placeholder="请输入账号或手机号"
                                class="account-input-field"
                                bind:value={identifier}
                            />
                        </div>

                        <div class="password-input">
                            <input
                                required
                                type="password"
                                placeholder="请输入密码"
                                class="password-input-field"
                                bind:value={password}
                            />
                        </div>

                        {#if loginError}
                            <div class="login-error-message">
                                {loginError}
                            </div>
                        {/if}

                        <div class="account-help">
                            <div class="account-help-content">
                                <button class="forget-account">
                                    <span>忘记账号名</span>
                                </button>

                                <button class="forget-password">
                                    <span>忘记密码</span>
                                </button>
                            </div>
                        </div>
                    {/if}
                </div>

                <button class="login-button" onclick={() => handleLoginClick()}>
                    登录
                </button>

                <button
                    class="microsoft-login-button"
                    onclick={() => handleMicrosoftLoginClick()}
                >
                    通过Microsoft登录
                </button>

                <!-- 用户协议确认 -->
                <div class="user-agreement">
                    <div class="user-agreement-content">
                        <div style="display: flex; align-items: center;">
                            <input
                                type="checkbox"
                                id="user-agreement-checkbox"
                                style="color:#0052d9; cursor: pointer; margin-right: 5px;"
                                bind:checked={user_agreement_is_checked}
                            />

                            <div
                                class="user-agreement-text"
                                style="display: flex; align-items: center; border: none;"
                            >
                                <button
                                    style="
                                    display: flex;
                                    font-size:12px;box-sizing: border-box;
                                    font-family: 'PingFangSC-Regular', 'PingFang SC', sans-serif;
                                    color: #333333;
                                    text-align: left;
                                    line-height: 22px;
                                    padding: 0;
                                    border: none;
                                    cursor: pointer;
                                    white-space: nowrap;"
                                    onclick={() =>
                                        (user_agreement_is_checked =
                                            !user_agreement_is_checked)}
                                >
                                    我已阅读并同意
                                </button>

                                <span
                                    style="
                                    display: flex;"
                                >
                                    <a
                                        href={public_user_agreement_url}
                                        target="_blank">用户协议</a
                                    >、<a
                                        href={public_privacy_policy_url}
                                        target="_blank">隐私政策</a
                                    >、<a
                                        href={public_product_service_agreement_url}
                                        target="_blank">产品服务协议</a
                                    >
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <!-- 右半部分: 扫码区 -->
        <div class="login-right-container">
            <p style="margin: 5px;">
                <span
                    style="
                    width: max-content;
                    height:max-content;
                    padding: 2px 2px 2px 2px;
                    font-size: 28px;
                    background-color: rgba(215, 215, 215, 0);
                    box-sizing: border-box;
                    font-family: 'Arial', sans-serif;
                    color: #333333;
                    text-align: center;
                    line-height: 25px;">微信扫码登录</span
                >
            </p>

            <img
                class="QR-code"
                src="/normal_u7.png"
                style="width: 50%;"
                alt="example"
            />
        </div>
    {:else if panel == "register"}
        <div class="register-content">
            <div class="logo">
                {@render logo()}
            </div>

            <div class="contact-info">
                <div
                    style="
                    display: flex;
                    position: relative;
                    top:5%;
                    font-size: 25px;
                    justify-content: center;
                    align-items: center;"
                >
                    <span>联系管理员注册</span>
                </div>

                <div
                    style="
                    display: flex;
                    position: relative;
                    top: 10%;
                    width: 100%;
                    justify-content: center;"
                >
                    <img
                        class="QR-code"
                        src="normal_u7.png"
                        style="width: 28%;"
                        alt="example"
                    />
                </div>
            </div>
        </div>
    {/if}

    <!-- <button class="panel-switch-btn"
        onclick={() => handlePanelChange(panel === "login" ? "register" : "login")}
    >
        <span style="width:max-content;height:max-content">{panel_switch_str}</span>
    </button> -->
</div>

<!--
             .               oooo
           .o8               `888
 .oooo.o .o888oo oooo    ooo  888   .ooooo.
d88(  "8   888    `88.  .8'   888  d88' `88b
`"Y88b.    888     `88..8'    888  888ooo888
o.  )88b   888 .    `888'     888  888    .o
8""888P'   "888"     .8'     o888o `Y8bod8P'
                 .o..P'
                 `Y8P'

-->
<style lang="scss" scoped>
    .login-container {
        position: relative;
        display: flex;
        width: 760px;
        height: 511px;
        border-radius: 12px;
        background-color: rgba(255, 255, 255, 0);
        box-sizing: border-box;
        box-shadow: 0px 2px 10px 0px rgba(0, 0, 0, 0.35);
    }

    .login-left-container {
        display: block;
        position: relative;
        top: 5%;
        width: 50%;
        height: 90%;
        border-radius: 6px;
        background-color: #ffffff;
        box-sizing: border-box;

        &::after {
            content: "";
            position: absolute;
            top: 10%;
            right: 0;
            width: 1px;
            height: 80%;
            background-color: #79a8f6;
            box-sizing: border-box;
        }
    }

    .login-right-container {
        display: flex;
        position: relative;
        flex-direction: column;
        width: 50%;
        height: 100%;
        border-radius: 6px;
        background-color: #ffffff;
        box-sizing: border-box;
        justify-content: center;
        align-items: center;
    }

    .panel-switch-btn {
        display: flex;
        position: absolute;
        width: 100px;
        height: 6%;
        top: 0;
        left: 0;
        padding: 4px 4px 2px 2px;
        border: rgba(255, 255, 255, 0);
        border-radius: 12px 0 12px 0;
        background-color: #699ef5;
        box-sizing: border-box;
        font-family: "Arial", sans-serif;
        font-size: 12px;
        color: #ffffff;
        text-align: center;
        justify-content: center;
        align-items: center;
        cursor: pointer;
    }

    .logo {
        display: flex;
        height: auto;
        width: 100%;
        margin-top: 15px;
        margin-bottom: 20px;
        border-radius: 3px;
        background-color: rgba(255, 255, 255, 0);
        box-sizing: border-box;
        font-family: "ComicSansMS-Bold", "Comic Sans MS Bold", "Comic Sans MS",
            sans-serif;
        font-weight: 700;
        font-size: 32px;
        color: #0336ff;
        text-align: center;
        line-height: 25px;
        padding: 0;
        justify-content: center;
        align-items: center;
    }

    .login-content {
        display: flex;
        flex-direction: column;
        width: 100%;
        height: 80%;
        position: relative;
        justify-content: start;
        align-items: center;
    }

    .login-method-switch-tab {
        display: flex;
        width: 100%;
        height: 10%;
        position: relative;
        justify-content: center;
        align-content: center;
    }

    .login-method-phone,
    .login-method-account {
        width: 37.5%;
        margin-top: 4px;
        margin-bottom: 4px;
        border-radius: 3px;
        padding: 2px;
        border: rgba(255, 255, 255, 0);
        background-color: rgba(255, 255, 255, 0);
        box-sizing: border-box;
        font-family: "PingFangSC-Regular", "PingFang SC", sans-serif;
        color: rgba(0, 0, 0, 0.6);
        text-align: center;
        line-height: 22px;
        z-index: 2;
        cursor: pointer;
    }

    .login-method-phone.active,
    .login-method-account.active {
        color: #0052d9;
    }

    .login-method-current-selected {
        position: absolute;
        width: 37.5%;
        left: 12.5%;
        height: 100%;
        padding: 2px;
        border-bottom: 3px solid #1366ec;
        background-color: #f2f2f2;
        box-sizing: border-box;
        z-index: 1;
        transition: transform 0.3s ease;
        transform: translateX(var(--active-tab-position));
    }

    .login-input-container {
        position: relative;
        display: flex;
        flex-direction: column;
        margin-top: 5%;
        padding-left: 0;
        padding-right: 0;
        width: 100%;
        height: 50%;
        justify-content: start;
        align-content: center;
        box-sizing: border-box;
    }

    .phone-input,
    .phone-verification-code-input,
    .account-input,
    .password-input {
        position: relative;
        top: 5%;
        display: flex;
        width: 100%;
        height: 15%;
        justify-content: center;
        align-content: center;
    }

    .phone-verification-code-input,
    .password-input {
        top: 25%;
    }

    #phone-prefix {
        position: relative;
        width: 15%;
        height: 100%;
        padding: 2px 2px 2px 2px;
        border-bottom: 1px solid #0336ff;
        background-color: rgba(255, 255, 255, 0);
        box-sizing: border-box;
        font-family: "PingFangSC-Regular", "PingFang SC", sans-serif;
        font-size: 14px;
        line-height: 100%;
        color: #999999;
        text-align: center;
        justify-content: center;
        align-content: center;
    }

    #phone-prefix:disabled {
        background-color: #f0f0f0;
        box-sizing: border-box;
    }

    .phone-input-field,
    .verification-code-input-field,
    .account-input-field,
    .password-input-field {
        position: relative;
        width: 60%;
        height: 100%;
        padding: 2px 2px 2px 2px;
        border-top: 0px solid rgba(255, 255, 255, 0);
        border-left: 0px solid rgba(255, 255, 255, 0);
        border-right: 0px solid rgba(255, 255, 255, 0);
        border-bottom: 1px solid #0336ff;
        background-color: #fefefe;
        box-sizing: border-box;
        font-family: "PingFangSC-Regular", "PingFang SC", sans-serif;
        font-size: 16px;
        color: #000000;
        text-align: left;
        outline: none;
        border-bottom: 1px solid #0052d9;
    }

    .verification-code-input-field {
        width: 45%;
    }

    .account-input-field,
    .password-input-field {
        width: 75%;
    }

    .login-error-message,
    .agreement-error-message {
        position: absolute;
        top: 55%;
        width: 75%;
        margin: 5px auto;
        padding: 5px 0;
        color: #ff4d4f;
        font-size: 14px;
        text-align: left;
        left: 50%;
        transform: translateX(-50%);
    }

    .agreement-error-message {
        top: 0;
        margin-top: 5px;
    }

    #reacquire-code-btn {
        position: relative;
        width: 30%;
        height: 100%;
        padding: 2px 2px 2px 2px;
        border-top: 0px solid rgba(255, 255, 255, 0);
        border-left: 0px solid rgba(255, 255, 255, 0);
        border-right: 0px solid rgba(255, 255, 255, 0);
        border-bottom: 1px solid #0336ff;
        background-color: rgba(215, 215, 215, 0);
        box-sizing: border-box;
        font-family: "Arial", sans-serif;
        color: #989898;
        text-align: center;
        line-height: 25px;
        cursor: pointer;
    }

    #reacquire-code-btn:hover {
        box-sizing: border-box;
        color: #1366ec;
    }

    .user-agreement {
        display: flex;
        position: relative;
        width: 100%;
        height: 10%;
        padding-top: 2%;
        padding-bottom: 2%;
        justify-content: center;
        align-content: center;
    }

    .user-agreement-content {
        display: flex;
        flex-direction: row;
        position: relative;
        width: 80%;
        height: 100%;
        justify-content: center;
        align-items: center;
    }

    #user-agreement-checkbox:checked {
        background-color: #0052d9;
        box-sizing: border-box;
    }

    .account-help {
        display: flex;
        position: relative;
        top: 55%;
        width: 100%;
        height: max-content;
        justify-content: center;
        align-content: center;
    }

    .account-help-content {
        display: flex;
        position: relative;
        width: 75%;
        height: max-content;
        justify-content: space-between;
        align-content: center;
    }

    .forget-account,
    .forget-password {
        border: none;
        height: max-content;
        color: #8f8f8f;
        background-color: rgba(255, 255, 255, 0);
        cursor: pointer;
    }

    .forget-account:hover,
    .forget-password:hover {
        color: #0052d9;
        text-decoration: underline;
    }

    .login-button {
        position: relative;
        width: 75%;
        height: 2.2rem;
        padding: 2px 2px 2px 2px;
        border-radius: 3px;
        border: rgba(255, 255, 255, 0);
        background-color: #0052d9;
        box-sizing: border-box;
        font-family: "Arial", sans-serif;
        font-size: 18px;
        color: #ffffff;
        text-align: center;
        line-height: 25px;
        cursor: pointer;
        margin-bottom: 10px;
    }

    .github-login-button {
        position: relative;
        width: 75%;
        height: 2.2rem;
        padding: 2px 2px 2px 2px;
        border-radius: 3px;
        border: 1px solid #333;
        background-color: #24292e;
        box-sizing: border-box;
        font-family: "Arial", sans-serif;
        font-size: 18px;
        color: #ffffff;
        text-align: center;
        line-height: 25px;
        cursor: pointer;
        display: flex;
        justify-content: center;
        align-items: center;
        margin-bottom: 10px;
    }

    .microsoft-login-button {
        position: relative;
        width: 75%;
        height: 2.2rem;
        padding: 2px 2px 2px 2px;
        border-radius: 3px;
        border: 1px solid #0078d4;
        background-color: #0078d4;
        box-sizing: border-box;
        font-family: "Arial", sans-serif;
        font-size: 18px;
        color: #ffffff;
        text-align: center;
        line-height: 25px;
        cursor: pointer;
        display: flex;
        justify-content: center;
        align-items: center;
    }

    a {
        font-size: 12px;
        box-sizing: border-box;
        font-family: "PingFangSC-Regular", "PingFang SC", sans-serif;
        color: rgb(19, 102, 236);
        text-align: left;
        line-height: 22px;
        cursor: pointer;
        white-space: nowrap;
    }

    .register-content {
        display: flex;
        flex-direction: column;
        position: relative;
        top: 10%;
        width: 100%;
        height: 90%;
        justify-content: start;
        justify-items: center;
    }

    .contact-info {
        position: relative;
        display: flex;
        flex-direction: column;
        width: 100%;
        height: max-content;
    }

    @media (max-width: 768px) {
        .login-container {
            width: 608px;
            height: 409px;
        }
    }
</style>
