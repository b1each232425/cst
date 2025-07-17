<script>
  import { getContext } from "svelte";
  const examContext = getContext("exam");
  const examData = examContext.examData;
</script>

{#if examData}
  <div class="exam-card">
    <h1 class="title">{examData.title}</h1>

    <div class="info-grid">
      <!-- <div class="info-item">
        <span class="label">隶属课程</span>
        <span class="value">--</span>
      </div>

      <div class="info-item">
        <span class="label">考试班级</span>
        <span class="value">--</span>
      </div> -->

      <div class="info-item">
        <span class="label">考试时间</span>
        <span class="value">{examData.examTimeText}</span>
      </div>

      <div class="info-item">
        <span class="label">考试总分</span>
        <span class="value">{examData.totalScore}</span>
      </div>

      <div class="info-item">
        <span class="label">考试类型</span>
        <span class="value">{examData.type}</span>
      </div>

      <div class="info-item">
        <span class="label">考试平均分</span>
        <span class="value">{examData.averageScore}</span>
      </div>

      <div class="info-item">
        <span class="label">知识点涉及</span>
        <span class="value">--</span>
        <!-- <div class="value tags">
        {#each examData.tags as tag}
          <div class="tag">
            <span class="tag-dot {tag.color}"></span>
            <span class="tag-text">{tag.name}</span>
          </div>
        {/each}
      </div> -->
      </div>

      <div class="info-item">
        <span class="label">应考人数</span>
        <span class="value">{examData.totalExaminees}</span>
      </div>

      <div class="info-item">
        <span class="label">提交状态</span>
        {#if examData.submitted}
          <span class="value green">已提交</span>
        {:else}
          <span class="value red">未提交</span>
        {/if}
      </div>

      <div class="info-item">
        <span class="label">通过人数</span>
        <span class="value">{examData.passExaminees}</span>
      </div>

      <!-- Papers Section -->
      <div class="papers-wrapper">
        <div class="label">选用试卷</div>
        <div class="papers-table-container">
          <table class="papers-table">
            <thead>
              <tr>
                <th>编号</th>
                <th>试卷名</th>
                <th>批改模式</th>
                <th>实考人数</th>
                <th>总分</th>
                <th>平均分</th>
              </tr>
            </thead>
            <tbody>
              {#each examData.papers as paper}
                <tr>
                  <td>{paper.idText}</td>
                  <td>{paper.name}</td>
                  <td>{paper.markMode}</td>
                  <td>{paper.actualExaminees}</td>
                  <td>{paper.totalScore}</td>
                  <td
                    >{paper.averageScore != null
                      ? paper.averageScore
                      : "--"}</td
                  >
                </tr>
              {/each}
            </tbody>
          </table>
        </div>
      </div>
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
      gap: 16px 48px;

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
        .value.green {
          color: var(--success-color);
        }

        .value.red {
          color: var(--error-color);
        }
      }
    }
    .papers-wrapper {
      display: flex;

      .label {
        font-size: 14px;
        color: #6b7280;
        font-weight: 400;
        min-width: 80px;
        text-align: right;
        padding-top: 6px;
        margin-right: 16px;
        flex-shrink: 0;
      }

      .papers-table-container {
        .papers-table {
          width: 100%;
          border-collapse: collapse;
          font-size: 14px;

          th,
          td {
            text-align: center;
            padding: 6px 12px;
            white-space: nowrap;
            // 或者设置具体的列宽
            &:nth-child(1) {
              width: 60px;
            } // 编号
            &:nth-child(2) {
              width: 200px;
            } // 试卷名
            &:nth-child(3) {
              width: 80px;
            } // 实考人数
            &:nth-child(4) {
              width: 60px;
            } // 总分
            &:nth-child(5) {
              width: 80px;
            } // 平均分
          }

          th {
            font-weight: 300;
            border-bottom: 1px solid #e5e7eb;
          }

          td {
            font-weight: 500;
            border-bottom: 1px solid #f3f4f6;
          }
        }
      }
    }
  }
</style>
