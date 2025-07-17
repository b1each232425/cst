<!-- 
 /*
 * @Author: 宇昕 马 1243805308@qq.com
 * @Date: 2025-04-10 19:48:20
 * @LastEditors: Mayux && 1243805308@qq.com
 * @LastEditTime: 2025-06-06 00:46:51
 * @FilePath: \tutorial-platform-fe\src\lib\component\DatePicker\CalendarWithTime.svelte
 * @Description: 带时间的日历组件
 * Copyright (c) 2025 by Mayux, All Rights Reserved. 
 */ 
 -->
<script>
    let {
        start_date_prop = new Date(),
        end_date_prop = new Date(),
        show_left = false,
        show_right = false,
        onSelectFunc = (/** @type {{ start: Date; end: Date; }} */ range) => {
            console.log(range.start, range.end);
        },
        min_date_props = new Date(),
    } = $props();

    // 左侧日历当前月份
    let current_month_left = $state(new Date());

    let min_date = $derived(getMinDate(min_date_props))

    //用于记录上一次的最小日期
    let min_date_record = $state(new Date(min_date_props))

    $effect(()=>{

        //如果传入的最小日期更新了，需要对整体的时间进行更新
        let is_same = areDatesEqual(min_date,min_date_record)
        if (is_same ===false){
            min_date_record = min_date;
            getFilteredTimes()
        }
    })

    let start_date = $derived(new Date(start_date_prop))
    let end_date = $derived(new Date(end_date_prop))

    let left_open = $derived(show_left)
    let right_open = $derived(show_right)

    //列容器
    let startHoursColumn = $state(null);
    let startMinutesColumn = $state(null);
    let endHoursColumn = $state(null);
    let endMinutesColumn = $state(null);

    // 右侧日历当前月份
    let current_month_right = $state();

    let start_time = $derived(getHMS(start_date));
    let end_time = $derived(getHMS(end_date));

    const HOURS = Array.from({ length: 24 }, (_, i) => i);
    const MINUTES = Array.from({ length: 60 }, (_, i) => i);
    // const SECONDS = Array.from({ length: 60 }, (_, i) => i);

    let default_start_hours = $state(HOURS);
    let default_start_minutes = $state(MINUTES);
    // let default_start_seconds = $state(SECONDS);

    let default_end_hours = $state(HOURS);
    let default_end_minutes = $state(MINUTES);
    // let default_end_seconds = $state(SECONDS);

    $effect(()=>{

        //当左边面板打开时将选中的时间滚动到正中间
        if(left_open && show_left){
            left_open = false
            scrollToSelected(startHoursColumn,start_time.h,24,default_start_hours.length)
            scrollToSelected(startMinutesColumn,start_time.m,60,default_start_minutes.length)
        }

        //当右边面板打开时将选中的时间滚动到正中间
        if(left_open && show_left){
            right_open = false
            scrollToSelected(endHoursColumn,end_time.h,24,default_end_hours.length)
            scrollToSelected(endMinutesColumn,end_time.m,60,default_end_minutes.length)
        }
    })

    // 检查两个日期是否为同一日期和时间
    /**
     * @param {Date} date1
     * @param {Date} date2
     */
    function areDatesEqual(date1, date2) {
        return date1.getTime() === date2.getTime();
    }

    export function resetStartDate() {
        start_time = { h: 0, m: 0, s: 0 };
        start_date = new Date()
        getFilteredTimes();
    }

    export function resetEndDate() {
        end_date = null;
        end_time = { h: 0, m: 0, s: 0 };
        getFilteredTimes();
    }

    /**
     * @param {boolean} is_left
     */
    export function togglePanel(is_left){
        if(is_left){
            show_left = !show_left
        }else{
            show_right = !show_right
        }
    }

    /**
     * @param {Date} date
     */
    function getHMS(date) {
        let hms = { h: 0, m: 0, s: 0 };
        if (date instanceof Date) {
            hms.h = date.getHours();
            hms.m = date.getMinutes();
            hms.s = 0;
            return hms;
        } else {
            return hms;
        }
    }

    /**
     * @param {string | number | Date} date
     */
    function getMinDate(date){
        const mdate = new Date(date);
        mdate.setSeconds(0, 0);
        return mdate;
    }

    function initializeCurrentMonthRight() {
        current_month_right = new Date(current_month_left);
    }

    initializeCurrentMonthRight();

    /**
     * @param {number} year
     * @param {number} month
     */
    function daysInMonth(year, month) {
        return new Date(year, month + 1, 0).getDate();
    }

    /**
     * 用于计算当前月份的起始占位，在第一周时为前一月份空出对应的天数
     * @param {number} year
     * @param {number} month
     */
    function getMonthGrid(year, month) {
        const days = [];
        const firstDay = new Date(year, month, 1).getDay();
        const totalDays = daysInMonth(year, month);
        const prevMonthDays = firstDay;

        for (let i = 0; i < prevMonthDays; i++) {
            days.push(null); // 空白占位
        }

        for (let d = 1; d <= totalDays; d++) {
            days.push(new Date(year, month, d));
        }
        return days;
    }

    /**
     * 用于在鼠标点击时选中日期
     * @param {Date} date
     */
    function selectStartDate(date) {
        let temp_date = new Date(date)
        let temp_min_date = new Date(min_date)
        if(temp_date.setHours(0,0,0,0) < temp_min_date.setHours(0,0,0,0)){
            return
        }

        if (end_date && date > end_date) {
            end_date = date;
        } else {
            start_date = date;
        }
    }

    /**
     * 用于在鼠标点击时选中日期
     * @param {number | Date} date
     */
    function selectEndDate(date) {
        end_date = date;
        triggerEndSelect();
    }

    function triggerStartSelect() {
        if (start_date) {
            const combined = new Date(start_date);
            combined.setHours(start_time.h);
            combined.setMinutes(start_time.m);
            combined.setSeconds(0); // 固定为00秒
            start_date = combined;
        }
    }

    function triggerEndSelect() {
        if (end_date) {
            const combined = new Date(end_date);
            combined.setHours(end_time.h);
            combined.setMinutes(end_time.m);
            combined.setSeconds(0); // 固定为00秒
            end_date = combined;
        }
    }

    /**
     * @param {Date} date
     */
    function formatTitle(date) {
        return `${date.getFullYear()} / ${date.getMonth() + 1}`;
    }

    /**
     * 用于判断两天是否为同一天
     * @param {Date} a
     * @param {Date} b
     */
    function sameDate(a, b) {
        
        return (
            a &&
            b &&
            a.getFullYear() === b.getFullYear() &&
            a.getMonth() === b.getMonth() &&
            a.getDate() === b.getDate()
        );
    }

    //用于确保左右两侧月份正确显示
    function prevLeftMonth() {
        let new_date = new Date(current_month_left);
        new_date.setMonth(new_date.getMonth() - 1);

        // 不允许左侧月 >= 右侧月
        if (
            new_date.getFullYear() * 12 + new_date.getMonth() <=
            current_month_right.getFullYear() * 12 +
                current_month_right.getMonth()
        ) {
            current_month_left = new Date(new_date);
        }
    }
    function nextLeftMonth() {
        let new_date = new Date(current_month_left);
        new_date.setMonth(new_date.getMonth() + 1);
        // 必须保持 current_month_left < current_month_right
        if (
            new_date.getFullYear() * 12 + new_date.getMonth() <=
            current_month_right.getFullYear() * 12 +
                current_month_right.getMonth()
        ) {
            current_month_left = new Date(new_date);
        }
    }
    function prevRightMonth() {
        let new_date = new Date(current_month_right);
        new_date.setMonth(new_date.getMonth() - 1);
        // 必须保持 current_month_right > current_month_left
        if (
            new_date.getFullYear() * 12 + new_date.getMonth() >=
            current_month_left.getFullYear() * 12 +
                current_month_left.getMonth()
        ) {
            current_month_right = new Date(new_date);
        }
    }
    function nextRightMonth() {
        let new_date = new Date(current_month_right);
        new_date.setMonth(new_date.getMonth() + 1);
        current_month_right = new Date(new_date);
    }

    /**
     * @param {{ getFullYear: () => number; getMonth: () => number; getDate: () => number; }} date
     */
    function isToday(date) {
        const now = new Date();
        return (
            date &&
            date.getFullYear() === now.getFullYear() &&
            date.getMonth() === now.getMonth() &&
            date.getDate() === now.getDate()
        );
    }

    function getNextHourTime() {
        const now = new Date();
        now.setHours(now.getHours() + 1, 0, 0, 0); // +1小时，整点
        return {
            h: now.getHours(),
            m: now.getMinutes(),
            s: now.getSeconds(),
        };
    }

    //用于调整时间选择器的时钟数组
    function getFilteredHours() {
        //如果开始时间比最小时间要小，先将开始时间赋值为最小时间，再将结束时间设置为开始时间后一分钟
        if(start_date < min_date){
            start_date = new Date(min_date)
            end_date = new Date(start_date)
            end_date.setMinutes(start_date.getMinutes()+1)
            default_start_hours = HOURS;
        }

        // 若是同一天，则限制开始时间为min_date.getHours()
        if (sameDate(start_date,min_date)) {
            default_start_hours = HOURS.filter((h) => h >= min_date.getHours());
            start_time.h > min_date.getHours()
                ? (start_time.h = start_time.h)
                : (start_time.h = min_date.getHours());
        } else{
            default_start_hours = HOURS;
        }

        // 限制结束时间 > 开始时间
        if (sameDate(start_date, end_date)) {
            if(start_date.getMinutes() === 59){
                default_end_hours = HOURS.filter(
                    (h) => h > start_time.h+1 || h === start_time.h+1,
                );
            }else{
                default_end_hours = HOURS.filter(
                    (h) => h > start_time.h || h === start_time.h,
                );
            }
            end_time.h > start_time.h
                ? (end_time.h = end_time.h)
                : (end_time.h = start_time.h);
        } else {
            default_end_hours = HOURS;
        }
    }

    //用于调整时间选择器的分钟数组
    function getFilteredMinutes() {

        // 调整开始时间的分钟数范围，如果和min_date同一天，则限制开始时间为min_date.getMinutes()的后一分钟
        if (sameDate(min_date, start_date)) {
            if (start_time.h === min_date.getHours()) {
                const minMinute = min_date.getMinutes();
                const nextMinute = minMinute;

                // 设置开始时间的分钟数范围从最小分钟数的后一分钟开始
                default_start_minutes = MINUTES.filter((m) => m >= nextMinute);
                // 确保开始时间不小于最小分钟数+1
                start_time.m = start_time.m > nextMinute ? start_time.m : nextMinute;
            } else {
                default_start_minutes = MINUTES;
            }
        } else {
            default_start_minutes = MINUTES;
        }

        // 如果开始时间和结束时间是同一天并且是同一小时，调整结束分钟数
        if (sameDate(start_date, end_date)) {
            if (start_time.h === end_time.h) {
                // 获取左边选择的分钟数
                const leftMinute = start_time.m;
                const nextMinute = leftMinute + 1;

                // 处理23:59的特殊情况
                if (start_time.h === 23 && leftMinute === 59) {
                    // 将结束时间设置为下一天的00:00
                    const nextDay = new Date(start_date);
                    nextDay.setDate(nextDay.getDate() + 1);
                    nextDay.setHours(0, 0, 0, 0);
                    end_date = nextDay;
                    end_time.h = 0;
                    end_time.m = 0;
                    default_end_hours = HOURS;
                    default_end_minutes = MINUTES;
                } 
                else if(start_time.h !== 23 && leftMinute === 59){
                    default_end_hours = HOURS.filter((m) => m >= start_date.getHours()+1);
                    default_end_minutes = MINUTES;
                    end_time.h = start_time.h+1
                    end_time.m = 0
                }else {
                    // 设置右边的分钟数范围从左边分钟的后一分钟开始
                    default_end_minutes = MINUTES.filter((m) => m >= nextMinute);
                    
                    // 确保结束时间不小于左边的分钟
                    end_time.m = end_time.m > nextMinute ? end_time.m : nextMinute;
                }
            } else {
                default_end_minutes = MINUTES;
            }
        } else if(start_date>end_date){
            
        } else {
            default_end_minutes = MINUTES;
        }
    }
    
    // //用于调整时间选择器的秒数组
    // function getFilteredSeconds() {
    //     const date = start_date;

    //     // if (isToday(date)) {
    //     //     const next = getNextHourTime();
    //     //     if (start_time.h === next.h && start_time.m === next.m) {
    //     //         default_start_seconds = SECONDS.filter((s) => s >= next.s);
    //     //     }
    //     // } else {
    //     //     default_start_seconds = SECONDS;
    //     // }

    //     if (sameDate(start_date, end_date)) {
    //         if (end_time.h === start_time.h && end_time.m === start_time.m) {
    //             default_end_seconds = SECONDS.filter((s) => s > start_time.s);
    //             end_time.s > start_time.s
    //                 ? (end_time.s = end_time.s)
    //                 : (end_time.s = default_end_seconds[0]);
    //         } else {
    //             default_end_seconds = SECONDS;
    //         }
    //     } else {
    //         default_end_seconds = SECONDS;
    //     }
    // }

    function getFilteredTimes() {
        getFilteredHours();
        getFilteredMinutes();
        // getFilteredSeconds();
        triggerStartSelect();
        triggerEndSelect();

        const start = start_date;
        const end = end_date
        let range = {
            start:start,
            end:end,
        }
        //将选择到的日期和时间传递出去
        onSelectFunc(range);
    }

    function scrollToSelected(/** @type {HTMLElement} */ column, /** @type {number} */ selectedIndex, /** @type {number} */ totalIndex, /** @type {number} */nowIndex) {
        if (!column) return;

        let trueIndex = selectedIndex-(totalIndex - nowIndex)
        
        const buttonHeight = 27.8; // 每个按钮的高度
        const columnHeight = column.clientHeight;
        const visibleButtons = Math.floor(columnHeight / buttonHeight);
        const scrollPosition = (trueIndex - Math.floor(visibleButtons / 2)) * buttonHeight;
        
        column.scrollTo({
            top: scrollPosition,
            behavior: 'smooth'
        });
    }

    getFilteredTimes();

