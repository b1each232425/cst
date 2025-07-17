/*
 * @Author: MIOZD && l317101@163.com
 * @Date: 2025-04-24 15:33:27
 * @LastEditors: MIOZD && l317101@163.com
 * @LastEditTime: 2025-06-05 21:25:35
 * @FilePath: \tutorial-platform-fe\src\routes\teacher\questionBank\theory\api.js
 * @Description: 接口调用
 */
import { TheoryQuestion } from "./types";
/* ==================================== 题库相关接口 ====================================*/
/**
 * @description 新增题库数据
 * @param {string} bank_name 
 * @param {string[]} bank_tags
 * @param {"00" | "02"} bank_type 
 */
export async function addNewBankData(bank_name, bank_tags, bank_type) {
    try {
        const response = await fetch(`/api/question-banks`, {
            method: "POST",
            credentials: "include",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                data: {
                    name: bank_name.trim(),
                    type: bank_type,
                    tags: bank_tags,
                }
            }),
        })

        if (!response.ok) {
            if (response.status === 401) {
                return {
                    status: 1,
                    msg: "没有权限"
                };
            }
            else if (response.status === 404) {
                return {
                    status: 1,
                    msg: "没有找到对应接口"
                };
            } else {
                return await response.json()
            }
        }

        return await response.json();
    } catch (
    /**
     * @type {any}
     */
    err
    ) {
        if ("msg" in err) {
            return {
                status: 1,
                msg: err.msg
            }
        } else if ("message" in err) {
            return {
                status: 1,
                msg: err.message
            }
        } else {
            return {
                status: 1,
                msg: err
            }
        }
    }
}

/**
 * @description 删除题库数据
 * @param {number[]} bank_ids 题库id
 */
export async function deleteBankData(bank_ids) {
    console.log(bank_ids);
    try {
        const response = await fetch(`/api/question-banks`, {
            method: "DELETE",
            credentials: "include",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                data: {
                    bank_ids: bank_ids
                }
            }),
        })

        if (!response.ok) {
            if (response.status === 401) {
                return {
                    status: 1,
                    msg: "没有权限"
                };
            }
            else if (response.status === 404) {
                let json = await response.json();
                return {
                    status: 1,
                    msg: json.msg || "后端链接错误"
                };
            }
        }

        if (response.status === 204) {
            return {
                status: 0,
                msg: "success"
            }
        }

        return await response.json()
    } catch (
    /**
     * @type {any}
     */
    err
    ) {
        if ("msg" in err) {
            return {
                status: 1,
                msg: err.msg
            }
        } else if ("message" in err) {
            return {
                status: 1,
                msg: err.message
            }
        } else {
            return {
                status: 1,
                msg: err
            }
        }
    }
}

/**
 * @description 请求理论题库列表
 */
export async function getBankList() {
    try {
        const response = await fetch(`/api/question-banks/list`, {
            method: "GET",
            credentials: "include",
        })

        if (!response.ok) {
            if (response.status === 401) {
                return {
                    status: 1,
                    msg: "没有权限"
                };
            }
            else if (response.status === 404) {
                let json = await response.json();
                return {
                    status: 1,
                    msg: json.msg || "后端链接错误"
                };
            } else {
                return await response.json()
            }
        }

        return await response.json()
    } catch (
    /**
     * @type {any}
     */
    err
    ) {
        if ("msg" in err) {
            return {
                status: 1,
                msg: err.msg
            }
        } else if ("message" in err) {
            return {
                status: 1,
                msg: err.message
            }
        } else {
            return {
                status: 1,
                msg: err
            }
        }
    }
}

/**
 * @description 获取题库数据
 * @param {number} bank_id 题库id
 */
export async function getBankData(bank_id) {
    try {
        const response = await fetch(`/api/question-banks/${bank_id}`, {
            method: "GET",
            credentials: "include",
        })

        if (!response.ok) {
            if (response.status === 401) {
                return {
                    status: 1,
                    msg: "没有权限"
                };
            }
            else if (response.status === 404) {
                let json = await response.json();
                return {
                    status: 1,
                    msg: json.msg || "后端链接错误"
                };
            } else {
                return await response.json()
            }
        }

        return await response.json()
    } catch (
    /**
     * @type {any}
     */
    err
    ) {
        if ("msg" in err) {
            return {
                status: 1,
                msg: err.msg
            }
        } else if ("message" in err) {
            return {
                status: 1,
                msg: err.message
            }
        } else {
            return {
                status: 1,
                msg: err
            }
        }
    }
}

/**
 * @description 更新题库数据
 * @param {any} updateBankData
 */
export async function updateBankData(updateBankData) {

    try {
        if (updateBankData.name && updateBankData.name.trim().length === 0) {
            return {
                status: 1,
                msg: "题库名不能为空"
            };
        }

        const response = await fetch(`/api/question-banks/${updateBankData.id}`, {
            method: "PUT",
            credentials: "include",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                data: {
                    bank: updateBankData
                }
            }),
        })

        if (!response.ok) {
            if (response.status === 401) {
                return {
                    status: 1,
                    msg: "没有权限"
                };
            }
            else if (response.status === 404) {
                let json = await response.json();
                return {
                    status: 1,
                    msg: json.msg || "后端链接错误"
                };
            } else {
                return await response.json()
            }
        }

        return await response.json()
    } catch (
    /**
     * @type {any}
     */
    err
    ) {
        if ("msg" in err) {
            return {
                status: 1,
                msg: err.msg
            }
        } else if ("message" in err) {
            return {
                status: 1,
                msg: err.message
            }
        } else {
            return {
                status: 1,
                msg: err
            }
        }
    }
};

