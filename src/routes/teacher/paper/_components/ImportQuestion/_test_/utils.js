/*
 * @Author: WangKaidun 1597225095@qq.com
 * @Date: 2025-08-19 12:11:57
 * @LastEditors: WangKaidun 1597225095@qq.com
 * @LastEditTime: 2025-08-19 12:12:02
 * @FilePath: \exam\src\routes\teacher\paper\_components\ImportQuestion\_test_\utils.js
 * @Description: 从题库中导入题目组件的测试工具
 * Copyright (c) 2025 by WangKaidun 1597225095@qq.com, All Rights Reserved. 
 */

// 单选题
export const SINGLE_CHOICE_QUESTION = {
    ID: 340,
    Type: "00",
    Content: "<p><span style=\"font-size: 12pt\">以下哪一种数据结构最适合用于实现先进先出（FIFO）逻辑？</span></p>",
    Score: 2,
    Difficulty: 1,
    Tags: ["数据结构", "基础"], 
    UpdateTime: 1722100200000,
}

// 多选题
export const MULTIPLE_CHOICE_QUESTION = {
    ID: 348,
    Type: "02",
    Content: "<p><span style=\"font-size: 12pt\">在关系型数据库中，以下哪些操作属于数据操纵语言（DML）？</span></p>",
    Score: 3,
    Difficulty: 2,
    Tags: ["数据库", "SQL"],
    UpdateTime: 1722000300000,
}

// 判断题
export const TRUE_FALSE_QUESTION = {
    ID: 338,
    Type: "04",
    Content: "<p>Java 支持多重继承。</p>",
    Score: 2,
    Difficulty: 2,
    Tags: [],
    UpdateTime: 1722000300000,
}

// 填空题
export const FILL_BLANK_QUESTION = {
    ID: 358,
    Type: "06",
    Content: "<p>在类之间可以通过关系来建立联系，常见的关系包括 ()、() 和 ()。</p>",
    Score: 3,
    Difficulty: 3,
    Tags: ["软件工程", "面向对象"],
    UpdateTime: 1722000300000,
}

// 简答题
export const SHORT_ANSWER_QUESTION = {
    ID: 361,
    Type: "08",
    Content: "<p>简述操作系统中进程与线程的区别。</p>",
    Score: 5,
    Difficulty: 2,
    Tags: ["操作系统", "进程线程"],
    UpdateTime: 1722000300000,
}