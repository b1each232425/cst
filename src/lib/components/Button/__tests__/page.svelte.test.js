import { render, screen, fireEvent } from '@testing-library/svelte';
import { describe, expect, it, vi } from 'vitest';
import Button from '../Button.svelte';

/**
 * Button组件测试
 */
describe('Button 组件测试', () => {
  /**
   * 测试基础样式.botton
   */
  it('检测基础类名是否存在', () => {
    render(Button, { props: { children: () => '按钮' } });

    expect(screen.getByTestId('button')).toHaveClass('button');
  });

  /**
   * 测试默认样式
   */
  it('不加任何属性,应为默认样式', () => {
    render(Button, { props: { children: () => '按钮' } });

    // 检测是否有默认样式类名
    expect(screen.getByTestId('button')).toBeInTheDocument();
    expect(screen.getByTestId('button')).toHaveClass('button--primary');
    expect(screen.getByTestId('button')).toHaveClass('button--medium');

    // 检测是否没有其他样式
    expect(screen.getByTestId('button')).not.toHaveClass('button--success');
    expect(screen.getByTestId('button')).not.toHaveClass('button--warning');
    expect(screen.getByTestId('button')).not.toHaveClass('button--danger');
    expect(screen.getByTestId('button')).not.toHaveClass('button--info');
    expect(screen.getByTestId('button')).not.toHaveClass('is-plain');
    expect(screen.getByTestId('button')).not.toHaveClass('is-round');
    expect(screen.getByTestId('button')).not.toHaveClass('button--small');
    expect(screen.getByTestId('button')).not.toHaveClass('button--large');
    expect(screen.getByTestId('button')).not.toHaveClass('is-disabled');
  });

  /**
   * 测试plain属性
   */
  it('添加属性plain属性,值为true', () => {
    render(Button, { props: { children: () => '按钮', plain: true } });

    // 检测是否有相应样式
    expect(screen.getByTestId('button')).toHaveClass('is-plain');
  });

  it('属性plain值为false', () => {
    render(Button, { props: { children: () => '按钮', plain: false } });

    // 检测是否没有相应样式
    expect(screen.getByTestId('button')).not.toHaveClass('is-plain');
  });

  it('属性plain值为null,默认为false,控制台输出警告信息', () => {
    const spy = vi.spyOn(console, 'warn');
    render(Button, { props: { children: () => '按钮', plain: null } });

    // 检测是否没有相应样式
    expect(screen.getByTestId('button')).not.toHaveClass('is-plain');

    // 检测是否有控制台输出警告信息
    expect(spy).toHaveBeenCalledWith('[Button] plain 必须为布尔值，当前为 null');
  });

  it('属性plain值为undefined,默认为false,因为svelte的props传入undefined,这个plain属性会(Fallback values)', () => {
    render(Button, { props: { children: () => '按钮', plain: undefined } });

    // 检测是否没有相应样式
    expect(screen.getByTestId('button')).not.toHaveClass('is-plain');

    /** 因为svelte优化策略，传入的undefined会被忽略，这个plain属性会被忽略 */
    // https://svelte.dev/docs/svelte/%24props
  });

  it('属性plain值为空字符串,默认为false,控制台输出警告信息', () => {
    const spy = vi.spyOn(console, 'warn');
    render(Button, { props: { children: () => '按钮', plain: '' } });

    // 检测是否没有相应样式
    expect(screen.getByTestId('button')).not.toHaveClass('is-plain');

    // 检测是否有控制台输出警告信息
    expect(spy).toHaveBeenCalledWith('[Button] plain 必须为布尔值，当前为 string');
  });

  it('属性plain值为NAN,默认为false,控制台输出警告信息', () => {
    const spy = vi.spyOn(console, 'warn');
    render(Button, { props: { children: () => '按钮', plain: NaN } });

    // 检测是否没有相应样式
    expect(screen.getByTestId('button')).not.toHaveClass('is-plain');

    // 检测是否有控制台输出警告信息
    expect(spy).toHaveBeenCalledWith('[Button] plain 必须为布尔值，当前为 number');
  });

  it('属性plain值为对象,默认为false,控制台输出警告信息', () => {
    const spy = vi.spyOn(console, 'warn');
    render(Button, { props: { children: () => '按钮', plain: {} } });

    // 检测是否没有相应样式
    expect(screen.getByTestId('button')).not.toHaveClass('is-plain');

    // 检测是否有控制台输出警告信息
    expect(spy).toHaveBeenCalledWith('[Button] plain 必须为布尔值，当前为 object');
  });

  it('属性plain值为数组,默认为false,控制台输出警告信息', () => {
    const spy = vi.spyOn(console, 'warn');
    render(Button, { props: { children: () => '按钮', plain: [] } });

    // 检测是否没有相应样式
    expect(screen.getByTestId('button')).not.toHaveClass('is-plain');

    // 检测是否有控制台输出警告信息
    expect(spy).toHaveBeenCalledWith('[Button] plain 必须为布尔值，当前为 array');
  });

  it('属性plain值为函数,默认为false,控制台输出警告信息', () => {
    const spy = vi.spyOn(console, 'warn');
    const func = () => {};
    render(Button, { props: { children: () => '按钮', plain: func } });

    // 检测是否没有相应样式
    expect(screen.getByTestId('button')).not.toHaveClass('is-plain');

    // 检测是否有控制台输出警告信息
    expect(spy).toHaveBeenCalledWith('[Button] plain 必须为布尔值，当前为 function');
  });

  it('属性plain值为0,默认为false,控制台输出警告信息', () => {
    const spy = vi.spyOn(console, 'warn');
    render(Button, { props: { children: () => '按钮', plain: 0 } });

    // 检测是否没有相应样式
    expect(screen.getByTestId('button')).not.toHaveClass('is-plain');

    // 检测是否有控制台输出警告信息
    expect(spy).toHaveBeenCalledWith('[Button] plain 必须为布尔值，当前为 number');
  });

  /**
   * 测试disabled属性
   */
  it('属性disabled值为true,应为禁用', () => {
    const handleClick = vi.fn(() => {});
    render(Button, { props: { children: () => '按钮', disabled: true, onclick: handleClick } });

    // 检测是否有相应样式
    expect(screen.getByTestId('button')).toHaveClass('is-disabled');
    expect(screen.getByTestId('button')).toBeDisabled();

    // 检测是否不可点击
    fireEvent.click(screen.getByTestId('button'));
    expect(handleClick).not.toHaveBeenCalled();
  });

  it('属性disabled值为false,应为启用', () => {
    const handleClick = vi.fn(() => {});
    render(Button, { props: { children: () => '按钮', disabled: false, onclick: handleClick } });

    // 检测是否有相应样式
    expect(screen.getByTestId('button')).not.toHaveClass('is-disabled');
    expect(screen.getByTestId('button')).not.toBeDisabled();

    // 检测是否可点击
    fireEvent.click(screen.getByTestId('button'));
    expect(handleClick).toHaveBeenCalled();
  });

  it('属性disabled值传入null,转为启用,控制台输出警告信息', () => {
    const spy = vi.spyOn(console, 'warn');
    const handleClick = vi.fn(() => {});
    render(Button, { props: { children: () => '按钮', disabled: null, onclick: handleClick } });

    // 检测是否有相应样式
    expect(screen.getByTestId('button')).not.toHaveClass('is-disabled');
    expect(screen.getByTestId('button')).not.toBeDisabled();

    // 检测是否可点击
    fireEvent.click(screen.getByTestId('button'));
    expect(handleClick).toHaveBeenCalled();

    // 检测是否有控制台输出警告信息
    expect(spy).toHaveBeenCalledWith('[Button] disabled 必须为布尔值，当前为 null');
  });

  it('属性disabled值传入undefined,转为启用,因优化策略,属性disabled值为undefined时,其属性会(Fallback values)', () => {
    const handleClick = vi.fn(() => {});
    render(Button, { props: { children: () => '按钮', disabled: undefined, onclick: handleClick } });

    // 检测是否有相应样式
    expect(screen.getByTestId('button')).not.toHaveClass('is-disabled');
    expect(screen.getByTestId('button')).not.toBeDisabled();

    // 检测是否可点击
    fireEvent.click(screen.getByTestId('button'));
    expect(handleClick).toHaveBeenCalled();

    /** 因为svelte优化策略，传入的undefined会被忽略，这个size属性会被忽略 */
    // https://svelte.dev/docs/svelte/%24props
  });

  it('属性disabled值传入空字符串,转为启用,控制台输出警告信息', () => {
    const spy = vi.spyOn(console, 'warn');
    const handleClick = vi.fn(() => {});
    render(Button, { props: { children: () => '按钮', disabled: '', onclick: handleClick } });

    // 检测是否有相应样式
    expect(screen.getByTestId('button')).not.toHaveClass('is-disabled');
    expect(screen.getByTestId('button')).not.toBeDisabled();

    // 检测是否可点击
    fireEvent.click(screen.getByTestId('button'));
    expect(handleClick).toHaveBeenCalled();

    // 检测是否有控制台输出警告信息
    expect(spy).toHaveBeenCalledWith('[Button] disabled 必须为布尔值，当前为 string');
  });

  it('属性disabled值传入NAN,转为启用,控制台输出警告信息', () => {
    const spy = vi.spyOn(console, 'warn');
    const handleClick = vi.fn(() => {});
    render(Button, { props: { children: () => '按钮', disabled: NaN, onclick: handleClick } });

    // 检测是否有相应样式
    expect(screen.getByTestId('button')).not.toHaveClass('is-disabled');
    expect(screen.getByTestId('button')).not.toBeDisabled();

    // 检测是否可点击
    fireEvent.click(screen.getByTestId('button'));
    expect(handleClick).toHaveBeenCalled();

    // 检测是否有控制台输出警告信息
    expect(spy).toHaveBeenCalledWith('[Button] disabled 必须为布尔值，当前为 number');
  });

  it('属性disabled值传入对象,转为启用,控制台输出警告信息', () => {
    const spy = vi.spyOn(console, 'warn');
    const handleClick = vi.fn(() => {});
    render(Button, { props: { children: () => '按钮', disabled: {}, onclick: handleClick } });

    // 检测是否有相应样式
    expect(screen.getByTestId('button')).not.toHaveClass('is-disabled');
    expect(screen.getByTestId('button')).not.toBeDisabled();

    // 检测是否可点击
    fireEvent.click(screen.getByTestId('button'));
    expect(handleClick).toHaveBeenCalled();

    // 检测是否有控制台输出警告信息
    expect(spy).toHaveBeenCalledWith('[Button] disabled 必须为布尔值，当前为 object');
  });

  it('属性disabled值传入数组,转为启用,控制台输出警告信息', () => {
    const spy = vi.spyOn(console, 'warn');
    const handleClick = vi.fn(() => {});
    render(Button, { props: { children: () => '按钮', disabled: [], onclick: handleClick } });

    // 检测是否有相应样式
    expect(screen.getByTestId('button')).not.toHaveClass('is-disabled');
    expect(screen.getByTestId('button')).not.toBeDisabled();

    // 检测是否可点击
    fireEvent.click(screen.getByTestId('button'));
    expect(handleClick).toHaveBeenCalled();

    // 检测是否有控制台输出警告信息
    expect(spy).toHaveBeenCalledWith('[Button] disabled 必须为布尔值，当前为 array');
  });

  it('属性disabled值传入函数,转为启用,控制台输出警告信息', () => {
    const spy = vi.spyOn(console, 'warn');
    const handleClick = vi.fn(() => {});
    const func = () => {};
    render(Button, { props: { children: () => '按钮', disabled: func, onclick: handleClick } });

    // 检测是否有相应样式
    expect(screen.getByTestId('button')).not.toHaveClass('is-disabled');
    expect(screen.getByTestId('button')).not.toBeDisabled();

    // 检测是否可点击
    fireEvent.click(screen.getByTestId('button'));
    expect(handleClick).toHaveBeenCalled();

    // 检测是否有控制台输出警告信息
    expect(spy).toHaveBeenCalledWith('[Button] disabled 必须为布尔值，当前为 function');
  });

  it('属性disabled值传入0,转为启用,控制台输出警告信息', () => {
    const spy = vi.spyOn(console, 'warn');
    const handleClick = vi.fn(() => {});
    render(Button, { props: { children: () => '按钮', disabled: 0, onclick: handleClick } });

    // 检测是否有相应样式
    expect(screen.getByTestId('button')).not.toHaveClass('is-disabled');
    expect(screen.getByTestId('button')).not.toBeDisabled();

    // 检测是否可点击
    fireEvent.click(screen.getByTestId('button'));
    expect(handleClick).toHaveBeenCalled();

    // 检测是否有控制台输出警告信息
    expect(spy).toHaveBeenCalledWith('[Button] disabled 必须为布尔值，当前为 number');
  });

  /**
   * 测试size属性
   */
  it('属性size值为small,应为小尺寸', () => {
    render(Button, { props: { children: () => '按钮', size: 'small' } });

    // 检测是否为小尺寸样式
    expect(screen.getByTestId('button')).toHaveClass('button--small');
    expect(screen.getByTestId('button')).not.toHaveClass('button--medium');
    expect(screen.getByTestId('button')).not.toHaveClass('button--large');
  });

  it('属性size值为medium,应为中尺寸', () => {
    render(Button, { props: { children: () => '按钮', size: 'medium' } });

    // 检测是否为中尺寸样式
    expect(screen.getByTestId('button')).toHaveClass('button--medium');
    expect(screen.getByTestId('button')).not.toHaveClass('button--small');
    expect(screen.getByTestId('button')).not.toHaveClass('button--large');
  });

  it('属性size值为large,应为大尺寸', () => {
    render(Button, { props: { children: () => '按钮', size: 'large' } });

    // 检测是否为大尺寸样式
    expect(screen.getByTestId('button')).toHaveClass('button--large');
    expect(screen.getByTestId('button')).not.toHaveClass('button--small');
    expect(screen.getByTestId('button')).not.toHaveClass('button--medium');
  });

  it('属性size值传入其他string值,如test,转为为中尺寸,控制台输出警告信息', () => {
    const spy = vi.spyOn(console, 'warn');
    render(Button, { props: { children: () => '按钮', size: 'test' } });

    // 检测是否为中尺寸样式
    expect(screen.getByTestId('button')).toHaveClass('button--medium');
    expect(screen.getByTestId('button')).not.toHaveClass('button--small');
    expect(screen.getByTestId('button')).not.toHaveClass('button--large');

    // 检测是否有控制台输出警告信息
    expect(spy).toHaveBeenCalledWith("[Button] 尺寸无效: 'test'，应为 small, medium, large");
  });

  it('属性size值传入空字符串,转为中尺寸,控制台输出警告信息', () => {
    const spy = vi.spyOn(console, 'warn');
    render(Button, { props: { children: () => '按钮', size: '' } });

    // 检测是否为中尺寸样式
    expect(screen.getByTestId('button')).toHaveClass('button--medium');
    expect(screen.getByTestId('button')).not.toHaveClass('button--small');
    expect(screen.getByTestId('button')).not.toHaveClass('button--large');

    // 检测是否有控制台输出警告信息
    expect(spy).toHaveBeenCalledWith("[Button] 尺寸无效: ''，应为 small, medium, large");
  });

  it('属性size值传入null,转为中尺寸,控制台输出警告信息', () => {
    const spy = vi.spyOn(console, 'warn');
    render(Button, { props: { children: () => '按钮', size: null } });

    // 检测是否为中尺寸样式
    expect(screen.getByTestId('button')).toHaveClass('button--medium');
    expect(screen.getByTestId('button')).not.toHaveClass('button--small');
    expect(screen.getByTestId('button')).not.toHaveClass('button--large');

    // 检测是否有控制台输出警告信息
    expect(spy).toHaveBeenCalledWith("[Button] 尺寸无效: 'null'，应为 small, medium, large");
  });

  it('属性size值传入undefined,转为中尺寸,因为svelte问题传入的undefined会被忽略,这个size属性会(Fallback values)', () => {
    render(Button, { props: { children: () => '按钮', size: undefined } });

    // 检测是否为中尺寸样式
    expect(screen.getByTestId('button')).toHaveClass('button--medium');
    expect(screen.getByTestId('button')).not.toHaveClass('button--small');
    expect(screen.getByTestId('button')).not.toHaveClass('button--large');

    /** 因为svelte优化策略，传入的undefined会被忽略，这个size属性会被回退 */
    // https://svelte.dev/docs/svelte/%24props
  });

  it('属性size值传入NaN,转为中尺寸,控制台输出警告信息', () => {
    const spy = vi.spyOn(console, 'warn');
    render(Button, { props: { children: () => '按钮', size: NaN } });

    // 检测是否为中尺寸样式
    expect(screen.getByTestId('button')).toHaveClass('button--medium');
    expect(screen.getByTestId('button')).not.toHaveClass('button--small');
    expect(screen.getByTestId('button')).not.toHaveClass('button--large');

    // 检测是否有控制台输出警告信息
    expect(spy).toHaveBeenCalledWith("[Button] 尺寸无效: 'NaN'，应为 small, medium, large");
  });

  it('属性size值传入布尔值true,转为中尺寸,控制台输出警告信息', () => {
    const spy = vi.spyOn(console, 'warn');
    render(Button, { props: { children: () => '按钮', size: true } });

    // 检测是否为中尺寸样式
    expect(screen.getByTestId('button')).toHaveClass('button--medium');
    expect(screen.getByTestId('button')).not.toHaveClass('button--small');
    expect(screen.getByTestId('button')).not.toHaveClass('button--large');

    // 检测是否有控制台输出警告信息
    expect(spy).toHaveBeenCalledWith("[Button] 尺寸无效: 'true'，应为 small, medium, large");
  });

  it('属性size值传入布尔值false,转为中尺寸,控制台输出警告信息', () => {
    const spy = vi.spyOn(console, 'warn');
    render(Button, { props: { children: () => '按钮', size: false } });

    // 检测是否为中尺寸样式
    expect(screen.getByTestId('button')).toHaveClass('button--medium');
    expect(screen.getByTestId('button')).not.toHaveClass('button--small');
    expect(screen.getByTestId('button')).not.toHaveClass('button--large');

    // 检测是否有控制台输出警告信息
    expect(spy).toHaveBeenCalledWith("[Button] 尺寸无效: 'false'，应为 small, medium, large");
  });

  it('属性size值传入对象,转为中尺寸,控制台输出警告信息', () => {
    const spy = vi.spyOn(console, 'warn');
    render(Button, { props: { children: () => '按钮', size: {} } });

    // 检测是否为中尺寸样式
    expect(screen.getByTestId('button')).toHaveClass('button--medium');
    expect(screen.getByTestId('button')).not.toHaveClass('button--small');
    expect(screen.getByTestId('button')).not.toHaveClass('button--large');

    // 检测是否有控制台输出警告信息
    expect(spy).toHaveBeenCalledWith("[Button] 尺寸无效: '[object Object]'，应为 small, medium, large");
  });

  it('属性size值传入数组,转为中尺寸,控制台输出警告信息', () => {
    const spy = vi.spyOn(console, 'warn');
    render(Button, { props: { children: () => '按钮', size: [] } });

    // 检测是否为中尺寸样式
    expect(screen.getByTestId('button')).toHaveClass('button--medium');
    expect(screen.getByTestId('button')).not.toHaveClass('button--small');
    expect(screen.getByTestId('button')).not.toHaveClass('button--large');

    // 检测是否有控制台输出警告信息
    expect(spy).toHaveBeenCalledWith("[Button] 尺寸无效: ''，应为 small, medium, large");
  });

  it('属性size值传入函数,转为中尺寸,控制台输出警告信息', () => {
    const spy = vi.spyOn(console, 'warn');
    const func = () => {};
    render(Button, { props: { children: () => '按钮', size: func } });

    // 检测是否为中尺寸样式
    expect(screen.getByTestId('button')).toHaveClass('button--medium');
    expect(screen.getByTestId('button')).not.toHaveClass('button--small');
    expect(screen.getByTestId('button')).not.toHaveClass('button--large');

    // 检测是否有控制台输出警告信息
    expect(spy).toHaveBeenCalledWith("[Button] 尺寸无效: '() => {}'，应为 small, medium, large");
  });

  it('属性size值传入0,转为为中尺寸,控制台输出警告信息', () => {
    const spy = vi.spyOn(console, 'warn');
    render(Button, { props: { children: () => '按钮', size: 0 } });

    // 检测是否为中尺寸样式
    expect(screen.getByTestId('button')).toHaveClass('button--medium');
    expect(screen.getByTestId('button')).not.toHaveClass('button--small');
    expect(screen.getByTestId('button')).not.toHaveClass('button--large');

    // 检测是否有控制台输出警告信息
    expect(spy).toHaveBeenCalledWith("[Button] 尺寸无效: '0'，应为 small, medium, large");
  });

  /**
   * 测试type属性
   */
  it('属性type值为primary,应为主要按钮', () => {
    render(Button, { props: { children: () => '按钮', type: 'primary' } });

    expect(screen.getByTestId('button')).toBeInTheDocument();
    // 检测是否为主要按钮样式
    expect(screen.getByTestId('button')).toHaveClass('button--primary');
    expect(screen.getByTestId('button')).not.toHaveClass('button--success');
    expect(screen.getByTestId('button')).not.toHaveClass('button--warning');
    expect(screen.getByTestId('button')).not.toHaveClass('button--danger');
    expect(screen.getByTestId('button')).not.toHaveClass('button--info');
  });

  it('属性type值为success,应为成功按钮', () => {
    render(Button, { props: { children: () => '按钮', type: 'success' } });

    expect(screen.getByTestId('button')).toBeInTheDocument();
    // 检测是否为成功按钮样式
    expect(screen.getByTestId('button')).toHaveClass('button--success');
    expect(screen.getByTestId('button')).not.toHaveClass('button--primary');
    expect(screen.getByTestId('button')).not.toHaveClass('button--warning');
    expect(screen.getByTestId('button')).not.toHaveClass('button--danger');
    expect(screen.getByTestId('button')).not.toHaveClass('button--info');
  });

  it('属性type值为warning,应为警告按钮', () => {
    render(Button, { props: { children: () => '按钮', type: 'warning' } });

    expect(screen.getByTestId('button')).toBeInTheDocument();
    // 检测是否为控制台输出警告信息按钮样式
    expect(screen.getByTestId('button')).toHaveClass('button--warning');
    expect(screen.getByTestId('button')).not.toHaveClass('button--primary');
    expect(screen.getByTestId('button')).not.toHaveClass('button--success');
    expect(screen.getByTestId('button')).not.toHaveClass('button--danger');
    expect(screen.getByTestId('button')).not.toHaveClass('button--info');
  });

  it('属性type值为denger,应为危险按钮', () => {
    render(Button, { props: { children: () => '按钮', type: 'danger' } });

    expect(screen.getByTestId('button')).toBeInTheDocument();
    // 检测是否为危险按钮样式
    expect(screen.getByTestId('button')).toHaveClass('button--danger');
    expect(screen.getByTestId('button')).not.toHaveClass('button--primary');
    expect(screen.getByTestId('button')).not.toHaveClass('button--success');
    expect(screen.getByTestId('button')).not.toHaveClass('button--warning');
    expect(screen.getByTestId('button')).not.toHaveClass('button--info');
  });

  it('属性type值为info,应为信息按钮', () => {
    render(Button, { props: { children: () => '按钮', type: 'info' } });

    expect(screen.getByTestId('button')).toBeInTheDocument();
    // 检测是否为信息按钮样式
    expect(screen.getByTestId('button')).toHaveClass('button--info');
    expect(screen.getByTestId('button')).not.toHaveClass('button--primary');
    expect(screen.getByTestId('button')).not.toHaveClass('button--success');
    expect(screen.getByTestId('button')).not.toHaveClass('button--warning');
    expect(screen.getByTestId('button')).not.toHaveClass('button--danger');
  });

  it('属性type值传入其他string,转为主要按钮(primary),控制台输出警告信息', () => {
    const spy = vi.spyOn(console, 'warn');
    render(Button, { props: { children: () => '按钮', type: 'other' } });

    expect(screen.getByTestId('button')).toBeInTheDocument();
    // 检测是否为主要按钮样式
    expect(screen.getByTestId('button')).toHaveClass('button--primary');
    expect(screen.getByTestId('button')).not.toHaveClass('button--success');
    expect(screen.getByTestId('button')).not.toHaveClass('button--warning');
    expect(screen.getByTestId('button')).not.toHaveClass('button--danger');
    expect(screen.getByTestId('button')).not.toHaveClass('button--info');

    expect(spy).toHaveBeenCalledWith("[Button] 类型无效: 'other'，应为 primary, success, danger, warning, info");
  });

  it('属性type值传入number类型数据,转为主要按钮(primary),控制台输出警告信息', () => {
    const spy = vi.spyOn(console, 'warn');
    render(Button, { props: { children: () => '按钮', type: 1 } });

    expect(screen.getByTestId('button')).toBeInTheDocument();
    // 检测是否为主要按钮样式
    expect(screen.getByTestId('button')).toHaveClass('button--primary');
    expect(screen.getByTestId('button')).not.toHaveClass('button--success');
    expect(screen.getByTestId('button')).not.toHaveClass('button--warning');
    expect(screen.getByTestId('button')).not.toHaveClass('button--danger');
    expect(screen.getByTestId('button')).not.toHaveClass('button--info');

    // 检测是否有控制台输出警告信息
    expect(spy).toHaveBeenCalledWith("[Button] 类型无效: '1'，应为 primary, success, danger, warning, info");
  });

  it('属性type值传入boolean类型数据,转为为主要按钮(primary),控制台输出警告信息', () => {
    const spy = vi.spyOn(console, 'warn');
    render(Button, { props: { children: () => '按钮', type: true } });

    expect(screen.getByTestId('button')).toBeInTheDocument();
    // 检测是否为主要按钮样式
    expect(screen.getByTestId('button')).toHaveClass('button--primary');
    expect(screen.getByTestId('button')).not.toHaveClass('button--success');
    expect(screen.getByTestId('button')).not.toHaveClass('button--warning');
    expect(screen.getByTestId('button')).not.toHaveClass('button--danger');
    expect(screen.getByTestId('button')).not.toHaveClass('button--info');

    // 检测是否有控制台输出警告信息
    expect(spy).toHaveBeenCalledWith("[Button] 类型无效: 'true'，应为 primary, success, danger, warning, info");
  });

  it('属性type值传入数组[]数据,转为为主要按钮(primary),控制台输出警告信息', () => {
    const spy = vi.spyOn(console, 'warn');
    render(Button, { props: { children: () => '按钮', type: [] } });

    expect(screen.getByTestId('button')).toBeInTheDocument();
    expect(screen.getByTestId('button')).toHaveClass('button--primary');
    expect(screen.getByTestId('button')).not.toHaveClass('button--success');
    expect(screen.getByTestId('button')).not.toHaveClass('button--warning');
    expect(screen.getByTestId('button')).not.toHaveClass('button--danger');
    expect(screen.getByTestId('button')).not.toHaveClass('button--info');

    expect(spy).toHaveBeenCalledWith("[Button] 类型无效: ''，应为 primary, success, danger, warning, info");
  });

  it('属性type值传入函数function,转为为主要按钮(primary),控制台输出警告信息', () => {
    const spy = vi.spyOn(console, 'warn');
    const func = function () {};
    render(Button, { props: { children: () => '按钮', type: func } });

    expect(screen.getByTestId('button')).toBeInTheDocument();
    expect(screen.getByTestId('button')).toHaveClass('button--primary');
    expect(screen.getByTestId('button')).not.toHaveClass('button--success');
    expect(screen.getByTestId('button')).not.toHaveClass('button--warning');
    expect(screen.getByTestId('button')).not.toHaveClass('button--danger');
    expect(screen.getByTestId('button')).not.toHaveClass('button--info');

    expect(spy).toHaveBeenCalledWith(
      "[Button] 类型无效: 'function () {}'，应为 primary, success, danger, warning, info",
    );
  });

  it('属性type值传入null,转为主要按钮(primary),控制台输出警告信息', () => {
    const spy = vi.spyOn(console, 'warn');
    render(Button, { props: { children: () => '按钮', type: null } });

    expect(screen.getByTestId('button')).toBeInTheDocument();
    // 检测是否为主要按钮样式
    expect(screen.getByTestId('button')).toHaveClass('button--primary');
    expect(screen.getByTestId('button')).not.toHaveClass('button--success');
    expect(screen.getByTestId('button')).not.toHaveClass('button--warning');
    expect(screen.getByTestId('button')).not.toHaveClass('button--danger');
    expect(screen.getByTestId('button')).not.toHaveClass('button--info');

    // 检测是否有控制台输出警告信息
    expect(spy).toHaveBeenCalledWith("[Button] 类型无效: 'null'，应为 primary, success, danger, warning, info");
  });

  it('属性type值传入undefined,转为主要按钮(primary),因为svelte的props传入undefined,其属性会(Fallback values)', () => {
    render(Button, { props: { children: () => '按钮', type: undefined } });

    expect(screen.getByTestId('button')).toBeInTheDocument();
    // 检测是否为主要按钮样式
    expect(screen.getByTestId('button')).toHaveClass('button--primary');
    expect(screen.getByTestId('button')).not.toHaveClass('button--success');
    expect(screen.getByTestId('button')).not.toHaveClass('button--warning');
    expect(screen.getByTestId('button')).not.toHaveClass('button--danger');
    expect(screen.getByTestId('button')).not.toHaveClass('button--info');

    // 因为svelte的props传入undefined,其属性会(Fallback values),所以不会有控制台输出警告信息
    // https://svelte.dev/docs/svelte/%24props
  });

  it('属性type值传入NaN,转为主要按钮(primary),控制台输出警告信息', () => {
    const spy = vi.spyOn(console, 'warn');
    render(Button, { props: { children: () => '按钮', type: NaN } });

    expect(screen.getByTestId('button')).toBeInTheDocument();
    // 检测是否为主要按钮样式
    expect(screen.getByTestId('button')).toHaveClass('button--primary');
    expect(screen.getByTestId('button')).not.toHaveClass('button--success');
    expect(screen.getByTestId('button')).not.toHaveClass('button--warning');
    expect(screen.getByTestId('button')).not.toHaveClass('button--danger');
    expect(screen.getByTestId('button')).not.toHaveClass('button--info');

    // 检测是否有控制台输出警告信息
    expect(spy).toHaveBeenCalledWith("[Button] 类型无效: 'NaN'，应为 primary, success, danger, warning, info");
  });

  it('属性type值传入空字符串,转为主要按钮(primary),控制台输出警告信息', () => {
    const spy = vi.spyOn(console, 'warn');
    render(Button, { props: { children: () => '按钮', type: '' } });

    expect(screen.getByTestId('button')).toBeInTheDocument();
    // 检测是否为主要按钮样式
    expect(screen.getByTestId('button')).toHaveClass('button--primary');
    expect(screen.getByTestId('button')).not.toHaveClass('button--success');
    expect(screen.getByTestId('button')).not.toHaveClass('button--warning');
    expect(screen.getByTestId('button')).not.toHaveClass('button--danger');
    expect(screen.getByTestId('button')).not.toHaveClass('button--info');

    // 检测是否有控制台输出警告信息
    expect(spy).toHaveBeenCalledWith("[Button] 类型无效: ''，应为 primary, success, danger, warning, info");
  });

  it('属性type值传入0,转为主要按钮(primary),控制台输出警告信息', () => {
    const spy = vi.spyOn(console, 'warn');
    render(Button, { props: { children: () => '按钮', type: 0 } });

    expect(screen.getByTestId('button')).toBeInTheDocument();
    // 检测是否为主要按钮样式
    expect(screen.getByTestId('button')).toHaveClass('button--primary');
    expect(screen.getByTestId('button')).not.toHaveClass('button--success');
    expect(screen.getByTestId('button')).not.toHaveClass('button--warning');
    expect(screen.getByTestId('button')).not.toHaveClass('button--danger');
    expect(screen.getByTestId('button')).not.toHaveClass('button--info');

    // 检测是否有控制台输出警告信息
    expect(spy).toHaveBeenCalledWith("[Button] 类型无效: '0'，应为 primary, success, danger, warning, info");
  });

  /**
   * 测试round属性
   */
  it('属性round值为true,应为圆角按钮', () => {
    render(Button, { props: { children: () => '按钮', round: true } });

    expect(screen.getByTestId('button')).toBeInTheDocument();
    // 检测是否为圆角按钮
    expect(screen.getByTestId('button')).toHaveClass('is-round');
  });

  it('属性round值为false,应不为圆角按钮', () => {
    render(Button, { props: { children: () => '按钮', round: false } });

    expect(screen.getByTestId('button')).toBeInTheDocument();
    // 检测是否为圆角按钮
    expect(screen.getByTestId('button')).not.toHaveClass('is-round');
  });

  it('属性round值为null,控制台输出警告信息', () => {
    const spy = vi.spyOn(console, 'warn');
    render(Button, { props: { children: () => '按钮', round: null } });

    expect(screen.getByTestId('button')).toBeInTheDocument();
    // 检测是否为圆角按钮
    expect(screen.getByTestId('button')).not.toHaveClass('is-round');

    // 检测是否有控制台输出警告信息
    expect(spy).toHaveBeenCalledWith('[Button] round 必须为布尔值，当前为 null');
  });

  it('属性round值为undefined,默认不为圆角,因为svelte传入props时为undefined,其属性会回退到默认值', () => {
    render(Button, { props: { children: () => '按钮', round: undefined } });

    expect(screen.getByTestId('button')).toBeInTheDocument();
    // 检测是否为圆角按钮
    expect(screen.getByTestId('button')).not.toHaveClass('is-round');

    // 因为svelte传入props时为undefined,其属性会回退到默认值
    // https://svelte.dev/docs/svelte/%24props
  });

  it('属性round值为空字符串,控制台输出警告信息', () => {
    const spy = vi.spyOn(console, 'warn');
    render(Button, { props: { children: () => '按钮', round: '' } });

    expect(screen.getByTestId('button')).toBeInTheDocument();
    // 检测是否为圆角按钮
    expect(screen.getByTestId('button')).not.toHaveClass('is-round');

    // 检测是否有控制台输出警告信息
    expect(spy).toHaveBeenCalledWith('[Button] round 必须为布尔值，当前为 string');
  });

  it('属性round值传入数组,控制台输出警告信息', () => {
    const spy = vi.spyOn(console, 'warn');
    render(Button, { props: { children: () => '按钮', round: [] } });

    expect(screen.getByTestId('button')).toBeInTheDocument();
    // 检测是否为圆角按钮
    expect(screen.getByTestId('button')).not.toHaveClass('is-round');

    // 检测是否有控制台输出警告信息
    expect(spy).toHaveBeenCalledWith('[Button] round 必须为布尔值，当前为 array');
  });

  it('属性round值传入函数,控制台输出警告信息', () => {
    const spy = vi.spyOn(console, 'warn');
    render(Button, { props: { children: () => '按钮', round: () => {} } });

    expect(screen.getByTestId('button')).toBeInTheDocument();
    // 检测是否为圆角按钮
    expect(screen.getByTestId('button')).not.toHaveClass('is-round');

    // 检测是否有控制台输出警告信息
    expect(spy).toHaveBeenCalledWith('[Button] round 必须为布尔值，当前为 function');
  });

  it('属性round值传入对象,控制台输出警告信息', () => {
    const spy = vi.spyOn(console, 'warn');
    render(Button, { props: { children: () => '按钮', round: {} } });

    expect(screen.getByTestId('button')).toBeInTheDocument();
    // 检测是否为圆角按钮
    expect(screen.getByTestId('button')).not.toHaveClass('is-round');

    // 检测是否有控制台输出警告信息
    expect(spy).toHaveBeenCalledWith('[Button] round 必须为布尔值，当前为 object');
  });

  it('属性round值传入字符串,控制台输出警告信息', () => {
    const spy = vi.spyOn(console, 'warn');
    render(Button, { props: { children: () => '按钮', round: 'true' } });

    expect(screen.getByTestId('button')).toBeInTheDocument();
    // 检测是否为圆角按钮
    expect(screen.getByTestId('button')).not.toHaveClass('is-round');

    // 检测是否有控制台输出警告信息
    expect(spy).toHaveBeenCalledWith('[Button] round 必须为布尔值，当前为 string');
  });

  it('属性round值为0,控制台输出警告信息', () => {
    const spy = vi.spyOn(console, 'warn');
    render(Button, { props: { children: () => '按钮', round: 0 } });

    expect(screen.getByTestId('button')).toBeInTheDocument();
    // 检测是否为圆角按钮
    expect(screen.getByTestId('button')).not.toHaveClass('is-round');

    // 检测是否有控制台输出警告信息
    expect(spy).toHaveBeenCalledWith('[Button] round 必须为布尔值，当前为 number');
  });

  /**
   * 测试icon属性
   */
  it('属性icon值为本地有效图标url,正常渲染', () => {
    render(Button, { props: { children: () => '按钮', icon: '/mark/i-sort-down.svg' } });

    expect(screen.getByTestId('icon')).toBeInTheDocument();
    expect(screen.getByTestId('button')).toBeInTheDocument();
    // 检测是否有图标
    expect(screen.getByTestId('icon')).toHaveAttribute('src', '/mark/i-sort-down.svg');
  });

  it('属性icon值为有效网络图标url,正常渲染', () => {
    render(Button, { props: { children: () => '按钮', icon: 'https://example.com/icon.png' } });

    expect(screen.getByTestId('icon')).toBeInTheDocument();
    expect(screen.getByTestId('button')).toBeInTheDocument();
    // 检测是否有图标
    expect(screen.getByTestId('icon')).toHaveAttribute('src', 'https://example.com/icon.png');
  });

  it('属性icon值为无效图标url,不会渲染图标,控制台输出警告信息', () => {
    const spy = vi.spyOn(console, 'warn');
    render(Button, { props: { children: () => '按钮', icon: ' invalid-url' } });

    expect(screen.queryByTestId('icon')).not.toBeInTheDocument();
    expect(screen.getByTestId('button')).toBeInTheDocument();

    // 检测是否有控制台输出警告信息
    expect(spy).toHaveBeenCalledWith('[Button] icon 路径无效，应为网络路径（http/https）或本地路径（/、./）');
  });

  it('属性icon值为空字符串,不会渲染图标,这个为默认值', () => {
    render(Button, { props: { children: () => '按钮', icon: '' } });

    expect(screen.queryByTestId('icon')).not.toBeInTheDocument();
    expect(screen.getByTestId('button')).toBeInTheDocument();
  });

  it('属性icon值为null,不会渲染图标,控制台输出警告信息', () => {
    const spy = vi.spyOn(console, 'warn');
    render(Button, { props: { children: () => '按钮', icon: null } });

    expect(screen.queryByTestId('icon')).not.toBeInTheDocument();
    expect(screen.getByTestId('button')).toBeInTheDocument();

    // 检测是否有控制台输出警告信息
    expect(spy).toHaveBeenCalledWith('[Button] icon 类型应为字符串类型（图片路径），当前为 null');
  });

  it('属性icon值为undefined,不会渲染图标,因为svelte传入props时为undefined,其属性会回退到默认值', () => {
    render(Button, { props: { children: () => '按钮', icon: undefined } });

    expect(screen.queryByTestId('icon')).not.toBeInTheDocument();
    expect(screen.getByTestId('button')).toBeInTheDocument();

    // 因优化策略,属性icon值为undefined时,其属性会回退为默认值
    // https://svelte.dev/docs/svelte/%24props
  });

  it('属性icon值为0,不会渲染图标,控制台输出警告信息', () => {
    const spy = vi.spyOn(console, 'warn');
    render(Button, { props: { children: () => '按钮', icon: 0 } });

    expect(screen.queryByTestId('icon')).not.toBeInTheDocument();
    expect(screen.getByTestId('button')).toBeInTheDocument();

    // 检测是否有控制台输出警告信息
    expect(spy).toHaveBeenCalledWith('[Button] icon 类型应为字符串类型（图片路径），当前为 number');
  });

  it('属性icon值为非字符串类型,控制台输出警告信息', () => {
    const spy = vi.spyOn(console, 'warn');
    render(Button, { props: { children: () => '按钮', icon: 123 } });

    expect(screen.queryByTestId('icon')).not.toBeInTheDocument();
    expect(screen.getByTestId('button')).toBeInTheDocument();

    // 检测是否有控制台输出警告信息
    expect(spy).toHaveBeenCalledWith('[Button] icon 类型应为字符串类型（图片路径），当前为 number');
  });

  /**
   * 测试alt属性
   */
  it('传入有效icon情况下,传入alt为""（空字符串）,应渲染默认alt并输出警告信息', () => {
    const spy = vi.spyOn(console, 'warn');
    render(Button, {
      props: {
        children: () => '按钮',
        icon: '/mark/i-sort-down.svg',
        alt: '',
      },
    });

    // 检测是否有渲染默认icon
    expect(screen.getByTestId('icon')).toHaveAttribute('alt', 'icon');
    // 检测控制台信息
    expect(spy).toHaveBeenCalledWith('[Button] alt 应为有效字符串,当前为 :string');
  });

  it('传入有效icon情况下,传入alt为null,应渲染默认alt并输出警告信息', () => {
    const spy = vi.spyOn(console, 'warn');
    render(Button, {
      props: {
        children: () => '按钮',
        icon: '/mark/i-sort-down.svg',
        alt: null,
      },
    });

    // 检测是否有渲染默认icon
    expect(screen.getByTestId('icon')).toHaveAttribute('alt', 'icon');
    expect(spy).toHaveBeenCalledWith('[Button] alt 应为有效字符串,当前为 null:null');
  });

  it('传入有效icon情况下,传入alt为undefined,应渲染默认alt,组件内部不会被传入alt属性', () => {
    render(Button, {
      props: {
        children: () => '按钮',
        icon: '/mark/i-sort-down.svg',
        alt: undefined, // svelte优化：不会传入undefined，就是不会传入这个属性
      },
    });

    expect(screen.getByTestId('icon')).toHaveAttribute('alt', 'icon');
  });

  it('传入有效icon情况下,传入alt为0,应渲染默认alt并输出警告信息', () => {
    const spy = vi.spyOn(console, 'warn');
    render(Button, {
      props: {
        children: () => '按钮',
        icon: '/mark/i-sort-down.svg',
        alt: 0,
      },
    });

    // 检测是否有渲染默认icon
    expect(screen.getByTestId('icon')).toHaveAttribute('alt', 'icon');
    // 检测控制台信息
    expect(spy).toHaveBeenCalledWith('[Button] alt 应为有效字符串,当前为 0:number');
  });

  it('传入有效icon情况下,传入alt为true,应渲染默认alt并输出警告信息', () => {
    const spy = vi.spyOn(console, 'warn');
    render(Button, {
      props: {
        children: () => '按钮',
        icon: '/mark/i-sort-down.svg',
        alt: true,
      },
    });

    // 检测是否有渲染默认icon
    expect(screen.getByTestId('icon')).toHaveAttribute('alt', 'icon');
    // 检测控制台信息
    expect(spy).toHaveBeenCalledWith('[Button] alt 应为有效字符串,当前为 true:boolean');
  });

  it('传入有效icon情况下,传入alt为对象{},应渲染默认alt并输出警告信息', () => {
    const spy = vi.spyOn(console, 'warn');
    render(Button, {
      props: {
        children: () => '按钮',
        icon: '/mark/i-sort-down.svg',
        alt: {},
      },
    });

    expect(screen.getByTestId('icon')).toHaveAttribute('alt', 'icon');
    expect(spy).toHaveBeenCalledWith('[Button] alt 应为有效字符串,当前为 [object Object]:object');
  });

  it('传入有效icon情况下,传入alt为数组[],应渲染默认alt并输出警告信息', () => {
    const spy = vi.spyOn(console, 'warn');
    render(Button, {
      props: {
        children: () => '按钮',
        icon: '/mark/i-sort-down.svg',
        alt: [],
      },
    });

    expect(screen.getByTestId('icon')).toHaveAttribute('alt', 'icon');
    expect(spy).toHaveBeenCalledWith('[Button] alt 应为有效字符串,当前为 :array');
  });

  it('传入有效icon情况下,传入alt为函数,应渲染默认alt并输出警告信息', () => {
    const spy = vi.spyOn(console, 'warn');
    const fn = () => {};
    render(Button, {
      props: {
        children: () => '按钮',
        icon: '/mark/i-sort-down.svg',
        alt: fn,
      },
    });

    expect(screen.getByTestId('icon')).toHaveAttribute('alt', 'icon');
    expect(spy).toHaveBeenCalledWith('[Button] alt 应为有效字符串,当前为 () => {}:function');
  });

  it('传入有效icon情况下,传入alt为合法字符串,应正常渲染,不输出警告信息', () => {
    const spy = vi.spyOn(console, 'warn');
    render(Button, {
      props: {
        children: () => '按钮',
        icon: '/mark/i-sort-down.svg',
        alt: '图标描述',
      },
    });

    expect(screen.getByTestId('icon')).toHaveAttribute('alt', '图标描述');
    expect(spy).not.toHaveBeenCalled();
  });

  /**
   * 测试height属性
   */
  it('属性height值为空字符串,不会渲染高度样式', () => {
    render(Button, { props: { children: () => '按钮', height: '' } });
    expect(screen.getByTestId('button').style.height).toBe('');
  });

  it('属性height值为有效的数字,正常渲染,单位默认为px', () => {
    render(Button, { props: { children: () => '按钮', height: 100 } });
    expect(screen.getByTestId('button').style.height).toBe('100px');
  });

  it('属性height值为有效的数字字符串,正常渲染,单位默认为px', () => {
    render(Button, { props: { children: () => '按钮', height: '100' } });
    expect(screen.getByTestId('button').style.height).toBe('100px');
  });

  it('属性height值为有效的带单位字符串,正常渲染', () => {
    render(Button, { props: { children: () => '按钮', height: '100px' } });
    expect(screen.getByTestId('button')).toHaveStyle({ height: '100px' });
  });

  it('属性height值为0,正常渲染,单位为px', () => {
    render(Button, { props: { children: () => '按钮', height: 0 } });
    expect(screen.getByTestId('button').style.height).toBe('0px');
  });

  it('属性height值为0字符串,正常渲染,单位为px', () => {
    render(Button, { props: { children: () => '按钮', height: '0' } });
    expect(screen.getByTestId('button').style.height).toBe('0px');
  });

  it('属性height值为小数,正常渲染,单位为px', () => {
    render(Button, { props: { children: () => '按钮', height: 12.5 } });
    expect(screen.getByTestId('button').style.height).toBe('12.5px');
  });

  it('属性height值为小数字符串,正常渲染,单位为px', () => {
    render(Button, { props: { children: () => '按钮', height: '12.5' } });
    expect(screen.getByTestId('button').style.height).toBe('12.5px');
  });

  it('属性height值为带小数的带单位字符串,正常渲染', () => {
    render(Button, { props: { children: () => '按钮', height: '12.5em' } });
    expect(screen.getByTestId('button')).toHaveStyle({ height: '12.5em' });
  });

  it('属性height值为负数,渲染为0,单位为px', () => {
    render(Button, { props: { children: () => '按钮', height: -100 } });
    expect(screen.getByTestId('button').style.height).toBe('0px');
  });

  it('属性height值为负数字符串,渲染为0,单位为px', () => {
    render(Button, { props: { children: () => '按钮', height: '-100' } });
    expect(screen.getByTestId('button').style.height).toBe('0px');
  });

  it('属性height值为带负数的带单位字符串,渲染为0', () => {
    render(Button, { props: { children: () => '按钮', height: '-100px' } });
    expect(screen.getByTestId('button')).toHaveStyle({ height: '0px' });
  });

  it('属性height值为无效的值(字符串),默认为空字符串，控制台输出警告信息', () => {
    const spy = vi.spyOn(console, 'warn');
    render(Button, { props: { children: () => '按钮', height: ' invalid-value' } });
    expect(screen.getByTestId('button')).toHaveStyle({ height: '' });
    expect(spy).toHaveBeenCalledWith("[Button] height 格式无效，应为数字加单位（例如 '40px', '3rem'）");
  });

  it('属性height值为无效的单位,默认为空字符串，控制台输出警告信息', () => {
    const spy = vi.spyOn(console, 'warn');
    render(Button, { props: { children: () => '按钮', height: '100invalid' } });
    expect(screen.getByTestId('button').style.height).not.toBe('100invalid');
    expect(spy).toHaveBeenCalledWith("[Button] 不支持的单位: 'invalid'，应为 px, em, rem, %, vw, vh");
  });

  it('属性height值为null,默认为空字符串，控制台输出警告信息', () => {
    const spy = vi.spyOn(console, 'warn');
    render(Button, { props: { children: () => '按钮', height: null } });
    expect(screen.getByTestId('button')).toHaveStyle({ height: '' });
    expect(spy).toHaveBeenCalledWith("[Button] height 应为字符串或数字（例如 '40px', '3rem'），当前为 null");
  });

  it('属性height值为undefined,不会渲染高度样式,因为svelte传入props时为undefined,会被忽略,值回退为默认值', () => {
    render(Button, { props: { children: () => '按钮', height: undefined } });
    expect(screen.getByTestId('button')).toHaveStyle({ height: '' });
  });

  it('属性height值为布尔值true,默认为空字符串，控制台输出警告信息', () => {
    const spy = vi.spyOn(console, 'warn');
    render(Button, { props: { children: () => '按钮', height: true } });
    expect(screen.getByTestId('button')).toHaveStyle({ height: '' });
    expect(spy).toHaveBeenCalledWith("[Button] height 应为字符串或数字（例如 '40px', '3rem'），当前为 boolean");
  });

  it('属性height值为布尔值false,默认为空字符串，控制台输出警告信息', () => {
    const spy = vi.spyOn(console, 'warn');
    render(Button, { props: { children: () => '按钮', height: false } });
    expect(screen.getByTestId('button')).toHaveStyle({ height: '' });
    expect(spy).toHaveBeenCalledWith("[Button] height 应为字符串或数字（例如 '40px', '3rem'），当前为 boolean");
  });

  it('属性height值为对象,默认为空字符串，控制台输出警告信息', () => {
    const spy = vi.spyOn(console, 'warn');
    render(Button, { props: { children: () => '按钮', height: {} } });
    expect(screen.getByTestId('button')).toHaveStyle({ height: '' });
    expect(spy).toHaveBeenCalledWith("[Button] height 应为字符串或数字（例如 '40px', '3rem'），当前为 object");
  });

  it('属性height值为数组,默认为空字符串，控制台输出警告信息', () => {
    const spy = vi.spyOn(console, 'warn');
    render(Button, { props: { children: () => '按钮', height: [] } });
    expect(screen.getByTestId('button')).toHaveStyle({ height: '' });
    expect(spy).toHaveBeenCalledWith("[Button] height 应为字符串或数字（例如 '40px', '3rem'），当前为 array");
  });

  it('属性height值为函数,默认为空字符串，控制台输出警告信息', () => {
    const spy = vi.spyOn(console, 'warn');
    render(Button, { props: { children: () => '按钮', height: () => {} } });
    expect(screen.getByTestId('button')).toHaveStyle({ height: '' });
    expect(spy).toHaveBeenCalledWith("[Button] height 应为字符串或数字（例如 '40px', '3rem'），当前为 function");
  });

  /**
   * 测试width属性
   */ 1;
  it('属性width值为空字符串,不会渲染宽度样式', () => {
    render(Button, { props: { children: () => '按钮', width: '' } });

    expect(screen.getByTestId('button').style.width).toBe('');
  });

  it('属性width值为有效的数字,正常渲染,单位默认为px', () => {
    render(Button, { props: { children: () => '按钮', width: 100 } });

    expect(screen.getByTestId('button').style.width).toBe('100px');
  });

  it('属性width值为有效的数字字符串,正常渲染,单位默认为px', () => {
    render(Button, { props: { children: () => '按钮', width: '100' } });

    expect(screen.getByTestId('button').style.width).toBe(`100px`);
    // expect(screen.getByTestId('button')).toHaveStyle({ width: '100px;' });
  });

  it('属性width值为有效的带单位字符串,正常渲染', () => {
    render(Button, { props: { children: () => '按钮', width: '100px' } });

    expect(screen.getByTestId('button')).toHaveStyle({ width: '100px' });
  });

  it('属性width值为无效的值(字符串),默认为空字符串，控制台输出警告信息', () => {
    const spy = vi.spyOn(console, 'warn');
    render(Button, { props: { children: () => '按钮', width: ' invalid-value' } });

    expect(screen.getByTestId('button')).toHaveStyle({ width: '' });

    // 检测是否有控制台输出警告信息
    expect(spy).toHaveBeenCalledWith("[Button] width 格式无效，应为正数加单位（例如 '100px', '2em'）");
  });

  it('属性width值为无效的单位,默认为空字符串，控制台输出警告信息', () => {
    const spy = vi.spyOn(console, 'warn');
    render(Button, { props: { children: () => '按钮', width: '100invalid' } });

    expect(screen.getByTestId('button').style.width).not.toBe('100invalid');

    // 检测是否有控制台输出警告信息
    expect(spy).toHaveBeenCalledWith("[Button] 不支持的单位: 'invalid'，应为 px, em, rem, %, vw, vh");
  });

  it('属性width值为null,默认为空字符串，控制台输出警告信息', () => {
    const spy = vi.spyOn(console, 'warn');
    render(Button, { props: { children: () => '按钮', width: null } });

    expect(screen.getByTestId('button')).toHaveStyle({ width: '' });

    // 检测是否有控制台输出警告信息
    expect(spy).toHaveBeenCalledWith("[Button] width 应为字符串或数字（例如 '100px', '2em'），当前为 null");
  });

  it('属性width值为undefined,不会渲染宽度样式,因为svelte传入props时为undefined,会被忽略,值回退为默认值', () => {
    render(Button, { props: { children: () => '按钮', width: undefined } });

    expect(screen.getByTestId('button')).toHaveStyle({ width: '' });

    // 因为svelte传入的props，传入的undefined会被忽略，这个plain属性会被回退为默认值
    // https://svelte.dev/docs/svelte/%24props
  });

  it('属性width值为0,正常渲染,单位为px', () => {
    render(Button, { props: { children: () => '按钮', width: 0 } });
    expect(screen.getByTestId('button').style.width).toBe('0px');
  });

  it('属性width值为0字符串,正常渲染,单位为px', () => {
    render(Button, { props: { children: () => '按钮', width: '0' } });
    expect(screen.getByTestId('button').style.width).toBe('0px');
  });

  it('属性width值为小数,正常渲染,单位为px', () => {
    render(Button, { props: { children: () => '按钮', width: 12.5 } });
    expect(screen.getByTestId('button').style.width).toBe('12.5px');
  });

  it('属性width值为小数字符串,正常渲染,单位为px', () => {
    render(Button, { props: { children: () => '按钮', width: '12.5' } });
    expect(screen.getByTestId('button').style.width).toBe('12.5px');
  });

  it('属性width值为带小数的带单位字符串,正常渲染', () => {
    render(Button, { props: { children: () => '按钮', width: '12.5em' } });
    expect(screen.getByTestId('button')).toHaveStyle({ width: '12.5em' });
  });

  it('属性width值为负数,渲染为0,单位为px', () => {
    render(Button, { props: { children: () => '按钮', width: -100 } });
    expect(screen.getByTestId('button').style.width).toBe('0px');
  });

  it('属性width值为负数字符串,渲染为0,单位为px', () => {
    render(Button, { props: { children: () => '按钮', width: '-100' } });
    expect(screen.getByTestId('button').style.width).toBe('0px');
  });

  it('属性width值为带负数的带单位字符串,渲染为0', () => {
    render(Button, { props: { children: () => '按钮', width: '-100px' } });
    expect(screen.getByTestId('button')).toHaveStyle({ width: '0px' });
  });

  it('属性width值为布尔值true,默认为空字符串，控制台输出警告信息', () => {
    const spy = vi.spyOn(console, 'warn');
    render(Button, { props: { children: () => '按钮', width: true } });
    expect(screen.getByTestId('button')).toHaveStyle({ width: '' });
    expect(spy).toHaveBeenCalledWith("[Button] width 应为字符串或数字（例如 '100px', '2em'），当前为 boolean");
  });

  it('属性width值为布尔值false,默认为空字符串，控制台输出警告信息', () => {
    const spy = vi.spyOn(console, 'warn');
    render(Button, { props: { children: () => '按钮', width: false } });
    expect(screen.getByTestId('button')).toHaveStyle({ width: '' });
    expect(spy).toHaveBeenCalledWith("[Button] width 应为字符串或数字（例如 '100px', '2em'），当前为 boolean");
  });

  it('属性width值为对象,默认为空字符串，控制台输出警告信息', () => {
    const spy = vi.spyOn(console, 'warn');
    render(Button, { props: { children: () => '按钮', width: {} } });
    expect(screen.getByTestId('button')).toHaveStyle({ width: '' });
    expect(spy).toHaveBeenCalledWith("[Button] width 应为字符串或数字（例如 '100px', '2em'），当前为 object");
  });

  it('属性width值为数组,默认为空字符串，控制台输出警告信息', () => {
    const spy = vi.spyOn(console, 'warn');
    render(Button, { props: { children: () => '按钮', width: [] } });
    expect(screen.getByTestId('button')).toHaveStyle({ width: '' });
    expect(spy).toHaveBeenCalledWith("[Button] width 应为字符串或数字（例如 '100px', '2em'），当前为 array");
  });

  it('属性width值为函数,默认为空字符串，控制台输出警告信息', () => {
    const spy = vi.spyOn(console, 'warn');
    render(Button, { props: { children: () => '按钮', width: () => {} } });
    expect(screen.getByTestId('button')).toHaveStyle({ width: '' });
    expect(spy).toHaveBeenCalledWith("[Button] width 应为字符串或数字（例如 '100px', '2em'），当前为 function");
  });

  /**
   * 测试onclick点击事件
   */
  it('点击按钮,触发handleClick事件', () => {
    const handleClick = vi.fn();
    render(Button, { props: { children: () => '按钮', onclick: handleClick } });

    /** 检测是否触发handleClick事件 */
    fireEvent.click(screen.getByTestId('button'));
    expect(handleClick).toHaveBeenCalled();
  });

  it('点击按钮,事件冒泡,不触发父级handleClick事件', async () => {
    // 按钮事件
    const handleClickSon = vi.fn();
    // 父级事件
    const handleClickFather = vi.fn();
    document.body.addEventListener('click', handleClickFather);
    render(Button, { props: { children: () => '按钮', onclick: handleClickSon } });

    await fireEvent.click(screen.getByTestId('button'));
    expect(handleClickSon).toHaveBeenCalled();
    // 检测父级事件是否触发
    expect(handleClickFather).not.toHaveBeenCalled();
  });

  it('禁用时不可点击触发事件', () => {
    const handleClick = vi.fn();
    render(Button, { props: { children: () => '按钮', disabled: true, onclick: handleClick } });

    /** 检测是否触发handleClick事件 */
    fireEvent.click(screen.getByTestId('button'));
    expect(handleClick).not.toHaveBeenCalled(); // 没有触发
  });

  it('onclick传入null,默认为空函数，控制台输出警告信息', () => {
    const spy = vi.spyOn(console, 'warn');
    render(Button, { props: { children: () => '按钮', onclick: null } });
    expect(spy).toHaveBeenCalledWith('[Button] onclick 必须为函数，当前为 null');
  });

  it('onclick传入undefined,默认为空函数,因为svelte的props传入undefined,会被忽略，回退为默认值', () => {
    const spy = vi.spyOn(console, 'warn');
    render(Button, { props: { children: () => '按钮', onclick: undefined } });

    // 控制台无信息
    expect(spy).not.toHaveBeenCalled();
  });

  it('onclick传入字符串,默认为空函数，控制台输出警告信息', () => {
    const spy = vi.spyOn(console, 'warn');
    render(Button, { props: { children: () => '按钮', onclick: 'onclick' } });
    expect(screen.getByTestId('button')).toHaveStyle({ width: '' });
    expect(spy).toHaveBeenCalledWith('[Button] onclick 必须为函数，当前为 string');
  });

  it('onclick传入数字,默认为空函数，控制台输出警告信息', () => {
    const spy = vi.spyOn(console, 'warn');
    render(Button, { props: { children: () => '按钮', onclick: 1 } });
    expect(screen.getByTestId('button')).toHaveStyle({ width: '' });
    expect(spy).toHaveBeenCalledWith('[Button] onclick 必须为函数，当前为 number');
  });

  it('onclick传入boolean,默认为空函数，控制台输出警告信息', () => {
    const spy = vi.spyOn(console, 'warn');
    render(Button, { props: { children: () => '按钮', onclick: true } });
    expect(screen.getByTestId('button')).toHaveStyle({ width: '' });
    expect(spy).toHaveBeenCalledWith('[Button] onclick 必须为函数，当前为 boolean');
  });

  it('onclick传入对象,默认为空函数，控制台输出警告信息', () => {
    const spy = vi.spyOn(console, 'warn');
    render(Button, { props: { children: () => '按钮', onclick: {} } });
    expect(screen.getByTestId('button')).toHaveStyle({ width: '' });
    expect(spy).toHaveBeenCalledWith('[Button] onclick 必须为函数，当前为 object');
  });

  it('onclick传入数组,默认为空函数，控制台输出警告信息', () => {
    const spy = vi.spyOn(console, 'warn');
    render(Button, { props: { children: () => '按钮', onclick: [] } });
    expect(screen.getByTestId('button')).toHaveStyle({ width: '' });
    expect(spy).toHaveBeenCalledWith('[Button] onclick 必须为函数，当前为 array');
  });

  it('onclick传入0,默认为空函数，控制台输出警告信息', () => {
    const spy = vi.spyOn(console, 'warn');
    render(Button, { props: { children: () => '按钮', onclick: 0 } });
    expect(screen.getByTestId('button')).toHaveStyle({ width: '' });
    expect(spy).toHaveBeenCalledWith('[Button] onclick 必须为函数，当前为 number');
  });
});
