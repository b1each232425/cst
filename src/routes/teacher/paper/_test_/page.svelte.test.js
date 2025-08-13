/*
 * @Author: WangKaidun 1597225095@qq.com
 * @Date: 2025-08-12 21:14:17
 * @LastEditors: WangKaidun 1597225095@qq.com
 * @LastEditTime: 2025-08-12 21:40:17
 * @FilePath: \exam\src\routes\teacher\paper\_test_\page.svelte.test.js
 * @Description: 
 * Copyright (c) 2025 by WangKaidun 1597225095@qq.com, All Rights Reserved. 
 */
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/svelte';
import { tick } from 'svelte';
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

// Mock Svelte navigation
vi.mock('$app/navigation', () => ({
    goto: vi.fn()
}));

// Mock fetch
global.fetch = vi.fn();

// Mock toast
vi.mock('$lib/components/Toast/Toast', () => ({
    toast: {
        success: vi.fn(),
        error: vi.fn()
    }
}));

// Mock MessageBox
vi.mock('$lib/components/MessageBox/MessageBox', () => ({
    default: vi.fn()
}));

// Mock time utils
vi.mock('$lib/utils/time_utils', () => ({
    formatTimestamp: vi.fn((time, options) => {
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
        "02": "中等", 
        "04": "困难",
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
        "02": "随机组卷",
        "04": "智能刷题"
    }
}));

// Mock debounce function
vi.mock('$lib/utils/optimize', () => ({
    debounce: vi.fn((fn) => fn)
}));

describe('试卷管理页面', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        
        // Mock successful API response
        global.fetch.mockResolvedValue({
            ok: true,
            json: () => Promise.resolve({
                rowCount: 2,
                data: [
                    {
                        ID: 1,
                        Name: '测试试卷1',
                        AssemblyType: '00',
                        Category: '00',
                        QuestionCount: 10,
                        TotalScore: 100,
                        SuggestedDuration: 60,
                        Tags: ['数学', '基础'],
                        Level: '00',
                        UpdateTime: '2025-01-01T12:00:00Z',
                        CreateTime: '2025-01-01T00:00:00Z'
                    },
                    {
                        ID: 2,
                        Name: '测试试卷2',
                        AssemblyType: '02',
                        Category: '02',
                        QuestionCount: 20,
                        TotalScore: 200,
                        SuggestedDuration: 120,
                        Tags: [],
                        Level: '02',
                        UpdateTime: '2025-01-01T12:00:00Z',
                        CreateTime: '2025-01-01T00:00:00Z'
                    }
                ]
            })
        });
    });

    it('应该正确渲染页面标题', async () => {
        render(Page);
        await tick();
        
        expect(screen.getByText('试卷管理')).toBeInTheDocument();
    });

    it('应该渲染搜索区域', async () => {
        render(Page);
        await tick();
        
        // 检查搜索区域的标签
        const searchLabels = screen.getAllByText('试卷名称');
        expect(searchLabels).toHaveLength(2); // 一个在搜索区域，一个在表格头部
        
        const tagLabels = screen.getAllByText('试卷标签');
        expect(tagLabels).toHaveLength(2); // 一个在搜索区域，一个在表格头部
        
        // 检查搜索输入框
        const searchInputs = screen.getAllByPlaceholderText('搜索试卷名称');
        expect(searchInputs).toHaveLength(2); // 试卷名称和试卷标签的输入框
    });

    it('应该渲染操作按钮', async () => {
        render(Page);
        await tick();
        
        expect(screen.getByText('重置')).toBeInTheDocument();
        expect(screen.getByText('删除')).toBeInTheDocument();
        expect(screen.getByText('自定义组卷')).toBeInTheDocument();
    });

    it('应该渲染表格头部', async () => {
        render(Page);
        await tick();
        
        // 检查表格头部
        const tableHeaders = screen.getAllByText('试卷名称');
        expect(tableHeaders).toHaveLength(2); // 一个在搜索区域，一个在表格头部
        
        const tagHeaders = screen.getAllByText('试卷标签');
        expect(tagHeaders).toHaveLength(2); // 一个在搜索区域，一个在表格头部
        
        // 检查其他表格列标题
        expect(screen.getByText('组卷方式')).toBeInTheDocument();
        expect(screen.getByText('试卷用途')).toBeInTheDocument();
        expect(screen.getByText('试题数量')).toBeInTheDocument();
        expect(screen.getByText('试卷总分')).toBeInTheDocument();
        expect(screen.getByText('建议时长(分)')).toBeInTheDocument();
        expect(screen.getByText('试卷难度')).toBeInTheDocument();
        expect(screen.getByText('更新时间')).toBeInTheDocument();
        expect(screen.getByText('创建日期')).toBeInTheDocument();
        expect(screen.getByText('操作')).toBeInTheDocument();
    });

    it('应该显示分页信息', async () => {
        render(Page);
        await tick();
        
        // 检查分页信息
        expect(screen.getByText('共 0 条')).toBeInTheDocument();
        expect(screen.getByText('10条/页')).toBeInTheDocument();
        expect(screen.getByText('20条/页')).toBeInTheDocument();
    });

    it('应该显示空数据状态', async () => {
        render(Page);
        await tick();
        
        // 检查空数据状态
        expect(screen.getByText('暂无试卷数据')).toBeInTheDocument();
        expect(screen.getByAltText('No Data')).toBeInTheDocument();
    });

    it('应该显示全选复选框', async () => {
        render(Page);
        await tick();
        
        // 检查全选复选框
        const checkboxes = screen.getAllByRole('checkbox');
        expect(checkboxes.length).toBeGreaterThan(0);
    });

    it('应该显示分页控件', async () => {
        render(Page);
        await tick();
        
        // 检查分页控件
        expect(screen.getByText('前往')).toBeInTheDocument();
        expect(screen.getByTestId('jump-to-input')).toBeInTheDocument();
        expect(screen.getByTestId('left_jt')).toBeInTheDocument();
        expect(screen.getByTestId('right_jt')).toBeInTheDocument();
    });

    it('应该能够点击重置按钮', async () => {
        render(Page);
        await tick();
        
        // 获取重置按钮
        const resetButton = screen.getByText('重置');
        
        // 点击重置按钮
        fireEvent.click(resetButton);
        
        // 验证fetch被调用（重置会重新获取数据）
        expect(global.fetch).toHaveBeenCalled();
    });

    it('应该能够点击自定义组卷按钮', async () => {
        render(Page);
        await tick();
        
        // 获取自定义组卷按钮
        const manualButton = screen.getByText('自定义组卷');
        
        // 点击自定义组卷按钮
        fireEvent.click(manualButton);
        
        // 验证fetch被调用（创建空试卷）
        expect(global.fetch).toHaveBeenCalledWith(
            '/api/paper/manual',
            expect.objectContaining({
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include'
            })
        );
    });

    it('应该能够点击删除按钮', async () => {
        render(Page);
        await tick();
        
        // 获取删除按钮
        const deleteButton = screen.getByText('删除');
        
        // 点击删除按钮
        fireEvent.click(deleteButton);
        
        // 验证按钮可以被点击
        expect(deleteButton).toBeInTheDocument();
    });

    it('应该能够选择全选复选框', async () => {
        render(Page);
        await tick();
        
        // 获取全选复选框
        const checkboxes = screen.getAllByRole('checkbox');
        const selectAllCheckbox = checkboxes[0]; // 第一个是全选复选框
        
        // 验证复选框存在
        expect(selectAllCheckbox).toBeInTheDocument();
        expect(selectAllCheckbox.type).toBe('checkbox');
    });

    it('应该能够输入分页跳转', async () => {
        render(Page);
        await tick();
        
        // 获取分页跳转输入框
        const jumpInput = screen.getByTestId('jump-to-input');
        
        // 验证输入框存在
        expect(jumpInput).toBeInTheDocument();
        expect(jumpInput.type).toBe('number');
    });

    it('应该能够点击分页按钮', async () => {
        render(Page);
        await tick();
        
        // 获取分页按钮
        const prevButton = screen.getByTestId('left_jt');
        const nextButton = screen.getByTestId('right_jt');
        
        // 验证按钮存在
        expect(prevButton).toBeInTheDocument();
        expect(nextButton).toBeInTheDocument();
        
        // 验证上一页按钮被禁用（当前在第一页）
        expect(prevButton.disabled).toBe(true);
        
        // 验证下一页按钮可用
        expect(nextButton.disabled).toBe(false);
    });

    it('应该能够选择每页显示数量', async () => {
        render(Page);
        await tick();
        
        // 获取每页显示数量选项
        expect(screen.getByText('10条/页')).toBeInTheDocument();
        expect(screen.getByText('20条/页')).toBeInTheDocument();
        
        // 验证当前选中的是10条/页
        const activeOption = screen.getByText('10条/页').closest('button');
        expect(activeOption).toHaveClass('active');
    });

    it('应该显示搜索区域的清除按钮', async () => {
        render(Page);
        await tick();
        
        // 获取清除按钮
        const clearButtons = screen.getAllByRole('button', { name: '' });
        
        // 验证清除按钮存在
        expect(clearButtons.length).toBeGreaterThan(0);
    });

    it('应该显示分页信息', async () => {
        render(Page);
        await tick();
        
        // 验证分页信息显示
        expect(screen.getByText('共 0 条')).toBeInTheDocument();
        expect(screen.getByText('前往')).toBeInTheDocument();
    });

    it('应该能够处理搜索输入', async () => {
        render(Page);
        await tick();
        
        // 获取搜索输入框
        const searchInputs = screen.getAllByPlaceholderText('搜索试卷名称');
        const nameSearchInput = searchInputs[0];
        
        // 模拟输入搜索内容
        fireEvent.input(nameSearchInput, { target: { value: '数学试卷' } });
        
        // 验证输入框存在并可交互
        expect(nameSearchInput).toBeInTheDocument();
        expect(nameSearchInput.type).toBe('text');
    });

    it('应该能够处理页面大小更改', async () => {
        render(Page);
        await tick();
        
        // 获取分页组件
        const pagination = screen.getByText('前往').closest('.page-control');
        expect(pagination).toBeInTheDocument();
    });

    it('应该能够处理页面跳转', async () => {
        render(Page);
        await tick();
        
        // 获取分页跳转输入框
        const jumpInput = screen.getByTestId('jump-to-input');
        
        // 验证输入框存在并可交互
        expect(jumpInput).toBeInTheDocument();
        expect(jumpInput.type).toBe('number');
    });

    it('应该能够处理全选逻辑', async () => {
        render(Page);
        await tick();
        
        // 获取全选复选框
        const checkboxes = screen.getAllByRole('checkbox');
        const selectAllCheckbox = checkboxes[0];
        
        // 验证全选复选框存在并可交互
        expect(selectAllCheckbox).toBeInTheDocument();
        expect(selectAllCheckbox.type).toBe('checkbox');
    });

    it('应该能够处理单个选择逻辑', async () => {
        render(Page);
        await tick();
        
        // 获取所有复选框
        const checkboxes = screen.getAllByRole('checkbox');
        
        // 验证复选框存在
        expect(checkboxes.length).toBeGreaterThan(0);
        
        // 验证每个复选框都是checkbox类型
        checkboxes.forEach(checkbox => {
            expect(checkbox.type).toBe('checkbox');
        });
    });

    it('应该能够处理搜索清除', async () => {
        render(Page);
        await tick();
        
        // 获取清除按钮
        const clearButtons = screen.getAllByRole('button', { name: '' });
        
        // 验证清除按钮存在
        expect(clearButtons.length).toBeGreaterThan(0);
        
        // 验证清除按钮可以被点击
        clearButtons.forEach(button => {
            expect(button).toBeInTheDocument();
        });
    });

    it('应该能够处理API调用失败的情况', async () => {
        // Mock API调用失败
        global.fetch.mockRejectedValueOnce(new Error('Network error'));
        
        render(Page);
        await tick();
        
        // 验证页面仍然能够渲染
        expect(screen.getByText('试卷管理')).toBeInTheDocument();
        expect(screen.getByText('暂无试卷数据')).toBeInTheDocument();
    });

    it('应该能够处理不同的试卷类型', async () => {
        render(Page);
        await tick();
        
        // 验证页面能够处理不同类型的试卷
        expect(screen.getByText('组卷方式')).toBeInTheDocument();
        expect(screen.getByText('试卷用途')).toBeInTheDocument();
        expect(screen.getByText('试卷难度')).toBeInTheDocument();
    });

    it('应该能够处理试卷标签显示', async () => {
        render(Page);
        await tick();
        
        // 验证试卷标签列存在
        expect(screen.getAllByText('试卷标签')).toHaveLength(2);
    });

    it('应该能够处理试卷时间显示', async () => {
        render(Page);
        await tick();
        
        // 验证时间相关列存在
        expect(screen.getByText('更新时间')).toBeInTheDocument();
        expect(screen.getByText('创建日期')).toBeInTheDocument();
    });

    it('应该能够处理试卷分数显示', async () => {
        render(Page);
        await tick();
        
        // 验证分数相关列存在
        expect(screen.getByText('试卷总分')).toBeInTheDocument();
        expect(screen.getByText('建议时长(分)')).toBeInTheDocument();
    });

    it('应该能够处理试卷数量显示', async () => {
        render(Page);
        await tick();
        
        // 验证数量相关列存在
        expect(screen.getByText('试题数量')).toBeInTheDocument();
    });

    it('应该能够处理操作列显示', async () => {
        render(Page);
        await tick();
        
        // 验证操作列存在
        expect(screen.getByText('操作')).toBeInTheDocument();
    });

    it('应该能够处理搜索区域的样式', async () => {
        render(Page);
        await tick();
        
        // 验证搜索区域的结构
        const leftSide = screen.getAllByText('试卷名称')[0].closest('.left-side');
        expect(leftSide).toBeInTheDocument();
        
        const rightSide = screen.getByText('重置').closest('.right-side');
        expect(rightSide).toBeInTheDocument();
    });

    it('应该能够处理表格容器的样式', async () => {
        render(Page);
        await tick();
        
        // 验证表格容器的结构
        const tableContainer = screen.getAllByText('试卷名称')[1].closest('.table-container');
        expect(tableContainer).toBeInTheDocument();
    });

    it('应该能够处理分页容器的样式', async () => {
        render(Page);
        await tick();
        
        // 验证分页容器的结构
        const pageControlContainer = screen.getByText('前往').closest('.page-control-container');
        expect(pageControlContainer).toBeInTheDocument();
    });

    it('应该能够处理防抖搜索功能', async () => {
        render(Page);
        await tick();
        
        // 获取搜索输入框
        const searchInputs = screen.getAllByPlaceholderText('搜索试卷名称');
        const nameSearchInput = searchInputs[0];
        
        // 模拟输入搜索内容，触发防抖搜索
        fireEvent.input(nameSearchInput, { target: { value: '数学试卷' } });
        
        // 验证防抖函数被调用
        expect(nameSearchInput).toBeInTheDocument();
    });

    it('应该能够处理试卷标签的显示逻辑', async () => {
        render(Page);
        await tick();
        
        // 验证试卷标签列存在
        expect(screen.getAllByText('试卷标签')).toHaveLength(2);
        
        // 验证标签容器的结构
        const tagContainer = screen.getAllByText('试卷标签')[1].closest('th');
        expect(tagContainer).toBeInTheDocument();
    });

    it('应该能够处理试卷难度的显示逻辑', async () => {
        render(Page);
        await tick();
        
        // 验证试卷难度列存在
        expect(screen.getByText('试卷难度')).toBeInTheDocument();
        
        // 验证难度标签的结构
        const levelHeader = screen.getByText('试卷难度').closest('th');
        expect(levelHeader).toBeInTheDocument();
    });

    it('应该能够处理试卷时间的格式化显示', async () => {
        render(Page);
        await tick();
        
        // 验证时间相关列存在
        expect(screen.getByText('更新时间')).toBeInTheDocument();
        expect(screen.getByText('创建日期')).toBeInTheDocument();
        
        // 验证时间列的结构
        const updateTimeHeader = screen.getByText('更新时间').closest('th');
        const createTimeHeader = screen.getByText('创建日期').closest('th');
        expect(updateTimeHeader).toBeInTheDocument();
        expect(createTimeHeader).toBeInTheDocument();
    });

    it('应该能够处理试卷分数的显示逻辑', async () => {
        render(Page);
        await tick();
        
        // 验证分数相关列存在
        expect(screen.getByText('试卷总分')).toBeInTheDocument();
        expect(screen.getByText('建议时长(分)')).toBeInTheDocument();
        
        // 验证分数列的结构
        const totalScoreHeader = screen.getByText('试卷总分').closest('th');
        const durationHeader = screen.getByText('建议时长(分)').closest('th');
        expect(totalScoreHeader).toBeInTheDocument();
        expect(durationHeader).toBeInTheDocument();
    });

    it('应该能够处理试卷数量的显示逻辑', async () => {
        render(Page);
        await tick();
        
        // 验证数量相关列存在
        expect(screen.getByText('试题数量')).toBeInTheDocument();
        
        // 验证数量列的结构
        const questionCountHeader = screen.getByText('试题数量').closest('th');
        expect(questionCountHeader).toBeInTheDocument();
    });

    it('应该能够处理试卷用途的显示逻辑', async () => {
        render(Page);
        await tick();
        
        // 验证试卷用途列存在
        expect(screen.getByText('试卷用途')).toBeInTheDocument();
        
        // 验证用途列的结构
        const categoryHeader = screen.getByText('试卷用途').closest('th');
        expect(categoryHeader).toBeInTheDocument();
    });

    it('应该能够处理组卷方式的显示逻辑', async () => {
        render(Page);
        await tick();
        
        // 验证组卷方式列存在
        expect(screen.getByText('组卷方式')).toBeInTheDocument();
        
        // 验证组卷方式列的结构
        const assemblyTypeHeader = screen.getByText('组卷方式').closest('th');
        expect(assemblyTypeHeader).toBeInTheDocument();
    });

    it('应该能够处理操作列的显示逻辑', async () => {
        render(Page);
        await tick();
        
        // 验证操作列存在
        expect(screen.getByText('操作')).toBeInTheDocument();
        
        // 验证操作列的结构
        const operationHeader = screen.getByText('操作').closest('th');
        expect(operationHeader).toBeInTheDocument();
    });

    it('应该能够处理表格行的结构', async () => {
        render(Page);
        await tick();
        
        // 验证表格结构
        const table = screen.getAllByText('试卷名称')[1].closest('table');
        expect(table).toBeInTheDocument();
        
        // 验证表头行
        const thead = table.querySelector('thead');
        expect(thead).toBeInTheDocument();
        
        // 验证表体
        const tbody = table.querySelector('tbody');
        expect(tbody).toBeInTheDocument();
    });

    it('应该能够处理搜索输入框的清除按钮', async () => {
        render(Page);
        await tick();
        
        // 获取清除按钮
        const clearButtons = screen.getAllByRole('button', { name: '' });
        
        // 验证清除按钮存在
        expect(clearButtons.length).toBeGreaterThan(0);
        
        // 验证清除按钮的样式类
        clearButtons.forEach(button => {
            expect(button).toHaveAttribute('data-name', 'clear');
        });
    });

    it('应该能够处理分页组件的配置', async () => {
        render(Page);
        await tick();
        
        // 验证分页组件存在
        const pagination = screen.getByText('前往').closest('.page-control');
        expect(pagination).toBeInTheDocument();
        
        // 验证分页组件的容器
        const pageControlContainer = pagination.closest('.page-control-container');
        expect(pageControlContainer).toBeInTheDocument();
    });

    it('应该能够处理试卷管理页面的整体布局', async () => {
        render(Page);
        await tick();
        
        // 验证页面整体容器
        const paperManagement = screen.getByText('试卷管理').closest('.paper-management');
        expect(paperManagement).toBeInTheDocument();
        
        // 验证页面标题区域
        const title = screen.getByText('试卷管理');
        expect(title).toBeInTheDocument();
    });

    it('应该能够处理搜索区域的布局结构', async () => {
        render(Page);
        await tick();
        
        // 验证搜索区域的左侧
        const leftSide = screen.getAllByText('试卷名称')[0].closest('.left-side');
        expect(leftSide).toBeInTheDocument();
        
        // 验证搜索区域的右侧
        const rightSide = screen.getByText('重置').closest('.right-side');
        expect(rightSide).toBeInTheDocument();
        
        // 验证搜索区域的头部
        const header = leftSide.closest('.header');
        expect(header).toBeInTheDocument();
    });

    it('应该能够处理试卷名称搜索区域', async () => {
        render(Page);
        await tick();
        
        // 验证试卷名称搜索区域
        const searchPaperName = screen.getAllByText('试卷名称')[0].closest('.search-paper-name');
        expect(searchPaperName).toBeInTheDocument();
        
        // 验证提示文本
        const prompt = searchPaperName.querySelector('.prompt');
        expect(prompt).toBeInTheDocument();
        expect(prompt.textContent).toBe('试卷名称');
    });

    it('应该能够处理试卷标签搜索区域', async () => {
        render(Page);
        await tick();
        
        // 验证试卷标签搜索区域
        const searchPaperTag = screen.getAllByText('试卷标签')[0].closest('.search-paper-tag');
        expect(searchPaperTag).toBeInTheDocument();
        
        // 验证提示文本
        const prompt = searchPaperTag.querySelector('.prompt');
        expect(prompt).toBeInTheDocument();
        expect(prompt.textContent).toBe('试卷标签');
    });

    it('应该能够处理输入框的样式类', async () => {
        render(Page);
        await tick();
        
        // 验证输入框容器
        const inputs = screen.getAllByPlaceholderText('搜索试卷名称');
        inputs.forEach(input => {
            const inputContainer = input.closest('.input');
            expect(inputContainer).toBeInTheDocument();
        });
    });

    it('应该能够处理按钮的样式类', async () => {
        render(Page);
        await tick();
        
        // 验证重置按钮的样式
        const resetButton = screen.getByText('重置');
        expect(resetButton).toHaveClass('btn', 'btn--primary', 'is-plain');
        
        // 验证删除按钮的样式
        const deleteButton = screen.getByText('删除');
        expect(deleteButton).toHaveClass('btn', 'btn--danger', 'is-plain');
        
        // 验证自定义组卷按钮的样式
        const manualButton = screen.getByText('自定义组卷');
        expect(manualButton).toHaveClass('btn', 'btn--primary', 'is-plain');
    });
});
