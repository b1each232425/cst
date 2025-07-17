import { formatTimestamp } from "$lib/common/time_utils";
import { TheoryQuestion } from "../theory/types";
import { addNewTheoryQuestion, getQuestionBankLogs, updateTheoryQuestion } from "./api";
import OperationLogForQuestionBank from "$lib/component/OperationLogPanel.svelte";
import BubbleMessageComponet from "$lib/component/BubbleMessageToast.svelte";
import { compareQuestion, getQuestionFilesPath, validateTheoryQuestion } from "./utils";

/**
 * @description 添加或更新题目
 * @param {Partial<TheoryQuestion>} new_question_data 新题目数据
 * @param {TheoryQuestion|null} modifying_question 被修改的题目的原数据
 * @param {any} bubble_message_componet 提示组件
 * @param {number} bank_id 题库id
 * @param {boolean} isNewQuestion 是否为新题
 * 
 * @returns {Promise<TheoryQuestion|null>}
 */
export async function AddOrUpdateQuestion(new_question_data, modifying_question, bubble_message_componet, bank_id, isNewQuestion) {
    /**
     * @type {TheoryQuestion} handled_question_data 处理后的题目数据
     */
    let handled_question_data = {
        id: -1,
        content: "",
        type: "",
        options: [],
        answers: [],
        analysis: "",
        difficulty: 1,
        tags: [],
        update_time: new Date().getTime(),
        update_time_str: formatTimestamp(new Date().getTime()),
        score: 0.0,
        question_attachments_path: [],
        belong_to: -1
    };

    //  更新题目数据
    if (!isNewQuestion && modifying_question) {
        const res = await updateTheoryQuestion(new_question_data);
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
                "题目更新失败: " + show_message,
            );
            return null;
        }

        handled_question_data = {
            id: modifying_question.id,
            content: modifying_question.content,
            type: modifying_question.type,
            options: modifying_question.options,
            answers: modifying_question.answers,
            analysis: modifying_question.analysis,
            difficulty: modifying_question.difficulty,
            tags: modifying_question.tags,
            update_time: modifying_question.update_time,
            update_time_str: formatTimestamp(
                modifying_question.update_time,
            ),
            score: modifying_question.score,
            question_attachments_path:
                modifying_question.question_attachments_path,
            belong_to: modifying_question.belong_to,
            ...new_question_data,
        };

        bubble_message_componet?.show(
            "success",
            "题目更新成功",
        );
    } else {
        const res = await addNewTheoryQuestion(bank_id, new_question_data);

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
                "添加题目失败: " + show_message,
            );
            return null;
        }

        handled_question_data = {
            ...handled_question_data,
            ...new_question_data,
            id: res.data.question_id,
        }

        bubble_message_componet?.show(
            "success",
            "题目添加成功",
        );
    }


    return handled_question_data;
};

/**
 * @description 判断题目是否被修改
 * @param {Partial<TheoryQuestion>} new_question_data 新题目数据
 * @param {TheoryQuestion|null} modifying_question 被修改的题目的原数据
 * @param {any} bubble_message_componet 提示组件
 * @param {number} bank_id 题库id
 * @param {boolean} isNewQuestion 是为新题
 * 
 * @returns {Promise<TheoryQuestion|null>}
 */
export async function onQuestinConfirm(new_question_data, modifying_question, bubble_message_componet, bank_id, isNewQuestion) {
    if (!isNewQuestion) {
        if (!modifying_question) {
            bubble_message_componet?.show(
                "error",
                "题目数据不存在",
            );
            return null;
        }
        let compare_res = compareQuestion(
            modifying_question,
            new_question_data,
            bubble_message_componet,
        );

        if (!compare_res) {
            bubble_message_componet?.show(
                "info",
                "正在保存题目数据，请稍后...",
            );

            return await AddOrUpdateQuestion(new_question_data, modifying_question, bubble_message_componet, bank_id, isNewQuestion);
        }
    } else {
        bubble_message_componet?.show(
            "info",
            "正在保存题目数据，请稍后...",
        );

        return await AddOrUpdateQuestion(new_question_data, modifying_question, bubble_message_componet, bank_id, isNewQuestion);
    }

    return null;
}

