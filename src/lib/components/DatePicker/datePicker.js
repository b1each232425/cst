// @ts-nocheck
// 格式化日期的工具函数
export const formatDate = (date) => {
  if (!date) return '';
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')} ${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
};

export function setupTimeColumnScroll(node, params) {
  const [type, isStart] = params;

  const handleScroll = () => {
    const buttons = node.querySelectorAll('button');
    if (buttons.length === 0) return;

    const firstButton = buttons[0];
    const lastButton = buttons[buttons.length - 1];
    const firstRect = firstButton.getBoundingClientRect();
    const lastRect = lastButton.getBoundingClientRect();
    const columnRect = node.getBoundingClientRect();

    // 如果滚动到顶部，跳转到底部
    if (firstRect.top > columnRect.top) {
      setTimeout(() => {
        lastButton.scrollIntoView();
      }, 50);
    }
    // 如果滚动到底部，跳转到顶部
    else if (lastRect.bottom < columnRect.bottom) {
      setTimeout(() => {
        firstButton.scrollIntoView();
      }, 50);
    }
  };

  node.addEventListener('scroll', handleScroll);

  return {
    destroy() {
      node.removeEventListener('scroll', handleScroll);
    },
  };
}
