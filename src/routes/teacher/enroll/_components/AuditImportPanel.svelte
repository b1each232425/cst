<script>
  import Pagination from '$lib/components/Pagination/Pagination.svelte';
  import InputBox from '$lib/components/Input/InputBox.svelte';
  import Button from '$lib/components/Button/Button.svelte';
  import Empty from '$lib/components/Table/Empty.svelte';
  import { toast } from '$lib/components/Toast/Toast.js';
  import { onMount } from 'svelte';
  import { validMobile, validIdCard } from '$lib/utils/validate';

  let { is_show_import_panel, auditor_list = [], closePanel = () => {}, onImportAudit = () => {} } = $props();

  let success_count = $state(0); // 成功识别条数
  let failure_count = $state(0); // 失败识别条数

  let editing_index = $state(-1); // 当前编辑行下标
  let editing_id = $state(null); // 当前编辑数据id
  let editing_row = $state(null); // 当前编辑行数据

  // 重新排序数据，错误数据放在最前面
  function sortAuditorsByError(list) {
    return [...list].sort((a, b) => {
      if (!!a.error && !b.error) return -1;
      if (!a.error && !!b.error) return 1;
      return 0;
    });
  }

  // 处理编辑按钮点击事件
  function handleEdit(row, index) {
    editing_index = index;
    editing_id = row.id;
    editing_row = { ...row };
  }

  // 处理保存编辑按钮点击事件
  function handleSaveEdit() {
    const validated_row = validateAuditor(editing_row);
    auditor_list = auditor_list.map((item) => (item.id === editing_id ? validated_row : item));

    auditor_list = sortAuditorsByError(auditor_list);

    success_count = auditor_list.filter((a) => !a.error).length;
    failure_count = auditor_list.filter((a) => a.error).length;

    handleCancelEdit();
  }

  // 处理取消编辑按钮点击事件
  function handleCancelEdit() {
    editing_index = -1;
    editing_id = null;
    editing_row = null;
  }

  // 处理删除按钮点击事件
  function handleDelete(row) {
    auditor_list = auditor_list.filter((item) => item.id !== row.id);
  }

  // 检查数据格式是否合法
  function validateAuditor(auditor) {
    let error = '';

    if (!auditor.name || auditor.name.trim() === '') {
      error += '姓名不能为空 ';
    }
    if (!validMobile(auditor.phone)) {
      error += '手机号不合法 ';
    }
    if (!validIdCard(auditor.idCard)) {
      error += '证件号不合法 ';
    }

    return { ...auditor, error };
  }

  // 处理确认批量导入按钮点击事件
  function handleConfirmImport() {
    let success_audit_list = auditor_list.filter((item) => !item.error);
    onImportAudit({ success_audit_list });
    closePanel();
  }

  onMount(() => {
    // 先校验，再排序
    auditor_list = sortAuditorsByError(auditor_list.map(validateAuditor));
    success_count = auditor_list.filter((a) => !a.error).length;
    failure_count = auditor_list.filter((a) => a.error).length;
  });
</script>

<div class={is_show_import_panel ? 'auditor-panel-container' : 'hide'}>
  <div class="auditor-panel">
    <div class="panel-header">
      <span class="panel-header-text">导入审查人员</span>
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

      <div class="auditor-table-container">
        <table class="auditor-table">
          <thead>
            <tr>
              <th style="width: 10%">姓名</th>
              <th style="width: 10%">性别</th>
              <th style="width: 10%">电话</th>
              <th style="width: 20%">证件号</th>
              <th style="width: 25%">错误信息</th>
              <th style="width: 25%">操作</th>
            </tr>
          </thead>
          <tbody>
            {#if auditor_list.length === 0}
              <tr class="empty-row">
                <td colspan="10" class="empty-cell">
                  <Empty text="暂无审查人员数据" />
                </td>
              </tr>
            {:else}
              {#each auditor_list as a, idx (a.id)}
                {#if editing_id === a.id}
                  <tr class="edit-row">
                    <td><input bind:value={editing_row.name} type="text" /></td>
                    <td><input bind:value={editing_row.gender} type="text" /></td>
                    <td><input bind:value={editing_row.phone} type="text" /></td>
                    <td><input bind:value={editing_row.idCard} type="text" /></td>
                    <td class="error-text">{editing_row.error}</td>
                    <td class="action-btn-container">
                      <button class="save-btn" onclick={handleSaveEdit}>保存</button>
                      <button class="cancel-btn" onclick={handleCancelEdit}>取消</button>
                    </td>
                  </tr>
                {:else}
                  <tr class={a.error ? 'failed-row' : 'success-row'}>
                    <td>{a.name}</td>
                    <td>{a.gender}</td>
                    <td>{a.phone}</td>
                    <td>{a.idCard}</td>
                    <td class={a.error ? 'error-text' : ''}>{a.error || '--'}</td>
                    <td class="action-btn-container">
                      <button class="edit-btn" onclick={() => handleEdit(a, idx)}>编辑</button>
                      <button class="delete-btn" onclick={() => handleDelete(a)}>删除</button>
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
      <Button type="primary" onclick={handleConfirmImport}>确认导入</Button>
    </div>
  </div>
</div>

<style lang="scss" scoped>
  $normal-font-size: 14px;
  $gray-font-color: rgba(0, 0, 0, 0.6);

  /* 遮罩层 */
  .auditor-panel-container {
    position: fixed;
    top: 0%;
    left: 0%;
    width: 100vw;
    height: 100vh;
    background-color: rgba(0, 0, 0, 0.25);
    display: flex;
    justify-content: center;
    align-items: center;
    z-index: 10000;
  }

  /* 弹窗主体 */
  .auditor-panel {
    width: 1200px;
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
      .auditor-table-container {
        margin-top: 20px;
        flex: 1; // 占据剩余空间
        min-height: 200px;
        max-height: 420px;
        overflow-y: auto; // 只滚动数据部分
        border: 1px solid #f0f0f0;
        border-radius: 6px;

        .auditor-table {
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
