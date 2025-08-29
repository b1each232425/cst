<script>
	import { goto } from "$app/navigation";
	import { formatISOString } from "$lib/utils/time_utils";

    // @ts-nocheck
    import DatePicker from "../../DatePicker/DatePicker.svelte";
    import Pagination from "../../Pagination.svelte";
    import Title from '$lib/components/Title/Title.svelte';
    import { onMount } from "svelte";

    /**
     * @type {Array<{
     *      exam_id: number, // 考试ID
     *      name: string,         // 考试名称
     *      exam_session_name: string,       // 场次名称
     *      start_time: string,  // 开始时间
     *      end_time: string,    // 结束时间
     *      examinee_num: number         // 考试人数
     *      exam_session_id: number, // 考试场次ID
     * }>}
     */
    let exams = $state([]);

    let search_text = $state("");
    let total_num = $state(0);
    let total_pages = $state(0);
    let current_page = $state(1);
    let page_size = $state(10);
    let current_room_id = $state("");

    /**
     * 开始时间(Unix 时间戳, 单位为秒)
     * @type {number | null}
     */
    let start_time = $state(0);

    /**
     * 结束时间(Unix 时间戳, 单位为秒)
     * @type {number | null}
     */
    let end_time = $state(0);

    let room_name = $state("加载中...");

    /**
     * 将 Date 对象格式化为 "YYYY-MM-DD HH:mm:ss" 格式
     * @param {Date} date - 要格式化的日期对象
     * @returns {string} 格式化后的日期字符串
     */
    function formatDateTime(date) {
        if (!date) return "";
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, "0");
        const day = String(date.getDate()).padStart(2, "0");
        const hours = String(date.getHours()).padStart(2, "0");
        const minutes = String(date.getMinutes()).padStart(2, "0");
        const seconds = String(date.getSeconds()).padStart(2, "0");
        return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
    }

    // 获取考场名称
    async function fetchRoomName() {
        try {
            const queryParams = new URLSearchParams({
                roomID: current_room_id,
            });

            const response = await fetch(
                `/api/admin/exam-room-name?${queryParams}`,
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
                console.error("获取考场名称失败:", responseData.msg);
                room_name = "加载失败";
                return;
            }

            room_name = responseData.data.name || "无数据";
        } catch (error) {
            console.error("Error fetching room name:", error);
            room_name = "加载失败";
        }
    }

    // 从后端获取考试列表和考场名称
    async function fetchExamsAndRoomName() {
        try {
            // 先获取考场名称
            await fetchRoomName();

            const queryParams = new URLSearchParams({
                page: current_page.toString(),
                pageSize: page_size.toString(),
                roomID: current_room_id,
                searchText: search_text,
                startTime: start_time ? `${start_time}` : "",
                endTime: end_time ? `${end_time}` : "",
            });

            const response = await fetch(
                `/api/admin/exam-room-exam?${queryParams}`,
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
                console.error("获取考试数据失败:", responseData.msg);
                return;
            }

            if (!responseData.data) {
                exams = [];
                total_num = 0;
                total_pages = 0;
            } else {
                exams = responseData.data;
                total_num = responseData.rowCount;
                total_pages = isNaN(Math.ceil(total_num / page_size)) ? 1 : Math.ceil(total_num / page_size);
            }
        } catch (error) {
            console.error("Error fetching exams:", error);
        }
    }

    /**
     * 处理页面导航
     * @param {boolean} is_next - 是否为下一页，true表示下一页，false表示上一页
     */
    async function handlePageNavigation(is_next) {
        if (is_next && current_page < total_pages) {
            current_page++;
        } else if (!is_next && current_page > 1) {
            current_page--;
        }
        await fetchExamsAndRoomName();
    }

    /**
     * 处理页码选择
     * @param {number} page - 要跳转的目标页码
     */
    async function handlePageSelect(page) {
        current_page = page;
        await fetchExamsAndRoomName();
    }

    /**
     * 处理每页显示数量变化
     * @param {string} value - 新的每页显示数量
     */
    async function handlePageSizeChange(value) {
        page_size = parseInt(value);
        current_page = 1; // 重置到第一页
        await fetchExamsAndRoomName();
    }

    /**
     * 处理页码搜索跳转
     * @param {string} value - 要跳转的目标页码
     */
    async function handlePageSearch(value) {
        const pageNum = parseInt(value);
        if (!isNaN(pageNum) && pageNum > 0 && pageNum <= total_pages) {
            current_page = pageNum;
            await fetchExamsAndRoomName();
        }
    }

    onMount(async () => {
        const pathParts = window.location.pathname.split("/");
        const lastSegment = pathParts[pathParts.length - 1];
        current_room_id = lastSegment.replace(/^\s+|\s+$/g, "");

        // // 测试数据
        // exams = [
        //     {
        //         name: "2024年春季期末考试",
        //         sessions: [
        //             {
        //                 name: "1",
        //                 start_time: "2024-03-21 09:00:00",
        //                 end_time: "2024-03-21 11:00:00",
        //                 num: 45,
        //             },
        //             {
        //                 name: "2",
        //                 start_time: "2024-03-21 14:00:00",
        //                 end_time: "2024-03-21 16:00:00",
        //                 num: 42,
        //             },
        //             {
        //                 name: "3",
        //                 start_time: "2024-03-22 09:00:00",
        //                 end_time: "2024-03-22 11:00:00",
        //                 num: 38,
        //             },
        //         ],
        //     },
        //     {
        //         name: "2024年春季期中考试",
        //         sessions: [
        //             {
        //                 name: "1",
        //                 start_time: "2024-02-15 09:00:00",
        //                 end_time: "2024-02-15 11:00:00",
        //                 num: 48,
        //             },
        //             {
        //                 name: "2",
        //                 start_time: "2024-02-15 14:00:00",
        //                 end_time: "2024-02-15 16:00:00",
        //                 num: 46,
        //             },
        //         ],
        //     },
        //     {
        //         name: "2024年春季模拟考试",
        //         sessions: [
        //             {
        //                 name: "1",
        //                 start_time: "2024-01-20 09:00:00",
        //                 end_time: "2024-01-20 11:00:00",
        //                 num: 50,
        //             },
        //         ],
        //     },
        // ];

        // total_num = exams.length;
        // total_pages = Math.ceil(total_num / page_size);
        // room_name = "第一考场";

        await fetchExamsAndRoomName();
    });

    /**
     * 选择日期范围
     * @param {Date|null} start - 开始日期
     * @param {Date|null} end - 结束日期
     */
    function onSelectDate(start, end) {
        if (start !== null) {
            // 设置开始时间为当天的 00:00:00
            start.setHours(0, 0, 0);
        }

        if (end !== null) {
            // 设置结束时间为当天的 23:59:59
            end.setHours(23, 59, 59);
        }

        start_time = start?.getTime() / 1000;
        end_time = end?.getTime() / 1000;
        fetchExamsAndRoomName();
    }

    //清空日期筛选
    function onClearDate() {
        start_time = "";
        end_time = "";
        fetchExamsAndRoomName();
    }
