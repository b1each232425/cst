<!--
  * 日期选择器组件使用说明
  *
  * 作者：熊炜
  * 邮箱：1062051028@qq.com
  *
  * 参数配置：
  * @param {Date} initialStartDate    初始起始日期，可选
  * @param {Date} initialEndDate      初始结束日期，可选
  * @param {Boolean} singleDateSelection 是否单日期选择模式，默认为false
  *
  * 事件说明：
  * @event startDateSelected         起始日期选择时触发，传递选择的日期 { date: Date }
  * @event endDateSelected           结束日期选择时触发，传递选择的日期 { date: Date }
  *
  * 使用示例：
  * <DatePicker
  *   initialStartDate={new Date()}   // 可选，初始起始日期
  *   initialEndDate={new Date()}     // 可选，初始结束日期
  *   singleDateSelection={false}     // 是否单日期选择模式
  *   on:startDateSelected={handleStartDateSelected}  // 监听起始日期变化
  *   on:endDateSelected={handleEndDateSelected}      // 监听结束日期变化
  * />
  *
  * // 请注意：因为我不知道大家具体需要什么格式的时间数据，所以返回的时间数据是最原始的数据格式
  * // 我在该组件的文件下写了数据转换格式的函数，转换后的时间格式：yyyy-mm-dd。大家如果需要别的数据格式请自行转换
  * import { formatDate } from "$lib/components/DatePicker/datePicker";
  * // 父组件处理日期选择事件（获取最新的时间数据）
  * function handleStartDateSelected(event) {
  *   const newStartDate = event.detail.date;
  *   console.log(formatDate(newStartDate.date));
  *   // 处理起始日期逻辑
  * }
  *
  * function handleEndDateSelected(event) {
  *   const endStartDate = event.detail.date;
  *   // 处理结束日期逻辑
  * }
  *
  * 组件功能：
  * 1. 支持单日期选择和日期范围选择两种模式
  * 2. 支持月份切换
  * 3. 支持日期范围高亮显示
  * 4. 支持初始日期设置
  * 5. 支持清空选择
  * 6. 响应式设计，适应不同屏幕尺寸
  */
-->

