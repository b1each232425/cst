import { getPractices } from '$lib/api/grade-management';
import { formatISOString } from '../../../routes/teacher/grade-management/_utils'; // Assuming this can be reused

/**
 * @typedef {object} PracticeInfo
 * @property {number} id -练习ID
 * @property {string} name -练习名称
 * @property {string} class -练习班级
 * @property {number | string} total_score -练习总分
 * @property {number | string} average_score -练习平均分
 * @property {number} completed_students -作答人数
 * @property {number} passed_students -通过人数
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
		filters: {
			courseID: 0,
			classID: 0,
			practiceName: ''
		},
		pagination: {
			page: 1,
			pageSize: 10
		}
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
			const params = { ...state.filters, ...state.pagination };
			getPractices(params)
				.then((data) => {
					state.practices = formatPracticeData(data.data);
					state.totalRecords = data.row_count;
				})
				.catch((err) => console.error('Failed to fetch practices', err))
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

	return {
		get state() {
			return state;
		},
		...actions
	};
} 