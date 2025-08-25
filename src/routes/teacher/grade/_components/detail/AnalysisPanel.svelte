<script>
  import { onMount, getContext } from 'svelte';
  import Select from '$lib/components/Select/Select.svelte';
  import Option from '$lib/components/Select/Option.svelte';
  import Empty from '$lib/components/Table/Empty.svelte';
  import { toast } from '$lib/components/Toast/Toast.js';


  /**
   * @typedef {Object} Props
   * @property {'practice' | 'exam'} type - 类型
   * @property {number} resourceId - 资源ID
   * @property {Array} [papers] - 试卷选项（考试类型需要）
   */

  /**
   * @type {Props}
   */
  let { type, resourceId, papers = [] } = $props();

  // 获取 Context 数据
  let contextData = $state(null);
  try {
    if (type === 'practice') {
      const context = getContext('practice');
      contextData = context?.practiceData;
    } else {
      const context = getContext('exam');
      contextData = context?.examData;
    }
  } catch {
    // Context 不存在时忽略
  }

  // 状态变量
  let questions = $state([]);
  let questionGroup = $state([]);
  let isLoaded = $state(false);
  let isfolded = $state(false);
  let currentPaperId = $state('');
  let options = $state([]);

  // 监听 currentPaperId 的变化
  $effect(() => {
    if (currentPaperId) {
      // 当 currentPaperId 变化时，重新获取数据
      if (type === 'exam' && papers.length > 0) {
        updateData();
      }
    }
  });

  // 切换折叠状态
  function toggleFold() {
    isfolded = !isfolded;
  }

  /**
   * 将后端返回的原始题目数据转换为前端所需格式
   */
  function transformQuestions(rawQuestions, answerStats, subjectiveAvgScores) {
    return rawQuestions.map((q) => {
      const isObjective = q.Type === '00' || q.Type === '02' || q.Type === '04';
      const stat = answerStats[String(q.ID)] || {};
      const avgScore = subjectiveAvgScores[String(q.ID)];

      let options = undefined;

      if (isObjective && Array.isArray(q.Options)) {
        const total = Object.values(stat).reduce((sum, val) => sum + val, 0);

        options = q.Options.map((opt) => {
          const label = opt.label;
          const count = stat[label] || 0;
          const rate = total > 0 ? parseFloat(((count / total) * 100).toFixed(1)) : 0;

          return {
            label,
            text: opt.value,
            selectionRate: rate,
          };
        });
      }

      return {
        id: q.ID,
        type: q.Type,
        content: q.Content,
        options: options,
        answer: (() => {
          if (isObjective) {
            return Array.isArray(q.Answers) ? q.Answers : [];
          } else {
            const list = Array.isArray(q.Answers) ? q.Answers.map((a) => a.answer) : [];
            return list;
          }
        })(),
        index: q.Order,
        score: q.Score,
        averageScore: isObjective ? undefined : avgScore || 0,
        groupId: q.GroupID || null, // 确保使用正确的GroupID字段
      };
    });
  }

  /**
   * 获取分析数据（考试类型）
   */
  function fetchAnalysisDataBySessionId(sessionId) {
    isLoaded = false;
    // 清空之前的数据，避免显示旧数据
    questions = [];
    questionGroup = [];
    
    const apiUrl = `/api/grade?category=exam&examSessionID=${sessionId}`;
    
    fetch(apiUrl, {
      method: 'GET',
      credentials: 'include',
    })
        .then((response) => {
          if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
          }
          return response.json();
        })
        .then((resp_data) => {
          if (resp_data.status !== 0) {
            throw new Error(resp_data.msg || '获取数据失败');
          }

          // 处理返回的数据结构
          const flatQuestions = [];
          if (resp_data.data.exam_paper_questions) {
            // 遍历每个分组的题目，并为题目设置正确的GroupID
            Object.entries(resp_data.data.exam_paper_questions).forEach(([groupId, groupQuestions]) => {
              if (Array.isArray(groupQuestions)) {
                groupQuestions.forEach((question) => {
                  // 确保题目有正确的GroupID
                  question.GroupID = parseInt(groupId);
                  flatQuestions.push(question);
                });
              }
            });
          }

          questions = transformQuestions(
            flatQuestions,
            resp_data.data.question_answers_stats || {},
            resp_data.data.subjective_scores || {},
          );
          questionGroup = resp_data.data.exam_paper_groups || [];
          isLoaded = true;
        })
        .catch((error) => {
          console.error('获取考试数据失败:', error);
          // 发生错误时也要清空数据
          questions = [];
          questionGroup = [];
          isLoaded = true; // 确保加载状态结束
        });
  }

  /**
   * 获取分析数据（练习类型）
   */
  function fetchPracticeAnalysisData(practiceId) {
    isLoaded = false;
    // 清空之前的数据，避免显示旧数据
    questions = [];
    questionGroup = [];
    
    fetch(`/api/grade?category=practice&practiceID=${practiceId}`, {
      method: 'GET',
      credentials: 'include',
    })
        .then((response) => {
          if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
          }
          return response.json();
        })
        .then((resp_data) => {
          if (resp_data.status !== 0) {
            throw new Error(resp_data.msg || '获取数据失败');
          }

          // 处理返回的数据结构（练习数据结构可能与考试不同）
          const flatQuestions = [];
          if (resp_data.data.exam_paper_questions) {
            // 遍历每个分组的题目，并为题目设置正确的GroupID
            Object.entries(resp_data.data.exam_paper_questions).forEach(([groupId, groupQuestions]) => {
              if (Array.isArray(groupQuestions)) {
                groupQuestions.forEach((question) => {
                  // 确保题目有正确的GroupID
                  question.GroupID = parseInt(groupId);
                  flatQuestions.push(question);
                });
              }
            });
          }

          questions = transformQuestions(
            flatQuestions,
            resp_data.data.question_answers_stats || {},
            resp_data.data.subjective_scores || {},
          );
          questionGroup = resp_data.data.exam_paper_groups || [];
          isLoaded = true;
        })
        .catch((error) => {
          console.error('获取练习数据失败:', error);
          // 发生错误时也要清空数据
          questions = [];
          questionGroup = [];
          isLoaded = true; // 确保加载状态结束
        });
  }

  /**
   * 将试卷数据转换为下拉选项
   */
  function examDataToOptions() {
    return papers.map((session, index) => ({
      value: String(session.id), // 确保value是字符串类型，统一处理
      label: session.name || `试卷${index + 1}`, // 使用试卷名称，如果没有则使用默认名称
    }));
  }

  /**
   * 更新数据
   */
  function updateData() {
    if (currentPaperId) {
      // 根据当前选中的试卷ID查找对应的试卷信息
      // 注意：currentPaperId是字符串，session.id是数字，需要类型转换
      const selectedSession = papers.find((session) => String(session.id) === currentPaperId);
      
      if (selectedSession) {
        // 使用选中试卷的exam_session_id获取分析数据
        fetchAnalysisDataBySessionId(selectedSession.id);
      } else {
        // 如果没有找到选中的试卷，使用第一个试卷
        if (papers.length > 0) {
          fetchAnalysisDataBySessionId(papers[0].id);
        }
      }
    }
  }

  /**
   * 处理试卷选择变化（通过 changeValue 回调）
   */
  function handlePaperChange(selectedPaperId) {
    // 更新当前选中的试卷ID
    currentPaperId = selectedPaperId;
  }

  // 组件挂载时的初始化
  onMount(() => {
    if (type === 'exam' && papers.length > 0) {
      // 初始化选项
      options = examDataToOptions();

      // 设置默认选中的试卷
      if (!currentPaperId && papers.length > 0) {
        currentPaperId = String(papers[0].id); // 这里设置的是exam_session_id转换为字符串
      }

      // 加载初始数据
      updateData();
    } else if (type === 'practice' && resourceId) {
      // 练习类型直接使用 resourceId
      fetchPracticeAnalysisData(resourceId);
    }
  });
