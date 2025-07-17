/*
 * @Author: Mayux dbs45412@163.com
 * @Date: 2025-04-06 16:15:58
 * @LastEditors: Mayux dbs45412@163.com
 * @LastEditTime: 2025-04-06 16:43:20
 * @FilePath: \tutorial-platform-fe\src\routes\gradeManagement\exam\static_data\static_data.js
 * @Description: 
 * Copyright (c) 2025 by ${git_name}, All Rights Reserved. 
 */
export const column_config = [
    {
        column_name: "考试名称",
        column_data_array: ["《Svelte入门实战课》2025年第2期期末考试", "《Svelte入门实战课》2025年第2期期末考试", "《Svelte入门实战课》2025年第2期期中考试", "《Svelte入门实战课》2025年第2期期中考试", "《Svelte入门实战课》2025年第2期阶段考试", "《Svelte入门实战课》2025年第2期阶段考试", "《Svelte入门实战课》2024年第1期期末考试","《Svelte入门实战课》2024年第1期期中考试","《Svelte入门实战课》2024年第1期期中考试", "《Svelte入门实战课》测试"],
    },
    {
        column_name: "考试类型",
        column_data_array: ["期末考试", "期末考试", "平时考试", "平时考试", "平时考试", "平时考试", "期末考试", "期末考试","平时考试", "平时考试"],
    },
    {
        column_name: "考试班级",
        column_data_array: ["Svelte第二期2班", "Svelte第二期1班", "Svelte第二期2班", "Svelte第二期1班", "Svelte第二期2班", "Svelte第二期1班", "第一期班级", "第一期班级", "第一期班级", "第一期班级"],
    },
    {
        column_name: "考试场次",
        column_data_array: [2,2,1,1,1,1,1,1,1,1],
    },
    {
        column_name: "考试时间",
        column_data_array: [["2025-3-22 9:00-10:00", "2025-3-22 14:00-15:00"], ["2025-3-22 9:00-10:00", "2025-3-22 14:00-15:00"], ["2025-2-18 9:00-10:00"], ["2025-2-18 9:00-10:00"], ["2025-1-11 9:00-10:00"], ["2024-12-26 9:00-10:00"], ["2024-11-4 9:00-10:00"], ["2024-10-13 9:00-10:00"], ["2024-9-29 9:00-10:00"], ["2024-8-29 9:00-10:00"]],
    },
    {
        column_name: "考试总分",
        column_data_array: [[60,40], [60,40], [100], [100], [100], [100], [100], [100], [100], [100]],
    },
    {
        column_name: "考试平均分",
        column_data_array: [[60,40], [60,40], [100], [100], [100], [100], [100], [100], [100], [100]],
    },
    {
        column_name: "应考人数",
        column_data_array: [[40,40], [56,56], [40], [56], [40], [56], [41], [41], [41], [41]],
    },
    {
        column_name: "实考人数",
        column_data_array: [[40,40], [56,56], [40], [56], [40], [56], [41], [41], [41], [41]],
    },
    {
        column_name: "通过人数",
        column_data_array: [[40,40], [56,56], [40], [56], [40], [56], [41], [41], [41], [41]],
    },
    {
        column_name: "提交状态",
        column_data_array: ["批改中", "未提交", "已提交", "已提交", "已提交", "已提交", "已提交", "已提交", "已提交", "已提交"],
    },
    {
        column_name: "操作",
        column_data_array: [1, 3, 2, 2, 2, 2, 2, 2, 2, 2],
    },
]