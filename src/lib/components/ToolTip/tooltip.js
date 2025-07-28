// @ts-nocheck
import tippy from 'tippy.js';
import 'tippy.js/dist/tippy.css';
import 'tippy.js/themes/light.css';

export function tooltip(node, fn) {
  // 获取传入的数据
  let content = fn.text;
  let theme = fn.theme || 'light';

  let tippyObject = { content, theme };

  // 初始化 tippy 提示框
  const tooltip = tippy(node, tippyObject);

  // 返回销毁函数
  return {
    destroy() {
      tooltip.destroy();
    },
  };
}
