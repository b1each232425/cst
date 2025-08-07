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
  import Button from '$lib/components/Button/Button.svelte';
  import { onMount } from 'svelte';
  import MessageBox from '$lib/components/MessageBox/MessageBox.js';
  import { page } from '$app/state';
  import { get } from 'svelte/store';
  import { sharedData } from '../_stores/index';
  import QuestionGradingSection from './_components/QuestionGradingSection.svelte';

  const mockData = {
    question_sets: [
      {
        ID: 111,
        Order: '1',
        Score: '10',
        Name: '题组题目1',
        Questions: [
          {
            ID: 2001,
            Order: 1,
            Score: '10',
            Type: '00', // 单选题
            Answers: [
              {
                index: 0,
                score: 10,
                answer: 'A',
                grading_rule: 'exact',
                alternative_answer: 'a',
              },
            ],
            GroupID: 1001,
            Content: '以下哪个是 JavaScript 的关键字？',
          },
          {
            ID: 2002,
            Order: 2,
            Score: '10',
            Type: '00', // 单选题
            Answers: [
              {
                index: 0,
                score: 10,
                answer: 'A',
                grading_rule: 'exact',
                alternative_answer: 'a',
              },
            ],
            GroupID: 1001,
            Content: '以下哪个是 JavaScript 的关键字？',
          },
        ],
      },
      {
        ID: 212,
        Order: '2',
        Score: '20',
        Name: '题组题目2',
        Questions: [
          {
            ID: 2002,
            Order: 1,
            Score: '20',
            Type: '06', // 填空题
            Answers: [
              {
                index: 0,
                score: 10,
                answer: 'function',
                grading_rule: 'exact',
                alternative_answer: null,
              },
              {
                index: 1,
                score: 10,
                answer: 'const',
                grading_rule: 'exact',
                alternative_answer: null,
              },
            ],
            GroupID: 1002,
            Content: '请填空：______ 用于定义函数，______ 用于定义常量。',
          },
        ],
      },
    ],
    student_answers: [
      {
        QuestionID: 2001,
        ExamineeID: 3001,
        PracticeSubmissionID: 4001,
        Answer: ['A'],
      },
      {
        QuestionID: 2002,
        ExamineeID: 3001,
        PracticeSubmissionID: 4001,
        Answer: ['function', 'const'],
      },
    ],
    examinee_infos: [
      {
        ID: '3001',
        OfficialName: '张三',
        SerialNumber: 1,
      },
    ],
    marking_results: [
      [
        {
          TeacherID: 9001,
          ExamineeID: 3001,
          ExamSessionID: 6001,
          PracticeID: 7001,
          PracticeSubmissionID: 4001,
          QuestionID: 2001,
          MarkDetails: [
            {
              Index: 0,
              Score: 10,
              Analyze: '选择正确',
            },
          ],
          Score: 10,
        },
        {
          TeacherID: 9001,
          ExamineeID: 3001,
          ExamSessionID: 6001,
          PracticeID: 7001,
          PracticeSubmissionID: 4001,
          QuestionID: 2002,
          MarkDetails: [
            {
              Index: 0,
              Score: 10,
              Analyze: '填空正确',
            },
            {
              Index: 1,
              Score: 10,
              Analyze: '填空正确',
            },
          ],
          Score: 20,
        },
      ],
    ],
  };

  // 题型映射
  const QUESTION_TYPE_MAP = {
    '00': '单选题',
    '02': '多选题',
    '04': '判断题',
    '06': '填空题',
    '08': '简答题',
    '10': '编程题',
  };

  let correct_item_by_item = $state(false); // TODO是否出现闪烁？

  let exam_session_id = $state(0);
  let practice_id = $state(0);

  let question_sets = $state([...mockData.question_sets]); // 题组
  let student_answers = $state([]); // 学生信息
  let examinee_infos = $state([]); // 考生信息
  let marking_results = $state([]); // 历史批改结果

  // 当前 fetch参数
  let current_id_type = $derived(() => {
    if (exam_session_id) return 'exam_session_id';
    if (practice_id) return 'practice_id';
  });

  function goBack() {
    history.back();
  }

  function handleClickSwitchButton() {
    correct_item_by_item = !correct_item_by_item;
    localStorage.setItem('correctItemByItem', correct_item_by_item);
  }

  // 检查参数，判断是考试还是练习，然后发起请求
  function checkQueriesAndGetData() {
    exam_session_id = page.url.searchParams.get('exam_session_id');
    practice_id = page.url.searchParams.get('practice_id');

    // 都是空 || 都不是空
    if ((!exam_session_id && !practice_id) || (exam_session_id && practice_id)) {
      showError(); // 报错，终止对改页面的操作
      return;
    }

    const id = exam_session_id ?? practice_id;

    fetch(`/api/mark/details?${current_id_type}=${id}`)
      .then((res) => {
        if (!res.ok)
          return res.text().then((error_text) => {
            throw new Error(`请求失败：${res.status} ${res.statusText}` + (error_text ? '-' + error_text : ''));
          });
        return res.json();
      })
      .then((res) => {
        if (!res.status) {
          question_sets = res.data?.question_sets ?? []; // 不会吞错误
          student_answers = res.data?.student_answers ?? [];
          examinee_infos = res.data?.examinee_infos ?? [];
          marking_results = res.data?.marking_results ?? [];
        } else throw new Error(res.msg ?? '获取批改信息失败');
      })
      .catch((err) => {
        showError(err.message); // 获取数据失败也会终止对改页面的操作
      });
  }

  // 展示错误弹窗
  function showError(content = '页面信息出错，点击返回') {
    MessageBox({
      title: '出错啦',
      content: content,
      show_cancel_button: false,
      onConfirm: () => goBack(),
      onCancel: () => goBack(),
    });
  }

  onMount(() => {
    correct_item_by_item = localStorage.getItem('correctItemByItem') ?? false;

    // checkQueriesAndGetData();
  });
