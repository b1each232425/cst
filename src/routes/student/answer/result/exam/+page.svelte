<script>
  /*
   * @Author: 彭海峰 1614818457@qq.com
   * @Date: 2025-08-8 10:56:09
   * @LastEditors: 彭海峰 1614818457@qq.com
   * @LastEditTime: 2025-08-08 09:41:12
   * @FilePath: \src\routes\student\answer\result\exam\+page@.svelte
   * @Description:
   */
  import { page } from '$app/state';
  import { onMount } from 'svelte';
  import { sget } from '$lib/utils/index.js';
  import Toast from '$lib/components/Toast/Toast.svelte';
  import { toast } from '$lib/components/Toast/Toast';
  import BulmaSwitch from '../../_component/SwitchBtn/BulmaSwitchBlue.svelte';
  import Watermark from '../../_component/WaterMark.svelte';
  import Quesion from '../../_component/QuestionCheck/quesion.svelte';
  import Score from '../../_component/QuestionCheck/score.svelte';
  import ScoreBadge from '../../_component/QuestionCheck/ScoreBadge.svelte';
  import MessageBox from '$lib/components/MessageBox/MessageBox.js';
  import Switch from '$lib/components/Switch/Switch.svelte';

  /**
   * @property {string} icon_src -操作提示图标地址
   *
  // 这里不能将answers用一个类型去包含，只能动态获取
   *
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
   *

   *
   * @typedef {Object} GroupQuestion
   * @property {number} index - 题目在卷子中的总索引
   * @property {Question} question - 本组的题目
   *

   *
   * @typedef {Object} QuestionGroup
   * @property {number} id - 分组唯一ID
   * @property {string} name - 分组名称
   * @property {string} type - 题目类型
   * @property {GroupQuestion[]} questions - 本组的题目列表
   *

   *
   * @typedef {Object} Answer - 原试卷题目详情
   * @property {number} index - 类型
   * @property {number} [index]
   * @property {Object[]} answer - 原题答案
   *

   *
   * @typedef {Object} StudentAnswer - 学生作答题目记录
   * @property {string} type - 类型
   * @property {number} [index]
   * @property {String[]} answer - 学生回答
   *

   *
   * @typedef {Object} ExamInfo
   * @property {number} answerNum - 学生作答数量
   * @property {string} paperName - 试卷名称
   * @property {number} questionNum - 题目总数
   * @property {number} studentScore - 学生总分
   * @property {number} answerTime - 学生作答时间（以分钟为单位）
   *

   *
   * @typedef {Object} ExamSessionInfo
   * @property {number} ExamTime - 场次正常持续时长
   * @property {number} ExamineeID - 考生ID
   * @property {number} ID - 考试ID
   * @property {number} PaperID - 场次试卷ID
   * @property {number} SessionNum - 考试场次顺序索引
   *

   *
   * @typedef {Object} Rank
   * @property {string} official_name - 考生昵称
   * @property {number} total_score  - 考生成绩
   * @property {number} rank - 排名
   * @property {number} student_id - 学生用户ID
   *
   *
   *
   *
   *
   *
   * 显示操作提示
   * @param {string} type - 提示类型
   * @param {string} message - 提示文本
   *
   *
   *
   * @type {Question[]}
   *
   *
   *
   * @type {QuestionGroup[]}
   *
   *
   *
   * @type {Rank[]}
   *
   *
   *
   *
   * @type {Rank}
   *
   *
   *
   * @type {ExamInfo}
   *
   *
   *
   * @type {ExamSessionInfo[]}
   *
   *
   *
   * @type {ExamSessionInfo[]}
   *
   *
   *
   * @param {number} index - 操作的索引 可选 -1 、 1
   *
   *
   *
   * 跳转到指定题目
   * @param {number}index
   */

  let is_full_examMode = $state(true); // 是否为全卷模式
  let student_name = '邹德伦'; //学生名字
  let student_id = $state(''); // 学生的学号
  let avatar_url = '/user_icons/defaultAvatar.svg'; // 头像url
  let userID = $state(''); // 考生当前的用户ID
  let exam_paper = $state([]); // 考试试卷 + 学生作答 题目数组 包括很多信息；需要从里面拿
  let currentQuestion = $derived(exam_paper[0]); // 当前显示的问题
  let currentQuestionIndex = $state(0); // 当前显示的问题索引
  let questionGroups = $state([]); // 题组 里面需要包含题目，题组需要根据这个groupID
  let total_score = $state(0); // 试卷原总分
  let rank = $state([]); // 考试场次排行榜
  let userRank = $state({}); // 当前学生的得分与信息  // @ts-ignore
  let examInfo = $state({}); // 考试基本信息
  let examSessionInfo = $state({}); // 考试场次信息，用于切换上次试卷
  let nowSessionIndex = $state(0); // 当前考试场次索引
  let examSessionInfoLenght = $state(0);
  let showLeftInfo = $state(true); //是否显示左边信息栏
  let exam_session_id_arr = $state([]); // 考试场次ID
  let load_success = $state(false); // 数据加载是否成功
  let exam_questions_map = $state(new Map()); //考试题目map数组 key题目id value包含题目的题组
  let question_groups_map = $state(new Map()); //考试题组map数组 key题目id value包含题组的信息
  let showBadge = $state(false);
  let badgeX = $state(74); // 固定像素位置
  let badgeY = $state(12); // 固定像素位置
  let exam_paper_info = $state({});

  let show_wrong_questions = $state(false); // 是否只展示错题
  let filtered_questions = $state([]); // 错题集
  let clone_exam_paper = $state([]); // 备份试卷

  //题目信息类
  function getQuestionGroups() { // 获取题目分组信息，用于生成答题卡
    const groups = [];

    const sortedGroups = Array.from(question_groups_map.values()).sort((a, b) => a.order - b.order); //升序排序出一个数组

    // 构建全局索引映射
    const globalIndexMap = new Map();
    exam_paper.forEach((q, idx) => {
      globalIndexMap.set(q.ID, idx);
    });

    sortedGroups.forEach((groupInfo) => {
      const groupId = groupInfo.ID; // 题组 id
      const groupQuestions = exam_questions_map.get(String(groupId)) || []; // 该分组下的题目数组

      if (groupQuestions.length === 0) return; // 如果没有题目则跳过
      groups.push({
        // 组装 QuestionGroup 对象
        name: groupInfo.Name,
        type: groupQuestions[0].type,
        questions: groupQuestions.map((question, index) => ({
          question,
          index: globalIndexMap.get(question.ID), // 这里用全局索引
        })),
      });
    });
    return groups;
  }
  function flattenExamQuestions() { //将题组扁平化拆开成一个题目数组 用来生成题目
    
    const result = [];
    const sortedGroups = Array.from(question_groups_map.values()).sort((a, b) => a.order - b.order); //升序排序数组

    sortedGroups.forEach((groupInfo) => {
      const groupId = groupInfo.ID;
      const groupQuestions = exam_questions_map.get(String(groupId)) || [];

      let totalScore = 0;
      for (const item of groupQuestions) {
        // 如果每道题的分数字段是 question.Score
        totalScore += Number(item.Score || 0);
      }
      groupQuestions.forEach((q) => {
        result.push({
          ...q,
          group_name: groupInfo.Name,
          group_score: totalScore, // 该组的总分
        });
      });
    });
    return result;
  }
  function resetQuestionGroup() {  // 重置题目题组
    exam_paper.length = 0;
    exam_paper.push(...flattenExamQuestions());
    questionGroups.length = 0;
    questionGroups.push(...getQuestionGroups());
  }
  function computePaperTotalScoce() { // 计算本张卷子的总分
    exam_paper.forEach((question) => {
      total_score += question.Score;
    });
  }
  function getStudentRankInfo() { // 获取当前学生的排名信息
    rank.forEach((rank) => {
      if (rank.student_id === userID) {
        userRank = rank;
      }
    });
  }

  //按钮控制类
  function ShowOtherSessionDetails(index) { // 切换考试场次
    if (nowSessionIndex + index < 0 || nowSessionIndex + index > examSessionInfoLenght) {
      console.error('操作失败，数组索引失效');
      toast.error('操作失败，数组索引失效', 2000);
      return;
    }

    let queryIndex = nowSessionIndex + index;
    fetch(`/api/grades?category=exam&examSessionID=${exam_session_id_arr[queryIndex]}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
    })
      .then((response) => {
        if (!response.ok) {
          return response.text().then((text) => {
            console.error('接口响应失败:', text);
            toast.error(`接口响应失败: ${text}`, 2000);
            throw new Error(text);
          });
        }
        return response.json();
      })
      .then((data) => {
        if (data.status !== 0) {
          console.error(`接口错误: ${data.msg}`);
          toast.error(`接口错误: ${data.msg}`, 2000);
          throw new Error(data.msg);
        }

        //学生信息类
        if (!data?.data?.student_id) throw new Error('student_id 不能为空'); // 学生ID
        userID = data.data.student_id;
        if (!data.data.rank || !Array.isArray(data.data.rank) || data.data.rank.length === 0)
          throw new Error('rank 不能为空');
        rank = data.data.rank; // 排名信息
        if (!data.data.examInfo) throw new Error('exam_info 不能为空'); // 考试信息
        examInfo = data.data.examInfo;
        if (!data.data.examSessionInfo) throw new Error('exam_session_info 不能为空'); // 该场次的具体信息
         examSessionInfo = data.data.examSessionInfo[queryIndex];
        //题目信息类
        if (!data.data.exam_question || Object.keys(data.data.exam_question).length === 0)
          throw new Error('exam_question 不能为空');
        exam_questions_map = new Map(Object.entries(data.data.exam_question));
        if (!data.data.exam_paper_group || Object.keys(data.data.exam_paper_group).length === 0)
          throw new Error('exam_paper_group 不能为空');
        question_groups_map = new Map(Object.entries(data.data.exam_paper_group));

        if (!data.data.exam_paper)  throw new Error('exam_paper_info 不能为空');
          exam_paper_info = data.data.exam_paper; // 试卷信息

        //加载题目
        total_score = 0; // 重置总分
        resetQuestionGroup();
        computePaperTotalScoce();
        getStudentRankInfo();
        nowSessionIndex = queryIndex;
        showScore();
        load_success = true;
      })
      .catch((error) => {
        console.error('请求失败:', error);
        toast.error(`获取题目时出错！${error.message || ''}`, 2000);
        load_success = false;

        if (!load_success) {
          MessageBox({
            title: '出错了，请回到考试列表刷新重新进入',
            show_cancel_button: false,
            onConfirm: () => {
              window.location.href = '/student/exam';
            },
          });
        }

        return;
      });
  }
  function nextQuestion() { // 切换到下一题
    if (!is_full_examMode && show_wrong_questions) {
      // 在逐题+只看错题时，跳到下一个错题（包含半对）
      for (let i = currentQuestionIndex + 1; i < exam_paper.length; i++) {
        const q = exam_paper[i];
        if (isWrong(q)) {
          currentQuestionIndex = i;
          currentQuestion = exam_paper[i];
          return;
        }
      }
      // 无下一个错题则保持不变
    } else {
      if (currentQuestionIndex < exam_paper.length - 1) {
        currentQuestionIndex++;
        currentQuestion = exam_paper[currentQuestionIndex];
      }
    }
  }
  function prevQuestion() { // 切换到上一题
    if (!is_full_examMode && show_wrong_questions) {
      // 在逐题+只看错题时，跳到上一个错题（包含半对）
      for (let i = currentQuestionIndex - 1; i >= 0; i--) {
        const q = exam_paper[i];
        if (isWrong(q)) {
          currentQuestionIndex = i;
          currentQuestion = exam_paper[i];
          return;
        }
      }
      // 无上一个错题则保持不变
    } else {
      if (currentQuestionIndex > 0) {
        currentQuestionIndex--;
        currentQuestion = exam_paper[currentQuestionIndex];
      }
    }
  }
  function goToQuestion(index) { // 跳转到指定题目
    // 如果当前是只看错题模式，但点击的是一个“非错题”，则先关闭错题模式
    if (show_wrong_questions && !isWrong(exam_paper[index])) {
      show_wrong_questions = false;
      // 清空过滤结果（可选）
      filtered_questions.length = 0;
    }

    currentQuestionIndex = index;
    currentQuestion = exam_paper[currentQuestionIndex];

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
              behavior: 'smooth',
              block: 'start',
            });
          } else {
            questionElement.scrollIntoView({
              behavior: 'smooth',
              block: 'center',
            });
          }
        }
      }, 0);
    }
  }
  function locationBack() { // 提交考试后返回到考试列表
    if (student_id) {
      // 当有 student_id 时返回上一级
      window.history.back();
    } else {
      // 否则回到考试列表
      window.location.href = '/student/exam';
    }
  }
  function showScore() { // 显示分数徽章
    showBadge = true;
  }
  function onBadgeHide() { // 隐藏分数徽章
    
    showBadge = false;
  }
  function goBack() { // 返回到考试列表
    if (student_id) {
      // 当有 student_id 时返回上一级
      window.history.back();
    } else {
      // 否则回到考试列表
      window.location.href = '/student/exam';
    }
  }
  function isWrong(q) {
    return !(Number(q.Score) === Number(q.StudentScore));
  }
  function filterWrongQuestions() { // 过滤错题
    show_wrong_questions = !show_wrong_questions;

    // 生成错题列表并包含全局索引（包含半对）
    filtered_questions.length = 0;
    exam_paper.forEach((q, idx) => {
      if (isWrong(q)) {
        filtered_questions.push({ ...q, _globalIndex: idx });
      }
    });

    if (show_wrong_questions) {
      // 逐题模式下跳到第一道错题（如果存在）
      if (!is_full_examMode) {
        if (filtered_questions.length > 0) {
          currentQuestionIndex = filtered_questions[0]._globalIndex;
          currentQuestion = exam_paper[currentQuestionIndex];
        } else {
          toast.info('没有错题', 2000);
        }
      }
      // 全卷模式不需要修改 exam_paper，模板会隐藏正确题（模板判断请改为 isWrong(question)）
    } else {
      // 取消只看错题后保持当前索引对应的题目显示
      currentQuestion = exam_paper[currentQuestionIndex];
    }
  }

  // 是否是全卷模式
  function isFullQuestions() {
    is_full_examMode = !is_full_examMode;
  }

  onMount(async () => {
    exam_session_id_arr = page.url.searchParams.get('exam-session-id-arr');
    student_id = page.url.searchParams.get('student-id');

    if (exam_session_id_arr) {
      // 移除方括号并拆分
      exam_session_id_arr = exam_session_id_arr.replace('[', '').replace(']', '').split(',').map(Number);
    } else {
      console.error('未提供考试场次ID');
      toast.error('未提供考试场次ID', 2000);
      return;
    }

    let geturl;

    if(!student_id) {
      geturl = `/api/grades?category=exam&examSessionID=${exam_session_id_arr[0]}`;
    }
    else {
      geturl = `/api/grades?category=exam&examSessionID=${exam_session_id_arr[0]}&studentID=${student_id}`;
    }

    fetch(geturl, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
    })
      .then((response) => {
        if (!response.ok) {
          return response.text().then((text) => {
            console.error('接口响应失败:', text);
            toast.error(`接口响应失败: ${text}`, 2000);
            throw new Error(text);
          });
        }
        return response.json();
      })
      .then((data) => {
        if (data.status !== 0) {
          console.error(`接口错误: ${data.msg}`);
          toast.error(`接口错误: ${data.msg}`, 2000);
          throw new Error(data.msg);
        }

        //学生信息类
        if (!data?.data?.student_id) throw new Error('student_id 不能为空'); // 学生ID
        userID = data.data.student_id;

        if (!data.data.rank || !Array.isArray(data.data.rank) || data.data.rank.length === 0)    throw new Error('rank 不能为空');
        rank = data.data.rank; // 排名信息

        if (!data.data.examInfo) throw new Error('exam_info 不能为空'); // 考试信息
        examInfo = data.data.examInfo;

        if (!data.data.examSessionInfo) throw new Error('exam_session_info 不能为空'); // 该场次的具体信息
         examSessionInfo = data.data.examSessionInfo[0];

        //题目信息类
        if (!data.data.exam_question || Object.keys(data.data.exam_question).length === 0)  throw new Error('exam_question 不能为空');
        exam_questions_map = new Map(Object.entries(data.data.exam_question));

        if (!data.data.exam_paper_group || Object.keys(data.data.exam_paper_group).length === 0)   throw new Error('exam_paper_group 不能为空');
        question_groups_map = new Map(Object.entries(data.data.exam_paper_group));

        if (!data.data.exam_paper)  throw new Error('exam_paper_info 不能为空');
          exam_paper_info = data.data.exam_paper; // 试卷信息

        //加载题目
        examSessionInfoLenght = exam_session_id_arr.length;
        total_score = 0; // 重置总分
        resetQuestionGroup(); // 重置题目组
        computePaperTotalScoce(); // 计算试卷总分
        getStudentRankInfo(); // 获取学生排名信息
        showScore(); // 显示分数徽章
        currentQuestion = exam_paper[currentQuestionIndex]; // 初始化当前题目
        load_success = true;
      })
      .catch((error) => {
        console.error('请求失败:', error);
        toast.error(`获取题目时出错！${error.message || ''}`, 2000);
        load_success = false;

        if (!load_success) {
          MessageBox({
            title: '出错了，请回到考试列表刷新重新进入',
            show_cancel_button: false,
            onConfirm: () => {
              if (student_id) {
                // 当有 student_id 时返回上一级
                window.history.back();
              } else {
                // 否则回到考试列表
                window.location.href = '/student/exam';
              }
            },
          });
        }

        return;
      });

  });
</script>

<svelte:head>
  <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/bulma/0.9.4/css/bulma.min.css" />
</svelte:head>

<ScoreBadge
  score={examInfo.StudentScore}
  x={badgeX}
  y={badgeY}
  rotation={10}
  visible={showBadge}
  duration={0}
  onHide={onBadgeHide}
/>

{#if load_success}
  <!-- 整体框架 -->
  <div class="exam-container">
    <!-- 考试信息栏 -->
    <div class="exam-header">
      <!-- 考试顶栏的左操作键 -->
      <div class="exam-header-left">
         <button
            class="return-button-span"
            onclick={goBack}>返回</button
           >
      </div>
     
      <div class="exam-title">{exam_paper_info.Name}</div>
      {#if examSessionInfoLenght >= 2}
        <div class="exam-header-right">
          <button
            class="submit-btn"
            disabled={nowSessionIndex === 0}
            onclick={() => ShowOtherSessionDetails(-1)}
          >
             上一张
          </button>
          <button
            class="submit-btn"
            disabled={nowSessionIndex === examSessionInfoLenght - 1}
            onclick={() => ShowOtherSessionDetails(1)}
          >
            下一张 
          </button>

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
            <img class="icon" src="/student_exam_practice/paper.png" alt="试卷张数" />
            <label for="试卷">试卷：</label>
            <label for="具体数值" class="blodFont">{nowSessionIndex + 1}</label>
            <label for="具体数值">/{examSessionInfoLenght}</label>
          </div>
          <div class="exam-into-deatil">
            <img class="icon" src="/student_exam_practice/score.png" alt="得分" />
            <label for="得分">得分：</label>
            <label for="具体数值"
              ><span
                style:color={examInfo.StudentScore >= total_score * 0.6
                  ? '#4CAF50' // 高分显示绿色
                  : '#F44336'}
                style:font-weight={'bolder'}
                style:margin-right={'5px'}>{examInfo.StudentScore}分</span
              ></label
            >
            <label for="具体数值"> /{total_score}分</label>
          </div>
          <div class="exam-into-deatil">
            <img class="icon" src="/student_exam_practice/time.png" alt="答题用时" />
            <label for="答题用时">答题用时：</label>
            <label for="具体数值" class="blodFont">{examInfo.AnswerTime}分钟</label>
            <label for="具体数值"> /{examSessionInfo.ExamTime}分钟</label>
          </div>
          <div class="exam-into-deatil">
            <img class="icon" src="/student_exam_practice/answerNum.png" alt="答题数量" />
            <label for="答题数量">答题数量：</label>
            <label for="具体数值" class="blodFont">{examInfo.AnswerNum}题</label>
            <label for="具体数值"> /{exam_paper_info.QuestionCount}题</label>
          </div>
        </div>
        <!-- 考试作答形式选择区域 -->
        <div class="box preference-info">
          <label for="试卷作答偏好">查看解析偏好</label>
          <!-- <div class="answer-mode">逐题模式</div>
          <BulmaSwitch bind:is_full_examMode></BulmaSwitch>
          <div class="answer-mode">全卷模式</div> -->
          <Switch
            is_checked={is_full_examMode}
            left_text={'逐题模式'}
            right_text={'全卷模式'}
            clickSwitchButton={isFullQuestions}
          ></Switch>
        </div>
        <!-- 错题展示选择 -->
        <div class="box preference-info">
          <label for="错题展示偏好">错题展示偏好</label>
          <Switch
            is_checked={show_wrong_questions}
            left_text={'展示全部'}
            right_text={'展示错题'}
            clickSwitchButton={filterWrongQuestions}
          ></Switch>
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
              src={showLeftInfo ? '/student_answer_exam/left-arrows.svg' : '/student_answer_exam/right-arrows.svg'}
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
                {#if !show_wrong_questions || (show_wrong_questions && isWrong(question))}
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
                {/if}
              {/each}
            {:else}
              <div class="question-header">
                <h2>{currentQuestion.group_name}</h2>
              </div>
              <!-- 逐题模式：只显示当前题目 -->
              <div class="question-mark-container">
                <Quesion question={currentQuestion} index={currentQuestionIndex} />
                <Score question={currentQuestion} />
              </div>
              <div class="question-footer">
                <button class="nav-btn" onclick={prevQuestion} disabled={currentQuestionIndex === 0}>上一题</button>
                <button class="nav-btn" onclick={nextQuestion} disabled={currentQuestionIndex === exam_paper.length - 1}>下一题</button>
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
                        class:question-btn-right={question.question.StudentScore === question.question.Score}
                        class:question-btn-half-right={question.question.StudentScore < question.question.Score && question.question.StudentScore > 0}
                        class:question-btn-wrong={question.question.StudentScore === 0 && question.question.Score > 0}
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
  :global(*) {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
  }
  :global(html),
  :global(body) {
    overflow: auto;
  }
  .submit-btn:disabled {
    color: #999;          /* 文字变灰 */
    cursor: not-allowed;  /* 鼠标提示不可点击 */
    background-color: inherit; /* 背景保持原样 */
    opacity: 1;           /* 防止部分浏览器自动降低透明度 */
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
    font-family:
      -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue',
      sans-serif;
  }
  .return-button-span {
    all: unset;
    width: 70px;
    height: 35px;
    text-align: center;
    background-color: white;
    border: 1px solid #ddd;
    color: black;
    cursor: pointer;
    display: inline-block;
    line-height: 35px;
    border-radius: 5px;
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
  .submit-btn.disabled {
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
    margin-right: 18px;
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
    .rank-list {
      flex: 1;
      max-height: 300px;
    }
  }
  @media (max-width: 1450px) {
    .rank-list {
      flex: 1;
      max-height: 220px;
    }
  }
  @media (max-width: 1320px) {
    .left-info {
      overflow-y: auto;
    }
  }
</style>
