<script>
  import {TheoryQuestion} from "../theory/type";
    import UneditableTag from "$lib/components/Tag/UneditableTags.svelte";
 import {replaceSpansWithLines} from "$lib/utils/blank_changer"
  /**
   * @type {{
   *      question: TheoryQuestion,
   *      closePanel: () => void,
   *      displayClosePanelBtn?: boolean
   * }}
   */
  let {question, closePanel, displayClosePanelBtn} = $props();

  /**
   * @description 题型
   * @type {string}
   */
  let quesiton_type = $derived.by(() => {
    if (!question) {
      return "未知";
    }
    switch (question.type) {
      case "00":
        return "单选题";
      case "02":
        return "多选题";
      case "04":
        return "判断题";
         case "06":
        return "简答题";
      case "08":
        return "填空题";
      default:
        return "未知";
    }
  });

  let difficultyCodeToText = {
    "1": "简单",
    "2": "中等",
    "3": "困难",
  }

  /**
   * @description 关闭面板
   */
  let closePanelBtn;
</script>

<!--baseLabel-->
{#snippet baseLabel(score, difficulty, tags)}
  <div class="question-tag">
        <span class="tag-label piptap-content" style="width: auto;">
            <p>【分值】</p>
        </span>
    <p>{score}分</p>
    <div>
    </div>
  </div>
  <div class="question-tag">
        <span class="tag-label piptap-content" style="width: auto;">
            <p>【难度】</p>
        </span>
    <p>{difficultyCodeToText[difficulty] ?? "未知"}</p>
    <div>
    </div>
  </div>
  <div class="question-tag">
        <span class="tag-label piptap-content" style="width: auto;">
            <p>【标签】</p>
        </span>
    <div>
    
         <UneditableTag tags={tags}></UneditableTag>
   
    </div>
  </div>
{/snippet}

<!--单选题-->
{#snippet singlechoose(/** @type {TheoryQuestion} */ question)}
  <div class="question-content">
    {@html question.content}
  </div>
  <div class="question-options">
    {#each question.options as option}
      <div class="option-container">
        <input
          type="radio"
          id={`option-${question.id}`}
          name={`question-${question.id}`}
          disabled={false}
        />
        <div
          class="custom-radio {Array.isArray(question.answers) &&
                    question.answers.includes(option.label)
                        ? 'correct'
                        : ''}"
        >
          <label for={`option-${question.id}`}>{option.label}</label>
        </div>
        <div class="option-value">
          <div class="piptap-content">
            {#if option.value && option.value.length > 0}
              {@html option.value}
            {:else}
              <p style="visibility: hidden;">no-content</p>
            {/if}
          </div>
        </div>
      </div>
    {/each}
  </div>
  {@render baseLabel(question.score, question.difficulty, question.tags)}
  {#if Array.isArray(question.answers)}
    <div class="question-answer">
      {#each question.answers as answer, i}
                <span
                  class="answer-label piptap-content"
                  style="width:fit-content;"
                >
                    <p>【答案】</p>
                </span>
        <p class="answer-content">
          {answer}
        </p>
      {/each}
    </div>
  {/if}
  <div class="question-analysis">
    {#if question.analysis}
            <span class="analysis-label piptap-content" style="width: auto;">
                <p style="margin-bottom:0px;">【解析】</p>
            </span>
      <div class="analysis-content">
        <div class="piptap-content">
          {@html question.analysis}
        </div>
      </div>
    {:else}
            <span class="analysis-label piptap-content" style="width: auto;">
                <p style="margin-bottom:0px;">【解析】</p>
            </span>
      <span
        class="blank-analysis-label piptap-content"
        style="width: auto;"
      >
                <p>略</p>
            </span>
    {/if}
  </div>
{/snippet}

<!--多选题-->
{#snippet multiplechoice(/** @type {TheoryQuestion} */ question)}
  <div class="question-content">
    <div class="piptap-content">
      {@html question.content}
    </div>
  </div>
  <div class="question-options">
    {#each question.options as option}
      <div class="option-container">
        <input
          type="checkbox"
          id={`option-${question.id}`}
          name={`question-${question.id}`}
          disabled={false}
        />
        <div
          class="custom-checkbox {Array.isArray(question.answers) &&
                    question.answers.includes(option.label)
                        ? 'correct'
                        : ''}"
        >
          <label for={`option-${question.id}`}>{option.label}</label>
        </div>
        <div class="option-value">
          <div class="piptap-content">
            {#if option.value && option.value.length > 0}
              {@html option.value}
            {:else}
              <p style="visibility: hidden;">no-content</p>
            {/if}
          </div>
        </div>
      </div>
    {/each}
  </div>
  {@render baseLabel(question.score, question.difficulty, question.tags)}
  {#if Array.isArray(question.answers)}
    <div class="question-answer">
            <span
              class="answer-label piptap-content"
              style="width:fit-content;"
            >
                <p style="margin-bottom:0px;">【答案】</p>
            </span>
      {#each question.answers as answer, i}
        {answer}
      {/each}
    </div>
  {/if}
  <div class="question-analysis">
    {#if question.analysis}
            <span class="analysis-label piptap-content" style="width: auto;">
                <p style="margin-bottom:0px;">【解析】</p>
            </span>
      <div class="analysis-content">
        <div class="piptap-content">
          {@html question.analysis}
        </div>
      </div>
    {:else}
            <span class="analysis-label piptap-content" style="width: auto;">
                <p style="margin-bottom:0px;">【解析】</p>
            </span>
      <span
        class="blank-analysis-label piptap-content"
        style="width: auto;"
      >
                <p>略</p>
            </span>
    {/if}
  </div>
{/snippet}

<!--判断题-->
{#snippet trueFalse(/** @type {TheoryQuestion} */ question)}
  <div class="question-content">
    <div class="piptap-content">
      {@html question.content}
    </div>
  </div>
  <div class="question-options truefalse">
    {#each question.options as option}
      <div class="option-container truefalse">
        <input
          type="radio"
          id={`option-${question.id}`}
          name={`question-${question.id}`}
          disabled={false}
        />
        <div
          class="custom-radio {Array.isArray(question.answers) &&
                    question.answers.includes(option.label)
                        ? 'correct'
                        : ''}"
        >
          <label for={`option-${question.id}`}>{option.label}</label>
        </div>
        <div class="option-value">
          <div class="piptap-content">
            {option.value}
          </div>
        </div>
      </div>
    {/each}
  </div>
  {@render baseLabel(question.score, question.difficulty, question.tags)}
  {#if Array.isArray(question.answers)}
    <div class="question-answer">
      {#each question.answers as answer, i}
                <span
                  class="answer-label piptap-content"
                  style="width:fit-content;"
                >
                    <p style="margin-bottom:0px;">【答案】</p>
                </span>
        <span class="answer-content">
                    {answer}
                </span>
      {/each}
    </div>
  {/if}
  <div class="question-analysis">
    {#if question.analysis}
            <span class="analysis-label piptap-content" style="width: auto;">
                <p style="margin-bottom:0px;">【解析】</p>
            </span>
      <div class="analysis-content">
        <div class="piptap-content">
          {@html question.analysis}
        </div>
      </div>
    {:else}
            <span class="analysis-label piptap-content" style="width: auto;">
                <p style="margin-bottom:0px;">【解析】</p>
            </span>
      <span
        class="blank-analysis-label piptap-content"
        style="width: auto;"
      >
                <p>略</p>
            </span>
    {/if}
  </div>
{/snippet}

<!--填空题-->
{#snippet fillBlank(/** @type {TheoryQuestion} */ question)}
  <div class="question-content">
    <div class="piptap-content">
      {@html  replaceSpansWithLines(question.content)}
    </div>
  </div>
  {@render baseLabel(question.score, question.difficulty, question.tags)}
  <div class="question-answer">
    {#if Array.isArray(question.answers)}
            <span
              class="answer-label piptap-content"
              style="width:fit-content;"
            >
                <p style="margin-bottom:0px;">【答案】</p>
            </span>
      <div class="answer-container">
        {#each question.answers as answer, i}
          {#if typeof answer !== "string"}
            <span class="answer-label">({answer.index})</span>
            <span class="answer-content">{answer.answer}</span>
            <br/>
            <div class="alternative_answers-container">
              {#if answer.alternative_answers && answer.alternative_answers.length > 0}
                                <span
                                  class="answer-label piptap-content"
                                  style="width: auto;"
                                >
                                    <p>【备选答案】</p>
                                </span>
                <div>
                  {#each answer.alternative_answers as alternativeAnswer, index}
                                        <span class="answer-label"
                                        >{index + 1}.</span
                                        >
                    <span class="answer-content"
                    >{alternativeAnswer}</span
                    >
                    <br/>
                  {/each}
                </div>
              {/if}
            </div>
          {:else}
            <span class="answer-label">({i + 1})</span>
            <span class="answer-content">{answer}</span>
            <br/>
            <div class="alternative_answers-container">
              {#if answer.alternative_answers && answer.alternative_answers.length > 0}
                                <span
                                  class="answer-label piptap-content"
                                  style="width: auto;"
                                >
                                    <p>【备选答案】</p>
                                </span>
                <div>
                  {#each answer.alternative_answers as alternativeAnswer, index}
                                        <span class="answer-label"
                                        >{index + 1}.</span
                                        >
                    <span class="answer-content"
                    >{alternativeAnswer}</span
                    >
                    <br/>
                  {/each}
                </div>
              {/if}
            </div>
          {/if}
        {/each}
      </div>
    {/if}
  </div>
  <div class="question-analysis">
    {#if question.analysis}
            <span class="analysis-label piptap-content" style="width: auto;">
                <p style="margin-bottom:0px;">【解析】</p>
            </span>
      <div class="analysis-content">
        <div class="piptap-content">
          {@html question.analysis}
        </div>
      </div>
    {:else}
            <span class="analysis-label piptap-content" style="width: auto;">
                <p style="margin-bottom:0px;">【解析】</p>
            </span>
      <span
        class="blank-analysis-label piptap-content"
        style="width: auto;"
      >
                <p>略</p>
            </span>
    {/if}
  </div>
{/snippet}

<!--简答题-->
{#snippet shortAnswer(/** @type {TheoryQuestion} */ question)}
  <div class="question-content">
    <div class="piptap-content">
      {@html question.content}
    </div>
  </div>
  {@render baseLabel(question.score, question.difficulty, question.tags)}
  <div class="question-answer">
    {#if Array.isArray(question.answers)}
            <span
              class="answer-label piptap-content"
              style="width:fit-content;"
            >
                <p style="margin-bottom:0px;">【答案】</p>
            </span>
      <div class="answer-container">
        {#each question.answers as answer, i}
          {#if typeof answer !== "string"}
            <span class="answer-label">({answer.index})</span>
            <span class="answer-content">{answer.answer}</span>
            <br/>
          {:else}
            <span class="answer-label">({i + 1})</span>
            <span class="answer-content">{answer}</span>
          {/if}
        {/each}
      </div>
    {/if}
  </div>
  <div class="question-analysis">
    {#if question.analysis}
            <span class="analysis-label piptap-content" style="width: auto;">
                <p style="margin-bottom:0px;">【解析】</p>
            </span>
      <div class="analysis-content">
        <div class="piptap-content">
          {@html question.analysis}
        </div>
      </div>
    {:else}
            <span class="analysis-label piptap-content" style="width: auto;">
                <p style="margin-bottom:0px;">【解析】</p>
            </span>
      <span
        class="blank-analysis-label piptap-content"
        style="width: auto;"
      >
                <p>略</p>
            </span>
    {/if}
  </div>
{/snippet}

<div class="previewContainer">
  <!--  <div class="content">-->
  <div class="question-container">
    {#if question && question.type === "00"}
      {@render singlechoose(question)}
    {:else if question && question.type === "02"}
      {@render multiplechoice(question)}
    {:else if question && question.type === "04"}
      {@render trueFalse(question)}
    {:else if question && question.type === "06"}
      {@render fillBlank(question)}
    {:else if question && question.type === "08"}
      {@render shortAnswer(question)}
    {/if}
  </div>
  <!--  </div>-->
</div>

<style lang="scss" scoped>
  p {
    //color: #333333;
    font-size: 14px;
    margin-block-start: 0;
    margin-block-end: 0;
    margin-inline-start: 0;
    margin-inline-end: 0;

  }

  span,
  label {
    font-family: PingFang FC;
  }

  .previewContainer {
    height: max-content;
    width: 100%;
    display: flex;
  }

  .topBar {
    display: flex;
    width: 100%;
    height: 50px;
    //background-color: #dcdcdc;

    user-select: none;

    align-items: center;

    div {
      display: flex;
      width: 100%;

      justify-content: space-between;
      align-items: baseline;
    }
  }

  .content {
    display: flex;
    flex-direction: column;

    padding-top: 10px;
    padding-left: 10px;
    box-sizing: border-box;
    //overflow-y: auto;
    height: calc(100% - 50px);
    // 默认保留滚动条空间
    scrollbar-gutter: stable;

    // &::-webkit-scrollbar {
    //     width: 10px;
    // }

    .questionBasic {
      display: flex;
      width: 100%;

      justify-content: space-between;

      .type,
      .difficulty,
      .score {
        font-size: 12px;
        color: #333;
      }

      .type {
        margin-left: 5%;
      }

      .score {
        margin-right: 5%;
      }
    }
  }

  .close-button {
    background: none;
    border: none;
    font-size: 20px;
    cursor: pointer;
    padding: 0px;

    margin-right: 20px;
    font-family: PingFang FC;
    color: #555;

    &:hover {
      color: #888;
    }
  }

  .question-container {
    display: flex;
    flex-direction: column;
    width: 100%;

    .question-options {
      display: flex;
      flex-direction: column;
      gap: 10px;

      .option-container {
        margin-left: 20px;
        display: flex;
        align-items: center;
        border-radius: 8px;

        input[type="radio"] {
          position: absolute;
          opacity: 0;
          width: 0;
          height: 0;
        }

        input[type="checkbox"] {
          position: absolute;
          opacity: 0;
          width: 0;
          height: 0;
        }

        .custom-radio {
          position: relative;
          width: 30px;
          height: 30px;
          border: 1px solid #ccc;
          border-radius: 50%;
          display: inline-flex;
          justify-content: center;
          align-items: center;
          margin-right: 10px;

          &.correct {
            background-color: #e8f8f2;
            border: 1px solid #00a870;

            label {
              color: #00a870;
            }
          }

          label {
            font-weight: 500;
            color: #444;
            font-size: 0.8rem;
            font-family: Arial, Helvetica, sans-serif;
          }
        }

        .custom-checkbox {
          position: relative;
          width: 30px;
          height: 30px;
          border: 1px solid #ccc;
          border-radius: 20%;
          display: inline-flex;
          justify-content: center;
          align-items: center;
          margin-right: 10px;

          &.correct {
            background-color: #e8f8f2;
            border: 1px solid #00a870;

            label {
              color: #00a870;
            }
          }

          label {
            font-weight: 500;
            color: #444;
            font-size: 0.8rem;
            font-family: Arial, Helvetica, sans-serif;
          }
        }

        &.truefalse {
          padding: 10px 0;
        }

        .option-value {
          display: flex;
          flex-wrap: wrap;
          flex: 1;
          flex-shrink: 0;

          & > div {
            flex: 0 0 100%;

            max-width: 100%;

            box-sizing: border-box;

            white-space: normal;
            word-break: break-word;
          }
        }
      }
    }

    .alternative_answers-container {
      display: flex;
    }

    .question-tag {
      display: flex;

      border-bottom: none;

      padding-top: 12px;
      padding-bottom: 12px;

      .tag-label {
        font-size: 14px;
        color: #619cf5;
      }

      & > div {
        width: 80%;
        display: flex;
        flex-wrap: wrap;
      }
    }

    .question-content {
      display: flex;
      //flex: 1;
      //flex-shrink: 0;
      //min-height: 30px;
      //margin-top: 10px;
      margin-bottom: 20px;
      width: 100%;
      overflow-wrap: break-word; /* 允许长单词或 URL 等在单词内换行 */
      white-space: normal; /* 默认值，允许文字换行 */
      word-break: break-word; /* 更激进的换行策略，适用于 CJK 等语言（可选） */
    }

    .question-answer {
      display: flex;

      padding-top: 12px;
      padding-bottom: 12px;

      .answer-label {
        white-space: nowrap;
        flex-shrink: 0;
        font-size: 14px;
        color: #619cf5;
      }

      .answer-content {
        word-wrap: break-word;
        overflow-wrap: break-word;
        word-break: break-all;
      }
    }

    .question-analysis {
      display: flex;
      align-items: flex-start;

      width: 100%;

      flex-wrap: wrap;

      padding-top: 12px;
      padding-bottom: 12px;

      .analysis-label {
        font-size: 14px;
        color: #619cf5;
        flex-shrink: 0;
      }

      .analysis-content {
        display: flex;
        flex: 1;
        flex-shrink: 0;

        & > div {
          flex: 0 0 100%;

          max-width: 100%;

          box-sizing: border-box;

          white-space: normal;
          word-break: break-word;
        }
      }
    }
  }
</style>
