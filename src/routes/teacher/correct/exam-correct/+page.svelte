<!--
 * @Author: 林炜佳 wj2144632819@qq.com
 * @Date: 2025-08-06 10:00:00
 * @LastEditors: 林炜佳 wj2144632819@qq.com
 * @LastEditTime: 2025-08-07 00:18:07
 * @FilePath: \exam\src\routes\teacher\correct\exam-correct\+page.svelte
 * @Description: 教师端考试批改列表
 * @Copyright (c) 2025 by 广州近邻信息有限公司, All Rights Reserved. 
-->

<script>
  import Pagination from '$lib/components/Pagination/Pagination.svelte';
  import Empty from '$lib/components/Table/Empty.svelte';
  import DatePicker from '$lib/components/DatePicker/DatePicker.svelte';
  import { onMount } from 'svelte';
  import { toast } from '$lib/components/Toast/Toast';
  import { formatTimestamp } from '$lib/utils/time_utils';
  import { debounce } from '$lib/utils/optimize';
  import MessageBox from '$lib/components/MessageBox/MessageBox.js';
  import { goto } from '$app/navigation';
  import '$lib/components/Input/index.scss';
  import Title from '$lib/components/Title/Title.svelte';

  // const mockExam = [
  //   {
  //     id: 5,
  //     name: 'H34',
  //     type: '00',
  //     exam_sessions: [
  //       {
  //         id: 11,
  //         name: 'session_name',
  //         start_time: '2025-08-01 09:00',
  //         end_time: '2025-08-01 11:00',
  //         mark_mode: '00',
  //         respondent_count: 12,
  //         unmarked_student_count: 10,
  //         status: '04',
  //         mark_status: '00',
  //       },
  //       {
  //         id: 11,
  //         name: 'session_name',
  //         start_time: '2025-08-01 09:00',
  //         end_time: '2025-08-01 11:00',
  //         mark_mode: '00',
  //         respondent_count: 12,
  //         unmarked_student_count: 10,
  //         status: '04',
  //         mark_status: '00',
  //       },
  //       {
  //         id: 11,
  //         name: 'session_name',
  //         start_time: '2025-08-01 09:00',
  //         end_time: '2025-08-01 11:00',
  //         mark_mode: '00',
  //         respondent_count: 12,
  //         unmarked_student_count: 10,
  //         status: '06',
  //         mark_status: '00',
  //       },
  //     ],
  //   },
  //   {
  //     id: 6,
  //     name: 'H34',
  //     type: '00',
  //     exam_sessions: [
  //       {
  //         id: 11,
  //         name: '《Svelte入门实战课》2025年第1期阶段考试',
  //         start_time: '2025-08-01 09:00',
  //         end_time: '2025-08-01 11:00',
  //         mark_mode: '02',
  //         respondent_count: 12,
  //         unmarked_student_count: 10,
  //         status: '06',
  //         mark_status: '00',
  //       },
  //     ],
  //   },
  //   // {
  //   //   id: 3,
  //   //   name: 'H34',
  //   //   type: '00',
  //   //   exam_sessions: [
  //   //     {
  //   //       id: 11,
  //   //       name: 'session_name',
  //   //       start_time: '2025-08-01 09:00',
  //   //       end_time: '2025-08-01 11:00',
  //   //       mark_mode: '00',
  //   //       respondent_count: 12,
  //   //       unmarked_student_count: 10,
  //   //       status: '04',
  //   //       mark_status: '00',
  //   //     },
  //   //     {
  //   //       id: 11,
  //   //       name: 'session_name',
  //   //       start_time: '2025-08-01 09:00',
  //   //       end_time: '2025-08-01 11:00',
  //   //       mark_mode: '00',
  //   //       respondent_count: 12,
  //   //       unmarked_student_count: 10,
  //   //       status: '04',
  //   //       mark_status: '00',
  //   //     },
  //   //     {
  //   //       id: 11,
  //   //       name: 'session_name',
  //   //       start_time: '2025-08-01 09:00',
  //   //       end_time: '2025-08-01 11:00',
  //   //       mark_mode: '00',
  //   //       respondent_count: 12,
  //   //       unmarked_student_count: 10,
  //   //       status: '06',
  //   //       mark_status: '00',
  //   //     },
  //   //   ],
  //   // },
  //   // {
  //   //   id: 2,
  //   //   name: 'H34',
  //   //   type: '00',
  //   //   exam_sessions: [
  //   //     {
  //   //       id: 11,
  //   //       name: 'session_name',
  //   //       start_time: '2025-08-01 09:00',
  //   //       end_time: '2025-08-01 11:00',
  //   //       mark_mode: '00',
  //   //       respondent_count: 12,
  //   //       unmarked_student_count: 10,
  //   //       status: '04',
  //   //       mark_status: '00',
  //   //     },
  //   //     {
  //   //       id: 11,
  //   //       name: 'session_name',
  //   //       start_time: '2025-08-01 09:00',
  //   //       end_time: '2025-08-01 11:00',
  //   //       mark_mode: '00',
  //   //       respondent_count: 12,
  //   //       unmarked_student_count: 10,
  //   //       status: '04',
  //   //       mark_status: '00',
  //   //     },
  //   //     {
  //   //       id: 11,
  //   //       name: 'session_name',
  //   //       start_time: '2025-08-01 09:00',
  //   //       end_time: '2025-08-01 11:00',
  //   //       mark_mode: '00',
  //   //       respondent_count: 12,
  //   //       unmarked_student_count: 10,
  //   //       status: '06',
  //   //       mark_status: '00',
  //   //     },
  //   //   ],
  //   // },
  //   // {
  //   //   id: 59,
  //   //   name: 'H34',
  //   //   type: '00',
  //   //   exam_sessions: [
  //   //     {
  //   //       id: 11,
  //   //       name: 'session_name',
  //   //       start_time: '2025-08-01 09:00',
  //   //       end_time: '2025-08-01 11:00',
  //   //       mark_mode: '00',
  //   //       respondent_count: 12,
  //   //       unmarked_student_count: 10,
  //   //       status: '04',
  //   //       mark_status: '00',
  //   //     },
  //   //     {
  //   //       id: 11,
  //   //       name: 'session_name',
  //   //       start_time: '2025-08-01 09:00',
  //   //       end_time: '2025-08-01 11:00',
  //   //       mark_mode: '00',
  //   //       respondent_count: 12,
  //   //       unmarked_student_count: 10,
  //   //       status: '04',
  //   //       mark_status: '00',
  //   //     },
  //   //     {
  //   //       id: 11,
  //   //       name: 'session_name',
  //   //       start_time: '2025-08-01 09:00',
  //   //       end_time: '2025-08-01 11:00',
  //   //       mark_mode: '00',
  //   //       respondent_count: 12,
  //   //       unmarked_student_count: 10,
  //   //       status: '06',
  //   //       mark_status: '00',
  //   //     },
  //   //   ],
  //   // },
  //   // {
  //   //   id: 8,
  //   //   name: 'H34',
  //   //   type: '00',
  //   //   exam_sessions: [
  //   //     {
  //   //       id: 11,
  //   //       name: 'session_name',
  //   //       start_time: '2025-08-01 09:00',
  //   //       end_time: '2025-08-01 11:00',
  //   //       mark_mode: '00',
  //   //       respondent_count: 12,
  //   //       unmarked_student_count: 10,
  //   //       status: '04',
  //   //       mark_status: '00',
  //   //     },
  //   //     {
  //   //       id: 11,
  //   //       name: 'session_name',
  //   //       start_time: '2025-08-01 09:00',
  //   //       end_time: '2025-08-01 11:00',
  //   //       mark_mode: '00',
  //   //       respondent_count: 12,
  //   //       unmarked_student_count: 10,
  //   //       status: '04',
  //   //       mark_status: '00',
  //   //     },
  //   //     {
  //   //       id: 11,
  //   //       name: 'session_name',
  //   //       start_time: '2025-08-01 09:00',
  //   //       end_time: '2025-08-01 11:00',
  //   //       mark_mode: '00',
  //   //       respondent_count: 12,
  //   //       unmarked_student_count: 10,
  //   //       status: '06',
  //   //       mark_status: '00',
  //   //     },
  //   //   ],
  //   // },
  //   // {
  //   //   id: 51,
  //   //   name: 'H34',
  //   //   type: '00',
  //   //   exam_sessions: [
  //   //     {
  //   //       id: 11,
  //   //       name: 'session_name',
  //   //       start_time: '2025-08-01 09:00',
  //   //       end_time: '2025-08-01 11:00',
  //   //       mark_mode: '00',
  //   //       respondent_count: 12,
  //   //       unmarked_student_count: 10,
  //   //       status: '04',
  //   //       mark_status: '00',
  //   //     },
  //   //     {
  //   //       id: 11,
  //   //       name: 'session_name',
  //   //       start_time: '2025-08-01 09:00',
  //   //       end_time: '2025-08-01 11:00',
  //   //       mark_mode: '00',
  //   //       respondent_count: 12,
  //   //       unmarked_student_count: 10,
  //   //       status: '04',
  //   //       mark_status: '00',
  //   //     },
  //   //     {
  //   //       id: 11,
  //   //       name: 'session_name',
  //   //       start_time: '2025-08-01 09:00',
  //   //       end_time: '2025-08-01 11:00',
  //   //       mark_mode: '00',
  //   //       respondent_count: 12,
  //   //       unmarked_student_count: 10,
  //   //       status: '06',
  //   //       mark_status: '00',
  //   //     },
  //   //   ],
  //   // },
  // ];

  // 考试类型映射
  const TYPE_MAP = {
    '00': '平时考试',
    '02': '期末考试',
    '04': '资格证考试',
  };

  // 批改模式映射
  const MARK_MODE_MAP = {
    '00': '自动批改',
    '02': '全卷多评',
    '04': '试卷分配',
    '06': '题组专评',
    '08': '题目分配',
    '10': '单人批改',
  };

  // 考试状态映射
  const STATUS_MAP = {
    '00': '未发布',
    '02': '待开始',
    '04': '进行中',
    '06': '已结束',
    '08': '批改中',
    '10': '已批改',
    '12': '已提交',
    '14': '已删除',
  };

  // 批改状态
  const MARK_STATUS_MAP = {
    '00': '正常',
    '02': '已改完', // 给多人批阅的情况，表示他自己是否批改完；也表示自动批改完成的状态
    '04': '已删除',
  };

  // 日期选择器
  let date_picker = null;

  // 筛选条件
  let exam_name = $state('');
  let start_time = $state(0);
  let end_time = $state(0);
  let page = $state(1);
  let page_size = $state(10);

  let exam_list = $state([
    ...[
      {
        id: 1,
        name: '数学期末',
        type: '00',
        exam_sessions: [
          {
            id: 11,
            name: '数学考试A',
            start_time: new Date('2025-08-01T09:00').getTime(),
            end_time: new Date('2025-08-01T11:00').getTime(),
            mark_mode: '02',
            respondent_count: 12,
            unmarked_student_count: 10,
            status: '06',
            mark_status: '00',
          },
          {
            id: 12,
            name: '数学考试B',
            start_time: new Date('2025-08-01T13:00').getTime(),
            end_time: new Date('2025-08-01T15:00').getTime(),
            mark_mode: '02',
            respondent_count: 10,
            unmarked_student_count: 5,
            status: '10',
            mark_status: '01',
          },
          {
            id: 13,
            name: '数学考试C',
            start_time: new Date('2025-08-01T16:00').getTime(),
            end_time: new Date('2025-08-01T18:00').getTime(),
            mark_mode: '02',
            respondent_count: 15,
            unmarked_student_count: 0,
            status: '10',
            mark_status: '02',
          },
        ],
      },
      {
        id: 2,
        name: '语文期中',
        type: '00',
        exam_sessions: [
          {
            id: 21,
            name: '语文考试A',
            start_time: new Date('2025-08-02T09:00').getTime(),
            end_time: new Date('2025-08-02T11:00').getTime(),
            mark_mode: '10',
            respondent_count: 15,
            unmarked_student_count: 0,
            status: '10',
            mark_status: '02',
          },
          {
            id: 22,
            name: '语文考试B',
            start_time: new Date('2025-08-02T12:00').getTime(),
            end_time: new Date('2025-08-02T14:00').getTime(),
            mark_mode: '10',
            respondent_count: 20,
            unmarked_student_count: 10,
            status: '08',
            mark_status: '00',
          },
        ],
      },
      {
        id: 3,
        name: '英语模拟',
        type: '02',
        exam_sessions: [
          {
            id: 31,
            name: '英语考试A',
            start_time: new Date('2025-08-03T09:00').getTime(),
            end_time: new Date('2025-08-03T11:00').getTime(),
            mark_mode: '00',
            respondent_count: 8,
            unmarked_student_count: 3,
            status: '08',
            mark_status: '00',
          },
          {
            id: 32,
            name: '英语考试B',
            start_time: new Date('2025-08-03T12:00').getTime(),
            end_time: new Date('2025-08-03T14:00').getTime(),
            mark_mode: '00',
            respondent_count: 10,
            unmarked_student_count: 0,
            status: '10',
            mark_status: '02',
          },
          {
            id: 33,
            name: '英语考试C',
            start_time: new Date('2025-08-03T15:00').getTime(),
            end_time: new Date('2025-08-03T17:00').getTime(),
            mark_mode: '00',
            respondent_count: 12,
            unmarked_student_count: 0,
            status: '10',
            mark_status: '01',
          },
        ],
      },
      {
        id: 4,
        name: '物理测试',
        type: '01',
        exam_sessions: [
          {
            id: 41,
            name: '物理考试A',
            start_time: new Date('2025-08-04T09:00').getTime(),
            end_time: new Date('2025-08-04T11:00').getTime(),
            mark_mode: '01',
            respondent_count: 18,
            unmarked_student_count: 4,
            status: '06',
            mark_status: '00',
          },
          {
            id: 42,
            name: '物理考试B',
            start_time: new Date('2025-08-04T12:00').getTime(),
            end_time: new Date('2025-08-04T14:00').getTime(),
            mark_mode: '01',
            respondent_count: 20,
            unmarked_student_count: 0,
            status: '10',
            mark_status: '02',
          },
        ],
      },
      {
        id: 5,
        name: '物理测试C',
        type: '01',
        exam_sessions: [
          {
            id: 411,
            name: '物理考试A',
            start_time: new Date('2025-08-04T09:00').getTime(),
            end_time: new Date('2025-08-04T11:00').getTime(),
            mark_mode: '01',
            respondent_count: 18,
            unmarked_student_count: 4,
            status: '88',
            mark_status: '00',
          },
        ],
      },
    ],
  ]);
  let total_count = $state(0);

  const debounceSearch = debounce(handleSearch, 500);

  // 是否为正常的状态
  function isNormal(mark_mode, status, mark_status) {
    return MARK_MODE_MAP[mark_mode] && STATUS_MAP[status] && MARK_STATUS_MAP[mark_status];
  }

  // 能否进入批改
  function canCorrected(mark_mode, status, mark_status) {
    return (
      isNormal(mark_mode, status, mark_status) &&
      mark_mode !== '00' &&
      (status === '06' || status === '08' || status === '10') &&
      mark_status !== '04'
    );
  }

  //能否查看详情
  // function canCheckDetail(mark_mode, status, mark_status) {
  //   return isNormal(mark_mode, status, mark_status) && (status === '10' || status === '12') && mark_status === '02';
  // }

  // 能否提交
  function canSubmit(mark_mode, status, mark_status) {
    return isNormal(mark_mode, status, mark_status) && status === '10';
  }

  // 能否查看日志
  // function canCheckLogs() {}

  function gotoCorrect(exam_session_name, exam_session_id) {
    goto(`/teacher/correct/correct?name=${exam_session_name}&exam_session_id=${exam_session_id}`);
  }

  function gotoDetail() {}

  function submitExamSession(exam_session_id) {
    MessageBox({
      title: '确认操作',
      content: '你确定要提交吗？',
      onConfirm: () => {
        fetch(`/api/mark/results-submission?exam_session_id=${exam_session_id}`)
          .then((res) => {
            if (!res.ok)
              return res.text().then((error_text) => {
                throw new Error(`请求失败：${res.status} ${res.statusText}` + (error_text ? '-' + error_text : ''));
              });
            return res.json();
          })
          .then((res) => {
            if (!res.status) {
              toast.success('提交成功');
            } else throw new Error(res.msg ?? '提交失败');
          })
          .catch((err) => {
            toast.error(err.message);
          });
      },
    });
  }

  function checkLogs() {}

  function handleSearch() {
    fetch(
      `/api/mark/exam?page=${page}&page_size=${page_size}&exam_name=${exam_name}` +
        (start_time ? `&start_time=${start_time}` : '' + (end_time ? `&end_time=${end_time}` : '')),
    )
      .then((res) => {
        if (!res.ok)
          return res.text().then((error_text) => {
            throw new Error(`请求失败：${res.status} ${res.statusText}` + (error_text ? '-' + error_text : ''));
          });
        return res.json();
      })
      .then((res) => {
        if (!res.status) {
          exam_list = res.data?.exam_list ?? [];
          total_count = res.rowCount ?? 0;

          if (!Array.isArray(exam_list)) {
            exam_list = [];
            throw new Error('exam_list 数据类型错误');
          }
        } else throw new Error(res.msg ?? '获取考试列表失败');
      })
      .catch((err) => {
        toast.error(err.message);
        console.log(err);
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

<div class="exam-correct-body">
  <Title title="考试批改" />

  <div class="options">
    <div class="exam-input">
      <div class="label">考试名称：</div>
      <input type="text" placeholder="请输入信息" bind:value={exam_name} oninput={debounceSearch} class="input" />
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
        onDateConfirm={handleSearch}
        onDateReset={handleSearch}
      />
    </div>
  </div>
  <div class="table">
    <table>
      <thead>
        <tr
          ><th>考试名称</th>
          <th>考试类型</th>
          <th>考试场次</th>
          <th>考试时间</th>
          <th>考试状态</th>
          <th>作答人数</th>
          <th>待批改数</th>
          <th>批阅方式</th>
          <th>批改状态</th>
          <th>操作</th></tr
        >
      </thead>
      <tbody>
        {#each exam_list as exam (exam.id)}
          <tr>
            <td>{exam.name}</td>
            <td>{TYPE_MAP[exam.type] ?? '未知类型'}</td>
            <td
              ><div class="stack">
                {#each exam.exam_sessions as { name }}
                  <span>{name}</span>
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
                {#each exam.exam_sessions as { status }}
                  <span
                    class="status"
                    class:unpublished={status === '00'}
                    class:incoming={status === '02'}
                    class:underway={status === '04'}
                    class:ended={status === '06'}
                    class:marking={status === '08'}
                    class:marked={status === '10'}
                    class:submitted={status === '12'}
                    class:deleted={status === '14'}
                    class:unknown={!STATUS_MAP[status]}>{STATUS_MAP[status] ?? '未知状态'}</span
                  >
                {/each}
              </div></td
            >
            <td
              ><div class="stack">
                {#each exam.exam_sessions as { respondent_count }}
                  <span>{respondent_count}</span>
                {/each}
              </div></td
            >
            <td
              ><div class="stack">
                {#each exam.exam_sessions as { unmarked_student_count }}
                  <span>{unmarked_student_count}</span>
                {/each}
              </div>
            </td>
            <td
              ><div class="stack">
                {#each exam.exam_sessions as { mark_mode }}
                  <span
                    class="mark-mode"
                    class:none={mark_mode === '00'}
                    class:multi={mark_mode === '02'}
                    class:paper={mark_mode === '04'}
                    class:group={mark_mode === '06'}
                    class:question={mark_mode === '08'}
                    class:single={mark_mode === '10'}
                    class:unknown={!MARK_MODE_MAP[mark_mode]}>{MARK_MODE_MAP[mark_mode] ?? '未知状态'}</span
                  >
                {/each}
              </div></td
            >
            <td
              ><div class="stack">
                {#each exam.exam_sessions as { mark_status }}
                  <span
                    class="mark-status"
                    class:normal={mark_status === '00'}
                    class:done={mark_status === '02'}
                    class:deleted={mark_status === '04'}
                    class:unknown={!MARK_STATUS_MAP[mark_status]}>{MARK_STATUS_MAP[mark_status] ?? '未知状态'}</span
                  >
                {/each}
              </div></td
            >
            <td>
              <div class="stack">
                {#each exam.exam_sessions as { id, name, respondent_count, mark_mode, status, mark_status }}
                  <div class="options">
                    <button
                      class:disabled={!canCorrected(mark_mode, status, mark_status) || respondent_count <= 0}
                      disabled={!canCorrected(mark_mode, status, mark_status) || respondent_count <= 0}
                      onclick={() => gotoCorrect(name, id)}>进入批改</button
                    >
                    <!-- <button
                      class:disabled={!canCheckDetail(status, mark_status) || respondent_count <= 0}
                      disabled={!canCheckDetail(status, mark_status) || respondent_count <= 0}
                      onclick={gotoDetail()}>查看详情</button
                    > -->
                    <button
                      class:disabled={!canSubmit(mark_mode, status, mark_status) || respondent_count <= 0}
                      disabled={!canSubmit(mark_mode, status, mark_status) || respondent_count <= 0}
                      onclick={() => submitExamSession(id)}>提交</button
                    >
                    <!-- <button
                      class:disabled={!canCheckLogs(mark_mode, status, mark_status)}
                      disabled={!canCheckLogs(mark_mode, status, mark_status)}
                      onclick={checkLogs()}>查看日志</button
                    > -->
                  </div>
                {/each}
              </div>
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
  button {
    all: unset;
    cursor: pointer;
  }

  .exam-correct-body {
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
      .datePicker {
        display: flex;
        align-items: center;
      }

      .label {
        white-space: nowrap;
        color: rgba(0, 0, 0, 0.6);
        font-size: 14px;
      }
    }

    .table {
      height: 70vh;
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
          color: rgba(0, 0, 0, 0.3);
          background-color: white;
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

                .unknown {
                  color: red;
                }

                span {
                  $status-color: (
                    'unpublished': #999999,
                    'incoming': #ff8100,
                    'underway': #39bb4c,
                    'ended': #787d81,
                    'marking': #c6690b,
                    'marked': #027213,
                    'submitted': #0052d9,
                    'deleted': #d9d9d9,
                  );

                  &.status {
                    @each $name, $color in $status-color {
                      &.#{$name} {
                        color: $color;
                      }
                    }
                  }

                  $mark-mode-color: (
                    'none': #999999,
                    'multi': #1890ff,
                    'paper': #fa541c,
                    'group': #13c2c2,
                    'question': #722ed1,
                    'single': #2f54eb,
                  );

                  &.mark-mode {
                    @each $name, $color in $mark-mode-color {
                      &.#{$name} {
                        color: $color;
                      }
                    }
                  }

                  $mark-status-color: (
                    'normal': #2bcbba,
                    'done': #52c41a,
                    'deleted': #999999,
                  );

                  &.mark-status {
                    @each $name, $color in $mark-status-color {
                      &.#{$name} {
                        color: $color;
                      }
                    }
                  }
                }
              }

              .options {
                display: flex;
                justify-content: center;

                button {
                  &.disabled {
                    color: #ccc;
                    cursor: not-allowed;
                  }

                  &:not(.disabled):hover {
                    font-weight: bold;
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
</style>
