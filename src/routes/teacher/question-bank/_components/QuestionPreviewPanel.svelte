<script>
    import { TheoryQuestion } from "../theory/type";
    import UneditableTag from "$lib/components/Tag/UneditableTags.svelte";
    import { onMount} from "svelte";
  import { debounce } from "$lib/utils/optimize";
    /**
     * @type {{
     *      question: TheoryQuestion,
     *      closePanel: () => void,
     *      displayClosePanelBtn?: boolean
     * }}
     */
    let { question, closePanel, displayClosePanelBtn, showHeader = true, editSubScore = false, update } = $props();

    // 子题分值数组 - 使用 derived 确保与父组件数据同步
    let sub_score = $derived.by(() => question.sub_score || []);

    let question_content = $state("")

    $effect(()=>{
        if (question?.content) {
            question_content = replaceSpansWithLines(question.content)
        }
    })


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
                return "填空题";
            case "08":
                return "简答题";
            default:
                return "未知";
        }
    });

    let question_difficulty = $derived.by(() => {
        if (!question) {
            return "未知";
        }

        switch (question.difficulty) {
            case 1:
                return "简单";
            case 2:
                return "中等";
            case 3:
                return "困难";
            default:
                return "未知";
        }
    });

    /**
     * @description 关闭面板
     */
    let closePanelBtn;

    function replaceSpansWithLines(htmlString) {
        const parser = new DOMParser();
        const doc = parser.parseFromString(htmlString, 'text/html');
        const spans = doc.querySelectorAll('span.blank-item');

        spans.forEach(span => {
            const blankNumber = span.getAttribute('blanknumber') || '';
            const id = span.id;

            const line = document.createElement('span');
            // input.type = 'text';
            line.className = 'blank-item-line'; // 可选：添加样式
            line.setAttribute('data-blank-number', blankNumber);
            line.setAttribute('data-original-id', id);

            // 设置文本
            line.textContent = `_____`;


            // 替换 span 为 input
            span.replaceWith(line);
        });

        // 返回修改后的 HTML 字符串
        return doc.body.innerHTML;
    }
</script>

