<script>
	import Select from '$lib/components/Select/Select.svelte';
	import Option from '$lib/components/Select/Option.svelte';
	import { sget } from '$lib/utils';

	/**
	 * @typedef {Object} QuestionGroup
	 * @property {number} id - 题目分组ID
	 * @property {string} name - 分组名称
	 */

	/**
	 * @typedef {Object} Question
	 * @property {number} id - 题目ID
	 * @property {string} type - 题目类型
	 * @property {string} content - 题目内容
	 * @property {number} score - 题目分值
	 * @property {number} [averageScore] - 平均得分
	 * @property {Object} [answerStats] - 答题统计
	 */

	/**
	 * @typedef {Object} PaperOption
	 * @property {number} id - 试卷ID
	 * @property {string} name - 试卷名称
	 */

	/**
	 * @typedef {Object} Props
	 * @property {'practice' | 'exam'} type - 类型
	 * @property {number} resourceId - 资源ID
	 * @property {PaperOption[]} [papers] - 试卷选项（考试类型需要）
	 */

	/**
	 * @type {Props}
	 */
	let { type, resourceId, papers = [] } = $props();

	// 内部状态
	let selectedPaper = $state(null);
	let questionGroups = $state([]);
	let questions = $state([]);
	let subjectiveScores = $state({});
	let answerStats = $state({});
	let loading = $state(false);
	let isCollapsed = $state(false);

	/**
	 * 获取试卷分析数据
	 */
	async function fetchAnalysisData() {
		loading = true;
		try {
			const endpoint = type === 'practice' 
				? `/api/teacher/practice-grade/paper-analysis`
				: `/api/teacher/exam-grade/paper-analysis`;

			const params = new URLSearchParams({
				[type === 'practice' ? 'practiceId' : 'examId']: resourceId.toString()
			});

			// 考试类型需要指定试卷
			if (type === 'exam' && selectedPaper) {
				params.append('examSessionId', selectedPaper.toString());
			}

			const response = await fetch(`${endpoint}?${params}`, {
				method: 'GET',
				credentials: 'include'
			});

			if (!response.ok) {
				throw new Error(`HTTP error! status: ${response.status}`);
			}

			const result = await response.json();
			
			if (result.status === 0) {
				const data = sget(result, 'data', {});
				updateAnalysisData(data);
			} else {
				console.error('获取试卷分析失败:', result.msg);
			}
		} catch (error) {
			console.error('获取试卷分析失败:', error);
		} finally {
			loading = false;
		}
	}

	/**
	 * 更新分析数据
	 * @param {Object} data - 后端返回的数据
	 */
	function updateAnalysisData(data) {
		questionGroups = sget(data, 'question_groups', []);
		questions = sget(data, 'questions', []);
		subjectiveScores = sget(data, 'subjective_scores', {});
		answerStats = sget(data, 'question_answers_stats', {});
	}

	/**
	 * 获取题目的平均分
	 * @param {Question} question - 题目对象
	 * @returns {number|string} 平均分或占位符
	 */
	function getQuestionAverageScore(question) {
		if (question.type === 'subjective') {
			return subjectiveScores[question.id] || '--';
		}
		return question.averageScore || '--';
	}

	/**
	 * 获取选择题的答题统计
	 * @param {Question} question - 题目对象
	 * @returns {Object} 答题统计
	 */
	function getAnswerStatistics(question) {
		return answerStats[question.id] || {};
	}

	/**
	 * 计算选项选择率
	 * @param {Object} stats - 答题统计
	 * @param {string} option - 选项
	 * @returns {string} 选择率百分比
	 */
	function calculateOptionPercentage(stats, option) {
		const total = Object.values(stats).reduce((sum, count) => sum + count, 0);
		const count = stats[option] || 0;
		return total > 0 ? `${((count / total) * 100).toFixed(1)}%` : '0%';
	}

	/**
	 * 切换折叠状态
	 */
	function toggleCollapse() {
		isCollapsed = !isCollapsed;
	}

	/**
	 * 处理试卷选择变化
	 * @param {CustomEvent} event
	 */
	function handlePaperChange(event) {
		selectedPaper = event.detail;
		fetchAnalysisData();
	}

	// 初始化
	$effect(() => {
		if (resourceId) {
			// 考试类型默认选择第一个试卷
			if (type === 'exam' && papers.length > 0 && !selectedPaper) {
				selectedPaper = papers[0].id;
			}
			fetchAnalysisData();
		}
	});
</script>

