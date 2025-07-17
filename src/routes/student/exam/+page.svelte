<!--
 * @Author: Zpekii 3156752796@qq.com
 * @Date: 2025-04-25 16:48:05
 * @LastEditors: Zpekii 3156752796@qq.com
 * @LastEditTime: 2025-06-21 15:37:30
 * @FilePath: \exam-fe\src\routes\student\exam\+page.svelte
 * @Description: 学生端考试列表
 * @
 * @Copyright (c) 2025 by Zpekii, All Rights Reserved. 
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
  // 删除原来的DropDown导入
  // import DropDown from "../../teacher/paperManagement/manual/[paperID]/DropDown.svelte";
  // 添加CustomSelect导入
  import CustomSelect from "$lib/component/CustomSelect.svelte";
  import { formatSecondTimestamp } from "$lib/common/time_utils";
  import Pagination from "$lib/component/Pagination.svelte";

  /**
   * @typedef ExamSessionInfo - 考试场次信息
   * @property {string} paper_name - 考试场次名称
   * @property {number} student_score - 考试成绩
   * @property {number} total_score - 考试总分
   * @property {string} status - 考试状态
   * @property {string} start_time - 考试开始时间
   * @property {string} end_time - 考试结束时间
   */

  /**
   * @typedef ExamInfo
   * @property {number} id - 考试ID
   * @property {string} name - 考试名称
   * @property {string} chapter - 重点章节
   * @property {ExamSessionInfo[]} exam_sessions - 考试场次(可有多个)
   * @property {boolean} is_passed - 是否通过
   */

  /**
   * @typedef ResponseData - 响应数据
   * @property {ExamInfo[]} data - 考试列表数据
   * @property {string} msg - 响应消息
   * @property {number} status - 响应状态码
   * @property {number} row_count - 总行数
   */

  /**
   * @typedef Filter - 筛选条件
   * @property {string} exam_name - 考试名称
   * @property {number} start_time - 考试开始时间(Unix时间戳, 单位: 秒)
   * @property {number} end_time - 考试结束时间(Unix时间戳, 单位: 秒)
   * @property {string} exam_status - 考试状态
   */

  const EXAM_SESSION_STATUS = {
    "": "−",
    "01": "未开始",
    "02": "进行中",
    "04": "已结束",
    "08": "批改中",
    "10": "已批改",
  };

  const EXAM_SESSION_STATUS_MAP = {
    "01": 1,
    "02": 2,
    "04": 4,
    "08": 8,
    "10": 10,
  };

  const EXAMINEE_STATUS = {
    "00": "未交卷",
    "02": "缺考",
    "06": "作弊",
    "10": "已交卷",
    "14": "考试异常",
  };

  /**
   * 搜索重置禁用状态
   */
  let search_reset_disabled = $state(true);

  /**
   * 考试名称搜索输入
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
  let select_end_date = $state(new Date(Date.now() + 7 * 24 * 60 * 60 * 1000));

  /**
   * 考试状态下拉框选项
   * @type {Array<{ value: string, label: string }>}
   */
  let exam_status_selections = [
    { value: "-", label: "全部" },
    { value: "02", label: "未开始" },
    { value: "04", label: "进行中" },
    { value: "08", label: "已结束" },
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
   * @type {ExamInfo[]}
   */
  let exam_info = $state([]);

  /**
   * 当前筛选条件
   * @type {Filter}
   */
  let curr_filter = $state({
    exam_name: "",
    start_time: "",
    end_time: "",
    exam_status: "",
  });

  onMount(async () => {});

  $effect(async () => {
    exam_info = await getExamList(current_page, page_size);
  });

  /**
   * 获取考试列表数据
   * @param {number} current_page - 当前页码
   * @param {number} page_size - 每页大小
   * @return {Promise<ExamInfo[]>} - 考试列表数据
   */
  async function getExamList(current_page = 1, page_size = 20) {
    let url = `/api/student_grade/getExamList?page_index=${current_page}&page_size=${page_size}`;

    let filter = $state.snapshot(curr_filter);

    if (filter.exam_name != "") {
      url += `&exam_name=${filter.exam_name}`;
    }

    if (filter.start_time != "") {
      url += `&start_time=${filter.start_time}`;
    }

    if (filter.end_time != "") {
      url += `&end_time=${filter.end_time}`;
    }

    if (filter.exam_status != "" || filter.exam_status != "-") {
      url += `&status=${filter.exam_status}`;
    }

    let resp = await fetch(url, {
      method: "GET",
      credentials: "include",
    });

    if (!resp.ok) {
      throw new Error("获取考试列表失败");
    }

    /**
     * @type {ResponseData}
     */
    let resp_data = await resp.json();

    if (resp_data.status < 0) {
      throw new Error(resp_data.msg);
    }

    total_row_count = resp_data.row_count;

    /**
     * @type {ExamInfo[]}
     */
    let exam_list = resp_data.data;

    if (!exam_list) {
      return [];
    }

    for (let i = 0; i < exam_list.length; i++) {
      exam_list[i].is_passed = true;

      if (!exam_list[i].exam_sessions) {
        exam_list[i].is_passed = null;
        continue;
      }

      for (let exam_session of exam_list[i].exam_sessions) {
        if (
          exam_session.student_score >= 0 &&
          exam_session.student_score < 0.6 * exam_session.total_score
        ) {
          exam_list[i].is_passed = false;
        } else if (exam_session.student_score == -1) {
          exam_list[i].is_passed = null;
        }

        exam_session.start_time = formatSecondTimestamp(
          exam_session.start_time,
        );

        exam_session.end_time = formatSecondTimestamp(exam_session.end_time);
      }
    }

    return exam_list;
  }

  /**
   * 处理日期选择
   * @param {Date} start
   * @param {Date} end
   */
  function handleSelectDate(start, end) {
    select_start_date = start;

    select_end_date = end;

    console.log(`开始日期: ${select_start_date}, 结束日期: ${select_end_date}`);
  }

  /**
   * 检查考试是否通过
   * @param {number} exam_id - 考试ID
   * @return {boolean} - 是否通过
   */
  function checkExamPassed(exam_id) {
    if (!exam_id) {
      throw new Error("exam_id is required");
    }

    let examInfo = exam_info.find((exam) => exam.id === exam_id);
    if (!examInfo) {
      throw new Error("examInfo not found");
    }

    let all_passed = true;

    for (let exam_session of examInfo.exam_sessions) {
      if (exam_session.student_score >= 0.6 * exam_session.total_score) {
        continue;
      }

      all_passed = false;
      break;
    }

    return all_passed;
  }

  /**
   * 检查考试是否全部结束
   * @param {number} exam_id - 考试ID
   * @return {boolean} - 是否全部结束
   */
  function checkExamAllEnded(exam_id) {
    if (!exam_id) {
      throw new Error("exam_id is required");
    }

    let examInfo = exam_info.find((exam) => exam.id === exam_id);
    if (!examInfo) {
      throw new Error("examInfo not found");
    }

    let all_ended = true;

    if (!examInfo.exam_sessions) {
      return all_ended;
    }

    for (let exam_session of examInfo.exam_sessions) {
      if (EXAM_SESSION_STATUS_MAP[exam_session.status] >= 4) {
        continue;
      }

      all_ended = false;
      break;
    }

    return all_ended;
  }

  /**
   * 处理分页选择函数
   * @param {number} page - 当前页码
   */
  function handlePageChange(page) {
    console.log(`当前页码: ${page}`);
    current_page = page;
  }

  /**
   * 进入考试
   */
  function enterExam(exam_id) {
    if (!exam_id) {
      throw new Error("exam_id is required");
    }

    window.location.href = `/student/examPaperDetail?examId=${exam_id}`;
  }

  /**
   * 查看试卷
   */
  function checkPaper(exam_id) {
    console.log(exam_id);
    if (!exam_id) {
      throw new Error("exam_id is required");
    }
    window.location.href = `/student/checkExamDetails?examId=${exam_id}`;
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

    curr_filter = {
      exam_name: exam_name,
      start_time: Math.floor(start_time.getTime() / 1000),
      end_time: Math.floor(end_time.getTime() / 1000),
      exam_status: exam_status,
    };

    current_page = 1;

    search_reset_disabled = false;

    console.log("搜索条件:", $state.snapshot(curr_filter));
  }

  /**
   * 重置搜索条件
   */
  function resetSearch() {
    search_exam_name = "";
    current_select_exam_status = "-";

    curr_filter = {
      exam_name: "",
      start_time: "",
      end_time: "",
      exam_status: "",
    };

    current_page = 1;

    search_reset_disabled = true;
  }
</script>

<svelte:head>
  <title>我的考试</title>
</svelte:head>

<main>
  <div class="search-section">
    <p>我的考试</p>
    <hr />
    <div class="search-controls">
      <div class="left-controls">
        <div class="input-group">
          <label for="search-input">考试名称：</label>
          <input
            id="search-input"
            type="text"
            bind:value={search_exam_name}
            placeholder="请输入考试名称"
          />
        </div>
        <div class="input-group">
          <label>考试时间：</label>
          <DateTimePicker
            start_date={select_start_date}
            end_date={select_end_date}
            min_date={new Date("2025-01-01")}
            onSelectDate={handleSelectDate}
          />
        </div>
        <div class="input-group">
          <label>考试状态：</label>
          <!-- 替换DropDown为CustomSelect -->
          <CustomSelect
            options={exam_status_selections.map((item) => item.label)}
            selected_value={current_select_exam_status === "-"
              ? "全部"
              : exam_status_selections.find(
                  (item) => item.value === current_select_exam_status,
                )?.label}
            onChangeFunc={(value) => {
              current_select_exam_status =
                exam_status_selections.find((item) => item.label === value)
                  ?.value || "-";
            }}
          />
        </div>
        <div class="button-group">
          <button
            id="reset-btn"
            onclick={resetSearch}
            disabled={search_reset_disabled}>重置</button
          >
          <button id="search-btn" onclick={searchExam}>搜索</button>
        </div>
      </div>
    </div>
  </div>
  <div class="data-section">
    <div class="exercise-table">
      <table>
        <thead>
          <tr>
            <th class="exam-name">考试名称</th>
            <th class="key-chapters">重点章节</th>
            <th class="exam-paper">考试试卷</th>
            <th class="exam-time">考试时间</th>
            <th class="exam-status">场次状态</th>
            <th class="exam-status">提交状态</th>
            <th class="exam-score">场次成绩</th>
            <th class="exam-total-score">试卷总分</th>
            <th class="is-passed">是否通过</th>
            <th class="operation">操作</th>
          </tr>
        </thead>
        <tbody>
          {#each exam_info as exam, index}
            <tr>
              <td class="exam-name" title={exam.name}>
                <div class="truncate-text">{exam.name}</div>
              </td>
              <td class="key-chapters" title={exam.chapter}>
                <div class="truncate-text">
                  {exam.chapter == "" || exam.chapter == null
                    ? "−"
                    : exam.chapter}
                </div>
              </td>
              <td class="exam-paper">
                {#each exam.exam_sessions as session}
                  <div class="session-row">
                    <span class="name" title={session.paper_name}>
                      {session.paper_name}
                    </span>
                  </div>
                {/each}
              </td>
              <td class="exam-time">
                {#each exam.exam_sessions as session}
                  <div class="session-row">
                    <span
                      class="period"
                      title={session.start_time + "~" + session.end_time}
                    >
                      {session.start_time} ~ {session.end_time}
                    </span>
                  </div>
                {/each}
              </td>
              <td class="exam-status">
                {#each exam.exam_sessions as session}
                  <div class="session-row">
                    <span
                      class="status-text"
                      class:incoming={session.status == "00"}
                      class:underway={session.status == "02"}
                      class:ended={session.status == "04"}
                      class:marking={session.status == "08"}
                      class:marked={session.status == "10"}
                    >
                      {EXAM_SESSION_STATUS[session.status]}
                    </span>
                  </div>
                {/each}
              </td>
              <td class="exam-status">
                {#each exam.exam_sessions as session}
                    <div class="session-row">
                      <span
                        class="status-text"
                        class:submitted={session.examinee_status === "10"}
                        class:incoming={session.examinee_status === "00"}
                        class:error={session.examinee_status === "02"|| session.examinee_status === "06" || session.examinee_status === "14"}
                      >
                        {EXAMINEE_STATUS[session.examinee_status]?EXAMINEE_STATUS[session.examinee_status]:"--"}
                      </span>
                    </div>
                {/each}
              </td>
              <td class="exam-score">
                {#each exam.exam_sessions as session, index}
                  <div class="session-row">
                    <span
                      class="score-text"
                      class:passed={session.student_score >=
                        0.6 * session.total_score}
                      class:not-passed={session.student_score <
                        0.6 * session.total_score}
                    >
                      {session.student_score == -1
                        ? "−"
                        : session.student_score}
                    </span>
                  </div>
                {/each}
              </td>
              <td class="exam-total-score">
                {#each exam.exam_sessions as session, index}
                  <div class="session-row">
                    <span class="score-text">
                      {session.total_score == -1 ? "−" : session.total_score}
                    </span>
                  </div>
                {/each}
              </td>
              <td class="is-passed">
                <span
                  class="passed-text"
                  class:passed={exam.is_passed == true}
                  class:not-passed={exam.is_passed == false}
                >
                  {#if exam.is_passed == true}
                    <span>已通过</span>
                  {:else if exam.is_passed == false}
                    <span>未通过</span>
                  {:else}
                    <span>−</span>
                  {/if}
                </span>
              </td>
              <td class="actions">
                {#if !checkExamAllEnded(exam.id)}
                  <button class="action-btn" onclick={enterExam(exam.id)}
                    >进入考试</button
                  >
                {:else}
                  <button class="action-btn" onclick={checkPaper(exam.id)}
                    >查看试卷</button
                  >
                {/if}
              </td>
            </tr>
          {/each}
          {#if exam_info.length == 0}
            <tr style="height: 200px">
              <td colspan="9" style="text-align: center; padding: 80px 0;">
                <span>暂无考试信息</span>
              </td>
            </tr>
          {/if}
        </tbody>
      </table>
    </div>
    <div class="pagination">
      <Pagination
        current_page_num={current_page}
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
              current_page == Math.ceil(total_row_count / page_size)
                ? current_page
                : current_page + 1;
          } else {
            current_page = current_page == 1 ? current_page : current_page - 1;
          }
          handlePageChange(current_page);
        }}
      />
    </div>
  </div>
</main>

<style lang="scss">
  :global(*) {
    box-sizing: border-box;
    margin: 0;
    padding: 0;
  }
  main {
    display: flex;
    flex-direction: column;
    width: 100%;
    height: 100%;
    margin: 0;
    background-color: #f7fafd;
    overflow: auto;
  }

  .search-section {
    margin: 0px auto 4px;
    padding: 30px 70px;
    width: 100%;
    background-color: #ffffff;
    min-width: 1000px;

    p {
      font-size: 20px;
      font-weight: bold;
      margin-bottom: 24px;
    }

    hr {
      margin-bottom: 25px;
      border: solid 1px rgba(121, 121, 121, 0.1);
    }

    .search-controls {
      display: flex;
      justify-content: space-between;
      align-items: center;

      // 其他样式保持不变
      .left-controls {
        display: flex;
        gap: 20px;
        align-items: center;
        flex: 1;
        .input-group {
          display: flex;
          align-items: center;
          gap: 10px;
          label {
            width: fit-content;
            white-space: nowrap;
          }
        }
      }

      input {
        min-width: 200px;
        flex: 1;
        height: 28px;
        border: 1px solid rgba(121, 121, 121, 0.33);
        border-radius: 2px;
        padding: 2px 2px 2px 10px;
        font-size: 12px;
        outline: none;

        &:hover,
        &:focus {
          border-color: #0336ff;
        }
      }

      .button-group {
        display: flex;
        gap: 20px;

        button {
          min-width: 60px;
          height: 28px;
          border-radius: 4px;
          font-size: 14px;
        }

        #reset-btn {
          border: 1px solid rgba(121, 121, 121, 0.33);
          outline: none;
          background-color: #ffffff;
          color: #333333;
          cursor: pointer;

          &:hover {
            color: #0052d9;
            border-color: #0052d9;
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

        #search-btn {
          border: none;
          outline: none;
          background-color: #0052d9;
          color: #ffffff;
          cursor: pointer;

          &:hover {
            background-color: rgba(0, 82, 217, 0.9);
          }

          &:active {
            background-color: rgba(0, 82, 217, 0.95);
          }
        }
      }
    }
  }

  .data-section {
    margin: 0 auto;
    padding: 0 70px 18px;
    width: 100%;
    background-color: #ffffff;
    min-width: 1000px;
    overflow: visible;
    flex: 1;
    display: flex;
    flex-direction: column;

    .exercise-table {
      width: 100%;
      overflow-x: auto;
      flex: 1;
      display: flex;
      flex-direction: column;
      overflow-y: auto;
      margin-top: 10px;

      table {
        width: 100%;
        border-collapse: collapse;
        min-width: 700px;

        th,
        td {
          padding: 12px 8px;
          text-align: center;
          border-bottom: 1px solid #f0f0f0;
          font-size: 14px;
        }

        th {
          color: #666;
          font-weight: normal;
          background-color: #fafafa;
        }

        td {
          color: #333;
          text-align: center;

          &.name-cell {
            text-align: center;
          }

          .truncate-text {
            max-width: 200px;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
            margin: 0 auto;
            text-align: center;
          }

          .session-row {
            display: flex;
            justify-content: center;
            align-items: center;
            width: 100%;
            margin: 4px 0;
            min-height: 30px;
          }

          .status-text {
            &.incoming {
              color: #ff8100;
            }

            &.underway {
              color: #39bb4c;
            }

            &.ended {
              color: #787d81;
            }

            &.marking {
              color: #c6690b;
            }

            &.marked {
              color: #027213;
            }

            &.submitted {
              color: var(--blue);
            }

            &.error{
              color: var(--red);
            }
          }

          .score-text {
            &.passed {
              color: #197f29;
            }

            &.not-passed {
              color: #f55151;
            }
          }

          .passed-text {
            display: inline-block;
            padding: 2px 8px;
            border-radius: 4px;
            font-size: 12px;

            &.passed {
              background-color: #bcebdc;
              border: 1px solid #00a870;
              color: #00a870;
            }

            &.not-passed {
              border: 1px solid #e34d59;
              background-color: #f9d7d9;
              color: #e34d59;
            }
          }

          &.actions {
            .action-btn {
              text-decoration: none;
              color: #0336ff;
              font-size: 14px;
              margin: 0 8px;
              background: none;
              cursor: pointer;
              padding: 4px 8px;
              border-radius: 4px;
              outline: none;
              border: none;

              &:hover {
                color: #0336ff;
              }
            }
          }
        }
      }
    }

    .pagination {
      display: flex;
      align-items: center;
      justify-content: flex-end;
      margin-top: 10px;
      padding-right: 20px; /* 添加右内边距 */
    }
  }
</style>
