import { render, screen } from '@testing-library/svelte';
import { describe, it, expect, vi } from 'vitest';
import Page from '../+page.svelte';

// Mock child components
vi.mock('../_components/shared/Title.svelte');
vi.mock('../_components/shared/Pagination.svelte');
vi.mock('../_components/practice/PracticeFilterPanel.svelte');
vi.mock('../_components/practice/PracticeTable.svelte');

// Mock the store factory
vi.mock('../_stores/practiceGrade.svelte.js', () => {
    const mockState = {
        loading: false,
        practices: [],
        totalRecords: 0,
    };
    const mockStore = {
        state: mockState,
        fetchPractices: vi.fn(),
        setFilters: vi.fn(),
        setPage: vi.fn(),
    };
    return {
        createPracticeGradeStore: vi.fn(() => mockStore)
    };
});


import { createPracticeGradeStore } from '../_stores/practiceGrade.svelte.js';

describe('Practice Grade Page', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('renders the title component with correct title', () => {
        render(Page);
        // We can't check the text if the component is fully mocked.
        // Instead, let's verify it's in the document in a generic way.
        // A better approach would be to check if the mocked component was called,
        // but for a simple static component, this is okay.
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
        const Pagination = (await import('../_components/shared/Pagination.svelte')).default;

        expect(PracticeFilterPanel).toHaveBeenCalled();
        expect(Pagination).toHaveBeenCalled();
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
