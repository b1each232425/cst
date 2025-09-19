<script>
    import Title from '$lib/components/Title/Title.svelte';
    import Pagination from '$lib/components/Pagination/Pagination.svelte';
    import InputBox from '$lib/components/Input/InputBox.svelte';
    import MessageBox from '$lib/components/MessageBox/MessageBox.svelte';
    import MessageBoxJs from '$lib/components/MessageBox/MessageBox.js';
    import { onMount } from "svelte";
    import { goto } from "$app/navigation";
    import { toast } from "$lib/components/Toast/Toast";
    import ExamSiteAdminSelectionPanel from "./_component/ExamSiteAdminSelectionPanel.svelte";
    import Button from '$lib/components/Button/Button.svelte';
    import '$lib/components/Button/index.scss';
    
    
    /**
     * @typedef Site
     * @property {number} id - 考点ID
     * @property {string} name - 考点名称
     * @property {string} address - 考点地址
     * @property {number} room_count - 考点下的考场数量
     * @property {string} link - 考点服务链接
     * @property {string} [status] - 考点服务器状态，"00"表示正常，其他值表示异常
     * @property {string} [error_msg] - 如果状态异常，包含错误信息
     * @property {string} [admin] - 考点负责人ID
     *
    
    
     * @typedef NewSite
     * @property {string} name - 新增考点名称
     * @property {string} address - 新增考点地址
     * @property {string} link - 新增考点服务链接
     * @property {number} admin - 新增考点负责人ID
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
     * }>}
     * 
     *
     * @type {Array<admin_selection>}
     * 
     * 
     *
     * @type {NewSite}
     *
     * 
     * 
     * 
     * @type {import("$lib/component/ActionToast.svelte").default | null}
     * 
     * 
     * 
     * 检测考点服务器状态
     * @param {string} serverUrl - 考点服务器地址
     * @return {Promise<string>} err_msg
     * 
     * 
     * 
     * 
     * 获取考点列表
     *
     * 该函数用于获取考点列表数据，并根据提供的参数进行过滤和分页。
     *
     * @param {number} page - 当前页码，默认为1。
     * @param {number} page_size - 每页显示的考点数量，默认为10。
     * @param {string} search_text - 搜索关键词，用于过滤考点名称或地址。
     * @param {boolean} sort_asc - 考场数量排序方式，true为升序，false为降序。
     * 
     * 
     * 
     * 处理页面导航
     * @param {boolean} is_next - 是否为下一页，true表示下一页，false表示上一页
     * @description 根据is_next参数决定是前进到下一页还是后退到上一页，并重新获取数据
     * 
     * 
     * 
     * 处理页码选择
     * @param {number} page - 要跳转的目标页码
     * @description 直接跳转到指定页码并重新获取数据
     * 
     * 
     * 
     * 打开新增考场对话框
     * @param {number} siteID - 要添加考场的考点ID
     * 
     * 
     *  
     * 新增考场并发送请求到后端
     * 
     * 
     * 
     * 
     * 打开删除考点确认对话框
     * @param {number} id - 要删除的考点ID
     * @description 设置当前要删除的考点ID并打开确认对话框
     */

     // 简单的IP地址正则表达式
    const SERVER_IP_REGEX = /^(?:(?:25[0-5]|2[0-4][0-9]|1[0-9]{2}|[1-9]?[0-9])\.){3}(?:25[0-5]|2[0-4][0-9]|1[0-9]{2}|[1-9]?[0-9])(?::(?:[1-9][0-9]{0,3}|[1-5][0-9]{4}|6[0-4][0-9]{3}|65[0-4][0-9]{2}|655[0-2][0-9]|6553[0-5]))?$/;
    
    let exam_sites = $state([]); // 考点列表
    let current_page = $state(1); // 当前页码
    let total_num = $state(0); // 总记录数
    let total_pages = $state(1); // 总页数
    let page_size = $state(10); // 每页显示数量
    let search_text = $state(""); // 搜索关键词
    let show_add_dialog = $state(false); // 显示添加考点对话框
    let show_admin_select_panel = $state(false); // 显示考点负责人选择面板
    let selected_admin_ids = $state([]); // 用于存储选中的考点负责人ID
    let new_site = $state({ // 新增考点信息
        name: "",
        address: "",
        server_host: "",
        admin: 0,
        OfficialName : "",
    });
    let show_add_room_dialog = $state(false); // 显示添加考场对话框
    let new_room = $state({ // 新增考场信息
        name: "",
        capacity: 0,
    });
    let sortAsc = $state(false); // true 升序，false 降序
    let deleteDialogOpen = $state(false); // 显示删除考点对话框
    let current_delete_site_id = $state(0); // 当前删除的考点ID
    let current_site_id_for_room = $state(0); // 新增状态变量，存储要添加考场的考点ID
    let _searchTimeout = null; // 搜索去抖定时器

    let show_site_message = $state(false); // 显示考点信息提示

    let savedName = $state("");
    let savedAddress = $state("");
    let savedAccount = $state("");
    let savedAccessToken = $state("");

    let selected_site_ids = $state([]); // 已选择的考点 ID 列表
    let all_selected = $state(false); // 本页全选状态
    

    //按钮控制类
    function openAddDialog() { // 打开新增考点对话框
        show_add_dialog = true;
    }
    function closeAddDialog() { // 关闭新增考点对话框
        show_add_dialog = false;
        new_site = { name: "", address: "", server_host: "", admin: 0 ,OfficialName: ""};
    }
    function confirmAddDialog() { // 确认新增考点对话框
        // 校验必填字段
        if (!new_site.name) {
            toast.error("考点名称不能为空");
            return Promise.resolve(); // 保持返回值为 Promise 以便调用方链式处理
        }
        if (!new_site.address) {
            toast.error("考点地址不能为空");
            return Promise.resolve();
        }

        const reqProto = {
            data: {
                name: new_site.name,
                address: new_site.address,
                serverHost: new_site.server_host,
                admin: new_site.admin
            },
        };

        // 返回 fetch 的 Promise，便于外部继续链式处理
        return fetch(
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
            if (!response.ok) {
                throw new Error(`新增考点请求失败:, ${response.status}, ${response.statusText}`);
            }
            return response.json();
        })
        .then(data => {
            if (data.status !== 0) {
                console.error("新增考点失败:", data.msg);
                toast.error("新增考点失败，请稍后重试");
                return;
            } else {
                savedName = new_site.name;
                savedAddress = new_site.address;
                savedAccount = data?.data?.account || "";
                savedAccessToken = data?.data?.accessToken || "";

                // 成功处理
                closeAddDialog(); // 关闭弹窗并重置表单
                // 刷新考点列表
                return getExamSites(
                    current_page,
                    page_size,
                    search_text,
                    sortAsc,
                ).then(() => {
                    toast.success("新增考点成功");
                    show_site_message = true;
                });
            }
        })
        .catch(err => {
            console.error("操作失败: ", err);
            toast.error("新增考点失败");
        });
    }
    function handlePageChange(event) { // 处理页码切换
        current_page = event.detail;
        getExamSites(current_page, page_size, search_text, sortAsc);
    }
    function handlePageSizeChange(event) { // 处理每页条数切换
        page_size = event.detail;
        current_page = 1; // 每次改条数最好回到第一页
        getExamSites(current_page, page_size, search_text, sortAsc);
    }
    function openAddRoomDialog(siteID) { // 打开新增考场对话框
        current_site_id_for_room = siteID; // 存储考点ID
        show_add_room_dialog = true;
    }
    function confirmAddRoomDialog() { // 确认新增考场对话框
        // 校验必填字段
        if (!new_room.name) {
            toast.error("考场名称不能为空");
            return Promise.resolve();
        }
        if (new_room.capacity <= 0) {
            toast.error("考场容量必须大于0");
            return Promise.resolve();
        }

        const reqProto = {
            data: {
                examSiteID: current_site_id_for_room, // 使用存储的考点ID
                name: new_room.name,
                capacity: new_room.capacity,
            },
        };

        return fetch(
            "/api/exam-room", // 假设新增考场的 API 接口
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
            if (!response.ok) {
                return response.text().then(text => {
                    throw new Error(`新增考场请求失败: ${response.status} ${text}`);
                });
            }
            return response.json();
        })
        .then(responseData => {
            if (!responseData) {
                throw new Error("新增考场响应为空");
            }

            if (responseData.status !== 0) {
                console.error("新增考场失败:", responseData.msg);
                toast.error("新增考场失败，请稍后重试");
                return;
            }

            // 成功处理
            closeAddRoomDialog(); // 关闭弹窗并重置表单
            // 刷新考点列表（getExamSites 返回 Promise）
            return getExamSites(
                current_page,
                page_size,
                search_text,
                sortAsc,
            ).then(() => {
                toast.success("添加考场成功");
            });
        })
        .catch(err => {
            console.error("提交新增考场请求失败：", err);
            toast.error("新增考场失败，请稍后重试");
        });
    }
    function closeAddRoomDialog() { // 关闭新增考场对话框
        show_add_room_dialog = false;
        new_room = { name: "", capacity: 0 }; // 重置表单
    }
    function openDeleteDialog(id) { // 打开删除考点确认对话框
        MessageBoxJs({
            title: '请问是否要删除考点？',
            content: '删除后将无法恢复此考点',
            onConfirm: () => {
                deleteExamSite(id);
            },
        });
    }
    function deleteExamSite(id) { // 删除考点的函数
        const reqProto = {
            data: {
                ids: [id], // 接口现在接受 ids 数组
            },
        };

        return fetch("/api/exam-site", {
            method: "DELETE",
            credentials: "include",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify(reqProto),
        })
            .then((response) => {
                if (!response.ok) {
                    return response.text().then((text) => {
                        console.error("删除请求失败:", response.status, text);
                        toast.error("删除考点失败，请稍后重试");
                        throw new Error(`Request failed: ${response.status}`);
                    });
                }
                return response.json();
            })
            .then((responseData) => {
                if (responseData.status !== 0) {
                    console.error("删除失败:", responseData.msg);
                    toast.error(responseData.msg || "删除考点失败，请稍后重试");
                    return;
                }
                // 成功处理
                deleteDialogOpen = false;
                return getExamSites(current_page, page_size, search_text, sortAsc).then(() => {
                    toast.success("删除考点成功");
                });
            })
            .catch((err) => {
                console.error("提交失败：", err);
                toast.error("删除考点失败，请稍后重试");
            });
    }
    function deleteSelectedSites() {
        if (!selected_site_ids || selected_site_ids.length === 0) {
            toast.error("请先选择要删除的考点");
            return;
        }

        MessageBoxJs({
            title: '批量删除确认',
            content: `确定要删除选中的 ${selected_site_ids.length} 个考点？删除后无法恢复。`,
            confirmButtonText: '确定',
            cancelButtonText: '取消',
            confirm_button_type: 'danger',
            onConfirm: () => {
                const reqProto = {
                    data: {
                        ids: selected_site_ids.slice(), // 传当前选中 id 列表
                    }
                };

                fetch("/api/exam-site", {
                    method: "DELETE",
                    credentials: "include",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify(reqProto),
                })
                .then(response => {
                    if (!response.ok) {
                        return response.text().then(text => {
                            throw new Error(`删除请求失败: ${response.status} ${text}`);
                        });
                    }
                    return response.json();
                })
                .then(responseData => {
                    if (!responseData || responseData.status !== 0) {
                        toast.error(responseData?.msg || "批量删除失败");
                        return;
                    }
                    // 清空已选项并刷新列表
                    selected_site_ids = [];
                    checkAllSelected();
                    return getExamSites(current_page, page_size, search_text, sortAsc).then(() => {
                        toast.success("删除选中考点成功");
                    });
                })
                .catch(err => {
                    console.error("批量删除失败：", err);
                    toast.error("批量删除失败，请稍后重试");
                });
            }
        });
    }
    function toggleSelection(id, checked) {
        if (checked) {
            if (!selected_site_ids.includes(id)) selected_site_ids = [...selected_site_ids, id];
        } else {
            selected_site_ids = selected_site_ids.filter(item => item !== id);
        }
        checkAllSelected();
    }

    function selectedAll(checked) {
        if (checked) {
            const ids = exam_sites.map(s => s.id);
            const merged = [...selected_site_ids];
            for (const id of ids) {
                if (!merged.includes(id)) merged.push(id);
            }
            selected_site_ids = merged;
        } else {
            const ids = exam_sites.map(s => s.id);
            selected_site_ids = selected_site_ids.filter(id => !ids.includes(id));
        }
        checkAllSelected();
    }

    function checkAllSelected() {
        const currentIds = exam_sites.map(s => s.id);
        all_selected = currentIds.length !== 0 && currentIds.every(id => selected_site_ids.includes(id));
    }

    // 获取数据类
    function checkServerStatus(serverUrl) { // 检测考点服务器状态
        let err_msg = "";

        serverUrl = (serverUrl || "").toString().trim();
        if (!serverUrl) {
            return Promise.resolve(`服务器地址为空，请填写考点服务地址`);
        }

        let protocol = SERVER_IP_REGEX.test(serverUrl) ? "http://" : "https://";
        let reqUrl = protocol + serverUrl + "/api/hello";

        return fetch(reqUrl, {
            method: "GET",
            credentials: "include",
        })
        .then((response) => {
            if (!response.ok) {
                // response 不 OK，返回错误信息字符串
                err_msg = `服务器连接失败: status:${response.status} reason:${response.statusText}`;
                return err_msg;
            }
            // 成功返回空字符串表示无错误
            return "";
        })
        .catch((err) => {
            // 网络或其他异常，返回错误信息字符串
            err_msg = `网络连接异常, 请检查考点服务器地址(${serverUrl}) err: ${err.message}`;
            return err_msg;
        });
    }
    function getExamSites(  // 获取考点列表
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

        return fetch(`/api/exam-site/list?${queryParams}`, {
            method: "GET",
            credentials: "include",
            headers: {
                "Content-Type": "application/json",
            },
        })
        .then(response => {
            if (!response.ok) {
                throw new Error("Network response was not ok");
            }
            return response.json();
        })
        .then(responseData => {
            if (responseData.status !== 0) {
                console.error("获取考点数据失败:", responseData.msg);
            }

            if (!responseData.data) {
                exam_sites = [];
                total_num = 0;
                total_pages = 1;
                checkAllSelected();
                return;
            }

            exam_sites = responseData.data;
            total_num = responseData.rowCount;
            total_pages = isNaN(Math.ceil(total_num / page_size)) ? 1 : Math.ceil(total_num / page_size);

            for (let site of exam_sites) {
                site.status = "";
                site.error_msg = "";
                // 发起状态检测（不阻塞主链）
          /*      checkServerStatus(site.serverHost).then((err_msg) => {
                    if (err_msg === "") {
                        site.status = "00"; // 正常
                        site.error_msg = "";
                    } else {
                        site.status = "01"; // 异常
                        site.error_msg = err_msg;
                    }
                });*/
            }

            checkAllSelected();
        })
        .catch(err => {
            console.error("获取考点列表失败:", err);
            toast.error("获取考点列表失败，请稍后重试");
            // 失败时重置列表显示
            exam_sites = [];
            total_num = 0;
            total_pages = 1;
            checkAllSelected();
        });
    }
    async function sortByCount() { // 按考场数量排序
        sortAsc = !sortAsc;
        await getExamSites(current_page, page_size, search_text, sortAsc);
    }

    // 搜索去抖实现
    function triggerSearchDebounced() {
        clearTimeout(_searchTimeout);
        _searchTimeout = setTimeout(() => {
            current_page = 1;
            getExamSites(current_page, page_size, search_text, sortAsc);
        }, 300);
    }

    //入口
    onMount(() => {
        getExamSites(current_page, page_size, search_text, sortAsc);
    });


    //测试用
    // Expose some internals for tests when requested.
    // Tests can set `globalThis.__TEST__ = true` before importing/rendering the component
    // and then access these helpers to call functions directly or inspect state.
    try {
        if (typeof globalThis !== 'undefined' && globalThis.__TEST__) {
            globalThis.__confirmAddDialog = confirmAddDialog;
            globalThis.__closeAddDialog = closeAddDialog;
            globalThis.__openAddDialog = openAddDialog;
            globalThis.__getNewSite = () => new_site;
            // room helpers
            globalThis.__confirmAddRoomDialog = confirmAddRoomDialog;
            globalThis.__openAddRoomDialog = openAddRoomDialog;
            globalThis.__getNewRoom = () => new_room;
            globalThis.__setNewRoom = (val) => { new_room = val; };
            globalThis.__setCurrentSiteIdForRoom = (id) => { current_site_id_for_room = id; };
            // expose sort helper and accessor for tests
            globalThis.__sortByCount = sortByCount;
            globalThis.__getSortAsc = () => sortAsc;
            // expose page handler and current page for tests
            globalThis.__handlePageChange = handlePageChange;
            globalThis.__getCurrentPage = () => current_page;
            // expose page size handler and accessor for tests
            globalThis.__handlePageSizeChange = handlePageSizeChange;
            globalThis.__getPageSize = () => page_size;
            // expose delete dialog opener for tests
            globalThis.__openDeleteDialog = openDeleteDialog;
            // expose delete dialog open flag for tests
            globalThis.__getDeleteDialogOpen = () => deleteDialogOpen;
            // expose getExamSites and a read-only snapshot of list state for tests
            globalThis.__getExamSites = getExamSites;
            globalThis.__getExamSitesState = () => ({ exam_sites, total_num, total_pages });
            // expose admin selection panel controls for tests
            globalThis.__openAdminPanel = () => { show_admin_select_panel = true; };
            globalThis.__closeAdminPanel = () => { show_admin_select_panel = false; };
            globalThis.__getAdminPanelVisible = () => show_admin_select_panel;
            globalThis.__getSelectedAdminIds = () => selected_admin_ids;
            // helper to simulate the onConfirm handler of ExamSiteAdminSelectionPanel
            globalThis.__simulateAdminConfirm = (selected_ids) => {
                show_admin_select_panel = false;
                selected_admin_ids = selected_ids;
                new_site.admin = selected_admin_ids.length > 0 ? selected_admin_ids[0].ID : new_site.admin;
                new_site.OfficialName = selected_admin_ids.length > 0 ? selected_admin_ids[0].OfficialName : new_site.OfficialName;
            };
        }
    } catch (e) {
        // ignore in non-browser/test envs
    }
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
                      triggerSearchDebounced();
                    }}
                />
            </div>

            <div class="button-actions">
                <Button plain={true}  type="danger" size="medium" onclick={deleteSelectedSites} >批量删除</Button>
                <Button plain={true}  type="primary" size="medium" onclick={openAddDialog}>新增考点</Button>
            </div>



        </div>
        <div class="content">
            <table>
                <thead>
                    <tr>
                        <th style="width:40px;">
                            <input
                                class="checkbox"
                                type="checkbox"
                                bind:checked={all_selected}
                                onchange={(e) => selectedAll(e.target.checked)}
                            />
                        </th>
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
                        <th>操作</th>
                    </tr>
                </thead>
                <tbody>

                    {#if exam_sites.length === 0}
                        <tr>
                            <td colspan="7" style="text-align: center;">
                                暂无考点数据
                            </td>
                        </tr>
                    {/if}

                    {#each exam_sites as site}
                        <tr>
                            <td>
                                <input
                                    class="checkbox"
                                    type="checkbox"
                                    checked={selected_site_ids.includes(site.id)}
                                    onchange={(e) => toggleSelection(site.id, e.target.checked)}
                                />
                            </td>
                            <td class="exam-site-name" title={site.name}
                                >{site.name}</td
                            >
                            <td class="exam-site-addr" title={site.address}
                                >{site.address}</td
                            >
                            <td class="exam-site-num"
                                >{site.roomCount === 0
                                    ? "-"
                                    : `${site.roomCount}个`}</td
                            >
                            <td class="exam-site-link" title={(site.serverHost || "").trim() || "-"}>
                                {(site.serverHost || "").trim() || "-"}
                            </td>
                            <td class="exam-site-operation">
                                <div class="operation-group">
                                    <div class="operation-row">
                                        <button
                                            class="operation"
                                            onclick={() =>
                                                goto(
                                                    `/teacher/exam-site/details/${site.id}`,
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
                                            class="operation danger"
                                            onclick={() =>  openDeleteDialog(site.id) }
                                            >删除考点
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
                        
                        {#if new_site.admin === 0}
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
        show_admin_select_panel = false;
        selected_admin_ids = selected_ids;
        new_site.admin = selected_admin_ids.length > 0 ? selected_admin_ids[0].ID : new_site.admin;
        new_site.OfficialName = selected_admin_ids.length > 0 ? selected_admin_ids[0].OfficialName : new_site.OfficialName;
    }}
/>

<div>
    <MessageBox
        visible={show_site_message}
        title="考点秘钥"
        show_cancel_button={false}
        onConfirm={() => { show_site_message = false; }}
    >
        <!-- slot 内直接写模板，变量可以加粗并换行 -->
        <div style="text-align:left; line-height:1.6;">
            已新增考点：<strong>{savedName}</strong><br/>
            考点地址：<strong>{savedAddress}</strong><br/><br/>
            以下为考点秘钥（仅显示一次，请复制保存）：<br/>
            account：<strong>{savedAccount}</strong><br/>
            accessToken：<strong>{savedAccessToken}</strong>
        </div>
    </MessageBox>
</div>


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

    .tool-bar .button-actions {
        margin-left: auto;
        display: flex;
        gap: 12px;
        align-items: center;
        margin-right: 60px;
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

    .operation.danger {
        color: #e34d59; /* 红色文本 */
    }
    .operation.danger:hover {
        font-weight: bold;
        text-decoration: underline;
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
        z-index: 8888;
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

/* 新增复选框样式 */
    .checkbox {
        cursor: pointer;
        width: 16px;
        height: 16px;
        accent-color: var(--primary-color);
    }
</style>
