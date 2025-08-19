<script>
  import { getContext } from 'svelte';
  import { safeDisplayNumber, safeDisplayText, safeDisplayBoolean } from '../../_utils/dataFormatter.js';

  /**
   * @typedef {Object} Props
   * @property {'practice'|'exam'} type - 类型：练习或考试
   * @property {Object} data - 数据对象
   */

  /**
   * @type {Props}
   */
  let { type, data } = $props();

  // 获取 Context 数据
  let contextData = null;
  try {
    if (type === 'practice') {
      const context = getContext('practice');
      contextData = context?.practiceData;
    } else {
      const context = getContext('exam');
      contextData = context?.examData;
    }
  } catch {
    // Context 不存在时使用 props 数据
  }

  // 使用 context 数据或 props 数据
  let displayData = $derived(contextData || data);

  let sortedPapers = $derived.by(() => {
  if (!displayData?.papers) return [];
  return [...displayData.papers]
    .sort((a, b) => Number(a.id) - Number(b.id))
    .map((paper, index) => ({
      ...paper,
      idText: `试卷${index + 1}`
    }));
});

  /**
   * 格式化单个考试时间
   * @param {Object} examData - 考试数据
   * @param {number} index - 试卷索引
   * @returns {string} 格式化后的时间字符串
   */
  function formatSingleExamTime(examData, index) {
    if (!examData.papers || !examData.papers[index]) return '--';

    // 从 exam_time_text 中提取对应试卷的时间信息
    const timeText = examData.exam_time_text || '';
    const sessions = timeText.split('  '); // 原来用两个空格分隔

    if (sessions[index]) {
      // 移除"试卷X:"前缀，只显示时间部分
      return sessions[index].replace(/^试卷\d+:/, '');
    }

    return '--';
  }
</script>