</script>

<div class="analysis-card">
  <div class="card-header">
    <button class="card-title-button" onclick={toggleFold}>
      {#if isfolded}
        <img src="/sidebar/nav_icon/unfold.svg" alt="收起" />
      {:else}
        <img src="/sidebar/nav_icon/fold.svg" alt="展开" />
      {/if}
      <div class="title">试卷分析</div>
    </button>
  </div>
  
  {#if !isfolded && isLoaded}
  {#if type === 'exam' && papers.length > 1}
    <div class="paper-select">
      <Select bind:value={currentPaperId} placeholder="选择试卷" changeValue={handlePaperChange}>
        {#each options as option}
          <Option value={option.value} label={option.label}>{option.label}</Option>
        {/each}
      </Select>
    </div>
  {/if}
    <div class="analysis-content">
      {#if questions.length === 0 || questionGroup.length === 0}
        <!-- 暂无数据显示 -->
        <div class="no-data">
          <Empty text="暂无试卷分析数据" />
        </div>
      {:else}
        <!-- 简化的题目列表显示-->
        {#each questionGroup as group}
          <div class="question-group">
            <div class="group-title">
              {group.Name}
              {#if questions.filter((q) => q.groupId === group.ID).length > 0}
                (共{questions.filter((q) => q.groupId === group.ID).reduce((sum, q) => sum + q.score, 0)}分，共{questions.filter((q) => q.groupId === group.ID).length}题)
              {/if}
            </div>
            {#if questions.filter((q) => q.groupId === group.ID).length === 0}
              <!-- 分组内暂无题目 -->
              <div class="group-no-data">
                <Empty text="暂无数据" />
              </div>
            {:else}
              {#each questions.filter((q) => q.groupId === group.ID) as question}
                <div class="question-item">
                  <div class="question-header">
                    <span class="question-number">第{question.index}题</span>
                    <span class="question-score">({question.score}分)</span>
                    {#if question.averageScore !== undefined}
                      <span class="average-score">平均分: {question.averageScore}</span>
                    {/if}
                  </div>
                  <div class="question-content">
                    {@html question.content}
                  </div>
                  {#if question.options}
                    <div class="options-stats">
                      {#each question.options as option}
                        <div class="option-stat">
                          <span class="option-label">{option.label}:</span>
                          <span class="option-text">{@html option.text}</span>
                          <span class="option-percentage">({option.selectionRate}%)</span>
                        </div>
                      {/each}
                    </div>
                  {/if}
                  {#if Array.isArray(question.answer) && question.answer.length > 0}
                    <div class="correct-answers">
                      <span class="answer-label">正确答案:</span>
                      <span class="answer-content">{question.answer.join(', ')}</span>
                    </div>
                  {/if}
                </div>
              {/each}
            {/if}
          </div>
        {/each}
      {/if}
    </div>
  {/if}
  <!-- {#if !isLoaded}
		<div class="loading-indicator">
			<div class="spinner"></div>
			<span>正在加载，请稍候...</span>
		</div>
	{/if} -->
</div>

<style lang="scss" scoped>
  .analysis-card {
    width: 100%;
    height: 100%;
    margin-bottom: 40px;

    .card-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 20px;
      padding-bottom: 10px;
      border-bottom: 2px solid #f0f0f0;

      .card-title-button {
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 10px;
        cursor: pointer;
        background: none;
        border: none;

        img {
          width: 32px;
          height: 32px;
        }
        .title {
          font-size: 22px;
          font-weight: bold;
        }
      }
    }

    .paper-select {
      max-width: 20%;
    }

    .analysis-content {
      margin-top: 20px;
      margin-left: 10px;
      margin-right: 10px;

      .no-data {
        text-align: center;
      }

      .question-group {
        margin-bottom: 30px;

        .group-title {
          font-size: 18px;
          font-weight: bold;
          margin-bottom: 15px;
          color: var(--text-primary);
        }

        .group-no-data {
          text-align: center;
        }

        .question-item {
          margin-bottom: 20px;
          padding: 15px;
          border: 1px solid #e0e0e0;
          border-radius: 5px;
          background: #fafafa;

          .question-header {
            display: flex;
            align-items: center;
            gap: 10px;
            margin-bottom: 10px;

            .question-number {
              font-weight: bold;
              color: #333;
            }

            .question-score {
              color: #666;
            }

            .average-score {
              color: #007bff;
              font-weight: 500;
            }
          }

          .question-content {
            margin-bottom: 10px;
            line-height: 1.5;
            color: #333;
          }

          .options-stats {
            .option-stat {
              display: flex;
              align-items: center;
              gap: 5px;
              margin-bottom: 5px;
              font-size: 14px;

              .option-label {
                font-weight: bold;
                color: #333;
              }

              .option-text {
                color: #666;
                flex: 1;
              }

              .option-percentage {
                color: #007bff;
                font-weight: 500;
              }
            }
          }

          .correct-answers {
            margin-top: 10px;
            padding: 8px 12px;
            background: #f8f9fa;
            border-left: 3px solid #28a745;
            border-radius: 3px;

            .answer-label {
              font-weight: bold;
              color: #28a745;
              margin-right: 8px;
            }

            .answer-content {
              color: #333;
            }
          }
        }
      }
    }
  }
</style>
