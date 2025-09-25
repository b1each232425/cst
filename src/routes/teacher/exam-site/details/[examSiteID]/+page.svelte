<script>
    // @ts-nocheck
    import Pagination from "$lib/components/Pagination/Pagination.svelte";
    import { onMount } from "svelte";
    import { goto } from "$app/navigation";
    import Title from '$lib/components/Title/Title.svelte';
    import { formatISOString } from "$lib/utils/time_utils";
    import InputBox from "$lib/components/Input/InputBox.svelte";

    /**
     * @type {Array<{
     *   id:number,//考点id
     *   siteName: string, // 考点名称
     *   name: string,     // 考场名称
     *   capacity: number, // 考场容量
     *   exams: {          // 最近一场考试
     *     name: string,   // 考试名称
     *     sessions: Array<{  // 考试场次列表
     *       startTime: string,
     *       endTime: string,
     *       num: number,
     *       name: string
     *     }>
     *   }>
     * }>
     * 
     * 
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
     * 处理每页显示数量变化
     * @param {string} value - 新的每页显示数量
     * @description 更新每页显示数量，重置到第一页并重新获取数据
     * 
     * 
     * 
     * 处理页码搜索跳转
     * @param {string} value - 要跳转的目标页码
     * @description 验证输入的页码是否有效，如果有效则跳转到指定页码并重新获取数据
     * 
     * 
     * 跳转到考场所有考试信息页
     * @param {number} roomID - 考场ID
     * 
     * 
     * 
     * 进入监考
     * @param {number} exam_session_id
     * @param {number} exam_room_id
     */


    let examRooms = $state([]); // 考场列表
    let search_text = $state(""); // 搜索关键词
    let total_num = $state(0); // 总记录数
    let total_pages = $state(0); // 总页数
    let current_page = $state(1); // 当前页码
    let page_size = $state(10); // 每页显示数量
    let current_site_id = $state(""); // 当前考点ID
    let siteName = $state("加载中..."); // 考点名称

    // 按钮控制类
    function viewAllExams(roomID) { // 跳转到考场所有考试信息页
        goto(`/teacher/examSiteManagement/room/${roomID}`);
    }
    function enterInvigilation(exam_session_id, exam_room_id){ // 进入监考
        localStorage.setItem("invigilation_session_info", JSON.stringify({
            exam_session_id: exam_session_id,
            exam_room_id: exam_room_id,
            is_admin: true
        }));
        goto(
            `/teacher/invigilationList/invigilation`
        )

    }
    async function handlePageSelect(page) { // 处理页码选择
        current_page = page;
        await fetchExamRoomsAndSiteName();
    }
    async function handlePageSizeChange(value) { // 处理每页显示数量变化
        page_size = parseInt(value);
        current_page = 1; // 重置到第一页
        await fetchExamRoomsAndSiteName();
    }

