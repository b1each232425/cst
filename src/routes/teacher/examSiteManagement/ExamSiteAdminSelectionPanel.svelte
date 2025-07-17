<!-- 
 /*
 * @Author: Mayux dbs45412@163.com
 * @Date: 2025-04-18 11:48:06
 * @LastEditors: Zpekii 3156752796@qq.com
 * @LastEditTime: 2025-06-18 10:22:58
 * @FilePath: \exam-fe\src\routes\teacher\examSiteManagement\ExamSiteAdminSelectionPanel.svelte
 * @Description: 考试负责人选择面板
 * Copyright (c) 2025 by Mayux, All Rights Reserved. 
 */ 
 -->
<script>
    import Pagination from "$lib/component/Pagination.svelte";
    import SearchInput from "$lib/component/SearchInput.svelte";

    let {
        show_panel = false,
        is_single = true,
        ids = [
            {
                id: 0,
                name: "",
            },
        ],
        onCancel = () => {
            console.log("取消选择");
        },
        onConfirm = (/** @type {any} */ selected_ids) => {
            console.log(selected_ids);
        },
    } = $props();

    let graders_list = $state([]);

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

    let selected_ids = $state([
        {
            id: 0,
            name: "",
        },
    ]);

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
            searchTeacher();
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
            searchTeacher();
        }
        if (!is_next && search_params.page > 1) {
            search_params.page -= 1;
            searchTeacher();
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
        searchTeacher();
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
            searchTeacher();
        }, 300);
    }

    async function searchTeacher() {
        loading = true;
        error = "";

        // 构建查询参数
        let query_params = new URLSearchParams();

        // 添加基础参数
        query_params.append("page", search_params.page.toString());
        query_params.append("pageSize", search_params.pageSize.toString());
        query_params.append("roles", "examSiteSupervisor");

        // 添加可选参数
        if (search_params.name) {
            query_params.append("name", search_params.name);
        }

        const response = await fetch(
            `/api/teacher/exam/searchGraders?${query_params.toString()}`,
            {
                method: "GET",
                credentials: 'include',
                headers: {
                    "Content-Type": "application/json",
                },
            },
        );

        const result = await response.json();

        if (result.Status != 0) {
            error = result.Msg || "搜索失败";
            graders_list = [];
            totals = 0;
            console.error(error);
            search_params.page = current_page;
        } else {
            graders_list = result.Data.teacher_list;
            totals = result.Data.total;
            current_page = search_params.page;

            if (graders_list !== null) {

                //更新选中状态
                let selected_id_set = new Set(selected_ids.map((item) => item.id));
                graders_list.forEach((grader) => {
                    if (!selected_id_set.has(grader.id)) {
                        grader.selected = false;
                    } else {
                        grader.selected = true;
                    }
                });
            }

            is_all_selected = isAllSelected();
        }
        loading = false;
    }

    // 切换全选状态
    function toggleSelectAll(e) {
        // 阻止默认事件处理
        e.preventDefault();

        if(is_single){
            alert("只能选择一名考试负责人")
            is_all_selected = false
            return;
        }
        is_all_selected = !is_all_selected; // 切换全选状态
        graders_list.forEach((/** @type {{ selected: boolean; }} */ grader) => {
            grader.selected = is_all_selected; // 更新所有行的选中状态
        });

        //根据全选状态调整已选择的教师数组
        if (is_all_selected) {
            graders_list.forEach(
                /** @param {{ id: number, name: string, account: string }} grader */
                (grader) => {
                    const exists = selected_ids.find(
                        (item) => item.id === grader.id,
                    );
                    if (!exists) {
                        selected_ids.push({
                            id: grader.id,
                            name:
                                grader.name === null
                                    ? grader.account
                                    : grader.name,
                        });
                    }
                },
            );
        } else {
            graders_list.forEach(
                /** @param {{ id: number }} grader */
                (grader) => {
                    const index = selected_ids.findIndex(
                        (item) => item.id === grader.id,
                    );
                    if (index !== -1) {
                        selected_ids.splice(index, 1);
                    }
                },
            );
        }
    }

    let initial_load = $derived(show_panel);

    //当打开面板时自动搜索试卷列表
    $effect(() => {
        if (show_panel && initial_load) {
            initial_load = false;

            //每次打开时将外部选中的id赋值给当前面板记录的已选中的id 在搜索前执行是为了能正常显示每个列表项的选中效果
            selected_ids = [];
            ids.forEach((element) => {
                let selected_id = {
                    id: element.id,
                    name: element.name,
                };
                selected_ids.push(selected_id);
            });

            searchTeacher();
        }
    });

    // 判断是否全选
    /**
     * @returns {boolean} 是否所有行都被选中
     */
    function isAllSelected() {
        if(graders_list!==null){
            return graders_list.every(
                (/** @type {{ selected: any; }} */ grader) => grader.selected,
            );
        }else{
            return false;
        }
    }
</script>

