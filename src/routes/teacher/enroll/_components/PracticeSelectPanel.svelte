<script>
  import UneditableHashTags from '$lib/components/Tag/UneditableHashTags.svelte';
  import Pagination from '$lib/components/Pagination/Pagination.svelte';
  import InputBox from '$lib/components/Input/InputBox.svelte';
  import Option from '$lib/components/Select/Option.svelte';
  import Button from '$lib/components/Button/Button.svelte';
  import Select from '$lib/components/Select/Select.svelte';
  import Empty from '$lib/components/Table/Empty.svelte';

  let {
    show = $bindable(false),
    onTestSelectFunc = () => {},
    selectedTestId = $bindable(null),
    paper_list = [],
  } = $props();

  let searchText = $state('');
  let tagSearchText = $state('');

  let selectedStructure = $state('全部');

  // 当前页的试卷，直接使用paper_list，不需要再次切片
  let currentPageTests = $derived(paper_list);

  // 分页相关
  let currentPage = $state(1);
  let pageSize = $state(10);
  let totalTests = $state(0);

  // 当选择特定页码时的处理函数
  /**
   * @param {number} pageNum - 要跳转的页码
   */
  function handlePageChoose(event) {
    if (event.detail !== currentPage) {
      currentPage = event.detail;
      fetchPaperList({
        name: searchText,
        tags: tagSearchText,
        assembly_type: selectedStructure,
        page: event.detail,
      });
    }
  }

  // 当选择每页条数时的处理函数
  /**
   * @param {string|number} value - 每页显示的条数
   */
  function handlePageSizeChange(event) {
    // 确保value是数字类型

    pageSize = event.detail;
    currentPage = 1; // 重置到第一页
    fetchPaperList({
      name: searchText,
      tags: tagSearchText,
      assembly_type: selectedStructure,
      page: '1',
      page_size: pageSize,
    });
  }

  // 选择试卷
  /**
   * @param {number} testId
   */
  function selectTest(testId) {
    selectedTestId = testId === selectedTestId ? null : testId;
  }

  // 确认选择
  function confirmSelection() {
    const selected = paper_list.find(
      (/** @type {{ID: number, Name: string, assembly_type: string}} */ test) => test.ID === selectedTestId,
    );
    if (selected) {
      // 确保传递正确的数据结构给父组件
      onTestSelectFunc({
        id: selected.ID,
        name: selected.Name,
        assembly_type: selected.assembly_type,
        suggest_duration: selected.SuggestedDuration,
      });
    }
    closeModal();
  }

  // 关闭弹窗
  function closeModal() {
    show = false;
  }

  /**
   * 获取试卷列表
   * @param {Object} params 查询参数对象
   * @param {string} [params.name] 试卷名称
   * @param {string} [params.tags] 试卷标签
   * @param {string} [params.assembly_type] 组卷方式
   * @param {string} [params.page] 页码
   * @param {string} [params.page_size] 每页数量
   * @returns {Promise<void>}
   */
  async function fetchPaperList(params = {}) {
    // 构造查询参数
    const searchParams = new URLSearchParams({
      name: params.name || '',
      tags: params.tags || '',
      page: params.page || String(currentPage),
      pageSize: params.page_size || String(pageSize),
      category: '02', // 默认分类
      ...(params.assembly_type && params.assembly_type !== '全部' ? { assembly_type: params.assembly_type } : {}),
    });

    // 发送带参数的GET请求
    const response = await fetch(`/api/paper?${searchParams}`, {
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
          totalTests = 0;
          return;
        }
        //获取试卷的记录
        const records = result.data;

        // 更新总数 - 从total_count字段获取
        totalTests = result.rowCount || 0;

        // 更新试卷列表
        paper_list = records.map((/** @type {any} */ item) => {
          // 处理时间格式
          let updateTimeObj = new Date(item.UpdateTime || item.CreateTime);
          let updateDate = updateTimeObj.toLocaleDateString('zh-CN').replace(/\//g, '-');
          let updateTime = updateTimeObj.toLocaleTimeString('zh-CN', {
            hour: '2-digit',
            minute: '2-digit',
          });

          // 创建日期只取年月日
          let createTimeObj = new Date(item.CreateTime || item.UpdateTime);
          let createDate = createTimeObj.toISOString().split('T')[0];

          return {
            ...item,
            assembly_type:
              item.AssemblyType === '00'
                ? '自定义组卷（经典巩固）'
                : item.AssemblyType === '02'
                  ? '随机组卷（随机组卷）'
                  : '智能刷题（智能提升）',
            level: item.Level === '00' ? '简单' : item.Level === '02' ? '中等' : '困难',
            // 添加格式化后的时间
            update_time: `${updateDate} ${updateTime}`,
            create_time: createDate,
            // 确保有tags属性
            tags: item.Tags || [],
            duration: item.SuggestedDuration,
          };
        });
      })
      .catch((error) => {
        console.error('获取试卷列表失败', error);
        paper_list = [];
        totalTests = 0;
        throw error;
      });
  }

  // 初始加载试卷
  $effect(() => {
    if (show) {
      fetchPaperList();
    }
  });

  // 搜索试卷
  function searchPapers() {
    currentPage = 1; // 重置到第一页
    fetchPaperList({
      name: searchText,
      tags: tagSearchText,
      assembly_type: selectedStructure,
      page: '1', // 重置到第一页
    });
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
              bind:value={searchText}
              onInput={searchPapers}
            />
          </div>
          <div class="search-item">
            <InputBox
              label="试卷标签"
              id="tag-search"
              type="text"
              placeholder="搜索试卷标签"
              bind:value={tagSearchText}
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
                <th class="select-cell"></th>
                <th class="name-cell">试卷名称</th>
                <th class="type-cell">组卷方式(练习类型)</th>
                <th class="count-cell">试题数量</th>
                <th class="score-cell">试卷总分</th>
                <th class="standard-cell">试卷标签</th>
                <th class="suggest-cell">建议时长(分钟)</th>
                <th class="diff-cell">试卷难度</th>
                <th class="update-cell">更新时间</th>
                <th class="create-cell">创建日期</th>
              </tr>
            </thead>
            <tbody>
              {#if currentPageTests.length > 0}
                {#each currentPageTests as test (test.ID)}
                  <tr class:selected={selectedTestId === test.ID} onclick={() => selectTest(test.ID)}>
                    <td class="select-cell">
                      <label class="custom-radio">
                        <input
                          type="radio"
                          name="test-selection"
                          value={test.ID}
                          checked={selectedTestId === test.ID}
                          onclick={() => selectTest(test.ID)}
                        />
                        <span class="radio-checkmark"></span>
                      </label>
                    </td>
                    <td class="name-cell">{test.Name}</td>
                    <td class="type-cell">{test.assembly_type}</td>
                    <td class="count-cell">{test.QuestionCount}</td>
                    <td class="score-cell">{test.TotalScore}</td>
                    <td class="standard-cell">
                      {#if test.tags.length > 0}
                        <UneditableHashTags tags={test.tags} />
                      {:else}
                        <span>--</span>
                      {/if}
                    </td>
                    <td class="suggest-cell">{test.SuggestedDuration}</td>
                    <td class="diff-cell">
                      <span
                        class={`level ${test.level === '简单' ? 'easy' : test.level === '中等' ? 'medium' : 'hard'}`}
                      >
                        {test.level}
                      </span>
                    </td>
                    <td class="update-cell">
                      <div class="date-time">
                        <div class="date">{test.update_time.split(' ')[0]}</div>
                        <div class="time">{test.update_time.split(' ')[1]}</div>
                      </div>
                    </td>
                    <td class="create-cell">{test.create_time}</td>
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
            total_items={totalTests}
            current_page={currentPage}
            page_size={pageSize}
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

        /* 各列宽度控制 */
        .select-cell {
          width: 40px;
        }
        .name-cell {
          width: 150px;
        }
        .type-cell {
          width: 200px;
        }
        .count-cell {
          width: 80px;
        }
        .score-cell {
          width: 80px;
        }
        .standard-cell {
          width: 150px;
        }
        .suggest-cell {
          width: 125px;
        }
        .diff-cell {
          width: 100px;
        }
        .update-cell {
          width: 150px;
        }
        .create-cell {
          width: 130px;
        }

        .level.easy {
          color: green;
        }
        .level.medium {
          color: orange;
        }
        .level.hard {
          color: red;
        }

        .select-cell {
          width: 20px;
          padding: 12px 0px;
          justify-content: left;
        }

        .level {
          padding: 2px 8px;
          border-radius: 2px;

          &.easy {
            color: #008000;
          }

          &.medium {
            color: #ffa500;
          }

          &.hard {
            color: #ff0000;
          }
        }

        .date-time {
          display: flex;
          flex-direction: column;
          gap: 2px;
          align-items: center;
          text-align: center;
          width: 100%;

          .date,
          .time {
            font-size: 14px;
            text-align: center;
          }
        }

        .standard-tag {
          display: inline-block;
          background-color: #ecf5ff;
          color: #409eff;
          padding: 0 5px;
          height: 22px;
          line-height: 22px;
          font-size: 12px;
          border-radius: 2px;
          margin-right: 5px;
          margin-bottom: 3px;
        }

        /* 自定义单选按钮 */
        .custom-radio {
          position: relative;
          display: inline-block;
          width: 12px;
          height: 12px;
          cursor: pointer;

          input {
            position: absolute;
            opacity: 0;
            cursor: pointer;
            height: 0;
            width: 0;
          }

          .radio-checkmark {
            position: absolute;
            top: 0;
            left: 0;
            height: 10px; /* 去掉边框的实际尺寸 */
            width: 10px; /* 去掉边框的实际尺寸 */
            background-color: white;
            border: 1px solid #0336ff;
            border-radius: 50%;
            box-sizing: content-box; /* 确保边框不计入尺寸 */

            &:after {
              content: '';
              position: absolute;
              display: none;
              top: 2px; /* 精确居中位置: (10px - 6px)/2 = 2px */
              left: 2px; /* 精确居中位置: (10px - 6px)/2 = 2px */
              width: 6px;
              height: 6px;
              border-radius: 50%;
              background: #0336ff;
            }
          }

          &:hover input ~ .radio-checkmark {
            background-color: #f0f7ff;
          }

          input:checked ~ .radio-checkmark {
            background-color: white;

            &:after {
              display: block;
            }
          }
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
