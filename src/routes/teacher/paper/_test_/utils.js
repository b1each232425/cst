/*
 * @Author: WangKaidun 1597225095@qq.com
 * @Date: 2025-08-15 14:29:04
 * @LastEditors: WangKaidun 1597225095@qq.com
 * @LastEditTime: 2025-08-15 14:32:47
 * @FilePath: \exam\src\routes\teacher\paper\_test_\testUtils.js
 * @Description: 试卷管理页面测试数据和工具函数
 * Copyright (c) 2025 by WangKaidun 1597225095@qq.com, All Rights Reserved. 
 */

import { vi } from 'vitest';

/**
 * 模拟试卷数据
 */
export const mockPaperData = {
    // 单个试卷数据
    singlePaper: {
        ID: 256,
        DomainID: null,
        Name: '新建试卷',
        AssemblyType: '00', // 手动组卷
        Category: '00', // 考试
        Level: '00', // 简单
        SuggestedDuration: 120,
        Description: null,
        Tags: [],
        Creator: 1622,
        CreatorInfo: {
            id: 1622,
            email: '188306257@126.com',
            account: 'be730v1',
            mobile_phone: '19832706790',
            official_name: '陶小明'
        },
        CreateTime: 1755239697791,
        UpdatedBy: null,
        UpdateTime: 1755239697791,
        Status: '00',
        TotalScore: 3,
        QuestionCount: 1,
        GroupCount: null
    },

    // 试卷列表数据
    paperList: [
        {
            ID: 256,
            DomainID: null,
            Name: '新建试卷',
            AssemblyType: '00',
            Category: '00',
            Level: '00',
            SuggestedDuration: 120,
            Description: null,
            Tags: [],
            Creator: 1622,
            CreatorInfo: {
                id: 1622,
                email: '188306257@126.com',
                account: 'be730v1',
                mobile_phone: '19832706790',
                official_name: '陶小明'
            },
            CreateTime: 1755239697791,
            UpdatedBy: null,
            UpdateTime: 1755239697791,
            Status: '00',
            TotalScore: 3,
            QuestionCount: 1,
            GroupCount: null
        },
        {
            ID: 249,
            DomainID: null,
            Name: '魏一一测试',
            AssemblyType: '00',
            Category: '00',
            Level: '00',
            SuggestedDuration: 120,
            Description: null,
            Tags: [],
            Creator: 1702,
            CreatorInfo: {
                id: 1702,
                email: null,
                account: 'wms05rjtnqph',
                mobile_phone: null,
                official_name: '魏一一'
            },
            CreateTime: 1755237510940,
            UpdatedBy: null,
            UpdateTime: 1755237869398,
            Status: '00',
            TotalScore: 38,
            QuestionCount: 8,
            GroupCount: null
        },
        {
            ID: 246,
            DomainID: null,
            Name: '新建试卷222',
            AssemblyType: '00',
            Category: '00',
            Level: '00',
            SuggestedDuration: 120,
            Description: null,
            Tags: [],
            Creator: 1626,
            CreatorInfo: {
                id: 1626,
                email: 'superAdmin@cst.com',
                account: 'superAdmin',
                mobile_phone: null,
                official_name: '超级管理员'
            },
            CreateTime: 1755160019037,
            UpdatedBy: null,
            UpdateTime: 1755160025742,
            Status: '00',
            TotalScore: 15,
            QuestionCount: 4,
            GroupCount: null
        },
        {
            ID: 245,
            DomainID: null,
            Name: '带标签的试卷',
            AssemblyType: '00',
            Category: '00',
            Level: '01',
            SuggestedDuration: 90,
            Description: '这是一个测试试卷',
            Tags: ['数学', '基础', '测试'],
            Creator: 1626,
            CreatorInfo: {
                id: 1626,
                email: 'superAdmin@cst.com',
                account: 'superAdmin',
                mobile_phone: null,
                official_name: '超级管理员'
            },
            CreateTime: 1755156849659,
            UpdatedBy: null,
            UpdateTime: 1755156849659,
            Status: '00',
            TotalScore: 50,
            QuestionCount: 10,
            GroupCount: null
        },
        {
            ID: 244,
            DomainID: null,
            Name: '练习试卷',
            AssemblyType: '01',
            Category: '02',
            Level: '02',
            SuggestedDuration: 60,
            Description: '练习用试卷',
            Tags: ['练习', '英语'],
            Creator: 1626,
            CreatorInfo: {
                id: 1626,
                email: 'superAdmin@cst.com',
                account: 'superAdmin',
                mobile_phone: null,
                official_name: '超级管理员'
            },
            CreateTime: 1755150505138,
            UpdatedBy: null,
            UpdateTime: 1755150511258,
            Status: '00',
            TotalScore: 30,
            QuestionCount: 6,
            GroupCount: null
        }
    ],

    // 空试卷列表
    emptyPaperList: [],

    // 分页响应数据
    paginatedResponse: {
        status: 0,
        msg: 'success',
        rowCount: 0,
        API: '/api/paper',
        method: 'GET',
        data: []
    }
};

