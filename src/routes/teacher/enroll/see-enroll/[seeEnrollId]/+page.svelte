<script>
  import Title from '$lib/components/Title/Title.svelte';
  import InputBox from '$lib/components/Input/InputBox.svelte';
  import Empty from '$lib/components/Table/Empty.svelte';
  import Pagination from '$lib/components/Pagination/Pagination.svelte';
  import Select from '$lib/components/Select/Select.svelte';
  import Option from '$lib/components/Select/Option.svelte';
  import PersonImportPanel from '../../_components/PersonImportPanel.svelte';
  import PersonMovePanel from '../../_components/PersonMovePanel.svelte';
  import MessageBox from '$lib/components/MessageBox/MessageBox.svelte';
  import { page } from '$app/stores';
  import { checkFileData, formatDateTime } from '../../_utils/handleFileInput';
  import { toast } from '$lib/components/Toast/Toast';
  import { goto } from '$app/navigation';
  import { onMount } from 'svelte';

  // 考试类型映射
  const examTypeMap = {
    '00': '正考',
    '02': '补考',
  };

  // 审核状态映射
  const statusMap = {
    '00': '报名中',
    '02': '待审核',
    '04': '通过',
    '06': '不通过',
    '08': '已迁移',
  };

  // 审核状态下拉框选项
  let audit_status = $state(''); // 默认传空，表示全部
  let audit_status_options = [
    { value: '', label: '全部' },
    ...Object.entries(statusMap).map(([code, text]) => ({
      value: code,
      label: text,
    })),
  ];

  // 报名方式映射
  const REGISTER_WAY_MAP = {
    '00': '自报名',
    '02': '人工导入',
  };

  // 报名方式下拉框选项
  let register_way = $state(''); // 默认传空，表示全部
  let register_way_options = [
    { value: '', label: '全部' },
    ...Object.entries(REGISTER_WAY_MAP).map(([code, text]) => ({
      value: code,
      label: text,
    })),
  ];

  // 报名人员数据
  let person_list = $state([]);

  // 批量导入数据
  let candidate_list = $state([]);

  // 是否展示迁移模板
  let is_show_move_panel = $state(false);

  // 是否展示批量导入人员面板
  let is_show_import_panel = $state(false);

  let file_input = $state(null); // 文件输入框
  let input_value = $state(''); // 输入框双向绑定数值

  // 选中的待操作 id
  let select_approve_id = $state([]); // 待通过
  let select_reject_id = $state([]); // 待不通过
  let select_revoke_approve_id = $state([]); // 待撤销通过
  let select_revoke_reject_id = $state([]); // 待撤销不通过

  // 当前操作类型（approve | reject | revoke_approve | revoke_reject）
  let current_action = '';

  // 不通过原因填写框数据
  let is_show_reject_panel = $state(false); // 是否展示不通过填写信息弹窗
  let reject_reason = $state(''); // 不通过理由
  let current_reject_id = $state([]); // 当前不通过的数据id

  // 消息提示框数据
  let is_show_messagebox = $state(false);
  let messagebox_title = $state('');
  let messagebox_content = $state('');

  let person_import_panel = $state(null); // 导入报考人员DOM组件

  let total_items = $state(0); // 数据总数
  let current_page = $state(1); // 当前页数
  let page_size = $state(10); // 当前页面大小

  let status_text = $state('');
  let see_enroll_id = $page.params.seeEnrollId;

  // 查看单个报名计划考生
  function getEnrollPersonData(message = '', status = '', register_type = '') {
    const searchParams = new URLSearchParams({
      id: see_enroll_id,
      page: current_page,
      pageSize: page_size,
      message: message,
      status: status,
      register_type: register_type,
      search_type: '00',
    });

    fetch(`/api/registration?${searchParams}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    })
      .then((response) => {
        if (!response.ok) {
          throw new Error('网络错误');
        }
        return response.json();
      })
      .then((res) => {
        // 转换成表格需要的格式
        person_list = res.data.student.map((item) => ({
          id: item.student.ID,
          name: item.student.OfficialName,
          phone: item.student.MobilePhone,
          email: item.student.Email,
          gender: item.student.Gender,
          idNumber: item.student.IDCardNo,
          idType: item.student.IDCardType,
          enrollTime: formatDateTime(item.detail.RegisterTime), // 格式化时间
          enrollMethod: item.detail.Type === '02' ? '人工导入' : '自报名', // 报名方式
          examType: examTypeMap[item.detail.ExamType] || '正考', // 默认正考
          auditor: item.reviewer || '--',
          status: statusMap[item.detail.Status] || '未知',
        }));

        total_items = res.data.total;
      })
      .catch((e) => {
        console.log(e);
      });
  }

  // 批量通过或不通过学生审核以及撤销操作
  function handleApproveOrReject(ids, status) {
    const searchParams = new URLSearchParams({
      ids: ids,
      status: status,
      register_id: see_enroll_id,
      fail_reason: reject_reason,
    });

    fetch(`/api/registrationStudent?${searchParams}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
    })
      .then((response) => {
        if (!response.ok) {
          throw new Error('网络错误');
        }
        return response.json();
      })
      .then((res) => {
        getEnrollPersonData();
      })
      .catch((e) => {
        console.log(e);
      });
  }

  // 文件上传处理
  async function handleFileUpload(event) {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    const file = files[0];
    const ext = file.name.split('.').pop().toLowerCase();

    if (file) {
      let result = await checkFileData(file);

      if (result.error) {
        error = result.error;
        toast.error(error);
        return;
      }

      if (result.data.length <= 0) {
        return;
      }

      candidate_list = result.data;
      person_import_panel.initCandidates();
    }

    // 打开导入面板
    is_show_import_panel = true;

    // 重置文件，避免重复选择同一个文件时不触发
    file_input.value = null;
  }

  // 处理导入按钮点击事件
  function handleImportPerson() {
    if (file_input) {
      file_input.click();
    }
  }

  // 处理查看人员详情按钮点击事件
  function handleSeePersonDetail(item) {
    const current_url_path = $page.url.pathname;
    goto(`${current_url_path}/person-detail/${item.idNumber}`);
  }

  // 关闭导入报考人员弹窗
  function closeImportPanel() {
    is_show_import_panel = false;
    getEnrollPersonData();
  }

  // 处理批量移动按钮点击事件
  function handleMovePerson() {
    is_show_move_panel = true;
  }

  // 处理关闭批量移动按钮点击事件
  function closeMovePanel() {
    is_show_move_panel = false;
  }

  // ---------- 通过事件 ----------
  // 单个通过
  function handleApprove(id) {
    select_approve_id = [id];
    current_action = 'approve';
    messagebox_title = '确认通过';
    messagebox_content = '通过后，该名人员将被录用，确定要继续吗？';
    is_show_messagebox = true;
  }

  // 批量通过
  function handleBatchApprove() {
    if (select_approve_id.length === 0) return;

    const validIds = select_approve_id.filter((id) => {
      const item = person_list.find((i) => i.id === id);
      return item && item.status === '待审核';
    });

    if (validIds.length === 0) {
      messagebox_title = '无效操作';
      messagebox_content = '所选人员中没有符合通过条件的数据。';
      is_show_messagebox = true;
      return;
    }

    if (validIds.length !== select_approve_id.length) {
      messagebox_title = '部分选择无效';
      messagebox_content = `你选择的 ${select_approve_id.length} 条数据中，有 ${
        select_approve_id.length - validIds.length
      } 条不符合通过条件。\n是否继续通过合法的 ${validIds.length} 条？`;
    } else {
      messagebox_title = '确认通过';
      messagebox_content = `确定要通过选中的 ${validIds.length} 条数据吗？`;
    }

    select_approve_id = validIds;
    current_action = 'approve';
    is_show_messagebox = true;
  }

  // ---------- 不通过事件 ----------
  // 单个不通过
  function openRejectPanel(id) {
    select_reject_id = [id];
    current_reject_id = [id];
    current_action = 'reject';
    is_show_reject_panel = true; // 直接弹输入框
  }

  // 批量不通过
  function handleBatchReject() {
    if (select_reject_id.length === 0) return;

    const validIds = select_reject_id.filter((id) => {
      const item = person_list.find((i) => i.id === id);
      return item && item.status === '待审核';
    });

    if (validIds.length === 0) {
      messagebox_title = '无效操作';
      messagebox_content = '所选人员中没有符合不通过条件的数据。';
      is_show_messagebox = true;
      current_action = 'reject_invalid';
      return;
    }

    if (validIds.length !== select_reject_id.length) {
      messagebox_title = '部分选择无效';
      messagebox_content = `你选择的 ${select_reject_id.length} 条数据中，有 ${
        select_reject_id.length - validIds.length
      } 条不符合不通过条件。\n是否继续不通过合法的 ${validIds.length} 条？`;
      select_reject_id = validIds;
      current_action = 'reject';
      is_show_messagebox = true;
      return;
    }

    // 全部合法 → 直接弹理由输入框
    select_reject_id = validIds;
    current_reject_id = null; // 批量
    current_action = 'reject';
    is_show_reject_panel = true;
  }

  // 确认不通过
  function confirmReject() {
    if (!reject_reason.trim()) {
      toast.warning('请输入不通过理由');
      return;
    }

    if (current_reject_id) {
      // 单个不通过
      handleApproveOrReject(current_reject_id, '06');
    } else {
      // 批量不通过
      handleApproveOrReject(select_reject_id, '06');
    }

    // 清空选择
    select_approve_id = [];
    select_reject_id = [];

    closeRejectPanel();
  }

  // 关闭弹窗
  function closeRejectPanel() {
    is_show_reject_panel = false;
    current_reject_id = null;
    reject_reason = '';
  }

  // ---------- 撤销事件 ----------
  // 处理撤销通过按钮点击事件
  function handleRevokeApprove(id) {
    select_revoke_approve_id = [id];
    current_action = 'revoke_approve';
    messagebox_title = '确认撤销通过';
    messagebox_content = '撤销通过后，该名人员将被取消录用，确定要继续吗？';
    is_show_messagebox = true;
  }

  // 处理撤销不通过按钮点击事件
  function handleRevokeReject(id) {
    select_revoke_reject_id = [id];
    current_action = 'revoke_reject';
    messagebox_title = '确认撤销不通过';
    messagebox_content = '撤销不通过后，该名人员将被取消不通过状态，确定要继续吗？';
    is_show_messagebox = true;
  }

  // ---------- 全选/取消全选 ----------
  function handleSelectAll(e) {
    if (e.target.checked) {
      select_approve_id = person_list.map((item) => item.id);
      select_reject_id = person_list.map((item) => item.id);
    } else {
      select_approve_id = [];
      select_reject_id = [];
    }
  }

  function isChecked(id) {
    return select_approve_id.includes(id) || select_reject_id.includes(id);
  }

  // ---------- 确认/取消 ----------
  function handleMessageBoxConfirm() {
    if (current_action === 'reject') {
      // 如果是批量不通过，用户在 MessageBox 确认后再打开理由输入框
      is_show_messagebox = false;
      is_show_reject_panel = true;
      return;
    }

    if (current_action === 'approve' && select_approve_id.length > 0) {
      handleApproveOrReject(select_approve_id, '04');
      select_reject_id = [];
      select_approve_id = [];
    }

    if (current_action === 'revoke_approve') {
      handleApproveOrReject(select_revoke_approve_id, '02');
    }

    if (current_action === 'revoke_reject') {
      handleApproveOrReject(select_revoke_reject_id, '02');
    }

    current_action = '';
    is_show_messagebox = false;
  }

  function handleMessageBoxCancel() {
    select_approve_id = [];
    select_reject_id = [];
    current_action = '';
    messagebox_title = '';
    messagebox_content = '';
    is_show_messagebox = false;
  }

  // 父组件控制分页器的行为
  function handlePageChange(event) {
    current_page = event.detail;
  }

  function handlePageSizeChange(event) {
    page_size = event.detail;
  }

  // 下载模板按钮点击事件
  function handleDownModel() {
    const url = '/enroll/excel_data/导入考生模板1.xlsx';
    const a = document.createElement('a');
    a.href = url;
    a.download = '导入考生模板1.xlsx';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  }

  // 处理输入框回调事件
  function handleInput() {
    getEnrollPersonData(input_value);
  }

  // 处理审核状态变化
  function handleAuditStatusChange() {
    getEnrollPersonData(input_value, audit_status);
  }

  // 处理报名方式变化
  function handleRegisterWayChange() {
    getEnrollPersonData(input_value, audit_status, register_way);
  }

  onMount(() => {
    getEnrollPersonData();

    // 从 localStorage 读取
    const savedData = localStorage.getItem('enrollItemData');
    if (savedData) {
      const parsed = JSON.parse(savedData);
      status_text = parsed.statusText;
    }
  });