{#if type === 'practice'}
  <!-- 练习信息卡片 -->
  {#if displayData}
    <div class="exam-card">
      <h1 class="title">{safeDisplayText(displayData.name)}</h1>

      <div class="info-grid practice-grid">
        <div class="info-item">
          <span class="label">练习总分</span>
          <span class="value">{safeDisplayNumber(displayData.total_score)}</span>
        </div>

        <div class="info-item">
          <span class="label">平均分</span>
          <span class="value">{safeDisplayNumber(displayData.average_score, 1)}</span>
        </div>

        <div class="info-item">
          <span class="label">作答人数</span>
          <span class="value">{safeDisplayNumber(displayData.completed_students)}</span>
        </div>

        <div class="info-item">
          <span class="label">通过人数</span>
          <span class="value">{safeDisplayNumber(displayData.passed_students)}</span>
        </div>

        <div class="info-item">
          <span class="label">批改方式</span>
          <span class="value">{safeDisplayText(displayData.mark_mode)}</span>
        </div>
      </div>
    </div>
  {:else}
    <div class="exam-card">
      <h1 class="title">---</h1>
      <div class="info-grid practice-grid">
        <div class="info-item">
          <span class="label">练习总分</span>
          <span class="value">-</span>
        </div>
        <div class="info-item">
          <span class="label">平均分</span>
          <span class="value">-</span>
        </div>
        <div class="info-item">
          <span class="label">作答人数</span>
          <span class="value">-</span>
        </div>
        <div class="info-item">
          <span class="label">通过人数</span>
          <span class="value">-</span>
        </div>
        <div class="info-item">
          <span class="label">批改方式</span>
          <span class="value">-</span>
        </div>
      </div>
    </div>
  {/if}
{:else}
  <!-- 考试信息卡片 -->
  {#if displayData}
    <div class="exam-card">
      <h1 class="title">{safeDisplayText(displayData.title || displayData.name)}</h1>

      <div class="info-grid">
        <div class="info-item exam-time-item">
          <span class="label">考试时间</span>
          <div class="exam-time-list">
            {#if displayData.papers && displayData.papers.length > 0}
              {#each displayData.papers as paper, i}
                <div class="exam-time-entry">
                  <span class="paper-label">试卷{i + 1}:</span>
                  <span class="time-value">{formatSingleExamTime(displayData, i)}</span>
                </div>
              {/each}
            {:else}
              <span class="value">{safeDisplayText(displayData.exam_time_text)}</span>
            {/if}
          </div>
        </div>

        <div class="info-item exam-score-item">
          <span class="label">考试总分</span>
          <div class="exam-score-list">
            {#if displayData.papers && displayData.papers.length > 1}
              {#each displayData.papers as paper, i}
                <div class="exam-score-entry">
                  <span class="paper-label">试卷{i + 1}:</span>
                  <span class="score-value">{safeDisplayNumber(paper.total_score)}</span>
                </div>
              {/each}
            {:else}
              <span class="value">{safeDisplayNumber(displayData.total_score)}</span>
            {/if}
          </div>
        </div>

        <div class="info-item exam-examinees-item">
          <span class="label">应考人数</span>
          <div class="exam-examinees-list">
            {#if displayData.papers && displayData.papers.length > 1}
              {#each displayData.papers as paper, i}
                <div class="exam-examinees-entry">
                  <span class="paper-label">试卷{i + 1}:</span>
                  <span class="examinees-value">{safeDisplayNumber(paper.actual_examinees)}</span>
                </div>
              {/each}
            {:else}
              <span class="value">{safeDisplayNumber(displayData.total_examinees)}</span>
            {/if}
          </div>
        </div>

        <div class="info-item exam-average-item">
          <span class="label">考试平均分</span>
          <div class="exam-average-list">
            {#if displayData.papers && displayData.papers.length > 1}
              {#each displayData.papers as paper, i}
                <div class="exam-average-entry">
                  <span class="paper-label">试卷{i + 1}:</span>
                  <span class="average-value">{safeDisplayNumber(paper.average_score, 1)}</span>
                </div>
              {/each}
            {:else}
              <span class="value">{safeDisplayNumber(displayData.average_score, 1)}</span>
            {/if}
          </div>
        </div>

        <div class="info-item exam-pass-item">
          <span class="label">通过人数</span>
          <div class="exam-pass-list">
            {#if displayData.papers && displayData.papers.length > 1}
              {#each displayData.papers as paper, i}
                <div class="exam-pass-entry">
                  <span class="paper-label">试卷{i + 1}:</span>
                  <span class="pass-value">{safeDisplayNumber(paper.pass_examinees)}</span>
                </div>
              {/each}
            {:else}
              <span class="value">{safeDisplayNumber(displayData.pass_examinees)}</span>
            {/if}
          </div>
        </div>

        <div class="info-item">
          <span class="label">提交状态</span>
          {#if displayData.submitted}
            <span class="value green">已提交</span>
          {:else}
            <span class="value red">未提交</span>
          {/if}
        </div>

        <div class="info-item">
          <span class="label">考试类型</span>
          <span class="value">{safeDisplayText(displayData.type)}</span>
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
                {#each sortedPapers as paper}
                  <tr>
                    <td>{safeDisplayText(paper.idText)}</td>
                    <td>{safeDisplayText(paper.name)}</td>
                    <td>{safeDisplayText(paper.mark_mode)}</td>
                    <td>{safeDisplayNumber(paper.actual_examinees)}</td>
                    <td>{safeDisplayNumber(paper.total_score)}</td>
                    <td>{safeDisplayNumber(paper.average_score, 1)}</td>
                  </tr>
                {/each}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  {:else}
    <div class="exam-card">
      <h1 class="title">---</h1>
      <div class="info-grid">
        <div class="info-item">
          <span class="label">考试时间</span>
          <span class="value">-</span>
        </div>
        <div class="info-item">
          <span class="label">考试总分</span>
          <span class="value">-</span>
        </div>
        <div class="info-item">
          <span class="label">应考人数</span>
          <span class="value">-</span>
        </div>
        
        <div class="info-item">
          <span class="label">考试平均分</span>
          <span class="value">-</span>
        </div>
        <div class="info-item">
          <span class="label">通过人数</span>
          <span class="value">-</span>
        </div>
        <div class="info-item">
          <span class="label">提交状态</span>
          <span class="value">-</span>
        </div>
        <div class="info-item">
          <span class="label">考试类型</span>
          <span class="value">-</span>
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
                <tr>
                  <td>-</td>
                  <td>-</td>
                  <td>-</td>
                  <td>-</td>
                  <td>-</td>
                  <td>-</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  {/if}
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
      gap: 16px 48px; /* 考试使用16px */

      &.practice-grid {
        gap: 24px 48px; /* 练习使用24px */
      }

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

          &.green {
            color: var(--green);
          }

          &.red {
            color: var(--red);
          }
        }

        /* 考试时间 */
        &.exam-time-item {
          align-items: flex-start;

          .exam-time-list {
            display: flex;
            flex-direction: column;
            gap: 8px;
            width: 100%;

            .exam-time-entry {
              display: flex;
              align-items: center;
              gap: 8px;
              font-size: 14px;

              .paper-label {
                font-weight: 500;
                color: var(--text-secondary);
                min-width: 50px;
                flex-shrink: 0;
              }

              .time-value {
                font-weight: 400;
                color: var(--text-primary);
              }
            }
          }
        }

        /* 考试总分 */
        &.exam-score-item {
          align-items: flex-start;

          .exam-score-list {
            display: flex;
            flex-direction: column;
            gap: 8px;
            width: 100%;

            .exam-score-entry {
              display: flex;
              align-items: center;
              gap: 8px;
              font-size: 14px;

              .paper-label {
                font-weight: 500;
                color: var(--text-secondary);
                min-width: 50px;
                flex-shrink: 0;
              }

              .score-value {
                font-weight: 400;
                color: var(--text-primary);
              }
            }
          }
        }

        /* 应考人数 */
        &.exam-examinees-item {
          align-items: flex-start;

          .exam-examinees-list {
            display: flex;
            flex-direction: column;
            gap: 8px;
            width: 100%;

            .exam-examinees-entry {
              display: flex;
              align-items: center;
              gap: 8px;
              font-size: 14px;

              .paper-label {
                font-weight: 500;
                color: var(--text-secondary);
                min-width: 50px;
                flex-shrink: 0;
              }

              .examinees-value {
                font-weight: 400;
                color: var(--text-primary);
              }
            }
          }
        }

        /* 考试平均分 */
        &.exam-average-item {
          align-items: flex-start;

          .exam-average-list {
            display: flex;
            flex-direction: column;
            gap: 8px;
            width: 100%;

            .exam-average-entry {
              display: flex;
              align-items: center;
              gap: 8px;
              font-size: 14px;

              .paper-label {
                font-weight: 500;
                color: var(--text-secondary);
                min-width: 50px;
                flex-shrink: 0;
              }

              .average-value {
                font-weight: 400;
                color: var(--text-primary);
              }
            }
          }
        }

        /* 通过人数 */
        &.exam-pass-item {
          align-items: flex-start;

          .exam-pass-list {
            display: flex;
            flex-direction: column;
            gap: 8px;
            width: 100%;

            .exam-pass-entry {
              display: flex;
              align-items: center;
              gap: 8px;
              font-size: 14px;

              .paper-label {
                font-weight: 500;
                color: var(--text-secondary);
                min-width: 50px;
                flex-shrink: 0;
              }

              .pass-value {
                font-weight: 400;
                color: var(--text-primary);
              }
            }
          }
        }
      }
    }

    .papers-wrapper {
      display: flex;
      grid-column: 1 / -1;

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

            &:nth-child(1) {
              width: 60px;
            } /* 编号 */
            &:nth-child(2) {
              width: 200px;
            } /* 试卷名 */
            &:nth-child(3) {
              width: 80px;
            } /* 批改模式 */
            &:nth-child(4) {
              width: 60px;
            } /* 实考人数 */
            &:nth-child(5) {
              width: 80px;
            } /* 总分 */
            &:nth-child(6) {
              width: 80px;
            } /* 平均分 */
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
