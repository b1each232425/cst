<!--
 * @Author: 林炜佳 wj2144632819@qq.com
 * @Date: 2025-08-06 15:00:00
 * @LastEditors: 林炜佳 wj2144632819@qq.com
 * @LastEditTime: 2025-08-07 00:18:07
 * @FilePath: \exam\src\routes\teacher\correct\correct\+page@.svelte
 * @Description: 教师端试卷批改页面
 * @Copyright (c) 2025 by 广州近邻信息有限公司, All Rights Reserved. 
-->

<script>
  import Switch from '$lib/components/Switch/Switch.svelte';
  import { onMount, onDestroy } from 'svelte';
  import MessageBox from '$lib/components/MessageBox/MessageBox.js';
  import { page } from '$app/state';
  import QuestionGradingSection from './_components/QuestionGradingSection/index.svelte';
  import { toast } from '$lib/components/Toast/Toast';
  import '$lib/components/Button/index.scss';

  // const mockData = {
  //   question_sets: [
  //     {
  //       ID: 101,
  //       Order: 1,
  //       Score: 30,
  //       Name: '基础题组',
  //       Questions: [
  //         {
  //           ID: 1001,
  //           Order: 1,
  //           Score: 5,
  //           Type: '00', // 单选题
  //           Answers: [{ index: 1, score: 5, answer: 'B', grading_rule: 'exact', alternative_answer: 'b' }],
  //           GroupID: 101,
  //           Content: '下面哪个是 JavaScript 的关键字？',
  //         },
  //         {
  //           ID: 1002,
  //           Order: 2,
  //           Score: 10,
  //           Type: '02', // 多选题
  //           Answers: [
  //             { index: 1, score: 5, answer: 'A', grading_rule: 'exact', alternative_answer: 'a' },
  //             { index: 2, score: 5, answer: 'C', grading_rule: 'exact', alternative_answer: 'c' },
  //           ],
  //           GroupID: 101,
  //           Content: '以下哪些是 JavaScript 数据类型？',
  //         },
  //         {
  //           ID: 1003,
  //           Order: 3,
  //           Score: 5,
  //           Type: '04', // 判断题
  //           Answers: [{ index: 1, score: 5, answer: 'true', grading_rule: 'exact', alternative_answer: null }],
  //           GroupID: 101,
  //           Content: 'JavaScript 是一门静态类型语言。对吗？',
  //         },
  //       ],
  //     },
  //     {
  //       ID: 102,
  //       Order: 2,
  //       Score: 40,
  //       Name: '进阶题组',
  //       Questions: [
  //         {
  //           ID: 2001,
  //           Order: 1,
  //           Score: 10,
  //           Type: '06', // 填空题
  //           Answers: [
  //             { index: 1, score: 5, answer: 'function', grading_rule: 'exact', alternative_answer: null },
  //             { index: 2, score: 5, answer: 'const', grading_rule: 'exact', alternative_answer: null },
  //           ],
  //           GroupID: 102,
  //           Content: '请填空：______ 用于定义函数，______ 用于定义常量。',
  //         },
  //         {
  //           ID: 2002,
  //           Order: 2,
  //           Score: 10,
  //           Type: '08', // 简答题
  //           Answers: [
  //             {
  //               index: 1,
  //               score: 10,
  //               answer: '事件循环是JavaScript处理异步操作的机制。',
  //               grading_rule: 'keywords',
  //               alternative_answer: '事件循环机制',
  //             },
  //           ],
  //           GroupID: 102,
  //           Content: '简述 JavaScript 的事件循环机制。',
  //         },
  //         {
  //           ID: 2003,
  //           Order: 3,
  //           Score: 20,
  //           Type: '10', // 编程题
  //           Answers: [
  //             {
  //               index: 1,
  //               score: 20,
  //               answer: 'function add(a, b) { return a + b; }',
  //               grading_rule: 'exact',
  //               alternative_answer: null,
  //             },
  //           ],
  //           GroupID: 102,
  //           Content: '编写一个函数，实现两个数相加。',
  //         },
  //       ],
  //     },
  //   ],
  //   student_answers: [
  //     // 学生 1
  //     { QuestionID: 1001, ExamineeID: 5001, PracticeSubmissionID: 7001, Answer: { answer: ['B'] } },
  //     { QuestionID: 1002, ExamineeID: 5001, PracticeSubmissionID: 7001, Answer: { answer: ['A', 'C'] } },
  //     { QuestionID: 1003, ExamineeID: 5001, PracticeSubmissionID: 7001, Answer: { answer: ['false'] } },
  //     { QuestionID: 2001, ExamineeID: 5001, PracticeSubmissionID: 7001, Answer: { answer: ['function', 'const'] } },
  //     {
  //       QuestionID: 2002,
  //       ExamineeID: 5001,
  //       PracticeSubmissionID: 7001,
  //       Answer: { answer: ['事件循环是JavaScript处理异步操作的机制。'] },
  //     },
  //     {
  //       QuestionID: 2003,
  //       ExamineeID: 5001,
  //       PracticeSubmissionID: 7001,
  //       Answer: { answer: ['function add(a, b) { return a + b; }'] },
  //     },
  //     // 学生 2
  //     { QuestionID: 1001, ExamineeID: 5002, PracticeSubmissionID: 7002, Answer: { answer: ['A'] } },
  //     { QuestionID: 1002, ExamineeID: 5002, PracticeSubmissionID: 7002, Answer: { answer: ['A'] } },
  //     { QuestionID: 1003, ExamineeID: 5002, PracticeSubmissionID: 7002, Answer: { answer: ['true'] } },
  //     { QuestionID: 2001, ExamineeID: 5002, PracticeSubmissionID: 7002, Answer: { answer: ['function', 'let'] } },
  //     {
  //       QuestionID: 2002,
  //       ExamineeID: 5002,
  //       PracticeSubmissionID: 7002,
  //       Answer: { answer: ['事件循环是JS的异步处理机制。'] },
  //     },
  //     {
  //       QuestionID: 2003,
  //       ExamineeID: 5002,
  //       PracticeSubmissionID: 7002,
  //       Answer: { answer: ['function sum(a, b) { return a + b; }'] },
  //     },
  //     // 学生 3
  //     { QuestionID: 1001, ExamineeID: 5003, PracticeSubmissionID: 7003, Answer: { answer: ['B'] } },
  //     { QuestionID: 1002, ExamineeID: 5003, PracticeSubmissionID: 7003, Answer: { answer: ['A', 'C'] } },
  //     { QuestionID: 1003, ExamineeID: 5003, PracticeSubmissionID: 7003, Answer: { answer: ['false'] } },
  //     { QuestionID: 2001, ExamineeID: 5003, PracticeSubmissionID: 7003, Answer: { answer: ['func', 'const'] } },
  //     { QuestionID: 2002, ExamineeID: 5003, PracticeSubmissionID: 7003, Answer: { answer: ['事件循环机制。'] } },
  //     {
  //       QuestionID: 2003,
  //       ExamineeID: 5003,
  //       PracticeSubmissionID: 7003,
  //       Answer: { answer: ['function add(x, y) { return x + y; }'] },
  //     },
  //   ],
  //   student_infos: [
  //     { ExamineeID: 5001, OfficialName: '李四', SerialNumber: 1, PracticeSubmissionID: 7001 },
  //     { ExamineeID: 5002, OfficialName: '王五', SerialNumber: 2, PracticeSubmissionID: 7002 },
  //     { ExamineeID: 5003, OfficialName: '赵六', SerialNumber: 3, PracticeSubmissionID: 7003 },
  //   ],
  //   marking_results: [
  //     // 学生 1 批改结果
  //     // {
  //     //   TeacherID: 9001,
  //     //   ExamineeID: 5001,
  //     //   ExamSessionID: 8001,
  //     //   PracticeID: 9001,
  //     //   PracticeSubmissionID: 7001,
  //     //   QuestionID: 1001,
  //     //   MarkDetails: [{ Index: 1, Score: 5  }],
  //     //   Score: 5,
  //     // },
  //     // {
  //     //   TeacherID: 9001,
  //     //   ExamineeID: 5001,
  //     //   ExamSessionID: 8001,
  //     //   PracticeID: 9001,
  //     //   PracticeSubmissionID: 7001,
  //     //   QuestionID: 1002,
  //     //   MarkDetails: [
  //     //     { Index: 1, Score: 5  },
  //     //     { Index: 2, Score: 5  },
  //     //   ],
  //     //   Score: 10,
  //     // },
  //     // {
  //     //   TeacherID: 9001,
  //     //   ExamineeID: 5001,
  //     //   ExamSessionID: 8001,
  //     //   PracticeID: 9001,
  //     //   PracticeSubmissionID: 7001,
  //     //   QuestionID: 1003,
  //     //   MarkDetails: [{ Index: 1, Score: 0  }],
  //     //   Score: 0,
  //     // },
  //     // {
  //     //   TeacherID: 9001,
  //     //   ExamineeID: 5001,
  //     //   ExamSessionID: 8001,
  //     //   PracticeID: 9001,
  //     //   PracticeSubmissionID: 7001,
  //     //   QuestionID: 2001,
  //     //   MarkDetails: [
  //     //     { Index: 1, Score: 5  },
  //     //     { Index: 2, Score: 5  },
  //     //   ],
  //     //   Score: 10,
  //     // },
  //     // {
  //     //   TeacherID: 9001,
  //     //   ExamineeID: 5001,
  //     //   ExamSessionID: 8001,
  //     //   PracticeID: 9001,
  //     //   PracticeSubmissionID: 7001,
  //     //   QuestionID: 2002,
  //     //   MarkDetails: [{ Index: 1, Score: 10  }],
  //     //   Score: 10,
  //     // },
  //     // {
  //     //   TeacherID: 9001,
  //     //   ExamineeID: 5001,
  //     //   ExamSessionID: 8001,
  //     //   PracticeID: 9001,
  //     //   PracticeSubmissionID: 7001,
  //     //   QuestionID: 2003,
  //     //   MarkDetails: [{ Index: 1, Score: 20  }],
  //     //   Score: 20,
  //     // },
  //     // 学生 2 批改结果
  //     {
  //       TeacherID: 9002,
  //       ExamineeID: 5002,
  //       ExamSessionID: 8001,
  //       PracticeID: 9001,
  //       PracticeSubmissionID: 7002,
  //       QuestionID: 1001,
  //       MarkDetails: [{ Index: 1, Score: 0, Analyze: '单选题答错了。' }],
  //       Score: 0,
  //     },
  //     {
  //       TeacherID: 9002,
  //       ExamineeID: 5002,
  //       ExamSessionID: 8001,
  //       PracticeID: 9001,
  //       PracticeSubmissionID: 7002,
  //       QuestionID: 1002,
  //       MarkDetails: [
  //         { Index: 1, Score: 5 },
  //         { Index: 2, Score: 5 },
  //       ],
  //       Score: 10,
  //     },
  //     {
  //       TeacherID: 9002,
  //       ExamineeID: 5002,
  //       ExamSessionID: 8001,
  //       PracticeID: 9001,
  //       PracticeSubmissionID: 7002,
  //       QuestionID: 1003,
  //       MarkDetails: [{ Index: 1, Score: 5 }],
  //       Score: 5,
  //     },
  //     {
  //       TeacherID: 9002,
  //       ExamineeID: 5002,
  //       ExamSessionID: 8001,
  //       PracticeID: 9001,
  //       PracticeSubmissionID: 7002,
  //       QuestionID: 2001,
  //       MarkDetails: [
  //         { Index: 1, Score: 5 },
  //         { Index: 2, Score: 0 },
  //       ],
  //       Score: 5,
  //     },
  //     {
  //       TeacherID: 9002,
  //       ExamineeID: 5002,
  //       ExamSessionID: 8001,
  //       PracticeID: 9001,
  //       PracticeSubmissionID: 7002,
  //       QuestionID: 2002,
  //       MarkDetails: [{ Index: 1, Score: 8 }],
  //       Score: 8,
  //     },
  //     {
  //       TeacherID: 9002,
  //       ExamineeID: 5002,
  //       ExamSessionID: 8001,
  //       PracticeID: 9001,
  //       PracticeSubmissionID: 7002,
  //       QuestionID: 2003,
  //       MarkDetails: [{ Index: 1, Score: 15 }],
  //       Score: 15,
  //     },
  //     // 学生 3 批改结果
  //     {
  //       TeacherID: 9003,
  //       ExamineeID: 5003,
  //       ExamSessionID: 8001,
  //       PracticeID: 9001,
  //       PracticeSubmissionID: 7003,
  //       QuestionID: 1001,
  //       MarkDetails: [{ Index: 1, Score: 5 }],
  //       Score: 5,
  //     },
  //     {
  //       TeacherID: 9003,
  //       ExamineeID: 5003,
  //       ExamSessionID: 8001,
  //       PracticeID: 9001,
  //       PracticeSubmissionID: 7003,
  //       QuestionID: 1002,
  //       MarkDetails: [
  //         { Index: 1, Score: 5 },
  //         { Index: 2, Score: 5 },
  //       ],
  //       Score: 10,
  //     },
  //     {
  //       TeacherID: 9003,
  //       ExamineeID: 5003,
  //       ExamSessionID: 8001,
  //       PracticeID: 9001,
  //       PracticeSubmissionID: 7003,
  //       QuestionID: 1003,
  //       MarkDetails: [{ Index: 1, Score: 0 }],
  //       Score: 0,
  //     },
  //     {
  //       TeacherID: 9003,
  //       ExamineeID: 5003,
  //       ExamSessionID: 8001,
  //       PracticeID: 9001,
  //       PracticeSubmissionID: 7003,
  //       QuestionID: 2001,
  //       MarkDetails: [
  //         { Index: 1, Score: 0 },
  //         { Index: 2, Score: 5 },
  //       ],
  //       Score: 5,
  //     },
  //     {
  //       TeacherID: 9003,
  //       ExamineeID: 5003,
  //       ExamSessionID: 8001,
  //       PracticeID: 9001,
  //       PracticeSubmissionID: 7003,
  //       QuestionID: 2002,
  //       MarkDetails: [{ Index: 1, Score: 7 }],
  //       Score: 7,
  //     },
  //     {
  //       TeacherID: 9003,
  //       ExamineeID: 5003,
  //       ExamSessionID: 8001,
  //       PracticeID: 9001,
  //       PracticeSubmissionID: 7003,
  //       QuestionID: 2003,
  //       MarkDetails: [{ Index: 1, Score: 20 }],
  //       Score: 20,
  //     },
  //   ],
  // };

  let exam_session_id = $state(0);
  let practice_id = $state(0);

  // 当前批改类型
  let is_exam_mode = $derived(exam_session_id > 0);

  let student_id_key = $derived(is_exam_mode ? 'ExamineeID' : 'PracticeSubmissionID');

  // 是否开启逐题模式
  let correct_item_by_item = $state(false);

  let current_question_set_index = $state(0); // 逐题模式下，当前题组
  let current_question_index = $state(0); // 逐题模式下，当前题目
  let current_student_info_index = $state(0); // 当前考生的下标

  let question_sets = $state([]); // 题组
  let student_answers = $state([]); // 学生信息
  let student_infos = $state([]); // 考生信息
  let marking_results = $state([]); // 历史批改结果

  // 总问题数
  let total_question = $derived(
    Array.isArray(question_sets)
      ? question_sets.reduce((acc, cur) => acc + (Array.isArray(cur?.Questions) ? cur.Questions.length : 0), 0)
      : 0,
  );

  let current_question_set = $derived(question_sets[current_question_set_index]);
  let current_question = $derived(current_question_set?.Questions[current_question_index] ?? []);
  let current_student_info = $derived(Array.isArray(student_infos) ? student_infos[current_student_info_index] : {});

  // 绑定批改区域，用于切换考生的时候滚动条滚动到最顶部（逐题模式切换题目不需要，因为切换题目会销毁整个题目组件）
  let correction_content = null;

  let current_paper_name = $state('');

  // 用于处理之前已批改，但是之后被清除了分数（这时是不会保存批改的，因为没有不会保存未批改的题目的分数），这时需要在总览显示“未批阅”的状态
  // let has_unmarked = $state(-1);

  // 练习，是否被批改过，防止过多的发送提交请求（练习时每次点击下一位就会提交）
  let is_marked = $state(false);

  // 练习，记录同学是否批改完成
  let is_finished_correcting = $derived(
    total_question === Array.isArray(marking_results)
      ? marking_results.filter((mr) => mr.PracticeSubmissionID === current_student_info.PracticeSubmissionID).length
      : 0,
  );

  function scrollToTop() {
    if (correction_content) correction_content.scrollTop = 0;
  }

  // 回到上个页面
  function goBack() {
    history.back();
  }

  function toggleExaminee(toggle_mode = '+') {
    scrollToTop();

    if (toggle_mode === '+') current_student_info_index++;
    else current_student_info_index--;
  }

  // 展示提交弹窗（考试需要）
  function showDialogToConfirmSubmit() {
    MessageBox({
      title: '确认操作',
      content: '你确定要提交吗？',
      onConfirm: () => submitCorrection(),
    });
  }

  // 提交批改
  function submitCorrection() {
    let query = '';
    if (is_exam_mode) query = `?exam_session_id=${exam_session_id}`;
    else query = `?practice_id=${practice_id}&practice_submission_id=${current_student_info.PracticeSubmissionID}`;

    fetch('/api/mark/results-submission' + query, {
      method: 'PATCH',
    })
      .then((res) => {
        if (!res.ok) {
          return res.text().then((error_text) => {
            throw new Error(`请求失败：${res.status} ${res.statusText}` + (error_text ? '-' + error_text : ''));
          });
        }
        return res.json();
      })
      .then((res) => {
        if (!res.status) {
          is_marked = false;
          if (is_exam_mode) {
            toast.success('提交成功'); // 考试需要提示，练习是直接提交
            goBack();
          } else {
            // 练习，全部练习批改完成，提示可以返回
            if (getUnmarkedExamineeCount() === 0) toast.success('当前所有的学生已批改且提交成功，可以返回列表');
          }
        } else throw new Error(res.msg ?? '提交失败');
      })
      .catch((err) => {
        toast.error(err.message);
        console.error(err);
      });
  }

  // 上一道问题
  function lastQuestion() {
    if (current_question_index - 1 < 0) {
      if (current_question_set_index - 1 < 0) return;
      current_question_set_index--;
      current_question_index = current_question_set.Questions.length - 1;
    } else current_question_index--;
  }

  // 下一道问题
  function nextQuestion() {
    if (current_question_index + 1 >= current_question_set.Questions.length) {
      if (current_question_set_index + 1 >= question_sets.length) return;
      current_question_set_index++;
      current_question_index = 0;
    } else current_question_index++;
  }

  // 获取学生所得的总分
  function getStudentTotalScore(student) {
    return Array.isArray(marking_results)
      ? marking_results
          .filter((result) => result[student_id_key] === student?.[student_id_key])
          .reduce((acc, cur) => acc + (cur.Score || 0), 0)
      : 0;
  }

  // 获取考生一道题组的分数
  function getStudentQuestionSetScore(student, question_set_id) {
    // 1. 查找题组
    const questionSet = question_sets.find((qs) => qs.ID === question_set_id);
    if (!questionSet) return;

    // 2. 收集题组中所有问题的ID
    const question_id_set = new Set(questionSet.Questions.map((q) => q.ID));

    // 3. 计算总分
    return Array.isArray(marking_results)
      ? marking_results
          .filter((mr) => mr[student_id_key] === student?.[student_id_key] && question_id_set.has(mr.QuestionID))
          .reduce((total, mr) => total + mr.Score, 0)
      : 0;
  }

  // 获取学生未批改题数
  function getStudentUnMarkedQuestionCount(student) {
    return (
      total_question -
      (Array.isArray(marking_results)
        ? marking_results.filter((mr) => mr[student_id_key] === student?.[student_id_key]).length
        : 0)
    );
  }

  // 获取学生该题的分数状态
  function getStudentQuestionScoreStatus(student, question_id) {
    const mark_result = Array.isArray(marking_results)
      ? marking_results.find((mr) => mr[student_id_key] === student?.[student_id_key] && mr.QuestionID === question_id)
      : null;

    if (mark_result) {
      const examinee_score = mark_result.Score;
      let score = 0;

      for (const qs of question_sets) {
        const found_question = qs.Questions.find((q) => q.ID === question_id);
        if (found_question) {
          score = found_question.Score;
          break; // 找到后立即退出循环
        }
      }

      if (examinee_score === score) return 'right';
      if (examinee_score === 0) return 'incorrect';
      if (examinee_score > 0 && examinee_score < score) return 'partial';
      return 'unknown';
    }
    return 'unreviewed';
  }

  // 获取未批改考生数目
  function getUnmarkedExamineeCount() {
    return Array.isArray(student_infos)
      ? student_infos.filter((s) => getStudentUnMarkedQuestionCount(s) !== 0).length
      : 0;
  }

  // 获取总未批改题数
  function getAllUnMarkedQuestionCount() {
    return Array.isArray(student_infos)
      ? student_infos.reduce((acc, cur) => acc + getStudentUnMarkedQuestionCount(cur), 0)
      : 0;
  }

  // 获取学生对于该问题的答案
  function getStudentAnswer(student, question_id) {
    return Array.isArray(student_answers)
      ? (student_answers.find((sa) => sa[student_id_key] === student?.[student_id_key] && sa.QuestionID === question_id)
          ?.Answer ?? { answer: [] })
      : { answer: [] };
  }

  // 获取学生这道题目的旧的批改结果
  function getMarkResultIndex(student, question_id) {
    return Array.isArray(marking_results)
      ? marking_results.findIndex(
          (mr) => mr[student_id_key] === student?.[student_id_key] && mr.QuestionID === question_id,
        )
      : -1;
  }

  // 切换阅卷模式
  function handleClickSwitchButton() {
    correct_item_by_item = !correct_item_by_item;
  }

  // 跳转到指定题目
  function scrollToQuestion(id, question_set_index, question_index) {
    if (correct_item_by_item) {
      current_question_set_index = question_set_index;
      current_question_index = question_index;
    } else {
      const el = document.getElementById(`question-${id}`);
      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }

  // 已经有分数了，但是又被清空，需要将其显示在右侧的状态变为“未批改”
  // function handleNoMark(question_id) {
  //     has_unmarked = question_id;
  // }

  // 检查参数，判断是考试还是练习，然后发起请求获取数据
  function checkQueriesAndGetData() {
    exam_session_id = Number(page.url.searchParams.get('exam_session_id'));
    practice_id = Number(page.url.searchParams.get('practice_id'));

    // 都是空 || 都不是空
    if ((!exam_session_id && !practice_id) || (exam_session_id && practice_id)) {
      showDialog('danger'); // 报错，终止对改页面的操作
      return;
    }

    const id_query = exam_session_id ? 'exam_session_id' : 'practice_id';
    const id = exam_session_id || practice_id;

    fetch(`/api/mark/details?${id_query}=${id}`)
      .then((res) => {
        if (!res.ok)
          return res.text().then((error_text) => {
            throw new Error(`请求失败：${res.status} ${res.statusText}` + (error_text ? '-' + error_text : ''));
          });
        return res.json();
      })
      .then((res) => {
        if (!res.status) {
          question_sets = res.data?.question_sets ?? []; // null / undefined 取 []
          if (!Array.isArray(question_sets)) throw new Error('question_sets 数据类型错误');
          if (!question_sets.length) {
            showDialog('primary', `当前${is_exam_mode ? '考试' : '练习'}没有主观题目`);
            return;
          }

          student_answers = res.data?.student_answers ?? [];
          if (!Array.isArray(student_answers)) throw new Error('student_answers 数据类型错误');
          if (!student_answers.length) throw new Error('获取学生答案失败');

          student_infos = res.data?.student_infos ?? [];
          if (!Array.isArray(student_infos)) throw new Error('student_infos 数据类型错误');
          if (!student_infos.length) throw new Error('获取学生信息失败');

          marking_results = res.data?.marking_results ?? [];
          if (!Array.isArray(marking_results)) throw new Error('marking_results 数据类型错误');

          // 获取的题目进行排序
          question_sets
            .sort((a, b) => a.Order - b.Order) // 原数组被排序
            .forEach((qs) => {
              // 直接修改原数组中的 Questions 数组
              qs.Questions.sort((a, b) => a.Order - b.Order);
            });

          current_paper_name = page.url.searchParams.get('name');
        } else throw new Error(res.msg ?? '获取批改信息失败');
      })
      .catch((err) => {
        showDialog('danger', err.message); // 获取数据失败也会终止对改页面的操作
        console.error(err);
      });
  }

  // 上传批改
  function onSaveMark(event) {
    // 更新考试场次的状态
    // 没有批改记录，就代表第一次批改
    // 将考试状态从“已结束”改为“批改中”
    if (is_exam_mode && marking_results.length === 0) {
      fetch(`/api/mark/state?exam_session_id=${exam_session_id}`, {
        method: 'PATCH',
      })
        .then((res) => {
          if (!res.ok)
            return res.text().then((error_text) => {
              throw new Error(`请求失败：${res.status} ${res.statusText}` + (error_text ? '-' + error_text : ''));
            });
          return res.json();
        })
        .then((res) => {
          if (res.status) throw new Error(res.msg ?? '更新考试场次的状态失败');
        })
        .catch((err) => {
          toast.error(err.message);
          console.error(err);
        });
    }

    // 记录有批改过
    is_marked = true;

    const temp_param = is_exam_mode
      ? { ExamineeID: current_student_info.ExamineeID, ExamSessionID: exam_session_id }
      : { PracticeSubmissionID: current_student_info.PracticeSubmissionID, PracticeID: practice_id };

    const data = {
      ...temp_param,
      QuestionID: event.question_id,
      MarkDetails: event.new_mark_result,
      Score: event.total_score,
    };

    // 保存一道题目的批改分数
    fetch(`/api/mark/marking-results`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        data: [data],
      }),
    })
      .then((res) => {
        if (!res.ok)
          return res.text().then((error_text) => {
            throw new Error(`请求失败：${res.status} ${res.statusText}` + (error_text ? '-' + error_text : ''));
          });
        return res.json();
      })
      .then((res) => {
        if (!res.status) {
          const index = getMarkResultIndex(current_student_info, event.question_id);

          // 进行本地分数的批改更新，响应式更新 QuestionGradingSection 组件的题目批改分数，确保页面一直激活状态下（不刷新），切换阅卷模式不会数据消失
          if (index !== -1)
            marking_results[index] = {
              ...marking_results[index],
              ...data,
            };
          else marking_results.push(data);

          // 练习，批改好一个同学就直接提交
          if (!is_exam_mode && is_finished_correcting) submitCorrection();
        } else throw new Error(res.msg ?? '批改操作失败');
      })
      .catch((err) => {
        toast.error(err.message);
        console.error(err);
      });
  }

  // 展示错误弹窗
  function showDialog(type, content = '页面信息出错，点击返回') {
    MessageBox({
      type,
      title: type === 'danger' ? '出错啦' : '注意',
      content: content,
      show_cancel_button: false,
      on_close_by_click_outside: false,
      confirm_button_type: type,
      onConfirm: () => goBack(),
      onCancel: () => goBack(),
    });
  }

  onMount(() => checkQueriesAndGetData());
