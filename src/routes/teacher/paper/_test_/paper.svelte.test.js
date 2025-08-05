import { render } from "@testing-library/svelte";
import { describe, it } from "vitest";
import Page from "../+page.svelte"

// 正常数据
const MOCK_PAPERLIST = {
    rowCount: 3,
    data: [
        {
            ID: 1,
            // 试卷ID
            Name: "无敌",
            // 试卷名称
            AssemblyType: "00",
            // 组卷方式 00：自定义组卷 02：随机组卷 04：智能刷题
            Category: "00",
            // 试卷用途 00：考试 02：练习
            Level: "00",
            // 试卷难度 00：简单 02：中等 04：困难
            SuggestedDuration: 45,
            Description: "我是这张试卷的说明",
            Tags: ["标签1","标签2","标签3","标签4","标签5"],
            CreateTime: 1754203762769,
            UpdateTime: 1754272816319,
            AccessMode: "00",
            // 试卷访问权限，00私有 02共享 04公开
        },
        {
            ID: 2,
            // 试卷ID
            Name: "寂寞",
            // 试卷名称
            AssemblyType: "02",
            // 组卷方式 00：自定义组卷 02：随机组卷 04：智能刷题
            Category: "02",
            // 试卷用途 00：考试 02：练习
            Level: "02",
            // 试卷难度 00：简单 02：中等 04：困难
            SuggestedDuration: 45,
            Description: "我是这张试卷的说明",
            Tags: [],
            CreateTime: 1754203762769,
            UpdateTime: 1754272816319,
            AccessMode: "02",
            // 试卷访问权限，00私有 02共享 04公开
        },
        {
            ID: 3,
            // 试卷ID
            Name: "WDF",
            // 试卷名称
            AssemblyType: "04",
            // 组卷方式 00：自定义组卷 02：随机组卷 04：智能刷题
            Category: "00",
            // 试卷用途 00：考试 02：练习
            Level: "04",
            // 试卷难度 00：简单 02：中等 04：困难
            SuggestedDuration: 45,
            Description: "我是这张试卷的说明",
            Tags: ["标签1","标签2"],
            CreateTime: 1754203762769,
            UpdateTime: 1754272816319,
            AccessMode: "04",
            // 试卷访问权限，00私有 02共享 04公开
        }
    ]
};

// 更新数据
const UPDATE_PAPERLIST

describe("试卷管理测试", () => {
    it("搜索功能", async () => {
        render(Page);
    });
});