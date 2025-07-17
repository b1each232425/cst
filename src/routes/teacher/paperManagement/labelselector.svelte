<!-- /*
 * @Author: wusaber33 
 * @Date: 2025-04-15 22:19:41 
 * @Last Modified by:   wusaber 
 * @Last Modified time: 2025-04-15 22:19:41 
 */
 -->
<script>
    // 标签列表数据，每个标签包含 label 和 selected 属性
    /**
     *  @typedef {Array<Tag>} tags  标签列表，Tag 类型包含 label: string 和 selected: boolean
     */
    let { tags=$bindable() } = $props();

    /**
     * @typedef {Object} Tag  标签对象
     * @property {string} label - 标签名称
     * @property {boolean} selected - 是否选中
     */
    // 下拉框是否打开的状态
    /**
     * @type {boolean} 表示下拉框是否打开
     */
    let is_open = $state(false);

    /**
     * 切换下拉框的显示状态
     */
    function toggleDropdown() {
        is_open = !is_open;
    }

    /**
     * 处理标签的选择状态
     * @param {Tag} tag - 标签对象
     */
    function handleSelect(tag) {
        tag.selected = !tag.selected;
    }

    /**
     * 删除已选标签
     * @param {string} tagLabel - 要删除的标签的文本
     */
    function removeTag(tagLabel) {
        const tag = tags.find((/** @type {{ label: string; }} */ tag) => tag.label === tagLabel);
        if (tag) {
            tag.selected = false;
        }
    }
</script>

<div
    role="button"
    class="tag-selector"
    onmouseleave={toggleDropdown}
    onmouseenter={toggleDropdown}
    tabindex="0"
>
    <div class="dropdown-toggle">
        {#if tags.length > 0}
            <div class="selected-tags">
                {#each tags.filter((/** @type {{ selected: any; }} */ tag) => tag.selected) as tag}
                    <span class="tag">
                        {tag.label}
                        <button
                            class="remove-btn"
                            onclick={() => removeTag(tag.label)}>×</button
                        >
                    </span>
                {/each}
            </div>
        {:else}
            请选择
        {/if}
        <span class="arrow">{is_open ? "▲" : "▼"}</span>
    </div>
    {#if is_open}
        <div class="dropdown-menu">
            {#each tags as tag}
                <label class="dropdown-item {tag.selected ? 'selected' : ''}">
                    <input
                        type="checkbox"
                        class="custom-checkbox"
                        checked={tag.selected}
                        onchange={() => handleSelect(tag)}
                    />
                    {tag.label}
                </label>
            {/each}
        </div>
    {/if}
</div>

<style lang="scss" scoped>
    // 颜色变量
    $primary-color: #0052d9;
    $hover-bg: #f0f4ff;
    $hover-color: #40a9ff;
    $selected-bg: #e6f0ff;
    $border-color: #ccc;
    $text-muted: rgba(0, 0, 0, 0.6);
    $tag-bg: #e0e0e0;

    // 组件基础样式
    .tag-selector {
        position: relative;
        width: 100%;
        font-size: 13px;
        color: $text-muted;
        user-select: none;
    }

    // 下拉触发区域
    .dropdown-toggle {
        display: flex;
        align-items: center;
        flex-wrap: wrap;
        gap: 5px;
        width: 100%;
        padding: 6px 8px;
        border: 1px solid $border-color;
        border-radius: 4px;
        background-color: #fff;
        cursor: pointer;
        transition: border-color 0.3s ease;
        min-height: 20px;
    }

    .dropdown-toggle:hover {
        border-color: $hover-color;
        box-shadow: 0 0 0 2px rgba(24, 144, 255, 0.2);

        .arrow {
            color: $primary-color;
        }
    }

    // 标签显示区域
    .selected-tags {
        display: flex;
        flex-wrap: wrap;
        gap: 5px;
        align-items: center;
        flex-grow: 1;
    }

    .tag {
        display: flex;
        align-items: center;
        background-color: $tag-bg;
        border-radius: 4px;
        padding: 2px 6px;
        font-size: 14px;

        .remove-btn {
            margin-left: 6px;
            border: none;
            background: none;
            font-weight: bold;
            cursor: pointer;
            color: #666;
            line-height: 1;

            &:hover {
                color: red;
            }
        }
    }

    .arrow {
        margin-left: auto;
        font-size: 10px;
    }

    // 下拉内容
    .dropdown-menu {
        position: absolute;
        left: 0;
        width: 100%;
        padding: 8px 6px;
        background-color: #fff;
        border: 1px solid $border-color;
        border-radius: 4px;
        box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
        z-index: 10;
        max-height: 100px;
        overflow-y: auto;
    }

    // 单项标签样式
    .dropdown-item {
        display: flex;
        align-items: center;
        padding: 6px 12px;
        font-size: 14px;
        cursor: pointer;
        transition: background-color 0.2s ease;

        &.selected {
            background-color: $selected-bg;
        }

        &:hover {
            background-color: $hover-bg;
        }

        input {
            margin-right: 8px;
        }
    }

    // 自定义复选框样式
    .custom-checkbox {
        appearance: none;
        width: 14px;
        height: 14px;
        border: 1px solid $primary-color;
        border-radius: 2px;
        background-color: #fff;
        position: relative;
        cursor: pointer;
        margin-top: 1px;

        &:checked {
            background-color: #fff;

            &::after {
                content: "";
                position: absolute;
                left: 3px;
                top: 1px;
                width: 4px;
                height: 8px;
                border: solid $primary-color;
                border-width: 0 2px 2px 0;
                transform: rotate(45deg);
            }
        }
    }
</style>
