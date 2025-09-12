<!-- /*
 * @Author: OuYang Haobin 1242968386@qq.com
 * @Date: 2025-04-14 11:15:25
 * @LastEditors: OuYang Haobin 1242968386@qq.com
 * @LastEditTime: 2025-04-30 15:35:13
 * @FilePath: /tutorial-platform-fe/src/lib/component/QuestionAnswer/answer.svelte
 * @Description: 考试答题组件
 */ -->

<script>
  import RichTextEditor from '@3min/smart-edit';
  import Option from './option.svelte';
  import { onMount } from 'svelte';
  import { Answer, getAnswerFilesPath } from './utils';
  import { createUploadHandler } from './uploadHandler.js';
  import { QUESTION_TYPES } from './constants.js';

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
   */

  // 配置项
  const editor_width = '100%';
  const uploadHandler = createUploadHandler('/exam_answer');

  // 组件属性
  let { question = $bindable(), ifPreview, query_url, saveAnswer, editor_height ,exam_id,exam_session_id,examinee_id,practice_id,practice_submission_id} = $props();

  // 状态管理
  let question_id = $state(question.ID);
  let student_answer = $state({ answer: initialAnswer(question) });

  /**
   * 富文本编辑器组件实例
   * @type {Array<any | null>}
   */
  let rich_text_editors = $state(Array(question.Answer_num || 1).fill(null));

  /**
   * 初始化答案类型
   * @param {Question} question
   * @returns {Array} 初始化的答案数组
   */
  function initialAnswer(question) {
    switch (question.Type) {
      case QUESTION_TYPES.SINGLE_CHOICE: // "00"
        return [];
      case QUESTION_TYPES.MULTIPLE_CHOICE: // "02"
        return [];
      case QUESTION_TYPES.TRUE_FALSE: // "04"
        return [];
      case QUESTION_TYPES.ESSAY: // "08"
        return Array(question.Answer_num || 1).fill(''); // 简答题，初始化为空字符串数组
      case QUESTION_TYPES.FILL_BLANK: // "06"
        return Array(question.Answer_num || 1).fill('');
      default:
        return [];
    }
  }

  // 生命周期钩子
  onMount(async () => {
    await getStudentAnswer();
  });

  $effect(() => {
    question.Answer = student_answer.answer;
    if (question.ID != question_id) {
      question_id = question.ID;
      getStudentAnswer();
    }
  });

  /**
   * 为每个编辑器生成独立的配置
   * @param {number} index 编辑器索引
   * @returns {Object} 编辑器配置
   */
  function getEditorOptions(index) {
    return {
      autoFocus: false,
      editable: !ifPreview,
      content: '',
      table: { overflow: false },
      image: {
        inline: true,
        uploadFormName: 'image',
        uploader: uploadHandler,
        sizeLimit: 30,
      },
      video: {
        inline: true,
        uploadFormName: 'video',
        uploader: uploadHandler,
        defaultSize: 30,
        sizeLimit: 30,
      },
      attachment: {
        inline: true,
        uploadFormName: 'attachment',
        uploader: uploadHandler,
        sizeLimit: 30,
      },
      link: { protocols: [] },
      audio: {
        inline: true,
        uploadFormName: 'audio',
        uploader: uploadHandler,
        sizeLimit: 30,
      },
      onContentChange: handleContentChange(index),
    };
  }

  /**
   * 创建内容变更处理函数
   * @param {number} index 编辑器索引
   * @returns {Function} 内容变更处理函数
   */
  function handleContentChange(index) {
    return (/** @type {any} */ editor) => {
      if (ifPreview) return;

      if (rich_text_editors[index]) {
        const editor_text = rich_text_editors[index].getHTML();

        setTimeout(async () => {
          // 仅当内容不一样的时候才发送修改请求
          if (editor_text != student_answer.answer[index]) {
            student_answer.answer[index] = editor_text;

            // 构建答案数据并保存
            const answer = {
              //         question_id: Number(question.Id),
              answer: student_answer.answer,
              //         type: question.Type,
            };

            // 获取作答中的文件路径
            const attachment_paths = getAnswerFilesPath(answer);
            await saveAnswer(answer, question, false, attachment_paths);
          }
        }, 1000);
      }
    };
  }

  /**
   * 获取学生题目的答题情况
   */
  async function getStudentAnswer() {
    if (ifPreview) return;

    
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
        resetAndSaveEmptyAnswer();
        return;
      }

      const data = await res.json();

      if (data.status !== 0) {
        if (data.status === -10) {
          resetAndSaveEmptyAnswer();
        }
        return;
      }

      // 处理成功响应
      const answer = data.data.Answer;

      if (Object.keys(answer).length !== 0) {
  // 有答案数据，更新状态（保证为数组或题型期望的初始值）
  student_answer.answer = Array.isArray(answer.answer) ? answer.answer : initialAnswer(question);

        // 对于填空题和简答题，需要更新富文本编辑器内容
        if (question.Type === QUESTION_TYPES.FILL_BLANK || question.Type === QUESTION_TYPES.ESSAY) {
          updateRichTextEditors();
        }
      } else {
        // 无答案数据，初始化并保存空答案
        resetAndSaveEmptyAnswer();
      }
    } catch (e) {
      resetAndSaveEmptyAnswer();
    }
  }

  /**
   * 更新富文本编辑器内容
   */
  async function updateRichTextEditors() {
    student_answer.answer.forEach(async (item, index) => {
      if (rich_text_editors[index]) {
        await rich_text_editors[index].waitEditorReady();
        rich_text_editors[index].setContent(item);
      }
    });
  }

  /**
   * 重置并保存空答案
   */
  async function resetAndSaveEmptyAnswer() {
    student_answer.answer = initialAnswer(question);
    const answer = {
      //   question_id: Number(question.Id),
      answer: student_answer.answer,
      //    type: question.Type,
    };
    await saveAnswer(answer, question, false, []);
  }

  /**
   * 处理单选题、判断题
   * @param {string} question_id 题目ID
   * @param {string} option_id 选项ID
   */
  async function handleOptionSelect(question_id, option_id) {
    if (ifPreview) return;

    // 单选题只保留一个选项
    student_answer.answer = [option_id];

    // 创建并保存答案
    await createAndSaveAnswer(question_id);
  }

  /**
   * 处理多选题
   * @param {string} question_id 题目ID
   * @param {string} option_id 选项ID
   */
  async function handleMultiOptionSelect(question_id, option_id) {
    if (ifPreview) return;

    // 初始化答案数组（如果不存在）
    if (!student_answer.answer || !Array.isArray(student_answer.answer)) {
      student_answer.answer = [];
    }

    // 切换选项状态（选中/取消选中）
    if (!student_answer.answer.includes(option_id)) {
      student_answer.answer.push(option_id);
    } else {
      student_answer.answer = student_answer.answer.filter((id) => id !== option_id);
    }

    // 创建并保存答案
    await createAndSaveAnswer(question_id);
  }

  /**
   * 创建并保存答案
   * @param {string} question_id 题目ID
   */
  async function createAndSaveAnswer(question_id) {
    const answer = {
      //    question_id: Number(question_id),
      answer: student_answer.answer,
      //    type: question.Type,
    };

    await saveAnswer(answer, question, false, []);
  }
