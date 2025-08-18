<!-- /*
 * @Author: 李乐毅 
 * @Date: 2025-07-27 16:36:22 
 * @Last Modified by:   李乐毅 
 * @Last Modified time: 2025-07-27 16:36:22 
 */ -->
<script>
  import Pagination from '$lib/components/Pagination/Pagination.svelte'; //分页器
  import InputBox from '$lib/components/Input/InputBox.svelte'; //搜索框
  import Button from '$lib/components/Button/Button.svelte';
  import { toast } from '$lib/components/Toast/Toast.js';
  import Empty from '$lib/components/Table/Empty.svelte';
  import StudentImportPanel from './StudentImportPanel.svelte';

  let {
    show_panel = false,
    ids = [],
    practice_id = null, // 添加练习ID参数
    onCancel = (/** @type {boolean} */ load_new_file) => {
      console.log('取消选择');
    },
    onConfirm = (/** @type {any} */ newStudents,selected_ids) => {
      console.log(selected_ids);
    },
  } = $props();

  //新增的学生
  let newStudents = $state([]);


  let page_size = $state(10);

  //使用的api,用于区分导入考试还是练习导入
  let import_api_url = '/api/practice';

  //搜索参数
  let search_params = $state({
    name: '',
    page: 1,
    pageSize: 10,
  });

  /**
   * @type {any[]}
   */
  let selected_ids = $state([]);

  // 已选择学生的分页参数
  let selected_search_params = $state({
    name: '',
    page: 1,
    pageSize: 10,
  });

  // 已选择学生的总页数
  let selected_total_page = $derived(
    selected_ids.length / selected_search_params.pageSize
      ? Math.ceil(selected_ids.length / selected_search_params.pageSize)
      : 1,
  );

  function getFilteredSelectedIds() {
    let filtered = selected_ids;
    if (selected_search_params.name) {
      filtered = selected_ids.filter(
        (student) =>
          (student.officialName &&
            student.officialName.toLowerCase().includes(selected_search_params.name.toLowerCase())) ||
          (student.phone && student.phone.includes(selected_search_params.name)) ||
          (student.idCardNo && student.idCardNo.includes(selected_search_params.name)),
      );
    }
    return filtered;
  }

  function getCurrentPageSelectedIds() {
    const startIndex = (selected_search_params.page - 1) * selected_search_params.pageSize;
    const endIndex = startIndex + selected_search_params.pageSize;
    const filtered = filtered_selected_ids;
    return filtered.slice(startIndex, endIndex);
  }

  // 过滤后的已选择学生列表
  let filtered_selected_ids = $derived(getFilteredSelectedIds());

  // 当前页显示的已选择学生
  let current_page_selected_ids = $derived(getCurrentPageSelectedIds());

  //总数据条数
  let totals = $state(0);

  //总页数
  let total_page = $derived(totals / search_params.pageSize ? Math.ceil(totals / search_params.pageSize) : 1);
  /**
   * 每页数量选择回调
   * @param {string} value - 每页显示的数据条数
   */
  function handle_page_size_change(event) {
    const pageSize = typeof event === 'number' ? event : event.detail;
    selected_search_params.pageSize = pageSize;
    selected_search_params.page = 1; // 重置到第一页
  }

  let current_page = $state(1);

  //是否加载中
  let loading = $state(false);

  //报错
  let error = $state('');

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
  let is_all_selected = $state(false);
  let show_import_panel = $state(false);

  /**
   * @type {import("./StudentImportPanel.svelte").default & { triggerFileInput: () => void } | null}
   */
  let student_import_panel = $state(null);

  // 获取当前最大的serial_number
  function getMaxSerialNumber() {
    if (selected_ids.length === 0) return 0;
    return Math.max(...selected_ids.map((item) => item.serial_number || 0));
  }

  /**
   * @param {string} value
   * 已选择学生搜索
   */
  function onSelectedSearch(value) {
    selected_search_params.name = value;
    selected_search_params.page = 1;
    // 搜索功能通过响应式更新自动触发，不需要额外调用
  }

  /**
   * @param {number} page
   * 已选择学生页数跳转
   */
  function onSelectedPageChooseFunc(event) {
    // 注意：Pagination组件传递的是 event.detail，而不是直接的页码
    const page = typeof event === 'number' ? event : event.detail;
    selected_search_params.page = page;
  }

  let initial_load = $derived(show_panel);

  // 重新计算所有selected_ids的serial_number
  function recalculateSerialNumbers() {
    // 只在序号不连续或序号过大时重新计算
    let needsRecalculation = false;

    // 只检查第一个和最后一个序号，检查是否不连续，以及是否有超过10000的序号
    if (selected_ids.length > 0) {
      const firstItem = selected_ids[0];
      const lastItem = selected_ids[selected_ids.length - 1];

      needsRecalculation =
        (firstItem.serial_number !== 1 || lastItem.serial_number !== selected_ids.length) &&
        lastItem.serial_number > 10000;
    }

    if (needsRecalculation) {
      selected_ids = selected_ids.map((item, index) => ({
        ...item,
        serial_number: index + 1,
      }));
    }
  }
  /**
   * @param {number} id
   */
  async function getStudentInfo(id) {
    error = '';

    // 构建查询参数
    let query_params = new URLSearchParams();

    query_params.append('id', practice_id);

    await fetch(`/api/practiceStudentList?${query_params.toString()}`, {
      method: 'GET',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
      },
    })
      .then((response) => {
        if (!response.ok) {
          toast.error('获取学生列表失败');
          throw new Error('获取学生列表失败');
        }
        return response.json();
      })
      .then((result) => {
        if (result.status != 0) {
          error = result.msg || '获取学生列表失败';
          selected_ids = [];
          totals = 0;
          search_params.page = current_page;
          toast.error(error);
        } else if (selected_ids.length > 0 && selected_ids.length != result.data.length) {
        } else {
          selected_ids =
            result.data === null
              ? []
              : result.data.map((item) => ({
                  ...item,
                  officialName: item.official_name,
                  idCardNo: item.id_card_no,
                  mobilePhone: item.phone,
                  ID: item.id
                }));
              
        }
      })
      .catch((error) => {
        console.log(error);
        error = '获取学生列表失败';
        selected_ids = [];
        totals = 0;
        search_params.page = current_page;
        toast.error(error);
      });
  }

  //当打开面板时自动搜索学生列表
  $effect(() => {
    if (show_panel && initial_load) {
      initial_load = false;
      //每次打开时将外部选中的id赋值给当前面板记录的已选中的id 在搜索前执行是为了能正常显示每个列表项的选中效果
      selected_ids = ids;
      filtered_selected_ids = ids;
      if (practice_id) {
        // 获取已选学生的信息
        getStudentInfo(practice_id);
      }
    }
  });

  //下载模板函数
  // 下载模板
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

  function handleImportSuccess(is_all_ok, import_data,exist_students) {
    if (is_all_ok && import_data) {
      // importedData 包含了所有导入的学生信息
      console.log('导入的学生数据:', import_data);

      // 处理导入的学生数据，例如添加到学生列表
       newStudents = import_data.map((student, index) => ({
        serial_number: selected_ids.length + index + 1,
        // 可以添加其他需要的字段
        officialName: student.officialName,
        mobilePhone: student.MobilePhone,
        gender: student.Gender,
        idCardNo: student.idCardNo,
        account: student.Account,
        ...student
      }));
       // 过滤掉已经在 selected_ids 中存在的学生（避免重复）
     exist_students = exist_students.filter(exist_student => {
      return !selected_ids.some(selected_student => selected_student.ID === exist_student.ID);
    });
    console.log('exist_students',exist_students)
      // 更新选中学生列表
      selected_ids = [...selected_ids, ...newStudents,...exist_students];
      console.log('selected',selected_ids);
      recalculateSerialNumbers();
    }
    show_import_panel = false;
  }