</script>

<div class="enroll-management">
  <Title title="报名列表" />

  <div class="table-action-container">
    <div class="search-and-add-button-container">
      <div class="search-bar">
        <div class="search-box">
          <InputBox
            bind:value={input_value}
            label="查找人员"
            type="text"
            placeholder="请输入关键词"
            onInput={handleInput}
          />
        </div>

        <div class="filter-box">
          <span class="filter-label">审核状态</span>
          <div class="dropdown-wrapper">
            <Select bind:value={audit_status} filterable changeValue={handleAuditStatusChange}>
              {#each audit_status_options as option}
                <Option value={option.value} label={option.label}></Option>
              {/each}
            </Select>
          </div>
        </div>

        <div class="filter-box">
          <span class="filter-label">报名方式</span>
          <div class="dropdown-wrapper">
            <Select bind:value={register_way} filterable changeValue={handleRegisterWayChange}>
              {#each register_way_options as option}
                <Option value={option.value} label={option.label}></Option>
              {/each}
            </Select>
          </div>
        </div>
      </div>

      <div>
        <button class="btn-import" onclick={handleImportPerson}>导入</button>
        <button class="btn-down-model" onclick={handleDownModel}>下载模板</button>
        <button class="btn-move" onclick={handleMovePerson}>批量移动</button>
        <button class="btn-approve" onclick={handleBatchApprove}>批量通过</button>
        <button class="btn-reject" onclick={handleBatchReject}>批量不通过</button>
      </div>
    </div>

    <div class="enroll-table">
      <table>
        <thead>
          <tr>
            <th style="width: 6%"
              ><input
                type="checkbox"
                class="checkbox"
                onchange={handleSelectAll}
                checked={person_list ? person_list.length === select_approve_id.length : false}
              /></th
            >
            <th style="width: 6%">姓名</th>
            <th style="width: 6%">电话</th>
            <th style="width: 6%">邮箱</th>
            <th style="width: 6%">性别</th>
            <th style="width: 6%">证件号</th>
            <th style="width: 6%">证件类型</th>
            <th style="width: 10%">报名时间</th>
            <th style="width: 6%">报名方式</th>
            <th style="width: 6%">考试类型</th>
            <th style="width: 6%">审核人</th>
            <th style="width: 10%">审核状态</th>
            <th style="width: 20%">操作</th>
          </tr>
        </thead>
        <tbody>
          {#if person_list}
            {#each person_list as item}
              <tr>
                <td
                  ><input
                    type="checkbox"
                    class="checkbox"
                    checked={isChecked(item.id)}
                    onchange={(e) => {
                      if (e.target.checked) {
                        // 勾选时两个数组都放
                        select_approve_id = [...new Set([...select_approve_id, item.id])];
                        select_reject_id = [...new Set([...select_reject_id, item.id])];
                      } else {
                        select_approve_id = select_approve_id.filter((id) => id !== item.id);
                        select_reject_id = select_reject_id.filter((id) => id !== item.id);
                      }
                    }}
                  /></td
                >
                <td>{item.name ? item.name : '--'}</td>
                <td>{item.phone ? item.phone : '--'}</td>
                <td>{item.email ? item.email : '--'}</td>
                <td>{item.gender ? item.gender : '--'}</td>
                <td>{item.idNumber ? item.idNumber : '--'}</td>
                <td>{item.idType ? item.idType : '--'}</td>
                <td>{item.enrollTime ? item.enrollTime : '--'}</td>
                <td>{item.enrollMethod ? item.enrollMethod : '--'}</td>
                <td>{item.examType ? item.examType : '--'}</td>
                <td>{item.auditor ? item.auditor : '--'}</td>
                <td>
                  <span
                    class="Status-tag {item.status === '通过'
                      ? 'published'
                      : item.status === '待审核'
                        ? 'unpublished'
                        : 'invalidated'}">{item.status}</span
                  >
                </td>
                <td>
                  {#if status_text === '已结束'}
                    <button class="op-btn" onclick={() => handleSeePersonDetail(item)}>查看详情</button>
                  {:else if item.status === '待审核'}
                    <button class="op-btn" onclick={() => handleSeePersonDetail(item)}>查看详情</button>
                    <button class="via-btn" data-testid="approve-btn" onclick={() => handleApprove(item.id)}
                      >通过</button
                    >
                    <button class="de-btn" data-testid="reject-btn" onclick={() => openRejectPanel(item.id)}
                      >不通过</button
                    >
                  {:else if item.status === '通过'}
                    <button class="op-btn" onclick={() => handleSeePersonDetail(item)}>查看详情</button>
                    <button class="de-btn" onclick={() => handleRevokeApprove(item.id)}>撤销通过</button>
                  {:else if item.status === '不通过'}
                    <button class="op-btn" onclick={() => handleSeePersonDetail(item)}>查看详情</button>
                    <button class="de-btn" onclick={() => handleRevokeReject(item.id)}>撤销不通过</button>
                  {:else}
                    <button class="op-btn" onclick={() => handleSeePersonDetail(item)}>查看详情</button>
                  {/if}
                </td>
              </tr>
            {/each}
          {:else}
            <tr>
              <td colspan="13">
                <div class="empty-wrapper">
                  <Empty text="暂无报名数据" />
                </div>
              </td>
            </tr>
          {/if}
        </tbody>
      </table>
    </div>

    <div class="pagination-container">
      <Pagination {total_items} on:pageChange={handlePageChange} on:pageSizeChange={handlePageSizeChange} />
    </div>
  </div>
</div>

<!-- 隐藏的文件选择框 -->
<input type="file" accept=".xls,.xlsx" bind:this={file_input} style="display:none" onchange={handleFileUpload} />

<PersonImportPanel
  bind:this={person_import_panel}
  enroll_id={see_enroll_id}
  {is_show_import_panel}
  {candidate_list}
  closePanel={closeImportPanel}
></PersonImportPanel>

<PersonMovePanel {person_list} {is_show_move_panel} from_enroll_id={see_enroll_id} closePanel={closeMovePanel}
></PersonMovePanel>

<!-- 消息提示框 -->
<MessageBox
  visible={is_show_messagebox}
  title={messagebox_title}
  content={messagebox_content}
  onConfirm={handleMessageBoxConfirm}
  onCancel={handleMessageBoxCancel}
></MessageBox>

<!-- 不通过理由弹窗 -->
{#if is_show_reject_panel}
  <div class="modal-overlay">
    <div class="modal">
      <h3 class="modal-title">请输入不通过理由</h3>
      <textarea bind:value={reject_reason} placeholder="请输入理由"></textarea>
      <div class="modal-actions">
        <button class="btn-cancel" onclick={closeRejectPanel}>取消</button>
        <button class="btn-confirm" onclick={confirmReject}>确认</button>
      </div>
    </div>
  </div>
{/if}

<style lang="scss">
  .enroll-management {
    background-color: #fff;
    height: 100%;
    overflow: auto;

    .table-action-container {
      display: flex;
      flex-direction: column;
      padding: 16px 5px 0px 5px;

      .search-and-add-button-container {
        display: flex;
        justify-content: space-between;

        .btn-import,
        .btn-down-model,
        .btn-move,
        .btn-approve,
        .btn-reject {
          border: none;
          border-radius: 4px;
          padding: 7px 18px;
          font-size: 12px;
          cursor: pointer;
          font-weight: 500;
          white-space: nowrap;
          height: 30px;
          transition: all 0.2s ease;
          box-shadow: 0 2px 6px rgba(0, 0, 0, 0.08);
          margin-top: 5px;
          margin-right: 1rem;
        }

        /* 导入 / 批量移动（蓝底白字） */
        .btn-import,
        .btn-down-model,
        .btn-move {
          background-color: #165dff;
          color: #fff;
        }
        .btn-import:hover,
        .btn-down-model:hover,
        .btn-move:hover {
          background-color: #0f49cc;
          transform: translateY(-1px);
        }

        /* 批量通过（绿底白字） */
        .btn-approve {
          background-color: #28a745;
          color: #fff;
        }
        .btn-approve:hover {
          background-color: #218838;
          transform: translateY(-1px);
        }

        /* 批量不通过（红底白字） */
        .btn-reject {
          background-color: #ff4d00;
          color: #fff;
        }
        .btn-reject:hover {
          background-color: #e60000;
          transform: translateY(-1px);
        }

        .search-bar {
          display: flex;
          flex-wrap: wrap;
          margin-bottom: 20px;
          align-items: center;
          gap: 16px;
        }

        .filter-box {
          display: flex;
          align-items: center;
          min-width: 225px;

          .filter-label {
            color: rgba(0, 0, 0, 0.6);
            font-size: 14px;
            width: 75px;
            text-align: right;
            margin-right: 8px; /* 增加文字与下拉框间距 */
          }

          .dropdown-wrapper {
            width: 120px;
            height: 32px;
            padding-top: 5px;
          }
        }
      }

      .enroll-table {
        margin-top: 20px;
        width: 100%;
        height: calc(85vh - 200px);
        overflow: auto;

        table {
          width: 100%;
          border-collapse: collapse;
          text-align: center;

          .checkbox {
            width: 16px;
            height: 16px;
            cursor: pointer;
            accent-color: #165dff;
          }

          thead {
            background-color: #fff;
            font-size: 14px;
            color: rgba(0, 0, 0, 0.3);
            position: sticky;
            top: 0;
            z-index: 1;
          }

          th,
          td {
            padding: 8px 8px;
            vertical-align: middle;
            font-size: 14px;
          }

          td {
            color: #222;
            border-bottom: 1px solid #e0e0e0;

            .Status-tag {
              display: inline-block;
              padding: 2px 8px;
              border-radius: 8px;
              font-size: 12px;

              &.published {
                background-color: #70b603;
                color: #ffffff;
              }

              &.unpublished {
                background-color: #689bff;
                color: #ffffff;
              }

              &.invalidated {
                background-color: #919191;
                color: #ffffff;
              }
            }

            .op-btn {
              all: unset;
              padding: 4px 8px;
              margin: 0 4px;
              border-radius: 4px;
              font-size: 12px;
              color: #165dff;
              cursor: pointer;
            }

            .de-btn {
              all: unset;
              padding: 4px 8px;
              margin: 0 4px;
              border-radius: 4px;
              font-size: 12px;
              color: #ff0000ff;
              cursor: pointer;
            }

            .via-btn {
              all: unset;
              padding: 4px 8px;
              margin: 0 4px;
              border-radius: 4px;
              font-size: 12px;
              color: #00b42a;
              cursor: pointer;
            }
          }
        }

        .empty-wrapper {
          display: flex;
          justify-content: center;
          align-items: center;
          height: 50vh;
        }
      }

      .pagination-container {
        display: flex;
        justify-content: flex-end;
        margin-top: 10px;
        padding: 0 10px 0 0;
      }
    }
  }

  .modal-overlay {
    position: fixed;
    inset: 0;
    background: rgba(0, 0, 0, 0.5);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 1999;

    .modal {
      background: #fff;
      border-radius: 8px;
      width: 420px;
      height: 300px;
      padding: 0px 20px 20px 20px;
      box-sizing: border-box;

      display: flex;
      flex-direction: column;
      justify-content: space-between;

      .modal-title {
        font-size: 16px;
        font-weight: 600;
        margin-bottom: 10px;
      }

      textarea {
        flex: 1;
        resize: none;
        width: 100%;
        height: 160px;
        padding: 8px;
        border: 1px solid #ccc;
        border-radius: 4px;
        font-size: 14px;
        line-height: 1.5;
        box-sizing: border-box;

        &:focus {
          outline: none;
          border-color: #ccc;
          box-shadow: none;
        }
      }

      .modal-actions {
        display: flex;
        justify-content: flex-end;
        gap: 10px;
        margin-top: 12px;

        .btn-confirm {
          background: #409eff;
          color: #fff;
          padding: 6px 16px;
          border: none;
          border-radius: 4px;
          cursor: pointer;

          &:hover {
            background: #66b1ff;
          }
        }

        .btn-cancel {
          background: #f2f2f2;
          color: #333;
          padding: 6px 16px;
          border: none;
          border-radius: 4px;
          cursor: pointer;

          &:hover {
            background: #e0e0e0;
          }
        }
      }
    }
  }
</style>
