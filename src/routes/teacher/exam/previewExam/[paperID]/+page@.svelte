<!--
 * @Author: WangKaidun 1597225095@qq.com
 * @Date: 2025-08-01 15:21:42
 * @LastEditors: yeweixuan t051521@outlook.com
 * @LastEditTime: 2025-08-11 13:55:31
 * @FilePath: \exam\src\routes\teacher\exam\previewExam\+page@.svelte
 * @Description: 自定义组卷页面（只读模式） 
 * @Copyright (c) 2025 by WangKaidun 1597225095@qq.com, All Rights Reserved. 
-->
<script>
    import Button from "$lib/components/Button/Button.svelte";
    import QuestionPreviewPanel from "../../../question-bank/_components/QuestionPreviewPanel.svelte";
    import { goto } from "$app/navigation";
    import { DIFFICULTY_TRANS, QUESTION_TYPE_TRANS } from "../../_utils/previewMap";
    import { onMount } from "svelte";
    import { get } from "svelte/store";
    import { CURRENT_PAPER_ID, GROUP_OPEN_STATE, QUESTION_OPEN_STATE } from "../../_stores/previewStore"
    import {toast} from "$lib/components/Toast/Toast"
    import Loading from "$lib/components/Loading/Loading.svelte";

    /******************* API 区 ********************/

    // 获取试卷详情
    function fetchPaper(paperID = 0) {
        const PARAMS = new URLSearchParams();
        PARAMS.append("paper_id", paperID);

        return fetch(`/api/paper/manual?${PARAMS.toString()}`, {
            method: "GET",
            credentials: "include"
        })
            .then(response => {
                if (!response.ok) {
                    throw new Error(`请求失败，状态码：${response.status}`);
                }
                return response.json();
            })
            .then(result =>{
                if(result.status===0)
                 {
                    return result;
                 }
                 else{
                    goto('/teacher/exam');
                    toast.error(result.msg);
                 }
            })
            .catch(error => {
                console.error('获取试卷详情出错：', error);
                return null;
            });
    }

    /******************* API 区 ********************/

    /***************** 控制开关区 *****************/
    let page_is_ready = $state(false);

    /***************** 控制开关区 ******************/

    /***************** 试卷信息区 ******************/
    let paperID = $state(0);
    let paper_info = $state(null);
    let paper_name = $state("新建试卷");
    let category = $state("00");            // 试卷用途 00：考试 02：练习
    let level = $state("00");               // 试卷难度 00：简单 02：中等 04：困难
    let suggested_duration = $state(120);    // 建议时长，单位为分钟
    let total_score = $state(0);
    let question_count = $state(0);
    let description = $state("");
    let tags = $state([]);
    let currentID = $state(0);
    let loading = $state(true);
    /**************** 试卷信息区 *****************/

    /***************** 标签处理区 *****************/
    // 标签颜色
    const TAG_COLOR_LIST = [
        "#40d5ff", "#59dcff", "#33c1e8", "#6adbff", "#26caef",
        "#4dd6eb", "#6dcaf2", "#52c2ff", "#7fd3f3", "#47d0db",
        "#5bc8f2", "#40c4e0", "#72deff", "#4fd4d9", "#83def5",
        "#ffa040", "#ffb359", "#ffc26d", "#ffcf85", "#ff9eac",
        "#ffb3c0", "#ffc6d1", "#ffd9e0", "#c6ff8c", "#d9ff99",
        "#e0ffb3", "#e6ffcc"
    ];

    // 根据标签名称计算颜色数组的索引
    function getColorIndex(tagName) {
        const FIRSTCHAR = tagName.charAt(0);
        const CHARCODE = FIRSTCHAR.charCodeAt(0);
        return CHARCODE % TAG_COLOR_LIST.length;
    }

    /***************** 标签处理区 *****************/

    /***************** 题组列表区 *****************/
    let paper_groups = $state([]);

    // 一键展开所有题组和题目
    function expandAll() {
        const NEW_GROUP_STATE = {};
        const NEW_QUESTION_STATE = {};

        paper_groups.forEach(group => {
            NEW_GROUP_STATE[group.id] = true;
            group.questions?.forEach(question => {
                NEW_QUESTION_STATE[question.id] = true;
            });
        });

        GROUP_OPEN_STATE.set(NEW_GROUP_STATE);
        QUESTION_OPEN_STATE.set(NEW_QUESTION_STATE);
    }

    // 一键收起所有题组和题目
    function collapseAll() {
        const NEW_GROUP_STATE = {};
        const NEW_QUESTION_STATE = {};

        paper_groups.forEach(group => {
            NEW_GROUP_STATE[group.id] = false;
            group.questions?.forEach(question => {
                NEW_QUESTION_STATE[question.id] = false;
            });
        });

        GROUP_OPEN_STATE.set(NEW_GROUP_STATE);
        QUESTION_OPEN_STATE.set(NEW_QUESTION_STATE);
    }

    // 展开与收起
    function changeOpenState(type, id) {
        if(type === "group") {
            GROUP_OPEN_STATE.update(state => ({ ...state, [id]: !state[id] }));
        }
        if(type === "question") {
            QUESTION_OPEN_STATE.update(state => ({ ...state, [id]: !state[id] }));
        }
    }

   async function gotoPrePaper(){
    if (!Array.isArray(paperID) || currentID <= 0) {
        toast.error("没有前一张试卷了");
        return;
    }
    loading=true;
    currentID--;
    const prePaperID = paperID[currentID];
    page_is_ready = false;
    const result = await fetchPaper(prePaperID);

    if (!result) {
        toast.error("加载下一张试卷失败");
        return;
    }

    paper_info = result.data;
    paper_groups = result.data.GroupsData;
    paper_name = paper_info.Name;
    category = paper_info.Category;
    level = paper_info.Level;
    suggested_duration = paper_info.SuggestedDuration;
    total_score = paper_info.TotalScore;
    question_count = paper_info.QuestionCount;
    description = paper_info.Description;
    tags = paper_info.Tags;
    page_is_ready = true;
    goto(`/teacher/exam/previewExam/${prePaperID}`)
    loading=false;
}


   async function gotoNextPaper(){
       if (!Array.isArray(paperID) || currentID >= paperID.length - 1) {
        toast.error("已经是最后一张试卷了");
        return;
    }
    loading=true;
    currentID++;
    const nextPaperID = paperID[currentID];
    page_is_ready = false;
    const result = await fetchPaper(nextPaperID);

    if (!result) {
        toast.error("加载下一张试卷失败");
        return;
    }

    paper_info = result.data;
    paper_groups = result.data.GroupsData;
    paper_name = paper_info.Name;
    category = paper_info.Category;
    level = paper_info.Level;
    suggested_duration = paper_info.SuggestedDuration;
    total_score = paper_info.TotalScore;
    question_count = paper_info.QuestionCount;
    description = paper_info.Description;
    tags = paper_info.Tags;
    page_is_ready = true;
    goto(`/teacher/exam/previewExam/${nextPaperID}`)
    loading=false;
    }
    /***************** 题组列表区 *****************/

    // 挂载区
    onMount (async () => {
        paperID = get(CURRENT_PAPER_ID);
        if(paperID === 0) {
            toast.error("申请查看的paperID不存在,返回考试列表");
            await goto("/teacher/exam");
            return;
        }
        fetchPaper(paperID[currentID])
            .then(result => {
                paper_info = result.data;
                paper_groups = result.data.GroupsData;

                paper_name = paper_info.Name;
                category = paper_info.Category;
                level = paper_info.Level;
                suggested_duration = paper_info.SuggestedDuration;
                total_score = paper_info.TotalScore;
                question_count = paper_info.QuestionCount;
                description = paper_info.Description;
                tags = paper_info.Tags;
            })
            .finally(() => {
                page_is_ready = true;
                expandAll();
                loading=false;
            });
    })
