<script>
    //@ts-nocheck
    import { goto } from "$app/navigation";
  import { onMount } from "svelte";
    let examList=$state([]);
    let Listrows = $state([]); //返回数据行数
    let name_search_timer = null;
    let loading = $state(false);
    let error = $state("");

    let currentPage = $state(1);
    let pageSize = $state(10);
    let totalPage = $state(1);
    // 映射关系
    const TypeMap = {
        "00": "平时考试",
        "02": "期末成绩考试",
        "04": "资格证考试",
    };

    const MethodMap = {
        "00": "线上考试",
        "02": "线下考试",
    };

    const StateMap = {
        "00": "未发布",
        "02": "待开始",
        "04": "进行中",
        "08": "已结束",
        "10": "已归档",
        "12": "考试异常",
    };

    const StateClassMap = {
        "00": "unpublished",
        "02": "to-start",
        "04": "on-going",
        "08": "ended",
        "10": "archived",
        "12": "error",
    };

    let searchParams = $state({
        page: 1,
        pageSize: 10,
        name: "",
        status: "",
        startTime: null,
        endTime: null,
    });

    async function fetchExamList() {
        fetch("/api/examList",{method:"GET"})
        .then((response) => response.json())
        .then((data) => {
            examList = data.data;
            Listrows = data.rowCount; // 获取总行数
        });
    }

    async function searchExam() {
        loading = true;
        error = "";

        // 构建查询参数
        let queryParams = new URLSearchParams();

        // 添加基础参数
        queryParams.append("page", searchParams.page.toString());
        queryParams.append("pageSize", searchParams.pageSize.toString());

        // 添加可选参数
        if (searchParams.name) {
            queryParams.append("name", searchParams.name);
        }
        if (searchParams.status) {
            queryParams.append("status", searchParams.status);
        }

        if (searchParams.startTime) {
            const start_time = new Date(searchParams.startTime);
            queryParams.append("startTime", start_time.toISOString());
        }
        if (searchParams.endTime) {
            const endTime = new Date(searchParams.endTime);
            queryParams.append("endTime", endTime.toISOString());
        }

        //  try {
        //     const response = await fetch(
        //         `/api/exam/list?${queryParams.toString()}`,
        //         {
        //             method: "GET",
        //             credentials: "include",
        //             headers: {
        //                 "Content-Type": "application/json",
        //             },
        //         },
        //     );

        //     const result = await response.json();
        //     examList = result.data;
        // } catch (error) {
        //     console.error("搜索失败:", error);
        // }

        fetch(`http://127.0.0.1:4523/m1/6247470-5941367-default/api/exam/list?apifoxApiId=322115866&${queryParams.toString()}`,
        {
            method: "GET",
            credentials: "include",
            headers: {
                "Content-Type": "application/json",
            },
        })
        .then((response) => response.json())
        .then((data) => {
            examList = data.data;
        })
        .catch((error) => {
            console.error("搜索失败:", error);
        });
    }

    function formatDateTime(isoString) {
        const date = new Date(isoString);
        return `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()} ${String(date.getHours()).padStart(2, "0")}:${String(date.getMinutes()).padStart(2, "0")}`;
    }

    function toggleMoreActions(index) {
        examList[index].action_expended = !examList[index].action_expended;
    }

    function onSearchFunc(value) {
        searchParams.name = value;

        //防抖逻辑
        if (name_search_timer) {
            clearTimeout(name_search_timer);
        }
        name_search_timer = setTimeout(() => {
            searchExam();
            name_search_timer = null;
        }, 300);
    }

    function onNextOrLastPage(is_next) {
        if (loading === true) return;
        if (is_next && searchParams.page < total_page) {
            searchParams.page += 1;
            searchExam();
        }
        if (!is_next && searchParams.page > 1) {
            searchParams.page -= 1;
            searchExam();
        }
    }

    // 模拟获取考试列表数据
        examList = [
            { name: '数学考试', type: '00', method: '00', start_time: '2023-10-01 10:00', end_time: '2023-10-01 12:00', duration: '120分钟', status: '00',delivery_status: '00',addi: '',action_expended:false,num_of_examinee:1},
            { name: '英语考试', type: '02', method: '02', start_time: '2023-10-02 14:00', end_time: '2023-10-02 15:30', duration: '90分钟', status: '04' ,delivery_status: '00',addi: '',action_expended:false,num_of_examinee:1},
            { name: '物理期中', type: '00', method: '00', start_time: '2023-10-03 09:00', end_time: '2023-10-03 11:00', duration: '120分钟', status: '02' ,delivery_status: '00',addi: '',action_expended:false,num_of_examinee:1},
            { name: '化学期末', type: '02', method: '02', start_time: '2023-10-04 13:30', end_time: '2023-10-04 15:00', duration: '90分钟', status: '04' ,delivery_status: '00',addi: '',action_expended:false,num_of_examinee:1},
            { name: '语文模拟', type: '04', method: '00', start_time: '2023-10-05 08:30', end_time: '2023-10-05 10:00', duration: '90分钟', status: '00' ,delivery_status: '00',addi: '',action_expended:false,num_of_examinee:1},
            { name: '生物测评', type: '02', method: '02', start_time: '2023-10-06 10:00', end_time: '2023-10-06 11:30', duration: '90分钟', status: '02' ,delivery_status: '00',addi: '',action_expended:false,num_of_examinee:1},
            { name: '历史会考', type: '00', method: '02', start_time: '2023-10-07 15:00', end_time: '2023-10-07 16:30', duration: '90分钟', status: '04' ,delivery_status: '00',addi: '',action_expended:false,num_of_examinee:1},
            { name: '历史会考', type: '00', method: '02', start_time: '2023-10-07 15:00', end_time: '2023-10-07 16:30', duration: '90分钟', status: '04' ,delivery_status: '00',addi: '',action_expended:false,num_of_examinee:1},
            { name: '历史会考', type: '00', method: '02', start_time: '2023-10-07 15:00', end_time: '2023-10-07 16:30', duration: '90分钟', status: '04' ,delivery_status: '00',addi: '',action_expended:false,num_of_examinee:1},
            { name: '历史会考', type: '00', method: '02', start_time: '2023-10-07 15:00', end_time: '2023-10-07 16:30', duration: '90分钟', status: '12' ,delivery_status: '00',addi: '',action_expended:false,num_of_examinee:1}
        ];

    onMount(() => {
        searchExam();
    });
