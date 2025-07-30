/**
 * 气泡提示指令说明（tooltip.js）
 *
 * 作者：段春茂
 * 邮箱：2162105974@qq.com
 *
 * 参数配置：
 * @param {Element} node             - 触发 tooltip 的 DOM 元素（由 use:tooltip 自动传入）
 * @param {Object} options           - tooltip 配置对象
 * @param {String} options.placement - 提示框位置，可选: 'top' | 'left' | 'right' | 'bottom'，默认: 'bottom'
 * @param {String} options.content   - 提示框显示的内容（支持 HTML）
 * @param {String} options.color     - 提示框背景色，默认: '#ffffff'
 * @param {String} options.hide_method - 隐藏方式，可选: 'click' | 'hover'，默认: 'hover'
 * @param {Boolean} options.showActions - 是否显示操作按钮（确认/取消），默认: false
 * @param {Boolean} options.showTitle   - 是否显示标题，默认: false
 * @param {Boolean} options.showCancel  - 是否显示取消按钮，默认: true
 * @param {String} options.title        - 标题内容
 * @param {Function} options.onConfirm  - 点击确认按钮的回调
 * @param {Function} options.onCancel   - 点击取消按钮的回调
 * @param {String} options.onConfirmText - 确认按钮文本，默认: '确认'
 * @param {String} options.onCancelText  - 取消按钮文本，默认: '取消'
 *
 * 功能说明：
 * - 用于通过 Svelte 的 `use:` 指令将 tooltip 气泡绑定到任意元素上
 * - 支持 hover 和 click 两种交互方式
 * - 气泡自动根据位置计算，支持多个同时存在
 * - 鼠标移入/点击控制显示，支持销毁卸载、定位刷新
 * - 支持实时更新配置项，并自动挂载到 body 上的固定容器中
 *
 * 使用示例：
 * <button use:tooltip={{ content: '提示内容', placement: 'top' }}>点击</button>
 *
 * <button
 *   use:tooltip={{
 *     content: '这是提示信息',
 *     placement: 'bottom',
 *     hide_method: 'hover',
 *     showActions: true,
 *     showTitle: true,
 *     title: '提示标题',
 *     onConfirm: () => { console.log('确认') },
 *     onCancel: () => { console.log('取消') },
 *   }}>
 *   悬停我看看
 * </button>
 *
 * 注意事项：
 * - 该指令用于函数式挂载 Tooltip.svelte 组件
 * - 必须传入 content，否则 tooltip 不会渲染
 * - 所有选项会通过 props 传入 Tooltip.svelte
 */
import Tooltip from './Tooltip.svelte';
import { mount } from 'svelte';

let container;
function ensureContainer() {
  if (!container) {
    container = document.createElement('div');
    container.className = 'Tooltip-container';
    document.body.appendChild(container);
  }
}

export function tooltip(node, options) {
  if (!options?.content) return;
  console.dir(node);

  let instance;
  const mountTooltip = () => {
    ensureContainer();
    instance = mount(Tooltip, {
      target: container,
      props: {
        target: node,
        ...options,
      },
    });
  };
  mountTooltip();
  return {
    update(newOptions) {
      if (instance?.$set && newOptions) {
        instance.$set({ ...newOptions, target: node });
      }
    },
    destroy() {
      if (instance?.$destroy) {
        instance.$destroy();
        instance = null;
      }
    },
  };
}
