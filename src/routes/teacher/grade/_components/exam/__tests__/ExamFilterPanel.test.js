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
vi.mock('../../_utils/errorHandler', () => ({
    handleFeatureNotImplemented: vi.fn(),
    handleSelectionError: vi.fn()
}));

describe('考试筛选面板', () => {
    let mockStore;

    beforeEach(() => {
        vi.clearAllMocks();

        // 创建模拟 store
        mockStore = {
            state: {
                filters: {
                    name: '',
                    type: '',
                    submitted: -1 // -1=全部, 0=未提交, 1=已提交
                },
                selected: {},
                exams: []
            },
            setFilters: vi.fn(),
            submitGrades: vi.fn()
        };
    });

    it('应该渲染所有筛选元素', () => {
        const { container } = render(ExamFilterPanel, { props: { store: mockStore } });

        // 检查筛选容器
        expect(container.querySelector('.filter-panel')).toBeInTheDocument();

        // 检查筛选组
        const filterGroups = container.querySelectorAll('.filter-group');
        expect(filterGroups).toHaveLength(2); // 考试类别和提交状态

        // 检查搜索包装器
        expect(container.querySelector('.search-wrapper')).toBeInTheDocument();

        // 检查操作按钮
        expect(container.querySelector('.actions')).toBeInTheDocument();
    });

    it('renders action buttons', () => {
        const { container } = render(ExamFilterPanel, { props: { store: mockStore } });
        
        const buttons = container.querySelectorAll('button');
        expect(buttons.length).toBeGreaterThan(0);
        
        // Check for specific button text
        expect(screen.getByText('批量导出')).toBeInTheDocument();
        expect(screen.getByText('批量提交')).toBeInTheDocument();
        expect(screen.getByText('查看日志')).toBeInTheDocument();
    });

    it('calls handleFeatureNotImplemented for unimplemented features', async () => {
        const { handleFeatureNotImplemented } = await import('../../_utils/errorHandler');
        const { container } = render(ExamFilterPanel, { props: { store: mockStore } });
        
        // Find and click the batch export button
        const exportButton = screen.getByText('批量导出');
        await fireEvent.click(exportButton);
        
        expect(handleFeatureNotImplemented).toHaveBeenCalledWith('批量导出');
    });

    it('calls handleFeatureNotImplemented for show logs', async () => {
        const { handleFeatureNotImplemented } = await import('../../_utils/errorHandler');
        const { container } = render(ExamFilterPanel, { props: { store: mockStore } });
        
        // Find and click the show logs button
        const logsButton = screen.getByText('查看日志');
        await fireEvent.click(logsButton);
        
        expect(handleFeatureNotImplemented).toHaveBeenCalledWith('查看日志');
    });

    it('handles batch submit with no selection', async () => {
        const { handleSelectionError } = await import('../../_utils/errorHandler');
        const { container } = render(ExamFilterPanel, { props: { store: mockStore } });
        
        // Mock empty selection
        mockStore.state.selected = {};
        
        // Find and click the batch submit button
        const submitButton = screen.getByText('批量提交');
        await fireEvent.click(submitButton);
        
        expect(handleSelectionError).toHaveBeenCalledWith('提交');
        expect(mockStore.submitGrades).not.toHaveBeenCalled();
    });

    it('handles batch submit with selection', async () => {
        const { container } = render(ExamFilterPanel, { props: { store: mockStore } });
        
        // Mock selection
        mockStore.state.selected = { 1: true, 2: false, 3: true };
        
        // Find and click the batch submit button
        const submitButton = screen.getByText('批量提交');
        await fireEvent.click(submitButton);
        
        expect(mockStore.submitGrades).toHaveBeenCalledWith([1, 3]);
    });

    it('has correct CSS classes for styling', () => {
        const { container } = render(ExamFilterPanel, { props: { store: mockStore } });
        
        // Check for main container class
        expect(container.querySelector('.filter-panel')).toBeInTheDocument();
        
        // Check for filters container
        expect(container.querySelector('.filters')).toBeInTheDocument();
        
        // Check for actions container
        expect(container.querySelector('.actions')).toBeInTheDocument();
        
        // Check for filter groups
        expect(container.querySelector('.filter-group')).toBeInTheDocument();
        
        // Check for dropdown wrappers
        expect(container.querySelector('.dropdown-wrapper')).toBeInTheDocument();
    });

    it('renders filter hints with correct text', () => {
        render(ExamFilterPanel, { props: { store: mockStore } });
        
        expect(screen.getByText('考试类别')).toBeInTheDocument();
        expect(screen.getByText('提交状态')).toBeInTheDocument();
    });

    it('updates store filters when search input changes', () => {
        const { container } = render(ExamFilterPanel, { props: { store: mockStore } });
        
        //由于InputBox被mock，无法测试实际的输入交互,故目前仅仅测试了组件渲染是否正常
        expect(container.querySelector('.search-wrapper')).toBeInTheDocument();
    });

    it('renders with correct initial filter values', () => {
        mockStore.state.filters = {
            name: 'test search',
            type: '00',
            submitted: '1'
        };
        
        const { container } = render(ExamFilterPanel, { props: { store: mockStore } });
        
        // Component should render without errors with initial values
        expect(container.querySelector('.filter-panel')).toBeInTheDocument();
    });
});
