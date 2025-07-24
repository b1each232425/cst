<script>
    // import ActionToast from "$lib/component/ActionToast.svelte";  //吐司
    // import Pagination from "$lib/component/Pagination.svelte";   //分页器
    // import SearchInput from "$lib/component/SearchInput.svelte"; //搜索框
    import StudentImportPanel from "./StudentImportPanel.svelte";

    let {
        show_panel = false,
        ids = [],
        onCancel = (/** @type {boolean} */ load_new_file) => {
            console.log("取消选择");
        },
        onConfirm = (/** @type {any} */ selected_ids) => {
            console.log(selected_ids);
        },
    } = $props();

    /**
     * @type {any[]}
     */
    let student_list = $state([]);
    
    // 是否处于选择模式（true为选择模式，false为查看已选择模式）
    let is_selection_mode = $state(false);


    //搜索参数
    let search_params = $state({
        name: "",
        page: 1,
        pageSize: 10,
    });

    /**
     * @type {any[]}
     */
    let selected_ids = $state([]);

    // 已选择学生的分页参数
    let selected_search_params = $state({
        name: "",
        page: 1,
        pageSize: 10,
    });

    // 已选择学生的总页数
    let selected_total_page = $derived(
        selected_ids.length / selected_search_params.pageSize
            ? Math.ceil(selected_ids.length / selected_search_params.pageSize)
            : 1,
    );

    function getFilteredSelectedIds() {
        let filtered = selected_ids;
        if (selected_search_params.name) {
            filtered = selected_ids.filter(student => 
                (student.official_name && student.official_name.toLowerCase().includes(selected_search_params.name.toLowerCase())) ||
                (student.phone && student.phone.includes(selected_search_params.name)) ||
                (student.id_card_no && student.id_card_no.includes(selected_search_params.name))
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

    // 过滤后的已选择学生列表
    let filtered_selected_ids = $derived(getFilteredSelectedIds());

    // 当前页显示的已选择学生
    let current_page_selected_ids = $derived(getCurrentPageSelectedIds());

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
     * @type {any}
     * 防抖计时器
     */
    let name_search_timer = null;

    /**
     * @type {any}
     * 防抖计时器
     */
    let page_search_timer = null;

    // 全选/取消全选状态
    /**
     * @type {boolean} 表示是否全选
     */
    let is_all_selected = $state(false);

    let show_action_toast = $state(false);
    /**等待组件封装
     * @type {import("$lib/component/ActionToast.svelte").default | null}
     */
    let action_toast = $state(null);

    let show_student_import_panel = $state(false);

    /**
     * @type {import("./StudentImportPanel.svelte").default & { triggerFileInput: () => void } | null}
     */
    let student_import_panel = $state(null);

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
        search_params.name = value === "" ? "" : value;

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

    /**
     * @param {string} value
     * 已选择学生搜索
     */
    function onSelectedSearch(value) {
        selected_search_params.name = value;
        selected_search_params.page = 1;
        // 搜索功能通过响应式更新自动触发，不需要额外调用
    }

    /**
     * @param {boolean} is_next
     * 已选择学生上一页/下一页
     */
    function onSelectedNextOrLastPage(is_next) {
        if (is_next && selected_search_params.page < selected_total_page) {
            selected_search_params.page += 1;
        }
        if (!is_next && selected_search_params.page > 1) {
            selected_search_params.page -= 1;
        }
    }

    /**
     * @param {number} page
     * 已选择学生页数跳转
     */
    function onSelectedPageChooseFunc(page) {
        selected_search_params.page = page;
    }

    /**
     * @param {string} value
     * 已选择学生搜索页数
     */
    function onSelectedSearchPageFunc(value) {
        const numericValue = parseFloat(value);
        if (isNaN(numericValue) || numericValue < 1 || numericValue === null) {
            selected_search_params.page = 1;
        } else {
            selected_search_params.page = numericValue;
        }
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
        if (search_params.name && search_params.name!=="") {
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
        ).then((response) => {
  if (response.status === 404) {
            action_toast?.show("error", "搜索失败，请稍后重试");
            return;
        }
        return response.json();
        }).then((result)=>{
  if (result.status != 0) {
            error = result.msg || "搜索失败";
            student_list = [];
            totals = 0;
            search_params.page = current_page;
            action_toast?.show("error", error);
        } else {
            student_list = result.data === null ? [] : result.data;
            totals = result.rowCount;
            current_page = search_params.page;

            if (student_list !== null) {
                //更新选中状态
                let selected_id_set = new Set(
                    selected_ids.map((item) => item.id),
                );
                student_list.forEach((student) => {
                    if (!selected_id_set.has(student.id)) {
                        student.selected = false;
                    } else {
                        student.selected = true;
                    }
                });
            }

            is_all_selected = isAllSelected();
        }
        loading = false;
        }).catch((error)=>{
            console.log(error);
            action_toast("获取学生列表失败");
        })

      
    }

    // 切换到选择模式
    function switchToSelectionMode() {
        is_selection_mode = true;
        search_params.page = 1;
        searchExaminee();
    }

    // 返回查看模式
    function backToViewMode() {
        is_selection_mode = false;
        // 重置已选择学生的分页参数
        selected_search_params.page = 1;
        selected_search_params.name = "";
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
    
    /**
     * @param {number[]} ids
     */
    async function getStudentInfo(ids){
        error = "";

        // 构建查询参数
        let query_params = new URLSearchParams();

        query_params.append("selected_ids", ids.join(','));

        await fetch(
            `/api/teacher/exam/usersInfo?${query_params.toString()}`,
            {
                method: "GET",
                credentials: "include",
                headers: {
                    "Content-Type": "application/json",
                },
            },
        ).then((response)=>{
 if (response.status === 404) {
            action_toast?.show("error", "获取学生列表失败，请稍后重试");
            return;
        }
        return response.json();
        }).then((result)=>{
if (result.Status != 0) {
            error = result.msg || "获取学生列表失败";
            selected_ids = [];
            totals = 0;
            search_params.page = current_page;
            action_toast?.show("error", error);
        } else {
            selected_ids = result.Data === null ? [] : result.Data;
        }
        }).catch((error)=>{
            console.log(error);
            error = "获取学生列表失败";
            selected_ids = [];
            totals = 0;
            search_params.page = current_page;
            action_toast?.show("error", error);
        });
        
    }

    // 切换全选状态
    function toggleSelectAll() {
        is_all_selected = !is_all_selected; // 切换全选状态
        student_list.forEach(
            (/** @type {{ selected: boolean; }} */ student) => {
                student.selected = is_all_selected; // 更新所有行的选中状态
            },
        );

        //根据全选状态调整已选择的数组
        if (is_all_selected) {
            student_list.forEach(
                (student) => {
                    const exists = selected_ids.find(
                        (item) => item.id === student.id,
                    );
                    if (!exists) {
                        selected_ids.push({
                            id: student.id,
                            official_name:student.official_name,
                            gender:student.gender,
                            account:student.account,
                            phone:student.phone,
                            id_card_no:student.id_card_no,
                            serial_number: selected_ids.length + 1,
                        });
                    }
                },
            );
        } else {
            student_list.forEach(
                /** @param {{ id: string }} student */
                (student) => {
                    const index = selected_ids.findIndex(
                        (item) => item.id === student.id,
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

    //当打开面板时自动搜索学生列表
    $effect(() => {
        if (show_panel && initial_load) {
            initial_load = false;

            //每次打开时将外部选中的id赋值给当前面板记录的已选中的id 在搜索前执行是为了能正常显示每个列表项的选中效果
            selected_ids = [];
            
            /**
             * @type {number[]}
             */
            let search_ids = [];
            ids.forEach((element) => {
                search_ids.push(element.id)
            });

            // 获取已选学生的信息
            getStudentInfo(search_ids)

            // 初始化为查看模式，不自动搜索
            is_selection_mode = false;
        }
    });

    // 判断是否全选
    function isAllSelected() {
        if (student_list !== null) {
            return student_list.every((student) => student.selected);
        } else {
            return false;
        }
    }

    async function downloadTemplate() {
            const response = await fetch(
                "/api/files/exam/d0a9rv6slh1c714h2fkg.xlsx",
                {
                    method: "GET",
                },
            ).then((response)=>{
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            return response.blob();
            }).then((blob)=>{
                 let filename = "考生导入模板.xlsx";
                
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
            }).catch((error) => { 
                  console.error("下载模板失败:", error);
            alert("下载模板失败，请稍后重试");
            });
    }
</script>

<div class={show_panel ? "examinee-panel-container" : "hide"}>
    <div class="examinee-panel">
        <div class="panel-header">
            <span class="panel-header-text">{is_selection_mode ? "选择学生" : "学生列表"}</span>
            <button
                class="close-btn"
                onclick={() => {
                    show_panel = false;
                    search_params.page = 1;
                    selected_ids = [];
                    onCancel(false);
                }}>×</button
            >
        </div>
        <div class="panel-body">
            {#if !is_selection_mode}
                <!-- 查看已选择模式 -->
                <div class="selected-examinees-container">
                    <div class="action-container">
                        <div class="examinee-search-container">
                            
                            <!-- 等待组件封装 <SearchInput
                                purpose_text={"搜索学生"}
                                place_holder={"请输姓名/手机号/身份证号"}
                                onSearchFunc={onSelectedSearch}
                            ></SearchInput> -->
                        </div>
                        <div class="button-group">
                            <button class="upload-file-button" onclick={switchToSelectionMode}>
                                选择学生
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
                                {#each current_page_selected_ids as student}
                                    <tr class="examinee">
                                        <td>{student.official_name || "--"}</td>
                                        <td>{student.gender || "--"}</td>
                                        <td>{student.phone || "--"}</td>
                                        <td>{student.id_card_no || "--"}</td>
                                    </tr>
                                {/each}
                            </tbody>
                        </table>
                        {#if filtered_selected_ids.length === 0}
                            <div class="no-data-text">暂无数据</div>
                        {/if}
                    </div>
                    <div class="pagination-container">
                        <span style="font-size: 12px; margin-right:10px">
                            已选 <span style="color: #00A870; margin:0 5px 0 5px;">{filtered_selected_ids.length}</span> 条
                        </span>
                        <!-- 等待组件封装<Pagination
                            show_per_page={false}
                            total_data_num={filtered_selected_ids.length}
                            total_page_num={selected_total_page}
                            current_page_num={selected_search_params.page}
                            onPageChangeFunc={onSelectedNextOrLastPage}
                            onPageSearchFunc={onSelectedSearchPageFunc}
                            onPageChooseFunc={onSelectedPageChooseFunc}
                        ></Pagination> -->
                    </div>
                </div>
            {:else}
                <!-- 选择模式 -->
                <div class="action-container">
                    <div class="examinee-search-container">
                        <!-- 等待组件封装<SearchInput
                            purpose_text={"搜索学生"}
                            place_holder={"请输姓名/手机号/身份证号"}
                            onSearchFunc={onSearch}
                        ></SearchInput> -->
                    </div>
                    <div class="button-group">
                        <button class="back-btn" onclick={backToViewMode}>返回</button>
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
                            {#each student_list as student, index}
                                <tr
                                    class={`examinee ${student.selected ? "selected" : ""}`}
                                >
                                    <td>
                                        <input
                                            type="checkbox"
                                            class="custom-checkbox"
                                            checked={student.selected}
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
                                                                student.id,
                                                        )
                                                    ) {
                                                        const currentMaxSerial =
                                                            getMaxSerialNumber();
                                                        selected_ids.push({
                                                            id: student.id,
                                                            official_name:student.official_name,
                                                            account:student.account,
                                                            gender:student.gender,
                                                            phone:student.phone,
                                                            id_card_no:student.id_card_no,
                                                            serial_number:
                                                                currentMaxSerial +
                                                                1,
                                                        });
                                                    }
                                                    student.selected = true;
                                                    is_all_selected =
                                                        isAllSelected();
                                                } else {
                                                    const index =
                                                        selected_ids.findIndex(
                                                            (g) =>
                                                                g.id ===
                                                                student.id,
                                                        );
                                                    if (index !== -1) {
                                                        selected_ids.splice(
                                                            index,
                                                            1,
                                                        );
                                                    }
                                                    student.selected = false;
                                                    is_all_selected =
                                                        isAllSelected();
                                                }
                                            }}
                                        />
                                    </td>
                                    <td
                                        >{student.official_name === null ||
                                        student.official_name === ""
                                            ? "--"
                                            : student.official_name}</td
                                    >
                                    <td
                                        >{student.gender === null ||
                                        student.gender === ""
                                            ? "--"
                                            : student.gender}</td
                                    >
                                    <td
                                        >{student.phone === null ||
                                        student.phone === ""
                                            ? "--"
                                            : student.phone}</td
                                    >
                                    <td
                                        >{student.id_card_no === null ||
                                        student.id_card_no === ""
                                            ? "--"
                                            : student.id_card_no}</td
                                    >
                                </tr>
                            {/each}
                        </tbody>
                    </table>
                    {#if student_list.length === 0}
                        <div class="no-data-text">暂无数据</div>
                    {/if}
                </div>
                <div class="pagination-container">
                    <span style="font-size: 12px; margin-right:10px">
                        已选 <span style="color: #00A870; margin:0 5px 0 5px;"
                            >{selected_ids.length}</span
                        > 条
                    </span>
                    <!-- <Pagination 等待组件封装
                        show_per_page={false}
                        total_data_num={totals}
                        total_page_num={total_page}
                        current_page_num={current_page}
                        onPageChangeFunc={onNextOrLastPage}
                        onPageSearchFunc={onSearchPageFunc}
                        {onPageChooseFunc}
                    ></Pagination> -->
                </div>
            {/if}
        </div>
        <div class="panel-footer">
            <button
                class="cancel-btn"
                onclick={() => {
                    show_panel = false;
                    search_params.page = 1;
                    selected_ids = [];
                    onCancel(false);
                }}>取消</button
            >
            <button
                class={selected_ids.length === 0 ? "save-btn-disabled" : "save-btn"}
                disabled={selected_ids.length === 0}
                onclick={() => {
                    show_panel = false;
                    search_params.page = 1;
                    onConfirm(selected_ids);
                }}>确定</button
            >
        </div>
    </div>
</div>
<!-- 等待组件封装
<ActionToast bind:isShow={show_action_toast} bind:this={action_toast} /> -->

<StudentImportPanel
    onImport={(/** @type {any[]} */ success_student, /** @type {boolean} */ has_error) => {
        if (success_student && success_student.length > 0) {
            // 过滤掉已存在的id
            const newStudents = success_student
                .filter(
                    (/** @type {any} */ student) =>
                        !selected_ids.some((item) => item.id === student),
                )
                .map((/** @type {any} */ student, /** @type {number} */ index) => ({
                    id: student,
                    serial_number: selected_ids.length + index + 1,
                }));

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
        table-layout: fixed;

        th,
        td {
            font-size: 14px;
            color: (0, 0, 0, 0.3);
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
            color: rgba(0, 0, 0, 0.3);
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
        color: #1a1a1a;
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
    }

    .action-container {
        display: flex;
        flex-direction: row;
        align-items: center;
        justify-content: space-between;
        padding: 0 16px;
    }

    .examinee-search-container {
        flex: 0 0 350px;
    }

    .button-group {
        display: flex;
        gap: 16px;
    }

    .back-btn {
        border: none;
        border-radius: 3px;
        background-color: #e3e3e3;
        width: 100px;
        height: 32px;
        color: #333;
        font-size: 14px;
        cursor: pointer;
    }

    .selected-examinees-container {
        display: flex;
        flex-direction: column;
        height: 100%;
    }

    .examinee-selection-table-container {
        margin: 20px 0px 0 0px;
        flex: 1;
        min-height: 440px;
        position: relative;
        display: flex;
        flex-direction: column;
        overflow-y: auto;
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
            background: #0052d9;
            color: #fff;
            border-color: #0052d9;
            &:hover {
                background: #2563eb;
                border-color: #2563eb;
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

    .cancel-btn {
        min-width: 80px;
        padding: 7px 18px;
        border-radius: 5px;
        border: 1.5px solid #d9d9d9;
        background: #fff;
        color: #333;
        font-size: 15px;
        cursor: pointer;
        font-weight: 500;
    }

    .save-btn {
        min-width: 80px;
        padding: 7px 18px;
        border-radius: 5px;
        border: none;
        background: #00a870;
        color: #fff;
        font-size: 15px;
        cursor: pointer;
        font-weight: 500;
    }

    .save-btn-disabled {
        min-width: 80px;
        padding: 7px 18px;
        border-radius: 5px;
        border: none;
        background: #cccccc;
        color: #fff;
        font-size: 15px;
        cursor: not-allowed;
        font-weight: 500;
    }

    // 自定义复选框
    .custom-checkbox {
        width: 16px;
        height: 16px;
        border: 1px solid rgb(0, 0, 0, 0.3);
        cursor: pointer;
        accent-color: #0052d9;

        &:disabled {
            opacity: 0.6;
            cursor: not-allowed;
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
    }

    .upload-file-button {
        border: none;
        border-radius: 3px;
        background-color: #165dff;
        width: 100px;
        height: 32px;
        color: white;
        font-size: 14px;
        cursor: pointer;
    }

    .no-data-text {
        position: absolute;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        color: #999;
        font-size: 14px;
        font-weight: normal;
    }

    .student-table-head {
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
                background: #fff;
                color: rgb(0, 0, 0, 0.3);
            }
        }
    }
</style>