<div class={show_panel ? "graders-panel-container" : "hide"}>
    <div class="graders-panel">
        <span
            style="font-size: 20px; font-weight:bold; margin-left:auto; margin-right:auto; padding:20px 0 40px 0"
            >选择考试负责人</span
        >
        <div
            class="graders-search-container"
            style="height: 32px;width:350px;margin-left:auto;margin-right:auto"
        >
            <SearchInput
                purpose_text={"搜索"}
                place_holder={"请输入手机号、账号或姓名"}
                onSearchFunc={onSearch}
            ></SearchInput>
        </div>
        <div class="graders-selection-table-container">
            <table class="table">
                <thead>
                    <tr>
                        <th style="width: 30px;"
                            ><input
                                type="checkbox"
                                class="custom-checkbox"
                                onchange={(e)=>{toggleSelectAll(e)}}
                                disabled = {is_single}
                                checked={is_all_selected}
                            /></th
                        >
                        <th>手机号</th>
                        <th>账号</th>
                        <th>姓名</th>
                        <th>性别</th>
                    </tr>
                </thead>
                <tbody>
                    {#each graders_list as grader, index}
                        <tr
                            class={`grader ${grader.selected ? "selected" : ""}`}
                        >
                            <td
                                ><input
                                    type="checkbox"
                                    class="custom-checkbox"
                                    checked={grader.selected}
                                    onchange={/** @param {Event} event */
                                    /** @param {Event} event */
                                    (event) => {
                                        const target =
                                            /** @type {HTMLInputElement} */ (
                                                event.target
                                            );

                                        if (target && target.checked) {
                                            if (is_single) {
                                                // 单选模式：清空 selected_ids，只保留当前选中项
                                                selected_ids.length = 0;
                                                selected_ids.push({
                                                    id: grader.id,
                                                    name:
                                                        grader.name === null
                                                            ? grader.account
                                                            : grader.name,
                                                });

                                                // 清空其他 grader 的选中状态
                                                graders_list.forEach((g) => {
                                                    g.selected =
                                                        g.id === grader.id;
                                                });
                                            } else {
                                                if (
                                                    !selected_ids.find(
                                                        (g) =>
                                                            g.id === grader.id,
                                                    )
                                                ) {
                                                    selected_ids.push({
                                                        id: grader.id,
                                                        name:
                                                            grader.name === null
                                                                ? grader.account
                                                                : grader.name,
                                                    });
                                                }
                                                grader.selected = true;
                                            }

                                            is_all_selected = isAllSelected();
                                        } else {
                                            // 取消选中：从 selected_ids 中移除
                                            const index =
                                                selected_ids.findIndex(
                                                    (g) => g.id === grader.id,
                                                );
                                            if (index !== -1) {
                                                selected_ids.splice(index, 1);
                                            }
                                            grader.selected = false;
                                            is_all_selected = isAllSelected();
                                        }
                                    }}
                                /></td
                            >
                            <td>{grader.mobile_phone === null || grader.mobile_phone === "" ? "--" : grader.mobile_phone}</td>
                            <td>{grader.account === null || grader.account === "" ? "--" : grader.account}</td>
                            <td>{grader.name === null || grader.name === "" ? "--" : grader.name}</td>
                            <td>{grader.gender === null || grader.gender === "" ? "--" : grader.gender}</td>
                        </tr>
                    {/each}
                </tbody>
            </table>
            {#if graders_list.length === 0}
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
        <div class="graders-selection-button-container">
            <button
                class="graders-selection-cancel-button"
                onclick={() => {
                    show_panel = false;
                    search_params.page = 1;
                    selected_ids = [];
                    ids.forEach((element) => {
                        let selected_id = {
                            id: element.id,
                            name: element.name,
                        };
                        selected_ids.push(selected_id);
                    });
                    onCancel();
                }}>取消</button
            >
            <button
                class="graders-selection-confirm-button"
                onclick={() => {
                    show_panel = false;
                    onConfirm(selected_ids);
                }}>确定</button
            >
        </div>
    </div>
</div>

<style lang="scss" scoped>
    .hide {
        display: none;
    }

    .table {
        max-height: 70px;
        min-width: 685px;
        border-collapse: collapse;

        th {
            font-size: 14px;
            color: rgba(0, 0, 0, 0.3);
            border: none;
            height: 40px;
            font-weight: normal;
        }

        td {
            font-size: 14px;
            color: rgba(51, 51, 51);
            border: none;
            padding: 8px;
            text-align: center;
            overflow: visible;
            border-top: none;
            border-bottom: 1px solid #ddd;
            border-left: none;
            border-right: none;
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
        margin: 30px 90px 5px 0;
    }

    .graders-panel-container {
        position: fixed;
        top: 0%;
        left: 0%;
        width: 100vw;
        height: 100vh;
        background-color: rgba(0, 0, 0, 0.7); /* 半透明遮罩层 */
        display: flex;
        justify-content: center;
        align-items: center;
        z-index: 100;
    }

    .graders-panel {
        width: 900px;
        max-height: 100%;
        overflow-y: auto;
        background-color: white;
        display: flex;
        flex-direction: column;
        border-radius: 3px;
    }

    .graders-selection-table-container {
        margin: 20px 100px 0 100px;
        height: 452px;
        min-height: 100px;
        overflow-y: auto;
        position: relative;
    }

    .graders-selection-button-container {
        display: flex;
        flex-direction: row;
        justify-content: space-between;
        margin: 30px 300px 30px 300px;
        .graders-selection-cancel-button {
            background-color: white;
            border: 1px solid #797979;
            height: 35px;
            width: 120px;
            border-radius: 3px;
            color: black;
            cursor: pointer;
        }
        .graders-selection-confirm-button {
            background-color: #0336ff;
            border: 1px solid #0336ff;
            height: 35px;
            width: 120px;
            color: white;
            border-radius: 3px;
            cursor: pointer;
        }
    }

    // 自定义复选框
    .custom-checkbox {
        appearance: none;
        width: 14px;
        height: 14px;
        border: 1px solid #797979;
        background-color: white;
        position: relative;
        cursor: pointer;

        &:checked {
            background-color: #ffffff;
            border-color: #0052d9;

            &::after {
                content: "";
                position: absolute;
                left: 3px;
                width: 4px;
                height: 6px;
                border: solid #0052d9;
                border-width: 0 3px 4px 0;
                transform: rotate(45deg);
            }
        }
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
</style>
