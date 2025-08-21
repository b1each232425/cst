/**
 * 格式化 ISO 字符串
 * @param {string} isoString - ISO 格式的日期字符串
 * @returns {string} - 格式化后的日期字符串 (YYYY-MM-DD HH:mm:ss)
 */
export function formatISOString(isoString) {
	if (!isoString) return '-';
	try {
		const date = new Date(isoString);
		const year = date.getFullYear();
		const month = (date.getMonth() + 1).toString().padStart(2, '0');
		const day = date.getDate().toString().padStart(2, '0');
		const hours = date.getHours().toString().padStart(2, '0');
		const minutes = date.getMinutes().toString().padStart(2, '0');
		const seconds = date.getSeconds().toString().padStart(2, '0');
		return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
	} catch (error) {
		console.error('Invalid date format:', isoString, error);
		return '-';
	}
}

/**
 * 验证和清洗数值字段
 * @param {any} value - 原始值
 * @param {boolean} isInteger - 是否应该是整数
 * @returns {number | null} - 清洗后的数值或 null
 */
export function validateNumericField(value, isInteger = false) {
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
 * 格式化练习数据
 * @param {Array} practiceData - 练习数据数组
 * @returns {Array} - 格式化后的练习数据
 */
export function formatPracticeData(practiceData) {
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

/**
 * 格式化考试数据
 * @param {Array} examData - 考试数据数组
 * @returns {Array} - 格式化后的考试数据
 */
export function formatExamData(examData) {
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
 * 安全显示数值，空值显示为 '-'
 * @param {any} value - 原始值
 * @param {number} [decimals] - 小数位数，默认不处理小数
 * @returns {string} - 格式化后的显示值
 */
export function safeDisplayNumber(value, decimals) {
	// 处理 null、undefined、空字符串、-1 等无效值
	if (value === null || value === undefined || value === '' || value === -1) {
		return '-';
	}

	// 转换为数字
	const numValue = Number(value);

	// 检查是否为有效数字
	if (isNaN(numValue) || !isFinite(numValue)) {
		return '-';
	}

	// 检查是否为负数
	if (numValue < 0) {
		return '-';
	}

	// 处理小数位数
	if (typeof decimals === 'number' && decimals >= 0) {
		return numValue.toFixed(decimals);
	}

	return String(numValue);
}

/**
 * 安全显示文本，空值显示为 '-'
 * @param {any} value - 原始值
 * @returns {string} - 格式化后的显示值
 */
export function safeDisplayText(value) {
	if (value === null || value === undefined || value === '') {
		return '-';
	}
	return String(value);
}

/**
 * 安全显示布尔值
 * @param {any} value - 原始值
 * @param {string} trueText - true 时显示的文本
 * @param {string} falseText - false 时显示的文本
 * @returns {string} - 格式化后的显示值
 */
export function safeDisplayBoolean(value, trueText = '是', falseText = '否') {
	if (value === null || value === undefined) {
		return '-';
	}
	return value ? trueText : falseText;
}
