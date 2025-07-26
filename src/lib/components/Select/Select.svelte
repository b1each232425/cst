<script>
  import { setContext, getContext } from 'svelte';
  import { writable } from 'svelte/store';
  /**
   * @description Select 组件的属性
   * @props {string} value - 选择器的值
   * @props {string} placeholder - 选择器的占位符
   * @props {boolean} disabled - 选择器是否禁用
   * @props {boolean} clearable - 选择器是否可清除
   * @props {boolean} multiple - 选择器是否多选
   * @props {boolean} filterable - 选择器是否可搜索
   * @props {boolean} remote - 选择器是否远程搜索
   * @props {function} remote_method - 远程搜索的方法
   */

  let {
    value = $bindable(),
    placeholder = '请选择',
    disabled = false,
    multiple = false,
    filterable = false,
    remote = false,
    remote_method = () => {},
    onChangeValue = () => {},
  } = $props();

  if (multiple && !Array.isArray(value)) value = []; // 处理 value,如果是多选就会返回arr[]
  let isOpen = $state(false); // 是否展开
  let selectedLabel = $state([]); // 多选时，已选中的标签, 数组
  let OptionCounts = $state(0); // select-option的数量(统计显示的option)
  let filterText = writable(''); // 搜索框的值,配合setContext使用实现持久通信

  // 处理统计显示的option
  setContext('ShowOptionCounts', {
    add: () => (OptionCounts = OptionCounts + 1), // 增加显示的option数量
    sub: () => (OptionCounts = OptionCounts - 1), // 减少显示的option数量
    reset: () => (OptionCounts = 0), // 重置显示的option数量
  });
  // 处理本地搜索
  setContext('SelectFilter', {
    filterText,
  });
  // 与子组件通信,控制子组件选中数据并且传递回来
  setContext('OptionData', {
    filterable,
    remote,
    handerSelectValue: ({ selectValue, selectLabel }) => {
      if (multiple) {
        if (value.includes(selectValue)) {
          value.splice(value.indexOf(selectValue), 1);
          selectedLabel.splice(selectedLabel.indexOf(selectLabel), 1);
          onChangeValue(value); // 传递回来
          return false;
        } else {
          value.push(selectValue);
          selectedLabel.push(selectLabel);
          onChangeValue(value); // 传递回来
          return true;
        }
      } else {
        value = selectValue;
        selectedLabel = [selectLabel];
        onChangeValue(value); // 传递回来
        closeSelect();
        return true;
      }
    },
    setActive: (optionValue) => {
      if (multiple) {
        if (value.includes(optionValue)) return true;
        return false;
      }
      if (value == optionValue) return true;
      return false;
    },
  });

  // 处理输入框的事件
  function onInputChange(e) {
    filterText.set(e.target.value || '');
    if (remote && typeof remote_method === 'function') {
      remote_method(e.target.value || '');
    }
    openSelect();
  }

  // 关闭选择器
  function closeSelect() {
    if (isOpen) isOpen = false;
  }

  // 打开选择器
  function openSelect() {
    if (disabled) return;
    if (!isOpen) isOpen = true;
  }

  // 切换选择器
  function toggleSelect() {
    if (disabled) return;
    isOpen = !isOpen;
  }

  // 点击外部关闭选择器
  let dropdownContainer;
  function handleClickOutside(event) {
    if (!dropdownContainer.contains(event.target)) closeSelect();
  }
</script>

<svelte:window on:click={handleClickOutside} />

<div class="dropdown-container" bind:this={dropdownContainer}>
  <input
    class="dropdown-input"
    value={selectedLabel.join(',')}
    readonly={!filterable}
    {placeholder}
    {disabled}
    oninput={onInputChange}
    onclick={toggleSelect}
  />
  <button class="dropdown-icon" onclick={toggleSelect} aria-label="Toggle dropdown">
    <img src="/dropdown/arrow_black.png" alt="Dropdown icon" style={isOpen ? 'transform: rotate(180deg);' : ''} />
  </button>
  {#if isOpen}
    <ul class="dropdown-options" role="listbox">
      <section>
        <slot />
        {#if OptionCounts <= 0}
          <div class="no-options">
            <li class="no-data">暂无数据</li>
          </div>
        {/if}
      </section>
    </ul>
  {/if}
</div>

<style lang="scss" scoped>
  button,
  input {
    all: unset;
  }
  .dropdown-container {
    position: relative;
    display: inline-flex;
    flex-direction: column;
    font-family: 'Inter', sans-serif;
    font-size: 14px;
    .dropdown-input {
      padding: 5px 36px 5px 12px;
      border: 1px solid #dcdfe6;
      border-radius: 4px;
      cursor: pointer;
      z-index: 10;
      transition:
        border-color 0.3s,
        box-shadow 0.3s;
      box-sizing: border-box;
      &:hover {
        border-color: #409eff;
      }
      &:focus {
        border-color: #409eff;
      }
    }
    .dropdown-icon {
      position: absolute;
      right: 12px;
      top: 50%;
      transform: translateY(-50%);
      background: transparent;
      border: none;
      cursor: pointer;
      padding: 0;
      display: flex;
      align-items: center;
      z-index: 999;
      img {
        width: 16px;
        height: 16px;
        transition: transform 0.3s ease;
      }
    }
    .dropdown-options {
      position: absolute;
      top: 70%;
      left: 0;
      width: 100%;
      max-height: 200px;
      overflow-y: auto;
      background-color: #fff;
      border: 1px solid #e4e7ed;
      border-radius: 8px;
      box-shadow: 0 6px 20px rgba(0, 0, 0, 0.1);
      z-index: 1000;
      padding: 0;
      section {
        display: flex;
        flex-direction: column;
        padding: 6px;
        gap: 3px;
      }
      .no-options {
        padding: 4px 8px;
        cursor: pointer;
        transition:
          background-color 0.2s ease,
          color 0.2s ease;
        color: #333;
        border-radius: 6px;
        .no-data {
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          font-weight: 400;
        }
      }
    }
  }
</style>
