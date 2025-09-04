/*
 * @Author: WangKaidun 1597225095@qq.com
 * @Date: 2025-08-17 10:44:10
 * @LastEditors: WangKaidun 1597225095@qq.com
 * @LastEditTime: 2025-08-18 19:15:49
 * @FilePath: \exam\src\routes\teacher\paper\_test_\utils.js
 * @Description: 试卷管理页面的测试工具
 * Copyright (c) 2025 by WangKaidun 1597225095@qq.com, All Rights Reserved. 
 */
export const PAPER_ONE = {
    ID: 259,                    // 试卷ID
    Name: "测试试卷1",           // 试卷名称
    AssemblyType: "00",         // 组卷方式：00-自定义组卷 02-随机组卷 04-智能刷题
    Category: "00",             // 试卷用途：00-考试 02-练习
    Level: "00",                // 试卷难度：00-简单 02-中等 04-困难
    SuggestedDuration: 110,     // 建议时长：单位分钟
    Tags: ["标签1", "标签2"],    // 试卷标签
    CreateTime: 1755253926664,  // 创建时间：Unix时间戳
    UpdateTime: 1755398401708,  // 更新时间：Unix时间戳
    TotalScore: 36,             // 试卷总分
    QuestionCount: 10,          // 题目数量
    Status: "00",               // 状态：00-未发布 02-已删除 04-异常 06-已发布
}

export const PAPER_TWO = {
    ID: 260,
    Name: "测试试卷2",
    AssemblyType: "02",
    Category: "02",
    Level: "02",
    SuggestedDuration: 60,
    Tags: [],
    CreateTime: 1755395658022,
    UpdateTime: 1755398374447,
    TotalScore: 10,
    QuestionCount: 2,
    Status: "02",               // 状态：00-未发布 02-已删除 04-异常 06-已发布
}

export const PAPER_THREE = {
    ID: 261,
    Name: "测试试卷3",
    AssemblyType: "04",
    Category: "00",
    Level: "04",
    SuggestedDuration: 120,
    Tags: [],
    CreateTime: 1755395658022,
    UpdateTime: 1755398374447,
    TotalScore: 20,
    QuestionCount: 5,
    Status: "04",               // 状态：00-未发布 02-已删除 04-异常 06-已发布
}

export const PAPER_FOUR = {
    ID: 262,
    Name: "测试试卷4",
    AssemblyType: "04",
    Category: "00",
    Level: "04",
    SuggestedDuration: 120,
    Tags: [],
    CreateTime: 1755395658022,
    UpdateTime: 1755398374447,
    TotalScore: 20,
    QuestionCount: 5,
    Status: "06",               // 状态：00-未发布 02-已删除 04-异常 06-已发布
}