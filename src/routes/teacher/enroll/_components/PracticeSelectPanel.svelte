<script>
  import UneditableHashTags from '$lib/components/Tag/UneditableHashTags.svelte';
  import Pagination from '$lib/components/Pagination/Pagination.svelte';
  import InputBox from '$lib/components/Input/InputBox.svelte';
  import Option from '$lib/components/Select/Option.svelte';
  import Button from '$lib/components/Button/Button.svelte';
  import Select from '$lib/components/Select/Select.svelte';
  import Empty from '$lib/components/Table/Empty.svelte';

  let {
    show = $bindable(false), // 是否展示选择练习面板
    onTestSelectFunc = () => {}, // 处理练习选择事件
    selected_test_id = $bindable([]), // 试卷id
    paper_list = [], // 试卷列表数据
  } = $props();

  let search_text = $state(''); // 试卷关键词
  let tag_search_text = $state(''); // 试卷标签关键词
  let selected_structure = $state('全部'); // 练习类型
  let current_page_tests = $derived(paper_list); // 当前页面数据

  // 分页相关
  let current_page = $state(1);
  let page_size = $state(10);
  let total_tests = $state(0);

  // 选择试卷
  function selectTest(test_id) {
    if (!Array.isArray(selected_test_id)) {
      selected_test_id = [];
    }
    const index = selected_test_id.indexOf(test_id);
    if (index === -1) {
      selected_test_id = [...selected_test_id, test_id];
    } else {
      selected_test_id = selected_test_id.filter((id) => id !== test_id);
    }
  }

  // 搜索试卷
  function searchPapers() {
    current_page = 1; // 重置到第一页
    fetchPaperList({
      name: search_text,
      tags: tag_search_text,
      assembly_type: selected_structure,
      page: '1', // 重置到第一页
    });
  }

  // 确认选择
  function confirmSelection() {
    const selected = paper_list.filter((test) => selected_test_id.includes(test.ID));

    if (selected.length > 0) {
      // 传递选中试卷数组给父组件
      onTestSelectFunc(
        selected.map((test) => ({
          id: test.ID,
          name: test.Name,
          assembly_type: test.assembly_type,
          suggest_duration: test.SuggestedDuration,
        })),
      );
    }

    closeModal();
  }

  // 关闭弹窗
  function closeModal() {
    show = false;
  }

  // 当选择特定页码时的处理函数
  function handlePageChoose(event) {
    if (event.detail !== current_page) {
      current_page = event.detail;
      fetchPaperList({
        name: search_text,
        assembly_type: selected_structure,
        page: event.detail,
      });
    }
  }

  // 当选择每页条数时的处理函数
  function handlePageSizeChange(event) {
    page_size = event.detail;
    current_page = 1; // 重置到第一页
    fetchPaperList({
      name: search_text,
      page: '1',
      page_size: page_size,
    });
  }

  /**
   * 获取试卷列表
   * @param {Object} params 查询参数对象
   * @param {string} [params.name] 试卷名称
   * @param {string} [params.assembly_type] 组卷方式
   * @param {string} [params.page] 页码
   * @param {string} [params.page_size] 每页数量
   * @returns {Promise<void>}
   */
  async function fetchPaperList(params = {}) {
    // 构造查询参数
    const searchParams = new URLSearchParams({
      page: params.page || String(current_page),
      page_size: params.page_size || String(page_size),
      teacher_name: '',
      practice_name: '',
    });

    // 发送带参数的GET请求
    const response = await fetch(`/api/registerPractice?${searchParams}`, {
      method: 'GET',
      credentials: 'include',
    })
      .then((response) => {
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        return response.json();
      })
      .then((result) => {
        if (!result.data) {
          paper_list = [];
          total_tests = 0;
          return;
        }
        //获取试卷的记录
        const records = result.data.practices || [];

        // 更新总数
        total_tests = result.data.total || 0;

        // 更新试卷列表
        paper_list = records.map((item) => {
          let updateTimeObj = new Date(item.UpdateTime || item.CreateTime);
          let createTimeObj = new Date(item.CreateTime || item.UpdateTime);

          return {
            ...item,
            assembly_type: item.Type === '00' ? '经典巩固' : item.Type === '02' ? '随机组卷' : '智能刷题',
            correct_mode: item.CorrectMode === '00' ? 'AI批改' : item.CorrectMode === '10' ? '手动批改' : '未知',

            // 格式化后的时间
            update_time: formatDateTime(updateTimeObj),
            create_time: formatDateTime(createTimeObj),

            tags: item.Tags || [],
            duration: item.SuggestedDuration,
          };
        });
      })
      .catch((error) => {
        console.error('获取试卷列表失败', error);
        paper_list = [];
        total_tests = 0;
        throw error;
      });
  }

  // 初始加载试卷
  $effect(() => {
    if (show) {
      fetchPaperList();
    }
  });

  // 格式化日期时间：yyyy-mm-dd HH:MM:SS
  function formatDateTime(date) {
    if (!(date instanceof Date) || isNaN(date)) return '';
    const pad = (n) => String(n).padStart(2, '0');
    const yyyy = date.getFullYear();
    const mm = pad(date.getMonth() + 1);
    const dd = pad(date.getDate());
    const HH = pad(date.getHours());
    const MM = pad(date.getMinutes());
    const SS = pad(date.getSeconds());
    return `${yyyy}-${mm}-${dd} ${HH}:${MM}:${SS}`;
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
        <h2>选择练习试卷</h2>
        <button class="close-btn" onclick={closeModal}>×</button>
      </div>

      <!-- 搜索区域 -->
      <div class="search-container">
        <div class="search-items">
          <div class="search-item">
            <InputBox
              label="试卷名称"
              id="search-text"
              type="text"
              placeholder="搜索试卷名称"
              bind:value={search_text}
              onInput={searchPapers}
            />
          </div>
          <div class="search-item">
            <InputBox
              label="试卷标签"
              id="tag-search"
              type="text"
              placeholder="搜索试卷标签"
              bind:value={tag_search_text}
              onInput={searchPapers}
            />
          </div>
        </div>
      </div>

      <!-- 表格主体 -->
      <div class="modal-body">
        <div class="table-wrapper">
          <table class="test-table">
            <thead>
              <tr>
                <th style="width: 10%"></th>
                <th style="width: 15%">试卷名称</th>
                <th style="width: 15%">练习类型</th>
                <th style="width: 10%">批改方式</th>
                <th style="width: 10%">创建教师</th>
                <th style="width: 20%">更新时间</th>
                <th style="width: 20%">创建日期</th>
              </tr>
            </thead>
            <tbody>
              {#if current_page_tests.length > 0}
                {#each current_page_tests as test (test.ID)}
                  <tr class:selected={selected_test_id.includes(test.ID)} onclick={() => selectTest(test.ID)}>
                    <td>
                      <label class="custom-checkbox">
                        <input
                          type="checkbox"
                          name="test-selection"
                          value={test.ID}
                          checked={selected_test_id.includes(test.ID)}
                          onclick={() => selectTest(test.ID)}
                        />
                        <span class="checkbox-checkmark"></span>
                      </label>
                    </td>
                    <td>{test.Name}</td>
                    <td>{test.assembly_type}</td>
                    <td>{test.correct_mode}</td>
                    <td>{test.TeacherName}</td>
                    <td>{test.update_time}</td>
                    <td>{test.create_time}</td>
                  </tr>
                {/each}
              {:else}
                <tr>
                  <td colspan="10">
                    <div class="empty-wrapper">
                      <Empty text="暂无试卷数据" />
                    </div>
                  </td>
                </tr>
              {/if}
            </tbody>
          </table>
        </div>

        <!-- 分页 -->
        <div class="pagination-container">
          <div class="total-count"></div>
          <Pagination
            total_items={total_tests}
            {current_page}
            {page_size}
            page_size_options={[5, 10, 20]}
            on:pageChange={handlePageChoose}
            on:pageSizeChange={handlePageSizeChange}
          />
        </div>
      </div>

      <!-- 底部按钮 -->
      <div class="modal-footer">
        <Button type="info" onclick={closeModal}>取消</Button>
        <Button onclick={confirmSelection}>确定</Button>
      </div>
    </div>
  </div>
{/if}

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
    z-index: 10000;
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
    align-items: flex-start;

    .search-items {
      display: flex;
      gap: 16px;
      flex-wrap: wrap;
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
    justify-content: space-between;
    align-items: center;
    margin-top: 16px;
    padding: 0 16px 16px;

    .total-count {
      font-size: 14px;
      color: #606266;
    }
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