/**
 * 模拟API响应数据
 */
export const mockApiResponses = {
    // 成功创建试卷
    createPaperSuccess: {
        status: 0,
        msg: '创建成功',
        data: {
            paper: {
                ID: 999,
                DomainID: null,
                Name: '新建试卷',
                AssemblyType: '00',
                Category: '00',
                Level: '00',
                SuggestedDuration: 120,
                Description: null,
                Tags: [],
                Creator: 1626,
                CreatorInfo: {
                    id: 1626,
                    email: 'superAdmin@cst.com',
                    account: 'superAdmin',
                    mobile_phone: null,
                    official_name: '超级管理员'
                },
                CreateTime: Date.now(),
                UpdatedBy: null,
                UpdateTime: Date.now(),
                Status: '00',
                TotalScore: 0,
                QuestionCount: 0,
                GroupCount: null
            }
        }
    },

    // 创建试卷失败
    createPaperFailure: {
        status: 1,
        msg: '创建失败',
        data: null
    },

    // 成功删除试卷
    deletePaperSuccess: {
        status: 0,
        msg: '删除成功',
        data: null
    },

    // 删除试卷失败
    deletePaperFailure: {
        status: 1,
        msg: '删除失败',
        data: null
    },

    // 成功获取试卷列表
    fetchPaperListSuccess: {
        status: 0,
        msg: 'success',
        rowCount: 177,
        API: '/api/paper',
        method: 'GET',
        data: mockPaperData.paperList
    },

    // 获取试卷列表失败
    fetchPaperListFailure: {
        status: 1,
        msg: '获取失败',
        data: null,
        rowCount: 0
    },

    // 获取试卷列表 - 空数据
    fetchPaperListEmpty: {
        status: 0,
        msg: 'success',
        rowCount: 0,
        API: '/api/paper',
        method: 'GET',
        data: []
    },

    // 获取试卷列表 - 大量数据
    fetchPaperListLarge: {
        status: 0,
        msg: 'success',
        rowCount: 1000,
        API: '/api/paper',
        method: 'GET',
        data: Array.from({ length: 20 }, (_, i) => ({
            ID: 1000 + i,
            DomainID: null,
            Name: `批量试卷${i + 1}`,
            AssemblyType: '00',
            Category: '00',
            Level: '00',
            SuggestedDuration: 120,
            Description: null,
            Tags: [],
            Creator: 1626,
            CreatorInfo: {
                id: 1626,
                email: 'superAdmin@cst.com',
                account: 'superAdmin',
                mobile_phone: null,
                official_name: '超级管理员'
            },
            CreateTime: Date.now() - i * 86400000,
            UpdatedBy: null,
            UpdateTime: Date.now() - i * 86400000,
            Status: '00',
            TotalScore: Math.floor(Math.random() * 100) + 1,
            QuestionCount: Math.floor(Math.random() * 20) + 1,
            GroupCount: null
        }))
    },

    // 预览试卷成功
    previewPaperSuccess: {
        status: 0,
        msg: '获取成功',
        data: [
            {
                ID: 'question_001',
                Type: '01',
                Content: '测试题目内容',
                Options: ['A', 'B', 'C', 'D'],
                Answer: 'A',
                Score: 5
            }
        ]
    },

    // 搜索特定名称的试卷
    searchByNameResult: {
        status: 0,
        msg: 'success',
        rowCount: 1,
        API: '/api/paper',
        method: 'GET',
        data: [
            {
                ID: 256,
                DomainID: null,
                Name: '新建试卷',
                AssemblyType: '00',
                Category: '00',
                Level: '00',
                SuggestedDuration: 120,
                Description: null,
                Tags: [],
                Creator: 1622,
                CreatorInfo: {
                    id: 1622,
                    email: '188306257@126.com',
                    account: 'be730v1',
                    mobile_phone: '19832706790',
                    official_name: '陶小明'
                },
                CreateTime: 1755239697791,
                UpdatedBy: null,
                UpdateTime: 1755239697791,
                Status: '00',
                TotalScore: 3,
                QuestionCount: 1,
                GroupCount: null
            }
        ]
    },

    // 搜索特定标签的试卷
    searchByTagResult: {
        status: 0,
        msg: 'success',
        rowCount: 1,
        API: '/api/paper',
        method: 'GET',
        data: [
            {
                ID: 245,
                DomainID: null,
                Name: '带标签的试卷',
                AssemblyType: '00',
                Category: '00',
                Level: '01',
                SuggestedDuration: 90,
                Description: '这是一个测试试卷',
                Tags: ['数学', '基础', '测试'],
                Creator: 1626,
                CreatorInfo: {
                    id: 1626,
                    email: 'superAdmin@cst.com',
                    account: 'superAdmin',
                    mobile_phone: null,
                    official_name: '超级管理员'
                },
                CreateTime: 1755156849659,
                UpdatedBy: null,
                UpdateTime: 1755156849659,
                Status: '00',
                TotalScore: 50,
                QuestionCount: 10,
                GroupCount: null
            }
        ]
    }
};

