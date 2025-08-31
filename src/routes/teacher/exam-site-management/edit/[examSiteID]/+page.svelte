<script>
    import { onMount } from "svelte";
    import Pagination from "../../Pagination.svelte";
    import Dialog from "../../Dialog.svelte";
	import Title from '$lib/components/Title/Title.svelte';
    import ExamSiteAdminSelectionPanel from "../../ExamSiteAdminSelectionPanel.svelte";
    import AwesomeLogPanel from "../../AwesomeLogPanel.svelte";
    import { toast } from "$lib/components/Toast/Toast";

    /**
     * @typedef NewSite
     * @property {string} name - 新增考点名称
     * @property {string} address - 新增考点地址
     * @property {string} link - 新增考点服务链接
     * @property {number} admin - 新增考点负责人ID
     * @property {string} [adminName] - 新增考点负责人姓名
     *
    
     *
     * @typedef admin_selection 
     * @property {number} id - 考点负责人ID
     * @property {string} name - 考点负责人姓名
     *

    
     * @typedef log
     * @property {number} id - 日志ID
     * @property {string} module - 日志模块
     * @property {number} entity_id - 实体ID
     * @property {string[]} content - 日志内容
     * @property {number} creator - 创建者ID
     * @property {string} creator_account - 创建者账号
     * @property {string} creator_name - 创建者姓名
     * @property {string} created_time - 创建时间
    

    
     * @typedef logResult
     * @property {Array<log>} data - 日志数据
     * @property {number} total - 日志总数
     */

    let current_site_id = $state(0);

    let siteName = $state("加载中...");

    let siteAddress = $state("加载中...");

    let siteLink = $state("加载中...");

    let adminID = $state(0);

    let adminName = $state(""); // 假设管理员姓名是字符串类型

    let search_text = $state("");

    let total_num = $state(3);

    let total_pages = $state(1);

    let current_page = $state(1);

    let page_size = $state(20);

    let show_action_toast = $state(false);

    /**
     * @type {ActionToast | null}
     */
    let action_toast = $state(null);

    let show_admin_select_panel = $state(false);

    /**
     * @type {AwesomeLogPanel | null}
     */
    let operation_log_panel = $state(null);

    /**
     * @type {Array<admin_selection>}
     */
    let selected_admin_ids = $state([]); // 用于存储选中的考点负责人ID

    /**
     * @type {Array<{
     *   id: number,
     *   name: string,
     *   capacity: number,
     *   canChange: boolean
     * }>}
     */
    let examRooms = $state([]);

    /**
     * @type {Array<{
     *   id: number,
     *   name: string,
     *   capacity: number,
     *   canChange: boolean
     * }>}
     */
    let originalExamRooms = $state([]); // 添加一个变量存储原始数据

    let editing_room = $state({
        id: 0,
        name: "",
        capacity: 0,
    });

    let deleteDialogOpen = $state(false);
    let current_delete_room_id = $state(0);

    let show_add_room_dialog = $state(false);
    let new_room = $state({
        name: "",
        capacity: 0,
    });

    
    function fetchExamSiteAndRooms() { // 获取考点信息和考场列表
        const siteBody = {
            action: "deserunt Excepteur",
            sets: ["in commodo mollit irure"],
            orderBy: [],
            page: 1,
            pageSize: 1,
            data: { id: current_site_id },
            filter: {},
            authFilter: {}
        };

        // 假数据：考点信息
        siteName = "上海市第一考点";
        siteAddress = "上海市 浦东新区 测试路 123号";
        siteLink = "http://example.com";
        adminID = 101;
        adminName = "管理员张三";

        // 假数据：考场列表
        examRooms = [
            {
                site: 2000,
                id: 1,
                name: "第一考场",
                capacity: 50,
                recentExam: {
                    id: 101,
                    roomID: 1,
                    name: "数学期末考试",
                    examID: 5001,
                    examName: "2025春季学期数学期末",
                    status: "已结束",
                    startTime: Date.now() - 7200000, // 两小时前
                    endTime: Date.now() - 3600000,   // 一小时前
                    examineeNum: 45
                },
                available: true
            },
            {
                site: 2000,
                id: 2,
                name: "第二考场",
                capacity: 80,
                recentExam: {
                    id: 102,
                    roomID: 2,
                    name: "英语期末考试",
                    examID: 5002,
                    examName: "2025春季学期英语期末",
                    status: "进行中",
                    startTime: Date.now() - 1800000, // 半小时前
                    endTime: Date.now() + 5400000,   // 1.5小时后
                    examineeNum: 70
                },
                available: false
            },
            {
                site: 2000,
                id: 3,
                name: "第三考场",
                capacity: 100,
                recentExam: {
                    id: 103,
                    roomID: 3,
                    name: "物理期末考试",
                    examID: 5003,
                    examName: "2025春季学期物理期末",
                    status: "未开始",
                    startTime: Date.now() + 3600000, // 一小时后
                    endTime: Date.now() + 7200000,   // 两小时后
                    examineeNum: 0
                },
                available: true
            }
        ];

        // 假数据：分页信息
        originalExamRooms = examRooms;
        total_num = examRooms.length;
        total_pages = 1;

   /*     // ====================== 获取考点信息 ======================
        return fetch(`/api/exam-site`, {
            method: "POST", // 
            credentials: "include",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(siteBody),
        })
            .then((res) => {
                if (!res.ok) {
                    throw new Error(`获取考点信息失败: ${res.statusText}`);
                }
                return res.json();
            })
            .then((siteData) => {
                if (siteData.status !== 0) {
                    toast.error("获取考点信息失败，请稍后重试");
                    throw new Error("考点信息错误: " + siteData.msg);
                }

                // 更新考点信息
                siteName = siteData.data?.name || "未命名考点";
                siteAddress = siteData.data?.address || "";
                siteLink = siteData.data?.serverHost || "";
                adminID = siteData.data?.admin ?? 0;
                adminName = siteData.data?.adminName || "";

                // ====================== 获取考场列表 ======================
                const q = {
                    page: current_page,
                    pageSize: page_size,
                    orderBy: [{ capacity: "DESC" }],
                    data: { examSiteID: current_site_id },
                    filter: { name: search_text }
                };

                const roomUrl = `/api/exam-room/list?q=${encodeURIComponent(JSON.stringify(q))}`;

                return fetch(roomUrl, {
                    method: "GET",
                    credentials: "include",
                    headers: { "Content-Type": "application/json" },
                });
            })
            .then((res) => {
                if (!res.ok) {
                    throw new Error(`获取考场列表失败: ${res.statusText}`);
                }
                return res.json();
            })
            .then((roomData) => {
                if (roomData.status !== 0) {
                    toast.error("获取考场数据失败，请稍后重试");
                    throw new Error("考场数据错误: " + roomData.msg);
                }

                if (!roomData.data) {
                    examRooms = [];
                    originalExamRooms = [];
                    total_num = 0;
                    total_pages = 0;
                } else {
                    examRooms = roomData.data;
                    originalExamRooms = roomData.data;
                    total_num = roomData.rowCount ?? 0;
                    total_pages = Math.ceil(total_num / page_size);
                }
            })
            .catch((err) => {
                console.error("Error fetching exam site and rooms:", err);
            });*/
    }

    
    function saveExamSite() { // 保存考点信息（重构后的接口，使用 then 流式处理）
        // 检查必填字段是否为空
        if (!siteName.trim()) {
            toast.error("考点名称不能为空");
            return;
        }
        if (!siteAddress.trim()) {
            toast.error("考点地址不能为空");
            return;
        }
        if (!siteLink.trim()) {
            toast.error("考点服务链接不能为空");
            return;
        }

        const reqProto = {
            action: "updateExamSite",
            sets: ["name", "address", "serverHost", "admin"], // 告诉后端要更新哪些字段
            orderBy: [],
            page: 1,
            pageSize: 1,
            data: {
                id: current_site_id,
                name: siteName,
                address: siteAddress,
                serverHost: siteLink, // 对应 curl 里的 serverHost
                admin: adminID
            },
            filter: {},
            authFilter: {}
        };

        fetch("/api/exam-site", {
            method: "PATCH",
            credentials: "include",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify(reqProto),
        })
            .then((response) => response.json())
            .then((responseData) => {
                if (responseData.status !== 0) {
                    console.error("更新考点失败:", responseData.msg);
                    toast.error(responseData.msg || "保存考点信息失败，请稍后重试");
                } else {
                    toast.success("保存考点信息成功");
                    fetchExamSiteAndRooms();
                }
            })
            .catch((error) => {
                console.error("Error updating exam site:", error);
                toast.error("保存考点信息失败，请稍后重试");
            });
    }

    // 保存考场信息（重构后的接口，.then链式版本）
    function saveExamRooms() {
        // 找出修改过的考场数据
        const modifiedRooms = examRooms.filter((room, index) => {
            const originalRoom = originalExamRooms[index];
            return (
                room.name !== originalRoom.name ||
                room.capacity !== originalRoom.capacity
            );
        });

        if (modifiedRooms.length === 0) {
            toast.error("没有需要保存的修改");
            return;
        }

        // 检查修改过的考场数据是否有空值
        for (const room of modifiedRooms) {
            if (!room.name.trim()) {
                toast.error("考场名称不能为空");
                return;
            }
            if (!room.capacity || room.capacity <= 0) {
                toast.error("考场容量必须大于0");
                return;
            }
        }

        // 针对每个修改过的考场分别发送 PATCH 请求
        const updatePromises = modifiedRooms.map((room) => {
            const reqProto = {
                action: "updateExamRoom",
                sets: ["name", "capacity"], // 指定更新字段
                orderBy: [],
                page: 1,
                pageSize: 1,
                data: {
                    id: room.id,
                    name: room.name,
                    capacity: room.capacity,
                },
                filter: {},
                authFilter: {}
            };

            return fetch("/api/exam-room", {
                method: "PATCH",
                credentials: "include",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(reqProto),
            }).then((res) => res.json());
        });

        Promise.all(updatePromises)
            .then((results) => {
                let hasError = false;
                results.forEach((responseData) => {
                    if (responseData.status !== 0) {
                        hasError = true;
                        console.error("更新考场失败:", responseData.msg);
                        toast.error(responseData.msg || "部分考场信息保存失败，请稍后重试");
                    }
                });

                if (!hasError) {
                    toast.success("保存考场信息成功");
                }
            })
            .then(() => {
                return fetchExamSiteAndRooms(); // 更新或恢复原始数据
            })
            .catch((error) => {
                console.error("Error updating exam rooms:", error);
                toast.error("保存考场信息失败，请稍后重试");
                fetchExamSiteAndRooms(); // 恢复原始数据
            });
    }

    /**
     * 打开删除考场确认对话框
     * @param {number} roomID - 要删除的考场ID
     */
    function openDeleteRoomDialog(roomID) {
        current_delete_room_id = roomID;
        deleteDialogOpen = true;
    }

    async function deleteExamRoom() {
        try {
            const reqProto = {
                action: "deleteExamRoom",
                data: {
                    id: current_delete_room_id,
                },
            };

            const response = await fetch("/api/admin/exam-room", {
                method: "DELETE",
                credentials: "include",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(reqProto),
            });

            const responseData = await response.json();
            if (responseData.status !== 0) {
                console.error("删除考场失败:", responseData.msg);
                toast.error(responseData.msg || "删除考场失败，请稍后重试");
            } else {
                deleteDialogOpen = false;
                await fetchExamSiteAndRooms();
                toast.success("删除考场成功");
            }
        } catch (error) {
            console.error("Error deleting exam room:", error);
            toast.error("删除考场失败，请稍后重试");
        }
    }

    /**
     * 处理分页导航
     * @param {boolean} is_next - 是否下一页，true表示下一页，false表示上一页
     */
    async function handlePageNavigation(is_next) {
        if (is_next && current_page < total_pages) {
            current_page++;
        } else if (!is_next && current_page > 1) {
            current_page--;
        }
        await fetchExamSiteAndRooms();
    }

    /**
     * 处理页码选择
     * @param {number} page - 要跳转的页码
     */
    async function handlePageSelect(page) {
        current_page = page;
        await fetchExamSiteAndRooms();
    }

    /**
     * 处理每页显示数量变化
     * @param {string} value - 新的每页显示数量
     */
    async function handlePageSizeChange(value) {
        page_size = parseInt(value);
        current_page = 1;
        await fetchExamSiteAndRooms();
    }

    /**
     * 处理页码搜索
     * @param {string} value - 用户输入的页码
     */
    async function handlePageSearch(value) {
        const pageNum = parseInt(value);
        if (!isNaN(pageNum) && pageNum > 0 && pageNum <= total_pages) {
            current_page = pageNum;
            await fetchExamSiteAndRooms();
        }
    }

    /**
     * 打开新增考场对话框
     */
    function openAddRoomDialog() {
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
        if (!new_room.name.trim()) {
            toast.error("考场名称不能为空");
            return;
        }
        if (!new_room.capacity || new_room.capacity <= 0) {
            toast.error("考场容量必须大于0");
            return;
        }

        try {

            const reqProto = {
                action: "addExamRoom",
                data: {
                    site_id: current_site_id,
                    name: new_room.name,
                    capacity: new_room.capacity,
                },
            };

            const response = await fetch("/api/admin/exam-room", {
                method: "POST",
                credentials: "include",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(reqProto),
            });

            const responseData = await response.json();

            if (responseData.status !== 0) {
                console.error("新增考场失败:", responseData.msg);
                toast.error(responseData.msg || "新增考场失败，请稍后重试");
            } else {
                toast.success("新增考场成功");
                closeAddRoomDialog(); // 关闭弹窗并重置表单
                await fetchExamSiteAndRooms(); // 刷新考场列表
            }
        } catch (err) {
            console.error("提交新增考场请求失败：", err);
            toast.error("新增考场失败，请稍后重试");
        }
    }

    /**
     * 
     * 日志获取函数
     * @param {number} page
     * @param {number} pageSize
     * @return {Promise<logResult>}
     */
    async function logFetchFunc(page, pageSize) {

        return new Promise((resolve, reject)=>{
            /**
             * @type {logResult}
             */
            let result = {
                data: [],
                total: 0,
            };

            let query_params = new URLSearchParams({
                page: `${page}`,
                pageSize: `${pageSize}`,
                siteID: `${current_site_id}`,
            })

            fetch(
                `/api/admin/exam-site/log?${query_params}`,
                {
                    method: "GET",
                    credentials: "include",
                },
            )
            .then((resp) => {

                if (resp.ok) {
                    return resp.json();
                }

                throw new Error(`网络请求失败, ${resp.statusText} (${resp.status})`);

            })
            .then((respData) => {

                if (respData.status != 0) {
                    throw new Error(`${respData.msg}`);
                }

                resolve({
                    data: respData.data,
                    total: respData.rowCount,
                });

            })
            .catch((err) => {
                
                toast.error(`获取考点日志失败: ${err.message}`);
                
                reject(err);

            })


        });

    }

    onMount(async () => {
        const pathParts = window.location.pathname.split("/");
        
        const lastSegment = pathParts[pathParts.length - 1];
        
        current_site_id = parseInt((lastSegment.replace(/^\s+|\s+$/g, "")));
        
        fetchExamSiteAndRooms();

        

    });

