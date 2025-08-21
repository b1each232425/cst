import { screen, fireEvent, cleanup, waitFor } from '@testing-library/svelte';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import messagebox from '../MessageBox.js';

/**
 * MessageBox 组件测试（MessageBox.svelte 与 MessageBox函数式调用）
 */
describe('MessageBox 组件测试', () => {
  /**
   * 清除测试环境
   */
  beforeEach(() => {
    cleanup(); // 清除通过 render 挂载的组件
    document.body.innerHTML = ''; // 清空函数式调用生成的 DOM
    vi.restoreAllMocks(); // 还原 console.warn 等 mock
  });

  /**
   * 测试基本渲染情况
   */
  it('测试基本渲染情况', async () => {
    // 调用messagebox函数渲染MessageBox组件
    messagebox({});

    // 验证组件是否渲染成功，通过获取定位是否又遮罩层的testid
    expect(screen.getByTestId('messagebox_shadow')).toBeInTheDocument();

    // 测试是否有默认标题温馨提示，确定，取消按钮
    expect(screen.getByText('温馨提示')).toBeInTheDocument;
    expect(screen.getByText('确定')).toBeInTheDocument;
    expect(screen.getByText('取消')).toBeInTheDocument;

    // 测试点击遮罩层关闭组件
    await fireEvent.click(screen.getByTestId('messagebox_shadow'));
    // 验证组件是否已关闭
    expect(screen.queryByTestId('messagebox_shadow')).not.toBeInTheDocument();

    // 调用messagebox函数渲染MessageBox组件
    messagebox({});

    // 测试点击按钮也能关闭组件
    await fireEvent.click(screen.getByText('取消'));
    // 验证组件是否已关闭
    expect(screen.queryByTestId('messagebox_shadow')).not.toBeInTheDocument();

    // 调用messagebox函数渲染MessageBox组件
    messagebox({});

    // 测试点击按钮也能关闭组件
    await fireEvent.click(screen.getByText('确定'));
    // 验证组件是否已关闭
    expect(screen.queryByTestId('messagebox_shadow')).not.toBeInTheDocument();
  });

  /**
   * 测试title属性
   */
  it('应该能渲染正常传入的字符串title属性值', async () => {
    // 调用messagebox函数渲染MessageBox组件
    messagebox({ title: '温馨提示，我是title属性值' });
    // 验证是否渲染成功
    expect(screen.getByText('温馨提示，我是title属性值')).toBeInTheDocument();

    // 调用messagebox函数渲染MessageBox组件
    messagebox({ title: '测试title属性' });

    // 验证是否渲染成功
    expect(screen.getByText('测试title属性')).toBeInTheDocument();
  });

  it('应该能渲染传入非正常值title属性值为undefined,组件内部使用默认值,组件使用默认值,svelte的机制让其值为默认值', async () => {
    // 调用messagebox函数渲染MessageBox组件
    messagebox({ title: undefined });

    // 验证是否渲染成功,默认值
    expect(screen.getByText('温馨提示')).toBeInTheDocument();
  });

  it('应该能渲染传入非正常值title属性值为null,组件内部使用默认值,并在控制台提示相应警告信息', async () => {
    const spy = vi.spyOn(console, 'warn');

    // 调用messagebox函数渲染MessageBox组件
    messagebox({ title: null });

    // 验证是否渲染成功,默认值
    expect(screen.getByText('温馨提示')).toBeInTheDocument();

    // 验证是否渲染成功,默认值,并在控制台提示相应警告信息
    expect(spy).toHaveBeenCalled();
    expect(spy).toHaveBeenCalledWith("[MessageBox] 属性 'title' 无效: 类型错误,期望类型为string,实际类型为null, 已使用默认值 '温馨提示', 传入值为: 'null'");
  });

  it('应该能渲染传入非正常值title属性值为NaN,组件内部使用默认值,并在控制台提示相应警告信息', async () => {
    const spy = vi.spyOn(console, 'warn');

    // 调用messagebox函数渲染MessageBox组件
    messagebox({ title: NaN });

    // 验证是否渲染成功,默认值
    expect(screen.getByText('温馨提示')).toBeInTheDocument();

    // 验证是否渲染成功,默认值,并在控制台提示相应警告信息
    expect(spy).toHaveBeenCalled();
    expect(spy).toHaveBeenCalledWith("[MessageBox] 属性 'title' 无效: 类型错误,期望类型为string,实际类型为number, 已使用默认值 '温馨提示', 传入值为: 'NaN'");
  });

  it('应该能渲染传入非正常值title属性值为0,组件内部使用默认值,并在控制台提示相应警告信息', async () => {
    const spy = vi.spyOn(console, 'warn');

    // 调用messagebox函数渲染MessageBox组件
    messagebox({ title: 0 });

    // 验证是否渲染成功,默认值
    expect(screen.getByText('温馨提示')).toBeInTheDocument();

    // 验证是否渲染成功,默认值,并在控制台提示相应警告信息
    expect(spy).toHaveBeenCalled();
    expect(spy).toHaveBeenCalledWith("[MessageBox] 属性 'title' 无效: 类型错误,期望类型为string,实际类型为number, 已使用默认值 '温馨提示', 传入值为: '0'");
  });

  it("应该能渲染传入非正常值title属性值为'',组件内部使用默认值,并在控制台提示相应警告信息", async () => {
    const spy = vi.spyOn(console, 'warn');

    // 调用messagebox函数渲染MessageBox组件
    messagebox({ title: '' });

    // 验证是否渲染成功,默认值
    expect(screen.getByText('温馨提示')).toBeInTheDocument();

    // 验证是否渲染成功,默认值,并在控制台提示相应警告信息
    expect(spy).toHaveBeenCalled();
    expect(spy).toHaveBeenCalledWith("[MessageBox] 属性 'title' 无效: title 不能为空, 已使用默认值 '温馨提示', 传入值为: ''");
  });

  /**
   * 测试content属性
   */
  it('应该能渲染正常传入的string字符串content属性值', async () => {
    // 调用messagebox函数渲染MessageBox组件
    messagebox({ content: '温馨提示，我是content属性值' });
    // 验证是否渲染成功
    expect(screen.getByText('温馨提示，我是content属性值')).toBeInTheDocument();

    // 调用messagebox函数渲染MessageBox组件
    messagebox({ content: '测试content属性' });
    // 验证是否渲染成功
    expect(screen.getByText('测试content属性')).toBeInTheDocument();
  });

  it('应该能渲染传入非正常值content属性值为undefined,组件内部使用默认值,svelte的机制让其值为默认值', async () => {
    const spy = vi.spyOn(console, 'warn');

    // 调用messagebox函数渲染MessageBox组件
    messagebox({ content: undefined });

    // 验证是否渲染成功,默认值
    expect(screen.getByText('温馨提示')).toBeInTheDocument();

    // 检查控制台信息
    expect(spy).not.toHaveBeenCalled();
  });

  it('应该能渲染传入非正常值content属性值为null,组件内部使用默认值,并在控制台提示相应警告信息', async () => {
    const spy = vi.spyOn(console, 'warn');

    // 调用messagebox函数渲染MessageBox组件
    messagebox({ content: null });

    // 验证是否渲染成功,默认值,并在控制台提示相应警告信息
    expect(spy).toHaveBeenCalled();
    expect(spy).toHaveBeenCalledWith("[MessageBox] 属性 'content' 无效: 类型错误,期望类型为string,实际类型为null, 已使用默认值 '', 传入值为: 'null'");
  });

  it('应该能渲染传入非正常值content属性值为NaN,组件内部使用默认值,并在控制台提示相应警告信息', async () => {
    const spy = vi.spyOn(console, 'warn');

    // 调用messagebox函数渲染MessageBox组件
    messagebox({ content: NaN });

    // 验证是否渲染成功,默认值,并在控制台提示相应警告信息
    expect(screen.getByText('温馨提示')).toBeInTheDocument();

    expect(spy).toHaveBeenCalled();
    expect(spy).toHaveBeenCalledWith("[MessageBox] 属性 'content' 无效: 类型错误,期望类型为string,实际类型为number, 已使用默认值 '', 传入值为: 'NaN'");
  });

  it('应该能渲染传入非正常值content属性值为0,组件内部使用默认值,并在控制台提示相应警告信息', async () => {
    const spy = vi.spyOn(console, 'warn');

    // 调用messagebox函数渲染MessageBox组件
    messagebox({ content: 0 });

    // 验证是否渲染成功,默认值,并在控制台提示相应警告信息
    expect(screen.getByText('温馨提示')).toBeInTheDocument();

    expect(spy).toHaveBeenCalled();
    expect(spy).toHaveBeenCalledWith("[MessageBox] 属性 'content' 无效: 类型错误,期望类型为string,实际类型为number, 已使用默认值 '', 传入值为: '0'");
  });

  it("应该能渲染传入正常值content属性值为'',组件内部使用默认值也是'',能正常显示", async () => {
    const spy = vi.spyOn(console, 'warn');

    // 调用messagebox函数渲染MessageBox组件
    messagebox({ content: '' });

    // 验证是否渲染成功,默认值''
    expect(screen.getByText('温馨提示')).toBeInTheDocument();

    expect(spy).not.toHaveBeenCalled();
  });

  /**
   * 测试center属性
   */
  it('应该能渲染正常传入的布尔类型center属性值', async () => {
    // 调用messagebox函数渲染MessageBox组件
    messagebox({ center: true, content: '温馨提示,我是center属性值', title: '温馨提示' });

    // 验证是否渲染成功
    expect(screen.getByText('温馨提示,我是center属性值')).toBeInTheDocument();
    expect(screen.getByText('确定')).toBeInTheDocument();
    expect(screen.getByText('取消')).toBeInTheDocument();
    expect(screen.getByText('温馨提示')).toBeInTheDocument();

    // 应该会有一些默认的样式，比如文字居中，按钮居中等
    expect(screen.getByText('温馨提示')).toHaveClass('is-center');
    expect(screen.getByTestId('messagebox_buttons')).toHaveClass('MessageBox__buttons--center');

    // 关闭弹窗，测试center属性为false
    await screen.getByTestId('messagebox_closeBtn').click();
    messagebox({ center: false, content: '温馨提示,我是center属性值', title: '温馨提示' });

    // 验证是否渲染成功
    expect(screen.getByText('温馨提示,我是center属性值')).toBeInTheDocument();
    expect(screen.getByText('确定')).toBeInTheDocument();
    expect(screen.getByText('取消')).toBeInTheDocument();
    expect(screen.getByText('温馨提示')).toBeInTheDocument();

    // 应该不会有一些默认的样式，比如文字居中，按钮居中等
    expect(screen.getByTestId('messagebox_buttons')).not.toHaveClass('MessageBox__buttons--center');
    expect(screen.getByText('温馨提示')).not.toHaveClass('is-center');
  });

  it('应该能渲染传入非正常值center属性值为undefined,组件内部使用默认值flase,svelte的机制让其值为默认值', async () => {
    const spy = vi.spyOn(console, 'warn');
    // 调用messagebox函数渲染MessageBox组件
    messagebox({ center: undefined, content: '温馨提示,我是center属性值', title: '温馨提示' });

    // 验证是否渲染成功,默认值,并在控制台提示相应警告信息
    expect(spy).not.toHaveBeenCalled();
  });

  it('应该能渲染传入非正常值center属性值为null,组件内部使用默认值false,并在控制台提示相应警告信息', async () => {
    const spy = vi.spyOn(console, 'warn');
    // 调用messagebox函数渲染MessageBox组件
    messagebox({ center: null, content: '温馨提示,我是center属性值', title: '温馨提示' });

    // 校验是否有class类名，应该不会有一些默认的样式，比如文字居中，按钮居中等
    expect(screen.getByTestId('messagebox_buttons')).not.toHaveClass('MessageBox__buttons--center');
    expect(screen.getByText('温馨提示')).not.toHaveClass('is-center');

    // 在控制台提示相应警告信息
    expect(spy).toHaveBeenCalled();
    expect(spy).toHaveBeenCalledWith("[MessageBox] 属性 'center' 无效: 类型错误,期望类型为boolean,实际类型为null, 已使用默认值 'false', 传入值为: 'null'");
  });

  it('应该能渲染传入非正常值center属性值为NaN,组件内部使用默认值false,并在控制台提示相应警告信息', async () => {
    const spy = vi.spyOn(console, 'warn');
    // 调用messagebox函数渲染MessageBox组件
    messagebox({ center: NaN, content: '温馨提示,我是center属性值', title: '温馨提示' });

    // 校验是否有class类名，应该不会有一些默认的样式，比如文字居中，按钮居中等
    expect(screen.getByTestId('messagebox_buttons')).not.toHaveClass('MessageBox__buttons--center');
    expect(screen.getByText('温馨提示')).not.toHaveClass('is-center');

    // 在控制台提示相应警告信息
    expect(spy).toHaveBeenCalled();
    expect(spy).toHaveBeenCalledWith("[MessageBox] 属性 'center' 无效: 类型错误,期望类型为boolean,实际类型为number, 已使用默认值 'false', 传入值为: 'NaN'");
  });

  it('应该能渲染传入非正常值center属性值为0,组件内部使用默认值false,并在控制台提示相应警告信息', async () => {
    const spy = vi.spyOn(console, 'warn');
    // 调用messagebox函数渲染MessageBox组件
    messagebox({ center: 0, content: '温馨提示,我是center属性值', title: '温馨提示' });

    // 校验是否有class类名，应该不会有一些默认的样式，比如文字居中，按钮居中等
    expect(screen.getByTestId('messagebox_buttons')).not.toHaveClass('MessageBox__buttons--center');

    // 在控制台提示相应警告信息
    expect(spy).toHaveBeenCalled();
    expect(spy).toHaveBeenCalledWith("[MessageBox] 属性 'center' 无效: 类型错误,期望类型为boolean,实际类型为number, 已使用默认值 'false', 传入值为: '0'");
  });

  it("应该能渲染传入非正常值center属性值为'',组件内部使用默认值flase,并在控制台提示相应警告信息", async () => {
    const spy = vi.spyOn(console, 'warn');
    // 调用messagebox函数渲染MessageBox组件
    messagebox({ center: '', content: '温馨提示,我是center属性值', title: '温馨提示' });

    // 校验是否有class类名，应该不会有一些默认的样式，比如文字居中，按钮居中等
    expect(screen.getByTestId('messagebox_buttons')).not.toHaveClass('MessageBox__buttons--center');
    expect(screen.getByText('温馨提示')).not.toHaveClass('is-center');

    // 在控制台提示相应警告信息
    expect(spy).toHaveBeenCalled();
    expect(spy).toHaveBeenCalledWith("[MessageBox] 属性 'center' 无效: 类型错误,期望类型为boolean,实际类型为string, 已使用默认值 'false', 传入值为: ''");
  });

  /**
   * 测试show_cancel_button属性
   */
  it('应该能渲染正常传入的布尔类型show_cancel_button属性值', async () => {
    // 调用messagebox函数渲染MessageBox组件
    messagebox({
      show_cancel_button: true,
      cancel_text: '这个是取消按钮',
      content: '温馨提示,我是show_cancel_button属性值',
      title: '温馨提示',
    });

    // 验证是否渲染成功
    expect(screen.getByText('这个是取消按钮')).toBeInTheDocument();

    // 关闭弹窗，测试show_cancel_button属性为false
    await screen.getByTestId('messagebox_closeBtn').click();

    // 调用messagebox函数渲染MessageBox组件
    messagebox({
      show_cancel_button: false,
      cancel_text: '这个是取消按钮',
      content: '温馨提示,我是show_cancel_button属性值',
      title: '温馨提示',
    });

    // 应该不会渲染取消按钮
    expect(screen.queryByText('这个是取消按钮')).not.toBeInTheDocument();
  });

  it('应该能渲染传入非正常值show_cancel_button属性值为undefined,组件内部使用默认值true,svelte的机制让其值为默认值', async () => {
    // 调用messagebox函数渲染MessageBox组件
    messagebox({ show_cancel_button: undefined, cancel_text: '这个是取消按钮' });

    // 验证是否渲染成功,默认值

    expect(screen.getByText('这个是取消按钮')).toBeInTheDocument();
  });

  it('应该能渲染传入非正常值show_cancel_button属性值为null,组件内部使用默认值,并在控制台提示相应警告信息', async () => {
    const spy = vi.spyOn(console, 'warn');
    // 调用messagebox函数渲染MessageBox组件
    messagebox({ show_cancel_button: null, cancel_text: '这个是取消按钮' });

    // 验证是否渲染成功,默认值
    expect(screen.getByText('这个是取消按钮')).toBeInTheDocument();

    // 在控制台提示相应警告信息
    expect(spy).toHaveBeenCalled();
    expect(spy).toHaveBeenCalledWith("[MessageBox] 属性 'show_cancel_button' 无效: 类型错误,期望类型为boolean,实际类型为null, 已使用默认值 'true', 传入值为: 'null'");
  });

  it('应该能渲染传入非正常值show_cancel_button属性值为NaN,组件内部使用默认值,并在控制台提示相应警告信息', async () => {
    const spy = vi.spyOn(console, 'warn');
    // 调用messagebox函数渲染MessageBox组件
    messagebox({ show_cancel_button: NaN, cancel_text: '这个是取消按钮' });

    // 验证是否渲染成功,默认值
    expect(screen.getByText('这个是取消按钮')).toBeInTheDocument();

    // 在控制台提示相应警告信息
    expect(spy).toHaveBeenCalled();
    expect(spy).toHaveBeenCalledWith("[MessageBox] 属性 'show_cancel_button' 无效: 类型错误,期望类型为boolean,实际类型为number, 已使用默认值 'true', 传入值为: 'NaN'");
  });

  it('应该能渲染传入非正常值show_cancel_button属性值为0,组件内部使用默认值,并在控制台提示相应警告信息', async () => {
    const spy = vi.spyOn(console, 'warn');
    // 调用messagebox函数渲染MessageBox组件
    messagebox({ show_cancel_button: 0, cancel_text: '这个是取消按钮' });

    // 验证是否渲染成功,默认值
    expect(screen.getByText('这个是取消按钮')).toBeInTheDocument();

    // 在控制台提示相应警告信息
    expect(spy).toHaveBeenCalled();
    expect(spy).toHaveBeenCalledWith("[MessageBox] 属性 'show_cancel_button' 无效: 类型错误,期望类型为boolean,实际类型为number, 已使用默认值 'true', 传入值为: '0'");
  });

  it("应该能渲染传入非正常值show_cancel_button属性值为'',组件内部使用默认值,并在控制台提示相应警告信息", async () => {
    const spy = vi.spyOn(console, 'warn');
    // 调用messagebox函数渲染MessageBox组件
    messagebox({ show_cancel_button: '', cancel_text: '这个是取消按钮' });

    // 验证是否渲染成功,默认值
    expect(screen.getByText('这个是取消按钮')).toBeInTheDocument();

    // 在控制台提示相应警告信息
    expect(spy).toHaveBeenCalled();
    expect(spy).toHaveBeenCalledWith("[MessageBox] 属性 'show_cancel_button' 无效: 类型错误,期望类型为boolean,实际类型为string, 已使用默认值 'true', 传入值为: ''");
  });

  /**
   * 测试show_confirm_button属性
   */
  it('应该能渲染正常传入的布尔类型show_confirm_button属性值', async () => {
    // 调用messagebox函数渲染MessageBox组件
    messagebox({
      show_confirm_button: true,
      confirm_text: '这个是确认按钮',
      content: '温馨提示,我是show_confirm_button属性值',
      title: '温馨提示',
    });

    // 验证是否渲染成功
    expect(screen.getByText('这个是确认按钮')).toBeInTheDocument();
    expect(screen.getByText('温馨提示,我是show_confirm_button属性值')).toBeInTheDocument();
    expect(screen.getByText('温馨提示')).toBeInTheDocument();

    // 关闭弹窗，测试show_confirm_button属性为false
    await screen.getByTestId('messagebox_closeBtn').click();

    // 调用messagebox函数渲染MessageBox组件
    messagebox({
      show_confirm_button: false,
      confirm_text: '这个是确认按钮',
    });

    // 验证是否渲染成功
    expect(screen.queryByText('这个是确认按钮')).not.toBeInTheDocument();
  });

  it('应该能渲染传入非正常值show_confirm_button属性值为undefined,组件内部使用默认值true,svelte的机制让其值为默认值', async () => {
    // 调用messagebox函数渲染MessageBox组件
    messagebox({ show_confirm_button: undefined, confirm_text: '这个是确认按钮' });

    // 验证是否渲染成功,默认值
    expect(screen.getByText('这个是确认按钮')).toBeInTheDocument();
  });

  it('应该能渲染传入非正常值show_confirm_button属性值为null,组件内部使用默认值,并在控制台提示相应警告信息', async () => {
    const spy = vi.spyOn(console, 'warn');
    // 调用messagebox函数渲染MessageBox组件
    messagebox({ show_confirm_button: null, confirm_text: '这个是确认按钮' });

    // 验证是否渲染成功,默认值
    expect(screen.getByText('这个是确认按钮')).toBeInTheDocument();

    // 在控制台提示相应警告信息
    expect(spy).toHaveBeenCalled();
    expect(spy).toHaveBeenCalledWith("[MessageBox] 属性 'show_confirm_button' 无效: 类型错误,期望类型为boolean,实际类型为null, 已使用默认值 'true', 传入值为: 'null'");
  });

  it('应该能渲染传入非正常值show_confirm_button属性值为NaN,组件内部使用默认值,并在控制台提示相应警告信息', async () => {
    const spy = vi.spyOn(console, 'warn');
    // 调用messagebox函数渲染MessageBox组件
    messagebox({ show_confirm_button: NaN, confirm_text: '这个是确认按钮' });

    // 验证是否渲染成功,默认值
    expect(screen.getByText('这个是确认按钮')).toBeInTheDocument();

    // 在控制台提示相应警告信息
    expect(spy).toHaveBeenCalled();
    expect(spy).toHaveBeenCalledWith("[MessageBox] 属性 'show_confirm_button' 无效: 类型错误,期望类型为boolean,实际类型为number, 已使用默认值 'true', 传入值为: 'NaN'");
  });

  it('应该能渲染传入非正常值show_confirm_button属性值为0,组件内部使用默认值,并在控制台提示相应警告信息', async () => {
    const spy = vi.spyOn(console, 'warn');
    // 调用messagebox函数渲染MessageBox组件
    messagebox({ show_confirm_button: 0, confirm_text: '这个是确认按钮' });

    // 验证是否渲染成功,默认值
    expect(screen.getByText('这个是确认按钮')).toBeInTheDocument();

    // 在控制台提示相应警告信息
    expect(spy).toHaveBeenCalled();
    expect(spy).toHaveBeenCalledWith("[MessageBox] 属性 'show_confirm_button' 无效: 类型错误,期望类型为boolean,实际类型为number, 已使用默认值 'true', 传入值为: '0'");
  });

  it("应该能渲染传入非正常值show_confirm_button属性值为'',组件内部使用默认值,并在控制台提示相应警告信息", async () => {
    const spy = vi.spyOn(console, 'warn');
    // 调用messagebox函数渲染MessageBox组件
    messagebox({ show_confirm_button: '', confirm_text: '这个是确认按钮' });

    // 验证是否渲染成功,默认值true
    expect(screen.getByText('这个是确认按钮')).toBeInTheDocument();

    // 在控制台提示相应警告信息
    expect(spy).toHaveBeenCalled();
    expect(spy).toHaveBeenCalledWith("[MessageBox] 属性 'show_confirm_button' 无效: 类型错误,期望类型为boolean,实际类型为string, 已使用默认值 'true', 传入值为: ''");
  });

  /**
   * 测试cancel_text属性
   */
  it('应该能渲染正常传入的string字符串cancel_text属性值', async () => {
    // 调用messagebox函数渲染MessageBox组件
    messagebox({ cancel_text: '这个是取消按钮' });

    // 验证是否渲染成功
    expect(screen.getByText('这个是取消按钮')).toBeInTheDocument();

    // 关闭弹窗
    await screen.getByTestId('messagebox_closeBtn').click();

    // 验证是否关闭成功
    expect(screen.queryByText('这个是取消按钮')).not.toBeInTheDocument();

    // 调用messagebox函数渲染MessageBox组件
    messagebox({ cancel_text: 'no' });

    // 验证是否渲染成功
    expect(screen.getByText('no')).toBeInTheDocument();
  });

  it('应该能渲染传入非正常值cancel_text属性值为undefined,组件内部使用默认值‘取消’,svelte的机制让其值为默认值', async () => {
    // 调用messagebox函数渲染MessageBox组件
    messagebox({ cancel_text: undefined });

    // 验证是否渲染成功
    expect(screen.getByText('取消')).toBeInTheDocument();
  });

  it('应该能渲染传入非正常值cancel_text属性值为null,组件内部使用默认值,并在控制台提示相应警告信息', async () => {
    const spy = vi.spyOn(console, 'warn');
    // 调用messagebox函数渲染MessageBox组件
    messagebox({ cancel_text: null });

    // 应该会渲染默认值‘取消’
    expect(screen.getByText('取消')).toBeInTheDocument();

    // 在控制台提示相应警告信息
    expect(spy).toHaveBeenCalled();
    expect(spy).toHaveBeenCalledWith("[MessageBox] 属性 'cancel_text' 无效: 类型错误,期望类型为string,实际类型为null, 已使用默认值 '取消', 传入值为: 'null'");
  });

  it('应该能渲染传入非正常值cancel_text属性值为NaN,组件内部使用默认值,并在控制台提示相应警告信息', async () => {
    const spy = vi.spyOn(console, 'warn');
    // 调用messagebox函数渲染MessageBox组件
    messagebox({ cancel_text: NaN });

    // 应该会渲染默认值‘取消’
    expect(screen.getByText('取消')).toBeInTheDocument();

    // 在控制台提示相应警告信息
    expect(spy).toHaveBeenCalled();
    expect(spy).toHaveBeenCalledWith("[MessageBox] 属性 'cancel_text' 无效: 类型错误,期望类型为string,实际类型为number, 已使用默认值 '取消', 传入值为: 'NaN'");
  });

  it('应该能渲染传入非正常值cancel_text属性值为0,组件内部使用默认值,并在控制台提示相应警告信息', async () => {
    const spy = vi.spyOn(console, 'warn');
    // 调用messagebox函数渲染MessageBox组件
    messagebox({ cancel_text: 0 });

    // 应该会渲染默认值‘取消’
    expect(screen.getByText('取消')).toBeInTheDocument();

    // 在控制台提示相应警告信息
    expect(spy).toHaveBeenCalled();
    expect(spy).toHaveBeenCalledWith("[MessageBox] 属性 'cancel_text' 无效: 类型错误,期望类型为string,实际类型为number, 已使用默认值 '取消', 传入值为: '0'");
  });

  it("应该能渲染传入非正常值cancel_text属性值为'',组件内部使用默认值,并在控制台提示相应警告信息", async () => {
    const spy = vi.spyOn(console, 'warn');
    // 调用messagebox函数渲染MessageBox组件
    messagebox({ cancel_text: '' });

    // 应该会渲染默认值‘取消’
    expect(screen.getByText('取消')).toBeInTheDocument();

    // 在控制台提示相应警告信息
    expect(spy).toHaveBeenCalled();
    expect(spy).toHaveBeenCalledWith("[MessageBox] 属性 'cancel_text' 无效: cancel_text 不能为空, 已使用默认值 '取消', 传入值为: ''");
  });

  /**
   * 测试confirm_text属性
   */
  it('应该能渲染正常传入的string字符串confirm_text属性值', async () => {
    // 调用messagebox函数渲染MessageBox组件
    messagebox({ confirm_text: '确定' });

    // 验证是否渲染成功
    expect(screen.getByText('确定')).toBeInTheDocument();

    // 关闭弹窗
    await screen.getByTestId('messagebox_closeBtn').click();

    // 验证是否关闭成功
    expect(screen.queryByText('确定')).not.toBeInTheDocument();

    // 调用messagebox函数渲染MessageBox组件
    messagebox({ confirm_text: 'yes' });

    // 验证是否渲染成功
    expect(screen.getByText('yes')).toBeInTheDocument();
  });

  it('应该能渲染传入非正常值confirm_text属性值为undefined,组件内部使用默认值‘确定’，svelte的机制让其值为默认值', async () => {
    // 调用messagebox函数渲染MessageBox组件
    messagebox({ confirm_text: undefined });

    // 应该会渲染默认值‘确定’
    expect(screen.getByText('确定')).toBeInTheDocument();
  });

  it('应该能渲染传入非正常值confirm_text属性值为null,组件内部使用默认值,并在控制台提示相应警告信息', async () => {
    const spy = vi.spyOn(console, 'warn');
    // 调用messagebox函数渲染MessageBox组件
    messagebox({ confirm_text: null });

    // 应该会渲染默认值‘确定’
    expect(screen.getByText('确定')).toBeInTheDocument();
    expect(screen.queryByText('null')).not.toBeInTheDocument();

    // 在控制台提示相应警告信息
    expect(spy).toHaveBeenCalled();
    expect(spy).toHaveBeenCalledWith("[MessageBox] 属性 'confirm_text' 无效: 类型错误,期望类型为string,实际类型为null, 已使用默认值 '确定', 传入值为: 'null'");
  });

  it('应该能渲染传入非正常值confirm_text属性值为NaN,组件内部使用默认值,并在控制台提示相应警告信息', async () => {
    const spy = vi.spyOn(console, 'warn');
    // 调用messagebox函数渲染MessageBox组件
    messagebox({ confirm_text: NaN });

    // 应该会渲染默认值‘确定’
    expect(screen.getByText('确定')).toBeInTheDocument();
    expect(screen.queryByText('NaN')).not.toBeInTheDocument();

    // 在控制台提示相应警告信息
    expect(spy).toHaveBeenCalled();
    expect(spy).toHaveBeenCalledWith("[MessageBox] 属性 'confirm_text' 无效: 类型错误,期望类型为string,实际类型为number, 已使用默认值 '确定', 传入值为: 'NaN'");
  });

  it('应该能渲染传入非正常值confirm_text属性值为0,组件内部使用默认值,并在控制台提示相应警告信息', async () => {
    const spy = vi.spyOn(console, 'warn');
    // 调用messagebox函数渲染MessageBox组件
    messagebox({ confirm_text: 0 });

    // 应该会渲染默认值‘确定’
    expect(screen.getByText('确定')).toBeInTheDocument();
    expect(screen.queryByText('0')).not.toBeInTheDocument();

    // 在控制台提示相应警告信息
    expect(spy).toHaveBeenCalled();
    expect(spy).toHaveBeenCalledWith("[MessageBox] 属性 'confirm_text' 无效: 类型错误,期望类型为string,实际类型为number, 已使用默认值 '确定', 传入值为: '0'");
  });

  it("应该能渲染传入非正常值confirm_text属性值为'',组件内部使用默认值,并在控制台提示相应警告信息", async () => {
    const spy = vi.spyOn(console, 'warn');
    // 调用messagebox函数渲染MessageBox组件
    messagebox({ confirm_text: '' });

    // 应该会渲染默认值‘确定’
    expect(screen.getByText('确定')).toBeInTheDocument();

    // 在控制台提示相应警告信息
    expect(spy).toHaveBeenCalled();
    expect(spy).toHaveBeenCalledWith("[MessageBox] 属性 'confirm_text' 无效: confirm_text 不能为空, 已使用默认值 '确定', 传入值为: ''");
  });

  /**
   * 测试show_cancel_icon属性
   */
  it('应该能渲染正常传入的布尔类型show_cancel_icon属性值', async () => {
    // 调用messagebox函数渲染MessageBox组件
    messagebox({ show_cancel_icon: true });

    // 应该有点击关闭按钮图标
    expect(screen.getByTestId('messagebox_closeBtn')).toBeInTheDocument();

    // 关闭弹窗
    await screen.getByTestId('messagebox_closeBtn').click();

    // 应该没有点击关闭按钮图标
    expect(screen.queryByTestId('messagebox_closeBtn')).not.toBeInTheDocument();

    // 调用messagebox函数渲染MessageBox组件
    messagebox({ show_cancel_icon: false });

    // 应该没有点击关闭按钮图标
    expect(screen.queryByTestId('messagebox_closeBtn')).not.toBeInTheDocument();
  });

  it('应该能渲染传入非正常值show_cancel_icon属性值为undefined,组件内部使用默认值true,svelte的机制让其值为默认值', async () => {
    // 调用messagebox函数渲染MessageBox组件
    messagebox({ show_cancel_icon: undefined });

    // 应该有点击关闭按钮图标
    expect(screen.getByTestId('messagebox_closeBtn')).toBeInTheDocument();
  });

  it('应该能渲染传入非正常值show_cancel_icon属性值为null,组件内部使用默认值,并在控制台提示相应警告信息', async () => {
    const spy = vi.spyOn(console, 'warn');
    // 调用messagebox函数渲染MessageBox组件
    messagebox({ show_cancel_icon: null });

    // 应该有点击关闭按钮图标
    expect(screen.queryByTestId('messagebox_closeBtn')).toBeInTheDocument();

    // 在控制台提示相应警告信息
    expect(spy).toHaveBeenCalled();
    expect(spy).toHaveBeenCalledWith("[MessageBox] 属性 'show_cancel_icon' 无效: 类型错误,期望类型为boolean,实际类型为null, 已使用默认值 'true', 传入值为: 'null'");
  });

  it('应该能渲染传入非正常值show_cancel_icon属性值为NaN,组件内部使用默认值,并在控制台提示相应警告信息', async () => {
    const spy = vi.spyOn(console, 'warn');
    // 调用messagebox函数渲染MessageBox组件
    messagebox({ show_cancel_icon: NaN });

    // 应该有点击关闭按钮图标
    expect(screen.queryByTestId('messagebox_closeBtn')).toBeInTheDocument();

    // 在控制台提示相应警告信息
    expect(spy).toHaveBeenCalled();
    expect(spy).toHaveBeenCalledWith("[MessageBox] 属性 'show_cancel_icon' 无效: 类型错误,期望类型为boolean,实际类型为number, 已使用默认值 'true', 传入值为: 'NaN'");
  });

  it('应该能渲染传入非正常值show_cancel_icon属性值为0,组件内部使用默认值,并在控制台提示相应警告信息', async () => {
    const spy = vi.spyOn(console, 'warn');
    // 调用messagebox函数渲染MessageBox组件
    messagebox({ show_cancel_icon: 0 });

    // 应该有点击关闭按钮图标
    expect(screen.queryByTestId('messagebox_closeBtn')).toBeInTheDocument();

    // 在控制台提示相应警告信息
    expect(spy).toHaveBeenCalled();
    expect(spy).toHaveBeenCalledWith("[MessageBox] 属性 'show_cancel_icon' 无效: 类型错误,期望类型为boolean,实际类型为number, 已使用默认值 'true', 传入值为: '0'");
  });

  it("应该能渲染传入非正常值show_cancel_icon属性值为'',组件内部使用默认值,并在控制台提示相应警告信息", async () => {
    const spy = vi.spyOn(console, 'warn');
    // 调用messagebox函数渲染MessageBox组件
    messagebox({ show_cancel_icon: '' });

    // 应该有点击关闭按钮图标
    expect(screen.queryByTestId('messagebox_closeBtn')).toBeInTheDocument();

    // 在控制台提示相应警告信息
    expect(spy).toHaveBeenCalled();
    expect(spy).toHaveBeenCalledWith("[MessageBox] 属性 'show_cancel_icon' 无效: 类型错误,期望类型为boolean,实际类型为string, 已使用默认值 'true', 传入值为: ''");
  });

  /**
   * 测试type属性
   */
  /** 基础类型 @type {Array} */
  const BASE_TYPES = ['primary', 'success', 'danger', 'warning', 'info'];

  /** 图标集合 @type {Object}*/
  const ICON_URL = {
    primary: '/dialog/tip.svg',
    success: '/paper/action_success.svg',
    danger: '/paper/action_fail.svg',
    warning: '/student_answer_exam/preview-tip.svg',
    info: '/student_practice_list/tip.svg',
  };
  it('应该能渲染传入正常值type属性值', async () => {
    /**
     * 传入正常值type='primary'
     */
    messagebox({ type: BASE_TYPES[0] });
    // 验证是否渲染成功
    expect(screen.getAllByTestId('messagebox_typeIcon')[0]).toHaveAttribute('src', ICON_URL[BASE_TYPES[0]]);

    /**
     * 传入正常值type='success'
     */
    messagebox({ type: BASE_TYPES[1] });
    // 验证是否渲染成功
    expect(screen.getAllByTestId('messagebox_typeIcon')[1]).toHaveAttribute('src', ICON_URL[BASE_TYPES[1]]);

    /**
     * 传入正常值type='danger'
     */
    messagebox({ type: BASE_TYPES[2] });
    // 验证是否渲染成功
    expect(screen.getAllByTestId('messagebox_typeIcon')[2]).toHaveAttribute('src', ICON_URL[BASE_TYPES[2]]);

    /**
     * 传入正常值type='warning'
     */
    messagebox({ type: BASE_TYPES[3] });
    // 验证是否渲染成功
    expect(screen.getAllByTestId('messagebox_typeIcon')[3]).toHaveAttribute('src', ICON_URL[BASE_TYPES[3]]);

    /**
     * 传入正常值type='info'
     */
    messagebox({ type: BASE_TYPES[4] });
    // 验证是否渲染成功
    expect(screen.getAllByTestId('messagebox_typeIcon')[4]).toHaveAttribute('src', ICON_URL[BASE_TYPES[4]]);
  });

  it('应该能渲染传入非正常值type属性值为undefined,组件内部使用默认值‘primary’,svelte的机制让其值为默认值', async () => {
    const spy = vi.spyOn(console, 'warn');
    messagebox({ type: undefined });

    // 验证是否渲染成功
    expect(screen.getAllByTestId('messagebox_typeIcon')[0]).toHaveAttribute('src', ICON_URL[BASE_TYPES[0]]);

    expect(spy).not.toHaveBeenCalled();
  });

  it('应该能渲染传入非正常值type属性值为null,组件内部使用默认值,并在控制台提示相应警告信息', async () => {
    const spy = vi.spyOn(console, 'warn');

    // 调用messagebox函数渲染MessageBox组件
    messagebox({ type: null });

    // 验证是否渲染成功
    expect(screen.getAllByTestId('messagebox_typeIcon')[0]).toHaveAttribute('src', ICON_URL[BASE_TYPES[0]]);

    // 在控制台提示相应警告信息
    expect(spy).toHaveBeenCalled();
    expect(spy).toHaveBeenCalledWith("[MessageBox] 属性 'type' 无效: 类型错误,期望类型为string,实际类型为null, 已使用默认值 'primary', 传入值为: 'null'");
  });

  it('应该能渲染传入非正常值type属性值为NaN,组件内部使用默认值,并在控制台提示相应警告信息', async () => {
    const spy = vi.spyOn(console, 'warn');

    // 调用messagebox函数渲染MessageBox组件
    messagebox({ type: NaN });

    // 验证是否渲染成功
    expect(screen.getAllByTestId('messagebox_typeIcon')[0]).toHaveAttribute('src', ICON_URL[BASE_TYPES[0]]);

    // 在控制台提示相应警告信息
    expect(spy).toHaveBeenCalled();
    expect(spy).toHaveBeenCalledWith("[MessageBox] 属性 'type' 无效: 类型错误,期望类型为string,实际类型为number, 已使用默认值 'primary', 传入值为: 'NaN'");
  });

  it('应该能渲染传入非正常值type属性值为0,组件内部使用默认值,并在控制台提示相应警告信息', async () => {
    const spy = vi.spyOn(console, 'warn');

    // 调用messagebox函数渲染MessageBox组件
    messagebox({ type: 0 });

    // 验证是否渲染成功
    expect(screen.getAllByTestId('messagebox_typeIcon')[0]).toHaveAttribute('src', ICON_URL[BASE_TYPES[0]]);

    // 在控制台提示相应警告信息
    expect(spy).toHaveBeenCalled();
    expect(spy).toHaveBeenCalledWith("[MessageBox] 属性 'type' 无效: 类型错误,期望类型为string,实际类型为number, 已使用默认值 'primary', 传入值为: '0'");
  });

  it("应该能渲染传入非正常值type属性值为'',组件内部使用默认值,并在控制台提示相应警告信息", async () => {
    const spy = vi.spyOn(console, 'warn');

    // 调用messagebox函数渲染MessageBox组件
    messagebox({ type: '' });

    // 验证是否渲染成功
    expect(screen.getAllByTestId('messagebox_typeIcon')[0]).toHaveAttribute('src', ICON_URL[BASE_TYPES[0]]);

    // 在控制台提示相应警告信息
    expect(spy).toHaveBeenCalled();
    expect(spy).toHaveBeenCalledWith("[MessageBox] 属性 'type' 无效: type 只能是 primary、success、danger、warning、info 中的一个, 已使用默认值 'primary', 传入值为: ''");
  });

  /**
   * 测试cancel_button_type属性
   */
  it('应该能渲染正常传入的string字符串cancel_button_type属性值', async () => {
    /**
     * 传入正常值cancel_button_type='primary'
     */
    messagebox({ cancel_button_type: BASE_TYPES[0] });
    // 验证是否渲染成功
    expect(screen.getAllByText('取消')[0]).toHaveClass(`btn--${BASE_TYPES[0]}`);

    /**
     * 传入正常值cancel_button_type='success'
     */
    messagebox({ cancel_button_type: BASE_TYPES[1] });
    // 验证是否渲染成功
    expect(screen.getAllByText('取消')[1]).toHaveClass(`btn--${BASE_TYPES[1]}`);

    /**
     * 传入正常值cancel_button_type='danger'
     */
    messagebox({ cancel_button_type: BASE_TYPES[2] });
    // 验证是否渲染成功
    expect(screen.getAllByText('取消')[2]).toHaveClass(`btn--${BASE_TYPES[2]}`);

    /**
     * 传入正常值cancel_button_type='warning'
     */
    messagebox({ cancel_button_type: BASE_TYPES[3] });
    // 验证是否渲染成功
    expect(screen.getAllByText('取消')[3]).toHaveClass(`btn--${BASE_TYPES[3]}`);

    /**
     * 传入正常值cancel_button_type='info'
     */
    messagebox({ cancel_button_type: BASE_TYPES[4] });
    // 验证是否渲染成功
    expect(screen.getAllByText('取消')[4]).toHaveClass(`btn--${BASE_TYPES[4]}`);
  });

  it('应该能渲染传入非正常值cancel_button_type属性值为undefined,组件内部使用默认值‘info’,svelte的机制让其值为默认值', async () => {
    const spy = vi.spyOn(console, 'warn');
    messagebox({ cancel_button_type: undefined });

    // 验证是否渲染成功
    expect(screen.getByText('取消')).toHaveClass(`btn--info`);

    expect(spy).not.toHaveBeenCalled();
  });

  it('应该能渲染传入非正常值cancel_button_type属性值为null,组件内部使用默认值info,并在控制台提示相应警告信息', async () => {
    const spy = vi.spyOn(console, 'warn');
    // 调用messagebox函数渲染MessageBox组件
    messagebox({ cancel_button_type: null });

    // 验证是否渲染成功
    expect(screen.getByText('取消')).toHaveClass(`btn--info`);

    expect(spy).toHaveBeenCalled();
    expect(spy).toHaveBeenCalledWith("[MessageBox] 属性 'cancel_button_type' 无效: 类型错误,期望类型为string,实际类型为null, 已使用默认值 'info', 传入值为: 'null'");
  });

  it('应该能渲染传入非正常值cancel_button_type属性值为NaN,组件内部使用默认值info,并在控制台提示相应警告信息', async () => {
    const spy = vi.spyOn(console, 'warn');
    // 调用messagebox函数渲染MessageBox组件
    messagebox({ cancel_button_type: NaN });

    // 验证是否渲染成功
    expect(screen.getByText('取消')).toHaveClass(`btn--info`);

    expect(spy).toHaveBeenCalled();
    expect(spy).toHaveBeenCalledWith("[MessageBox] 属性 'cancel_button_type' 无效: 类型错误,期望类型为string,实际类型为number, 已使用默认值 'info', 传入值为: 'NaN'");
  });

  it('应该能渲染传入非正常值cancel_button_type属性值为0,组件内部使用默认值info,并在控制台提示相应警告信息', async () => {
    const spy = vi.spyOn(console, 'warn');
    // 调用messagebox函数渲染MessageBox组件
    messagebox({ cancel_button_type: 0 });

    // 验证是否渲染成功
    expect(screen.getByText('取消')).toHaveClass(`btn--info`);

    expect(spy).toHaveBeenCalled();
    expect(spy).toHaveBeenCalledWith("[MessageBox] 属性 'cancel_button_type' 无效: 类型错误,期望类型为string,实际类型为number, 已使用默认值 'info', 传入值为: '0'");
  });

  it("应该能渲染传入非正常值cancel_button_type属性值为'',组件内部使用默认值info,并在控制台提示相应警告信息", async () => {
    const spy = vi.spyOn(console, 'warn');
    // 调用messagebox函数渲染MessageBox组件
    messagebox({ cancel_button_type: '' });

    // 验证是否渲染成功
    expect(screen.getByText('取消')).toHaveClass(`btn--info`);

    expect(spy).toHaveBeenCalled();
    expect(spy).toHaveBeenCalledWith("[MessageBox] 属性 'cancel_button_type' 无效: cancel_button_type 只能是 primary、success、danger、warning、info 中的一个, 已使用默认值 'info', 传入值为: ''");
  });

  /**
   * 测试confirm_button_type属性
   */
  it('应该能渲染传入正常值confirm_button_type属性值', async () => {
    /**
     * 传入正常值confirm_button_type='primary'
     */
    messagebox({ confirm_button_type: BASE_TYPES[0] });
    // 验证是否渲染成功
    expect(screen.getAllByText('确定')[0]).toHaveClass(`btn--${BASE_TYPES[0]}`);

    /**
     * 传入正常值confirm_button_type='success'
     */
    messagebox({ confirm_button_type: BASE_TYPES[1] });
    // 验证是否渲染成功
    expect(screen.getAllByText('确定')[1]).toHaveClass(`btn--${BASE_TYPES[1]}`);

    /**
     * 传入正常值confirm_button_type='danger'
     */
    messagebox({ confirm_button_type: BASE_TYPES[2] });
    // 验证是否渲染成功
    expect(screen.getAllByText('确定')[2]).toHaveClass(`btn--${BASE_TYPES[2]}`);

    /**
     * 传入正常值confirm_button_type='warning'
     */
    messagebox({ confirm_button_type: BASE_TYPES[3] });
    // 验证是否渲染成功
    expect(screen.getAllByText('确定')[3]).toHaveClass(`btn--${BASE_TYPES[3]}`);

    /**
     * 传入正常值confirm_button_type='info'
     */
    messagebox({ confirm_button_type: BASE_TYPES[4] });
    // 验证是否渲染成功
    expect(screen.getAllByText('确定')[4]).toHaveClass(`btn--${BASE_TYPES[4]}`);
  });

  it('应该能渲染传入非正常值confirm_button_type属性值为undefined,组件内部使用默认值primary,svelte的机制让其值为默认值', async () => {
    const spy = vi.spyOn(console, 'warn');
    // 调用messagebox函数渲染MessageBox组件
    messagebox({ confirm_button_type: undefined });

    // 验证是否渲染成功
    expect(screen.getAllByText('确定')[0]).toHaveClass(`btn--primary`);

    expect(spy).not.toHaveBeenCalled();
  });

  it('应该能渲染传入非正常值confirm_button_type属性值为null,组件内部使用默认值primary,并在控制台提示相应警告信息', async () => {
    const spy = vi.spyOn(console, 'warn');
    // 调用messagebox函数渲染MessageBox组件
    messagebox({ confirm_button_type: null });

    // 验证是否渲染成功
    expect(screen.getAllByText('确定')[0]).toHaveClass(`btn--primary`);

    expect(spy).toHaveBeenCalled();
    expect(spy).toHaveBeenCalledWith("[MessageBox] 属性 'confirm_button_type' 无效: 类型错误,期望类型为string,实际类型为null, 已使用默认值 'primary', 传入值为: 'null'");
  });

  it('应该能渲染传入非正常值confirm_button_type属性值为NaN,组件内部使用默认值primary,并在控制台提示相应警告信息', async () => {
    const spy = vi.spyOn(console, 'warn');
    // 调用messagebox函数渲染MessageBox组件
    messagebox({ confirm_button_type: NaN });
    // 验证是否渲染成功
    expect(screen.getAllByText('确定')[0]).toHaveClass(`btn--primary`);

    expect(spy).toHaveBeenCalled();
    expect(spy).toHaveBeenCalledWith("[MessageBox] 属性 'confirm_button_type' 无效: 类型错误,期望类型为string,实际类型为number, 已使用默认值 'primary', 传入值为: 'NaN'");
  });

  it('应该能渲染传入非正常值confirm_button_type属性值为0,组件内部使用默认值primary,并在控制台提示相应警告信息', async () => {
    const spy = vi.spyOn(console, 'warn');
    // 调用messagebox函数渲染MessageBox组件
    messagebox({ confirm_button_type: 0 });
    // 验证是否渲染成功
    expect(screen.getAllByText('确定')[0]).toHaveClass(`btn--primary`);

    expect(spy).toHaveBeenCalled();
    expect(spy).toHaveBeenCalledWith("[MessageBox] 属性 'confirm_button_type' 无效: 类型错误,期望类型为string,实际类型为number, 已使用默认值 'primary', 传入值为: '0'");
  });

  it("应该能渲染传入非正常值confirm_button_type属性值为'',组件内部使用默认值primary,并在控制台提示相应警告信息", async () => {
    const spy = vi.spyOn(console, 'warn');
    // 调用messagebox函数渲染MessageBox组件
    messagebox({ confirm_button_type: '' });
    // 验证是否渲染成功
    expect(screen.getAllByText('确定')[0]).toHaveClass(`btn--primary`);

    expect(spy).toHaveBeenCalled();
    expect(spy).toHaveBeenCalledWith("[MessageBox] 属性 'confirm_button_type' 无效: confirm_button_type 只能是 primary、success、danger、warning、info 中的一个, 已使用默认值 'primary', 传入值为: ''");
  });

  /**
   * 测试on_close_by_click_outside属性
   */
  it('应该能渲染正常传入的布尔类型on_close_by_click_outside属性值', async () => {
    // 调用messagebox函数渲染MessageBox组件
    messagebox({ on_close_by_click_outside: true });

    // 验证是否渲染成功
    expect(screen.getByText('温馨提示')).toBeInTheDocument();

    // 点击外部区域关闭弹窗
    await fireEvent.click(screen.getByTestId('messagebox_shadow'));

    // 验证关闭后不再存在
    await waitFor(() => {
      expect(screen.queryByText('温馨提示')).not.toBeInTheDocument();
    });

    // 调用messagebox函数渲染MessageBox组件
    messagebox({ on_close_by_click_outside: false });

    // 验证是否渲染成功
    expect(screen.getByText('温馨提示')).toBeInTheDocument();

    // 点击外部区域不能关闭弹窗
    await fireEvent.click(screen.getByTestId('messagebox_shadow'));

    await waitFor(() => {
      expect(screen.queryByText('温馨提示')).toBeInTheDocument();
    });
  });

  it('应该能渲染传入非正常值on_close_by_click_outside属性值为undefined,组件内部使用默认值true,svelte的机制让其值为默认值', async () => {
    // 调用messagebox函数渲染MessageBox组件
    messagebox({ on_close_by_click_outside: undefined });

    // 验证是否渲染成功
    expect(screen.getByText('温馨提示')).toBeInTheDocument();
    // 点击外部区域关闭弹窗
    await fireEvent.click(screen.getByTestId('messagebox_shadow'));

    // 验证关闭后不再存在
    await waitFor(() => {
      expect(screen.queryByText('温馨提示')).not.toBeInTheDocument();
    });
  });

  it('应该能渲染传入非正常值on_close_by_click_outside属性值为null,组件内部使用默认值true,并在控制台提示相应警告信息', async () => {
    const spy = vi.spyOn(console, 'warn');
    // 调用messagebox函数渲染MessageBox组件
    messagebox({ on_close_by_click_outside: null });

    // 验证是否渲染成功
    expect(screen.getByText('温馨提示')).toBeInTheDocument();
    // 点击外部区域关闭弹窗
    await fireEvent.click(screen.getByTestId('messagebox_shadow'));

    // 验证关闭后不再存在
    await waitFor(() => {
      expect(screen.queryByText('温馨提示')).not.toBeInTheDocument();
    });
    expect(spy).toHaveBeenCalled();
    expect(spy).toHaveBeenCalledWith("[MessageBox] 属性 'on_close_by_click_outside' 无效: 类型错误,期望类型为boolean,实际类型为null, 已使用默认值 'true', 传入值为: 'null'");
  });

  it('应该能渲染传入非正常值on_close_by_click_outside属性值为NaN,组件内部使用默认值true,并在控制台提示相应警告信息', async () => {
    const spy = vi.spyOn(console, 'warn');
    // 调用messagebox函数渲染MessageBox组件
    messagebox({ on_close_by_click_outside: NaN });

    // 验证是否渲染成功
    expect(screen.getByText('温馨提示')).toBeInTheDocument();
    // 点击外部区域关闭弹窗
    await fireEvent.click(screen.getByTestId('messagebox_shadow'));
    // 验证关闭后不再存在
    await waitFor(() => {});
    expect(spy).toHaveBeenCalled();
    expect(spy).toHaveBeenCalledWith("[MessageBox] 属性 'on_close_by_click_outside' 无效: 类型错误,期望类型为boolean,实际类型为number, 已使用默认值 'true', 传入值为: 'NaN'");
  });

  it('应该能渲染传入非正常值on_close_by_click_outside属性值为0,组件内部使用默认值true,并在控制台提示相应警告信息', async () => {
    const spy = vi.spyOn(console, 'warn');
    // 调用messagebox函数渲染MessageBox组件
    messagebox({ on_close_by_click_outside: 0 });

    // 验证是否渲染成功
    expect(screen.getByText('温馨提示')).toBeInTheDocument();

    // 点击外部区域关闭弹窗
    await fireEvent.click(screen.getByTestId('messagebox_shadow'));
    // 验证关闭后不再存在
    await waitFor(() => {});
    expect(spy).toHaveBeenCalled();
    expect(spy).toHaveBeenCalledWith("[MessageBox] 属性 'on_close_by_click_outside' 无效: 类型错误,期望类型为boolean,实际类型为number, 已使用默认值 'true', 传入值为: '0'");
  });

  it("应该能渲染传入非正常值on_close_by_click_outside属性值为'',组件内部使用默认值true,并在控制台提示相应警告信息", async () => {
    const spy = vi.spyOn(console, 'warn');
    // 调用messagebox函数渲染MessageBox组件
    messagebox({ on_close_by_click_outside: '' });

    // 验证是否渲染成功
    expect(screen.getByText('温馨提示')).toBeInTheDocument();
    // 点击外部区域关闭弹窗
    await fireEvent.click(screen.getByTestId('messagebox_shadow'));
    // 验证关闭后不再存在
    await waitFor(() => {});
    expect(spy).toHaveBeenCalled();
    expect(spy).toHaveBeenCalledWith("[MessageBox] 属性 'on_close_by_click_outside' 无效: 类型错误,期望类型为boolean,实际类型为string, 已使用默认值 'true', 传入值为: ''");
  });

  /**
   * 测试onCancel回调函数
   */
  it('应该能渲染传入正常值onCancel回调函数', async () => {
    const spy = vi.spyOn(console, 'log');

    // 调用messagebox函数渲染MessageBox组件
    messagebox({
      onCancel: () => {
        console.log('点击了取消按钮');
      },
    });
    // 验证是否渲染成功
    expect(screen.getByText('温馨提示')).toBeInTheDocument();

    // 点击取消按钮关闭弹窗
    await fireEvent.click(screen.getByText('取消'));

    // 验证关闭后不再存在
    await waitFor(() => {
      expect(screen.queryByText('温馨提示')).not.toBeInTheDocument();
    });

    // 验证是否执行onCancel回调函数
    expect(spy).toHaveBeenCalled();
    expect(spy).toHaveBeenCalledWith('点击了取消按钮');
  });

  it('应该能渲染传入非正常值onCancel回调函数为undefined,组件内部不执行onCancel回调函数', async () => {
    const spy = vi.spyOn(console, 'warn');
    // 调用messagebox函数渲染MessageBox组件
    messagebox({ onCancel: undefined });
    // 验证是否渲染成功
    expect(screen.getByText('温馨提示')).toBeInTheDocument();
    // 点击取消按钮关闭弹窗
    await fireEvent.click(screen.getByText('取消'));
    // 验证关闭后不再存在
    await waitFor(() => {
      expect(screen.queryByText('温馨提示')).not.toBeInTheDocument();
    });
    expect(spy).toHaveBeenCalledWith("[MessageBox] 属性 'onCancel' 无效: 类型错误, 期望类型为function、asyncfunction, 实际类型为undefined, 已使用默认值 '() => {}', 传入值为: 'undefined'");
  });

  it('应该能渲染传入非正常值onCancel回调函数为null,组件内部不执行onCancel回调函数', async () => {
    const spy = vi.spyOn(console, 'warn');
    // 调用messagebox函数渲染MessageBox组件
    messagebox({ onCancel: null });
    // 验证是否渲染成功
    expect(screen.getByText('温馨提示')).toBeInTheDocument();
    // 点击取消按钮关闭弹窗
    await fireEvent.click(screen.getByText('取消'));
    // 验证关闭后不再存在
    await waitFor(() => {
      expect(screen.queryByText('温馨提示')).not.toBeInTheDocument();
    });
    expect(spy).toHaveBeenCalledWith("[MessageBox] 属性 'onCancel' 无效: 类型错误, 期望类型为function、asyncfunction, 实际类型为null, 已使用默认值 '() => {}', 传入值为: 'null'");
  });

  it('应该能渲染传入非正常值onCancel回调函数为NaN,组件内部不执行onCancel回调函数', async () => {
    const spy = vi.spyOn(console, 'warn');
    // 调用messagebox函数渲染MessageBox组件
    messagebox({ onCancel: NaN });
    // 验证是否渲染成功
    expect(screen.getByText('温馨提示')).toBeInTheDocument();
    // 点击取消按钮关闭弹窗
    await fireEvent.click(screen.getByText('取消'));
    // 验证关闭后不再存在
    await waitFor(() => {
      expect(screen.queryByText('温馨提示')).not.toBeInTheDocument();
    });
    expect(spy).toHaveBeenCalledWith("[MessageBox] 属性 'onCancel' 无效: 类型错误, 期望类型为function、asyncfunction, 实际类型为number, 已使用默认值 '() => {}', 传入值为: 'NaN'");
  });

  it('应该能渲染传入非正常值onCancel回调函数为0,组件内部不执行onCancel回调函数', async () => {
    const spy = vi.spyOn(console, 'warn');
    // 调用messagebox函数渲染MessageBox组件
    messagebox({ onCancel: 0 });
    // 验证是否渲染成功
    expect(screen.getByText('温馨提示')).toBeInTheDocument();
    // 点击取消按钮关闭弹窗
    await fireEvent.click(screen.getByText('取消'));
    // 验证关闭后不再存在
    await waitFor(() => {
      expect(screen.queryByText('温馨提示')).not.toBeInTheDocument();
    });
    expect(spy).toHaveBeenCalledWith("[MessageBox] 属性 'onCancel' 无效: 类型错误, 期望类型为function、asyncfunction, 实际类型为number, 已使用默认值 '() => {}', 传入值为: '0'");
  });

  it("应该能渲染传入非正常值onCancel回调函数为'',组件内部不执行onCancel回调函数", async () => {
    const spy = vi.spyOn(console, 'warn');
    // 调用messagebox函数渲染MessageBox组件
    messagebox({ onCancel: '' });
    // 验证是否渲染成功
    expect(screen.getByText('温馨提示')).toBeInTheDocument();
    // 点击取消按钮关闭弹窗
    await fireEvent.click(screen.getByText('取消'));
    // 验证关闭后不再存在
    await waitFor(() => {
      expect(screen.queryByText('温馨提示')).not.toBeInTheDocument();
    });
    expect(spy).toHaveBeenCalledWith("[MessageBox] 属性 'onCancel' 无效: 类型错误, 期望类型为function、asyncfunction, 实际类型为string, 已使用默认值 '() => {}', 传入值为: ''");
  });

  /**
   * 测试onConfirm回调函数
   */
  it('应该能渲染传入正常值onConfirm回调函数', async () => {
    const spy = vi.spyOn(console, 'log');
    // 调用messagebox函数渲染MessageBox组件
    messagebox({
      onConfirm: () => {
        console.log('onConfirm');
      },
    });
    // 验证是否渲染成功
    expect(screen.getByText('温馨提示')).toBeInTheDocument();
    // 点击确定按钮关闭弹窗
    await fireEvent.click(screen.getByText('确定'));
    // 验证关闭后不再存在
    await waitFor(() => {
      expect(screen.queryByText('温馨提示')).not.toBeInTheDocument();
    });
    expect(spy).toHaveBeenCalled();
    expect(spy).toHaveBeenCalledWith('onConfirm');
  });

  it('应该能渲染传入非正常值onConfirm回调函数为undefined,组件内部不执行onConfirm回调函数', async () => {
    const spy = vi.spyOn(console, 'warn');
    // 调用messagebox函数渲染MessageBox组件
    messagebox({ onConfirm: undefined });
    // 验证是否渲染成功
    expect(screen.getByText('温馨提示')).toBeInTheDocument();
    // 点击确定按钮关闭弹窗
    await fireEvent.click(screen.getByText('确定'));
    // 验证关闭后不再存在
    await waitFor(() => {
      expect(screen.queryByText('温馨提示')).not.toBeInTheDocument();
    });
    expect(spy).toHaveBeenCalledWith("[MessageBox] 属性 'onConfirm' 无效: 类型错误, 期望类型为function、asyncfunction, 实际类型为undefined, 已使用默认值 '() => {}', 传入值为: 'undefined'");
  });

  it('应该能渲染传入非正常值onConfirm回调函数为null,组件内部不执行onConfirm回调函数', async () => {
    const spy = vi.spyOn(console, 'warn');
    // 调用messagebox函数渲染MessageBox组件
    messagebox({ onConfirm: null });
    // 验证是否渲染成功
    expect(screen.getByText('温馨提示')).toBeInTheDocument();
    // 点击确定按钮关闭弹窗
    await fireEvent.click(screen.getByText('确定'));
    // 验证关闭后不再存在
    await waitFor(() => {
      expect(screen.queryByText('温馨提示')).not.toBeInTheDocument();
    });
    expect(spy).toHaveBeenCalledWith("[MessageBox] 属性 'onConfirm' 无效: 类型错误, 期望类型为function、asyncfunction, 实际类型为null, 已使用默认值 '() => {}', 传入值为: 'null'");
  });

  it('应该能渲染传入非正常值onConfirm回调函数为NaN,组件内部不执行onConfirm回调函数', async () => {
    const spy = vi.spyOn(console, 'warn');
    // 调用messagebox函数渲染MessageBox组件
    messagebox({ onConfirm: NaN });
    // 验证是否渲染成功
    expect(screen.getByText('温馨提示')).toBeInTheDocument();
    // 点击确定按钮关闭弹窗
    await fireEvent.click(screen.getByText('确定'));
    // 验证关闭后不再存在
    await waitFor(() => {
      expect(screen.queryByText('温馨提示')).not.toBeInTheDocument();
    });
    expect(spy).toHaveBeenCalledWith("[MessageBox] 属性 'onConfirm' 无效: 类型错误, 期望类型为function、asyncfunction, 实际类型为number, 已使用默认值 '() => {}', 传入值为: 'NaN'");
  });

  it('应该能渲染传入非正常值onConfirm回调函数为0,组件内部不执行onConfirm回调函数', async () => {
    const spy = vi.spyOn(console, 'warn');
    // 调用messagebox函数渲染MessageBox组件
    messagebox({ onConfirm: 0 });
    // 验证是否渲染成功
    expect(screen.getByText('温馨提示')).toBeInTheDocument();
    // 点击确定按钮关闭弹窗
    await fireEvent.click(screen.getByText('确定'));
    // 验证关闭后不再存在
    await waitFor(() => {
      expect(screen.queryByText('温馨提示')).not.toBeInTheDocument();
    });
    expect(spy).toHaveBeenCalledWith("[MessageBox] 属性 'onConfirm' 无效: 类型错误, 期望类型为function、asyncfunction, 实际类型为number, 已使用默认值 '() => {}', 传入值为: '0'");
  });

  it("应该能渲染传入非正常值onConfirm回调函数为'',组件内部不执行onConfirm回调函数", async () => {
    const spy = vi.spyOn(console, 'warn');
    // 调用messagebox函数渲染MessageBox组件
    messagebox({ onConfirm: '' });
    // 验证是否渲染成功
    expect(screen.getByText('温馨提示')).toBeInTheDocument();
    // 点击确定按钮关闭弹窗
    await fireEvent.click(screen.getByText('确定'));
    // 验证关闭后不再存在
    await waitFor(() => {
      expect(screen.queryByText('温馨提示')).not.toBeInTheDocument();
    });
    expect(spy).toHaveBeenCalledWith("[MessageBox] 属性 'onConfirm' 无效: 类型错误, 期望类型为function、asyncfunction, 实际类型为string, 已使用默认值 '() => {}', 传入值为: ''");
  });

  /**
   * 键盘事件
   */
  it('测试能够正常处理键盘事件关闭弹窗', async () => {
    // 调用messagebox函数渲染MessageBox组件
    messagebox();
    // 验证是否渲染成功
    expect(screen.getByText('温馨提示')).toBeInTheDocument();
    // 点击确定按钮关闭弹窗
    const messagebox_shadow = screen.getByTestId('messagebox_shadow');
    await fireEvent.keyDown(messagebox_shadow, { key: 'Escape' });
    // 验证关闭后不再存在
    await waitFor(() => {
      expect(screen.queryByText('温馨提示')).not.toBeInTheDocument();
    });
  });

  it('测试弹窗内容键盘按下不会有事件冒泡导致关闭弹窗', async () => {
    // 调用messagebox函数渲染MessageBox组件
    messagebox();
    // 验证是否渲染成功
    expect(screen.getByText('温馨提示')).toBeInTheDocument();
    // 点击确定按钮关闭弹窗
    const content = document.querySelector('.MessageBox__container');
    fireEvent.keyDown(content, { key: 'Escape' });
    // 不会关闭
    expect(screen.queryByText('温馨提示')).toBeInTheDocument();
  });

  /**
   * 测试导入的scss文件演示是否生效
   */
  it('测试确定与取消按钮是否都已经有相应的样式类名', () => {
    // 调用messagebox函数渲染MessageBox组件
    messagebox({
      cancel_button_type: 'info',
      confirm_button_type: 'success',
      cancel_text: '取消',
      confirm_text: '确定',
    });

    // 验证是否渲染成功
    expect(screen.getByText('取消')).toBeInTheDocument();
    expect(screen.getByText('确定')).toBeInTheDocument();

    // 两个按钮上都应该有着相应的类名
    expect(screen.getByText('取消')).toHaveClass('btn--info btn btn--medium');
    expect(screen.getByText('确定')).toHaveClass('btn--success btn btn--medium');
  });

  /**
   * 测试是否支持链式调用
   */
  it('应该能支持链式调用', async () => {
    const spy = vi.spyOn(console, 'log');

    // 调用messagebox函数渲染MessageBox组件
    messagebox({
      cancel_button_type: 'info',
      confirm_button_type: 'success',
      cancel_text: '取消',
      confirm_text: '确定',
    })
      .then(() => {
        console.log('点击了确定按钮');
      })
      .catch(() => {
        console.log('点击了取消按钮');
      });
    // 验证是否渲染成功
    expect(screen.getByText('取消')).toBeInTheDocument();
    expect(screen.getByText('确定')).toBeInTheDocument();

    // 模拟点击了确定按钮
    await fireEvent.click(screen.getByText('确定'));
    // 是否执行了.then之后的函数
    expect(spy).toHaveBeenCalled();
    expect(spy).toHaveBeenCalledWith('点击了确定按钮');

    // 调用messagebox函数渲染MessageBox组件
    messagebox({
      cancel_button_type: 'info',
      confirm_button_type: 'success',
      cancel_text: '取消',
      confirm_text: '确定',
    })
      .then(() => {
        console.log('点击了确定按钮');
      })
      .catch(() => {
        console.log('点击了取消按钮');
      });
    // 模拟点击了取消按钮
    await fireEvent.click(screen.getByText('取消'));
    // 是否执行了.catch之后的函数
    expect(spy).toHaveBeenCalled();
    expect(spy).toHaveBeenCalledWith('点击了取消按钮');
  });
});
