<!--
 * @Author: yeweixuan t051521@163.com
 * @Date: 2025-07-23 
 * @LastEditors: yeweixuan t051521@163.com
 * @LastEditTime: 2025-08-11 14:55:31
 * @FilePath: \exam\src\routes\teacher\exam\components\ExamineeSelectionPanel
 * @Description: 用于查看选中的考生以及为考试挑选学生的面板
 * @Copyright (c) 2025 by yeweixuan t051521@163.com, All Rights Reserved. 
-->
<script>
  import Pagination from '$lib/components/Pagination/Pagination.svelte';
  import StudentImportPanel from '../../practice/_components/StudentImportPanel.svelte';
  import InputBox from '$lib/components/Input/InputBox.svelte';
  import Button from '$lib/components/Button/Button.svelte';
  import Empty from '$lib/components/Table/Empty.svelte';
  import {toast} from '$lib/components/Toast/Toast.js'
  import '$lib/components/Button/index.scss';
  let {
    show_panel = false,
    ids = [],
    onCancel = () => {},
    onConfirm = (/** @type {any} */ selected_examinee) => {},
  } = $props();

  let examinee_list = $state([]);

  // 是否处于选择模式（true为选择模式，false为查看已选择模式）
  let is_selection_mode = $state(false);
  let is_view_mode = $state(false);
  //搜索参数
  let search_params = $state({
    OfficialName: '',
    page: 1,
    pageSize: 10,
    fuzzyCondition:'',
  });

  // 已选择学生的分页参数
  let selected_search_params = $state({
    OfficialName: '',
    page: 1,
    pageSize: 10,
    fuzzyCondition:'',
  });

  let selected_examinee = $state([]); //已选择学生
  // 过滤后的已选择学生列表
  let filteredselected_examinee = $derived(getFilteredSelectedExaminee());
  // 当前页显示的已选择学生
  let current_page_selected_examinee = $derived(getCurrentPageSelectedExaminee());
  // 已选择学生的总页数
  let selectedtotal_page = $derived(
    selected_examinee.length / selected_search_params.pageSize
      ? Math.ceil(selected_examinee.length / selected_search_params.pageSize)
      : 1,
  );
  
  //总数据条数
  let totals = $state(0);
  //总页数
  let total_page = $derived(totals / search_params.pageSize ? Math.ceil(totals / search_params.pageSize) : 1);

  let registration_student_list = $state([]);
  let selected_registration_student_list = $state([])
  let confirm_student_list = $state([])
  let currentPage = $state(1);
  //是否加载中
  let loading = $state(false);
  //报错
  let error = $state('');
  let registration_list = $state([]);
  let total_registration = $state();
  let total_registration_student = $state();
  const COURSE_MAP = {
    '00': '理论、实操',
    '02': '理论',
    '04': '实操',
  };
  function downloadTemplate() {
    const url = '/student_import_excel/导入学生模版.xlsx';
    const a = document.createElement('a');
    a.href = url;
    a.download = '导入学生模版.xlsx';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  }

  // 导入学生
  function handleImport() {
    if (student_import_panel) {
      student_import_panel.triggerFileInput();
    }
  }

  function handleImportSuccess(is_all_ok, import_data, exist_students) {
  if (is_all_ok && import_data) {
    const newStudents = import_data.map((student, index) => ({
      //id: '', // 新导入的学生没有 ID
      OfficialName: student.officialName || '',
      Gender: student.Gender,
      MobilePhone: student.MobilePhone || '',
      IDCardNo: student.idCardNo || '',
      IDCardType: "居民身份证",
      Account: student.Account || '',
      Domains: ['assess^student'],
      serialNumber: selected_examinee.length + index + 1,
    }));

    // exist_students 中的学生已有 ID，直接使用
    const existingStudents = exist_students.map(s => ({
      id: s.ID,
      OfficialName: s.officialName || '',
      Gender: s.gender,
      MobilePhone: s.mobilePhone || '',
      IDCardNo: s.idCardNo || '',
      Account: s.account || '',
      Domains: ['assess^student'],
      serialNumber: 0, // 后续重新编号
    }));

    // 合并已选、新导入、已存在的学生
    selected_registration_student_list = [...selected_registration_student_list, ...newStudents, ...existingStudents];
    //console.log(selected_registration_student_list);
    // 重新编号
    recalculateSerialNumbers();
  }
  show_import_panel = false;
  
}

  function getFilteredSelectedExaminee() {
    // let filtered = selected_examinee;
    let filtered = selected_registration_student_list;
    if (selected_search_params.fuzzyCondition) {
      filtered = selected_registration_student_list.filter(
        (examinee) =>
          (examinee.OfficialName &&
            examinee.OfficialName.toLowerCase().includes(selected_search_params.fuzzyCondition.toLowerCase())) ||
          (examinee.MobilePhone && examinee.MobilePhone.includes(selected_search_params.fuzzyCondition)) ||
          (examinee.IDCardNo && examinee.IDCardNo.includes(selected_search_params.fuzzyCondition)),
      );
    }
    return filtered;
  }

  function getCurrentPageSelectedExaminee() {
    const startIndex = (selected_search_params.page - 1) * selected_search_params.pageSize;
    const endIndex = startIndex + selected_search_params.pageSize;
    const filtered = filteredselected_examinee;
    return filtered.slice(startIndex, endIndex);
  }


  let name_search_timer = null;

  let page_search_timer = null;

  let is_total_selected = $derived(
  is_view_mode && registration_student_list.length > 0 
    ? registration_student_list.every(examinee => {
        const studentId = examinee.student?.ID;
        return studentId && selected_registration_student_list.some(s => 
          s.student?.ID === studentId || s.ID === studentId
        );
      })
    : false
);

  let show_import_panel = $state(false);

  let student_import_panel = $state(null);

  // 获取当前最大的serialNumber
  // function getMaxSerialNumber() {
  //   if (selected_examinee.length === 0) return 0;
  //   return Math.max(...selected_examinee.map((item) => item.serialNumber || 0));
  // }


  function searchSelectedExaminee(value) {
    console.log(selected_search_params)
    selected_search_params.fuzzyCondition = value;
    selected_search_params.page = 1;
}

  async function searchExaminee() {
    loading = true;
    error = '';

    // 构建查询参数
    const queryParams = new URLSearchParams();
    queryParams.append('page', search_params.page.toString());
    queryParams.append('pageSize', search_params.pageSize.toString());
   // queryParams.append('domain', 'assess^student');
    // if(search_params.fuzzyCondition)
    // {
    //   queryParams.append('fuzzyCondition',search_params.fuzzyCondition);
    // }

    await fetch(`/api/registration?${queryParams.toString()}`, {
      method: 'GET',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
      },
    })
      .then((response) => {
        return response.json();
      })
      .then((result) => {
        if (result.status !== 0) {
          error = result.msg || '搜索失败';
          examinee_list = [];
          totals = 0;
          search_params.page = currentPage;
        } else {
          examinee_list = result.data === null ? [] : result.data;
          totals = result.rowCount;
          registration_list = result.data === null ? [] :result.data.registers;
          total_registration = result.data.total;
          // if (examinee_list !== null) {
          //   // 更新选中状态
          //   const selected_id_set = new Set(selected_examinee.map((item) => item.id));
          //   examinee_list.forEach((examinee) => {
          //     examinee.selected = selected_id_set.has(examinee.ID);
          //   });
          //   const currentPageSelected = examinee_list.filter(e => selected_id_set.has(e.ID));
          //   is_total_selected = examinee_list.length > 0 && currentPageSelected.length === examinee_list.length;
          // }

          
          //is_total_selected = isAllSelected();
        }
      })
      .catch((error) => {
        console.error('搜索用户失败:', error);
        toast.error(error);
        examinee_list = [];
        totals = 0;
      })
      .finally(() => {
        loading = false;
      });
  }

  function searchExamineeName(value) {
  search_params.fuzzyCondition = value;
  search_params.page = 1; // 搜索时重置页码
  
  if (name_search_timer) {
    clearTimeout(name_search_timer);
  }
  
  name_search_timer = setTimeout(() => {
    searchExaminee();
    name_search_timer = null;
  }, 500);
}
  // 重新计算所有selected_examinee的serialNumber
  function recalculateSerialNumbers() {
    selected_examinee = selected_examinee.map((item, index) => ({
      ...item,
      serialNumber: index + 1,
    }));
  }

  function addToSelected(student) {
  if (!selected_registration_student_list.some(s => s.student?.ID === student.student?.ID)) {
    selected_registration_student_list.push(student);
  }
}

