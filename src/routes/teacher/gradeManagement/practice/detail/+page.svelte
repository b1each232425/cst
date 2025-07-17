<script>
  import PraticeInfo from "./PraticeInfo.svelte";
  import Chart from "./Chart.svelte";
  import StudentGrade from "./StudentGrade.svelte";
  import Analysis from "./Analysis.svelte";
  import { onMount, setContext } from "svelte";
  import { exportPracticeToExcel } from "$lib/excel_export/export_practice_score";
  import { sget } from "$lib/common/api_data";

  /**
   * @typedef {Object} PracticeData
   * @property {number} id - 练习ID
   * @property {string} name - 练习名称
   * @property {number} totalScore - 总分
   * @property {number} averageScore - 平均分
   * @property {number} completedStudents - 作答人数
   * @property {number} passedStudents - 通过人数
   */

  /**
   * @typedef ActionToastProps
   * @property {boolean} is_show -操作提示是否显示
   * @property {string} type -操作提示类型
   * @property {string} message -操作提示文本
   * @property {number} duration -操作提示持续时间
   * @property {string} icon_src -操作提示图标地址
   */

  /**
   * @type {string|null}
   */
  let practiceId = $state("");

  /**
   * @type {PracticeData|null}
   * @description 当前考试数据
   */
  let practiceData = $state(null);

  /**
   * @type {boolean}
   * @description
   * @default false
   */
  let isShow = $state(false);

  const ICONS = {
    action_success: "/paper/action_success.svg",
    action_error: "/paper/action_fail.svg",
  };

  // 设置上下文
  setContext("practice", {
    get practiceId() {
      return practiceId;
    },
    get practiceData() {
      return practiceData;
    },
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
   * @description 获取练习信息通过id
   * @param {string} practiceId - 考试ID
   * @returns {Promise<PracticeData|null>} 返回考试数据
   */
  async function fetchExamData(practiceId) {
    try {
      const response = await fetch(
        `/api/teacher/practice-grade?practiceID=${practiceId}&courseID=0&classID=0&page=1&pageSize=10`,
        {
          method: "GET",
          credentials: "include",
        },
      );
      const resp_data = await response.json();
      if (resp_data.status < 0) {
        throw new Error(resp_data.msg);
      }

      return {
        id: resp_data.data[0].id,
        name: resp_data.data[0].name,
        totalScore: resp_data.data[0].total_score,
        averageScore: resp_data.data[0].average_score,
        completedStudents: resp_data.data[0].completed_students,
        passedStudents: resp_data.data[0].passed_students,
      };
    } catch (error) {
      console.error("获取考试数据失败:", error);
    }
    return null;
  }

  /**
   * 导出成绩
   * @param {number} ID
   * @param {string} Name
   */
  async function handleExportSingleExamineeScore(ID, Name) {
    const res = await fetch(
      `/api/teacher/practice-grade/examinee-grade-list?practiceID=${ID}&page=-1&pageSize=-1`,
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
      exportData[ID] = Name;
      await exportPracticeToExcel(data, exportData);
      showActionToast("success", "导出学生成绩成功！");
    }
  }

  onMount(async () => {
    const urlParams = new URLSearchParams(window.location.search);
    practiceId = urlParams.get("practiceId");
    if (!practiceId) {
      console.error("未提供练习ID");
      return;
    } else {
      practiceData = await fetchExamData(practiceId);
      console.log("获取练习‘数据成功:", practiceData);
    }
    isShow = true;
  });
</script>

{#if isShow}
  <div class="page-container">
    <div class="detail-container">
      <div class="first-row">
        <div class="card card1"><PraticeInfo /></div>
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
        onclick={() =>
          handleExportSingleExamineeScore(practiceId, practiceData.name)}
        >导出成绩</button
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
          min-width: 1480px;
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
    }
  }
</style>
