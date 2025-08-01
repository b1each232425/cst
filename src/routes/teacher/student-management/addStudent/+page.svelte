<script>
  import Upload from '$lib/components/Upload/UploadImage.svelte';
  import Title from '$lib/components/Title/Title.svelte';
  import InputBox from '$lib/components/Input/InputBox.svelte';
  import InforInput from '$lib/components/Input/InforInput.svelte';
  import Select from '$lib/components/Select/Select.svelte';
  import Option from '$lib/components/Select/Option.svelte';
  import Button from '$lib/components/Button/Button.svelte';
  import MessageBox from '$lib/components/MessageBox/MessageBox.js';
  import { toast } from '$lib/components/Toast/Toast.js';
  import { validMobile, validEmail, validIdCard } from '$lib/utils/validate.js';
  import { goto } from '$app/navigation';
  import { onMount } from 'svelte';

  // 信息状态
  let name = $state('');
  let gender = $state('');
  let idCardNumber = $state('');
  let account = $state('');
  let password = $state('');
  let phone = $state('');
  let email = $state('');

  // 上传文件相关状态TODO:后续需上传后端
  let idCardFrontFile = $state(null);
  let idCardBackFile = $state(null);

  // 上传合规标记
  let idCardFrontOk = $state(false);
  let idCardBackOk = $state(false);

  let hasError = false;
  let formErrors = $state({
    name: '',
    gender: '',
    phone: '',
    account: '',
    password: '',
    email: '',
    idCardNumber: '',
    idCardFront: '',
    idCardBack: '',
  });

  function handleFrontUpload(file) {
    idCardFrontFile = file;
    idCardFrontOk = true;
    formErrors.idCardFront = '';
  }

  function handleBackUpload(file) {
    idCardBackFile = file;
    idCardBackOk = true;
    formErrors.idCardBack = '';
  }

  function validatePhone() {
    if (!phone.trim()) {
      formErrors.phone = '手机号不能为空';
      hasError = true;
    } else if (!validMobile(phone)) {
      formErrors.phone = '请输入正确的手机号';
      hasError = true;
    } else {
      formErrors.phone = '';
    }
  }

  function validateEmail() {
    if (email.trim() && !validEmail(email)) {
      formErrors.email = '请输入正确的邮箱';
      hasError = true;
    } else {
      formErrors.email = '';
    }
  }

  function validateIdCard() {
    if (!idCardNumber.trim()) {
      formErrors.idCardNumber = '身份证号不能为空';
      hasError = true;
    } else if (!validIdCard(idCardNumber)) {
      formErrors.idCardNumber = '请输入正确的身份证号';
      hasError = true;
    } else {
      formErrors.idCardNumber = '';
    }
  }

  function validateName() {
    if (!name.trim()) {
      formErrors.name = '姓名不能为空';
      hasError = true;
    } else if (name.length < 1 || name.length > 20) {
      formErrors.name = '姓名长度需为1-20个字符';
      hasError = true;
    } else {
      formErrors.name = '';
    }
  }

  function validateGender() {
    if (!gender.trim()) {
      formErrors.gender = '性别不能为空';
      hasError = true;
    } else {
      formErrors.gender = '';
    }
  }

  function validateIdCardImage() {
    if (!idCardFrontOk) {
      formErrors.idCardFront = '请上传身份证正面';
      hasError = true;
    }
    if (!idCardBackOk) {
      formErrors.idCardBack = '请上传身份证反面';
      hasError = true;
    }
  }

  function cancelForm() {
    MessageBox({
      title: '确认退出',
      content: '你还未提交数据，确定要退出吗？',
      onConfirm: () => {
        goto('/teacher/student-management');
      },
    });
  }

  function submitForm() {
    // 重置错误状态
    formErrors = {
      name: '',
      gender: '',
      phone: '',
      account: '',
      password: '',
      email: '',
      idCardNumber: '',
      idCardFront: '',
      idCardBack: '',
    };
    hasError = false;

    validateName();
    validatePhone();
    validateEmail();
    validateIdCard();
    validateGender();
    validateIdCardImage();

    if (hasError) {
      toast.warning('请检查输入信息是否正确！');
      return;
    }

    const payload = {
      Account: account.trim(),
      OfficialName: name.trim() || null,
      Gender: gender.trim() || null,
      MobilePhone: phone.trim() || null,
      Email: email.trim() || null,
      IDCardNo: idCardNumber.trim() || null,
      IDCardType: '居民身份证',
      Domains: ['cst.school^student'],
    };
    const requestBody = { data: [payload] };
    fetch('/api/user', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(requestBody),
    })
      .then((res) => {
        if (!res.ok) {
          return res.text().then((msg) => {
            throw new Error(`请求失败: ${res.status} ${res.statusText} - ${msg}`);
          });
        }
        return res.json();
      })
      .then(() => goto('/teacher/student-management'))
      .catch((err) => {
        toast.error(`创建用户失败: ${err.message}`);
      });
  }

  onMount(() => {
    // 生成随机账号
    fetch('/api/user/new-account', {
      method: 'GET',
      credentials: 'include',
    })
      .then((res) => {
        if (!res.ok) {
          return res.text().then((msg) => {
            throw new Error(`获取账号失败: ${res.status} ${res.statusText} - ${msg}`);
          });
        }
        return res.json();
      })
      .then((json) => {
        if (json.status === 0 && typeof json.data === 'string') {
          account = json.data;
        } else {
          throw new Error(json.msg || '获取账号失败');
        }
      })
      .catch((err) => {
        toast.error(`获取账号失败：${err.message}`);
        console.error(err);
      });

    // 固定密码 TODO:后续需改为用户输入
    password = 'abc123456';
  });
