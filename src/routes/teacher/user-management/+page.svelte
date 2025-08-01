<script>
  import { onMount } from 'svelte';
  import Title from '$lib/components/Title/Title.svelte';
  import InputBox from '$lib/components/Input/InputBox.svelte';
  import InforInput from '$lib/components/Input/InforInput.svelte';
  import Pagination from '$lib/components/Pagination/Pagination.svelte';
  import Select from '$lib/components/Select/Select.svelte';
  import Option from '$lib/components/Select/Option.svelte';
  import Empty from '$lib/components/Table/Empty.svelte';
  import DatePicker from '$lib/components/DatePicker/DatePicker.svelte';
  import { formatDate } from '$lib/components/DatePicker/datePicker';
  import { debounce } from './_utils/debounce.js';
  import { goto } from '$app/navigation';

  let users = $state([]); // 用户列表

  //全选状态
  let selectAll = $state(false);

  // 搜索状态
  let searchAccount = $state('');
  let searchName = $state('');
  let searchPhone = $state('');
  let searchEmail = $state('');

  // 选择筛选状态
  let filterCreateTime = $state(null);
  let filterRole = $state('');
  let filterGender = $state('all'); // 性别值(发送后端)
  let filterStatus = $state('all'); // 状态值(发送后端)

  // 分页相关状态
  let currentPage = $state(1);
  let pageSize = $state(10);
  let totalItems = $state(0); // 总记录数
  let totalPages = $state(0); // 总页数

  // 加载状态
  let loading = $state(false);
  let error = $state(null);

  let datePicker; //创建日期选择器对象

  const TypeMap = {
    '00': '匿名用户',
    '02': '注册用户',
    '04': '试用用户',
    '08': '机构上帝',
    '10': '测试用户',
    '80': '系统上帝',
  };

  const roleLabelMap = {
    'cst.school^superAdmin': '超级管理员',
    'cst.school^admin': '普通管理员',
    'cst.school.academicAffair^admin': '教务员',
    'cst.school^teacher': '教师',
    'cst.school^examGrader': '批阅员',
    'cst.school.examSite^admin': '考点负责人',
    'cst.school^scoreChecker': '核分员',
    'cst.school^examSupervisor': '监考员',
    'cst.school^student': '学生',
  };

  // 角色下拉选项(用于筛选)
  const roleOptions = [
    { value: '', label: '全部' },
    ...Object.entries(roleLabelMap).map(([value, label]) => ({ value, label })),
  ];

  // 状态码到CSS类名的映射(用于CSS样式不同值显示不同颜色)
  const StateClassMap = {
    '00': 'enabled',
    '02': 'disabled',
    '04': 'deleted',
  };

  // 状态映射(将值转换为显示文本)
  const statusLabelMap = {
    all: '全部',
    '00': '启用',
    '02': '停用',
  };

  //处理获取用户列表 TODO：替换为统一接口请求
  function fetchUsers() {
    loading = true;
    error = null;

    //构建请求参数
    const params = {
      page: String(currentPage),
      pageSize: String(pageSize),
    };
    if (searchName) params.officialName = searchName;
    if (searchPhone) params.mobilePhone = searchPhone;
    if (searchEmail) params.email = searchEmail;
    if (filterGender && filterGender !== 'all') params.gender = filterGender;
    if (filterStatus && filterStatus !== 'all') params.status = filterStatus; //all则不传值，显示全部
    if (searchAccount) params.account = searchAccount;
    if (filterCreateTime) {
      params.createTime = filterCreateTime.getTime(); // 直接获取时间戳
    }
    if (filterRole) {
      params.domain = filterRole;
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
          users = res.data.map((user) => ({
            id: user.ID,
            account: user.Account,
            roles: user.Domains.map((r) => roleLabelMap[r] || r),
            name: user.OfficialName || '-',
            gender: user.Gender || '-',
            phone: user.MobilePhone || '-',
            email: user.Email || '-',
            type: TypeMap[user.Type] || user.Type || '-',
            category: user.Category || '-',
            createTime: user.CreateTime ? new Date(user.CreateTime).toLocaleDateString() : '',
            Status: user.Status,
            selected: false,
            has_relation: false,
          }));
          totalItems = res.rowCount || res.data.length;
          totalPages = Math.ceil(totalItems / pageSize);
          selectAll = false;
          console.log('filterRole:', filterRole);
        } else {
          users = [];
          totalItems = 0;
          totalPages = 0;
          selectAll = false;
        }
        loading = false;
      })
      .catch((errorInfo) => {
        error = `获取用户列表失败: ${errorInfo.message}`;
        users = [];
        totalItems = 0;
        totalPages = 0;
        selectAll = false;
        loading = false;
      });
  }

  // 防抖处理搜索函数
  const handleSearchDebounced = debounce(() => {
    currentPage = 1;
    fetchUsers();
  }, 400);

  // 处理单日期选择事件
  function handleStartDateSelected(event) {
    const d = event.detail.date;
    console.log('选择的日期是：', formatDate(d));

    filterCreateTime = new Date(d.getFullYear(), d.getMonth(), d.getDate()); // 去掉时分秒
    currentPage = 1;
    fetchUsers();
  }

  //切换全选状态
  function toggleSelectAll() {
    users = users.map((user) => ({
      ...user,
      selected: selectAll,
    }));
  }

  //处理用户状态切换
  function toggleStatus(id) {
    const user = users.find((s) => s.id === id);
    if (!user) return;
    const newStatus = user.currentStatus === '00' ? '02' : '00';
    users = users.map((s) => (s.id === id ? { ...s, currentStatus: newStatus } : s));
  }

  // 页码选择处理
  function handlePageChange(event) {
    currentPage = event.detail;
    fetchUsers();
  }

  // 每页大小变更处理
  function handlePageSizeChange(event) {
    pageSize = event.detail;
    currentPage = 1;
    fetchUsers();
  }

  // 导出用户
  function handleExport() {
    // TODO: 实现导出逻辑
  }

  // 导入用户
  function handleImport() {
    // TODO: 实现导入逻辑
  }

  // 删除选中用户
  function handleBatchDelete() {
    const selectedIds = users.filter((user) => user.selected).map((user) => user.id);

    if (selectedIds.length === 0) {
      return;
    }
    // TODO: 实现批量删除逻辑
  }

  // 启用选中用户
  function handleBatchEnable() {
    const selectedIds = users.filter((user) => user.selected).map((user) => user.id);

    if (selectedIds.length === 0) {
      return;
    }
    // TODO: 实现批量启用逻辑
  }

  // 停用选中用户
  function handleBatchDisable() {
    const selectedIds = users.filter((user) => user.selected).map((user) => user.id);

    if (selectedIds.length === 0) {
      return;
    }
    // TODO: 实现批量停用逻辑
  }

  // 查看操作日志
  function handleViewLogs() {
    // TODO: 实现查看操作日志逻辑
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
    const user = users.find((s) => s.id === id);
    //TODO: 实现移除逻辑
  }

  //处理删除按钮
  function handleDelete(id) {
    const user = users.find((s) => s.id === id);
    //TODO: 实现删除逻辑
  }

  onMount(() => {
    fetchUsers();
  });
