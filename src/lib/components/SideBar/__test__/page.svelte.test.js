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
    // beforeNavigate: vi.fn((event) => {
    //   // 监听跳转前的路径变化
    //   const { from, to } = event;
    //   if (to && to.url.pathname) {
    //     page.url.pathname = to.url.pathname;
    //   }
    // }),
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

describe('Sidebar 侧边栏组件测试', () => {
  let options = {};

  let nav_map = [
    // {
    //   name: 'courseManagement',
    //   title: '课程管理',
    //   path: '/teacher/courseManagement',
    //   icon: '/sidebar/nav_icon/course.svg',
    // },
    {
      name: 'questionBankManagement',
      title: '题库管理',
      path: '/teacher/question-bank',
      icon: '/sidebar/nav_icon/question_bank.svg',
      children_is_parallel: true,
      fold: false,
      isFilter: true,
      children: [
        // {
        //   name: 'programmingQuestionBank',
        //   title: '编程题库管理',
        //   path: '/teacher/questionBank/programming',
        // },
        {
          name: 'theoryQuestionBank',
          title: '理论题库管理',
          path: '/teacher/question-bank/theory',
          children: [
            {
              name: 'editTheoryQuestionBank',
              title: '编辑题库',
              path: '/teacher/question-bank/theory/editBank',
            },
            {
              name: 'addTheoryQuestionBank',
              title: '新增题库',
              path: '/teacher/question-bank/theory/newBank',
            },
          ],
        },
      ],
    },
    {
      name: 'paperManagement',
      title: '试卷管理',
      path: '/teacher/paper',
      icon: '/sidebar/nav_icon/paper.svg',
    },
    {
      name: 'practiceManagement',
      title: '练习管理',
      path: '/teacher/practice',
      icon: '/sidebar/nav_icon/practice.svg',
      children: [
        {
          name: 'create',
          title: '创建练习',
          path: '/teacher/practice/create',
          force_hide: true,
        },
        {
          name: 'edit',
          title: '编辑练习',
          path: '/teacher/practice/edit/\\d+$',
          force_hide: true,
        },
      ],
    },
    {
      name: 'examManagement',
      title: '考试管理',
      path: '/teacher/exam',
      icon: '/sidebar/nav_icon/examination.svg',
      children: [
        {
          name: 'createExam',
          title: '创建考试',
          path: '/teacher/exam/addExam',
          force_hide: true,
        },
        {
          name: 'editExam',
          title: '编辑考试',
          path: '/teacher/exam/editExam/\\d+$',
          force_hide: true,
        },
        // {
        //   name: 'invigilation',
        //   title: '监考管理',
        //   path: '/teacher/exam/invigilation/\\d+$',
        //   force_hide: true,
        // },
      ],
    },
    // {
    //   name: 'correctManagement',
    //   title: '试卷批改',
    //   path: '/teacher/correct',
    //   icon: '/sidebar/nav_icon/correct.svg',
    //   children_is_parallel: true,
    //   children: [
    //     {
    //       name: 'markManagement',
    //       title: '考试批改',
    //       path: '/teacher/correct/markManagement',
    //     },
    //     {
    //       name: 'markingResult',
    //       title: '练习批改',
    //       path: '/teacher/correct/practiceMarkManagement',
    //     },
    //   ],
    // },
    {
      name: 'gradeManagement',
      title: '成绩管理',
      path: '/teacher/grade',
      icon: '/sidebar/nav_icon/grade.svg',
      children_is_parallel: true,
      fold: false,
      isFilter: true,
      children: [
        {
          name: 'examGradeManagement',
          title: '考试成绩管理',
          path: '/teacher/grade/exam-grade',
          children: [
            {
              name: 'examGradeDetail',
              title: '考试成绩详情',
              path: '/teacher/grade/exam-grade/detail',
            },
          ],
        },
        {
          name: 'practiceGradeManagement',
          title: '练习成绩管理',
          path: '/teacher/grade/practice-grade',
          children: [
            {
              name: 'practiceGradeDetail',
              title: '练习成绩详情',
              path: '/teacher/grade/practice-grade/detail',
            },
          ],
        },
        // {
        //   name: 'courseGradeManagement',
        //   title: '课程成绩管理',
        //   path: '/teacher/gradeManagement/course',
        // },
      ],
    },
    // {
    //   name: 'questionnaireManagement',
    //   title: '问卷管理',
    //   path: '/teacher/questionnaireManagement',
    //   icon: '/sidebar/nav_icon/questionnaire.svg',
    // },
    // {
    //   name: 'announcementManagement',
    //   title: '公告管理',
    //   path: '/teacher/announcementManagement',
    //   icon: '/sidebar/nav_icon/announcement.svg',
    // },
    // {
    //   name: 'examSiteManagement',
    //   title: '考点管理',
    //   path: '/teacher/examSiteManagement',
    //   icon: '/sidebar/nav_icon/exam_site.svg',
    //   children: [
    //     {
    //       name: 'editExamSite',
    //       title: '编辑考点',
    //       path: '/teacher/examSiteManagement/edit/\\d+$',
    //       force_hide: true,
    //     },
    //     {
    //       name: 'examSiteDetails',
    //       title: '考点详情',
    //       path: '/teacher/examSiteManagement/details/\\d+$',
    //       force_hide: true,
    //       children: [
    //         {
    //           name: 'examRoomExamList',
    //           title: '考场考试列表',
    //           path: '/teacher/examSiteManagement/room/\\d+$',
    //           force_hide: true,
    //         },
    //       ],
    //     },
    //   ],
    // },
    // {
    //   name: 'invigilationList',
    //   title: '监考列表',
    //   path: '/teacher/invigilationList',
    //   icon: '/sidebar/nav_icon/invigilate.svg',
    //   children: [
    //     {
    //       name: 'invigilation',
    //       title: '监考详情',
    //       path: '/teacher/invigilationList/invigilation',
    //       force_hide: true,
    //     },
    //   ],
    // },
    {
      name: 'studentManagement',
      title: '学生管理',
      path: '/teacher/student-management',
      icon: '/sidebar/nav_icon/student.svg',
      children: [
        {
          name: 'addStudent',
          title: '创建学生',
          path: '/teacher/student-management/addStudent',
          force_hide: true,
        },
        // {
        //   name: 'editStudent',
        //   title: '编辑学生',
        //   path: '/teacher/studentManagement/edit/\\d+$',
        //   force_hide: true,
        // },
        // {
        //   name: 'detailsStudent',
        //   title: '学生详情',
        //   path: '/teacher/studentManagement/details/\\d+$',
        //   force_hide: true,
        // },
      ],
    },
    {
      name: 'userManagement',
      title: '用户管理',
      path: '/teacher/user-management',
      icon: '/sidebar/nav_icon/user.svg',
      children_is_parallel: false,
      children: [
        {
          name: 'addUser',
          title: '添加用户',
          path: '/teacher/user-management/addUser',
          force_hide: true,
        },
        // {
        //   name: 'userDetail',
        //   title: '用户详情',
        //   path: '/teacher/userManagement/userDetail',
        //   force_hide: true,
        // },
        // {
        //   name: 'editUser',
        //   title: '修改用户信息',
        //   path: '/teacher/userManagement/editUser',
        //   force_hide: true,
        // },
      ],
    },
  ];

  beforeEach(() => {
    // 在每个测试前，清空所有的模拟
    vi.restoreAllMocks();

    global.fetch = vi.fn();

    // 模拟API数据
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
              { APIExposePath: '/teacher/grade' },
              { APIExposePath: '/teacher/student-management' },
              { APIExposePath: '/teacher/user-management' },
            ],
          },
        }),
    });

    vi.mock('$app/state', () => ({
      page: {
        url: {
          pathname: '/teacher/question-bank/theory',
        },
      },
    }));
  });

  it('应该正确初始化侧边栏状态', () => {
    render(Sidebar, { props: { options } });

    // 验证logo
    expect(screen.getByText('3min')).toBeInTheDocument();

    // 验证初始折叠状态
    expect(screen.getByAltText('收起侧边栏')).toBeInTheDocument();
    expect(screen.getByTestId('sidebar-content')).not.toHaveClass('folded');
    expect(screen.getByTestId('sidebar-content')).not.toHaveClass('folding');
    expect(screen.getByTestId('sidebar-content')).not.toHaveClass('float');

    // 验证侧边栏宽度设置
    const sidebar = screen.getByTestId('sidebar-content');
    expect(sidebar.style.getPropertyValue('--sidebar-width')).toBe('235px');
    expect(sidebar.style.getPropertyValue('--sidebar-max-width')).toBe('250px');
    expect(sidebar.style.getPropertyValue('--sidebar-min-width')).toBe('220px');

    // 验证侧边栏内容渲染
    expect(sidebar).toBeInTheDocument();
  });

  it('应该切换折叠状态', async () => {
    render(Sidebar, { props: { options } });

    // 获取折叠按钮
    const toggleBtn = screen.getByTitle('收起侧边栏');

    // 初始状态应该是收起
    expect(screen.getByAltText('收起侧边栏')).toBeInTheDocument();

    // 点击收起按钮
    await fireEvent.click(toggleBtn);

    // 验证折叠状态是否改变
    expect(screen.getByAltText('展开侧边栏')).toBeInTheDocument();

    // 点击展开按钮
    await fireEvent.click(toggleBtn);

    // 验证折叠状态是否改变
    expect(screen.getByAltText('收起侧边栏')).toBeInTheDocument();
  });

  it('窗口大小变化应自动折叠侧边栏', () => {
    render(Sidebar, { props: { options } });

    // 初始状态展开
    expect(screen.getByAltText('收起侧边栏')).toBeInTheDocument();

    // 模拟窗口大小变化
    window.innerWidth = 500;
    fireEvent(window, new Event('resize'));

    // 验证自动折叠
    expect(screen.getByAltText('展开侧边栏')).toBeInTheDocument();
  });

  it('应处理侧边栏动画结束事件', async () => {
    render(Sidebar, { props: { options } });

    // 触发折叠
    await fireEvent.click(screen.getByTitle('收起侧边栏'));

    // 模拟动画结束
    const sidebar = screen.getByTestId('sidebar-content');
    fireEvent.transitionEnd(sidebar);

    // 验证折叠状态更新
    expect(sidebar).toHaveClass('folded');
    expect(sidebar).not.toHaveClass('folding');
  });

  it('应处理导航项点击事件', async () => {
    render(Sidebar, { props: { options } });
    await screen.findByText('试卷管理');

    // 模拟点击导航项
    const navItem = screen.getByRole('button', { name: '试卷管理' });
    await fireEvent.click(navItem);

    // 验证路由跳转
    expect(goto).toHaveBeenCalledWith('/teacher/paper');
  });

  it('正确获取用户数据', async () => {
    // 渲染组件并传递nav_map
    render(Sidebar, { props: { options } });

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
    expect(screen.getByText('成绩管理')).toBeInTheDocument();
    expect(screen.getByText('考试成绩管理')).toBeInTheDocument();
    expect(screen.getByText('练习成绩管理')).toBeInTheDocument();
    expect(screen.getByText('学生管理')).toBeInTheDocument();
    expect(screen.getByText('用户管理')).toBeInTheDocument();
  });

  it('应处理获取用户信息失败的情况', async () => {
    // 设置 console.error 的 spy
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    // 模拟 API 失败
    global.fetch = vi.fn().mockRejectedValue(new Error('Network error'));

    // 渲染组件
    render(Sidebar, { props: { options } });

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

    render(Sidebar, { props: { options } });

    await waitFor(() => {
      expect(consoleErrorSpy).toHaveBeenCalledWith('获取用户权限失败:', expect.any(Error));
      expect(consoleErrorSpy.mock.calls[0][1].message).toMatch('APIs 数据不存在');
    });

    expect(screen.queryByText('题库管理')).not.toBeInTheDocument();
  });

  it('应处理子菜单的展开和折叠', async () => {
    // 模拟 Web Animations API
    global.Element.prototype.animate = vi.fn().mockImplementation(() => ({
      finished: Promise.resolve(),
      cancel: vi.fn(),
    }));

    render(Sidebar, { props: { options } });
    // 等待数据加载
    await screen.findByText('题库管理');

    // 初始状态验证
    expect(screen.getByText('理论题库管理')).toBeInTheDocument();

    // 第一次点击 - 折叠
    const questionBankButton = screen.getByRole('button', { name: '题库管理' });

    await fireEvent.click(questionBankButton);
    expect(screen.queryByText('理论题库管理')).not.toBeInTheDocument();

    // 第二次点击 - 展开
    await fireEvent.click(questionBankButton);
    expect(screen.getByText('理论题库管理')).toBeInTheDocument();
  });

  it('应处理侧边栏悬浮显示功能', async () => {
    // 渲染组件
    render(Sidebar, { props: { options } });

    // 获取DOM元素
    const sidebar = screen.getByTestId('sidebar-content');
    const container = screen.getByTestId('sidebar-container');
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

  it('应处理侧边栏在展开条件下不悬浮', async () => {
    // 渲染组件
    render(Sidebar, { props: { options } });

    // 获取DOM元素
    const sidebar = screen.getByTestId('sidebar-content');
    const container = screen.getByTestId('sidebar-container');
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

  it('当侧边栏已折叠，鼠标进入后突然开始折叠，500ms后不应悬浮', async () => {
    render(Sidebar, { props: { options } });
    vi.useFakeTimers();

    const sidebar = screen.getByTestId('sidebar-content');
    const container = screen.getByTestId('sidebar-container');

    // 1. 初始状态：已折叠（sidebar_is_folded = true）
    const toggleBtn = screen.getByTitle('收起侧边栏');
    await fireEvent.click(toggleBtn); // 折叠侧边栏
    fireEvent.transitionEnd(sidebar); // 触发动画结束，确保完全折叠
    expect(sidebar).toHaveClass('folded'); // 确认已折叠

    // 2. 模拟鼠标进入（此时已折叠，第一个 if 不会触发）
    fireEvent.mouseEnter(container);

    // 3. 在 500ms 期间，手动触发折叠（模拟突然开始折叠）
    // 这里需要直接修改 Svelte 的 $state，或者再次点击折叠按钮（如果它会触发折叠）
    // 假设我们手动修改状态：
    await fireEvent.click(toggleBtn); // 展开侧边栏
    fireEvent.mouseEnter(container);
    await fireEvent.click(toggleBtn);
    fireEvent.mouseLeave(container);
    await fireEvent.click(toggleBtn);
    fireEvent.mouseEnter(container);
    await fireEvent.click(toggleBtn);
    fireEvent.mouseLeave(container);

    // 5. 验证：由于 `sidebar_is_folding = true`，第二个 if 触发，不应悬浮
    expect(sidebar).not.toHaveClass('float');

    vi.useRealTimers();
  });

  it('应处理侧边栏高亮', async () => {
    render(Sidebar, { props: { options } });
    await screen.findByText('试卷管理');

    // 模拟点击导航项
    const navItem = screen.getByRole('button', { name: '试卷管理' });
    await fireEvent.click(navItem);

    // 验证路由跳转
    expect(goto).toHaveBeenCalledWith('/teacher/paper');

    const item = screen.getByText('试卷管理').closest('li');
    expect(item).toHaveClass('active');

    await fireEvent.click(screen.getByRole('button', { name: '练习管理' }));
    await fireEvent.click(screen.getByRole('button', { name: '考试管理' }));
    await fireEvent.click(screen.getByRole('button', { name: '练习成绩管理' }));
    await fireEvent.click(screen.getByRole('button', { name: '考试成绩管理' }));
    await fireEvent.click(screen.getByRole('button', { name: '成绩管理' }));
    await fireEvent.click(screen.getByRole('button', { name: '成绩管理' }));
    await fireEvent.click(screen.getByRole('button', { name: '学生管理' }));
    await fireEvent.click(screen.getByRole('button', { name: '用户管理' }));
    await fireEvent.click(screen.getByRole('button', { name: '理论题库管理' }));
    await fireEvent.click(screen.getByRole('button', { name: '题库管理' }));
    await fireEvent.click(screen.getByRole('button', { name: '题库管理' }));
  });

  it('顶级菜单应有 25px 缩进和 100% 宽度', async () => {
    render(Sidebar, { props: { options } });

    await screen.findByText('题库管理');

    const topLevelItem = screen.getByText('题库管理').closest('.sidebar-item-content');

    expect(topLevelItem).toHaveStyle({
      left: '25px;',
      width: '100%;',
    });
  });

  it('子菜单应有 35px 缩进和 95% 宽度', async () => {
    render(Sidebar, { props: { options } });

    await screen.findByText('题库管理');

    const subItem = screen.getByText('理论题库管理').closest('.sidebar-item-content');

    expect(subItem).toHaveStyle({
      left: '35px;',
      width: '95%;',
    });
  });

  // it('侧边栏应正确自动折叠', async () => {
  //   vi.mock('$app/state', () => ({
  //     page: {
  //       url: {
  //         pathname: '/teacher/question-bank/theory/editBank',
  //       },
  //     },
  //   }));

  //   render(Sidebar, { props: { options } });

  //   // 等待侧边栏项渲染完毕
  //   await screen.findByText('题库管理');

  //   // 获取DOM元素
  //   const sidebar = screen.getByTestId('sidebar-content');

  //   // 验证折叠状态
  //   fireEvent.transitionEnd(sidebar);
  //   expect(sidebar).toHaveClass('folded');
  // });
});
