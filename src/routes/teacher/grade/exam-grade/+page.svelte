<script>
  import Title from '$lib/components/Title/Title.svelte';
  import Pagination from '$lib/components/Pagination/Pagination.svelte';
  import InputBox from '$lib/components/Input/InputBox.svelte';
  import Select from '$lib/components/Select/Select.svelte';
  import Empty from '$lib/components/Table/Empty.svelte';
  import Option from '$lib/components/Select/Option.svelte';
  import Loading from '$lib/components/Loading/Loading.svelte';
  import { goto } from '$app/navigation';
  import { onMount } from 'svelte';
  import { handleApiError, handleSuccess, handleFeatureNotImplemented } from '../_utils/errorHandler.js';
  import { formatExamData } from '../_utils/dataFormatter.js';
  import { debounce } from '../_utils/debounce.js';
  import { safeDisplayNumber, safeDisplayText, safeDisplayBoolean } from '../_utils/dataFormatter.js';


  /**
   * @typedef {object} ExamSessionInfo
   * @property {number} exam_id - 考试ID
   * @property {number} exam_session_id - 考试场次ID
   * @property {string} paper_name - 试卷名称
   * @property {number} start_time - 考试开始时间 (timestamp)
   * @property {number} end_time - 考试结束时间 (timestamp)
   * @property {string} mark_mode - 阅卷模式
   * @property {number | string} total_score - 考试总分
   * @property {number | string} average_score - 考试平均分
   * @property {number} scheduled_examinees - 计划应考人数
   * @property {number} actual_examinees - 实际应考人数
   * @property {number} pass_examinees - 考试通过人数
   */

  /**
   * @typedef {object} ExamInfo
   * @property {number} id - 考试ID
   * @property {string} name - 考试名称
   * @property {string} type - 考试类型
   * @property {ExamSessionInfo[]} sessions - 考试场次
   * @property {boolean} submitted - 是否提交
   */

  // 状态管理：保存页面所有状态数据
  let state = $state({
    /** @type {ExamInfo[]} 考试信息列表 */
    exams: [],
    totalRecords: 0, // 总记录数
    loading: false, // 加载状态
    selectAll: false, // 全选状态
    filters: {
      name: '', // 考试名称筛选
      type: '', // 考试类型筛选
      /** @type {number} 提交状态筛选 */
      submitted: -1, // -1=全部, 0=未提交, 1=已提交
      examID: '', // 考试ID筛选
    },
    pagination: {
      page: 1, // 当前页码
      pageSize: 10, // 每页显示数量
    },
    /** @type {Record<number, boolean>} 选中状态记录 */
    selected: {},
  });

  /** @type {any} 搜索防抖定时器 */
  let getExamInfoTimeout = null;

  // 执行搜索的核心逻辑：重置页码并重新获取数据
  function performSearch() {
    state.pagination.page = 1;
    fetchExams();
  }

  // 防抖处理搜索函数：避免频繁请求
  const debouncedSearch = debounce(performSearch, 500);

  // API 函数
  /**
   * 获取考试成绩列表
   * @param {object} params - 查询参数
   * @param {string} [params.name] - 考试名称
   * @param {string} [params.type] - 考试类型
   * @param {-1 | 1 | 0} [params.submitted] - 提交状态 (-1: 全部, 1: 已提交, 0: 未提交)
   * @param {number} [params.page] - 页码
   * @param {number} [params.pageSize] - 每页数量
   * @param {number} [params.teacherID] - 教师ID
   * @param {number} [params.examID] - 考试ID
   * @returns {Promise<any>}
   */
  function getExams(params) {
    const { name = '', type = '', submitted = -1, page = 1, pageSize = 10, teacherID, examID } = params || {};

    // 构建查询参数
    const queryParams = new URLSearchParams({
      category: 'exam',
      page: page.toString(),
      pageSize: pageSize.toString(),
    });

    // 添加可选查询参数
    if (name) queryParams.append('name', name);
    if (type) queryParams.append('type', type);
    if (teacherID) queryParams.append('teacherID', teacherID.toString());
    if (examID) queryParams.append('examID', examID.toString());

    queryParams.append('submitted', submitted.toString());

    const url = `/api/grade/list?${queryParams.toString()}`;

    // 发送请求并处理响应
    return fetch(url, {
      method: 'GET',
      credentials: 'include',
    })
      .then((response) => {
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        return response.json();
      })
      .then((data) => {
        if (data.status < 0) {
          throw new Error(data.msg || '获取考试成绩列表失败');
        }
        return data;
      });
  }

  /**
   * 提交考试成绩
   * @param {number[]} exam_ids - 考试ID列表
   * @returns {Promise<any>}
   */
  function submitExamGrades(exam_ids) {
    // 参数验证
    if (!Array.isArray(exam_ids) || exam_ids.length === 0) {
      return Promise.reject(new Error('提交成绩失败：exam_ids 必须是一个非空数组。'));
    }

    const url = `/api/grade/submission`;

    // 发送PATCH请求提交成绩
    return fetch(url, {
      method: 'PATCH',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        data: {
          exam_ids,
        },
      }),
    })
      .then((response) => {
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        return response.json();
      })
      .then((data) => {
        if (data.status < 0) {
          throw new Error(data.msg || '提交成绩失败');
        }
        return data;
      });
  }

  // 业务逻辑函数：获取考试数据并更新状态
  function fetchExams() {
    state.loading = true; // 开始加载
    state.selected = {}; // 清空选中状态
    state.selectAll = false; // 重置全选状态
    
    const params = {
      name: state.filters.name,
      type: state.filters.type,
      submitted: state.filters.submitted,
      examID: state.filters.examID,
      ...state.pagination,
    };
    
    getExams(params)
      .then((data) => {
        state.exams = formatExamData(data?.data || []);
        state.totalRecords = data?.rowCount || 0;
      })
      .catch((error) => {
        handleApiError(error, '获取考试成绩列表');
      })
      .finally(() => {
        state.loading = false; // 结束加载
      });
  }

  /** 
   * 更新筛选条件并触发搜索
   * @param {Partial<typeof state.filters>} newFilters 
   */
  function setFilters(newFilters) {
    state.filters = { ...state.filters, ...newFilters };
    // 筛选条件改变时清空选中状态
    state.selected = {};
    state.selectAll = false;
    debouncedSearch(); // 使用防抖搜索
  }

  /** 
   * 设置当前页码并重新获取数据
   * @param {number} page 
   */
  function setPage(page) {
    state.pagination.page = page;
    fetchExams();
  }

  /** 
   * 设置每页显示数量，重置页码并重新获取数据
   * @param {number} pageSize 
   */
  function setPageSize(pageSize) {
    state.pagination.pageSize = pageSize;
    state.pagination.page = 1; // 重置到第一页
    fetchExams();
  }

  /** 
   * 切换单个考试的选中状态
   * @param {number} id 考试ID
   */
  function toggleSelect(id) {
    state.selected[id] = !state.selected[id];
    // 检查是否所有考试都已选中，更新全选状态
    const allSelected = state.exams.length > 0 && state.exams.every((exam) => state.selected[exam.id]);
    state.selectAll = allSelected;
  }

  // 切换全选状态
  function toggleSelectAll() {
    state.selectAll = !state.selectAll;
    /** @type {Record<number, boolean>} */
    const newSelected = {};
    if (state.selectAll) {
      // 全选：将所有考试设为选中状态
      for (const exam of state.exams) {
        newSelected[exam.id] = true;
      }
    }
    // 如果取消全选，newSelected 为空对象（所有考试都不选中）
    state.selected = newSelected;
  }

  /** 
   * 提交考试成绩
   * @param {number[]} examIds 考试ID数组
   */
  function submitGrades(examIds) {
    submitExamGrades(examIds)
      .then(() => {
        handleSuccess('成绩提交');
        fetchExams(); // 重新获取数据以更新状态
      })
      .catch((error) => {
        handleApiError(error, '提交成绩');
      });
  }

  /** 
   * 导出考试成绩（待实现功能）
   * @param {number[]} examIds 考试ID数组
   */
  function exportGrades(examIds) {
    console.log('Exporting grades for exams:', examIds);
  }

  // 筛选面板相关事件处理
  
  /** 处理搜索输入变化 */
  function handleSearchInput(value) {
    setFilters({ name: value });
  }

  // 批量操作相关事件处理
  
  function handleBatchExport() {
    handleFeatureNotImplemented('批量导出');
  }

  /** 处理批量提交操作 */
  function handleBatchSubmit() {
    // 获取所有选中的考试ID
    const selectedIds = Object.keys(state.selected)
      .filter((id) => state.selected[Number(id)])
      .map(Number);

    if (selectedIds.length > 0) {
      // 检查选中的考试是否都可以提交
      const selectedExams = state.exams.filter(exam => selectedIds.includes(exam.id));
      const canSubmitAll = selectedExams.every(exam => 
        !exam.submitted && exam.sessions.every(session => session.status === '10')
      );
      
      if (canSubmitAll) {
        submitGrades(selectedIds); // 提交选中的考试成绩
      } else {
        handleApiError(new Error('所选考试中存在不能提交的考试（未完成阅卷或已提交）'), '批量提交');
      }
    } else {
      handleFeatureNotImplemented('批量提交');
    }
  }

  function handleShowLogs() {
    handleFeatureNotImplemented('查看日志');
  }

  /**
   * 查看考试详情：跳转到考试详情页面
   * @param {number} examId - 考试ID
   */
  function handleDetailClick(examId) {
    goto(`/teacher/grade/exam-grade/detail?id=${examId}`);
  }

  /** 处理导出功能（待实现） */
  function handleExport() {
    handleFeatureNotImplemented('导出功能');
  }

  // 计算属性：基于状态自动计算的值
  let selectedCount = $derived(Object.keys(state.selected).filter((k) => state.selected[Number(k)]).length);
  let hasSelection = $derived(selectedCount > 0);
  
  // 计算是否可以批量提交：选中的考试都未提交且所有场次状态都为'10'
  let canBatchSubmit = $derived(() => {
    if (selectedCount === 0) return false;
    
    const selectedIds = Object.keys(state.selected)
      .filter((id) => state.selected[Number(id)])
      .map(Number);
    
    const selectedExams = state.exams.filter(exam => selectedIds.includes(exam.id));
    
    return selectedExams.every(exam => 
      !exam.submitted && exam.sessions.every(session => session.status === '10')
    );
  });

  // 组件挂载时获取数据
  onMount(() => {
    fetchExams();
  });
