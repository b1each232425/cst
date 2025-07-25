<!--
 * @Author: MIOZD && l317101@163.com
 * @Date: 2025-04-10 16:31:15
 * @LastEditors: MIOZD && l317101@163.com
 * @LastEditTime: 2025-05-25 16:29:12
 * @FilePath: \tutorial-platform-fe\src\lib\component\ListTableForQuestionBank.svelte
 * @Description: 列表表格组件
 * @
-->
<script>
    import Pagination from "$lib/component/Pagination.svelte";
    import { TheoryQuestion } from "../../routes/teacher/questionBank/theory/types";
    import UneditableTags from "$lib/component/UneditableTag.svelte";
    /**
     * @type {{
     *      question_data: TheoryQuestion[],                                //  题目数据
     *      data_num_per_page_options?: { value: number, label: string }[], //  每页数据数量
     *      tableWidth?: string,                                            //  表格宽度
     *      question_types?: Map<string, string>;                           //  题目类型
     *      onEdit?:(question:TheoryQuestion)=>void;                        //  编辑题目
     *      onCopy?:(question:TheoryQuestion)=>void;                        //  复制题目
     *      onDelete?:(question:TheoryQuestion)=>void;                      //  删除题目
     *      update_filtered_question_count?: (count:number)=>void;          //  更新筛选题目数
     *      onListItemClick?:(question:TheoryQuestion)=>void;               //  点击题目
     *  }}
     *
     */
    let {
        question_data,
        data_num_per_page_options = [
            {
                value: 10,
                label: "10条/页",
            },
            {
                value: 15,
                label: "15条/页",
            },
            {
                value: 20,
                label: "20条/页",
            },
        ],
        tableWidth = "100%",
        question_types,
        update_filtered_question_count = (
            /**
             * @type {number}
             */
            count,
        ) => {
            console.log("筛选题目数：" + count);
        },
        onEdit = (
            /**
             * @type {TheoryQuestion}
             */
            question,
        ) => {
            console.log("编辑第" + question.id + "题");
        },
        onCopy = (
            /**
             * @type {TheoryQuestion}
             */
            question,
        ) => {
            console.log("复制第" + question.id + "题");
        },
        onDelete = (
            /**
             * @type {TheoryQuestion}
             */
            question,
        ) => {
            console.log("删除第" + question.id + "题");
        },
        onListItemClick = (
            /**
             * @type {TheoryQuestion}
             */
            question,
        ) => {
            console.log("删除第" + question.id + "题");
        },
    } = $props();

    const ICON = {
        ascending_order: "/theory_question_bank/icons/ascending_order.svg",
        descending_order: "/theory_question_bank/icons/descending_order.svg",
        no_order: "/theory_question_bank/icons/no_order.svg",
    };

    /**
     * @description 每页数据数量
     * @type {number}
     */
    let data_per_page = $state(data_num_per_page_options[0].value);

    /**
     * @description 当前页码
     */
    let current_page = $state(1);

    /**
     * @description 表格宽数值
     * @type {number}
     */
    let tableWidthNumber = 0;
    if (tableWidth.includes("px") && !tableWidth.includes("calc")) {
        tableWidthNumber = Number(tableWidth.replace("px", ""));
    }

    /**
     * @description 表格排序条件
     */
    let sort_field = $state("");

    /**
     * @description 表格排序方式
     */
    let sort_order = $state("desc");

    /**
     * @param pattern {string}
     */
    const buildKMPFailureTable = (pattern) => {
        const failure = new Array(pattern.length).fill(0);
        let j = 0;
        for (let i = 1; i < pattern.length; i++) {
            while (j > 0 && pattern[i] !== pattern[j]) j = failure[j - 1];
            if (pattern[i] === pattern[j]) failure[i] = ++j;
            else failure[i] = 0;
        }
        return failure;
    };

    /**
     * @param text {string}
     * @param pattern {string}
     */
    function calculateMaxMatchScore(text, pattern) {
        if (!pattern.length) return 0;

        const failure = buildKMPFailureTable(pattern);
        let currentLen = 0,
            maxScore = 0;

        for (const char of text) {
            while (currentLen > 0 && char !== pattern[currentLen]) {
                currentLen = failure[currentLen - 1];
            }
            if (char === pattern[currentLen]) {
                currentLen++;
                maxScore = Math.max(maxScore, currentLen);
                if (currentLen === pattern.length) break; // 完全匹配时提前退出
            }
        }
        return maxScore;
    }

    /**
     * @description 提取文本
     * @param htmlString {string}
     */
    const extractTextFromHTML = (htmlString) => {
        return htmlString
            .replace(/<\/?[^>]+>/g, "")
            .replace(/&lt;/g, "<")
            .replace(/&gt;/g, ">")
            .replace(/&nbsp;/g, " ")
            .trim();
    };

    /**
     * @description 过滤题目文本
     * @param question_data {TheoryQuestion[]} 题目数据
     * @param search_question_content {string} 搜索内容
     */
    const filterQuestionText = (
        question_data,
        search_question_content = "",
    ) => {
        let filtered = $state.snapshot(question_data);
        if (search_question_content && search_question_content !== "") {
            filtered = filtered
                .map((item) => ({
                    item,
                    score: calculateMaxMatchScore(
                        extractTextFromHTML(item.content),
                        search_question_content,
                    ),
                }))
                .filter(({ score }) => score > 0)
                .sort((a, b) => b.score - a.score)
                .map(({ item }) => item);
        }

        return filtered;
    };

    /**
     * @description 过滤题目标签
     * @param question_data {TheoryQuestion[]} 题目数据
     * @param question_filter_conditions {{
     *            type: string[],
     *           difficulty: number[],
     *           tags: string[],
     *        }} 题目筛选条件
     */
    const filterTags = (
        question_data,
        question_filter_conditions = {
            type: [],
            difficulty: [],
            tags: [],
        },
    ) => {
        const {
            type: typeFilters,
            difficulty: diffFilters,
            tags: tagFilters,
        } = question_filter_conditions;

        const typeSet = new Set(typeFilters);
        const diffSet = new Set(diffFilters);
        const tagSet = new Set(tagFilters);

        const isTypeFilter = typeFilters.length > 0;
        const isDiffFilter = diffFilters.length > 0;
        const isTagFilter = tagFilters.length > 0;

        // 过滤符合条件的元素
        const filtered = question_data.filter((q) => {
            // 检查类型条件
            if (isTypeFilter && !typeSet.has(q.type)) return false;
            // 检查难度条件
            if (isDiffFilter && !diffSet.has(q.difficulty)) return false;
            // 检查标签条件：至少有一个标签匹配
            if (
                isTagFilter &&
                !q.tags.some(
                    (
                        /**
                         * @type {string}
                         */
                        tag,
                    ) => tagSet.has(tag),
                )
            )
                return false;
            return true;
        });

        /**
         * @description 计算匹配点数
         * @param q {TheoryQuestion} 题目
         */
        const calculatePoints = (q) => {
            let points = 0;
            if (isTypeFilter && typeSet.has(q.type)) points++;
            if (isDiffFilter && diffSet.has(q.difficulty)) points++;
            if (isTagFilter && q.tags instanceof Array) {
                q.tags.forEach(
                    (
                        /**
                         * @type {string}
                         */
                        tag,
                    ) => {
                        tagSet.has(tag);
                        points++;
                    },
                );
            }
            return points;
        };

        // 按匹配点数降序排序
        filtered.sort((a, b) => {
            return calculatePoints(b) - calculatePoints(a);
        });

        return filtered;
    };

    // 排序顺序
    const orderQuestionData = (
        /**
         * @type {TheoryQuestion[]}
         */
        filtered,
    ) => {
        if (sort_field === "update_time") {
            filtered.sort((a, b) => {
                return sort_order === "asc"
                    ? b.update_time - a.update_time
                    : a.update_time - b.update_time;
            });
        } else if (sort_field === "score") {
            filtered.sort((a, b) => {
                return sort_order === "asc"
                    ? b.score - a.score
                    : a.score - b.score;
            });
        } else if (sort_field === "difficulty") {
            filtered.sort((a, b) => {
                return sort_order === "asc"
                    ? b.difficulty - a.difficulty
                    : a.difficulty - b.difficulty;
            });
        }

        return filtered;
    };

    /**
     * @description 筛选后数据
     * @type {TheoryQuestion[]}
     */
    let question_data_filtered = $state([]);

    /**
     * @description 筛选题目
     * @param question_filter_conditions {{
     *         type: string[],
     *         difficulty: number[],
     *         tags: string[],
     * }} 筛选条件
     * @param search_question_content {string} 搜索内容
     */
    export const updateFilteredQuestion = (
        question_filter_conditions,
        search_question_content,
    ) => {
        question_data_filtered = filterQuestionText(
            filterTags(question_data, question_filter_conditions),
            search_question_content,
        );

        sort_field = "";
    };

    /**
     * @description 排序筛选后题目
     */
    export const orderFilteredQuestion = () => {
        orderQuestionData(question_data_filtered);
    };

    // 筛选后题目数
    let totalItems = $derived(question_data_filtered.length);
    $effect(() => {
        update_filtered_question_count(totalItems);
    });

    // 筛选后页数
    let totalPages = $derived.by(() => {
        return Math.ceil(
            totalItems / $state.snapshot(data_num_per_page_options[0].value),
        );
    });

    /**
     * @description 所有题目的纯文本标题
     * @type {string[]}
     */
    let qeustions_content = $derived.by(() => {
        return question_data_filtered.map((question) =>
            extractTextFromHTML(question.content),
        );
    });

    /**
     * @description 分页数据
     */
    let paginatedQuestions = $derived.by(() => {
        return question_data_filtered.slice(
            (current_page - 1) * data_per_page,
            current_page * data_per_page,
        );
    });

    /**
     * @description 更新题目数据
     */
    export const updateData = () => {
        question_data_filtered = $state.snapshot(question_data);
    };
