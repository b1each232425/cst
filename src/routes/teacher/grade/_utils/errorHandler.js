import { toast } from '$lib/components/Toast/Toast.js';

/**
 * 统一错误处理工具
 * 根据错误类型显示用户友好的提示信息，并在开发环境下输出详细错误
 */

/**
 * 处理API请求错误
 * @param {Error} error - 错误对象
 * @param {string} operation - 操作描述，如"获取考试列表"、"提交成绩"等
 * @param {object} options - 可选配置
 * @param {boolean} options.showToast - 是否显示Toast提示，默认true
 * @param {boolean} options.logError - 是否在开发环境输出错误日志，默认true
 */
export function handleApiError(error, operation, options = {}) {
	const { showToast = true, logError = true } = options;
	
	// 根据错误类型生成用户友好的提示信息
	let errorMessage = `${operation}失败`;
	
	if (error.message) {
		if (error.message.includes('HTTP error! status: 401')) {
			errorMessage = '登录已过期，请重新登录';
		} else if (error.message.includes('HTTP error! status: 403')) {
			errorMessage = '权限不足，无法执行此操作';
		} else if (error.message.includes('HTTP error! status: 404')) {
			errorMessage = '请求的资源不存在';
		} else if (error.message.includes('HTTP error! status: 500')) {
			errorMessage = '服务器内部错误，请稍后重试';
		} else if (error.message.includes('HTTP error')) {
			errorMessage = `${operation}失败：网络请求异常`;
		} else if (error.message.includes('Failed to fetch')) {
			errorMessage = `${operation}失败：网络连接异常，请检查网络连接`;
		} else if (error.message.includes('NetworkError')) {
			errorMessage = `${operation}失败：网络错误，请检查网络连接`;
		} else {
			errorMessage = `${operation}失败：${error.message}`;
		}
	}
	
	// 显示用户友好的错误提示
	if (showToast) {
		toast.error(errorMessage);
	}
	
	// 开发环境下输出详细错误信息
	if (logError && import.meta.env.DEV) {
		console.error(`${operation}失败:`, error);
	}
	
	return errorMessage;
}

/**
 * 处理表单验证错误
 * @param {string} message - 验证错误信息
 * @param {object} options - 可选配置
 * @param {boolean} options.showToast - 是否显示Toast提示，默认true
 */
export function handleValidationError(message, options = {}) {
	const { showToast = true } = options;
	
	if (showToast) {
		toast.warning(message);
	}
	
	return message;
}

/**
 * 处理成功操作的提示
 * @param {string} operation - 操作描述
 * @param {object} options - 可选配置
 * @param {boolean} options.showToast - 是否显示Toast提示，默认true
 */
export function handleSuccess(operation, options = {}) {
	const { showToast = true } = options;
	
	const successMessage = `${operation}成功`;
	
	if (showToast) {
		toast.success(successMessage);
	}
	
	return successMessage;
}

/**
 * 处理功能未实现的提示
 * @param {string} feature - 功能名称
 * @param {object} options - 可选配置
 * @param {boolean} options.showToast - 是否显示Toast提示，默认true
 */
export function handleFeatureNotImplemented(feature, options = {}) {
	const { showToast = true } = options;
	
	const message = `${feature}功能正在开发中，敬请期待`;
	
	if (showToast) {
		toast.warning(message);
	}
	
	return message;
}

/**
 * 处理选择验证错误（如未选择任何项目）
 * @param {string} action - 动作描述，如"导出"、"提交"等
 * @param {object} options - 可选配置
 * @param {boolean} options.showToast - 是否显示Toast提示，默认true
 */
export function handleSelectionError(action, options = {}) {
	const { showToast = true } = options;
	
	const message = `请至少选择一项进行${action}`;
	
	if (showToast) {
		toast.warning(message);
	}
	
	return message;
}
