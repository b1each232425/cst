import { getExams, submitExamGrades, getExamineeGradeList, getGradeLogs } from '../_api';
import { formatISOString } from '../_utils';

/**
 * @typedef {object} ExamSessionInfo
 * @property {number} id -考试场次
 * @property {string} paper_name -试卷名称
 * @property {string} start_time -考试开始时间
 * @property {string} end_time -考试结束时间
 * @property {number | string} total_score -考试总分
 * @property {number | string} average_score -考试平均分
 * @property {number} scheduled_examinees -计划应考人数
 * @property {number} actual_examinees -实际应考人数
 * @property {number} pass_examinees -考试通过人数
 */

/**
 * @typedef {object} ExamInfo
 * @property {number} id -考试ID
 * @property {string} name -考试名称
 * @property {string} type -考试类型
 * @property {string} class -考试班级
 * @property {ExamSessionInfo[]} sessions -考试场次
 * @property {boolean} submitted -是否提交
 */

/**
 * 格式化考试数据
 * @param {ExamInfo[]} examData
 * @returns {ExamInfo[]}
 */
function formatExamData(examData) {
	if (!examData) return [];
	for (let exam of examData) {
		for (let session of exam.sessions) {
			session.start_time = formatISOString(session.start_time);
			session.end_time = formatISOString(session.end_time);
			if (typeof session.total_score === 'number' && session.total_score !== -1) {
				session.total_score = session.total_score.toFixed(1);
			} else if (session.total_score === -1 || session.total_score == null) {
				session.total_score = '−';
			}
			if (typeof session.average_score === 'number' && session.average_score !== -1) {
				session.average_score = session.average_score.toFixed(1);
			} else if (session.average_score === -1 || session.average_score == null) {
				session.average_score = '−';
			}
		}
	}
	return examData;
}

export function createGradeStore() {
	let state = $state({
		/** @type {ExamInfo[]} */
		exams: [],
		totalRecords: 0,
		loading: false,
		selectAll: false, // New state for select all checkbox
		filters: {
			courseID: 0,
			classID: 0,
			name: '',
			type: '',
			/** @type {boolean | ''} */
			submitted: ''
		},
		pagination: {
			page: 1,
			pageSize: 10
		},
		/** @type {Record<number, boolean>} */
		selected: {}
	});

	/** @type {any} */
	let getExamInfoTimeout = null;

	const actions = {
		fetchExams(debounce = false) {
			if (debounce) {
				if (getExamInfoTimeout) {
					clearTimeout(getExamInfoTimeout);
				}
				getExamInfoTimeout = setTimeout(() => {
					actions.fetchExams(false);
				}, 500);
				return;
			}

			state.loading = true;
			// When fetching, reset selection
			state.selected = {};
			state.selectAll = false;
			const params = {
				...state.filters,
				...state.pagination
			};
			getExams(params)
				.then((data) => {
					state.exams = formatExamData(data.data);
					state.totalRecords = data.row_count;
				})
				.catch((error) => {
					console.error('获取考试列表失败:', error);
				})
				.finally(() => {
					state.loading = false;
				});
		},
		/** @param {Partial<typeof state.filters>} newFilters */
		setFilters(newFilters) {
			state.filters = { ...state.filters, ...newFilters };
			state.pagination.page = 1;
			actions.fetchExams(true);
		},
		/** @param {number} page */
		setPage(page) {
			state.pagination.page = page;
			actions.fetchExams();
		},
		/** @param {number} pageSize */
		setPageSize(pageSize) {
			state.pagination.pageSize = pageSize;
			state.pagination.page = 1;
			actions.fetchExams();
		},
		/** @param {number} id */
		toggleSelect(id) {
			state.selected[id] = !state.selected[id];
			// Check if all are selected
			const allSelected = state.exams.length > 0 && state.exams.every((exam) => state.selected[exam.id]);
			state.selectAll = allSelected;
		},
		toggleSelectAll() {
			state.selectAll = !state.selectAll;
			/** @type {Record<number, boolean>} */
			const newSelected = {};
			if (state.selectAll) {
				for (const exam of state.exams) {
					newSelected[exam.id] = true;
				}
			}
			state.selected = newSelected;
		},
		/** @param {number[]} examIds */
		submitGrades(examIds) {
			// Here you would call the API
			console.log('Submitting grades for exams:', examIds);
			// Example of calling API:
			// submitExamGrades(examIds)
			// 	.then(() => {
			// 		actions.fetchExams(); // Refresh data
			// 	})
			// 	.catch(err => console.error(err));
		},
		/** @param {number[]} examIds */
		exportGrades(examIds) {
			console.log('Exporting grades for exams:', examIds);
			// const idString = examIds.join(',');
			// getExamineeGradeList(idString)
			// 	.then(data => {
			// 		// Call actual export utility
			// 		console.log('Data to export:', data);
			// 	})
			// 	.catch(err => console.error(err));
		}
	};

	return {
		get state() {
			return state;
		},
		...actions
	};
}
