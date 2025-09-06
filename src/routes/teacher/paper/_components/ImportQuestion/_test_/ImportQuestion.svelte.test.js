/*
 * @Author: WangKaidun 1597225095@qq.com
 * @Date: 2025-08-18 18:52:56
 * @LastEditors: WangKaidun 1597225095@qq.com
 * @LastEditTime: 2025-09-05 22:00:07
 * @FilePath: \exam\src\routes\teacher\paper\_components\ImportQuestion\_test_\ImportQuestion.svelte.test.js
 * @Description: 导入题目组件的测试
 * Copyright (c) 2025 by WangKaidun 1597225095@qq.com, All Rights Reserved. 
 */

import { render, screen, fireEvent, waitFor, cleanup } from '@testing-library/svelte';
import { describe, it, expect, vi, afterEach, beforeEach } from 'vitest';

import { goto } from '$app/navigation';

import Manual from '../../../manual/+page@.svelte';
import { CURRENT_PAPER_ID, GROUP_OPEN_STATE, QUESTION_OPEN_STATE, SIDEBAR_COLLAPSED } from '../../../_stores/store';
import { toast } from "$lib/components/Toast/Toast";
import { get } from 'svelte/store';
import { MULTIPLE_CHOICE_QUESTION, SINGLE_CHOICE_QUESTION } from './utils';

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

