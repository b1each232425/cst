<!-- 
 /*
 * @Author: Mayux dbs45412@163.com
 * @Date: 2025-05-29 16:03:00
 * @LastEditors: Mayux && 1243805308@qq.com
 * @LastEditTime: 2025-07-06 18:22:27
 * @FilePath: \tutorial-platform-fe\src\routes\teacher\examManagement\invigilation\[ExamID]\DropDownSparent.svelte
 * @Description: 透明下拉框组件
 * @Props:
 * - options (Array): 下拉框中的选项数组，每个选项为一个对象，包含value和label属性。
 * - selected (any): 当前选中的选项的value值，根据传入的value显示对应的label。
 * - placeholder (string): 下拉框未选中任何选项时显示的占位文本，默认为"请选择"。
 * - disabled (boolean): 是否禁用下拉框，默认为false。
 * - is_open (boolean): 下拉框是否处于打开状态。
 * - selectOptionFunc (function): 选中选项时调用的函数，选中下拉菜单中某一项时将传入对应项的value作为参数。
 * Copyright (c) 2025 by Mayux, All Rights Reserved. 
 */ 
 -->
 <script>
    let {
      //value为实际值，点击某个选项后将会调用外部传入的处理函数并将value作为参数传入，label为展示在下拉框的值
      options = [
        { value: "option1", label: "option1" },
        { value: "option2", label: "option2" },
        { value: "option3", label: "option3" },
        { value: "option4", label: "option4" },
        { value: "option5", label: "option5" },
      ],
      selected = null,
      placeholder = "请选择",
      disabled = false,
      is_open = false,
      selectOptionFunc = defaultSelectOption
    } = $props();
  
    function toggleDropdown() {
      if (!disabled) is_open = !is_open;
    }
  
    /**
     * @param {any} value
     */
    function defaultSelectOption(value) {
      console.log("选中"+value);
    }
  
    /**
     * @param {string} value
     */
    function changeValue(value){
      selected = value;
    }
    
  
    /**
       * @param {{ key: string; preventDefault: () => void; }} e
       */
    function handleKeyDown(e) {
      if (disabled) return;
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        toggleDropdown();
      }
    }
  
    function handleBlur() {
      setTimeout(() => {
        if (is_open) {
          is_open = false;
        }
      }, 200);
    }
  </script>
  
  <div class="dropdown-container">
    <button
        class="dropdown-select"
        class:disabled
        onclick={toggleDropdown}
        onkeydown={handleKeyDown}
        onblur={handleBlur}
        {disabled}
        aria-expanded={is_open}
        aria-haspopup="listbox"
    >
    <span class="selected-value">
        {options.find((o) => o.value === selected)?.label || placeholder}
    </span>
        <img src="/dropdown/arrow_black.png" alt="Dropdown Arrow" class="dropdown-arrow">
    </button>
  
    {#if is_open && !disabled}
    <div class="options-container">
      <div class="dropdown-options" role="listbox">
        {#each options as option (option.value)}
          <button
            class="dropdown-option"
            class:selected={option.value === selected}
            role="option"
            aria-selected={option.value === selected}
            onmousedown={() => {selectOptionFunc(option.value);changeValue(option.value)}}
            onkeydown={handleKeyDown}
            tabindex="-1"
          >
            {option.label}
          </button>
        {/each}
      </div>
    </div>
    {/if}
  </div>
  
  <style scoped>
    .dropdown-container {
      position: relative;
      width: 100%;
      height: 100%;
      font-family: Arial, sans-serif;
    }
  
    .dropdown-select {
      appearance: none;
      background: rgba(0, 0, 0, 0);
      border-top: none;
      border-left: none;
      border-right: none;
      border-bottom: none;
      font-family: inherit;
      text-align: left;
      padding: 6px 12px;
      cursor: pointer;
      width: 100%;
      height: 100%;
      display: flex;
      justify-content: space-between;
      align-items: center;
      user-select: none;
      box-sizing: border-box;
      position: relative; 
    }

    .dropdown-select::after {
        content: "";
        position: absolute;
        left: 1%;
        right: 3%;
        bottom: 0;
        height: 1px;
        background-color: #C0C0C0;
    }

    .dropdown-select:hover::after{
        content: "";
        position: absolute;
        left: 1%;
        right: 3%;
        bottom: 0;
        height: 1px;
        background-color: #0052d9;
    }
  
    .dropdown-select.disabled {
      background-color: #f5f5f5;
      cursor: not-allowed;
      color: #999;
    }
  
    .selected-value {
      font-size: 14px;
    }
  
    .dropdown-arrow {
      width: 12px;
      height: 12px;
    }
  
    .options-container {
      position: absolute;
      box-sizing: border-box;
      border: 1px solid #dddddd;
      border-radius: 6px;
      overflow: hidden;
      width: 100%;
      max-height: 115px;
      margin-top: 4px;
      box-shadow: 0 2px 6px rgba(0, 0, 0, 0.1);
      z-index: 100;
    }
  
    .dropdown-options {
      position: relative;
      box-sizing: border-box;
      overflow-y: auto;
      background-color: white;
      z-index: 1000;
      display: flex;
      flex-direction: column;
      align-items: center;
      padding: 4px 0;
      width: 100%;
      max-height: 115px;
    }
  
    .dropdown-option {
      background: white;
      font-family: inherit;
      text-align: left;
      cursor: pointer;
      border: none;
      margin: 1px 0;
      font-size: 14px;
      color: rgba(0, 0, 0, 0.75);
      width: 93%;
      min-height: 28px;
      padding: 6px 12px; /* 上下内边距增加，适配多行 */
      white-space: normal; /* 允许换行 */
      word-break: break-all; /* 长单词/英文自动断行 */
      box-sizing: border-box;
    }
  
    .dropdown-option:hover {
      background-color: rgba(242, 242, 242, 0.35);
      border-radius: 5px;
    }
  
    .dropdown-option.selected {
      background-color: #ecf2fe;
      border-radius: 5px;
    }
  </style>
  