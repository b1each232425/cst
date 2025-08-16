<script>
  import Title from '$lib/components/Title/Title.svelte';
  import Pagination from '$lib/components/Pagination/Pagination.svelte';
  import InputBox from '$lib/components/Input/InputBox.svelte';
  import Select from '$lib/components/Select/Select.svelte';
  import Empty from '$lib/components/Table/Empty.svelte';
  import Option from '$lib/components/Select/Option.svelte';
  import Loading from '$lib/components/Loading/Loading.svelte';
  import { goto } from '$app/navigation';
  import { handleApiError, handleSuccess, handleFeatureNotImplemented } from '../_utils/errorHandler.js';
  import { formatExamData } from '../_utils/dataFormatter.js';
  import { debounce } from '../_utils/debounce.js';

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

  // 状态管理
  let state = $state({
    /** @type {ExamInfo[]} */
    exams: [],
    totalRecords: 0,
    loading: false,
    selectAll: false,
    filters: {
      name: '',
      type: '',
      /** @type {number} */
      submitted: -1, // -1=全部, 0=未提交, 1=已提交
      examID: '',
    },
    pagination: {
      page: 1,
      pageSize: 10,
    },
    /** @type {Record<number, boolean>} */
    selected: {},
  });

  /** @type {any} */
  let getExamInfoTimeout = null;

  // 执行搜索的核心逻辑
  function performSearch() {
    state.pagination.page = 1;
    fetchExams();
  }

  // 防抖处理搜索函数
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

    const queryParams = new URLSearchParams({
      category: 'exam',
      page: page.toString(),
      pageSize: pageSize.toString(),
    });

    if (name) queryParams.append('name', name);
    if (type) queryParams.append('type', type);
    if (teacherID) queryParams.append('teacherID', teacherID.toString());
    if (examID) queryParams.append('examID', examID.toString());

    queryParams.append('submitted', submitted.toString());

    const url = `/api/grade/list?${queryParams.toString()}`;

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
    if (!Array.isArray(exam_ids) || exam_ids.length === 0) {
      return Promise.reject(new Error('提交成绩失败：exam_ids 必须是一个非空数组。'));
    }

    const url = `/api/grade/submission`;

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

  // 业务逻辑函数
  function fetchExams() {
    state.loading = true;
    state.selected = {};
    state.selectAll = false;
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
        state.loading = false;
      });
  }

  /** @param {Partial<typeof state.filters>} newFilters */
  function setFilters(newFilters) {
    state.filters = { ...state.filters, ...newFilters };
    debouncedSearch();
  }

  /** @param {number} page */
  function setPage(page) {
    state.pagination.page = page;
    fetchExams();
  }

  /** @param {number} pageSize */
  function setPageSize(pageSize) {
    state.pagination.pageSize = pageSize;
    state.pagination.page = 1;
    fetchExams();
  }

  /** @param {number} id */
  function toggleSelect(id) {
    state.selected[id] = !state.selected[id];
    const allSelected = state.exams.length > 0 && state.exams.every((exam) => state.selected[exam.id]);
    state.selectAll = allSelected;
  }

  function toggleSelectAll() {
    state.selectAll = !state.selectAll;
    /** @type {Record<number, boolean>} */
    const newSelected = {};
    if (state.selectAll) {
      for (const exam of state.exams) {
        newSelected[exam.id] = true;
      }
    }
    state.selected = newSelected;
  }

  /** @param {number[]} examIds */
  function submitGrades(examIds) {
    submitExamGrades(examIds)
      .then(() => {
        handleSuccess('成绩提交');
        fetchExams();
      })
      .catch((error) => {
        handleApiError(error, '提交成绩');
      });
  }

  /** @param {number[]} examIds */
  function exportGrades(examIds) {
    console.log('Exporting grades for exams:', examIds);
  }

  // 筛选面板相关
  function handleSearchInput(value) {
    setFilters({ name: value });
  }

  function handleBatchExport() {
    handleFeatureNotImplemented('批量导出');
  }

  function handleBatchSubmit() {
    const selectedIds = Object.keys(state.selected)
      .filter((id) => state.selected[Number(id)])
      .map(Number);

    if (selectedIds.length > 0) {
      submitGrades(selectedIds);
    } else {
      handleFeatureNotImplemented('批量提交');
    }
  }

  function handleShowLogs() {
    handleFeatureNotImplemented('查看日志');
  }

  /**
   * 查看考试详情
   * @param {number} examId - 考试ID
   */
  function handleDetailClick(examId) {
    goto(`/teacher/grade/exam-grade/detail?id=${examId}`);
  }

  function handleExport() {
    handleFeatureNotImplemented('导出功能');
  }

  // 计算属性
  let selectedCount = $derived(Object.keys(state.selected).filter((k) => state.selected[Number(k)]).length);
  let hasSelection = $derived(selectedCount > 0);

  $effect(() => {
    fetchExams();
  });
