<script>
  import Title from '$lib/components/Title/Title.svelte';
  import { formatDateTime } from '../../../../_utils/handleFileInput';
  import { onMount } from 'svelte';

  // 考试类型映射
  const examTypeMap = {
    '00': '正考',
    '02': '补考',
  };

  // 报名方式映射
  const REGISTER_WAY_MAP = {
    '00': '自报名',
    '02': '人工导入',
  };

  // 审核状态映射
  const statusMap = {
    '00': '报名中',
    '02': '待审核',
    '04': '通过',
    '06': '不通过',
    '08': '已迁移',
  };

  let { data } = $props();

  let person_detail = $state({}); // 基础用户信息
  let person_enroll_info = $state({}); // 用户报名信息

  let course_text = $state('');

  // 获取用户基础信息
  function getUserInro() {
    // 请求获取我的角色信息
    fetch(`/api/user?page=1&pageSize=10&fuzzyCondition=${data.idCardNo}`, {
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
      .then((data) => {
        person_detail = data.data[0];
      })
      .catch((e) => {
        console.log(e);
      });
  }

  // 获取用户报名信息
  function getUserEnrollInfo() {
    fetch(`/api/registration?page=1&pageSize=10&message=${data.idCardNo}&id=${data.enrollId}`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
    })
      .then((response) => {
        if (!response.ok) {
          throw new Error('网络错误');
        }
        return response.json();
      })
      .then((res) => {
        let raw = res.data.student[0];

        // 转换字段
        person_enroll_info = {
          ...raw,
          detail: {
            ...raw.detail,
            Type: REGISTER_WAY_MAP[raw.detail.Type] || raw.detail.Type,
            ExamType: examTypeMap[raw.detail.ExamType] || raw.detail.ExamType,
            RegisterTime: raw.detail.RegisterTime ? formatDateTime(new Date(raw.detail.RegisterTime)) : null,
            Status: statusMap[raw.detail.Status] || raw.detail.Status,
          },
        };
      })
      .catch((e) => {
        console.log(e);
      });
  }

  onMount(() => {
    getUserInro();
    getUserEnrollInfo();

    // 从 localStorage 读取
    const savedData = localStorage.getItem('enrollItemData');
    if (savedData) {
      const parsed = JSON.parse(savedData);
      course_text = parsed.courseText;
    }
  });
</script>

<div class="student-detail-container">
  <!-- 报名信息部分 -->
  <div class="section-container">
    <Title title="报名信息" />
    <div class="info-container">
      <!-- 第一行 -->
      <div class="info-row">
        <div class="info-item">
          <span class="label">姓名：</span>{person_detail.OfficialName ? person_detail.OfficialName : '暂无'}
        </div>
        <div class="info-item">
          <span class="label">证件类型：</span>{person_detail.IDCardType ? person_detail.IDCardType : '暂无'}
        </div>
        <div class="info-item">
          <span class="label">身份证号：</span>{person_detail.IDCardNo ? person_detail.IDCardNo : '暂无'}
        </div>
      </div>

      <!-- 第二行 -->
      <div class="info-row">
        <div class="info-item">
          <span class="label">出生日期：</span>{person_detail.Birthday ? person_detail.Birthday : '暂无'}
        </div>
        <div class="info-item">
          <span class="label">电话：</span>{person_detail.MobilePhone ? person_detail.MobilePhone : '暂无'}
        </div>
        <div class="info-item">
          <span class="label">邮箱：</span>{person_detail.Email ? person_detail.Email : '暂无'}
        </div>
      </div>

      <!-- 第三行（报名方式挪到这里） -->
      <div class="info-row">
        <div class="info-item"><span class="label">住址：</span>{person_detail.Addr ? person_detail.Addr : '暂无'}</div>
        <div class="info-item">
          <span class="label">性别：</span>{person_detail.Gender ? person_detail.Gender : '暂无'}
        </div>
        <div class="info-item">
          <span class="label">报名方式：</span>{person_enroll_info.detail?.Type
            ? person_enroll_info.detail.Type
            : '暂无'}
        </div>
      </div>

      <!-- 第四行 -->
      <div class="info-row">
        <div class="info-item">
          <span class="label">考试科目：</span>{course_text ? course_text : '暂无'}
        </div>
        <div class="info-item">
          <span class="label">考试类型：</span>{person_enroll_info.detail?.ExamType
            ? person_enroll_info.detail.ExamType
            : '暂无'}
        </div>
        <div class="info-item">
          <span class="label">报名时间：</span>{person_enroll_info.detail?.RegisterTime
            ? person_enroll_info.detail.RegisterTime
            : '暂无'}
        </div>
      </div>

      <!-- 第五行 -->
      <div class="info-row idcard-row">
        <div class="info-item idcard-item">
          <span class="label">身份证人像面：</span>
          <div class="idcard-image">
            <img src={person_detail.idCardFront} alt="身份证人像面" />
          </div>
        </div>
        <div class="info-item idcard-item">
          <span class="label">身份证国徽面：</span>
          <div class="idcard-image">
            <img src={person_detail.idCardBack} alt="身份证国徽面" />
          </div>
        </div>
      </div>
    </div>
  </div>

  <!-- 审核信息部分 -->
  <div class="section-container">
    <Title title="审核信息" />
    <div class="info-container">
      <div class="info-row">
        <div class="info-item">
          <span class="label">审核人：</span>{person_enroll_info.reviewer ? person_enroll_info.reviewer : '暂无'}
        </div>
        <div class="info-item">
          <span class="label">审核状态：</span><span
            class="Status-tag {person_enroll_info.Status === '通过'
              ? 'published'
              : person_enroll_info.Status === '未审核'
                ? 'unpublished'
                : 'invalidated'}">{person_enroll_info.Status ? person_enroll_info.Status : '暂无'}</span
          >
        </div>
      </div>
      <div class="action-row">
        <button class="btn pass">通过</button>
        <button class="btn reject">不通过</button>
      </div>
    </div>
  </div>
