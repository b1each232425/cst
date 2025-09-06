<script>
  import InputBox from '$lib/components/Input/InputBox.svelte';
  import DatePicker from '$lib/components/DatePicker/DatePicker.svelte';
  import Title from '$lib/components/Title/Title.svelte';
  import PracticeSelectPanel from '../../_components/PracticeSelectPanel.svelte';
  import AuditSelectPanel from '../../_components/AuditSelectPanel.svelte';
  import divisions from 'china-division/dist/pcas-code.json';
  import Select from '$lib/components/Select/Select.svelte';
  import Option from '$lib/components/Select/Option.svelte';
  import { page } from '$app/stores';
  import { formatDateTime } from '../../_utils/handleFileInput';
  import { goto } from '$app/navigation';
  import { onMount } from 'svelte';
  import { toast } from '$lib/components/Toast/Toast';

  let edit_enroll_id = $page.params.editEnrollId;

  const ASSEMBLY_TYPE_MAP = {
    '00': '经典巩固',
    '02': '随机组卷',
    '04': '智能刷题',
  };

  let plan_name = $state(''); // 计划名称
  let people_limit = $state('unlimited'); // 是否限制报名人数
  let limited_number = $state(''); // 限制多少人
  let subjects = $state({ theory: true, practice: true }); // 选择的科目
  let start_date = $state(null); // 报名开始时间
  let end_date = $state(null); // 报名结束时间
  let deadline = $state(null); // 审核截止时间
  let show_audit_panel = $state(false); // 是否展示选择审核员面板
  let audit_data = $state([]); // 审核员数据
  let audit_id_data = $state([]); // 审核员id数据
  let show_practice_panel = $state(false); // 是否展示选择练习面板
  let practice_initial_id = $state([]); // 选择的练习 id 数组
  let practice_data = $state([]); // 选择的练习数组
  let detail_exam_location = $state(''); // 考试详细地点

  let clear_audit_practice = $state(''); // 当审核员或者练习数组为空请求时需要发送对应action字段

  // 考试预定地点
  let exam_plan_location = $derived(() => {
    return `${province || ''} ${city || ''} ${district || ''} ${detail_exam_location}`.trim();
  });

  // 错误提示内容
  let errors = $state({
    plan_name: '',
    plan_period: '',
    audit_deadline: '',
    auditor: '',
    people_limit: '',
    subjects: '',
    practice: '',
    exam_plan_location: '',
  });

  // 添加报名计划请求数据
  let edit_enroll_req = $derived(() => {
    return {
      registration: {
        ID: edit_enroll_id,
        Name: plan_name,
        StartTime: toTimestamp(start_date),
        EndTime: toTimestamp(end_date),
        ReviewEndtime: toTimestamp(deadline),
        MaxNumber: people_limit === 'limited' ? Number(limited_number) : 0,
        Course: (function () {
          if (subjects.theory && subjects.practice) return '00';
          if (subjects.theory) return '02';
          if (subjects.practice) return '04';
          return '';
        })(),
        ExamPlanLocation: exam_plan_location(),
        ReviewerIds: audit_data ? audit_data.map((item) => item.ID || item.id) : [],
      },
      practice_ids: practice_initial_id,
    };
  });

  // 把时间转化成数字格式
  function toTimestamp(date) {
    return date ? Math.floor(new Date(date).getTime()) : null;
  }

  // 处理选择练习按钮点击事件
  function handlePracticeSelect() {
    show_practice_panel = true;
  }

  // 更新选择的试卷
  function updateTestSelection(e) {
    practice_data = Array.isArray(e.detail) ? e.detail : [];
  }

  // 处理选择审核人按钮点击事件
  function handleSelectAudit() {
    show_audit_panel = true;
  }

  // 更新选中的审核员
  function updateAuditSelection(e) {
    audit_data = Array.isArray(e.detail) ? e.detail : [];
  }

  // 处理开始日期变化
  function handleStartDateChange(event) {
    start_date = event.detail.date;
  }

  // 处理终止日期变化
  function handleEndDateChange(event) {
    end_date = event.detail.date;
  }

  // 处理截止日期变化
  function handleDeadlineChange(event) {
    deadline = event.detail.date;
  }

  // 编辑报名计划请求
  function editEnrollReq() {
    fetch('/api/registration', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ action: clear_audit_practice, data: edit_enroll_req() }),
    })
      .then((response) => {
        if (!response.ok) {
          throw new Error('网络错误');
        }
        return response.json();
      })
      .then((data) => {
        if (data.status !== 0) {
          toast.error('编辑失败，请重试');
        } else {
          goto('/teacher/enroll');
        }
      })
      .catch((e) => {
        console.log(e);
      });
  }

  // 检测练习、审核员数组是否为空
  function checkClearAction() {
    const reviewerEmpty = !practice_initial_id.length;
    const practiceEmpty = !audit_data.length;

    if (reviewerEmpty && practiceEmpty) {
      clear_audit_practice = 'clear';
    } else if (reviewerEmpty) {
      clear_audit_practice = 'clearr';
    } else if (practiceEmpty) {
      clear_audit_practice = 'clearp';
    } else {
      clear_audit_practice = ''; // 没有清空情况
    }
  }

  // 处理保存按钮点击事件
  async function handleSave() {
    // 校验
    errors.plan_name = plan_name.trim() === '' ? '计划名称不能为空' : '';
    errors.plan_period = start_date && end_date ? '' : '请选择计划报名时段';
    errors.audit_deadline = deadline ? '' : '请选择截止日期';
    errors.auditor = audit_data.length > 0 ? '' : '请选择审核员';
    errors.people_limit = people_limit === '' ? '请选择人数限制' : '';
    if (people_limit === 'limited' && !limited_number) {
      errors.people_limit = '请输入限制人数';
    }
    errors.exam_plan_location = exam_plan_location() ? '' : '请输入考试地点';
    errors.subjects = !subjects.theory && !subjects.practice ? '请至少选择一个考试科目' : '';
    errors.practice = practice_data.length > 0 ? '' : '请选择练习';

    // 校验通过后可以提交逻辑
    if (
      !errors.plan_name &&
      !errors.plan_period &&
      !errors.audit_deadline &&
      !errors.auditor &&
      !errors.people_limit &&
      !errors.exam_plan_location &&
      !errors.subjects &&
      !errors.practice
    ) {
      await checkClearAction();
      editEnrollReq();
    }
  }

  // 处理取消按钮点击事件
  function handleCancle() {
    goto('/teacher/enroll');
  }

  // ====== 处理地址选择 ======
  const AREA_DATA = divisions.map((p) => ({
    label: p.name,
    value: p.code,
    children:
      p.children?.map((c) => ({
        label: c.name,
        value: c.code,
        children:
          c.children?.map((a) => ({
            label: a.name,
            value: a.code,
          })) || [],
      })) || [],
  }));

  let province = $state('');
  let city = $state('');
  let district = $state('');

  let provinces = AREA_DATA;
  let cities = $state([]);
  let districts = $state([]);

  // 当选择省份时，更新城市
  $effect(() => {
    if (province) {
      const selectedProvince = provinces.find((p) => p.label === province);
      cities = selectedProvince ? selectedProvince.children : [];
      // city = '';
      // district = '';
      // districts = [];
    }
  });

  // 当选择城市时，更新区县
  $effect(() => {
    if (city) {
      const selectedCity = cities.find((c) => c.label === city);
      districts = selectedCity ? selectedCity.children : [];
      // district = '';
    }
  });

  // 查看报名计划信息
  function getEnrollPlanData() {
    fetch(`/api/registration?id=${edit_enroll_id}`, {
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
        if (res.status !== 0) {
          throw new Error(res.msg);
        }

        let register = res.data.register;
        let reviewers = res.data.reviewers;
        let practices = res.data.practices;

        // ====== 把后端数据填充到前端状态 ======
        plan_name = register.Name || '';
        people_limit = register.MaxNumber > 0 ? 'limited' : 'unlimited';
        limited_number = register.MaxNumber || '';

        // 科目：00 = 理论+实践, 02 = 理论, 04 = 实践
        subjects = {
          theory: register.Course === '00' || register.Course === '02',
          practice: register.Course === '00' || register.Course === '04',
        };

        // ====== 把时间戳转成 yyyy-mm-dd HH:MM:SS 字符串 ======
        start_date = register.StartTime ? formatDateTime(new Date(register.StartTime)) : null;
        end_date = register.EndTime ? formatDateTime(new Date(register.EndTime)) : null;
        deadline = register.ReviewEndTime ? formatDateTime(new Date(register.ReviewEndTime)) : null;

        // ====== 考试地点（省市区 + 详细地址） ======
        if (register.ExamPlanLocation) {
          const parts = register.ExamPlanLocation.split(' ');
          province = parts[0] || '';
          city = parts[1] || '';
          district = parts[2] || '';
        } else {
          province = '';
          city = '';
          district = '';
        }

        detail_exam_location = register.ExamPlanLocation ? register.ExamPlanLocation.split(' ').slice(3).join(' ') : '';

        // 审核员
        audit_data = Array.isArray(reviewers) ? reviewers : [];
        audit_id_data = audit_data.map((item) => item.id);

        // 练习
        practice_initial_id = Array.isArray(practices) ? practices.map((item) => item.ID) : [];

        practice_data = Array.isArray(practices)
          ? practices.map((item) => ({
              id: item.ID,
              name: item.Name,
              assembly_type: ASSEMBLY_TYPE_MAP[item.Type] || '未知类型',
            }))
          : [];
      })
      .catch((e) => {
        console.error('加载报名计划失败:', e);
      });
  }

  onMount(async () => {
    await getEnrollPlanData();
  });
