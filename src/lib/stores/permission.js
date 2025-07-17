// <!--
//  * @Author: 王皓 xwcoder7@gmail.com
//  * @Date: 2025-05-18 23:46:15
//  * @LastEditors: 王皓 xwcoder7@gmail.com
//  * @LastEditTime: 2025-05-18 23:46:15
//  * @FilePath: \exam-fe\src\lib\stores\permission.js
//  * @Description: 该文件用于存储用户权限相关的常量和函数
//  * @
//  * @Copyright (c) 2025 by 王皓, All Rights Reserved.
// -->
import { writable } from "svelte/store";

export const authMetadata = writable([]);

export const permittedModulesKeyInCache = "permittedModules";

export const baseNavItems = [
    {
        name: "courseManagement",
        title: "课程管理",
        path: "/teacher/courseManagement",
        icon: "/sidebar/nav_icon/course.svg",
    },
    {
        name: "questionBankManagement",
        title: "题库管理",
        path: "/teacher/questionBank",
        icon: "/sidebar/nav_icon/question_bank.svg",
        children_is_parallel: true,
        children: [
            // {
            //     name: "programmingQuestionBank",
            //     title: "编程题库管理",
            //     path: "/teacher/questionBank/programming",
            // },
            {
                name: "theoryQuestionBank",
                title: "理论题库管理",
                path: "/teacher/questionBank/theory",
                children: [
                    {
                        name: "editTheoryQuestionBank",
                        title: "编辑题库",
                        path: "/teacher/questionBank/theory/editBank",
                    },
                    {
                        name: "addTheoryQuestionBank",
                        title: "新增题库",
                        path: "/teacher/questionBank/theory/newBank",
                    },
                ],
            },
        ]
    },
    {
        name: "paperManagement",
        title: "试卷管理",
        path: "/teacher/paperManagement",
        icon: "/sidebar/nav_icon/paper.svg",
    },
    {
        name: "practiceManagement",
        title: "练习管理",
        path: "/teacher/practiceManagement",
        icon: "/sidebar/nav_icon/practice.svg",
    },
    {
        name: "examManagement",
        title: "考试管理",
        path: "/teacher/examManagement",
        icon: "/sidebar/nav_icon/examination.svg",
        children: [
            {
                name: "createExam",
                title: "创建考试",
                path: "/teacher/examManagement/createExam",
                force_hide: true,
            },
            {
                name: "editExam",
                title: "编辑考试",
                path: "/teacher/examManagement/editExam/\\d+$",
                force_hide: true,
            },
            {
                name: "invigilation",
                title: "监考管理",
                path: "/teacher/examManagement/invigilation/\\d+$",
                force_hide: true,
            },
        ]
    },
    {
        name: "correctManagement",
        title: "试卷批改",
        path: "/teacher/mark",
        icon: "/sidebar/nav_icon/correct.svg",
        children_is_parallel: true,
        children: [
            {
                name: "markManagement",
                title: "考试批改",
                path: "/teacher/mark/markManagement",
            },
            {
                name: "markingResult",
                title: "练习批改",
                path: "/teacher/mark/practiceMarkManagement",
            },
        ]
    },
    {
        name: "gradeManagement",
        title: "成绩管理",
        path: "/teacher/gradeManagement",
        icon: "/sidebar/nav_icon/grade.svg",
        children_is_parallel: true,
        children: [
            {
                name: "examGradeManagement",
                title: "考试成绩管理",
                path: "/teacher/gradeManagement/exam",
                children: [
                    {
                        name: "examGradeDetail",
                        title: "考试成绩详情",
                        path: "/teacher/gradeManagement/exam/detail",
                    },
                ]
            },
            {
                name: "practiceGradeManagement",
                title: "练习成绩管理",
                path: "/teacher/gradeManagement/practice",
                children: [
                    {
                        name: "practiceGradeDetail",
                        title: "练习成绩详情",
                        path: "/teacher/gradeManagement/practice/detail",
                    },
                ]
            },
            // {
            //     name: "courseGradeManagement",
            //     title: "课程成绩管理",
            //     path: "/teacher/gradeManagement/course",
            // },
        ]
    },
    {
        name: "questionnaireManagement",
        title: "问卷管理",
        path: "/teacher/questionnaireManagement",
        icon: "/sidebar/nav_icon/questionnaire.svg",
    },
    {
        name: "announcementManagement",
        title: "公告管理",
        path: "/teacher/announcementManagement",
        icon: "/sidebar/nav_icon/announcement.svg",
    },
    {
        name: "examSiteManagement",
        title: "考点管理",
        path: "/teacher/examSiteManagement",
        icon: "/sidebar/nav_icon/exam_site.svg",
        children: [
            {
                name: "editExamSite",
                title: "编辑考点",
                path: "/teacher/examSiteManagement/edit/\\d+$",
                force_hide: true,
            },
            {
                name: "examSiteDetails",
                title: "考点详情",
                path: "/teacher/examSiteManagement/details/\\d+$",
                force_hide: true,
                children:[
                    {
                        name: "examRoomExamList",
                        title: "考场考试列表",
                        path: "/teacher/examSiteManagement/room/\\d+$",
                        force_hide: true,
                    }
                ]
            },
        ]
    },
    {
        name: "invigilationList",
        title: "监考列表",
        path: "/teacher/invigilationList",
        icon: "/sidebar/nav_icon/invigilate.svg",
        children: [
            {
                name: "invigilation",
                title: "监考详情",
                path: "/teacher/invigilationList/invigilation",
                force_hide: true,
            }
        ]
    },
    {
        name: "studentManagement",
        title: "学生管理",
        path: "/teacher/studentManagement",
        icon: "/sidebar/nav_icon/student.svg",
        children: [
            {
                name: "addStudent",
                title: "创建学生",
                path: "/teacher/studentManagement/add/\\d+$",
                force_hide: true,
            },
            {
                name: "editStudent",
                title: "编辑学生",
                path: "/teacher/studentManagement/edit/\\d+$",
                force_hide: true,
            },
            {
                name: "detailsStudent",
                title: "学生详情",
                path: "/teacher/studentManagement/details/\\d+$",
                force_hide: true,
            },
        ]

    },
    {
        name: "teacherManagement",
        title: "教师管理",
        path: "/teacher/teacherManagement",
        icon: "/sidebar/nav_icon/teacher.svg",
        children_is_parallel: false,
        children: [
            {
                name: "addTeacher",
                title: "添加教师",
                path: "/teacher/teacherManagement/addTeacher",
                force_hide: true,
            },
            {
                name: "teacherDetail",
                title: "教师详情",
                path: "/teacher/teacherManagement/teacherDetail",
                force_hide: true,
            },
            {
                name: "editTeacher",
                title: "修改教师信息",
                path: "/teacher/teacherManagement/editTeacher",
                force_hide: true,
            },
        ]
    },
    {
        name: "userManagement",
        title: "用户管理",
        path: "/teacher/userManagement",
        icon: "/sidebar/nav_icon/user.svg",
        children_is_parallel: false,
        children: [
            {
                name: "addUser",
                title: "添加用户",
                path: "/teacher/userManagement/addUser",
                force_hide: true,
            },
            {
                name: "userDetail",
                title: "用户详情",
                path: "/teacher/userManagement/userDetail",
                force_hide: true,
            },
            {
                name: "editUser",
                title: "修改用户信息",
                path: "/teacher/userManagement/editUser",
                force_hide: true,
            },
        ]
    }
];