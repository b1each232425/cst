<!-- 
 /*
 * @Author: Mayux dbs45412@163.com
 * @Date: 2025-04-18 11:48:06
 * @LastEditors: Mayux && 1243805308@qq.com
 * @LastEditTime: 2025-07-10 12:07:44
 * @FilePath: \tutorial-platform-fe\src\routes\teacher\examManagement\ExamRoomsSelectionPanel.svelte
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
        is_single = false,
        ids = [],
        onCancel = () => {
            console.log("取消选择");
        },
        onConfirm = (/** @type {any} */ selected_ids) => {
            console.log(selected_ids);
        },
        exam_start_time = new Date(),
        exam_end_time = new Date(),
        exam_id = 0,
    } = $props();

    let exam_rooms_list = $state([

    ]);

    let exam_sites_list = $state([
        {
            id:1,
            name:"测试考点1"
        },
        {
            id:2,
            name:"测试考点2"
        }
    ]);

    let option_list = $derived(generateOptions(exam_sites_list))

    //搜索参数
    let search_params = $state({
        name: "",
        page: 1,
        pageSize: 10,
    });

    let site_id = $state(0)

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

    /**
     * @type {{ id: any; invigilator_count: any; name?: any; exam_site_name?: any; capacity: any; }[]}
     */
    let selected_ids = $state([

    ]);

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

    let show_action_toast = $state(false);

    /**
     * @type {any}
     */
    let action_toast = $state(null);

    function getFilteredSelectedIds() {
        let filtered = selected_ids;
        if (selected_search_params.name) {
            filtered = selected_ids.filter(room => 
                (room.name && room.name.toLowerCase().includes(selected_search_params.name.toLowerCase())) ||
                (room.exam_site_name && room.exam_site_name.toLowerCase().includes(selected_search_params.name.toLowerCase()))
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

    function onSelectedSearch(value) {
        selected_search_params.name = value;
        selected_search_params.page = 1;
    }

    function onSelectedNextOrLastPage(is_next) {
        if (is_next && selected_search_params.page < selected_total_page) {
            selected_search_params.page += 1;
        }
        if (!is_next && selected_search_params.page > 1) {
            selected_search_params.page -= 1;
        }
    }

    function onSelectedPageChooseFunc(page) {
        selected_search_params.page = page;
    }

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
        searchExamRoom();
    }
    
    function backToViewMode() {
        is_selection_mode = false;
        selected_search_params.page = 1;
        selected_search_params.name = "";
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
            searchExamRoom();
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
            searchExamRoom();
        }
        if (!is_next && search_params.page > 1) {
            search_params.page -= 1;
            searchExamRoom();
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
        searchExamRoom();
    }

    /**
     * @param {string} value
     * 搜索
     */
    function onSearch(value) {
        search_params.name = value;

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

    //将考点列表转换成下拉框可用的数据
    /**
     * @param {any[]} exam_sites
     */
    function generateOptions(exam_sites){
        let options = [{
            value:0,
            label:"全部"
        }];

        exam_sites.forEach(site => {
            let option = {
                value:site.id,
                label:site.name,
            }
            options.push(option)
        });

        return options;
    }

    async function searchExamRoom() {
        loading = true;
        error = "";

        // 构建查询参数
        let query_params = new URLSearchParams();

        // 添加基础参数
        query_params.append("page", search_params.page.toString());
        query_params.append("pageSize", search_params.pageSize.toString());
        query_params.append("startTime", exam_start_time.toISOString().slice(0, 19).replace('T', ' '));
        query_params.append("endTime", exam_end_time.toISOString().slice(0, 19).replace('T', ' '));

        // 添加可选参数
        if (search_params.name) {
            query_params.append("searchText", search_params.name);
        }

        if(exam_id!==0){
            query_params.append("examId", exam_id.toString());
        }

        if(site_id!==0){
            query_params.append("siteID", site_id.toString());
        }

        const response = await fetch(
            `/api/admin/exam-room?${query_params.toString()}`,
            {
                method: "GET",
                credentials: 'include',
                headers: {
                    "Content-Type": "application/json",
                },
            },
        );

        const result = await response.json();

        if (result.status != 0) {
            error = result.msg || "搜索失败";
            exam_rooms_list = [];
            totals = 0;
            console.error(error);
            search_params.page = current_page;
            loading = false;
            return;
        }

        // 成功获取数据
        exam_rooms_list = result.data.rooms === null?[]:result.data.rooms;
        exam_sites_list = result.data.sites;
        totals = result.rowCount?result.rowCount:0;
        current_page = search_params.page;

        // 如果没有考场数据，直接返回
        if (!exam_rooms_list) {
            loading = false;
            return;
        }

        // 更新选中状态和监考员数量
        const selected_id_set = new Set(selected_ids.map(item => item.id));

        exam_rooms_list.forEach(exam_room => {
            const isSelected = selected_id_set.has(exam_room.id);
            exam_room.selected = isSelected;
            
            if (isSelected) {
                const selectedItem = selected_ids.find(item => item.id === exam_room.id);
                if (selectedItem) {
                    exam_room.invigilator_count = selectedItem.invigilator_count?selectedItem.invigilator_count:1;
                }
            }else{
                exam_room.invigilator_count = 1;
            }
        });

        is_all_selected = isAllSelected();
        loading = false;
    }

    // 切换全选状态
    function toggleSelectAll(e) {
        // 阻止默认事件处理
        e.preventDefault();

        if(is_single){
            alert("单人阅卷只能选择一名批阅员")
            is_all_selected = false
            return;
        }
        is_all_selected = !is_all_selected; // 切换全选状态
        exam_rooms_list.forEach((/** @type {{ selected: boolean; }} */ exam_room) => {
            exam_room.selected = is_all_selected; // 更新所有行的选中状态
        });

        //根据全选状态调整已选择的教师数组
        if (is_all_selected) {
            exam_rooms_list.forEach(
                (exam_room) => {
                    const exists = selected_ids.find(
                        (item) => item.id === exam_room.id,
                    );
                    if (!exists) {
                        selected_ids.push({
                            id: exam_room.id,
                            invigilator_count: exam_room.invigilator_count,
                            name:exam_room.name,
                            exam_site_name:exam_room.exam_site_name,
                            capacity: exam_room.capacity,
                        });
                    }
                },
            );
        } else {
            exam_rooms_list.forEach(
                /** @param {{ id: number }} exam_room */
                (exam_room) => {
                    const index = selected_ids.findIndex(
                        (item) => item.id === exam_room.id,
                    );
                    if (index !== -1) {
                        selected_ids.splice(index, 1);
                    }
                },
            );
        }
    }

    let initial_load = $derived(show_panel);

    /**
     * @param {any[]} search_ids
     */
    async function getRoomInfo(search_ids){
        error = "";

        // 构建查询参数
        let query_params = new URLSearchParams();

        query_params.append("selected_ids", search_ids.join(','));

        const response = await fetch(
            `/api/teacher/exam/roomsInfo?${query_params.toString()}`,
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
            action_toast?.show("error", "获取考场列表失败，请稍后重试");
            return;
        }

        result = await response.json();

        if (result.Status != 0) {
            error = result.msg || "获取考场列表失败";
            selected_ids = [];
            totals = 0;
            search_params.page = current_page;
            action_toast?.show("error", error);
        } else {
            selected_ids = result.Data === null ? [] : result.Data;
            selected_ids.forEach(sel => {
                const found = ids.find(item => item.id === sel.id);
                if (found && found.invigilator_count !== undefined) {
                    sel.invigilator_count = found.invigilator_count;
                }
            });
        }
    }

    //当打开面板时自动搜索试卷列表
    $effect(() => {
        if (show_panel && initial_load) {
            initial_load = false;

            selected_ids = [];
            
            /**
             * @type {any[]}
             */
            let search_ids = [];
            ids.forEach((element) => {
                search_ids.push(element.id)
            });

            getRoomInfo(search_ids);

            searchExamRoom();
        }
    });

    // 判断是否全选
    /**
     * @returns {boolean} 是否所有行都被选中
     */
    function isAllSelected() {
        if(exam_rooms_list!==null){
            return exam_rooms_list.every(
                (/** @type {{ selected: any; }} */ exam_room) => exam_room.selected,
            );
        }else{
            return false;
        }
    }
</script>

<div class={show_panel ? "exam_rooms-panel-container" : "hide"}>
    <div class="exam_rooms-panel">
        <div class="panel-header">
            <span>{is_selection_mode ? "选择考场" : "已选择考场"}</span>
            <button class="close-btn" onclick={() => {
                show_panel = false;
                search_params.page = 1;
                selected_ids = [];
                is_selection_mode = false;
                onCancel();
            }}>×</button>
        </div>
        <div class="panel-body">
            <div class="exam-time-container">
                <span class="exam-time-text">考试时间：</span>
                <span class="exam-time-text">{exam_start_time.toLocaleString()}</span>
                <span class="exam-time-text">-</span>
                <span class="exam-time-text">{exam_end_time.toLocaleString()}</span>
            </div>
            <div class="tip-container">
                <img src="/exam_list/tip.png" alt="提示" style="width: 15px;" />
                <span class="exam-tip-text">
                    考试时间更新后会清空已选择的考场，建议确认考试时间后再进行考场选择
                </span>
            </div>
            {#if !is_selection_mode}
                <!-- 已选考场模式 -->
                <div class="selected-rooms-container">
                    <div class="action-container">
                        <div class="exam_rooms-search-container">
                            <SearchInput
                                purpose_text={"搜索考场"}
                                place_holder={"请输入考点或考场名"}
                                onSearchFunc={onSelectedSearch}
                            ></SearchInput>
                        </div>
                        <div class="button-group">
                            <button class="add-btn" onclick={switchToSelectionMode}>
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
                                {#each current_page_selected_ids as room}
                                    <tr class="exam_room">
                                        <td>{room.name || "--"}</td>
                                        <td>{room.exam_site_name || "--"}</td>
                                        <td>{room.capacity || "--"}</td>
                                        <td>{room.invigilator_count || "--"}</td>
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
                <!-- 选择考场模式 -->
                <div class="action-container">
                    <div class="exam_rooms-search-container">
                        <SearchInput
                            purpose_text={"搜索考场"}
                            place_holder={"请输入考点或考场名"}
                            onSearchFunc={onSearch}
                        ></SearchInput>
                    </div>
                    <div style = "display:flex; flex-direction: row; align-items: center; justify-content: center;">
                        <span style="font-size: 14px; margin: 0 17px 0 10px;color:rgba(0,0,0,0.6); min-width:56px">
                            考点选择
                        </span>
                        <div class="dropdown-gray-container">
                            <DropdownGray
                                options={option_list}
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
                    </div>
                    <div class="button-group">
                        <button class="back-btn" onclick={backToViewMode}>返回考场列表</button>
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
                                        onchange={(e) => { toggleSelectAll(e) }}
                                        disabled={is_single}
                                        checked={is_all_selected}
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
                                            onchange={(event) => {
                                                const target = /** @type {HTMLInputElement} */ (event.target);
                                                if (target && target.checked) {
                                                    if (is_single) {
                                                        selected_ids.length = 0;
                                                        selected_ids.push({
                                                            id: exam_room.id,
                                                            invigilator_count: exam_room.invigilator_count,
                                                            capacity: exam_room.capacity,
                                                            name: exam_room.name,
                                                            exam_site_name: exam_room.exam_site_name,
                                                        });
                                                        exam_rooms_list.forEach((g) => {
                                                            g.selected = g.id === exam_room.id;
                                                        });
                                                    } else {
                                                        if (!selected_ids.find((g) => g.id === exam_room.id)) {
                                                            selected_ids.push({
                                                                id: exam_room.id,
                                                                invigilator_count: exam_room.invigilator_count,
                                                                capacity: exam_room.capacity,
                                                                name: exam_room.name,
                                                                exam_site_name: exam_room.exam_site_name,
                                                            });
                                                        }
                                                        exam_room.selected = true;
                                                    }
                                                    is_all_selected = isAllSelected();
                                                } else {
                                                    const index = selected_ids.findIndex((g) => g.id === exam_room.id);
                                                    if (index !== -1) {
                                                        selected_ids.splice(index, 1);
                                                    }
                                                    exam_room.selected = false;
                                                    is_all_selected = isAllSelected();
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
                                                    const selectedItem = selected_ids.find(item => item.id === exam_room.id);
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
            <button class="btn" onclick={() => {
                show_panel = false;
                search_params.page = 1;
                selected_ids = [];
                is_selection_mode = false;
                onCancel();
            }}>取消</button>
            <button class="btn save" onclick={() => {
                show_panel = false;
                is_selection_mode = false;
                onConfirm(selected_ids);
            }}>确定</button>
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

        th, td {
            font-size: 14px;
            color: var(--text-primary);
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
            font-weight: normal;
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
        position: relative;
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
                color: var(--red);
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
    }

    .action-container {
        display: flex;
        flex-direction: row;
        align-items: center;
        justify-content: space-between;
        padding: 0 16px;
    }

    .exam_rooms-search-container {
        flex: 0 0 350px;
    }

    .exam_rooms-selection-table-container {
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

    .exam-time-container {
        display: flex;
        flex-direction: row;
        align-items: center;
        justify-content: center;
        padding: 0 0 5px 0;
    }

    .tip-container {
        display: flex;
        flex-direction: row;
        align-items: center;
        justify-content: center;
        padding: 0 0 20px 0;
    }

    .exam-time-text {
        font-size: 16px;
    }
    .exam-tip-text {
        color: var(--text-primary);
        font-size: 12px;
    }

    .placeholder-text {
        color: var(--text-secondary);
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

        &:focus {
            border-color: var(--primary-hover);
        }

        &::-webkit-inner-spin-button,
        &::-webkit-outer-spin-button {
            -webkit-appearance: none;
            margin: 0;
        }
    }

    .exam_rooms-table-head {
        background-color: #ffffff;
        font-size: 14px;
        font-weight: normal;
        color: rgba(0, 0, 0, 0.3);
        border: none;
        padding: 8px;
        text-align: center;
        .table-head-row {
            height: 40px;
            .table-head {
                font-weight: normal;
                background: #fff;
                color: rgba(0, 0, 0, 0.3);
            }
        }
    }

    .add-btn {
        border: none;
        border-radius: 3px;
        background-color: var(--blue);
        width: 100px;
        height: 32px;
        color: white;
        font-size: 14px;
        cursor: pointer;
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
