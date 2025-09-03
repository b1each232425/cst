<!--
 * @Author: MIOZD && l317101@163.com
 * @Date: 2025-04-10 18:38:11
 * @LastEditors: MIOZD && l317101@163.com
 * @LastEditTime: 2025-05-24 17:44:19
 * @FilePath: 
 * @Description: 题目编辑面板
 * @
-->
<script>
  import QuestionTag from '$lib/components/Tag/EditableTag.svelte';
  import SmartEditor from '@3min/smart-edit';

  /**
   * @typedef {import('@3min/cst-tiptap/dist/types').PiptapEditor} PiptapEditor
   * @typedef {import('@3min/cst-tiptap/dist/types').PiptapEditorOptions} PiptapEditorOptions
   */

  import { TheoryQuestion } from '../theory/type';
  import { formatTimestamp } from '$lib/utils/time_utils';
  import QuestionPreviewPanel from './QuestionPreviewPanel.svelte';

  import { questionLimit } from '../utils/questionConfig.js';
  

  const editor_width = 'calc(100% - 24px - 10px)';
  const editor_height = '100%';

  /**
   * 富文本编辑器配置项
   * @typedef {import('@3min/cst-tiptap/dist/types').PiptapEditorOptions} PiptapEditorOptions
   * @type {Partial<PiptapEditorOptions>}
   */
  const editor_options = {
    editable: true,
    content: '这是一个编辑器',
    table: {
      overflow: false,
    },
    link: {
      protocols: [],
    },
    image: {
      inline: true,
      uploadFormName: 'image',
      sizeLimit: 100,
    },
    video: {
      inline: true,
      uploadFormName: 'video',
      sizeLimit: 100,
    },
    audio: {
      inline: true,
      uploadFormName: 'audio',
      sizeLimit: 100,
    },
    attachment: {
      inline: true,
      uploadFormName: 'attachment',
      sizeLimit: 1024,
    },
  };

  /**
   * @type {{
   *      show:boolean                                // 编辑面板是否显示
   *      is_new_question?:boolean                    // 是否为新增题目
   *      question_data?:TheoryQuestion               // 题目数据
   *      onCancel:()=>void                           // 取消编辑函数
   *      onConfirm:(data:Partial<TheoryQuestion>)=>void       // 确认编辑函数
   * }}
   */
  let { show, is_new_question, question_data, onCancel, onConfirm } = $props();

  const ICON = {
    radioButton_disabled: '/theory_question_bank/icons/radioButton_disabled.svg',
    radioButton_selected: '/theory_question_bank/icons/radioButton_selected.svg',
    radioButton_unselect: '/theory_question_bank/icons/radioButton_unselect.svg',
    delete: '/theory_question_bank/icons/delete.svg',

    checkbox_selected_green: '/theory_question_bank/icons/checkbox_selected_green.svg',
    checkbox_unselect: '/theory_question_bank/icons/checkbox_unselect.svg',

    delete_bin: '/theory_question_bank/icons/delete_bin.svg',
    arrow_down: '/theory_question_bank/icons/arrow_down.svg',
    Xacross_grey: '/theory_question_bank/icons/Xacross_grey.svg',
  };

  /**
   * @description 是否已初始化
   * @type {boolean}
   */
  let initialized = $state(false);

  /**
   * @description 题目类型
   */
  let question_type = '08';

  /**
   * @description 题目编辑的富文本编辑器组件实例
   * @type {SmartEditor|null}
   */
  let title_editor = $state(null);

  /**
   * @description 题目题干
   */
  let question_title_content = $state('');

  /**
   * @description 题目编辑器的警告状态
   * @type {number}
   */
  let title_editor_warning = $state(0);

  /**
   * @description 题目难度选项
   * @type {number}
   */
  let question_difficulty = $state(1);

  /**
   * @description 题目标签
   * @type {string[]}
   */
  let question_tags = $state([]);

  /**
   * @description 题目标签数组警告状态
   * @type {number}
   */
  let question_tags_warning = $state(0);

  /**
   * @description 题目标签输入框内容
   * @type {string}
   */
  let tag_content = $state('');
  /**
   * @description 删除tag
   * @param {string} tagText
   */
  const deleteTag = (tagText) => {
    const index = question_tags.indexOf(tagText);
    if (index !== -1) {
      question_tags.splice(index, 1);
    }

    if (question_tags.length > questionLimit.questionTagsLenLimit) {
      question_tags_warning = 1;
    } else {
      question_tags_warning = 0;
    }
  };

  /**
   * @description 文本框填写提示
   * @type {number[][]}
   */
  let question_answers_editors_warning = $state([[0, 0, 0, 0]]);

  /**
   * @description 答案
   * @type {({ index: number; answer: string;alternative_answers: string[]; score: number; grading_rule: string; })[]}
   */
  let question_answers = $state([
    {
      index: 1,
      answer: '',
      alternative_answers: [],
      score: 0,
      grading_rule: '',
    },
  ]);

  /**
   * @description 题目分数
   */
  let question_score = $derived.by(() => {
    let total_score = 0;
    question_answers.forEach((item) => {
      total_score += item.score;
    });
    return total_score;
  });

  /**
   * @description 每个答案的分数
   */
  let per_answer_score = $state('');

  /**
   * @description 题目编辑器的容器
   * @type {HTMLElement|undefined}
   */
  let question_edit_container = $state();

  /**
   * @description 初始化面板
   */
  export const initPanel = () => {
    //  难度
    question_difficulty = question_data?.difficulty ? $state.snapshot(question_data?.difficulty) : 1;

    //  标签
    question_tags = question_data && question_data.tags ? question_data.tags : [];

    //  分值
    question_score = question_data?.score ? $state.snapshot(question_data.score) : 0;

    // 选项答案
    //@ts-ignore
    question_answers =
      question_data?.answers && Object.keys(question_data.answers).length > 0
        ? $state.snapshot(question_data.answers)
        : [
            {
              index: 1,
              answer: '',
              alternative_answers: [],
              score: 0,
              grading_rule: '',
            },
          ];

    question_answers_editors_warning = new Array(question_answers.length).fill([0, 0, 0, 0]);

    // 设置富文本编辑器内容
    title_editor?.setContentWithoutHistory(question_data?.content ? question_data.content : '');
    analysis_editor?.setContentWithoutHistory(question_data?.analysis ? question_data.analysis : '');

    for(let i= 0; i < question_answers.length; i++) {
    expend_answer_area[i]=true;
    }

    if (question_edit_container) {
      question_edit_container.scrollTop = 0;
    }

    per_answer_score = '';

    initialized = true;
  };

  /**
   * @description 题目解析的富文本编辑器组件实例
   * @type {SmartEditor|null}
   */
  let analysis_editor = $state(null);

  /**
   * @description 题目解析的警告状态
   * @type {number}
   */
  let analysis_editor_warning = $state(0);

  /**
   * @description 题目解析
   */
  let question_analysis_content = $state('');

  /**
   * @description 答案展开状态
   * @type {boolean[]}
   */
  let expend_answer_area = $state([true]);

  /**
   * @description 确认编辑
   */
  const onEditConfirm = () => {
    /**
     * @description 可成功保存标识
     * @type {boolean}
     */
    let success_confirm_flag = true;
    if (question_title_content === '') {
      title_editor_warning = 1;
      success_confirm_flag = false;
    } else if (title_editor && title_editor.getContentLength() > questionLimit.contentCharacterLenLimit) {
      title_editor_warning = 2;
      success_confirm_flag = false;
    }

    if (analysis_editor && analysis_editor.getContentLength() > questionLimit.analysisCharacterLenLimit) {
      analysis_editor_warning = 2;
      success_confirm_flag = false;
    }
   if (analysis_editor && analysis_editor.getContentLength() ==0) {
      analysis_editor_warning = 1;
      success_confirm_flag = false;
    }


    if (question_tags.length > questionLimit.questionTagsLenLimit) {
      question_tags_warning = 1;
      success_confirm_flag = false;
    }

    // 简答答案
    for (let i = 0; i < question_answers.length; i++) {
      let item = question_answers[i];

      if (item.answer.trim().length === 0) {
        question_answers_editors_warning[item.index - 1][0] = 1;
        success_confirm_flag = false;
      } else if (item.answer.length > questionLimit.shortAnswerAnswerCharacterLenLimit) {
        question_answers_editors_warning[item.index - 1][0] = 2;
        success_confirm_flag = false;
      }

      if (question_score > questionLimit.scoreLimit) {
        for (let i = 0; i < question_answers_editors_warning.length; i++) {
          question_answers_editors_warning[i][1] = 2;
        }
        success_confirm_flag = false;
      }

      if (item.score <= 0) {
        question_answers_editors_warning[item.index - 1][1] = 1;
        success_confirm_flag = false;
      } else if (item.score > questionLimit.scoreLimit) {
        question_answers_editors_warning[item.index - 1][1] = 2;
        success_confirm_flag = false;
      }

      if (item.grading_rule.trim().length === 0) {
        question_answers_editors_warning[item.index - 1][2] = 1;
        success_confirm_flag = false;
      } else if (item.grading_rule.length > questionLimit.gradingRuleCharacterLenLimit) {
        question_answers_editors_warning[item.index - 1][2] = 2;
        success_confirm_flag = false;
      }

      for (let index = 0; index < item.alternative_answers.length; index++) {
        if (item.alternative_answers[index].trim().length === 0) {
          question_answers_editors_warning[item.index - 1][3] = 1;
          success_confirm_flag = false;
          break;
        } else if (item.alternative_answers[index].length > questionLimit.shortAnswerAnswerCharacterLenLimit) {
          question_answers_editors_warning[item.index - 1][3] = 2;
          success_confirm_flag = false;
          break;
        }
      }
    }

    if (!success_confirm_flag) {
      return;
    }

    const now = new Date();
    /**
     * @description 题目数据
     * @type {Partial<TheoryQuestion>}
     */
    let data = {};
    if (is_new_question) {
      data = {
        id: question_data?.id === undefined ? -1 : question_data.id,
        type: question_type,
        content: question_title_content === undefined ? '' : question_title_content,
        score: question_score,
        difficulty: question_difficulty,
        tags: $state.snapshot(question_tags),
        answers: $state.snapshot(question_answers),
        analysis: question_analysis_content === undefined ? '' : question_analysis_content,
      };
    } else {
      // 更新题目(只更新变动字段)
      if (!question_data) {
        return;
      }
      data.id = question_data?.id;
      data.type = question_type;

      if (question_data?.content !== question_title_content) {
        data.content = question_title_content;
      }

      if (question_data?.difficulty !== question_difficulty) {
        data.difficulty = question_difficulty;
      }

      if (question_data?.analysis !== question_analysis_content) {
        data.analysis = question_analysis_content;
      }

      if (question_data?.score !== question_score) {
        data.score = question_score;
      }

      let tags_equal =
        question_data.tags.length === question_tags.length &&
        question_data.tags.every((value, index) => value === question_tags[index]);
      if (!tags_equal) {
        data.tags = $state.snapshot(question_tags);
      }

      let answers_equal =
        question_data.answers.length === question_answers.length &&
        question_data.answers.every((value, index) => {
          let new_answer = question_answers[index];
          if (typeof value === 'string' || typeof new_answer === 'string') return;
          return (
            value.index === new_answer.index &&
            value.answer === new_answer.answer &&
            value.score === new_answer.score &&
            value.grading_rule === new_answer.grading_rule &&
            (value.alternative_answers === undefined ||
              (value.alternative_answers?.length === new_answer.alternative_answers?.length &&
                value.alternative_answers?.every((value, index) => {
                  value === new_answer.alternative_answers?.[index];
                })))
          );
        });
      if (!answers_equal) {
        data.answers = $state.snapshot(question_answers);
      }
    }

 
    data.options = [];
    onConfirm(data);
  };

  /**
   * @description 删除答案
   * @param {Event} e
   * @param {number} index
   */
  const onClickAnsewerDeleteBtn = (e, index) => {
    e.stopPropagation();
    if (question_answers.length <= 1) return;

    for (let i = index; i < question_answers.length; i++) {
      question_answers[i].index--;
    }
    question_answers.splice(index, 1);
    expend_answer_area.splice(index, 1);
    question_answers_editors_warning.splice(index, 1);
  };

  /**
   * @description 分数变更
   * @param {Event} e
   * @param {number} index
   * @param {{ answer: string; score: number; grading_rule: string; }} answer
   */
  const onAnswerScoreChange = (e, index, answer) => {
    if (e.target && 'value' in e.target && typeof e.target.value === 'string') {
      const value = Number(e.target.value);
      const limited_value = value > 0 ? (value <= 100 ? value : 100) : 0;
      question_answers[index];

      if (typeof per_answer_score === 'number' && limited_value !== per_answer_score) {
        per_answer_score = '';
      }
      answer.score = limited_value;
      e.target.value = limited_value;

      let averangeFlag = true;
      for (let i = 0; i < question_answers.length; i++) {
        if (question_answers[i].score !== answer.score) {
          averangeFlag = false;
        }
      }
      if (averangeFlag) {
        per_answer_score = answer.score.toString();
      } else {
        per_answer_score = '';
      }
    }
  };

  /**
   * @description 添加答案
   */
  const onAddAnswer = () => {
    question_answers.push({
      index: question_answers.length + 1,
      answer: '',
      alternative_answers: [],
      score: typeof per_answer_score === 'number' ? per_answer_score : 0,
      grading_rule: '',
    });
    expend_answer_area.push(true);
    question_answers_editors_warning.push([0, 0, 0, 0]);
  };

  /**
   * @description 分数变更
   * @param {Event} e
   */
  const onPerAnswerScoreSetChange = (e) => {
    if (e && e.target && 'value' in e.target && typeof e.target.value === 'string') {
      const value = Number(e.target.value);
      const limited_value =
        value > 0
          ? value <= Math.floor(questionLimit.scoreLimit / question_answers.length)
            ? value
            : Math.floor(questionLimit.scoreLimit / question_answers.length)
          : 0;

      e.target.value = limited_value;
      question_answers.forEach((item) => {
        item.score = limited_value;
      });
    } else {
      question_answers.forEach((item) => {
        item.score = 0;
      });
    }
  };
