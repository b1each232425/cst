/*
 * @Author: WangKaidun 1597225095@qq.com
 * @Date: 2025-08-07 11:10:19
 * @LastEditors: WangKaidun 1597225095@qq.com
 * @LastEditTime: 2025-08-07 11:35:22
 * @FilePath: \exam\src\routes\teacher\paper\_utils\tool.js
 * @Description: 一些工具函数
 * Copyright (c) 2025 by WangKaidun 1597225095@qq.com, All Rights Reserved. 
 */
// @ts-nocheck

// 组卷方式转换
export const ASSEMBLY_TYPE_TRANS = {
    "00": "自定义组卷",
    "02": "随机组卷",
    "04": "智能刷题",
};

// 试卷用途转换
export const CATEGORY_TRANS = {
    "00": "考试",
    "02": "练习",
};

// 试卷难度转换
export const LEVEL_TRANS = {
    "00": "简单",
    "02": "中等",
    "04": "困难",

    "简单": "easy-level",
    "中等": "normal-level",
    "困难": "hard-level",
};

// 题目类型转换
export const QUESTION_TYPE_TRANS = {
    "00": "单选题",
    "02": "多选题",
    "04": "判断题",
    "06": "填空题",
    "08": "简答题",
};

// 题目难度转换
export const DIFFICULTY_TRANS = {
    1 : "简单",
    2 : "中等",
    3 : "困难",

    "简单": "easy-level",
    "中等": "normal-level",
    "困难": "hard-level"
};

// 试卷状态转换
export const STATUS_TRANS = {
    "00": "未发布",
    "02": "已删除",
    "04": "异常",
    "06": "已发布",

    "未发布": "primary",
    "已删除": "info",
    "异常": "danger",
    "已发布": "success",
};

/**
 * @description: 以UTF-8字符为单位限制输入字符长度
 * @example: <input use:utf8MaxLength={10} bind:value />
 */
export function utf8MaxLength(node, maxBytes) {
    function handleInput(e) {
        const value = e.target.value;

        if (new TextEncoder().encode(value).length > maxBytes) {
        // 超出字节限制时，找到合法的子串
        let valid = value;
        while (new TextEncoder().encode(valid).length > maxBytes) {
            valid = valid.slice(0, -1); // 从后删一个字符
        }
        e.target.value = valid;

        // 触发 input 事件，保证绑定的值同步更新
        node.dispatchEvent(new Event("input"));
        }
    }

    node.addEventListener("input", handleInput);

    return {
        // 动态更新maxBytes（暂不需要）
        // update(newMaxBytes) {
        // maxBytes = newMaxBytes;
        // },
        destroy() {
        node.removeEventListener("input", handleInput);
        }
    };
}
  