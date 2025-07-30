import { render, screen } from '@testing-library/svelte';
import { describe, it, expect, vi } from 'vitest';
import Page from '../+page.svelte';

// Mock child components to isolate the page component
vi.mock('../_components/shared/Title.svelte', () => ({
	default: vi.fn().mockImplementation(() => ({
		// Mock component structure if needed, or just use a placeholder
		Component: {} // Or a more detailed mock if interaction is tested
	}))
}));

vi.mock('../_components/shared/Pagination.svelte', () => ({
	default: vi.fn()
}));

vi.mock('../_components/exam/ExamFilterPanel.svelte', () => ({
	default: vi.fn()
}));
vi.mock('../_components/exam/ExamTable.svelte', () => ({
	default: vi.fn()
}));

// Mock the store factory
vi.mock('../_stores/grade.svelte.js', () => ({
	createGradeStore: vi.fn(() => {
		// Return a mock store structure
		// This can be customized in tests
		return {
			state: {
				loading: false,
				exams: [],
				totalRecords: 0
			},
			fetchExams: vi.fn(),
			setFilters: vi.fn(),
			setPage: vi.fn()
			// Mock other actions if they are directly called from the template
		};
	})
}));

import { createGradeStore } from '../_stores/grade.svelte.js';

describe('Exam Grade Page', () => {
	beforeEach(() => {
		// Reset mocks before each test
		vi.clearAllMocks();
	});

	it('renders the title component', () => {
		render(Page);
		// Assuming Title component renders a specific role or text
		expect(screen.getByText('考试成绩管理')).toBeInTheDocument();
	});

	it('shows loading message when store is in loading state', () => {
		// Customize the mock for this specific test
		createGradeStore.mockImplementationOnce(() => ({
			state: {
				loading: true,
				exams: [],
				totalRecords: 0
			},
			fetchExams: vi.fn()
		}));

		render(Page);
		expect(screen.getByText('加载中...')).toBeInTheDocument();
	});

	it('renders ExamTable when not loading', () => {
		createGradeStore.mockImplementationOnce(() => ({
			state: {
				loading: false,
				exams: [{ id: 1, name: 'Test Exam', sessions: [] }],
				totalRecords: 1
			},
			fetchExams: vi.fn()
		}));

		const { container } = render(Page);
		// Check that the loading message is not present
		expect(screen.queryByText('加载中...')).not.toBeInTheDocument();

		// Check if the placeholder for ExamTable is there.
		// Since we mocked ExamTable, we can't check its internal content.
		// Instead, we can check if it was called.
		const ExamTable = (await import('../_components/exam/ExamTable.svelte')).default;
		expect(ExamTable).toHaveBeenCalled();
	});

	it('renders filter panel and pagination', async () => {
		render(Page);
		const ExamFilterPanel = (await import('../_components/exam/ExamFilterPanel.svelte')).default;
		const Pagination = (await import('../_components/shared/Pagination.svelte')).default;

		expect(ExamFilterPanel).toHaveBeenCalled();
		expect(Pagination).toHaveBeenCalled();
	});

	it('calls fetchExams on mount via $effect', async () => {
		const mockStore = {
			state: { loading: false, exams: [], totalRecords: 0 },
			fetchExams: vi.fn()
		};
		createGradeStore.mockImplementationOnce(() => mockStore);

		render(Page);

		// Svelte 5 effects run after the component has mounted.
		// We need to wait for the next "tick" for the effect to run.
		await new Promise((resolve) => setTimeout(resolve, 0));

		expect(mockStore.fetchExams).toHaveBeenCalled();
	});
});
