<script>
  /**
   * @component InputBox
   * @description 输入框组件
   *
   * @props
   * @property {string} [value=''] - 输入框的值
   * @property {string} [label='标签文字'] - 标签文字
   * @property {string} [type='text'] - 输入框类型
   * @property {string} [placeholder='请输入信息'] - 输入框提示文字
   * @property {boolean} [request=false] - 是否显示必填符号
   * @property {boolean} [show_label=true] - 是否显示标签
   * @property {boolean} [readonly=false] - 是否只读,只读模式下不显示清除按钮
   * @property {string} [color=''] - 输入框字体颜色,只针对readonly=true模式有效
   * @property {boolean} [disabled=false] - 是否禁用
   * @property {boolean} [clearable=true] - 是否显示清除按钮
   * @property {boolean} [round=false] - 是否圆角
   * @property {function} [onInput=()=>{}] - 输入框输入事件
   *
   * @example
   * <InputBox bind:value={valueName} onInput={handleInput} />
   */
  let {
    value = $bindable(),
    label = '标签文字',
    type = 'text',
    placeholder = '请输入信息',
    request = false,
    show_label = true,
    readonly = false,
    color = '',
    disabled = false,
    clearable = true,
    round = false,
    onInput = () => {},
  } = $props();

  let inputType = $state(type);
  let showPassword = $state(false);

  /**
   * 处理单个输入框的输入事件
   * @param event
   */
  function handleInputSingle(event) {
    onInput(event.target.value);
  }

  /**
   * 清除输入框内容
   * @type {function}
   */
  function clearInput() {
    value = '';
    onInput(value);
  }

  /**
   * 切换密码显示
   * @type {function}
   */
  function togglePassword() {
    showPassword = !showPassword;
    inputType = showPassword ? 'text' : 'password';
  }
</script>

<div class="InputBox-container">
  <!-- 标签显示 -->
  {#if show_label}
    <div class="InputBox-label">
      <!-- request符号显示 -->
      {#if request}
        <span class="required">*</span>
      {/if}
      {label}
    </div>
  {/if}
  <!-- 通过readonly属性控制是否可编辑,切换为只读状态用来展示的样式 -->
  {#if readonly}
    {#if type.toLowerCase() == 'password'}
      <div class="InforInput-password {round ? 'round' : ''} {disabled ? 'disabled' : ''}">
        {#if showPassword}
          {value || '• • • • • • • •'}
        {:else}
          • • • • • • • •
        {/if}
      </div>
      <button onclick={togglePassword} title={showPassword ? '隐藏密码' : '显示密码'}>
        <img src="/teacher_mgt/{showPassword ? 'hide.svg' : 'show.svg'}" alt="{showPassword ? '隐藏' : '显示'}密码" />
      </button>
    {:else}
      <div
        class="InforInput-value {round ? 'round' : ''} {disabled ? 'disabled' : ''}"
        style={color ? `color: ${color};` : ''}
      >
        {value ? value : placeholder}
      </div>
    {/if}
    <!-- 普通通用输入框 -->
  {:else}
    <div class="InputBox-box">
      <input
        class="InputBox-input {round ? 'round' : ''} {disabled ? 'disabled' : ''}"
        type={inputType}
        bind:value
        {placeholder}
        {disabled}
        oninput={handleInputSingle}
      />
      <!-- 清除输入按钮 -->
      {#if clearable && value && !disabled}
        <button class="clear-icon" onclick={clearInput} aria-label="清除输入"></button>
      {/if}
      <button
        onclick={togglePassword}
        title={showPassword ? '隐藏密码' : '显示密码'}
        class="password-icon {type == 'password' ? '' : 'hide'}"
      >
        <img src="/teacher_mgt/{showPassword ? 'hide.svg' : 'show.svg'}" alt="{showPassword ? '隐藏' : '显示'}密码" />
      </button>
    </div>
  {/if}
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
    .InforInput-value,
    .InforInput-password {
      flex: 1;
      color: #333;
      background-color: #f9f9f9;
      border-radius: 4px;
      padding: 6px 8px;
      box-sizing: border-box;
      min-width: 200px;
    }
    .InforInput-value {
      min-width: 230px;
    }
    button {
      margin-left: 8px;
      background: transparent;
      border: none;
      cursor: pointer;
      padding: 0;
      img {
        width: 16px;
        height: 16px;
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
      }
    }
    .clear-icon {
      position: absolute;
      right: 4px;
      top: 50%;
      transform: translateY(-50%);
      cursor: pointer;
      z-index: 2;
      transition: all 0.2s;
      width: 16px;
      height: 16px;
      background-image: url('/clear/delete.svg');
      background-size: contain;
      background-repeat: no-repeat;
      background-position: center;
      &:hover {
        background-image: url('/clear/delete-active.svg');
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
  .round {
    border-radius: 20px;
  }
  .disabled {
    cursor: not-allowed;
  }
  button {
    all: unset;
  }
</style>
