<!-- /*
 * @Author: 李乐毅 
 * @Date: 2025-07-27 16:36:22 
 * @Last Modified by:   李乐毅 
 * @Last Modified time: 2025-07-27 16:36:22 
 */ -->
<script>
  import StudentSelectionPanel from './StudentSelectionPanel.svelte';
  import TestSelector from './TestSelector.svelte';
  import { onMount } from 'svelte';
  import InputBox from '$lib/components/Input/InputBox.svelte';
  import Button from '$lib/components/Button/Button.svelte';

  // 组件属性
  let {
    PracticeId = null,
    onSubmitFunc = (/** @type {Object} */ practiceData) => {},
    practiceData = null, // 添加练习数据属性，用于编辑功能
    onCancelFunc = () => {}, // 添加取消函数属性
  } = $props();

  /**
   * @property {number} id
   * @property {string} name
   */

  // 状态管理
  let practice_name = $state(''); // 练习名称
  let grading_method = $state('人工批改'); // 批改方式
  let allowed_attempts_type = $state('不限次数'); //可作答次数类型
  let allowed_attempts = $state(0); //限制的次数
  // 添加一个变量用于向TestSelector传递初始ID
  let testInitialId = $state(null);
  /** @type {Array<any>} */
  let paper_list = $state([]);
  // 错误状态
  let errors = $state({
    practice_name: '',
    students: '',
    test: '',
  });

  // 弹窗状态控制
  let show_student_modal = $state(false);
  let show_test_modal = $state(false);

  // 学生数据
  /** @type {Array<{id: number, name: string}>} */
  let selectedStudents = $state([]);
  let practice_type = $state('');
  // 试卷数据
  /** @type {null|{id: number, name: string, assembly_type: string, difficulty?: string, questionCount?: number, totalScore?: number,suggest_duration?:number}} */
  let selectedTestObj = $state(null);

  // 添加一个状态标识是否已经确认选择了试卷
  let testConfirmed = $state(false);

  // 组件挂载时，如果有practiceData，初始化表单值
  onMount(() => {
    console.log('practiceData:', practiceData);
    if (!practiceData || !practiceData.form) {
      return;
    }
    console.log('practiceData', practiceData);
    // 设置练习名称
    practice_name = practiceData.form.practice_name || '';

    // 设置批改方式
    if (practiceData.form.grading_method === '10') {
      grading_method = '人工批改';
    } else if (practiceData.form.grading_method === '00') {
      grading_method = '自动批改';
    }

    // 设置练习类型
    if (practiceData.form.type === '00') {
      practice_type = '自定义组卷（经典巩固）';
    } else if (practiceData.form.type === '02') {
      practice_type = '随机组卷（常练常新）';
    } else if (practiceData.form.type === '04') {
      practice_type = '智能刷题（智能提升）';
    }
     // 设置学生数据
     if (practiceData.form.students ) {
       selectedStudents.length = practiceData.form.students;
     }

    // 设置试卷数据
    if (practiceData.form.test) {
      selectedTestObj = {
        id: practiceData.form.test.id,
        name: practiceData.form.test.name || practiceData.data.paper_name || '',
        assembly_type: practice_type,
      };
      testConfirmed = true;
      // 设置initialTestId
      testInitialId = practiceData.form.test.id;
    }

    //可作答次数初始化
    if (practiceData.data.practice.AllowedAttempts) {
      console.log('限制次数');
      allowed_attempts_type = '限制次数';
      allowed_attempts = practiceData.data.practice.AllowedAttempts;
    } else {
      console.log('不限次数');
      allowed_attempts_type = '不限次数';
      allowed_attempts = 0;
    }

    console.log('practiceData', practiceData);
  });

  /**
   * 更新学生选择显示
   * @param {Array<{id: number, name: string, account?: string}>} students - 选中的学生数组
   */
  function updateStudentSelection(students) {
    // 将selectedStudents作为本地状态更新，而不是依赖绑定
    selectedStudents = students;
    if (selectedStudents.length > 0) {
      errors.students = '';
    }
  }

  // 打开学生选择弹窗
  function openStudentModal() {
    show_student_modal = true;
    errors.students = ''; // 清除错误
  }

  // 打开试卷选择弹窗
  async function openTestModal() {
    show_test_modal = true;
    // 构造查询参数
    const searchParams = new URLSearchParams({
      name: '',
      tags: '',
      page: '1',
      category: '02',
      pageSize: '10',
    });

    // 发送带参数的GET请求
    const response = await fetch(`/api/paper?${searchParams}`, {
      method: 'GET',
      credentials: 'include',
    }).then((response) => {
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        return response.json();
      })
      .then((result) => {
        console.log('获取试卷列表成功', result);
        const records = result.data;
        if (records) {
          paper_list = records.map((/** @type {any} */ item) => {
            // 处理时间格式
            let updateTimeObj = new Date(item.UpdateTime || item.CreateTime);
            let updateDate = updateTimeObj.toLocaleDateString('zh-CN').replace(/\//g, '-');
            let updateTime = updateTimeObj.toLocaleTimeString('zh-CN', {
              hour: '2-digit',
              minute: '2-digit',
            });

            // 创建日期只取年月日
            let createTimeObj = new Date(item.CreateTime || item.UpdateTime);
            let createDate = createTimeObj.toISOString().split('T')[0];

            // 找到对应ID的练习并更新
            return {
              ...item,
              assembly_type:
                item.AssemblyType === '00'
                  ? '自定义组卷（经典巩固）'
                  : item.AssemblyType === '02'
                    ? '随机组卷（随机组卷）'
                    : '智能刷题（智能提升）',
              level: item.Level === '00' ? '简单' : item.Level === '02' ? '中等' : '困难',
              // 添加格式化后的时间
              update_time: `${updateDate} ${updateTime}`,
              create_time: createDate,
              // 确保有tags属性
              tags: item.Tags || [],
            };
          });
        }
        console.log('获取试卷列表成功', result.data);
      })
      .catch((error) => {
        console.error('获取试卷列表失败', error);
        throw error;
      });

    errors.test = ''; // 清除错误
  }

  // 确认试卷选择
  function confirmTestSelection() {
    if (selectedTestObj) {
      testConfirmed = true;
    }
  }

  /**
   * 更新选择的试卷
   * @param {{id: number, name: string, assembly_type: string, difficulty?: string, questionCount?: number, totalScore?: number}} test - 选中的试卷对象
   */
  function updateTestSelection(test) {
    selectedTestObj = test;
    console.log('Selected Test:', selectedTestObj);
    if (selectedTestObj) {
      testConfirmed = true;
      errors.test = '';
    }
  }

  // 监听名称输入，清除错误
  function handleNameInput() {
    if (practice_name.trim()) {
      errors.practice_name = '';
    }
  }

  // 验证表单
  function validateForm() {
    let valid = true;

    if (!practice_name.trim()) {
      errors.practice_name = '请输入练习名称';
      valid = false;
    }

    if (!selectedTestObj) {
      errors.test = '请选择练习试卷';
      valid = false;
    }

    return valid;
  }

  /**
   * 将批改方式转换为API使用的代码
   * @param {string} grading_method - 批改方式
   * @returns {string} - API需要的批改方式代码
   */
  function mapGradingMethodToApi(grading_method) {
    // 使用对象键值查找的安全方式
    if (grading_method === '人工批改') return '10';
    if (grading_method === '自动批改') return '00';
    return '10'; // 默认值
  }

  /**
   * 将批改方式转换为API使用的代码
   * @param {string} allowed_attempts_type - 允许尝试次数类型
   * @returns {number} - API需要的批改方式代码
   */
  function mapAllowedAttemptsToApi(allowed_attempts_type) {
    // 使用对象键值查找的安全方式
    if (allowed_attempts_type === '不限次数') return 0;
    if (allowed_attempts_type === '限制次数') return allowed_attempts;
    return 0; // 默认值
  }

  // 提交表单
  function handleSubmit() {
    if (validateForm()) {
      // 准备提交数据
      const practiceData = {
        practice_name,
        grading_method: mapGradingMethodToApi(grading_method),
        student: selectedStudents.map(student => student.id),
        test: selectedTestObj,
        allowed_attempts: mapAllowedAttemptsToApi(allowed_attempts_type),
      };
      console.log('准备提交数据', practiceData);
      // 调用父组件传入的提交函数
      onSubmitFunc(practiceData);
    }
  }

  // 取消操作
  function handleCancel() {
    // 调用父组件传入的取消函数
    onCancelFunc();
  }
</script>

<div class="practice-form-container">
  <div class="practice-form">
    <div class="form-content">
      {#if !practiceData || (practiceData && practiceData.data.practice.Status === '00')}
        <div class="form-group">
          <div class="input-wrapper">
            <div class="form-input-container">
              <InputBox
                label="练习名称："
                request
                type="text"
                id="practice-name"
                placeholder="请输入练习名称"
                bind:value={practice_name}
                oninput={handleNameInput}
              />
            </div>
            <div class="error-message" class:hidden={!errors.practice_name}>
              {errors.practice_name || ' '}
            </div>
          </div>
        </div>
      {/if}
      {#if !practiceData || (practiceData && practiceData.data.practice.Status === '00')}
        <div class="form-group">
          <label for="test-select">
            <span class="required">*</span> <span class="filter-label">练习试卷：</span>
          </label>
          <div class="input-wrapper">
            {#if !testConfirmed}
            <div class="select-wrapper"> 
              <Button id="test-select"  onclick={openTestModal} plain>选择试卷</Button>
              </div>
            {:else}
              <div class="selected-test-display">
                <div class="test-info-container">
                  <div class="test-info-row">
                    <span class="test-type">
                      {selectedTestObj?.assembly_type || '自定义组卷'} :
                    </span>
                    <span class="test-name" title={selectedTestObj?.name}>{selectedTestObj?.name}</span>
                  </div>
                </div>
                <Button id="test-select"  onclick={openTestModal} plain>更换试卷</Button>
              </div>
            {/if}
            <div class="error-message" class:hidden={!errors.test}>
              {errors.test || ' '}
            </div>
          </div>
        </div>

        <div class="form-group">
          <label for="grading-method-auto">
            <span class="required">*</span> <span class="filter-label">批改方式：</span>
          </label>
          <div class="radio-group">
            <label class="radio-option">
              <input
                id="grading-method-ai"
                type="radio"
                name="grading-method"
                value="人工批改"
                checked={grading_method === '人工批改'}
                onchange={() => (grading_method = '人工批改')}
              />
              <span class="radio-text">人工批改</span>
            </label>
            <label class="radio-option">
              <input
                id="grading-method-auto"
                type="radio"
                name="grading-method"
                value="自动批改"
                checked={grading_method === '自动批改'}
                onchange={() => (grading_method = '自动批改')}
              />
              <span class="radio-text">AI批改</span>
            </label>
          </div>
        </div>

        <div class="form-group">
          <label for="allowed-attempts-not-limit">
            <span class="required">*</span> <span class="filter-label">可作答次数：</span>
          </label>
          <div class="radio-group">
            <label class="radio-option">
              <input
                id="allowed-attempts-not-limit"
                type="radio"
                name="allowed_attempts"
                value="不限次数"
                checked={allowed_attempts_type === '不限次数'}
                onchange={() => {
                  allowed_attempts_type = '不限次数';
                  allowed_attempts = 0;
                }}
              />
              <span class="radio-text">不限次数</span>
            </label>
            <label class="radio-option">
              <input
                id="allowed-attempts-limit"
                type="radio"
                name="allowed_attempts"
                value="不限次数"
                checked={allowed_attempts_type === '限制次数'}
                onchange={() => {
                  allowed_attempts_type = '限制次数';
                }}
              />
              <span class="radio-text">限制次数</span>
            </label>
          </div>
          <div class="attempts-input-container" class:disabled={allowed_attempts_type !== '限制次数'}>
            <input
              type="number"
              class="attempts-input"
              min="1"
              bind:value={allowed_attempts}
              disabled={allowed_attempts_type !== '限制次数'}
            />
            <span class="attempts-unit">次</span>
          </div>
        </div>
      {/if}
      <div class="form-group">
        <label for="student-select"> <span class="filter-label">参与学生：</span></label> 
        <div class="input-wrapper">
          <div class="class-selection-area">
            <div class="select-wrapper">
              <Button id="student-select" class="select-btn" onclick={openStudentModal} plain>选择学生</Button>
              {#if selectedStudents.length > 0}
                <span class="student-badge">{selectedStudents.length}</span>
              {/if}
            </div>
          </div>
          <div class="error-message" class:hidden={!errors.students}>
            {errors.students || ' '}
          </div>
        </div>
      </div>
    </div>

    <div class="form-footer">
      <Button type="info" plain size="large" onclick={handleCancel} round>取消</Button>
      <div class="button-spacer"></div>
      <Button size="large" onclick={handleSubmit} round>保存</Button>
    </div>
  </div>
</div>

<!-- 学生选择弹窗组件 -->
<StudentSelectionPanel
  show_panel={show_student_modal}
  practice_id={PracticeId}
  onConfirm={(selected) => {
    //确认后将选择的考生取出
    show_student_modal = false;
    selectedStudents = selected;
  }}
  onCancel={(/** @type {boolean} */ load_new_file) => {
    show_student_modal = false;
    if (load_new_file) {
      selectedStudents = [];
    }
  }}
  ids={selectedStudents}
></StudentSelectionPanel>

<!-- 试卷选择弹窗 -->
<TestSelector
  bind:show={show_test_modal}
  onTestSelectFunc={updateTestSelection}
  onConfirmFunc={confirmTestSelection}
  bind:selectedTestId={testInitialId}
  {paper_list}
/>

<style lang="scss">
  // 颜色变量
  $primary-color: #0336ff;
  $primary-hover: #0329e0;
  $text-color: #333;
  $error-color: #f56c6c;
  $light-bg: #f0f2f5;
  $border-color: #dcdfe6;
  $placeholder-color: #c0c4cc;
  $badge-color: $primary-color;
  $test-display-bg: #dcdcdc;

  // 尺寸变量
  $border-radius: 4px;
  $btn-height: 32px;
  $form-input-height: 32px;
  $select-btn-width: 100px;
  $badge-size: 20px;
  $form-spacing: 15px;
  $footer-btn-width: 140px;
  $footer-btn-height: 40px;

  // 容器样式
  .practice-form-container {
    display: flex;
    justify-content: center;
    padding: 20px;
   
  }

  .practice-form {
    width: 600px;
    background-color: white;
    padding: 10px;
    border-radius: $border-radius;
    border: none;

    .form-content {
      width: 100%;
    }
  }

  // 表单组样式
  .form-group {
    display: flex;
    margin-bottom: $form-spacing;
    align-items: flex-start;

    label {
      width: 100px;
      text-align: right;
      margin-right: $form-spacing;
      font-size: 14px;
      color: $text-color;
      padding-top: 6px;

      .required {
        color: red;
        font-size: 14px;
      }
      .filter-label{
         color: rgba(0, 0, 0, 0.6);
      font-size: 14px;
      width: 75px;
      white-space: nowrap;
      text-align: right;
      }
    }
  }

  // 输入包装器样式
  .input-wrapper {
    
    flex: 1; // 输入区域占剩余空间
    display: flex;
    align-items: center; // 内容垂直居中
    // 学生选择区域特殊处理，保持文本区域的overflow控制
    .form-input-container {
      margin-left: 10px;
      overflow: hidden;
      width: 80%;
    }

    .error-message {
      font-size: 12px;
      color: $error-color;
      margin-top: 4px;
      transition: opacity 0.3s;
      min-height: 18px;

      &.hidden {
        opacity: 0;
      }
    }
  }

  // 选择按钮样式
  .select-btn {
    width: $select-btn-width;
    height: $btn-height;
    border: 1px solid $primary-color;
    border-radius: 3px;
    background-color: white;
    color: $primary-color;
    font-size: 14px;
    cursor: pointer;
    text-align: center;

    &:hover {
      background-color: $primary-color;
      color: white;
    }
  }

  // 选择区域样式
  .class-selection-area {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 8px;
  }

  // 单选框组
  .radio-group {
    display: flex;

    .radio-option {
      display: flex;
      align-items: center;
      margin-right: 20px;
      margin-left: -10px;
      cursor: pointer;

      input[type='radio'] {
        margin-right: 8px;
        cursor: pointer;
        accent-color: $primary-color;
      }

      .radio-text {
        font-size: 14px;
        color: $text-color;
      }
    }
  }

  // 表单底部
  .form-footer {
    display: flex;
    justify-content: center;
    margin-top: 40px;
    .button-spacer {
      width: 100px; // 调整这个值来控制间距大小
    }
    button {
      width: $footer-btn-width;
      height: $footer-btn-height;
      border-radius: $border-radius;
      font-size: 14px;
      cursor: pointer;
      margin: 0 30px;
    }
  }

  // 学生选择相关样式
  .select-wrapper {
     margin-left: -6px;
    position: relative;
    display: inline-block;
  }

  .student-badge {
    position: absolute;
    top: -8px;
    right: -8px;
    background-color: $badge-color;
    color: white;
    border-radius: 50%;
    min-width: $badge-size;
    height: $badge-size;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 12px;
    font-weight: bold;
    padding: 0 4px;
    box-sizing: border-box;
  }

  // 试卷显示相关样式
  .selected-test-display {
    display: flex;
    align-items: center;
    gap: 10px;

    .change-test-btn {
      padding: 4px 8px;
      background-color: white;
      border: none;
      border-radius: 3px;
      color: $primary-color;
      cursor: pointer;
      white-space: nowrap;

      &:hover {
        color: $primary-color;
        border-color: $primary-color;
      }
    }
  }

  .test-info-container {
    display: flex;
    align-items: center;
    font-size: 14px;
    padding: 2px 16px;
    background-color: $test-display-bg;
    border-radius: 16px;
    border: 1px solid #ebeef5;
    max-width: 100%;
    overflow: hidden;

    .test-info-row {
      display: flex;
      align-items: center;
      gap: 2px;
      width: 100%;
      overflow: hidden;
    }

    .test-type {
      padding: 2px 0px;
      border-radius: 2px;
      display: inline-block;
      white-space: nowrap;
      color: $primary-color;
      flex-shrink: 0;
    }

    .test-name {
      font-size: 14px;
      color: $text-color;
      word-break: break-word;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      min-width: 0;
    }
  }
  // 尝试次数输入框样式
  .attempts-input-container {
    display: flex;
    align-items: center;
    margin-left: 10px;

    &.disabled {
      opacity: 0.5;
    }
  }

  .attempts-input {
    width: 60px;
    height: 32px;
    border: 1px solid $border-color;
    border-radius: $border-radius;
    padding: 0 8px;
    text-align: center;

    &:focus {
      border-color: $primary-color;
      outline: none;
    }

    &:disabled {
      background-color: #f5f5f5;
      cursor: not-allowed;
    }
  }

  .attempts-unit {
    margin-left: 5px;
    font-size: 14px;
  }
</style>
