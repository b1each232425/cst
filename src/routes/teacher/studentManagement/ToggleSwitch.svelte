<!--/**
 * @Author: ZouYingXiong && 1584637407@qq.com
 * @Date: 2025-04-23 20:03:03
 * @LastEditors: ZouYingXiong config user.email
 * @LastEditTime: 2025-04-25 09:11:10
 * @FilePath: \tutorial-platform-fe\src\routes\teacher\studentManagement\ToggleSwitch.svelte
 * @Description: 开关组件
 * @Copyright (c) 2025 by ZouYingXiong, All Rights Reserved. 
 */ -->
<script>
    /**
     * 默认的切换函数，什么都不做
     * @function
     */
    function defaultOnToggle() {}

    /**
     * 组件的属性
     * @typedef {Object} Props
     * @property {boolean} [checked=false] - 控制开关的状态，默认为 false
     * @property {function} [onToggle=defaultOnToggle] - 切换状态时的回调函数，默认为 defaultOnToggle
     */

    // 从属性中解构出 checked 和 onToggle，设置默认值
    let { checked = false, onToggle = defaultOnToggle } = $props();
</script>

<label class="switch">
    <input type="checkbox" bind:checked onchange={onToggle} />
    <span class="slider"></span>
</label>

<style lang="scss" scoped>
    .switch {
        position: relative;
        display: inline-block;
        width: 35px;
        height: 20px;
    }

    .switch input {
        opacity: 0;
        width: 0;
        height: 0;
    }

    .slider {
        position: absolute;
        cursor: pointer;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background-color: #c9cdd4;
        transition: 0.4s;
        border-radius: 20px;
    }

    .slider:before {
        position: absolute;
        content: "";
        height: 15px;
        width: 15px;
        left: 2px;
        bottom: 2.5px;
        background-color: white;
        transition: 0.4s;
        border-radius: 50%;
    }

    input:checked + .slider {
        background-color: #03bf16;
    }

    input:checked + .slider:before {
        transform: translateX(16px);
    }
</style>
