import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/svelte';
import Loading from '../Loading.svelte';

describe('Loading 组件测试', () => {
  beforeEach(() => {
    // 清除所有模拟
    vi.clearAllMocks();
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
