/*
 * @Author: WangKaidun 1597225095@qq.com
 * @Date: 2025-08-18 20:02:57
 * @LastEditors: WangKaidun 1597225095@qq.com
 * @LastEditTime: 2025-08-19 16:23:39
 * @FilePath: \exam\src\routes\teacher\paper\manual\_test_\manual.svelte.test.js
 * @Description: 自定义组卷页面测试
 * Copyright (c) 2025 by WangKaidun 1597225095@qq.com, All Rights Reserved. 
 */

import { render, screen, fireEvent, waitFor, cleanup } from '@testing-library/svelte';
import { describe, it, expect, vi, afterEach, beforeEach } from 'vitest';

import { goto } from '$app/navigation';

import Manual from '../+page@.svelte';
import { FILL_BLANK_QUESTION, MULTIPLE_CHOICE_QUESTION, PAPER_INFO, SHORT_ANSWER_QUESTION, SINGLE_CHOICE_QUESTION, TRUE_FALSE_QUESTION } from './utils';
import { CURRENT_PAPER_ID } from '../../_stores/store';
import { toast } from "$lib/components/Toast/Toast";

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
                global.fetch = vi.fn().mockResolvedValueOnce({
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
                global.fetch = vi.fn().mockResolvedValueOnce({
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
            global.fetch = vi.fn().mockResolvedValue({
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
});