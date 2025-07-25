/*
 * @Author: OuYang Haobin 1242968386@qq.com
 * @Date: 2025-05-28 10:00:00
 * @LastEditors: OuYang Haobin 1242968386@qq.com
 * @LastEditTime: 2025-05-28 10:00:00
 * @FilePath: /tutorial-platform-fe/src/lib/component/QuestionAnswer/constants.js
 * @Description: 常量定义
 */

/**
 * 题目类型常量
 * @type {{SINGLE_CHOICE: string, MULTIPLE_CHOICE: string, TRUE_FALSE: string, FILL_BLANK: string, ESSAY: string}}
 */
export const QUESTION_TYPES = {
  /** 单选题 */
  SINGLE_CHOICE: "00",
  /** 多选题 */
  MULTIPLE_CHOICE: "02",
  /** 判断题 */
  TRUE_FALSE: "04",
  /** 填空题 */
  FILL_BLANK: "06",
  /** 简答题 */
  ESSAY: "08"
};