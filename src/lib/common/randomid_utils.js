/**
 * //生成随机ID，用作临时ID
 * @returns {string}
 */
export function generateId() {
    // 现代浏览器原生API（更安全的随机数）
    if (typeof crypto !== 'undefined' && crypto.randomUUID) {
        return crypto.randomUUID().replace(/-/g, '').slice(0, 8);
    }
    
    // 兼容方案：时间戳 + 更可靠的随机数生成
    return `${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;
}