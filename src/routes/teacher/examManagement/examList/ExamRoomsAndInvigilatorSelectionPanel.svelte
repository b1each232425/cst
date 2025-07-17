<!-- 
 /*
 * @Author: Mayux dbs45412@163.com
 * @Date: 2025-04-18 11:48:06
 * @LastEditors: Mayux && 1243805308@qq.com
 * @LastEditTime: 2025-07-08 15:06:25
 * @FilePath: \tutorial-platform-fe\src\routes\teacher\examManagement\examList\ExamRoomsAndInvigilatorSelectionPanel.svelte
 * @Description: 监考员选择面板
 * Copyright (c) 2025 by Mayux, All Rights Reserved. 
 */ 
 -->
<script>
    import ActionToast from "$lib/component/ActionToast.svelte";
    import DropdownGray from "$lib/component/DropdownGray.svelte";
    import Pagination from "$lib/component/Pagination.svelte";
    import SearchInput from "$lib/component/SearchInput.svelte";

    let {
        show_panel = false,
        onCancel = () => {
            console.log("取消选择");
        },
        onConfirm = () => {
            console.log(room_selected_ids);
        },
        exam_id = 0,
    } = $props();

    /** @type {any[]} */
    let exam_rooms_list = $state([]);

    let exam_sites_list = $state([
        {
            id: 1,
            name: "测试考点1",
        },
        {
            id: 2,
            name: "测试考点2",
        },
    ]);

    let site_id = $state(0)

    /** @type {any[]} */
    let proctors_list = $state([]);

    // 当前选中的标签
    let active_tab = $state("rooms");

    let option_list = $derived(generateOptions(exam_sites_list));

    //搜索参数
    let exam_room_search_params = $state({
        name: "",
        page: 1,
        pageSize: 10,
    });

    //总数据条数
    let exam_room_totals = $state(0);

    //总页数
    let exam_room_total_page = $derived(
        exam_room_totals / exam_room_search_params.pageSize
            ? Math.ceil(exam_room_totals / exam_room_search_params.pageSize)
            : 1,
    );

    let exam_room_current_page = $state(1);

    //是否加载中
    let exam_room_loading = $state(false);

    //是否加载中
    let invigilator_loading = $state(false);

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
    let exam_room_is_all_selected = $state(false);

    // 全选/取消全选状态
    /**
     * @type {boolean} 表示是否全选
     */
    let invigilator_is_all_selected = $state(false);

    /**
     * @type {{ id: any; invigilator_count: any; capacity: any; }[]}
     */
    let room_selected_ids = $state([]);

    let exam_name = $state("svelte入门实战考试");

    let examinee_number = $state(0);

    let total_capacity = $derived(
        room_selected_ids.reduce((sum, room) => sum + (room.capacity || 0), 0),
    );

    let need_invigilator_number = $derived(
        room_selected_ids.reduce(
            (sum, room) => sum + (room.invigilator_count || 0),
            0,
        ),
    );

    /** @type {any[]} */
    let invigilator_selected_ids = $state([]);

    //搜索参数
    let invigilator_search_params = $state({
        name: "",
        page: 1,
        pageSize: 10,
    });

    //总数据条数
    let invigilator_totals = $state(0);

    //总页数
    let invigilator_total_page = $derived(
        invigilator_totals / invigilator_search_params.pageSize
            ? Math.ceil(invigilator_totals / invigilator_search_params.pageSize)
            : 1,
    );

    let invigilator_current_page = $state(1);

    let show_action_toast = $state(false);

    let action_toast = $state(null);

    let lockCheckTimer = $state(null);

    let exam_method = $state("00");

    /**
     * @type {any[]}
     */
    let paper_configs = $state([])

    let exam_start_time = $derived(paper_configs.length > 0 
        ? new Date(Math.min(...paper_configs.map(config => new Date(config.start_time).getTime())))
        : new Date());
    let exam_end_time = $derived(paper_configs.length > 0
        ? new Date(Math.max(...paper_configs.map(config => new Date(config.end_time).getTime())))
        : new Date());

    // 1. 增加监考员选择模式切换变量和分页、搜索相关变量
    let is_invigilator_selection_mode = $state(false);

    let invigilator_selected_search_params = $state({
        name: "",
        page: 1,
        pageSize: 10,
    });

    let invigilator_selected_total_page = $derived(
        invigilator_selected_ids.length / invigilator_selected_search_params.pageSize
            ? Math.ceil(invigilator_selected_ids.length / invigilator_selected_search_params.pageSize)
            : 1,
    );

    function getFilteredSelectedInvigilators() {
        let filtered = invigilator_selected_ids;
        if (invigilator_selected_search_params.name) {
            filtered = invigilator_selected_ids.filter(invigilator =>
                (invigilator.name && invigilator.name.toLowerCase().includes(invigilator_selected_search_params.name.toLowerCase())) ||
                (invigilator.account && invigilator.account.includes(invigilator_selected_search_params.name)) ||
                (invigilator.mobile_phone && invigilator.mobile_phone.includes(invigilator_selected_search_params.name))
            );
        }
        return filtered;
    }

    let filtered_selected_invigilators = $derived(getFilteredSelectedInvigilators());

    function getCurrentPageSelectedInvigilators() {
        const startIndex = (invigilator_selected_search_params.page - 1) * invigilator_selected_search_params.pageSize;
        const endIndex = startIndex + invigilator_selected_search_params.pageSize;
        const filtered = typeof filtered_selected_invigilators === 'function' ? filtered_selected_invigilators : filtered_selected_invigilators;
        return filtered.slice(startIndex, endIndex);
    }

    let current_page_selected_invigilators = $derived(getCurrentPageSelectedInvigilators());

    /** @param {string} value */
    function onSelectedInvigilatorSearch(value) {
        invigilator_selected_search_params.name = value;
        invigilator_selected_search_params.page = 1;
    }

    /** @param {boolean} is_next */
    function onSelectedInvigilatorNextOrLastPage(is_next) {
        if (is_next && invigilator_selected_search_params.page < invigilator_selected_total_page) {
            invigilator_selected_search_params.page += 1;
        }
        if (!is_next && invigilator_selected_search_params.page > 1) {
            invigilator_selected_search_params.page -= 1;
        }
    }

    /** @param {number} page */
    function onSelectedInvigilatorPageChooseFunc(page) {
        invigilator_selected_search_params.page = page;
    }

    /** @param {string} value */
    function onSelectedInvigilatorSearchPageFunc(value) {
        const numericValue = parseFloat(value);
        if (isNaN(numericValue) || numericValue < 1 || numericValue === null) {
            invigilator_selected_search_params.page = 1;
        } else {
            invigilator_selected_search_params.page = numericValue;
        }
    }

    function switchToInvigilatorSelectionMode() {
        is_invigilator_selection_mode = true;
        invigilator_search_params.page = 1;
        searchTeacher();
    }

    function backToInvigilatorViewMode() {
        is_invigilator_selection_mode = false;
        invigilator_selected_search_params.page = 1;
        invigilator_selected_search_params.name = "";
    }
    
    /** @param {string|number} id */
    function removeSelectedInvigilator(id) {
        const index = invigilator_selected_ids.findIndex(item => item.id === id);
        if (index !== -1) {
            invigilator_selected_ids.splice(index, 1);
        }
    }

    // 增加考场选择模式切换变量和分页、搜索相关变量
    let is_room_selection_mode = $state(false);
    let room_selected_search_params = $state({
        name: "",
        page: 1,
        pageSize: 10,
    });
    let room_selected_total_page = $derived(
        room_selected_ids.length / room_selected_search_params.pageSize
            ? Math.ceil(room_selected_ids.length / room_selected_search_params.pageSize)
            : 1,
    );
    function getFilteredSelectedRooms() {
        let filtered = room_selected_ids;
        if (room_selected_search_params.name) {
            filtered = room_selected_ids.filter(room =>
                (room.name && room.name.toLowerCase().includes(room_selected_search_params.name.toLowerCase())) ||
                (room.exam_site_name && room.exam_site_name.toLowerCase().includes(room_selected_search_params.name.toLowerCase()))
            );
        }
        return filtered;
    }
    let filtered_selected_rooms = $derived(getFilteredSelectedRooms());
    function getCurrentPageSelectedRooms() {
        const startIndex = (room_selected_search_params.page - 1) * room_selected_search_params.pageSize;
        const endIndex = startIndex + room_selected_search_params.pageSize;
        const filtered = typeof filtered_selected_rooms === 'function' ? filtered_selected_rooms : filtered_selected_rooms;
        return filtered.slice(startIndex, endIndex);
    }
    let current_page_selected_rooms = $derived(getCurrentPageSelectedRooms());
    /** @param {string} value */
    function onSelectedRoomSearch(value) {
        room_selected_search_params.name = value;
        room_selected_search_params.page = 1;
    }
    /** @param {boolean} is_next */
    function onSelectedRoomNextOrLastPage(is_next) {
        if (is_next && room_selected_search_params.page < room_selected_total_page) {
            room_selected_search_params.page += 1;
        }
        if (!is_next && room_selected_search_params.page > 1) {
            room_selected_search_params.page -= 1;
        }
    }
    /** @param {number} page */
    function onSelectedRoomPageChooseFunc(page) {
        room_selected_search_params.page = page;
    }
    /** @param {string} value */
    function onSelectedRoomSearchPageFunc(value) {
        const numericValue = parseFloat(value);
        if (isNaN(numericValue) || numericValue < 1 || numericValue === null) {
            room_selected_search_params.page = 1;
        } else {
            room_selected_search_params.page = numericValue;
        }
    }
    function switchToRoomSelectionMode() {
        is_room_selection_mode = true;
        exam_room_search_params.page = 1;
        searchExamRoom();
    }
    function backToRoomViewMode() {
        is_room_selection_mode = false;
        room_selected_search_params.page = 1;
        room_selected_search_params.name = "";
    }

    /**
     * @param {string} value
     * 搜索页数
     */
    function onExamRoomSearchPageFunc(value) {
        const numericValue = parseFloat(value);
        if (isNaN(numericValue) || numericValue < 1 || numericValue === null) {
            exam_room_search_params.page = 1;
        } else {
            exam_room_search_params.page = numericValue;
        }

        //防抖逻辑
        if (page_search_timer) {
            clearTimeout(page_search_timer);
        }
        page_search_timer = setTimeout(() => {
            searchExamRoom();
            page_search_timer = null;
        }, 300);
    }

    /**
     * @param {boolean} is_next
     * 上一页/下一页
     */
    function onExamRoomNextOrLastPage(is_next) {
        if (exam_room_loading === true) {
            return;
        }
        if (is_next && exam_room_search_params.page < exam_room_total_page) {
            exam_room_search_params.page += 1;
            searchExamRoom();
        }
        if (!is_next && exam_room_search_params.page > 1) {
            exam_room_search_params.page -= 1;
            searchExamRoom();
        }
    }

    /**
     * @param {number} page
     * 页数跳转
     */
    function onExamRoomPageChooseFunc(page) {
        if (exam_room_loading === true) {
            return;
        }
        exam_room_search_params.page = page;
        searchExamRoom();
    }

    /**
     * @param {string} value
     * 搜索
     */
    function onExamRoomSearch(value) {
        exam_room_search_params.name = value;

        //防抖逻辑
        if (name_search_timer) {
            clearTimeout(name_search_timer);
        }
        name_search_timer = setTimeout(() => {
            name_search_timer = null;
            search_params.page = 1;
            searchExamRoom();
        }, 300);
    }

    /**
     * @param {string} value
     * 搜索页数
     */
    function onInvigilatorSearchPageFunc(value) {
        const numericValue = parseFloat(value);
        if (isNaN(numericValue) || numericValue < 1 || numericValue === null) {
            invigilator_search_params.page = 1;
        } else {
            invigilator_search_params.page = numericValue;
        }

        //防抖逻辑
        if (page_search_timer) {
            clearTimeout(page_search_timer);
        }
        page_search_timer = setTimeout(() => {
            searchTeacher();
            page_search_timer = null;
        }, 300);
    }

    /**
     * @param {boolean} is_next
     * 上一页/下一页
     */
    function onInvigilatorNextOrLastPage(is_next) {
        if (invigilator_loading === true) {
            return;
        }
        if (
            is_next &&
            invigilator_search_params.page < invigilator_total_page
        ) {
            invigilator_search_params.page += 1;
            searchTeacher();
        }
        if (!is_next && invigilator_search_params.page > 1) {
            invigilator_search_params.page -= 1;
            searchTeacher();
        }
    }

    /**
     * @param {number} page
     * 页数跳转
     */
    function onInvigilatorPageChooseFunc(page) {
        if (invigilator_loading === true) {
            return;
        }
        invigilator_search_params.page = page;
        searchTeacher();
    }

    /**
     * @param {string} value
     * 搜索
     */
    function onInvigilatorSearch(value) {
        invigilator_search_params.name = value;

        //防抖逻辑
        if (name_search_timer) {
            clearTimeout(name_search_timer);
        }
        name_search_timer = setTimeout(() => {
            name_search_timer = null;
            search_params.page = 1;
            searchTeacher();
        }, 300);
    }

    //将考点列表转换成下拉框可用的数据
    /**
     * @param {any[]} exam_sites
     */
    function generateOptions(exam_sites) {
        let options = [
            {
                value: 0,
                label: "全部",
            },
        ];

        exam_sites.forEach((site) => {
            let option = {
                value: site.id,
                label: site.name,
            };
            options.push(option);
        });

        return options;
    }

    async function searchExamRoom() {
        exam_room_loading = true;
        error = "";

        // 构建查询参数
        let query_params = new URLSearchParams();

        // 添加基础参数
        query_params.append("page", exam_room_search_params.page.toString());
        query_params.append(
            "pageSize",
            exam_room_search_params.pageSize.toString(),
        );
        query_params.append(
            "startTime",
            exam_start_time.toISOString().slice(0, 19).replace("T", " "),
        );
        query_params.append(
            "endTime",
            exam_end_time.toISOString().slice(0, 19).replace("T", " "),
        );

        // 添加可选参数
        if (exam_room_search_params.name) {
            query_params.append("searchText", exam_room_search_params.name);
        }

        if (exam_id !== 0) {
            query_params.append("examId", exam_id.toString());
        }

        if(site_id!==0){
            query_params.append("siteID", site_id.toString());
        }

        const response = await fetch(
            `/api/admin/exam-room?${query_params.toString()}`,
            {
                method: "GET",
                credentials: "include",
                headers: {
                    "Content-Type": "application/json",
                },
            },
        );

        const result = await response.json();

        if (result.status != 0) {
            error = result.msg || "搜索失败";
            exam_rooms_list = [];
            exam_room_totals = 0;
            console.error(error);
            exam_room_search_params.page = exam_room_current_page;
            exam_room_loading = false;
            return;
        }

        // 成功获取数据
        exam_rooms_list = result.data.rooms === null?[]:result.data.rooms;
        exam_sites_list = result.data.sites;
        exam_room_totals = result.rowCount ? result.rowCount : 0;
        exam_room_current_page = exam_room_search_params.page;

        // 如果没有考场数据，直接返回
        if (!exam_rooms_list) {
            exam_room_loading = false;
            return;
        }

        // 更新选中状态和监考员数量
        const selected_id_set = new Set(
            room_selected_ids.map((item) => item.id),
        );

        exam_rooms_list.forEach((exam_room) => {
            const isSelected = selected_id_set.has(exam_room.id);
            exam_room.selected = isSelected;

            if (isSelected) {
                const selectedItem = room_selected_ids.find(
                    (item) => item.id === exam_room.id,
                );
                if (selectedItem) {
                    exam_room.invigilator_count = selectedItem.invigilator_count
                        ? selectedItem.invigilator_count
                        : 1;
                }
            } else {
                exam_room.invigilator_count = 1;
            }
        });

        exam_room_is_all_selected = isExamRoomAllSelected();
        exam_room_loading = false;
    }

    async function searchTeacher() {
        invigilator_loading = true;
        error = "";

        // 构建查询参数
        let query_params = new URLSearchParams();

        // 添加基础参数
        query_params.append("page", invigilator_search_params.page.toString());
        query_params.append(
            "pageSize",
            invigilator_search_params.pageSize.toString(),
        );
        query_params.append("roles", "invigilator");

        // 添加可选参数
        if (invigilator_search_params.name) {
            query_params.append("name", invigilator_search_params.name);
        }

        const response = await fetch(
            `/api/teacher/exam/searchGraders?${query_params.toString()}`,
            {
                method: "GET",
                credentials: "include",
                headers: {
                    "Content-Type": "application/json",
                },
            },
        );

        const result = await response.json();

        if (result.Status != 0) {
            error = result.Msg || "搜索失败";
            proctors_list = [];
            invigilator_totals = 0;
            console.error(error);
            invigilator_search_params.page = invigilator_current_page;
        } else {
            proctors_list = result.Data.teacher_list === null?[]:result.Data.teacher_list;
            invigilator_totals = result.Data.total;
            invigilator_current_page = invigilator_search_params.page;

            if (proctors_list !== null) {

                //更新选中状态
                let selected_id_set = new Set(
                    invigilator_selected_ids.map((item) => item.id),
                );
                proctors_list.forEach((proctor) => {
                    if (!selected_id_set.has(proctor.id)) {
                        proctor.selected = false;
                    } else {
                        proctor.selected = true;
                    }
                });
            }

            invigilator_is_all_selected = isInvigilatorAllSelected();
        }
        invigilator_loading = false;
    }

    // 切换全选状态
    function toggleSelectAllExamRoom(e) {
        // 阻止默认事件处理
        e.preventDefault();

        exam_room_is_all_selected = !exam_room_is_all_selected; // 切换全选状态
        exam_rooms_list.forEach(
            (/** @type {{ selected: boolean; }} */ exam_room) => {
                exam_room.selected = exam_room_is_all_selected; // 更新所有行的选中状态
            },
        );

        //根据全选状态调整已选择的教师数组
        if (exam_room_is_all_selected) {
            exam_rooms_list.forEach(
                /** @type {{ id: number, name: string, exam_site_name: string, capacity: number, selected: boolean, invigilator_count: number }} */
                (exam_room) => {
                    const exists = room_selected_ids.find(
                        (item) => item.id === exam_room.id,
                    );
                    if (!exists) {
                        room_selected_ids.push({
                            id: exam_room.id,
                            invigilator_count: exam_room.invigilator_count,
                            capacity: exam_room.capacity,
                        });
                    }
                },
            );
        } else {
            exam_rooms_list.forEach(
                /** @param {{ id: number }} exam_room */
                (exam_room) => {
                    const index = room_selected_ids.findIndex(
                        (item) => item.id === exam_room.id,
                    );
                    if (index !== -1) {
                        room_selected_ids.splice(index, 1);
                    }
                },
            );
        }
    }

    // 切换全选状态
    function toggleSelectAllInvigilator(e) {
        // 阻止默认事件处理
        e.preventDefault();
        invigilator_is_all_selected = !invigilator_is_all_selected; // 切换全选状态
        proctors_list.forEach(
            (/** @type {{ selected: boolean; }} */ proctor) => {
                proctor.selected = invigilator_is_all_selected; // 更新所有行的选中状态
            },
        );

        //根据全选状态调整已选择的教师数组
        if (invigilator_is_all_selected) {
            proctors_list.forEach(
                (proctor) => {
                    const exists = invigilator_selected_ids.find(
                        (item) => item.id === proctor.id,
                    );
                    if (!exists) {
                        invigilator_selected_ids.push({
                            id: proctor.id,
                            official_name:proctor.name,
                            gender:proctor.gender,
                            account:proctor.account,
                            phone:proctor.phone,
                            id_card_no:proctor.id_card_no,
                        });
                    }
                },
            );
        } else {
            proctors_list.forEach(
                /** @param {{ id: number }} proctor */
                (proctor) => {
                    const index = invigilator_selected_ids.findIndex(
                        (item) => item.id === proctor.id,
                    );
                    if (index !== -1) {
                        invigilator_selected_ids.splice(index, 1);
                    }
                },
            );
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
                action_toast.show("error", "考试正在被编辑，请稍后重试");
                return -18;
            } else if (result.status == -20) {
                action_toast.show("error", "用户无权访问");
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
                action_toast.show("error", "释放编辑考试权限失败");
                return false;
            }
            return true;
        } else {
            const responseMsg = await response.text();
            action_toast.show("error", "释放编辑考试权限失败");
            console.error(`释放编辑考试权限失败：${responseMsg}`);
            return false;
        }
    }

    async function handleSave() {

        if (examinee_number > 0 && examinee_number < room_selected_ids.length && exam_method === "02") {
            action_toast.show("error", `考生总数不能小于考场总数`);
            return;
        }

        if (examinee_number > 0 && examinee_number > total_capacity && exam_method === "02") {
            action_toast.show("error", `考生总数不能超过考场总容量`);
            return;
        }

        if (invigilator_selected_ids.length > 0 && invigilator_selected_ids.length !== need_invigilator_number && exam_method === "02") {
            action_toast.show("error", `监考员总数不等于需求总数`);
            return;
        }

        try {
            // 构建请求数据
            const requestData = {
                exam_id: exam_id,
                exam_rooms: room_selected_ids.map(room => ({
                    id: room.id,
                    invigilator_count: room.invigilator_count
                })),
                invigilators: invigilator_selected_ids.map(invigilator => invigilator.id)
            };

            // 创建 FormData 对象
            const formData = new FormData();
            formData.append('data', JSON.stringify(requestData));

            // 发送请求
            const response = await fetch('/api/teacher/exam/examRoomsAndInviligator', {
                method: 'PUT',
                credentials: 'include',
                body: formData
            });

            const result = await response.json();

            if (result.Status === 0) {
                action_toast?.show('success', '保存成功');
                releaseLock();
                show_panel = false;
                onConfirm();
            } else {
                action_toast?.show('error', result.Msg || '保存失败');
            }
        } catch (error) {
            console.error('保存失败:', error);
            action_toast?.show('error', '保存失败，请稍后重试');
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
                action_toast.show("error", "获取编辑考试权限失败");
                clearInterval(lockCheckTimer);
                lockCheckTimer = null;
                return false;
            }
            return true;
        } else {
            const responseMsg = await response.text();
            action_toast.show("error", "获取编辑考试权限失败");
            console.error(`获取编辑考试权限失败：${responseMsg}`);
            return false;
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
            paper_configs = exam_sessions;

            let students = data.Data.students.imported_students;
            examinee_number = students ? students.length : 0;

            room_selected_ids = data.Data.exam_rooms;

            /**
             * @type {number[]}
             */
            let search_ids = []
            data.Data.invigilators.forEach((element) => {
                search_ids.push(element)
            });

            getUserInfo(search_ids);

            is_invigilator_selection_mode = false;

            // 启动计时器，每过段时间刷新用户对这个试卷的锁
            startLockCheckTimer();
        } else {
            action_toast.show("error", "获取考试详情失败");
        }
    }

    let initial_load = $derived(show_panel);

    //当打开面板时自动搜索试卷列表
    $effect(() => {
        if (show_panel && initial_load) {
            initial_load = false;
            initializePanel();
        }
    });

        /**
     * @param {number[]} ids
     */
    async function getUserInfo(ids){
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
            action_toast?.show("error", "获取用户列表失败，请稍后重试");
            return;
        }

        result = await response.json();

        if (result.Status != 0) {
            error = result.msg || "获取用户列表失败";
            invigilator_selected_ids = [];
            invigilator_totals = 0;
            action_toast?.show("error", error);
        } else {
            invigilator_selected_ids = result.Data === null ? [] : result.Data;
        }
    }

    async function initializePanel() {

        // 重置各搜索条件
        invigilator_search_params = {
            name: "",
            page: 1,
            pageSize: 10,
        };
        exam_room_search_params = {
            name: "",
            page: 1,
            pageSize: 10,
        };

        // 重置存储的数组
        room_selected_ids = [];
        invigilator_selected_ids = [];

        // 获取考试锁
        await getExamLock();

        // 获取考试详情
        await getExamDetails();

        // 搜索相关数据
        searchExamRoom();
        searchTeacher();
    }

    // 判断是否全选
    /**
     * @returns {boolean} 是否所有行都被选中
     */
    function isExamRoomAllSelected() {
        if (exam_rooms_list !== null) {
            return exam_rooms_list.every(
                (/** @type {{ selected: any; }} */ exam_room) =>
                    exam_room.selected,
            );
        } else {
            return false;
        }
    }

    // 判断是否全选
    /**
     * @returns {boolean} 是否所有行都被选中
     */
    function isInvigilatorAllSelected() {
        if (proctors_list !== null) {
            return proctors_list.every(
                (/** @type {{ selected: any; }} */ proctor) =>
                    proctor.selected,
            );
        } else {
            return false;
        }
    }