</script>

    <!-- 左侧日历 -->
    <div class="left-container  {show_left ? '' : 'hide'}">
        <div class="calendar-time-container-left">
            <div class="cal-body">
                <div class="month">
                    <div class="month-header">
                        <button
                            class="month-change-button"
                            onclick={prevLeftMonth}
                            ><img
                                src="/datepicker/left.png"
                                alt="left"
                            /></button
                        >
                        <div>{formatTitle(current_month_left)}</div>
                        <button
                            class="month-change-button"
                            onclick={nextLeftMonth}
                            ><img
                                src="/datepicker/right.png"
                                alt="right"
                            /></button
                        >
                    </div>
                    <div class="week">
                        {#each ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"] as wd}
                            <div class="day-name">{wd}</div>
                        {/each}
                    </div>
                    <div class="days">
                        {#each getMonthGrid(current_month_left.getFullYear(), current_month_left.getMonth()) as date}
                            <button
                                class="day
                        {date ? '' : 'empty'} 
                        {date && sameDate(date, start_date)
                                    ? 'select-date'
                                    : ''} 
                        {date && sameDate(date, new Date()) ? 'today' : ''}
                        {date &&
                                start_date &&
                                date.setHours(0, 0, 0, 0) <
                                    new Date(min_date).setHours(0, 0, 0, 0)
                                    ? 'disabled'
                                    : ''}"
                                disabled={date &&
                                    start_date &&
                                    date.setHours(0, 0, 0, 0) <
                                        new Date(min_date).setHours(
                                            0,
                                            0,
                                            0,
                                            0,
                                        )}
                                onclick={() => {
                                    if (date) {
                                        selectStartDate(date);
                                    }
                                    getFilteredTimes();
                                }}
                            >
                                {date ? date.getDate() : ""}
                            </button>
                        {/each}
                    </div>
                </div>
            </div>

            <div class="line"></div>

            <!-- 时间选择器 -->
            <div class="time-picker-container">
                <div class="time-show">
                    {start_time.h.toString().padStart(2, "0") +
                        ":" +
                        start_time.m.toString().padStart(2, "0") +
                        ":" +
                        "00"}
                </div>
                <div class="time-picker">
                    <div class="column" bind:this={startHoursColumn}>
                        {#each default_start_hours as h}
                            <button
                                class:selected={h === start_time.h}
                                onclick={() => {
                                    start_time.h = h;
                                    getFilteredTimes();
                                    scrollToSelected(startHoursColumn, h, 24, default_start_hours.length);
                                }}
                            >
                                {h.toString().padStart(2, "0")}
                            </button>
                        {/each}
                    </div>
                    <div class="column" bind:this={startMinutesColumn}>
                        {#each default_start_minutes as m}
                            <button
                                class:selected={m === start_time.m}
                                onclick={() => {
                                    start_time.m = m;
                                    getFilteredTimes();
                                    scrollToSelected(startMinutesColumn, m, 60, default_start_minutes.length);
                                }}
                            >
                                {m.toString().padStart(2, "0")}
                            </button>
                        {/each}
                    </div>
                    <!-- <div class="column">
                        {#each default_start_seconds as s}
                            <button
                                class:selected={s === start_time.s}
                                onclick={() => {
                                    start_time.s = s;
                                    getFilteredTimes();
                                }}
                            >
                                {s.toString().padStart(2, "0")}
                            </button>
                        {/each}
                    </div> -->
                </div>
            </div>
        </div>
        <div class="footer">
            <button
                class="clear-button"
                onclick={() => {
                    resetStartDate();
                }}>重置</button
            >
            <button
                class="confirm-button"
                onclick={() => {
                    show_left = false;
                }}>确认</button
            >
        </div>
    </div>

    <div class="right-container {show_right ? '' : 'hide'}">
        <div
            class="calendar-time-container-right "
        >
            <div class="cal-body">
                <div class="month">
                    <div class="month-header">
                        <button
                            class="month-change-button"
                            onclick={prevRightMonth}
                            ><img
                                src="/datepicker/left.png"
                                alt="left"
                            /></button
                        >
                        <div>{formatTitle(current_month_right)}</div>
                        <button
                            class="month-change-button"
                            onclick={nextRightMonth}
                            ><img
                                src="/datepicker/right.png"
                                alt="right"
                            /></button
                        >
                    </div>
                    <div class="week">
                        {#each ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"] as wd}
                            <div class="day-name">{wd}</div>
                        {/each}
                    </div>
                    <div class="days">
                        {#each getMonthGrid(current_month_right.getFullYear(), current_month_right.getMonth()) as date}
                            <button
                                class="day
                    {date ? '' : 'empty'} 
                    {date && sameDate(date, end_date) ? 'select-date' : ''} 
                    {date && sameDate(date, new Date()) ? 'today' : ''}
                    {date &&
                                start_date &&
                                date.setHours(0, 0, 0, 0) <
                                    new Date(start_date).setHours(0, 0, 0, 0)
                                    ? 'disabled'
                                    : ''}"
                                disabled={date &&
                                    start_date &&
                                    date.setHours(0, 0, 0, 0) <
                                        new Date(start_date).setHours(
                                            0,
                                            0,
                                            0,
                                            0,
                                        )}
                                onclick={() => {
                                    if (date) {
                                        selectEndDate(date);
                                    }
                                    getFilteredTimes();
                                }}
                            >
                                {date ? date.getDate() : ""}
                            </button>
                        {/each}
                    </div>
                </div>
            </div>

            <div class="line"></div>

            <!-- 时间选择器 -->
            <div class="time-picker-container">
                <div class="time-show">
                    {end_time.h.toString().padStart(2, "0") +
                        ":" +
                        end_time.m.toString().padStart(2, "0") +
                        ":" +
                        "00"}
                </div>
                <div class="time-picker">
                    <div class="column" bind:this={endHoursColumn}>
                        {#each default_end_hours as h}
                            <button
                                class:selected={h === end_time.h}
                                onclick={() => {
                                    end_time.h = h;
                                    getFilteredTimes();
                                    scrollToSelected(endHoursColumn, h, 24, default_end_hours.length);
                                }}
                            >
                                {h.toString().padStart(2, "0")}
                            </button>
                        {/each}
                    </div>
                    <div class="column" bind:this={endMinutesColumn}>
                        {#each default_end_minutes as m}
                            <button
                                class:selected={m === end_time.m}
                                onclick={() => {
                                    end_time.m = m;
                                    getFilteredTimes();
                                    scrollToSelected(endMinutesColumn, m, 60, default_end_minutes.length);
                                }}
                            >
                                {m.toString().padStart(2, "0")}
                            </button>
                        {/each}
                    </div>
                    <!-- <div class="column">
                        {#each default_end_seconds as s}
                            <button
                                class:selected={s === end_time.s}
                                onclick={() => {
                                    end_time.s = s;
                                    getFilteredTimes();
                                }}
                            >
                                {s.toString().padStart(2, "0")}
                            </button>
                        {/each}
                    </div> -->
                </div>
            </div>
        </div>
        <div class="footer">
            <button
                class="clear-button"
                onclick={() => {
                    resetEndDate();
                }}>重置</button
            >
            <button
                class="confirm-button"
                onclick={() => {
                    show_right = false;
                }}>确认</button
            >
        </div>
    </div>


<style scoped>

    .hide {
        display: none;
    }

    .left-container,
    .right-container {
        border: 1px solid rgb(221, 221, 221, 1);
        border-radius: 3px;
        background-color: white;
        width: 350px;
    }

    .left-container {
        position: absolute;
        left:3%;
    }

    .right-container {
        position:absolute;
        left: 47%;
    }

    .calendar-time-container-left,
    .calendar-time-container-right {
        display: flex;
        padding: 5px;
        flex-direction: row;
        gap: 0.5rem;
    }

    .time-picker-container {
        display: flex;
        flex-direction: column;
        gap: 0.3rem;
    }

    .cal-body {
        display: flex;
        gap: 1.5rem;
    }

    .month {
        display: flex;
        flex-direction: column;
        gap: 0.3rem;
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
        position: relative;
        font-size: 14px;
        line-height: 1.2;
        border: 1px solid transparent;
        transition: background 0.15s;
        background-color: white;
    }

    .day:hover {
        background-color: #d4e3fc;
        border-radius: 3px;
    }

    .select-date {
        background-color: #0052d9;
        border-radius: 3px;
        color: white;
        z-index: 1;
    }

    .select-date::before {
        content: "";
        position: absolute;
        top: 50%;
        left: 50%;
        width: 30px;
        height: 30px;
        background: #0052d9;
        transform: translate(-50%, -50%);
        z-index: -1;
        border-radius: 3px;
    }

    .today::after {
        content: "";
        position: absolute;
        bottom: 3px;
        left: 50%;
        transform: translateX(-50%);
        width: 4px;
        height: 4px;
        background: #699ef5;
        border-radius: 50%;
    }

    .empty {
        visibility: hidden;
    }

    .month-change-button {
        border: none;
        background-color: white;
        cursor: pointer;
        transition: transform 0.2s ease;
    }

    .month-change-button:hover {
        transform: scale(1.2); /* 鼠标悬停时放大 20% */
    }

    .line {
        width: 1px;
        background-color: rgb(221, 221, 221, 1);
    }

    .time-show {
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 14px;
        font-weight: bold;
        height: 25px;
        margin-bottom: 5px;
    }

    .time-picker {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        font-size: 14px;
    }

    .column {
        max-height: 160px;
        overflow-y: auto;
        background: white;
        border-radius: 6px;
        width: 50px;
        font-size: 14px;
        text-align: center;
    }

    .column button {
        padding: 0.4rem;
        cursor: pointer;
        border-radius: 4px;
        border: none;
        background-color: white;
        width: 100%;
    }

    .column button.selected {
        background-color: #e6f0ff;
        color: #0052d9;
        font-weight: bold;
    }

    .column::-webkit-scrollbar {
        display: none;
    }

    .day.disabled {
        color: #aaa;
        cursor: not-allowed;
        pointer-events: none;
    }

    .footer {
        display: flex;
        justify-content: right;
        gap: 8px;
        margin-top: 1rem;
        margin-bottom: 0.3rem;
        padding-top: 10px;
        padding-right: 5px;
        border-top: 1px solid rgb(221, 221, 221, 1);
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
</style>
