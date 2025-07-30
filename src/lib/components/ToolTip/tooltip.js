// @ts-nocheck
import tippy from "tippy.js";
import "tippy.js/dist/tippy.css";
import "tippy.js/themes/light.css";

export function tooltip(node, fn) {
  // 初始化 tippy 提示框
  const tooltip = tippy(node, fn());

  // 返回销毁函数
  return {
    destroy() {
      tooltip.destroy();
    },
  };
}