/**
 * 模拟网络错误
 */
export const mockNetworkError = new Error('网络请求失败');

/**
 * 模拟fetch响应
 */
export const createMockFetchResponse = (data, ok = true, status = 200) => {
    return Promise.resolve({
        ok,
        status,
        json: () => Promise.resolve(data)
    });
};

/**
 * 模拟fetch错误
 */
export const createMockFetchError = (error = mockNetworkError) => {
    return Promise.reject(error);
};

/**
 * 设置fetch mock
 */
export const setupFetchMock = (responseData, shouldFail = false, error = null) => {
    if (shouldFail) {
        global.fetch = vi.fn().mockImplementation(() => createMockFetchError(error));
    } else {
        global.fetch = vi.fn().mockImplementation(() => createMockFetchResponse(responseData));
    }
};

/**
 * 重置fetch mock
 */
export const resetFetchMock = () => {
    if (global.fetch) {
        global.fetch.mockClear();
    }
};

/**
 * 验证fetch调用参数
 */
export const verifyFetchCall = (expectedUrl, expectedOptions = {}) => {
    expect(global.fetch).toHaveBeenCalledWith(expectedUrl, expectedOptions);
};

/**
 * 等待异步操作完成
 */
export const waitForAsync = (ms = 100) => {
    return new Promise(resolve => setTimeout(resolve, ms));
};

/**
 * 创建分页测试数据
 */
export const createPaginatedTestData = (totalItems, pageSize, currentPage) => {
    const startIndex = (currentPage - 1) * pageSize;
    const endIndex = startIndex + pageSize;
    const data = Array.from({ length: totalItems }, (_, i) => ({
        ID: 1000 + i,
        DomainID: null,
        Name: `分页测试试卷${i + 1}`,
        AssemblyType: '00',
        Category: '00',
        Level: '00',
        SuggestedDuration: 120,
        Description: null,
        Tags: [],
        Creator: 1626,
        CreatorInfo: {
            id: 1626,
            email: 'superAdmin@cst.com',
            account: 'superAdmin',
            mobile_phone: null,
            official_name: '超级管理员'
        },
        CreateTime: Date.now() - i * 86400000,
        UpdatedBy: null,
        UpdateTime: Date.now() - i * 86400000,
        Status: '00',
        TotalScore: Math.floor(Math.random() * 100) + 1,
        QuestionCount: Math.floor(Math.random() * 20) + 1,
        GroupCount: null
    }));

    return {
        status: 0,
        msg: 'success',
        rowCount: totalItems,
        API: '/api/paper',
        method: 'GET',
        data: data.slice(startIndex, endIndex)
    };
};

/**
 * 模拟用户事件
 */
export const simulateUserAction = {
    // 输入文本
    inputText: (element, text) => {
        element.value = text;
        element.dispatchEvent(new Event('input', { bubbles: true }));
        element.dispatchEvent(new Event('change', { bubbles: true }));
    },

    // 点击按钮
    clickButton: (element) => {
        element.click();
    },

    // 选择复选框
    checkCheckbox: (element, checked) => {
        element.checked = checked;
        element.dispatchEvent(new Event('change', { bubbles: true }));
    }
};

/**
 * 测试工具函数
 */
