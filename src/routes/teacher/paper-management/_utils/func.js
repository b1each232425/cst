// @ts-nocheck

import { tagColorList } from "./data";

// 获取 Unix 时间戳中的日期与时分
export function formatTimestamp(timestamp) {
    const date = new Date(timestamp);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0'); // 月份从 0 开始
    const day = String(date.getDate()).padStart(2, '0');
    const hour = String(date.getHours()).padStart(2, '0');
    const minute = String(date.getMinutes()).padStart(2, '0');
    return `${year}-${month}-${day} ${hour}:${minute}`;
}

// 获取 Unix 时间戳中的日期
export function formatDate(timestamp) {
	const date = new Date(timestamp);
	const year = date.getFullYear();
	const month = String(date.getMonth() + 1).padStart(2, '0');
	const day = String(date.getDate()).padStart(2, '0');
	return `${year}-${month}-${day}`;
}

// 封装的函数：根据标签名称计算颜色数组的索引
export function getColorIndex(tagName) {
    // 获取标签名称的第一个字符
    const firstChar = tagName.charAt(0);

    // 获取第一个字符的 Unicode 编码
    const charCode = firstChar.charCodeAt(0);

    // 计算并返回颜色数组的索引
    return charCode % tagColorList.length;
}

