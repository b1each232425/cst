<script>
  import Pagination from '$lib/components/Pagination/Pagination.svelte';
  import InputBox from '$lib/components/Input/InputBox.svelte';
  import Button from '$lib/components/Button/Button.svelte';
  import Empty from '$lib/components/Table/Empty.svelte';
  import { onMount } from 'svelte';

  let { is_show_move_panel = false, closePanel = () => {} } = $props();
  let search_keyword = $state(''); // 搜索关键词

  // 模拟数据
  let candidate_list = $state([
    {
      name: 'H3C考证',
      subject: '数学',
      current: 50,
      plan: 60,
      review_deadline: '2025-09-01',
      start_time: '2025-09-05',
      end_time: '2025-09-10',
      practice_binding: '',
      status: '已发布',
    },
    {
      name: '英语四级',
      subject: '英语',
      current: 60,
      plan: 60,
      review_deadline: '2025-08-20',
      start_time: '2025-08-22',
      end_time: '2025-08-30',
      practice_binding: '',
      status: '未发布',
    },
    {
      name: 'H3C考证',
      subject: '数学',
      current: 50,
      plan: 60,
      review_deadline: '2025-09-01',
      start_time: '2025-09-05',
      end_time: '2025-09-10',
      practice_binding: '',
      status: '已发布',
    },
    {
      name: '英语四级',
      subject: '英语',
      current: 60,
      plan: 60,
      review_deadline: '2025-08-20',
      start_time: '2025-08-22',
      end_time: '2025-08-30',
      practice_binding: '',
      status: '未发布',
    },
    {
      name: 'H3C考证',
      subject: '数学',
      current: 50,
      plan: 60,
      review_deadline: '2025-09-01',
      start_time: '2025-09-05',
      end_time: '2025-09-10',
      practice_binding: '',
      status: '已发布',
    },
    {
      name: '英语四级',
      subject: '英语',
      current: 60,
      plan: 60,
      review_deadline: '2025-08-20',
      start_time: '2025-08-22',
      end_time: '2025-08-30',
      practice_binding: '',
      status: '未发布',
    },
    {
      name: 'H3C考证',
      subject: '数学',
      current: 50,
      plan: 60,
      review_deadline: '2025-09-01',
      start_time: '2025-09-05',
      end_time: '2025-09-10',
      practice_binding: '',
      status: '已发布',
    },
    {
      name: '英语四级',
      subject: '英语',
      current: 60,
      plan: 60,
      review_deadline: '2025-08-20',
      start_time: '2025-08-22',
      end_time: '2025-08-30',
      practice_binding: '',
      status: '未发布',
    },
    {
      name: 'H3C考证',
      subject: '数学',
      current: 50,
      plan: 60,
      review_deadline: '2025-09-01',
      start_time: '2025-09-05',
      end_time: '2025-09-10',
      practice_binding: '',
      status: '已发布',
    },
    {
      name: '英语四级',
      subject: '英语',
      current: 60,
      plan: 60,
      review_deadline: '2025-08-20',
      start_time: '2025-08-22',
      end_time: '2025-08-30',
      practice_binding: '',
      status: '未发布',
    },
    {
      name: 'H3C考证',
      subject: '数学',
      current: 50,
      plan: 60,
      review_deadline: '2025-09-01',
      start_time: '2025-09-05',
      end_time: '2025-09-10',
      practice_binding: '',
      status: '已发布',
    },
    {
      name: '英语四级',
      subject: '英语',
      current: 60,
      plan: 60,
      review_deadline: '2025-08-20',
      start_time: '2025-08-22',
      end_time: '2025-08-30',
      practice_binding: '',
      status: '未发布',
    },
    {
      name: 'H3C考证',
      subject: '数学',
      current: 50,
      plan: 60,
      review_deadline: '2025-09-01',
      start_time: '2025-09-05',
      end_time: '2025-09-10',
      practice_binding: '',
      status: '已发布',
    },
    {
      name: '英语四级',
      subject: '英语',
      current: 60,
      plan: 60,
      review_deadline: '2025-08-20',
      start_time: '2025-08-22',
      end_time: '2025-08-30',
      practice_binding: '',
      status: '未发布',
    },
    {
      name: 'H3C考证',
      subject: '数学',
      current: 50,
      plan: 60,
      review_deadline: '2025-09-01',
      start_time: '2025-09-05',
      end_time: '2025-09-10',
      practice_binding: '',
      status: '已发布',
    },
    {
      name: '英语四级',
      subject: '英语',
      current: 60,
      plan: 60,
      review_deadline: '2025-08-20',
      start_time: '2025-08-22',
      end_time: '2025-08-30',
      practice_binding: '',
      status: '未发布',
    },
  ]);

  // 迁移按钮点击事件
  function handleMove(row) {
    alert(`迁移 ${row.name}`);
  }
</script>

