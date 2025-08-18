<!--
 * @Author: 段春茂 2162105974@qq.com
 * @Date: 2025-07-24 9:35:00
 * @LastEditors: 段春茂 2162105974@qq.com
 * @LastEditTime: 2025-08-17 2:28:07
 * @FilePath: src\lib\components\Tag\Tag.svelte
 * @Description: Tag标签
 * @Copyright (c) 2025 by 广州近邻信息有限公司, All Rights Reserved. 
-->
<script>
  /**
   * @params
   * @param {String} type    标签类型，决定颜色样式，可选值：'primary' | 'success' | 'danger' | 'warning' | 'info'，默认值为 'primary'
   * @param {String} size    标签尺寸，可选值：'small' | 'middle' | 'large'，默认值为 'middle'
   * @param {String} them    标签主题风格，可选值：'light' | 'dark' | 'plain'，默认值为 'dark'
   * @param {Boolean} round  是否显示圆角（胶囊形）样式，默认值为 false
   *
   * @example
   * <Tag type="success" size="small" them="light" round>审核通过</Tag>
   * <Tag type="danger" them="plain">删除失败</Tag>
   */
  import { validateAndAssign } from '$lib/utils/validate';

  let { type = 'primary', size = 'middle', them = 'dark', round = false, children } = $props();

  const TYPES = ['primary', 'success', 'danger', 'warning', 'info'];
  const SIZES = ['small', 'middle', 'large'];
  const THEMES = ['light', 'dark', 'plain'];

  /**
   * 校验参数是否合法,以及做一些默认处理
   */
  const propsRules = {
    type: { type: ['string'], default: 'primary', check: (v) => TYPES.includes(v), message: `type必须是 ${TYPES.join(', ')} 之一` },
    size: { type: ['string'], default: 'middle', check: (v) => SIZES.includes(v), message: `size必须是 ${SIZES.join(', ')} 之一` },
    them: { type: ['string'], default: 'dark', check: (v) => THEMES.includes(v), message: `them必须是 ${THEMES.join(', ')} 之一` },
    round: { type: ['boolean'], default: false },
  };
  const propMap = {
    type: { get: () => type, set: (v) => (type = v) },
    size: { get: () => size, set: (v) => (size = v) },
    them: { get: () => them, set: (v) => (them = v) },
    round: { get: () => round, set: (v) => (round = v) },
  };
  Object.keys(propMap).forEach((k) => {
    validateAndAssign('tag', propMap[k].get, propMap[k].set, propsRules[k], k);
  });

  let classes = $state(['tag', `tag--${type}`, `tag--${size}`, them && `is-${them}`, round && 'is-round'].filter(Boolean).join(' '));
</script>

<span class={classes}>
  {@render children()}
</span>

<style lang="scss" scoped>
  :root {
    --primary: var(--blue);
    --success: var(--green);
    --danger: var(--red);
    --warning: var(--orange);
    --info: var(--gray);
  }
  .tag {
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 0.25em 0.6em;
    font-size: 0.875rem;
    border-radius: 4px;
    user-select: none;
    white-space: nowrap;
    line-height: 1;
    // 尺寸
    &--small {
      font-size: 12px;
      padding: 0.2em 0.5em;
    }
    &--middle {
      font-size: 14px;
      padding: 0.3em 0.6em;
    }
    &--large {
      font-size: 16px;
      padding: 0.4em 0.8em;
    }
    // 类型颜色
    &--primary {
      background-color: var(--primary);
      color: white;
    }
    &--success {
      background-color: var(--success);
      color: white;
    }
    &--danger {
      background-color: var(--danger);
      color: white;
    }
    &--warning {
      background-color: var(--warning);
      color: black;
    }
    &--info {
      background-color: var(--info);
      color: black;
    }
    // 主题颜色
    &.is-light.tag--primary {
      background-color: color-mix(in srgb, var(--blue) 10%, white 90%);
      border: 1px solid var(--primary);
      color: var(--primary);
    }
    &.is-light.tag--success {
      background-color: color-mix(in srgb, var(--green) 10%, white 90%);
      border: 1px solid var(--success);
      color: var(--success);
    }
    &.is-light.tag--danger {
      background-color: color-mix(in srgb, var(--red) 10%, white 90%);
      border: 1px solid var(--danger);
      color: var(--danger);
    }
    &.is-light.tag--warning {
      background-color: color-mix(in srgb, var(--orange) 10%, white 90%);
      border: 1px solid var(--orange);
      color: var(--warning);
    }
    &.is-light.tag--info {
      background-color: color-mix(in srgb, var(--gray) 10%, white 90%);
      border: 1px solid var(--gray);
      color: var(--info);
    }
    &.is-dark.tag--primary {
      background-color: var(--primary);
      color: white;
    }
    &.is-dark.tag--success {
      background-color: var(--success);
      color: white;
    }
    &.is-dark.tag--danger {
      background-color: var(--danger);
      color: white;
    }
    &.is-dark.tag--warning {
      background-color: var(--warning);
      color: white;
    }
    &.is-dark.tag--info {
      background-color: var(--info);
      color: white;
    }
    &.is-plain.tag--primary {
      background-color: transparent;
      border: 1px solid var(--primary);
      color: var(--primary);
    }
    &.is-plain.tag--success {
      background-color: transparent;
      border: 1px solid var(--success);
      color: var(--success);
    }
    &.is-plain.tag--danger {
      background-color: transparent;
      border: 1px solid var(--danger);
      color: var(--danger);
    }
    &.is-plain.tag--warning {
      background-color: transparent;
      border: 1px solid var(--warning);
      color: var(--warning);
    }
    &.is-plain.tag--info {
      background-color: transparent;
      border: 1px solid var(--info);
      color: var(--info);
    }
    &.is-round.tag--primary {
      border-radius: 999px;
      border: 1px solid var(--primary);
    }
    &.is-round.tag--success {
      border-radius: 999px;
      border: 1px solid var(--success);
    }
    &.is-round.tag--danger {
      border-radius: 999px;
      border: 1px solid var(--danger);
    }
    &.is-round.tag--warning {
      border-radius: 999px;
      border: 1px solid var(--orange);
    }
    &.is-round.tag--info {
      border-radius: 999px;
      border: 1px solid var(--info);
    }
  }
</style>
