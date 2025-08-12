<!--
  DiaryLogPanel 组件使用规范

  这是一个功能强大的日志显示面板组件，支持两种使用模式：

  1. 静态数据模式（适用于一次性加载所有数据的场景）：
     operationLogPanel.showLogPanel(logs)

     参数说明：
     - logs: 日志数组，每个日志对象包含以下字段：
       {
         id: number,           // 日志ID
         module: string,       // 模块名称
         entity_id: number,    // 实体ID
         content: string[],    // 操作内容（字符串数组）
         creator: number,      // 创建者ID
         creator_account: string,  // 创建者账号
         creator_name: string,     // 创建者姓名
         create_time: string       // 创建时间
       }

  2. 分页模式（适用于大数据量场景，支持服务端分页）：
     operationLogPanel.showLogPanelWithPagination(fetchLogsFunc)

     参数说明：
     - fetchLogsFunc: 获取日志数据的异步函数，函数签名如下：
       async function fetchLogsFunc(): Promise<{
         data: LogItem[],  // 日志数据数组
         total: number     // 总记录数
       }>

     函数要求：
     - 返回Promise，resolve的值必须包含data和total字段
     - data字段为当前页的日志数组
     - total字段为总记录数，用于计算分页信息

  使用示例：
  import DiaryLogPanel from '$lib/components/DiaryLogPanel/DiaryLogPanel.svelte';

  // 开启日志框
  let operationLogPanel; //创建日志对象

  // 静态数据模式
  const logs = [...];

  // 调用showLogPanel并传入数据即可打开日志框
  operationLogPanel.showLogPanel(logs);

  ---------------------------------------------------------------------------------------------

  // 分页模式
  let diary_current_page = $state(1); // 当前页数
  let diary_page_size = $state(10); // 当前页面大小

  async function fetchLogs() {
    // 发请求获取当前页面数据
    const response = await fetch(`/api/logs?page=${diary_current_page}&page_size=${diary_page_size}`);
    const result = await response.json();
    return {
      data: result.data, // 返回需要日志框展示的数据
      total: result.rowCount // 返回一共有多少条数据
    };
  }

  // 调用showLogPanelWithPagination并传入所需函数即可打开日志框
  operationLogPanel.showLogPanelWithPagination(fetchLogs);

  // 页数变化
  function handlePageChange(event) {
    // 获取最新的当前页数
    diary_current_page = event.detail;
    // 刷新日志框
    operationLogPanel.showLogPanelWithPagination(fetchLogs);
  }

  // 页数大小变化
  function handlePageSizeChange(event) {
    // 获取最新的页面大小
    diary_page_size = event.detail;
    // 刷新日志框
    operationLogPanel.showLogPanelWithPagination(fetchLogs);
  }

  -----------------------------------------------------------------------------------------

  <DiaryLogPanel
    bind:this={operationLogPanel}
    on:diaryPageChange={handlePageChange}
    on:diaryPageSizeChange={handlePageSizeChange}
  ></DiaryLogPanel>
-->
<script>
  import Pagination from '../Pagination/Pagination.svelte';
  import { formatISOString } from '$lib/utils/time_utils';
  import { createEventDispatcher } from 'svelte';

  // 创建事件分发器
  const dispatch = createEventDispatcher();

  /**
   * @description: 日志数据
   * @type {{
   * id: number,
   * module: string,
   * entity_id: number,
   * content: string[],
   * creator: number,
   * creator_account: string,
   * creator_name: string,
   * create_time: string
   * }[]}
   */
  let log_data = $state([]);

  /**
   * @description: 是否显示日志面板
   * @type {boolean}
   */
  let show_log_panel = $state(false);

  /**
   * @description: 分页相关状态
   */
  let current_page = $state(1);
  let page_size = $state(10);
  let total_items = $state(0);

  /**
   * @description: 获取日志数据的函数
   * @type {Function|null}
   */
  let fetch_logs_func = $state(null);

  /**
   * @description: 是否启用分页模式
   * @type {boolean}
   */
  let pagination_mode = $state(false);

  /**
   * @description: 当前页显示的日志
   * @type {{
   * id: number,
   * module: string,
   * entity_id: number,
   * content: string[],
   * creator: number,
   * creator_account: string,
   * creator_name: string,
   * create_time: string
   * }[]}
   */
  let current_page_logs = $derived(getPageLogs());

  /**
   * @description：显示日志面板（静态数据模式）
   * @param {{
   * id: number,
   * module: string,
   * entity_id: number,
   * content: string[],
   * creator: number,
   * creator_account: string,
   * creator_name: string,
   * create_time: string
   * }[]} logs - 操作日志数组
   */
  export const showLogPanel = (logs) => {
    pagination_mode = false;
    fetch_logs_func = null;
    log_data = logs || [];
    total_items = log_data.length;
    current_page = 1;
    show_log_panel = true;
  };

  /**
   * @description：显示日志面板（分页模式）
   * @param {Function} fetchFunc - 获取日志的函数，接收(page, page_size)参数，返回Promise
   */
  export const showLogPanelWithPagination = async (fetchFunc) => {
    pagination_mode = true;
    fetch_logs_func = fetchFunc;
    current_page = 1;
    page_size = 10;
    show_log_panel = true;
    await loadPageData();
  };

  /**
   * @description: 获取当前页的日志
   * @returns {{
   * id: number,
   * module: string,
   * entity_id: number,
   * content: string[],
   * creator: number,
   * creator_account: string,
   * creator_name: string,
   * create_time: string
   * }[]}
   */
  function getPageLogs() {
    if (pagination_mode) {
      // 分页模式下直接返回当前数据
      return log_data;
    } else {
      // 静态数据模式下进行客户端分页
      const start_index = (current_page - 1) * page_size;
      const end_index = Math.min(start_index + page_size, log_data.length);
      return log_data.slice(start_index, end_index);
    }
  }

  /**
   * @description: 加载分页数据
   */
  async function loadPageData() {
    if (!pagination_mode || !fetch_logs_func) return;

    try {
      const result = await fetch_logs_func();
      if (result && result.data) {
        log_data = result.data;
        total_items = result.total || 0;
      }
    } catch (error) {
      console.error('加载日志数据失败:', error);
      log_data = [];
      total_items = 0;
    }
  }

  // 页数变化
  function handlePageChange(event) {
    current_page = event.detail;
    dispatch('diaryPageChange', current_page);
  }

  // 页数大小变化
  function handlePageSizeChange(event) {
    page_size = event.detail;
    dispatch('diaryPageSizeChange', page_size);
  }
