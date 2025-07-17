/*
 * @Author: OuYang Haobin 1242968386@qq.com
 * @Date: 2025-05-19 14:03:10
 * @LastEditors: OuYang Haobin 1242968386@qq.com
 * @LastEditTime: 2025-05-30 23:01:52
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
export async function load({ fetch, url }){
    const exam_id = url.searchParams.get("examId");

    if (!exam_id){
        console.error("exam_id is null");
        return;
    }

     try {
      const response = await fetch(
        `/api/student/exam/getExamDetails?exam_id=${exam_id}`,
        { method: "GET", credentials: "include" }
      );

      if (response.ok) {
        const data = await response.json();
        console.log("exam_info:", data);
        if (data.Status !== 0) {
          throw new Error("Failed to fetch exam info,data.message", data.Msg);
        } else {
          let title = data.Data.exam_info.Name;
          let exam_notes = data.Data.exam_info.Rules;
          let exam_info = data.Data.exam_info;
          let exam_sessions = data.Data.exam_sessions;

          exam_sessions.forEach((/** @type {ExamineeSession}*/session, /**@type {number}*/index) => {
            session.Duration = session.Duration;
            session.StartTimeTimestamp = new Date(session.StartTime).getTime();
            session.EndTimeTimestamp = new Date(session.EndTime).getTime();
          });
          return {
            exam_id:exam_id,
            exam_sessions:exam_sessions,
            exam_notes:exam_notes,
            title:title,
            exam_info:exam_info
          };
        }
      } else {
        let err_text = await response.text();
        throw new Error(
          `Failed to fetch exam info,response.text:${err_text}`
        );
      }
    } catch (error) {
      console.error("Error fetching exam info:", error);
      throw error;
    }
    
}