export const testHelpers = {
    // 创建DOM元素
    createElement: (tag, attributes = {}) => {
        const element = document.createElement(tag);
        Object.entries(attributes).forEach(([key, value]) => {
            element.setAttribute(key, value);
        });
        return element;
    },

    // 清理DOM
    cleanupDOM: () => {
        document.body.innerHTML = '';
    },

    // 设置测试环境
    setupTestEnvironment: () => {
        // 设置全局fetch mock
        global.fetch = vi.fn();
        
        // 设置localStorage mock
        Object.defineProperty(window, 'localStorage', {
            value: {
                getItem: vi.fn(),
                setItem: vi.fn(),
                removeItem: vi.fn(),
                clear: vi.fn()
            },
            writable: true
        });

        // 设置location mock
        Object.defineProperty(window, 'location', {
            value: {
                href: 'http://localhost:3000',
                assign: vi.fn(),
                replace: vi.fn(),
                reload: vi.fn()
            },
            writable: true
        });

        // Mock window.location.href setter to prevent navigation errors
        Object.defineProperty(window.location, 'href', {
            get: () => 'http://localhost:3000',
            set: vi.fn() // Mock the setter to prevent navigation
        });
    },

    // 清理测试环境
    cleanupTestEnvironment: () => {
        vi.clearAllMocks();
        vi.resetModules();
    }
};

/**
 * Mock 管理工具
 */
export const mockHelpers = {
    // 设置所有必要的mock
    setupAllMocks: () => {
        // Mock $app/navigation - 完全mock以避免SvelteKit导航错误
        vi.mock('$app/navigation', () => ({
            goto: vi.fn().mockImplementation(() => {
                // 返回一个已解决的Promise，避免导航错误
                return Promise.resolve();
            }),
            invalidate: vi.fn().mockImplementation(() => Promise.resolve()),
            invalidateAll: vi.fn().mockImplementation(() => Promise.resolve()),
            preloadData: vi.fn().mockImplementation(() => Promise.resolve()),
            preloadCode: vi.fn().mockImplementation(() => Promise.resolve())
        }));



        // Mock $lib/components/Toast/Toast
        vi.mock('$lib/components/Toast/Toast', () => ({
            toast: {
                success: vi.fn(),
                error: vi.fn()
            }
        }));

        // Mock $lib/components/MessageBox/MessageBox
        vi.mock('$lib/components/MessageBox/MessageBox', () => ({
            default: vi.fn()
        }));

        // Mock $lib/utils/optimize
        vi.mock('$lib/utils/optimize', () => ({
            debounce: vi.fn((fn, delay) => fn)
        }));

        // Mock $lib/utils/time_utils
        vi.mock('$lib/utils/time_utils', () => ({
            formatTimestamp: vi.fn((timestamp, options) => {
                if (options?.show_date && options?.show_time) {
                    return '2025-01-27 10:00:00';
                } else if (options?.show_date) {
                    return '2025-01-27';
                }
                return '10:00:00';
            })
        }));

        // Mock $lib/components/Button/index.scss
        vi.mock('$lib/components/Button/index.scss', () => ({}));

        // Mock $lib/components/Input/index.scss
        vi.mock('$lib/components/Input/index.scss', () => ({}));

        // Mock 工具函数
        vi.mock('./_utils/tool', () => ({
            LEVEL_TRANS: {
                '00': '简单',
                '01': '中等',
                '02': '困难'
            },
            CATEGORY_TRANS: {
                '00': '考试',
                '02': '练习'
            },
            ASSEMBLY_TYPE_TRANS: {
                '00': '手动组卷',
                '01': '自动组卷'
            }
        }));

        // Mock SvelteKit环境以避免导航错误
        vi.mock('$app/stores', () => ({
            page: {
                subscribe: vi.fn(() => ({
                    unsubscribe: vi.fn()
                }))
            },
            navigating: {
                subscribe: vi.fn(() => ({
                    unsubscribe: vi.fn()
                }))
            },
            updated: {
                subscribe: vi.fn(() => ({
                    unsubscribe: vi.fn()
                }))
            }
        }));

        // Mock SvelteKit运行时以避免导航错误
        vi.mock('@sveltejs/kit', () => ({
            browser: true,
            dev: false,
            building: false,
            version: '1.0.0'
        }));

        // Mock SvelteKit客户端运行时
        vi.mock('$app/environment', () => ({
            browser: true,
            dev: false,
            building: false
        }));

        // Mock window.location to prevent navigation errors
        if (typeof window !== 'undefined') {
            Object.defineProperty(window, 'location', {
                value: {
                    href: 'http://localhost:3000',
                    assign: vi.fn(),
                    replace: vi.fn(),
                    reload: vi.fn(),
                    toString: () => 'http://localhost:3000'
                },
                writable: true,
                configurable: true
            });

            // Mock window.location.href setter
            Object.defineProperty(window.location, 'href', {
                get: () => 'http://localhost:3000',
                set: vi.fn() // Mock the setter to prevent navigation
            });
        }
    },

    // 清理所有mock
    clearAllMocks: () => {
        vi.clearAllMocks();
        if (global.fetch) {
            global.fetch.mockClear();
        }
    },

    // 重置fetch mock
    resetFetchMock: () => {
        if (global.fetch) {
            global.fetch.mockClear();
        }
    }
};

