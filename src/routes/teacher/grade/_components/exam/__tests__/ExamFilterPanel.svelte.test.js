import { render, screen, fireEvent } from '@testing-library/svelte';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import ExamFilterPanel from '../ExamFilterPanel.svelte';

// 模拟全局组件
vi.mock('$lib/components/Select/Select.svelte', () => ({
    default: vi.fn().mockImplementation(() => ({
        Component: {}
    }))
}));

vi.mock('$lib/components/Select/Option.svelte', () => ({
    default: vi.fn().mockImplementation(() => ({
        Component: {}
    }))
}));

vi.mock('$lib/components/Input/InputBox.svelte', () => ({
    default: vi.fn().mockImplementation(() => ({
        Component: {}
    }))
}));

// 模拟错误处理工具
vi.mock('../../../_utils/errorHandler.js', () => ({
    handleFeatureNotImplemented: vi.fn(),
    handleSelectionError: vi.fn()
}));

describe('考试筛选面板', () => {
    let mockStore;

    beforeEach(() => {
        vi.clearAllMocks();

        // 创建模拟 store - 更新为最新的数据结构
        mockStore = {
            state: {
                filters: {
                    name: '',
                    type: '',
                    submitted: -1, // -1=全部, 0=未提交, 1=已提交
                    examID: ''
                },
                selected: {},
                exams: [],
                totalRecords: 0,
                loading: false,
                selectAll: false,
                pagination: {
                    page: 1,
                    pageSize: 10
                }
            },
            setFilters: vi.fn(),
            submitGrades: vi.fn(),
            fetchExams: vi.fn(),
            setPage: vi.fn(),
            setPageSize: vi.fn(),
            toggleSelect: vi.fn(),
            toggleSelectAll: vi.fn()
        };
    });

    it('应该渲染所有筛选元素', () => {
        const { container } = render(ExamFilterPanel, { props: { store: mockStore } });

        // 检查顶部操作栏
        expect(container.querySelector('.top-action-bar')).toBeInTheDocument();

        // 检查筛选容器
        expect(container.querySelector('.filters')).toBeInTheDocument();

        // 检查筛选组
        const filterGroups = container.querySelectorAll('.filter-group');
        expect(filterGroups).toHaveLength(2); // 考试类别和提交状态

        // 检查搜索包装器
        expect(container.querySelector('.search-wrapper')).toBeInTheDocument();

        // 检查操作按钮容器
        expect(container.querySelector('.actions')).toBeInTheDocument();
    });

    it('应该渲染可见的操作按钮', () => {
        const { container } = render(ExamFilterPanel, { props: { store: mockStore } });

        const buttons = container.querySelectorAll('button');
        expect(buttons.length).toBeGreaterThan(0);

        // 检查批量提交按钮（可见）
        expect(screen.getByText('批量提交')).toBeInTheDocument();

        // 检查隐藏的按钮存在但不可见
        const exportButton = screen.getByText('批量导出');
        const logButton = screen.getByText('查看日志');
        expect(exportButton).toBeInTheDocument();
        expect(logButton).toBeInTheDocument();

        // 验证隐藏按钮的样式
        expect(exportButton).toHaveStyle('display: none');
        expect(logButton).toHaveStyle('display: none');
    });

    it('calls handleFeatureNotImplemented for unimplemented features', async () => {
        const { handleFeatureNotImplemented } = await import('../../../_utils/errorHandler.js');
        const { container } = render(ExamFilterPanel, { props: { store: mockStore } });
        
        // Find and click the batch export button
        const exportButton = screen.getByText('批量导出');
        await fireEvent.click(exportButton);
        
        expect(handleFeatureNotImplemented).toHaveBeenCalledWith('批量导出');
    });

    it('应该显示选中项目数量', () => {
        // 设置有选中项目的状态
        mockStore.state.selected = { 1: true, 2: true };

        render(ExamFilterPanel, { props: { store: mockStore } });

        // 检查选中信息显示
        expect(screen.getByText('当前已选中')).toBeInTheDocument();
        expect(screen.getByText('2')).toBeInTheDocument();
        expect(screen.getByText('项')).toBeInTheDocument();
    });

    it('应该在没有选中项目时调用错误处理', async () => {
        const { handleSelectionError } = await import('../../../_utils/errorHandler');
        const { container } = render(ExamFilterPanel, { props: { store: mockStore } });
        
        // Mock empty selection
        mockStore.state.selected = {};
        
        // Find and click the batch submit button
        const submitButton = screen.getByText('批量提交');
        await fireEvent.click(submitButton);
        
        expect(handleSelectionError).toHaveBeenCalledWith('提交');
        expect(mockStore.submitGrades).not.toHaveBeenCalled();
    });

    it('应该在有选中项目时调用提交方法', async () => {
        // Mock selection first
        mockStore.state.selected = { 1: true, 2: false, 3: true };

        const { container, rerender } = render(ExamFilterPanel, { props: { store: mockStore } });

        // Re-render to reflect the selection state
        await rerender({ store: mockStore });

        // Find and click the batch submit button
        const submitButton = screen.getByText('批量提交');
        expect(submitButton).not.toBeDisabled();

        await fireEvent.click(submitButton);

        expect(mockStore.submitGrades).toHaveBeenCalledWith([1, 3]);
    });

    it('应该有正确的CSS类名用于样式设置', () => {
        const { container } = render(ExamFilterPanel, { props: { store: mockStore } });

        // 检查主容器类名
        expect(container.querySelector('.top-action-bar')).toBeInTheDocument();

        // 检查筛选容器
        expect(container.querySelector('.filters')).toBeInTheDocument();

        // 检查操作容器
        expect(container.querySelector('.actions')).toBeInTheDocument();

        // 检查筛选组
        expect(container.querySelector('.filter-group')).toBeInTheDocument();

        // 检查下拉框包装器
        expect(container.querySelector('.dropdown-wrapper')).toBeInTheDocument();

        // 检查选择信息容器
        expect(container.querySelector('.selection-info')).toBeInTheDocument();
    });

    it('应该渲染正确的筛选提示文本', () => {
        render(ExamFilterPanel, { props: { store: mockStore } });

        expect(screen.getByText('考试类别')).toBeInTheDocument();
        expect(screen.getByText('提交状态')).toBeInTheDocument();
    });

    it('应该正确处理批量提交功能', async () => {
        // 设置有选中项目的状态
        mockStore.state.selected = { 1: true, 2: true };

        render(ExamFilterPanel, { props: { store: mockStore } });

        const submitButton = screen.getByText('批量提交');
        expect(submitButton).not.toBeDisabled();

        await fireEvent.click(submitButton);

        // 验证调用了submitGrades方法
        expect(mockStore.submitGrades).toHaveBeenCalledWith([1, 2]);
    });

    it('当没有选中项目时批量提交按钮应该被禁用', () => {
        // 确保没有选中项目
        mockStore.state.selected = {};

        render(ExamFilterPanel, { props: { store: mockStore } });

        const submitButton = screen.getByText('批量提交');
        expect(submitButton).toBeDisabled();
    });

    it('应该在没有选中项目时调用错误处理', async () => {
        const { handleSelectionError } = await import('../../../_utils/errorHandler');

        // 确保没有选中项目
        mockStore.state.selected = {};

        render(ExamFilterPanel, { props: { store: mockStore } });

        const submitButton = screen.getByText('批量提交');
        await fireEvent.click(submitButton);

        expect(handleSelectionError).toHaveBeenCalledWith('提交');
    });

    it('应该使用正确的初始筛选值渲染', () => {
        mockStore.state.filters = {
            name: 'test search',
            type: '00',
            submitted: 1,
            examID: '123'
        };

        const { container } = render(ExamFilterPanel, { props: { store: mockStore } });

        // 组件应该正常渲染而不出错
        expect(container.querySelector('.top-action-bar')).toBeInTheDocument();
    });

    it('应该正确显示搜索输入框', () => {
        const { container } = render(ExamFilterPanel, { props: { store: mockStore } });

        // 由于InputBox被mock，仅测试组件渲染是否正常
        expect(container.querySelector('.search-wrapper')).toBeInTheDocument();
    });

    it('应该正确处理筛选器变化', () => {
        render(ExamFilterPanel, { props: { store: mockStore } });

        // 由于Select组件被mock，我们无法直接测试交互
        // 但可以验证组件正确渲染了筛选器
        expect(screen.getByText('考试类别')).toBeInTheDocument();
        expect(screen.getByText('提交状态')).toBeInTheDocument();
    });

    it('应该正确显示按钮的禁用状态样式', () => {
        // 测试没有选中项目时的状态
        mockStore.state.selected = {};

        const { container } = render(ExamFilterPanel, { props: { store: mockStore } });

        const submitButton = screen.getByText('批量提交');
        expect(submitButton).toBeDisabled();
        expect(submitButton).toHaveClass('action-btn', 'submit');
    });

    it('应该正确处理多个选中项目', () => {
        // 设置多个选中项目
        mockStore.state.selected = { 1: true, 3: true, 5: true };

        render(ExamFilterPanel, { props: { store: mockStore } });

        // 检查选中数量显示
        expect(screen.getByText('3')).toBeInTheDocument();

        // 检查按钮状态
        const submitButton = screen.getByText('批量提交');
        expect(submitButton).not.toBeDisabled();
    });

    it('应该正确处理空的选中状态', () => {
        // 设置空的选中状态
        mockStore.state.selected = {};

        render(ExamFilterPanel, { props: { store: mockStore } });

        // 检查选中数量显示为0
        expect(screen.getByText('0')).toBeInTheDocument();
    });
});
