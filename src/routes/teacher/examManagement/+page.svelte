<script>
    //@ts-nocheck
    import { goto } from "$app/navigation";
    import { onMount } from "svelte";
    import Button from "$lib/components/Button/Button.svelte";
    import InputBox from "$lib/components/Input/InputBox.svelte";
    import Select from "$lib/components/Select/Select.svelte";
    import Option from "$lib/components/Select/Option.svelte";
    import MessageBox from "$lib/components/MessageBox/MessageBox.svelte";
    let examList=$state([]);
    let Listrows = $state([]); //返回数据行数
    let nameSearchTime = null;
    let loading = $state(false);
    let error = $state("");
    let message = $state("");
    let currentPage = $state(1);
    let pageSize = $state(10);
    let totalPage = $state(1);
    let pushlishExamDialog = $state(false);
    //发布考试确认框
    let publishExamDialog = $state(false);
    let examIdToPublish = $state(false);
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


    async function searchExam() {
    loading = true;
    error = "";

    // 构建查询参数
    let queryParams = new URLSearchParams();

    // 添加基础参数
    queryParams.append("page", (searchParams.page || 1).toString());
    queryParams.append("pageSize", (searchParams.pageSize || 10).toString());

    // 添加可选参数
    if (searchParams.name) {
        queryParams.append("filter.Name", searchParams.name);
    }
    if (searchParams.status) {
        queryParams.append("filter.Status", searchParams.status);
    }

    if (searchParams.startTime) {
        const start_time = new Date(searchParams.startTime);
        queryParams.append("filter.StartTime", start_time.toISOString());
    }
    if (searchParams.endTime) {
        const endTime = new Date(searchParams.endTime);
        queryParams.append("filter.EndTime", endTime.toISOString());
    }

    // 添加 orderBy 参数
    queryParams.append("orderBy[0].Duration", "DESC");
    queryParams.append("orderBy[0].Time", "DESC");
    console.log("查询参数:", queryParams.toString());
    fetch(`/api/exam/list?${queryParams.toString()}`, {
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
        if (nameSearchTime) {
            clearTimeout(nameSearchTime);
        }
        nameSearchTime = setTimeout(() => {
            searchExam();
            nameSearchTime = null;
        }, 300);
    }

    function onSelectExamStatus(value) {
        let originalValue = searchParams.status;
        searchParams.status = value;
        
        //如果选中的值发生了变化，就触发搜索
        if (originalValue !== searchParams.status) {
            searchParams.page = 1;
            searchExam();
        }
    }

    function onNextOrLastPage(is_next) {
        if (loading === true) return;
        if (is_next && searchParams.page < totalPage) {
            searchParams.page += 1;
            searchExam();
        }
        if (!is_next && searchParams.page > 1) {
            searchParams.page -= 1;
            searchExam();
        }
    }

    async function publishExam(examId) {
        loading = true;
        message = "";
        const params = {
        "data": {
            "ID": parseInt(examId), // 确保ID是数字类型
            "Status": "02"
        }
    };
    const url = `/api/exam/status?${new URLSearchParams(params).toString()}`;

        const response = await fetch(url, {
            method: "PUT",
            credentials: "include",
            headers: {
                "Content-Type": "application/json",
            },
        });

        const data = await response.json();

        // if (action_toast === null) {
        //     // alert(data.Msg);
        //     loading = false;
        //     return;
        // }

        if (data.Status === 0) {
            message = "考试发布成功";
            // action_toast.show("success", message);
            await searchExam();
         } 
        //else if (data.Status === -11) {
        //     message = `发布失败：${data.Msg}`;
        //     action_toast.show("error", "考试时间无效，请重新设置考试时间");
        // } else if (data.Status === -12) {
        //     action_toast.show("error", "考试状态异常，正在重新获取考试列表");
        //     await searchExam();
        // } else if (data.Status === -13) {
        //     action_toast.show(
        //         "error",
        //         "尚未导入考生，请在导入考生后再发布该考试",
        //     );
        //     await searchExam();
        // } else if (data.Status === -14) {
        //     action_toast.show(
        //         "error",
        //         "部分场次尚未配置批阅员，请在配置完批阅员后再发布该考试",
        //     );
        //     await searchExam();
        // } else if (data.Status === -18) {
        //     message = `发布失败：考试正在被其他用户编辑`;
        //     action_toast.show("error", message);
        // } else if (data.Status === -20) {
        //     action_toast.show("error", "用户无权访问");
        //}
         else {
            // action_toast.show("error", "考试发布失败，请稍后重试: " + message);
        }

        loading = false;
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
    <div class="button-container">
        <button class="continue-edit-button action-button {status !== '00' && status !== '02' ? 'hideButton' : ''}"
        onclick={()=>{
            goto(`/teacher/examManagement/editExam/${examList[index].id}`)
        }}>
        继续编辑</button>
        <button class="publish-exam-button action-button {status !== '00' ? 'hideButton' : ''}"
        onclick={() => {
            pushlishExamDialog=true,
            examIdToPublish = examList[index].id;
        }}>
        发布考试</button>
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
        <td>{data.num_of_examinees}</td>
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
                <InputBox
                    label="考试名称"
                    placeholder="请输入考试名称搜索"
                    bind:value={searchParams.name}
                    onInput={onSearchFunc}
                    clearable={true}
                />
            </div>

            <div class="filterPart">

                <Select
                    placeholder="全部状态"
                    onChangeValue={onSelectExamStatus}
                >
                    <Option value="" label="全部状态" />
                    <Option value="00" label="未发布" />
                    <Option value="02" label="待开始" />
                    <Option value="04" label="进行中" />
                    <Option value="08" label="已结束" />
                    <Option value="10" label="已归档" />
                    <Option value="12" label="考试异常" />
                </Select>
            </div>
            <div class="datePart"> 
                <!-- <input 
                    type="text" 
                    class="search-input"
                    placeholder="日期筛选"
                    bind:value={searchParams.name}
                    oninput={(e) => onSearchFunc(e.target.value)}
                /> -->
            </div>
        </div>
        <div class="buttonPart">

            <Button
            type="primary"
            size="medium"
            >
            下载考生模板
        </Button>

            <Button
                type="primary"
                size="medium"
                onclick={() => goto("/teacher/examManagement/addExam")}
            >
            新增考试
            </Button>
            <!-- <button
                class="addExamButton"
                onclick={() => {
                    goto("/teacher/examManagement/addExam");
                }}
            >
                + 新增考试
            </button> -->
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

    <MessageBox
    bind:visible={pushlishExamDialog}
    content="是否确认发布该考试?"
    cancel_text="取消"
    confirm_text="确认发布"
    onConfirm={() => publishExam(examIdToPublish)}
    />
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
                gap:30px;
                
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

    .button-container{
        background-color: rgb(0, 0, 0, 0);
    }
</style>