<!--
 * @Author: 林炜佳 wj2144632819@qq.com
 * @Date: 2025-07-23 10:00:00
 * @LastEditors: 林炜佳 wj2144632819@qq.com
 * @LastEditTime: 2025-08-06 14:18:07
 * @FilePath: \exam\src\routes\student\exam\+page.svelte
 * @Description: 学生端考试列表页面
 * @Copyright (c) 2025 by 广州近邻信息有限公司, All Rights Reserved. 
-->

<script>
  import { goto } from '$app/navigation';
  import { onMount } from 'svelte';
  import { toast } from '$lib/components/Toast/Toast.js';
  import Select from '$lib/components/Select/Select.svelte';
  import Option from '$lib/components/Select/Option.svelte';
  import Empty from '$lib/components/Table/Empty.svelte';
  import DatePicker from '$lib/components/DatePicker/DatePicker.svelte';
  import Pagination from '$lib/components/Pagination/Pagination.svelte';
  import Dialog from '../answer/_component/Dialog.svelte';
  import { formatTimestamp } from '$lib/utils/time_utils';
  import '$lib/components/Button/index.scss';
  import '$lib/components/Input/index.scss';

  // mock 数据
  // const mockExam = [
  //   {
  //     id: 5,
  //     name: 'H34',
  //     exam_sessions: [
  //       {
  //         id: 1,
  //         start_time: '2025-08-01 09:00',
  //         end_time: '2025-08-01 11:00',
  //         session_num: '001',
  //         paper_name: '语文试卷A',
  //         status: '04',
  //         examinee_status: '00',
  //         student_score: 92,
  //         total_score: 100,
  //       },
  //       {
  //         id: 2,
  //         start_time: '2025-08-01 09:00',
  //         end_time: '2025-08-01 11:00',
  //         session_num: '001',
  //         paper_name: '语文试卷A',
  //         status: '06',
  //         examinee_status: '00',
  //         student_score: 92,
  //         total_score: 100,
  //       },
  //     ],
  //     action: '00', // 存在进行中 => 进入考试
  //   },
  //   {
  //     id: 6,
  //     name: 'H34',
  //     exam_sessions: [
  //       {
  //         start_time: '2025-08-01 09:00',
  //         end_time: '2025-08-01 11:00',
  //         session_num: '001',
  //         paper_name: '语文试卷A',
  //         status: '10',
  //         examinee_status: '00',
  //         student_score: 92,
  //         total_score: 100,
  //       },
  //     ],
  //     action: '02', // 既不是可进入也不是全 no-op => 查看试卷
  //   },
  //   {
  //     id: 7,
  //     name: 'H34',
  //     exam_sessions: [
  //       {
  //         start_time: '2025-08-01 09:00',
  //         end_time: '2025-08-01 11:00',
  //         session_num: '001',
  //         paper_name: '语文试卷A',
  //         status: '08',
  //         examinee_status: '00',
  //         student_score: 92,
  //         total_score: 100,
  //       },
  //     ],
  //     action: null, // 全部批改中 => 无操作
  //   },
  //   {
  //     id: 8,
  //     name: 'H34',
  //     exam_sessions: [
  //       {
  //         start_time: '2025-08-01 09:00',
  //         end_time: '2025-08-01 11:00',
  //         session_num: '001',
  //         paper_name: '语文试卷A',
  //         status: '10',
  //         examinee_status: '02',
  //         student_score: 92,
  //         total_score: 100,
  //       },
  //     ],
  //     action: '02', // 查看试卷
  //   },
  //   {
  //     id: 9,
  //     name: 'H34',
  //     exam_sessions: [
  //       {
  //         start_time: '2025-08-01 09:00',
  //         end_time: '2025-08-01 11:00',
  //         session_num: '001',
  //         paper_name: '语文试卷A',
  //         status: '06',
  //         examinee_status: '04',
  //         student_score: 92,
  //         total_score: 100,
  //       },
  //     ],
  //     action: null, // 全部已结束 => 无操作
  //   },
  //   {
  //     id: 12,
  //     name: 'H34',
  //     exam_sessions: [
  //       {
  //         start_time: '2025-08-01 09:00',
  //         end_time: '2025-08-01 11:00',
  //         session_num: '001',
  //         paper_name: '语文试卷A',
  //         status: '10',
  //         examinee_status: '00',
  //         student_score: 92,
  //         total_score: 100,
  //       },
  //     ],
  //     action: '02',
  //   },
  //   {
  //     id: 15,
  //     name: 'H34',
  //     exam_sessions: [
  //       {
  //         start_time: '2025-08-01 09:00',
  //         end_time: '2025-08-01 11:00',
  //         session_num: '001',
  //         paper_name: '语文试卷A',
  //         status: '10',
  //         examinee_status: '00',
  //         student_score: 92,
  //         total_score: 100,
  //       },
  //     ],
  //     action: '02',
  //   },
  //   {
  //     id: 16,
  //     name: 'H34',
  //     exam_sessions: [
  //       {
  //         start_time: '2025-08-01 09:00',
  //         end_time: '2025-08-01 11:00',
  //         session_num: '001',
  //         paper_name: '语文试卷A',
  //         status: '10',
  //         examinee_status: '00',
  //         student_score: 92,
  //         total_score: 100,
  //       },
  //     ],
  //     action: '02',
  //   },
  //   {
  //     id: 17,
  //     name: 'H34',
  //     exam_sessions: [
  //       {
  //         start_time: '2025-08-01 09:00',
  //         end_time: '2025-08-01 11:00',
  //         session_num: '001',
  //         paper_name: '语文试卷A',
  //         status: '10',
  //         examinee_status: '00',
  //         student_score: 55,
  //         total_score: 100,
  //       },
  //     ],
  //     action: '02',
  //   },
  //   {
  //     id: 18,
  //     name: 'H34',
  //     exam_sessions: [
  //       {
  //         start_time: '2025-08-01 09:00',
  //         end_time: '2025-08-01 11:00',
  //         session_num: '001',
  //         paper_name: '语文试卷A',
  //         status: '10',
  //         examinee_status: '00',
  //         student_score: 92,
  //         total_score: 100,
  //       },
  //     ],
  //     action: '02',
  //   },
  //   {
  //     id: 19,
  //     name: 'H34',
  //     exam_sessions: [
  //       {
  //         start_time: '2025-08-01 09:00',
  //         end_time: '2025-08-01 11:00',
  //         session_num: '001',
  //         paper_name: '语文试卷A',
  //         status: '10',
  //         examinee_status: '00',
  //         student_score: 92,
  //         total_score: 100,
  //       },
  //     ],
  //     action: '02',
  //   },
  // ];

  // 日期选择器对象
  let date_picker = null;

  // 考试列表
  let exam_list = $state([]);

  // 总数据数
  let total_count = $state(0);

  // 筛选条件
  let exam_name = $state('');
  let exam_status = $state('');
  let start_time = $state(0);
  let end_time = $state(0);
  let page = $state(1);
  let page_size = $state(10);

  // 场次状态映射
  const STATUS_MAP = {
    '02': '待开始',
    '04': '进行中',
    '06': '已结束',
    '08': '批改中',
    '10': '已批改',
    '12': '已提交',
  };

  // 考生状态映射
  const EXAMINEE_STATUS_MAP = {
    '00': '未交卷',
    '02': '缺考',
    '04': '补考',
    '06': '作弊',
    '10': '已交卷',
  };

  // 操作映射表
  const ACTION_MAP = {
    '00': '进入考试',
    '02': '查看试卷',
  };

  // 操作码对应的事件
  const ACTION_HANDLERS = {
    '00': (exam_id) => gotoExamDetail(exam_id),
    '02': (exam_id) => gotoExamResult(exam_id),
  };

  // 处理对应操作
  function handleAction(action, exam_id) {
    if (action && ACTION_MAP[action]) {
      const handler = ACTION_HANDLERS[action];
      handler(exam_id);
    }
  }

  // TODO 当前阶段使用分数是否为-1作为标准
  // 是否已经批改好（场次状态为"已提交"）
  function isMarked(status, score) {
    return status === '10' && score !== -1;
  }

  //TODO 当前阶段特判
  function statusText(status, score) {
    if (status !== '10' || (status === '10' && score === -1)) return STATUS_MAP[status];
    return '已提交';
  }

  // 判断考试是否通过
  function isPass(student_score, total_score) {
    return student_score >= total_score * 0.6;
  }

  // 前往考试批改后的页面
  function gotoExamResult(exam_id) {
    const exam_session_ids = JSON.stringify(
      exam_list.find((el) => el.id === exam_id)?.exam_sessions.map((es) => es.id),
    );
    goto(`/student/answer/result/exam?exam-session-id-arr=${exam_session_ids}`);
  }

  // 前往考试详情页进行考试
  function gotoExamDetail(exam_id) {
    goto(`/student/answer/exam-detail?exam-id=${exam_id}`);
  }

  // 重置
  function handleReset() {
    exam_name = '';
    exam_status = '';
    if (date_picker) {
      date_picker.reset();
      start_time = 0;
      end_time = 0;
    }
  }

  // 搜索
  function handleSearch() {
    const q = JSON.stringify({
      orderBy: [{ Duration: 'DESC', Time: 'DESC' }],
      filter: {
        Name: exam_name,
        Status: exam_status,
        StartTime: start_time,
        EndTime: end_time,
      },
      page,
      pageSize: page_size,
    });

    // 分支过多，越不容易测试

    // 获取考试列表
    fetch(`/api/exam/list?q=${q}`)
      .then((res) => {
        if (!res.ok)
          return res.text().then((error_text) => {
            throw new Error(`请求失败：${res.status} ${res.statusText}` + (error_text ? '-' + error_text : ''));
          });
        return res.json();
      })
      .then((res) => {
        if (!res.status) {
          exam_list = res.data ?? [];
          total_count = res.rowCount ?? 0;

          // 计算每个考试的 action，用于判断在表格中的操作类型
          if (Array.isArray(exam_list))
            exam_list.forEach((exam) => {
              // 如果某个 session 是 “已结束” 或 “批改中”，这类 session 本身不能做任何操作
              // 但只要存在一个可以进入考试的 session（状态 02 或 04），整个 exam 还是可以“进入考试”
              const sessions = Array.isArray(exam.exam_sessions) ? exam.exam_sessions : [];

              const has_enterable = sessions.some((s) => s.status === '02' || s.status === '04');
              const all_sessions_no_op = sessions.every(
                (s) => s.status === '06' || s.status === '08' || (s.status === '10' && s.student_score === -1), // TODO 当前阶段使用分数是否为-1作为标准
              );

              if (all_sessions_no_op)
                exam.action = null; // 全部都是不可操作的（比如都已结束/批改中），清空 action
              else if (has_enterable)
                exam.action = '00'; // 进入考试 // 存在一个可以进入的场次
              else exam.action = '02'; // 查看试卷  （可能是已提交/已批改之类）
            });
          else {
            exam_list = [];
            throw new Error('exam_list 数据类型错误');
          }
        } else throw new Error(res.msg ?? '获取考试列表失败');
      })
      .catch((err) => {
        toast.error(err.message);
      });
  }

  // 处理开始时间
  function handleStartDateSelected(event) {
    const start_date = event.detail.date;
    start_time = new Date(start_date).getTime();
  }

  // 处理结束时间
  function handleEndDateSelected(event) {
    const end_date = event.detail.date;
    end_time = new Date(end_date).getTime();
  }

  // 处理页号改变
  function handlePageChange(event) {
    page = event.detail;
    handleSearch();
  }

  // 处理页大小改变
  function handlePageSizeChange(event) {
    page_size = event.detail;
  }

  onMount(() => handleSearch());
