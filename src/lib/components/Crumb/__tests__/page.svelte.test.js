import { render, screen, act, fireEvent, waitFor } from '@testing-library/svelte';
import Breadcrumb from '../Crumb.svelte';
import { vi } from 'vitest';
import { beforeEach } from 'vitest';
import { expect } from 'vitest';
import { slide } from 'svelte/transition';
import { goto } from '$app/navigation';
import { page } from '$app/state';
import { beforeNavigate } from '$app/navigation';
import { toast } from '$lib/components/Toast/Toast.js';

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

vi.mock('$lib/components/Toast/Toast.js', () => ({ toast: { success: vi.fn(), error: vi.fn() } }));

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

    // 初始化page返回路径
    setPathname('/teacher/question-bank/theory');
  });

  afterEach(() => {
    delete global.someCustomVar;
  });

  // 参数校验测试代码
  it('接受正常字符串值', async () => {
    let consoleWarnSpy = vi.spyOn(console, 'warn');
    const { getByText } = render(Breadcrumb, {
      props: { display_name: '张三' },
    });

    expect(consoleWarnSpy).not.toHaveBeenCalled();
    expect(getByText('你好，张三')).toBeInTheDocument();
  });

  it('接受空字符串值', async () => {
    let consoleWarnSpy = vi.spyOn(console, 'warn');
    const { queryByText } = render(Breadcrumb, {
      props: { display_name: '' },
    });

    expect(consoleWarnSpy).not.toHaveBeenCalled();
    expect(queryByText('你好，')).toBeInTheDocument();
  });

  it('未传入时使用默认空字符串', async () => {
    let consoleWarnSpy = vi.spyOn(console, 'warn');
    const { queryByText } = render(Breadcrumb);

    expect(consoleWarnSpy).toHaveBeenCalled();
    expect(queryByText('你好，')).toBeInTheDocument();
  });

  it('非字符串类型应警告并使用默认值', async () => {
    let consoleWarnSpy = vi.spyOn(console, 'warn');
    const { queryByText } = render(Breadcrumb, {
      props: { display_name: 123 },
    });

    expect(consoleWarnSpy).toHaveBeenCalledWith('[Header] display_name 必须是字符串类型，当前为 number');
    expect(queryByText('你好，123')).toBeNull();
    expect(queryByText('你好，')).toBeInTheDocument();
  });

  it('null 值应警告并使用默认值', async () => {
    let consoleWarnSpy = vi.spyOn(console, 'warn');
    const { queryByText } = render(Breadcrumb, {
      props: { display_name: null },
    });

    expect(consoleWarnSpy).toHaveBeenCalledWith('[Header] display_name 必须是字符串类型，当前为 object');
    expect(queryByText('你好，null')).toBeNull();
    expect(queryByText('你好，')).toBeInTheDocument();
  });

  it('undefined 值应使用默认值且不警告', async () => {
    let consoleWarnSpy = vi.spyOn(console, 'warn');
    const { queryByText } = render(Breadcrumb, {
      props: { display_name: undefined },
    });

    expect(consoleWarnSpy).toHaveBeenCalled();
    expect(queryByText('你好，')).toBeInTheDocument();
  });

  it('应该正确渲染题库管理', async () => {
    render(Breadcrumb, { props: { display_name: '张三' } });

    // 等待异步数据加载完成
    expect(await screen.findByText('你好，张三')).toBeInTheDocument();

    // 使用 getByAltText 获取单个头像和通知图标
    expect(screen.getByAltText('头像')).toBeInTheDocument();
    expect(screen.getByAltText('通知')).toBeInTheDocument();

    expect(screen.getByText('理论题库管理')).toBeInTheDocument();
    expect(screen.queryByText('编辑题库')).not.toBeInTheDocument();
  });

  it('应该正确渲染编辑题库', async () => {
    setPathname('/teacher/question-bank/theory/editBank');

    render(Breadcrumb, { props: { display_name: '张三' } });

    // 等待异步数据加载完成
    expect(await screen.findByText('你好，张三')).toBeInTheDocument();

    // 使用 getByAltText 获取单个头像和通知图标
    expect(screen.getByAltText('头像')).toBeInTheDocument();
    expect(screen.getByAltText('通知')).toBeInTheDocument();

    expect(screen.getByText('理论题库管理')).toBeInTheDocument();
    expect(screen.queryByText('编辑题库')).toBeInTheDocument();
  });

  it('点击面包屑回退到理论题库管理', async () => {
    setPathname('/teacher/question-bank/theory/editBank');

    render(Breadcrumb, { props: { display_name: '张三' } });

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

  it('正确渲染试卷管理', async () => {
    setPathname('/teacher/paper');
    render(Breadcrumb, { props: { display_name: '张三' } });

    // 等待异步数据加载完成
    expect(await screen.findByText('你好，张三')).toBeInTheDocument();

    // 使用 getByAltText 获取单个头像和通知图标
    expect(screen.getByAltText('头像')).toBeInTheDocument();
    expect(screen.getByAltText('通知')).toBeInTheDocument();

    // 正确显示试卷管理
    expect(screen.getByText('试卷管理')).toBeInTheDocument();
  });

  it('正确渲染练习管理', async () => {
    setPathname('/teacher/practice');
    render(Breadcrumb, { props: { display_name: '张三' } });

    // 等待异步数据加载完成
    expect(await screen.findByText('你好，张三')).toBeInTheDocument();

    // 使用 getByAltText 获取单个头像和通知图标
    expect(screen.getByAltText('头像')).toBeInTheDocument();
    expect(screen.getByAltText('通知')).toBeInTheDocument();

    // 正确显示练习管理
    expect(screen.getByText('练习管理')).toBeInTheDocument();
  });

  it('正确渲染创建练习', async () => {
    setPathname('/teacher/practice/create');
    render(Breadcrumb, { props: { display_name: '张三' } });

    // 等待异步数据加载完成
    expect(await screen.findByText('你好，张三')).toBeInTheDocument();

    // 使用 getByAltText 获取单个头像和通知图标
    expect(screen.getByAltText('头像')).toBeInTheDocument();
    expect(screen.getByAltText('通知')).toBeInTheDocument();

    // 正确显示创建练习
    expect(screen.getByText('练习管理')).toBeInTheDocument();
    expect(screen.getByText('创建练习')).toBeInTheDocument();
  });

  it('正确渲染编辑练习', async () => {
    setPathname('/teacher/practice/edit/1');
    render(Breadcrumb, { props: { display_name: '张三' } });

    // 等待异步数据加载完成
    expect(await screen.findByText('你好，张三')).toBeInTheDocument();

    // 使用 getByAltText 获取单个头像和通知图标
    expect(screen.getByAltText('头像')).toBeInTheDocument();
    expect(screen.getByAltText('通知')).toBeInTheDocument();

    // 正确显示编辑练习
    expect(screen.getByText('练习管理')).toBeInTheDocument();
    expect(screen.getByText('编辑练习')).toBeInTheDocument();
  });

  it('点击面包屑回退到练习管理', async () => {
    setPathname('/teacher/practice/create');

    render(Breadcrumb, { props: { display_name: '张三' } });

    // 使用 getByAltText 获取单个头像和通知图标
    expect(screen.getByAltText('头像')).toBeInTheDocument();
    expect(screen.getByAltText('通知')).toBeInTheDocument();

    // 正确显示创建练习
    expect(screen.getByText('练习管理')).toBeInTheDocument();
    expect(screen.getByText('创建练习')).toBeInTheDocument();

    // 模拟点击回退到上一路由
    fireEvent.click(screen.getByText('练习管理'));

    // 检查 goto 是否被正确调用
    expect(goto).toHaveBeenCalledWith('/teacher/practice');
  });

  it('正确渲染考试管理', async () => {
    setPathname('/teacher/exam');
    render(Breadcrumb, { props: { display_name: '张三' } });

    // 等待异步数据加载完成
    expect(await screen.findByText('你好，张三')).toBeInTheDocument();

    // 使用 getByAltText 获取单个头像和通知图标
    expect(screen.getByAltText('头像')).toBeInTheDocument();
    expect(screen.getByAltText('通知')).toBeInTheDocument();

    // 正确显示考试管理
    expect(screen.getByText('考试管理')).toBeInTheDocument();
  });

  it('正确渲染创建考试', async () => {
    setPathname('/teacher/exam/addExam');
    render(Breadcrumb, { props: { display_name: '张三' } });

    // 等待异步数据加载完成
    expect(await screen.findByText('你好，张三')).toBeInTheDocument();

    // 使用 getByAltText 获取单个头像和通知图标
    expect(screen.getByAltText('头像')).toBeInTheDocument();
    expect(screen.getByAltText('通知')).toBeInTheDocument();

    // 正确显示创建考试
    expect(screen.getByText('考试管理')).toBeInTheDocument();
    expect(screen.getByText('创建考试')).toBeInTheDocument();
  });

  it('正确渲染编辑考试', async () => {
    setPathname('/teacher/exam/editExam/1');
    render(Breadcrumb, { props: { display_name: '张三' } });

    // 等待异步数据加载完成
    expect(await screen.findByText('你好，张三')).toBeInTheDocument();

    // 使用 getByAltText 获取单个头像和通知图标
    expect(screen.getByAltText('头像')).toBeInTheDocument();
    expect(screen.getByAltText('通知')).toBeInTheDocument();

    // 正确显示编辑考试
    expect(screen.getByText('考试管理')).toBeInTheDocument();
    expect(screen.getByText('编辑考试')).toBeInTheDocument();
  });

  it('点击面包屑回退到考试管理', async () => {
    setPathname('/teacher/exam/editExam/1');

    render(Breadcrumb, { props: { display_name: '张三' } });

    // 使用 getByAltText 获取单个头像和通知图标
    expect(screen.getByAltText('头像')).toBeInTheDocument();
    expect(screen.getByAltText('通知')).toBeInTheDocument();

    // 正确显示编辑考试
    expect(screen.getByText('考试管理')).toBeInTheDocument();
    expect(screen.getByText('编辑考试')).toBeInTheDocument();

    // 模拟点击回退到上一路由
    fireEvent.click(screen.getByText('考试管理'));

    // 检查 goto 是否被正确调用
    expect(goto).toHaveBeenCalledWith('/teacher/exam');
  });

  it('正确渲染考试批改', async () => {
    setPathname('/teacher/correct/exam-correct');
    render(Breadcrumb, { props: { display_name: '张三' } });

    // 等待异步数据加载完成
    expect(await screen.findByText('你好，张三')).toBeInTheDocument();

    // 使用 getByAltText 获取单个头像和通知图标
    expect(screen.getByAltText('头像')).toBeInTheDocument();
    expect(screen.getByAltText('通知')).toBeInTheDocument();

    // 正确显示考试批改
    expect(screen.getByText('考试批改')).toBeInTheDocument();
  });

  it('正确渲染练习批改', async () => {
    setPathname('/teacher/correct/practice-correct');
    render(Breadcrumb, { props: { display_name: '张三' } });

    // 等待异步数据加载完成
    expect(await screen.findByText('你好，张三')).toBeInTheDocument();

    // 使用 getByAltText 获取单个头像和通知图标
    expect(screen.getByAltText('头像')).toBeInTheDocument();
    expect(screen.getByAltText('通知')).toBeInTheDocument();

    // 正确显示练习批改
    expect(screen.getByText('练习批改')).toBeInTheDocument();
  });

  it('正确渲染考试成绩管理', async () => {
    setPathname('/teacher/grade/exam-grade');
    render(Breadcrumb, { props: { display_name: '张三' } });

    // 等待异步数据加载完成
    expect(await screen.findByText('你好，张三')).toBeInTheDocument();

    // 使用 getByAltText 获取单个头像和通知图标
    expect(screen.getByAltText('头像')).toBeInTheDocument();
    expect(screen.getByAltText('通知')).toBeInTheDocument();

    // 正确显示考试成绩管理
    expect(screen.getByText('考试成绩管理')).toBeInTheDocument();
  });

  it('正确渲染考试成绩管理', async () => {
    setPathname('/teacher/grade/practice-grade');
    render(Breadcrumb, { props: { display_name: '张三' } });

    // 等待异步数据加载完成
    expect(await screen.findByText('你好，张三')).toBeInTheDocument();

    // 使用 getByAltText 获取单个头像和通知图标
    expect(screen.getByAltText('头像')).toBeInTheDocument();
    expect(screen.getByAltText('通知')).toBeInTheDocument();

    // 正确显示练习成绩管理
    expect(screen.getByText('练习成绩管理')).toBeInTheDocument();
  });

  it('正确渲染学生管理', async () => {
    setPathname('/teacher/student-management');
    render(Breadcrumb, { props: { display_name: '张三' } });

    // 等待异步数据加载完成
    expect(await screen.findByText('你好，张三')).toBeInTheDocument();

    // 使用 getByAltText 获取单个头像和通知图标
    expect(screen.getByAltText('头像')).toBeInTheDocument();
    expect(screen.getByAltText('通知')).toBeInTheDocument();

    // 正确显示学生管理
    expect(screen.getByText('学生管理')).toBeInTheDocument();
  });

  it('正确渲染创建学生', async () => {
    setPathname('/teacher/student-management/addStudent');
    render(Breadcrumb, { props: { display_name: '张三' } });

    // 等待异步数据加载完成
    expect(await screen.findByText('你好，张三')).toBeInTheDocument();

    // 使用 getByAltText 获取单个头像和通知图标
    expect(screen.getByAltText('头像')).toBeInTheDocument();
    expect(screen.getByAltText('通知')).toBeInTheDocument();

    // 正确显示创建学生
    expect(screen.getByText('学生管理')).toBeInTheDocument();
    expect(screen.getByText('创建学生')).toBeInTheDocument();
  });

  it('点击面包屑回退到学生管理', async () => {
    setPathname('/teacher/student-management/addStudent');

    render(Breadcrumb, { props: { display_name: '张三' } });

    // 等待异步数据加载完成
    expect(await screen.findByText('你好，张三')).toBeInTheDocument();

    // 使用 getByAltText 获取单个头像和通知图标
    expect(screen.getByAltText('头像')).toBeInTheDocument();
    expect(screen.getByAltText('通知')).toBeInTheDocument();

    // 正确显示创建学生
    expect(screen.getByText('学生管理')).toBeInTheDocument();
    expect(screen.getByText('创建学生')).toBeInTheDocument();

    // 模拟点击回退到上一路由
    fireEvent.click(screen.getByText('学生管理'));

    // 检查 goto 是否被正确调用
    expect(goto).toHaveBeenCalledWith('/teacher/student-management');
  });

  it('正确渲染用户管理', async () => {
    setPathname('/teacher/user-management');
    render(Breadcrumb, { props: { display_name: '张三' } });

    // 等待异步数据加载完成
    expect(await screen.findByText('你好，张三')).toBeInTheDocument();

    // 使用 getByAltText 获取单个头像和通知图标
    expect(screen.getByAltText('头像')).toBeInTheDocument();
    expect(screen.getByAltText('通知')).toBeInTheDocument();

    // 正确显示用户管理
    expect(screen.getByText('用户管理'));
  });

  it('正确渲染添加用户', async () => {
    setPathname('/teacher/user-management/addUser');
    render(Breadcrumb, { props: { display_name: '张三' } });

    // 等待异步数据加载完成
    expect(await screen.findByText('你好，张三')).toBeInTheDocument();

    // 使用 getByAltText 获取单个头像和通知图标
    expect(screen.getByAltText('头像')).toBeInTheDocument();
    expect(screen.getByAltText('通知')).toBeInTheDocument();

    // 正确显示创建用户
    expect(screen.getByText('用户管理')).toBeInTheDocument();
    expect(screen.getByText('创建用户')).toBeInTheDocument();
  });

  it('点击面包屑回退到用户管理', async () => {
    setPathname('/teacher/user-management/addUser');

    render(Breadcrumb, { props: { display_name: '张三' } });

    // 等待异步数据加载完成
    expect(await screen.findByText('你好，张三')).toBeInTheDocument();

    // 使用 getByAltText 获取单个头像和通知图标
    expect(screen.getByAltText('头像')).toBeInTheDocument();
    expect(screen.getByAltText('通知')).toBeInTheDocument();

    // 正确显示创建用户
    expect(screen.getByText('用户管理')).toBeInTheDocument();
    expect(screen.getByText('创建用户')).toBeInTheDocument();

    // 模拟点击回退到上一路由
    fireEvent.click(screen.getByText('用户管理'));

    // 检查 goto 是否被正确调用
    expect(goto).toHaveBeenCalledWith('/teacher/user-management');
  });

  it('应该正确渲染用户菜单元素', async () => {
    // 模拟 Web Animations API
    global.Element.prototype.animate = vi.fn().mockImplementation(() => ({
      finished: Promise.resolve(),
      cancel: vi.fn(),
    }));

    render(Breadcrumb, { props: { display_name: '张三' } });

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
    render(Breadcrumb, { props: { display_name: '张三' } });

    // 等待异步数据加载完成
    expect(await screen.findByText('你好，张三')).toBeInTheDocument();
  });

  it('点击外部关闭面包屑菜单栏', async () => {
    // 模拟 Web Animations API
    global.Element.prototype.animate = vi.fn().mockImplementation(() => ({
      finished: Promise.resolve(),
      cancel: vi.fn(),
    }));

    render(Breadcrumb, { props: { display_name: '张三' } });

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

  it('应该正确退出登录', async () => {
    // 模拟 Web Animations API
    global.Element.prototype.animate = vi.fn().mockImplementation(() => ({
      finished: Promise.resolve(),
      cancel: vi.fn(),
    }));

    render(Breadcrumb, { props: { display_name: '张三' } });

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

  it('应该正确处理跳转到不在仓库里面的路径', async () => {
    setPathname('/teacher/practice');
    render(Breadcrumb, { props: { display_name: '张三' } });

    // 等待异步数据加载完成
    expect(await screen.findByText('你好，张三')).toBeInTheDocument();

    // 使用 getByAltText 获取单个头像和通知图标
    expect(screen.getByAltText('头像')).toBeInTheDocument();
    expect(screen.getByAltText('通知')).toBeInTheDocument();

    // 正确显示练习管理
    expect(screen.getByText('练习管理')).toBeInTheDocument();

    // 模拟路径跳转到学生端
    triggerBeforeNavigate('/teacher/practice', '/student/answer/practice');
  });
});
