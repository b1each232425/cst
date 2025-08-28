<!-- 
/*
 * @Author: Mayux dbs45412@163.com
 * @Date: 2025-04-08 18:52:24
 * @LastEditors: Mayux && 1243805308@qq.com
 * @LastEditTime: 2025-04-29 19:21:32
 * @FilePath: \tutorial-platform-fe\src\lib\component\DatePicker\DoubleCalendar.svelte
 * @Description: 双日历组件，日期选择器组件的一部分
 * @Props: 
 *      - start_date (Date) 开始日期
 *      - end_date (Date) 结束日期
 *      - onSelectFunc (function) 选择完日期时调用的函数
 * @Copyright: Copyright (c) 2025 by Mayux, All Rights Reserved. 
 */ -->
<script>

    let {start_date = null, end_date = null, onSelectFunc} = $props()

    // 左侧日历当前月份
    let current_month_left = $state(new Date());

    // 右侧日历当前月份
    let current_month_right = $state();

    function initializeCurrentMonthRight() {
        current_month_right = new Date(current_month_left);
        current_month_right.setMonth(current_month_right.getMonth() + 1);
    }

    initializeCurrentMonthRight();

    //临时预选范围时鼠标悬停处的日期    
    let temp_hover_date = $state();

    //在没有选中终止日期时存储选中的起始日期
    let temp_start_date = $state();

    export function clearSelection() {
        start_date = null;
        end_date = null;
        temp_start_date = null;
        temp_hover_date = null;
        onSelectFunc({ start: null, end: null });
    }

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
        const prevMonthDays = firstDay

        for (let i = 0; i < prevMonthDays; i++) {
            days.push(null); // 空白占位
        }

        for (let d = 1; d <= totalDays; d++) {
            days.push(new Date(year, month, d));
        }
        return days;

    }

    /**
     * 判断某个日期在不在预选范围，用于渲染起止日期之前的日期颜色
     * @param {number | Date} date
     */
    function isInRange(date) {
        if (start_date && end_date) {
            return date >= start_date && date <= end_date;
        }
        
        // 临时预选范围的情况
        if (temp_start_date && temp_hover_date) {
            const [min, max] = temp_start_date < temp_hover_date ? [temp_start_date, temp_hover_date] : [temp_hover_date, temp_start_date];
            return date >= min && date <= max;
        }
        return false;
    }

    /**
     * 用于渲染鼠标悬停处的日期为终止日期样式
     * @param {Date} date
     */
    function isTempEnd(date) {
        //在没有选定临时起始日期以及当前鼠标没有悬浮在一个日期上时直接返回
        if (!temp_start_date || !temp_hover_date) return false;

        //在选定了临时的起始日期后，鼠标所悬停的日期就是临时的终止日期
        return sameDate(date, temp_hover_date);
    }

    /**
     * 用于在鼠标点击时选中日期
     * @param {number | Date} date
     */
    function selectDate(date) {
        if (start_date && end_date) {

            // 如果之前已选好范围，点击将重新开始选择
            start_date = null;
            end_date = null;
            temp_start_date = date;
            temp_hover_date = null;
        } else if (!temp_start_date) {

            //将当前选中日期作为暂时的起始日期
            temp_start_date = date;
        } else {

            //确认起止日期
            const start = temp_start_date < date ? temp_start_date : date;
            const end = temp_start_date < date ? date : temp_start_date;
            start_date = start;
            end_date = end;
            temp_start_date = null;
            temp_hover_date = null;

            //避免指向同一个Date对象
            const startCopy = start ? new Date(start.getTime()) : null;
            const endCopy = end ? new Date(end.getTime()) : null;
            onSelectFunc({start:startCopy,end:endCopy})
        }
    }

    //用于确保左右两侧月份正确显示
    function prevLeftMonth() {
        let new_date = new Date(current_month_left);
        new_date.setMonth(new_date.getMonth() - 1);

        // 不允许左侧月 >= 右侧月
        if (new_date.getFullYear() * 12 + new_date.getMonth() < current_month_right.getFullYear() * 12 + current_month_right.getMonth()) {
            current_month_left = new Date(new_date);
        }
    }
    function nextLeftMonth() {
        let new_date = new Date(current_month_left);
        new_date.setMonth(new_date.getMonth() + 1);
        // 必须保持 current_month_left < current_month_right
        if (new_date.getFullYear() * 12 + new_date.getMonth() < current_month_right.getFullYear() * 12 + current_month_right.getMonth()) {
            current_month_left = new Date(new_date);
        }
    }
    function prevRightMonth() {
        let new_date = new Date(current_month_right);
        new_date.setMonth(new_date.getMonth() - 1);
        // 必须保持 current_month_right > current_month_left
        if (new_date.getFullYear() * 12 + new_date.getMonth() > current_month_left.getFullYear() * 12 + current_month_left.getMonth()) {
            current_month_right = new Date(new_date);
        }
    }
    function nextRightMonth() {
        let new_date = new Date(current_month_right);
        new_date.setMonth(new_date.getMonth() + 1);
        current_month_right = new Date(new_date);
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
</script>

<div class="calendar-container">

    <div class="cal-body">
        <!-- 左侧日历 -->
        <div class="month">
            <div class="month-header">
                <button class = "month-change-button" onclick={prevLeftMonth}><img src = "/datepicker/left.png" alt = "left"/></button>
                <div>{formatTitle(current_month_left)}</div>
                <button class = "month-change-button" onclick={nextLeftMonth}><img src = "/datepicker/right.png" alt = "right"/></button>
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
                        {date && isInRange(date) ? 'in-range' : ''} 
                        {date && (sameDate(date, start_date) || sameDate(date, temp_start_date)) ? 'start-date' : ''} 
                        {date && (sameDate(date, end_date) || isTempEnd(date)) ? 'end-date' : ''} 
                        {date && sameDate(date, new Date()) ? 'today' : ''}"
                        onclick={() => date && selectDate(date)}
                        onmouseenter={() => date && (temp_hover_date = date)}
                        onmouseleave={() => (temp_hover_date = null)}
                    >
                        {date ? date.getDate() : ""}
                    </button>
                {/each}
            </div>
        </div>
    
        <!-- 右侧日历 -->
        <div class="month">
            <div class="month-header">
                <button class = "month-change-button" onclick={prevRightMonth}><img src = "/datepicker/left.png" alt = "left"/></button>
                <div>{formatTitle(current_month_right)}</div>
                <button class = "month-change-button" onclick={nextRightMonth}><img src = "/datepicker/right.png" alt = "right"/></button>
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
                        {date && isInRange(date) ? 'in-range' : ''} 
                        {date && (sameDate(date, start_date) || sameDate(date, temp_start_date)) ? 'start-date' : ''} 
                        {date && (sameDate(date, end_date) || isTempEnd(date)) ? 'end-date' : ''} 
                        {date && sameDate(date, new Date()) ? 'today' : ''}"
                        onclick={() => date && selectDate(date)}
                        onmouseenter={() => date && (temp_hover_date = date)}
                        onmouseleave={() => (temp_hover_date = null)}
                    >
                        {date ? date.getDate() : ""}
                    </button>
                {/each}
            </div>
        </div>
    </div>
    
</div>

<style scoped>
    .calendar-container {
        display: flex;
        flex-direction: column;
        gap: 0.5rem;
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
        background-color: #D4E3FC;
        border-radius: 3px;
    }

    .in-range {
        background-color: #ECF2FE;
    }

    .start-date,
    .end-date {
        background-color: #0052d9;
        color: white;
        z-index: 1;
    }
    
    .start-date{
        border-radius: 4px 0 0 4px;
    }

    .end-date{
        border-radius: 0 4px 4px 0;
    }

    .start-date::before{
        border-radius: 4px 0 0 4px;
    }

    .end-date::before{
        border-radius: 0 4px 4px 0;
    }

    .start-date::before,
    .end-date::before {
        content: "";
        position: absolute;
        top: 50%;
        left: 50%;
        width: 30px;
        height: 30px;
        background: #0052d9;
        transform: translate(-50%, -50%);
        z-index: -1;
    }

    .today::after {
        content: "";
        position: absolute;
        bottom: 3px;
        left: 50%;
        transform: translateX(-50%);
        width: 4px;
        height: 4px;
        background: #699EF5;
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
</style>
