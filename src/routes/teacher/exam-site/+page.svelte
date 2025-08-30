<script>
    import Title from '$lib/components/Title/Title.svelte';
    import Pagination from '$lib/components/Pagination/Pagination.svelte';
    import InputBox from '$lib/components/Input/InputBox.svelte';
    import MessageBox from '$lib/components/MessageBox/MessageBox.js';
    import { onMount } from "svelte";
    import { goto } from "$app/navigation";
    import { toast } from "$lib/components/Toast/Toast";
    import ExamSiteAdminSelectionPanel from "./ExamSiteAdminSelectionPanel.svelte";
    
    
    /**
     * @typedef Site
     * @property {number} id - 考点ID
     * @property {string} name - 考点名称
     * @property {string} address - 考点地址
     * @property {number} room_count - 考点下的考场数量
     * @property {string} link - 考点服务链接
     * @property {string} [status] - 考点服务器状态，"00"表示正常，其他值表示异常
     * @property {string} [error_msg] - 如果状态异常，包含错误信息
     * @property {boolean} [can_delete] - 是否可以删除该考点
     * @property {string} [admin] - 考点负责人ID
     * @property {string} [adminName] - 考点负责人姓名
     *
    
    
     * @typedef NewSite
     * @property {string} name - 新增考点名称
     * @property {string} address - 新增考点地址
     * @property {string} link - 新增考点服务链接
     * @property {number} admin - 新增考点负责人ID
     * @property {string} [adminName] - 新增考点负责人姓名
     *
    
    
     * @typedef admin_selection 
     * @property {number} id - 考点负责人ID
     * @property {string} name - 考点负责人姓名
     


    
     * @type {Array<{
     *   id: number,
     *   name: string,
     *   address: string,
     *   room_count: number,
     *   link: string,
     *   status: string,
     *   error_msg: string,
     *   can_delete: boolean
     * }>}
     */
    let examSites = $state([]);

    let current_page = $state(1);

    let total_num = $state(0);

    let total_pages = $state(1);

    let page_size = $state(10);

    let search_text = $state("");

    let show_add_dialog = $state(false);

    let show_admin_select_panel = $state(false);

    /**
     * @type {Array<admin_selection>}
     */
    let selected_admin_ids = $state([]); // 用于存储选中的考点负责人ID

    /**
     * @type {NewSite}
     */
    let new_site = $state({
        name: "",
        address: "",
        server_host: "",
        admin: 0,
        adminName: "",
    });

    let show_add_room_dialog = $state(false);
    let new_room = $state({
        name: "",
        capacity: 0,
    });
    let sortAsc = $state(false); // true 升序，false 降序

    let deleteDialogOpen = $state(false);

    let current_delete_site_id = $state(0);

    let current_site_id_for_room = $state(0); // 新增状态变量，存储要添加考场的考点ID

    let show_action_toast = $state(false);

    /**
     * @type {import("$lib/component/ActionToast.svelte").default | null}
     */
    let action_toast = $state(null);

    // 简单的IP地址正则表达式
    const SERVER_IP_REGEX = /^(?:(?:25[0-5]|2[0-4][0-9]|1[0-9]{2}|[1-9]?[0-9])\.){3}(?:25[0-5]|2[0-4][0-9]|1[0-9]{2}|[1-9]?[0-9])(?::(?:[1-9][0-9]{0,3}|[1-5][0-9]{4}|6[0-4][0-9]{3}|65[0-4][0-9]{2}|655[0-2][0-9]|6553[0-5]))?$/;

    /**
     * 检测考点服务器状态
     * @param {string} serverUrl - 考点服务器地址
     * @return {Promise<string>} err_msg
     */
    async function checkServerStatus(serverUrl) {
       
        let err_msg = "";

        let protocol = SERVER_IP_REGEX.test(serverUrl) ? "http://" : "https://";

        let reqUrl = protocol + serverUrl + "/api/hello";

        let response = await fetch(reqUrl, {
            method: "GET",
            credentials: "include",
        }).catch((err) => {
            
            err_msg = `网络连接异常, 请检查考点服务器地址(${serverUrl}) err: ${err.message}`;
            
            return {
                ok: false,
                status: 0,
                statusText: err_msg,
            };
        });

        if(!response.ok){
            err_msg = `服务器连接失败: status:${response.status} reason:${response.statusText}`;
        }

        return err_msg;
        
    }

    /**
     * 获取考点列表
     *
     * 该函数用于获取考点列表数据，并根据提供的参数进行过滤和分页。
     *
     * @param {number} page - 当前页码，默认为1。
     * @param {number} page_size - 每页显示的考点数量，默认为10。
     * @param {string} search_text - 搜索关键词，用于过滤考点名称或地址。
     * @param {boolean} sort_asc - 考场数量排序方式，true为升序，false为降序。
     */
    async function getExamSites(
        page = 1,
        page_size = 10,
        search_text = "",
        sort_asc = true,
    ) {
        // 构造 q 参数对象
        const qParam = {
            page: page,
            pageSize: page_size,
            orderBy: [
                {
                    roomCount: sort_asc ? "ASC" : "DESC"
                }
            ],
            filter: {
                name: search_text || ""
            }
        };

        // 注意要 JSON.stringify 然后 encodeURIComponent
        const queryParams = new URLSearchParams({
            q: JSON.stringify(qParam)
        });

        const response = await fetch(
            `/api/exam-site/list?${queryParams}`,
            {
                method: "GET",
                credentials: "include",
                headers: {
                    "Content-Type": "application/json",
                },
            }
        );

        if (!response.ok) {
            throw new Error("Network response was not ok");
        }

        const responseData = await response.json();

        if (responseData.status !== 0) {
            console.error("获取考点数据失败:", responseData.msg);
        }
        console.log("获取考点数据成功:", responseData);


        if (!responseData.data) {
            examSites = [];
            total_num = 0;
            total_pages = 1;
        } else {
            examSites = responseData.data;
            total_num = responseData.rowCount;
            total_pages = isNaN(Math.ceil(total_num / page_size)) ? 1 : Math.ceil(total_num / page_size);

        
            for (let site of examSites) {
                site.status = "";
                site.error_msg = "";
                console.log("检测考点服务器状态:", site);
                checkServerStatus(site.server_host).then(
                    (err_msg) => {
                        if (err_msg === "") {
                            site.status = "00"; // 正常
                            site.error_msg = "";
                        } else {
                            site.status = "01"; // 异常
                            site.error_msg = err_msg;
                        }
                    }
                );
            }
        }
    }

    /**
     * 处理页面导航
     * @param {boolean} is_next - 是否为下一页，true表示下一页，false表示上一页
     * @description 根据is_next参数决定是前进到下一页还是后退到上一页，并重新获取数据
     */
    async function handlePageNavigation(is_next) {
        if (is_next && current_page < total_pages) {
            current_page++;
        } else if (!is_next && current_page > 1) {
            current_page--;
        }
        await getExamSites(current_page, page_size, search_text, sortAsc);
    }

    /**
     * 处理页码选择
     * @param {number} page - 要跳转的目标页码
     * @description 直接跳转到指定页码并重新获取数据
     */
    async function handlePageSelect(page) {
        current_page = page;
        await getExamSites(current_page, page_size, search_text, sortAsc);
    }

    // 页码切换事件
    function handlePageChange(event) {
        current_page = event.detail;
        console.log("当前页：", current_page);
        getExamSites(current_page, page_size)
    }

    // 每页条数切换事件
    function handlePageSizeChange(event) {
        page_size = event.detail;
        current_page = 1; // 每次改条数最好回到第一页
        console.log("每页条数：", page_size);
        getExamSites(current_page, page_size)
    }

    function openAddDialog() {
        show_add_dialog = true;
    }
    function closeAddDialog() {
        show_add_dialog = false;
        new_site = { name: "", address: "", server_host: "", admin: 0 };
    }
    async function confirmAddDialog() {
        // 校验必填字段
        if (!new_site.name) {
            toast.error("考点名称不能为空");
            return;
        }
        if (!new_site.address) {
            toast.error("考点地址不能为空");
            return;
        }
        if (!new_site.server_host) {
            toast.error("考点服务链接不能为空");
            return;
        }

        const reqProto = {
    //        action: "addExamSite",
            data: {
                name: new_site.name,
                address: new_site.address,
                serverHost: new_site.server_host,
                admin: new_site.admin
            },
        };

        fetch(
            "/api/exam-site", // 假设新增考点的 API 接口
            {
                method: "POST",
                credentials: "include",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(reqProto),
            },
        )
        .then(response => {

            if (response.status != 200) {
                throw new Error(`新增考点请求失败:, ${response.status}, ${response.statusText}`);
            }

            return response.json();
        })
        .then(data => {
            console.log("新增考点响应数据:", data);

            if (data.status !== 0) {
                console.error("新增考点失败:", data.msg);
                toast.error("新增考点失败，请稍后重试");
            } else {
                // 成功处理
                closeAddDialog(); // 关闭弹窗并重置表单
                getExamSites(
                    // 刷新考点列表
                    current_page,
                    page_size,
                    search_text,
                    sortAsc,
                );
                toast.success("新增考点成功");
            }
        })
        .catch(err => {
            console.error("操作失败: ", err);
            toast.error("新增考点失败");
        })
    }

    /**
     * 打开新增考场对话框
     * @param {number} siteID - 要添加考场的考点ID
     */
    function openAddRoomDialog(siteID) {
        current_site_id_for_room = siteID; // 存储考点ID
        show_add_room_dialog = true;
    }
    function closeAddRoomDialog() {
        show_add_room_dialog = false;
        new_room = { name: "", capacity: 0 }; // 重置表单
    }

    /**
     * 新增考场并发送请求到后端
     */
    async function confirmAddRoomDialog() {
        // 校验必填字段
        if (!new_room.name) {
            toast.error("考场名称不能为空");
            return;
        }
        if (new_room.capacity <= 0) {
            toast.error("考场容量必须大于0");
            return;
        }

        try {
            const reqProto = {
                data: {
                    examSiteID: current_site_id_for_room, // 使用存储的考点ID
                    name: new_room.name,
                    capacity: new_room.capacity,
                },
            };

            const response = await fetch(
                "/api/exam-room", // 假设新增考场的 API 接口
                {
                    method: "POST",
                    credentials: "include",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify(reqProto),
                },
            );

            const responseData = await response.json();

            if (responseData.status !== 0) {
                console.error("新增考场失败:", responseData.msg);
                toast.error("新增考场失败，请稍后重试");
            } else {
                closeAddRoomDialog(); // 关闭弹窗并重置表单
                // 刷新考点列表，虽然新增考场不直接影响考点列表，但可能需要刷新以更新考场数量等信息
                await getExamSites(
                    current_page,
                    page_size,
                    search_text,
                    sortAsc,
                );
                toast.success("添加考场成功");
            }
        } catch (err) {
            console.error("提交新增考场请求失败：", err);
            toast.error("新增考场失败，请稍后重试");
        }
    }

    async function sortByCount() {
        sortAsc = !sortAsc;
        await getExamSites(current_page, page_size, search_text, sortAsc);
    }

    /**
     * 打开删除考点确认对话框
     * @param {number} id - 要删除的考点ID
     * @description 设置当前要删除的考点ID并打开确认对话框
     */
    async function openDeleteDialog(id) {
        current_delete_site_id = id;
        MessageBox({
            title: '请问是否要删除考点？',
            content: '删除后将无法恢复此考点',
            onConfirm: () => {
                deleteExamSite();
            },
        });
    }

    /**
     * 删除考点的函数
     */
    async function deleteExamSite() {
        try {
            const reqProto = {
                action: "deleteExamSite",
                data: {
                    id: current_delete_site_id,
                },
            };

            const response = await fetch("/api/admin/exam-site", {
                method: "DELETE",
                credentials: "include",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(reqProto),
            });

            const responseData = await response.json();

            if (responseData.status !== 0) {
                console.error("删除失败:", responseData.msg);
                toast.error("删除考点失败，请稍后重试");
            } else {
                // 成功处理
                deleteDialogOpen = false;
                await getExamSites(
                    current_page,
                    page_size,
                    search_text,
                    sortAsc,
                );
                toast.success("删除考点成功");
            }
        } catch (err) {
            console.error("提交失败：", err);
            toast.error("删除考点失败，请稍后重试");
        }
    }


    onMount(() => {
        getExamSites(current_page, page_size, search_text, sortAsc);
    });