</script>

<div class="correct">
  <!-- 顶部信息与按钮 -->
  <div class="header">
    <div class="left-header">
      <button class="btn is-text btn--large btn--primary is-plain" onclick={goBack}>返回</button>
      <div class="name">{current_paper_name}</div>
      <div class="info"><span>总人数：</span><span class="data"> {student_infos.length}</span></div>
      <div class="info"><span>未批改人数：</span><span class="data"> {getUnmarkedExamineeCount()}</span></div>
      <div class="info"><span>总未批改题数：</span><span class="data"> {getAllUnMarkedQuestionCount()}</span></div>
    </div>
    <div class="hobby" data-testid="switch">
      全卷模式
      <Switch
        is_checked={correct_item_by_item}
        ball_color="white"
        checked_background_color="#4a90e2"
        unchecked_background_color="#ccc"
        left_text=""
        right_text=""
        width="50px"
        clickSwitchButton={handleClickSwitchButton}
      />
      逐题模式
    </div>
  </div>

  <div class="correct-body">
    <!-- 左侧题目 -->
    <div class="card correction">
      <!-- 批改顶部信息、按钮 -->
      <div class="correction-header">
        <div class="infos">
          <div class="info">
            <span>当前考生：</span><span class="data"> {current_student_info?.OfficialName ?? ''}</span>
          </div>
          <div class="info">
            <span>未批改题数：</span><span class="data"> {getStudentUnMarkedQuestionCount(current_student_info)}</span>
          </div>
          <div class="info">
            <span>当前得分：</span><span class="data"> {getStudentTotalScore(current_student_info)}</span>
          </div>
        </div>
        <!-- 练习：上一位，下一位；考试：上一位，下一位/提交 -->
        <div class="options">
          <button
            class="btn btn--info is-plain"
            class:is-disabled={current_student_info_index === 0}
            onclick={() => toggleExaminee('-')}>上一位</button
          >
          {#if is_exam_mode && current_student_info_index === student_infos.length - 1}
            <button
              class="btn btn--primary"
              onclick={showDialogToConfirmSubmit}
              class:is-disabled={getUnmarkedExamineeCount() !== 0}>&nbsp;&nbsp;提交&nbsp;&nbsp;</button
            >
          {:else}
            <button
              class="btn btn--primary"
              class:is-disabled={current_student_info_index === student_infos.length - 1}
              onclick={() => toggleExaminee('+')}>下一位</button
            >
          {/if}
        </div>
      </div>

      <!-- 批改主内容 -->
      <div class="correction-content" bind:this={correction_content}>
        <!-- 全卷模式 -->
        {#if !correct_item_by_item}
          {#each question_sets as question_set (question_set.ID)}
            <div class="question-set">
              <div class="question-set-name">
                <span class="question-set-bracket">【</span>{question_set.Name}<span class="question-set-bracket"
                  >】</span
                >({question_set.Score}分)
              </div>
              {#each question_set.Questions as question}
                <QuestionGradingSection
                  {question}
                  student={current_student_info}
                  answer_object={getStudentAnswer(current_student_info, question.ID)}
                  old_mark_result={marking_results[getMarkResultIndex(current_student_info, question.ID)]
                    ?.MarkDetails ?? []}
                  {onSaveMark}
                />
              {/each}
            </div>
          {/each}
        {:else}
          <!-- 逐题模式 -->
          <div class="item-by-item">
            <div class="question-set">
              <div class="question-set-name">
                <span class="question-set-bracket">【</span>{current_question_set?.Name ?? ''}<span
                  class="question-set-bracket">】</span
                >({current_question_set?.Score ?? 0}分)
              </div>
              <QuestionGradingSection
                question={current_question}
                student={current_student_info}
                answer_object={getStudentAnswer(current_student_info, current_question.ID)}
                old_mark_result={marking_results[getMarkResultIndex(current_student_info, current_question.ID)]
                  ?.MarkDetails ?? []}
                {onSaveMark}
              />
            </div>
            <div class="options">
              <button
                class="btn btn--info is-plain"
                class:is-disabled={current_question_set_index === 0 && current_question_index === 0}
                onclick={lastQuestion}>上一题</button
              >
              <button
                class="btn btn--primary"
                class:is-disabled={current_question_set_index === question_sets.length - 1 &&
                  current_question_index === current_question_set.Questions.length - 1}
                onclick={nextQuestion}>下一题</button
              >
            </div>
          </div>
        {/if}
      </div>
    </div>

    <!-- 右侧总览 -->
    <div class="card overview">
      <div class="overview-header">作答总览</div>
      <div class="question-status">
        <span class="unreviewed">• 未批阅</span>
        <span class="right">• 正确</span>
        <span class="incorrect">• 错误</span>
        <span class="partial">• 含错</span>
      </div>
      {#each question_sets as question_set, i}
        <div class="question-scores">
          <div class="scores-header">
            {question_set.Name} (<span class="data"
              >{getStudentQuestionSetScore(current_student_info, question_set.ID)}</span
            >分/{question_set.Score}分)
          </div>
          <div class="scores">
            {#each question_set.Questions as question, j}
              <button
                class={`scores-item ${getStudentQuestionScoreStatus(current_student_info, question.ID)}`}
                class:active={correct_item_by_item && current_question_set_index === i && current_question_index === j}
                onclick={() => scrollToQuestion(question.ID, i, j)}
              >
                {question.Order}
              </button>
            {/each}
          </div>
        </div>
      {/each}
    </div>
  </div>
</div>

<style lang="scss">
  @mixin flex-center {
    display: flex;
    justify-content: center;
    align-items: center;
  }

  span {
    white-space: nowrap;
  }

  .info {
    @include flex-center;

    span {
      color: rgba(0, 0, 0, 0.7);

      &.data {
        color: black;
        font-size: 1.1rem;
        display: flex;
        align-items: center;
        justify-content: center;
      }
    }
  }

  .correct {
    background-color: #eff0f2;
    height: 100vh;

    .header {
      display: flex;
      justify-content: space-between;
      padding: 1rem 2rem;
      flex-wrap: wrap;
      background-color: white;

      .left-header {
        @include flex-center;
        gap: 1rem;

        .name {
          @include flex-center;
          font-weight: 400;
          font-size: 1.2rem;
        }
      }

      .hobby {
        @include flex-center;
      }
    }

    .correct-body {
      display: flex;
      gap: 0.5rem;
      justify-content: center;
      margin-top: 0.5rem;

      .card {
        border-radius: 5px;
      }

      .correction {
        background-color: white;
        width: 68%;

        .correction-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          flex-wrap: wrap;
          background-color: rgb(250, 250, 250);
          padding: 1rem;

          .infos,
          .options {
            display: flex;
            gap: 1rem;
          }
        }

        .correction-content {
          display: flex;
          flex-direction: column;
          height: 78vh;
          overflow-y: auto;
          scrollbar-width: thin;
          scrollbar-color: #ccc transparent;
          padding: 1rem;
          gap: 1rem;

          .question-set {
            .question-set-name {
              display: flex;
              align-items: center;

              .question-set-bracket {
                font-weight: 700;
              }
            }
          }

          .item-by-item {
            .options {
              @include flex-center;
              gap: 2rem;
            }
          }
        }
      }

      .overview {
        background-color: white;
        width: 20%;

        $color-unreviewed: #c2c2c2; // lighten(#919191, 20%)
        $color-right: #66ff99; // lighten(#00e343, 20%)
        $color-incorrect: #ff4d4d; // lighten(#ff0000, 20%)
        $color-partial: #ffc266; // lighten(#ff9500, 20%)

        .overview-header {
          padding: 1rem;
          border-bottom: 3px solid rgb(250, 250, 250);
        }

        .question-status {
          display: flex;
          justify-content: center;
          gap: 1rem;
          flex-wrap: wrap;
          background-color: rgb(250, 250, 250);
          padding: 0.5rem;

          .unreviewed {
            color: $color-unreviewed;
          }

          .right {
            color: $color-right;
          }

          .incorrect {
            color: $color-incorrect;
          }

          .partial {
            color: $color-partial;
          }
        }

        .question-scores {
          padding: 0.8rem;
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
          margin-top: 1rem;

          .scores-header {
            color: rgba(0, 0, 0, 0.8);

            .data {
              color: #3399ff;
            }
          }

          .scores {
            display: flex;
            justify-content: left;
            flex-wrap: wrap;
            gap: 1rem;

            .scores-item {
              @include flex-center;
              border: 1px solid #ccc;
              width: 2rem;
              height: 2rem;
              border-radius: 5px;

              @mixin outline-style {
                outline: 2px solid gray;
                outline-offset: 2px;
              }

              &:hover {
                cursor: pointer;
                @include outline-style;
              }

              &.active {
                @include outline-style;
              }

              &.unreviewed {
                background-color: $color-unreviewed;
              }

              &.right {
                background-color: $color-right;
              }

              &.incorrect {
                background-color: $color-incorrect;
              }

              &.partial {
                background-color: $color-partial;
              }

              &.unknown {
                background-color: red;
              }
            }
          }
        }
      }
    }
  }
</style>