</script>

<svelte:head>
  <title>考试列表 • 3min</title>
</svelte:head>

<div class="exam-body">
  <!-- 筛选框、按钮 -->
  <div class="options">
    <div class="exam-input">
      <div class="label">考试名称：</div>
      <input type="text" placeholder="请输入信息" bind:value={exam_name} class="input" />
    </div>
    <div class="datePicker" data-testid="date-picker">
      <div class="label">考试时间：</div>
      <DatePicker
        input_width={'21rem'}
        bind:this={date_picker}
        is_single_date_selection={false}
        is_time_selection={true}
        on:start_date_selected={handleStartDateSelected}
        on:end_date_selected={handleEndDateSelected}
      />
    </div>
    <div class="select" data-testid="exam-status-select">
      <div class="label">考试状态：</div>
      <Select bind:value={exam_status}>
        <Option value="" label="全部" />
        <Option value="02" label={STATUS_MAP['02']} />
        <Option value="04" label={STATUS_MAP['04']} />
        <Option value="06" label={STATUS_MAP['06']} />
      </Select>
    </div>
    <button class="btn btn--info is_plain" onclick={handleReset}>重置</button>
    <button class="btn btn--primary" onclick={handleSearch}>搜索</button>
  </div>

  <!-- 考试列表 -->
  <div class="table">
    <table>
      <thead>
        <tr>
          <th>考试名称</th>
          <th>考试试卷</th>
          <th>考试时间</th>
          <th>场次状态</th>
          <th>提交状态</th>
          <th>试卷总分</th>
          <th>场次成绩</th>
          <th>是否通过</th>
          <th>操作</th>
        </tr>
      </thead>
      <tbody data-testid="exam-tbody">
        {#each exam_list as exam (exam.id)}
          <tr>
            <td>{exam.name}</td>
            <td
              ><div class="stack">
                {#each exam.exam_sessions as { paper_name }}
                  <span>{paper_name}</span>
                {/each}
              </div></td
            >
            <td
              ><div class="stack">
                {#each exam.exam_sessions as { start_time, end_time }}
                  <span>{formatTimestamp(start_time)} ~ {formatTimestamp(end_time)}</span>
                {/each}
              </div></td
            >
            <td
              ><div class="stack">
                {#each exam.exam_sessions as { status, student_score }}
                  <span
                    class="status"
                    class:incoming={status === '02'}
                    class:underway={status === '04'}
                    class:ended={status === '06'}
                    class:marking={status === '08'}
                    class:marked={status === '10'}
                    class:submitted={status === '12'}
                    class:unknown={!STATUS_MAP[status]}>{statusText(status, student_score) ?? '未知状态'}</span
                  >
                {/each}
              </div></td
            >
            <td
              ><div class="stack">
                {#each exam.exam_sessions as { examinee_status }}
                  <span
                    class:unSubmitted={examinee_status === '00'}
                    class:unknown={!EXAMINEE_STATUS_MAP[examinee_status] ||
                      (examinee_status !== '00' && examinee_status !== '10')}
                    >{EXAMINEE_STATUS_MAP[examinee_status] ?? '未知状态'}</span
                  >
                {/each}
              </div></td
            >
            <td
              ><div class="stack">
                {#each exam.exam_sessions as { total_score }}
                  <span> {total_score}</span>
                {/each}
              </div></td
            >
            <td>
              <!-- TODO 应该是一个考试只有一个成绩结果 -->
              <div class="stack">
                {#each exam.exam_sessions as { status, student_score, total_score }}
                  <span
                    class="score"
                    class:pass={isMarked(status, student_score) && isPass(student_score, total_score)}
                    class:failed={isMarked(status, student_score) && !isPass(student_score, total_score)}
                    >{isMarked(status, student_score) ? student_score : '--'}</span
                  >
                {/each}
              </div></td
            >
            <td>
              <div class="stack">
                {#each exam.exam_sessions as { status, student_score, total_score }}
                  <span
                    class="score is-pass"
                    class:pass={isMarked(status, student_score) && isPass(student_score, total_score)}
                    class:failed={isMarked(status, student_score) && !isPass(student_score, total_score)}
                  >
                    {isMarked(status, student_score)
                      ? isPass(student_score, total_score)
                        ? '已通过'
                        : '未通过'
                      : '--'}</span
                  >
                {/each}
              </div>
            </td>
            <td>
              <button
                class="option"
                class:can-click={exam.action && ACTION_MAP[exam.action]}
                onclick={() => handleAction(exam.action, exam.id)}
              >
                {ACTION_MAP[exam.action] ? ACTION_MAP[exam.action] : '--'}</button
              >
            </td>
          </tr>
        {/each}
      </tbody>
    </table>
    {#if exam_list.length === 0}
      <div class="empty">
        <Empty text="暂无考试数据" />
      </div>
    {/if}
  </div>
</div>

<div class="pagination">
  <Pagination total_items={total_count} on:pageChange={handlePageChange} on:pageSizeChange={handlePageSizeChange} />
</div>

<style lang="scss">
  .exam-body {
    display: flex;
    flex-direction: column;
    gap: 2rem;
    height: 70vh;

    .options {
      display: flex;
      flex-wrap: wrap;
      justify-content: left;
      align-items: center;
      gap: 1rem;
      z-index: 10;

      .exam-input,
      .datePicker,
      .select {
        display: flex;
        align-items: center;
      }

      .label {
        white-space: nowrap;
      }

      .select {
        width: 15rem;
      }
    }

    .table {
      height: 65vh;
      overflow-y: auto;
      scrollbar-width: thin;
      scrollbar-color: #ccc transparent;

      table {
        width: 100%;
        border-collapse: collapse;

        thead {
          background-color: rgb(250, 250, 250);
          position: sticky;
          top: 0;
        }

        tr {
          height: 3rem;
          color: rgb(102, 102, 102);
          border-bottom: 1px lightgray solid;

          th {
            font-weight: lighter;
            font-size: 0.9rem;
            white-space: nowrap;
          }
        }

        tbody {
          tr {
            color: black;

            td {
              font-size: 0.9rem;
              text-align: center;
              vertical-align: middle;
              padding: 5px 0;

              .stack {
                display: flex;
                flex-direction: column;
                gap: 0.5rem;
                align-items: center;

                span {
                  $status-color: (
                    'incoming': #ff8100,
                    'underway': #39bb4c,
                    'ended': #787d81,
                    'marking': #c6690b,
                    'marked': #027213,
                    'submitted': #0052d9,
                  );

                  &.status {
                    @each $name, $color in $status-color {
                      &.#{$name} {
                        color: $color;
                      }
                    }
                  }

                  &.unSubmitted {
                    color: #ff8100;
                  }

                  &.unknown {
                    color: #f55151;
                  }

                  &.score {
                    &.pass {
                      color: green;
                      &.is-pass {
                        border: 0.5px solid green;
                        border-radius: 5px;
                        padding: 0.05rem 0.1rem;
                        background: #e6f9e6;
                      }
                    }

                    &.failed {
                      color: red;

                      &.is-pass {
                        border: 0.5px solid red;
                        border-radius: 5px;
                        padding: 0.05rem 0.1rem;
                        background: #ffe6e6;
                      }
                    }
                  }
                }
              }

              .option {
                border: 0;
                background-color: white;
                color: blue;

                &.can-click:hover {
                  cursor: pointer;
                  font-weight: bold;
                }
              }
            }
          }
        }
      }

      .empty {
        margin-top: 10rem;
      }
    }
  }

  .pagination {
    display: flex;
    justify-content: right;
  }
</style>
