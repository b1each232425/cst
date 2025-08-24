/*
 * @Author: WangKaidun 1597225095@qq.com
 * @Date: 2025-08-19 11:47:10
 * @LastEditors: WangKaidun 1597225095@qq.com
 * @LastEditTime: 2025-08-19 11:47:17
 * @FilePath: \exam\src\routes\teacher\paper\manual\_test_\utils.js
 * @Description: 自定义组卷的测试工具
 * Copyright (c) 2025 by WangKaidun 1597225095@qq.com, All Rights Reserved. 
 */

// 单选题
export const SINGLE_CHOICE_QUESTION = {
    id: 995, // 题目ID（标识试卷中的题目）
    tags: ["数据结构", "基础"],
    type: "00", // 题目类型: 00-单选题 02-多选题 04-判断题 06-填空题 08-简答题
    order: 1, // 题目序号（在整张试卷中的序号）
    score: 2, // 题目分数
    answers: ["B"],
    content: "<p><span style=\"font-size: 12pt\">以下哪一种数据结构最适合用于实现先进先出（FIFO）逻辑？</span></p>",
    options: [
        {
            label: "A",
            value: "<p><span style=\"font-size: 12pt\">栈</span></p>"
        },
        {
            label: "B",
            value: "<p><span style=\"font-size: 12pt\">队列</span></p>"
        },
        {
            label: "C",
            value: "<p><span style=\"font-size: 12pt\">树</span></p>"
        },
        {
            label: "D",
            value: "<p><span style=\"font-size: 12pt\">图</span></p>"
        }
    ],
    analysis: "<p>队列（Queue）遵循先进先出（FIFO）的顺序，而栈（Stack）是先进后出（LIFO）。</p>",
    group_id: 1196,
    sub_score: null, // 子分数：只有简答题和填空题有子分数，其他题目没有子分数（null）
    difficulty: 1, // 难度: 1-简单 2-中等 3-困难
    bank_question_id: 340, // 题库题目ID
    belong_to: 84,
}

// 多选题
export const MULTIPLE_CHOICE_QUESTION = {
    id: 996,
    tags: ["数据库", "SQL"],
    type: "02",
    order: 2,
    score: 3,
    answers: ["A", "B", "D"],
    content: "<p><span style=\"font-size: 12pt\">在关系型数据库中，以下哪些操作属于数据操纵语言（DML）？</span></p>",
    options: [
        {
            label: "A",
            value: "<p><span style=\"font-size: 12pt\">SELECT</span></p>"
        },
        {
            label: "B",
            value: "<p><span style=\"font-size: 12pt\">INSERT</span></p>"
        },
        {
            label: "C",
            value: "<p><span style=\"font-size: 12pt\">CREATE</span></p>"
        },
        {
            label: "D",
            value: "<p><span style=\"font-size: 12pt\">UPDATE</span></p>"
        }
    ],
    analysis: "<p>DML 包括 SELECT、INSERT、UPDATE 和 DELETE，CREATE 属于 DDL。</p>",
    group_id: 1196,
    sub_score: null,
    difficulty: 2,
    bank_question_id: 348,
    belong_to: 84,
}

// 判断题
export const TRUE_FALSE_QUESTION = {
    id: 997,
    tags: [],
    type: "04",
    order: 3,
    score: 2,
    answers: ["B"],
    content: "<p>Java 支持多重继承。</p>",
    options: [
        {
            label: "A",
            value: "正确"
        },
        {
            label: "B",
            value: "错误"
        }
    ],
    analysis: "<p>Java 中类不支持多重继承，但接口可以。</p>",
    group_id: 1196,
    sub_score: null,
    difficulty: 2,
    bank_question_id: 338,
    belong_to: 84,
}

// 填空题
export const FILL_BLANK_QUESTION = {
    id: 998,
    tags: ["软件工程", "面向对象"],
    type: "06",
    order: 4,
    score: 3,
    answers: [
        {
            index: 1,
            score: 1,
            answer: "包含",
            alternative_answers: []
        },
        {
            index: 2,
            score: 1,
            answer: "扩展",
            alternative_answers: []
        },
        {
            index: 3,
            score: 1,
            answer: "继承",
            alternative_answers: []
        }
    ],
    content: "<p>在类之间可以通过关系来建立联系，常见的关系包括 ()、() 和 ()。</p>",
    analysis: "<p>包含、扩展和继承是类之间最常见的三种关系。</p>",
    group_id: 1196,
    sub_score: [1, 1, 1],
    difficulty: 3,
    bank_question_id: 358,
    belong_to: 84,
}

// 简答题
export const SHORT_ANSWER_QUESTION = {
    id: 999,
    tags: ["操作系统", "进程线程"],
    type: "08",
    order: 5,
    score: 5,
    answers: [
        {
            index: 1,
            score: 5,
            answer: "进程是系统资源分配的最小单位，线程是程序执行的最小单位；同一进程中的线程共享资源，进程之间相互独立。",
            alternative_answers: ["我是备选答案1", "我是备选答案2"]
        }
    ],
    content: "<p>简述操作系统中进程与线程的区别。</p>",
    analysis: "<p>理解进程和线程的关系有助于掌握并发编程。</p>",
    group_id: 1196,
    sub_score: [
        5
    ],
    difficulty: 2,
    bank_question_id: 361,
    belong_to: 84,
}

// 试卷信息
export const PAPER_INFO = {
    ID: 230,
    Name: "测试试卷",
    Category: "00", // 试卷用途：00-考试 02-练习
    Level: "00", // 试卷难度：00-简单 01-中等 02-困难
    SuggestedDuration: 66, // 建议时长（分钟）
    Description: "我是试卷的说明",
    Tags: ["测试", "简答", "填空"],
    TotalScore: 15, // 总分
    QuestionCount: 5, // 题目数量
    GroupsData: [
        {
            id: 1196,
            name: "测试题组",
            order: 1,
            questions: [],
        },
    ]
}