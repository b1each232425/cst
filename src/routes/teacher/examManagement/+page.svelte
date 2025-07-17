<!-- 
 /*
 * @Author: git config Mayux && 1243805308@qq.com
 * @Date: 2025-04-09 21:03:58
 * @LastEditors: Mayux && 1243805308@qq.com
 * @LastEditTime: 2025-07-08 15:37:20
 * @FilePath: \tutorial-platform-fe\src\routes\teacher\examManagement\+page.svelte
 * @Description: 考试管理页
 * @Copyright: Copyright (c) 2025 by Mayux, All Rights Reserved. 
 */ 
 -->
<script>
    import DatePicker from "$lib/component/DatePicker/DatePicker.svelte";
    import Pagination from "$lib/component/Pagination.svelte";
    import DropdownGray from "$lib/component/DropdownGray.svelte";
    import SearchInput from "$lib/component/SearchInput.svelte";
    import { onDestroy, onMount } from "svelte";
    import {
        exportToExcel,
        exportToExcelOfflineExam,
    } from "$lib/excel_export/export_examinee_info";
    import Dialog from "$lib/component/Dialog.svelte";
    import ActionToast from "$lib/component/ActionToast.svelte";
    import { goto } from "$app/navigation";
    import { exportToInvigilatorExcel } from "$lib/excel_export/export_invigilator_info";
    import ExamRoomsAndInvigilatorSelectionPanel from "./examList/ExamRoomsAndInvigilatorSelectionPanel.svelte";
    import ExamineeSelectionPanel from "./examList/ExamineeSelectionPanel.svelte";
    import Title from "$lib/component/Title.svelte";
    import AwesomeLogPanel from "$lib/component/AwesomeLogPanel.svelte";
    import ReviewerSelectionPanel from "./examList/ReviewerSelectionPanel.svelte";
    import InvigilationSessionPanel from "./InvigilationSessionPanel.svelte";

    const SORT_ICON_ROUTE = [
        "/exam_list/default_sort.svg",
        "/exam_list/ascending.svg",
        "/exam_list/descending.svg",
    ];

    // 映射关系
    const TypeMap = {
        "00": "平时考试",
        "02": "期末成绩考试",
        "04": "资格证考试",
    };

    const MethodMap = {
        "00": "线上考试",
        "02": "线下考试",
    };

    const StateMap = {
        "00": "未发布",
        "02": "待开始",
        "04": "进行中",
        "08": "已结束",
        "10": "已归档",
        "12": "考试异常",
    };

    const DeliveryStateMap = {
        "00": "待下发",
        "02": "下发中",
        "04": "已下发",
        "06": "下发失败",
        "08": "待更新",
        "10": "待同步",
        "12": "已同步",
        "14": "待发送",
        "16": "发送中",
    };

    const DeliveryStateInfoMap = {
        "00": `请在考试开始时间至少前1小时点击"下发考卷"按钮，将考卷下发至相应的考点`,
        "02": "考卷正在下发，请稍后刷新页面查看最新状态",
        "06": "下发失败",
        "08": "考试内容已更新，请重新下发考卷",
        "10": "等待考点服务器同步考试数据",
        "12": "已同步",
        "14": "等待考点服务器考试数据",
        "16": "考卷正在发送",
    };

    const DeliveryStatusClassMap = {
        "00": "pending", // 待下发
        "02": "distributing", // 下发中
        "04": "distributed", // 已下发
        "06": "failed", // 下发失败
        "08": "pending-update", // 待更新
        "10": "pending-sync", // 待同步
        "12": "synced", // 已同步
        "14": "pending-sync", // 待发送
        "16": "pending-sync" // 发送中
    };

    const StateClassMap = {
        "00": "unpublished",
        "02": "to-start",
        "04": "on-going",
        "08": "ended",
        "10": "archived",
        "12": "error",
    };

    let exam_list = $state([]);

    // 排序状态：0 - 默认，1 - 升序，2 - 降序
    let exam_time_sort_state = $state(0);
    let exam_duration_sort_state = $state(0);

    /**
     * @typedef {Object} SearchParams
     * @property {number} page - 页码
     * @property {number} pageSize - 每页数量
     * @property {string} name - 考试名称
     * @property {string} status - 考试状态
     * @property {Date|null} startTime - 开始时间
     * @property {Date|null} endTime - 结束时间
     */

    /** @type {SearchParams} */
    let search_params = $state({
        page: 1,
        pageSize: 10,
        name: "",
        status: "",
        startTime: null,
        endTime: null,
    });

    let totals = $state(0);

    let loading = $state(false);

    let exam_id_to_delete = $state(0);

    let exam_id_to_cancel = $state(0);

    let exam_id_to_publish = $state(0);

    let exam_id_to_archive = $state(0);

    let exam_id_to_distribute = $state(0);

    let show_action_toast = $state(0);

    let action_toast = $state(null);

    let is_central_server = $state(true);

    //总页数
    let total_page = $derived(
        totals / search_params.pageSize
            ? Math.ceil(totals / search_params.pageSize)
            : 1,
    );

    let current_page = $state(1);

    //请求返回的错误
    let error = $state("");

    //请求后的消息
    let message = $state("");

    //取消考试确认框
    let cancelExamDialog = $state(false);

    //发布考试确认框
    let publishExamDialog = $state(false);

    //删除考试确认框
    let deleteExamDialog = $state(false);

    //归档考试确认框
    let archiveExamDialog = $state(false);

    //下发考卷确认框
    let distributeExamPaperDialog = $state(false);

    /**
     * @type {number|null}
     * 防抖计时器
     */
    let name_search_timer = null;

    /**
     * @type {number|null}
     * 防抖计时器
     */
    let page_search_timer = null;

    let operationLogPanel;

    // 考场选择面板
    let show_exam_rooms_selection_panel = $state(false);

    // 考生选择面板
    let show_examinee_selection_panel = $state(false);

    // 批阅员配置面板
    let show_reviewer_selection_panel = $state(false);

    // 监考管理面板
    let show_invigilation_session_panel = $state(false)

    let exam_rooms_selection_panel_exam_id = $state(0);
    let examinee_selection_panel_exam_id = $state(0);
    let reviewer_selection_panel_exam_id = $state(0);
    let invigilation_session_panel_exam_id = $state(0)

    //---------------------------------------操作日志面板--------------------------------------
    /**
     * @description
     * @param {number} exam_id
     */
     async function fetchExamLogs(page = 1, page_size = 10, exam_id) {
        console.log(page, page_size, exam_id);
        // 构建queryParams
        try {
            const res = await fetch(
                `/api/operation_logs/12/${exam_id}?page=${page}&page_size=${page_size}`,
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
     * @param {number} exam_id
     */
    async function showExamLogs(exam_id) {
        try {
            const fetchFunc = (/** @type {number | undefined} */ page, /** @type {number | undefined} */ page_size) =>
                fetchExamLogs(page, page_size, exam_id);
            await operationLogPanel.showLogPanelWithPagination(fetchFunc);
        } catch (error) {
            console.error("显示操作日志失败:", error);
        }
    }

    // 切换排序状态的函数
    /**
     * @param {string} column
     */
    function toggleSort(column) {
        if (column === "time") {
            exam_time_sort_state = (exam_time_sort_state + 1) % 3;
            exam_duration_sort_state = 0;
        } else if (column === "duration") {
            exam_duration_sort_state = (exam_duration_sort_state + 1) % 3;
            exam_time_sort_state = 0;
        }
    }

    /**
     * @param {number} index
     */
    function toggleMoreActions(index) {
        exam_list[index].action_expended = !exam_list[index].action_expended;
    }

    /**
     * 选择日期范围
     * @param {Date|null} start - 开始日期
     * @param {Date|null} end - 结束日期
     */
    function onSelectDate(start, end) {
        if (start !== null) {
            // 设置开始时间为当天的 00:00:00
            start.setHours(0, 0, 0);
        }

        if (end !== null) {
            // 设置结束时间为当天的 23:59:59
            end.setHours(23, 59, 59);
        }

        search_params.startTime = start;
        search_params.endTime = end;

        //回到第一页后执行搜索
        search_params.page = 1;
        searchExam();
    }

    //清空日期筛选
    function onClearDate() {
        search_params.startTime = null;
        search_params.endTime = null;
        searchExam();
    }

    /**
     * @param {string} value
     * 搜索时执行的函数
     */
    function onSearchFunc(value) {
        search_params.name = value;

        //防抖逻辑
        if (name_search_timer) {
            clearTimeout(name_search_timer);
        }
        name_search_timer = setTimeout(() => {
            searchExam();
            name_search_timer = null;
        }, 300);
    }

    /**
     * @param {string} value
     */
    function onSelectExamStatus(value) {
        let original_value = search_params.status;
        switch (value) {
            case "all":
                search_params.status = "";
                break;
            case "00":
                search_params.status = "00";
                break;
            case "02":
                search_params.status = "02";
                break;
            case "04":
                search_params.status = "04";
                break;
            case "08":
                search_params.status = "08";
                break;
            case "10":
                search_params.status = "10";
                break;
            case "12":
                search_params.status = "12";
                break;
            default:
                search_params.status = "";
                break;
        }

        //如果选中的值发生了变化，就触发搜索
        if (original_value !== search_params.status) {
            search_params.page = 1;
            searchExam();
        }
    }

    /**
     * @param {boolean} is_next
     * 上一页/下一页
     */
    function onNextOrLastPage(is_next) {
        if (loading === true) {
            return;
        }
        if (is_next && search_params.page < total_page) {
            search_params.page += 1;
            searchExam();
        }
        if (!is_next && search_params.page > 1) {
            search_params.page -= 1;
            searchExam();
        }
    }

    /**
     * @param {number} page
     * 页数跳转
     */
    function onPageChooseFunc(page) {
        if (loading === true) {
            return;
        }
        search_params.page = page;
        searchExam();
    }

    /**
     * @param {string} value
     * 搜索页数
     */
    function onSearchPageFunc(value) {
        const numericValue = parseFloat(value);
        if (numericValue < 1) {
            search_params.page = 1;
        } else {
            search_params.page = numericValue;
        }

        //防抖逻辑
        if (page_search_timer) {
            clearTimeout(page_search_timer);
        }
        page_search_timer = setTimeout(() => {
            searchExam();
            page_search_timer = null;
        }, 300);
    }

    /**
     * @param {string} value
     * 选择页面大小
     */
    function onSelectPageSizeFunc(value) {
        const numericValue = parseFloat(value);
        if (numericValue !== search_params.pageSize) {
            search_params.page = 1;
            search_params.pageSize = numericValue;
            searchExam();
        }
    }

    //搜索考试
    async function searchExam() {
        loading = true;
        error = "";

        // 构建查询参数
        let query_params = new URLSearchParams();

        // 添加基础参数
        query_params.append("page", search_params.page.toString());
        query_params.append("pageSize", search_params.pageSize.toString());

        // 添加可选参数
        if (search_params.name) {
            query_params.append("name", search_params.name);
        }
        if (search_params.status) {
            query_params.append("status", search_params.status);
        }

        if (search_params.startTime) {
            const start_time = new Date(search_params.startTime);
            query_params.append("startTime", start_time.toISOString());
        }
        if (search_params.endTime) {
            const endTime = new Date(search_params.endTime);
            query_params.append("endTime", endTime.toISOString());
        }

        const response = await fetch(
            `/api/teacher/exam/searchExam?${query_params.toString()}`,
            {
                method: "GET",
                credentials: "include",
                headers: {
                    "Content-Type": "application/json",
                },
            },
        );

        const result = await response.json();

        if (action_toast === null && result.Status !== 0) {
            alert(result.Msg);
            search_params.page = current_page;
            return;
        }

        if (result.Status !== 0) {
            error = result.Msg || "搜索失败";
            exam_list = [];
            totals = 0;
            console.error(error);
            search_params.page = current_page;
            action_toast.show("error", error);
        } else {
            console.log(result);
            exam_list = result.Data.exam_list;
            totals = result.Data.total;
            current_page = search_params.page;
            if (result.IsCentral === 'true') {
                is_central_server = true;
            } else {
                is_central_server = false;
            }
        }

        console.log(exam_list);
        loading = false;
    }

    /**
     * @param {string | number | Date} isoString
     * 格式化ISO时间字符串
     */
    function formatDateTime(isoString) {
        const date = new Date(isoString);
        return `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()} ${String(date.getHours()).padStart(2, "0")}:${String(date.getMinutes()).padStart(2, "0")}`;
    }

    /**
     * 获取排序后的时间数组并格式化
     * @param {Array<{start_time: string, end_time: string, session_num: number}>} timeArray
     * @returns {Array<{start_time: string, end_time: string, session_num: number}>}
     */
    function getSortedTime(timeArray) {
        return [...timeArray]
            .sort((a, b) => a.session_num - b.session_num)
            .map((slot) => ({
                ...slot,
                start_time: formatDateTime(slot.start_time),
                end_time: formatDateTime(slot.end_time),
            }));
    }

    // 发布考试
    /**
     * @param {number} examId
     */
    async function publishExam(examId) {
        loading = true;
        message = "";

        const url = `/api/teacher/exam/changeExamStatus?exam_id=${examId}&status=02`;

        const response = await fetch(url, {
            method: "PUT",
            credentials: "include",
            headers: {
                "Content-Type": "application/json",
            },
        });

        const data = await response.json();

        if (action_toast === null) {
            alert(data.Msg);
            loading = false;
            return;
        }

        if (data.Status === 0) {
            message = "考试发布成功";
            action_toast.show("success", message);
            await searchExam();
        } else if (data.Status === -11) {
            message = `发布失败：${data.Msg}`;
            action_toast.show("error", "考试时间无效，请重新设置考试时间");
        } else if (data.Status === -12) {
            action_toast.show("error", "考试状态异常，正在重新获取考试列表");
            await searchExam();
        } else if (data.Status === -13) {
            action_toast.show(
                "error",
                "尚未导入考生，请在导入考生后再发布该考试",
            );
            await searchExam();
        } else if (data.Status === -14) {
            action_toast.show(
                "error",
                "部分场次尚未配置批阅员，请在配置完批阅员后再发布该考试",
            );
            await searchExam();
        } else if (data.Status === -18) {
            message = `发布失败：考试正在被其他用户编辑`;
            action_toast.show("error", message);
        } else if (data.Status === -20) {
            action_toast.show("error", "用户无权访问");
        } else {
            action_toast.show("error", "考试发布失败，请稍后重试: " + message);
        }

        loading = false;
    }

    // 取消考试
    /**
     * @param {number} examId
     */
    async function cancelExam(examId) {
        loading = true;
        message = "";

        const url = `/api/teacher/exam/changeExamStatus?exam_id=${examId}&status=00`;

        const response = await fetch(url, {
            method: "PUT",
            credentials: "include",
            headers: {
                "Content-Type": "application/json",
            },
        });

        const data = await response.json();

        if (action_toast === null) {
            alert(data.Msg);
            loading = false;
            return;
        }

        if (data.Status === 0) {
            message = "考试已取消";
            action_toast.show("success", message);
            searchExam();
        } else if (data.Status === -12) {
            action_toast.show("error", "考试状态异常，正在重新获取考试列表");
            await searchExam();
        } else if (data.Status === -18) {
            message = `取消失败：考试正在被其他用户编辑`;
            action_toast.show("error", message);
        }else if (data.Status === -20) {
            action_toast.show("error", "用户无权访问");
        }else {
            message = `取消失败：${data.Msg}`;
            action_toast.show("error", message);
        }

        loading = false;
    }

    // 归档考试
    /**
     * @param {number} examId
     */
    async function archiveExam(examId) {
        loading = true;
        message = "";

        const url = `/api/teacher/exam/changeExamStatus?exam_id=${examId}&status=10`;

        const response = await fetch(url, {
            method: "PUT",
            credentials: "include",
            headers: {
                "Content-Type": "application/json",
            },
        });

        const data = await response.json();

        if (action_toast === null) {
            alert(data.Msg);
            loading = false;
            return;
        }

        if (data.Status === 0) {
            message = "考试已归档";
            action_toast.show("success", message);
            searchExam();
        } else if (data.Status === -18) {
            message = `归档失败：考试正在被其他用户编辑`;
            action_toast.show("error", message);
        }else if (data.Status === -20) {
            action_toast.show("error", "用户无权访问");
        }  else {
            message = `归档失败：${data.Msg}`;
            action_toast.show("error", message);
        }

        loading = false;
    }

    // 删除考试
    /**
     * @param {number} examId
     */
    async function deleteExam(examId) {
        loading = true;
        message = "";

        const url = `/api/teacher/exam/changeExamStatus?exam_id=${examId}&status=14`;

        const response = await fetch(url, {
            method: "PUT",
            credentials: "include",
            headers: {
                "Content-Type": "application/json",
            },
        });

        const data = await response.json();

        if (action_toast === null) {
            alert(data.Msg);
            loading = false;
            return;
        }

        if (data.Status === 0) {
            message = "考试已删除";
            action_toast.show("success", message);
            searchExam();
        } else {
            message = `删除失败：${data.Msg}`;
            action_toast.show("error", message);
        }

        loading = false;
    }

    async function distributeExamPaper(examId) {
        loading = true;
        message = "";

        const url = `/api/teacher/exam/distributeExamPaper?exam_id=${examId}`;

        const response = await fetch(url, {
            method: "PUT",
            credentials: "include",
            headers: {
                "Content-Type": "application/json",
            },
        });

        const data = await response.json();

        if (action_toast === null) {
            alert(data.Msg);
            loading = false;
            return;
        }

        if (data.Status === 0) {
            message = "开始下发考卷";
            action_toast.show("success", message);
            searchExam();
        } else if (data.Status === -13) {
            message = `考卷下发失败：尚未导入考生`;
            action_toast.show("error", message);
        } else if (data.Status === -14) {
            message = `考卷下发失败：部分场次未配置批阅员`;
            action_toast.show("error", message);
        } else if (data.Status === -15) {
            message = `考卷下发失败：配置的监考员数量不能小于考场数量`;
            action_toast.show("error", message);
        } else if (data.Status === -16) {
            message = `考卷下发失败：考卷下发中或者下发完成，请勿重复操作`;
            action_toast.show("error", message);
        } else if (data.Status === -18) {
            message = `考卷下发失败：考试正在被其他用户编辑`;
            action_toast.show("error", message);
        } else if (data.Status === -20) {
            action_toast.show("error", "用户无权访问");
        }  else if (data.Status === -22){
            action_toast.show("error", "尚未配置监考员")
        }else {
            message = `考卷下发失败：${data.Msg}`;
            action_toast.show("error", message);
        }

        loading = false;
    }

    /**
     * 获取考生信息
     * @param {number} examId - 考试ID
     */
    async function getExamineeInfo(examId) {
        const response = await fetch(
            `/api/teacher/exam/getExamineeInfo?exam_id=${examId}`,
            {
                method: "GET",
                headers: {
                    "Content-Type": "application/json",
                },
                credentials: "include",
            },
        );

        const result = await response.json();

        if (result.Status !== 0) {
            message = result.Msg || "获取考生信息失败";
            alert(message);
        } else {
            exportToExcel(result.Data);
        }
    }

    /**
     * 获取线下考生信息
     * @param {number} examId - 考试ID
     */
    async function getOfflineExamineeInfo(examId) {
        const response = await fetch(
            `/api/teacher/exam/getExamineeInfo?exam_id=${examId}`,
            {
                method: "GET",
                headers: {
                    "Content-Type": "application/json",
                },
                credentials: "include",
            },
        );

        const result = await response.json();

        if (result.Status !== 0) {
            message = result.Msg || "获取考生信息失败";
            action_toast.show("error", message);
        } else {
            console.log(result.Data);
            exportToExcelOfflineExam(result.Data);
        }
    }

    /**
     * @param {any} examId
     */
    async function getInvigilatorInfo(examId) {
        const response = await fetch(
            `/api/teacher/exam-invigilator-list?examID=${examId}`,
            {
                method: "GET",
            },
        );

        const result = await response.json();

        if (result.status !== 0) {
            message = result.msg || "获取监考员信息失败";
            action_toast.show("error", message);
        } else {
            console.log(result);
            const error = await exportToInvigilatorExcel(result.data);
            if (error) {
                action_toast.show("error", error);
            }
        }
    }
    
    //下载考生模板
    async function downloadTemplate() {
        try {
            const response = await fetch(
                "/api/files/exam/d0a9rv6slh1c714h2fkg.xlsx",
                {
                    method: "GET",
                },
            );

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            let filename = "考生导入模板.xlsx";

            // 获取文件内容
            const blob = await response.blob();

            // 创建下载链接
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = filename;
            document.body.appendChild(a);
            a.click();

            // 清理
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);
        } catch (error) {
            console.error("下载模板失败:", error);
            alert("下载模板失败，请稍后重试");
        }
    }

    // async function testGetExamPaperDetail() {
    //     loading = true;
    //     message = "";

    //     const url = `/api/student/exam/getExamineeEndTime?examinee_id=10`;

    //     const response = await fetch(url, {
    //         method: "GET",
    //         credentials: "include",
    //         headers: {
    //             "Content-Type": "application/json",
    //         },
    //     });

    //     const data = await response.json();

    //     if (data.Status === 0) {
    //         message = "获取成功";
    //         console.log(data);
    //     } else {
    //         console.log(data);
    //     }
    // }

    onDestroy(() => {
        if (name_search_timer !== null) {
            clearTimeout(name_search_timer);
            name_search_timer = null;
        }
        if (page_search_timer !== null) {
            clearTimeout(page_search_timer);
            page_search_timer = null;
        }
    });

    onMount(() => {
        searchExam();
        // testGetExamPaperDetail()
    });
</script>

<!-- 表头 -->
{#snippet tableHead()}
    <tr class="table-head-row">
        <th style="max-width: 25%;" class="table-head">考试名称</th>
        <th style="max-width: 15%;" class="table-head">考试课程</th>
        <th style="width: 8%;" class="table-head">考试类型</th>
        <th style="width: 7%;" class="table-head">考试方式</th>
        <th style="width: 20%;" class="table-head">
            <button
                class="exam-time-sort-button"
                onclick={() => toggleSort("time")}
            >
                考试时间
                <img
                    class="sort-icon"
                    src={SORT_ICON_ROUTE[exam_time_sort_state]}
                    alt="排序"
                    style="width: 16px; height:auto"
                />
            </button>
        </th>
        <th style="width: 10%;" class="table-head">
            <button
                class="exam-time-sort-button"
                onclick={() => toggleSort("duration")}
            >
                考试时长
                <img
                    class="sort-icon"
                    src={SORT_ICON_ROUTE[exam_duration_sort_state]}
                    alt="排序"
                    style="width: 16px; height:auto"
                />
            </button>
        </th>
        <th style="width: 10%;" class="table-head">考试状态</th>
        <th style="width: 9%;" class="table-head">考卷状态</th>
        <th style="width: 10%;" class="table-head">操作</th>
    </tr>
{/snippet}

<!--考试状态标签-->
{#snippet stateRender(
    /** @type {"00" | "02" | "04" | "08" | "10" | "12"} */ status,
    /** @type {"00" | "06"} */ delivery_status,
    /** @type {string} */ addi,
)}
    {#if status === "12"}
        <div
            style="display: flex; flex-direction:row; position:relative; margin:auto; width:74px"
        >
            <div class="status-tag {StateClassMap[status]}">
                {StateMap[status]}
            </div>
            <button class="tip"
                ><img
                    src="/exam_list/tip.png"
                    alt="提示"
                    style="width: 16px; height:auto"
                />
                <div class="tooltip-text">考试异常：{delivery_status === "06"?"考卷下发失败":addi}</div></button
            >
        </div>
    {:else}
        <div class="status-tag {StateClassMap[status]}">{StateMap[status]}</div>
    {/if}
{/snippet}

<!--考卷状态标签-->
{#snippet deliveryStateRender(
    /** @type {"00" | "02" | "04" | "06" | "08" | "10" | "12"} */ status,
    /** @type {string} */ delivery_error,
)}
    {#if status !== "04" && status !== "12"}
        <div
            style="display: flex; flex-direction:row; position:relative; margin:auto; width:74px"
        >
            <div class="delivery-status-tag {DeliveryStatusClassMap[status]}">
                {DeliveryStateMap[status]}
            </div>
            <button class="delivery-status-tip"
                ><img
                    src="/exam_list/tip.png"
                    alt="提示"
                    style="width: 16px; height:auto"
                />
                {#if status === "06"}
                    <div class="tooltip-text">{delivery_error}</div>
                {:else}
                    <div class="tooltip-text">
                        {DeliveryStateInfoMap[status]}
                    </div>
                {/if}
            </button>
        </div>
    {:else}
        <div
            style="display: flex; flex-direction:row; position:relative; margin:auto; width:74px"
        >
            <div
                class="delivery-status-tag {DeliveryStatusClassMap[status]}"
                style="width:74px"
            >
                {DeliveryStateMap[status]}
            </div>
        </div>
    {/if}
{/snippet}

<!--操作按钮-->
{#snippet actionRender(
    /** @type {"00" | "02" | "04" | "08" | "10" | "12"} */ status,
    /** @type {number} */ index,
)}
    <div class="button-container" style="background-color: rgb(0, 0, 0, 0);">
        {#if status === "00"}
            <button
                class="continue-edit-button action-button"
                onclick={() =>
                    goto(
                        `/teacher/examManagement/editExam/${exam_list[index].id}`,
                    )}>继续编辑</button
            >
            <button
                class="delete-exam-button action-button"
                onclick={() => {
                    (deleteExamDialog = true),
                        (exam_id_to_delete = exam_list[index].id);
                }}>删除考试</button
            >
            <button
                class="publish-exam-button action-button"
                onclick={() => {
                    (publishExamDialog = true),
                        (exam_id_to_publish = exam_list[index].id);
                }}>发布考试</button
            >
            <button
                class="unpublished-more-action-button action-button"
                onclick={() => toggleMoreActions(index)}
                onblur={() => {
                    setTimeout(() => {
                        exam_list[index].action_expended = false;
                    }, 200);
                }}>更多...</button
            >
            {#if exam_list[index].action_expended === true}
                <div class="more-action-list">
                    {#if exam_list[index].method === "02"}
                        <button
                            class="more-action-button"
                            onclick={() => {
                                exam_rooms_selection_panel_exam_id = exam_list[index].id
                                show_exam_rooms_selection_panel = true;
                                toggleMoreActions(index);
                            }}>配置考场与监考员</button
                        >
                    {/if}
                    <button
                        class="more-action-button"
                        onclick={() => {
                            examinee_selection_panel_exam_id = exam_list[index].id
                            show_examinee_selection_panel = true;
                            toggleMoreActions(index);
                        }}>配置考生</button
                    >
                    <button
                        class="more-action-button"
                        onclick={() => {
                            reviewer_selection_panel_exam_id = exam_list[index].id
                            show_reviewer_selection_panel = true;
                            toggleMoreActions(index);
                        }}>配置批阅员</button
                    >
                    <button
                        class="more-action-button"
                        onclick={() => {
                            if (exam_list[index].method === "02") {
                                getOfflineExamineeInfo(exam_list[index].id);
                            } else {
                                getExamineeInfo(exam_list[index].id);
                            }
                            toggleMoreActions(index);
                        }}>获取考生名单</button
                    >
                    {#if exam_list[index].method === "02"}
                        <button
                            class="more-action-button"
                            onclick={() => {
                                getInvigilatorInfo(exam_list[index].id);
                                toggleMoreActions(index);
                            }}>获取监考员名单</button
                        >
                    {/if}
                    <button
                        class="more-action-button"
                        onclick={() => {
                            toggleMoreActions(index);
                        }}>预览考试</button
                    >
                    <button
                        class="more-action-button"
                        onclick={() => {
                            showExamLogs(exam_list[index].id);
                        }}>操作日志</button
                    >
                </div>
            {/if}
        {:else if status === "02"}
            <!-- <button class="change-exam-time-button action-button"
                >更改时间</button
            > -->
            {#if is_central_server === true}
                {#if exam_list[index].method === "02" && exam_list[index].delivery_status !== "02"}
                    <button
                        class="continue-edit-button action-button"
                        onclick={() =>
                            goto(
                                `/teacher/examManagement/editExam/${exam_list[index].id}`,
                            )}>继续编辑</button
                    >
                {/if}
                {#if exam_list[index].method !== "02" || (exam_list[index].method === "02" && exam_list[index].delivery_status !== "02")}
                    <button
                        class="cancel-exam-button action-button"
                        onclick={() => {
                            (cancelExamDialog = true),
                                (exam_id_to_cancel = exam_list[index].id);
                        }}>取消考试</button
                    >
                {/if}
                {#if exam_list[index].method === "02" && exam_list[index].delivery_status !== "02"}
                    <button
                        class="action-button"
                        onclick={() => {
                            (distributeExamPaperDialog = true),
                                (exam_id_to_distribute = exam_list[index].id);
                        }}>下发考卷</button
                    >
                {/if}
                {#if exam_list[index].method === "02" && exam_list[index].delivery_status !== "02"}
                    <button
                        class="unpublished-more-action-button action-button"
                        onclick={() => toggleMoreActions(index)}
                        onblur={() => {
                            setTimeout(() => {
                                exam_list[index].action_expended = false;
                            }, 200);
                        }}>更多...</button
                    >
                {/if}
                {#if exam_list[index].action_expended === true}
                    <div class="more-action-list">
                        {#if exam_list[index].method === "02"}
                            <button
                                class="more-action-button"
                                onclick={() => {
                                    exam_rooms_selection_panel_exam_id = exam_list[index].id
                                    show_exam_rooms_selection_panel = true;
                                    toggleMoreActions(index);
                                }}>配置考场与监考员</button
                            >
                            <button
                                class="more-action-button"
                                onclick={() => {
                                    examinee_selection_panel_exam_id = exam_list[index].id
                                    show_examinee_selection_panel = true;
                                    toggleMoreActions(index);
                                }}>配置考生</button
                            >
                            <button
                                class="more-action-button"
                                onclick={() => {
                                    reviewer_selection_panel_exam_id = exam_list[index].id
                                    show_reviewer_selection_panel = true;
                                    toggleMoreActions(index);
                                }}>配置批阅员</button
                            >
                        {/if}
                        <button
                            class="more-action-button"
                            onclick={() => {
                                if (exam_list[index].method === "02") {
                                    getOfflineExamineeInfo(exam_list[index].id);
                                } else {
                                    getExamineeInfo(exam_list[index].id);
                                }
                                toggleMoreActions(index);
                            }}>获取考生名单</button
                        >
                        {#if exam_list[index].method === "02"}
                            <button
                                class="more-action-button"
                                onclick={() => {
                                    getInvigilatorInfo(exam_list[index].id);
                                    toggleMoreActions(index);
                                }}>获取监考员名单</button
                            >
                        {/if}
                        <button class="more-action-button"
                            onclick={() =>{                    
                                // 线下考试跳转至监考页，线上则打开监考管理面板
                                if(exam_list[index].method === "02"){
                                    goto(
                                        `/teacher/examManagement/invigilation/${exam_list[index].id}`,
                                    )
                                }else{
                                    invigilation_session_panel_exam_id = exam_list[index].id
                                    show_invigilation_session_panel = true;
                                }
                            }}
                        >监考管理</button>
                        <button
                            class="more-action-button"
                            onclick={() => {
                                showExamLogs(exam_list[index].id);
                            }}>操作日志</button
                        >
                    </div>
                {/if}

                {#if !(exam_list[index].method === "02" && exam_list[index].delivery_status !== "02")}
                    <button
                        class="action-button"
                        onclick={() => {
                            if (exam_list[index].method === "02") {
                                getOfflineExamineeInfo(exam_list[index].id);
                            } else {
                                getExamineeInfo(exam_list[index].id);
                            }
                        }}>获取考生名单</button
                    >
                    {#if exam_list[index].method === "02"}
                        <button
                            class="action-button"
                            onclick={() => {
                                getInvigilatorInfo(exam_list[index].id);
                            }}>获取监考员名单</button
                        >
                    {/if}
                    <button class="action-button"
                        onclick={() =>{                    
                            // 线下考试跳转至监考页，线上则打开监考管理面板
                            if(exam_list[index].method === "02"){
                                goto(
                                    `/teacher/examManagement/invigilation/${exam_list[index].id}`,
                                )
                            }else{
                                invigilation_session_panel_exam_id = exam_list[index].id
                                show_invigilation_session_panel = true;
                            }
                        }}
                    >监考管理</button>
                {/if}
            {:else}
                <button
                    class="action-button"
                    onclick={() => {
                        if (exam_list[index].method === "02") {
                            getOfflineExamineeInfo(exam_list[index].id);
                        } else {
                            getExamineeInfo(exam_list[index].id);
                        }
                        toggleMoreActions(index);
                    }}>获取考生名单</button
                >
                <button
                    class="action-button"
                    onclick={() => {
                        getInvigilatorInfo(exam_list[index].id);
                        toggleMoreActions(index);
                    }}>获取监考员名单</button
                >
                <button class="action-button"
                    onclick={() =>{                    
                        // 线下考试跳转至监考页，线上则打开监考管理面板
                        if(exam_list[index].method === "02"){
                            goto(
                                `/teacher/examManagement/invigilation/${exam_list[index].id}`,
                            )
                        }else{
                            invigilation_session_panel_exam_id = exam_list[index].id
                            show_invigilation_session_panel = true;
                        }
                    }}
                >监考管理</button>
            {/if}
        {:else if status === "04"}
            <button class="invigilate-button action-button"
                onclick={() =>{                    
                    // 线下考试跳转至监考页，线上则打开监考管理面板
                    if(exam_list[index].method === "02"){
                        goto(
                            `/teacher/examManagement/invigilation/${exam_list[index].id}`,
                        )
                    }else{
                        invigilation_session_panel_exam_id = exam_list[index].id
                        show_invigilation_session_panel = true;
                    }
                }}
            >监考管理</button>
            <button
                class="action-button"
                onclick={() => {
                    showExamLogs(exam_list[index].id);
                }}>操作日志</button
            >
            <button
                class="unpublished-more-action-button action-button"
                onclick={() => toggleMoreActions(index)}
                onblur={() => {
                    setTimeout(() => {
                        exam_list[index].action_expended = false;
                    }, 200);
                }}>更多...</button
            >
            {#if exam_list[index].action_expended === true}
                <div class="more-action-list">
                    <button
                        class="more-action-button"
                        onclick={() => {
                            if (exam_list[index].method === "02") {
                                getOfflineExamineeInfo(exam_list[index].id);
                            } else {
                                getExamineeInfo(exam_list[index].id);
                            }
                            toggleMoreActions(index);
                        }}>获取考生名单</button
                    >
                    {#if exam_list[index].method === "02"}
                        <button
                            class="more-action-button"
                            onclick={() => {
                                getInvigilatorInfo(exam_list[index].id);
                                toggleMoreActions(index);
                            }}>获取监考员名单</button
                        >
                    {/if}
                </div>
            {/if}
            <!-- <button class="preview-button action-button">查看详情</button> -->
        {:else if status === "08"}
            <button class="invigilate-button action-button"
                onclick={() =>{
                    // 线下考试跳转至监考页，线上则打开监考管理面板
                    if(exam_list[index].method === "02"){
                        goto(
                            `/teacher/examManagement/invigilation/${exam_list[index].id}`,
                        )
                    }else{
                        invigilation_session_panel_exam_id = exam_list[index].id
                        show_invigilation_session_panel = true;
                    }
                }}
            >监考管理</button>
            {#if is_central_server === true}
                <button
                    class="archive-button action-button"
                    onclick={() => {
                        (archiveExamDialog = true),
                            (exam_id_to_archive = exam_list[index].id);
                    }}>归档考试</button
                >
                <button
                    class="action-button"
                    onclick={() => {
                        showExamLogs(exam_list[index].id);
                    }}>操作日志</button
                >
            {/if}
        {:else if status === "10"}
            <!-- <button class="exam-details-button action-button">查看详情</button> -->
        {:else if status === "12"}
            <!-- <button class="exam-details-button action-button">查看详情</button> -->
            {#if is_central_server === true}
            <button
                class="cancel-exam-button action-button"
                onclick={() => {
                    (cancelExamDialog = true),
                        (exam_id_to_cancel = exam_list[index].id);
                }}>取消考试</button
            >
            <button
                class="action-button"
                    onclick={() => {
                        showExamLogs(exam_list[index].id);
                    }}>操作日志</button
                >
            {:else}
                <span>--</span>
            {/if}
        {/if}
    </div>
{/snippet}

{#snippet tableData(data, /** @type {any} */ index)}
    <tr class="table-data-tr">
        <td class="exam-name default-td">
            {data.name}
        </td>
        {#if data.course === ""}
            <td class="exam-course default-td">
                {"--"}
            </td>
        {:else}
            <td class="exam-course default-td">
                {data.course ? data.course : "--"}
            </td>
        {/if}
        <td class="exam-type default-td">
            {TypeMap[data.type]}
        </td>
        <td class="exam-method default-td">
            {MethodMap[data.method]}
        </td>
        <td class="exam-time default-td">
            {#each getSortedTime(data.time) as time, i}
                <div class="time-slot">
                    {formatDateTime(time.start_time)} - {formatDateTime(
                        time.end_time,
                    )}
                </div>
            {/each}
        </td>
        <td class="exam-duration default-td">
            {data.duration}分钟
        </td>
        <td class="exam-status default-td">
            {@render stateRender(data.status, data.delivery_status, data.addi)}
        </td>
        <td>
            {#if data.method === "02"}
                {@render deliveryStateRender(
                    data.delivery_status,
                    data.delivery_error,
                )}
            {:else}
                <span>--</span>
            {/if}
        </td>
        <td class="default-td">
            {@render actionRender(data.status, index)}
        </td>
    </tr>
{/snippet}

<div class="exam-management-container">
    <Title title="考试列表" />

    <div class="table-action-container">
        <div class="action-part">
            <div class="search-input-container">
                <SearchInput
                    place_holder={"请输入考试名"}
                    purpose_text={"搜索考试"}
                    --search_input_container_width="280px"
                    {onSearchFunc}
                ></SearchInput>
            </div>
            <span class="exam-type-text">考试状态</span>
            <div class="dropdown-gray-container">
                <DropdownGray
                    options={[
                        { value: "all", label: "全部" },
                        { value: "00", label: "未发布" },
                        { value: "02", label: "待开始" },
                        { value: "04", label: "进行中" },
                        { value: "12", label: "考试异常" },
                        { value: "08", label: "已结束" },
                        { value: "10", label: "已归档" },
                    ]}
                    selected={"all"}
                    selectOptionFunc={onSelectExamStatus}
                ></DropdownGray>
            </div>
            <div class="date-picker-container">
                <span class="exam-time-text">考试时间</span>
                <div class="date-picker">
                    <DatePicker
                        start_date={null}
                        end_date={null}
                        {onSelectDate}
                        {onClearDate}
                    ></DatePicker>
                </div>
            </div>
        </div>
        <div class="button-part">
            <button class="download-template-button" onclick={downloadTemplate}>
                下载考生模板
            </button>
            <button
                class="add-exam-button"
                onclick={() => {
                    goto("/teacher/examManagement/createExam");
                }}
            >
                + 新增考试
            </button>
        </div>
    </div>
    <div class="table-container">
        <table class="exam-list-table">
            <thead class="exam-list-table-head">
                {@render tableHead()}
            </thead>
            <tbody class="exam-list-table-data">
                {#each exam_list as data, index}
                    {@render tableData(data, index)}
                {/each}
            </tbody>
        </table>
        {#if !exam_list || exam_list.length === 0}
            <div class="no-data-text">暂无数据</div>
        {/if}
    </div>
    <div class="pagination-container">
        <Pagination
            current_page_num={current_page}
            total_page_num={total_page}
            onPageChangeFunc={onNextOrLastPage}
            {onPageChooseFunc}
            onPageSearchFunc={onSearchPageFunc}
            selectOptionFunc={onSelectPageSizeFunc}
            selected={10}
            total_data_num={totals}
            data_num_per_page_options={[
                { value: 10, label: "10条/页" },
                { value: 20, label: "20条/页" },
            ]}
            expand_direction="up"
        ></Pagination>
    </div>
</div>

<Dialog
    bind:isOpen={cancelExamDialog}
    title="确认取消该考试?"
    content=""
    confirmTextBackgroundColor="#E34D59"
    onConfirm={() => cancelExam(exam_id_to_cancel)}
/>

<Dialog
    bind:isOpen={deleteExamDialog}
    title="确认删除该考试?"
    content="删除后无法恢复，请谨慎操作"
    confirmTextBackgroundColor="#E34D59"
    onConfirm={() => deleteExam(exam_id_to_delete)}
/>

<Dialog
    bind:isOpen={publishExamDialog}
    title="确认发布该考试?"
    content=""
    confirmTextBackgroundColor="#E34D59"
    onConfirm={() => publishExam(exam_id_to_publish)}
/>

<Dialog
    bind:isOpen={archiveExamDialog}
    title="确认归档该考试?"
    content=""
    confirmTextBackgroundColor="#E34D59"
    onConfirm={() => archiveExam(exam_id_to_archive)}
/>

<Dialog
    bind:isOpen={distributeExamPaperDialog}
    title="确认下发考卷?"
    content=""
    confirmTextBackgroundColor="#E34D59"
    onConfirm={() => distributeExamPaper(exam_id_to_distribute)}
/>

<ActionToast bind:isShow={show_action_toast} bind:this={action_toast} />

<AwesomeLogPanel bind:this={operationLogPanel} />

<ExamRoomsAndInvigilatorSelectionPanel
    show_panel={show_exam_rooms_selection_panel}
    exam_id = {exam_rooms_selection_panel_exam_id}
    onCancel={() => {
        exam_rooms_selection_panel_exam_id = 0;
        show_exam_rooms_selection_panel = false;
    }}
    onConfirm={() => {
        show_exam_rooms_selection_panel = false;
    }}
/>

<ExamineeSelectionPanel
    show_panel={show_examinee_selection_panel}
    exam_id = {examinee_selection_panel_exam_id}
    onCancel={() => {
        examinee_selection_panel_exam_id = 0;
        show_examinee_selection_panel = false;
    }}
    onConfirm={() => {
        show_examinee_selection_panel = false;
    }}
/>

<ReviewerSelectionPanel
    show_panel={show_reviewer_selection_panel}
    exam_id = {reviewer_selection_panel_exam_id}
    onCancel={() => {
        reviewer_selection_panel_exam_id = 0;
        show_reviewer_selection_panel = false;
    }}
    onConfirm={() => {
        show_reviewer_selection_panel = false;
    }}
/>

<InvigilationSessionPanel
    exam_id = {invigilation_session_panel_exam_id}
    show_panel = {show_invigilation_session_panel}
    onClose = {() => {
        invigilation_session_panel_exam_id = 0;
        show_invigilation_session_panel = false;
    }}
/>

<style lang="scss" scoped>
    $normal-font-size: 14px;
    $gray-font-color: rgb(0, 0, 0, 0.6);

    .exam-management-container {
        position: relative;
        background-color: white;
        display: flex;
        flex-direction: column;
        width: 100%;
        height: 100%;
        overflow: auto;
    }

    .table-action-container {
        display: flex;
        flex-direction: row;
        flex-wrap: wrap;
        gap: 15px;
        padding: 17px 0 0 76px;
        align-items: center;
        justify-content: space-between;
        min-width: 1000px;
        .action-part {
            display: flex;
            flex-direction: row;
            align-items: center;
            justify-content: center;
            min-width: 800px;
        }
        .button-part {
            margin-left: 30px;
            margin-right: 10px;
        }
        .exam-type-text {
            font-size: $normal-font-size;
            color: $gray-font-color;
            padding: 0 17px 0 10px;
            min-width: 56px;
        }
        .dropdown-gray-container {
            min-width: 110px;
            padding: 0 15px 0 2px;
        }
        .date-picker-container {
            display: flex;
            flex-direction: row;
            align-items: center;
            padding: 0 0 0 0;
            .exam-time-text {
                font-size: $normal-font-size;
                color: $gray-font-color;
                min-width: 56px;
                padding-right: 17px;
            }
            .date-picker {
                width: 280px;
                height: 32px;
            }
        }
        .add-exam-button {
            border: none;
            border-radius: 3px;
            height: 32px;
            width: 102px;
            background-color: var(--blue);
            color: white;
            font-size: 14px;
            cursor: pointer;
        }
    }

    .status-tag {
        border: none;
        border-radius: 10px;
        color: white;
        font-size: 12px;
        width: 74px;
        height: 26px;
        display: flex;
        align-items: center;
        justify-content: center;
        margin: auto;
        &.unpublished {
            background-color: #689bff;
        }
        &.to-start {
            background-color: var(--blue);
        }
        &.ended {
            background-color: #c5c5c5;
        }
        &.archived {
            background-color: #7f7f7f;
        }
        &.on-going {
            background-color: var(--green);
        }
        &.error {
            background-color: var(--red);
        }
    }

    .exam-list-table {
        position: relative;
        font-size: 14px;
        border-collapse: collapse;
        width: 100%;
        min-width: 1000px;
        // min-height: 800px;
        .exam-list-table-head {
            background-color: #ffffff;
            font-size: 14px;
            font-weight: normal;
            color: rgb(0, 0, 0, 0.3);
            border: none;
            padding: 8px;
            text-align: center;
            .table-head-row {
                height: 40px;
                .table-head {
                    font-weight: normal;
                }
                .exam-time-sort-button {
                    border: none;
                    background-color: white;
                    font-size: 14px;
                    font-weight: normal;
                    color: rgb(0, 0, 0, 0.3);
                    display: flex;
                    align-items: center;
                    margin: auto;
                    cursor: pointer;
                }
            }
        }
        .exam-list-table-data {
            .table-data-tr {
                border-top: none;
                border-bottom: 1px solid #ddd;
                border-left: none;
                border-right: none;
                padding: 8px;
                font-size: 14px;
                text-align: center;
                color: rgb(0, 0, 0, 0.75);
                height: 60px;
            }
            .table-data-tr:hover {
                background-color: #ecf2fe;
            }
        }
    }

    .download-template-button {
        border: none;
        border-radius: 3px;
        background-color: #e3e3e3;
        width: 100px;
        height: 32px;
        color: #165dff;
        font-size: 14px;
        cursor: pointer;
        margin-right: 15px;
    }

    .table-container {
        padding: 33px 37px 40px 37px;
    }

    .no-data-text {
        display: flex;
        justify-content: center;
        color: var(--text-disabled);
        align-items: center;
        font-size: 42px;
        font-weight: bold;
        padding-top: 200px;
        padding-bottom: 200px;
    }

    .action-button {
        border: none;
        background-color: rgb(0, 0, 0, 0);
        color: var(--blue);
        cursor: pointer;
        font-size: 14px;
        min-width: 70px;
    }
    .action-button:hover {
        font-weight: bold;
    }
    .pagination-container {
        display: flex;
        justify-content: right;
        padding: 0 30px 100px 0;
    }

    .tip {
        position: absolute;
        left: 95%;
        border: none;
        background-color: rgb(0, 0, 0, 0);
        display: flex;
        align-items: center;
        justify-content: center;
        top: 4px;
    }

    .delivery-status-tip {
        position: absolute;
        left: 95%;
        border: none;
        background-color: rgb(0, 0, 0, 0);
        display: flex;
        align-items: center;
        justify-content: center;
        top: 4px;
    }

    .tooltip-text {
        visibility: hidden;
        width: max-content;
        max-width: 250px;
        background-color: white;
        border: 1px solid #d7d7d7;
        color: var(--text-primary);
        text-align: left;
        padding: 6px 8px;
        border-radius: 4px;
        position: absolute;
        z-index: 1;
        bottom: 150%;
        left: 50%;
        transform: translateX(-50%);
        white-space: pre-line;
        font-size: 12px;
        line-height: 1.4;
    }

    .tip:hover .tooltip-text {
        visibility: visible;
    }

    .delivery-status-tip:hover .tooltip-text {
        visibility: visible;
    }

    .more-action-list {
        position: absolute;
        box-sizing: border-box;
        overflow-y: auto;
        background-color: white;
        z-index: 1000;
        display: flex;
        flex-direction: column;
        align-items: center;
        padding: 4px 0;
        min-width: 110px;
        max-height: 200px;
        border: 1px solid rgb(0, 0, 0, 0.3);
        border-radius: 3px;
    }
    .more-action-button {
        border: none;
        background-color: white;
        font-size: 14px;
        color: rgb(0, 0, 0, 0.75);
        height: 26px;
        width: 100%;
        cursor: pointer;
    }
    .more-action-button:hover {
        background-color: rgba(242, 242, 242, 0.35);
        border-radius: 5px;
    }

    // 考卷状态标签基础样式
    .delivery-status-tag {
        border-radius: 10px;
        font-size: 12px;
        line-height: 20px;
        text-align: center;
        min-width: 74px;
        height: 26px;
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 0 0 0 0;
        box-sizing: border-box;
    }

    // 考卷状态样式
    .delivery-status-tag.pending {
        background-color: #f5f5f5;
        color: var(--gray);
        border: 1px solid var(--gray);
    }

    .delivery-status-tag.distributing {
        background-color: #e6f7ff;
        color: var(--blue);
        border: 1px solid var(--blue);
    }

    .delivery-status-tag.distributed {
        background-color: #f6ffed;
        color: var(--green);
        border: none;
        border: 1px solid var(--green);
    }

    .delivery-status-tag.failed {
        background-color: #fff1f0;
        color: var(--red);
        border: 1px solid var(--red);
    }

    .delivery-status-tag.pending-update {
        background-color: #fff7e6;
        color: var(--orange);
        border: 1px solid var(--orange);
    }

    .delivery-status-tag.pending-sync {
        background-color: #f9f0ff;
        color: #722ed1;
        border: 1px solid #722ed1;
    }

    .delivery-status-tag.synced {
        background-color: #f6ffed;
        color: var(--green);
        border: 1px solid var(--green);
    }
</style>
