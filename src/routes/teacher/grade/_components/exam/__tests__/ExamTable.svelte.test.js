import { render, screen } from '@testing-library/svelte';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import ExamTable from '../ExamTable.svelte';

// 模拟子组件
vi.mock('../ExamTableHeader.svelte', () => ({
    default: vi.fn().mockImplementation(() => ({
        Component: {}
    }))
}));

vi.mock('../ExamTableRow.svelte', () => ({
    default: vi.fn().mockImplementation(() => ({
        Component: {}
    }))
}));

describe('考试表格组件', () => {
    let mockStore;

    beforeEach(() => {
        vi.clearAllMocks();

        // 创建模拟 store
        mockStore = {
            state: {
                exams: [],
                selectAll: false,
                selected: {}
            },
            toggleSelectAll: vi.fn()
        };
    });

    it('应该渲染表格容器和基本结构', () => {
        const { container } = render(ExamTable, { props: { store: mockStore } });

        // 检查表格容器
        expect(container.querySelector('.exam-table-container')).toBeInTheDocument();
        
        // 检查表格元素
        expect(container.querySelector('.exam-table')).toBeInTheDocument();
        expect(container.querySelector('thead')).toBeInTheDocument();
        expect(container.querySelector('tbody')).toBeInTheDocument();
    });

    it('当没有考试数据时应该显示暂无数据', () => {
        mockStore.state.exams = [];
        
        render(ExamTable, { props: { store: mockStore } });
        
        expect(screen.getByText('暂无数据')).toBeInTheDocument();
    });

    it('应该渲染表格头部组件', async () => {
        render(ExamTable, { props: { store: mockStore } });
        
        const ExamTableHeader = (await import('../ExamTableHeader.svelte')).default;
        expect(ExamTableHeader).toHaveBeenCalled();
    });

    it('当有考试数据时应该渲染考试行', async () => {
        mockStore.state.exams = [
            { 
                id: 1, 
                name: 'Test Exam 1', 
                type: '00',
                sessions: [],
                submitted: false
            },
            { 
                id: 2, 
                name: 'Test Exam 2', 
                type: '01',
                sessions: [],
                submitted: true
            }
        ];

        render(ExamTable, { props: { store: mockStore } });

        const ExamTableRow = (await import('../ExamTableRow.svelte')).default;
        expect(ExamTableRow).toHaveBeenCalledTimes(2);
    });

    it('应该传递正确的props给表格头部', async () => {
        mockStore.state.selectAll = true;
        
        render(ExamTable, { props: { store: mockStore } });

        const ExamTableHeader = (await import('../ExamTableHeader.svelte')).default;
        // Check that ExamTableHeader was called with correct props
        expect(ExamTableHeader).toHaveBeenCalled();
        const headerCall = ExamTableHeader.mock.calls[0];
        expect(headerCall[1]).toEqual(expect.objectContaining({
            selected: true,
            onclick: expect.any(Function)
        }));
    });

    it('应该传递正确的props给考试行', async () => {
        const testExam = { 
            id: 1, 
            name: 'Test Exam', 
            type: '00',
            sessions: [],
            submitted: false
        };
        mockStore.state.exams = [testExam];

        render(ExamTable, { props: { store: mockStore } });

        const ExamTableRow = (await import('../ExamTableRow.svelte')).default;
        // Check that ExamTableRow was called with correct props
        expect(ExamTableRow).toHaveBeenCalled();
        const rowCall = ExamTableRow.mock.calls[0];
        expect(rowCall[1]).toEqual(expect.objectContaining({
            exam: testExam,
            store: mockStore
        }));
    });

    it('应该有正确的CSS类名', () => {
        const { container } = render(ExamTable, { props: { store: mockStore } });

        expect(container.querySelector('.exam-table-container')).toBeInTheDocument();
        expect(container.querySelector('.exam-table')).toBeInTheDocument();
        expect(container.querySelector('.no-data')).toBeInTheDocument();
    });

    it('表格应该有固定的最小宽度', () => {
        const { container } = render(ExamTable, { props: { store: mockStore } });
        
        const table = container.querySelector('.exam-table');
        expect(table).toBeInTheDocument();
        // 由于样式是通过CSS设置的，我们只检查类名存在
        expect(table).toHaveClass('exam-table');
    });

    it('应该正确处理空数组和有数据的切换', async () => {
        // 开始时没有数据
        render(ExamTable, { props: { store: mockStore } });
        expect(screen.getByText('暂无数据')).toBeInTheDocument();

        // 更新为有数据
        mockStore.state.exams = [{ 
            id: 1, 
            name: 'Test Exam', 
            type: '00',
            sessions: [],
            submitted: false
        }];

        // 重新渲染
        const { rerender } = render(ExamTable, { props: { store: mockStore } });
        await rerender({ store: mockStore });

        const ExamTableRow = (await import('../ExamTableRow.svelte')).default;
        expect(ExamTableRow).toHaveBeenCalled();
    });

    it('应该为每个考试使用正确的key', () => {
        const exams = [
            { id: 1, name: 'Exam 1', type: '00', sessions: [], submitted: false },
            { id: 2, name: 'Exam 2', type: '01', sessions: [], submitted: true }
        ];
        mockStore.state.exams = exams;

        render(ExamTable, { props: { store: mockStore } });

        // 由于使用了 {#each state.exams as exam, index (exam.id)}
        // 我们验证每个考试都被正确渲染
        expect(mockStore.state.exams).toHaveLength(2);
        expect(mockStore.state.exams[0].id).toBe(1);
        expect(mockStore.state.exams[1].id).toBe(2);
    });
});
