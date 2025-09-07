/*
 * @Author: WangKaidun 1597225095@qq.com
 * @Date: 2025-08-18 20:02:57
 * @LastEditors: WangKaidun 1597225095@qq.com
 * @LastEditTime: 2025-09-04 16:57:13
 * @FilePath: \exam\src\routes\teacher\paper\manual\_test_\manual.svelte.test.js
 * @Description: 自定义组卷页面测试
 * Copyright (c) 2025 by WangKaidun 1597225095@qq.com, All Rights Reserved. 
 */

import { render, screen, fireEvent, waitFor, cleanup } from '@testing-library/svelte';
import { describe, it, expect, vi, afterEach, beforeEach } from 'vitest';

import { goto } from '$app/navigation';

import Manual from '../+page@.svelte';
import { FILL_BLANK_QUESTION, MULTIPLE_CHOICE_QUESTION, PAPER_INFO, SHORT_ANSWER_QUESTION, SINGLE_CHOICE_QUESTION, TRUE_FALSE_QUESTION } from './utils';
import { CURRENT_PAPER_ID, GROUP_OPEN_STATE, QUESTION_OPEN_STATE, SIDEBAR_COLLAPSED } from '../../_stores/store';
import { toast } from "$lib/components/Toast/Toast";
import { get } from 'svelte/store';

// Mock $app/navigation
vi.mock('$app/navigation', () => ({
    goto: vi.fn()
}));

// Mock toast
vi.mock('$lib/components/Toast/Toast', () => ({
    toast: {
        success: vi.fn(),
        error: vi.fn(),
        warning: vi.fn()
    }
}));

// Mock @3min/smart-edit（让内容恒为"测试内容"）
vi.mock('@3min/smart-edit', () => ({
    default: vi.fn().mockReturnValue({
        initPanel: vi.fn(),
        setContent: vi.fn(),
        setContentWithoutHistory: vi.fn(),
        getContent: vi.fn().mockReturnValue("测试内容"),
        getHTML: vi.fn().mockReturnValue("测试内容"),
        getContentLength: vi.fn().mockReturnValue(4),
        getPreviewHTML: vi.fn().mockReturnValue("测试内容"),
        destroy: vi.fn(),
        element: document.createElement('div')
    })
}));

// 重置stores
function clearStores() {
    CURRENT_PAPER_ID.set(230);
    GROUP_OPEN_STATE.set({});
    QUESTION_OPEN_STATE.set({});
    SIDEBAR_COLLAPSED.set(false);
}

