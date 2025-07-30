/*
 * @Author: MIOZD && l317101@163.com
 * @Date: 2025-05-17 16:20:22
 * @LastEditors: MIOZD && l317101@163.com
 * @LastEditTime: 2025-06-04 23:27:48
 * @FilePath: \tutorial-platform-fe\src\routes\teacher\questionBank\theory\utils.js
 * @Description: 
 */
import { toast } from '$lib/components/Toast/Toast.js';
import { TheoryQuestion } from "../theory/type.js";

/**
 * 
 * @param {TheoryQuestion} question 
 * @returns 
 */
export function validateTheoryQuestion(question) {
    if (!question || !(question instanceof Object)) {
        return '题目格式不合法';
    }

    switch (question.type) {
        case "00":
        case "02":
        case "04":
            if (!Array.isArray(question.options) || question.options.length < 2 || question.options.length > 8) {
                return '题目选项数量不合法';
            }

            const labels = new Set();
            for (let option of question.options) {
                if (labels.has(option.label)) {
                    return '题目选项标签不能重复';
                }
                labels.add(option.label);
            }

            if (question.content.trim() === '') {
                return '题目内容不能为空';
            }

            if (question.difficulty !== 1 && question.difficulty !== 2 && question.difficulty !== 3) {
                return '题目难度不合法';
            }

            if (question.score < 0) {
                return '题目分值不能小于0';
            }

            if ((question.type === "00" || question.type === "04") && question.answers.length !== 1) {
                return '题目答案数量不合法';
            } else if (question.answers.length > question.options.length) {
                return '题目答案数量不能大于选项数量';
            } else if (question.answers.length === 0) {
                return '题目答案不能为空';
            }

            const answers = new Set()
            for (let answer of question.answers) {
                if (typeof answer !== 'string') {
                    return '题目答案格式不合法';
                } else if (answers.has(answer)) {
                    return '题目答案不能重复';
                } else if (!labels.has(answer)) {
                    return '题目答案必须在选项中';
                }
                answers.add(answer)
            };
            break;
        case "06":
        case "08":
            if (question.options && question.options.length !== 0) {
                return '填空题和简答题不能有选项';
            }

            if (question.content.trim() === '') {
                return '题目内容不能为空';
            }

            if (question.difficulty !== 1 && question.difficulty !== 2 && question.difficulty !== 3) {
                return '题目难度不合法';
            }

            if (question.score < 0) {
                return '题目分值不能小于0';
            }

            for (let questionAnswer of question.answers) {
                if (typeof questionAnswer === 'string') {
                    return '题目答案格式不合法';
                }
                else if (questionAnswer.answer.trim() === '') {
                    return '题目答案不能为空';
                }
                else if (questionAnswer.answer.length > 1000) {
                    return '题目答案长度不能超过1000';
                }
                else if (questionAnswer.score < 0) {
                    return '题目答案分值不能小于0';
                }
                else if (questionAnswer.grading_rule.trim().length == 0 || questionAnswer.grading_rule.length > 1000) {
                    return '题目答案评分规则不合法';
                }
                else if (question.type === "08" && questionAnswer.alternative_answers && questionAnswer.alternative_answers.length !== 0) {
                    return '简答题答案不能有替代答案';
                }
                if (!questionAnswer.alternative_answers || questionAnswer.alternative_answers.length === 0)
                    continue;
                for (let alternative_answer of questionAnswer.alternative_answers) {
                    if (typeof alternative_answer !== 'string') {
                        return '题目答案格式不合法';
                    }
                    else if (alternative_answer.trim() === '') {
                        return '题目答案不能为空';
                    }
                    else if (alternative_answer.length > 1000) {
                        return '题目答案长度不能超过1000';
                    }
                }
            }
            break;
        default:
            return '题目类型不合法';
    }


    return null;
}

/**
 * @description 获取题目中附件的路径集合
 * @param {Partial<TheoryQuestion>} question 
 */
export function getQuestionFilesPath(question) {
    let htmlString = "";
    switch (question.type) {
        case "00":
        case "02":
            if (question.options)
                htmlString += question.options.map(o => o.value).join('');
        case "04":
        case "06":
        case "08":
            if (question.content)
                htmlString += question.content;
            if (question.analysis)
                htmlString += question.analysis;
            break;
    }

    const parser = new DOMParser();
    const doc = parser.parseFromString(htmlString, 'text/html');

    /** @type {string[]} */
    const result = [];

    /**
     * 标准化路径格式并移除 origin
     * @param {string} url 
     */
    const normalizePath = url => {
        try {
            const normalized = url.replace(/\\/g, '/')
                .replace(/^\/+/, '/');

            const { pathname, search, hash } = new URL(normalized, window.location.origin);
            return pathname + search + hash;
        } catch {
            return url.replace(/\\/g, '/');
        }
    };



    // 处理图片和媒体资源
    doc.querySelectorAll('img, source').forEach(el => {
        const value = el.getAttribute("src");
        if (value && !value.startsWith('data:')) {
            result.push(normalizePath(value));
        }
    });

    // 处理附件链接
    doc.querySelectorAll('a.piptap-attachment').forEach(a => {
        const value = a.getAttribute("href");
        if (value && !value.startsWith('data:')) {
            result.push(normalizePath(value));
        }
    })

    return [...new Set(result)];
}

