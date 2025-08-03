<script>
    import { goto } from "$app/navigation";
    import Button from "$lib/components/Button/Button.svelte";
    import { questionDifficultyTrans, questionTypeTrans, tagColorList } from "../_utils/data";
    import { getColorIndex, restoreOpenState } from "../_utils/func";
    import ImportQuestion from "../_components/ImportQuestion/ImportQuestion.svelte";
    import InputBox from "$lib/components/Input/InputBox.svelte";
    import Select from "$lib/components/Select/Select.svelte";
    import Option from "$lib/components/Select/Option.svelte";
    import { onMount, tick } from "svelte";
    import { createEmptyPaper, fetchPaper, savePaper } from "../_utils/api";
    import Toast from "$lib/components/Toast/Toast.svelte";
    import { toast } from "$lib/components/Toast/Toast";
    import MessageBox from "$lib/components/MessageBox/MessageBox";
    import { debounce } from "$lib/utils/optimize";
    import QuestionPreviewPanel from "../../question-bank/_components/QuestionPreviewPanel.svelte";
    import QuestionPreview from "../_components/PreviewQuestion/PreviewQuestion.svelte"
    
    /*************** 控制开关区 ****************/
    let importModalIsOpen = $state(false);  // 从题库中导入题目弹窗
    let isAddingGroup = $state(false);      // 添加题组

    function closeImportModal() {
        importModalIsOpen = false;
    }

    /*************** 控制开关区 ****************/
    

    /*************** 试卷信息区 ****************/

    let paperID = $state(0);
    let paperInfo = $state(null);
    let paperName = $state("新建试卷");
    let category = $state("00");            // 试卷用途 00：考试 02：练习
    let level = $state("00");               // 试卷难度 00：简单 02：中等 04：困难
    let suggestedDuration = $state(120);    // 建议时长，单位为分钟
    let totalScore = $state(0);
    let questionCount = $state(0);
    let description = $state("");
    let tags = $state([]);

    // 防抖更新试卷信息
    const debounceUpDatePaperInfo = debounce(() => {
        const actions = [
            {
                action: "update_info",
                payload: {
                    name: paperName,
                    category: category,
                    level: level,
                    duration: suggestedDuration,
                    description: description,
                    tags: tags
                }
            }
        ];

        savePaper(paperID, actions)
        .then(() => {
            toast.success("试卷已同步更新", 1000);
        });
    }, 500, false);

    $effect(() => {
        paperName; category; level; suggestedDuration; description; tags;
        debounceUpDatePaperInfo();
    });

    /*************** 试卷信息区 ****************/



    /**************** 标签处理区 ****************/

    let toAddTag = $state("");

    // 新增标签
    function addTag() {
        if (event.key === "Enter" && toAddTag.trim() !== "") {
            tags = [toAddTag, ...tags];
            toAddTag = "";
        }
    }

    // 清除新建标签内容
    function clearToAddTagContent() {
        toAddTag = "";
    }

    // 处理旧标签 Enter 键
    function oldTagEnter() {
        if(event.key === "Enter") {
            event.target.blur();
        }
    }

    // 删除旧标签
    function deleteTag(index) {
        tags = tags.toSpliced(index, 1);
    }

    /**************** 标签处理区 ****************/    



    /**************** 题组列表区 ****************/

    let paperGroups = $state([]);
    let toAddGroupName = $state("");
    let toAddGroup = $state(null);
    let toEditGroupID = $state(null);
    let toEditGroupName = $state("");
    let toEditGroup = $state(null);
    let groupID = $state(0);
    let groupName = $state("");

    // 删除题组
    function deleteGroup(groupID) {
        // 判断是否为最后一个题组
        if (paperGroups.length === 1) {
            toast.error("至少保留一个题组", 1000);
            return;
        }

        MessageBox({
            title: "删除确认",
            content: "请问是否要删除该题组？",
            confirm_button_type: "danger",

            onConfirm: () => {
                // 删除后重新排序
                let groupIDs = paperGroups.map(group => group.id);
                groupIDs = groupIDs.filter(id => id !== groupID)

                const actions = [
                    {
                        action: "delete_group",
                        payload: groupID
                    },
                    {
                        action: "move_group",
                        payload: groupIDs
                    }
                ];

                savePaper(paperID, actions)
                    .then(() => {
                        fetchPaper(paperID)
                        .then(result => {
                            restoreOpenState(result.data.GroupsData, paperGroups);
                            paperGroups = result.data.GroupsData;
                            toast.success("试卷已同步更新", 1000);
                        });
                    });
            }
        });
    }

    // 添加题组
    async function addGroup() {
        isAddingGroup = true;
        await tick();
        toAddGroup.focus();
    }

    // 取消添加题组
    function cancelAddGroup() {
        isAddingGroup = false;
    }

    // 确认添加题组
    function confirmAddgroup() {
        if(event.key === "Enter" && toAddGroupName.trim() !== "") {

            toAddGroup.blur();

            const actions = [
                {
                    action: "add_group",
                    payload: {
                        name: toAddGroupName,
                        order: paperGroups.length + 1
                    }
                }
            ];
            
            savePaper(paperID, actions)
                .then(result => {
                    fetchPaper(paperID)
                        .then(result => {
                            restoreOpenState(result.data.GroupsData, paperGroups);
                            paperGroups = result.data.GroupsData;
                            isAddingGroup = false;
                            toAddGroupName = "";
                            toast.success("试卷已同步更新", 1000);
                    });
                })
                .finally(() => {
                });
        }
    }

    // 编辑题组名称
    async function editGroupName(id, name) {
        toEditGroupID = id;
        toEditGroupName = name;
        await tick();
        toEditGroup.focus();
    }

    // 确认编辑题组名称
    function confirmEditGroupName() {
        if(event.key === "Enter" && toEditGroupName.trim() !== "") {

            toEditGroup.blur();

            const actions = [
                {
                    action: "update_group",
                    payload: {
                        id: toEditGroupID,
                        name: toEditGroupName
                    }
                }
            ];
            
            savePaper(paperID, actions)
                .then(() => {
                    fetchPaper(paperID)
                        .then(result => {
                            restoreOpenState(result.data.GroupsData, paperGroups);
                            paperGroups = result.data.GroupsData;
                            toEditGroupID = null;
                            toast.success("试卷已同步更新", 1000);
                        });
                });
        }
    }

    // 删除题目
    function deleteQuestion(questionID, group) {
        // 检查是否为最后一道题目
        if(group.questions.length === 1) {
            toast.error("至少保留一道题目", 1000);
            return;
        }

        MessageBox({
            title: "删除确认",
            content: "请问是否要删除该题目？",
            confirm_button_type: "danger",

            onConfirm: () => {
                // 删除后重新排序
                const groupQuestions = group.questions;
                let questionIDs = groupQuestions.map(question => question.id);
                questionIDs = questionIDs.filter(id => id !== questionID)

                const actions = [
                    {
                        action: "delete_question",
                        payload: [questionID]
                    },
                    {
                        action: "move_question",
                        payload: questionIDs
                    }
                ];

                savePaper(paperID, actions)
                    .then(() => {
                        fetchPaper(paperID)
                            .then(result => {
                                restoreOpenState(result.data.GroupsData, paperGroups);
                                paperGroups = result.data.GroupsData;
                                toast.success("试卷已同步更新", 1000);
                            });
                    });
            }
        });
    }

    // 导入题目更新
    function updateAfterImport(updatedGroups) {
        restoreOpenState(updatedGroups, paperGroups);
        paperGroups = updatedGroups;
    }

    // 一键展开所有题组和题目
    function expandAll() {
    paperGroups.forEach(group => {
        group.isOpen = true;
        group.questions?.forEach(question => {
        question.isOpen = true;
        });
    });
    }

    // 一键收起所有题组和题目
    function collapseAll() {
    paperGroups.forEach(group => {
        group.isOpen = false;
        group.questions?.forEach(question => {
        question.isOpen = false;
        });
    });
    }

    /**************** 题组列表区 ****************/

    // 挂载区
    onMount(() => {
        paperID = JSON.parse(localStorage.getItem('currentPaperID'));
        fetchPaper(paperID)
            .then(result => {
                paperInfo = result.data;
                paperGroups = result.data.GroupsData;

                paperGroups.forEach(group => {
                    // 所有题组展开
                    group.isOpen = true;
                    
                    group.questions.forEach(question => {
                        // 所有题目展开
                        question.isOpen = true;
                    });
                });

                paperName = paperInfo.Name;
                category = paperInfo.Category;
                level = paperInfo.Level;
                suggestedDuration = paperInfo.SuggestedDuration;
                totalScore = paperInfo.TotalScore;
                questionCount = paperInfo.QuestionCount;
                description = paperInfo.Description;
                tags = paperInfo.Tags;
            });
    })

    function test() {
        console.log(toCreatePaper);
        console.log(paperGroups);
    }

