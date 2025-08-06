/**
 * 获取考试成绩列表
 * @param {object} params - 查询参数
 * @param {string} [params.name] - 考试名称
 * @param {string} [params.type] - 考试类型
 * @param {-1 | 1 | 0} [params.submitted] - 提交状态 (-1: 全部, 1: 已提交, 0: 未提交)
 * @param {number} [params.page] - 页码
 * @param {number} [params.pageSize] - 每页数量
 * @param {number} [params.teacherID] - 教师ID
 * @param {number} [params.examID] - 考试ID
 * @returns {Promise<any>}
 */
export function getExams(params) {
	// 添加参数校验和默认值
	const {
		name = '',
		type = '',
		submitted = -1, // 默认值改为 -1（全部）
		page = 1,
		pageSize = 10,
		teacherID,
		examID
	} = params || {};

	const queryParams = new URLSearchParams({
		category: 'exam',
		page: page.toString(),
		pageSize: pageSize.toString()
	});

	if (name) queryParams.append('name', name);
	if (type) queryParams.append('type', type);
	if (teacherID) queryParams.append('teacherID', teacherID.toString());
	if (examID) queryParams.append('examID', examID.toString());

	// 修复：submitted 参数必传，包括 -1（全部）
	queryParams.append('submitted', submitted.toString());

	const url = `/api/grade/list?${queryParams.toString()}`;


	return fetch(url, {
		method: 'GET',
		credentials: 'include'
	})
		.then((response) => {
			if (!response.ok) {
				throw new Error(`HTTP error! status: ${response.status}`);
			}
			return response.json();
		})
		.then((data) => {
			if (data.status < 0) {
				throw new Error(data.msg || '获取考试成绩列表失败');
			}
			// 在调用处处理 status > 0 的警告
			return data;
		});
}

/**
 * 提交考试成绩
 * @param {number[]} exam_ids - 考试ID列表
 * @returns {Promise<any>}
 */
export function submitExamGrades(exam_ids) {
	// 添加参数校验
	if (!Array.isArray(exam_ids) || exam_ids.length === 0) {
		return Promise.reject(new Error('提交成绩失败：exam_ids 必须是一个非空数组。'));
	}

	const url = `/api/grade/submission`;

	return fetch(url, {
		method: 'PATCH',
		credentials: 'include',
		headers: {
			'Content-Type': 'application/json'
		},
		body: JSON.stringify({
			data: {
				exam_ids
			}
		})
	})
		.then((response) => {
			if (!response.ok) {
				throw new Error(`HTTP error! status: ${response.status}`);
			}
			return response.json();
		})
		.then((data) => {
			if (data.status < 0) {
				throw new Error(data.msg || '提交成绩失败');
			}
			return data;
		});
}

// /**
//  * 获取考生名单以供导出
//  * @param {string} examIDString - 考试ID字符串，以逗号分隔
//  * @returns {Promise<any>}
//  */
// export function getExamineeGradeList(examIDString) {
// 	// 添加参数校验
// 	if (typeof examIDString !== 'string' || !examIDString) {
// 		return Promise.reject(new Error('获取考生名单失败：examIDString 必须是一个非空字符串。'));
// 	}
// 	const url = `/api/teacher/exam-grade/examinee-grade-list?examID=${examIDString}&page=-1&pageSize=-1`;
// 	return fetch(url, {
// 		method: 'GET',
// 		credentials: 'include'
// 	}).then((response) => {
// 		if (!response.ok) {
// 			throw new Error(`HTTP error! status: ${response.status}`);
// 		}
// 		return response.json();
// 	});
// }

// /**
//  * 获取成绩操作日志
//  * @param {number} page - 页码
//  * @param {number} pageSize - 每页数量
//  * @returns {Promise<any>}
//  */
// export function getGradeLogs(page = 1, pageSize = 10) {
// 	const url = `/api/teacher/exam-grade/log?page=${page}&pageSize=${pageSize}`;
// 	return fetch(url, {
// 		method: 'GET',
// 		credentials: 'include'
// 	})
// 		.then((response) => {
// 			if (!response.ok) {
// 				throw new Error(`HTTP error! status: ${response.status}`);
// 			}
// 			return response.json();
// 		})
// 		.then((data) => {
// 			if (data.status !== 0) {
// 				throw new Error(data.msg || '获取操作日志失败');
// 			}
// 			return data;
// 		});
// }

/**
 * 获取练习成绩列表
 * @param {object} params
 * @param {string} params.practiceName
 * @param {number} params.page
 * @param {number} params.pageSize
 * @param {number} [params.teacherID] - 教师ID
 * @param {number} [params.practiceID] - 练习ID
 * @returns {Promise<any>}
 */
export function getPractices(params) {
	// 添加参数校验和默认值
	const { practiceName = '', page = 1, pageSize = 10, teacherID, practiceID } = params || {};

	const queryParams = new URLSearchParams({
		category: 'practice',
		page: page.toString(),
		pageSize: pageSize.toString()
	});

	if (practiceName) queryParams.append('name', practiceName);
	if (teacherID) queryParams.append('teacherID', teacherID.toString());
	if (practiceID) queryParams.append('practiceID', practiceID.toString());

	const url = `/api/grade/list?${queryParams.toString()}`;

	return fetch(url, {
		method: 'GET',
		credentials: 'include'
	}).then((response) => {
		if (!response.ok) {
			throw new Error(`HTTP error! status: ${response.status}`);
		}
		return response.json();
	});
}

// /**
//  * @param {number[]} ids
//  * @returns {Promise<any>}
//  */
// export function exportPracticeGrades(ids) {
// 	// 添加参数校验
// 	if (!Array.isArray(ids) || ids.length === 0) {
// 		return Promise.reject(new Error('导出失败：未选择任何项目。'));
// 	}

// 	return fetch('/api/teacher/practice-grade/export', {
// 		method: 'POST',
// 		headers: {
// 			'Content-Type': 'application/json',
// 			credentials: 'include'
// 		},
// 		body: JSON.stringify({ ids })
// 	})
// 		.then((response) => {
// 			if (!response.ok) {
// 				throw new Error('HTTP error! status: ' + response.status);
// 			}
// 			return response.blob();
// 		})
// 		.then((blob) => {
// 			const url = window.URL.createObjectURL(blob);
// 			const a = document.createElement('a');
// 			a.href = url;
// 			a.download = 'practice_grades.xlsx';
// 			document.body.appendChild(a);
// 			a.click();
// 			a.remove();
// 		})
// 		.catch((error) => {
// 			console.error('导出练习成绩失败:', error);
// 			throw error;
// 		});
// } 