import { render, screen, fireEvent } from '@testing-library/svelte';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import ExamTableRow from '../ExamTableRow.svelte';

// 模拟错误处理工具
vi.mock('../../_utils/errorHandler', () => ({
    handleFeatureNotImplemented: vi.fn()
}));

describe('考试表格行组件', () => {
    let mockStore;
    let mockExam;

    beforeEach(() => {
        vi.clearAllMocks();

        mockStore = {
            state: {
                selected: {}
            },
            toggleSelect: vi.fn()
        };

        mockExam = {
            id: 1,
            name: '期中考试',
            type: '00',
            submitted: false,
            sessions: [
                {
                    exam_session_id: 1,
                    paper_name: '数学试卷',
                    start_time: '2024-01-15T09:00:00Z',
                    end_time: '2024-01-15T11:00:00Z',
                    total_score: '100.0',
                    average_score: '85.5',
                    scheduled_examinees: 30,
                    actual_examinees: 28,
                    pass_examinees: 25
                }
            ]
        };
    });

    it('应该渲染考试基本信息', () => {
        render(ExamTableRow, { props: { exam: mockExam, store: mockStore } });

        expect(screen.getByText('期中考试')).toBeInTheDocument();
        expect(screen.getByText('平时考试')).toBeInTheDocument(); // type '00' 对应平时考试
    });

    it('应该正确显示考试类型', () => {
        // 测试平时考试
        render(ExamTableRow, { props: { exam: mockExam, store: mockStore } });
        expect(screen.getByText('平时考试')).toBeInTheDocument();

        // 测试资格证考试
        const certExam = { ...mockExam, type: '01' };
        const { rerender } = render(ExamTableRow, { props: { exam: certExam, store: mockStore } });
        rerender({ exam: certExam, store: mockStore });
        expect(screen.getByText('资格证考试')).toBeInTheDocument();
    });

    it('应该渲染场次信息', () => {
        render(ExamTableRow, { props: { exam: mockExam, store: mockStore } });

        expect(screen.getByText('数学试卷')).toBeInTheDocument();
    });

    it('应该渲染考试时间', () => {
        render(ExamTableRow, { props: { exam: mockExam, store: mockStore } });

        // 检查时间格式化后的显示
        const timeElements = screen.getAllByText(/2024/);
        expect(timeElements.length).toBeGreaterThan(0);
    });

    it('应该渲染分数信息', () => {
        render(ExamTableRow, { props: { exam: mockExam, store: mockStore } });

        expect(screen.getByText('100.0')).toBeInTheDocument();
        expect(screen.getByText('85.5')).toBeInTheDocument();
    });

    it('应该渲染考生人数信息', () => {
        render(ExamTableRow, { props: { exam: mockExam, store: mockStore } });

        expect(screen.getByText('30')).toBeInTheDocument(); // scheduled_examinees
        expect(screen.getByText('28')).toBeInTheDocument(); // actual_examinees
        expect(screen.getByText('25')).toBeInTheDocument(); // pass_examinees
    });

    it('应该渲染选择框', () => {
        const { container } = render(ExamTableRow, { props: { exam: mockExam, store: mockStore } });

        const selectButton = container.querySelector('.square-container');
        expect(selectButton).toBeInTheDocument();
    });

    it('当考试未被选中时选择框应该是未选中状态', () => {
        mockStore.state.selected = {};
        const { container } = render(ExamTableRow, { props: { exam: mockExam, store: mockStore } });

        const selectButton = container.querySelector('.square-container');
        expect(selectButton).not.toHaveClass('checked');
        expect(container.querySelector('.check-square')).not.toBeInTheDocument();
    });

    it('当考试被选中时选择框应该是选中状态', () => {
        mockStore.state.selected = { 1: true };
        const { container } = render(ExamTableRow, { props: { exam: mockExam, store: mockStore } });

        const selectButton = container.querySelector('.square-container');
        expect(selectButton).toHaveClass('checked');
        expect(container.querySelector('.check-square')).toBeInTheDocument();
    });

    it('点击选择框应该调用toggleSelect', async () => {
        const { container } = render(ExamTableRow, { props: { exam: mockExam, store: mockStore } });

        const selectButton = container.querySelector('.square-container');
        await fireEvent.click(selectButton);

        expect(mockStore.toggleSelect).toHaveBeenCalledWith(1);
    });

    it('应该渲染提交状态', () => {
        // 测试未提交状态
        render(ExamTableRow, { props: { exam: mockExam, store: mockStore } });
        expect(screen.getByText('未提交')).toBeInTheDocument();

        // 测试已提交状态
        const submittedExam = { ...mockExam, submitted: true };
        const { rerender } = render(ExamTableRow, { props: { exam: submittedExam, store: mockStore } });
        rerender({ exam: submittedExam, store: mockStore });
        expect(screen.getByText('已提交')).toBeInTheDocument();
    });

    it('应该渲染操作按钮', () => {
        render(ExamTableRow, { props: { exam: mockExam, store: mockStore } });

        expect(screen.getByText('查看详细')).toBeInTheDocument();
        expect(screen.getByText('导出')).toBeInTheDocument();
    });

    it('点击查看详细按钮应该调用功能未实现处理', async () => {
        const { handleFeatureNotImplemented } = await import('../../_utils/errorHandler');
        
        render(ExamTableRow, { props: { exam: mockExam, store: mockStore } });

        const detailButton = screen.getByText('查看详细');
        await fireEvent.click(detailButton);

        expect(handleFeatureNotImplemented).toHaveBeenCalledWith('查看详细');
    });

    it('点击导出按钮应该调用功能未实现处理', async () => {
        const { handleFeatureNotImplemented } = await import('../../_utils/errorHandler');
        
        render(ExamTableRow, { props: { exam: mockExam, store: mockStore } });

        const exportButton = screen.getByText('导出');
        await fireEvent.click(exportButton);

        expect(handleFeatureNotImplemented).toHaveBeenCalledWith('导出功能');
    });

    it('应该处理多个场次的考试', () => {
        const multiSessionExam = {
            ...mockExam,
            sessions: [
                {
                    exam_session_id: 1,
                    paper_name: '数学试卷A',
                    start_time: '2024-01-15T09:00:00Z',
                    end_time: '2024-01-15T11:00:00Z',
                    total_score: '100.0',
                    average_score: '85.5',
                    scheduled_examinees: 30,
                    actual_examinees: 28,
                    pass_examinees: 25
                },
                {
                    exam_session_id: 2,
                    paper_name: '数学试卷B',
                    start_time: '2024-01-16T09:00:00Z',
                    end_time: '2024-01-16T11:00:00Z',
                    total_score: '100.0',
                    average_score: '82.3',
                    scheduled_examinees: 25,
                    actual_examinees: 24,
                    pass_examinees: 22
                }
            ]
        };

        render(ExamTableRow, { props: { exam: multiSessionExam, store: mockStore } });

        expect(screen.getByText('数学试卷A')).toBeInTheDocument();
        expect(screen.getByText('数学试卷B')).toBeInTheDocument();
    });

    it('应该有正确的CSS类名', () => {
        const { container } = render(ExamTableRow, { props: { exam: mockExam, store: mockStore } });

        expect(container.querySelector('.exam-list-row')).toBeInTheDocument();
        expect(container.querySelector('.exam-select')).toBeInTheDocument();
        expect(container.querySelector('.exam-name')).toBeInTheDocument();
        expect(container.querySelector('.exam-type')).toBeInTheDocument();
    });

    it('应该处理空场次数组', () => {
        const noSessionExam = { ...mockExam, sessions: [] };
        
        expect(() => {
            render(ExamTableRow, { props: { exam: noSessionExam, store: mockStore } });
        }).not.toThrow();
    });
});
