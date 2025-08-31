import { writable } from 'svelte/store';

export const baseNavItems = writable([
  {
    name: 'login',
    title: '登录',
    path: '/login',
  },
  {
    name: 'questionBankManagement',
    title: '题库管理',
    path: '/teacher/question-bank',
    icon: '/sidebar/nav_icon/question_bank.svg',
    children_is_parallel: true,
    isFilter: true,
    children: [
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
    name: 'enroll',
    title: '报名管理',
    path: '/teacher/enroll',
    icon: '/enroll/enroll.svg',
    children_is_parallel: false,
    children: [
      {
        name: 'add-enroll',
        title: '创建报名计划',
        path: '/teacher/enroll/add-enroll',
      },
      {
        name: 'edit-enroll',
        title: '编辑报名计划',
        path: '/teacher/enroll/edit-enroll/\\d+$',
      },
      {
        name: 'see-enroll',
        title: '查看报名人员',
        path: '/teacher/enroll/see-enroll/\\d+$',
        children: [
          {
            name: 'person-detail',
            title: '报名信息详情',
            path: '/teacher/enroll/see-enroll/\\d+/person-detail/\\d+$',
          },
        ],
      },
    ],
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
      },
      {
        name: 'edit',
        title: '编辑练习',
        path: '/teacher/practice/edit/\\d+$',
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
      },
      {
        name: 'editExam',
        title: '编辑考试',
        path: '/teacher/exam/editExam/\\d+$',
      },

      {
        name: 'previewExam',
        title: '预览试卷',
        path: '/teacher/exam/previewExam',
      },
    ],
  },
  {
    name: 'invigilate',
    title: '监考管理',
    path: '/teacher/invigilate',
    icon: '/invigilate/invigilate.svg',
    children: [
      {
        name: 'detail',
        title: '监考详情',
        path: '/teacher/invigilate/detail',
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
    ],
  },
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
      },
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
      },
    ],
  },
  {
    name: 'exam-site',
    title: '考点管理',
    path: '/teacher/exam-site',
    icon: '/sidebar/nav_icon/exam_site.svg',
    children_is_parallel: false,
    children: [
      {
        name: 'details',
        title: '考点详情',
        path: '/teacher/exam-site/details/\\d+$',
      },
      {
        name: 'edit',
        title: '考点详情',
        path: '/teacher/exam-site/edit/\\d+$',
      },
      {
        name: 'edit',
        title: '考试详情',
        path: '/teacher/exam-site/room/\\d+$',
      },
    ],
  },
]);
