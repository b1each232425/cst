import { getPractices, exportPracticeGrades } from '../_api/score';
import { formatISOString } from '../_utils/dateFormatter';
import { sget } from '$lib/utils';
import { handleApiError, handleSuccess, handleSelectionError } from '../_utils/errorHandler';

/**
 * @typedef {object} PracticeInfo
 * @property {number} id - 练习ID
 * @property {string} name - 练习名称
 * @property {number | string} total_score - 练习总分
 * @property {number | string} average_score - 练习平均分
 * @property {number} completed_students - 作答人数
 * @property {number} passed_students - 通过人数
 */

/**
 * @param {PracticeInfo[]} practiceData
 */
function formatPracticeData(practiceData) {
	if (!practiceData) return [];
	for (let practice of practiceData) {
		if (typeof practice.total_score === 'number' && practice.total_score !== -1) {
			practice.total_score = practice.total_score.toFixed(1);
		} else if (practice.total_score === -1 || practice.total_score == null) {
			practice.total_score = '−';
		}
		if (typeof practice.average_score === 'number' && practice.average_score !== -1) {
			practice.average_score = practice.average_score.toFixed(1);
		} else if (practice.average_score === -1 || practice.average_score == null) {
			practice.average_score = '−';
		}
	}
	return practiceData;
}



export function createPracticeGradeStore() {
	let state = $state({
		/** @type {PracticeInfo[]} */
		practices: [],
		totalRecords: 0,
		loading: false,
		selectAll: false,
		filters: {
			name: '',
			practiceID: ''
		},
		pagination: {
			page: 1,
			pageSize: 10
		},
		/** @type {Record<number, boolean>} */
		selected: {}
	});

	/** @type {any} */
	let timeoutId = null;

	const actions = {
		fetchPractices(debounce = false) {
			if (debounce) {
				if (timeoutId) clearTimeout(timeoutId);
				timeoutId = setTimeout(() => actions.fetchPractices(false), 500);
				return;
			}
			state.loading = true;
			// 构建 API 参数，普通用户不传递 teacherID
			const params = {
				practiceName: state.filters.name,
				name: state.filters.name,
				practiceID: state.filters.practiceID,
				...state.pagination
			};
			getPractices(params)
				.then((data) => {
					state.practices = formatPracticeData(sget(data, 'data', []));
					state.totalRecords = sget(data, 'rowCount', 0);
				})
				.catch((error) => {
					handleApiError(error, '获取练习成绩列表');
				})
				.finally(() => (state.loading = false));
		},
		/** @param {Partial<typeof state.filters>} newFilters */
		setFilters(newFilters) {
			state.filters = { ...state.filters, ...newFilters };
			state.pagination.page = 1;
			actions.fetchPractices(true);
		},
		/** @param {number} page */
		setPage(page) {
			state.pagination.page = page;
			actions.fetchPractices();
		},
		/** @param {number} pageSize */
		setPageSize(pageSize) {
			state.pagination.pageSize = pageSize;
			state.pagination.page = 1;
			actions.fetchPractices();
		}
	};

	/**
	 * @param {number} id
	 */
	function toggleSelect(id) {
		state.selected[id] = !state.selected[id];
		const practiceIds = state.practices.map(p => p.id);
		const selectedIds = Object.keys(state.selected).map(Number).filter(k => practiceIds.includes(k) && state.selected[k]);
		
		if (selectedIds.length === practiceIds.length && practiceIds.length > 0) {
			state.selectAll = true;
		} else {
			state.selectAll = false;
		}
	}

	function toggleSelectAll() {
		state.selectAll = !state.selectAll;
		/** @type {Record<number, boolean>} */
		const newSelected = {};
		for (const practice of state.practices) {
			newSelected[practice.id] = state.selectAll;
		}
		state.selected = newSelected;
	}

	function exportGrades() {
		const selectedIds = Object.keys(state.selected)
			.filter((id) => state.selected[Number(id)])
			.map(Number);

		if (selectedIds.length === 0) {
			handleSelectionError('导出');
			return;
		}

		exportPracticeGrades(selectedIds)
			.then(() => {
				handleSuccess('练习成绩导出');
			})
			.catch((error) => {
				handleApiError(error, '导出练习成绩');
			});
	}

	return {
		get state() {
			return state;
		},
		...actions,
		toggleSelect,
		toggleSelectAll,
		exportGrades
	};
} 