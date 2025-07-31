import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { createPracticeGradeStore } from '../practiceGrade.svelte.js';
import * as scoreApi from '../_api/score';

// 模拟 API 模块
vi.mock('../_api/score', () => ({
	getPractices: vi.fn(),
	exportPracticeGrades: vi.fn()
}));

// 模拟工具函数
vi.mock('$lib/utils', () => ({
	sget: (obj, path, def) => {
		const result = path.split('.').reduce((o, k) => (o || {})[k], obj);
		return result === undefined ? def : result;
	}
}));

// 模拟错误处理工具
vi.mock('../_utils/errorHandler', () => ({
	handleApiError: vi.fn(),
	handleSuccess: vi.fn(),
	handleSelectionError: vi.fn()
}));

describe('练习成绩 Store', () => {
	let practiceStore;

	beforeEach(() => {
		vi.resetAllMocks();
		practiceStore = createPracticeGradeStore();
	});

	it('应该有正确的初始状态', () => {
		const state = practiceStore.state;
		expect(state.practices).toEqual([]);
		expect(state.totalRecords).toBe(0);
		expect(state.loading).toBe(false);
		expect(state.selectAll).toBe(false);
		expect(state.filters).toEqual({
			name: '',
			teacherID: -1,
			practiceID: ''
		});
		expect(state.pagination).toEqual({
			page: 1,
			pageSize: 10
		});
		expect(state.selected).toEqual({});
	});

	describe('fetchPractices', () => {
		it('should fetch practices successfully and update state', async () => {
			const mockPracticeData = {
				data: [
					{ id: 1, name: 'Basic Algebra', total_score: 100 },
					{ id: 2, name: 'Advanced Calculus', total_score: 150 }
				],
				rowCount: 2
			};
			scoreApi.getPractices.mockResolvedValue(mockPracticeData);

			const promise = practiceStore.fetchPractices();
			expect(practiceStore.state.loading).toBe(true);
			await promise;

			expect(scoreApi.getPractices).toHaveBeenCalled();
			expect(practiceStore.state.practices.length).toBe(2);
			expect(practiceStore.state.practices[0].name).toBe('Basic Algebra');
			expect(practiceStore.state.totalRecords).toBe(2);
			expect(practiceStore.state.loading).toBe(false);
		});

		it('should handle fetch practices failure', async () => {
			const { handleApiError } = await import('../_utils/errorHandler');
			const error = new Error('Fetch Failed');
			scoreApi.getPractices.mockRejectedValue(error);

			await practiceStore.fetchPractices();

			expect(practiceStore.state.loading).toBe(false);
			expect(practiceStore.state.practices).toEqual([]);
			expect(handleApiError).toHaveBeenCalledWith(error, '获取练习列表');
		});
	});

	describe('setFilters', () => {
		beforeEach(() => vi.useFakeTimers());
		afterEach(() => vi.useRealTimers());

		it('should update filters, reset pagination, and fetch practices with debounce', () => {
			const fetchPracticesSpy = vi.spyOn(practiceStore, 'fetchPractices');
			practiceStore.setFilters({ name: 'Calculus' });

			expect(practiceStore.state.filters.name).toBe('Calculus');
			expect(practiceStore.state.pagination.page).toBe(1);
			expect(fetchPracticesSpy).toHaveBeenCalledWith(true);

			vi.runAllTimers();
			expect(fetchPracticesSpy).toHaveBeenCalledTimes(2);
			expect(fetchPracticesSpy).toHaveBeenCalledWith(false);
		});
	});

	describe('Selection', () => {
		beforeEach(() => {
			practiceStore.state.practices = [
				{ id: 101, name: 'Practice A' },
				{ id: 102, name: 'Practice B' }
			];
			practiceStore.state.selected = {};
			practiceStore.state.selectAll = false;
		});

		it('toggleSelect should select and deselect an item', () => {
			practiceStore.toggleSelect(101);
			expect(practiceStore.state.selected[101]).toBe(true);
			practiceStore.toggleSelect(101);
			expect(practiceStore.state.selected[101]).toBe(false);
		});

		it('toggleSelectAll should select all and deselect all items', () => {
			practiceStore.toggleSelectAll();
			expect(practiceStore.state.selectAll).toBe(true);
			expect(practiceStore.state.selected).toEqual({ 101: true, 102: true });

			practiceStore.toggleSelectAll();
			expect(practiceStore.state.selectAll).toBe(false);
			expect(practiceStore.state.selected).toEqual({ 101: false, 102: false });
		});
	});

	describe('exportGrades', () => {
		it('should show selection error when no items are selected', async () => {
			const { handleSelectionError } = await import('../_utils/errorHandler');
			practiceStore.state.selected = {};

			await practiceStore.exportGrades();

			expect(scoreApi.exportPracticeGrades).not.toHaveBeenCalled();
			expect(handleSelectionError).toHaveBeenCalledWith('导出');
		});

		it('should call export API with selected IDs and show success', async () => {
			const { handleSuccess } = await import('../_utils/errorHandler');
			scoreApi.exportPracticeGrades.mockResolvedValue({});
			practiceStore.state.selected = { 1: true, 2: false, 3: true };

			await practiceStore.exportGrades();

			const selectedIds = [1, 3];
			expect(scoreApi.exportPracticeGrades).toHaveBeenCalledWith(selectedIds);
			expect(handleSuccess).toHaveBeenCalledWith('练习成绩导出');
		});

		it('should handle export failure with error handler', async () => {
			const { handleApiError } = await import('../_utils/errorHandler');
			const error = new Error('Export Failed');
			scoreApi.exportPracticeGrades.mockRejectedValue(error);
			practiceStore.state.selected = { 1: true };

			await practiceStore.exportGrades();

			expect(handleApiError).toHaveBeenCalledWith(error, '导出练习成绩');
		});
	});
});
