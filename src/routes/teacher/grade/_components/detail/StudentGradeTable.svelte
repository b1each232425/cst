<script>
  import { onMount, getContext } from 'svelte';
  import Pagination from '$lib/components/Pagination/Pagination.svelte';
  import InputBox from '$lib/components/Input/InputBox.svelte';
  import Empty from '$lib/components/Table/Empty.svelte';

  /**
   * @typedef {Object} Props
   * @property {'practice' | 'exam'} type - 类型
   * @property {number} resourceId - 资源ID
   * @property {Array} [papers] - 试卷信息（考试类型需要）
   */

  /**
   * @type {Props}
   */
  let { type, resourceId, papers = [] } = $props();

  // 获取 Context 数据
  let contextData = $state(null);
  try {
    if (type === 'practice') {
      const context = getContext('practice');
      contextData = context?.practiceData;
    } else {
      const context = getContext('exam');
      contextData = context?.examData;
    }
  } catch {
    // Context 不存在时忽略
  }

  // 状态变量（按照旧项目命名）
  let currentData = $state([]);
  let searchParams = $state({
    examID: type === 'exam' ? resourceId : undefined,
    practiceID: type === 'practice' ? resourceId : undefined,
    keyword: '',
    page: 1,
    pageSize: 10,
  });

  let paginationConfig = $state({
    total_data_num: 100,
    total_page_num: 10,
    current_page_num: 1,
    max_show_page_num: 5,
    show_per_page: true,
    data_num_per_page_options: [
      { value: 10, label: '10条/页' },
      { value: 20, label: '20条/页' },
    ],
    selected: 10,
    dropdown_open: false,
    expand_direction: 'up',
  });

  let isfolded = $state(false);
  let isLoading = $state(true);
  let searchTimeout = null;
  let searchKeyword = $state('');

  // 切换折叠状态
  function toggleFold() {
    isfolded = !isfolded;
  }

  /**
   * 更新分页配置
   */
  function updatePagination(number) {
    paginationConfig.total_data_num = number;
    paginationConfig.total_page_num = Math.ceil(paginationConfig.total_data_num / paginationConfig.selected);
  }

  /**
   * 合并学生成绩（考试类型）
   */
  function mergeStudentGrades(data) {
    const map = new Map();

    for (const item of data) {
      if (!map.has(item.stu_id)) {
        map.set(item.stu_id, {
          stu_id: item.stu_id,
          exam_id: item.exam_id,
          phone: item.phone,
          nickname: item.nickname,
          name: item.name,
          scores: [
            {
              exam_session_id: item.exam_session_id,
              score: item.score,
            },
          ],
          total_score: item.score ?? 0,
          remark: item.remark,
        });
      } else {
        const existing = map.get(item.stu_id);
        if (existing) {
          existing.scores.push({
            exam_session_id: item.exam_session_id,
            score: item.score,
          });
          existing.total_score += item.score ?? 0;
        }
      }
    }

    return Array.from(map.values());
  }

  /**
   * 获取数据
   */
  async function fetchData() {
    try {
      isLoading = true;
      currentData = [];

      let url;
      if (type === 'practice') {
        url = `/api/teacher/practice-grade/examinee-grade-list?practiceID=${searchParams.practiceID}&page=${searchParams.page}&pageSize=${searchParams.pageSize}&keyword=${encodeURIComponent(searchParams.keyword)}`;
      } else {
        url = `/api/teacher/exam-grade/examinee-grade-list?examID=${searchParams.examID}&page=${searchParams.page}&pageSize=${searchParams.pageSize}&keyword=${encodeURIComponent(searchParams.keyword)}`;
      }

      const response = await fetch(url, {
        method: 'GET',
        credentials: 'include',
      });

      const response_data = await response.json();
      if (response_data.status < 0) {
        throw new Error(response_data.msg);
      }

      if (type === 'practice') {
        const data = response_data.data || [];
        currentData = data.map((item) => ({
          stuId: item.stu_id || 0,
          phone: item.phone || '-',
          nickname: item.nickname || '-',
          name: item.name || '-',
          highestScore: item.highest_score || 0,
          submitCount: item.submitted_cnt || 0,
          remark: item.remark || '-',
        }));
        const total = response_data.row_count || 0;
        updatePagination(total);
      } else {
        const data = response_data.data;
        currentData = mergeStudentGrades(data);
        const total = Math.ceil(response_data.row_count / (contextData?.papers?.length || 1));
        updatePagination(total);
      }

      isLoading = false;
    } catch (error) {
      console.error('Error fetching data:', error);
      isLoading = false;
    }
  }

  /**
   * 搜索功能
   */
  function handleSearch(keyword) {
    if (searchTimeout) {
      clearTimeout(searchTimeout);
    }

    searchTimeout = setTimeout(async () => {
      searchParams.page = 1;
      searchParams.keyword = keyword;
      await fetchData();

      clearTimeout(searchTimeout);
      searchTimeout = null;
    }, 500);
  }

  /**
   * 处理页码变化
   */
  async function handlePageChange(is_next) {
    const new_page = is_next
      ? Math.min(paginationConfig.total_page_num, paginationConfig.current_page_num + 1)
      : Math.max(1, paginationConfig.current_page_num - 1);

    if (new_page !== paginationConfig.current_page_num) {
      paginationConfig.current_page_num = new_page;
      searchParams.page = new_page;
      await fetchData();
    }
  }

  /**
   * 处理页码选择
   */
  async function handlePageChoose(page_num) {
    if (page_num !== paginationConfig.current_page_num && page_num > 0 && page_num <= paginationConfig.total_page_num) {
      paginationConfig.current_page_num = page_num;
      searchParams.page = page_num;
      await fetchData();
    }
  }

  /**
   * 处理每页显示条数变化
   */
  async function handlePageSizeChange(value) {
    const size_value = typeof value === 'string' ? parseInt(value) : value;
    paginationConfig.show_per_page = true;
    paginationConfig.current_page_num = 1;
    paginationConfig.selected = size_value;
    searchParams.pageSize = size_value;
    searchParams.page = 1;
    await fetchData();
  }

  /**
   * 处理页码搜索
   */
  async function handlePageSearch(value) {
    const page_num = parseInt(value);
    if (!isNaN(page_num) && page_num > 0 && page_num <= paginationConfig.total_page_num) {
      paginationConfig.current_page_num = page_num;
      searchParams.page = page_num;
      await fetchData();
    }
  }

  /**
   * 分数颜色判断
   */
  function getScoreClass(score, totalScore) {
    if (score < totalScore * 0.6) {
      return 'red';
    } else {
      return 'green';
    }
  }

  // 搜索防抖处理
  $effect(() => {
    if (searchKeyword !== undefined) {
      handleSearch(searchKeyword);
    }
  });

  // 初始化
  onMount(async () => {
    await fetchData();
  });
