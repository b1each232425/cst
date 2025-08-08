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

// 模拟工具函数
vi.mock('$lib/utils', () => ({
    sget: (obj, path, def) => {
        const result = path.split('.').reduce((o, k) => (o || {})[k], obj);
        return result === undefined ? def : result;
    }
}));



// 模拟数据格式化工具
vi.mock('../../_utils/dataFormatter.js', () => ({
    formatPracticeData: vi.fn((data) => data || [])
}));

// 模拟全局fetch
const mockFetch = vi.fn();
global.fetch = mockFetch;

describe('练习成绩管理页面', () => {
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
        expect(screen.getByText('练习成绩管理')).toBeInTheDocument();

        // 验证筛选面板
        expect(screen.getByText('搜索练习')).toBeInTheDocument();
        expect(screen.getByText('当前已选中')).toBeInTheDocument();
        expect(screen.getByText('项')).toBeInTheDocument();
    });

    it('应该在初始化时获取练习数据', async () => {
        const mockPractices = [
            {
                id: 1,
                name: '数学练习1',
                total_score: 100,
                average_score: 85.5,
                completed_students: 30,
                passed_students: 25
            }
        ];

        mockFetch.mockResolvedValueOnce({
            ok: true,
            json: () => Promise.resolve({
                status: 0,
                data: mockPractices,
                rowCount: 1
            })
        });

        render(Page);

        await waitFor(() => {
            expect(mockFetch).toHaveBeenCalledWith(
                expect.stringContaining('/api/grade/list?category=practice'),
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

    it('应该正确渲染练习列表', async () => {
        const mockPractices = [
            {
                id: 1,
                name: '数学练习1',
                total_score: 100,
                average_score: 85.5,
                completed_students: 30,
                passed_students: 25
            },
            {
                id: 2,
                name: '英语练习1',
                total_score: 80,
                average_score: 75.2,
                completed_students: 28,
                passed_students: 22
            }
        ];

        mockFetch.mockResolvedValueOnce({
            ok: true,
            json: () => Promise.resolve({
                status: 0,
                data: mockPractices,
                rowCount: 2
            })
        });

        render(Page);

        await waitFor(() => {
            expect(screen.getByText('数学练习1')).toBeInTheDocument();
            expect(screen.getByText('英语练习1')).toBeInTheDocument();
            expect(screen.getByText('100')).toBeInTheDocument();
            expect(screen.getByText('85.5')).toBeInTheDocument();
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

    it('应该支持单项选择', async () => {
        const mockPractices = [
            {
                id: 1,
                name: '数学练习1',
                total_score: 100,
                average_score: 85.5,
                completed_students: 30,
                passed_students: 25
            }
        ];

        mockFetch.mockResolvedValueOnce({
            ok: true,
            json: () => Promise.resolve({
                status: 0,
                data: mockPractices,
                rowCount: 1
            })
        });

        render(Page);

        await waitFor(() => {
            const checkboxes = screen.getAllByRole('button');
            const practiceCheckbox = checkboxes.find(cb =>
                cb.closest('tr')?.textContent?.includes('数学练习1')
            );

            if (practiceCheckbox) {
                fireEvent.click(practiceCheckbox);
                expect(screen.getByText('1')).toBeInTheDocument(); // 选中计数
            }
        });
    });

    it('应该处理API错误', async () => {
        // 模拟 console.error 来验证错误处理
        const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

        mockFetch.mockRejectedValueOnce(new Error('网络错误'));

        render(Page);

        await waitFor(() => {
            expect(consoleSpy).toHaveBeenCalledWith(
                '获取练习成绩列表失败:',
                expect.any(Error)
            );
        });

        consoleSpy.mockRestore();
    });

    it('应该支持搜索功能', async () => {
        mockFetch
            .mockResolvedValueOnce({
                ok: true,
                json: () => Promise.resolve({ status: 0, data: [], rowCount: 0 })
            })
            .mockResolvedValueOnce({
                ok: true,
                json: () => Promise.resolve({ status: 0, data: [], rowCount: 0 })
            });

        render(Page);

        // 等待初始加载完成
        await waitFor(() => {
            expect(mockFetch).toHaveBeenCalledTimes(1);
        });

        // 模拟搜索输入
        const searchInput = screen.getByPlaceholderText('请输入练习名称');
        await fireEvent.input(searchInput, { target: { value: '数学' } });

        // 验证搜索请求（带防抖延迟）
        await waitFor(() => {
            expect(mockFetch).toHaveBeenCalledWith(
                expect.stringContaining('name=%E6%95%B0%E5%AD%A6'),
                expect.any(Object)
            );
        }, { timeout: 1000 });
    });
});