/**
 * 测试数据初始化工具
 */
export const testDataHelpers = {
    // 初始化页面测试数据
    setupPageTestData: () => {
        // 设置fetch返回试卷列表数据
        global.fetch = vi.fn().mockImplementation(() => 
            Promise.resolve({
                ok: true,
                status: 200,
                json: () => Promise.resolve({
                    status: 0,
                    msg: 'success',
                    rowCount: 3,
                    API: '/api/paper',
                    method: 'GET',
                    data: [
                        {
                            ID: 256,
                            Name: '新建试卷',
                            AssemblyType: '00',
                            Category: '00',
                            Level: '00',
                            SuggestedDuration: 120,
                            Tags: [],
                            CreateTime: 1755239697791,
                            UpdateTime: 1755239697791,
                            TotalScore: 3,
                            QuestionCount: 1
                        },
                        {
                            ID: 249,
                            Name: '魏一一测试',
                            AssemblyType: '00',
                            Category: '00',
                            Level: '00',
                            SuggestedDuration: 120,
                            Tags: [],
                            CreateTime: 1755237510940,
                            UpdateTime: 1755237869398,
                            TotalScore: 38,
                            QuestionCount: 8
                        },
                        {
                            ID: 246,
                            Name: '带标签的试卷',
                            AssemblyType: '00',
                            Category: '00',
                            Level: '01',
                            SuggestedDuration: 90,
                            Tags: ['数学', '基础', '测试'],
                            CreateTime: 1755156849659,
                            UpdateTime: 1755156849659,
                            TotalScore: 50,
                            QuestionCount: 10
                        }
                    ]
                })
            })
        );
    },

    // 初始化函数测试数据
    setupFunctionTestData: () => {
        // 设置fetch mock
        global.fetch = vi.fn();
        
        // 设置localStorage mock
        Object.defineProperty(window, 'localStorage', {
            value: {
                getItem: vi.fn(),
                setItem: vi.fn(),
                removeItem: vi.fn(),
                clear: vi.fn()
            },
            writable: true
        });

        // 设置location mock
        Object.defineProperty(window, 'location', {
            value: {
                href: 'http://localhost:3000',
                assign: vi.fn(),
                replace: vi.fn(),
                reload: vi.fn()
            },
            writable: true
        });

        // Mock window.location.href setter to prevent navigation errors
        Object.defineProperty(window.location, 'href', {
            get: () => 'http://localhost:3000',
            set: vi.fn() // Mock the setter to prevent navigation
        });
    },

    // 清理测试数据
    cleanupTestData: () => {
        vi.clearAllMocks();
        vi.resetModules();
        if (global.fetch) {
            global.fetch.mockClear();
        }
    }
};

/**
 * 常量定义
 */
export const TEST_CONSTANTS = {
    // 试卷类型
    PAPER_TYPES: {
        EXAM: '00',      // 考试
        PRACTICE: '02'   // 练习
    },

    // 组卷方式
    ASSEMBLY_TYPES: {
        MANUAL: '00',    // 手动组卷 (根据实际数据调整)
        AUTO: '01'       // 自动组卷
    },

    // 难度等级
    DIFFICULTY_LEVELS: {
        EASY: '00',      // 简单 (根据实际数据调整)
        NORMAL: '01',    // 中等
        HARD: '02'       // 困难
    },

    // 分页配置
    PAGINATION: {
        DEFAULT_PAGE: 1,
        DEFAULT_PAGE_SIZE: 10,
        PAGE_SIZE_OPTIONS: [10, 20]
    },

    // 防抖延迟
    DEBOUNCE_DELAY: 500
};

export default {
    mockPaperData,
    mockApiResponses,
    mockNetworkError,
    createMockFetchResponse,
    createMockFetchError,
    setupFetchMock,
    resetFetchMock,
    verifyFetchCall,
    waitForAsync,
    createPaginatedTestData,
    simulateUserAction,
    testHelpers,
    mockHelpers,
    testDataHelpers,
    TEST_CONSTANTS
};
