/**
 * @description 函数防抖
 * @param {Function} func   需要防抖的函数
 * @param {number} wait     延迟时间（毫秒）
 * @param {boolean} immediate   是否立即执行
 * @return {Function}   防抖后的函数
 */
export function debounce(func, wait, immediate) {
  let timeout, args, context, timestamp, result;

  const later = function () {
    // 据上一次触发时间间隔
    const last = +new Date() - timestamp;
    // 上次被包装函数被调用时间间隔 last 小于设定时间间隔 wait  
    if (last < wait && last > 0) {
      timeout = setTimeout(later, wait - last);
    } else {
      timeout = null;
      // 如果设定为immediate===true，因为开始边界已经调用过了此处无需调用
      if (!immediate) {
        result = func.apply(context, args);
        if (!timeout) context = args = null;
      }
    }
  };

  return function (...newArgs) {
    context = this;
    args = newArgs;
    timestamp = +new Date();
    const callNow = immediate && !timeout;
    // 如果延时不存在，重新设定延时
    if (!timeout) timeout = setTimeout(later, wait);
    if (callNow) {
      result = func.apply(context, args);
      context = args = null;
    }
    return result;
  };
}

/**
 *  @description 节流函数
 *  @param {Function} fn - 需要节流的函数
 *  @param {Number} wait - 延迟时间
 *  @return {Function} - 节流后的函数
 */
export function throttle(fn, wait = 100) {
  let lastTime = 0;
  return function (...args) {
    const now = Date.now();
    if (now - lastTime >= wait) {
      fn.apply(this, args);
      lastTime = now;
    }
  };
}
