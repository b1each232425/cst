<script>
  import Select from '$lib/components/Select/Select.svelte';
  import Option from '$lib/components/Select/Option.svelte';
  import Empty from '$lib/components/Table/Empty.svelte';
  import Pagination from '$lib/components/Pagination/Pagination.svelte';

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
    approved: '审核通过待考试',
    rejected: '审核不通过',
    pending: '待审核',
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
      start: '2025-03-01',
      end: '2025-05-01',
      people: 50,
      subject: '理论',
      type: '统一考试',
      status: '报名中',
    },
    {
      id: 2,
      name: '2025年电工实操考核',
      start: '2025-04-15',
      end: '2025-06-01',
      people: 30,
      subject: '实操',
      type: '统一考试',
      status: '审核通过待考试',
    },
    {
      id: 3,
      name: '安全法规理论培训',
      start: '2025-02-01',
      end: '2025-02-28',
      people: 80,
      subject: '理论',
      type: '培训考核',
      status: '待审核',
    },
  ];

  // 总数据数
  let total_count = signup_list.length;

  // 分页事件（这里只是示例）
  function handlePageChange(e) {
    page = e.detail;
  }
  function handlePageSizeChange(e) {
    page_size = e.detail;
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
              <td>{item.status}</td>
              <td>
                <button class="option can-click">查看详情</button>
                <button class="option can-click">取消报名</button>
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

              .option {
                all: unset;
                color: blue;
                padding: 0 0.3rem;

                &.can-click:hover {
                  cursor: pointer;
                  font-weight: bold;
                }

                &.error {
                  color: red;
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
