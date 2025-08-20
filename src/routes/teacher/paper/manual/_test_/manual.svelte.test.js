/*
 * @Author: WangKaidun 1597225095@qq.com
 * @Date: 2025-08-18 20:02:57
 * @LastEditors: WangKaidun 1597225095@qq.com
 * @LastEditTime: 2025-08-20 12:14:08
 * @FilePath: \exam\src\routes\teacher\paper\manual\_test_\manual.svelte.test.js
 * @Description: 自定义组卷页面测试
 * Copyright (c) 2025 by WangKaidun 1597225095@qq.com, All Rights Reserved. 
 */

import { render, screen, fireEvent, waitFor, cleanup, container } from '@testing-library/svelte';
import { describe, it, expect, vi, afterEach, beforeEach } from 'vitest';

import { goto } from '$app/navigation';

import Manual from '../+page@.svelte';
import { FILL_BLANK_QUESTION, MULTIPLE_CHOICE_QUESTION, PAPER_INFO, SHORT_ANSWER_QUESTION, SINGLE_CHOICE_QUESTION, TRUE_FALSE_QUESTION } from './utils';
import { CURRENT_PAPER_ID, GROUP_OPEN_STATE, QUESTION_OPEN_STATE } from '../../_stores/store';
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

describe('自定义组卷页面', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        cleanup();

        global.fetch = vi.fn().mockResolvedValue({
            ok: true,
            json: () => Promise.resolve({
                API: "/api/paper/manual",
                data: PAPER_INFO,
                method: "GET",
                msg: "success",
                status: 0
            })
        });
    });

    afterEach(() => {
        vi.clearAllMocks();
        cleanup();
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

                // 等待页面渲染完成（有题组说明渲染完成）
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

            // 修改mock信息：题组里有全部题型
            const MOCK_PAPER_INFO = PAPER_INFO;
            MOCK_PAPER_INFO.GroupsData[0].questions = [
                SINGLE_CHOICE_QUESTION, // 单选题
                MULTIPLE_CHOICE_QUESTION, // 多选题
                TRUE_FALSE_QUESTION, // 判断题
                FILL_BLANK_QUESTION, // 填空题
                SHORT_ANSWER_QUESTION // 简答题
            ];

            MOCK_PAPER_INFO.GroupsData.push({
                id: 1197,
                name: "空白题组",
                order: 2,
                questions: []
            });

            // 临时mock试卷信息：题组里有全部题型
            global.fetch.mockResolvedValueOnce({
                ok: true,
                json: () => Promise.resolve({
                    API: "/api/paper/manual",
                    data: MOCK_PAPER_INFO,
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
                // 临时mock试卷信息：题组里有全部题型
                const MOCK_PAPER_INFO = PAPER_INFO;
                MOCK_PAPER_INFO.GroupsData[0].questions = [
                    SINGLE_CHOICE_QUESTION, // 单选题
                    MULTIPLE_CHOICE_QUESTION, // 多选题
                    TRUE_FALSE_QUESTION, // 判断题
                    FILL_BLANK_QUESTION, // 填空题
                    SHORT_ANSWER_QUESTION // 简答题
                ];

                MOCK_PAPER_INFO.GroupsData.push({
                    id: 1197,
                    name: "空白题组",
                    order: 2,
                    questions: []
                });

                // 临时mock试卷信息：题组里有全部题型
                global.fetch.mockResolvedValue({
                    ok: true,
                    json: () => Promise.resolve({
                        API: "/api/paper/manual",
                        data: MOCK_PAPER_INFO,
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
                    render(Manual);

                    // 等待页面渲染完成（有题组说明渲染完成）
                    await waitFor(() => {
                        // 泛型匹配（有两个）
                        expect(screen.getAllByText(/测试题组/)).toHaveLength(2);
                    });

                    // 修改mock信息：请求成功
                    global.fetch.mockResolvedValue({
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
                        expect(window.location.href).toBe("http://localhost:3000/");
                    });
                });

                it('正常情况2：练习', async () => {
                    // 临时mock试卷信息：题组里有全部题型
                    const MOCK_PAPER_INFO = PAPER_INFO;

                    MOCK_PAPER_INFO.Category = "02";

                    // 临时mock试卷信息
                    global.fetch.mockResolvedValue({
                        ok: true,
                        json: () => Promise.resolve({
                            API: "/api/paper/manual",
                            data: MOCK_PAPER_INFO,
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
                    global.fetch.mockResolvedValue({
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
                        expect(window.location.href).toBe("http://localhost:3000/");
                    });
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

                // 验证placeholder为“+标签”的input有四个
                expect(screen.getAllByPlaceholderText('+标签')).toHaveLength(4);

                // 验证标题“题组列表”
                expect(screen.getByText('题组列表')).toBeInTheDocument();

                // 验证group-count类的存在
                expect(container.querySelector('.group-count')).toBeInTheDocument();

                // 验证“添加题组”按钮
                expect(screen.getByText('添加题组')).toBeInTheDocument();
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

                        // 获取第一个标签，用placeholder为“+标签”的input
                        const input = screen.getAllByPlaceholderText('+标签')[0];

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

                        // 验证标签有5个（用placeholder为“+标签”的input有5个）
                        await waitFor(() => {
                            expect(screen.getAllByPlaceholderText('+标签')).toHaveLength(5);
                        });
                    });

                    it('取消创建标签', async () => {
                        const { container } = render(Manual);

                        // 等待页面渲染完成（有题组说明渲染完成）
                        await waitFor(() => {
                            // 泛型匹配（有两个）
                            expect(screen.getAllByText(/测试题组/)).toHaveLength(2);
                        });

                        // 获取第一个标签，用placeholder为“+标签”的input
                        const input = screen.getAllByPlaceholderText('+标签')[0];

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

                        // 获取第二个标签，用placeholder为“+标签”的input
                        const input = screen.getAllByPlaceholderText('+标签')[1];

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

                        // 验证标签有3个（用placeholder为“+标签”的input有3个）
                        await waitFor(() => {
                            expect(screen.getAllByPlaceholderText('+标签')).toHaveLength(3);
                        });
                    });

                    it('修改标签', async () => {
                        const { container } = render(Manual);

                        // 等待页面渲染完成（有题组说明渲染完成）
                        await waitFor(() => {
                            // 泛型匹配（有两个）
                            expect(screen.getAllByText(/测试题组/)).toHaveLength(2);
                        });

                        // 获取第二个标签，用placeholder为“+标签”的input
                        const input = screen.getAllByPlaceholderText('+标签')[1];

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
                        global.fetch.mockResolvedValue({
                            ok: true,
                            json: () => Promise.resolve({
                                status: 0,
                                msg: "success",
                                API: "/api/paper/manual",
                                method: "GET",
                                data: PAPER_INFO,
                            })
                        });

                        const { container } = render(Manual);

                        // 等待页面渲染完成（有题组说明渲染完成）
                        await waitFor(() => {
                            // 泛型匹配（有两个）
                            expect(screen.getAllByText(/测试题组/)).toHaveLength(2);
                        });

                        // 点击“删除”按钮（用class为delete-group-btn的button）
                        const deleteButton = container.querySelector('.delete-group-btn');
                        fireEvent.click(deleteButton);

                        // 验证最后一个题组不能被删除
                        await waitFor(() => {
                            expect(toast.error).toHaveBeenCalledWith('至少保留一个题组', 1000);
                        });
                    });
                });
            });
        });

        describe('内容区', () => {
            it('渲染', async () => {

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

                // 验证question-header类的存在
                expect(container.querySelector('.question-header')).toBeInTheDocument();

                // 验证content类的存在
                expect(container.querySelector('.content')).toBeInTheDocument();
            });
        });
    });
});