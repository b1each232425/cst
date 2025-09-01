<script>
  import Pagination from '$lib/components/Pagination/Pagination.svelte';
  import InputBox from '$lib/components/Input/InputBox.svelte';
  import Button from '$lib/components/Button/Button.svelte';
  import Empty from '$lib/components/Table/Empty.svelte';
  import MessageBox from '$lib/components/MessageBox/MessageBox.svelte';
  import { toast } from '$lib/components/Toast/Toast.js';
  import { onMount } from 'svelte';
  import { validMobile, validEmail, validIdCard } from '$lib/utils/validate';
  import { validateRowData, validateDuplicates } from '../_utils/handleFileInput';

  let { enroll_id = 0, is_show_import_panel, candidate_list = [], closePanel = () => {} } = $props();

  let success_count = $state(0); // 成功识别条数
  let failure_count = $state(0); // 失败识别条数
  let editing_row = $state(null); // 当前编辑行副本

  let import_req_data = $state({ register_id: enroll_id, student: [] });

  // 消息提示框数据
  let is_show_messagebox = $state(false);
  let messagebox_title = $state('');
  let messagebox_content = $state('');

  // 根据错误数据重新排列
  function sortCandidatesByError(list) {
    return [...list].sort((a, b) => {
      if (!!a.error && !b.error) return -1;
      if (!a.error && !!b.error) return 1;
      return 0;
    });
  }

  // 处理编辑按钮点击事件
  function handleEdit(row) {
    editing_row = { ...row }; // 带 serial_number 的副本
  }

  // 处理保存编辑按钮点击事件
  function handleSaveEdit() {
    // 校验当前编辑行
    const validatedRow = validateRowData(editing_row);
    candidate_list = candidate_list.map((item) =>
      item.serial_number === editing_row.serial_number ? validatedRow : item,
    );

    // 重新排序，保证错误数据始终在前
    candidate_list = sortCandidatesByError(candidate_list);

    // 更新成功/失败统计
    success_count = candidate_list.filter((c) => !c.error).length;
    failure_count = candidate_list.filter((c) => c.error).length;

    editing_row = null;
  }

  // 处理取消编辑按钮点击事件
  function handleCancelEdit() {
    editing_row = null;
  }

  // 处理删除按钮点击事件
  function handleDelete(row) {
    candidate_list = candidate_list.filter((item) => item.serial_number !== row.serial_number);
    success_count = candidate_list.filter((c) => !c.error).length;
    failure_count = candidate_list.filter((c) => c.error).length;

    let validated = validateDuplicates(candidate_list);
    candidate_list = validated.data;
  }

  // 查询考生信息
  async function searchStudentData(name) {
    try {
      const response = await fetch(`/api/user?page=1&pageSize=10&fuzzyCondition=${name}`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error('网络错误');
      }

      const res = await response.json();

      if (Array.isArray(res.data)) {
        const students = res.data.map((item) => ({
          student_id: item.ID,
          exam_type: '00',
        }));
        import_req_data.student.push(...students);
      }
    } catch (err) {
      console.error('Fetch users error:', err);
    }
  }

  // 导入考生信息
  function importStudentData(data) {
    fetch('/api/registrationStudent', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ data: data }),
    })
      .then((response) => {
        if (!response.ok) {
          throw new Error('网络错误');
        }
        return response.json();
      })
      .then((data) => {
        console.log(data);
      })
      .catch((e) => {
        console.log(e);
      });
  }

  // 确认导入按钮点击事件
  async function handleConfirmImport() {
    // 先跑一遍重复校验，确保 candidate_list 的 error 最新
    let validated = validateDuplicates(candidate_list);
    candidate_list = validated.data;

    // 检查是否所有数据都没有错误
    let all_valid = candidate_list.every((item) => !item.error);

    if (all_valid) {
      // 全部正确，返回原 candidate_list
      await Promise.all(candidate_list.map((item) => searchStudentData(item.name)));

      importStudentData(import_req_data);
      // closePanel();
    } else {
      // 存在错误，只返回正确的数据
      messagebox_title = '存在错误数据';
      messagebox_content = '是否只导入正确的报名人员数据？';
      is_show_messagebox = true;
    }
  }

  export function initCandidates() {
    candidate_list = sortCandidatesByError(candidate_list);
    success_count = candidate_list.filter((c) => !c.error).length;
    failure_count = candidate_list.filter((c) => c.error).length;
  }

  // ---------- 消息提示框：确认/取消 ----------
  function handleMessageBoxConfirm() {
    let valid_data = candidate_list.filter((item) => !item.error);
    closePanel();
    messagebox_title = '';
    messagebox_content = '';
    is_show_messagebox = false;
  }

  function handleMessageBoxCancel() {
    messagebox_title = '';
    messagebox_content = '';
    is_show_messagebox = false;
  }
