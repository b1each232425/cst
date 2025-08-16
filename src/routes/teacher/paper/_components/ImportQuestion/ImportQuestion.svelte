<!--
 * @Author: WangKaidun 1597225095@qq.com
 * @Date: 2025-08-01 21:09:59
 * @LastEditors: WangKaidun 1597225095@qq.com
 * @LastEditTime: 2025-08-15 20:58:51
 * @FilePath: \exam\src\routes\teacher\paper\_components\ImportQuestion\ImportQuestion.svelte
 * @Description: 从题库导入题目组件
 * @Copyright (c) 2025 by WangKaidun 1597225095@qq.com, All Rights Reserved. 
-->
<script>
    import "$lib/components/Button/index.scss"
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
    function fetchQuestionBankList(
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
                if (data.status !== 0) toast.error(data.msg, 1000);
                return data;
            })
            .catch(error => {
                console.error('获取题库列表出错：', error);
                return null;
            });
    }

    // 获取题库题目
    function fetchBankQuestionList(
        bankID = "", 
        page = 1,
        pageSize = 10,
        content = "",
        tags = [],
        types = [],
        difficulties = []
    ){
        const PARAMS = new URLSearchParams();

        PARAMS.append("bankID", bankID);
        PARAMS.append("page", page);
        PARAMS.append("pageSize", pageSize);
        if (content!=="") PARAMS.append("content", content);
        if(tags.length!==0) tags.forEach(tag => PARAMS.append("tags", tag));
        if(types.length!==0) types.forEach(type => PARAMS.append("type", type));
        if(difficulties.length!==0) difficulties.forEach(difficulty => PARAMS.append("difficulty", difficulty));

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
                if (data.status !== 0) toast.error(data.msg, 1000);
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
        to_import_group = {
            id: 0,
            name: "",
        },
        fetchPaper, savePaper
    } = $props();                 // 关闭弹窗
    let drop_up_toggle_is_open = $state(false);     // 上拉题组栏
    let filter_is_open = $state(false);           // 下拉筛选栏
    
    /******************* 开关控制区 *******************/



    /********************* 信息区 *********************/

    let paperID = $state(0);
    let paper_info = $state(null);
    let paper_groups = $state([]); 

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

        // 每次切换或取消选中题库的时候先重置搜索参数
        clearFilterSearch();

        // 搜索题库内的题目
        if(to_add_bankID !== "") {
            fetchBankQuestionList(
                to_add_bankID,
                question_page,
                question_page_size,
                question_name,
                question_tags,
                question_types,
                question_difficulties
            ).then( result => {
                question_list = result.data || [];
                total_questions = result.rowCount;
            });

            fetchBankQuestionList(to_add_bankID,1,100,"","","","")
                .then(result => {
                    const TEMP_QUESTION_LIST = result.data || [];
                    tag_list = [...new Set(TEMP_QUESTION_LIST.flatMap(question=>question.Tags ? question.Tags : []).filter(Boolean))];
                })
                .finally(() => {
                    // console.log(question_list)
                });

        } else {
            question_list = [];
            tag_list = [];
        }
    }

    /******************** 题库列表 ********************/



    /******************** 题目列表 ********************/

    let question_page = $state(1);              // 页码
    let question_page_size = $state(10);        // 页面大小
    let question_name = $state("");             // 搜索题目
    let question_tags = $state("");             // 筛选标签
    let question_types = $state([]);             // 筛选题型
    let question_difficulties = $state([]);       // 筛选难度
    let total_questions = $state(0);            // 题目数量
    let question_list = $state([]);             // 题目列表
    let tag_list = $state([]);                  // 标签列表

    let selected_questions = $state([]);   // 已选题目数组
    let all_question_selected = $state(false);  // 是否为全选状态

    // 防抖搜索题目列表
    const debouncedFetchBankQuestionList = debounce(() => {
        // 搜索题库内的题目
        if(to_add_bankID !== "") {
            fetchBankQuestionList(
                to_add_bankID,
                question_page,
                question_page_size,
                question_name,
                question_tags,
                question_types,
                question_difficulties
            ).then( result => {
                question_list = result.data || [];
                total_questions = result.rowCount;
            });
        } else {
            question_list = [];
            tag_list = [];
        }
    }, 500, false);

    // 清除筛选
    function clearFilterSearch() {
        question_page = 1;
        question_page_size = 10;
        question_name = "";
        question_tags = [];
        question_types = [];
        question_difficulties = [];
    }

    // 选中数据
    function toggleSelection(id, checked) {
        if (checked) {
            // 查找对应题目，直接添加整个题目对象
            const QUESTION = question_list.find(question => question.ID === id);
            if (QUESTION) {
                selected_questions.push(QUESTION);
            }
        } else {
            selected_questions = selected_questions.filter(question => question.ID !== id);
        }
        checkAllSelected();
    }

    // 检查全选
    function checkAllSelected() {
        const CURRENT_PAGE_IDS = question_list.map(item => item.ID);
        const SELECTED_IDS = selected_questions.map(question => question.ID);
        all_question_selected = (
            question_list.length !== 0 &&
            CURRENT_PAGE_IDS.every(id => SELECTED_IDS.includes(id))
        );
    }

    // 全选
    function selectAllQuestions(checked) {
        if (checked) {
            // 只追加未存在的
            const EXISTING_IDS = selected_questions.map(question => question.ID);
            const TO_ADD_QUESTIONS = question_list.filter(question => !EXISTING_IDS.includes(question.ID));
            selected_questions = [...selected_questions, ...TO_ADD_QUESTIONS];
        } else {
            // 移除当前页的
            const CURRENT_PAGE_IDS = question_list.map(item => item.ID);
            selected_questions = selected_questions.filter(question => !CURRENT_PAGE_IDS.includes(question.ID));
        }
        checkAllSelected();
    }

    // 确认导入题目
    function confirmImport() {
        // 要通过paper_groups获取原来题目的ID数组
        const originalQuestionIDs = paper_groups.flatMap(group => 
            group.questions.map(question => question.id || question.ID)
        ).filter(Boolean);
        
        // 找到目标题组在原始题目数组中的位置
        let targetGroupStartIndex = 0;
        for (let i = 0; i < paper_groups.length; i++) {
            if (paper_groups[i].id === to_import_group.id) {
                break;
            }
            targetGroupStartIndex += paper_groups[i].questions.length;
        }
        
        // 将要添加的题目的临时ID插入到目标题组的末尾位置，从-1开始递减
        const newQuestionIDs = selected_questions.map((_, index) => -(index + 1));
        
        // 构建包含新题目的完整题目ID数组，新题目使用temp_id插入到目标题组的末尾
        const questionIDs = [
            ...originalQuestionIDs.slice(0, targetGroupStartIndex + to_import_group.questions.length),
            ...newQuestionIDs,
            ...originalQuestionIDs.slice(targetGroupStartIndex + to_import_group.questions.length)
        ];
        
        // 计算每个新题目的order值（在questionIDs中的索引+1）
        const ACTIONS = [
            {
                action: "add_question",
                payload: selected_questions.map((question, index) => {
                    const PAYLOAT_ITEM = {
                        temp_id: -(index + 1),
                        group_id: to_import_group.id,
                        order: targetGroupStartIndex + to_import_group.questions.length + index + 1, // 这里的值应该是添加的题目的ID在插入questionIDs后的索引+1
                        bank_question_id: question.ID,
                        score: question.Score,
                        type: question.Type
                    };

                    // 如果 Type 为 "06" 或 "08"，加 subscore 字段
                    if (question.Type === "06" || question.Type === "08") {
                        PAYLOAT_ITEM.sub_score = question.Answers.map(answer => answer.score);
                    }

                    return PAYLOAT_ITEM;
                })
            },
            {
                action: "move_question",
                payload: questionIDs // 这里的questionIDs是添加题目后的题目ID数组
            }
        ];

        savePaper(paperID, ACTIONS)
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
                question_tags,
                question_types,
                question_difficulties
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
                question_tags,
                question_types,
                question_difficulties
            ).then( result => {
                question_list = result.data || [];
                total_questions = result.rowCount;
                checkAllSelected();
            });
        } else { question_list = []; }
    }

    // 筛选题目类型
    function selectQuestionType(target_type) {
        if (question_types.includes(target_type)) {
            question_types = question_types.filter(type => type !== target_type);
        } else {
            question_types.push(target_type);
        }

        // 搜索题库内的题目
        if(to_add_bankID !== "") {
            fetchBankQuestionList(
                to_add_bankID,
                question_page,
                question_page_size,
                question_name,
                question_tags,
                question_types,
                question_difficulties
            ).then( result => {
                question_list = result.data || [];
                total_questions = result.rowCount;
            });
        } else { question_list = []; }
    }

    // 筛选题目难度
    function selectQuestionDifficulty(target_diffculty) {
        if (question_difficulties.includes(target_diffculty)) {
            question_difficulties = question_difficulties.filter(difficulty => difficulty !== target_diffculty);
        } else {
            question_difficulties.push(target_diffculty);
        }

        // 搜索题库内的题目
        if(to_add_bankID !== "") {
            fetchBankQuestionList(
                to_add_bankID,
                question_page,
                question_page_size,
                question_name,
                question_tags,
                question_types,
                question_difficulties
            ).then( result => {
                question_list = result.data || [];
                total_questions = result.rowCount;
            });
        } else { question_list = []; }
    }

    // 筛选题目标签
    function selectQuestionTags(target_tag) {
        if (question_tags.includes(target_tag)) {
            question_tags = question_tags.filter(tag => tag!== target_tag);
        } else {
            question_tags.push(target_tag);
        }

        // 搜索题库内的题目
        if(to_add_bankID !== "") {
            fetchBankQuestionList(
                to_add_bankID,
                question_page,
                question_page_size,
                question_name,
                question_tags,
                question_types,
                question_difficulties
            ).then( result => {
                question_list = result.data || [];
                total_questions = result.rowCount;
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
                    <div class="input">
                        <input type="text"
                            oninput={()=>debouncedFetchQuestionBankList()}
                            onchange={()=>debouncedFetchQuestionBankList()}
                            bind:value={bank_key_word}
                            placeholder="搜索题库"
                        >
                        <!-- svelte-ignore a11y_consider_explicit_label -->
                        <button data-name="clear"
                            class={bank_key_word===""?"hide-clear":""}
                            onclick={()=>{bank_key_word=""}}
                        ></button>
                    </div>
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
                <div class="top-area">
                    <div class="input">
                        <input type="text"
                            placeholder="搜索题目内容" 
                            bind:value={question_name}
                            oninput={()=>debouncedFetchBankQuestionList()}
                            onchange={()=>debouncedFetchBankQuestionList()}
                        >
                        <!-- svelte-ignore a11y_consider_explicit_label -->
                        <button data-name="clear"
                            class={question_name===""?"hide-clear":""}
                            onclick={()=>{question_name=""}}
                        ></button>
                    </div>

                    <!-- 下拉筛选栏 -->
                    <!-- svelte-ignore a11y_click_events_have_key_events -->
                    <!-- svelte-ignore a11y_no_static_element_interactions -->
                    <div class="filter-header" onmouseenter={()=>{filter_is_open=true}} onmouseleave={()=>{filter_is_open=false}}>
                        <!-- 筛选菜单 -->
                        {#if filter_is_open}
                            <div class="filter-container"  onmouseenter={()=>{filter_is_open=true}} onmouseleave={()=>{filter_is_open=false}}>
                                <!-- 题型 -->
                                <div class="type">
                                    <span class="prompt">题型：</span>
                                    <button onclick={()=>selectQuestionType("00")} class={question_types.includes("00")?"selected":""}>单选题</button>
                                    <button onclick={()=>selectQuestionType("02")} class={question_types.includes("02")?"selected":""}>多选题</button>
                                    <button onclick={()=>selectQuestionType("04")} class={question_types.includes("04")?"selected":""}>判断题</button>
                                    <button onclick={()=>selectQuestionType("06")} class={question_types.includes("06")?"selected":""}>填空题</button>
                                    <button onclick={()=>selectQuestionType("08")} class={question_types.includes("08")?"selected":""}>简答题</button>
                                </div>

                                <!-- 难度 -->
                                <div class="level">
                                    <span class="prompt">难度：</span>
                                    <button onclick={()=>{selectQuestionDifficulty(1)}} class={question_difficulties.includes(1)?"selected":""}>简单</button>
                                    <button onclick={()=>{selectQuestionDifficulty(2)}} class={question_difficulties.includes(2)?"selected":""}>中等</button>
                                    <button onclick={()=>{selectQuestionDifficulty(3)}} class={question_difficulties.includes(3)?"selected":""}>困难</button>
                                </div>

                                <!-- 标签 -->
                                <div class="question-tags">
                                    <span class="level-prompt">标签：</span>
                                    <div class="tags-box">
                                        {#if tag_list.length !== 0}
                                            {#each tag_list as tag}
                                                <button class={question_tags.includes(tag)?"selected":""}
                                                    onclick={()=>selectQuestionTags(tag)}>{tag}</button>
                                            {/each}
                                        {/if}
                                    </div>
                                </div>

                                <!-- 清空条件 -->
                                <div class="clear-condition">
                                    <button>清空条件</button>
                                </div>
                            </div>
                        {/if}
                        <span class="filter-prompt">筛选</span>
                        <button class="dropdown-btn">{filter_is_open?"∨":"∧"}</button>
                    </div>

                    
                </div>

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
                                        <tr class:selected={selected_questions.map(question => question.ID).includes(question.ID)}
                                            onclick={() => toggleSelection(question.ID, !selected_questions.map(question => question.ID).includes(question.ID))}>
                                        <td class="checkbox">
                                            <input type="checkbox"
                                                checked={selected_questions.map(question => question.ID).includes(question.ID)}
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
            <span class="selected-span">已选择 <span>{selected_questions.length}</span> 道题目</span>
            <span class="import-span">导入到题组：</span>
            <!-- svelte-ignore a11y_no_static_element_interactions -->
            <div class="dropup-toggle" onmouseenter={()=>{drop_up_toggle_is_open=true}} onmouseleave={()=>{drop_up_toggle_is_open=false}}>
                {#if drop_up_toggle_is_open}
                    <div class="dropup-menu">
                        {#each paper_groups as group}
                            <!-- svelte-ignore a11y_click_events_have_key_events -->
                            <div class="menu-option {group.id===to_import_group.id?"selected":""}" onclick={()=>{to_import_group=group}}>
                                <span>
                                    {group.name}（共{group.questions.length}题，共{
                                        group.questions.reduce((sum,question)=>sum+(question.score||0),0)
                                    }分）
                                </span>
                            </div>
                        {/each}
                    </div>  
                {/if}
                <span class="selected-group">{to_import_group.id===0?"请选择题组":to_import_group.name+`（共${to_import_group.questions.length}题，共${
                    to_import_group.questions.reduce((sum,question)=>sum+(question.score||0),0) 
                }分）`}</span>
                <button class="toggle-btn">∨</button>
            </div>
            <div class="btn-box">
                <button onclick={onclose} class="btn btn--primary is-plain">取消</button>
                {#if to_add_bankID!=="" && to_import_group.id!==0 && selected_questions.length!==0}
                    <button onclick={()=>confirmImport()} class="btn btn--primary">确认导入</button>
                {:else}
                    <button class="btn btn--primary is-disabled">确认导入</button>
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

                        .input {

                            .hide-clear {
                                visibility: hidden;
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
                        
                        .input {
                            width: 100%;

                            input {
                                padding: 8px 12px;
                                
                            }

                            .hide-clear {
                                visibility: hidden;
                            }
                        }

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
                                margin-top: 1.5px;
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

                                    &.selected {
                                        color: #1890ff;
                                        background-color: #e6f7ff;
                                        border-color: #91d5ff;
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
                            max-height: calc(90vh - 320px);
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
                    z-index: 1000;
                    
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
                        max-height: 210px;
                        overflow-y: auto;
                        display: flex;
                        flex-direction: column;
                        gap: 3px;
                        margin-bottom: 1px;
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