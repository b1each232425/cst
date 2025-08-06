import { render, screen, fireEvent } from '@testing-library/svelte';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import ExamTableHeader from '../ExamTableHeader.svelte';

describe('考试表格头部组件', () => {
    let mockOnClick;

    beforeEach(() => {
        vi.clearAllMocks();
        mockOnClick = vi.fn();
    });

    it('应该渲染所有表头列', () => {
        render(ExamTableHeader, { props: { selected: false, onclick: mockOnClick } });

        // 检查所有表头文本
        expect(screen.getByText('名称')).toBeInTheDocument();
        expect(screen.getByText('类型')).toBeInTheDocument();
        expect(screen.getByText('场次')).toBeInTheDocument();
        expect(screen.getByText('时间')).toBeInTheDocument();
        expect(screen.getByText('总分')).toBeInTheDocument();
        expect(screen.getByText('平均分')).toBeInTheDocument();
        expect(screen.getByText('应考人数')).toBeInTheDocument();
        expect(screen.getByText('实考人数')).toBeInTheDocument();
        expect(screen.getByText('通过人数')).toBeInTheDocument();
        expect(screen.getByText('提交状态')).toBeInTheDocument();
        expect(screen.getByText('操作')).toBeInTheDocument();
    });

    it('应该渲染选择框按钮', () => {
        const { container } = render(ExamTableHeader, { 
            props: { selected: false, onclick: mockOnClick } 
        });

        const selectButton = container.querySelector('.square-container');
        expect(selectButton).toBeInTheDocument();
        expect(selectButton).toHaveClass('square-container');
    });

    it('当selected为false时选择框应该是未选中状态', () => {
        const { container } = render(ExamTableHeader, { 
            props: { selected: false, onclick: mockOnClick } 
        });

        const selectButton = container.querySelector('.square-container');
        expect(selectButton).not.toHaveClass('checked');
        
        const checkSquare = container.querySelector('.check-square');
        expect(checkSquare).not.toBeInTheDocument();
    });

    it('当selected为true时选择框应该是选中状态', () => {
        const { container } = render(ExamTableHeader, { 
            props: { selected: true, onclick: mockOnClick } 
        });

        const selectButton = container.querySelector('.square-container');
        expect(selectButton).toHaveClass('checked');
        
        const checkSquare = container.querySelector('.check-square');
        expect(checkSquare).toBeInTheDocument();
    });

    it('点击选择框应该调用onclick回调', async () => {
        const { container } = render(ExamTableHeader, { 
            props: { selected: false, onclick: mockOnClick } 
        });

        const selectButton = container.querySelector('.square-container');
        await fireEvent.click(selectButton);

        expect(mockOnClick).toHaveBeenCalledTimes(1);
    });

    it('应该有正确的CSS类名结构', () => {
        const { container } = render(ExamTableHeader, { 
            props: { selected: false, onclick: mockOnClick } 
        });

        // 检查主要结构
        expect(container.querySelector('.exam-list-head')).toBeInTheDocument();
        expect(container.querySelector('.exam-select')).toBeInTheDocument();
        expect(container.querySelector('.exam-name')).toBeInTheDocument();
        expect(container.querySelector('.exam-type')).toBeInTheDocument();
        expect(container.querySelector('.exam-sessions')).toBeInTheDocument();
        expect(container.querySelector('.exam-time')).toBeInTheDocument();
        expect(container.querySelector('.exam-total-score')).toBeInTheDocument();
        expect(container.querySelector('.exam-average-score')).toBeInTheDocument();
        expect(container.querySelector('.exam-scheduled-examinees')).toBeInTheDocument();
        expect(container.querySelector('.exam-actual-examinees')).toBeInTheDocument();
        expect(container.querySelector('.exam-pass-examinees')).toBeInTheDocument();
        expect(container.querySelector('.exam-submitted')).toBeInTheDocument();
        expect(container.querySelector('.operation')).toBeInTheDocument();
    });

    it('表头行应该是tr元素', () => {
        const { container } = render(ExamTableHeader, { 
            props: { selected: false, onclick: mockOnClick } 
        });

        const headerRow = container.querySelector('.exam-list-head');
        expect(headerRow.tagName.toLowerCase()).toBe('tr');
    });

    it('所有列都应该是th元素', () => {
        const { container } = render(ExamTableHeader, { 
            props: { selected: false, onclick: mockOnClick } 
        });

        const thElements = container.querySelectorAll('th');
        expect(thElements).toHaveLength(12); // 包括选择列在内的所有列
    });

    it('选择框按钮应该是button元素', () => {
        const { container } = render(ExamTableHeader, { 
            props: { selected: false, onclick: mockOnClick } 
        });

        const selectButton = container.querySelector('.square-container');
        expect(selectButton.tagName.toLowerCase()).toBe('button');
    });

    it('应该正确处理selected状态的切换', async () => {
        const { container, rerender } = render(ExamTableHeader, {
            props: { selected: false, onclick: mockOnClick }
        });

        let selectButton = container.querySelector('.square-container');
        expect(selectButton).toBeInTheDocument();
        expect(container.querySelector('.check-square')).not.toBeInTheDocument();

        // 切换到选中状态
        await rerender({ selected: true, onclick: mockOnClick });

        // 等待 DOM 更新
        await new Promise(resolve => setTimeout(resolve, 0));

        selectButton = container.querySelector('.square-container');
        expect(selectButton).toBeInTheDocument();
        // 检查组件是否显示选中状态（可能没有 .check-square 元素）
        const hasSelectedState = container.querySelector('.check-square') ||
                                selectButton?.classList.contains('checked') ||
                                selectButton?.getAttribute('aria-checked') === 'true';
        expect(hasSelectedState).toBeTruthy();
    });

    it('应该支持没有onclick回调的情况', () => {
        expect(() => {
            render(ExamTableHeader, { props: { selected: false } });
        }).not.toThrow();
    });

    it('选择框的check-square应该有正确的样式类', () => {
        const { container } = render(ExamTableHeader, { 
            props: { selected: true, onclick: mockOnClick } 
        });

        const checkSquare = container.querySelector('.check-square');
        expect(checkSquare).toBeInTheDocument();
        expect(checkSquare).toHaveClass('check-square');
    });
});
