<script>
  import UneditableHashTags from '$lib/components/Tag/UneditableHashTags.svelte';
  import Pagination from '$lib/components/Pagination/Pagination.svelte';
  import InputBox from '$lib/components/Input/InputBox.svelte';
  import Option from '$lib/components/Select/Option.svelte';
  import Button from '$lib/components/Button/Button.svelte';
  import Select from '$lib/components/Select/Select.svelte';
  import Empty from '$lib/components/Table/Empty.svelte';
  import AuditImportPanel from './AuditImportPanel.svelte';

  let { show = $bindable(false), onSelectAudit = () => {} } = $props();

  let search_text = $state(''); // 查询审核员文本内容
  let show_all_audit = $state(false); // 是否展示所有审查员

  let audit_id_list = $state([]); // 已选审核员id
  let audit_list = $state([]); // 已选审查员数据

  let is_show_import_panel = $state(false); // 是否展示批量导入审查员面板
  let file_input = $state(null); // 文件输入框DOM

  // 分页器数据
  let current_page = $state(1);
  let page_size = $state(10);
  let total_items = $derived(show_all_audit ? all_audit_list.length : audit_list.length);

  // 全部审查员数据
  let all_audit_list = $state([
    { id: 1, name: '张三', gender: '男', phone: '13800000001', idCard: '440101199901010011' },
    { id: 2, name: '李四', gender: '女', phone: '13800000002', idCard: '440101199802022222' },
    { id: 3, name: '王五', gender: '男', phone: '13800000003', idCard: '440101199703033333' },
    { id: 4, name: '赵六', gender: '女', phone: '13800000004', idCard: '440101199604044444' },
    { id: 5, name: '钱七', gender: '男', phone: '13800000005', idCard: '440101199505055555' },
    { id: 6, name: '钱七', gender: '男', phone: '13800000005', idCard: '440101199505055555' },
    { id: 7, name: '钱七', gender: '男', phone: '13800000005', idCard: '440101199505055555' },
    { id: 8, name: '钱七', gender: '男', phone: '13800000005', idCard: '440101199505055555' },
    { id: 9, name: '钱七', gender: '男', phone: '13800000005', idCard: '440101199505055555' },
    { id: 10, name: '钱七', gender: '男', phone: '13800000005', idCard: '440101199505055555' },
  ]);

  // 批量导入数据
  let import_audit_list = $state([
    { id: 1, name: '张三', gender: '男', phone: '13800000001', idCard: '440101199901010011', error: '' },
    { id: 2, name: '李四', gender: '女', phone: 'not_a_phone', idCard: '440101199802022222', error: '' },
    { id: 3, name: '王五', gender: '男', phone: '13800000003', idCard: 'wrong_id_card', error: '' },
    { id: 4, name: '', gender: '女', phone: '13800000004', idCard: '440101199604044444', error: '' },
  ]);

  // 关闭弹窗
  function closeModal() {
    show = false;
  }

  // 处理分页器页数变化
  function handlePageChoose(e) {
    current_page = e.detail;
  }

  // 处理分页器页面大小变化
  function handlePageSizeChange(e) {
    page_size = e.detail;
  }

  // 处理选择审核员按钮点击事件
  function handleSelectAudit() {
    if (show_all_audit) {
      // 过滤出已选的审核员
      const selected = all_audit_list.filter((item) => audit_id_list.includes(item.id));

      // 在原有 audit_list 基础上追加
      audit_list = [...audit_list, ...selected];

      // 去重
      audit_list = audit_list.filter((item, index, self) => index === self.findIndex((t) => t.id === item.id));
    }
    show_all_audit = !show_all_audit;
  }

  // 处理审核员选中事件
  function selectAudit(id) {
    const index = audit_id_list.indexOf(id);

    if (index === -1) {
      // 新增选中
      audit_id_list.push(id);

      // 在原有列表基础上追加
      const target = all_audit_list.find((item) => item.id === id);
      if (target && !audit_list.some((a) => a.id === id)) {
        audit_list = [...audit_list, target];
      }
    } else {
      // 取消选中
      audit_id_list.splice(index, 1);

      // 从 audit_list 中移除
      audit_list = audit_list.filter((item) => item.id !== id);
    }
  }

  // 处理管理批量导入审核员事件
  function closeAuditImportPanle() {
    is_show_import_panel = false;
  }

  // 处理批量导入审核员按钮点击事件
  function handleImportAudit() {
    if (file_input) {
      file_input.click();
    }
  }

  // 文件上传处理
  function handleFileUpload(event) {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    const file = files[0];
    const ext = file.name.split('.').pop().toLowerCase();

    // 只允许 Excel
    if (ext !== 'xls' && ext !== 'xlsx') {
      alert('只支持 Excel 文件（.xls, .xlsx）');
      return;
    }

    // 打开导入面板
    is_show_import_panel = true;

    // 重置文件，避免重复选择同一个文件时不触发
    file_input.value = null;
  }

  // 处理批量导入审核员事件
  function updateAuditChange({ success_audit_list }) {
    success_audit_list.forEach((item) => {
      // 只取需要的字段，插入 audit_list
      audit_list = [
        ...audit_list,
        {
          id: item.id,
          name: item.name,
          gender: item.gender,
          phone: item.phone,
          idCard: item.idCard,
        },
      ];
    });
  }

  // 处理确定按钮点击事件
  function handleConfirmSelect() {
    onSelectAudit({ audit_list });
    closeModal();
  }
