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
  import { getType } from '$lib/utils/index.js';
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
  const propRules = {
    content: { type: ['string'], default: '标签文本' },
    colors: { type: ['array'], default: COLOR_LIST, check: (v) => v.length > 0 },
  };

  /**
   * 校验props属性是否合法，以及进行容错处理
   * @param data
   * @param key
   */
  function validateAndAssign(data, key) {
    const rule = propRules[key];
    let value = data.value;
    let reason = '';
    if (!rule.type.includes(getType(value))) {
      reason = `类型错误，传入类型为 '${getType(value)}'，期望类型为 '${rule.type.join(', ')}'`;
    } else if (rule.check && !rule.check(value)) {
      reason = `校验函数不通过`;
    }
    if (reason) {
      console.warn(`[UneditableTag] 属性 '${key}' 无效:${reason},已使用默认值 '${rule.default}',传入值为:'${value}'`);
      data.set(rule.default);
    }
  }

  /**
   * 校验props属性是否合法，以及进行容错处理
   */
  validateAndAssign({ value: content, set: (v) => (content = v) }, 'content');
  validateAndAssign({ value: colors, set: (v) => (colors = v) }, 'colors');
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
