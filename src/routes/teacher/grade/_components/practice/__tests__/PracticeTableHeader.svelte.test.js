import { render, screen, fireEvent } from '@testing-library/svelte';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import PracticeTableHeader from '../PracticeTableHeader.svelte';

describe('练习表格头部组件', () => {
    let mockStore;

    beforeEach(() => {
        vi.clearAllMocks();

        mockStore = {
            state: {
                selectAll: false
            },
            toggleSelectAll: vi.fn()
        };
    });

    it('应该渲染所有表头列', () => {
        render(PracticeTableHeader, { props: { store: mockStore } });

        // 检查所有表头文本
        expect(screen.getByText('名称')).toBeInTheDocument();
        expect(screen.getByText('总分')).toBeInTheDocument();
        expect(screen.getByText('平均分')).toBeInTheDocument();
        expect(screen.getByText('作答人数')).toBeInTheDocument();
        expect(screen.getByText('通过人数')).toBeInTheDocument();
        expect(screen.getByText('操作')).toBeInTheDocument();
    });

    it('应该渲染选择框按钮', () => {
        const { container } = render(PracticeTableHeader, { props: { store: mockStore } });

        const selectButton = container.querySelector('.square-container');
        expect(selectButton).toBeInTheDocument();
        expect(selectButton).toHaveClass('square-container');
    });

    it('当selectAll为false时选择框应该是未选中状态', () => {
        mockStore.state.selectAll = false;
        const { container } = render(PracticeTableHeader, { props: { store: mockStore } });

        const selectButton = container.querySelector('.square-container');
        expect(selectButton).not.toHaveClass('checked');
        
        const checkSquare = container.querySelector('.check-square');
        expect(checkSquare).not.toBeInTheDocument();
    });

    it('当selectAll为true时选择框应该是选中状态', () => {
        mockStore.state.selectAll = true;
        const { container } = render(PracticeTableHeader, { props: { store: mockStore } });

        const selectButton = container.querySelector('.square-container');
        expect(selectButton).toHaveClass('checked');
        
        const checkSquare = container.querySelector('.check-square');
        expect(checkSquare).toBeInTheDocument();
    });

    it('点击选择框应该调用toggleSelectAll', async () => {
        const { container } = render(PracticeTableHeader, { props: { store: mockStore } });

        const selectButton = container.querySelector('.square-container');
        await fireEvent.click(selectButton);

        expect(mockStore.toggleSelectAll).toHaveBeenCalledTimes(1);
    });

    it('应该有正确的CSS类名结构', () => {
        const { container } = render(PracticeTableHeader, { props: { store: mockStore } });

        // 检查主要结构
        expect(container.querySelector('.practice-list-head')).toBeInTheDocument();
        expect(container.querySelector('.practice-select')).toBeInTheDocument();
        expect(container.querySelector('.practice-name')).toBeInTheDocument();
        expect(container.querySelector('.practice-total-score')).toBeInTheDocument();
        expect(container.querySelector('.practice-avg-score')).toBeInTheDocument();
        expect(container.querySelector('.practice-completed')).toBeInTheDocument();
        expect(container.querySelector('.practice-passed')).toBeInTheDocument();
        expect(container.querySelector('.practice-operation')).toBeInTheDocument();
    });

    it('表头行应该是tr元素', () => {
        const { container } = render(PracticeTableHeader, { props: { store: mockStore } });

        const headerRow = container.querySelector('.practice-list-head');
        expect(headerRow.tagName.toLowerCase()).toBe('tr');
    });

    it('所有列都应该是th元素', () => {
        const { container } = render(PracticeTableHeader, { props: { store: mockStore } });

        const thElements = container.querySelectorAll('th');
        expect(thElements).toHaveLength(7); // 包括选择列在内的所有列
    });

    it('选择框按钮应该是button元素', () => {
        const { container } = render(PracticeTableHeader, { props: { store: mockStore } });

        const selectButton = container.querySelector('.square-container');
        expect(selectButton.tagName.toLowerCase()).toBe('button');
    });

    it('应该正确处理selectAll状态的切换', () => {
        const { container, rerender } = render(PracticeTableHeader, { props: { store: mockStore } });

        let selectButton = container.querySelector('.square-container');
        expect(selectButton).not.toHaveClass('checked');

        // 切换到选中状态
        mockStore.state.selectAll = true;
        rerender({ store: mockStore });
        
        selectButton = container.querySelector('.square-container');
        expect(selectButton).toHaveClass('checked');
        expect(container.querySelector('.check-square')).toBeInTheDocument();
    });

    it('选择框的check-square应该有正确的样式类', () => {
        mockStore.state.selectAll = true;
        const { container } = render(PracticeTableHeader, { props: { store: mockStore } });

        const checkSquare = container.querySelector('.check-square');
        expect(checkSquare).toBeInTheDocument();
        expect(checkSquare).toHaveClass('check-square');
    });

    it('应该正确响应store状态变化', () => {
        const { container, rerender } = render(PracticeTableHeader, { props: { store: mockStore } });

        // 初始状态
        expect(container.querySelector('.square-container')).not.toHaveClass('checked');

        // 更新store状态
        mockStore.state.selectAll = true;
        rerender({ store: mockStore });

        // 验证UI更新
        expect(container.querySelector('.square-container')).toHaveClass('checked');
        expect(container.querySelector('.check-square')).toBeInTheDocument();
    });

    it('表头列应该有正确的宽度类名', () => {
        const { container } = render(PracticeTableHeader, { props: { store: mockStore } });

        // 检查各列的CSS类名（这些类名用于设置宽度）
        expect(container.querySelector('.practice-select')).toBeInTheDocument();
        expect(container.querySelector('.practice-name')).toBeInTheDocument();
        expect(container.querySelector('.practice-total-score')).toBeInTheDocument();
        expect(container.querySelector('.practice-avg-score')).toBeInTheDocument();
        expect(container.querySelector('.practice-completed')).toBeInTheDocument();
        expect(container.querySelector('.practice-passed')).toBeInTheDocument();
        expect(container.querySelector('.practice-operation')).toBeInTheDocument();
    });

    it('应该正确处理toggleSelectAll函数调用', async () => {
        const { container } = render(PracticeTableHeader, { props: { store: mockStore } });

        const selectButton = container.querySelector('.square-container');
        
        // 多次点击测试
        await fireEvent.click(selectButton);
        await fireEvent.click(selectButton);
        
        expect(mockStore.toggleSelectAll).toHaveBeenCalledTimes(2);
    });
});
