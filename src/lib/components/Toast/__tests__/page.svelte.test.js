import { render, waitFor, screen } from '@testing-library/svelte';
import { vi, beforeEach, describe, expect, it } from 'vitest';
import Toast from '../Toast.svelte';
import { toast } from '../Toast.js';
import { afterEach } from 'vitest';

describe('Toast 组件 & toast.js 函数式调用测试', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  // ====== Toast.svelte 测试 ======
  /**
   * 测试渲染默认数据
   */
  it('添加message,测试渲染其他默认数据(默认3000ms,显示关闭按钮,成功图标)', async () => {
    // 渲染Toast.svelte 组件
    render(Toast, { props: { message: '操作成功' } });

    // 初始渲染,测试是否有message文字
    expect(screen.getByText('操作成功')).toBeInTheDocument();

    //测试是否有图标以及图标路径
    expect(screen.getByTestId('typeIcon')).toBeInTheDocument();
    expect(screen.getByTestId('typeIcon')).toHaveAttribute('src', '/paper/action_success.svg');

    // 测试是否有关闭按钮
    expect(screen.getByTestId('closeBtn')).toBeInTheDocument();
    expect(screen.getByTestId('closeBtn')).toHaveClass('toast__close');
    expect(screen.getByTestId('closeBtn')).toHaveAttribute('aria-label', '关闭');
    expect(screen.getByTestId('closeBtn')).toHaveAttribute('title', '点击关闭');

    // 推进时间：3000ms + 动画缓冲：500ms
    vi.advanceTimersByTime(3500);
    await vi.runAllTicks(); // 立即触发所有挂起的动画
    await vi.runAllTimers(); // 立即触发所有挂起的定时器

    // 测试是否会自动结束
    await waitFor(() => {
      expect(screen.queryByText('操作成功')).not.toBeInTheDocument();
    });
  });

  it('测试type属性传入{success | error | warning},测试图标是否正常显示', async () => {
    // 测试type属性为success的情况
    render(Toast, { props: { message: '操作成功', type: 'success' } });
    expect(screen.getByTestId('typeIcon')).toHaveAttribute('src', '/paper/action_success.svg');

    // 快进结束
    vi.advanceTimersByTime(3500);

    // 测试tyoe属性为warning的情况
    render(Toast, { props: { message: '操作成功', type: 'warning' } });
    expect(screen.getByTestId('typeIcon')).toHaveAttribute('src', '/student_answer_exam/preview-tip.svg');

    // 快进结束
    vi.advanceTimersByTime(3500);

    // 测试type属性为error的情况
    render(Toast, { props: { message: '操作成功', type: 'error' } });
    expect(screen.getByTestId('typeIcon')).toHaveAttribute('src', '/paper/action_fail.svg');
  });

  it('测试duration属性传入正常数据number,测试是否自动关闭在规定时间内', async () => {
    // 渲染Toast.svelte 组件
    render(Toast, { props: { message: '操作成功', duration: 500 } });

    // 快进时间到1000ms，因为还有动画时间
    await vi.advanceTimersByTime(1000);

    // 测试是否会自动结束
    expect(screen.queryByText('操作成功')).not.toBeInTheDocument();

    // 再次进行测试5000ms
    render(Toast, { props: { message: '操作成功', duration: 5000 } });

    await vi.advanceTimersByTime(5500);

    expect(screen.queryByText('操作成功')).not.toBeInTheDocument();
  });

  it('测试showClose的属性传入的数据符合规范', async () => {
    // 测试传入true的情况
    render(Toast, { props: { message: '操作成功', showClose: true } });
    expect(screen.getByTestId('closeBtn')).toBeInTheDocument();

    // 先快进到3500ms后，结束上面的render
    await vi.advanceTimersByTime(3500);

    // 测试传入false的情况
    render(Toast, { props: { message: '操作成功', showClose: false } });
    expect(screen.queryByTestId('closeBtn')).not.toBeInTheDocument();
  });

  it('测试是否能够点击关闭按钮关闭', async () => {
    // 渲染Toast.svelte 组件
    render(Toast, { props: { message: '操作成功', showClose: true } });

    // 点击关闭按钮
    screen.getByTestId('closeBtn').click();

    // 等待动画结束
    await vi.advanceTimersByTime(500);

    // 测试是否会消失
    expect(screen.queryByText('操作成功')).not.toBeInTheDocument();
  });

  it('测试type属性传入undefined,null,0,空字符串,其他字符串,其他类型数据,测试图标是否能正常处理并显示,控制台打印相关警告信息,组件内部进行容错处理', async () => {
    const spy = vi.spyOn(console, 'warn');
    // 传入undefined，默认显示success
    render(Toast, { props: { message: '操作成功', type: undefined } });

    expect(screen.getByText('操作成功')).toBeInTheDocument();

    expect(screen.getByTestId('typeIcon')).toHaveAttribute('src', '/paper/action_success.svg');

    // 结束渲染，由组件自己来销毁这个dom元素
    await vi.advanceTimersByTime(3500);

    // 传入unll，默认显示success
    render(Toast, { props: { message: '操作成功', type: null } });

    expect(screen.getByText('操作成功')).toBeInTheDocument();

    expect(screen.getByTestId('typeIcon')).toHaveAttribute('src', '/paper/action_success.svg');

    expect(spy).toHaveBeenCalledWith(
      "[Toast] 属性 'type' 无效: 类型错误,期望类型为string,实际类型为null, 已使用默认值 'success', 传入值为: 'null'",
    );

    await vi.advanceTimersByTime(3500);

    // 传入0，默认显示success
    render(Toast, { props: { message: '操作成功', type: 0 } });

    expect(screen.getByText('操作成功')).toBeInTheDocument();

    expect(screen.getByTestId('typeIcon')).toHaveAttribute('src', '/paper/action_success.svg');

    expect(spy).toHaveBeenCalledWith(
      "[Toast] 属性 'type' 无效: 类型错误,期望类型为string,实际类型为number, 已使用默认值 'success', 传入值为: '0'",
    );

    await vi.advanceTimersByTime(3500);

    // 传入空字符串，默认显示success
    render(Toast, { props: { message: '操作成功', type: '' } });

    expect(screen.getByText('操作成功')).toBeInTheDocument();

    expect(screen.getByTestId('typeIcon')).toHaveAttribute('src', '/paper/action_success.svg');

    expect(spy).toHaveBeenCalledWith("[Toast] 属性 'type' 无效: 期望的数据格式为 'success, error, warning, 已使用默认值 'success', 传入值为: ''");

    await vi.advanceTimersByTime(3500);

    // 传入其他字符串，默认显示success
    render(Toast, { props: { message: '操作成功', type: 'warning11' } });

    expect(screen.getByText('操作成功')).toBeInTheDocument();

    expect(screen.getByTestId('typeIcon')).toHaveAttribute('src', '/paper/action_success.svg');

    expect(spy).toHaveBeenCalledWith(
      "[Toast] 属性 'type' 无效: 期望的数据格式为 'success, error, warning, 已使用默认值 'success', 传入值为: 'warning11'",
    );

    await vi.advanceTimersByTime(3500);

    // 传入对象类型数据
    render(Toast, { props: { message: '操作成功', type: {} } });

    expect(screen.getByText('操作成功')).toBeInTheDocument();

    expect(screen.getByTestId('typeIcon')).toHaveAttribute('src', '/paper/action_success.svg');

    expect(spy).toHaveBeenCalledWith(
      "[Toast] 属性 'type' 无效: 类型错误,期望类型为string,实际类型为object, 已使用默认值 'success', 传入值为: '[object Object]'",
    );

    await vi.advanceTimersByTime(3500);

    // 传入数组类型数据
    render(Toast, { props: { message: '操作成功', type: [] } });

    expect(screen.getByText('操作成功')).toBeInTheDocument();

    expect(screen.getByTestId('typeIcon')).toHaveAttribute('src', '/paper/action_success.svg');

    expect(spy).toHaveBeenCalledWith(
      "[Toast] 属性 'type' 无效: 类型错误,期望类型为string,实际类型为array, 已使用默认值 'success', 传入值为: ''",
    );

    await vi.advanceTimersByTime(3500);

    // 传入函数类型数据
    render(Toast, { props: { message: '操作成功', type: () => {} } });

    expect(screen.getByText('操作成功')).toBeInTheDocument();

    expect(screen.getByTestId('typeIcon')).toHaveAttribute('src', '/paper/action_success.svg');

    expect(spy).toHaveBeenCalledWith(
      "[Toast] 属性 'type' 无效: 类型错误,期望类型为string,实际类型为function, 已使用默认值 'success', 传入值为: '() => {}'",
    );

    await vi.advanceTimersByTime(3500);

    // 传入boolean类型数据
    render(Toast, { props: { message: '操作成功', type: true } });

    expect(screen.getByText('操作成功')).toBeInTheDocument();

    expect(screen.getByTestId('typeIcon')).toHaveAttribute('src', '/paper/action_success.svg');

    expect(spy).toHaveBeenCalledWith(
      "[Toast] 属性 'type' 无效: 类型错误,期望类型为string,实际类型为boolean, 已使用默认值 'success', 传入值为: 'true'",
    );

    await vi.advanceTimersByTime(3500);

    // 传入number数据
    render(Toast, { props: { message: '操作成功', type: 1 } });

    expect(screen.getByText('操作成功')).toBeInTheDocument();

    expect(screen.getByTestId('typeIcon')).toHaveAttribute('src', '/paper/action_success.svg');

    expect(spy).toHaveBeenCalledWith(
      "[Toast] 属性 'type' 无效: 类型错误,期望类型为string,实际类型为number, 已使用默认值 'success', 传入值为: '1'",
    );
  });

  it('测试message属性传入的数据不符合规范后的处理方式,比如传入null,undefined,0,空字符串,其他类型数据,控制台打印相关警告信息,组件内部进行容错处理', async () => {
    const spy = vi.spyOn(console, 'warn');
    // 传入null
    render(Toast, { props: { message: null } });

    expect(screen.getByTestId('typeIcon')).toHaveAttribute('src', '/paper/action_success.svg');

    expect(spy).toHaveBeenCalledWith(
      "[Toast] 属性 'message' 无效: 类型错误,期望类型为string,实际类型为null, 已使用默认值 'success', 传入值为: 'null'",
    );

    // 结束这个toast信息
    await vi.advanceTimersByTime(3500);

    // 传入undefined
    render(Toast, { props: { message: undefined } });

    expect(screen.getByTestId('typeIcon')).toHaveAttribute('src', '/paper/action_success.svg');

    expect(spy).toHaveBeenCalledWith(
      "[Toast] 属性 'message' 无效: 类型错误,期望类型为string,实际类型为null, 已使用默认值 'success', 传入值为: 'null'",
    ); // 因为svelte的props传入undefined时会回退到那个属性自己默认的值,就会出现这样的情况

    await vi.advanceTimersByTime(3500);

    // 传入0
    render(Toast, { props: { message: 0 } });

    expect(screen.getByTestId('typeIcon')).toHaveAttribute('src', '/paper/action_success.svg');

    expect(spy).toHaveBeenCalledWith(
      "[Toast] 属性 'message' 无效: 类型错误,期望类型为string,实际类型为number, 已使用默认值 'success', 传入值为: '0'",
    );

    await vi.advanceTimersByTime(3500);

    // 传入空字符串
    render(Toast, { props: { message: '' } });

    expect(screen.getByTestId('typeIcon')).toHaveAttribute('src', '/paper/action_success.svg');

    expect(spy).toHaveBeenCalledWith("[Toast] 属性 'message' 无效: 提示文本内容不能为空, 已使用默认值 'success', 传入值为: ''");

    await vi.advanceTimersByTime(3500);

    // 传入其他类型数据
    render(Toast, { props: { message: {} } });

    expect(screen.getByTestId('typeIcon')).toHaveAttribute('src', '/paper/action_success.svg');

    expect(spy).toHaveBeenCalledWith(
      "[Toast] 属性 'message' 无效: 类型错误,期望类型为string,实际类型为object, 已使用默认值 'success', 传入值为: '[object Object]'",
    );

    await vi.advanceTimersByTime(3500);

    // 清除测试数据
    vi.clearAllTimers();
  });

  it('测试属性duration传入的数据不符合规茗后的处理方式,比如传入null,undefined,0,空字符串,其他类型数据,控制台打印相关警告信息,组件内部进行容错处理', async () => {
    const spy = vi.spyOn(console, 'warn');
    // 传入null
    render(Toast, { props: { message: '测试信息', duration: null } });

    expect(screen.getByTestId('typeIcon')).toHaveAttribute('src', '/paper/action_success.svg');

    expect(spy).toHaveBeenCalledWith(
      "[Toast] 属性 'duration' 无效: 类型错误,期望类型为number,实际类型为null, 已使用默认值 '3000', 传入值为: 'null'",
    );

    // 结束这个toast信息
    await vi.advanceTimersByTime(3500);

    // 传入undefined
    render(Toast, { props: { message: '测试信息', duration: undefined } });

    expect(screen.getByTestId('typeIcon')).toHaveAttribute('src', '/paper/action_success.svg');

    // 不会爆出来警告信息，因为svelte的props传入undefined时会回退到那个属性自己默认的值,就会出现这样的情况，官网上有说明

    await vi.advanceTimersByTime(3500);

    // 传入0
    render(Toast, { props: { message: '测试信息', duration: 0 } });

    expect(screen.getByTestId('typeIcon')).toHaveAttribute('src', '/paper/action_success.svg');

    expect(spy).toHaveBeenCalledWith("[Toast] 属性 'duration' 无效: 自动关闭时间必须大于0, 已使用默认值 '3000', 传入值为: '0'");

    await vi.advanceTimersByTime(3500);

    // 传入空字符串
    render(Toast, { props: { message: '测试信息', duration: '' } });

    expect(screen.getByTestId('typeIcon')).toHaveAttribute('src', '/paper/action_success.svg');

    expect(spy).toHaveBeenCalledWith("[Toast] 属性 'duration' 无效: 类型错误,期望类型为number,实际类型为string, 已使用默认值 '3000', 传入值为: ''");

    await vi.advanceTimersByTime(3500);

    // 传入其他类型数据
    render(Toast, { props: { message: '测试信息', duration: {} } });

    expect(screen.getByTestId('typeIcon')).toHaveAttribute('src', '/paper/action_success.svg');

    expect(spy).toHaveBeenCalledWith("[Toast] 属性 'duration' 无效: 类型错误,期望类型为number,实际类型为object, 已使用默认值 '3000', 传入值为: '[object Object]'");

    // 清除测试数据
    vi.clearAllTimers();
  });

  it('属性showClose传入的数据不符合规茗后的处理方式,控制台打印相关警告信息,组件内部进行容错处理', async () => {
    const spy = vi.spyOn(console, 'warn');
    // 传入null
    render(Toast, { props: { message: '测试信息', showClose: null } });

    expect(screen.getByTestId('typeIcon')).toHaveAttribute('src', '/paper/action_success.svg');

    expect(spy).toHaveBeenCalledWith("[Toast] 属性 'showClose' 无效: 类型错误,期望类型为boolean,实际类型为null, 已使用默认值 'true', 传入值为: 'null'");

    // 结束这个toast信息
    await vi.advanceTimersByTime(3500);

    // 传入undefined
    render(Toast, { props: { message: '测试信息', showClose: undefined } });

    expect(screen.getByTestId('typeIcon')).toHaveAttribute('src', '/paper/action_success.svg');

    // 不会爆出来警告信息，因为svelte的props传入undefined时会回退到那个属性自己默认的值,就会出现这样的情况，官网上有说明
    // expect(spy).toHaveBeenCalledWith("[Toast] 是否显示关闭按钮无效: 'undefined',应为布尔值boolean");

    await vi.advanceTimersByTime(3500);

    // 传入0
    render(Toast, { props: { message: '测试信息', showClose: 0 } });

    expect(screen.getByTestId('typeIcon')).toHaveAttribute('src', '/paper/action_success.svg');

    expect(spy).toHaveBeenCalledWith("[Toast] 属性 'showClose' 无效: 类型错误,期望类型为boolean,实际类型为number, 已使用默认值 'true', 传入值为: '0'");

    await vi.advanceTimersByTime(3500);

    // 传入空字符串
    render(Toast, { props: { message: '测试信息', showClose: '' } });

    expect(screen.getByTestId('typeIcon')).toHaveAttribute('src', '/paper/action_success.svg');

    expect(spy).toHaveBeenCalledWith("[Toast] 属性 'showClose' 无效: 类型错误,期望类型为boolean,实际类型为string, 已使用默认值 'true', 传入值为: ''");

    await vi.advanceTimersByTime(3500);

    // 传入其他类型数据
    render(Toast, { props: { message: '测试信息', showClose: {} } });

    expect(screen.getByTestId('typeIcon')).toHaveAttribute('src', '/paper/action_success.svg');

    expect(spy).toHaveBeenCalledWith("[Toast] 属性 'showClose' 无效: 类型错误,期望类型为boolean,实际类型为object, 已使用默认值 'true', 传入值为: '[object Object]'");

    // 清除测试数据
    vi.clearAllTimers();
  });

  // ====== Toast.js 测试 ======
  it('测试调用 toast.success(), toast.error(), toast.warning() 创建提示嫩否正常显示使用以及全局容器的正常挂载成功与否', () => {
    // 测试该开始全局未调用toast不会创建容器
    expect(document.querySelector('.toast-container')).not.toBeInTheDocument();

    // 调用toast.success
    toast.success('你好啊,我是春茂');

    // 测试全局是否挂载包含toast的总容器,挂载成功
    expect(document.querySelector('.toast-container')).toBeInTheDocument();

    // 测试全局是否有toast信息提示的内容
    expect(document.body).toHaveTextContent('你好啊,我是春茂');

    // 测试是不是成功图标
    expect(screen.getByTestId('typeIcon')).toHaveAttribute('src', '/paper/action_success.svg');

    // 测试是否3000毫秒加上动画500毫秒后自动消失
    vi.advanceTimersByTime(3500);
    expect(screen.queryByText('你好啊,我是春茂')).not.toBeInTheDocument();

    // 同理测试调用toast.error
    toast.error('你好啊,我不是春茂');

    // 测试全局是否有toast信息提示的内容
    expect(document.body).toHaveTextContent('你好啊,我不是春茂');

    // 测试是不是失败图标
    expect(screen.getByTestId('typeIcon')).toHaveAttribute('src', '/paper/action_fail.svg');

    // 测试是否3000毫秒加上动画500毫秒后自动消失
    vi.advanceTimersByTime(3500);
    expect(screen.queryByText('你好啊,我不是春茂')).not.toBeInTheDocument();

    // 同理测试调用toast.warning
    toast.warning('你好啊,我就是春茂,你要干什么？');

    // 测试全局是否有toast信息提示的内容
    expect(document.body).toHaveTextContent('你好啊,我就是春茂,你要干什么？');

    // 测试是不是警告图标
    expect(screen.getByTestId('typeIcon')).toHaveAttribute('src', '/student_answer_exam/preview-tip.svg');

    // 测试是否3000毫秒加上动画500毫秒后自动消失
    vi.advanceTimersByTime(3500);
    expect(screen.queryByText('你好啊,我就是春茂,你要干什么？')).not.toBeInTheDocument();
  });

  it('测试多个toast同时调用存在多个toast容器,同时保存在一个容器使用', () => {
    // 调用多个toast信息提示
    toast.success('你好啊,我是春茂');
    toast.error('你好啊,我不是春茂');
    toast.warning('你好啊,我就是春茂,你要干什么？');
    toast.success('你好啊,我是菜鸟');

    // 检查是不是只用一个父级容器来存储多个toast
    expect(document.querySelectorAll('.toast-container').length).toBe(1);
    // 检查有几个toast信息提示
    expect(document.querySelectorAll('.toast').length).toBe(4);

    // 测试一定时间后父级容器内的toast销毁
    vi.advanceTimersByTime(3500);
    expect(document.querySelectorAll('.toast').length).toBe(0);

    // 当所有的toast消失后父级容器销毁,不会存在这个父级容器
    expect(document.querySelectorAll('.toast-container').length).toBe(0);
  });
});
