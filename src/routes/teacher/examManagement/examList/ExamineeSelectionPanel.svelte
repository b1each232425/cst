<!-- 
 /*
 * @Author: Mayux dbs45412@163.com
 * @Date: 2025-04-18 11:48:06
 * @LastEditors: Mayux && 1243805308@qq.com
 * @LastEditTime: 2025-07-07 15:52:04
 * @FilePath: \tutorial-platform-fe\src\routes\teacher\examManagement\examList\ExamineeSelectionPanel.svelte
 * @Description: 考生选择面板
 * Copyright (c) 2025 by Mayux, All Rights Reserved. 
 */ 
 -->
<script>
    import ActionToast from "$lib/component/ActionToast.svelte";
    import Pagination from "$lib/component/Pagination.svelte";
    import SearchInput from "$lib/component/SearchInput.svelte";
    import StudentImportPanel from "../StudentImportPanel.svelte";

    let {
        show_panel = false,
        onCancel = () => {
            console.log("取消选择");
        },
        onConfirm = () => {},
        exam_id = 0,
    } = $props();

    /**
     * @type {any[]}
     */
    let examinee_list = $state([]);

    let exam_name = $state("");
    let exam_start_time = $state(new Date());
    let exam_end_time = $state(new Date());
    let exam_method = $state("00")

    /**
     * @type {any[]}
     */
    let selected_ids = $state([]);
    let examinee_number = $derived(selected_ids ? selected_ids.length : 0);

    //搜索参数
    let search_params = $state({
        name: "",
        page: 1,
        pageSize: 10,
    });

    //总数据条数
    let totals = $state(0);

    //总页数
    let total_page = $derived(
        totals / search_params.pageSize
            ? Math.ceil(totals / search_params.pageSize)
            : 1,
    );

    let current_page = $state(1);

    //是否加载中
    let loading = $state(false);

    //报错
    let error = $state("");

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

    // 全选/取消全选状态
    /**
     * @type {boolean} 表示是否全选
     */
    let is_all_selected = $state(false);

    let show_action_toast = $state(false);
    /** @type {ActionToast | null} */
    let action_toast = $state(null);

    let show_student_import_panel = $state(false);

    let student_import_panel = $state(null);

    let lockCheckTimer = $state(null);

    /**
     * @type {{ id: any; invigilator_count: any; capacity: any; }[]}
     */
    let room_selected_ids = $state([]);

    let total_capacity = $derived(
        room_selected_ids.reduce((sum, room) => sum + (room.capacity || 0), 0),
    );

    // 获取当前最大的serial_number
    function getMaxSerialNumber() {
        if (selected_ids.length === 0) return 0;
        return Math.max(...selected_ids.map((item) => item.serial_number || 0));
    }

    /**
     * @param {string} value
     * 搜索页数
     */
    function onSearchPageFunc(value) {
        const numericValue = parseFloat(value);
        if (isNaN(numericValue) || numericValue < 1 || numericValue === null) {
            search_params.page = 1;
        } else {
            search_params.page = numericValue;
        }

        //防抖逻辑
        if (page_search_timer) {
            clearTimeout(page_search_timer);
        }
        page_search_timer = setTimeout(() => {
            searchExaminee();
            page_search_timer = null;
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
        if (is_next && search_params.page < total_page) {
            search_params.page += 1;
            searchExaminee();
        }
        if (!is_next && search_params.page > 1) {
            search_params.page -= 1;
            searchExaminee();
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
        searchExaminee();
    }

    /**
     * @param {string} value
     * 搜索
     */
    function onSearch(value) {
        search_params.name = value === "" ? null : value;

        //防抖逻辑
        if (name_search_timer) {
            clearTimeout(name_search_timer);
        }
        name_search_timer = setTimeout(() => {
            name_search_timer = null;
            search_params.page = 1;
            searchExaminee();
        }, 300);
    }

    async function searchExaminee() {
        loading = true;
        error = "";

        // 构建查询参数
        let query_params = new URLSearchParams();

        // 添加基础参数
        query_params.append("page", search_params.page.toString());
        query_params.append("page_size", search_params.pageSize.toString());

        // 添加可选参数
        if (search_params.name) {
            query_params.append("search_text", search_params.name);
        }

        const response = await fetch(
            `/api/teacher/student/list?${query_params.toString()}`,
            {
                method: "GET",
                credentials: "include",
                headers: {
                    "Content-Type": "application/json",
                },
            },
        );

        let result = null;

        if (response.status === 404) {
            action_toast?.show("error", "搜索失败，请稍后重试");
            return;
        }

        result = await response.json();

        if (result.status != 0) {
            error = result.msg || "搜索失败";
            examinee_list = [];
            totals = 0;
            search_params.page = current_page;
            action_toast?.show("error", error);
        } else {
            examinee_list = result.data === null ? [] : result.data;
            totals = result.rowCount;
            current_page = search_params.page;

            if (examinee_list !== null) {
                //更新选中状态
                let selected_id_set = new Set(
                    selected_ids.map((item) => item.id),
                );
                examinee_list.forEach((examinee) => {
                    if (!selected_id_set.has(examinee.id)) {
                        examinee.selected = false;
                    } else {
                        examinee.selected = true;
                    }
                });
            }

            is_all_selected = isAllSelected();
        }
        loading = false;
    }

    let initial_load = $derived(show_panel);

    // 重新计算所有selected_ids的serial_number
    function recalculateSerialNumbers() {
        // 只在序号不连续或序号过大时重新计算
        let needsRecalculation = false;

        // 只检查第一个和最后一个序号，检查是否不连续，以及是否有超过10000的序号
        if (selected_ids.length > 0) {
            const firstItem = selected_ids[0];
            const lastItem = selected_ids[selected_ids.length - 1];

            needsRecalculation =
                (firstItem.serial_number !== 1 ||
                    lastItem.serial_number !== selected_ids.length) &&
                lastItem.serial_number > 10000;
        }

        if (needsRecalculation) {
            selected_ids = selected_ids.map((item, index) => ({
                ...item,
                serial_number: index + 1,
            }));
        }
    }

    // 切换全选状态
    function toggleSelectAll() {
        is_all_selected = !is_all_selected; // 切换全选状态
        examinee_list.forEach(
            (/** @type {{ selected: boolean; }} */ examinee) => {
                examinee.selected = is_all_selected; // 更新所有行的选中状态
            },
        );

        //根据全选状态调整已选择的数组
        if (is_all_selected) {
            examinee_list.forEach(
                /** @param {{ id: string }} examinee */
                (examinee) => {
                    const exists = selected_ids.find(
                        (item) => item.id === examinee.id,
                    );
                    if (!exists) {
                        selected_ids.push({
                            id: examinee.id,
                            serial_number: selected_ids.length + 1,
                        });
                    }
                },
            );
        } else {
            examinee_list.forEach(
                /** @param {{ id: string }} examinee */
                (examinee) => {
                    const index = selected_ids.findIndex(
                        (item) => item.id === examinee.id,
                    );
                    if (index !== -1) {
                        selected_ids.splice(index, 1);
                    }
                },
            );

            // 只在取消全选时检查是否需要重新计算序号
            recalculateSerialNumbers();
        }
        is_all_selected = isAllSelected();
    }

    //当打开面板时自动搜索考生列表
    $effect(() => {
        if (show_panel && initial_load) {
            initial_load = false;
            initializePanel();
        }
    });

    /**
     * @param {number[]} ids
     */
    async function getStudentInfo(ids){
        error = "";

        // 构建查询参数
        let query_params = new URLSearchParams();

        query_params.append("selected_ids", ids.join(','));

        const response = await fetch(
            `/api/teacher/exam/usersInfo?${query_params.toString()}`,
            {
                method: "GET",
                credentials: "include",
                headers: {
                    "Content-Type": "application/json",
                },
            },
        );

        let result = null;

        if (response.status === 404) {
            action_toast?.show("error", "获取学生列表失败，请稍后重试");
            return;
        }

        result = await response.json();

        if (result.Status != 0) {
            error = result.msg || "获取学生列表失败";
            selected_ids = [];
            totals = 0;
            search_params.page = current_page;
            action_toast?.show("error", error);
        } else {
            selected_ids = result.Data === null ? [] : result.Data;
        }
    }

    // 判断是否全选
    function isAllSelected() {
        if (examinee_list !== null) {
            return examinee_list.every((examinee) => examinee.selected);
        } else {
            return false;
        }
    }

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

    async function getExamDetails() {
        if (exam_id && typeof exam_id === "string") {
            console.error("examID is string");
            return;
        }

        // 获取考试详情
        const response = await fetch(
            `/api/teacher/exam/getExamDetails?exam_id=${exam_id}`,
            {
                method: "GET",
                credentials: "include",
            },
        );

        const data = await response.json();

        if (data.Status === 0) {
            //处理响应
            let exam_info = data.Data.exam_info;
            exam_id = exam_info.ID;
            exam_name = exam_info.Name;
            exam_method = exam_info.Mode;

            let exam_sessions = data.Data.exam_sessions;
            if (exam_sessions && exam_sessions.length > 0) {
                exam_start_time = new Date(
                    Math.min(
                        ...exam_sessions.map(
                            (
                                /** @type {{ start_time: string | number | Date; }} */ config,
                            ) => new Date(config.start_time).getTime(),
                        ),
                    ),
                );
                exam_end_time = new Date(
                    Math.max(
                        ...exam_sessions.map(
                            (
                                /** @type {{ end_time: string | number | Date; }} */ config,
                            ) => new Date(config.end_time).getTime(),
                        ),
                    ),
                );
            }

            room_selected_ids = data.Data.exam_rooms;

            let students = data.Data.students.imported_students;

            /**
             * @type {number[]}
             */
            let search_ids = []
            students.forEach((element) => {
                search_ids.push(element.id)
            });

            getStudentInfo(search_ids)

            is_selection_mode = false;

            // 启动计时器，每过段时间刷新用户对这个试卷的锁
            startLockCheckTimer();
        } else {
            action_toast?.show("error", "获取考试详情失败");
        }
    }

    /**
     * 获取考试锁
     */
    async function getExamLock() {
        const response = await fetch(`/api/exam/${exam_id}/lock`, {
            method: "GET",
            credentials: "include",
        });
        if (response.ok) {
            const result = await response.json();
            if (result.status == -18) {
                action_toast?.show("error", "考试正在被编辑，请稍后重试");
                return -18;
            } else if (result.status == -20) {
                action_toast?.show("error", "用户无权访问");
                return -20;
            }
            return 0;
        } else {
            const responseMsg = await response.text();
            console.error(`获取编辑考试权限失败：${responseMsg}`);
            return -1;
        }
    }

    // 退出后释放锁
    async function releaseLock() {
        const response = await fetch(`/api/exam/${exam_id}/lock`, {
            method: "DELETE",
            credentials: "include",
        });
        if (response.ok) {
            const result = await response.json();
            if (result.status == -19) {
                action_toast?.show("error", "释放编辑考试权限失败");
                return false;
            }
            return true;
        } else {
            const responseMsg = await response.text();
            action_toast?.show("error", "释放编辑考试权限失败");
            console.error(`释放编辑考试权限失败：${responseMsg}`);
            return false;
        }
    }

    // 启动计时器，每过段时间刷新用户对这个试卷的锁
    function startLockCheckTimer() {
        lockCheckTimer = setInterval(() => {
            refreshLock();
        }, 60000);
    }

    //  刷新用户对考试的锁
    async function refreshLock() {
        const response = await fetch(`/api/exam/${exam_id}/lock`, {
            method: "PUT",
            credentials: "include",
        });
        if (response.ok) {
            const result = await response.json();
            if (result.status == -1) {
                action_toast?.show("error", "获取编辑考试权限失败");
                clearInterval(lockCheckTimer);
                lockCheckTimer = null;
                return false;
            }
            return true;
        } else {
            const responseMsg = await response.text();
            action_toast?.show("error", "获取编辑考试权限失败");
            console.error(`获取编辑考试权限失败：${responseMsg}`);
            return false;
        }
    }

    async function initializePanel() {
        // 重置各搜索条件
        search_params = {
            name: "",
            page: 1,
            pageSize: 10,
        };

        // 重置存储的数组
        selected_ids = [];
        examinee_list = [];
        totals = 0;
        current_page = 1;
        is_all_selected = false;

        // 获取考试锁
        await getExamLock();

        // 获取考试详情
        await getExamDetails();

        // 搜索相关数据
        searchExaminee();
    }

    async function handleSave() {
        try {
            // 构建请求数据
            const requestData = {
                exam_id: exam_id,
                student: selected_ids.map((student) => ({
                    id: student.id,
                    serial_number: student.serial_number,
                })),
            };

            // 创建 FormData 对象
            const formData = new FormData();
            formData.append("data", JSON.stringify(requestData));

            // 发送请求
            const response = await fetch("/api/teacher/exam/examinee", {
                method: "PUT",
                credentials: "include",
                body: formData,
            });

            const result = await response.json();

            if (result.Status === 0) {
                action_toast?.show("success", "保存成功");
                show_panel = false;
                onConfirm();
            } else {
                action_toast?.show("error", result.Msg || "保存失败");
            }
        } catch (error) {
            console.error("保存失败:", error);
            action_toast?.show("error", "保存失败，请稍后重试");
        }
    }

    // 增加模式切换变量和已选考生分页、搜索相关变量
    let is_selection_mode = $state(false);
    
    let selected_search_params = $state({
        name: "",
        page: 1,
        pageSize: 10,
    });

    let selected_total_page = $derived(
        selected_ids.length / selected_search_params.pageSize
            ? Math.ceil(selected_ids.length / selected_search_params.pageSize)
            : 1,
    );

    function getFilteredSelectedIds() {
        let filtered = selected_ids;
        if (selected_search_params.name) {
            filtered = selected_ids.filter(examinee => 
                (examinee.official_name && examinee.official_name.toLowerCase().includes(selected_search_params.name.toLowerCase())) ||
                (examinee.phone && examinee.phone.includes(selected_search_params.name)) ||
                (examinee.id_card_no && examinee.id_card_no.includes(selected_search_params.name))
            );
        }
        return filtered;
    }

    function getCurrentPageSelectedIds() {
        const startIndex = (selected_search_params.page - 1) * selected_search_params.pageSize;
        const endIndex = startIndex + selected_search_params.pageSize;
        const filtered = filtered_selected_ids;
        return filtered.slice(startIndex, endIndex);
    }

    let filtered_selected_ids = $derived(getFilteredSelectedIds());

    let current_page_selected_ids = $derived(getCurrentPageSelectedIds());

    /** @param {string} value */
    function onSelectedSearch(value) {
        selected_search_params.name = value;
        selected_search_params.page = 1;
    }

    /** @param {boolean} is_next */
    function onSelectedNextOrLastPage(is_next) {
        if (is_next && selected_search_params.page < selected_total_page) {
            selected_search_params.page += 1;
        }
        if (!is_next && selected_search_params.page > 1) {
            selected_search_params.page -= 1;
        }
    }
    
    /** @param {number} page */
    function onSelectedPageChooseFunc(page) {
        selected_search_params.page = page;
    }

    /** @param {string} value */
    function onSelectedSearchPageFunc(value) {
        const numericValue = parseFloat(value);
        if (isNaN(numericValue) || numericValue < 1 || numericValue === null) {
            selected_search_params.page = 1;
        } else {
            selected_search_params.page = numericValue;
        }
    }

    function switchToSelectionMode() {
        is_selection_mode = true;
        search_params.page = 1;
        searchExaminee();
    }

    function backToViewMode() {
        is_selection_mode = false;
        selected_search_params.page = 1;
        selected_search_params.name = "";
    }
</script>

<div class={show_panel ? "examinee-panel-container" : "hide"}>
    <div class="examinee-panel">
        <div class="panel-header">
            <span class="panel-header-text">{is_selection_mode ? "选择考生" : "考生列表"}</span>
            <button
                class="close-btn"
                onclick={async () => {
                    if (lockCheckTimer) {
                        clearInterval(lockCheckTimer);
                        lockCheckTimer = null;
                    }
                    await releaseLock();
                    show_panel = false;
                    search_params.page = 1;
                    selected_ids = [];
                    onCancel();
                }}>×</button>
        </div>
        <div class="panel-body">
            <div class="exam-info">
                <div class="exam-info-row">
                    <b class="label">考试名称：</b>
                    <span>{exam_name}</span>
                </div>
                <div class="exam-info-row">
                    <b class="label">考试时段：</b>
                    <span>{exam_start_time.toLocaleString()} - {exam_end_time.toLocaleString()}</span>
                </div>
                {#if exam_method === "02"}
                    <div class="exam-info-row">
                        <b class="label">考场数量：</b>
                        <span>{room_selected_ids !== null ? room_selected_ids.length : 0}</span>
                    </div>
                    <div class="exam-info-row">
                        <b class="label">考场容量：</b>
                        <span>可容纳 {total_capacity} 名考生</span>
                    </div>
                {/if}
                <div class="exam-info-row">
                    <b class="label">考生数量：</b>
                    <span>{examinee_number}</span>
                </div>
            </div>
            {#if !is_selection_mode}
                <!-- 查看已选考生模式 -->
                <div class="selected-examinees-container">
                    <div class="action-container">
                        <div class="examinee-search-container">
                            <SearchInput
                                purpose_text={"搜索考生"}
                                place_holder={"请输姓名/手机号/身份证号"}
                                onSearchFunc={onSelectedSearch}
                            ></SearchInput>
                        </div>
                        <div class="button-group">
                            <button class="upload-file-button" onclick={switchToSelectionMode}>
                                添加考生
                            </button>
                        </div>
                    </div>
                    <div class="examinee-selection-table-container">
                        <table class="table">
                            <thead class="student-table-head">
                                <tr class="table-head-row">
                                    <th class="table-head">姓名</th>
                                    <th class="table-head">性别</th>
                                    <th class="table-head">手机号</th>
                                    <th class="table-head">身份证号</th>
                                </tr>
                            </thead>
                            <tbody>
                                {#each current_page_selected_ids as examinee}
                                    <tr class="examinee">
                                        <td>{examinee.official_name || "--"}</td>
                                        <td>{examinee.gender || "--"}</td>
                                        <td>{examinee.phone || "--"}</td>
                                        <td>{examinee.id_card_no || "--"}</td>
                                    </tr>
                                {/each}
                            </tbody>
                        </table>
                        {#if filtered_selected_ids.length === 0}
                            <div class="no-data-text">暂无数据</div>
                        {/if}
                    </div>
                    <div class="pagination-container">
                        <Pagination
                            show_per_page={false}
                            total_data_num={filtered_selected_ids.length}
                            total_page_num={selected_total_page}
                            current_page_num={selected_search_params.page}
                            onPageChangeFunc={onSelectedNextOrLastPage}
                            onPageSearchFunc={onSelectedSearchPageFunc}
                            onPageChooseFunc={onSelectedPageChooseFunc}
                        ></Pagination>
                    </div>
                </div>
            {:else}
                <!-- 选择考生模式 -->
                <div class="action-container">
                    <div class="examinee-search-container">
                        <SearchInput
                            purpose_text={"搜索考生"}
                            place_holder={"请输姓名/手机号/身份证号"}
                            onSearchFunc={onSearch}
                        ></SearchInput>
                    </div>
                    <div class="button-group">
                        <button class="back-btn" onclick={backToViewMode}>返回考生列表</button>
                        <button class="download-template-button" onclick={downloadTemplate}>
                            下载模板
                        </button>
                        <button class="upload-file-button" onclick={() => {
                            if (student_import_panel) {
                                student_import_panel.triggerFileInput();
                            }
                        }}>导入学生</button>
                    </div>
                </div>
                <div class="examinee-selection-table-container">
                    <table class="table">
                        <thead class="student-table-head">
                            <tr class="table-head-row">
                                <th class="table-head" style="width: 30px;">
                                    <input
                                        type="checkbox"
                                        class="custom-checkbox"
                                        onchange={toggleSelectAll}
                                        checked={is_all_selected}
                                    />
                                </th>
                                <th class="table-head">姓名</th>
                                <th class="table-head">性别</th>
                                <th class="table-head">手机号</th>
                                <th class="table-head">身份证号</th>
                            </tr>
                        </thead>
                        <tbody>
                            {#each examinee_list as examinee, index}
                                <tr
                                    class={`examinee ${examinee.selected ? "selected" : ""}`}
                                >
                                    <td>
                                        <input
                                            type="checkbox"
                                            class="custom-checkbox"
                                            checked={examinee.selected}
                                            onchange={/** @param {Event} event */
                                            (event) => {
                                                const target =
                                                    /** @type {HTMLInputElement} */ (
                                                        event.target
                                                    );
                                                if (target && target.checked) {
                                                    if (
                                                        !selected_ids.find(
                                                            (g) =>
                                                                g.id ===
                                                                examinee.id,
                                                        )
                                                    ) {
                                                        const currentMaxSerial =
                                                            getMaxSerialNumber();
                                                        selected_ids.push({
                                                            id: examinee.id,
                                                            official_name:examinee.official_name,
                                                            account:examinee.account,
                                                            gender:examinee.gender,
                                                            phone:examinee.phone,
                                                            id_card_no:examinee.id_card_no,
                                                            serial_number:
                                                                currentMaxSerial +
                                                                1,
                                                        });
                                                    }
                                                    examinee.selected = true;
                                                    is_all_selected =
                                                        isAllSelected();
                                                } else {
                                                    const index =
                                                        selected_ids.findIndex(
                                                            (g) =>
                                                                g.id ===
                                                                examinee.id,
                                                        );
                                                    if (index !== -1) {
                                                        selected_ids.splice(
                                                            index,
                                                            1,
                                                        );
                                                    }
                                                    examinee.selected = false;
                                                    is_all_selected =
                                                        isAllSelected();
                                                }
                                            }}
                                        />
                                    </td>
                                    <td>{examinee.official_name || "--"}</td>
                                    <td>{examinee.gender || "--"}</td>
                                    <td>{examinee.phone || "--"}</td>
                                    <td>{examinee.id_card_no || "--"}</td>
                                </tr>
                            {/each}
                        </tbody>
                    </table>
                    {#if examinee_list.length === 0}
                        <div class="no-data-text">暂无数据</div>
                    {/if}
                </div>
                <div class="pagination-container">
                    <span style="font-size: 12px; margin-right:10px">
                        已选 <span style="color: #00A870; margin:0 5px 0 5px;">{selected_ids.length}</span> 条
                    </span>
                    <Pagination
                        show_per_page={false}
                        total_data_num={totals}
                        total_page_num={total_page}
                        current_page_num={current_page}
                        onPageChangeFunc={onNextOrLastPage}
                        onPageSearchFunc={onSearchPageFunc}
                        {onPageChooseFunc}
                    ></Pagination>
                </div>
            {/if}
        </div>
        <div class="panel-footer">
            <button
                class="btn"
                onclick={async () => {
                    show_panel = false;
                    search_params.page = 1;
                    selected_ids = [];
                    if (lockCheckTimer) {
                        clearInterval(lockCheckTimer);
                        lockCheckTimer = null;
                    }
                    await releaseLock();
                    onCancel();
                }}>取消</button>
            <button
                class="btn save"
                onclick={async () => {
                    await handleSave();
                    if (lockCheckTimer) {
                        clearInterval(lockCheckTimer);
                        lockCheckTimer = null;
                    }
                    await releaseLock();
                }}>确定</button>
        </div>
    </div>
</div>

<ActionToast bind:isShow={show_action_toast} bind:this={action_toast} />

<StudentImportPanel
    onImport={(
        /** @type {any[]} */ success_student,
        /** @type {any} */ has_error,
    ) => {
        if (success_student && success_student.length > 0) {
            // 过滤掉已存在的id
            console.log(success_student)
            console.log(selected_ids)
            const newStudents = success_student
                .filter(
                    (/** @type {any} */ student) =>
                        !selected_ids.some((item) => item.id === student),
                )
                .map(
                    (
                        /** @type {any} */ student,
                        /** @type {number} */ index,
                    ) => ({
                        id: student,
                        serial_number: selected_ids.length + index + 1,
                    }),
                );

            // 更新selected_ids
            selected_ids = [...selected_ids, ...newStudents];

            searchExaminee();

            // 检查是否需要重新计算序号
            recalculateSerialNumbers();
        }

        if (!has_error) {
            show_student_import_panel = false;
        }
    }}
    onCancel={() => {
        show_student_import_panel = false;
    }}
    bind:show={show_student_import_panel}
    bind:this={student_import_panel}
/>

<style lang="scss" scoped>
    .hide {
        display: none;
    }

    .table {
        width: 100%;
        border-collapse: collapse;
        flex: 1;
        max-height: 40px;

        th,
        td {
            font-size: 14px;
            color:var(--text-primary);
            border: none;
            padding: 8px;
            text-align: center;
            overflow: visible;
            border-top: none;
            border-left: none;
            border-right: none;
            height: 40px;
            box-sizing: border-box;
        }

        td {
            border-bottom: 1px solid #ddd;
        }

        th {
            color: var(--text-disabled);
            background: #fafafa;
        }

        // 表格行样式
        tbody {
            tr {
                &:hover {
                    background-color: #e0f0ff;
                    cursor: pointer;
                }

                &.selected {
                    background-color: #d0e8ff;

                    &:hover {
                        background-color: #c0d8ff;
                    }
                }
            }
        }
    }

    .pagination-container {
        display: flex;
        justify-content: right;
        align-items: center;
        margin: 16px 0;
        padding: 0 16px;
    }

    .examinee-panel-container {
        position: fixed;
        top: 0%;
        left: 0%;
        width: 100vw;
        height: 100vh;
        background-color: rgba(0, 0, 0, 0.25); /* 半透明遮罩层 */
        display: flex;
        justify-content: center;
        align-items: center;
        z-index: 100;
    }

    .examinee-panel {
        width: 1000px;
        min-width: 800px;
        max-height: 90vh;
        overflow-y: auto;
        background-color: white;
        display: flex;
        flex-direction: column;
        border-radius: 12px;
        box-shadow: 0 8px 32px rgba(0, 0, 0, 0.12);
        z-index: 1001;
    }

    .panel-header {
        display: flex;
        flex-direction: row;
        align-items: center;
        justify-content: space-between;
        padding: 20px 24px;
        border-bottom: 1px solid #eee;
        color: var(--text-primary);
        font-size: 20px;
        font-weight: 600;

        .close-btn {
            background: none;
            border: none;
            font-size: 24px;
            width: 32px;
            height: 32px;
            text-align: center;
            color: #666;
            cursor: pointer;
            transition: color 0.2s;
            padding: 4px;
            border-radius: 4px;
            display: flex;
            align-items: center;
            justify-content: center;
            &:hover {
                color: #ff4d4f;
                background: rgba(0, 0, 0, 0.04);
            }
        }
    }

    .panel-body {
        padding: 24px;
        flex: 1;
        display: flex;
        flex-direction: column;
        min-height: 0;
        overflow-y: auto;

        .exam-info {
            font-size: 15px;
            margin-bottom: 16px;
            color: #444;
            background: #f5f7fa;
            padding: 12px 16px;
            border-radius: 8px;
            .exam-info-row {
                display: flex;
                align-items: center;
                margin-top: 8px;
                &:first-child {
                    margin-top: 0;
                }
                .label {
                    color: #222;
                    width: 100px;
                    text-align: right;
                    margin-right: 12px;
                }
            }
        }
    }

    .action-container {
        display: flex;
        flex-direction: row;
        align-items: center;
        justify-content: space-between;
        padding: 0 16px;
        margin-bottom: 16px;
    }

    .examinee-search-container {
        flex: 0 0 350px;
    }

    .button-group {
        display: flex;
        gap: 12px;
        align-items: center;
    }

    .examinee-selection-table-container {
        margin: 20px 0px 0 0px;
        flex: 1;
        min-height: 450px;
        position: relative;
        display: flex;
        flex-direction: column;
    }

    .btn {
        min-width: 80px;
        padding: 7px 18px;
        border-radius: 5px;
        border: 1.5px solid #d9d9d9;
        background: #fff;
        color: #0052d9;
        font-size: 15px;
        cursor: pointer;
        font-weight: 500;
        transition: all 0.2s;

        @media (max-width: 768px) {
            min-width: 70px;
            padding: 6px 16px;
            font-size: 14px;
        }

        &:hover {
            background: #f0f6ff;
        }
        &.save {
            background: var(--blue);
            color: #fff;
            border-color: var(--blue);
            &:hover {
                background: var(--primary-hover);
                border-color: var(--primary-hover);
            }
        }
        &:disabled {
            opacity: 0.6;
            cursor: not-allowed;
        }
    }

    .panel-footer {
        display: flex;
        justify-content: flex-end;
        gap: 16px;
        padding: 12px 24px 18px;
        border-top: 1px solid #eee;

        @media (max-width: 768px) {
            padding: 12px 16px 16px;
        }

        @media (max-width: 480px) {
            flex-direction: column;
            gap: 8px;

            .btn {
                width: 100%;
            }
        }
    }

    // 自定义复选框
    .custom-checkbox {
        width: 16px;
        height: 16px;
        border: 1px solid rgb(0, 0, 0, 0.3);
        cursor: pointer;
        accent-color: var(--blue);

        &:disabled {
            opacity: 0.6;
            cursor: not-allowed;
        }
    }

    .download-template-button {
        border: none;
        border-radius: 4px;
        background-color: #f5f5f5;
        padding: 0 16px;
        height: 32px;
        color: #165dff;
        font-size: 14px;
        cursor: pointer;
        transition: all 0.2s;

        &:hover {
            background-color: #e8e8e8;
        }
    }

    .upload-file-button {
        border: none;
        border-radius: 4px;
        background-color: #165dff;
        padding: 0 16px;
        height: 32px;
        color: white;
        font-size: 14px;
        cursor: pointer;
        transition: all 0.2s;

        &:hover {
            background-color: var(--primary-hover);
        }
    }

    .no-data-text {
        position: absolute;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        color: var(--text-disabled);
        font-size: 14px;
        font-weight: normal;
    }

    .student-table-head {
        background-color: #ffffff;
        font-size: 14px;
        font-weight: normal;
        color: var(--text-disabled);
        border: none;
        padding: 8px;
        text-align: center;
        .table-head-row {
            height: 40px;
            .table-head {
                font-weight: normal;
                background: #fff;
                color: var(--text-disabled);
            }
        }
    }

    .tabs-container {
        margin-top: 5px;
        flex: 1;
        display: flex;
        flex-direction: column;

        .tabs {
            display: flex;
            border-bottom: 1px solid #e8e8e8;
            margin-bottom: 16px;

            .tab-btn {
                padding: 12px 24px;
                font-size: 15px;
                color: var(--text-secondary);
                background: none;
                border: none;
                cursor: pointer;
                position: relative;
                transition: all 0.3s;

                &:hover {
                    color: var(--blue);
                }

                &.active {
                    color: var(--blue);
                    font-weight: 500;

                    &::after {
                        content: "";
                        position: absolute;
                        bottom: -1px;
                        left: 0;
                        width: 100%;
                        height: 2px;
                        background-color: var(--blue);
                    }
                }
            }
        }

        .tab-content {
            flex: 1;
            display: flex;
            flex-direction: column;
            overflow: hidden;
        }
    }

    .import-container {
        padding: 20px;
        display: flex;
        flex-direction: column;
        gap: 20px;
    }

    .back-btn {
        background: none;
        border: 1px solid #d9d9d9;
        padding: 6px 12px;
        height: 32px;
        border-radius: 4px;
        color: var(--text-primary);
        cursor: pointer;
        font-size: 14px;
        transition: all 0.2s;

        &:hover {
            background: #f5f5f5;
        }
    }

</style>
