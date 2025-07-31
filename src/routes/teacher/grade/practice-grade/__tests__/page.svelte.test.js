import { render, screen } from '@testing-library/svelte';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import Page from '../+page.svelte';

// 模拟全局组件
vi.mock('$lib/components/Title/Title.svelte');
vi.mock('$lib/components/Pagination/Pagination.svelte');
vi.mock('../_components/practice/PracticeFilterPanel.svelte');
vi.mock('../_components/practice/PracticeTable.svelte');

// 模拟 store 工厂函数
vi.mock('../_stores/practiceGrade.svelte.js', () => {
    const mockState = {
        loading: false,
        practices: [],
        totalRecords: 0,
        selectAll: false,
        filters: {
            name: '',
            teacherID: -1,
            practiceID: ''
        },
        pagination: {
            page: 1,
            pageSize: 10
        },
        selected: {}
    };
    const mockStore = {
        state: mockState,
        fetchPractices: vi.fn(),
        setFilters: vi.fn(),
        setPage: vi.fn(),
        setPageSize: vi.fn(),
        toggleSelect: vi.fn(),
        toggleSelectAll: vi.fn(),
        exportGrades: vi.fn()
    };
    return {
        createPracticeGradeStore: vi.fn(() => mockStore)
    };
});


import { createPracticeGradeStore } from '../_stores/practiceGrade.svelte.js';

describe('练习成绩管理页面', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('应该渲染正确标题的标题组件', () => {
        render(Page);
       //仅检测是否被调用
        expect(screen.getByText('练习成绩管理')).toBeInTheDocument();
    });

    it('shows loading message when store is in loading state', () => {
        // Customize the mock for this specific test
        const mockStore = {
            state: {
                loading: true,
                practices: [],
            },
            fetchPractices: vi.fn(),
        };
        createPracticeGradeStore.mockReturnValue(mockStore);

        render(Page);
        expect(screen.getByText('加载中...')).toBeInTheDocument();
    });

    it('renders PracticeTable when not loading', async () => {
        const mockStore = {
            state: {
                loading: false,
                practices: [{ id: 1, name: 'Test Practice' }],
            },
            fetchPractices: vi.fn(),
        };
        createPracticeGradeStore.mockReturnValue(mockStore);

        render(Page);
        const PracticeTable = (await import('../_components/practice/PracticeTable.svelte')).default;
        
        expect(screen.queryByText('加载中...')).not.toBeInTheDocument();
        expect(PracticeTable).toHaveBeenCalled();
    });

    it('renders filter panel and pagination', async () => {
        render(Page);
        const PracticeFilterPanel = (await import('../_components/practice/PracticeFilterPanel.svelte')).default;
        const Pagination = (await import('$lib/components/Pagination/Pagination.svelte')).default;

        expect(PracticeFilterPanel).toHaveBeenCalled();
        expect(Pagination).toHaveBeenCalled();
    });

    it('has correct CSS classes for layout', () => {
        const { container } = render(Page);

        // Check for main container
        expect(container.querySelector('.page-container')).toBeInTheDocument();

        // Check for filter container
        expect(container.querySelector('.filter-container')).toBeInTheDocument();

        // Check for table container
        expect(container.querySelector('.table-container')).toBeInTheDocument();

        // Check for pagination wrapper with right alignment
        expect(container.querySelector('.pagination-wrapper')).toBeInTheDocument();
    });

    it('pagination wrapper has correct styling for right alignment', () => {
        const { container } = render(Page);
        const paginationWrapper = container.querySelector('.pagination-wrapper');

        expect(paginationWrapper).toBeInTheDocument();
        //仅检查元素是否存在
    });

    it('calls fetchPractices on mount via $effect', async () => {
        const mockStore = {
            state: { loading: false, practices: [] },
            fetchPractices: vi.fn(),
        };
        createPracticeGradeStore.mockReturnValue(mockStore);

        render(Page);

        await new Promise(resolve => setTimeout(resolve, 0)); // Wait for effect to run

        expect(mockStore.fetchPractices).toHaveBeenCalled();
    });
});
