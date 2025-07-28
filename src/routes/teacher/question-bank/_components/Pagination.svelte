<!-- 
 /*
 * @Author: Mayux dbs45412@163.com
 * @Date: 2025-04-06 16:15:58
 * @LastEditors: Mayux && 1243805308@qq.com
 * @LastEditTime: 2025-07-06 11:13:31
 * @FilePath: \tutorial-platform-fe\src\lib\component\Pagination.svelte
 * @Description: 分页器组件
 * @Props:
 * - total_data_num (number): 总数据条数，默认为100。
 * - total_page_num (number): 总页数，默认为1000。
 * - current_page_num (number): 当前页码，默认为1。
 * - max_show_page_num (number): 最多显示的页码数，默认为5，最小为4。
 * - show_per_page (boolean): 是否显示每页条数选择器，默认为true
 * - data_num_per_page_options (Array): 每页显示数据条数的选项，默认为[{value: 5, label: "5条/页"}, {value: 10, label: "10条/页"}, {value: 20, label: "20条/页"}]。
 * - selected (any): 当前选中的每页显示数据条数选项，根据传入的value显示对应的label。
 * - dropdown_open (boolean): 下拉菜单是否打开。
 * - onPageChangeFunc (function): 点击上一页/下一页时调用的函数，该函数需要接受一个布尔值作为跳转到上一页/下一页的标志。例：
      (is_next)=>{    
        if(is_next){
          console.log("跳转下一页");
        }else{
          console.log("跳转上一页");
        }
      }
 * - onPageChooseFunc (function): 点击页码时调用的函数，该函数需要接受一个代表页数的数字(number)
 * - selectOptionFunc (function): 选择每页显示数据条数选项时调用的函数，选中下拉菜单中某一项时将传入对应项的value作为参数。
 * - onPageSearchFunc (function): 输入页码搜索时调用的函数，当输入框中页码发生改变时就会调用该传入的函数，该函数需要接受一个代表页数的字符串(string)。
 * - expand_direction (string): 下拉框展开的方向,默认为"down"，若要向上则配置为"up"
 * Copyright (c) 2025 by Mayux, All Rights Reserved. 
 */ 
 -->
<script>
  import DropdownGray from "./DropdownGray.svelte";

  const DEFAULT_DATA_NUM_PER_PAGE_OPTIONS = [
    //value为实际值，点击某个选项后将会调用外部传入的处理函数并将value作为参数传入，label为展示在下拉框的值
    {
      value: 5,
      label: "5条/页",
    },
    {
      value: 10,
      label: "10条/页",
    },
    {
      value: 20,
      label: "20条/页",
    },
  ];

  let {
    total_data_num = 0,
    total_page_num = 1,
    current_page_num = 1,
    max_show_page_num = 5,
    data_num_per_page_options = DEFAULT_DATA_NUM_PER_PAGE_OPTIONS,
    show_per_page = true,
    selected = null,
    dropdown_open = false,
    onPageChangeFunc = defaultPageChange,
    onPageChooseFunc = defaultPageChoose,
    selectOptionFunc = defaultSelectOption,
    onPageSearchFunc = (/** @type {string} */ value) => {
      console.log("搜索框输入:" + value);
    },
    expand_direction = "down",
  } = $props();

  //页码数组，用于存储将要显示出的页码
  let pages_array = $derived(
    calculatePagesArray(total_page_num, current_page_num, max_show_page_num),
  );
  let is_open = $derived(dropdown_open);

  let input_value = $state("");

  let search_input = $state();

  /**
   * 默认点击某个页码时调用的函数
   * @param {number} page_num
   */
  function defaultPageChoose(page_num) {
    console.log("跳转" + page_num + "页");
  }

  /**
   * 默认点击上一页/下一页时调用的函数，点击上一页时接收到的参数为false，点击下一页接收到的参数为true
   * @param {boolean} is_next
   */
  function defaultPageChange(is_next) {
    if (is_next) {
      console.log("跳转下一页");
    } else {
      console.log("跳转上一页");
    }
  }

  /**
   * 默认选中下拉菜单选项时调用的函数
   * @param {any} value
   */
  function defaultSelectOption(value) {
    console.log("选中" + value);
    is_open = false;
  }

  /**
   * 默认页码输入框被输入数字时调用的函数
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

      const numericValue = parseFloat(input_value);

      if (numericValue < 1) {
        input_value = "1";
        event.target.value = input_value;
      }

      if (numericValue > total_page_num){
        input_value = total_page_num.toString();
        event.target.value = total_page_num;
      }

      // 调用搜索功能
      onPageSearchFunc(input_value);
    }
  }

  export function clearInput() {
    if (search_input) {
      search_input.value = null;
    }
  }

  /**
   * 计算要展示的页
   * @param {number} total
   * @param {number} current
   * @param {number} maxShow
   */
  function calculatePagesArray(total, current, maxShow) {
    let pages = [];
    if (maxShow <= 3) {
      maxShow = 4;
    }
    let temp_page_num = (maxShow - (maxShow % 2) - 2) / 2;

    //如果总页数小于最多显示的页数，则不需要省略号处理
    if (total <= maxShow) {
      for (let i = 1; i <= total; i++) pages.push(i);
      return pages;
    }

    if (current === 1) {
      for (let i = current; i <= maxShow - 1; i++) pages.push(i);
      pages.push(0);
      pages.push(total);
    } else if (current - 1 > temp_page_num + 1) {
      //当前页距离第一页超过了特定页数时，第一页后面就是省略号
      //如果最后一页距离当前页也超过特定页数，那么最后一页前面也是省略号
      if (total - current > temp_page_num + 1) {
        //第一页后面为省略号
        pages.push(1);
        pages.push(0);

        //省略号中间的部分
        for (let i = current - temp_page_num; i < current; i++) pages.push(i);
        for (let i = current; i <= current + temp_page_num; i++) pages.push(i);

        //最后一页以及最后一页前的省略号
        pages.push(0);
        pages.push(total);
      } else {
        //第一页后面为省略号
        pages.push(1);
        pages.push(0);

        //如果当前显示的页数没有超过最大页数，则自动补全
        if (total - current + temp_page_num + 1 < maxShow) {
          for (
            let i = current - (maxShow - (total - current + 2));
            i <= total;
            i++
          )
            pages.push(i);
        } else {
          for (let i = current - temp_page_num; i <= total; i++) pages.push(i);
        }
      }
    } else {
      //如果当前页距离第一页没有超过特定页数，则不用省略号
      for (let i = 1; i < current; i++) pages.push(i);

      //如果当前显示的页数没有超过最大页数，则自动补全
      if (current + temp_page_num + 1 < maxShow) {
        for (let i = current; i <= maxShow - 1; i++) pages.push(i);
      } else {
        for (let i = current; i <= current + temp_page_num; i++) pages.push(i);
      }

      //最后一页以及最后一页前的省略号
      pages.push(0);
      pages.push(total);
    }

    return pages;
  }
