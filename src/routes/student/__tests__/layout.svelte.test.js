import { vi, beforeEach, describe, it, expect } from 'vitest';
import { render, fireEvent, screen, waitFor } from '@testing-library/svelte';

vi.mock('$app/state', () => ({
  page: {
    url: new URL('http://localhost/student/practice'),
  },
}));
vi.mock('$app/navigation', () => ({ goto: vi.fn() }));
vi.mock('$lib/components/Toast/Toast.js', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));
vi.mock('$lib/components/MessageBox/MessageBox.js', () => ({
  default: vi.fn(({ onConfirm }) => {
    onConfirm();
    return;
  }),
}));

import Layout from '../+layout.svelte';
import { page } from '$app/state';
import { goto } from '$app/navigation';
import { toast } from '$lib/components/Toast/Toast.js';
import MessageBox from '$lib/components/MessageBox/MessageBox.js';

function setPathname(path) {
  page.url = new URL(`http://localhost${path}`);
}

describe('student Layout 组件单元测试', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    setPathname('/student/practice');
  });

  it('应渲染页面核心元素', () => {
    render(Layout, { props: { children: () => '内容区' } });
    expect(screen.getByRole('button', { name: '练习' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '考试' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '退出登录' })).toBeInTheDocument();
  });

  it('当前路径是 /student/practice 时“练习”按钮有选中样式', () => {
    setPathname('/student/practice');
    render(Layout, { props: { children: () => '内容区' } });

    const practiceBtn = screen.getByRole('button', { name: '练习' });
    expect(practiceBtn.classList.contains('selected')).toBe(true);
    const examBtn = screen.getByRole('button', { name: '考试' });
    expect(examBtn.classList.contains('selected')).toBe(false);
  });

  it('当前路径是 /student/exam 时“考试”按钮有选中样式', () => {
    setPathname('/student/exam');
    render(Layout, { props: { children: () => '内容区' } });

    const examBtn = screen.getByRole('button', { name: '考试' });
    expect(examBtn.classList.contains('selected')).toBe(true);
    const practiceBtn = screen.getByRole('button', { name: '练习' });
    expect(practiceBtn.classList.contains('selected')).toBe(false);
  });

  it('点击“练习”按钮调用 goto 到练习页', async () => {
    render(Layout, { props: { children: () => '内容区' } });

    await fireEvent.click(screen.getByRole('button', { name: '练习' }));
    expect(goto).toHaveBeenCalledWith('/student/practice');
  });

  it('点击“考试”按钮调用 goto 到考试页', async () => {
    render(Layout, { props: { children: () => '内容区' } });

    await fireEvent.click(screen.getByRole('button', { name: '考试' }));
    expect(goto).toHaveBeenCalledWith('/student/exam');
  });

  it('退出登录成功后弹窗确认、显示成功 toast 并跳转登录页', async () => {
    global.fetch = vi.fn(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ status: 0 }),
      }),
    );

    render(Layout, { props: { children: () => '内容区' } });

    await fireEvent.click(screen.getByRole('button', { name: '退出登录' }));

    await waitFor(() => {
      expect(MessageBox).toHaveBeenCalled();
      expect(toast.success).toHaveBeenCalledWith('登出成功');
      expect(goto).toHaveBeenCalledWith('/login');
    });
  });

  it('后端返回错误时显示后端 msg', async () => {
    global.fetch = vi.fn(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ status: 1, msg: '登出失败' }),
      }),
    );

    render(Layout, { props: { children: () => '内容区' } });

    await fireEvent.click(screen.getByRole('button', { name: '退出登录' }));

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith('登出失败');
    });
  });

  it('后端返回错误时没有 msg', async () => {
    global.fetch = vi.fn(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ status: 1 }),
      }),
    );

    render(Layout, { props: { children: () => '内容区' } });

    await fireEvent.click(screen.getByRole('button', { name: '退出登录' }));

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith('登出失败');
    });
  });

  it('网络错误或非 ok 情况下显示默认错误', async () => {
    global.fetch = vi.fn(() => Promise.resolve({ ok: false }));

    render(Layout, { props: { children: () => '内容区' } });

    await fireEvent.click(screen.getByRole('button', { name: '退出登录' }));

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalled();
    });
  });

  it('fetch 抛异常时也能捕获并提示', async () => {
    global.fetch = vi.fn(() => Promise.reject(new Error('网络断开')));

    render(Layout, { props: { children: () => '内容区' } });

    await fireEvent.click(screen.getByRole('button', { name: '退出登录' }));

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith('网络断开');
    });
  });
});
