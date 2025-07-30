/**
 * 防抖工具
 * @param {Function} fn 真正要执行的函数
 * @param {number} delay 等待毫秒数（默认 400）
 * @returns {Function} 防抖后的函数
 */
export function debounce(fn, delay = 400) {
  let timer;
  return function (...args) {
    clearTimeout(timer); // 清除上一次的定时器
    timer = setTimeout(() => fn.apply(this, args), delay);// 设置新的定时器
  };
}