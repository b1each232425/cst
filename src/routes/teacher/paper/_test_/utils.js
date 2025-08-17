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
}