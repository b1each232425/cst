import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { createGradeStore } from '../grade.svelte.js';
import * as scoreApi from '../../_api/score';

// 模拟 API 模块
vi.mock('../../_api/score', () => ({
	getExams: vi.fn(),
	submitExamGrades: vi.fn(),
	getExamineeGradeList: vi.fn(),
	getGradeLogs: vi.fn()
}));

// 模拟工具函数
vi.mock('$lib/utils', () => ({
	sget: (obj, path, def) => {
		const result = path.split('.').reduce((o, k) => (o || {})[k], obj);
		return result === undefined ? def : result;
	}
}));

// 模拟错误处理工具
vi.mock('../../_utils/errorHandler', () => ({
	handleApiError: vi.fn(),
	handleSuccess: vi.fn()
}));

describe('考试成绩 Store', () => {
	let gradeStore;

	beforeEach(() => {
		// 重置模拟函数
		vi.resetAllMocks();
		// 为每个测试创建新的 store 实例
		gradeStore = createGradeStore();
	});

	it('应该有正确的初始状态', () => {
		const state = gradeStore.state;
		expect(state.exams).toEqual([]);
		expect(state.totalRecords).toBe(0);
		expect(state.loading).toBe(false);
		expect(state.selectAll).toBe(false);
		expect(state.filters).toEqual({
			name: '',
			type: '',
			submitted: -1, // 现在是数字类型：-1=全部, 0=未提交, 1=已提交
			examID: ''
		});
		expect(state.pagination).toEqual({
			page: 1,
			pageSize: 10
		});
		expect(state.selected).toEqual({});
	});

	describe('获取考试数据', () => {
		it('应该成功获取考试数据并更新状态', async () => {
			const mockExamData = {
				data: [
					{ id: 1, name: 'Midterm Exam', sessions: [] },
					{ id: 2, name: 'Final Exam', sessions: [] }
				],
				rowCount: 2
			};
			scoreApi.getExams.mockResolvedValue(mockExamData);

			gradeStore.fetchExams();

			// Check loading state immediately
			expect(gradeStore.state.loading).toBe(true);

			// Wait for the async operation to complete
			await vi.waitFor(() => {
				expect(gradeStore.state.loading).toBe(false);
			});

			expect(scoreApi.getExams).toHaveBeenCalledWith({
				name: '',
				type: '',
				submitted: -1, // 数字类型：-1=全部, 0=未提交, 1=已提交
				examID: '',
				page: 1,
				pageSize: 10
			});

			expect(gradeStore.state.exams.length).toBe(2);
			expect(gradeStore.state.exams[0].name).toBe('Midterm Exam');
			expect(gradeStore.state.totalRecords).toBe(2);
		});

		it('应该处理获取考试数据失败的情况', async () => {
			const { handleApiError } = await import('../../_utils/errorHandler');
			const error = new Error('Network Error');
			scoreApi.getExams.mockRejectedValue(error);

			gradeStore.fetchExams();

			// Wait for the async operation to complete
			await vi.waitFor(() => {
				expect(gradeStore.state.loading).toBe(false);
			});

			expect(gradeStore.state.exams).toEqual([]);
			expect(gradeStore.state.totalRecords).toBe(0);
			expect(handleApiError).toHaveBeenCalledWith(error, '获取考试成绩列表');
		});

		it('应该在获取考试数据之前重置选中状态', async () => {
			gradeStore.state.selected = { 1: true };
			gradeStore.state.selectAll = true;

			scoreApi.getExams.mockResolvedValue({ data: [], rowCount: 0 });

			await gradeStore.fetchExams();

			expect(gradeStore.state.selected).toEqual({});
			expect(gradeStore.state.selectAll).toBe(false);
		});
	});

	describe('setFilters', () => {
		beforeEach(() => {
			vi.useFakeTimers();
		});

		afterEach(() => {
			vi.useRealTimers();
		});

		it('应该更新筛选器，重置分页，并使用防抖功能获取考试数据', () => {
			// Mock the API call to prevent actual network requests
			scoreApi.getExams.mockResolvedValue({ data: [], rowCount: 0 });

			const newFilters = { name: 'Final', type: 'formal' };

			gradeStore.setFilters(newFilters);

			expect(gradeStore.state.filters.name).toBe('Final');
			expect(gradeStore.state.filters.type).toBe('formal');
			expect(gradeStore.state.pagination.page).toBe(1);

			// Fast-forward time to trigger the debounced call
			vi.runAllTimers();

			// After debounce, the API should be called
			expect(scoreApi.getExams).toHaveBeenCalled();
		});
	});

	describe('Pagination', () => {
		beforeEach(() => {
			// Ensure getExams returns a resolved promise for pagination tests
			scoreApi.getExams.mockResolvedValue({ data: [], rowCount: 0 });
		});

		it('setPage应该更新页面并获取考试数据', () => {
			gradeStore.setPage(3);
			expect(gradeStore.state.pagination.page).toBe(3);
			// Verify API was called with updated pagination
			expect(scoreApi.getExams).toHaveBeenCalledWith(
				expect.objectContaining({
					page: 3
				})
			);
		});

		it('setPageSize应该更新页面大小，重置页面，并获取考试数据', () => {
			gradeStore.setPageSize(20);
			expect(gradeStore.state.pagination.pageSize).toBe(20);
			expect(gradeStore.state.pagination.page).toBe(1);
			// Verify API was called with updated pagination
			expect(scoreApi.getExams).toHaveBeenCalledWith(
				expect.objectContaining({
					pageSize: 20,
					page: 1
				})
			);
		});
	});

	describe('Selection', () => {
		beforeEach(() => {
			// Set up some initial exam data in the store for selection tests
			gradeStore.state.exams = [
				{ id: 1, name: 'Exam A', sessions: [] },
				{ id: 2, name: 'Exam B', sessions: [] },
				{ id: 3, name: 'Exam C', sessions: [] }
			];
			gradeStore.state.selected = {};
			gradeStore.state.selectAll = false;
		});

		it('toggleSelect应该选择和取消选择一个项目', () => {
			gradeStore.toggleSelect(1);
			expect(gradeStore.state.selected[1]).toBe(true);
			gradeStore.toggleSelect(1);
			expect(gradeStore.state.selected[1]).toBe(false);
		});

		it('当所有项目都被选中时，toggleSelect应该将selectAll更新为true', () => {
			gradeStore.toggleSelect(1);
			gradeStore.toggleSelect(2);
			gradeStore.toggleSelect(3);
			expect(gradeStore.state.selectAll).toBe(true);
		});
		
		it('当没有选中项目时，toggleSelectAll应该选择所有项目', () => {
			gradeStore.toggleSelectAll();
			expect(gradeStore.state.selectAll).toBe(true);
			expect(gradeStore.state.selected).toEqual({ 1: true, 2: true, 3: true });
		});

		it('当所有项目都被选中时，toggleSelectAll应该取消选择所有项目', () => {
			// First, select all
			gradeStore.toggleSelectAll();
			expect(gradeStore.state.selectAll).toBe(true);

			// Then, toggle again to deselect all
			gradeStore.toggleSelectAll();
			expect(gradeStore.state.selectAll).toBe(false);
			expect(gradeStore.state.selected).toEqual({});
		});
	});
	
	describe('submitGrades', () => {
		it('应该调用submitExamGrades并在成功时刷新数据', async () => {
			const { handleSuccess } = await import('../../_utils/errorHandler');
			// Mock the API call to prevent actual network requests
			scoreApi.getExams.mockResolvedValue({ data: [], rowCount: 0 });
			scoreApi.submitExamGrades.mockResolvedValue({});

			const examIds = [1, 2];
			gradeStore.submitGrades(examIds);

			// Wait for the async operation to complete
			await vi.waitFor(() => {
				expect(handleSuccess).toHaveBeenCalledWith('成绩提交');
			});

			expect(scoreApi.submitExamGrades).toHaveBeenCalledWith(examIds);
			// After successful submission, fetchExams should be called to refresh data
			expect(scoreApi.getExams).toHaveBeenCalled();
		});

		it('应该使用错误处理程序处理提交失败', async () => {
			const { handleApiError } = await import('../../_utils/errorHandler');
			const error = new Error('Submission Failed');
			scoreApi.submitExamGrades.mockRejectedValue(error);

			gradeStore.submitGrades([1]);

			// Wait for the async operation to complete
			await vi.waitFor(() => {
				expect(handleApiError).toHaveBeenCalledWith(error, '提交成绩');
			});

			expect(scoreApi.submitExamGrades).toHaveBeenCalledWith([1]);
		});
	});

	describe('筛选类型', () => {
		it('应该处理数字类型的提交状态筛选值', () => {
			// 测试新的数字类型筛选值
			gradeStore.setFilters({ submitted: 1 }); // 已提交
			expect(gradeStore.state.filters.submitted).toBe(1);

			gradeStore.setFilters({ submitted: 0 }); // 未提交
			expect(gradeStore.state.filters.submitted).toBe(0);

			gradeStore.setFilters({ submitted: -1 }); // 全部
			expect(gradeStore.state.filters.submitted).toBe(-1);
		});
	});
});
