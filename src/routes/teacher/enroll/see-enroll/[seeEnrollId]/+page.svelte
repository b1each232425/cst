<script>
  import Title from '$lib/components/Title/Title.svelte';
  import InputBox from '$lib/components/Input/InputBox.svelte';
  import Empty from '$lib/components/Table/Empty.svelte';
  import Pagination from '$lib/components/Pagination/Pagination.svelte';
  import Select from '$lib/components/Select/Select.svelte';
  import Option from '$lib/components/Select/Option.svelte';
  import PersonImportPanel from '../../_components/PersonImportPanel.svelte';
  import PersonMovePanel from '../../_components/PersonMovePanel.svelte';
  import { goto } from '$app/navigation';
  import { page } from '$app/state';

  // 模拟报名人员数据
  let personList = [
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
      auditStatus: '未审核',
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
      auditStatus: '通过',
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
      auditStatus: '未通过',
    },
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
      auditStatus: '未审核',
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
      auditStatus: '通过',
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
      auditStatus: '未通过',
    },
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
      auditStatus: '未审核',
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
      auditStatus: '通过',
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
      auditStatus: '未通过',
    },
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
      auditStatus: '未审核',
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
      auditStatus: '通过',
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
      auditStatus: '未通过',
    },
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
      auditStatus: '未审核',
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
      auditStatus: '通过',
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
      auditStatus: '未通过',
    },
  ];

  // 模拟批量导入数据
  let candidate_list = [
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
  ];

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
        <button class="btn-approve">批量通过</button>
        <button class="btn-reject">批量不通过</button>
      </div>
    </div>

    <div class="enroll-table">
      <table>
        <thead>
          <tr>
            <th style="width: 6%"><input type="checkbox" class="checkbox" /></th>
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
          {#if personList.length > 0}
            {#each personList as item}
              <tr>
                <td><input type="checkbox" class="checkbox" /></td>
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
                    class="Status-tag {item.auditStatus === '通过'
                      ? 'published'
                      : item.auditStatus === '未审核'
                        ? 'unpublished'
                        : 'invalidated'}">{item.auditStatus}</span
                  >
                </td>
                <td>
                  {#if item.auditStatus === '未审核'}
                    <button class="op-btn" onclick={handleSeePersonDetail(item.id)}>查看详情</button>
                    <button class="via-btn">通过</button>
                    <button class="de-btn">不通过</button>
                  {:else if item.auditStatus === '通过'}
                    <button class="op-btn">查看详情</button>
                  {:else if item.auditStatus === '未通过'}
                    <button class="op-btn">查看详情</button>
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
</style>