/**
 * @description 请求题库及其题目列表
 * @param {number} bank_id 题库id
 */
export async function getBankWithQuestions(bank_id) {
    try {
        const response = await fetch(`/api/question-banks/${bank_id}/bank-questions`, {
            method: "GET",
            credentials: "include",
        })

        if (!response.ok) {
            if (response.status === 401) {
                return {
                    status: 1,
                    msg: "没有权限"
                };
            }
            else if (response.status === 404) {
                let json = await response.json();
                return {
                    status: 1,
                    msg: json.msg || "后端链接错误"
                };
            } else {
                return await response.json()
            }
        }

        return await response.json()
    } catch (
    /**
     * @type {any}
     */
    err
    ) {
        if ("msg" in err) {
            return {
                status: 1,
                msg: err.msg
            }
        } else if ("message" in err) {
            return {
                status: 1,
                msg: err.message
            }
        } else {
            return {
                status: 1,
                msg: err
            }
        }
    }
}

/**
 * @description 请求题库及其题目列表
 * @param {number} bank_id 题库id
 */
export async function getQuestionBankLogs(bank_id) {
    try {
        const response = await fetch(`/api/operation_logs/06/${bank_id}`, {
            method: "GET",
            credentials: "include",
        })

        if (!response.ok) {
            if (response.status === 401) {
                return {
                    status: 1,
                    msg: "没有权限"
                };
            }
            else if (response.status === 404) {
                let json = await response.json();
                return {
                    status: 1,
                    msg: json.msg || "后端链接错误"
                };
            } else {
                return await response.json()
            }
        }

        return await response.json()
    } catch (
    /**
     * @type {any}
     */
    err
    ) {
        if ("msg" in err) {
            return {
                status: 1,
                msg: err.msg
            }
        } else if ("message" in err) {
            return {
                status: 1,
                msg: err.message
            }
        } else {
            return {
                status: 1,
                msg: err
            }
        }
    }
}

/**
 * @description 请求题目列表
 * @param {number} bank_id 题库id
 */
export async function getQuestionList(bank_id) {
    try {
        const response = await fetch(`/api/question-banks/${bank_id}/questions`, {
            method: "GET",
            credentials: "include",
        })

        if (!response.ok) {
            if (response.status === 401) {
                return {
                    status: 1,
                    msg: "没有权限"
                };
            }
            else if (response.status === 404) {
                let json = await response.json();
                return {
                    status: 1,
                    msg: json.msg || "后端链接错误"
                };
            } else {
                return await response.json()
            }
        }

        return await response.json()
    } catch (
    /**
     * @type {any}
     */
    err
    ) {
        if ("msg" in err) {
            return {
                status: 1,
                msg: err.msg
            }
        } else if ("message" in err) {
            return {
                status: 1,
                msg: err.message
            }
        } else {
            return {
                status: 1,
                msg: err
            }
        }
    }
};

/* ==================================== 题目相关接口 ====================================*/

/**
 * @description 新增题目
 * @param {number} bank_id 题库id
 * @param {Partial<TheoryQuestion>} question_data
 */
export async function addNewTheoryQuestion(bank_id, question_data) {
    console.log(question_data);
    try {
        const response = await fetch(`/api/questions`, {
            method: "POST",
            credentials: "include",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                data: {
                    bank_id: bank_id,
                    question: {
                        id: question_data.id,
                        type: question_data.type,
                        difficulty: question_data.difficulty,
                        content: question_data.content,
                        tags: question_data.tags,
                        options: question_data.options,
                        answers: question_data.answers,
                        score: question_data.score,
                        analysis: question_data.analysis,
                        question_attachments_path: question_data.question_attachments_path,
                    }
                }
            })
        })

        if (!response.ok) {
            if (response.status === 401) {
                return {
                    status: 1,
                    msg: "没有权限"
                };
            }
            else if (response.status === 404) {
                let json = await response.json();
                return {
                    status: 1,
                    msg: json.msg || "后端链接错误"
                };
            } else {
                return await response.json()
            }
        }

        return await response.json()
    } catch (
    /**
     * @type {any}
     */
    err
    ) {
        if ("msg" in err) {
            return {
                status: 1,
                msg: err.msg
            }
        } else if ("message" in err) {
            return {
                status: 1,
                msg: err.message
            }
        } else {
            return {
                status: 1,
                msg: err
            }
        }
    }
}


/**
 * @description 修改题目
 * @param {Partial<TheoryQuestion>} question_data
 */
