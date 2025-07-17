<script>
  import { getContext } from "svelte";
  const Context = getContext("practice");
  const practiceData = Context.practiceData;
</script>

{#if practiceData}
  <div class="exam-card">
    <h1 class="title">{practiceData.name}</h1>

    <div class="info-grid">
      <!-- <div class="info-item">
        <span class="label">隶属课程</span>
        <span class="value">--</span>
      </div> -->

      <!-- <div class="info-item">
        <span class="label">练习班级</span>
        <span class="value">--</span>
      </div> -->

      <!-- <div class="info-item">
        <span class="label">班级人数</span>
        <span class="value">--</span>
      </div> -->

      <div class="info-item">
        <span class="label"> 练习总分</span>
        <span class="value">{practiceData.totalScore}</span>
      </div>

      <div class="info-item">
        <span class="label">平均分</span>
        <span class="value">{practiceData.averageScore}</span>
      </div>

      <div class="info-item">
        <span class="label">作答人数</span>
        <span class="value">{practiceData.completedStudents || 0}</span>
      </div>

      <div class="info-item">
        <span class="label">通过人数</span>
        <span class="value">{practiceData.passedStudents || 0}</span>
      </div>

      <div class="info-item">
        <span class="label">批改方式</span>
        <span class="value">自动批改</span>
      </div>

      <!-- <div class="info-item">
        <span class="label">知识点涉及</span>
        <span class="value">--</span>
      </div>

      <div class="info-item">
        <span class="label">选用试卷</span>
        <span class="value">--</span>
      </div> -->
    </div>
  </div>
{/if}

<style lang="scss" scoped>
  .exam-card {
    width: 100%;
    height: 100%;
    margin-bottom: 40px;

    .title {
      font-size: 22px;
      font-weight: bold;
      margin-bottom: 20px;
    }

    .info-grid {
      display: grid;
      grid-template-columns: 60% 40%;
      gap: 24px 48px;

      .info-item {
        display: flex;
        align-items: flex-start;
        gap: 24px;

        .label {
          font-size: 14px;
          font-weight: 300;
          min-width: 80px;
          text-align: right;
          flex-shrink: 0;
        }

        .value {
          font-size: 14px;
          font-weight: 500;
        }
      }
    }
  }
</style>
