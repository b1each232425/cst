/*
 * @Author: zdl 1311866870@qq.com
 * @Date: 2025-06-14 10:56:09
 * @LastEditors: zdl 1311866870@qq.com
 * @LastEditTime: 2025-07-09 15:41:06
 * @FilePath: \tutorial-platform-fe\src\routes\student\checkExamDetails\+page@.svelte
 * @Description: 
 */
<script>
  import { page } from "$app/state";
  import { onMount } from "svelte";
  import { sget } from "$lib/common/api_data.js";
  import BulmaSwitch from "$lib/component/SwitchBtn/BulmaSwitchBlue.svelte";
  import Watermark from "$lib/component/WaterMark.svelte";
  import Quesion from "$lib/component/QuestionCheck/quesion.svelte";
  import Score from "$lib/component/QuestionCheck/score.svelte";
  import ScoreBadge from "$lib/component/QuestionCheck/ScoreBadge.svelte";
  import Dialog from "$lib/component/Dialog.svelte";
  import ActionToast from "$lib/component/ActionToast.svelte";
  import { changeExamPaper } from "./api";

  /**
   * @typedef ActionToastProps
   * @property {boolean} is_show -操作提示是否显示
   * @property {string} type -操作提示类型
   * @property {string} message -操作提示文本
   * @property {number} duration -操作提示持续时间
   * @property {string} icon_src -操作提示图标地址
   */
  // 这里不能将answers用一个类型去包含，只能动态获取
  /**
   * @typedef {Object} Question
   * @property {number} id - 题目 ID
   * @property {string} type - 题目类型编号，如 "02"、"04"、"06"
   * @property {string} content - 题干内容，通常是 HTML 字符串
   * @property {Option[]} [options] - 可选的题目选项，仅选择题/判断题存在
   * @property {Answer} answers - 原题目答案
   * @property {StudentAnswer}student_answers - 学生作答详情
   * @property {string} analysis - 题目解析
   * @property {number}student_score - 学生在本题的得分
   * @property {number}score - 本题满分
   * @property {string} group_name - 题目分组名称，通常带有题号与分值
   * @property {number} group_id - 题组唯一ID
   * @property {number} answer_num - 可选的答案数量，通常用于简答题或填空题
   * @property {string} status - 表明此时作答情况  00 全对 02 含错 04 全错 用于答题卡渲染
   * @property {number} [index] - 用于设置在本题组的索引
   */

  /**
   * @typedef {Object} GroupQuestion
   * @property {number} index - 题目在卷子中的总索引
   * @property {Question} question - 本组的题目
   */

  /**
   * @typedef {Object} QuestionGroup
   * @property {number} id - 分组唯一ID
   * @property {string} name - 分组名称
   * @property {string} type - 题目类型
   * @property {GroupQuestion[]} questions - 本组的题目列表
   */

  /**
   * @typedef {Object} Answer - 原试卷题目详情
   * @property {number} index - 类型
   * @property {number} [index]
   * @property {Object[]} answer - 原题答案
   */

  /**
   * @typedef {Object} StudentAnswer - 学生作答题目记录
   * @property {string} type - 类型
   * @property {number} [index]
   * @property {String[]} answer - 学生回答
   */

  /**
   * @typedef {Object} ExamInfo
   * @property {number} answerNum - 学生作答数量
   * @property {string} paperName - 试卷名称
   * @property {number} questionNum - 题目总数
   * @property {number} studentScore - 学生总分
   * @property {number} answerTime - 学生作答时间（以分钟为单位）
   */

  /**
   * @typedef {Object} ExamSessionInfo
   * @property {number} ExamTime - 场次正常持续时长
   * @property {number} ExamineeID - 考生ID
   * @property {number} ID - 考试ID
   * @property {number} PaperID - 场次试卷ID
   * @property {number} SessionNum - 考试场次顺序索引
   */

  /**
   * @typedef {Object} Rank
   * @property {string} official_name - 考生昵称
   * @property {number} total_score  - 考生成绩
   * @property {number} rank - 排名
   * @property {number} student_id - 学生用户ID
   */

  const ICONS = {
    action_success: "/paper/action_success.svg",
    action_error: "/paper/action_fail.svg",
  };
  /**
   * 操作提示属性
   * @type {ActionToastProps}
   */
  let action_toast_props = $state({
    is_show: false,
    type: "success",
    message: "操作成功",
    duration: 2000,
    icon_src: ICONS["action_success"],
  });

  /**
   * 显示操作提示
   * @param {string} type - 提示类型
   * @param {string} message - 提示文本
   */
  function showActionToast(type, message) {
    action_toast_props.is_show = true;

    action_toast_props.type = type;

    action_toast_props.message = message;

    switch (type) {
      case "success":
        action_toast_props.icon_src = ICONS["action_success"];
        break;
      case "error":
        action_toast_props.icon_src = ICONS["action_error"];
        break;
      default:
        action_toast_props.icon_src = ICONS["action_success"];
    }
  }

  // 是否为全卷模式
  let is_full_examMode = $state(true);

  //学生名字
  let student_name = "邹德伦";
  // 学生的学号
  let student_id = "15920422045";
  // 头像url
  let avatar_url = "/user_icons/defaultAvatar.svg";

  // 考生当前的用户ID
  let userID = $state(page.data.studentID);
  /**
   * @type {Question[]}
   */
  // 考试试卷 + 学生作答 题目数组 包括很多信息；需要从里面拿
  let exam_paper = $state(page.data.exam_paper);

  // 当前显示的问题
  let currentQuestion = $state(exam_paper[0]);

  // 当前显示的问题索引
  let currentQuestionIndex = $state(0);

  /**
   * @type {QuestionGroup[]}
   */
  // 题组 里面需要包含题目，题组需要根据这个groupID
  let questionGroups = $state([]);

  // 试卷原总分
  let total_score = $state(0);

  /**
   * @type {Rank[]}
   */
  // 考试场次排行榜
  let rank = $state(page.data.rank);

  /**
   * @type {Rank}
   */
  // 当前学生的得分与信息
  // @ts-ignore
  let userRank = $state({});

  /**
   * @type {ExamInfo}
   */
  // 考试基本信息
  let examInfo = $state(page.data.examInfo);
  /**
   * @type {ExamSessionInfo[]}
   */
  // 考试场次信息，用于切换上次试卷
  let examSessionInfo = $state(page.data.examSessionInfo);

  // 这里要保存额外的一次originSessionIngo
    /**
   * @type {ExamSessionInfo[]}
   */
  let originExamSessionInfo = $state([])
  let nowSessionIndex = $state(0);
  let examSessionInfoLenght = examSessionInfo.length;
  //是否显示左边信息栏
  let showLeftInfo = $state(true);

  // 数据是否异常
  let invalid = $state(false);

  onMount(async () => {
    invalid = page.data.invalid;
    if (invalid) {
      console.error("数据异常！请联系管理员");
      return;
    }
    computePaperTotalScoce();
    createQuestionGroup();
    getStudentRankInfo();
    sortSessionInfo();
    showScore();
    originExamSessionInfo = JSON.parse(JSON.stringify(examSessionInfo));
    examSessionInfoLenght = originExamSessionInfo.length
  });

  function goBack() {
    window.location.href = "/student/exam";
  }

  // 这里定义一次排序
  function sortSessionInfo() {
    examSessionInfo.sort((a, b) => a.SessionNum - b.SessionNum);
  }

  // 这里直接操作保存到的examSessionInfo即可
  /**
   * @param {number} index - 操作的索引 可选 -1 、 1
   */
  async function ShowOtherSessionDetails(index) {
    if (
      nowSessionIndex + index < 0 ||
      nowSessionIndex + index > examSessionInfoLenght
    ) {
      console.error("操作失败，数组索引失效");
      showActionToast("error", "数据错误，无法进行切换");
      return
    }
    let queryIndex = nowSessionIndex + index;
    let sessionInfo = originExamSessionInfo[queryIndex];
    const result = await changeExamPaper(
      sessionInfo.ExamineeID,
      sessionInfo.PaperID,
      sessionInfo.ID
    );
    if (result == null || !result) {
      showActionToast("error", "数据错误，无法进行切换");
      return;
    }
    exam_paper = sget(result, "exam_paper", []);
    rank = sget(result, "rank", []);
    examInfo = sget(result, "examInfo", {});
    userID = sget(result, "studentID", "");
    total_score = 0;
    // 这里的问题也要重新获取
    resetQuestionGroup()
    computePaperTotalScoce()
    getStudentRankInfo()
    showActionToast("success", "切换成功");
    nowSessionIndex = queryIndex
    showScore()
  }

  // 重置题目题组
  function resetQuestionGroup(){
    questionGroups = [];
    createQuestionGroup()

  }

  // 对所有题目进行分组
  function createQuestionGroup() {
    /**
     * @type {QuestionGroup | null}
     */
    // 本次题目所在题组
    let currentGroup = null;

    // 遍历每一题
    exam_paper.forEach((question, index) => {
      // 第一个就需要创建分组 ， 并检测是否 这里定制一个时间复c杂度为O(n)的
      // @ts-ignore
      if (!currentGroup || currentGroup.id !== question.group_id) {
        // 如果此时出现新的分组，此时的分组里面，应该存放这个分组里面有的题
        // 遇到下一个题组的时候，先保存上一个题组
        if (currentGroup) {
          questionGroups.push(currentGroup);
        }
        // 之后创建新分组
        currentGroup = {
          id: question.group_id,
          name: question.group_name,
          type: question.type,
          questions: [{ question: question, index: index }],
        };
        // 如果此时这个题目还是跟上一个题组一样的话，那就直接推到currentGroup就好
      } else {
        currentGroup.questions.push({ question: question, index: index });
      }
    });
    if (currentGroup) {
      // 将最后一个题组插入到group中
      questionGroups.push(currentGroup);
    }
  }
  // 计算本张卷子的总分
  function computePaperTotalScoce() {
    exam_paper.forEach((question) => {
      total_score += question.score;
    });
  }
  function getStudentRankInfo() {
    rank.forEach((rank) => {
      if (rank.student_id === userID) {
        userRank = rank;
      }
    });
  }
  // 切换到下一题
  function nextQuestion() {
    if (currentQuestionIndex < exam_paper.length - 1) {
      currentQuestionIndex++;
      currentQuestion = exam_paper[currentQuestionIndex];
    }
  }

  // 切换到上一题
  function prevQuestion() {
    if (currentQuestionIndex > 0) {
      currentQuestionIndex--;
      currentQuestion = exam_paper[currentQuestionIndex];
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
  function locationBack() {
    window.location.href = "/student/exam";
  }


  let showBadge = $state(false);
  function showScore() {
    showBadge = true;
  }
  
  function onBadgeHide() {
    showBadge = false;
  }

  let badgeX = $state(74); // 固定像素位置
  let badgeY = $state(12); // 固定像素位置
</script>

<svelte:head>
  <link
    rel="stylesheet"
    href="https://cdnjs.cloudflare.com/ajax/libs/bulma/0.9.4/css/bulma.min.css"
  />
</svelte:head>
<ScoreBadge
  score={examInfo.studentScore}
  x={badgeX}
  y={badgeY}
  rotation={10}
  visible={showBadge}
  duration={0}
  onHide={onBadgeHide}
/>
<!-- 错误处理 -->
<Dialog
  bind:isOpen={invalid}
  title="请问是否要提交考试？"
  content="提交后将无法重新进入考试"
  onConfirm={locationBack}
  confirmTextBackgroundColor="#266fe8"
/>

<ActionToast
  bind:isShow={action_toast_props.is_show}
  type={action_toast_props.type}
  message={action_toast_props.message}
  duration={action_toast_props.duration}
  iconSrc={action_toast_props.icon_src}
/>

<!-- 整体框架 -->
<div class="exam-container">
  <!-- 考试信息栏 -->
  <div class="exam-header">
    <!-- 考试顶栏的左操作键 -->
    <div class="exam-header-left">
      <button class="back-btn" onclick={goBack}>
      &lt; 返回
      </button>
    </div>
    <div class="exam-title">{examInfo.paperName}</div>
    {#if examSessionInfoLenght >= 2}
    <div class="exam-header-right">
      <button
        class="submit-btn"
        class:disabled={nowSessionIndex == 0}
        onclick={async () => {
          ShowOtherSessionDetails(-1);
        }}> &lt;&lt;上一张</button
      >
      <button
        class="submit-btn"
        class:disabled={nowSessionIndex == examSessionInfoLenght - 1}
        onclick={async () => {
          ShowOtherSessionDetails(1);
        }}> 下一张&gt;&gt;
        </button
      >
    </div>
    {/if}
  </div>
  <!-- 考试主体布局 -->
  <div class="exam-content">
    <!-- 左侧侧边栏布局 -->
    <div class="left-info" class:hide={!showLeftInfo}>
      <!-- <div class="box user-info">
        <img alt="头像" class="avatar" src={avatar_url} />
        <div class="student-details">
          <div class="student-name">{student_name}</div>
          <div class="student-id">{student_id}</div>
        </div>
      </div> -->
      <div class="box exam-info">
        <div class="exma-info-tip">作答详情</div>
        <div class="exam-into-deatil">
          <img
            class="icon"
            src="/student_exam_practice/paper.png"
            alt="试卷张数"
          />
          <label for="试卷">试卷：</label>
          <label for="具体数值" class="blodFont">{nowSessionIndex + 1}</label>
          <label for="具体数值">/{examSessionInfoLenght}</label>
        </div>
        <div class="exam-into-deatil">
          <img class="icon" src="/student_exam_practice/score.png" alt="得分" />
          <label for="得分">得分：</label>
          <label for="具体数值"
            ><span
              style:color={examInfo.studentScore >= total_score * 0.6
                ? "#4CAF50" // 高分显示绿色
                : "#F44336"}
              style:font-weight={"bolder"}
              style:margin-right={"5px"}>{examInfo.studentScore}分</span
            ></label
          >
          <label for="具体数值"> /{total_score}分</label>
        </div>
        <div class="exam-into-deatil">
          <img
            class="icon"
            src="/student_exam_practice/time.png"
            alt="答题用时"
          />
          <label for="答题用时">答题用时：</label>
          <label for="具体数值" class="blodFont"
            >{examInfo.answerTime}分钟</label
          >
          <label for="具体数值"> /{examSessionInfo[nowSessionIndex].ExamTime}分钟</label>
        </div>
        <div class="exam-into-deatil">
          <img
            class="icon"
            src="/student_exam_practice/answerNum.png"
            alt="答题数量"
          />
          <label for="答题数量">答题数量：</label>
          <label for="具体数值" class="blodFont">{examInfo.answerNum}题</label>
          <label for="具体数值"> /{examInfo.questionNum}题</label>
        </div>
      </div>
      <!-- 考试作答形式选择区域 -->
      <div class="box preference-info">
        <label for="试卷作答偏好">查看解析偏好</label>
        <div class="answer-mode">逐题模式</div>
        <BulmaSwitch bind:is_full_examMode></BulmaSwitch>
        <div class="answer-mode">全卷模式</div>
      </div>
      <div class="box rank">
        <div class="rank-header">
          <label for="考试排行榜">考试排行榜</label>
        </div>
        <div class="rank-table">
          <div class="rank-table-header">
            <div class="rank-col rank-number">排名</div>
            <div class="rank-col rank-name">姓名</div>
            <div class="rank-col rank-score">成绩</div>
          </div>
          <div class="rank-list">
            {#each rank as student, i}
              <div
                class="rank-item"
                class:rank-1={student.rank === 1}
                class:rank-2={student.rank === 2}
                class:rank-3={student.rank === 3}
              >
                <div class="rank-col rank-number">{student.rank}</div>
                <div class="rank-col rank-name">{student.official_name}</div>
                <div class="rank-col rank-score">{student.total_score}</div>
              </div>
            {/each}
          </div>
        </div>
        <!-- TODO 这里还需要一个包含的容器 -->
        <div class="rank-footer">
          <div class="rank-user">
            <div class="rank-col rank-number-user">{userRank.rank}</div>
            <div class="rank-col rank-name-user">{userRank.official_name}</div>
            <div class="rank-col rank-score-user">{userRank.total_score}</div>
          </div>
        </div>
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
        <Watermark />
        <div class="question-container" class:stretch={!showLeftInfo}>
          {#if is_full_examMode}
            {#each exam_paper as question, index}
              <!-- 如果是新的分组就显示分组标题 -->
              {#if index === 0 || question.group_name !== exam_paper[index - 1].group_name}
                <div class="question-header">
                  <h2>{question.group_name}</h2>
                </div>
              {/if}
              <div class="question-mark-container" id={`question-${index}`}>
                <!-- 题目组件及学生作答-->
                <Quesion {question} {index} />
                <!-- 学生作答得分/解析组件 -->
                <Score {question} />
              </div>
            {/each}
          {:else}
            <div class="question-header">
              <h2>{currentQuestion.group_name}</h2>
            </div>
            <!-- 逐题模式：只显示当前题目 -->

            <div class="question-mark-container">
              <Quesion
                question={currentQuestion}
                index={currentQuestionIndex}
              />
              <Score question={currentQuestion} />
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
                disabled={currentQuestionIndex === exam_paper.length - 1}
                >下一题</button
              >
            </div>
          {/if}
        </div>
        <!-- 右侧导航栏 -->
        <div class="navigation">
          <div class="box nav-sections">
            <div class="nav-header">
              <div class="nav-title">答题卡</div>
              <div class="illustration">
                <div class="illustration-item">
                  <div class="round round-00B42A"></div>
                  <span class="illustration-text">答对</span>
                </div>
                <div class="illustration-item">
                  <div class="round round-F83D47"></div>
                  <span class="illustration-text">答错</span>
                </div>
                <div class="illustration-item">
                  <div class="round round-ff7b00"></div>
                  <span class="illustration-text">含错</span>
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
                      class:question-btn-right={question.question.status ===
                        "00"}
                      class:question-btn-half-right={question.question
                        .status === "02"}
                      class:question-btn-wrong={question.question.status ===
                        "04"}
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

<style lang="scss" scoped>
  :global(*) {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
  }
  :global(html),
  :global(body) {
    overflow: auto;
  }

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
  .exam-content {
    display: flex;
    overflow: hidden;
    width: 100%;
  }

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
  .back-btn {
    display: flex;
    align-items: center;
    gap: 5px;
    background: none;
    border: none;
    color: #666;
    font-size: 18px;
    cursor: pointer;
    margin-left: 20px;
   width: 120px;

    &:hover {
      color: #266fe8;
    }

    .icon {
      font-size: 12px;
    }
  }
    .submit-btn {
    color: #0066ff;
    background: none;
    border: none;
    width: 120px;
    padding: 8px 16px;
    border-radius: 4px;
    margin-left: 15px;
    font-size: 18px;
    cursor: pointer;
    font-weight: bold;
  }
  .submit-btn.disabled{
    display: none;
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
    min-width: 200px; /* 设置最小宽度 */
  }
  .left-info {
    overflow-y: hidden;
    width: 21.5%;
    max-height: 100%;
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

  .user-info {
    width: 100%;
    display: flex;
    align-items: center;
    padding: 10px;
  }
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
  .exam-info {
    width: 100%;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    padding: 10px;
    border-radius: 10px;
  }
  .exma-info-tip {
    color: #0066ff;
    width: 30%;
    border-bottom: 2px solid #0066ff;
    margin-bottom: 10px;
    padding: 10px;
  }
  .icon {
    margin-right: 10px;
  }
  .blodFont {
    color: black;
    font-weight: bolder;
    margin-right: 5px;
  }
  .exam-into-deatil {
    display: flex;
    align-items: center;
    margin-bottom: 8px;
  }
  //作答偏好信息
  .preference-info {
    width: 100%;
    height: 60px;
    display: flex;
    align-items: center;
    padding: 10px;
    border-radius: 10px;
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

  .rank {
    width: 100%;
    padding: 10px;
  }
  .rank-header {
    width: 100%;
    height: 55px;
    padding: 10px 10px 10px 0px;
    border-bottom: 1px solid #f4f4f4;
    margin-bottom: 10px;
  }
  .rank-header label {
    color: #4a4a4a;
    font-size: 16px;
    font-weight: bold;
    margin-right: 15px;
    font-weight: bold;
  }
  .rank-table {
    max-height: 450px;
    overflow: hidden;
  }
  .rank-table-header {
    display: flex;
    padding: 12px 20px;
    background: #f8f9fa;
    border-bottom: 1px solid #e9ecef;
    font-weight: 600;
    color: #6c757d;
    font-size: 14px;
  }
  .rank-col {
    display: flex;
    align-items: center;
  }

  .rank-number {
    width: 60px;
    justify-content: center;
    font-weight: 600;
    color: #666;
  }
  .rank-number-user {
    width: 60px;
    justify-content: center;
    font-weight: 600;
    margin-left: 10px;
    color: rgba(0, 82, 217, 1);
  }

  .rank-name {
    flex: 1;
    padding-left: 8px;
    color: #333;
  }
  .rank-name-user {
    flex: 1;
    padding-left: 8px;
    color: rgba(0, 82, 217, 1);
  }

  .rank-score {
    width: 60px;
    justify-content: center;
    font-weight: 600;
    color: #333;
  }
  .rank-score-user {
    width: 42px;
    justify-content: center;
    font-weight: 600;
    margin-right: 30px;
    color: rgba(0, 82, 217, 1);
  }
  .rank-list {
    max-height: 400px;
    overflow-y: auto;
    scrollbar-width: thin;
    scrollbar-color: #cbd5e0 #f7fafc;
  }

  .rank-list::-webkit-scrollbar {
    width: 6px;
  }

  .rank-list::-webkit-scrollbar-track {
    background: #f7fafc;
  }

  .rank-list::-webkit-scrollbar-thumb {
    background: #cbd5e0;
    border-radius: 3px;
  }

  .rank-list::-webkit-scrollbar-thumb:hover {
    background: #a0aec0;
  }

  .rank-item {
    display: flex;
    padding: 12px 20px;
    transition: background-color 0.2s ease;
    border-radius: 10px;
    margin-bottom: 5px;
  }
  /* 前三名不同背景色 */
  .rank-1 {
    background-color: rgba(255, 252, 243, 1);
  }

  .rank-2 {
    background-color: rgba(249, 254, 255, 1);
  }

  .rank-3 {
    background-color: rgba(255, 249, 249, 1);
  }

  // 这里就是跟班级排行榜相等的了 然后就要调那个显示的范围
  .rank-footer {
    width: 100%;
    height: 75px;
    border-top: 1px solid #e9ecef;
    padding: 10px;
    .rank-user {
      height: 85%;
      border-radius: 5px;
      width: 100%;
      display: flex;
      border: 1px solid rgba(0, 82, 217, 1);
      color: rgba(0, 82, 217, 1);
      background-color: rgba(0, 82, 217, 0.0745098039215686);
    }
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
  .question-container.stretch {
    width: 76.5%;
    max-width: 76.5%;
    min-width: 76.5%;
  }
  .layout {
    display: flex;
    width: 100%;
  }
  .question-container {
    position: relative;
    width: 70%;
    display: flex;
    flex-direction: column;
    height: calc(100vh - 60px);
    min-height: 540px;
    padding: 20px;
    min-width: 500px;
    overflow: auto;
  }
  .question-header {
    margin-bottom: 10px;

    h2 {
      font-size: 22px;
      font-weight: 600;
    }
  }
  .question-footer {
    display: flex;
    justify-content: space-around;
    margin-top: 30px;
    margin-bottom: 30px;
  }
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
  .nav-sections {
    height: 100%;
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

  .round-ff7b00 {
    background-color: #ff7b00;
  }

  .round-00B42A {
    background-color: #00b42a;
  }
  .round-F83D47 {
    background-color: #f83d47;
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
    font-size: 14px;
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
    border-radius: 4px;
    cursor: pointer;
    font-size: 14px;
    margin-right: 20px;
  }
  .question-btn-right {
    background-color: #e8ffea;
    color: #00b42a;
  }
  .question-btn-half-right {
    background-color: #ffe8abfe;
    color: #ff7b00;
  }
  .question-btn-wrong {
    background-color: #f8d2d8;
    color: #f83d47;
  }

  .question-btn:hover {
    border-color: #0066ff;
  }

  @media (max-width: 1602px) {
    .exma-info-tip,
    .preference-info label,
    .preference-info .answer-mode,
    .rank-header label,
    .rank-number,
    .rank-number-user,
    .rank-name,
    .rank-name-user,
    .rank-score,
    .rank-score-user {
      font-size: 12px;
    }
    .rank-list{
      flex: 1;
      max-height: 300px;
    }
  }
  @media (max-width: 1450px){
        .rank-list{
      flex: 1;
      max-height: 200px;
    }
  }
  @media (max-width:1400px){
    .left-info{
      overflow-y: auto;
    }
  }
</style>
