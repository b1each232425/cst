import { writable } from "svelte/store";

// 存储 sidebar 数据
export const navMap = writable([
  {
    name: "question-bank-management",
    title: "题库管理",
    path: "",
    icon: "/sidebar/nav_icon/question_bank.svg",
    isOpen: true,
    isSelect: false,
    children: [
      {
        name: "theory",
        title: "理论题库管理",
        path: "/teacher/question-bank-management/theory",
        isOpen: true,
        isSelect: true,
      },
    ],
  },
  {
    name: "paper-management",
    title: "试卷管理",
    path: "/teacher/paper-management",
    icon: "/sidebar/nav_icon/paper.svg",
    isOpen: true,
    isSelect: false,
  },
  {
    name: "practice-management",
    title: "练习管理",
    path: "/teacher/practice-management",
    icon: "/sidebar/nav_icon/practice.svg",
    isOpen: true,
    isSelect: false,
  },
  {
    name: "exam-management",
    title: "考试管理",
    path: "/teacher/exam-management",
    icon: "/sidebar/nav_icon/examination.svg",
    isOpen: true,
    isSelect: false,
  },
  {
    name: "paper-correction",
    title: "试卷批改",
    path: "/teacher/paper-correction",
    icon: "/sidebar/nav_icon/correct.svg",
    isOpen: true,
    isSelect: false,
    children: [
      {
        name: "exam-correction",
        title: "考试批改",
        path: "/teacher/paper-correction/exam-correction",
        isOpen: true,
        isSelect: false,
      },
      {
        name: "practice-correction",
        title: "练习批改",
        path: "/teacher/paper-correction/practice-correction",
        isOpen: true,
        isSelect: false,
      },
    ],
  },
  {
    name: "score-management",
    title: "成绩管理",
    path: "",
    icon: "/sidebar/nav_icon/grade.svg",
    isOpen: true,
    isSelect: false,
    children: [
      {
        name: "exam-score-management",
        title: "考试成绩管理",
        path: "/teacher/grade-management/exam",
        isOpen: true,
        isSelect: false,
      },
      {
        name: "practice-score-management",
        title: "练习成绩管理",
        path: "/teacher/grade-management/practice",
        isOpen: true,
        isSelect: false,
      },
    ],
  },
  {
    name: "exam-point-management",
    title: "考点管理",
    path: "/teacher/exam-point-management",
    icon: "/sidebar/nav_icon/exam_site.svg",
    isOpen: true,
    isSelect: false,
  },
  {
    name: "student-management",
    title: "学生管理",
    path: "/teacher/student-management",
    icon: "/sidebar/nav_icon/student.svg",
    isOpen: true,
    isSelect: false,
  },
  {
    name: "user-management",
    title: "用户管理",
    path: "/teacher/user-management",
    icon: "/sidebar/nav_icon/user.svg",
    isOpen: true,
    isSelect: false,
  },
]);

// 存储面包屑数据
export const crumbStore = writable([
  {
    name: "question-bank-management",
    title: "题库管理",
    path: "/teacher/question-bank-management",
    isSelect: false,
    isFilter: true,
    children: [
      {
        name: "theory",
        title: "理论题库管理",
        path: "/teacher/question-bank-management/theory",
        isSelect: true,
        isFilter: false,
        children: [
          {
            name: "[bankid]",
            title: "理论题目管理",
            path: "/teacher/question-bank-management/theory/[bankid]",
            isSelect: false,
            isFilter: false,
          },
        ],
      },
    ],
  },
  {
    name: "paper",
    title: "试卷管理",
    path: "/teacher",
    isSelect: false,
    isFilter: false,
  },
  {
    name: "practice",
    title: "练习管理",
    path: "/teacher",
    isSelect: false,
    isFilter: false,
  },
  {
    name: "exam",
    title: "考试管理",
    path: "/teacher",
    isSelect: false,
    isFilter: false,
  },
  {
    name: "paper-correction",
    title: "试卷批改",
    path: "/teacher",
    isSelect: false,
    isFilter: false,
    children: [
      {
        name: "exam-correction",
        title: "考试批改",
        path: "/teacher",
        isSelect: false,
        isFilter: false,
      },
      {
        name: "practice-correction",
        title: "练习批改",
        path: "/teacher",
        isSelect: false,
        isFilter: false,
      },
    ],
  },
  {
    name: "score-management",
    title: "成绩管理",
    path: "",
    isSelect: false,
    isFilter: false,
    children: [
      {
        name: "exam-score-management",
        title: "考试成绩管理",
        path: "/teacher/grade-management/exam",
        isSelect: false,
        isFilter: false,
      },
      {
        name: "practice-score-management",
        title: "练习成绩管理",
        path: "/teacher/grade-management/practice",
        isSelect: false,
        isFilter: false,
      },
    ],
  },
  {
    name: "exam-point-management",
    title: "考点管理",
    path: "/teacher/exam-point-management",
    isSelect: false,
    isFilter: false,
  },
  {
    name: "student-management",
    title: "学生管理",
    path: "/teacher/student-management",
    isSelect: false,
    isFilter: false,
  },
  {
    name: "user-management",
    title: "用户管理",
    path: "/teacher/user-management",
    isSelect: false,
    isFilter: false,
  },
]);



// 控制侧边栏折叠状态
export const sidebarFoldingState = writable(false);

// 控制侧边栏宽度
export const sidebarWidth = writable("235px");
