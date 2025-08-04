/**
 * @directive tooltip
 * @description Svelte 气泡提示指令，用于绑定 tooltip 到任意元素上。
 *
 * @params
 * @param {Element} node - 被绑定 tooltip 的 DOM 元素（由 use:tooltip 自动传入）
 * @param {Object} options - tooltip 配置对象
 * @param {'top' | 'left' | 'right' | 'bottom'} [options.placement='bottom'] - 提示框位置
 * @param {string} [options.content=''] - 提示框显示内容（支持 HTML）
 * @param {string} [options.color='#ffffff'] - 提示框背景颜色
 * @param {'click' | 'hover'} [options.hide_method='hover'] - 隐藏方式
 * @param {boolean} [options.showActions=false] - 是否显示操作按钮区域
 * @param {boolean} [options.showTitle=false] - 是否显示标题栏
 * @param {boolean} [options.showCancel=true] - 是否显示取消按钮
 * @param {string} [options.title=''] - 标题内容文本
 * @param {Function} [options.onConfirm] - 点击“确认”按钮后的回调
 * @param {Function} [options.onCancel] - 点击“取消”按钮后的回调
 * @param {string} [options.onConfirmText='确定'] - “确认”按钮文本
 * @param {string} [options.onCancelText='取消'] - “取消”按钮文本
 *
 * @example 方法一:use指令
 * <button use:tooltip={{ content: '提示内容', placement: 'top' }}>点击</button>
 * <button
 *   use:tooltip={{
 *     content: '这是提示信息',
 *     placement: 'bottom',
 *     hide_method: 'hover',
 *     showActions: true,
 *     showTitle: true,
 *     title: '提示标题',
 *     onConfirm: () => console.log('确认'),
 *     onCancel: () => console.log('取消'),
 *   }}>
 *   悬停我看看
 * </button>
 * @example 方法二:绑定dom
 * let h1Element;
 * onMount(() => {
 * tooltip(h1Element, {
 *    content: '你好,这个是一条信息提示3333333333333',
 *  });
 *});
 * // ......
 *<button bind:this={h1Element}>Tooltip 组件</button>
 *
 * @remarks
 * - 必须传入 `content`，否则 tooltip 不会显示。
 * - 支持 hover 和 click 两种交互方式。
 * - 气泡自动根据位置计算，支持多个同时存在。
 * - 鼠标移入/点击控制显示，支持销毁卸载、定位刷新。
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
