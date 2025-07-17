<!-- /*
 * @Author: wusaber33 
 * @Date: 2025-04-15 22:18:42 
 * @Last Modified by:   wusaber 
 * @Last Modified time: 2025-04-15 22:18:42 
 */
 -->
<script>
// @ts-nocheck

    import TitleBar from "./TitleBar.svelte";
    import QuestionGroupList from "./QuestionGroupList.svelte";
    import GroupPanel from "./GroupPanel.svelte";
    import QuestionImportModal from "./QuestionImportModal.svelte";
    import { onMount, onDestroy } from "svelte";
    import Dialog from "$lib/component/Dialog.svelte";
    import ActionToast from "$lib/component/ActionToast.svelte";
    import SingleSelectEditPanel from "$lib/component/QuestionEditPanel/singleSelect.svelte";
    import MultipleSelectEditPanel from "$lib/component/QuestionEditPanel/multipleSelect.svelte";
    import JudgeSelectEditPanel from "$lib/component/QuestionEditPanel/judgeSelect.svelte";
    import FillBlankEditPanel from "$lib/component/QuestionEditPanel/fillBlank.svelte";
    import ShortAnswerEditPanel from "$lib/component/QuestionEditPanel/shortAnswer.svelte";
    import {
        getQuestionLock,
        releaseQuestionLock,
        renewQuestionLock,
        updateTheoryQuestion,
    } from "../../../questionBank/theory/api";
    import { goto } from "$app/navigation";
    import { TheoryQuestion } from "../../../questionBank/theory/types";
    import {
        PaperQuestion,
        PaperInfo,
        QuestionGroup,
    } from "$lib/type/paper_type";
    import PaperInfoPanel from "./PaperInfoPanel.svelte";
    import { onQuestinConfirm } from "../../../questionBank/theory/sharingFuncs";
    onMount(async () => {
        if (typeof window !== "undefined") {
            const pathParts = window.location.pathname.split("/");
            const lastSegment = pathParts[pathParts.length - 1];

            // 过滤空字符串（处理末尾带/的情况）
            const cleanLastSegment = lastSegment.replace(/^\s+|\s+$/g, "");

            if (/^\d+$/.test(cleanLastSegment)) {
                // 编辑模式：ID为数字
                const paperId = parseInt(cleanLastSegment);
                const lockResult = await getPaperLock(paperId);
                if (lockResult) {
                    await getPaperDetail(paperId);
                } else {
                    showLockDialog = true;
                    return;
                }
            } else {
                // 创建模式：初始化数据
                initializeNewPaper();
            }

            // 页面卸载检测
            window.addEventListener("beforeunload", handleBeforeUnload);
        }
    });

    // 定义具名事件处理函数（关键步骤）

    /**
     * @param {BeforeUnloadEvent} e
     */
    const handleBeforeUnload = (e) => {
        if (is_dirty && !confirm_exit_dialog_visible) {
            e.preventDefault();
            e.returnValue = ""; // 必须设置以触发确认对话框
        }
    };

    onDestroy(() => {
        // Check if window exists before trying to access it
        if (typeof window !== "undefined") {
            window.removeEventListener("beforeunload", handleBeforeUnload);
        }
    });

    //状态追踪
    let is_dirty = $state(false);
    //加载状态
    let isLoading = $state(false);
    // 退出未保存确认框打开
    let confirm_exit_dialog_visible = $state(false);

    const META_RE = /(.+?)（共(\d+)题，共(\d+(?:\.\d+)?)分）$/;
    //保存试卷
    async function handleSave() {
        if (!is_dirty) {
            action_toast.show("custom", "未修改，无需保存", "/dialog/tip.svg");
            return;
        }
        const err = validatePaperData();
        if (err) {
            action_toast.show("error", err);
            return;
        }
        let is_success = false;
        if (paper_info.id === "newpaper") {
            // 创建新试卷
            is_success = await createManualPaper();
            if (is_success) {
                action_toast.show("success", "创建成功");
                navigateToEditPage(paper_info.id);
                await getPaperLock(paper_info.id);
            }
        } else {
            if (is_dirty) {
                // 编辑已有试卷
                is_success = await updateManualPaper();
                if(is_success){
                    action_toast.show("success", "保存成功");
                }
                
            }
        }
        if (!is_success) {
            return;
        }
        old_groups = JSON.parse(JSON.stringify(groups));
        old_paper_info = JSON.parse(JSON.stringify(paper_info));
        is_dirty = false;
    }

    /**
     * 参数检测函数
     */
    function validatePaperData() {
        if (!PaperInfo.name || !PaperInfo.name.trim()) {
            return "试卷名称不能为空";
        }
        if (!Array.isArray(groups) || groups.length === 0) {
            return "请至少添加一个题组";
        }
        for (const group of groups) {
            if (!group.name || !group.name.trim()) {
                return "题组名称不能为空";
            }
            if (
                !Array.isArray(group.questions) ||
                group.questions.length === 0
            ) {
                return `题组 [${group.name}] 下没有题目`;
            }
            for (const q of group.questions) {
                if (typeof q.score !== "number" || q.score <= 0) {
                    return `题组 [${group.name}] 下将有题目分数不合法`;
                }
                if (!q.bank_question_id) {
                    return `题组 [${group.name}] 下有题目未绑定题库ID`;
                }
                // 检查小题分
                if (q.sub_score !== undefined && q.sub_score !== null) {
                    if (!Array.isArray(q.sub_score) || q.sub_score.length === 0) {
                        return `题组 [${group.name}] 下有题目小题分格式不正确`;
                    }
                    // 检查每个小题分
                    for (let i = 0; i < q.sub_score.length; i++) {
                        if (typeof q.sub_score[i] !== "number" || q.sub_score[i] <= 0) {
                            return `题组 [${group.name}] 下有题目小题分不合法`;
                        }
                    }
                    // 检查小题分之和是否等于总分
                    const subScoreSum = q.sub_score.reduce((a, b) => a + b, 0);
                    if (subScoreSum !== q.score) {
                        return `题组 [${group.name}] 下有题目小题分之和不等于总分`;
                    }
                }
            }
        }
        return "";
    }

    /**
     * 退出按钮功能
     */
    function handleExit() {
        if (is_dirty) {
            showDialog({
                content: "您有未保存的修改，确定要离开吗？",
                type: "warning",
                title: "退出确认",
                confirmText: "离开并保存",
                cancelText: "直接离开",
                confirmBackgroundColor: "#39B54A", // 使用绿色背景
                onConfirm: async () => {
                    await handleSaveAndExit();
                },
                onCancel: async () => {
                    await handleExitWithoutSave();
                }
            });
        } else {
            if (!showLockDialog) {
                releaseLock();
            }
            goto("/teacher/paperManagement");
        }
    }
    /**
     * 退出不保存
     */
    function handleExitWithoutSave() {
        releaseLock();
        goto("/teacher/paperManagement");
    }
    /**
     * 保存并退出
     */
    async function handleSaveAndExit() {
        await handleSave();
        if (is_dirty) {
            return;
        }
        handleExitWithoutSave();
    }
    // 如果是创建试卷则初始化试卷
    function initializeNewPaper() {
        paper_info = {
            id: "newpaper",
            name: "新建试卷",
            category: "00",
            level: "00",
            duration: 120,
            description: "",
            tags: [],
            total_score: 0,
            question_count: 0,
            add_tag_input: "",
        };

        groups = [
            {
                id: "temp_group-1",
                name: "一、单选题",
                question_count: 0,
                total_score: 0,
                questions: [],
                score_per_question: 0,
                expanded: true,
            },
            {
                id: "temp_group-2",
                name: "二、多选题",
                question_count: 0,
                total_score: 0,
                questions: [],
                score_per_question: 0,
                expanded: true,
            },
            {
                id: "temp_group-3",
                name: "三、判断题",
                question_count: 0,
                total_score: 0,
                questions: [],
                score_per_question: 0,
                expanded: true,
            },
            {
                id: "temp_group-4",
                name: "四、填空题",
                question_count: 0,
                total_score: 0,
                questions: [],
                score_per_question: 0,
                expanded: true,
            },
            {
                id: "temp_group-5",
                name: "五、简答题",
                question_count: 0,
                total_score: 0,
                questions: [],
                score_per_question: 0,
                expanded: true,
            },
        ];
        old_groups = JSON.parse(JSON.stringify(groups));
        old_paper_info = JSON.parse(JSON.stringify(paper_info));
        console.log("groups:", groups);
        console.log("old_groups:", old_groups);
    }
    /**
     * 创建requestBody
     * @param {any} data
     */
    function buildRequestBody(data) {
        return {
            data: data,
        };
    }

    /**
     * 获取试卷详情
     * @param {number|string} paperId
     */
    async function getPaperDetail(paperId) {
        if (paperId && typeof paperId === "string") {
            return false;
        }
        // 获取试卷详情
        const response = await fetch(`/api/paper/manual/${paperId}`, {
            method: "GET",
            credentials: "include",
        });
        if (response.ok) {
            const result = await response.json();
            if (result.status == -1) {
                console.error("获取试卷失败" + result.msg);
                action_toast.show("error", "请求失败，请稍后重试");
                return false;
            }
            const paperData = result.data;
            paper_info.id = paperData.id;
            paper_info.name = paperData.name;
            paper_info.category = paperData.category;
            paper_info.level = paperData.level;
            paper_info.description = paperData.description;
            paper_info.tags = paperData.tags;
            paper_info.duration = paperData.suggested_duration;
            paper_info.total_score = paperData.total_score;
            paper_info.question_count = paperData.question_count;
            groups = paperData.question_groups.map((/** @type {QuestionGroup} */ group) => {
                let totalScore = 0;
                let questonCount = 0;
                group.questions.forEach((/** @type {PaperQuestion} */ question) => {
                    totalScore += question.score;
                    questonCount++;
                });
                const m = group.name.match(META_RE);
                if (m) {
                    group.name = m[1].trim();
                }
                // 检查题组内所有题目分数是否一致
                if (group.questions.length > 1) {
                    const firstScore = group.questions[0].score;
                    const isUniform = group.questions.every(
                        (/** @type {PaperQuestion} */ q) => q.score === firstScore,
                    );
                    group.score_per_question = isUniform ? firstScore : 0; // 0 表示不一致
                } else {
                    group.score_per_question = group.questions.score;
                }
                return {
                    id: group.id,
                    name: group.name,
                    questions: group.questions.map((/** @type {{ expanded: boolean; }} */ question) => {
                        question.expanded = true;
                        return question;
                    }),
                    score_per_question: 0,
                    total_score: totalScore,
                    question_count: questonCount,
                    expanded: true,
                };
            });
            old_groups = JSON.parse(JSON.stringify(groups));
            old_paper_info = JSON.parse(JSON.stringify(paper_info));
            is_dirty = false;
        } else {
            const responseMsg = response.text();
            action_toast.show("error", "获取试卷失败");
            console.error(`获取试卷详情失败：${responseMsg}`);
            return;
        }
    }

    /**
     * 获取试卷锁
     * @param {number} paperId
     */
    async function getPaperLock(paperId) {
        const response = await fetch(`/api/paper/${paperId}/lock`, {
            method: "GET",
            credentials: "include",
        });
        if (response.ok) {
            const result = await response.json();
            if (result.status == -1) {
                action_toast.show("error", "获取编辑试卷权限失败");
                return false;
            }
            if (result.status == -2) {
                //告知用户试卷正在被编辑，并跳转回首页
                action_toast.show("error", "试卷正在被编辑，请稍后重试");
                return false;
            }
            return true;
        } else {
            const responseMsg = response.text();
            console.error(`获取编辑试卷权限失败：${responseMsg}`);
            return false;
        }
    }

    // 启动计时器，每过段时间刷新用户对这个试卷的锁
    /**
     * @type {string | number | NodeJS.Timeout | null | undefined}
     */
    let lockCheckTimer = null;
    function startLockCheckTimer() {
        lockCheckTimer = setInterval(() => {
            refreshLock();
        }, 5000);
    }

    //  刷新用户对试卷的锁
    async function refreshLock() {
        const response = await fetch(`/api/paper/${paper_info.id}/lock`, {
            method: "PUT",
            credentials: "include",
        });
        if (response.ok) {
            const result = await response.json();
            if (result.status == -1) {
                action_toast.show("error", "获取编辑试卷权限失败");
                clearInterval(lockCheckTimer);
                lockCheckTimer = null;
                return false;
            }
            return true;
        } else {
            const responseMsg = response.text();
            action_toast.show("error", "获取编辑试卷权限失败");
            console.error(`获取编辑试卷权限失败：${responseMsg}`);
            return false;
        }
    }

    // 退出后释放锁
    async function releaseLock() {
        const response = await fetch(`/api/paper/${paper_info.id}/lock`, {
            method: "DELETE",
            credentials: "include",
        });
        if (response.ok) {
            const result = await response.json();
            if (result.status == -1) {
                action_toast.show("error", "释放编辑试卷权限失败");
                return false;
            }
            return true;
        } else {
            const responseMsg = response.text();
            action_toast.show("error", "释放编辑试卷权限失败");
            console.error(`释放编辑试卷权限失败：${responseMsg}`);
            return false;
        }
    }

    async function createManualPaper() {
        if (paper_info.id !== "newpaper") {
            action_toast.show("error", "逻辑错误，请联系管理员");
            return false;
        }
        // 整合 POST 数据
        const data = {
            name: paper_info.name,
            category: paper_info.category,
            level: paper_info.level,
            duration: paper_info.duration,
            description: paper_info.description,
            tags: paper_info.tags,
            question_groups: groups.map((group) => {
                const suffix = `（共${group.question_count}题，共${group.total_score}分）`;
                return {
                    temp_id: group.id,
                    name: group.name + suffix,
                    questions: group.questions.map((question) => {
                        return {
                            temp_id: question.id,
                            temp_group_id: group.id,
                            bank_question_id: question.bank_question_id,
                            score: question.score,
                            sub_score: question.sub_score,
                        };
                    }),
                };
            }),
        };
        const requestBody = buildRequestBody(data);

        // 3. 显示加载状态
        isLoading = true;
        // 使用 await 等待请求完成
        const response = await fetch("/api/paper/manual", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Accept: "application/json",
            },
            credentials: "include",
            body: JSON.stringify(requestBody),
        });

        // 检查 HTTP 状态码（非 2xx 会抛出错误）
        if (!response.ok) {
            const errorMsg = await response.text();
            action_toast.show("error", "创建试卷失败");
            console.error(`创建试卷失败：${errorMsg}`);
            isLoading = false;
            return false;
        }

        const result = await response.json();
        // 处理业务逻辑状态码
        if (result.status !== 0) {
            action_toast.show("error", "创建试卷失败");
            console.error(`创建试卷失败：${result.message}`);
            isLoading = false;
            return false;
        }

        // 更新本地数据
        const {
            paper_id: dataPaperId,
            question_id_map: dataQuestionMap,
            group_id_map: dataGroupMap,
        } = result.data;
        groups.forEach((group) => {
            if (group.id && dataGroupMap[group.id]) {
                group.id = dataGroupMap[group.id];
            }
            group.questions.forEach((question) => {
                if (question.id && dataQuestionMap[question.id]) {
                    question.id = dataQuestionMap[question.id];
                }
            });
        });
        paper_info.id = dataPaperId;
        isLoading = false;
        startLockCheckTimer();
        return true; // 明确返回成功
    }

    // 独立导航函数
    /**
     * @param {string} paperId
     */
    function navigateToEditPage(paperId) {
        goto(`/teacher/paperManagement/manual/${paperId}`, {
            replaceState: true,
        });
    }

    // 发送更新试卷请求
    async function updateManualPaper() {
        if (!old_paper_info || !old_groups) return false;
        if (typeof paper_info.id !== "number") return false;
        // 整合PATCH数据
        const currentGroups = groups.map((group) => {
            const suffix = `（共${group.question_count}题，共${group.total_score}分）`;
            return {
                id: group.id,
                name: group.name + suffix,
                questions: group.questions.map((question) => {
                    return {
                        id: question.id,
                        bank_question_id: question.bank_question_id,
                        score: question.score,
                        sub_score: question.sub_score,
                        group_name: group.name + suffix,
                        group_id: group.id,
                    };
                }),
            };
        });
        const oldGroups = old_groups?.map((group) => {
            const suffix = `（共${group.question_count}题，共${group.total_score}分）`;
            return {
                id: group.id,
                name: group.name + suffix,
                questions: group.questions.map((question) => {
                    return {
                        id: question.id,
                        bank_question_id: question.bank_question_id,
                        score: question.score,
                        sub_score: question.sub_score,
                        group_name: group.name + suffix,
                        group_id: group.id,
                    };
                }),
            };
        });
        //构建题组顺序数组
        const currentGroupsOrder = currentGroups.map((group) => String(group.id));
        const oldGroupsOrder = oldGroups?.map((group) => String(group.id));
        const questionsGroupsChange =
            currentGroupsOrder.length !== oldGroupsOrder.length ||
            !currentGroupsOrder.every(
                (group, index) => group === oldGroupsOrder[index],
            );
        // 题组顺序
        const questionGroupsOrder = questionsGroupsChange
            ? currentGroupsOrder
            : null;

        //比较差异
        const currentQuestions = currentGroups.flatMap(
            (group) => group.questions,
        );
        const oldQuestions = oldGroups?.flatMap((group) => group.questions);

        // 新增题组 （存在于旧数据但不存在于当前）
        const newGroups = currentGroups
            .filter(
                (group) =>
                    !oldGroups.some(
                        (oldGroup) => oldGroup.id === group.id,
                    ),
            )
            .map((group) => {
                return {
                    temp_id: group.id,
                    name: group.name,
                };
            });

        // 删除题组
        const deletedGroups = oldGroups
            .filter(
                (group) =>
                    !currentGroups.some(
                        (currentGroup) => currentGroup.id === group.id,
                    ),
            )
            .map((group) => 
                group.id,
            );

        const updateGroups = currentGroups
            .filter((group) =>
                oldGroups.some(
                    (oldGroup) =>
                    oldGroup.id === group.id &&
                        group.name !== oldGroup.name,
                ),
            )
            .map((group) => {
                return {
                    id: group.id,
                    name: group.name,
                };
            });

        // 新增问题（存在于当前但不存在于旧数据）
        const newQuestions = currentQuestions
            .filter(
                (question) =>
                    !oldQuestions.some(
                        (oldQuestion) => oldQuestion.id === question.id,
                    ),
            )
            .map((question) => {
                const isGroupNameString = typeof question.group_id === "string";

                // 构建 changes 对象，仅包含非 null 的 sub_score
                const changes = {
                    temp_id: question.id,
                    ...(isGroupNameString
                        ? { temp_group_id: question.group_id } // 新题组，使用 temp_group_id
                        : { group_id: question.group_id }), // 旧题组，使用 group_id
                    bank_question_id: question.bank_question_id,
                    score: question.score,
                };

                // 仅当 sub_score 不为 null 时，才添加到 changes 对象中
                if (question.sub_score !== null) {
                    changes.sub_score = question.sub_score;
                }

                return changes;
            });

        // 更新问题 （存在于旧数据但分数或所属题组变化）
        const updatedQuestions = oldQuestions
            .filter((oldQuestion) =>
                currentQuestions.some(
                    (currentQuestion) =>
                        currentQuestion.id === oldQuestion.id &&
                        (currentQuestion.score !== oldQuestion.score ||
                            currentQuestion.group_id !== oldQuestion.group_id ||
                            (currentQuestion.sub_score === undefined &&
                                oldQuestion.sub_score !== undefined) ||
                            (currentQuestion.sub_score !== undefined &&
                                oldQuestion.sub_score === undefined) ||
                            (currentQuestion.sub_score && oldQuestion.sub_score
                                ? !currentQuestion.sub_score.every(
                                      (val, index) =>
                                          val === oldQuestion.sub_score[index],
                                  )
                                : currentQuestion.sub_score !==
                                  oldQuestion.sub_score)),
                ),
            )
            .map((oldQuestion) => {
                let currentQuestion = currentQuestions.find(
                    (currentQuestion) => currentQuestion.id === oldQuestion.id,
                );
                let changes = {};
                if (currentQuestion?.score !== oldQuestion.score) {
                    changes.score = currentQuestion?.score;
                }
                if (
                    (currentQuestion.sub_score === undefined &&
                        oldQuestion.sub_score !== undefined) ||
                    (currentQuestion.sub_score !== undefined &&
                        oldQuestion.sub_score === undefined) ||
                    (currentQuestion.sub_score && oldQuestion.sub_score
                        ? !currentQuestion.sub_score.every(
                              (val, index) =>
                                  val === oldQuestion.sub_score[index],
                          )
                        : currentQuestion.sub_score !== oldQuestion.sub_score)
                ) {
                    changes.sub_score = currentQuestion.sub_score;
                }
                if (currentQuestion.group_id !== oldQuestion.group_id) {
                    if (typeof currentQuestion.group_id === "string") {
                        // 新题组，使用 temp_group_id
                        changes.temp_group_id = currentQuestion.group_id;
                        // 如果需要移除旧 group_id，可以设置为 undefined 或删除，但需要确保结构一致
                        // 这里假设不包含 group_id 在更新对象中，或者根据需求处理
                    } else if (typeof currentQuestion.group_id === "number") {
                        // 旧题组，使用 group_id
                        changes.group_id = currentQuestion.group_id;
                    } else {
                        console.error(
                            "group_id 非法：",
                            currentQuestion.group_id,
                        );
                    }
                }
                return {
                    id: oldQuestion.id,
                    ...changes,
                };
            });

        // 删除问题 （存在于旧数据但不存在于当前数据）
        const deletedQuestions = oldQuestions
            .filter(
                (question) =>
                    !currentQuestions.some(
                        (currentQuestion) => currentQuestion.id === question.id,
                    ),
            )
            .map((question) => question.id);

        // 题目顺序（按当前显示顺序）
        const currentQuestionOrder = currentGroups.flatMap((g) =>
            g.questions.map((q) => String(q.id)),
        );
        const oldQuestionOrder = oldGroups?.flatMap((g) =>
            g.questions.map((q) => String(q.id)),
        );
        const questionsOrderChange =
            currentQuestionOrder.length !== oldQuestionOrder.length ||
            !currentQuestionOrder.every(
                (question, index) => question === oldQuestionOrder[index],
            );
        // 题目顺序
        const questionOrder = questionsOrderChange
            ? currentQuestionOrder
            : null;

        // 基础信息变更检测
        const basicInfoChanges = {};
        if (paper_info.name !== old_paper_info.name)
            basicInfoChanges.name = paper_info.name;
        if (paper_info.category !== old_paper_info.category)
            basicInfoChanges.category = paper_info.category;
        if (paper_info.level !== old_paper_info.level)
            basicInfoChanges.level = paper_info.level;
        if (paper_info.duration !== old_paper_info.duration)
            basicInfoChanges.duration = paper_info.duration;
        if (paper_info.description !== old_paper_info.description)
            basicInfoChanges.description = paper_info.description;
        if (
            Array.isArray(paper_info.tags) &&
            Array.isArray(old_paper_info.tags) &&
            (paper_info.tags.length !== old_paper_info.tags.length ||
                paper_info.tags.some((t, i) => t !== old_paper_info.tags[i]))
        ) {
            basicInfoChanges.tags = paper_info.tags;
        }

        const patchData = {};
        if (Object.keys(basicInfoChanges).length > 0) {
            patchData.basic_info = basicInfoChanges;
        }
        if (newQuestions.length > 0) {
            patchData.add_questions = newQuestions;
        }
        if (newGroups.length > 0) {
            patchData.add_groups = newGroups;
        }
        if (deletedGroups.length > 0) {
            patchData.delete_groups = deletedGroups;
        }
        if (updateGroups.length > 0) {
            patchData.update_groups = updateGroups;
        }
        if (updatedQuestions.length > 0) {
            patchData.update_questions = updatedQuestions;
        }
        if (deletedQuestions.length > 0) {
            patchData.delete_questions = deletedQuestions;
        }
        if (questionOrder != null && questionOrder.length > 0) {
            patchData.question_order = questionOrder;
        }
        if (questionGroupsOrder != null && questionGroupsOrder.length > 0) {
            patchData.group_order = questionGroupsOrder;
        }

        const requestBody = {
            data: patchData,
        };
        console.log("patchData:", patchData);
        if (Object.keys(patchData).length > 0) {
            const response = await fetch(`/api/paper/manual/${paper_info.id}`, {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                },
                credentials: "include",
                body: JSON.stringify(requestBody),
            });
            // 处理响应
            if (!response.ok) {
                // 解析错误信息
                let errorResponse;
                errorResponse = await response.text();
                // 处理不同状态码
                switch (response.status) {
                    case 400:
                        console.error("请求参数错误:", errorResponse);
                        action_toast.show("error","请求参数错误"+errorResponse)
                        break;
                    case 401:
                        console.error("未授权:", errorResponse);
                        alert("登录已过期，请重新登录");
                        goto("/");
                        break;
                    case 500:
                        console.error("服务器错误:", errorResponse);
                        action_toast.show("error", "服务器繁忙，请稍后再试");
                        break;
                    default:
                        console.error(
                            `未知错误 (${response.status}):`,
                            errorResponse,
                        );
                        alert(
                            `操作失败 (${response.status}): ${errorResponse.message || "未知错误"}`,
                        );
                }
                return false;
            }

            // 成功处理
            if (response.status === 200) {
                const result = await response.json();
                if (result.status != 0) {
                    if (result.status == -2) {
                        action_toast.show("error", "没有权限修改这张试卷");
                        return false;
                    }
                }
                // 处理返回的 ID 映射
                console.log(result)
                const { group_id_map, question_id_map } = result.data;
                console.log(group_id_map)
                console.log(question_id_map)
                if (question_id_map != null && group_id_map != null) {
                    // 更新临时ID
                    groups.forEach((group) => {
                        if (
                            group_id_map != null &&
                            group_id_map.hasOwnProperty(group.id)
                        ) {
                            group.id = group_id_map[group.id];
                        }
                        if (question_id_map != null) {
                            group.questions.forEach((question) => {
                                if (
                                    question.id &&
                                    question_id_map.hasOwnProperty(question.id)
                                ) {
                                    // 检查 idMap 中是否存在该 id
                                    question.id = question_id_map[question.id];
                                }
                            });
                        }
                    });
                }
            }
            return true;
        } else {
            console.error("更新试卷检测有误，系统检测有修改但实际无修改");
            action_toast.show("error", "更新失败，请稍后重试");
            return false;
        }
        return false;
    }
    //-----------------------------------------------------题组操作-----------------------------------------------------
    /**
     * 试卷原始信息
     * @type {PaperInfo|null}
     */
    let old_paper_info = $state(null);
    /**
     * 原始题组数组
     * @type {Array<QuestionGroup>|null}
     */
    let old_groups = $state(null);
    /**
     * @type {PaperInfo}
     */
    let paper_info = $state({
        id: "paper-1",
        name: "",
        category: "00",
        level: "00",
        duration: 120,
        total_score: 0,
        description: "",
        question_count: 0,
        tags: [],
        add_tag_input: "",
    });

    /**
     * @type {Array<QuestionGroup>} groups - 题组数组
     */
    let groups = $state([]);

    /**
     * 处理跨题组拖拽放置
     * @param {string|number} question_id - 题目ID
     * @param {string|number} source_group_id - 源题组ID
     * @param {string|number} target_group_id - 目标题组ID
     */
    function handleCrossGroupDrop(
        question_id,
        source_group_id,
        target_group_id,
    ) {
        if (source_group_id === target_group_id) return;

        const source_group_index = groups.findIndex(
            (g) => g.id === source_group_id,
        );
        const target_group_index = groups.findIndex(
            (g) => g.id === target_group_id,
        );

        if (source_group_index === -1 || target_group_index === -1) return;
        // 从源题组找到题目
        const question = groups[source_group_index].questions.find(
            (q) => q.id === question_id,
        );
        if (!question) return;

        // 从源题组移除题目
        groups[source_group_index].questions = groups[
            source_group_index
        ].questions.filter((q) => q.id !== question_id);

        // 只有当目标题组的每题分值大于0时才赋值，否则保留原分值
        const targetScore = groups[target_group_index].score_per_question;
        const updated_question = {
            ...question,
            score: targetScore > 0 ? targetScore : question.score,
        };

        // 添加到目标题组
        groups[target_group_index].questions = [
            ...groups[target_group_index].questions,
            updated_question,
        ];
    }

    // scroll 到指定题组
    /**
     * @param {string|number} group_id
     */
    function scrollToGroup(group_id) {
        const group = groups.find((g) => g.id === group_id);
        if (!group) return;
        const group_element = document.getElementById(`${group_id}`);
        if (!group_element) return;
        group_element.scrollIntoView({ behavior: "smooth" });
    }

    // 题组名称唯一性校验方法
    /**
     * @param {string} new_name
     * @param {string|null} exclude_id - 排除的题组ID
     * @returns {boolean} - 新名称是否唯一
     */
    function isNameUnique(new_name, exclude_id = null) {
        return !groups.some(
            (g) => g.id !== exclude_id && g.name.trim() === new_name.trim(),
        );
    }

    function expandingAllGroupsAndQuestions() {
        groups.forEach((group) => {
            group.expanded = true;
            group.questions.forEach((question) => {
                question.expanded = true;
            });
        });
    }
    function collapseAllGroupsAndQuestions() {
        groups.forEach((group) => {
            group.expanded = false;
            group.questions.forEach((question) => {
                question.expanded = false;
            });
        });
    }

    //--------------------------------------实时检测页面数据变化并响应更新------------------------------

    /**
     * 重新计算整个试卷的题目序号
     * 保证序号从1开始连续递增
     */
    function updateQuestionIndexes() {
        let current_index = 1;

        groups.forEach((group) => {
            group.questions.forEach((question) => {
                question.order = current_index++;
            });
        });
    }

    // 深度比较函数过滤题组
    function areGroupsEqual() {
        if (
            !Array.isArray(groups) ||
            !Array.isArray(old_groups) ||
            groups.length !== old_groups.length
        )
            return false;
        for (let i = 0; i < groups.length; i++) {
            if (groups[i].id !== old_groups[i].id) return false; //顺序或题组id有变化
            if (groups[i].name !== old_groups[i].name) return false; //名称有变化
            // 题目数量有变化
            const qa = groups[i].questions || [];
            const qb = old_groups[i].questions || [];
            if (qa.length !== qb.length) return false;

            // 题目order/score/subscore有变化
            for (let j = 0; j < qa.length; j++) {
                const q1 = qa[j];
                const q2 = qb[j];
                if (q1.id !== q2.id) return false;
                //检测分数是否相同
                if (q1.score !== q2.score) return false;
                //检测小题分是否相同
                if (
                    Array.isArray(q1.sub_score) &&
                    Array.isArray(q2.sub_score)
                ) {
                    if (
                        q1.sub_score.length != q2.sub_score.length ||
                        !q1.sub_score.every((v, idx) => v == q2.sub_score[idx])
                    ) {
                        return false;
                    }
                } else if (q1.sub_score !== q2.sub_score) {
                    return false;
                }
            }
        }
        return true;
    }

    // 处理试卷信息UI属性
    function arePaperInfoEqual() {
        return (
            paper_info.name === old_paper_info.name &&
            paper_info.category === old_paper_info.category &&
            paper_info.level === old_paper_info.level &&
            paper_info.duration === old_paper_info.duration &&
            paper_info.description === old_paper_info.description &&
            Array.isArray(paper_info.tags) &&
            Array.isArray(old_paper_info.tags) &&
            paper_info.tags.length === old_paper_info.tags.length &&
            paper_info.tags.every((tag, i) => tag === old_paper_info.tags[i])
        );
    }

    function updateGroupScorePerQuestion() {
        groups.forEach((group) => {
            if (group.questions.length === 0) {
                // 如果题组没有题目，重置每题分数为0
                group.score_per_question = 0;
                return;
            }

            // 检查所有题目分数是否相同
            const firstScore = group.questions[0].score;
            const allSame = group.questions.every(
                (q) => q.score === firstScore,
            );

            // 更新题组每题分数
            group.score_per_question = allSame ? firstScore : 0; // 0 表示不一致
        });
    }

    // 变化检测函数
    function detectChanges() {
        if (!old_paper_info || !old_groups) return;
        const paperChanged = !arePaperInfoEqual();
        const groupsChanged = !areGroupsEqual();
        console.log("paper changed:", paperChanged);
        console.log("groups changed:", groupsChanged);

        is_dirty = paperChanged || groupsChanged;
    }

    /**
     * 更新试卷统计信息（题目数量和总分）
     */
    function updatePaperStats() {
        let total_count = 0;
        let total_score = 0;

        groups.forEach((group) => {
            // 更新题组题目数量
            group.question_count = group.questions.length;

            // 更新题组总分
            group.total_score = group.questions.reduce(
                (sum, q) => sum + (q.score || 0),
                0,
            );

            // 累计试卷数据
            total_count += group.question_count;
            total_score += group.total_score;
        });

        // 更新试卷信息
        paper_info.question_count = total_count;
        paper_info.total_score = total_score;
    }

    $effect(() => {
        // 监听题组变化，更新试卷统计信息
        updatePaperStats();
        // 重新计算题目序号
        updateQuestionIndexes();
        // 检测变化
        detectChanges();
    });

    //------------------------------------------------题目导入面板--------------------------------------------------
    /**
     * 导入题目开关位置
     * @type {boolean} importModalOpen
     */
    let importModalOpen = $state(false);
    /**
     * @type {string|number|null}
     */
    let selected_group = $state(null);
    /**
     * @type {(group_id: string|number|null) => void}
     */
    function handleOpenQuestionImportModal(group_id = null) {
        selected_group = group_id;
        importModalOpen = true;
    }

    //------------------------------------------------------------ 删除题组--------------------------------------------------------

    /**
     * @description Dialog 相关状态和函数
     */
    
    /**
     * @typedef {'info' | 'warning' | 'error' | 'confirm'} DialogType
     */

    /**
     * @type {{
     *   isOpen: boolean,
     *   content: string,
     *   type: DialogType,
     *   title: string,
     *   width: string,
     *   showFooter: boolean,
     *   confirmText: string,
     *   cancelText: string,
     *   confirmBackgroundColor: string,
     *   onConfirm?: () => Promise<void>,
     *   onCancel?: () => Promise<void>,
     *   onClose?: () => Promise<void>
     * }}
     */
    let dialogState = $state({
        isOpen: false,
        content: "",
        type: "info",
        title: "提示",
        width: "400px",
        showFooter: true,
        confirmText: "确定",
        cancelText: "取消",
        confirmBackgroundColor: "#E34D59", // 默认红色
        onConfirm: undefined,
        onCancel: undefined,
        onClose: undefined
    });

    /**
     * @description 显示对话框
     * @param {Object} options 对话框配置
     * @param {string} options.content 对话框内容
     * @param {DialogType} [options.type="info"] 对话框类型
     * @param {string} [options.title="提示"] 对话框标题
     * @param {string} [options.width="400px"] 对话框宽度
     * @param {boolean} [options.showFooter=true] 是否显示底部按钮
     * @param {string} [options.confirmText="确定"] 确认按钮文本
     * @param {string} [options.cancelText="取消"] 取消按钮文本
     * @param {string} [options.confirmBackgroundColor="#E34D59"] 确认按钮背景色
     * @param {() => Promise<void>} [options.onConfirm] 确认回调
     * @param {() => Promise<void>} [options.onCancel] 取消回调
     * @param {() => Promise<void>} [options.onClose] 关闭回调
     */
    function showDialog({
        content,
        type = "info",
        title = "提示",
        width = "400px",
        showFooter = true,
        confirmText = "确定",
        cancelText = "取消",
        confirmBackgroundColor = "#E34D59",
        onConfirm,
        onCancel,
        onClose
    }) {
        dialogState = {
            isOpen: true,
            content,
            type,
            title,
            width,
            showFooter,
            confirmText,
            cancelText,
            confirmBackgroundColor,
            onConfirm: onConfirm || (async () => { closeDialog(); }),
            onCancel: onCancel || (async () => { closeDialog(); }),
            onClose: onClose || (async () => { closeDialog(); })
        };
    }

    /**
     * @description 关闭对话框
     */
    function closeDialog() {
        dialogState.isOpen = false;
        // 重置对话框状态
        dialogState = {
            ...dialogState,
            content: "",
            type: "info",
            title: "提示",
            width: "400px",
            showFooter: true,
            confirmText: "确定",
            cancelText: "取消",
            confirmBackgroundColor: "#E34D59",
            onConfirm: undefined,
            onCancel: undefined,
            onClose: undefined
        };
    }

    /**
     * @description 处理确认按钮点击
     */
    async function handleDialogConfirm() {
        try {
            if (dialogState.onConfirm) {
                await dialogState.onConfirm();
            }
        } catch (error) {
            console.error('Dialog confirm error:', error);
            action_toast?.show("error", "操作失败");
        } finally {
            closeDialog();
        }
    }

    /**
     * @description 处理取消按钮点击
     */
    async function handleDialogCancel() {
        try {
            if (dialogState.onCancel) {
                await dialogState.onCancel();
            }
        } catch (error) {
            console.error('Dialog cancel error:', error);
        } finally {
            closeDialog();
        }
    }

    /**
     * @description 处理关闭按钮点击
     */
    async function handleDialogClose() {
        try {
            if (dialogState.onClose) {
                await dialogState.onClose();
            }
        } catch (error) {
            console.error('Dialog close error:', error);
        } finally {
            closeDialog();
        }
    }

    // 删除题组功能
    /** @type {string|number|null} */
    let current_delete_paper_id = $state(null);

    /**
     * 删除题组
     * @param {string|number} group_id - 题组ID
     */
    function deleteGroup(group_id) {
        // 如果题组只有一个，则不能删除
        if (groups.length === 1) {
            action_toast.show("error", "至少需要保留一个题组");
            return;
        }
        showDialog({
            content: "请问是否要删除该题组？",
            type: "warning",
            title: "删除确认",
            confirmText: "删除",
            cancelText: "取消",
            onConfirm: async () => {
                await confirmDeleteGroup();
            }
        });
        current_delete_paper_id = group_id;
    }

    /**
     * 确认删除题组
     */
    function confirmDeleteGroup() {
        groups = groups.filter((group) => group.id !== current_delete_paper_id);
        action_toast.show("error", "删除题组成功");
    }

    // ------------------------------操作提示-----------------------------------
    let action_toast_open = $state(false);
    /**
     * @type {any}
     */
    let action_toast = $state(null);

    /** @type {any} */
    let bubble_message_componet = $state(null);

    //---------------------------------------------------------题目编辑-----------------------------------------------------
    /**
     * @description 待编辑题目内容
     * @type {TheoryQuestion | null}
     */
    let modifying_question = $state(null);
    /**
     * @description 新建题目类型
     * @type {"00"|"02"|"04"|"06"|"08"|""}
     */
    let new_question_type = $state("");
    /**
     * @description 显示单选题编辑面板
     * @type {boolean}
     */
    let show_single_select_edit_panel = $state(false);

    /**
     * @description 单选题编辑面板组件
     * @type {SingleSelectEditPanel}
     */
    let single_select_edit_panel_componet;

    /**
     * @description 显示多选题编辑面板
     * @type {boolean}
     */
    let show_multiple_select_edit_panel = $state(false);

    /**
     * @description 多选题编辑面板组件
     * @type {MultipleSelectEditPanel}
     */
    let mutiple_select_edit_panel_componet;

    /**
     * @description 显示判断题编辑面板
     * @type {boolean}
     */
    let show_judge_select_edit_panel = $state(false);

    /**
     * @description 判断题编辑面板组件
     * @type {JudgeSelectEditPanel}
     */
    let judge_edit_panel_componet;

    /**
     * @description 显示填空题编辑面板
     * @type {boolean}
     */
    let show_fill_bank_edit_panel = $state(false);

    /**
     * @description 填空题编辑面板组件
     * @type {FillBlankEditPanel}
     */
    let fill_bank_edit_panel_componet;

    /**
     * @description 显示简答题编辑面板
     * @type {boolean}
     */
    let show_short_answer_edit_panel = $state(false);

    /**
     * @description 简答题编辑面板组件
     * @type {ShortAnswerEditPanel}
     */
    let short_answer_edit_panel_componet;

    /**
     * @description 请求锁
     */
    let request_lock = $state(false);

    /**
     * @description 维持题目锁定时器
     * @type {NodeJS.Timeout}
     */
    let maintain_qusetion_lock_timer;

    /**
     * @description 题目编辑面板点击确认
     * @param {TheoryQuestion} new_question_data
     */
    const onEditPanelConFirm = async (new_question_data) => {
        //  更新题目数据
        if (modifying_question !== null) {
            let handled_question_data = await onQuestinConfirm(
                new_question_data,
                modifying_question,
                action_toast,
                -1,
                false,
            );

            if (handled_question_data !== null) {
                //更新题目
                //找到题目所在题组
                // 2. 根据 bank_question_id 找到题目所在的题组
                const targetGroupId = findGroupByBankQuestionId(
                    groups,
                    new_question_data.id,
                );
                // 3. 更新题组内的题目
                updateQuestionInGroup(targetGroupId, handled_question_data);
            }

            let res = await releaseQuestionLock(modifying_question.id);
            if (res.status != 0) {
                action_toast.show("error", "释放题目锁失败:" + res.msg);
            }
            clearInterval(maintain_qusetion_lock_timer);
            modifying_question = null;
        }
    };

    /**
     * 通过 bank_question_id 找到题组 ID
     * @param {Array<QuestionGroup>} groups - 题组数组
     * @param {number} bankQuestionId - 题库题目ID
     * @returns {string|number|null} - 题组ID或null
     */
    function findGroupByBankQuestionId(groups, bankQuestionId) {
        for (const group of groups) {
            const foundQuestion = group.questions.find(
                (q) => q.bank_question_id === bankQuestionId,
            );
            if (foundQuestion) return group.id;
        }
        return null;
    }

    /**
     * 更新题组内的题目
     * @param {string|number} groupId - 题组ID
     * @param {Object} newQuestionData - 新的题目数据
     * @param {number} newQuestionData.id - 题目ID
     * @param {string} [newQuestionData.content] - 题目内容
     * @param {string} [newQuestionData.type] - 题目类型
     * @param {Array<Option>} [newQuestionData.options] - 题目选项
     * @param {Array<any>} [newQuestionData.answers] - 题目答案
     * @param {string} [newQuestionData.analysis] - 题目解析
     * @param {number} [newQuestionData.difficulty] - 题目难度
     * @param {Array<string>} [newQuestionData.tags] - 题目标签
     */
    function updateQuestionInGroup(groupId, newQuestionData) {
        const groupIndex = groups.findIndex((g) => g.id === groupId);
        if (groupIndex === -1) return;
        
        // 替换题组内的旧题目(现在要将题库题目转试卷题目)
        groups[groupIndex].questions = groups[groupIndex].questions.map((q) => {
            if (q.bank_question_id === newQuestionData.id) {
                // 创建一个新对象，保留原有字段
                const updatedQuestion = { ...q };
                
                // 只更新newQuestionData中存在的字段
                if (newQuestionData.content !== undefined) updatedQuestion.content = newQuestionData.content;
                if (newQuestionData.type !== undefined) updatedQuestion.type = newQuestionData.type;
                if (newQuestionData.options !== undefined) updatedQuestion.options = newQuestionData.options;
                if (newQuestionData.answers !== undefined) updatedQuestion.answers = newQuestionData.answers;
                if (newQuestionData.analysis !== undefined) updatedQuestion.analysis = newQuestionData.analysis;
                if (newQuestionData.difficulty !== undefined) updatedQuestion.difficulty = newQuestionData.difficulty;
                if (newQuestionData.tags !== undefined) updatedQuestion.tags = newQuestionData.tags;                
                return updatedQuestion;
            }
            return q;
        });
    }

    /**
     * @description 列表点击编辑
     * @param {PaperQuestion} paper_question
     */
    const onListTableClickEdit = async (paper_question) => {
        if (request_lock) {
            bubble_message_componet?.showBubbleMessage(
                "warn",
                "不要点击太快，请先等待上一操作完成",
            );
            return;
        }
        // 将试卷题目转换为题库题目
        let question = {
            id: paper_question.bank_question_id,
            type: paper_question.type,
            difficulty: paper_question.difficulty,
            content: paper_question.content,
            tags: paper_question.tags,
            options: paper_question.options,
            answers: paper_question.answers,
            score: paper_question.score,
            analysis: paper_question.analysis,
        };
        // 取锁
        request_lock = true;
        let res = await getQuestionLock(question.id);
        request_lock = false;

        if (res.status !== 0) {
            if (res.msg.includes("HaveNoLock")) {
                showDialog({
                    content: "其他人正在编辑题目，请稍后再试",
                    type: "warning",
                    title: "编辑冲突"
                });
            } else {
                showDialog({
                    content: "获取题目锁失败：" + res.msg,
                    type: "error",
                    title: "错误"
                });
            }
            modifying_question = null;
            return;
        }
        modifying_question = question;

        maintain_qusetion_lock_timer = setInterval(
            async () => {
                let res = await renewQuestionLock(question.id);
                if (res.status !== 0) {
                    clearInterval(maintain_qusetion_lock_timer);
                    action_toast.show("error", "维持题目锁失败：" + res.msg);
                }
            },
            1000 * 60 * 8,
        );
        switch (question.type) {
            case "00":
                single_select_edit_panel_componet.initPanel();
                show_single_select_edit_panel = true;
                break;
            case "02":
                mutiple_select_edit_panel_componet.initPanel();
                show_multiple_select_edit_panel = true;
                break;
            case "04":
                judge_edit_panel_componet.initPanel();
                show_judge_select_edit_panel = true;
                break;
            case "06":
                fill_bank_edit_panel_componet.initPanel();
                show_fill_bank_edit_panel = true;
                break;
            case "08":
                short_answer_edit_panel_componet.initPanel();
                show_short_answer_edit_panel = true;
                break;
            default:
                return;
        }
    };

    /**
     * @description 题目编辑取消
     */
    const onEditPanelCancel = async () => {
        if (modifying_question) {
            let res = await releaseQuestionLock(modifying_question.id);
            if (res.status !== 0) {
                action_toast?.show("error", "释放题目锁失败：" + res.msg);
            }
        }
        clearInterval(maintain_qusetion_lock_timer);

        show_single_select_edit_panel = false;
        show_multiple_select_edit_panel = false;
        show_judge_select_edit_panel = false;
        show_fill_bank_edit_panel = false;
        show_short_answer_edit_panel = false;
        modifying_question = null;
        new_question_type = "";
        is_dirty = false;
    };

    /**
     * @description 显示试卷被占用弹窗
     * @type {boolean}
     */
    let showLockDialog = $state(false);