</script>

<div class="modal" style="display: {show_log_panel ? 'flex' : 'none'};">
  <div class="panel">
    <div class="top-bar">
      <span class="title">操作日志</span>
      <button
        class="close-btn"
        onclick={async () => {
          show_log_panel = false;
        }}
      >
        <img src="/clear/delete.svg" alt="" />
      </button>
    </div>
    <div class="log-view">
      {#each current_page_logs as log_data}
        <div class="log-item">
          <div class="log-header">
            <span
              class="user-info"
              title={`用户帐号: ${log_data.creator_account || '未知账号'} | 用户名: ${log_data.creator_name || '未知用户'} | 用户ID: ${log_data.creator || '未知用户ID'}`}
            >
              用户帐号: {log_data.creator_account || '未知账号'} | 用户名: {log_data.creator_name || '未知用户'} | 用户ID:
              {log_data.creator || '未知用户ID'}
            </span>
          </div>
          <div class="log-content">
            {#if Array.isArray(log_data.content)}
              {#each log_data.content as content_item}
                <div class="content-item">{content_item}</div>
              {/each}
            {:else if log_data.content}
              <div class="content-item">{log_data.content}</div>
            {/if}
          </div>
          <div class="log-footer">
            <span class="time-str">[{formatISOString(log_data.create_time)}]</span>
          </div>
        </div>
      {/each}
      {#if current_page_logs.length === 0}
        <div class="empty-log">暂无日志数据</div>
      {/if}
    </div>
    <div class="pagination-container">
      <Pagination {total_items} on:pageChange={handlePageChange} on:pageSizeChange={handlePageSizeChange} />
    </div>
  </div>
</div>

<style lang="scss" scoped>
  .modal {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background-color: rgba(0, 0, 0, 0.5);
    justify-content: center;
    align-items: center;
    z-index: 1005;

    .panel {
      background-color: white;
      border-radius: 8px;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
      width: 650px;
      height: 650px;
      max-width: 90%;
      padding: 20px;
      display: flex;
      flex-direction: column;
      gap: 20px;

      max-height: 90%;

      .top-bar {
        .title {
          font-size: 18px;
          font-weight: bold;
        }

        .close-btn {
          font-size: 18px;

          img {
            width: 25px;
          }
        }

        display: flex;
        justify-content: space-between;
      }

      .log-view {
        flex-grow: 1;
        overflow-y: auto;
        padding: 10px;
        background-color: #f9f9f9;
        border-top: 1px solid #ccc;
        border-bottom: 1px solid #ccc;
        font-family: Arial, sans-serif;
        font-size: 14px;

        display: flex;
        flex-direction: column;

        scrollbar-gutter: stable both-edges;
      }

      .log-item {
        font-family:
          SimSun,
          Microsoft YaHei,
          serif;
        border-radius: 8px;
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
        margin-bottom: 16px;
        padding: 16px 18px 12px 18px;
        background: #fff;
        transition: box-shadow 0.2s;
        border: 1px solid #f0f0f0;
      }

      .log-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        font-weight: 600;
        font-size: 15px;
        color: #222;
        margin-bottom: 8px;
        white-space: nowrap;
        overflow: hidden;
        gap: 8px;
      }

      .user-info {
        color: #333;
        text-align: left;
        font-size: 14px;
        font-weight: 500;
        flex: 1;
        text-overflow: ellipsis;
        overflow: hidden;
        white-space: nowrap;
        justify-content: flex-start;
      }

      .log-content {
        background: #f6f8fa;
        border-radius: 5px;
        padding: 10px 14px;
        margin-left: 0;
        font-size: 14px;
        color: #444;
        line-height: 1.7;
        font-family: 'Microsoft YaHei', Arial, sans-serif;
        box-sizing: border-box;
        margin-bottom: 2px;
        .content-item {
          margin-bottom: 2px;
          line-height: 1.6;
          color: #333;
          word-break: break-all;
        }
        .content-item:last-child {
          margin-bottom: 0;
        }
      }

      .log-footer {
        display: flex;
        justify-content: flex-end;
        margin-top: 8px;
      }

      .time-str {
        color: var(--blue);
        font-size: 15px;
        font-family: 'Consolas', 'Menlo', monospace;
        font-weight: bold;
        letter-spacing: 0.5px;
      }

      .empty-log {
        text-align: center;
        padding: 20px;
        color: #999;
        font-style: italic;
      }

      .pagination-container {
        display: flex;
        justify-content: flex-end;
      }
    }
  }

  button {
    margin: 0;
    padding: 0;
    border: 0;
    background-color: transparent;
    cursor: pointer;
    user-select: none;

    &:focus {
      outline: none;
    }
  }
</style>
