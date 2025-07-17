<!-- 
 /*
 * @Author: Mayux dbs45412@163.com
 * @Date: 2025-04-06 16:03:00
 * @LastEditors: zdl 1311866870@qq.com
 * @LastEditTime: 2025-07-09 18:17:52
 * @FilePath: \tutorial-platform-fe\src\routes\teacher\gradeManagement\exam\ExamScoreManagementCard.svelte
 * @Description: 考试成绩管理页卡片
 * Copyright (c) 2025 by Mayux, All Rights Reserved. 
 */ 
 -->
<!--                         o8o                 .   
                             `"'               .o8   
 .oooo.o  .ooooo.  oooo d8b oooo  oo.ooooo.  .o888oo 
d88(  "8 d88' `"Y8 `888""8P `888   888' `88b   888   
`"Y88b.  888        888      888   888   888   888   
o.  )88b 888   .o8  888      888   888   888   888 . 
8""888P' `Y8bod8P' d888b    o888o  888bod8P'   "888" 
                                   888               
                                  o888o              
-->
<script>
  // @ts-nocheck

  import Title from "$lib/component/Title.svelte";
  import DropdownBlue from "$lib/component/DropdownBlue.svelte";
  import UneditableTags from "$lib/component/UneditableTags.svelte";
  import SearchInput from "$lib/component/SearchInput.svelte";
  import DropdownGray from "$lib/component/DropdownGray.svelte";
  import Pagination from "$lib/component/Pagination.svelte";
  import DropdownBlueWithSearch from "$lib/component/DropdownBlueWithSearch.svelte";
  import Dialog from "$lib/component/Dialog.svelte";
  import { formatISOString } from "$lib/common/time_utils";
  import ActionToast from "$lib/component/ActionToast.svelte";
  import AwesomeLogPanel from "$lib/component/AwesomeLogPanel.svelte";
  import { sget } from "$lib/common/api_data";
  import { exportExamToExcel } from "$lib/excel_export/export_examinee_score";
  import { goto } from "$app/navigation";

  /**
   * @typedef ExamSessionInfo
   * @property {number} id -考试场次
   * @property {string} paper_name -试卷名称
   * @property {string} start_time -考试开始时间
   * @property {string} end_time -考试结束时间
   * @property {number} total_score -考试总分
   * @property {number} average_score -考试平均分
   * @property {number} scheduled_examinees -计划应考人数
   * @property {number} actual_examinees -实际应考人数
   * @property {number} pass_examinees -考试通过人数
   */

  /**
   * @typedef ExamInfo
   * @property {number} id -考试ID
   * @property {string} name -考试名称
   * @property {string} type -考试类型
   * @property {string} class -考试班级
   * @property {ExamSessionInfo[]} sessions -考试场次
   * @property {boolean} submitted -是否提交
   */

  /**
   * @typedef ExamInfoCache
   * @property {number} select_num -当前选中的考试数量
   * @property {ExamInfo[]} exam_info -考试信息列表
   */

  /**
   * @typedef ResponseData
   * @property {ExamInfo[]} data -考试信息列表
   * @property {number} status -状态码
   * @property {string} msg -状态信息
   * @property {number} row_count -总行数
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

  const EXAM_TYPE_MAP = {
    "00": "平时考试",
    "02": "期末考试",
    "04": "资格证考试",
  };

  const ICONS = {
    action_success: "/paper/action_success.svg",
    action_error: "/paper/action_fail.svg",
  };

  let { is_folded = false } = $props();

  /**
   * 当前选择的考试类型
   * @type {string}
   */
  let current_select_exam_type = $state("");

  /**
   * 当前选择的课程
   * @type {number}
   */
  let current_select_course = $state(0);

  /**
   * 当前选择的班级
   * @type {number}
   */
  let current_select_class = $state(0);

  /**
   * 学习人数
   * @type {number}
   */
  let learners_num = $state(0);

  /**
   * 班级数量
   * @type {number}
   */
  let classes_num = $state(0);

  /**
   * 考试数量
   * @type {number}
   */
  let exams_num = $state(0);

  /**
   * 当前选中的考试数量
   * @type {number}
   */
  let choose_num = $state(0);

  /**
   * 当前是否有选中考试
   * @type {boolean}
   */
  let rows_is_select = $state(false);

  /**
   * 当前页码
   * @type {number}
   */
  let current_page = $state(1);

  /**
   * 每页显示的考试数量
   * @type {number}
   */
  let page_size = $state(10);

  /**
   * 上一次选择的每页考试数量
   * @type {number}
   */
  let last_page_size = $state(10);

  /**
   * 总行数
   * @type {number}
   */
  let total_row_count = $state(0);

  /**
   * 当前页考试信息列表
   * @type {ExamInfo[]}
   */
  let exam_info = $state([]);

  /**
   * 考试信息缓存
   * @type {Record<number, ExamInfoCache>} key:页数, value:考试信息列表
   */
  let exam_info_cache = $state({});

  /**
   * 当前选择的考试, 如: { "123456":"test" }, key:考试id, value: 考试名称
   * @type {Record<string, string>}
   */
  let current_select_exam = $state({});

  /**
   * 当前在搜索框输入的考试名称
   * @type {string}
   */
  let search_input_value = $state("");

  /**
   * 上一次在搜索框输入的考试名称
   */
  let last_search_input_value = $state("");

  /**
   * 当前考试列表搜索栏中选中的提交状态
   * @type {boolean | ""}
   */
  let curr_select_exam_submitted_in_search = $state("");

  /**
   * 考试类型下拉框的选项
   */
  let exam_type_dropdown_maps = $state([
    { value: "", label: "全部" },
    { value: "00", label: "平时考试" },
    // { value: "02", label: "期末考试" },
    { value: "04", label: "资格证考试" },
  ]);

  /**
   * 考试提交状态下拉框的选项
   */
  let exam_submitted_status_dropdown_maps = $state([
    { value: "", label: "全部" },
    { value: true, label: "已提交" },
    { value: false, label: "未提交" },
  ]);

  /**
   * 课程选择下拉框的选项
   */
  let course_choose_dropdown_maps = $state([
    { value: 0, label: "全部" },
    { value: -1, label: "未指定课程" },
  ]);

  /**
   * 班级选择下拉框的选项
   */
  let class_choose_dropdown_maps = $state([
    { value: 0, label: "全部" },
    { value: -1, label: "未指定班级" },
  ]);

  /**
   * 全选状态
   * @type {boolean}
   */
  let select_all = $state(false);

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
   * @type {NodeJS.Timeout}
   */
  let getExamInfoTimeout = null;

  $effect(async () => {
    // console.log("get exam info");

    getExamInfo(current_page, page_size);
  });

  /**
   * 获取考试信息列表
   * @param {number} [page_num] - 当前页码
   * @param {number} [page_size] - 每页显示的考试数量
   * @param {boolean} [updated] - 是否更新考试信息
   */
  async function getExamInfo(page_num = 1, page_size = 20, updated = false) {
    if (typeof page_num !== "number" || page_num < 1) {
      throw new Error("page_num must be a number and greater than 0");
    }

    if (typeof page_size !== "number" || page_size < 1) {
      throw new Error("page_size must be a number and greater than 0");
    }

    if (typeof updated !== "boolean") {
      throw new Error("updated must be a boolean");
    }

    if (last_page_size != page_size) {
      current_page = 1;
      last_page_size = page_size;
      exam_info_cache = {};
      resetExamSelect();
    }

    if (updated) {
      exam_info_cache = {};
      current_page = 1;
      resetExamSelect();
    }

    if (exam_info_cache[page_num]) {
      exam_info = exam_info_cache[page_num].exam_info;
      return;
    }

    let url = `/api/teacher/exam-grade?courseID=${current_select_course}&classID=${current_select_class}&name=${search_input_value}&type=${current_select_exam_type}&submitted=${curr_select_exam_submitted_in_search}&page=${page_num}&pageSize=${page_size}`;

    let resp = await fetch(url, {
      method: "GET",
      credentials: "include",
    });

    if (resp.status != 200) {
      showActionToast("error", resp.statusText);

      console.log(resp);

      throw new Error(`Error: ${resp.statusText}, Details: `, resp);
    }

    /**
     * @type {ResponseData}
     */
    let resp_data = await resp.json();

    if (resp_data.status < 0) {
      throw new Error(resp_data.msg);
    } else if (resp_data.status > 0) {
      console.warn(resp_data.msg);
    }

    let exam_data = resp_data.data;
    if (exam_data == null) {
      exam_data = [];
      exam_info = [];
      total_row_count = 0;
      return;
    }

    for (let exam of exam_data) {
      for (let session of exam.sessions) {
        session.start_time = formatISOString(session.start_time);
        session.end_time = formatISOString(session.end_time);

        session.total_score =
          session.total_score == -1 || session.total_score == null
            ? "−"
            : session.total_score.toFixed(1);

        session.average_score =
          session.average_score == -1 || session.average_score == null
            ? "−"
            : session.average_score.toFixed(1);
      }
    }

    // console.log($state.snapshot(exam_data));

    exam_info = exam_data;

    total_row_count = resp_data.row_count;

    exam_info_cache[page_num] = {
      select_num: 0,
      exam_info: exam_data.copyWithin(),
    };

    console.log(
      `Args: courseID: ${current_select_course}, classID: ${current_select_class}, page_num: ${page_num}, page_size: ${page_size}, updated: ${updated}`,
    );

    // console.log("exam info cache: ",$state.snapshot(exam_info_cache), "\nexam info: ", $state.snapshot(exam_info));
  }

  /**
   * 延迟获取考试信息
   * @param {number} [page_num] - 当前页码
   * @param {number} [page_size] - 每页显示的考试数量
   * @param {boolean} updated 是否更新考试信息
   */
  function getExamInfoWithDelay(page_num, page_size, updated = false) {
    if (getExamInfoTimeout) {
      clearTimeout(getExamInfoTimeout);
    }

    getExamInfoTimeout = setTimeout(() => {
      console.log("get exam info with delay, update:", updated);

      getExamInfo(page_num, page_size, updated);

      clearTimeout(getExamInfoTimeout);

      getExamInfoTimeout = null;
    }, 500);
  }

  /**
   * 当前页全选处理函数
   * @param {boolean} is_select_all
   */
  function handleCurrentPageSelectAll(is_select_all) {
    if (!is_select_all) {
      for (let exam of exam_info) {
        delete current_select_exam[exam.id];
        choose_num--;
      }

      if (choose_num == 0) {
        rows_is_select = false;
      }

      return;
    }

    rows_is_select = true;

    exam_info_cache[current_page].select_num = exam_info.length;

    for (let exam of exam_info) {
      if (current_select_exam[exam.id]) {
        continue;
      }

      current_select_exam[exam.id] = exam.name;
      choose_num++;
    }
  }

  /**
   * 选中考试处理函数
   * @param {number} id - 考试id
   * @param {string} name - 考试名称
   */
  function handleSelectExam(id, name) {
    if (current_select_exam[id]) {
      delete current_select_exam[id];

      choose_num = choose_num == 0 ? choose_num : choose_num - 1;

      let select_num = exam_info_cache[current_page].select_num;

      exam_info_cache[current_page].select_num =
        select_num == 0 ? select_num : select_num - 1;
    } else {
      current_select_exam[id] = name;

      choose_num = choose_num + 1;

      let select_num = exam_info_cache[current_page].select_num;

      exam_info_cache[current_page].select_num =
        select_num == exam_info.length ? select_num : select_num + 1;
    }

    // console.log($state.snapshot(current_select_exam));

    // console.log(
    // 	$state.snapshot(exam_info_cache[current_page]),
    // 	$state.snapshot(exam_info).length
    // );

    switch (exam_info_cache[current_page].select_num) {
      case 0:
        rows_is_select = false;
        select_all = false;
        break;

      case exam_info.length:
        rows_is_select = true;
        select_all = true;
        break;

      default:
        rows_is_select = true;
        select_all = false;
        break;
    }
  }

  /**
   * 重置选择
   */
  function resetExamSelect() {
    current_select_exam = {};

    select_all = false;

    rows_is_select = false;

    choose_num = 0;
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

    await getExamInfo(current_page, page_size, true);
  }
  /**
   * @param {Record<string,number>} SelectexamID - 考试ID数组
   * @description 批量导出多场考试的学生成绩
   *
   */
  async function handleExportExamineeScore(SelectexamID) {
    let examIDString = Object.keys(SelectexamID).join(",");
    const res = await fetch(
      `/api/teacher/exam-grade/examinee-grade-list?examID=${examIDString}&page=-1&pageSize=-1`,
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

      const sessionInfoMap = mapSessionsBySelectedKeys(exam_info,SelectexamID)
      await exportExamToExcel(data, SelectexamID,sessionInfoMap);
      showActionToast("success", "导出学生成绩成功！");
    }
  }

    /**
   * @param {ExamInfo} exam - 考试ID数组
   * @description  导出一场考试学生成绩
   *
   */
