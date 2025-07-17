/*
 * @Author: OuYang Haobin 1242968386@qq.com
 * @Date: 2025-05-28 14:57:00
 * @LastEditors: OuYang Haobin 1242968386@qq.com
 * @LastEditTime: 2025-05-31 15:25:59
 * @FilePath: /tutorial-platform-fe/src/lib/common/check_exam_status.js
 * @Description: 用于根据传入的status来判断当前考试属于什么情况
 */
/**
 * 检查考试状态
 * @param {number}exam_status
 * @param {any}actionToast
 * @param {Function}onComplete
 */
export function checkExamStatus(exam_status, actionToast, onComplete) {
   console.log("exam_status", exam_status);
  if (exam_status===0) {
    return;
  }
  switch (exam_status) {
    case -11:
      actionToast.show("error", "考试未到达提交时间");
      break;
    case -12:
      actionToast.show("error", "考试还未开始");
      break;
    case -13:
      actionToast.show("error", "考试允许进入时间已过，无法进入考试");
      break;
    case -14:
      actionToast.show("error", "考试已结束");
      break;
    case -15:
      actionToast.show("error", "考试已经提交");
      break;
    default:
      actionToast.show("error", `exam_status:${exam_status}`);
  }
  setTimeout(() => {
    onComplete();
  }, 2500);
  return;
}
