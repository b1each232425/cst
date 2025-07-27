<!-- /**
  * 信息展示输入框组件使用说明
  *
  * 作者：段春茂
  * 邮箱：2162105974@qq.com
  *
  * 参数配置：
  * @param {String} label         字段标签文本，如 "姓名"、"账号"
  * @param {String} value         展示的值内容（普通模式下显示）
  * @param {Boolean} password     是否为密码模式，开启后默认展示密文并支持切换显示/隐藏
  *
  * 插槽：
  * 默认插槽：用于自定义展示内容，插槽内容将替代默认的 `value` 显示
  *
  * 功能说明：
  * - 普通模式：展示 label + value（如：姓名：张三）
  * - 密码模式：展示密文 `••••••••`，点击按钮切换明文 / 密文
  *
  * 使用示例：
  * <InforInput label="姓名" value="张三" />
  * <InforInput label="登录密码" password="123456" />
  *
  * 注意事项：
  * - 如果使用插槽展示自定义内容，不需要再传入 `value` 属性
  * - `label` 宽度固定 90px，右对齐，组件整体可响应式布局
  */ -->
<script>
  let { label, value, showLabel = true, password, children } = $props();

  let showPassword = $state(false);
  function togglePassword() {
    showPassword = !showPassword;
  }
</script>

<div class="InforInput-wrapper">
  {#if showLabel}
    <label for="" class="InforInput-label">{label}</label>
  {/if}
  {#if password}
    <div class="InforInput-password">
      {#if showPassword}
        {password || '• • • • • • • •'}
      {:else}
        • • • • • • • •
      {/if}
    </div>
    <button onclick={togglePassword} title={showPassword ? '隐藏密码' : '显示密码'}>
      <img src="/teacher_mgt/{showPassword ? 'hide.svg' : 'show.svg'}" alt="{showPassword ? '隐藏' : '显示'}密码" />
    </button>
  {:else}
    <div class="InforInput-value">{value}{@render children()}</div>
  {/if}
</div>

<style lang="scss" scoped>
  .InforInput-wrapper {
    display: flex;
    align-items: center;
    width: calc(50% - 10px);
    margin-bottom: 15px;
    @media (max-width: 992px) {
      width: 100%;
    }
    label {
      width: 90px;
      text-align: right;
      font-size: 14px;
      color: rgba(0, 0, 0, 0.6);
      margin-right: 10px;
      white-space: nowrap;
      flex-shrink: 0;
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
  }
</style>