</script>

<!-- 页面容器 -->
<div class="page-container">
  <!-- 页面标题 -->
  <Title title="考试成绩管理" />

  <!-- 筛选和操作区域 -->
  <div class="filter-container">
    <!-- 顶部操作栏：包含筛选条件和批量操作按钮 -->
    <div class="top-action-bar">
      <!-- 筛选条件区域 -->
      <div class="filters">
        <!-- 考试名称搜索 -->
        <div class="search-wrapper">
          <InputBox
            show_label={false}
            placeholder="请输入考试名称"
            showLabel={true}
            clearable={true}
            onInput={handleSearchInput}
          />
        </div>
        <!-- 考试类别筛选 -->
        <div class="filter-group">
          <span class="filter-hint">考试类别</span>
          <div class="dropdown-wrapper">
            <Select
              value={state.filters.type}
              placeholder="全部"
              changeValue={(value) => {
                if (value !== state.filters.type) {
                  state.filters.type = value;
                  state.pagination.page = 1;
                  // 筛选条件改变时清除选中状态
                  state.selected = {};
                  state.selectAll = false;
                  fetchExams();
                }
              }}
            >
              <Option value="" label="全部" />
              <Option value="00" label="平时考试" />
              <Option value="02" label="资格证考试" />
            </Select>
          </div>
        </div>
        <!-- 提交状态筛选 -->
        <div class="filter-group">
          <span class="filter-hint">提交状态</span>
          <div class="dropdown-wrapper">
            <Select
              value={state.filters.submitted}
              placeholder="全部"
              changeValue={(value) => {
                if (value !== state.filters.submitted) {
                  state.filters.submitted = value;
                  state.pagination.page = 1;
                  // 筛选条件改变时清除选中状态
                  state.selected = {};
                  state.selectAll = false;
                  fetchExams();
                }
              }}
            >
              <Option value={-1} label="全部" />
              <Option value={1} label="已提交" />
              <Option value={0} label="未提交" />
            </Select>
          </div>
        </div>
      </div>
      <!-- 批量操作区域 -->
      <div class="actions">
        <!-- 选中计数显示 -->
        <div class="selection-info">
          <span>当前已选中</span>
          <span class="count">{selectedCount}</span>
          <span>项</span>
        </div>
        <!-- 批量操作按钮 -->
        <button class="action-btn export" disabled={!hasSelection} onclick={handleBatchExport} style="display: none;">
          批量导出
        </button>
        <button class="action-btn submit" disabled={!canBatchSubmit} onclick={handleBatchSubmit}> 批量提交 </button>
        <button class="action-btn log" onclick={handleShowLogs} style="display: none;"> 查看日志 </button>
      </div>
    </div>
  </div>

  <!-- 表格和分页区域 -->
  <div class="table-container">
    <div class="table-content">
      <!-- 考试数据表格 -->
      <div class="exam-table-container">
        <table class="exam-table">
          <thead>
            <!-- 表格头部 -->
            <tr class="exam-list-head">
              <!-- 全选复选框 -->
              <th class="exam-select">
                <button class="square-container {state.selectAll ? 'checked' : ''}" onclick={toggleSelectAll}>
                  {#if state.selectAll}
                    <div class="check-square"></div>
                  {/if}
                </button>
              </th>
              <!-- 表格列标题 -->
              <th class="exam-name">名称</th>
              <th class="exam-type">类型</th>
              <th class="exam-sessions">场次</th>
              <th class="exam-time">时间</th>
              <th class="exam-total-score">总分</th>
              <th class="exam-average-score">
                <span class="header-text">平均分</span>
                <!-- 平均分计算说明提示 -->
                <span class="tooltip-container">
                  <svg class="info-icon" viewBox="0 0 16 16" width="14" height="14">
                    <circle cx="8" cy="8" r="7" fill="none" stroke="currentColor" stroke-width="1.5" />
                    <text x="8" y="12" text-anchor="middle" font-size="10" fill="currentColor">i</text>
                  </svg>
                  <div class="tooltip">计算方式:考试总分/考试次数</div>
                </span>
              </th>
              <th class="exam-scheduled-examinees">应考人数</th>
              <th class="exam-actual-examinees">实考人数</th>
              <th class="exam-pass-examinees">通过人数</th>
              <th class="exam-submitted">提交状态</th>
              <th class="operation">操作</th>
            </tr>
          </thead>
          <tbody>
            <!-- 加载状态显示 -->
            {#if state.loading}
              <tr>
                <td colspan="12" class="loading-row">
                  <div class="loading-container">
                    <Loading bind:value={state.loading} loading_text="正在加载" is_fullscreen={false}></Loading>
                  </div>
                </td>
              </tr>
            <!-- 空数据状态显示 -->
            {:else if state.exams.length === 0}
              <tr>
                <td colspan="12" class="no-data">
                  <div class="empty-container">
                    <Empty text="暂无考试数据" />
                  </div>
                </td>
              </tr>
            <!-- 考试数据列表 -->
            {:else}
              {#each state.exams as exam (exam.id)}
                  <!-- 考试数据行 -->
                  <tr class="exam-list-row">
                    <!-- 单选复选框 -->
                    <td class="exam-select">
                      <button
                        class="square-container {state.selected[exam.id] ? 'checked' : ''}"
                        onclick={() => toggleSelect(exam.id)}
                      >
                        {#if state.selected[exam.id]}
                          <div class="check-square"></div>
                        {/if}
                      </button>
                    </td>
                    <!-- 考试基本信息 -->
                    <td class="exam-name">{exam.name}</td>
                    <td class="exam-type">{exam.type === '00' ? '平时考试' : '资格证考试'}</td>
                    <!-- 考试场次信息 -->
                    <td class="exam-sessions">
                      {#if exam.sessions && exam.sessions.length > 0}
                        {#each exam.sessions as session (session.exam_session_id)}
                          <div class="session-item">
                            {session.paper_name || '-'}
                          </div>
                        {/each}
                      {:else}
                        -
                      {/if}
                    </td>
                    <!-- 考试时间 -->
                    <td class="exam-time">
                      {#if exam.sessions && exam.sessions.length > 0}
                        {#each exam.sessions as session (session.exam_session_id)}
                          <div class="session-item">
                            {session.start_time != '-' ? new Date(session.start_time).toLocaleString() : ''} - {session.end_time !=
                            '-'
                              ? new Date(session.end_time).toLocaleString()
                              : ''}
                          </div>
                        {/each}
                      {:else}
                        -
                      {/if}
                    </td>
                    <!-- 考试总分 -->
                    <td class="exam-total-score">
                      {#if exam.sessions && exam.sessions.length > 0}
                        {#each exam.sessions as session (session.exam_session_id)}
                          <div class="session-item">
                            {session.total_score != null ? session.total_score : '-'}
                          </div>
                        {/each}
                      {:else}
                        -
                      {/if}
                    </td>
                    <!-- 考试平均分 -->
                    <td class="exam-average-score">
                      {#if exam.sessions && exam.sessions.length > 0}
                        {#each exam.sessions as session (session.exam_session_id)}
                          <div class="session-item">
                            {safeDisplayNumber(session.average_score,1) ?? '-'}
                          </div>
                        {/each}
                      {:else}
                        -
                      {/if}
                    </td>
                    <!-- 应考人数 -->
                    <td class="exam-scheduled-examinees">
                      {#if exam.sessions && exam.sessions.length > 0}
                        {#each exam.sessions as session (session.exam_session_id)}
                          <div class="session-item">
                            {session.scheduled_examinees != null ? session.scheduled_examinees : '-'}
                          </div>
                        {/each}
                      {:else}
                        -
                      {/if}
                    </td>
                    <!-- 实考人数 -->
                    <td class="exam-actual-examinees">
                      {#if exam.sessions && exam.sessions.length > 0}
                        {#each exam.sessions as session (session.exam_session_id)}
                          <div class="session-item">
                            {session.actual_examinees != null ? session.actual_examinees : '-'}
                          </div>
                        {/each}
                      {:else}
                        -
                      {/if}
                    </td>
                    <!-- 通过人数 -->
                    <td class="exam-pass-examinees">
                      {#if exam.sessions && exam.sessions.length > 0}
                        {#each exam.sessions as session (session.exam_session_id)}
                          <div class="session-item">
                            {session.pass_examinees != null ? session.pass_examinees : '-'}
                          </div>
                        {/each}
                      {:else}
                        -
                      {/if}
                    </td>
                    <!-- 提交状态 -->
                    <td class="exam-submitted" class:submitted={exam.submitted} class:not-submitted={!exam.submitted}>
                      {exam.submitted === null || exam.submitted === undefined
                        ? '-'
                        : exam.submitted
                          ? '已提交'
                          : '未提交'}
                    </td>
                    <!-- 操作按钮 -->
                    <td class="operation">
                      <button class="op-btn" onclick={() => handleDetailClick(exam.id)}>详情</button>
                      <button class="op-btn" onclick={handleExport} style="display: none;">导出</button>
                      {#if !exam.submitted}
                        {#if exam.sessions.every(session => session.status === '10')}
                          <button class="op-btn op-btn-submit" onclick={() => submitGrades([exam.id])}> 提交 </button>
                        {:else}
                          <button class="op-btn op-btn-unable-submit" > 提交 </button>
                        {/if}
                      {/if}
                    </td>
                  </tr>
                {/each}
              {/if}
            </tbody>
          </table>
        </div>
    </div>
    <!-- 分页组件 -->
    <div class="pagination-wrapper">
      <Pagination
        total_items={state.totalRecords}
        page_size={state.pagination.pageSize}
        current_page={state.pagination.page}
        on:pageChange={(e) => setPage(e.detail)}
        on:pageSizeChange={(e) => setPageSize(e.detail)}
      />
    </div>
  </div>
</div>

<style lang="scss">
  .page-container {
    display: flex;
    flex-direction: column;
    min-height: 600px;
    overflow: hidden;
    height: 85vh; 
    position: relative;
  }

  /* 筛选区域样式 */
  .filter-container {
    flex-shrink: 0; /* 不收缩 */
    padding: 0 13px;
    padding-bottom: 5px;
  }

  /* 表格容器样式 */
  .table-container {
    display: flex;
    flex-direction: column;
    overflow: hidden;
    position: relative;
    min-height: 0;
    padding: 0 23px;
    flex: 1; 
    padding-bottom: 60px; /* 为固定分页器留出空间 */
  }

  .table-content {
    flex: 1;
    overflow: hidden;
    min-height: 0;
  }

  /* 分页器样式 */
  .pagination-wrapper {
    flex-shrink: 0; /* 分页器不收缩 */
    position: absolute;
    bottom: 0px;
    right: 20px;
  }

  /* 筛选面板和操作栏样式 */
  .top-action-bar {
    display: flex;
    justify-content: flex-start;
    align-items: center;
    padding: 16px 0 0 0;
    flex-wrap: wrap; 
  }

  /* 筛选条件区域 */
  .filters {
    display: flex;
    align-items: center;
    gap: 5px;
    margin-right: 32px;
    flex-wrap: wrap;
  }

  /* 筛选组样式 */
  .filter-group {
    display: flex;
    align-items: center;
  }

  /* 筛选标签样式 */
  .filter-hint {
    font-size: 14px;
    color: rgb(0, 0, 0, 0.6);
    padding: 0 9px 0 10px;
    min-width: 56px;
    white-space: nowrap; /* 防止换行 */
  }

  /* 下拉框容器 */
  .dropdown-wrapper {
    flex: 1;
    min-width: 0;
  }

  /* 搜索框容器 */
  .search-wrapper {
    flex: 1;
    min-width: 0;
  }

  /* 批量操作区域 */
  .actions {
    display: flex;
    align-items: center;
    gap: 12px;
    flex-wrap: wrap;
  }

  /* 选中项计数显示 */
  .selection-info {
    font-size: 14px;
    color: #555;
    display: flex;
    align-items: center;
    gap: 4px;
    .count {
      font-size: 16px;
      font-weight: bold;
      color: #0052d9; /* 蓝色高亮 */
      padding: 0 4px;
    }
  }

  /* 操作按钮样式 */
  .action-btn {
    padding: 8px 16px;
    border: none;
    border-radius: 4px;
    font-size: 14px;
    cursor: pointer;
    color: #fff;
    white-space: nowrap;
    flex-shrink: 0;

    /* 不同按钮的背景色 */
    &.export {
      background-color: #0052d9; 
    }
    &.submit {
      background-color: #067945; 
    }
    &.log {
      background-color: #0052d9; 
    }

    /* 禁用状态样式 */
    &:disabled {
      background-color: #bbd3fb; 
      cursor: not-allowed;
      &.submit {
        background-color: #85dbbe; 
      }
    }
  }

  /* 表格容器和滚动条样式 */
  .exam-table-container {
    width: 100%;
    height: 100%;
    max-height: 100%;
    overflow: auto; /* 支持滚动 */
    flex: 1;
    min-height: 0;
    

    // 自定义滚动条样式
    &::-webkit-scrollbar {
      width: 10px;
      height: 10px;
    }

    &::-webkit-scrollbar-track {
      background: #f1f1f1; /* 滚动条轨道颜色 */
      border-radius: 4px;
    }

    &::-webkit-scrollbar-thumb {
      background: #c1c1c1; /* 滚动条滑块颜色 */
      border-radius: 4px;

      &:hover {
        background: #a8a8a8; /* 悬停时颜色 */
      }
    }
  }

  /* 表格基础样式 */
  .exam-table {
    width: 100%;
    min-width: 1200px; 
    border-collapse: collapse; 
    table-layout: fixed; 

    thead {
      position: sticky; /* 表头固定 */
      top: 0;
      z-index: 10;
      background: #fff;
    }
  }

  /* 空数据和加载状态样式 */
  .no-data {
    text-align: center;
    padding: 40px;
    color: #999;
    font-size: 14px;
  }

  .loading-row {
    text-align: center;
    padding: 0;
  }

  .loading-container {
    padding-top: 500px;
    position: relative;
  }

  /* 表头样式 */
  .exam-list-head {
    width: 100%;
    height: 50px;
    background-color: transparent;

    th {
      font-size: 14px;
      font-weight: normal;
      color: rgb(0, 0, 0, 0.3); 
      padding: 30px 4px 5px 4px;
      vertical-align: middle;
      text-align: center;
      position: relative;
    }
  }

  /* 表格列宽度设置 */
  .exam-select {
    width: 4%; /* 选择列 */
  }
  .exam-name {
    width: 12%; /* 名称列 */
  }
  .exam-type {
    width: 8%; /* 类型列 */
  }
  .exam-sessions {
    width: 12%; /* 场次列 */
  }
  .exam-time {
    width: 16%; /* 时间列 */
  }
  .exam-total-score {
    width: 8%; /* 总分列 */
  }
  .exam-average-score {
    width: 8%; /* 平均分列 */
  }
  .exam-scheduled-examinees {
    width: 8%; /* 应考人数列 */
  }
  .exam-actual-examinees {
    width: 8%; /* 实考人数列 */
  }
  .exam-pass-examinees {
    width: 8%; /* 通过人数列 */
  }
  .exam-submitted {
    width: 8%; /* 提交状态列 */
  }
  .operation {
    width: 12%; /* 操作列 */
  }

  /* 表格数据行样式 */
  .exam-list-row {
    width: 100%;
    border-bottom: 1px solid #e0e0e0; 
    background-color: #fff;

    td {
      font-size: 14px;
      color: #3d3d3d;
      padding: 16px 4px;
      vertical-align: middle;
      text-align: center;
    }
  }

  /* 操作按钮样式 */
  .op-btn {
    color: #0052d9; 
    background: none;
    border: none;
    cursor: pointer;
    padding: 4px 8px;
    margin-left: 8px;
    font-size: 14px;

    &.op-btn-submit {
      color: #00a870; 
    }

    &.op-btn-unable-submit {
      color: rgb(126, 125, 125); 
      cursor: not-allowed;
    }
  }

  /* 考试场次信息显示样式 */
  .session-item {
    margin-bottom: 2px;
    font-size: 14px;
    line-height: 1.4;
    padding: 1px 0;
    
    &:last-child {
      margin-bottom: 0; /* 最后一项无下边距 */
    }
    
    /* 当只有一个场次时不显示间距 */
    &:only-child {
      margin-bottom: 0;
    }
  }

  /* 提交状态样式：根据状态显示不同颜色 */
  .exam-submitted {
    &.submitted {
      color: #00a870; 
    }

    &.not-submitted {
      color: #c9353f; 
    }
  }

  /* 工具提示相关样式 */
  .header-text {
    display: inline-block;
  }

  .tooltip-container {
    position: relative;
    display: inline-block;
    margin-left: 4px;
    vertical-align: middle;
  }

  /* 信息图标样式 */
  .info-icon {
    color: rgba(0, 0, 0, 0.4);
    cursor: help; /* 帮助光标 */
    transition: color 0.2s ease;
  }

  .info-icon:hover {
    color: rgba(0, 0, 0, 0.7); 
  }

  /* 工具提示框样式 */
  .tooltip {
    position: absolute;
    bottom: 100%;
    left: 50%;
    transform: translateX(-50%);
    background-color: #333; 
    color: white;
    padding: 6px 8px;
    border-radius: 4px;
    font-size: 12px;
    white-space: nowrap; /* 不换行 */
    opacity: 0; /* 默认隐藏 */
    visibility: hidden;
    transition:
      opacity 0.2s ease,
      visibility 0.2s ease;
    z-index: 100; /* 确保在最上层 */
    margin-bottom: 4px;
  }

  /* 工具提示箭头 */
  .tooltip::after {
    content: '';
    position: absolute;
    top: 100%;
    left: 50%;
    transform: translateX(-50%);
    border: 4px solid transparent;
    border-top-color: #333; 
  }

  /* 悬停时显示工具提示 */
  .tooltip-container:hover .tooltip {
    opacity: 1;
    visibility: visible;
  }

  /* 复选框样式设计 */
  .square-container {
    background-color: white;
    display: flex;
    justify-content: center;
    align-items: center;
    cursor: pointer;
    border: 1px solid #919191; 
    border-radius: 3px; 
    margin: 0;
    padding: 0;
    width: 16px;
    height: 16px;

    /* 悬停效果 */
    &:hover {
      background-color: #e0e0e0; 
      border-color: #aaa; 
    }
  }

  /* 选中状态的复选框内部方块 */
  .check-square {
    width: 11px;
    height: 11px;
    background-color: #165dff; 
  }
</style>
