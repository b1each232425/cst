// @ts-nocheck

import { TAG_COLOR_LIST } from "./data";

// 获取 Unix 时间戳中的日期与时分
export function formatTimestamp(timestamp) {
    const DATE = new Date(timestamp);
    const YEAR = DATE.getFullYear();
    const MONTH = String(DATE.getMonth() + 1).padStart(2, '0'); // 月份从 0 开始
    const DAY = String(DATE.getDate()).padStart(2, '0');
    const HOUR = String(DATE.getHours()).padStart(2, '0');
    const MINUTE = String(DATE.getMinutes()).padStart(2, '0');
    return `${YEAR}-${MONTH}-${DAY} ${HOUR}:${MINUTE}`;
}

// 获取 Unix 时间戳中的日期
export function formatDate(timestamp) {
	const DATE = new Date(timestamp);
	const YEAR = DATE.getFullYear();
	const MONTH = String(DATE.getMonth() + 1).padStart(2, '0');
	const DAY = String(DATE.getDate()).padStart(2, '0');
	return `${YEAR}-${MONTH}-${DAY}`;
}

// 根据标签名称计算颜色数组的索引
export function getColorIndex(tagName) {
    // 获取标签名称的第一个字符
    const FIRSTCHAR = tagName.charAt(0);

    // 获取第一个字符的 Unicode 编码
    const CHARCODE = FIRSTCHAR.charCodeAt(0);

    // 计算并返回颜色数组的索引
    return CHARCODE % TAG_COLOR_LIST.length;
}

// 将旧的展开状态恢复到新数据中
export function restoreOpenState(newGroups, oldGroups) {
  newGroups.forEach((newGroup, i) => {
    const OLD_GROUP = oldGroups?.find(g => g.id === newGroup.id);
    newGroup.isOpen = OLD_GROUP?.isOpen ?? true;

    newGroup.questions?.forEach((q, j) => {
      const OLD_QUESTION = OLD_GROUP?.questions?.find(oq => oq.id === q.id);
      q.isOpen = OLD_QUESTION?.isOpen ?? true;
    });
  });
}
