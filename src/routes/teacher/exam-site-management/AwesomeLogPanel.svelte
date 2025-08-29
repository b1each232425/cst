<!--
/**
 * AwesomeLogPanel 组件使用规范
 * 
 * 这是一个功能强大的日志显示面板组件，支持两种使用模式：
 * 
 * 1. 静态数据模式（适用于一次性加载所有数据的场景）：
 *    operationLogPanel.showLogPanel(logs)
 *    
 *    参数说明：
 *    - logs: 日志数组，每个日志对象包含以下字段：
 *      {
 *        id: number,           // 日志ID
 *        module: string,       // 模块名称
 *        entity_id: number,    // 实体ID
 *        content: string[],    // 操作内容（字符串数组）
 *        creator: number,      // 创建者ID
 *        creator_account: string,  // 创建者账号
 *        creator_name: string,     // 创建者姓名
 *        create_time: string       // 创建时间
 *      }
 * 
 * 2. 分页模式（适用于大数据量场景，支持服务端分页）：
 *    operationLogPanel.showLogPanelWithPagination(fetchLogsFunc)
 *    
 *    参数说明：
 *    - fetchLogsFunc: 获取日志数据的异步函数，函数签名如下：
 *      async function fetchLogsFunc(page: number, page_size: number): Promise<{
 *        data: LogItem[],  // 日志数据数组
 *        total: number     // 总记录数
 *      }>
 *    
 *    函数要求：
 *    - 接收两个参数：page（页码，从1开始）和 page_size（每页数量）
 *    - 返回Promise，resolve的值必须包含data和total字段
 *    - data字段为当前页的日志数组
 *    - total字段为总记录数，用于计算分页信息
 *    - 如果请求失败，应该throw Error，组件会自动处理错误
 * 
 * 使用示例：
 * 
 * // 静态数据模式
 * const logs = [...];
 * operationLogPanel.showLogPanel(logs);
 * 
 * // 分页模式
 * async function fetchLogs(page, page_size) {
 *   const response = await fetch(`/api/logs?page=${page}&page_size=${page_size}`);
 *   const result = await response.json();
 *   return {
 *     data: result.data,
 *     total: result.rowCount
 *   };
 * }
 * operationLogPanel.showLogPanelWithPagination(fetchLogs);
 */
-->

<script>
    import Pagination from "./Pagination.svelte";
    import { formatISOString } from "$lib/utils/time_utils";

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
    let logDatas = $state([]);

    /**
     * @description: 是否显示日志面板
     * @type {boolean}
     */
    let show_log_panel = $state(false);

    /**
     * @description: 分页相关状态
     */
    let currentPage = $state(1);
    let pageSize = $state(10);
    let totalItems = $state(0);
    let totalPages = $state(0);

    /**
     * @description: 获取日志数据的函数
     * @type {Function|null}
     */
    let fetchLogsFunc = $state(null);

    /**
     * @description: 是否启用分页模式
     * @type {boolean}
     */
    let paginationMode = $state(false);

    /**
     * @description: 加载状态
     * @type {boolean}
     */
    let loading = $state(false);

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
    let currentPageLogs = $derived(getPageLogs());

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
        paginationMode = false;
        fetchLogsFunc = null;
        logDatas = logs || [];
        totalItems = logDatas.length;
        totalPages = Math.ceil(totalItems / pageSize);
        currentPage = 1; // 重置到第一页
        show_log_panel = true;
    };

    /**
     * @description：显示日志面板（分页模式）
     * @param {Function} fetchFunc - 获取日志的函数，接收(page, page_size)参数，返回Promise
     */
    export const showLogPanelWithPagination = async (fetchFunc) => {
        paginationMode = true;
        fetchLogsFunc = fetchFunc;
        currentPage = 1;
        pageSize = 10;
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
        if (paginationMode) {
            // 分页模式下直接返回当前数据
            return logDatas;
        } else {
            // 静态数据模式下进行客户端分页
            const startIndex = (currentPage - 1) * pageSize;
            const endIndex = Math.min(startIndex + pageSize, logDatas.length);
            return logDatas.slice(startIndex, endIndex);
        }
    }

    /**
     * @description: 加载分页数据
     */
    async function loadPageData() {
        if (!paginationMode || !fetchLogsFunc) return;

        loading = true;
        try {
            const result = await fetchLogsFunc(currentPage, pageSize);
            if (result && result.data) {
                logDatas = result.data;
                totalItems = result.total || 0;
                totalPages = Math.ceil(totalItems / pageSize);
            }
        } catch (error) {
            console.error('加载日志数据失败:', error);
            logDatas = [];
            totalItems = 0;
            totalPages = 0;
        } finally {
            loading = false;
        }
    }

    /**
     * @description: 处理页面导航（上一页/下一页）
     * @param {boolean} is_next - 是否下一页
     */
    async function handlePageNavigation(is_next) {
        if (is_next && currentPage < totalPages) {
            currentPage++;
        } else if (!is_next && currentPage > 1) {
            currentPage--;
        }

        if (paginationMode) {
            await loadPageData();
        }
    }

    /**
     * @description: 处理页面选择
     * @param {number} page_num - 页码
     */
    async function handlePageSelect(page_num) {
        if (page_num >= 1 && page_num <= totalPages) {
            currentPage = page_num;
            if (paginationMode) {
                await loadPageData();
            }
        }
    }

    /**
     * @description: 处理每页显示数量变化
     * @param {number|Object} option - 选项值或选项对象
     */
    async function handlePageSizeChange(option) {
        // 兼容处理：如果传入的是对象且包含value属性，取其value属性；如果是数字，直接使用
        if (typeof option === 'object' && option !== null && 'value' in option) {
            const numValue = Number(option.value);
            if (!isNaN(numValue)) {
                pageSize = numValue;
            } else {
                console.warn('handlePageSizeChange: option.value不是有效的数字', option.value);
            }
        } else if (typeof option === 'number') {
            pageSize = option;
        } else {
            console.warn('handlePageSizeChange: 无效的option参数', option);
            return;
        }

        totalPages = Math.ceil(totalItems / pageSize);
        currentPage = 1; // 重置到第一页

        if (paginationMode) {
            await loadPageData();
        }
    }

    /**
     * @description: 处理页码搜索
     * @param {string} page_str - 页码字符串
     */
    async function handlePageSearch(page_str) {
        const page_num = parseInt(page_str);
        if (!isNaN(page_num) && page_num >= 1 && page_num <= totalPages) {
            currentPage = page_num;
            if (paginationMode) {
                await loadPageData();
            }
        }
    }
