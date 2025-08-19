  <!--
 * @Author: yeweixuan t051521@163.com
 * @Date: 2025-07-21 
 * @LastEditors: yeweixuan t051521@163.com
 * @LastEditTime: 2025-08-11 13:55:31
 * @FilePath: \exam\src\routes\teacher\exam\+page@.svelte
 * @Description: 考试列表页面 
 * @Copyright (c) 2025 by yeweixuan t051521@163.com, All Rights Reserved. 
-->
  
  <script>
  //@ts-nocheck
  import { goto } from '$app/navigation';
  import { onMount } from 'svelte';
  import Button from '$lib/components/Button/Button.svelte';
  import InputBox from '$lib/components/Input/InputBox.svelte';
  import Select from '$lib/components/Select/Select.svelte';
  import Option from '$lib/components/Select/Option.svelte';
  import MessageBox from '$lib/components/MessageBox/MessageBox.svelte';
  import Pagination from '$lib/components/Pagination/Pagination.svelte';
  import Title from '$lib/components/Title/Title.svelte';
  import { toast } from '$lib/components/Toast/Toast';
  import { CURRENT_PAPER_ID } from './_stores/previewStore';
  import Empty from '$lib/components/Table/Empty.svelte';
  import ExcelJS from 'exceljs';
  //import SessionSelection from './_components/SessionSelection.svelte';
  let exam_list = $state([]);
  let name_search_time = null;
  let loading = $state(false);
  let error = $state('');
  let message = $state('');
  let publish_exam_dialog = $state(false);
  let examID_to_publish = $state(false);
  let examID_to_delete = $state(false);
  let total_items = $state(); //总数据条数
  let delete_exam_dialog = $state(false); //删除考试的确认框
  let is_delete_mode = $state(false); //是否是删除模式
  let selected_exam_ids = $state([]); // 用于存储选中的考试ID
  let is_all_selected = $state(false); 
  let examID_to_cancel = $state(false);
  let cancel_exam_dialog = $state(false);
  let preview_id = $state([]);
  let acquire_id = $state(false);
  let show_session_panel = $state(false);

  // 映射关系
  const TypeMap = {
    '00': '平时考试',
    '02': '期末成绩考试',
    '04': '资格证考试',
  };

  const MethodMap = {
    '00': '线上考试',
    '02': '线下考试',
  };

  const StateMap = {
    '00': '未发布',
    '02': '待开始',
    '04': '进行中',
    '06': '已结束',
    '08': '已归档',
    '10': '考试异常',
    '16': '已作废',
  };

  const StateClassMap = {
    '00': 'unpublished',
    '02': 'to-start',
    '04': 'on-going',
    '06': 'ended',
    '08': 'archived',
    '10': 'error',
    '16': 'invalid',
  };

  let search_params = $state({
    page: 1,
    page_size: 10,
    name: '',
    status: '',
    start_time: null,
    end_time: null,
  });

  async function publishAndSearch(selected_exam_ids) {
    await publishExam(selected_exam_ids);
    exam_list = exam_list.map(exam =>
    selected_exam_ids.includes(exam.id)
      ? { ...exam, status: '02' } // 状态改为“待开始”
      : exam
  );
    searchExam();
  }

  async function searchExam() {
    loading = true;
    error = '';

    // 构建后端期望的查询对象
    const queryObject = {
      OrderBy: [{ Duration: 'DESC', Time: 'DESC' }],
      Filter: {
        Name: search_params.name || '',
        Status: search_params.status || '',
        // start_time: search_params.start_time ? new Date(search_params.start_time).getTime() : 0,
        // end_time: search_params.end_time ? new Date(search_params.end_time).getTime() : 0
      },
      page: search_params.page,
      pageSize: search_params.page_size,
    };
    
    const queryParams = new URLSearchParams();
    queryParams.append('q', JSON.stringify(queryObject));

    return fetch(`/api/exam/list?${queryParams.toString()}&role=2`, {
      method: 'GET',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
      },
    })
      .then((response) => response.json())
      .then((data) => {
        exam_list = data.data;
        if (exam_list && Array.isArray(exam_list)) {
          exam_list.sort((a, b) => {
            //按降序排序
            const idA = parseInt(a.id);
            const idB = parseInt(b.id);
            return idB - idA;
          });
        }
        total_items = data.rowCount;
      })
      .catch((error) => {
        console.error('搜索失败:', error);
        toast.error('搜索失败');
      });
  }

  function formatDateTime(isoString) {
    const date = new Date(isoString);
    const Y = date.getFullYear();
    const M = String(date.getMonth() + 1).padStart(2, '0');
    const D = String(date.getDate()).padStart(2, '0');
    const h = String(date.getHours()).padStart(2, '0');
    const m = String(date.getMinutes()).padStart(2, '0');
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
  async function handlePageChange(event) {
    search_params.page = event.detail;
    let currentPageIDs = [];
    await searchExam();
    currentPageIDs = exam_list.map(exam => exam.id);
    
    if(currentPageIDs.length!=0 && currentPageIDs.every(id => selected_exam_ids.includes(id)))
      { 
        is_all_selected = true;
        return;
      }
    is_all_selected=false;
  }

  // 处理每页条数变化
  async function handlePageSizeChange(event) {
    search_params.page_size = event.detail;
    search_params.page = 1; // 重置到第一页
    let currentPageIDs = [];
    await searchExam();
    currentPageIDs = exam_list.filter(selected_exam_ids.includes(exam.id))
      .map(exam => exam.id);

    if(currentPageIDs.length!=0 && currentPageIDs.every(id => selected_exam_ids.includes(id)))
      { 
        is_all_selected = true;
        return;
      }
    is_all_selected=false;
  }

  async function publishExam(selected_exam_ids) {
    
    loading = true;
    message = '';

    // return fetch(`/api/exam/lock?exam_id=${examID}`, {
    //   method: 'GET',
    //   credentials: 'include',
    //   headers: { 'Content-Type': 'application/json' },
    // })
    //   .then((lockRes) =>
    //     lockRes.ok
    //       ? lockRes
    //       : res
    //           .json()
    //           .then((err) => Promise.reject(new Error(`获取考试锁失败：${err.Msg || '考试可能正在被其他用户编辑'}`))),
    //   )

     
        const params = {
          q: JSON.stringify({
            data: { IDs: selected_exam_ids, Status: '02' },
          }),
        };

        const url = `/api/exam/status?${new URLSearchParams(params).toString()}`;
        fetch(url, {
          method: 'PUT',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
        })
      .then((response) => {
        return response.json();
      })
      .then((result) => {
        if (result.status === 0) {
          return result;
        } 
        else if (result.status === -1) {
          message = result.msg;
          toast.error(message);
        } else {
          return Promise.reject(new Error(`发布失败：${result.msg || '未知错误'}`));
        }
      })

      .catch((err) => {
        message = err.message;
        toast.error(message);
      })

      // .finally(() =>
      //   fetch(`/api/exam/lock?exam_id=${examID}`, {
      //     method: 'DELETE',
      //     credentials: 'include',
      //   })
      //   .catch((releaseErr) => console.error('释放考试锁失败:', releaseErr)),
      // )
      .finally(() => {
        loading = false;
        selected_exam_ids=[];
      });
    }

  async function deleteExam(selected_exam_ids){
    fetch(`/api/exam`,
      { 
        method:"DELETE",
        credentials: "include",
        headers: {
                "Content-Type": "application/json",
            },
        body:JSON.stringify({data:selected_exam_ids})
      })
      .then((response)=>response.json())
      .then((result)=>{
        if(result.status===0){
          loading=false;
          return;
        }
        else{
          return Promise.reject(new Error(`删除失败：${result.msg || '未知错误'}`));
        }
      }).catch((error)=>{
          const msg = error.message;
          toast.error(msg);
      })
      .finally(()=>{
        searchExam();
        loading=false;
        selected_exam_ids=[];
      })
  }

  async function cancelExam(selected_exam_ids)
  {
    const params = {
          q: JSON.stringify({
            data: { IDs: selected_exam_ids, Status: '16' },
          }),
        };

        const url = `/api/exam/status?${new URLSearchParams(params).toString()}`;
        fetch(url, {
          method: 'PUT',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
        })

      .then((response)=>response.json())
      .then((result)=>{
        if(result.status===0){
          loading=false;
          return;
        }
        else{
          throw new Error(result.msg);
        }
      })
      .catch((error)=>{
          console.log("错误提示:",error);
          const msg = error.message;
          toast.error(msg);
      })
      .finally(()=>{
        searchExam();
        loading=false;
        selected_exam_ids=[];
      })
  }


  async function acquireExaminee(index) {
     fetch(`/api/exam/examinee?exam_id=${acquire_id}`, {
          method: 'GET',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
        })
      .then((response)=>response.json())
      .then((result)=>{
        if(result.status===0){
        const examinees = result.data;
        console.log("examinee",examinees);
        if(examinees===null)
        {
          toast.warning("本场考试还未导入考生");
          return;
        }
      const workbook = new ExcelJS.Workbook();
      const sheet = workbook.addWorksheet('考生名单');

      sheet.columns = [
        { header: '序号', key: 'serial_number', width: 10 },
        { header: '姓名', key: 'official_name', width: 16 },
        { header: '账号', key: 'account', width: 20 },
        { header: '身份证号', key: 'id_card_no', width: 22 }
      ];

      sheet.addRows(examinees);               
      sheet.getRow(1).font = { bold: true };  // 表头加粗
      
       return workbook.xlsx.writeBuffer()            //  生成 xlsx 
      .then(buffer => {
        const blob = new Blob([buffer], {
          type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `${exam_list[index].name}考生名单.xlsx`; // 2. 改后缀
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
      });

      }
        else{
             throw new Error(result.msg);
            }
        })
      .catch((error)=>{
          console.log("错误提示:",error);
          const msg = error.message;
          toast.error(msg);
      })
  }

  function handleCheckBoxChange(data,event){
     const examID = data.id;
     const is_selected = selected_exam_ids.includes(examID);
  
    if (is_selected) {
      selected_exam_ids = selected_exam_ids.filter(id => id !== examID);
    } else {
      selected_exam_ids = [...selected_exam_ids, examID];
    }
  }

  // 处理全选/取消全选
function handleSelectAll(event) {
   is_all_selected = event.target.checked;
  const currentPageIDs = exam_list
    .map(exam => exam.id);

  if (is_all_selected) {
    selected_exam_ids = [...new Set([...selected_exam_ids, ...currentPageIDs])];
  } else {
    selected_exam_ids = selected_exam_ids.filter(id => !currentPageIDs.includes(id));
  }
}



  onMount(() => {
    searchExam();
  });
</script>

{#snippet tableHead()}
  <tr onclick={(event)=>handleSelectAll(event)}>
      <th >
        <input
          type="checkbox"
          class="deleteCheck"
          checked={is_all_selected}
        />
      </th>
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

{#snippet actionRender(status, index)}
  <div class="button-container">
    <button class="continue-edit-button action-button {status !== '00' && status !== '02' ? 'hideButton' : ''}"
        onclick={()=>{
            goto(`/teacher/exam/editExam/${exam_list[index].id}`)
        }}>
        继续编辑</button>
    <button
      class="publish-exam-button action-button {status !== '00' ? 'hideButton' : ''}"
      onclick={(event) => {
        event.stopPropagation(); // 阻止冒泡
        publish_exam_dialog = true;
        examID_to_publish = exam_list[index].id;
      }}>
      发布考试</button
    >

    <span class="{status == '00'||status == '02'|| status == '04' || status == '06' ? 'hideButton' : 'EmptyData'} "> -- </span>

    <button class="delete-exam-button action-button {status !== '00' ? 'hideButton' : ''}"
    onclick={(event)=>{
        event.stopPropagation(); // 阻止冒泡
        delete_exam_dialog=true;
        examID_to_delete =exam_list[index].id
    }}>
    删除考试</button>

    <button class="preview-exam-button action-button {status!='00'&&status!='02'&&status!='04' ?'hideButton' : ''}"
    onclick={()=>{
            preview_id = exam_list[index].exam_sessions.map(session => session.paper_id);
            CURRENT_PAPER_ID.set(preview_id);
            goto(`/teacher/exam/previewExam/${preview_id[0]}`)
            
        }}>预览试卷</button>
        <!-- <button class="preview-exam-button action-button {status!='00'&&status!='02'&&status!='04' ?'hideButton' : ''}"
         onclick={()=>{
          event.stopPropagation();
          preview_id = exam_list[index].exam_sessions.map(session => session.paper_id);
          // CURRENT_PAPER_ID.set(preview_id);
          // previewPaper(preview_id[0],"00")
          show_session_panel=true;
         }
        }>预览试卷</button> -->
    <button class="cancel-exam-button action-button {status !== '02' ? 'hideButton' : ''}"
    onclick={(event)=>{
            event.stopPropagation(); // 阻止冒泡
            examID_to_cancel=exam_list[index].id
            cancel_exam_dialog=true;
        }}>考试作废</button>
    
    <button class="acquire-examinee-button action-button {status === '16' || status === '10' ||status === '00' ? 'hideButton' : ''} "
    onclick={(event)=>{
            event.stopPropagation(); // 阻止冒泡
            acquire_id=exam_list[index].id;
            acquireExaminee(index);
        }}>获取考生名单</button>
    <!-- <button class="more-action-button action-button {status !== '04' ? 'hideButton' : ''}">监考管理</button> -->
    <!-- <button class="more-action-button action-button {status !== '04' ? 'hideButton' : ''}">操作日志</button> -->
    <!-- <button class="unpublished-more-action-button action-button {status !== '00' ? 'hideButton' : ''}"
        onclick={() => toggleMoreActions(index)}
        >更多...</button> -->
  </div>
{/snippet}

{#snippet tableData(data, index)}
  <tr onclick={(event)=>handleCheckBoxChange(data,event)}>
    <td >
        <input
          type="checkbox"
          class="deleteCheck"
          checked={selected_exam_ids.includes(data.id)}
        />
      </td>
    <td>{data.name} </td>
    <td>{TypeMap[data.type]} </td>
    <td>{MethodMap[data.method]} </td>
    <td>
    <div class = "examDateContainer">
      {#each data.exam_sessions as session}
        <div style="display: flex; flex-wrap: no-wrap; gap: 8px;">
          <span>
            {formatDateTime(session.start_time)} -- {formatDateTime(session.end_time)}
          </span>
        </div>
      {/each}
    </div>
    </td>
    <td>{data.duration}</td>
    <td>{@render stateRender(data.status, data.addi)}</td>
    <td>{data.num_of_examinees}</td>
    <td>{@render actionRender(data.status, index)}</td>
  </tr>
{/snippet}

<!--考试状态标签-->
{#snippet stateRender(/** @type {"00" | "02" | "04" | "08" | "10" | "12"  | "16"} */ status, /** @type {string} */ addi)}
  {#if status === '10'}
    <div class="statusError">
      <div class="statusTag {StateClassMap[status]}">
        {StateMap[status]}
      </div>
      <button class="tip"
        ><img src="/exam_list/tip.png" alt="提示" style="width: 16px; height:auto" />
        <div class="tooltip-text">考试数据出现异常，请联系管理员处理</div></button
      >
    </div>
  {:else}
    <div class="statusTag {StateClassMap[status]}">{StateMap[status]}</div>
  {/if}
{/snippet}

<Title title="考试管理" />
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
        <Select placeholder="全部状态" changeValue={onSelectExamStatus}>
          <Option value="" label="全部状态" />
          <Option value="00" label="未发布" />
          <Option value="02" label="待开始" />
          <Option value="04" label="进行中" />
          <Option value="06" label="已结束" />
          <!-- <Option value="08" label="已归档" /> -->
          <Option value="10" label="考试异常" />
          <Option value="16" label="已作废" />
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
      <!-- {#if !is_delete_mode}
      <Button plain={true}  type="danger" size="medium" onclick={() => { is_delete_mode = true; }}>批量删除</Button>
      <Button plain={true}  type="primary" size="medium" onclick={() => goto('/teacher/exam/addExam')}>新增考试</Button>
      {:else}
      <Button plain={true} type="default" size="medium" onclick={() => {is_delete_mode=false;}}>取消</Button>
        <Button plain={true} type="danger" size="medium" onclick={()=>{batchDelete()}}>
          删除选中 ({selected_exam_ids.length})
        </Button>
      {/if} -->
      <Button plain={true}  type="primary" size="medium" onclick={() => goto('/teacher/exam/addExam')}>新增考试</Button>
    </div>
  </div>


  <div class="examListContainer">
    <table class="examListTable">
      <thead class="examListTableHead">
        {@render tableHead()}
      </thead>
      <tbody class="examListTableData">
        {#if exam_list.length===0}
          <Empty text = "暂无数据"/>
          {:else}
        {#each exam_list as exam, index}
          {@render tableData(exam, index)}
        {/each}
      {/if}
      </tbody>
    </table>
  </div>

  <div class="pagination-container"></div>

  <MessageBox
    bind:visible={publish_exam_dialog}
    content="是否确认发布该考试?"
    cancel_text="取消"
    confirm_text="确认发布"
    onConfirm={() => {
      if (!selected_exam_ids.includes(examID_to_publish)) {
      selected_exam_ids = [...selected_exam_ids, examID_to_publish];
    }
      publishAndSearch(selected_exam_ids)
      }}
    onCancel={() => {
      publish_exam_dialog = false;
    }}
  />
  
  <MessageBox
    bind:visible={delete_exam_dialog}
    content="是否确认删除该考试"
    cancel_text="取消"
    confirm_text="确认删除"
    onCancel={() => {
      delete_exam_dialog = false;
    }}
    onConfirm={() => {
      if (!selected_exam_ids.includes(examID_to_delete)) {
      selected_exam_ids = [...selected_exam_ids, examID_to_delete];
    }
      deleteExam(selected_exam_ids)
      }}
    />

    <MessageBox
    bind:visible={cancel_exam_dialog}
    content="是否确认将该考试作废"
    cancel_text="取消"
    confirm_text="确认"
    onCancel={() => {
      cancel_exam_dialog = false;
    }}
    onConfirm={() => {
      if (!selected_exam_ids.includes(examID_to_cancel)) {
      selected_exam_ids = [...selected_exam_ids, examID_to_cancel];
    }
      cancelExam(selected_exam_ids)
      }}
    />

  <div class="paginationContainer">
    <Pagination
      {total_items}
      page_size={search_params.page_size}
      current_page={search_params.page}
      on:pageChange={handlePageChange}
      on:pageSizeChange={handlePageSizeChange}
      page_size_options={[10, 20, 30, 40, 50]}
    />
  </div>
  



</div>

<style lang="scss" scoped>
  .EmptyData {
    color: var(--blue);
  }

  .hideButton {
    visibility: hidden;
    position: absolute;
    pointer-events: none;
  }

  .action-button {
    border: none;
    background-color: rgb(0, 0, 0, 0); // 透明背景
    color: var(--blue); // 蓝色文字
    cursor: pointer;
    font-size: 14px;
    min-width: 70px;
  }

  .action-button:hover {
    font-weight: bold; // 悬停时加粗
  }

  .examManagementContainer {
    height: 77vh;
    position: relative;
    background-color: var(--bg-primary);
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
      .actionPart {
        display: flex;
        flex-direction: row;
        align-items: center;
        justify-content: flex-start;
        min-width: 800px;
        gap: 30px;

        .filterPart {
          min-width: 110px;
          padding: 0 15px 0 2px;
        }
      }

      .buttonPart {
        display: flex;
        justify-content: flex-end;
        padding: 10px 15px;
        margin-right: 3%;
        gap: 15px;
      }
    }

    @media (max-width: 1920px) {
      // 小于1080p（如1366×768、1440×900等）
      .tableFilterContainer {
        flex-wrap: nowrap; // 禁止换行
        min-width: auto; // 不再强制1000px

        .actionPart {
          min-width: auto;
          flex: 1 1 0; // 占剩余空间
          gap: 15px; // 缩小间距
        }

        .buttonPart {
          min-width: 260px; // 强制按钮区域宽度
          flex-shrink: 0; // 禁止被压缩
        }
      }
    }
    .paginationContainer {
      display: flex;
      justify-content: flex-end;
      padding: 0 40px 0px 0;
    }
  }

  .examListContainer {
    overflow-y: auto;
    overflow-x: hidden;
    padding: 33px 37px 40px 37px;
    display: flex;
    flex-direction: column;

    .examListTable {
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
      padding: 10px 0px;
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
        color: var(--text-primary);
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

      .examDateContainer{
        display: flex; 
        flex-direction: column;
        gap: 4px;
        
      }
    }
  }

  .statusError {
    display: flex;
    flex-direction: row;
    position: relative;
    margin: auto;
    width: 74px;
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

    .tooltip-text {
        visibility: hidden;
        width: max-content;
        max-width: 250px;
        background-color: white;
        border: 1px solid #d7d7d7;
        color: var(--text-primary);
        text-align: left;
        padding: 6px 8px;
        border-radius: 4px;
        position: absolute;
        z-index: 1;
        bottom: 150%;
        left: 50%;
        transform: translateX(-50%);
        white-space: pre-line;
        font-size: 12px;
        line-height: 1.4;
    }

    &:hover .tooltip-text {
        visibility: visible;
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
    &.invalid {
      background-color: var(--gray);
    }
  }

  .deleteCheck{
   transform: scale(1.4);
   outline:none;
  }

  .sessionPanelContainer{
    position: fixed;
    top: 0%;
    left: 0%;
    width: 100vw;
    height: 100vh;
    background-color: rgba(0, 0, 0, 0.25); /* 半透明遮罩层 */
    display: flex;
    justify-content: center;
    align-items: center;
    z-index: 2000;
    .sessionPanel{
    width: 1000px;
    min-width: 800px;
    max-height: 90vh;
    overflow-y: auto;
    background-color: white;
    display: flex;
    flex-direction: column;
    border-radius: 12px;
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.12);
    z-index: 1001;
    }
  }
</style>