</script>

<div class="correct">
  <!-- 顶部信息与按钮 -->
  <div class="header">
    <div class="left-header">
      <button onclick={goBack}>← 返回</button>
      <!-- TODO 持久化 -->
      <div class="name">{$sharedData?.exam_session_name}</div>
      <div class="info"><span>总人数:</span><span class="data"> {examinee_infos.length}</span></div>
      <div class="info"><span>未批改数:</span><span class="data"> {1}</span></div>
      <div class="info"><span>总未批改题数:</span><span class="data"> {1}</span></div>
    </div>
    <div class="hobby">
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
    <div class="card correction">
      <!-- 批改顶部信息、按钮 -->
      <div class="correction-header">
        <div class="info">
          <div>当前考生：</div>
          <div>未批改题数：</div>
          <div>当前得分：</div>
        </div>
        <div class="options">
          <Button type="info" plain>上一位</Button>
          <Button>下一位</Button>
        </div>
      </div>

      <!-- 批改主内容 -->
      <div class="correction-content">
        {#each question_sets as question_set (question_set.ID)}
          <div class="question-set">
            <div class="question-set-name">
              {question_set.Order}. <span class="question-set-bracket">【</span>{question_set.Name}<span
                class="question-set-bracket">】</span
              >({question_set.Score}分)
            </div>
            {#each question_set.Questions as question}
              <QuestionGradingSection {question} />
            {/each}
          </div>
        {/each}
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
      {#each question_sets as question_set}
        <div class="question-scores">
          <div class="scores-header">{question_set.Name} (--分/{question_set.Score}分)</div>
          <div class="scores">
            {#each question_set.Questions as question}
              <div class="scores-item">{question.Order}</div>
            {/each}
          </div>
        </div>
      {/each}
    </div>
  </div>
</div>

<style lang="scss">
  @mixin flex-css {
    display: flex;
    justify-content: center;
    align-items: center;
  }

  button {
    all: unset;
    cursor: pointer;
  }

  .correct {
    background-color: #eff0f2;
    height: 100vh;

    .header {
      display: flex;
      justify-content: space-between;
      padding: 1rem 3rem;
      flex-wrap: wrap;
      background-color: white;

      .left-header {
        @include flex-css;
        gap: 1rem;

        .name {
          @include flex-css;
          font-weight: 400;
          font-size: 1.2rem;
        }

        .info {
          @include flex-css;
          gap: 0.5rem;

          span {
            color: rgba(0, 0, 0, 0.7);

            &.data {
              font-size: 1.1rem;
              display: flex;
              align-items: center;
              justify-content: center;
            }
          }
        }
      }

      .hobby {
        @include flex-css;
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

          .info,
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
        }
      }

      .overview {
        background-color: white;
        width: 20%;

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
            color: #919191;
          }

          .right {
            color: #00e343;
          }

          .incorrect {
            color: #ff0000;
          }

          .partial {
            color: #ff9500;
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
          }

          .scores {
            display: flex;
            justify-content: left;
            gap: 1rem;

            .scores-item {
              @include flex-css;
              border: 1px solid #ccc;
              width: 2rem;
              height: 2rem;
              border-radius: 5px;
            }
          }
        }
      }
    }
  }
</style>
