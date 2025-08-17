<!--
 * @Author: 段春茂 2162105974@qq.com
 * @Date: 2025-07-28 18:20:00
 * @LastEditors: 段春茂 2162105974@qq.com
 * @LastEditTime: 2025-08-17 2:00:00
 * @FilePath: src\lib\components\Select\Option.svelte
 * @Description: Tooltip-组件
 * @Copyright (c) 2025 by 广州近邻信息有限公司, All Rights Reserved. 
-->
<script>
  /**
   * @component (Select) + Option
   * @description 选择输入搜索框组件
   *
   * @props
   * @property {string} [value=""] - 选择器的值
   * @property {string} [label=''] - 选择器的标签
   * @property {boolean} [disabled=false] - 选择器是否禁用
   */
  import { writable } from 'svelte/store';
  import { getContext, onMount, onDestroy } from 'svelte';
  import { validateAndAssign } from '$lib/utils/validate';

  let { value, label, disabled = false } = $props();

  /**
   * 校验参数是否合法,以及做一些默认处理
   */
  const propRules = {
    label: { type: ['string', 'number', 'boolean'], default: '' },
    disabled: { type: ['boolean'], default: false },
  };
  const propMap = {
    label: { get: () => label, set: (v) => (label = v) },
    disabled: { get: () => disabled, set: (v) => (disabled = v) },
  };
  Object.keys(propMap).forEach((k) => {
    validateAndAssign('Option', propMap[k].get, propMap[k].set, propRules[k], k);
  });

  /** 上下文通信 */
  const { getSelectShow, getOptionData, filterText, filterable, handerSelectValue, setActive } = getContext('SELECT-OPTIONS');

  // 状态管理
  let isShow = $state(false);
  let isSelected = $state(false);
  let isSelectShow = $state(getSelectShow());

  /** 订阅store @type {function} */
  const filterTextStore = filterText.subscribe((text) => {
    isShow = String(label).toLowerCase().includes(text.toLowerCase());
  });

  $effect(() => {
    if (isSelectShow === true || isSelectShow === false) keepActive();
  });

  /**
   * 保持选中状态,存储选中状态不变
   * @type {function}
   */
  function keepActive() {
    if (setActive(value)) isSelected = true;
    else isSelected = false;
  }

  /**
   * 点击option,若之前选中,则取消选中,否则选中
   * @type {function}
   */
  function handerSelected() {
    if (disabled) return;
    if (handerSelectValue({ selectValue: value, selectLabel: label })) isSelected = true;
    else isSelected = false;
  }

  onMount(() => {
    keepActive();
    getOptionData({ value, label });
  });

  onDestroy(() => {
    filterTextStore();
  });
</script>

<button class="option" class:is-disabled={disabled} class:is-hiddle={!isShow} class:is-active={isSelected} data-testid="option" onclick={handerSelected}>
  <li class="option__item">{label}</li>
</button>

<style lang="scss" scoped>
  @mixin when($state) {
    @at-root {
      &.#{'is-' + $state} {
        @content;
      }
    }
  }

  .option {
    all: unset;
    padding: 4px 8px;
    cursor: pointer;
    transition:
      background-color 0.2s ease,
      color 0.2s ease;
    color: #333;
    border-radius: 6px;

    @include when(disabled) {
      color: #c0c4cc;
      cursor: not-allowed;
      &:hover {
        background-color: transparent;
      }
    }

    @include when(active) {
      background-color: #e7e7e7;
      &:hover {
        background-color: #e7e7e7;
      }
    }

    @include when(hiddle) {
      display: none;
    }

    &:hover {
      background-color: #fafafa;
    }

    &__item {
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      font-weight: 400;
    }
  }
</style>
