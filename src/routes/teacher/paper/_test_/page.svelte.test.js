/*
 * @Author: WangKaidun 1597225095@qq.com
 * @Date: 2025-08-17 10:34:48
 * @LastEditors: WangKaidun 1597225095@qq.com
 * @LastEditTime: 2025-08-17 18:10:45
 * @FilePath: \exam\src\routes\teacher\paper\_test_\page.svelte.test.js
 * @Description: 试卷管理页面测试
 * Copyright (c) 2025 by WangKaidun 1597225095@qq.com, All Rights Reserved. 
 */

vi.mock('$app/navigation', () => ({
    goto: vi.fn()
}));

import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, waitFor, cleanup } from '@testing-library/svelte';

import { goto } from '$app/navigation';

import Page from '../+page.svelte';
import { PAPER_ONE, PAPER_TWO } from './utils';

describe('试卷管理页面测试', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        cleanup(); // 清理上一次渲染的 DOM
    
        global.fetch = vi.fn().mockResolvedValue({
            ok: true,
            json: () => Promise.resolve({
                API: "/api/paper",
                data: [PAPER_ONE, PAPER_TWO],
                method: "GET",
                msg: "success",
                rowCount: 2,
                status: 0
            })
        });
    });
    
    afterEach(() => {
        vi.clearAllMocks();
        cleanup();
    });

    describe('标题', () => {

        it('标题应该正确显示', async () => {

            render(Page);

            expect(screen.getByText('试卷管理')).toBeInTheDocument();
        });

    });

    describe('操作栏', () => {

        describe('左侧区域', () => {

            describe('输入框', () => {

                it('渲染', async () => {
                    const { container } = render(Page);

                    // 提示词
                    expect(container.querySelectorAll('.prompt').length).toBe(2);

                    // 输入框
                    expect(screen.getByPlaceholderText('搜索试卷名称')).toBeInTheDocument();
                    expect(screen.getByPlaceholderText('搜索试卷标签')).toBeInTheDocument();

                    // 初始状态下清除按钮应该被隐藏（有hide-clear类）
                    expect(container.querySelector('.clear-name-btn')).toHaveClass('hide-clear');
                    expect(container.querySelector('.clear-tags-btn')).toHaveClass('hide-clear');

                    // 输入内容后清除按钮应该显示（没有hide-clear类）
                    fireEvent.input(screen.getByPlaceholderText('搜索试卷名称'), { target: { value: '测试' } });
                    fireEvent.input(screen.getByPlaceholderText('搜索试卷标签'), { target: { value: '测试' } });

                    // 等待DOM更新
                    await waitFor(() => {
                        expect(container.querySelector('.clear-name-btn')).not.toHaveClass('hide-clear');
                        expect(container.querySelector('.clear-tags-btn')).not.toHaveClass('hide-clear');
                    });
                });

                // it('交互', async () => {

                //     const { container } = render(Page);

                //     // 输入试卷名称
                //     fireEvent.input(screen.getByPlaceholderText('搜索试卷名称'), { target: { value: '测试名称' } });
                // });
            });

        });

        describe('右侧区域', () => {

            describe('渲染', () => {

                it('渲染', async () => {

                    const { container } = render(Page);

                    // 验证三个按钮
                    expect(screen.getByText('重置')).toBeInTheDocument();
                    expect(screen.getByText('删除')).toBeInTheDocument();
                    expect(screen.getByText('自定义组卷')).toBeInTheDocument();

                });

            });

            describe('交互', () => {

                it('重置', async () => {

                    const { container } = render(Page);

                    // 验证被调用一次
                    expect(global.fetch).toHaveBeenCalledTimes(1);
                    
                    // 等待表格渲染两条数据
                    await waitFor(() => {
                        expect(container.querySelectorAll('tbody tr').length).toBe(2);
                    });

                    // 输入试卷名称
                    fireEvent.input(screen.getByPlaceholderText('搜索试卷名称'), { target: { value: '测试名称' } });

                    // 输入试卷标签
                    fireEvent.input(screen.getByPlaceholderText('搜索试卷标签'), { target: { value: '测试标签' } });

                    // 等待防抖延迟（真的等了600ms）
                    await new Promise(resolve => setTimeout(resolve, 600));

                    // 验证被调用两次
                    expect(global.fetch).toHaveBeenCalledTimes(3);

                    // 点击重置
                    fireEvent.click(screen.getByText('重置'));

                    // 等待DOM更新
                    await waitFor(() => {
                        expect(screen.getByPlaceholderText('搜索试卷名称')).toHaveValue('');
                        expect(screen.getByPlaceholderText('搜索试卷标签')).toHaveValue('');
                    });

                    // 等待防抖延迟（真的等了600ms）
                    await new Promise(resolve => setTimeout(resolve, 600));

                    // 验证被调用三次
                    expect(global.fetch).toHaveBeenCalledTimes(4);
                });

                describe('删除', () => {

                    it('正常情况', async () => {
                        const { container } = render(Page);

                        // 等待表格渲染两条数据
                        await waitFor(() => {
                            expect(container.querySelectorAll('tbody tr').length).toBe(2);
                        });
                        
                        // 选中第一条数据（checkbox）
                        const firstRow = container.querySelectorAll('tbody tr')[0];
                        fireEvent.click(firstRow.querySelector('input[type="checkbox"]'));

                        // 点击删除（通过class选择）
                        fireEvent.click(container.querySelector('.btn.btn--danger.is-plain'));
                        
                        // 验证弹窗内容
                        expect(screen.getByText('删除确认')).toBeInTheDocument();
                        expect(screen.getByText('请问是否要批量删除这 1 张试卷？')).toBeInTheDocument();

                        // 点击确认
                        fireEvent.click(screen.getByText('确定'));
                        
                        // 验证toast提示
                        await waitFor(() => {
                            expect(screen.getByText('删除成功')).toBeInTheDocument();
                        });
                    });

                    it('没有选中数据', async () => {
                        const { container } = render(Page);

                        // 点击删除（通过class选择）
                        fireEvent.click(container.querySelector('.btn.btn--danger.is-plain'));

                        // 验证toast提示
                        await waitFor(() => {
                            expect(screen.getByText('请先选择试卷')).toBeInTheDocument();
                        });
                    });

                    it('返回空列表', async () => {
                        const { container } = render(Page);

                        // 等待表格渲染两条数据
                        await waitFor(() => {
                            expect(container.querySelectorAll('tbody tr').length).toBe(2);
                        });

                        // 选中第一条和第二条数据（checkbox）
                        const firstRow = container.querySelectorAll('tbody tr')[0];
                        const secondRow = container.querySelectorAll('tbody tr')[1];
                        fireEvent.click(firstRow.querySelector('input[type="checkbox"]'));
                        fireEvent.click(secondRow.querySelector('input[type="checkbox"]'));

                        // 点击删除（通过class选择）
                        fireEvent.click(container.querySelector('.btn.btn--danger.is-plain'));

                        // 验证弹窗内容
                        expect(screen.getByText('删除确认')).toBeInTheDocument();
                        expect(screen.getByText('请问是否要批量删除这 2 张试卷？')).toBeInTheDocument();

                        // 点击确认
                        fireEvent.click(screen.getByText('确定'));
                        
                        // 验证toast提示
                        await waitFor(() => {
                            expect(screen.getByText('删除成功')).toBeInTheDocument();
                        });

                        global.fetch = vi.fn().mockResolvedValue({
                            ok: true,
                            json: () => Promise.resolve({
                                API: "/api/paper",
                                data: null,
                                method: "GET",
                                msg: "success",
                                rowCount: 0,
                                status: 0
                            })
                        });

                        // 等待表格渲染空列表
                        await waitFor(() => {
                            expect(container.querySelectorAll('tbody tr').length).toBe(0);
                        });
                    });

                    it('失败情况1：请求失败', async () => {
                        const { container } = render(Page);

                        // 等待表格渲染两条数据
                        await waitFor(() => {
                            expect(container.querySelectorAll('tbody tr').length).toBe(2);
                        });

                        global.fetch.mockResolvedValueOnce({
                            ok: false,
                            status: 400
                        });

                        // 选中第一条数据（checkbox）
                        const firstRow = container.querySelectorAll('tbody tr')[0];
                        fireEvent.click(firstRow.querySelector('input[type="checkbox"]'));

                        // 点击删除（通过class选择）
                        fireEvent.click(container.querySelector('.btn.btn--danger.is-plain'));

                        // 验证弹窗内容
                        expect(screen.getByText('删除确认')).toBeInTheDocument();
                        expect(screen.getByText('请问是否要批量删除这 1 张试卷？')).toBeInTheDocument();

                        // 点击确定
                        fireEvent.click(screen.getByText('确定'));

                        // 验证toast提示
                        await waitFor(() => {
                            expect(screen.getByText(`请求失败，状态码：400`)).toBeInTheDocument();
                        });
                    });

                    it('失败情况2：业务错误', async () => {
                        const { container } = render(Page);

                        // 等待表格渲染两条数据
                        await waitFor(() => {
                            expect(container.querySelectorAll('tbody tr').length).toBe(2);
                        });
                        
                        global.fetch.mockResolvedValueOnce({
                            ok: true,
                            json: () => Promise.resolve({
                                status: -1,
                                msg: "业务错误"
                            })
                        });

                        // 选中第一条数据（checkbox）
                        const firstRow = container.querySelectorAll('tbody tr')[1];
                        fireEvent.click(firstRow.querySelector('input[type="checkbox"]'));

                        // 点击删除（通过class选择）
                        fireEvent.click(container.querySelector('.btn.btn--danger.is-plain'));

                        // 验证弹窗内容
                        expect(screen.getByText('删除确认')).toBeInTheDocument();
                        expect(screen.getByText('请问是否要批量删除这 2 张试卷？')).toBeInTheDocument();
                        
                        // 点击确定
                        fireEvent.click(screen.getByText('确定'));
                        
                        // 验证toast提示
                        await waitFor(() => {
                            expect(screen.getByText(`业务错误`)).toBeInTheDocument();
                        });

                    });
                    
                });

                describe('自定义组卷', () => {

                    it('成功情况', async () => {;
                    
                        const { container } = render(Page);

                        global.fetch.mockResolvedValueOnce({
                            ok: true,
                            json: () => Promise.resolve({
                                status: 0,
                                rowCount: 1,
                                API: "/api/paper/manual",
                                method: "POST",
                                data: {
                                    paper: {
                                        ID: 142,
                                        Name: "新建试卷",
                                        AssemblyType: "00",
                                        Category: "00",
                                        Level: "00",
                                        SuggestedDuration: 120,
                                        Description: null,
                                        Tags: [],
                                        Creator: 1626,
                                        CreateTime: 1755418019695,
                                        UpdatedBy: 1626,
                                        UpdateTime: 1755418019695,
                                        Status: "00",
                                        DomainID: 1999
                                    },
                                    paper_groups: [
                                        {
                                            ID: 512,
                                            PaperID: 142,
                                            Name: "一、单选题",
                                            Order: 1,
                                            Creator: 1626,
                                            CreateTime: 1755418019695,
                                            UpdatedBy: 1626,
                                            UpdateTime: 1755418019695,
                                            Status: "00"
                                        },
                                        {
                                            ID: 513,
                                            PaperID: 142,
                                            Name: "二、多选题",
                                            Order: 2,
                                            Creator: 1626,
                                            CreateTime: 1755418019695,
                                            UpdatedBy: 1626,
                                            UpdateTime: 1755418019695,
                                            Status: "00"
                                        },
                                        {
                                            ID: 514,
                                            PaperID: 142,
                                            Name: "三、判断题",
                                            Order: 3,
                                            Creator: 1626,
                                            CreateTime: 1755418019695,
                                            UpdatedBy: 1626,
                                            UpdateTime: 1755418019695,
                                            Status: "00"
                                        },
                                        {
                                            ID: 515,
                                            PaperID: 142,
                                            Name: "四、填空题",
                                            Order: 4,
                                            Creator: 1626,
                                            CreateTime: 1755418019695,
                                            UpdatedBy: 1626,
                                            UpdateTime: 1755418019695,
                                            Status: "00"
                                        },
                                        {
                                            ID: 516,
                                            PaperID: 142,
                                            Name: "五、简答题",
                                            Order: 5,
                                            Creator: 1626,
                                            CreateTime: 1755418019695,
                                            UpdatedBy: 1626,
                                            UpdateTime: 1755418019695,
                                            Status: "00"
                                        }
                                ]
                                }
                            })
                        });
                        
                        // 点击自定义组卷（通过class选择，有两个按钮，点击第二个）
                        fireEvent.click(container.querySelectorAll('.btn.btn--primary.is-plain')[1]);

                        // 验证goto被调用
                        await waitFor(() => {
                            expect(goto).toHaveBeenCalledWith('/teacher/paper/manual');
                        });
                    });

                    it('失败情况1：请求失败', async () => {
                        const { container } = render(Page);
                        
                        global.fetch.mockResolvedValueOnce({
                            ok: false,
                            status: 400
                        });

                        // 点击自定义组卷（通过class选择，有两个按钮，点击第二个）
                        fireEvent.click(container.querySelectorAll('.btn.btn--primary.is-plain')[1]);

                        // 验证toast提示
                        await waitFor(() => {
                            expect(screen.getByText(`请求失败，状态码：400`)).toBeInTheDocument();
                        });
                    });

                    it('失败情况2：业务错误', async () => {
                        const { container } = render(Page);

                        global.fetch.mockResolvedValueOnce({
                            ok: true,
                            json: () => Promise.resolve({
                                status: -1,
                                msg: "业务错误"
                            })
                        });

                        // 点击自定义组卷（通过class选择，有两个按钮，点击第二个）
                        fireEvent.click(container.querySelectorAll('.btn.btn--primary.is-plain')[1]);

                        // 验证toast提示
                        await waitFor(() => {
                            expect(screen.getByText(`业务错误`)).toBeInTheDocument();
                        });
                    });
                });

            });

        });

    });

    // describe('表格测试', () => {

    // });

    // describe('翻页组件测试', () => {

    // });
});