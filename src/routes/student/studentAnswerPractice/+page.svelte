<script>
  /*
   * @Author: OuYang Haobin 1242968386@qq.com
   * @Date: 2025-04-14 10:55:37
 * @LastEditors: OuYang Haobin 1242968386@qq.com
 * @LastEditTime: 2025-07-09 15:27:48
   * @FilePath: /tutorial-platform-fe/src/routes/student/studentAnswerExam/+layout.svelte
   * @Description: 考试练习作答布局
   */
  import BulmaSwitch from "$lib/component/SwitchBtn/BulmaSwitchBlue.svelte";
  import CountdownTimer from "$lib/component/CountdownTimer/CountdownTimer.svelte";
  import { onDestroy, onMount, setContext } from "svelte";
  import { page } from "$app/state";
  import { goto } from "$app/navigation";
  import ActionToast from "$lib/component/ActionToast.svelte";
  import Dialog from "$lib/component/Dialog.svelte";
  import Question from "$lib/component/QuestionAnswer/question.svelte";
  import Watermark from "$lib/component/WaterMark.svelte";

  /**
   * @typedef {Object} Option
   * @property {string} label - 选项标签，如 A、B、C
   * @property {string} value - 富文本格式的选项内容
   */

  /**
   * @typedef {Object} Question
   * @property {number} id - 题目 ID
   * @property {string} type - 题目类型编号，如 "02"、"04"、"06"
   * @property {string} group_name - 题目分组名称，通常带有题号与分值
   * @property {string} content - 题干内容，通常是 HTML 字符串
   * @property {Option[]} [options] - 可选的题目选项，仅选择题/判断题存在
   * @property {number} [answer_num] - 可选的答案数量，通常用于简答题或填空题
   * @property {number} [index]
   * @property {answer} [answer]
   */

  /**
   * @typedef {Object} QuestionGroup
   * @property {string} name - 分组名称
   * @property {string} type - 题目类型
   * @property {GroupQuestion[]} questions - 本组的题目列表
   */

  /**
   * @typedef {Object} GroupQuestion
   * @property {number} index - 题目在本组的索引
   * @property {Question} question - 本组的题目
   */

  /**
   * @typedef {Object} answer
   * @property {String} type - 当前题目的类型
   * @property {number} question_id - 当前题目的id
   * @property {String[]} answer - 当前题目所在的分组的索引
   */

  // 默认信息
  const DEFAULT_NAME = "";
  const DEFAULT_ID = "";

  //查看当前是否为预览模式
  let ifPreview = $state(false);

  //学生名字
  let student_name = DEFAULT_NAME;

  // 学生的学号
  let student_id = DEFAULT_ID;

  // 头像url
  let avatar_url = "/user_icons/defaultAvatar.svg";

  // 是否为全卷模式
  let is_full_examMode = $state(true);

  //练习的名称
  let title = $state("");

  //是否显示左边信息栏
  let showLeftInfo = $state(true);

  //提示展示状态
  let actionToastIsShow = $state(false);

  //绑定action toast的组件
  /**
   * @type {any}
   */
  let actionToast = $state(null);

  //提交确认对话框
  let submit_dialog_open = $state(false);

  /**
   * 考试题目
   * @type {Question[]}
   */
  let examQuestions = $state([]);

  /**
   * @type {QuestionGroup[]}
   */
  const questionGroups = $state([]);

  const query_url = ` /api/practice?practice_submission_id=${encodeURIComponent(page.data.practice_submission_id)}`;

  // 当前显示的问题
  let currentQuestion = $state(examQuestions[0]);

  // 当前显示的问题索引
  let currentQuestionIndex = $state(0);

  // 添加标记题目的数组
  let markedQuestions = $state(Array(examQuestions.length).fill(false));

  // 已答题数量
  let answeredCount = $state(0);

  //  当前考生id
  let practice_submission_id = $state("");

  //错误面板
  let show_error_panel = $state(true);

  /**
   * 标记/取消标记题目
   * @param {number}index
   * @param {MouseEvent} event
   */
  function toggleMarkQuestion(index, event) {
    // 阻止事件冒泡，避免触发题目切换
    event.stopPropagation();

    markedQuestions[index] = !markedQuestions[index];
  }

  // 切换到下一题
  function nextQuestion() {
    if (currentQuestionIndex < examQuestions.length - 1) {
      currentQuestionIndex++;
    }
  }

  // 切换到上一题
  function prevQuestion() {
    if (currentQuestionIndex > 0) {
      currentQuestionIndex--;
    }
  }

  /**
   * 保存答案到后端
   * @param {Object} stu_answer
   * @param {Question} question
   * @param {boolean}if_show_toast
   * @param {String[]}attachment_paths
   */
  async function saveAnswer(
    stu_answer,
    question,
    if_show_toast,
    attachment_paths
  ) {
    if (ifPreview) {
      console.log("当前为预览模式");
      return;
    }

    try {
      // console.log("Saving answer:", stu_answer);
      // console.log("practice_submission_id:", practice_submission_id);
      // console.log("attachment_paths:", attachment_paths);

      // 构建数据部分
      const data = {
        practice_submission_id: Number(practice_submission_id) || 0, // 从上下文获取练习ID
        question_id: question.id,
        type: "02", //说明是练习
        answer: stu_answer,
        attachment_paths: attachment_paths,
        // 可以根据需要添加其他字段
      };
      //构建请求体
      const requestBody = {
        data: data,
      };

      // 发送请求
      const response = await fetch("/api/practice", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        let err_text = await response.text();
        actionToast.show("error", "保存答案失败" + err_text);
        throw new Error("保存答案失败" + err_text);
      }

      //获取返回的数据
      const resp = await response.json();
      if (resp.status === 0) {
        // console.log(resp.data);
        // console.log("答案保存成功");
        if (if_show_toast) {
          actionToast.show("success", "保存答案成功");
        }
        await getProgress();
      } else {
        actionToast.show("error", "保存答案失败");
        throw new Error("答案保存失败:", resp.msg);
      }
    } catch (error) {
      console.error("保存答案时出错:", error);
      // 可以在这里添加错误处理逻辑
    }
  }

  // 获取当前问题
  $effect(() => {
    currentQuestion = examQuestions[currentQuestionIndex];
  });

  // 获取题目分组信息，用于生成答题卡
  function getQuestionGroups() {
    /**
     * @type {QuestionGroup[]}
     */
    const groups = [];
    /**
     * @type {QuestionGroup | null}
     */
    let currentGroup = null;

    examQuestions.forEach((question, index) => {
      // 如果是新的题型分组
      if (!currentGroup || currentGroup.name !== question.group_name) {
        // 保存上一个分组
        if (currentGroup) {
          groups.push(currentGroup);
        }

        // 创建新分组
        currentGroup = {
          name: question.group_name,
          type: question.type,
          questions: [{ question: question, index: index }],
        };
      } else {
        // 添加到当前分组
        currentGroup.questions.push({ question: question, index: index });
      }
    });

    // 添加最后一个分组
    if (currentGroup) {
      groups.push(currentGroup);
    }

    return groups;
  }

  //获取答题进度
  async function getProgress() {
    try {
      const response = await fetch(
        `/api/practice/progress?practice_submission_id=${encodeURIComponent(practice_submission_id)}`,
        { method: "GET", credentials: "include" }
      );
      if (!response.ok) {
        throw new Error(
          `Failed to fetch progress ,status is ${response.status}`
        );
      }
      const data = await response.json();
      if (data.status === 0) {
        let answer_datas = data.data;
        answeredCount = answer_datas.length;

        console.log("answer_datas", answer_datas);

        //给对应的题目的answer赋值

        examQuestions.forEach((question, index) => {
          let matched = answer_datas.find((/** @type {answer}*/ answer) => {
            return answer.question_id === question.id;
          });
          if (matched) {
            question.answer = matched.answer;
          } else {
            question.answer = undefined;
          }
        });
      } else if (data.status === -10) {
        // console.log("no answer");
      } else {
        console.error("Failed to fetch progress ,status is ", data.status);
        console.error("Failed to fetch progress ,error is ", data.msg);
        throw new Error("Failed to fetch progress ,error is ", data.msg);
      }
    } catch (error) {
      console.error("Error fetching progress:", error);
      actionToast.show("error", `获取进度失败:${error}`);
    }
  }

  /**
   * 跳转到指定题目
   * @param {number}index
   */
  function goToQuestion(index) {
    currentQuestionIndex = index;

    // 如果是全卷模式，滚动到对应题目位置
    if (is_full_examMode) {
      // 使用 setTimeout 确保 DOM 已更新
      setTimeout(() => {
        // 获取题目元素
        const questionElement = document.getElementById(`question-${index}`);
        if (questionElement) {
          // 平滑滚动到题目位置
          if (index === 0) {
            questionElement.scrollIntoView({
              behavior: "smooth",
              block: "start",
            });
          } else {
            questionElement.scrollIntoView({
              behavior: "smooth",
              block: "center",
            });
          }
        }
      }, 0);
    }
  }

  //倒计时结束后的提交逻辑
  async function submitExam() {
    if (!page.data.practice_submission_id || ifPreview) {
      return;
    }
    try {
      const body_data = {
        practice_submission_id: Number(page.data.practice_submission_id),
      };

      //构建请求体
      const requestBody = {
        data: body_data,
      };

      const resp = await fetch("/api/practice/submit", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify(requestBody),
      });

      if (!resp.ok) {
        console.log(`提交失败：${resp.status} `);
        throw new Error(`提交失败：${resp.status} `);
      }

      const resp_data = await resp.json();
      if (resp_data.status == 0) {
        console.log(`提交成功：${resp_data.msg} `);
        ("考试结束，提交成功");
        actionToast.show("success", "提交成功");
        await goto(`/student/practice`);
      } else {
        console.error(`提交失败：${resp_data.msg} `);
        throw new Error(`提交失败：${resp_data.msg} `);
      }
    } catch (e) {
      console.log(`提交失败：${e} `);
      actionToast.show("error", e);
    }
  }

  function goBackForPreview() {
    // 推荐用 history.back() 或 goto 上一个页面
    if (window.history.length > 1) {
      console.log("history.back()");
      history.back();
    } else {
      goto("/teacher/paperManagement"); // 或你想返回的页面
    }
  }

  function goBackToPracticeList() {
    // 推荐用 history.back() 或 goto 上一个页面

    goto("/student/practice"); // 或你想返回的页面
  }

  onMount(async () => {
    

    //查询路径中有考试id，则获取考试信息
    if (page.data.practice_submission_id) {
       ifPreview =
        page.data.practice_submission_id === null ||
        page.data.practice_submission_id === undefined
          ? true
          : false;
    practice_submission_id = page.data.practice_submission_id;
      if (page.data.practice_record.name) {
        title = page.data.practice_record.name;
      }

     

      //初始化题目
      if (!page.data.exam_paper.questions) {
        alert("考试出错，题目为空");
        goto("/student/practice");
        return;
      }
      ifPreview = false;
      examQuestions.length = 0;
      examQuestions.push(...page.data.exam_paper.questions);
      //获取进度
      await getProgress();
      questionGroups.length = 0;
      questionGroups.push(...getQuestionGroups());
      // questionGroups.forEach((group) => {
      //   // group.questions.forEach((question) => {
      //   //   console.log(question.question.answer);
      //   // });
      // });
    } else {
      
      ifPreview = true;

      //如果是预览的话直接从localStorage获取title
      const practice_title = localStorage.getItem("practiceTitle");
      if (!practice_title) {
        title = "预览练习";
      } else {
        title = practice_title;
      }

      //初始化题目
      const stored = localStorage.getItem("examQuestions");
      if (stored) {
        try {
          let data = JSON.parse(stored);
          console.log("examQuestions", data);
          examQuestions.length = 0;
          examQuestions.push(...data);
          questionGroups.length = 0;
          questionGroups.push(...getQuestionGroups());
        } catch (e) {
          console.error("Failed to parse examQuestions from localStorage", e);
          alert("Failed to parse examQuestions from localStorage");
          return;
        }
      }
    }
  });