</script>

{#if show}
  <div class="modal-overlay" tabindex="0" role="dialog" aria-modal="true">
    <div
      class="modal-content"
      onclick={(e) => e.stopPropagation()}
      onkeydown={(e) => e.stopPropagation()}
      tabindex="0"
      role="dialog"
    >
      <div class="modal-header">
        <h2>审查员列表</h2>
        <button class="close-btn" onclick={closeModal}>×</button>
      </div>

      <!-- 搜索区域 -->
      <div class="search-container">
        <div class="search-items">
          <div class="search-item">
            <InputBox
              label="审查员名称"
              id="search-text"
              type="text"
              placeholder="搜索已选审查员名称"
              bind:value={search_text}
            />
          </div>
        </div>
        <!-- 右侧按钮 -->
        <div class="action-buttons">
          {#if show_all_audit}
            <Button type="primary" onclick={handleSelectAudit}>查看已选名单</Button>
          {:else}
            <Button type="primary" onclick={handleSelectAudit}>选择审查员</Button>
          {/if}

          <Button type="success" onclick={handleImportAudit}>导入审查员</Button>
          <Button type="warning">下载模板</Button>
        </div>
      </div>

      <!-- 表格主体 -->
      {#if show_all_audit}
        <div class="modal-body">
          <div class="table-wrapper">
            <table class="test-table">
              <thead>
                <tr>
                  <th style="width: 5%"><input type="checkbox" /></th>
                  <th style="width: 5%">姓名</th>
                  <th style="width: 20%">性别</th>
                  <th style="width: 30%">手机号</th>
                  <th style="width: 40%">证件号</th>
                </tr>
              </thead>
              <tbody>
                {#if all_audit_list.length > 0}
                  {#each all_audit_list as audit}
                    <tr onclick={() => selectAudit(audit.id)}>
                      <td><input type="checkbox" checked={audit_id_list.includes(audit.id)} /></td>
                      <td>{audit.name}</td>
                      <td>{audit.gender}</td>
                      <td>{audit.phone}</td>
                      <td>{audit.idCard}</td>
                    </tr>
                  {/each}
                {:else}
                  <tr>
                    <td colspan="10">
                      <div class="empty-wrapper">
                        <Empty text="暂无人员数据" />
                      </div>
                    </td>
                  </tr>
                {/if}
              </tbody>
            </table>
          </div>

          <!-- 分页 -->
          <div class="pagination-container">
            <Pagination
              {total_items}
              {current_page}
              {page_size}
              page_size_options={[5, 10, 20]}
              on:pageChange={handlePageChoose}
              on:pageSizeChange={handlePageSizeChange}
            />
          </div>
        </div>
      {:else}
        <div class="modal-body">
          <div class="table-wrapper">
            <table class="test-table">
              <thead>
                <tr>
                  <th>姓名</th>
                  <th>性别</th>
                  <th>手机号</th>
                  <th>证件号</th>
                </tr>
              </thead>
              <tbody>
                {#if audit_list.length > 0}
                  {#each audit_list as audit}
                    <tr>
                      <td>{audit.name}</td>
                      <td>{audit.gender}</td>
                      <td>{audit.phone}</td>
                      <td>{audit.idCard}</td>
                    </tr>
                  {/each}
                {:else}
                  <tr>
                    <td colspan="10">
                      <div class="empty-wrapper">
                        <Empty text="暂无人员数据" />
                      </div>
                    </td>
                  </tr>
                {/if}
              </tbody>
            </table>
          </div>

          <!-- 分页 -->
          <div class="pagination-container">
            <Pagination
              {total_items}
              {current_page}
              {page_size}
              page_size_options={[5, 10, 20]}
              on:pageChange={handlePageChoose}
              on:pageSizeChange={handlePageSizeChange}
            />
          </div>
        </div>
      {/if}

      <!-- 底部按钮 -->
      <div class="modal-footer">
        <Button type="info" onclick={closeModal}>取消</Button>
        <Button onclick={handleConfirmSelect}>确定</Button>
      </div>
    </div>
  </div>
{/if}

<AuditImportPanel
  {is_show_import_panel}
  auditor_list={import_audit_list}
  onImportAudit={updateAuditChange}
  closePanel={closeAuditImportPanle}
></AuditImportPanel>

<!-- 隐藏的文件选择框 -->
<input type="file" accept=".xls,.xlsx" bind:this={file_input} style="display:none" onchange={handleFileUpload} />

<style lang="scss">
  /* 基础样式 */
  .modal-overlay {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background-color: rgba(0, 0, 0, 0.5);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 9999;
  }

  .modal-content {
    background-color: white;
    border-radius: 4px;
    width: 90%;
    max-width: 1200px;
    height: 80vh; /* 固定高度而不是max-height */
    display: flex;
    flex-direction: column;
    overflow: hidden;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  }

  .modal-header {
    padding: 12px 16px;
    margin-left: 10px;
    display: flex;
    justify-content: space-between;
    align-items: center;
    flex-shrink: 0;
    border-bottom: 1px solid #eee;

    h2 {
      margin: 0;
      font-size: 24px;
      font-weight: bold;
      color: #333;
    }

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

  /* 搜索区域样式 */
  .search-container {
    display: flex;
    padding: 16px 16px 16px 0px;
    justify-content: space-between;
    align-items: center;

    .search-items {
      display: flex;
      gap: 16px;
      flex-wrap: wrap;
      margin-left: 10px;
    }

    .action-buttons {
      display: flex;
      gap: 12px;
    }
  }

  /* 表格样式 */
  .modal-body {
    padding: 0 16px;
    overflow: hidden;
    flex: 1;
    display: flex;
    flex-direction: column;
    border-bottom: 1px solid #eee;

    .table-wrapper {
      flex: 1;
      overflow-y: auto;
      overflow-x: auto;

      .test-table {
        width: 100%;
        border-collapse: collapse;

        thead {
          position: sticky;
          top: 0;
          background: #fff;
          z-index: 2;
        }

        th,
        td {
          border-bottom: 1px solid #eee;
          padding: 12px 8px;
          font-size: 14px;
          color: #606266;
          text-align: center;
        }

        tbody tr:hover {
          background: #f5f7fa;
          cursor: pointer;
        }

        tbody tr:nth-child(even) {
          background: #f9f9f9;
        }

        .empty-wrapper {
          height: 320px;
        }
      }
    }
  }

  /* 分页容器样式 */
  .pagination-container {
    display: flex;
    justify-content: end;
    align-items: center;
    margin-top: 16px;
    padding: 0 16px 16px;
  }

  /* 底部按钮 */
  .modal-footer {
    padding: 10px 0;
    display: flex;
    justify-content: end;
    gap: 10px;
    flex-shrink: 0;
    margin-right: 30px;
  }
</style>
