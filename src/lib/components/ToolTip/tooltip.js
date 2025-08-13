/**
 * @Author: 段春茂 2162105974@qq.com
 * @Date: 2025-07-28 18:20:00
 * @LastEditors: 段春茂 2162105974@qq.com
 * @LastEditTime: 2025-08-12 18:00:00
 * @FilePath: src\lib\components\Tooltip\tooltip.js
 * @Description: tooltip-函数式组件
 * @Copyright (c) 2025 by 广州近邻信息有限公司, All Rights Reserved.
 */
import Tooltip from './Tooltip.svelte';
import { mount, unmount } from 'svelte';

let container;

function ensureContainer() {
  if (!container) {
    container = document.createElement('div');
    container.className = 'Tooltip-container';
    document.body.appendChild(container);
  }
}

/**
 * tooltip 气泡提示指令组件
 * @params
 * @param {Element} node - 被绑定 tooltip 的 DOM 元素（由 use:tooltip 自动传入）
 * @param {Object} options - tooltip 配置对象
 * @param {'top' | 'left' | 'right' | 'bottom'} [options.placement='bottom'] - 提示框位置
 * @param {string} [options.content=''] - 提示框显示内容（支持 HTML）
 * @param {string} [options.color='#ffffff'] - 提示框背景颜色
 * @param {'click' | 'hover'} [options.hide_method='hover'] - 隐藏方式
 * @param {boolean} [options.show_actions=false] - 是否显示操作按钮区域
 * @param {boolean} [options.show_title=false] - 是否显示标题栏
 * @param {boolean} [options.show_cancel=true] - 是否显示取消按钮
 * @param {string} [options.title=''] - 标题内容文本
 * @param {Function} [options.onConfirm] - 点击“确认”按钮后的回调
 * @param {Function} [options.onCancel] - 点击“取消”按钮后的回调
 * @param {string} [options.confirm_text='确定'] - “确认”按钮文本
 * @param {string} [options.cancel_text='取消'] - “取消”按钮文本
 *
 * @example use指令
 * <button use:tooltip={{ content: '提示内容', placement: 'top' }}>点击</button>
 * <button
 *   use:tooltip={{
 *     content: '这是提示信息',
 *     placement: 'bottom',
 *     hide_method: 'hover',
 *     show_actions: true,
 *     show_title: true,
 *     title: '提示标题',
 *     Confirm: () => console.log('确认'),
 *     Cancel: () => console.log('取消'),
 *   }}>
 *   悬停我看看
 * </button>
 */
export function tooltip(node, options) {
  if (!options?.content) return;
  ensureContainer();
  const TooltipInstance = mount(Tooltip, {
    target: container,
    props: {
      target: node,
      ...options,
    },
  });

  // 监听 node 是否从 DOM 移除
  const observer = new MutationObserver(() => {
    if (!document.body.contains(node)) {
      unmount(TooltipInstance);
      observer.disconnect();
    }
  });
  observer.observe(document.body, { childList: true, subtree: true });

  return () => {
    observer.disconnect();
  };
}
