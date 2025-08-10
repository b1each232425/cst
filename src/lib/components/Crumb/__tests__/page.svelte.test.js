import { render, screen, act, fireEvent, waitFor } from '@testing-library/svelte';
import Breadcrumb from '../Crumb.svelte';
import { vi } from 'vitest';
import { beforeEach } from 'vitest';
import { expect } from 'vitest';
import { slide } from 'svelte/transition';
import { goto } from '$app/navigation';
import { page } from '$app/state';
import { beforeNavigate } from '$app/navigation';

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
    url: new URL('http://localhost/teacher/question-bank/theory'),
  },
}));

function setPathname(path) {
  page.url = new URL(`http://localhost${path}`);
}

// 模拟 $app/navigation
let mockBeforeNavigateCallback;
vi.mock('$app/navigation', () => ({
  beforeNavigate: (callback) => {
    mockBeforeNavigateCallback = callback; // 存储回调
  },
  goto: vi.fn(),
}));

// 手动触发 beforeNavigate 的函数
function triggerBeforeNavigate(fromPath, toPath) {
  if (mockBeforeNavigateCallback) {
    mockBeforeNavigateCallback({
      from: { url: new URL(`http://localhost${fromPath}`) },
      to: { url: new URL(`http://localhost${toPath}`) },
      cancel: vi.fn(),
    });
  }
}

