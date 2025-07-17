<script>
  import ExamInfo from "./ExamInfo.svelte";
  import Chart from "./Chart.svelte";
  import StudentGrade from "./StudentGrade.svelte";
  import Analysis from "./Analysis.svelte";
  import { onMount, setContext } from "svelte";
  import { formatISOString } from "$lib/common/time_utils";
  import { goto } from "$app/navigation";
  import Dialog from "$lib/component/Dialog.svelte";
  import ActionToast from "$lib/component/ActionToast.svelte";
  import { exportExamToExcel } from "$lib/excel_export/export_examinee_score";
  import { sget } from "$lib/common/api_data";

  // 后端返回数据类型
  /**
   * @typedef {Object} Session
   * @property {number} exam_id - 考试ID
   * @property {number} exam_session_id - 考试场次ID
   * @property {string} paper_name - 考卷名称
   * @property {string} start_time - 考试开始时间（ISO格式）
   * @property {string} end_time - 考试结束时间（ISO格式）
   * @property {number} total_score - 试卷总分
   * @property {number} average_score - 平均分
   * @property {number} scheduled_examinees - 应考人数
   * @property {number} actual_examinees - 实考人数
   * @property {number} pass_examinees - 及格人数（总得分 >= 0.6 * 试卷总分）
   * @property {string} mark_mode - 批改模式
   */

  /**
   * @typedef {Object} ResponseData
   * @property {number} id - 考试ID
   * @property {string} name - 考试名称
   * @property {string} type - 考试类型
   * @property {string} class - 考试班级
   * @property {Session[]} sessions - 考试场次（使用的试卷名称）
   * @property {boolean} submitted - 是否已提交成绩
   */

  //整合为更适合使用的数据类型
  /**
   * @typedef {Object} ExamData
   * @property {number} id - 考试ID
   * @property {string} title - 考试名称
   * @property {string} type - 考试类型
   * @property {string} examTimeText - 多场考试时间汇总字符串
   * @property {number} totalScore - 整场考试总分（可取首场试卷分值）
   * @property {number} averageScore - 加权平均分
   * @property {number} totalExaminees - 应考人数总和
   * @property {number} passExaminees - 及格人数总和
   * @property {boolean} submitted - 是否提交
   * @property {PaperInfo[]} papers - 各试卷详情
   */

  /**
   * @typedef {Object} PaperInfo
   * @property {number} id - 试卷ID(目前是考试场次ID)
   * @property {string} idText - 试卷编号文本，如 "试卷1"
   * @property {string} name - 试卷名称
   * @property {number} actualExaminees - 实考人数
   * @property {number} totalScore - 单张试卷总分
   * @property {number} averageScore - 平均分
   * @property {string} markMode - 批改模式
   */

  /**
   * @typedef DialogProps
   * @property {boolean} is_open -对话框是否打开
   * @property {string} title -对话框标题
   * @property {string} content -对话框内容
   * @property {string} confirm_text -确认按钮文本
   * @property {string} cancel_text -取消按钮文本
   * @property {string} confirm_text_background_color -确认按钮背景色
   * @property {function} on_confirm -确认按钮回调函数
   * @property {function} on_cancel -取消按钮回调函数
   * @property {function} on_close -关闭对话框回调函数
   */

  /**
   * @typedef ActionToastProps
   * @property {boolean} is_show -操作提示是否显示
   * @property {string} type -操作提示类型
   * @property {string} message -操作提示文本
   * @property {number} duration -操作提示持续时间
   * @property {string} icon_src -操作提示图标地址
   */

  const MARK_MODE_MAP = {
    "00": "自动批改",
    "02": "全卷多评",
    "04": "试卷分配",
    "06": "题组专评",
    "08": "题目分配",
    "10": "单人批改",
  };
  const EXAM_TYPE_MAP = {
    "00": "平时考试",
    "02": "期末考试",
    "04": "资格证考试",
  };
  const ICONS = {
    action_success: "/paper/action_success.svg",
    action_error: "/paper/action_fail.svg",
  };

  /**
   * 对话框属性
   * @type {DialogProps}
   */
  let dialog_props = $state({
    is_open: false,
    title: "是否确认提交考试成绩?",
    content: "成绩提交后无法进行修改",
    confirm_text: "确认提交",
    cancel_text: "取消",
    confirm_text_background_color: "#0052d9",
    on_cancel: () => {},
    on_close: () => {},
  });

  /**
   * 操作提示属性
   * @type {ActionToastProps}
   */
  let action_toast_props = $state({
    is_show: false,
    type: "success",
    message: "操作成功",
    duration: 2000,
    icon_src: ICONS["action_success"],
  });

  /**
   * @type {string|null}
   */
  let examId = $state("");

  /**
   * @type {ExamData|null}
   * @description 当前考试数据
   */
  let examData = $state(null);

  /**
   * @type {boolean}
   * @description 在获取到examId前不显示页面内容
   * @default false
   */
  let isShow = $state(false);

  // 设置上下文
  setContext("exam", {
    get examId() {
      return examId;
    },
    get examData() {
      return examData;
    },
  });

  /**
   * 显示操作提示
   * @param {string} type - 提示类型
   * @param {string} message - 提示文本
   */
  function showActionToast(type, message) {
    action_toast_props.is_show = true;

    action_toast_props.type = type;

    action_toast_props.message = message;

    switch (type) {
      case "success":
        action_toast_props.icon_src = ICONS["action_success"];
        break;
      case "error":
        action_toast_props.icon_src = ICONS["action_error"];
        break;
      default:
        action_toast_props.icon_src = ICONS["action_success"];
    }
  }

  /**
   * 将原始考试数据转换为更适合展示的结构
   * @param {ResponseData} raw
   * @returns {ExamData}
   */
  function transformResponseData(raw) {
    const sessions = raw.sessions || [];

    // 格式化考试时间文字，如：试卷1:2025-01-22 09:00-10:00
    const examTimeText = sessions
      .map((session, i) => {
        const start = formatISOString(session.start_time);
        const end = formatISOString(session.end_time);
        const [startDay, startTime] = start.split(" ");
        const [, endTime] = end.split(" ");
        return `试卷${i + 1}:${startDay} ${startTime}-${endTime}`;
      })
      .join("  ");

    // 总应考人数
    const totalExaminees = sessions.reduce(
      (sum, s) => sum + s.scheduled_examinees,
      0,
    );
    const passExaminees = sessions.reduce(
      (sum, s) => sum + s.pass_examinees,
      0,
    );

    // 总分，取每个试卷的分数之和
    const totalScore = sessions.reduce((sum, s) => sum + s.total_score, 0);

    // 平均分：加权计算
    const totalActual = sessions.reduce(
      (sum, s) => sum + s.actual_examinees,
      0,
    );
    const weightedTotalScore = sessions.reduce(
      (sum, s) => sum + s.average_score * s.actual_examinees,
      0,
    );
    const averageScore =
      totalActual === 0
        ? 0
        : parseFloat((weightedTotalScore / totalActual).toFixed(1));

    // 试卷详情
    const papers = sessions.map((s, i) => ({
      id: s.exam_session_id,
      idText: `试卷${i + 1}`,
      name: s.paper_name,
      actualExaminees: s.actual_examinees,
      totalScore: s.total_score,
      averageScore: s.average_score,
      markMode: MARK_MODE_MAP[s.mark_mode] || s.mark_mode,
    }));

    return {
      id: raw.id,
      title: raw.name,
      type: EXAM_TYPE_MAP[raw.type] || raw.type,
      examTimeText,
      totalScore: totalScore,
      averageScore,
      totalExaminees,
      passExaminees,
      submitted: raw.submitted,
      papers,
    };
  }

  /**
   * @description 获取考试信息通过id
   * @param {string} examId - 考试ID
   * @returns {Promise<ExamData|null>} 返回考试数据
   */
  async function fetchExamData(examId) {
    try {
      const response = await fetch(
        `/api/teacher/exam-grade?examID=${examId}&courseID=0&classID=0&page=1&pageSize=10`,
        {
          method: "GET",
          credentials: "include",
        },
      );
      const resp_data = await response.json();
      if (resp_data.status < 0) {
        throw new Error(resp_data.msg);
      }

      /** @type {ResponseData} */
      const data = resp_data.data[0];
      /** @type {ExamData} */
      const examData = transformResponseData(data);
      return examData;
    } catch (error) {
      console.error("获取考试数据失败:", error);
    }
    return null;
  }

  /**
   * 提交成绩
   * @param {number[]} exam_ids - 考试id列表
   */
  async function handleExamSubmitted(exam_ids) {
    let url = `/api/teacher/exam-grades`;

    let body = {
      exam_ids: exam_ids,
    };

    let resp = await fetch(url, {
      method: "PATCH",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });

    let resp_data = await resp.json();

    if (resp.status != 200) {
      showActionToast("error", resp.statusText);

      console.log(resp);
      throw new Error(`Error: ${resp.statusText}, Details: `, resp);
    }

    if (resp_data.status < 0) {
      showActionToast("error", resp_data.msg);

      throw new Error(resp_data.msg);
    } else if (resp_data.status > 0) {
      console.warn(resp_data.msg);
    } else {
      showActionToast("success", "提交成功!");

      console.log(
        `exam ${$state.snapshot(exam_ids).join(",")} are submitted! Details: `,
        resp,
      );
    }

    // 回到列表页
    goto("/teacher/gradeManagement/exam");
  }

  /**
   * 导出成绩
   * @param {number} examID
   * @param {string} examName
   */
  async function handleExportSingleExamineeScore(examID, examName) {
    const res = await fetch(
      `/api/teacher/exam-grade/examinee-grade-list?examID=${examID}&page=-1&pageSize=-1`,
      {
        method: "GET",
        credentials: "include",
      },
    );
    let resp_data = await res.json();
    const status = sget(resp_data, "status", -1);
    const msg = sget(resp_data, "msg", "");
    if (status === -1) {
      console.error("获取考试考生名单失败");
      showActionToast("error", msg);
    } else {
      const data = sget(resp_data, "data", []);
      // 这里获取到之后，再进行导出，等待完成
      if (data == null || data.length === 0) {
        console.error("获取考试考生名单失败");
        showActionToast("error", "获取考试考生名单失败");
      }
      // 这里要获取一次这个名字
      let exportData = {};
      exportData[examID] = examName;
      await exportExamToExcel(data, exportData);
      showActionToast("success", "导出学生成绩成功！");
    }
  }

  onMount(async () => {
    const urlParams = new URLSearchParams(window.location.search);
    examId = urlParams.get("examId");
    if (!examId) {
      console.error("未提供考试ID");
      return;
    } else {
      examData = await fetchExamData(examId);
    }
    isShow = true;
  });
