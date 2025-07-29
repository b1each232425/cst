import { writable } from 'svelte/store';

// 存储 sidebar 数据
export const navStore = writable([
  {
<<<<<<< HEAD
    name: 'question-bank-management',
    title: '题库管理',
    path: '',
=======
    name: 'question-bank',
    title: '题库管理',
    path: '/teacher/question-bank',
>>>>>>> v1.0.0
    icon: '/sidebar/nav_icon/question_bank.svg',
    isOpen: true,
    isSelect: false,
    children: [
      {
        name: 'theory',
        title: '理论题库管理',
<<<<<<< HEAD
        path: '/teacher/question-bank-management/theory',
=======
        path: '/teacher/question-bank/theory',
>>>>>>> v1.0.0
        isOpen: true,
        isSelect: true,
      },
    ],
  },
  {
<<<<<<< HEAD
    name: 'paper-management',
    title: '试卷管理',
    path: '/teacher/paper-management',
=======
    name: 'paper',
    title: '试卷管理',
    path: '/teacher/paper',
>>>>>>> v1.0.0
    icon: '/sidebar/nav_icon/paper.svg',
    isOpen: true,
    isSelect: false,
  },
  {
<<<<<<< HEAD
    name: 'practice-management',
=======
    name: 'practice',
>>>>>>> v1.0.0
    title: '练习管理',
    path: '/teacher/practice-management',
    icon: '/sidebar/nav_icon/practice.svg',
    isOpen: true,
    isSelect: false,
  },
  {
<<<<<<< HEAD
    name: 'exam-management',
    title: '考试管理',
    path: '/teacher/exam-management',
=======
    name: 'exam',
    title: '考试管理',
    path: '/teacher/exam',
>>>>>>> v1.0.0
    icon: '/sidebar/nav_icon/examination.svg',
    isOpen: true,
    isSelect: false,
  },
  {
<<<<<<< HEAD
    name: 'paper-correction',
    title: '试卷批改',
    path: '/teacher/paper-correction',
=======
    name: 'correct',
    title: '试卷批改',
    path: '/teacher/correct',
>>>>>>> v1.0.0
    icon: '/sidebar/nav_icon/correct.svg',
    isOpen: true,
    isSelect: false,
    children: [
      {
<<<<<<< HEAD
        name: 'exam-correction',
        title: '考试批改',
        path: '/teacher/paper-correction/exam-correction',
=======
        name: 'exam-correct',
        title: '考试批改',
        path: '/teacher/correct/exam-correct',
>>>>>>> v1.0.0
        isOpen: true,
        isSelect: false,
      },
      {
<<<<<<< HEAD
        name: 'practice-correction',
        title: '练习批改',
        path: '/teacher/paper-correction/practice-correction',
=======
        name: 'practice-correct',
        title: '练习批改',
        path: '/teacher/correct/practice-correct',
>>>>>>> v1.0.0
        isOpen: true,
        isSelect: false,
      },
    ],
  },
  {
<<<<<<< HEAD
    name: 'score-management',
    title: '成绩管理',
    path: '/teacher/score-management',
=======
    name: 'grade',
    title: '成绩管理',
    path: '/teacher/grade',
>>>>>>> v1.0.0
    icon: '/sidebar/nav_icon/grade.svg',
    isOpen: true,
    isSelect: false,
    children: [
      {
<<<<<<< HEAD
        name: 'exam-score-management',
        title: '考试成绩管理',
        path: '/teacher/score-management/exam-score-management',
=======
        name: 'exam-grade',
        title: '考试成绩管理',
        path: '/teacher/grade/exam-grade',
>>>>>>> v1.0.0
        isOpen: true,
        isSelect: false,
      },
      {
<<<<<<< HEAD
        name: 'practice-score-management',
        title: '练习成绩管理',
        path: '/teacher/score-management/practice-score-management',
=======
        name: 'practice-grade',
        title: '练习成绩管理',
        path: '/teacher/grade/practice-grade',
>>>>>>> v1.0.0
        isOpen: true,
        isSelect: false,
      },
    ],
  },
  {
<<<<<<< HEAD
    name: 'exam-point-management',
    title: '考点管理',
    path: '/teacher/exam-point-management',
=======
    name: 'exam-site',
    title: '考点管理',
    path: '/teacher/exam-site',
>>>>>>> v1.0.0
    icon: '/sidebar/nav_icon/exam_site.svg',
    isOpen: true,
    isSelect: false,
  },
  {
<<<<<<< HEAD
    name: 'student-management',
    title: '学生管理',
    path: '/teacher/student-management',
=======
    name: 'student',
    title: '学生管理',
    path: '/teacher/student',
>>>>>>> v1.0.0
    icon: '/sidebar/nav_icon/student.svg',
    isOpen: true,
    isSelect: false,
  },
  {
<<<<<<< HEAD
    name: 'user-management',
    title: '用户管理',
    path: '/teacher/user-management',
=======
    name: 'user',
    title: '用户管理',
    path: '/teacher/user',
>>>>>>> v1.0.0
    icon: '/sidebar/nav_icon/user.svg',
    isOpen: true,
    isSelect: false,
  },
]);

