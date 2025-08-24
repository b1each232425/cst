<script>
  import Title from '$lib/components/Title/Title.svelte';

  // 假数据（模拟后端传递）
  let detail = {
    name: '张三',
    idType: '居民身份证',
    idNumber: '42011119850212589X',
    birthDate: '1985-02-12',
    phone: '189250551453',
    email: '123478@qq.com',
    address: '广东省广州市番禺区外环西路230号广州大学大学城校区',
    gender: '男',
    applyMethod: '人工导入',
    subjects: '理论、实操',
    examType: '正考',
    applyTime: '2025-08-18 15:46',
    idCardFront: 'https://via.placeholder.com/200x120?text=身份证人像面',
    idCardBack: 'https://via.placeholder.com/200x120?text=身份证国徽面',
    reviewer: '王彬',
    reviewStatus: '未审核',
  };
</script>

<div class="student-detail-container">
  <!-- 报名信息部分 -->
  <div class="section-container">
    <Title title="报名信息" />
    <div class="info-container">
      <!-- 第一行 -->
      <div class="info-row">
        <div class="info-item"><span class="label">姓名：</span>{detail.name}</div>
        <div class="info-item"><span class="label">证件类型：</span>{detail.idType}</div>
        <div class="info-item"><span class="label">身份证号：</span>{detail.idNumber}</div>
      </div>

      <!-- 第二行 -->
      <div class="info-row">
        <div class="info-item"><span class="label">出生日期：</span>{detail.birthDate}</div>
        <div class="info-item"><span class="label">电话：</span>{detail.phone}</div>
        <div class="info-item"><span class="label">邮箱：</span>{detail.email}</div>
      </div>

      <!-- 第三行（报名方式挪到这里） -->
      <div class="info-row">
        <div class="info-item"><span class="label">住址：</span>{detail.address}</div>
        <div class="info-item"><span class="label">性别：</span>{detail.gender}</div>
        <div class="info-item"><span class="label">报名方式：</span>{detail.applyMethod}</div>
      </div>

      <!-- 第四行 -->
      <div class="info-row">
        <div class="info-item"><span class="label">考试科目：</span>{detail.subjects}</div>
        <div class="info-item"><span class="label">考试类型：</span>{detail.examType}</div>
        <div class="info-item"><span class="label">报名时间：</span>{detail.applyTime}</div>
      </div>

      <!-- 第五行 -->
      <div class="info-row idcard-row">
        <div class="info-item idcard-item">
          <span class="label">身份证人像面：</span>
          <div class="idcard-image">
            <img src={detail.idCardFront} alt="身份证人像面" />
          </div>
        </div>
        <div class="info-item idcard-item">
          <span class="label">身份证国徽面：</span>
          <div class="idcard-image">
            <img src={detail.idCardBack} alt="身份证国徽面" />
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
        <div class="info-item"><span class="label">审核人：</span>{detail.reviewer}</div>
        <div class="info-item">
          <span class="label">审核状态：</span><span
            class="Status-tag {detail.reviewStatus === '通过'
              ? 'published'
              : detail.reviewStatus === '未审核'
                ? 'unpublished'
                : 'invalidated'}">{detail.reviewStatus}</span
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
