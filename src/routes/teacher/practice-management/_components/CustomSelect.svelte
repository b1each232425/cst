<!-- /*
 * @Author: 李乐毅 
 * @Date: 2025-07-27 16:36:22 
 * @Last Modified by:   李乐毅 
 * @Last Modified time: 2025-07-27 16:36:22 
 */ -->
<script>
    let { 
        options = [], 
        selected_value = $bindable(''),
        width = 'auto',
        height = '32px',
        backgroundColor = 'white',
        onChangeFunc = (/** @type {string} */ value) => { console.log("选项变更为:", value); }
    } = $props();
    
    let is_open = $state(false);
    function toggleDropdown() {
      is_open = !is_open;
    }
  
    /**
     * 选择选项
     * @param {string} value - 选中的选项值
     */
    function selectOption(value) {
      const previous_value = selected_value;
      selected_value = value;
      is_open = false;
      
      // 如果值发生变化，调用回调函数
      if (previous_value !== value) {
        onChangeFunc(value);
      }
    }
  
    /**
     * 处理失焦事件
     * @param {FocusEvent} event - 失焦事件对象
     */
    function handleBlur(event) {
      // 如果点击的是下拉选项，不立即关闭下拉框
      if (event.relatedTarget && event.relatedTarget instanceof Element && event.relatedTarget.classList.contains('select-option')) {
        return;
      }
      is_open = false;
    }
  

  </script>

  
  <div class="custom-select" style="width: {width}">
    <div
      class="select-selected {is_open ? 'active' : ''}"
      onclick={toggleDropdown}
      onblur={handleBlur}
      onkeydown={(e) => e.key === 'Enter' && toggleDropdown()}
      tabindex="0"
      role="button"
      title={selected_value}
      style="min-height: {height}; background-color: {backgroundColor};"
    >
      <span>{selected_value}</span>
      <img src="/dropdown/arrow_black.png" alt="下拉箭头" class="select-arrow" />
    </div>
    {#if is_open}
      <div class="select-items">
        {#each options as option}
          <div
            class="select-option {selected_value === option ? 'selected' : ''}"
            onclick={() => selectOption(option)}
            onkeydown={(e) => e.key === 'Enter' && selectOption(option)}
            tabindex="0"
            role="option"
            title={option}
          >
            {option}
          </div>
        {/each}
      </div>
    {/if}
  </div>
  
  <style lang="scss">
    .custom-select {
      position: relative;
      cursor: pointer;
      min-width: 120px;
  
      .select-selected {
        display: flex;
        align-items: center;
        justify-content: space-between;
        width: 100%;
        border: 1px solid rgba(121, 121, 121, 0.33);
        border-radius: 2px;
        padding: 0 8px 0 12px;
        font-size: 14px;
        transition: border-color 0.3s ease, color 0.3s ease;

        > span {
          flex: 1;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          margin-right: 8px;
        }

        &:hover {
          border-color: #0336ff;
        }
  
        &.active {
          color: #cdcdcd;
          border-color: #0336ff;
        }
      }
  
      .select-arrow {
        width: 12px;
        height: 12px;
        object-fit: contain;
      }
  
      .select-items {
        position: absolute;
        top: calc(100% + 4px);
        left: 0;
        right: 0;
        z-index: 99;
        max-height: 200px;
        overflow-y: auto;
        background-color: white;
        border: 1px solid rgba(121, 121, 121, 0.33);
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.12);
      }
  
      .select-option {
        padding: 8px 12px;
        font-size: 14px;
        transition: background-color 0.2s ease;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
  
        &:hover {
          background-color: #e8e8e8;
        }
  
        &.selected {
          background-color: #e6f1ff;
          font-weight: bold;
        }
      }
    }
  </style>