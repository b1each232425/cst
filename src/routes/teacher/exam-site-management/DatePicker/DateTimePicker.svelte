<!-- 
 /*
 * @Author: Mayux dbs45412@163.com
 * @Date: 2025-04-10 20:46:46
 * @LastEditors: Mayux && 1243805308@qq.com
 * @LastEditTime: 2025-06-05 23:35:14
 * @FilePath: \tutorial-platform-fe\src\lib\component\DatePicker\DateTimePicker.svelte
 * @Description: 
 *      - start_date (Date): 选中的开始日期，默认为当天 new Date()。
 *      - end_date (Date): 选中的结束日期，默认为 null。
 *      - onSelectDate (function): 选择完日期时调用的回调函数。该函数需要接受两个 Date 类型参数，分别代表选中的开始日期和结束日期。
 *      - min_date (Date): 可选择的最小时间，默认为当前时间
 * @Example:
 *      <DateTimePicker
 *          onSelectDate={(start, end) => console.log(`选择的日期范围：${start} 至 ${end}`)}
 *          onClearDate={() => console.log('已清空日期')}
 *      />
 * Copyright (c) 2025 by Mayux, All Rights Reserved. 
 */ 
 -->
<script>
    import CalendarWithTime from "./CalendarWithTime.svelte";


  let {start_date = new Date(), end_date, onSelectDate = (/** @type {Date} */ start,/** @type {Date} */ end)=>{console.log("开始日期:"+start);{console.log("结束日期:"+end)}}, min_date = new Date()} = $props()

  let left_input_value = $state('');
  let right_input_value = $state('');
  let calendar = $state();

  /**
   * @param { Date } date
   */
  function format(date) {
    if (!date) return '';
      return date.toLocaleString('zh-CN', {
          year: 'numeric',
          month: '2-digit',
          day: '2-digit',
          hour: '2-digit',
          minute: '2-digit',
          
          // 不显示秒
          second: undefined
      });
  }

  /**
   * @param {{ start: Date; end: Date; }} range
   */
  function handleSelect(range) {
    if(range.start === null){
      left_input_value = '';
    }else{
      left_input_value = format(range.start)
    }

    if(range.end === null){
      right_input_value = '';
    }else{
      right_input_value = format(range.end)
    }
    onSelectDate(range.start,range.end);
  }

</script>

<div class = "date-time-picker">
  <div class="double-input-container">
    <div class="input-container">
      <input
        type="text"
        readonly
        onclick={() => {if(calendar) calendar.togglePanel(true);}}
        bind:value={left_input_value}
        class="input"
      />

      <button class="date-icon" onclick={() => {if(calendar) calendar.togglePanel(true);}}><img src = "/datepicker/date.png" alt = "date"/></button>
    </div>

    <span style="text-align: center; padding: 0 3px 0 3px;">~</span>

    <div class="input-container">
      <input
        type="text"
        readonly
        onclick={() => {if(calendar) calendar.togglePanel(false);}}
        bind:value={right_input_value}
        class="input"
      />

      <button class="date-icon" onclick={() => {if(calendar) calendar.togglePanel(false);}}><img src = "/datepicker/date.png" alt = "date"/></button>
    </div>
  </div>
  <div class="panel">
    <CalendarWithTime bind:this={calendar} start_date_prop = {start_date} end_date_prop = {end_date} onSelectFunc={(/** @type {{ start: any; end: any; }}} */ e) => handleSelect(e)} min_date_props = {min_date}/>
  </div>
</div>


<style scoped>
  .date-time-picker {
    width: 100%;
    height: 100%;
    position: relative;
    box-sizing: border-box;
  }

  .double-input-container{
    display: flex;
    flex-direction: row;
  }
  .input-container {
    position: relative;
    height: 32px;
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
    left: -26%;
    z-index: 10;
    background: rgb(0, 0, 0, 0);
    padding: 6px 14px 6px 14px;
    margin-top: 10px;
    width: 800px;
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