<script>
  import { onMount, createEventDispatcher } from 'svelte';

  // 从外部传入的属性
  let {
    initialStartDate = null, // 初始起始日期
    initialEndDate = null, // 初始结束日期
    singleDateSelection = false, // 是否单日期选择
  } = $props(); // 获取外部传入的 props

  // 组件内部的状态
  let internalStartDate = $state(null); // 存储起始日期
  let internalEndDate = $state(null); // 存储结束日期
  let isCalendarsVisible = $state(false); // 控制日历的显示与隐藏
  let startYear = $state(new Date().getFullYear()); // 存储起始日期的年份
  let startMonth = $state(new Date().getMonth()); // 存储起始日期的月份
  let endYear = $state(new Date().getFullYear()); // 存储结束日期的年份
  let endMonth = $state(new Date().getMonth()); // 存储结束日期的月份

  // 创建事件分发器，允许向父组件发送事件
  const dispatch = createEventDispatcher();

  // 默认的提示文本
  const DEFAULT_PROMPT = '开始日期   ->   结束日期';
  const SINGLE_DATE_PROMPT = '请选择日期';
  let inputValue = $derived(singleDateSelection ? SINGLE_DATE_PROMPT : DEFAULT_PROMPT);

  // 月份名称，用于显示月份
  const monthNames = [
    '一月',
    '二月',
    '三月',
    '四月',
    '五月',
    '六月',
    '七月',
    '八月',
    '九月',
    '十月',
    '十一月',
    '十二月',
  ];

  // 工具函数：获取某个月份的天数
  const getDaysInMonth = (year, month) => new Date(year, month + 1, 0).getDate();

  // 生成日历数据（包含前后月份的填充）
  const generateCalendar = (year, month) => {
    const firstDay = new Date(year, month, 1).getDay(); // 获取该月的第一天是星期几
    const daysInMonth = getDaysInMonth(year, month); // 获取该月有多少天
    const calendar = [];

    // 填充上个月的日期
    const prevMonth = month - 1 < 0 ? 11 : month - 1;
    const prevYear = prevMonth === 11 ? year - 1 : year;
    const prevMonthDays = getDaysInMonth(prevYear, prevMonth);
    for (let i = prevMonthDays - firstDay + 1; i <= prevMonthDays; i++) {
      calendar.push({ day: i, month: prevMonth, year: prevYear });
    }

    // 填充本月的日期
    for (let i = 1; i <= daysInMonth; i++) {
      calendar.push({ day: i, month, year });
    }

    // 填充下个月的日期
    const remainingCells = 7 - (calendar.length % 7);
    if (remainingCells < 7) {
      const nextMonth = (month + 1) % 12;
      const nextYear = nextMonth === 0 ? year + 1 : year;
      for (let i = 1; i <= remainingCells; i++) {
        calendar.push({ day: i, month: nextMonth, year: nextYear });
      }
    }

    return calendar;
  };

  // 动态生成当前月份的日历
  let startCalendar = $derived(generateCalendar(startYear, startMonth));
  let endCalendar = $derived(generateCalendar(endYear, endMonth));

  // 选择起始日期的处理
  const selectStartDate = (dateObj) => {
    const newDate = new Date(dateObj.year, dateObj.month, dateObj.day);
    internalStartDate = newDate;

    if (singleDateSelection) {
      internalEndDate = new Date(newDate); // 单日期选择时，结束日期等于起始日期
    } else if (internalEndDate && newDate > internalEndDate) {
      internalEndDate = new Date(newDate);
      internalEndDate.setDate(internalEndDate.getDate() + 1); // 结束日期设为起始日期后的次日
      endYear = internalEndDate.getFullYear();
      endMonth = internalEndDate.getMonth();
    }

    dispatch('startDateSelected', { date: newDate }); // 向父组件发送事件
    updateInputValue(); // 更新输入框的显示值
  };

  // 选择结束日期的处理
  const selectEndDate = (dateObj) => {
    const newDate = new Date(dateObj.year, dateObj.month, dateObj.day);
    internalEndDate = newDate;

    if (singleDateSelection) {
      internalStartDate = new Date(newDate); // 单日期选择时，起始日期等于结束日期
      isCalendarsVisible = false; // 选择完日期后隐藏日历
    } else if (internalStartDate && newDate < internalStartDate) {
      internalStartDate = new Date(newDate);
      internalStartDate.setDate(internalStartDate.getDate() - 1); // 结束日期小于起始日期时，起始日期改为结束日期的前一天
      startYear = internalStartDate.getFullYear();
      startMonth = internalStartDate.getMonth();
    }

    dispatch('endDateSelected', { date: newDate }); // 向父组件发送事件
    updateInputValue(); // 更新输入框的显示值
  };

  // 切换月份的函数
  const prevStartMonth = () => {
    startMonth--;
    if (startMonth < 0) {
      startMonth = 11;
      startYear--;
    }
  };

  const nextStartMonth = () => {
    startMonth++;
    if (startMonth > 11) {
      startMonth = 0;
      startYear++;
    }
  };

  const prevEndMonth = () => {
    endMonth--;
    if (endMonth < 0) {
      endMonth = 11;
      endYear--;
    }
  };

  const nextEndMonth = () => {
    endMonth++;
    if (endMonth > 11) {
      endMonth = 0;
      endYear++;
    }
  };

  // 更新输入框的显示值
  const updateInputValue = () => {
    if (singleDateSelection) {
      inputValue = internalStartDate ? formatDate(internalStartDate) : SINGLE_DATE_PROMPT;
    } else if (internalStartDate && internalEndDate) {
      inputValue = `${formatDate(internalStartDate)} → ${formatDate(internalEndDate)}`;
    } else {
      inputValue = DEFAULT_PROMPT;
    }
  };

  // 日期是否在范围内的判断函数
  const isDateInRange = (dateObj) => {
    if (singleDateSelection) {
      return (
        internalStartDate &&
        dateObj.day === internalStartDate.getDate() &&
        dateObj.month === internalStartDate.getMonth() &&
        dateObj.year === internalStartDate.getFullYear()
      );
    }
    if (!internalStartDate || !internalEndDate) return false;
    const date = new Date(dateObj.year, dateObj.month, dateObj.day);
    return date >= internalStartDate && date <= internalEndDate;
  };

  // 格式化日期的工具函数
  const formatDate = (date) => {
    if (!date) return '';
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
  };

  // 重置方法，用于清空选择的日期
  function reset() {
    internalStartDate = null;
    internalEndDate = null;
    inputValue = singleDateSelection ? SINGLE_DATE_PROMPT : DEFAULT_PROMPT;
    startYear = new Date().getFullYear();
    startMonth = new Date().getMonth();
    endYear = new Date().getFullYear();
    endMonth = new Date().getMonth();
  }

  // 响应式更新
  $effect(() => {
    if (internalStartDate) {
      startYear = internalStartDate.getFullYear();
      startMonth = internalStartDate.getMonth();
    }
    if (internalEndDate && !singleDateSelection) {
      endYear = internalEndDate.getFullYear();
      endMonth = internalEndDate.getMonth();
    }
  });

  onMount(() => {
    // 初始化组件，设置初始日期和日历
    if (initialStartDate instanceof Date && initialEndDate instanceof Date) {
      internalStartDate = new Date(initialStartDate);
      internalEndDate = new Date(initialEndDate);
      updateInputValue(); // 更新输入框显示
    } else if (initialStartDate instanceof Date && singleDateSelection) {
      internalStartDate = new Date(initialStartDate);
      internalEndDate = new Date(initialStartDate);
      updateInputValue(); // 更新输入框显示
    }

    // 点击外部关闭日历
    const handleClickOutside = (event) => {
      if (!event.target.closest('.date-picker-container')) {
        isCalendarsVisible = false;
      }
    };
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  });
</script>

