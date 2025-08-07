<!--
 * @Author: WangKaidun 1597225095@qq.com
 * @Date: 2025-08-03 23:08:23
 * @LastEditors: WangKaidun 1597225095@qq.com
 * @LastEditTime: 2025-08-07 11:08:32
 * @FilePath: \exam\src\routes\teacher\paper\_components\PreviewQuestion\PreviewQuestion.svelte
 * @Description: 预览题目组件
 * @Copyright (c) 2025 by ${git_name_email}, All Rights Reserved. 
-->
<script>
    import UneditableTag from '$lib/components/Tag/UneditableTag.svelte';

    /**
     * @type {{question:PaperQuestion;
     * handleScoreChange:()=>void;
     *     }}
     */
    let { question = $bindable(), handleScoreChange } = $props();

    let question_content = $state("")
    $effect(()=>{
        if (question?.content) {
            question_content = replaceSpansWithLines(question.content)
        }
    })

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
{#snippet singlechoose(/** @type {PaperQuestion} */ question)}
    <singlechoose class="singlechoose">
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
                        <label for={`option-${question.id}`}
                            >{option.label}</label
                        >
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
                        style="width: auto;"
                    >
                        <span style="margin-bottom:0px;">【答案】</span>
                    </span>
                    <span class="answer-content">
                        {answer}
                    </span>
                {/each}
            </div>
        {/if}
        {#if Array.isArray(question.tags) && question.tags.length > 0}
        <div class="question-tag">
            <span class="tag-label piptap-content" style="width: auto;">
                <span style="margin-bottom:0px;">【标签】</span>
            </span>
            <div>
                {#each question.tags as tag}
                    <UneditableTag content={tag}></UneditableTag>
                {/each}
            </div>
        </div>
        {/if}
        <div class="question-analysis">
            {#if question.analysis}
                <span
                    class="analysis-label piptap-content"
                    style="width: auto;"
                >
                    <span style="margin-bottom:0px;">【解析】</span>
                </span>
                <div class="analysis-content">
                    <div class="piptap-content">
                        {@html question.analysis}
                    </div>
                </div>
            {:else}
                <span
                    class="analysis-label piptap-content"
                    style="width: auto;"
                >
                    <span style="margin-bottom:0px;">【解析】</span>
                </span>
                <span
                    class="blank-analysis-label piptap-content"
                    style="width: auto;"
                >
                    <p>略</p>
                </span>
            {/if}
        </div>
    </singlechoose>
{/snippet}

{#snippet multiplechoice(/** @type {PaperQuestion} */ question)}
    <multiplechoice class="multiplechoice">
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
                        class="custom-checkbox {Array.isArray(
                            question.answers,
                        ) && question.answers.includes(option.label)
                            ? 'correct'
                            : ''}"
                    >
                        <label for={`option-${question.id}`}
                            >{option.label}</label
                        >
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
                <span class="answer-label piptap-content" style="width: auto;">
                    <span style="margin-bottom:0px;">【答案】</span>
                </span>
                {#each question.answers as answer, i}
                    {answer}
                {/each}
            </div>
        {/if}
        {#if Array.isArray(question.tags) && question.tags.length > 0}
        <div class="question-tag">
            <span class="tag-label piptap-content" style="width: auto;">
                <span style="margin-bottom:0px;">【标签】</span>
            </span>
            <div>
                {#each question.tags as tag}span
                    <UneditableTag content={tag}></UneditableTag>
                {/each}
            </div>
        </div>
        {/if}
        <div class="question-analysis">
            {#if question.analysis}
                <span
                    class="analysis-label piptap-content"
                    style="width: auto;"
                >
                    <span style="margin-bottom:0px;">【解析】</span>
                </span>
                <div class="analysis-content">
                    <div class="piptap-content">
                        {@html question.analysis}
                    </div>
                </div>
            {:else}
                <span
                    class="analysis-label piptap-content"
                    style="width: auto;"spanspanspan
                >
                    <span style="margin-bottom:0px;">【解析】</span>
                </span>
                <span
                    class="blank-analysis-label piptap-content"
                    style="width: auto;"
                >
                    <p>略</p>
                </span>
            {/if}
        </div>
    </multiplechoice>
{/snippet}

<!--判断题-->
{#snippet trueFalse(/** @type {PaperQuestion} */ question)}
    <trueFalse class="trueFalse">
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
                        <label for={`option-${question.id}`}
                            >{option.label}</label
                        >
                    </div>
                    <div class="option-value">
                        <div class="piptap-content">
                            {option.value}
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
                        style="width: auto;"
                    >
                        <spanspanspan style="margin-bottom:0px;">【答案】</spanspanspan>
                    </span>
                    <span class="answer-content">
                        {answer}
                    </span>
                {/each}
            </div>
        {/if}
        {#if Array.isArray(question.tags) && question.tags.length > 0}
        <div class="question-tag">
            <span class="tag-label piptap-content" style="width: auto;">
                <spanspanspan style="margin-bottom:0px;">【标签】</spanspanspan>
            </span>
            <div>
                {#each question.tags as tag}
                    <UneditableTag content={tag}></UneditableTag>
                {/each}
            </div>
        </div>
        {/if}
        <div class="question-analysis">
            {#if question.analysis}
                <span
                    class="analysis-label piptap-content"
                    style="width: auto;"
                >
                    <spanspanspan style="margin-bottom:0px;">【解析】</spanspanspan>
                </span>
                <div class="analysis-content">
                    <div class="piptap-content">
                        {@html question.analysis}
                    </div>
                </div>
            {:else}
                <span
                    class="analysis-label piptap-content"
                    style="width: auto;"
                >
                    <spanspanspan style="margin-bottom:0px;">【解析】</spanspanspan>
                </span>
                <span
                    class="blank-analysis-label piptap-content"
                    style="width: auto;"
                >
                    <p>略</p>
                </span>
            {/if}
        </div>
    </trueFalse>
{/snippet}

<!--填空题-->
{#snippet fillBlank(/** @type {PaperQuestion} */ question)}
    <fillBlank class="fillBlank">
        <div class="question-content">
            <div class="piptap-content">
                {@html question_content}
            </div>
        </div>
        {#if Array.isArray(question.sub_score)}
            <div class="question-answer">
                <span class="answer-label piptap-content" style="width: auto;">
                    <p>【分值】</p>
                </span>
                <div class="answer-container">
                    {#each question.sub_score as score, index}
                        <span class="answer-label">({index})</span>
                        <input
                            type="number"
                            min="0"
                            step="0.5"
                            class="score-input"
                            bind:value={question.sub_score[index]}
                            oninput={handleScoreChange}
                            placeholder="分值"
                        />
                        <br />
                    {/each}
                </div>
            </div>
        {/if}
        {#if Array.isArray(question.answers)}
            <div class="question-answer">
                <span class="answer-label piptap-content" style="width: auto;">
                    <span style="margin-bottom:0px;">【答案】</span>
                </span>
                <div class="answer-container">
                    {#each question.answers as answer}
                        {#if typeof answer !== "string"}
                            <span class="answer-label">({answer.index})</span>
                            <span class="answer-content">{answer.answer}</span>
                            <br />
                            <div class="alternative_answers-container">
                                {#if answer.alternative_answers && answer.alternative_answers.length > 0}
                                    <span
                                        class="answer-label piptap-content"
                                        style="width: auto;"
                                    >
                                        <span>【备选答案】</span>
                                    </span>
                                    <div>
                                        {#each answer.alternative_answers as alternativeAnswer, index}
                                            <span class="answer-label"
                                                >{index + 1}.</span
                                            >
                                            <span class="answer-content"
                                                >{alternativeAnswer}</span
                                            >
                                            <br />
                                        {/each}
                                    </div>
                                {/if}
                            </div>
                        {/if}
                    {/each}
                </div>
            </div>
        {/if}
        {#if Array.isArray(question.tags) && question.tags.length > 0}
        <div class="question-tag">
            <span class="tag-label piptap-content" style="width: auto;">
                <span style="margin-bottom:0px;">【标签】</span>
            </span>
            <div>
                {#each question.tags as tag}
                    <UneditableTag content={tag}></UneditableTag>
                {/each}
            </div>
        </div>
        {/if}
        <div class="question-analysis">
            {#if question.analysis}
                <span
                    class="analysis-label piptap-content"
                    style="width: auto;"
                >
                    <span style="margin-bottom:0px;">【解析】</span>
                </span>
                <div class="analysis-content">
                    <div class="piptap-content">
                        {@html question.analysis}
                    </div>
                </div>
            {:else}
                <span
                    class="analysis-label piptap-content"
                    style="width: auto;"
                >
                    <span style="margin-bottom:0px;">【解析】</span>
                </span>
                <span
                    class="blank-analysis-label piptap-content"
                    style="width: auto;"
                >
                    <p>略</p>
                </span>
            {/if}
        </div>
    </fillBlank>
{/snippet}

<!--简答题-->
{#snippet shortAnswer(/** @type {PaperQuestion} */ question)}
    <shortAnswer class="shortAnswer">
        <div class="question-content">
            <div class="piptap-content">
                {@html question.content}
            </div>
        </div>
        {#if Array.isArray(question.sub_score)}
        <div class="question-answer">
            <span class="answer-label piptap-content" style="width: auto;">
                <span>【分值】</span>
            </span>
            <div class="answer-container">
                {#each question.sub_score as score, index}
                    <span class="answer-label">({index})</span>
                    <input
                        type="number"
                        min="0"
                        step="0.5"
                        class="score-input"
                        bind:value={question.sub_score[index]}
                        oninput={handleScoreChange}
                        placeholder="分值"
                    />
                    <br />
                {/each}
            </div>
        </div>
        {/if}
        {#if Array.isArray(question.answers)}
            <div class="question-answer">
                <span class="answer-label piptap-content" style="width: auto;">
                    <span style="margin-bottom:0px;">【答案】</span>
                </span>
                <div class="answer-container">
                    {#each question.answers as answer}
                        {#if typeof answer !== "string"}
                            <span class="answer-label">({answer.index})</span>
                            <span class="answer-content">{answer.answer}</span>
                            <br />
                        {/if}
                    {/each}
                </div>
            </div>
        {/if}
        {#if Array.isArray(question.tags) && question.tags.length > 0}
        <div class="question-tag">
            <span class="tag-label piptap-content" style="width: auto;">
                <span style="margin-bottom:0px;">【标签】</span>
            </span>
            <div>
                {#each question.tags as tag}
                    <UneditableTag content={tag}></UneditableTag>
                {/each}
            </div>
        </div>
        {/if}
        <div class="question-analysis">
            {#if question.analysis}
                <span
                    class="analysis-label piptap-content"
                    style="width: auto;"
                >
                    <span style="margin-bottom:0px;">【解析】</span>
                </span>
                <div class="analysis-content">
                    <div class="piptap-content">
                        {@html question.analysis}
                    </div>
                </div>
            {:else}
                <span
                    class="analysis-label piptap-content"
                    style="width: auto;"
                >
                    <span style="margin-bottom:0px;">【解析】</span>
                </span>
                <span
                    class="blank-analysis-label piptap-content"
                    style="width: auto;"
                >
                    <p>略</p>
                </span>
            {/if}
        </div>
    </shortAnswer>
{/snippet}

<div class="question-container">
    {#if question.type === "00"}
        {@render singlechoose(question)}
    {:else if question.type === "02"}
        {@render multiplechoice(question)}
    {:else if question.type === "04"}
        {@render trueFalse(question)}
    {:else if question.type === "06"}
        {@render fillBlank(question)}
    {:else if question.type === "08"}
        {@render shortAnswer(question)}
    {/if}
</div>

<style lang="scss" scoped>
    .question-container {
        background: #fff;
        padding: 20px;
        max-width: 100%;
        scrollbar-gutter: stable;

        .question-options {
            display: flex;
            flex-direction: column;
            gap: 10px;

            .option-container {
                margin-left: 20px;
                display: flex;
                align-items: center;
                border-radius: var(--border-radius-md);

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
                        border: 1px solid var(--green);
                        label {
                            color: var(--green);
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
                        border: 1px solid var(--green);
                        label {
                            color: var(--green);
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

        .score-input {
            margin-left: 5px;
            margin-right: 10px;
            width: 60px;
            padding: 2px 6px;
            border: 1px solid #ccc;
            border-radius: var(--input-border-radius);
            font-size: 0.85rem;
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
            min-height: 50px;

            & > div {
                scrollbar-width: none;
            }
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
