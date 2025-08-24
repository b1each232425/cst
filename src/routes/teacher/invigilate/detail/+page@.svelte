<!--
 * @Author: 林炜佳 wj2144632819@qq.com
 * @Date: 2025-08-23 13:28:11
 * @LastEditors: 林炜佳 wj2144632819@qq.com
 * @LastEditTime: 2025-08-23 23:55:07
 * @FilePath: \exam\src\routes\teacher\invigilate\+page.svelte
 * @Description: 教师端监考管理列表
 * @Copyright (c) 2025 by 广州近邻信息有限公司, All Rights Reserved. 
-->

<script>
  import { goto, invalidate } from '$app/navigation';
  import Title from '$lib/components/Title/Title.svelte';
  import Pagination from '$lib/components/Pagination/Pagination.svelte';
  import Select from '$lib/components/Select/Select.svelte';
  import Option from '$lib/components/Select/Option.svelte';
  import Empty from '$lib/components/Table/Empty.svelte';
  import '$lib/components/Button/index.scss';
  import '$lib/components/Input/index.scss';
  import { toast } from '$lib/components/Toast/Toast.js';
  import { onMount } from 'svelte';
  import { formatTimestamp } from '$lib/utils/time_utils';
  import { page as appPage } from '$app/state';
  import { debounce } from '$lib/utils/optimize';

  const MOCK_INFO = {
    examSessionName: '2025年春季期末考试',
    examSiteName: '广州天河分校',
    examRoomName: '101多媒体教室',
    examRoomCapacity: 120,
    startTime: new Date('2025-08-22 09:00:00').getTime(),
    endTime: new Date('2025-08-22 11:30:00').getTime(),
    status: '04',
    basicEval: '02',
    examineeNum: 120,
    absenteeNum: 8,
    cheaterNum: 2,
    abnormalExamineeNum: 2,
    extendedTimeNum: 2,
  };

  const MOCK_EXAMINEES = [
    {
      examineeID: 5001,
      examCard: '20250822001',
      identityID: '440101199001011234',
      name: '张三',
      status: '02',
      remark: '缺考',
    },
    {
      examineeID: 5002,
      examCard: '20250822002',
      identityID: '440101199002022345',
      name: '李四',
      status: '02',
      remark: '',
    },
    {
      examineeID: 5003,
      examCard: '20250822003',
      identityID: '440101199003033456',
      name: '王五',
      status: '06',
      remark: '正常参加考试',
    },
    {
      examineeID: 5004,
      examCard: '20250822004',
      identityID: '440101199004044567',
      name: '赵六',
      status: '06',
      remark: '提前交卷',
    },
    {
      examineeID: 5005,
      examCard: '20250822005',
      identityID: '440101199005055678',
      name: '钱七',
      status: '14',
      remark: '作弊嫌疑',
    },
    {
      examineeID: 5006,
      examCard: '20250822006',
      identityID: '440101199006066789',
      name: '孙八',
      status: '14',
      remark: '身体不适中途退场',
    },
    {
      examineeID: 5007,
      examCard: '20250822007',
      identityID: '440101199007077890',
      name: '周九',
      status: '02',
      remark: '缺考',
    },
    {
      examineeID: 5008,
      examCard: '20250822008',
      identityID: '440101199008088901',
      name: '吴十',
      status: '14',
      remark: '忘记带身份证',
    },
    {
      examineeID: 5009,
      examCard: '20250822009',
      identityID: '440101199009099012',
      name: '郑十一',
      status: '06',
      remark: '正常参加考试',
    },
    {
      examineeID: 5010,
      examCard: '20250822010',
      identityID: '440101199010101123',
      name: '王十二',
      status: '02',
      remark: '表现优秀',
    },
    {
      examineeID: 5011,
      examCard: '20250822011',
      identityID: '440101199011111234',
      name: '李十三',
      status: '06',
      remark: '交白卷',
    },
    {
      examineeID: 5012,
      examCard: '20250822012',
      identityID: '440101199012121345',
      name: '张十四',
      status: '14',
      remark: '设备故障重考',
    },
  ];

  // 场次状态映射
  const STATUS_MAP = {
    '02': '待开始',
    '04': '进行中',
    '06': '已结束',
    '08': '批改中',
    '10': '已批改',
    '12': '已提交',
  };

  // 考生状态
  const EXAMINEE_STATUE_MAP = {
    '02': '缺考',
    '06': '作弊',
    '14': '考试异常',
  };

  // 考场状态
  const EVAL_MAP = {
    '00': '良好',
    '02': '一般',
    '04': '较差',
  };

  let total_count = $state(0);
  let search_text = $state('');
  let exam_session_id = $state('');
  let exam_room_id = $state('');
  let exam_session_name = $state('');
  let status = $state('');
  let remark = $state('');
  let page = $state(1);
  let page_size = $state(10);

  let invigilation_info = $state({ ...MOCK_INFO });
  let examinee_list = $state([...MOCK_EXAMINEES]);

  let is_invigilating = $derived(invigilation_info?.status === '04');

  let selected_examinee_id_set = $state(new Set());

  function gotoInvigilationList() {
    history.back();
  }

  function getInvigilateDetail() {
    const q = JSON.stringify({
      orderBy: [{ Duration: 'DESC', Time: 'DESC' }],
      filter: {
        searchText: search_text,
      },
      data: {
        examSessionID: exam_session_id,
        examRoomID: exam_room_id,
      },
      page,
      pageSize: page_size,
    });

    fetch(`/api/invigilation?q=${q}`)
      .then((res) => {
        if (!res.ok)
          return res.text().then((error_text) => {
            throw new Error(`请求失败：${res.status} ${res.statusText}` + (error_text ? '-' + error_text : ''));
          });
        return res.json();
      })
      .then((res) => {
        if (!res.status) {
          invigilation_info = res.data?.info ?? {};
          examinee_list = res.data?.examinees ?? [];

          if (Object.prototype.toString.call(invigilation_info) !== '[object Object]') {
            invigilation_info = {};
            throw new Error('invigilation_info 数据类型错误');
          }

          if (!Array.isArray(examinee_list)) {
            examinee_list = [];
            throw new Error('examinee_list 数据类型错误');
          }
        } else throw new Error(res.msg ?? '获取监考信息失败');
      })
      .catch((err) => {
        toast.error(err.message);
        console.error(err);
      });
  }

  const debounceGetInvigilateDetail = debounce(getInvigilateDetail, 500);

  function handlePageChange(event) {
    page = event.detail;
    getInvigilateDetail();
  }

  function handlePageSizeChange(event) {
    page_size = event.detail;
  }

  // 更新监考信息
  function updateInfos(data, callback) {
    fetch(`/api/invigilation`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        examSessionID: exam_session_id,
        examRoomID: exam_room_id,
        ...data,
      }),
    })
      .then((res) => {
        if (!res.ok)
          return res.text().then((error_text) => {
            throw new Error(`请求失败：${res.status} ${res.statusText}` + (error_text ? '-' + error_text : ''));
          });
        return res.json();
      })
      .then((res) => {
        if (!res.status) {
          invigilation_info = res.data?.info ?? {};
          examinee_list = res.data?.examinees ?? [];

          if (Object.prototype.toString.call(invigilation_info) !== '[object Object]') {
            invigilation_info = {};
            throw new Error('invigilation_info 数据类型错误');
          }

          if (!Array.isArray(examinee_list)) {
            examinee_list = [];
            throw new Error('examinee_list 数据类型错误');
          }

          if (typeof callback === 'function') callback(); // 这里可以用于更新本地的数据
        } else throw new Error(res.msg ?? '获取监考信息失败');
      })
      .catch((err) => {
        toast.error(err.message);
        console.error(err);
      });
  }

  function updateBasicEval(basic_eval) {
    updateInfos({
      basicEval: basic_eval,
    });
  }

  function updateSingleExamineeStatus(examinee_id, status) {
    updateInfos({
      examineeIDs: [examinee_id],
      status,
    });
  }

  function updateSingleExamineeRemark(examinee_id, remark) {
    updateInfos({
      examineeIDs: [examinee_id],
      remark,
    });
  }

  const debounceUpdateSingleExamineeRemark = debounce(updateSingleExamineeRemark, 500);

  // 批量更新
  function batchUpdateExamineeStatus(status) {
    updateInfos(
      {
        status,
        examineeIDs: Array.from(selected_examinee_id_set),
      },
      () => {
        examinee_list.forEach((e) => {
          if (selected_examinee_id_set.has(e.examineeID)) e.status = status;
        });
      },
    );
  }

  function batchUpdateExamineeRemark() {
    updateInfos(
      {
        remark,
        examineeIDs: Array.from(selected_examinee_id_set),
      },
      () => {
        examinee_list.forEach((e) => {
          if (selected_examinee_id_set.has(e.examineeID)) e.remark = remark;
        });
      },
    );
  }

  const debounceBatchUpdateExamineeRemark = debounce(batchUpdateExamineeRemark, 1000);

  function toggleSelectAll() {
    if (selected_examinee_id_set.size === examinee_list.length) selected_examinee_id_set = new Set();
    else selected_examinee_id_set = new Set(examinee_list.map((e) => e.examineeID));
  }

  function toggleSelect(examinee_id) {
    // 创建新的 Set 以确保响应式更新
    const newSet = new Set(selected_examinee_id_set);

    if (newSet.has(examinee_id)) newSet.delete(examinee_id);
    else newSet.add(examinee_id);

    selected_examinee_id_set = newSet;
  }

  onMount(() => {
    exam_session_id = Number(appPage.url.searchParams.get('exam_session_id'));
    exam_room_id = Number(appPage.url.searchParams.get('exam_room_id'));

    getInvigilateDetail();
  });