/**
 * @description 题目比对
 * @param {TheoryQuestion} old_question_data 旧题目数据
 * @param {Partial<TheoryQuestion>} new_question_data 新题目数据
 * @param {BubbleMessageComponet|undefined} bubble_message_componet 提示组件
 */
export const compareQuestion = (old_question_data, new_question_data, bubble_message_componet) => {
    // 题目内容
    if (
        old_question_data.content !== new_question_data.content &&
        !(
            old_question_data.content === undefined ||
            new_question_data.content === undefined
        )
    ) {
        return false;
    }

    if (new_question_data.options && old_question_data.options) {
        let new_options = new_question_data.options;
        // 题目选项
        if (
            old_question_data.type === "00" ||
            old_question_data.type === "02" ||
            old_question_data.type === "04"
        ) {
            let options_equal =
                old_question_data.options.length ===
                new_question_data.options.length &&
                old_question_data.options.every(
                    (value, index) =>
                        value.label === new_options[index].label &&
                        value.value === new_options[index].value,
                );
            if (!options_equal) {
                return false;
            }
        }
    }

    // 题目分数
    if (
        old_question_data.score !== new_question_data.score &&
        !(
            old_question_data.score === undefined ||
            new_question_data.score === undefined
        )
    ) {
        return false;
    }

    if (new_question_data.answers && old_question_data.answers) {
        let new_answer_list = new_question_data.answers;
        // 题目答案
        if (
            old_question_data.type === "00" ||
            old_question_data.type === "02" ||
            old_question_data.type === "04"
        ) {
            let answers_equal =
                old_question_data.answers.length ===
                new_question_data.answers.length &&
                old_question_data.answers.every((value, index) => {
                    value === new_answer_list[index];
                });
            if (!answers_equal) {
                return false;
            }
        } else {
            let answers_equal =
                old_question_data.answers.length ===
                new_question_data.answers.length &&
                old_question_data.answers.every((value, index) => {
                    let new_answer = new_answer_list[index];
                    if (
                        typeof value === "string" ||
                        typeof new_answer === "string"
                    ) {
                        throw new Error(
                            `question id ${old_question_data.id} answers type error, should be array`,
                        );
                    }
                    return (
                        value.index === new_answer.index &&
                        value.answer === new_answer.answer &&
                        value.score === new_answer.score &&
                        value.grading_rule ===
                        new_answer.grading_rule &&
                        (value.alternative_answers === undefined ||
                            (value.alternative_answers?.length ===
                                new_answer.alternative_answers
                                    ?.length &&
                                value.alternative_answers?.every(
                                    (value, index) => {
                                        if (typeof new_answer === "string") {
                                            throw new Error(
                                                `question id ${old_question_data.id} answers type error, should be array`,
                                            );
                                        }
                                        value ===
                                            new_answer
                                                .alternative_answers?.[
                                            index
                                            ];
                                    },
                                )))
                    );
                });
            if (!answers_equal) {
                return false;
            }
        }
    }

    // 题目难度
    if (
        old_question_data.difficulty !== new_question_data.difficulty &&
        !(
            old_question_data.difficulty === undefined ||
            new_question_data.difficulty === undefined
        )
    ) {
        return false;
    }

    // 题目标签
    if (new_question_data.tags) {
        let new_tags = new_question_data.tags;
        let tags_equal =
            old_question_data.tags.length ===
            new_question_data.tags.length &&
            old_question_data.tags.every(
                (value, index) => value === new_tags[index],
            );

        if (!tags_equal) {
            return false;
        }
    }

    // 题目解析
    if (
        old_question_data.analysis !== new_question_data.analysis &&
        !(
            old_question_data.analysis === undefined ||
            new_question_data.analysis === undefined
        )
    ) {
        return false;
    }

    return true;
};

/**
 * @description 比对题库数据变动
 * @typedef {{
 *      name:string,
 *      tags:string[]
 * }} bank_data
 * @param {bank_data} old_bank_data
 * @param {bank_data} new_bank_data
 */
export const compareBankMsg = (old_bank_data, new_bank_data) => {
    // 题库名
    if (old_bank_data.name !== new_bank_data.name) {
        return false;
    }

    // 标签比较
    return (
        old_bank_data.tags.length === new_bank_data.tags.length &&
        old_bank_data.tags.every((value, index) => {
            return value === new_bank_data.tags[index];
        })
    );
};