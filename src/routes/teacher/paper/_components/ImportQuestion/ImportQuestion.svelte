<!--
 * @Author: WangKaidun 1597225095@qq.com
 * @Date: 2025-08-01 21:09:59
 * @LastEditors: WangKaidun 1597225095@qq.com
 * @LastEditTime: 2025-08-07 11:34:36
 * @FilePath: \exam\src\routes\teacher\paper\_components\ImportQuestion\ImportQuestion.svelte
 * @Description: 从题库导入题目组件
 * @Copyright (c) 2025 by WangKaidun 1597225095@qq.com, All Rights Reserved. 
-->
<script>
    import Button from "$lib/components/Button/Button.svelte";
    import InputBox from "$lib/components/Input/InputBox.svelte";
    import Pagination from "$lib/components/Pagination/Pagination.svelte";
    import Empty from "$lib/components/Table/Empty.svelte";
    import UneditableTag from "$lib/components/Tag/UneditableTag.svelte";
    import { debounce } from "$lib/utils/optimize";
    import { onMount } from "svelte";
    import { DIFFICULTY_TRANS, QUESTION_TYPE_TRANS } from "../../_utils/tool";
    import { toast } from "$lib/components/Toast/Toast";
    import { get } from "svelte/store";
    import { CURRENT_PAPER_ID } from "../../_stores/store";
    import { formatTimestamp } from "$lib/utils/time_utils";

    /******************* API 区 *******************/

    // 获取题库列表
    export function fetchQuestionBankList(
        bankKeyWord = "", 
        bankPage = "",
        bankPageSize = "",
        bankBankID = ""
    ){
        const PARAMS = new URLSearchParams();

        if (bankKeyWord) PARAMS.append("keyword", bankKeyWord);
        if (bankPage) PARAMS.append("page", bankPage);
        if (bankPageSize) PARAMS.append("pageSize", bankPageSize);
        if (bankBankID) PARAMS.append("bankID", bankBankID);

        return fetch(`/api/question-banks?${PARAMS.toString()}`, {
            method: "GET",
            credentials: "include"
        })
            .then(response => {
                if (!response.ok) {
                    throw new Error(`请求失败，状态码：${response.status}`);
                }
                return response.json();
            })
            .then(data => {
                return data;
            })
            .catch(error => {
                console.error('获取题库列表出错：', error);
                return null;
            });
    }

    // 获取题库题目
    export function fetchBankQuestionList(
        bankID = "", 
        page = 1,
        pageSize = 10,
        name = "",
        tags = "",
        type = "",
        diffculty = ""
    ){
        const PARAMS = new URLSearchParams();

        PARAMS.append("bankID", bankID);
        PARAMS.append("page", page);
        PARAMS.append("pageSize", pageSize);
        if (name) PARAMS.append("name", name);
        if (tags) PARAMS.append("tags", tags);
        if (type) PARAMS.append("type", type);
        if (diffculty) PARAMS.append("diffculty", diffculty);

        return fetch(`/api/questions?${PARAMS.toString()}`, {
            method: "GET",
            credentials: "include"
        })
            .then(response => {
                if (!response.ok) {
                    throw new Error(`请求失败，状态码：${response.status}`);
                }
                return response.json();
            })
            .then(data => {
                return data;
            })
            .catch(error => {
                console.error('获取题库题目列表出错：', error);
                return null;
            });
    }

    /******************* API 区 *******************/


    
    /******************* 开关控制区 *******************/

    let {
        onclose, update,
        to_add_groupID = 0, to_add_group_name = "",
        fetchPaper, savePaper
    } = $props();                 // 关闭弹窗
    let drop_up_toggle_is_open = $state(false);     // 上拉题组栏
    let filter_is_open = $state(false);           // 下拉筛选栏
    
    /******************* 开关控制区 *******************/
    


    /********************* 信息区 *********************/

    let paperID = $state(0);
    let paper_info = $state(null);
    let paper_groups = $state([]); 
    let to_add_group_length = $state(0);

    // 选中题组
    function selectGroup(group) {
        to_add_groupID = group.id;
        to_add_group_name = group.name; 
        to_add_group_length = group.questions.length;
    }

    /********************* 信息区 *********************/

    

    /******************** 题库列表 ********************/

    let bank_key_word = $state("");
    let to_add_bankID = $state("");
    let bank_list = $state([]);

    // 防抖搜索题库列表
    const debouncedFetchQuestionBankList = debounce(() => {
        fetchQuestionBankList(bank_key_word, "", "", "")
            .then(result => {
                bank_list = result.data || [];
            });
    }, 500, false);

    // 单选题库功能
    function toggleBank(id) {
        to_add_bankID = to_add_bankID === id ? "" : id;

        // 搜索题库内的题目
        if(to_add_bankID !== "") {
            fetchBankQuestionList(
                to_add_bankID,
                question_page,
                question_page_size,
                question_name,
                question_gags,
                question_type,
                question_difficulty
            ).then( result => {
                question_list = result.data || [];
                total_questions = result.rowCount;
            });
        } else { question_list = []; }
    }

    /******************** 题库列表 ********************/



    /******************** 题目列表 ********************/

    let question_page = $state(1);
    let question_page_size = $state(10);
    let question_name = $state("");
    let question_gags = $state("");
    let question_type = $state("");
    let question_difficulty = $state("");
    let total_questions = $state(0);
    let question_list = $state([]);

    let selected_question_infos = $state([]);      // 已选 ID 数组
    let all_question_selected = $state(false);    // 是否为全选状态

    // 选中数据
    function toggleSelection(id, checked) {
        if (checked) {
            // 查找对应题目，获取 score
            const question = question_list.find(q => q.ID === id);
            if (question) {
                selected_question_infos.push({ id: question.ID, score: question.Score });
            }
        } else {
            selected_question_infos = selected_question_infos.filter(item => item.id !== id);
        }
        checkAllSelected();
    }

    // 检查全选
    function checkAllSelected() {
        const currentPageIDs = question_list.map(item => item.ID);
        const selectedIDs = selected_question_infos.map(q => q.id);
        all_question_selected = (
            question_list.length !== 0 &&
            currentPageIDs.every(id => selectedIDs.includes(id))
        );
    }

    // 全选
    function selectAllQuestions(checked) {
        const currentPageQuestions = question_list.map(item => ({ id: item.ID, score: item.Score }));
        if (checked) {
            // 只追加未存在的
            const existingIds = selected_question_infos.map(item => item.id);
            const toAdd = currentPageQuestions.filter(q => !existingIds.includes(q.id));
            selected_question_infos = [...selected_question_infos, ...toAdd];
        } else {
            // 移除当前页的
            const currentPageIds = question_list.map(item => item.ID);
            selected_question_infos = selected_question_infos.filter(q => !currentPageIds.includes(q.id));
        }
        checkAllSelected();
    }

    // 确认导入题目
    function concfirmImport() {
        const actions = [
            {
                action: "add_question",
                payload: selected_question_infos.map((q, index) => ({
                    temp_id: `temp_question_${index + 1}`,
                    group_id: to_add_groupID,
                    order: to_add_group_length + index + 1,
                    bank_question_id: q.id,
                    score: q.score
                }))
            }
        ];
        
        savePaper(paperID, actions)
            .then(() => {
                fetchPaper(paperID)
                    .then(result => {
                        paper_info = result.data;
                        paper_groups = result.data.GroupsData;
                        update(paper_groups, paper_info);
                        onclose();
                        toast.success("导入成功", 1000);
                    });
            });
    }

    // 处理页面跳转
    function handlePageChange(event) {
        question_page = event.detail;
        // 搜索题库内的题目
        if(to_add_bankID !== "") {
            fetchBankQuestionList(
                to_add_bankID,
                question_page,
                question_page_size,
                question_name,
                question_gags,
                question_type,
                question_difficulty
            ).then( result => {
                question_list = result.data || [];
                total_questions = result.rowCount;
                checkAllSelected();
            });
        } else { question_list = []; }
    }

    // 处理页面尺寸更改
    function handlePageSizeChange(event) {
        question_page_size = event.detail;
        question_page = 1; // 改变每页数量时通常要跳回第一页
        // 搜索题库内的题目
        if(to_add_bankID !== "") {
            fetchBankQuestionList(
                to_add_bankID,
                question_page,
                question_page_size,
                question_name,
                question_gags,
                question_type,
                question_difficulty
            ).then( result => {
                question_list = result.data || [];
                total_questions = result.rowCount;
                checkAllSelected();
            });
        } else { question_list = []; }
    }

    /******************** 题目列表 ********************/

    // 挂载区
    onMount(() => {
        fetchQuestionBankList(bank_key_word, "", "", "")
            .then(result => {
                bank_list = result.data || [];
            });

        paperID = get(CURRENT_PAPER_ID);
        fetchPaper(paperID)
            .then(result => {
                paper_info = result.data;
                paper_groups = result.data.GroupsData;
        });
    })