</script>

<Dialog
  bind:isOpen={dialog_props.is_open}
  title={dialog_props.title}
  content={dialog_props.content}
  confirmText={dialog_props.confirm_text}
  cancelText={dialog_props.cancel_text}
  confirmTextBackgroundColor={dialog_props.confirm_text_background_color}
  onConfirm={dialog_props.on_confirm}
  onCancel={dialog_props.on_cancel}
  onClose={dialog_props.on_close}
/>

<ActionToast
  bind:isShow={action_toast_props.is_show}
  type={action_toast_props.type}
  message={action_toast_props.message}
  duration={action_toast_props.duration}
  iconSrc={action_toast_props.icon_src}
/>
{#if isShow}
  <div class="page-container">
    <div class="detail-container">
      <div class="first-row">
        <div class="card card1"><ExamInfo /></div>
        <div class="card card2"><Chart /></div>
      </div>
      <div class="second-row">
        <div class="card card3"><StudentGrade /></div>
      </div>
      <div class="third-row">
        <div class="card card4"><Analysis /></div>
      </div>
    </div>
    <div class="buttons-container">
      <button
        class="export-button"
        onclick={() => handleExportSingleExamineeScore(examId, examData.title)}
        >导出成绩</button
      >
      <button
        class="submit-button"
        onclick={() => {
          dialog_props.is_open = true;

          dialog_props.on_confirm = () => {
            if (examId !== null && examId !== "") {
              handleExamSubmitted([Number(examId)]);
            } else {
              showActionToast("error", "考试ID无效，无法提交成绩");
            }
          };
        }}
        disabled={examData?.submitted}>提交成绩</button
      >
    </div>
  </div>
{/if}

<style lang="scss" scoped>
  .page-container {
    display: flex;
    flex-direction: column;
    height: 100%;
    width: 100%;
    .detail-container {
      display: flex;
      flex-direction: column;
      height: 100%;
      width: 100%;
      background-color: var(--bg-primary);
      gap: 20px;
      overflow: auto;
      padding: 10px;

      .card {
        box-sizing: border-box;
        border: 1px solid #d7d7d7;
        border-radius: var(--border-radius-md);
        padding: 10px;
      }

      .first-row {
        display: flex;
        gap: 10px;
        flex-shrink: 0;

        .card1 {
          flex: 0 0 calc(55% - 5px);
          min-width: 800px;
        }

        .card2 {
          flex: 0 0 calc(45% - 5px);
          min-width: 680px;
        }
      }

      .second-row,
      .third-row {
        .card3,
        .card4 {
          min-width: 1490px;
        }
      }
    }

    .buttons-container {
      display: flex;
      position: fixed;
      bottom: 24px;
      right: 24px;
      z-index: 1000;
      gap: 20px;

      .export-button {
        padding: 10px 20px;
        font-size: 14px;
        color: white;
        background-color: var(--blue);
        border: none;
        border-radius: var(--btn-border-radius);
        cursor: pointer;
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
        transition: background-color 0.3s;
        &:hover {
          opacity: 0.8;
        }
      }
      .submit-button {
        padding: 10px 20px;
        font-size: 14px;
        color: white;
        background-color: var(--green);
        border: none;
        border-radius: var(--btn-border-radius);
        cursor: pointer;
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
        transition: background-color 0.3s;

        &:hover {
          opacity: 0.8;
        }
        &:disabled {
          background-color: var(--gray);
          cursor: not-allowed;
          opacity: 0.6;
        }
      }
    }
  }
</style>
