/**
 * @Author: 段春茂 2162105974@qq.com
 * @Date: 2025-07-24 9:30:00
 * @LastEditors: 段春茂 2162105974@qq.com
 * @LastEditTime: 2025-08-10 09:56:07
 * @FilePath: src\lib\components\MessageBox\MessageBox.js
 * @Description: MessageBox-消息弹窗函数式调用
 * @Copyright (c) 2025 by 广州近邻信息有限公司, All Rights Reserved.
 */
import MessageBox from './MessageBox.svelte';
import { mount, unmount } from 'svelte';

/**
 * @component MessageBox
 * @description 动态挂载一个消息弹窗组件
 *
 * @param {Object} options 配置项
 * @param {string} [options.title="温馨提示"] 弹窗标题
 * @param {string} [options.content=""] 弹窗内容
 * @param {boolean} [options.center=false] 是否居中显示内容
 * @param {string} [options.cancel_text="取消"] 取消按钮文本
 * @param {string} [options.confirm_text="确定"] 确认按钮文本
 * @param {boolean} [options.show_cancel_icon=true] 是否显示右上角取消图标
 * @param {boolean} [options.show_cancel_button=true] 是否显示取消按钮
 * @param {boolean} [options.show_confirm_button=true] 是否显示确认按钮
 * @param {boolean} [options.on_close_by_click_outside=true] 点击空白区域是否关闭弹窗
 * @param {'primary' | 'success' | 'danger' | 'warning' | 'info'} [options.type="primary"] 弹窗类型
 * @param {'primary' | 'success' | 'danger' | 'warning' | 'info'} [options.cancel_button_type="info"] 取消按钮类型
 * @param {'primary' | 'success' | 'danger' | 'warning' | 'info'} [options.confirm_button_type="primary"] 确认按钮类型
 * @param {Function} [options.onCancel] 点击取消的回调函数
 * @param {Function} [options.onConfirm] 点击确认的回调函数
 */
export default function ({
  title = '温馨提示',
  content = '',
  type = 'primary',
  center = false,
  cancel_text = '取消',
  confirm_text = '确定',
  show_cancel_icon = true,
  show_cancel_button = true,
  show_confirm_button = true,
  cancel_button_type = 'info',
  confirm_button_type = 'primary',
  on_close_by_click_outside = true,
  onCancel = () => {},
  onConfirm = () => {},
}) {
  const container = document.createElement('div');
  document.body.appendChild(container);

  let app = mount(MessageBox, {
    target: container,
    props: {
      visible: true,
      title,
      type,
      center,
      content,
      confirm_text,
      cancel_text,
      show_cancel_icon,
      cancel_button_type,
      show_cancel_button,
      show_confirm_button,
      confirm_button_type,
      on_close_by_click_outside,
      onCancel: async () => {
        await onCancel();
        unmount(app, { outro: true });
        container.remove();
      },
      onConfirm: async () => {
        await onConfirm();
        unmount(app, { outro: true });
        container.remove();
      },
    },
  });
}
