<!-- 
 /*
 * @Author: Mayux dbs45412@163.com
 * @Date: 2025-04-06 19:41:29
 * @LastEditors: Mayux dbs45412@163.com
 * @LastEditTime: 2025-04-06 19:53:48
 * @FilePath: \tutorial-platform-fe\src\routes\gradeManagement\exam\SquareCheckBox.svelte
 * @Description: 复选框组件
 * Copyright (c) 2025 by Mayux, All Rights Reserved. 
 */ 
 -->
<script>
    let isChecked = $state(false);

    function toggleCheck() {
        isChecked = !isChecked;
    }
</script>

<button
    class="square-container {isChecked ? 'checked' : ''}"
    onclick={toggleCheck}
>
    {#if isChecked}
        <div class="check-square"></div>
    {/if}
</button>

<style scoped>
    .square-container {
        width: 19px;
        height: 19px;
        background-color: white;
        display: flex;
        justify-content: center;
        align-items: center;
        cursor: pointer;
        border: 2px solid #E5E6EB;
        padding: 0 0 0 0;
    }

    .square-container:hover {
        background-color: #e0e0e0;
        border-color: #aaa;
    }

    .check-square {
        width: 11px;
        height: 11px;
        background-color: #165DFF;
    }

    .square-container.checked .check-square {
        opacity: 1;
    }
</style>
