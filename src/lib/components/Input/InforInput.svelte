<script>
  /**
   * @param {string} label 标签
   * @param {string} value 值
   * @param {boolean} password 是否是密码
   * 支持插槽, 用于自定义输入框内容,就不能传入value属性了
   */
  let { label, value, password } = $props();

  let showPassword = $state(false);
  function togglePassword() {
    showPassword = !showPassword;
  }
</script>

<div class="InforInput-wrapper">
  <label for="" class="InforInput-label">{label}</label>
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
    <div class="InforInput-value">{value}<slot /></div>
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
