<!--/**
 * @Author: wusaber33
 * @Date: 2025-04-23 20:22:44
 * @LastEditors: 段春茂 2162105974@qq.com
 * @LastEditTime: 2025-08-17 2:28:07
 * @FilePath: src\lib\components\Tag\UneditableTag.svelte
 * @Description: 
 * @Copyright (c) 2025 by wusaber33, All Rights Reserved. 
 */ -->
<script>
  import { validateAndAssign } from '$lib/utils/validate';
  /** 颜色列表 */
  const COLOR_LIST = [
    '#40d5ff',
    '#59dcff',
    '#33c1e8',
    '#6adbff',
    '#26caef',
    '#4dd6eb',
    '#6dcaf2',
    '#52c2ff',
    '#7fd3f3',
    '#47d0db',
    '#5bc8f2',
    '#40c4e0',
    '#72deff',
    '#4fd4d9',
    '#83def5',
    '#ffa040',
    '#ffb359',
    '#ffc26d',
    '#ffcf85',
    '#ff9eac',
    '#ffb3c0',
    '#ffc6d1',
    '#ffd9e0',
    '#c6ff8c',
    '#d9ff99',
    '#e0ffb3',
    '#e6ffcc',
  ];

  let { content, colors = COLOR_LIST } = $props();

  /**
   * 校验参数是否合法,以及做一些默认处理
   */
  const propsRules = {
    content: { type: ['string'], default: '标签文本' },
    colors: { type: ['array'], default: COLOR_LIST },
  };
  const propMap = {
    content: { get: () => content, set: (v) => (content = v) },
    colors: { get: () => colors, set: (v) => (colors = v) },
  };
  Object.keys(propMap).forEach((k) => {
    validateAndAssign('UneditableTag', propMap[k].get, propMap[k].set, propsRules[k], k);
  });
</script>

<div class="tag">
  <div class="tag__color" style="background-color: {COLOR_LIST[content.charAt(0).charCodeAt(0) % colors.length]}"></div>
  <div class="tag__content">
    <span class="tag__content-text">{content}</span>
  </div>
</div>

<style lang="scss" scoped>
  .tag {
    display: flex;
    align-items: center;
    width: max-content;
    max-width: 150px;

    &__color {
      width: 12px;
      height: 12px;
      border-radius: 2px;
      margin-right: 6px;
    }

    &__content {
      font-size: 14px;
      color: #333;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;

      &-text {
        display: block;
        padding: 2px 4px;
        border-radius: 3px;
      }
    }
  }
</style>
