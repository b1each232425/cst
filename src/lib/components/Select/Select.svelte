<!-- /**
   * 选择输入搜索框组件使用说明(Select)
   *
   * 作者：段春茂
   * 邮箱：2162105974@qq.com
   *
   * 参数配置：
   * @param {string} value - 选择器的值
   * @param {string} placeholder - 选择器的占位符
   * @param {boolean} disabled - 选择器是否禁用
   * @param {boolean} multiple - 选择器是否多选
   * @param {boolean} filterable - 选择器是否可搜索
   * @param {boolean} remote - 选择器是否远程搜索
   * @param {function} remote_method - 远程搜索的方法
   *
   * 功能说明：
   * - 选择器：支持单选/多选，可搜索，可远程搜索，可清除，可禁用
   * - 选项：支持自定义选项内容，可自定义选项值,贴近原生,方便使用
   *
   * 使用示例：
   * <Select value="1" placeholder="请选择" multiple filterable remote={true} remote_method={handleRemoteSearch}>
   *   <Option value="1" label="选项1"></Option>
   *   <Option value="2" label="选项2"></Option>
   *   <Option value="3" label="选项3"></Option>
   * </Select>
   *
   * 注意事项：
   * - 选项的value值不能重复，否则会导致选项显示异常
   */ -->
<script>
  import { setContext, getContext } from 'svelte';
  import { writable } from 'svelte/store';

  // props
  let {
    value = $bindable(),
    placeholder = '请选择',
    disabled = false,
    multiple = false,
    filterable = false,
    remote = false,
    remote_method = () => {},
    onChangeValue = () => {},
    children,
  } = $props();

  // 处理 value,如果是多选就会返回arr[]
  if (multiple) value = Array.isArray(value) ? value : [];

  // 状态管理
  let isShow = $state(false);
  let selectedLabel = $state([]);
  let OptionCounts = $state(0);
  let OptionData = $state([]);
  let filterText = writable('');

  // 上下文通信
  setContext('SELECT-OPTIONS', {
    filterable,
    remote,
    filterText,
    getSelectShow: () => isShow,
    add: () => (OptionCounts = OptionCounts + 1),
    sub: () => (OptionCounts = OptionCounts - 1),
    reset: () => (OptionCounts = 0),
    getOptionData: ({ value, label }) => {
      OptionData.push({ selectValue: value, selectLabel: label });
      initLabelvalue();
    },
    setActive: (optionValue) => {
      if (multiple) {
        if (value.includes(optionValue)) return true;
        return false;
      }
      if (value == optionValue) return true;
      return false;
    },
    handerSelectValue: ({ selectValue, selectLabel }) => {
      if (multiple) {
        if (value.includes(selectValue)) {
          // 创建新数组进行修改
          const newValue = value.filter((v) => v !== selectValue);
          const newSelectedLabel = selectedLabel.filter((l) => l !== selectLabel);
          value = newValue;
          selectedLabel = newSelectedLabel;
          onChangeValue(newValue);
          return false;
        } else {
          // 创建新数组进行修改
          value = [...value, selectValue];
          selectedLabel = [...selectedLabel, selectLabel];
          onChangeValue(value);
          return true;
        }
      } else {
        value = selectValue;
        selectedLabel = [selectLabel];
        onChangeValue(value);
        closeSelect();
        return true;
      }
    },
  });

  // 处理外部传入value
  $effect(() => {
    initLabelvalue();
    if (value === '') onChangeValue(value);
    if (value === undefined || value === null) onChangeValue(value);
  });

  // 处理初始化value
  function initLabelvalue() {
    if (Array.isArray(value)) {
      const labels = value
        .map((item) => {
          const option = OptionData.find((child) => child.selectValue == item);
          return option ? option.selectLabel : '';
        })
        .filter(Boolean);

      if (labels.length > 0) selectedLabel = labels;
    } else {
      const option = OptionData.find((child) => child.selectValue == value);
      if (option) selectedLabel = [option.selectLabel];
    }
  }

  // 处理输入框的事件
  function onInputChange(e) {
    filterText.set(e.target.value || '');
    if (remote && typeof remote_method === 'function') remote_method(e.target.value || '');
    openSelect();
  }

  // 关闭选择器
  function closeSelect() {
    if (isShow) isShow = false;
  }
  // 打开选择器
  function openSelect() {
    if (disabled) return;
    if (!isShow) isShow = true;
  }
  // 切换选择器
  function toggleSelect() {
    if (disabled) return;
    isShow = !isShow;
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
  <button class="dropdown-icon" onclick={toggleSelect} aria-label="Toggle dropdown" tabindex="-1">
    <img src="/dropdown/arrow_black.png" alt="Dropdown icon" style={isShow ? 'transform: rotate(180deg);' : ''} />
  </button>
  <ul class="dropdown-options {isShow ? '' : 'hidle'}" role="listbox">
    <section>
      {@render children()}
      {#if OptionCounts <= 0}<div class="no-options"><li class="no-data">暂无数据</li></div>{/if}
    </section>
  </ul>
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
      top: calc(100% + 2px);
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
  .hidle {
    display: none;
  }
</style>
