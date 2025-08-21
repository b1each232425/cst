import { render, screen } from '@testing-library/svelte';
import { describe, it, expect, vi } from 'vitest';
import Empty from '../Empty.svelte';

describe('测试 Empty 组件', () => {
  /**
   * 测试默认状态
   */
  it('应该正确渲染默认状态', () => {
    render(Empty);

    // 检查默认文本是否显示
    expect(screen.getByText('暂无数据')).toBeInTheDocument();

    // 检查图标是否显示
    const IMG = screen.getByAltText('No Data');
    expect(IMG).toBeInTheDocument();
    // 检查是不是正确的图标路径
    expect(IMG).toHaveAttribute('src', '/table/table-no-data.svg');
  });

  /**
   * 测试自定义文本
   */
  it('应该能够自定义文本', () => {
    const CUSTOM_TEXT = '没有找到相关内容';
    render(Empty, { text: CUSTOM_TEXT });

    // 检查自定义文本是否显示
    expect(screen.getByText(CUSTOM_TEXT)).toBeInTheDocument();
  });

  /**
   * 测试 show_icon正常状态
   */
  it('当 show_icon 为 false 时不应显示图标', () => {
    render(Empty, { show_icon: false });

    const IMG = screen.queryByAltText('No Data');
    // 检查图标是否不存在
    expect(IMG).not.toBeInTheDocument();
  });

  /**
   * 测试 show_text 正常状态
   */
  it('当 show_text 为 false 时不应显示文本', () => {
    render(Empty, { show_text: false });

    const TEXT = screen.queryByText('暂无数据');
    expect(TEXT).not.toBeInTheDocument();
  });

  /**
   * 测试 text 非正常数据：null，undefined，0，空字符串，其他类型数据
   */
  it('当 text 不是字符串时应使用默认值并发出控制台警告，容错处理,比如传入null,undefined,0,空字符串,其他类型数据等', () => {
    const spy = vi.spyOn(console, 'warn');

    // 传入null数据
    const { unmount } = render(Empty, { text: null });
    expect(screen.getByText('暂无数据')).toBeInTheDocument();
    expect(spy).toHaveBeenCalledWith(
      "[Empty] 属性 'text' 无效: 类型错误,期望类型为string,实际类型为null, 已使用默认值 '暂无数据', 传入值为: 'null'",
    );
    unmount();

    // 传入undefined数据（Svelte 会用默认值，不会警告）
    const { unmount: unmount2 } = render(Empty, { text: undefined });
    expect(screen.getByText('暂无数据')).toBeInTheDocument();
    unmount2();

    // 传入0
    const { unmount: unmount3 } = render(Empty, { text: 0 });
    expect(screen.getByText('暂无数据')).toBeInTheDocument();
    expect(spy).toHaveBeenCalledWith(
      "[Empty] 属性 'text' 无效: 类型错误,期望类型为string,实际类型为number, 已使用默认值 '暂无数据', 传入值为: '0'",
    );
    unmount3();
  });

  /**
   * 测试 text 非正常数据：空字符串
   */
  it('当 text 传入空字符串时应使用默认值并发出控制台警告，容错处理', () => {
    const spy = vi.spyOn(console, 'warn');
    render(Empty, { text: '' });
    expect(screen.getByText('暂无数据')).toBeInTheDocument();
    expect(spy).toHaveBeenCalledWith("[Empty] 属性 'text' 无效: 不符合校验规则, 已使用默认值 '暂无数据', 传入值为: ''");
  });

  /**
   * 测试 show_icon 非正常数据：null，undefined，0，空字符串，其他类型数据
   */
  it('当 show_icon 属性传入除了 true 和 false 以外的值时，应使用默认值并发出控制台警告', () => {
    const spy = vi.spyOn(console, 'warn');

    // 传入 null
    let { unmount } = render(Empty, { show_icon: null });
    expect(spy).toHaveBeenCalledWith("[Empty] 属性 'show_icon' 无效: 类型错误,期望类型为boolean,实际类型为null, 已使用默认值 'true', 传入值为: 'null'");
    unmount();

    // 传入 undefined（Svelte 会使用默认值，不警告）
    let { unmount: unmount2 } = render(Empty, { show_icon: undefined });
    unmount2();

    // 传入 0
    let { unmount: unmount3 } = render(Empty, { show_icon: 0 });
    expect(spy).toHaveBeenCalledWith("[Empty] 属性 'show_icon' 无效: 类型错误,期望类型为boolean,实际类型为number, 已使用默认值 'true', 传入值为: '0'");
    unmount3();

    // 传入字符串
    let { unmount: unmount4 } = render(Empty, { show_icon: 'abc' });
    expect(spy).toHaveBeenCalledWith("[Empty] 属性 'show_icon' 无效: 类型错误,期望类型为boolean,实际类型为string, 已使用默认值 'true', 传入值为: 'abc'");
    unmount4();
  });

  /**
   * 测试 show_text 非正常数据：null，undefined，0，空字符串，其他类型数据
   */
  it('当 show_text 属性传入除了 true 和 false 以外的值时，应使用默认值并发出控制台警告', () => {
    const spy = vi.spyOn(console, 'warn');

    // 传入 null
    let { unmount } = render(Empty, { show_text: null });
    expect(spy).toHaveBeenCalledWith("[Empty] 属性 'show_text' 无效: 类型错误,期望类型为boolean,实际类型为null, 已使用默认值 'true', 传入值为: 'null'");
    unmount();

    // 传入 undefined（Svelte 会使用默认值，不警告）
    let { unmount: unmount2 } = render(Empty, { show_text: undefined });
    unmount2();

    // 传入 0
    let { unmount: unmount3 } = render(Empty, { show_text: 0 });
    expect(spy).toHaveBeenCalledWith("[Empty] 属性 'show_text' 无效: 类型错误,期望类型为boolean,实际类型为number, 已使用默认值 'true', 传入值为: '0'");
    unmount3();

    // 传入对象
    let { unmount: unmount4 } = render(Empty, { show_text: { a: 1 } });
    expect(spy).toHaveBeenCalledWith("[Empty] 属性 'show_text' 无效: 类型错误,期望类型为boolean,实际类型为object, 已使用默认值 'true', 传入值为: '[object Object]'");
    unmount4();
  });
});
