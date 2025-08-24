<script>
  import Title from '$lib/components/Title/Title.svelte';
  import InputBox from '$lib/components/Input/InputBox.svelte';
  import Empty from '$lib/components/Table/Empty.svelte';
  import Pagination from '$lib/components/Pagination/Pagination.svelte';
  import Select from '$lib/components/Select/Select.svelte';
  import Option from '$lib/components/Select/Option.svelte';
  import MessageBox from '$lib/components/MessageBox/MessageBox.svelte';
  import { isTemplateMiddle } from 'typescript';
  import { goto } from '$app/navigation';

  // 模拟数据
  let enrollList = [
    {
      id: 1,
      name: '2025年春季考试报名',
      subject: '数学',
      currentNum: 35,
      planNum: 50,
      auditDeadline: '2025-03-15 00:00:00',
      duration: '2025-04-01 00:00:00 ~ 2025-04-10 00:00:00',
      practice: '模拟练习一',
      status: '已发布',
    },
    {
      id: 2,
      name: '2025年英语四级报名',
      subject: '英语',
      currentNum: 120,
      planNum: 150,
      auditDeadline: '2025-05-20 00:00:00',
      duration: '2025-06-01 00:00:00 ~ 2025-06-02 00:00:00',
      practice: '英语专项训练',
      status: '未发布',
    },
    {
      id: 3,
      name: '2024年英语六级报名',
      subject: '英语',
      currentNum: 120,
      planNum: 150,
      auditDeadline: '2025-05-20 00:00:00',
      duration: '2024-06-01 00:00:00 ~ 2024-06-02 00:00:00',
      practice: '英语专项训练',
      status: '已作废',
    },
    {
      id: 4,
      name: '2024年英语六级报名',
      subject: '英语',
      currentNum: 120,
      planNum: 150,
      auditDeadline: '2025-05-20 00:00:00',
      duration: '2024-06-01 00:00:00 ~ 2024-06-02 00:00:00',
      practice: '英语专项训练',
      status: '审核截止',
    },
    {
      id: 1,
      name: '2025年春季考试报名',
      subject: '数学',
      currentNum: 35,
      planNum: 50,
      auditDeadline: '2025-03-15 00:00:00',
      duration: '2025-04-01 00:00:00 ~ 2025-04-10 00:00:00',
      practice: '模拟练习一',
      status: '已发布',
    },
    {
      id: 2,
      name: '2025年英语四级报名',
      subject: '英语',
      currentNum: 120,
      planNum: 150,
      auditDeadline: '2025-05-20 00:00:00',
      duration: '2025-06-01 00:00:00 ~ 2025-06-02 00:00:00',
      practice: '英语专项训练',
      status: '未发布',
    },
    {
      id: 3,
      name: '2024年英语六级报名',
      subject: '英语',
      currentNum: 120,
      planNum: 150,
      auditDeadline: '2025-05-20 00:00:00',
      duration: '2024-06-01 00:00:00 ~ 2024-06-02 00:00:00',
      practice: '英语专项训练',
      status: '已作废',
    },
    {
      id: 4,
      name: '2024年英语六级报名',
      subject: '英语',
      currentNum: 120,
      planNum: 150,
      auditDeadline: '2025-05-20 00:00:00',
      duration: '2024-06-01 00:00:00 ~ 2024-06-02 00:00:00',
      practice: '英语专项训练',
      status: '审核截止',
    },
    {
      id: 1,
      name: '2025年春季考试报名',
      subject: '数学',
      currentNum: 35,
      planNum: 50,
      auditDeadline: '2025-03-15 00:00:00',
      duration: '2025-04-01 00:00:00 ~ 2025-04-10 00:00:00',
      practice: '模拟练习一',
      status: '已发布',
    },
    {
      id: 2,
      name: '2025年英语四级报名',
      subject: '英语',
      currentNum: 120,
      planNum: 150,
      auditDeadline: '2025-05-20 00:00:00',
      duration: '2025-06-01 00:00:00 ~ 2025-06-02 00:00:00',
      practice: '英语专项训练',
      status: '未发布',
    },
    {
      id: 3,
      name: '2024年英语六级报名',
      subject: '英语',
      currentNum: 120,
      planNum: 150,
      auditDeadline: '2025-05-20 00:00:00',
      duration: '2024-06-01 00:00:00 ~ 2024-06-02 00:00:00',
      practice: '英语专项训练',
      status: '已作废',
    },
    {
      id: 4,
      name: '2024年英语六级报名',
      subject: '英语',
      currentNum: 120,
      planNum: 150,
      auditDeadline: '2025-05-20 00:00:00',
      duration: '2024-06-01 00:00:00 ~ 2024-06-02 00:00:00',
      practice: '英语专项训练',
      status: '审核截止',
    },
    {
      id: 1,
      name: '2025年春季考试报名',
      subject: '数学',
      currentNum: 35,
      planNum: 50,
      auditDeadline: '2025-03-15 00:00:00',
      duration: '2025-04-01 00:00:00 ~ 2025-04-10 00:00:00',
      practice: '模拟练习一',
      status: '已发布',
    },
    {
      id: 2,
      name: '2025年英语四级报名',
      subject: '英语',
      currentNum: 120,
      planNum: 150,
      auditDeadline: '2025-05-20 00:00:00',
      duration: '2025-06-01 00:00:00 ~ 2025-06-02 00:00:00',
      practice: '英语专项训练',
      status: '未发布',
    },
    {
      id: 3,
      name: '2024年英语六级报名',
      subject: '英语',
      currentNum: 120,
      planNum: 150,
      auditDeadline: '2025-05-20 00:00:00',
      duration: '2024-06-01 00:00:00 ~ 2024-06-02 00:00:00',
      practice: '英语专项训练',
      status: '已作废',
    },
    {
      id: 4,
      name: '2024年英语六级报名',
      subject: '英语',
      currentNum: 120,
      planNum: 150,
      auditDeadline: '2025-05-20 00:00:00',
      duration: '2024-06-01 00:00:00 ~ 2024-06-02 00:00:00',
      practice: '英语专项训练',
      status: '审核截止',
    },
  ];

  // 计划状态
  let plan_status = $state('全部');
  let plan_status_options = ['全部', '发布', '未发布', '作废'];

  // 考试科目
  let exam_subject = $state('全部');
  let exam_subject_options = ['全部', '理论', '实操'];

  // 消息提示框数据
  let is_show_messagebox = $state(false);
  let messagebox_title = $state('');
  let messagebox_content = $state('');

  // 处理创建报名计划按钮点击事件
  function handleNewEnroll() {
    goto('/teacher/enroll/add-enroll');
  }

  // 处理编辑按钮点击事件
  function handleEdit(id) {
    goto(`/teacher/enroll/edit-enroll/${id}`);
  }

  // 处理查看考试按钮点击事件
  function handleSeeStudent(id) {
    goto(`/teacher/enroll/see-enroll/${id}`);
  }

  // 处理消息提示框按确定钮点击事件
  function handleMessageBoxConfirm() {
    is_show_messagebox = false;
  }

  // 处理消息提示框取消按钮点击事件
  function handleMessageBoxCancel() {
    messagebox_title = '';
    messagebox_content = '';
    is_show_messagebox = false;
  }

  // 处理表格发布按钮点击事件
  function handlePublic() {
    messagebox_title = '确认发布';
    messagebox_content = '发布后，所有用户都可看到此报名计划，确定要继续吗？';
    is_show_messagebox = true;
  }

  // 处理表格删除按钮点击事件
  function handleDelete() {
    messagebox_title = '确认删除';
    messagebox_content = '删除后，该条数据会永久消失，确定要继续删除吗？';
    is_show_messagebox = true;
  }

  // 处理表格作废按钮点击事件
  function handleRepeal() {
    messagebox_title = '确认作废';
    messagebox_content = '删作废，该条数据会被作废，确定要继续作废吗？';
    is_show_messagebox = true;
  }
