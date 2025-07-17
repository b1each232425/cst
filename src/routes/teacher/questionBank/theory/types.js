/*
 * @Author: MIOZD && l317101@163.com
 * @Date: 2025-04-23 16:44:26
 * @LastEditors: MIOZD && l317101@163.com
 * @LastEditTime: 2025-06-04 23:14:36
 * @FilePath: \tutorial-platform-fe\src\routes\teacher\questionBank\theory\types.js
 * @Description: 类型定义
 */

/**
 * @description 理论题题目类型
 */
export class TheoryQuestion {
    /**
     * @type {number} id 题目ID
     */
    id = -1

    /**
     * @type {string} type 题目类型
     */
    type = ""

    /**
     * @type {string} content 题目内容
    */
    content = ""

    /**
     * @type {(string | {index:number,answer:string,alternative_answers?:string[],score:number,grading_rule:string})[]} answer 题目答案
    */
    answers = []

    /**
     * @type {{label:string,value:string}[]} options 题目选项
     */
    options = []

    /**
     * @type {string[]} tags 题目标签
    */
    tags = []

    /**
     * @type {number} difficulty 题目难度
    */

    difficulty = 0

    /**
     * @type {number} score 题目分值
    */
    score = 0

    /**
     * @type {string} analysis 题目解析
    */
    analysis = ""

    /**
     * @type {number} update_time 题目更新时间
    */
    update_time = 0

    /**
     * @type {string | undefined} update_time 题目更新时间字符串
     */
    update_time_str;

    /**
     * @type {string[]} question_attachments_path 题目中附件的路径集合
     */
    question_attachments_path = [] // 题目中附件的路径集合

    /**
     * @type {number} belong_to 所属题库ID
     */
    belong_to = -1
}

// /**
//  * @description 单选题结构示例
//  * @type {TheoryQuestion}
//  */
// let single_select = {
//     id: 1,
//     type: "00",                     // 类型:00单选题，02多选题，04判断题，06填空题，08简答题
//     content: "单选题题干",
//     answers: ["A"],                 // 答案个数大于一
//     options: [
//         { label: "A", value: "选项1" },
//         { label: "B", value: "选项2" },
//         { label: "C", value: "选项3" },
//         { label: "D", value: "选项4" }
//     ],
//     tags: ["标签1", "标签2"],        // 难度:1简单，2中等，3困难
//     difficulty: 1,
//     score: 5,
//     analysis: "解析",
//     update_time: 1680000000,
//     update_time_str: "2023-01-01 00:00:00"
// }

// /**
//  * @description 多选题结构示例
//  * @type {TheoryQuestion}
//  */
// let mutiple_select = {
//     id: 2,
//     type: "02",                     // 类型:00单选题，02多选题，04判断题，06填空题，08简答题
//     content: "多选题题干",
//     answers: ["A", "B"],            // 答案个数大于等于一
//     options: [
//         { label: "A", value: "选项1" },
//         { label: "B", value: "选项2" },
//         { label: "C", value: "选项3" },
//         { label: "D", value: "选项4" }
//     ],
//     tags: ["标签1", "标签2"],
//     difficulty: 1,                  // 难度:1简单，2中等，3困难
//     score: 5,
//     analysis: "解析",
//     update_time: 1680000000,
//     update_time_str: "2023-01-01 00:00:00"
// }

// /**
//  * @description 判断题结构示例
//  * @type {TheoryQuestion}
//  */
// let judge_select = {
//     id: 3,
//     type: "04",                     // 类型:00单选题，02多选题，04判断题，06填空题，08简答题
//     content: "判断题题干",
//     answers: ["A"],                 // 答案个数大于一
//     options: [                      // 选项仅两个，不会增减
//         { label: "A", value: "选项1" },
//         { label: "B", value: "选项2" },
//     ],
//     tags: ["标签1", "标签2"],
//     difficulty: 1,                  // 难度:1简单，2中等，3困难
//     score: 5,
//     analysis: "解析",
//     update_time: 1680000000,
//     update_time_str: "2023-01-01 00:00:00"
// }

// /**
//  * @description 填空题结构示例
//  * @type {TheoryQuestion}
//  */
// let fill_bank = {
//     id: 4,
//     type: "06",                                             // 类型:00单选题，02多选题，04判断题，06填空题，08简答题
//     content: "填空题题干",
//     answers: [
//         {
//             index: 1,                                       // 填空题填空序号，按顺序增减
//             answer: "答案1",                                // 填空题答案
//             alternative_answers: ["替代答案1", "替代答案2"], // 填空题替代答案
//             score: 5,                                       // 填空题分数
//             grading_rule: "完全正确"                        // 填空题评分规则
//         }
//     ],                                                      // 答案个数大于等于一
//     options: [],                                            // 填空题无选项
//     tags: ["标签1", "标签2"],
//     difficulty: 1,                                          // 难度:1简单，2中等，3困难
//     score: 5,
//     analysis: "解析",
//     update_time: 1680000000,
//     update_time_str: "2023-01-01 00:00:00"
// }


// // 简答题结构示例
// let short_answer = {
//     id: 5,
//     type: "08",                                             // 类型:00单选题，02多选题，04判断题，06填空题，08简答题
//     content: "简答题题干",
//     answers: [
//         {
//             index: 1,                                       // 填空题填空序号，按顺序增减
//             answer: "答案1",                                // 填空题答案
//             score: 5,                                       // 填空题分数
//             grading_rule: "完全正确"                        // 填空题评分规则
//         }
//     ],                                                      // 答案个数大于等于一
//     options: [],                                            // 填空题无选项
//     tags: ["标签1", "标签2"],
//     difficulty: 1,                                          // 难度:1简单，2中等，3困难
//     score: 5,
//     analysis: "解析",
//     update_time: 1680000000,
//     update_time_str: "2023-01-01 00:00:00"
// }