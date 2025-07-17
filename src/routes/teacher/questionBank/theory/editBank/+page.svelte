<!--
 * @Author: MIOZD && l317101@163.com
 * @Date: 2025-04-08 10:51:51
 * @LastEditors: MIOZD && l317101@163.com
 * @LastEditTime: 2025-06-04 23:15:03
 * @FilePath: \tutorial-platform-fe\src\routes\teacher\questionBank\theory\editBank\+page.svelte
 * @Description: 理论题库编辑页
 * @
-->

<script>
    import BankTag from "$lib/component/EditableTag.svelte";
    import FilterBar from "$lib/component/FilterBarForQuestionBank.svelte";
    import Dropdown from "$lib/component/DropDownForQuesitonBank.svelte";
    import ListTable from "$lib/component/ListTableForQuestionBank.svelte";
    import SingleSelectEditPanel from "$lib/component/QuestionEditPanel/singleSelect.svelte";
    import MultipleSelectEditPanel from "$lib/component/QuestionEditPanel/multipleSelect.svelte";
    import JudgeSelectEditPanel from "$lib/component/QuestionEditPanel/judgeSelect.svelte";
    import FillBlankEditPanel from "$lib/component/QuestionEditPanel/fillBlank.svelte";
    import ShortAnswerEditPanel from "$lib/component/QuestionEditPanel/shortAnswer.svelte";
    import BubbleMessageComponet from "$lib/component/BubbleMessageToast.svelte";
    import QuestionPreviewPanel from "$lib/component/QuestionPreviewPanelForQuestionBank.svelte";
    import { onMount } from "svelte";

    import { formatTimestamp } from "$lib/common/time_utils";
    import { TheoryQuestion } from "../types";
    import {
        updateBankData,
        addNewTheoryQuestion,
        deleteTheoryQuestion,
        getBankWithQuestions,
        getQuestionLock,
        releaseQuestionLock,
        renewQuestionLock,
        getBankData,
    } from "../api";

    import { goto } from "$app/navigation";
    import {
        compareBankMsg,
        getQuestionFilesPath,
        validateTheoryQuestion,
    } from "../utils";
    import {
        AddOrUpdateQuestion,
        CopyToClipboard,
        onQuestinConfirm,
        PasteQuestion,
        showQuestionBankLogs,
    } from "../sharingFuncs";
    import OperationLogForQuestionBank from "$lib/component/OperationLogPanel.svelte";
    import QuestionBankSharePanel from "../../QuestionBankSharePanel.svelte";
    import Dialog from "$lib/component/Dialog.svelte";
    import BatchImportQuestionPanel from "$lib/component/BatchImport/BatchImportQuestionPanel.svelte";

    /**
     * @description ICON集合
     */
    const ICON = {
        rollback: "/theory_question_bank/icons/rollback.svg",

        edit: "/theory_question_bank/icons/edit.svg",
        compelete: "/theory_question_bank/icons/compelete.svg",
        Xacross: "/theory_question_bank/icons/Xacross.svg",

        bankTag: "/theory_question_bank/icons/bankTag.svg",

        checkbox_slected: "/theory_question_bank/icons/checkbox_selected.svg",
        checkbox_unselected:
            "/theory_question_bank/icons/checkbox_unselected.svg",
    };

    /**
     * @description 题库是否有未提交的修改
     */
    let is_dirty = false;

    /*============ 题库数据部分 ============*/
    /**
     * @description 题目id
     * @type {number}
     */
    let bank_id = $state(0);

    /**
     * @description 题库更新时间
     */
    let bank_update_time = $state("2025-04-01 10:51:51");

    /**
     * @description 题库创建时间
     */
    let bank_create_time = $state("2025-04-01 10:51:51");

    /**
     * @description 题库名称
     * @type {string}
     */
    let bank_name = $state("");

    /**
     * @description 题库创建者ID
     * @type {number}
     */
    let bank_creator_id = $state(0);

    /**
     * @description 题库访问模式
     * @type {"00"|"02"|"04"}
     */
    let bank_access_mode = $state("00");

    /**
     * @description 题库名称输入框
     * @type {HTMLInputElement}
     */
    let bank_name_input;

    /**
     * @description 清空题库名称输入框按钮
     * @type {HTMLButtonElement}
     */
    let clean_bank_input_btn;

    /**
     * @description 题库数据保存定时器
     * @type { NodeJS.Timeout}
     */
    let bank_data_save_timer;

    /**
     * @description 题库标签输入框内容
     * @type {string}
     */
    let tag_content = $state("");

    /**
     * @description 题库标签列表
     * @type {string[]}
     */
    let bank_tags = $state([]);

    /**
     * @description 题库修改保存按钮
     * @type {HTMLButtonElement|undefined}
     */
    let bank_data_save_btn = $state();

    /**
     * @description 题库修改不保存按钮
     * @type {HTMLButtonElement|undefined}
     */
    let bank_data_not_save_btn = $state();

    /**
     * @description 题库原始数据
     * @type {{
     *   name: string,
     *   tags: string[],
     * }}
     */
    let origin_bank_data = {
        name: "",
        tags: [],
    };

    /**
     * @description 题库数据变更处理
     */
    const onQuestionBankDataChange = () => {
        let compare_res = compareBankMsg(origin_bank_data, {
            name: bank_name,
            tags: bank_tags,
        });

        if (compare_res) {
            is_dirty = false;
            if (!bank_data_save_btn || !bank_data_not_save_btn) return;

            bank_data_save_btn.style.visibility = "hidden";
            bank_data_save_btn.style.opacity = "0";
            bank_data_not_save_btn.style.visibility = "hidden";
            bank_data_not_save_btn.style.opacity = "0";
            return;
        }

        is_dirty = true;
        if (!bank_data_save_btn || !bank_data_not_save_btn) return;

        bank_data_save_btn.style.visibility = "visible";
        bank_data_save_btn.style.opacity = "1";
        bank_data_not_save_btn.style.visibility = "visible";
        bank_data_not_save_btn.style.opacity = "1";
    };

    /**
     * @description 清空题库名称输入框
     */
    const onCleanBankNameInput = () => {
        if (bank_name_input) {
            bank_name_input.value = "";
            clean_bank_input_btn.style.visibility = "hidden";
        }
    };

    /**
     * @description 题库标签变更
     * @param {string} old_content
     * @param {string} new_content
     */
    const addNewBankTag = (old_content, new_content) => {
        const value = new_content.trim();
        if (value === "") return;
        if (bank_tags.includes(value)) {
            tag_content = "";
            return;
        }

        bank_tags = [value, ...bank_tags];
        tag_content = "";

        onQuestionBankDataChange();
    };

    /**
     * @description 删除tag
     * @param {string} tagText
     */
    const onDeleteTag = async (tagText) => {
        let new_tags = JSON.parse(JSON.stringify(bank_tags));
        const index = new_tags.indexOf(tagText);
        if (index !== -1) {
            new_tags.splice(index, 1);
        }
        bank_tags = [...new_tags];

        onQuestionBankDataChange();
    };
    /**
     * @description 已有标签变更
     * @param {string} old_content
     * @param {string} new_content
     * @param {number} index
     */
    const onSaveBankTagChange = (old_content, new_content, index) => {
        const value = new_content.trim();

        if (value === "") return;

        let new_tags = JSON.parse(JSON.stringify(bank_tags));
        new_tags[index] = value;
        bank_tags = [...new_tags];

        onQuestionBankDataChange();
    };

    /**
     * @description 题库数据校验
     */
    const onConfirmUpdateQuestionBankData = async () => {
        request_lock = true;
        let res = await getBankData(bank_id);
        request_lock = false;
        if (res.status !== 0) {
            let show_message;
            switch (res.msg) {
                case "QuestionBankAlreadyExists":
                    show_message = "题库已存在";
                    break;
                case "QuestionBankNotExist":
                    show_message = "题库不存在";
                    break;
                case "ErrForbidden":
                    show_message = "无权操作";
                    break;
                case "ErrUserNotExist":
                    show_message = "用户不存在";
                    break;
                case "QuestionNotExist":
                    show_message = "题目不存在";
                    break;
                case "QuestionBankIDRequired":
                    show_message = "题库ID不能为空";
                    break;
                case "QuestionIDRequired":
                    show_message = "题目ID不能为空";
                    break;
                default:
                    show_message = res.msg;
                    break;
            }
            bubble_message_componet?.show(
                "error",
                "确认题库数据失败: " + show_message,
            );
            return;
        }

        let server_bank_update_time_str = formatTimestamp(
            res.data.bank.update_time,
        );

        if (server_bank_update_time_str !== $state.snapshot(bank_update_time)) {
            showDialog("题库数据已被其他人修改，是否覆盖?");
            dialog_on_confirm = async () => {
                await onUpdateQuestionBankData();
                show_dialog = false;
            };

            dialog_on_cancel = async () => {
                show_dialog = false;
                if (!bank_data_save_btn || !bank_data_not_save_btn) return;
                bank_data_save_btn.style.visibility = "visible";
                bank_data_save_btn.style.opacity = "1";
                bank_data_not_save_btn.style.visibility = "visible";
                bank_data_not_save_btn.style.opacity = "1";
            };
            is_dirty = false;
            return;
        }

        await onUpdateQuestionBankData();
    };

    /**
     * @description 题库数据保存
     */
    const onUpdateQuestionBankData = async () => {
        if (request_lock) {
            bubble_message_componet?.show(
                "warn",
                "不要点击太快，请先等待上一操作完成",
            );
            return;
        }

        bubble_message_componet?.show(
            "info",
            "正在保存题库数据，请稍候...",
        );

        if (!(!bank_data_save_btn || !bank_data_not_save_btn)) {
            bank_data_save_btn.style.visibility = "hidden";
            bank_data_save_btn.style.opacity = "0";
            bank_data_not_save_btn.style.visibility = "hidden";
            bank_data_not_save_btn.style.opacity = "0";
        }
        is_dirty = true;
        clearTimeout(bank_data_save_timer);
        bank_data_save_timer = setTimeout(async () => {
            /**
             * @type {{
             *      id: number,
             *      type: string,
             *      name?: string,
             *      tags?: string[],
             *}}
             */
            let update_fileds = {
                id: bank_id,
                type: "00",
            };
            if (bank_name !== origin_bank_data.name) {
                update_fileds.name = bank_name;
            }
            if (bank_tags.length !== origin_bank_data.tags.length) {
                update_fileds.tags = bank_tags;
            } else {
                let tags_equal =
                    bank_tags.length === origin_bank_data.tags.length &&
                    bank_tags.every((value, index) => {
                        return value === origin_bank_data.tags[index];
                    });
                if (!tags_equal) {
                    update_fileds.tags = bank_tags;
                }
            }

            request_lock = true;
            const res = await updateBankData(update_fileds);
            request_lock = false;
            if (res.status !== 0) {
                let show_message;
                switch (res.msg) {
                    case "QuestionBankAlreadyExists":
                        show_message = "题库已存在";
                        break;
                    case "QuestionBankNotExist":
                        show_message = "题库不存在";
                        break;
                    case "ErrForbidden":
                        show_message = "无权操作";
                        break;
                    case "ErrUserNotExist":
                        show_message = "用户不存在";
                        break;
                    case "QuestionNotExist":
                        show_message = "题目不存在";
                        break;
                    default:
                        show_message = res.msg;
                        break;
                }
                bubble_message_componet?.show(
                    "error",
                    "题库更新失败: " + show_message,
                );

                is_dirty = false;
                if (!bank_data_save_btn || !bank_data_not_save_btn) return;
                bank_data_save_btn.style.visibility = "visible";
                bank_data_save_btn.style.opacity = "1";
                bank_data_not_save_btn.style.visibility = "visible";
                bank_data_not_save_btn.style.opacity = "1";
                return;
            }
            bank_update_time = formatTimestamp(new Date().getTime());

            origin_bank_data = {
                name: $state.snapshot(bank_name),
                tags: $state.snapshot(bank_tags),
            };

            bubble_message_componet?.show(
                "success",
                "题库更新成功",
            );
            is_dirty = false;

            if (!bank_data_save_btn || !bank_data_not_save_btn) return;

            bank_data_save_btn.style.visibility = "hidden";
            bank_data_save_btn.style.opacity = "0";
            bank_data_not_save_btn.style.visibility = "hidden";
            bank_data_not_save_btn.style.opacity = "0";
        }, 800);
    };

    /**
     * @description 题库数据不保存
     */
    const onGiveUpQuestionBankDataUpdate = () => {
        is_dirty = false;
        bank_name = JSON.parse(JSON.stringify(origin_bank_data.name));
        bank_tags = JSON.parse(JSON.stringify(origin_bank_data.tags));

        if (!bank_data_save_btn || !bank_data_not_save_btn) return;

        bank_data_save_btn.style.visibility = "hidden";
        bank_data_save_btn.style.opacity = "0";
        bank_data_not_save_btn.style.visibility = "hidden";
        bank_data_not_save_btn.style.opacity = "0";
    };

    /*============ 题目数据部分 ============*/
    /**
     * @description 题目数据
     * @type {TheoryQuestion[]}
     */
    let questions = $state([]);

    /**
     * @description 题目数量
     * @type {number}
     */
    let question_count = $derived(questions.length);

    /**
     * @description 题目类型筛选条件
     * @type {Array<string>}
     */
    let question_type_fileter = $state([]);

    /**
     * @description 题目难度筛选条件
     * @type {Array<number>}
     */
    let question_difficulty_fileter = $state([]);

    /**
     * @description 题目标签
     * @type {Array<string>}
     */
    let all_question_tags = $derived.by(() => {
        /**
         * @type {Array<string>}
         */
        let question_tags = [];
        questions.forEach((item) => {
            if (item.tags) {
                item.tags.forEach(
                    /**
                     * @param tag {string}
                     */
                    (tag) => {
                        if (!question_tags.includes(tag)) {
                            question_tags.push(tag);
                        }
                    },
                );
            }
        });
        return question_tags;
    });

    /**
     * @description 题目标签筛选条件
     * @type {Array<string>}
     */
    let question_tag_fileter = $state([]);

    /**
     * @description 筛选条件集合
     */
    let filter_conditions = $derived.by(() => {
        return {
            type: question_type_fileter,
            difficulty: question_difficulty_fileter,
            tags: question_tag_fileter,
        };
    });

    /**
     * @description 搜索文本
     * @type {string}
     */
    let search_question_content = $state("");

    /**
     * @description 搜索框抖动定时器
     * @type {NodeJS.Timeout}
     */
    let search_timer;

    /**
     * @description 符合筛选条件的题目数量
     */
    let question_filtered_count = $state(0);

    /**
     * @description 题目类型
     */
    let question_types = $state([
        {
            value: "00",
            label: "单选",
        },
        {
            value: "02",
            label: "多选",
        },
        {
            value: "04",
            label: "判断",
        },
        {
            value: "06",
            label: "填空",
        },
        {
            value: "08",
            label: "简答",
        },
    ]);

    /**
     * @description 题目类型映射
     */
    let question_types_map = $derived.by(() => {
        return new Map(question_types.map((item) => [item.value, item.label]));
    });

    /**
     * @description 待编辑题目内容
     * @type {TheoryQuestion | null}
     */
    let modifying_question = $state(null);

    /**
     * @description 维持题目锁定时器
     * @type {NodeJS.Timeout}
     */
    let maintain_qusetion_lock_timer;

    /**
     * @description 新建题目类型
     * @type {"00"|"02"|"04"|"06"|"08"|""}
     */
    let new_question_type = $state("");

    /**
     * @description 题目列表组件
     * @type {ListTable}
     */
    let list_table_component;

    /**
     * @description 题库日志面板
     * @type {OperationLogForQuestionBank}
     */
    let operation_log_panel_componet;

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
     * @description 题目编辑确认
     * @param {Partial<TheoryQuestion>} new_question_data
     */
    const onEditPanelConFirm = async (new_question_data) => {
        let is_new_question = !(
            new_question_type === "" && modifying_question !== null
        );
        is_dirty = true;
        let handled_question_data = await onQuestinConfirm(
            new_question_data,
            modifying_question,
            bubble_message_componet,
            bank_id,
            is_new_question,
        );

        if (handled_question_data !== null) {
            if (is_new_question) {
                questions.unshift(handled_question_data);
            } else {
                const index = questions.findIndex((q) => {
                    if (modifying_question === null) {
                        bubble_message_componet?.show(
                            "error",
                            "题目数据错误",
                        );
                        return;
                    }
                    return q.id === modifying_question.id;
                });
                if (index != -1) {
                    questions[index] = handled_question_data;
                }
            }

            bank_update_time = formatTimestamp(new Date().getTime());
            list_table_component.updateData();
            list_table_component.updateFilteredQuestion(
                filter_conditions,
                search_question_content,
            );
        }

        if (modifying_question) {
            let res = await releaseQuestionLock(modifying_question.id);
            if (res.status !== 0) {
                bubble_message_componet?.show(
                    "error",
                    "释放题目锁失败：" + res.msg,
                );
                // 释放题目锁失败，也要清除计时器，避免无法释放锁
                clearInterval(maintain_qusetion_lock_timer);
            }
        }
        clearInterval(maintain_qusetion_lock_timer);

        modifying_question = null;
        new_question_type = "";
        is_dirty = false;
    };

    /**
     * @description 题目编辑取消
     */
    const onEditPanelCancel = async () => {
        if (modifying_question) {
            let res = await releaseQuestionLock(modifying_question.id);
            if (res.status !== 0) {
                bubble_message_componet?.show(
                    "error",
                    "释放题目锁失败：" + res.msg,
                );
                // 释放题目锁失败，也要清除计时器，避免无法释放锁
                clearInterval(maintain_qusetion_lock_timer);
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

        // 复原
        dialog_on_close = async () => {
            show_dialog = false;
        };
    };

    /**
     * @description 请求锁
     */
    let request_lock = $state(false);

    onMount(async () => {
        let start = new Date().getTime();
        console.log("start loading ", start);

        if (localStorage) {
            let question_bank_data_json =
                localStorage.getItem("question_bank_data");
            if (question_bank_data_json) {
                let question_bank_data = JSON.parse(question_bank_data_json);
                bank_id = question_bank_data.id;
            }
        } else {
            bubble_message_componet?.show(
                "error",
                "无法获取题库数据",
            );
            return;
        }

        // 拉取题目列表
        request_lock = true;
        const res = await getBankWithQuestions(bank_id);
        request_lock = false;
        if (res.status !== 0) {
            let show_message;
            switch (res.msg) {
                case "QuestionBankAlreadyExists":
                    show_message = "题库已存在";
                    break;
                case "QuestionBankNotExist":
                    show_message = "题库不存在";
                    break;
                case "ErrForbidden":
                    show_message = "无权操作";
                    break;
                case "ErrUserNotExist":
                    show_message = "用户不存在";
                    break;
                case "QuestionNotExist":
                    show_message = "题目不存在";
                    break;
                case "QuestionBankIDRequired":
                    show_message = "题库ID不能为空";
                    break;
                case "QuestionIDRequired":
                    show_message = "题目ID不能为空";
                    break;
                default:
                    show_message = res.msg;
                    break;
            }
            bubble_message_componet?.show(
                "error",
                "获取题目列表失败: " + show_message,
            );
            return;
        }

        if (
            res.data.question_list instanceof Array === false ||
            (res.data.question_list &&
                res.data.question_list instanceof Array &&
                res.data.question_list.length > 0 &&
                res.data.question_list[0].update_time === undefined)
        ) {
            throw new Error("question data format error");
        }

        if (res.data.bank.id !== bank_id) {
            bubble_message_componet?.show(
                "error",
                "题库数据不一致，请重新加载",
            );
            return;
        } else if (!res.data.bank.name || res.data.bank.name == "") {
            bubble_message_componet?.show(
                "error",
                "题库名称不一致，请重新加载",
            );
            return;
        } else if (res.data.bank.tags && res.data.bank.tags.length > 0) {
            let tags = res.data.bank.tags;
            for (let i = 0; i < tags.length; i++) {
                if (tags[i] === "") {
                    bubble_message_componet?.show(
                        "error",
                        "题库标签有误，请重新加载",
                    );
                    return;
                }
            }
        }

        // 题库数据
        bank_name = res.data.bank.name;
        bank_tags = res.data.bank.tags || [];
        bank_update_time = formatTimestamp(res.data.bank.update_time);
        bank_create_time = formatTimestamp(res.data.bank.create_time);
        bank_creator_id = res.data.bank.creator;
        bank_access_mode = res.data.bank.access_mode;

        // 记录题库原始数据
        origin_bank_data = {
            name: $state.snapshot(bank_name),
            tags: $state.snapshot(bank_tags),
        };

        // 题目数据
        for (let i = 0; i < res.data.question_list.length; i++) {
            res.data.question_list[i].update_time_str = formatTimestamp(
                res.data.question_list[i].update_time,
            );
        }
        questions = res.data.question_list;

        console.log(questions)

        // 应用数据
        list_table_component.updateData();

        // 页面卸载检测
        window.addEventListener("beforeunload", (e) => {
            clearTimeout(search_timer);
            clearTimeout(bank_data_save_timer);
            clearInterval(maintain_qusetion_lock_timer);
            bubble_message_componet?.cleanMessageChan();
            if (is_dirty || request_lock) {
                e.preventDefault();
                e.returnValue = ""; // 必须设置，否则部分浏览器不生效
                return "未保存的更改将会丢失";
            }
        });

        bubble_message_componet?.show("info", "题目数据加载完毕");
    });

    /**
     * @description 筛选条件选择
     * @param {(string|number)[]} value
     * @param {string} condition
     */
    const filterConditionSelect = (value, condition) => {
        // 单线程JS可能更新不过来，故在此手动同步更新
        /**
         * @type {string[]}
         */
        let filter_string_value = [];
        /**
         * @type {number[]}
         */
        let filter_number_value = [];
        if (condition === "type" || condition === "tag") {
            filter_string_value = value.filter(
                (item) => typeof item === "string",
            );
        } else if (condition === "difficulty") {
            filter_number_value = value.filter(
                (item) => typeof item === "number",
            );
        }

        if (condition === "type") {
            question_type_fileter = filter_string_value;
        } else if (condition === "tag") {
            question_tag_fileter = filter_string_value;
        } else if (condition === "difficulty") {
            question_difficulty_fileter = filter_number_value;
        }

        filter_conditions = {
            type: question_type_fileter,
            difficulty: question_difficulty_fileter,
            tags: question_tag_fileter,
        };

        list_table_component.updateFilteredQuestion(
            filter_conditions,
            search_question_content,
        );
    };

    /**
     * @description 输入题目搜索关键字
     * @param {Event} e
     */
    const onSearchQuestionKeyInput = (e) => {
        if (
            e.target &&
            "value" in e.target &&
            typeof e.target.value === "string"
        ) {
            const value = e.target.value;
            clearTimeout(search_timer);
            // 抖动
            search_timer = setTimeout(() => {
                search_question_content = value;
                list_table_component.updateFilteredQuestion(
                    filter_conditions,
                    value,
                );
            }, 500);
        }
    };

    /**
     * @description 提示框是否显示
     * @type {boolean}
     */
    let show_dialog = $state(false);

    /**
     * @description 提示框内容
     * @type {string}
     */
    let dialog_content = $state("");

    /**
     * @description 显示提示框
     * @param {string} content
     */
    const showDialog = (content) => {
        dialog_content = content;
        show_dialog = true;
    };

    /**
     * @description 提示框确认按钮点击事件
     */
    let dialog_on_confirm = $state(async () => {
        show_dialog = false;
    });

    /**
     * @description 提示框取消按钮点击事件
     */
    let dialog_on_cancel = $state(async () => {
        show_dialog = false;
    });

    /**
     * @description 提示框关闭事件
     */
    let dialog_on_close = $state(async () => {
        show_dialog = false;
    });

    /**
     * @description 列表点击编辑
     * @param {TheoryQuestion} question
     */
    const onListTableClickEdit = async (question) => {
        if (request_lock) {
            bubble_message_componet?.show(
                "warn",
                "不要点击太快，请先等待上一操作完成",
            );
            return;
        }
        modifying_question = question;

        // 取锁
        request_lock = true;
        let res = await getQuestionLock(question.id);
        request_lock = false;

        if (res.status !== 0) {
            if (res.msg.includes("HaveNoLock")) {
                showDialog("其他人正在编辑题目，请稍后再试");
            } else {
                showDialog("获取题目锁失败：" + res.msg);
            }
            modifying_question = null;
            // 设置提示弹窗关闭回调方法
            dialog_on_close = onEditPanelCancel;
            return;
        }

        maintain_qusetion_lock_timer = setInterval(
            async () => {
                let res = await renewQuestionLock(question.id);
                if (res.status !== 0) {
                    clearInterval(maintain_qusetion_lock_timer);
                    bubble_message_componet?.show(
                        "error",
                        "维持题目锁失败：" + res.msg,
                    );
                    // 维持题目锁失败，也要清除计时器，避免无法释放锁
                    clearInterval(maintain_qusetion_lock_timer);
                }
            },
            1000 * 60 * 8,
        );

        is_dirty = true;
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
     * @description 显示复制题目到题库面板
     */
    let show_copy_panel = $state(false);

    /**
     * @description 复制题目框JSON值
     */
    let copy_question_json = $state("");

    /**
     * @description 复制题目到题库
     * @param {string} question_json
     */
    const onPasteQuestion = async (question_json) => {
        try {
            if (request_lock) {
                bubble_message_componet?.show(
                    "warn",
                    "不要点击太快，请先等待上一操作完成",
                );
                return;
            }

            request_lock = true;
            let new_question_data = await PasteQuestion(
                question_json,
                bank_id,
                bubble_message_componet,
            );
            request_lock = false;

            bank_update_time = formatTimestamp(new Date().getTime());

            if (new_question_data) {
                questions.unshift(new_question_data);

                list_table_component.updateData();
                list_table_component.updateFilteredQuestion(
                    filter_conditions,
                    search_question_content,
                );
            }
        } catch (e) {
            bubble_message_componet?.show(
                "error",
                "解析失败:" + e,
            );
            return;
        }
    };

    /**
     * @description 列表点击复制
     * @param {TheoryQuestion} question
     */
    const onListTableClickCopy = (question) => {
        is_dirty = true;
        CopyToClipboard(question, bubble_message_componet);
        is_dirty = false;
    };

    /**
     * @description 列表点击删除
     * @param {TheoryQuestion} question
     */
    const onListTableClickDel = async (question) => {
        if (request_lock) {
            bubble_message_componet?.show(
                "warn",
                "不要点击太快，请先等待上一操作完成",
            );
            return;
        }

        // 取锁
        request_lock = true;
        let res = await getQuestionLock(question.id);
        request_lock = false;
        if (res.status !== 0) {
            if (res.msg.includes("HaveNoLock")) {
                showDialog("其他人正在编辑题目，请稍后再试");
            } else {
                showDialog("获取题目锁失败：" + res.msg);
            }
            return;
        }

        is_dirty = true;
        request_lock = true;
        res = await deleteTheoryQuestion(bank_id, [question.id]);
        request_lock = false;
        if (res.status !== 0) {
            let show_message;
            switch (res.msg) {
                case "QuestionBankAlreadyExists":
                    show_message = "题库已存在";
                    break;
                case "QuestionBankNotExist":
                    show_message = "题库不存在";
                    break;
                case "ErrForbidden":
                    show_message = "无权操作";
                    break;
                case "ErrUserNotExist":
                    show_message = "用户不存在";
                    break;
                case "QuestionNotExist":
                    show_message = "题目不存在";
                    break;
                case "QuestionBankIDRequired":
                    show_message = "题库ID不能为空";
                    break;
                case "QuestionIDRequired":
                    show_message = "题目ID不能为空";
                    break;
                default:
                    show_message = res.msg;
                    break;
            }
            bubble_message_componet?.show(
                "error",
                "删除题目失败: " + show_message,
            );
            is_dirty = false;
            return;
        }
        bank_update_time = formatTimestamp(new Date().getTime());

        const index = questions.findIndex((q) => q.id === question.id);
        if (index != -1) {
            questions.splice(index, 1);
            list_table_component.updateData();
        }
        bubble_message_componet?.show("success", "删除题目成功");
        is_dirty = false;
    };

    /**
     * @description 打开添加新题目面板
     * @param {string} value
     */
    const onAddNewQuestion = (value) => {
        if (request_lock) {
            bubble_message_componet?.show(
                "warn",
                "不要点击太快，请先等待上一操作完成",
            );
            return;
        }
        if (
            value !== "00" &&
            value !== "02" &&
            value !== "04" &&
            value !== "06" &&
            value !== "08"
        ) {
            return;
        }

        new_question_type = value;
        modifying_question = null;
        is_dirty = true;
        switch (value) {
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

    let batchImportPanel
    const onClickImportQuestion = async () => {
        batchImportPanel.showPanel()
    };

    const onQuestionsImported = async (imported_questions) => {
        if (!imported_questions || imported_questions.length === 0) {
            bubble_message_componet?.show(
                "warn",
                "没有导入任何题目",
            );
            return;
        }
        console.log(imported_questions)

        questions.unshift(...imported_questions)

        // for (const question of imported_questions) {
        //
        // }

        bank_update_time = formatTimestamp(new Date().getTime());
        list_table_component.updateData();
        list_table_component.updateFilteredQuestion(
          filter_conditions,
          search_question_content,
        );

        bubble_message_componet?.show(
          "success",
          "导入题目成功",
        );

        // for (const question of questions) {
        //     await AddOrUpdateQuestion(question, null, bubble_message_componet, bank_id, true);
        // }

    };

    /**
     * @description 返回题库列表页
     */
    const onGoBackToQuestionBankList = () => {
        // window.location.href = "/teacher/questionBank/theory";
        goto("/teacher/questionBank/theory");
    };

    /**
     * @description 预览面板显示
     * @type {boolean}
     */
    let show_preview_panel = $state(false);

    /**
     * @description 预览面板数据
     * @type {TheoryQuestion}
     */
    let preview_question_data = $state({
        id: 0,
        content: "",
        type: "",
        options: [],
        answers: [],
        analysis: "",
        difficulty: 1,
        tags: [],
        update_time: new Date().getTime(),
        update_time_str: "",
        score: 0,
        question_attachments_path: [],
        belong_to:0
    });

    /**
     * @description 关闭预览面板
     */
    const onClosePrviewPanel = () => {
        show_preview_panel = false;
    };

    /**
     * @description 消息提示组件
     * @type {BubbleMessageComponet|undefined}
     */
    let bubble_message_componet;

    /**
     * @description 题库分享面板是否显示
     * @type {boolean}
     */
    let show_share_panel = $state(false);
</script>

<div
    class="questionPrviewPanel"
    style:transform={show_preview_panel
        ? "translate(0, -50%)"
        : "translate(calc(100% + 30px), -50%)"}
>
    <QuestionPreviewPanel
        question={preview_question_data}
        closePanel={onClosePrviewPanel}
    ></QuestionPreviewPanel>
</div>

<BubbleMessageComponet bind:this={bubble_message_componet}></BubbleMessageComponet>

<div class="pageContainer">
    <!-- 回退栏 -->
    <div class="rollbackBar">
        <button class="rollbackContainer" onclick={onGoBackToQuestionBankList}>
            <svg
                class="rollbankImg"
                version="1.1"
                xmlns:xlink="http://www.w3.org/1999/xlink"
                width="31px"
                height="29px"
                xmlns="http://www.w3.org/2000/svg"
            >
                <g transform="matrix(1 0 0 1 -50 -10 )">
                    <path
                        d="M 5.26328055923079 7.25009103583336  L 9.18942268999992 3.27117873333336  L 7.50324543692308 1.56233725166668  L 1.54170668923081 7.60400370083331  C 1.07608146692313 8.07588713333335  1.07608144307696 8.84096148416668  1.54170654615377 9.31284503750001  L 7.50324543692308 15.3545115108333  L 9.18942268999992 13.645670585  L 5.26328055923079 10  L 19.0771026384617 10  C 23.0280638461538 9.66675770250003  26.2309487923078 12.9126923466667  26.2309487923078 16.9167577025  C 26.2309487923078 20.9208230583334  23.0280638461538 24.1667587416667  19.0771026384617 24  L 7.15402638307703 24  L 7.15402638307703 26.5834254083334  L 19.0771026384617 26.5834254083334  C 24.3450492461539 26.5834254083334  28.6155641769232 22.255509875  28.6155641769232 16.9167577025  C 28.6155641769232 11.5780054333334  24.3450492461539 7.25009103583336  19.0771026384617 7.25009103583336  L 5.26328055923079 7.25009103583336  Z "
                        fill-rule="nonzero"
                        fill="#000000"
                        stroke="none"
                        fill-opacity="0.996078431372549"
                        transform="matrix(1 0 0 1 50 10 )"
                    />
                </g>
            </svg>
            <span class="rollbackText">返回题库列表</span>
        </button>
    </div>

    <!-- 题库信息栏 -->
    <div class="bankMsgBar">
        <div class="leftColorBlock"></div>
        <div class="contentContainer">
            <div class="leftContent">
                <div class="bankNameContainer">
                    <img class="editImg" src={ICON.edit} alt="editImg" />
                    <div class="bankNameInputOutBorder">
                        <input
                            type="input"
                            class="bankNameInput"
                            placeholder="请输入题库名"
                            bind:this={bank_name_input}
                            bind:value={bank_name}
                            oninput={onQuestionBankDataChange}
                        />
                        <button
                            class="cleanBankNameInputBtn"
                            bind:this={clean_bank_input_btn}
                            onclick={onCleanBankNameInput}
                        >
                            <img
                                class="cleanBankNameInputImg"
                                src={ICON.Xacross}
                                alt="cleanIputImg"
                            />
                        </button>
                    </div>
                    <button
                        class="saveBankDataUpdateBtn"
                        bind:this={bank_data_save_btn}
                        onclick={onConfirmUpdateQuestionBankData}
                        >保存修改</button
                    >
                    <button
                        class="giveUpBankDataUpdateBtn"
                        bind:this={bank_data_not_save_btn}
                        onclick={onGiveUpQuestionBankDataUpdate}
                        >放弃修改</button
                    >
                </div>

                <div class="bankTagContainer">
                    <img
                        class="bankTagImg"
                        src={ICON.bankTag}
                        alt="bankTagImg"
                    />
                    <div class="bankTags">
                        <BankTag
                            bind:content={tag_content}
                            handle_funcs={{
                                onchange: addNewBankTag,
                                delete: () => {
                                    tag_content = "";
                                },
                            }}
                        />
                        {#each bank_tags as tag, index}
                            <BankTag
                                content={tag}
                                handle_funcs={{
                                    onchange: (old_content, new_content) =>
                                        onSaveBankTagChange(
                                            old_content,
                                            new_content,
                                            index,
                                        ),
                                    delete: () => {
                                        onDeleteTag(tag);
                                    },
                                }}
                            />
                        {/each}
                    </div>
                </div>

                <div class="bankTimeContainer">
                    <span class="timeText">更新时间：{bank_update_time}</span>
                    <span class="timeText">创建时间：{bank_create_time}</span>
                </div>
            </div>
            <div class="rightContent">
                <button
                    class="normalBtn"
                    onclick={() => (show_share_panel = true)}
                >
                    <span>共享题库</span>
                </button>
                <button
                    class="normalBtn"
                    style="margin-right: 40px;margin-left:0px;"
                    onclick={async () => {
                        is_dirty = true;
                        request_lock = true;
                        await showQuestionBankLogs(
                            bank_id,
                            operation_log_panel_componet,
                            bubble_message_componet,
                        );
                        request_lock = false;
                        is_dirty = false;
                    }}
                >
                    <span>展示日志</span>
                </button>
                <div class="questionCountContainer">
                    <span class="questionCountText">题量总计</span>
                    <span class="questionCountNum">{question_count}</span>
                </div>
            </div>
        </div>
    </div>

    <!-- 题库内容栏 -->
    <div class="bankContent">
        <div class="quesionFilter">
            <div class="questionFilterTitle">
                <div class="colorHolder"></div>
                <div style="display: flex;">
                    <div class="leftColorBlock"></div>
                    <span class="questionFilterTitleText">试题筛选</span>
                </div>
            </div>

            <FilterBar
                filter_title="题型"
                all_filter_conditions={question_types}
                onSelectTag={(value) => filterConditionSelect(value, "type")}
            ></FilterBar>

            <FilterBar
                filter_title="难度"
                all_filter_conditions={[
                    {
                        value: 1,
                        label: "简单",
                    },
                    {
                        value: 2,
                        label: "中等",
                    },
                    {
                        value: 3,
                        label: "困难",
                    },
                ]}
                onSelectTag={(value) =>
                    filterConditionSelect(value, "difficulty")}
            ></FilterBar>

            <FilterBar
                filter_title="标签"
                all_filter_conditions={all_question_tags.map((tag) => {
                    return {
                        value: tag,
                        label: tag,
                    };
                })}
                onSelectTag={(value) => filterConditionSelect(value, "tag")}
            ></FilterBar>
        </div>

        <div class="questionListContainer">
            <div class="questionListTitle">
                <div class="leftColorBlock"></div>
                <span class="questionListTitleText">试题列表</span>
                <span style="margin-left:10px"
                    >共筛选{question_filtered_count}道题</span
                >
            </div>

            <div class="questionListControlBar">
                <div class="questionListSearch">
                    <span>搜索</span>
                    <input
                        type="text"
                        class="questionListSearchInput"
                        placeholder="请输入题目名称"
                        oninput={onSearchQuestionKeyInput}
                    />
                </div>

                <div class="questionListControlBtnContainer">
                    <button
                        class="questionListControlBtn normalBtn"
                        onclick={() => (show_copy_panel = true)}
                    >
                        <span>粘贴题目</span>
                    </button>

                    <Dropdown
                        options={question_types}
                        placeholder="添加题目"
                        selectOptionFunc={onAddNewQuestion}
                    ></Dropdown>

                    <button class="questionListControlBtn normalBtn" onclick={onClickImportQuestion}>
                        <span>批量导入</span>
                    </button>
                </div>
            </div>

            <ListTable
                bind:this={list_table_component}
                question_data={questions}
                question_types={question_types_map}
                onEdit={onListTableClickEdit}
                onCopy={onListTableClickCopy}
                onDelete={onListTableClickDel}
                update_filtered_question_count={(count) => {
                    question_filtered_count = count;
                }}
                onListItemClick={(question) => {
                    preview_question_data = question;
                    show_preview_panel = true;
                }}
            ></ListTable>
        </div>
    </div>

    <div class="modal" style="display: {show_copy_panel ? 'flex' : 'none'};">
        <div class="copyQuestionPanel">
            <textarea
                class="copyQuestionTextArea"
                placeholder="请粘贴题目JSON数据，一次一题"
                bind:value={copy_question_json}
            ></textarea>
            <div>
                <button
                    class="copyQuestionBtn"
                    onclick={() => {
                        show_copy_panel = false;
                        copy_question_json = "";
                    }}>取消</button
                >
                <button
                    class="copyQuestionBtn"
                    onclick={async () => {
                        show_copy_panel = false;
                        await onPasteQuestion(copy_question_json);
                        copy_question_json = "";
                    }}>确认</button
                >
            </div>
        </div>
    </div>

    <Dialog
        bind:isOpen={show_dialog}
        content={dialog_content}
        onClose={async () => {
            await dialog_on_close();
        }}
        onConfirm={async () => {
            await dialog_on_confirm();
        }}
        onCancel={async () => {
            await dialog_on_cancel();
        }}
    ></Dialog>

    <QuestionBankSharePanel
        bind:isOpen={show_share_panel}
        bank={{
            id: bank_id,
            name: bank_name,
            access_mode: bank_access_mode,
            creator: bank_creator_id,
        }}
        actionToast={bubble_message_componet}
    ></QuestionBankSharePanel>

    <OperationLogForQuestionBank bind:this={operation_log_panel_componet}
    ></OperationLogForQuestionBank>

    <SingleSelectEditPanel
        bind:this={single_select_edit_panel_componet}
        show={show_single_select_edit_panel}
        question_data={modifying_question !== null
            ? modifying_question
            : undefined}
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
        question_data={modifying_question !== null
            ? modifying_question
            : undefined}
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
        question_data={modifying_question !== null
            ? modifying_question
            : undefined}
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
        question_data={modifying_question !== null
            ? modifying_question
            : undefined}
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
        question_data={modifying_question !== null
            ? modifying_question
            : undefined}
        is_new_question={new_question_type === "08"}
        onCancel={async () => {
            await onEditPanelCancel();
        }}
        onConfirm={async (new_question_data) => {
            show_short_answer_edit_panel = false;
            await onEditPanelConFirm(new_question_data);
        }}
    ></ShortAnswerEditPanel>
</div>

<BatchImportQuestionPanel bind:this={batchImportPanel} bank_id={bank_id} onImported={onQuestionsImported}/>

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
        box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);

        &:focus {
            outline: none;
        }
    }

    span,
    input {
        font-family: PingFang FC;
    }

    .pageContainer {
        overflow: auto;
        height: 100%;
        display: flex;
        flex-direction: column;
        padding: 0px 30px 12px 30px;
        transition: all 0.2s ease;
        min-height: 0;

        .rollbackBar {
            margin-top: 10px;
            justify-content: flex-start;

            .rollbackContainer {
                display: flex;
                align-items: center;

                box-shadow: none;
            }
        }

        .bankMsgBar {
            display: flex;
            // height: 150px;
            min-width: 1000px;
            background-color: #fff;
            border-radius: 5px;
            flex-shrink: 0;
            overflow: hidden;

            margin-top: 10px;
            transition: all 0.2s ease;

            border-radius: 8px;
            box-shadow:
                0 2px 8px rgba(0, 0, 0, 0.08),
                0 1px 2px rgba(0, 0, 0, 0.04);
            border: 1px solid rgba(0, 0, 0, 0.12);
            transition:
                transform 0.2s,
                box-shadow 0.2s;

            .leftColorBlock {
                display: block;
                max-width: 12px;
                min-width: 12px;
                flex: 1;

                background-color: #0336ff;

                border-radius: 5px;
            }

            .contentContainer {
                display: flex;
                justify-content: space-between;
                flex: 1;
                margin-left: 50px;

                .bankNameContainer {
                    display: flex;
                    align-items: center;
                    margin-top: 15px;

                    .editImg {
                        height: 15px;
                    }

                    .bankNameInputOutBorder {
                        display: flex;
                        justify-content: center;
                        align-items: center;
                        border-bottom: 3px solid #0336ff;

                        &:focus-within .cleanBankNameInputBtn {
                            visibility: visible !important;
                        }

                        .bankNameInput {
                            width: 200px;
                            font-size: 20px;
                            background-color: transparent;
                            border: 0px;
                            outline: none;

                            font-weight: 600;
                            letter-spacing: -0.5px;
                            text-shadow: 0 1px 1px rgba(0, 0, 0, 0.05);

                            &::placeholder {
                                text-align: center;
                            }
                        }

                        .cleanBankNameInputBtn {
                            background-color: transparent;
                            border: 0px;
                            visibility: hidden;

                            .cleanBankNameInputImg {
                                width: 10px;
                                height: 10px;
                            }
                        }
                    }
                }

                .bankTagContainer {
                    display: flex;
                    // justify-content: center;
                    align-items: start;
                    margin-top: 20px;
                    .bankTagImg {
                        height: 15px;
                    }

                    .bankTags {
                        display: flex;
                        flex-wrap: wrap;
                    }
                }

                .bankTimeContainer {
                    display: flex;
                    justify-content: space-between;
                    width: 450px;
                    margin-top: 10px;
                    margin-bottom: 10px;

                    .timeText {
                        font-size: 12px;
                        color: #333333;
                        font-weight: 500;
                        color: #666 !important;
                    }
                }

                .questionCountContainer {
                    display: flex;
                    margin-right: 20px;
                    user-select: none;

                    .questionCountText {
                        display: flex;
                        align-items: center;
                        font-size: 16px;
                        padding: 5px;
                        white-space: nowrap;

                        background-color: #0336ff;
                        color: white;

                        border-top-left-radius: 5px;
                        border-bottom-left-radius: 5px;
                    }

                    .questionCountNum {
                        display: flex;
                        align-items: center;
                        font-size: 16px;
                        padding: 5px;

                        font-weight: bold;
                        border: 2px solid #0336ff;

                        border-top-right-radius: 5px;
                        border-bottom-right-radius: 5px;
                    }
                }

                .saveBankDataUpdateBtn {
                    border: 1px solid #0336ff;
                    color: #0336ff;
                    margin-left: 20px;
                    padding: 5px 10px;
                    border-radius: 5px;
                    visibility: hidden;
                    opacity: 0;

                    &:hover {
                        background-color: #0336ff;
                        color: white;
                    }
                }

                .giveUpBankDataUpdateBtn {
                    border: 1px solid #d9001b;
                    color: #d9001b;
                    margin-left: 10px;
                    padding: 5px 10px;
                    border-radius: 5px;
                    visibility: hidden;
                    opacity: 0;

                    &:hover {
                        background-color: #d9001b;
                        color: white;
                    }
                }

                .rightContent {
                    display: flex;
                    height: fit-content;

                    margin-top: 20px;
                    align-items: center;
                }
            }
        }

        .bankContent {
            display: flex;
            margin-top: 15px;
            transition: all 0.2s ease;
            flex: 1;
            min-height: 0;

            .quesionFilter {
                display: flex;
                flex-direction: column;
                background-color: #fff;
                border-radius: 5px;
                max-width: 21%;
                min-width: 200px;
                flex: 1;
                box-sizing: border-box;

                overflow-y: auto;
                scrollbar-gutter: stable both-edges;

                border-radius: 8px;
                box-shadow:
                    0 2px 8px rgba(0, 0, 0, 0.08),
                    0 1px 2px rgba(0, 0, 0, 0.04);
                border: 1px solid rgba(0, 0, 0, 0.12);
                transition:
                    transform 0.2s,
                    box-shadow 0.2s;

                .questionFilterTitle {
                    position: sticky;
                    top: 0;

                    display: flex;
                    flex-direction: column;
                    margin-bottom: 10px;

                    background-color: #fff;

                    .colorHolder {
                        width: 100%;
                        height: 15px;
                        background-color: #fff;
                    }
                    .leftColorBlock {
                        display: block;
                        max-width: 8px;
                        min-width: 8px;
                        flex: 1;

                        background-color: #0336ff;

                        border-radius: 3px;
                    }

                    .questionFilterTitleText {
                        font-size: 16px;
                        font-weight: bold;
                        margin-left: 10px;
                    }
                }
            }

            .questionListContainer {
                display: flex;
                flex: 1;
                flex-direction: column;
                min-width: 800px;
                min-height: 0;

                border-radius: 5px;
                margin-left: 10px;
                padding: 5px;
                background-color: #fff;
                box-sizing: border-box;

                border-radius: 8px;
                box-shadow:
                    0 2px 8px rgba(0, 0, 0, 0.08),
                    0 1px 2px rgba(0, 0, 0, 0.04);
                border: 1px solid rgba(0, 0, 0, 0.12);
                transition:
                    transform 0.2s,
                    box-shadow 0.2s;

                .questionListTitle {
                    flex-shrink: 0;
                    display: flex;
                    margin-top: 10px;
                    margin-bottom: 10px;
                    align-items: center;
                    .leftColorBlock {
                        display: block;
                        max-width: 8px;
                        min-width: 8px;
                        height: 100%;
                        flex: 1;

                        background-color: #0336ff;

                        border-radius: 3px;
                    }

                    .questionListTitleText {
                        font-size: 16px;
                        font-weight: bold;
                        margin-left: 10px;
                    }
                }

                .questionListControlBar {
                    flex-shrink: 0;
                    display: flex;
                    justify-content: space-between;
                    align-items: baseline;

                    .questionListSearch {
                        display: flex;
                        align-items: baseline;
                        margin-left: 20px;
                        & span {
                            font-size: 14px;
                        }
                        .questionListSearchInput {
                            outline: none;
                            border: #969696 1px solid;
                            padding: 8px;
                            width: 200px;
                            border-radius: 25px;

                            margin-left: 10px;

                            font-size: 12px;
                            line-height: 14px;
                        }
                    }

                    .questionListControlBtnContainer {
                        display: flex;
                    }
                }

                & > :last-child {
                    flex: 1;
                    min-height: 0;
                    overflow: auto;
                }
            }
        }
    }

    .normalBtn {
        display: flex;
        justify-content: center;
        align-items: center;
        font-size: 14px;
        margin-left: 20px;
        margin-right: 20px;
        padding: 5px 10px;
        color: #0336ff;
        box-sizing: border-box;
        border: 1px solid #cecece;
        transition: all 0.2s ease;
        &:hover {
            border-color: #0336ff;
        }
        border-radius: 5px;

        height: fit-content;
    }

    @media screen and (max-width: 1200px) {
        .pageContainer {
            padding: 0px;
            transition: all 0.2s ease;

            .rollbackBar {
                margin-top: 0px;
            }
            .bankMsgBar {
                transition: all 0.2s ease;
                margin-top: 0px;
                border: 0px;
                border-bottom: 1px solid #ccc;
                border-radius: 0px;

                box-shadow: none;
            }

            .bankContent {
                transition: all 0.2s ease;
                margin-top: 0px;

                .quesionFilter {
                    border: 0px;
                    border-radius: 0px;

                    box-shadow: none;
                }

                .questionListContainer {
                    transition: all 0.2s ease;
                    margin-left: 0px;
                    border: 0px;
                    border-left: 1px solid #ccc;
                    border-radius: 0px;

                    box-shadow: none;
                }
            }
        }
    }

    .questionPrviewPanel {
        position: fixed;
        top: 50%;
        right: 30px;
        width: 30%;
        height: 90vh;
        background-color: white;
        box-shadow: -2px 0 10px rgba(0, 0, 0, 0.2);
        transition: transform 0.3s ease-in-out;
        z-index: 1000;
    }

    .modal {
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background-color: rgba(0, 0, 0, 0.5);
        justify-content: center;
        align-items: center;
        z-index: 100;

        .copyQuestionPanel {
            background-color: white;
            border-radius: 8px;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
            width: 500px;
            max-width: 90%;
            padding: 20px;
            display: flex;
            flex-direction: column;
            gap: 20px;

            & > div {
                display: flex;
                justify-content: flex-end;
                gap: 12px;
            }
        }

        .copyQuestionTextArea {
            width: 100%;
            height: 200px;
            padding: 12px;
            border: 1px solid #ddd;
            border-radius: 4px;
            resize: none;
            font-size: 14px;
            line-height: 1.5;
            box-sizing: border-box;

            &:focus {
                outline: none;
                border-color: #1890ff;
                box-shadow: 0 0 0 2px rgba(24, 144, 255, 0.2);
            }
        }

        .copyQuestionBtn {
            padding: 8px 16px;
            border-radius: 4px;
            font-size: 14px;
            cursor: pointer;
            transition: all 0.3s;

            &:first-child {
                background-color: white;
                color: #333;
                border: 1px solid #d9d9d9;
            }

            &:first-child:hover {
                color: #1890ff;
                border-color: #1890ff;
            }

            &:last-child {
                background-color: #1890ff;
                color: white;
                border: 1px solid #1890ff;
            }

            &:last-child:hover {
                background-color: #40a9ff;
                border-color: #40a9ff;
            }
        }
    }
</style>
