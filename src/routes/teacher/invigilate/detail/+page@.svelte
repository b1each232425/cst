<!--
 * @Author: 林炜佳 wj2144632819@qq.com
 * @Date: 2025-08-23 13:28:11
 * @LastEditors: 林炜佳 wj2144632819@qq.com
 * @LastEditTime: 2025-08-23 23:55:07
 * @FilePath: \exam\src\routes\teacher\invigilate\detail\+page@.svelte
 * @Description: 教师端监考详情页
 * @Copyright (c) 2025 by 广州近邻信息有限公司, All Rights Reserved. 
-->

<script>
  import MessageBox from '$lib/components/MessageBox/MessageBox.js';
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
  // import Upload from '$lib/components/Upload/Upload.svelte';

  // TODO 监考员姓名

  // const MOCK_INFO = {
  //   ExamSessionName: '2025年春季期末考试',
  //   ExamSiteName: '广州天河分校',
  //   ExamRoomName: '101多媒体教室',
  //   ExamRoomCapacity: 120,
  //   StartTime: new Date('2025-08-22 09:00:00').getTime(),
  //   EndTime: new Date('2025-08-22 11:30:00').getTime(),
  //   Status: '04',
  //   ExamMode: '00',
  //   ExamType: '00',
  //   BasicEval: '02',
  //   Record:
  //     '考试过程记录：发卷时间（8:55）、考试正式开始（9:00）、考生提问记录（张某询问答题卡填涂规范/10:15、刘某申请更换草稿纸/10:40）、中途离场记录（赵某因身体不适/11:00离场/由监考陪同）、收卷开始时间（11:25）、收卷完成时间（11:35）、试卷份数核对（实收28份/无遗漏）',
  //   ExamineeNum: 120,
  //   InvigilatorNum: 1,
  //   AbsenteeNum: 8,
  //   CheaterNum: 2,
  //   AbnormalExamineeNum: 2,
  //   ExtendedTimeNum: 2,
  // };

  // const MOCK_EXAMINEES = [
  //   {
  //     ExamineeID: 5001,
  //     ExamCard: '20250822001',
  //     IDCardNo: '440101199001011234',
  //     Name: '张三',
  //     Status: '02',
  //     Remark: '缺考',
  //   },
  //   {
  //     ExamineeID: 5002,
  //     ExamCard: '20250822002',
  //     IDCardNo: '440101199002022345',
  //     Name: '李四',
  //     Status: '02',
  //     Remark: '',
  //   },
  //   {
  //     ExamineeID: 5003,
  //     ExamCard: '20250822003',
  //     IDCardNo: '440101199003033456',
  //     Name: '王五',
  //     Status: '06',
  //     Remark: '正常参加考试',
  //   },
  //   {
  //     ExamineeID: 5004,
  //     ExamCard: '20250822004',
  //     IDCardNo: '440101199004044567',
  //     Name: '赵六',
  //     Status: '06',
  //     Remark: '提前交卷',
  //   },
  //   {
  //     ExamineeID: 5005,
  //     ExamCard: '20250822005',
  //     IDCardNo: '440101199005055678',
  //     Name: '钱七',
  //     Status: '14',
  //     Remark: '作弊嫌疑',
  //   },
  //   {
  //     ExamineeID: 5006,
  //     ExamCard: '20250822006',
  //     IDCardNo: '440101199006066789',
  //     Name: '孙八',
  //     Status: '14',
  //     Remark: '身体不适中途退场',
  //   },
  //   {
  //     ExamineeID: 5007,
  //     ExamCard: '20250822007',
  //     IDCardNo: '440101199007077890',
  //     Name: '周九',
  //     Status: '02',
  //     Remark: '缺考',
  //   },
  //   {
  //     ExamineeID: 5008,
  //     ExamCard: '20250822008',
  //     IDCardNo: '440101199008088901',
  //     Name: '吴十',
  //     Status: '14',
  //     Remark: '忘记带身份证',
  //   },
  //   {
  //     ExamineeID: 5009,
  //     ExamCard: '20250822009',
  //     IDCardNo: '440101199009099012',
  //     Name: '郑十一',
  //     Status: '06',
  //     Remark: '正常参加考试',
  //   },
  //   {
  //     ExamineeID: 5010,
  //     ExamCard: '20250822010',
  //     IDCardNo: '440101199010101123',
  //     Name: '王十二',
  //     Status: '11',
  //     Remark: '表现优秀',
  //   },
  // ];

  // 场次状态映射
  const STATUS_MAP = {
    '02': '待开始',
    '04': '进行中',
    '06': '已结束',
    '08': '批改中',
    '10': '已批改',
    '12': '已提交',
  };

  // 考试模式
  const EXAM_MODE_MAP = {
    '00': '线上考试',
    '02': '线下考试',
  };

  // 考生状态
  const EXAMINEE_STATUE_MAP = {
    '02': '缺考',
    '06': '作弊',
    '14': '考试异常',
    '': '无',
  };

  // 考试类型
  const EXAM_TYPE_MAP = {
    '00': '平时考试',
    '02': '期末成绩考试',
    '04': '资格证考试',
  };

  // 考场状态
  const EVAL_MAP = {
    '00': '良好',
    '02': '一般',
    '04': '较差',
  };

  let select = null;

  let search_text = $state('');
  let exam_session_id = $state('');
  let exam_room_id = $state('');
  let status = $state('');
  let remark = $state('');
  let page = $state(1);
  let page_size = $state(10);

  let invigilation_info = $state({});
  let examinee_list = $state([]);
  let can_update = $state(false); // 考试结束后是否可以更新
  let total_count = $state(0);

  // 临时数据
  // 目的：更改数据后，需要点击保存才会真正的更改，取消则需要回到原来的状态
  let temp_exam_session_basic_eval = $state('');
  let temp_exam_session_record = $state('');

  // 考试情况是否有所变化
  let is_changed = $derived(
    invigilation_info?.BasicEval !== temp_exam_session_basic_eval ||
      invigilation_info?.Record !== temp_exam_session_record,
  );

  // 是否允许更新
  let allow_updating = $derived(invigilation_info?.Status === '04' || can_update);

  let selected_examinee_id_set = $state(new Set());

  function goBack() {
    history.back();
  }

  function initTempData() {
    temp_exam_session_basic_eval = invigilation_info?.BasicEval;
    temp_exam_session_record = invigilation_info?.Record;
  }

  function showErrorDialog(content) {
    MessageBox({
      type: 'danger',
      title: '出错啦',
      content,
      show_cancel_button: false,
      on_close_by_click_outside: false,
      confirm_button_type: 'danger',
      onConfirm: () => goBack(),
      onCancel: () => goBack(),
    });
  }

  // 获取监考详情信息
  function getInvigilateDetail() {
    const q = JSON.stringify({
      Filter: {
        SearchText: search_text,
      },
      Data: {
        ExamSessionID: exam_session_id,
        ExamRoomID: exam_room_id,
      },
      Page: page,
      PageSize: page_size,
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
          total_count = res.rowCount ?? 0;
          can_update = res.data?.canUpdate ?? false;

          // 初始化临时数据
          initTempData();

          if (Object.prototype.toString.call(invigilation_info) !== '[object Object]') {
            invigilation_info = {};
            throw new Error('invigilation_info 数据类型错误');
          }

          if (Object.keys(invigilation_info).length === 0) throw new Error('监考信息为空');

          if (!Array.isArray(examinee_list)) {
            examinee_list = [];
            throw new Error('examinee_list 数据类型错误');
          }
        } else throw new Error(res.msg ?? '获取监考信息失败');
      })
      .catch((err) => {
        showErrorDialog(err.message);
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
  function updateInfos(update_type, data, callback) {
    const q = JSON.stringify({
      Data: {
        ExamSessionID: exam_session_id,
        ExamRoomID: exam_room_id,
        UpdateType: update_type,
        ...data,
      },
    });

    fetch(`/api/invigilation?q=${q}`, { method: 'PATCH' })
      .then((res) => {
        if (!res.ok)
          return res.text().then((error_text) => {
            throw new Error(`请求失败：${res.status} ${res.statusText}` + (error_text ? '-' + error_text : ''));
          });
        return res.json();
      })
      .then((res) => {
        if (!res.status) {
          if (typeof callback === 'function') callback(); // 这里可以用于更新本地的数据
        } else throw new Error(res.msg ?? '更新监考信息失败');
      })
      .catch((err) => {
        toast.error(err.message);
        console.error(err);
      });
  }

  // 更新考试情况
  function updateExamSessionStatus() {
    updateInfos('00', {
      Record: temp_exam_session_record,
      BasicEval: temp_exam_session_basic_eval,
    });
  }

  // 取消对考试情况的修改
  function cancelUpdateExamSessionStatus() {
    temp_exam_session_record = invigilation_info?.Record;
    temp_exam_session_basic_eval = invigilation_info?.BasicEval;
  }

  // 更新一个学生的状态
  function updateSingleExamineeStatus(examinee_id, status, old_status) {
    if (status === old_status || (status === '' && old_status === '00') || (status === '' && old_status === '10'))
      return;

    MessageBox({
      title: '确认操作',
      content: '你确定要该考生的异常状态标记为“' + EXAMINEE_STATUE_MAP[status] + '”吗？',
      on_close_by_click_outside: false,
      onConfirm: () =>
        updateInfos('02', {
          Examinees: [examinee_id],
          ExamineeStatus: status,
        }),
      onCancel: () => {
        // 回滚
        select?.setValue(old_status === '00' || old_status === '10' ? '' : old_status);
      },
    });
  }

  // 更新一个学生的备注
  function updateSingleExamineeRemark(examinee_id, remark) {
    updateInfos('04', {
      Examinees: [examinee_id],
      ExamineeRemark: remark,
    });
  }

  const debounceUpdateSingleExamineeRemark = debounce(updateSingleExamineeRemark, 500);

  // 批量更新学生的状态
  function batchUpdateExamineeStatus(new_status) {
    MessageBox({
      title: '确认操作',
      content: '你确定要批量标记为“' + EXAMINEE_STATUE_MAP[new_status] + '”吗？',
      on_close_by_click_outside: false,
      onConfirm: () =>
        updateInfos(
          '02',
          {
            ExamineeStatus: new_status,
            Examinees: Array.from(selected_examinee_id_set),
          },
          () => {
            examinee_list.forEach((e) => {
              if (selected_examinee_id_set.has(e.ExamineeID)) e.Status = new_status;
            });
          },
        ),
      onCancel: () => {
        // 回滚
        status = '';
      },
    });
  }

  // 批量更新学生的备注
  function batchUpdateExamineeRemark() {
    updateInfos(
      '04',
      {
        ExamineeRemark: remark,
        Examinees: Array.from(selected_examinee_id_set),
      },
      () => {
        examinee_list.forEach((e) => {
          if (selected_examinee_id_set.has(e.ExamineeID)) e.Remark = remark;
        });
      },
    );
  }

  const debounceBatchUpdateExamineeRemark = debounce(batchUpdateExamineeRemark, 1000);

  // 处理全选框
  function toggleSelectAll() {
    if (selected_examinee_id_set.size === examinee_list.length) selected_examinee_id_set = new Set();
    else selected_examinee_id_set = new Set(examinee_list.map((e) => e.ExamineeID));
  }

  // 处理单个选框
  function toggleSelectSingle(examinee_id) {
    // 创建新的 Set 以确保响应式更新
    const newSet = new Set(selected_examinee_id_set);

    if (newSet.has(examinee_id)) newSet.delete(examinee_id);
    else newSet.add(examinee_id);

    selected_examinee_id_set = newSet;
  }

  onMount(() => {
    const exam_session_id_str = appPage.url.searchParams.get('exam_session_id');
    const exam_room_id_str = appPage.url.searchParams.get('exam_room_id');

    if (!exam_session_id_str || !exam_room_id_str) {
      showErrorDialog('路径参数错误');
      return;
    }

    exam_session_id = Number(exam_session_id_str);
    exam_room_id = Number(exam_room_id_str);

    if (!Number.isFinite(exam_session_id) || !Number.isFinite(exam_room_id)) {
      showErrorDialog('路径参数错误');
      return;
    }

    getInvigilateDetail();
  });
</script>

<div class="detail">
  <!-- 顶部信息 -->
  <div class="header card">
    <button onclick={goBack}></button>
    <div class="info">
      <span class="exam-session-name">{invigilation_info.ExamSessionName}</span>
      <span class="number"
        ><img src="/invigilation/icons/group.svg" alt="" /><span class="data">{invigilation_info.ExamineeNum}</span
        >/{invigilation_info.ExamRoomCapacity}</span
      >
    </div>
    <div class="info">
      <span
        ><span class="label">时间：</span>{formatTimestamp(invigilation_info.StartTime)} ~ {formatTimestamp(
          invigilation_info.EndTime,
        )}</span
      ><span><span class="label">地点：</span>{invigilation_info.ExamSiteName}-{invigilation_info.ExamRoomName}</span
      ><span
        ><span class="label">类型：</span><span class:unknown={!EXAM_TYPE_MAP[invigilation_info.ExamType]}
          >{EXAM_TYPE_MAP[invigilation_info.ExamType] ?? '未知状态'}</span
        ></span
      ><span
        ><span class="label">模式：</span><span class:unknown={!EXAM_MODE_MAP[invigilation_info.ExamMode]}
          >{EXAM_MODE_MAP[invigilation_info.ExamMode] ?? '未知状态'}</span
        ></span
      >
      <span class="info-item"
        ><span class="circle"></span>
        <span class:unknown={!STATUS_MAP[invigilation_info.Status]}
          >{STATUS_MAP[invigilation_info.Status] ?? '未知状态'}
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
          {#if allow_updating}
            <div class="data" data-testid="basic-eval-select">
              <Select bind:value={temp_exam_session_basic_eval}>
                {#each Object.entries(EVAL_MAP) as [key, value]}
                  <Option value={key} label={value} />
                {/each}
              </Select>
            </div>
          {:else}
            <div class="data number" class:unknown={!EVAL_MAP[invigilation_info.BasicEval]}>
              {EVAL_MAP[invigilation_info.BasicEval] ?? '未知状态'}
            </div>
          {/if}
        </div>
        <div class="info-item">
          <div class="label">监考员人数：</div>
          <div class="data number">{invigilation_info.InvigilatorNum}</div>
        </div>
        <div class="info-item">
          <div class="label">缺考人数：</div>
          <div class="data number">{invigilation_info.AbsenteeNum}</div>
        </div>
        <div class="info-item">
          <div class="label">作弊人数：</div>
          <div class="data number">{invigilation_info.CheaterNum}</div>
        </div>
        <div class="info-item">
          <div class="label">考试异常人数：</div>
          <div class="data number">{invigilation_info.AbnormalExamineeNum}</div>
        </div>
        <!-- <div class="info-item">
          <div class="label">已延长时间人数：</div>
          <div class="data number">{invigilation_info.ExtendedTimeNum}</div>
        </div> -->
        <div class="info-item record">
          <div class="label">考场记录：</div>
          {#if allow_updating}
            <textarea
              type="text "
              class="data record"
              placeholder="请输入考场记录..."
              bind:value={temp_exam_session_record}
            ></textarea>
          {:else}
            <div class="data number record" data-testid="record">
              {invigilation_info.Record === null || invigilation_info.Record === '' ? '无' : invigilation_info.Record}
            </div>
          {/if}
        </div>
        <!-- <div class="info-item">
          <Upload accept="image/*"><a href="javascript:void(0);">证明图片上传</a></Upload>
        </div> -->
      </div>
      {#if allow_updating && is_changed}
        <div class="options">
          <button class="btn btn--info is-plain" onclick={cancelUpdateExamSessionStatus}>取消</button>
          <button class="btn btn--primary" onclick={updateExamSessionStatus}>保存</button>
        </div>
      {/if}
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
              placeholder="姓名、身份证号或准考证号"
              bind:value={search_text}
              class="input"
              oninput={debounceGetInvigilateDetail}
            />
          </div>
          {#if allow_updating}
            <div class="select" data-testid="batch-select">
              <div class="label">批量标记：</div>
              <Select
                bind:value={status}
                disabled={selected_examinee_id_set.size === 0}
                changeValue={(val) => batchUpdateExamineeStatus(val)}
              >
                {#each Object.entries(EXAMINEE_STATUE_MAP) as [key, value]}
                  <Option value={key} label={value} />
                {/each}
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
            <div class="tip" data-testid="selected-count-tip">
              已选中 <span class="data">{selected_examinee_id_set.size}</span> 人
            </div>
          {/if}
        </div>

        <!-- 考生列表 -->
        <div class="table">
          <table>
            <thead>
              <tr>
                {#if allow_updating}
                  <!-- 全选框 -->
                  <th class="select">
                    <button class="square-container" onclick={toggleSelectAll} data-testid="select-all">
                      {#if examinee_list.length > 0 && selected_examinee_id_set.size === examinee_list.length}
                        <div class="check-square" data-testid="check-square"></div>
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
            <tbody data-testid="examinee-tbody">
              {#each examinee_list as { ExamineeID, IDCardNo, Name, ExamCard, Status, Remark } (ExamineeID)}
                <tr>
                  {#if allow_updating}
                    <!-- 单选框 -->
                    <td class="select">
                      <button
                        class="square-container"
                        onclick={() => toggleSelectSingle(ExamineeID)}
                        data-testid="select-single"
                      >
                        {#if selected_examinee_id_set.has(ExamineeID)}
                          <div class="check-square" data-testid="check-square"></div>
                        {/if}
                      </button></td
                    >
                  {/if}
                  <td>{Name}</td>
                  <td>{IDCardNo}</td>
                  <td>{ExamCard}</td>
                  {#if allow_updating}
                    <td>
                      <div class="select" data-testid="single-select">
                        <Select
                          bind:this={select}
                          value={Status}
                          changeValue={(val, old) => updateSingleExamineeStatus(ExamineeID, val, old)}
                          placeholder="无"
                        >
                          {#each Object.entries(EXAMINEE_STATUE_MAP) as [key, value]}
                            <Option value={key} label={value} />
                          {/each}
                        </Select>
                      </div></td
                    >
                  {:else}
                    <td
                      data-testid="single-select"
                      class="status"
                      class:absent={Status === '02'}
                      class:cheat={Status === '06'}
                      class:abnormal={Status === '14'}
                      class:unknown={Status !== '00' && Status !== '10' && !EXAMINEE_STATUE_MAP[Status]}
                      >{EXAMINEE_STATUE_MAP[Status] ?? (Status !== '00' && Status !== '10' ? '未知状态' : '无')}
                    </td>
                  {/if}
                  <td class="remark"
                    >{#if allow_updating}
                      <div class="remark-input">
                        <input
                          type="text"
                          class="input"
                          placeholder="暂无备注"
                          value={Remark}
                          oninput={(e) => debounceUpdateSingleExamineeRemark(ExamineeID, e.target.value)}
                        />
                      </div>
                    {:else}
                      {Remark || '--'}
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
  @mixin scrollbar {
    overflow-y: auto;
    scrollbar-width: thin;
    scrollbar-color: #ccc transparent;
  }

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
        color: transparent;

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
      height: 75vh;
      justify-content: space-between;
      gap: 1rem;

      .left-content {
        flex: 3;

        .total-info {
          display: flex;
          flex-direction: column;
          gap: 1rem;
          height: 52vh;
          @include scrollbar;

          .info-item {
            display: flex;
            justify-content: center;
            align-items: center;
            gap: 1rem;

            &.record {
              align-items: flex-start;
            }

            .label {
              width: 8rem;
              text-align: right;
            }

            .data {
              width: 10rem;
              background-color: #f0f0f0;
              height: 2rem;
              border-radius: 2px;
              box-sizing: border-box;

              &.number {
                padding: 0 0.5rem;
                line-height: 2rem;
              }

              &.record {
                height: 16vh;
                @include scrollbar;
              }
            }

            textarea {
              border-color: white;
              resize: none;
              font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
              border-radius: 2px;
              padding: 0.5rem;
            }

            textarea:focus {
              border-color: #409eff;
              outline: none;
              box-shadow: 0 0 0 2px rgba(64, 158, 255, 0.2); /* 可选的聚焦高亮效果 */
            }
          }
        }

        .options {
          // height: 2rem;
          margin: 1rem 0 0 0;
          display: flex;
          gap: 1rem;
          justify-content: center;
          align-items: center;
          position: sticky;
          bottom: 0;
        }
      }

      .right-content {
        flex: 8;
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
              z-index: 1002;
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
                z-index: 1001;
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

                    &.status {
                      &.absent {
                        color: #8a9ba8; /* 灰色表示缺考 */
                      }
                      &.cheat {
                        color: var(--red); /* 红色表示作弊 */
                      }
                      &.abnormal {
                        color: #ffc107; /* 黄色表示异常 */
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
