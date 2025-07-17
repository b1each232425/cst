<script>
  import {onMount} from 'svelte';
  import Dialog from "../Dialog.svelte";
  import {page} from "$app/state";
  import {getMarkingDetails, saveMarkingScore} from "../mark/api.js";
  import Question from "../Question.svelte";
  import {goto} from "$app/navigation";
  import {updateMarkInfoState} from "../api.js";

  onMount(async () => {
    try {
      // 响应式获取状态
      $: {
        if (page.status === 200) {  // 确保页面加载完成
          const receivedData = page.state
          console.log('接收到的数据:', receivedData)
          session_info = {...session_info,...receivedData}
          console.log($state.snapshot(session_info))
          // title = receivedData.paper_name || title
          if (session_info.mark_mode && (session_info.mark_mode === '02' || session_info.mark_mode === '04')) {
            isUnFullExamMode = false
          } else {
            isUnFullExamMode = true
          }

        }
      }

      markingDetails = await getMarkingDetails(session_info.id) // TODO DONE
      let {question_sets, student_answers} = markingDetails
      console.log('----->初始数据', markingDetails)
      question_list = initQuestionList(question_sets, student_answers)
      console.log($state.snapshot(question_list))
      question_set_list = initAnswerSheet(question_sets)
      console.log($state.snapshot(question_set_list))
      marking_results = initMarkingResults(student_answers, markingDetails.marking_results, question_list, teacher_id)
      console.log(marking_results)
      marking_info = {
        ...marking_info,
        ...initMarkingInfo(marking_results, student_answers),
        // student_count: marking_info.student_count
      }
      setCurrentStudent(marking_results, 0, 0)
      if (isUnFullExamMode) {
        onUnFullExamMode(marking_results)
      }

      updateNextButtonText()

    } catch (e) {
      console.error(e);
      showDialog('初始化页面数据失败，请重试或联系管理员')
    }

  })

  // 初始化题目数据，设置当前考生作答
  function initQuestionList(question_sets, student_answers) {
    // TODO 参数检查
    if (!Array.isArray(question_sets) || !Array.isArray(student_answers)) {
      throw new TypeError("参数必须是一个数组");
    }
    if (question_sets.length === 0 || student_answers.length === 0) {
      throw new Error("数组不能为空");
    }


    return question_sets.flatMap(({questions}) =>
      questions.map(question => {
        const {
          id,
          order_num,
          score: total_score,
          type,
          stem,
          details,
          mark_role,
          standard_answer,
          standard_answers
        } = question;

        return {
          id,
          order_num,
          total_score,
          type: question_type_to_text[type],
          stem,
          sub_question_count: details?.length,
          details,
          standard_answers,
          answer: {}, // 当前考生的作答
          student_answers: student_answers?.map(student_answer => {
            return {
              ...student_answer,
              curr_answer: student_answer.answers?.find(answer => answer.question_number === order_num)
            }
          }), // 所有考生当前题目的作答
          marked_score: Array(details.length).fill(''),
          mark_role,
          standard_answer,
          is_mark_role_expanded: true,
          is_standard_answer_expanded: true
        };
      })
    );
  }

  // 初始化批改结果数据
  function initMarkingResults(student_answers, marking_results, questions, teacher_id) {
    let results = []

    // TODO
    results = student_answers.map(sa => ({
      student_id: sa.student_id,
      examinee_id: sa.examinee_id,
      status: '00',
      has_changed: false,
      marks: sa.answers?.map(answer => ({
        question_number: answer.question_number,
        question_id: answer.question_id,
        score: -1,
        marker: teacher_id,
        details: Array.from({length: answer.details?.length}, (_, index) => ({
          index: index,
          score: -1,
          analyze: ""
        }))
      }))

    }))

    // results = student_answers.map(sa => ({
    //   student_id: sa.student_id,
    //   examinee_id: sa.examinee_id,
    //   status: '00',
    //   has_changed: false,
    //   marks: questions?.map(question => ({
    //     question_number: question.order_num,
    //     question_id: question.id,
    //     score: -1,
    //     marker: teacher_id,
    //     details: Array.from({length: question.standard_answers?.length}, (_, index) => ({
    //       index: index,
    //       score: -1,
    //       analyze: ""
    //     }))
    //   }))
    //
    // }))


    // 加载已有批改结果
    results.forEach((result) => {
      if (marking_results) {
        let marking_result = marking_results?.find((r) => r.student_id === result.student_id || r.examinee_id === result.examinee_id)
        if (marking_result) {
          result.marks.forEach((mark1) => {
            // console.log(mark1)
            let marking_result_mark = marking_result.marks?.find((mark2) => mark2.question_number === mark1.question_number)
            if (marking_result_mark) {
              mark1.score = marking_result_mark.score
              mark1.details?.forEach((detail1) => {
                let marking_result_detail = marking_result_mark.details?.find((detail2) => detail2.index === detail1.index)
                // console.log(marking_result_detail)
                if (marking_result_detail) {
                  detail1.score = marking_result_detail.score
                  detail1.analyze = marking_result_detail.analyze
                }
              })
            }
          })

          updateMarkingResultState(result)

        }
      }
    })

    // console.log(marking_results)

    return results
  }


  function initAnswerSheet(question_sets) {
    if (!Array.isArray(question_sets)) {
      throw new TypeError("参数必须为一个数组");
    }

    if (question_sets.length === 0) {
      throw new Error("数组不能为空");
    }

    return question_sets?.map(({name, score, questions}) => ({
      name,
      total_score: score,
      score: '--',
      questions: questions?.map(({order_num, score: qScore}) => ({
        question_number: order_num,
        total_score: qScore,
        score: -1,
        color_style: "question-order-color-0"
      }))
    })).filter(({questions}) => questions?.length > 0)
  }


  function initMarkingInfo(marking_results, student_answers) {
    if (!Array.isArray(marking_results) || !Array.isArray(student_answers)) {
      throw new TypeError("参数必须是一个数组");
    }

    if (marking_results.length === 0 || student_answers.length === 0) {
      throw new Error("数组不能为空");
    }
    //TODO
    let student_count = student_answers.length
    let total_unmarked_question_count = 0
    let marked_count = marking_results.reduce((count, result) => {
      return count + result.marks.filter(mark => mark.score !== -1 && mark.score !== '').length;
    }, 0);
    // console.log(marked_count)
    total_unmarked_question_count = student_answers.length * question_list.length - marked_count

    let marking_result = marking_results.find((result) => result.student_id === curr_student.id || result.examinee_id === curr_student.examinee_id)

    let total_marked_score = 0
    marking_result?.marks?.forEach((mark) => {
      total_marked_score += mark.score
    })
    curr_student.score = total_marked_score

    let unmarked_student_count = initUnmarkedStudentCount(marking_results)
    if (unmarked_student_count === -1) {
      console.error('获取未批改学生数失败')
      return {total_unmarked_question_count, unmarked_student_count: -1,student_count}
    }

    return {total_unmarked_question_count, unmarked_student_count,student_count}
  }

  function initUnmarkedStudentCount(marking_results) {
    return marking_results?.reduce((count, {status}) =>
      status === '00' ? count + 1 : count, 0
    ) ?? -1;
  }

  function updateMarkingScore(mark, index, score) {
    if (typeof score !== 'number' || typeof index !== 'number' || !mark) {
      console.error("入参错误")
      return
    }

    if (mark.details[index].score === score) {
      return
    }

    mark.details[index].score = score

    let unmarked_sub_question_count = getSubQuestionUnmarkedCount(mark)

    mark.score = mark.details.reduce((score, detail) => score + detail.score, 0) + unmarked_sub_question_count

    if (unmarked_sub_question_count === mark.details.length) {
      mark.score = -1
    }

  }

  function updateMarkingInfo(mark, score, pre_score, question_score, pre_question_score) {
    if (typeof question_score !== 'number' || typeof pre_question_score !== 'number') {
      console.error("入参错误")
      return
    }
    //TODO


    if (question_score === -1) {
      if (pre_question_score === -1) {
        return
      }

      curr_student.un_marked_question_count += 1
      marking_info.total_unmarked_question_count += 1
      curr_student.score = curr_student.score - pre_question_score
      return
    }

    // console.log(score, pre_score, mark.details.filter((detail) => detail.score === -1).length)
    if (score === -1 && pre_score !== -1 && getSubQuestionUnmarkedCount(mark) === 1) {
      curr_student.un_marked_question_count += 1
      marking_info.total_unmarked_question_count += 1
    } else if (pre_score === -1 && getSubQuestionUnmarkedCount(mark) === 0) {
      curr_student.un_marked_question_count -= 1
      marking_info.total_unmarked_question_count -= 1
    }

    let delta_score = question_score - pre_question_score

    if (delta_score === 0) {
      return
    }

    if (pre_question_score === -1 || pre_question_score === '') {
      // curr_student.un_marked_question_count -= 1
      // total_unmarked_question_count -= 1
      curr_student.score = curr_student.score + question_score
      return
    }

    curr_student.score = curr_student.score + delta_score
  }

  function getSubQuestionUnmarkedCount(mark) {
    // console.log(mark, mark.details.filter((detail) => detail.score === -1).length)
    return mark.details.filter((detail) => detail.score === -1).length
  }

  function onInputMarkedScore(max_score, e) {
    console.log(max_score)
    if (e.target.value === '') {
      return
    }

    // if (typeof e.target.value !== 'number') {
    //   console.error("输入错误", e.target.value, typeof e.target.value)
    //   return
    // }

    if (max_score < 10 && e.target.value >= 10) {
      // 取个位数
      e.target.value = e.target.value.slice(-1)
      return
    }

    if (e.target.value > max_score) {
      e.target.value = max_score
    } else if (e.target.value < 0) {
      e.target.value = 0
    }

  }

  function onScoreInputBlur(question_number, index, e) {
    // console.log(question_number, index, e.target.value)
    let score
    if (e.target.value === '' || e.target.value < 0) {
      score = -1
    } else {
      score = parseInt(e.target.value)
    }
    if (isNaN(score)) {
      console.error("输入错误")
      return
    }

    let curr_student_result = marking_results?.find(result => result.student_id === curr_student.id || result.examinee_id === curr_student.examinee_id)
    if (!curr_student_result) {
      console.error("数据错误")
      return
    }

    curr_student_result.has_changed = true
    let mark = curr_student_result.marks?.find(mark => mark.question_number === question_number)
    if (!mark) {
      console.error("数据错误")
      return
    }

    let pre_status = curr_student_result.status
    let pre_score = mark.details[index].score
    let pre_question_score = mark.score
    // console.log(pre_question_score)
    // console.log(score, pre_score,pre_question_score)
    updateMarkingScore(mark, index, score)
    // console.log(mark.score,pre_question_score)
    updateMarkingInfo(mark, score, pre_score, mark.score, pre_question_score)


    updateMarkingResultState(curr_student_result)

    if (curr_student_result.status === '02' && pre_status === '00') {
      marking_info.unmarked_student_count -= 1
    } else if (curr_student_result.status === '00' && pre_status === '02') {
      marking_info.unmarked_student_count += 1
    }

    // console.log(session_info)

    updateAnswerSheet(question_number, mark.score)
  }


  function setCurrentStudent(marking_results, offset, index = -1) {
    let newIndex = -1;
    if (index !== -1) {
      newIndex = index + offset
    } else {
      newIndex = curr_student.index + offset
    }

    if (newIndex < 0 || newIndex >= marking_results.length) {
      console.error("切换考生失败，数据错误");
      return;
    }

    const nextStudentResult = marking_results[newIndex];
    const studentInfo = markingDetails.students?.find(
      (student) => student.student_id === nextStudentResult.student_id
    );

    if (!studentInfo) {
      console.error("数据错误");
      return;
    }

    // 更新当前学生基本信息
    curr_student = {
      ...curr_student,
      examinee_id: nextStudentResult.examinee_id,
      name: "考生" + (newIndex + 1) || studentInfo.name, // TODO
      id: studentInfo.student_id,
      index: newIndex
    };

    // 计算已批改题目数量
    let markedCount = marking_results?.find(
      ({examinee_id}) => examinee_id === curr_student.examinee_id
    )
      ?.marks?.reduce(
        (count, {score}) => count + (score !== -1 && score !== '' ? 1 : 0),
        0
      ) ?? -1;

    if (markedCount === -1) {
      console.error("数据错误，切换考生失败");
      return;
    }

    curr_student.un_marked_question_count = question_list.length - markedCount;
    curr_student.score = 0;
    curr_student.total_score = 0;

    // 加载相关数据
    loadMarkingResults(marking_results, curr_student.examinee_id);
    loadStudentAnswers(curr_student.examinee_id, curr_student.id);

    // 计算总分和当前得分
    const totalScores = question_set_list.map(set => set.total_score);
    curr_student.total_score = totalScores.reduce((acc, cur) => acc + cur, 0);

    const scores = question_set_list.map(set =>
      set.score === '--' ? 0 : set.score
    );
    curr_student.score = scores.reduce((acc, cur) => acc + cur, 0);
  }

  function setCurrentQuestion(question_number, offset) {
    const currentIndex = question_list.findIndex(q => q.order_num === question_number);

    // 如果找不到题目，直接返回
    if (currentIndex === -1) {
      console.error(`未找到题目编号: ${question_number}`);
      return;
    }

    const newIndex = currentIndex + offset;

    // 检查新索引是否有效
    if (newIndex < 0 || newIndex >= question_list.length) {
      console.error(`索引超出范围: ${newIndex} (有效范围: 0-${question_list.length - 1})`);
      return
    }

    // 更新当前题目
    single_question[0] = {...question_list[newIndex], index: newIndex}
    //TODO
  }

  function loadMarkingResults(marking_results, examinee_id) {
    let marking_result = marking_results.find((result) => result.examinee_id === examinee_id)

    if (!marking_result) {
      console.error('加载考生批改结果失败')
      return
    }

    question_list.forEach((question) => {
      let mark = marking_result.marks?.find((mark) => mark.question_number === question.order_num)
      if (mark) {
        updateAnswerSheet(question.order_num, mark.score)
        question.marked_score = mark.details?.map((d) => d.score === -1 ? '' : d.score)
      }
    })

    question_list = question_list

  }

  function loadStudentAnswers(examinee_id, student_id) {

    question_list.forEach((question) => {
      //TODO
      let student_answer = question.student_answers?.find((sa) => sa.examinee_id === examinee_id || sa.student_id === student_id)
      if (!student_answer || !student_answer.curr_answer) {
        console.error('加载考生答案失败')
        return
      }
      // console.log(student_answer)

      question.answer = student_answer.curr_answer

    })

    question_list = question_list

  }

  function updateAnswerSheet(question_number, score) {
    // console.log(question_number, score)
    // console.log(question_set_list)
    //TODO
    question_set_list.forEach(question_set => {
      question_set.questions.forEach(question => {
        if (question.question_number === question_number) {
          let pre_score = question.score

          if (pre_score === -1) {
            pre_score = 0
          }
          let score_delta = score - pre_score
          if (score === -1) {
            question.color_style = "question-order-color-0"

            // console.log(pre_score)
            question_set.score -= pre_score

            question.score = -1


            // 查看当前题组下的题目的分值是否全为-1
            if (question_set.questions.every(question => question.score === -1)) {
              question_set.score = '--'
            }

            return
          }

          if (question_set.score === '--') {
            question_set.score = 0
          }
          question_set.score = question_set.score + score_delta
          question.score = score

          if (score === -1) {
            question.color_style = "question-order-color-0"
            return
          }

          if (score === 0) {
            question.color_style = "question-order-color-2"
          } else if (score === question.total_score) {
            question.color_style = "question-order-color-1"
          } else {
            question.color_style = "question-order-color-3"
          }

        }
      })
    })

    // 触发响应式更新
    question_set_list = question_set_list

  }


  // 更新单个考生批改结果的状态
  function updateMarkingResultState(marking_result) {
    let status = '00'
    let isUnCompleted = true
    isUnCompleted = marking_result.marks
      .some((mark) => mark.score === -1 || mark.score === '' || mark.details
        .some((detail) => detail.score === -1 || detail.score === ''))
    if (isUnCompleted) {
      status = '00' // 未改完
    } else {
      status = '02' // 已改完
    }
    // console.log(marking_result)
    // console.log(isUnCompleted)
    marking_result.status = status
  }

  function onClickLastStudent() {
    scrollMarkBodyToTop()
    if (isUnFullExamMode) {
      // 按题模式下
      if (curr_student.index === 0) {
        // TODO
        setCurrentStudent(marking_results, 0, 0)
        setCurrentQuestion(single_question[0].order_num, -1)
        return
      }

      setCurrentStudent(marking_results, -1)
      setCurrentQuestion(single_question[0].order_num, 0)
    } else {
      if (curr_student.index === 0) {
        return
      }

      // console.log()

      setCurrentStudent(marking_results, -1)
    }
    // single_question[0] = questions.find((question) => question.order_num === single_question[0].order_num)
    updateNextButtonText()
  }

  function onClickNextStudent() {
    scrollMarkBodyToTop()
    if (isUnFullExamMode) {
      if (curr_student.index !== marking_results.length - 1) {
        setCurrentStudent(marking_results, 1)
        setCurrentQuestion(single_question[0].order_num, 0)
        updateNextButtonText()
        return
      }

      if (single_question[0].index !== question_list.length - 1) {
        // 切换到第一个考生
        setCurrentStudent(marking_results, -(marking_results.length - 1))
        setCurrentQuestion(single_question[0].order_num, 1)
        updateNextButtonText()
        return
      }

      console.log("已到最后一个考生最后一题")

      let {question_number, examinee_id, index} = findFirstUnMarkedQuestion(marking_results)
      if (question_number !== -1) {
        // 若有题目没改完，切换到该题目
        setCurrentQuestion(question_number, 0)
        updateNextButtonText()
        return
      }

      // 保存批改分数
      saveAllMarkingScore()
        .then(() => {
          dialog = dialog_complete_marking
          dialog.show = true
        })
        .catch(e => {
          console.error(e)
          showDialog('批改结果上传保存失败')
        })
    } else {
      onSaveMarking(marking_results, curr_student.examinee_id)
        .then((res) => {
          console.log(res)
          if (res !== 0) {
            return
          }
          if (curr_student.index !== marking_results.length - 1) {
            setCurrentStudent(marking_results, 1)
            updateNextButtonText()
            return
          }

          if (!checkAllMarkingsCompleted()) {
            console.error('未完成所有批改')
            showDialog('未完成所有批改')
            return
          }

          dialog = dialog_complete_marking
          dialog.show = true
        })
        .catch(e => {
          console.error(e)
          showDialog('批改结果上传保存失败')
        })
    }
  }

  function onUnFullExamMode(marking_results) {
    let {question_number, examinee_id, index} = findFirstUnMarkedQuestion(marking_results)
    // console.log(question_number, examinee_id, index)
    if (question_number === -1) {
      // showTips("所有题目已批改完")
      setCurrentQuestion(question_list[0].order_num, 0)
      return -1
    }


    // 载入题目、作答到 single_question
    setCurrentStudent(marking_results, 0, index)
    setCurrentQuestion(question_number, 0)
  }

  async function onSaveMarking(marking_results, examinee_id) {
    try {
      // 检测当前考生批改情况
      if (!validateCurrMarkingResult(marking_results, examinee_id)) {
        console.error('未批改完')
        showDialog('请先完成当前所有批改')
        return -1
      }

      let marking_result = marking_results?.find(result => result.examinee_id === examinee_id)

      if (!marking_result.has_changed) {
        console.log('未发生任何修改')
      } else {
        await saveMarkingScore({
          marking_results: [marking_result],
          session_id: session_info.id
        })
      }
      return 0
    } catch (e) {
      console.error(e)
      throw new Error(e)
    }


  }

  function validateCurrMarkingResult(marking_results, examinee_id) {
    let curr_student_marking_result = marking_results?.find(result => result.examinee_id === examinee_id)

    if (!curr_student_marking_result) {
      console.error(`考生 ${examinee_id} 未找到评分结果`);
      return false;
    }

    if (!curr_student_marking_result.marks) {
      console.error(`考生 ${examinee_id} 未找到评分结果`);
      return false
    }

    console.log(curr_student_marking_result.marks)

    const has_unmarked = curr_student_marking_result.marks?.some(mark =>
      mark.details.some(({score}) =>
        score === '' || score === -1
      )
    )
    return !has_unmarked
  }


  function updateNextButtonText() {
    const shouldShowSubmit = () => {
      // console.log(session_info.total_unmarked_question_count ,curr_student.index, marking_results.length, single_question[0]?.index,question_list.length)
      if (isUnFullExamMode) {
        // 按题模式：只剩1题且当前是最后一位学生且最后一道题
        return (
          marking_info.total_unmarked_question_count <= 1 &&
          curr_student.index === marking_results.length - 1 &&
          single_question[0]?.index === question_list.length - 1
        );
      } else {
        // 整卷模式：只有1位学生或最后一位学生或只剩1题
        return (
          marking_results.length === 1 ||
          curr_student.index === marking_results.length - 1
          // marking_info.total_unmarked_question_count === 1
        )
      }
    }

    onNextStudentButtonText = shouldShowSubmit() ? '提交' : '下一位';
  }

  function checkAllMarkingsCompleted() {
    return marking_results.every((result) => result.status === '02')
  }

  // 假设 students 是一个包含十个考生数据的数组，每个考生数据是类似 mark 的数组
  function findFirstUnMarkedQuestion(marking_results) {
    const unMarkedQuestions = new Set();

    // 遍历每个考生
    for (const result of marking_results) {
      // 遍历考生的每个题目
      for (const mark of result.marks) {
        if (mark.score === -1) {
          console.log(result.examinee_id)
          unMarkedQuestions.add(mark.question_number);
        }
      }
    }

    // 将题目编号转换为数组并排序
    const sortedQuestions = Array.from(unMarkedQuestions).sort((a, b) => a - b);

    let question_number = sortedQuestions.length > 0 ? sortedQuestions[0] : -1

    if (question_number === -1) {
      return {
        question_number: -1,
        examinee_id: -1,
        index: -1
      }
    }

    // 找出该题目编号下最先的未批改的考生 及其索引
    for (let i = 0; i < marking_results.length; i++) {
      for (let j = 0; j < marking_results[i].marks.length; j++) {
        if (marking_results[i].marks[j].question_number === question_number && marking_results[i].marks[j].score === -1) {
          return {
            question_number,
            examinee_id: marking_results[i].examinee_id,
            index: i,
          }
        }
      }
    }

  }

  function saveAllMarkingScore() {
    return new Promise((resolve, reject) => {
      if (!checkAllMarkingsCompleted()) {
        console.error('未完成所有批改')
        showDialog('请先完成所有批改')
        resolve()
      }

      saveMarkingScore({
        marking_results: marking_results,
        session_id: session_info.id
      })
        .then(res => {
          console.log(res)
          resolve(res)
        })
        .catch(e => {
          console.error(e)
          reject(e)
        })
    })
  }

  function onClickNavigateBack() {
    // window.history.back();
    goto('/teacher/mark/markManagement')
  }

  function scrollMarkBodyToTop() {
    if (mark_body) {
      mark_body.scrollTo({
        top: 0,
        behavior: 'smooth'
      });
    }
  }

  function showDialog(content) {
    dialog1.content = content
    dialog1.show = true
    dialog = dialog1
  }

  let question_type_to_text = {
    "": "未知题型",
    "00": "单选题",
    "02": "多选题",
    "04": "判断题",
    "06": "填空题",
    "08": "简答题",
    "10": "编程题"
  }

  let markingDetails = {}
  let marking_results = []
  let teacher_id = 1 // TODO

  let session_info = $state({})
  let question_list = $state([])
  let question_set_list = $state([])
  // let unmarked_student_count = $state(0)
  // let total_unmarked_question_count = $state(0)
  // let student_count = $state(0)
  let marking_info = $state({
    unmarked_student_count: 0,
    total_unmarked_question_count: 0,
    student_count: 0,
  })
  let curr_student = $state({
    index: 0,
    name: '',
    id: '',
    examinee_id: '',
    un_marked_question_count: '',
    score: '',
    total_score: '',
  })

  let onNextStudentButtonText = $state("")


  // 是否是（按题模式）
  let isUnFullExamMode = $state(false)

  let single_question = $state([])

  let dialog = $state({
    show: false,
    title: "提示",
    content: "数据获取错误，请联系管理员",
    confirmText: "确定",
    cancelText: "取消",
    confirmTextBackgroundColor: "#E34D59",
    onConfirm: () => {
      // onClickNavigateBack()
    },
  })

  let dialog1 = {
    show: false,
    title: "提示",
    content: "数据获取错误，请联系管理员",
    confirmText: "确定",
    cancelText: "取消",
    confirmTextBackgroundColor: "#E34D59",
    onConfirm: () => {
      // onClickNavigateBack()
    },
    // onCancel: () => {
    //   dialog.show = false
    //   dialog = dialog
    // }
  }

  let dialog_complete_marking = {
    show: true,
    title: "提示",
    content: "批改已完成，点击确定将返回批改列表",
    confirmText: "确定",
    cancelText: "取消",
    confirmTextBackgroundColor: "#E34D59",
    onConfirm: () => {
      updateMarkInfoState(session_info.id)
        .then(res => {
          console.log(res)
          onClickNavigateBack()
        })
        .catch(e => {
          console.error(e)
          showDialog('批改状态更新失败，请重试')
        })
      // onClickNavigateBack()
    },
  }

  /*
   * 02: 全卷多评
   * 04: 按卷均配
   * 06: 按题多评
   */
  let mark_mode = $state("")

  let color_sign_list = [
    {
      color: '#babec4',
      text: '未批阅',
    },
    {
      color: '#1aff00',
      text: '正确',
    },
    {
      color: '#ff0101',
      text: '错误',
    },
    {
      color: '#ff9500',
      text: '含错',
    }
  ]

  let icons = {
    "back": "/mark/i-arrow-left.svg"
  }

  let mark_body