</script>

<div class="modal" style="display: {show_log_panel ? 'flex' : 'none'};">
    <div class="Panel">
        <div class="topBar">
            <span class="title">操作日志</span>
            <button
                    class="closeBtn"
                    onclick={async () => {
                    show_log_panel = false;
                }}>X</button
            >
        </div>
        <div class="logView">
            {#if loading}
                <div class="loadingContainer">
                    <div class="loadingText">加载中...</div>
                </div>
            {:else}
                {#each currentPageLogs as logData}
                    <div class="logItem">
                        <div class="logHeader">
                            <span class="userInfo"
                                  title={`用户帐号: ${logData.creator_account || '未知账号'} | 用户名: ${logData.creator_name || '未知用户'} | 用户ID: ${logData.creator || '未知用户ID'}`}
                            >
                                用户帐号: {logData.creator_account || '未知账号'} | 用户名: {logData.creator_name || '未知用户'} | 用户ID: {logData.creator || '未知用户ID'}
                            </span>
                        </div>
                        <div class="logContent">
                            {#if Array.isArray(logData.content)}
                                {#each logData.content as contentItem}
                                    <div class="contentItem">{contentItem}</div>
                                {/each}
                            {:else if logData.content}
                                <div class="contentItem">{logData.content}</div>
                            {/if}
                        </div>
                        <div class="logFooter">
                            <span class="timeStr">[{formatISOString(logData.create_time)}]</span>
                        </div>
                    </div>
                {/each}
                {#if currentPageLogs.length === 0}
                    <div class="emptyLog">暂无日志数据</div>
                {/if}
            {/if}
        </div>
        <div class="paginationContainer">
            <Pagination
                    total_data_num={totalItems}
                    total_page_num={totalPages}
                    current_page_num={currentPage}
                    max_show_page_num={5}
                    data_num_per_page_options={[
                    { value: 10, label: "10条/页" },
                    { value: 20, label: "20条/页" },
                    { value: 50, label: "50条/页" },
                ]}
                    selected={pageSize}
                    onPageChangeFunc={handlePageNavigation}
                    onPageChooseFunc={handlePageSelect}
                    selectOptionFunc={handlePageSizeChange}
                    onPageSearchFunc={handlePageSearch}
                    expand_direction="up"
            />
        </div>
    </div>
</div>

<style lang="scss" scoped>
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
  .logStr {
    white-space: pre-wrap;
    word-break: break-word;
    font-size: 15px;
    width: 100%;
    box-sizing: border-box;
    display: block;
  }
  .modal {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background-color: rgba(0, 0, 0, 0.5);
    justify-content: center;
    align-items: center;
    z-index: 100;

    .Panel {
      background-color: white;
      border-radius: 8px;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
      width: 560px;
      max-width: 90%;
      padding: 20px;
      display: flex;
      flex-direction: column;
      gap: 20px;

      height: 600px;
      max-height: 90%;

      .topBar {
        .title {
          font-size: 18px;
          font-weight: bold;
        }

        .closeBtn {
          font-size: 18px;
        }

        display: flex;
        justify-content: space-between;
      }

      .logView {
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

      .logItem {
        font-family: SimSun, Microsoft YaHei, serif;
        border-radius: 8px;
        box-shadow: 0 2px 8px rgba(0,0,0,0.06);
        margin-bottom: 16px;
        padding: 16px 18px 12px 18px;
        background: #fff;
        transition: box-shadow 0.2s;
        border: 1px solid #f0f0f0;
      }

      .logHeader {
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

      .userInfo {
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

      .logContent {
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
        .contentItem {
          margin-bottom: 2px;
          line-height: 1.6;
          color: #333;
          word-break: break-all;
        }
        .contentItem:last-child {
          margin-bottom: 0;
        }
      }

      .logFooter {
        display: flex;
        justify-content: flex-end;
        margin-top: 8px;
      }

      .timeStr {
        color: var(--blue);
        font-size: 15px;
        font-family: 'Consolas', 'Menlo', monospace;
        font-weight: bold;
        letter-spacing: 0.5px;
      }

      .emptyLog {
        text-align: center;
        padding: 20px;
        color: #999;
        font-style: italic;
      }

      .loadingContainer {
        display: flex;
        justify-content: center;
        align-items: center;
        padding: 40px;
        min-height: 200px;
      }

      .loadingText {
        color: #666;
        font-size: 16px;
        font-weight: 500;
      }

      .paginationContainer {
        margin-top: 10px;
        display: flex;
        justify-content: flex-end;
      }

      .bottomBar {
        display: flex;
        justify-content: flex-end;
      }
    }

    .confirmBtn {
      background-color: #007bff;
      color: white;
      border: none;
      padding: 8px 16px;
      border-radius: 4px;
      cursor: pointer;
      font-size: 14px;
      transition: all 0.3s;

      &:hover {
        background-color: #0056b3;
      }
    }
  }
</style>