// expose test hooks when running in test mode so unit tests can call internal handlers
if (typeof window !== 'undefined' && import.meta.env && import.meta.env.MODE === 'test') {
    window.__TEST__ = window.__TEST__ || {};
    window.__TEST__.handlePageSelect = (p) => handlePageSelect(p);
    window.__TEST__.handlePageSizeChange = (v) => handlePageSizeChange(v);
}

    // 数据获取类
    function fetchSiteName() {  // 获取考点名称
        const queryParams = new URLSearchParams({
            id: current_site_id,
        });

        return fetch(`/api/exam-site/list?${queryParams}`, {
            method: "GET",
            credentials: "include",
        })
        .then(response => {
            if (!response.ok) {
                throw new Error("Network response was not ok");
            }
            return response.json();
        })
        .then(responseData => {
            if (responseData.status !== 0) {
                console.error("获取考点名称失败:", responseData.msg);
                siteName = "无数据";  
                return;
            }
            siteName = responseData.data.name || "无数据";
        })
        .catch(error => {
            console.error("Error fetching site name:", error);
            siteName = "无数据";  
        });
    }
    function fetchExamRoomsAndSiteName() { // 从后端获取考场列表和考点名称
        fetchSiteName().then(() => {
            // 构造新的 q 参数
            const q = {
                page: current_page,
                pageSize: page_size,
                orderBy: [{ capacity: "DESC" }],
                data: { examSiteID: current_site_id },
                filter: { name: search_text }
            };

            const url = `/api/exam-room/list?q=${encodeURIComponent(JSON.stringify(q))}`;

            return fetch(url, {
                method: "GET",
                credentials: "include",
                headers: {
                    "Content-Type": "application/json",
                },
            });
        })
        .then(response => {
            if (!response.ok) {
                throw new Error(`Network response was not ok: ${response.statusText}`);
            }
            return response.json();
        })
        .then(responseData => {
            if (responseData.status !== 0) {
                console.error("获取考场数据失败:", responseData.msg);
                return;
            }

            if (!responseData.data) {
                examRooms = [];
                total_num = 0;
                total_pages = 0;
            } else {
                examRooms = responseData.data;
                total_num = responseData.rowCount ?? 0;
                total_pages = Math.ceil(total_num / page_size);
            }

        })
        .catch(error => {
            console.error("Error fetching exam rooms:", error);
        });


    }

    //入口
    onMount(async () => {
        const pathParts = window.location.pathname.split("/");
        const lastSegment = pathParts[pathParts.length - 1];
        current_site_id = lastSegment.replace(/^\s+|\s+$/g, "");
        await fetchExamRoomsAndSiteName();
    });

</script>

<Title title="考场列表"/>

