import { getExams, submitExamGrades, getExamineeGradeList, getGradeLogs } from '../_api/score';
import { formatISOString } from '../_utils/dateFormatter';
import { sget } from '$lib/utils';
import { handleApiError, handleSuccess } from '../_utils/errorHandler';

/**
 * @typedef {object} ExamSessionInfo
 * @property {number} exam_id - 考试ID
 * @property {number} exam_session_id - 考试场次ID
 * @property {string} paper_name - 试卷名称
 * @property {number} start_time - 考试开始时间 (timestamp)
 * @property {number} end_time - 考试结束时间 (timestamp)
 * @property {string} mark_mode - 阅卷模式
 * @property {number | string} total_score - 考试总分
 * @property {number | string} average_score - 考试平均分
 * @property {number} scheduled_examinees - 计划应考人数
 * @property {number} actual_examinees - 实际应考人数
 * @property {number} pass_examinees - 考试通过人数
 */

/**
 * @typedef {object} ExamInfo
 * @property {number} id - 考试ID
 * @property {string} name - 考试名称
 * @property {string} type - 考试类型
 * @property {ExamSessionInfo[]} sessions - 考试场次
 * @property {boolean} submitted - 是否提交
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

			// 数据清洗：将非法数值转换为 null，保持数值类型用于计算
			session.total_score = validateNumericField(session.total_score);
			session.average_score = validateNumericField(session.average_score);
			session.scheduled_examinees = validateNumericField(session.scheduled_examinees, true);
			session.actual_examinees = validateNumericField(session.actual_examinees, true);
			session.pass_examinees = validateNumericField(session.pass_examinees, true);
		}
	}
	return examData;
}

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

	// 检查是否为负数（分数可能为0，人数不能为负）
	if (numValue < 0) {
		return null;
	}

	// 整数字段检查
	if (isInteger && !Number.isInteger(numValue)) {
		return Math.round(numValue); // 四舍五入到整数
	}

	return numValue;
}



export function createGradeStore() {
	let state = $state({
		/** @type {ExamInfo[]} */
		exams: [],
		totalRecords: 0,
		loading: false,
		selectAll: false, 
		filters: {
			name: '',
			type: '',
			/** @type {number} */
			submitted: -1, // -1=全部, 0=未提交, 1=已提交
			examID: ''
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
			//获取考试数据时，重置选中状态
			state.selected = {};
			state.selectAll = false;
			// 构建 API 参数，普通用户不传递 teacherID
			const params = {
				name: state.filters.name,
				type: state.filters.type,
				submitted: state.filters.submitted, // -1=全部, 0=未提交, 1=已提交
				examID: state.filters.examID,
				...state.pagination
			};
			getExams(params)
				.then((data) => {
					state.exams = formatExamData(sget(data, 'data', []));
					state.totalRecords = sget(data, 'rowCount', 0);
				})
				.catch((error) => {
					handleApiError(error, '获取考试成绩列表');
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
			// 检查是否全部选中
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
			submitExamGrades(examIds)
				.then(() => {
					handleSuccess('成绩提交');
					actions.fetchExams(); // 提交后刷新数据
				})
				.catch((error) => {
					handleApiError(error, '提交成绩');
				});
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
