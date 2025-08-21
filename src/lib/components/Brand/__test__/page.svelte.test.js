import { render, screen, fireEvent } from '@testing-library/svelte';
import Brand from '../Brand.svelte';
import { describe, it, expect, vi } from 'vitest';

describe('商标测试', () => {
  beforeEach(() => {
    // 在每个测试前，清空所有的模拟
    vi.restoreAllMocks();
  });

  // 校验参数 content 的类型
  it('content 参数为字符串，应该渲染正确内容', () => {
    const content = '© 2025 MyCompany';

    const { getByText } = render(Brand, {
      props: { content },
    });

    const copyrightElement = getByText(content);
    expect(copyrightElement).toBeInTheDocument();
  });

  it('content 参数为null时，应输出警告并渲染默认内容', () => {
    const spy = vi.spyOn(console, 'warn');

    // 测试传入 null
    render(Brand, { props: { content: null } });
    expect(spy).toHaveBeenCalledWith('[Brand] content 应该是一个字符串，当前为 object');
    const copyrightElementNull = screen.getByText('版权所有');
    expect(copyrightElementNull).toBeInTheDocument();
  });

  it('content 参数为undefined时，应输出警告并渲染默认内容', () => {
    const spy = vi.spyOn(console, 'warn');

    // 测试传入 undefined
    render(Brand, { props: { content: undefined } });
    expect(spy).toHaveBeenCalledWith('[Brand] content 应该是一个字符串，当前为 undefined');
    const copyrightElementUndefined = screen.getByText('版权所有');
    expect(copyrightElementUndefined).toBeInTheDocument();
  });

  it('content 参数为数字时，应输出警告并渲染默认内容', () => {
    const spy = vi.spyOn(console, 'warn');

    // 测试传入数字
    render(Brand, { props: { content: 123 } });
    expect(spy).toHaveBeenCalledWith('[Brand] content 应该是一个字符串，当前为 number');
    const copyrightElementNumber = screen.getByText('版权所有');
    expect(copyrightElementNumber).toBeInTheDocument();
  });

  it('content 参数为对象时，应输出警告并渲染默认内容', () => {
    const spy = vi.spyOn(console, 'warn');

    // 测试传入对象
    render(Brand, { props: { content: {} } });
    expect(spy).toHaveBeenCalledWith('[Brand] content 应该是一个字符串，当前为 object');
    const copyrightElementObject = screen.getByText('版权所有');
    expect(copyrightElementObject).toBeInTheDocument();
  });

  it('content 参数为数组时，应输出警告并渲染默认内容', () => {
    const spy = vi.spyOn(console, 'warn');

    // 测试传入数组
    render(Brand, { props: { content: [1, 2, 3] } });
    expect(spy).toHaveBeenCalledWith('[Brand] content 应该是一个字符串，当前为 object');
    const copyrightElementArray = screen.getByText('版权所有');
    expect(copyrightElementArray).toBeInTheDocument();
  });

  it('content 参数为空字符串时，渲染默认内容', () => {
    const spy = vi.spyOn(console, 'warn');
    render(Brand, { props: { content: '' } });

    // 测试内容为空字符串时应该渲染默认内容
    expect(screen.getByText('版权所有')).toBeInTheDocument();
    expect(spy).toHaveBeenCalledWith('[Brand] 版权信息内容不能为空');
  });
});
