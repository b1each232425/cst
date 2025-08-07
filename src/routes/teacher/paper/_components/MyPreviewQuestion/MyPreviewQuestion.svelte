<!--
 * @Author: WangKaidun 1597225095@qq.com
 * @Date: 2025-08-07 11:38:33
 * @LastEditors: WangKaidun 1597225095@qq.com
 * @LastEditTime: 2025-08-07 11:56:42
 * @FilePath: \exam\src\routes\teacher\paper\_components\MyPreviewQuestion\MyPreviewQuestion.svelte
 * @Description: 预览题目组件
 * @Copyright (c) 2025 by WangKaidun 1597225095@qq.com, All Rights Reserved. 
-->
<script>
  import InputBox from "$lib/components/Input/InputBox.svelte";
  import UneditableTag from "$lib/components/Tag/UneditableTag.svelte";
  import { filter } from "jszip";

    let { question } = $props();    // 题目

    // 过滤<p></p>标签
    function filterPTag(content) {
        return content.replace(/<p[^>]*>([\s\S]*?)<\/p>/g, '$1<br>');
    }

</script>

<div class="question-container">
    <!-- 单选题 -->
    {#if question.type === "00"}
        <!-- 题目 -->
        <div class="question-content">
            <!-- 问题 -->
            <div class="content">
                {@html filterPTag(question.content)}
            </div>

            <!-- 选项 -->
            <div class="options-container">
                {#each question.options as option}
                    <div class="option">
                        <div class={question.answers.includes(option.label)?"option-label-true":"option-label-false"}>{option.label}</div>
                        <div class="option-value">{@html filterPTag(option.value)}</div>
                    </div>
                {/each}
            </div>
        </div>

        <!-- 答案 -->
        <div class="answer-container">
            <span class="prompt">【答案】</span>
            <div class="content-box">
                {#each question.answers as answer}
                    {answer}
                {/each}
            </div>
        </div>

        <!-- 标签 -->
        {#if question.tags.length !== 0}
            <div class="tags-container">
                <span class="prompt">【标签】</span>
                <div class="content-box">
                    {#each question.tags as tag}
                        <UneditableTag content={tag}/>
                    {/each}
                </div>
            </div>
        {/if}

        <!-- 解析 -->
        <div class="analysis-container">
            <span class="prompt">【解析】</span>
            <div class="content-box">
                {#if question.analysis}
                    {@html filterPTag(question.analysis)}
                {:else}
                    略
                {/if}
            </div>
        </div>
    {/if}

    <!-- 多选题 -->
    {#if question.type === "02"}
        <!-- 题目 -->
        <div class="question-content">
            <!-- 问题 -->
            <div class="content">
                {@html filterPTag(question.content)}
            </div>

            <!-- 选项 -->
            <div class="options-container">
                {#each question.options as option}
                    <div class="option">
                        <div class={question.answers.includes(option.label)?"option-label-true":"option-label-false"} style="border-radius: 20%;">{option.label}</div>
                        <div class="option-value">{@html filterPTag(option.value)}</div>
                    </div>
                {/each}
            </div>
        </div>

        <!-- 答案 -->
        <div class="answer-container">
            <span class="prompt">【答案】</span>
            <div class="content-box">
                {#each question.answers as answer}
                    {answer}
                {/each}
            </div>
        </div>

        <!-- 标签 -->
        {#if question.tags.length !== 0}
            <div class="tags-container">
                <span class="prompt">【标签】</span>
                <div class="content-box">
                    {#each question.tags as tag}
                        <UneditableTag content={tag}/>
                    {/each}
                </div>
            </div>
        {/if}

        <!-- 解析 -->
        <div class="analysis-container">
            <span class="prompt">【解析】</span>
            <div class="content-box">
                {#if question.analysis}
                    {@html filterPTag(question.analysis)}
                {:else}
                    略
                {/if}
            </div>
        </div>
    {/if}

    <!-- 判断题 -->
    {#if question.type === "04"}
        <!-- 题目 -->
        <div class="question-content">
            <!-- 问题 -->
            <div class="content">
                {@html filterPTag(question.content)}
            </div>

            <!-- 选项 -->
            <div class="options-container">
                {#each question.options as option}
                    <div class="option">
                        <div class={question.answers.includes(option.label)?"option-label-true":"option-label-false"}>{option.label}</div>
                        <div class="option-value">{@html filterPTag(option.value)}</div>
                    </div>
                {/each}
            </div>
        </div>

        <!-- 答案 -->
        <div class="answer-container">
            <span class="prompt">【答案】</span>
            <div class="content-box">
                {#each question.answers as answer}
                    {answer}
                {/each}
            </div>
        </div>

        <!-- 标签 -->
        {#if question.tags.length !== 0}
            <div class="tags-container">
                <span class="prompt">【标签】</span>
                <div class="content-box">
                    {#each question.tags as tag}
                        <UneditableTag content={tag}/>
                    {/each}
                </div>
            </div>
        {/if}

        <!-- 解析 -->
        <div class="analysis-container">
            <span class="prompt">【解析】</span>
            <div class="content-box">
                {#if question.analysis}
                    {@html filterPTag(question.analysis)}
                {:else}
                    略
                {/if}
            </div>
        </div>
    {/if}
    
    <!-- 填空题 -->
    {#if question.type === "06"}
        <!-- 题目 -->
        <div class="question-content">
            <!-- 问题 -->
            <div class="content">
                {@html filterPTag(question.content)}
            </div>

            <!-- 选项 -->
            <div class="options-container">
                {#each question.options as option}
                    <div class="option">
                        <div class={question.answers.includes(option.label)?"option-label-true":"option-label-false"}>{option.label}</div>
                        <div class="option-value">{@html filterPTag(option.value)}</div>
                    </div>
                {/each}
            </div>
        </div>

        <!-- 分值 -->
        <div class="score-container">
            <span class="prompt">【分值】</span>

        </div>

        <!-- 答案 -->
        <div class="answer-container">
            <span class="prompt">【答案】</span>
            <div class="content-box">
                {#each question.answers as answer}
                <div>
                    <span class="sequence">({answer.index})</span>
                    <span>{answer.answer}</span>
                </div>
                {/each}
            </div>
        </div>

        <!-- 标签 -->
        {#if question.tags.length !== 0}
            <div class="tags-container">
                <span class="prompt">【标签】</span>
                <div class="content-box">
                    {#each question.tags as tag}
                        <UneditableTag content={tag}/>
                    {/each}
                </div>
            </div>
        {/if}

        <!-- 解析 -->
        <div class="analysis-container">
            <span class="prompt">【解析】</span>
            <div class="content-box">
                {#if question.analysis}
                    {@html filterPTag(question.analysis)}
                {:else}
                    略
                {/if}
            </div>
        </div>
    {/if}

    <!-- 简答题 -->
    {#if question.type === "08"}
        <!-- 题目 -->
        <div class="question-content">
            <!-- 问题 -->
            <div class="content">
                {@html filterPTag(question.content)}
            </div>

            <!-- 选项 -->
            <div class="options-container">
                {#each question.options as option}
                    <div class="option">
                        <div class={question.answers.includes(option.label)?"option-label-true":"option-label-false"}>{option.label}</div>
                        <div class="option-value">{@html filterPTag(option.value)}</div>
                    </div>
                {/each}
            </div>
        </div>

        <!-- 分值 -->
        <div class="score-container">
            <span class="prompt">【分值】</span>
            <div class="content-box">
                {#each question.sub_score as score, index}
                    <span class="sequence">({index+1})</span>
                    <InputBox />
                {/each}
            </div>
        </div>

        <!-- 答案 -->
        <div class="answer-container">
            <span class="prompt">【答案】</span>
            <div class="content-box">
                {#each question.answers as answer, index}
                <div>
                    <span class="sequence">({index+1})</span>
                    <span>{answer}</span>
                </div>
                {/each}
            </div>
        </div>

        <!-- 标签 -->
        {#if question.tags.length !== 0}
            <div class="tags-container">
                <span class="prompt">【标签】</span>
                <div class="content-box">
                    {#each question.tags as tag}
                        <UneditableTag content={tag}/>
                    {/each}
                </div>
            </div>
        {/if}

        <!-- 解析 -->
        <div class="analysis-container">
            <span class="prompt">【解析】</span>
            <div class="content-box">
                {#if question.analysis}
                    {@html filterPTag(question.analysis)}
                {:else}
                    略
                {/if}
            </div>
        </div>
    {/if}
</div>

<style>
    
    .question-container {

        /* 题目 */
        .question-content {

            /* 问题 */
            .content {
                padding: 0 12px;
                margin-bottom: 24px;
            }
            
            /* 选项 */
            .options-container {
                display: flex;
                flex-direction: column;
                gap: 10px;

                .option {
                    display: flex;
                    padding: 0 12px;

                    /* 图标 */
                    .option-label-true, .option-label-false {
                        border-radius: 50%;
                        width: 30px;
                        height: 30px;
                        display: flex;
                        justify-content: center;
                        align-items: center;
                        margin-right: 10px;
                        font-weight: 500;
                        font-size: 0.8rem;
                        font-family: Arial, Helvetica, sans-serif;
                    }

                    /* 正确选项 */
                    .option-label-true {
                        border: 1px solid var(--green);
                        background-color: #e8f8f2;
                        color: var(--green);
                    }

                    /* 普通选项 */
                    .option-label-false {
                        border: 1px solid var(--border-medium);
                        color: #444;
                    }
    
                    /* 内容 */
                    .option-value {
                        padding-top: 4px;
                    }
                }
            }
        }

        /* 提示词 */
        .prompt {
            font-size: 14px;
            color: #619cf5;
            margin-right: 10px;
            padding-top: 2px;
        }

        .answer-container, .tags-container, .analysis-container, .score-container {
            display: flex;
        }

        /* 分值 */
        .score-container {
            background:linear-gradient(to right, #ddd 0%, #ddd 8px, transparent 8px, transparent 15px) repeat-x bottom;
            background-size: 15px 2px;
            padding: 12px 0;
        }

        /* 答案 */
        .answer-container {
            background:linear-gradient(to right, #ddd 0%, #ddd 8px, transparent 8px, transparent 15px) repeat-x bottom;
            background-size: 15px 2px;
            padding: 12px 0;

            /* 序号 */
            .sequence {
                color: #619cf5;
                font-size: 14px;
            }

            .content-box {

            }
        }

        /* 标签 */
        .tags-container {
            background:linear-gradient(to right, #ddd 0%, #ddd 8px, transparent 8px, transparent 15px) repeat-x bottom;
            background-size: 15px 2px;
            padding: 12px 0;

            .content-box {
                display: flex;
                gap: 6px;
                overflow-y: auto;
            }
        }

        /* 解析 */
        .analysis-container {
            padding: 12px 0;
        }
    }

</style>