import { render, screen, fireEvent, waitFor } from '@testing-library/svelte';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import Page from '../+page.svelte';

// 模拟全局组件
vi.mock('$lib/components/Title/Title.svelte', () => ({
    default: vi.fn(() => ({ $$: { fragment: null } }))
}));

vi.mock('$lib/components/Pagination/Pagination.svelte', () => ({
    default: vi.fn(() => ({ $$: { fragment: null } }))
}));

vi.mock('$lib/components/Input/InputBox.svelte', () => ({
    default: vi.fn(() => ({ $$: { fragment: null } }))
}));

vi.mock('$lib/components/Select/Select.svelte', () => ({
    default: vi.fn(() => ({ $$: { fragment: null } }))
}));

vi.mock('$lib/components/Select/Option.svelte', () => ({
    default: vi.fn(() => ({ $$: { fragment: null } }))
}));

// 模拟工具函数
vi.mock('$lib/utils', () => ({
    sget: (obj, path, def) => {
        const result = path.split('.').reduce((o, k) => (o || {})[k], obj);
        return result === undefined ? def : result;
    }
}));



// 模拟数据格式化工具
vi.mock('../../_utils/dataFormatter.js', () => ({
    formatExamData: vi.fn((data) => data || [])
}));

// 模拟全局fetch
const mockFetch = vi.fn();
global.fetch = mockFetch;

describe('考试成绩管理页面', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        mockFetch.mockClear();
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    it('应该正确渲染页面', async () => {
        // 模拟API响应
        mockFetch.mockResolvedValueOnce({
            ok: true,
            json: () => Promise.resolve({
                status: 0,
                data: [],
                rowCount: 0
            })
        });

        render(Page);

        // 验证页面标题
        expect(screen.getByText('考试成绩管理')).toBeInTheDocument();

        // 验证筛选面板
        expect(screen.getByText('考试类别')).toBeInTheDocument();
        expect(screen.getByText('搜索考试')).toBeInTheDocument();
        expect(screen.getByText('提交状态')).toBeInTheDocument();
        expect(screen.getByText('当前已选中')).toBeInTheDocument();
    });

    it('应该在初始化时获取考试数据', async () => {
        const mockExams = [
            {
                id: 1,
                name: '期中考试',
                type: '00',
                sessions: [
                    {
                        exam_session_id: 1,
                        paper_name: '数学试卷',
                        start_time: '2023-12-25T10:00:00.000Z',
                        end_time: '2023-12-25T12:00:00.000Z',
                        total_score: 100,
                        average_score: 85.5,
                        scheduled_examinees: 50,
                        actual_examinees: 48,
                        pass_examinees: 40
                    }
                ],
                submitted: false
            }
        ];

        mockFetch.mockResolvedValueOnce({
            ok: true,
            json: () => Promise.resolve({
                status: 0,
                data: mockExams,
                rowCount: 1
            })
        });

        render(Page);

        await waitFor(() => {
            expect(mockFetch).toHaveBeenCalledWith(
                expect.stringContaining('/api/grade/list?category=exam'),
                expect.objectContaining({
                    method: 'GET',
                    credentials: 'include'
                })
            );
        });
    });

    it('应该显示加载状态', async () => {
        // 模拟延迟的API响应
        mockFetch.mockImplementationOnce(() =>
            new Promise(resolve =>
                setTimeout(() => resolve({
                    ok: true,
                    json: () => Promise.resolve({ status: 0, data: [], rowCount: 0 })
                }), 100)
            )
        );

        render(Page);

        // 验证加载状态
        expect(screen.getByText('加载中...')).toBeInTheDocument();
    });

    it('应该正确渲染考试列表', async () => {
        const mockExams = [
            {
                id: 1,
                name: '期中考试',
                type: '00',
                sessions: [
                    {
                        exam_session_id: 1,
                        paper_name: '数学试卷',
                        start_time: '2023-12-25T10:00:00.000Z',
                        end_time: '2023-12-25T12:00:00.000Z',
                        total_score: 100,
                        average_score: 85.5,
                        scheduled_examinees: 50,
                        actual_examinees: 48,
                        pass_examinees: 40
                    }
                ],
                submitted: false
            }
        ];

        mockFetch.mockResolvedValueOnce({
            ok: true,
            json: () => Promise.resolve({
                status: 0,
                data: mockExams,
                rowCount: 1
            })
        });

        render(Page);

        await waitFor(() => {
            expect(screen.getByText('期中考试')).toBeInTheDocument();
            expect(screen.getByText('平时考试')).toBeInTheDocument(); // type '00' 显示为平时考试
            expect(screen.getByText('数学试卷')).toBeInTheDocument();
            expect(screen.getByText('未提交')).toBeInTheDocument();
        });
    });

    it('应该显示空数据状态', async () => {
        mockFetch.mockResolvedValueOnce({
            ok: true,
            json: () => Promise.resolve({
                status: 0,
                data: [],
                rowCount: 0
            })
        });

        render(Page);

        await waitFor(() => {
            expect(screen.getByText('暂无数据')).toBeInTheDocument();
        });
    });

    it('应该处理批量提交功能', async () => {
        const mockExams = [
            { id: 1, name: '考试1', type: '00', sessions: [], submitted: false }
        ];

        mockFetch
            .mockResolvedValueOnce({
                ok: true,
                json: () => Promise.resolve({
                    status: 0,
                    data: mockExams,
                    rowCount: 1
                })
            })
            .mockResolvedValueOnce({
                ok: true,
                json: () => Promise.resolve({ status: 0, msg: '提交成功' })
            })
            .mockResolvedValueOnce({
                ok: true,
                json: () => Promise.resolve({
                    status: 0,
                    data: mockExams,
                    rowCount: 1
                })
            });

        render(Page);

        await waitFor(() => {
            // 选择一个考试
            const checkbox = screen.getAllByRole('button')[1]; // 跳过全选按钮
            fireEvent.click(checkbox);
        });

        // 点击批量提交按钮
        const submitButton = screen.getByText('批量提交');
        fireEvent.click(submitButton);

        await waitFor(() => {
            expect(mockFetch).toHaveBeenCalledWith(
                '/api/grade/submission',
                expect.objectContaining({
                    method: 'PATCH',
                    body: JSON.stringify({
                        data: {
                            exam_ids: [1]
                        }
                    })
                })
            );
        });
    });

    it('应该处理API错误', async () => {
        // 模拟 console.error 来验证错误处理
        const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

        mockFetch.mockRejectedValueOnce(new Error('网络错误'));

        render(Page);

        await waitFor(() => {
            expect(consoleSpy).toHaveBeenCalledWith(
                '获取考试成绩列表失败:',
                expect.any(Error)
            );
        });

        consoleSpy.mockRestore();
    });
});
