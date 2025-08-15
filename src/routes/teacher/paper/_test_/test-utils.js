/**
 * 测试工具文件 - test-utils.js
 * 
 * 作用：提供所有测试文件的公共工具、mock设置、辅助函数和测试数据
 * 
 * 包含内容：
 * - Mock设置：Svelte stores、外部依赖、全局对象
 * - 辅助函数：用户事件创建、安全卸载、DOM元素查询
 * - 测试数据生成器：试卷数据、API响应数据
 * - 公共断言函数：API调用验证、分页结构验证
 * - 测试配置：搜索配置、试卷数据常量
 * - 通用测试设置：测试初始化和清理
 */

import { vi } from 'vitest';
import { screen, waitFor } from '@testing-library/svelte';
import userEvent from '@testing-library/user-event';

// ==================== MOCK 设置 ====================

// Mock Svelte stores
export const mockStores = {
    CURRENT_PAPER_ID: 0,
    SEARCH_PAPER_NAME: "",
    SEARCH_PAPER_TAGS: "",
    PAPER_PAGE_SIZE: 10,
    PAPER_PAGE: 1,
    SELECTED_PAPER_IDS: [],
    ALL_PAPER_SELECTED: false
};

export const createMockStore = (initialValue) => {
    let value = initialValue;
    const subscribers = new Set();
    
    return {
        subscribe: vi.fn((callback) => {
            callback(value);
            subscribers.add(callback);
            return { 
                unsubscribe: vi.fn(() => {
                    subscribers.delete(callback);
                }) 
            };
        }),
        set: vi.fn((newValue) => {
            value = newValue;
            subscribers.forEach(callback => callback(value));
        }),
        update: vi.fn((updater) => {
            value = updater(value);
            subscribers.forEach(callback => callback(value));
        }),
        get: vi.fn(() => value)
    };
};

// Mock 外部依赖
export const setupMocks = () => {
    vi.mock('../_stores/store', () => ({
        CURRENT_PAPER_ID: createMockStore(mockStores.CURRENT_PAPER_ID),
        SEARCH_PAPER_NAME: createMockStore(mockStores.SEARCH_PAPER_NAME),
        SEARCH_PAPER_TAGS: createMockStore(mockStores.SEARCH_PAPER_TAGS),
        PAPER_PAGE_SIZE: createMockStore(mockStores.PAPER_PAGE_SIZE),
        PAPER_PAGE: createMockStore(mockStores.PAPER_PAGE),
        SELECTED_PAPER_IDS: createMockStore(mockStores.SELECTED_PAPER_IDS),
        ALL_PAPER_SELECTED: createMockStore(mockStores.ALL_PAPER_SELECTED)
    }));

    vi.mock('$app/navigation', () => ({ goto: vi.fn() }));
    vi.mock('$lib/components/Toast/Toast', () => ({
        toast: { success: vi.fn(), error: vi.fn() }
    }));
    vi.mock('$lib/components/MessageBox/MessageBox', () => ({
        MessageBox: vi.fn()
    }));
    vi.mock('$lib/utils/time_utils', () => ({
        formatTimestamp: vi.fn((timestamp, options) => {
            if (options?.show_date && options?.show_time) return '2025-01-01 12:00:00';
            if (options?.show_date && !options?.show_time) return '2025-01-01';
            return '2025-01-01';
        })
    }));
    vi.mock('../_utils/tool', () => ({
        LEVEL_TRANS: {
            "00": "简单", "01": "中等", "02": "困难",
            "简单": "easy-level", "中等": "normal-level", "困难": "hard-level"
        },
        CATEGORY_TRANS: { "00": "考试", "02": "练习" },
        ASSEMBLY_TYPE_TRANS: {
            "00": "自定义组卷", "01": "随机组卷", "02": "智能刷题"
        }
    }));
    vi.mock('$lib/utils/optimize', () => ({
        debounce: vi.fn((fn) => (...args) => fn(...args))
    }));

    // Mock 全局对象
    global.fetch = vi.fn();
    
    // 安全地设置localStorage和location，检查环境
    if (typeof global !== 'undefined') {
        global.localStorage = {
            getItem: vi.fn(),
            setItem: vi.fn(),
            removeItem: vi.fn(),
            clear: vi.fn()
        };
        
        global.location = {
            href: '',
            assign: vi.fn(),
            reload: vi.fn()
        };
    }
    
    // 如果在浏览器环境中，也设置window对象
    if (typeof window !== 'undefined') {
        Object.defineProperty(window, 'localStorage', {
            value: {
                getItem: vi.fn(),
                setItem: vi.fn(),
                removeItem: vi.fn(),
                clear: vi.fn()
            },
            writable: true
        });
        
        Object.defineProperty(window, 'location', {
            value: {
                href: '',
                assign: vi.fn(),
                reload: vi.fn()
            },
            writable: true
        });
    }
};

