<script>
    import DropdownGray from "$lib/component/DropdownGray.svelte";
    import Pagination from "$lib/component/Pagination.svelte";
    import SearchInput from "$lib/component/SearchInput.svelte";
    import { onMount } from "svelte";
    import DropDownSparent from "./DropDownSparent.svelte";
    import { goto } from "$app/navigation";
    import ActionToast from "$lib/component/ActionToast.svelte";

    const EXAM_SESSION_STATUS_MAP = {
        "01": "待开始",
        "02": "进行中",
        "04": "已结束",
        "08": "批改中",
        "10": "已批改",
        "12": "已提交",
        "14": "待同步",
        "100": "未知"
    };

    const EXAM_SESSION_STATUS_COLOR_MAP = {
        "01": "#266EF8",
        "02": "#00A870",
        "04": "#ed7b2f",
        "08": "#ed7b2f",
        "10": "#266EF8",
        "12": "#ed7b2f",
        "14": "#ed7b2f",
        "100": "#000000",
    };

    const BASIC_EVAL_OPTIONS = [
        {
            value: "all",
            label: "全部",
        },
        {
            value: "00",
            label: "良好",
        },
        {
            value: "02",
            label: "一般",
        },
        {
            value: "04",
            label: "较差",
        },
    ];

    const BASIC_EVAL_MAP = {
        "00": "良好",
        "02": "一般",
        "04": "较差",
    };

    // 考试名称
    let exam_name = $state("");

    // 考试场次列表
    let exam_session_list = $state([]);

    // 考试场次列表选项
    let exam_session_list_option = $derived(
        exam_session_list.map((item) => ({
            value: item.session_id,
            label: item.paper_name,
        })),
    );

    // 选中的考试场次
    let selected_exam_session = $state(1);

    // 选中的基本情况
    let selected_basic_eval = $state("all");

    // 总考生人数
    let total_examinee_number = $state(100);

    // 未缺考人数
    let exam_examinee_number = $state(100);

    // 当前页
    let current_page = $state(1);

    let page_size = $state(10);

    // 总数据条数
    let total_data_num = $state(0);

    let search_exam_site_name = $state("");

    let search_exam_room_name = $state("");

    let exam_session_start_time = $state("2025-05-29 10:00:00");

    let exam_session_end_time = $state("2025-05-29 12:00:00");

    let exam_session_status = $state("01");

    let error = $state("");

    let action_toast = $state(null);

    let show_action_toast = $state(false);

    let tableData = $state([
        {
            exam_session_id: 1,
            exam_session_name: "2025 年上半年 软件设计师 下午试卷",
            examinee_num: 100,
            absentee_num: 10,
            exam_site_name: "广州大学",
            exam_room_name: "计算机楼412",
            exam_room_capacity: 100,
            start_time: "2025-05-29 10:00:00",
            end_time: "2025-05-29 12:00:00",
            invigilator_names: ["温柏艺", "潘堃"],
            invigilator_ids: ["1", "2"],
            invigilator_num: 2,
            cheater_num: 10,
            abnormal_examinee_num: 5,
            basic_eval: "良好",
            record: "无",
        },
    ]);

    // 考点搜索定时器
    let site_search_timer = $state(null);

    // 考场搜索定时器
    let room_search_timer = $state(null);

    // 页数搜索定时器
    let page_search_timer = $state(null);

    let loading = $state(false);

    let format_exam_start_time = $derived(formatDateTime(new Date(exam_session_start_time)));

    let format_exam_end_time = $derived(formatDateTime(new Date(exam_session_end_time)));

    // 总页数
    let total_page = $derived(
        total_data_num / page_size
            ? Math.ceil(total_data_num / page_size)
            : 1,
    );

    function formatDateTime(dateString) {
        if (!dateString) return '';
        const date = new Date(dateString);
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        const hours = String(date.getHours()).padStart(2, '0');
        const minutes = String(date.getMinutes()).padStart(2, '0');
        return `${year}-${month}-${day} ${hours}:${minutes}`;
    }

    /**
     * @param {string} value
     * 搜索考点时执行的函数
     */
    function onSearchSiteFunc(value) {
        search_exam_site_name = value;

        //防抖逻辑
        if (site_search_timer) {
            clearTimeout(site_search_timer);
        }
        site_search_timer = setTimeout(() => {
            getInvigilationListInfo();
            site_search_timer = null;
        }, 300);
    }

    /**
     * @param {string} value
     * 搜索考场时执行的函数
     */
    function onSearchRoomFunc(value) {
        search_exam_room_name = value;

        //防抖逻辑
        if (room_search_timer) {
            clearTimeout(room_search_timer);
        }
        room_search_timer = setTimeout(() => {
            getInvigilationListInfo();
            room_search_timer = null;
        }, 300);
    }

    /**
     * @param {boolean} is_next
     * 上一页/下一页
     */
    function onNextOrLastPage(is_next) {
        if (loading === true) {
            return;
        }
        if (is_next && current_page < total_page) {
            current_page += 1;
            getInvigilationListInfo();
        }
        if (!is_next && current_page > 1) {
            current_page -= 1;
            getInvigilationListInfo();
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
        current_page = page;
        getInvigilationListInfo();
    }

    /**
     * @param {string} value
     * 搜索页数
     */
    function onSearchPageFunc(value) {
        const numericValue = parseFloat(value);
        if (numericValue < 1) {
            current_page = 1;
        } else {
            current_page = numericValue;
        }

        //防抖逻辑
        if (page_search_timer) {
            clearTimeout(page_search_timer);
        }
        page_search_timer = setTimeout(() => {
            getInvigilationListInfo();
            page_search_timer = null;
        }, 300);
    }

    /**
     * @param {string} value
     * 选择页面大小
     */
    function onSelectPageSizeFunc(value) {
        const numericValue = parseFloat(value);
        if (numericValue !== page_size) {
            current_page = 1;
            page_size = numericValue;
            getInvigilationListInfo();
        }
    }

    /**
     * @param {string} value
     * 选择考试场次
     */
     function onSelectExamSessionFunc(value) {
        const numericValue = parseFloat(value);
        if (numericValue !== selected_exam_session) {
            selected_exam_session = numericValue;
            current_page = 1;
            getInvigilationListInfo();
        }
    }

    /**
     * @param {string} value
     * 选择基本情况
     */
    function onSelectBasicEvalFunc(value) {
        if (value !== selected_basic_eval) {
            selected_basic_eval = value;
            current_page = 1;
            getInvigilationListInfo();
        }
    }

    // 获取监考列表信息
    async function getInvigilationListInfo() {
        let query_params = new URLSearchParams();

        // 分页参数
        query_params.append("page", current_page.toString());
        query_params.append("pageSize", page_size.toString());

        if (selected_basic_eval !== "all") {
            query_params.append("basic_eval", selected_basic_eval);
        }

        if (search_exam_site_name !== "") {
            query_params.append("examSiteName", search_exam_site_name);
        }

        if (search_exam_room_name !== "") {
            query_params.append("examRoomName", search_exam_room_name);
        }

        // 基本情况评估
        if (selected_basic_eval !== "all") {
            query_params.append("examBasicEval", selected_basic_eval);
        }

        // 考试场次ID
        query_params.append(
            "examSessionID",
            selected_exam_session.toString()
        );

        loading = true;

        // 获取监考列表信息
        const response = await fetch(
            `/api/teacher/invigilation-list/by-exam-session?${query_params.toString()}`,
            {
                method: "GET",
                credentials: "include",
            },
        );

        if (response.status !== 200) {
            error = "获取监考列表信息失败";
            tableData = [];
            total_data_num = 0;
            total_examinee_number = 0;
            exam_examinee_number = 0;
            exam_session_status = "100";
            exam_session_start_time = new Date().toISOString();
            exam_session_end_time = new Date().toISOString();
            action_toast.show("error", error);
        }

        const result = await response.json();

        if (result.status !== 0) {
            error = result.msg || "搜索失败";
            tableData = [];
            total_data_num = 0;
            console.error(error);
            total_examinee_number = 0;
            exam_examinee_number = 0;
            exam_session_status = "100";
            exam_session_start_time = new Date().toISOString();
            exam_session_end_time = new Date().toISOString();
            action_toast.show("error", error);
        } else {
            tableData = result.data.list;
            total_data_num = result.row_count;
            total_examinee_number = result.data.total_examinee_num;
            exam_examinee_number = result.data.actual_examinee_num;
            if (result.data.list) {
                exam_session_status = result.data.list[0].status;
                exam_session_start_time = result.data.list[0].start_time
                    ? result.data.list[0].start_time
                    : new Date().toISOString();
                exam_session_end_time = result.data.list[0].end_time
                        ? result.data.list[0].end_time
                        : new Date().toISOString();
            }else{
                tableData = [];
            }
        }

        loading = false;
    }

    // 获取考试场次信息
    /**
     * @param {number} examID
     */
    async function getInvigilationInfo(examID) {
        if (examID && typeof examID === "string") {
            console.error("examID is string");
            return;
        }

        const response = await fetch(
            `/api/teacher/exam/inviligationExamInfo?exam_id=${examID}`,
            {
                method: "GET",
                credentials: "include",
            },
        );

        if (
            response.status === 404 ||
            response.status === 500 ||
            response.status === 400
        ) {
            alert("获取考试场次信息失败");
            goto("/teacher/examManagement");
        }

        const data = await response.json();

        if (data.Status === 0) {
            exam_name = data.Data.exam_name;
            let exam_session_list_data = data.Data.exam_session_list;

            // 排序处理
            exam_session_list_data.sort(
                (a, b) => a.session_num - b.session_num,
            );
            exam_session_list = exam_session_list_data;

            // 设置默认选中的考试场次
            selected_exam_session = exam_session_list_data[0].session_id;

            // 获取监考列表信息
            await getInvigilationListInfo();
        } else if (data.status === -20) {
            action_toast.show("error", "用户无权访问");
            goto("/teacher/examManagement");
        } else {
            alert("获取考试场次信息失败");
            goto("/teacher/examManagement");
        }
    }

    //获取监考信息
    onMount(async () => {
        const pathParts = window.location.pathname.split("/");
        const lastSegment = pathParts[pathParts.length - 1];

        // 过滤空字符串（处理末尾带/的情况）
        const cleanLastSegment = lastSegment.replace(/^\s+|\s+$/g, "");

        if (/^\d+$/.test(cleanLastSegment)) {
            // 通过路径获取examID并查询考试详情
            const examID = parseInt(cleanLastSegment);

            // 获取考试场次信息
            await getInvigilationInfo(examID);

            // 获取监考信息
        } else {
            alert("考试" + cleanLastSegment + "不存在");
            goto("/teacher/examManagement");
        }
    });
</script>

<div class="invigilation-container">
    <div class="invigilation-header">
        <button class="back-button" 
            onclick={() => goto("/teacher/examManagement")}
        >
            <img class="normal-img" src={"/invigilation/icons/rollback.svg"} alt="返回" />
            <img class="hover-img" src={"/invigilation/icons/rollback_hover.svg"} alt="返回" />
        </button>
        <div class="exam-info-container">
            <span class="exam-name-text">{exam_name}</span>
            <div class="examinee-number-container">
                <img
                    class="examinee-number-icon"
                    src="/invigilation/icons/group.svg"
                    alt="考生人数"
                />
                <span class="exam-examinee-number">{exam_examinee_number ?? "-"}/</span>
                <span class="total-number">{total_examinee_number ?? "-"}</span>
            </div>
        </div>
        <div class="exam-session-info-container">
            <div class="exam-session-dropdown-container">
                <DropDownSparent
                    options={exam_session_list_option}
                    selected={selected_exam_session}
                    selectOptionFunc={onSelectExamSessionFunc}
                />
            </div>
            <span class="exam-session-time-text">考试时间：</span>
            <span class="exam-session-time-text"
                >{format_exam_start_time} - {format_exam_end_time}</span
            >
            <svg
                width="10"
                height="10"
                viewBox="0 0 80 80"
                xmlns="http://www.w3.org/2000/svg"
                style="margin-left:10px"
            >
                <circle
                    cx="40"
                    cy="40"
                    r="30"
                    fill={EXAM_SESSION_STATUS_COLOR_MAP[exam_session_status]}
                />
            </svg>
            <span class="exam-session-time-text"
                >{EXAM_SESSION_STATUS_MAP[exam_session_status]}</span
            >
        </div>
    </div>
    <div class="table-container">
        <div class="search-container">
            <SearchInput
                purpose_text={"考点"}
                place_holder={"请输入考点名称"}
                onSearchFunc={onSearchSiteFunc}
            />
            <SearchInput
                purpose_text={"考场"}
                place_holder={"请输入考场名称"}
                onSearchFunc={onSearchRoomFunc}
            />

            <div class="dropdown-container">
                <span class="dropdown-text">基本情况</span>
                <div class="dropdown">
                    <DropdownGray 
                        options={BASIC_EVAL_OPTIONS}
                        selected={selected_basic_eval}
                        selectOptionFunc={onSelectBasicEvalFunc}
                    />
                </div>
            </div>
        </div>
        <table class="invigilation-table">
            <thead>
                <tr>
                    <th>考点</th>
                    <th>考场</th>
                    <th>监考员</th>
                    <th>基本情况</th>
                    <th>考场记录</th>
                    <th>考生人数</th>
                    <th>缺考人数</th>
                    <th>操作</th>
                </tr>
            </thead>
            <tbody>
                {#each tableData as row}
                    <tr>
                        <td>{row.exam_site_name}</td>
                        <td>{row.exam_room_name}</td>
                        <td>{row.invigilator_names}</td>
                        <td>{BASIC_EVAL_MAP[row.basic_eval]}</td>
                        <td class="ellipsis-cell" title={row.record}>{row.record === null || row.record == "" ? "无" : row.record}</td>
                        <td>{row.examinee_num ?? "-"}</td>
                        <td>{row.absentee_num ?? "-"}</td>
                        <td><button class="action-button"
                            onclick={() => {

                                let permission = JSON.parse(localStorage.getItem("sidebarNavMap") ?? "");

                                for(let item of permission) {
                                    if(item.name != "examSiteManagement"){
                                        row.is_admin = false;
                                        continue;
                                    }

                                    row.is_admin = true;
                                    break;
                                }

                                localStorage.setItem(
                                    "invigilation_session_info",
                                    JSON.stringify(row),
                                );
                                goto(`/teacher/invigilationList/invigilation`);
                            }}
                        >进入监考</button></td>
                    </tr>
                {/each}
            </tbody>
        </table>
    </div>
    <div class="pagination-container">
        <Pagination
            total_page_num={total_page}
            current_page_num={current_page}
            {total_data_num}
            onPageChangeFunc={onNextOrLastPage}
            onPageChooseFunc={onPageChooseFunc}
            onPageSearchFunc={onSearchPageFunc}
            selectOptionFunc={onSelectPageSizeFunc}
        />
    </div>
</div>

<ActionToast bind:isShow={show_action_toast} bind:this={action_toast} />

<style lang="scss" scoped>
    .invigilation-container {
        position: relative;
        background-color: white;
        display: flex;
        flex-direction: column;
        width: 100%;
        height: 100%;
        overflow-y: auto;
        overflow-x: auto;
    }

    .back-button {
        width: 48px;
        height: 32px;
        border: none;
        background-color: rgba(230,230,230,1);
        border-radius: 4px;
        cursor: pointer;
        position: relative;

        .normal-img {
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            opacity: 1;
            transition: opacity 0.3s ease;
        }

        .hover-img {
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            opacity: 0;
            transition: opacity 0.3s ease;
        }

        &:hover {
            background-color: rgba(210,210,210,1);
            .normal-img {
                opacity: 0;
            }
            .hover-img {
                opacity: 1;
            }
        }
    }

    .exam-info-container {
        display: flex;
        flex-direction: row;
        align-items: center;
        padding: 0 0 0 42px;
    }

    .exam-session-info-container {
        display: flex;
        flex-direction: row;
        align-items: center;
        padding: 17px 0 0 42px;
    }

    .exam-name-text {
        max-width: 500px;
        font-size: 26px;
        font-weight: bold;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
    }

    .examinee-number-container {
        display: flex;
        flex-direction: row;
        align-items: center;
        .examinee-number-icon {
            padding: 0 10px 0 10px;
        }
        .total-number,
        .exam-examinee-number {
            font-size: 16px;
            color: #333333;
        }
    }

    .invigilation-header {
        min-width: 800px;
        display: flex;
        flex-direction: column;
        min-height: 150px;
        background-color: #F1F1F1;
        position: relative;
    }

    .invigilation-header::after {
        content: "";
        position: absolute;
        left: 1%;
        right: 1%;
        bottom: 0;
        height: 1px;
        background-color: #e5e5e5;
    }

    .table-container {
        min-height: 400px;
        background: #fff;
        border-radius: 8px;
        padding: 24px;
    }

    .dropdown-text {
        min-width: 60px;
        font-size: 14px;
        color: rgb(0, 0, 0, 0.6);
        padding: 0 15px 0 30px;
    }

    .search-container {
        min-width: 800px;
        display: flex;
        flex-direction: row;
        align-items: center;
        flex-wrap: wrap;
        gap: 10px;
        .dropdown-container {
            display: flex;
            flex-direction: row;
            align-items: center;
            min-width: 120px;
            .dropdown {
                min-width: 120px;
            }
        }
    }

    .invigilation-table {
        min-width: 800px;
        margin: 24px 0 0 0;
        width: 100%;
        border-collapse: collapse;
        font-size: 16px;
        background: #fff;
        th,
        td {
            padding: 12px 8px;
            text-align: center;
            border-bottom: 1px solid #f0f0f0;
            color: #333333;
            font-size: 14px;

            &.ellipsis-cell {
                max-width: 200px;  // 设置最大宽度，因为记录可能比较长，所以设置宽一些
                white-space: nowrap;  // 不换行
                overflow: hidden;  // 超出隐藏
                text-overflow: ellipsis;  // 显示省略号
                cursor: default;  // 鼠标样式
            }
        }
    }

    th {
        background: #f7f7f7;
        font-weight: bold;
    }

    .action-link {
        color: #1677ff;
        text-decoration: none;
        cursor: pointer;
    }

    .pagination-container {
        display: flex;
        justify-content: right;
        padding: 44px 20px 0 0;
    }

    .exam-session-dropdown-container {
        display: flex;
        flex-direction: row;
        align-items: center;
        min-width: 450px;
    }

    .exam-session-time-text {
        font-size: 14px;
        color: #333333;
    }

    .action-button {
        border: none;
        background-color: rgb(0, 0, 0, 0);
        color: #0052d9;
        cursor: pointer;
        font-size: 14px;
        min-width: 70px;
    }
    .action-button:hover {
        font-weight: bold;
    }
</style>
