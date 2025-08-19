import { render, screen, fireEvent, getByTestId, act, waitFor } from '@testing-library/svelte';
import Sidebar from '../Sidebar.svelte';
import { expect, vi } from 'vitest';
import { goto } from '$app/navigation';
import { slide } from 'svelte/transition';
import { page } from '$app/state';
import { beforeNavigate } from '$app/navigation';

// 导航栏数据
const nav_map = [
  {
    name: 'login',
    title: '登录',
    path: '/login',
  },
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
      {
        name: 'previewExam',
        title: '预览试卷',
        path: '/teacher/exam/previewExam',
        force_hide: true,
      },
    ],
  },
  {
    name: 'correctManagement',
    title: '试卷批改',
    path: '/teacher/correct',
    icon: '/sidebar/nav_icon/correct.svg',
    children_is_parallel: true,
    isFilter: true,
    children: [
      {
        name: 'exam-correct',
        title: '考试批改',
        path: '/teacher/correct/exam-correct',
      },
      {
        name: 'practice-correct',
        title: '练习批改',
        path: '/teacher/correct/practice-correct',
      },
    ],
  },

  {
    name: 'gradeManagement',
    title: '成绩管理',
    path: '/teacher/grade',
    icon: '/sidebar/nav_icon/grade.svg',
    children_is_parallel: true,
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
        title: '创建用户',
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

// 设置当前路径
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

describe('SideBar 组件 nav_map 参数校验', () => {
  let consoleWarnSpy;

  beforeEach(() => {
    consoleWarnSpy = vi.spyOn(console, 'warn');
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  // 正确情况测试
  it('接受包含所有可选字段的有效导航数据', async () => {
    const fullFeaturedNavMap = [
      {
        name: 'full',
        title: '完整导航',
        path: '/full',
        icon: '/icons/full.svg',
        children_is_parallel: true,
        isFilter: false,
        force_hide: true,
        children: [
          {
            name: 'child',
            title: '子导航',
            path: '/full/child',
            force_hide: false,
          },
        ],
      },
    ];

    render(Sidebar, { props: { nav_map: fullFeaturedNavMap } });
    expect(consoleWarnSpy).not.toHaveBeenCalled();
  });

  it('接受空数组', async () => {
    render(Sidebar, { props: { nav_map: [] } });
    expect(consoleWarnSpy).not.toHaveBeenCalled();
  });

  it('接受多层级复杂结构', async () => {
    const complexNavMap = [
      {
        name: 'level1',
        title: '一级',
        path: '/level1',
        children: [
          {
            name: 'level2',
            title: '二级',
            path: '/level1/level2',
            children: [
              {
                name: 'level3',
                title: '三级',
                path: '/level1/level2/level3',
                children: [
                  {
                    name: 'level4',
                    title: '四级',
                    path: '/level1/level2/level3/level4',
                  },
                ],
              },
            ],
          },
        ],
      },
    ];

    render(Sidebar, { props: { nav_map: complexNavMap } });
    expect(consoleWarnSpy).not.toHaveBeenCalled();
  });

  // 错误情况测试 - 基本结构
  it('null 值应警告并使用默认值', async () => {
    render(Sidebar, { props: { nav_map: null } });
    expect(consoleWarnSpy).toHaveBeenCalledWith('[SideBar] nav_map 必须是数组，当前为 object');
  });

  it('undefined 值应使用默认空数组且不警告', async () => {
    render(Sidebar, { props: { nav_map: undefined } });
    expect(consoleWarnSpy).not.toHaveBeenCalled();
  });

  it('数字类型应警告并使用默认值', async () => {
    render(Sidebar, { props: { nav_map: 123 } });
    expect(consoleWarnSpy).toHaveBeenCalledWith('[SideBar] nav_map 必须是数组，当前为 number');
  });

  it('对象类型应警告并使用默认值', async () => {
    render(Sidebar, { props: { nav_map: {} } });
    expect(consoleWarnSpy).toHaveBeenCalledWith('[SideBar] nav_map 必须是数组，当前为 object');
  });

  // 错误情况测试 - 字段类型
  it('name 为数字时应警告', async () => {
    const invalidNavMap = [{ name: 123, title: '标题', path: '/path' }];
    render(Sidebar, { props: { nav_map: invalidNavMap } });
    expect(consoleWarnSpy).toHaveBeenCalledWith('[SideBar] nav_map[0].name 必须是字符串，当前为 number');
  });

  it('title 为布尔值时应警告', async () => {
    const invalidNavMap = [{ name: 'name', title: true, path: '/path' }];
    render(Sidebar, { props: { nav_map: invalidNavMap } });
    expect(consoleWarnSpy).toHaveBeenCalledWith('[SideBar] nav_map[0].title 必须是字符串，当前为 boolean');
  });

  it('path 为数组时应警告', async () => {
    const invalidNavMap = [{ name: 'name', title: 'title', path: ['/path'] }];
    render(Sidebar, { props: { nav_map: invalidNavMap } });
    expect(consoleWarnSpy).toHaveBeenCalledWith('[SideBar] nav_map[0].path 必须是字符串，当前为 object');
  });

  it('icon 为数字时应警告', async () => {
    const invalidNavMap = [{ name: 'name', title: 'title', path: '/path', icon: 123 }];
    render(Sidebar, { props: { nav_map: invalidNavMap } });
    expect(consoleWarnSpy).toHaveBeenCalledWith('[SideBar] nav_map[0].icon 必须是字符串，当前为 number');
  });

  // 错误情况测试 - 子项校验
  it('子项缺少 name 字段时应警告', async () => {
    const invalidNavMap = [
      {
        name: 'parent',
        title: '父项',
        path: '/parent',
        children: [{ title: '子项', path: '/child' }],
      },
    ];
    render(Sidebar, { props: { nav_map: invalidNavMap } });
    expect(consoleWarnSpy).toHaveBeenCalledWith('[SideBar] nav_map[0].children[0] 缺少必需字段');
  });

  it('子项 children 为对象时应警告', async () => {
    const invalidNavMap = [
      {
        name: 'parent',
        title: '父项',
        path: '/parent',
        children: {},
      },
    ];
    render(Sidebar, { props: { nav_map: invalidNavMap } });
    expect(consoleWarnSpy).toHaveBeenCalledWith('[SideBar] nav_map[0].children 必须是数组，当前为 object');
  });

  // 错误情况测试 - 布尔字段
  it('children_is_parallel 为字符串时应警告', async () => {
    const invalidNavMap = [
      {
        name: 'item',
        title: '项',
        path: '/item',
        children_is_parallel: 'true',
      },
    ];
    render(Sidebar, { props: { nav_map: invalidNavMap } });
    expect(consoleWarnSpy).toHaveBeenCalledWith(
      '[SideBar] nav_map[0].children_is_parallel 必须是布尔值，当前为 string',
    );
  });

  it('isFilter 为数字时应警告', async () => {
    const invalidNavMap = [
      {
        name: 'item',
        title: '项',
        path: '/item',
        isFilter: 1,
      },
    ];
    render(Sidebar, { props: { nav_map: invalidNavMap } });
    expect(consoleWarnSpy).toHaveBeenCalledWith('[SideBar] nav_map[0].isFilter 必须是布尔值，当前为 number');
  });

  it('force_hide 为对象时应警告', async () => {
    const invalidNavMap = [
      {
        name: 'item',
        title: '项',
        path: '/item',
        force_hide: {},
      },
    ];
    render(Sidebar, { props: { nav_map: invalidNavMap } });
    expect(consoleWarnSpy).toHaveBeenCalledWith('[SideBar] nav_map[0].force_hide 必须是布尔值，当前为 object');
  });

  // 混合错误测试
  it('多个错误同时存在时应报告所有错误', async () => {
    const invalidNavMap = [
      {
        title: '缺少name', // 缺少name
        path: 123, // path类型错误
        children: 'invalid', // children类型错误
      },
      {
        name: 'item2',
        title: '项2',
        path: '/item2',
        isFilter: 'false', // 布尔字段错误
      },
    ];

    render(Sidebar, { props: { nav_map: invalidNavMap } });

    // 因为第一个对象缺少name会直接重置nav_map并返回，所以只检查这些警告
    expect(consoleWarnSpy).toHaveBeenCalledWith('[SideBar] nav_map[0] 缺少必需字段: name');
    expect(consoleWarnSpy).toHaveBeenCalledWith('[SideBar] nav_map[0].name 必须是字符串，当前为 undefined');
    expect(consoleWarnSpy).toHaveBeenCalledWith('[SideBar] nav_map[1].isFilter 必须是布尔值，当前为 string');
    expect(consoleWarnSpy).toHaveBeenCalledTimes(3);
  });
});

describe('Sidebar 侧边栏组件测试', () => {
  beforeEach(() => {
    // 在每个测试前，清空所有的模拟
    vi.restoreAllMocks();

    // 清除localStorage中的测试数据
    localStorage.clear();

    // 重置DOM
    document.body.innerHTML = '';

    // 初始化page返回路径
    setPathname('/teacher/question-bank/theory');
  });

  it('正确获渲染基本元素', async () => {
    // 渲染组件并传递nav_map
    render(Sidebar, { props: { nav_map: nav_map } });

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
    // 渲染组件并传递nav_map
    render(Sidebar, { props: { nav_map: nav_map } });

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
    // 渲染组件并传递nav_map
    render(Sidebar, { props: { nav_map: nav_map } });

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

    // 渲染组件并传递nav_map
    render(Sidebar, { props: { nav_map: nav_map } });

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
    // 渲染组件并传递nav_map
    render(Sidebar, { props: { nav_map: nav_map } });

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
    // 渲染组件并传递nav_map
    render(Sidebar, { props: { nav_map: nav_map } });

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
    // 渲染组件并传递nav_map
    render(Sidebar, { props: { nav_map: nav_map } });

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

  it('应正确处理初始状态为展开的情况', async () => {
    // 直接预设localStorage状态（模拟刷新前保存的状态）
    localStorage.setItem('sidebar_fold_state', 'false');
    localStorage.setItem('is_auto_fold', 'false');
    localStorage.setItem('sidebar_is_folded', 'false');
    localStorage.setItem('sidebar_fold_str', '收起侧边栏');

    // 渲染组件（模拟页面刷新后加载）
    render(Sidebar);

    // 等待组件完全挂载
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 0));
    });

    fireEvent.transitionEnd(await screen.findByTitle('收起侧边栏'));

    // 验证状态是否正确恢复
    const sidebar = await screen.findByTestId('sidebar-content');
    expect(sidebar).not.toHaveClass('folded');

    // 验证折叠按钮状态
    const toggleBtn = await screen.findByTitle('收起侧边栏');
    expect(toggleBtn).toBeInTheDocument();

    // 验证其相关状态
    expect(localStorage.getItem('sidebar_fold_state')).toBe('false');
  });
});