</script>

{#snippet page_button(/** @type {any} */ number)}
  {#if number === current_page_num}
    <button
      class="page-number-button"
      style="background-color:#E8F3FF;color:#165DFF"
      onclick={() => onPageChooseFunc(number)}>{number}</button
    >
  {:else}
    <button class="page-number-button" onclick={() => onPageChooseFunc(number)}
      >{number}</button
    >
  {/if}
{/snippet}

<div class="container">
  <span class="total-data-num-text">总 {total_data_num} 条</span>
  <button class="last-page-button" onclick={() => onPageChangeFunc(false)}>
    {"<"}
  </button>
  <div class="page-button-container">
    {#each pages_array as page_num}
      {#if page_num !== 0}
        {@render page_button(page_num)}
      {:else}
        <span>...</span>
      {/if}
    {/each}
  </div>
  <button class="next-page-button" onclick={() => onPageChangeFunc(true)}>
    {">"}
  </button>
  <div class={show_per_page ? "dropdown" : "hide"}>
    <DropdownGray
      --background_color="#F2F3F5"
      --font_size="12px"
      options={data_num_per_page_options}
      {selected}
      {selectOptionFunc}
      {is_open}
      {expand_direction}
    ></DropdownGray>
  </div>
  <span style="font-size:12px; color:#86909C; padding: 0 8px 0 8px;">前往</span>
  <input
    class="page_jump_input"
    type="number"
    oninput={handleInput}
    bind:this={search_input}
    min="1"
  />
</div>

<style scoped>
  .hide {
    display: none;
  }
  .container {
    display: flex;
    align-items: center;
  }

  .total-data-num-text {
    font-size: 12px;
  }

  .last-page-button,
  .next-page-button {
    width: 25px;
    height: 25px;
    border: none;
    border-radius: 2px;
    background-color: rgba(0, 0, 0, 0);
    cursor: pointer;
  }

  .page-number-button {
    width: 25px;
    height: 25px;
    border: none;
    border-radius: 2px;
    cursor: pointer;
    display: flex;
    justify-content: center;
    align-items: center;
    font-size: 12px;
  }

  .page-button-container {
    display: flex;
    gap: 8px;
  }

  .dropdown {
    align-self: baseline;
    width: 96px;
  }

  .page_jump_input {
    width: 40px;
    height: 24px;
    border: none;
    border-radius: 2px;
    outline: none;
    background-color: #f2f3f5;
    font-size: 12px;
  }
</style>
