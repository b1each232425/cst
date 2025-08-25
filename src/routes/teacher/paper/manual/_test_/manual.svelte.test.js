/*
 * @Author: WangKaidun 1597225095@qq.com
 * @Date: 2025-08-18 20:02:57
 * @LastEditors: WangKaidun 1597225095@qq.com
 * @LastEditTime: 2025-08-24 12:18:08
 * @FilePath: \exam\src\routes\teacher\paper\manual\_test_\manual.svelte.test.js
 * @Description: 自定义组卷页面测试
 * Copyright (c) 2025 by WangKaidun 1597225095@qq.com, All Rights Reserved. 
 */

import { render, screen, fireEvent, waitFor, cleanup, container } from '@testing-library/svelte';
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
            render(Manual);
            
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
                render(Manual);

                // 等待页面渲染完成（有题组说明渲染完成）
                await waitFor(() => {
                    // 泛型匹配（有两个）
                    expect(screen.getAllByText(/测试题组/)).toHaveLength(2);
                });

                // 点击从题库中导入按钮
                const importButton = screen.getByText('从题库中导入');
                fireEvent.click(importButton);

                // 验证“题库列表”四个字
                await waitFor(() => {
                    expect(screen.getByText('题库列表')).toBeInTheDocument();
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

                // 验证标题“题组列表”
                expect(screen.getByText('题组列表')).toBeInTheDocument();

                // 验证group-count类的存在
                expect(container.querySelector('.group-count')).toBeInTheDocument();

                // 验证“添加题组”按钮
                expect(screen.getByText('添加题组')).toBeInTheDocument();

                // 验证“测试题组（共5题，共15分）”有两个
                expect(screen.getAllByText('测试题组（共5题，共15分）')).toHaveLength(2);

                // 验证“空白题组（共0题，共0分）”有两个
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

                        // 获取第一个标签，用placeholder为“+标签”的input
                        const input = paperTag.querySelector('input');

                        // 验证当前输入框为空
                        expect(input).toHaveValue('');

                        // 获取第一个color-block类元素(container.querySelector)
                        const colorBlock = container.querySelectorAll('.color-block')[0];

                        // 验证color-block含有style:background-color: #40d5ff
                        expect(colorBlock).toHaveStyle('background-color: #40d5ff');

                        // 输入“测试标签”
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

                        // 获取第一个标签，用placeholder为“+标签”的input
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

                        // 验证当前输入框为“测试”
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

                        // 验证当前输入框为“测试”
                        expect(input).toHaveValue('测试');

                        // 输入“测试标签”
                        fireEvent.input(input, { target: { value: '测试标签' } });

                        // blur
                        fireEvent.blur(input);

                        // 验证第二个标签内容为“测试标签”
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

                        // 点击“添加题组”按钮
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

                        // 点击“添加题组”按钮
                        const addGroupButton = screen.getByText('添加题组');
                        fireEvent.click(addGroupButton);

                        // 验证add-group类的存在
                        await waitFor(() => {
                            expect(container.querySelector('.add-group')).toBeInTheDocument();
                        });

                        // 输入“新增测试题组”
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

                        // 点击第一个“删除”按钮（用class为delete-group-btn的button）
                        const deleteButton = container.querySelectorAll('.delete-group-btn')[0];
                        fireEvent.click(deleteButton);

                        // 验证弹窗
                        await waitFor(() => {
                            expect(screen.getByText('删除确认')).toBeInTheDocument();
                            expect(screen.getByText('请问是否要删除该题组？')).toBeInTheDocument();
                        });

                        // 点击“确定”按钮
                        const confirmButton = screen.getByText('确定');
                        fireEvent.click(confirmButton);

                        // 验证toast.success
                        await waitFor(() => {
                            expect(toast.success).toHaveBeenCalledWith('删除成功', 1000);
                        });

                        // 重新获取第一个“删除”按钮
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

                        // 点击“编辑”按钮（用class为edit-group-btn的button）
                        const editButton = container.querySelector('.edit-group-btn');
                        fireEvent.click(editButton);

                        // 验证edit-group类的存在
                        await waitFor(() => {
                            expect(container.querySelector('.edit-group')).toBeInTheDocument();
                        });

                        // 获取input
                        const input = container.querySelector('.add-group-input');

                        // 输入“测试题组”
                        fireEvent.change(input, { target: { value: '测试题组' } });

                        // blur
                        fireEvent.blur(input);

                        // 验证add-group类不存在
                        await waitFor(() => {
                            expect(container.querySelector('.add-group')).not.toBeInTheDocument();
                        });
                    });

                    // it('拖拽题组', async () => {
                    //     // 使用独立的测试数据
                    //     const SINGLE_PAPER_INFO = {
                    //         ID: 230,
                    //         Name: "测试试卷",
                    //         Category: "00",
                    //         Level: "00",
                    //         SuggestedDuration: 66,
                    //         Description: "我是试卷的说明",
                    //         Tags: ["测试", "简答", "填空"],
                    //         TotalScore: 15,
                    //         QuestionCount: 5,
                    //         GroupsData: [
                    //             {
                    //                 id: 1196,
                    //                 name: "测试题组",
                    //                 order: 1,
                    //                 questions: [
                    //                     SINGLE_CHOICE_QUESTION,
                    //                     MULTIPLE_CHOICE_QUESTION,
                    //                     TRUE_FALSE_QUESTION,
                    //                     FILL_BLANK_QUESTION,
                    //                     SHORT_ANSWER_QUESTION
                    //                 ],
                    //             },
                    //             {
                    //                 id: 1197,
                    //                 name: "空白题组",
                    //                 order: 2,
                    //                 questions: []
                    //             }
                    //         ]
                    //     };

                    //     // 临时mock试卷信息
                    //     global.fetch.mockResolvedValueOnce({
                    //         ok: true,
                    //         json: () => Promise.resolve({
                    //             status: 0,
                    //             msg: "success",
                    //             API: "/api/paper/manual",
                    //             method: "GET",
                    //             data: SINGLE_PAPER_INFO,
                    //         })
                    //     });

                    //     const { container } = render(Manual);

                    //     // 等待页面渲染完成（有题组说明渲染完成）
                    //     await waitFor(() => {
                    //         // 泛型匹配（有两个）
                    //         expect(screen.getAllByText(/测试题组/)).toHaveLength(2);
                    //     });

                    //     // 假的 dataTransfer
                    //     const dataTransfer = {
                    //         effectAllowed: "",
                    //         setData: vi.fn(),
                    //         getData: vi.fn(),
                    //     };

                    //     // 定位到题组列表的div
                    //     const groupList = container.querySelector('.question-groups-outer-box');

                    //     // 获取第一个题组和第二个题组
                    //     const group1 = groupList.querySelectorAll('.single-group')[0];
                    //     const group2 = groupList.querySelectorAll('.single-group')[1];

                    //     // 验证第一个题组是"测试题组"
                    //     expect(group1.textContent).toContain('测试题组（共5题，共15分）');

                    //     // 验证第二个题组是"空白题组"
                    //     expect(group2.textContent).toContain('空白题组（共0题，共0分）');

                    //     // 拖拽第一个题组到第二个题组下方
                    //     fireEvent.dragStart(group1, { dataTransfer });
                    //     fireEvent.dragOver(group2,
                    //         {
                    //             clientY: group2.getBoundingClientRect().top + group2.getBoundingClientRect().height * 0.9,
                    //             dataTransfer
                    //         });
                    //     fireEvent.drop(group2, { dataTransfer });

                    //     // 使用独立的测试数据
                    //     const SINGLE_PAPER_INFO2 = {
                    //         ID: 230,
                    //         Name: "测试试卷",
                    //         Category: "00",
                    //         Level: "00",
                    //         SuggestedDuration: 66,
                    //         Description: "我是试卷的说明",
                    //         Tags: ["测试", "简答", "填空"],
                    //         TotalScore: 15,
                    //         QuestionCount: 5,
                    //         GroupsData: [
                    //             {
                    //                 id: 1197,
                    //                 name: "空白题组",
                    //                 order: 2,
                    //                 questions: []
                    //             },
                    //             {
                    //                 id: 1196,
                    //                 name: "测试题组",
                    //                 order: 1,
                    //                 questions: [
                    //                     SINGLE_CHOICE_QUESTION,
                    //                     MULTIPLE_CHOICE_QUESTION,
                    //                     TRUE_FALSE_QUESTION,
                    //                     FILL_BLANK_QUESTION,
                    //                     SHORT_ANSWER_QUESTION
                    //                 ],
                    //             },
                    //         ]
                    //     };

                    //     // 临时mock试卷信息
                    //     global.fetch.mockResolvedValueOnce({
                    //         ok: true,
                    //         json: () => Promise.resolve({
                    //             status: 0,
                    //             msg: "success",
                    //             API: "/api/paper/manual",
                    //             method: "GET",
                    //             data: SINGLE_PAPER_INFO2,
                    //         })
                    //     });

                    //     // 重新获取第一个题组和第二个题组
                    //     const group10 = groupList.querySelectorAll('.single-group')[0];
                    //     const group20 = groupList.querySelectorAll('.single-group')[1];

                    //     await waitFor(() => {
                    //         expect(group10.textContent).toContain('空白题组（共0题，共0分）');
                    //         expect(group20.textContent).toContain('测试题组（共5题，共15分）');
                    //     });

                    //     // 拖拽第二个题组到第一个题组上方
                    //     fireEvent.dragStart(group20, { dataTransfer });
                    //     fireEvent.dragOver(group10,
                    //         {
                    //             clientY: group10.getBoundingClientRect().top + group10.getBoundingClientRect().height * 0.1,
                    //             dataTransfer
                    //         });
                    //     fireEvent.drop(group10, { dataTransfer });

                    // });
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

                // 验证sidebar-collapsed-btn的title为“展开”
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

                // 验证“分值：”有2个
                expect(screen.getAllByText('分值：')).toHaveLength(5);

                // 验证“导入题目”有3个
                expect(screen.getAllByText('导入题目')).toHaveLength(3);

                // 验证“题组暂无题目”
                expect(screen.getByText('题组暂无题目')).toBeInTheDocument();
                expect(screen.getByText('可以通过以下方式快速添加题目：')).toBeInTheDocument();

                // 验证easy-level类的存在
                expect(container.querySelector('.easy-level')).toBeInTheDocument();
                expect(container.querySelector('.normal-level')).toBeInTheDocument();
                expect(container.querySelector('.hard-level')).toBeInTheDocument();

                // 验证question-type类有5个
                expect(container.querySelectorAll('.question-type')).toHaveLength(5);

                // 验证title为“上移”的button有5个
                expect(container.querySelectorAll('button[title="上移"]')).toHaveLength(7);

                // 验证title为“下移”的button有5个
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

                            it('连续移动题组 - 覆盖highlightGroup的if分支', async () => {
                                // 使用独立的测试数据
                                const SINGLE_PAPER_INFO = {
                                    ID: 230,
                                    Name: "测试试卷",
                                    Category: "00",
                                    Level: "00",
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
                                    GroupsData: [
                                        {
                                            id: 1196,
                                            name: "移动题组1",
                                            order: 1,
                                            questions: [],
                                        },
                                        {
                                            id: 1197,
                                            name: "移动题组3",
                                            order: 2,
                                            questions: [],
                                        },
                                        {
                                            id: 1198,
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
                            
                                // 关键：在5秒内再次移动同一个题组，触发highlightGroup的if分支
                                // 等待一小段时间，确保第一次高亮还在
                                await new Promise(resolve => setTimeout(resolve, 100));
                            
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
                                    GroupsData: [
                                        {
                                            id: 1196,
                                            name: "移动题组3",
                                            order: 1,
                                            questions: [],
                                        },
                                        {
                                            id: 1197,
                                            name: "移动题组1",
                                            order: 2,
                                            questions: [],
                                        },
                                        {
                                            id: 1198,
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
                            
                                // 再次点击上移按钮（同一个题组）
                                const groupHeader2 = container.querySelectorAll('.group-header')[1];
                                const moveBtn2 = groupHeader2.querySelector('button[title="上移"]');
                                fireEvent.click(moveBtn2);
                            
                                // 验证第二次移动完成
                                await waitFor(() => {
                                    const groupHeader3 = container.querySelectorAll('.group-header')[0];
                                    expect(groupHeader3.textContent).toContain("移动题组3");
                                });
                            
                                // 等待一小段时间，让定时器有机会执行
                                await new Promise(resolve => setTimeout(resolve, 100));
                            });
                        });
                    });

                    describe('题目', () => {
                        // it('正常情况', async () => {

                        // });
                    });
                });
            });
        });
    });
});