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
  import { toast } from '$lib/components/Toast/Toast';
  import { goto } from '$app/navigation';
  import { page } from '$app/state';

  // 模拟报名人员数据
  let person_list = $state([
    {
      id: 1,
      name: '张三',
      phone: '13800001111',
      email: 'zhangsan@example.com',
      gender: '男',
      idNumber: '440101200001010011',
      idType: '身份证',
      enrollTime: '2025-08-01 00:00:00',
      enrollMethod: '线上报名',
      examType: '理论',
      auditor: '李老师',
      status: '未审核',
    },
    {
      id: 2,
      name: '李四',
      phone: '13800002222',
      email: 'lisi@example.com',
      gender: '女',
      idNumber: '440101200002020022',
      idType: '护照',
      enrollTime: '2025-08-03 00:00:00',
      enrollMethod: '线下报名',
      examType: '实操',
      auditor: '王老师',
      status: '通过',
    },
    {
      id: 3,
      name: '王五',
      phone: '13800003333',
      email: 'wangwu@example.com',
      gender: '男',
      idNumber: '440101200003030033',
      idType: '身份证',
      enrollTime: '2025-08-05 00:00:00',
      enrollMethod: '线上报名',
      examType: '理论',
      auditor: '赵老师',
      status: '未通过',
    },
  ]);

  // 模拟批量导入数据
  let candidate_list = $state([
    {
      name: '张三',
      phone: '13800001111',
      email: 'zhangsan@example.com',
      gender: '男',
      id_card: '110101199001011234',
      id_type: '身份证',
      birth: '1990-01-01',
      address: '北京市朝阳区',
      error: '',
    },
    {
      name: '李四',
      phone: '13900002222',
      email: 'lisi@example.com',
      gender: '女',
      id_card: '110101199205051111',
      id_type: '身份证',
      birth: '1992-05-05',
      address: '上海市浦东新区',
      error: '',
    },
    {
      name: '王五',
      phone: '13900002222',
      email: 'lisi@example.com',
      gender: '女',
      id_card: '110101199205051112  ',
      id_type: '身份证',
      birth: '1992-05-05',
      address: '上海市浦东新区',
      error: '身份证号不合法',
    },
  ]);

  // 审核状态
  let audit_status = $state('全部');
  let audit_status_options = ['全部', '未审核', '通过', '未通过'];

  // 报名方式
  let register_way = $state('全部');
  let register_way_options = ['全部', '自报名', '人工导入'];

  // 是否展示迁移模板
  let is_show_move_panel = $state(false);

  // 是否展示批量导入人员面板
  let is_show_import_panel = $state(false);

  let file_input = $state(null); // 文件输入框

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

  // 文件上传处理
  function handleFileUpload(event) {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    const file = files[0];
    const ext = file.name.split('.').pop().toLowerCase();

    // 只允许 Excel
    if (ext !== 'xls' && ext !== 'xlsx') {
      alert('只支持 Excel 文件（.xls, .xlsx）');
      return;
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
  function handleSeePersonDetail(id) {
    const current_url_path = page.url.pathname;
    goto(`${current_url_path}/person-detail/${id}`);
  }

  // 关闭导入报考人员弹窗
  function closeImportPanel() {
    is_show_import_panel = false;
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
      return item && item.status === '未审核';
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
    current_reject_id = id;
    current_action = 'reject';
    is_show_reject_panel = true; // 直接弹输入框
  }

  // 批量不通过
  function handleBatchReject() {
    if (select_reject_id.length === 0) return;

    const validIds = select_reject_id.filter((id) => {
      const item = person_list.find((i) => i.id === id);
      return item && item.status === '未审核';
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
      person_list = person_list.map((item) =>
        item.id === current_reject_id ? { ...item, status: '未通过', rejectReason: reject_reason } : item,
      );
    } else {
      // 批量不通过
      person_list = person_list.map((item) =>
        select_reject_id.includes(item.id) ? { ...item, status: '未通过', rejectReason: reject_reason } : item,
      );
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
    select_revoke_approve_id = id;
    current_action = 'revoke_approve';
    messagebox_title = '确认撤销通过';
    messagebox_content = '撤销通过后，该名人员将被取消录用，确定要继续吗？';
    is_show_messagebox = true;
  }

  // 处理撤销不通过按钮点击事件
  function handleRevokeReject(id) {
    select_revoke_reject_id = id;
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
      person_list = person_list.map((item) =>
        select_approve_id.includes(item.id) ? { ...item, status: '通过' } : item,
      );
      select_reject_id = [];
      select_approve_id = [];
    }

    if (current_action === 'revoke_approve') {
      person_list = person_list.map((item) =>
        item.id === select_revoke_approve_id ? { ...item, status: '未审核' } : item,
      );
    }

    if (current_action === 'revoke_reject') {
      person_list = person_list.map((item) =>
        item.id === select_revoke_reject_id ? { ...item, status: '未审核' } : item,
      );
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
</script>

<div class="enroll-management">
  <Title title="报名列表" />

  <div class="table-action-container">
    <div class="search-and-add-button-container">
      <div class="search-bar">
        <div class="search-box">
          <InputBox label="查找人员" type="text" placeholder="请输入关键词" />
        </div>

        <div class="filter-box">
          <span class="filter-label">审核状态</span>
          <div class="dropdown-wrapper">
            <Select bind:value={audit_status} filterable>
              {#each audit_status_options as option}
                <Option value={option} label={option}></Option>
              {/each}
            </Select>
          </div>
        </div>

        <div class="filter-box">
          <span class="filter-label">报名方式</span>
          <div class="dropdown-wrapper">
            <Select bind:value={register_way} filterable>
              {#each register_way_options as option}
                <Option value={option} label={option}></Option>
              {/each}
            </Select>
          </div>
        </div>
      </div>

      <div>
        <button class="btn-import" onclick={handleImportPerson}>导入</button>
        <button class="btn-down-model">下载模板</button>
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
                checked={person_list.length === select_approve_id.length}
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
          {#if person_list.length > 0}
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
                <td>{item.name}</td>
                <td>{item.phone}</td>
                <td>{item.email}</td>
                <td>{item.gender}</td>
                <td>{item.idNumber}</td>
                <td>{item.idType}</td>
                <td>{item.enrollTime}</td>
                <td>{item.enrollMethod}</td>
                <td>{item.examType}</td>
                <td>{item.auditor}</td>
                <td>
                  <span
                    class="Status-tag {item.status === '通过'
                      ? 'published'
                      : item.status === '未审核'
                        ? 'unpublished'
                        : 'invalidated'}">{item.status}</span
                  >
                </td>
                <td>
                  {#if item.status === '未审核'}
                    <button class="op-btn" onclick={() => handleSeePersonDetail(item.id)}>查看详情</button>
                    <button class="via-btn" onclick={() => handleApprove(item.id)}>通过</button>
                    <button class="de-btn" onclick={() => openRejectPanel(item.id)}>不通过</button>
                  {:else if item.status === '通过'}
                    <button class="op-btn" onclick={() => handleSeePersonDetail(item.id)}>查看详情</button>
                    <button class="de-btn" onclick={() => handleRevokeApprove(item.id)}>撤销通过</button>
                  {:else if item.status === '未通过'}
                    <button class="op-btn" onclick={() => handleSeePersonDetail(item.id)}>查看详情</button>
                    <button class="de-btn" onclick={() => handleRevokeReject(item.id)}>撤销不通过</button>
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
      <Pagination total_items={200} />
    </div>
  </div>
</div>

<!-- 隐藏的文件选择框 -->
<input type="file" accept=".xls,.xlsx" bind:this={file_input} style="display:none" onchange={handleFileUpload} />

<PersonImportPanel {is_show_import_panel} {candidate_list} closePanel={closeImportPanel}></PersonImportPanel>

<PersonMovePanel {is_show_move_panel} closePanel={closeMovePanel}></PersonMovePanel>

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
    overflow: hidden;

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
        height: calc(87vh - 200px);
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
        position: fixed;
        bottom: 50px;
        right: 10px;
        z-index: 10;
        padding: 0 40px 0 0;
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
