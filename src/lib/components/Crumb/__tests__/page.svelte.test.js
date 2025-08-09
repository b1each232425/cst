import { render, screen, act, fireEvent, waitFor } from '@testing-library/svelte';
import Breadcrumb from '../Crumb.svelte';
import { vi } from 'vitest';
import { beforeEach } from 'vitest';
import { expect } from 'vitest';
import { slide } from 'svelte/transition';
import { goto } from '$app/navigation';
import { page } from '$app/state';
import { beforeNavigate } from '$app/navigation';

// Mock $app/navigation 模块
// Mock $app/navigation 模块
vi.mock('$app/navigation', async () => {
  const actual = await vi.importActual('$app/navigation');

  return {
    ...actual, // 保留其他的原始功能
    // Mock `beforeNavigate`，手动触发事件
    beforeNavigate: vi.fn(({ from, to, cancel }) => {
      if (to) {
        // 手动更新 `page.url.pathname`，触发路径变化
        page.url.pathname = to.url.pathname;

        // 更新 current_nav_path_data
        current_nav_path_data = getNavData(to.url.pathname, nav_map);

        // 设置标题
        const currentNavItem = current_nav_path_data[current_nav_path_data.length - 1];
        document.title = `${currentNavItem.title} • 3min`;
      }
    }),
    // Mock `goto`，模拟路径变化时触发 `beforeNavigate`
    goto: vi.fn((path) => {
      // 模拟路径变化并触发 `beforeNavigate`
      page.url.pathname = path;
      const to = { url: { pathname: path } };
      beforeNavigate({ from: page, to });
    }),
  };
});

// 模拟 `current_nav_path_data` 和 `nav_map` 数据
let current_nav_path_data = [];
const nav_map = [
  { path: '/teacher/question-bank/theory', title: '理论题库管理' },
  { path: '/teacher/question-bank/theory/editBank', title: '编辑题库' },
];

function getNavData(path, nav_map) {
  let result = [];
  for (let navData of nav_map) {
    let path_reg = new RegExp(`^${navData.path}$`);
    if (path_reg.test(path)) {
      if (!navData.isFilter) {
        result.push({
          ...navData,
          actual_path: path,
        });
      }
      break;
    }

    if (navData.children) {
      const childNavData = getNavData(path, navData.children);
      result = result.concat(childNavData);
    }
  }
  return result;
}

// 在测试文件中添加 Svelte 过渡模拟
vi.mock('svelte/transition', () => ({
  slide: vi.fn().mockImplementation(() => ({
    delay: 0,
    duration: 0, // 让动画立即完成
    css: () => '', // 返回空样式
  })),
}));

// 模拟 page
vi.mock('$app/state', () => ({
  page: {
    url: {
      pathname: '/teacher/question-bank/theory/editBank',
    },
  },
}));