</script>

<div class="enroll-management">
  <Title title="报名列表" />

  <div class="table-action-container">
    <div class="search-and-add-button-container">
      <div class="search-bar">
        <div class="search-box">
          <InputBox label="计划名称" type="text" placeholder="请输入关键词" />
        </div>

        <div class="filter-box">
          <span class="filter-label">计划状态</span>
          <div class="dropdown-wrapper">
            <Select bind:value={plan_status} filterable>
              {#each plan_status_options as option}
                <Option value={option} label={option}></Option>
              {/each}
            </Select>
          </div>
        </div>

        <div class="filter-box">
          <span class="filter-label">考试科目</span>
          <div class="dropdown-wrapper">
            <Select bind:value={exam_subject} filterable>
              {#each exam_subject_options as option}
                <Option value={option} label={option}></Option>
              {/each}
            </Select>
          </div>
        </div>
      </div>

      <div>
        <button onclick={handleNewEnroll} class="new-enroll-btn">新增</button>
        <button class="delete-enroll-btn">删除</button>
        <button class="invalid-enroll-btn">作废</button>
      </div>
    </div>

    <div class="enroll-table">
      <table>
        <thead>
          <tr>
            <th style="width: 6%">
              <input type="checkbox" class="checkbox" />
            </th>
            <th style="width: 12%">名称</th>
            <th style="width: 10%">考试科目</th>
            <th style="width: 10%">当前人数/计划人数</th>
            <th style="width: 14%">审核截止时间</th>
            <th style="width: 12%">开始时间 ~ 结束时间</th>
            <th style="width: 12%">绑定练习</th>
            <th style="width: 8%">状态</th>
            <th style="width: 16%">操作</th>
          </tr>
        </thead>
        <tbody>
          {#if enrollList.length > 0}
            {#each enrollList as item}
              <tr>
                <td><input type="checkbox" class="checkbox" /></td>
                <td>{item.name}</td>
                <td>{item.subject}</td>
                <td>{item.currentNum}/{item.planNum}</td>
                <td>{item.auditDeadline}</td>
                <td>{item.duration}</td>
                <td>{item.practice}</td>
                <td>
                  <span
                    class="Status-tag {item.status === '已发布'
                      ? 'published'
                      : item.status === '未发布'
                        ? 'unpublished'
                        : 'invalidated'}"
                  >
                    {item.status}
                  </span>
                </td>
                <td>
                  {#if item.status === '未发布'}
                    <button class="op-btn" onclick={handlePublic}>发布</button>
                    <button class="op-btn" onclick={() => handleEdit(item.id)}>编辑</button>
                    <button class="de-btn" onclick={handleDelete}>删除</button>
                  {:else if item.status === '已发布'}
                    <button class="op-btn" onclick={() => handleSeeStudent(item.id)}>查看考生</button>
                    <button class="op-btn" onclick={() => handleEdit(item.id)}>编辑</button>
                    <button class="de-btn" onclick={handleRepeal}>作废</button>
                  {:else if item.status === '已作废'}
                    ----
                  {:else if item.status === '审核截止'}
                    <button class="op-btn">查看考生</button>
                  {/if}
                </td>
              </tr>
            {/each}
          {:else}
            <tr>
              <td colspan="9">
                <div class="empty-wrapper">
                  <Empty text="暂无报名数据" />
                </div>
              </td>
            </tr>
          {/if}
        </tbody>
      </table>
    </div>

    <div class="pagination-container">
      <Pagination total_items={200} />
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

<style lang="scss">
  .enroll-management {
    background-color: #fff;
    height: 100%;
    overflow: hidden;

    .table-action-container {
      display: flex;
      flex-direction: column;
      padding: 16px 5px 0px 5px;

      .search-and-add-button-container {
        display: flex;
        justify-content: space-between;

        .new-enroll-btn,
        .delete-enroll-btn,
        .invalid-enroll-btn {
          border: none;
          border-radius: 4px;
          padding: 6px 18px;
          font-size: 12px;
          cursor: pointer;
          font-weight: 500;
          white-space: nowrap;
          height: 34px;
          transition: all 0.2s ease;
          box-shadow: 0 2px 6px rgba(0, 0, 0, 0.08);
          margin-right: 1rem;
        }

        /* 新增 */
        .new-enroll-btn {
          background-color: #165dff;
          color: #fff;
        }
        .new-enroll-btn:hover {
          background-color: #0f49cc;
          transform: translateY(-1px);
        }

        /* 删除 */
        .delete-enroll-btn {
          background-color: #ff4d00;
          color: #fff;
        }
        .delete-enroll-btn:hover {
          background-color: #e60000;
          transform: translateY(-1px);
        }

        /* 作废 */
        .invalid-enroll-btn {
          background-color: #ffeaea;
          color: #d93025;
          border: 1px solid #f5c2c0;
          margin-right: 1rem;
        }
        .invalid-enroll-btn:hover {
          background-color: #ffdcdc;
          transform: translateY(-1px);
        }

        .search-bar {
          display: flex;
          flex-wrap: wrap;
          margin-bottom: 20px;
          align-items: center;
          gap: 16px;
        }

        .filter-box {
          display: flex;
          align-items: center;
          min-width: 225px;

          .filter-label {
            color: rgba(0, 0, 0, 0.6);
            font-size: 14px;
            width: 75px;
            text-align: right;
            margin-right: 8px; /* 增加文字与下拉框间距 */
          }

          .dropdown-wrapper {
            width: 120px;
            height: 32px;
            padding-top: 5px;
          }
        }
      }

      .enroll-table {
        margin-top: 20px;
        width: 100%;
        height: calc(87vh - 200px);
        overflow: auto;

        table {
          width: 100%;
          border-collapse: collapse;
          text-align: center;

          .checkbox {
            width: 16px;
            height: 16px;
            cursor: pointer;
            accent-color: #165dff;
          }

          thead {
            background-color: #fff;
            font-size: 14px;
            color: rgba(0, 0, 0, 0.3);
            position: sticky;
            top: 0;
            z-index: 1;
          }

          th,
          td {
            padding: 8px 8px;
            vertical-align: middle;
            font-size: 14px;
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

            .op-btn {
              all: unset;
              padding: 4px 8px;
              margin: 0 4px;
              border-radius: 4px;
              font-size: 12px;
              color: #165dff;
              cursor: pointer;
            }

            .de-btn {
              all: unset;
              padding: 4px 8px;
              margin: 0 4px;
              border-radius: 4px;
              font-size: 12px;
              color: #ff0000ff;
              cursor: pointer;
            }
          }
        }

        .empty-wrapper {
          display: flex;
          justify-content: center;
          align-items: center;
          height: 50vh;
        }
      }

      .pagination-container {
        display: flex;
        justify-content: flex-end;
        position: fixed;
        bottom: 50px;
        right: 10px;
        z-index: 10;
        padding: 0 40px 0 0;
      }
    }
  }
</style>
