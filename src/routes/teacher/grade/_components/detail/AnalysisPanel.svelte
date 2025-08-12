<script>
	import { onMount, getContext } from 'svelte';
	import Select from '$lib/components/Select/Select.svelte';
	import Option from '$lib/components/Select/Option.svelte';
	import { sget } from '$lib/utils';

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
			const context = getContext('practice-detail');
			contextData = context?.practiceData?.();
		} else {
			const context = getContext('exam-detail');
			contextData = context?.examData?.();
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
						selectionRate: rate
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
				groupId: q.GroupID
			};
		});
	}

	/**
	 * 获取分析数据（考试类型）
	 */
	async function fetchAnalysisDataBySessionId(sessionId) {
		isLoaded = false;
		try {
			const response = await fetch(`/api/teacher/exam-analysis?examSessionID=${sessionId}`, {
				method: 'GET',
				credentials: 'include'
			});

			const resp_data = await response.json();
			if (resp_data.status < 0) {
				throw new Error(resp_data.msg);
			}
			questions = transformQuestions(
				resp_data.data.questions,
				resp_data.data.question_answers_stats,
				resp_data.data.subjective_scores
			);
			questionGroup = resp_data.data.question_groups;
			isLoaded = true;
		} catch (error) {
			console.error('获取考试数据失败:', error);
		}
	}

	/**
	 * 获取分析数据（练习类型）
	 */
	async function fetchPracticeAnalysisData(practiceId) {
		isLoaded = false;
		try {
			const response = await fetch(`/api/teacher/practice-analysis?practiceID=${practiceId}`, {
				method: 'GET',
				credentials: 'include'
			});

			const resp_data = await response.json();
			if (resp_data.status < 0) {
				throw new Error(resp_data.msg);
			}
			questions = transformQuestions(
				resp_data.data.questions,
				resp_data.data.question_answers_stats,
				resp_data.data.subjective_scores
			);
			questionGroup = resp_data.data.question_groups;
			isLoaded = true;
		} catch (error) {
			console.error('获取练习数据失败:', error);
		}
	}

	/**
	 * 将试卷数据转换为下拉选项
	 */
	function examDataToOptions() {
		return papers.map((session) => ({
			value: session.id,
			label: session.name
		}));
	}

	/**
	 * 更新数据
	 */
	function updateData() {
		if (currentPaperId) {
			const selectedSession = papers.find((session) => session.id === currentPaperId);

			if (selectedSession) {
				fetchAnalysisDataBySessionId(selectedSession.id);
			} else {
				fetchAnalysisDataBySessionId(papers[0].id);
			}
		}
	}

	/**
	 * 处理试卷选择变化
	 */
	function handlePaperChange(event) {
		currentPaperId = event.detail;
		updateData();
	}


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
	{#if type === 'exam' && papers.length > 1}
		<div class="dropdown">
			<Select
				value={currentPaperId}
				placeholder="选择试卷"
				on:change={handlePaperChange}
			>
				{#each options as option}
					<Option value={option.value} label={option.label}>{option.label}</Option>
				{/each}
			</Select>
		</div>
	{/if}
	{#if !isfolded && isLoaded}
		<div class="analysis-content">
			<!-- 简化的题目列表显示，不依赖 QuestionList 组件 -->
			{#each questionGroup as group}
				<div class="question-group">
					<h3 class="group-title">{group.name}</h3>
					{#each questions.filter(q => q.groupId === group.id) as question}
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
											<span class="option-text">{option.text}</span>
											<span class="option-percentage">({option.selectionRate}%)</span>
										</div>
									{/each}
								</div>
							{/if}
						</div>
					{/each}
				</div>
			{/each}
		</div>
	{/if}
	{#if !isLoaded}
		<div class="loading-indicator">
			<div class="spinner"></div>
			<span>正在加载，请稍候...</span>
		</div>
	{/if}
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
			margin-bottom: 40px;
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

		.dropdown {
			margin-bottom: 40px;
			margin-left: 40px;
			width: 400px;
		}

		.analysis-content {
			margin-top: 30px;
			margin-left: 50px;

			.question-group {
				margin-bottom: 30px;

				.group-title {
					font-size: 18px;
					font-weight: bold;
					margin-bottom: 15px;
					color: #333;
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
							}

							.option-percentage {
								color: #007bff;
								font-weight: 500;
							}
						}
					}
				}
			}
		}

		.loading-indicator {
			display: flex;
			align-items: center;
			justify-content: center;
			padding: 20px;
			flex-direction: column;
			color: var(--gray);

			.spinner {
				width: 40px;
				height: 40px;
				border: 4px solid #ccc;
				border-top-color: var(--blue);
				border-radius: 50%;
				animation: spin 0.8s linear infinite;
				margin-bottom: 10px;
			}

			@keyframes spin {
				to {
					transform: rotate(360deg);
				}
			}
		}
	}
</style>
