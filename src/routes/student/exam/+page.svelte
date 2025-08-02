<script>
  import { goto } from '$app/navigation';
  import { onMount } from 'svelte';
  import Button from '$lib/components/Button/Button.svelte';
  import { toast } from '$lib/components/Toast/Toast.js';
  import Select from '$lib/components/Select/Select.svelte';
  import Option from '$lib/components/Select/Option.svelte';
  import InputBox from '$lib/components/Input/InputBox.svelte';
  import Empty from '$lib/components/Table/Empty.svelte';
  import DatePicker from '$lib/components/DatePicker/DatePicker.svelte';
  import Pagination from '$lib/components/Pagination/Pagination.svelte';
  import Dialog from '../answer/_component/Dialog.svelte';
  import { formatTimestamp } from '$lib/utils/time_utils';

  // mock 数据
  // const mockExam = [
  //   {
  //     id: 5,
  //     name: 'H34',
  //     exam_sessions: [
  //       {
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
  let datePicker = null;

  // 场次状态映射
  const statusMap = new Map([
    ['02', '待开始'],
    ['04', '进行中'],
    ['06', '已结束'],
    ['08', '批改中'],
    ['10', '已批改'],
    ['12', '已提交'],
  ]);

  // 考生状态映射
  const examineeStatusMap = new Map([
    ['00', '正常考'],
    ['02', '缺考'],
    ['04', '补考'],
    ['06', '作弊'],
    ['10', '已交卷'],
  ]);

  // 操作映射表
  const actionMap = new Map([
    ['00', '进入考试'],
    ['02', '查看试卷'],
  ]);

  const actionHandlers = {
    '00': (examId) => gotoExamDetail(examId),
    '02': () => gotoExamResult(),
  };

  // 处理对应操作
  function handleAction(action, examId) {
    if (action && actionMap.has(action)) {
      const handler = actionHandlers[action];
      handler(examId);
    }
  }

  // 是否已经批改好
  function isMarked(status) {
    return status === '10' || status === '12';
  }

  // 判断考试是否通过
  function isPass(student_score, total_score) {
    return student_score >= total_score * 0.6;
  }

  // 考试列表
  let examList = $state([]);

  // 总数据数
  let totalCount = $state(0);

  // 筛选条件
  let examName = $state('');
  let examStatus = $state('');
  let startTime = $state(0);
  let endTime = $state(0);
  let page = $state(1);
  let pageSize = $state(10);

  // 前往考试批改后的页面
  function gotoExamResult(id) {
    // goto('/student/');
  }

  // 前往考试详情页进行考试
  function gotoExamDetail(examId) {
    goto(`/student/answer/exam-detail?exam-id=${examId}`);
  }

  // 获取考试列表
  function getExamList(q) {
    fetch(`/api/exam/list?q=${q}`)
      .then((res) => {
        if (!res.ok) throw new Error('请求失败');
        return res.json();
      })
      .then((res) => {
        if (!res.status) {
          examList = res.data ?? [];
          totalCount = res.rowCount ?? 0;

          // 计算每个考试的 action，用于判断在表格中的操作类型
          examList.forEach((exam) => {
            // 如果某个 session 是 “已结束” 或 “批改中”，这类 session 本身不能做任何操作
            // 但只要存在一个可以进入考试的 session（状态 02 或 04），整个 exam 还是可以“进入考试”
            const sessions = Array.isArray(exam.exam_sessions) ? exam.exam_sessions : [];

            const hasEnterable = sessions.some((s) => s.status === '02' || s.status === '04');
            const allSessionsNoOp = sessions.every((s) => s.status === '06' || s.status === '08' || s.status === '10');

            if (allSessionsNoOp)
              exam.action = null; // 全部都是不可操作的（比如都已结束/批改中），清空 action
            else if (hasEnterable)
              exam.action = '00'; // 进入考试 // 存在一个可以进入的场次
            else exam.action = '02'; // 查看试卷 // 没有可进入的，但不是全部不可操作（可能是已提交/已批改之类）
          });
        } else throw new Error(res.msg ?? '获取考试列表失败');
      })
      .catch((err) => {
        toast.error(err.message);
      });
  }

  // 重置
  function handleReset() {
    examName = '';
    examStatus = '';
    if (datePicker) datePicker.reset();
  }

  // 搜索
  function handleSearch() {
    const q = JSON.stringify({
      orderBy: [{ Duration: 'DESC', Time: 'DESC' }],
      filter: {
        Name: examName,
        Status: examStatus,
        StartTime: startTime,
        EndTime: endTime,
      },
      page,
      pageSize,
    });

    getExamList(q);
  }

  // 处理开始时间
  function handleStartDateSelected(event) {
    const startDate = event.detail.date;
    startTime = new Date(startDate).getTime();
  }

  // 处理结束时间
  function handleEndDateSelected(event) {
    const endDate = event.detail.date;
    endTime = new Date(endDate).getTime();
  }

  // 处理页号改变
  function handlePageChange(event) {
    page = event.detail;
    handleSearch();
  }

  // 处理页大小改变
  function handlePageSizeChange(event) {
    pageSize = event.detail;
    handleSearch();
  }

  onMount(() => handleSearch());
