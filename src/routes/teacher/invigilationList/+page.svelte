<!--
 * @Author: MIOZD && l317101@163.com
 * @Date: 2025-05-28 10:43:49
 * @LastEditors: Zpekii 3156752796@qq.com
 * @LastEditTime: 2025-07-08 18:26:49
 * @FilePath: \exam-fe\src\routes\teacher\invigilationList\+page.svelte
 * @Description: 
-->
<!--                         o8o                 .   
                             `"'               .o8   
 .oooo.o  .ooooo.  oooo d8b oooo  oo.ooooo.  .o888oo 
d88(  "8 d88' `"Y8 `888""8P `888   888' `88b   888   
`"Y88b.  888        888      888   888   888   888   
o.  )88b 888   .o8  888      888   888   888   888 . 
8""888P' `Y8bod8P' d888b    o888o  888bod8P'   "888" 
                                   888               
                                  o888o              
-->
<script>
    // @ts-nocheck

    import DateTimePicker from "$lib/component/DatePicker/DateTimePicker.svelte";
    import { onMount } from "svelte";
    import {
        formatSecondTimestamp,
        formatTimestamp,
    } from "$lib/common/time_utils";
    import Pagination from "$lib/component/Pagination.svelte";
    import { getBankList, getQuestionList } from "../questionBank/theory/api";
    import { getInvigilationList } from "./api";
    import { goto } from "$app/navigation";
    import BubbleMessageComponet from "$lib/component/BubbleMessageToast.svelte";
    import DropDown from "$lib/component/DropDownForInvigilation.svelte";
    import Title from "$lib/component/Title.svelte";

    /**
     * @typedef InvigilationInfo - 考试场次信息
     * @property {string} exam_session_id - 考试场次ID
     * @property {string} exam_session_name - 考试场次名称
     * @property {number} exam_site_name - 考点
     * @property {number} exam_room_id - 考场ID
     * @property {number} exam_room_name - 考场
     * @property {string} status - 考试状态
     * @property {string} start_time - 考试开始时间
     * @property {string} end_time - 考试结束时间
     * @property {number} examinee_num - 考生人数
     * @property {number} absentee_num - 缺考人数
     * @property {number} cheater_num - 作弊人数
     * @property {number} abnormal_examinee_num - 考试异常人数
     * @property {string} basic_eval - 考试基本情况评估
     * @property {string} record - 考试情况记录
     */

    /**
     * @typedef ResponseData - 响应数据
     * @property {ExamSessionInfo[]} data - 考试列表数据
     * @property {string} msg - 响应消息
     * @property {number} status - 响应状态码
     * @property {number} row_count - 总行数
     */

    /**
     * @typedef Filter - 筛选条件
     * @property {string} exam_name - 考试场次
     * @property {number} start_time - 考试开始时间(Unix时间戳, 单位: 秒)
     * @property {number} end_time - 考试结束时间(Unix时间戳, 单位: 秒)
     * @property {string} exam_status - 考试状态
     */

    const EXAM_SESSION_STATUS = {
        "": "−",
        "01": "未开始",
        "02": "进行中",
        "04": "已结束",
    };

    const EXAM_SESSION_STATUS_MAP = {
        "01": 1,
        "02": 2,
        "04": 4,
    };

    /**
     * 搜索重置禁用状态
     */
    let search_reset_disabled = $state(true);

    /**
     * 考试场次搜索输入
     * @type {string}
     */
    let search_exam_name = $state("");

    /**
     * 考试开始时间，默认开始日期为当前时间
     * @type {Date}
     */
    let select_start_date = $state(new Date()); //

    /**
     * 考试结束时间，默认结束日期为开始日期后一周
     * @type {Date}
     */
    let select_end_date = $state(
        new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    );

    /**
     * 考试状态下拉框选项
     * @type {Array<{ value: string, label: string }>}
     */
    let exam_status_selections = [
        { value: "-", label: "全部" },
        { value: "01", label: "未开始" },
        { value: "02", label: "进行中" },
    ];

    /**
     * 当前选择的考试状态
     * @type {number}
     */
    let current_select_exam_status = $state("-");

    /**
     * 当前页码
     * @type {number}
     */
    let current_page = $state(1);

    /**
     * 每页大小
     * @type {number}
     */
    let page_size = $state(10);

    /**
     * 总行数
     * @type {number}
     */
    let total_row_count = $state(0);

    /**
     * @type {InvigilationInfo[]}
     */
    let exam_info = $state([]);

    /**
     * 当前筛选条件
     * @type {Filter}
     */
    let cur_filter = $state({
        exam_room_name: "",
        exam_session_name: "",
        start_time: "",
        end_time: 0,
        exam_status: 0,
    });

    /**
     * 气泡消息组件
     * @type {BubbleMessageComponet|undefined}
     */
    let bubble_message_componet = $state();

    onMount(async () => {});

    $effect(async () => {
        const res = await getInvigilationList(
            current_page,
            page_size,
            cur_filter,
        );

        if (res.status !== 0) {
            console.log(res);
            exam_info = [];
            // TODO: 错误处理
            bubble_message_componet.show(
                "warn",
                "拉取监考信息失败：" + res.msg,
            );
            return;
        }

        if (!res.data) {
            res.data = [];
        }

        exam_info = res.data.map((exam) => {
            
            if (exam.status != "01" || exam.status != "02") {
                exam.status = "04";
            }

            return {
                ...exam,
                start_time: formatTimestamp(
                    new Date(exam.start_time).getTime(),
                ),
                end_time: formatTimestamp(new Date(exam.end_time).getTime()),
            };
        });

        total_row_count = res.row_count;
        bubble_message_componet.show("info", "拉取监考信息成功");
    });

    /**
     * 处理日期选择
     * @param {Date} start
     * @param {Date} end
     */
    function handleSelectDate(start, end) {
        select_start_date = start;

        select_end_date = end;

        console.log(
            `开始日期: ${select_start_date}, 结束日期: ${select_end_date}`,
        );
    }

    /**
     * 处理分页选择函数
     * @param {number} page - 当前页码
     */
    function handlePageChange(page) {
        current_page = page;
    }

    /**
     * 进入考试
     */
    function enterInvigilation(invigilation_info) {
        localStorage.setItem(
            "invigilation_session_info",
            JSON.stringify(invigilation_info),
        );

        goto(`${window.location.pathname}/invigilation`);
    }

    /**
     * 搜索考试
     */
    function searchExam() {
        let exam_name = $state.snapshot(search_exam_name);

        let start_time = $state.snapshot(select_start_date);

        let end_time = $state.snapshot(select_end_date);

        let exam_status = $state.snapshot(current_select_exam_status);

        exam_status = exam_status == "-" ? "" : exam_status;

        cur_filter = {
            exam_session_name: exam_name,
            start_time: start_time
                ? Math.floor(start_time.getTime() / 1000)
                : 0,
            end_time: end_time ? Math.floor(end_time.getTime() / 1000) : 0,
            exam_status: exam_status,
        };

        current_page = 1;

        search_reset_disabled = false;

        console.log("搜索条件:", $state.snapshot(cur_filter));
    }

    /**
     * 重置搜索条件
     */
    function resetSearch() {
        search_exam_name = "";
        current_select_exam_status = "-";

        cur_filter = {
            exam_name: "",
            start_time: "",
            end_time: "",
            exam_status: "",
        };

        current_page = 1;

        search_reset_disabled = true;
    }