describe('自定义组卷页面', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        cleanup();
        clearStores();

        // 模拟canvas的getContext方法
        HTMLCanvasElement.prototype.getContext = vi.fn(() => ({
            font: '',
            measureText: (text) => ({ width: text.length * 8 }) // 假设每字符宽8px
        }));

        // 模拟ResizeObserver监听器
        global.ResizeObserver = class {
            constructor(callback) {
              this.callback = callback;
            }
            observe() {
                this.callback(); // observe 时直接触发
            }
            unobserve() {}
            disconnect() {}
        };

        // 使用独立的测试数据
        const SINGLE_PAPER_INFO = {
            ID: 230,
            Name: "测试试卷",
            Category: "00",
            Level: "00",
            SuggestedDuration: 66,
            Description: "我是试卷的说明",
            Tags: ["测试", "简答", "填空"],
            TotalScore: 15,
            QuestionCount: 5,
            GroupsData: [
                {
                    id: 1196,
                    name: "测试题组",
                    order: 1,
                    questions: [],
                },
            ]
        };

        global.fetch = vi.fn().mockResolvedValue({
            ok: true,
            json: () => Promise.resolve({
                API: "/api/paper/manual",
                data: SINGLE_PAPER_INFO,
                method: "GET",
                msg: "success",
                status: 0
            })
        });
    });

    afterEach(() => {
        vi.clearAllMocks();
        cleanup();
        clearStores();

        // 删除ResizeObserver监听器
        delete global.ResizeObserver;
    });

    describe('onMount生命周期', () => {

        describe('失败情况', () => {

            it('无试卷 ID 的情况', async () => {
                // 设置当前试卷 ID 为 0
                CURRENT_PAPER_ID.set(0);
    
                const { container } = render(Manual);
    
                // 等待组件挂载完成
                await waitFor(() => {
                    // 验证goto是否被调用
                    expect(goto).toHaveBeenCalledWith('/teacher/paper');
                    // 验证toast是否被调用
                    expect(toast.success).toHaveBeenCalledWith('试卷内容已保存', 1000);
                });
            });

            it('请求失败', async () => {
                // 设置当前试卷 ID 为 230（测试试卷）
                CURRENT_PAPER_ID.set(230);

                // 修改mock信息：请求失败
                global.fetch.mockResolvedValueOnce({
                    ok: false,
                    status: 400
                });

                const { container } = render(Manual);

                // 等待页面渲染完成
                await waitFor(() => {
                    // 验证toast是否被调用
                    expect(toast.error).toHaveBeenCalledWith(`请求失败，状态码：400`, 1000);
                    expect(toast.warning).toHaveBeenCalledWith("3秒后跳转回试卷列表", 3000);
                });

                // 验证goto是否被调用（等待3秒后）
                await waitFor(() => {
                    expect(goto).toHaveBeenCalledWith('/teacher/paper');
                }, { timeout: 4000 });
            });

            it('业务错误', async () => {
                // 设置当前试卷 ID 为 230（测试试卷）
                CURRENT_PAPER_ID.set(230);

                // 修改mock信息：业务错误
                global.fetch.mockResolvedValueOnce({
                    ok: true,
                    json: () => Promise.resolve({
                        status: -1,
                        msg: "业务错误"
                    })
                });

                const { container } = render(Manual);

                // 验证toast是否被调用
                await waitFor(() => {
                    expect(toast.error).toHaveBeenCalledWith(`业务错误`, 1000);
                });
            });
        });
            
        it('正常情况', async () => {
            // 设置当前试卷 ID 为 230（测试试卷）
            CURRENT_PAPER_ID.set(230);

            // 使用独立的测试数据
            const SINGLE_PAPER_INFO = {
                ID: 230,
                Name: "测试试卷",
                Category: "00",
                Level: "00",
                SuggestedDuration: 66,
                Description: "我是试卷的说明",
                Tags: ["测试", "简答", "填空"],
                TotalScore: 15,
                QuestionCount: 5,
                GroupsData: [
                    {
                        id: 1196,
                        name: "测试题组",
                        order: 1,
                        questions: [
                            SINGLE_CHOICE_QUESTION,
                            MULTIPLE_CHOICE_QUESTION,
                            TRUE_FALSE_QUESTION,
                            FILL_BLANK_QUESTION,
                            SHORT_ANSWER_QUESTION
                        ],
                    },
                    {
                        id: 1197,
                        name: "空白题组",
                        order: 2,
                        questions: []
                    }
                ]
            };

            // 临时mock试卷信息：题组里有全部题型
            global.fetch.mockResolvedValueOnce({
                ok: true,
                json: () => Promise.resolve({
                    API: "/api/paper/manual",
                    data: SINGLE_PAPER_INFO,
                    method: "GET",
                    msg: "success",
                    status: 0
                })
            });

            const { container } = render(Manual);

            // 等待页面渲染完成（有题组说明渲染完成）
            await waitFor(() => {
                // 泛型匹配（有两个）
                expect(screen.getAllByText(/测试题组/)).toHaveLength(2);
            });
        });
        
    });

    describe('顶部栏', () => {
        it('渲染', async () => {
            const { container } = render(Manual);
            
            // 等待页面渲染完成（有题组说明渲染完成）
            await waitFor(() => {
                // 泛型匹配（有两个）
                expect(screen.getAllByText(/测试题组/)).toHaveLength(2);
            });

            // 验证标题
            expect(screen.getByText('自定义组卷')).toBeInTheDocument();

            // 验证输入框的内容为PAPER_INFO.Name
            expect(screen.getByDisplayValue(PAPER_INFO.Name)).toBeInTheDocument();

            // 验证操作区
            expect(screen.getByText('一键展开')).toBeInTheDocument();
            expect(screen.getByText('一键收起')).toBeInTheDocument();
            expect(screen.getByText('预览试卷')).toBeInTheDocument();
            expect(screen.getByText('从题库中导入')).toBeInTheDocument();
            expect(screen.getByText('保存并退出')).toBeInTheDocument();
            expect(container.querySelector('.save-btn')).toBeInTheDocument();
            expect(screen.getByText('退出')).toBeInTheDocument();
        });

        describe('交互', () => {
            describe('输入框', () => {
                it('正常情况1：空内容', async () => {
                    render(Manual);
    
                    // 等待页面渲染完成（有题组说明渲染完成）
                    await waitFor(() => {
                        // 泛型匹配（有两个）
                        expect(screen.getAllByText(/测试题组/)).toHaveLength(2);
                    });
    
                    // 获取输入框
                    const input = screen.getByDisplayValue(PAPER_INFO.Name);
    
                    // 验证输入框无样式
                    expect(input).not.toHaveClass("name-warn");
    
                    // 让输入框内容为空
                    fireEvent.input(input, { target: { value: "" } });
    
                    // 验证输入框的内容为空
                    expect(input).toHaveValue("");
    
                    // 验证输入框的样式为name-warn
                    await waitFor(() => {
                        expect(input).toHaveClass("name-warn");
                    });
                });

                it('正常情况2：非空内容', async () => {
                    render(Manual);

                    // 等待页面渲染完成（有题组说明渲染完成）
                    await waitFor(() => {
                        // 泛型匹配（有两个）
                        expect(screen.getAllByText(/测试题组/)).toHaveLength(2);
                    });

                    // mock savePaper接口
                    global.fetch.mockResolvedValueOnce({
                        ok: true,
                        json: () => Promise.resolve({
                            status: 0,
                            msg: "success",
                            API: "/api/paper/manual",
                            method: "PUT"
                        })
                    });
                    
                    // 获取输入框
                    const input = screen.getByDisplayValue(PAPER_INFO.Name);

                    fireEvent.change(input, { target: { value: "测试内容" } });

                    // 验证接口是否被调用
                    await waitFor(() => {
                        expect(global.fetch).toHaveBeenCalled();
                    });
                });

                it('失败情况1：请求失败', async () => {
                    render(Manual);

                    // 等待页面渲染完成（有题组说明渲染完成）
                    await waitFor(() => {
                        // 泛型匹配（有两个）
                        expect(screen.getAllByText(/测试题组/)).toHaveLength(2);
                    });

                    // 获取输入框
                    const input = screen.getByDisplayValue(PAPER_INFO.Name);

                    // 修改mock信息：请求失败
                    global.fetch.mockResolvedValueOnce({
                        ok: false,
                        status: 400
                    });
                    
                    fireEvent.change(input, { target: { value: "测试内容" } });

                    // 验证toast是否被调用
                    await waitFor(() => {
                        expect(toast.error).toHaveBeenCalledWith(`请求失败，状态码：400`, 1000);
                    });
                });

                it('失败情况2：业务错误', async () => {
                    render(Manual);

                    // 等待页面渲染完成（有题组说明渲染完成）
                    await waitFor(() => {
                        // 泛型匹配（有两个）
                        expect(screen.getAllByText(/测试题组/)).toHaveLength(2);
                    });

                    // 修改mock信息：业务错误
                    global.fetch.mockResolvedValueOnce({
                        ok: true,
                        json: () => Promise.resolve({
                            status: -1,
                            msg: "业务错误"
                        })
                    });

                    // 获取输入框
                    const input = screen.getByDisplayValue(PAPER_INFO.Name);

                    fireEvent.change(input, { target: { value: "测试内容" } });

                    // 验证toast是否被调用
                    await waitFor(() => {
                        expect(toast.error).toHaveBeenCalledWith(`业务错误`, 1000);
                    });
                });
            });
            
            it('一键收起', async () => {
                // 使用独立的测试数据
                const SINGLE_PAPER_INFO = {
                    ID: 230,
                    Name: "测试试卷",
                    Category: "00",
                    Level: "00",
                    SuggestedDuration: 66,
                    Description: "我是试卷的说明",
                    Tags: ["测试", "简答", "填空"],
                    TotalScore: 15,
                    QuestionCount: 5,
                    GroupsData: [
                        {
                            id: 1196,
                            name: "测试题组",
                            order: 1,
                            questions: [
                                SINGLE_CHOICE_QUESTION,
                                MULTIPLE_CHOICE_QUESTION,
                                TRUE_FALSE_QUESTION,
                                FILL_BLANK_QUESTION,
                                SHORT_ANSWER_QUESTION
                            ],
                        },
                        {
                            id: 1197,
                            name: "空白题组",
                            order: 2,
                            questions: []
                        }
                    ]
                };

                // 临时mock试卷信息：题组里有全部题型
                    global.fetch.mockResolvedValueOnce({
                        ok: true,
                        json: () => Promise.resolve({
                            API: "/api/paper/manual",
                            data: SINGLE_PAPER_INFO,
                            method: "GET",
                            msg: "success",
                            status: 0
                        })
                    });

                render(Manual);

                // 等待页面渲染完成（有题组说明渲染完成）
                await waitFor(() => {
                    // 泛型匹配（有两个）
                    expect(screen.getAllByText(/测试题组/)).toHaveLength(2);
                });

                // 验证一键收起按钮是否被调用
                const collapseButton = screen.getByText('一键收起');
                fireEvent.click(collapseButton);

                // 验证GROUP_OPEN_STATE里的所有值都为false
                await waitFor(() => {
                    expect(get(GROUP_OPEN_STATE)).toEqual({
                        1196: false,
                        1197: false
                    });
                });

                // 验证QUESTION_OPEN_STATE里的所有值都为false
                await waitFor(() => {
                    expect(get(QUESTION_OPEN_STATE)).toEqual({
                        995: false,
                        996: false,
                        997: false,
                        998: false,
                        999: false
                    });
                });
            });

            describe('预览试卷', () => {
                it('正常情况1：考试', async () => {
                    // Mock window.location
                    const originalLocation = window.location;
                    delete window.location;
                    window.location = {
                        href: '',
                        assign: vi.fn(),
                        replace: vi.fn()
                    };

                    render(Manual);

                    // 等待页面渲染完成（有题组说明渲染完成）
                    await waitFor(() => {
                        // 泛型匹配（有两个）
                        expect(screen.getAllByText(/测试题组/)).toHaveLength(2);
                    });

                    // 修改mock信息：请求成功
                    global.fetch.mockResolvedValueOnce({
                        ok: true,
                        json: () => Promise.resolve({
                            status: 0,
                            msg: "success",
                            API: "/api/paper/manual",
                            method: "GET"
                        })
                    });

                    // 点击预览试卷按钮
                    const previewButton = screen.getByText('预览试卷');
                    fireEvent.click(previewButton);

                    // 验证window.location.href是否被设置
                    await waitFor(() => {
                        expect(window.location.href).toBe("/student/answer/exam");
                    });

                    // 恢复原始 location
                    window.location = originalLocation;
                });

                it('正常情况2：练习', async () => {
                    // Mock window.location
                    const originalLocation = window.location;
                    delete window.location;
                    window.location = {
                        href: '',
                        assign: vi.fn(),
                        replace: vi.fn()
                    };

                    // 使用独立的测试数据
                    const SINGLE_PAPER_INFO = {
                        ID: 230,
                        Name: "测试试卷",
                        Category: "02",
                        Level: "00",
                        SuggestedDuration: 66,
                        Description: "我是试卷的说明",
                        Tags: ["测试", "简答", "填空"],
                        TotalScore: 15,
                        QuestionCount: 5,
                        GroupsData: [
                            {
                                id: 1196,
                                name: "测试题组",
                                order: 1,
                                questions: [
                                    SINGLE_CHOICE_QUESTION,
                                    MULTIPLE_CHOICE_QUESTION,
                                    TRUE_FALSE_QUESTION,
                                    FILL_BLANK_QUESTION,
                                    SHORT_ANSWER_QUESTION
                                ],
                            },
                            {
                                id: 1197,
                                name: "空白题组",
                                order: 2,
                                questions: []
                            }
                        ]
                    };

                    // 临时mock试卷信息
                    global.fetch.mockResolvedValueOnce({
                        ok: true,
                        json: () => Promise.resolve({
                            API: "/api/paper/manual",
                            data: SINGLE_PAPER_INFO,
                            method: "GET",
                            msg: "success",
                            status: 0
                        })
                    });

                    render(Manual);

                    // 等待页面渲染完成（有题组说明渲染完成）
                    await waitFor(() => {
                        // 泛型匹配（有两个）
                        expect(screen.getAllByText(/测试题组/)).toHaveLength(2);
                    });

                    // 修改mock信息：请求成功
                    global.fetch.mockResolvedValueOnce({
                        ok: true,
                        json: () => Promise.resolve({
                            status: 0,
                            msg: "success",
                            API: "/api/paper/manual",
                            method: "GET"
                        })
                    });

                    // 点击预览试卷按钮
                    const previewButton = screen.getByText('预览试卷');
                    fireEvent.click(previewButton);

                    // 验证window.location.href是否被调用
                    await waitFor(() => {   
                        expect(window.location.href).toBe("/student/answer/practice");
                    });

                    // 恢复原始 location
                    window.location = originalLocation;
                });

                it('失败情况1：请求失败', async () => {
                    render(Manual);

                    // 等待页面渲染完成（有题组说明渲染完成）
                    await waitFor(() => {
                        // 泛型匹配（有两个）
                        expect(screen.getAllByText(/测试题组/)).toHaveLength(2);
                    });

                    // 修改mock信息：请求失败
                    global.fetch.mockResolvedValueOnce({
                        ok: false,
                        status: 400
                    });

                    // 点击预览试卷按钮
                    const previewButton = screen.getByText('预览试卷');
                    fireEvent.click(previewButton);

                    // 验证toast是否被调用
                    await waitFor(() => {
                        expect(toast.error).toHaveBeenCalledWith(`请求失败，状态码：400`, 1000);
                    });
                });

                it('失败情况2：业务错误', async () => {
                    render(Manual);

                    // 等待页面渲染完成（有题组说明渲染完成）
                    await waitFor(() => {
                        // 泛型匹配（有两个）
                        expect(screen.getAllByText(/测试题组/)).toHaveLength(2);
                    });

                    // 修改mock信息：业务错误
                    global.fetch.mockResolvedValueOnce({
                        ok: true,
                        json: () => Promise.resolve({
                            status: -1,
                            msg: "业务错误"
                        })
                    });

                    // 点击预览试卷按钮
                    const previewButton = screen.getByText('预览试卷');
                    fireEvent.click(previewButton);

                    // 验证toast是否被调用
                    await waitFor(() => {
                        expect(toast.error).toHaveBeenCalledWith(`业务错误`, 1000);
                    });
                });
            });

            it('从题库中导入', async () => {
                const { container } = render(Manual);

                // 等待页面渲染完成（有题组说明渲染完成）
                await waitFor(() => {
                    // 泛型匹配（有两个）
                    expect(screen.getAllByText(/测试题组/)).toHaveLength(2);
                });

                // 点击从题库中导入按钮
                const importButton = screen.getByText('从题库中导入');
                fireEvent.click(importButton);

                // 验证"题库列表"四个字
                await waitFor(() => {
                    expect(screen.getByText('题库列表')).toBeInTheDocument();
                });

                // 点击关闭按钮
                const closeButton = container.querySelector('.close-import-btn');
                fireEvent.click(closeButton);

                // 验证弹窗是否被关闭
                await waitFor(() => {
                    expect(screen.queryByText('题库列表')).not.toBeInTheDocument();
                });
            });

            it('保存并退出', async () => {
                render(Manual);

                // 等待页面渲染完成（有题组说明渲染完成）
                await waitFor(() => {
                    // 泛型匹配（有两个）
                    expect(screen.getAllByText(/测试题组/)).toHaveLength(2);
                });

                // 修改mock信息：请求成功
                global.fetch.mockResolvedValueOnce({
                    ok: true,
                    json: () => Promise.resolve({
                        status: 0,
                        msg: "success",
                        API: "/api/paper/manual",
                        method: "PUT"
                    })
                });

                // 点击保存并退出按钮
                const saveButton = screen.getByText('保存并退出');
                fireEvent.click(saveButton);

                // 验证goto是否被调用
                await waitFor(() => {
                    expect(goto).toHaveBeenCalledWith('/teacher/paper');
                });
            });

            it('保存', async () => {
                const { container } = render(Manual);

                // 等待页面渲染完成（有题组说明渲染完成）
                await waitFor(() => {
                    // 泛型匹配（有两个）
                    expect(screen.getAllByText(/测试题组/)).toHaveLength(2);
                });

                // 修改mock信息：请求成功
                global.fetch.mockResolvedValueOnce({
                    ok: true,
                    json: () => Promise.resolve({
                        status: 0,
                        msg: "success",
                        API: "/api/paper/manual",
                        method: "PUT"
                    })
                });

                // 获取保存按钮
                const saveButton = container.querySelector('.save-btn');

                // 点击保存按钮
                fireEvent.click(saveButton);

                // 验证toast是否被调用
                await waitFor(() => {
                    expect(toast.success).toHaveBeenCalledWith('试卷内容已保存', 1000);
                });
            });

            it('退出', async () => {
                render(Manual);

                // 等待页面渲染完成（有题组说明渲染完成）
                await waitFor(() => {
                    // 泛型匹配（有两个）
                    expect(screen.getAllByText(/测试题组/)).toHaveLength(2);
                });

                // 修改mock信息：请求成功
                global.fetch.mockResolvedValueOnce({
                    ok: true,
                    json: () => Promise.resolve({
                        status: 0,
                        msg: "success",
                        API: "/api/paper/manual",
                        method: "PUT"
                    })
                });

                // 点击退出按钮
                const exitButton = screen.getByText('退出');
                fireEvent.click(exitButton);

                // 验证弹窗
                await waitFor(() => {
                    expect(screen.getByText('退出确认')).toBeInTheDocument();
                    expect(screen.getByText('请问是否要退出？')).toBeInTheDocument();
                });

                // 点击确定按钮
                const confirmButton = screen.getByText('确定');
                fireEvent.click(confirmButton);

                // 验证goto是否被调用
                await waitFor(() => {
                    expect(goto).toHaveBeenCalledWith('/teacher/paper');
                });
            });
        });
    });

    describe('下半区', () => {
        describe('侧边栏', () => {
            it('渲染', async () => {
                // 使用独立的测试数据
                const SINGLE_PAPER_INFO = {
                    ID: 230,
                    Name: "测试试卷",
                    Category: "00",
                    Level: "00",
                    SuggestedDuration: 66,
                    Description: "我是试卷的说明",
                    Tags: ["测试", "简答", "填空"],
                    TotalScore: 15,
                    QuestionCount: 5,
                    GroupsData: [
                        {
                            id: 1196,
                            name: "测试题组",
                            order: 1,
                            questions: [
                                SINGLE_CHOICE_QUESTION,
                                MULTIPLE_CHOICE_QUESTION,
                                TRUE_FALSE_QUESTION,
                                FILL_BLANK_QUESTION,
                                SHORT_ANSWER_QUESTION
                            ],
                        },
                        {
                            id: 1197,
                            name: "空白题组",
                            order: 2,
                            questions: []
                        }
                    ]
                };

                // 临时mock试卷信息
                global.fetch.mockResolvedValueOnce({
                    ok: true,
                    json: () => Promise.resolve({
                        status: 0,
                        msg: "success",
                        API: "/api/paper/manual",
                        method: "GET",
                        data: SINGLE_PAPER_INFO,
                    })
                });

                const { container } = render(Manual);

                // 等待页面渲染完成（有题组说明渲染完成）
                await waitFor(() => {
                    // 泛型匹配（有两个：一个在侧边栏，一个在内容区）
                    expect(screen.getAllByText(/测试题组/)).toHaveLength(2);
                });

                // 试卷信息标题
                expect(screen.getByText('试卷信息')).toBeInTheDocument();

                // 试卷用途
                expect(screen.getByText('试卷用途')).toBeInTheDocument();

                // 试卷用途下拉栏
                const examButton = screen.getByText('考试');
                fireEvent.click(examButton);

                await waitFor(() => {
                    const practiceButton = screen.getByText('练习');
                });

                // 试卷难度
                expect(screen.getByText('试卷难度')).toBeInTheDocument();
                
                // 验证有三个难度选项容器
                expect(container.querySelectorAll('.single-level')).toHaveLength(3);
                
                // 验证试卷难度选择区域有三个radio按钮
                const difficultyContainer = container.querySelector('.level-container');
                expect(difficultyContainer).toBeInTheDocument();
                expect(difficultyContainer.querySelectorAll('input[type="radio"]')).toHaveLength(3);
                
                // 验证默认选中"简单"选项
                const simpleRadio = difficultyContainer.querySelector('input[value="00"]');
                expect(simpleRadio).toBeChecked();
                
                // 验证其他选项未被选中
                const mediumRadio = difficultyContainer.querySelector('input[value="02"]');
                const hardRadio = difficultyContainer.querySelector('input[value="04"]');
                expect(mediumRadio).not.toBeChecked();
                expect(hardRadio).not.toBeChecked();

                // 建议时长
                expect(screen.getByText('建议时长')).toBeInTheDocument();
                expect(screen.getByText('分钟')).toBeInTheDocument();

                // 验证输入框内容为PAPER_INFO.SuggestedDuration
                expect(screen.getByDisplayValue(PAPER_INFO.SuggestedDuration)).toBeInTheDocument();

                // 试卷总分
                expect(screen.getByText('试卷总分')).toBeInTheDocument();

                // 验证total-score-number类的存在
                expect(container.querySelector('.total-score-number')).toBeInTheDocument();

                // 验证total-score-span类的存在
                expect(container.querySelector('.total-score-span')).toBeInTheDocument();

                // 试题数量
                expect(screen.getByText('试题数量')).toBeInTheDocument();

                // 验证question-count-number类的存在
                expect(container.querySelector('.question-count-number')).toBeInTheDocument();

                // 验证question-count-span类的存在
                expect(container.querySelector('.question-count-span')).toBeInTheDocument();

                expect(screen.getByText('试卷说明')).toBeInTheDocument();

                // 验证textarea的内容为PAPER_INFO.Description
                expect(screen.getByDisplayValue(PAPER_INFO.Description)).toBeInTheDocument();

                expect(screen.getByText('试卷标签')).toBeInTheDocument();

                // 验证tag-container类的存在
                expect(container.querySelector('.tags-container')).toBeInTheDocument();

                // 验证tag-container里的paper-tag类的存在
                expect(container.querySelector('.paper-tag')).toBeInTheDocument();

                // 验证tag-container里的color-block类的存在
                expect(container.querySelector('.color-block')).toBeInTheDocument();

                // 验证paper-tag有4个
                expect(container.querySelectorAll('.paper-tag')).toHaveLength(4);

                // 验证标题"题组列表"
                expect(screen.getByText('题组列表')).toBeInTheDocument();

                // 验证group-count类的存在
                expect(container.querySelector('.group-count')).toBeInTheDocument();

                // 验证"添加题组"按钮
                expect(screen.getByText('添加题组')).toBeInTheDocument();

                // 验证"测试题组（共5题，共15分）"有两个
                expect(screen.getAllByText('测试题组（共5题，共15分）')).toHaveLength(2);

                // 验证"空白题组（共0题，共0分）"有两个
                expect(screen.getAllByText('空白题组（共0题，共0分）')).toHaveLength(2);    
            });

            describe('交互', () => {
                describe('试卷标签', () => {
                    it('创建标签', async () => {
                        const { container } = render(Manual);

                        // 等待页面渲染完成（有题组说明渲染完成）
                        await waitFor(() => {
                            // 泛型匹配（有两个）
                            expect(screen.getAllByText(/测试题组/)).toHaveLength(2);
                        });

                        // 获取第一个标签，用class为paper-tag的div
                        const paperTag = container.querySelectorAll('.paper-tag')[0];

                        // 获取第一个标签，用placeholder为"+标签"的input
                        const input = paperTag.querySelector('input');

                        // 验证当前输入框为空
                        expect(input).toHaveValue('');

                        // 获取第一个color-block类元素(container.querySelector)
                        const colorBlock = container.querySelectorAll('.color-block')[0];

                        // 验证color-block含有style:background-color: #40d5ff
                        expect(colorBlock).toHaveStyle('background-color: #40d5ff');

                        // 输入"测试标签"
                        fireEvent.input(input, { target: { value: '测试标签' } });

                        // 验证color-block不含有style:background-color: #40d5ff
                        await waitFor(() => {
                            expect(colorBlock).not.toHaveStyle('background-color: #40d5ff');
                        });

                        // 触发change事件来调用addTag函数
                        fireEvent.change(input, { target: { value: '测试标签' } });

                        // 验证第一个标签内容清空
                        await waitFor(() => {
                            expect(input).toHaveValue('');
                        });

                        // 验证标签有5个
                        await waitFor(() => {
                            expect(container.querySelectorAll('.paper-tag')).toHaveLength(5);
                        });
                    });

                    it('取消创建标签', async () => {
                        const { container } = render(Manual);

                        // 等待页面渲染完成（有题组说明渲染完成）
                        await waitFor(() => {
                            // 泛型匹配（有两个）
                            expect(screen.getAllByText(/测试题组/)).toHaveLength(2);
                        });

                        // 获取第一个标签，用class为paper-tag的div
                        const paperTag = container.querySelectorAll('.paper-tag')[0];

                        // 获取第一个标签，用placeholder为"+标签"的input
                        const input = paperTag.querySelector('input');

                        // 验证当前输入框为空
                        expect(input).toHaveValue('');
                        
                        // 输入测试内容
                        fireEvent.input(input, { target: { value: '测试内容' } });

                        // 点击"✕"按钮
                        const cancelButton = screen.getAllByTitle('取消')[0];
                        fireEvent.mouseDown(cancelButton);

                        // 验证输入框为空
                        await waitFor(() => {
                            expect(input).toHaveValue('');
                        });
                    });

                    it('删除标签', async () => {
                        const { container } = render(Manual);

                        // 等待页面渲染完成（有题组说明渲染完成）
                        await waitFor(() => {
                            // 泛型匹配（有两个）
                            expect(screen.getAllByText(/测试题组/)).toHaveLength(2);
                        });

                        // 获取第二个标签，用class为paper-tag的div
                        const paperTag = container.querySelectorAll('.paper-tag')[1];

                        // 获取第二个标签，用class为paper-tag-input的input
                        const input = paperTag.querySelector('input');

                        // 验证当前输入框为"测试"
                        expect(input).toHaveValue('测试');

                        // 验证第二个标签的color-block不含有style:background-color: #40d5ff
                        await waitFor(() => {
                            expect(container.querySelectorAll('.color-block')[1]).not.toHaveStyle('background-color: #40d5ff');
                        });

                        // 清空input
                        fireEvent.input(input, { target: { value: '' } });

                        // 验证第二个标签的color-block含有style:background-color: #40d5ff
                        await waitFor(() => {
                            expect(container.querySelectorAll('.color-block')[1]).toHaveStyle('background-color: #40d5ff');
                        });

                        // 回车
                        fireEvent.keyDown(input, { key: 'Enter', code: 'Enter' });

                        // blur
                        fireEvent.blur(input);

                        // 验证标签有3个
                        await waitFor(() => {
                            expect(container.querySelectorAll('.paper-tag')).toHaveLength(3);
                        });
                    });

                    it('修改标签', async () => {
                        const { container } = render(Manual);

                        // 等待页面渲染完成（有题组说明渲染完成）
                        await waitFor(() => {
                            // 泛型匹配（有两个）
                            expect(screen.getAllByText(/测试题组/)).toHaveLength(2);
                        });

                        // 获取第二个标签，用class为paper-tag的div
                        const paperTag = container.querySelectorAll('.paper-tag')[1];

                        // 获取第二个标签，用class为paper-tag-input的input
                        const input = paperTag.querySelector('input');

                        // 验证当前输入框为"测试"
                        expect(input).toHaveValue('测试');

                        // 输入"测试标签"
                        fireEvent.input(input, { target: { value: '测试标签' } });

                        // blur
                        fireEvent.blur(input);

                        // 验证第二个标签内容为"测试标签"
                        await waitFor(() => {
                            expect(input).toHaveValue('测试标签');
                        });
                    });
                });

                describe('题组列表', () => {
                    it('添加题组 & 取消添加', async () => {
                        const { container } = render(Manual);

                        // 等待页面渲染完成（有题组说明渲染完成）
                        await waitFor(() => {
                            // 泛型匹配（有两个）
                            expect(screen.getAllByText(/测试题组/)).toHaveLength(2);
                        });

                        // 点击"添加题组"按钮
                        const addGroupButton = screen.getByText('添加题组');
                        fireEvent.click(addGroupButton);
                        
                        // 验证add-group类的存在
                        await waitFor(() => {
                            expect(container.querySelector('.add-group')).toBeInTheDocument();
                        });

                        // 获取input
                        const input = container.querySelector('.add-group-input');

                        // 清空input
                        fireEvent.change(input, { target: { value: '' } });

                        // blur
                        fireEvent.blur(input);

                        // 验证add-group类不存在
                        await waitFor(() => {
                            expect(container.querySelector('.add-group')).not.toBeInTheDocument();
                        });
                    });

                    it('确认添加题组', async () => {
                        const { container } = render(Manual);

                        // 等待页面渲染完成（有题组说明渲染完成）
                        await waitFor(() => {
                            // 泛型匹配（有两个）
                            expect(screen.getAllByText(/测试题组/)).toHaveLength(2);
                        });

                        // 点击"添加题组"按钮
                        const addGroupButton = screen.getByText('添加题组');
                        fireEvent.click(addGroupButton);

                        // 验证add-group类的存在
                        await waitFor(() => {
                            expect(container.querySelector('.add-group')).toBeInTheDocument();
                        });

                        // 输入"新增测试题组"
                        const input = container.querySelector('.add-group-input');
                        fireEvent.input(input, { target: { value: '新增测试题组' } });
                        fireEvent.change(input, { target: { value: '新增测试题组' } });

                        // 验证toast.success
                        await waitFor(() => {
                            expect(toast.success).toHaveBeenCalledWith('添加成功', 1000);
                        });
                    });

                    it('删除题组', async () => {
                        // 使用独立的测试数据
                        const SINGLE_PAPER_INFO = {
                            ID: 230,
                            Name: "测试试卷",
                            Category: "00",
                            Level: "00",
                            SuggestedDuration: 66,
                            Description: "我是试卷的说明",
                            Tags: ["测试", "简答", "填空"],
                            TotalScore: 15,
                            QuestionCount: 5,
                            GroupsData: [
                                {
                                    id: 1196,
                                    name: "测试题组",
                                    order: 1,
                                    questions: [
                                        SINGLE_CHOICE_QUESTION,
                                        MULTIPLE_CHOICE_QUESTION,
                                        TRUE_FALSE_QUESTION,
                                    ],
                                },
                                {
                                    id: 1197,
                                    name: "空白题组",
                                    order: 2,
                                    questions: [
                                        FILL_BLANK_QUESTION,
                                        SHORT_ANSWER_QUESTION
                                    ]
                                }
                            ]
                        };

                        // 临时mock试卷信息
                        global.fetch.mockResolvedValueOnce({
                            ok: true,
                            json: () => Promise.resolve({
                                status: 0,
                                msg: "success",
                                API: "/api/paper/manual",
                                method: "GET",
                                data: SINGLE_PAPER_INFO,
                            })
                        });

                        const { container } = render(Manual);

                        // 等待页面渲染完成（有题组说明渲染完成）
                        await waitFor(() => {
                            // 泛型匹配（有两个）
                            expect(screen.getAllByText(/测试题组/)).toHaveLength(2);
                        });

                        // 点击第一个"删除"按钮（用class为delete-group-btn的button）
                        const deleteButton = container.querySelectorAll('.delete-group-btn')[0];
                        fireEvent.click(deleteButton);

                        // 验证弹窗
                        await waitFor(() => {
                            expect(screen.getByText('删除确认')).toBeInTheDocument();
                            expect(screen.getByText('请问是否要删除该题组？')).toBeInTheDocument();
                        });

                        // 点击"确定"按钮
                        const confirmButton = screen.getByText('确定');
                        fireEvent.click(confirmButton);

                        // 验证toast.success
                        await waitFor(() => {
                            expect(toast.success).toHaveBeenCalledWith('删除成功', 1000);
                        });

                        // 重新获取第一个"删除"按钮
                        const deleteButton2 = container.querySelectorAll('.delete-group-btn')[0];
                        fireEvent.click(deleteButton2);

                        // 验证最后一个题组不能被删除
                        await waitFor(() => {
                            expect(toast.error).toHaveBeenCalledWith('至少保留一个题组', 1000);
                        });
                    });

                    it('编辑题组', async () => {
                        const { container } = render(Manual);

                        // 等待页面渲染完成（有题组说明渲染完成）
                        await waitFor(() => {
                            // 泛型匹配（有两个）
                            expect(screen.getAllByText(/测试题组/)).toHaveLength(2);
                        });

                        // 点击"编辑"按钮（用class为edit-group-btn的button）
                        const editButton = container.querySelector('.edit-group-btn');
                        fireEvent.click(editButton);

                        // 验证edit-group类的存在
                        await waitFor(() => {
                            expect(container.querySelector('.edit-group')).toBeInTheDocument();
                        });

                        // 获取input
                        const input = container.querySelector('.add-group-input');

                        // 输入"测试题组"
                        fireEvent.change(input, { target: { value: '测试题组' } });

                        // blur
                        fireEvent.blur(input);

                        // 验证add-group类不存在
                        await waitFor(() => {
                            expect(container.querySelector('.add-group')).not.toBeInTheDocument();
                        });
                    });

                    describe('拖拽题组', () => {
                        describe('正常情况', () => {
                            it('正常下移', async () => {
                                // 使用独立的测试数据
                                const SINGLE_PAPER_INFO = {
                                    ID: 230,
                                    Name: "测试试卷",
                                    Category: "00",
                                    Level: "00",
                                    SuggestedDuration: 66,
                                    Description: "我是试卷的说明",
                                    Tags: ["测试", "简答", "填空"],
                                    TotalScore: 15,
                                    QuestionCount: 5,
                                    GroupsData: [
                                        {
                                            id: 1196,
                                            name: "移动题组1",
                                            order: 1,
                                            questions: [],
                                        },
                                        {
                                            id: 1197,
                                            name: "移动题组2",
                                            order: 2,
                                            questions: []
                                        }
                                    ]
                                };
        
                                // 临时mock试卷信息
                                global.fetch.mockResolvedValueOnce({
                                    ok: true,
                                    json: () => Promise.resolve({
                                        status: 0,
                                        msg: "success",
                                        API: "/api/paper/manual",
                                        method: "GET",
                                        data: SINGLE_PAPER_INFO,
                                    })
                                });
        
                                const { container } = render(Manual);
        
                                // 等待页面渲染完成（有题组说明渲染完成）
                                await waitFor(() => {
                                    // 泛型匹配（有两个）
                                    expect(screen.getAllByText(/移动题组1/)).toHaveLength(2);
                                    expect(screen.getAllByText(/移动题组2/)).toHaveLength(2);
                                });
        
                                // 假的 dataTransfer
                                const dataTransfer = {
                                    effectAllowed: "",
                                    setData: vi.fn(),
                                    getData: vi.fn(),
                                };
        
                                // 定位到题组列表的div
                                const groupList = container.querySelector('.question-groups-outer-box');
        
                                // 获取第一个题组和第二个题组
                                const group1 = groupList.querySelectorAll('.single-group')[0];
                                const group2 = groupList.querySelectorAll('.single-group')[1];
        
                                // 验证第一个题组是"移动题组1"
                                expect(group1.textContent).toContain('移动题组1（共0题，共0分）');
        
                                // 验证第二个题组是"移动题组2"
                                expect(group2.textContent).toContain('移动题组2（共0题，共0分）');
        
                                // mock返回结果
                                global.fetch.mockResolvedValueOnce({
                                    ok: true,
                                    json: () => Promise.resolve({
                                        API: "/api/paper/manual",
                                        method: "PUT",
                                        msg: "success",
                                        status: 0,
                                    })
                                });
        
                                // 使用独立的测试数据
                                const SINGLE_PAPER_INFO2 = {
                                    ID: 230,
                                    Name: "测试试卷",
                                    Category: "00",
                                    Level: "00",
                                    SuggestedDuration: 66,
                                    Description: "我是试卷的说明",
                                    Tags: ["测试", "简答", "填空"],
                                    TotalScore: 15,
                                    QuestionCount: 5,
                                    GroupsData: [
                                        {
                                            id: 1197,
                                            name: "移动题组2",
                                            order: 1,
                                            questions: []
                                        },
                                        {
                                            id: 1196,
                                            name: "移动题组1",
                                            order: 2,
                                            questions: [],
                                        },
                                    ]
                                };
        
                                // 临时mock试卷信息
                                global.fetch.mockResolvedValueOnce({
                                    ok: true,
                                    json: () => Promise.resolve({
                                        status: 0,
                                        msg: "success",
                                        API: "/api/paper/manual",
                                        method: "GET",
                                        data: SINGLE_PAPER_INFO2,
                                    })
                                });
        
                                // 拖拽第一个题组到第二个题组下方
                                fireEvent.dragStart(group1, { dataTransfer });
                                fireEvent.dragOver(group2,
                                    {
                                        clientY: group2.getBoundingClientRect().top + group2.getBoundingClientRect().height * 0.9,
                                        dataTransfer
                                    });
                                fireEvent.drop(group2, { dataTransfer });
    
                                // 获取第一个题组和第二个题组
                                const group1After = groupList.querySelectorAll('.single-group')[0];
                                const group2After = groupList.querySelectorAll('.single-group')[1];
    
                                // 验证第一个题组是"移动题组2"
                                await waitFor(() => {
                                    expect(group1After.textContent).toContain('移动题组2（共0题，共0分）');
                                    expect(group2After.textContent).toContain('移动题组1（共0题，共0分）');
                                });
                            });
    
                            it('正常上移', async () => {
                                // 使用独立的测试数据
                                const SINGLE_PAPER_INFO = {
                                    ID: 230,
                                    Name: "测试试卷",
                                    Category: "00",
                                    Level: "00",
                                    SuggestedDuration: 66,
                                    Description: "我是试卷的说明",
                                    Tags: ["测试", "简答", "填空"],
                                    TotalScore: 15,
                                    QuestionCount: 5,
                                    GroupsData: [
                                        {
                                            id: 1196,
                                            name: "移动题组1",
                                            order: 1,
                                            questions: [
                                                SINGLE_CHOICE_QUESTION
                                            ],
                                        },
                                        {
                                            id: 1197,
                                            name: "移动题组2",
                                            order: 2,
                                            questions: []
                                        }
                                    ]
                                };
        
                                // 临时mock试卷信息
                                global.fetch.mockResolvedValueOnce({
                                    ok: true,
                                    json: () => Promise.resolve({
                                        status: 0,
                                        msg: "success",
                                        API: "/api/paper/manual",
                                        method: "GET",
                                        data: SINGLE_PAPER_INFO,
                                    })
                                });
        
                                const { container } = render(Manual);
        
                                // 等待页面渲染完成（有题组说明渲染完成）
                                await waitFor(() => {
                                    // 泛型匹配（有两个）
                                    expect(screen.getAllByText(/移动题组1/)).toHaveLength(2);
                                    expect(screen.getAllByText(/移动题组2/)).toHaveLength(2);
                                });
        
                                // 假的 dataTransfer
                                const dataTransfer = {
                                    effectAllowed: "",
                                    setData: vi.fn(),
                                    getData: vi.fn(),
                                };
        
                                // 定位到题组列表的div
                                const groupList = container.querySelector('.question-groups-outer-box');
        
                                // 获取第一个题组和第二个题组
                                const group1 = groupList.querySelectorAll('.single-group')[0];
                                const group2 = groupList.querySelectorAll('.single-group')[1];
        
                                // 验证第一个题组是"移动题组1"
                                expect(group1.textContent).toContain('移动题组1（共1题，共2分）');
        
                                // 验证第二个题组是"移动题组2"
                                expect(group2.textContent).toContain('移动题组2（共0题，共0分）');
        
                                // mock返回结果
                                global.fetch.mockResolvedValueOnce({
                                    ok: true,
                                    json: () => Promise.resolve({
                                        API: "/api/paper/manual",
                                        method: "PUT",
                                        msg: "success",
                                        status: 0,
                                    })
                                });
        
                                // 使用独立的测试数据
                                const SINGLE_PAPER_INFO2 = {
                                    ID: 230,
                                    Name: "测试试卷",
                                    Category: "00",
                                    Level: "00",
                                    SuggestedDuration: 66,
                                    Description: "我是试卷的说明",
                                    Tags: ["测试", "简答", "填空"],
                                    TotalScore: 15,
                                    QuestionCount: 5,
                                    GroupsData: [
                                        {
                                            id: 1197,
                                            name: "移动题组2",
                                            order: 1,
                                            questions: []
                                        },
                                        {
                                            id: 1196,
                                            name: "移动题组1",
                                            order: 2,
                                            questions: [
                                                SINGLE_CHOICE_QUESTION
                                            ],
                                        },
                                    ]
                                };
        
                                // 临时mock试卷信息
                                global.fetch.mockResolvedValueOnce({
                                    ok: true,
                                    json: () => Promise.resolve({
                                        status: 0,
                                        msg: "success",
                                        API: "/api/paper/manual",
                                        method: "GET",
                                        data: SINGLE_PAPER_INFO2,
                                    })
                                });
        
                                // 拖拽第二个题组到第一个题组上方
                                fireEvent.dragStart(group2, { dataTransfer });
                                fireEvent.dragOver(group1,
                                    {
                                        clientY: group1.getBoundingClientRect().top + group1.getBoundingClientRect().height * 0.1,
                                        dataTransfer
                                    });
                                fireEvent.drop(group1, { dataTransfer });
    
                                // 获取第一个题组和第二个题组
                                const group1After = groupList.querySelectorAll('.single-group')[0];
                                const group2After = groupList.querySelectorAll('.single-group')[1];
    
                                // 验证第一个题组是"移动题组2"
                                await waitFor(() => {
                                    expect(group1After.textContent).toContain('移动题组2（共0题，共0分）');
                                    expect(group2After.textContent).toContain('移动题组1（共1题，共2分）');
                                });
                            });
                        });
                        
                        it('拖拽到自身', async () => {
                            // 使用独立的测试数据
                            const SINGLE_PAPER_INFO = {
                                ID: 230,
                                Name: "测试试卷",
                                Category: "00",
                                Level: "00",
                                SuggestedDuration: 66,
                                Description: "我是试卷的说明",
                                Tags: ["测试", "简答", "填空"],
                                TotalScore: 15,
                                QuestionCount: 5,
                                GroupsData: [
                                    {
                                        id: 1196,
                                        name: "移动题组1",
                                        order: 1,
                                        questions: [
                                            SINGLE_CHOICE_QUESTION,
                                        ],
                                    },
                                    {
                                        id: 1197,
                                        name: "移动题组2",
                                        order: 2,
                                        questions: [],
                                    },
                                ]
                            };

                            // 临时mock试卷信息
                            global.fetch.mockResolvedValueOnce({
                                ok: true,
                                json: () => Promise.resolve({
                                    status: 0,
                                    msg: "success",
                                    API: "/api/paper/manual",
                                    method: "GET",
                                    data: SINGLE_PAPER_INFO,
                                })
                            });

                            const { container } = render(Manual);

                            // 等待页面渲染完成（有题组说明渲染完成）
                            await waitFor(() => {
                                expect(screen.getAllByText(/移动题组1/)).toHaveLength(2);
                            });

                            // 定位到题组列表的div
                            const groupList = container.querySelector('.question-groups-outer-box');
                            const group1 = groupList.querySelectorAll('.single-group')[0];

                            const dataTransfer = {
                                effectAllowed: "",
                                setData: vi.fn(),
                                getData: vi.fn(),
                            };

                            // 拖拽第一个题组到自身
                            fireEvent.dragStart(group1, { dataTransfer });
                            fireEvent.dragOver(group1, { dataTransfer });
                            fireEvent.drop(group1, { dataTransfer });
                        });
                    });
                });
            });
        });

        describe('侧边栏收起', () => {
            it('渲染', async () => {
                // 验证SIDEBAR_COLLAPSED为false
                expect(get(SIDEBAR_COLLAPSED)).toBe(false);

                const { container } = render(Manual);

                // 等待页面渲染完成（有题组说明渲染完成）
                await waitFor(() => {
                    // 泛型匹配（有两个）
                    expect(screen.getAllByText(/测试题组/)).toHaveLength(2);
                });

                // 验证SIDEBAR_COLLAPSED为true
                expect(get(SIDEBAR_COLLAPSED)).toBe(true);

                // 验证sidebar-collapsed-btn类存在
                expect(container.querySelector('.sidebar-collapsed-btn')).toBeInTheDocument();

                // 验证sidebar-collapsed-btn的title为"展开"
                expect(container.querySelector('.sidebar-collapsed-btn').title).toBe("展开");
            });

            it('降级方案：不支持ResizeObserver', async () => {
                const addEventListenerSpy = vi.spyOn(window, 'addEventListener');

                global.ResizeObserver = undefined; // 临时覆盖
                
                const { container } = render(Manual);

                // 等待页面渲染完成（有题组说明渲染完成）
                await waitFor(() => {
                    // 泛型匹配（有两个）
                    expect(screen.getAllByText(/测试题组/)).toHaveLength(2);
                });

                // 验证addEventListener
                expect(addEventListenerSpy).toHaveBeenCalledWith('resize', expect.any(Function));

                // 测试结束后恢复
                global.ResizeObserver = class {
                    constructor(callback) { this.callback = callback; }
                    observe() {}
                    unobserve() {}
                    disconnect() {}
                };

                // 清理 spy
                addEventListenerSpy.mockRestore();
            });

            it('监听器', async () => {
                // 验证window.innerWidth小于1200
                expect(window.innerWidth).toBeLessThan(1200);

                window.innerWidth = 1201;

                // 验证window.innerWidth大于1200
                expect(window.innerWidth).toBeGreaterThan(1200);

                SIDEBAR_COLLAPSED.set(true);

                const { container } = render(Manual);

                // 等待页面渲染完成（有题组说明渲染完成）
                await waitFor(() => {
                    // 泛型匹配（有两个）
                    expect(screen.getAllByText(/测试题组/)).toHaveLength(2);
                });

                // 验证SIDEBAR_COLLAPSED为false
                expect(get(SIDEBAR_COLLAPSED)).toBe(false);
            });
        });

        describe('内容区', () => {
            it('渲染', async () => {
                // 使用独立的测试数据
                const SINGLE_PAPER_INFO = {
                    ID: 230,
                    Name: "测试试卷",
                    Category: "00",
                    Level: "00",
                    SuggestedDuration: 66,
                    Description: "我是试卷的说明",
                    Tags: ["测试", "简答", "填空"],
                    TotalScore: 15,
                    QuestionCount: 5,
                    GroupsData: [
                        {
                            id: 1196,
                            name: "测试题组",
                            order: 1,
                            questions: [
                                SINGLE_CHOICE_QUESTION,
                                MULTIPLE_CHOICE_QUESTION,
                                TRUE_FALSE_QUESTION,
                                FILL_BLANK_QUESTION,
                                SHORT_ANSWER_QUESTION
                            ],
                        },
                        
                        {
                            id: 1197,
                            name: "空白题组",
                            order: 2,
                            questions: []
                        }
                    ]
                };

                // 临时mock试卷信息
                global.fetch.mockResolvedValueOnce({
                    ok: true,
                    json: () => Promise.resolve({
                        status: 0,
                        msg: "success",
                        API: "/api/paper/manual",
                        method: "GET",
                        data: SINGLE_PAPER_INFO,
                    })
                });

                const { container } = render(Manual);

                // 等待页面渲染完成（有题组说明渲染完成）
                await waitFor(() => {
                    // 泛型匹配（有两个）
                    expect(screen.getAllByText(/测试题组/)).toHaveLength(2);
                });

                // 验证group-header类的存在
                expect(container.querySelector('.group-header')).toBeInTheDocument();

                // 验证group-question-list类的存在
                expect(container.querySelector('.group-question-list')).toBeInTheDocument();

                // 点击一键展开
                const expandAllButton = screen.getByText('一键展开');
                fireEvent.click(expandAllButton);

                expect(container.querySelector('.question-header')).toBeInTheDocument();

                // 验证content类的存在
                await waitFor(() => {
                    expect(container.querySelector('.content')).toBeInTheDocument();
                });

                // 验证"每题分值："有2个（用getbytext）
                expect(screen.getAllByText('每题分值：')).toHaveLength(2);

                // 验证"分值："有2个
                expect(screen.getAllByText('分值：')).toHaveLength(5);

                // 验证"导入题目"有3个
                expect(screen.getAllByText('导入题目')).toHaveLength(3);

                // 验证"题组暂无题目"
                expect(screen.getByText('题组暂无题目')).toBeInTheDocument();
                expect(screen.getByText('可以通过以下方式快速添加题目：')).toBeInTheDocument();

                // 验证easy-level类的存在
                expect(container.querySelector('.easy-level')).toBeInTheDocument();
                expect(container.querySelector('.normal-level')).toBeInTheDocument();
                expect(container.querySelector('.hard-level')).toBeInTheDocument();

                // 验证question-type类有5个
                expect(container.querySelectorAll('.question-type')).toHaveLength(5);

                // 验证title为"上移"的button有5个
                expect(container.querySelectorAll('button[title="上移"]')).toHaveLength(7);

                // 验证title为"下移"的button有5个
                expect(container.querySelectorAll('button[title="下移"]')).toHaveLength(7);
            });

            describe('交互', () => {
                it('切换展开状态', async () => {
                    // 使用独立的测试数据
                    const SINGLE_PAPER_INFO = {
                        ID: 230,
                        Name: "测试试卷",
                        Category: "00",
                        Level: "00",
                        SuggestedDuration: 66,
                        Description: "我是试卷的说明",
                        Tags: ["测试", "简答", "填空"],
                        TotalScore: 15,
                        QuestionCount: 5,
                        GroupsData: [
                            {
                                id: 1196,
                                name: "测试题组",
                                order: 1,
                                questions: [
                                    SINGLE_CHOICE_QUESTION,
                                    MULTIPLE_CHOICE_QUESTION,
                                    TRUE_FALSE_QUESTION,
                                    FILL_BLANK_QUESTION,
                                    SHORT_ANSWER_QUESTION
                                ],
                            },
                            {
                                id: 1197,
                                name: "空白题组",
                                order: 2,
                                questions: []
                            }
                        ]
                    };

                    // 临时mock试卷信息
                    global.fetch.mockResolvedValueOnce({
                        ok: true,
                        json: () => Promise.resolve({
                            status: 0,
                            msg: "success",
                            API: "/api/paper/manual",
                            method: "GET",
                            data: SINGLE_PAPER_INFO,
                        })
                    });

                    // 渲染页面
                    const { container } = render(Manual);

                    // 等待页面渲染完成（有题组说明渲染完成）
                    await waitFor(() => {
                        // 泛型匹配（有两个）
                        expect(screen.getAllByText(/测试题组/)).toHaveLength(2);
                    });

                    // 验证GROUP_OPEN_STATE为全展开
                    expect(get(GROUP_OPEN_STATE)).toEqual({
                        1196: true,
                        1197: true
                    });

                    // 验证QUESTION_OPEN_STATE为全展开
                    expect(get(QUESTION_OPEN_STATE)).toEqual({
                        995: true,
                        996: true,
                        997: true,
                        998: true,
                        999: true,
                    });

                    // 获取第一个question-header类
                    const questionHeader = container.querySelectorAll('.question-header')[0];

                    // 获取questionHeader里的header-left类
                    const headerLeft = questionHeader.querySelector('.header-left');
                    fireEvent.click(headerLeft);

                    expect(get(QUESTION_OPEN_STATE)).toEqual({
                        995: false,
                        996: true,
                        997: true,
                        998: true,
                        999: true,
                    });

                    // 点击第一个group-header类
                    const groupHeader = container.querySelectorAll('.group-header')[0];
                    fireEvent.click(groupHeader);

                    // 验证GROUP_OPEN_STATE为{1196: false}
                    expect(get(GROUP_OPEN_STATE)).toEqual({
                        1196: false,
                        1197: true
                    });
                });

                describe('移动', () => {
                    describe('题组', () => {
                        it('边界情况', async () => {
                            // 渲染页面
                            const { container } = render(Manual);

                            // 等待页面渲染完成（有题组说明渲染完成）
                            await waitFor(() => {
                                // 泛型匹配（有两个）
                                expect(screen.getAllByText(/测试题组/)).toHaveLength(2);
                            });
                            
                            // 验证group-header类有2个
                            expect(container.querySelectorAll('.group-header')).toHaveLength(1);
                            
                            // 获取第一个group-header类
                            const groupHeader = container.querySelectorAll('.group-header')[0];

                            // 验证里面有"测试题组（共5题，共15分）"
                            expect(groupHeader.textContent).toContain("测试题组（共0题，共0分）");

                            // 获取第一个group-header里的title为"上移"的button
                            const moveBtn = groupHeader.querySelector('button[title="上移"]');
                            
                            // 点击moveBtn
                            fireEvent.click(moveBtn);

                            // 验证toast.error被调用
                            await waitFor(() => {
                                expect(toast.error).toHaveBeenCalledWith("已经是第一个题组", 1000);
                            });

                            // 获取groupHeader里的title为"下移"的button
                            const moveBtn2 = groupHeader.querySelector('button[title="下移"]');

                            // 点击moveBtn2
                            fireEvent.click(moveBtn2);
                            
                            // 验证toast.error被调用
                            await waitFor(() => {
                                expect(toast.error).toHaveBeenCalledWith("已经是最后一个题组", 1000);
                            });
                        });

                        describe('正常情况', () => {
                            it('下移', async () => {
                                // 使用独立的测试数据
                                const SINGLE_PAPER_INFO = {
                                    ID: 230,
                                    Name: "测试试卷",
                                    Category: "00",
                                    Level: "00",
                                    GroupsData: [
                                        {
                                            id: 1196,
                                            name: "测试题组",
                                            order: 1,
                                            questions: [
                                                SINGLE_CHOICE_QUESTION,
                                                MULTIPLE_CHOICE_QUESTION,
                                                TRUE_FALSE_QUESTION,
                                                FILL_BLANK_QUESTION,
                                                SHORT_ANSWER_QUESTION
                                            ],
                                        },
                                        
                                        {
                                            id: 1197,
                                            name: "空白题组",
                                            order: 2,
                                            questions: []
                                        }
                                    ]
                                };

                                // 临时mock试卷信息
                                global.fetch.mockResolvedValueOnce({
                                    ok: true,
                                    json: () => Promise.resolve({
                                        status: 0,
                                        msg: "success",
                                        API: "/api/paper/manual",
                                        method: "GET",
                                        data: SINGLE_PAPER_INFO,
                                    })
                                });

                                // 渲染页面
                                const { container } = render(Manual);

                                // 等待页面渲染完成（有题组说明渲染完成）
                                await waitFor(() => {
                                    // 泛型匹配（有两个）
                                    expect(screen.getAllByText(/测试题组/)).toHaveLength(2);
                                });

                                // 获取第一个group-header类
                                const groupHeader = container.querySelectorAll('.group-header')[0];

                                // 获取groupHeader里的title为"下移"的button
                                const moveBtn = groupHeader.querySelector('button[title="下移"]');

                                // 点击moveBtn
                                fireEvent.click(moveBtn);
                            });

                            it('上移', async () => {
                                // 使用独立的测试数据
                                const SINGLE_PAPER_INFO = {
                                    ID: 230,
                                    Name: "测试试卷",
                                    Category: "00",
                                    Level: "00",
                                    GroupsData: [
                                        {
                                            id: 1196,
                                            name: "测试题组",
                                            order: 1,
                                            questions: [
                                                SINGLE_CHOICE_QUESTION,
                                                MULTIPLE_CHOICE_QUESTION,
                                                TRUE_FALSE_QUESTION,
                                                FILL_BLANK_QUESTION,
                                                SHORT_ANSWER_QUESTION
                                            ],
                                        },
                                        {
                                            id: 1197,
                                            name: "空白题组",
                                            order: 2,
                                            questions: []
                                        }
                                    ]
                                };

                                // 临时mock试卷信息
                                global.fetch.mockResolvedValueOnce({
                                    ok: true,
                                    json: () => Promise.resolve({
                                        status: 0,
                                        msg: "success",
                                        API: "/api/paper/manual",
                                        method: "GET",
                                        data: SINGLE_PAPER_INFO,
                                    })
                                });

                                // 渲染页面
                                const { container } = render(Manual);

                                // 等待页面渲染完成（有题组说明渲染完成）
                                await waitFor(() => {
                                    // 泛型匹配（有两个）
                                    expect(screen.getAllByText(/测试题组/)).toHaveLength(2);
                                });

                                // 获取第二个group-header类
                                const groupHeader = container.querySelectorAll('.group-header')[1];

                                // 获取groupHeader里的title为"上移"的button
                                const moveBtn = groupHeader.querySelector('button[title="上移"]');

                                // 点击moveBtn
                                fireEvent.click(moveBtn);
                            });

                            it('连续移动', async () => {
                                // 使用独立的测试数据
                                const SINGLE_PAPER_INFO = {
                                    ID: 230,
                                    Name: "测试试卷",
                                    Category: "00",
                                    Level: "00",
                                    SuggestedDuration: 66,
                                    Description: "我是试卷的说明",
                                    Tags: ["测试", "简答", "填空"],
                                    TotalScore: 15,
                                    QuestionCount: 5,
                                    GroupsData: [
                                        {
                                            id: 1196,
                                            name: "移动题组1",
                                            order: 1,
                                            questions: [],
                                        },
                                        {
                                            id: 1197,
                                            name: "移动题组2",
                                            order: 2,
                                            questions: [],
                                        },
                                        {
                                            id: 1198,
                                            name: "移动题组3",
                                            order: 3,
                                            questions: [],
                                        }
                                    ]
                                };
                            
                                // 临时mock试卷信息
                                global.fetch.mockResolvedValueOnce({
                                    ok: true,
                                    json: () => Promise.resolve({
                                        status: 0,
                                        msg: "success",
                                        API: "/api/paper/manual",
                                        method: "GET",
                                        data: SINGLE_PAPER_INFO,
                                    })
                                });
                            
                                // 渲染页面
                                const { container } = render(Manual);
                            
                                // 等待页面渲染完成
                                await waitFor(() => {
                                    expect(screen.getAllByText(/移动题组1/)).toHaveLength(2);
                                });
                            
                                // 第一次移动：题组3上移
                                global.fetch.mockResolvedValueOnce({
                                    ok: true,
                                    json: () => Promise.resolve({
                                        status: 0,
                                        msg: "success",
                                        API: "/api/paper/manual",
                                        method: "PUT",
                                    })
                                });
                            
                                const moveAfterFirstMove = {
                                    ID: 230,
                                    Name: "测试试卷",
                                    Category: "00",
                                    Level: "00",
                                    SuggestedDuration: 66,
                                    Description: "我是试卷的说明",
                                    Tags: ["测试", "简答", "填空"],
                                    TotalScore: 15,
                                    QuestionCount: 5,
                                    GroupsData: [
                                        {
                                            id: 1196,
                                            name: "移动题组1",
                                            order: 1,
                                            questions: [],
                                        },
                                        {
                                            id: 1198,
                                            name: "移动题组3",
                                            order: 2,
                                            questions: [],
                                        },
                                        {
                                            id: 1197,
                                            name: "移动题组2",
                                            order: 3,
                                            questions: [],
                                        }
                                    ]
                                };
                            
                                global.fetch.mockResolvedValueOnce({
                                    ok: true,
                                    json: () => Promise.resolve({
                                        status: 0,
                                        msg: "success",
                                        API: "/api/paper/manual",
                                        method: "GET",
                                        data: moveAfterFirstMove,
                                    })
                                });
                            
                                // 获取第三个group-header类
                                const groupHeader = container.querySelectorAll('.group-header')[2];
                                const moveBtn = groupHeader.querySelector('button[title="上移"]');
                                fireEvent.click(moveBtn);
                            
                                // 等待第一次移动完成
                                await waitFor(() => {
                                    const groupHeader2 = container.querySelectorAll('.group-header')[1];
                                    expect(groupHeader2.textContent).toContain("移动题组3");
                                });
                            
                                // 第二次移动：题组3再次上移
                                global.fetch.mockResolvedValueOnce({
                                    ok: true,
                                    json: () => Promise.resolve({
                                        status: 0,
                                        msg: "success",
                                        API: "/api/paper/manual",
                                        method: "PUT",
                                    })
                                });
                            
                                const moveAfterSecondMove = {
                                    ID: 230,
                                    Name: "测试试卷",
                                    Category: "00",
                                    Level: "00",
                                    SuggestedDuration: 66,
                                    Description: "我是试卷的说明",
                                    Tags: ["测试", "简答", "填空"],
                                    TotalScore: 15,
                                    QuestionCount: 5,
                                    GroupsData: [
                                        {
                                            id: 1198,
                                            name: "移动题组3",
                                            order: 1,
                                            questions: [],
                                        },
                                        {
                                            id: 1196,
                                            name: "移动题组1",
                                            order: 2,
                                            questions: [],
                                        },
                                        {
                                            id: 1197,
                                            name: "移动题组2",
                                            order: 3,
                                            questions: [],
                                        }
                                    ]
                                };
                            
                                global.fetch.mockResolvedValueOnce({
                                    ok: true,
                                    json: () => Promise.resolve({
                                        status: 0,
                                        msg: "success",
                                        API: "/api/paper/manual",
                                        method: "GET",
                                        data: moveAfterSecondMove,
                                    })
                                });
                                
                                vi.useFakeTimers();
                            
                                // 再次点击上移按钮（同一个题组）
                                const groupHeader2 = container.querySelectorAll('.group-header')[1];
                                const moveBtn2 = groupHeader2.querySelector('button[title="上移"]');
                                fireEvent.click(moveBtn2);
                            
                                // 验证第二次移动完成
                                await waitFor(() => {
                                    const groupHeader3 = container.querySelectorAll('.group-header')[0];
                                    expect(groupHeader3.textContent).toContain("移动题组3");
                                });

                                vi.advanceTimersByTime(5001);
                                vi.useRealTimers();
                            });
                        });
                    });

                    describe('题目', () => {
                        it('边界情况', async () => {
                            // 使用独立的测试数据
                            const SINGLE_PAPER_INFO = {
                                ID: 230,
                                Name: "测试试卷",
                                Category: "00",
                                Level: "00",
                                SuggestedDuration: 66,
                                Description: "我是试卷的说明",
                                Tags: ["测试", "简答", "填空"],
                                TotalScore: 15,
                                QuestionCount: 5,
                                GroupsData: [
                                    {
                                        id: 1196,
                                        name: "测试题组",
                                        order: 1,
                                        questions: [
                                            SINGLE_CHOICE_QUESTION,
                                            MULTIPLE_CHOICE_QUESTION,
                                            TRUE_FALSE_QUESTION,
                                            FILL_BLANK_QUESTION,
                                            SHORT_ANSWER_QUESTION
                                        ],
                                    }
                                ],
                            };

                            // 临时mock试卷信息
                            global.fetch.mockResolvedValueOnce({
                                ok: true,
                                json: () => Promise.resolve({
                                    status: 0,
                                    msg: "success",
                                    API: "/api/paper/manual",
                                    method: "GET",
                                    data: SINGLE_PAPER_INFO,
                                })
                            });

                            // 渲染页面
                            const { container } = render(Manual);

                            // 等待页面渲染完成
                            await waitFor(() => {
                                expect(screen.getAllByText(/测试题组/)).toHaveLength(2);
                            });

                            // 获取第一个question-header类
                            const questionHeader = container.querySelectorAll('.question-header')[0];

                            // 获取groupHeader里的title为"上移"的button
                            const moveBtn = questionHeader.querySelector('button[title="上移"]');

                            // 点击moveBtn
                            fireEvent.click(moveBtn);

                            // 验证toast被调用
                            await waitFor(() => {
                                expect(toast.error).toHaveBeenCalledWith('已经是第一道题目', 1000);
                            });

                            // 获取第五个question-header类
                            const questionHeader5 = container.querySelectorAll('.question-header')[4];

                            // 获取questionHeader5里的title为"下移"的button
                            const moveBtn5 = questionHeader5.querySelector('button[title="下移"]');

                            // 点击moveBtn5
                            fireEvent.click(moveBtn5);

                            // 验证toast被调用
                            await waitFor(() => {
                                expect(toast.error).toHaveBeenCalledWith('已经是最后一道题目', 1000);
                            });
                        });

                        describe('正常情况', () => {
                            describe('下移', () => {
                                it('组内下移', async () => {
                                    // 使用独立的测试数据
                                    const SINGLE_PAPER_INFO = {
                                        ID: 230,
                                        Name: "测试试卷",
                                        Category: "00",
                                        Level: "00",
                                        SuggestedDuration: 66,
                                        Description: "我是试卷的说明",
                                        Tags: ["测试", "简答", "填空"],
                                        TotalScore: 15,
                                        QuestionCount: 5,
                                        GroupsData: [
                                            {
                                                id: 1196,
                                                name: "测试题组",
                                                order: 1,
                                                questions: [
                                                    SINGLE_CHOICE_QUESTION,
                                                    MULTIPLE_CHOICE_QUESTION,
                                                    TRUE_FALSE_QUESTION,
                                                    FILL_BLANK_QUESTION,
                                                    SHORT_ANSWER_QUESTION
                                                ],
                                            }
                                        ],
                                    }
        
                                    // 临时mock试卷信息
                                    global.fetch.mockResolvedValueOnce({
                                        ok: true,
                                        json: () => Promise.resolve({
                                            status: 0,
                                            msg: "success",
                                            API: "/api/paper/manual",
                                            method: "GET",
                                            data: SINGLE_PAPER_INFO,
                                        })
                                    });
        
                                    // 渲染页面
                                    const { container } = render(Manual);
        
                                    // 等待页面渲染完成
                                    await waitFor(() => {
                                        expect(screen.getAllByText(/测试题组/)).toHaveLength(2);
                                    });
        
                                    // 获取第一个question-header类
                                    const questionHeader = container.querySelectorAll('.question-header')[0];
        
                                    // 获取questionHeader里的title为"下移"的button
                                    const moveBtn = questionHeader.querySelector('button[title="下移"]');
        
                                    // 点击moveBtn
                                    fireEvent.click(moveBtn);
                                });

                                it('跨组下移', async () => {
                                    // 使用独立的测试数据
                                    const SINGLE_PAPER_INFO = {
                                        ID: 230,
                                        Name: "测试试卷",
                                        Category: "00",
                                        Level: "00",
                                        SuggestedDuration: 66,
                                        Description: "我是试卷的说明",
                                        Tags: ["测试", "简答", "填空"],
                                        TotalScore: 15,
                                        QuestionCount: 5,
                                        GroupsData: [
                                            {
                                                id: 1196,
                                                name: "测试题组",
                                                order: 1,
                                                questions: [
                                                    SINGLE_CHOICE_QUESTION,
                                                    MULTIPLE_CHOICE_QUESTION,
                                                    TRUE_FALSE_QUESTION,
                                                    FILL_BLANK_QUESTION,
                                                    SHORT_ANSWER_QUESTION
                                                ],
                                            },
                                            {
                                                id: 1197,
                                                name: "空白题组",
                                                order: 2,
                                                questions: []
                                            }
                                        ],
                                    }

                                    // 临时mock试卷信息
                                    global.fetch.mockResolvedValueOnce({
                                        ok: true,
                                        json: () => Promise.resolve({
                                            status: 0,
                                            msg: "success",
                                            API: "/api/paper/manual",
                                            method: "GET",
                                            data: SINGLE_PAPER_INFO,
                                        })
                                    });

                                    // 渲染页面
                                    const { container } = render(Manual);

                                    // 等待页面渲染完成
                                    await waitFor(() => {
                                        expect(screen.getAllByText(/测试题组/)).toHaveLength(2);
                                    });

                                    // 获取第五个question-header类
                                    const questionHeader5 = container.querySelectorAll('.question-header')[4];

                                    // 获取questionHeader5里的title为"下移"的button
                                    const moveBtn5 = questionHeader5.querySelector('button[title="下移"]');

                                    // 点击moveBtn5
                                    fireEvent.click(moveBtn5);
                                });
                            });

                            describe('上移', () => {
                                it('组内上移', async () => {
                                    // 使用独立的测试数据
                                    const SINGLE_PAPER_INFO = {
                                        ID: 230,
                                        Name: "测试试卷",
                                        Category: "00",
                                        Level: "00",
                                        SuggestedDuration: 66,
                                        Description: "我是试卷的说明",
                                        Tags: ["测试", "简答", "填空"],
                                        TotalScore: 15,
                                        QuestionCount: 5,
                                        GroupsData: [
                                            {
                                                id: 1196,
                                                name: "测试题组",
                                                order: 1,
                                                questions: [
                                                    SINGLE_CHOICE_QUESTION,
                                                    MULTIPLE_CHOICE_QUESTION,
                                                    TRUE_FALSE_QUESTION,
                                                    FILL_BLANK_QUESTION,
                                                    SHORT_ANSWER_QUESTION
                                                ],
                                            },
                                        ],
                                    }

                                    // 临时mock试卷信息
                                    global.fetch.mockResolvedValueOnce({
                                        ok: true,
                                        json: () => Promise.resolve({
                                            status: 0,
                                            msg: "success",
                                            API: "/api/paper/manual",
                                            method: "GET",
                                            data: SINGLE_PAPER_INFO,
                                        })
                                    });

                                    // 渲染页面
                                    const { container } = render(Manual);

                                    // 等待页面渲染完成
                                    await waitFor(() => {
                                        expect(screen.getAllByText(/测试题组/)).toHaveLength(2);
                                    });

                                    // 获取第二个question-header类
                                    const questionHeader = container.querySelectorAll('.question-header')[1];

                                    // 获取questionHeader里的title为"上移"的button
                                    const moveBtn = questionHeader.querySelector('button[title="上移"]');

                                    // 点击moveBtn
                                    fireEvent.click(moveBtn);
                                });

                                it('跨组上移', async () => {
                                    // 使用独立的测试数据
                                    const SINGLE_PAPER_INFO = {
                                        ID: 230,
                                        Name: "测试试卷",
                                        Category: "00",
                                        Level: "00",
                                        SuggestedDuration: 66,
                                        Description: "我是试卷的说明",
                                        Tags: ["测试", "简答", "填空"],
                                        TotalScore: 15,
                                        QuestionCount: 5,
                                        GroupsData: [
                                            {
                                                id: 1196,
                                                name: "测试题组",
                                                order: 1,
                                                questions: [],
                                            },
                                            {
                                                id: 1197,
                                                name: "空白题组",
                                                order: 2,
                                                questions: [
                                                    SINGLE_CHOICE_QUESTION,
                                                    MULTIPLE_CHOICE_QUESTION,
                                                    TRUE_FALSE_QUESTION,
                                                    FILL_BLANK_QUESTION,
                                                    SHORT_ANSWER_QUESTION
                                                ]
                                            }
                                        ],
                                    }

                                    // 临时mock试卷信息
                                    global.fetch.mockResolvedValueOnce({
                                        ok: true,
                                        json: () => Promise.resolve({
                                            status: 0,
                                            msg: "success",
                                            API: "/api/paper/manual",
                                            method: "GET",
                                            data: SINGLE_PAPER_INFO,
                                        })
                                    });

                                    // 渲染页面
                                    const { container } = render(Manual);

                                    // 等待页面渲染完成
                                    await waitFor(() => {
                                        expect(screen.getAllByText(/测试题组/)).toHaveLength(2);
                                    });

                                    // 获取第一个question-header类
                                    const questionHeader = container.querySelectorAll('.question-header')[0];

                                    // 获取questionHeader里的title为"上移"的button
                                    const moveBtn = questionHeader.querySelector('button[title="上移"]');

                                    // 点击moveBtn
                                    fireEvent.click(moveBtn);
                                });
                            });

                            it('连续移动', async () => {
                                // 使用独立的测试数据
                                const SINGLE_PAPER_INFO = {
                                    ID: 230,
                                    Name: "测试试卷",
                                    Category: "00",
                                    Level: "00",
                                    SuggestedDuration: 66,
                                    Description: "我是试卷的说明",
                                    Tags: ["测试", "简答", "填空"],
                                    TotalScore: 15,
                                    QuestionCount: 5,
                                    GroupsData: [
                                        {
                                            id: 1196,
                                            name: "测试题组",
                                            order: 1,
                                            questions: [
                                                {
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
                                                },
                                                {
                                                    id: 996, // 题目ID（标识试卷中的题目）
                                                    tags: ["数据结构", "基础"],
                                                    type: "00", // 题目类型: 00-单选题 02-多选题 04-判断题 06-填空题 08-简答题
                                                    order: 2, // 题目序号（在整张试卷中的序号）
                                                    score: 2, // 题目分数
                                                    answers: ["A", "B", "D"],
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
                                                    difficulty: 2, // 难度: 1-简单 2-中等 3-困难
                                                    bank_question_id: 340, // 题库题目ID
                                                    belong_to: 84,
                                                },
                                                {
                                                    id: 997, // 题目ID（标识试卷中的题目）
                                                    tags: ["数据结构", "基础"],
                                                    type: "00", // 题目类型: 00-单选题 02-多选题 04-判断题 06-填空题 08-简答题
                                                    order: 3, // 题目序号（在整张试卷中的序号）
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
                                                    difficulty: 3, // 难度: 1-简单 2-中等 3-困难
                                                    bank_question_id: 340, // 题库题目ID
                                                    belong_to: 84,
                                                }
                                            ],
                                        }
                                    ]
                                };

                                // 临时mock试卷信息
                                global.fetch.mockResolvedValueOnce({
                                    ok: true,
                                    json: () => Promise.resolve({
                                        status: 0,
                                        msg: "success",
                                        API: "/api/paper/manual",
                                        method: "GET",
                                        data: SINGLE_PAPER_INFO,
                                    })
                                });

                                // 渲染页面
                                const { container } = render(Manual);

                                // 等待页面渲染完成
                                await waitFor(() => {
                                    expect(screen.getAllByText(/测试题组/)).toHaveLength(2);
                                });

                                // 获取第三个question-header类
                                const questionHeader = container.querySelectorAll('.question-header')[2];

                                // 获取questionHeader里的title为"上移"的button
                                const moveBtn = questionHeader.querySelector('button[title="上移"]');

                                // 临时mock返回结果
                                global.fetch.mockResolvedValueOnce({
                                    ok: true,
                                    json: () => Promise.resolve({
                                        status: 0,
                                        msg: "success",
                                        API: "/api/paper/manual",
                                        method: "PUT",
                                    })
                                });

                                // 构造移动题目后的试卷信息
                                const MOVED_SINGLE_PAPER_INFO = {
                                    ID: 230,
                                    Name: "测试试卷",
                                    Category: "00",
                                    Level: "00",
                                    SuggestedDuration: 66,
                                    Description: "我是试卷的说明",
                                    Tags: ["测试", "简答", "填空"],
                                    TotalScore: 15,
                                    QuestionCount: 5,
                                    GroupsData: [
                                        {
                                            id: 1196,
                                            name: "移动题组",
                                            order: 1,
                                            questions: [
                                                {
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
                                                },
                                                {
                                                    id: 997, // 题目ID（标识试卷中的题目）
                                                    tags: ["数据结构", "基础"],
                                                    type: "00", // 题目类型: 00-单选题 02-多选题 04-判断题 06-填空题 08-简答题
                                                    order: 2, // 题目序号（在整张试卷中的序号）
                                                    score: 2, // 题目分数
                                                    answers: ["A", "B", "D"],
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
                                                    difficulty: 2, // 难度: 1-简单 2-中等 3-困难
                                                    bank_question_id: 340, // 题库题目ID
                                                    belong_to: 84,
                                                },
                                                {
                                                    id: 996, // 题目ID（标识试卷中的题目）
                                                    tags: ["数据结构", "基础"],
                                                    type: "00", // 题目类型: 00-单选题 02-多选题 04-判断题 06-填空题 08-简答题
                                                    order: 3, // 题目序号（在整张试卷中的序号）
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
                                                    difficulty: 3, // 难度: 1-简单 2-中等 3-困难
                                                    bank_question_id: 340, // 题库题目ID
                                                    belong_to: 84,
                                                }
                                            ],
                                        }
                                    ]
                                };

                                // 临时mock移动题目后的试卷信息
                                global.fetch.mockResolvedValueOnce({
                                    ok: true,
                                    json: () => Promise.resolve({
                                        status: 0,
                                        msg: "success",
                                        API: "/api/paper/manual",
                                        method: "GET",
                                        data: MOVED_SINGLE_PAPER_INFO,
                                    })
                                });

                                // 点击moveBtn
                                fireEvent.click(moveBtn);

                                // 等待移动完成
                                await waitFor(() => {
                                    expect(screen.getAllByText(/移动题组/)).toHaveLength(2);
                                });

                                // 临时mock返回结果
                                global.fetch.mockResolvedValueOnce({
                                    ok: true,
                                    json: () => Promise.resolve({
                                        status: 0,
                                        msg: "success",
                                        API: "/api/paper/manual",
                                        method: "PUT",
                                    })
                                });

                                // 构造移动题目后的试卷信息
                                const MOVED_SINGLE_PAPER_INFO2 = {
                                    ID: 230,
                                    Name: "测试试卷",
                                    Category: "00",
                                    Level: "00",
                                    SuggestedDuration: 66,
                                    Description: "我是试卷的说明",
                                    Tags: ["测试", "简答", "填空"],
                                    TotalScore: 15,
                                    QuestionCount: 5,
                                    GroupsData: [
                                        {
                                            id: 1196,
                                            name: "再移动题组",
                                            order: 1,
                                            questions: [
                                                {
                                                    id: 997, // 题目ID（标识试卷中的题目）
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
                                                },
                                                {
                                                    id: 995, // 题目ID（标识试卷中的题目）
                                                    tags: ["数据结构", "基础"],
                                                    type: "00", // 题目类型: 00-单选题 02-多选题 04-判断题 06-填空题 08-简答题
                                                    order: 2, // 题目序号（在整张试卷中的序号）
                                                    score: 2, // 题目分数
                                                    answers: ["A", "B", "D"],
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
                                                    difficulty: 2, // 难度: 1-简单 2-中等 3-困难
                                                    bank_question_id: 340, // 题库题目ID
                                                    belong_to: 84,
                                                },
                                                {
                                                    id: 996, // 题目ID（标识试卷中的题目）
                                                    tags: ["数据结构", "基础"],
                                                    type: "00", // 题目类型: 00-单选题 02-多选题 04-判断题 06-填空题 08-简答题
                                                    order: 3, // 题目序号（在整张试卷中的序号）
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
                                                    difficulty: 3, // 难度: 1-简单 2-中等 3-困难
                                                    bank_question_id: 340, // 题库题目ID
                                                    belong_to: 84,
                                                }
                                            ],
                                        }
                                    ]
                                };

                                // 临时mock移动题目后的试卷信息
                                global.fetch.mockResolvedValueOnce({
                                    ok: true,
                                    json: () => Promise.resolve({
                                        status: 0,
                                        msg: "success",
                                        API: "/api/paper/manual",
                                        method: "GET",
                                        data: MOVED_SINGLE_PAPER_INFO2,
                                    })
                                });

                                // 获取第二个question-header类
                                const questionHeader2 = container.querySelectorAll('.question-header')[1];

                                vi.useFakeTimers();

                                // 点击questionHeader2里的title为"上移"的button
                                const moveBtn2 = questionHeader2.querySelector('button[title="上移"]');
                                fireEvent.click(moveBtn2);

                                await waitFor(() => {
                                    expect(screen.getAllByText(/再移动题组/)).toHaveLength(2);
                                });
                                
                                vi.advanceTimersByTime(5001);
                                vi.useRealTimers();
                            });
                        });
                    });
                });

                describe('删除题目', async () => {
                    it('边界情况', async () => {
                        // 使用独立的测试数据
                        const SINGLE_PAPER_INFO = {
                            ID: 230,
                            Name: "测试试卷",
                            Category: "00",
                            Level: "00",
                            SuggestedDuration: 66,
                            Description: "我是试卷的说明",
                            Tags: ["测试", "简答", "填空"],
                            TotalScore: 15,
                            QuestionCount: 5,
                            GroupsData: [
                                {
                                    id: 1196,
                                    name: "测试题组",
                                    order: 1,
                                    questions: [
                                        SINGLE_CHOICE_QUESTION
                                    ]
                                }
                            ]
                        };

                        // 临时mock试卷信息
                        global.fetch.mockResolvedValueOnce({
                            ok: true,
                            json: () => Promise.resolve({
                                status: 0,
                                msg: "success",
                                API: "/api/paper/manual",
                                method: "GET",
                                data: SINGLE_PAPER_INFO,
                            })
                        });

                        // 渲染页面
                        const { container } = render(Manual);

                        // 等待页面渲染完成（有题组说明渲染完成）
                        await waitFor(() => {
                            expect(screen.getAllByText(/测试题组/)).toHaveLength(2);
                        });

                        // 点击第一个question-header里的deleteBtn
                        const deleteBtn = container.querySelector('.question-header').querySelector('button[title="删除"]');
                        fireEvent.click(deleteBtn);

                        // 验证toast.error
                        await waitFor(() => {
                            expect(toast.error).toHaveBeenCalledWith('至少保留一道题目', 1000);
                        });
                    });

                    it('正常情况', async () => {
                        // 使用独立的测试数据
                        const SINGLE_PAPER_INFO = {
                            ID: 230,
                            Name: "测试试卷",
                            Category: "00",
                            Level: "00",
                            SuggestedDuration: 66,
                            Description: "我是试卷的说明",
                            Tags: ["测试", "简答", "填空"],
                            TotalScore: 15,
                            QuestionCount: 5,
                            GroupsData: [
                                {
                                    id: 1196,
                                    name: "测试题组",
                                    order: 1,
                                    questions: [
                                        SINGLE_CHOICE_QUESTION,
                                        MULTIPLE_CHOICE_QUESTION,
                                        TRUE_FALSE_QUESTION,
                                        FILL_BLANK_QUESTION,
                                        SHORT_ANSWER_QUESTION
                                    ]
                                }
                            ]
                        };

                        // 临时mock试卷信息
                        global.fetch.mockResolvedValueOnce({
                            ok: true,
                            json: () => Promise.resolve({
                                status: 0,
                                msg: "success",
                                API: "/api/paper/manual",
                                method: "GET",
                                data: SINGLE_PAPER_INFO,
                            })
                        });

                        // 渲染页面
                        const { container } = render(Manual);

                        // 等待页面渲染完成（有题组说明渲染完成）
                        await waitFor(() => {
                            expect(screen.getAllByText(/测试题组/)).toHaveLength(2);
                        });

                        // 点击第一个question-header里的deleteBtn
                        const deleteBtn = container.querySelectorAll('.question-header')[0].querySelector('button[title="删除"]');
                        fireEvent.click(deleteBtn);

                        // 验证弹窗
                        await waitFor(() => {
                            expect(screen.getByText('删除确认')).toBeInTheDocument();
                            expect(screen.getByText('请问是否要删除该题目？')).toBeInTheDocument();
                        });

                        // 点击"确定"按钮
                        const confirmButton = screen.getByText('确定');
                        fireEvent.click(confirmButton);

                        // 验证toast.success
                        await waitFor(() => {
                            expect(toast.success).toHaveBeenCalledWith('删除成功', 1000);
                        });
                    });
                });

                describe('编辑', async () => {
                    it('题组', async () => {
                        // 渲染页面
                        const { container } = render(Manual);

                        // 等待页面渲染完成（有题组说明渲染完成）
                        await waitFor(() => {
                            expect(screen.getAllByText(/测试题组/)).toHaveLength(2);
                        });

                        // 点击第一个group-header里的editBtn
                        const editBtn = container.querySelectorAll('.group-header')[0].querySelector('button[title="编辑"]');
                        fireEvent.click(editBtn);

                        // 验证add-group-input类的存在
                        await waitFor(() => {
                            expect(container.querySelector('.add-group-input')).toBeInTheDocument();
                        });

                        // 获取input
                        const input = container.querySelector('.add-group-input');

                        // 输入"测试题组"
                        fireEvent.change(input, { target: { value: '编辑题组' } });

                        // blur
                        fireEvent.blur(input);

                        // 验证add-group-input类的不存在
                        await waitFor(() => {
                            expect(container.querySelector('.add-group-input')).not.toBeInTheDocument();
                        });

                    });

                    describe('题目', async () => {
                        it('取消编辑', async () => {
                            // 使用独立的测试数据
                            const SINGLE_PAPER_INFO = {
                                ID: 230,
                                Name: "测试试卷",
                                Category: "00",
                                Level: "00",
                                SuggestedDuration: 66,
                                Description: "我是试卷的说明",
                                Tags: ["测试", "简答", "填空"],
                                TotalScore: 15,
                                QuestionCount: 5,
                                GroupsData: [
                                    {
                                        id: 1196,
                                        name: "测试题组",
                                        order: 1,
                                        questions: [
                                            SINGLE_CHOICE_QUESTION,
                                            MULTIPLE_CHOICE_QUESTION,
                                            TRUE_FALSE_QUESTION,
                                            FILL_BLANK_QUESTION,
                                            SHORT_ANSWER_QUESTION
                                        ]
                                    }
                                ]
                            };

                            // 临时mock试卷信息
                            global.fetch.mockResolvedValueOnce({
                                ok: true,
                                json: () => Promise.resolve({
                                    status: 0,
                                    msg: "success",
                                    API: "/api/paper/manual",
                                    method: "GET",
                                    data: SINGLE_PAPER_INFO,
                                })
                            });

                            // 渲染页面
                            const { container } = render(Manual);

                            // 等待页面渲染完成（有题组说明渲染完成）
                            await waitFor(() => {
                                expect(screen.getAllByText(/测试题组/)).toHaveLength(2);
                            });
                            
                            const singlePage = container.querySelector('.singlePage');
                            
                            expect(singlePage).toHaveClass('hide');

                            // mock返回结果
                            global.fetch.mockResolvedValueOnce({
                                ok: true,
                                json: () => Promise.resolve({
                                    API: "/api/questions",
                                    status: 0,
                                    msg: "success",
                                    method: "GET",
                                    rowCount: 1,
                                    data: {
                                        ID: 995,
                                        Tags: ["数据结构", "基础"],
                                        Type: "00",
                                        Order: 1,
                                        Score: 2,
                                        Answers: ["B"],
                                        Content: "<p><span style=\"font-size: 12pt\">以下哪一种数据结构最适合用于实现先进先出（FIFO）逻辑？</span></p>",
                                        Options: [
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
                                        Analysis: "<p>队列（Queue）遵循先进先出（FIFO）的顺序，而栈（Stack）是先进后出（LIFO）。</p>",
                                        Difficulty: 1,
                                        BelongTo: 84,
                                    },
                                })
                            });

                            // 点击第一个question-header里的editBtn
                            const editBtn = container.querySelectorAll('.question-header')[0].querySelector('button[title="编辑"]');
                            fireEvent.click(editBtn)

                            // 验证topBar里有文本"编辑单选题"
                            await waitFor(() => {
                                expect(singlePage).not.toHaveClass('hide');
                                expect(singlePage.textContent).toContain('编辑单选题');
                            });

                            // 点击topBar里的cancelBtn（用class为cancelBtn的button）
                            const cancelBtn = singlePage.querySelector('.cancelBtn');
                            fireEvent.click(cancelBtn);

                            await waitFor(() => {
                                expect(singlePage).toHaveClass('hide');
                            });
                        });

                        it('失败情况1：获取题目请求失败', async () => {
                            // 使用独立的测试数据
                            const SINGLE_PAPER_INFO = {
                                ID: 230,
                                Name: "测试试卷",
                                Category: "00",
                                Level: "00",
                                SuggestedDuration: 66,
                                Description: "我是试卷的说明",
                                Tags: ["测试", "简答", "填空"],
                                TotalScore: 15,
                                QuestionCount: 5,
                                GroupsData: [
                                    {
                                        id: 1196,
                                        name: "测试题组",
                                        order: 1,
                                        questions: [
                                            SINGLE_CHOICE_QUESTION,
                                            MULTIPLE_CHOICE_QUESTION,
                                            TRUE_FALSE_QUESTION,
                                            FILL_BLANK_QUESTION,
                                            SHORT_ANSWER_QUESTION
                                        ]
                                    }
                                ]
                            };

                            // 临时mock试卷信息
                            global.fetch.mockResolvedValueOnce({
                                ok: true,
                                json: () => Promise.resolve({
                                    status: 0,
                                    msg: "success",
                                    API: "/api/paper/manual",
                                    method: "GET",
                                    data: SINGLE_PAPER_INFO,
                                })
                            });

                            // 渲染页面
                            const { container } = render(Manual);

                            // 等待页面渲染完成（有题组说明渲染完成）
                            await waitFor(() => {
                                expect(screen.getAllByText(/测试题组/)).toHaveLength(2);
                            });
                            
                            const singlePage = container.querySelector('.singlePage');
                            
                            expect(singlePage).toHaveClass('hide');

                            // mock返回结果
                            global.fetch.mockResolvedValueOnce({
                                ok: false,
                                status: 400
                            });

                            // 点击第一个question-header里的editBtn
                            const editBtn = container.querySelectorAll('.question-header')[0].querySelector('button[title="编辑"]');
                            fireEvent.click(editBtn)

                            await waitFor(() => {
                                expect(toast.error).toHaveBeenCalledWith(`请求失败，状态码：400`, 1000);
                            });
                        });

                        it('失败情况2：获取题目请求业务错误', async () => {
                            // 使用独立的测试数据
                            const SINGLE_PAPER_INFO = {
                                ID: 230,
                                Name: "测试试卷",
                                Category: "00",
                                Level: "00",
                                SuggestedDuration: 66,
                                Description: "我是试卷的说明",
                                Tags: ["测试", "简答", "填空"],
                                TotalScore: 15,
                                QuestionCount: 5,
                                GroupsData: [
                                    {
                                        id: 1196,
                                        name: "测试题组",
                                        order: 1,
                                        questions: [
                                            SINGLE_CHOICE_QUESTION,
                                            MULTIPLE_CHOICE_QUESTION,
                                            TRUE_FALSE_QUESTION,
                                            FILL_BLANK_QUESTION,
                                            SHORT_ANSWER_QUESTION
                                        ]
                                    }
                                ]
                            };

                            // 临时mock试卷信息
                            global.fetch.mockResolvedValueOnce({
                                ok: true,
                                json: () => Promise.resolve({
                                    status: 0,
                                    msg: "success",
                                    API: "/api/paper/manual",
                                    method: "GET",
                                    data: SINGLE_PAPER_INFO,
                                })
                            });

                            // 渲染页面
                            const { container } = render(Manual);

                            // 等待页面渲染完成（有题组说明渲染完成）
                            await waitFor(() => {
                                expect(screen.getAllByText(/测试题组/)).toHaveLength(2);
                            });
                            
                            const singlePage = container.querySelector('.singlePage');
                            
                            expect(singlePage).toHaveClass('hide');

                            // mock返回结果
                            global.fetch.mockResolvedValueOnce({
                                ok: true,
                                json: () => Promise.resolve({
                                    status: -1,
                                    msg: "业务错误"
                                })
                            });

                            // 点击第一个question-header里的editBtn
                            const editBtn = container.querySelectorAll('.question-header')[0].querySelector('button[title="编辑"]');
                            fireEvent.click(editBtn)

                            await waitFor(() => {
                                expect(toast.error).toHaveBeenCalledWith(`业务错误`, 1000);
                            });
                        });
                    });
                });

                describe('拖拽题目', async () => {
                    it('正常上移', async () => {
                        // 使用独立的测试数据
                        const SINGLE_PAPER_INFO = {
                            ID: 230,
                            Name: "测试试卷",
                            Category: "00",
                            Level: "00",
                            SuggestedDuration: 66,
                            Description: "我是试卷的说明",
                            Tags: ["测试", "简答", "填空"],
                            TotalScore: 15,
                            QuestionCount: 5,
                            GroupsData: [
                                {
                                    id: 1196,
                                    name: "测试题组",
                                    order: 1,
                                    questions: [
                                        SINGLE_CHOICE_QUESTION,
                                        MULTIPLE_CHOICE_QUESTION,
                                        TRUE_FALSE_QUESTION,
                                        FILL_BLANK_QUESTION,
                                        SHORT_ANSWER_QUESTION
                                    ]
                                }
                            ]
                        };

                        // 临时mock试卷信息
                        global.fetch.mockResolvedValueOnce({
                            ok: true,
                            json: () => Promise.resolve({
                                status: 0,
                                msg: "success",
                                API: "/api/paper/manual",
                                method: "GET",
                                data: SINGLE_PAPER_INFO,
                            })
                        });

                        // 渲染页面
                        const { container } = render(Manual);

                        // 等待页面渲染完成（有题组说明渲染完成）
                        await waitFor(() => {
                            expect(screen.getAllByText(/测试题组/)).toHaveLength(2);
                        });
                        
                        // 获取第一个和第二个question-header类
                        const questionHeader1 = container.querySelectorAll('.question-header')[0];
                        const questionHeader2 = container.querySelectorAll('.question-header')[1];

                        const dataTransfer = {
                            effectAllowed: "",
                            setData: vi.fn(),
                            getData: vi.fn(),
                        };

                        // 拖拽第二个题目到第一个题目上方
                        fireEvent.dragStart(questionHeader2, { dataTransfer });
                        fireEvent.dragOver(questionHeader1, {
                            clientY: questionHeader1.getBoundingClientRect().top + questionHeader1.getBoundingClientRect().height * 0.1,
                            dataTransfer
                        });
                        fireEvent.drop(questionHeader1, { dataTransfer });
                    });
                    
                    it('正常下移', async () => {
                        // 使用独立的测试数据
                        const SINGLE_PAPER_INFO = {
                            ID: 230,
                            Name: "测试试卷",
                            Category: "00",
                            Level: "00",
                            SuggestedDuration: 66,
                            Description: "我是试卷的说明",
                            Tags: ["测试", "简答", "填空"],
                            TotalScore: 15,
                            QuestionCount: 5,
                            GroupsData: [
                                {
                                    id: 1196,
                                    name: "测试题组",
                                    order: 1,
                                    questions: [
                                        SINGLE_CHOICE_QUESTION,
                                        MULTIPLE_CHOICE_QUESTION,
                                        TRUE_FALSE_QUESTION,
                                        FILL_BLANK_QUESTION,
                                        SHORT_ANSWER_QUESTION
                                    ]
                                }
                            ]
                        };

                        // 临时mock试卷信息
                        global.fetch.mockResolvedValueOnce({
                            ok: true,
                            json: () => Promise.resolve({
                                status: 0,
                                msg: "success",
                                API: "/api/paper/manual",
                                method: "GET",
                                data: SINGLE_PAPER_INFO,
                            })
                        });

                        // 渲染页面
                        const { container } = render(Manual);

                        // 等待页面渲染完成（有题组说明渲染完成）
                        await waitFor(() => {
                            expect(screen.getAllByText(/测试题组/)).toHaveLength(2);
                        });
                        
                        // 获取第一个和第二个question-header类
                        const questionHeader1 = container.querySelectorAll('.question-header')[0];
                        const questionHeader2 = container.querySelectorAll('.question-header')[1];

                        const dataTransfer = {
                            effectAllowed: "",
                            setData: vi.fn(),
                            getData: vi.fn(),
                        };

                        // 拖拽第一个题目到第二个题目下方
                        fireEvent.dragStart(questionHeader1, { dataTransfer });
                        fireEvent.dragOver(questionHeader2, {
                            clientY: questionHeader2.getBoundingClientRect().top + questionHeader2.getBoundingClientRect().height * 0.9,
                            dataTransfer
                        });
                        fireEvent.drop(questionHeader2, { dataTransfer });
                    });

                    it('拖拽到自身', async () => {
                        // 使用独立的测试数据
                        const SINGLE_PAPER_INFO = {
                            ID: 230,
                            Name: "测试试卷",
                            Category: "00",
                            Level: "00",
                            SuggestedDuration: 66,
                            Description: "我是试卷的说明",
                            Tags: ["测试", "简答", "填空"],
                            TotalScore: 15,
                            QuestionCount: 5,
                            GroupsData: [
                                {
                                    id: 1196,
                                    name: "测试题组",
                                    order: 1,
                                    questions: [
                                        SINGLE_CHOICE_QUESTION,
                                        MULTIPLE_CHOICE_QUESTION,
                                        TRUE_FALSE_QUESTION,
                                        FILL_BLANK_QUESTION,
                                        SHORT_ANSWER_QUESTION
                                    ]
                                }
                            ]
                        };

                        // 临时mock试卷信息
                        global.fetch.mockResolvedValueOnce({
                            ok: true,
                            json: () => Promise.resolve({
                                status: 0,
                                msg: "success",
                                API: "/api/paper/manual",
                                method: "GET",
                                data: SINGLE_PAPER_INFO,
                            })
                        });

                        const { container } = render(Manual);

                        // 等待页面渲染完成（有题组说明渲染完成）
                        await waitFor(() => {
                            expect(screen.getAllByText(/测试题组/)).toHaveLength(2);
                        });

                        // 获取第一个question-header类
                        const questionHeader = container.querySelectorAll('.question-header')[0];

                        const dataTransfer = {
                            effectAllowed: "",
                            setData: vi.fn(),
                            getData: vi.fn(),
                        };

                        // 拖拽第一个题目到自身
                        fireEvent.dragStart(questionHeader, { dataTransfer });
                        fireEvent.dragOver(questionHeader, { dataTransfer });
                        fireEvent.drop(questionHeader, { dataTransfer });
                    });

                    it('拖拽到空题组', async () => {
                        // 使用独立的测试数据
                        const SINGLE_PAPER_INFO = {
                            ID: 230,
                            Name: "测试试卷",
                            Category: "00",
                            Level: "00",
                            SuggestedDuration: 66,
                            Description: "我是试卷的说明",
                            Tags: ["测试", "简答", "填空"],
                            TotalScore: 15,
                            QuestionCount: 5,
                            GroupsData: [
                                {
                                    id: 1196,
                                    name: "测试题组",
                                    order: 1,
                                    questions: [
                                        SINGLE_CHOICE_QUESTION,
                                    ]
                                },
                                {
                                    id: 1197,
                                    name: "空白题组",
                                    order: 2,
                                    questions: []
                                }
                            ]
                        };

                        // 临时mock试卷信息
                        global.fetch.mockResolvedValueOnce({
                            ok: true,
                            json: () => Promise.resolve({
                                status: 0,
                                msg: "success",
                                API: "/api/paper/manual",
                                method: "GET",
                                data: SINGLE_PAPER_INFO,
                            })
                        });

                        const { container } = render(Manual);

                        // 等待页面渲染完成（有题组说明渲染完成）
                        await waitFor(() => {
                            expect(screen.getAllByText(/测试题组/)).toHaveLength(2);
                        });

                        // 点击"一键展开"
                        fireEvent.click(screen.getByText('一键展开'));

                        // 获取第一个question-header类
                        const questionHeader = container.querySelectorAll('.question-header')[0];

                        // 获取no-questions-container类
                        const noQuestionsContainer = container.querySelector('.no-questions-container');

                        const dataTransfer = {
                            effectAllowed: "",
                            setData: vi.fn(),
                            getData: vi.fn(),
                        };

                        // 拖拽第一个题目到第二个题组里面
                        fireEvent.dragStart(questionHeader, { dataTransfer });
                        fireEvent.dragOver(noQuestionsContainer, {
                            clientY: noQuestionsContainer.getBoundingClientRect().top + noQuestionsContainer.getBoundingClientRect().height * 0.5,
                            dataTransfer
                        });
                        fireEvent.drop(noQuestionsContainer, { dataTransfer });
                    });
                });

                describe('修改每题分值', async () => {
                    it('空题组', async () => {
                        const { container } = render(Manual);

                        // 等待页面渲染完成（有题组说明渲染完成）
                        await waitFor(() => {
                            expect(screen.getAllByText(/测试题组/)).toHaveLength(2);
                        });

                        // 获取第一个group-header
                        const groupHeader = container.querySelectorAll('.group-header')[0];
                        
                        // 获取里面的input
                        const input = groupHeader.querySelector('input');

                        // 输入1
                        fireEvent.change(input, { target: { value: '1' } });

                        // 等待500ms
                        await new Promise(resolve => setTimeout(resolve, 500));

                        // 验证toast.error
                        await waitFor(() => {
                            expect(toast.error).toHaveBeenCalledWith('请先添加题目', 1000);
                        });
                        
                    });

                    it('分值小于最小分值', async () => {
                        // 使用独立的测试数据
                        const SINGLE_PAPER_INFO = {
                            ID: 230,
                            Name: "测试试卷",
                            Category: "00",
                            Level: "00",
                            SuggestedDuration: 66,
                            Description: "我是试卷的说明",
                            Tags: ["测试", "简答", "填空"],
                            TotalScore: 15,
                            QuestionCount: 5,
                            GroupsData: [
                                {
                                    id: 1196,
                                    name: "测试题组",
                                    order: 1,
                                    questions: [
                                        SINGLE_CHOICE_QUESTION,
                                        MULTIPLE_CHOICE_QUESTION,
                                        TRUE_FALSE_QUESTION,
                                        FILL_BLANK_QUESTION,
                                        SHORT_ANSWER_QUESTION
                                    ]
                                }
                            ]
                        };

                        // 临时mock试卷信息
                        global.fetch.mockResolvedValueOnce({
                            ok: true,
                            json: () => Promise.resolve({
                                status: 0,
                                msg: "success",
                                API: "/api/paper/manual",
                                method: "GET",
                                data: SINGLE_PAPER_INFO,
                            })
                        });

                        const { container } = render(Manual);

                        // 等待页面渲染完成（有题组说明渲染完成）
                        await waitFor(() => {
                            expect(screen.getAllByText(/测试题组/)).toHaveLength(2);
                        });
                        
                        // 获取第一个group-header
                        const groupHeader = container.querySelectorAll('.group-header')[0];
                        
                        // 获取里面的input
                        const input = groupHeader.querySelector('input');

                        // 输入1
                        fireEvent.change(input, { target: { value: '1' } });

                        // 等待500ms
                        await new Promise(resolve => setTimeout(resolve, 500));
                        
                        // 验证toast.error
                        await waitFor(() => {
                            expect(toast.error).toHaveBeenCalledWith('每题分值至少为1.5分', 1000);
                        });
                    });

                    it('正常情况', async () => {
                        // 使用独立的测试数据
                        const SINGLE_PAPER_INFO = {
                            ID: 230,
                            Name: "测试试卷",
                            Category: "00",
                            Level: "00",
                            SuggestedDuration: 66,
                            Description: "我是试卷的说明",
                            Tags: ["测试", "简答", "填空"],
                            TotalScore: 15,
                            QuestionCount: 5,
                            GroupsData: [
                                {
                                    id: 1196,
                                    name: "测试题组",
                                    order: 1,
                                    questions: [
                                        SINGLE_CHOICE_QUESTION,
                                        MULTIPLE_CHOICE_QUESTION,
                                        TRUE_FALSE_QUESTION,
                                        FILL_BLANK_QUESTION,
                                        SHORT_ANSWER_QUESTION
                                    ]
                                }
                            ]
                        };

                        // 临时mock试卷信息
                        global.fetch.mockResolvedValueOnce({
                            ok: true,
                            json: () => Promise.resolve({
                                status: 0,
                                msg: "success",
                                API: "/api/paper/manual",
                                method: "GET",
                                data: SINGLE_PAPER_INFO,
                            })
                        });

                        const { container } = render(Manual);

                        // 等待页面渲染完成（有题组说明渲染完成）
                        await waitFor(() => {
                            expect(screen.getAllByText(/测试题组/)).toHaveLength(2);
                        });
                        
                        // 获取第一个group-header
                        const groupHeader = container.querySelectorAll('.group-header')[0];
                        
                        // 获取里面的input
                        const input = groupHeader.querySelector('input');
                        
                        // 输入2
                        fireEvent.input(input, { target: { value: '2' } });

                        // blur
                        fireEvent.blur(input);

                        // 等待600ms
                        await new Promise(resolve => setTimeout(resolve, 600));

                        // 输入2.5
                        fireEvent.input(input, { target: { value: '2.5' } });

                        // blur
                        fireEvent.blur(input);

                        // 等待600ms
                        await new Promise(resolve => setTimeout(resolve, 600));
                    });
                });

                it('更新子题分数', async () => {
                    // 使用独立的测试数据
                    const SINGLE_PAPER_INFO = {
                        ID: 230,
                        Name: "测试试卷",
                        Category: "00",
                        Level: "00",
                        SuggestedDuration: 66,
                        Description: "我是试卷的说明",
                        Tags: ["测试", "简答", "填空"],
                        TotalScore: 15,
                        QuestionCount: 5,
                        GroupsData: [
                            {
                                id: 1196,
                                name: "测试题组",
                                order: 1,
                                questions: [
                                    SINGLE_CHOICE_QUESTION,
                                    MULTIPLE_CHOICE_QUESTION,
                                    TRUE_FALSE_QUESTION,
                                    FILL_BLANK_QUESTION,
                                    SHORT_ANSWER_QUESTION
                                ]
                            }
                        ]
                    };

                    // 临时mock试卷信息
                    global.fetch.mockResolvedValueOnce({
                        ok: true,
                        json: () => Promise.resolve({
                            status: 0,
                            msg: "success",
                            API: "/api/paper/manual",
                            method: "GET",
                            data: SINGLE_PAPER_INFO,
                        })
                    });

                    const { container } = render(Manual);

                    // 等待页面渲染完成（有题组说明渲染完成）
                    await waitFor(() => {
                        expect(screen.getAllByText(/测试题组/)).toHaveLength(2);
                    });

                    // 验证single-question有5个
                    await waitFor(() => {
                        expect(container.querySelectorAll('.single-question')).toHaveLength(5);
                    });
                    
                    // 获取第四个single-question
                    const singleQuestion = container.querySelectorAll('.single-question')[3];

                    // 获取single-question里的question-container
                    const questionContainer = singleQuestion.querySelector('.question-container');

                    // 验证里面有3个input
                    await waitFor(() => {
                        expect(questionContainer.querySelectorAll('.input')).toHaveLength(3);
                    });

                    // 获取第一个subscore-input
                    const subscoreInput = questionContainer.querySelectorAll('.input')[0];

                    // 输入2
                    fireEvent.input(subscoreInput, { target: { value: '2' } });

                    // mock返回结果
                    global.fetch.mockResolvedValueOnce({
                        ok: true,
                        json: () => Promise.resolve({
                            API: "/api/paper/manual",
                            method: "PUT",
                            msg: "success",
                            status: 0,
                        })
                    });

                    const SINGLE_PAPER_INFO2 = {
                        ID: 230,
                        Name: "测试试卷",
                        Category: "00",
                        Level: "00",
                        SuggestedDuration: 66,
                        Description: "我是试卷的说明",
                        Tags: ["测试", "简答", "填空"],
                        TotalScore: 15,
                        QuestionCount: 5,
                        GroupsData: [
                            {
                                id: 1196,
                                name: "测试题组",
                                order: 1,
                                questions: [
                                    {
                                        id: 995, // 题目ID（标识试卷中的题目）
                                        tags: ["数据结构", "基础"],
                                        type: "00", // 题目类型: 00-单选题 02-多选题 04-判断题 06-填空题 08-简答题
                                        order: 1, // 题目序号（在整张试卷中的序号）
                                        score: 1, // 题目分数
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
                                    },
                                    {
                                        id: 996, // 题目ID（标识试卷中的题目）
                                        tags: ["数据结构", "基础"],
                                        type: "00", // 题目类型: 00-单选题 02-多选题 04-判断题 06-填空题 08-简答题
                                        order: 2, // 题目序号（在整张试卷中的序号）
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
                                    },
                                ]
                            }
                        ]
                    };

                    global.fetch.mockResolvedValueOnce({
                        ok: true,
                        json: () => Promise.resolve({
                            status: 0,
                            msg: "success",
                            API: "/api/paper/manual",
                            method: "GET",
                            data: SINGLE_PAPER_INFO2,
                        })
                    });

                    // blur
                    fireEvent.blur(subscoreInput);

                    // 等待600ms
                    await new Promise(resolve => setTimeout(resolve, 600));
                });

                describe('修改题目分数', async () => {
                    it('分值小于最小值', async () => {
                        // 使用独立的测试数据
                        const SINGLE_PAPER_INFO = {
                            ID: 230,
                            Name: "测试试卷",
                            Category: "00",
                            Level: "00",
                            SuggestedDuration: 66,
                            Description: "我是试卷的说明",
                            Tags: ["测试", "简答", "填空"],
                            TotalScore: 15,
                            QuestionCount: 5,
                            GroupsData: [
                                {
                                    id: 1196,
                                    name: "测试题组",
                                    order: 1,
                                    questions: [
                                        SINGLE_CHOICE_QUESTION,
                                        MULTIPLE_CHOICE_QUESTION,
                                        TRUE_FALSE_QUESTION,
                                        FILL_BLANK_QUESTION,
                                        SHORT_ANSWER_QUESTION
                                    ]
                                }
                            ]
                        };

                        // 临时mock试卷信息
                        global.fetch.mockResolvedValueOnce({
                            ok: true,
                            json: () => Promise.resolve({
                                status: 0,
                                msg: "success",
                                API: "/api/paper/manual",
                                method: "GET",
                                data: SINGLE_PAPER_INFO,
                            })
                        });

                        const { container } = render(Manual);

                        // 等待页面渲染完成（有题组说明渲染完成）
                        await waitFor(() => {
                            expect(screen.getAllByText(/测试题组/)).toHaveLength(2);
                        });

                        // 验证single-question有5个
                        await waitFor(() => {
                            expect(container.querySelectorAll('.single-question')).toHaveLength(5);
                        });
                        
                        // 获取第四个single-question
                        const singleQuestion = container.querySelectorAll('.single-question')[3];

                        // 获取single-question里的question-header
                        const questionHeader = singleQuestion.querySelector('.question-header');

                        // 获取里面的input
                        const input = questionHeader.querySelector('input');

                        // 输入0.5
                        fireEvent.input(input, { target: { value: '0.5' } });

                        // blur
                        fireEvent.blur(input);

                        // 验证toast.error
                        await waitFor(() => {
                            expect(toast.error).toHaveBeenCalledWith('该题至少需要1.5分', 1000);
                        });
                    });

                    it('正常情况1：填空题', async () => {
                        // 使用独立的测试数据
                        const SINGLE_PAPER_INFO = {
                            ID: 230,
                            Name: "测试试卷",
                            Category: "00",
                            Level: "00",
                            SuggestedDuration: 66,
                            Description: "我是试卷的说明",
                            Tags: ["测试", "简答", "填空"],
                            TotalScore: 15,
                            QuestionCount: 5,
                            GroupsData: [
                                {
                                    id: 1196,
                                    name: "测试题组",
                                    order: 1,
                                    questions: [
                                        SINGLE_CHOICE_QUESTION,
                                        MULTIPLE_CHOICE_QUESTION,
                                        TRUE_FALSE_QUESTION,
                                        FILL_BLANK_QUESTION,
                                        SHORT_ANSWER_QUESTION
                                    ]
                                }
                            ]
                        };

                        // 临时mock试卷信息
                        global.fetch.mockResolvedValueOnce({
                            ok: true,
                            json: () => Promise.resolve({
                                status: 0,
                                msg: "success",
                                API: "/api/paper/manual",
                                method: "GET",
                                data: SINGLE_PAPER_INFO,
                            })
                        });

                        const { container } = render(Manual);

                        // 等待页面渲染完成（有题组说明渲染完成）
                        await waitFor(() => {
                            expect(screen.getAllByText(/测试题组/)).toHaveLength(2);
                        });

                        // 验证single-question有5个
                        await waitFor(() => {
                            expect(container.querySelectorAll('.single-question')).toHaveLength(5);
                        });
                        
                        // 获取第四个single-question
                        const singleQuestion = container.querySelectorAll('.single-question')[3];

                        // 获取single-question里的question-header
                        const questionHeader = singleQuestion.querySelector('.question-header');

                        // 获取里面的input
                        const input = questionHeader.querySelector('input');

                        // mock返回结果
                        global.fetch.mockResolvedValueOnce({
                            ok: true,
                            json: () => Promise.resolve({
                                status: 0,
                                msg: "success",
                                API: "/api/paper/manual",
                                method: "PUT",
                            })
                        });

                        const SINGLE_PAPER_INFO2 = {
                            ID: 230,
                            Name: "测试试卷",
                            Category: "00",
                            Level: "00",
                            SuggestedDuration: 66,
                            Description: "我是试卷的说明",
                            Tags: ["测试", "简答", "填空"],
                            TotalScore: 15,
                            QuestionCount: 5,
                            GroupsData: [
                                {
                                    id: 1196,
                                    name: "测试题组",
                                    order: 1,
                                    questions: [
                                        {
                                            id: 995, // 题目ID（标识试卷中的题目）
                                            tags: ["数据结构", "基础"],
                                            type: "00", // 题目类型: 00-单选题 02-多选题 04-判断题 06-填空题 08-简答题
                                            order: 1, // 题目序号（在整张试卷中的序号）
                                            score: 1, // 题目分数
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
                                        },
                                        {
                                            id: 996, // 题目ID（标识试卷中的题目）
                                            tags: ["数据结构", "基础"],
                                            type: "00", // 题目类型: 00-单选题 02-多选题 04-判断题 06-填空题 08-简答题
                                            order: 2, // 题目序号（在整张试卷中的序号）
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
                                        },
                                    ]
                                }
                            ]
                        };
    
                        global.fetch.mockResolvedValueOnce({
                            ok: true,
                            json: () => Promise.resolve({
                                status: 0,
                                msg: "success",
                                API: "/api/paper/manual",
                                method: "GET",
                                data: SINGLE_PAPER_INFO2,
                            })
                        });

                        // 输入2
                        fireEvent.input(input, { target: { value: '2' } });

                        // blur
                        fireEvent.blur(input);

                        // 等待600ms
                        await new Promise(resolve => setTimeout(resolve, 600));
                    });

                    it('正常情况2：简答题', async () => {
                        // 使用独立的测试数据
                        const SINGLE_PAPER_INFO = {
                            ID: 230,
                            Name: "测试试卷",
                            Category: "00",
                            Level: "00",
                            SuggestedDuration: 66,
                            Description: "我是试卷的说明",
                            Tags: ["测试", "简答", "填空"],
                            TotalScore: 15,
                            QuestionCount: 5,
                            GroupsData: [
                                {
                                    id: 1196,
                                    name: "测试题组",
                                    order: 1,
                                    questions: [
                                        SINGLE_CHOICE_QUESTION,
                                        MULTIPLE_CHOICE_QUESTION,
                                        TRUE_FALSE_QUESTION,
                                        FILL_BLANK_QUESTION,
                                        SHORT_ANSWER_QUESTION
                                    ]
                                }
                            ]
                        };

                        // 临时mock试卷信息
                        global.fetch.mockResolvedValueOnce({
                            ok: true,
                            json: () => Promise.resolve({
                                status: 0,
                                msg: "success",
                                API: "/api/paper/manual",
                                method: "GET",
                                data: SINGLE_PAPER_INFO,
                            })
                        });

                        const { container } = render(Manual);

                        // 等待页面渲染完成（有题组说明渲染完成）
                        await waitFor(() => {
                            expect(screen.getAllByText(/测试题组/)).toHaveLength(2);
                        });

                        // 验证single-question有5个
                        await waitFor(() => {
                            expect(container.querySelectorAll('.single-question')).toHaveLength(5);
                        });
                        
                        // 获取第五个single-question
                        const singleQuestion = container.querySelectorAll('.single-question')[4];

                        // 获取single-question里的question-header
                        const questionHeader = singleQuestion.querySelector('.question-header');

                        // 获取里面的input
                        const input = questionHeader.querySelector('input');

                        // mock返回结果
                        global.fetch.mockResolvedValueOnce({
                            ok: true,
                            json: () => Promise.resolve({
                                status: 0,
                                msg: "success",
                                API: "/api/paper/manual",
                                method: "PUT",
                            })
                        });

                        const SINGLE_PAPER_INFO2 = {
                            ID: 230,
                            Name: "测试试卷",
                            Category: "00",
                            Level: "00",
                            SuggestedDuration: 66,
                            Description: "我是试卷的说明",
                            Tags: ["测试", "简答", "填空"],
                            TotalScore: 15,
                            QuestionCount: 5,
                            GroupsData: [
                                {
                                    id: 1196,
                                    name: "测试题组",
                                    order: 1,
                                    questions: [
                                        {
                                            id: 995, // 题目ID（标识试卷中的题目）
                                            tags: ["数据结构", "基础"],
                                            type: "00", // 题目类型: 00-单选题 02-多选题 04-判断题 06-填空题 08-简答题
                                            order: 1, // 题目序号（在整张试卷中的序号）
                                            score: 1, // 题目分数
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
                                        },
                                        {
                                            id: 996, // 题目ID（标识试卷中的题目）
                                            tags: ["数据结构", "基础"],
                                            type: "00", // 题目类型: 00-单选题 02-多选题 04-判断题 06-填空题 08-简答题
                                            order: 2, // 题目序号（在整张试卷中的序号）
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
                                        },
                                    ]
                                }
                            ]
                        };
    
                        global.fetch.mockResolvedValueOnce({
                            ok: true,
                            json: () => Promise.resolve({
                                status: 0,
                                msg: "success",
                                API: "/api/paper/manual",
                                method: "GET",
                                data: SINGLE_PAPER_INFO2,
                            })
                        });

                        // 输入2
                        fireEvent.input(input, { target: { value: '2' } });

                        // blur
                        fireEvent.blur(input);

                        // 等待600ms
                        await new Promise(resolve => setTimeout(resolve, 600));
                    });
                });
            });
        });
    });

    describe('补充测试', async () => {
        it('导入题目', async () => {
            const SINGLE_PAPER_INFO = {
                ID: 230,
                Name: "测试试卷",
                Category: "00",
                Level: "00",
                SuggestedDuration: 66,
                Description: "我是试卷的说明",
                Tags: ["测试", "简答", "填空"],
                TotalScore: 15,
                QuestionCount: 5,
                GroupsData: [
                    {
                        id: 1195,
                        name: "空白题组",
                        order: 1,
                        questions: [
                            {
                                id: 994, // 题目ID（标识试卷中的题目）
                                tags: ["数据结构", "基础"],
                                type: "00", // 题目类型: 00-单选题 02-多选题 04-判断题 06-填空题 08-简答题
                                order: 1, // 题目序号（在整张试卷中的序号）
                                score: 1, // 题目分数
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
                            },
                        ],
                    },
                    {
                        id: 1196,
                        name: "测试题组",
                        order: 2,
                        questions: [
                            {
                                id: 995, // 题目ID（标识试卷中的题目）
                                tags: ["数据结构", "基础"],
                                type: "00", // 题目类型: 00-单选题 02-多选题 04-判断题 06-填空题 08-简答题
                                order: 1, // 题目序号（在整张试卷中的序号）
                                score: 1, // 题目分数
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
                            },
                            {
                                id: 996, // 题目ID（标识试卷中的题目）
                                tags: ["数据结构", "基础"],
                                type: "00", // 题目类型: 00-单选题 02-多选题 04-判断题 06-填空题 08-简答题
                                order: 2, // 题目序号（在整张试卷中的序号）
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
                            },
                        ]
                    }
                ]
            };

            global.fetch.mockResolvedValueOnce({
                ok: true,
                json: () => Promise.resolve({
                    status: 0,
                    msg: "success",
                    API: "/api/paper/manual",
                    method: "GET",
                    data: SINGLE_PAPER_INFO,
                })
            });

            const { container } = render(Manual);

            // 等待页面渲染完成（有题组说明渲染完成）
            await waitFor(() => {
                expect(screen.getAllByText(/测试题组/)).toHaveLength(2);
            });

            // mock 题库列表
            global.fetch.mockResolvedValueOnce({
                ok: true,
                json: () => Promise.resolve({
                    API: "/api/question-banks",
                    method: "GET",
                    msg: "success",
                    rowCount: 1,
                    status: 0,
                    data: [
                        {
                            Name: "测试题库",
                            ID: 1,
                            QuestionCount: 2,
                            QuestionTags: [],
                            QuestionTypes: [],
                            QuestionDifficulties: [],
                            CreateTime: 1722100200000,
                            UpdateTime: 1722100200000,
                            Type: "00",
                            Status: "00",
                        }
                    ]
                })
            });

            // mock 试卷信息
            global.fetch.mockResolvedValueOnce({
                ok: true,
                json: () => Promise.resolve({
                    status: 0,
                    msg: "success",
                    API: "/api/paper/manual",
                    method: "GET",
                    data: SINGLE_PAPER_INFO,
                })
            });

            // 点击第二个"导入题目"
            fireEvent.click(screen.getAllByText('导入题目')[1]);

            // 等待页面渲染完成
            await waitFor(() => {
                expect(screen.getAllByText(/测试题库/)).toHaveLength(1);
            });

            // mock 题库题目
            global.fetch.mockResolvedValueOnce({
                ok: true,
                json: () => Promise.resolve({
                    API: "/api/questions",
                    method: "GET",
                    msg: "success",
                    rowCount: 2,
                    status: 0,
                    data: [
                        {
                            ID: 527,
                            Type: "08",
                            Content: "无标签题目",
                            "Options": null,
                            "Answers": [
                                {
                                    "index": 1,
                                    "score": 3,
                                    "answer": "与客户沟通并收集客户需求的方式（3分）：\n可以通过售前在线咨询，与客户详细沟通；也可以通过电话回访或电子邮件发送调查问卷，了解客户的需求；同时还可以通过平台上的用户反馈和社交媒体互动，收集客户对现有产品使用体验的评价，并分析他们的潜在需求。（每点1分）",
                                    "grading_rule": "与客户沟通并收集客户需求的方式（3分）\n学生答案只要涵盖以下核心意思，即可得分：\n学生需说明可以通过与客户进行直接或间接的沟通来收集需求。直接或间接的沟通方式可以包括但不限于：售前在线咨询、电话回访、电子邮件发送调查问卷、平台用户反馈、社交媒体互动等。学生答案中只要提到其中任意三种方式，且表述清晰，逻辑合理，即可得满分3分。若提到的方式少于三种，但表述清晰，逻辑合理，则酌情扣分。",
                                    "alternative_answers": []
                                },
                                {
                                    "index": 2,
                                    "score": 6,
                                    "answer": "客户分类与差异化营销服务（6分）：\n客户A分类：北方高寒地区用户（1分）\n营销建议： 推荐保温性强、防风性能卓越的帐篷，能够应对极寒天气，附赠防寒睡袋或加厚保温垫，提升户外露营体验。（1分）\n客户B分类：南方湿热地区用户（1分）\n营销建议： 推荐防水透气性能优越的帐篷，能够快速搭建并保持内部干燥，附送防潮垫和便携式帐篷风扇，帮助客户应对湿热天气。（1分）\n客户C分类：沿海城市用户（1分）\n营销建议： 推荐具有抗风能力和遮阳效果的帐篷，能够抵挡强风并有效遮阳，附赠沙滩帐篷钉和抗UV遮阳篷，满足海边露营需求。（1分）",
                                    grading_rule: "客户分类与差异化营销服务（6分）\n学生答案需要按照客户的居住地区进行分类，并针对每类客户提出相应的差异化营销服务建议。具体批改规则如下：\n\n1. 客户分类（3分）：\n 学生需将客户A、B、C分别归类为北方高寒地区用户、南方湿热地区用户和沿海城市用户。学生答案中只要正确归类了三类客户，即可得满分3分。若归类有误，则酌情扣分。\n2. 差异化营销服务建议（3分）：\n 针对每类客户，学生需提出相应的差异化营销服务建议。建议需与客户的实际需求相匹配，且具有一定的针对性和实用性。具体建议可以包括但不限于：推荐特定性能的帐篷、附赠相关配件或服务等。学生答案中只要针对每类客户都提出了合理的建议，且表述清晰，逻辑合理，即可得满分3分。若建议与客户需求不匹配，或表述不清，逻辑不合理，则酌情扣分。",
                                    alternative_answers: []
                                }
                            ],
                            Score: 9,
                            Difficulty: 2,
                            Tags: [
                                "电子商务"
                            ],
                            Analysis: "略，请见答案",
                            Title: null,
                            Input: null,
                            Output: null,
                            Order: null,
                            Creator: 1626,
                            CreateTime: 1756437327313,
                            UpdatedBy: null,
                            UpdateTime: 1756437327313,
                            Status: "00",
                            QuestionAttachmentsPath: [],
                            AccessMode: "00",
                            BelongTo: 160
                        },
                        {
                            ID: 517,
                            Type: "00",
                            Content: "<p><span style=\"font-size: 12pt\">这是一道测试编辑题目的单选题666</span></p>",
                            Options: [
                                {
                                    label: "A",
                                    value: "<p><span style=\"font-size: 12pt\">1</span></p>"
                                },
                                {
                                    label: "B",
                                    value: "<p><span style=\"font-size: 12pt\">2</span></p>"
                                },
                                {
                                    label: "C",
                                    value: "<p><span style=\"font-size: 12pt\">3</span></p>"
                                },
                                {
                                    label: "D",
                                    value: "<p><span style=\"font-size: 12pt\">4</span></p>"
                                }
                            ],
                            Answers: [
                                "A"
                            ],
                            Score: 3,
                            Difficulty: 2,
                            Tags: [
                                "编辑题目",
                                "测试"
                            ],
                            Analysis: "",
                            Title: null,
                            Input: null,
                            Output: null,
                            Order: null,
                            Creator: 1626,
                            CreateTime: 1755864109937,
                            UpdatedBy: 1755918425852,
                            UpdateTime: 1755918425852,
                            Status: "00",
                            AccessMode: "00",
                            BelongTo: 106
                        }
                    ]
                })
            });

            // 点击single-bank类的（用类选择器）
            fireEvent.click(container.querySelector('.single-bank'));

            // 等待页面渲染完成
            await waitFor(() => {
                expect(screen.getAllByText(/无标签题目/)).toHaveLength(1);
            });

            // 验证"确认导入"按钮含有is-disabled类
            expect(screen.getByText('确认导入')).toHaveClass('is-disabled');

            // 点击"无标签题目"
            fireEvent.click(screen.getByText('无标签题目'));

            // mock返回结果
            global.fetch.mockResolvedValueOnce({
                ok: true,
                json: () => Promise.resolve({
                    API: "/api/paper/manual",
                    method: "PUT",
                    msg: "success",
                    status: 0,
                })
            });

            global.fetch.mockResolvedValueOnce({
                ok: true,
                json: () => Promise.resolve({
                    status: 0,
                    msg: "success",
                    API: "/api/paper/manual",
                    method: "GET",
                    data: SINGLE_PAPER_INFO,
                })
            });

            await waitFor(() => {
                expect(screen.getByText('确认导入')).not.toHaveClass('is-disabled');
            });
            
            // 点击"确认导入"
            fireEvent.click(screen.getByText('确认导入'));

            // 验证toast.success被调用
            await waitFor(() => {
                expect(toast.success).toHaveBeenCalledWith('导入成功', 1000);
            });

        });
    });
});