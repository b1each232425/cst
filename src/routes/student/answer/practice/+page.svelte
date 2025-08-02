<script>
  /*
   * @Author: PENG HAIFENG 1614818457@qq.com
   * @Date: 2025-07-23 10:55:37
   * @LastEditors: PENG HAIFENG 1614818457@qq.com
   * @LastEditTime: 2025-07-23 10:28:54
   * @FilePath: \src\routes\student\answer\+page.svelte
   * @Description: 考试练习作答布局
   */
  
  import { goto } from '$app/navigation';
  import { onMount } from 'svelte';
  import { page } from "$app/state";
  import CountdownTimer from '../_component/CountdownTimer/CountdownTimer.svelte';
  import BulmaSwitch from '../_component/SwitchBtn/BulmaSwitchBlue.svelte';
  import Watermark from '../_component/WaterMark.svelte';
  import Toast from '$lib/components/Toast/Toast.svelte';
  import ExamInfoModal from '../_component/ExamInfoModal/ExamInfoModal.svelte';
  import Question from '../_component/QuestionAnswer/question.svelte';
  import { toast } from '$lib/components/Toast/Toast';
  import Button from '$lib/components/Button/Button.svelte';
  import MessageBox from '$lib/components/MessageBox/MessageBox.js';
  import { sget } from '$lib/utils/index.js';

  /**
   * @typedef {Object} Question
   * @property {number} id - 题目 ID
   * @property {string} type - 题目类型编号，如 "02"、"04"、"06"
   * @property {string} group_name - 题目分组名称，通常带有题号与分值
   * @property {string} content - 题干内容，通常是 HTML 字符串
   * @property {Option[]} [options] - 可选的题目选项，仅选择题/判断题存在
   * @property {number} [answer_num] - 可选的答案数量，通常用于简答题
   * @property {number} [index]
   * @property {answer} [answer]
   *

   *
   * @typedef {Object} QuestionGroup
   * @property {string} name - 分组名称
   * @property {string} type - 题目类型
   * @property {GroupQuestion[]} questions - 本组的题目列表
   *

   *
   * @typedef {Object} GroupQuestion
   * @property {number} index - 题目在本组的索引
   * @property {Question} question - 本组的题目
   *

   *
   * @typedef {Object} answer
   * @property {String} type - 当前题目的类型
   * @property {number} question_id - 当前题目的id
   * @property {String[]} answer - 当前题目所在的分组的索引
   *

   *
   * @type {QuestionGroup[]}
   *

   *
   * 考试题目
   * @type {Question[]}
   *

   *
   * 标记/取消标记题目
   * @param {number}index
   * @param {MouseEvent} event
   *

   *
   * 跳转到指定题目
   * @param {number}index
   *

   *
   * 保存答案到后端
   * @param {Object} stu_answer
   * @param {Question} question
   * @param {boolean}if_show_toast
   * @param {String[]}attachment_paths
   */


   // 学生基本信息变量
  const DEFAULT_NAME = "";
  const DEFAULT_ID = "";
  let student_name = DEFAULT_NAME;  //学生名字
  let student_id = DEFAULT_ID; // 学生的学号
  let avatar_url = "/user_icons/defaultAvatar.svg"; // 头像url
  

  // 考试相关信息变量
  let practice_id = $state(""); //练习id
  let practice_submission_id = $state(""); //练习场次id
  let elapsed_seconds = $state(0); // 考试已用时，单位为秒
  let examQuestionsMap = $state(new Map()); //考试题目map数组 key题目id value包含题目的题组
  let questionGroupsMap = $state(new Map());  //考试题组map数组 key题目id value包含题组的信息
  let elapsedSeconds = $state(0); // 考试已用时，单位为秒
  let totalscore = $state(0); // 考试总分
  let practice_record = $state(null); //练习建议时长
  let load_success = $state(true);  //是否加载成功
  let ifPreview = $state(false); //查看当前是否为预览模式
  let is_full_examMode = $state(true); // 是否为全卷模式
  let title = $state("");  //考试试卷的标题
  let showLeftInfo = $state(true); //是否显示左边信息栏
  let  query_url = $state(""); //获取已经作答过的答案的url
  let questionGroups = $state([]); //渲染题组
  let examQuestions = $state([]); //考试题目变量
  let currentQuestion = $state(examQuestions[0]); // 当前显示的问题
  let currentQuestionIndex = $state(0); // 当前显示的问题索引
  let markedQuestions = $state(Array(examQuestions.length).fill(false)); // 添加标记题目的数组
  let answeredCount = $state(0); // 已答题数量

  
  //按钮控制类逻辑
  function submitMessageBox() {
    if (ifPreview) {
      toast.warning('提交过程中失败！', 2000);
      console.log("预览模式，不需要提交试卷");
      return;
    }
		MessageBox({
			title: '请问是否要提交练习？',
			content: '提交后将无法重新进入此次练习',
			onConfirm: () => {
          submitPractice()
			},
		});
	}
  function goBack() {  //预览返回按钮
    if (window.history.length > 1) {
      history.back();
    } else {
      goto("/teacher/practice"); // 或你想返回的页面
    }
  }
  function nextQuestion() { // 切换到下一题
    if (currentQuestionIndex < examQuestions.length - 1) {
      currentQuestionIndex++;
    }
  }
  function prevQuestion() { // 切换到上一题
    if (currentQuestionIndex > 0) {
      currentQuestionIndex--;
    }
  }
  function goBackForPreview() {  //返回上一个页面
    // 推荐用 history.back() 或 goto 上一个页面
    if (window.history.length > 1) {
      history.back();
    } else {
      goto("/teacher/practice"); // 或你想返回的页面
    }
  }
  function goBackToPracticeList() { //返回上一个页面 学生
    // 推荐用 history.back() 或 goto 上一个页面
    goto("/student/practice"); // 或你想返回的页面
  }
  function goToQuestion(index) { //跳转到指定题目
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


  //渲染题目信息类
  function getQuestionGroups() { // 获取题目分组信息，用于生成答题卡 用来生成题组
    const groups = [];

    const sortedGroups = Array.from(questionGroupsMap.values()).sort((a, b) => a.order - b.order); //升序排序出一个数组

    sortedGroups.forEach(groupInfo => {
      const groupId = groupInfo.ID; // 题组 id
      const groupQuestions = examQuestionsMap.get(String(groupId)) || []; // 该分组下的题目数组

      

      if (groupQuestions.length === 0) return; // 如果没有题目则跳过
      groups.push({ // 组装 QuestionGroup 对象
        name: groupInfo.Name,
        type: groupQuestions[0].type,
        questions: groupQuestions.map((question, index) => ({
          question,
          index
        })),
      });
    });
    
    return groups;
  }
  function flattenExamQuestions() { //将题组扁平化拆开成一个题目数组 用来生成题目
    const result = [];
    const sortedGroups = Array.from(questionGroupsMap.values()).sort((a, b) => a.order - b.order); //升序排序数组

    sortedGroups.forEach(groupInfo => {
      const groupId = groupInfo.ID;
      const groupQuestions = examQuestionsMap.get(String(groupId)) || [];

      let totalScore = 0;
      for (const item of groupQuestions) {
        // 如果每道题的分数字段是 question.Score
        totalScore += Number(item.Score || 0);
      }


        groupQuestions.forEach(q => {
        result.push({
          ...q,
          group_name: groupInfo.Name,
          group_score : totalScore, // 该组的总分
        });
      });
    });
    return result;
  }
  $effect(() => { // 获取当前问题
    currentQuestion = examQuestions[currentQuestionIndex];
  });
  $effect(() => { //实时更新作答题目数量
    answeredCount = examQuestions.reduce((acc, question, index) => {
      if (
        question?.Answer !== null &&
        question.Answer !== undefined &&
        Array.isArray(question.Answer) &&
        !question.Answer.every((str) => str === "") &&
        question.Answer.length !== 0
      ) {
        acc++;
      }
      return acc;
    }, 0);
  });

 
  //练习提交类逻辑
  function submitPractice() { //倒计时结束后的提交逻辑
    const body_data = {  //请求体
      type: "02", 
      practice_submission_id: Number(practice_submission_id), //题目id
      practice_id: Number(practice_id),
    };
    const requestBody = {
      data: body_data,
    };

    fetch("/api/respondent/submit", {  //发起请求
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include",
      body: JSON.stringify(requestBody),
    })
      .then((resp) => {
        if (!resp.ok) {
          console.log(`提交失败：${resp.status} `);
          throw new Error(`提交失败：${resp.status} `);
        }
        return resp.json();
      })
      .then((resp_data) => {
        if (resp_data.status === 0) {
          toast.success('练习结束，提交成功！', 2000);
          goto(`/student/practice`);
        } else {
          toast.error(`提交失败！${resp_data.msg || ''}`, 2000);
        }
      })
      .catch((e) => {
        console.log(`提交失败：${e} `);
        toast.error('提交失败', 2000);
      });
  }
  function saveAnswer( //实时保存答案到后端
    stu_answer,
    question,
    if_show_toast,
    attachment_paths
  ) {

    if (ifPreview) {
      toast.warning('当前为预览模式！', 2000);
      return;
    }

    const data = { // 构建数据部分
      practice_submission_id: Number(practice_submission_id), //题目id
      practice_id: Number(practice_id),
      question_id: question.ID, //题目id
      type: "02", //02说明是练习
      answer: stu_answer,  //该题答案
      attachment_paths: attachment_paths, //附件
    };
    const requestBody = {
      data: data,
    };

    fetch("/api/respondent", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include",
      body: JSON.stringify(requestBody),
    })
      .then((response) => {
        if (!response.ok) {
          console.error("保存答案时出错:", response.status);
          throw new Error("保存答案时出错:" + response.status);
        }
        return response.json();
      })
      .then((resp) => {
        if (resp.status === 0) {
          if (if_show_toast) {
            toast.success('答案保存成功', 2000);
          }
        } else {
          console.error("答案保存失败:", resp.msg);
          toast.error(`答案保存失败！${resp.msg || ''}`, 2000);
        }
      })
      .catch((error) => {
        console.error("保存答案时出错:", error);
        toast.error(`保存答案时出错！${error.message || ''}`, 2000);
      });
  }

  
  // 阻止事件冒泡，避免触发题目切换
  function toggleMarkQuestion(index, event) {
    event.stopPropagation();
    markedQuestions[index] = !markedQuestions[index];
  }

 
  onMount(async () => {
    // 获取url中的考试参数
    practice_id = page.url.searchParams.get("practice-id");

    //如果practice-id为空则从local store中取题目
    if (!practice_id) {
      ifPreview = true;//如果没有practice_id则为预览模式
      const stored = localStorage.getItem("practiceQuestions");
      if (stored) {
        try {
          let data = JSON.parse(stored);
          examQuestionsMap =  data.Questions;
          questionGroupsMap =  data.QuestionGroupInfo;
          //加载题目
          examQuestions.length = 0;
          examQuestions.push(...flattenExamQuestions());
          questionGroups.length = 0;
          questionGroups.push(...getQuestionGroups());

          //如果是预览的话直接从localStorage获取title
          const exam_title = localStorage.getItem("practiceTitle");
          if (!title) {
            if (!exam_title) {
              title = "预览练习";
            }
            else  {
              title = exam_title;
            }
          }
        } catch (e) {
          console.error("获取题目时出错！！", e);
          toast.error('获取题目时出错！', 2000);
          return;
        }
      }
    }  else {
      // 初始化考试
      fetch('/api/respondent/init', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify({
          data: {
            type: "02",
            practice_id: Number(practice_id),
          }
        })
      })
      .then(response => {
        if (!response.ok) {
          return response.text().then(text => {
            console.error('接口响应失败:', text);
            throw new Error(text);
          });
        }
        return response.json();
      })
      .then(data => {
        if (data.status !== 0) {
          console.error(`接口错误: ${data.msg}`);
          throw new Error(data.msg);
        }
        // 赋值到变量
        //题目
        examQuestionsMap = new Map(Object.entries(sget(data, "data.Questions", {})));
        questionGroupsMap = new Map(Object.entries(sget(data, "data.QuestionGroupInfo", {})));
        //时间类
        elapsed_seconds = sget(data, "data.ElapsedSeconds", 0);
        //考试信息类
        title = sget(data, "data.Info.PaperName", "无标题");
        totalscore = sget(data, "data.Info.TotalScore", 0);
        practice_submission_id = sget(data, "data.Info.PracticeSubmissionID", "");

        load_success = true;
        ifPreview = false;
        query_url = `/api/respondent?practice_submission_id=${encodeURIComponent(practice_submission_id || '')}`;


        //加载题目
        examQuestions.length = 0;
        examQuestions.push(...flattenExamQuestions());
        questionGroups.length = 0;
        questionGroups.push(...getQuestionGroups());

      })
      .catch(error => {
        console.error('请求失败:', error);
        load_success = false;
            if (!load_success) {
          MessageBox({
          title: '出错了，请回到练习列表刷新重新进入',
            onConfirm: () => {
                    window.location.href = "/student/practice";
             },
            });
        }
        return;
      });
    }
  });
