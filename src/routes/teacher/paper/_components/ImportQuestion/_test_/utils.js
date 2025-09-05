/*
 * @Author: WangKaidun 1597225095@qq.com
 * @Date: 2025-08-19 12:11:57
 * @LastEditors: WangKaidun 1597225095@qq.com
 * @LastEditTime: 2025-08-19 12:12:02
 * @FilePath: \exam\src\routes\teacher\paper\_components\ImportQuestion\_test_\utils.js
 * @Description: 从题库中导入题目组件的测试工具
 * Copyright (c) 2025 by WangKaidun 1597225095@qq.com, All Rights Reserved. 
 */

export const SINGLE_CHOICE_QUESTION = {
    ID: 530,
    Type: "00",
    Content: "<p><span style=\"font-size: 12pt\">我是一道单选题</span></p>",
    Score: 2,
    Difficulty: 3,
    Tags: ["单选题的标签"],
    BelongTo: 106,
    UpdateTime: 1755918425852
}

export const MULTIPLE_CHOICE_QUESTION = {
    ID: 531,
    Type: "02",
    Content: "<p><span style=\"font-size: 12pt\">我是一道多选题</span></p>",
    Score: 3,
    Difficulty: 2,
    Tags: [],
    BelongTo: 107,
    UpdateTime: 1755918425852
}