export async function updateTheoryQuestion(question_data) {
    try {
        const response = await fetch(`/api/questions/${question_data.id}`, {
            method: "PUT",
            credentials: "include",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                data: {
                    question: {
                        id: question_data.id,
                        type: question_data.type,
                        difficulty: question_data.difficulty,
                        content: question_data.content,
                        tags: question_data.tags,
                        options: question_data.options,
                        answers: question_data.answers,
                        score: question_data.score,
                        analysis: question_data.analysis,
                        question_attachments_path: question_data.question_attachments_path,
                    }
                }
            })
        })

        if (!response.ok) {
            if (response.status === 401) {
                return {
                    status: 1,
                    msg: "没有权限"
                };
            }
            else if (response.status === 404) {
                let json = await response.json();
                return {
                    status: 1,
                    msg: json.msg || "后端链接错误"
                };
            } else {
                return await response.json()
            }
        }

        return await response.json()
    } catch (
    /**
     * @type {any}
     */
    err
    ) {
        if ("msg" in err) {
            return {
                status: 1,
                msg: err.msg
            }
        } else if ("message" in err) {
            return {
                status: 1,
                msg: err.message
            }
        } else {
            return {
                status: 1,
                msg: err
            }
        }
    }
}

/**
 * @description 删除题目
 * @param {number} bank_id 题库id
 * @param {number[]} question_ids 要删除的题目id数组
 */
export async function deleteTheoryQuestion(bank_id, question_ids) {

    try {
        const response = await fetch(`/api/questions`, {
            method: "DELETE",
            credentials: "include",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                data: {
                    bank_id: bank_id,
                    question_ids: question_ids,
                }
            }),
        })

        if (!response.ok) {
            if (response.status === 401) {
                return {
                    status: 1,
                    msg: "没有权限"
                };
            }
            else if (response.status === 404) {
                let json = await response.json();
                return {
                    status: 1,
                    msg: json.msg || "后端链接错误"
                };
            }
        }

        if (response.status === 204) {
            return {
                status: 0,
                msg: "success"
            }
        }

        return await response.json()
    } catch (
    /**
     * @type {any}
     */
    err
    ) {
        if ("msg" in err) {
            return {
                status: 1,
                msg: err.msg
            }
        } else if ("message" in err) {
            return {
                status: 1,
                msg: err.message
            }
        } else {
            return {
                status: 1,
                msg: err
            }
        }
    }
}

/**
 * @description 取得题目锁
 * @param {number} question_id 题库id
 */
export async function getQuestionLock(question_id) {
    try {
        const response = await fetch(`/api/questions/${question_id}/lock`, {
            method: "POST",
            credentials: "include",
        })

        if (!response.ok) {
            if (response.status === 401) {
                return {
                    status: 1,
                    msg: "没有权限"
                };
            }
            else if (response.status === 404) {
                let json = await response.json();
                return {
                    status: 1,
                    msg: json.msg || "后端链接错误"
                };
            } else {
                return await response.json()
            }
        }

        return await response.json()
    } catch (
    /**
     * @type {any}
     */
    err
    ) {
        if ("msg" in err) {
            return {
                status: 1,
                msg: err.msg
            }
        } else if ("message" in err) {
            return {
                status: 1,
                msg: err.message
            }
        } else {
            return {
                status: 1,
                msg: err
            }
        }
    }
};

/**
 * @description 释放题目锁
 * @param {number} question_id 题库id
 */
export async function renewQuestionLock(question_id) {
    try {
        const response = await fetch(`/api/questions/${question_id}/lock`, {
            method: "PUT",
            credentials: "include",
        })

        if (!response.ok) {
            if (response.status === 401) {
                return {
                    status: 1,
                    msg: "没有权限"
                };
            }
            else if (response.status === 404) {
                let json = await response.json();
                return {
                    status: 1,
                    msg: json.msg || "后端链接错误"
                };
            } else {
                return await response.json()
            }
        }

        return await response.json()
    } catch (
    /**
     * @type {any}
     */
    err
    ) {
        if ("msg" in err) {
            return {
                status: 1,
                msg: err.msg
            }
        } else if ("message" in err) {
            return {
                status: 1,
                msg: err.message
            }
        } else {
            return {
                status: 1,
                msg: err
            }
        }
    }
};

/**
 * @description 释放题目锁
 * @param {number} question_id 题目id
 */
export async function releaseQuestionLock(question_id) {
    try {
        const response = await fetch(`/api/questions/${question_id}/lock`, {
            method: "GET",
            credentials: "include",
            keepalive: true, // 确保在页面卸载时仍然发送请求
        })

        if (!response.ok) {
            if (response.status === 401) {
                return {
                    status: 1,
                    msg: "没有权限"
                };
            }
            else if (response.status === 404) {
                let json = await response.json();
                return {
                    status: 1,
                    msg: json.msg || "后端链接错误"
                };
            } else {
                return await response.json()
            }
        }

        return await response.json()
    } catch (
    /**
     * @type {any}
     */
    err
    ) {
        if ("msg" in err) {
            return {
                status: 1,
                msg: err.msg
            }
        } else if ("message" in err) {
            return {
                status: 1,
                msg: err.message
            }
        } else {
            return {
                status: 1,
                msg: err
            }
        }
    }
};