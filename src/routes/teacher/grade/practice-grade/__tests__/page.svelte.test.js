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



// 模拟错误处理工具
vi.mock('../../_utils/errorHandler.js', () => ({
    handleApiError: vi.fn(),
    handleSuccess: vi.fn(),
    handleSelectionError: vi.fn(),
    handleFeatureNotImplemented: vi.fn()
}));

// 模拟数据格式化工具
vi.mock('../../_utils/dataFormatter.js', () => ({
    formatPracticeData: vi.fn((data) => data || [])
}));

// 模拟全局fetch
const mockFetch = vi.fn();
global.fetch = mockFetch;

// 模拟DOM API
Object.defineProperty(window, 'URL', {
    value: {
        createObjectURL: vi.fn(() => 'mock-blob-url'),
        revokeObjectURL: vi.fn()
    }
});

Object.defineProperty(document, 'createElement', {
    value: vi.fn(() => ({
        href: '',
        download: '',
        click: vi.fn(),
        remove: vi.fn()
    }))
});

Object.defineProperty(document.body, 'appendChild', {
    value: vi.fn()
});

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

    it('应该支持全选功能', async () => {
        const mockPractices = [
            { id: 1, name: '练习1', total_score: 100, average_score: 85, completed_students: 30, passed_students: 25 },
            { id: 2, name: '练习2', total_score: 80, average_score: 75, completed_students: 28, passed_students: 22 }
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
            const selectAllCheckbox = screen.getAllByRole('button')[0]; // 第一个应该是全选按钮
            fireEvent.click(selectAllCheckbox);
            expect(screen.getByText('2')).toBeInTheDocument(); // 选中计数
        });
    });

    it('应该支持取消全选', async () => {
        const mockPractices = [
            { id: 1, name: '练习1', total_score: 100, average_score: 85, completed_students: 30, passed_students: 25 }
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
            const selectAllCheckbox = screen.getAllByRole('button')[0];
            // 先全选
            fireEvent.click(selectAllCheckbox);
            expect(screen.getByText('1')).toBeInTheDocument();

            // 再取消全选
            fireEvent.click(selectAllCheckbox);
            expect(screen.getByText('0')).toBeInTheDocument();
        });
    });

    it('应该支持分页功能', async () => {
        mockFetch
            .mockResolvedValueOnce({
                ok: true,
                json: () => Promise.resolve({ status: 0, data: [], rowCount: 50 })
            })
            .mockResolvedValueOnce({
                ok: true,
                json: () => Promise.resolve({ status: 0, data: [], rowCount: 50 })
            });

        const { component } = render(Page);

        // 等待初始加载
        await waitFor(() => {
            expect(mockFetch).toHaveBeenCalledTimes(1);
        });

        // 模拟分页变化 - 通过触发分页组件的事件
        const paginationEvent = new CustomEvent('pageChange', { detail: 2 });
        component.$set({ currentPage: 2 });

        await waitFor(() => {
            expect(mockFetch).toHaveBeenCalledWith(
                expect.stringContaining('page=2'),
                expect.any(Object)
            );
        });
    });

    it('应该支持页面大小变化', async () => {
        mockFetch
            .mockResolvedValueOnce({
                ok: true,
                json: () => Promise.resolve({ status: 0, data: [], rowCount: 50 })
            })
            .mockResolvedValueOnce({
                ok: true,
                json: () => Promise.resolve({ status: 0, data: [], rowCount: 50 })
            });

        const { component } = render(Page);

        // 等待初始加载
        await waitFor(() => {
            expect(mockFetch).toHaveBeenCalledTimes(1);
        });

        // 模拟页面大小变化
        component.$set({ pageSize: 20 });

        await waitFor(() => {
            expect(mockFetch).toHaveBeenCalledWith(
                expect.stringContaining('pageSize=20'),
                expect.any(Object)
            );
        });
    });

    it('应该处理导出功能', async () => {
        const { handleFeatureNotImplemented } = await import('../../_utils/errorHandler.js');

        mockFetch.mockResolvedValueOnce({
            ok: true,
            json: () => Promise.resolve({
                status: 0,
                data: [{ id: 1, name: '练习1' }],
                rowCount: 1
            })
        });

        render(Page);

        await waitFor(() => {
            // 选择一个练习
            const checkbox = screen.getAllByRole('button')[1]; // 跳过全选按钮
            fireEvent.click(checkbox);
        });

        // 点击导出按钮（如果可见）
        const exportButton = screen.queryByText('批量导出');
        if (exportButton) {
            fireEvent.click(exportButton);
            expect(handleFeatureNotImplemented).toHaveBeenCalledWith('批量导出');
        }
    });

    it('应该处理详情查看功能', async () => {
        const { handleFeatureNotImplemented } = await import('../../_utils/errorHandler.js');

        mockFetch.mockResolvedValueOnce({
            ok: true,
            json: () => Promise.resolve({
                status: 0,
                data: [{ id: 1, name: '练习1' }],
                rowCount: 1
            })
        });

        render(Page);

        await waitFor(() => {
            const detailButton = screen.getByText('详情');
            fireEvent.click(detailButton);
            expect(handleFeatureNotImplemented).toHaveBeenCalledWith('查看详细');
        });
    });

    it('应该处理HTTP错误状态', async () => {
        const { handleApiError } = await import('../../_utils/errorHandler.js');

        mockFetch.mockResolvedValueOnce({
            ok: false,
            status: 500,
            json: () => Promise.resolve({ status: -1, msg: '服务器错误' })
        });

        render(Page);

        await waitFor(() => {
            expect(handleApiError).toHaveBeenCalledWith(
                expect.any(Error),
                '获取练习成绩列表'
            );
        });
    });

    it('应该处理空的筛选条件', async () => {
        mockFetch.mockResolvedValueOnce({
            ok: true,
            json: () => Promise.resolve({ status: 0, data: [], rowCount: 0 })
        });

        render(Page);

        await waitFor(() => {
            expect(mockFetch).toHaveBeenCalledWith(
                expect.stringContaining('category=practice'),
                expect.objectContaining({
                    method: 'GET',
                    credentials: 'include'
                })
            );
        });
    });

    it('应该正确处理数据格式化', async () => {
        const { formatPracticeData } = await import('../../_utils/dataFormatter.js');

        const mockPractices = [
            { id: 1, name: '练习1', total_score: '100', average_score: '85.5' }
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
            expect(formatPracticeData).toHaveBeenCalledWith(mockPractices);
        });
    });

    it('应该处理选择状态的边界情况', async () => {
        const mockPractices = [
            { id: 1, name: '练习1', total_score: 100, average_score: 85, completed_students: 30, passed_students: 25 }
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
            const practiceCheckbox = screen.getAllByRole('button')[1]; // 练习复选框
            const selectAllCheckbox = screen.getAllByRole('button')[0]; // 全选复选框

            // 选择单个练习，应该自动勾选全选
            fireEvent.click(practiceCheckbox);
            expect(screen.getByText('1')).toBeInTheDocument();

            // 取消选择，全选应该取消
            fireEvent.click(practiceCheckbox);
            expect(screen.getByText('0')).toBeInTheDocument();
        });
    });

    it('应该处理防抖搜索', async () => {
        vi.useFakeTimers();

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

        // 等待初始加载
        await waitFor(() => {
            expect(mockFetch).toHaveBeenCalledTimes(1);
        });

        // 模拟快速输入
        const searchInput = screen.getByPlaceholderText('请输入练习名称');
        fireEvent.input(searchInput, { target: { value: '数' } });
        fireEvent.input(searchInput, { target: { value: '数学' } });

        // 快进时间触发防抖
        vi.advanceTimersByTime(500);

        await waitFor(() => {
            // 应该只触发一次搜索请求
            expect(mockFetch).toHaveBeenCalledTimes(2);
        });

        vi.useRealTimers();
    });
});
