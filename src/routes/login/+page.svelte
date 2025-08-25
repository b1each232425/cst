<script>
  import MessageBox from '$lib/components/MessageBox/MessageBox.svelte';
  import { goto } from '$app/navigation';
  import { isValidPhoneNumber, parsePhoneNumberWithError } from 'libphonenumber-js';

  const DomainsMap = {
    'cst.school^superAdmin': '超级管理员',
    'cst.school^admin': '管理员',
    'cst.school^teacher': '教师',
    'cst.school.academicAffair^admin': '教务员',
    'cst.school^examSupervisor': '监考员',
    'cst.school^examGrader': '阅卷员',
    'cst.school.examSite^admin': '考点负责人',
    'cst.school^scoreChecker': '核分员',
    'cst.school^student': '学生',
  };

  // 登录页面组件
  let credential = $state('');
  let password = $state('');
  let agreeTerms = $state(false);

  // Tab切换状态
  let activeTab = $state('phone'); // 'phone', 'account', 'id'

  // 不同tab的输入字段
  let phoneNumber = $state('');
  let accountEmail = $state('');
  let idNumber = $state('');

  // 是否在消息提示框展示超链接
  let isShowpact = $state(false);

  // 区号选择
  let selectedCountryCode = $state('+86');
  const countryCodes = [
    { code: '+86', name: '中国大陆', country: 'CN' },
    { code: '+852', name: '中国香港', country: 'HK' },
    { code: '+853', name: '中国澳门', country: 'MO' },
    { code: '+886', name: '台湾', country: 'TW' },
    { code: '+1', name: '美国/加拿大', country: 'US' },
    { code: '+44', name: '英国', country: 'GB' },
    { code: '+81', name: '日本', country: 'JP' },
    { code: '+82', name: '韩国', country: 'KR' },
  ];

  // 手机号验证状态
  let phoneValidationError = $state('');
  let isPhoneValid = $state(true);

  // 证件类型选择
  let selectedIdType = $state('居民身份证');
  const idTypes = ['居民身份证', '准考证', '护照', '港澳通行证', '台胞证', '军官证'];

  /**
   * 验证手机号格式
   * @param {string} phone - 手机号
   * @param {string} countryCode - 国家代码
   * @returns {boolean} 是否有效
   */
  function validatePhoneNumber(phone, countryCode) {
    if (!phone.trim()) {
      phoneValidationError = '';
      isPhoneValid = true;
      return true;
    }

    const currentCountry = countryCodes.find((c) => c.code === countryCode);
    if (!currentCountry) {
      phoneValidationError = '不支持的国家代码';
      isPhoneValid = false;
      return false;
    }

    const fullPhoneNumber = countryCode + phone;

    try {
      const isValid = isValidPhoneNumber(fullPhoneNumber);

      if (!isValid) {
        phoneValidationError = `请输入有效手机号`;
        isPhoneValid = false;
        return false;
      }

      phoneValidationError = '';
      isPhoneValid = true;
      return true;
    } catch (error) {
      console.log('验证手机号格式失败: ', error);
      phoneValidationError = `请输入有效手机号`;
      isPhoneValid = false;
      return false;
    }
  }

  /**
   * 手机号输入变化处理
   */
  function handlePhoneNumberChange() {
    validatePhoneNumber(phoneNumber, selectedCountryCode);
  }

  /**
   * 国家代码变化处理
   */
  function handleCountryCodeChange() {
    if (phoneNumber) {
      validatePhoneNumber(phoneNumber, selectedCountryCode);
    }
  }

  /**
   * 切换tab页面
   * @param {string} tab - tab标识
   */
  function switchTab(tab) {
    activeTab = tab;
    // 清空所有输入字段
    phoneNumber = '';
    accountEmail = '';
    idNumber = '';
    password = '';
    // 重置选择项
    selectedCountryCode = '+86';
    selectedIdType = '居民身份证';
    // 重置手机号验证状态
    phoneValidationError = '';
    isPhoneValid = true;
  }

  /**
   * 获取当前tab的凭证值
   * @returns {string} 当前tab的输入值
   */
  function getCurrentCredential() {
    switch (activeTab) {
      case 'phone':
        // 手机号登录时使用libphonenumber-js标准化处理
        return getFormattedPhoneNumber();
      case 'account':
        return accountEmail;
      case 'id':
        return idNumber;
      default:
        return credential;
    }
  }

  /**
   * 获取标准化的手机号格式
   * @returns {string} 标准化后的手机号
   */
  function getFormattedPhoneNumber() {
    if (!phoneNumber.trim()) {
      return '';
    }

    const fullPhoneNumber = selectedCountryCode + phoneNumber;

    try {
      // 使用parsePhoneNumber解析手机号
      const parsedPhone = parsePhoneNumberWithError(fullPhoneNumber);

      if (parsedPhone && parsedPhone.isValid()) {
        // 返回E.164格式的手机号（国际标准格式）
        return parsedPhone.format('E.164');
      } else {
        // 如果解析失败，返回原始拼接格式
        console.log('手机号解析失败，使用原始格式');
        return fullPhoneNumber;
      }
    } catch (error) {
      console.log('手机号格式化失败: ', error);
      // 如果出现异常，返回原始拼接格式
      return fullPhoneNumber;
    }
  }

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
    // 如果是手机号登录，先验证和处理手机号
    if (activeTab === 'phone') {
      if (!validatePhoneNumber(phoneNumber, selectedCountryCode)) {
        showMessage('提示', phoneValidationError || '请输入有效的手机号');
        return;
      }
    }

    const currentCredential = getCurrentCredential();
    if (!currentCredential || !password) {
      showMessage('提示', '请输入登录凭证和密码');
      return;
    }

    if (!agreeTerms) {
      showMessage('提示', '您还没有同意用户协议，请先同意用户协议：');
      return;
    }

    fetch('/api/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name: currentCredential,
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
   * 获取用户信息，选择登录角色
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

        switch (myDomains.length) {
          case 0:
            showMessage('提示', '您没有可用的登录角色，请联系管理员');
            return;
          case 1:
            // 如果只有一个角色，直接确认选择
            confirmRoleSelection(myDomains[0]);
            return;
          default:
            // 多个角色时弹出选择框
            selectedRole = myDomains[0]; // 默认选择第一个角色
            roleSelectVisible = true;
            break;
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
      goto('/student/practice');
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
    if (messageBoxContent === '您还没有同意用户协议，请先同意用户协议：') {
      agreeTerms = true;
    }
  }

  // 处理注册按钮点击事件
  function handleRegister() {
    goto('/login/register');
  }
</script>

<div class="login-container">
  <div class="login-panel">
    <!-- 注册按钮 -->
    <button class="register-btn" onclick={handleRegister}>注册</button>

    <!-- 左侧登录表单 -->
    <div class="login-form">
      <h1 class="title">3min</h1>

      <!-- Tab导航 -->
      <div class="tab-navigation">
        <button class="tab-button" class:active={activeTab === 'phone'} onclick={() => switchTab('phone')}>
          手机号登录
        </button>
        <button class="tab-button" class:active={activeTab === 'account'} onclick={() => switchTab('account')}>
          帐号/邮箱登录
        </button>
        <button class="tab-button" class:active={activeTab === 'id'} onclick={() => switchTab('id')}>
          证件号登录
        </button>
      </div>

      <div class="form-content">
        <!-- 输入框容器 -->
        <div class="inputs-container">
          <!-- 手机号登录 -->
          {#if activeTab === 'phone'}
            <div class="input-wrapper">
              <div class="phone-input-container" class:error={!isPhoneValid}>
                <div class="country-code-wrapper">
                  <select
                    bind:value={selectedCountryCode}
                    class="country-code-select-hidden"
                    onchange={handleCountryCodeChange}
                  >
                    {#each countryCodes as country}
                      <option value={country.code}>{country.code}{country.name}</option>
                    {/each}
                  </select>
                  <span class="country-code-display">{selectedCountryCode}</span>
                  <img src="/common/arrow-down.svg" alt="下拉箭头" class="country-code-arrow" />
                </div>
                <div class="input-divider"></div>
                <input
                  type="tel"
                  bind:value={phoneNumber}
                  placeholder="请输入手机号"
                  class="phone-input"
                  class:error={!isPhoneValid}
                  oninput={handlePhoneNumberChange}
                />
              </div>
              {#if phoneValidationError}
                <div class="validation-error">{phoneValidationError}</div>
              {/if}
            </div>
          {/if}

          <!-- 帐号/邮箱登录 -->
          {#if activeTab === 'account'}
            <div class="input-wrapper">
              <input type="text" bind:value={accountEmail} placeholder="请输入帐号/邮箱" class="form-input" />
            </div>
          {/if}

          <!-- 证件号登录 -->
          {#if activeTab === 'id'}
            <div class="input-wrapper">
              <div class="id-input-container">
                <select bind:value={selectedIdType} class="id-type-select">
                  {#each idTypes as idType}
                    <option value={idType}>{idType}</option>
                  {/each}
                </select>
                <div class="input-divider"></div>
                <input type="text" bind:value={idNumber} placeholder="请输入证件号" class="id-input" />
              </div>
            </div>
          {/if}

          <div class="input-wrapper">
            <input type="password" bind:value={password} placeholder="请输入密码" class="form-input" />
          </div>
        </div>

        <button type="button" class="login-btn" onclick={handleLogin}>登录</button>

        <div class="agreement-container">
          <label class="agreement-label">
            <input type="checkbox" bind:checked={agreeTerms} class="agreement-checkbox" />
            <span class="agreement-text">
              我已阅读并同意<a href="#">用户协议</a>、
              <a href="#">隐私政策</a>、
              <a href="#">产品服务协议</a>
            </span>
          </label>
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
>
  {#if messageBoxContent === '您还没有同意用户协议，请先同意用户协议：'}
    <div class="agreement-messagebox-container">
      <span class="agreement-text">
        我已阅读并同意<a href="#">用户协议</a>、
        <a href="#">隐私政策</a>、
        <a href="#">产品服务协议</a>
      </span>
    </div>
  {/if}
</MessageBox>

<!-- 角色选择对话框 -->
{#if roleSelectVisible}
  <div class="role-select-overlay">
    <div class="role-select-dialog">
      <div class="role-select-header">
        <h3 class="role-select-title">选择登录角色</h3>
        <button class="role-select-close" onclick={cancelRoleSelection}> × </button>
      </div>
      <div class="role-select-content">
        <div class="role-options">
          {#each availableRoles as role (role)}
            <label class="role-option">
              <input type="radio" bind:group={selectedRole} value={role} name="role" class="role-radio" />
              <span class="role-label">{DomainsMap[role] || role}</span>
            </label>
          {/each}
        </div>
      </div>
      <div class="role-select-footer">
        <button class="role-btn role-btn-cancel" onclick={cancelRoleSelection}> 取消 </button>
        <button class="role-btn role-btn-confirm" onclick={() => confirmRoleSelection()}> 确定 </button>
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
    max-width: 40rem;
    width: 100%;
    position: relative; /* 让子元素能用绝对定位 */

    .register-btn {
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

    .register-btn:hover {
      background: var(--primary-color);
    }
  }

  .login-form {
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

  /* Tab导航样式 */
  .tab-navigation {
    display: flex;
    justify-content: center;
    margin-bottom: 1.5rem;
    border-bottom: 1px solid #e0e0e0;
  }

  .tab-button {
    background: none;
    border: none;
    padding: 0.75rem 1.5rem;
    font-size: 0.9rem;
    color: #666;
    cursor: pointer;
    border-bottom: 2px solid transparent;
    transition: all 0.3s ease;
    white-space: nowrap;
  }

  .tab-button:hover {
    color: #0052d9;
    background-color: rgba(0, 82, 217, 0.05);
    border-top-left-radius: 4px;
    border-top-right-radius: 4px;
  }

  .tab-button.active {
    color: #0052d9;
    border-bottom-color: #0052d9;
    font-weight: 500;
  }

  /* 响应式设计 */
  @media (max-width: 768px) {
    .tab-navigation {
      flex-wrap: wrap;
      gap: 0.5rem;
    }

    .tab-button {
      padding: 0.5rem 1rem;
      font-size: 0.8rem;
      flex: 1;
      min-width: 0;
    }
  }

  @media (max-width: 480px) {
    .tab-navigation {
      flex-direction: column;
      border-bottom: none;
    }

    .tab-button {
      border-bottom: 1px solid #e0e0e0;
      border-radius: 0;
      text-align: center;
    }

    .tab-button.active {
      background-color: rgba(0, 82, 217, 0.1);
      border-bottom-color: #e0e0e0;
    }
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
    gap: 1rem;
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

  /* 手机号输入容器 */
  .phone-input-container {
    display: flex;
    align-items: center;
    gap: 0;
    width: 100%;
    height: 100%;
  }

  .country-code-wrapper {
    position: relative;
    min-width: 4rem;
    height: 100%;
    display: flex;
    align-items: center;
  }

  .country-code-select-hidden {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    opacity: 0;
    cursor: pointer;
    border: none;
    outline: none;
    background: transparent;
    font-size: 1rem;
  }

  .country-code-display {
    pointer-events: none;
    font-size: 1rem;
    color: #333;
    padding-right: 0.5rem;
    white-space: nowrap;
  }

  .country-code-arrow {
    pointer-events: none;
    width: 1.3rem;
    height: 1.3rem;
    margin-left: 0.5rem;
    transition: opacity 0.2s;
  }

  .country-code-wrapper:hover .country-code-arrow {
    opacity: 0.8;
  }

  .input-divider {
    width: 1px;
    height: 1.5rem;
    background-color: #e0e0e0;
    margin: 0 0.75rem;
    flex-shrink: 0;
  }

  .phone-input {
    flex: 1;
    border: none;
    outline: none;
    font-size: 1rem;
    background: transparent;
    color: #333;
    height: 100%;
  }

  .phone-input::placeholder {
    color: #999;
    font-size: 1rem;
  }

  /* 证件号输入容器 */
  .id-input-container {
    display: flex;
    align-items: center;
    gap: 0;
    width: 100%;
    height: 100%;
  }

  .id-type-select {
    border: none;
    outline: none;
    background: transparent;
    font-size: 1rem;
    color: #333;
    cursor: pointer;
    padding-right: 0.5rem;
    min-width: 4rem;
    height: 100%;
  }

  .id-input {
    flex: 1;
    border: none;
    outline: none;
    font-size: 1rem;
    background: transparent;
    color: #333;
    height: 100%;
  }

  .id-input::placeholder {
    color: #999;
    font-size: 1rem;
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

  .agreement-messagebox-container {
    display: flex;
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

  /* 手机号验证错误样式 */
  .phone-input-container.error {
    border-color: #ff4757;
  }

  .phone-input.error {
    border-color: #ff4757;
  }

  .validation-error {
    color: #ff4757;
    font-size: 0.8rem;
    padding-left: 0.5rem;
    display: flex;
    align-items: center;
    gap: 0.25rem;
  }

  .validation-error::before {
    content: '⚠';
    font-size: 0.9rem;
  }

  /* 响应式设计 */
  @media (max-width: 1200px) {
    .login-panel {
      flex-direction: column;
      max-width: 60%;
      min-width: 30rem;
      width: 100%;
    }

    .login-form {
      max-width: 80%;
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

  @media (max-width: 768px) {
    .inputs-container {
      gap: 0.8rem;
    }

    .input-wrapper {
      padding: 0.6rem 0.8rem;
      min-height: 2rem;
    }

    .form-input,
    .phone-input,
    .id-input {
      font-size: 0.9rem;
    }

    .country-code-wrapper,
    .id-type-select {
      min-width: 2.8rem;
    }

    .country-code-display,
    .id-type-select {
      font-size: 0.9rem;
    }

    .input-divider {
      height: 1.2rem;
      margin: 0 0.5rem;
    }
  }

  @media (max-width: 480px) {
    .login-form {
      padding: 3rem 2rem;
    }

    .inputs-container {
      gap: 0.7rem;
    }

    .input-wrapper {
      padding: 0.5rem 0.7rem;
      min-height: 2rem;
    }

    .phone-input-container,
    .id-input-container {
      gap: 0;
    }

    .country-code-wrapper,
    .id-type-select {
      min-width: 2.2rem;
    }

    .country-code-display,
    .id-type-select {
      font-size: 0.85rem;
    }

    .form-input,
    .phone-input,
    .id-input {
      font-size: 0.85rem;
    }
  }

  /* 针对 Chrome/Edge Safari */
  input:-webkit-autofill,
  input:-webkit-autofill:hover,
  input:-webkit-autofill:focus,
  input:-webkit-autofill:active {
    -webkit-box-shadow: 0 0 0px 1000px white inset; /* 覆盖背景色 */
    -webkit-text-fill-color: #333; /* 字体颜色 */
    transition: background-color 5000s ease-in-out 0s; /* 防止闪烁 */
  }
</style>
