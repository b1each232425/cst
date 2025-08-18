import { render, screen, fireEvent, getByTestId, act, waitFor } from '@testing-library/svelte';
import Sidebar from '../Sidebar.svelte';
import { expect, vi } from 'vitest';
import { goto } from '$app/navigation';
import { slide } from 'svelte/transition';
import { page } from '$app/state';
import { beforeNavigate } from '$app/navigation';

// Mock $app/navigation 模块
vi.mock('$app/navigation', async () => {
  const actual = await vi.importActual('$app/navigation');

  return {
    ...actual, // 保留其他的原始功能
    goto: vi.fn((path) => {
      // 模拟 goto 跳转时更新 page 路径
      page.url.pathname = path;
    }),
  };
});

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

describe('Sidebar 侧边栏组件测试', () => {
  beforeEach(() => {
    // 在每个测试前，清空所有的模拟
    vi.restoreAllMocks();

    // 清除localStorage中的测试数据
    localStorage.clear();

    // 重置DOM
    document.body.innerHTML = '';

    // 模拟API数据
    global.fetch = vi.fn();
    fetch.mockResolvedValueOnce({
      json: () =>
        Promise.resolve({
          status: 0,
          data: {
            APIs: [
              { APIExposePath: '/teacher/question-bank' },
              { APIExposePath: '/teacher/paper' },
              { APIExposePath: '/teacher/practice' },
              { APIExposePath: '/teacher/exam' },
              { APIExposePath: '/teacher/correct' },
              { APIExposePath: '/teacher/grade' },
              { APIExposePath: '/teacher/student-management' },
              { APIExposePath: '/teacher/user-management' },
            ],
          },
        }),
    });

    // 初始化page返回路径
    setPathname('/teacher/question-bank/theory');
  });

  it('正确获渲染超级管理员权限下的基本元素', async () => {
    // 模拟API数据
    global.fetch = vi.fn();
    fetch.mockResolvedValueOnce({
      json: () =>
        Promise.resolve({
          status: 0,
          data: {
            Domains: ['cst.school^superAdmin'],
            APIs: [
              { APIExposePath: '/teacher/question-bank' },
              { APIExposePath: '/teacher/paper' },
              { APIExposePath: '/teacher/practice' },
              { APIExposePath: '/teacher/exam' },
              { APIExposePath: '/teacher/correct' },
              { APIExposePath: '/teacher/grade' },
              { APIExposePath: '/teacher/student-management' },
              { APIExposePath: '/teacher/user-management' },
            ],
          },
        }),
    });

    // 渲染组件并传递nav_map
    render(Sidebar);

    // 验证 fetch 被调用
    expect(fetch).toHaveBeenCalledWith('/api/user/me');

    // 等待侧边栏项渲染完毕
    await screen.findByText('题库管理');

    // 验证理论题库管理是否渲染
    expect(screen.getByText('题库管理')).toBeInTheDocument();
    expect(screen.getByText('理论题库管理')).toBeInTheDocument();
    expect(screen.getByText('试卷管理')).toBeInTheDocument();
    expect(screen.getByText('练习管理')).toBeInTheDocument();
    expect(screen.getByText('考试管理')).toBeInTheDocument();
    expect(screen.getByText('试卷批改')).toBeInTheDocument();
    expect(screen.getByText('考试批改')).toBeInTheDocument();
    expect(screen.getByText('练习批改')).toBeInTheDocument();
    expect(screen.getByText('成绩管理')).toBeInTheDocument();
    expect(screen.getByText('考试成绩管理')).toBeInTheDocument();
    expect(screen.getByText('练习成绩管理')).toBeInTheDocument();
    expect(screen.getByText('学生管理')).toBeInTheDocument();
    expect(screen.getByText('用户管理')).toBeInTheDocument();
  });

  it('正确获渲染管理员权限下的基本元素', async () => {
    // 模拟API数据
    global.fetch = vi.fn();
    fetch.mockResolvedValueOnce({
      json: () =>
        Promise.resolve({
          status: 0,
          data: {
            Domains: ['cst.school^admin'],
            APIs: [
              { APIExposePath: '/teacher/question-bank' },
              { APIExposePath: '/teacher/paper' },
              { APIExposePath: '/teacher/practice' },
              { APIExposePath: '/teacher/exam' },
              { APIExposePath: '/teacher/correct' },
              { APIExposePath: '/teacher/grade' },
              { APIExposePath: '/teacher/student-management' },
              { APIExposePath: '/teacher/user-management' },
            ],
          },
        }),
    });

    // 渲染组件并传递nav_map
    render(Sidebar);

    // 验证 fetch 被调用
    expect(fetch).toHaveBeenCalledWith('/api/user/me');

    // 等待侧边栏项渲染完毕
    await screen.findByText('题库管理');

    // 验证理论题库管理是否渲染
    expect(screen.getByText('题库管理')).toBeInTheDocument();
    expect(screen.getByText('理论题库管理')).toBeInTheDocument();
    expect(screen.getByText('试卷管理')).toBeInTheDocument();
    expect(screen.getByText('练习管理')).toBeInTheDocument();
    expect(screen.getByText('考试管理')).toBeInTheDocument();
    expect(screen.getByText('试卷批改')).toBeInTheDocument();
    expect(screen.getByText('考试批改')).toBeInTheDocument();
    expect(screen.getByText('练习批改')).toBeInTheDocument();
    expect(screen.getByText('成绩管理')).toBeInTheDocument();
    expect(screen.getByText('考试成绩管理')).toBeInTheDocument();
    expect(screen.getByText('练习成绩管理')).toBeInTheDocument();
    expect(screen.getByText('学生管理')).toBeInTheDocument();
    expect(screen.getByText('用户管理')).toBeInTheDocument();
  });

  it('正确获渲染教务员权限下的基本元素', async () => {
    // 模拟API数据
    global.fetch = vi.fn();
    fetch.mockResolvedValueOnce({
      json: () =>
        Promise.resolve({
          status: 0,
          data: {
            Domains: ['cst.school.academicAffair^admin'],
            APIs: [
              { APIExposePath: '/teacher/question-bank' },
              { APIExposePath: '/teacher/paper' },
              { APIExposePath: '/teacher/practice' },
              { APIExposePath: '/teacher/exam' },
              { APIExposePath: '/teacher/correct' },
              { APIExposePath: '/teacher/grade' },
              { APIExposePath: '/teacher/student-management' },
            ],
          },
        }),
    });

    // 渲染组件并传递nav_map
    render(Sidebar);

    // 验证 fetch 被调用
    expect(fetch).toHaveBeenCalledWith('/api/user/me');

    // 等待侧边栏项渲染完毕
    await screen.findByText('题库管理');

    // 验证理论题库管理是否渲染
    expect(screen.getByText('题库管理')).toBeInTheDocument();
    expect(screen.getByText('理论题库管理')).toBeInTheDocument();
    expect(screen.getByText('试卷管理')).toBeInTheDocument();
    expect(screen.getByText('练习管理')).toBeInTheDocument();
    expect(screen.getByText('考试管理')).toBeInTheDocument();
    expect(screen.getByText('试卷批改')).toBeInTheDocument();
    expect(screen.getByText('考试批改')).toBeInTheDocument();
    expect(screen.getByText('练习批改')).toBeInTheDocument();
    expect(screen.getByText('成绩管理')).toBeInTheDocument();
    expect(screen.getByText('考试成绩管理')).toBeInTheDocument();
    expect(screen.getByText('练习成绩管理')).toBeInTheDocument();
    expect(screen.getByText('学生管理')).toBeInTheDocument();
    expect(screen.queryByText('用户管理')).not.toBeInTheDocument();
  });

  it('正确获渲染教师权限下的基本元素', async () => {
    // 模拟API数据
    global.fetch = vi.fn();
    fetch.mockResolvedValueOnce({
      json: () =>
        Promise.resolve({
          status: 0,
          data: {
            Domains: ['cst.school^teacher'],
            APIs: [
              { APIExposePath: '/teacher/question-bank' },
              { APIExposePath: '/teacher/paper' },
              { APIExposePath: '/teacher/practice' },
              { APIExposePath: '/teacher/exam' },
              { APIExposePath: '/teacher/correct' },
              { APIExposePath: '/teacher/grade' },
              { APIExposePath: '/teacher/student-management' },
            ],
          },
        }),
    });

    // 渲染组件并传递nav_map
    render(Sidebar);

    // 验证 fetch 被调用
    expect(fetch).toHaveBeenCalledWith('/api/user/me');

    // 等待侧边栏项渲染完毕
    await screen.findByText('题库管理');

    // 验证理论题库管理是否渲染
    expect(screen.getByText('题库管理')).toBeInTheDocument();
    expect(screen.getByText('理论题库管理')).toBeInTheDocument();
    expect(screen.getByText('试卷管理')).toBeInTheDocument();
    expect(screen.getByText('练习管理')).toBeInTheDocument();
    expect(screen.getByText('考试管理')).toBeInTheDocument();
    expect(screen.getByText('试卷批改')).toBeInTheDocument();
    expect(screen.getByText('考试批改')).toBeInTheDocument();
    expect(screen.getByText('练习批改')).toBeInTheDocument();
    expect(screen.getByText('成绩管理')).toBeInTheDocument();
    expect(screen.getByText('考试成绩管理')).toBeInTheDocument();
    expect(screen.getByText('练习成绩管理')).toBeInTheDocument();
    expect(screen.getByText('学生管理')).toBeInTheDocument();
    expect(screen.queryByText('用户管理')).not.toBeInTheDocument();
  });

  it('应该正确切换折叠状态', async () => {
    render(Sidebar);

    // 获取侧边栏内容
    const sidebar = screen.getByTestId('sidebar-content');

    // 初始状态应该是展开
    expect(screen.getByAltText('收起侧边栏')).toBeInTheDocument();
    expect(screen.queryByAltText('展开侧边栏')).not.toBeInTheDocument();

    // 点击收起按钮
    await fireEvent.click(screen.getByTitle('收起侧边栏'));

    // 折叠中
    expect(sidebar).toHaveClass('folding');

    // 模拟动画完成
    fireEvent.transitionEnd(sidebar);

    // 验证折叠完成
    expect(screen.queryByAltText('收起侧边栏')).not.toBeInTheDocument();
    expect(screen.getByAltText('展开侧边栏')).toBeInTheDocument();
    expect(sidebar).toHaveClass('folded');

    // 点击展开按钮
    await fireEvent.click(screen.getByTitle('展开侧边栏'));

    // 验证折叠状态是否改变
    expect(screen.getByAltText('收起侧边栏')).toBeInTheDocument();
    expect(screen.queryByAltText('展开侧边栏')).not.toBeInTheDocument();
    expect(sidebar).not.toHaveClass('folded');
  });

  it('窗口大小变化应自动折叠侧边栏', () => {
    render(Sidebar);

    // 初始状态展开
    expect(screen.getByAltText('收起侧边栏')).toBeInTheDocument();

    // 模拟窗口大小变化
    window.innerWidth = 500;
    fireEvent(window, new Event('resize'));

    // 折叠中
    expect(screen.getByTestId('sidebar-content')).toHaveClass('folding');

    // 模拟动画完成
    fireEvent.transitionEnd(screen.getByTestId('sidebar-content'));

    // 验证自动折叠
    expect(screen.queryByAltText('收起侧边栏')).not.toBeInTheDocument();
    expect(screen.getByAltText('展开侧边栏')).toBeInTheDocument();
    expect(screen.getByTestId('sidebar-content')).toHaveClass('folded');
  });

  it('应正确处理侧边栏导航项点击事件', async () => {
    render(Sidebar);
    await screen.findByText('题库管理');

    // 模拟点击导航项跳转到试卷管理
    await fireEvent.click(screen.getByRole('button', { name: '试卷管理' }));
    triggerBeforeNavigate('/teacher/question-bank/theory', '/teacher/paper');
    expect(goto).toHaveBeenCalledWith('/teacher/paper');
    expect(screen.getByText('试卷管理').closest('li')).toHaveClass('active');

    // 模拟点击导航项跳转到练习管理
    await fireEvent.click(screen.getByRole('button', { name: '练习管理' }));
    triggerBeforeNavigate('/teacher/paper', '/teacher/practice');
    expect(goto).toHaveBeenCalledWith('/teacher/practice');
    expect(screen.getByText('练习管理').closest('li')).toHaveClass('active');

    // 模拟点击导航项跳转到考试管理
    await fireEvent.click(screen.getByRole('button', { name: '考试管理' }));
    triggerBeforeNavigate('/teacher/practice', '/teacher/exam');
    expect(goto).toHaveBeenCalledWith('/teacher/exam');
    expect(screen.getByText('考试管理').closest('li')).toHaveClass('active');

    // 模拟点击导航项跳转到考试批改
    await fireEvent.click(screen.getByRole('button', { name: '考试批改' }));
    triggerBeforeNavigate('/teacher/exam', '/teacher/correct/exam-correct');
    expect(goto).toHaveBeenCalledWith('/teacher/correct/exam-correct');
    expect(screen.getByText('考试批改').closest('li')).toHaveClass('active');

    // 模拟点击导航项跳转到练习批改
    await fireEvent.click(screen.getByRole('button', { name: '练习批改' }));
    triggerBeforeNavigate('/teacher/correct/exam-correct', '/teacher/correct/practice-correct');
    expect(goto).toHaveBeenCalledWith('/teacher/correct/practice-correct');
    expect(screen.getByText('练习批改').closest('li')).toHaveClass('active');

    // 模拟点击导航项跳转到考试成绩管理
    await fireEvent.click(screen.getByRole('button', { name: '考试成绩管理' }));
    triggerBeforeNavigate('/teacher/correct/practice-correct', '/teacher/grade/exam-grade');
    expect(goto).toHaveBeenCalledWith('/teacher/grade/exam-grade');
    expect(screen.getByText('考试成绩管理').closest('li')).toHaveClass('active');

    // 模拟点击导航项跳转到练习成绩管理
    await fireEvent.click(screen.getByRole('button', { name: '练习成绩管理' }));
    triggerBeforeNavigate('/teacher/grade/exam-grade', '/teacher/grade/practice-grade');
    expect(goto).toHaveBeenCalledWith('/teacher/grade/practice-grade');
    expect(screen.getByText('练习成绩管理').closest('li')).toHaveClass('active');

    // 模拟点击导航项跳转到练习学生管理
    await fireEvent.click(screen.getByRole('button', { name: '学生管理' }));
    triggerBeforeNavigate('/teacher/grade/practice-grade', '/teacher/student-management');
    expect(goto).toHaveBeenCalledWith('/teacher/student-management');
    expect(screen.getByText('学生管理').closest('li')).toHaveClass('active');

    // 模拟点击导航项跳转到练习用户管理
    await fireEvent.click(screen.getByRole('button', { name: '用户管理' }));
    triggerBeforeNavigate('/teacher/student-management', '/teacher/user-management');
    expect(goto).toHaveBeenCalledWith('/teacher/user-management');
    expect(screen.getByText('用户管理').closest('li')).toHaveClass('active');
  });

  it('应正确处理侧边栏高亮', async () => {
    render(Sidebar);
    await screen.findByText('试卷管理');

    // 模拟点击导航项跳转到试卷管理
    await fireEvent.click(screen.getByRole('button', { name: '试卷管理' }));
    expect(goto).toHaveBeenCalledWith('/teacher/paper');
    expect(screen.getByText('题库管理').closest('li')).not.toHaveClass('active');
    expect(screen.getByText('理论题库管理').closest('li')).not.toHaveClass('active');
    expect(screen.getByText('试卷管理').closest('li')).toHaveClass('active');
    expect(screen.getByText('练习管理').closest('li')).not.toHaveClass('active');
    expect(screen.getByText('考试管理').closest('li')).not.toHaveClass('active');
    expect(screen.getByText('试卷批改').closest('li')).not.toHaveClass('active');
    expect(screen.getByText('考试批改').closest('li')).not.toHaveClass('active');
    expect(screen.getByText('练习批改').closest('li')).not.toHaveClass('active');
    expect(screen.getByText('成绩管理').closest('li')).not.toHaveClass('active');
    expect(screen.getByText('考试成绩管理').closest('li')).not.toHaveClass('active');
    expect(screen.getByText('练习成绩管理').closest('li')).not.toHaveClass('active');
    expect(screen.getByText('学生管理').closest('li')).not.toHaveClass('active');
    expect(screen.getByText('用户管理').closest('li')).not.toHaveClass('active');

    // 模拟点击导航项跳转到练习管理
    await fireEvent.click(screen.getByRole('button', { name: '练习管理' }));
    expect(goto).toHaveBeenCalledWith('/teacher/practice');
    expect(screen.getByText('题库管理').closest('li')).not.toHaveClass('active');
    expect(screen.getByText('理论题库管理').closest('li')).not.toHaveClass('active');
    expect(screen.getByText('试卷管理').closest('li')).not.toHaveClass('active');
    expect(screen.getByText('练习管理').closest('li')).toHaveClass('active');
    expect(screen.getByText('考试管理').closest('li')).not.toHaveClass('active');
    expect(screen.getByText('试卷批改').closest('li')).not.toHaveClass('active');
    expect(screen.getByText('考试批改').closest('li')).not.toHaveClass('active');
    expect(screen.getByText('练习批改').closest('li')).not.toHaveClass('active');
    expect(screen.getByText('成绩管理').closest('li')).not.toHaveClass('active');
    expect(screen.getByText('考试成绩管理').closest('li')).not.toHaveClass('active');
    expect(screen.getByText('练习成绩管理').closest('li')).not.toHaveClass('active');
    expect(screen.getByText('学生管理').closest('li')).not.toHaveClass('active');
    expect(screen.getByText('用户管理').closest('li')).not.toHaveClass('active');

    // 模拟点击导航项跳转到考试管理
    await fireEvent.click(screen.getByRole('button', { name: '考试管理' }));
    expect(goto).toHaveBeenCalledWith('/teacher/exam');
    expect(screen.getByText('题库管理').closest('li')).not.toHaveClass('active');
    expect(screen.getByText('理论题库管理').closest('li')).not.toHaveClass('active');
    expect(screen.getByText('试卷管理').closest('li')).not.toHaveClass('active');
    expect(screen.getByText('练习管理').closest('li')).not.toHaveClass('active');
    expect(screen.getByText('考试管理').closest('li')).toHaveClass('active');
    expect(screen.getByText('试卷批改').closest('li')).not.toHaveClass('active');
    expect(screen.getByText('考试批改').closest('li')).not.toHaveClass('active');
    expect(screen.getByText('练习批改').closest('li')).not.toHaveClass('active');
    expect(screen.getByText('成绩管理').closest('li')).not.toHaveClass('active');
    expect(screen.getByText('考试成绩管理').closest('li')).not.toHaveClass('active');
    expect(screen.getByText('练习成绩管理').closest('li')).not.toHaveClass('active');
    expect(screen.getByText('学生管理').closest('li')).not.toHaveClass('active');
    expect(screen.getByText('用户管理').closest('li')).not.toHaveClass('active');

    // 模拟点击导航项跳转到考试批改
    await fireEvent.click(screen.getByRole('button', { name: '考试批改' }));
    expect(goto).toHaveBeenCalledWith('/teacher/correct/exam-correct');
    expect(screen.getByText('题库管理').closest('li')).not.toHaveClass('active');
    expect(screen.getByText('理论题库管理').closest('li')).not.toHaveClass('active');
    expect(screen.getByText('试卷管理').closest('li')).not.toHaveClass('active');
    expect(screen.getByText('练习管理').closest('li')).not.toHaveClass('active');
    expect(screen.getByText('考试管理').closest('li')).not.toHaveClass('active');
    expect(screen.getByText('试卷批改').closest('li')).not.toHaveClass('active');
    expect(screen.getByText('考试批改').closest('li')).toHaveClass('active');
    expect(screen.getByText('练习批改').closest('li')).not.toHaveClass('active');
    expect(screen.getByText('成绩管理').closest('li')).not.toHaveClass('active');
    expect(screen.getByText('考试成绩管理').closest('li')).not.toHaveClass('active');
    expect(screen.getByText('练习成绩管理').closest('li')).not.toHaveClass('active');
    expect(screen.getByText('学生管理').closest('li')).not.toHaveClass('active');
    expect(screen.getByText('用户管理').closest('li')).not.toHaveClass('active');

    // 模拟点击导航项跳转到练习批改
    await fireEvent.click(screen.getByRole('button', { name: '练习批改' }));
    expect(goto).toHaveBeenCalledWith('/teacher/correct/practice-correct');
    expect(screen.getByText('题库管理').closest('li')).not.toHaveClass('active');
    expect(screen.getByText('理论题库管理').closest('li')).not.toHaveClass('active');
    expect(screen.getByText('试卷管理').closest('li')).not.toHaveClass('active');
    expect(screen.getByText('练习管理').closest('li')).not.toHaveClass('active');
    expect(screen.getByText('考试管理').closest('li')).not.toHaveClass('active');
    expect(screen.getByText('试卷批改').closest('li')).not.toHaveClass('active');
    expect(screen.getByText('考试批改').closest('li')).not.toHaveClass('active');
    expect(screen.getByText('练习批改').closest('li')).toHaveClass('active');
    expect(screen.getByText('成绩管理').closest('li')).not.toHaveClass('active');
    expect(screen.getByText('考试成绩管理').closest('li')).not.toHaveClass('active');
    expect(screen.getByText('练习成绩管理').closest('li')).not.toHaveClass('active');
    expect(screen.getByText('学生管理').closest('li')).not.toHaveClass('active');
    expect(screen.getByText('用户管理').closest('li')).not.toHaveClass('active');

    // 模拟点击导航项跳转到考试成绩管理
    await fireEvent.click(screen.getByRole('button', { name: '考试成绩管理' }));
    expect(goto).toHaveBeenCalledWith('/teacher/grade/exam-grade');
    expect(screen.getByText('题库管理').closest('li')).not.toHaveClass('active');
    expect(screen.getByText('理论题库管理').closest('li')).not.toHaveClass('active');
    expect(screen.getByText('试卷管理').closest('li')).not.toHaveClass('active');
    expect(screen.getByText('练习管理').closest('li')).not.toHaveClass('active');
    expect(screen.getByText('考试管理').closest('li')).not.toHaveClass('active');
    expect(screen.getByText('试卷批改').closest('li')).not.toHaveClass('active');
    expect(screen.getByText('考试批改').closest('li')).not.toHaveClass('active');
    expect(screen.getByText('练习批改').closest('li')).not.toHaveClass('active');
    expect(screen.getByText('成绩管理').closest('li')).not.toHaveClass('active');
    expect(screen.getByText('考试成绩管理').closest('li')).toHaveClass('active');
    expect(screen.getByText('练习成绩管理').closest('li')).not.toHaveClass('active');
    expect(screen.getByText('学生管理').closest('li')).not.toHaveClass('active');
    expect(screen.getByText('用户管理').closest('li')).not.toHaveClass('active');

    // 模拟点击导航项跳转到练习成绩管理
    await fireEvent.click(screen.getByRole('button', { name: '考试成绩管理' }));
    expect(goto).toHaveBeenCalledWith('/teacher/grade/exam-grade');
    expect(screen.getByText('题库管理').closest('li')).not.toHaveClass('active');
    expect(screen.getByText('理论题库管理').closest('li')).not.toHaveClass('active');
    expect(screen.getByText('试卷管理').closest('li')).not.toHaveClass('active');
    expect(screen.getByText('练习管理').closest('li')).not.toHaveClass('active');
    expect(screen.getByText('考试管理').closest('li')).not.toHaveClass('active');
    expect(screen.getByText('试卷批改').closest('li')).not.toHaveClass('active');
    expect(screen.getByText('考试批改').closest('li')).not.toHaveClass('active');
    expect(screen.getByText('练习批改').closest('li')).not.toHaveClass('active');
    expect(screen.getByText('成绩管理').closest('li')).not.toHaveClass('active');
    expect(screen.getByText('考试成绩管理').closest('li')).toHaveClass('active');
    expect(screen.getByText('练习成绩管理').closest('li')).not.toHaveClass('active');
    expect(screen.getByText('学生管理').closest('li')).not.toHaveClass('active');
    expect(screen.getByText('用户管理').closest('li')).not.toHaveClass('active');

    // 模拟点击导航项跳转到学生管理
    await fireEvent.click(screen.getByRole('button', { name: '学生管理' }));
    expect(goto).toHaveBeenCalledWith('/teacher/student-management');
    expect(screen.getByText('题库管理').closest('li')).not.toHaveClass('active');
    expect(screen.getByText('理论题库管理').closest('li')).not.toHaveClass('active');
    expect(screen.getByText('试卷管理').closest('li')).not.toHaveClass('active');
    expect(screen.getByText('练习管理').closest('li')).not.toHaveClass('active');
    expect(screen.getByText('考试管理').closest('li')).not.toHaveClass('active');
    expect(screen.getByText('试卷批改').closest('li')).not.toHaveClass('active');
    expect(screen.getByText('考试批改').closest('li')).not.toHaveClass('active');
    expect(screen.getByText('练习批改').closest('li')).not.toHaveClass('active');
    expect(screen.getByText('成绩管理').closest('li')).not.toHaveClass('active');
    expect(screen.getByText('考试成绩管理').closest('li')).not.toHaveClass('active');
    expect(screen.getByText('练习成绩管理').closest('li')).not.toHaveClass('active');
    expect(screen.getByText('学生管理').closest('li')).toHaveClass('active');
    expect(screen.getByText('用户管理').closest('li')).not.toHaveClass('active');

    // 模拟点击导航项跳转到用户管理
    await fireEvent.click(screen.getByRole('button', { name: '用户管理' }));
    expect(goto).toHaveBeenCalledWith('/teacher/student-management');
    expect(screen.getByText('题库管理').closest('li')).not.toHaveClass('active');
    expect(screen.getByText('理论题库管理').closest('li')).not.toHaveClass('active');
    expect(screen.getByText('试卷管理').closest('li')).not.toHaveClass('active');
    expect(screen.getByText('练习管理').closest('li')).not.toHaveClass('active');
    expect(screen.getByText('考试管理').closest('li')).not.toHaveClass('active');
    expect(screen.getByText('试卷批改').closest('li')).not.toHaveClass('active');
    expect(screen.getByText('考试批改').closest('li')).not.toHaveClass('active');
    expect(screen.getByText('练习批改').closest('li')).not.toHaveClass('active');
    expect(screen.getByText('成绩管理').closest('li')).not.toHaveClass('active');
    expect(screen.getByText('考试成绩管理').closest('li')).not.toHaveClass('active');
    expect(screen.getByText('练习成绩管理').closest('li')).not.toHaveClass('active');
    expect(screen.getByText('学生管理').closest('li')).not.toHaveClass('active');
    expect(screen.getByText('用户管理').closest('li')).toHaveClass('active');
  });

  it('应正确处理子菜单的展开和折叠', async () => {
    // 模拟 Web Animations API
    global.Element.prototype.animate = vi.fn().mockImplementation(() => ({
      finished: Promise.resolve(),
      cancel: vi.fn(),
    }));

    render(Sidebar);
    // 等待数据加载
    await screen.findByText('题库管理');

    // 第一次点击 - 折叠题库管理
    await fireEvent.click(screen.getByRole('button', { name: '题库管理' }));
    expect(screen.queryByText('理论题库管理')).not.toBeInTheDocument();

    // 第二次点击 - 展开题库管理
    await fireEvent.click(screen.getByRole('button', { name: '题库管理' }));
    expect(screen.getByText('理论题库管理')).toBeInTheDocument();

    // 第一次点击 - 折叠试卷批改
    await fireEvent.click(screen.getByRole('button', { name: '试卷批改' }));
    expect(screen.queryByText('考试批改')).not.toBeInTheDocument();
    expect(screen.queryByText('练习批改')).not.toBeInTheDocument();

    // 第二次点击 - 展开试卷批改
    await fireEvent.click(screen.getByRole('button', { name: '试卷批改' }));
    expect(screen.queryByText('考试批改')).toBeInTheDocument();
    expect(screen.queryByText('练习批改')).toBeInTheDocument();

    // 第一次点击 - 折叠成绩管理
    await fireEvent.click(screen.getByRole('button', { name: '成绩管理' }));
    expect(screen.queryByText('考试成绩管理')).not.toBeInTheDocument();
    expect(screen.queryByText('练习成绩管理')).not.toBeInTheDocument();

    // 第二次点击 - 展开成绩管理
    await fireEvent.click(screen.getByRole('button', { name: '成绩管理' }));
    expect(screen.queryByText('考试成绩管理')).toBeInTheDocument();
    expect(screen.queryByText('练习成绩管理')).toBeInTheDocument();
  });

  it('应处理侧边栏悬浮显示功能', async () => {
    // 渲染组件
    render(Sidebar);

    // 获取DOM元素
    const sidebar = screen.getByTestId('sidebar-content');
    const container = screen.getByTestId('sidebar-container');

    await screen.findByTitle('收起侧边栏');
    const toggleBtn = screen.getByTitle('收起侧边栏');

    // 初始折叠侧边栏
    await fireEvent.click(toggleBtn);
    fireEvent.transitionEnd(sidebar); // 立即触发过渡结束事件

    // 验证初始折叠状态
    expect(sidebar).toHaveClass('folded');
    expect(sidebar).not.toHaveClass('float');

    // 使用fake timers处理悬浮延迟
    vi.useFakeTimers();
    await fireEvent.mouseEnter(container);

    // 快进500ms触发悬浮逻辑
    await vi.advanceTimersByTime(500);

    // 立即触发所有挂起的动画和过渡
    fireEvent.transitionEnd(sidebar);

    // 验证悬浮状态
    expect(sidebar).toHaveClass('float');

    // 离开悬浮侧边栏
    await fireEvent.mouseLeave(container);
    await vi.advanceTimersByTime(500);
    fireEvent.transitionEnd(sidebar);
    expect(sidebar).not.toHaveClass('float');

    // 恢复真实计时器
    vi.useRealTimers();
  });

  it('应处正确理侧边栏悬浮状态下导航项点击事件', async () => {
    // 渲染组件
    render(Sidebar);

    // 获取DOM元素
    const sidebar = screen.getByTestId('sidebar-content');
    const container = screen.getByTestId('sidebar-container');
    await screen.findByTitle('收起侧边栏');
    const toggleBtn = screen.getByTitle('收起侧边栏');

    // 初始折叠侧边栏
    await fireEvent.click(toggleBtn);
    fireEvent.transitionEnd(sidebar); // 立即触发过渡结束事件

    // 验证初始折叠状态
    expect(sidebar).toHaveClass('folded');
    expect(sidebar).not.toHaveClass('float');

    // 使用fake timers处理悬浮延迟
    vi.useFakeTimers();
    await fireEvent.mouseEnter(container);

    // 快进500ms触发悬浮逻辑
    await vi.advanceTimersByTime(500);

    // 立即触发所有挂起的动画和过渡
    fireEvent.transitionEnd(sidebar);

    // 验证悬浮状态
    expect(sidebar).toHaveClass('float');

    // 模拟点击导航项跳转到试卷管理
    await fireEvent.click(screen.getByRole('button', { name: '试卷管理' }));
    triggerBeforeNavigate('/teacher/question-bank/theory', '/teacher/paper');
    expect(goto).toHaveBeenCalledWith('/teacher/paper');
    expect(screen.getByText('试卷管理').closest('li')).toHaveClass('active');

    // 模拟点击导航项跳转到练习管理
    await fireEvent.click(screen.getByRole('button', { name: '练习管理' }));
    triggerBeforeNavigate('/teacher/paper', '/teacher/practice');
    expect(goto).toHaveBeenCalledWith('/teacher/practice');
    expect(screen.getByText('练习管理').closest('li')).toHaveClass('active');

    // 模拟点击导航项跳转到考试管理
    await fireEvent.click(screen.getByRole('button', { name: '考试管理' }));
    triggerBeforeNavigate('/teacher/practice', '/teacher/exam');
    expect(goto).toHaveBeenCalledWith('/teacher/exam');
    expect(screen.getByText('考试管理').closest('li')).toHaveClass('active');

    // 模拟点击导航项跳转到考试批改
    await fireEvent.click(screen.getByRole('button', { name: '考试批改' }));
    triggerBeforeNavigate('/teacher/exam', '/teacher/correct/exam-correct');
    expect(goto).toHaveBeenCalledWith('/teacher/correct/exam-correct');
    expect(screen.getByText('考试批改').closest('li')).toHaveClass('active');

    // 模拟点击导航项跳转到练习批改
    await fireEvent.click(screen.getByRole('button', { name: '练习批改' }));
    triggerBeforeNavigate('/teacher/correct/exam-correct', '/teacher/correct/practice-correct');
    expect(goto).toHaveBeenCalledWith('/teacher/correct/practice-correct');
    expect(screen.getByText('练习批改').closest('li')).toHaveClass('active');

    // 模拟点击导航项跳转到考试成绩管理
    await fireEvent.click(screen.getByRole('button', { name: '考试成绩管理' }));
    triggerBeforeNavigate('/teacher/correct/practice-correct', '/teacher/grade/exam-grade');
    expect(goto).toHaveBeenCalledWith('/teacher/grade/exam-grade');
    expect(screen.getByText('考试成绩管理').closest('li')).toHaveClass('active');

    // 模拟点击导航项跳转到练习成绩管理
    await fireEvent.click(screen.getByRole('button', { name: '练习成绩管理' }));
    triggerBeforeNavigate('/teacher/grade/exam-grade', '/teacher/grade/practice-grade');
    expect(goto).toHaveBeenCalledWith('/teacher/grade/practice-grade');
    expect(screen.getByText('练习成绩管理').closest('li')).toHaveClass('active');

    // 模拟点击导航项跳转到练习学生管理
    await fireEvent.click(screen.getByRole('button', { name: '学生管理' }));
    triggerBeforeNavigate('/teacher/grade/practice-grade', '/teacher/student-management');
    expect(goto).toHaveBeenCalledWith('/teacher/student-management');
    expect(screen.getByText('学生管理').closest('li')).toHaveClass('active');

    // 模拟点击导航项跳转到练习用户管理
    await fireEvent.click(screen.getByRole('button', { name: '用户管理' }));
    triggerBeforeNavigate('/teacher/student-management', '/teacher/user-management');
    expect(goto).toHaveBeenCalledWith('/teacher/user-management');
    expect(screen.getByText('用户管理').closest('li')).toHaveClass('active');

    // 离开悬浮侧边栏
    await fireEvent.mouseLeave(container);
    await vi.advanceTimersByTime(500);
    fireEvent.transitionEnd(sidebar);
    expect(sidebar).not.toHaveClass('float');

    // 恢复真实计时器
    vi.useRealTimers();
  });

  it('应处理侧边栏悬浮状态下子菜单的展开和折叠', async () => {
    // 渲染组件
    render(Sidebar);

    // 获取DOM元素
    const sidebar = screen.getByTestId('sidebar-content');
    const container = screen.getByTestId('sidebar-container');
    await screen.findByTitle('收起侧边栏');
    const toggleBtn = screen.getByTitle('收起侧边栏');

    // 初始折叠侧边栏
    await fireEvent.click(toggleBtn);
    fireEvent.transitionEnd(sidebar); // 立即触发过渡结束事件

    // 验证初始折叠状态
    expect(sidebar).toHaveClass('folded');
    expect(sidebar).not.toHaveClass('float');

    // 使用fake timers处理悬浮延迟
    vi.useFakeTimers();
    await fireEvent.mouseEnter(container);

    // 快进500ms触发悬浮逻辑
    await vi.advanceTimersByTime(500);

    // 立即触发所有挂起的动画和过渡
    fireEvent.transitionEnd(sidebar);

    // 验证悬浮状态
    expect(sidebar).toHaveClass('float');

    // 第一次点击 - 折叠题库管理
    await fireEvent.click(screen.getByRole('button', { name: '题库管理' }));
    expect(screen.queryByText('理论题库管理')).not.toBeInTheDocument();

    // 第二次点击 - 展开题库管理
    await fireEvent.click(screen.getByRole('button', { name: '题库管理' }));
    expect(screen.getByText('理论题库管理')).toBeInTheDocument();

    // 第一次点击 - 折叠试卷批改
    await fireEvent.click(screen.getByRole('button', { name: '试卷批改' }));
    expect(screen.queryByText('考试批改')).not.toBeInTheDocument();
    expect(screen.queryByText('练习批改')).not.toBeInTheDocument();

    // 第二次点击 - 展开试卷批改
    await fireEvent.click(screen.getByRole('button', { name: '试卷批改' }));
    expect(screen.queryByText('考试批改')).toBeInTheDocument();
    expect(screen.queryByText('练习批改')).toBeInTheDocument();

    // 第一次点击 - 折叠成绩管理
    await fireEvent.click(screen.getByRole('button', { name: '成绩管理' }));
    expect(screen.queryByText('考试成绩管理')).not.toBeInTheDocument();
    expect(screen.queryByText('练习成绩管理')).not.toBeInTheDocument();

    // 第二次点击 - 展开成绩管理
    await fireEvent.click(screen.getByRole('button', { name: '成绩管理' }));
    expect(screen.queryByText('考试成绩管理')).toBeInTheDocument();
    expect(screen.queryByText('练习成绩管理')).toBeInTheDocument();

    // 离开悬浮侧边栏
    await fireEvent.mouseLeave(container);
    await vi.advanceTimersByTime(500);
    fireEvent.transitionEnd(sidebar);
    expect(sidebar).not.toHaveClass('float');

    // 恢复真实计时器
    vi.useRealTimers();
  });

  it('应处理侧边栏在展开条件下不悬浮', async () => {
    // 渲染组件
    render(Sidebar);

    // 获取DOM元素
    const sidebar = screen.getByTestId('sidebar-content');
    const container = screen.getByTestId('sidebar-container');
    await screen.findByTitle('收起侧边栏');
    const toggleBtn = screen.getByTitle('收起侧边栏');

    // 验证初始折叠状态
    expect(sidebar).not.toHaveClass('float');

    // 使用fake timers处理悬浮延迟
    vi.useFakeTimers();
    await fireEvent.mouseEnter(container);

    await vi.advanceTimersByTime(500);

    // 立即触发所有挂起的动画和过渡
    fireEvent.transitionEnd(sidebar);

    // 验证悬浮状态
    expect(sidebar).not.toHaveClass('float');

    // 离开悬浮侧边栏
    await fireEvent.mouseLeave(container);
    await vi.advanceTimersByTime(100);
    expect(sidebar).not.toHaveClass('float');

    await fireEvent.mouseEnter(container);
    await vi.advanceTimersByTime(100);
    await fireEvent.mouseLeave(container);

    // 恢复真实计时器
    vi.useRealTimers();
  });

  it('应处理跳转到特定页面侧边栏自动收起', async () => {
    render(Sidebar);
    await screen.findByText('题库管理');
    await screen.findByTitle('收起侧边栏');

    // 模拟从理论题库管理页面跳转到编辑题库页面
    triggerBeforeNavigate('/teacher/question-bank/theory', '/teacher/question-bank/theory/editBank');

    // 获取DOM元素
    const sidebar = screen.getByTestId('sidebar-content');

    // 初始折叠侧边栏
    fireEvent.transitionEnd(sidebar); // 立即触发过渡结束事件

    // 验证折叠状态
    expect(sidebar).toHaveClass('folded');
    expect(sidebar).not.toHaveClass('float');

    // 模拟从编辑题库页面跳转到理论题库管理页面
    triggerBeforeNavigate('/teacher/question-bank/theory/editBank', '/teacher/question-bank/theory');

    // 初始折叠侧边栏
    fireEvent.transitionEnd(sidebar); // 立即触发过渡结束事件
    // 验证折叠状态
    expect(sidebar).not.toHaveClass('folded');
    expect(sidebar).not.toHaveClass('float');
  });

  it('当侧边栏展开过程中应正确处理鼠标进入事件', async () => {
    render(Sidebar);
    vi.useFakeTimers();

    const sidebar = screen.getByTestId('sidebar-content');
    const container = screen.getByTestId('sidebar-container');

    // 折叠侧边栏
    await screen.findByTitle('收起侧边栏');
    fireEvent.click(screen.getByTitle('收起侧边栏'));
    fireEvent.transitionEnd(sidebar);

    // 确认已折叠
    expect(sidebar).toHaveClass('folded');

    // 鼠标进入侧边栏
    fireEvent.mouseEnter(container);

    // 展开侧边栏
    fireEvent.click(screen.getByTitle('展开侧边栏'));

    vi.advanceTimersByTime(600);

    // 鼠标进入侧边栏
    fireEvent.mouseEnter(container);

    expect(sidebar).not.toHaveClass('float');

    vi.useRealTimers();
  });

  it('应正确从localStorage恢复刷新后的状态', async () => {
    // 直接预设localStorage状态（模拟刷新前保存的状态）
    localStorage.setItem('sidebar_fold_state', 'true');
    localStorage.setItem('is_auto_fold', 'false');
    localStorage.setItem('sidebar_is_folded', 'true');
    localStorage.setItem('sidebar_fold_str', '展开侧边栏');

    // 渲染组件（模拟页面刷新后加载）
    render(Sidebar);

    // 等待组件完全挂载
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 0));
    });

    fireEvent.transitionEnd(await screen.findByTitle('展开侧边栏'));

    // 验证状态是否正确恢复
    const sidebar = await screen.findByTestId('sidebar-content');
    expect(sidebar).toHaveClass('folded');

    // 验证折叠按钮状态
    const toggleBtn = await screen.findByTitle('展开侧边栏');
    expect(toggleBtn).toBeInTheDocument();

    // 验证其相关状态
    expect(localStorage.getItem('sidebar_fold_state')).toBe('true');
  });

  it('应正确处理自动折叠，刷新页面侧边栏状态', async () => {
    // 直接预设localStorage状态（模拟刷新前保存的状态）
    localStorage.setItem('sidebar_fold_state', 'true');
    localStorage.setItem('is_auto_fold', 'true');
    localStorage.setItem('sidebar_is_folded', 'true');
    localStorage.setItem('sidebar_fold_str', '展开侧边栏');

    // 渲染组件（模拟页面刷新后加载）
    render(Sidebar);

    // 等待组件完全挂载
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 0));
    });

    fireEvent.transitionEnd(await screen.findByTitle('展开侧边栏'));

    // 验证状态是否正确恢复
    const sidebar = await screen.findByTestId('sidebar-content');
    expect(sidebar).toHaveClass('folded');

    // 验证折叠按钮状态
    const toggleBtn = await screen.findByTitle('展开侧边栏');
    expect(toggleBtn).toBeInTheDocument();

    // 验证其相关状态
    expect(localStorage.getItem('sidebar_fold_state')).toBe('true');
  });

  it('应处理获取用户信息失败的情况', async () => {
    // 设置 console.error 的 spy
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    // 模拟 API 失败
    global.fetch = vi.fn().mockRejectedValue(new Error('Network error'));

    // 渲染组件
    render(Sidebar);

    // 验证错误处理
    await waitFor(() => {
      expect(consoleErrorSpy).toHaveBeenCalledWith('获取用户权限失败:', expect.any(Error));
    });

    // 验证导航项为空
    expect(screen.queryByText('题库管理')).not.toBeInTheDocument();

    // 清理 spy
    consoleErrorSpy.mockRestore();
  });

  it('应处理获取用户信息失败的情况 - APIs 数据不存在', async () => {
    // 设置 console.error 的 spy
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    // 模拟成功响应但缺少 APIs 数据
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () =>
        Promise.resolve({
          data: {}, // 缺少 APIs 字段
        }),
    });

    render(Sidebar);

    await waitFor(() => {
      expect(consoleErrorSpy).toHaveBeenCalledWith('获取用户权限失败:', expect.any(Error));
      expect(consoleErrorSpy.mock.calls[0][1].message).toMatch('APIs 数据不存在');
    });

    expect(screen.queryByText('题库管理')).not.toBeInTheDocument();
  });
});
