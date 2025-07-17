<!--
 * @Author: chenyijun
 * @Date: 2025-04-19 19:38:33
 * @LastEditors: chenyijun
 * @LastEditTime: 2025-04-20 22:09:37
 -->
<script>
    let { 
        options = [], 
        selected_values = $bindable([]),
        placeholder = '请选择',
        width = 'auto',
        height = '32px',
        backgroundColor = 'white',
        onChangeFunc = (/** @type {any[]} */ values) => { console.log("选项变更为:", values); }
    } = $props();
    
    let is_open = $state(false);
    
    function toggleDropdown() {
        is_open = !is_open;
        
        // 如果打开下拉框，添加document点击事件监听，点击外部时关闭
        if (is_open) {
            // 使用setTimeout确保事件在当前点击事件之后绑定
            setTimeout(() => {
                /**
                 * 关闭下拉框的事件处理函数
                 * @param {MouseEvent} event - 点击事件
                 */
                const closeDropdown = (event) => {
                    const dropdownContainer = document.querySelector('.multi-select-container');
                    if (dropdownContainer && !dropdownContainer.contains(event.target)) {
                        is_open = false;
                        document.removeEventListener('click', closeDropdown);
                    }
                };
                document.addEventListener('click', closeDropdown);
            }, 0);
        }
    }
    
    /**
     * 切换选择状态
     * @param {any} option - 选项对象
     */
    function toggleOption(option) {
        const index = selected_values.findIndex(item => item.value === option.value);
        
        if (index === -1) {
            // 如果不在选中列表中，添加
            selected_values = [...selected_values, option];
        } else {
            // 如果已经在选中列表中，移除
            selected_values = selected_values.filter(item => item.value !== option.value);
        }
        
        // 调用变更回调
        onChangeFunc(selected_values);
    }
    
    /**
     * 检查是否已选中
     * @param {any} value - 选项值
     * @returns {boolean} 是否已选中
     */
    function isSelected(value) {
        return selected_values.some(item => item.value === value);
    }
    
    /**
     * 处理失焦事件
     * @param {FocusEvent} event - 失焦事件
     */
    function handleBlur(event) {
        // 如果点击的是下拉选项，不立即关闭下拉框
        if (event.relatedTarget && (
            event.relatedTarget.classList.contains('dropdown-option') ||
            event.relatedTarget.closest('.dropdown-option')
        )) {
            return;
        }
        is_open = false;
    }
    
    /**
     * 移除已选项
     * @param {any} value - 要移除的选项值
     */
    function removeSelected(value) {
        selected_values = selected_values.filter(item => item.value !== value);
        // 调用变更回调
        onChangeFunc(selected_values);
    }
</script>

<div class="multi-select-container" style="width: {width}">
    <div
        class="multi-select-input {is_open ? 'active' : ''}"
        onclick={toggleDropdown}
        onblur={handleBlur}
        onkeydown={(e) => e.key === 'Enter' && toggleDropdown()}
        tabindex="0"
        role="button"
        style="min-height: {height}; background-color: {backgroundColor};"
    >
        {#if selected_values.length === 0}
            <span class="placeholder">{placeholder}</span>
        {:else}
            <div class="selected-tags">
                {#each selected_values as item}
                    <div class="selected-tag">
                        <span>{item.label}</span>
                        <button 
                            class="remove-tag" 
                            onclick={(e) => { e.stopPropagation(); removeSelected(item.value); }}
                        >×</button>
                    </div>
                {/each}
            </div>
        {/if}
        <img src="/dropdown/arrow_black.png" alt="下拉箭头" class="select-arrow" />
    </div>
    
    {#if is_open}
        <div class="dropdown-menu">
            <div class="dropdown-options">
                {#each options as option}
                    <div 
                        class="dropdown-option {isSelected(option.value) ? 'selected' : ''}" 
                        onclick={(e) => { e.stopPropagation(); toggleOption(option); }}
                        onkeydown={(e) => e.key === 'Enter' && toggleOption(option)}
                        tabindex="0"
                        role="option"
                        aria-selected={isSelected(option.value)}
                    >
                        <label class="checkbox-wrapper">
                            <input 
                                type="checkbox" 
                                checked={isSelected(option.value)}
                                onclick={(e) => e.stopPropagation()}
                                onchange={() => toggleOption(option)}
                            >
                            <span class="checkbox-label">{option.label}</span>
                        </label>
                    </div>
                {/each}
            </div>
        </div>
    {/if}
</div>

<style lang="scss">
    .multi-select-container {
        position: relative;
        cursor: pointer;
        min-width: 120px;
    
        .multi-select-input {
            display: flex;
            align-items: center;
            justify-content: space-between;
            width: 100%;
            border: 1px solid rgba(121, 121, 121, 0.33);
            border-radius: 2px;
            padding: 4px 8px 4px 12px;
            font-size: 14px;
            transition: border-color 0.3s ease, color 0.3s ease;
            flex-wrap: wrap;
            min-height: 32px;
    
            &:hover {
                border-color: #0336ff;
            }
    
            &.active {
                border-color: #0336ff;
            }
            
            .placeholder {
                color: #c0c4cc;
                flex: 1;
            }
            
            .selected-tags {
                display: flex;
                flex-wrap: nowrap;
                overflow-x: auto;
                scrollbar-width: thin;
                -ms-overflow-style: none; /* IE and Edge */
                &::-webkit-scrollbar {
                    height: 1px;
                }
                &::-webkit-scrollbar-thumb {
                    background-color: rgba(0, 0, 0, 0.2);
                    border-radius: 4px;
                }
                gap: 5px;
                flex: 1;
                margin-right: 8px;
                white-space: nowrap;
                padding: 2px 0;
                max-width: calc(100% - 20px); /* 留出箭头的空间 */
            }
            
            .selected-tag {
                display: inline-flex;
                align-items: center;
                background-color: #f0f7ff;
                border: 1px solid #d9ecff;
                border-radius: 3px;
                padding: 0 5px;
                height: 20px;
                font-size: 12px;
                color: #0336ff;
                margin: 2px;
                flex-shrink: 0; /* 防止标签被压缩 */
            }
            
            .remove-tag {
                background: none;
                border: none;
                color: #0336ff;
                cursor: pointer;
                font-size: 14px;
                padding: 0 0 0 3px;
                display: flex;
                align-items: center;
                justify-content: center;
                
                &:hover {
                    color: #f56c6c;
                }
            }
        }
    
        .select-arrow {
            width: 12px;
            height: 12px;
            object-fit: contain;
        }
    
        .dropdown-menu {
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
    
        .dropdown-options {
            max-height: 180px;
            overflow-y: auto;
        }
        
        .dropdown-option {
            padding: 8px 12px;
            font-size: 14px;
            transition: background-color 0.2s ease;
            display: flex;
            align-items: center;
    
            &:hover {
                background-color: #e8e8e8;
            }
    
            &.selected {
                background-color: #e6f1ff;
            }
            
            .checkbox-wrapper {
                display: flex;
                align-items: center;
                width: 100%;
                cursor: pointer;
            }
            
            .checkbox-wrapper input[type="checkbox"] {
                margin-right: 8px;
                width: 16px;
                height: 16px;
                cursor: pointer;
                accent-color: #0336ff;
            }
            
            .checkbox-label {
                flex: 1;
                white-space: nowrap;
                overflow: hidden;
                text-overflow: ellipsis;
            }
        }
    }
</style> 