</script>

<!-- <button onclick={test}>点我</button> -->

{#if importModalIsOpen}
    <ImportQuestion
        onclose={closeImportModal}
        update={updateAfterImport}
        toAddGroupID={groupID}
        toAddgroupName={groupName}
    />
{/if}

<div class="add-paper">
    <!-- 顶部栏 -->
    <div class="header">
        <!-- 标题 -->
        <div class="title-container">
            <div class="title-icon"></div>
            <span class="title-name">自定义组卷</span>
        </div>

        <!-- 试卷名称 -->
        <input class="paper-name-input {paperName===""?"name-warn":""}" type="text" bind:value={paperName} placeholder="试卷名称不能为空">
        
        <!-- 操作区 -->
        <div class="operation">
            <Button onclick={()=>expandAll()} plain={true}>一键展开</Button>
            <Button onclick={()=>collapseAll()} plain={true}>一键收起</Button>
            <Button onclick={()=>{groupID=0;importModalIsOpen=true}}>从题库中导入</Button>
            <Button type="danger" plain={true} onclick={()=>goto('/teacher/paper')}>退出</Button>
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
                    <Select bind:value={category}>
                        <Option value="00" label="考试"></Option>
                        <Option value="02" label="练习"></Option>
                    </Select>
                </div>

                <!-- 试卷难度 -->
                <div class="single-line">
                    <span class="info-label">试卷难度</span>
                    <div class="level-container">
                        <div class="single-level">
                            <input type="radio" name="paper-level" value="00" bind:group={level}>简单
                        </div>
                        <div class="single-level">
                            <input type="radio" name="paper-level" value="02" bind:group={level}>中等
                        </div>
                        <div class="single-level">
                            <input type="radio" name="paper-level" value="04" bind:group={level}>困难
                        </div>
                    </div>
                </div>
                
                <!-- 建议时长 -->
                <div class="single-line">
                    <span class="info-label">建议时长</span>
                    <InputBox bind:value={suggestedDuration} type="number" showLabel={false} clearable={false}/>
                    <span class="duration-span">分钟</span>
                </div>

                <!-- 试卷总分 -->
                <div class="single-line">
                    <span class="info-label">试卷总分</span>
                    <span class="total-score-number">{totalScore}</span>
                    <span class="total-score-span">分</span>
                </div>

                <!-- 试题数量 -->
                <div class="single-line">
                    <span class="info-label">试题数量</span>
                    <span class="question-count-number">{questionCount}</span>
                    <span class="question-count-span">道</span>
                </div>

                <!-- 试卷说明 -->
                <div class="paper-description">
                    <span class="info-label">试卷说明</span>
                    <textarea class="description-textarea" bind:value={description} placeholder="输入试卷说明"></textarea>
                </div>

                <!-- 试卷标签 -->
                <div class="paper-tags">
                    <span class="info-label">试卷标签</span>
                    <div class="tags-container">
                        <!-- 固定用于创建新标签的标签 -->
                        <div class="paper-tag" style="border: 1.5px dashed var(--border-medium);">
                            <div class="color-block" style="background-color: {toAddTag===""? "#40d5ff":tagColorList[getColorIndex(toAddTag)]};"></div>
                            <div class="btn-box">
                                <input type="text" bind:value={toAddTag} onkeydown={addTag} placeholder="+标签"/>
                                <button onclick={clearToAddTagContent}>✕</button>
                            </div>
                        </div>

                        <!-- 已创建的标签 -->
                        {#each tags as tag, index}
                            <div class="paper-tag">
                                <div class="color-block" style="background-color: {tag===""? "#40d5ff":tagColorList[getColorIndex(tag)]};"></div>
                                <div class="btn-box">
                                    <input type="text" bind:value={tags[index]} onkeydown={oldTagEnter} placeholder="+标签"/>
                                    <button onclick={()=>deleteTag(index)}>✕</button>
                                </div>
                            </div>
                        {/each}
                    </div>
                </div>
            </div>

            <!-- 题组列表 -->
            <div class="question-groups-container">
                <!-- 标题 -->
                <div class="question-groups-header">
                    <div class="title-box">
                        <div class="title">题组列表</div>
                        <span>共有 {paperGroups.length} 个题组</span>
                    </div>
                    <Button onclick={()=>addGroup()} plain={true}>添加题组</Button>
                </div>

                <!-- 列表 -->
                <div class="question-groups-box">
                    <!-- 已有题组 -->
                    {#if paperGroups.length !== 0}
                        {#each paperGroups as group}
                            {#if toEditGroupID === group.id}
                               <div class="single-group">
                                    <input bind:value={toEditGroupName} onkeydown={()=>confirmEditGroupName()} bind:this={toEditGroup} class="add-group-input" type="text">
                                    <div class="btn-box">
                                        <!-- 删除按钮 -->
                                        <button onclick={()=>{toEditGroupID=null}} class="delete-group-btn" title="删除">✖</button>
                                    </div>
                                </div>
                            {:else}
                                <div class="single-group">
                                    <span>{group.name}</span>
                                    <div class="btn-box">
                                        <!-- 编辑按钮 -->
                                        <button onclick={()=>editGroupName(group.id,group.name)} class="edit-group-btn" title="编辑" aria-label="编辑题目">
                                            <svg
                                                viewBox="0 0 1024 1024"
                                                fill="none"
                                                stroke="currentColor"
                                                stroke-width="2"
                                                stroke-linecap="round"
                                                stroke-linejoin="round"
                                                width="10"
                                                height="10"
                                            >
                                                <path
                                                    d="M114.445959 666.607355c-20.078238 20.078238-20.078238 46.179948 0 68.266011l174.680675 174.680675c20.078238 20.078238 54.211244 20.078238 68.266011 0l477.862075-477.862076c20.078238-20.078238 20.078238-46.179948 0-68.26601l-174.680675-174.680675c-20.078238-20.078238-54.211244-20.078238-68.26601 0L114.445959 666.607355zM760.965238 14.064605l-100.391193 100.391193 248.970157 248.970157 100.391193-100.391193c34.133005-34.133005 0-68.266011 0-68.266011L835.25472 20.088077c-2.007824-6.023472-34.133005-38.148653-74.289482-6.023472zM46.179948 728.849895L0 1024l295.150105-46.179948L46.179948 728.849895z"
                                                    fill="currentColor"
                                                />
                                            </svg>
                                        </button>
                                        <!-- 删除按钮 -->
                                        <button onclick={()=>deleteGroup(group.id)} class="delete-group-btn" title="删除">✖</button>
                                    </div>
                                </div>
                            {/if}
                        {/each}
                    {/if}

                    <!-- 添加题组 -->
                    {#if isAddingGroup}
                        <div class="single-group">
                            <input bind:value={toAddGroupName} onkeydown={confirmAddgroup} bind:this={toAddGroup} class="add-group-input" type="text">
                            <div class="btn-box">
                                <!-- 取消按钮 -->
                                <button onclick={()=>cancelAddGroup()} class="delete-group-btn" title="删除">✖</button>
                            </div>
                        </div>
                    {/if}

                </div>
            </div>
        </div>

        <!-- 内容区 -->
        <div class="content-container">
            {#if paperGroups}
                {#each paperGroups as group}
                    <div class="single-group-content">
                        <!-- 头部下拉栏 -->
                        <div class="group-header">
                            <!-- 左侧区域 -->
                            <!-- svelte-ignore a11y_click_events_have_key_events -->
                            <!-- svelte-ignore a11y_no_static_element_interactions -->
                            <div class="header-left" onclick={()=>{group.isOpen=!group.isOpen}}>
                                <button class="toggle-btn">{group.isOpen?"∨":"∧"}</button>
                                <span>{group.name}</span>
                            </div>

                            <!-- 编辑按钮 -->
                            <button class="edit-group-btn" title="编辑" aria-label="编辑题目">
                                <svg
                                    viewBox="0 0 1024 1024"
                                    fill="none"
                                    stroke="currentColor"
                                    stroke-width="2"
                                    stroke-linecap="round"
                                    stroke-linejoin="round"
                                    width="14"
                                    height="14"
                                >
                                    <path
                                        d="M114.445959 666.607355c-20.078238 20.078238-20.078238 46.179948 0 68.266011l174.680675 174.680675c20.078238 20.078238 54.211244 20.078238 68.266011 0l477.862075-477.862076c20.078238-20.078238 20.078238-46.179948 0-68.26601l-174.680675-174.680675c-20.078238-20.078238-54.211244-20.078238-68.26601 0L114.445959 666.607355zM760.965238 14.064605l-100.391193 100.391193 248.970157 248.970157 100.391193-100.391193c34.133005-34.133005 0-68.266011 0-68.266011L835.25472 20.088077c-2.007824-6.023472-34.133005-38.148653-74.289482-6.023472zM46.179948 728.849895L0 1024l295.150105-46.179948L46.179948 728.849895z"
                                        fill="currentColor"
                                    />
                                </svg>
                            </button>

                            <!-- 右侧区域 -->
                            <div class="header-right">
                                <!-- <span>每题分值：</span>
                                <input value={10} id="temp-average-question-score-input" type="number">
                                <Button>导入题目</Button> -->
                            </div>
                        </div>

                        <!-- 题目列表 -->
                        {#if group.isOpen}
                            <div class="group-question-list">
                                
                                {#if group.questions.length !== 0}
                                    {#each group.questions as question}
                                        <div class="single-question">
                                            <!-- 头部下拉栏 -->
                                            <div class="question-header">
                                                <!-- 左侧区域 -->
                                                <!-- svelte-ignore a11y_click_events_have_key_events -->
                                                <!-- svelte-ignore a11y_no_static_element_interactions -->
                                                <div class="header-left"  onclick={()=>{question.isOpen=!question.isOpen}}>
                                                    <button class="toggle-btn-down">{question.isOpen?"∨":"∧"}</button>
                                                    <span class="sequence">{question.order}</span>
                                                    <span class="question-type">{questionTypeTrans[question.type]}</span>
                                                    <span class={questionDifficultyTrans[questionDifficultyTrans[question.difficulty]]}>{questionDifficultyTrans[question.difficulty]}</span>
                                                </div>

                                                <!-- 右侧区域 -->
                                                <div class="header-right">
                                                    <span>分值：{question.score} 分</span>
                                                    <!-- <input value={question.score} id="temp-per-question-score-input" type="number"> -->
<!-- 
                                                    <button class="move-btn" title="上移">↑</button>
                                                    <button class="move-btn" title="下移">↓</button>
                                                    <button class="edit-question-btn" title="编辑" aria-label="编辑题目">
                                                        <svg
                                                            viewBox="0 0 1024 1024"
                                                            fill="none"
                                                            stroke="currentColor"
                                                            stroke-width="2"
                                                            stroke-linecap="round"
                                                            stroke-linejoin="round"
                                                            width="12"
                                                            height="12"
                                                        >
                                                            <path
                                                                d="M114.445959 666.607355c-20.078238 20.078238-20.078238 46.179948 0 68.266011l174.680675 174.680675c20.078238 20.078238 54.211244 20.078238 68.266011 0l477.862075-477.862076c20.078238-20.078238 20.078238-46.179948 0-68.26601l-174.680675-174.680675c-20.078238-20.078238-54.211244-20.078238-68.26601 0L114.445959 666.607355zM760.965238 14.064605l-100.391193 100.391193 248.970157 248.970157 100.391193-100.391193c34.133005-34.133005 0-68.266011 0-68.266011L835.25472 20.088077c-2.007824-6.023472-34.133005-38.148653-74.289482-6.023472zM46.179948 728.849895L0 1024l295.150105-46.179948L46.179948 728.849895z"
                                                                fill="currentColor"
                                                            />
                                                        </svg>
                                                    </button>
                                                     -->
                                                    <button onclick={()=>deleteQuestion(question.id,group)} class="delete-question-btn" title="删除">✕</button>
                                                </div>
                                            </div>

                                            <!-- 题目内容 -->
                                            {#if question.isOpen}
                                                <div class="question-container">
                                                    <QuestionPreview {question}/>                                            
                                                </div>
                                            {/if}
                                        </div>
                                    {/each}
                                
                                    <!-- 暂无题目 -->
                                    {:else}
                                    <div class="no-questions-container">
                                        <div class="no-questions-box">
                                            <span class="title">题组暂无题目</span>
                                            <span class="prompt">可以通过以下方式快速添加题目：</span>
                                            <Button onclick={()=>{groupID=group.id;groupName=group.name;importModalIsOpen=true}}>导入题目</Button>
                                        </div>
                                    </div>
                                {/if}
                            </div>
                        {/if}
                    </div>
                {/each}
            {/if}
        </div>
    </div>
</div>

<style>
    /**************** 临时组件区 ****************/

    #temp-average-question-score-input {
        padding: 4px 8px 4px 24px;
        width: 40px;
        margin-right: 30px;
        font-size: 16px;
    }

    #temp-per-question-score-input {
        padding: 4px 8px 4px 16px;
        width: 36px;
        margin-right: 12px;
        font-size: 16px;
    }

    /**************** 临时组件区 ****************/


    .add-paper {
        font-family: 'Noto Sans SC', sans-serif;
        color: var(--text-primary);
        
        /* 顶部栏 */
        .header {
            /* background-color: red; */
            display: flex;
            padding: 16px 32px 16px 24px;
            align-items: center;
            border-bottom: 1.5px solid var(--border-light);
            height: 40px;
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
            .paper-name-input {
                border-top: none;
                border-left: none;
                border-right: none;
                padding: 8px 12px;
                text-align: center;
                font-size: 20px;
                transition: all 0.3s;
                width: 30%;
                margin-left: auto;
                min-width: 108px;

                &:focus {
                    outline: none;
                    border-color: var(--primary-hover);
                }
            }
            .name-warn {
                border-color: var(--red);
                transition: all 0.3s;
                background-color: rgb(255, 241, 240);

                &::placeholder {
                    color: var(--red);
                }

                &:focus {
                    outline: none;
                    border-color: var(--red);
                }
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
            /* background-color: rebeccapurple; */
            height: 92vh;
            display: flex;

            /* 侧边栏 */
            .side-bar {
                /* background-color: aliceblue; */
                width: 372px;
                min-width: 372px;
                padding: 18px 24px;

                /* 试卷信息 */
                .paper-info-container {
                    /* background-color: antiquewhite; */
                    display: flex;
                    flex-direction: column;
                    gap: 12px;
                    font-size: 14px;
                    margin-bottom: 24px;
                    
                    /* 提示词 */
                    .info-label { margin-right: 16px; min-width: 56px; }

                    /* 标题 */
                    .title { font-weight: 1000; font-size: 20px; }

                    /* 正常行 */
                    .single-line {
                        display: flex;
                        align-items: center;

                        .level-container {
                            display: flex;
                            gap: 8px;

                            .single-level {
                                display: flex;
                                align-items: flex-end;
                                
                                input {
                                    width: 20px;
                                    height: 20px;
                                    accent-color: var(--blue);
                                    margin-right: 8px;
                                }
                            }
                        }
                        
                        .duration-span { font-size: 12px; margin-left: 8px; width: 34px; }
                        .total-score-number { font-weight: 500;}
                        .total-score-span { margin-left: 4px; font-weight: 500; }
                        .question-count-number { font-weight: 500; }
                        .question-count-span { margin-left: 4px; font-weight: 500; }
                    }

                    /* 试卷说明 */
                    .paper-description {
                        display: flex;
                        align-items: flex-start;

                        .description-textarea {
                            resize: vertical;
                            min-height: 60px;
                            flex-basis: 286px;
                            padding: 6px;
                            transition: all 0.3s;
                            outline: none;
                            border-radius: var(--input-border-radius);
                            border: 1px solid var(--border-light);

                            &:focus {
                                border: 1px solid #40a9ff;
                                box-shadow: 0 0 0 2px rgba(24, 144, 255, 0.2);
                            }
                        }
                    }

                    /* 试卷标签 */
                    .paper-tags {
                        /* background-color: antiquewhite; */
                        display: flex;
                        align-items: flex-start;

                        .tags-container {
                            /* background-color: violet; */
                            display: flex;
                            width: 300px;
                            height: 48px;
                            gap: 10px 16px;
                            overflow-y: auto;
                            flex-wrap: wrap;
                            padding-top: 2px;

                            .paper-tag {
                                /* background-color: red; */
                                display: flex;
                                height: 16px;
                                border: 1.5px solid transparent;

                                /* 颜色块 */
                                .color-block {
                                    width: 12px;
                                    height: 12px;
                                    margin: 2px;
                                }

                                /* 按钮块 */
                                .btn-box {
                                    display: flex;
                                    align-items: center;
                                    height: 16px;
                                    border-bottom: 1px solid transparent;
                                    
                                    &:hover {
                                        border-bottom: 1px solid #7792ff;
                                    }

                                    &:focus-within {
                                        border-bottom: 1px solid #7792ff;
                                    }

                                    input {
                                        font-weight: 500;
                                        height: 16px;
                                        padding: 0;
                                        width: 42px;
                                        border: none;
                                        font-size: 12px;
                                        outline: none;
                                        margin-left: 2px;
                                        margin-right: 8px;
                                        color: var(--text-primary);
                                    }

                                    button {
                                        font-size: 10px;
                                        padding: 0;
                                        background: none;
                                        border: none;
                                        cursor: pointer;
                                        font-weight: 600;
                                        color: #3f3f3f;
                                        visibility: hidden;

                                        &:hover {
                                            color: var(--primary-hover);
                                        }
                                    }
                                }

                                .btn-box:hover button {
                                    visibility: visible;
                                }
                            }
                        }
                    }
                }

                /* 题组列表 */
                .question-groups-container {
                    /* background-color: aquamarine; */

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
                    .question-groups-box {
                        /* background-color: #40a9ff; */
                        padding: 5px;   
                        display: flex;   
                        border: 1px solid var(--border-light);
                        border-radius: var(--border-radius-sm);
                        flex-direction: column;          

                        .single-group {
                            display: flex;
                            padding: 17px 21px;
                            justify-content: space-between;
                            /* cursor: grab; */
                            border-bottom: 1px solid var(--border-light);

                            span {
                                font-weight: 500;
                            }
                        
                            &:hover {
                                background-color: var(--bg-secondary);
                            }

                            /* 添加题组 */
                            .add-group-input {
                                padding: 6px;
                                transition: all 0.3s;
                                outline: none;
                                border-radius: var(--input-border-radius);
                                border: 1px solid var(--border-light);
                                width: 220px;

                                &:focus {
                                    border: 1px solid #40a9ff;
                                    box-shadow: 0 0 0 2px rgba(24, 144, 255, 0.2);
                                }
                            }

                            /* 按钮 */
                            .btn-box {
                                display: flex;
                                align-items: center;
                                gap: 3px;

                                svg {
                                    padding-top: 5px;
                                }

                                .edit-group-btn, .delete-group-btn {
                                    width: 24px;
                                    height: 24px;
                                    border: 1px solid var(--border-light);
                                    background: none;
                                    border-radius: var(--btn-border-radius);
                                    cursor: pointer;
                                    background-color: var(--bg-primary);
                                }
    
                                /* 编辑按钮 */
                                .edit-group-btn {
                                    padding: 0;
    
                                    &:hover {
                                        border-color: var(--green);
                                        color: var(--green);
                                    }
                                }
                            }

                            /* 删除按钮 */
                            .delete-group-btn {
                                font-size: 14px;

                                &:hover {
                                    border-color: var(--red);
                                    color: var(--red);
                                }
                            }
                        }
                    }
                }
            }

            /* 内容区 */
            .content-container {
                /* background-color: aliceblue; */
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
                        }

                        /* 左侧区域 */
                        .header-left {
                            display: flex;
                            align-items: center;
                            cursor: pointer;

                            &:hover, &:hover .toggle-btn {
                                color: #1890ff;
                            }

                            .toggle-btn {
                                background: none;
                                /* background-color: red; */
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

                        /* 编辑按钮 */
                        .edit-group-btn {
                            border: none;
                            background: none;
                            cursor: pointer;
                            padding: 5px 0 0 0; 
                            width: 22px;
                            height: 22px;
                            /* background-color: red; */
                            visibility: hidden;  /* 暂时没有编辑功能 */

                            &:hover {
                                color: #1890ff;
                            }
                        }

                        /* 右侧区域 */
                        .header-right {
                            margin-left: auto;
                            
                            span {
                                font-size: 14px;
                                color: var(--text-secondary);
                                margin-right: 1vw;
                            }
                        }
                    }
                    
                    /* 题目列表 */
                    .group-question-list {
                        padding: 16px 8px;
                        display: flex;
                        flex-direction: column;
                        gap: 12px;

                        /* 暂无题目 */
                        .no-questions-container {
                            /* background-color: #1890ff; */
                            padding: 118px 0;

                            .no-questions-box {
                                /* background-color: #7792ff; */
                                display: flex;
                                flex-direction: column;
                                align-items: center;

                                .title {
                                    margin-bottom: 8px;
                                    font-size: 24px;
                                    font-weight: bold;
                                }

                                .prompt {
                                    margin-bottom: 16px;
                                    font-size: 14px;
                                    color: var(--text-secondary);
                                }
                            }
                        }

                        .single-question {
                            border: 1px solid var(--border-light);
                            border-radius: var(--border-radius-sm);

                            /* 头部下拉栏 */
                            .question-header {
                                padding: 10px 16px;
                                background-color: #fafafa;
                                display: flex;
                                border-bottom: 1px solid var(--border-light);

                                &:hover {
                                    background-color: #edf2f7;

                                    .sequence { color: #1890ff; }

                                    .toggle-btn-down, .toggle-btn-left { color: #1890ff; }
                                }

                                /* 左侧区域 */
                                .header-left {
                                    display: flex;
                                    align-items: center;
                                    cursor: pointer;

                                    /* 下拉按钮-向右状态 */
                                    .toggle-btn-left {
                                        background: none;
                                        /* background-color: red; */
                                        border: none;
                                        padding: 0;
                                        height: 30px;
                                        margin-left: 6px;
                                        margin-right: 14px;
                                        cursor: pointer;
                                        transform: scaleY(1.8) rotate(-90deg);
                                        font-size: 10px;
                                        font-weight: 1000;
                                    }

                                    /* 下拉按钮-向下状态 */
                                    .toggle-btn-down {
                                        background: none;
                                        /* background-color: red; */
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

                                    .move-btn, .edit-question-btn, .delete-question-btn {
                                        width: 30px;
                                        height: 30px;
                                        margin-left: 6px;
                                        border-radius: var(--btn-border-radius);
                                        border: 1px solid var(--border-light);
                                        background-color: var(--bg-primary);
                                        cursor: pointer;
                                    }

                                    /* 移动按钮 */
                                    .move-btn {
                                        font-size: 16px;

                                        &:hover {
                                            color: var(--primary-color);
                                            border-color: var(--primary-color);
                                            transition: all 0.3s;
                                        }
                                    }

                                    /* 编辑按钮 */
                                    .edit-question-btn {

                                        &:hover {
                                            color: var(--green);
                                            border-color: var(--green);
                                            transition: all 0.3s;
                                        }

                                        svg {
                                            padding-top: 4px;
                                        }
                                    }

                                    /* 删除按钮 */
                                    .delete-question-btn {
                                        font-weight: bold;

                                        &:hover {
                                            color: var(--red);
                                            border-color: var(--red);
                                            transition: all 0.3s;
                                        }
                                    }
                                }
                            }

                            /* 题目内容 */
                            .question-container {
                                /* padding: 0 20px; */

                                .prompt {
                                    font-size: 14px;
                                    color: #619cf5;
                                    margin-right: 10px;
                                }

                                /* 问题 */
                                .question-box {
                                    padding: 12px 8px;
                                    margin-bottom: 10px;
                                }

                                /* 答案 */
                                .answer-box {
                                    display: flex;
                                    padding: 12px 0;
                                    background:linear-gradient(to right, #ddd 0%, #ddd 8px, transparent 8px, transparent 15px) repeat-x bottom;
                                    background-size: 15px 2px;
                                    align-items: center;

                                    .sequence {
                                        color: #619cf5;
                                        font-size: 14px;
                                        margin-right: 10px;
                                    }
                                }

                                /* 解析 */
                                .analysis-box {
                                    display: flex;
                                    padding: 12px 0;
                                }
                            }
                        }
                    }
                }
            }
        }
    }

</style>