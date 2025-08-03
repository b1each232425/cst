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

  // 用户列表
  let users = $state([]); 
  

  //全选状态
  let select_all = $state(false);
  // 全局选中的用户ID集合（跨页面保持）
  let selectedUserIds = $state(new Set());

  // 搜索状态
  let search_account = $state('');
  let search_name = $state('');
  let search_phone = $state('');
  let search_email = $state('');

  // 选择筛选状态
  let filter_create_time = $state(null);
  let filter_role = $state('');
  let filter_gender = $state('all'); // 性别值(发送后端)
  let filter_status = $state('all'); // 状态值(发送后端)

  // 分页相关状态
  let current_page = $state(1);
  let page_size = $state(10);
  let total_items = $state(0); // 总记录数
  let total_pages = $state(0); // 总页数

  // 加载状态
  let loading = $state(false);
  let error = $state(null);

  let date_picker; //创建日期选择器对象

  const TYPEMAP = {
    '00': '匿名用户',
    '02': '注册用户',
    '04': '试用用户',
    '08': '机构上帝',
    '10': '测试用户',
    '80': '系统上帝',
  };

  const ROLELABELMAP = {
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
  const ROLEOPTIONS = [
    { value: '', label: '全部' },
    ...Object.entries(ROLELABELMAP).map(([value, label]) => ({ value, label })),
  ];

  // 状态码到CSS类名的映射(用于CSS样式不同值显示不同颜色)
  const STATECLASSMAP = {
    '00': 'enabled',
    '02': 'disabled',
    '04': 'deleted',
  };

  // 状态映射(将值转换为显示文本)
  const STATUSLABELMAP = {
    all: '全部',
    '00': '启用',
    '02': '停用',
  };

  //处理获取用户列表 
  function fetchUsers() {
    loading = true;
    error = null;

    //构建请求参数
    const params = {
      page: String(current_page),
      pageSize: String(page_size),
    };
    if (search_name) params.officialName = search_name;
    if (search_phone) params.mobilePhone = search_phone;
    if (search_email) params.email = search_email;
    if (filter_gender && filter_gender !== 'all') params.gender = filter_gender;
    if (filter_status && filter_status !== 'all') params.status = filter_status; //all则不传值，显示全部
    if (search_account) params.account = search_account;
    if (filter_create_time) {
      params.create_time = filter_create_time.getTime(); // 直接获取时间戳
    }
    if (filter_role) {
      params.domain = filter_role;
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
            roles: user.Domains.map((r) => ROLELABELMAP[r] || r),
            name: user.OfficialName || '-',
            gender: user.Gender || '-',
            phone: user.MobilePhone || '-',
            email: user.Email || '-',
            type: TYPEMAP[user.Type] || user.Type || '-',
            category: user.Category || '-',
            create_time: user.CreateTime ? new Date(user.CreateTime).toLocaleDateString() : '',
            status: user.Status,
            selected: selectedUserIds.has(user.ID), // 根据全局选中状态设置
            has_relation: false,
          }));
          total_items = res.rowCount || res.data.length;
          total_pages = Math.ceil(total_items / page_size);
          // 更新全选状态
          updateSelectAllState();
          //console.log('filter_role:', filter_role);
        } else {
          users = [];
          total_items = 0;
          total_pages = 0;
          select_all = false;
        }
        // 更新全选状态
        updateSelectAllState();
        loading = false;
      })
      .catch((errorInfo) => {
        error = `获取用户列表失败: ${errorInfo.message}`;
        users = [];
        total_items = 0;
        total_pages = 0;
        select_all = false;
        loading = false;
      });
  }

  // 防抖处理搜索函数
  const handleSearchDebounced = debounce(() => {
    current_page = 1;
    // 搜索时清除选中状态
    selectedUserIds.clear();
    select_all = false;
    fetchUsers();
  }, 400);

  // 处理单日期选择事件
  function handleStartDateSelected(event) {
    const d = event.detail.date;
    console.log('选择的日期是：', formatDate(d));

    filter_create_time = new Date(d.getFullYear(), d.getMonth(), d.getDate()); // 去掉时分秒
    current_page = 1;
    // 筛选条件改变时清除选中状态
    selectedUserIds.clear();
    select_all = false;
    fetchUsers();
  }

  //切换全选状态
  function toggleSelectAll() {
    if (select_all) {
      // 用户刚刚选中了全选框：将当前页面所有用户ID添加到选中集合
      users.forEach(user => selectedUserIds.add(user.id));
    } else {
      // 用户刚刚取消了全选框：从选中集合中移除当前页面所有用户ID
      users.forEach(user => selectedUserIds.delete(user.id));
    }
    // 更新当前页面用户的选中状态
    users = users.map((user) => ({
      ...user,
      selected: selectedUserIds.has(user.id),
    }));
  }

  // 更新全选状态（根据当前页面的选中情况）
  function updateSelectAllState() {
    if (users.length === 0) {
      select_all = false;
      return;
    }
    // 检查当前页面所有用户是否都在全局选中集合中
    const allSelected = users.every(user => selectedUserIds.has(user.id));
    select_all = allSelected;
  }

  // 处理单个复选框变化
  function handleUserSelectChange(userId) {
    const user = users.find(u => u.id === userId);
    if (!user) return;
    
    if (user.selected) {
      // 当前是选中状态，点击后取消选中
      selectedUserIds.delete(userId);
    } else {
      // 当前是未选中状态，点击后选中
      selectedUserIds.add(userId);
    }
    
    // 更新用户列表中的选中状态
    users = users.map(u => 
      u.id === userId ? { ...u, selected: selectedUserIds.has(userId) } : u
    );
    
    // 立即更新全选状态
    updateSelectAllState();
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
    current_page = event.detail;
    fetchUsers();
  }

  // 每页大小变更处理
  function handlePageSizeChange(event) {
    page_size = event.detail;
    current_page = 1;
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
    if (selectedUserIds.size === 0) {
      return;
    }
    // TODO: 实现批量删除逻辑
    console.log('批量删除用户ID:', Array.from(selectedUserIds));
  }

  // 启用选中用户
  function handleBatchEnable() {
    if (selectedUserIds.size === 0) {
      return;
    }
    // TODO: 实现批量启用逻辑
    console.log('批量启用用户ID:', Array.from(selectedUserIds));
  }

  // 停用选中用户
  function handleBatchDisable() {
    if (selectedUserIds.size === 0) {
      return;
    }
    // TODO: 实现批量停用逻辑
    console.log('批量停用用户ID:', Array.from(selectedUserIds));
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
                bind:value={search_account}
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
                bind:value={search_name}
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
                bind:value={search_phone}
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
                bind:value={search_email}
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
                bind:this={date_picker}
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
              value={filter_role} 
              placeholder="请选择角色"
              onChangeValue={(value) => {
                // console.log('角色筛选 onChangeValue 触发，新值:', value, '旧值:', filter_role);
                if (value !== filter_role) {
                filter_role = value;
                current_page = 1;
                // 筛选条件改变时清除选中状态
                selectedUserIds.clear();
                select_all = false;
                fetchUsers();
                }
              }}
            >
              {#each ROLEOPTIONS as option}
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
              bind:value={filter_gender}
              placeholder="全部"
              onChangeValue={(value) => {
                filter_gender = value;
                current_page = 1;
                // 筛选条件改变时清除选中状态
                selectedUserIds.clear();
                select_all = false;
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
              bind:value={filter_status}
              placeholder="全部"
              onChangeValue={(value) => {
                filter_status = value;
                current_page = 1;
                // 筛选条件改变时清除选中状态
                selectedUserIds.clear();
                select_all = false;
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
              <input type="checkbox" class="checkbox-all" bind:checked={select_all} onchange={toggleSelectAll} />
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
                <input 
                  type="checkbox" 
                  class="checkbox-item" 
                  checked={user.selected}
                  onchange={() => handleUserSelectChange(user.id)}
                />
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
              <td class="col-creation">{user.create_time}</td>
              <td class="col-current-status">
                <span class="status-text {STATECLASSMAP[user.status]}">
                  {STATUSLABELMAP[user.status] || '-'}
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
      <div class="pagination-container {total_items > 0 ? '' : 'hide'}">
        <Pagination
          totalItems={total_items}
          currentPage={current_page}
          pageSize={page_size}
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
    display: flex;
    flex-direction: column;
    width: 100%;
    height: 80vh;
    overflow-y: auto;
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

      @media (max-width: 2500px) and (min-width: 1800px) {
        grid-template-columns: repeat(4, minmax(180px, 1fr));
        grid-template-rows: repeat(2, 1fr);
        gap: 10px;
      }

      @media (max-width: 1000px)and (min-width: 800px) {
        grid-template-columns: repeat(2, minmax(140px, 1fr));
        gap: 10px;
      }

      @media (max-width: 800px) {
        grid-template-columns: repeat(1, minmax(140px, 1fr));
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
          text-align: right; 

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
      margin-right: 30px; 

      @media (max-width: 1400px) and (min-width: 1201px) {
        grid-template-columns: repeat(3, minmax(60px, 1fr));
        grid-template-rows: repeat(3, 1fr);
        gap: 10px;
        margin-right: 0;
      }
      @media (max-width: 1238px) and (min-width: 800px) {
        grid-template-columns: repeat(7, minmax(60px, 1fr));
        gap: 10px;
        margin-right: 0;
      }
      @media (max-width: 800px) {
        grid-template-columns: repeat(4, 1fr);
        gap: 10px;
        margin-right: 0;
      }
      @media (min-resolution: 1.25dppx) {
        gap: 12px;
        margin-right: 10px;
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

        @media (max-width: 1400px) and (min-width: 1201px) {
          padding: 0 8px;
          min-width: 50px;
        }
        @media (max-width: 1238px) and (min-width: 992px) {
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