</script>

<!-- 
oooo            .                     oooo  
`888          .o8                     `888  
 888 .oo.   .o888oo ooo. .oo.  .oo.    888  
 888P"Y88b    888   `888P"Y88bP"Y88b   888  
 888   888    888    888   888   888   888  
 888   888    888 .  888   888   888   888  
o888o o888o   "888" o888o o888o o888o o888o                                                     
-->
{#snippet tableHead()}
    <tr class="exam-list-head">
        <th class="exam-name">考试场次</th>
        <th class="exam-point">考点</th>
        <th class="exam-room">考场</th>
        <th class="exam-time">考试时间</th>
        <th class="exam-status">考试状态</th>
        <th class="examinees-number">考生人数</th>
        <th class="examinees-absences">缺考人数</th>
        <th class="operation">操作</th>
    </tr>
{/snippet}

{#snippet tableRow(
    /**
     * 考试信息
     * @type {InvigilationInfo}
     */
    invigilation,

    /**
     * 当前行索引
     * @type {number}
     */
    index,
)}
    <tr class="exam-list-row">
        <td class="exam-name" title={invigilation.exam_session_name}>
            <span>{invigilation.exam_session_name}</span>
        </td>

        <td class="exam-point" title={invigilation.exam_site_name}>
            <span>
                {invigilation.exam_site_name == "" ||
                invigilation.exam_site_name == null
                    ? "−"
                    : invigilation.exam_site_name}
            </span>
        </td>

        <td class="exam-room">
            <div class="session-row">
                <span class="name" title={invigilation.exam_room_name}>
                    {invigilation.exam_room_name}
                </span>
            </div>
        </td>

        <td class="exam-time">
            <div class="session-row">
                <span
                    class="period"
                    title={invigilation.start_time +
                        "~" +
                        invigilation.end_time}
                >
                    {invigilation.start_time} ~ {invigilation.end_time}
                </span>
            </div>
        </td>

        <td class="exam-status">
            <div class="session-row">
                <span
                    class="status-text"
                    class:incoming={invigilation.status == "01"}
                    class:underway={invigilation.status == "02"}
                    class:ended={invigilation.status == "04"}
                >
                    {EXAM_SESSION_STATUS[invigilation.status] ?? "-"}
                </span>
            </div>
        </td>

        <td class="examinees-number">
            <div>
                {invigilation.examinee_num ? invigilation.examinee_num : "-"}
            </div>
        </td>

        <td class="examinees-absences">
            <div>
                {invigilation.absentee_num ? invigilation.absentee_num : "-"}
            </div>
        </td>

        <td class="operation">
            <button class="enter-btn" onclick={enterInvigilation(invigilation)}>
                {#if invigilation.status == "02"}
                    进入监考
                {:else}
                    查看详情
                {/if}
            </button>
        </td>
    </tr>
{/snippet}

<div class="exam-container">

    <Title 
        title="监考列表"
    />

    <div class="exam-content">
        <div class="top-bar-container">
            <div class="search-input">
                <span>考试场次:</span>
                <input
                    type="text"
                    placeholder="请输入考试场次"
                    bind:value={search_exam_name}
                />
            </div>

            <div class="time-select">
                <span>考试时间:</span>
                <DateTimePicker
                    start_date={select_start_date}
                    end_date={select_end_date}
                    min_date={new Date("2025-01-01")}
                    onSelectDate={handleSelectDate}
                />
            </div>

            <div class="status-select">
                <span>考试状态:</span>
                <div class="dropdown-container">
                    <DropDown
                        options={exam_status_selections}
                        selected={current_select_exam_status}
                        selectOptionFunc={(value)=>{
                            current_select_exam_status=value
                        }}
                    />
                </div>    
            </div>

            <div class="operation-buttons">
                <button
                    class="reset-btn"
                    disabled={search_reset_disabled}
                    onclick={resetSearch}
                >
                    重 置
                </button>

                <button class="search-btn" onclick={searchExam}> 搜 索 </button>
            </div>
        </div>

        <div class="exam-list-container">
            <table class="exam-list-table">
                <thead>
                    {@render tableHead()}
                </thead>

                <tbody>
                    {#each exam_info as exam, index}
                        {@render tableRow(exam, index)}
                    {/each}

                    {#if exam_info && exam_info.length == 0}
                        <tr class="exam-list-row" style="height: 100%;">
                            <td
                                style="display:flex;justify-content: center;align-items:center;width: 100%;height: 100%;font-size: 16px;"
                            >
                                <span>暂无考试信息</span>
                            </td>
                        </tr>
                    {/if}
                </tbody>
            </table>

            <div class="pagination">
                <Pagination
                    current_page_num={current_page}
                    selected={page_size}
                    max_show_page_num={page_size}
                    total_data_num={total_row_count}
                    total_page_num={Math.ceil(total_row_count / page_size)}
                    expand_direction="up"
                    selectOptionFunc={(value) => {
                        page_size = value;
                    }}
                    onPageChooseFunc={(value) => {
                        handlePageChange(value);
                    }}
                    onPageChangeFunc={(is_next) => {
                        if (is_next) {
                            current_page =
                                current_page ==
                                Math.ceil(total_row_count / page_size)
                                    ? current_page
                                    : current_page + 1;
                        } else {
                            current_page =
                                current_page == 1
                                    ? current_page
                                    : current_page - 1;
                        }

                        handlePageChange(current_page);
                    }}
                />
            </div>
        </div>
    </div>
</div>

<BubbleMessageComponet bind:this={bubble_message_componet}
></BubbleMessageComponet>

<!-- 
             .               oooo            
           .o8               `888            
 .oooo.o .o888oo oooo    ooo  888   .ooooo.  
d88(  "8   888    `88.  .8'   888  d88' `88b 
`"Y88b.    888     `88..8'    888  888ooo888 
o.  )88b   888 .    `888'     888  888    .o 
8""888P'   "888"     .8'     o888o `Y8bod8P' 
                 .o..P'                      
                 `Y8P'                       
                       
 -->
<style lang="scss" scoped>
    .exam-container {
        display: block;
        width: 100%;
        height: 100%;
        overflow-x: hidden;
        overflow-y: auto;
    }

    .exam-content {
        display: flex;
        flex-direction: column;
        width: 100%;
        height: 100%;
        min-width: 100%;
        padding: 1% 3% 0 3%;
        box-sizing: border-box;

        .title-container {
            display: flex;
            width: 100%;
            height: 50px;
            justify-content: flex-start;
            align-items: center;
            font-size: 22px;
            font-weight: bold;
            margin: 0 0 20px 0;
            box-sizing: border-box;

            .left-color-block {
                display: block;
                max-width: 6px;
                min-width: 6px;
                height: 80%;
                margin-right: 5px;
                background-color: #0336ff;
            }
        }

        .top-bar-container {
            display: flex;
            width: 100%;
            min-width: inherit;
            height: 30px;
            justify-content: space-between;
            align-items: center;
            margin: 0 0 20px 0;
            box-sizing: border-box;

            .search-input,
            .time-select,
            .status-select {
                display: flex;
                width: fit-content;
                height: 100%;
                justify-content: flex-start;
                align-items: center;
                box-sizing: border-box;

                span {
                    display: flex;
                    min-width: 80px;
                    height: 100%;
                    justify-content: center;
                    align-items: center;
                    font-size: 16px;
                    font-family: "Arial", sans-serif;
                    margin-right: 10px;
                    padding: 2px;
                    box-sizing: border-box;
                }

                .dropdown-container {
                    width: 100px;
                    height: 34px;
                }
            }

            .search-input {
                input {
                    width: 260px;
                    height: 100%;
                    font-size: 14px;
                    padding: 2px 2px 2px 10px;
                    border-radius: 3px;
                    border: 1px solid rgba(121, 121, 121, 0.33);
                    box-sizing: border-box;
                    font-family: "Arial", sans-serif;
                    color: #333333;
                    text-align: left;

                    &:hover {
                        border: 1px solid #165dff;
                    }

                    &:focus {
                        outline-color: #165dff;
                    }
                }
            }

            .operation-buttons {
                display: flex;
                justify-content: space-between;
                align-items: center;
                width: 150px;

                button {
                    width: 70px;
                    height: 35px;
                    padding: 2px 2px 2px 2px;
                    border-radius: 5px;
                    text-align: center;
                    border: 1px solid rgba(121, 121, 121, 0.33);
                    cursor: pointer;
                }

                .reset-btn {
                    background-color: rgba(255, 255, 255, 1);
                    box-sizing: border-box;
                    font-family: "Arial", sans-serif;
                    color: #333333;
                    border: 1px solid #a2a2a2;

                    &:hover {
                        box-sizing: border-box;
                        color: #1677ff;
                        border: 1px solid #1677ff;
                    }

                    &:disabled {
                        color: #747474;
                        background-color: #cccccc;
                        cursor: not-allowed;

                        &:hover {
                            color: #747474;
                            border: 1px solid #a2a2a2;
                        }
                    }
                }

                .search-btn {
                    color: #ffffff;
                    background-color: #0052d9;

                    &:hover {
                        background-color: #1677ff;
                        border: 1px solid #1677ff;
                    }
                }
            }
        }

        .exam-list-container {
            display: flex;
            flex-direction: column;
            width: 100%;
            min-width: inherit;
            height: 100%;
            justify-content: flex-start;
            align-items: flex-start;
            box-sizing: border-box;

            .exam-list-table {
                display: flex;
                flex-direction: column;
                width: 100%;
                height: 100%;
                overflow-x: hidden;
                overflow-y: auto;
                scrollbar-width: thin;
                box-sizing: border-box;
                overflow: auto;
                background-color: var(--bg-primary);

                thead,
                tbody {
                    display: block;
                    flex-direction: column;
                    width: 100%;

                    tr {
                        display: flex;
                        width: 100%;
                        min-height: fit-content;
                        justify-content: space-between;
                        align-items: center;
                        min-height: 55px;
                        box-sizing: border-box;
                        background-color: inherit;

                        .exam-room {
                            padding: 0 4px 0 4px;
                            width: 16%;
                        }

                        .exam-name,
                        .exam-time {
                            padding: 0 4px 0 4px;
                            width: 22%;
                        }

                        .exam-point,
                        .operation {
                            padding: 0 4px 0 4px;
                            width: 8%;
                        }

                        .exam-status,
                        .examinees-number,
                        .examinees-absences {
                            padding: 0 4px 0 4px;
                            width: 8%;
                        }
                    }
                }

                thead {
                    position: sticky;
                    top: 0;
                    border-radius: 6px 6px 0 0;
                    background-color: inherit;
                    z-index: 1;
                }

                thead th {
                    color: rgb(0, 0, 0, 0.3);
                    font-size: 14px;
                    font-weight: normal;
                    font-family: "Arial", sans-serif;
                    box-sizing: border-box;
                    background-color: transparent;
                }

                tbody {
                    height: 100%;

                    tr {
                        height: fit-content;
                        border-bottom: 1px solid #ddd;
                    }

                    td {
                        display: flex;
                        flex-direction: column;
                        justify-content: space-between;
                        height: 100%;
                        min-height: 100%;
                        color: #333333;
                        min-height: fit-content;
                        font-size: 14px;
                        font-weight: 400;
                        font-family: "Arial", sans-serif;
                        box-sizing: border-box;
                        text-align: center;
                        background-color: transparent;
                    }

                    .exam-list-row {
                        background-color: inherit;

                        .exam-name,
                        .exam-point,
                        .exam-time,
                        .exam-status,
                        .examinees-number {
                            display: flex;
                            flex-direction: column;
                            justify-content: center;
                            align-items: center;
                            height: 100%;
                            max-width: 100%;
                            box-sizing: border-box;
                            overflow: hidden;
                        }

                        .exam-name span,
                        .exam-point span {
                            display: block;
                            max-width: 100%;
                            height: fit-content;
                            text-overflow: ellipsis;
                            overflow: hidden;
                            white-space: nowrap;
                        }

                        .session-row {
                            display: flex;
                            justify-content: center;
                            align-items: center;
                            width: 100%;
                            box-sizing: border-box;
                            margin: 4px 0 4px 0;

                            span {
                                text-align: center;
                                line-height: 22px;
                            }
                        }

                        .exam-time .session-row {
                            .period {
                                position: relative;
                                display: block;
                                max-width: 100%;
                                text-align: left;
                            }
                        }

                        .exam-status .status-text {
                            &.incoming {
                                color: #0052d9;
                            }

                            &.underway {
                                color: #39bb4c;
                            }

                            &.ended {
                                color: #787d81;
                            }
                        }

                        .operation .enter-btn {
                            border: none;
                            background-color: #ffffff00;
                            color: #0052d9;
                            cursor: pointer;
                        }
                    }
                }
            }
        }

        .exam-list-container .pagination {
            margin-top: 10px;
            display: flex;
            width: 100%;
            height: fit-content;
            justify-content: flex-end;
            align-items: center;
        }
    }
</style>
