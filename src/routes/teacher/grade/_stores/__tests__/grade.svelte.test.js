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
			submitted: '', // 现在是字符串类型，支持 "", "1", "0"
			teacherID: -1,
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

			const promise = gradeStore.fetchExams();

			// Check loading state immediately
			expect(gradeStore.state.loading).toBe(true);

			await promise;

			expect(scoreApi.getExams).toHaveBeenCalledWith({
				...gradeStore.state.filters,
				...gradeStore.state.pagination
			});

			expect(gradeStore.state.exams.length).toBe(2);
			expect(gradeStore.state.exams[0].name).toBe('Midterm Exam');
			expect(gradeStore.state.totalRecords).toBe(2);
			expect(gradeStore.state.loading).toBe(false);
		});

		it('应该处理获取考试数据失败的情况', async () => {
			const { handleApiError } = await import('../../_utils/errorHandler');
			const error = new Error('Network Error');
			scoreApi.getExams.mockRejectedValue(error);

			await gradeStore.fetchExams();

			expect(gradeStore.state.loading).toBe(false);
			expect(gradeStore.state.exams).toEqual([]);
			expect(gradeStore.state.totalRecords).toBe(0);
			expect(handleApiError).toHaveBeenCalledWith(error, '获取考试列表');
		});

		it('should reset selection state before fetching', async () => {
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

		it('should update filters, reset pagination, and fetch exams with debounce', () => {
			const fetchExamsSpy = vi.spyOn(gradeStore, 'fetchExams');
			const newFilters = { name: 'Final', type: 'formal' };

			gradeStore.setFilters(newFilters);

			expect(gradeStore.state.filters.name).toBe('Final');
			expect(gradeStore.state.filters.type).toBe('formal');
			expect(gradeStore.state.pagination.page).toBe(1);

			// fetchExams(true) is called, which sets up a timeout
			expect(fetchExamsSpy).toHaveBeenCalledWith(true);

			// Fast-forward time to trigger the debounced call
			vi.runAllTimers();
			
			// fetchExams(false) should be called inside the timeout
			expect(fetchExamsSpy).toHaveBeenCalledTimes(2);
			expect(fetchExamsSpy).toHaveBeenCalledWith(false);
		});
	});

	describe('Pagination', () => {
		it('setPage should update page and fetch exams', () => {
			const fetchExamsSpy = vi.spyOn(gradeStore, 'fetchExams');
			gradeStore.setPage(3);
			expect(gradeStore.state.pagination.page).toBe(3);
			expect(fetchExamsSpy).toHaveBeenCalled();
		});

		it('setPageSize should update page size, reset page, and fetch exams', () => {
			const fetchExamsSpy = vi.spyOn(gradeStore, 'fetchExams');
			gradeStore.setPageSize(20);
			expect(gradeStore.state.pagination.pageSize).toBe(20);
			expect(gradeStore.state.pagination.page).toBe(1);
			expect(fetchExamsSpy).toHaveBeenCalled();
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

		it('toggleSelect should select and deselect an item', () => {
			gradeStore.toggleSelect(1);
			expect(gradeStore.state.selected[1]).toBe(true);
			gradeStore.toggleSelect(1);
			expect(gradeStore.state.selected[1]).toBe(false);
		});

		it('toggleSelect should update selectAll to true when all items are selected', () => {
			gradeStore.toggleSelect(1);
			gradeStore.toggleSelect(2);
			gradeStore.toggleSelect(3);
			expect(gradeStore.state.selectAll).toBe(true);
		});
		
		it('toggleSelectAll should select all items when none are selected', () => {
			gradeStore.toggleSelectAll();
			expect(gradeStore.state.selectAll).toBe(true);
			expect(gradeStore.state.selected).toEqual({ 1: true, 2: true, 3: true });
		});

		it('toggleSelectAll should deselect all items when all are selected', () => {
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
		it('should call submitExamGrades and refresh data on success', async () => {
			const { handleSuccess } = await import('../../_utils/errorHandler');
			const fetchExamsSpy = vi.spyOn(gradeStore, 'fetchExams').mockImplementation(() => Promise.resolve());
			scoreApi.submitExamGrades.mockResolvedValue({});

			const examIds = [1, 2];
			await gradeStore.submitGrades(examIds);

			expect(scoreApi.submitExamGrades).toHaveBeenCalledWith(examIds);
			expect(handleSuccess).toHaveBeenCalledWith('成绩提交');
			expect(fetchExamsSpy).toHaveBeenCalled();
		});

		it('should handle submission failure with error handler', async () => {
			const { handleApiError } = await import('../../_utils/errorHandler');
			const error = new Error('Submission Failed');
			scoreApi.submitExamGrades.mockRejectedValue(error);

			await gradeStore.submitGrades([1]);

			expect(scoreApi.submitExamGrades).toHaveBeenCalledWith([1]);
			expect(handleApiError).toHaveBeenCalledWith(error, '提交成绩');
		});
	});

	describe('Filter types', () => {
		it('should handle string-based submitted filter values', () => {
			// 测试新的字符串类型筛选值
			gradeStore.setFilters({ submitted: '1' }); // 已提交
			expect(gradeStore.state.filters.submitted).toBe('1');

			gradeStore.setFilters({ submitted: '0' }); // 未提交
			expect(gradeStore.state.filters.submitted).toBe('0');

			gradeStore.setFilters({ submitted: '' }); // 全部
			expect(gradeStore.state.filters.submitted).toBe('');
		});
	});
});
