// @ts-nocheck

// 组卷方式转换
export const ASSEMBLY_TYPE_TRANS = {
    "00": "自定义组卷",
    "02": "随机组卷",
    "04": "智能刷题",
};
// 试卷用途转换
export const CATEGORY_TRANS = {
    "00": "考试",
    "02": "练习",
};
// 试卷难度转换
export const LEVEL_TRANS = {
    "00": "简单",
    "02": "中等",
    "04": "困难",

    "简单": "easy-level",
    "中等": "normal-level",
    "困难": "hard-level",
};
// 共享状态转换
export const ACCESS_MODE_TRANS = {
    "00": "私有",
    "02": "共享",
    "04": "公开",

    "私有": "info",
    "共享": "primary",
    "公开": "success",
};

// 标签颜色
export const TAG_COLOR_LIST = [
    "#40d5ff", "#59dcff", "#33c1e8", "#6adbff", "#26caef",
    "#4dd6eb", "#6dcaf2", "#52c2ff", "#7fd3f3", "#47d0db",
    "#5bc8f2", "#40c4e0", "#72deff", "#4fd4d9", "#83def5",
    "#ffa040", "#ffb359", "#ffc26d", "#ffcf85", "#ff9eac",
    "#ffb3c0", "#ffc6d1", "#ffd9e0", "#c6ff8c", "#d9ff99",
    "#e0ffb3", "#e6ffcc"
];

// 题目类型转换
export const QUESTION_TYPE_TRANS = {
    "00": "单选题",
    "02": "多选题",
    "04": "判断题",
    "06": "填空题",
    "08": "简答题",
    "10": "编程题"
};

// 题目难度转换
export const DIFFICULTY_TRANS = {
    1 : "简单",
    2 : "中等",
    3 : "困难",

    "简单": "easy-level",
    "中等": "normal-level",
    "困难": "hard-level"
};

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