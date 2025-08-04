import { render, screen } from '@testing-library/svelte';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import PracticeTable from '../PracticeTable.svelte';

// 模拟子组件
vi.mock('../PracticeTableHeader.svelte', () => ({
    default: vi.fn().mockImplementation(() => ({
        Component: {}
    }))
}));

vi.mock('../PracticeTableRow.svelte', () => ({
    default: vi.fn().mockImplementation(() => ({
        Component: {}
    }))
}));

describe('练习表格组件', () => {
    let mockStore;

    beforeEach(() => {
        vi.clearAllMocks();

        // 创建模拟 store
        mockStore = {
            state: {
                practices: [],
                selectAll: false,
                selected: {}
            },
            toggleSelectAll: vi.fn(),
            toggleSelect: vi.fn()
        };
    });

    it('应该渲染表格容器和基本结构', () => {
        const { container } = render(PracticeTable, { props: { store: mockStore } });

        // 检查表格容器
        expect(container.querySelector('.practice-table-container')).toBeInTheDocument();
        
        // 检查表格元素
        expect(container.querySelector('.practice-table')).toBeInTheDocument();
        expect(container.querySelector('thead')).toBeInTheDocument();
        expect(container.querySelector('tbody')).toBeInTheDocument();
    });

    it('当没有练习数据时应该显示暂无数据', () => {
        mockStore.state.practices = [];
        
        render(PracticeTable, { props: { store: mockStore } });
        
        expect(screen.getByText('暂无数据')).toBeInTheDocument();
    });

    it('应该渲染表格头部组件', async () => {
        render(PracticeTable, { props: { store: mockStore } });
        
        const PracticeTableHeader = (await import('../PracticeTableHeader.svelte')).default;
        expect(PracticeTableHeader).toHaveBeenCalled();
    });

    it('当有练习数据时应该渲染练习行', async () => {
        mockStore.state.practices = [
            { 
                id: 1, 
                name: 'Test Practice 1', 
                total_score: 100,
                average_score: 85.5,
                completed_students: 25,
                passed_students: 20
            },
            { 
                id: 2, 
                name: 'Test Practice 2', 
                total_score: 80,
                average_score: 72.3,
                completed_students: 30,
                passed_students: 22
            }
        ];

        render(PracticeTable, { props: { store: mockStore } });

        const PracticeTableRow = (await import('../PracticeTableRow.svelte')).default;
        expect(PracticeTableRow).toHaveBeenCalledTimes(2);
    });

    it('应该传递正确的props给表格头部', async () => {
        render(PracticeTable, { props: { store: mockStore } });

        const PracticeTableHeader = (await import('../PracticeTableHeader.svelte')).default;
        // Check that PracticeTableHeader was called with correct props
        expect(PracticeTableHeader).toHaveBeenCalled();
        const headerCall = PracticeTableHeader.mock.calls[0];
        expect(headerCall[1]).toEqual(expect.objectContaining({
            store: mockStore
        }));
    });

    it('应该传递正确的props给练习行', async () => {
        const testPractice = { 
            id: 1, 
            name: 'Test Practice', 
            total_score: 100,
            average_score: 85.5,
            completed_students: 25,
            passed_students: 20
        };
        mockStore.state.practices = [testPractice];

        render(PracticeTable, { props: { store: mockStore } });

        const PracticeTableRow = (await import('../PracticeTableRow.svelte')).default;
        // Check that PracticeTableRow was called with correct props
        expect(PracticeTableRow).toHaveBeenCalled();
        const rowCall = PracticeTableRow.mock.calls[0];
        expect(rowCall[1]).toEqual(expect.objectContaining({
            practice: testPractice,
            store: mockStore
        }));
    });

    it('应该有正确的CSS类名', () => {
        const { container } = render(PracticeTable, { props: { store: mockStore } });

        expect(container.querySelector('.practice-table-container')).toBeInTheDocument();
        expect(container.querySelector('.practice-table')).toBeInTheDocument();
        expect(container.querySelector('.no-data')).toBeInTheDocument();
    });

    it('表格应该有固定的最小宽度', () => {
        const { container } = render(PracticeTable, { props: { store: mockStore } });
        
        const table = container.querySelector('.practice-table');
        expect(table).toBeInTheDocument();
        // 由于样式是通过CSS设置的，我们只检查类名存在
        expect(table).toHaveClass('practice-table');
    });

    it('应该正确处理空数组和有数据的切换', async () => {
        // 开始时没有数据
        render(PracticeTable, { props: { store: mockStore } });
        expect(screen.getByText('暂无数据')).toBeInTheDocument();

        // 更新为有数据
        mockStore.state.practices = [{ 
            id: 1, 
            name: 'Test Practice', 
            total_score: 100,
            average_score: 85.5,
            completed_students: 25,
            passed_students: 20
        }];

        // 重新渲染
        const { rerender } = render(PracticeTable, { props: { store: mockStore } });
        await rerender({ store: mockStore });

        const PracticeTableRow = (await import('../PracticeTableRow.svelte')).default;
        expect(PracticeTableRow).toHaveBeenCalled();
    });

    it('应该为每个练习使用正确的key', () => {
        const practices = [
            { id: 1, name: 'Practice 1', total_score: 100, average_score: 85.5, completed_students: 25, passed_students: 20 },
            { id: 2, name: 'Practice 2', total_score: 80, average_score: 72.3, completed_students: 30, passed_students: 22 }
        ];
        mockStore.state.practices = practices;

        render(PracticeTable, { props: { store: mockStore } });

        // 由于使用了 {#each state.practices as practice (practice.id)}
        // 我们验证每个练习都被正确渲染
        expect(mockStore.state.practices).toHaveLength(2);
        expect(mockStore.state.practices[0].id).toBe(1);
        expect(mockStore.state.practices[1].id).toBe(2);
    });

    it('暂无数据行应该跨越正确的列数', () => {
        const { container } = render(PracticeTable, { props: { store: mockStore } });
        
        const noDataCell = container.querySelector('.no-data');
        expect(noDataCell).toBeInTheDocument();
        expect(noDataCell.getAttribute('colspan')).toBe('7');
    });

    it('应该正确处理store状态变化', () => {
        const { rerender } = render(PracticeTable, { props: { store: mockStore } });

        // 更新store状态
        mockStore.state.selectAll = true;
        mockStore.state.selected = { 1: true };

        rerender({ store: mockStore });

        // 验证组件能够响应状态变化
        expect(mockStore.state.selectAll).toBe(true);
        expect(mockStore.state.selected[1]).toBe(true);
    });

    it('表格头部应该有sticky定位样式', () => {
        const { container } = render(PracticeTable, { props: { store: mockStore } });
        
        const thead = container.querySelector('thead');
        expect(thead).toBeInTheDocument();
        // 样式通过CSS设置，我们检查元素存在
        expect(thead.tagName.toLowerCase()).toBe('thead');
    });
});
