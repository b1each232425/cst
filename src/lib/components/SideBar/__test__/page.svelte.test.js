import { render, screen, fireEvent, getByTestId, act, waitFor } from '@testing-library/svelte';
import Sidebar from '../Sidebar.svelte';
import { expect, vi } from 'vitest';
import { goto } from '$app/navigation';

// 模拟 $app/navigation 的 goto 函数
vi.mock('$app/navigation', () => ({
  goto: vi.fn(),
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
  });

  it('应该切换折叠状态', async () => {
    render(Sidebar, { props: { options } });

    // 获取折叠按钮
    const toggleBtn = screen.getByTitle('收起侧边栏'); // 根据按钮的标题判断

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
    global.fetch = vi.fn();

    // 模拟API返回数据
    global.fetch.mockResolvedValueOnce({
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

    render(Sidebar, { props: { options } });
    await screen.findByText('试卷管理');

    // 模拟点击导航项
    const navItem = screen.getByTestId('sidebar-item-btn-试卷管理');
    await fireEvent.click(navItem);

    // 验证路由跳转
    expect(goto).toHaveBeenCalledWith('/teacher/paper');
  });

  it('应处理子菜单的展开和折叠', async () => {
    global.fetch = vi.fn();

    // 模拟 Web Animations API
    global.Element.prototype.animate = vi.fn().mockImplementation(() => ({
      finished: Promise.resolve(),
      cancel: vi.fn(),
    }));

    // 模拟API返回包含子菜单的数据
    global.fetch.mockResolvedValueOnce({
      json: () =>
        Promise.resolve({
          status: 0,
          data: {
            APIs: [{ APIExposePath: '/teacher/question-bank' }, { APIExposePath: '/teacher/question-bank/theory' }],
          },
        }),
    });

    render(Sidebar, { props: { options } });
    // 等待数据加载
    await screen.findByTestId('sidebar-item-btn-题库管理');

    // 初始状态验证
    const foldIcon = screen.getByAltText('折叠');
    expect(foldIcon).toBeInTheDocument();
    expect(screen.getByText('理论题库管理')).toBeVisible();

    // 第一次点击 - 折叠
    await fireEvent.click(screen.getByTestId('sidebar-item-btn-题库管理'));

    // 验证折叠状态
    await waitFor(() => {
      // 图标变为"展开"
      expect(screen.getByAltText('展开')).toBeInTheDocument();
    });

    // 第二次点击 - 展开
    await fireEvent.click(screen.getByTestId('sidebar-item-btn-题库管理'));

    // 验证展开状态
    await waitFor(() => {
      // 图标变回"折叠"
      expect(screen.getByAltText('折叠')).toBeInTheDocument();
      // 子菜单显示
      expect(screen.getByText('理论题库管理')).toBeVisible();
    });
  });

  it('应正确高亮当前路由', async () => {
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

    render(Sidebar, { props: { options } });
    await screen.findByText('题库管理');
    await screen.findByText('理论题库管理');

    // 验证高亮状态
    const activeItem = screen.getByText('理论题库管理').closest('li');
    expect(activeItem).toHaveClass('sidebar-item active');

    // 验证非当前路由不高亮
    const inactiveItem = screen.getByText('题库管理').closest('li');
    expect(inactiveItem).not.toHaveClass('active');
  });

  it('正确获取用户数据', async () => {
    global.fetch = vi.fn();

    // 模拟成功的API响应
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

  it('悬浮侧边栏显示与隐藏', async () => {
    global.fetch = vi.fn();

    // 模拟成功的API响应
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

    // 渲染组件
    const { container } = render(Sidebar, { props: { options } });

    // 获取元素
    const sidebarContent = await screen.findByTestId('sidebar-content');

    // 点击前打印宽度
    console.log('点击前宽度:', sidebarContent.offsetWidth);

    // 点击按钮
    await fireEvent.click(screen.getByTestId('sidebar-toggle-btn'));

    // 等待一定时间，确保动画完成
    await new Promise((resolve) => setTimeout(resolve, 300)); // 等待 300ms

    // 点击后打印宽度
    console.log('点击后宽度:', sidebarContent.offsetWidth);
  });
});
