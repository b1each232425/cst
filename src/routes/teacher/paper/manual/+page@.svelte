<!--
 * @Author: WangKaidun 1597225095@qq.com
 * @Date: 2025-08-01 15:21:42
 * @LastEditors: WangKaidun 1597225095@qq.com
 * @LastEditTime: 2025-09-03 15:31:35
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
    import SingleSelectEditPanel from "../../question-bank/_components/singlePage.svelte";
    import MultipleSelectEditPanel from "../../question-bank/_components/multiplePage.svelte";
    import JudgeSelectEditPanel from "../../question-bank/_components/judgePage.svelte";
    import FillBlankEditPanel from "../../question-bank/_components/fillBank.svelte";
    import ShortAnswerEditPanel from "../../question-bank/_components/shortAnswer.svelte";
    import "$lib/components/Button/index.scss"
    import "$lib/components/Input/index.scss"
    import { goto } from "$app/navigation";
    import { DIFFICULTY_TRANS, QUESTION_TYPE_TRANS, utf8MaxLength } from "../_utils/tool";
    import { onMount, tick } from "svelte";
    import { toast } from "$lib/components/Toast/Toast";
    import { get } from "svelte/store";
    import { CURRENT_PAPER_ID, GROUP_OPEN_STATE, QUESTION_OPEN_STATE, GROUP_AVERAGE_SCORE, SIDEBAR_COLLAPSED } from "../_stores/store";
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
                return data;
            })
            .catch(error => {
                toast.error(error.message, 1000);
                console.error('保存试卷出错：', error);
                return null;
            });
    }

    // 获取题库题目
    function fetchQuestion(question) {
        const PARAMS = new URLSearchParams();

        PARAMS.append("bankID", question.belong_to);
        PARAMS.append("questionID", question.bank_question_id);

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
                if (data.status !== 0){
                    throw new Error(data.msg);  
                }
                return data;
            })
            .catch(error => {
                toast.error(error.message, 1000);
                console.error('获取题库题目出错：', error);
                return null;
            });
    }

    // 更新题目
    function updateQuestion(question) {
        // 构建更新题目的数据，确保与TheoryQuestion类型匹配
        const updateData = {
            ID: question.id,
            Type: question.type,
            Difficulty: question.difficulty,
            Content: question.content,
            Tags: question.tags,
            Options: question.options,
            Answers: question.answers,
            Analysis: question.analysis || "",
            Score: question.score,
            QuestionAttachmentsPath: question.question_attachments_path,
            BelongTO: question.belong_to
        };

        // 调用题库管理的更新接口
        return fetch('/api/questions', {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            credentials: 'include',
            body: JSON.stringify({ data: updateData })
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
                return data;
            })
            .catch(error => {
                toast.error(error.message, 1000);
                console.error('保存编辑题目失败：', error);
                return null;
            });
    }

    /******************* API 区 ********************/


    
    /******************* 控制开关区 *****************/
    let import_modal_is_open = $state(false);  // 从题库中导入题目弹窗
    let is_adding_group = $state(false);      // 添加题组
    let page_is_ready = $state(false);
    let is_editing_question = $state(false); // 编辑题目
    let is_update_average_question_score = $state(false); // 更新题组平均分
    let is_saving = $state(false);
    let is_exiting = $state(false);

    // 编辑组件状态管理
    let show_single_select_edit_panel = $state(false);      // 显示单选题编辑面板
    let show_multiple_select_edit_panel = $state(false);    // 显示多选题编辑面板
    let show_judge_select_edit_panel = $state(false);      // 显示判断题编辑面板
    let show_fill_bank_edit_panel = $state(false);         // 显示填空题编辑面板
    let show_short_answer_edit_panel = $state(false);      // 显示简答题编辑面板

    // 编辑组件实例
    let single_select_edit_panel_component;
    let multiple_select_edit_panel_component;
    let judge_select_edit_panel_component;
    let fill_bank_edit_panel_component;
    let short_answer_edit_panel_component;

    // 当前编辑的题目
    let editing_question = $state(null);

    // 高亮状态管理
    let highlighted_questions = $state(new Set()); // 存储需要高亮的题目ID
    let highlighted_groups = $state(new Set()); // 存储需要高亮的题组ID
    let highlight_timers = new Map(); // 存储每个题目和题组的高亮定时器

    // 高亮题目
    function highlightQuestion(questionId) {
        // 先添加高亮状态，确保高亮延续
        highlighted_questions.add(questionId);
        
        // 如果该题目已经有高亮定时器，先清除它
        if (highlight_timers.has(`question_${questionId}`)) {
            clearTimeout(highlight_timers.get(`question_${questionId}`));
        }
        
        // 创建新的5秒定时器
        const timer = setTimeout(() => {
            highlighted_questions.delete(questionId);
            // 在 Svelte 5 中，需要重新赋值来触发响应式更新
            highlighted_questions = new Set(highlighted_questions);
            // 清除定时器引用
            highlight_timers.delete(`question_${questionId}`);
        }, 5000);
        
        // 保存定时器引用
        highlight_timers.set(`question_${questionId}`, timer);
    }

    // 高亮题组
    function highlightGroup(groupId) {
        // 先添加高亮状态，确保高亮延续
        highlighted_groups.add(groupId);
        
        // 如果该题组已经有高亮定时器，先清除它
        if (highlight_timers.has(`group_${groupId}`)) {
            clearTimeout(highlight_timers.get(`group_${groupId}`));
        }
        
        // 创建新的5秒定时器
        const timer = setTimeout(() => {
            highlighted_groups.delete(groupId);
            // 在 Svelte 5 中，需要重新赋值来触发响应式更新
            highlighted_groups = new Set(highlighted_groups);
            // 清除定时器引用
            highlight_timers.delete(`group_${groupId}`);
        }, 5000);
        
        // 保存定时器引用
        highlight_timers.set(`group_${groupId}`, timer);
    }

    // 响应式侧边栏控制
    let resizeObserver = null;
    const SIDEBAR_COLLAPSE_THRESHOLD = 1200; // 当页面宽度小于1200px时收起侧边栏

    function closeImportModal() {
        import_modal_is_open = false;
    }

    // 检查页面宽度并自动收起/展开侧边栏
    function checkPageWidth() {
        const pageWidth = window.innerWidth;
        if (pageWidth < SIDEBAR_COLLAPSE_THRESHOLD && !get(SIDEBAR_COLLAPSED)) {
            SIDEBAR_COLLAPSED.set(true);
        } else if (pageWidth >= SIDEBAR_COLLAPSE_THRESHOLD && get(SIDEBAR_COLLAPSED)) {
            SIDEBAR_COLLAPSED.set(false);
        }
    }

    // 设置响应式监听器
    function setupResponsiveListener() {
        // 使用 ResizeObserver 监听页面大小变化
        if (typeof ResizeObserver !== 'undefined') {
            resizeObserver = new ResizeObserver(() => {
                checkPageWidth();
            });
            resizeObserver.observe(document.body);
        } else {
            // 降级方案：使用 window resize 事件
            window.addEventListener('resize', checkPageWidth);
        }
    }

    // 清理响应式监听器
    function cleanupResponsiveListener() {
        if (resizeObserver) {
            resizeObserver.disconnect();
            resizeObserver = null;
        } else {
            window.removeEventListener('resize', checkPageWidth);
        }
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
        savePaper(paperID, ACTIONS)
            .then(async result1 => {
                if(result1) {
                    if(is_saving) {
                        is_saving = false;
                        toast.success("试卷内容已保存", 1000);
                    }
                    if(is_exiting) {
                        is_exiting = false;
                        await goto("/teacher/paper");
                        toast.success("试卷内容已保存", 1000);
                        return;
                    }
                }
            });
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

                if (result.status !== 0){
                    throw new Error(result.msg);  
                }

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
                toast.error(error.message, 1000);
                console.error('预览试卷出错：', error);
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

    // 计算文本宽度的函数
    function getTextWidth(text, font = '12px sans-serif') {
        // 创建一个临时的canvas元素来计算文本宽度
        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d');
        context.font = font;
        const metrics = context.measureText(text);
        return metrics.width;
    }

    // 获取标签input的宽度
    function getTagInputWidth(text) {
        if (!text || text.trim() === '') {
            return 40; // 默认最小宽度
        }
        const textWidth = getTextWidth(text, '12px sans-serif');
        const minWidth = 40; // 最小宽度
        const padding = 8; // 左右padding的总和
        const calculatedWidth = Math.max(textWidth + padding, minWidth);
        return Math.min(calculatedWidth, 200); // 最大宽度限制
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
    let to_edit_group_sidebar_component = $state(null);
    let to_edit_group_content_component = $state(null);
    let to_edit_group_position = $state("");
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
                const NEW_PAPER_GROUPS = [ ...paper_groups ];
                const GROUP_INDEX = NEW_PAPER_GROUPS.findIndex(g => g.id === groupID);
                NEW_PAPER_GROUPS.splice(GROUP_INDEX, 1);
                const GROUP_IDS = NEW_PAPER_GROUPS.map(group => group.id);

                // 获取所有题目的ID数组
                const QUESTION_IDS = NEW_PAPER_GROUPS.flatMap(group =>
                    group.questions.map(question => question.id)
                );

                const ACTIONS = [
                    {
                        action: "delete_group",
                        payload: groupID
                    },
                    {
                        action: "move_group",
                        payload: GROUP_IDS
                    },
                ];

                if(QUESTION_IDS.length > 0) {
                    ACTIONS.push({
                        action: "move_question",
                        payload: QUESTION_IDS
                    });
                }

                savePaper(paperID, ACTIONS)
                    .then(result1 => {
                        if(result1) {
                            toast.success("删除成功", 1000);
                            fetchPaper(paperID)
                                .then(result => {
                                    if(result) {
                                        paper_groups = result.data.GroupsData;
                                        paper_info = result.data;
                                        total_score = paper_info.TotalScore;
                                        question_count = paper_info.QuestionCount;
                                    }
                                });
                        }
                    });
            }
        });
    }

    // 清空题组内的题目
    function clearGroupQuestions(groupID) {
        // 找到要清空的题组
        const targetGroup = paper_groups.find(group => group.id === groupID);
        
        // 检查题组是否存在题目
        if (targetGroup.questions.length === 0) {
            toast.error("该题组没有题目", 1000);
            return;
        }

        MessageBox({
            title: "清空确认",
            content: "请问是否要清空该题组？",
            confirm_button_type: "danger",

            onConfirm: () => {
                // 获取要删除的题目ID数组
                const questionIDs = targetGroup.questions.map(question => question.id);
                
                // 获取剩余题目的ID数组（用于重新排序）
                const remainingQuestionIDs = paper_groups
                    .flatMap(group => group.questions.map(question => question.id))
                    .filter(id => !questionIDs.includes(id));

                const ACTIONS = [
                    {
                        action: "delete_question",
                        payload: questionIDs
                    }
                ];

                // 如果还有其他题目，需要重新排序
                if (remainingQuestionIDs.length > 0) {
                    ACTIONS.push({
                        action: "move_question",
                        payload: remainingQuestionIDs
                    });
                }

                savePaper(paperID, ACTIONS)
                    .then(result1 => {
                        if(result1) {
                            toast.success("清空成功", 1000);
                            fetchPaper(paperID)
                                .then(result => {
                                    if(result) {
                                        paper_groups = result.data.GroupsData;
                                        paper_info = result.data;
                                        total_score = paper_info.TotalScore;
                                        question_count = paper_info.QuestionCount;
                                    }
                                });
                        }
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
                .then(result1 => {
                    if(result1) {
                        toast.success("添加成功", 1000);
                        fetchPaper(paperID)
                            .then(result => {
                                if(result) {
                                    // 获取旧题组的 ID 数组
                                    const OLD_GROUP_IDS = paper_groups.map(group => group.id);
                                    paper_groups = result.data.GroupsData;
                                    // 获取新题组的 ID 数组
                                    const NEW_GROUP_IDS = result.data.GroupsData.map(group => group.id);
                                    // 获取新题组和旧题组的差集
                                    const ADDED_GROUP_IDS = NEW_GROUP_IDS.filter(id => !OLD_GROUP_IDS.includes(id));
                                    // 将新题组展开
                                    const NEW_GROUP_STATE = { ...get(GROUP_OPEN_STATE) };
                                    ADDED_GROUP_IDS.forEach(id => NEW_GROUP_STATE[id] = true);
                                    GROUP_OPEN_STATE.set(NEW_GROUP_STATE);
                                    
                                    paper_info = result.data;
                                    is_adding_group = false;
                                    to_add_group_name = "";
                                }
                        });
                    }
                });
        }
    }

    // 编辑题组名称
    async function editGroupName(id, name, position) {
        to_edit_groupID = id;
        to_edit_group_position = position;
        to_edit_group_name = name;
        if(position === "content") {
            await tick();
            to_edit_group_content_component.focus();
        } else {
            await tick();
            to_edit_group_sidebar_component.focus();
        }
    }

    let is_cancelling_edit_group_name = $state(false);

    // 确认编辑题组名称
    function confirmEditGroupName() {
        if(!is_cancelling_edit_group_name && to_edit_group_name.trim() !== "") {

            if(to_edit_group_position === "side-bar") {
                to_edit_group_sidebar_component.blur();
            } else {
                to_edit_group_content_component.blur();
            }

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
                .then(result1 => {
                    if(result1) {
                        toast.success("编辑成功", 1000);
                        fetchPaper(paperID)
                            .then(result => {
                                if(result) {
                                    paper_groups = result.data.GroupsData;
                                    paper_info = result.data;
                                    to_edit_groupID = null;
                                }
                            });
                    }
                });
        }
    }

    // 取消编辑题组名称
    function cancelEditGroupName() {
        is_cancelling_edit_group_name = true;
        to_edit_groupID = null;
        to_edit_group_name = "";
        to_edit_group_position = "";
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
                    .then(result1 => {
                        if(result1) {
                        toast.success("删除成功", 1000);
                            fetchPaper(paperID)
                                .then(result => {
                                    if(result) {
                                        paper_groups = result.data.GroupsData;
                                        paper_info = result.data;
                                        total_score = paper_info.TotalScore;
                                        question_count = paper_info.QuestionCount;
                                    }
                                });
                        }
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
        // 获取新导入的题目 ID
        const NEW_QUESTION_IDS = updatedGroups.flatMap(group =>
            group.questions.map(question => question.id)
        );

        // 获取旧的题目 ID
        const OLD_QUESTION_IDS = paper_groups.flatMap(group =>
            group.questions.map(question => question.id)
        );

        // 获取新导入的题目 ID 和旧的题目 ID 的差集
        const IMPORTED_QUESTION_IDS = NEW_QUESTION_IDS.filter(id => !OLD_QUESTION_IDS.includes(id));

        // 设置新导入的题目为展开状态
        const NEW_QUESTION_STATE = { ...get(QUESTION_OPEN_STATE) };
        IMPORTED_QUESTION_IDS.forEach(id => NEW_QUESTION_STATE[id] = true);
        QUESTION_OPEN_STATE.set(NEW_QUESTION_STATE);

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

    // 移动题组
    function moveGroup(group, direction) {
        // 判断是否是第一个题组
        if(group.id === paper_groups[0].id && direction === "up") {
            toast.error("已经是第一个题组", 1000);
            return;
        }
        
        // 判断是否是最后一个题组
        if(group.id === paper_groups[paper_groups.length - 1].id && direction === "down") {
            toast.error("已经是最后一个题组", 1000);
            return;
        }

        // 交换题组
        const NEW_PAPER_GROUPS = [ ...paper_groups ];
        const GROUP_INDEX = NEW_PAPER_GROUPS.findIndex(g => g.id === group.id);
        const TARGET_GROUP_INDEX = GROUP_INDEX + (direction === "up" ? -1 : 1);
        [NEW_PAPER_GROUPS[GROUP_INDEX], NEW_PAPER_GROUPS[TARGET_GROUP_INDEX]] = [NEW_PAPER_GROUPS[TARGET_GROUP_INDEX], NEW_PAPER_GROUPS[GROUP_INDEX]];
        const GROUP_IDS = NEW_PAPER_GROUPS.map(group => group.id);

        // 获取所有题目的ID数组
        const QUESTION_IDS = NEW_PAPER_GROUPS.flatMap(group =>
            group.questions.map(question => question.id)
        );

        const ACTIONS = [
            {
                action: "move_group",
                payload: GROUP_IDS,
            }
        ];

        // 只有当存在题目时才添加move_question
        if(QUESTION_IDS.length > 0) {
            ACTIONS.push({
                action: "move_question",
                payload: QUESTION_IDS
            });
        }
        
        savePaper(paperID, ACTIONS)
            .then(result1 => {
                if(result1) {
                    fetchPaper(paperID)
                        .then(result => {
                            if(result) {
                                paper_groups = result.data.GroupsData;
                                paper_info = result.data;
                                total_score = paper_info.TotalScore;
                                question_count = paper_info.QuestionCount;
                                // 移动成功后高亮题组
                                highlightGroup(group.id);
                            }
                        });
                    }
            });
    }

    // 移动题目
    function moveQuestion(group, question, direction) {
        // 获取题目 ID 数组
        const FULL_QUESTION_IDS = paper_groups.flatMap(group =>
            group.questions.map(question => question.id)
        );

        // 获取待移动的题目索引
        const INDEX = FULL_QUESTION_IDS.indexOf(question.id);

        // 找当前题组在 paper_groups 中的索引
        const CURRENT_GROUP_INDEX = paper_groups.findIndex(g => g.id === group.id);

        // 找当前题目在本组里的索引
        const QUESTION_INDEX_IN_GROUP = group.questions.findIndex(q => q.id === question.id);

        // 边界检查：第一道题且位于第一个题组时不能前移
        if (direction === 'up' && INDEX === 0 && CURRENT_GROUP_INDEX === 0) {
            toast.error("已经是第一道题目", 1000);
            return;
        }

        // 边界检查：最后一道题且位于最后一个题组时不能后移
        if (direction === 'down' && INDEX === FULL_QUESTION_IDS.length - 1 && CURRENT_GROUP_INDEX === paper_groups.length - 1) {
            toast.error("已经是最后一道题目", 1000);
            return;
        }

        // 默认原题组
        let target_groupID = group.id;

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
            .then(result1 => {
                if(result1) {
                    fetchPaper(paperID)
                        .then(result => {
                            if(result) {
                                paper_groups = result.data.GroupsData;
                                paper_info = result.data;
                                total_score = paper_info.TotalScore;
                                question_count = paper_info.QuestionCount;
                                // 移动成功后高亮题目
                                highlightQuestion(question.id);
                            }
                        });
                }
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
            .then(result1 => {
                if(result1) {
                    fetchPaper(paperID)
                        .then(result => {
                            if(result) {
                                paper_groups = result.data.GroupsData;
                                paper_info = result.data;
                                total_score = paper_info.TotalScore;
                                question_count = result.data.QuestionCount;
                                
                                // 检查题组是否还保持统一的每题分值，如果不一致则清空每题分值输入框
                                const group = paper_groups.find(g => g.id === question.group_id);
                                if (group && !checkGroupScoreConsistency(group)) {
                                    clearGroupAverageScore(group);
                                }
                            }
                        });
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
            .then(result1 => {
                if(result1) {
                    fetchPaper(paperID)
                        .then(result => {
                            if(result) {
                                paper_groups = result.data.GroupsData;
                                paper_info = result.data;
                                total_score = paper_info.TotalScore;
                                question_count = paper_info.QuestionCount;
                            }
                        });
                }
            })
    }

    // 更新子题分数
    function updateSubScore(new_sub_score,groupIndex,questionIndex) {
        // 接收子组件参数
        paper_groups[groupIndex].questions[questionIndex].sub_score = new_sub_score;
        
        // 修改题目总分
        paper_groups[groupIndex].questions[questionIndex].score =
            new_sub_score.reduce((sum, val) => sum + (Number(val)), 0);

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
            .then(result1 => {
                if(result1) {
                    fetchPaper(paperID)
                        .then(result => {
                            if(result) {
                                paper_groups = result.data.GroupsData;
                                paper_info = result.data;
                                total_score = paper_info.TotalScore;
                                question_count = paper_info.QuestionCount;
                                
                                // 检查题组是否还保持统一的每题分值，如果不一致则清空每题分值输入框
                                const group = paper_groups[groupIndex];
                                if (group && !checkGroupScoreConsistency(group)) {
                                    clearGroupAverageScore(group);
                                }
                            }
                        });
                }
            });
    }

    // 编辑题目
    function editQuestion(question) {
        fetchQuestion(question)
            .then(result => {
                if(result) {
                    const QUESTION = result.data;

                    // 转换数据格式以匹配编辑组件的期望
                    const convertedQuestion = {
                        id: QUESTION.ID,
                        content: QUESTION.Content,
                        type: QUESTION.Type,
                        options: QUESTION.Options,
                        answers: QUESTION.Answers,
                        analysis: QUESTION.Analysis,
                        difficulty: QUESTION.Difficulty,
                        tags: QUESTION.Tags,
                        score: QUESTION.Score,
                        question_attachments_path: QUESTION.QuestionAttachmentsPath,
                        belong_to: QUESTION.BelongTo
                    };

    
                    // 使用转换后的数据
                    editing_question = convertedQuestion;
                    is_editing_question = true;
                    
                    switch (question.type) {
                        case '00': // 单选题
                            if (single_select_edit_panel_component) {
                                single_select_edit_panel_component.initPanel();
                                show_single_select_edit_panel = true;
                            }
                            break;
                        case '02': // 多选题
                            if (multiple_select_edit_panel_component) {
                                multiple_select_edit_panel_component.initPanel();
                                show_multiple_select_edit_panel = true;
                            }
                            break;
                        case '04': // 判断题
                            if (judge_select_edit_panel_component) {
                                judge_select_edit_panel_component.initPanel();
                                show_judge_select_edit_panel = true;
                            }
                            break;
                        case '06': // 填空题
                            if (fill_bank_edit_panel_component) {
                                fill_bank_edit_panel_component.initPanel();
                                show_fill_bank_edit_panel = true;
                            }
                            break;
                        case '08': // 简答题
                            if (short_answer_edit_panel_component) {
                                short_answer_edit_panel_component.initPanel();
                                show_short_answer_edit_panel = true;
                            }
                            break;
                    }
                }
            });
    }

    // 编辑组件确认
    async function onEditPanelConfirm(editedQuestionData) {
        // 合并编辑后的数据
        const updatedQuestion = {
            ...editing_question,
            ...editedQuestionData
        };

        // 调用更新题目接口
        updateQuestion(updatedQuestion)
            .then(result1 => {
                if(result1) {
                    toast.success("编辑成功", 1000);
                    closeAllEditPanels();
                    fetchPaper(paperID)
                        .then((result) => {
                            paper_groups = result.data.GroupsData;
                            paper_info = result.data;
                            total_score = paper_info.TotalScore;
                            question_count = paper_info.QuestionCount;
                        });
                }
            });
    }

    // 编辑组件取消
    function onEditPanelCancel() {
        closeAllEditPanels();
    }

    // 关闭所有编辑面板
    function closeAllEditPanels() {
        show_single_select_edit_panel = false;
        show_multiple_select_edit_panel = false;
        show_judge_select_edit_panel = false;
        show_fill_bank_edit_panel = false;
        show_short_answer_edit_panel = false;
        editing_question = null;
        is_editing_question = false;
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
            return group.questions.map(q => q.id);
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

        const DRAGGED_GROUP_ID = dragged_group.id;
        
        savePaper(paperID, ACTIONS)
            .then(result1 => {
                fetchPaper(paperID)
                    .then((result) => {
                        if(result) {
                            paper_groups = result.data.GroupsData;
                            paper_info = result.data;
                            total_score = paper_info.TotalScore;
                            question_count = paper_info.QuestionCount;
                            // 拖拽移动成功后高亮题组
                            highlightGroup(DRAGGED_GROUP_ID);
                        }
                    })
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
        
        // 先保存必要的数据，避免后续被清空
        const draggedQuestion = dragged_question_item.question;
        const draggedGroup = dragged_question_item.group;
        const targetGroup = drag_over_question_item.group;
        
        if (
            is_dragging_group ||
            !draggedQuestion ||
            !targetGroup ||
            (draggedQuestion.id === drag_over_question_item.question?.id &&
            draggedGroup.id === targetGroup.id)
        ) {
            handleDragEnd();
            return;
        };

        // 扁平化并过滤题目 ID 数组
        const QUESTION_IDS = paper_groups
            .flatMap(group => group.questions
            .map(question => question.id))
            .filter(id => id !== draggedQuestion.id);

        let dropIndex = 0;

        if (drag_over_question_item.question?.id) {
            // 非空题组的情况
            dropIndex = QUESTION_IDS.findIndex(id => id === drag_over_question_item.question.id);
            
            if (drag_over_question_position === "bottom") dropIndex += 1;
        } else {
            // 空题组的情况
            const groupIndex = paper_groups.findIndex(group => group.id === targetGroup.id);
            // 统计该组前面所有题目的数量
            dropIndex = paper_groups
                .slice(0, groupIndex)
                .reduce((count, group) => count + group.questions.length, 0);
        }

        QUESTION_IDS.splice(dropIndex, 0, draggedQuestion.id);

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
                        id: draggedQuestion.id,
                        group_id: targetGroup.id,
                        order: dropIndex + 1,
                        score: draggedQuestion.score
                    }
                ]
            }
        ];

        savePaper(paperID, ACTIONS)
            .then(result1 => {
                if(result1) {
                    fetchPaper(paperID)
                        .then((result) => {
                            if(result) {
                                paper_groups = result.data.GroupsData;
                                paper_info = result.data;
                                total_score = paper_info.TotalScore;
                                question_count = paper_info.QuestionCount;
                                
                                // 使用保存的数据进行高亮
                                highlightQuestion(draggedQuestion.id);
                            }
                        });
                }
            })
            .finally(() => {
                handleDragEnd();
            });
    }

    // 拖拽结束（全部）
    function handleDragEnd() {
        // 如果是拖拽题组，高亮被拖拽的题组
        if (dragged_type === "group" && dragged_group) {
            highlightGroup(dragged_group.id);
        }
        // 如果是拖拽题目，高亮被拖拽的题目
        else if (dragged_type === "question" && dragged_question_item.question) {
            highlightQuestion(dragged_question_item.question.id);
        }

        // 重置所有拖拽状态
        is_dragging_group = false;
        dragged_group = null;
        drag_over_group = null;
        drag_over_group_position = null;

        drag_over_question_item = {};
        dragged_question_item = {};
        drag_over_question_position = null;
        dragged_over_questionID_CSS = 0;
        is_dragging_question = false;
        dragged_type = null;
    }

    /***************** 拖拽功能区 *****************/

    // 挂载区
    onMount(() => {
        // 立即注册清理函数
        const cleanup = () => {
            cleanupResponsiveListener();
            highlight_timers.forEach(timer => clearTimeout(timer));
            highlight_timers.clear();
        };

        // 异步逻辑
        (async () => {
            // 设置响应式监听器
            setupResponsiveListener();

            // 初始检查页面宽度
            checkPageWidth();

            paperID = get(CURRENT_PAPER_ID);
            if (paperID === 0) {
                await goto("/teacher/paper");
                toast.success("试卷内容已保存", 1000);
                return;
            }

            const result = await fetchPaper(paperID);
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

                if (paper_groups && paper_groups.length > 0) {
                    expandAll();

                    paper_groups.forEach(group => {
                        if (!checkGroupScoreConsistency(group)) {
                            clearGroupAverageScore(group);
                        }
                    });
                }
            } else {
                toast.warning("3秒后跳转回试卷列表", 3000);
                setTimeout(() => goto("/teacher/paper"), 3000);
            }
        })();

        return cleanup; // ✅ 立即注册清理函数
    });

</script>


{#if page_is_ready}

    <!-- 导入题目弹窗 -->
    {#if import_modal_is_open}
        <ImportQuestion
            onclose={closeImportModal}
            update={updateAfterImport}
            to_import_group={to_import_group}
            fetchPaper={fetchPaper}
            savePaper={savePaper}
        />
    {/if}

    <!-- 编辑题目弹窗 -->
    <SingleSelectEditPanel
        bind:this={single_select_edit_panel_component}
        show={show_single_select_edit_panel}
        question_data={editing_question}
        is_new_question={false}
        onCancel={onEditPanelCancel}
        onConfirm={onEditPanelConfirm}
    />

    <MultipleSelectEditPanel
        bind:this={multiple_select_edit_panel_component}
        show={show_multiple_select_edit_panel}
        question_data={editing_question}
        is_new_question={false}
        onCancel={onEditPanelCancel}
        onConfirm={onEditPanelConfirm}
    />

    <JudgeSelectEditPanel
        bind:this={judge_select_edit_panel_component}
        show={show_judge_select_edit_panel}
        question_data={editing_question}
        is_new_question={false}
        onCancel={onEditPanelCancel}
        onConfirm={onEditPanelConfirm}
    />

    <FillBlankEditPanel
        bind:this={fill_bank_edit_panel_component}
        show={show_fill_bank_edit_panel}
        question_data={editing_question}
        is_new_question={false}
        onCancel={onEditPanelCancel}
        onConfirm={onEditPanelConfirm}
    />

    <ShortAnswerEditPanel
        bind:this={short_answer_edit_panel_component}
        show={show_short_answer_edit_panel}
        question_data={editing_question}
        is_new_question={false}
        onCancel={onEditPanelCancel}
        onConfirm={onEditPanelConfirm}
    />

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
                <button onclick={()=>expandAll()} class="btn btn--info is-plain">一键展开</button>
                <button onclick={()=>collapseAll()} class="btn btn--info is-plain">一键收起</button>
                <button onclick={()=>previewPaper()} class="btn btn--primary is-plain">预览试卷</button>
                <button onclick={()=>importQuestions({id:0,name:""})} class="btn btn--primary">从题库中导入</button>
                <button onclick={()=>{is_exiting = true;UpDatePaperInfo()}} class="btn btn--primary is-plain">保存并退出</button>
                <button onclick={()=>{is_saving = true;UpDatePaperInfo()}} class="btn btn--primary is-plain save-btn">保存</button>
                <button onclick={()=>{
                        MessageBox({
                            title: "退出确认",
                            content: "请问是否要退出？",
                            confirm_button_type: "danger",

                            onConfirm: () => {
                                is_exiting = true;
                                UpDatePaperInfo()
                            }
                        });
                    }}
                    class="btn btn--danger is-plain">退出</button>
            </div>
        </div>

        <!-- 下半区 -->
        <div class="bottom-area">
            <!-- 侧边栏 -->
            <div class="side-bar {$SIDEBAR_COLLAPSED ? 'collapsed' : ''}" >
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
                                <div class="content-box">
                                    <input type="text"
                                        bind:value={to_add_tag}
                                        onchange={addTag}
                                        placeholder="+标签"
                                        use:utf8MaxLength={30}
                                        style="width: {getTagInputWidth(to_add_tag)}px;"
                                    />
                                    <button onmousedown={clearToAddTagContent} title="取消">✕</button>
                                </div>
                            </div>

                            <!-- 已创建的标签 -->
                            {#each tags as tag, index}
                                <div class="paper-tag">
                                    <div class="color-block" style="background-color: {tag===""? "#40d5ff":TAG_COLOR_LIST[getColorIndex(tag)]};"></div>
                                    <div class="content-box">
                                        <input type="text"
                                            bind:value={tags[index]}
                                            onkeydown={oldTagEnter}
                                            onblur={()=>updateOldTag(index)}
                                            placeholder="+标签"
                                            use:utf8MaxLength={30}
                                            style="width: {getTagInputWidth(tags[index])}px;"
                                        />
                                        <button onmousedown={()=>deleteTag(index)} title="删除">✕</button>
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
                            <span>共有</span>
                            <span class="group-count">{paper_groups.length}</span>
                            <span>个题组</span>
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
                                    {#if to_edit_groupID === group.id && to_edit_group_position === "side-bar"}
                                        <!-- svelte-ignore a11y_no_static_element_interactions -->
                                        <div class="single-group edit-group">
                                            <input
                                                bind:value={to_edit_group_name}
                                                onchange={()=>confirmEditGroupName()}
                                                onblur={()=>{if(to_edit_group_name.trim() === ""||to_edit_group_name.trim() === group.name){cancelEditGroupName()}}}
                                                bind:this={to_edit_group_sidebar_component}
                                                onclick={(e)=>{e.stopPropagation()}}
                                                class="add-group-input"
                                                type="text"
                                                placeholder="请输入题组名称"
                                            >
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
                                            {dragged_group === group ? "dragging":""}
                                            {highlighted_groups.has(group.id) ? "highlighted" : ""}"
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
                                <div class="single-group add-group">
                                    <input bind:value={to_add_group_name} onchange={confirmAddgroup} onblur={()=>{if(to_add_group_name.trim() === "")cancelAddGroup()}} bind:this={to_add_group} class="add-group-input" type="text" placeholder="请输入题组名称">
                                    <div class="btn-box">
                                        <!-- 取消按钮 -->
                                        <button onmousedown={()=>cancelAddGroup()} class="delete-group-btn cancel-add" title="取消">✖</button>
                                    </div>
                                </div>
                            {/if}
    
                        </div>
                    </div>
                </div>
            </div>

            <!-- 侧边栏折叠按钮 -->
            <div class="sidebar-collapsed-btn-container">
                <button class="sidebar-collapsed-btn"
                    onclick={()=> SIDEBAR_COLLAPSED.set(!get(SIDEBAR_COLLAPSED))}
                    title={$SIDEBAR_COLLAPSED ? "展开" : "折叠"}
                >
                <img
                    src={$SIDEBAR_COLLAPSED ? '/student_answer_exam/right-arrows.svg' : '/student_answer_exam/left-arrows.svg'}
                    alt="切换箭头"
                    draggable={false}
                    />
                </button>
            </div>

            <!-- 内容区 -->
            <div class="content-container-outer-box">
                <div class="content-container">
                    {#if paper_groups}
                        {#each paper_groups as group, groupIndex}
                            <div class="single-group-content
                                {highlighted_groups.has(group.id) ? "highlighted" : ""}">
                                <!-- 头部下拉栏 - 编辑题组名称 -->
                                {#if to_edit_groupID === group.id && to_edit_group_position === "content"}
                                    <!-- svelte-ignore a11y_click_events_have_key_events -->
                                    <!-- svelte-ignore a11y_no_static_element_interactions -->
                                    <div class="group-header"
                                        onclick={()=>{
                                            if(!to_edit_groupID && !is_update_average_question_score) changeOpenState("group",group.id)
                                        }}
                                        title={$GROUP_OPEN_STATE[group.id]?"收起":"展开"}
                                        style="{$GROUP_OPEN_STATE[group.id] ? "" : "border-radius: var(--border-radius-sm);"}"
                                    >
                                    <!-- 左侧区域 -->
                                    <div class="header-left">
                                        <button class="toggle-btn">{$GROUP_OPEN_STATE[group.id]?"∨":"∧"}</button>
                                        <input
                                            bind:value={to_edit_group_name}
                                            onchange={()=>confirmEditGroupName()}
                                            onblur={()=>{if(to_edit_group_name.trim() === ""||to_edit_group_name.trim() === group.name){cancelEditGroupName()}}}
                                            bind:this={to_edit_group_content_component}
                                            onclick={(e)=>{e.stopPropagation()}}
                                            class="add-group-input"
                                            type="text"
                                            placeholder="请输入题组名称"
                                        >
                                    </div>

                                    <!-- 右侧区域 -->
                                    <div class="header-right">
                                        <button onmousedown={(e)=>{e.stopPropagation();cancelEditGroupName()}} class="delete-group-btn" title="取消">✕</button>
                                    </div>
                                </div>
                                {:else}
                                    <!-- 头部下拉栏 - 展开题组 -->
                                    <!-- svelte-ignore a11y_click_events_have_key_events -->
                                    <!-- svelte-ignore a11y_no_static_element_interactions -->
                                    <div class="group-header"
                                        onclick={()=>{
                                            if(!to_edit_groupID && !is_update_average_question_score) changeOpenState("group",group.id)
                                        }}
                                        title={$GROUP_OPEN_STATE[group.id]?"收起":"展开"}
                                        style="{$GROUP_OPEN_STATE[group.id] ? "" : "border-radius: var(--border-radius-sm);"}"
                                    >
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
                                                    onfocus={()=>{is_update_average_question_score = true;}}
                                                    onblur={()=>{is_update_average_question_score = false;}}
                                                >
                                            <button onclick={(e)=>{e.stopPropagation();importQuestions(group)}} class="btn btn--primary import-btn">导入题目</button>
                                            <button onclick={(e)=>{e.stopPropagation();moveGroup(group,"up")}} class="move-btn" title="上移">↑</button>
                                            <button onclick={(e)=>{e.stopPropagation();moveGroup(group,"down")}} class="move-btn" title="下移">↓</button>
                                            <button onclick={(e)=>{e.stopPropagation();editGroupName(group.id,group.name,"content")}} class="edit-group-btn" title="编辑" aria-label="编辑题组">
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
                                            <button onclick={(e)=>{e.stopPropagation();clearGroupQuestions(group.id)}} class="clear-group-btn" title="清空题组">
                                                <span class="material-symbols-outlined">cleaning_services</span>
                                            </button>
                                            <button onclick={(e)=>{e.stopPropagation();deleteGroup(group.id)}} class="delete-group-btn" title="删除">✕</button>
                                        </div>
                                    </div>
                                {/if}

                                <!-- 题目列表 -->
                                {#if $GROUP_OPEN_STATE[group.id]}
                                    <div class="group-question-list-outer-box">
                                        <div class="group-question-list {is_dragging_question ? "drag-over" : ""}">
                                            {#if group.questions.length !== 0}
                                                {#each group.questions as question, questionIndex}
                                                    <!-- svelte-ignore a11y_no_static_element_interactions -->
                                                    <div class="single-question
                                                        {(drag_over_question_item.question?.id === question.id && drag_over_question_position === 'top' && dragged_type === 'question') ? 'drag-over-top' : ''}
                                                        {(drag_over_question_item.question?.id === question.id && drag_over_question_position === 'bottom' && dragged_type === 'question') ? 'drag-over-bottom' : ''}
                                                        {dragged_question_item.question?.id === question.id ? "dragging":""}
                                                        {highlighted_questions.has(question.id) ? "highlighted" : ""}"
                                                        draggable={!question.isEditingScore && !question.isEditingSubScore}
                                                        ondragstart={(event)=>handleQuestionDragStart(event,question,group)}
                                                        ondragover={(event)=>handleQuestionDragOver(event,question,group)}
                                                        ondrop={handleQuestionDrop}
                                                        ondragend={handleDragEnd}
                                                    >
                                                        <!-- 头部下拉栏 -->
                                                        <div class="question-header" style="{$QUESTION_OPEN_STATE[question.id] ? "" : "border-radius: var(--border-radius-sm);"}">
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
                                                                <button onclick={()=>editQuestion(question)} class="edit-question-btn" title="编辑" aria-label="编辑题目">
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
                                                <!-- svelte-ignore a11y_no_static_element_interactions -->
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
    </div>
{/if}

<style>
    .material-symbols-outlined {
        font-variation-settings:
            'FILL' 0,
            'wght' 400,
            'GRAD' 0,
            'opsz' 20;
        font-size: 20px;
        color: currentColor; /* 继承父元素的 color */
        display: inline-block;
        font-family: 'Material Symbols Outlined';
        font-style: normal;
        font-weight: normal;
        line-height: 1;
        text-transform: none;
        letter-spacing: normal;
        word-wrap: normal;
        white-space: nowrap;
        direction: ltr;
        -webkit-font-feature-settings: 'liga';
        -webkit-font-smoothing: antialiased;
    }

    .add-paper {
        font-family: 'Noto Sans SC', sans-serif;
        color: var(--text-primary);
        display: flex;
        flex-direction: column;
        overflow: hidden;
        min-height: 100%;
        height: 100vh;
        width: 100vw;
        overflow-x: auto;
        
        /* 顶部栏 */
        .header {
            /* background-color: red; */
            display: flex;
            padding: 16px 32px 16px 24px;
            align-items: center;
            border-bottom: 1.5px solid var(--border-light);
            white-space: nowrap;

            /* 标题 */
            .title-container {
                display: flex;
                align-items: center;
                margin-right: auto;

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
                    margin: 0;
                }
            }
        }

        /* 下半区 */
        .bottom-area {
            /* background-color: rebeccapurple; */
            display: flex;
            height: calc(100% - 80px);

            /* 侧边栏 */
            .side-bar {
                /* background-color: aliceblue; */
                width: 400px;
                min-width: 400px;
                transition: all 0.3s ease;
                white-space: nowrap;

                &.collapsed {
                    width: 0;
                    min-width: 0;
                    overflow: hidden;
                    /* transform: translateX(-100%); */
                    /* opacity: 0; */
                    /* visibility: hidden; */
                }

                /* 试卷信息 */
                .paper-info-container {
                    /* background-color: antiquewhite; */
                    display: flex;
                    flex-direction: column;
                    gap: 12px;
                    font-size: 14px;
                    padding: 18px 24px;

                    span {
                        min-width: max-content;
                    }
                    
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
                            width: 280px;
                            min-width: 280px;
                            height: 50px;
                            gap: 10px 16px;
                            overflow-y: auto;
                            flex-wrap: wrap;
                            padding-top: 2px;

                            .paper-tag {
                                /* background-color: red; */
                                display: flex;
                                border: 1.5px solid transparent;
                                height: max-content;
                                max-height: max-content;

                                /* 颜色块 */
                                .color-block {
                                    width: 12px;
                                    height: 12px;
                                    margin: 2px;
                                }

                                /* 按钮块 */
                                .content-box {
                                    display: flex;
                                    align-items: center;
                                    border-bottom: 1px solid transparent;
                                    
                                    &:hover {
                                        border-bottom: 1px solid #7792ff;
                                    }

                                    &:focus-within {
                                        border-bottom: 1px solid #7792ff;
                                    }

                                    input {
                                        font-weight: 500;
                                        padding: 0;
                                        min-width: 40px;
                                        border: none;
                                        font-size: 12px;
                                        outline: none;
                                        margin-left: 2px;
                                        color: var(--text-primary);
                                        transition: width 0.2s ease;
                                        background: none
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

                                .content-box:hover button {
                                    visibility: visible;
                                }
                            }
                        }
                    }
                }

                /* 题组列表 */
                .question-groups-container {
                    /* background-color: aquamarine; */
                    padding: 18px 24px;

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
                                transition: all 1s;
    
                                &.dragging {
                                    opacity: 0.5; /* 半透明 */
                                }

                                /* 高亮效果 */
                                &.highlighted {
                                    border: 1px solid var(--border-light);
                                    border-color: #1890ff;
                                    box-shadow: 0 0 0 2px rgba(24, 144, 255, 0.2);
                                    z-index: 2;
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

            /* 侧边栏折叠按钮 */
            .sidebar-collapsed-btn-container {
                border-left: 1px solid var(--border-light);
                position: relative;

                .sidebar-collapsed-btn {
                    position: absolute;
                    top: 30%;
                    padding: 15px 0px;
                    background: none;
                    cursor: pointer;
                    background-color: #ffffff;
                    border: 1px solid var(--border-light);
                    border-radius: 16px;
                    left: -8px;

                    &:hover {
                        background-color: #eeefef;
                    }

                    img {
                        width: 16px;
                        height: 16px;
                    }
                }
            }

            /* 内容区 */
            .content-container-outer-box {
                overflow: auto;
                width: 100%;
                padding: 0 20px;
                min-width: 800px;
            }

            .content-container {
                /* background-color: aliceblue; */
                display: flex;
                flex-direction: column;
                gap: 10px;
                transition: all 0.3s ease;
                width: 100%;
                height: 100%;
                margin: 20px 0;
                min-width: min-content;
                
                .single-group-content {
                    border: 1px solid var(--border-light);
                    border-radius: var(--border-radius-sm);
                    transition: all 1s;

                    /* 高亮效果 */
                    &.highlighted {
                        border: 1px solid var(--border-light);
                        border-color: #1890ff;
                        box-shadow: 0 0 0 2px rgba(24, 144, 255, 0.2);
                    }
                    
                    /* 头部下拉栏 */
                    .group-header {
                        background-color: var(--bg-secondary);
                        display: flex;
                        padding: 10px 20px;
                        align-items: center;
                        cursor: pointer;
                        border-radius: var(--border-radius-sm) var(--border-radius-sm) 0 0;

                        span {
                            min-width: max-content;
                        }

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
                            
                            /* 添加题组 */
                            .add-group-input {
                                padding: 6px;
                                transition: all 0.3s;
                                outline: none;
                                border-radius: var(--input-border-radius);
                                border: 1px solid var(--border-light);
                                width: 35vw;

                                &:focus {
                                    border: 1px solid #40a9ff;
                                    box-shadow: 0 0 0 2px rgba(24, 144, 255, 0.2);
                                }
                            }
                        }

                        /* 右侧区域 */
                        .header-right {
                            margin-left: auto;
                            display: flex;
                            align-items: center;

                            /* 每题分值 */
                            input {
                                width: 75px;
                                margin-right: 12px;
                                padding-left: 12px;
                            }
                            span {
                                font-size: 14px;
                                color: var(--text-secondary);
                                margin-right: 1vw;
                            }

                            /* 导入题目按钮 */
                            .import-btn {
                                margin-right: 36px;
                            }
                            
                            .move-btn, .delete-group-btn, .edit-group-btn{
                                width: 30px;
                                height: 30px;
                                margin-left: 6px;
                                border-radius: var(--btn-border-radius);
                                border: 1px solid var(--border-light);
                                background-color: var(--bg-primary);
                                cursor: pointer;
                            }

                            .clear-group-btn {
                                font-weight: bold;
                                padding: 4px 0 0 7.5px;
                                width: 30px;
                                height: 30px;
                                margin-left: 6px;
                                border-radius: var(--btn-border-radius);
                                border: 1px solid var(--border-light);
                                background-color: var(--bg-primary);
                                cursor: pointer;

                                &:hover {
                                    color: var(--orange);
                                    border-color: var(--orange);
                                    transition: all 0.3s;
                                }
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

                            .edit-group-btn {
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
                            .delete-group-btn {
                                font-weight: bold;

                                &:hover {
                                    color: var(--red);
                                    border-color: var(--red);
                                    transition: all 0.3s;
                                }
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
                                transition: all 1s ease;

                                &.dragging {
                                    opacity: 0.5; /* 半透明 */
                                }

                                /* 高亮效果 */
                                &.highlighted {
                                    border: 1px solid var(--border-light);
                                    border-color: #1890ff;
                                    box-shadow: 0 0 0 2px rgba(24, 144, 255, 0.2);
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
                                    border-radius: var(--border-radius-sm) var(--border-radius-sm) 0 0;

                                    span {
                                        min-width: max-content;
                                    }
                                    
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