<div class="date-picker-container">
  <div class="input-container">
    <input
      type="text"
      class="date-picker"
      readonly
      placeholder={inputValue}
      onclick={() => (isCalendarsVisible = !isCalendarsVisible)}
      style="width:{singleDateSelection ? '140px' : ' 250px'}"
    />
  </div>

  {#if isCalendarsVisible}
    <div class="calendar-main" style="width:{!singleDateSelection ? '550px' : ' 280px'}">
      <div class="dual-calendar-popup" class:single-calendar-mode={singleDateSelection}>
        <div class="calendar">
          <div class="calendar-header">
            <button onclick={prevStartMonth}>«</button>
            <span>{startYear}年 {monthNames[startMonth]}</span>
            <button onclick={nextStartMonth}>»</button>
          </div>
          <div class="calendar-days">
            {#each ['日', '一', '二', '三', '四', '五', '六'] as day}
              <div class="calendar-day-header">{day}</div>
            {/each}
            {#each startCalendar as dateObj}
              <button
                class="calendar-day"
                class:selected={dateObj.day === internalStartDate?.getDate() &&
                  dateObj.month === internalStartDate?.getMonth() &&
                  dateObj.year === internalStartDate?.getFullYear()}
                class:highlighted={isDateInRange(dateObj)}
                class:non-current-month={dateObj.month !== startMonth}
                onclick={() => selectStartDate(dateObj)}
              >
                <div class="init-circle">{dateObj.day}</div>
              </button>
            {/each}
          </div>
        </div>

        {#if !singleDateSelection}
          <div class="calendar">
            <div class="calendar-header">
              <button onclick={prevEndMonth}>«</button>
              <span>{endYear}年 {monthNames[endMonth]}</span>
              <button onclick={nextEndMonth}>»</button>
            </div>
            <div class="calendar-days">
              {#each ['日', '一', '二', '三', '四', '五', '六'] as day}
                <div class="calendar-day-header">{day}</div>
              {/each}
              {#each endCalendar as dateObj}
                <button
                  class="calendar-day"
                  class:selected={dateObj.day === internalEndDate?.getDate() &&
                    dateObj.month === internalEndDate?.getMonth() &&
                    dateObj.year === internalEndDate?.getFullYear()}
                  class:highlighted={isDateInRange(dateObj)}
                  class:non-current-month={dateObj.month !== endMonth}
                  onclick={() => selectEndDate(dateObj)}
                >
                  <div class="init-circle">{dateObj.day}</div>
                </button>
              {/each}
            </div>
          </div>
        {/if}
      </div>

      <div class="calendar-footer">
        <button class="clear-btn" onclick={() => reset()}>清除</button>
        <button class="confirm-btn" onclick={() => (isCalendarsVisible = false)}>确定</button>
      </div>
    </div>
  {/if}
</div>

<style>
  .date-picker-container {
    position: relative;

    .input-container {
      gap: 10px;

      .date-picker {
        border: 1px solid #ccc;
        border-radius: 4px;
        padding: 6px 12px;
        font-size: 17px;
        box-sizing: border-box;
        background-color: white;
        color: #abaaaa;
        background-image: url('/date/date.svg');
        background-repeat: no-repeat;
        background-size: 20px;
        background-position: right 10px center;
        cursor: pointer;
        text-align: left;
      }
    }

    .calendar-main {
      position: absolute;
      display: flex;
      flex-direction: column;
      background-color: white;
      border: 1px solid #ccc;
      box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
      padding: 10px;

      .dual-calendar-popup {
        display: flex;
        gap: 20px;
        top: 40px;
        left: 0;
        border-radius: 8px;
        padding: 10px;
        z-index: 1000;

        .calendar {
          min-width: 250px;
          max-width: 300px;
        }

        .calendar-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 8px;
          border-bottom: 1px solid #eee;
        }

        .calendar-header button {
          all: unset;
          cursor: pointer;
          padding: 0 8px;
          font-size: 16px;
          &:hover {
            background: #f0f0f0;
          }
        }

        .calendar-days {
          display: grid;
          grid-template-columns: repeat(7, 1fr);
          gap: 2px;
          padding: 8px;
        }

        .calendar-day-header {
          text-align: center;
          font-size: 12px;
          color: #666;
          padding: 4px 0;
        }

        .calendar-day {
          all: unset;
          display: flex;
          justify-content: center;
          align-items: center;
          height: 32px;
          font-size: 14px;
          cursor: pointer;
          border-radius: 4px;
          transition: all 0.2s;

          &:hover:not(.non-current-month) {
            background: #f0f6ff;
          }

          &.non-current-month {
            color: #ccc;
            cursor: default;
          }

          &.selected .init-circle {
            background: #007bff;
            color: white;
          }

          &.highlighted {
            background: #e3f2fd;
          }
        }

        .init-circle {
          display: flex;
          justify-content: center;
          align-items: center;
          width: 24px;
          height: 24px;
          border-radius: 50%;
        }
      }

      .calendar-footer {
        display: flex;
        justify-content: flex-end;
        gap: 10px;
        padding-right: 30px;

        .clear-btn,
        .confirm-btn {
          padding: 6px 12px;
          font-size: 14px;
          border: 1px solid #ccc;
          border-radius: 4px;
          cursor: pointer;
        }

        .clear-btn {
          background-color: #f8f8f8;
          color: #333;
        }

        .confirm-btn {
          background-color: #007bff;
          color: white;
        }

        .clear-btn:hover {
          background-color: #f0f0f0;
        }

        .confirm-btn:hover {
          background-color: #0056b3;
        }
      }
    }
  }

  .dual-calendar-popup.single-calendar-mode {
    gap: 0;
  }

  input {
    all: unset;
  }
</style>
