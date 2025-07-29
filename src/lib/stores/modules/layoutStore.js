import { writable } from 'svelte/store';

// 存储 sidebar 数据
export const navStore = writable([
  {

    name: 'question-bank',
    title: '题库管理',
    path: '/teacher/question-bank',

    icon: '/sidebar/nav_icon/question_bank.svg',
    isOpen: true,
    isSelect: false,
    children: [
      {
        name: 'theory',
        title: '理论题库管理',

        path: '/teacher/question-bank/theory',

        isOpen: true,
        isSelect: true,
      },
    ],
  },
  {

    name: 'paper',
    title: '试卷管理',
    path: '/teacher/paper',

    icon: '/sidebar/nav_icon/paper.svg',
    isOpen: true,
    isSelect: false,
  },
  {

    name: 'practice',

    title: '练习管理',
    path: '/teacher/practice-management',
    icon: '/sidebar/nav_icon/practice.svg',
    isOpen: true,
    isSelect: false,
  },
  {

    name: 'exam',
    title: '考试管理',
    path: '/teacher/exam',

    icon: '/sidebar/nav_icon/examination.svg',
    isOpen: true,
    isSelect: false,
  },
  {

    name: 'correct',
    title: '试卷批改',
    path: '/teacher/correct',

    icon: '/sidebar/nav_icon/correct.svg',
    isOpen: true,
    isSelect: false,
    children: [
      {

        name: 'exam-correct',
        title: '考试批改',
        path: '/teacher/correct/exam-correct',

        isOpen: true,
        isSelect: false,
      },
      {

        name: 'practice-correct',
        title: '练习批改',
        path: '/teacher/correct/practice-correct',

        isOpen: true,
        isSelect: false,
      },
    ],
  },
  {

    name: 'grade',
    title: '成绩管理',
    path: '/teacher/grade',

    icon: '/sidebar/nav_icon/grade.svg',
    isOpen: true,
    isSelect: false,
    children: [
      {

        name: 'exam-grade',
        title: '考试成绩管理',
        path: '/teacher/grade/exam-grade',

        isOpen: true,
        isSelect: false,
      },
      {

        name: 'practice-grade',
        title: '练习成绩管理',
        path: '/teacher/grade/practice-grade',

        isOpen: true,
        isSelect: false,
      },
    ],
  },
  {

    name: 'exam-site',
    title: '考点管理',
    path: '/teacher/exam-site',

    icon: '/sidebar/nav_icon/exam_site.svg',
    isOpen: true,
    isSelect: false,
  },
  {

    name: 'student',
    title: '学生管理',
    path: '/teacher/student',

    icon: '/sidebar/nav_icon/student.svg',
    isOpen: true,
    isSelect: false,
  },
  {

    name: 'user',
    title: '用户管理',
    path: '/teacher/user',

    icon: '/sidebar/nav_icon/user.svg',
    isOpen: true,
    isSelect: false,
  },
]);

// 存储面包屑数据映射表
export const crumbStore = writable([
  {

    id: 'question-bank',
    title: '题库管理',
    path: '/teacher/question-bank',

    isSelect: false,
    isFilter: true,
    parentId: null,
  },
  {
    id: 'theory',
    title: '理论题库管理',

    path: '/teacher/question-bank/theory',
    isSelect: false,
    isFilter: false,
    parentId: 'question-bank',
  },
  {
    id: '[bankid]',
    title: '题目管理',
    path: '/teacher/question-bank/theory/[bankid]',

    isSelect: false,
    isFilter: false,
    parentId: 'theory',
  },
  {

    id: 'paper',
    title: '试卷管理',
    path: '/teacher/paper',

    isSelect: false,
    isFilter: false,
    parentId: null,
  },
  {
    id: 'practice',
    title: '练习管理',
    path: '/teacher/practice',
    isSelect: false,
    isFilter: false,
    parentId: null,
  },
  {
    id: 'exam',
    title: '考试管理',
    path: '/teacher/exam',
    isSelect: false,
    isFilter: false,
    parentId: null,
  },
  {

    id: 'correct',
    title: '试卷批改',
    path: '/teacher/correct',

    isSelect: false,
    isFilter: false,
    parentId: null,
  },
  {

    id: 'exam-correct',
    title: '考试批改',
    path: '/teacher/correct/exam-correct',
    isSelect: false,
    isFilter: false,
    parentId: 'correct',
  },
  {
    id: 'practice-correct',
    title: '练习批改',
    path: '/teacher/correct/practice-correct',
    isSelect: false,
    isFilter: false,
    parentId: 'correct',
  },
  {
    id: 'grade',
    title: '成绩管理',
    path: '/teacher/grade',

    isSelect: false,
    isFilter: false,
    parentId: null,
  },
  {

    id: 'exam-grade',
    title: '考试成绩管理',
    path: '/teacher/grade/exam-grade',
    isSelect: false,
    isFilter: false,
    parentId: 'grade',
  },
  {
    id: 'practice-grade',
    title: '练习成绩管理',
    path: '/teacher/grade/practice-grade',
    isSelect: false,
    isFilter: false,
    parentId: 'grade',
  },
  {
    id: 'exam-site',
    title: '考点管理',
    path: '/teacher/exam-site',

    isSelect: false,
    isFilter: false,
    parentId: null,
  },
  {

    id: 'student',
    title: '学生管理',
    path: '/teacher/student',

    isSelect: false,
    isFilter: false,
    parentId: null,
  },
  {

    id: 'user',
    title: '用户管理',
    path: '/teacher/user',

    isSelect: false,
    isFilter: false,
    parentId: null,
  },
]);

// 控制侧边栏折叠状态
export const sidebarFoldingState = writable(false);

// 控制侧边栏宽度
export const sidebarWidth = writable('235px');