</script>

<div class="detail">
  <!-- 顶部信息 -->
  <div class="header card">
    <button onclick={gotoInvigilationList}></button>
    <div class="info">
      <span class="exam-session-name">{invigilation_info.examSessionName}</span>
      <span class="number"
        ><img src="/invigilation/icons/group.svg" alt="" /><span class="data">{invigilation_info.examineeNum}</span
        >/{invigilation_info.examRoomCapacity}</span
      >
    </div>
    <div class="info">
      <span
        ><span class="label">时间：</span>{formatTimestamp(invigilation_info.startTime)} ~ {formatTimestamp(
          invigilation_info.endTime,
        )}</span
      ><span><span class="label">地点：</span>{invigilation_info.examSiteName}-{invigilation_info.examRoomName}</span>
      <span class="info-item"
        ><span class="circle"></span>
        <!-- TODO 默认值是什么 -->
        <span class:unknown={!STATUS_MAP[invigilation_info.status]}
          >{STATUS_MAP[invigilation_info.status] ?? '未知状态'}
        </span></span
      >
    </div>
  </div>

  <div class="content">
    <!-- 考试情况 -->
    <div class="left-content card">
      <Title title="考试情况" line={false} />
      <div class="total-info">
        <div class="info-item">
          <div class="label">考场情况：</div>
          {#if is_invigilating}
            <div class="data">
              <Select value={invigilation_info.basicEval} changeValue={updateBasicEval}>
                {#each Object.entries(EVAL_MAP) as [key, value]}
                  <Option value={key} label={value} />
                {/each}
              </Select>
            </div>
          {:else}
            <div class="data number" class:unknown={!EVAL_MAP[invigilation_info.basicEval]}>
              {EVAL_MAP[invigilation_info.basicEval] ?? '未知状态'}
            </div>
          {/if}
        </div>
        <div class="info-item">
          <div class="label">缺考人数：</div>
          <div class="data number">{invigilation_info.absenteeNum}</div>
        </div>
        <div class="info-item">
          <div class="label">作弊人数：</div>
          <div class="data number">{invigilation_info.cheaterNum}</div>
        </div>
        <div class="info-item">
          <div class="label">考试异常人数：</div>
          <div class="data number">{invigilation_info.abnormalExamineeNum}</div>
        </div>
        <div class="info-item">
          <div class="label">已延长时间人数：</div>
          <div class="data number">{invigilation_info.extendedTimeNum}</div>
        </div>
      </div>
    </div>

    <!-- 考生名单 -->
    <div class="right-content card">
      <Title title="考生名单" line={false} />
      <div class="body">
        <div class="options">
          <div class="search-input">
            <div class="label">搜索：</div>
            <input
              type="text"
              placeholder="准考证号、身份证号或姓名"
              bind:value={exam_session_name}
              class="input"
              oninput={debounceGetInvigilateDetail}
            />
          </div>
          {#if is_invigilating}
            <div class="select" data-testid="exam-status-select">
              <div class="label">批量标记：</div>
              <Select
                value={status}
                disabled={selected_examinee_id_set.size === 0}
                changeValue={(val) => batchUpdateExamineeStatus(val)}
              >
                <Option value="" label="无" />
                <Option value="02" label={EXAMINEE_STATUE_MAP['02']} />
                <Option value="06" label={EXAMINEE_STATUE_MAP['06']} />
                <Option value="14" label={EXAMINEE_STATUE_MAP['14']} />
              </Select>
            </div>
            <div class="batch-remark-input">
              <div class="label">批量备注：</div>
              <input
                type="text"
                placeholder="请输入对选中考生的备注"
                bind:value={remark}
                class="input"
                class:is-disabled={selected_examinee_id_set.size === 0}
                disabled={selected_examinee_id_set.size === 0}
                oninput={debounceBatchUpdateExamineeRemark}
              />
            </div>
            <button
              class="btn btn--info is_plain"
              class:is-disabled={selected_examinee_id_set.size === 0}
              onclick={() => (selected_examinee_id_set = new Set())}>取消选中</button
            >
            <div class="tip">当前已选中 <span class="data">{selected_examinee_id_set.size}</span> 人</div>
          {/if}
        </div>

        <!-- 考生列表 -->
        <div class="table">
          <table>
            <thead>
              <tr>
                {#if is_invigilating}
                  <!-- 全选框 -->
                  <th class="select">
                    <button class="square-container {{} ? 'checked' : ''}" onclick={toggleSelectAll}>
                      {#if selected_examinee_id_set.size === examinee_list.length}
                        <div class="check-square"></div>
                      {/if}
                    </button>
                  </th>
                {/if}
                <th>姓名</th>
                <th>身份证号</th>
                <th>准考证号</th>
                <th>异常标记</th>
                <th>备注</th>
              </tr>
            </thead>
            <tbody>
              {#each examinee_list as { examineeID, identityID, name, examCard, status, remark }}
                <tr>
                  {#if is_invigilating}
                    <td class="select">
                      <button
                        class="square-container {{ examineeID } ? 'checked' : ''}"
                        onclick={() => toggleSelect(examineeID)}
                      >
                        {#if selected_examinee_id_set.has(examineeID)}
                          <div class="check-square"></div>
                        {/if}
                      </button></td
                    >
                  {/if}
                  <td>{name}</td>
                  <td>{identityID}</td>
                  <td>{examCard}</td>
                  {#if is_invigilating}
                    <td>
                      <div class="select">
                        <Select value={status} changeValue={(val) => updateSingleExamineeStatus(examineeID, val)}>
                          <Option value="" label="无" />
                          <Option value="02" label={EXAMINEE_STATUE_MAP['02']} />
                          <Option value="06" label={EXAMINEE_STATUE_MAP['06']} />
                          <Option value="14" label={EXAMINEE_STATUE_MAP['14']} />
                        </Select>
                      </div></td
                    >
                  {:else}
                    <td class:unknown={!EXAMINEE_STATUE_MAP[status]}>{EXAMINEE_STATUE_MAP[status] ?? '未知状态'}</td>
                  {/if}
                  <td class="remark"
                    >{#if is_invigilating}
                      <div class="remark-input">
                        <input
                          type="text"
                          class="input"
                          value={remark}
                          oninput={(e) => debounceUpdateSingleExamineeRemark(examineeID, e.target.value)}
                        />
                      </div>
                    {:else}
                      {remark || '--'}
                    {/if}</td
                  >
                </tr>
              {/each}
            </tbody>
          </table>
          {#if examinee_list.length === 0}
            <div class="empty">
              <Empty text="暂无考生数据" />
            </div>
          {/if}
        </div>
      </div>

      <div class="pagination">
        <Pagination
          total_items={total_count}
          on:pageChange={handlePageChange}
          on:pageSizeChange={handlePageSizeChange}
        />
      </div>
    </div>
  </div>
</div>

<style lang="scss">
  .unknown {
    color: var(--red);
  }

  .detail {
    display: flex;
    flex-direction: column;
    justify-content: center;
    margin: auto;
    padding: 1rem;
    gap: 1rem;
    width: 95%;
    height: 95vh;

    .card {
      border: 1px solid #ccc;
      padding: 0rem 1rem;
      border-radius: 0.5rem;
    }

    .header {
      height: 18vh;
      margin-top: 0.5rem;
      position: relative;
      display: flex;
      flex-direction: column;
      justify-content: center;
      padding: 0 2rem;
      gap: 0.5rem;

      button {
        position: absolute;
        top: 0;
        left: 0;
        border: 0;
        background-color: lightgray;
        background-image: url('/invigilation/icons/rollback.svg');
        background-position: center;
        background-repeat: no-repeat;
        width: 2.2rem;
        height: 1.8rem;
        border-top-left-radius: 0.4rem; /* 左上角 */
        border-bottom-right-radius: 0.4rem; /* 右下角 */

        &:hover {
          cursor: pointer;
          background-color: #ccc;
          background-image: url('/invigilation/icons/rollback_hover.svg');
        }
      }

      .info {
        display: flex;
        justify-content: left;
        align-items: center;
        gap: 1rem;

        .exam-session-name {
          font-size: 1.5rem;
          font-weight: bold;
        }

        .number {
          display: flex;
          align-items: center;
          font-size: 1rem;
          color: rgba(0, 0, 0, 0.6);

          .data {
            color: black;
          }
        }

        .label {
          color: var(--gray);
        }

        .info-item {
          display: flex;
          justify-content: center;
          align-items: center;
          gap: 0.5rem;

          .circle {
            width: 0.5rem;
            height: 0.5rem;
            border-radius: 50%;
            background-color: var(--blue);
          }
        }
      }
    }

    .content {
      display: flex;
      height: 70vh;
      justify-content: space-between;
      gap: 1rem;

      .left-content {
        flex: 2;

        .total-info {
          display: flex;
          flex-direction: column;
          gap: 1rem;
          margin-top: 4rem;

          .info-item {
            display: flex;
            justify-content: center;
            align-items: center;
            gap: 1rem;

            .label {
              width: 8rem;
              text-align: right;
            }

            .data {
              width: 6rem;
              background-color: #f0f0f0;
              height: 2rem;
              border-radius: 2px;
              box-sizing: border-box;

              &.number {
                padding: 0 0.5rem;
                line-height: 2rem;
              }
            }
          }
        }
      }

      .right-content {
        flex: 7;
        position: relative;

        .body {
          height: 78%;

          .options {
            display: flex;
            flex-wrap: wrap;
            justify-content: left;
            align-items: center;
            gap: 1rem;

            .search-input,
            .batch-remark-input,
            .select {
              display: flex;
              align-items: center;
              z-index: 10001;
            }

            .label {
              white-space: nowrap;
              color: rgba(0, 0, 0, 0.6);
              font-size: 14px;
            }

            .select {
              width: 12rem;
            }

            .tip {
              .data {
                color: var(--blue);
              }
            }
          }

          .table {
            overflow-y: auto;
            scrollbar-width: thin;
            scrollbar-color: #ccc transparent;
            height: 51vh;

            table {
              width: 100%;
              border-collapse: collapse;

              thead {
                position: sticky;
                top: 0;
                font-size: 14px;
                color: var(--gray);
                background-color: white;
                z-index: 10000;
              }

              tr {
                height: 3.5rem;
                border-bottom: 1px rgb(221, 221, 221) solid;

                /* 复选框样式设计 */
                .square-container {
                  background-color: white;
                  display: flex;
                  justify-content: center;
                  align-items: center;
                  cursor: pointer;
                  border: 1px solid #919191;
                  border-radius: 3px;
                  margin: 0;
                  padding: 0;
                  width: 1rem;
                  height: 1rem;

                  /* 悬停效果 */
                  &:hover {
                    background-color: #e0e0e0;
                    border-color: #aaa;
                  }

                  /* 选中状态的复选框内部方块 */
                  .check-square {
                    width: 0.8rem;
                    height: 0.8rem;
                    background-color: #165dff;
                  }
                }

                th {
                  font-weight: lighter;
                  font-size: 0.9rem;
                  white-space: nowrap;
                }
              }

              tbody {
                tr {
                  color: #333333;

                  td {
                    font-size: 0.9rem;
                    text-align: center;
                    vertical-align: middle;
                    padding: 5px 0;
                    padding: 0.5rem 0;

                    .select {
                      width: 6rem;
                      margin: auto;
                      text-align: left;
                    }

                    &.remark {
                      width: 14rem;

                      .remark-input {
                        width: 80%;
                        margin: auto;
                      }
                    }
                  }
                }
              }
            }

            .empty {
              margin-top: 10vh;
            }
          }
        }

        .pagination {
          position: absolute;
          bottom: 0;
          right: 1rem;
        }
      }
    }
  }
</style>
