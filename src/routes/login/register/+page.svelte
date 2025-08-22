<script>
  import { goto } from '$app/navigation';

  let email = $state('');
  let password = $state('');
  let confirm_password = $state('');
  let code = $state('');

  // 错误信息
  let email_error = $state('');
  let password_error = $state('');
  let confirm_password_error = $state('');
  let code_error = $state('');

  // 处理返回登录页面按钮点击事件
  function handleReturn() {
    goto('/login');
  }

  // 处理获取验证码按钮点击事件
  function handleGetCode() {
    alert('获取验证码');
  }

  // 处理注册按钮点击事件
  async function handleRegister() {
    // 清空错误
    email_error = '';
    password_error = '';
    confirm_password_error = '';
    code_error = '';

    // 前端校验
    if (!email) email_error = '请输入邮箱';

    if (!password) password_error = '请输入密码';

    if (!confirm_password) confirm_password_error = '请再次输入密码';

    if (!code) code_error = '请输入验证码';

    if (password && confirm_password && password !== confirm_password) {
      password_error = '两次输入的密码不一致';
      confirm_password_error = '两次输入的密码不一致';
    }

    // 如果有错误就返回
    if (email_error || password_error || confirm_password_error || code_error) {
      return;
    }

    // 模拟发送请求
    try {
      // 假设这里是后端接口调用
      const res = await fakeRegisterApi({ email, password, code });

      if (!res.success) {
        // 后端返回的错误，按字段提示
        if (res.field === 'email') email_error = res.message;
        if (res.field === 'code') code_error = res.message;
      } else {
        alert('注册成功！');
        goto('/login');
      }
    } catch (err) {
      console.error('注册请求失败', err);
    }
  }

  // 模拟后端 API
  function fakeRegisterApi({ email, password, code }) {
    return new Promise((resolve) => {
      setTimeout(() => {
        if (!email.includes('@')) {
          resolve({ success: false, field: 'email', message: '邮箱格式不正确' });
        } else if (code !== '1234') {
          resolve({ success: false, field: 'code', message: '验证码错误' });
        } else {
          resolve({ success: true });
        }
      }, 1000);
    });
  }
</script>

<div class="register-container">
  <div class="register-panel">
    <!-- 返回按钮 -->
    <button class="return-btn" onclick={handleReturn}>返回</button>

    <!-- 左侧登录表单 -->
    <div class="register-form">
      <h1 class="title">3min</h1>

      <div class="form-content">
        <!-- 输入框容器 -->
        <div class="inputs-container">
          <!-- 输入注册邮箱 -->
          <div class="input-group">
            <div class="input-wrapper">
              <input
                oninput={() => {
                  email ? (email_error = '') : (email_error = '请输入邮箱');
                }}
                bind:value={email}
                type="text"
                placeholder="请输入邮箱"
                class="form-input"
              />
            </div>
            <div class="error-text">{email_error}</div>
          </div>

          <!-- 输入密码 -->
          <div class="input-group">
            <div class="input-wrapper">
              <input
                oninput={() => {
                  password ? (password_error = '') : (password_error = '请输入密码');
                }}
                bind:value={password}
                type="password"
                placeholder="请输入密码"
                class="form-input"
              />
            </div>
            <div class="error-text">{password_error}</div>
          </div>

          <!-- 再次输入确认密码 -->
          <div class="input-group">
            <div class="input-wrapper">
              <input
                oninput={() => {
                  confirm_password ? (confirm_password_error = '') : (confirm_password_error = '请再次输入密码');
                }}
                bind:value={confirm_password}
                type="password"
                placeholder="请再次输入密码"
                class="form-input"
              />
            </div>
            <div class="error-text">{confirm_password_error}</div>
          </div>

          <!-- 输入验证码 -->
          <div class="input-group">
            <div class="input-wrapper code-wrapper">
              <input
                oninput={() => {
                  code ? (code_error = '') : (code_error = '请输入验证码');
                }}
                bind:value={code}
                type="text"
                placeholder="请输入验证码"
                class="form-input"
              />
              <button type="button" class="code-btn" onclick={handleGetCode}>获取验证码</button>
            </div>
            <div class="error-text">{code_error}</div>
          </div>
        </div>

        <button type="button" class="register-btn" onclick={handleRegister}>注册</button>
      </div>
    </div>
  </div>
</div>