/**
 * @description 显示题库操作日志
 * @param {number} bank_id 
 * @param {OperationLogForQuestionBank} show_log_paenl 
 * @param {BubbleMessageComponet|undefined} bubble_message_componet 
 */
export async function showQuestionBankLogs(
    bank_id,
    show_log_paenl,
    bubble_message_componet,
) {

    let res = await getQuestionBankLogs(bank_id)
    let show_message;
    if (res.status !== 0) {
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
            "题库日志拉取失败: " + show_message,
        );
    }

    let logs = res.data;

    show_log_paenl.showLogPanel(logs)
}

/**
    * @description 复制文字到剪贴板（兼容处理）
    * @param {string} text
    * @param {any} bubble_message_componet 提示组件
    */
const copyToClipboardFallback = (text, bubble_message_componet) => {
    const textarea = document.createElement("textarea");
    textarea.value = text;
    textarea.style.position = "fixed";
    document.body.appendChild(textarea);
    textarea.select();

    try {
        const success = document.execCommand("copy");
        if (success) {
            bubble_message_componet?.show(
                "info",
                "复制成功（兼容模式）",
            );
        } else {
            throw new Error("复制命令失败");
        }
    } catch (err) {
        console.error("复制失败:", err);
        prompt("请手动复制以下内容:", text);
    } finally {
        document.body.removeChild(textarea);
    }
};

/**
 * @description 列表点击复制
 * @param {TheoryQuestion} question
 * @param {BubbleMessageComponet|undefined} bubble_message_componet 提示组件
 */
export const CopyToClipboard = (question, bubble_message_componet) => {
    let question_copied = JSON.parse(JSON.stringify(question));
    question_copied.question_attachments_path =
        getQuestionFilesPath(question);
    delete question_copied.id;
    delete question_copied.update_time;
    delete question_copied.update_time_str;
    delete question_copied.create_time;
    delete question_copied.create_time_str;
    delete question_copied.belong_to
    let question_json = JSON.stringify(question_copied);
    if (navigator.clipboard) {
        navigator.clipboard
            .writeText(question_json)
            .then(() => {
                bubble_message_componet?.show(
                    "info",
                    "已复制题目，请前往粘贴",
                );
            })
            .catch((err) => {
                copyToClipboardFallback(question_json, bubble_message_componet);
            });
    } else {
        copyToClipboardFallback(question_json, bubble_message_componet);
    }
};

/**
 * @description 复制题目到题库
 * @param {string} question_json
 * @param {number} bank_id 题库id
 * @param {any} bubble_message_componet 提示组件
 * @return {Promise<TheoryQuestion|null>} 返回新添加的题目数据或null
 */
export const PasteQuestion = async (question_json, bank_id, bubble_message_componet) => {
    try {
        let question = JSON.parse(question_json);
        if (question instanceof Array) {
            bubble_message_componet?.show(
                "warn",
                "粘贴失败：一次只能粘贴一题",
            );
            return null;
        }
        let validate_res = validateTheoryQuestion(question);
        if (validate_res !== null) {
            bubble_message_componet?.show(
                "error",
                "粘贴失败：" + validate_res,
            );
            return null;
        }

        bubble_message_componet?.show(
            "info",
            "正在粘贴题目，请稍后...",
        );
        let now = new Date().getTime();
        let new_question_data = {
            id: 0,
            content: question.content,
            type: question.type,
            options: question.options,
            answers: question.answers,
            analysis: question.analysis,
            difficulty: question.difficulty,
            score: question.score,
            tags: question.tags,
            update_time: now,
            update_time_str: formatTimestamp(now),
            question_attachments_path: question.question_attachments_path,
            belong_to: bank_id,
        };
        const res = await addNewTheoryQuestion(bank_id, new_question_data);
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
                "粘贴题目失败: " + show_message,
            );

            return null;
        }

        new_question_data.id = res.data.question_id;

        bubble_message_componet?.show(
            "success",
            "题目粘贴成功",
        );

        return new_question_data

    } catch (e) {
        bubble_message_componet?.show(
            "error",
            "解析失败:" + e,
        );
        return null;
    }
};