</script>

<svelte:head>
  <title>3min • 考试列表</title>
</svelte:head>

<div class="exam-body">
  <div class="options">
    <div class="input">
      <div class="label">考试名称：</div>
      <InputBox placeholder="请输入信息" bind:value={examName} type="text" showLabel={false} />
    </div>
    <div class="datePicker" data-testid="datePicker">
      <div class="label">考试时间：</div>
      <DatePicker
        inputWidth={'21rem'}
        bind:this={datePicker}
        singleDateSelection={false}
        isTimeSelection={true}
        on:startDateSelected={handleStartDateSelected}
        on:endDateSelected={handleEndDateSelected}
      />
    </div>
    <div class="select" data-testid="exam-status-select">
      <div class="label">考试状态：</div>
      <Select bind:value={examStatus}>
        <Option value="" label="全部" />
        {#each statusMap as [key, val], index (index)}
          {#if index < 3}
            <Option value={key} label={val} />
          {/if}
        {/each}
      </Select>
    </div>
    <Button type="info" onclick={handleReset}>重置</Button>
    <Button type="primary" onclick={handleSearch}>搜索</Button>
  </div>

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
      <tbody>
        {#each examList as exam (exam.id)}
          <tr>
            <td>{exam.name}</td>
            <td
              ><div class="stack">
                {#each exam.exam_sessions as { paper_name }, index (index)}
                  <span>{paper_name}</span>
                {/each}
              </div></td
            >
            <td
              ><div class="stack">
                {#each exam.exam_sessions as { start_time, end_time }, index (index)}
                  <span>{formatTimestamp(start_time)} ~ {formatTimestamp(end_time)}</span>
                {/each}
              </div></td
            >
            <td
              ><div class="stack">
                {#each exam.exam_sessions as { status }, index (index)}
                  <span
                    class="status"
                    class:incoming={status === '02'}
                    class:underway={status === '04'}
                    class:ended={status === '06'}
                    class:marking={status === '08'}
                    class:marked={status === '10'}
                    class:submitted={status === '12'}
                    class:unknown={!statusMap.has(status)}>{statusMap.get(status) ?? '未知状态'}</span
                  >
                {/each}
              </div></td
            >
            <td
              ><div class="stack">
                {#each exam.exam_sessions as { examinee_status }, index (index)}
                  <span class:unknown={examinee_status !== '00' && examinee_status !== '10'}
                    >{examineeStatusMap.get(examinee_status) ?? '未知状态'}</span
                  >
                {/each}
              </div></td
            >
            <td
              ><div class="stack">
                {#each exam.exam_sessions as { total_score }, index (index)}
                  <span> {total_score}</span>
                {/each}
              </div></td
            >
            <td>
              <!-- TODO 应该是一个考试只有一个成绩结果 -->
              <div class="stack">
                {#each exam.exam_sessions as { status, student_score, total_score }, index (index)}
                  <span
                    class="score"
                    class:pass={isMarked(status) && isPass(student_score, total_score)}
                    class:failed={isMarked(status) && !isPass(student_score, total_score)}
                    >{isMarked(status) ? student_score : '--'}</span
                  >
                {/each}
              </div></td
            >
            <td>
              <div class="stack">
                {#each exam.exam_sessions as { status, student_score, total_score }, index (index)}
                  <span
                    class="score is-pass"
                    class:pass={isMarked(status) && isPass(student_score, total_score)}
                    class:failed={isMarked(status) && !isPass(student_score, total_score)}
                  >
                    {isMarked(status) ? (isPass(student_score, total_score) ? '已通过' : '未通过') : '--'}</span
                  >
                {/each}
              </div>
            </td>
            <td>
              <button
                class="option"
                class:can-click={exam.action && actionMap.has(exam.action)}
                onclick={() => handleAction(exam.action, exam.id)}
              >
                {actionMap.has(exam.action) ? actionMap.get(exam.action) : '--'}</button
              >
            </td>
          </tr>
        {/each}
      </tbody>
    </table>
    {#if examList.length === 0}
      <div class="empty">
        <Empty text="暂无考试数据" />
      </div>
    {/if}
  </div>
</div>

<div class="pagination">
  <Pagination totalItems={totalCount} on:pageChange={handlePageChange} on:pageSizeChange={handlePageSizeChange} />
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

      .input,
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
                align-items: center; // 需要时

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
