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

vi.mock('$app/navigation', () => ({
  goto: vi.fn(),
}));

vi.mock('$app/stores', () => ({
  // 如果你用了 page 或 navigating 等 store，也需要 mock
  page: {
    subscribe: vi.fn(),
  },
  navigating: {
    subscribe: vi.fn(),
  },
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
    handleFeatureNotImplemented: vi.fn()
}));

// 模拟数据格式化工具
vi.mock('../../_utils/dataFormatter.js', () => ({
    formatExamData: vi.fn((data) => data || [])
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

    it('应该支持全选功能', async () => {
        const mockExams = [
            { id: 1, name: '考试1', type: '00', sessions: [], submitted: false },
            { id: 2, name: '考试2', type: '02', sessions: [], submitted: true }
        ];

        mockFetch.mockResolvedValueOnce({
            ok: true,
            json: () => Promise.resolve({
                status: 0,
                data: mockExams,
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
        const mockExams = [
            { id: 1, name: '考试1', type: '00', sessions: [], submitted: false }
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
            const selectAllCheckbox = screen.getAllByRole('button')[0];
            // 先全选
            fireEvent.click(selectAllCheckbox);
            expect(screen.getByText('1')).toBeInTheDocument();

            // 再取消全选
            fireEvent.click(selectAllCheckbox);
            expect(screen.getByText('0')).toBeInTheDocument();
        });
    });

    it('应该支持单项提交功能', async () => {
        const mockExams = [
            {
                id: 1,
                name: '考试1',
                type: '00',
                sessions: [],
                submitted: false
            }
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
            const submitButton = screen.getByText('提交');
            fireEvent.click(submitButton);
        });

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

    it('应该正确计算考试统计数据', async () => {
        const mockExams = [
            {
                id: 1,
                name: '期中考试',
                type: '00',
                sessions: [
                    {
                        exam_session_id: 1,
                        total_score: 100,
                        average_score: 85.5,
                        scheduled_examinees: 50,
                        actual_examinees: 48,
                        pass_examinees: 40
                    },
                    {
                        exam_session_id: 2,
                        total_score: 80,
                        average_score: 75.2,
                        scheduled_examinees: 30,
                        actual_examinees: 28,
                        pass_examinees: 22
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
            // 验证总分计算 (100 + 80 = 180)
            expect(screen.getByText('180')).toBeInTheDocument();

            // 验证平均分计算 ((85.5 + 75.2) / 2 = 80.4)
            expect(screen.getByText('80.4')).toBeInTheDocument();

            // 验证应考人数 (50 + 30 = 80)
            expect(screen.getByText('80')).toBeInTheDocument();

            // 验证实考人数 (48 + 28 = 76)
            expect(screen.getByText('76')).toBeInTheDocument();

            // 验证通过人数 (40 + 22 = 62)
            expect(screen.getByText('62')).toBeInTheDocument();
        });
    });

    it('应该处理筛选功能', async () => {
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
        const searchInput = screen.getByPlaceholderText('请输入考试名称');
        await fireEvent.input(searchInput, { target: { value: '期中' } });

        // 验证搜索请求（带防抖延迟）
        await waitFor(() => {
            expect(mockFetch).toHaveBeenCalledWith(
                expect.stringContaining('name=%E6%9C%9F%E4%B8%AD'),
                expect.any(Object)
            );
        }, { timeout: 1000 });
    });

    it('应该处理考试类型筛选', async () => {
        mockFetch
            .mockResolvedValueOnce({
                ok: true,
                json: () => Promise.resolve({ status: 0, data: [], rowCount: 0 })
            })
            .mockResolvedValueOnce({
                ok: true,
                json: () => Promise.resolve({ status: 0, data: [], rowCount: 0 })
            });

        const { component } = render(Page);

        // 等待初始加载
        await waitFor(() => {
            expect(mockFetch).toHaveBeenCalledTimes(1);
        });

        // 模拟类型筛选变化
        component.$set({ examType: '00' });

        await waitFor(() => {
            expect(mockFetch).toHaveBeenCalledWith(
                expect.stringContaining('type=00'),
                expect.any(Object)
            );
        });
    });

    it('应该处理提交状态筛选', async () => {
        mockFetch
            .mockResolvedValueOnce({
                ok: true,
                json: () => Promise.resolve({ status: 0, data: [], rowCount: 0 })
            })
            .mockResolvedValueOnce({
                ok: true,
                json: () => Promise.resolve({ status: 0, data: [], rowCount: 0 })
            });

        const { component } = render(Page);

        // 等待初始加载
        await waitFor(() => {
            expect(mockFetch).toHaveBeenCalledTimes(1);
        });

        // 模拟提交状态筛选变化
        component.$set({ submittedStatus: 1 });

        await waitFor(() => {
            expect(mockFetch).toHaveBeenCalledWith(
                expect.stringContaining('submitted=1'),
                expect.any(Object)
            );
        });
    });

    it('应该处理分页功能', async () => {
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

        // 模拟分页变化
        component.$set({ currentPage: 2 });

        await waitFor(() => {
            expect(mockFetch).toHaveBeenCalledWith(
                expect.stringContaining('page=2'),
                expect.any(Object)
            );
        });
    });

    it('应该处理页面大小变化', async () => {
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

    it('应该处理详情查看功能', async () => {
        const { handleFeatureNotImplemented } = await import('../../_utils/errorHandler.js');

        mockFetch.mockResolvedValueOnce({
            ok: true,
            json: () => Promise.resolve({
                status: 0,
                data: [{ id: 1, name: '考试1', sessions: [] }],
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

    it('应该处理导出功能', async () => {
        const { handleFeatureNotImplemented } = await import('../../_utils/errorHandler.js');

        mockFetch.mockResolvedValueOnce({
            ok: true,
            json: () => Promise.resolve({
                status: 0,
                data: [{ id: 1, name: '考试1', sessions: [] }],
                rowCount: 1
            })
        });

        render(Page);

        await waitFor(() => {
            // 选择一个考试
            const checkbox = screen.getAllByRole('button')[1];
            fireEvent.click(checkbox);
        });

        // 点击导出按钮（如果可见）
        const exportButton = screen.queryByText('批量导出');
        if (exportButton) {
            fireEvent.click(exportButton);
            expect(handleFeatureNotImplemented).toHaveBeenCalledWith('批量导出');
        }
    });

    it('应该处理选择状态的边界情况', async () => {
        const mockExams = [
            { id: 1, name: '考试1', type: '00', sessions: [], submitted: false }
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
            const examCheckbox = screen.getAllByRole('button')[1]; // 考试复选框
            const selectAllCheckbox = screen.getAllByRole('button')[0]; // 全选复选框

            // 选择单个考试，应该自动勾选全选
            fireEvent.click(examCheckbox);
            expect(screen.getByText('1')).toBeInTheDocument();

            // 取消选择，全选应该取消
            fireEvent.click(examCheckbox);
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
        const searchInput = screen.getByPlaceholderText('请输入考试名称');
        fireEvent.input(searchInput, { target: { value: '期' } });
        fireEvent.input(searchInput, { target: { value: '期中' } });

        // 快进时间触发防抖
        vi.advanceTimersByTime(500);

        await waitFor(() => {
            // 应该只触发一次搜索请求
            expect(mockFetch).toHaveBeenCalledTimes(2);
        });

        vi.useRealTimers();
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
                '获取考试成绩列表'
            );
        });
    });

    it('应该处理提交成绩的错误', async () => {
        const { handleApiError } = await import('../../_utils/errorHandler.js');

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
            .mockRejectedValueOnce(new Error('提交失败'));

        render(Page);

        await waitFor(() => {
            const submitButton = screen.getByText('提交');
            fireEvent.click(submitButton);
        });

        await waitFor(() => {
            expect(handleApiError).toHaveBeenCalledWith(
                expect.any(Error),
                '提交成绩'
            );
        });
    });

    it('应该正确处理数据格式化', async () => {
        const { formatExamData } = await import('../../_utils/dataFormatter.js');

        const mockExams = [
            { id: 1, name: '考试1', sessions: [] }
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
            expect(formatExamData).toHaveBeenCalledWith(mockExams);
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
                expect.stringContaining('category=exam'),
                expect.objectContaining({
                    method: 'GET',
                    credentials: 'include'
                })
            );
        });
    });

    it('应该处理已提交考试的显示', async () => {
        const mockExams = [
            {
                id: 1,
                name: '已提交考试',
                type: '00',
                sessions: [],
                submitted: true
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
            expect(screen.getByText('已提交')).toBeInTheDocument();
            // 已提交的考试不应该显示提交按钮
            expect(screen.queryByText('提交')).not.toBeInTheDocument();
        });
    });

    it('应该处理考试类型显示', async () => {
        const mockExams = [
            {
                id: 1,
                name: '平时考试',
                type: '00',
                sessions: [],
                submitted: false
            },
            {
                id: 2,
                name: '资格证考试',
                type: '02',
                sessions: [],
                submitted: false
            }
        ];

        mockFetch.mockResolvedValueOnce({
            ok: true,
            json: () => Promise.resolve({
                status: 0,
                data: mockExams,
                rowCount: 2
            })
        });

        render(Page);

        await waitFor(() => {
            expect(screen.getByText('平时考试')).toBeInTheDocument();
            expect(screen.getByText('资格证考试')).toBeInTheDocument();
        });
    });

    it('应该处理时间显示格式', async () => {
        const mockExams = [
            {
                id: 1,
                name: '考试1',
                type: '00',
                sessions: [
                    {
                        exam_session_id: 1,
                        paper_name: '试卷1',
                        start_time: '2023-12-25T10:00:00.000Z',
                        end_time: '2023-12-25T12:00:00.000Z',
                        total_score: 100,
                        average_score: 85,
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
            // 验证时间格式显示（具体格式取决于本地化设置）
            const timeElements = screen.getAllByText(/\d{4}\/\d{1,2}\/\d{1,2}|\d{1,2}\/\d{1,2}\/\d{4}/);
            expect(timeElements.length).toBeGreaterThan(0);
        });
    });

    it('应该处理无效数据的显示', async () => {
        const mockExams = [
            {
                id: 1,
                name: '考试1',
                type: '00',
                sessions: [
                    {
                        exam_session_id: 1,
                        paper_name: '试卷1',
                        start_time: '-',
                        end_time: '-',
                        total_score: null,
                        average_score: null,
                        scheduled_examinees: null,
                        actual_examinees: null,
                        pass_examinees: null
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
            // 验证无效数据显示为 '-'
            const dashElements = screen.getAllByText('-');
            expect(dashElements.length).toBeGreaterThan(0);
        });
    });
});
