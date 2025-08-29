<!-- 
 /*
 * @Author: Mayux dbs45412@163.com
 * @Date: 2025-04-06 16:15:58
 * @LastEditors: Mayux && 1243805308@qq.com
 * @LastEditTime: 2025-06-11 20:29:04
 * @FilePath: \tutorial-platform-fe\src\lib\component\SearchInput.svelte
 * @Description: 搜索框组件
 * @Props: 
 * - purpose_text (string): 搜索框前的提示文字
 * - place_holder (string)
 * - onSearchFunc (function): 当搜索框输入发生改变时执行该传入的参数，该函数需要接受一个string参数（搜索框中的值）。
 * Copyright (c) 2025 by Mayux, All Rights Reserved. 
 */ 
 -->
<script>

    let {
        onSearchFunc = (/** @type {string} */ value) => {
            console.log("搜索框输入:" + value);
        },
        purpose_text = "搜索",
        place_holder = "搜索...",
    } = $props();

    let input_value = $state("");

    let search_input = $state();

    /**
     * @param {Event & { currentTarget: EventTarget | HTMLInputElement; }} event - 输入事件
     */
    function handleInput(event) {
        if (
        event &&
        event.target &&
        "value" in event.target &&
        typeof event.target.value === "string"
        ) {
        input_value = event.target.value;
        onSearchFunc(input_value);
        }
    }

    function clearInput(){
        if(search_input){
            search_input.value = "";
            input_value = "";

            //手动调用并传入空字符串
            onSearchFunc("");
        }
    }
</script>

<div class="container">
    <span class="purpose-text">{purpose_text}</span>
    <div class="search-input-container">
        <input
            type="text"
            bind:value={input_value}
            bind:this={search_input}
            oninput={handleInput}
            placeholder={place_holder}
            class="search-input"
        />
        {#if input_value}
        <div class="clear-button-container">
            <button class="clear-button" onclick={clearInput}>x</button>
        </div>
        {/if}
    </div>
</div>

<style lang="scss" scoped>
    $search-input-container-height: var(--search_input_container_height,32px);
    $search-input-container-width: var(--search_input_container_width,375px);

    .container {
        display: flex;
        align-items: center;
    }

    .purpose-text {
        font-size: 14px;
        color: rgb(0, 0, 0, 0.6);
        padding: 0 17px 0 0;
        width: auto;
        text-align: right;
        white-space: nowrap;
    }

    .search-input-container{
        width: $search-input-container-width;
        height: $search-input-container-height;
        border: 1px solid rgb(221, 221, 221, 1);
        border-radius: 3px;
        box-sizing: border-box;       
        display: flex;
        align-items: center;
        padding: 0 0 0 5px;
    }
    
    .search-input-container:focus{
        border-color: #0052d9;
    }

    .search-input {
        height: 25px;
        border: none;
        width: 100%;
        outline: none;
        font-size: 14px;
        text-overflow: ellipsis;
    }

    .clear-button-container {
        display: flex;
        align-items: center;
        justify-content: center;
        min-width: 25px;
        min-height: 25px;
        width:25px;
        height:25px;
    }

    .clear-button {
        background: none;
        border: none;
        padding: 0px;
        cursor: pointer;
    }

</style>