// 工具：按 id 移除
  function removeFromSelected(studentId) {
    selected_registration_student_list = selected_registration_student_list.filter(
      s => s.student?.ID !== studentId && s.ID !== studentId
    );
  }

  function toggleSelectStudent(examinee) {
    const isExisted = selected_registration_student_list.some(s => s.student?.ID === examinee.student?.ID || s.ID === examinee.student.ID);
   // console.log("id",examinee);
    if (isExisted) {
      removeFromSelected(examinee.student.ID);
    } else {
      addToSelected(examinee);
    }
  }


  function toggleSelectAll() {
    is_total_selected = !is_total_selected;
    if (is_total_selected) {
      // 全选：添加当前页面所有未选中的考生
      registration_student_list.forEach((examinee) => {
        const exists = selected_registration_student_list.find((item) => item.student?.ID === examinee.student.ID || item.ID===examinee.student.ID);
        if (!exists) {
          selected_registration_student_list.push(examinee);
        }
      });
    } else {
      registration_student_list.forEach((examinee) => {
      const studentID = examinee.student?.ID;
      if (studentID) {
        // 从选中列表中移除当前页面的考生
        selected_registration_student_list = selected_registration_student_list.filter(
          item => item.student?.ID !== studentId && item.ID !== studentID
        );
      }
    });
  }
    

    // 重新计算序列号
    recalculateSerialNumbers();
  }
  
  // 切换到选择模式
  function switchToSelectionMode() {
    is_selection_mode = true;
    is_view_mode = false;
   // search_params.page = 1;
    searchExaminee();
  }

  // 返回查看模式
  function backToViewMode() {
    is_selection_mode = false;
    // 重置已选择学生的分页参数
    selected_search_params.page = 1;
    selected_search_params.OfficialName = '';
  }

  // 判断是否全选
  function isAllSelected() {
    if (examinee_list !== null && examinee_list.length > 0) {
      return examinee_list.every((examinee) => examinee.selected);
    } else {
      return false;
    }
  }


  // 单个复选框选择事件处理
