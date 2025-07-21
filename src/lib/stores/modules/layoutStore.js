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
        name: "theory-question-bank-management",
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
    path: "/teacher",
    icon: "/sidebar/nav_icon/paper.svg",
    isOpen: true,
    isSelect: false,
  },
  {
    name: "practice-management",
    title: "练习管理",
    path: "/teacher",
    icon: "/sidebar/nav_icon/practice.svg",
    isOpen: true,
    isSelect: false,
  },
  {
    name: "exam-management",
    title: "考试管理",
    path: "/teacher",
    icon: "/sidebar/nav_icon/examination.svg",
    isOpen: true,
    isSelect: false,
  },
  {
    name: "paper-correction",
    title: "试卷批改",
    path: "",
    icon: "/sidebar/nav_icon/correct.svg",
    isOpen: true,
    isSelect: false,
    children: [
      {
        name: "exam-correction",
        title: "考试批改",
        path: "/teacher",
        isOpen: true,
        isSelect: false,
      },
      {
        name: "practice-correction",
        title: "练习批改",
        path: "/teacher",
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
        path: "/teacher",
        isOpen: true,
        isSelect: false,
      },
      {
        name: "practice-score-management",
        title: "练习成绩管理",
        path: "/teacher",
        isOpen: true,
        isSelect: false,
      },
    ],
  },
  {
    name: "exam-point-management",
    title: "考点管理",
    path: "/teacher",
    icon: "/sidebar/nav_icon/exam_site.svg",
    isOpen: true,
    isSelect: false,
  },
  {
    name: "student-management",
    title: "学生管理",
    path: "/teacher",
    icon: "/sidebar/nav_icon/student.svg",
    isOpen: true,
    isSelect: false,
  },
  {
    name: "user-management",
    title: "用户管理",
    path: "/teacher",
    icon: "/sidebar/nav_icon/user.svg",
    isOpen: true,
    isSelect: false,
  },
]);

// 控制侧边栏折叠状态
export const sidebarFoldingState = writable(false);

// 控制侧边栏宽度
export const sidebarWidth = writable("235px");
