<script>
  import Title from '$lib/components/Title/Title.svelte';
  import InputBox from '$lib/components/Input/InputBox.svelte';
  import Empty from '$lib/components/Table/Empty.svelte';
  import Pagination from '$lib/components/Pagination/Pagination.svelte';
  import Select from '$lib/components/Select/Select.svelte';
  import Option from '$lib/components/Select/Option.svelte';
  import MessageBox from '$lib/components/MessageBox/MessageBox.svelte';
  import { isTemplateMiddle } from 'typescript';
  import { formatDateTime } from './_utils/handleFileInput';
  import { goto } from '$app/navigation';
  import { onMount } from 'svelte';

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

  // 计划状态映射
  const STATUS_MAP = {
    '00': '已发布',
    '02': '未发布',
    '04': '已结束',
    '06': '审核截止',
    '08': '已作废',
    '12': '已取消',
  };

  // 计划状态
  let plan_status = $state(''); // 默认传空，表示全部
  let plan_status_options = [
    { value: '', label: '全部' },
    ...Object.entries(STATUS_MAP).map(([code, text]) => ({
      value: code,
      label: text,
    })),
  ];

  let enroll_list = $state([]); // 计划列表数据

  // 选中的待操作 id
  let select_delete_id = $state([]); // 待删除
  let select_repeal_id = $state([]); // 待作废
  let select_public_id = $state(null); // 待发布

  // 当前操作类型（delete | repeal | public）
  let current_action = '';

  // 消息提示框数据
  let is_show_messagebox = $state(false);
  let messagebox_title = $state('');
  let messagebox_content = $state('');

  let current_page = $state(1); // 当前页数
  let page_size = $state(10); // 当前页面大小
  let total_items = $state(0); //数据总数

  let input_value = $state('');

  // 获取报名列表数据
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
        if (!response.ok) {
          throw new Error('网络错误');
        }
        return response.json();
      })
      .then((data) => {
        // 处理数据
        enroll_list = data.data.registers.map((item) => {
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

  // 发布/作废/删除报名计划请求
  function handleEnrollReq(id, status) {
    fetch(`/api/registration?ids=${id}&status=${status}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
    })
      .then((response) => {
        if (!response.ok) {
          throw new Error('网络错误');
        }
        return response.json();
      })
      .then((data) => {
        // 处理数据
        if (data.status === 0) {
          getEnrollData();
        }
      })
      .catch((e) => {
        console.log(e);
      });
  }

  // 处理创建报名计划按钮点击事件
  function handleNewEnroll() {
    goto('/teacher/enroll/add-enroll');
  }

  // 处理编辑按钮点击事件
  function handleEdit(id) {
    goto(`/teacher/enroll/edit-enroll/${id}`);
  }

  // 处理查看考生按钮点击事件
  function handleSeeStudent(item) {
    // 将item数据存储到localStorage
    localStorage.setItem(
      'enrollItemData',
      JSON.stringify({
        courseText: item.register.CourseText,
        statusText: item.register.StatusText,
      }),
    );

    goto(`/teacher/enroll/see-enroll/${item.register.ID}`);
  }

  // ---------- 发布 ----------
  // 处理表格发布按钮点击事件
  function handlePublic(id) {
    select_public_id = id;
    current_action = 'public';
    messagebox_title = '确认发布';
    messagebox_content = '发布后，所有用户都可看到此报名计划，确定要继续吗？';
    is_show_messagebox = true;
  }

  // ---------- 作废 ----------
  function handleRepeal(id) {
    select_repeal_id = [id];
    current_action = 'repeal';
    messagebox_title = '确认作废';
    messagebox_content = '作废后，该条数据将不能再使用，确定要继续吗？';
    is_show_messagebox = true;
  }

  // 批量作废
  function handleBatchRepeal() {
    if (select_repeal_id.length === 0) return;

    const validIds = select_repeal_id.filter((id) => {
      const item = enroll_list.find((i) => i.register.ID === id);
      return item && item.register.Status === '00';
    });

    if (validIds.length !== select_repeal_id.length) {
      messagebox_title = '部分选择无效';
      messagebox_content = `你选择的 ${select_repeal_id.length} 条数据中，有 ${select_repeal_id.length - validIds.length} 条不符合作废条件。\n是否继续作废合法的 ${validIds.length} 条？`;
      current_action = 'repeal';
      select_repeal_id = validIds;
    } else {
      messagebox_title = '确认作废';
      messagebox_content = `确定要作废选中的 ${validIds.length} 条数据吗？`;
      current_action = 'repeal';
    }
    is_show_messagebox = true;
  }

  // ---------- 删除 ----------
  function handleDelete(id) {
    select_delete_id = [id];
    current_action = 'delete';
    messagebox_title = '确认删除';
    messagebox_content = '删除后，该条数据会永久消失，确定要继续删除吗？';
    is_show_messagebox = true;
  }

  // 批量删除
  function handleBatchDelete() {
    if (select_delete_id.length === 0) return;

    const validIds = select_delete_id.filter((id) => {
      const item = enroll_list.find((i) => i.register.ID === id);
      return item && item.register.Status === '02';
    });

    if (validIds.length !== select_delete_id.length) {
      messagebox_title = '部分选择无效';
      messagebox_content = `你选择的 ${select_delete_id.length} 条数据中，有 ${select_delete_id.length - validIds.length} 条不符合删除条件。\n是否继续删除合法的 ${validIds.length} 条？`;
      current_action = 'delete';
      select_delete_id = validIds;
    } else {
      messagebox_title = '确认删除';
      messagebox_content = `确定要删除选中的 ${validIds.length} 条数据吗？`;
      current_action = 'delete';
    }
    is_show_messagebox = true;
  }

  // ---------- 全选/取消全选 ----------
  function handleSelectAll(e) {
    if (e.target.checked) {
      select_delete_id = enroll_list.map((item) => item.register.ID);
      select_repeal_id = enroll_list.map((item) => item.register.ID);
    } else {
      select_delete_id = [];
      select_repeal_id = [];
    }
  }

  // 是否选中该条数据
  function isChecked(id) {
    return select_delete_id.includes(id) || select_repeal_id.includes(id);
  }

  // ---------- 消息提示框确认/取消 ----------
  async function handleMessageBoxConfirm() {
    if (current_action === 'public') {
      handleEnrollReq(select_public_id, '00');
      select_public_id = null;
    }

    if (current_action === 'delete' && select_delete_id.length > 0) {
      await Promise.all(select_delete_id.map((id) => handleEnrollReq(id, '10')));

      select_delete_id = [];
      select_repeal_id = [];
    }

    if (current_action === 'repeal' && select_repeal_id.length > 0) {
      await Promise.all(select_repeal_id.map((id) => handleEnrollReq(id, '08')));

      select_delete_id = [];
      select_repeal_id = [];
    }

    current_action = '';
    is_show_messagebox = false;
  }

  function handleMessageBoxCancel() {
    select_delete_id = [];
    select_repeal_id = [];
    select_public_id = null;
    current_action = '';
    messagebox_title = '';
    messagebox_content = '';
    is_show_messagebox = false;
  }

  // 父组件控制分页器的行为
  function handlePageChange(event) {
    current_page = event.detail;
    getEnrollData();
  }

  function handlePageSizeChange(event) {
    page_size = event.detail;
  }

  // 处理输入框回调事件
  function handleInput() {
    getEnrollData(input_value, plan_status, exam_subject);
  }

  // 处理选择计划状态回调事件
  function handleChangePlan() {
    getEnrollData(input_value, plan_status, exam_subject);
  }

  // 处理考试科目选择事件
  function handleChangeSubject() {
    getEnrollData(input_value, plan_status, exam_subject);
  }

  onMount(() => {
    getEnrollData();
  });
</script>

<div class="enroll-management">
  <Title title="报名列表" />

  <div class="table-action-container">
    <div class="search-and-add-button-container">
      <div class="search-bar">
        <div class="search-box">
          <InputBox
            bind:value={input_value}
            onInput={handleInput}
            label="计划名称"
            type="text"
            placeholder="请输入关键词"
          />
        </div>

        <div class="filter-box">
          <span class="filter-label">计划状态</span>
          <div class="dropdown-wrapper">
            <Select bind:value={plan_status} filterable changeValue={handleChangePlan}>
              {#each plan_status_options as option}
                <Option value={option.value} label={option.label}></Option>
              {/each}
            </Select>
          </div>
        </div>

        <div class="filter-box">
          <span class="filter-label">考试科目</span>
          <div class="dropdown-wrapper">
            <Select bind:value={exam_subject} filterable changeValue={handleChangeSubject}>
              {#each exam_subject_options as option}
                <Option value={option.value} label={option.label}></Option>
              {/each}
            </Select>
          </div>
        </div>
      </div>

      <div>
        <button class="new-enroll-btn" onclick={handleNewEnroll}>新增</button>
        <button class="delete-enroll-btn" onclick={handleBatchDelete}>批量删除</button>
        <button class="invalid-enroll-btn" onclick={handleBatchRepeal}>批量作废</button>
      </div>
    </div>

    <div class="enroll-table">
      <table>
        <thead>
          <tr>
            <th style="width: 6%">
              <input
                type="checkbox"
                class="checkbox"
                onchange={handleSelectAll}
                checked={enroll_list.length === select_delete_id.length}
              />
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
          {#if enroll_list.length > 0}
            {#each enroll_list as item}
              <tr>
                <td
                  ><input
                    type="checkbox"
                    class="checkbox"
                    checked={isChecked(item.register.ID)}
                    onchange={(e) => {
                      if (e.target.checked) {
                        // 勾选时两个数组都放
                        select_delete_id = [...new Set([...select_delete_id, item.register.ID])];
                        select_repeal_id = [...new Set([...select_repeal_id, item.register.ID])];
                      } else {
                        select_delete_id = select_delete_id.filter((id) => id !== item.register.ID);
                        select_repeal_id = select_repeal_id.filter((id) => id !== item.register.ID);
                      }
                    }}
                  /></td
                >
                <td>{item.register.Name ? item.register.Name : '--'}</td>
                <td>{item.register.CourseText ? item.register.CourseText : '--'}</td>
                <td>{item.studentCount}/{item.register.MaxNumber ? item.register.MaxNumber : '不限'}</td>
                <td>{item.register.ReviewEndTimeText ? item.register.ReviewEndTimeText : '--'}</td>
                <td
                  >{item.register.StartTimeText ? item.register.StartTimeText : '--'} ~ {item.register.EndTimeText
                    ? item.register.EndTimeText
                    : '--'}</td
                >
                <td>{item.practiceName ? item.practiceName : '--'}</td>
                <td>
                  <span
                    class="Status-tag {item.register.StatusText === '已发布'
                      ? 'published'
                      : item.register.StatusText === '未发布'
                        ? 'unpublished'
                        : 'invalidated'}"
                  >
                    {item.register.StatusText ? item.register.StatusText : '--'}
                  </span>
                </td>

                <td>
                  {#if item.register.StatusText === '未发布'}
                    <button class="op-btn" onclick={() => handlePublic(item.register.ID)}>发布</button>
                    <button class="op-btn" onclick={() => handleEdit(item.register.ID)}>编辑</button>
                    <button class="de-btn" onclick={() => handleDelete(item.register.ID)}>删除</button>
                  {:else if item.register.StatusText === '已发布'}
                    <button class="op-btn" onclick={() => handleSeeStudent(item)}>查看考生</button>
                    <button class="op-btn" onclick={() => handleEdit(item.register.ID)}>编辑</button>
                    <button class="de-btn" onclick={() => handleRepeal(item.register.ID)}>作废</button>
                  {:else if item.register.StatusText === '已作废'}
                    --
                  {:else if item.register.StatusText === '审核截止'}
                    <button class="op-btn" onclick={() => handleSeeStudent(item)}>查看考生</button>
                  {:else if item.register.StatusText === '已结束'}
                    <button class="op-btn" onclick={() => handleSeeStudent(item)}>查看考生</button>
                  {:else}
                    --
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
      <Pagination on:pageChange={handlePageChange} on:pageSizeChange={handlePageSizeChange} {total_items} />
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
    overflow: auto;

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
        height: calc(85vh - 200px);
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
        margin-top: 10px;
        padding: 0 10px 0 0;
      }
    }
  }
</style>