</script>

<div class="page">

    <Title title={` ${room_name} 考试列表`} />

    <div class="container">
        <div class="exam-toolbar">
            <span class="label">搜索考试:</span>
            <div class="input-group">
                <input
                    type="text"
                    placeholder="请输入考试名称"
                    bind:value={search_text}
                    class="filter-input"
                    onchange={(event) => {
                        fetchExamsAndRoomName();
                    }}
                />
                <button 
                    class="clear-button" 
                    onclick={() => {
                        search_text = ""
                        fetchExamsAndRoomName();
                    }}
                >
                    ×
                </button>
            </div>
            <span class="label">考试时间:</span>
            <div class="date-picker">
                <DatePicker
                    start_date={null}
                    end_date={null}
                    {onSelectDate}
                    {onClearDate}
                ></DatePicker>
            </div>
        </div>
        <div class="content">
            <table>
                <thead>
                    <tr>

                        <th class="exam-name">
                            考试名称
                        </th>
                        <th class="exam-session">
                            考试场次
                        </th>
                        <th class="exam-time">
                            考试时间
                        </th>
                        <th class="exam-num">
                            考试人数
                        </th>
                        <th class="exam-operation">
                            操作
                        </th>

                    </tr>
                </thead>
                <tbody>

                    {#if exams.length === 0}
                        <tr>
                            <td colspan="4" style="text-align: center;">
                                暂无考试数据
                            </td>
                        </tr>
                    {/if}

                    {#each exams as exam}
                        <tr
                            class="last-exam-row"
                        >
                            <td
                                class="exam-name"
                                title={exam?.exam_name ?? "-"}
                            >
                                {exam?.exam_name ?? "-"}
                            </td>

                            <td 
                                class="exam-session
                                    {exam?.exam_session_name ? "" : "none"}
                                " 
                                title={exam?.exam_session_name ?? "-"}
                            >
                                {exam?.exam_session_name ?? "待下发"}
                            </td>
                            
                            <td 
                                class="exam-time"
                                title={
                                    exam?.start_time && exam?.end_time
                                        ? `${exam.start_time} - ${exam.end_time}`
                                        : "-"
                                }
                            >
                                {formatISOString(exam?.start_time ?? "")} - {formatISOString(exam?.end_time ?? "")}
                            </td>
                            
                            <td 
                                class="exam-num"
                                title={`${exam?.examinee_num ? exam?.examinee_num : 0} 人`}
                            >
                                {exam?.examinee_num ? exam?.examinee_num : 0}人
                            </td>

                            <td 
                                class="exam-operation"
                            >
                                <button
                                    onclick={() => {
                                        
                                        localStorage.setItem("invigilation_session_info", JSON.stringify({
                                            exam_session_id: exam.exam_session_id,
                                            exam_room_id: current_room_id,
                                            is_admin: true
                                        }));

                                        goto(
                                            `/teacher/invigilationList/invigilation`
                                        )
                                        
                                    }}
                                >
                                    查看监考
                                </button>
                            </td>
                        
                        </tr>
                    {/each}
                </tbody>
            </table>
        </div>

        <div class="pagination-container">
            <Pagination
                total_data_num={total_num ?? 0}
                total_page_num={total_pages ?? 1}
                current_page_num={current_page ?? 1}
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
        font-size: 20px;
        font-weight: bold;
        margin: 20px 0 10px 0;
        color: #222;
    }
    .exam-toolbar {
        display: flex;
        align-items: center;
        gap: 12px;
        padding: 10px 0px;
        margin-left: 20px;
        .label {
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
    .last-exam-row {
        border-bottom: 1px solid #ddd;
    }

    .exam-name {
        width: 25%;
        text-overflow: ellipsis;
        overflow: hidden;
        max-width: 300px;
        white-space: nowrap;
        position: relative;
    }

    .exam-session {
        width: 25%;
        text-overflow: ellipsis;
        overflow: hidden;
        max-width: 100px;
        white-space: nowrap;

        &.none {
            color: var(--text-secondary);
        }
    }

    .exam-time {
        width: 30%;
    }

    .exam-num {
        width: 10%;
    }

    .exam-operation {
        width: 10%;;

        button {
            color: var(--blue);
            background-color: transparent;
            border: none;
            cursor: pointer;

            &:hover {
                text-decoration: underline;
            }
        }
    }

    .pagination-container {
        display: flex;
        justify-content: flex-end;
        padding-top: 20px;
        padding-bottom: 20px;
    }
    .date-picker {
        width: 200px;
        height: 30px;
    }
</style>