function handleCheckboxChange(examinee, event) {
  // 如果是复选框被点击，阻止事件冒泡避免重复触发
  if (event.target && event.target.type === 'checkbox') {
    event.stopPropagation();
  }
  
  // 直接切换选择状态
  examinee.selected = !examinee.selected;

  if (examinee.selected) {
    // 选中：添加到已选列表（如果不存在的话）
    if (!selected_examinee.find((item) => item.id === examinee.ID)) {
      selected_examinee.push({
        id: examinee.ID,
        OfficialName: examinee.OfficialName || '',
        Account: examinee.Account || '',
        Gender: examinee.Gender || '',
        MobilePhone: examinee.MobilePhone || '',
        IDCardNo: examinee.IDCardNo || '',
        serialNumber: 0,
      });
    }
  } else {
    // 取消选中：从已选列表移除
    const index = selected_examinee.findIndex((item) => item.id === examinee.ID);
    if (index !== -1) {
      selected_examinee.splice(index, 1);
    }
  }

  // 重新计算序列号和更新全选状态
  recalculateSerialNumbers();
  is_total_selected = isAllSelected();
}

  function ViewRegistrationStudent(index){
    const queryParams = new URLSearchParams();
    queryParams.append('page', search_params.page.toString());
    queryParams.append('pageSize', search_params.pageSize.toString());
    queryParams.append('id',registration_list[index].register.ID);
    fetch(`/api/registration?${queryParams}`,{
      method: 'GET',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
      },
    })
    .then((res)=>res.json())
    .then((result)=>{
      if(result.status===0)
      {
        registration_student_list = result.data.student;
      //         registration_student_list = result.data.student.map(s => ({
      //   ...s,
      //   selected: false, // 默认未选中
      // }));
      total_registration_student = result.data.total;
      is_view_mode = true;
      }
      else{
        toast.error("查看报名计划考生失败"+result.msg);
        console.log("查看报名计划考生失败",result.msg);
      }
    })
    .catch((err) => {
        console.error(err);
        toast.error("查看报名计划考生失败"+err);
      });
  }
  // 初始化选中的考生
  $effect(() => {
    if (show_panel ) {
      selected_registration_student_list = ids.map((item, index) => ({
        ...item,
        serialNumber: index + 1,
      }));
      console.log("ids",ids);
    }
  });
