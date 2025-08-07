<!--
 * @Author: WangKaidun 1597225095@qq.com
 * @Date: 2025-08-01 15:21:42
 * @LastEditors: WangKaidun 1597225095@qq.com
 * @LastEditTime: 2025-08-06 22:31:18
 * @FilePath: \exam\src\routes\teacher\paper\manual\+page@.svelte
 * @Description: 自定义组卷页面
 * @Copyright (c) 2025 by ${git_name_email}, All Rights Reserved. 
-->
<script>
    import Button from "$lib/components/Button/Button.svelte";
    import ImportQuestion from "../_components/ImportQuestion/ImportQuestion.svelte";
    import InputBox from "$lib/components/Input/InputBox.svelte";
    import Select from "$lib/components/Select/Select.svelte";
    import Option from "$lib/components/Select/Option.svelte";
    import Toast from "$lib/components/Toast/Toast.svelte";
    import MessageBox from "$lib/components/MessageBox/MessageBox";
    import QuestionPreview from "../_components/PreviewQuestion/PreviewQuestion.svelte"
    import { goto } from "$app/navigation";
    import { DIFFICULTY_TRANS, QUESTION_TYPE_TRANS } from "../_utils/tool";
    import { onMount, tick } from "svelte";
    import { toast } from "$lib/components/Toast/Toast";
    import { debounce } from "$lib/utils/optimize";
    import { get } from "svelte/store";
    import { CURRENT_PAPER_ID, GROUP_OPEN_STATE, QUESTION_OPEN_STATE } from "../_stores/store";

    /******************* API 区 ********************/

    // 获取试卷详情
    export function fetchPaper(
        paperID = 0
    ){
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
            .then(data => {
                return data;
            })
            .catch(error => {
                console.error('获取试卷详情出错：', error);
                return null;
            });
    }

    // 保存试卷
    export function savePaper(
        paperID = 0,
        actionsArr = []
    ){
        const PARAMS = new URLSearchParams();

        PARAMS.append("paper_id", paperID);

        const DATA = {
            data: {
                actions: actionsArr
            }
        };

        const HEADERS = {
            "Content-Type": "application/json"
        };

        return fetch(`/api/paper/manual?${PARAMS.toString()}`, {
            headers: HEADERS,
            method: "PUT",
            credentials: "include",
            body: JSON.stringify(DATA)
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
                console.error('保存试卷出错：', error);
                return null;
            });
    }

    /******************* API 区 ********************/


    
    /******************* 控制开关区 *****************/
    let import_modal_is_open = $state(false);  // 从题库中导入题目弹窗
    let is_adding_group = $state(false);      // 添加题组
    let page_is_ready = $state(false);

    function closeImportModal() {
        import_modal_is_open = false;
    }

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

    // 保存试卷信息
    function UpDatePaperInfo() {
        const ACTIONS = [
            {
                action: "update_info",
                payload: {
                    name: paper_name,
                    category: category,
                    level: level,
                    duration: suggested_duration,
                    description: description,
                    tags: tags
                }
            }
        ];
        savePaper(paperID, ACTIONS);
    }

    // 防抖更新试卷信息
    const debounceUpDatePaperInfo = debounce(() => {
        UpDatePaperInfo();
    }, 500, false);

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
        // 获取标签名称的第一个字符
        const FIRSTCHAR = tagName.charAt(0);

        // 获取第一个字符的 Unicode 编码
        const CHARCODE = FIRSTCHAR.charCodeAt(0);

        // 计算并返回颜色数组的索引
        return CHARCODE % TAG_COLOR_LIST.length;
    }

    let to_add_tag = $state("");

    // 新增标签
    function addTag() {
        if (event.key === "Enter" && to_add_tag.trim() !== "") {
            tags = [to_add_tag, ...tags];
            to_add_tag = "";
            UpDatePaperInfo();
        }
    }

    // 清除新建标签内容
    function clearToAddTagContent() {
        to_add_tag = "";
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
        UpDatePaperInfo();
    }

    /***************** 标签处理区 *****************/    



    /***************** 题组列表区 *****************/

    let paper_groups = $state([]);
    let to_add_group_name = $state("");
    let to_add_group = $state(null);
    let to_edit_groupID = $state(null);
    let to_edit_group_name = $state("");
    let to_edit_group = $state(null);
    let groupID = $state(0);
    let group_name = $state("");

    // 删除题组
    function deleteGroup(groupID) {
        // 判断是否为最后一个题组
        if (paper_groups.length === 1) {
            toast.error("至少保留一个题组", 1000);
            return;
        }

        MessageBox({
            title: "删除确认",
            content: "请问是否要删除该题组？",
            confirm_button_type: "danger",

            onConfirm: () => {
                // 删除后重新排序
                let groupIDs = paper_groups.map(group => group.id);
                groupIDs = groupIDs.filter(id => id !== groupID)

                const ACTIONS = [
                    {
                        action: "delete_group",
                        payload: groupID
                    },
                    {
                        action: "move_group",
                        payload: groupIDs
                    }
                ];

                savePaper(paperID, ACTIONS)
                    .then(() => {
                        fetchPaper(paperID)
                        .then(result => {
                            paper_groups = result.data.GroupsData;
                            paper_info = result.data;
                            total_score = paper_info.TotalScore;
                            question_count = paper_info.QuestionCount;
                            toast.success("删除成功", 1000);
                        });
                    });
            }
        });
    }

    // 添加题组
    async function addGroup() {
        is_adding_group = true;
        await tick();
        to_add_group.focus();
    }

    // 取消添加题组
    function cancelAddGroup() {
        is_adding_group = false;
    }

    // 确认添加题组
    function confirmAddgroup() {
        if(event.key === "Enter" && to_add_group_name.trim() !== "") {

            to_add_group.blur();

            const ACTIONS = [
                {
                    action: "add_group",
                    payload: {
                        name: to_add_group_name,
                        order: paper_groups.length + 1
                    }
                }
            ];
            
            savePaper(paperID, ACTIONS)
                .then(result => {
                    fetchPaper(paperID)
                        .then(result => {
                            paper_groups = result.data.GroupsData;
                            paper_info = result.data;
                            is_adding_group = false;
                            to_add_group_name = "";
                            toast.success("添加成功", 1000);
                    });
                })
                .finally(() => {
                });
        }
    }

    // 编辑题组名称
    async function editGroupName(id, name) {
        to_edit_groupID = id;
        to_edit_group_name = name;
        await tick();
        to_edit_group.focus();
    }

    // 确认编辑题组名称
    function confirmEditGroupName() {
        if(event.key === "Enter" && to_edit_group_name.trim() !== "") {

            to_edit_group.blur();

            const ACTIONS = [
                {
                    action: "update_group",
                    payload: {
                        id: to_edit_groupID,
                        name: to_edit_group_name
                    }
                }
            ];
            
            savePaper(paperID, ACTIONS)
                .then(() => {
                    fetchPaper(paperID)
                        .then(result => {
                            paper_groups = result.data.GroupsData;
                            paper_info = result.data;
                            to_edit_groupID = null;
                            toast.success("编辑成功", 1000);
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
                const GROUP_QUESTIONS = group.questions;
                let questionIDs = GROUP_QUESTIONS.map(question => question.id);
                questionIDs = questionIDs.filter(id => id !== questionID)

                const ACTIONS = [
                    {
                        action: "delete_question",
                        payload: [questionID]
                    },
                    {
                        action: "move_question",
                        payload: questionIDs
                    }
                ];

                savePaper(paperID, ACTIONS)
                    .then(() => {
                        fetchPaper(paperID)
                            .then(result => {
                                paper_groups = result.data.GroupsData;
                                paper_info = result.data;
                                total_score = paper_info.TotalScore;
                                question_count = paper_info.QuestionCount;
                                toast.success("删除成功", 1000);
                            });
                    });
            }
        });
    }

    // 导入题目后信息更新
    function updateAfterImport(updatedGroups, updatedInfo) {
        paper_groups = updatedGroups;
        paper_info = updatedInfo;
        question_count = updatedInfo.QuestionCount;
        total_score = updatedInfo.TotalScore;
    }

    // 一键展开所有题组和题目
    function expandAll() {
        paper_groups.forEach(group => {
            group.isOpen = true;
            group.questions?.forEach(question => {
            question.isOpen = true;
            });
        });
    }

    // 一键收起所有题组和题目
    function collapseAll() {
        paper_groups.forEach(group => {
            group.isOpen = false;
            group.questions?.forEach(question => {
            question.isOpen = false;
            });
        });
    }

    // 切换展开状态
    function changeOpenState(type, id) {
        if(type === "group") {
            GROUP_OPEN_STATE.update(state => ({ ...state, [id]: !state[id] }));
        }
        if(type === "question") {
            QUESTION_OPEN_STATE.update(state => ({ ...state, [id]: !state[id] }));
        }
    }

    /***************** 题组列表区 *****************/

    // 挂载区
    onMount(() => {
        paperID = get(CURRENT_PAPER_ID);
        fetchPaper(paperID)
            .then(result => {
                paper_info = result.data;
                paper_groups = result.data.GroupsData;

                paper_groups.forEach(group => {
                    // 所有题组展开
                    group.isOpen = true;
                    
                    group.questions.forEach(question => {
                        // 所有题目展开
                        question.isOpen = true;
                    });
                });

                paper_name = paper_info.Name;
                category = paper_info.Category;
                level = paper_info.Level;
                suggested_duration = paper_info.SuggestedDuration;
                total_score = paper_info.TotalScore;
                question_count = paper_info.QuestionCount;
                description = paper_info.Description;
                tags = paper_info.Tags;

                page_is_ready = true;
            })
            .finally(() => {
                // console.log(paper_groups);
            });
    })

    function test() {
        console.log(toCreatePaper);
        console.log(paper_groups);
    }

</script>

{#if import_modal_is_open}
    <ImportQuestion
        onclose={closeImportModal}
        update={updateAfterImport}
        to_add_groupID={groupID}
        to_add_group_name={group_name}
        fetchPaper={fetchPaper}
        savePaper={savePaper}
    />
{/if}

{#if page_is_ready}
    <div class="add-paper">
        <!-- 顶部栏 -->
        <div class="header">
            <!-- 标题 -->
            <div class="title-container">
                <div class="title-icon"></div>
                <span class="title-name">自定义组卷</span>
            </div>

            <!-- 试卷名称 -->
            <input onchange={()=>debounceUpDatePaperInfo()} class="paper-name-input {paper_name===""?"name-warn":""}" type="text" bind:value={paper_name} placeholder="试卷名称不能为空">
            
            <!-- 操作区 -->
            <div class="operation">
                <Button onclick={()=>expandAll()} plain={true}>一键展开</Button>
                <Button onclick={()=>collapseAll()} plain={true}>一键收起</Button>
                <Button onclick={()=>{groupID=0;import_modal_is_open=true}}>从题库中导入</Button>
                <Button type="danger" plain={true} onclick={()=>goto('/teacher/paper')}>保存并退出</Button>
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
                        <Select bind:value={category} changeValue={()=>UpDatePaperInfo()}>
                            <Option value="00" label="考试"></Option>
                            <Option value="02" label="练习"></Option>
                        </Select>
                    </div>

                    <!-- 试卷难度 -->
                    <div class="single-line">
                        <span class="info-label">试卷难度</span>
                        <div class="level-container" onchange={()=>UpDatePaperInfo()}>
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
                        <InputBox onInput={()=>debounceUpDatePaperInfo()} bind:value={suggested_duration} type="number" show_label={false} clearable={false}/>
                        <span class="duration-span">分钟</span>
                    </div>

                    <!-- 试卷总分 -->
                    <div class="single-line">
                        <span class="info-label">试卷总分</span>
                        <span class="total-score-number">{total_score}</span>
                        <span class="total-score-span">分</span>
                    </div>

                    <!-- 试题数量 -->
                    <div class="single-line">
                        <span class="info-label">试题数量</span>
                        <span class="question-count-number">{question_count}</span>
                        <span class="question-count-span">道</span>
                    </div>

                    <!-- 试卷说明 -->
                    <div class="paper-description">
                        <span class="info-label">试卷说明</span>
                        <textarea onchange={()=>debounceUpDatePaperInfo()} class="description-textarea" bind:value={description} placeholder="输入试卷说明"></textarea>
                    </div>

                    <!-- 试卷标签 -->
                    <div class="paper-tags">
                        <span class="info-label">试卷标签</span>
                        <div class="tags-container">
                            <!-- 固定用于创建新标签的标签 -->
                            <div class="paper-tag" style="border: 1.5px dashed var(--border-medium);">
                                <div class="color-block" style="background-color: {to_add_tag===""? "#40d5ff":TAG_COLOR_LIST[getColorIndex(to_add_tag)]};"></div>
                                <div class="btn-box">
                                    <input type="text" bind:value={to_add_tag} onkeydown={addTag} placeholder="+标签" maxlength="30"/>
                                    <button onclick={clearToAddTagContent}>✕</button>
                                </div>
                            </div>

                            <!-- 已创建的标签 -->
                            {#each tags as tag, index}
                                <div class="paper-tag">
                                    <div class="color-block" style="background-color: {tag===""? "#40d5ff":TAG_COLOR_LIST[getColorIndex(tag)]};"></div>
                                    <div class="btn-box">
                                        <input type="text" bind:value={tags[index]} onkeydown={oldTagEnter} placeholder="+标签" maxlength="30"/>
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
                            <span>共有 {paper_groups.length} 个题组</span>
                        </div>
                        <div class="add-box">
                            <Button onclick={()=>addGroup()} plain={true}>添加题组</Button>
                        </div>
                    </div>

                    <!-- 列表 -->
                    <div class="question-groups-box">
                        <!-- 已有题组 -->
                        {#if paper_groups.length !== 0}
                            {#each paper_groups as group}
                                {#if to_edit_groupID === group.id}
                                <div class="single-group">
                                        <input bind:value={to_edit_group_name} onkeydown={()=>confirmEditGroupName()} bind:this={to_edit_group} class="add-group-input" type="text" placeholder="按 Enter 键确认编辑">
                                        <div class="btn-box">
                                            <!-- 删除按钮 -->
                                            <button onclick={()=>{to_edit_groupID=null}} class="delete-group-btn" title="删除">✖</button>
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
                        {#if is_adding_group}
                            <div class="single-group">
                                <input bind:value={to_add_group_name} onkeydown={confirmAddgroup} bind:this={to_add_group} class="add-group-input" type="text" placeholder="按 Enter 键确认添加">
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
                {#if paper_groups}
                    {#each paper_groups as group}
                        <div class="single-group-content">
                            <!-- 头部下拉栏 -->
                            <div class="group-header">
                                <!-- 左侧区域 -->
                                <!-- svelte-ignore a11y_click_events_have_key_events -->
                                <!-- svelte-ignore a11y_no_static_element_interactions -->
                                <div class="header-left" onclick={()=>changeOpenState("group",group.id)}>
                                    <button class="toggle-btn">{$GROUP_OPEN_STATE[group.id]?"∨":"∧"}</button>
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
                            {#if $GROUP_OPEN_STATE[group.id]}
                                <div class="group-question-list">
                                    
                                    {#if group.questions.length !== 0}
                                        {#each group.questions as question}
                                            <div class="single-question">
                                                <!-- 头部下拉栏 -->
                                                <div class="question-header">
                                                    <!-- 左侧区域 -->
                                                    <!-- svelte-ignore a11y_click_events_have_key_events -->
                                                    <!-- svelte-ignore a11y_no_static_element_interactions -->
                                                    <div class="header-left"  onclick={()=>changeOpenState("question",question.id)}>
                                                        <button class="toggle-btn-down">{$QUESTION_OPEN_STATE[question.id]?"∨":"∧"}</button>
                                                        <span class="sequence">{question.order}</span>
                                                        <span class="question-type">{QUESTION_TYPE_TRANS[question.type]}</span>
                                                        <span class={DIFFICULTY_TRANS[DIFFICULTY_TRANS[question.difficulty]]}>{DIFFICULTY_TRANS[question.difficulty]}</span>
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
                                                {#if $QUESTION_OPEN_STATE[question.id]}
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
                                                <div class="import-box">
                                                    <Button onclick={()=>{groupID=group.id;group_name=group.name;import_modal_is_open=true}}>导入题目</Button>
                                                </div>
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
{/if}

<style>

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
                                    margin-top: 5px;
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
                                            margin-top: 4px;
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