</script>


{#snippet tableHead()}
    <tr>
        <th>考试名称</th>
        <th>考试类型</th>
        <th>考试方式</th>
        <th>考试时间</th>
        <th>考试时长</th>
        <th>考试状态</th>
        <th>考生人数</th>
        <th>操作</th>
    </tr>
{/snippet}

{#snippet actionRender(status,index)}
    <div class="button-container" style="background-color: rgb(0, 0, 0, 0);">
        <button class="continue-edit-button action-button {status !== '00' && status !== '02' ? 'hideButton' : ''}">继续编辑</button>
        <button class="publish-exam-button action-button {status !== '00' ? 'hideButton' : ''}">发布考试</button>
        <button class="delete-exam-button action-button {status !== '00' ? 'hideButton' : ''}">删除考试</button>
        <button class="cancel-exam-button action-button {status !== '02' ? 'hideButton' : ''}">取消考试</button>
        <button class="more-action-button action-button {status !== '04' ? 'hideButton' : ''}">监考管理</button>
        <button class="more-action-button action-button {status !== '04' ? 'hideButton' : ''}">操作日志</button>
        <button class="unpublished-more-action-button action-button {status !== '00' ? 'hideButton' : ''}"
        onclick={() => toggleMoreActions(index)}
        >更多...</button>

    </div>
{/snippet}

{#snippet tableData(data,index)}
    <tr>
        <td>{data.name} </td>
        <td>{TypeMap[data.type]} </td>
        <td>{MethodMap[data.method]} </td>
        <td>{formatDateTime(data.start_time)} - {formatDateTime(data.end_time)}</td>
        <td>{data.duration}</td>
        <td>{@render stateRender(data.status, data.addi)}</td>
        <td>{data.num_of_examinee}</td>
        <td>{@render actionRender(data.status,index)}</td>
    </tr>
{/snippet}

<!--考试状态标签-->
{#snippet stateRender(
    /** @type {"00" | "02" | "04" | "08" | "10" | "12"} */ status,
    /** @type {string} */ addi,
)}
    <!-- <div class="statusError {status === '12' ? 'visible' : 'hidden'}">
        <div class="statusTag {StateClassMap[status]}">
        {StateMap[status]}
        </div>
    <button class="tip {status === '12' ? 'visible' : 'hidden'}">
        <img
            src="/exam_list/tip.png"
            alt="提示"
            style="width: 16px; height:auto"
        />
        <div class="tooltip-text">考试异常：{delivery_status === "06"?"考卷下发失败":addi}</div>
    </button>
    <div class="statusTagNoError {StateClassMap[status]}" style="visibility: {status === '12' ? 'hidden' : 'visible'};">{StateMap[status]}</div>
</div> -->
    {#if status === "12"}
        <div class="statusError">
            <div class="statusTag {StateClassMap[status]}">
                {StateMap[status]}
            </div>
            <button class="tip "
                ><img
                    src="/tip.png"
                    alt="提示"
                    style="width: 16px; height:auto"
                />
                <div class="tooltip-text">{addi}</div></button
            >
        </div>
    {:else}
        <div class="statusTag {StateClassMap[status]}">{StateMap[status]}</div>
    {/if}
{/snippet}

<div class="examManagementContainer">
    <span>考试列表</span>
    <div class="tableFilterContainer">
        <div class="actionPart">        
            <div class="searchPart">
                <input 
                    type="text" 
                    class="search-input"
                    placeholder="请输入考试名称搜索"
                    bind:value={searchParams.name}
                    oninput={(e) => onSearchFunc(e.target.value)}
                />
            </div>
            <div class="filterPart"><select class="select-input">
                    <option value="">全部状态</option>
                    <option value="00">未发布</option>
                    <option value="02">待开始</option>
                    <option value="04">进行中</option>
                    <option value="08">已结束</option>
                    <option value="10">已归档</option>
                    <option value="12">考试异常</option>
                </select>
            </div>
            <div class="datePart"> 
                <input 
                    type="text" 
                    class="search-input"
                    placeholder="日期筛选"
                    bind:value={searchParams.name}
                    oninput={(e) => onSearchFunc(e.target.value)}
                /></div>
        </div>
        <div class="buttonPart">
                <button class="downloadTemplateButton">
                下载考生模板
            </button>
            <button
                class="addExamButton"
                onclick={() => {
                    goto("/teacher/examManagement/addExam");
                }}
            >
                + 新增考试
            </button>
            </div>
    </div>

    <div class="examListContainer"> 
        <table class="examListTable">
            <thead class="examListTableHead">
                {@render tableHead()}
            </thead>
            <tbody class="examListTableData">
               {#each examList as exam,index}
                    {@render tableData(exam,index)}
                {/each}
            </tbody>
        </table>
    </div>
    <div class="pagination-container">

    </div>
</div>

<style lang="scss" scoped>
   .hideButton {
    visibility: hidden;
    position: absolute;
    pointer-events: none;
  }
  .action-button {
    border: none;
    background-color: rgb(0, 0, 0, 0);  // 透明背景
    color: #356ed9;                 // 蓝色文字
    cursor: pointer;
    font-size: 14px;
    min-width: 70px;
}
    .action-button:hover {
        font-weight: bold;                  // 悬停时加粗
    }
    .examManagementContainer {
        position: relative;
        background-color: white;
        display: flex;
        flex-direction: column;
        overflow: auto;
        .tableFilterContainer {
            display: flex;
            flex-direction: row;
            flex-wrap: wrap;
            gap: 15px;
            padding: 17px 0 0 76px;
            align-items: center;
            justify-content: space-between;
            min-width: 1000px;
            .actionPart{
                display: flex;
                flex-direction: row;
                align-items: center;
                justify-content: flex-start;
                min-width: 800px;
                gap:12px;
                
                .filterPart {
                min-width: 110px;
                padding: 0 15px 0 2px;
            }

            }

            .buttonPart { 
                display: flex;
                justify-content: flex-end;
                padding:10px 15px;
                gap:15px;
            }

        }
    }
    
    .examListContainer {
         padding: 33px 37px 40px 37px;
         display: flex;
         flex-direction: column;

        .examListTable{
        position: relative;
        font-size: 14px;
        border-collapse: collapse;
        min-width: 1000px;
        display: flex;
        flex-direction: column;
        }

        .examListTableHead {
            background-color: #ffffff;
            font-size: 14px;
            font-weight: normal;
            color: rgb(0, 0, 0, 0.3);
            border: none;
            padding:10px 0px;
            text-align: center;

            tr {
                display: flex;
                align-items: center;
                min-height: 10px;
                padding: 8px;

                th {
                    flex: 1;
                    font-weight: normal;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    padding: 0 4px;

                    
                }

                .exam-time-sort-button {
                    border: none;
                    background-color: white;
                    font-size: 14px;
                    font-weight: normal;
                    color: rgb(0, 0, 0, 0.3);
                    display: flex;
                    align-items: center;
                    margin: auto;
                    cursor: pointer;
                }
        }
    }
    .examListTableData {
            tr {
                display: flex;
                align-items: center;
                text-align: center;
                border-top: none;
                border-bottom: 1px solid #ddd;
                border-left: none;
                border-right: none;
                padding: 4px 8px;
                font-size: 14px;
                color: rgba(0, 0, 0, 0.75);
                min-height: 60px;

                &:hover {
                    background-color: #ecf2fe;
                }

                td {
                    flex: 1;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    padding: 0 4px;
                    text-align: center;
                }
            }
        }
    }
    .statusError{
        display: flex; 
        flex-direction:row; 
        position:relative; 
        margin:auto; 
        width:74px;
        &.visible {
            visibility: visible;
        }
    
        &.hidden {
            visibility: hidden;
        }
    }

    .tip {
        position: absolute;
        left: 95%;
        border: none;
        background-color: rgb(0, 0, 0, 0);
        display: flex;
        align-items: center;
        justify-content: center;
        top: 4px;
    
    &.visible {
        visibility: visible;
    }
    
    &.hidden {
        visibility: hidden;
    }
}   
    .statusTag {
        border: none;
        border-radius: 10px;
        color: white;
        font-size: 12px;
        width: 74px;
        height: 26px;
        display: flex;
        align-items: center;
        justify-content: center;
        margin: auto;
        &.unpublished {
            background-color: #689bff;
        }
        &.to-start {
            background-color: #1890ff;
        }
        &.ended {
            background-color: #c5c5c5;
        }
        &.archived {
            background-color: #7f7f7f;
        }
        &.on-going {
            background-color: #52c41a;
        }
        &.error {
            background-color: #ff4d4f;
        }
    }
</style>