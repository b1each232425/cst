import { render, screen, fireEvent } from '@testing-library/svelte';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import PracticeFilterPanel from '../PracticeFilterPanel.svelte';

// 模拟全局组件
vi.mock('$lib/components/Input/InputBox.svelte', () => ({
    default: vi.fn().mockImplementation(() => ({
        Component: {}
    }))
}));

// 模拟错误处理工具
vi.mock('../../_utils/errorHandler.js', () => ({
    handleFeatureNotImplemented: vi.fn()
}));

describe('练习筛选面板', () => {
    let mockStore;

    beforeEach(() => {
        vi.clearAllMocks();

        // 创建模拟 store - 基于最新的数据结构
        mockStore = {
            state: {
                filters: {
                    name: '',
                    practiceID: ''
                },
                selected: {},
                practices: [],
                totalRecords: 0,
                loading: false,
                selectAll: false,
                pagination: {
                    page: 1,
                    pageSize: 10
                }
            },
            setFilters: vi.fn(),
            exportGrades: vi.fn(),
            fetchPractices: vi.fn(),
            setPage: vi.fn(),
            setPageSize: vi.fn(),
            toggleSelect: vi.fn(),
            toggleSelectAll: vi.fn()
        };
    });

    it('应该渲染所有筛选元素', () => {
        const { container } = render(PracticeFilterPanel, { props: { store: mockStore } });

        // 检查顶部操作栏
        expect(container.querySelector('.top-action-bar')).toBeInTheDocument();

        // 检查筛选容器
        expect(container.querySelector('.filters')).toBeInTheDocument();

        // 检查搜索包装器
        expect(container.querySelector('.search-wrapper')).toBeInTheDocument();

        // 检查操作按钮容器
        expect(container.querySelector('.actions')).toBeInTheDocument();
    });

    it('应该渲染隐藏的导出按钮', () => {
        render(PracticeFilterPanel, { props: { store: mockStore } });
        
        // 检查隐藏的导出按钮存在但不可见
        const exportButton = screen.getByText('批量导出');
        expect(exportButton).toBeInTheDocument();
        
        // 验证隐藏按钮的样式
        expect(exportButton).toHaveStyle('display: none');
    });

    it('应该显示选中项目数量', () => {
        // 设置有选中项目的状态
        mockStore.state.selected = { 1: true, 2: true };
        
        render(PracticeFilterPanel, { props: { store: mockStore } });
        
        // 检查选中信息显示
        expect(screen.getByText('当前已选中')).toBeInTheDocument();
        expect(screen.getByText('2')).toBeInTheDocument();
        expect(screen.getByText('项')).toBeInTheDocument();
    });

    it('应该有正确的CSS类名用于样式设置', () => {
        const { container } = render(PracticeFilterPanel, { props: { store: mockStore } });
        
        // 检查主容器类名
        expect(container.querySelector('.top-action-bar')).toBeInTheDocument();
        
        // 检查筛选容器
        expect(container.querySelector('.filters')).toBeInTheDocument();
        
        // 检查操作容器
        expect(container.querySelector('.actions')).toBeInTheDocument();
        
        // 检查选择信息容器
        expect(container.querySelector('.selection-info')).toBeInTheDocument();
    });

    it('当没有选中项目时导出按钮应该被禁用', () => {
        // 确保没有选中项目
        mockStore.state.selected = {};
        
        render(PracticeFilterPanel, { props: { store: mockStore } });
        
        const exportButton = screen.getByText('批量导出');
        expect(exportButton).toBeDisabled();
    });

    it('当有选中项目时导出按钮应该可用', () => {
        // 设置有选中项目的状态
        mockStore.state.selected = { 1: true };
        
        render(PracticeFilterPanel, { props: { store: mockStore } });
        
        const exportButton = screen.getByText('批量导出');
        expect(exportButton).not.toBeDisabled();
    });

    it('应该正确处理多个选中项目', () => {
        // 设置多个选中项目
        mockStore.state.selected = { 1: true, 3: true, 5: true };
        
        render(PracticeFilterPanel, { props: { store: mockStore } });
        
        // 检查选中数量显示
        expect(screen.getByText('3')).toBeInTheDocument();
        
        // 检查按钮状态
        const exportButton = screen.getByText('批量导出');
        expect(exportButton).not.toBeDisabled();
    });

    it('应该正确处理空的选中状态', () => {
        // 设置空的选中状态
        mockStore.state.selected = {};
        
        render(PracticeFilterPanel, { props: { store: mockStore } });
        
        // 检查选中数量显示为0
        expect(screen.getByText('0')).toBeInTheDocument();
    });

    it('应该正确显示搜索输入框', () => {
        const { container } = render(PracticeFilterPanel, { props: { store: mockStore } });
        
        // 由于InputBox被mock，仅测试组件渲染是否正常
        expect(container.querySelector('.search-wrapper')).toBeInTheDocument();
    });

    it('应该使用正确的初始筛选值渲染', () => {
        mockStore.state.filters = {
            name: 'test practice',
            practiceID: '123'
        };
        
        const { container } = render(PracticeFilterPanel, { props: { store: mockStore } });
        
        // 组件应该正常渲染而不出错
        expect(container.querySelector('.top-action-bar')).toBeInTheDocument();
    });

    it('应该正确显示按钮的禁用状态样式', () => {
        // 测试没有选中项目时的状态
        mockStore.state.selected = {};
        
        const { container } = render(PracticeFilterPanel, { props: { store: mockStore } });
        
        const exportButton = screen.getByText('批量导出');
        expect(exportButton).toBeDisabled();
        expect(exportButton).toHaveClass('action-btn', 'export');
    });

    it('应该在点击导出按钮时调用功能未实现处理', async () => {
        const { handleFeatureNotImplemented } = await import('../../_utils/errorHandler.js');
        
        // 设置有选中项目的状态
        mockStore.state.selected = { 1: true };
        
        render(PracticeFilterPanel, { props: { store: mockStore } });
        
        const exportButton = screen.getByText('批量导出');
        await fireEvent.click(exportButton);
        
        expect(handleFeatureNotImplemented).toHaveBeenCalledWith('批量导出');
    });
});