</script>

<Title title="考点列表" />

<div class="page">
    <div class="container">
        <div class="tool-bar">
            <div class="filter-container">
                <InputBox
                    label="搜索考点:"
                    type="text"
                    placeholder="请输入考点名称/考点地址"
                    bind:value={search_text}
                    onInput={(val) => {
                    search_text = val;
                    }}
                />
            </div>

            <button class="add-button" onclick={openAddDialog}>
                + 新增考点
            </button>
        </div>
        <div class="content">
            <table>
                <thead>
                    <tr>
                        <th>考点名称</th>
                        <th>考点地址</th>
                        <th
                            class="exam-site-num"
                            style="cursor:pointer;"
                            onclick={sortByCount}
                        >
                            考场数量
                            <span
                                style="font-size:12px;vertical-align:middle;display:inline-block;"
                            >
                                <svg
                                    width="10"
                                    height="10"
                                    style="display:block;"
                                    viewBox="0 0 10 10"
                                >
                                    <polygon
                                        points="5,2 9,8 1,8"
                                        fill={sortAsc ? "#222" : "#ccc"}
                                    />
                                </svg>
                                <svg
                                    width="10"
                                    height="10"
                                    style="display:block;margin-top:-2px;"
                                    viewBox="0 0 10 10"
                                >
                                    <polygon
                                        points="1,2 9,2 5,8"
                                        fill={sortAsc ? "#ccc" : "#222"}
                                    />
                                </svg>
                            </span>
                        </th>
                        <th>考点服务链接</th>
                        <th>考点链接状态</th>
                        <th>操作</th>
                    </tr>
                </thead>
                <tbody>

                    {#if examSites.length === 0}
                        <tr>
                            <td colspan="6" style="text-align: center;">
                                暂无考点数据
                            </td>
                        </tr>
                    {/if}

                    {#each examSites as site}
                        <tr>
                            <td class="exam-site-name" title={site.name}
                                >{site.name}</td
                            >
                            <td class="exam-site-addr" title={site.address}
                                >{site.address}</td
                            >
                            <td class="exam-site-num"
                                >{site.room_count === 0
                                    ? "-"
                                    : `${site.room_count}个`}</td
                            >
                            <td class="exam-site-link" title={site.serverHost}
                                >{site.serverHost}</td
                            >
                            <td>
                                <div
                                    class={`status exam-site-status ${
                                        site.status == "" ? "status-checking" : 
                                            site.status == "00"
                                                ? ""
                                                : "status-abnormal"
                                    }`}
                                >
                                    {#if site.status != "" && site.status != "00"}
                                        <div
                                            class="error-tip"
                                            style="display: none;"
                                        >
                                            {site.error_msg}
                                        </div>
                                    {/if}

                                    {site.status == "" ? "检测中" : 
                                        site.status == "00"
                                            ? "正常"
                                            : "异常"}
                                </div></td
                            >
                            <td class="exam-site-operation">
                                <div class="operation-group">
                                    <div class="operation-row">
                                        <button
                                            class="operation"
                                            onclick={() =>
                                                goto(
                                                    `/teacher/exam-site-management/details/${site.id}`,
                                                )}>查看考场</button
                                        >
                                        <button
                                            class="operation"
                                            onclick={() =>
                                                openAddRoomDialog(site.id)}
                                            >新增考场</button
                                        >
                                    </div>
                                    <div class="operation-row">
                                        <button
                                            class="operation"
                                            onclick={() =>
                                                goto(
                                                    `/teacher/exam-site-management/edit/${site.id}`,
                                                )}>编辑考点</button
                                        >

                                        <button
                                            class="operation {!site.can_delete
                                                ? 'disabled'
                                                : ''}"
                                            onclick={() =>
                                                site.can_delete
                                                    ? openDeleteDialog(site.id)
                                                    : null}
                                            >删除考点
                                            {#if !site.can_delete}
                                                <div class="delete-error-tip">
                                                    该考点下的考场正在使用中，无法删除
                                                </div>
                                            {/if}
                                        </button>
                                    </div>
                                </div>
                            </td>
                        </tr>
                    {/each}
                </tbody>
            </table>
        </div>
        <div class="pagination-container">
            <Pagination
                total_items={total_num}
                page_size={page_size}
                current_page={current_page}
                page_size_options={[10, 15, 20]}
                on:pageChange={handlePageChange}
                on:pageSizeChange={handlePageSizeChange}
             />
        </div>
    </div>
</div>


{#if show_add_dialog}
    <div class="dialog-mask">
        <div class="add-dialog">

            <div class="dialog-title">新增考点</div>

            <div class="dialog-form">

                <div class="form-row">
                    <span class="label-group">
                        <span class="required">*</span>
                        <span class="add-label">考点名称：</span>
                    </span>
                    <input
                        class="input"
                        placeholder="请输入考点名称"
                        bind:value={new_site.name}
                    />
                </div>

                <div class="form-row">
                    <span class="label-group">
                        <span class="required">*</span>
                        <span class="add-label">考点地址：</span>
                    </span>
                    <input
                        class="input"
                        placeholder="请输入考点地址"
                        bind:value={new_site.address}
                    />
                </div>

                <div class="form-row">
                    <span class="label-group">
                        <span class="required">*</span>
                        <span class="add-label">考点服务链接：</span>
                    </span>
                    <input
                        class="input"
                        placeholder="请输入考点服务链接"
                        bind:value={new_site.server_host}
                    />
                </div>

                <div class="form-row">
                    <span class="label-group">
                        <span class="required">*</span>
                        <span class="add-label">考点负责人：</span>
                    </span>
                    <div class="input hideBorder">
                        
                        {#if new_site.admin == 0}
                            <button
                                class="select-admin-btn"
                                onclick={() => {
                                    show_admin_select_panel = true;
                                }}
                            >
                                <img
                                    src="/exam_list/add.svg"
                                    alt="添加"
                                    style="height: 14px; margin-right:5px; filter: invert(27%) sepia(99%) saturate(7492%) hue-rotate(222deg) brightness(99%) contrast(101%);"
                                />
                                选择考点负责人
                            </button>
                        {:else}
                            <span class="selected-admin" title={new_site.OfficialName}>
                                {new_site.OfficialName}
                            </span>
                            <button
                                class="select-admin-btn reselect"
                                onclick={() => {
                                    show_admin_select_panel = true;
                                }}
                            >
                                重新选择
                            </button>
                        {/if}
                    </div>

                </div>

            </div>
            <div class="dialog-btns">
                <button class="btn-cancel" onclick={closeAddDialog}>关闭</button
                >
                <button class="btn-confirm" onclick={confirmAddDialog}
                    >确定</button
                >
            </div>
        </div>
    </div>
{/if}

{#if show_add_room_dialog}
    <div class="dialog-mask">
        <div class="add-exam-room-dialog">
            <div class="dialog-title">新增考场</div>
            <div class="dialog-form">
                <div class="form-row">
                    <span class="label-group">
                        <span class="required">*</span>
                        <span class="add-label">考场名称：</span>
                    </span>
                    <input
                        class="input"
                        placeholder="请输入考场名称"
                        bind:value={new_room.name}
                    />
                </div>
                <div class="form-row">
                    <span class="label-group">
                        <span class="required">*</span>
                        <span class="add-label">考场容量：</span>
                    </span>
                    <input
                        class="input"
                        type="number"
                        min="1"
                        placeholder="请输入个数"
                        bind:value={new_room.capacity}
                        style="width: 120px;"
                    />
                    <span style="margin-left:8px;font-size:14px;color:#888;"
                        >个</span
                    >
                </div>
            </div>
            <div class="dialog-btns">
                <button class="btn-cancel" onclick={closeAddRoomDialog}
                    >关闭</button
                >
                <button class="btn-confirm" onclick={confirmAddRoomDialog}
                    >确定</button
                >
            </div>
        </div>
    </div>
{/if}


<ExamSiteAdminSelectionPanel 
    is_single={true}
    show_panel={show_admin_select_panel}
    ids={selected_admin_ids}
    onCancel = {() => {
        show_admin_select_panel = false;
    }}
    onConfirm = {(/** @type {Array<admin_selection>}  */ selected_ids) => {
        console.log("选中的考点负责人:", selected_ids);
        show_admin_select_panel = false;
        selected_admin_ids = selected_ids;
        new_site.admin = selected_admin_ids.length > 0 ? selected_admin_ids[0].ID : new_site.admin;
        new_site.OfficialName = selected_admin_ids.length > 0 ? selected_admin_ids[0].OfficialName : new_site.OfficialName;
    }}
/>


<style lang="scss" scoped>
    .page {
        height: 100%;
    }
    .container {
        padding: 0px 20px;
        height: 100%;
        display: flex;
        flex-direction: column;
        min-width: 1080px;
    }
    .title-bar {
        padding: 15px 0px;
        display: flex;
        align-items: center;
        gap: 8px;

        .blue-bar {
            width: 10px;
            height: 26px;
            background-color: #165dff;
            border-radius: 5px;
        }

        .title {
            font-size: 20px;
            font-weight: bold;
            color: #333333;
            margin: 0;
            line-height: 1;
        }

        .divider {
            height: 1px;
            flex: 1;
            background-color: #e0e0e0;
            margin-left: 20px;
        }
    }
    .tool-bar {
        display: flex;
        align-items: center;
        justify-content: flex-start;
        margin-left: 20px;
    }

    .filter-container {
        display: flex;
        align-items: center;
        gap: 12px;
        padding: 10px 0px;

        .label {
            color: #7f7f7f;
            font-size: 14px;
        }

        .input-group {
            position: relative;
            display: flex;
            align-items: center;
            margin-right: 20px;
            .filter-input {
                width: 250px;
                height: 30px;
                padding: 0 12px;
                margin-right: 12px;
                border: 1px solid #d7d7d7;
                border-radius: 2px;
                box-sizing: border-box;
                font-size: 12px;
            }

            .filter-input::placeholder {
                color: #999;
            }

            .filter-input:focus {
                border-color: #165dff;
                outline: none;
            }
            .clear-button {
                position: absolute;
                right: 20px;
                background: transparent;
                border: none;
                cursor: pointer;
                color: #999;
                font-size: 16px;
            }
        }
    }

    .add-button {
        width: 100px;
        height: 30px;
        color: #fff;
        background-color: #165dff;
        border: none;
        border-radius: 3px;
        font-size: 12px;
        cursor: pointer;
        margin-left: 12px; /* 新增的左边距 */
    }

    .content {
        flex: 1;
    }
    table {
        width: 100%;
        border-collapse: collapse;
        text-align: center;
        margin: 10px 0px;
    }
    th,
    td {
        font-weight: normal;
        color: #333333;
        border-bottom: 1px solid #ddd;
        height: 60px;
        box-sizing: border-box;
    }

    th {
        background-color: #ffffff;
        font-size: 14px;
        font-weight: normal;
        color: rgb(0, 0, 0, 0.3);
        border: none;
        padding: 8px;
        text-align: center;
    }

    td {
        font-size: 14px;
    }

    .exam-site-name {
        width: 18.75%;
        text-overflow: ellipsis;
        overflow: hidden;
        max-width: 200px;
        white-space: nowrap;
        position: relative;
    }
    .exam-site-addr {
        width: 25%;
        text-overflow: ellipsis;
        overflow: hidden;
        max-width: 268px;
        white-space: nowrap;
        position: relative;
    }

    .exam-site-num {
        width: 9.375%;
    }

    .exam-site-link {
        width: 15.625%;
        text-overflow: ellipsis;
        overflow: hidden;
        max-width: 167px;
        white-space: nowrap;
        position: relative;
        font-size: 12px;
    }

    .exam-site-status {
        width: 12.5%;
    }

    .exam-site-operation {
        width: 18.75%;
    }

    .status {
        position: relative;
        display: inline-block;
        padding: 4px 12px;
        border-radius: 8px;
        width: fit-content;
        font-size: 12px;
        box-sizing: border-box;
        color: #fff;
        box-sizing: border-box;
        text-align: center;
        background-color: var(--success-color); // 绿色背景

        &:hover {
            .error-tip {
                display: block !important;
            }
        }
    }

    .status-checking {
        background-color: var(--blue); // 蓝色背景
    }

    .status-abnormal {
        background-color: var(--error-color);
    }

    .error-tip {
        position: absolute;
        transform: translateX(-50%);
        width: fit-content;
        left: 50%;
        z-index: 10;
        bottom: 100%;
        white-space: nowrap;
        text-align: center;
        background-color: #fff;
        color: #1d2129;
        border: 1px solid #ddd;
        border-radius: 1px;
        padding: 4px 8px;
        font-size: 10px;
        margin-bottom: 1px;
    }

    .operation-group {
        display: flex;
        flex-direction: column;
    }

    .operation-row {
        display: flex;
        gap: 12px;
        justify-content: center;
    }

    .operation {
        border: none;
        font-size: 14px;
        background-color: transparent;
        color: #0052d9;
        cursor: pointer;
        padding: 4px 8px;
        border-radius: 4px;
        transition: all 0.3s ease;
        position: relative;

        &:hover {
            font-weight: bold;
        }

        &.disabled {
            color: #c0c4cc;
            cursor: not-allowed;

            &:hover {
                font-weight: normal;

                .delete-error-tip {
                    display: block;
                }
            }
        }

        .delete-error-tip {
            display: none;
            position: absolute;
            transform: translateX(-50%);
            width: fit-content;
            left: 50%;
            z-index: 10;
            bottom: calc(100% - 4px);
            white-space: nowrap;
            text-align: center;
            background-color: #fff;
            color: #1d2129;
            border: 1px solid #ddd;
            border-radius: 1px;
            padding: 4px 8px;
            font-size: 10px;
            margin-bottom: 1px;
        }
    }
    .pagination-container {
        display: flex;
        justify-content: flex-end;
        padding-top: 20px;
        padding-bottom: 20px;
    }

    .dialog-mask {
        position: fixed;
        left: 0;
        top: 0;
        width: 100vw;
        height: 100vh;
        background: rgba(23, 23, 23, 0.5);
        z-index: 50;
        display: flex;
        align-items: center;
        justify-content: center;
    }
    .add-dialog {
        background: #fff;
        border: 1px solid #797979;
        box-sizing: border-box;

        box-shadow: 0 2px 16px rgba(0, 0, 0, 0.18);
        width: 435px;
        height: fit-content;
        padding: 16px 50px 32px 50px;
        display: flex;
        flex-direction: column;
        align-items: center;
    }

    .add-exam-room-dialog {
        background: #fff;
        border: 1px solid #797979;
        box-sizing: border-box;

        box-shadow: 0 2px 16px rgba(0, 0, 0, 0.18);
        width: 435px;
        height: 250px;
        padding: 16px 50px 32px 50px;
        display: flex;
        flex-direction: column;
        align-items: center;
    }
    .dialog-title {
        font-size: 20px;
        font-weight: bold;
        color: #333;
        margin-bottom: 25px;
    }
    .dialog-form {
        width: 100%;
        display: flex;
        flex-direction: column;
        gap: 24px;
        margin-bottom: 32px;
        justify-content: center;
    }
    .form-row {
        display: flex;
        align-items: center;
        justify-content: center;
    }
    .label-group {
        display: flex;
        align-items: center;
        min-width: 130px;
        justify-content: flex-end;
        margin-right: 8px;
    }
    .required {
        color: #e34d59;
        font-size: 14px;
        margin-right: 2px;
        text-align: right;
    }
    .add-label {
        color: #222;
        font-size: 14px;
        text-align: right;
        margin-right: 0;
        width: auto;
    }
    .input {
        display: flex;
        justify-content: flex-start;
        align-items: center;
        flex: 1;
        height: 30px;
        border: none;
        border-left: 1px solid #d7d7d7;
        border-radius: 2px;
        padding: 0 10px;
        font-size: 14px;

        background-color: #fafbfc;

        &.hideBorder {
            border-left: none;
            background-color: transparent;
        }
    }

    .input::placeholder {
        font-size: 12px;
    }

    .input:focus {
        border-left: 1px solid #165dff;
        outline: none;
    }

    .selected-admin {
        display: inline-block;
        max-width: 100px;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
        vertical-align: middle;
    }

    .select-admin-btn {
        display: flex;
        align-items: center;
        width: 120px;
        height: 30px;
        color: var(--primary-color);
        border-radius: var(--btn-border-radius);
        background-color: inherit;
        border: none;
        padding: 0 10px 0 10px;
        width: fit-content;
        min-width: fit-content;
        cursor: pointer;

        &.reselect {
            background-color: inherit;
            color: var(--primary-color);
        }

        &:hover {
            font-weight: bold;
        }

    }

    .dialog-btns {
        display: flex;
        justify-content: center;
        gap: 32px;
        width: 100%;
    }
    .btn-cancel {
        width: 110px;
        height: 32px;
        background: #fff;
        border: 1px solid #dcdcdc;
        border-radius: 3px;
        color: #333333;
        font-size: 12px;
        cursor: pointer;
    }
    .btn-confirm {
        width: 110px;
        height: 32px;
        background: #0336ff;
        border: 1px solid #0336ff;
        border-radius: 3px;
        color: #fff;
        font-size: 12px;
        cursor: pointer;
    }

    .room-status-tag {
        display: inline-block;
        background: #2ba471;
        color: #fff;
        border-radius: 6px;
        padding: 2px 18px;
        font-size: 14px;
        font-weight: 500;
        margin-left: 2px;
    }
</style>
