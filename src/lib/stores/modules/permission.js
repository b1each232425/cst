import { writable } from 'svelte/store';

export const authMetadata = writable([]);

export const permittedModulesKeyInCache = 'permittedModules';

export const baseNavItems = writable([
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
    children: [
      {
        name: 'manual',
        title: '自定义组卷',
        path: '/teacher/paper/manual',
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
        name:'previewExam',
        title:'预览试卷',
        path:'/teacher/exam/previewExam',
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
    name: 'correctDetail',
    title: '批改详情',
    path: '/teacher/correct/correct',
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
]);
