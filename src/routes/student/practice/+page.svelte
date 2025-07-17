<script>
  import { onMount } from "svelte";
  // 修改前
  import CustomSelect from "../../teacher/practiceManagement/components/CustomSelect.svelte";

  import Pagination from "$lib/component/Pagination.svelte";
  /**
   * @typedef {Object} TimeLogEntry
   * @property {string} start_time - 开始时间，ISO 格式字符串，例如 "2025-05-17T08:00:00Z"
   * @property {string} end_time - 结束时间，默认可能为占位值 "0001-01-01T00:00:00Z"
   * @property {string[]} last_exit_time - 退出时间数组，可能为空数组
   */
  let { data } = $props();

  /** @type {string} */
  let search_text = $state("");

  /** @type {string} */
  let selected_difficulty = $state("全部");

  /** @type {string[]} */
  const difficulties = ["全部", "简单", "中等", "困难"];

  /** @type {string[]}
   * 00 说明没有作答过
   * 02 说明上次作答已经提交结束，并且已经有了成绩
   * 04 说明上次作答没有提交
   * 06 说明上次已经提交了作答，但是没有批改
   * 08 到达了最大的作答次数了，无法作答
   * 10 说明是第一次做，并且还没作答完毕
   */
  const action_kings = ["00", "02", "04", "06", "08", "10"];

  /** @type {{index: number, top: number, left: number}|null} */
  let tooltipPosition = $state(null);

  /** @type {string[]} */
  const tabTips = [
    "每次作答的试卷是固定的，适合针对性复习和巩固特定知识点",
    "每次作答的题目会从题库中随机选取，适合全面检验学生对知识的综合掌握能力",
    "每次作答的题目会根据筛选条件从题库中智能筛选，适合有针对性地提升学习效果",
  ];

  function handleSearch() {
    // 实现搜索逻辑
    current_page = 1;
    fetchPageData();
  }

  function handleReset() {
    search_text = "";
    selected_difficulty = "全部";
    current_page = 1;
    fetchPageData();
  }

  /**
   * 显示提示框并计算位置
   * @param {number} index - 标签索引
   * @param {MouseEvent} event - 鼠标事件
   */
  function showTooltip(index, event) {
    const element = /** @type {HTMLElement} */ (event.target);
    if (!element) return;

    const rect = element.getBoundingClientRect();

    tooltipPosition = {
      index: index,
      top: rect.top,
      left: rect.left + rect.width / 2,
    };
  }

  /**
   * 隐藏提示框
   */
  function hideTooltip() {
    tooltipPosition = null;
  }

  // 定义练习数据类型
  /** @typedef {Object} Exercise
   * @property {string} id - 练习id
   * @property {string} name - 练习名称
   * @property {number} allowed_attempts - 允许的作答次数
   * @property {number} attempt_count - 作答次数
   * @property {string} difficulty - 练习难度
   * @property {string} [lastScore] - 上次得分
   * @property {number} [question_count] - 题目总数
   * @property {number} [wrong_count] - 错题数
   * @property {string} [total_score] - 上次得分
   * @property {string} [total_possible_score] - 满分
   * @property {string} [highest_score] - 最高得分
   * @property {boolean} [canStart] - 是否可以开始
   * @property {string} [accuracy] - 正确率
   * @property {string} [duration] - 持续时间
   * @property {boolean} [hasRecord] - 是否有记录
   * @property {string} [completedQuestions] - 完成的题目
   * @property {string} [incorrectQuestions] - 错误的题目
   * @property {string} [status] - 状态
   * @property {string} [last_un_submitted_id] - 上次未提交的练习submission_id
   */

  /** @type {{classic: Exercise[], regular: Exercise[], smart: Exercise[]}} */
  let exercises = $state({
    classic: data.practiceList,
    regular: [
      //   {
      //     id: 1,
      //     name: "线性代数每周练习",
      //     allowed_attempts: 5,
      //     attempt_count: 8,
      //     difficulty: "中等",
      //     accuracy: "85%",
      //     duration: "45分钟",
      //     lastScore: "170/200",
      //     hasRecord: true,
      //     time_log: [
      //       {
      //         start_time: "2025-05-17T08:00:00Z", // 必须有的时间
      //         end_time: "",
      //         last_exit_time: [],
      //       },
      //     ],
      //   },
      //   {
      //     id: 1,
      //     name: "离散数学随机练习",
      //     allowed_attempts: 5,
      //     attempt_count: 3,
      //     difficulty: "困难",
      //     accuracy: "62%",
      //     duration: "67分钟",
      //     lastScore: "124/200",
      //     hasRecord: true,
      //     time_log: [
      //       {
      //         start_time: "2025-05-17T08:00:00Z", // 必须有的时间
      //         end_time: "",
      //         last_exit_time: [],
      //       },
      //     ],
      //   },
      //   {
      //     id: 1,
      //     name: "计算机网络基础题库",
      //     allowed_attempts: 5,
      //     attempt_count: 12,
      //     difficulty: "简单",
      //     accuracy: "91%",
      //     duration: "38分钟",
      //     lastScore: "182/200",
      //     hasRecord: true,
      //     time_log: [
      //       {
      //         start_time: "2025-05-17T08:00:00Z", // 必须有的时间
      //         end_time: "",
      //         last_exit_time: [],
      //       },
      //     ],
      //   },
      //   {
      //     id: 1,
      //     name: "数据库原理SQL练习",
      //     allowed_attempts: 5,
      //     attempt_count: 5,
      //     difficulty: "中等",
      //     accuracy: "78%",
      //     duration: "52分钟",
      //     lastScore: "156/200",
      //     hasRecord: true,
      //     time_log: [
      //       {
      //         start_time: "2025-05-17T08:00:00Z", // 必须有的时间
      //         end_time: "",
      //         last_exit_time: [],
      //       },
      //     ],
      //   },
      //   {
      //     id: 1,
      //     name: "软件工程方法学",
      //     allowed_attempts: 5,
      //     attempt_count: 0,
      //     difficulty: "中等",
      //     accuracy: "-",
      //     duration: "-",
      //     lastScore: "-",
      //     hasRecord: false,
      //     time_log: [
      //       {
      //         start_time: "2025-05-17T08:00:00Z", // 必须有的时间
      //         end_time: "",
      //         last_exit_time: [],
      //       },
      //     ],
      //   },
    ],
    smart: [
      //   {
      //     id: 1,
      //     name: "微积分专项提升",
      //     allowed_attempts: 5,
      //     attempt_count: 4,
      //     difficulty: "困难",
      //     completedQuestions: "35/120",
      //     incorrectQuestions: "15/120",
      //     status: "进行中",
      //     lastScore: "70/100",
      //     time_log: [
      //       {
      //         start_time: "2025-05-17T08:00:00Z", // 必须有的时间
      //         end_time: "",
      //         last_exit_time: [],
      //       },
      //     ],
      //   },
      //   {
      //     id: 1,
      //     name: "电路分析智能练习",
      //     allowed_attempts: 5,
      //     attempt_count: 7,
      //     difficulty: "中等",
      //     completedQuestions: "68/100",
      //     incorrectQuestions: "22/100",
      //     status: "进行中",
      //     lastScore: "82/100",
      //     time_log: [
      //       {
      //         start_time: "2025-05-17T08:00:00Z", // 必须有的时间
      //         end_time: "",
      //         last_exit_time: [],
      //       },
      //     ],
      //   },
      //   {
      //     id: 1,
      //     name: "操作系统原理强化",
      //     allowed_attempts: 5,
      //     attempt_count: 2,
      //     difficulty: "困难",
      //     completedQuestions: "18/150",
      //     incorrectQuestions: "10/150",
      //     status: "刚开始",
      //     lastScore: "60/100",
      //     time_log: [
      //       {
      //         start_time: "2025-05-17T08:00:00Z", // 必须有的时间
      //         end_time: "",
      //         last_exit_time: [],
      //       },
      //     ],
      //   },
      //   {
      //     id: 1,
      //     name: "Python编程挑战",
      //     allowed_attempts: 5,
      //     attempt_count: 10,
      //     difficulty: "简单",
      //     completedQuestions: "95/100",
      //     incorrectQuestions: "12/100",
      //     status: "即将完成",
      //     lastScore: "88/100",
      //     time_log: [
      //       {
      //         start_time: "2025-05-17T08:00:00Z", // 必须有的时间
      //         end_time: "",
      //         last_exit_time: [],
      //       },
      //     ],
      //   },
      //   {
      //     id: 1,
      //     name: "数字电路设计训练",
      //     allowed_attempts: 5,
      //     attempt_count: 3,
      //     difficulty: "中等",
      //     completedQuestions: "40/120",
      //     incorrectQuestions: "18/120",
      //     status: "进行中",
      //     lastScore: "75/100",
      //     time_log: [
      //       {
      //         start_time: "2025-05-17T08:00:00Z", // 必须有的时间
      //         end_time: "",
      //         last_exit_time: [],
      //       },
      //     ],
      //   },
    ],
  });

  /** @type {string} */
  let active_tab = $state("经典巩固");

  /** @type {Exercise[]} */
  let current_exercises = $state([]);

  /** @type {string[]} */
  const tabs = ["经典巩固", "常练常新", "智能提升"];

  /**
   * 更新练习列表
   */
  function updateExercises() {
    current_exercises =
      active_tab === "经典巩固"
        ? exercises.classic
        : active_tab === "常练常新"
          ? exercises.regular
          : exercises.smart;
  }

  /**
   * 处理标签点击事件
   * @param {string} tab - 标签名称
   */
  function handleTabClick(tab) {
    active_tab = tab;
    updateExercises();
  }

  /**
   * 处理难度选择变更
   * @param {string} value - 选中的难度值
   */
  function handleDifficultyChange(value) {
    selected_difficulty = value;
  }

  // 分页相关
  /** @type {number} */
  let current_page = $state(data.pagination.current || 1);

  /** @type {number} */
  let page_size = $state(data.pagination.size || 10);

  /** @type {number} */
  let total_exercises = $state(data.pagination.total || 0);

  /** @type {number} */
  let total_pages = $derived(
    Math.max(1, data.pagination.pages || Math.ceil(total_exercises / page_size))
  );

  /**
   * 判断作答行为类型
   * @param {Exercise} exercise
   * @returns {string} 操作码
   */
  function checkActionKind(exercise) {
    const {
      last_un_submitted_id,
      total_score,
      attempt_count,
      allowed_attempts,
    } = exercise;

    // 1. 从未作答过
    if (!attempt_count&&!last_un_submitted_id) {
      return action_kings[0]; // "00"
    }

    // 2. 存在未提交记录
    if (last_un_submitted_id) {
      return total_score!==null&&total_score!==undefined ? action_kings[2] : action_kings[5]; // "04" or "10"
    }

    // 3. 上一次没有成绩（即已提交但未批改）
    if (total_score===null&&total_score!==0) {
      return action_kings[3]; // "06"
    }

    // 4. 已达到最大尝试次数
    if (allowed_attempts > 0 && allowed_attempts === attempt_count) {
      return action_kings[4]; // "08"
    }

    // 5. 正常可重新作答
    return action_kings[1]; // "02"
  }

  /**
   * 处理页码变化
   * @param {boolean} is_next - 是否前往下一页
   */
  async function handlePageChange(is_next) {
    const new_page = is_next
      ? Math.min(total_pages, current_page + 1)
      : Math.max(1, current_page - 1);

    if (new_page !== current_page) {
      current_page = new_page;
      await fetchPageData();
    }
  }

  /**
   * 处理页码选择
   * @param {number} page_num - 选择的页码
   */
  async function handlePageChoose(page_num) {
    if (page_num !== current_page && page_num > 0 && page_num <= total_pages) {
      current_page = page_num;
      await fetchPageData();
    }
  }

  /**
   * 处理每页显示条数变化
   * @param {number|string} value - 每页显示的条数
   */
  async function handlePageSizeChange(value) {
    // 确保value是数字类型
    const size_value = typeof value === "string" ? parseInt(value) : value;
    page_size = size_value;
    current_page = 1; // 重置到第一页
    await fetchPageData();
  }

  /**
   * 处理页码搜索
   * @param {string} value - 输入的页码
   */
  async function handlePageSearch(value) {
    const page_num = parseInt(value);
    if (!isNaN(page_num) && page_num > 0 && page_num <= total_pages) {
      current_page = page_num;
      await fetchPageData();
    }
  }

  /**
   * 获取分页数据
   */
  async function fetchPageData() {
    try {
      // 构建查询参数
      const queryParams = new URLSearchParams({
        type: "00",
        page: current_page.toString(),
        page_size: page_size.toString(),
      });

      // 添加搜索和难度条件
      if (search_text) {
        queryParams.append("name", search_text);
      }

      if (selected_difficulty !== "全部") {
        const difficultyCode =
          selected_difficulty === "简单"
            ? "00"
            : selected_difficulty === "中等"
              ? "02"
              : "04";
        queryParams.append("difficulty", difficultyCode);
      }

      const response = await fetch(
        `/api/student_practice?${queryParams.toString()}`,
        {
          credentials: "include",
        }
      );
      const data = await response.json();

      if (data.status !== 0 || !data.data) {
        console.error("获取练习列表响应格式错误:", data);
        exercises.classic = [];
        updateExercises();
        return;
      }

      // 处理records为null的情况，确保始终是数组
      exercises.classic = data.data.records || [];

      // 更新分页信息
      total_exercises = data.rowCount || 0;
      if (data.data.pages) {
        total_pages = data.data.pages;
      }

      updateExercises();
    } catch (error) {
      console.error("获取分页数据失败:", error);
      exercises.classic = [];
      updateExercises();
    }
  }

  onMount(() => {
    // Initial load - 使用后端返回的分页信息初始化状态
    updateExercises();

    // 确保分页组件初始状态与后端返回数据一致
    current_page = data.pagination.current;
    page_size = data.pagination.size;
    total_exercises = data.pagination.total;
  });
