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

  // 场次状态映射
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

  let date_picker = null;

  let exam_list = $state([]);

  let page = $state(1);
  let page_size = $state(10);
  let exam_session_name = $state('');
  let start_time = $state(0);
  let end_time = $state(0);
  let exam_status = $state('');
  let total_count = $state(0);
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
          <th>考试场次</th>
          <th>考点</th>
          <th>考场</th>
          <th>考试时间</th>
          <th>考试状态</th>
          <th>考生人数</th>
          <th>操作</th>
        </tr>
      </thead>
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
                    'incoming': var(--orange),
                    'underway': var(--green),
                    'ended': var(--gray),
                    'marking': #c6690b,
                    'marked': #027213,
                    'submitted': #0052d9,
                    'deleted': var(--red),
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
                    'single': black,
                  );

                  &.mark-mode {
                    @each $name, $color in $mark-mode-color {
                      &.#{$name} {
                        color: $color;
                      }
                    }
                  }

                  $mark-status-color: (
                    'normal': var(--green),
                    'done': var(--gray),
                    'deleted': var(--red),
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
                color: #2f54eb;

                button {
                  &.disabled {
                    color: #ccc;
                    cursor: not-allowed;
                    border: 0;
                  }

                  &:not(.disabled):hover {
                    font-weight: bold;
                  }

                  &:not(.disabled) {
                    border-bottom: 1px solid #2f54eb;
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
