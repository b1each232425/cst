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