</script>

<svelte:head>
  <title>我的练习</title>
</svelte:head>

<main>
  <div class="search-section">
    <p>我的练习</p>
    <hr />
    <div class="search-controls">
      <div class="left-controls">
        <div class="input-group">
          <label for="search-input">搜索练习：</label>
          <input
            id="search-input"
            type="text"
            bind:value={search_text}
            placeholder="练习名称 / 知识点"
          />
        </div>
        <div class="input-group">
          <label for="difficulty-select">练习难度：</label>
          <CustomSelect
            options={difficulties}
            selected_value={selected_difficulty}
            height={"28px"}
            onChangeFunc={handleDifficultyChange}
          />
        </div>
        <div class="button-group">
          <button id="reset-btn" onclick={handleReset}>重置</button>
          <button id="search-btn" onclick={handleSearch}>搜索</button>
        </div>
      </div>
    </div>
  </div>
  <div class="data-section">
    <div class="tabs">
      {#each tabs as tab, i}
        <button
          class="tab {active_tab === tab ? 'active' : ''}"
          onclick={() => handleTabClick(tab)}
        >
          <span class="tab-text">{tab}</span>
          <div class="icon-wrapper">
            <img
              src="/student_practice_list/tip.svg"
              alt="info"
              class="info-icon"
              onmouseenter={(e) => showTooltip(i, e)}
              onmouseleave={hideTooltip}
            />
          </div>
        </button>
      {/each}
    </div>

    <div class="exercise-table">
      <table>
        <thead>
          <tr>
            {#if active_tab === "经典巩固"}
              <th>练习名称</th>
              <th>作答次数</th>
              <th>练习难度</th>
              <th>可作答次数</th>
              <th>试卷题数</th>
              <th>错题数</th>
              <th>得分</th>
              <th>最高得分</th>
              <th>试卷总分</th>
              <th>操作</th>
            {:else if active_tab === "常练常新"}
              <th>练习名称</th>
              <th>作答次数</th>
              <th>练习难度</th>
              <th>可作答次数</th>
              <th>正确率</th>
              <th>时长</th>
              <th>得分</th>
              <th>操作</th>
            {:else if active_tab === "智能提升"}
              <th>练习名称</th>
              <th>作答次数</th>
              <th>练习难度</th>
              <th>可作答次数</th>
              <th>已作题数 / 题目存量</th>
              <th>错题数 / 题目存量</th>
              <th>题目情况</th>
              <th>得分</th>
              <th>操作</th>
            {/if}
          </tr>
        </thead>
        <tbody>
          {#each current_exercises as exercise, index}
            <tr>
              <td title={exercise.name} class="name-cell">
                <div class="truncate-text">{exercise.name}</div>
              </td>
              <td>{exercise.attempt_count}</td>
              <td
                class={exercise.difficulty === "00"
                  ? "easy"
                  : exercise.difficulty === "02"
                    ? "medium"
                    : "hard"}
              >
                {exercise.difficulty === "00"
                  ? "简单"
                  : exercise.difficulty === "02"
                    ? "中等"
                    : "困难"}
              </td>
              <td
                >{exercise.allowed_attempts === 0
                  ? "不限次数"
                  : exercise.allowed_attempts}</td
              >

              {#if active_tab === "经典巩固"}
                <td>{exercise.question_count}</td>
                <td>{exercise.wrong_count}</td>
                <td style="color: #0336ff;font-weight:800"
                  >{exercise.total_score !== null &&
                  exercise.total_score !== undefined
                    ? exercise.total_score
                    : "−"}</td
                >
                <td>{exercise.highest_score}</td>
                <td>{exercise.total_possible_score}</td>
              {:else if active_tab === "常练常新"}
                <td>{exercise.accuracy}</td>
                <td>{exercise.duration}</td>
                <td>{exercise.lastScore}</td>
              {:else if active_tab === "智能提升"}
                <td>{exercise.completedQuestions}</td>
                <td>{exercise.incorrectQuestions}</td>
                <td>{exercise.status}</td>
                <td>{exercise.lastScore}</td>
              {/if}
              <td class="actions">
                {#if checkActionKind(exercise) === "06"}
                  <div class="action-btn">等待批改完成</div>
                {:else if checkActionKind(exercise) === "08"}
                  <button class="action-btn record" onclick={() => {
                      window.location.href = `/student/checkPracticeDetails?practiceID=${encodeURIComponent(exercise.id)}`;
                    }}>查看上次作答</button>
                {:else if checkActionKind(exercise) === "02"}
                  <button
                    class="action-btn restart"
                    onclick={() => {
                      window.location.replace( `/student/studentAnswerPractice?practiceId=${encodeURIComponent(exercise.id)}`);
                    }}>重新作答</button
                  >
                  <button class="action-btn restart"
                    onclick={() => {
                      window.location.href = `/student/checkPracticeDetails?practiceID=${encodeURIComponent(exercise.id)}`;
                    }}>查看上次作答</button>
                {:else if checkActionKind(exercise) === "10"}
                  <button
                    class="action-btn restart"
                    onclick={() => {
                      window.location.replace (`/student/studentAnswerPractice?practiceSubmissionId=${encodeURIComponent(exercise.last_un_submitted_id)}`);
                    }}>继续作答</button
                  >
                {:else if checkActionKind(exercise) === "04"}
                  <button
                    class="action-btn restart"
                    onclick={() => {
                     window.location.replace (`/student/studentAnswerPractice?practiceSubmissionId=${encodeURIComponent(exercise.last_un_submitted_id)}`);
                    }}>继续作答</button
                  >
                  <button class="action-btn record" onclick={() => {
                      window.location.href = `/student/checkPracticeDetails?practiceID=${encodeURIComponent(exercise.id)}`;
                    }}>查看上次作答</button>
                {:else}
                  <button
                    class="action-btn start"
                    onclick={() => {
                       window.location.replace( `/student/studentAnswerPractice?practiceId=${encodeURIComponent(exercise.id)}`);
                    }}>进入练习</button
                  >
                {/if}
              </td>
            </tr>
          {/each}
        </tbody>
      </table>
    </div>

    <div class="pagination">
      <Pagination
        total_data_num={total_exercises}
        total_page_num={total_pages}
        current_page_num={current_page}
        max_show_page_num={5}
        data_num_per_page_options={[
          { value: 10, label: "10条/页" },
          { value: 20, label: "20条/页" },
          { value: 30, label: "30条/页" },
        ]}
        selected={{
          value: page_size,
          label: `${page_size}条/页`,
        }}
        onPageChangeFunc={handlePageChange}
        onPageChooseFunc={handlePageChoose}
        selectOptionFunc={handlePageSizeChange}
        onPageSearchFunc={handlePageSearch}
        expand_direction="up"
      />
    </div>
  </div>
</main>

<!-- Portal元素，用于渲染悬浮提示框 -->
{#if tooltipPosition}
  <div class="tooltip-portal">
    <div
      class="tooltip"
      style="left: {tooltipPosition.left}px; top: {tooltipPosition.top - 10}px"
    >
      {tabTips[tooltipPosition.index]}
      <div class="tooltip-arrow"></div>
    </div>
  </div>
{/if}

<style lang="scss">
  :global(*) {
    box-sizing: border-box;
    margin: 0;
    padding: 0;
  }
  main {
    display: flex;
    flex-direction: column;
    width: 100%;
    height: 100%;
    margin: 0;
    background-color: #f7fafd;
    overflow: auto;
  }

  .search-section {
    margin: 0px auto 4px;
    padding: 30px 70px;
    width: 100%;
    background-color: #ffffff;
    min-width: 1000px;
    p {
      font-size: 20px;
      font-weight: bold;
      margin-bottom: 24px;
    }

    hr {
      margin-bottom: 25px;
      border: solid 1px rgba(121, 121, 121, 0.1);
    }

    .search-controls {
      display: flex;
      justify-content: space-between;
      align-items: center;

      .left-controls {
        display: flex;
        gap: 20px;
        align-items: center;
        flex: 1;

        .input-group {
          display: flex;
          align-items: center;
          gap: 10px;
          label {
            width: fit-content;
            white-space: nowrap;
          }
        }
      }

      input {
        min-width: 200px;
        flex: 1;
        height: 28px;
        border: 1px solid rgba(121, 121, 121, 0.33);
        border-radius: 2px;
        padding: 2px 2px 2px 10px;
        font-size: 12px;
        outline: none;

        &:hover,
        &:focus {
          border-color: #0336ff;
        }
      }

      .button-group {
        display: flex;
        gap: 20px;

        button {
          min-width: 60px;
          height: 28px;
          border-radius: 4px;
          font-size: 14px;
        }

        #reset-btn {
          border: 1px solid rgba(121, 121, 121, 0.33);
          outline: none;
          background-color: #ffffff;
          color: #333333;
          cursor: pointer;

          &:hover {
            color: #0052d9;
            border-color: #0052d9;
          }
        }

        #search-btn {
          border: none;
          outline: none;
          background-color: #0052d9;
          color: #ffffff;
          cursor: pointer;

          &:hover {
            background-color: rgba(0, 82, 217, 0.9);
          }

          &:active {
            background-color: rgba(0, 82, 217, 0.95);
          }
        }
      }
    }
  }

  .data-section {
    margin: 0 auto;
    padding: 0 70px 18px;
    width: 100%;
    background-color: #ffffff;
    min-width: 1000px;
    overflow: visible;
    flex: 1;
    display: flex;
    flex-direction: column;
    .tabs {
      display: flex;
      padding: 18px 0 13px 0;
      overflow-x: auto;
      justify-content: start;

      .tab {
        cursor: pointer;
        position: relative;
        font-size: 14px;
        color: #666;
        display: flex;
        align-items: center;
        position: relative;
        width: 120px;
        height: 38px;
        background: none;
        border: none;
        outline: none;
        padding: 0;

        .tab-text {
          text-align: center;
          width: 100%;
          position: absolute;
          left: 0;
          right: 0;
        }

        &.active {
          color: #0336ff;
          border-bottom: 2px solid #0336ff;
        }

        .icon-wrapper {
          position: relative;
          right: 15px;
          position: absolute;
          display: inline-block;

          .info-icon {
            width: 12px;
            height: 12px;
            border-radius: 50%;
            cursor: pointer;
          }
        }
      }
    }

    .exercise-table {
      width: 100%;
      overflow-x: auto;
      flex: 1;
      display: flex;
      flex-direction: column;
      overflow-y: auto;

      table {
        width: 100%;
        border-collapse: collapse;
        min-width: 700px;

        th,
        td {
          padding: 12px 8px;
          text-align: center;
          border-bottom: 1px solid #f0f0f0;
          font-size: 14px;
        }

        th {
          color: #666;
          font-weight: normal;
          background-color: #fafafa;
        }

        td {
          color: #333;
          text-align: center;

          &.easy {
            color: #52c41a;
          }

          &.medium {
            color: #faad14;
          }

          &.hard {
            color: #f5222d;
          }

          &.name-cell {
            text-align: center;
          }

          &.actions {
            .action-btn {
              text-decoration: none;
              color: #0336ff;
              font-size: 14px;
              margin: 0 8px;
              background: none;
              cursor: pointer;
              padding: 4px 8px;
              border-radius: 4px;
              outline: none;
              border: none;

              &:hover {
                color: #0336ff;
              }
            }
          }

          .truncate-text {
            max-width: 200px;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
            margin: 0 auto;
            text-align: center;
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
  }

  /* Portal提示框样式 */
  .tooltip-portal {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    pointer-events: none;
    z-index: 9999;
  }

  .tooltip {
    position: absolute;
    transform: translate(-50%, -100%);
    background-color: #ffffff;
    color: #333;
    padding: 10px;
    border-radius: 6px;
    font-size: 13px;
    max-width: 300px;
    width: max-content;
    text-align: left;
    box-shadow: 0 3px 10px rgba(0, 0, 0, 0.15);
    line-height: 1.5;
    word-break: break-word;
    pointer-events: none;
    border: 1px solid #eee;
  }

  .tooltip-arrow {
    position: absolute;
    bottom: -9px;
    left: 50%;
    margin-left: -5px;
    border-width: 5px;
    border-style: solid;
    border-color: #ffffff transparent transparent transparent;
    filter: drop-shadow(0 2px 2px rgba(0, 0, 0, 0.1));
  }
</style>
