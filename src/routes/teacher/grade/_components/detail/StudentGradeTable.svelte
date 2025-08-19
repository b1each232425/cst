<script>
  import { onMount, getContext } from 'svelte';
  import Pagination from '$lib/components/Pagination/Pagination.svelte';
  import InputBox from '$lib/components/Input/InputBox.svelte';
  import Empty from '$lib/components/Table/Empty.svelte';
  import { debounce } from '../../_utils/debounce.js';

  /**
   * @typedef {Object} Props
   * @property {'practice' | 'exam'} type - 类型
   * @property {number} resource_id - 资源ID
   * @property {Array} [papers] - 试卷信息（考试类型需要）
   */

  /**
   * @type {Props}
   */
  let { type, resource_id, papers = [] } = $props();

  // 获取 Context 数据
  let context_data = $state(null);
  try {
    if (type === 'practice') {
      const context = getContext('practice');
      context_data = context?.practiceData;
    } else {
      const context = getContext('exam');
      context_data = context?.examData;
    }
  } catch {
    // Context 不存在时忽略
  }

  // 状态变量（按照用户管理页面的命名风格）
  let currentData = $state([]);
  
  // 分页相关状态（按照用户管理页面的风格）
  let current_page = $state(1);
  let page_size = $state(10);
  let total_items = $state(0);

  let loading = $state(false);
  let error = $state(null);

  let isfolded = $state(false);
  let searchKeyword = $state('');

  // 切换折叠状态
  function toggleFold() {
    isfolded = !isfolded;
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
   * 获取学生成绩数据
   */
  async function fetchGradesData() {
    loading = true;
    error = null;
    currentData = [];

    // 组装查询参数
    const params = new URLSearchParams({
      category: type,               
      page: String(current_page),
      pageSize: String(page_size),
      ...(type === 'exam'
        ? { examID: resource_id }
        : { practiceID: resource_id }),
      keyword: searchKeyword.trim()
    });

    return fetch(`/api/grade/examinee/list?${params.toString()}`, {
      method: 'GET',
      credentials: 'include'
    })
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json();
      })
      .then((json) => {
        if (json.status !== 0) throw new Error(json.msg || '接口异常');

        const raw = json.data || [];
        if (type === 'practice') {
          // 从 student_scores 中提取学生数据
          const students = [];
          raw.forEach((practice) => {
            if (practice.student_scores && Array.isArray(practice.student_scores)) {
              students.push(...practice.student_scores);
            }
          });
          
          currentData = students.map((stu) => ({
            stuId: stu.stu_id, 
            phone: stu.phone || '-',
            name: stu.name || '-',
            nickname: stu.nickname || '-',
            highestScore: stu.highest_score ?? 0,
            submitCount: stu.submitted_cnt ?? 0,
            remark: stu.remark || '-'
          }));
          total_items = json.rowCount || 0;
        } else {
          const merged = [];
          raw.forEach((item) => {
            item.student_scores.forEach((stu) => {
              const total_score = stu.exam_sessions.reduce((sum, s) => sum + (s.score ?? 0), 0);
              merged.push({
                stu_id: stu.student_id,
                phone: stu.phone || '-',
                name: stu.name || '-',
                nickname: stu.nickname || '-',
                scores: stu.exam_sessions.map((s) => ({
                  exam_session_id: s.exam_session_id,
                  score: s.score ?? 0
                })),
                total_score: total_score,
                remark: stu.remark || '-'
              });
            });
          });
          currentData = merged;

          // 后端 rowCount 是人次数，前端按学生人数算
          total_items = Math.ceil((json.rowCount || 0) / (papers.length || 1));
        }
        
        loading = false;
      })
      .catch((err) => {
        console.error('拉取学生成绩失败:', err);
        error = err.message;
        currentData = [];
        total_items = 0;
        loading = false;
      });
  }

  /**
   * 执行搜索
   */
  async function performSearch() {
    current_page = 1;
    await fetchGradesData();
  }

  // 创建防抖后的搜索函数
  const debouncedSearch = debounce(performSearch, 500);

  // 页码选择处理（按照用户管理页面的风格）
  function handlePageChange(event) {
    current_page = event.detail;
    fetchGradesData();
  }

  // 每页大小变更处理（按照用户管理页面的风格）
  function handlePageSizeChange(event) {
    page_size = event.detail;
    current_page = 1;
    fetchGradesData();
  }

  /**
   * 分数颜色判断
   */
  function getScoreClass(score, total_score) {
    if (score < total_score * 0.6) {
      return 'red';
    } else {
      return 'green';
    }
  }

  // 初始化
  onMount(async () => {
    await fetchGradesData();
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
        <InputBox 
          show_label={false} 
          placeholder="请输入学生电话/昵称/姓名" 
          bind:value={searchKeyword} 
          onInput={debouncedSearch}
        />
      </div>
      {#if loading}
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
                {:else if context_data?.papers?.length === 1}
                  <th>得分</th>
                {:else}
                  <th>总得分</th>
                  {#each context_data?.papers || [] as paper, index}
                    <th>试卷{index + 1}</th>
                  {/each}
                {/if}
                <th>备注</th>
              </tr>
            </thead>
            <tbody>
              {#each currentData || [] as student, index}
                <tr>
                  <td>{(current_page - 1) * page_size + index + 1}</td>
                  <td>{student.phone || '-'}</td>
                  <td>{student.nickname || '-'}</td>
                  <td>{student.name || '-'}</td>
                  {#if type === 'practice'}
                    <td class="score-cell">
                      <span class={getScoreClass(student.highestScore, context_data?.total_score || 100)}>
                        {student.highestScore != null ? student.highestScore : '-'}
                      </span>
                    </td>
                    <td>{student.submitCount}</td>
                  {:else if context_data?.papers?.length === 1}
                    <td class="score-cell">
                      <span class={getScoreClass(student.total_score, context_data?.total_score || 100)}>
                        {student.total_score != null ? student.total_score : '-'}
                      </span>
                    </td>
                  {:else}
                    <td class="score-cell">
                      <span class={getScoreClass(student.total_score, context_data?.total_score || 100)}>
                        {student.total_score != null ? student.total_score : '-'}
                      </span>
                    </td>
                    {#each student.scores || [] as score, index}
                      <td class="score-cell">
                        <span class={getScoreClass(score.score, context_data?.papers?.[index]?.total_score || 100)}>
                          {score.score != null ? score.score : '-'}
                        </span>
                      </td>
                    {/each}
                  {/if}
                  <td class="note-cell">{student.remark || '-'}</td>
                </tr>
              {:else}
                <tr>
                  <td colspan="7" class="empty-row"
                    ><div class="empty-container">
                      <Empty text="暂无数据" />
                    </div></td
                  >
                </tr>
              {/each}
            </tbody>
          </table>
        </div>
        <div class="pagination-wrapper">
          <div class="pagination-container {total_items > 0 ? '' : 'hide'}">
            <Pagination
              {total_items}
              {current_page}
              {page_size}
              page_size_options={[10, 20]}
              on:pageChange={handlePageChange}
              on:pageSizeChange={handlePageSizeChange}
            />
          </div>
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
      border-bottom: none;
    }
        }
      }
    }

    .pagination-wrapper {
      display: flex;
      justify-content: flex-end;
      align-items: center;
      margin-top: 20px;

      .pagination-container {
        display: flex;
        align-items: center;
        justify-content: flex-end;

        &.hide {
          display: none;
        }
      }
    }

    /* 响应式设计 */
    @media (max-width: 768px) {
      .card-header {
        flex-direction: column;
        gap: 10px;
        align-items: flex-start;
      }

      .pagination-wrapper {
        justify-content: center;
      }
    }
  }
</style>
