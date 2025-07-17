/*
 * @Author: OuYang Haobin 1242968386@qq.com
 * @Date: 2025-04-28 10:46:41
 * @LastEditors: OuYang Haobin 1242968386@qq.com
 * @LastEditTime: 2025-07-09 15:57:11
 * @FilePath: /tutorial-platform-fe/src/routes/student/studentAnswerExam/+layout.js
 * @Description: 考试作答页面初始化
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
export async function load({ fetch, url }) {
  let load_success = true;
  try {
    //考试当前状态，正常的话为0
    let exam_status = 0;

    //获取查询参数
    const examinee_id = url.searchParams.get("examineeId");
    const exam_id = url.searchParams.get("examId");

    if (!examinee_id) {
      return {
        load_success: load_success,
      };
    }

    if (!exam_id) {
      return {
        load_success: load_success,
      };
    }

    // 检查考试状态，只有状态为ExamCanBeEnter(5)时才能进入考试页面
    const examStatus = await fetchExamStatus(fetch, exam_id, examinee_id);
    if (examStatus !== 5) {
      console.log("examStatus:", examStatus);
      // 5: ExamCanBeEnter
      return {
        load_success: false,
        error_msg: "当前考试状态不允许进入，请返回考试详情页面查看",
      };
    }

    const body_data = {
      exam_id: Number(exam_id),
      examinee_id: Number(examinee_id),
    };

    //构建请求体
    const requestBody = {
      data: body_data,
    };

    //获取考试信息
    const exam_info_res = await fetch(
      `/api/student/exam/getExamDetails?exam_id=${encodeURIComponent(exam_id)}`,
      { method: "GET", credentials: "include" }
    );

    if (!exam_info_res.ok) {
      throw new Error("Failed to fetch exam info");
    }

    const exam_info = await exam_info_res.json();

    if (exam_info.Status !== 0) {
      throw new Error(`Failed to fetch exam info,error msg:${exam_info.Msg}`);
    }

    //考试试卷标题
    let title = exam_info.Data.exam_info.Name;
    //考试规则
    let rules = exam_info.Data.exam_info.Rules;
    //考试场次
    let exam_sessions = exam_info.Data.exam_sessions;
    
    //考试的附件
    let files = exam_info.Data.exam_info.Files||[];
    console.log("exam info_files",files)
    if (exam_sessions.length <= 0) {
      console.log("没有场次");
      throw new Error("exam_sessions is empty");
    }

    //查找对应的考试场次
    const matched_session = exam_sessions.find(
      (
        /**
    @type {ExamineeSession} */
        session
      ) => {
        return session.ExamineeID === Number(examinee_id);
      }
    );

    if (!matched_session) {
      console.log("没有匹配的场次");
      throw new Error("no matched session");
    }

    console.log("matched_session:", matched_session);

    //获取考试模式
    let period_mode = matched_session.PeriodMode;
    //获取考试时长
    let exam_duration = matched_session.Duration;

    //保存开始时间
    const save_begin_time_res = await fetch("/api/student/exam/begin", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(requestBody),
      credentials: "include",
    });

    if (!save_begin_time_res.ok) {
      let save_begin_time_error_msg = await save_begin_time_res.text();
      throw new Error(
        `Failed to fetch SaveBeginTime:${save_begin_time_error_msg}`
      );
    }
    const save_begin_time_data = await save_begin_time_res.json();

    console.log("save_begin_time_data:", save_begin_time_data);
    exam_status = save_begin_time_data.status;

    console.log("saveBeginTime", save_begin_time_data.data);

    const [paper_res, end_time_res] = await Promise.all([
      fetch(
        `/api/student/exam/getExamPaperDetails?examinee_id=${encodeURIComponent(
          examinee_id
        )}`
      ),
      fetch(
        `/api/student/exam/getExamineeEndTime?examinee_id=${encodeURIComponent(
          examinee_id
        )}`,
        { method: "GET", credentials: "include" }
      ),
    ]);

    // 检查响应
    if (!paper_res.ok) {
      let paper_error_msg = await paper_res.text();
      throw new Error(`Failed to fetch exam paper: ${paper_error_msg}`);
    }
    if (!end_time_res.ok) {
      let end_time_error_msg = await end_time_res.text();
      throw new Error(`Failed to fetch end time: ${end_time_error_msg}`);
    }

    // 分别拿到各自的data
    const paper_data = await paper_res.json();
    const end_time_data = await end_time_res.json();

    // 检查返回状态
    if (paper_data.Status !== 0) {
      throw new Error(`Exam paper API error: ${paper_data.Msg}`);
    }

    if (end_time_data.Status !== 0) {
      throw new Error(`End time API error: ${end_time_data.Msg}`);
    }

    console.log("examPaper", paper_data.Data);
    console.log("endTime", end_time_data.Data);

    //获取开始时间
    let start_time = new Date(matched_session.StartTime).getTime();
    if (period_mode == "02") {
      //如果是灵活模式，就会以学生第一次进入考试的时间来当作是开始时间
      start_time = new Date(save_begin_time_data.data.StartTime).getTime();
    }

    //获取结束时间
    let end_time = new Date(end_time_data.Data).getTime();

    //获取倒计时的秒数
    let now = new Date().getTime();

    console.log("now stamp", now);
    console.log("end_time_stamp", end_time);

    let total_seconds = Math.floor((end_time - now) / 1000);
    console.log("total_seconds", total_seconds);

    return {
      exam_paper: paper_data.Data,
      exam_id: exam_id,
      examinee_id: examinee_id,
      total_seconds: total_seconds,
      start_time: start_time,
      end_time: end_time,
      period_mode: period_mode,
      exam_duration: exam_duration,
      title: title,
      rules: rules,
      exam_status: exam_status,
      files: files,
      load_success: load_success,
    };
  } catch (error) {
    console.error(error);
    load_success = false;
    return {
      exam_paper: {},
      exam_id: "",
      examinee_id: "",
      total_seconds: 0,
      start_time: 0,
      end_time: 0,
      period_mode: "",
      exam_duration: 0,
      title: "",
      rules: "",
      exam_status: 0,
      load_success: load_success,
      error_msg: error,
    };
  }
}

/**
 * 获取考试状态
 * @param {function} fetch - fetch函数
 * @param {string} exam_id - 考试ID
 * @param {string} examinee_id - 考生ID
 * @returns {Promise<number>} - 返回考试状态码
 *
 * 状态码说明：
 * StartTimeNotArrived = 1: 考试开始时间未到
 * EndTimeArrived = 2: 考试结束时间已到
 * ExamSubmitted = 3: 考试已提交
 * LastEntryTimeArrived = 4: 最晚进入时间已到
 * ExamCanBeEnter = 5: 考试可以进入
 */
async function fetchExamStatus(fetch, exam_id, examinee_id) {
  try {
    const response = await fetch(
      `/api/student/exam/status?exam_id=${exam_id}&examinee_id=${examinee_id}`,
      {
        method: "GET",
      }
    );

    if (!response.ok) {
      let error_text = await response.text();
      throw new Error(`获取考试状态失败: ${error_text}`);
    }

    const data = await response.json();
    if (data.status !== 0) {
      throw new Error(`获取考试状态失败: ${data.msg}`);
    }

    return data.data;
  } catch (error) {
    console.error("获取考试状态失败:", error);
    throw error;
  }
}