</script>

<!-- 遮罩 -->
<div class="modal-overlay">
    <!-- 弹窗 -->
    <div class="modal-container">
        <!-- 头部 -->
        <div class="container-header">
            <span class="title">从题库导入题目</span>
            <button onclick={onclose}>✖</button>
        </div>

        <!-- 内容区 -->
        <div class="container-body">
            <!-- 左侧区域 -->
            <div class="body-left">
                <!-- 标题 -->
                <div class="title-box">
                    <span class="title">题库列表</span>
                </div>

                <!-- 搜索 -->
                <div class="search-box">
                    <InputBox onInput={()=>debouncedFetchQuestionBankList()} bind:value={bank_key_word} placeholder="搜索题库" show_label={false}/>
                </div>

                <!-- 题库列表 -->
                <div class="question-bank-list">
                    {#if bank_list.length !== 0}
                        {#each bank_list as bank}
                            <!-- svelte-ignore a11y_click_events_have_key_events -->
                            <!-- svelte-ignore a11y_no_static_element_interactions -->
                            <div class="single-bank" onclick={()=>toggleBank(bank.ID)}>
                                <input type="checkbox" checked={to_add_bankID === bank.ID} onclick={(e) => {e.stopPropagation(); toggleBank(bank.ID);}}>
                                <span class="bank-name">{bank.Name}</span>
                                <span class="questions-number">{bank.QuestionCount}</span>
                            </div>
                        {/each}
                    {:else}
                        <Empty text="暂无题库数据"/>
                    {/if}
                </div>
            </div>

            <!-- 右侧区域 -->
            <div class="body-right">
                <!-- 上半区 -->
                <!-- <div class="top-area">
                    <div class="input-box">
                        <InputBox placeholder="搜索题目内容" showLabel={false}/>
                    </div> -->

                    <!-- 下拉筛选栏 -->
                    <!-- svelte-ignore a11y_click_events_have_key_events -->
                    <!-- svelte-ignore a11y_no_static_element_interactions -->
                    <!-- <div class="filter-header" onmouseenter={()=>{filterIsOpen=true}} onmouseleave={()=>{filterIsOpen=false}}> -->
                        <!-- 筛选菜单 -->
                        <!-- {#if filterIsOpen}
                            <div class="filter-container"  onmouseenter={()=>{filterIsOpen=true}} onmouseleave={()=>{filterIsOpen=false}}> -->
                                <!-- 题型 -->
                                <!-- <div class="type">
                                    <span class="prompt">题型：</span>
                                    <button>单选题</button>
                                    <button>多选题</button>
                                    <button>判断题</button>
                                    <button>填空题</button>
                                    <button>简答题</button>
                                    <button>编程题</button>
                                </div> -->

                                <!-- 难度 -->
                                <!-- <div class="level">
                                    <span class="prompt">难度：</span>
                                    <button>简单</button>
                                    <button>中等</button>
                                    <button>困难</button>
                                </div> -->

                                <!-- 标签 -->
                                <!-- <div class="question-tags">
                                    <span class="level-prompt">标签：</span>
                                    <div class="tags-box">
                                        <button>测试</button>
                                        <button>常识</button>
                                    </div>
                                </div> -->

                                <!-- 清空条件 -->
                                <!-- <div class="clear-condition">
                                    <button>清空条件</button>
                                </div>
                            </div>
                        {/if}
                        <span class="filter-prompt">筛选</span>
                        <button class="dropdown-btn">{filterIsOpen?"∨":"∧"}</button>
                    </div>

                    
                </div> -->

                <!-- 下半区 -->
                <div class="bottom-area">
                    <!-- 表格区域 -->
                    <div class="questions-table-container">
                        <table>
                            <thead>
                                <tr>
                                    <th>
                                        <input
                                            type="checkbox"
                                            bind:checked={all_question_selected}
                                            onchange={(e) => selectAllQuestions(e.target.checked)}
                                        >
                                    </th>
                                    <th>题目内容</th>
                                    <th>题目类型</th>
                                    <th>题目难度</th>
                                    <th>分值</th>
                                    <th>更新时间</th>
                                    <th>标签</th>
                                </tr>
                            </thead>

                            <tbody>
                                {#if question_list && question_list.length !== 0}
                                    {#each question_list as question}
                                        <tr class:selected={selected_question_infos.map(q => q.id).includes(question.ID)}
                                            onclick={() => toggleSelection(question.ID, !selected_question_infos.map(q => q.id).includes(question.ID))}>
                                        <td class="checkbox">
                                            <input type="checkbox"
                                                checked={selected_question_infos.map(q => q.id).includes(question.ID)}
                                                onclick={(e) => {
                                                    e.stopPropagation();
                                                    toggleSelection(question.ID, e.target.checked);
                                                }}>
                                        </td>
                                        <td class="question-content">{@html question.Content}</td>
                                        <td class="question-type">{QUESTION_TYPE_TRANS[question.Type]}</td>
                                        <td class="question-level"><span class={DIFFICULTY_TRANS[DIFFICULTY_TRANS[question.Difficulty]]}>{DIFFICULTY_TRANS[question.Difficulty]}</span></td>
                                        <td class="question-score">{question.Score}</td>
                                        <td class="update-time">{formatTimestamp(question.UpdateTime,{show_date:true,show_time:true})}</td>
                                        <td class="question-tags">
                                            <div class="tag-container">
                                                {#if question.Tags.length !== 0}
                                                    {#each question.Tags as tag}
                                                        <UneditableTag content={tag}/>
                                                    {/each}
                                                {:else}
                                                    <span>-</span>
                                                {/if}
                                            </div>
                                        </td>
                                    </tr>
                                    {/each}
                                {/if}
                            </tbody>
                        </table>

                        {#if question_list.length === 0}
                            <Empty text="暂无题目数据"/>
                        {/if}
                    </div>

                    <!-- 翻页控制 -->
                    <div class="page-control-container">
                        <!-- <Pagination/> -->
                        <Pagination
                            total_items={total_questions}
                            page_size={question_page_size}  
                            current_page={question_page}
                            page_size_options={[5, 10 ,20]}
                            on:pageChange={handlePageChange}
                            on:pageSizeChange={handlePageSizeChange}
                        />
                    </div>
                </div>
            </div>
        </div>

        <!-- 底部 -->
        <div class="container-footer">
            <!-- <span class="selected-span">已选择 <span>2</span> 道题目</span> -->
            <span class="import-span">导入到题组：</span>
            <!-- svelte-ignore a11y_no_static_element_interactions -->
            <div class="dropup-toggle" onmouseenter={()=>{drop_up_toggle_is_open=true}} onmouseleave={()=>{drop_up_toggle_is_open=false}}>
                {#if drop_up_toggle_is_open}
                    <div class="dropup-menu">
                        {#each paper_groups as group}
                            <!-- svelte-ignore a11y_click_events_have_key_events -->
                            <div class="menu-option {to_add_groupID===group.id?"selected":""}" onclick={()=>selectGroup(group)}>
                                <span>
                                    {group.name}
                                </span>
                            </div>
                        {/each}
                    </div>  
                {/if}
                <span class="selected-group">{to_add_groupID===0?"请选择题组":to_add_group_name}</span>
                <button class="toggle-btn">∨</button>
            </div>
            <div class="btn-box">
                <Button onclick={onclose} plain={true}>取消</Button>
                {#if to_add_bankID!=="" && to_add_groupID!==0 && selected_question_infos.length!==0}
                    <Button onclick={()=>concfirmImport()}>确认导入</Button>
                {:else}
                    <Button disabled={true}>确认导入</Button>
                {/if}
            </div>
        </div>
    </div>
</div>

<style>

    /* 遮罩 */
    .modal-overlay {
        font-family: 'Noto Sans SC', sans-serif;
        color: var(--text-primary);

        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background-color: rgba(0, 0, 0, 0.5);
        display: flex;
        justify-content: center;
        align-items: center;
        z-index: 1000;

        /* 弹窗 */
        .modal-container {
            height: 90vh;
            max-height: 90vh;
            width: 85vw;
            max-width: 85vw;
            min-width: 1100px;
            background-color: #fff;
            border-radius: var(--border-radius-md);
            display: flex;
            flex-direction: column;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);

            /* 头部 */
            .container-header {
                padding: 16px 24px;
                border-bottom: 1px solid var(--border-light);
                display: flex;
                justify-content: space-between;

                span {
                    font-size: 20px;
                    font-weight: bold;
                }

                button {
                    background: none;
                    border: none;
                    font-weight: bold;
                    width: 30px;
                    height: 30px;
                    cursor: pointer;
                    font-size: 16px;

                    &:hover {
                        color: var(--primary-color);
                    }
                }
            }

            /* 内容区 */
            .container-body {
                padding: 16px;
                display: flex;
                flex-grow: 1;
                /* background-color: var(--bg-primary); */
                max-height: calc(90vh - 162px);
                gap: 16px;

                /* 左侧区域 */
                .body-left {
                    width: 280px;
                    border: 1px solid var(--border-light);
                    border-radius: var(--border-radius-sm);
                    display: flex;
                    flex-direction: column;

                    /* 标题 */
                    .title-box {
                        padding: 12px 16px 24px 16px;
                        border-bottom: 1px solid var(--border-light);

                        .title {
                            font-size: 20px;
                            font-weight: bold;
                        }
                    }

                    /* 搜索 */
                    .search-box {
                        display: flex;
                        flex-direction: column;
                        padding: 12px 16px;
                        background-color: var(--bg-primary);
                        gap: 8px;
                        border-bottom: 1px solid var(--border-light);

                        .selected-banks-box {
                            display: flex;
                            justify-content: right;

                            .selected-banks {
                                font-size: 14px;
                                
                                span {
                                    color: #1890ff;
                                    font-weight: bold;
                                }
                            }
                        }
                    }

                    /* 题库列表 */
                    .question-bank-list {
                        padding: 12px 16px;
                        font-weight: 500;
                        display: flex;
                        flex-direction: column;
                        overflow-y: auto;
                        flex-grow: 1;
                        
                        /* 单个题库 */
                        .single-bank {
                            display: flex;
                            padding: 8px 12px;
                            border-radius: var(--border-radius-sm);
                            cursor: pointer;

                            &:hover {
                                background-color: var(--bg-secondary);
                            }

                            /* 勾选框 */
                            input {
                                width: 16px;
                                height: 16px;
                                cursor: pointer;
                                accent-color: var(--primary-color);
                                position: relative;  /* 使其可相对定位 */
                                top: 1.5px;  /* 向下移动 3px */
                            }
    
                            /* 题库名称 */
                            .bank-name {
                                margin-left: 8px;
                                overflow: hidden;
                                text-overflow: ellipsis;
                                white-space: nowrap;
                                width: 175px;
                            }
    
                            /* 题目数量 */
                            .questions-number {
                                flex-grow: 1;
                                text-align: center;
                            }
                        }

                    }
                }

                /* 右侧区域 */
                .body-right {
                    display: flex;
                    flex-direction: column;
                    flex-grow: 1;
                    border: 1px solid var(--border-light);
                    border-radius: var(--border-radius-sm);

                    /* 上半区 */
                    .top-area {
                        padding: 12px 16px;
                        border-bottom: 1px solid var(--border-light);

                        .input-box{ background-color: rgb(249, 249, 249); }

                        /* 下拉筛选栏 */
                        .filter-header {
                            position: relative;
                            display: flex;
                            justify-content: space-between;
                            padding: 12px 0;
                            cursor: pointer;
                            background-color: var(--bg-primary);
                            border: 1px solid var(--border-medium);
                            border-radius: 0 0 var(--border-radius-sm) var(--border-radius-sm);

                            &:hover {
                                transition: all 0.3s ease;
                                border-color: #1890ff;
                                box-shadow: 0 0 0 2px rgba(24, 144, 255, 0.2);
                                    
                                .filter-prompt, .dropdown-btn {
                                    color: #1890ff;
                                    transition: all 0.3s ease;
                                }
                            }

                            .filter-prompt {
                                font-weight: 1000;
                                padding-left: 16px;
                            }

                            .dropdown-btn {
                                transform: scaleX(1.8);
                                background: none;
                                border: none;
                                padding: 2px 16px 0 0;
                                height: 30px;
                                cursor: pointer;
                                font-size: 10px;
                                font-weight: 1000;
                            }

                            /* 筛选菜单 */
                            .filter-container {
                                display: flex;
                                flex-direction: column;
                                gap: 12px;
                                background-color: var(--bg-primary);
                                border-radius: 0 0 var(--border-radius-sm) var(--border-radius-sm);
                                position: absolute;
                                z-index: 1000;
                                width: 100%;
                                top: 100%;
                                margin-top: 2px;
                                padding: 16px 0;
                                box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
                                cursor: default;

                                .prompt { font-size: 12px; font-weight: 500;}

                                button {
                                    padding: 2px 8px;
                                    background-color: #f5f5f5;
                                    border: 1px solid #d9d9d9;
                                    border-radius: var(--btn-border-radius);
                                    font-size: 12px;
                                    cursor: pointer;

                                    &:hover {
                                        border-color: #40a9ff;
                                        transition: all 0.3;
                                    }
                                }

                                /* 题型 & 难度 */
                                .type, .level {
                                    display: flex;
                                    flex-wrap: wrap;
                                    gap: 8px;
                                    align-items: center;
                                    padding: 0 16px;
                                }

                                /* 标签 */
                                .question-tags {
                                    display: flex;
                                    padding: 0 16px;

                                    .level-prompt {
                                        font-size: 12px;
                                        font-weight: 500;
                                        margin-right: 8px;
                                        min-width: max-content;
                                    }

                                    .tags-box {
                                        display: flex;
                                        flex-wrap: wrap;
                                        gap: 8px;
                                        flex-grow: 1;
                                        overflow-y: auto;
                                        max-height: 54px;
                                    }
                                }

                                /* 清空条件 */
                                .clear-condition {
                                    display: flex;
                                    justify-content: right;
                                    margin-right: 16px;
                                }
                            }
                        }

                    }

                    /* 下半区 */
                    .bottom-area {
                        flex-grow: 1;
                        display: flex;
                        flex-direction: column;

                        /* 表格区域 */
                        .questions-table-container {
                            padding: 0 16px;
                            flex-grow: 1;
                            max-height: calc(90vh - 220px);
                            overflow: auto;
                            display: flex;
                            flex-direction: column;

                            table {
                                border-collapse: collapse;

                                .selected {
                                    background-color: rgb(208, 232, 255);

                                    &:hover {
                                        background-color: rgb(192, 216, 255);
                                    }
                                }

                                tbody tr {
                                    cursor: pointer;
                                    
                                    &:hover {
                                        background-color: rgb(224, 240, 255);
                                    }
                                }

                                th, td {
                                    padding: 6px 3px;
                                }

                                th {
                                    font-size: 12px;
                                    color: var(--text-disabled);
                                    text-align: center;
                                    position: sticky;
                                    top: 0;
                                    background-color: var(--bg-primary);
                                    padding-top: 14px;

                                    input {
                                        width: 16px;
                                        height: 16px;
                                        cursor: pointer;
                                        accent-color: var(--blue);
                                    }
                                }

                                td {
                                    border-bottom: 1px solid var(--border-light);
                                }

                                .checkbox {
                                    min-width: 32px;
                                    text-align: center;
                                    
                                    input {
                                        width: 16px;
                                        height: 16px;
                                        cursor: pointer;
                                        accent-color: var(--blue);
                                    }
                                }
                                .question-content {
                                    padding: 6px 10px;
                                    max-width: calc(85vw - 800px);
                                    min-width: 300px;
                                    text-align: center;
                                    white-space: nowrap;      /* 不允许文本换行 */
                                    overflow: hidden;         /* 超出容器的文本被隐藏 */
                                    text-overflow: ellipsis;  /* 超出的文本用省略号显示 */
                                }
                                .question-type {
                                    font-size: 14px;
                                    text-align: center;
                                    min-width: 48px;
                                }
                                .question-level {
                                    font-size: 14px;
                                    text-align: center;
                                    min-width: 48px;

                                    .easy-level { color: green; }
                                    .normal-level { color: orange; }
                                    .hard-level { color: red; }
                                }
                                .question-score {
                                    font-size: 14px;
                                    text-align: center;
                                    min-width: 24px;
                                }
                                .update-time {
                                    font-size: 14px;
                                    text-align: center;
                                    min-width: 42px;
                                }
                                .question-tags {
                                    font-size: 14px;
                                    text-align: center;
                                    min-width: 140px;

                                    /* 试卷标签 */
                                    .tag-container {
                                        display: flex;
                                        gap: 10px;
                                        justify-content: center;
                                        overflow-y: auto;
                                        flex-wrap: wrap;
                                        max-height: 65px;

                                        .per-tag {
                                            display: flex;
                                            align-items: center;
                                            width: max-content;
                                            height: max-content;
                    
                                            /* 颜色块 */
                                            .tag-block{
                                                width: 12px;
                                                height: 12px;
                                                border-radius: 2px;
                                                margin-right: 9px;
                                                margin-top: 4px;
                                            }
                                        }
                                    }
                                }
                            }
                        }

                        /* 翻页控制 */
                        .page-control-container {
                            display: flex;
                            justify-content: right;
                            padding: 0 16px;
                        }

                    }
                }
            }

            /* 底部 */
            .container-footer {
                padding: 16px 24px;
                border-top: 1px solid var(--border-light);
                display: flex;
                justify-content: right;
                align-items: center;

                /* 已选题目 */
                .selected-span {
                    font-weight: 500;

                    span {
                        color: var(--primary-color);
                    }
                }

                /* 导入 */
                .import-span {
                    font-size: 14px;
                    color: var(--text-primary);
                    margin-left: 2vw;
                }

                /* 上拉栏 */
                .dropup-toggle {
                    display: flex;
                    align-items: center;
                    padding: 2px 0x;
                    border: 1px solid var(--border-light);
                    border-radius: var(--input-border-radius);
                    background: var(--bg-primary);
                    cursor: pointer;
                    justify-content: space-between;
                    width: 299px;
                    position: relative;
                    
                    &:hover {
                        transition: all 0.3s ease;
                        border-color: #1890ff;
                        box-shadow: 0 0 0 2px rgba(24, 144, 255, 0.2);
                            
                        .selected-group, .toggle-btn {
                            color: #1890ff;
                            transition: all 0.3s ease;
                        }

                         .toggle-btn {
                            transform: scaleX(1.8) rotate(180deg);
                            transition: none;
                        }
                    }

                    /* 文本 */
                    .selected-group {
                        font-size: 14px;
                        font-weight: 500;
                        padding-left: 12px;
                    }

                    /* 上拉符 */
                    .toggle-btn {
                        transform: scaleX(1.8);
                        background: none;
                        /* background-color: red; */
                        border: none;
                        padding: 2px 0 0 0;
                        margin-right: 12px;
                        height: 30px;
                        cursor: pointer;
                        font-size: 10px;
                        font-weight: 1000;
                    }

                    /* 上拉菜单 */
                    .dropup-menu {
                        position: absolute;
                        background-color: var(--bg-primary);
                        bottom: 100%;
                        width: 100%;
                        border: 1px solid var(--border-light);
                        border-bottom: none;
                        border-radius: var(--input-border-radius);
                        padding: 6px 0;
                        box-shadow: 0 -4px 12px rgba(0, 0, 0, 0.15);
                        max-height: 200px;
                        overflow-y: auto;
                        display: flex;
                        flex-direction: column;
                        gap: 3px;
                        margin-bottom: 1.5px;
                        margin-left: -1px;

                        /* 单项 */
                        .menu-option {
                            padding: 6px 12px;

                            &:hover {
                                background-color: #e6f7ff;
                            }

                            span {
                                font-size: 14px;
                                font-weight: 500;
                            }
                        }

                        /* 选中状态 */
                        .selected {
                            background-color: #ecf2fe;
                            
                            span {
                                font-weight: 600;
                            }
                        }
                    }
                }

                /* 按钮 */
                .btn-box {
                    display: flex;
                    gap: 8px;
                    margin-left: 2vw;
                }
            }
        }
    
    }

</style>