</script>

<svelte:head>
  <link
    rel="stylesheet"
    href="https://cdnjs.cloudflare.com/ajax/libs/bulma/0.9.4/css/bulma.min.css"
  />
</svelte:head>


{#if load_success}
  //练习布局
  <div class="exam-container" class:full-mode={is_full_examMode}>
    <div class="exam-header">

      <Button type="info" plain size="middle" onclick={() => {
          ifPreview ? goBackForPreview() : goBackToPracticeList();
        }}>
            <span class="icon">←</span>
            <span>返回</span>
        </Button>

      <div class="exam-title">{title}</div>
      <div class="exam-header-right">
        <Button type="primary" round size="large"
            onclick={submitMessageBox}>
            <span>    提交    </span>
        </Button>
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
            建议时长:{practice_record?.duration
              ? `${practice_record.duration}分钟`
              : "--"}
          </div>
          <div class="timer-container">
            <img src="/student_answer_practice/timer.svg" alt="" />
            <CountdownTimer
              ifPreview={ifPreview}
              elapsed_seconds={elapsed_seconds}
              practice_submission_id={practice_submission_id}
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
                    <h2>{question.group_name} <span class="group-score">（{question.group_score}分）</span></h2>
                  </div>
                {/if}
                <div class="question-mark-container" id={`question-${index}`}>
                  <Question
                    bind:question={examQuestions[index]}
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
                 <h2>{currentQuestion.group_name} <span class="group-score">（{currentQuestion.group_score}分）</span></h2>
              </div>
              <!-- 逐题模式：只显示当前题目 -->

              <div class="question-mark-container">
                <Question
                  bind:question={currentQuestion}
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
                        class:active={
                            examQuestions[question.index]?.Answer !== null &&
                            examQuestions[question.index]?.Answer !== undefined &&
                            Array.isArray(examQuestions[question.index].Answer) &&
                            !examQuestions[question.index].Answer.every((str) => str === "") &&
                            examQuestions[question.index].Answer.length !== 0
                          }
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

{/if}


<style lang="scss" scoped>

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
    min-width: 85px; /* 设置最小宽度 */
  }

  .submit-btn {
    background-color: #0066ff;
    color: white;
    border: none;
    width: 100px;
    padding: 8px 16px;
    border-radius: 4px;
    margin-left: 15px;
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
  .button {
    background-color: transparent;
    border: none;
    color: #0066ff;
    font-size: 14px;
    font-weight: bold;
    padding: 0;
    height: auto;
    outline: none;
    box-shadow: none;
    -webkit-tap-highlight-color: transparent; /* 移动端点击高亮去除 */
  }

  .button:focus,
  .button:active {
    outline: none;
    box-shadow: none;
    background-color: transparent;
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
