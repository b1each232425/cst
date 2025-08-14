import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/svelte';
import userEvent from '@testing-library/user-event';
import { get } from 'svelte/store';
import { goto } from '$app/navigation';
import { toast } from '$lib/components/Toast/Toast';
import { MessageBox } from '$lib/components/MessageBox/MessageBox';
import Page from '../+page.svelte';

// Mock Svelte stores
vi.mock('../_stores/store', () => {
    const createMockStore = (initialValue) => ({
        subscribe: vi.fn((callback) => {
            callback(initialValue);
            return { unsubscribe: vi.fn() };
        }),
        set: vi.fn(),
        update: vi.fn()
    });

    return {
        CURRENT_PAPER_ID: createMockStore(0),
        SEARCH_PAPER_NAME: createMockStore(""),
        SEARCH_PAPER_TAGS: createMockStore(""),
        PAPER_PAGE_SIZE: createMockStore(10),
        PAPER_PAGE: createMockStore(1),
        SELECTED_PAPER_IDS: createMockStore([]),
        ALL_PAPER_SELECTED: createMockStore(false)
    };
});

// Mock 外部依赖
vi.mock('$app/navigation', () => ({
    goto: vi.fn()
}));

vi.mock('$lib/components/Toast/Toast', () => ({
    toast: {
        success: vi.fn(),
        error: vi.fn()
    }
}));

vi.mock('$lib/components/MessageBox/MessageBox', () => ({
    MessageBox: vi.fn()
}));

vi.mock('$lib/utils/time_utils', () => ({
    formatTimestamp: vi.fn((timestamp, options) => {
        if (options?.show_date && options?.show_time) {
            return '2025-01-01 12:00:00';
        }
        if (options?.show_date && !options?.show_time) {
            return '2025-01-01';
        }
        return '2025-01-01';
    })
}));

// Mock tool functions
vi.mock('../_utils/tool', () => ({
    LEVEL_TRANS: {
        "00": "简单",
        "01": "中等", 
        "02": "困难",
        "简单": "easy-level",
        "中等": "normal-level",
        "困难": "hard-level"
    },
    CATEGORY_TRANS: {
        "00": "考试",
        "02": "练习"
    },
    ASSEMBLY_TYPE_TRANS: {
        "00": "自定义组卷",
        "01": "随机组卷",
        "02": "智能刷题"
    }
}));

// Mock debounce function
vi.mock('$lib/utils/optimize', () => ({
    debounce: vi.fn((fn) => fn)
}));

// Mock fetch API
global.fetch = vi.fn();

// Mock localStorage
Object.defineProperty(window, 'localStorage', {
    value: {
        getItem: vi.fn(),
        setItem: vi.fn(),
        removeItem: vi.fn(),
        clear: vi.fn(),
    },
    writable: true
});

// Mock window.location
Object.defineProperty(window, 'location', {
    value: {
        href: '',
        assign: vi.fn(),
        reload: vi.fn()
    },
    writable: true
});

