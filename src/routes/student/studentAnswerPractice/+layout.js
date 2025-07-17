/*
 * @Author: OuYang Haobin 1242968386@qq.com
 * @Date: 2025-05-22 11:02:57
 * @LastEditors: OuYang Haobin 1242968386@qq.com
 * @LastEditTime: 2025-07-09 13:24:38
 * @FilePath: /tutorial-platform-fe/src/routes/student/studentAnswerPractice/+layout.js
 * @Description: 初始化
 */
/**
 * @typedef {Object} TimeLogEntry
 * @property {string} start_time - 开始时间，ISO 格式字符串，例如 "2025-05-17T08:00:00Z"
 * @property {string} end_time - 结束时间，默认可能为占位值 "0001-01-01T00:00:00Z"
 * @property {string[]} last_exit_time - 退出时间数组，可能为空数组
 */
export async function load({ fetch, url }) {
  //获取查询参数
  const practice_submission_id = url.searchParams.get("practiceSubmissionId");
  const practice_id = url.searchParams.get("practiceId");
  if (!practice_submission_id&&!practice_id){
     return {
     practice_submission_id: practice_submission_id,
     practice_id: practice_id,
     load_success:true,
     ifPreview:true,
    }
  }
  try {
    //有practice_id说明是新的练习
    if (practice_id) {
      return await NewPractice(practice_id);
    }

    if (practice_submission_id) {
      //返回练习详情
      return await GetPracticeDetails(practice_submission_id);
    }
  } catch (error) {
    console.log(error);
    return {
      load_success: false,
      error_msg: error,
    }
  }
}
/**
 *
 * @param {string} practice_id
 * @returns
 */
async function NewPractice(practice_id) {
  try {
    //创建试卷，如果创建失败说明之前还有正在做的练习
    const practice_submission_id = await createPracticePaper(practice_id);
    //返回练习详情
    return await GetPracticeDetails(practice_submission_id);
  } catch (error) {
    console.log(error);
    throw error;
  }
}

/**
 *
 * @param {string} practice_submission_id
 */

async function GetPracticeDetails(practice_submission_id) {
  try {
    //获取练习的细则
    const detail_resp = await fetch(
      `/api/student_practice/detail?practice_submission_id=${encodeURIComponent(
        practice_submission_id
      )}`,
      { method: "GET", credentials: "include" }
    );

    if (!detail_resp.ok) {
      let err_text = await detail_resp.text();
      throw new Error(
        `Failed to fetch practice submission detail.text:${err_text}`
      );
    }

    const detail_data = await detail_resp.json();

    console.log("detail_data", detail_data);

    if (detail_data.status !== 0) {
      throw new Error(
        `Failed to fetch practice submission detail.error msg:${detail_data.msg}`
      );
    }

    let elapsed_seconds = getElapsedSeconds(
      detail_data.data.practice_record.exit_times,
      detail_data.data.practice_record.start_time,
      detail_data.data.practice_record.end_time
    );

    let result = {
      practice_submission_id: practice_submission_id,
      practice_record: detail_data.data.practice_record,
      exam_paper: detail_data.data.exam_paper,
      elapsed_seconds: elapsed_seconds,
      load_success: true,
      ifPreview:false,
    };
    console.log(result);
    return result;
  } catch (error) {
    console.log(error);
    throw error;
    // return {
    //   practice_record: { name: "预览练习" },
    //   exam_paper: null,
    //   elapsed_seconds: 0,
    // };
  }
}

/**
 *
 * @param {String} practice_id
 */
async function createPracticePaper(practice_id) {
  try {
    if (!practice_id) {
      throw new Error("practice_id is required");
    }
    const response = await fetch(`/api/student_practice`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        data: {
          practice_id: Number(practice_id),
        },
      }),
    });

    if (!response.ok) {
      let err_text = await response.text();
      throw new Error(`Failed to fetch student_practice err:  ${err_text}`);
    }

    const data = await response.json();
    if (data.status !== 0) {
      console.log(`Failed to create student_practice error msg:  ${data.msg}`);
      throw new Error(
        `Failed to create student_practice error msg:  ${data.msg}`
      );
    }
    console.log("create paper success,msg:" + data.msg);
    return data.data;
  } catch (error) {
    console.error("Failed to create student_practice:", error);
    throw error;
  }
}

/**
 * @param {string[]} exit_times - 多次退出时间数组
 * @param {string} start_time - 第一次进入的时间
 * @param {string|null} end_time - 结束时间（可选）
 * @returns {number} 累计使用秒数
 */
function getElapsedSeconds(exit_times, start_time, end_time = null) {
  if (!start_time || !Array.isArray(exit_times)) return 0;

  const endTimestamp = end_time ? new Date(end_time).getTime() : null;
  if (endTimestamp !== null && endTimestamp > 0) {
    console.log("练习已结束");
    return 0;
  }

  const start = new Date(start_time).getTime();
  let elapsedMs = 0;

  for (let i = 0; i < exit_times.length; i++) {
    const current = new Date(exit_times[i]).getTime();
    if (isNaN(current)) continue;

    if (i === 0) {
      elapsedMs += current - start;
    } else {
      const prev = new Date(exit_times[i - 1]).getTime();
      if (!isNaN(prev)) {
        elapsedMs += current - prev;
      }
    }
  }

  console.log("elapsedMs", elapsedMs);

  const elapsedSeconds = elapsedMs / 1000;
  console.log("elapsed_seconds:", elapsedSeconds);
  return elapsedSeconds;
}