</div>

<style lang="scss" scoped>
  $primary-color: #0052d9;
  $normal-font-size: 14px;
  $gray-font-color: #666;
  $border-color: #ddd;

  .student-detail-container {
    position: relative;
    display: flex;
    flex-direction: column;
    max-height: 100vh;
    overflow-y: auto;
    box-sizing: border-box;
    padding-bottom: 40px;
  }

  .info-container {
    display: flex;
    flex-direction: column;
    gap: 30px;
    margin: 20px 40px;
    width: 90%;
  }

  .info-row {
    display: grid;
    grid-template-columns: repeat(3, 1fr); // 默认三列固定宽度
    gap: 20px;

    @media (max-width: 1000px) {
      grid-template-columns: repeat(2, 1fr); // 中屏两列
    }

    @media (max-width: 700px) {
      grid-template-columns: 1fr; // 小屏一列
    }
  }

  .info-item {
    font-size: $normal-font-size;
    color: #333;
    display: flex;
    flex-wrap: wrap;
    align-items: center;

    .label {
      color: $gray-font-color;
      margin-right: 6px;
      font-weight: 500;
    }
  }

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

  .idcard-image {
    width: 200px;
    height: 120px;
    border: 1px solid $border-color;
    border-radius: 4px;
    display: flex;
    align-items: center;
    justify-content: center;
    background: #fafafa;
    margin-top: 8px;

    img {
      max-width: 100%;
      max-height: 100%;
      object-fit: contain;
    }
  }

  .action-row {
    display: flex;
    justify-content: center; // 按钮居中
    gap: 20px;
    margin-top: 80px;

    .btn {
      padding: 8px 20px;
      border: none;
      border-radius: 4px;
      font-size: $normal-font-size;
      cursor: pointer;
      font-weight: 500;
    }

    .btn.pass {
      background: #4caf50;
      color: #fff;
    }

    .btn.reject {
      background: #e34d59;
      color: #fff;
    }
  }
</style>
