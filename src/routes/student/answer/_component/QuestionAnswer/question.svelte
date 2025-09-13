<!-- /*
 * @Author: OuYang Haobin 1242968386@qq.com
 * @Date: 2025-04-14 11:01:03
 * @LastEditors: OuYang Haobin 1242968386@qq.com
 * @LastEditTime: 2025-04-30 15:42:39
 * @FilePath: /tutorial-platform-fe/src/lib/component/QuestionAnswer/question.svelte
 * @Description: 题目显示组件
 */ -->

<script>
  import { onMount } from 'svelte';
  import Answer from './answer.svelte';
  import '@3min/cst-tiptap/dist/style.css';

  const max_input_len = 100;

  let { question = $bindable(), index, ifPreview, saveAnswer, query_url, editor_height, exam_id, exam_session_id, examinee_id, practice_id, practice_submission_id } = $props();

  // 绑定当前题干容器，用于局部查找 input
  let contentWrapper;

  // 获取学生题目的答题情况
  async function getStudentAnswer() {
    if (ifPreview) {
      console.log('当前为预览模式');
      return;
    }
    if (!contentWrapper) {
      return;
    }

    // 1. 先尝试从 localStorage 读取（优先考试 key，其次 practice key）
    try {
      const examId = exam_id || 'preview';
      const examSession = exam_session_id || 'preview';
      // examinee id 不从 URL 获取，默认为 preview
      const examinee = examinee_id || 'preview';
      const examStorageKey = `exam_answers_${examId}_${examSession}_${examinee}`;
      let raw = localStorage.getItem(examStorageKey);

      // practice key：仅使用传入的 props，不再从 URL 回退
      const pid = practice_id || 'preview';
      const psid = practice_submission_id || 'preview';
      const practiceStorageKey = `practice_answers_${pid}_${psid}`;

      if (!raw) raw = localStorage.getItem(practiceStorageKey);

      if (raw) {
        const storedAnswers = JSON.parse(raw || '{}');
        const entry = storedAnswers[String(question.ID)];
        if (entry && entry.answer !== undefined) {
          student_answer.answer = Array.isArray(entry.answer) ? entry.answer : initialAnswer(question);
          if (question.Type === QUESTION_TYPES.FILL_BLANK || question.Type === QUESTION_TYPES.ESSAY) {
            await updateRichTextEditors();
          }
          return; // 命中 localStorage，直接返回
        }
      }
    } catch (e) {
      console.warn('读取本地答案失败，继续后续逻辑', e);
    }

    // 2. 父组件已把后端 StudentAnswer 放到 question.Answer 时，优先写入 localStorage 并初始化组件
    if (question && Array.isArray(question.Answer)) {
      const ansArr = Array.isArray(question.Answer) ? question.Answer : initialAnswer(question);
      const hasRealValue = ansArr.length > 0 && !ansArr.every((v) => v === '' || v === null || v === undefined);

      try {
        const finalPid = practice_id || 'preview';
        const finalPsid = practice_submission_id || 'preview';
        const storageKey = `practice_answers_${finalPid}_${finalPsid}`;

        // 读取并合并写回 localStorage（只写本地，不触发后端保存）
        let stored = {};
        try {
          const raw = localStorage.getItem(storageKey);
          stored = raw ? JSON.parse(raw) : {};
        } catch (e) {
          stored = {};
        }

        // 如果本地已有非空答案且后端返回为空，则不覆盖本地答案
        const existing = stored[String(question.ID)];
        const existingHasValue =
          existing &&
          Array.isArray(existing.answer) &&
          !(existing.answer.length === 0 || existing.answer.every((v) => v === '' || v === null || v === undefined));

        if (!existingHasValue || hasRealValue) {
          stored[String(question.ID)] = {
            answer: ansArr,
            attachment_paths: existing?.attachment_paths || [],
            updated_at: Date.now(),
          };
          localStorage.setItem(storageKey, JSON.stringify(stored));
        }
      } catch (e) {
        console.warn('写入本地答案失败', e);
      }

      // 初始化组件状态并更新编辑器
      student_answer.answer = ansArr;
      if (question.Type === QUESTION_TYPES.FILL_BLANK || question.Type === QUESTION_TYPES.ESSAY) {
        await updateRichTextEditors();
      }
      return;
    }


    if (!query_url) {
      // query_url 为空时不发请求
      return;
    }
    try {
      const res = await fetch(`${query_url}&question_id=${question.ID}`, {
        method: 'GET',
        credentials: 'include',
      });

      if (!res.ok) {
        console.log('获取答题情况失败');
        return;
      }

      const data = await res.json();

      if (data.status !== 0) {
        console.log('获取答题情况失败:', data.msg);

        // -10 表示没有作答记录，补空答案
        if (data.status === -10) {
          let answer = {
            question_id: Number(question.ID),
            answer: Array(inputs.length).fill(''),
            type: question.Type,
          };
          await saveAnswer(answer, question, false, []);
        }
        return;
      }

      // status === 0，获取成功
      const answer = data.data.Answer.answer;

      // console.log("获取填空题答题情况成功:", answer);

      if (Array.isArray(answer) && answer.length > 0) {
        // 只在当前组件下查找 input

        inputs.forEach((input, index) => {
          if (answer[index] !== undefined) {
            input.value = answer[index];
          }
        });
      } else {
        // 后端返回的是空数组，也需要存入空答案
        let answer = {
          question_id: Number(question.ID),
          answer: Array(inputs.length).fill(''),
          type: question.Type,
        };
        await saveAnswer(answer, question, false, []);
      }
    } catch (e) {
      console.log('获取答题情况失败:', e);
    }
  }


  function replaceSpansWithLines(htmlString) {
    if (htmlString === null || htmlString === undefined || htmlString === "") return "";
    const parser = new DOMParser();
    const doc = parser.parseFromString(htmlString, 'text/html');
    const spans = doc.querySelectorAll('span.blank-item');

    spans.forEach(span => {
      const blankNumber = span.getAttribute('blanknumber') || '';
      const id = span.id || '';

      const input = doc.createElement('input');
      input.type = 'text';
      input.className = 'blank-item-input';
      input.maxLength = typeof max_input_len === 'number' ? max_input_len : 100;
      if (id) input.id = id;
      if (blankNumber) input.setAttribute('data-blank-number', blankNumber);
      input.placeholder = span.textContent || '';
      // 基本样式（与之前创建 input 的样式一致）
      input.style.width = '80px';
      input.style.minWidth = '80px';
      input.style.textAlign = 'center';
      input.style.border = 'none';
      input.style.borderBottom = '1px solid black';
      input.style.outline = 'none';
      input.style.boxSizing = 'content-box';
      input.style.padding = '0';
      input.style.margin = '0';
      input.style.fontSize = '16px';

      span.replaceWith(input);
      

    });
    
    return doc.body.innerHTML;
  }

  onMount(async () => {
    if (question.Type !== '06') return;
    question.Content = replaceSpansWithLines(question.Content); // 替换括号为输入框

    // 在DOM渲染后，为所有input添加事件监听器
    setTimeout(async () => {
      if (contentWrapper) {
        await getStudentAnswer(); // 渲染完后填充答案
        const inputs = contentWrapper.querySelectorAll('input.blank-item-input');
        inputs.forEach((input) => {
          const mirror = document.createElement('span');
          mirror.style.visibility = 'hidden';
          mirror.style.position = 'absolute';
          mirror.style.whiteSpace = 'pre';
          mirror.style.font = 'inherit';
          mirror.style.padding = '0';
          mirror.style.margin = '0';
          mirror.style.border = 'none';
          mirror.style.width = 'fit-content';
          document.body.appendChild(mirror);

          // 调整输入框宽度
          const adjustWidth = () => {
            mirror.textContent = input.value || '_';
            input.style.width = mirror.offsetWidth + 'px';
          };

          adjustWidth(); // 初始调用一次

          input.addEventListener('input', async () => {
            adjustWidth();
            const allInputs = contentWrapper.querySelectorAll('input.blank-item-input');
            const combinedAnswer = Array.from(allInputs).map((el) => el.value.trim());
            question.Answer = combinedAnswer;

            const answer = {
              question_id: Number(question.ID),
              answer: combinedAnswer,
              type: question.Type,
            };

            await saveAnswer(answer, question, false, []); // 保存答案
          });
        });
      } else {
        console.log('没有找到题干容器');
      }
    }, 0);
  });

  $effect(() => {
    if (question.Type === '06') {
      getStudentAnswer(); // 渲染完后填充答案
    }
  });
</script>

<div class="question">
  <div class="question-content">
    {#if index !== null && index !== undefined}
      <h2>{index + 1}.</h2>
      {#if question.Score !== undefined}
        <span class="question-score-inline">（{question.Score}分）</span> 
      {/if}
    {/if}
    <div class="piptap-content" style="width: 80%;" bind:this={contentWrapper}>
      {@html question.Content}
    </div>
  </div>

  {#if question.Type !== '06'}
    <Answer bind:question {ifPreview} {saveAnswer} {query_url} {editor_height} {exam_id} {exam_session_id} {examinee_id} {practice_id} {practice_submission_id} />
  {/if}
</div>

<style scoped lang="scss">
  .question {
    background-color: #fff;
    border-radius: 8px;
    margin-bottom: 50px;
    width: 100%;
    min-width: 100%;
    max-width: 100%;
  }
  

  .question-score-inline {
    color: #ff7e08;
    font-weight: bold;
    font-size: 15px;
  }

  .question-content {
    display: flex;
    padding-bottom: 10px;

    h2 {
      font-weight: 500;
      margin-right: 10px;
      font-size: 16px;
    }
  }
    .quesion-answer {
    max-width: 100%;
    width: 100%;
  }
</style>
