import { fireEvent, getByText, render, screen, waitFor } from "@testing-library/svelte";
import { beforeEach, describe, it, vi, expect } from "vitest";
import Page from "../+page.svelte"


// mock 调用的 API
vi.mock("../_utils/api", () => {
    return {
        fetchPaperList: vi.fn(),
        createEmptyPaper: vi.fn(),
        deletePaper: vi.fn()
    };
});

vi.mock("$app/navigation", () => {
    return {
        goto: vi.fn()
    };
});

import { fetchPaperList, createEmptyPaper, deletePaper } from "../_utils/api";
import { goto } from "$app/navigation";

// 正常试卷列表数据
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
    ],
};

// 更新试卷列表数据
const UPDATE_PAPERLIST = {
    rowCount: 1,  // 只有 "无敌" 试卷
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
    ],
};

// 空试卷列表
const EMPTY_PAPERLIST = {
    rowCount: 0,
    data: [],
};

// 空白试卷
const EMPTY_PAPER = {
    data: {
        paper: {
            ID: 123
        },
    },
};

describe("试卷管理测试", () => {
    // 每个测试用例前的初始化
    beforeEach(() => {
        fetchPaperList.mockReset();
        createEmptyPaper.mockReset();
        goto.mockReset();

        fetchPaperList.mockResolvedValue(MOCK_PAPERLIST);
        createEmptyPaper.mockResolvedValue(EMPTY_PAPER);
    });

    it("搜索功能 & 重置功能 & 自定义组卷功能", async () => {
        // 渲染页面
        render(Page);

        // 正常显示试卷列表
        expect(await screen.findByText("无敌")).toBeInTheDocument();

        // 修改请求返回的参数
        fetchPaperList.mockResolvedValueOnce(UPDATE_PAPERLIST);

        // 搜索试卷
        const NAME_INPUT = await screen.findByPlaceholderText("搜索试卷名称");
        await fireEvent.input(NAME_INPUT, { target: { value: "无敌" } });

        // 等待请求
        await waitFor(() => {
            expect(screen.queryByText("寂寞")).not.toBeInTheDocument();
        });

        // 点击重置按钮
        await fireEvent.click(screen.getByText("重置"));

        // 列表恢复正常
        await waitFor(() => {
            expect(screen.queryByText("寂寞")).toBeInTheDocument();
        });

        // 点击自定义组卷按钮
        await fireEvent.click(screen.getByRole("button", { name: "自定义组卷" }));

        // 等待 goto 被调用
        await waitFor(() => {
            expect(goto).toHaveBeenCalled();
        });
    });

    it("空试卷列表", async () => {
        // 覆盖外层
        fetchPaperList.mockResolvedValue(EMPTY_PAPERLIST);

        // 渲染页面
        render(Page);

        await waitFor(() => {
            expect(screen.getByText("暂无试卷数据")).toBeInTheDocument();
        });
    });
});