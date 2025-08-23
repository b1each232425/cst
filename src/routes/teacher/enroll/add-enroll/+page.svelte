<script>
  import InputBox from '$lib/components/Input/InputBox.svelte';
  import DatePicker from '$lib/components/DatePicker/DatePicker.svelte';
  import Title from '$lib/components/Title/Title.svelte';
  import { goto } from '$app/navigation';

  let plan_name = $state('');
  let people_limit = $state('unlimited');
  let limited_number = $state('');
  let subjects = $state({ theory: false, practice: false });
  let start_date = $state(null);
  let end_date = $state(null);
  let deadline = $state(null);

  // 错误提示内容
  let errors = $state({
    plan_name: '',
    plan_period: '',
    audit_deadline: '',
    auditor: '',
    people_limit: '',
    subjects: '',
  });

  // 处理保存按钮点击事件
  function handleSave() {
    // 简单的校验示例
    errors.plan_name = plan_name.trim() === '' ? '计划名称不能为空' : '';
    errors.plan_period = start_date && end_date ? '' : '请选择计划报名时段'; // 假设 DatePicker 内部还要传值，这里仅占位
    errors.audit_deadline = deadline ? '' : '请选择截止日期'; // 同上
    errors.auditor = ''; // 假设后续实现选择审核人
    errors.people_limit = people_limit === '' ? '请选择人数限制' : '';
    if (people_limit === 'limited' && !limited_number) {
      errors.people_limit = '请输入限制人数';
    }
    errors.subjects = !subjects.theory && !subjects.practice ? '请至少选择一个考试科目' : '';

    // 校验通过后可以提交逻辑
    if (
      !errors.plan_name &&
      !errors.plan_period &&
      !errors.audit_deadline &&
      !errors.auditor &&
      !errors.people_limit &&
      !errors.subjects
    ) {
      alert('校验通过，提交成功！');
    }
  }

  // 处理取消按钮点击事件
  function handleCancle() {
    goto('/teacher/enroll');
  }

  // 处理开始日期变化
  function handleStartDateChange(event) {
    start_date = event.detail.date;
    console.log(start_date);
  }

  // 处理终止日期变化
  function handleEndDateChange(event) {
    end_date = event.detail.date;
    console.log(end_date);
  }

  // 处理截止日期变化
  function handleDeadlineChange(event) {
    deadline = event.detail.date;
    console.log(deadline);
  }
</script>

<Title title="创建报名计划"></Title>
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
      <DatePicker is_time_selection={true} input_width={'350px'} on:start_date_selected={handleDeadlineChange}
      ></DatePicker>
    </div>
  </div>
  <div class="error-text">{errors.audit_deadline}</div>

  <!-- 审核人 -->
  <div class="form-row">
    <div class="label required">审核人：</div>
    <button class="btn">选择审核人</button>
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

  <!-- 练习 -->
  <div class="form-row">
    <div class="label">练习：</div>
    <button class="btn">选择练习</button>
  </div>

  <!-- 底部按钮 -->
  <div class="form-actions">
    <button class="btn-cancel" onclick={handleCancle}>取消</button>
    <button class="btn-save" onclick={handleSave}>保存</button>
  </div>
</div>

<style>
  .create-plan {
    width: 800px;
    margin: 10px auto;
    padding: 24px;
    background: #fff;
    border-radius: 8px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
  }
  .form-row {
    display: flex;
    align-items: center;
    margin: 20px 0 6px 0;
  }
  .label {
    width: 200px;
    text-align: right;
    margin-right: 12px;
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
    align-items: center;
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
    margin-top: 30px;
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
