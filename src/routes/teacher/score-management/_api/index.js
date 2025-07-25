/**
 * 获取考试成绩列表
 * @param {object} params - 查询参数
 * @param {number} params.courseID - 课程ID
 * @param {number} params.classID - 班级ID
 * @param {string} params.name - 考试名称
 * @param {string} params.type - 考试类型
 * @param {boolean | ""} params.submitted - 提交状态
 * @param {number} params.page - 页码
 * @param {number} params.pageSize - 每页数量
 * @returns {Promise<any>}
 */
export function getExams(params) {
	const { courseID, classID, name, type, submitted, page, pageSize } = params;
	const url = `/api/teacher/exam-grade?courseID=${courseID}&classID=${classID}&name=${name}&type=${type}&submitted=${submitted}&page=${page}&pageSize=${pageSize}`;

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
	const url = `/api/teacher/exam-grades`;

	return fetch(url, {
		method: 'PATCH',
		credentials: 'include',
		headers: {
			'Content-Type': 'application/json'
		},
		body: JSON.stringify({ exam_ids })
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

/**
 * 获取考生名单以供导出
 * @param {string} examIDString - 考试ID字符串，以逗号分隔
 * @returns {Promise<any>}
 */
export function getExamineeGradeList(examIDString) {
	const url = `/api/teacher/exam-grade/examinee-grade-list?examID=${examIDString}&page=-1&pageSize=-1`;
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

/**
 * 获取成绩操作日志
 * @param {number} page - 页码
 * @param {number} pageSize - 每页数量
 * @returns {Promise<any>}
 */
export function getGradeLogs(page = 1, pageSize = 10) {
	const url = `/api/teacher/exam-grade/log?page=${page}&pageSize=${pageSize}`;
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
			if (data.status !== 0) {
				throw new Error(data.msg || '获取操作日志失败');
			}
			return data;
		});
}

/**
 * 获取练习成绩列表
 * @param {object} params
 * @param {number} params.courseID
 * @param {number} params.classID
 * @param {string} params.practiceName
 * @param {number} params.page
 * @param {number} params.pageSize
 * @returns {Promise<any>}
 */
export function getPractices(params) {
	const { courseID, classID, practiceName, page, pageSize } = params;
	const url = `/api/teacher/practice-grade?courseID=${courseID}&classID=${classID}&practiceName=${practiceName}&page=${page}&pageSize=${pageSize}`;
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

/**
 * @param {number[]} ids
 * @returns {Promise<any>}
 */
export function exportPracticeGrades(ids) {
	return fetch('/api/teacher/practice-grade/export', {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json',
			credentials: 'include'
		},
		body: JSON.stringify({ ids })
	})
		.then((response) => {
			if (!response.ok) {
				throw new Error('HTTP error! status: ' + response.status);
			}
			return response.blob();
		})
		.then((blob) => {
			const url = window.URL.createObjectURL(blob);
			const a = document.createElement('a');
			a.href = url;
			a.download = 'practice_grades.xlsx';
			document.body.appendChild(a);
			a.click();
			a.remove();
		})
		.catch((error) => {
			console.error('导出练习成绩失败:', error);
			throw error;
		});
} 