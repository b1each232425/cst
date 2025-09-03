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

  let { question = $bindable(), index, ifPreview, saveAnswer, query_url, editor_height } = $props();

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

    // 先尝试从 localStorage 读取本题答案（优先使用考试专用 key，其次使用练习 key）
    try {
      // 尝试考试 key
      let exam_id_from_url = 'preview';
      let exam_session_id_from_url = 'preview';
      let examinee_id_from_url = 'preview';
      try {
        const pageParams = new URLSearchParams(window.location.search);
        exam_id_from_url = pageParams.get('exam-id') || exam_id_from_url;
        exam_session_id_from_url = pageParams.get('exam-session-id') || exam_session_id_from_url;
        examinee_id_from_url = pageParams.get('examinee-id') || examinee_id_from_url;
      } catch (e) {}

      const examStorageKey = `exam_answers_${exam_id_from_url}_${exam_session_id_from_url}_${examinee_id_from_url}`;
      let raw = localStorage.getItem(examStorageKey);

      // 若未命中考试 key，再尝试 practice key
      if (!raw) {
        let practice_id = 'preview';
        let practice_submission_id = 'preview';
        try {
          const pageParams2 = new URLSearchParams(window.location.search);
          practice_id = pageParams2.get('practice-id') || pageParams2.get('practice_id') || practice_id;
          practice_submission_id = pageParams2.get('practice_submission_id') || practice_submission_id;
        } catch (e) {}
        if ((practice_id === 'preview' || practice_submission_id === 'preview') && query_url) {
          const params = new URLSearchParams((query_url || '').split('?')[1] || '');
          practice_submission_id = params.get('practice_submission_id') || practice_submission_id;
          practice_id = params.get('practice_id') || practice_id;
        }
        const practiceStorageKey = `practice_answers_${practice_id}_${practice_submission_id}`;
        raw = localStorage.getItem(practiceStorageKey);
      }

      if (raw) {
        const storedAnswers = JSON.parse(raw || '{}');
        const entry = storedAnswers[String(question.ID)];
        if (entry && Array.isArray(entry.answer)) {
          const inputs = contentWrapper.querySelectorAll('input.blank-item-input');
          inputs.forEach((input, idx) => {
            if (entry.answer[idx] !== undefined) input.value = entry.answer[idx];
          });
          question.Answer = entry.answer;
          return; // 有本地答案则直接返回
        }
      }
    } catch (e) {
      console.warn('读取本地答案失败，继续请求后端', e);
    }
    console.log('尝试从后端获取答案');

    const inputs = contentWrapper.querySelectorAll('input.blank-item-input');
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
    <Answer bind:question {ifPreview} {saveAnswer} {query_url} {editor_height} />
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
    align-items: center;
    padding-bottom: 10px;

    h2 {
      font-weight: 500;
      font-size: 16px;
    }

    .question-score-inline {
      color: #ff7e08;
      font-weight: bold;
      font-size: 15px;
    }

    .piptap-content {
      width: 80%;
      text-align: justify;
    }
  }
</style>
