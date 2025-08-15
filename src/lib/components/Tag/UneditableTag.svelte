<!--/**
 * @Author: wusaber33
 * @Date: 2025-04-23 20:22:44
 * @LastEditors: wusaber33
 * @LastEditTime: 2025-04-26 22:05:58
 * @FilePath: src\lib\components\Tag\UneditableTag.svelte
 * @Description: 
 * @Copyright (c) 2025 by wusaber33, All Rights Reserved. 
 */ -->
<script>
  import { validateAndAssign } from '$lib/utils/validate';
  /**
   * 颜色列表
   */
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
   * 属性校验规则
   * @type {Object}
   */
  const propsRules = {
    content: { type: ['string'], default: '标签文本' },
    colors: { type: ['array'], default: COLOR_LIST, check: (v) => v.length > 0, message: 'colors 不能为空' },
  };

  const propMap = {
    content: { get: () => content, set: (v) => (content = v) },
    colors: { get: () => colors, set: (v) => (colors = v) },
  };

  Object.keys(propMap).forEach((k) => {
    validateAndAssign('UneditableTag', propMap[k].get, propMap[k].set, propsRules[k], k);
  });
</script>

<div class="tag-container">
  <div class="tag-color" style="background-color: {COLOR_LIST[content.charAt(0).charCodeAt(0) % colors.length]}"></div>
  <div class="tag-content">
    <span class="tag-text">{content}</span>
  </div>
</div>

<style lang="scss" scoped>
  .tag-container {
    display: flex;
    align-items: center;
    width: max-content;
    max-width: 150px;

    .tag-color {
      width: 12px;
      height: 12px;
      border-radius: 2px;
      margin-right: 6px;
    }

    .tag-content {
      font-size: 14px;
      color: #333;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;

      .tag-text {
        display: block;
        padding: 2px 4px;
        border-radius: 3px;
      }
    }
  }
</style>
