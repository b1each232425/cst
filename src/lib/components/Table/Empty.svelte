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
  import { validateAndAssign } from '$lib/utils/validate';

  let { text = '暂无数据', show_icon = true, show_text = true } = $props();

  /**
   * 校验规则
   * @type {Object}
   */
  const propsRules = {
    text: { type: ['string'], default: '暂无数据', check: (v) => v.trim() !== '' },
    show_icon: { type: ['boolean'], default: true },
    show_text: { type: ['boolean'], default: true },
  };

  const propMap = {
    text: { get: () => text, set: (v) => (text = v) },
    show_icon: { get: () => show_icon, set: (v) => (show_icon = v) },
    show_text: { get: () => show_text, set: (v) => (show_text = v) },
  };

  Object.keys(propMap).forEach((k) => {
    validateAndAssign('Empty', propMap[k].get, propMap[k].set, propsRules[k], k);
  });
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