<div class="analysis-container">
	<div class="header">
		<div class="title-section">
			<h2 class="section-title">试卷分析</h2>
			<button class="collapse-btn" onclick={toggleCollapse}>
				{isCollapsed ? '展开' : '收起'}
			</button>
		</div>

		{#if !isCollapsed && type === 'exam' && papers.length > 0}
			<div class="controls">
				<div class="control-item">
					<label for="analysis-paper-select">选择试卷:</label>
					<Select
						id="analysis-paper-select"
						value={selectedPaper}
						placeholder="请选择试卷"
						on:change={handlePaperChange}
					>
						{#each papers as paper}
							<Option value={paper.id}>{paper.name}</Option>
						{/each}
					</Select>
				</div>
			</div>
		{/if}
	</div>

	{#if !isCollapsed}
		<div class="analysis-content">
			{#if loading}
				<div class="loading">加载中...</div>
			{:else if questions.length === 0}
				<div class="empty">暂无试卷分析数据</div>
			{:else}
				<!-- 题目分组 -->
				{#if questionGroups.length > 0}
					<div class="question-groups">
						<h3>题目分组</h3>
						<div class="groups-grid">
							{#each questionGroups as group}
								<div class="group-item">
									<span class="group-name">{group.name}</span>
								</div>
							{/each}
						</div>
					</div>
				{/if}

				<!-- 题目列表 -->
				<div class="questions-section">
					<h3>题目分析</h3>
					<div class="questions-list">
						{#each questions as question, index}
							<div class="question-item">
								<div class="question-header">
									<span class="question-number">第{index + 1}题</span>
									<span class="question-type">{question.type === 'objective' ? '客观题' : '主观题'}</span>
									<span class="question-score">{question.score}分</span>
									<span class="average-score">
										平均分: {getQuestionAverageScore(question)}
									</span>
								</div>

								<div class="question-content">
									{question.content || '题目内容'}
								</div>

								<!-- 选择题答题统计 -->
								{#if question.type === 'objective'}
									{@const stats = getAnswerStatistics(question)}
									{#if Object.keys(stats).length > 0}
										<div class="answer-stats">
											<h4>答题统计:</h4>
											<div class="stats-grid">
												{#each Object.entries(stats) as [option, count]}
													<div class="stat-item">
														<span class="option">选项{option}:</span>
														<span class="count">{count}人</span>
														<span class="percentage">
															({calculateOptionPercentage(stats, option)})
														</span>
													</div>
												{/each}
											</div>
										</div>
									{/if}
								{/if}
							</div>
						{/each}
					</div>
				</div>
			{/if}
		</div>
	{/if}
</div>

<style lang="scss" scoped>
	.analysis-container {
		background: white;
		border-radius: 8px;
		box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
		margin-bottom: 24px;
	}

	.header {
		padding: 20px 24px;
		border-bottom: 1px solid #e5e7eb;

		.title-section {
			display: flex;
			justify-content: space-between;
			align-items: center;
			margin-bottom: 16px;

			.section-title {
				font-size: 18px;
				font-weight: 600;
				color: #1f2937;
				margin: 0;
			}

			.collapse-btn {
				padding: 6px 12px;
				background: #f3f4f6;
				border: 1px solid #d1d5db;
				border-radius: 6px;
				font-size: 14px;
				color: #374151;
				cursor: pointer;
				transition: all 0.2s;

				&:hover {
					background: #e5e7eb;
				}
			}
		}

		.controls {
			.control-item {
				display: flex;
				align-items: center;
				gap: 8px;

				label {
					font-size: 14px;
					color: #374151;
					white-space: nowrap;
				}
			}
		}
	}

	.analysis-content {
		padding: 24px;

		.loading,
		.empty {
			text-align: center;
			padding: 40px;
			color: #6b7280;
			font-size: 14px;
		}

		.question-groups {
			margin-bottom: 32px;

			h3 {
				font-size: 16px;
				font-weight: 500;
				color: #1f2937;
				margin-bottom: 16px;
			}

			.groups-grid {
				display: grid;
				grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
				gap: 12px;

				.group-item {
					padding: 12px 16px;
					background: #f9fafb;
					border: 1px solid #e5e7eb;
					border-radius: 6px;

					.group-name {
						font-size: 14px;
						color: #374151;
					}
				}
			}
		}

		.questions-section {
			h3 {
				font-size: 16px;
				font-weight: 500;
				color: #1f2937;
				margin-bottom: 16px;
			}

			.questions-list {
				.question-item {
					border: 1px solid #e5e7eb;
					border-radius: 8px;
					margin-bottom: 16px;
					overflow: hidden;

					.question-header {
						display: flex;
						align-items: center;
						gap: 16px;
						padding: 16px 20px;
						background: #f9fafb;
						border-bottom: 1px solid #e5e7eb;

						.question-number {
							font-weight: 500;
							color: #1f2937;
						}

						.question-type {
							padding: 4px 8px;
							background: #dbeafe;
							color: #1e40af;
							border-radius: 4px;
							font-size: 12px;
						}

						.question-score {
							color: #059669;
							font-weight: 500;
						}

						.average-score {
							margin-left: auto;
							color: #6b7280;
							font-size: 14px;
						}
					}

					.question-content {
						padding: 16px 20px;
						color: #374151;
						line-height: 1.5;
					}

					.answer-stats {
						padding: 16px 20px;
						background: #f8fafc;
						border-top: 1px solid #e5e7eb;

						h4 {
							font-size: 14px;
							font-weight: 500;
							color: #1f2937;
							margin-bottom: 12px;
						}

						.stats-grid {
							display: grid;
							grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
							gap: 8px;

							.stat-item {
								display: flex;
								align-items: center;
								gap: 8px;
								font-size: 14px;

								.option {
									color: #374151;
								}

								.count {
									font-weight: 500;
									color: #1f2937;
								}

								.percentage {
									color: #6b7280;
								}
							}
						}
					}
				}
			}
		}
	}

	@media (max-width: 768px) {
		.header {
			padding: 16px;

			.title-section {
				flex-direction: column;
				align-items: flex-start;
				gap: 12px;
			}
		}

		.analysis-content {
			padding: 16px;

			.question-groups .groups-grid {
				grid-template-columns: 1fr;
			}

			.questions-section .questions-list .question-item {
				.question-header {
					flex-wrap: wrap;
					gap: 8px;

					.average-score {
						margin-left: 0;
						width: 100%;
					}
				}

				.answer-stats .stats-grid {
					grid-template-columns: 1fr;
				}
			}
		}
	}
</style>
