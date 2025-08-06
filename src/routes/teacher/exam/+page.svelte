<script>
    //@ts-nocheck
    import { goto } from "$app/navigation";
    import { onMount } from "svelte";
    import Button from "$lib/components/Button/Button.svelte";
    import InputBox from "$lib/components/Input/InputBox.svelte";
    import Select from "$lib/components/Select/Select.svelte";
    import Option from "$lib/components/Select/Option.svelte";
    import MessageBox from "$lib/components/MessageBox/MessageBox.svelte";
    import Pagination from "$lib/components/Pagination/Pagination.svelte";
    import Title from "$lib/components/Title/Title.svelte";
    import { toast } from "$lib/components/Toast/Toast";
    let exam_list=$state([]);
    let name_search_time = null;
    let loading = $state(false);
    let error = $state("");
    let message = $state("");
    let page_size = $state(10);
    let publish_exam_dialog = $state(false);
    let examID_to_publish = $state(false);
    let total_items = $state();
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
        "06": "已结束",
        "10": "已归档",
        "12": "考试异常",
    };

    const StateClassMap = {
        "00": "unpublished",
        "02": "to-start",
        "04": "on-going",
        "06": "ended",
        "10": "archived",
        "12": "error",
    };
    let search_params = $state({
        page: 1,
        page_size: 10,
        name: "",
        status: "",
        startTime: null,
        endTime: null,
    });

    async function publishAndSearch(examID){
        await publishExam(examID);
        searchExam();
    }

    async function searchExam() {
    loading = true;
    error = "";

    // 构建后端期望的查询对象
    const queryObject = {
        OrderBy: [{ "Duration": "DESC", "Time": "DESC"}],
        Filter: {
            Name: search_params.name || "",
            Status: search_params.status || "",
            // StartTime: search_params.startTime ? new Date(search_params.startTime).getTime() : 0,
            // EndTime: search_params.endTime ? new Date(search_params.endTime).getTime() : 0
        },
        Page: search_params.page,
        page_size: search_params.page_size
    };

    const queryParams = new URLSearchParams();
    queryParams.append("q", JSON.stringify(queryObject));

    
    fetch(`/api/exam/list?${queryParams.toString()}&role=2`, {
        method: "GET",
        credentials: "include",
        headers: {
            "Content-Type": "application/json",
        },
    })
    .then((response) => response.json())
    .then((data) => {
        exam_list = data.data;
         if (exam_list && Array.isArray(exam_list)) {
            exam_list.sort((a, b) => {
                // 确保 ID 字段存在且为数字，按降序排序
                const idA = parseInt(a.id);
                const idB = parseInt(b.id);
                return idB - idA; 
            });
        }
        total_items = data.rowCount;
    })
    .catch((error) => {
        console.error("搜索失败:", error);
    });
}

    function formatDateTime(isoString) {
    const date = new Date(isoString);
    const Y = date.getFullYear();
    const M = String(date.getMonth() + 1).padStart(2, "0");
    const D = String(date.getDate()).padStart(2, "0");
    const h = String(date.getHours()).padStart(2, "0");
    const m = String(date.getMinutes()).padStart(2, "0");
    return `${Y}-${M}-${D} ${h}:${m}`;
}

    // function toggleMoreActions(index) {
    //     exam_list[index].actionExpanded = !exam_list[index].actionExpanded;
    // }

    function onSearchFunc(value) {
        search_params.name = value;

        //防抖逻辑
        if (name_search_time) {
            clearTimeout(name_search_time);
        }
        name_search_time = setTimeout(() => {
            searchExam();
            name_search_time = null;
        }, 300);
    }

    function onSelectExamStatus(value) {
        let originalValue = search_params.status;
        search_params.status = value;
        
        //如果选中的值发生了变化，就触发搜索
        if (originalValue !== search_params.status) {
            search_params.page = 1;
            searchExam();
        }
    }

    // 处理页码变化
    function handlePageChange(event) {
        search_params.page = event.detail;
        searchExam();
    }
    
    // 处理每页条数变化
    function handlepage_sizeChange(event) {
        search_params.page_size = event.detail;
        search_params.page = 1; // 重置到第一页
        searchExam();
    }


    async function publishExam(examID) {
        loading = true;
        message = "";

        return fetch(`/api/exam/lock?exam_id=${examID}`, {
            method: "GET",
            credentials: "include",
            headers: { "Content-Type": "application/json" }
        })
            .then((lockRes) =>
            lockRes.ok
                ? lockRes
                : res.json().then((err) =>
                    Promise.reject(new Error(`获取考试锁失败：${err.Msg || "考试可能正在被其他用户编辑"}`))
                )
            )

            .then(() => {
            const params = {
                q: JSON.stringify({
                data: { ID: parseInt(examID), Status: "02" }
                })
            };

            //占位
            const url = `/api/exam/status?${new URLsearch_params(params).toString()}`;
            return fetch(url, {
                method: "PUT",
                credentials: "include",
                headers: { "Content-Type": "application/json" }
            });
            })
            .then((response) => {
                return response.json();
            })
            .then((result) => {
                //console.log('PUT /api/exam/status JSON数据:', result); // 
                if (result.status === 0) {
                    // message = "考试发布成功";
                    return result;
                } 
                else if(result.status === -1)
                {
                    message=result.msg;
                    toast.error(message);
                }
                else {
                    return Promise.reject(new Error(`发布失败：${result.msg || "未知错误"}`));
                }
            })

            .catch((err) => {
            message = err.message ;
            console.log('err:',message);
            })

            .finally(() =>
            fetch(`/api/exam/lock?exam_id=${examID}`, {
                method: "DELETE",
                credentials: "include"
            })
            .catch((releaseErr) => console.error("释放考试锁失败:", releaseErr))
            )
            .finally(() => {
            loading = false;
            });
}
    // 模拟获取考试列表数据
        exam_list = [
            { name: '数学考试', type: '00', method: '00', start_time: '2023-10-01 10:00', end_time: '2023-10-01 12:00', duration: '120分钟', status: '00',delivery_status: '00',addi: '',actionExpanded:false,num_of_examinee:1},
            { name: '英语考试', type: '02', method: '02', start_time: '2023-10-02 14:00', end_time: '2023-10-02 15:30', duration: '90分钟', status: '04' ,delivery_status: '00',addi: '',actionExpanded:false,num_of_examinee:1},
            { name: '物理期中', type: '00', method: '00', start_time: '2023-10-03 09:00', end_time: '2023-10-03 11:00', duration: '120分钟', status: '02' ,delivery_status: '00',addi: '',actionExpanded:false,num_of_examinee:1},
            { name: '化学期末', type: '02', method: '02', start_time: '2023-10-04 13:30', end_time: '2023-10-04 15:00', duration: '90分钟', status: '04' ,delivery_status: '00',addi: '',actionExpanded:false,num_of_examinee:1},
            { name: '语文模拟', type: '04', method: '00', start_time: '2023-10-05 08:30', end_time: '2023-10-05 10:00', duration: '90分钟', status: '00' ,delivery_status: '00',addi: '',actionExpanded:false,num_of_examinee:1},
            { name: '生物测评', type: '02', method: '02', start_time: '2023-10-06 10:00', end_time: '2023-10-06 11:30', duration: '90分钟', status: '02' ,delivery_status: '00',addi: '',actionExpanded:false,num_of_examinee:1},
            { name: '历史会考', type: '00', method: '02', start_time: '2023-10-07 15:00', end_time: '2023-10-07 16:30', duration: '90分钟', status: '04' ,delivery_status: '00',addi: '',actionExpanded:false,num_of_examinee:1},
            { name: '历史会考', type: '00', method: '02', start_time: '2023-10-07 15:00', end_time: '2023-10-07 16:30', duration: '90分钟', status: '04' ,delivery_status: '00',addi: '',actionExpanded:false,num_of_examinee:1},
            { name: '历史会考', type: '00', method: '02', start_time: '2023-10-07 15:00', end_time: '2023-10-07 16:30', duration: '90分钟', status: '04' ,delivery_status: '00',addi: '',actionExpanded:false,num_of_examinee:1},
            { name: '历史会考', type: '00', method: '02', start_time: '2023-10-07 15:00', end_time: '2023-10-07 16:30', duration: '90分钟', status: '12' ,delivery_status: '00',addi: '',actionExpanded:false,num_of_examinee:1}
        ];

    onMount(() => {
        searchExam();
        console.log(exam_list);
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
        <!-- <button class="continue-edit-button action-button {status !== '00' && status !== '02' ? 'hideButton' : ''}"
        onclick={()=>{
            goto(`/teacher/exam/editExam/${exam_list[index].id}`)
        }}>
        继续编辑</button> -->
        <button class="publish-exam-button action-button {status !== '00' ? 'hideButton' : ''}"
        onclick={() => {
            publish_exam_dialog=true,
            examID_to_publish = exam_list[index].id;
        }}>
        发布考试</button>
        <span class = "{status == '00'?'hideButton' : 'EmptyData'} " > -- </span>
        <!-- <button class="delete-exam-button action-button {status !== '00' ? 'hideButton' : ''}">删除考试</button> -->
        <!-- <button class="cancel-exam-button action-button {status !== '02' ? 'hideButton' : ''}">取消考试</button> -->
        <!-- <button class="more-action-button action-button {status !== '04' ? 'hideButton' : ''}">监考管理</button> -->
        <!-- <button class="more-action-button action-button {status !== '04' ? 'hideButton' : ''}">操作日志</button> -->
        <!-- <button class="unpublished-more-action-button action-button {status !== '00' ? 'hideButton' : ''}"
        onclick={() => toggleMoreActions(index)}
        >更多...</button> -->

    </div>
{/snippet}

{#snippet tableData(data,index)}
    <tr>
        <td>{data.name} </td>
        <td>{TypeMap[data.type]} </td>
        <td>{MethodMap[data.method]} </td>
        <td>
            {data.exam_sessions?.[0] ? formatDateTime(data.exam_sessions[0].start_time) : ''} - 
            {data.exam_sessions?.[0] ? formatDateTime(data.exam_sessions[0].end_time) : ''}
        </td>
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
    {#if status === "12"}
        <div class="statusError">
            <div class="statusTag {StateClassMap[status]}">
                {StateMap[status]}
            </div>
            <button class="tip "
                ><img
                    src="/exam_list/tip.png"
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
 <Title title="考试管理"  />
<div class="examManagementContainer">
    
    <div class="tableFilterContainer">
        <div class="actionPart">      

            <div class="searchPart">
                <InputBox
                    label="考试名称"
                    placeholder="请输入考试名称搜索"
                    bind:value={search_params.name}
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
                    <Option value="06" label="已结束" />
                    <Option value="10" label="已归档" />
                    <Option value="12" label="考试异常" />
                </Select>
            </div>
            <div class="datePart"> 
                <!-- <input 
                    type="text" 
                    class="search-input"
                    placeholder="日期筛选"
                    bind:value={search_params.name}
                    oninput={(e) => onSearchFunc(e.target.value)}
                /> -->
            </div>
        </div>
        <div class="buttonPart">

            <!-- <Button
            type="primary"
            size="medium"
            >
            下载考生模板
        </Button> -->

            <Button
                type="primary"
                size="medium"
                onclick={() => goto("/teacher/exam/addExam")}
            >
            新增考试
            </Button>

            </div>
    </div>

    <div class="examListContainer"> 
        <table class="examListTable">
            <thead class="examListTableHead">
                {@render tableHead()}
            </thead>
            <tbody class="examListTableData">
               {#each exam_list as exam,index}
                    {@render tableData(exam,index)}
                {/each}
            </tbody>
        </table>
    </div>
    <div class="pagination-container">

    </div>

    <MessageBox
    bind:visible={publish_exam_dialog}
    content="是否确认发布该考试?"
    cancel_text="取消"
    confirm_text="确认发布"
    onConfirm={() => publishAndSearch(examID_to_publish)}
    onCancel={() => {publish_exam_dialog=false;}}
    />
    
    <div class="paginationContainer">
        <Pagination
            total_items={total_items}
            page_size={10}
            current_page={1}
            on:pageChange={handlePageChange}
            on:page_sizeChange={handlepage_sizeChange}
            page_size_options = {[10, 20, 30, 40, 50]}
        />
    </div>
</div>

<style lang="scss" scoped>

   .EmptyData{
    color:var(--blue);
   }

   .hideButton {
        visibility: hidden;
        position: absolute;
        pointer-events: none;
    }

  .action-button {
        border: none;
        background-color: rgb(0, 0, 0, 0);  // 透明背景
        color: var(--blue);                 // 蓝色文字
        cursor: pointer;
        font-size: 14px;
        min-width: 70px;
    }
    .action-button:hover {
        font-weight: bold;                  // 悬停时加粗
    }
    
    .examManagementContainer {
        
        height:77vh;
        position: relative;
        background-color: white;
        display: flex;
        flex-direction: column;
        overflow-x: auto;
        overflow-y: hidden;
        
        
        .tableFilterContainer {
            display: flex;
            flex-direction: row;
            flex-wrap: wrap;
            gap: 15px;
            padding: 0px 0 10px 0px;
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
                margin-right:3%;
                gap:15px;
                
            }

        }

        @media (max-width: 1919px) {
        // 小于1080p（如1366×768、1440×900等）
        .tableFilterContainer {
            flex-wrap: nowrap; // 禁止换行
            min-width: auto;   // 不再强制1000px

            .actionPart {
            min-width: auto;
            flex: 1 1 0; // 占剩余空间
            gap: 15px;   // 缩小间距
            }

            .buttonPart {
            min-width: 260px; // 强制按钮区域宽度
            flex-shrink: 0;   // 禁止被压缩
            }
        }

    }
        .paginationContainer{
            display: flex;
            justify-content: flex-end;
            padding: 0 40px 0px 0;
        }
    }
    
    
    .examListContainer {
         overflow-y: auto;
         overflow-x:hidden;
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