describe('导入题目组件', () => {
    beforeEach( async () => {
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
        it('失败情况1：获取题库列表请求失败', async () => {
            const { container } = render(Manual);

            // 等待页面渲染完成（有题组说明渲染完成）
            await waitFor(() => {
                expect(screen.getAllByText(/测试题组/)).toHaveLength(2);
            });

            // 修改mock信息：请求失败
            global.fetch.mockResolvedValueOnce({
                ok: false,
                status: 400
            });

            // 点击"从题库中导入"按钮
            fireEvent.click(screen.getByText('从题库中导入'));

            // 验证toast提示
            await waitFor(() => {
                expect(toast.error).toHaveBeenCalledWith(`请求失败，状态码：400`, 1000);
            });
        });

        it('失败情况2：获取题库列表业务错误', async () => {
            const { container } = render(Manual);

            // 等待页面渲染完成（有题组说明渲染完成）
            await waitFor(() => {
                expect(screen.getAllByText(/测试题组/)).toHaveLength(2);
            });

            // 修改mock信息：请求失败
            global.fetch.mockResolvedValueOnce({
                ok: true,
                json: () => Promise.resolve({
                    status: -1,
                    msg: "业务错误"
                })
            });

            // 点击"从题库中导入"按钮
            fireEvent.click(screen.getByText('从题库中导入'));

            // 验证toast提示
            await waitFor(() => {
                expect(toast.error).toHaveBeenCalledWith(`业务错误`, 1000);
            });
        });

        it('空列表', async () => {
            const { container } = render(Manual);

            // 等待页面渲染完成（有题组说明渲染完成）
            await waitFor(() => {
                expect(screen.getAllByText(/测试题组/)).toHaveLength(2);
            });

            global.fetch.mockResolvedValueOnce({
                ok: true,
                json: () => Promise.resolve({
                    data: null,
                    status: 0,
                    msg: "success",
                    API: "/api/question-banks",
                    method: "GET",
                    rowCount: 0,
                })
            });

            // 点击"从题库中导入"按钮
            fireEvent.click(screen.getByText('从题库中导入'));

            // 验证没有single-bank
            await waitFor(() => {
                expect(container.querySelectorAll('.single-bank').length).toBe(0);
            });
        });
    });

    describe('头部', () => {
        it('渲染', async () => {
            const { container } = render(Manual);

            // 等待页面渲染完成
            await waitFor(() => {
                expect(screen.getAllByText(/测试题组/)).toHaveLength(2);
            });

            // 点击从题库中导入按钮
            fireEvent.click(screen.getByText('从题库中导入'));

            // 验证标题
            await waitFor(() => {
                expect(screen.getByText('从题库中导入题目')).toBeInTheDocument();
            });

            // 获取container-header类
            const containerHeader = container.querySelector('.container-header');

            // 验证标题
            expect(containerHeader.querySelector('.title')).toHaveTextContent('从题库中导入题目');

            // 验证关闭按钮
            expect(containerHeader.querySelector('.close-import-btn')).toBeInTheDocument();
        });

        it('交互', async () => {
            const { container } = render(Manual);

            // 等待页面渲染完成
            await waitFor(() => {
                expect(screen.getAllByText(/测试题组/)).toHaveLength(2);
            });

            // 点击从题库中导入按钮
            fireEvent.click(screen.getByText('从题库中导入'));

            // 验证标题
            await waitFor(() => {
                expect(screen.getByText('从题库中导入题目')).toBeInTheDocument();
            });

            // 获取container-header类
            const containerHeader = container.querySelector('.container-header');

            // 验证关闭按钮
            expect(containerHeader.querySelector('.close-import-btn')).toBeInTheDocument();

            // mock关闭按钮调用的回调onclose函数
            const onclose = vi.fn();
            containerHeader.querySelector('.close-import-btn').addEventListener('click', onclose);

            // 点击关闭按钮
            fireEvent.click(containerHeader.querySelector('.close-import-btn'));

            // 验证onclose函数被调用
            expect(onclose).toHaveBeenCalled();
        });
    });

    describe('内容区', () => {
        describe('左侧区域', () => {
            it('搜索', async () => {
                const { container } = render(Manual);

                // 等待页面渲染完成
                await waitFor(() => {
                    expect(screen.getAllByText(/测试题组/)).toHaveLength(2);
                });

                // mock空列表
                global.fetch.mockResolvedValueOnce({
                    ok: true,
                    json: () => Promise.resolve({
                        data: null,
                        status: 0,
                        msg: "success",
                        API: "/api/question-banks",
                        method: "GET",
                        rowCount: 0,
                    })
                });

                // 点击从题库中导入按钮
                fireEvent.click(screen.getByText('从题库中导入'));

                // 验证标题
                await waitFor(() => {
                    expect(screen.getByText('从题库中导入题目')).toBeInTheDocument();
                });

                // 获取body-left类
                const bodyLeft = container.querySelector('.body-left');

                // 获取search-box类
                const searchBox = bodyLeft.querySelector('.search-box');

                // 获取input类
                const input = searchBox.querySelector('input');

                // mock空列表
                global.fetch.mockResolvedValueOnce({
                    ok: true,
                    json: () => Promise.resolve({
                        data: null,
                        status: 0,
                        msg: "success",
                        API: "/api/question-banks",
                        method: "GET",
                        rowCount: 0,
                    })
                });

                // 输入内容
                fireEvent.input(input, { target: { value: '测试' } });

                // 等待600ms
                await new Promise((resolve) => setTimeout(resolve, 600));

                // mock空列表
                global.fetch.mockResolvedValueOnce({
                    ok: true,
                    json: () => Promise.resolve({
                        data: null,
                        status: 0,
                        msg: "success",
                        API: "/api/question-banks",
                        method: "GET",
                        rowCount: 0,
                    })
                });

                // 点击清除按钮
                fireEvent.click(searchBox.querySelector('.clear-btn'));
            });

            describe('单选题库', () => {
                it('失败情况1：请求失败', async () => {
                    const { container } = render(Manual);

                    // 等待页面渲染完成
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

                    // 点击从题库中导入按钮
                    fireEvent.click(screen.getByText('从题库中导入'));

                    // 验证标题
                    await waitFor(() => {
                        expect(screen.getByText('从题库中导入题目')).toBeInTheDocument();
                    });

                    // 获取body-left类
                    const bodyLeft = container.querySelector('.body-left');

                    // 获取question-bank-list类
                    const questionBankList = bodyLeft.querySelector('.question-bank-list');

                    // 验证有single-bank
                    await waitFor(() => {
                        expect(questionBankList.querySelectorAll('.single-bank').length).toBe(1);
                    });

                    // mock失败信息
                    global.fetch.mockResolvedValueOnce({
                        ok: false,
                        status: 400
                    });

                    // 点击single-bank类（用类选择器）
                    fireEvent.click(questionBankList.querySelector('.single-bank'));

                    // 验证toast提示
                    await waitFor(() => {
                        expect(toast.error).toHaveBeenCalledWith(`请求失败，状态码：400`, 1000);
                    });

                    // 再次点击single-bank类（用类选择器）
                    fireEvent.click(questionBankList.querySelector('.single-bank'));
                });

                it('失败情况2：业务错误', async () => {
                    const { container } = render(Manual);

                    // 等待页面渲染完成
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

                    // 点击从题库中导入按钮
                    fireEvent.click(screen.getByText('从题库中导入'));

                    // 验证标题
                    await waitFor(() => {
                        expect(screen.getByText('从题库中导入题目')).toBeInTheDocument();
                    });

                    // 获取body-left类
                    const bodyLeft = container.querySelector('.body-left');

                    // 获取question-bank-list类
                    const questionBankList = bodyLeft.querySelector('.question-bank-list');

                    // 验证有single-bank
                    await waitFor(() => {
                        expect(questionBankList.querySelectorAll('.single-bank').length).toBe(1);
                    });

                    // mock 业务错误
                    global.fetch.mockResolvedValueOnce({
                        ok: true,
                        json: () => Promise.resolve({
                            status: -1,
                            msg: "业务错误"
                        })
                    });

                    // 点击single-bank类（用类选择器）
                    fireEvent.click(questionBankList.querySelector('.single-bank'));

                    // 验证toast提示
                    await waitFor(() => {
                        expect(toast.error).toHaveBeenCalledWith(`业务错误`, 1000);
                    });
                });

                it('正常情况', async () => {
                    const { container } = render(Manual);

                    // 等待页面渲染完成
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

                    // 点击从题库中导入按钮
                    fireEvent.click(screen.getByText('从题库中导入'));

                    // 验证标题
                    await waitFor(() => {
                        expect(screen.getByText('从题库中导入题目')).toBeInTheDocument();
                    });

                    // 获取body-left类
                    const bodyLeft = container.querySelector('.body-left');

                    // 获取question-bank-list类
                    const questionBankList = bodyLeft.querySelector('.question-bank-list');

                    // 验证有single-bank
                    await waitFor(() => {
                        expect(questionBankList.querySelectorAll('.single-bank').length).toBe(1);
                    });

                    // mock 空题目列表
                    global.fetch.mockResolvedValueOnce({
                        ok: true,
                        json: () => Promise.resolve({
                            API: "/api/questions",
                            method: "GET",
                            status: 0,
                            msg: "success",
                            rowCount: 0,
                            data: null,
                        })
                    });

                    // 点击single-bank类（用类选择器）
                    fireEvent.click(questionBankList.querySelector('.single-bank'));

                    // 验证表格为空
                    await waitFor(() => {
                        expect(container.querySelectorAll('tbody tr').length).toBe(0);
                    });

                    // 验证“共0条”
                    expect(screen.getByText('共 0 条')).toBeInTheDocument();
                });
            });
        });

        describe('右侧区域', () => {
            describe('搜索', () => {
                it('未选中题库', async () => {
                    const { container } = render(Manual);

                    // 等待页面渲染完成
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

                    // 点击从题库中导入按钮
                    fireEvent.click(screen.getByText('从题库中导入'));

                    // 验证标题
                    await waitFor(() => {
                        expect(screen.getByText('从题库中导入题目')).toBeInTheDocument();
                    });

                    // 获取body-right类
                    const bodyRight = container.querySelector('.body-right');

                    // 获取top-area类
                    const topArea = bodyRight.querySelector('.top-area');

                    // 获取placeholder为"搜索题目内容"的input类
                    const input = topArea.querySelector('input[placeholder="搜索题目内容"]');

                    // 输入内容
                    fireEvent.input(input, { target: { value: '测试' } });

                    // 等待600ms
                    await new Promise((resolve) => setTimeout(resolve, 600));
                    
                    // 点击清除按钮
                    fireEvent.click(topArea.querySelector('.clear-btn'));
                });

                it('选中题库', async () => {
                    const { container } = render(Manual);

                    // 等待页面渲染完成
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
                                    QuestionTags: ["单选题的标签"],
                                    QuestionTypes: ["00","02"],
                                    QuestionDifficulties: [2,3],
                                    CreateTime: 1722100200000,
                                    UpdateTime: 1722100200000,
                                    Type: "00",
                                    Status: "00",
                                }
                            ]
                        })
                    });

                    // 点击从题库中导入按钮
                    fireEvent.click(screen.getByText('从题库中导入'));

                    // 验证标题
                    await waitFor(() => {
                        expect(screen.getByText('从题库中导入题目')).toBeInTheDocument();
                    });

                    // 获取body-left类
                    const bodyLeft = container.querySelector('.body-left');

                    // 获取question-bank-list类
                    const questionBankList = bodyLeft.querySelector('.question-bank-list');

                    // 验证有single-bank
                    await waitFor(() => {
                        expect(questionBankList.querySelectorAll('.single-bank').length).toBe(1);
                    });

                    // 点击single-bank类（用类选择器）
                    fireEvent.click(questionBankList.querySelector('.single-bank'));

                    // 获取body-right类
                    const bodyRight = container.querySelector('.body-right');

                    // 获取top-area类
                    const topArea = bodyRight.querySelector('.top-area');

                    // 获取placeholder为"搜索题目内容"的input类
                    const input = topArea.querySelector('input[placeholder="搜索题目内容"]');

                    // mock 题目列表
                    global.fetch.mockResolvedValueOnce({
                        ok: true,
                        json: () => Promise.resolve({
                            API: "/api/questions",
                            method: "GET",
                            status: 0,
                            msg: "success",
                            rowCount: 2,
                            data: [
                                SINGLE_CHOICE_QUESTION,
                                MULTIPLE_CHOICE_QUESTION
                            ],
                        })
                    });

                    // 输入内容
                    fireEvent.input(input, { target: { value: '测试' } });

                    // 等待600ms
                    await new Promise((resolve) => setTimeout(resolve, 600));

                    // 验证表格有2行
                    await waitFor(() => {
                        expect(container.querySelectorAll('tbody tr').length).toBe(2);
                    });

                    // mock 空题目列表
                    global.fetch.mockResolvedValueOnce({
                        ok: true,
                        json: () => Promise.resolve({
                            API: "/api/questions",
                            method: "GET",
                            status: 0,
                            msg: "success",
                            rowCount: 0,
                            data: null,
                        })
                    });

                    // 点击清除按钮
                    fireEvent.click(topArea.querySelector('.clear-btn'));

                    // 验证表格为空
                    await waitFor(() => {
                        expect(container.querySelectorAll('tbody tr').length).toBe(0);
                    });

                    // mock 空题目列表
                    global.fetch.mockResolvedValueOnce({
                        ok: true,
                        json: () => Promise.resolve({
                            API: "/api/questions",
                            method: "GET",
                            status: 0,
                            msg: "success",
                            rowCount: 0,
                            data: null,
                        })
                    });

                    // 再次输入内容
                    fireEvent.input(input, { target: { value: '测试' } });

                    // 等待600ms
                    await new Promise((resolve) => setTimeout(resolve, 600));

                    // 验证表格为空
                    await waitFor(() => {
                        expect(container.querySelectorAll('tbody tr').length).toBe(0);
                    });
                });
            });

            describe('筛选', () => {
                it('筛选题型', async () => {
                    const { container } = render(Manual);

                    // 等待页面渲染完成
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
                                    QuestionTags: ["单选题的标签"],
                                    QuestionTypes: ["00","02"],
                                    QuestionDifficulties: [2,3],
                                    CreateTime: 1722100200000,
                                    UpdateTime: 1722100200000,
                                    Type: "00",
                                    Status: "00",
                                }
                            ]
                        })
                    });

                    // 点击从题库中导入按钮
                    fireEvent.click(screen.getByText('从题库中导入'));

                    // 验证标题
                    await waitFor(() => {
                        expect(screen.getByText('从题库中导入题目')).toBeInTheDocument();
                    });

                    // 获取body-left类
                    const bodyLeft = container.querySelector('.body-left');

                    // 获取question-bank-list类
                    const questionBankList = bodyLeft.querySelector('.question-bank-list');

                    // 验证有single-bank
                    await waitFor(() => {
                        expect(questionBankList.querySelectorAll('.single-bank').length).toBe(1);
                    });

                    // 点击single-bank类（用类选择器）
                    fireEvent.click(questionBankList.querySelector('.single-bank'));

                    // 获取body-right类
                    const bodyRight = container.querySelector('.body-right');

                    // 获取top-area类
                    const topArea = bodyRight.querySelector('.top-area');

                    // 获取filter-header类
                    const filterHeader = topArea.querySelector('.filter-header');
                    
                    // onmouseenter这个filter-header类
                    fireEvent.mouseEnter(filterHeader);

                    // 验证有filter-container类
                    await waitFor(() => {
                        expect(topArea.querySelector('.filter-container')).toBeInTheDocument();
                    });

                    // 获取filter-container类
                    const filterContainer = topArea.querySelector('.filter-container');

                    // 获取filter-container里的type类
                    const type = filterContainer.querySelector('.type');

                    // 验证里面有button两个
                    await waitFor(() => {
                        expect(type.querySelectorAll('button').length).toBe(2);
                    });

                    // 获取type里的第一个button
                    const button = type.querySelectorAll('button')[0];

                    // mock 题目列表
                    global.fetch.mockResolvedValueOnce({
                        ok: true,
                        json: () => Promise.resolve({
                            API: "/api/questions",
                            method: "GET",
                            status: 0,
                            msg: "success",
                            rowCount: 1,
                            data: [SINGLE_CHOICE_QUESTION],
                        })
                    });
                    
                    // 点击button类
                    fireEvent.click(button);

                    // 验证表格有1行
                    await waitFor(() => {
                        expect(container.querySelectorAll('tbody tr').length).toBe(1);
                    });

                    // mock 题目列表
                    global.fetch.mockResolvedValueOnce({
                        ok: true,
                        json: () => Promise.resolve({
                            API: "/api/questions",
                            method: "GET",
                            status: 0,
                            msg: "success",
                            rowCount: 0,
                            data: null,
                        })
                    });

                    // 再次点击button类
                    fireEvent.click(button);

                    // 验证表格为空
                    await waitFor(() => {
                        expect(container.querySelectorAll('tbody tr').length).toBe(0);
                    });
                });

                it('筛选难度', async () => {
                    const { container } = render(Manual);

                    // 等待页面渲染完成
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
                                    QuestionTags: ["单选题的标签"],
                                    QuestionTypes: ["00","02"],
                                    QuestionDifficulties: [2,3],
                                    CreateTime: 1722100200000,
                                    UpdateTime: 1722100200000,
                                    Type: "00",
                                    Status: "00",
                                }
                            ]
                        })
                    });

                    // 点击从题库中导入按钮
                    fireEvent.click(screen.getByText('从题库中导入'));

                    // 验证标题
                    await waitFor(() => {
                        expect(screen.getByText('从题库中导入题目')).toBeInTheDocument();
                    });

                    // 获取body-left类
                    const bodyLeft = container.querySelector('.body-left');

                    // 获取question-bank-list类
                    const questionBankList = bodyLeft.querySelector('.question-bank-list');

                    // 验证有single-bank
                    await waitFor(() => {
                        expect(questionBankList.querySelectorAll('.single-bank').length).toBe(1);
                    });

                    // 点击single-bank类（用类选择器）
                    fireEvent.click(questionBankList.querySelector('.single-bank'));

                    // 获取body-right类
                    const bodyRight = container.querySelector('.body-right');

                    // 获取top-area类
                    const topArea = bodyRight.querySelector('.top-area');

                    // 获取filter-header类
                    const filterHeader = topArea.querySelector('.filter-header');
                    
                    // onmouseenter这个filter-header类
                    fireEvent.mouseEnter(filterHeader);

                    // 验证有filter-container类
                    await waitFor(() => {
                        expect(topArea.querySelector('.filter-container')).toBeInTheDocument();
                    });

                    // 获取filter-container类
                    const filterContainer = topArea.querySelector('.filter-container');

                    // 获取filter-container里的level类
                    const level = filterContainer.querySelector('.level');

                    // 验证里面有button两个
                    await waitFor(() => {
                        expect(level.querySelectorAll('button').length).toBe(2);
                    });

                    // 获取type里的第一个button
                    const button = level.querySelectorAll('button')[0];

                    // mock 题目列表
                    global.fetch.mockResolvedValueOnce({
                        ok: true,
                        json: () => Promise.resolve({
                            API: "/api/questions",
                            method: "GET",
                            status: 0,
                            msg: "success",
                            rowCount: 1,
                            data: [SINGLE_CHOICE_QUESTION],
                        })
                    });
                    
                    // 点击button类
                    fireEvent.click(button);

                    // 验证表格有1行
                    await waitFor(() => {
                        expect(container.querySelectorAll('tbody tr').length).toBe(1);
                    });

                    // mock 题目列表
                    global.fetch.mockResolvedValueOnce({
                        ok: true,
                        json: () => Promise.resolve({
                            API: "/api/questions",
                            method: "GET",
                            status: 0,
                            msg: "success",
                            rowCount: 0,
                            data: null,
                        })
                    });

                    // 再次点击button类
                    fireEvent.click(button);

                    // 验证表格为空
                    await waitFor(() => {
                        expect(container.querySelectorAll('tbody tr').length).toBe(0);
                    });
                });

                it('筛选标签', async () => {
                    const { container } = render(Manual);

                    // 等待页面渲染完成
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
                                    QuestionTags: ["单选题的标签"],
                                    QuestionTypes: ["00","02"],
                                    QuestionDifficulties: [2,3],
                                    CreateTime: 1722100200000,
                                    UpdateTime: 1722100200000,
                                    Type: "00",
                                    Status: "00",
                                }
                            ]
                        })
                    });

                    // 点击从题库中导入按钮
                    fireEvent.click(screen.getByText('从题库中导入'));

                    // 验证标题
                    await waitFor(() => {
                        expect(screen.getByText('从题库中导入题目')).toBeInTheDocument();
                    });

                    // 获取body-left类
                    const bodyLeft = container.querySelector('.body-left');

                    // 获取question-bank-list类
                    const questionBankList = bodyLeft.querySelector('.question-bank-list');

                    // 验证有single-bank
                    await waitFor(() => {
                        expect(questionBankList.querySelectorAll('.single-bank').length).toBe(1);
                    });

                    // 点击single-bank类（用类选择器）
                    fireEvent.click(questionBankList.querySelector('.single-bank'));

                    // 获取body-right类
                    const bodyRight = container.querySelector('.body-right');

                    // 获取top-area类
                    const topArea = bodyRight.querySelector('.top-area');

                    // 获取filter-header类
                    const filterHeader = topArea.querySelector('.filter-header');
                    
                    // onmouseenter这个filter-header类
                    fireEvent.mouseEnter(filterHeader);

                    // 验证有filter-container类
                    await waitFor(() => {
                        expect(topArea.querySelector('.filter-container')).toBeInTheDocument();
                    });

                    // 获取filter-container类
                    const filterContainer = topArea.querySelector('.filter-container');

                    // 获取filter-container里的question-tags类
                    const questionTags = filterContainer.querySelector('.question-tags');

                    // 验证里面有button一个
                    await waitFor(() => {
                        expect(questionTags.querySelectorAll('button').length).toBe(1);
                    });

                    // 获取question-tags里的第一个button
                    const button = questionTags.querySelectorAll('button')[0];

                    // mock 题目列表
                    global.fetch.mockResolvedValueOnce({
                        ok: true,
                        json: () => Promise.resolve({
                            API: "/api/questions",
                            method: "GET",
                            status: 0,
                            msg: "success",
                            rowCount: 1,
                            data: [SINGLE_CHOICE_QUESTION],
                        })
                    });
                    
                    // 点击button类
                    fireEvent.click(button);

                    // 验证表格有1行
                    await waitFor(() => {
                        expect(container.querySelectorAll('tbody tr').length).toBe(1);
                    });

                    // mock 题目列表
                    global.fetch.mockResolvedValueOnce({
                        ok: true,
                        json: () => Promise.resolve({
                            API: "/api/questions",
                            method: "GET",
                            status: 0,
                            msg: "success",
                            rowCount: 0,
                            data: null,
                        })
                    });

                    // 再次点击button类
                    fireEvent.click(button);

                    // 验证表格为空
                    await waitFor(() => {
                        expect(container.querySelectorAll('tbody tr').length).toBe(0);
                    });
                });

                describe('清空条件', () => {
                    it('选中题库', async () => {
                        const { container } = render(Manual);
    
                        // 等待页面渲染完成
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
                                        QuestionTags: ["单选题的标签"],
                                        QuestionTypes: ["00","02"],
                                        QuestionDifficulties: [2,3],
                                        CreateTime: 1722100200000,
                                        UpdateTime: 1722100200000,
                                        Type: "00",
                                        Status: "00",
                                    }
                                ]
                            })
                        });
    
                        // 点击从题库中导入按钮
                        fireEvent.click(screen.getByText('从题库中导入'));
    
                        // 验证标题
                        await waitFor(() => {
                            expect(screen.getByText('从题库中导入题目')).toBeInTheDocument();
                        });
    
                        // 获取body-left类
                        const bodyLeft = container.querySelector('.body-left');
    
                        // 获取question-bank-list类
                        const questionBankList = bodyLeft.querySelector('.question-bank-list');
    
                        // 验证有single-bank
                        await waitFor(() => {
                            expect(questionBankList.querySelectorAll('.single-bank').length).toBe(1);
                        });
    
                        // 点击single-bank类（用类选择器）
                        fireEvent.click(questionBankList.querySelector('.single-bank'));
    
                        // 获取body-right类
                        const bodyRight = container.querySelector('.body-right');
    
                        // 获取top-area类
                        const topArea = bodyRight.querySelector('.top-area');
    
                        // 获取filter-header类
                        const filterHeader = topArea.querySelector('.filter-header');
                        
                        // onmouseenter这个filter-header类
                        fireEvent.mouseEnter(filterHeader);
    
                        // 验证有filter-container类
                        await waitFor(() => {
                            expect(topArea.querySelector('.filter-container')).toBeInTheDocument();
                        });
    
                        // 获取filter-container类
                        const filterContainer = topArea.querySelector('.filter-container');
    
                        // 获取filter-container里的type类
                        const type = filterContainer.querySelector('.type');
    
                        // 验证里面有button两个
                        await waitFor(() => {
                            expect(type.querySelectorAll('button').length).toBe(2);
                        });
    
                        // 获取type里的第一个button
                        const button = type.querySelectorAll('button')[0];
    
                        // mock 题目列表
                        global.fetch.mockResolvedValueOnce({
                            ok: true,
                            json: () => Promise.resolve({
                                API: "/api/questions",
                                method: "GET",
                                status: 0,
                                msg: "success",
                                rowCount: 1,
                                data: [SINGLE_CHOICE_QUESTION],
                            })
                        });
                        
                        // 点击button类
                        fireEvent.click(button);
    
                        // 验证表格有1行
                        await waitFor(() => {
                            expect(container.querySelectorAll('tbody tr').length).toBe(1);
                        });
    
                        // mock 题目列表
                        global.fetch.mockResolvedValueOnce({
                            ok: true,
                            json: () => Promise.resolve({
                                API: "/api/questions",
                                method: "GET",
                                status: 0,
                                msg: "success",
                                rowCount: 0,
                                data: null,
                            })
                        });
    
                        // 点击清空条件按钮
                        fireEvent.click(topArea.querySelector('.clear-condition-btn'));
    
                        // 验证表格为空
                        await waitFor(() => {
                            expect(container.querySelectorAll('tbody tr').length).toBe(0);
                        });
                    });

                    it('未选中题库', async () => {
                        const { container } = render(Manual);
    
                        // 等待页面渲染完成
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
                                        QuestionTags: ["单选题的标签"],
                                        QuestionTypes: ["00","02"],
                                        QuestionDifficulties: [2,3],
                                        CreateTime: 1722100200000,
                                        UpdateTime: 1722100200000,
                                        Type: "00",
                                        Status: "00",
                                    }
                                ]
                            })
                        });
    
                        // 点击从题库中导入按钮
                        fireEvent.click(screen.getByText('从题库中导入'));
    
                        // 验证标题
                        await waitFor(() => {
                            expect(screen.getByText('从题库中导入题目')).toBeInTheDocument();
                        });
    
                        // 获取body-left类
                        const bodyLeft = container.querySelector('.body-left');
    
                        // 获取question-bank-list类
                        const questionBankList = bodyLeft.querySelector('.question-bank-list');
    
                        // 验证有single-bank
                        await waitFor(() => {
                            expect(questionBankList.querySelectorAll('.single-bank').length).toBe(1);
                        });
    
                        // 获取body-right类
                        const bodyRight = container.querySelector('.body-right');
    
                        // 获取top-area类
                        const topArea = bodyRight.querySelector('.top-area');
    
                        // 获取filter-header类
                        const filterHeader = topArea.querySelector('.filter-header');
                        
                        // onmouseenter这个filter-header类
                        fireEvent.mouseEnter(filterHeader);
    
                        // 验证有filter-container类
                        await waitFor(() => {
                            expect(topArea.querySelector('.filter-container')).toBeInTheDocument();
                        });
    
                        // 获取filter-container类
                        const filterContainer = topArea.querySelector('.filter-container');
    
                        // 点击清空条件按钮
                        fireEvent.click(topArea.querySelector('.clear-condition-btn'));
    
                        // 验证表格为空
                        await waitFor(() => {
                            expect(container.querySelectorAll('tbody tr').length).toBe(0);
                        });
                    });
                });
            });

            describe('表格', () => {
                it('全选', async () => {
                    const { container } = render(Manual);

                    // 等待页面渲染完成
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
                                    QuestionTags: ["单选题的标签"],
                                    QuestionTypes: ["00","02"],
                                    QuestionDifficulties: [2,3],
                                    CreateTime: 1722100200000,
                                    UpdateTime: 1722100200000,
                                    Type: "00",
                                    Status: "00",
                                }
                            ]
                        })
                    });

                    // 点击从题库中导入按钮
                    fireEvent.click(screen.getByText('从题库中导入'));

                    // 验证标题
                    await waitFor(() => {
                        expect(screen.getByText('从题库中导入题目')).toBeInTheDocument();
                    });

                    // 获取body-left类
                    const bodyLeft = container.querySelector('.body-left');

                    // 获取question-bank-list类
                    const questionBankList = bodyLeft.querySelector('.question-bank-list');

                    // 验证有single-bank
                    await waitFor(() => {
                        expect(questionBankList.querySelectorAll('.single-bank').length).toBe(1);
                    });

                    // mock 题目列表
                    global.fetch.mockResolvedValueOnce({
                        ok: true,
                        json: () => Promise.resolve({
                            API: "/api/questions",
                            method: "GET",
                            status: 0,
                            msg: "success",
                            rowCount: 1,
                            data: [SINGLE_CHOICE_QUESTION, MULTIPLE_CHOICE_QUESTION],
                        })
                    });

                    // 点击single-bank类（用类选择器）
                    fireEvent.click(questionBankList.querySelector('.single-bank'));

                    // 获取body-right类
                    const bodyRight = container.querySelector('.body-right');
                    
                    // 获取questions-table-container类
                    const questionsTableContainer = bodyRight.querySelector('.questions-table-container');

                    // 验证表格有2行
                    await waitFor(() => {
                        expect(questionsTableContainer.querySelectorAll('tbody tr').length).toBe(2);
                    });

                    // 获取thead类
                    const thead = questionsTableContainer.querySelector('thead');
                    
                    // 点击全选框
                    fireEvent.click(thead.querySelector('input[type="checkbox"]'));

                    // 再次点击全选框
                    fireEvent.click(thead.querySelector('input[type="checkbox"]'));

                    // 验证全选框是未选中状态
                    await waitFor(() => {
                        expect(thead.querySelector('input[type="checkbox"]').checked).toBe(false);
                    });

                    // 点击表格两条数据的勾选框
                    fireEvent.click(questionsTableContainer.querySelectorAll('tbody tr')[0].querySelector('input[type="checkbox"]'));
                    fireEvent.click(questionsTableContainer.querySelectorAll('tbody tr')[1].querySelector('input[type="checkbox"]'));

                    // 验证全选框是选中状态
                    await waitFor(() => {
                        expect(thead.querySelector('input[type="checkbox"]').checked).toBe(true);
                    });

                    // 取消勾选第一条数据
                    fireEvent.click(questionsTableContainer.querySelectorAll('tbody tr')[0].querySelector('input[type="checkbox"]'));

                    // 验证全选框是未选中状态
                    await waitFor(() => {
                        expect(thead.querySelector('input[type="checkbox"]').checked).toBe(false);
                    });

                });

                describe('分页器', () => {
                    it('正常情况', async () => {
                        const { container } = render(Manual);
    
                        // 等待页面渲染完成
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
                                        QuestionTags: ["单选题的标签"],
                                        QuestionTypes: ["00","02"],
                                        QuestionDifficulties: [2,3],
                                        CreateTime: 1722100200000,
                                        UpdateTime: 1722100200000,
                                        Type: "00",
                                        Status: "00",
                                    }
                                ]
                            })
                        });
    
                        // 点击从题库中导入按钮
                        fireEvent.click(screen.getByText('从题库中导入'));
    
                        // 验证标题
                        await waitFor(() => {
                            expect(screen.getByText('从题库中导入题目')).toBeInTheDocument();
                        });
    
                        // 获取body-left类
                        const bodyLeft = container.querySelector('.body-left');
    
                        // 获取question-bank-list类
                        const questionBankList = bodyLeft.querySelector('.question-bank-list');
    
                        // 验证有single-bank
                        await waitFor(() => {
                            expect(questionBankList.querySelectorAll('.single-bank').length).toBe(1);
                        });
    
                        // mock 题目列表
                        global.fetch.mockResolvedValueOnce({
                            ok: true,
                            json: () => Promise.resolve({
                                API: "/api/questions",
                                method: "GET",
                                status: 0,
                                msg: "success",
                                rowCount: 11,
                                // 共11条
                                data: [
                                    {
                                        ID: 101,
                                        Type: "00",
                                        Content: "<p><span style=\"font-size: 12pt\">我是一道单选题</span></p>",
                                        Score: 2,
                                        Difficulty: 3,
                                        Tags: ["单选题的标签"],
                                        BelongTo: 106,
                                        UpdateTime: 1755918425852
                                    },
                                    {
                                        ID: 102,
                                        Type: "00",
                                        Content: "<p><span style=\"font-size: 12pt\">我是一道单选题</span></p>",
                                        Score: 2,
                                        Difficulty: 3,
                                        Tags: ["单选题的标签"],
                                        BelongTo: 106,
                                        UpdateTime: 1755918425852
                                    },
                                    {
                                        ID: 103,
                                        Type: "00",
                                        Content: "<p><span style=\"font-size: 12pt\">我是一道单选题</span></p>",
                                        Score: 2,
                                        Difficulty: 3,
                                        Tags: ["单选题的标签"],
                                        BelongTo: 106,
                                        UpdateTime: 1755918425852
                                    },
                                    {
                                        ID: 104,
                                        Type: "00",
                                        Content: "<p><span style=\"font-size: 12pt\">我是一道单选题</span></p>",
                                        Score: 2,
                                        Difficulty: 3,
                                        Tags: ["单选题的标签"],
                                        BelongTo: 106,
                                        UpdateTime: 1755918425852
                                    },
                                    {
                                        ID: 105,
                                        Type: "00",
                                        Content: "<p><span style=\"font-size: 12pt\">我是一道单选题</span></p>",
                                        Score: 2,
                                        Difficulty: 3,
                                        Tags: ["单选题的标签"],
                                        BelongTo: 106,
                                        UpdateTime: 1755918425852
                                    },
                                    {
                                        ID: 106,
                                        Type: "00",
                                        Content: "<p><span style=\"font-size: 12pt\">我是一道单选题</span></p>",
                                        Score: 2,
                                        Difficulty: 3,
                                        Tags: ["单选题的标签"],
                                        BelongTo: 106,
                                        UpdateTime: 1755918425852
                                    },
                                    {
                                        ID: 107,
                                        Type: "00",
                                        Content: "<p><span style=\"font-size: 12pt\">我是一道单选题</span></p>",
                                        Score: 2,
                                        Difficulty: 3,
                                        Tags: ["单选题的标签"],
                                        BelongTo: 106,
                                        UpdateTime: 1755918425852
                                    },
                                    {
                                        ID: 108,
                                        Type: "00",
                                        Content: "<p><span style=\"font-size: 12pt\">我是一道单选题</span></p>",
                                        Score: 2,
                                        Difficulty: 3,
                                        Tags: ["单选题的标签"],
                                        BelongTo: 106,
                                        UpdateTime: 1755918425852
                                    },
                                    {
                                        ID: 109,
                                        Type: "00",
                                        Content: "<p><span style=\"font-size: 12pt\">我是一道单选题</span></p>",
                                        Score: 2,
                                        Difficulty: 3,
                                        Tags: ["单选题的标签"],
                                        BelongTo: 106,
                                        UpdateTime: 1755918425852
                                    },
                                    {
                                        ID: 110,
                                        Type: "00",
                                        Content: "<p><span style=\"font-size: 12pt\">我是一道单选题</span></p>",
                                        Score: 2,
                                        Difficulty: 3,
                                        Tags: ["单选题的标签"],
                                        BelongTo: 106,
                                        UpdateTime: 1755918425852
                                    },
                                    {
                                        ID: 111,
                                        Type: "00",
                                        Content: "<p><span style=\"font-size: 12pt\">我是一道单选题</span></p>",
                                        Score: 2,
                                        Difficulty: 3,
                                        Tags: ["单选题的标签"],
                                        BelongTo: 106,
                                        UpdateTime: 1755918425852
                                    },
                                ],
                            })
                        });
    
                        // 点击single-bank类（用类选择器）
                        fireEvent.click(questionBankList.querySelector('.single-bank'));
    
                        // 获取body-right类
                        const bodyRight = container.querySelector('.body-right');
                        
                        // 获取questions-table-container类
                        const questionsTableContainer = bodyRight.querySelector('.questions-table-container');
    
                        // 验证表格有11行
                        await waitFor(() => {
                            expect(questionsTableContainer.querySelectorAll('tbody tr').length).toBe(11);
                        });
    
                        // 获取page-control-container类
                        const pageControlContainer = bodyRight.querySelector('.page-control-container');
    
                        // 验证“共 11 条”
                        await waitFor(() => {
                            expect(screen.getByText('共 11 条')).toBeInTheDocument();
                        });
    
                        // 点击select__input类
                        fireEvent.click(pageControlContainer.querySelector('.select__input'));
    
                        // 验证下拉框的选项
                        await waitFor(() => {
                            expect(screen.getByText('5条/页')).toBeInTheDocument();
                            expect(screen.getByText('10条/页')).toBeInTheDocument();
                            expect(screen.getByText('20条/页')).toBeInTheDocument();
                        });
    
                        // 获取下拉栏
                        const select = pageControlContainer.querySelector('.select__options');
                        
                        // 验证有3个button  
                        await waitFor(() => {
                            expect(select.querySelectorAll('button').length).toBe(3);
                        });
                        
                        // mock 题目列表
                        global.fetch.mockResolvedValueOnce({
                            ok: true,
                            json: () => Promise.resolve({
                                API: "/api/questions",
                                method: "GET",
                                status: 0,
                                msg: "success",
                                rowCount: 0,
                                data: null,
                            })
                        });
    
                        // mock 题目列表
                        global.fetch.mockResolvedValueOnce({
                            ok: true,
                            json: () => Promise.resolve({
                                API: "/api/questions",
                                method: "GET",
                                status: 0,
                                msg: "success",
                                rowCount: 0,
                                data: null,
                            })
                        });
                        
                        // 点击第三个button
                        fireEvent.click(select.querySelectorAll('button')[2]);
    
                        // 验证表格为空
                        await waitFor(() => {
                            expect(questionsTableContainer.querySelectorAll('tbody tr').length).toBe(0);
                        });
                    });

                    it('失败情况', async () => {
                        const { container } = render(Manual);
    
                        // 等待页面渲染完成
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
                                        QuestionTags: ["单选题的标签"],
                                        QuestionTypes: ["00","02"],
                                        QuestionDifficulties: [2,3],
                                        CreateTime: 1722100200000,
                                        UpdateTime: 1722100200000,
                                        Type: "00",
                                        Status: "00",
                                    }
                                ]
                            })
                        });
    
                        // 点击从题库中导入按钮
                        fireEvent.click(screen.getByText('从题库中导入'));
    
                        // 验证标题
                        await waitFor(() => {
                            expect(screen.getByText('从题库中导入题目')).toBeInTheDocument();
                        });
    
                        // 获取body-left类
                        const bodyLeft = container.querySelector('.body-left');
    
                        // 获取question-bank-list类
                        const questionBankList = bodyLeft.querySelector('.question-bank-list');
    
                        // 验证有single-bank
                        await waitFor(() => {
                            expect(questionBankList.querySelectorAll('.single-bank').length).toBe(1);
                        });
    
                        // 获取body-right类
                        const bodyRight = container.querySelector('.body-right');
                        
                        // 获取questions-table-container类
                        const questionsTableContainer = bodyRight.querySelector('.questions-table-container');
    
                        // 验证表格为空
                        await waitFor(() => {
                            expect(questionsTableContainer.querySelectorAll('tbody tr').length).toBe(0);
                        });
    
                        // 获取page-control-container类
                        const pageControlContainer = bodyRight.querySelector('.page-control-container');
    
                        // 验证“共 0 条”
                        await waitFor(() => {
                            expect(screen.getByText('共 0 条')).toBeInTheDocument();
                        });
    
                        // 点击select__input类
                        fireEvent.click(pageControlContainer.querySelector('.select__input'));
    
                        // 验证下拉框的选项
                        await waitFor(() => {
                            expect(screen.getByText('5条/页')).toBeInTheDocument();
                            expect(screen.getByText('10条/页')).toBeInTheDocument();
                            expect(screen.getByText('20条/页')).toBeInTheDocument();
                        });
    
                        // 获取下拉栏
                        const select = pageControlContainer.querySelector('.select__options');
                        
                        // 验证有3个button  
                        await waitFor(() => {
                            expect(select.querySelectorAll('button').length).toBe(3);
                        });
                        
                        // mock 失败情况
                        global.fetch.mockResolvedValueOnce({
                            ok: false,
                            status: 400
                        });
    
                        // mock 失败情况
                        global.fetch.mockResolvedValueOnce({
                            ok: false,
                            status: 400
                        });
                        
                        // 点击第三个button
                        fireEvent.click(select.querySelectorAll('button')[2]);

                        // 验证表格为空
                        await waitFor(() => {
                            expect(questionsTableContainer.querySelectorAll('tbody tr').length).toBe(0);
                        });
                    });
                });

            });
        });
    });

    // describe('底部', () => {

    // });
});