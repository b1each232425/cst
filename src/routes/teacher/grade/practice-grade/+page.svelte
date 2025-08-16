<script>
  import Title from '$lib/components/Title/Title.svelte';
  import Pagination from '$lib/components/Pagination/Pagination.svelte';
  import InputBox from '$lib/components/Input/InputBox.svelte';
  import Empty from '$lib/components/Table/Empty.svelte';
  import Loading from '$lib/components/Loading/Loading.svelte';
  import { goto } from '$app/navigation';
  import {
    handleApiError,
    handleSuccess,
    handleSelectionError,
    handleFeatureNotImplemented,
  } from '../_utils/errorHandler.js';
  import { formatPracticeData } from '../_utils/dataFormatter.js';

  /**
   * @typedef {object} PracticeInfo
   * @property {number} id - 练习ID
   * @property {string} name - 练习名称
   * @property {number | string} total_score - 练习总分
   * @property {number | string} average_score - 练习平均分
   * @property {number} completed_students - 作答人数
   * @property {number} passed_students - 通过人数
   */

  // 状态管理
  let state = $state({
    /** @type {PracticeInfo[]} */
    practices: [],
    totalRecords: 0,
    loading: false,
    selectAll: false,
    filters: {
      name: '',
      practiceID: '',
    },
    pagination: {
      page: 1,
      pageSize: 10,
    },
    /** @type {Record<number, boolean>} */
    selected: {},
  });

  /** @type {any} */
  let timeoutId = null;

  // API 函数
  /**
   * 获取练习成绩列表
   * @param {object} params
   * @param {string} params.practiceName
   * @param {number} params.page
   * @param {number} params.pageSize
   * @param {number} [params.teacherID] - 教师ID
   * @param {number} [params.practiceID] - 练习ID
   * @returns {Promise<any>}
   */
  function getPractices(params) {
    const { practiceName = '', page = 1, pageSize = 10, teacherID, practiceID } = params || {};

    const queryParams = new URLSearchParams({
      category: 'practice',
      page: page.toString(),
      pageSize: pageSize.toString(),
    });

    if (practiceName) queryParams.append('name', practiceName);
    if (teacherID) queryParams.append('teacherID', teacherID.toString());
    if (practiceID) queryParams.append('practiceID', practiceID.toString());

    const url = `/api/grade/list?${queryParams.toString()}`;

    return fetch(url, {
      method: 'GET',
      credentials: 'include',
    }).then((response) => {
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return response.json();
    });
  }

  /**
   * 导出练习成绩
   * @param {number[]} ids
   * @returns {Promise<any>}
   */
  function exportPracticeGrades(ids) {
    if (!Array.isArray(ids) || ids.length === 0) {
      return Promise.reject(new Error('导出失败：未选择任何项目。'));
    }

    return fetch('/api/teacher/practice-grade/export', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        credentials: 'include',
      },
      body: JSON.stringify({ ids }),
    })
      .then((response) => {
        if (!response.ok) {
          throw new Error('HTTP error! status: ' + response.status);
        }
        return response.blob();
      })
      .then((blob) => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'practice_grades.xlsx';
        document.body.appendChild(a);
        a.click();
        a.remove();
      })
      .catch((error) => {
        console.error('导出练习成绩失败:', error);
        throw error;
      });
  }

  // 业务逻辑函数
  function fetchPractices(debounce = false) {
    if (debounce) {
      if (timeoutId) clearTimeout(timeoutId);
      timeoutId = setTimeout(() => fetchPractices(false), 500);
      return;
    }
    state.loading = true;
    const params = {
      practiceName: state.filters.name,
      name: state.filters.name,
      practiceID: state.filters.practiceID,
      ...state.pagination,
    };
    getPractices(params)
      .then((data) => {
        state.practices = formatPracticeData(data?.data || []);
        state.totalRecords = data?.rowCount || 0;
      })
      .catch((error) => {
        handleApiError(error, '获取练习成绩列表');
      })
      .finally(() => (state.loading = false));
  }

  /** @param {Partial<typeof state.filters>} newFilters */
  function setFilters(newFilters) {
    state.filters = { ...state.filters, ...newFilters };
    state.pagination.page = 1;
    fetchPractices(true);
  }

  /** @param {number} page */
  function setPage(page) {
    state.pagination.page = page;
    fetchPractices();
  }

  /** @param {number} pageSize */
  function setPageSize(pageSize) {
    state.pagination.pageSize = pageSize;
    state.pagination.page = 1;
    fetchPractices();
  }

  /** @param {number} id */
  function toggleSelect(id) {
    state.selected[id] = !state.selected[id];
    const practiceIds = state.practices.map((p) => p.id);
    const selectedIds = Object.keys(state.selected)
      .map(Number)
      .filter((k) => practiceIds.includes(k) && state.selected[k]);

    if (selectedIds.length === practiceIds.length && practiceIds.length > 0) {
      state.selectAll = true;
    } else {
      state.selectAll = false;
    }
  }

  function toggleSelectAll() {
    state.selectAll = !state.selectAll;
    /** @type {Record<number, boolean>} */
    const newSelected = {};
    for (const practice of state.practices) {
      newSelected[practice.id] = state.selectAll;
    }
    state.selected = newSelected;
  }

  function exportGrades() {
    const selectedIds = Object.keys(state.selected)
      .filter((id) => state.selected[Number(id)])
      .map(Number);

    if (selectedIds.length === 0) {
      handleSelectionError('导出');
      return;
    }

    exportPracticeGrades(selectedIds)
      .then(() => {
        handleSuccess('练习成绩导出');
      })
      .catch((error) => {
        handleApiError(error, '导出练习成绩');
      });
  }

  // 筛选面板相关
  let selectedCount = $derived(Object.keys(state.selected).filter((k) => state.selected[Number(k)]).length);
  let hasSelection = $derived(selectedCount > 0);

  function handleSearchInput(value) {
    setFilters({ name: value });
  }

  function handleExportClick() {
    handleFeatureNotImplemented('批量导出');
  }

  /**
   * 查看练习详情
   * @param {number} practiceId - 练习ID
   */
  function handleDetailClick(practiceId) {
    goto(`/teacher/grade/practice-grade/detail?id=${practiceId}`);
  }

  $effect(() => {
    fetchPractices();
  });
