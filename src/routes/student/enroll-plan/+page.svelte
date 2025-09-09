<script>
  import Select from '$lib/components/Select/Select.svelte';
  import Option from '$lib/components/Select/Option.svelte';
  import Empty from '$lib/components/Table/Empty.svelte';
  import Pagination from '$lib/components/Pagination/Pagination.svelte';
  import MessageBox from '$lib/components/MessageBox/MessageBox.svelte';
  import { goto } from '$app/navigation';
  import { onMount } from 'svelte';
  import { sineIn } from 'svelte/easing';

  // 考试科目映射
  const COURSE_MAP = {
    '00': '理论、实操',
    '02': '理论',
    '04': '实操',
  };

  // 考试科目下拉框选项
  let exam_subject = $state(''); // 默认传空，表示全部
  let exam_subject_options = [
    { value: '', label: '全部' },
    ...Object.entries(COURSE_MAP).map(([code, text]) => ({
      value: code,
      label: text,
    })),
  ];

  // 状态码映射
  const STATUS_MAP = {
    '00': '报名中',
    '02': '待审核',
    '04': '通过',
    '06': '不通过',
    '08': '已迁移',
  };

  // 状态筛选选项
  let enroll_status = $state('');
  let status_options = [
    { value: '', label: '全部' },
    ...Object.entries(STATUS_MAP).map(([code, text]) => ({
      value: code,
      label: text,
    })),
  ];

  // 筛选条件
  let input_value = $state('');
  let subject = $state('');
  let current_page = 1;
  let page_size = 10;

  // 模拟报名计划数据
  let signup_list = $state([]);

  // 审核不通过理由
  let rejected_reason = $state('身份证模糊');

  // 是否展示提示框
  let is_show_message_box = $state(false);

  // 总数据数
  let total_count = $state(0);

  // 时间戳转 yyyy-MM-dd HH:mm:ss
  function formatTime(ts) {
    if (!ts) return '—';
    const d = new Date(ts);
    const pad = (n) => String(n).padStart(2, '0');
    return (
      `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ` +
      `${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`
    );
  }

  function getEnrollData(name = '', status = '', course = '') {
    fetch(
      `/api/registration?page=${current_page}&pageSize=${page_size}&name=${name}&status=${status}&course=${course}&search_type=00`,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      },
    )
      .then((response) => {
        if (!response.ok) throw new Error('网络错误');
        return response.json();
      })
      .then((res) => {
        const list = res.data.registers.map((item) => {
          const reg = item.register;
          return {
            id: reg.ID,
            name: reg.Name,
            start: formatTime(reg.StartTime),
            end: formatTime(reg.EndTime),
            people: reg.MaxNumber || '不限',
            subject: COURSE_MAP[reg.Course] || '未知',
            status: STATUS_MAP[item.student.Status] || '未报名',
            type: '正考', // 默认正考
            location: reg.ExamPlanLocation || '—',
          };
        });

        signup_list = list;

        total_count = res.data.total;
      })
      .catch((e) => {
        console.error(e);
      });
  }

  // 分页事件
  function handlePageChange(e) {
    current_page = e.detail;
  }
  function handlePageSizeChange(e) {
    page_size = e.detail;
  }

  // 处理报名按钮点击事件
  function handleEnroll(id) {
    goto(`/student/enroll-plan/${id}`);
  }

  // 处理查看原因按钮点击事件
  function handleSeeReason() {
    is_show_message_box = true;
  }

  function handleComfirmMessageBox() {
    is_show_message_box = false;
  }

  // 处理输入框回调
  function handleInputChange() {
    getEnrollData(input_value);
  }

  // 处理考试科目选择事件
  function handleChangeSubject() {
    getEnrollData(input_value, enroll_status, exam_subject);
  }

  // 处理报名状态选择事件
  function handleChangeStatus() {
    getEnrollData(input_value, enroll_status, exam_subject);
  }

  onMount(() => {
    getEnrollData();
  });
</script>

<svelte:head>
  <title>报名管理 • 3min</title>
</svelte:head>

