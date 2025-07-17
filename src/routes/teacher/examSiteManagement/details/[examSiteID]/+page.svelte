<script>
    // @ts-nocheck
    import Pagination from "$lib/component/Pagination.svelte";
    import Title from "$lib/component/Title.svelte";
    import { onMount } from "svelte";
    import { goto } from "$app/navigation";
    import { formatISOString } from "$lib/common/time_utils";

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
     */
    let examRooms = $state([]);

    let search_text = $state("");
    let total_num = $state(0);
    let total_pages = $state(0);
    let current_page = $state(1);
    let page_size = $state(10);
    let current_site_id = $state("");
    let siteName = $state("加载中...");

    // 获取考点名称
    async function fetchSiteName() {
        try {
            const queryParams = new URLSearchParams({
                siteID: current_site_id,
            });

            const response = await fetch(
                `/api/admin/exam-site-name?${queryParams}`,
                {
                    method: "GET",
                    credentials: "include",
                },
            );

            if (!response.ok) {
                throw new Error("Network response was not ok");
            }

            const responseData = await response.json();
            if (responseData.status !== 0) {
                console.error("获取考点名称失败:", responseData.msg);
                siteName = "加载失败";
                return;
            }

            siteName = responseData.data.name || "无数据";
        } catch (error) {
            console.error("Error fetching site name:", error);
            siteName = "加载失败";
        }
    }

    // 从后端获取考场列表和考点名称
    async function fetchExamRoomsAndSiteName() {
        try {
            await fetchSiteName();

            const queryParams = new URLSearchParams({
                page: current_page.toString(),
                pageSize: page_size.toString(),
                siteID: current_site_id,
                searchText: search_text,
            });

            const response = await fetch(
                `/api/admin/exam-room-list/by-exam-site?${queryParams}`,
                {
                    method: "GET",
                    credentials: "include",
                },
            );

            if (!response.ok) {
                
                throw new Error(`Network response was not ok: ${response.statusText}`);
                
            }

            const responseData = await response.json();
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

                total_num = responseData.row_count ?? 0;

                total_pages = Math.ceil(total_num / page_size);
            }
            console.log(responseData.data);
        } catch (error) {
            console.error("Error fetching exam rooms:", error);
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
        await fetchExamRoomsAndSiteName();
    }

    /**
     * 处理页码选择
     * @param {number} page - 要跳转的目标页码
     * @description 直接跳转到指定页码并重新获取数据
     */
    async function handlePageSelect(page) {
        current_page = page;
        await fetchExamRoomsAndSiteName();
    }

    /**
     * 处理每页显示数量变化
     * @param {string} value - 新的每页显示数量
     * @description 更新每页显示数量，重置到第一页并重新获取数据
     */
    async function handlePageSizeChange(value) {
        page_size = parseInt(value);
        current_page = 1; // 重置到第一页
        await fetchExamRoomsAndSiteName();
    }

    /**
     * 处理页码搜索跳转
     * @param {string} value - 要跳转的目标页码
     * @description 验证输入的页码是否有效，如果有效则跳转到指定页码并重新获取数据
     */
    async function handlePageSearch(value) {
        const pageNum = parseInt(value);
        if (!isNaN(pageNum) && pageNum > 0 && pageNum <= total_pages) {
            current_page = pageNum;
            await fetchExamRoomsAndSiteName();
        }
    }

    /**
     * 跳转到考场所有考试信息页
     * @param {number} roomID - 考场ID
     */
    function viewAllExams(roomID) {
        goto(`/teacher/examSiteManagement/room/${roomID}`);
    }

    /**
     * 进入监考
     * @param {number} exam_session_id
     * @param {number} exam_room_id
     */
    function enterInvigilation(exam_session_id, exam_room_id){

        console.log("进入监考", exam_session_id, exam_room_id);

        localStorage.setItem("invigilation_session_info", JSON.stringify({
            exam_session_id: exam_session_id,
            exam_room_id: exam_room_id,
            is_admin: true
        }));

        goto(
            `/teacher/invigilationList/invigilation`
        )

    }

    onMount(async () => {
        const pathParts = window.location.pathname.split("/");
        const lastSegment = pathParts[pathParts.length - 1];
        current_site_id = lastSegment.replace(/^\s+|\s+$/g, "");
        await fetchExamRoomsAndSiteName();
    });

    
</script>

<div class="page">
    <Title title="考场列表"/>

    <div class="container">
        <div class="room-toolbar">
            

            <span class="label">考点名称: </span>
            <div class="input-group"> 
                <span class="site-name">{siteName}</span>
            </div>

            <span class="label">搜索考场: </span>
            <div class="input-group">
                <input
                    type="text"
                    placeholder="请输入考场名称"
                    bind:value={search_text}
                    class="filter-input"
                    onchange={(event) => {
                        
                        fetchExamRoomsAndSiteName();
                        
                    }}
                />
                <button class="clear-button" onclick={() => (search_text = "")}
                    >×</button
                >
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
                                title={room?.exam_room_name}
                            >
                                <div class="content">
                                    <span>{room?.exam_room_name ?? "-"}</span>
                                </div>
                                
                            </td>

                            <td
                                class="exam-room-capacity"
                            >
                                <div class="content">
                                    <span>{room.exam_room_capacity ?? 0}人</span>
                                </div>
                            </td>

                            <td
                                class="exam-name"
                                title={room?.recent_exam_session?.[0]?.exam_name}
                            >
                                <div class="content">
                                    <span>{room?.recent_exam_session?.[0]?.exam_name ?? "-"}</span>
                                </div>
                            </td>

                            <td
                                class="exam-session"
                                title={room?.recent_exam_session?.[0]?.exam_session_name}
                            >
                                <div 
                                    class="content {
                                        room?.recent_exam_session?.length === 0 || 
                                        room?.recent_exam_session?.[0]?.exam_session_name == null ?  "none" : ""
                                    }"
                                >
                                    <span>
                                        { 
                                            room?.recent_exam_session?.length === 0 ?  "-" :
                                                room?.recent_exam_session?.[0]?.exam_session_name ?? "待下发"
                                        }
                                    </span>
                                </div>
                            </td>

                            <td class="exam-time">

                                <div class="content">
                                    <span>
                                        {formatISOString(room?.recent_exam_session?.[0]?.start_time)} - {formatISOString(room?.recent_exam_session?.[0]?.end_time)}
                                    </span>
                                </div>
                                
                            </td>
                            
                            <td class="examinee-num">

                                <div class="content">
                                    <span>
                                        {room?.recent_exam_session?.[0]?.examinee_num ?? 0}人
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
            <Pagination
                total_data_num={total_num}
                total_page_num={total_pages}
                current_page_num={current_page}
                max_show_page_num={5}
                data_num_per_page_options={[
                    { value: 10, label: "10条/页" },
                    { value: 20, label: "20条/页" },
                    { value: 50, label: "50条/页" },
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

<style lang="scss" scoped>
    .page {
        overflow: auto;
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