// ==================== 辅助函数 ====================

// 测试工具函数
export const createUserEvent = () => userEvent.setup({
    delay: null,
    advanceTimers: vi.advanceTimersByTime
});

export const safeUnmount = async (unmount, user) => {
    if (user) await new Promise(resolve => setTimeout(resolve, 0));
    if (unmount) unmount();
    await new Promise(resolve => setTimeout(resolve, 0));
};

// Mock 数据生成器
export const createMockPaper = (id, name, category = "00", tags = []) => ({
    ID: id,
    DomainID: null,
    Name: name,
    AssemblyType: "00",
    Category: category,
    Level: "00",
    SuggestedDuration: 120,
    Description: null,
    Tags: tags,
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
});

export const createMockApiResponse = (data, rowCount = 0, status = 0) => ({
    ok: true,
    json: () => Promise.resolve({
        status,
        msg: status === 0 ? "success" : "error",
        rowCount,
        API: "/api/paper",
        method: "GET",
        data
    })
});

// DOM 元素辅助函数
export const getSearchElements = (containerClass) => {
    const header = screen.getByText('重置').closest('.header');
    const leftSide = header.querySelector('.left-side');
    const searchContainer = leftSide.querySelector(`.${containerClass}`);
    const input = searchContainer.querySelector('input[placeholder="搜索试卷名称"]');
    const clearButton = searchContainer.querySelector('button[data-name="clear"]');
    return { searchContainer, input, clearButton };
};

export const getTableElements = () => {
    const table = screen.getByRole('table');
    const checkboxes = table.querySelectorAll('input[type="checkbox"]');
    const buttons = Array.from(table.querySelectorAll('button'));
    return {
        table,
        checkboxes,
        modifyButtons: buttons.filter(btn => btn.textContent === '修改'),
        previewButtons: buttons.filter(btn => btn.textContent === '预览'),
        deleteButtons: buttons.filter(btn => btn.textContent === '删除')
    };
};

// API 验证辅助函数
export const verifyApiCall = async (expectedUrl = '/api/paper', method = 'GET') => {
    await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith(
            expect.stringContaining(expectedUrl),
            expect.objectContaining({
                method,
                credentials: 'include'
            })
        );
    }, { timeout: 1000 });
};

export const verifyPaginationStructure = async () => {
    await waitFor(() => {
        const pageControl = document.querySelector('.page-control');
        expect(pageControl).toBeInTheDocument();
        expect(pageControl.querySelector('.page-settings')).toBeInTheDocument();
        expect(pageControl.querySelector('.pagination-wrapper')).toBeInTheDocument();
    });
};

// 测试数据常量
export const TEST_PAPERS = {
    single: createMockPaper(239, "测试试卷"),
    multiple: [
        createMockPaper(239, "主观题", "00", []),
        createMockPaper(238, "新建试卷", "00", ["测试", "简答", "填空"])
    ],
    large: Array.from({ length: 100 }, (_, i) => 
        createMockPaper(i + 1, `测试试卷${i + 1}`)
    )
};

export const SEARCH_CONFIGS = [
    { name: '试卷名称', containerClass: 'search-paper-name', testValue: '测试试卷' },
    { name: '试卷标签', containerClass: 'search-paper-tag', testValue: '数学' }
];

// 通用测试设置
export const setupCommonTest = () => {
    const mockFetch = vi.fn().mockResolvedValue(createMockApiResponse([]));
    global.fetch = mockFetch;
    return mockFetch;
};

export const cleanupCommonTest = () => {
    vi.restoreAllMocks();
    vi.clearAllTimers();
    vi.clearAllMocks();
};