// 存储面包屑数据映射表
export const crumbStore = writable([
  {
<<<<<<< HEAD
    id: 'question-bank-management',
    title: '题库管理',
    path: '/teacher/question-bank-management',
=======
    id: 'question-bank',
    title: '题库管理',
    path: '/teacher/question-bank',
>>>>>>> v1.0.0
    isSelect: false,
    isFilter: true,
    parentId: null,
  },
  {
    id: 'theory',
    title: '理论题库管理',
<<<<<<< HEAD
    path: '/teacher/question-bank-management/theory',
    isSelect: false,
    isFilter: false,
    parentId: 'question-bank-management',
  },
  {
    id: '[bankid]',
    title: '理论题目管理',
    path: '/teacher/question-bank-management/theory/[bankid]',
=======
    path: '/teacher/question-bank/theory',
    isSelect: false,
    isFilter: false,
    parentId: 'question-bank',
  },
  {
    id: '[bankid]',
    title: '题目管理',
    path: '/teacher/question-bank/theory/[bankid]',
>>>>>>> v1.0.0
    isSelect: false,
    isFilter: false,
    parentId: 'theory',
  },
  {
<<<<<<< HEAD
    id: 'paper-management',
    title: '试卷管理',
    path: '/teacher/paper-management',
=======
    id: 'paper',
    title: '试卷管理',
    path: '/teacher/paper',
>>>>>>> v1.0.0
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
<<<<<<< HEAD
    id: 'paper-correction',
    title: '试卷批改',
    path: '/teacher/paper-correction',
=======
    id: 'correct',
    title: '试卷批改',
    path: '/teacher/correct',
>>>>>>> v1.0.0
    isSelect: false,
    isFilter: false,
    parentId: null,
  },
  {
<<<<<<< HEAD
    id: 'exam-correction',
    title: '考试批改',
    path: '/teacher/exam-correction',
    isSelect: false,
    isFilter: false,
    parentId: 'paper-correction',
  },
  {
    id: 'practice-correction',
    title: '练习批改',
    path: '/teacher/practice-correction',
    isSelect: false,
    isFilter: false,
    parentId: 'paper-correction',
  },
  {
    id: 'score-management',
    title: '成绩管理',
    path: '/teacher/score-management',
=======
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
>>>>>>> v1.0.0
    isSelect: false,
    isFilter: false,
    parentId: null,
  },
  {
<<<<<<< HEAD
    id: 'exam-score-management',
    title: '考试成绩管理',
    path: '/teacher/score-management/exam-score-management',
    isSelect: false,
    isFilter: false,
    parentId: 'score-management',
  },
  {
    id: 'practice-score-management',
    title: '练习成绩管理',
    path: '/teacher/score-management/practice-score-management',
    isSelect: false,
    isFilter: false,
    parentId: 'score-management',
  },
  {
    id: 'exam-point-management',
    title: '考点管理',
    path: '/teacher/exam-point-management',
=======
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
>>>>>>> v1.0.0
    isSelect: false,
    isFilter: false,
    parentId: null,
  },
  {
<<<<<<< HEAD
    id: 'student-management',
    title: '学生管理',
    path: '/teacher/student-management',
=======
    id: 'student',
    title: '学生管理',
    path: '/teacher/student',
>>>>>>> v1.0.0
    isSelect: false,
    isFilter: false,
    parentId: null,
  },
  {
<<<<<<< HEAD
    id: 'user-management',
    title: '用户管理',
    path: '/teacher/user-management',
=======
    id: 'user',
    title: '用户管理',
    path: '/teacher/user',
>>>>>>> v1.0.0
    isSelect: false,
    isFilter: false,
    parentId: null,
  },
]);

// 控制侧边栏折叠状态
export const sidebarFoldingState = writable(false);

// 控制侧边栏宽度
export const sidebarWidth = writable('235px');