describe('Crumb.svelte 面包屑组件测试', () => {
  beforeEach(() => {
    // 在每个测试前，清空所有的模拟
    vi.restoreAllMocks();

    global.fetch = vi.fn();

    // 模拟成功的API响应
    fetch.mockResolvedValueOnce({
      json: () =>
        Promise.resolve({
          status: 0,
          data: { OfficialName: '张三' }, // 模拟用户名称
        }),
    });
  });

  it('应该正确渲染面包屑', async () => {
    // 模拟 Web Animations API
    global.Element.prototype.animate = vi.fn().mockImplementation(() => ({
      finished: Promise.resolve(),
      cancel: vi.fn(),
    }));

    render(Breadcrumb);

    // 验证 fetch 被调用
    expect(fetch).toHaveBeenCalledWith('/api/user/me');

    // 等待异步数据加载完成
    expect(await screen.findByText('你好，张三')).toBeInTheDocument();

    // 使用 getByAltText 获取单个头像和通知图标
    expect(screen.getByAltText('头像')).toBeInTheDocument();
    expect(screen.getByAltText('通知')).toBeInTheDocument();

    expect(screen.getByText('理论题库管理'));
  });

  it('点击面包屑回退到上一路由', async () => {
    render(Breadcrumb);

    // 验证初始面包屑内容
    expect(await screen.findByText('你好，张三')).toBeInTheDocument();
    expect(screen.getByText('理论题库管理')).toBeInTheDocument();

    // 模拟路径变化
    const newPath = '/teacher/question-bank/theory/editBank';
    goto(newPath);

    // 验证路径变化后，current_nav_path_data 是否更新
    await waitFor(() => {
      expect(page.url.pathname).toBe(newPath);
    });

    // 验证面包屑内容更新
    expect(screen.getByText('理论题库管理')).toBeInTheDocument();
    expect(screen.getByText('编辑题库')).toBeInTheDocument();

    // 模拟点击回退到上一路由
    fireEvent.click(screen.getByText('理论题库管理'));

    // 检查 goto 是否被正确调用
    expect(goto).toHaveBeenCalledWith('/teacher/question-bank/theory');
  });

  it('应该正确渲染元素', async () => {
    // 模拟 Web Animations API
    global.Element.prototype.animate = vi.fn().mockImplementation(() => ({
      finished: Promise.resolve(),
      cancel: vi.fn(),
    }));

    render(Breadcrumb);

    // 验证 fetch 被调用
    expect(fetch).toHaveBeenCalledWith('/api/user/me');

    // 等待异步数据加载完成
    expect(await screen.findByText('你好，张三')).toBeInTheDocument();

    // 使用 getByAltText 获取单个头像和通知图标
    expect(screen.getByAltText('头像')).toBeInTheDocument();
    expect(screen.getByAltText('通知')).toBeInTheDocument();

    // 点击头像按钮，显示用户菜单
    const userButton = screen.getByAltText('头像');
    await fireEvent.click(userButton);

    // 验证用户菜单项是否渲染
    expect(screen.getByText('个人中心')).toBeInTheDocument();
    expect(screen.getByText('设置')).toBeInTheDocument();
    expect(screen.getByText('退出登录')).toBeInTheDocument();
  });

  it('应该正确渲染用户数据', async () => {
    render(Breadcrumb);

    // 验证fetch被调用
    expect(fetch).toHaveBeenCalledWith('/api/user/me');

    // 等待异步数据加载完成
    expect(await screen.findByText('你好，张三')).toBeInTheDocument();
  });

  it('应该正确退出登录', async () => {
    // 模拟 Web Animations API
    global.Element.prototype.animate = vi.fn().mockImplementation(() => ({
      finished: Promise.resolve(),
      cancel: vi.fn(),
    }));

    render(Breadcrumb);

    // 验证 fetch 被调用
    expect(fetch).toHaveBeenCalledWith('/api/user/me');

    // 等待异步数据加载完成
    expect(await screen.findByText('你好，张三')).toBeInTheDocument();

    // 使用 getByAltText 获取单个头像和通知图标
    expect(screen.getByAltText('头像')).toBeInTheDocument();
    expect(screen.getByAltText('通知')).toBeInTheDocument();

    // 点击头像按钮，显示用户菜单
    const userButton = screen.getByAltText('头像');
    await fireEvent.click(userButton);

    // 验证退出登录是否渲染
    expect(screen.getByText('退出登录')).toBeInTheDocument();
    const loginOutButton = screen.getByText('退出登录');
    fireEvent.click(loginOutButton);

    expect(goto).toHaveBeenCalledWith('/login');
  });

  it('应该正确处理用户数据', async () => {
    render(Breadcrumb);

    // 验证 fetch 被调用
    expect(fetch).toHaveBeenCalledWith('/api/user/me');

    // 等待异步操作完成并验证用户名称是否正确渲染
    await waitFor(() => {
      expect(screen.getByText('你好，张三')).toBeInTheDocument();
    });
  });

  it('处理API请求失败', async () => {
    // 模拟失败的API响应
    fetch.mockRejectedValueOnce(new Error('API Error'));

    render(Breadcrumb);

    // 验证默认状态（显示空名称）
    expect(await screen.findByText('你好，')).toBeInTheDocument();
    expect(screen.queryByText('张三')).not.toBeInTheDocument();
  });

  it('应该处理当 status为负数时的错误', async () => {
    // 设置 console.error 的 spy
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    // 模拟成功响应但缺少 APIs 数据
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () =>
        Promise.resolve({
          status: -1,
          data: {},
        }),
    });

    render(Breadcrumb);

    await waitFor(() => {
      //expect(consoleErrorSpy).toHaveBeenCalledWith('获取用户权限失败:', expect.any(Error));
      expect(consoleErrorSpy.mock.calls[0][1].message).toMatch('用户数据不存在');
    });
  });

  it('处理API请求失败（网络错误）', async () => {
    // 设置 console.error 的 spy
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    // 模拟前端网络错误
    global.fetch = vi.fn().mockRejectedValueOnce(new Error('Network Error'));

    render(Breadcrumb);

    await waitFor(() => {
      //expect(consoleErrorSpy).toHaveBeenCalledWith('获取用户权限失败:', expect.any(Error));
      expect(consoleErrorSpy.mock.calls[0][1].message).toBe('Network Error');
    });
  });

  it('处理API请求失败', async () => {
    // 设置 console.error 的 spy
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    // 模拟后端500错误
    global.fetch = vi.fn().mockResolvedValueOnce({
      ok: false,
      status: 500,
      json: () => Promise.resolve({ status: 500, data: null }),
    });

    render(Breadcrumb);

    await waitFor(() => {
      //expect(consoleErrorSpy).toHaveBeenCalledWith('获取用户权限失败:', expect.any(Error));
      expect(consoleErrorSpy.mock.calls[0][1].message).toBe('用户数据不存在');
    });
  });

  it('点击外部关闭面包屑菜单栏', async () => {
    // 模拟 Web Animations API
    global.Element.prototype.animate = vi.fn().mockImplementation(() => ({
      finished: Promise.resolve(),
      cancel: vi.fn(),
    }));

    render(Breadcrumb);

    // 验证 fetch 被调用
    expect(fetch).toHaveBeenCalledWith('/api/user/me');

    // 等待异步数据加载完成
    expect(await screen.findByText('你好，张三')).toBeInTheDocument();

    // 使用 getByAltText 获取单个头像和通知图标
    expect(screen.getByAltText('头像')).toBeInTheDocument();
    expect(screen.getByAltText('通知')).toBeInTheDocument();

    // 点击头像按钮，显示用户菜单
    const userButton = screen.getByAltText('头像');
    await fireEvent.click(userButton);

    // 验证用户菜单已经显示（菜单项可见）
    expect(screen.getByText('个人中心')).toBeInTheDocument();
    expect(screen.getByText('设置')).toBeInTheDocument();
    expect(screen.getByText('退出登录')).toBeInTheDocument();

    // 模拟点击头像按钮以外的区域，触发菜单关闭逻辑
    const outsideClickArea = document.createElement('div');
    document.body.appendChild(outsideClickArea);

    // 模拟点击外部区域
    await fireEvent.click(outsideClickArea);

    // 验证用户菜单是否被关闭（菜单项不再可见）
    expect(screen.queryByText('个人中心')).not.toBeInTheDocument();
    expect(screen.queryByText('设置')).not.toBeInTheDocument();
    expect(screen.queryByText('退出登录')).not.toBeInTheDocument();

    // 清理外部点击区域
    document.body.removeChild(outsideClickArea);
  });
});
