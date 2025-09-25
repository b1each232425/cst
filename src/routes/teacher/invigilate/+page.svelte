<!--
 * @Author: 林炜佳 wj2144632819@qq.com
 * @Date: 2025-08-22 09:28:11
 * @LastEditors: 林炜佳 wj2144632819@qq.com
 * @LastEditTime: 2025-08-23 00:18:07
 * @FilePath: \exam\src\routes\teacher\invigilate\+page.svelte
 * @Description: 教师端监考管理列表
 * @Copyright (c) 2025 by 广州近邻信息有限公司, All Rights Reserved. 
-->

<script>
  import Title from '$lib/components/Title/Title.svelte';
  import { toast } from '$lib/components/Toast/Toast.js';
  import Select from '$lib/components/Select/Select.svelte';
  import Option from '$lib/components/Select/Option.svelte';
  import Empty from '$lib/components/Table/Empty.svelte';
  import DatePicker from '$lib/components/DatePicker/DatePicker.svelte';
  import Pagination from '$lib/components/Pagination/Pagination.svelte';
  import '$lib/components/Button/index.scss';
  import '$lib/components/Input/index.scss';
  import { onMount } from 'svelte';
  import { formatTimestamp } from '$lib/utils/time_utils';
  import { goto } from '$app/navigation';

  // const MOCK_EXAM_SESSION = [
  //   {
  //     ExamSessionID: 1001,
  //     ExamRoomID: 2001,
  //     ExamSessionName: '2025年春季期末考试',
  //     ExamSiteName: '广州天河分校',
  //     ExamRoomName: '101多媒体教室',
  //     StartTime: new Date('2025-08-22 09:00:00').getTime(),
  //     EndTime: new Date('2025-08-22 11:30:00').getTime(),
  //     Status: '02',
  //     ExamineeNum: 120,
  //     AbsenteeNum: 8,
  //   },
  //   {
  //     ExamSessionID: 1002,
  //     ExamRoomID: 2002,
  //     ExamSessionName: '2025年春季期中考试',
  //     ExamSiteName: '北京海淀分校',
  //     ExamRoomName: '201标准考场',
  //     StartTime: new Date('2025-08-22 14:00:00').getTime(),
  //     EndTime: new Date('2025-08-22 15:30:00').getTime(),
  //     Status: '04',
  //     ExamineeNum: 80,
  //     AbsenteeNum: 3,
  //   },
  //   {
  //     ExamSessionID: 1003,
  //     ExamRoomID: 2003,
  //     ExamSessionName: '2025年春季模拟考试',
  //     ExamSiteName: '上海浦东分校',
  //     ExamRoomName: '301计算机房',
  //     StartTime: new Date('2025-08-21 10:00:00').getTime(),
  //     EndTime: new Date('2025-08-21 12:00:00').getTime(),
  //     Status: '06',
  //     ExamineeNum: 60,
  //     AbsenteeNum: 5,
  //   },
  //   {
  //     ExamSessionID: 1004,
  //     ExamRoomID: 2004,
  //     ExamSessionName: '2025年春季单元测试',
  //     ExamSiteName: '深圳南山分校',
  //     ExamRoomName: '401阶梯教室',
  //     StartTime: new Date('2025-08-20 15:00:00').getTime(),
  //     EndTime: new Date('2025-08-20 16:00:00').getTime(),
  //     Status: '08',
  //     ExamineeNum: 150,
  //     AbsenteeNum: 12,
  //   },
  //   {
  //     ExamSessionID: 1005,
  //     ExamRoomID: 2005,
  //     ExamSessionName: '2025年春季入学考试',
  //     ExamSiteName: '杭州西湖分校',
  //     ExamRoomName: '501语音室',
  //     StartTime: new Date('2025-08-19 08:30:00').getTime(),
  //     EndTime: new Date('2025-08-19 10:30:00').getTime(),
  //     Status: '10',
  //     ExamineeNum: 50,
  //     AbsenteeNum: 2,
  //   },
  //   {
  //     ExamSessionID: 1006,
  //     ExamRoomID: 2006,
  //     ExamSessionName: '2025年春季补考',
  //     ExamSiteName: '成都武侯分校',
  //     ExamRoomName: '601专用考场',
  //     StartTime: new Date('2025-08-18 13:00:00').getTime(),
  //     EndTime: new Date('2025-08-18 14:30:00').getTime(),
  //     Status: '12',
  //     ExamineeNum: 30,
  //     AbsenteeNum: 1,
  //   },
  //   {
  //     ExamSessionID: 1008,
  //     ExamRoomID: 2008,
  //     ExamSessionName: '2025年春季英语四级模拟考',
  //     ExamSiteName: '武汉江汉分校',
  //     ExamRoomName: '801听力教室',
  //     StartTime: new Date('2025-08-24 09:00:00').getTime(),
  //     EndTime: new Date('2025-08-24 11:20:00').getTime(),
  //     Status: '22',
  //     ExamineeNum: 45,
  //     AbsenteeNum: 0,
  //   },
  // ];

  // 场次状态映射
  const STATUS_MAP = {
    '02': '待开始',
    '04': '进行中',
    '06': '已结束',
    '08': '批改中',
    '10': '已批改',
    '12': '已提交',
  };

  let date_picker = null;

  let exam_session_list = $state([]);

  let exam_session_name = $state('');
  let start_time = $state(-1);
  let end_time = $state(-1);
  let status = $state('');
  let total_count = $state(0);
  let page = $state(1);
  let page_size = $state(10);

  function gotoInvigilate(exam_session_id, exam_room_id) {
    goto(`/teacher/invigilate/detail?exam_session_id=${exam_session_id}&exam_room_id=${exam_room_id}`);
  }

  // 重置
  function handleReset() {
    exam_session_name = '';
    status = '';
    if (date_picker) {
      date_picker.reset();
      start_time = 0;
      end_time = 0;
    }
  }

  // 搜索
  function handleSearch() {
    const q = JSON.stringify({
      Filter: {
        ExamSessionName: exam_session_name,
        ExamSessionStatus: status,
        StartTime: start_time,
        EndTime: end_time,
      },
      Page: page,
      PageSize: page_size,
    });

    // 获取考试列表
    fetch(`/api/invigilation/list?q=${q}`)
      .then((res) => {
        if (!res.ok)
          return res.text().then((error_text) => {
            throw new Error(`请求失败：${res.status} ${res.statusText}` + (error_text ? '-' + error_text : ''));
          });
        return res.json();
      })
      .then((res) => {
        if (!res.status) {
          exam_session_list = res.data ?? [];
          total_count = res.rowCount ?? 0;

          if (!Array.isArray(exam_session_list)) {
            exam_session_list = [];
            throw new Error('exam_session_list 数据类型错误');
          }
        } else throw new Error(res.msg ?? '获取监考列表失败');
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

<div class="invigilate-body">
  <Title title="监考列表" />

  <!-- 筛选框、按钮 -->
  <div class="options">
    <div class="exam-input">
      <div class="label">考试场次：</div>
      <input type="text" placeholder="请输入信息" bind:value={exam_session_name} class="input" />
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
      <Select bind:value={status}>
        <Option value="" label="全部" />
        <Option value="02" label={STATUS_MAP['02']} />
        <Option value="04" label={STATUS_MAP['04']} />
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
          <th>考试场次</th>
          <th>考点</th>
          <th>考场</th>
          <th>考试时间</th>
          <th>考试状态</th>
          <th>考生人数</th>
          <th>缺考人数</th>
          <th>操作</th>
        </tr>
      </thead>
      <tbody data-testid="invigilate-tbody">
        {#each exam_session_list as { ExamSessionID, ExamRoomID, ExamSessionName, ExamSiteName, ExamRoomName, StartTime, EndTime, Status, ExamineeNum, AbsenteeNum } (ExamSessionID)}
          <tr>
            <td>{ExamSessionName}</td>
            <td>{ExamSiteName}</td>
            <td>{ExamRoomName}</td>
            <td>{formatTimestamp(StartTime)} ~ {formatTimestamp(EndTime)}</td>
            <td
              class="status"
              class:incoming={Status === '02'}
              class:underway={Status === '04'}
              class:ended={Status === '06'}
              class:marking={Status === '08'}
              class:marked={Status === '10'}
              class:submitted={Status === '12'}
              class:unknown={!STATUS_MAP[Status]}>{STATUS_MAP[Status] ?? '未知状态'}</td
            >
            <td>{ExamineeNum}</td>
            <td class:has-absentee={Status !== '02' && Status !== '04' && AbsenteeNum !== 0}
              >{Status === '02' || Status === '04' ? '--' : AbsenteeNum}</td
            >
            <td class="option">
              <div class="option-item">
                <button
                  onclick={() => (STATUS_MAP[Status] ? gotoInvigilate(ExamSessionID, ExamRoomID) : {})}
                  class:can-click={STATUS_MAP[Status]}
                  >{STATUS_MAP[Status] ? (Status === '04' ? '进入监考' : '查看详情') : '--'}</button
                >
              </div>
            </td>
          </tr>
        {/each}
      </tbody>
    </table>
    {#if exam_session_list.length === 0}
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
  .invigilate-body {
    display: flex;
    flex-direction: column;
    height: 93%;
    gap: 1rem;

    .options {
      display: flex;
      flex-wrap: wrap;
      justify-content: left;
      align-items: center;
      gap: 1rem;

      .exam-input,
      .datePicker,
      .select {
        display: flex;
        align-items: center;
      }

      .label {
        white-space: nowrap;
        color: rgba(0, 0, 0, 0.6);
        font-size: 14px;
      }

      .select {
        width: 12rem;
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
          position: sticky;
          top: 0;
          font-size: 14px;
          color: var(--gray);
          background-color: white;
        }

        tr {
          height: 3.5rem;

          th {
            font-weight: lighter;
            font-size: 0.9rem;
            white-space: nowrap;
          }
        }

        tbody {
          tr {
            border-bottom: 1px rgb(221, 221, 221) solid;
            color: #333333;

            td {
              font-size: 0.9rem;
              text-align: center;
              vertical-align: middle;
              padding: 5px 0;
              padding: 0.5rem 0;

              $status-color: (
                'incoming': var(--orange),
                'underway': var(--green),
                'ended': var(--gray),
                'marking': #c6690b,
                'marked': #027213,
                'submitted': #0052d9,
                'unknown': var(--red),
              );

              &.status {
                @each $name, $color in $status-color {
                  &.#{$name} {
                    color: $color;
                  }
                }
              }

              &.has-absentee {
                color: var(--red);
              }

              &.option {
                width: 10%;

                .option-item {
                  display: flex;
                  justify-content: center;
                  gap: 1rem;

                  button {
                    background: none;
                    border: none;
                    padding: 0;
                    pointer-events: none;

                    &.can-click {
                      pointer-events: all;
                      cursor: pointer;
                      color: #2f54eb;
                      border-bottom: 1px solid #2f54eb;

                      &:hover {
                        font-weight: bold;
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }

      .empty {
        margin-top: 10vh;
      }
    }
  }

  .pagination {
    display: flex;
    justify-content: right;
  }

  @media screen and (max-width: 1300px) {
    .invigilate-body {
      .table {
        height: 60vh;
      }
    }
  }
</style>
