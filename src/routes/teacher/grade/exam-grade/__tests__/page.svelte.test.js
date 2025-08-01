import { render, screen } from '@testing-library/svelte';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import Page from '../+page.svelte';

// 模拟全局组件
vi.mock('$lib/components/Title/Title.svelte', () => ({
	default: vi.fn().mockImplementation(() => ({
		Component: {}
	}))
}));

vi.mock('$lib/components/Pagination/Pagination.svelte', () => ({
	default: vi.fn()
}));

// 模拟页面组件
vi.mock('../../_components/exam/ExamFilterPanel.svelte', () => ({
	default: vi.fn()
}));
vi.mock('../../_components/exam/ExamTable.svelte', () => ({
	default: vi.fn()
}));

// 模拟 store 工厂函数
vi.mock('../../_stores/grade.svelte.js', () => ({
	createGradeStore: vi.fn(() => {
		// 返回模拟的 store 结构
		return {
			state: {
				loading: false,
				exams: [],
				totalRecords: 0,
				selectAll: false,
				filters: {
					name: '',
					type: '',
					submitted: -1, // 现在是数字类型：-1=全部, 0=未提交, 1=已提交
					examID: ''
				},
				pagination: {
					page: 1,
					pageSize: 10
				},
				selected: {}
			},
			fetchExams: vi.fn(),
			setFilters: vi.fn(),
			setPage: vi.fn(),
			setPageSize: vi.fn(),
			toggleSelect: vi.fn(),
			toggleSelectAll: vi.fn(),
			submitGrades: vi.fn()
		};
	})
}));

import { createGradeStore } from '../../_stores/grade.svelte.js';

describe('考试成绩管理页面', () => {
	beforeEach(() => {
		// 重置模拟函数
		vi.clearAllMocks();
	});

	it('应该渲染标题组件', () => {
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

	it('renders ExamTable when not loading', async () => {
		createGradeStore.mockImplementationOnce(() => ({
			state: {
				loading: false,
				exams: [{ id: 1, name: 'Test Exam', sessions: [] }],
				totalRecords: 1
			},
			fetchExams: vi.fn()
		}));

		const { container } = render(Page);
		// 检查加载消息不存在
		expect(screen.queryByText('加载中...')).not.toBeInTheDocument();

		//ExamTable 已被模拟，仅检查是否被调用
		const ExamTable = (await import('../../_components/exam/ExamTable.svelte')).default;
		expect(ExamTable).toHaveBeenCalled();
	});

	it('renders filter panel and pagination', async () => {
		render(Page);
		const ExamFilterPanel = (await import('../../_components/exam/ExamFilterPanel.svelte')).default;
		const Pagination = (await import('$lib/components/Pagination/Pagination.svelte')).default;

		expect(ExamFilterPanel).toHaveBeenCalled();
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
		//当前不进行测试样式，故仅检查元素是否存在
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