</script>

<div class="page-container">
  <Title title="考试成绩管理" />

  <div class="filter-container">
    <!-- 筛选面板 -->
    <div class="top-action-bar">
      <div class="filters">
        <div class="search-wrapper">
          <InputBox
            show_label={false}
            placeholder="请输入考试名称"
            showLabel={true}
            clearable={true}
            onInput={handleSearchInput}
          />
        </div>
        <div class="filter-group">
          <span class="filter-hint">考试类别</span>
          <div class="dropdown-wrapper">
            <Select bind:value={state.filters.type}>
              <Option value="" label="全部" />
              <Option value="00" label="平时考试" />
              <Option value="02" label="资格证考试" />
            </Select>
          </div>
        </div>
        <div class="filter-group">
          <span class="filter-hint">提交状态</span>
          <div class="dropdown-wrapper">
            <Select bind:value={state.filters.submitted}>
              <Option value={-1} label="全部" />
              <Option value={1} label="已提交" />
              <Option value={0} label="未提交" />
            </Select>
          </div>
        </div>
      </div>
      <div class="actions">
        <div class="selection-info">
          <span>当前已选中</span>
          <span class="count">{selectedCount}</span>
          <span>项</span>
        </div>
        <button class="action-btn export" disabled={!hasSelection} onclick={handleBatchExport} style="display: none;">
          批量导出
        </button>
        <button class="action-btn submit" disabled={!hasSelection} onclick={handleBatchSubmit}> 批量提交 </button>
        <button class="action-btn log" onclick={handleShowLogs} style="display: none;"> 查看日志 </button>
      </div>
    </div>
  </div>

  <div class="table-container">
    <div class="table-content">
      <!-- 考试表格 -->
      <div class="exam-table-container">
        <table class="exam-table">
          <thead>
            <!-- 表头 -->
            <tr class="exam-list-head">
              <th class="exam-select">
                <button class="square-container {state.selectAll ? 'checked' : ''}" onclick={toggleSelectAll}>
                  {#if state.selectAll}
                    <div class="check-square"></div>
                  {/if}
                </button>
              </th>
              <th class="exam-name">名称</th>
              <th class="exam-type">类型</th>
              <th class="exam-sessions">场次</th>
              <th class="exam-time">时间</th>
              <th class="exam-total-score">总分</th>
              <th class="exam-average-score">
                <span class="header-text">平均分</span>
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
            {#if state.loading}
              <tr>
                <td colspan="12" class="loading-row">
                  <div class="loading-container">
                    <Loading bind:value={state.loading} loading_text="正在加载" is_fullscreen={false}></Loading>
                  </div>
                </td>
              </tr>
            {:else if state.exams.length === 0}
              <tr>
                <td colspan="12" class="no-data">
                  <div class="empty-container">
                    <Empty text="暂无考试数据" />
                  </div>
                </td>
              </tr>
            {:else}
              {#each state.exams as exam (exam.id)}
                  <!-- 表格行 -->
                  <tr class="exam-list-row">
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
                    <td class="exam-name">{exam.name}</td>
                    <td class="exam-type">{exam.type === '00' ? '平时考试' : '资格证考试'}</td>
                    <td class="exam-sessions">
                      {#each exam.sessions as session (session.exam_session_id)}
                        <div class="session-item">{session.paper_name}</div>
                      {/each}
                    </td>
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
                    <td class="exam-total-score">
                      {exam.sessions && exam.sessions.length > 0 && exam.sessions.every((s) => s.total_score != null)
                        ? exam.sessions.reduce((acc, s) => acc + Number(s.total_score), 0)
                        : '-'}
                    </td>
                    <td class="exam-average-score">
                      {exam.sessions && exam.sessions.length > 0 && exam.sessions.every((s) => s.average_score != null)
                        ? (
                            exam.sessions.reduce((acc, s) => acc + Number(s.average_score), 0) / exam.sessions.length
                          ).toFixed(1)
                        : '-'}
                    </td>
                    <td class="exam-scheduled-examinees">
                      {exam.sessions &&
                      exam.sessions.length > 0 &&
                      exam.sessions.every((s) => s.scheduled_examinees != null)
                        ? exam.sessions.reduce((acc, s) => acc + s.scheduled_examinees, 0)
                        : '-'}
                    </td>
                    <td class="exam-actual-examinees">
                      {exam.sessions &&
                      exam.sessions.length > 0 &&
                      exam.sessions.every((s) => s.actual_examinees != null)
                        ? exam.sessions.reduce((acc, s) => acc + s.actual_examinees, 0)
                        : '-'}
                    </td>
                    <td class="exam-pass-examinees">
                      {exam.sessions && exam.sessions.length > 0 && exam.sessions.every((s) => s.pass_examinees != null)
                        ? exam.sessions.reduce((acc, s) => acc + s.pass_examinees, 0)
                        : '-'}
                    </td>
                    <td class="exam-submitted" class:submitted={exam.submitted} class:not-submitted={!exam.submitted}>
                      {exam.submitted === null || exam.submitted === undefined
                        ? '-'
                        : exam.submitted
                          ? '已提交'
                          : '未提交'}
                    </td>
                    <td class="operation">
                      <button class="op-btn" onclick={() => handleDetailClick(exam.id)}>详情</button>
                      <button class="op-btn" onclick={handleExport} style="display: none;">导出</button>
                      {#if !exam.submitted}
                        <button class="op-btn op-btn-submit" onclick={() => submitGrades([exam.id])}> 提交 </button>
                      {/if}
                    </td>
                  </tr>
                {/each}
              {/if}
            </tbody>
          </table>
        </div>
    </div>
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
    height: 84vh;
    position: relative;
  }

  .filter-container {
    flex-shrink: 0;
    padding: 0 13px;
    padding-bottom: 5px;
  }

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

  .pagination-wrapper {
    flex-shrink: 0;
    position: absolute;
    bottom: 10px;
    right: 20px;
  }

  /* 筛选面板样式 */
  .top-action-bar {
    display: flex;
    justify-content: flex-start;
    align-items: center;
    padding: 16px 0 0 0;
    flex-wrap: wrap; /* 自动换行 */
  }

  .filters {
    display: flex;
    align-items: center;
    gap: 5px;
    margin-right: 32px;
    flex-wrap: wrap;
  }

  .filter-group {
    display: flex;
    align-items: center;
  }

  .filter-hint {
    font-size: 14px;
    color: rgb(0, 0, 0, 0.6);
    padding: 0 9px 0 10px;
    min-width: 56px;
    white-space: nowrap;
  }

  .dropdown-wrapper {
    flex: 1;
    min-width: 0;
  }

  .search-wrapper {
    flex: 1;
    min-width: 0;
  }

  .actions {
    display: flex;
    align-items: center;
    gap: 12px;
    flex-wrap: wrap;
  }

  .selection-info {
    font-size: 14px;
    color: #555;
    display: flex;
    align-items: center;
    gap: 4px;
    .count {
      font-size: 16px;
      font-weight: bold;
      color: #0052d9;
      padding: 0 4px;
    }
  }

  .action-btn {
    padding: 8px 16px;
    border: none;
    border-radius: 4px;
    font-size: 14px;
    cursor: pointer;
    color: #fff;
    white-space: nowrap;
    flex-shrink: 0;

    &.export {
      background-color: #0052d9;
    }
    &.submit {
      background-color: #067945;
    }
    &.log {
      background-color: #0052d9;
    }

    &:disabled {
      background-color: #bbd3fb;
      cursor: not-allowed;
      &.submit {
        background-color: #85dbbe;
      }
    }
  }

  /* 表格样式 */
  .exam-table-container {
    width: 100%;
    height: 100%;
    max-height: 100%;
    overflow: auto;
    flex: 1;
    min-height: 0;
    

    // 自定义滚动条
    &::-webkit-scrollbar {
      width: 10px;
      height: 10px;
    }

    &::-webkit-scrollbar-track {
      background: #f1f1f1;
      border-radius: 4px;
    }

    &::-webkit-scrollbar-thumb {
      background: #c1c1c1;
      border-radius: 4px;

      &:hover {
        background: #a8a8a8;
      }
    }
  }

  .exam-table {
    width: 100%;
    min-width: 1200px;
    border-collapse: collapse;
    table-layout: fixed;

    thead {
      position: sticky;
      top: 0;
      z-index: 10;
      background: #fff;
    }
  }

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

  /* 表头列样式 */
  .exam-select {
    width: 4%;
  }
  .exam-name {
    width: 12%;
  }
  .exam-type {
    width: 8%;
  }
  .exam-sessions {
    width: 12%;
  }
  .exam-time {
    width: 16%;
  }
  .exam-total-score {
    width: 8%;
  }
  .exam-average-score {
    width: 8%;
  }
  .exam-scheduled-examinees {
    width: 8%;
  }
  .exam-actual-examinees {
    width: 8%;
  }
  .exam-pass-examinees {
    width: 8%;
  }
  .exam-submitted {
    width: 8%;
  }
  .operation {
    width: 12%;
  }

  /* 表格行样式 */
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

  .op-btn {
    color: #0052d9;
    background: none;
    border: none;
    cursor: pointer;
    padding: 4px 8px;
    margin-left: 8px;
    font-size: 14px;

    &.op-btn-submit {
      color: #00a870; /* 使用一个更明确的绿色 */
    }
  }

  /* 场次信息样式 */
  .session-item {
    margin-bottom: 2px;
    font-size: 14px;
    line-height: 1.4;
  }

  /* 提交状态样式 */
  .exam-submitted {
    &.submitted {
      color: #00a870; /* 绿色 */
    }

    &.not-submitted {
      color: #c9353f; /* 红色 */
    }
  }

  /* 工具提示样式 */
  .header-text {
    display: inline-block;
  }

  .tooltip-container {
    position: relative;
    display: inline-block;
    margin-left: 4px;
    vertical-align: middle;
  }

  .info-icon {
    color: rgba(0, 0, 0, 0.4);
    cursor: help;
    transition: color 0.2s ease;
  }

  .info-icon:hover {
    color: rgba(0, 0, 0, 0.7);
  }

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
    white-space: nowrap;
    opacity: 0;
    visibility: hidden;
    transition:
      opacity 0.2s ease,
      visibility 0.2s ease;
    z-index: 1000;
    margin-bottom: 4px;
  }

  .tooltip::after {
    content: '';
    position: absolute;
    top: 100%;
    left: 50%;
    transform: translateX(-50%);
    border: 4px solid transparent;
    border-top-color: #333;
  }

  .tooltip-container:hover .tooltip {
    opacity: 1;
    visibility: visible;
  }

  /* 复选框样式 */
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

    &:hover {
      background-color: #e0e0e0;
      border-color: #aaa;
    }
  }

  .check-square {
    width: 11px;
    height: 11px;
    background-color: #165dff;
  }
</style>