<div class="page">
    

    <div class="container">
        <div class="room-toolbar">
            

            <span class="label">考点名称: </span>
            <div class="input-group"> 
                <span class="site-name">{siteName}</span>
            </div>

            <span class="label">搜索考场: </span>
            <div class="input-group">
                <InputBox
                    bind:value={search_text}
                    placeholder="请输入考场名称"
                    class="filter-input"
                    clearable={true}
                    show_label={false}
                    onInput={(val) => {
                        search_text = val;
                        fetchExamRoomsAndSiteName();
                    }}
                />
            </div>
        </div>
        <div class="content">
            <table>
                <thead>
                    <tr class="room-row">
                        <th class="exam-room-name">
                            <div class="content">
                                <span>考场名称</span>
                            </div>
                        </th>
                        <th class="exam-room-capacity">
                            <div class="content">
                                <span>考场容量</span>
                            </div>
                        </th>
                        <th class="exam-name">
                            <div class="content">
                                <span>考试名称</span>
                            </div>
                        </th>
                        <th class="exam-session">
                           <div class="content">
                                <span>考试场次</span>
                           </div>
                        </th>
                        <th class="exam-time">
                            <div class="content">
                                <span>考试时间</span>
                            </div>
                        </th>
                        <th class="examinee-num">
                            <div class="content">
                                <span>考试人数</span>
                            </div>
                        </th>
                        <th class="operation">
                            <div class="content">
                                <span>操作</span>
                            </div>
                        </th>
                    </tr>
                </thead>

                <tbody>

                    {#if examRooms.length === 0}
                        <tr>
                            <td colspan="7" class="no-data">暂无数据</td>
                        </tr>
                    {/if}

                    {#each examRooms as room}
                       <tr class="room-row  hasBottomBorder">

                            <td
                                class="exam-room-name"
                                title={room?.name}
                            >
                                <div class="content">
                                    <span>{room?.name ?? "-"}</span>
                                </div>
                                
                            </td>

                            <td
                                class="exam-room-capacity"
                            >
                                <div class="content">
                                    <span>{room.capacity ?? 0}人</span>
                                </div>
                            </td>

                            <td
                                class="exam-name"
                                title={room?.recentExam?.examName}
                            >
                                <div class="content">
                                    <span>{room?.recentExam?.examName ?? "-"}</span>
                                </div>
                            </td>

                            <td
                                class="exam-session"
                                title={room?.recentExam?.name}
                            >
                                <div 
                                    class="content {
                                        room?.recentExam?.name == null ?  "none" : ""
                                    }"
                                >
                                    <span>
                                        { 
                                            room?.recentExam ?  "-" :
                                                room?.recentExam?.name ?? "待下发"
                                        }
                                    </span>
                                </div>
                            </td>

                            <td class="exam-time">

                                <div class="content">
                                    <span>
                                        {formatISOString(room?.recentExam?.startTime)} - {formatISOString(room?.recentExam?.endTime)}
                                    </span>
                                </div>
                                
                            </td>
                            
                            <td class="examinee-num">

                                <div class="content">
                                    <span>
                                        {room?.recentExam?.examineeNum ?? 0}人
                                    </span>
                                </div>
                                
                            </td>
                            
                            <td
                                class="operation"
                            >
                                <div class="content">

                                    {#if room?.recent_exam_session?.length > 0}
                                        <button
                                            class="view-all-btn"
                                            onclick={() => {
                                                enterInvigilation(
                                                    room.recent_exam_session[0].exam_session_id,
                                                    room.exam_room_id
                                                )
                                            }}
                                        >
                                            进入当前监考
                                        </button>
                                    {/if}

                                    <button
                                        class="view-all-btn"
                                        onclick={() => viewAllExams(room.exam_room_id)}
                                    >
                                        查看所有考试
                                    </button>
                                </div>
                            </td>

                        </tr>
                    {/each}
                </tbody>
            </table>
        </div>

        <div class="pagination-container">
            <div class="pagination-container" data-testid="pagination">
                <Pagination
                    total_items={total_num}
                    page_size={page_size}
                    current_page={current_page}
                    page_size_options={[10, 20, 50]}
                    on:pageChange={(e) => handlePageSelect(e.detail)}
                    on:pageSizeChange={(e) => handlePageSizeChange(e.detail)}
                />
            </div>
        </div>
    </div>
</div>

<style lang="scss" scoped>
    .page {
        height: 100%;
    }
    .container {
        padding: 0px 20px;
        min-width: 1080px;
        display: flex;
        flex-direction: column;
        height: 100%;
    }
    .title {
        text-align: center;
        font-size: 16px;
        font-weight: bold;
        color: #222;
    }

    .room-toolbar {
        display: flex;
        align-items: center;
        gap: 12px;
        padding: 10px 0px;
        margin-left: 20px;
        .label {
            text-align: center;
            color: #7f7f7f;
            font-size: 14px;
            white-space: nowrap;
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
        height: 60px;
        box-sizing: border-box;

        .content {
            display: flex;
            flex-direction: column;
            justify-content: center;
            align-items: center;
            width: 100%;
            height: 100%;

            
            &.none {
                color: var(--text-secondary);
            }

        }
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
        span {
            display: -webkit-box;
            height: fit-content;
            max-height: 50px;
            overflow: hidden;
            text-overflow: ellipsis;
            -webkit-line-clamp: 2;
            -webkit-box-orient: vertical;
        }
    }
    .room-row {
        display: flex;
        min-width: 100%;
        max-width: 100%;

        &.hasBottomBorder {
            border-bottom: 1px solid #ddd;
        }

    }

    .exam-room-name {
        display: block;
        width: 15%;
        text-overflow: ellipsis;
        overflow: hidden;
        white-space: nowrap;
    }

    .exam-room-capacity {
        width: 7.5%;
    }

    .exam-name {
        display: block;
        width: 20%;
        text-overflow: ellipsis;
        overflow: hidden;
        white-space: nowrap;
        position: relative;
    }

    .exam-session {
        width: 22.5%;
        text-overflow: ellipsis;
        overflow: hidden;
        white-space: nowrap;
    }

    .exam-time {
        width: 20%;
    }

    .examinee-num {
        width: 7.5%;
    }

    .pagination-container {
        display: flex;
        justify-content: flex-end;
        padding-top: 20px;
        padding-bottom: 20px;
    }
    .date-picker {
        display: none;
    }

    .operation {
        width: 15%;
    }

    .view-all-btn {
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
    }
</style>