<div class="signup-body">
  <!-- 筛选框 -->
  <div class="options">
    <div class="signup-input">
      <div class="label">计划名称：</div>
      <input
        type="text"
        placeholder="计划名称 / 知识点"
        bind:value={input_value}
        class="input"
        oninput={handleInputChange}
      />
    </div>

    <div class="select">
      <div class="label">考试科目：</div>
      <Select bind:value={exam_subject} filterable changeValue={handleChangeSubject}>
        {#each exam_subject_options as option}
          <Option value={option.value} label={option.label}></Option>
        {/each}
      </Select>
    </div>

    <div class="select">
      <div class="label">报名状态：</div>
      <Select bind:value={enroll_status} changeValue={handleChangeStatus}>
        {#each status_options as option}
          <Option value={option.value} label={option.label} />
        {/each}
      </Select>
    </div>
  </div>

  <!-- 报名列表 -->
  <div class="signup-show">
    <div class="table">
      <table>
        <thead>
          <tr>
            <th style="width: 10%">报名计划名称</th>
            <th style="width: 25%">开始时间-结束时间</th>
            <th style="width: 10%">计划人数</th>
            <th style="width: 10%">考试科目</th>
            <th style="width: 10%">考试类型</th>
            <th style="width: 10%">考试地点</th>
            <th style="width: 10%">报名状态</th>
            <th style="width: 15%">操作</th>
          </tr>
        </thead>
        <tbody>
          {#each signup_list as item}
            <tr>
              <td>{item.name}</td>
              <td>{item.start} ~ {item.end}</td>
              <td>{item.people}</td>
              <td>{item.subject}</td>
              <td>{item.type}</td>
              <td>{item.location}</td>

              <!-- 报名状态样式 -->
              <td>
                <span
                  class:status-gray={item.status === '未报名' || item.status === '已迁移'}
                  class:status-blue={item.status === '报名中' || item.status === '待审核'}
                  class:status-green={item.status === '通过'}
                  class:status-red={item.status === '不通过'}
                >
                  {item.status}
                </span>
              </td>

              <!-- 操作按钮 -->
              <td>
                {#if item.status === '未报名'}
                  <button class="option blue" onclick={() => handleEnroll(item.id)}>开始报名</button>
                {:else if item.status === '报名中'}
                  <button class="option blue" onclick={() => handleEnroll(item.id)}>继续报名</button>
                {:else if item.status === '待审核'}
                  <button class="option blue" onclick={() => handleEnroll(item.id)}>查看报名信息</button>
                {:else if item.status === '通过'}
                  <button class="option blue">请到达考试列表等待考试开始</button>
                {:else if item.status === '不通过'}
                  <button class="option blue" onclick={() => handleEnroll(item.id)}>重新提交</button>
                  <button class="option red" onclick={() => handleSeeReason()}>查看原因</button>
                {:else if item.status === '报名未开始' || item.status === '报名已结束'}
                  <span class="option gray">--</span>
                {:else}
                  --
                {/if}
              </td>
            </tr>
          {/each}
        </tbody>
      </table>

      {#if signup_list.length === 0}
        <div class="empty">
          <Empty text="暂无报名数据" />
        </div>
      {/if}
    </div>
  </div>
</div>

<div class="pagination">
  <Pagination total_items={total_count} on:pageChange={handlePageChange} on:pageSizeChange={handlePageSizeChange} />
</div>

<!-- 消息提示框 -->
<MessageBox
  visible={is_show_message_box}
  title={'不通过原因'}
  content={rejected_reason}
  show_cancel_button={false}
  show_cancel_icon={false}
  confirm_text="确定"
  onConfirm={handleComfirmMessageBox}
></MessageBox>

<style lang="scss">
  .signup-body {
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

      .signup-input,
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

    .signup-show {
      display: flex;
      flex-direction: column;
      gap: 1rem;
    }

    .table {
      height: 55vh;
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
              padding: 0.5rem;

              /* 报名状态颜色 */
              .status-gray {
                color: gray;
              }
              .status-blue {
                color: blue;
              }
              .status-green {
                color: green;
              }
              .status-red {
                color: red;
              }

              /* 操作按钮样式 */
              .option {
                all: unset;
                padding: 0 0.3rem;

                &.blue {
                  color: blue;
                  cursor: pointer;

                  &:hover {
                    font-weight: bold;
                  }
                }

                &.red {
                  color: red;
                  cursor: pointer;

                  &:hover {
                    font-weight: bold;
                  }
                }

                &.gray {
                  color: gray;
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

  .input {
    border: 1px solid #dcdfe6; /* 默认灰色边框 */
    border-radius: 4px;
    padding: 6px 10px;
    outline: none; /* 去掉默认 outline */
    transition: border-color 0.2s;
  }

  .input:focus {
    border-color: #409eff; /* 聚焦时边框变蓝 */
  }
</style>
