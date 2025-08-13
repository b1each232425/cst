<!--
 * @Author: 段春茂 2162105974@qq.com
 * @Date: 2025-07-26 18:20:00
 * @LastEditors: 段春茂 2162105974@qq.com
 * @LastEditTime: 2025-08-10 23:00:00
 * @FilePath: src\lib\components\Table\Empty.svelte
 * @Description: Empty-暂无数据组件
 * @Copyright (c) 2025 by 广州近邻信息有限公司, All Rights Reserved. 
-->
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

  /**
   * 校验props属性是否合法，以及进行容错处理
   * @type {function}
   */
  (
    () => {
      // 获取精确的数据类型
      function getType(value) {
        return Object.prototype.toString.call(value).slice(8, -1).toLowerCase();
      }

      // text 校验
      if (getType(text) !== 'string' || text.trim() === '') {
        console.warn(`[Empty] 内容无效: '${text}',应为非空字符串`);
        text = '暂无数据';
      }

      // show_icon 校验
      if (getType(show_icon) !== 'boolean') {
        console.warn(`[Empty] 是否显示图标无效: '${show_icon}',应为布尔值boolean`);
        show_icon = true;
      }

      // show_text 校验
      if (getType(show_text) !== 'boolean') {
        console.warn(`[Empty] 是否显示文本无效: '${show_text}',应为布尔值boolean`);
        show_text = true;
      }
    }
  )();
</script>

<div class="empty">
  {#if show_icon}
    <img src="/table/table-no-data.svg" alt="No Data" loading="lazy" />
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