</script>

<div class={show_panel ? "exam_rooms-panel-container" : "hide"}>
    <div class="exam_rooms-panel">
        <div class="panel-header">
            <span class="panel-header-text">考场与监考员配置</span>
            <button
                class="close-btn"
                onclick={async () => {
                    if (lockCheckTimer) {
                        clearInterval(lockCheckTimer);
                        lockCheckTimer = null;
                    }
                    await releaseLock();
                    onCancel();
                    is_invigilator_selection_mode = false;
                    is_room_selection_mode = false;
                }}>×</button
            >
        </div>
        <div class="panel-body">
            <div class="exam-info">
                <div class="exam-info-row">
                    <b class="label">考试名称：</b>
                    <span>
                        {exam_name}
                    </span>
                </div>
                <div class="exam-info-row">
                    <b class="label">考试时段：</b>
                    <span>
                        {exam_start_time.toLocaleString()} - {exam_end_time.toLocaleString()}
                    </span>
                </div>
                <div class="exam-info-row">
                    <b class="label">考生数量：</b>
                    <span>
                        {examinee_number}
                    </span>
                </div>
                <div class="exam-info-row">
                    <b class="label">考场数量：</b>
                    <span>
                        {room_selected_ids !== null
                            ? room_selected_ids.length
                            : 0}
                    </span>
                </div>
                <div class="exam-info-row">
                    <b class="label">考场容量：</b>
                    <span>
                        可容纳 {total_capacity} 名考生，需要 {need_invigilator_number}
                        名监考员
                    </span>
                </div>
                <div class="exam-info-row">
                    <b class="label">监考员数量：</b>
                    <span> 已配置 {invigilator_selected_ids.length} 名 </span>
                </div>
            </div>

            <div class="tabs-container">
                <div class="tabs">
                    <button
                        class="tab-btn {active_tab === 'rooms' ? 'active' : ''}"
                        onclick={() => {
                            active_tab = "rooms";
                            is_invigilator_selection_mode = false;
                        }}
                    >
                        考场配置
                    </button>
                    <button
                        class="tab-btn {active_tab === 'invigilators'
                            ? 'active'
                            : ''}"
                        onclick={() => {
                            active_tab = "invigilators";
                            is_room_selection_mode = false;
                        }}
                    >
                        监考员配置
                    </button>
                </div>
                <div class="tab-content">
                    {#if active_tab === "rooms"}
                        {#if !is_room_selection_mode}
                            <!-- 已选考场模式 -->
                            <div class="selected-rooms-container">
                                <div class="action-container">
                                    <div class="exam_rooms-search-container" style="height: 32px;width:350px; margin-left:10px">
                                        <SearchInput
                                            purpose_text={"搜索考场"}
                                            place_holder={"请输入考点或考场名"}
                                            onSearchFunc={onSelectedRoomSearch}
                                        ></SearchInput>
                                    </div>
                                    <div class="button-group">
                                        <button class="add-btn" onclick={switchToRoomSelectionMode}>
                                            添加考场
                                        </button>
                                    </div>
                                </div>
                                <div class="exam_rooms-selection-table-container">
                                    <table class="table">
                                        <thead>
                                            <tr class="exam_rooms-table-head table-head-row">
                                                <th class="table-head">考场</th>
                                                <th class="table-head">所属考点</th>
                                                <th class="table-head">考场容量</th>
                                                <th class="table-head">监考员数量</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {#each current_page_selected_rooms as room}
                                                <tr class="exam_room">
                                                    <td>{room.name || "--"}</td>
                                                    <td>{room.exam_site_name || "--"}</td>
                                                    <td>{room.capacity || "--"}</td>
                                                    <td>{room.invigilator_count || "--"}</td>
                                                </tr>
                                            {/each}
                                        </tbody>
                                    </table>
                                    {#if filtered_selected_rooms.length === 0}
                                        <div class="no-data-text">暂无数据</div>
                                    {/if}
                                </div>
                                <div class="pagination-container">
                                    <Pagination
                                        show_per_page={false}
                                        total_data_num={filtered_selected_rooms.length}
                                        total_page_num={room_selected_total_page}
                                        current_page_num={room_selected_search_params.page}
                                        onPageChangeFunc={onSelectedRoomNextOrLastPage}
                                        onPageSearchFunc={onSelectedRoomSearchPageFunc}
                                        onPageChooseFunc={onSelectedRoomPageChooseFunc}
                                    ></Pagination>
                                </div>
                            </div>
                        {:else}
                            <!-- 选择考场模式 -->
                            <div class="action-container">
                                <div class="exam_rooms-search-container" style="height: 32px;width:350px; margin-left:10px">
                                    <SearchInput
                                        purpose_text={"搜索考场"}
                                        place_holder={"请输入考点或考场名"}
                                        onSearchFunc={onExamRoomSearch}
                                    ></SearchInput>
                                </div>
                                <span style="font-size: 14px; margin: 0 17px 0 10px;color:rgba(0,0,0,0.6); min-width:56px">
                                    考点选择
                                </span>
                                <div class="dropdown-gray-container">
                                    <DropdownGray options={option_list}
                                    selected={site_id}
                                    selectOptionFunc={
                                        (value) => {
                                            if (value >= 0) {
                                                site_id = value;
                                            } else {
                                                site_id = 0;
                                            }
                                            searchExamRoom()
                                        }
                                    }
                                    ></DropdownGray>
                                </div>
                                <div class="button-group">
                                    <button class="back-btn" onclick={backToRoomViewMode}>返回考场列表</button>
                                </div>
                            </div>
                            <div class="exam_rooms-selection-table-container">
                                <table class="table">
                                    <thead>
                                        <tr class="exam_rooms-table-head table-head-row">
                                            <th style="width: 30px;">
                                                <input
                                                    type="checkbox"
                                                    class="custom-checkbox"
                                                    onchange={(e) => { toggleSelectAllExamRoom(e) }}
                                                    checked={exam_room_is_all_selected}
                                                />
                                            </th>
                                            <th class="table-head">考场</th>
                                            <th class="table-head">所属考点</th>
                                            <th class="table-head">考场容量</th>
                                            <th class="table-head">监考员数量</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {#each exam_rooms_list as exam_room, index}
                                            <tr class={`exam_room ${exam_room.selected ? "selected" : ""}`}>
                                                <td>
                                                    <input
                                                        type="checkbox"
                                                        class="custom-checkbox"
                                                        checked={exam_room.selected}
                                                        onchange={/** @param {Event} event */
                                                        (event) => {
                                                            const target = /** @type {HTMLInputElement} */ (event.target);
                                                            if (target && target.checked) {
                                                                if (!room_selected_ids.find((g) => g.id === exam_room.id)) {
                                                                    room_selected_ids.push({
                                                                        id: exam_room.id,
                                                                        invigilator_count: exam_room.invigilator_count,
                                                                        capacity: exam_room.capacity,
                                                                        name: exam_room.name,
                                                                        exam_site_name: exam_room.exam_site_name,
                                                                    });
                                                                }
                                                                exam_room.selected = true;
                                                                exam_room_is_all_selected = isExamRoomAllSelected();
                                                            } else {
                                                                const index = room_selected_ids.findIndex((g) => g.id === exam_room.id);
                                                                if (index !== -1) {
                                                                    room_selected_ids.splice(index, 1);
                                                                }
                                                                exam_room.selected = false;
                                                                exam_room_is_all_selected = isExamRoomAllSelected();
                                                            }
                                                        }}
                                                    />
                                                </td>
                                                <td>{exam_room.name}</td>
                                                <td>{exam_room.exam_site_name}</td>
                                                <td>{exam_room.capacity}</td>
                                                <td>
                                                    {#if exam_room.selected}
                                                        <input
                                                            type="number"
                                                            class="invigilator-count-input"
                                                            min="1"
                                                            value={exam_room.invigilator_count}
                                                            onchange={(e) => {
                                                                const target = /** @type {HTMLInputElement} */ (e.target);
                                                                const value = parseInt(target.value);
                                                                if (value < 1) {
                                                                    target.value = "1";
                                                                    exam_room.invigilator_count = 1;
                                                                } else {
                                                                    exam_room.invigilator_count = value;
                                                                }
                                                                const selectedItem = room_selected_ids.find(item => item.id === exam_room.id);
                                                                if (selectedItem) {
                                                                    selectedItem.invigilator_count = exam_room.invigilator_count;
                                                                }
                                                            }}
                                                        />
                                                    {:else}
                                                        <span class="placeholder-text">--</span>
                                                    {/if}
                                                </td>
                                            </tr>
                                        {/each}
                                    </tbody>
                                </table>
                                {#if exam_rooms_list.length === 0}
                                    <div class="no-data-text">暂无数据</div>
                                {/if}
                                <div class="pagination-container">
                                    <span style="font-size: 12px; margin-right:10px">
                                        已选 <span style="color: #00A870; margin:0 5px 0 5px;">{room_selected_ids.length}</span> 条
                                    </span>
                                    <Pagination
                                        show_per_page={false}
                                        total_data_num={exam_room_totals}
                                        total_page_num={exam_room_total_page}
                                        current_page_num={exam_room_current_page}
                                        onPageChangeFunc={onExamRoomNextOrLastPage}
                                        onPageSearchFunc={onExamRoomSearchPageFunc}
                                        onPageChooseFunc={onExamRoomPageChooseFunc}
                                    ></Pagination>
                                </div>
                            </div>
                        {/if}
                    {:else}
                        {#if !is_invigilator_selection_mode}
                            <!-- 查看已选监考员模式 -->
                            <div class="selected-proctors-container">
                                <div class="action-container">
                                    <div class="proctors-search-container">
                                        <SearchInput
                                            purpose_text={"搜索监考员"}
                                            place_holder={"请输入姓名/账号/手机号"}
                                            onSearchFunc={onSelectedInvigilatorSearch}
                                        ></SearchInput>
                                    </div>
                                    <div class="button-group">
                                        <button class="add-btn" onclick={switchToInvigilatorSelectionMode}>
                                            添加监考员
                                        </button>
                                    </div>
                                </div>
                                <div class="proctors-selection-table-container">
                                    <table class="table">
                                        <thead class="proctors-table-head">
                                            <tr class="table-head-row">
                                                <th class="table-head">手机号</th>
                                                <th class="table-head">账号</th>
                                                <th class="table-head">姓名</th>
                                                <th class="table-head">性别</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {#each current_page_selected_invigilators as proctor}
                                                <tr class="proctor">
                                                    <td>{proctor.mobile_phone || "--"}</td>
                                                    <td>{proctor.account || "--"}</td>
                                                    <td>{proctor.official_name || "--"}</td>
                                                    <td>{proctor.gender || "--"}</td>
                                                </tr>
                                            {/each}
                                        </tbody>
                                    </table>
                                    {#if filtered_selected_invigilators.length === 0}
                                        <div class="no-data-text">暂无数据</div>
                                    {/if}
                                </div>
                                <div class="pagination-container">
                                    <span style="font-size: 12px; margin-right:10px">
                                        已选 <span style="color: #00A870; margin:0 5px 0 5px;">{filtered_selected_invigilators.length}</span> 条
                                    </span>
                                    <Pagination
                                        show_per_page={false}
                                        total_data_num={filtered_selected_invigilators.length}
                                        total_page_num={invigilator_selected_total_page}
                                        current_page_num={invigilator_selected_search_params.page}
                                        onPageChangeFunc={onSelectedInvigilatorNextOrLastPage}
                                        onPageSearchFunc={onSelectedInvigilatorSearchPageFunc}
                                        onPageChooseFunc={onSelectedInvigilatorPageChooseFunc}
                                    ></Pagination>
                                </div>
                            </div>
                        {:else}
                            <!-- 选择监考员模式 -->
                            <div class="action-container">
                                <div class="proctors-search-container">
                                    <SearchInput
                                        purpose_text={"搜索监考员"}
                                        place_holder={"请输入姓名/账号/手机号"}
                                        onSearchFunc={onInvigilatorSearch}
                                    ></SearchInput>
                                </div>
                                <div class="button-group">
                                    <button class="back-btn" onclick={backToInvigilatorViewMode}>返回监考员列表</button>
                                </div>
                            </div>
                            <div class="proctors-selection-table-container">
                                <table class="table">
                                    <thead class="proctors-table-head">
                                        <tr class="table-head-row">
                                            <th class="table-head" style="width: 30px;">
                                                <input
                                                    type="checkbox"
                                                    class="custom-checkbox"
                                                    onchange={(e)=>{toggleSelectAllInvigilator(e)}}
                                                    checked={invigilator_is_all_selected}
                                                />
                                            </th>
                                            <th class="table-head">手机号</th>
                                            <th class="table-head">账号</th>
                                            <th class="table-head">姓名</th>
                                            <th class="table-head">性别</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {#each proctors_list as proctor, index}
                                            <tr class={`proctor ${proctor.selected ? "selected" : ""}`}> 
                                                <td>
                                                    <input
                                                        type="checkbox"
                                                        class="custom-checkbox"
                                                        checked={proctor.selected}
                                                        onchange={(event) => {
                                                            const target = /** @type {HTMLInputElement} */ (event.target);
                                                            if (target && target.checked) {
                                                                if (!invigilator_selected_ids.find((g) => g.id === proctor.id)) {
                                                                    invigilator_selected_ids.push({
                                                                        id: proctor.id,
                                                                        official_name: proctor.name,
                                                                        account: proctor.account,
                                                                        mobile_phone: proctor.mobile_phone,
                                                                        gender: proctor.gender,
                                                                    });
                                                                }
                                                                proctor.selected = true;
                                                                invigilator_is_all_selected = isInvigilatorAllSelected();
                                                            } else {
                                                                const index = invigilator_selected_ids.findIndex((g) => g.id === proctor.id);
                                                                if (index !== -1) {
                                                                    invigilator_selected_ids.splice(index, 1);
                                                                }
                                                                proctor.selected = false;
                                                                invigilator_is_all_selected = isInvigilatorAllSelected();
                                                            }
                                                        }}
                                                    />
                                                </td>
                                                <td>{proctor.mobile_phone === null || proctor.mobile_phone === "" ? "--" : proctor.mobile_phone}</td>
                                                <td>{proctor.account === null || proctor.account === ""? "--" : proctor.account}</td>
                                                <td>{proctor.name === null || proctor.name === "" ? "--" : proctor.name}</td>
                                                <td>{proctor.gender === null || proctor.gender === "" ? "--" : proctor.gender}</td>
                                            </tr>
                                        {/each}
                                    </tbody>
                                </table>
                                {#if proctors_list.length === 0}
                                    <div class="no-data-text">暂无数据</div>
                                {/if}
                            </div>
                            <div class="pagination-container">
                                <span style="font-size: 12px; margin-right:10px">
                                    已选 <span style="color: #00A870; margin:0 5px 0 5px;">{invigilator_selected_ids.length}</span> 条
                                </span>
                                <Pagination
                                    show_per_page={false}
                                    total_data_num={invigilator_totals}
                                    total_page_num={invigilator_total_page}
                                    current_page_num={invigilator_current_page}
                                    onPageChangeFunc={onInvigilatorNextOrLastPage}
                                    onPageSearchFunc={onInvigilatorSearchPageFunc}
                                    onPageChooseFunc={onInvigilatorPageChooseFunc}
                                ></Pagination>
                            </div>
                        {/if}
                    {/if}
                </div>
            </div>
        </div>
        <div class="panel-footer">
            <button
                class="btn"
                onclick={async () => {
                    show_panel = false;
                    exam_room_search_params.page = 1;
                    room_selected_ids = [];
                    if (lockCheckTimer) {
                        clearInterval(lockCheckTimer);
                        lockCheckTimer = null;
                    }
                    await releaseLock();
                    onCancel();
                    is_invigilator_selection_mode = false;
                    is_room_selection_mode = false;
                }}>取消</button
            >
            <button
                class="btn save"
                onclick={async () => {
                    await handleSave()
                    if (lockCheckTimer) {
                        clearInterval(lockCheckTimer);
                        lockCheckTimer = null;
                    }
                    is_invigilator_selection_mode = false;
                    is_room_selection_mode = false;
                }}>确定</button
            >
        </div>
    </div>
</div>

<ActionToast bind:isShow={show_action_toast} bind:this={action_toast} />

<style lang="scss" scoped>
    .hide {
        display: none;
    }

    .table {
        width: 100%;
        border-collapse: collapse;
        flex: 1;
        max-height: 40px;

        th {
            font-size: 14px;
            font-weight: normal;
            color: var(--text-disabled);
            border: none;
            height: 40px;
            background-color: #ffffff;
            position: sticky;
            top: 0;
            z-index: 1;
        }

        td {
            font-size: 14px;
            color: var(--text-primary);
            border: none;
            padding: 8px;
            text-align: center;
            overflow: visible;
            border-top: none;
            border-bottom: 1px solid #ddd;
            border-left: none;
            border-right: none;
            height: 40px;
            box-sizing: border-box;
        }

        // 表格行样式
        tbody {
            tr {
                height: 40px;
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
        margin: 30px 0px 5px 0;
    }

    .exam_rooms-panel-container {
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

    .exam_rooms-panel {
        width: 1000px;
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
                color: var(--red);
                background: rgba(0, 0, 0, 0.04);
            }
        }
    }

    .panel-body {
        padding: 24px;
        overflow-y: auto;
        flex: 1;
        display: flex;
        flex-direction: column;
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
    }

    .exam_rooms-selection-table-container {
        margin: 20px 0px 0 0px;
        flex: 1;
        min-height: 450px;
        overflow-y: auto;
        position: relative;
    }

    .btn {
        min-width: 80px;
        padding: 7px 18px;
        border-radius: 5px;
        border: 1.5px solid #d9d9d9;
        background: #fff;
        color: var(--blue);
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

    .dropdown-gray-container {
        min-width: 200px;
        max-width: 300px;
    }

    .invigilator-count-input {
        width: 60px;
        height: 24px;
        border: 1px solid #d7d7d7;
        border-radius: 2px;
        text-align: center;
        outline: none;
        padding: 0;
        margin: 0;
        vertical-align: middle;

        &:focus {
            border-color: var(--blue);
        }

        &::-webkit-inner-spin-button,
        &::-webkit-outer-spin-button {
            -webkit-appearance: none;
            margin: 0;
        }
    }

    .tip-container {
        display: flex;
        flex-direction: row;
        align-items: center;
        justify-content: center;
        padding: 0 0 20px 0;
    }
    .exam-tip-text {
        color: var(--text-primary);
        font-size: 12px;
    }

    .placeholder-text {
        color: var(--text-disabled);
        font-size: 14px;
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
                color: #666;
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

    .invigilators-content {
        flex: 1;
        display: flex;
        justify-content: center;
        align-items: center;
    }

    .proctors-selection-table-container {
        margin: 20px 0px 0 0px;
        min-height: 450px;
        overflow-y: auto;
        position: relative;
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

    .add-btn {
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

    .action-container {
        display: flex;
        flex-direction: row;
        align-items: center;
        justify-content: space-between;
        padding: 0 16px;
        margin-bottom: 16px;
    }
</style>
