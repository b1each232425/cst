<script>
  import Pagination from '$lib/components/Pagination/Pagination.svelte';
  import InputBox from '$lib/components/Input/InputBox.svelte';
  import Button from '$lib/components/Button/Button.svelte';
  import Empty from '$lib/components/Table/Empty.svelte';
  import MessageBox from '$lib/components/MessageBox/MessageBox.svelte';
  import { onMount } from 'svelte';
  import { formatDateTime } from '../_utils/handleFileInput';

  // 考试科目映射
  const COURSE_MAP = {
    '00': '理论、实操',
    '02': '理论',
    '04': '实操',
  };

  // 计划状态映射
  const STATUS_MAP = {
    '00': '已发布',
    '02': '未发布',
    '04': '已结束',
    '06': '审核截止',
    '08': '已作废',
    '12': '已取消',
  };

  let { person_list = [], is_show_move_panel = false, from_enroll_id = 0, closePanel = () => {} } = $props();
  let search_keyword = $state(''); // 搜索关键词

  // 模拟数据
  let candidate_list = $state([]);

  let current_page = $state(1); // 当前页数
  let page_size = $state(10); // 当前页面大小
  let total_items = $state(0); //数据总数

  let to_enroll_id = $state(0); // 迁移目标计划id
  let enroll_status = $state(''); // 当前计划状态

  // 消息提示框数据
  let is_show_messagebox = $state(false);
  let messagebox_title = $state('');
  let messagebox_content = $state('');

  // 获取报名列表数据
  function getEnrollData(name = '', status = '', course = '') {
    fetch(
      `/api/registration?page=${current_page}&pageSize=${page_size}&name=${name}&status=${status}&course=${course}`,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      },
    )
      .then((response) => {
        if (!response.ok) {
          throw new Error('网络错误');
        }
        return response.json();
      })
      .then((data) => {
        // 处理数据
        candidate_list = data.data.registers.map((item) => {
          const r = item.register;
          return {
            ...item,
            register: {
              ...r,
              CourseText: COURSE_MAP[r.Course] || r.Course,
              StatusText: STATUS_MAP[r.Status] || r.Status,
              ReviewEndTimeText: formatDateTime(r.ReviewEndTime),
              StartTimeText: formatDateTime(r.StartTime),
              EndTimeText: formatDateTime(r.EndTime),
            },
          };
        });

        total_items = data.data.total;
      })
      .catch((e) => {
        console.log(e);
      });
  }

  // 迁移计划
  function moveEnrollPlan() {
    // 构造请求体
    const payload = {
      from_register_id: from_enroll_id,
      to_register_id: to_enroll_id,
      status: enroll_status,
      student: person_list.map((person) => ({
        student_id: person.id,
        exam_type: person.examType === '正考' ? '00' : person.examType === '补考' ? '02' : '',
      })),
    };

    fetch('/api/registrationStudent', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ action: 'move', data: payload }),
    })
      .then((response) => {
        if (!response.ok) {
          throw new Error('网络错误');
        }
        return response.json();
      })
      .then((data) => {
        if (data.status !== 0) {
          toast.error('迁移失败，请重试');
        } else {
          toast.success('迁移成功');
          closePanel();
        }
      })
      .catch((e) => {
        console.log(e);
      });
  }

  // 父组件控制分页器的行为
  function handlePageChange(event) {
    current_page = event.detail;
    getEnrollData();
  }

  function handlePageSizeChange(event) {
    page_size = event.detail;
  }

  // 迁移按钮点击事件
  function handleMove(row) {
    to_enroll_id = row.register.ID;
    enroll_status = row.register.Status;
    messagebox_title = '确认迁移';
    messagebox_content = '你确定要继续迁移吗？';
    is_show_messagebox = true;
  }

  // ---------- 确认/取消 ----------
  function handleMessageBoxConfirm() {
    moveEnrollPlan();
    messagebox_title = '';
    messagebox_content = '';
    is_show_messagebox = false;
  }

  function handleMessageBoxCancel() {
    messagebox_title = '';
    messagebox_content = '';
    is_show_messagebox = false;
  }

  onMount(() => {
    getEnrollData();
  });
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
                  <td>{c.register.Name}</td>
                  <td>{c.register.CourseText}</td>
                  <td>{c.studentCount}/{c.register.MaxNumber ? c.register.MaxNumber : '不限'}</td>
                  <td>{c.register.ReviewEndTimeText}</td>
                  <td>{c.register.StartTimeText} ~ {c.register.EndTimeText}</td>
                  <td>
                    {#if c.practiceName}
                      {c.practiceName}
                    {:else}
                      --
                    {/if}
                  </td>
                  <td>
                    <span
                      class="Status-tag {c.register.StatusText === '已发布'
                        ? 'published'
                        : c.register.StatusText === '未发布'
                          ? 'unpublished'
                          : 'invalidated'}"
                    >
                      {c.register.StatusText}
                    </span>
                  </td>
                  <td>
                    {#if c.register.ID === from_enroll_id}
                      --
                    {:else}
                      <button onclick={() => handleMove(c)}>选择</button>
                    {/if}
                  </td>
                </tr>
              {/each}
            {/if}
          </tbody>
        </table>
      </div>

      <div class="move-list-pagination">
        <Pagination {total_items} on:pageChange={handlePageChange} on:pageSizeChange={handlePageSizeChange} />
      </div>
    </div>

    <div class="move-list-footer">
      <Button type="primary" plain onclick={closePanel}>取消</Button>
      <Button type="primary">确认迁移</Button>
    </div>
  </div>
</div>

<!-- 消息提示框 -->
<MessageBox
  visible={is_show_messagebox}
  title={messagebox_title}
  content={messagebox_content}
  onConfirm={handleMessageBoxConfirm}
  onCancel={handleMessageBoxCancel}
></MessageBox>

<style lang="scss" scoped>
  .move-list-container {
    position: fixed;
    inset: 0;
    background: rgba(0, 0, 0, 0.25);
    display: flex;
    justify-content: center;
    align-items: center;
    z-index: 999;

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
