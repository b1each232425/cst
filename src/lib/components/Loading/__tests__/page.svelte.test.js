import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/svelte';
import Loading from '../Loading.svelte';

describe('Loading 组件测试', () => {
  beforeEach(() => {
    // 清除所有模拟
    vi.clearAllMocks();
  });

  /**
   * 校验 is_loading 参数为布尔值
   */
  it('is_loading 参数为布尔值时，渲染 loading 内容', () => {
    const { getByText } = render(Loading, {
      props: { value: true, loading_text: '加载中...' },
    });

    expect(getByText('加载中...')).toBeInTheDocument();
  });

  it('is_loading 参数为非布尔值时，应输出警告并渲染默认内容', () => {
    const spy = vi.spyOn(console, 'warn');

    // 测试传入非布尔值（例如 string）
    render(Loading, { props: { value: 'true', loading_text: '加载中...' } });

    // 检查警告信息
    expect(spy).toHaveBeenCalledWith('[Loading] is_loading 应该是布尔值，当前为 string');

    // 检查默认渲染
    const loadingElement = screen.queryByText('加载中...');
    expect(loadingElement).not.toBeInTheDocument(); // is_loading 为非布尔值时，默认不显示
  });

  it('is_loading 参数为 null 时，应输出警告并渲染默认内容', () => {
    const spy = vi.spyOn(console, 'warn');
    render(Loading, { props: { value: null, loading_text: '加载中...' } });

    // 检查警告信息
    expect(spy).toHaveBeenCalledWith('[Loading] is_loading 应该是布尔值，当前为 object');

    // 检查默认渲染
    const loadingElement = screen.queryByText('加载中...');
    expect(loadingElement).not.toBeInTheDocument();
  });

  it('is_loading 参数为 undefined 时，应输出警告并渲染默认内容', () => {
    const spy = vi.spyOn(console, 'warn');
    render(Loading, { props: { value: undefined, loading_text: '加载中...' } });

    // 检查警告信息
    expect(spy).toHaveBeenCalledWith('[Loading] is_loading 应该是布尔值，当前为 undefined');

    // 检查默认渲染
    const loadingElement = screen.queryByText('加载中...');
    expect(loadingElement).not.toBeInTheDocument();
  });

  /**
   * 校验 loading_text 参数为字符串
   */
  it('loading_text 参数为字符串时，渲染正确内容', () => {
    const { getByText } = render(Loading, {
      props: { value: true, loading_text: '加载中...' },
    });

    expect(getByText('加载中...')).toBeInTheDocument();
  });

  it('loading_text 参数为非字符串时，应输出警告并渲染默认内容', () => {
    const spy = vi.spyOn(console, 'warn');

    // 测试传入非字符串值（例如 number）
    render(Loading, { props: { value: true, loading_text: 1234 } });

    // 检查警告信息
    expect(spy).toHaveBeenCalledWith('[Loading] loading_text 应该是字符串，当前为 number');

    // 检查默认渲染
    const loadingElement = screen.getByText('加载中...');
    expect(loadingElement).toBeInTheDocument(); // 渲染默认文本
  });

  it('loading_text 参数为 null 时，应输出警告并渲染默认内容', () => {
    const spy = vi.spyOn(console, 'warn');

    // 测试传入 null
    render(Loading, { props: { value: true, loading_text: null } });

    // 检查警告信息
    expect(spy).toHaveBeenCalledWith('[Loading] loading_text 应该是字符串，当前为 object');

    // 检查默认渲染
    const loadingElement = screen.getByText('加载中...');
    expect(loadingElement).toBeInTheDocument();
  });

  it('loading_text 参数为 undefined 时，应输出警告并渲染默认内容', () => {
    const spy = vi.spyOn(console, 'warn');

    // 测试传入 undefined
    render(Loading, { props: { value: true, loading_text: undefined } });

    // 检查警告信息
    expect(spy).toHaveBeenCalledWith('[Loading] loading_text 应该是字符串，当前为 undefined');

    // 检查默认渲染
    const loadingElement = screen.getByText('加载中...');
    expect(loadingElement).toBeInTheDocument();
  });

  it('应该在 is_loading 为 true 时显示加载动画和文本', async () => {
    // 使用 writable store 初始化 is_loading
    let is_loading = false;

    // 渲染 Loading 组件并绑定 is_loading
    render(Loading, { props: { value: is_loading, loading_text: '正在加载...' } });

    // 确保加载组件没有显示（is_loading 为 false）
    expect(screen.queryByText('正在加载...')).toBeNull();

    is_loading = true;
    render(Loading, { props: { value: is_loading, loading_text: '正在加载...' } });

    expect(screen.queryByText('正在加载...')).toBeInTheDocument();
    expect(screen.getByAltText('Loading...')).toBeInTheDocument();
  });

  it('应该在 is_loading 为 false 时隐藏加载动画和文本', async () => {
    // 渲染 Loading 组件并绑定 is_loading
    let is_loading = true;
    const { rerender } = render(Loading, { props: { value: is_loading, loading_text: '正在加载...' } });

    // 等待加载文本和图像显示
    await waitFor(() => {
      expect(screen.getByText('正在加载...')).toBeInTheDocument();
      expect(screen.getByAltText('Loading...')).toBeInTheDocument();
    });

    // 改变 is_loading 状态为 false
    is_loading = false;

    // 使用 rerender 来更新组件，重新传入新的 is_loading 状态
    await rerender({ value: is_loading, loading_text: '正在加载...' });

    // 等待加载文本和动画消失
    await waitFor(() => {
      expect(screen.queryByText('正在加载...')).toBeNull();
    });
  });

  it('应该显示自定义的 loading_text', async () => {
    const custom_text = '数据加载中，请稍候...';

    let is_loading = true;
    // 渲染 Loading 组件并绑定 is_loading
    render(Loading, { props: { value: is_loading, loading_text: custom_text } });

    // 等待加载文本的更新
    await waitFor(() => {
      expect(screen.getByText(custom_text)).toBeInTheDocument();
    });
  });
});
