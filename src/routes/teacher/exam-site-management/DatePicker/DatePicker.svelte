<!-- 
 /*
 * @Author: 宇昕 马 1243805308@qq.com
 * @Date: 2025-04-08 17:49:19
 * @LastEditors: 宇昕 马 1243805308@qq.com
 * @LastEditTime: 2025-04-10 10:29:40
 * @FilePath: \tutorial-platform-fe\src\lib\component\DatePicker\DatePicker.svelte
 * @Description: 日期选择器组件
 * @Props:
 *      - start_date (Date): 选中的开始日期，默认为当天 new Date()。。
 *      - end_date (Date): 选中的结束日期，默认为 null。
 *      - onSelectDate (function): 选择完日期时调用的回调函数。该函数需要接受两个 Date 类型参数，分别代表选中的开始日期和结束日期。
 *      - onClearDate (function): 清空当前选择的日期时调用的回调函数。
 * @Example:
 *      <DatePicker
 *          onSelectDate={(start, end) => console.log(`选择的日期范围：${start} 至 ${end}`)}
 *          onClearDate={() => console.log('已清空日期')}
 *      />
 * @Copyright: Copyright (c) 2025 by Mayux, All Rights Reserved. 
 */ 
 -->
<script>
    import DoubleCalendar from './DoubleCalendar.svelte';

    let {start_date, end_date, onSelectDate = (/** @type {Date} */ start,/** @type {Date} */ end)=>{console.log("开始日期:"+start);{console.log("结束日期:"+end)}}, onClearDate = ()=>{console.log("重置日期")} } = $props()
  
    let show_panel = $state(false);
    let input_value = $state('');
    let calendar = $state();
  
    /**
     * @param {{ toLocaleDateString: (arg0: string) => any; }} date
     */
    function format(date) {
        // 使用 toLocaleDateString 来指定格式和时区
        return date ? date.toLocaleDateString('zh-CN') : '';
    }
  
    /**
     * @param {{ start: Date; end: Date; }} range
     */
    function handleSelect(range) {
      if(range.start === null ||range.end === null){
        input_value = '';
        return
      }
      let start = range.start;
      let end = range.end;
      input_value = `${format(start)} - ${format(end)}`;
      onSelectDate(start,end);
    }
  
    function confirm() {
      show_panel = false;
      // emit event if needed
    }
  
    function clear() {
      if(calendar){
        calendar.clearSelection();
      }
      show_panel = false;
      onClearDate();
    }
  </script>
  
  <div class = "date-picker">
    <input
      type="text"
      readonly
      onclick={() => (show_panel = !show_panel)}
      bind:value={input_value}
      class="input"
    />

    <button class="date-icon" onclick={() => (show_panel = !show_panel)}><img src = "/datepicker/date.png" alt = "date"/></button>
  
    {#if show_panel}
      <div class="panel">
        <DoubleCalendar bind:this={calendar} {start_date} {end_date} onSelectFunc={(/** @type {{ start: any; end: any; }}} */ e) => handleSelect(e)} />
        <div class="footer">
          <button class = "clear-button" onclick={clear}>清空</button>
          <button class = "confirm-button" onclick={confirm}>确认</button>
        </div>
      </div>
    {/if}
  </div>
  
  <style scoped>
    .date-picker {
      width: 100%;
      height: 100%;
      position: relative;
      box-sizing: border-box;
    }
  
    .input {
      width: 100%;
      height: 100%;
      padding: 6px;
      font-size: 14px;
      outline: none;
      border-radius: 3px;
      border: 1px solid rgb(221, 221, 221, 1);
      box-sizing: border-box;
    }
  
    .panel {
      position: absolute;
      top: 100%;
      z-index: 10;
      background: white;
      border: 1px solid #ccc;
      border-radius: 3px;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
      padding: 6px 14px 6px 14px;
      margin-top: 10px;
    }
  
    .footer {
      display: flex;
      justify-content: right;
      gap:8px;
      margin-top: 1rem;
      margin-bottom: 0.3rem;
      padding-top: 10px;
      border-top: 1px solid #888888;
    }

    .confirm-button,
    .clear-button {
      border: none;
      background-color: white;
      height: 25px;
      width: 50px;
      font-size: 14px;
      border-radius: 3px;
    }

    .confirm-button {
      border: 1px solid #0052d9;
      color:#0052d9;
      cursor: pointer;
    }

    .clear-button{
      border: 1px solid #E34D59;
      color: #E34D59;
      cursor: pointer;
    }

    .date-icon {
      position: absolute;
      right: 5px;
      top: 50%;
      transform: translateY(-50%);
      height: 20px;
      width: auto;
      border:none;
      background-color: white;
      cursor: pointer;
    }
  </style>
  