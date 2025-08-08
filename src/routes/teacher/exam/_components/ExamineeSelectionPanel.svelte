<script>
  import Pagination from '$lib/components/Pagination/Pagination.svelte';
  import StudentImportPanel from './StudentImportPanel.svelte';
  import InputBox from '$lib/components/Input/InputBox.svelte';
  import Button from '$lib/components/Button/Button.svelte';
  import Empty from '$lib/components/Table/Empty.svelte';
  import {toast} from '$lib/components/Toast/Toast.js'

  let {
    show_panel = false,
    ids = [],
    onCancel = (/** @type {boolean} */ load_new_file) => {},
    onConfirm = (/** @type {any} */ selected_examinee) => {},
  } = $props();

  let examinee_list = $state([]);

  // 是否处于选择模式（true为选择模式，false为查看已选择模式）
  let is_selection_mode = $state(false);

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

  let currentPage = $state(1);
  //是否加载中
  let loading = $state(false);
  //报错
  let error = $state('');

  function getFilteredSelectedExaminee() {
    let filtered = selected_examinee;
    if (selected_search_params.fuzzyCondition) {
      filtered = selected_examinee.filter(
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


  /**
   * @type {any}
   * 防抖计时器
   */
  let name_search_timer = null;

  /**
   * @type {any}
   * 防抖计时器
   */
  let page_search_timer = null;

  // 全选/取消全选状态
  /**
   * @type {boolean} 表示是否全选
   */
  let is_total_selected = $state(false);

  // let showStudentImportPanel = $state(false);

  /**
   * @type {any}
   */
  let studentImportPanel = $state(null);

  // 获取当前最大的serialNumber
  function getMaxSerialNumber() {
    if (selected_examinee.length === 0) return 0;
    return Math.max(...selected_examinee.map((item) => item.serialNumber || 0));
  }


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
    queryParams.append('domain', 'cst.school^student');
    if(search_params.fuzzyCondition)
    {
      queryParams.append('fuzzyCondition',search_params.fuzzyCondition);
    }

    await fetch(`/api/user?${queryParams.toString()}`, {
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
         

          if (examinee_list !== null) {
            // 更新选中状态
            const selected_id_set = new Set(selected_examinee.map((item) => item.id));
            examinee_list.forEach((examinee) => {
              examinee.selected = selected_id_set.has(examinee.ID);
            });
          }

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

  function toggleSelectAll() {
    is_total_selected = !is_total_selected;
    examinee_list.forEach((examinee) => {
      examinee.selected = is_total_selected;
    });

    if (is_total_selected) {
      // 全选：添加当前页面所有未选中的考生
      examinee_list.forEach((examinee) => {
        const exists = selected_examinee.find((item) => item.id === examinee.ID);
        if (!exists) {
          selected_examinee.push({
            id: examinee.ID,
            OfficialName: examinee.OfficialName || '',
            Gender: examinee.Gender || '',
            account: examinee.account || '',
            MobilePhone: examinee.MobilePhone || '',
            IDCardNo: examinee.IDCardNo || '',
            serialNumber: 0, // 临时设置，稍后重新计算
          });
        }
      });
    } else {
      // 取消全选：移除当前页面的所有考生
      examinee_list.forEach((examinee) => {
        const index = selected_examinee.findIndex((item) => item.id === examinee.ID);
        if (index !== -1) {
          selected_examinee.splice(index, 1);
        }
      });
    }

    // 重新计算序列号
    recalculateSerialNumbers();
  }

  // 切换到选择模式
  function switchToSelectionMode() {
    is_selection_mode = true;
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

  // 初始化选中的考生
  $effect(() => {
    if (show_panel && ids && ids.length > 0) {
      selected_examinee = ids.map((item, index) => ({
        ...item,
        serialNumber: index + 1,
      }));
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
              <InputBox
              label={'搜索考生'} 
              placeholder={'请输姓名/手机号/身份证号'}
              bind:value={selected_search_params.fuzzyCondition}
              onInput={searchSelectedExaminee}
              clearable={true}
              >
            </InputBox>

            </div>
            <div class="button-group">
              <button class="upload-file-button" onclick={switchToSelectionMode}> 选择考生 </button>
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
                {#each current_page_selected_examinee as examinee}
                  <tr class="examinee">
                    <td>{examinee.OfficialName || '--'}</td>
                    <td>{examinee.Gender || '--'}</td>
                    <td>{examinee.MobilePhone || '--'}</td>
                    <td>{examinee.IDCardNo || '--'}</td>
                  </tr>
                {/each}
              </tbody>
            </table>

            <div class ="{filteredselected_examinee.length ===0 ? "no-data-text" : "hideButton"}"> 
              <Empty text = "暂无数据"/>
            </div>

          </div>
          <div class="pagination-container">
            <span style="font-size: 12px; margin-right:10px">
              已选 <span style="color: #00A870; margin:0 5px 0 5px;">{filteredselected_examinee.length}</span> 条
            </span>

            <Pagination
              total_items={filteredselected_examinee.length}
              current_page={selected_search_params.page}
              page_size_options={[10,20,50]}
              on:pageChange={(e) => {
                selected_search_params.page = e.detail;
              }}
            />
          </div>
        </div>
      {:else}
        <!-- 选择模式 -->
        <div class="action-container">
          <div class="examinee-search-container">
            <InputBox
              label='搜索考生'
              placeholder='请输姓名/手机号/身份证号'
              bind:value={search_params.fuzzyCondition}
              onInput={searchExamineeName}
              clearable={true}
              >
            </InputBox>
          </div>
          <div class="button-group">
            <button class="back-btn" onclick={backToViewMode}>返回考生列表</button>

            <!-- <Button type="primary" >下载模板</Button> -->

            <!-- <Button
                            type="primary"
                            onclick={() => {
                            if (studentImportPanel) {
                                studentImportPanel.triggerFileInput();
                            }
                            导入学生
                        }}>
                        </Button> -->
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
              {#each examinee_list as examinee, index}
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
              {/each}
            </tbody>
          </table>



          <div class ="{examinee_list.length ===0 ? "no-data" : "hideButton"}"> 
              <Empty text = "暂无数据"/>
            </div>

        </div>


        <div class="pagination-container">
          <span style="font-size: 12px; margin-right:10px">
            已选 <span style="color: #00A870; margin:0 5px 0 5px;">{selected_examinee.length}</span> 条
          </span>
          <Pagination
            total_items={totals}
            current_page={search_params.page}
            page_size_options={[10,20,50]}
            on:pageChange={(e) => {
              search_params.page = e.detail;
              searchExaminee();
            }}
          ></Pagination>
        </div>
      {/if}
    </div>


    <div class="panel-footer">
      
      <button
        class="btn"
        onclick={() => {
          show_panel = false;
          search_params.page = 1;
          selected_examinee = [];
          onCancel(false);
          is_selection_mode = false;
        }}>取消</button
      >

      <button
        class="btn save"
        onclick={() => {
          show_panel = false;
          onConfirm(selected_examinee);
          is_selection_mode = false;
        }}>确定</button
      >
    </div>
  </div>
</div>

<!-- <StudentImportPanel
    onImport={(/** @type {any} */ success_student, /** @type {any} */ has_error) => {
        if (success_student && success_student.length > 0) {
            // 过滤掉已存在的id
            const newStudents = success_student
                .filter(
                    (/** @type {any} */ student) =>
                        !selected_examinee.some((item) => item.id === student),
                )
                .map((/** @type {any} */ student, /** @type {any} */ index) => ({
                    id: student,
                    OfficialName: `学生${student}`, // 临时名称
                    Gender: "",
                    account: "",
                    MobilePhone: "",
                    IDCardNo: "",
                    serialNumber: 0, // 临时设置
                }));

            // 更新selected_examinee
            selected_examinee = [...selected_examinee, ...newStudents];

            // 重新计算序列号
            recalculateSerialNumbers();

            searchExaminee();
        }

        if (!has_error) {
            showStudentImportPanel = false;
        }
    }}
    onCancel={() => {
        showStudentImportPanel = false;
    }}
    bind:show={showStudentImportPanel}
    bind:this={studentImportPanel}
/> -->

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
    z-index: 1000;
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

   .hideButton {
    visibility: hidden;
    position: absolute;
    pointer-events: none;
  }
</style>
