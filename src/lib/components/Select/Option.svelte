<script>
  import { getContext, setContext } from 'svelte';
  import { onMount, onDestroy } from 'svelte';
  import { writable } from 'svelte/store';
  /**
   * @description Select > Option 组件的属性
   * @props {string} value - 选择器的值
   * @props {string} label - 选择器的标签
   * @props {boolean} disabled - 选择器是否禁用
   */

  const { filterText } = getContext('SelectFilter'); // 过滤文本
  const { add, sub, reset } = getContext('ShowOptionCounts'); // 显示选项计数
  const { filterable, remote, handerSelectValue, setActive } = getContext('OptionData'); // 通信

  let { value, label, disabled = false } = $props(); // 接收 props

  let isSelected = $state(false); // 是否选中
  let visible = $state(true); // 是否可见
  let lastvisible = $state(true); // 上一次是否可见

  // 监听 visible 变化
  $effect(() => {
    if (visible !== lastvisible) {
      if (visible) add();
      else sub();
      lastvisible = visible;
    }
  });

  // 订阅 filterText
  const unsubscribe = filterText.subscribe((text) => {
    visible = label.toLowerCase().includes(text.toLowerCase());
  });

  // 选中某一个选项
  function handerSelected() {
    if (disabled) return;
    if (handerSelectValue({ selectValue: value, selectLabel: label })) {
      isSelected = true;
      return;
    }
    isSelected = false;
  }

  // 保持选中状态,存储选中状态不变
  function keepActive() {
    if (setActive(value)) isSelected = true;
  }

  onMount(() => {
    keepActive();
    add();
  });

  onDestroy(() => {
    unsubscribe();
    reset();
  });
</script>

<button
  class="dropdown-container {disabled ? 'disabled' : ''}  {visible ? '' : 'hiddle'}"
  onclick={handerSelected}
  class:active={isSelected}
>
  <li class="dropdown-container-item">
    {label}
  </li>
</button>

<style lang="scss" scoped>
  button {
    all: unset;
  }
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
    .dropdown-container-item {
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      font-weight: 400;
    }
  }
  .active {
    background-color: #e7e7e7;
    &:hover {
      background-color: #e7e7e7;
    }
  }
  .hiddle {
    display: none;
  }
</style>