</script>

<Title title="编辑报名计划"></Title>
<div class="create-plan">
  <!-- 计划名称 -->
  <div class="form-row">
    <div class="label required">计划名称：</div>
    <input class="input-box" type="text" bind:value={plan_name} placeholder="请输入计划名称" />
  </div>
  <div class="error-text">{errors.plan_name}</div>

  <!-- 计划报名时段 -->
  <div class="form-row">
    <div class="label required">计划报名时段：</div>
    <div class="date-picker">
      <DatePicker
        is_single_date_selection={false}
        is_time_selection={true}
        input_width={'350px'}
        initial_start_date={new Date(start_date)}
        initial_end_date={new Date(end_date)}
        on:start_date_selected={handleStartDateChange}
        on:end_date_selected={handleEndDateChange}
      ></DatePicker>
    </div>
  </div>
  <div class="error-text">{errors.plan_period}</div>

  <!-- 审核截止时间 -->
  <div class="form-row">
    <div class="label required">审核截止时间：</div>
    <div class="date-picker">
      <DatePicker
        is_time_selection={true}
        input_width={'350px'}
        initial_start_date={new Date(deadline)}
        on:start_date_selected={handleDeadlineChange}
      ></DatePicker>
    </div>
  </div>
  <div class="error-text">{errors.audit_deadline}</div>

  <!-- 审核截止时间 -->
  <div class="form-row">
    <div class="label required">考试地点：</div>
    <div class="address">
      <div class="address-setting">
        <!-- 省份 -->
        <div class="select-address-setting">
          <Select bind:value={province}>
            <Option value="" label="请选择省" />
            {#each provinces as p}
              <Option value={p.label} label={p.label} />
            {/each}
          </Select>
        </div>

        <div class="select-address-setting">
          <!-- 城市 -->
          <Select bind:value={city} disabled={!province}>
            <Option value="" label="请选择市" />
            {#each cities as c}
              <Option value={c.label} label={c.label} />
            {/each}
          </Select>
        </div>

        <div class="select-address-setting">
          <!-- 区县 -->
          <Select bind:value={district} disabled={!city}>
            <Option value="" label="请选择区" />
            {#each districts as d}
              <Option value={d.label} label={d.label} />
            {/each}
          </Select>
        </div>
      </div>

      <!-- 详细地址输入 -->
      <input
        bind:value={detail_exam_location}
        type="text"
        class="detail-address-input"
        placeholder="请输入详细地址（如街道、门牌号）"
      />
    </div>
  </div>
  <div class="error-text">{errors.exam_plan_location}</div>

  <!-- 审核员 -->
  <div class="form-row">
    <div class="label required">审核员：</div>
    <div class="input-wrapper">
      {#if audit_data.length === 0}
        <!-- 还未选择审核人 -->
        <div class="select-wrapper">
          <button class="btn" onclick={handleSelectAudit}>选择审核员</button>
        </div>
      {:else}
        <!-- 已选择审核人 -->
        <div class="selected-audit-display">
          <div class="audit-info-container">
            <div class="audit-info-row">
              <span class="audit-name" title={audit_data.map((a) => a.OfficialName).join('、')}>
                {audit_data.map((a) => a.OfficialName || a.official_name).join('、')}
              </span>
            </div>
          </div>
          <button class="btn change-audit-btn" onclick={handleSelectAudit}>更换审核员</button>
        </div>
      {/if}
    </div>
  </div>
  <div class="error-text">{errors.auditor}</div>

  <!-- 计划人数 -->
  <div class="form-row">
    <div class="label required">计划人数：</div>
    <div class="options">
      <label>
        <input type="radio" name="people_limit" bind:group={people_limit} value="unlimited" />
        不限人数
      </label>

      <label>
        <input type="radio" name="people_limit" bind:group={people_limit} value="limited" />
        限制人数
      </label>

      <input
        type="number"
        bind:value={limited_number}
        class="input-box-small {people_limit === 'limited' ? '' : 'hide'}"
        placeholder="请输入人数"
      />
    </div>
  </div>
  <div class="error-text">{errors.people_limit}</div>

  <!-- 考试科目 -->
  <div class="form-row">
    <div class="label required">考试科目：</div>
    <div class="options">
      <label><input type="checkbox" bind:checked={subjects.theory} /> 理论</label>
      <label><input type="checkbox" bind:checked={subjects.practice} /> 实践</label>
    </div>
  </div>
  <div class="error-text">{errors.subjects}</div>

  <!-- 练习配置 -->
  <div class="form-row">
    <div class="label required">练习：</div>
    <div class="input-wrapper">
      {#if practice_data.length === 0}
        <!-- 还未选择练习 -->
        <div class="select-wrapper">
          <button id="test-select" class="btn" onclick={handlePracticeSelect}>选择练习</button>
        </div>
      {:else}
        <!-- 已选择练习 -->
        <div class="selected-test-display">
          <div class="test-info-container">
            <div class="test-info-row">
              {#each practice_data as test, idx}
                <span class="test-type">{test.assembly_type} :</span>
                <span class="test-name" title={test.name}>{test.name}</span>
                {#if !(idx === practice_data.length - 1)}
                  、
                {/if}
              {/each}
            </div>
          </div>
          <button id="test-select" class="btn change-test-btn" onclick={handlePracticeSelect}>更换练习</button>
        </div>
      {/if}
    </div>
  </div>
  <div class="error-text">{errors.practice}</div>

  <!-- 底部按钮 -->
  <div class="form-actions">
    <button class="btn-cancel" onclick={handleCancle} data-testid="btn-cancel">取消</button>
    <button class="btn-save" onclick={handleSave}>保存</button>
  </div>
</div>

<!-- 试卷选择弹窗 -->
<PracticeSelectPanel
  bind:show={show_practice_panel}
  on:select-practice={updateTestSelection}
  bind:selected_test_id={practice_initial_id}
/>

<!-- 审核员选择弹窗 -->
<AuditSelectPanel bind:show={show_audit_panel} audit_id_list={audit_id_data} on:select-audit={updateAuditSelection} />

<style>
  .create-plan {
    width: 800px;
    margin: 10px auto;
    padding: 0px 24px 10px 24px;
    background: #fff;
    border-radius: 8px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
  }

  .form-row {
    display: flex;
    align-items: start;
    margin: 15px 0 6px 0;

    .selected-audit-display {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 12px;
      border-radius: 4px;
      margin-left: 8px;

      .audit-info-container {
        display: flex;
        flex-direction: column;
      }

      .audit-info-row {
        font-size: 14px;
        color: #333;
        background-color: #e7e5e5;
        border-radius: 6px;
        padding: 4px 8px;
      }

      .audit-name {
        font-weight: 500;
        color: #000;
      }

      .change-audit-btn {
        background-color: white;
        border: 1px solid #007bff;
        border-radius: 3px;
        color: #007bff;
        cursor: pointer;
        white-space: nowrap;
      }

      .change-audit-btn:hover {
        background-color: #007bff;
        color: #fff;
      }
    }

    .selected-test-display {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 12px;
      border-radius: 4px;

      .test-info-container {
        display: flex;
        flex-direction: column;

        .test-info-row {
          font-size: 14px;
          color: #333;
          background-color: #e7e5e5;
          border-radius: 6px;
          padding: 4px 8px;

          .test-type {
            font-weight: bold;
            margin-right: 4px;
            color: #007bff;
          }

          .test-name {
            font-weight: 500;
            color: #000;
          }
        }
      }

      .change-test-btn {
        background-color: white;
        border: 1px solid #007bff;
        border-radius: 3px;
        color: #007bff;
        cursor: pointer;
        white-space: nowrap;

        &:hover {
          background-color: #007bff;
          color: #fff;
        }
      }
    }

    .address {
      margin-left: 8px;

      .address-setting {
        display: flex;
        gap: 12px; /* 下拉框之间的间距 */
        margin-bottom: 8px;
      }

      .select-address-setting {
        width: 110px;
      }

      .detail-address-input {
        width: 100%;
        padding: 6px 10px;
        border: 1px solid #ddd;
        border-radius: 4px;
        box-sizing: border-box;
        outline: none;
      }

      .detail-address-input:focus {
        border-color: #409eff;
      }
    }
  }

  .label {
    width: 200px;
    text-align: right;
    margin-right: 12px;
    padding-bottom: 5px;
    font-size: 16px;
    flex-shrink: 0;
  }

  .required::before {
    content: '*';
    color: red;
    margin-right: 4px;
  }

  .input-box {
    padding: 6px;
    border: 1px solid #ccc;
    border-radius: 4px;
    min-width: 335px;
    outline: none;
    margin-left: 8px;
    font-size: 16px;
  }

  .input-box-small {
    width: 130px;
    height: 15px;
    padding: 6px;
    border: 1px solid #ccc;
    border-radius: 4px;
    outline: none;
    margin-left: 8px;
    font-size: 16px;
    visibility: visible;
  }

  .input-box-small.hide {
    visibility: hidden;
  }

  .input-box:focus,
  .input-box-small:focus {
    border-color: #007bff;
  }

  .options {
    display: flex;
    gap: 16px;
    padding-top: 2px;
    margin-left: 4px;

    label {
      cursor: pointer;
    }
  }

  .btn {
    padding: 6px 12px;
    border: 1px solid #007bff;
    background: #007bff;
    color: white;
    border-radius: 4px;
    cursor: pointer;
    margin-left: 8px;
  }

  .date-picker {
    height: 32px;
    display: flex;
    align-items: center;
    padding: 0 8px;
  }

  .form-actions {
    display: flex;
    justify-content: flex-start;
    margin-top: 20px;
    margin-left: 220px;
    gap: 200px;
  }

  .btn-cancel {
    padding: 6px 16px;
    background: white;
    color: black;
    border: 1px solid #ccc;
    border-radius: 4px;
    cursor: pointer;
  }

  .btn-save {
    padding: 6px 16px;
    background: #007bff;
    color: white;
    border: 1px solid #007bff;
    border-radius: 4px;
    cursor: pointer;
  }

  /* 错误提示统一样式 */
  .error-text {
    margin-left: 220px; /* 对齐输入框 */
    min-height: 18px; /* 占位避免抖动 */
    font-size: 13px;
    color: red;
  }
</style>