async function handleExportSingleExamineeScore(exam){
   const examID = exam.id
   const examName = exam.name
   const res = await fetch(
      `/api/teacher/exam-grade/examinee-grade-list?examID=${examID}&page=-1&pageSize=-1`,
      {
        method: "GET",
        credentials: "include",
      }
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
      let exportData = {}
      exportData[examID] = examName
      let sessionMap = {}
      sessionMap[examID] = exam.sessions
      await exportExamToExcel(data, exportData,sessionMap);
      showActionToast("success", "导出学生成绩成功！");
    }

}
/**
 * 生成以 SelectexamID 的键为键、对应 ExamInfo 的 sessions 为值的 Record
 * @param {ExamInfo[]} exams - 考试信息数组
 * @param {Record<string, number>} selectExamId - 考试ID映射对象
 * @returns {Record<string, ExamSessionInfo[]>}
 */
function mapSessionsBySelectedKeys(exams, selectExamId) {
  // 1. 提取 SelectexamID 的所有键（考试ID）
  const selectedKeys = Object.keys(selectExamId); // [1,6](@ref)
  
  // 2. 构建键集合（用于高效查找）
  const keySet = new Set(selectedKeys); // [6](@ref)
  
  // 3. 筛选出 id 在键集合中的 ExamInfo 对象
  const matchedExams = exams.filter(exam => 
    keySet.has(String(exam.id)) // 统一转换为字符串比较 [5,6](@ref)
  );
  
  // 4. 生成目标 Record
  const result = {};
  matchedExams.forEach(exam => {
    const key = String(exam.id); // 键需与 SelectexamID 的键类型一致（string）
    result[key] = exam.sessions || []; // 空数组兜底 [2](@ref)
  });
  return result;
}

  /**
   * 处理分页选择函数
   * @param {number} page - 当前页码
   */
  async function handlePageChoose(page) {
    current_page = page;

    select_all = false;

    if (!exam_info_cache[page]) {
      return;
    }

    let exam_info = exam_info_cache[page].exam_info;

    for (let exam of exam_info) {
      if (current_select_exam[exam.id]) {
        select_all = true;
        continue;
      }

      select_all = false;
    }
  }

  /**
   * 处理页面变化函数
   * @param {boolean} is_next
   */
  function handlePageChange(is_next) {
    if (is_next) {
      current_page =
        current_page == Math.ceil(total_row_count / page_size)
          ? current_page
          : current_page + 1;
    } else {
      current_page = current_page == 1 ? current_page : current_page - 1;
    }

    handlePageChoose(current_page);
  }

  /**
   * 处理每页考试数量选择函数
   * @param {number} value
   */
  function handlePageSizeChange(value) {
    page_size = value;
  }

  /**
   * 处理考试课程选择函数
   * @param {number} value
   */
  // function handleCourseChange(value) {
  // 	current_select_course = value;
  // 	getExamInfoWithDelay(
  // 		current_page,
  // 		page_size,
  // 		true
  // 	);
  // }

  /**
   * 处理考试班级选择函数
   * @param {number} value
   */
  function handleClassChange(value) {
    current_select_class = value;
    getExamInfoWithDelay(current_page, page_size, true);
  }

  /**
   * 处理考试搜素函数
   * @param {string} value
   */
  function handleExamSearch(value) {
    last_search_input_value = search_input_value;
    search_input_value = value;
    getExamInfoWithDelay(current_page, page_size, true);
  }

  /**
   * 处理考试类型筛选函数
   * @param {string} value
   */
  function handleExamTypeFilter(value) {
    current_select_exam_type = value;
    getExamInfoWithDelay(current_page, page_size, true);
  }

  /**
   * 处理考试提交状态筛选函数
   * @param {boolean | ""} value
   */
  function handleExamSubmittedFilter(value) {
    curr_select_exam_submitted_in_search = value;
    getExamInfoWithDelay(current_page, page_size, true);
  }

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
   * 获取考试信息用于测试
   */
  export function getForTesting() {
    return {
      methods: {
        getExamInfo,
        getExamInfoWithDelay,
        handleSelectExam,
        handleCurrentPageSelectAll,
        handlePageChoose,
        handlePageChange,
        handlePageSizeChange,
        handleExamSubmitted,
        showActionToast,
        resetExamSelect,
        handleCourseChange,
        handleClassChange,
        handleExamSearch,
        handleExamTypeFilter,
        handleExamSubmittedFilter,
      },
      state: {
        exam_info: $state.snapshot(exam_info),
        exam_info_cache: $state.snapshot(exam_info_cache),
        current_select_exam: $state.snapshot(current_select_exam),
        total_row_count: $state.snapshot(total_row_count),
        current_select_exam_type: $state.snapshot(current_select_exam_type),
        current_select_course: $state.snapshot(current_select_course),
        current_select_class: $state.snapshot(current_select_class),
      },
    };
  }

      //---------------------------------------操作日志面板--------------------------------------
    /**
     * @description 显示操作日志
     */
    async function fetchGradeLogs(page = 1, page_size = 10) {
        console.log(page, page_size);
        // 构建queryParams
        try {
            const res = await fetch(
                `/api/teacher/exam-grade/log?page=${page}&pageSize=${page_size}`,
                {
                    method: "GET",
                    credentials: "include",
                },
            );
            console.log(res);
            if (!res.ok) {
                const responseMgs = res.text();
                console.error("获取操作日志失败", responseMgs);
                actionToast.show("error", "获取操作日志失败");
                throw new Error("获取操作日志失败");
            }
            const result = await res.json();
            console.log(result);
            if (result.status !== 0) {
                console.error("获取操作日志失败", result.msg);
                actionToast.show("error", "获取操作日志失败");
                throw new Error("获取操作日志失败");
            }
            return {
                data: result.data || [],
                total: result.rowCount || 0,
            };
        } catch (error) {
            console.error("获取操作日志失败:", error);
            actionToast.show("error", "获取操作日志失败");
            throw new Error("获取操作日志失败");
        }
    }

    /**
     */
    async function showGradeLogs() {
        try {
            const fetchFunc = (/** @type {number | undefined} */ page, /** @type {number | undefined} */ page_size) =>
                fetchGradeLogs(page, page_size);
            await operationLogPanel.showLogPanelWithPagination(fetchFunc);
        } catch (error) {
            console.error("显示操作日志失败:", error);
        }
    }

    /**
     * @type {AwesomeLogPanel}
     */
    let operationLogPanel;

  // /**
  //  * @type {OperationLogPanel}
  //  */
  // let operationLogPanel;

  // /**
  //  * @description 显示操作日志
  //  * @param {number} [page=1] - 页码
  //  * @param {number} [page_size=10] - 每页显示的日志数量
  //  */
  // async function showGradeLogs(page = 1, page_size = 10) {
  //   let res = await fetch(
  //     `/api/teacher/exam-grade/log?page=${page}&pageSize=${page_size}`,
  //     {
  //       method: "GET",
  //       credentials: "include",
  //     },
  //   );
  //   if (!res.ok) {
  //     const responseMgs = res.text();
  //     console.error("获取操作日志失败", responseMgs);
  //     actionToast.show("error", "获取操作日志失败");
  //     return;
  //   }
  //   const result = await res.json();
  //   if (result.status !== 0) {
  //     console.error("获取操作日志失败", result.msg);
  //     actionToast.show("error", "获取操作日志失败");
  //     return;
  //   }
  //   result.data = result.data.map((log) => {
  //     log.change_content = [log.change_content];
  //     if (log.create_time !== null && log.create_time !== undefined) {
  //       log.create_time = formatISOString(log.create_time);
  //       log.update_time = log.create_time;
  //     }
  //     return log;
  //   });
  //   let logs = result.data;
  //   operationLogPanel.showLogPanel(logs);
  // }
