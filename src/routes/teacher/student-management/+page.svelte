<script>
  import { onMount } from 'svelte';
  import Title from '$lib/components/Title/Title.svelte';
  import InputBox from '$lib/components/Input/InputBox.svelte';
  import InforInput from '$lib/components/Input/InforInput.svelte';
  import Pagination from '$lib/components/Pagination/Pagination.svelte';
  import Select from '$lib/components/Select/Select.svelte';
  import Option from '$lib/components/Select/Option.svelte';
  import Empty from '$lib/components/Table/Empty.svelte';
  import StudentImportPanel from './StudentImportPanel.svelte';
  import { debounce } from './_utils/debounce.js';
  import { goto } from '$app/navigation';

  let students = $state([]); // 用户列表

  //全选状态
  let selectAll = $state(false);

  // 筛选和搜索状态
  let searchText = $state(''); // 搜索框文本内容
  let accountStatus = $state('全部'); // 当前选中的账号状态

  // 分页相关状态
  let currentPage = $state(1);
  let pageSize = $state(10);
  let totalItems = $state(0); // 总记录数
  let totalPages = $state(0); // 总页数

  // 加载状态
  let loading = $state(false);
  let error = $state(null);

  let showImportPanel = $state(false);
  let studentImportPanelRef = $state(null);

  //状态码到显示文字的映射
  const StateMap = {
    '00': '已启用',
    '02': '已停用',
    '04': '已删除',
  };

  // 状态码到CSS类名的映射
  const StateClassMap = {
    '00': 'enabled',
    '02': 'disabled',
    '04': 'deleted',
  };

  //处理获取学生列表
  function fetchStudents() {
    loading = true;
    error = null;

    const params = {
      page: String(currentPage),
      pageSize: String(pageSize),
      domain: 'cst.school^student', 
    };

    // 添加状态筛选
    if (accountStatus && accountStatus !== '全部') {
      params.status = accountStatus;
    }

    fetch(`/api/user?${new URLSearchParams(params)}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
    })
      .then((response) => response.json())
      .then((res) => {
        if (res && Array.isArray(res.data)) {
          let filteredData = res.data;

          // 前端实现多字段搜索
          if (searchText) {
            const keyword = searchText.toLowerCase();
            filteredData = filteredData.filter(
              (student) =>
                (student.OfficialName && student.OfficialName.toLowerCase().includes(keyword)) ||
                (student.Account && student.Account.toLowerCase().includes(keyword)) ||
                (student.IDCardNo && student.IDCardNo.toLowerCase().includes(keyword)) ||
                (student.MobilePhone && student.MobilePhone.toLowerCase().includes(keyword)),
            );
          }

          students = filteredData.map((student) => ({
            id: student.ID,
            account: student.Account,
            name: student.OfficialName || '',
            identityCard: student.IDCardNo || '',
            gender: student.Gender || '',
            phone: student.MobilePhone || '',
            status: student.Status,
            selected: false,
            has_relation: student.HasRelation || false,
          }));

          totalItems = res.rowCount || res.data.length;
          totalPages = Math.ceil(totalItems / pageSize);
          selectAll = false;
        } else {
          students = [];
          totalItems = 0;
          totalPages = 0;
          selectAll = false;
        }
        loading = false;
      })
      .catch((errorInfo) => {
        error = `获取用户列表失败: ${errorInfo.message}`;
        students = [];
        totalItems = 0;
        totalPages = 0;
        selectAll = false;
        loading = false;
      });
  }

  //防抖处理搜索函数
  const handleSearchDebounced = debounce(() => {
    currentPage = 1;
    fetchStudents();
  }, 400);

  //切换全选状态
  function toggleSelectAll() {
    students = students.map((student) => ({
      ...student,
      selected: selectAll,
    }));
  }

  //处理学生状态切换
  function toggleStatus(id) {
    const student = students.find((s) => s.id === id);
    if (!student) return;
    const newStatus = student.status === '00' ? '02' : '00';
    students = students.map((s) => (s.id === id ? { ...s, status: newStatus } : s));
  }

  // 页码选择处理
  function handlePageChange(event) {
    currentPage = event.detail;
    fetchStudents();
  }

  // 每页大小变更处理
  function handlePageSizeChange(event) {
    pageSize = event.detail;
    currentPage = 1;
    fetchStudents();
  }

  // 下载模板
  function downloadTemplate() {
    const url = '/student_import_excel/导入学生模版.xlsx';
    const a = document.createElement('a');
    a.href = url;
    a.download = '导入学生模版.xlsx';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  }

  // 导入学生
  function handleImport() {
    if (studentImportPanelRef) {
      studentImportPanelRef.triggerFileInput();
    }
  }

  function handleImportSuccess(is_all_ok) {
    if (is_all_ok) {
      fetchStudents();
    }
    showImportPanel = false;
  }

  // 添加学生
  function handleAdd() {
    // TODO: 实现添加逻辑
  }

  // 移除选中学生
  function handleBatchUnbind() {
    const selectedIds = students
      .filter((student) => student.selected && student.has_relation)
      .map((student) => student.id);

    if (selectedIds.length === 0) {
      return;
    }
    // TODO: 实现批量移除逻辑
  }

  // 创建学生
  function handleCreate() {
    goto('/teacher/student-management/addStudent');
  }

  // 删除选中学生
  function handleBatchDelete() {
    const selectedIds = students.filter((student) => student.selected).map((student) => student.id);

    if (selectedIds.length === 0) {
      console.log('没有选中的学生');
      return;
    }
    console.log('批量删除学生:', selectedIds);
    // TODO: 实现批量删除逻辑
  }

  // 启用选中学生
  function handleBatchEnable() {
    const selectedIds = students.filter((student) => student.selected).map((student) => student.id);

    if (selectedIds.length === 0) {
      console.log('没有选中的学生');
      return;
    }
    console.log('批量启用学生:', selectedIds);
    // TODO: 实现批量启用逻辑
  }

  // 停用选中学生
  function handleBatchDisable() {
    const selectedIds = students.filter((student) => student.selected).map((student) => student.id);

    if (selectedIds.length === 0) {
      console.log('没有选中的学生');
      return;
    }
    console.log('批量停用学生:', selectedIds);
    // TODO: 实现批量停用逻辑
  }

  //处理详情按钮
  function handleDetail(id) {
    // TODO: 实现查看详情逻辑
  }

  //处理编辑按钮
  function handleEdit(id) {
    // TODO: 实现编辑逻辑
  }

  //处理移除按钮
  function handleUnbind(id) {
    const student = students.find((s) => s.id === id);
    //TODO: 实现移除逻辑
  }

  //处理删除按钮
  function handleDelete(id) {
    const student = students.find((s) => s.id === id);
    //TODO: 实现删除逻辑
  }

  onMount(() => {
    fetchStudents();
  });
</script>

<div class="student-management-container">
  <Title title="学生列表" />
  <div class="table-action-container">
    <div class="action-layout">
      <!-- 左侧筛选区 -->
      <div class="left-section">
        <div class="filter-item">
          <span class="filter-label">姓名/账号/身份证号/手机号</span>
          <div class="search-container">
            <InputBox
              placeholder="请输入关键词"
              type="text"
              bind:value={searchText}
              showLabel={false}
              oninput={handleSearchDebounced}
            ></InputBox>
          </div>
        </div>
        <div class="filter-item">
          <span class="filter-label">账号状态</span>
          <div class="dropdown-container">
            <Select
              bind:value={accountStatus}
              placeholder="全部"
              onChangeValue={(value) => {
                accountStatus = value;
                currentPage = 1;
                fetchStudents();
              }}
            >
              <Option value="全部" label="全部"></Option>
              <Option value="00" label="启用"></Option>
              <Option value="02" label="禁用"></Option>
            </Select>
          </div>
        </div>
      </div>
      <!-- 右侧按钮区 -->
      <div class="right-section">
        <button class="action-btn download-btn" onclick={downloadTemplate}> 下载导入模板 </button>
        <button class="action-btn import-btn" onclick={handleImport}> 导入 </button>
        <button class="action-btn add-btn" onclick={handleAdd}> 添加 </button>
        <button class="action-btn unbind-btn" onclick={handleBatchUnbind}> 移除 </button>
        <button class="action-btn create-btn" onclick={handleCreate}> 创建 </button>
        <button class="action-btn delete-btn" onclick={handleBatchDelete}> 删除 </button>
        <button class="action-btn enable-btn" onclick={handleBatchEnable}> 启用 </button>
        <button class="action-btn disable-btn" onclick={handleBatchDisable}> 停用 </button>
      </div>
    </div>
  </div>
  <div class="table-container">
    <!-- 表格 -->
    <div class="table-scroll">
      <table class="student-table">
        <thead>
          <tr class="table-head-row">
            <th class="col-checkbox table-head">
              <input type="checkbox" class="checkbox-all" bind:checked={selectAll} onchange={toggleSelectAll} />
            </th>
            <th class="col-account table-head">账号</th>
            <th class="col-name table-head">姓名</th>
            <th class="col-id table-head">身份证号</th>
            <th class="col-status table-head">账号状态</th>
            <th class="col-gender table-head">性别</th>
            <th class="col-phone table-head">电话</th>
            <th class="col-actions table-head">操作</th>
          </tr>
        </thead>
        <tbody>
          {#each students as student (student.id)}
            <tr class="table-row" data-id={student.id}>
              <td class="col-checkbox">
                <input type="checkbox" class="checkbox-item" bind:checked={student.selected} />
              </td>
              <td class="col-account" title={student.account}>
                {student.account}
              </td>
              <td class="col-name" title={student.name}>
                {student.name}
              </td>
              <td class="col-id" title={student.identityCard}>
                {student.identityCard}
              </td>
              <td class="col-status">
                <span class="status-text {StateClassMap[student.status]}">
                  {StateMap[student.status] || '-'}
                </span>
              </td>
              <td class="col-gender">{student.gender}</td>
              <td class="col-phone">{student.phone}</td>
              <td class="col-actions">
                <div class="actions">
                  <button class="btn-link btn-detail" onclick={() => handleDetail(student.id)}>详情</button>
                  <button class="btn-link btn-edit" onclick={() => handleEdit(student.id)}>修改</button>
                  <button
                    class="btn-link {student.status === '02' ? 'btn-enable' : 'btn-disable'}"
                    onclick={() => toggleStatus(student.id)}
                  >
                    {student.status === '02' ? '启用' : '停用'}
                  </button>
                  <!-- 移除按钮 -->
                  <button
                    class="btn-link btn-unbind"
                    style="display: {student.has_relation ? 'inline-block' : 'none'}"
                    onclick={() => handleUnbind(student.id)}>移除</button
                  >

                  <!-- 删除按钮 -->
                  <button
                    class="btn-link btn-delete"
                    style="display: {student.has_relation ? 'none' : 'inline-block'}"
                    onclick={() => handleDelete(student.id)}>删除</button
                  >
                </div>
              </td>
            </tr>
          {/each}
          <!-- 空页面 -->
          <tr class="empty-row {students.length > 0 ? 'hide' : ''}">
            <td colspan="8" class="empty-cell">
              <div class="empty-container">
                <Empty text="暂无学生数据" />
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
    <!-- 分页器 -->
    <div class="pagination-wrapper">
      <div class="pagination-container {totalItems > 0 ? '' : 'hide'}">
        <Pagination
          {totalItems}
          {currentPage}
          {pageSize}
          pageSizeOptions={[10, 20, 50]}
          on:pageChange={handlePageChange}
          on:pageSizeChange={handlePageSizeChange}
        />
      </div>
    </div>
  </div>

  <!-- 导入学生面板 -->
  <StudentImportPanel bind:show={showImportPanel} onImport={handleImportSuccess} bind:this={studentImportPanelRef} />
</div>

<style lang="scss" scoped>
  $normal-font-size: 14px;
  $gray-font-color: rgb(0, 0, 0, 0.6);

  .student-management-container {
    position: relative;
    background-color: var(--bg-primary);
    display: flex;
    flex-direction: column;
    width: 100%;
    min-width: 1000px;
    overflow-y: auto;

    height: 100vh;
  }

  .table-action-container {
    padding: 10px 0 0 10px; //TODO：后续调整

    .action-layout {
      display: flex;
      justify-content: space-between;
      flex-wrap: wrap;
      width: 100%;
      margin-bottom: 10px;
      gap: 20px;
      @media (max-width: 1200px) {
        gap: 15px;
      }
      @media (max-width: 768px) {
        gap: 10px;
        flex-direction: column;
      }
    }

    .left-section {
      display: flex;
      flex: 1;
      gap: 20px;
      align-items: center;
      

      @media (max-width: 1200px) {
        min-width: 500px;
      }

      @media (max-width: 768px) {
        min-width: 400px;
      }

      @media (min-resolution: 1.25dppx) {
        gap:10px;
      }


      .filter-item {
        display: flex;
        font-size: $normal-font-size;
        min-width: 100px;
        color: $gray-font-color;
        white-space: nowrap;
        align-items: center;
        justify-items: center;
        gap: 20px;

        @media (min-resolution: 1.25dppx) {
          gap: 10px;
        }
      }

      .search-container {
        position: relative;
        display: flex;
        @media (min-resolution: 1.25dppx) {
          max-width:180px;
        }
      }

      .dropdown-container {
        position: relative;
        display: flex;
        @media (min-resolution: 1.25dppx) {
          max-width:180px;
        }
      }
    }

    .right-section {
      display: flex;
      gap: 20px;
      flex: 0 0 auto;
      min-width: 280px;
      min-height: 32px;
      flex-wrap: wrap;
      margin-right: 30px; //TODO：后续调整

      @media (min-resolution: 1.25dppx) {
          margin-right: 0px; 
          gap:10px;
        }

      @media (max-width: 1200px) {
        gap: 15px;
        margin-right: 20px;
      }

      @media (max-width: 768px) {
        gap: 8px;
        margin-right: 0;
        width: 100%;
      }

      .action-btn {
        border-radius: 4px;
        padding: 0 10px;
        font-size: $normal-font-size;
        cursor: pointer;
        min-width: 55px;
        text-align: center;
        white-space: nowrap;
        border: 1px solid transparent;

        &.download-btn,
        &.import-btn {
          background-color: white;
          color: #333;
          border-color: #ddd;
        }

        &.add-btn,
        &.create-btn {
          background-color: #0052d9;
          color: white;
          border-color: #0052d9;
        }

        &.unbind-btn,
        &.delete-btn {
          background-color: #e34d59;
          color: white;
          border-color: #e34d59;
        }

        &.enable-btn {
          background-color: #00b42a;
          color: white;
          border-color: #00b42a;
        }

        &.disable-btn {
          background-color: #f7930e;
          color: white;
          border-color: #f7930e;
        }
      }
    }
  }

  .table-container {
    flex: 1;
    display: flex;
    flex-direction: column;
    min-height: 0;
    overflow: hidden;
    padding-bottom: 20px; 

    @media (max-width: 768px) {
      padding: 5px 10px 50px 10px;
    }

    .table-scroll {
      flex: 1;
      overflow-y: auto;
    }
  }

  .student-table {
    font-size: $normal-font-size;
    border-collapse: collapse;
    width: 100%;

    th {
      font-weight: normal;
      height: 40px;
      padding: 8px;
      text-align: center;
      background-color: #ffffff;
      white-space: nowrap;
      min-width: max-content;
    }

    td {
      padding: 12px 8px;
      text-align: center;
      border-bottom: 1px solid #eee;
      color: rgb(0, 0, 0, 0.75);
      height: 60px;
    }

    .empty-row td {
      border-bottom: none;
    }

    .table-row:hover {
      background-color: #ecf2fe;
    }

    .col-checkbox {
      width: 3%;
    }
    .col-account {
      width: 12.52%;
      max-width: 142px;
    }
    .col-name {
      width: 12.52%;
      max-width: 142px;
    }
    .col-id {
      width: 18.29%;
      max-width: 276px;
    }
    .col-status {
      width: 6.76%;
    }
    .col-gender {
      width: 6.76%;
    }
    .col-phone {
      width: 13%;
    }
    .col-actions {
      width: 25%;
    }
  }

  .status-text {
    font-size: $normal-font-size;

    &.enabled {
      color: #00b42a;
      font-weight: 500;
    }
    &.disabled {
      color: #e34d59;
      font-weight: 500;
    }
    &.deleted {
      color: rgba(0, 0, 0, 0.5);
    }
  }

  .actions {
    display: flex;
    gap: 20px;
    justify-content: center;

    @media (min-resolution: 1.25dppx) {
      gap: 10px;
    }
    @media (max-width: 1320px) {
      gap: 5px;
    }

    .btn-link {
      background: none;
      border: none;
      cursor: pointer;
      padding: 0;
      font-size: $normal-font-size;
      max-width: 30px;

      &:hover {
        font-weight: bold;
      }
    }

    .btn-detail,
    .btn-edit {
      color: blue;
    }
    .btn-enable {
      color: green;
    }

    .btn-disable {
      color: orange;
    }

    .btn-delete,
    .btn-unbind {
      color: red;
    }
  }

  .pagination-wrapper {
    flex-shrink: 0;            
    padding: 10px 0;           
  
    .pagination-container {
    display: flex;             
    justify-content: flex-end; 
    padding-right: 10px;       
    
      
      &.hide {
        visibility: hidden;
      }
      
    }
  }

  .empty-container {
    margin-top: 40px;
  }

  .empty-row.hide {
    display: none;
  }
</style>