<!--单选题-->
{#snippet singlechoose(/** @type {TheoryQuestion} */ question)}
    <div class="question-content">
        <div class="piptap-content">
            {@html question.content}
        </div>
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
    <div class="question-tag">
        <span class="tag-label piptap-content" style="width: auto;">
            <p style="margin-bottom:0px;">【标签】</p>
        </span>
        <div>
            
                <UneditableTag tags={question.tags}></UneditableTag>
          
        </div>
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
    <div class="question-tag">
        <span class="tag-label piptap-content" style="width: auto;">
            <p style="margin-bottom:0px;">【标签】</p>
        </span>
        <div>
            
                <UneditableTag tags={question.tags}></UneditableTag>
           
        </div>
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
                        {@html option.value}
                    </div>
                </div>
            </div>
        {/each}
    </div>
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
    <div class="question-tag">
        <span class="tag-label piptap-content" style="width: auto;">
            <p style="margin-bottom:0px;">【标签】</p>
        </span>
        <div>
           
                <UneditableTag tags={question.tags}></UneditableTag>
           
        </div>
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

<!--填空题-->
{#snippet fillBlank(/** @type {TheoryQuestion} */ question)}
    <div class="question-content">
        <div class="piptap-content">
            {@html question_content}
        </div>
    </div>

    <!-- 试卷管理编辑子题分值功能 -->
    {#if editSubScore}
        <div class="question-answer">
        {#if Array.isArray(question.answers)}
            <span
                class="answer-label piptap-content"
                style="width:fit-content;"
            >
                <p style="margin-bottom:0px;">【答案】</p>
            </span>
            <div class="answer-container">
                {#each question.answers as answer, index}
                    {#if typeof answer !== "string"}
                        <span class="answer-label">({answer.index})</span>
                        <input type="number"
                            class="input"
                            placeholder="请输入"    
                            min={1}
                            bind:value={sub_score[index]}
                            oninput={debounce(()=>update(sub_score),500,false)}
                        >
                        <br />
                    {/if}
                {/each}
            </div>
        {/if}
    </div>    
    {/if}

    <div class="question-answer">
        {#if Array.isArray(question.answers)}
            <span
                class="answer-label piptap-content"
                style="width:fit-content;"
            >
                <p style="margin-bottom:0px;">【答案】</p>
            </span>
            <div class="answer-container">
                {#each question.answers as answer}
                    {#if typeof answer !== "string"}
                        <span class="answer-label">({answer.index})</span>
                        <span class="answer-content">{@html answer.answer}</span>
                        <br />
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
                                            >{@html alternativeAnswer}</span
                                        >
                                        <br />
                                    {/each}
                                </div>
                            {/if}
                        </div>
                    {/if}
                {/each}
            </div>
        {/if}
    </div>

    <div class="question-tag">
        <span class="tag-label piptap-content" style="width: auto;">
            <p style="margin-bottom:0px;">【标签】</p>
        </span>
        <div>
            
                <UneditableTag tags={question.tags}></UneditableTag>
            
        </div>
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

    <!-- 试卷管理编辑子题分值功能 -->
    {#if editSubScore}
        <div class="question-answer">
        {#if Array.isArray(question.answers)}
            <span
                class="answer-label piptap-content"
                style="width:fit-content;"
            >
                <p style="margin-bottom:0px;">【答案】</p>
            </span>
            <div class="answer-container">
                {#each question.answers as answer, index}
                    {#if typeof answer !== "string"}
                        <span class="answer-label">({answer.index})</span>
                        <input type="number"
                            class="input"
                            placeholder="请输入"    
                            min={1}
                            bind:value={sub_score[index]}
                            oninput={debounce(()=>update(sub_score),500,false)}
                        >
                        <br />
                    {/if}
                {/each}
            </div>
        {/if}
    </div>    
    {/if}

    <div class="question-answer">
        {#if Array.isArray(question.answers)}
            <span
                class="answer-label piptap-content"
                style="width:fit-content;"
            >
                <p style="margin-bottom:0px;">【答案】</p>
            </span>
            <div class="answer-container">
                {#each question.answers as answer}
                    {#if typeof answer !== "string"}
                        <span class="answer-label">({answer.index})</span>
                        <span class="answer-content">{@html answer.answer}</span>
                        <br />
                    {/if}
                {/each}
            </div>
        {/if}
    </div>

    <div class="question-tag">
        <span class="tag-label piptap-content" style="width: auto;">
            <p style="margin-bottom:0px;">【标签】</p>
        </span>
        <div>
           
                <UneditableTag tags={question.tags}></UneditableTag>
          
        </div>
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
    {#if showHeader}
        <div class="topBar">
            <div>
                <span
                    style="font-size: 18px;font-family: PingFang FC;margin-left:20px"
                    >预览</span
                >
                <button
                    bind:this={closePanelBtn}
                    class="close-button"
                    onclick={closePanel}
                    style="visibility: {displayClosePanelBtn === false
                        ? 'hidden'
                        : 'visible'};">×</button
                >
            </div>
        </div>
    {/if}
    <div class="content">
        <div class="questionBasic">
            {#if showHeader}
                <span class="type">题型：{quesiton_type}</span>
                <span class="difficulty">难度：{question_difficulty}</span>
                <span class="score">分值：{question?.score}分</span>
            {/if}
        </div>

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
    </div>
</div>

<style lang="scss" scoped>
    span,
    label {
        font-family: PingFang FC;
    }
    
    // 重置p标签的默认样式，确保在所有环境下都有一致的表现
    :global(p) {
        margin: 0;
        padding: 0;
    }
    
    .previewContainer {
        height: 100%;
    }

    .topBar {
        display: flex;
        width: 100%;
        height: 50px;
        background-color: #ededed;

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
        overflow-y: auto;
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
        background: #fff;
        border-radius: 12px;

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
            background: linear-gradient(
                    to right,
                    #ddd 0%,
                    #ddd 8px,
                    transparent 8px,
                    transparent 15px
                )
                repeat-x bottom;
            background-size: 15px 2px;

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
            flex: 1;
            flex-shrink: 0;
            margin-top: 10px;
            margin-bottom: 20px;
        }

        .question-answer {
            display: flex;
            align-items: flex-start;

            border-bottom: none;
            background: linear-gradient(
                    to right,
                    #ddd 0%,
                    #ddd 8px,
                    transparent 8px,
                    transparent 15px
                )
                repeat-x bottom;
            background-size: 15px 2px;

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

            .input {
                width: 75px;
                height: 20px;
                padding-left: 12px;
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
