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
  import { getContext, setContext } from 'svelte';
  import { onMount, onDestroy } from 'svelte';
  import { writable } from 'svelte/store';

  // props
  let { value, label, disabled = false } = $props();

  /** 上下文通信 */
  const { add, sub, reset, getSelectShow, getOptionData, filterText, filterable, handerSelectValue, setActive } =
    getContext('SELECT-OPTIONS');

  // 状态管理
  let isSelectShow = $state(getSelectShow());
  let isSelected = $state(false);
  let isShow = $state(false);

  /** 订阅store @type {function} */
  const filterTextStore = filterText.subscribe((text) => {
    isShow = label.toLowerCase().includes(text.toLowerCase());
  });

  // 监听 isShow 变化
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
    add();
    getOptionData({ value, label });
  });

  onDestroy(() => {
    filterTextStore();
    reset();
  });
</script>

<button
  class="dropdown-container {disabled ? 'disabled' : ''}  {isShow ? '' : 'hiddle'}"
  onclick={handerSelected}
  class:active={isSelected}
>
  <li class="item">{label}</li>
</button>

<style lang="scss" scoped>
  .dropdown-container {
    padding: 4px 8px;
    cursor: pointer;
    transition:
      background-color 0.2s ease,
      color 0.2s ease;
    color: #333;
    border-radius: 6px;
    &:hover {
      background-color: #fafafa;
    }
    &.disabled {
      color: #c0c4cc;
      cursor: not-allowed;
      &:hover {
        background-color: transparent;
      }
    }
    &.active {
      background-color: #e7e7e7;
      &:hover {
        background-color: #e7e7e7;
      }
    }
    &.hiddle {
      display: none;
    }
    .item {
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      font-weight: 400;
    }
  }
  button {
    all: unset;
  }
</style>
