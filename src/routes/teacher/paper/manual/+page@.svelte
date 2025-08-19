<!--
 * @Author: WangKaidun 1597225095@qq.com
 * @Date: 2025-08-01 15:21:42
 * @LastEditors: WangKaidun 1597225095@qq.com
 * @LastEditTime: 2025-08-16 12:21:26
 * @FilePath: \exam\src\routes\teacher\paper\manual\+page@.svelte
 * @Description: 自定义组卷页面
 * @Copyright (c) 2025 by WangKaidun 1597225095@qq.com, All Rights Reserved. 
-->
<script>
    import ImportQuestion from "../_components/ImportQuestion/ImportQuestion.svelte";
    import Select from "$lib/components/Select/Select.svelte";
    import Option from "$lib/components/Select/Option.svelte";
    import Toast from "$lib/components/Toast/Toast.svelte";
    import MessageBox from "$lib/components/MessageBox/MessageBox";
    import QuestionPreviewPanel from "../../question-bank/_components/QuestionPreviewPanel.svelte";
    import "$lib/components/Button/index.scss"
    import "$lib/components/Input/index.scss"
    import { goto } from "$app/navigation";
    import { DIFFICULTY_TRANS, QUESTION_TYPE_TRANS, utf8MaxLength } from "../_utils/tool";
    import { onMount, tick } from "svelte";
    import { toast } from "$lib/components/Toast/Toast";
    import { get } from "svelte/store";
    import { CURRENT_PAPER_ID, GROUP_OPEN_STATE, QUESTION_OPEN_STATE, GROUP_AVERAGE_SCORE } from "../_stores/store";
    import { stopPropagation } from "svelte/legacy";
    import { debounce } from "$lib/utils/optimize";

    /******************* API 区 ********************/

    // 获取试卷详情
    function fetchPaper(
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
                if (data.status !== 0){
                    throw new Error(data.msg);  
                }
                // console.log(data);
                return data;
            })
            .catch(error => {
                toast.error(error.message, 1000);
                console.error('获取试卷详情出错：', error);
                return null;
            });
    }

    // 保存试卷
    function savePaper(
        paperID = 0,
        actionsArr = {}
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
                if (data.status !== 0){
                    throw new Error(data.msg);  
                }
                // console.log(data);
                return data;
            })
            .catch(error => {
                toast.error(error.message, 1000);
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

    // 预览试卷
    function previewPaper() {
        const PARAMS = new URLSearchParams();

        PARAMS.append("paper_id", paperID);
        PARAMS.append("mode", "preview");

        fetch(`/api/paper/manual?${PARAMS.toString()}`, {
            method: "GET",
            credentials: "include"
        })
            .then(response => {
                if (!response.ok) {
                    throw new Error(`请求失败，状态码：${response.status}`);
                }
                return response.json();
            })
            .then(result => {
                const PREVIEW_QUESTIONS = result.data;
                
                if (category === "00") {
                    localStorage.setItem(
                        "examQuestions",
                        JSON.stringify(PREVIEW_QUESTIONS),
                    );
                    window.location.href = "/student/answer/exam";
                } else if (category === "02") {
                    localStorage.setItem(
                        "practiceQuestions",
                        JSON.stringify(PREVIEW_QUESTIONS),
                    );
                    window.location.href = "/student/answer/practice";
                }
            })
            .catch(error => {
                console.error('获取试卷详情出错：', error);
                return null;
            });
    }

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
    let is_clearing_tag = $state(false);

    // 新增标签
    function addTag() {
        if (!is_clearing_tag && to_add_tag.trim() !== "") {
            tags = [to_add_tag, ...tags];
            to_add_tag = "";
            UpDatePaperInfo();
        }
        is_clearing_tag = false;
    }

    // 清除新建标签内容
    function clearToAddTagContent() {
        is_clearing_tag = true;
        to_add_tag = "";
    }

    // 处理旧标签 Enter 键
    function oldTagEnter() {
        if(event.key === "Enter") {
            event.target.blur();
        }
    }

    // 修改旧标签
    function updateOldTag(index) {
        if(!is_deleting_tag) {
            if(tags[index].trim() !== "") {
                UpDatePaperInfo();
            } else {
                deleteTag(index);
            }
        }
    }

    let is_deleting_tag = $state(false);

    // 删除旧标签
    function deleteTag(index) {
        is_deleting_tag = true;
        tags = tags.toSpliced(index, 1);
        UpDatePaperInfo();
        is_deleting_tag = false;
    }

    /***************** 标签处理区 *****************/    



    /***************** 题组列表区 *****************/

    let paper_groups = $state([]);
    let to_add_group_name = $state("");
    let to_add_group = $state(null);
    let to_edit_groupID = $state(null);
    let to_edit_group_name = $state("");
    let to_edit_group = $state(null);
    let to_import_group = $state(null);

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
        to_add_group_name = "";
    }

    // 确认添加题组
    function confirmAddgroup() {
        if(is_adding_group && (to_add_group_name.trim() === "" || !to_add_group_name)) {
            cancelAddGroup();
            return;
        }

        if(is_adding_group && to_add_group_name.trim() !== "") {

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
    async function editGroupName(id, name, position) {
        to_edit_groupID = id;
        to_edit_group_name = name;
        await tick();
        to_edit_group.focus();
    }

    let is_cancelling_edit_group_name = $state(false);

    // 确认编辑题组名称
    function confirmEditGroupName() {
        if(!is_cancelling_edit_group_name && to_edit_group_name.trim() !== "") {

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

    // 取消编辑题组名称
    function cancelEditGroupName() {
        is_cancelling_edit_group_name = true;
        to_edit_groupID = null;
        to_edit_group_name = "";
        is_cancelling_edit_group_name = false;
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
                let questionIDs = paper_groups
                    .flatMap(group => group.questions.map(question => question.id))
                    .filter(id => id !== questionID);

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

    // 导入题目
    function importQuestions(group) {
        to_import_group = group;
        import_modal_is_open = true;
    }

    // 导入题目后信息更新
    function updateAfterImport(updatedGroups, updatedInfo) {
        // 更新试卷信息
        paper_groups = updatedGroups;
        paper_info = updatedInfo;
        question_count = updatedInfo.QuestionCount;
        total_score = updatedInfo.TotalScore;
        
        // 检查每个题组的分数一致性，如果不一致则清空每题分值输入框
        if (updatedGroups && updatedGroups.length > 0) {
            updatedGroups.forEach(group => {
                if (!checkGroupScoreConsistency(group)) {
                    clearGroupAverageScore(group);
                }
            });
        }
        
        // 自动展开新导入的题目和目标题组
        if (updatedGroups && updatedGroups.length > 0) {
            const NEW_GROUP_STATE = { ...get(GROUP_OPEN_STATE) };
            const NEW_QUESTION_STATE = { ...get(QUESTION_OPEN_STATE) };
            
            // 找到目标题组（导入题目的题组）
            const targetGroup = updatedGroups.find(group => group.id === to_import_group.id);
            if (targetGroup) {
                // 确保目标题组是展开状态
                NEW_GROUP_STATE[targetGroup.id] = true;
                
                // 将目标题组中的所有题目设置为展开状态
                // 这样可以确保新导入的题目和原有题目都展开
                targetGroup.questions.forEach(question => {
                    NEW_QUESTION_STATE[question.id] = true;
                });
            }
            
            // 更新展开状态
            GROUP_OPEN_STATE.set(NEW_GROUP_STATE);
            QUESTION_OPEN_STATE.set(NEW_QUESTION_STATE);
        }
        
        // 重置导入参数
        to_add_group = { id: 0, name: ""};
    }

    // 一键展开所有题组和题目
    function expandAll() {
         // 创建新的展开状态对象
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

    // 移动题目
    function moveQuestion(group, question, direction) {
        // 获取题目 ID 数组
        const FULL_QUESTION_IDS = paper_groups.flatMap(group =>
            group.questions.map(question => question.id)
        );

        // 获取待移动的题目索引
        const INDEX = FULL_QUESTION_IDS.indexOf(question.id);

        // 边界：最上面的题再往上 or 最下面的题再往下，直接 return
        if (INDEX === 0 && direction === 'up') {
            toast.error("已经是第一题", 1000);
            return;
        }

        if (INDEX === FULL_QUESTION_IDS.length - 1 && direction === 'down') {
            toast.error("已经是最后一题", 1000);
            return;
        }

        // 默认原题组
        let target_groupID = group.id;

        // 找当前题组在 paper_groups 中的索引
        const CURRENT_GROUP_INDEX = paper_groups.findIndex(g => g.id === group.id);

        // 找当前题目在本组里的索引
        const QUESTION_INDEX_IN_GROUP = group.questions.findIndex(q => q.id === question.id);

        // 如果题目是组内第一个且往上移动，或者是组内最后一个且往下移动，可能跨组
        if (
            (QUESTION_INDEX_IN_GROUP === 0 && direction === 'up') || 
            (QUESTION_INDEX_IN_GROUP === group.questions.length - 1 && direction === 'down')
        ) {
            if (direction === 'up') {
                target_groupID = paper_groups[CURRENT_GROUP_INDEX - 1].id;
            } else {
                target_groupID = paper_groups[CURRENT_GROUP_INDEX + 1].id;
            }
        }

        // 交换位置
        if(target_groupID === group.id) {
            if (direction === 'up') {
                [FULL_QUESTION_IDS[INDEX - 1], FULL_QUESTION_IDS[INDEX]] =
                    [FULL_QUESTION_IDS[INDEX], FULL_QUESTION_IDS[INDEX - 1]];
            } else if (direction === 'down') {
                [FULL_QUESTION_IDS[INDEX + 1], FULL_QUESTION_IDS[INDEX]] =
                    [FULL_QUESTION_IDS[INDEX], FULL_QUESTION_IDS[INDEX + 1]];
            }
        }

        // 获取移动后的题目索引
        const NEW_INDEX = FULL_QUESTION_IDS.indexOf(question.id);

        // 检查移动后是否跨组
        const NEIGHBOR_INDEX = direction === 'up' ? NEW_INDEX - 1 : NEW_INDEX + 1;
        const NEIGHBOR_ID = FULL_QUESTION_IDS[NEIGHBOR_INDEX];

        // 提交后端保存
        const ACTIONS = [
            {
                action: "move_question",
                payload: FULL_QUESTION_IDS
            },
            {
                action: "update_question",
                payload: [
                    {
                        id: question.id,
                        group_id: target_groupID,
                        order: NEW_INDEX + 1,
                        score: question.score
                    }
                ]
            }
        ];

        savePaper(paperID, ACTIONS)
            .then(() => {
                return fetchPaper(paperID);
            })
            .then(result => {
                paper_groups = result.data.GroupsData;
                paper_info = result.data;
                total_score = paper_info.TotalScore;
                question_count = paper_info.QuestionCount;
            });
    }

    // 修改题目分数
    function updateQuestionScore(question) {
        
        let sub_score = undefined;
        
        // 如果题目有sub_score数组，则将总分平均分配（最小单位为0.5）
        if (question.sub_score && question.sub_score.length > 0) {
            const subScoreCount = question.sub_score.length;
            
            // 确保平均分数大于0
            if (question.score < subScoreCount/2) {
                toast.error(`该题至少需要${subScoreCount/2}分`, 1000);
                return;
            }

            // 将总分平均分配（最小单位为0.5）
            const baseScore = Math.floor(question.score / subScoreCount * 2) / 2; // 确保是0.5的整数倍
            sub_score = new Array(subScoreCount).fill(baseScore);
            
            // 计算剩余分数
            const totalAssigned = baseScore * subScoreCount;
            const remainder = question.score - totalAssigned;
            
            // 将剩余分数按0.5为单位分配给前面的几个子题
            const remainderSteps = Math.round(remainder * 2); // 转换为0.5的步数
            for (let i = 0; i < Math.abs(remainderSteps) && i < subScoreCount; i++) {
                if (remainderSteps > 0) {
                    sub_score[i] += 0.5;
                } else {
                    sub_score[i] -= 0.5;
                }
            }
        }
        
        const ACTIONS = [
            {
                action: "update_question",
                payload: [
                    {
                        id: question.id,
                        group_id: question.group_id,
                        order: question.order,
                        score: question.score,
                    }
                ]
            }
        ];

        if(question.type==="06" || question.type==="08") {
            ACTIONS[0].payload[0].sub_score = sub_score;
        }

        savePaper(paperID, ACTIONS)
            .then(() => {
                return fetchPaper(paperID);
            })
            .then(result => {
                paper_groups = result.data.GroupsData;
                paper_info = result.data;
                total_score = paper_info.TotalScore;
                question_count = result.data.QuestionCount;
                
                // 检查题组是否还保持统一的每题分值，如果不一致则清空每题分值输入框
                const group = paper_groups.find(g => g.id === question.group_id);
                if (group && !checkGroupScoreConsistency(group)) {
                    clearGroupAverageScore(group);
                }
            });
    }

    // 检查题组是否还保持统一的每题分值
    function checkGroupScoreConsistency(group) {
        if (group.questions.length === 0) return true;
        
        const firstScore = group.questions[0].score;
        return group.questions.every(question => question.score === firstScore);
    }

    // 清空题组的每题分值输入框
    function clearGroupAverageScore(group) {
        GROUP_AVERAGE_SCORE.update(state => ({ ...state, [group.id]: "" }));
    }

    // 修改每题分值
    function updateAverageQuestionScore(group) {
        if(group.questions.length === 0) {
            toast.error("请先添加题目", 1000);
            return;
        }

        // 获取每题分数
        const AVERAGE_SCORE = get(GROUP_AVERAGE_SCORE)[group.id];
        
        // 最小分值为该题组里type为06或08的题的小题数的最大值的一半
        const MIN_SCORE = Math.max(...group.questions.filter(question => question.type==="06" || question.type==="08").map(question => question.answers.length/2));
        if(AVERAGE_SCORE < MIN_SCORE) {
            toast.error(`每题分值至少为${MIN_SCORE}分`, 1000);
            return;
        }

        // 构建题目更新数据
        const questionUpdates = group.questions.map((question, index) => {
            const updateData = {
                id: question.id,
                group_id: group.id,
                order: question.order,
                score: AVERAGE_SCORE
            };

            // 如果type为06或08，需要处理sub_score数组
            if (question.type === "06" || question.type === "08") {
                const subScoreCount = question.sub_score.length;

                // 将总分平均分配（最小单位为0.5）
                const baseScore = Math.floor(AVERAGE_SCORE / subScoreCount * 2) / 2; // 确保是0.5的整数倍
                const sub_score = new Array(subScoreCount).fill(baseScore);
                
                // 计算剩余分数
                const totalAssigned = baseScore * subScoreCount;
                const remainder = AVERAGE_SCORE - totalAssigned;
                
                // 将剩余分数按0.5为单位分配给前面的几个子题
                const remainderSteps = Math.round(remainder * 2); // 转换为0.5的步数
                for (let i = 0; i < Math.abs(remainderSteps) && i < subScoreCount; i++) {
                    if (remainderSteps > 0) {
                        sub_score[i] += 0.5;
                    } else {
                        sub_score[i] -= 0.5;
                    }
                }
                
                updateData.sub_score = sub_score;
                
            }

            return updateData;
        });

        const ACTIONS = [
            {
                action: "update_question",
                payload: questionUpdates
            }
        ];

        savePaper(paperID, ACTIONS)
            .then(() => {
                return fetchPaper(paperID);
            })
            .then(result => {
                paper_groups = result.data.GroupsData;
                paper_info = result.data;
                total_score = paper_info.TotalScore;
                question_count = paper_info.QuestionCount;
            });
    }

    // 更新子题分数
    function updateSubScore(new_sub_score,groupIndex,questionIndex) {
        // 接收子组件参数
        paper_groups[groupIndex].questions[questionIndex].sub_score = new_sub_score;
        
        // 修改题目总分
        paper_groups[groupIndex].questions[questionIndex].score =
            new_sub_score.reduce((sum, val) => sum + (Number(val) || 0), 0);

        const ACTIONS = [
            {
                action: "update_question",
                payload: [
                    {
                        id: paper_groups[groupIndex].questions[questionIndex].id,
                        group_id: paper_groups[groupIndex].id,
                        order: paper_groups[groupIndex].questions[questionIndex].order,
                        score: paper_groups[groupIndex].questions[questionIndex].score,
                        sub_score: paper_groups[groupIndex].questions[questionIndex].sub_score
                    }
                ]
            }
        ];

        savePaper(paperID, ACTIONS)
            .then(() => {
                return fetchPaper(paperID);
            })
            .then(result => {
                paper_groups = result.data.GroupsData;
                paper_info = result.data;
                total_score = paper_info.TotalScore;
                question_count = paper_info.QuestionCount;
                
                // 检查题组是否还保持统一的每题分值，如果不一致则清空每题分值输入框
                const group = paper_groups[groupIndex];
                if (group && !checkGroupScoreConsistency(group)) {
                    clearGroupAverageScore(group);
                }
            });
    }

    /***************** 题组列表区 *****************/



    /***************** 拖拽功能区 *****************/

    let dragged_group = $state(null);               // 当前被拖拽的元素数据
    let drag_over_group = $state(null);             // 目标元素数据
    let drag_over_group_position = $state(null);    // 相对位置："top" 或 "bottom"
    let is_dragging_group = $state(false);
    let dragged_type = $state(null);

    // 题组开始拖拽
    function handleGroupDragStart(event, group) {
        is_dragging_group = true;
        dragged_group = group;
        is_dragging_question = false;
        dragged_type = "group";

        // 确定是现代浏览器
        if (event.dataTransfer) {
            // 表示拖拽允许的效果
            event.dataTransfer.effectAllowed = "move";
        }

        // 兜底监听 dragend
        event.target.addEventListener("dragend", handleDragEnd, { once: true });
    }

    // 题组正在拖拽
    function handleGroupDragOver(event, group) {
        event.preventDefault(); // 必须阻止默认行为才能触发 drop

        // 记录目标项
        drag_over_group = group;

        // 计算鼠标相对目标元素的纵坐标
        const BOUNDING = event.currentTarget.getBoundingClientRect();
        const OFFSET_Y = event.clientY - BOUNDING.top;

        // 根据纵向一半高度判断上或下
        drag_over_group_position = OFFSET_Y < BOUNDING.height / 2 ? "top" : "bottom";
    }

    // 题组拖拽放下
    function handleGroupDrop(event) {
        event.preventDefault();
        if (!dragged_group || !drag_over_group || dragged_group.id === drag_over_group.id) {
            handleDragEnd();
            return;
        };

        // 处理题组 ID，插入位置根据 drag_over_position 决定
        const GROUP_IDS = paper_groups.map(g => g.id).filter(id => id !== dragged_group.id);
        let dropIndex = GROUP_IDS.findIndex(id => id === drag_over_group.id);

        if (drag_over_group_position === "bottom") {
            dropIndex += 1; // 往目标后面插入
        }

        GROUP_IDS.splice(dropIndex, 0, dragged_group.id);

        const QUESTION_IDS = GROUP_IDS.flatMap(groupId => {
            const group = paper_groups.find(g => g.id === groupId);
            return group ? group.questions.map(q => q.id) : [];
        });

        const ACTIONS = [
            {
                action: "move_group",
                payload: GROUP_IDS,
            },
        ];
        
        if(QUESTION_IDS.length > 0) {
            ACTIONS.push({
                action: "move_question",
                payload: QUESTION_IDS
            });
        }
        
        savePaper(paperID, ACTIONS)
            .then(() => fetchPaper(paperID))
            .then((result) => {
                paper_groups = result.data.GroupsData;
                paper_info = result.data;
                total_score = paper_info.TotalScore;
                question_count = paper_info.QuestionCount;
            })
            .finally(() => {
                handleDragEnd();
            });
    }

    let dragged_question_item = $state({});        // 当前被拖拽的元素数据
    let drag_over_question_item = $state({});      // 目标元素数据
    let drag_over_question_position = $state(null);
    let dragged_over_questionID_CSS = $state(0);   // 当前鼠标所在题组 ID
    let is_dragging_question = $state(false);

    // 题目开始拖拽
    function handleQuestionDragStart(event, question, group) {
        is_dragging_group = false;
        dragged_question_item = { question, group };
        dragged_over_questionID_CSS = group.id;
        is_dragging_question = true;
        dragged_type = "question";

        // 确定是现代浏览器
        if (event.dataTransfer) {
            // 表示拖拽允许的效果
            event.dataTransfer.effectAllowed = "move";
        }
    }

    // 题目正在拖拽
    function handleQuestionDragOver(event, question, group) {
        event.preventDefault(); // 必须阻止默认行为才能触发 drop

        // 记录目标项
        drag_over_question_item = { question, group };

        if (question) {
            // 计算鼠标相对目标元素的纵坐标
            const BOUNDING = event.currentTarget.getBoundingClientRect();
            const OFFSET_Y = event.clientY - BOUNDING.top;

            // 根据纵向一半高度判断上或下
            drag_over_question_position = OFFSET_Y < BOUNDING.height / 2 ? "top" : "bottom";
        } else {
            // 空题组不需要位置判断，固定插到组开头
            drag_over_question_position = "top";
        }
    }

    // 题目拖拽放下
    function handleQuestionDrop(event) {
        event.preventDefault();
        if (
            is_dragging_group ||
            (dragged_question_item.question.id === drag_over_question_item.question.id &&
            dragged_question_item.group.id === drag_over_question_item.group.id)
        ) {
            handleDragEnd();
            return;
        };

        // 扁平化并过滤题目 ID 数组
        const QUESTION_IDS = paper_groups
            .flatMap(group => group.questions
            .map(question => question.id))
            .filter(id => id !== dragged_question_item.question.id);

        let dropIndex = 0;

        if (drag_over_question_item.question.id) {
            // 非空题组的情况
            dropIndex = QUESTION_IDS.findIndex(id => id === drag_over_question_item.question.id);
            
            if (drag_over_question_position === "bottom") dropIndex += 1;
        } else {
            // 空题组的情况
            const groupIndex = paper_groups.findIndex(group => group.id === drag_over_question_item.group.id);
            // 统计该组前面所有题目的数量
            dropIndex = paper_groups
                .slice(0, groupIndex)
                .reduce((count, group) => count + group.questions.length, 0);
        }

        QUESTION_IDS.splice(dropIndex, 0, dragged_question_item.question.id);

        // 处理请求
        const ACTIONS = [
            {
                action: "move_question",
                payload: QUESTION_IDS,
            },
            {
                action: "update_question",
                payload: [
                    {
                        id: dragged_question_item.question.id,
                        group_id: drag_over_question_item.group.id,
                        order: dropIndex + 1,
                        score: dragged_question_item.score
                    }
                ]
            }
        ];

        savePaper(paperID, ACTIONS)
            .then(() => fetchPaper(paperID))
            .then((result) => {
                paper_groups = result.data.GroupsData;
                paper_info = result.data;
                total_score = paper_info.TotalScore;
                question_count = paper_info.QuestionCount;
            })
            .finally(() => {
                handleDragEnd();
            });
    }

    // 拖拽结束（全部）
    function handleDragEnd() {
        is_dragging_group = false;
        dragged_group = null;
        drag_over_group = null;
        drag_over_group_position = null;

        drag_over_question_item = {};
        dragged_question_item = {};
        drag_over_question_position = null;
        dragged_over_questionID_CSS = 0;
        is_dragging_question = false;

    }

    /***************** 拖拽功能区 *****************/

    // 挂载区
    onMount (async () => {
        paperID = get(CURRENT_PAPER_ID);
        if(paperID === 0) {
            await goto("/teacher/paper");
            toast.success("试卷内容已保存",1000);
            return;
        }
        fetchPaper(paperID)
            .then(result => {
                if (result) {
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
                    
                    // 页面加载完成后自动展开所有题组和题目
                    if (paper_groups && paper_groups.length > 0) {
                        expandAll();
                        
                        // 检查每个题组的分数一致性，如果不一致则清空每题分值输入框
                        paper_groups.forEach(group => {
                            if (!checkGroupScoreConsistency(group)) {
                                clearGroupAverageScore(group);
                            }
                        });
                    }
    
                    // console.log(result)
                    
                } else {
                    // 3秒后跳转
                    toast.warning("3秒后跳转回试卷列表", 3000);
                    setTimeout(() => {
                        goto("/teacher/paper");
                    }, 3000);
                }
            });
    })
</script>

{#if import_modal_is_open}
    <ImportQuestion
        onclose={closeImportModal}
        update={updateAfterImport}
        to_import_group={to_import_group}
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
            <input type="text" 
                onchange={()=>{if(paper_name!=="")UpDatePaperInfo()}}
                class="paper-name-input {paper_name===""?"name-warn":""}"
                bind:value={paper_name}
                placeholder="试卷名称不能为空"
                use:utf8MaxLength={50}
            >
            
            <!-- 操作区 -->
            <div class="operation">
                <button onclick={()=>expandAll()} class="btn btn--primary is-plain">一键展开</button>
                <button onclick={()=>collapseAll()} class="btn btn--primary is-plain">一键收起</button>
                <button onclick={()=>previewPaper()} class="btn btn--primary is-plain">预览试卷</button>
                <button onclick={()=>importQuestions({id:0,name:""})} class="btn btn--primary">从题库中导入</button>
                <button onclick={()=>{UpDatePaperInfo();goto('/teacher/paper')}} class="btn btn--primary is-plain">保存并退出</button>
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
                        <input type="number"
                            bind:value={suggested_duration}
                            onchange={()=>UpDatePaperInfo()}
                            class="input"
                            min={1}
                            step={1}
                        >
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
                        <textarea
                            onchange={()=>UpDatePaperInfo()}
                            class="description-textarea"
                            bind:value={description}
                            placeholder="输入试卷说明"
                            use:utf8MaxLength={500}
                        ></textarea>
                    </div>

                    <!-- 试卷标签 -->
                    <div class="paper-tags">
                        <span class="info-label">试卷标签</span>
                        <div class="tags-container">
                            <!-- 固定用于创建新标签的标签 -->
                            <div class="paper-tag" style="border: 1.5px dashed var(--border-medium);">
                                <div class="color-block" style="background-color: {to_add_tag===""? "#40d5ff":TAG_COLOR_LIST[getColorIndex(to_add_tag)]};"></div>
                                <div class="btn-box">
                                    <input type="text"
                                        bind:value={to_add_tag}
                                        onchange={addTag}
                                        placeholder="+标签"
                                        use:utf8MaxLength={30}
                                    />
                                    <button onmousedown={clearToAddTagContent}>✕</button>
                                </div>
                            </div>

                            <!-- 已创建的标签 -->
                            {#each tags as tag, index}
                                <div class="paper-tag">
                                    <div class="color-block" style="background-color: {tag===""? "#40d5ff":TAG_COLOR_LIST[getColorIndex(tag)]};"></div>
                                    <div class="btn-box">
                                        <input type="text" bind:value={tags[index]} onkeydown={oldTagEnter} onblur={()=>updateOldTag(index)} placeholder="+标签" maxlength="30"/>
                                        <button onmousedown={()=>deleteTag(index)}>✕</button>
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
                        <button onclick={()=>addGroup()} class="btn btn--primary is-plain">添加题组</button>
                    </div>

                    <!-- 列表 -->
                    <div class="question-groups-outer-box">
                        <div class="question-groups-box
                            {dragged_group!==null?"drag-over":""}">
                            <!-- 已有题组 -->
                            {#if paper_groups.length !== 0}
                                {#each paper_groups as group}
                                    <!-- 编辑题组状态 -->
                                    {#if to_edit_groupID === group.id}
                                        <!-- svelte-ignore a11y_no_static_element_interactions -->
                                        <div class="single-group
                                            {dragged_group === group ? "dragging":""}"
                                            >
                                            <input bind:value={to_edit_group_name} onchange={()=>confirmEditGroupName()} onblur={()=>{if(to_edit_group_name.trim() === ""||to_edit_group_name.trim() === group.name){cancelEditGroupName()}}} bind:this={to_edit_group} class="add-group-input" type="text" placeholder="按 Enter 键确认编辑">
                                            <div class="btn-box">
                                                <!-- 取消按钮 -->
                                                <button onmousedown={()=>cancelEditGroupName()} class="delete-group-btn" title="取消">✖</button>
                                            </div>
                                        </div>
                                    {:else}
                                        <!-- svelte-ignore a11y_no_static_element_interactions -->
                                        <div class="single-group
                                            {(drag_over_group === group && drag_over_group_position === 'top' && dragged_type === 'group') ? 'drag-over-top' : ''}
                                            {(drag_over_group === group && drag_over_group_position === 'bottom' && dragged_type === 'group') ? 'drag-over-bottom' : ''}
                                            {dragged_group === group ? "dragging":""}"
                                            draggable="true"
                                            ondragstart={(event)=>handleGroupDragStart(event,group)}
                                            ondragover={(event)=>handleGroupDragOver(event,group)}
                                            ondrop={handleGroupDrop}
                                            >
                                            <span>{group.name}（共{group.questions.length}题，共{
                                                group.questions.reduce((sum,q)=>sum+(q.score||0),0)
                                            }分）</span>
                                            <div class="btn-box">
                                                <!-- 编辑按钮 -->
                                                <button onclick={()=>editGroupName(group.id,group.name,"side-bar")} class="edit-group-btn" title="编辑" aria-label="编辑题目">
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
                                    <input bind:value={to_add_group_name} onchange={confirmAddgroup} onblur={()=>{if(to_add_group_name.trim() === "")cancelAddGroup()}} bind:this={to_add_group} class="add-group-input" type="text" placeholder="请输入题组名称">
                                    <div class="btn-box">
                                        <!-- 取消按钮 -->
                                        <button onmousedown={()=>cancelAddGroup()} class="delete-group-btn" title="删除">✖</button>
                                    </div>
                                </div>
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
                        <div class="single-group-content">
                            <!-- 头部下拉栏 -->
                            <div class="group-header" onclick={()=>changeOpenState("group",group.id)} title={$GROUP_OPEN_STATE[group.id]?"收起":"展开"}>
                                <!-- 左侧区域 -->
                                <div class="header-left">
                                    <button class="toggle-btn">{$GROUP_OPEN_STATE[group.id]?"∨":"∧"}</button>
                                    <span>{group.name}（共{group.questions.length}题，共{
                                        group.questions.reduce((sum,q)=>sum+(q.score||0),0)
                                    }分）</span>
                                </div>

                                <!-- 右侧区域 -->
                                <div class="header-right">
                                    <span>每题分值：</span>
                                        <input class="input"
                                            type="number"
                                            placeholder="请输入"
                                            bind:value={$GROUP_AVERAGE_SCORE[group.id]}
                                            oninput={debounce(()=>updateAverageQuestionScore(group),500,false)}
                                            min={0.5}
                                            step={0.5}
                                            onclick={(e)=>{e.stopPropagation()}}
                                            title=""
                                            onchange={()=>updateAverageQuestionScore(group)}
                                        >
                                    <button onclick={(e)=>{e.stopPropagation();importQuestions(group)}} class="btn btn--primary" title="">导入题目</button>
                                </div>
                            </div>

                            <!-- 题目列表 -->
                            {#if $GROUP_OPEN_STATE[group.id]}
                                <div class="group-question-list-outer-box">
                                    <div class="group-question-list {is_dragging_question ? "drag-over" : ""}">
                                        {#if group.questions.length !== 0}
                                            {#each group.questions as question, questionIndex}
                                                <div class="single-question
                                                    {(drag_over_question_item.question?.id === question.id && drag_over_question_position === 'top' && dragged_type === 'question') ? 'drag-over-top' : ''}
                                                    {(drag_over_question_item.question?.id === question.id && drag_over_question_position === 'bottom' && dragged_type === 'question') ? 'drag-over-bottom' : ''}
                                                    {dragged_question_item.question?.id === question.id ? "dragging":""}"
                                                    draggable={!question.isEditingScore && !question.isEditingSubScore}
                                                    ondragstart={(event)=>handleQuestionDragStart(event,question,group)}
                                                    ondragover={(event)=>handleQuestionDragOver(event,question,group)}
                                                    ondrop={handleQuestionDrop}
                                                    ondragend={handleDragEnd}
                                                >
                                                    <!-- 头部下拉栏 -->
                                                    <div class="question-header">
                                                        <!-- 左侧区域 -->
                                                        <!-- svelte-ignore a11y_click_events_have_key_events -->
                                                        <!-- svelte-ignore a11y_no_static_element_interactions -->
                                                        <div class="header-left"  title={$QUESTION_OPEN_STATE[question.id]?"收起":"展开"}  onclick={()=>{changeOpenState("question",question.id);}}>
                                                            <button class="toggle-btn-down">{$QUESTION_OPEN_STATE[question.id]?"∨":"∧"}</button>
                                                            <span class="sequence">{question.order}</span>
                                                            <span class="question-type">{QUESTION_TYPE_TRANS[question.type]}</span>
                                                            <span class={DIFFICULTY_TRANS[DIFFICULTY_TRANS[question.difficulty]]}>{DIFFICULTY_TRANS[question.difficulty]}</span>
                                                        </div>
    
                                                        <!-- 右侧区域 -->
                                                        <div class="header-right">
                                                            <span>分值：</span>
                                                            <input class="input"
                                                                type="number"
                                                                placeholder="请输入"
                                                                bind:value={question.score}
                                                                oninput={debounce(()=>updateQuestionScore(question),500,false)}
                                                                min={(question.type==="06" || question.type==="08")?question.answers.length/2:0.5}
                                                                step={0.5}
                                                                onchange={()=>updateQuestionScore(question)}
                                                                onfocus={()=>question.isEditingScore = true}
                                                                onblur={()=>question.isEditingScore = false}
                                                            >
                                                            <button onclick={()=>moveQuestion(group,question,"up")} class="move-btn" title="上移">↑</button>
                                                            <button onclick={()=>moveQuestion(group,question,"down")} class="move-btn" title="下移">↓</button>
                                                            <!-- <button class="edit-question-btn" title="编辑" aria-label="编辑题目">
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
                                                            </button> -->
                                                            
                                                            <button onclick={()=>deleteQuestion(question.id,group)} class="delete-question-btn" title="删除">✕</button>
                                                        </div>
                                                    </div>
    
                                                    <!-- 题目内容 -->
                                                    {#if $QUESTION_OPEN_STATE[question.id]}
                                                        <div class="question-container">                                          
                                                            <QuestionPreviewPanel
                                                                question={question}
                                                                showHeader={false}
                                                                editSubScore={true}
                                                                update={(new_sub_score)=>updateSubScore(new_sub_score,groupIndex,questionIndex)}
                                                            />
                                                        </div>
                                                    {/if}
                                                </div>
                                            {/each}
                                        
                                            <!-- 暂无题目 -->
                                        {:else}
                                            <div class="no-questions-container"
                                                ondragover={(event)=>handleQuestionDragOver(event,{ id: null },group)}
                                                ondrop={handleQuestionDrop}
                                                ondragend={handleDragEnd}
                                            >
                                                <div class="no-questions-box">
                                                    <span class="title">题组暂无题目</span>
                                                    <span class="prompt">可以通过以下方式快速添加题目：</span>
                                                    <div class="import-box">
                                                        <button onclick={()=>importQuestions(group)} class="btn btn--primary">导入题目</button>
                                                    </div>
                                                </div>
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
{/if}

<style>

    .add-paper {
        font-family: 'Noto Sans SC', sans-serif;
        color: var(--text-primary);
        overflow-y: auto;
        
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
                white-space: nowrap;
                overflow: hidden;
                text-overflow: ellipsis;

                &:focus {
                    outline: none;
                    border-color: var(--primary-color);
                    color: var(--primary-color);
                }

                &:hover {
                    white-space: normal;
                    overflow: visible;
                    width: 40%;
                    border-color: var(--primary-color);
                    color: var(--primary-color);
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

                button {
                    padding: 10px 15px;
                }
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
                                        margin-right: 4px;
                                        color: var(--text-primary);
                                    }

                                    button {
                                        font-size: 10px;
                                        padding: 0;
                                        padding-right: 4px;
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

                        /* 标题区 */
                        .title-box {

                            .title {
                                font-weight: 1000;
                                font-size: 20px;
                            }

                            span {
                                font-size: 14px;
                            }
                        }

                        button {
                            padding: 10px 15px;
                        }
                    }

                    /* 列表 */
                    .question-groups-outer-box {
                        border: 1px solid var(--border-light);
                        padding: 5px;

                        .question-groups-box {
                            /* background-color: #40a9ff; */
                            display: flex;   
                            flex-direction: column;  
                            border: 2px dashed transparent;
                            transition: all 0.3s;
                            border-radius: var(--border-radius-sm);
                            
                            &.drag-over {
                                border-color: var(--primary-color);
                                background-color: #eef4fa;
                                border-radius: var(--border-radius-md);
                                border: 2px dashed var(--primary-color);
                                
                            }
    
                            .single-group {
                                display: flex;
                                padding: 17px 21px;
                                justify-content: space-between;
                                cursor: grab;
                                border-bottom: 1px solid var(--border-light);
                                border-radius: var(--border-radius-md);
                                position: relative;
                                background-color: var(--bg-primary);
    
                                &.dragging {
                                    opacity: 0.5; /* 半透明 */
                                }
    
                                &.drag-over-top::before,
                                &.drag-over-bottom::before {
                                    content: "";
                                    position: absolute;
                                    left: 0;
                                    right: 0;
                                    height: 2px;
                                    background-color: var(--primary-color);
                                    z-index: 10;
                                }
    
                                /* 上边线 */
                                &.drag-over-top::before {
                                    top: 0;
                                }
    
                                /* 下边线 */
                                &.drag-over-bottom::before {
                                    bottom: 0;
                                }
    
                                span {
                                    font-weight: 500;
                                }
                            
                                &:hover {
                                    background-color: var(--bg-secondary);
                                    cursor: grab;
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
                        cursor: pointer;

                        &:hover {
                            background-color: #edf2f7;
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

                        /* 右侧区域 */
                        .header-right {
                            margin-left: auto;
                            display: flex;
                            align-items: center;

                            input {
                                width: 75px;
                                margin-right: 36px;
                                padding-left: 12px;
                            }

                            span {
                                font-size: 14px;
                                color: var(--text-secondary);
                                margin-right: 1vw;
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
                            border: 2px dashed transparent;
                            transition: all 0.3s;
                            border-radius: var(--border-radius-sm);
    
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

                            &.drag-over {
                                border-color: var(--primary-color);
                                background-color: #eef4fa;
                                border-radius: var(--border-radius-md);
                                border: 2px dashed var(--primary-color);
                                
                            }
    
                            .single-question {
                                border: 1px solid var(--border-light);
                                border-radius: var(--border-radius-sm);
                                background-color: var(--bg-primary);
                                position: relative;
                                cursor: grab;

                                &.dragging {
                                    opacity: 0.5; /* 半透明 */
                                }
    
                                &.drag-over-top::before,
                                &.drag-over-bottom::before {
                                    content: "";
                                    position: absolute;
                                    left: 0;
                                    right: 0;
                                    height: 2px;
                                    background-color: var(--primary-color);
                                    z-index: 10;
                                }
    
                                /* 上边线 */
                                &.drag-over-top::before {
                                    top: 0;
                                }
    
                                /* 下边线 */
                                &.drag-over-bottom::before {
                                    bottom: 0;
                                }
    
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
                                        cursor: pointer;
                                        display: flex;
                                        align-items: center;
    
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

                                        input {
                                            width: 75px;
                                            margin-right: 36px;
                                            padding-left: 12px;
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