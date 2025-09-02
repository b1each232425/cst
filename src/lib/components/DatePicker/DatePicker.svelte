<!--
  日期选择器组件说明
  作者：熊炜
  邮箱：1062051028@qq.com

  参数配置：
  @param {Date} initial_start_date    初始起始日期，可选
  @param {Date} initial_end_date      初始结束日期，可选
  @param {Boolean} single_date_selection 是否启用单日期选择模式，默认为true
  @param {Boolean} is_time_selection  是否启用时间选择模式，默认为false
  @param {String} input_width        输入框宽度，默认为 '140px'

  事件说明：
  @event start_date_selected          选择起始日期时触发，传递日期对象 { date: Date }
  @event end_date_selected            选择结束日期时触发，传递日期对象 { date: Date }

  使用示例：
  <DatePicker
    bind:this={date_picker}                           // 与创建的日期选择器对象绑定
    initial_start_date={new Date('2023-02-09 20:30')}  // 可选，初始起始日期
    initial_end_date={new Date('2023-02-09 20:30')}    // 可选，初始结束日期
    is_time_selection={false}        // 启用具体时间范围选择
    is_single_date_selection={true}     // 选择单日期选择器还是双日期选择器
    input_width={'300px'}           // 自定义宽度
    on:start_date_selected={handleStartDateSelected}  // 监听起始日期变化
    on:end_date_selected={handleEndDateSelected}      // 监听结束日期变化
  />

  组件功能：
  1. 支持单日期选择和日期范围选择两种模式
  2. 支持月份切换
  3. 支持日期范围高亮显示
  4. 支持初始日期设置
  5. 支持清空选择
  6. 响应式设计，适应不同屏幕尺寸
  7. 支持时间选择模式（小时、分钟）

  额外说明：
  - 请注意：因为日期格式因需求而异，组件返回的时间数据是原始的 JavaScript Date 对象。如果需要自定义格式，请使用组件内提供的 `format_date` 函数。
  - 示例：`formatDate` 函数可以将日期转换为 `yyyy-mm-dd HH:MM` 格式。如果需要其他格式，可以根据需求进行转换。

  例如，父组件处理日期选择事件：

  ```javascript
  import DatePicker from '$lib/components/DatePicker/DatePicker.svelte';
  import { formatDate } from "$lib/components/DatePicker/datePicker";

  let date_picker; //创建日期选择器对象

  // 处理起始日期选择事件
  function handleStartDateSelected(event) {
    const new_start_date = event.detail.date;
    console.log(formatDate(new_start_date));
    // 处理起始日期逻辑
  }

  // 处理结束日期选择事件
  function handleEndDateSelected(event) {
    const new_end_date = event.detail.date;
    console.log(formatDate(new_end_date));
    // 处理结束日期逻辑
  }

  // 重置日期
  function resetDate(){
    date_picker.reset()
  }
-->

<script>
  import { onMount, createEventDispatcher } from 'svelte';

  // 从外部传入的属性
  let {
    initial_start_date = null, // 初始的开始日期
    initial_end_date = null, // 初始的结束日期
    is_single_date_selection = true, // 是否启用单日期选择模式，默认为true
    is_time_selection = false, // 是否启用时间选择模式，默认为false
    input_width = '140px', // 输入框宽度，默认为 '140px'
    onDateReset = () => {},
    onDateConfirm = () => {},
  } = $props();

  // 校验传入参数
  (() => {
    // 校验 initial_start_date 参数
    if (initial_start_date && !(initial_start_date instanceof Date)) {
      console.warn(`[DatePicker] initial_start_date 应该是 Date 类型，当前为 ${typeof initial_start_date}`);
      initial_start_date = null; // 设置默认值为 null
    }

    // 校验 initial_end_date 参数
    if (initial_end_date && !(initial_end_date instanceof Date)) {
      console.warn(`[DatePicker] initial_end_date 应该是 Date 类型，当前为 ${typeof initial_end_date}`);
      initial_end_date = null; // 设置默认值为 null
    }

    // 校验 is_single_date_selection 参数
    if (typeof is_single_date_selection !== 'boolean') {
      console.warn(`[DatePicker] is_single_date_selection 应该是 boolean，当前为 ${typeof is_single_date_selection}`);
      is_single_date_selection = true; // 设置默认值为 true
    }

    // 校验 is_time_selection 参数
    if (typeof is_time_selection !== 'boolean') {
      console.warn(`[DatePicker] is_time_selection 应该是 boolean，当前为 ${typeof is_time_selection}`);
      is_time_selection = false; // 设置默认值为 false
    }

    // 校验 input_width 参数
    if (typeof input_width !== 'string') {
      console.warn(`[DatePicker] input_width 应该是字符串，当前为 ${typeof input_width}`);
      input_width = '140px'; // 设置默认值为 '140px'
    }

    // 校验 onDateReset 参数
    if (typeof onDateReset !== 'function') {
      console.warn(`[DatePicker] onDateReset 应该是函数，当前为 ${typeof onDateReset}`);
      onDateReset = () => {}; // 设置默认值为空函数
    }

    // 校验 onDateConfirm 参数
    if (typeof onDateConfirm !== 'function') {
      console.warn(`[DatePicker] onDateConfirm 应该是函数，当前为 ${typeof onDateConfirm}`);
      onDateConfirm = () => {}; // 设置默认值为空函数
    }
  })();

  // 组件内部的状态
  let internal_start_date = $state(null); // 当前选择的开始日期
  let internal_end_date = $state(null); // 当前选择的结束日期
  let is_calendars_visible = $state(false); // 控制日历的显示或隐藏
  let start_year = $state(new Date().getFullYear()); // 存储开始日期的年份
  let start_month = $state(new Date().getMonth()); // 存储开始日期的月份
  let end_year = $state(new Date().getFullYear()); // 存储结束日期的年份
  let end_month = $state(new Date().getMonth()); // 存储结束日期的月份
  let selected_start_hour = $state(new Date().getHours()); // 当前选择的开始小时
  let selected_start_minute = $state(new Date().getMinutes()); // 当前选择的开始分钟
  let selected_end_hour = $state(new Date().getHours()); // 当前选择的结束小时
  let selected_end_minute = $state(new Date().getMinutes()); // 当前选择的结束分钟
  let date_input_element; // 绑定到输入框的DOM元素
  let start_hour_column = $state(); // 起始小时列的DOM元素
  let start_minute_column = $state(); // 起始分钟列的DOM元素
  let end_hour_column = $state(); // 结束小时列的DOM元素
  let end_minute_column = $state(); // 结束分钟列的DOM元素

  // 创建事件分发器，用于向父组件传递事件
  const dispatch = createEventDispatcher();

  // 默认的提示文本
  const DEFAULT_PROMPT = '开始日期   ~   结束日期';
  const SINGLE_DATE_PROMPT = '请选择日期';

  // 根据是否启用单日期选择模式决定显示的默认提示文本
  let input_value = $derived(is_single_date_selection ? SINGLE_DATE_PROMPT : DEFAULT_PROMPT);

  // 月份名称，用于显示月份
  const month_names = ['1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月'];

  // 获取某个月份的天数
  const getDaysInMonth = (year, month) => new Date(year, month + 1, 0).getDate();

  // 生成日历数据，包括前后月份的填充
  const generateCalendar = (year, month) => {
    const first_day = new Date(year, month, 1).getDay(); // 获取该月的第一天是星期几
    const days_in_month = getDaysInMonth(year, month); // 获取该月的天数
    const calendar = [];

    // 填充上个月的日期
    const prev_month = month - 1 < 0 ? 11 : month - 1;
    const prev_year = prev_month === 11 ? year - 1 : year;
    const prev_month_days = getDaysInMonth(prev_year, prev_month);
    for (let i = prev_month_days - first_day + 1; i <= prev_month_days; i++) {
      calendar.push({ day: i, month: prev_month, year: prev_year });
    }

    // 填充当前月的日期
    for (let i = 1; i <= days_in_month; i++) {
      calendar.push({ day: i, month, year });
    }

    // 填充下个月的日期
    const remaining_cells = 7 - (calendar.length % 7); // 计算当前月剩余的天数
    if (remaining_cells < 7) {
      const next_month = (month + 1) % 12;
      const next_year = next_month === 0 ? year + 1 : year;
      for (let i = 1; i <= remaining_cells; i++) {
        calendar.push({ day: i, month: next_month, year: next_year });
      }
    }

    return calendar;
  };

  // 动态生成当前月份的日历
  let start_calendar = $derived(generateCalendar(start_year, start_month));
  let end_calendar = $derived(generateCalendar(end_year, end_month));

  // 选择开始日期
  const selectStartDate = (date_obj) => {
    const prev_hours = internal_start_date ? internal_start_date.getHours() : selected_start_hour;
    const prev_minutes = internal_start_date ? internal_start_date.getMinutes() : selected_start_minute;

    const new_date = new Date(date_obj.year, date_obj.month, date_obj.day, prev_hours, prev_minutes);
    internal_start_date = new_date;

    // 如果是单日期选择模式，结束日期与开始日期相同
    if (is_single_date_selection) {
      internal_end_date = new Date(new_date);
      selected_end_hour = selected_start_hour;
      selected_end_minute = selected_start_minute;
    } else if (internal_end_date && new_date > internal_end_date) {
      internal_end_date = new Date(new_date);
      internal_end_date.setDate(internal_end_date.getDate());
      end_year = internal_end_date.getFullYear();
      end_month = internal_end_date.getMonth();
    }

    // 更新选择的开始时间
    selected_start_hour = new_date.getHours();
    selected_start_minute = new_date.getMinutes();

    // 触发事件，将选择的日期传递给父组件
    dispatch('start_date_selected', { date: new_date });
    updateInputValue();
  };

  // 选择结束日期
  const selectEndDate = (date_obj) => {
    const prev_hours = internal_end_date ? internal_end_date.getHours() : selected_end_hour;
    const prev_minutes = internal_end_date ? internal_end_date.getMinutes() : selected_end_minute;

    const new_date = new Date(date_obj.year, date_obj.month, date_obj.day, prev_hours, prev_minutes);
    internal_end_date = new_date;

    // 如果当终止日期早于起始日期，起始日期应被正确更新为终止日期
    if (internal_start_date && new_date < internal_start_date) {
      internal_start_date = new Date(new_date);
      internal_start_date.setDate(internal_start_date.getDate());
      start_year = internal_start_date.getFullYear();
      start_month = internal_start_date.getMonth();
    }

    // 更新选择的结束时间
    selected_end_hour = new_date.getHours();
    selected_end_minute = new_date.getMinutes();

    // 触发事件，将选择的日期传递给父组件
    dispatch('end_date_selected', { date: new_date });
    updateInputValue();
  };

  // 上一月
  const prevStartMonth = () => {
    start_month--;
    if (start_month < 0) {
      start_month = 11;
      start_year--;
    }
  };

  // 下一月
  const nextStartMonth = () => {
    start_month++;
    if (start_month > 11) {
      start_month = 0;
      start_year++;
    }
  };

  // 上一月
  const prevEndMonth = () => {
    end_month--;
    if (end_month < 0) {
      end_month = 11;
      end_year--;
    }
  };

  // 下一月
  const nextEndMonth = () => {
    end_month++;
    if (end_month > 11) {
      end_month = 0;
      end_year++;
    }
  };

  // 上一年
  const prevStartYear = () => {
    start_year--;
  };

  // 下一年
  const nextStartYear = () => {
    start_year++;
  };

  // 上一年
  const prevEndYear = () => {
    end_year--;
  };

  // 下一年
  const nextEndYear = () => {
    end_year++;
  };

  // 更新输入框的显示值
  const updateInputValue = () => {
    if (is_single_date_selection) {
      input_value = internal_start_date ? formatDate(internal_start_date) : SINGLE_DATE_PROMPT;
    } else if (internal_start_date && internal_end_date) {
      input_value = `${formatDate(internal_start_date)} ~ ${formatDate(internal_end_date)}`;
    } else {
      input_value = DEFAULT_PROMPT;
    }
  };

  // 判断日期是否在选择范围内
  const isDateInRange = (date_obj) => {
    if (is_single_date_selection) {
      return (
        internal_start_date &&
        date_obj.day === internal_start_date.getDate() &&
        date_obj.month === internal_start_date.getMonth() &&
        date_obj.year === internal_start_date.getFullYear()
      );
    }
    if (!internal_start_date || !internal_end_date) return false;
    const date = new Date(date_obj.year, date_obj.month, date_obj.day);
    return date >= internal_start_date && date <= internal_end_date;
  };

  // 格式化日期为 'yyyy/mm/dd' 或者带时间的 'yyyy/mm/dd hh:mm'
  const formatDate = (date) => {
    if (is_time_selection) {
      return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')} ${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
    } else {
      return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
    }
  };

  // 更新开始时间（小时或分钟）
  const updateStartTime = (type, value) => {
    if (!internal_start_date) {
      internal_start_date = new Date();
    }

    if (type === 'hour') {
      internal_start_date.setHours(value);
      selected_start_hour = value;
    } else if (type === 'minute') {
      internal_start_date.setMinutes(value);
      selected_start_minute = value;
    }

    // 检查并调整结束时间
    if (internal_end_date && internal_start_date > internal_end_date) {
      internal_end_date = new Date(internal_start_date);
      selected_end_hour = selected_start_hour;
      selected_end_minute = selected_start_minute;
      dispatch('end_date_selected', { date: internal_end_date });
    }

    dispatch('start_date_selected', { date: internal_start_date });
    updateInputValue();
  };

  // 更新结束时间（小时或分钟）
  const updateEndTime = (type, value) => {
    if (!internal_end_date) {
      internal_end_date = new Date();
    }

    if (type === 'hour') {
      internal_end_date.setHours(value);
      selected_end_hour = value;
    } else if (type === 'minute') {
      internal_end_date.setMinutes(value);
      selected_end_minute = value;
    }

    // 检查并调整开始时间
    if (internal_start_date && internal_end_date < internal_start_date) {
      internal_start_date = new Date(internal_end_date);
      selected_start_hour = selected_end_hour;
      selected_start_minute = selected_end_minute;
      dispatch('start_date_selected', { date: internal_start_date });
    }

    dispatch('end_date_selected', { date: internal_end_date });
    updateInputValue();
  };

  // 重置日期选择器
  export function reset() {
    internal_start_date = null;
    internal_end_date = null;
    initial_start_date = null;
    initial_end_date = null;
    input_value = is_single_date_selection ? SINGLE_DATE_PROMPT : DEFAULT_PROMPT;

    // 设置当前年份和月份
    const now = new Date();
    start_year = now.getFullYear();
    start_month = now.getMonth();
    end_year = now.getFullYear();
    end_month = now.getMonth();

    selected_start_hour = null;
    selected_start_minute = null;
    selected_end_hour = null;
    selected_end_minute = null;

    updateInputValue();

    onDateReset();
  }

  // 确认日期
  export function dateConfirm() {
    is_calendars_visible = false;
    onDateConfirm();
  }

  // 滚动到选中的时间位置
  const scrollToSelectedTime = () => {
    if (!is_time_selection) return;

    setTimeout(() => {
      if (start_hour_column && selected_start_hour !== null) {
        const hour_element = start_hour_column.querySelector(`button[data-hour="${selected_start_hour}"]`);
        if (hour_element) hour_element.scrollIntoView({ block: 'center' });
      }
      if (start_minute_column && selected_start_minute !== null) {
        const minute_element = start_minute_column.querySelector(`button[data-minute="${selected_start_minute}"]`);
        if (minute_element) minute_element.scrollIntoView({ block: 'center' });
      }
      if (!is_single_date_selection) {
        if (end_hour_column && selected_end_hour !== null) {
          const hour_element = end_hour_column.querySelector(`button[data-hour="${selected_end_hour}"]`);
          if (hour_element) hour_element.scrollIntoView({ block: 'center' });
        }
        if (end_minute_column && selected_end_minute !== null) {
          const minute_element = end_minute_column.querySelector(`button[data-minute="${selected_end_minute}"]`);
          if (minute_element) minute_element.scrollIntoView({ block: 'center' });
        }
      }
    }, 50);
  };

  // 设置初始时间
  const setInitialTime = () => {
    is_calendars_visible = !is_calendars_visible;

    // 自动滚动到对应的时间
    if (is_calendars_visible) {
      scrollToSelectedTime();
    }

    if (internal_start_date) {
      return;
    }

    const now = new Date();

    if (!initial_start_date || !(initial_start_date instanceof Date)) {
      internal_start_date = new Date(now);
      selected_start_hour = now.getHours();
      selected_start_minute = now.getMinutes();
    }

    if (!initial_end_date || !(initial_end_date instanceof Date)) {
      internal_end_date = new Date(now);
      selected_end_hour = now.getHours();
      selected_end_minute = now.getMinutes();
    }

    if (initial_start_date instanceof Date) {
      internal_start_date = new Date(initial_start_date);
      selected_start_hour = internal_start_date.getHours();
      selected_start_minute = internal_start_date.getMinutes();
    }

    if (initial_end_date instanceof Date) {
      internal_end_date = new Date(initial_end_date);
      selected_end_hour = internal_end_date.getHours();
      selected_end_minute = internal_end_date.getMinutes();
    }

    if (is_single_date_selection) {
      internal_end_date = new Date(internal_start_date);
      selected_end_hour = selected_start_hour;
      selected_end_minute = selected_start_minute;
    }

    updateInputValue();
    dispatch('start_date_selected', { date: internal_start_date });
    dispatch('end_date_selected', { date: internal_end_date });
  };

  // 时间格式化函数
  function formatDateTime(date) {
    if (!date) return null;
    const pad = (n) => String(n).padStart(2, '0');
    const year = date.getFullYear();
    const month = pad(date.getMonth() + 1);
    const day = pad(date.getDate());
    const hours = pad(date.getHours());
    const minutes = pad(date.getMinutes());
    return `${year}-${month}-${day} ${hours}:${minutes}`;
  }

  $effect(() => {
    // 如果有初始值就转成字符串
    if (initial_start_date) {
      input_value = formatDateTime(initial_start_date);
    }

    if (initial_start_date && initial_end_date) {
      input_value = `${formatDateTime(initial_start_date)} ~ ${formatDateTime(initial_end_date)}`;
    }
  });

  // 初始化日期选择器
  onMount(() => {
    date_input_element.style.setProperty('--date-picker-width', input_width);

    const handleClickOutside = (event) => {
      if (!event.target.closest('.date-picker-container')) {
        is_calendars_visible = false;
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
      bind:value={input_value}
      bind:this={date_input_element}
      onclick={() => setInitialTime()}
    />
  </div>

  {#if is_calendars_visible}
    <div class="calendar-main">
      <div class="dual-calendar-popup" class:single-calendar-mode={is_single_date_selection}>
        <div class="calendar">
          <div class="calendar-header">
            <button onclick={prevStartYear} data-testid="start-pre-month">
              <img class="img-year" src="/datepicker/pre_year.svg" alt="" />
            </button>
            <button onclick={prevStartMonth} data-testid="start-pre-month">
              <img class="img-month" src="/datepicker/pre_month.svg" alt="" />
            </button>

            <span data-testid="start-current-date">{`${start_year}年 ${month_names[start_month]}`}</span>
            <button onclick={nextStartMonth} data-testid="start-next-month">
              <img class="img-month" src="/datepicker/next_month.svg" alt="" />
            </button>
            <button onclick={nextStartYear} data-testid="start-pre-month">
              <img class="img-year" src="/datepicker/next_year.svg" alt="" />
            </button>
          </div>
          <div class="calendar-days">
            {#each ['日', '一', '二', '三', '四', '五', '六'] as day}
              <div class="calendar-day-header">{day}</div>
            {/each}
            {#each start_calendar as date_obj}
              <button
                class="calendar-day"
                class:selected={date_obj.day === internal_start_date?.getDate() &&
                  date_obj.month === internal_start_date?.getMonth() &&
                  date_obj.year === internal_start_date?.getFullYear()}
                class:highlighted={isDateInRange(date_obj)}
                class:non-current-month={date_obj.month !== start_month}
                onclick={() => selectStartDate(date_obj)}
                data-testid={`start-date-button-${date_obj.day}`}
              >
                <div class="init-circle">{date_obj.day}</div>
              </button>
            {/each}
          </div>
        </div>

        {#if is_time_selection}
          <div class="time-select">
            <div class="time-column" bind:this={start_hour_column}>
              {#each Array(24)
                .fill()
                .map((_, i) => i) as hour}
                <button
                  class:selected={hour === selected_start_hour}
                  onclick={() => updateStartTime('hour', hour)}
                  data-hour={hour}
                  data-testid={`start-hour-${String(hour).padStart(2, '0')}`}
                  >{String(hour).padStart(2, '0')}
                </button>
              {/each}
            </div>
            <div class="time-column" bind:this={start_minute_column}>
              {#each Array(60)
                .fill()
                .map((_, i) => i) as minute}
                <button
                  class:selected={minute === selected_start_minute}
                  onclick={() => updateStartTime('minute', minute)}
                  data-minute={minute}
                  data-testid={`start-minute-${String(minute).padStart(2, '0')}`}
                  >{String(minute).padStart(2, '0')}</button
                >
              {/each}
            </div>
          </div>
        {/if}

        {#if !is_single_date_selection}
          <div class="calendar">
            <div class="calendar-header">
              <button onclick={prevEndYear} data-testid="start-pre-month">
                <img class="img-year" src="/datepicker/pre_year.svg" alt="" />
              </button>
              <button onclick={prevEndMonth} data-testid="start-pre-month">
                <img class="img-month" src="/datepicker/pre_month.svg" alt="" />
              </button>
              <span data-testid="end-current-date">{`${end_year}年 ${month_names[end_month]}`}</span>
              <button onclick={nextEndMonth} data-testid="start-next-month">
                <img class="img-month" src="/datepicker/next_month.svg" alt="" />
              </button>
              <button onclick={nextEndYear} data-testid="start-pre-month">
                <img class="img-year" src="/datepicker/next_year.svg" alt="" />
              </button>
            </div>
            <div class="calendar-days">
              {#each ['日', '一', '二', '三', '四', '五', '六'] as day}
                <div class="calendar-day-header">{day}</div>
              {/each}
              {#each end_calendar as date_obj}
                <button
                  class="calendar-day"
                  class:selected={date_obj.day === internal_end_date?.getDate() &&
                    date_obj.month === internal_end_date?.getMonth() &&
                    date_obj.year === internal_end_date?.getFullYear()}
                  class:highlighted={isDateInRange(date_obj)}
                  class:non-current-month={date_obj.month !== end_month}
                  onclick={() => selectEndDate(date_obj)}
                  data-testid={`end-date-button-${date_obj.day}`}
                >
                  <div class="init-circle">{date_obj.day}</div>
                </button>
              {/each}
            </div>
          </div>

          {#if !is_single_date_selection && is_time_selection}
            <div class="time-select">
              <div class="time-column" bind:this={end_hour_column}>
                {#each Array(24)
                  .fill()
                  .map((_, i) => i) as hour}
                  <button
                    class:selected={hour === selected_end_hour}
                    onclick={() => updateEndTime('hour', hour)}
                    data-hour={hour}
                    data-testid={`end-hour-${String(hour).padStart(2, '0')}`}
                  >
                    {String(hour).padStart(2, '0')}</button
                  >
                {/each}
              </div>
              <div class="time-column" bind:this={end_minute_column}>
                {#each Array(60)
                  .fill()
                  .map((_, i) => i) as minute}
                  <button
                    class:selected={minute === selected_end_minute}
                    onclick={() => updateEndTime('minute', minute)}
                    data-minute={minute}
                    data-testid={`end-minute-${String(minute).padStart(2, '0')}`}
                    >{String(minute).padStart(2, '0')}</button
                  >
                {/each}
              </div>
            </div>
          {/if}
        {/if}
      </div>

      <div class="calendar-footer">
        <button class="cancel-btn" onclick={dateConfirm}>取消</button>
        <button class="clear-btn" onclick={reset}>清除</button>
        <button class="confirm-btn" onclick={dateConfirm}>确定</button>
      </div>
    </div>
  {/if}
</div>

<style>
  .date-picker-container {
    position: relative;

    .date-picker {
      border: 1px solid #ccc;
      border-radius: 4px;
      width: var(--date-picker-width);
      height: 30px;
      padding: 6px 32px 6px 12px; /* 右边32px给图标留空间 */
      font-size: 16px;
      box-sizing: border-box;
      background-color: white;
      color: var(--text-secondary);
      background-image: url('/date/date1.svg');
      background-repeat: no-repeat;
      background-size: 20px;
      background-position: right 10px center;
      text-align: center;
      cursor: pointer;
      /* 调整文本视觉居中 */
      padding-right: calc(32px + 10px); /* 图标宽+右间距 */
    }

    .calendar-main {
      position: absolute;
      display: flex;
      flex-direction: column;
      background-color: white;
      border: 1px solid #ccc;
      box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
      padding: 0px 10px 10px;
      z-index: 1000;

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

          .calendar-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 8px;
            border-bottom: 1px solid #eee;

            .img-month {
              width: 10px;
            }

            .img-year {
              width: 16px;
            }
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
              background: #e3f2fd;
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

        .time-select {
          display: flex;
          margin-top: 40px;
          justify-content: space-between;
          gap: 5px;

          .time-column {
            display: grid;
            grid-template-columns: repeat(1, 1fr);
            width: 50%;
            max-height: 200px;
            overflow: hidden;
            position: relative;
            overflow-y: scroll;

            button {
              scroll-snap-align: center;
            }
          }

          .time-column:hover {
            overflow-y: scroll;
          }

          .time-column button {
            width: 100%;
            padding: 10px;
            margin: 2px 0;
            background-color: white;
            border: 1px solid #ddd;
            cursor: pointer;
            text-align: center;
            font-size: 12px;
            transition: background-color 0.2s;
            border-radius: 4px;
          }

          .time-column button:hover {
            background-color: #e3f2fd;
          }

          .time-column button:focus {
            outline: none;
          }

          .time-column button.selected {
            background-color: #a3c8ff;
            color: white;
          }

          /* 隐藏滚动条，但允许滚动 */
          .time-column::-webkit-scrollbar {
            width: 0px;
            height: 0px;
          }
        }
      }

      .calendar-footer {
        display: flex;
        justify-content: flex-end;
        gap: 10px;
        padding-right: 10px;

        .clear-btn,
        .cancel-btn,
        .confirm-btn {
          padding: 6px 12px;
          font-size: 14px;
          border: 1px solid #ccc;
          border-radius: 4px;
          cursor: pointer;
        }

        /* 清除按钮 - 红色警告 */
        .clear-btn {
          background-color: #ff4d4f;
          color: white;
          border-color: #ff4d4f;
        }

        .clear-btn:hover {
          background-color: #ff7875;
        }

        /* 取消按钮 - 使用原先清除按钮样式 */
        .cancel-btn {
          background-color: #f8f8f8;
          color: #333;
        }

        .cancel-btn:hover {
          background-color: #f0f0f0;
        }

        /* 确认按钮 */
        .confirm-btn {
          background-color: #007bff;
          color: white;
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