</script>


<header>
  <div class="header-content-container">
    <button class="navigate-back-container" on:click={onClickNavigateBack}>
      <div style="width: 24px;height: 24px">
        <image src="{icons['back']}" style="width: 24px;height: 24px"></image>
      </div>
      <p>返回</p>
    </button>
    <p class="header-title">{session_info.paper_name}</p>
    <p class="header-content-form">总人数：</p>
    <p>{marking_info.student_count}</p>
    <p class="header-content-form">未批改人数：</p>
    <p style="color:#0336ff">{marking_info.unmarked_student_count}</p>
    <p class="header-content-form">总未批改题数：</p>
    <p style="color:#0336ff">{marking_info.total_unmarked_question_count}</p>
    <!--    <div class="switch-container">-->
    <!--      <p>阅卷偏好：</p>-->
    <!--      <p style="color: #757575">逐卷模式</p>-->
    <!--      <Switch bind:mode={isUnFullExamMode} onToggle="{onToggleExamMode}"/>-->
    <!--      <p style="color: #757575">逐题模式</p>-->
    <!--    </div>-->
  </div>
</header>

<div class="page-container">
  <div class="page-body">
    <div class="mark-container" class:un-full-mark-container={isUnFullExamMode}>
      <div class="mark-header">
<!--        <button class="navigate-back-container" on:click={onClickNavigateBack}>-->
<!--          <div style="width: 24px;height: 24px">-->
<!--            <image src="{icons['back']}" style="width: 24px;height: 24px"></image>-->
<!--          </div>-->
<!--          <p>返回</p>-->
<!--        </button>-->
        <div class="mark-info-container">
          <p class="mark-info-text">当前考生：</p>
          <div class="name-placeholder">
            <p>{curr_student.name}</p>
          </div>
          <p class="mark-info-text">未批改题数：</p>
          <p>{curr_student.un_marked_question_count}</p>
          <p class="mark-info-text">当前得分：</p>
          <p style="color:#FB5353">{curr_student.score}</p>
          <p style="color:#333333">/{curr_student.total_score}分</p>
        </div>
        <div class="button-container">
          <button class="left-button" on:click={onClickLastStudent}>上一位</button>
          <button class="right-button" on:click={onClickNextStudent}>{onNextStudentButtonText}</button>
        </div>
      </div>
      <div class="mark-body" bind:this={mark_body}>
        <div class="mark-list">
          {#if isUnFullExamMode}
            {#each single_question as q, i}
              <Question bind:question={single_question[i]} onInputMarkedScore={onInputMarkedScore}
                        onScoreInputBlur={onScoreInputBlur}></Question>
            {/each}
          {:else}
            {#each question_list as q, i}
              <Question bind:question={question_list[i]} onInputMarkedScore={onInputMarkedScore}
                        onScoreInputBlur={onScoreInputBlur}></Question>
            {/each}
          {/if}
        </div>
      </div>
    </div>
    <div class="answer-sheet" class:un-full-answer-sheet={isUnFullExamMode}>
      <div class="answer-sheet-title-container">
        <div class="answer-sheet-title">
          <p>作答详情</p>
        </div>
      </div>
      <div class="color-sign-container">
        {#each color_sign_list as item, i (i)}
          <div class="color-sign-item">
            <div class="circle" style="background-color: {item.color}"></div>
            <div class="sign-text" style="color: {item.color}">{item.text}</div>
          </div>
        {/each}
      </div>
      <div class="question-set-container">
        {#each question_set_list as item, i (i)}
          <div class="question-set-item">
            <div class="question-set-item-title">
              <p class="group-name" title="{item.name}">{item.name}</p>
              <p>（</p>
              <p style="color: #165DFF;width:max-content">{item.score}分</p>
              <p>/{item.total_score}分）</p>
            </div>
            <div class="question-order-list">
              {#each item.questions as q, i (i)}
                <div class="question-order-item {q.color_style}">
                  <p>{q.question_number}</p>
                </div>
              {/each}
            </div>
          </div>
        {/each}
      </div>
    </div>
  </div>
</div>


<Dialog
  bind:isShow={dialog.show}
  title={dialog.title}
  content={dialog.content}
  confirmText={dialog.confirmText}
  cancelText={dialog.cancelText}
  confirmTextBackgroundColor={dialog.confirmTextBackgroundColor}
  onConfirm={dialog.onConfirm}
/>

<!--<ActionToast-->
<!--  bind:isShow={actionToastIsShow}-->
<!--  type="success"-->
<!--  message="保存成功"-->
<!--  duration={2000}-->
<!--  bind:this={actionToast}-->
<!--/>-->

<style scoped>

    header {
        display: flex;
        background-color: #fff;
        color: #333;
        /*padding: 1rem;*/
        height: 65px;
        align-items: center;
        justify-content: center;
    }

    .header-content-container {
        width: 1365px;
        display: flex;
    }

    .header-content-container p {
        line-height: 45px;
    }

    /*.switch-container {*/
    /*    position: absolute;*/
    /*    right: 0;*/
    /*    display: flex;*/
    /*    align-items: center;*/
    /*    gap: 10px;*/
    /*}*/

    .header-title {
        height: 45px;
        line-height: 45px;
        font-size: 18px;
        margin-left: 20px;
    }

    .header-content-form {
        color: #757575;
        margin-left: 25px;
    }


    button {
        /* 清除默认边框 */
        border: 0;
        outline: none;
        /*清除默认背景 */
        background-color: transparent;
    }

    /*input {*/
    /*    -moz-appearance: textfield;*/
    /*}*/

    /*input::-webkit-inner-spin-button,*/
    /*input::-webkit-outer-spin-button {*/
    /*    -webkit-appearance: none;*/
    /*    margin: 0;*/
    /*}*/

    /*text {*/
    /*    font-size: 14px;*/
    /*}*/

    p {
        font-size: 14px;
        margin-block-start: 0;
        margin-block-end: 0;
        margin-inline-start: 0;
        margin-inline-end: 0;
    }

    .page-container {
        display: flex;
        gap: 2rem;
        padding-top: 5px;
        width: 100%;
        height: calc(100vh - 65px - 5px);
        justify-content: center;
        background-color: #eff0f2;
    }

    .page-body {
        display: flex;
        gap: 15px;
        width: max-content;
        height: 100%;
    }

    .mark-container {
        width: 1000px;
        height: 100%;
        background-color: #fff;
        border-radius: 5px;
    }

    .un-full-mark-container {
        width: 1365px;
    }

    .mark-header {
        height: 60px;
        width: 100%;
        background-color: #fbfbfb;
        padding: 2px 2px 2px 2px;
        border-radius: 5px 5px 0 0;
        border-bottom: 1px solid #e4e7ed;
        box-sizing: border-box;
        position: relative;
        display: flex;
        align-items: center;
    }

    .navigate-back-container {
        margin-left: 12px;
        padding: 0;
        display: flex;
        align-items: center;
        color: #4c4c4c;
    }

    .navigate-back-container:hover {
        cursor: pointer;
        color: #0036ff;
    }

    .name-placeholder {
        width: 100px;
        height: auto;
        overflow: hidden;
        text-overflow: ellipsis;
    }

    .mark-info-container {
        display: flex;
        align-items: center;
        height: 60px;
        line-height: 60px;
    }

    .mark-info-text {
        color: #757575;
        height: max-content;
        margin-left: 20px;
    }

    .mark-header .button-container {
        display: flex;
        gap: 14px;
        right: 12px;
        position: absolute;
        width: max-content;
        height: max-content;

    }

    .button-container .right-button {

        width: 89px;
        height: 35px;
        padding: 2px 2px 2px 2px;
        border-radius: 5px;
        border: 1px solid #e4e7ed;
        background-color: #0336ff;
        box-sizing: border-box;
        font-family: 'ArialMT', 'Arial', sans-serif;
        color: #ffffff;
        text-align: center;
        line-height: 25px;
    }

    .button-container .right-button:hover {
        background-color: rgba(3, 54, 255, 0.72);
        box-sizing: border-box;
        cursor: pointer;
    }

    .button-container .left-button {
        width: 80px;
        height: 35px;
        padding: 2px 2px 2px 2px;
        border-radius: 5px;
        border: 1px solid #e4e7ed;
        background-color: #ffffff;
        box-sizing: border-box;
        font-family: 'ArialMT', 'Arial', sans-serif;
        color: #4c4c4c;
        text-align: center;
        line-height: 25px;


    }

    .button-container .left-button:hover {
        background-color: #f1f8fd;
        box-sizing: border-box;
        cursor: pointer;
    }

    .mark-body {
        height: calc(100% - 60px);
        width: 100%;
        overflow: auto;
    }

    ::-webkit-scrollbar {
        display: none;
    }

    .mark-list {
        display: flex;
        flex-direction: column;
        height: 100%;
        /*width: 100%;*/
        margin-left: 20px;
        margin-right: 20px;
        margin-top: 5px;
    }

    .answer-sheet {
        width: 350px;
        height: 100%;
        background-color: #fff;
        border-radius: 5px;
    }

    .un-full-answer-sheet {
        display: none;
    }

    .answer-sheet-title-container {
        height: 48px;
        width: 100%;
        display: flex;
    }

    .answer-sheet-title {
        width: 80px;
        height: 36px;
        border-bottom: 1px solid #165dff;
        display: flex;
        justify-content: center;
        margin-left: 16px;
        margin-top: 12px;
    }

    .answer-sheet-title p {
        color: #165dff;
        font-size: 14px;
        line-height: 36px;
        text-align: center;
        height: 36px;
    }

    .color-sign-container {
        background-color: #f9f9f9;
        display: flex;
        align-items: center;
        margin-left: 16px;
        margin-top: 10px;
        width: 263px;
        height: 37px;
        justify-content: space-around;
    }

    .circle {
        width: 6px;
        height: 6px;
        padding: 2px 2px 2px 2px;
        border-radius: 5px;
        box-sizing: border-box;
    }

    .color-sign-item {
        height: 20px;
        width: max-content;
        display: flex;
        align-items: center;
        gap: 8px;
    }

    .question-set-container {
        width: 100%;
        min-height: 105px;
        height: auto;
        margin-top: 10px;
        display: flex;
        flex-direction: column;
    }

    .question-set-item {
        display: flex;
        flex-direction: column;
        width: calc(100% - 40px);
        min-height: 105px;
        margin: 0 auto;
    }

    .question-set-item-title {
        height: 45px;
        line-height: 45px;
        width: 100%;
        display: flex;
    }

    .question-set-item-title .group-name {
        font-size: 16px;
        max-width: 210px;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;

    }

    .question-order-list {
        display: flex;
        justify-content: start;
        flex-wrap: wrap;
        width: 100%;
        height: auto;
    }

    .question-order-item {
        height: 36px;
        width: 36px;
        border-radius: 3px;
        margin: 12px;
        display: flex;
        justify-content: center;
        align-items: center;
        line-height: 36px;
        background-color: #ffcbcb;
        border: 1px solid #ff7f7f;
        color: #ff0000;
    }

    .question-order-color-0 {
        color: #919191;
        background-color: #fff;
        border-color: #b2b2b2
    }

    .question-order-color-1 {
        color: #00e343;
        background-color: #d2ffcd;
        border-color: #88e57e
    }

    .question-order-color-2 {
        color: #ff0000;
        background-color: #ffcbcb;
        border-color: #ff7f7f
    }

    .question-order-color-3 {
        color: #ff9500;
        background-color: #ffe9cb;
        border-color: #ffca7f
    }

    /* Chrome, Safari, Opera 15+, Android, and iOS */
    ::-webkit-input-placeholder {
        color: #999; /* Placeholder文本颜色 */
        font-size: 14px; /* Placeholder字体大小 */
    }

    /* Firefox 4-18 */
    :-moz-placeholder {
        color: #999;
        font-size: 14px;
    }

    /* Firefox 19+ */
    ::-moz-placeholder {
        color: #999;
        font-size: 14px;
    }

</style>
