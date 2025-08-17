/*
 * @Author: WangKaidun 1597225095@qq.com
 * @Date: 2025-08-17 10:34:48
 * @LastEditors: WangKaidun 1597225095@qq.com
 * @LastEditTime: 2025-08-17 21:46:16
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
import { PAPER_ONE, PAPER_TWO, PAPER_THREE } from './utils';

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

            });

        });

        describe('右侧区域', () => {
                
            it('渲染', async () => {

                const { container } = render(Page);

                // 验证三个按钮
                expect(screen.getByText('重置')).toBeInTheDocument();
                expect(screen.getByText('删除')).toBeInTheDocument();
                expect(screen.getByText('自定义组卷')).toBeInTheDocument();

            });

            describe('交互', () => {

                describe('重置', () => {

                    it('正常数据', async () => {

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

                    it('返回空列表', async () => {

                        const { container } = render(Page);

                        // 等待表格渲染两条数据
                        await waitFor(() => {
                            expect(container.querySelectorAll('tbody tr').length).toBe(2);
                        });

                        // 临时mock数据
                        global.fetch.mockResolvedValueOnce({
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

                        // 点击重置
                        fireEvent.click(screen.getByText('重置'));

                        // 等待表格渲染空列表
                        await waitFor(() => {
                            expect(container.querySelectorAll('tbody tr').length).toBe(0);
                        });
                    });

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

    describe('表格测试', () => {

        it('渲染', async () => {

            // 临时mock数据
            global.fetch.mockResolvedValueOnce({
                ok: true,
                json: () => Promise.resolve({
                    API: "/api/paper",
                    data: [PAPER_ONE, PAPER_TWO, PAPER_THREE],
                    method: "GET",
                    msg: "success",
                    rowCount: 3,
                    status: 0
                })
            });
            
            const { container } = render(Page);
          
            // 等待表格渲染三条数据
            await waitFor(() => {
                expect(container.querySelectorAll('tbody tr').length).toBe(3);
            });

            // 验证表头
            expect(container.querySelector('thead tr th:nth-child(1) input[type="checkbox"]')).toBeInTheDocument();
            expect(container.querySelector('thead tr th:nth-child(2)')).toHaveTextContent('试卷名称');
            expect(container.querySelector('thead tr th:nth-child(3)')).toHaveTextContent('组卷方式');
            expect(container.querySelector('thead tr th:nth-child(4)')).toHaveTextContent('试卷用途');
            expect(container.querySelector('thead tr th:nth-child(5)')).toHaveTextContent('试题数量');
            expect(container.querySelector('thead tr th:nth-child(6)')).toHaveTextContent('试卷总分');
            expect(container.querySelector('thead tr th:nth-child(7)')).toHaveTextContent('建议时长(分)');
            expect(container.querySelector('thead tr th:nth-child(8)')).toHaveTextContent('试卷标签');
            expect(container.querySelector('thead tr th:nth-child(9)')).toHaveTextContent('试卷难度');
            expect(container.querySelector('thead tr th:nth-child(10)')).toHaveTextContent('更新时间');
            expect(container.querySelector('thead tr th:nth-child(11)')).toHaveTextContent('创建日期');
            expect(container.querySelector('thead tr th:nth-child(12)')).toHaveTextContent('操作');

            // 验证第一条数据
            const firstRow = container.querySelectorAll('tbody tr')[0];
            expect(firstRow.querySelector('td:nth-child(1) input[type="checkbox"]')).toBeInTheDocument();
            expect(firstRow.querySelector('td:nth-child(2)')).toHaveTextContent('测试试卷1');
            expect(firstRow.querySelector('td:nth-child(3)')).toHaveTextContent('自定义组卷');
            expect(firstRow.querySelector('td:nth-child(4)')).toHaveTextContent('考试');
            expect(firstRow.querySelector('td:nth-child(5)')).toHaveTextContent('10');
            expect(firstRow.querySelector('td:nth-child(6)')).toHaveTextContent('36');
            expect(firstRow.querySelector('td:nth-child(7)')).toHaveTextContent('110');
            expect(firstRow.querySelector('td:nth-child(8)')).toHaveTextContent('标签1');
            expect(firstRow.querySelector('td:nth-child(8)')).toHaveTextContent('标签2');
            expect(firstRow.querySelector('td:nth-child(9)')).toHaveTextContent('简单');
            expect(firstRow.querySelector('td:nth-child(10)')).toHaveTextContent('2025-08-17 10:40');
            expect(firstRow.querySelector('td:nth-child(11)')).toHaveTextContent('2025-08-15');
            expect(firstRow.querySelector('td:nth-child(12)')).toHaveTextContent('修改');
            expect(firstRow.querySelector('td:nth-child(12)')).toHaveTextContent('预览');
            expect(firstRow.querySelector('td:nth-child(12)')).toHaveTextContent('删除');

            // 验证第二条数据
            const secondRow = container.querySelectorAll('tbody tr')[1];
            expect(secondRow.querySelector('td:nth-child(1) input[type="checkbox"]')).toBeInTheDocument();
            expect(secondRow.querySelector('td:nth-child(2)')).toHaveTextContent('测试试卷2');
            expect(secondRow.querySelector('td:nth-child(3)')).toHaveTextContent('随机组卷');
            expect(secondRow.querySelector('td:nth-child(4)')).toHaveTextContent('练习');
            expect(secondRow.querySelector('td:nth-child(5)')).toHaveTextContent('2');
            expect(secondRow.querySelector('td:nth-child(6)')).toHaveTextContent('10');
            expect(secondRow.querySelector('td:nth-child(7)')).toHaveTextContent('60');
            expect(secondRow.querySelector('td:nth-child(8)')).toHaveTextContent('-');
            expect(secondRow.querySelector('td:nth-child(9)')).toHaveTextContent('中等');
            expect(secondRow.querySelector('td:nth-child(10)')).toHaveTextContent('2025-08-17 10:39');
            expect(secondRow.querySelector('td:nth-child(11)')).toHaveTextContent('2025-08-17');
            expect(secondRow.querySelector('td:nth-child(12)')).toHaveTextContent('修改');
            expect(secondRow.querySelector('td:nth-child(12)')).toHaveTextContent('预览');
            expect(secondRow.querySelector('td:nth-child(12)')).toHaveTextContent('删除'); 

            // 验证第三条数据
            const thirdRow = container.querySelectorAll('tbody tr')[2];
            expect(thirdRow.querySelector('td:nth-child(1) input[type="checkbox"]')).toBeInTheDocument();
            expect(thirdRow.querySelector('td:nth-child(2)')).toHaveTextContent('测试试卷3');
            expect(thirdRow.querySelector('td:nth-child(3)')).toHaveTextContent('智能刷题');
            expect(thirdRow.querySelector('td:nth-child(4)')).toHaveTextContent('考试');
            expect(thirdRow.querySelector('td:nth-child(5)')).toHaveTextContent('5');
            expect(thirdRow.querySelector('td:nth-child(6)')).toHaveTextContent('20');
            expect(thirdRow.querySelector('td:nth-child(7)')).toHaveTextContent('120');
            expect(thirdRow.querySelector('td:nth-child(8)')).toHaveTextContent('-');
            expect(thirdRow.querySelector('td:nth-child(9)')).toHaveTextContent('困难');
            expect(thirdRow.querySelector('td:nth-child(10)')).toHaveTextContent('2025-08-17 10:39');
            expect(thirdRow.querySelector('td:nth-child(11)')).toHaveTextContent('2025-08-17');
            expect(thirdRow.querySelector('td:nth-child(12)')).toHaveTextContent('修改');
            expect(thirdRow.querySelector('td:nth-child(12)')).toHaveTextContent('预览');
            expect(thirdRow.querySelector('td:nth-child(12)')).toHaveTextContent('删除');
        });

        describe('交互', () => {

            it('全选', async () => {

                // 临时mock数据
                global.fetch.mockResolvedValueOnce({
                    ok: true,
                    json: () => Promise.resolve({
                        API: "/api/paper",
                        data: [PAPER_ONE, PAPER_TWO, PAPER_THREE],
                        method: "GET",
                        msg: "success",
                        rowCount: 3,
                        status: 0
                    })
                });

                const { container } = render(Page);

                // 等待表格渲染三条数据
                await waitFor(() => {
                    expect(container.querySelectorAll('tbody tr').length).toBe(3);
                });

                // 检查全选框是否选中
                expect(container.querySelector('thead tr th:nth-child(1) input[type="checkbox"]').checked).toBe(true);

                // 取消全选
                fireEvent.click(container.querySelector('thead tr th:nth-child(1) input[type="checkbox"]'));

                // 检查全选框是否未选中
                expect(container.querySelector('thead tr th:nth-child(1) input[type="checkbox"]').checked).toBe(false);

                // 三条数据应该都是未选中状态
                await waitFor(() => {
                expect(container.querySelectorAll('tbody tr')[0].querySelector('input[type="checkbox"]').checked).toBe(false);
                    expect(container.querySelectorAll('tbody tr')[1].querySelector('input[type="checkbox"]').checked).toBe(false);
                    expect(container.querySelectorAll('tbody tr')[2].querySelector('input[type="checkbox"]').checked).toBe(false);
                });

                // 选中第一条和第二条数据
                const firstRow = container.querySelectorAll('tbody tr')[0];
                fireEvent.click(firstRow.querySelector('input[type="checkbox"]'));
                const secondRow = container.querySelectorAll('tbody tr')[1];
                fireEvent.click(secondRow.querySelector('input[type="checkbox"]'));

                // 全选框应该是未选中状态
                await waitFor(() => {
                    expect(container.querySelector('thead tr th:nth-child(1) input[type="checkbox"]').checked).toBe(false);
                });

                // 选中第三条数据
                const thirdRow = container.querySelectorAll('tbody tr')[2];
                fireEvent.click(thirdRow.querySelector('input[type="checkbox"]'));

                // 全选框应该是选中状态
                await waitFor(() => {
                    expect(container.querySelector('thead tr th:nth-child(1) input[type="checkbox"]').checked).toBe(true);
                });

                // 取消选中第三条数据
                fireEvent.click(thirdRow.querySelector('input[type="checkbox"]'));

                // 全选框应该是未选中状态
                await waitFor(() => {
                    expect(container.querySelector('thead tr th:nth-child(1) input[type="checkbox"]').checked).toBe(false);
                });

                // 选中全选框
                fireEvent.click(container.querySelector('thead tr th:nth-child(1) input[type="checkbox"]'));

                // 三条数据应该都是选中状态
                await waitFor(() => {
                    expect(container.querySelectorAll('tbody tr')[0].querySelector('input[type="checkbox"]').checked).toBe(true);
                    expect(container.querySelectorAll('tbody tr')[1].querySelector('input[type="checkbox"]').checked).toBe(true);
                    expect(container.querySelectorAll('tbody tr')[2].querySelector('input[type="checkbox"]').checked).toBe(true);
                });

                // 取消全选
                fireEvent.click(container.querySelector('thead tr th:nth-child(1) input[type="checkbox"]'));

                // 三条数据应该都是未选中状态
                await waitFor(() => {
                    expect(container.querySelectorAll('tbody tr')[0].querySelector('input[type="checkbox"]').checked).toBe(false);
                    expect(container.querySelectorAll('tbody tr')[1].querySelector('input[type="checkbox"]').checked).toBe(false);
                    expect(container.querySelectorAll('tbody tr')[2].querySelector('input[type="checkbox"]').checked).toBe(false);
                });
            });

            it('修改', async () => {

                const { container } = render(Page);

                // 等待表格渲染两条数据
                await waitFor(() => {
                    expect(container.querySelectorAll('tbody tr').length).toBe(2);
                });

                // 点击第一条数据的修改按钮
                const firstRow = container.querySelectorAll('tbody tr')[0];
                fireEvent.click(firstRow.querySelector('td:nth-child(12) button:nth-child(1)'));

                // 验证goto被调用
                await waitFor(() => {
                    expect(goto).toHaveBeenCalledWith('/teacher/paper/manual');
                });
            });

            it('删除', async () => {

                const { container } = render(Page);

                // 等待表格渲染两条数据
                await waitFor(() => {
                    expect(container.querySelectorAll('tbody tr').length).toBe(2);
                });

                // 点击第一条数据的删除按钮
                const firstRow = container.querySelectorAll('tbody tr')[0];
                fireEvent.click(firstRow.querySelector('td:nth-child(12) button:nth-child(3)'));

                // 验证弹窗
                expect(screen.getByText('删除确认')).toBeInTheDocument();
                expect(screen.getByText('请问是否要删除该试卷？')).toBeInTheDocument();

                // 点击确认
                fireEvent.click(screen.getByText('确定'));

                // mock 返回结果
                global.fetch.mockResolvedValueOnce({
                    ok: true,
                    json: () => Promise.resolve({
                        status: 0,
                        msg: "success",
                        API: "/api/paper",
                        method: "DELETE"
                    })
                });

                // 验证toast提示（用queryAllByText）
                await waitFor(() => {
                    expect(screen.queryAllByText(`删除成功`).length).toBe(2);
                });

            });

            describe('预览', () => {

                it('正常情况', async () => {

                    const { container } = render(Page);

                    // 等待表格渲染两条数据
                    await waitFor(() => {
                        expect(container.querySelectorAll('tbody tr').length).toBe(2);
                    });

                    // 临时mock数据
                    global.fetch.mockResolvedValueOnce({
                        ok: true,
                        json: () => Promise.resolve({
                            status: 0,
                            msg: "success",
                            API: "/api/paper/manual",
                            method: "GET",
                            data: {
                                Paper: {
                                    ID: 143,
                                    DomainID: null,
                                    Name: "新建试卷",
                                    AssemblyType: "00",
                                    Category: "00",
                                    Level: "00",
                                    SuggestedDuration: 120,
                                    Description: null,
                                    Tags: [],
                                    Creator: 1626,
                                    CreateTime: 1755419884114,
                                    UpdatedBy: null,
                                    UpdateTime: 1755419884114,
                                    Status: "00",
                                    TotalScore: 0,
                                    QuestionCount: 0,
                                    GroupCount: 5
                                },
                                QuestionGroupInfo: {
                                    517: {
                                        ID: 517,
                                        PaperID: null,
                                        Name: "一、单选题",
                                        Order: 1,
                                        Creator: 1626,
                                        CreateTime: null,
                                        UpdatedBy: null,
                                        UpdateTime: null,
                                        Addi: null,
                                        Status: "00"
                                    },
                                    518: {
                                        ID: 518,
                                        PaperID: null,
                                        Name: "二、多选题",
                                        Order: 2,
                                        Creator: 1626,
                                        CreateTime: null,
                                        UpdatedBy: null,
                                        UpdateTime: null,
                                        Addi: null,
                                        Status: "00"
                                    },
                                    519: {
                                        ID: 519,
                                        PaperID: null,
                                        Name: "三、判断题",
                                        Order: 3,
                                        Creator: 1626,
                                        CreateTime: null,
                                        UpdatedBy: null,
                                        UpdateTime: null,
                                        Addi: null,
                                        Status: "00"
                                    },
                                    520: {
                                        ID: 520,
                                        PaperID: null,
                                        Name: "四、填空题",
                                        Order: 4,
                                        Creator: 1626,
                                        CreateTime: null,
                                        UpdatedBy: null,
                                        UpdateTime: null,
                                        Addi: null,
                                        Status: "00"
                                    },
                                    521: {
                                        ID: 521,
                                        PaperID: null,
                                        Name: "五、简答题",
                                        Order: 5,
                                        Creator: 1626,
                                        CreateTime: null,
                                        UpdatedBy: null,
                                        UpdateTime: null,
                                        Addi: null,
                                        Status: "00"
                                    }
                                },
                                Questions: {
                                    517: [],
                                    518: [],
                                    519: [],
                                    520: [],
                                    521: []
                                }
                            }
                        })
                    });

                    // 点击第一条数据的预览按钮
                    const firstRow = container.querySelectorAll('tbody tr')[0];
                    fireEvent.click(firstRow.querySelector('td:nth-child(12) button:nth-child(2)'));

                    // 验证window.location.href被调用
                    await waitFor(() => {
                        expect(window.location.href).toBe('http://localhost:3000/');
                    });

                    // 点击第二条数据的预览按钮
                    const secondRow = container.querySelectorAll('tbody tr')[1];
                    fireEvent.click(secondRow.querySelector('td:nth-child(12) button:nth-child(2)'));

                    // 验证window.location.href被调用
                    await waitFor(() => {
                        expect(window.location.href).toBe('http://localhost:3000/');
                    });
                });

                it('失败情况1：请求失败', async () => {
                    const { container } = render(Page);

                    // 等待表格渲染两条数据
                    await waitFor(() => {
                        expect(container.querySelectorAll('tbody tr').length).toBe(2);
                    });

                    // 临时mock数据
                    global.fetch.mockResolvedValueOnce({
                        ok: false,
                        status: 400
                    });

                    // 点击第一条数据的预览按钮
                    const firstRow = container.querySelectorAll('tbody tr')[0];
                    fireEvent.click(firstRow.querySelector('td:nth-child(12) button:nth-child(2)'));

                    // 验证toast提示
                    await waitFor(() => {
                        expect(screen.queryAllByText(`请求失败，状态码：400`).length).toBe(2);
                    });
                });

                it('失败情况2：业务错误', async () => {
                    const { container } = render(Page);

                    // 等待表格渲染两条数据
                    await waitFor(() => {
                        expect(container.querySelectorAll('tbody tr').length).toBe(2);
                    });

                    // 临时mock数据
                    global.fetch.mockResolvedValueOnce({
                        ok: true,
                        json: () => Promise.resolve({
                            status: -1,
                            msg: "业务错误"
                        })
                    });

                    // 点击第一条数据的预览按钮
                    const firstRow = container.querySelectorAll('tbody tr')[0];
                    fireEvent.click(firstRow.querySelector('td:nth-child(12) button:nth-child(2)'));

                    // 验证toast提示
                    await waitFor(() => {
                        expect(screen.queryAllByText(`业务错误`).length).toBe(2);
                    });
                });
            });

        });
    });

    describe('翻页组件测试', () => {

        describe('每页条数', () => {

            it('正常情况', async () => {
                const { container } = render(Page);

                // 等待表格渲染两条数据
                await waitFor(() => {
                    expect(container.querySelectorAll('tbody tr').length).toBe(2);
                });

                // 验证“共2条”
                expect(screen.getByText('共 2 条')).toBeInTheDocument();

                // 验证“每页10条”
                expect(screen.getByText('10条/页')).toBeInTheDocument();

                // 验证“前往”
                expect(screen.getByText('前往')).toBeInTheDocument();

                // 验证输入框（值默认为1，用类选择器）
                expect(container.querySelector('.el-input__inner'));

                // 点击“10条/页”按钮，出现下拉框
                fireEvent.click(screen.getByText('10条/页'));

                // 验证下拉框的选项
                await waitFor(() => {
                    expect(screen.getByText('10条/页')).toBeInTheDocument();
                    expect(screen.getByText('20条/页')).toBeInTheDocument();
                });

                // 点击“20条/页”按钮，下拉框消失
                fireEvent.click(screen.getByText('20条/页'));

                // 验证现在下拉框按钮内容为“20条/页”
                expect(screen.getByText('20条/页')).toBeInTheDocument();

            });

            it('空列表', async () => {

                // 临时mock数据
                global.fetch.mockResolvedValueOnce({
                    ok: true,
                    json: () => Promise.resolve({
                        status: 0,
                        msg: "success",
                        API: "/api/paper",
                        method: "GET",
                        data: null,
                        rowCount: 0,
                        pageCount: 0
                    })
                });

                const { container } = render(Page);

                // 等待表格渲染空列表
                await waitFor(() => {
                    expect(container.querySelectorAll('tbody tr').length).toBe(0);
                });

                // 验证“共0条”
                expect(screen.getByText('共 0 条')).toBeInTheDocument();

                // 临时mock数据
                global.fetch.mockResolvedValueOnce({
                    ok: true,
                    json: () => Promise.resolve({
                        status: 0,
                        msg: "success",
                        API: "/api/paper",
                        method: "GET",
                        data: null,
                        rowCount: 0,
                        pageCount: 0
                    })
                });

                // 点击“10条/页”按钮，出现下拉框
                fireEvent.click(screen.getByText('10条/页'));

                // 验证下拉框的选项
                await waitFor(() => {
                    expect(screen.getByText('10条/页')).toBeInTheDocument();
                });

                // 点击“20条/页”按钮，下拉框消失
                fireEvent.click(screen.getByText('20条/页'));

                // 验证现在下拉框按钮内容为“20条/页”
                await waitFor(() => {
                    expect(screen.getByText('20条/页')).toBeInTheDocument();
                });

                // 验证空列表
                await waitFor(() => {
                    expect(container.querySelectorAll('tbody tr').length).toBe(0);
                });
            });

        });

        it('页面跳转', async () => {

            // 临时mock数据
            global.fetch.mockResolvedValueOnce({
                ok: true,
                json: () => Promise.resolve({
                    status: 0,
                    msg: "success",
                    API: "/api/paper",
                    method: "GET",
                    data: [PAPER_ONE, PAPER_ONE,PAPER_ONE,PAPER_ONE,PAPER_ONE,
                        PAPER_ONE,PAPER_ONE,PAPER_ONE,PAPER_ONE,PAPER_ONE,PAPER_ONE 
                    ],// 共11条
                    rowCount: 11,
                    pageCount: 2
                })
            });

            const { container } = render(Page);

            // 等待表格渲染11条数据
            await waitFor(() => {
                expect(container.querySelectorAll('tbody tr').length).toBe(11);
            });

            // 验证“共11条”
            expect(screen.getByText('共 11 条')).toBeInTheDocument();
        });

    });

    describe('onMount生命周期', () => {

        it('空列表', async () => {
            // 临时mock数据
            global.fetch.mockResolvedValueOnce({
                ok: true,
                json: () => Promise.resolve({
                    status: 0,
                    msg: "success",
                    API: "/api/paper",
                    method: "GET",
                    data: null,
                    rowCount: 0,
                    pageCount: 0
                })
            });

            const { container } = render(Page);

            // 等待表格渲染空列表
            await waitFor(() => {
                expect(container.querySelectorAll('tbody tr').length).toBe(0);
            });

        });

        it('失败情况1：请求失败', async () => {

            // 临时mock数据
            global.fetch.mockResolvedValueOnce({
                ok: false,
                status: 400
            });

            const { container } = render(Page);

            // 验证toast提示
            await waitFor(() => {
                expect(screen.queryAllByText(`请求失败，状态码：400`).length).toBe(4);
            });

            // 验证表格渲染空列表
            await waitFor(() => {
                expect(container.querySelectorAll('tbody tr').length).toBe(0);
            });
        });

        it('失败情况2：业务错误', async () => {

            // 临时mock数据
            global.fetch.mockResolvedValueOnce({
                ok: true,
                json: () => Promise.resolve({
                    status: -1,
                    msg: "业务错误"
                })
            });

            const { container } = render(Page);

            // 验证toast提示
            await waitFor(() => {
                expect(screen.queryAllByText(`业务错误`).length).toBe(4);
            });
        });
    });
});