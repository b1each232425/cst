<script>
  /**
   * @description 输入框组件
   * @param {string} value 输入框的值
   * @param {string} label 标签文字
   * @param {string} type 输入框类型
   * @param {string} placeholder 占位符
   * @param {boolean} request 是否需要*号
   * @param {boolean} showLabel 是否显示标签
   * @param {boolean} readonly 是否只读
   * @param {boolean} disabled 是否禁用
   * @param {boolean} clearable 是否可清除
   * @param {boolean} round 是否圆角
   * @param {function} onInput 输入框值改变时的回调函数
   */
  let {
    value = $bindable(),
    label = '标签文字',
    type = 'text',
    placeholder = '请输入信息',
    request = false,
    showLabel = true,
    readonly = false,
    disabled = false,
    clearable = true,
    round = false,
    onInput = () => {},
  } = $props();
  let inputType = $state(type);
  function handleInputSingle(event) {
    onInput(event.target.value);
  }
  function clearInput() {
    value = '';
    onInput(value);
  }
  let showPassword = $state(false);
  function togglePassword() {
    showPassword = !showPassword;
    inputType = showPassword ? 'text' : 'password';
  }
</script>

<svelte:head>
  <link rel="stylesheet" href="https://at.alicdn.com/t/c/font_4895803_6bo7d9a3huu.css" />
</svelte:head>

<div class="InputBox-container">
  {#if showLabel}
    <div class="InputBox-label">
      {#if request}
        <span class="required">*</span>
      {/if}
      {label}
    </div>
  {/if}
  <div class="InputBox-box">
    <input
      class="InputBox-input {round ? 'round' : ''}"
      type={inputType}
      bind:value
      {placeholder}
      {readonly}
      {disabled}
      oninput={handleInputSingle}
    />
    {#if clearable && value}
      <button class="clear-icon" onclick={clearInput} aria-label="清除输入">
        <i class="iconfont icon-shanchu"></i>
      </button>
    {/if}
    <button
      onclick={togglePassword}
      title={showPassword ? '隐藏密码' : '显示密码'}
      class="password-icon {type == 'password' ? '' : 'hide'}"
    >
      <img src="/teacher_mgt/{showPassword ? 'hide.svg' : 'show.svg'}" alt="{showPassword ? '隐藏' : '显示'}密码" />
    </button>
  </div>
</div>

<style lang="scss" scoped>
  .InputBox-container {
    display: flex;
    align-items: center;
    gap: 8px;
    width: 100%;
    .InputBox-label {
      color: #555;
      font-size: 14px;
      width: 90px;
      text-align: right;
      .required {
        color: red;
        font-size: 14px;
      }
    }
    .InputBox-box {
      position: relative;
      display: flex;
      align-items: center;
      gap: 8px;
      min-width: 150px;
      flex: 1;
      .InputBox-input {
        border-radius: 3px;
        height: 32px;
        padding: 0 8px;
        background-color: #fff;
        border: 1px solid #ccc;
        font-size: 14px;
        box-sizing: border-box;
        outline: none;
        width: 100%;
        transition: border 0.2s;
        &:hover,
        &:focus {
          border-color: #409eff;
        }
        &.round {
          border-radius: 20px;
        }
      }
    }
    .clear-icon {
      position: absolute;
      right: 4px;
      top: 50%;
      transform: translateY(-50%);
      font-size: 14px;
      color: #aaa;
      cursor: pointer;
      z-index: 2;
      background: #fff;
      padding: 2px;
      border-radius: 50%;
      transition: color 0.2s;
      &:hover {
        color: #165dff;
      }
    }
    .password-icon {
      position: absolute;
      right: -32px;
      top: 50%;
      transform: translateY(-50%);
      cursor: pointer;
      display: flex;
      justify-content: center;
      align-items: center;
      img {
        width: 24px;
        height: 24px;
        vertical-align: middle;
      }
      &.hide {
        display: none;
      }
    }
  }

  button {
    all: unset;
  }
  .InputBox-input:hover,
  .InputBox-input:focus {
    border-color: #165dff;
  }
  input::-ms-reveal,
  input::-ms-clear {
    display: none;
  }
  input::-webkit-credentials-auto-fill-button {
    visibility: hidden;
    display: none !important;
    pointer-events: none;
    position: absolute;
    right: 0;
  }
  input::-webkit-textfield-decoration-container {
    display: none !important;
  }
</style>