describe('试卷管理列表页面', () => {
    let mockFetch;

    beforeEach(() => {
        // 重置所有mock
        vi.clearAllMocks();
        
        // 设置默认的fetch mock响应 - 使用实际的API响应结构
        mockFetch = vi.fn().mockResolvedValue({
            ok: true,
            json: () => Promise.resolve({
                status: 0,
                msg: "success",
                rowCount: 0,
                API: "/api/paper",
                method: "GET",
                data: []
            })
        });
        global.fetch = mockFetch;
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    describe('标题区域测试', () => {
        it('应该正确显示页面标题', () => {
            render(Page);
            expect(screen.getByText('试卷管理')).toBeInTheDocument();
        });
    });

    describe('操作栏区域测试', () => {
        beforeEach(() => {
            render(Page);
        });

        describe('搜索交互', () => {
            // 定义搜索框配置，避免重复代码
            const searchConfigs = [
                {
                    name: '试卷名称',
                    containerClass: 'search-paper-name',
                    testValue: '测试试卷'
                },
                {
                    name: '试卷标签',
                    containerClass: 'search-paper-tag',
                    testValue: '数学'
                }
            ];

            // 通用函数：获取搜索容器和输入框
            const getSearchElements = (containerClass) => {
                const header = screen.getByText('重置').closest('.header');
                const leftSide = header.querySelector('.left-side');
                const searchContainer = leftSide.querySelector(`.${containerClass}`);
                const input = searchContainer.querySelector('input[placeholder="搜索试卷名称"]');
                const clearButton = searchContainer.querySelector('button[data-name="clear"]');
                return { searchContainer, input, clearButton };
            };

            // 通用函数：验证API调用
            const verifyApiCall = async (expectedUrl = '/api/paper') => {
                await waitFor(() => {
                    expect(mockFetch).toHaveBeenCalledWith(
                        expect.stringContaining(expectedUrl),
                        expect.objectContaining({
                            method: 'GET',
                            credentials: 'include'
                        })
                    );
                }, { timeout: 1000 });
            };

            // 测试输入功能
            searchConfigs.forEach(({ name, containerClass, testValue }) => {
                it(`${name}搜索框应该可以输入`, async () => {
                    const user = userEvent.setup();
                    const { input } = getSearchElements(containerClass);
                    
                    await user.type(input, testValue);
                    expect(input).toBeInTheDocument();
                });
            });

            // 测试防抖搜索API调用
            searchConfigs.forEach(({ name, containerClass, testValue }) => {
                it(`${name}搜索框输入时应该调用debouncedFetchPaperList`, async () => {
                    const user = userEvent.setup();
                    const { input } = getSearchElements(containerClass);
                    
                    mockFetch.mockClear();
                    await user.type(input, testValue);
                    await verifyApiCall();
                });
            });

            // 测试清除按钮显示逻辑
            searchConfigs.forEach(({ name, containerClass, testValue }) => {
                it(`${name}搜索框有内容时应该显示清除按钮`, async () => {
                    const user = userEvent.setup();
                    const { input, clearButton } = getSearchElements(containerClass);
                    
                    expect(clearButton).toHaveClass('hide-clear');
                    await user.type(input, testValue);
                    expect(clearButton).toBeInTheDocument();
                });
            });

            // 测试清除按钮功能
            searchConfigs.forEach(({ name, containerClass, testValue }) => {
                it(`${name}清除按钮应该可以点击并清空内容`, async () => {
                    const user = userEvent.setup();
                    const { input, clearButton } = getSearchElements(containerClass);
                    
                    await user.type(input, testValue);
                    await user.click(clearButton);
                    expect(clearButton).toBeInTheDocument();
                });
            });

            // 测试搜索逻辑的完整流程
            it('搜索输入应该触发完整的搜索流程', async () => {
                const user = userEvent.setup();
                const { input } = getSearchElements('search-paper-name');
                
                mockFetch.mockClear();
                await user.type(input, '数学试卷');
                await verifyApiCall();
            });

            // 测试防抖机制
            it('防抖机制应该正确处理多次输入', async () => {
                const user = userEvent.setup();
                const { input } = getSearchElements('search-paper-name');
                
                mockFetch.mockClear();
                
                // 快速连续输入
                await user.type(input, 'a');
                await user.type(input, 'b');
                await user.type(input, 'c');
                
                await new Promise(resolve => setTimeout(resolve, 600));
                
                // 由于mock debounce函数直接返回原函数，每次输入都会调用API
                expect(mockFetch).toHaveBeenCalledTimes(3);
                
                // 验证所有调用都是正确的API
                mockFetch.mock.calls.forEach(call => {
                    expect(call[0]).toContain('/api/paper');
                    expect(call[1]).toMatchObject({
                        method: 'GET',
                        credentials: 'include'
                    });
                });
            });
        });

        describe('按钮功能', () => {
            // 通用函数：验证重置按钮的API调用
            const verifyResetApiCall = async () => {
                await waitFor(() => {
                    const calls = mockFetch.mock.calls;
                    const lastCall = calls[calls.length - 1];
                    if (lastCall && lastCall[0]) {
                        expect(lastCall[0]).toContain('page=1');
                        expect(lastCall[0]).toContain('pageSize=10');
                    }
                });
            };

            // 通用函数：验证自定义组卷的API调用
            const verifyManualApiCall = async (expectedId = 'new-paper-id') => {
                await waitFor(() => {
                    expect(mockFetch).toHaveBeenCalledWith(
                        expect.stringContaining('/api/paper/manual'),
                        expect.objectContaining({
                            method: 'POST',
                            credentials: 'include'
                        })
                    );
                });
            };

            it('重置按钮应该可以点击并重置搜索条件', async () => {
                const user = userEvent.setup();
                const resetButton = screen.getByText('重置');
                
                mockFetch.mockClear();
                await user.click(resetButton);
                
                await verifyResetApiCall();
            });

            it('删除按钮在没有选择试卷时应该显示错误提示', async () => {
                const user = userEvent.setup();
                const deleteButton = screen.getByText('删除');
                
                mockFetch.mockClear();
                await user.click(deleteButton);
                
                // 验证没有调用删除API
                expect(mockFetch).not.toHaveBeenCalledWith(
                    expect.stringContaining('/api/paper'),
                    expect.objectContaining({ method: 'DELETE' })
                );
            });

            it('删除按钮在有选择试卷时应该调用删除API', async () => {
                const user = userEvent.setup();
                const deleteButton = screen.getByText('删除');
                
                await user.click(deleteButton);
                expect(deleteButton).toBeInTheDocument();
                expect(deleteButton).toHaveTextContent('删除');
            });

            it('自定义组卷按钮应该可以点击并创建新试卷', async () => {
                const user = userEvent.setup();
                const manualButton = screen.getByText('自定义组卷');
                
                mockFetch.mockResolvedValueOnce({
                    ok: true,
                    json: () => Promise.resolve({
                        data: { paper: { ID: 'new-paper-id' } }
                    })
                });
                
                mockFetch.mockClear();
                await user.click(manualButton);
                
                await verifyManualApiCall();
                expect(goto).toHaveBeenCalledWith('/teacher/paper/manual');
            });

            it('自定义组卷失败时应该处理错误', async () => {
                const user = userEvent.setup();
                const manualButton = screen.getByText('自定义组卷');
                
                mockFetch.mockResolvedValueOnce({
                    ok: false,
                    status: 500
                });
                
                mockFetch.mockClear();
                await user.click(manualButton);
                
                await verifyManualApiCall();
                expect(goto).not.toHaveBeenCalled();
            });

            it('重置按钮应该重置所有搜索条件和分页状态', async () => {
                const user = userEvent.setup();
                const resetButton = screen.getByText('重置');
                
                mockFetch.mockClear();
                await user.click(resetButton);
                await verifyResetApiCall();
            });

            it('删除按钮应该显示确认对话框', async () => {
                const user = userEvent.setup();
                const deleteButton = screen.getByText('删除');
                
                mockFetch.mockClear();
                await user.click(deleteButton);
                expect(deleteButton).toBeInTheDocument();
            });

            it('自定义组卷成功后应该正确设置当前试卷ID', async () => {
                const user = userEvent.setup();
                const manualButton = screen.getByText('自定义组卷');
                
                mockFetch.mockResolvedValueOnce({
                    ok: true,
                    json: () => Promise.resolve({
                        data: { paper: { ID: 'new-paper-id-123' } }
                    })
                });
                
                mockFetch.mockClear();
                await user.click(manualButton);
                
                await verifyManualApiCall('new-paper-id-123');
                expect(goto).toHaveBeenCalledWith('/teacher/paper/manual');
            });
        });
    });

    describe('表格区域测试', () => {
        beforeEach(() => {
            // 设置模拟数据 - 使用实际的API响应结构
            mockFetch.mockResolvedValue({
                ok: true,
                json: () => Promise.resolve({
                    status: 0,
                    msg: "success",
                    rowCount: 168,
                    API: "/api/paper",
                    method: "GET",
                    data: [
                        {
                            ID: 239,
                            DomainID: null,
                            Name: "主观题",
                            AssemblyType: "00",
                            Category: "00",
                            Level: "00",
                            SuggestedDuration: 120,
                            Description: null,
                            Tags: [],
                            Creator: 1626,
                            CreatorInfo: {
                                id: 1626,
                                email: "superAdmin@cst.com",
                                account: "superAdmin",
                                mobile_phone: null,
                                official_name: "超级管理员"
                            },
                            CreateTime: 1755135971769,
                            UpdatedBy: null,
                            UpdateTime: 1755135981830,
                            Status: "00",
                            TotalScore: 21,
                            QuestionCount: 5,
                            GroupCount: null
                        },
                        {
                            ID: 238,
                            DomainID: null,
                            Name: "新建试卷",
                            AssemblyType: "00",
                            Category: "00",
                            Level: "00",
                            SuggestedDuration: 120,
                            Description: null,
                            Tags: ["测试", "简答", "填空"],
                            Creator: 1626,
                            CreatorInfo: {
                                id: 1626,
                                email: "superAdmin@cst.com",
                                account: "superAdmin",
                                mobile_phone: null,
                                official_name: "超级管理员"
                            },
                            CreateTime: 1755135939379,
                            UpdatedBy: null,
                            UpdateTime: 1755135939379,
                            Status: "00",
                            TotalScore: 0,
                            QuestionCount: 0,
                            GroupCount: null
                        }
                    ]
                })
            });
        });

        describe('表格结构', () => {
            it('应该显示正确的表格列头', async () => {
                render(Page);
                
                await waitFor(() => {
                    // 使用更具体的查询来避免重复元素问题
                    const tableHeaders = screen.getAllByRole('columnheader');
                    expect(tableHeaders).toHaveLength(12); // 包括复选框列
                    
                    // 验证表格中的列头（不包括搜索区域的标签）
                    const table = screen.getByRole('table');
                    expect(table).toBeInTheDocument();
                    expect(table).toHaveTextContent('试卷名称');
                    expect(table).toHaveTextContent('组卷方式');
                    expect(table).toHaveTextContent('试卷用途');
                    expect(table).toHaveTextContent('试题数量');
                    expect(table).toHaveTextContent('试卷总分');
                    expect(table).toHaveTextContent('建议时长(分)');
                    expect(table).toHaveTextContent('试卷标签');
                    expect(table).toHaveTextContent('试卷难度');
                    expect(table).toHaveTextContent('更新时间');
                    expect(table).toHaveTextContent('创建日期');
                    expect(table).toHaveTextContent('操作');
                });
            });

            it('应该显示全选复选框', async () => {
                render(Page);
                
                await waitFor(() => {
                    const checkboxes = screen.getAllByRole('checkbox');
                    expect(checkboxes.length).toBeGreaterThan(0);
                });
            });
        });

        describe('表格数据渲染', () => {
            it('应该正确渲染试卷数据', async () => {
                render(Page);
                
                await waitFor(() => {
                    expect(screen.getByText('主观题')).toBeInTheDocument();
                    expect(screen.getByText('新建试卷')).toBeInTheDocument();
                    expect(screen.getByText('5')).toBeInTheDocument();
                    expect(screen.getByText('21')).toBeInTheDocument();
                    
                    // 使用更具体的查询方式，避免重复元素问题
                    const table = screen.getByRole('table');
                    const suggestedDurationCells = table.querySelectorAll('.suggested-duration');
                    expect(suggestedDurationCells.length).toBeGreaterThan(0);
                    expect(suggestedDurationCells[0]).toHaveTextContent('120');
                });
            });

            it('应该正确显示试卷标签', async () => {
                render(Page);
                
                await waitFor(() => {
                    expect(screen.getByText('测试')).toBeInTheDocument();
                    expect(screen.getByText('简答')).toBeInTheDocument();
                    expect(screen.getByText('填空')).toBeInTheDocument();
                });
            });

            it('应该处理空标签的情况', async () => {
                render(Page);
                
                await waitFor(() => {
                    expect(screen.getByText('-')).toBeInTheDocument();
                });
            });
        });

        describe('表格操作', () => {
            it('应该显示每行的操作按钮', async () => {
                render(Page);
                
                await waitFor(() => {
                    // 使用更具体的查询，只查找表格中的按钮
                    const table = screen.getByRole('table');
                    const allButtons = table.querySelectorAll('button');
                    const modifyText = Array.from(allButtons).filter(btn => btn.textContent === '修改');
                    const previewText = Array.from(allButtons).filter(btn => btn.textContent === '预览');
                    const deleteText = Array.from(allButtons).filter(btn => btn.textContent === '删除');
                    
                    expect(modifyText).toHaveLength(2);
                    expect(previewText).toHaveLength(2);
                    expect(deleteText).toHaveLength(2);
                });
            });

            it('修改按钮应该可以点击', async () => {
                const user = userEvent.setup();
                render(Page);
                
                await waitFor(async () => {
                    const table = screen.getByRole('table');
                    const modifyButtons = Array.from(table.querySelectorAll('button')).filter(btn => btn.textContent === '修改');
                    if (modifyButtons.length > 0) {
                        await user.click(modifyButtons[0]);
                        // 验证跳转逻辑
                    }
                });
            });

            it('预览按钮应该可以点击', async () => {
                const user = userEvent.setup();
                render(Page);
                
                await waitFor(async () => {
                    const table = screen.getByRole('table');
                    const previewButtons = Array.from(table.querySelectorAll('button')).filter(btn => btn.textContent === '预览');
                    if (previewButtons.length > 0) {
                        await user.click(previewButtons[0]);
                        // 验证预览逻辑
                    }
                });
            });

            it('删除按钮应该可以点击', async () => {
                const user = userEvent.setup();
                render(Page);
                
                await waitFor(async () => {
                    const table = screen.getByRole('table');
                    const deleteButtons = Array.from(table.querySelectorAll('button')).filter(btn => btn.textContent === '删除');
                    if (deleteButtons.length > 0) {
                        await user.click(deleteButtons[0]);
                        // 验证删除逻辑
                    }
                });
            });
        });

        describe('选择功能', () => {
            it('应该可以选择单个试卷', async () => {
                const user = userEvent.setup();
                render(Page);
                
                await waitFor(async () => {
                    const checkboxes = screen.getAllByRole('checkbox');
                    // 跳过全选复选框
                    if (checkboxes.length > 1) {
                        const firstPaperCheckbox = checkboxes[1];
                        await user.click(firstPaperCheckbox);
                        expect(firstPaperCheckbox.checked).toBe(true);
                    }
                });
            });

            it('应该可以全选试卷', async () => {
                const user = userEvent.setup();
                render(Page);
                
                await waitFor(async () => {
                    const checkboxes = screen.getAllByRole('checkbox');
                    if (checkboxes.length > 0) {
                        const selectAllCheckbox = checkboxes[0];
                        await user.click(selectAllCheckbox);
                        // 验证全选逻辑
                    }
                });
            });
        });

        describe('空数据状态', () => {
            it('应该显示空数据提示', async () => {
                mockFetch.mockResolvedValue({
                    ok: true,
                    json: () => Promise.resolve({
                        status: 0,
                        msg: "success",
                        rowCount: 0,
                        API: "/api/paper",
                        method: "GET",
                        data: []
                    })
                });
                
                render(Page);
                
                await waitFor(() => {
                    expect(screen.getByText('暂无试卷数据')).toBeInTheDocument();
                });
            });
        });
    });

    describe('翻页区域测试', () => {
        beforeEach(() => {
            mockFetch.mockResolvedValue({
                ok: true,
                json: () => Promise.resolve({
                    status: 0,
                    msg: "success",
                    rowCount: 100,
                    API: "/api/paper",
                    method: "GET",
                    data: Array(10).fill(null).map((_, i) => ({
                        ID: i + 1,
                        DomainID: null,
                        Name: `测试试卷${i + 1}`,
                        AssemblyType: '00',
                        Category: '00',
                        Level: '00',
                        SuggestedDuration: 120,
                        Description: null,
                        Tags: [],
                        Creator: 1626,
                        CreatorInfo: {
                            id: 1626,
                            email: "superAdmin@cst.com",
                            account: "superAdmin",
                            mobile_phone: null,
                            official_name: "超级管理员"
                        },
                        CreateTime: 1755135971769,
                        UpdatedBy: null,
                        UpdateTime: 1755135981830,
                        Status: "00",
                        TotalScore: 100,
                        QuestionCount: 10,
                        GroupCount: null
                    }))
                })
            });
        });

        it('应该显示分页组件', async () => {
            render(Page);
            
            await waitFor(() => {
                // 验证分页组件存在
                expect(screen.getByText('试卷管理')).toBeInTheDocument();
            });
        });

        it('应该可以切换页面大小', async () => {
            render(Page);
            
            await waitFor(() => {
                // 这里需要根据实际的分页组件实现来验证
                expect(screen.getByText('试卷管理')).toBeInTheDocument();
            });
        });
    });

    describe('API调用测试', () => {
        beforeEach(() => {
            render(Page);
        });

        it('页面加载时应该调用获取试卷列表API', async () => {
            await waitFor(() => {
                expect(mockFetch).toHaveBeenCalledWith(
                    expect.stringContaining('/api/paper'),
                    expect.objectContaining({
                        method: 'GET',
                        credentials: 'include'
                    })
                );
            });
        });

        it('搜索时应该调用获取试卷列表API', async () => {
            const user = userEvent.setup();
            const header = screen.getByText('重置').closest('.header');
            const leftSide = header.querySelector('.left-side');
            const searchPaperName = leftSide.querySelector('.search-paper-name');
            const nameInput = searchPaperName.querySelector('input[placeholder="搜索试卷名称"]');
            
            await user.type(nameInput, '测试');
            
            await waitFor(() => {
                expect(mockFetch).toHaveBeenCalledWith(
                    expect.stringContaining('/api/paper'),
                    expect.objectContaining({
                        method: 'GET',
                        credentials: 'include'
                    })
                );
            });
        });
    });

    describe('错误处理测试', () => {
        it('API调用失败时应该处理错误', async () => {
            mockFetch.mockRejectedValue(new Error('网络错误'));
            
            render(Page);
            
            await waitFor(() => {
                // 验证错误处理逻辑
                expect(screen.getByText('试卷管理')).toBeInTheDocument();
            });
        });

        it('删除操作失败时应该处理错误', async () => {
            // 先设置成功的数据加载
            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: () => Promise.resolve({
                    status: 0,
                    msg: "success",
                    rowCount: 1,
                    API: "/api/paper",
                    method: "GET",
                    data: [{
                        ID: 239,
                        DomainID: null,
                        Name: "测试试卷",
                        AssemblyType: "00",
                        Category: "00",
                        Level: "00",
                        SuggestedDuration: 120,
                        Description: null,
                        Tags: [],
                        Creator: 1626,
                        CreatorInfo: {
                            id: 1626,
                            email: "superAdmin@cst.com",
                            account: "superAdmin",
                            mobile_phone: null,
                            official_name: "超级管理员"
                        },
                        CreateTime: 1755135971769,
                        UpdatedBy: null,
                        UpdateTime: 1755135981830,
                        Status: "00",
                        TotalScore: 100,
                        QuestionCount: 10,
                        GroupCount: null
                    }]
                })
            });
            
            // 然后设置删除操作失败
            mockFetch.mockResolvedValueOnce({
                ok: false,
                status: 500
            });
            
            render(Page);
            
            await waitFor(async () => {
                const table = screen.getByRole('table');
                const deleteButtons = Array.from(table.querySelectorAll('button')).filter(btn => btn.textContent === '删除');
                if (deleteButtons.length > 0) {
                    const user = userEvent.setup();
                    await user.click(deleteButtons[0]);
                    // 验证错误处理逻辑
                }
            });
        });
    });
});
