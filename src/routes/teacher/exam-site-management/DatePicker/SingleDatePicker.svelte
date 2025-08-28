<script>
  // Svelte 4 props风格
  let {
    value = null,
    onSelectDate = (/** @type {Date} */ date) => {},
    onClearDate = () => {},
  } = $props();

  let show_panel = $state(false);
  let input_value = $state("");

  /**
   * @param {Date|null} date
   */
  function format(date) {
    return date ? date.toLocaleDateString("zh-CN") : "";
  }

  /**
   * @param {Date} date
   */
  function selectDate(date) {
    input_value = format(date);
    show_panel = false;
    onSelectDate(date);
  }

  function clear() {
    input_value = "";
    show_panel = false;
    onClearDate();
  }

  // 日历生成
  let today = new Date();
  let currentMonth = $state(new Date(today.getFullYear(), today.getMonth(), 1));

  /**
   * @param {number} year
   * @param {number} month
   */
  function daysInMonth(year, month) {
    return new Date(year, month + 1, 0).getDate();
  }

  /**
   * @param {number} year
   * @param {number} month
   * @returns {(Date|null)[]}
   */
  function getMonthGrid(year, month) {
    const days = [];
    const firstDay = new Date(year, month, 1).getDay();
    const totalDays = daysInMonth(year, month);
    for (let i = 0; i < firstDay; i++) days.push(null);
    for (let d = 1; d <= totalDays; d++) days.push(new Date(year, month, d));
    return days;
  }

  function prevMonth() {
    currentMonth = new Date(
      currentMonth.getFullYear(),
      currentMonth.getMonth() - 1,
      1,
    );
  }
  function nextMonth() {
    currentMonth = new Date(
      currentMonth.getFullYear(),
      currentMonth.getMonth() + 1,
      1,
    );
  }
</script>

<div class="date-picker">
  <input
    type="text"
    readonly
    onclick={() => (show_panel = !show_panel)}
    bind:value={input_value}
    class="input"
    placeholder="请选择日期"
  />
  <button class="date-icon" onclick={() => (show_panel = !show_panel)}>
    <img src="/datepicker/date.png" alt="date" />
  </button>
  {#if show_panel}
    <div class="panel">
      <div class="month-header">
        <button class="month-change-button" onclick={prevMonth}
          ><img src="/datepicker/left.png" alt="left" /></button
        >
        <div>{currentMonth.getFullYear()} / {currentMonth.getMonth() + 1}</div>
        <button class="month-change-button" onclick={nextMonth}
          ><img src="/datepicker/right.png" alt="right" /></button
        >
      </div>
      <div class="week">
        {#each ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"] as wd}
          <div class="day-name">{wd}</div>
        {/each}
      </div>
      <div class="days">
        {#each getMonthGrid(currentMonth.getFullYear(), currentMonth.getMonth()) as date}
          <button
            class="day {date ? '' : 'empty'} {value &&
            date &&
            date.toDateString() === value.toDateString()
              ? 'selected'
              : ''}"
            onclick={() => date && selectDate(date)}
          >
            {date ? date.getDate() : ""}
          </button>
        {/each}
      </div>
      <div class="footer">
        <button class="clear-button" onclick={clear}>清空</button>
        <button class="confirm-button" onclick={() => (show_panel = false)}
          >确认</button
        >
      </div>
    </div>
  {/if}
</div>

<style scoped>
  .date-picker {
    position: relative;
    width: 100%;
    display: flex;
    justify-content: center;
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
    padding: 6px 14px;
    margin-top: 10px;
  }
  .month-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    font-weight: bold;
    font-size: 16px;
    margin-bottom: 5px;
  }
  .week {
    display: grid;
    grid-template-columns: repeat(7, 1fr);
    font-size: 0.75rem;
    text-align: center;
    color: #888;
    margin-bottom: 3px;
  }
  .days {
    display: grid;
    grid-template-columns: repeat(7, 1fr);
  }
  .day {
    box-sizing: border-box;
    padding: 0.4rem;
    text-align: center;
    border-radius: 0;
    cursor: pointer;
    font-size: 14px;
    border: 1px solid transparent;
    background-color: white;
  }
  .day.selected {
    background-color: #0052d9;
    color: white;
  }
  .day.empty {
    visibility: hidden;
  }
  .footer {
    display: flex;
    justify-content: right;
    gap: 8px;
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
    color: #0052d9;
    cursor: pointer;
  }
  .clear-button {
    border: 1px solid #e34d59;
    color: #e34d59;
    cursor: pointer;
  }
  .date-icon {
    position: absolute;
    right: 5px;
    top: 50%;
    transform: translateY(-50%);
    height: 20px;
    width: auto;
    border: none;
    background-color: white;
    cursor: pointer;
  }
</style>