</script>

{#snippet headRow()}
    <tr style="height: fit-content;">
        <th class="questionType">题型</th>
        <th class="questionTitle">题目</th>
        <th class="questionScore sortable">
            <div>
                <button
                    class="orderBtn"
                    onclick={() => {
                        sort_field = "score";

                        if (sort_order === "asc") {
                            sort_order = "desc";
                        } else {
                            sort_order = "asc";
                        }
                        orderFilteredQuestion();
                    }}
                >
                    <span>分值</span>
                    <svg
                        viewBox="0 0 1024 1024"
                        version="1.1"
                        xmlns:xlink="http://www.w3.org/1999/xlink"
                        style="width: 20px;height:20px;"
                    >
                        <path
                            d="M480.32 865.536l-206.592-198.848a45.696 45.696 0 0 1 31.68-78.656h413.184a45.696 45.696 0 0 1 31.68 78.656l-206.592 198.848a45.696 45.696 0 0 1-63.36 0z"
                            fill={sort_field === "score"
                                ? sort_order === "asc"
                                    ? "#cdcdcd"
                                    : "#444"
                                : "#cdcdcd"}
                        ></path>
                        <path
                            d="M480.32 222.528L273.728 421.376a45.696 45.696 0 0 0 31.68 78.656h413.184a45.696 45.696 0 0 0 31.68-78.72L543.68 222.592a45.696 45.696 0 0 0-63.36 0z"
                            fill={sort_field === "score"
                                ? sort_order === "asc"
                                    ? "#444"
                                    : "#cdcdcd"
                                : "#cdcdcd"}
                        ></path>
                    </svg>
                </button>
            </div>
        </th>
        <th class="difficultyTag sortable">
            <div>
                <button
                    class="orderBtn"
                    onclick={() => {
                        sort_field = "difficulty";

                        if (sort_order === "asc") {
                            sort_order = "desc";
                        } else {
                            sort_order = "asc";
                        }
                        orderFilteredQuestion();
                    }}
                >
                    <span>难度</span>
                    <svg
                        viewBox="0 0 1024 1024"
                        version="1.1"
                        xmlns:xlink="http://www.w3.org/1999/xlink"
                        style="width: 20px;height:20px;"
                    >
                        <path
                            d="M480.32 865.536l-206.592-198.848a45.696 45.696 0 0 1 31.68-78.656h413.184a45.696 45.696 0 0 1 31.68 78.656l-206.592 198.848a45.696 45.696 0 0 1-63.36 0z"
                            fill={sort_field === "difficulty"
                                ? sort_order === "asc"
                                    ? "#cdcdcd"
                                    : "#444"
                                : "#cdcdcd"}
                        ></path>
                        <path
                            d="M480.32 222.528L273.728 421.376a45.696 45.696 0 0 0 31.68 78.656h413.184a45.696 45.696 0 0 0 31.68-78.72L543.68 222.592a45.696 45.696 0 0 0-63.36 0z"
                            fill={sort_field === "difficulty"
                                ? sort_order === "asc"
                                    ? "#444"
                                    : "#cdcdcd"
                                : "#cdcdcd"}
                        ></path>
                    </svg>
                </button>
            </div>
        </th>
        <th class="questionTags">标签</th>
        <th class="updateTime sortable">
            <div>
                <button
                    class="orderBtn"
                    onclick={() => {
                        sort_field = "update_time";

                        if (sort_order === "asc") {
                            sort_order = "desc";
                        } else {
                            sort_order = "asc";
                        }
                        orderFilteredQuestion();
                    }}
                >
                    <span>更新时间</span>
                    <svg
                        viewBox="0 0 1024 1024"
                        version="1.1"
                        xmlns:xlink="http://www.w3.org/1999/xlink"
                        style="width: 20px;height:20px;"
                    >
                        <path
                            d="M480.32 865.536l-206.592-198.848a45.696 45.696 0 0 1 31.68-78.656h413.184a45.696 45.696 0 0 1 31.68 78.656l-206.592 198.848a45.696 45.696 0 0 1-63.36 0z"
                            fill={sort_field === "update_time"
                                ? sort_order === "asc"
                                    ? "#cdcdcd"
                                    : "#444"
                                : "#cdcdcd"}
                        ></path>
                        <path
                            d="M480.32 222.528L273.728 421.376a45.696 45.696 0 0 0 31.68 78.656h413.184a45.696 45.696 0 0 0 31.68-78.72L543.68 222.592a45.696 45.696 0 0 0-63.36 0z"
                            fill={sort_field === "update_time"
                                ? sort_order === "asc"
                                    ? "#444"
                                    : "#cdcdcd"
                                : "#cdcdcd"}
                        ></path>
                    </svg>
                </button>
            </div>
        </th>
        <th class="operations">操作</th>
    </tr>
{/snippet}

{#snippet commonRow(
    /**
     * @type {TheoryQuestion}
     */
    question,
    /**
     * @type {number}
     */
    index,
)}
    <tr class="commonRow" onclick={() => onListItemClick(question)}>
        <td style="cursor:pointer;"
            >{question_types !== undefined
                ? question_types.get(question.type)
                : question.type}题</td
        >
        <td style="cursor:pointer;">{qeustions_content[index]}</td>
        <td style="cursor:pointer;">{question.score}</td>
        <td style="cursor:pointer;">
            <span
                class={question.difficulty === 1
                    ? "label_easy"
                    : question.difficulty === 2
                      ? "label_medium"
                      : "label_hard"}
            >
                {question.difficulty === 1
                    ? "简单"
                    : question.difficulty === 2
                      ? "中等"
                      : "困难"}
            </span>
        </td>
        <td style="overflow:hidden;text-overflow:ellipsis;cursor:pointer;">
            <div class="tags-container">
                {#each question.tags as tag}
                    <UneditableTags content={tag} />
                {/each}
            </div>
        </td>
        <td style="cursor:pointer;">{question.update_time_str}</td>
        <td
            onclick={(e) => {
                e.stopPropagation();
            }}
        >
            <div class="controlBtns">
                <button style="color: #0036ff;" onclick={() => onEdit(question)}
                    >编辑</button
                >
                <button style="color: #0036ff;" onclick={() => onCopy(question)}
                    >复制</button
                >
                <button
                    style="color: #FF000F;"
                    onclick={() => onDelete(question)}>删除</button
                >
            </div>
        </td>
    </tr>
{/snippet}

<div class="questionListTableContainer">
    <div>
        {#if question_data_filtered.length !== 0}
            <table style="width: {tableWidth};border-collapse: collapse;">
                <thead>
                    {@render headRow()}
                </thead>
                <tbody>
                    {#each paginatedQuestions as question, index}
                        {@render commonRow(question, index)}
                    {/each}
                    {#if paginatedQuestions.length < data_per_page}
                        <!-- 空行占位 -->
                        <tr class="placeholderRow"> </tr>
                    {/if}
                </tbody>
            </table>
        {:else}
            <div style="display: flex;flex:1;flex-direction:column;">
                <table style="width: {tableWidth};border-collapse: collapse;">
                    <thead>
                        {@render headRow()}
                    </thead>
                </table>
                <div
                    style="
                    display: flex;
                    justify-content: center;
                    align-items: center;
                    flex:1;
                    font-size: 36px;
                    font-weight: 900;
                    color: #999999;
                    user-select: none;
                "
                >
                    暂无题目
                </div>
            </div>
        {/if}
    </div>
    {#if question_data.length !== 0}
        <div style="display: flex;width:100%;justify-content:flex-end;">
            <div style="margin-right:15px;">
                <Pagination
                    current_page_num={current_page}
                    total_data_num={question_data_filtered.length}
                    total_page_num={Math.ceil(
                        question_data_filtered.length / data_per_page,
                    )}
                    {data_num_per_page_options}
                    selected={data_per_page}
                    onPageChangeFunc={(is_next) => {
                        if (is_next) {
                            if (
                                current_page ===
                                Math.ceil(
                                    question_data_filtered.length /
                                        data_per_page,
                                )
                            ) {
                                return;
                            }

                            current_page = current_page + 1;
                            paginatedQuestions = question_data_filtered.slice(
                                (current_page - 1) * data_per_page,
                                current_page * data_per_page,
                            );
                        } else {
                            if (current_page === 1) {
                                return;
                            }

                            current_page = current_page - 1;
                            paginatedQuestions = question_data_filtered.slice(
                                (current_page - 1) * data_per_page,
                                current_page * data_per_page,
                            );
                        }
                    }}
                    onPageChooseFunc={(page_num) => {
                        current_page = page_num;
                        paginatedQuestions = question_data_filtered.slice(
                            (current_page - 1) * data_per_page,
                            current_page * data_per_page,
                        );
                    }}
                    onPageSearchFunc={(
                        /**
                         * @description 搜索页码
                         * @type {string}
                         */
                        page_num,
                    ) => {
                        current_page = Number(page_num);
                        if (current_page > totalPages) {
                            current_page = totalPages;
                        }
                        if (current_page < 1) {
                            current_page = 1;
                        }
                        paginatedQuestions = question_data_filtered.slice(
                            (current_page - 1) * data_per_page,
                            current_page * data_per_page,
                        );
                    }}
                    selectOptionFunc={(value) => {
                        data_per_page = Number(value);
                        paginatedQuestions = question_data_filtered.slice(
                            (current_page - 1) * data_per_page,
                            current_page * data_per_page,
                        );
                    }}
                    expand_direction={"up"}
                ></Pagination>
            </div>
        </div>
    {/if}
</div>

<style lang="scss" scoped>
    button {
        margin: 0px;
        padding: 0px;
        border: 0px;
        background-color: transparent;
        cursor: pointer;
        user-select: none;

        transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        transform: translateY(0);

        &:focus {
            outline: none;
        }
    }

    span {
        font-family: PingFang FC;
    }

    .orderBtn {
        display: flex;
        justify-content: center;
        align-items: center;
        width: 100%;
        height: 100%;
        position: relative;

        span {
            display: flex;
        }

        svg {
            position: absolute;
            right: 0;
        }

        font-size: 14px;

        font-weight: bold;
        unicode-bidi: isolate;
    }

    .questionListTableContainer {
        flex: 1;
        display: flex;
        flex-direction: column;
        margin-top: 10px;
        overflow: hidden;
        min-height: 0;

        & > div:first-child {
            flex: 1;
            min-height: 0;
            overflow: auto;
            display: flex;
            flex-direction: column;

            scrollbar-gutter: stable both-edges;
        }

        & > div:last-child {
            margin-top: 10px;
        }

        table {
            width: 100%;
            table-layout: fixed;
            border-collapse: separate;
            border-spacing: 0;

            thead {
                top: 0;
                position: sticky;
                z-index: 1;
                background-color: #f8f9fa;
                box-shadow: 0 2px 8px rgba(0, 0, 0, 0.03);

                &::after {
                    content: "";
                    position: absolute;
                    left: 0;
                    bottom: -1px;
                    width: 100%;
                    height: 1px;
                    background: #dee2e6;
                }
            }

            tbody {
                position: relative;
                tr {
                    transition: background-color 0.2s ease;
                }
            }

            tbody tr:hover {
                background-color: #f1f3f5;
            }

            tr.commonRow {
                border-bottom: 1px solid #ececec;
            }

            .placeholderRow {
                border: 0px;
                height: 100%;
                display: table-row;

                &:hover {
                    background-color: transparent;
                }
                &::after {
                    content: "";
                    display: block;
                    height: 100%;
                }
            }

            th {
                background-color: #f8f9fa;
                box-sizing: border-box;
                font-size: 14px;
                font-weight: 600;
                color: #495057;
                padding: 12px 8px;
                text-transform: capitalize;
            }

            td {
                padding: 12px 8px;
                border: none;
                text-align: center;
                color: #6c757d;
                word-break: break-word;
                font-size: 14px;
                background-clip: padding-box;

                .tags-container {
                    display: flex;
                    flex-wrap: wrap;
                    gap: 6px;
                    justify-content: center;
                    align-items: flex-start;

                    .tag {
                        background: #e9ecef;
                        padding: 4px 8px;
                        border-radius: 4px;
                        font-size: 0.85em;
                        color: #495057;
                    }
                }
            }

            .controlBtns {
                display: flex;
                flex-wrap: wrap;
                gap: 6px;
                justify-content: space-evenly;
                align-items: center;
            }


            tr:nth-child(even) td {
                background-color: #fcfcfc;
            }
        }
    }

    .label_easy {
        color: rgb(4, 217, 25);
    }

    .label_medium {
        color: rgb(200, 205, 0);
    }

    .label_hard {
        color: #ff0000;
    }

    .questionType {
        width: 10%;
    }

    .questionTitle {
        width: 255px;
    }

    .difficultyTag {
        width: 10%;
        div {
            display: flex;
            justify-content: start;
            align-items: center;
        }
    }

    .questionScore {
        width: 10%;
        div {
            display: flex;
            justify-content: start;
            align-items: center;
        }
    }

    .questionTags {
        width: 10%;
    }

    .updateTime {
        width: 15%;
        div {
            display: flex;
            justify-content: start;
            align-items: center;
        }
    }

    .operations {
        width: 20%;
    }
</style>
