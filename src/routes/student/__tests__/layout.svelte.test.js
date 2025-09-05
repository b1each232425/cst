import { vi, beforeEach, describe, it, expect } from 'vitest';
import { render, fireEvent, screen, waitFor } from '@testing-library/svelte';

vi.mock('$app/state', () => ({
  page: {
    url: new URL('http://localhost/student/practice'),
  },
}));
vi.mock('$app/navigation', () => ({ goto: vi.fn() }));
vi.mock('$lib/components/Toast/Toast.js', () => ({ toast: { success: vi.fn(), error: vi.fn() } }));
vi.mock('$lib/components/MessageBox/MessageBox.js', () => ({
  default: vi.fn(({ onConfirm }) => {
    onConfirm();
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

describe('学生端 Layout 组件测试', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    setPathname('/student/practice');
  });

  describe('初始渲染', () => {
    it('应渲染页面核心元素', () => {
      render(Layout, { props: { children: () => '内容区' } });

      // 验证品牌logo
      expect(screen.getByText('3min')).toBeInTheDocument();

      // 验证导航按钮
      expect(screen.getByRole('button', { name: '练习' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: '考试' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: '退出登录' })).toBeInTheDocument();

      // 验证内容区和页脚
      expect(screen.getByText(/广州近邻信息有限公司/)).toBeInTheDocument();
    });
  });

  describe('导航按钮', () => {
    it('当前路径是 /student/practice 时"练习"按钮有选中样式', () => {
      setPathname('/student/practice');
      render(Layout, { props: { children: () => '内容区' } });

      const practiceBtn = screen.getByRole('button', { name: '练习' });
      expect(practiceBtn).toHaveClass('selected');

      const examBtn = screen.getByRole('button', { name: '考试' });
      expect(examBtn).not.toHaveClass('selected');
    });

    it('当前路径是 /student/exam 时"考试"按钮有选中样式', () => {
      setPathname('/student/exam');
      render(Layout, { props: { children: () => '内容区' } });

      const examBtn = screen.getByRole('button', { name: '考试' });
      expect(examBtn).toHaveClass('selected');

      const practiceBtn = screen.getByRole('button', { name: '练习' });
      expect(practiceBtn).not.toHaveClass('selected');
    });

    it('点击"练习"按钮调用 goto 到练习页', async () => {
      render(Layout, { props: { children: () => '内容区' } });

      await fireEvent.click(screen.getByRole('button', { name: '练习' }));
      expect(goto).toHaveBeenCalledWith('/student/practice');
    });

    it('点击"考试"按钮调用 goto 到考试页', async () => {
      render(Layout, { props: { children: () => '内容区' } });

      await fireEvent.click(screen.getByRole('button', { name: '考试' }));
      expect(goto).toHaveBeenCalledWith('/student/exam');
    });
  });

  describe('退出登录功能', () => {
    it('点击退出登录按钮应显示确认对话框', async () => {
      global.fetch = vi.fn(() =>
        Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ status: 0 }),
        }),
      );

      render(Layout, { props: { children: () => '内容区' } });

      await fireEvent.click(screen.getByRole('button', { name: '退出登录' }));
      expect(MessageBox).toHaveBeenCalledWith({
        title: '确认操作',
        content: '你确定要退出登录吗？',
        onConfirm: expect.any(Function),
      });
    });

    it('确认退出登录后应调用登出API', async () => {
      global.fetch = vi.fn(() =>
        Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ status: 0 }),
        }),
      );

      render(Layout, { props: { children: () => '内容区' } });

      await fireEvent.click(screen.getByRole('button', { name: '退出登录' }));
      expect(global.fetch).toHaveBeenCalledWith('/api/logout');
    });

    it('登出成功后应显示成功提示并跳转到登录页', async () => {
      global.fetch = vi.fn(() =>
        Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ status: 0 }),
        }),
      );

      render(Layout, { props: { children: () => '内容区' } });

      await fireEvent.click(screen.getByRole('button', { name: '退出登录' }));

      await waitFor(() => {
        expect(toast.success).toHaveBeenCalledWith('登出成功');
        expect(goto).toHaveBeenCalledWith('/login');
      });
    });

    it('后端返回错误时应显示后端msg', async () => {
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

    it('后端返回错误但无msg时应显示默认错误', async () => {
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

    it('网络错误时应捕获并提示错误', async () => {
      global.fetch = vi.fn(() => Promise.reject(new Error('网络断开')));

      render(Layout, { props: { children: () => '内容区' } });

      await fireEvent.click(screen.getByRole('button', { name: '退出登录' }));

      await waitFor(() => {
        expect(toast.error).toHaveBeenCalledWith('网络断开');
      });
    });

    it('响应非2xx时应提示错误（有error_text）', async () => {
      global.fetch = vi.fn(() =>
        Promise.resolve({
          ok: false,
          status: 400,
          statusText: 'Bad Request',
          text: () => Promise.resolve('请求失败'),
        }),
      );

      render(Layout, { props: { children: () => '内容区' } });

      await fireEvent.click(screen.getByRole('button', { name: '退出登录' }));

      await waitFor(() => {
        expect(toast.error).toHaveBeenCalledWith('请求失败：400 Bad Request-请求失败');
      });
    });

    it('响应非2xx时应提示错误（无error_text）', async () => {
      global.fetch = vi.fn(() =>
        Promise.resolve({
          ok: false,
          status: 400,
          statusText: 'Bad Request',
          text: () => Promise.resolve(),
        }),
      );

      render(Layout, { props: { children: () => '内容区' } });

      await fireEvent.click(screen.getByRole('button', { name: '退出登录' }));

      await waitFor(() => {
        expect(toast.error).toHaveBeenCalledWith('请求失败：400 Bad Request');
      });
    });
  });
});