</script>

<div class={show_panel ? 'examinee-panel-container' : 'hide'}>
  <div class="examinee-panel">
    <div class="panel-header">
      <span class="panel-header-text">{is_selection_mode ? '选择考生' : '考生列表'}</span>
      <button
        class="close-btn"
        onclick={() => {
          show_panel = false;
          search_params.page = 1;
          is_selection_mode = false;
          onCancel(false);
        }}>×</button
      >
    </div>
    <div class="panel-body">
      {#if !is_selection_mode}
        <!-- 查看选择后的列表 -->
        <div class="selected-examinees-container">
          <div class="action-container">
            <div class="examinee-search-container">
              <!-- <InputBox
              label={'搜索考生'} 
              placeholder={'请输姓名/手机号/身份证号'}
              bind:value={selected_search_params.fuzzyCondition}
              onInput={searchSelectedExaminee}
              clearable={true}
              >
            </InputBox> -->

            </div>
            <div class="button-group">
              <button class="upload-file-button" onclick={switchToSelectionMode}> 选择考生 </button>
               <button class="btn btn--primary " onclick={downloadTemplate}>下载导入模板</button>
            <button class="btn btn--primary " onclick={handleImport}>导入考生</button>
            </div>
          </div>
          <div class="examinee-selection-table-container">
            <table class="table">
              <thead class="student-table-head">
                <tr class="table-head-row">
                  <th class="table-head">姓名</th>
                  <th class="table-head">性别</th>
                  <th class="table-head">手机号</th>
                  <th class="table-head">身份证号</th>
                </tr>
              </thead>
              <tbody>
                {#each selected_registration_student_list as examinee}
                  <tr class="examinee">
                    <td>{examinee.student?.OfficialName || examinee.OfficialName ||'--'}</td>
                    <td>{examinee.student?.Gender || examinee.Gender || '--'}</td>
                    <td>{examinee.student?.MobilePhone || examinee.MobilePhone || '--'}</td>
                    <td>{examinee.student?.IDCardNo || examinee.IDCardNo || '--'}</td>
                  </tr>
                {/each}
              </tbody>
            </table>

            <div class ="{selected_registration_student_list.length ===0 ? "no-data-text" : "hideButton"}"> 
              <Empty text = "暂无数据"/>
            </div>

          </div>
          
        </div>
      {:else if is_selection_mode&&!is_view_mode}
        <!-- 选择模式 -->
        <div class="action-container">
          <div class="examinee-search-container">

          </div>
          <div class="button-group">
            <button class="back-btn" onclick={backToViewMode}>返回考生列表</button>

            <!-- <Button type="primary" >下载模板</Button> -->
             <button class="btn btn--primary " onclick={downloadTemplate}>下载导入模板</button>
            <button class="btn btn--primary " onclick={handleImport}>导入考生</button>
            
          </div>
        </div>
        <div class="examinee-selection-table-container">
          <table class="table">
            <thead class="student-table-head">
              <tr class="table-head-row">
                <!-- <th class="table-head" style="width: 30px;">
                  <input
                    type="checkbox"
                    class="custom-checkbox"
                    onchange={toggleSelectAll}
                    checked={is_total_selected}
                  />
                </th> -->
                <!-- <th class="table-head">姓名</th>
                <th class="table-head">性别</th>
                <th class="table-head">手机号</th>
                <th class="table-head">身份证号</th> -->
                <th class = "table-head">名称</th>
                <th class = "table-head">考试科目</th>
                <th class = "table-head">考生人数</th>
                <th class = "table-head">操作</th>
              </tr>
            </thead>
            <tbody>
              <!-- {#each examinee_list as examinee, index}
                <tr 
                class={`examinee ${examinee.selected ? 'selected' : ''}`}
                onclick= {(event) => handleCheckboxChange(examinee, event)}
                >
                  <td>
                    <input
                      type="checkbox"
                      class="custom-checkbox"
                      checked={examinee.selected}
                      
                    />
                  </td>
                  <td
                    >{examinee.OfficialName === null || examinee.OfficialName === '' ? '--' : examinee.OfficialName}</td
                  >
                  <td>{examinee.Gender === null || examinee.Gender === '' ? '--' : examinee.Gender}</td>
                  <td>{examinee.MobilePhone === null || examinee.MobilePhone === '' ? '--' : examinee.MobilePhone}</td>
                  <td>{examinee.IDCardNo === null || examinee.IDCardNo === '' ? '--' : examinee.IDCardNo}</td>
                </tr>
              {/each} -->
              {#each registration_list as registration,index}
              <tr>
                 <!-- <td>
                    <input
                      type="checkbox"
                      class="custom-checkbox"
                      checked={registration.selected}
                      
                    />
                  </td> -->
                  <td>{registration.register.Name === null ? '--' : registration.register.Name}</td>
                  <td>{registration.register.Course === null ? '--' : COURSE_MAP[registration.register.Course]}</td>
                  <td>{registration.studentCount === null ? '--' :registration.studentCount}</td>
                  <td><button class="view-btn" onclick={()=>ViewRegistrationStudent(index)}>查看考生</button></td>
              </tr>
              {/each}
            </tbody>
          </table>



          <div class ="{registration_list.length === 0 ? "no-data-text" : "hideButton"}"> 
              <Empty text = "暂无数据"/>
            </div>

        </div>
       {:else}
         <div class="selected-examinees-container">
          <div class="action-container">
            <div class="examinee-search-container">
              <!-- <InputBox
              label={'搜索考生'} 
              placeholder={'请输姓名/手机号/身份证号'}
              bind:value={selected_search_params.fuzzyCondition}
              onInput={searchSelectedExaminee}
              clearable={true}
              >
            </InputBox> -->

            </div>
            <div class="button-group">
              <button class="btn btn--info" onclick={switchToSelectionMode}> 返回报名计划列表 </button>
               <button class="btn btn--primary " onclick={downloadTemplate}>下载导入模板</button>
            <button class="btn btn--primary " onclick={handleImport}>导入考生</button>
            </div>
          </div>
          <div class="examinee-selection-table-container">
            <table class="table">
              <thead class="student-table-head">
                <tr class="table-head-row">
                  <th class="table-head" style="width: 30px;">
                  <input
                    type="checkbox"
                    class="custom-checkbox"
                    onchange={toggleSelectAll}
                    checked={is_total_selected}
                  />
                </th>
                  <th class="table-head">姓名</th>
                  <th class="table-head">性别</th>
                  <th class="table-head">手机号</th>
                  <th class="table-head">身份证号</th>
                </tr>
              </thead>
              <tbody>
                {#each registration_student_list as examinee,index}
                  <tr class="examinee" onclick= {(event) => toggleSelectStudent(examinee)}>
                    
                    <td>
                    <input
                      type="checkbox"
                      class="custom-checkbox"
                      checked={selected_registration_student_list.some(s => s.student?.ID === examinee.student?.ID ||s.ID === examinee.student?.ID)}
                      
                    />
                  </td>
                    <td>{examinee.student.OfficialName || examinee.name ||'--'}</td>
                    <td>{examinee.student.Gender || examinee.gender || '--'}</td>
                    <td>{examinee.student.MobilePhone || examinee.mobile_phone || '--'}</td>
                    <td>{examinee.student.IDCardNo || examinee.id_card_no || '--'}</td>
                  </tr>
                {/each}
              </tbody>
            </table>

            <div class ="{registration_student_list.length ===0 ? "no-data-text" : "hideButton"}"> 
              <Empty text = "暂无数据"/>
            </div>

          </div>
         </div>
      {/if}
    </div>

    <div class="pagination-container {!is_selection_mode ? ' ' : 'hideButton'}">
            <span style="font-size: 12px; margin-right:10px">
              已选 <span style="color: #00A870; margin:0 5px 0 5px;">{selected_registration_student_list.length}</span> 条
            </span>

            <Pagination
              total_items={selected_registration_student_list.length}
              current_page={selected_search_params.page}
              page_size_options={[10,20,50]}
              on:pageChange={(e) => {
                selected_search_params.page = e.detail;
              }}
              on:pageSizeChange={(e) => {
              selected_search_params.pageSize = e.detail;
              selected_search_params.page = 1; // 重置到第一页
            }}
            />
          </div>

    <div class="pagination-container {is_selection_mode && !is_view_mode ? ' ' : 'hideButton'}">
          <span style="font-size: 12px; margin-right:10px">
            已选 <span style="color: #00A870; margin:0 5px 0 5px;">{selected_examinee.length}</span> 条
          </span>
          <Pagination
            total_items={total_registration}
            current_page={search_params.page}
            page_size_options={[10,20,50]}
            on:pageChange={(e) => {
              search_params.page = e.detail;
              is_total_selected = false;
              searchExaminee();
            }}
            on:pageSizeChange={(e) => {
              search_params.pageSize = e.detail;
              search_params.page = 1; // 重置到第一页
              is_total_selected = false;
              searchExaminee();
            }}
          ></Pagination>
        </div>
    
    <div class="pagination-container {is_selection_mode && is_view_mode ? ' ' : 'hideButton'}">
          <span style="font-size: 12px; margin-right:10px">
            已选 <span style="color: #00A870; margin:0 5px 0 5px;">{selected_registration_student_list.length}</span> 条
          </span>
          <Pagination
            total_items={total_registration_student}
            current_page={search_params.page}
            page_size_options={[10,20,50]}
            on:pageChange={(e) => {
              search_params.page = e.detail;
              is_total_selected = false;
              searchExaminee();
            }}
            on:pageSizeChange={(e) => {
              search_params.pageSize = e.detail;
              search_params.page = 1; // 重置到第一页
              is_total_selected = false;
              searchExaminee();
            }}
          ></Pagination>
        </div>

    <div class="panel-footer">
      
      <button
        class="btn"
        onclick={() => {
          show_panel = false;
          search_params.page = 1;
          //selected_registration_student_list = JSON.parse(JSON.stringify(confirm_student_list));
          onCancel(false);
          is_selection_mode = false;
        }}>取消</button
      >

      <button
        class="btn save"
        onclick={() => {
          confirm_student_list = selected_registration_student_list;
          onConfirm(confirm_student_list);
          show_panel = false;
          is_selection_mode = false;
        }}>确定</button
      >
    </div>
  </div>

  <StudentImportPanel 
  bind:show={show_import_panel}
  bind:this={student_import_panel}
  onImport={handleImportSuccess}  
  onCancel={() =>{ show_import_panel=false;}}  />
</div>



<style lang="scss" scoped>
  .hide {
    display: none;
  }

  .table {
    width: 100%;
    border-collapse: collapse;
    flex: 1;
    max-height: 40px;

    th,
    td {
      font-size: 14px;
      color: rgba(51, 51, 51);
      border: none;
      padding: 8px;
      text-align: center;
      overflow: visible;
      border-top: none;
      border-left: none;
      border-right: none;
      height: 40px;
      box-sizing: border-box;
    }

    td {
      border-bottom: 1px solid #ddd;
    }

    th {
      color: rgba(0, 0, 0, 0.3);
      background: #fafafa;
    }

    // 表格行样式
    tbody {
      tr {
        &:hover {
          background-color: #e0f0ff;
          cursor: pointer;
        }

        &.selected {
          background-color: #d0e8ff;

          &:hover {
            background-color: #c0d8ff;
          }
        }
      }
    }
  }

  .pagination-container {
    display: flex;
    justify-content: right;
    align-items: center;
    margin: 16px 0;
    padding: 0 16px;
  }

  .examinee-panel-container {
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
    
  }

  .examinee-panel {
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

  .panel-header {
    display: flex;
    flex-direction: row;
    align-items: center;
    justify-content: space-between;
    padding: 20px 24px;
    border-bottom: 1px solid #eee;
    color: var(--text-primary);
    font-size: 20px;
    font-weight: 600;

    .close-btn {
      background: none;
      border: none;
      font-size: 24px;
      width: 32px;
      height: 32px;
      text-align: center;
      color: var(--text-secondary);
      cursor: pointer;
      transition: color 0.2s;
      padding: 4px;
      border-radius: 4px;
      display: flex;
      align-items: center;
      justify-content: center;
      &:hover {
        color: var(--red);
        background: rgba(0, 0, 0, 0.04);
      }
    }
  }

  .panel-body {
    padding: 24px;
    flex: 1;
    display: flex;
    flex-direction: column;
    min-height: 0;
    overflow-y: auto;
  }

  .action-container {
    display: flex;
    flex-direction: row;
    align-items: center;
    justify-content: space-between;
    padding: 0 16px;
  }

  .examinee-search-container {
    flex: 0 0 350px;
    display: flex;
    justify-content: flex-start;
    align-items: center;
    margin-left: -5%; //维持组件位置在行左侧对齐
  }

  .button-group {
    display: flex;
    gap: 16px;
  }

  .back-btn {
    background: none;
    border: 1px solid #d9d9d9;
    padding: 6px 12px;
    height: 32px;
    border-radius: 4px;
    color: var(--text-primary);
    cursor: pointer;
    font-size: 14px;
    transition: all 0.2s;

    &:hover {
      background: #f5f5f5;
    }
  }

  .remove-btn {
    background: none;
    border: 1px solid #dc3545;
    color: #dc3545;
    font-size: 12px;
    cursor: pointer;
    padding: 4px 8px;
    border-radius: 4px;
    transition: all 0.2s;

    &:hover {
      background: #dc3545;
      color: white;
    }
  }

  .selected-examinees-container {
    flex: 1;
    display: flex;
    flex-direction: column;
    min-height: 450px;
  }

  .examinee-selection-table-container {
    margin: 20px 0px 0 0px;
    flex: 1;
    min-height: 440px;
    position: relative;
    display: flex;
    flex-direction: column;
  }

  .btn {
    min-width: 80px;
    padding: 7px 18px;
    border-radius: 5px;
    border: 1.5px solid #d9d9d9;
    background: #fff;
    color: var(--blue);
    font-size: 15px;
    cursor: pointer;
    font-weight: 500;
    transition: all 0.2s;

    @media (max-width: 768px) {
      min-width: 70px;
      padding: 6px 16px;
      font-size: 14px;
    }

    &:hover {
      background: #f0f6ff;
    }
    &.save {
      background: var(--blue);
      color: #fff;
      border-color: var(--blue);
      &:hover {
        background: var(--primary-hover);
        border-color: var(--primary-hover);
      }
    }
    &:disabled {
      opacity: 0.6;
      cursor: not-allowed;
    }
  }

  .panel-footer {
    display: flex;
    justify-content: flex-end;
    gap: 16px;
    padding: 12px 24px 18px;
    border-top: 1px solid #eee;

    @media (max-width: 768px) {
      padding: 12px 16px 16px;
    }

    @media (max-width: 480px) {
      flex-direction: column;
      gap: 8px;

      .btn {
        width: 100%;
      }
    }
  }

  // 自定义复选框
  .custom-checkbox {
    width: 16px;
    height: 16px;
    border: 1px solid rgb(0, 0, 0, 0.3);
    cursor: pointer;
    accent-color: #0052d9;

    &:disabled {
      opacity: 0.6;
      cursor: not-allowed;
    }
  }

  .download-template-button {
    border: none;
    border-radius: 3px;
    background-color: #e3e3e3;
    width: 100px;
    height: 32px;
    color: var(--blue);
    font-size: 14px;
    cursor: pointer;
  }

  .upload-file-button {
    border: none;
    border-radius: 3px;
    background-color: var(--blue);
    width: 100px;
    height: 32px;
    color: white;
    font-size: 14px;
    cursor: pointer;
  }

  .return-registration-button
  {

  }
  .no-data-text {
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    color: var(--text-disabled);
    font-size: 14px;
    font-weight: normal;
  }

  .student-table-head {
    background-color: #ffffff;
    font-size: 14px;
    font-weight: normal;
    color: var(--text-disabled);
    border: none;
    padding: 8px;
    text-align: center;
    .table-head-row {
      height: 40px;
      .table-head {
        font-weight: normal;
        background: #fff;
        color: var(--text-disabled);
      }
    }
  }

  .view-btn{
    all:unset;
    color:var(--blue);
  }

   .hideButton {
    visibility: hidden;
    position: absolute;
    pointer-events: none;
  }

  
</style>