</script>

<div class="editorContainer {show ? '' : 'hide'} shortAnswer">
  <div class="topBar">
    <span>{is_new_question ? `新增` : `编辑`}简答题</span>

    <div class="topBarControlBtns">
      <button
        class="cancelBtn"
        onclick={() => {
          onCancel();
          // resetPanel();
        }}>取消</button
      >
      <button class="confirmBtn" onclick={onEditConfirm}>保存</button>
    </div>
  </div>

  <div class="mainContent">
    <div class="editArea" bind:this={question_edit_container}>
      <div
        style="
        display:flex;
        flex-direction:column;
        flex:1;
        align-items: end;
        min-height: 100%;
        "
      >
        <div class="container contentInputContainer {title_editor_warning !== 0 ? 'warning' : ''}">
          <div class="labelText">
            <span><span style="color:#D9001B">*</span>题目:</span>
          </div>
          <div class="content richTextEditor">
            <div>
              {#if initialized}
                <SmartEditor
                  bind:this={title_editor}
                  width={editor_width}
                  height={editor_height}
                  editor_options={{
                    ...editor_options,
                    content: question_data?.content,
                    characterCount: {
                      characterCountLimit: questionLimit.contentCharacterLenLimit,
                      enableCharacterCountLimit: false,
                    },
                    placeholder: '若为单一题目，请直接填写题目内容。  若为主题干附带若干题目，请一并填写所有内容。',
                    onContentChange: (
                      /**
                       * @type {PiptapEditor}
                       */
                      editor,
                    ) => {
                      title_editor_warning = 0;
                      question_title_content = editor?.getPreviewHTML();
                    },
                  }}
                ></SmartEditor>
              {/if}
              <div class="deleteOptionBtn"></div>
            </div>
            <span class="inputWarnText"> 题目内容不能为空 </span>
          </div>
        </div>
        <div class="container difficultyOptionsContainer">
          <div class="labelText">
            <span><span style="color:#D9001B">*</span>难度:</span>
          </div>
          <div class="content difficultyOptions">
            <button
              onclick={() => {
                question_difficulty = 1;
              }}
            >
              {#if question_difficulty !== 1}
                <img class="radioButton" src={ICON.radioButton_unselect} alt="radio_unselect" />
              {:else}
                <img class="radioButton" src={ICON.radioButton_selected} alt="radio_selected" />
              {/if}
              <span style="font-size:14px;margin-left:5px;"> 简单 </span>
            </button>
            <button
              onclick={() => {
                question_difficulty = 2;
              }}
            >
              {#if question_difficulty !== 2}
                <img class="radioButton" src={ICON.radioButton_unselect} alt="radio_unselect" />
              {:else}
                <img class="radioButton" src={ICON.radioButton_selected} alt="radio_selected" />
              {/if}
              <span style="font-size:14px;margin-left:5px;"> 中等 </span></button
            >
            <button
              onclick={() => {
                question_difficulty = 3;
              }}
            >
              {#if question_difficulty !== 3}
                <img class="radioButton" src={ICON.radioButton_unselect} alt="radio_unselect" />
              {:else}
                <img class="radioButton" src={ICON.radioButton_selected} alt="radio_selected" />
              {/if}
              <span style="font-size:14px;margin-left:5px;"> 困难 </span></button
            >
          </div>
        </div>
        <div class="container questionTagsContainer">
          <div class="labelText">
            <span>标签:</span>
          </div>
          <div class="content" style="display: flex;flex-direction:column;align-items:flex-start">
            <div class="questionTags">
              <QuestionTag
                bind:content={tag_content}
                handle_funcs={{
                  onchange: (old_content, new_content) => {
                    const value = new_content.trim();

                    if (value === '') return;
                    if (question_tags.includes(value)) {
                      tag_content = '';
                      return;
                    }

                    question_tags.unshift(value);
                    if (question_tags.length > 32) {
                      question_tags_warning = 1;
                    } else {
                      question_tags_warning = 0;
                    }
                    tag_content = '';
                  },
                  delete: () => {
                    tag_content = '';
                  },
                }}
              />
              {#each question_tags as tag, index}
                <QuestionTag
                  content={tag}
                  handle_funcs={{
                    onchange: (old_content, new_content) => {
                      const value = new_content.trim();

                      if (value === '') return;

                      question_tags[index] = value;
                    },
                    delete: () => {
                      deleteTag(tag);
                    },
                  }}
                />
              {/each}
            </div>
            <span
              class="inputWarnText"
              style="color:#D9001B;visibility: {question_tags_warning !== 0 ? 'visible' : 'hidden'};"
              >标签数量超出限制，上限为{32}个</span
            >
          </div>
        </div>

        {@render shortAnswer()}

        <div class="container contentInputContainer {analysis_editor_warning !== 0 ? 'warning' : ''}">
          <div class="labelText">
           <span> <span style="color:#D9001B">*</span>解析:</span>
          </div>
          <div class="content richTextEditor">
            <div>
              {#if initialized}
                <SmartEditor
                  bind:this={analysis_editor}
                  width={editor_width}
                  height={editor_height}
                  editor_options={{
                    ...editor_options,
                    content: question_data?.analysis,
                    characterCount: {
                      characterCountLimit: questionLimit.analysisCharacterLenLimit,
                      enableCharacterCountLimit: false,
                    },
                    placeholder: '输入解析内容（选填）',
                    onContentChange: (
                      /**
                       * @type {PiptapEditor}
                       */
                      editor,
                    ) => {
                      analysis_editor_warning = 0;
                      question_analysis_content = editor?.getPreviewHTML();
                    },
                  }}
                ></SmartEditor>
              {/if}
              <div class="deleteOptionBtn"></div>
            </div>
            <span class="inputWarnText">解析不能为空</span>
          </div>
        </div>
      </div>
    </div>

    <div class="previewArea">
      <QuestionPreviewPanel
        closePanel={() => {}}
        question={{
          id: 0,
          type: question_type,
          content: question_title_content,
          options: [],
          score: question_score,
          difficulty: question_difficulty,
          tags: question_tags,
          answers: question_answers,
          analysis: question_analysis_content,
          update_time: question_data?.update_time ? question_data.update_time : 0,
          update_time_str: question_data?.update_time_str ? question_data.update_time_str : '',
          question_attachments_path: [],
        }}
        displayClosePanelBtn={false}
      ></QuestionPreviewPanel>
    </div>
  </div>
</div>

{#snippet scoreInput()}
  <div class="scoreInputContainer">
    <span class="shortAnswerControlPlaceholder">({1})</span>
    <div class="labelText">
      <span>每项分数:</span>
    </div>
    <div class="content scoreContent">
      <div>
        <input
          class="scoreInput"
          type="number"
          min="0"
          max={questionLimit.scoreLimit}
          onchange={onPerAnswerScoreSetChange}
          bind:value={per_answer_score}
        />
        <span class="inputWarnText">题目分值必须大于0</span>
      </div>
    </div>
  </div>
{/snippet}

<!-- 简答题 -->
{#snippet shortAnswer()}
  <div class="container">
    <div class="labelText questionLabelText">
      <span><span style="color:#D9001B">*</span>作答:</span>
    </div>
    <div class="content shortAnswerAnswerContent">
      {#each question_answers as answer, index}
        <div
          class="shortAnswerAnswerRepeaterElement {question_answers_editors_warning[index][0] !== 0 ||
          question_answers_editors_warning[index][1] !== 0 ||
          question_answers_editors_warning[index][2] !== 0 ||
          question_answers_editors_warning[index][3] !== 0
            ? 'warning'
            : ''}"
        >
          <span>({index + 1})</span>
          <div class="shortAnswerAnswerContainer">
            <div class="shortAnswerAnswerExpandBtn">
              <button
                class="expandBtn"
                onclick={() => {
                  expend_answer_area[index] = !expend_answer_area[index];
                }}
              >
                <!-- svelte-ignore a11y_click_events_have_key_events -->
                <!-- svelte-ignore a11y_no_static_element_interactions -->
                <div class="deleteBinBtn" onclick={(e) => onClickAnsewerDeleteBtn(e, index)}>
                  <img src={ICON.delete_bin} alt="delete_bin" />
                </div>
                <img
                  class="arrow_down {expend_answer_area[index] ? 'arrow_turnUp' : ''}"
                  src={ICON.arrow_down}
                  alt="arrow"
                />
              </button>
            </div>

            <div class="shortAnswerAnswerContent">
              {#if expend_answer_area[index]}
                <div
                  class="shortAnswerAnswerContentInputContainer {question_answers_editors_warning[index][0] !== 0
                    ? 'warning'
                    : ''}"
                >
                  <span> <span style="color:#D9001B">*</span>答案:</span>
                  <div style="display: flex;flex-direction:column;">
                    <textarea
                      class="shortAnswerAnswerContentInput"
                      placeholder="请输入答案（必填）"
                      bind:value={answer.answer}
                      oninput={() => {
                        if (answer.answer.length > questionLimit.shortAnswerAnswerCharacterLenLimit) {
                          question_answers_editors_warning[index][0] = 2;
                        } else {
                          question_answers_editors_warning[index][0] = 0;
                        }
                      }}
                    ></textarea>
                    <span
                      style="margin-left: 15px;"
                      class="inputWarnText {question_answers_editors_warning[index][0] !== 0 ? 'warning' : ''}"
                      >{question_answers_editors_warning[index][0] === 1
                        ? '答案不能为空'
                        : `答案长度超出限制，上限为${questionLimit.shortAnswerAnswerCharacterLenLimit}字`}</span
                    >
                  </div>
                </div>
                <div
                  class="shortAnswerAnswerScoreInputContainer {question_answers_editors_warning[index][1] !== 0
                    ? 'warning'
                    : ''}"
                >
                  <span> <span style="color:#D9001B">*</span>分值:</span>
                  <div style="display: flex;flex-direction:column;">
                    <div>
                      <input
                        type="number"
                        class="shortAnswerAnswerScoreInput"
                        placeholder="请输入分数（必填）"
                        bind:value={answer.score}
                        oninput={() => {
                          if (answer.score > questionLimit.scoreLimit || question_score > questionLimit.scoreLimit) {
                            question_answers_editors_warning[index][1] = 2;
                          } else {
                            question_answers_editors_warning[index][1] = 0;
                          }
                        }}
                        onchange={(e) => onAnswerScoreChange(e, index, answer)}
                      />
                      分
                    </div>
                    <span
                      style="margin-left: 15px;"
                      class="inputWarnText {question_answers_editors_warning[index][1] !== 0 ? 'warning' : ''}"
                      >{question_answers_editors_warning[index][1] === 1
                        ? '答案分数必须大于0'
                        : `题目分数总和超出范围（0~${questionLimit.scoreLimit}）`}</span
                    >
                  </div>
                </div>
                <div
                  class="shortAnswerAnswerGradingRuleInputContainer {question_answers_editors_warning[index][2] !== 0
                    ? 'warning'
                    : ''}"
                >
                  <span> <span style="color:#D9001B">*</span>批改规则/提示词:</span>
                  <div style="display: flex;flex-direction:column;">
                    <textarea
                      class="shortAnswerAnswerGradingRuleInput"
                      placeholder="请输入批改规则（必填）"
                      bind:value={answer.grading_rule}
                      oninput={() => {
                        if (answer.grading_rule.length > questionLimit.gradingRuleCharacterLenLimit) {
                          question_answers_editors_warning[index][2] = 2;
                        } else {
                          question_answers_editors_warning[index][2] = 0;
                        }
                      }}
                    ></textarea>
                    <span
                      style="margin-left: 15px;"
                      class="inputWarnText {question_answers_editors_warning[index][2] !== 0 ? 'warning' : ''}"
                      >{question_answers_editors_warning[index][2] === 1
                        ? '批改规则不能为空'
                        : `批改规则长度超出限制，上限为${questionLimit.gradingRuleCharacterLenLimit}字`}</span
                    >
                  </div>
                </div>
              {/if}
            </div>
          </div>
        </div>
      {/each}

      <div class="shortAnswerAnswerControlContainer">
        <div>
          <span class="shortAnswerControlPlaceholder">({1})</span>
          <button class="addAnswerBtn" disabled={question_answers.length >= 8 ? true : false} onclick={onAddAnswer}
            >添加答案</button
          >
        </div>
        {@render scoreInput()}
        <div>
          <span class="shortAnswerControlPlaceholder">({1})</span>
          <div class="shortAnswerTotalScore">
            <span
              ><span>共{question_answers.length}个填空项</span><span
                >总分<span style="color: #0052D9;">{question_score}</span>分</span
              ></span
            >
          </div>
        </div>
      </div>
    </div>
  </div>
{/snippet}

<style lang="scss" scoped>
  button {
    margin: 0px;
    padding: 0px;
    border: 0px;
    background-color: transparent;
    cursor: pointer;
    user-select: none;

    display: flex;

    align-items: center;
    transition: all 0.2s ease;
    &:focus {
      outline: none;
    }
  }

  .editorContainer {
    display: flex;
    flex-direction: column;

    position: fixed;
    top: 0;
    right: 0;
    bottom: 0;
    left: 0;

    z-index: 1002;
    background-color: #fff;

    transition: all 0.3s ease-in-out;

    overflow-y: auto;
    .topBar {
      display: flex;
      justify-content: space-between;
      font-size: 20px;
      font-family: PingFang SC;
      font-weight: 100;
      height: 65px;

      box-sizing: border-box;
      padding: 15px;

      min-width: 1000px;
      span {
        font-weight: normal;
        margin-left: 15px;
      }

      .topBarControlBtns {
        display: flex;
        .cancelBtn {
          background-color: #7787a2;
          width: 110px;
          height: 35px;
          font-size: 16px;
          border-radius: 5px;

          display: flex;
          justify-content: center;
          align-items: center;

          color: white;

          &:hover {
            background-color: gray;
          }
        }

        .confirmBtn {
          margin-left: 25px;
          background-color: #619cf5;
          width: 110px;
          height: 35px;
          font-size: 16px;
          border-radius: 5px;

          display: flex;
          justify-content: center;
          align-items: center;

          color: #fff;

          &:hover {
            background-color: #578ddd;
          }
        }
      }
    }

    .mainContent {
      display: flex;
      flex: 1;
      height: calc(100% - 65px);
      box-sizing: border-box;

      min-width: 1000px;
      .editArea {
         padding-top: 1%;
        flex: 1;
        max-width: 55%;
        overflow-y: auto;

        padding-right: 16px;
        padding-bottom: 30px;
        box-sizing: border-box;
        // 默认保留滚动条空间
        scrollbar-gutter: stable;

        border-top: 1px solid rgba($color: #7b7b7b, $alpha: 0.5);
        border-right: 1px solid rgba($color: #7b7b7b, $alpha: 0.5);

        .contentInputContainer {
          &:first-child {
            margin-top: 0px;
            margin-bottom: 0px;
          }
          &:last-child {
            margin-bottom: 30px;
          }
        }

        .difficultyOptionsContainer {
          margin-top: 10px;
          .difficultyOptions {
            display: flex;

            button {
              margin-right: 10px;
            }
          }
        }

        .questionTagsContainer {
          align-items: baseline;
          .questionTags {
            display: flex;
            flex-wrap: wrap;
          }
        }
      }

      .previewArea {
        flex: 1;
        max-width: 45%;

        box-sizing: border-box;
        border-top: 1px solid rgba($color: #7b7b7b, $alpha: 0.5);
      }
    }
  }

  .hide {
    transform: translateY(100%);
  }

  .scoreInputContainer {
    display: flex;
    align-items: baseline;
    margin-top: 10px;
    .scoreInput {
      border: 1px solid #c8c8c8;
      outline: none;

      width: 50px;
      height: 20px;
      font-size: 14px;
    }
  }

  .labelText {
    white-space: nowrap;
    margin-right: 20px;
    font-size: 14px;
  }

  .questionLabelText {
    display: flex;
    flex-direction: column;
    align-items: end;
  }

  .container {
    display: flex;
    justify-content: end;
    width: 100%;
    margin-top: 20px;

    &:first-child {
      margin-top: 0px;
    }

    .content {
      display: flex;
      align-items: center;
      width: 85%;

      .inputWarnText {
        visibility: hidden;
        height: 10px;
        font-size: 12px;
      }
    }

    .content.richTextEditor {
      display: flex;
      flex-direction: column;
      justify-content: start;
      align-items: start;
      width: 85%;
      height: 250px;

      & > div {
        display: flex;
        height: calc(100% - 10px);
        width: 100%;
      }
    }

    .content.shortAnswerAnswerContent {
      align-items: start;
      flex-direction: column;
      width: 85%;
    }
  }

  .shortAnswerAnswerRepeaterElement.warning {
    animation: bumpAnimation 1.3s ease-in-out 1;

    .shortAnswerAnswerContentInputContainer.warning,
    .shortAnswerAnswerScoreInputContainer.warning,
    .shortAnswerAnswerGradingRuleInputContainer.warning {
      input,
      textarea {
        border-color: #d9001b;
      }
      color: #d9001b;
    }

    .inputWarnText.warning {
      visibility: visible;
    }
  }

  .container.warning {
    animation: bumpAnimation 1.3s ease-in-out 1;
    color: #d9001b;
    .inputWarnText {
      visibility: visible;
    }
  }

  .inputWarnText {
    user-select: none;
  }

  @keyframes bumpAnimation {
    0%,
    100% {
      transform: translateX(0);
    }
    15% {
      transform: translateX(15px);
    }
    25% {
      transform: translateX(13px);
    }
    30%,
    70% {
      transform: translateX(15px);
    }
    85% {
      transform: translateX(0);
    }
    95% {
      transform: translateX(2px);
    }
  }

  .radioButton {
    width: 20px;
    height: 20px;
  }

  .deleteOptionBtn {
    width: 24px;
    height: 24px;
    margin-left: 10px;

    flex-shrink: 0;
  }

  .expandBtn {
    display: flex;
    justify-content: end;
    padding-right: 5px;
    padding-top: 5px;
    padding-bottom: 5px;
    width: 100%;
  }

  // 简答题
  .shortAnswerAnswerRepeaterElement {
    display: flex;
    width: calc(100% - 34px);
    align-items: start;

    &:first-of-type {
      margin-top: 0px;
    }

    margin-top: 20px;
    & > span {
      margin-top: 5px;
      margin-right: 5px;
      line-height: 20px;
      font-size: 16px;
    }

    .shortAnswerAnswerContainer {
      display: flex;
      flex-direction: column;
      flex: 1;
      background-color: #cccccc;

      border-top-left-radius: 3px;
      border-top-right-radius: 3px;

      .shortAnswerAnswerExpandBtn {
        display: flex;
        width: 100%;
        justify-content: end;
        .deleteBinBtn {
          margin-right: 15px;
          display: flex;
          align-items: center;
          cursor: pointer;
          img {
            width: 20px;
            height: auto;
          }
        }

        .arrow_down {
          width: 20px;
          height: auto;
        }

        .arrow_down.arrow_turnUp {
          transform: rotate(180deg);
        }
      }

      .shortAnswerAnswerContent {
        display: flex;
        flex-direction: column;
        width: 100%;

        align-items: end;
        background-color: #f2f2f2;
        transition: all 0.3s ease-in-out;

        .shortAnswerAnswerGradingRuleInputContainer,
        .shortAnswerAnswerScoreInputContainer,
        .shortAnswerAnswerContentInputContainer {
          display: flex;
          justify-content: end;
          align-items: start;
          width: 100%;
          padding: 10px 0px;

          font-size: 14px;

          div {
            display: flex;
            width: 70%;
            margin-right: 40px;
          }
        }

        .shortAnswerAnswerGradingRuleInput,
        .shortAnswerAnswerScoreInput,
        .shortAnswerAnswerContentInput {
          outline: none;
          border: 1px solid #c8c8c8;
          margin-left: 15px;
        }

        .shortAnswerAnswerScoreInput {
          width: 40px;
        }

        .shortAnswerAnswerGradingRuleInput,
        .shortAnswerAnswerContentInput {
          width: 100%;
          height: 100px;

          resize: none;
        }
      }
    }
  }

  .shortAnswerAnswerControlContainer {
    display: flex;
    flex-direction: column;
    font-size: 14px;
    width: calc(100% - 34px);
    margin-top: 15px;

    & > div {
      display: flex;
    }

    & .addAnswerBtn {
      color: #fff;
      padding: 5px 10px;
      background-color: #0052d9;
      display: flex;
      width: fit-content;
      border-radius: 3px;

      font-size: 14px;

      &:hover {
        background-color: #266fe8;
      }

      &:disabled {
        background-color: #b3c9f0;
      }
    }

    .shortAnswerControlPlaceholder {
      visibility: hidden;
      margin-top: 5px;
      margin-right: 5px;
      line-height: 20px;
      font-size: 16px;
    }

    .shortAnswerTotalScore {
      margin-top: 10px;
    }
  }
</style>