</script>

<div class="page-container">
  <Title title="练习成绩管理" />
  <div class="filter-container">
    <!-- 筛选面板 -->
    <div class="top-action-bar">
      <div class="filters">
        <div class="search-wrapper">
          <InputBox
            show_label={false}
            placeholder="请输入练习名称"
            showLabel={true}
            clearable={true}
            onInput={handleSearchInput}
          />
        </div>
      </div>
      <div class="actions">
        <div class="selection-info">
          <span>当前已选中</span>
          <span class="count">{selectedCount}</span>
          <span>项</span>
        </div>
        <button class="action-btn export" disabled={!hasSelection} onclick={handleExportClick} style="display: none;"
          >批量导出</button
        >
      </div>
    </div>
  </div>
  <div class="table-container">
    <div class="table-content">
      {#if state.loading}
        <Loading bind:value={state.loading} loadingText="正在加载"></Loading>
      {:else}
        <!-- 练习表格 -->
        <div class="practice-table-container">
          <table class="practice-table">
            <thead>
              <!-- 表头 -->
              <tr class="practice-list-head">
                <th class="practice-select">
                  <button class="square-container {state.selectAll ? 'checked' : ''}" onclick={toggleSelectAll}>
                    {#if state.selectAll}
                      <div class="check-square"></div>
                    {/if}
                  </button>
                </th>
                <th class="practice-name">名称</th>
                <th class="practice-total-score">总分</th>
                <th class="practice-avg-score">
                  <span class="header-text">平均分</span>
                  <span class="tooltip-container">
                    <svg class="info-icon" viewBox="0 0 16 16" width="14" height="14">
                      <circle cx="8" cy="8" r="7" fill="none" stroke="currentColor" stroke-width="1.5" />
                      <text x="8" y="12" text-anchor="middle" font-size="10" fill="currentColor">i</text>
                    </svg>
                    <div class="tooltip">计算方式:练习总分/练习次数</div>
                  </span>
                </th>
                <th class="practice-completed">作答人数</th>
                <th class="practice-passed">通过人数</th>
                <th class="practice-operation">操作</th>
              </tr>
            </thead>
            <tbody>
              {#if state.practices.length === 0}
                <tr>
                  <td colspan="7" class="no-data"
                    ><div class="empty-container">
                      <Empty text="暂无练习数据" />
                    </div></td
                  >
                </tr>
              {:else}
                {#each state.practices as practice (practice.id)}
                  <!-- 表格行 -->
                  <tr class="practice-list-row">
                    <td class="practice-select">
                      <button
                        class="square-container {state.selected[practice.id] ? 'checked' : ''}"
                        onclick={() => toggleSelect(practice.id)}
                      >
                        {#if state.selected[practice.id]}
                          <div class="check-square"></div>
                        {/if}
                      </button>
                    </td>
                    <td class="practice-name">{practice.name ?? '-'}</td>
                    <td class="practice-total-score">{practice.total_score ?? '-'}</td>
                    <td class="practice-avg-score">{practice.average_score ?? '-'}</td>
                    <td class="practice-completed">{practice.completed_students ?? '-'}</td>
                    <td class="practice-passed">{practice.passed_students ?? '-'}</td>
                    <td class="practice-operation">
                      <button class="detail-btn" onclick={() => handleDetailClick(practice.id)}>详情</button>
                    </td>
                  </tr>
                {/each}
              {/if}
            </tbody>
          </table>
        </div>
      {/if}
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
    min-width: 0;
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
    flex-wrap: wrap;
  }

  .filters {
    display: flex;
    align-items: center;
    gap: 5px;
    margin-right: 32px;
    flex-wrap: wrap;
  }

  .search-wrapper {
    flex: 1;
    min-width: 0;
  }

  .actions {
    display: flex;
    align-items: center;
    gap: 30px;
    color: #595959;
    font-size: 14px;

    .selection-info {
      display: flex;
      align-items: center;
      gap: 10px;
      white-space: nowrap;
      .count {
        color: #0052d9;
        font-weight: bold;
      }
    }

    .action-btn {
      padding: 0 16px;
      height: 32px;
      border: none;
      border-radius: 4px;
      color: white;
      cursor: pointer;
      font-size: 14px;
      transition: background-color 0.2s;
      white-space: nowrap;
      flex-shrink: 0;

      &.export {
        background-color: #0052d9;
        &:hover {
          background-color: #0041ad;
        }
      }

      &:disabled {
        background-color: #bbd3fb !important;
        cursor: not-allowed;
      }
    }
  }

  /* 表格样式 */
  .practice-table-container {
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

  .practice-table {
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

  /* 表头样式 */
  .practice-list-head {
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
  }

  /* 表头列样式 */
  .practice-select {
    width: 5%;
  }
  .practice-name {
    width: 35%;
  }
  .practice-total-score {
    width: 15%;
  }
  .practice-avg-score {
    width: 10%;
  }
  .practice-completed {
    width: 15%;
  }
  .practice-passed {
    width: 10%;
  }
  .practice-operation {
    width: 15%;
  }

  /* 表格行样式 */
  .practice-list-row {
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
  .detail-btn {
    color: #0052d9;
    background: none;
    border: none;
    cursor: pointer;
    padding: 4px 8px;
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