</script>

<div class="user-management-container">
  <Title title="用户列表" />
  <div class="table-action-container">
    <div class="action-layout">
      <!-- 左侧筛选区 -->
      <div class="left-section">
        <!-- 账号搜索 -->
        <div class="input-item">
          <span class="item-label">账号</span>
          <div class="input-container">
            <div class="search-container">
              <InputBox
                type="text"
                bind:value={searchAccount}
                placeholder="请输入账号"
                showLabel={false}
                oninput={handleSearchDebounced}
              />
            </div>
          </div>
        </div>
        <!-- 姓名搜索 -->
        <div class="input-item">
          <span class="item-label">姓名</span>
          <div class="input-container">
            <div class="search-container">
              <InputBox
                type="text"
                bind:value={searchName}
                placeholder="请输入姓名"
                showLabel={false}
                oninput={handleSearchDebounced}
              />
            </div>
          </div>
        </div>
        <!-- 电话搜索 -->
        <div class="input-item">
          <span class="item-label">电话</span>
          <div class="input-container">
            <div class="search-container">
              <InputBox
                type="text"
                bind:value={searchPhone}
                placeholder="请输入电话"
                showLabel={false}
                oninput={handleSearchDebounced}
              />
            </div>
          </div>
        </div>
        <!-- 邮箱搜索 -->
        <div class="input-item">
          <span class="item-label">邮箱</span>
          <div class="input-container">
            <div class="search-container">
              <InputBox
                type="text"
                bind:value={searchEmail}
                placeholder="请输入邮箱"
                showLabel={false}
                oninput={handleSearchDebounced}
              />
            </div>
          </div>
        </div>

        <!-- 创建时间筛选 -->
        <div class="input-item">
          <span class="item-label">创建时间</span>
          <div class="input-container">
            <div class="date-input">
              <DatePicker
                bind:this={datePicker}
                singleDateSelection={true}
                inputWidth={'100%'}
                on:startDateSelected={handleStartDateSelected}
              />
            </div>
          </div>
        </div>

        <!-- 角色筛选 -->
        <div class="input-item">
          <span class="item-label">角色</span>
          <div class="input-container">
            <Select
              bind:value={filterRole}
              placeholder="请选择角色"
              onChangeValue={(value) => {
                filterRole = value;
                currentPage = 1;
                fetchUsers();
              }}
            >
              {#each roleOptions as option}
                <Option value={option.value} label={option.label} />
              {/each}
            </Select>
          </div>
        </div>

        <!-- 性别筛选 -->
        <div class="input-item">
          <span class="item-label">性别</span>
          <div class="input-container">
            <Select
              bind:value={filterGender}
              placeholder="全部"
              onChangeValue={(value) => {
                filterGender = value;
                currentPage = 1;
                fetchUsers();
              }}
            >
              <Option value="all" label="全部" />
              <Option value="男" label="男" />
              <Option value="女" label="女" />
            </Select>
          </div>
        </div>

        <!-- 状态筛选 -->
        <div class="input-item">
          <span class="item-label">账号状态</span>
          <div class="input-container">
            <Select
              bind:value={filterStatus}
              placeholder="全部"
              onChangeValue={(value) => {
                filterStatus = value;
                currentPage = 1;
                fetchUsers();
              }}
            >
              <Option value="all" label="全部" />
              <Option value="00" label="启用" />
              <Option value="02" label="停用" />
            </Select>
          </div>
        </div>
      </div>
      <!-- 右侧按钮区 -->
      <div class="right-section">
        <button class="action-btn export-btn" onclick={handleExport}> 导出 </button>
        <button class="action-btn import-btn" onclick={handleImport}> 导入 </button>
        <button class="action-btn add-btn" onclick={() => goto('/teacher/user-management/addUser')}> 新增 </button>
        <button class="action-btn delete-btn" onclick={handleBatchDelete}> 删除 </button>

        <button class="action-btn enable-btn" onclick={handleBatchEnable}> 启用 </button>
        <button class="action-btn disable-btn" onclick={handleBatchDisable}> 停用 </button>
        <button class="action-btn view-logs-btn" onclick={handleViewLogs}> 查看操作日志 </button>
      </div>
    </div>
  </div>
  <div class="table-container">
    <!-- 表格 -->
    <div class="table-scroll">
      <table class="user-table">
        <thead>
          <tr class="table-header-row">
            <th class="col-checkbox table-head">
              <input type="checkbox" class="checkbox-all" bind:checked={selectAll} onchange={toggleSelectAll} />
            </th>
            <th class="col-account table-head">账号</th>
            <th class="col-name table-head">姓名</th>
            <th class="col-gender table-head">性别</th>
            <th class="col-phone table-head">电话</th>
            <th class="col-email table-head">邮箱</th>
            <th class="col-status table-head">账号状态</th>
            <th class="col-category table-head">分类</th>
            <th class="col-role table-head">角色</th>
            <th class="col-creation table-head">创建时间</th>
            <th class="col-current-status table-head">当前状态</th>
            <th class="col-actions table-head">操作</th>
          </tr>
        </thead>
        <tbody>
          {#each users as user (user.id)}
            <tr class="table-row" data-id={user.id}>
              <td class="col-checkbox">
                <input type="checkbox" class="checkbox-item" bind:checked={user.selected} />
              </td>
              <td class="col-account" title={user.account}>
                {user.account}
              </td>
              <td class="col-name" title={user.name}>
                {user.name}
              </td>
              <td class="col-gender">{user.gender}</td>
              <td class="col-phone">{user.phone}</td>
              <td class="col-email">{user.email}</td>
              <td class="col-status">{user.type}</td>
              <td class="col-category">{user.category}</td>
              <td class="col-role">{user.roles.join(', ')}</td>
              <td class="col-creation">{user.createTime}</td>
              <td class="col-current-status">
                <span class="status-text {StateClassMap[user.Status]}">
                  {statusLabelMap[user.Status] || '-'}
                </span>
              </td>
              <td class="col-actions">
                <div class="actions">
                  <button class="btn-link btn-detail" onclick={() => handleDetail(user.id)}>详情</button>
                  <button class="btn-link btn-edit" onclick={() => handleEdit(user.id)}>修改</button>
                  <button
                    class="btn-link {user.status === '02' ? 'btn-enable' : 'btn-disable'}"
                    onclick={() => toggleStatus(user.id)}
                  >
                    {user.status === '02' ? '启用' : '停用'}
                  </button>
                  <!-- 移除按钮 -->
                  <button
                    class="btn-link btn-unbind"
                    style="display: {user.has_relation ? 'inline-block' : 'none'}"
                    onclick={() => handleUnbind(user.id)}>移除</button
                  >

                  <!-- 删除按钮 -->
                  <button
                    class="btn-link btn-delete"
                    style="display: {user.has_relation ? 'none' : 'inline-block'}"
                    onclick={() => handleDelete(user.id)}>删除</button
                  >
                </div>
              </td>
            </tr>
          {/each}
          <!-- 空页面 -->
          <tr class="empty-row {users.length > 0 ? 'hide' : ''}">
            <td colspan="12" class="empty-cell">
              <div class="empty-container">
                <Empty text="暂无用户数据" />
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
</div>

<style lang="scss" scoped>
  $normal-font-size: 14px;
  $gray-font-color: rgb(0, 0, 0, 0.6);

  .user-management-container {
    position: relative;
    background-color: var(--bg-primary);
    display: flex;
    flex-direction: column;
    width: 100%;
    min-height: 100vh;
    overflow-y: auto;
    min-width: 1000px;
  }

  .table-action-container {
    display: flex;
    flex-direction: column;

    .action-layout {
      display: flex;
      justify-content: space-between;
      flex-wrap: wrap;
      width: 100%;
      margin-bottom: 20px;
      gap: 20px;
      align-items: flex-start;

      @media (min-width: 1200px) {
        gap: 10px;
      }
      @media (max-width: 1200px) {
        gap: 15px;
      }
      @media (max-width: 768px) {
        gap: 10px;
        flex-direction: column;
      }
    }

    .left-section {
      display: grid;
      grid-template-columns: repeat(3, minmax(280px, 2fr));
      grid-template-rows: repeat(2, 1fr);
      gap: 20px;
      flex: 1;
      min-width: 600px;

      @media (min-resolution: 1.25dppx) {
        grid-template-columns: repeat(3, minmax(200px, 1fr));
        grid-template-rows: repeat(2, 1fr);
        gap: 13px;
      }

      @media (max-width: 768px) {
        gap: 10px;
      }

      .input-item {
        display: flex;
        align-items: center;
        gap: 20px;

        @media (min-resolution: 1.25dppx) {
          gap: 10px;
        }

        .item-label {
          font-size: $normal-font-size;
          color: $gray-font-color;
          min-width: 60px;
          display: inline-block;
          text-align: right; //放在容器右侧TODO:后续需确定放哪

          @media (min-resolution: 1.25dppx) {
            min-width: 50px;
          }
        }

        .input-container {
          flex: 1;
          min-width: 0;
        }
      }
    }

    .right-section {
      display: grid;
      grid-template-columns: repeat(3, minmax(70px, 1fr));
      grid-template-rows: repeat(3, 1fr);
      gap: 20px;
      flex: 0 0 auto;
      min-width: 280px;
      margin-right: 30px; //TODO：后续删除
      @media (max-width: 1400px) and (min-width: 1201px) {
        grid-template-columns: repeat(3, minmax(60px, 1fr));
        grid-template-rows: repeat(3, 1fr);
        gap: 10px;
        margin-right: 0;
      }
      @media (max-width: 768px) {
        grid-template-columns: repeat(2, 1fr);
        grid-template-rows: repeat(3, 1fr);
        gap: 8px;
        margin-right: 0;
      }
      @media (min-resolution: 1.25dppx) {
        gap: 12px;
        margin-right: 10px;
      }

      .button-item {
        display: flex;
        justify-items: center;
        width: 100%;

        @media (max-width: 1200px) {
          min-width: 0;
        }
      }

      .action-btn {
        border-radius: 3px;
        min-height: 32px;
        padding: 0 10px;
        font-size: $normal-font-size;
        cursor: pointer;
        min-width: 60px;
        max-width: 120px;
        text-align: center;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
        transition: all 0.3s ease;
        @media (max-width: 1400px) and (min-width: 1201px) {
          padding: 0 8px;
          min-width: 50px;
        }
        @media (max-width: 1200px) and (min-width: 992px) {
          padding: 0 6px;
          min-width: 45px;
          font-size: 13px;
        }
        @media (max-width: 992px) {
          padding: 0 6px;
          min-width: 40px;
          font-size: 12px;
        }
      }

      .add-btn {
        background-color: #0052d9;
        color: white;
        border: none;
      }

      .export-btn,
      .import-btn {
        background-color: white;
        color: #333;
        border: 1px solid #ddd;
      }

      .delete-btn {
        background-color: #e34d59;
        color: white;
        border: none;
      }

      .enable-btn {
        background-color: #00b42a;
        color: white;
        border: none;
      }

      .disable-btn {
        background-color: #ff7d00;
        color: white;
        border: none;
      }

      .view-logs-btn {
        background-color: #86909c;
        color: white;
        border: none;
      }
    }
  }

  .table-container {
    flex: 1;
    display: flex;
    flex-direction: column;
    min-height: 0;
    overflow: hidden;
    padding-bottom: 80px; 

    @media (max-width: 768px) {
      padding: 5px 10px 50px 10px;
    }

    .table-scroll {
      flex: 1;
      overflow-y: auto;
    }
  }

  .user-table {
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
      width: 9%;
    }
    .col-name {
      width: 6%;
    }
    .col-gender {
      width: 4%;
    }
    .col-phone {
      width: 7%;
    }
    .col-email {
      width: 9%;
    }
    .col-status {
      width: 7%;
    }
    .col-category {
      width: 7%;
    }
    .col-role {
      width: 9%;
    }
    .col-creation {
      width: 7%;
    }
    .col-current-status {
      width: 7%;
    }
    .col-actions {
      width: 15%;
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
