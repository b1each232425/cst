<script>
  /**
   * @component Empty
   * @description 无数据提示组件
   *
   * @props
   * @property {String} [text='暂无数据'] - 无数据提示文本
   * @property {Boolean} [show_icon=true] - 是否显示无数据图标
   * @property {Boolean} [show_text=true] - 是否显示无数据文本
   *
   * @example
   * <Empty text="暂无数据"/>
   */
  let { text = '暂无数据', show_icon = true, show_text = true } = $props();
</script>

<div class="empty">
  {#if show_icon}
    <img src="/table/table-no-data.svg" alt="No Data" />
  {/if}
  {#if show_text}
    <p>{text}</p>
  {/if}
</div>

<style lang="scss" scoped>
  div.empty {
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
