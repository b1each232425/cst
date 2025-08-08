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
 * 验证和清洗数值字段
 * @param {any} value - 原始值
 * @param {boolean} isInteger - 是否应该是整数
 * @returns {number | null} - 清洗后的数值或 null
 */
function validateNumericField(value, isInteger = false) {
	// 处理特殊值
	if (value === -1 || value === null || value === undefined || value === '') {
		return null;
	}

	// 转换为数字
	const numValue = Number(value);

	// 检查是否为有效数字
	if (isNaN(numValue) || !isFinite(numValue)) {
		return null;
	}

	// 检查是否为负数
	if (numValue < 0) {
		return null;
	}

	// 整数字段检查
	if (isInteger && !Number.isInteger(numValue)) {
		return Math.round(numValue); // 四舍五入到整数
	}

	return numValue;
}

/**
 * @param {PracticeInfo[]} practiceData
 */
function formatPracticeData(practiceData) {
	if (!practiceData) return [];
	for (let practice of practiceData) {
		// 数据清洗：将非法数值转换为 null，保持数值类型用于计算
		practice.total_score = validateNumericField(practice.total_score);
		practice.average_score = validateNumericField(practice.average_score);
		practice.completed_students = validateNumericField(practice.completed_students, true);
		practice.passed_students = validateNumericField(practice.passed_students, true);
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