<style>
  @import '/src/lib/styles/global.css';

  :global(body) {
    overflow: hidden;
  }

  .register-container {
    display: flex;
    justify-content: center;
    align-items: center;
    min-height: 100vh;
    background-color: #f5f5f5;
    padding: 2rem;
    transform: translateY(-3rem);
  }

  .register-panel {
    display: flex;
    background: white;
    border-radius: var(--border-radius-lg);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
    overflow: hidden;
    max-width: 40rem;
    width: 100%;
    position: relative; /* 让子元素能用绝对定位 */

    .return-btn {
      position: absolute;
      background: #007bff;
      color: white;
      border: none;
      border-end-end-radius: var(--border-radius-lg);
      padding: 6px 12px;
      font-size: 1rem;
      cursor: pointer;
      transition: background 0.2s;
    }

    .return-btn:hover {
      background: var(--primary-color);
    }
  }

  .register-form {
    flex: 1;
    padding: 4rem 5.5rem;
    min-width: 0;
    max-width: 100%;
  }

  .title {
    font-size: 2.5rem;
    font-weight: bold;
    color: var(--primary-color);
    margin: 0 0 1.5rem 0;
    text-align: center;
  }

  .form-content {
    display: flex;
    flex-direction: column;
    gap: 1.5rem;
  }

  /* 输入框容器 */
  .inputs-container {
    display: flex;
    flex-direction: column;
  }

  /* 每个输入框组 */
  .input-group {
    display: flex;
    flex-direction: column;
    margin-bottom: 0.5rem; /* 保持整体间距 */
  }

  /* 错误提示固定高度 */
  .error-text {
    height: 1rem; /* 固定高度 */
    color: red;
    font-size: 0.8rem;
    margin-left: 0.25rem;
    line-height: 1rem; /* 垂直居中 */
  }

  /* 封闭容器样式 */
  .input-wrapper {
    border: 1px solid #e0e0e0;
    border-radius: 8px;
    padding: 0.75rem 1rem;
    background: #fff;
    transition: border-color 0.3s ease;
    min-height: 2rem;
    display: flex;
    align-items: center;
  }

  .input-wrapper:focus-within {
    border-color: var(--primary-color);
    box-shadow: 0 0 0 2px rgba(0, 82, 217, 0.1);
  }

  /* 通用输入框样式 */
  .form-input {
    width: 100%;
    border: none;
    outline: none;
    font-size: 1rem;
    background: transparent;
    color: #333;
  }

  .form-input::placeholder {
    color: #999;
    font-size: 1rem;
  }

  /* 验证码容器，继承 input-wrapper 基础样式 */
  .code-wrapper {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 0.5rem; /* 输入框和按钮的间距 */
  }

  /* 获取验证码按钮 */
  .code-btn {
    background: white;
    color: #007bff;
    border: none;
    border-left: 1px solid #e0e0e0; /* 灰色竖线 */
    padding: 0.4rem 0.8rem;
    font-size: 0.9rem;
    cursor: pointer;
    white-space: nowrap; /* 避免文字换行 */
    transition: color 0.2s;
  }

  .code-btn:hover {
    color: #0056b3;
  }

  .code-btn:disabled {
    color: #ccc;
    cursor: not-allowed;
  }

  .code-btn:disabled {
    background: #ccc;
    cursor: not-allowed;
  }

  .register-btn {
    background: var(--primary-color);
    color: white;
    border: none;
    border-radius: 4px;
    padding: 1rem;
    font-size: 1rem;
    cursor: pointer;
    transition: background-color 0.2s;
    width: 100%;
  }

  .register-btn:hover {
    background: var(--primary-hover);
  }

  /* 响应式设计 */
  @media (max-width: 1200px) {
    .register-panel {
      flex-direction: column;
      max-width: 60%;
      min-width: 30rem;
      width: 100%;
    }

    .register-form {
      max-width: 80%;
    }
  }

  @media (max-width: 768px) {
    .inputs-container {
      gap: 0.8rem;
    }

    .input-wrapper {
      padding: 0.6rem 0.8rem;
      min-height: 2rem;
    }

    .form-input {
      font-size: 0.9rem;
    }
  }

  @media (max-width: 480px) {
    .register-form {
      padding: 3rem 2rem;
    }

    .inputs-container {
      gap: 0.7rem;
    }

    .input-wrapper {
      padding: 0.5rem 0.7rem;
      min-height: 2rem;
    }

    .form-input {
      font-size: 0.85rem;
    }
  }
</style>