</script>

<div class={is_show_import_panel ? 'candidate-panel-container' : 'hide'}>
  <div class="candidate-panel">
    <div class="panel-header">
      <span class="panel-header-text">导入报考人员</span>
      <button class="close-btn" onclick={closePanel}>×</button>
    </div>

    <div class="panel-body">
      <div class="action-container">
        <div class="filter-item">
          <div class="search-container">
            <InputBox placeholder="请输入姓名/手机号/身份证号" type="text" show_label={false} />
          </div>
        </div>

        <div class="checkbox-container">
          <span class="checkbox-item">识别成功 <span class="success-count">{success_count}</span> 名</span>
          <span class="checkbox-item">识别失败 <span class="failure-count">{failure_count}</span> 名</span>
        </div>
      </div>

      <div class="candidate-table-container">
        <table class="candidate-table">
          <thead>
            <tr>
              <th style="width: 5%">姓名</th>
              <th style="width: 10%">电话</th>
              <th style="width: 10%">邮箱</th>
              <th style="width: 5%">性别</th>
              <th style="width: 15%">证件号</th>
              <th style="width: 10%">证件类型</th>
              <th style="width: 10%">出生日期</th>
              <th style="width: 10%">住址</th>
              <th style="width: 10%">错误信息</th>
              <th style="width: 15%">操作</th>
            </tr>
          </thead>
          <tbody>
            {#if candidate_list.length === 0}
              <tr class="empty-row">
                <td colspan="10" class="empty-cell">
                  <Empty text="暂无报考人员数据" />
                </td>
              </tr>
            {:else}
              {#each candidate_list as c (`row-${c.serial_number}`)}
                {#if editing_row && editing_row.serial_number === c.serial_number}
                  <!-- 编辑行：用副本 editing_row 渲染输入框 -->
                  <tr class="edit-row">
                    <td><input bind:value={editing_row.name} type="text" /></td>
                    <td><input bind:value={editing_row.phone} type="text" /></td>
                    <td><input bind:value={editing_row.email} type="text" /></td>
                    <td><input bind:value={editing_row.gender} type="text" /></td>
                    <td><input bind:value={editing_row.id_card} type="text" /></td>
                    <td><input bind:value={editing_row.id_type} type="text" /></td>
                    <td> <input bind:value={editing_row.birth} type="text" /> </td>
                    <td><input bind:value={editing_row.address} type="text" /></td>
                    <td class="error-text">{editing_row.error}</td>
                    <td class="action-btn-container">
                      <button class="save-btn" onclick={handleSaveEdit}>保存</button>
                      <button class="cancel-btn" onclick={handleCancelEdit}>取消</button>
                    </td>
                  </tr>
                {:else}
                  <!-- 只读行 -->
                  <tr class={c.error ? 'failed-row' : 'success-row'}>
                    <td>{c.name || '--'}</td>
                    <td>{c.phone || '--'}</td>
                    <td>{c.email || '--'}</td>
                    <td>{c.gender || '--'}</td>
                    <td>{c.id_card || '--'}</td>
                    <td>{c.id_type || '--'}</td>
                    <td>{c.birth || '--'}</td>
                    <td>{c.address || '--'}</td>
                    <td class={c.error ? 'error-text' : ''}>{c.error || '--'}</td>
                    <td class="action-btn-container">
                      <button class="edit-btn" onclick={() => handleEdit(c)}>编辑</button>
                      <button class="delete-btn" onclick={() => handleDelete(c)}>删除</button>
                    </td>
                  </tr>
                {/if}
              {/each}
            {/if}
          </tbody>
        </table>
      </div>

      <div class="pagination-container">
        <Pagination />
      </div>
    </div>

    <div class="panel-footer">
      <Button type="primary" plain onclick={closePanel}>取消</Button>
      <Button type="primary" onclick={() => handleConfirmImport()}>确认导入</Button>
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
  $normal-font-size: 14px;
  $gray-font-color: rgba(0, 0, 0, 0.6);

  /* 遮罩层 */
  .candidate-panel-container {
    position: fixed;
    top: 0%;
    left: 0%;
    width: 100vw;
    height: 100vh;
    background-color: rgba(0, 0, 0, 0.25);
    display: flex;
    justify-content: center;
    align-items: center;
    z-index: 1000;
  }

  /* 弹窗主体 */
  .candidate-panel {
    width: 1400px;
    height: 700px;
    min-width: 800px;
    max-height: 90vh;
    overflow-y: auto;
    background-color: white;
    display: flex;
    flex-direction: column;
    border-radius: 12px;
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.12);
    z-index: 999;

    /* header 区域 */
    .panel-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 20px 20px;
      border-bottom: 1px solid #eee;
      color: #1a1a1a;
      font-size: 20px;
      font-weight: 600;

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

    /* body 区域 */
    .panel-body {
      padding: 24px;
      flex: 1;
      display: flex;
      flex-direction: column;
      position: relative;

      /* 顶部搜索 & 筛选区 */
      .action-container {
        display: flex;
        flex-direction: row;
        align-items: center;
        justify-content: space-between;

        .filter-item {
          display: flex;
          font-size: $normal-font-size;
          min-width: 100px;
          color: $gray-font-color;
          white-space: nowrap;
          align-items: center;
          gap: 10px;

          .search-container {
            position: relative;
            display: flex;
            min-width: 250px;
          }
        }

        .checkbox-container {
          display: flex;
          font-size: 15px;
          gap: 8px;

          .success-count {
            color: var(--green);
            padding: 4px;
          }

          .failure-count {
            color: var(--red);
            padding: 4px;
          }
        }
      }

      /* 表格区域 */
      .candidate-table-container {
        margin-top: 20px;
        flex: 1; // 占据剩余空间
        min-height: 200px;
        max-height: 420px;
        overflow-y: auto; // 只滚动数据部分
        border: 1px solid #f0f0f0;
        border-radius: 6px;

        .candidate-table {
          width: 100%;
          border-collapse: collapse;

          input {
            width: 100px;
          }

          th,
          td {
            height: 40px;
            font-size: 14px;
            color: rgb(51, 51, 51);
            border: none;
            padding: 0 8px;
            text-align: center;
            height: 40px;
            line-height: 40px;
            box-sizing: border-box;
            border-bottom: 1px solid #e0e0e0;
          }

          .empty-row td {
            border-bottom: none;
          }

          th {
            position: sticky; // 表头固定
            top: 0;
            background: #fafafa;
            color: rgba(0, 0, 0, 0.3);
            z-index: 2;
          }

          .error-text {
            color: #ff4d4f;
            white-space: pre-line;
          }

          .failed-row {
            background-color: #ffeaea;

            &:hover {
              background-color: #ffd6d6;
            }
          }

          .success-row {
            background-color: #e0f0ff;
            &:hover {
              background-color: #c0d8ff;
            }
          }

          .action-btn-container {
            width: 260px;
          }

          .edit-btn,
          .save-btn,
          .cancel-btn {
            border: none;
            padding: 4px 6px;
            font-size: 14px;
            cursor: pointer;
            margin: 0 4px;
            background: transparent;
            color: #0052d9;

            &:hover {
              font-weight: bold;
            }
          }

          .delete-btn {
            border: none;
            padding: 4px 6px;
            font-size: 14px;
            cursor: pointer;
            margin: 0 4px;
            background: transparent;
            color: #ff0000ff;

            &:hover {
              font-weight: bold;
            }
          }
        }

        /* 专门用于编辑行的样式 */
        .edit-row {
          background-color: #ffd6d6;

          td {
            padding: 6px 8px;
          }

          /* 输入框样式 */
          td input {
            display: block;
            width: 100%;
            height: 28px;
            box-sizing: border-box;
            padding: 4px 6px;
            font-size: 14px;
            border: 1px solid #ccc;
            border-radius: 4px;
            outline: none;
          }

          .save-btn,
          .cancel-btn {
            border: none;
            padding: 4px 6px;
            font-size: 14px;
            cursor: pointer;
            margin: 0 4px;
            background: transparent;
            color: #0052d9;

            &:hover {
              font-weight: bold;
            }
          }
        }
      }

      /* 分页器区域 */
      .pagination-container {
        position: absolute;
        bottom: 0;
        right: 10px;
        display: flex;
        justify-content: flex-end;
        padding: 5px 16px;
        z-index: 5;
      }
    }

    /* footer 区域 */
    .panel-footer {
      display: flex;
      justify-content: flex-end;
      gap: 16px;
      padding: 12px 24px 18px;
      border-top: 1px solid #eee;

      @media (max-width: 768px) {
        padding: 12px 16px 16px;
      }

      @media (max-width: 480px) {
        flex-direction: column;
        gap: 8px;
      }
    }
  }

  .hide {
    display: none;
  }
</style>
