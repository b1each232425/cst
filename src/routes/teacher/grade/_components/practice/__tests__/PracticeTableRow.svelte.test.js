import { render, screen, fireEvent } from '@testing-library/svelte';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import PracticeTableRow from '../PracticeTableRow.svelte';

// 模拟错误处理工具
vi.mock('../../_utils/errorHandler.js', () => ({
    handleFeatureNotImplemented: vi.fn()
}));

describe('练习表格行组件', () => {
    let mockStore;
    let mockPractice;

    beforeEach(() => {
        vi.clearAllMocks();

        mockStore = {
            state: {
                selected: {}
            },
            toggleSelect: vi.fn()
        };

        mockPractice = {
            id: 1,
            name: '数学练习题',
            total_score: 100,
            average_score: 85.5,
            completed_students: 25,
            passed_students: 20
        };
    });

    it('应该渲染练习基本信息', () => {
        render(PracticeTableRow, { props: { practice: mockPractice, store: mockStore } });

        expect(screen.getByText('数学练习题')).toBeInTheDocument();
        expect(screen.getByText('100')).toBeInTheDocument();
        expect(screen.getByText('85.5')).toBeInTheDocument();
        expect(screen.getByText('25')).toBeInTheDocument();
        expect(screen.getByText('20')).toBeInTheDocument();
    });

    it('应该处理空值或null值', () => {
        const practiceWithNulls = {
            id: 1,
            name: null,
            total_score: null,
            average_score: null,
            completed_students: null,
            passed_students: null
        };

        render(PracticeTableRow, { props: { practice: practiceWithNulls, store: mockStore } });

        // 应该显示 '-' 作为空值的占位符
        const dashElements = screen.getAllByText('-');
        expect(dashElements).toHaveLength(5); // name, total_score, average_score, completed_students, passed_students
    });

    it('应该处理undefined值', () => {
        const practiceWithUndefined = {
            id: 1
            // 其他字段都是undefined
        };

        render(PracticeTableRow, { props: { practice: practiceWithUndefined, store: mockStore } });

        // 应该显示 '-' 作为undefined值的占位符
        const dashElements = screen.getAllByText('-');
        expect(dashElements).toHaveLength(5);
    });

    it('应该渲染选择框', () => {
        const { container } = render(PracticeTableRow, { props: { practice: mockPractice, store: mockStore } });

        const selectButton = container.querySelector('.square-container');
        expect(selectButton).toBeInTheDocument();
    });

    it('当练习未被选中时选择框应该是未选中状态', () => {
        mockStore.state.selected = {};
        const { container } = render(PracticeTableRow, { props: { practice: mockPractice, store: mockStore } });

        const selectButton = container.querySelector('.square-container');
        expect(selectButton).not.toHaveClass('checked');
        expect(container.querySelector('.check-square')).not.toBeInTheDocument();
    });

    it('当练习被选中时选择框应该是选中状态', () => {
        mockStore.state.selected = { 1: true };
        const { container } = render(PracticeTableRow, { props: { practice: mockPractice, store: mockStore } });

        const selectButton = container.querySelector('.square-container');
        expect(selectButton).toHaveClass('checked');
        expect(container.querySelector('.check-square')).toBeInTheDocument();
    });

    it('点击选择框应该调用toggleSelect', async () => {
        const { container } = render(PracticeTableRow, { props: { practice: mockPractice, store: mockStore } });

        const selectButton = container.querySelector('.square-container');
        await fireEvent.click(selectButton);

        expect(mockStore.toggleSelect).toHaveBeenCalledWith(1);
    });

    it('应该渲染隐藏的详情按钮', () => {
        render(PracticeTableRow, { props: { practice: mockPractice, store: mockStore } });

        const detailButton = screen.getByText('详情');
        expect(detailButton).toBeInTheDocument();
        expect(detailButton).toHaveStyle('display: none');
    });

    it('点击详情按钮应该调用功能未实现处理', async () => {
        const { handleFeatureNotImplemented } = await import('../../_utils/errorHandler.js');
        
        render(PracticeTableRow, { props: { practice: mockPractice, store: mockStore } });

        const detailButton = screen.getByText('详情');
        await fireEvent.click(detailButton);

        expect(handleFeatureNotImplemented).toHaveBeenCalledWith('查看详细');
    });

    it('应该有正确的CSS类名', () => {
        const { container } = render(PracticeTableRow, { props: { practice: mockPractice, store: mockStore } });

        expect(container.querySelector('.practice-list-row')).toBeInTheDocument();
        expect(container.querySelector('.practice-select')).toBeInTheDocument();
        expect(container.querySelector('.practice-name')).toBeInTheDocument();
        expect(container.querySelector('.practice-total-score')).toBeInTheDocument();
        expect(container.querySelector('.practice-avg-score')).toBeInTheDocument();
        expect(container.querySelector('.practice-completed')).toBeInTheDocument();
        expect(container.querySelector('.practice-passed')).toBeInTheDocument();
        expect(container.querySelector('.practice-operation')).toBeInTheDocument();
    });

    it('表格行应该是tr元素', () => {
        const { container } = render(PracticeTableRow, { props: { practice: mockPractice, store: mockStore } });

        const row = container.querySelector('.practice-list-row');
        expect(row.tagName.toLowerCase()).toBe('tr');
    });

    it('所有列都应该是td元素', () => {
        const { container } = render(PracticeTableRow, { props: { practice: mockPractice, store: mockStore } });

        const tdElements = container.querySelectorAll('td');
        expect(tdElements).toHaveLength(7); // 包括选择列在内的所有列
    });

    it('选择框按钮应该是button元素', () => {
        const { container } = render(PracticeTableRow, { props: { practice: mockPractice, store: mockStore } });

        const selectButton = container.querySelector('.square-container');
        expect(selectButton.tagName.toLowerCase()).toBe('button');
    });

    it('详情按钮应该是button元素', () => {
        const { container } = render(PracticeTableRow, { props: { practice: mockPractice, store: mockStore } });

        const detailButton = container.querySelector('.detail-btn');
        expect(detailButton.tagName.toLowerCase()).toBe('button');
    });

    it('应该正确处理选中状态的切换', () => {
        const { container, rerender } = render(PracticeTableRow, { props: { practice: mockPractice, store: mockStore } });

        let selectButton = container.querySelector('.square-container');
        expect(selectButton).not.toHaveClass('checked');

        // 切换到选中状态
        mockStore.state.selected = { 1: true };
        rerender({ practice: mockPractice, store: mockStore });
        
        selectButton = container.querySelector('.square-container');
        expect(selectButton).toHaveClass('checked');
        expect(container.querySelector('.check-square')).toBeInTheDocument();
    });

    it('选择框的check-square应该有正确的样式类', () => {
        mockStore.state.selected = { 1: true };
        const { container } = render(PracticeTableRow, { props: { practice: mockPractice, store: mockStore } });

        const checkSquare = container.querySelector('.check-square');
        expect(checkSquare).toBeInTheDocument();
        expect(checkSquare).toHaveClass('check-square');
    });

    it('应该正确处理数字类型的分数和人数', () => {
        const practiceWithNumbers = {
            id: 1,
            name: '测试练习',
            total_score: 100.5,
            average_score: 85.75,
            completed_students: 30,
            passed_students: 25
        };

        render(PracticeTableRow, { props: { practice: practiceWithNumbers, store: mockStore } });

        expect(screen.getByText('100.5')).toBeInTheDocument();
        expect(screen.getByText('85.75')).toBeInTheDocument();
        expect(screen.getByText('30')).toBeInTheDocument();
        expect(screen.getByText('25')).toBeInTheDocument();
    });

    it('应该正确处理不同ID的练习', async () => {
        const practice2 = { ...mockPractice, id: 2 };
        const { container } = render(PracticeTableRow, { props: { practice: practice2, store: mockStore } });

        const selectButton = container.querySelector('.square-container');
        await fireEvent.click(selectButton);

        expect(mockStore.toggleSelect).toHaveBeenCalledWith(2);
    });
});
