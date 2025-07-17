<script>
  import {getMarkingDetails, saveMarkingScore} from "./api.js";
  import {onMount} from "svelte";
  import {page} from '$app/state';
  import {goto} from "$app/navigation";
  import Dialog from "../Dialog.svelte";
  import ActionToast from "$lib/component/ActionToast.svelte";
  import Switch from "../Switch.svelte";
  import Question from "../Question.svelte";
  import {
    getPracticeMarkingDetails,
    submitCheckedResults,
    submitMarkingResult,
    submitPracticeMarkingResult
  } from "../api.js";

  let markingDetails = {}

  let teacher_id = 1 // TODO

  let session_id = 0
  let practice_id = 0
  let ai_marked = ""


  let session_info = $state({})

  let marking_results = []

  let icons = {
    "back": "/mark/i-arrow-left.svg"
  }

  let dialog_content = $state({
    show: false,
    title: "提示",
    content: "数据获取错误，请联系管理员",
    confirmText: "确定",
    cancelText: "取消",
    confirmTextBackgroundColor: "#E34D59",
    onConfirm: () => {
      onClickNavigateBack()
    },
    onCancel: () => {
      dialog_content.show = false
      dialog_content = dialog_content
    }
  })

  let dialog_content1 = {
    show: false,
    title: "提示",
    content: "数据获取错误，请联系管理员",
    confirmText: "确定",
    cancelText: "取消",
    confirmTextBackgroundColor: "#E34D59",
    onConfirm: () => {
      // onClickNavigateBack()
      dialog_content.show = false
      dialog_content = dialog_content
    },
    onCancel: () => {
      dialog_content.show = false
      dialog_content = dialog_content
    }
  }

  let dialog_content2 = {
    show: true,
    title: "提示",
    content: "请先完成所有批改",
    confirmText: "确定",
    cancelText: "取消",
    confirmTextBackgroundColor: "#E34D59",
    onConfirm: () => {
      dialog_content.show = false
      dialog_content = dialog_content
    },
    onCancel: () => {
      dialog_content.show = false
      dialog_content = dialog_content
    }
  }

  let dialog_complete_marking = {
    show: true,
    title: "提示",
    content: "批改结果已保存，是否直接提交结果？",
    confirmText: "保存并提交",
    cancelText: "仅保存",
    confirmTextBackgroundColor: "#E34D59",
    onConfirm: () => {
      // onClickNavigateBack()
      if (isSingleExamineeMode) {
        dialog_content.show = false
        dialog_content = dialog_content
        onClickNavigateBack()
        return
      }
      if (practice_id) {
        onClickNavigateBack()
        return
      }

      submitMarkingResult(session_id, "10")
        .then((r) => {
          console.log("提交批改结果成功: ", r)
          dialog_content.show = false
          dialog_content = dialog_content
          onClickNavigateBack()
          // onNavigateToDetails(session_id)
        })
        .catch((error) => {
          console.error("提交批改结果失败: ", error)
          dialog_content = dialog_content4
        })

    },
    onCancel: () => {
      dialog_content.show = false
      dialog_content = dialog_content
      onClickNavigateBack()
    }
  }

  let dialog_content4 = {
    show: true,
    title: "提示",
    content: "批改结果提交失败，请重试",
    confirmText: "确定",
    cancelText: "取消",
    confirmTextBackgroundColor: "#E34D59",
    onConfirm: () => {
      dialog_content.show = false
      dialog_content = dialog_content
    },
    onCancel: () => {
      dialog_content.show = false
      dialog_content = dialog_content
    }
  }

  onMount(async () => {
    try {
      // 响应式获取状态
      $: {
        if (page.status === 200) {  // 确保页面加载完成
          const receivedData = page.state
          console.log('接收到的数据:', receivedData)
          session_info = {...receivedData}
          title = receivedData.paper_name || title
        }
      }

      session_id = page.url.searchParams.get('session_id')
      practice_id = page.url.searchParams.get('practice_id')
      ai_marked = page.url.searchParams.get('ai_marked')
      session_id = parseInt(session_id)
      practice_id = parseInt(practice_id)
      if ((!practice_id || practice_id <= 0 || isNaN(practice_id)) && (!session_id || session_id <= 0 || isNaN(session_id))) {
        throw new Error("page params is null")
      }


      let examinee_id = page.url.searchParams.get('examinee_id')
      if (examinee_id) {
        examinee_id = parseInt(examinee_id)
        if (!examinee_id || examinee_id <= 0 || isNaN(examinee_id)) {
          throw new Error("examinee_id is null")
        }

        console.log("批改单个学生")
        isSingleExamineeMode = true
      } else {
        examinee_id = -1
      }

      // if (!session_id || session_id === undefined) {
      //   throw new Error("session_id is null")
      // }

      // session_id = parseInt(session_id)
      //
      // if (!session_id || isNaN(session_id)) {
      //   throw new Error("session_id is null")
      // }

      if (session_id > 0) {
        markingDetails = await getMarkingDetails(session_id, examinee_id)
      } else if (practice_id > 0) {
        console.log("练习批改")
        markingDetails = await getPracticeMarkingDetails(practice_id)
      } else {
        throw new Error("practice_id && session_id is both null")
      }


      console.log(markingDetails)
      if (markingDetails.error) {
        throw new Error(markingDetails.error.code + " " + markingDetails.error.message)
      }

      marking_results = []

      questions = initQuestions(markingDetails)
      // console.log(questions)
      marking_results = initMarkingResults(markingDetails, questions, teacher_id)
      // console.log(marking_results)
      question_set_list = initAnswerSheet(markingDetails)
      // console.log("question_set_list--->", question_set_list)
      initMarkingInfo(markingDetails)
      setCurrentStudent(marking_results, 0)
      loadMarkingResults(curr_student.examinee_id)
      unmarked_student_count = initUnmarkedStudentCount(marking_results)
      // 设置按钮状态
      updateNextButtonText()

    } catch (e) {
      console.log(e)
      dialog_content.show = true
      dialog_content = dialog_content
    }
  })

  // let isExpanded = []
  // isExpanded.push(false)

  let curr_student = $state({
    index: 0,
    name: '',
    id: '',
    examinee_id: '',
    un_marked_question_count: '',
    score: '',
    total_score: '',
  })

  let title = $state("《Svelte入门实战课》2025年第1期期末考试");
  // let total_stu_count = 15;
  let unmarked_student_count = $state(0)
  let total_unmarked_question_count = $state(0)

  let submitButtonText = '下一位'
  let onNextStudentButtonText = $state('下一位')

  let single_question = $state([])
  let questions = $state([])
  // let questions = [
  //   {
  //     order_num: 12,
  //     type: "简答题",
  //     stem: "try里有一个return语句，那么紧跟在这个try后的finally里的代码会不会被执行，什么时候被执行，在return前还是后?",
  //     total_score: 10,
  //     addition: "（附加描述）",
  //     sub_question_count: 3,
  //     details: [
  //       {
  //         score: 10,
  //         content: ""
  //       },
  //       {
  //         score: 5,
  //         content: ""
  //       },
  //       {
  //         score: 6,
  //         content: ""
  //       }
  //     ],
  //     // 当前考生的作答
  //     answer: {
  //       details: [
  //         {
  //           index: 1,
  //           content: "",
  //         }
  //       ]
  //     },
  //     marked_score: ['', '', ''], // 批改的分数''表示尚未批改
  //     mark_role: "批改规则",
  //     standard_answer: "答案",
  //     is_mark_role_expanded: true,
  //     is_standard_answer_expanded: true,
  //   },
  //   {
  //     order_num: 13,
  //     type: "简答题",
  //     stem: "try里有一个return语句，那么紧跟在这个try后的finally里的代码会不会被执行，什么时候被执行，在return前还是后?",
  //     total_score: 10,
  //     addition: "（每空7分）",
  //     sub_question_count: 1,
  //     details: [
  //       {
  //         score: 10,
  //         content: ""
  //       }
  //     ],
  //     answer: {
  //       content: "try块中的return语句会立即结束try块的执行，并返回给调用者。"
  //     },
  //     marked_score: [-1], // 批改的分数-1表示未批改
  //     mark_role: "1.try块中的return语句会立即结束try块的执行，并返回给调用者。\n" +
  //       "                      2.finally块中的代码会始终被执行，无论try块中是否出现异常。\n" +
  //       "                      3.在JavaScript中，try块中的return语句会立即结束try块的执行，并返回给调用者。\n" +
  //       "                      4.finally块中的代码会始终被执行，无论try块中是否出现异常。",
  //     standard_answer: "答案",
  //     is_mark_role_expanded: true,
  //     is_standard_answer_expanded: true,
  //   }
  // ]

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

  let question_set_list = $state([])

  function saveAllMarkingScore() {
    if (!checkAllMarkingsCompleted()) {
      console.error('未完成所有批改')
      showTips('请先完成所有批改')
      return
    }

    saveMarkingScore({
      marking_results: marking_results,
      session_id: session_id
    })
      .then(res => {
        console.log(res)
        dialog_content = dialog_complete_marking
        dialog_content.show = true
      })
      .catch(e => {
        console.error(e)
        showTips('批改结果保存失败')
      })
  }

  function submitMarking() {
    // 检测当前考生批改情况
    if (!validateCurrMarkingResult(marking_results)) {
      dialog_content = dialog_content2
      dialog_content.show = true
      console.error('未批改完')
      return
    }

    let marking_result = marking_results?.find(result => result.student_id === curr_student.id)

    if (!marking_result.has_changed) {
      console.log('未修改')
    } else {

      if (isSingleExamineeMode) {
        console.log("核分模式")
        submitCheckedResults(session_id, {
          marking_results: [marking_result],
          session_id: session_id
        })
          .then(res => {
            console.log(res)
          })
          .catch(e => {
            console.error(e)
            showTips("保存核对结果失败")
          })
      } else {

        if (practice_id) {
          submitPracticeMarkingResult(practice_id, {
            marking_results: [marking_result],
          }).then(res => {
            console.log(res)
          })
            .catch(e => {
              console.error(e)
              dialog_content = dialog_content1
              dialog_content.content = '批改结果提交失败'
              dialog_content.show = true
            })
        } else {
          // 单人批改

          submitCheckedResults(session_id, {
            marking_results: [marking_result],
            session_id: session_id
          })
            .then(res => {
              console.log(res)
            })
            .catch(e => {
              console.error(e)
              dialog_content = dialog_content1
              dialog_content.content = '批改结果提交失败'
              dialog_content.show = true
            })

          // saveMarkingScore({
          //   marking_results: [marking_result],
          //   session_id: session_id
          // })
          //   .then(res => {
          //     console.log(res)
          //   })
          //   .catch(e => {
          //     console.error(e)
          //     dialog_content = dialog_content1
          //     dialog_content.content = '批改结果保存失败'
          //     dialog_content.show = true
          //   })
        }
      }

    }


    marking_result.status = '02'
    console.log(curr_student.index, markingDetails.students)
    if (curr_student.index === markingDetails.students.length - 1) {
      if (!checkAllMarkingsCompleted()) {
        // TODO 弹出提示框
        console.error('未完成所有批改')
        dialog_content = dialog_content2
        dialog_content.show = true
      }
      // TODO 结束批改，跳转到考试详情页
      console.log("批改完成")
      dialog_content = dialog_complete_marking
      dialog_content.show = true
      // onNavigateToDetails(session_id)
      return
    }

    setCurrentStudent(marking_results, 1)
  }

  function validateCurrMarkingResult(marking_results) {
    let curr_student_marking_result = marking_results?.find(result => result.student_id === curr_student.id)

    if (!curr_student_marking_result) {
      console.error(`学生 ${curr_student.id} 未找到评分结果`);
      return false;
    }

    if (!curr_student_marking_result.marks) {
      console.error(`学生 ${curr_student.id} 未找到评分结果`);
      return false
    }

    const has_unmarked = curr_student_marking_result.marks.some(mark =>
      mark.details.some(({score}) =>
        score === '' || score === -1
      )
    );
    return !has_unmarked
  }

  function initAnswerSheet(markingDetails) {
    return markingDetails.question_sets?.map(({name, score, questions}) => ({
      name,
      total_score: score,
      score: '--',
      questions: questions.map(({order_num, score: qScore}) => ({
        question_number: order_num,
        total_score: qScore,
        score: -1,
        color_style: "question-order-color-0"
      }))
    })).filter(({questions}) => questions.length > 0)
  }

  function updateAnswerSheet(question_number, score) {
    // console.log(question_number, score)
    // console.log(question_set_list)
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

  function initMarkingResults(markingDetails, questions, teacher_id) {
    let results = []

    results = markingDetails.students.map(student => ({
      student_id: student.student_id,
      examinee_id: student.examinee_id,
      status: '00',
      has_changed: false,
      marks: questions?.map(question => ({
        question_number: question.order_num,
        question_id: question.id,
        score: -1,
        marker: teacher_id,
        details: Array.from({length: question.standard_answers.length}, (_, index) => ({
          index: index,
          score: -1,
          analyze: ""
        }))
      }))

    }))


    // 加载已有批改结果
    results.forEach((result) => {
      if (markingDetails.marking_results) {
        let marking_result = markingDetails.marking_results?.find((r) => r.student_id === result.student_id || r.examinee_id === result.examinee_id)
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

  function loadStudentAnswers(examinee_id, student_id) {
    let student_answer = markingDetails.student_answers?.find((student) => student.student_id === student_id || student.examinee_id === examinee_id)

    console.log(student_answer)
    questions.forEach((question) => {
      question.answer = student_answer.answers?.find((answer) => answer.question_number === question.order_num)

    })

    questions = questions

  }

  function loadMarkingResults(examinee_id) {
    let marking_result = markingDetails.marking_results?.find((result) => result.examinee_id === examinee_id)
    if (!marking_result) {
      console.error("未找到该考生的批改结果")

      questions.forEach((question) => {
        let marking_result = marking_results?.find((result) => result.examinee_id === examinee_id)
        console.log(marking_result)

        let mark = marking_result.marks?.find((mark) => mark.question_number === question.order_num)
        if (mark) {
          console.log(mark)
          // mark.details.forEach((d, index) => {
          //   console.log(d)
          //   updateMarkingInfo(mark.question_number, index, d.score)
          // })
          updateAnswerSheet(question.order_num, mark.score)
          question.marked_score = mark.details?.map((d) => d.score === -1 ? '' : d.score)
          // question.analyze = mark.details?.map((d) => d.analyze).join(". ")
          // console.log(question.analyze)
          // console.log(question.marked_score)
        }
      })

      questions = questions

      return
    }

    questions.forEach((question) => {
      let mark = marking_result.marks?.find((mark) => mark.question_number === question.order_num)
      if (mark) {
        // console.log(mark)
        // mark.details.forEach((d, index) => {
        //   console.log(d , mark.question_number)
        //   updateMarkingInfo(mark.question_number, index, d.score)
        // })
        updateAnswerSheet(question.order_num, mark.score)
        question.marked_score = mark.details?.map((r) => r.score)
        question.analyze = mark.details?.map((d, index) => {

          return d.analyze ? `（${index + 1}）${d.analyze}`: `（${index + 1}）无`
        }).join(" ")
        // question.analyze = mark.details?.map((d, index) => `${d.analyze}`).join(". ")
        console.log(question.analyze)
      }
    })

    questions = questions

  }

  function setCurrentStudent(marking_results, offset) {
    if (curr_student.index + offset < 0 || curr_student.index + offset >= marking_results.length) {
      console.error("切换考生失败，数据错误")
      return
    }

    // console.log(marking_results[curr_student.index + offset])
    // console.log(curr_student)

    let student_id = marking_results[curr_student.index + offset].student_id
    let student_info = markingDetails.students?.find((student) => student.student_id === student_id)
    if (!student_info) {
      console.error("数据错误")
      return
    }

    let next_student = marking_results[curr_student.index + offset]

    curr_student.examinee_id = marking_results[curr_student.index + offset].examinee_id
    curr_student.name = student_info.name
    curr_student.id = student_id
    curr_student.index = curr_student.index + offset


    let curr_student_marked_count = 0;

    // 先找到当前学生
    const currentStudentResult = markingDetails.marking_results?.find(
      result => result.examinee_id === curr_student.examinee_id
    );

    if (currentStudentResult) {
      // 计算已标记的数量
      curr_student_marked_count = currentStudentResult.marks?.reduce((count, mark) => {
        // 检查 score 是否有效（不是 -1 也不是空字符串）
        if (mark.score !== -1 && mark.score !== '') {
          return count + 1;
        }
        return count;
      }, 0);
    }
    curr_student.un_marked_question_count = questions.length - curr_student_marked_count
    // console.log(curr_student)
    curr_student.score = 0
    curr_student.total_score = 0

    loadMarkingResults(curr_student.examinee_id)
    loadStudentAnswers(curr_student.examinee_id, curr_student.id)

    // 计算当前学生总分
    let total_scores = question_set_list.map((question_set) => question_set.total_score)
    curr_student.total_score = total_scores.reduce((acc, cur) => acc + cur)

    let scores = question_set_list.map((question_set) => question_set.score === '--' ? 0 : question_set.score)
    curr_student.score = scores.reduce((acc, cur) => acc + cur)
  }

  function initMarkingInfo(markingDetails) {
    total_unmarked_question_count = 0
    let marked_count = 0
    markingDetails.marking_results?.forEach((result) => {
      // 计算已批改题数
      result.marks.forEach((mark) => {
        if (mark.score !== -1 && mark.score !== '') {
          marked_count += 1
        }
      })
    })
    // console.log(marked_count)
    total_unmarked_question_count = markingDetails.students.length * questions.length - marked_count

    let marking_result = markingDetails.marking_results?.find((result) => result.student_id === curr_student.id || result.examinee_id === curr_student.examinee_id)

    let total_marked_score = 0
    marking_result?.marks?.forEach((mark) => {
      total_marked_score += mark.score
    })
    curr_student.score = total_marked_score

    // TODO
    // if (markingDetails.students.length === 1 || curr_student.index === markingDetails.students.length - 1) {
    //   submitButtonText = '提交'
    // }
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

      // curr_student.un_marked_question_count += 1
      // total_unmarked_question_count += 1
      curr_student.score = curr_student.score - pre_question_score
      return
    }

    if (score === -1 && pre_score !== -1 && getSubQuestionUnmarkedCount(mark) === 1) {
      curr_student.un_marked_question_count += 1
      total_unmarked_question_count += 1
    } else if (pre_score === -1 && getSubQuestionUnmarkedCount(mark) === 0) {
      curr_student.un_marked_question_count -= 1
      total_unmarked_question_count -= 1
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
    return mark.details.filter((detail) => detail.score === -1).length
  }

  function updateMarkingScore(mark, index, score, pre_score, pre_question_score) {
    if (typeof score !== 'number') {
      console.error("入参错误")
      return
    }

    // console.log(pre_score, pre_question_score)

    // 清空输入
    if (score === -1) {
      if (pre_score === -1) {
        return
      }

      mark.details[index].score = score

      if (pre_question_score === -1) {
        mark.score = 0
      }
      mark.score = mark.score - pre_score
      if (mark.score === 0) {
        mark.score = -1
      }
      return
    }

    if (score === pre_score) {
      return
    }

    if (pre_score === -1) {
      pre_score = 0
    }
    let delta = score - pre_score

    if (pre_question_score === -1) {
      mark.score = 0
    }
    mark.score = mark.score + delta

    mark.details[index].score = score

  }

  function onNavigateToDetails(session_id) {
    // goto(`/teacher/mark/markDetails?session_id=${session_id}`, {
    //   state: session_info
    // })

    goto(`/teacher/mark/markManagement`, {
      state: session_info
    })
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

  // 初始化题目数据，设置当前考生作答
  function initQuestions(markingDetails) {
    // TODO 参数检查
    if (!markingDetails || !markingDetails.question_sets || !markingDetails.student_answers) {
      console.error("参数错误")
      return
    }

    const [firstStudent] = markingDetails.student_answers;
    return markingDetails.question_sets.flatMap(({questions}) =>
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
        } = question

        return {
          id,
          order_num,
          total_score,
          type: question_type_to_text[type],
          stem,
          sub_question_count: details.length,
          details,
          standard_answers,
          answer: firstStudent?.answers.find(a => a.question_number === order_num),
          marked_score: Array(details.length).fill(''),
          mark_role,
          analyze: "",
          standard_answer,
          is_mark_role_expanded: true,
          is_standard_answer_expanded: true,
          is_analyze_expanded: true
        };
      })
    );
  }

  function initUnmarkedStudentCount(marking_results) {
    let count = 0
    marking_results?.forEach((result) => {
      if (result.status === '00') {
        count++
      }
    })
    return count
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

  function checkAllMarkingsCompleted() {
    return marking_results.every((result) => result.status === '02')
  }


  function onClickNavigateBack() {
    // window.history.back();
    console.log("nava----", session_info)
    // console.log(session_info.last_page_state)
    let info = JSON.parse(JSON.stringify(session_info))
    // console.log(info)
    let state = info.last_page_state
    // console.log(state)
    if (session_info.last_page && session_info.last_page === "markDetails" && state) {
      goto(`/teacher/mark/markDetails?session_id=${session_id}`, {
        state: state
      })
      return
    }

    if (session_info.last_page && session_info.last_page === "practiceMarkManagement" && state) {
      goto(`/teacher/mark/practiceMarkManagement`, {
        state: state
      })
      return
    }

    goto('/teacher/mark/markManagement')
  }

  function onInputMarkedScore(max_score, e) {
    console.log(max_score)
    if (e.target.value === '') {
      return
    }

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

  function showTips(content) {
    dialog_content1.content = content
    dialog_content1.show = true
    dialog_content = dialog_content1
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

    let pre_status = curr_student_result.status
    let pre_score = mark.details[index].score
    let pre_question_score = mark.score
    // console.log(pre_question_score)
    console.log(score, pre_score)
    updateMarkingScore(mark, index, score, pre_score, pre_question_score)
    updateMarkingInfo(mark, score, pre_score, mark.score, pre_question_score)


    updateMarkingResultState(curr_student_result)

    if (curr_student_result.status === '02' && pre_status === '00') {
      unmarked_student_count -= 1
    } else if (curr_student_result.status === '00' && pre_status === '02') {
      unmarked_student_count += 1
    }

    updateAnswerSheet(question_number, mark.score)
  }

  function onClickLastStudent() {

    if (isUnFullExamMode) {
      if (curr_student.index === 0) {
        // TODO
        setCurrentStudent(marking_results, marking_results.length - 1)
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
    if (isUnFullExamMode) {
      if (curr_student.index === marking_results.length - 1) {
        // showTips("已到最后一个考生")
        // let status = onExamModeChanged()
        //

        if (single_question[0].index === questions.length - 1) {
          console.log("已到最后一个考生")

          let {question_number, examinee_id, index} = findFirstUnMarkedQuestion(marking_results)
          if (question_number !== -1) {
            setCurrentQuestion(question_number, 0)
            return
          }

          saveAllMarkingScore()
          return
        }

        // 切换到第一个考生
        setCurrentStudent(marking_results, -(marking_results.length - 1))
        setCurrentQuestion(single_question[0].order_num, 1)
        return
      }

      setCurrentStudent(marking_results, 1)
      setCurrentQuestion(single_question[0].order_num, 0)
    } else {
      submitMarking()
    }
    updateNextButtonText()
  }

  function setCurrentQuestion(question_number, offset) {
    let pre_index = questions.findIndex((question) => question.order_num === question_number)

    if (pre_index + offset < 0 || pre_index + offset >= questions.length) {
      console.error("索引超出数组长度")
      return
    }

    single_question[0] = questions[pre_index + offset]
    single_question[0].index = pre_index + offset

  }

  let isUnFullExamMode = $state(false)
  let isSingleExamineeMode = $state(false)

  function onToggleExamMode() {
    isUnFullExamMode = !isUnFullExamMode

    onExamModeChanged()
  }

  function onExamModeChanged() {
    // 从批改结果中找出未批改完的某一道题目

    if (isUnFullExamMode) {
      let {question_number, examinee_id, index} = findFirstUnMarkedQuestion(marking_results)
      // console.log(question_number, examinee_id, index)
      if (question_number === -1) {
        // showTips("所有题目已批改完")
        setCurrentQuestion(questions[0].order_num, 0)
        return -1
      }


      // 载入题目、作答到 single_question
      setCurrentStudent(marking_results, index - curr_student.index)
      setCurrentQuestion(question_number, 0)
    }

    return 0
  }

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

    // for (const result of marking_results) {
    //   for (const mark of result.marks) {
    //     if (mark.question_number === question_number) {
    //       return {
    //         question_number,
    //         examinee_id: result.examinee_id
    //       }
    //     }
    //   }
    // }


    // 返回最小的题目编号，如果没有则返回 -1
    // return sortedQuestions.length > 0 ? sortedQuestions[0] : -1;
  }

  function updateNextButtonText() {
    if (isUnFullExamMode) {
      if (total_unmarked_question_count === 1 && curr_student.index === marking_results.length - 1 && single_question[0].index === questions.length - 1) {
        onNextStudentButtonText = '提交'
      } else {
        onNextStudentButtonText = '下一位'
      }
    } else {
      // 设置按钮状态
      if (markingDetails.students.length === 1 || curr_student.index === markingDetails.students.length - 1 || total_unmarked_question_count === 1) {
        onNextStudentButtonText = '提交'
      } else {
        onNextStudentButtonText = '下一位'
      }
    }
  }

  //操作提示开关变量
  let actionToastIsShow = $state(false);
  let actionToast = $state(null);

</script>

<header>
  <div class="header-content-container">
    <button class="navigate-back-container" on:click={onClickNavigateBack}>
      <div style="width: 24px;height: 24px">
        <image src="{icons['back']}" style="width: 24px;height: 24px"></image>
      </div>
      <p>返回</p>
    </button>
    <p class="header-title">{title}</p>
    <p class="header-content-form">总人数：</p>
    <p>{markingDetails.student_count}</p>
    <p class="header-content-form">未批改人数：</p>
    <p style="color:#0336ff">{unmarked_student_count}</p>
    <p class="header-content-form">总未批改题数：</p>
    <p style="color:#0336ff">{total_unmarked_question_count}</p>
    <div class="switch-container">
      <p>阅卷偏好：</p>
      <p style="color: #757575">逐卷模式</p>
      <Switch bind:mode={isUnFullExamMode} onToggle="{onToggleExamMode}"/>
      <p style="color: #757575">逐题模式</p>
    </div>
  </div>
</header>

<div class="page-container">
  <div class="page-body">
    <div class="mark-container {isUnFullExamMode ? 'un-full-mark-container':''}">
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
      <div class="mark-body">
        <div class="mark-list">
          {#if isUnFullExamMode}
            <Question bind:question={single_question[0]} onInputMarkedScore="{onInputMarkedScore}" bind:ai_marked={ai_marked}
                      onScoreInputBlur="{onScoreInputBlur}"></Question>
          {:else}
            {#each questions as q, i}
              <Question bind:question={questions[i]} onInputMarkedScore="{onInputMarkedScore}" bind:ai_marked={ai_marked}
                        onScoreInputBlur="{onScoreInputBlur}"></Question>
            {/each}
          {/if}
        </div>
      </div>
    </div>
    <div class="answer-sheet {isUnFullExamMode ? 'un-full-answer-sheet':''}">
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
  bind:isShow={dialog_content.show}
  title={dialog_content.title}
  content={dialog_content.content}
  confirmText={dialog_content.confirmText}
  cancelText={dialog_content.cancelText}
  confirmTextBackgroundColor={dialog_content.confirmTextBackgroundColor}
  onConfirm={dialog_content.onConfirm}
  onCancel={dialog_content.onCancel}
/>

<ActionToast
  bind:isShow={actionToastIsShow}
  type="success"
  message="保存成功"
  duration={2000}
  bind:this={actionToast}
/>

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
        position: relative;
    }

    .header-content-container p {
        line-height: 45px;
    }

    .switch-container {
        position: absolute;
        right: 0;
        display: flex;
        align-items: center;
        gap: 10px;
    }

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

    input {
        -moz-appearance: textfield;
    }

    input::-webkit-inner-spin-button,
    input::-webkit-outer-spin-button {
        -webkit-appearance: none;
        margin: 0;
    }

    text {
        font-size: 14px;
    }

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