</script>

<div class={show_panel ? 'examinee-panel-container' : 'hide'}>
  <div class="examinee-panel">
    <div class="panel-header">
      <span class="panel-header-text">{'学生列表'}</span>
      <Button
        onclick={() => {
          show_panel = false;
          search_params.page = 1;
          onCancel(false);
        }}
        plain>×</Button
      >
    </div>
    <div class="panel-body">
      <!-- 查看已选择模式 -->
      <div class="selected-examinees-container">
        <div class="action-container">
          <div class="examinee-search-container">
            <InputBox label={'搜索学生：'} placeholder={'请输姓名/手机号/身份证号'} onInput={onSelectedSearch}
            ></InputBox>
          </div>
          <div class="button-group">
            <Button onclick={downloadTemplate}>下载模板</Button>
            <Button
              onclick={() => {
                if (student_import_panel) {
                  student_import_panel.triggerFileInput();
                }
              }}>导入学生</Button
            >
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
              {#each current_page_selected_ids as student}
                <tr class="examinee">
                  <td>{student.officialName || '--'}</td>
                  <td>{student.gender || '--'}</td>
                  <td>{student.mobilePhone || '--'}</td>
                  <td>{student.idCardNo || '--'}</td>
                </tr>
              {/each}
            </tbody>
          </table>
          {#if filtered_selected_ids.length === 0}
            <div style="height: 200px; padding: 0;">
              <div class="empty-wrapper">
                <Empty text="暂无学生数据" />
              </div>
            </div>
          {/if}
        </div>
        <div class="pagination-container">
          <Pagination
            total_items={filtered_selected_ids.length}
            page_size={selected_search_params.pageSize}
            current_page={selected_search_params.page}
            on:pageChange={onSelectedPageChooseFunc}
            on:pageSizeChange={handle_page_size_change}
          ></Pagination>
        </div>
      </div>
    </div>
    <div class="panel-footer">
      <Button
        type="info"
        onclick={() => {
          show_panel = false;
          search_params.page = 1;
          selected_ids = [];
          onCancel(false);
        }}
        plain>取消</Button
      >
      <Button
        onclick={() => {
          show_panel = false;
          search_params.page = 1;
          onConfirm(newStudents,selected_ids);
        }}>确定</Button
      >
    </div>
  </div>
</div>
<StudentImportPanel
  onImport={handleImportSuccess}
  onCancel={() => {
    show_import_panel = false;
  }}
  bind:show={show_import_panel}
  bind:this={student_import_panel}
/>

<style lang="scss" scoped>
  .hide {
    display: none;
  }

  .table {
    width: 100%;
    border-collapse: collapse;
    table-layout: fixed;

    th,
    td {
      font-size: 14px;
      color: (0, 0, 0, 0.3);
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
    z-index: 1001;
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
    color: #1a1a1a;
    font-size: 20px;
    font-weight: 600;

    .close-btn {
      background: none;
      border: none;
      font-size: 24px;
      width: 32px;
      height: 32px;
      text-align: center;
      color: #666;
      cursor: pointer;
      transition: color 0.2s;
      padding: 4px;
      border-radius: 4px;
      display: flex;
      align-items: center;
      justify-content: center;
      &:hover {
        color: #ff4d4f;
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
    overflow-y: hidden;
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
  }

  .button-group {
    display: flex;
    gap: 16px;
  }

  .selected-examinees-container {
    display: flex;
    flex-direction: column;
    height: 100%;
  }

  .examinee-selection-table-container {
    margin: 20px 0px 0 0px;
    flex: 1;
    min-height: 440px;
    position: relative;
    display: flex;
    flex-direction: column;
    overflow-y: auto;
  }
  .download-template-button {
    border: none;
    border-radius: 3px;
    background-color: #e3e3e3;
    width: 100px;
    height: 32px;
    color: #165dff;
    font-size: 14px;
    cursor: pointer;
  }

  .upload-file-button {
    border: none;
    border-radius: 3px;
    background-color: #165dff;
    width: 100px;
    height: 32px;
    color: white;
    font-size: 14px;
    cursor: pointer;
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

  .cancel-btn {
    min-width: 80px;
    padding: 7px 18px;
    border-radius: 5px;
    border: 1.5px solid #d9d9d9;
    background: #fff;
    color: #333;
    font-size: 15px;
    cursor: pointer;
    font-weight: 500;
  }

  .save-btn {
    min-width: 80px;
    padding: 7px 18px;
    border-radius: 5px;
    border: none;
    background: #00a870;
    color: #fff;
    font-size: 15px;
    cursor: pointer;
    font-weight: 500;
  }

  .save-btn-disabled {
    min-width: 80px;
    padding: 7px 18px;
    border-radius: 5px;
    border: none;
    background: #cccccc;
    color: #fff;
    font-size: 15px;
    cursor: not-allowed;
    font-weight: 500;
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

  .no-data-text {
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    color: #999;
    font-size: 14px;
    font-weight: normal;
  }

  .student-table-head {
    background-color: #ffffff;
    font-size: 14px;
    font-weight: normal;
    color: rgb(0, 0, 0, 0.3);
    border: none;
    padding: 8px;
    text-align: center;
    .table-head-row {
      height: 40px;
      .table-head {
        font-weight: normal;
        background: #fff;
        color: rgb(0, 0, 0, 0.3);
      }
    }
  }
</style>