</script>

<!-- 重置样式并创建考试页面布局 -->

{#if !page.data.load_success}
  <!-- 提交确认对话框 -->
  <Dialog
    bind:isOpen={show_error_panel}
    title="出错了，请回到考试列表刷新重新进入"
    content={page.data.error_msg}
    onConfirm={() => {
      show_error_panel = false;
      window.location.href = "/student/practice";
    }}
    confirmTextBackgroundColor="#266fe8"
  />
{:else}
  <div class="exam-container" class:full-mode={is_full_examMode}>
    <div class="exam-header">
      <button
        class="back-btn"
        onclick={() => {
          ifPreview ? goBackForPreview() : goBackToPracticeList();
        }}
      >
        <span class="icon"> ← </span>
        <span> 返回 </span>
      </button>

      <div class="exam-title">{title}</div>
      <div class="exam-header-right">
        <button
          class="submit-btn"
          onclick={() => {
            submit_dialog_open = true;
          }}>提交</button
        >
      </div>
    </div>
    <!-- 预览提醒 -->
    {#if ifPreview}
      <div class="preview-tip">
        <img src="/student_answer_exam/preview-tip.svg" alt="提示" />
        当前为预览模式，不允许作答
      </div>
    {/if}

    <div class="exam-content">
      <div class="left-info" class:hide={!showLeftInfo}>
        <!-- 学生信息区域 -->
        <!-- <div class="box student-info">
        <div class="avatar">
          <figure class="image is-64x64">
            <img src={avatar_url} alt="头像" />
          </figure>
        </div>
        <div class="student-details">
          {#if student_name !== "" && student_id !== ""}
            <div class="student-name">{student_name}</div>
            <div class="student-id">{student_id}</div>
          {/if}
        </div>
      </div> -->
        <!-- 考试信息区域 -->
        <div class="box exam-info">
          <div class="exam-time-info">
            建议时长:{page.data.practice_record?.duration
              ? `${page.data.practice_record.duration}分钟`
              : "--"}
          </div>
          <div class="timer-container">
            <img src="/student_answer_practice/timer.svg" alt="" />
            <CountdownTimer
              ifPreview={page.data.ifPreview}
              init_end_time={page.data.end_time}
              init_total_seconds={page.data.total_seconds}
              examinee_id={page.data.examinee_id}
              elapsed_seconds={page.data.elapsed_seconds}
              practice_submission_id={page.data.practice_submission_id}
              countUp={true}
              onComplete={async () => {
                console.log("考试结束");
                // await submitExamAfterCountdown();
              }}
            ></CountdownTimer>
          </div>
        </div>
        <!-- 考试作答形式选择区域 -->
        <div class="box preference-info">
          <label for="试卷作答偏好">试卷作答偏好</label>
          <div class="answer-mode">逐题模式</div>
          <BulmaSwitch bind:is_full_examMode></BulmaSwitch>
          <div class="answer-mode">全卷模式</div>
        </div>
      </div>
      <div class="collapse-toggle">
        <div class="btn-layout">
          <button onclick={() => (showLeftInfo = !showLeftInfo)}>
            <img
              src={showLeftInfo
                ? "/student_answer_exam/left-arrows.svg"
                : "/student_answer_exam/right-arrows.svg"}
              alt="切换箭头"
            />
          </button>
        </div>
        <div class="line"></div>
      </div>
      <div class="answer-area" class:stretch={!showLeftInfo}>
        <div class="layout">
          <div class="question-container">
            <Watermark />
            {#if is_full_examMode}
              <!-- 全卷模式：显示所有题目 -->
              {#each examQuestions as question, index}
                <!-- 如果是新的分组就显示分组标题 -->
                {#if index === 0 || question.group_name !== examQuestions[index - 1].group_name}
                  <div class="question-header">
                    <h2>{question.group_name}</h2>
                  </div>
                {/if}
                <div class="question-mark-container" id={`question-${index}`}>
                  <Question
                    {question}
                    {index}
                    {ifPreview}
                    {query_url}
                    {saveAnswer}
                    editor_height="200px"
                  ></Question>
                  <div class="question-mark-btn-container">
                    <button
                      class="mark-btn"
                      class:marked={markedQuestions[index]}
                      onclick={(event) => toggleMarkQuestion(index, event)}
                      title={markedQuestions[index] ? "取消标记" : "标记此题"}
                    >
                      <img
                        src="/student_answer_exam/red_flag.png"
                        alt="标记"
                        class="flag-icon"
                      />
                      {markedQuestions[index] ? "取消标记" : "标记此题"}
                    </button>
                  </div>
                </div>
              {/each}
            {:else}
              <div class="question-header">
                <h2>{currentQuestion.group_name}</h2>
              </div>
              <!-- 逐题模式：只显示当前题目 -->

              <div class="question-mark-container">
                <Question
                  question={currentQuestion}
                  index={currentQuestionIndex}
                  {ifPreview}
                  {query_url}
                  {saveAnswer}
                  editor_height="400px"
                ></Question>
                <div class="question-mark-btn-container">
                  <button
                    class="mark-btn"
                    class:marked={markedQuestions[currentQuestionIndex]}
                    onclick={(event) =>
                      toggleMarkQuestion(currentQuestionIndex, event)}
                    title={markedQuestions[currentQuestionIndex]
                      ? "取消标记"
                      : "标记此题"}
                  >
                    <img
                      src="/student_answer_exam/red_flag.png"
                      alt="标记"
                      class="flag-icon"
                    />
                    {markedQuestions[currentQuestionIndex]
                      ? "取消标记"
                      : "标记此题"}
                  </button>
                </div>
              </div>

              <div class="question-footer">
                <button
                  class="nav-btn"
                  onclick={prevQuestion}
                  disabled={currentQuestionIndex === 0}>上一题</button
                >
                <button
                  class="nav-btn"
                  onclick={nextQuestion}
                  disabled={currentQuestionIndex === examQuestions.length - 1}
                  >下一题</button
                >
              </div>
            {/if}
          </div>
          <!-- 右侧导航栏 -->
          <div class="navigation">
            <div class="box progress-info">
              <label for="答题进度">答题进度</label>
              <span class="progress-count"
                >{answeredCount} / {examQuestions.length}</span
              >
            </div>
            <div class="box nav-sections">
              <div class="nav-header">
                <div class="nav-title">答题卡</div>
                <div class="illustration">
                  <div class="illustration-item">
                    <img
                      src="/student_answer_exam/red_flag.png"
                      alt="标记"
                      class="flag-icon"
                    />
                    <span class="illustration-text">已标记</span>
                  </div>
                  <div class="illustration-item">
                    <div class="round round-C9CDD4"></div>
                    <span class="illustration-text">未填</span>
                  </div>
                  <div class="illustration-item">
                    <div class="round round-165DFF"></div>
                    <span class="illustration-text">已填</span>
                  </div>
                </div>
              </div>

              <!-- 动态生成题目分组和按钮 -->
              {#each questionGroups as group, groupIndex}
                <div class="problem-group">
                  <div class="section-title">{group.name}</div>
                  <div class="question-buttons">
                    {#each group.questions as question, i}
                      <button
                        class="question-btn"
                        onclick={() => goToQuestion(question.index)}
                        class:marked={markedQuestions[question.index]}
                        class:active={question.question?.answer !== null &&
                          question.question?.answer !== undefined}
                      >
                        {question.index + 1}
                      </button>
                    {/each}
                  </div>
                </div>
              {/each}
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
  <ActionToast
    bind:isShow={actionToastIsShow}
    type="success"
    message="success"
    duration={2000}
    bind:this={actionToast}
  />

  <!-- 提交确认对话框 -->
  <Dialog
    bind:isOpen={submit_dialog_open}
    title="请问是否要提交练习？"
    content="提交后将无法重新进入此次练习"
    onConfirm={submitExam}
    confirmTextBackgroundColor="#266fe8"
  />
{/if}

<style lang="scss" scoped>
  @import "https://cdnjs.cloudflare.com/ajax/libs/bulma/0.9.4/css/bulma.min.css";
  /* 重置样式，确保不继承根布局样式 */
  :global(*) {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
  }
  :global(html),
  :global(body) {
    overflow: auto;
  }

  .back-btn {
    display: flex;
    align-items: center;
    gap: 5px;
    background: none;
    border: none;
    color: #666;
    font-size: 14px;
    cursor: pointer;

    &:hover {
      color: #266fe8;
    }

    .icon {
      font-size: 12px;
    }
  }

  /* 考试容器样式 */
  .exam-container {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background-color: #f5f5f5;
    min-width: 1200px;
    min-height: 600px;
    display: flex;
    flex-direction: column;
    z-index: 1000; /* 确保覆盖其他内容 */
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Oxygen,
      Ubuntu, Cantarell, "Open Sans", "Helvetica Neue", sans-serif;
  }

  /* 考试头部样式 */
  .exam-header {
    height: 60px;
    background-color: white;
    display: flex;
    align-items: center;
    padding: 0 20px;
    border-color: #acacac;
    border-style: solid;
    border-width: 0 0 1px 0;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  }

  .exam-title {
    // 居中对齐
    position: absolute;
    left: 50%;
    transform: translateX(-50%);
    display: flex;
    justify-content: center;
    font-size: 28px;
    font-weight: bold;
    min-width: 400px; /* 设置最小宽度，确保标题不会缩小到这个值以下 */
    width: fit-content; /* 根据内容自动调整宽度 */
    white-space: nowrap; /* 防止标题换行 */
    overflow: hidden; /* 当容器宽度不足时隐藏溢出内容 */
    text-overflow: ellipsis; /* 显示省略号 */
  }
  .exam-header-right {
    position: absolute;
    display: flex;
    align-items: center;
    width: fit-content;
    right: 7px;
    z-index: 1001; /* 确保在其他元素之上 */
    min-width: fit-content; /* 设置最小宽度 */
    border: 1px solid #ddd;
  }

  .submit-btn {
    background-color: #0066ff;
    color: white;
    border: none;
    width: 100px;
    padding: 8px 16px;
    border-radius: 4px;
    cursor: pointer;
    font-weight: bold;
  }

  /* 考试内容区域 */
  .exam-content {
    display: flex;
    overflow: hidden;
    width: 100%;
  }

  /* 学生信息区域 */
  .left-info {
    width: 21.5%;
    min-width: 300px;
    background-color: #f7fafd;
    padding: 10px;
    display: flex;
    flex-direction: column;
    align-items: center;
    transition: transform 0.3s ease-in-out;
  }
  .left-info.hide {
    display: none;
  }

  .student-info {
    width: 100%;
    display: flex;
    align-items: center;
    padding: 10px;
  }

  // 头像
  .avatar {
    margin-bottom: 10px;
    margin-right: 10px;
    border-radius: 10px;
    width: 64px;
    height: 64px;
    display: flex;
    align-items: center;
    justify-content: center;
    overflow: hidden;
  }
  // 学生信息细节
  .student-details {
    width: 60%;
    display: flex;
    flex-direction: column;
    align-items: start;
    margin-right: 50px;
  }
  //学生的姓名
  .student-name {
    background-color: #fff7e9;
    width: 80%;
    color: #ff7e08;
    font-weight: bold;
    font-size: 16px;
    margin-bottom: 15px;
    text-align: center;
    padding: 5px;
    border-radius: 10px;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
  //学生的学号
  .student-id {
    background-color: #e8f7ff;
    width: 80%;
    color: #3491fb;
    margin-bottom: 15px;
    font-size: 16px;
    font-weight: bold;
    text-align: center;
    padding: 5px;
    border-radius: 10px;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  // 考试信息区域
  .exam-info {
    width: 100%;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    padding: 10px;
  }

  .timer-container {
    display: flex;
    align-items: center;
    justify-content: start;
    img {
      width: 20px;
      height: 20px;
    }
  }

  // 考试开始时间和结束时间信息区域
  .exam-time-info {
    background-color: #f2f3f5;
    font-size: 14px;
    font-weight: 500;
    width: 70%;
    padding: 5px;
    margin-bottom: 10px;
    border-radius: 10px;
  }

  //作答偏好信息
  .preference-info {
    width: 100%;
    display: flex;
    align-items: center;
    padding: 10px;
  }

  .preference-info label {
    font-size: 16px;
    font-weight: bold;
    margin-right: 15px;
  }

  // 作答模式
  .preference-info .answer-mode {
    color: black;
    font-size: 14px;
    margin-right: 5px;
    margin-left: 5px;
  }

  /* 答题区域 */
  .answer-area {
    width: 77%;
    max-width: 77%;
    min-width: 77%;
    background-color: white;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
    transition: transform 0.3s ease-in-out;
  }
  .answer-area.stretch {
    width: 98.5%;
    max-width: 98.5%;
    min-width: 98.5%;
  }

  .collapse-toggle {
    position: relative;
    background-color: #f7fafd;
    width: 1.5%;
    flex-grow: 0;
    flex-shrink: 0;

    img {
      width: 16px;
      height: 16px;
    }
    .line {
      width: 50%;
      height: 100%;
      border-right: 1px solid #e0e0e0;
    }
    .btn-layout {
      position: absolute;
      padding: 5px;
      height: 60px;
      width: 100%;
      background-color: #f7fafd;
      z-index: 9999;
      margin-top: 150px;

      button {
        height: 100%;
        width: 100%;
        background-color: #ffffff;
        border: none;
        display: flex;
        align-items: center;

        border-radius: 16px;

        &:hover {
          background-color: #eeefef;
        }
      }
    }
  }
  .preview-tip {
    width: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
    background-color: #f9e0c7;
    color: #1e1e1e;
    font-size: 14px;

    img {
      width: 16px;
      height: 16px;
    }
  }

  //最外层容器
  .layout {
    display: flex;
    width: 100%;
  }
  //中间放题目的部分
  .question-container {
    position: relative;
    width: 70%;
    display: flex;
    flex-direction: column;
    height: calc(100vh - 60px);
    min-height: 540px;
    overflow-y: scroll;
    padding: 20px;
    min-width: 500px;
  }

  //题组标题
  .question-header {
    margin-bottom: 10px;

    h2 {
      font-size: 28px;
      font-weight: 800;
    }
  }

  //逐题模式中底部的按钮区域
  .question-footer {
    display: flex;
    justify-content: space-around;
    margin-top: 30px;
    margin-bottom: 30px;
  }

  //逐题模式中的底部按钮样式
  .nav-btn {
    padding: 8px 16px;
    background-color: #0336ff;
    color: white;
    border: none;
    border-radius: 4px;
    cursor: pointer;

    &:disabled {
      background-color: #cccccc;
      cursor: not-allowed;
    }
  }

  /* 全卷模式下的额外样式 */
  :global(.exam-container.full-mode .answer-area) {
    padding-bottom: 50px;
  }

  //右侧导航区域
  .navigation {
    width: 30%;
    height: calc(100vh - 60px);
    min-height: 540px;
    background-color: white;
    padding: 5px;
    border-left: 1px solid #e0e0e0;
    display: flex;
    flex-direction: column;
  }

  //进度信息
  .progress-info {
    width: 100%;
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 20px;
    background-color: #f5f7fb;
  }
  //显示进度的样式
  .progress-count {
    font-size: 23px;
    font-weight: bold;
    color: #0336ff;
  }

  .progress-info label {
    font-size: 20px;
    font-weight: bold;
  }
  //说明区域样式
  .nav-sections {
    height: 100%;
    overflow: scroll;
  }
  // 用于放置nav-sections的头部位置，放"答题卡"标题和图例说明
  .nav-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  .nav-header .nav-title {
    font-size: 14px;
    color: #165dff;
    border-bottom: 1px solid #165dff;
  }

  .round {
    width: 8px;
    height: 8px;
    border-radius: 50%;
  }

  .round-C9CDD4 {
    background-color: #c9cdd4;
  }

  .round-165DFF {
    background-color: #165dff;
  }
  /* 图例说明区域样式 */
  .illustration {
    display: flex;
    gap: 10px;
    padding: 10px;
  }
  .illustration-item {
    display: flex;
    align-items: center;
    gap: 5px;
  }

  .illustration-text {
    font-size: 16px;
    font-weight: bold;
    color: 333333;
  }

  .problem-group {
    margin-bottom: 20px;
  }

  .section-title {
    font-weight: bold;
    margin: 10px 0 10px 0;
    font-size: 16px;
    font-weight: bold;
    color: 333333;
  }

  .question-buttons {
    display: flex;
    flex-wrap: wrap;
    gap: 5px;
    margin-bottom: 10px;
  }

  .question-btn {
    width: 30px;
    height: 30px;
    display: flex;
    align-items: center;
    justify-content: center;
    border: 1px solid #ddd;
    background-color: #f9f9f9;
    border-radius: 4px;
    cursor: pointer;
    font-size: 14px;
    margin-right: 20px;
  }

  .question-btn:hover {
    background-color: #e6f2ff;
    border-color: #0066ff;
  }

  .question-btn {
    border: 1px solid #ddd;
    background-color: white;
  }

  .question-btn.active {
    background-color: #e6f2ff;
    border-color: #0066ff;
    color: #0066ff;
  }

  .question-btn.marked {
    position: relative;

    &::after {
      content: "";
      position: absolute;
      top: -5px;
      left: -5px;
      width: 14px;
      height: 14px;
      background-image: url("/student_answer_exam/red_flag.png");
      background-size: contain;
      background-repeat: no-repeat;
      background-position: center;
    }
  }
  .question-mark-container {
    position: relative;
    display: flex;
    justify-content: space-between;
    width: 100%;
  }

  //标记按钮样式
  .mark-btn {
    position: absolute;
    top: 0;
    right: 0;
    height: 25px;
    width: 90px;
    background-color: #e8f3ff;
    border: 1px solid #165dff;
    border-radius: 4px;
    color: #165dff;
    font-size: 14px;
    font-weight: 500;
    cursor: pointer;
    padding: 8px; /* 增大按钮尺寸 */
    display: flex;
    align-items: center;
    justify-content: space-around;
    opacity: 0.8; /* 提高默认透明度 */
    transition: all 0.2s;
    z-index: 10; /* 确保按钮在最上层 */
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1); /* 添加阴影 */

    &:hover {
      opacity: 1;
      background-color: #ccddff;
    }

    &.marked {
      opacity: 1;
      background-color: #165dff;
      color: #ffffff;
    }
  }

  //红旗样式
  .flag-icon {
    width: 16px;
    height: 16px;
    display: block; /* 确保图标显示 */
  }
  //问题和标记按钮所在的容器
  .question-mark-btn-container {
    position: absolute;
    top: 0;
    right: 0;
    display: flex;
    width: 20%;
    justify-content: center;
    align-items: self-start;
  }
</style>