describe('Crumb.svelte 面包屑组件测试', () => {
  beforeEach(() => {
    // 在每个测试前，清空所有的模拟
    vi.restoreAllMocks();

    // 模拟成功的API响应
    global.fetch = vi.fn();
    fetch.mockResolvedValueOnce({
      json: () =>
        Promise.resolve({
          status: 0,
          data: { OfficialName: '张三' }, // 模拟用户名称
        }),
    });

    // 初始化page返回路径
    setPathname('/teacher/question-bank/theory');
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.clearAllMocks();
    delete global.someCustomVar;
  });

  it('应该正确渲染面包屑', async () => {
    render(Breadcrumb);

    // 验证 fetch 被调用
    expect(fetch).toHaveBeenCalledWith('/api/user/me');

    // 等待异步数据加载完成
    expect(await screen.findByText('你好，张三')).toBeInTheDocument();

    // 使用 getByAltText 获取单个头像和通知图标
    expect(screen.getByAltText('头像')).toBeInTheDocument();
    expect(screen.getByAltText('通知')).toBeInTheDocument();

    expect(screen.getByText('理论题库管理')).toBeInTheDocument();
    expect(screen.queryByText('编辑题库')).not.toBeInTheDocument();
  });

  it('正确渲染试卷管理', async () => {
    setPathname('/teacher/paper');
    render(Breadcrumb);

    // 验证 fetch 被调用
    expect(fetch).toHaveBeenCalledWith('/api/user/me');

    // 等待异步数据加载完成
    expect(await screen.findByText('你好，张三')).toBeInTheDocument();

    // 使用 getByAltText 获取单个头像和通知图标
    expect(screen.getByAltText('头像')).toBeInTheDocument();
    expect(screen.getByAltText('通知')).toBeInTheDocument();

    // 正确显示理论题库管理
    expect(screen.getByText('试卷管理'));
  });

  it('正确渲染试卷管理', async () => {
    setPathname('/teacher/paper');
    render(Breadcrumb);

    // 验证 fetch 被调用
    expect(fetch).toHaveBeenCalledWith('/api/user/me');

    // 等待异步数据加载完成
    expect(await screen.findByText('你好，张三')).toBeInTheDocument();

    // 使用 getByAltText 获取单个头像和通知图标
    expect(screen.getByAltText('头像')).toBeInTheDocument();
    expect(screen.getByAltText('通知')).toBeInTheDocument();

    // 正确显示理论题库管理
    expect(screen.getByText('试卷管理'));
  });

  it('正确渲染练习管理', async () => {
    setPathname('/teacher/practice');
    render(Breadcrumb);

    // 验证 fetch 被调用
    expect(fetch).toHaveBeenCalledWith('/api/user/me');

    // 等待异步数据加载完成
    expect(await screen.findByText('你好，张三')).toBeInTheDocument();

    // 使用 getByAltText 获取单个头像和通知图标
    expect(screen.getByAltText('头像')).toBeInTheDocument();
    expect(screen.getByAltText('通知')).toBeInTheDocument();

    // 正确显示理论题库管理
    expect(screen.getByText('练习管理'));
  });

  it('正确渲染考试管理', async () => {
    setPathname('/teacher/exam');
    render(Breadcrumb);

    // 验证 fetch 被调用
    expect(fetch).toHaveBeenCalledWith('/api/user/me');

    // 等待异步数据加载完成
    expect(await screen.findByText('你好，张三')).toBeInTheDocument();

    // 使用 getByAltText 获取单个头像和通知图标
    expect(screen.getByAltText('头像')).toBeInTheDocument();
    expect(screen.getByAltText('通知')).toBeInTheDocument();

    // 正确显示理论题库管理
    expect(screen.getByText('考试管理'));
  });

  it('正确渲染考试成绩管理', async () => {
    setPathname('/teacher/grade/exam-grade');
    render(Breadcrumb);

    // 验证 fetch 被调用
    expect(fetch).toHaveBeenCalledWith('/api/user/me');

    // 等待异步数据加载完成
    expect(await screen.findByText('你好，张三')).toBeInTheDocument();

    // 使用 getByAltText 获取单个头像和通知图标
    expect(screen.getByAltText('头像')).toBeInTheDocument();
    expect(screen.getByAltText('通知')).toBeInTheDocument();

    // 正确显示理论题库管理
    expect(screen.getByText('考试成绩管理'));
  });

  it('正确渲染考试成绩管理', async () => {
    setPathname('/teacher/grade/practice-grade');
    render(Breadcrumb);

    // 验证 fetch 被调用
    expect(fetch).toHaveBeenCalledWith('/api/user/me');

    // 等待异步数据加载完成
    expect(await screen.findByText('你好，张三')).toBeInTheDocument();

    // 使用 getByAltText 获取单个头像和通知图标
    expect(screen.getByAltText('头像')).toBeInTheDocument();
    expect(screen.getByAltText('通知')).toBeInTheDocument();

    // 正确显示理论题库管理
    expect(screen.getByText('练习成绩管理'));
  });

  it('正确渲染学生管理', async () => {
    setPathname('/teacher/student-management');
    render(Breadcrumb);

    // 验证 fetch 被调用
    expect(fetch).toHaveBeenCalledWith('/api/user/me');

    // 等待异步数据加载完成
    expect(await screen.findByText('你好，张三')).toBeInTheDocument();

    // 使用 getByAltText 获取单个头像和通知图标
    expect(screen.getByAltText('头像')).toBeInTheDocument();
    expect(screen.getByAltText('通知')).toBeInTheDocument();

    // 正确显示理论题库管理
    expect(screen.getByText('学生管理'));
  });

  it('正确渲染用户管理', async () => {
    setPathname('/teacher/user-management');
    render(Breadcrumb);

    // 验证 fetch 被调用
    expect(fetch).toHaveBeenCalledWith('/api/user/me');

    // 等待异步数据加载完成
    expect(await screen.findByText('你好，张三')).toBeInTheDocument();

    // 使用 getByAltText 获取单个头像和通知图标
    expect(screen.getByAltText('头像')).toBeInTheDocument();
    expect(screen.getByAltText('通知')).toBeInTheDocument();

    // 正确显示理论题库管理
    expect(screen.getByText('用户管理'));
  });

  it('点击面包屑回退到上一路由', async () => {
    setPathname('/teacher/question-bank/theory/editBank');

    render(Breadcrumb);

    // 验证初始面包屑内容
    expect(await screen.findByText('你好，张三')).toBeInTheDocument();
    expect(screen.getByText('理论题库管理')).toBeInTheDocument();

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
    // 模拟导航事件
    triggerBeforeNavigate('/teacher/question-bank/theory', '/login');
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
