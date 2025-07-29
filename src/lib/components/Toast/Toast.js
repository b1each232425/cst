
/**
 * @File: toast.js
 * @Description: Toast 提示调用封装，使用 mount 动态挂载 Toast 组件到页面中
 *
 * 作者：段春茂
 * 邮箱：2162105974@qq.com
 *
 * @Dependencies:
 * - Toast.svelte：Toast 组件，支持 message、type、duration 等参数
 * - svelte/mount：用于将组件挂载到任意 DOM 节点
 *
 * 样式要求：
 * 请确保项目中定义了 `.toast-container` 的样式，以便统一管理 Toast 弹窗容器的位置(这里已经定义在Toast.svelte中)
 *
 * 使用方式：
 * import { toast } from './toast.js';
 * toast.success('操作成功');
 * toast.error('请求失败', 5000);
 * toast.warning('请填写完整信息');
 *
 * @Function toast.success(msg: string, duration?: number)
 * @Function toast.error(msg: string, duration?: number)
 * @Function toast.warning(msg: string, duration?: number)
 */

import Toast from './Toast.svelte';
import { mount } from 'svelte';

let toastContainer;
function ensureContainer() {
  if (!toastContainer) {
    toastContainer = document.createElement('div');
    toastContainer.className = 'toast-container';
    document.body.appendChild(toastContainer);
  }
}
function showToast(message, type = 'success', duration = 3000) {
  ensureContainer();
  const container = document.createElement('div');
  toastContainer.appendChild(container);
  mount(Toast, {
    target: container,
    props: {
      message,
      type,
      duration,
    },
  });
  setTimeout(() => {
    container.remove();
  }, duration + 500);
  if (toastContainer && toastContainer.childElementCount === 0) {
    toastContainer = null;
    toastContainer.remove();
  }
}

export const toast = {
  success: (msg, duration = 3000) => showToast(msg, 'success', duration),
  error: (msg, duration = 3000) => showToast(msg, 'error', duration),
  warning: (msg, duration = 3000) => showToast(msg, 'warning', duration),
};

