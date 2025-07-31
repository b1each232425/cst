<!-- /**
  * 输入框组件使用说明
  *
  * 作者：段春茂
  * 邮箱：2162105974@qq.com
  *
  * 参数配置：
  * @param {String}  value        输入框的值（支持双向绑定）
  * @param {String}  label        标签文字，默认："标签文字"
  * @param {String}  type         输入框类型，如 text、password 等，默认："text"
  * @param {String}  placeholder  占位符文本，默认："请输入信息"
  * @param {Boolean} request      是否为必填项，显示红色 * 号，默认：false
  * @param {Boolean} showLabel    是否显示标签，默认：true
  * @param {Boolean} readonly     是否为只读状态，默认：false
  * @param {Boolean} disabled     是否禁用输入，默认：false
  * @param {Boolean} clearable    是否显示清除按钮（有内容时），默认：true
  * @param {Boolean} round        输入框是否为圆角样式，默认：false
  * @param {Function} onInput     输入事件回调函数，参数为输入值，默认：()=>{}
  *
  * 功能说明：
  * - 支持输入框类型切换（如密码可点击切换明文/密文）
  * - 支持清除按钮
  * - 支持圆角风格和响应式布局
  *
  * 使用示例：
  * <InputBox
  *   value={form.name}
  *   label="姓名"
  *   placeholder="请输入姓名"
  *   request={true}
  *   onInput={val => form.name = val}
  * />
  *
  * <InputBox
  *   value={form.password}
  *   label="登录密码"
  *   type="password"
  *   clearable={false}
  *   onInput={val => form.password = val}
  * />
  *
  * <InputBox
  *   value="不可编辑"
  *   label="只读字段"
  *   readonly={true}
  *   disabled={true}
  *   showLabel={false}
  * />
  *
  * 注意事项：
  * - `value` 支持双向绑定（$bindable）
  * - `type=password` 时支持点击切换明文显示
  * - 若设置 `readonly` 或 `disabled`，用户无法编辑内容
  */ -->
<script>
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
      color: rgba(0, 0, 0, 0.6);
      font-size: 14px;
      width: 90px;
      white-space: nowrap;
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
