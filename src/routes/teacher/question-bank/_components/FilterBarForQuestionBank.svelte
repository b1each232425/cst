<!--
 * @Author: qjj qiaojunjie6@qq.com
 * @Date: 2025-07-24  19:31:15
 * @LastEditors: qjj qiaojunjie6@qq.com
 * @LastEditTime:  2025-07-24  19:31:15
 * @FilePath: \tutorial-platform-fe\src\lib\component\FilterBarForQuestionBank.svelte
 * @Description: 过滤器组件
 * @
-->
<script>
    /**
     * @type {{
     *  filter_title: string,   // 筛选标题
     *  all_filter_conditions: {
     *   value: any,      // 筛选条件
     *   label: string,     // 筛选条件名称
     * }[],                 // 筛选类型
     * onSelectTag?: (value:(string|number)[]) => void, // 选中某个条件时的回调函数
     * }}
     */
    let {
        filter_title,
        all_filter_conditions,
        onSelectTag = (value) => {
            console.log("选中条件" + value);
        },
    } = $props();

    /**
     * @description ICON集合
     */
    const ICON = {
        checkbox_slected: "/theory_question_bank/icons/checkbox_selected.svg",
        checkbox_unselected:
            "/theory_question_bank/icons/checkbox_unselected.svg",
    };

    /**
     * @description 题目筛选条件
     * @type {(string|number)[]}
     */
    let filter_condition = $state([]);
    /**
     * @description 题目筛选模式
     */
    let filter_muti_select_mode = $state(false);

    /**
     * @description 选择筛选条件
     * @param {{label:string,value:any}} condition 筛选条件
     */
    const onSlectFilterQuestion = (condition) => {
        if (!filter_muti_select_mode) {
            filter_condition = [condition.value];
            onSelectTag(filter_condition);
            return;
        }

        if (filter_condition.includes(condition.value)) {
            if (filter_condition.indexOf(condition.value) !== -1) {
                filter_condition.splice(
                    filter_condition.indexOf(condition.value),
                    1,
                );
            }
        } else {
            filter_condition.push(condition.value);
        }

        onSelectTag(filter_condition);
    };

    let hover_index = -1;
    /**
     * @description 选项容器
     */
    let itemContainer;
</script>

<div class="filterContainer">
    <div class="fileterTitle">
       {filter_title}
    </div>

    <div class="filterItemContainer">
        <button
            class="filterItem_single {filter_condition.length === 0
                ? 'active'
                : ''}"
            onclick={() => {
                filter_condition = [];
                onSelectTag(filter_condition);
            }}
        >
            <span class="fileterText">全部</span>
        </button>
        {#each all_filter_conditions as condition, index}
            <button
                class="{filter_muti_select_mode
                    ? 'filterItem_muti'
                    : 'filterItem_single'} {filter_condition.includes(
                    condition.value,
                )
                    ? 'active'
                    : ''}"
                onclick={() => onSlectFilterQuestion(condition)}
            >
                {#if filter_muti_select_mode}
                    {#if filter_condition.includes(condition.value)}
                        <svg
                            version="1.1"
                            xmlns:xlink="http://www.w3.org/1999/xlink"
                            viewBox="121 60  20 20"
                            xmlns="http://www.w3.org/2000/svg"
                        >
                            <path
                                d="M 121.5 60.5  L 140.5 60.5  L 140.5 79.5  L 121.5 79.5  L 121.5 60.5  Z "
                                fill-rule="nonzero"
                                fill="#ffffff"
                                stroke="none"
                                fill-opacity="0.996078431372549"
                            />
                            <path
                                d="M 121.5 60.5  L 140.5 60.5  L 140.5 79.5  L 121.5 79.5  L 121.5 60.5  Z "
                                stroke-width="1"
                                stroke="#0052d9"
                                fill="none"
                            />
                            <path
                                d="M 125.285714285714 70  L 129.571428571429 74.2857142857143  L 136.714285714286 64.2857142857143  "
                                stroke-width="4.28571428571429"
                                stroke="#0052d9"
                                fill="none"
                            />
                        </svg>
                    {:else}
                        <svg
                            version="1.1"
                            xmlns:xlink="http://www.w3.org/1999/xlink"
                            viewBox="121 60  20 20"
                            xmlns="http://www.w3.org/2000/svg"
                        >
                            <path
                                d="M 121.5 60.5  L 140.5 60.5  L 140.5 79.5  L 121.5 79.5  L 121.5 60.5  Z "
                                fill-rule="nonzero"
                                fill="#ffffff"
                                stroke="none"
                            />
                            <path
                                class="checkbox_unselected"
                                d="M 121.5 60.5  L 140.5 60.5  L 140.5 79.5  L 121.5 79.5  L 121.5 60.5  Z "
                                stroke-width="1"
                                stroke="#797979"
                                fill="none"
                            />
                        </svg>
                    {/if}
                {/if}
                <span class="fileterText">{condition.label}</span>
            </button>
        {/each}
        <button
            class="filterItem_single changeFilterTypeBtn {filter_muti_select_mode
                ? 'active'
                : ''}"
            onclick={() => {
                filter_muti_select_mode = !filter_muti_select_mode;
                filter_condition = [];
            }}
        >
            {#if filter_muti_select_mode}
                <span class="fileterText">取消多选</span>
            {:else}
                <span class="fileterText">+多选</span>
            {/if}
        </button>
    </div>
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

    .filterContainer {
        user-select: none;
        display: flex;
        flex-direction: column;
        .fileterText {
            overflow: hidden;
            text-overflow: ellipsis;
            font-size: 14px;
        }

        .fileterTitle {
            background-color: #f0f0f0;
            padding: 6px;
            border-radius: 10px;

            font-size: 16px;
            font-weight: 500 ;
        }

        .filterItemContainer {
            display: flex;
            font-size: 14px;
            flex-wrap: wrap;
            justify-content: start;
            margin-bottom: 10px;

            column-gap: 8px;
            .filterItem_single {
                display: flex;
                justify-content: center;
                align-items: center;
                min-width: calc(5em + 16px);
                margin-top: 5px;

                // transition: none;
                padding: 4px 8px;
                border-radius: 20px;
                box-sizing: border-box;
                border: 1px solid transparent;
                &:hover {
                    border: 1px solid rgba($color: #0052d9, $alpha: 0.8);
                    color: rgba($color: #0052d9, $alpha: 0.8);
                }

                &.active {
                    border: 1px solid rgba($color: #0052d9, $alpha: 1);
                    color: rgba($color: #0052d9, $alpha: 1);
                }
            }

            .filterItem_muti {
                display: flex;
                justify-content: center;
                align-items: center;
                min-width: calc(5em + 16px);
                margin-top: 5px;

                padding: 4px 0px;

                border-radius: 20px;

                box-sizing: border-box;
                border: 1px solid transparent;
                &:hover {
                    color: rgba($color: #0052d9, $alpha: 0.8);
                    .checkbox_unselected {
                        stroke: rgba($color: #0052d9, $alpha: 0.8);
                    }
                }

                &.active {
                    color: rgba($color: #0052d9, $alpha: 1);
                }

                & svg {
                    width: 15px;
                    height: 15px;
                    margin-right: 5px;
                }
            }

            .changeFilterTypeBtn {
                border-radius: 8px;
                border: #0336ff 1px solid;
                color: #0336ff;
                background-color: rgba($color: #0336ff, $alpha: 0.2);
            }
        }
    }
</style>