</script>

<div class="student-scores-card">
  <div class="card-header">
    <button class="card-title-button" onclick={toggleFold}>
      {#if isfolded}
        <img src="/sidebar/nav_icon/unfold.svg" alt="收起" />
      {:else}
        <img src="/sidebar/nav_icon/fold.svg" alt="展开" />
      {/if}
      <div class="title">学生成绩</div>
    </button>
  </div>
  {#if !isfolded}
    <div class="card-body">
      <div class="search-section">
        <InputBox show_label={false} placeholder="请输入学生电话/昵称/姓名" bind:value={searchKeyword} />
      </div>
      {#if isLoading}
        <div class="loading-indicator">
          <div class="spinner"></div>
          <span>正在加载，请稍候...</span>
        </div>
      {:else}
        <div class="table-wrapper">
          <table class="scores-table">
            <thead>
              <tr>
                <th>序号</th>
                <th>电话</th>
                <th>昵称</th>
                <th>姓名</th>
                {#if type === 'practice'}
                  <th>最高得分</th>
                  <th>作答次数</th>
                {:else if contextData?.papers?.length === 1}
                  <th>得分</th>
                {:else}
                  <th>总得分</th>
                  {#each contextData?.papers || [] as paper, index}
                    <th>试卷{index + 1}</th>
                  {/each}
                {/if}
                <th>备注</th>
              </tr>
            </thead>
            <tbody>
              {#each currentData || [] as student, index}
                <tr>
                  <td>{(searchParams.page - 1) * searchParams.pageSize + index + 1}</td>
                  <td>{student.phone || '-'}</td>
                  <td>{student.nickname || '-'}</td>
                  <td>{student.name || '-'}</td>
                  {#if type === 'practice'}
                    <td class="score-cell">
                      <span class={getScoreClass(student.highestScore, contextData?.totalScore || 100)}>
                        {student.highestScore != null ? student.highestScore : '-'}
                      </span>
                    </td>
                    <td>{student.submitCount}</td>
                  {:else if contextData?.papers?.length === 1}
                    <td class="score-cell">
                      <span class={getScoreClass(student.total_score, contextData?.totalScore || 100)}>
                        {student.total_score != null ? student.total_score : '-'}
                      </span>
                    </td>
                  {:else}
                    <td class="score-cell">
                      <span class={getScoreClass(student.total_score, contextData?.totalScore || 100)}>
                        {student.total_score != null ? student.total_score : '-'}
                      </span>
                    </td>
                    {#each student.scores || [] as score, index}
                      <td class="score-cell">
                        <span class={getScoreClass(score.score, contextData?.papers?.[index]?.totalScore || 100)}>
                          {score.score != null ? score.score : '-'}
                        </span>
                      </td>
                    {/each}
                  {/if}
                  <td class="note-cell">{student.remark || '-'}</td>
                </tr>
              {:else}
                <tr>
                  <td colspan="6" class="empty-row"
                    ><div class="empty-container">
                      <Empty text="暂无数据" />
                    </div></td
                  >
                </tr>
              {/each}
            </tbody>
          </table>
        </div>
        <div class="pagination">
          <Pagination
            {...paginationConfig}
            onPageChangeFunc={handlePageChange}
            onPageChooseFunc={handlePageChoose}
            selectOptionFunc={handlePageSizeChange}
            onPageSearchFunc={handlePageSearch}
          />
        </div>
      {/if}
    </div>
  {/if}
</div>

<style lang="scss">
  .student-scores-card {
    width: 100%;
    height: 100%;
    margin-bottom: 40px;

    .card-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 20px;
      padding-bottom: 10px;
      border-bottom: 2px solid #f0f0f0;

      .card-title-button {
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 10px;
        cursor: pointer;
        background: none;
        border: none;

        img {
          width: 32px;
          height: 32px;
        }
        .title {
          font-size: 22px;
          font-weight: bold;
        }
      }
    }
    .card-body {
      .search-section {
		max-width:20%;
      }
      .loading-indicator {
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 20px;
        flex-direction: column;
        color: var(--gray);

        .spinner {
          width: 40px;
          height: 40px;
          border: 4px solid #ccc;
          border-top-color: var(--blue);
          border-radius: 50%;
          animation: spin 0.8s linear infinite;
          margin-bottom: 10px;
        }

        @keyframes spin {
          to {
            transform: rotate(360deg);
          }
        }
      }
      .table-wrapper {
        overflow-x: auto;
        margin-bottom: 20px;

        .scores-table {
          width: 100%;
          border-collapse: collapse;
          min-width: 800px;

          th,
          td {
            padding: 12px 8px;
            text-align: center;
            font-size: 14px;
            border-bottom: 1px solid #e0e0e0;
          }
          th {
            font-weight: 400;
            color: #0000004d;
          }

          /* 分数样式 */
          .red {
            color: var(--red);
            font-weight: 500;
          }

          .green {
            color: var(--green);
            font-weight: 500;
          }

          .note-cell {
            color: var(--gray);
            font-size: 12px;
          }

          .empty-row {
            text-align: center;
            color: var(--gray);
            font-style: italic;
          }
        }
      }
    }

    .pagination {
      display: flex;
      align-items: center;
      justify-content: flex-end;
      margin-top: 20px;
    }
    /* 响应式设计 */
    @media (max-width: 768px) {
      .card-header {
        flex-direction: column;
        gap: 10px;
        align-items: flex-start;
      }
    }
  }
</style>
