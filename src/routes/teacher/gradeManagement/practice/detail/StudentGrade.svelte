<script>
  import Pagination from "$lib/component/Pagination.svelte";
  import SearchInput from "$lib/component/SearchInput.svelte";
  import { onMount, getContext } from "svelte";
  import { sget } from "$lib/common/api_data";

  // 定义显示数据格式

  /**
   * @typedef {Object} StudentGrade
   * @property {number} stuId - 学生 ID
   * @property {string} phone - 电话号码
   * @property {string} nickname - 昵称
   * @property {string} name - 姓名
   * @property {number} highestScore - 最高得分
   * @property {number} submitCount - 提交次数
   * @property {string} remark - 备注
   */

  /**
   * @typedef {Object} SearchParams
   * @property {number} practiceID - 练习 ID
   * @property {string} keyword - 搜索关键词
   * @property {number} page - 当前页码，从 1 开始
   * @property {number} pageSize - 每页显示的条数
   */

  /**
   * @typedef {Object} PaginationControl
   * @property {number} total_data_num - 总数据条数，默认为 100。
   * @property {number} total_page_num - 总页数，默认为 1000。
   * @property {number} current_page_num - 当前页码，默认为 1。
   * @property {number} max_show_page_num - 最多显示的页码数，默认为 5，最小为 4。
   * @property {boolean} show_per_page - 是否显示每页条数选择器，默认为 true。
   * @property {{value: number, label: string}[]} data_num_per_page_options - 每页显示数据条数的选项。
   * @property {number} selected - 当前选中的每页显示数据条数选项，根据传入的 value 显示对应的 label。
   * @property {boolean} dropdown_open - 下拉菜单是否打开。
   * @property {string} expand_direction - 下拉框展开的方向，默认为 "down"，若要向上则配置为 "up"。
   */

  const Context = getContext("practice");
  const practiceData = Context.practiceData;

  /**
   * @type {StudentGrade[]}
   * 当前显示的数据
   */
  let currentData = $state([]);

  /**
   * @type {SearchParams}
   * 搜索参数配置
   */
  let searchParams = $state({
    practiceID: practiceData.id,
    keyword: "",
    page: 1,
    pageSize: 10,
  });

  /**
   * @type {PaginationControl}
   * 分页配置
   */
  let paginationConfig = $state({
    total_data_num: 100,
    total_page_num: 10,
    current_page_num: 1,
    max_show_page_num: 5,
    show_per_page: true,
    data_num_per_page_options: [
      { value: 10, label: "10条/页" },
      { value: 20, label: "20条/页" },
    ],
    selected: 10,
    dropdown_open: false,
    expand_direction: "up",
  });

  /**
   * @type {boolean}
   * 是否折叠面板状态
   */
  let isfolded = $state(false);

  /**
   * @type {boolean}
   * 数据是否在加载中
   */
  let isLoading = $state(true);

  /*
   * 切换折叠状态
   * @returns {void}
   */
  function toggleFold() {
    isfolded = !isfolded;
  }

  /**
   * @type {NodeJS.Timeout}
   * 搜索定时器(防抖处理)
   */
  let searchTimeout = null;

  /**
   * @description 更新分页配置
   * @param {number} number -总数据量
   * @returns {void}
   */
  function updatePagination(number) {
    paginationConfig.total_data_num = number;
    paginationConfig.total_page_num = Math.ceil(
      paginationConfig.total_data_num / paginationConfig.selected,
    );
  }

  /**
   * 获取数据
   * @returns {Promise<void>}
   */
  async function fetchData() {
    try {
      isLoading = true;
      currentData = [];
      let url = `/api/teacher/practice-grade/examinee-grade-list?practiceID=${searchParams.practiceID}&page=${searchParams.page}&pageSize=${searchParams.pageSize}&keyword=${encodeURIComponent(searchParams.keyword)}`;
      let response = await fetch(url, {
        method: "GET",
        credentials: "include",
      });

      let response_data = await response.json();
      if (response_data.status < 0) {
        throw new Error(response_data.msg);
      }
      const data = sget(response_data, "data", []);
      currentData = data.map((item) => {
        return {
          stuId: sget(item, "stu_id", 0),
          phone: sget(item, "phone", "--"),
          nickname: sget(item, "nickname", "--"),
          name: sget(item, "name", "--"),
          highestScore: sget(item, "highest_score", 0),
          submitCount: sget(item, "submitted_cnt", 0),
          remark: sget(item, "remark", "--"),
        };
      });
      isLoading = false;

      // 数据条数
      const total = sget(response_data, "row_count", 0);
      //更新分页配置
      updatePagination(total);
    } catch (error) {
      console.error("Error fetching data:", error);
    }
  }

  /**
   * 搜索功能
   * @param {string} keyword - 搜索关键词
   */
  function handleSearch(keyword) {
    if (searchTimeout) {
      clearTimeout(searchTimeout);
    }

    searchTimeout = setTimeout(async () => {
      searchParams.page = 1;
      searchParams.keyword = keyword;
      await fetchData();

      // 清除引用，防止内存泄漏
      clearTimeout(searchTimeout);
      searchTimeout = null;
    }, 500); // 防抖延迟时间（毫秒）
  }

  /**
   * 处理页码变化
   * @param {boolean} is_next - 是否前往下一页
   */
  async function handlePageChange(is_next) {
    const new_page = is_next
      ? Math.min(
          paginationConfig.total_page_num,
          paginationConfig.current_page_num + 1,
        )
      : Math.max(1, paginationConfig.current_page_num - 1);

    if (new_page !== paginationConfig.current_page_num) {
      paginationConfig.current_page_num = new_page;
      searchParams.page = new_page; // 更新搜索参数的页码
      await fetchData();
    }
  }

  /**
   * 处理页码选择
   * @param {number} page_num - 选择的页码
   */
  async function handlePageChoose(page_num) {
    if (
      page_num !== paginationConfig.current_page_num &&
      page_num > 0 &&
      page_num <= paginationConfig.total_page_num
    ) {
      paginationConfig.current_page_num = page_num;
      searchParams.page = page_num; // 更新搜索参数的页码
      await fetchData();
    }
  }

  /**
   * 处理每页显示条数变化
   * @param {number|string} value - 每页显示的条数
   */
  async function handlePageSizeChange(value) {
    // 确保value是数字类型
    const size_value = typeof value === "string" ? parseInt(value) : value;
    paginationConfig.show_per_page = true;
    paginationConfig.current_page_num = 1; // 重置到第一页
    paginationConfig.selected = size_value;
    searchParams.pageSize = size_value; // 更新搜索参数的每页条数
    searchParams.page = 1; // 重置到第一页
    await fetchData();
  }

  /**
   * 处理页码搜索
   * @param {string} value - 输入的页码
   */
  async function handlePageSearch(value) {
    const page_num = parseInt(value);
    if (
      !isNaN(page_num) &&
      page_num > 0 &&
      page_num <= paginationConfig.total_page_num
    ) {
      paginationConfig.current_page_num = page_num;
      searchParams.page = page_num;
      await fetchData();
    }
  }

  /**
   * 如果分数小于总分的60%,返回红色
   * @param {number} score
   * @param {number} totalScore
   */
  function getScoreClass(score, totalScore) {
    if (score < totalScore * 0.6) {
      return "red";
    } else {
      return "green";
    }
  }

  onMount(async () => {
    // 初始化时获取数据
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
        <SearchInput
          purpose_text={"搜索学生"}
          place_holder="请输入学生电话/昵称/姓名"
          onSearchFunc={(/**@type {string}*/ value) => {
            handleSearch(value);
          }}
        />
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
                <th>最高得分</th>
                <th>作答次数</th>
                <th>备注</th>
              </tr>
            </thead>
            <tbody>
              {#each currentData || [] as student, index}
                <tr>
                  <td
                    >{(searchParams.page - 1) * searchParams.pageSize +
                      index +
                      1}</td
                  >
                  <td>{student.phone}</td>
                  <td>{student.nickname}</td>
                  <td>{student.name}</td>
                  <td
                    class="score-cell{getScoreClass(
                      student.highestScore,
                      practiceData.totalScore,
                    )}">{student.highestScore}</td
                  >
                  <td>{student.submitCount}</td>
                  <td class="note-cell">{student.remark}</td>
                </tr>
              {:else}
                <tr>
                  <td colspan="100" class="empty-row">暂无数据</td>
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
        margin-bottom: 30px;
        margin-left: 3rem;
        width: 400px;
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
          .score-cell {
            &red {
              color: var(--red);
            }
            &green {
              color: var(--green);
            }
          }
          .note-cell {
            color: var(--gray);
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
