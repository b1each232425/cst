<script>
  import Select from '$lib/components/Select/Select.svelte';
  import Option from '$lib/components/Select/Option.svelte';
  import Empty from '$lib/components/Table/Empty.svelte';
  import Pagination from '$lib/components/Pagination/Pagination.svelte';
  import MessageBox from '$lib/components/MessageBox/MessageBox.svelte';
  import { goto } from '$app/navigation';

  // 考试科目映射
  const SUBJECT_MAP = {
    '': '全部',
    theory: '理论',
    practice: '实操',
  };

  // 报名状态映射
  const STATUS_MAP = {
    '': '全部',
    registering: '报名中',
    pending: '待审核',
    not_registered: '未报名',
    rejected: '审核不通过',
    not_started: '报名未开始',
    ended: '报名已结束',
    approved: '审核通过待考试',
  };

  // 筛选条件
  let signup_name = $state('');
  let subject = $state('');
  let status = $state('');
  let page = 1;
  let page_size = 10;

  // 模拟报名计划数据
  let signup_list = [
    {
      id: 1,
      name: '2025年上半年技能提升计划',
      start: '2025-03-01 00:00:00',
      end: '2025-05-01 00:00:00',
      people: 50,
      subject: '理论',
      type: '统一考试',
      status: '报名中',
    },
    {
      id: 2,
      name: '2025年电工实操考核',
      start: '2025-04-15 00:00:00',
      end: '2025-06-01 00:00:00',
      people: 30,
      subject: '实操',
      type: '统一考试',
      status: '审核通过待考试',
    },
    {
      id: 3,
      name: '安全法规理论培训',
      start: '2025-02-01 00:00:00',
      end: '2025-02-28 00:00:00',
      people: 80,
      subject: '理论',
      type: '培训考核',
      status: '待审核',
    },
    {
      id: 4,
      name: '2025年高压电工进阶班',
      start: '2025-01-10 00:00:00',
      end: '2025-03-10 00:00:00',
      people: 40,
      subject: '实操',
      type: '统一考试',
      status: '未报名',
    },
    {
      id: 5,
      name: '2025年安全生产考核',
      start: '2025-07-01 00:00:00',
      end: '2025-08-01 00:00:00',
      people: 100,
      subject: '理论',
      type: '统一考试',
      status: '审核不通过',
    },
    {
      id: 6,
      name: '2025年机械操作培训',
      start: '2025-09-01 00:00:00',
      end: '2025-10-01 00:00:00',
      people: 60,
      subject: '实操',
      type: '培训考核',
      status: '报名未开始',
    },
    {
      id: 7,
      name: '2025年特种设备安全考核',
      start: '2025-03-01 00:00:00',
      end: '2025-03-15 00:00:00',
      people: 25,
      subject: '理论',
      type: '统一考试',
      status: '报名已结束',
    },
  ];

  // 审核不通过理由
  let rejected_reason = $state('身份证模糊');

  // 是否展示提示框
  let is_show_message_box = $state(false);

  // 总数据数
  let total_count = signup_list.length;

  // 分页事件（这里只是示例）
  function handlePageChange(e) {
    page = e.detail;
  }
  function handlePageSizeChange(e) {
    page_size = e.detail;
  }

  // 处理报名按钮点击事件
  function handleEnroll() {
    goto('/student/enroll-plan/enroll-message');
  }

  // 处理查看原因按钮点击事件
  function handleSeeReason() {
    is_show_message_box = true;
  }

  function handleComfirmMessageBox() {
    is_show_message_box = false;
  }
</script>

<svelte:head>
  <title>报名管理 • 3min</title>
</svelte:head>

<div class="signup-body">
  <!-- 筛选框 -->
  <div class="options">
    <div class="signup-input">
      <div class="label">计划名称：</div>
      <input type="text" placeholder="计划名称 / 知识点" bind:value={signup_name} class="input" />
    </div>

    <div class="select">
      <div class="label">考试科目：</div>
      <Select bind:value={subject}>
        {#each Object.entries(SUBJECT_MAP) as [key, val]}
          <Option value={key} label={val} />
        {/each}
      </Select>
    </div>

    <div class="select">
      <div class="label">报名状态：</div>
      <Select bind:value={status}>
        {#each Object.entries(STATUS_MAP) as [key, val]}
          <Option value={key} label={val} />
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
            <th>报名计划名称</th>
            <th>开始时间-结束时间</th>
            <th>计划人数</th>
            <th>考试科目</th>
            <th>考试类型</th>
            <th>报名状态</th>
            <th>操作</th>
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

              <!-- 报名状态样式 -->
              <td>
                <span
                  class:status-gray={item.status === '未报名' || item.status === '报名已结束'}
                  class:status-blue={item.status === '报名中' ||
                    item.status === '待审核' ||
                    item.status === '报名未开始'}
                  class:status-green={item.status === '审核通过待考试'}
                  class:status-red={item.status === '审核不通过'}
                >
                  {item.status}
                </span>
              </td>

              <!-- 操作按钮 -->
              <td>
                {#if item.status === '未报名'}
                  <button class="option blue" onclick={handleEnroll}>开始报名</button>
                {:else if item.status === '报名中'}
                  <button class="option blue" onclick={handleEnroll}>继续报名</button>
                {:else if item.status === '待审核'}
                  <button class="option blue" onclick={handleEnroll}>查看报名信息</button>
                {:else if item.status === '审核通过待考试'}
                  <button class="option blue">请到达考试列表等待考试开始</button>
                {:else if item.status === '审核不通过'}
                  <button class="option blue" onclick={handleEnroll}>重新提交</button>
                  <button class="option red" onclick={handleSeeReason}>查看原因</button>
                {:else if item.status === '报名未开始' || item.status === '报名已结束'}
                  <span class="option gray">----</span>
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
</style>