</script>

<div class="paper-page">
    <div class="header-container">
        <TitleBar
            bind:paper_name={paper_info.name}
            importQuestion={handleOpenQuestionImportModal}
            save={handleSave}
            goHome={handleExit}
            expanded={expandingAllGroupsAndQuestions}
            collapse={collapseAllGroupsAndQuestions}
        />
    </div>
    <div class="paper-container">
        <div class="paper-sidebar">
            <PaperInfoPanel bind:paper_info {action_toast} />
            <QuestionGroupList bind:groups {scrollToGroup} {deleteGroup} />
        </div>
        <div class="paper-content">
            <div class="scrollable-content">
                {#if groups.length === 0}
                    <div class="no-group-selected">
                        请添加题组或从题库导入题目
                    </div>
                {:else}
                    {#each groups as group, index}
                        <GroupPanel
                            bind:group={groups[index]}
                            crossGroupDrop={handleCrossGroupDrop}
                            {isNameUnique}
                            {onListTableClickEdit}
                            {updateGroupScorePerQuestion}
                            openQuestionImportModal={handleOpenQuestionImportModal}
                        ></GroupPanel>
                    {/each}
                {/if}
            </div>
        </div>
    </div>
</div>

<!--题目导入模态框-->
<QuestionImportModal
    bind:is_open={importModalOpen}
    bind:groups
    bind:selected_group
    {action_toast}
    {updateGroupScorePerQuestion}
/>

<Dialog
    bind:isOpen={dialogState.isOpen}
    title={dialogState.title}
    content={dialogState.content}
    width={dialogState.width}
    showFooter={dialogState.showFooter}
    confirmText={dialogState.confirmText}
    cancelText={dialogState.cancelText}
    confirmTextBackgroundColor={dialogState.confirmBackgroundColor}
    onClose={async () => {
        await handleDialogClose();
    }}
    onConfirm={async () => {
        await handleDialogConfirm();
    }}
    onCancel={async () => {
        await handleDialogCancel();
    }}
></Dialog>

<!--操作提示-->
<ActionToast isShow={action_toast_open} bind:this={action_toast} />

<SingleSelectEditPanel
    bind:this={single_select_edit_panel_componet}
    show={show_single_select_edit_panel}
    question_data={modifying_question !== null ? modifying_question : undefined}
    is_new_question={new_question_type === "00"}
    onCancel={async () => {
        await onEditPanelCancel();
    }}
    onConfirm={async (new_question_data) => {
        show_single_select_edit_panel = false;
        await onEditPanelConFirm(new_question_data);
    }}
></SingleSelectEditPanel>

<MultipleSelectEditPanel
    bind:this={mutiple_select_edit_panel_componet}
    show={show_multiple_select_edit_panel}
    question_data={modifying_question !== null ? modifying_question : undefined}
    is_new_question={new_question_type === "02"}
    onCancel={async () => {
        await onEditPanelCancel();
    }}
    onConfirm={async (new_question_data) => {
        show_multiple_select_edit_panel = false;
        await onEditPanelConFirm(new_question_data);
    }}
></MultipleSelectEditPanel>

<JudgeSelectEditPanel
    bind:this={judge_edit_panel_componet}
    show={show_judge_select_edit_panel}
    question_data={modifying_question !== null ? modifying_question : undefined}
    is_new_question={new_question_type === "04"}
    onCancel={async () => {
        await onEditPanelCancel();
    }}
    onConfirm={async (new_question_data) => {
        show_judge_select_edit_panel = false;
        await onEditPanelConFirm(new_question_data);
    }}
></JudgeSelectEditPanel>

<FillBlankEditPanel
    bind:this={fill_bank_edit_panel_componet}
    show={show_fill_bank_edit_panel}
    question_data={modifying_question !== null ? modifying_question : undefined}
    is_new_question={new_question_type === "06"}
    onCancel={async () => {
        await onEditPanelCancel();
    }}
    onConfirm={async (new_question_data) => {
        show_fill_bank_edit_panel = false;
        await onEditPanelConFirm(new_question_data);
    }}
></FillBlankEditPanel>

<ShortAnswerEditPanel
    bind:this={short_answer_edit_panel_componet}
    show={show_short_answer_edit_panel}
    question_data={modifying_question !== null ? modifying_question : undefined}
    is_new_question={new_question_type === "08"}
    onCancel={async () => {
        await onEditPanelCancel();
    }}
    onConfirm={async (new_question_data) => {
        show_short_answer_edit_panel = false;
        await onEditPanelConFirm(new_question_data);
    }}
></ShortAnswerEditPanel>

{#if showLockDialog}
    <div class="modal-mask"></div>
    <div class="modal">
        <div class="modal-title">试卷被占用</div>
        <div class="modal-content">
            当前试卷正在被其他用户编辑，请稍后再试。
        </div>
        <button class="btn" onclick={handleExit}>返回首页</button>
    </div>
{/if}

<style lang="scss" scoped>
    .paper-page {
        display: flex;
        flex-direction: column;
        background-color: #f5f5f5;
        height: 100%;
        width: 100%;
        overflow: auto;
    }

    /* 顶部导航和标题栏容器 */
    .header-container {
        display: flex;
        flex-direction: column;
        flex-grow: 1;
        width: 100%;
        background-color: #ffffff;
    }

    .paper-container {
        flex-grow: 0;
        display: flex;
        width: 100%;
    }

    .paper-sidebar {
        min-width: 400px;
        max-width: 500px;
        background-color: #fff;
        padding: 10px;
    }

    /* 主内容区 */
    .paper-content {
        min-width: 800px;
        flex-grow: 1;
        background-color: #ffffff;
        box-sizing: border-box;
        border-radius: var(--border-radius-md);
        padding: 20px;
        max-width: 100%;
        width: 0;
    }

    /* 可滚动的内容区域 */
    .scrollable-content {
        max-height: 900px;
        scrollbar-width: none;
        overflow: auto;
    }

    /* 未选择题组提示 */
    .no-group-selected {
        padding: 40px;
        text-align: center;
        color: rgba(0, 0, 0, 0.45);
        font-size: 16px;
        background-color: #f9f9f9;
        border: 1px dashed var(--border-light);
        border-radius: var(--border-radius-md);
        margin-top: 20px;
    }

    .modal-mask {
        position: fixed;
        left: 0;
        top: 0;
        right: 0;
        bottom: 0;
        background: rgba(0, 0, 0, 0.3);
        z-index: 1000;
    }
    .modal {
        position: fixed;
        left: 50%;
        top: 50%;
        transform: translate(-50%, -50%);
        background: #fff;
        padding: 32px 24px;
        border-radius: var(--border-radius-md);
        z-index: 1001;
        min-width: 300px;
        text-align: center;
    }
    .modal-title {
        font-size: 20px;
        font-weight: bold;
        margin-bottom: 16px;
    }
    .modal-content {
        margin-bottom: 24px;
    }
    .btn {
        padding: 8px 24px;
        border-radius: var(--btn-border-radius);
        background: var(--blue);
        color: #fff;
        border: none;
    }
</style>
