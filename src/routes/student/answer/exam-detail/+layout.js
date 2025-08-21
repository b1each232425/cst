/*
 * @Author: PENG HAIFENG 1614818457@qq.com
 * @Date: 2025-07-23 14:03:10
 * @LastEditors: PENG HAIFENG 1614818457@qq.com
 * @LastEditTime: 2025-07-30 23:01:52
 * @FilePath: /tutorial-platform-fe/src/routes/student/examPaperDetail/+page.js
 * @Description: 这是默认设置,请设置`customMade`, 打开koroFileHeader查看配置 进行设置: https://github.com/OBKoro1/koro1FileHeader/wiki/%E9%85%8D%E7%BD%AE
 */

/**
 * @typedef {Object} ExamineeSession
 * @property {number} ID - 考试场次 ID
 * @property {number} ExamID - 所属考试 ID
 * @property {string} PaperID - 试卷 ID
 * @property {string} PeriodMode - 考试时间模式（如固定时间段、倒计时等）
 * @property {string} StartTime - 开始时间（ISO 字符串格式）
 * @property {string} EndTime - 结束时间（ISO 字符串格式）
 * @property {number} Duration - 考试时长（单位：分钟）
 * @property {number} SessionNum - 当前场次编号（第几场）
 * @property {number} ExamineeID - 考生 ID
 * @property {number} LateEntryTime - 允许迟到进入的时间（单位：分钟）
 * @property {number} EarlySubmissionTime - 最早可交卷时间（单位：分钟）
 * @property {number} StartTimeTimestamp - 开始时间戳
 * @property {number} EndTimeTimestamp - 结束时间戳
 */
/*export async function load({ fetch, url }){
    
    
}*/