</script>

<div class="layout">
  <!-- 单选题 -->
  <!-- 判断题 -->
  {#if question.Type === QUESTION_TYPES.SINGLE_CHOICE || question.Type === QUESTION_TYPES.TRUE_FALSE}
    <div class="options">
      {#each question.Options as option}
        <label class="option">
          <input
            type="radio"
            name="question-{question.ID}"
            value={option.label}
            checked={student_answer.answer?.includes(option.label)}
            onchange={() => handleOptionSelect(question.ID, option.label)}
            class="hidden-radio"
            disabled={ifPreview}
          />
          <span class="option-id">{option.label}</span>
          <Option {option} />
        </label>
      {/each}
    </div>
    <!-- 多选题 -->
  {:else if question.Type === QUESTION_TYPES.MULTIPLE_CHOICE}
    <div class="options">
      {#each question.Options as option}
        <label class="option">
          <input
            type="checkbox"
            name="question-{question.ID}"
            value={option.label}
            checked={student_answer.answer?.includes(option.label)}
            onchange={() => handleMultiOptionSelect(question.ID, option.label)}
            class="hidden-radio"
            disabled={ifPreview}
          />
          <span class="option-id-multiple">{option.label}</span>
          <Option {option} />
        </label>
      {/each}
    </div>
    <!-- 简答题 -->
  {:else if question.Type === QUESTION_TYPES.ESSAY}
    {#each Array(question.Answer_num) as _, index}
      <div class="fill-blank">
        {#if question.Answer_num > 1}
          <div class="question-id">（{index + 1}）</div>
        {/if}

        <div class="rich-text-editor">
          <RichTextEditor
            bind:this={rich_text_editors[index]}
            width={editor_width}
            height={editor_height}
            editor_options={getEditorOptions(index)}
          />
        </div>
      </div>
    {/each}
  {/if}
</div>

<style scoped lang="scss">
  // 布局与容器
  .layout {
    max-width: 100%;
    width: 100%;
  }

  .rich-text-editor {
    width: 95%;
    max-width: 95%;
    flex-grow: 0;
    flex-shrink: 0;
  }

  .options {
    display: flex;
    flex-direction: column;
    gap: 15px;
  }

  .fill-blank {
    display: flex;
    justify-content: flex-start;
    align-items: center;
    width: 100%;
    max-width: 100%;
    margin-bottom: 15px;
  }

  .question-id {
    width: 5%;
    max-width: 5%;
    font-size: 14px;
  }

  // 选项样式
  .option {
    display: flex;
    align-items: center;
    cursor: pointer;
    padding: 10px;
    border-radius: 4px;
    transition: background-color 0.2s;

    &:hover {
      background-color: #f0f7ff;
    }

    input {
      margin-right: 10px;
    }

    // 单选选项样式
    .option-id {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 30px;
      min-width: 30px;
      height: 30px;
      text-align: center;
      border-radius: 50%;
      background-color: white;
      border: 1px solid #797979;
      margin-right: 10px;
      font-size: 16px;
    }

    // 多选选项样式
    .option-id-multiple {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 30px;
      min-width: 30px;
      height: 30px;
      text-align: center;
      background-color: white;
      border: 1px solid #797979;
      margin-right: 10px;
      font-size: 16px;
      border-radius: 8px;
    }

    // 选中状态样式
    input:checked + .option-id,
    input:checked + .option-id-multiple {
      background-color: #e8f3ff;
      border: 1px solid #165dff;
      color: #165dff;
    }
  }

  // 辅助样式
  .hidden-radio {
    display: none;
  }
</style>
