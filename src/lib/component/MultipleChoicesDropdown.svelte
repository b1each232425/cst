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
      selected = [],
      placeholder = "请选择",
      disabled = false,
      is_open = false,
      selectOptionFunc = defaultSelectOption
    } = $props();
  
    function toggleDropdown() {
      if (!disabled) is_open = !is_open;
    }
  
    /**
     * @param {Array<string>} value
     */
    function defaultSelectOption(value) {
      console.log("选中"+value);
    }
  
    /**
     * @param {string} value
     */
     function changeValue(value) {
        const index = selected.indexOf(value);
        if (index === -1) {
            selected = [...selected, value];
        } else {
            selected = selected.filter(v => v !== value);
        }
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
      }, 100);
    }
  </script>
  
  <div class="dropdown-container">
    <div class="dropdown-container-outside-border">
      <button
        class="dropdown-select"
        class:disabled
        onclick={toggleDropdown}
        onkeydown={handleKeyDown}

        {disabled}
        aria-expanded={is_open}
        aria-haspopup="listbox"
      >
        <span
          class="selected-value"
          title={selected.length > 0
            ? options.filter(o => selected.includes(o.value)).map(o => o.label).join(', ')
            : placeholder}
        >
            {selected.length > 0
            ? options.filter(o => selected.includes(o.value)).map(o => o.label).join(', ')
            : placeholder}
        </span>
        <img src="/dropdown/arrow_blue.png" alt="Dropdown Arrow" class="dropdown-arrow">
      </button>
    </div>
  
    {#if is_open && !disabled}
    <div class="options-container">
      <div class="dropdown-options" role="listbox">
        {#each options as option (option.value)}
          <button
            class="dropdown-option"
            class:selected={selected.includes(option.value)}
            aria-selected={selected.includes(option.value)}
            role="option"
            onclick={() => {      
                changeValue(option.value);
                selectOptionFunc(selected);
            }}
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
  
    .dropdown-container-outside-border {
      box-sizing: border-box;
      width: 100%;
      height: 100%;
      border-radius: 4px;
    }
  
    .dropdown-select {
      appearance: none;
      background: white;
      border: 1px solid rgba(221, 221, 221, 1);
      font-family: inherit;
      text-align: left;
      padding: 6px 12px;
      cursor: pointer;
      width: 100%;
      height: 100%;
      display: flex;
      justify-content: space-between;
      align-items: center;
      border-radius: 3px;
      user-select: none;
      overflow: hidden;
    }
  
    .dropdown-select.disabled {
      background-color: #f5f5f5;
      cursor: not-allowed;
      color: #999;
    }
  
    .selected-value {
      font-size: 14px;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      display: block;
      width: 100%;
      max-width: 250px;
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
      height: 28px;
      padding: 0 12px;
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
  