<div class={is_show_move_panel ? 'move-list-container' : 'hide'}>
  <div class="move-list-panel">
    <div class="move-list-header">
      <span>迁移列表</span>
      <button class="close-btn" onclick={closePanel}>×</button>
    </div>

    <div class="move-list-body">
      <div class="search-bar">
        <InputBox placeholder="请输入关键词" type="text" bind:value={search_keyword} show_label={false} />
      </div>

      <div class="move-list-table">
        <table>
          <thead>
            <tr>
              <th>名称</th>
              <th>考试科目</th>
              <th>当前人数/计划人数</th>
              <th>审核截止时间</th>
              <th>开始时间 ~ 结束时间</th>
              <th>绑定练习</th>
              <th>状态</th>
              <th>操作</th>
            </tr>
          </thead>
          <tbody>
            {#if candidate_list.length === 0}
              <tr>
                <td colspan="8"><Empty text="暂无迁移数据" /></td>
              </tr>
            {:else}
              {#each candidate_list as c}
                <tr>
                  <td>{c.name}</td>
                  <td>{c.subject}</td>
                  <td>{c.current}/{c.plan}</td>
                  <td>{c.review_deadline}</td>
                  <td>{c.start_time} ~ {c.end_time}</td>
                  <td>
                    {#if c.practice_binding}
                      {c.practice_binding}
                    {:else}
                      --
                    {/if}
                  </td>
                  <td>
                    <span
                      class="Status-tag {c.status === '已发布'
                        ? 'published'
                        : c.status === '未发布'
                          ? 'unpublished'
                          : 'invalidated'}"
                    >
                      {c.status}
                    </span>
                  </td>
                  <td>
                    <button onclick={() => handleMove(c)}>选择</button>
                  </td>
                </tr>
              {/each}
            {/if}
          </tbody>
        </table>
      </div>

      <div class="move-list-pagination">
        <Pagination />
      </div>
    </div>

    <div class="move-list-footer">
      <Button type="primary" plain onclick={closePanel}>取消</Button>
      <Button type="primary">确认迁移</Button>
    </div>
  </div>
</div>

<style lang="scss" scoped>
  .move-list-container {
    position: fixed;
    inset: 0;
    background: rgba(0, 0, 0, 0.25);
    display: flex;
    justify-content: center;
    align-items: center;
    z-index: 9999;

    .move-list-panel {
      width: 1200px;
      height: 700px;
      max-height: 90vh;
      background: #fff;
      border-radius: 12px;
      display: flex;
      flex-direction: column;
      overflow: hidden;

      .move-list-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 20px;
        font-size: 20px;
        font-weight: bold;
        border-bottom: 1px solid #eee;

        .close-btn {
          background: none;
          border: none;
          font-size: 24px;
          width: 32px;
          height: 32px;
          text-align: center;
          color: #666;
          cursor: pointer;
          transition: color 0.2s;
          padding: 4px;
          border-radius: 4px;
          display: flex;
          align-items: center;
          justify-content: center;

          &:hover {
            color: #ff4d4f;
            background: rgba(0, 0, 0, 0.04);
          }
        }
      }

      .move-list-body {
        padding: 16px;
        flex: 1;
        display: flex;
        flex-direction: column;

        .search-bar {
          margin-bottom: 12px;
          width: 300px;
        }

        .move-list-table {
          margin-top: 10px;
          flex: 1; // 占据剩余空间
          min-height: 200px;
          max-height: 420px;
          overflow-y: auto; // 只滚动数据部分
          border: 1px solid #f0f0f0;
          border-radius: 6px;

          table {
            width: 100%;
            border-collapse: collapse;

            th,
            td {
              height: 40px;
              font-size: 14px;
              color: rgb(51, 51, 51);
              border: none;
              text-align: center;
              height: 40px;
              box-sizing: border-box;
              padding: 8px 8px;
              vertical-align: middle;
            }

            th {
              position: sticky; // 表头固定
              top: 0;
              background: #fafafa;
              color: rgba(0, 0, 0, 0.3);
              z-index: 2;
            }

            td {
              color: #222;
              border-bottom: 1px solid #e0e0e0;

              .Status-tag {
                display: inline-block;
                padding: 2px 8px;
                border-radius: 8px;
                font-size: 12px;

                &.published {
                  background-color: #70b603;
                  color: #ffffff;
                }

                &.unpublished {
                  background-color: #689bff;
                  color: #ffffff;
                }

                &.invalidated {
                  background-color: #919191;
                  color: #ffffff;
                }
              }
            }

            button {
              border: none;
              background: transparent;
              color: #0052d9;
              cursor: pointer;
              margin: 0 4px;

              &:hover {
                font-weight: bold;
              }
            }
          }
        }

        .move-list-pagination {
          margin-top: 8px;
          display: flex;
          justify-content: flex-end;
        }
      }

      .move-list-footer {
        display: flex;
        justify-content: flex-end;
        gap: 16px;
        padding: 12px 24px;
        border-top: 1px solid #eee;
      }
    }
  }

  .hide {
    display: none;
  }
</style>
