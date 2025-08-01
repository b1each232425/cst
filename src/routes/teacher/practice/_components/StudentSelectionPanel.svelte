<!-- /*
 * @Author: 李乐毅 
 * @Date: 2025-07-27 16:36:22 
 * @Last Modified by:   李乐毅 
 * @Last Modified time: 2025-07-27 16:36:22 
 */ -->
<script>
  import Pagination from '$lib/components/Pagination/Pagination.svelte'; //分页器
  import InputBox from '$lib/components/Input/InputBox.svelte'; //搜索框
  import StudentImportPanel from './StudentImportPanel.svelte';
  import Button from '$lib/components/Button/Button.svelte';
  import { toast } from '$lib/components/Toast/Toast.js';
  import Empty from '$lib/components/Table/Empty.svelte';

  let {
    show_panel = false,
    ids = [],
    practice_id = null, // 添加练习ID参数
    onCancel = (/** @type {boolean} */ load_new_file) => {
      console.log('取消选择');
    },
    onConfirm = (/** @type {any} */ selected_ids) => {
      console.log(selected_ids);
    },
  } = $props();

  /**
   * @type {any[]}
   */
  let student_list = $state([]);

  // 是否处于选择模式（true为选择模式，false为查看已选择模式）
  let is_selection_mode = $state(false);
  let page_size = $state(10);

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
          (student.official_name &&
            student.official_name.toLowerCase().includes(selected_search_params.name.toLowerCase())) ||
          (student.phone && student.phone.includes(selected_search_params.name)) ||
          (student.id_card_no && student.id_card_no.includes(selected_search_params.name)),
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
  let show_student_import_panel = $state(false);

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
   * 搜索页数
   */
  function onSearchPageFunc(value) {
    const numericValue = parseFloat(value);
    if (numericValue < 1) {
      search_params.page = 1;
    } else {
      search_params.page = numericValue;
    }

    //防抖逻辑
    if (page_search_timer) {
      clearTimeout(page_search_timer);
    }
    page_search_timer = setTimeout(() => {
      searchExaminee();
      page_search_timer = null;
    }, 300);
  }

  /**
   * @param {boolean} is_next
   * 上一页/下一页
   */
  function onNextOrLastPage(is_next) {
    if (loading === true) {
      return;
    }
    if (is_next && search_params.page < total_page) {
      search_params.page += 1;
      searchExaminee();
    }
    if (!is_next && search_params.page > 1) {
      search_params.page -= 1;
      searchExaminee();
    }
  }

  /**
   *
   * 页数跳转
   */
  function onPageChooseFunc(event) {
    if (loading === true) {
      return;
    }
    search_params.page = event.detail;
    searchExaminee();
  }

  /**
   * @param {string} value
   * 搜索
   */
  function onSearch(value) {
    search_params.name = value === '' ? '' : value;

    //防抖逻辑
    if (name_search_timer) {
      clearTimeout(name_search_timer);
    }
    name_search_timer = setTimeout(() => {
      name_search_timer = null;
      search_params.page = 1;
      searchExaminee();
    }, 300);
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
   * @param {boolean} is_next
   * 已选择学生上一页/下一页
   */
  function onSelectedNextOrLastPage(is_next) {
    if (is_next && selected_search_params.page < selected_total_page) {
      selected_search_params.page += 1;
    }
    if (!is_next && selected_search_params.page > 1) {
      selected_search_params.page -= 1;
    }
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

  /**
   * @param {string} value
   * 已选择学生搜索页数
   */
  function onSelectedSearchPageFunc(value) {
    const numericValue = parseFloat(value);
    if (isNaN(numericValue) || numericValue < 1 || numericValue === null) {
      selected_search_params.page = 1;
    } else {
      selected_search_params.page = numericValue;
    }
  }

  async function searchExaminee() {
    loading = true;
    error = '';

    // 构建查询参数
    let query_params = new URLSearchParams();

    // 添加基础参数
    query_params.append('page', search_params.page.toString());
    query_params.append('pageSize', search_params.pageSize.toString());

    // 添加可选参数
    if (search_params.name && search_params.name !== '') {
      query_params.append('officialName', search_params.name);
    }

    const response = await fetch(`/api/user?${query_params.toString()}`, {
      method: 'GET',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
      },
    })
      .then((response) => {
        if (response.status === 404) {
          toast.error('找不到页面');
          return;
        }
        return response.json();
      })
      .then((result) => {
        if (result.status != 0) {
          error = result.msg || '搜索失败';
          student_list = [];
          totals = 0;
          search_params.page = current_page;
          toast.error(error);
        } else {
          student_list = result.data === null ? [] : result.data;
          totals = result.rowCount;
          current_page = search_params.page;

          if (student_list !== null) {
            //更新选中状态
            let selected_id_set = new Set(selected_ids.map((item) => item.id));
            student_list.forEach((student) => {
              if (!selected_id_set.has(student.ID)) {
                student.selected = false;
              } else {
                student.selected = true;
              }
            });
          }

          is_all_selected = isAllSelected();
        }
        loading = false;
      })
      .catch((error) => {
        console.log(error);
        toast.error('获取学生列表失败');
      });
  }

  // 切换到选择模式
  function switchToSelectionMode() {
    is_selection_mode = true;
    search_params.page = 1;
    searchExaminee();
  }

  // 返回查看模式
  function backToViewMode() {
    is_selection_mode = false;
    // 重置已选择学生的分页参数
    selected_search_params.page = 1;
    selected_search_params.name = '';
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
        if (response.status === 404) {
          toast.error('获取学生列表失败');
          return;
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
        } else {
          selected_ids = result.data === null ? [] : result.data;
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

  // 切换全选状态
  function toggleSelectAll() {
    is_all_selected = !is_all_selected; // 切换全选状态
    student_list.forEach((/** @type {{ selected: boolean; }} */ student) => {
      student.selected = is_all_selected; // 更新所有行的选中状态
    });

    //根据全选状态调整已选择的数组
    if (is_all_selected) {
      student_list.forEach((student) => {
        const exists = selected_ids.find((item) => item.id === student.ID);
        if (!exists) {
          selected_ids.push({
            id: student.ID,
            official_name: student.OfficialName,
            gender: student.Gender,
            account: student.Account,
            phone: student.Phone,
            id_card_no: student.IDCardNo,
            serial_number: selected_ids.length + 1,
          });
        }
      });
    } else {
      student_list.forEach(
        /** @param {{ id: string }} student */
        (student) => {
          const index = selected_ids.findIndex((item) => item.id === student.ID);
          if (index !== -1) {
            selected_ids.splice(index, 1);
          }
        },
      );

      // 只在取消全选时检查是否需要重新计算序号
      recalculateSerialNumbers();
    }
    is_all_selected = isAllSelected();
  }

  //当打开面板时自动搜索学生列表
  $effect(() => {
    if (show_panel && initial_load) {
      initial_load = false;

      if (practice_id) {
        //每次打开时将外部选中的id赋值给当前面板记录的已选中的id 在搜索前执行是为了能正常显示每个列表项的选中效果
        selected_ids = [];

        /**
         * @type {number[]}
         */
        let search_ids = [];
        ids.forEach((element) => {
          search_ids.push(element.id);
        });

        // 获取已选学生的信息
        getStudentInfo(practice_id);

        // 初始化为查看模式，不自动搜索
        is_selection_mode = false;
      } else {
        //每次打开时将外部选中的id赋值给当前面板记录的已选中的id 在搜索前执行是为了能正常显示每个列表项的选中效果

        /**
         * @type {number[]}
         */
        let search_ids = [];
        ids.forEach((element) => {
          search_ids.push(element.id);
        });
        current_page_selected_ids = selected_ids;

        // 初始化为查看模式，不自动搜索
        is_selection_mode = false;
      }
    }
  });

  // 判断是否全选
  function isAllSelected() {
    if (student_list !== null) {
      return student_list.every((student) => student.selected);
    } else {
      return false;
    }
  }

  async function downloadTemplate() {
    const response = await fetch('/api/files/exam/d0a9rv6slh1c714h2fkg.xlsx', {
      method: 'GET',
    })
      .then((response) => {
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        return response.blob();
      })
      .then((blob) => {
        let filename = '考生导入模板.xlsx';

        // 创建下载链接
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();

        // 清理
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      })
      .catch((error) => {
        console.error('下载模板失败:', error);
        alert('下载模板失败，请稍后重试');
      });
  }
</script>

<div class={show_panel ? 'examinee-panel-container' : 'hide'}>
  <div class="examinee-panel">
    <div class="panel-header">
      <span class="panel-header-text">{is_selection_mode ? '选择学生' : '学生列表'}</span>
      <Button
        type="info"
        class="close-btn"
        onclick={() => {
          show_panel = false;
          search_params.page = 1;
          onCancel(false);
        }}
        plain>×</Button
      >
    </div>
    <div class="panel-body">
      {#if !is_selection_mode}
        <!-- 查看已选择模式 -->
        <div class="selected-examinees-container">
          <div class="action-container">
            <div class="examinee-search-container">
              <InputBox label={'搜索学生：'} placeholder={'请输姓名/手机号/身份证号'} onInput={onSelectedSearch}
              ></InputBox>
            </div>
            <div class="button-group">
              <Button onclick={switchToSelectionMode}>选择学生</Button>
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
                    <td>{student.official_name || '--'}</td>
                    <td>{student.gender || '--'}</td>
                    <td>{student.phone || '--'}</td>
                    <td>{student.id_card_no || '--'}</td>
                  </tr>
                {/each}
              </tbody>
            </table>
            {#if filtered_selected_ids.length === 0}
            <div  style="height: 200px; padding: 0;">
              <div class="empty-wrapper">
                <Empty text="暂无学生数据" />
              </div>
            </div>
            {/if}
          </div>
          <div class="pagination-container">
            <span style="font-size: 12px; margin-right:10px">
              已选 <span style="color: #00A870; margin:0 5px 0 5px;">{filtered_selected_ids.length}</span> 条
            </span>
            <Pagination
              totalItems={filtered_selected_ids.length}
              pageSize={selected_search_params.pageSize}
              currentPage={selected_search_params.page}
              on:pageChange={onSelectedPageChooseFunc}
              on:pageSizeChange={handle_page_size_change}
              
            ></Pagination>
          </div>
        </div>
      {:else}
        <!-- 选择模式 -->
        <div class="action-container">
          <div class="examinee-search-container">
            <InputBox
              label={'搜索学生'}
              placeholder={'请输姓名/手机号/身份证号'}
              bind:value={search_params.name}
              onInput={onSearch}
            ></InputBox>
          </div>
          <div class="button-group">
            <Button type="info" onclick={backToViewMode} plain>返回</Button>
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
                <th class="table-head" style="width: 30px;">
                  <input type="checkbox" class="custom-checkbox" onchange={toggleSelectAll} checked={is_all_selected} />
                </th>
                <th class="table-head">姓名</th>
                <th class="table-head">性别</th>
                <th class="table-head">手机号</th>
                <th class="table-head">身份证号</th>
              </tr>
            </thead>
            <tbody>
              {#each student_list as student, index}
                <tr class={`examinee ${student.selected ? 'selected' : ''}`}>
                  <td>
                    <input
                      type="checkbox"
                      class="custom-checkbox"
                      checked={student.selected}
                      onchange={/** @param {Event} event */
                      (event) => {
                        const target = /** @type {HTMLInputElement} */ (event.target);
                        if (target && target.checked) {
                          if (!selected_ids.find((g) => g.id === student.ID)) {
                            const currentMaxSerial = getMaxSerialNumber();
                            selected_ids.push({
                              id: student.ID,
                              official_name: student.OfficialName,
                              account: student.Account,
                              gender: student.Gender,
                              phone: student.MobilePhone,
                              id_card_no: student.IDCardNo,
                              serial_number: currentMaxSerial + 1,
                            });
                          }
                          student.selected = true;
                          is_all_selected = isAllSelected();
                        } else {
                          const index = selected_ids.findIndex((g) => g.id === student.ID);
                          if (index !== -1) {
                            selected_ids.splice(index, 1);
                          }
                          student.selected = false;
                          is_all_selected = isAllSelected();
                        }
                      }}
                    />
                  </td>
                  <td>{student.OfficialName === null || student.OfficialName === '' ? '--' : student.OfficialName}</td>
                  <td
                    >{student.Gender === null || student.Gender === ''
                      ? '--'
                      : student.Gender === 'F'
                        ? '女'
                        : '男'}</td
                  >
                  <td>{student.MobilePhone === null || student.MobilePhone === '' ? '--' : student.MobilePhone}</td>
                  <td>{student.IDCardNo === null || student.IDCardNo === '' ? '--' : student.IDCardNo}</td>
                </tr>
              {/each}
            </tbody>
          </table>
          {#if student_list.length === 0}
            <div  style="height: 200px; padding: 0;">
              <div class="empty-wrapper">
                <Empty text="暂无学生数据" />
              </div>
            </div>
          {/if}
        </div>
        <div class="pagination-container">
          <span style="font-size: 12px; margin-right:10px">
            已选 <span style="color: #00A870; margin:0 5px 0 5px;">{selected_ids.length}</span> 条
          </span>
          <Pagination
            totalItems={totals}
            pageSize={search_params.pageSize}
            currentPage={search_params.page}
            on:pageChange={onPageChooseFunc}
            on:pageSizeChange={handle_page_size_change}
          ></Pagination>
        </div>
      {/if}
    </div>
    <div class="panel-footer">
      <Button
        type="info"
        class="cancel-btn"
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
          onConfirm(selected_ids);
         
        }} >确定</Button
      >
    </div>
  </div>
</div>

<StudentImportPanel
  onImport={(/** @type {any[]} */ success_student, /** @type {boolean} */ has_error) => {
    if (success_student && success_student.length > 0) {
      // 过滤掉已存在的id
      const newStudents = success_student
        .filter((/** @type {any} */ student) => !selected_ids.some((item) => item.id === student))
        .map((/** @type {any} */ student, /** @type {number} */ index) => ({
          id: student,
          serial_number: selected_ids.length + index + 1,
        }));

      // 更新selected_ids
      selected_ids = [...selected_ids, ...newStudents];

      searchExaminee();

      // 检查是否需要重新计算序号
      recalculateSerialNumbers();
    }

    if (!has_error) {
      show_student_import_panel = false;
    }
  }}
  onCancel={() => {
    show_student_import_panel = false;
  }}
  bind:show={show_student_import_panel}
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
    z-index:1001;
    
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
