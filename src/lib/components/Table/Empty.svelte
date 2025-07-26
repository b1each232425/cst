<script>
  /**
   * @description 无数据提示组件使用说明
   * @property {String} text - 无数据提示文本，默认为 '暂无数据'
   * @property {Boolean} showicon - 是否显示无数据图标，默认为 true
   * @property {Boolean} showtext - 是否显示无数据文本，默认为 true
   * @example
   * <Emty
   *   text="暂无数据"
   *   showicon
   *   showtext
   * />
   */
  let { text = '暂无数据', showicon = true, showtext = true } = $props();
</script>

<div class="emty">
  {#if showicon}
    <img src="/table/table-no-data.svg" alt="No Data" />
  {/if}
  {#if showtext}
    <p>{text}</p>
  {/if}
</div>

<style lang="scss" scoped>
  div.emty {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    height: 100%;
    text-align: center;
    img {
      width: 100px;
      height: 100px;
    }
    p {
      margin-top: 10px;
      color: #999;
      font-size: 16px;
    }
  }
</style>
