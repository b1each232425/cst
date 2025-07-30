/**
 * 防抖函数
 * @param {Function} fn 真正要执行的函数
 * @param {number} delay 等待毫秒数（默认 400）
 * @returns {Function} 防抖后的函数
 */
export function debounce(fn, delay = 400) {
  let timer;
  return function (...args) {
    clearTimeout(timer);
    timer = setTimeout(() => fn.apply(this, args), delay);
  };
}