</script>

<div class="add-student-container">
  <!-- 实名信息部分 -->
  <div class="section-container">
    <Title title="实名信息" line={false} />
    <div class="real-info-container">
      <!-- 身份证正面 -->
      <div class="upload-container">
        <div class="form-label">
          <span class="required-mark">*</span>
          <span class="label-text">身份证正面</span>
        </div>
        <div class="form-upload-container">
          <Upload
            show_label={false}
            accept="image/*"
            show_message
            message="仅支持 JPG 和 PNG 格式。最大文件尺寸 10 MB。"
            limit_size="10"
            onfile={handleFrontUpload}
          ></Upload>
          <div class="error-message" class:show={formErrors.idCardFront}>
            {formErrors.idCardFront}
          </div>
        </div>
      </div>

      <!-- 身份证反面 -->
      <div class="upload-container">
        <div class="form-label">
          <span class="required-mark">*</span>
          <span class="label-text">身份证反面</span>
        </div>
        <div class="form-upload-container">
          <Upload
            show_label
            required
            accept="image/*"
            show_message
            message="仅支持 JPG 和 PNG 格式。最大文件尺寸 10 MB。"
            limit_size="10"
            onfile={handleBackUpload}
          ></Upload>
          <div class="error-message" class:show={formErrors.idCardBack}>
            {formErrors.idCardBack}
          </div>
        </div>
      </div>

      <!-- 姓名 -->
      <div class="form-item">
        <div class="form-label">
          <span class="required-mark">*</span>
          <span class="label-text">姓名</span>
        </div>
        <div class="form-input-container">
          <InputBox placeholder="请输入姓名" type="text" bind:value={name} showLabel={false}></InputBox>
          <div class="error-message" class:show={formErrors.name}>
            {formErrors.name}
          </div>
        </div>
      </div>

      <!-- 性别 -->
      <div class="gender-container">
        <div class="form-label">
          <span class="required-mark">*</span>
          <span class="label-text">性别</span>
        </div>
        <div class="form-input-container">
          <Select bind:value={gender} placeholder="请选择性别">
            <Option value="男" label="男"></Option>
            <Option value="女" label="女"></Option>
          </Select>
          <div class="error-message" class:show={formErrors.gender}>
            {formErrors.gender}
          </div>
        </div>
      </div>

      <!-- 身份证号 -->
      <div class="form-item">
        <div class="form-label">
          <span class="required-mark">*</span>
          <span class="label-text">身份证号</span>
        </div>
        <div class="form-input-container">
          <InputBox placeholder="请输入身份证号" type="text" bind:value={idCardNumber} showLabel={false}></InputBox>
          <div class="error-message" class:show={formErrors.idCardNumber}>
            {formErrors.idCardNumber}
          </div>
        </div>
      </div>
    </div>
  </div>

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
            placeholder="请输入账号"
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

      <!-- 手机号 -->
      <div class="form-item">
        <div class="form-label">
          <span class="required-mark">*</span>
          <span class="label-text">手机号</span>
        </div>
        <div class="form-input-container">
          <InputBox placeholder="请输入手机号" type="text" bind:value={phone} showLabel={false}></InputBox>
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
          <InputBox placeholder="请输入邮箱" type="email" bind:value={email} showLabel={false}></InputBox>
          <div class="error-message" class:show={formErrors.email}>
            {formErrors.email}
          </div>
        </div>
      </div>
    </div>
  </div>

  <!-- 按钮区域 -->
  <div class="button-container">
    <Button type="info" plain onclick={cancelForm}>取消</Button>
    <Button type="primary" onclick={submitForm}>提交</Button>
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

  .section-container {
    margin-bottom: 30px;
  }

  .real-info-container {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 30px;
    flex: 1;
    margin-top: 30px;
    margin-bottom: 30px;
    width: 85%;

    @media (max-width: 1200px) {
      margin-top: 20px;
      margin-bottom: 20px;
    }

    @media (max-width: 768px) {
      margin-top: 10px;
      margin-bottom: 10px;
    }

    @media (min-resolution: 1.25dppx) {
      margin-top: 20px;
      margin-bottom: 20px;
      gap: 20px;
    }

    .form-label {
      font-size: $normal-font-size;
      color: $gray-font-color;
      text-align: right;
      min-width: 260px; //位置保持一致

      @media (min-resolution: 1.25dppx) {
        min-width: 240px;
      }

      .required-mark {
        color: red;
      }
    }

    .upload-container {
      display: flex;
      align-items: center;
      gap: 20px;

      .form-upload-container {
        position: relative;
        display: flex;
      }
    }

    .form-item {
      display: flex;
      align-items: center;
      gap: 20px;

      .form-input-container {
        position: relative;
        display: flex;
        width: 30%;
      }
    }

    .gender-container {
      display: flex;
      align-items: center;
      gap: 20px;

      .form-input-container {
        position: relative;
        display: flex;
        width: 30%;
      }
    }
  }

  .basic-info-container {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 30px;
    flex: 1;
    margin-top: 30px;
    margin-bottom: 30px;
    width: 85%;

    @media (max-width: 1200px) {
      margin-top: 20px;
      margin-bottom: 20px;
    }

    @media (max-width: 768px) {
      margin-top: 10px;
      margin-bottom: 10px;
    }

    @media (min-resolution: 1.25dppx) {
      margin-top: 20px;
      margin-bottom: 20px;
      gap: 20px;
    }

    .form-item {
      display: flex;
      align-items: center;
      gap: 20px;

      .form-label {
        font-size: $normal-font-size;
        color: $gray-font-color;
        text-align: right;
        min-width: 260px; //位置保持一致

        @media (min-resolution: 1.25dppx) {
          min-width: 240px;
        }

        .required-mark {
          color: red;
        }
      }

      .form-input-container {
        position: relative;
        display: flex;
        width: 30%;
      }
    }
  }

  .error-message {
    color: #e34d59;
    font-size: 12px;
    position: absolute;
    top: 100%;
    left: 0;
    line-height: 1.4;
    display: none;
  }

  .error-message.show {
    display: block;
  }

  .button-container {
    display: flex;
    justify-content: center;
    gap: 20px;
    margin-top: 90px;

    @media (max-width: 1200px) {
      gap: 10px;
      margin-top: 80px;
    }

    @media (min-resolution: 1.25dppx) {
      gap: 20px;
      margin-top: 60px;
    }

    @media (min-resolution: 2.2dppx) {
      gap: 20px;
      margin-top: 40px;
    }
  }
</style>