</script>

{#if !loading}
    <div class="view-paper">
        <!-- 顶部栏 -->
        <div class="header">
            <!-- 标题 -->
            <div class="title-container">
                <div class="title-icon"></div>
                <span class="title-name">试卷预览</span>
            </div>

            <!-- 试卷名称 -->
            <div class="paper-name">{paper_name}</div>
            
            <!-- 操作区 -->
            <div class="operation">
                <Button onclick={()=>expandAll()} plain={true}>一键展开</Button>
                <Button onclick={()=>collapseAll()} plain={true}>一键收起</Button>
                <Button type="danger" plain={true} onclick={()=>goto('/teacher/exam')}>返回</Button>
                <Button plain={true} onclick={() => gotoPrePaper()}> 上一张 </Button>
                <Button plain={true} onclick={() => gotoNextPaper()}> 下一张 </Button>
            </div>
        </div>

        <!-- 下半区 -->
        <div class="bottom-area">
            <!-- 侧边栏 -->
            <div class="side-bar">
                <!-- 试卷信息 -->
                <div class="paper-info-container">
                    <span class="title">试卷信息</span>
                    
                    <!-- 试卷用途 -->
                    <div class="single-line">
                        <span class="info-label">试卷用途</span>
                        <span class="info-value">{category === "00" ? "考试" : "练习"}</span>
                    </div>

                    <!-- 试卷难度 -->
                    <div class="single-line">
                        <span class="info-label">试卷难度</span>
                        <span class="info-value">{level === "00" ? "简单" : level === "02" ? "中等" : "困难"}</span>
                    </div>
                    
                    <!-- 建议时长 -->
                    <div class="single-line">
                        <span class="info-label">建议时长</span>
                        <span class="info-value">{suggested_duration} 分钟</span>
                    </div>

                    <!-- 试卷总分 -->
                    <div class="single-line">
                        <span class="info-label">试卷总分</span>
                        <span class="total-score-number">{total_score} 分</span>
                    </div>

                    <!-- 试题数量 -->
                    <div class="single-line">
                        <span class="info-label">试题数量</span>
                        <span class="question-count-number">{question_count} 道</span>
                    </div>

                    <!-- 试卷说明 -->
                    <div class="paper-description">
                        <span class="info-label">试卷说明</span>
                        <div class="description-content">{description || "无"}</div>
                    </div>

                    <!-- 试卷标签 -->
                    <div class="paper-tags">
                        <span class="info-label">试卷标签</span>
                        <div class="tags-container">
                            {#if tags.length > 0}
                                {#each tags as tag}
                                    <div class="paper-tag">
                                        <div class="color-block" style="background-color: {TAG_COLOR_LIST[getColorIndex(tag)]};"></div>
                                        <span class="tag-text">{tag}</span>
                                    </div>
                                {/each}
                            {:else}
                                <span class="no-tags">无标签</span>
                            {/if}
                        </div>
                    </div>
                </div>

                <!-- 题组列表 -->
                <div class="question-groups-container">
                    <!-- 标题 -->
                    <div class="question-groups-header">
                        <div class="title-box">
                            <div class="title">题组列表</div>
                            <span>共有 {paper_groups.length} 个题组</span>
                        </div>
                    </div>

                    <!-- 列表 -->
                    <div class="question-groups-outer-box">
                        <div class="question-groups-box">
                            {#if paper_groups.length !== 0}
                                {#each paper_groups as group}
                                    <div class="single-group">
                                        <span>{group.name}（共{group.questions.length}题，共{
                                            group.questions.reduce((sum,q)=>sum+(q.score||0),0)
                                        }分）</span>
                                    </div>
                                {/each}
                            {:else}
                                <div class="no-groups">暂无题组</div>
                            {/if}
                        </div>
                    </div>
                </div>
            </div>

            <!-- 内容区 -->
            <div class="content-container">
                {#if paper_groups}
                    {#each paper_groups as group, groupIndex}
                        <!-- svelte-ignore a11y_click_events_have_key_events -->
                        <!-- svelte-ignore a11y_no_static_element_interactions -->
                        <div class="single-group-content" onclick={()=>changeOpenState("group",group.id)} title={$GROUP_OPEN_STATE[group.id]?"收起":"展开"}>
                            <!-- 头部下拉栏 -->
                            <div class="group-header">
                                <!-- 左侧区域 -->
                                <div class="header-left">
                                    <button class="toggle-btn">{$GROUP_OPEN_STATE[group.id]?"∨":"∧"}</button>
                                    <span>{group.name}（共{group.questions.length}题，共{
                                        group.questions.reduce((sum,q)=>sum+(q.score||0),0)
                                    }分）</span>
                                </div>
                            </div>

                            <!-- 题目列表 -->
                            {#if $GROUP_OPEN_STATE[group.id]}
                                <div class="group-question-list-outer-box">
                                    <div class="group-question-list">
                                        {#if group.questions.length !== 0}
                                            {#each group.questions as question}
                                                <div class="single-question" onclick={(event)=>{event.stopPropagation();}}>
                                                    <!-- 头部下拉栏 -->
                                                    <div class="question-header">
                                                        <!-- 左侧区域 -->
                                                        <!-- svelte-ignore a11y_click_events_have_key_events -->
                                                        <!-- svelte-ignore a11y_no_static_element_interactions -->
                                                        <div title={$QUESTION_OPEN_STATE[question.id]?"收起":"展开"} class="header-left" onclick={(event)=>{event.stopPropagation();changeOpenState("question",question.id);}}>
                                                            <button class="toggle-btn-down">{$QUESTION_OPEN_STATE[question.id]?"∨":"∧"}</button>
                                                            <span class="sequence">{question.order}</span>
                                                            <span class="question-type">{QUESTION_TYPE_TRANS[question.type]}</span>
                                                            <span class={DIFFICULTY_TRANS[DIFFICULTY_TRANS[question.difficulty]]}>{DIFFICULTY_TRANS[question.difficulty]}</span>
                                                        </div>

                                                        <!-- 右侧区域 -->
                                                        <div class="header-right">
                                                            <span>分值：{question.score} 分</span>
                                                        </div>
                                                    </div>

                                                    <!-- 题目内容 -->
                                                    {#if $QUESTION_OPEN_STATE[question.id]}
                                                        <div class="question-container">                                          
                                                            <QuestionPreviewPanel question={question} showHeader={false}/>
                                                        </div>
                                                    {/if}
                                                </div>
                                            {/each}
                                        {:else}
                                            <div class="no-questions-container">
                                                
                                            </div>
                                        {/if}
                                    </div>
                                </div>
                            {/if}
                        </div>
                    {/each}
                {/if}
            </div>
        </div>
    </div>
    {:else}
    <div>
    <Loading bind:value={loading} loadingText="正在加载"></Loading>
    </div>
{/if}

<style>
    .view-paper {
        font-family: 'Noto Sans SC', sans-serif;
        color: var(--text-primary);
        overflow-y: auto;
        
        /* 顶部栏 */
        .header {
            display: flex;
            padding: 16px 32px 16px 24px;
            align-items: center;
            border-bottom: 1.5px solid var(--border-light);
            min-height: 40px;
            white-space: nowrap;

            /* 标题 */
            .title-container {
                display: flex;
                margin-right: auto;
                align-items: center;

                /* 标题符 */
                .title-icon {
                    width: 13px;
                    height: 38px;
                    background-color: var(--primary-color);
                    margin-right: 6px;
                    border-radius: var(--border-radius-sm);
                }

                /* 标题名 */
                .title-name {
                    font-size: 26px;
                    font-weight: 900;
                }
            }

            /* 试卷名称 */
            .paper-name {
                text-align: center;
                font-size: 20px;
                font-weight: 600;
                width: 30%;
                margin-left: auto;
                min-width: 108px;
            }

            /* 操作区 */
            .operation {
                display: flex;
                margin-left: auto;
                gap: 0.8vw;
                align-items: center;
            }
        }

        /* 下半区 */
        .bottom-area {
            height: 92vh;
            display: flex;

            /* 侧边栏 */
            .side-bar {
                width: 372px;
                min-width: 372px;
                padding: 18px 24px;

                /* 试卷信息 */
                .paper-info-container {
                    display: flex;
                    flex-direction: column;
                    gap: 12px;
                    font-size: 14px;
                    margin-bottom: 24px;
                    
                    /* 提示词 */
                    .info-label { margin-right: 16px; min-width: 56px; }
                    .info-value { font-weight: 500; }

                    /* 标题 */
                    .title { font-weight: 1000; font-size: 20px; }

                    /* 正常行 */
                    .single-line {
                        display: flex;
                        align-items: center;
                        
                        .total-score-number { font-weight: 500;}
                        .question-count-number { font-weight: 500; }
                    }

                    /* 试卷说明 */
                    .paper-description {
                        display: flex;
                        align-items: flex-start;

                        .description-content {
                            flex-basis: 286px;
                            padding: 6px;
                            background-color: var(--bg-secondary);
                            border-radius: var(--border-radius-sm);
                            min-height: 40px;
                            line-height: 1.5;
                        }
                    }

                    /* 试卷标签 */
                    .paper-tags {
                        display: flex;
                        align-items: flex-start;

                        .tags-container {
                            display: flex;
                            width: 300px;
                            gap: 10px 16px;
                            flex-wrap: wrap;
                            padding-top: 2px;

                            .paper-tag {
                                display: flex;
                                align-items: center;
                                height: 20px;
                                padding: 2px 8px;
                                background-color: var(--bg-secondary);
                                border-radius: var(--border-radius-sm);

                                .color-block {
                                    width: 12px;
                                    height: 12px;
                                    margin-right: 4px;
                                    border-radius: 2px;
                                }

                                .tag-text {
                                    font-size: 12px;
                                    font-weight: 500;
                                }
                            }

                            .no-tags {
                                font-size: 12px;
                                color: var(--text-secondary);
                            }
                        }
                    }
                }

                /* 题组列表 */
                .question-groups-container {
                    /* 标题 */
                    .question-groups-header {
                        display: flex;
                        align-items: center;
                        justify-content: space-between;
                        margin-bottom: 10px;

                        .title-box {
                            .title {
                                font-weight: 1000;
                                font-size: 20px;
                            }

                            span {
                                font-size: 14px;
                            }
                        }
                    }

                    /* 列表 */
                    .question-groups-outer-box {
                        border: 1px solid var(--border-light);
                        padding: 5px;

                        .question-groups-box {
                            display: flex;   
                            flex-direction: column;
                            
                            .single-group {
                                display: flex;
                                padding: 17px 21px;
                                justify-content: space-between;
                                border-bottom: 1px solid var(--border-light);
                                border-radius: var(--border-radius-md);
                                background-color: var(--bg-primary);

                                span {
                                    font-weight: 500;
                                }
                            }

                            .no-groups {
                                padding: 20px;
                                text-align: center;
                                color: var(--text-secondary);
                            }
                        }
                    }
                }
            }

            /* 内容区 */
            .content-container {
                padding: 20px;
                display: flex;
                flex-direction: column;
                gap: 10px;
                flex-grow: 1;

                .single-group-content {
                    border: 1px solid var(--border-light);
                    border-radius: var(--border-radius-sm);

                    /* 头部下拉栏 */
                    .group-header {
                        background-color: var(--bg-secondary);
                        display: flex;
                        padding: 10px 20px;
                        align-items: center;
                        min-width: 588px;

                        &:hover {
                            background-color: #edf2f7;
                            cursor: pointer;
                            color: #1890ff;

                            .toggle-btn {
                                color: #1890ff;
                            }
                        }

                        /* 左侧区域 */
                        .header-left {
                            display: flex;
                            align-items: center;

                            /* 下拉按钮 */
                            .toggle-btn {
                                background: none;
                                border: none;
                                padding: 2px 12px 0 0;
                                height: 30px;
                                margin-left: 8px;
                                cursor: pointer;
                                transform: scaleX(1.8);
                                font-size: 10px;
                                font-weight: 1000;
                            }

                            span {
                                font-weight: 600;
                            }
                        }
                    }
                    
                    /* 题目列表 */
                    .group-question-list-outer-box {
                        padding: 16px 8px;

                        .group-question-list {
                            display: flex;
                            flex-direction: column;
                            gap: 12px;
    
                            /* 暂无题目 */
                            .no-questions-container {
                                padding: 118px 0;
    
                                .no-questions-box {
                                    display: flex;
                                    flex-direction: column;
                                    align-items: center;
    
                                    .title {
                                        margin-bottom: 8px;
                                        font-size: 24px;
                                        font-weight: bold;
                                        color: var(--text-secondary);
                                    }
                                }
                            }
    
                            .single-question {
                                border: 1px solid var(--border-light);
                                border-radius: var(--border-radius-sm);
                                background-color: var(--bg-primary);
    
                                /* 头部下拉栏 */
                                .question-header {
                                    padding: 10px 16px;
                                    background-color: #fafafa;
                                    display: flex;
                                    border-bottom: 1px solid var(--border-light);
    
                                    &:hover {
                                        background-color: #edf2f7;
    
                                        .sequence { color: #1890ff; }
                                        .toggle-btn-down { color: #1890ff; }
                                    }
    
                                    /* 左侧区域 */
                                    .header-left {
                                        display: flex;
                                        align-items: center;
                                        cursor: pointer;
    
                                        /* 下拉按钮-向下状态 */
                                        .toggle-btn-down {
                                            background: none;
                                            border: none;
                                            padding: 2px 12px 0 0;
                                            height: 30px;
                                            margin-left: 8px;
                                            cursor: pointer;
                                            transform: scaleX(1.8);
                                            font-size: 10px;
                                            font-weight: 1000;
                                        }
    
                                        /* 题序 */
                                        .sequence {
                                            font-weight: 500;
                                        }
                                        
                                        /* 题型 */
                                        .question-type {
                                            padding: 2px 8px;
                                            background-color: #e8f8f2;
                                            color: var(--primary-color);
                                            margin-left: 24px;
                                            border-radius: var(--border-radius-sm);
                                        }
    
                                        /* 难度 */
                                        .easy-level, .normal-level, .hard-level {
                                            margin-left: 12px;
                                            padding: 2px 8px;
                                            border-radius: var(--border-radius-sm);
                                        }
                                        .easy-level { color: var(--green); background-color:#e8f8f2;}
                                        .normal-level { color: var(--orange); background-color:#fef3e6; }
                                        .hard-level { color: var(--red); background-color:#fdecee; }
                                    }
    
                                    /* 右侧区域 */
                                    .header-right {
                                        margin-left: auto;
                                        display: flex;
                                        align-items: center;
    
                                        span {
                                            font-size: 14px;
                                            color: var(--text-secondary);
                                        }
                                    }
                                }
    
                                /* 题目内容 */
                                .question-container {
                                    padding-bottom: 10px;
                                }
                            }
                        }
                    }
                }
            }
        }
    }
</style>