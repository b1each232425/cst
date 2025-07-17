<!-- /*
 * @Author: wusaber33 
 * @Date: 2025-04-15 22:19:34 
 * @Last Modified by:   wusaber 
 * @Last Modified time: 2025-04-15 22:19:34 
 */
 -->
<script>
    let {
      options = [],
      value = $bindable(),
      placeholder = "请选择",
      disabled = false,
    } = $props();
  
    // 是否展开上拉菜单
    let is_open = $state(false);
    // 是否禁用
    let is_disabled = $state(disabled);
  
    // 当前选中的选项标签
    let selected_label = $derived.by(
      () => options.find((opt) => opt.value === value)?.label || ""
    );
  
    // 处理键盘事件
    /** @param {KeyboardEvent} e - 键盘事件 */
    function handleKeyDown(e) {
      if (e.key === "ArrowUp") {
        is_open = true; // 按下箭头向上键时展开上拉菜单
      }
    }
  
    // 处理选项点击
    /** @param {{ value: string; label: string; }} option - 选项对象 */
    function handleOptionClick(option) {
      value = option.value; // 更新选中的值
      is_open = false; // 关闭上拉菜单
    }
  
    // 处理鼠标进入
    function handleMouseEnter() {
      if (!is_disabled) {
        is_open = true; // 鼠标进入时展开上拉菜单
      }
    }
  
    // 处理鼠标离开
    function handleMouseLeave() {
      is_open = false; // 鼠标离开时关闭上拉菜单
    }
  </script>
  
  <div
    class="generic-select"
    class:disabled
    role="combobox"
    aria-haspopup="listbox"
    aria-expanded={is_open}
    aria-controls="options-list"
    aria-owns="options-list"
    tabindex={disabled ? -1 : 0}
    onkeydown={handleKeyDown}
    onmouseenter={handleMouseEnter}
    onmouseleave={handleMouseLeave}
  >
    <!-- 在上拉选择按钮上绑定 open 状态以便触发箭头动画 -->
    <div class="dropdown-toggle" class:open={is_open}>
      {#if value}
        <span class="selected-value">{selected_label}</span>
      {:else if placeholder}
        <span class="placeholder">{placeholder}</span>
      {/if}
      <span class="arrow">
        <img src="/dropdown/arrow_blue.png" alt="Dropdown Arrow" class="dropdown-arrow">
      </span>
    </div>
  
    {#if is_open && !disabled}
      <div class="dropdown-menu" role="listbox">
        {#each options as option (option.value)}
          <div
            id="options-list"
            tabindex="0"
            role="option"
            class="dropdown-item {value === option.value ? 'selected' : ''}"
            onclick={() => handleOptionClick(option)}
            onkeydown={(e) => e.key === "Enter" && handleOptionClick(option)}
            onmouseover={handleMouseEnter}
            onfocus={handleMouseEnter}
            aria-selected={value === option.value}
          >
            {option.label}
          </div>
        {/each}
      </div>
    {/if}
  </div>
  
  <style lang="scss" scoped>
  .generic-select {
    position: relative;
    width: 100%;
    cursor: pointer;
  
    &.disabled {
      opacity: 0.6;
      cursor: not-allowed;
    }
  
    .dropdown-toggle {
      display: flex;
      align-items: center;
      padding: 6px 12px;
      border: 1px solid var(--border-light);
      border-radius: var(--input-border-radius);
      background: white;
      min-height: 15px;
      transition: all 0.3s ease;
  
      /* 当鼠标悬停时边框变蓝 */
      &:hover {
        border-color: #1890ff;
        box-shadow: 0 0 0 2px rgba(24, 144, 255, 0.2);
      }
  
      /* 当上拉菜单展开时给箭头添加旋转动画 */
      &.open {
        .arrow {
          transform: rotate(180deg);
        }
      }
  
      .selected-value,
      .placeholder {
        flex-grow: 1;
        margin-right: 30px;
        font-size: 14px;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }
  
      .arrow {
        margin-left: auto;
      }
  
      .dropdown-arrow {
        width: 12px;
        height: 12px;
      }
    }
  
    .dropdown-menu {
      position: absolute;
      width: 100%;
      border: 1px solid var(--border-light);
      border-bottom: none;
      background: white;
      border-radius: var(--input-border-radius);
      padding: 6px 0;
      box-shadow: 0 -4px 12px rgba(0, 0, 0, 0.15);
      z-index: 1000;
      max-height: 200px;
      overflow-y: auto;
      bottom: 100%; /* 让菜单出现在按钮上方 */
    }
  
    .dropdown-item {
      padding: 6px 12px;
      width: 100%;
      box-sizing: border-box;
      display: flex;
      align-items: center;
      cursor: pointer;
      transition: all 0.2s ease;
      font-size: 14px;
  
      &:hover {
        background: #e6f7ff;
      }
  
      &.selected {
        background: #ecf2fe;
        font-weight: 500;
      }
    }
  }
  </style>