</script>

<div class="page">

    <div class="page-header">
        <Title title="编辑考点" />
    </div>
    
    <div class="container">

        <div class="site-info">

            <div class="info-title">
                考点信息

                <button
                    class="operation"
                    onclick={() => {
                        operation_log_panel?.showLogPanelWithPagination(logFetchFunc)
                    }}
                >
                    查看日志
                </button>

            </div>

            <div class="form-row">
                <span class="label-group">
                    <span class="required">*</span>
                    <span class="label">考点名称：</span>
                </span>
                <input
                    class="input"
                    placeholder="请输入考点名称"
                    bind:value={siteName}
                />
            </div>

            <div class="form-row">
                <span class="label-group">
                    <span class="required">*</span>
                    <span class="label">考点地址：</span>
                </span>
                <input
                    class="input"
                    placeholder="请输入考点地址"
                    bind:value={siteAddress}
                />
            </div>

            <div class="form-row">
                <span class="label-group">
                    <span class="required">*</span>
                    <span class="label">考点服务链接：</span>
                </span>
                <input
                    class="input"
                    placeholder="请输入考点服务链接"
                    bind:value={siteLink}
                />
            </div>

            <div class="form-row">
                <span class="label-group">
                    <span class="required">*</span>
                    <span class="label">考点负责人：</span>
                </span>
                
                <div class="input hideBorder">
                    {#if adminID == 0}
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
                        <span class="selected-admin" title="{adminName}">
                            {adminName}
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

            <div class="form-buttons">

                <button 
                    class="btn-save" 
                    onclick={saveExamSite}>
                    保存考点信息
                </button>

                

            </div>

        </div>

        <div class="exam-room-info">
            
            <div class="room-header">
                <div class="info-title">考场列表</div>
                
                <div class="room-toolbar">
                    <span class="label">搜索考场:</span>
                    
                    <div class="input-group">
                        <input
                            type="text"
                            placeholder="请输入考场名称"
                            bind:value={search_text}
                            class="filter-input"
                            onchange={(event) => {
                                fetchExamSiteAndRooms();
                            }}
                        />
                        <button
                            class="clear-button"
                            onclick={() => {
                                search_text = ""
                                fetchExamSiteAndRooms();
                            }}
                        >
                            ×
                        </button>
                    </div>
                
                    <button class="add-button" onclick={openAddRoomDialog}>
                        + 新增考场
                    </button>
                
                    <button class="btn-save" onclick={saveExamRooms}>
                        保存考场信息
                    </button>
                </div>
            </div>

           <table class="exam-room-list-table">
                <thead>
                    <tr>
                        <th class="room-name">考场名称</th>
                        <th class="room-capacity">考场容量</th>
                        <th class="room-operation">操作</th>
                    </tr>
                </thead>
                <tbody>
                    {#if examRooms.length === 0}
                        <tr>
                            <td colspan="3" style="text-align: center;">
                                暂无考场数据
                            </td>
                        </tr>
                    {/if}
            
                    {#each examRooms as room, i}
                        <tr>
                            <td class="room-name">
                                <input
                                    type="text"
                                    class="room-name-input"
                                    bind:value={room.name}
                                />
                            </td>
                            <td class="room-capacity">
                                <div class="capacity-wrapper">
                                    <input
                                        type="number"
                                        min="1"
                                        class="capacity-input {!room.canChange
                                            ? 'disabled'
                                            : ''}"
                                        bind:value={room.capacity}
                                        disabled={!room.canChange}
                                    />
                                    {#if !room.canChange}
                                        <div class="capacity-tip">
                                            该考场正在使用中，无法修改考场容量
                                        </div>
                                    {/if}
                                </div>
                            </td>
                            <td class="room-operation">
                                <div class="operation-group">
                                    <div class="operation-row">
                                        <button
                                            class="operation {!room.canChange
                                                ? 'disabled'
                                                : ''}"
                                            onclick={() =>
                                                room.canChange
                                                    ? openDeleteRoomDialog(
                                                            room.id,
                                                        )
                                                    : null}
                                            >删除
                                            {#if !room.canChange}
                                                <div
                                                    class="delete-error-tip"
                                                >
                                                    该考场正在使用中，无法删除
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
            
            <div class="pagination-container">
                <Pagination
                    total_data_num={total_num}
                    total_page_num={total_pages}
                    current_page_num={current_page}
                    max_show_page_num={5}
                    data_num_per_page_options={[
                        { value: 10, label: "10条/页" },
                        { value: 15, label: "15条/页" },
                        { value: 20, label: "20条/页" },
                    ]}
                    selected={{ value: page_size, label: `${page_size}条/页` }}
                    onPageChangeFunc={handlePageNavigation}
                    onPageChooseFunc={handlePageSelect}
                    selectOptionFunc={handlePageSizeChange}
                    onPageSearchFunc={handlePageSearch}
                    expand_direction="up"
                ></Pagination>
            </div>
            
        </div>
    </div>
</div>

<Dialog
    bind:isOpen={deleteDialogOpen}
    title="确认删除该考场?"
    content="删除后无法恢复，请谨慎操作"
    confirmTextBackgroundColor="#E34D59"
    onConfirm={deleteExamRoom}
/>

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
        adminID = selected_admin_ids.length > 0 ? selected_admin_ids[0].id : adminID;
        adminName = selected_admin_ids.length > 0 ? selected_admin_ids[0].name : adminName;
    }}
/>

<AwesomeLogPanel bind:this={operation_log_panel} />

<style lang="scss" scoped>

    .page {
        height: 100%;
        background-color: var(--bg-primary);
        overflow: auto;
    }

    .page-header {
        max-height: 10%;
    }
    .container {
        display: flex;
        padding: 0px;
        height: 90%;
        width: 100%;
        min-width: 1200px;
        min-height: 600px;
        box-sizing: border-box;
        padding: 0 25px 0 25px;
        overflow-x: auto;
    }

    .info-title {
        font-size: 16px;
        font-weight: bold;
        margin-bottom: 10px;
    }

    .site-info {
        width: 35%;
        background-color: inherit;
        border: 1px solid #e5e5e5;
        border-radius: 4px;
        padding: 20px;
        margin: 0 5px 0 5px;

        .form-row {
            display: flex;
            align-items: center;
            margin-bottom: 20px;

            &:last-child {
                margin-bottom: 0;
            }
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
        }

        .label {
            color: #222;
            font-size: 14px;
        }

        .input {
            display: flex;
            justify-content: flex-start;
            align-items: center;
            height: 30px;
            border: 1px solid #d7d7d7;
            border-radius: 2px;
            padding: 0 10px;
            font-size: 14px;

            &:focus {
                border-color: #165dff;
                outline: none;
            }

            &.hideBorder {
                border: none;
                background-color: transparent;
            }
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
    }

    .selected-admin {
        display: inline-block;
        max-width: 100px;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
        vertical-align: middle;
    }

    .form-buttons {
        display: flex;
        justify-content: flex-start;
        margin-top: 20px;
        margin-left: 138px;
    }

    .btn-save {
        width: 105px;
        height: 32px;
        background: #165dff;
        border: none;
        border-radius: 3px;
        color: #fff;
        font-size: 14px;
        cursor: pointer;

        &:hover {
            background: #0052d9;
        }
    }

    .exam-room-info {
        display: block;
        position: relative;
        min-height: 90%;
        background-color: var(--bg-primary);
        border: 1px solid #e5e5e5;
        border-radius: 4px;
        padding: 20px;
        overflow: hidden;
        box-sizing: border-box;

        .room-header {
            position: relative;
            display: flex;
            flex-direction: column;
            height: 10%;
            min-height: 100px;
        }

    }

    .room-toolbar {
        display: flex;
        align-items: center;
        gap: 12px;
        padding: 10px 10px;

        .label {
            color: #7f7f7f;
            font-size: 14px;
            min-width: fit-content;
            display: flex;
            align-items: center;
            margin-right: 8px;
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

                &:focus {
                    border-color: #165dff;
                    outline: none;
                }
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

    .exam-room-list-table {
        display: block;
        min-width: 100%;
        height: 70%;
        overflow-y: auto;
        background-color: inherit;
        padding: 0 10px 0 10px;
        width: 100%;
        text-align: center;

        tr {
            display: table;
            background-color: inherit;
            width: 100%;
            table-layout: fixed;
            border-collapse: collapse;
        }
        
        thead {
            display: block;
            width: 100%;
            position: sticky;
            top: 0;
            background-color: inherit;
            z-index: 1;
        }

        tbody {
            width: 100%;
            display: block;
            overflow-y: auto;
            
        }

    }

    th,
    td {
        background-color: inherit;
        font-weight: normal;
        color: #333333;
        border-bottom: 1px solid #ddd;
        box-sizing: border-box;
    }

    th {
        font-size: 14px;
        font-weight: normal;
        color: rgb(0, 0, 0, 0.3);
        border: none;
        padding: 8px;
        text-align: center;
    }

    td {
        height: 60px;
        font-size: 14px;
    }

    .room-name {
        min-width: 40%;
        text-overflow: ellipsis;
        overflow: hidden;
        white-space: nowrap;
    }

    .room-capacity {
        min-width: 20%;
    }

    .room-operation {
        min-width: 40%;
    }

    .operation-group {
        display: flex;
        justify-content: center;
    }

    .operation-row {
        display: flex;
        gap: 12px;
        justify-content: center;
    }

    .operation {
        border: none;
        font-size: 14px;
        background-color: inherit;
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
            background-color: inherit;
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
    }

    .input {
        flex: 1;
        height: 30px;
        border: 1px solid #d7d7d7;
        border-radius: 2px;
        padding: 0 10px;
        font-size: 14px;

        &:focus {
            border-color: #165dff;
            outline: none;
        }
    }

    .capacity-wrapper {
        position: relative;
        display: inline-block;
    }

    .capacity-input {
        width: 80px;
        height: 30px;
        border: 1px solid #d7d7d7;
        border-radius: 2px;
        padding: 0 10px;
        font-size: 14px;
        text-align: center;

        &:focus {
            border-color: #165dff;
            outline: none;
        }

        &.disabled {
            background-color: #f5f5f5;
            cursor: not-allowed;
        }
    }

    .capacity-tip {
        display: none;
        position: absolute;
        transform: translateX(-50%);
        width: fit-content;
        left: 50%;
        z-index: 10;
        bottom: calc(100% + 4px);
        white-space: nowrap;
        text-align: center;
        background-color: inherit;
        color: #1d2129;
        border: 1px solid #ddd;
        border-radius: 1px;
        padding: 4px 8px;
        font-size: 10px;
    }

    .capacity-wrapper:hover .capacity-tip {
        display: block;
    }

    .room-name-input {
        width: 80%;
        height: 30px;
        border: 1px solid #d7d7d7;
        border-radius: 2px;
        padding: 0 10px;
        font-size: 14px;
        text-align: center;

        &:focus {
            border-color: #165dff;
            outline: none;
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
        margin-right: 20px;
    }

    .dialog-mask {
        position: fixed;
        left: 0;
        top: 0;
        width: 100vw;
        height: 100vh;
        background: rgba(23, 23, 23, 0.5);
        z-index: 1000;
        display: flex;
        align-items: center;
        justify-content: center;
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
        flex: 1;
        height: 30px;
        border: none;
        border-left: 1px solid #d7d7d7;
        border-radius: 2px;
        padding: 0 10px;
        font-size: 14px;
        background: #fafbfc;
    }

    .input::placeholder {
        font-size: 10px;
    }

    .input:focus {
        border-left: 1px solid #165dff;
        outline: none;
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
</style>