</script>

<!-- 
oooo            .                     oooo  
`888          .o8                     `888  
 888 .oo.   .o888oo ooo. .oo.  .oo.    888  
 888P"Y88b    888   `888P"Y88bP"Y88b   888  
 888   888    888    888   888   888   888  
 888   888    888 .  888   888   888   888  
o888o o888o   "888" o888o o888o o888o o888o                                                     
-->

{#snippet tableHead()}
  <tr class="exam-list-head">
    <th class="exam-select">
      <button
        class="square-container {select_all ? 'checked' : ''}"
        onclick={() => {
          select_all = !select_all;
          handleCurrentPageSelectAll(select_all);
        }}
      >
        {#if select_all}
          <div class="check-square"></div>
        {/if}
      </button>
    </th>
    <th class="exam-name">名称</th>
    <th class="exam-type">类型</th>
    <!-- <th class="exam-class">班级</th> -->
    <th class="exam-sessions">场次</th>
    <th class="exam-time">时间</th>
    <th class="exam-total-score">总分</th>
    <th class="exam-average-score">平均分</th>
    <th class="exam-scheduled-examinees">应考人数</th>
    <th class="exam-actual-examinees">实考人数</th>
    <th class="exam-pass-examinees">通过人数</th>
    <th class="exam-submitted">提交状态</th>
    <th class="operation">操作</th>
  </tr>
{/snippet}

{#snippet tableRow(
  /**
   * 考试信息
   * @type {ExamInfo}
   */
  exam,

  /**
   * 当前行索引
   * @type {number}
   */
  index,
)}
  <tr class="exam-list-row" class:alter={index % 2 == 1}>
    <!-- 复选框 -->
    <td class="exam-select">
      <button
        class="square-container {current_select_exam[exam.id] != null
          ? 'checked'
          : ''}"
        onclick={() => {
          handleSelectExam(exam.id, exam.name);
        }}
      >
        {#if current_select_exam[exam.id] != null}
          <div class="check-square"></div>
        {/if}
      </button>
    </td>

    <!-- 考试名称 -->
    <td class="exam-name" title={exam.name == "" ? "-" : exam.name}>
      <span>{exam.name == "" ? "-" : exam.name}</span>
    </td>

    <!-- 考试类型 -->
    <td class="exam-type" title={exam.type}>
      <span>{EXAM_TYPE_MAP[exam.type]}</span>
    </td>

    <!-- 考试班级 -->
    <!-- <td class="exam-class" title={exam.class}>
			<span>
				{exam.class == null || exam.class == "" ? "−" : exam.class}
			</span>
		</td> -->

    <!-- 考试场次 -->
    <td class="exam-sessions">
      {#each exam.sessions as session}
        <div class="session-row">
          <span title={session.paper_name == "" ? "−" : session.paper_name}>
            {session.paper_name == "" ? "−" : session.paper_name}
          </span>
        </div>
      {/each}
    </td>

    <!-- 考试场次时间 -->
    <td class="exam-time">
      {#each exam.sessions as session}
        <div class="session-row">
          <span title={session.start_time + " ~ " + session.end_time}>
            {session.start_time + " ~ " + session.end_time}
          </span>
        </div>
      {/each}
    </td>

    <!-- 考试总分 -->
    <td class="exam-total-score">
      {#each exam.sessions as session, index}
        <div class="session-row">
          <span class="score-text" title={session.total_score}>
            {session.total_score == -1 || session.total_score == null
              ? "−"
              : session.total_score}
          </span>
        </div>
      {/each}
    </td>

    <!-- 考试平均分 -->
    <td class="exam-average-score">
      {#each exam.sessions as session}
        <div class="session-row">
          <span class="score-text" title={session.average_score}>
            {session.average_score == -1 || session.average_score == null
              ? "−"
              : session.average_score}
          </span>
        </div>
      {/each}
    </td>

    <!-- 应考人数 -->
    <td class="exam-scheduled-examinees">
      {#each exam.sessions as session}
        <div class="session-row">
          <span>
            {session.scheduled_examinees == -1 ||
            session.scheduled_examinees == null
              ? "−"
              : session.scheduled_examinees}
          </span>
        </div>
      {/each}
    </td>

    <!-- 实考人数 -->
    <td class="exam-actual-examinees">
      {#each exam.sessions as session}
        <div class="session-row">
          <span>
            {session.actual_examinees == -1 || session.actual_examinees == null
              ? "−"
              : session.actual_examinees}
          </span>
        </div>
      {/each}
    </td>

    <!-- 通过人数 -->
    <td class="exam-pass-examinees">
      {#each exam.sessions as session}
        <div class="session-row">
          <span>
            {session.pass_examinees == -1 || session.pass_examinees == null
              ? "−"
              : session.pass_examinees}
          </span>
        </div>
      {/each}
    </td>

    <!-- 提交状态 -->
    <td class="exam-submitted" class:submitted={exam.submitted}>
      <span>
        {exam.submitted ? "已提交" : "未提交"}
      </span>
    </td>

    <!-- 操作 -->
    <td class="operation">
      <button
        class="details-btn"
        onclick={() =>
          goto(
            `/teacher/gradeManagement/exam/detail?examId=${encodeURIComponent(exam.id)}`,
          )}
      >
        详情
      </button>
      <button class="export-btn"
          onclick={async () => {
              await handleExportSingleExamineeScore(exam)
          }}
        > 导出 </button>
      {#if !exam.submitted}
        <button
          class="submit-btn"
          onclick={() => {
            dialog_props.is_open = true;

            dialog_props.on_confirm = () => {
              handleExamSubmitted([exam.id]);
            };
          }}
        >
          提交
        </button>
      {/if}
    </td>
  </tr>
{/snippet}

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

<div class="container {is_folded ? 'fold' : 'unfold'}">
  <!-- <div class="card {is_folded ? 'fold' : 'unfold'}"> -->
  <Title title="考试成绩管理" />

  <!--表格的搜索、筛选部分-->
  <div class="table-action-bar">
    <div class="search-group">
      <span class="filter_hint_text">考试类别</span>
      <div class="gray-dropdown-container">
        <DropdownGray
          options={exam_type_dropdown_maps}
          selected={current_select_exam_type}
          selectOptionFunc={(/**@type {string}*/ value) => {
            handleExamTypeFilter(value);
          }}
        />
      </div>

      <div class="search-container">
        <SearchInput
          purpose_text={"搜索考试"}
          place_holder="请输入考试名称"
          onSearchFunc={(/**@type {string}*/ value) => {
            handleExamSearch(value);
          }}
        />
      </div>
      <span class="filter_hint_text">提交状态</span>
      <div class="gray-dropdown-container">
        <DropdownGray
          options={exam_submitted_status_dropdown_maps}
          selected={curr_select_exam_submitted_in_search}
          selectOptionFunc={(/**@type {boolean | ""}*/ value) => {
            handleExamSubmittedFilter(value);
          }}
        />
      </div>
    </div>
    <div class="table-action-group">
      <span class="choose_num_text1">当前已选中</span>
      <span class="choose_num">{choose_num}</span>
      <span class="choose_num_text2">项</span>
      <button
        class={rows_is_select
          ? "batch-export-button"
          : "batch-export-button-disabled"}
        onclick={async () => {
          await handleExportExamineeScore(current_select_exam);
        }}
        disabled={!rows_is_select}>批量导出</button
      >
      <button
        class={rows_is_select
          ? "batch-submit-button"
          : "batch-submit-button-disabled"}
        onclick={() => {
          dialog_props.is_open = true;
          dialog_props.on_confirm = () => {
            let exam_ids = Object.keys(current_select_exam).map((key) => {
              return parseInt(key);
            });

            handleExamSubmitted(exam_ids);
          };
        }}
        disabled={!rows_is_select}>批量提交</button
      >

      <button
        class="log-button"
        onclick={() => {
          showGradeLogs();
        }}
      >
        查看日志
      </button>
    </div>
  </div>

  <!--基础信息面板（考试类型选择、课程选择、班级选择）-->
  <!-- <div class="form-panel"> -->

  <!-- <div class="form-panel-group">  -->
  <!-- 考试类型选择 -->
  <!-- <div class="blue-dropdown-container">
					<span class="filter_hint_text">考试类别</span>
					<DropdownBlue
						options={exam_type_dropdown_maps}
						selected={current_select_exam_type}
						selectOptionFunc={(/**@type {string}*/ value) => {
							handleExamTypeFilter(value);
						}}
					/>
				</div> -->
  <!-- </div> -->

  <!-- <div class="form-panel-group">  -->
  <!-- 课程选择 -->
  <!-- 后续对接课程 -->
  <!-- {#if current_select_exam_type != "" && current_select_exam_type != "04"}
					<div class="blue-dropdown-container">
						<span class="filter_hint_text">课程选择</span>
						<DropdownBlueWithSearch
							options={course_choose_dropdown_maps}
							selected={current_select_course}
							search_place_holder="输入课程名搜索课程"
							selectOptionFunc={(/**@type {number}*/ value) => {
								handleCourseChange(value);
							}}
						/>
					</div>
				{/if} -->

  <!-- 班级选择 -->
  <!-- {#if current_select_course != 0 && current_select_course != -1}
					<div class="blue-dropdown-container">
						<span class="filter_hint_text">班级选择</span>
						<DropdownBlueWithSearch
							options={class_choose_dropdown_maps}
							selected={current_select_class}
							search_place_holder="输入班级名搜索班级"
							selectOptionFunc={(/**@type {number}*/ value) => {
								handleClassChange(value);
							}}
						/>
					</div>
				{/if} -->
  <!-- </div> -->

  <!-- {#if current_select_course != 0 && current_select_course != -1} -->
  <!-- <div class="form-panel-group"> -->
  <!-- 学习人数 -->
  <!-- <div class="blue-dropdown-container">
						<span class="filter_hint_text">学习人数</span>
						<span class="num-text">{learners_num}</span>
					</div> -->

  <!-- 班级数量 -->
  <!-- <div class="blue-dropdown-container">
						<span class="filter_hint_text">班级数量</span>
						<span class="num-text">{classes_num}</span>
					</div> -->
  <!-- </div> -->

  <!-- <div class="form-panel-group"> -->
  <!-- 课程标签 -->
  <!-- <div class="blue-dropdown-container">
						<span class="filter_hint_text">课程标签</span>
						<div class="course-tags">
							<UneditableTags />
						</div>
					</div> -->

  <!-- 考试数量 -->
  <!-- <div class="blue-dropdown-container">
						<span class="filter_hint_text">考试数量</span>
						<span class="num-text">{exams_num}</span>
					</div> -->
  <!-- </div> -->
  <!-- {/if} -->
  <!-- </div> -->

  <!--表格部分-->
  <div class="table-container">
    <table>
      <thead>
        {@render tableHead()}
      </thead>

      <tbody>
        {#each exam_info as exam, index}
          {@render tableRow(exam, index)}
        {/each}
      </tbody>
    </table>

    <div class="pagination-container">
      <Pagination
        current_page_num={current_page}
        max_show_page_num={page_size}
        total_data_num={total_row_count}
        total_page_num={Math.ceil(total_row_count / page_size)}
        expand_direction="up"
        selectOptionFunc={(value) => {
          handlePageSizeChange(value);
        }}
        onPageChooseFunc={(value) => {
          handlePageChoose(value);
        }}
        onPageChangeFunc={(is_next) => {
          handlePageChange(is_next);
        }}
      />
    </div>
  </div>
  <!-- </div> -->
</div>

<AwesomeLogPanel bind:this={operationLogPanel} />

<!-- 
             .               oooo            
           .o8               `888            
 .oooo.o .o888oo oooo    ooo  888   .ooooo.  
d88(  "8   888    `88.  .8'   888  d88' `88b 
`"Y88b.    888     `88..8'    888  888ooo888 
o.  )88b   888 .    `888'     888  888    .o 
8""888P'   "888"     .8'     o888o `Y8bod8P' 
                 .o..P'                      
                 `Y8P'                       
                       
 -->
<style lang="scss" scoped>
  $container-width: 100%;
  $container-height: 100%;
  $card-border: 1px solid #d7d7d7;
  $card-border-radius: 10px;
  $card-min-width: 900px;
  $dropdown-height: 36px;
  $content-width: 333px;
  $table-action-bar-padding: 16px 0 0 33px;

  /* 定义不同缩放时的适配宽度 */
  $content-width-state1: 260px;
  $content-width-state2: 200px;

  .card {
    background-color: white;
  }

  .container {
    display: flex;
    flex-direction: column;
    position: relative;
    width: $container-width;
    height: $container-height;
    background-color: var(--text-white);
  }
  .form-panel {
    display: flex;
    position: relative;
    max-width: 1800px;
    padding: 30px 10% 0px 0px;
    flex-wrap: wrap;
    height: max-content;
    box-sizing: border-box;

    .form-panel-group {
      max-width: 100%;
      margin-bottom: 20px;
    }

    span {
      min-width: fit-content;
      height: fit-content;
      text-align: center;
      margin: 0 0 0 22px;
    }

    .num-text {
      margin: 0 10px;
    }

    .course-tags {
      padding-top: 10px;
      align-self: flex-start;
    }

    .blue-dropdown-container {
      display: flex;
      justify-content: flex-start;
      align-items: center;
      min-width: 116px;
      width: 116px;
      height: 32px;
    }
  }

  .form-panel-group,
  .table-action-bar,
  .search-group,
  .table-action-group {
    display: flex;
    width: fit-content;
  }

  .card {
    display: flex;
    box-sizing: border-box;
    flex-direction: column;
    border-radius: $card-border-radius;
    border: $card-border;
    min-width: $card-min-width;
    width: calc(100% - 2.6%);
    margin: 12px 1.6% 12px 1%;
  }

  .big-title {
    display: flex;
    align-items: center;
    height: 60px;
    min-height: 60px;
    padding-left: 32px;
  }

  .big-title-icon {
    width: 7px;
    height: 24px;
    background-color: #0052d9;
  }

  .big-title-text {
    font-size: 20px;
    font-weight: bold;
    padding-left: 2px;
  }

  .blue-dropdown-container {
    display: flex;

    min-width: $content-width;
    min-height: $dropdown-height;
    width: $content-width;
    height: $dropdown-height;
  }

  .filter_hint_text,
  .choose_num_text1,
  .choose_num_text2 {
    font-size: 14px;
    min-width: fit-content;
  }

  .choose_num {
    display: flex;
    justify-content: center;
    font-size: 16px;
    color: #0052d9;
    min-width: 20px;
  }

  .form-panel-group,
  .form-panel-group {
    height: 36px;
  }

  .form-panel-group,
  .search-group,
  .table-action-group,
  .exam-list-text,
  .table-action-bar {
    align-items: center;
  }

  .exam-list-text {
    display: flex;
    font-size: 16px;
    font-weight: bold;
    padding-left: 39px;
    height: 40px;
  }

  .table-action-bar {
    padding: $table-action-bar-padding;
    flex-wrap: wrap;
    gap: 10px;
  }

  .filter_hint_text {
    color: rgb(0, 0, 0, 0.6);
    padding: 0 9px 0 10px;
    min-width: 56px;
  }

  .gray-dropdown-container {
    min-width: 116px;
    width: 116px;
    height: 32px;
  }

  .table-action-group {
    padding: 0 20px 0 0;
  }

  .search-group {
    padding-right: 10px;

    .gray-dropdown-container {
      display: flex;
      justify-content: flex-start;
      align-items: center;
      min-width: 110px;
      width: 110px;
      height: 32px;
      margin-right: 10px;
    }

    .search-container {
      min-width: 250px;
      width: 250px;
    }
  }

  .choose_num_text2 {
    padding: 0 8px 0 0;
  }

  .choose_num_text1,
  .choose_num_text2 {
    color: #555555;
  }

  .batch-export-button {
    width: 84px;
    height: 32px;
    min-width: 84px;
    border: none;
    border-radius: 3px;
    color: white;
    background-color: #0052d9;
    font-size: 14px;
    cursor: pointer;
  }

  .batch-export-button-disabled {
    width: 84px;
    height: 32px;
    min-width: 84px;
    border: none;
    border-radius: 3px;
    color: white;
    background-color: #bbd3fb;
    font-size: 14px;
  }

  .batch-submit-button {
    width: 84px;
    height: 32px;
    min-width: 84px;
    border: none;
    border-radius: 3px;
    color: white;
    background-color: #067945;
    font-size: 14px;
    margin-left: 18px;
    cursor: pointer;
  }

  .batch-submit-button-disabled {
    width: 88px;
    height: 32px;
    min-width: 88px;
    border: none;
    border-radius: 3px;
    color: white;
    background-color: #85dbbe;
    font-size: 14px;
    margin-left: 18px;
  }

  .log-button {
    width: 88px;
    height: 32px;
    min-width: 88px;
    border: none;
    border-radius: 3px;
    color: white;
    background-color: #0052d9;
    font-size: 14px;
    cursor: pointer;
    margin-left: 18px;
  }

  .table-container {
    position: relative;
    display: flex;
    flex-direction: column;
    padding: 28px 37px 100px 37px;
    border-collapse: separate;
    border-spacing: 0;
    background: #fff;
    font-size: 15px;
  }

  .table-container thead,
  .table-container tbody {
    display: flex;
    flex-direction: column;
    width: 100%;

    tr {
      display: flex;
      width: 100%;
      height: 64px;
      min-height: fit-content;
      justify-content: space-between;
      align-items: center;
      box-sizing: border-box;
      padding: 0 15px 0 15px;
    }

    .exam-name,
    .exam-time {
      width: 16%;
    }

    .exam-sessions {
      width: 15%;
    }

    .exam-total-score,
    .exam-average-score,
    .exam-scheduled-examinees,
    .exam-actual-examinees,
    .exam-pass-examinees,
    .exam-submitted {
      width: 8.5%;
    }

    .exam-type {
      width: 8.5%;
    }

    .exam-class,
    .operation {
      width: 14%;
    }
  }

  .table-container thead {
    z-index: 1;
    background-color: var(--text-white);
    font-size: 14px;
    font-weight: normal;
    color: rgb(0, 0, 0, 0.3);
    border: none;
    text-align: center;
    th {
      font-family: "Arial", sans-serif;
      box-sizing: border-box;
      padding: 0 4px 0 4px;
      background-color: transparent;
      font-size: 14px;
      font-weight: normal;
      color: rgb(0, 0, 0, 0.3);
    }
  }

  .table-container tbody {
    tr td {
      color: #3d3d3d;
      min-height: fit-content;
      font-size: 14px;
      font-weight: 400;
      font-family: "Arial", sans-serif;
      box-sizing: border-box;
      text-align: center;
      padding: 0 4px 0 4px;
      background-color: transparent;
    }

    .exam-list-row {
      border-bottom: 1px solid #e0e0e0;
    }

    .session-row {
      display: flex;
      justify-content: center;
      align-items: center;
      width: 100%;
      margin: 4px 0;
      min-height: 50px;

      span {
        display: -webkit-box;
        height: fit-content;
        max-height: 50px;
        overflow: hidden;
        text-overflow: ellipsis;
        -webkit-line-clamp: 2;
        -webkit-box-orient: vertical;
      }
    }

    .exam-name,
    .exam-time,
    .exam-total-score,
    .exam-average-score,
    .exam-sessions,
    .exam-scheduled-examinees,
    .exam-actual-examinees,
    .exam-pass-examinees {
      display: flex;
      flex-direction: column;
      justify-content: center;
      align-items: center;
      height: 100%;
      box-sizing: border-box;
      overflow: hidden;
    }

    .exam-total-score,
    .exam-average-score {
      .score-text {
        display: block;
        width: 100%;
      }
    }

    .exam-name {
      span {
        display: block;
        max-width: 100%;
        height: fit-content;
        text-overflow: ellipsis;
        overflow: hidden;
        white-space: nowrap;
      }
    }

    .exam-submitted {
      color: #c9353f;

      &.submitted {
        color: #00a870;
      }
    }

    .operation button {
      border: none;
      background-color: transparent;
      margin: 1px;
      padding: 0;
      box-sizing: border-box;
      cursor: pointer;
    }

    .operation .details-btn,
    .operation .export-btn {
      color: #0052d9;
    }

    .operation .submit-btn {
      color: #00a870;
    }
  }

  .square-container {
    background-color: white;
    display: flex;
    justify-content: center;
    align-items: center;
    cursor: pointer;
    border: 1px solid #919191;
    border-radius: 3px;
    padding: 0 0 0 0;
    width: 16px;
    height: 16px;
  }

  .square-container:hover {
    background-color: #e0e0e0;
    border-color: #aaa;
  }

  .check-square {
    width: 11px;
    height: 11px;
    background-color: #165dff;
  }

  .square-container.checked .check-square {
    opacity: 1;
  }

  .pagination-container {
    position: absolute;
    right: 0;
    bottom: 35px;
    width: fit-content;
    justify-self: right;
    padding: 57px 0 0 0;
  }

  @media (max-width: 1400px) {
    .blue-dropdown-container,
    .search-container {
      min-width: 230px;
      width: 230px;
    }
  }

  @media (max-width: 1200px) {
    .blue-dropdown-container,
    .search-container {
      min-width: 230px;
      width: 230px;
    }
  }
</style>
