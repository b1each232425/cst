import { render, screen, act } from '@testing-library/svelte';
import Breadcrumb from '../Crumb.svelte';
import { vi } from 'vitest';

describe('Crumb.svelte 面包屑组件测试', () => {
  const mockProps = {
    app_name: 'Test App',
    avatar_img: '/user_icons/defaultAvatar.svg',
    icons: { notification: '/user_icons/notification.svg' },
    current_nav_path_data: [
      { name: 'theoryQuestionBank', title: '理论题库管理', path: '/teacher/question-bank/theory' },
      { name: 'editTheoryQuestionBank', title: '编辑题库', path: '/teacher/question-bank/theory/editBank' },
    ],
  };

  // 每个测试后清理mock
  afterEach(() => {
    vi.clearAllMocks();
  });

  it('应该正确渲染用户数据', async () => {
    global.fetch = vi.fn();
    // 模拟成功的API响应
    fetch.mockResolvedValueOnce({
      json: () =>
        Promise.resolve({
          status: 0,
          data: { OfficialName: '张三' }, // 模拟用户名称
        }),
    });

    render(Breadcrumb, { props: mockProps });

    // 验证fetch被调用
    expect(fetch).toHaveBeenCalledWith('/api/user/me');

    // 等待异步数据加载完成
    expect(await screen.findByText('你好，张三')).toBeInTheDocument();
  });

  it('处理API请求失败', async () => {
    global.fetch = vi.fn();
    // 模拟失败的API响应
    fetch.mockRejectedValueOnce(new Error('API Error'));

    render(Breadcrumb, { props: mockProps });

    // 验证默认状态（显示空名称）
    expect(await screen.findByText('你好，')).toBeInTheDocument();
    expect(screen.queryByText('张三')).not.toBeInTheDocument();
  });
});
