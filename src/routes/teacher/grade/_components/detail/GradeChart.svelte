<script>
	import Select from '$lib/components/Select/Select.svelte';
	import Option from '$lib/components/Select/Option.svelte';
	import { sget } from '$lib/utils';

	/**
	 * @typedef {Object} ChartData
	 * @property {string[]} categories - X轴分类
	 * @property {number[]} values - Y轴数值
	 * @property {string} title - 图表标题
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
	let chartData = $state({
		categories: ['0-19', '20-39', '40-59', '60-79', '80-100'],
		values: [],
		title: '成绩分布'
	});

	let selectedPaper = $state(null);
	let columnCount = $state(5);
	let loading = $state(false);
	let isCollapsed = $state(false);

	// 列数选项
	const columnOptions = [
		{ value: 3, label: '3列' },
		{ value: 4, label: '4列' },
		{ value: 5, label: '5列' },
		{ value: 6, label: '6列' },
		{ value: 8, label: '8列' },
		{ value: 10, label: '10列' }
	];

	/**
	 * 获取成绩分布数据
	 */
	async function fetchChartData() {
		loading = true;
		try {
			const endpoint = type === 'practice' 
				? `/api/teacher/practice-grade/grade-distribution`
				: `/api/teacher/exam-grade/grade-distribution`;

			const params = new URLSearchParams({
				[type === 'practice' ? 'practiceId' : 'examId']: resourceId.toString(),
				columnNum: columnCount.toString()
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
				updateChartData(data);
			} else {
				console.error('获取成绩分布失败:', result.msg);
			}
		} catch (error) {
			console.error('获取成绩分布失败:', error);
		} finally {
			loading = false;
		}
	}

	/**
	 * 更新图表数据
	 * @param {Object} data - 后端返回的数据
	 */
	function updateChartData(data) {
		const totalScore = data.totalScore || 100;
		const distribution = data.gradeDistribution || [];
		
		// 根据总分和列数生成分段
		const segments = generateScoreSegments(totalScore, columnCount);
		
		chartData = {
			categories: segments,
			values: distribution,
			title: `成绩分布 (总分: ${totalScore})`
		};
	}

	/**
	 * 根据总分划分区间段
	 * @param {number} totalScore - 总分
	 * @param {number} columnCount - 列数
	 * @returns {string[]} 区间段数组
	 */
	function generateScoreSegments(totalScore, columnCount) {
		const step = Math.floor(totalScore / columnCount);
		const segments = [];

		for (let i = 0; i < columnCount; i++) {
			const start = i * step;
			const end = i === columnCount - 1 ? totalScore : (i + 1) * step - 1;
			segments.push(`${start}-${end}`);
		}

		return segments;
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
		fetchChartData();
	}

	/**
	 * 处理列数变化
	 * @param {CustomEvent} event
	 */
	function handleColumnChange(event) {
		columnCount = event.detail;
		fetchChartData();
	}

	// 初始化
	$effect(() => {
		if (resourceId) {
			// 考试类型默认选择第一个试卷
			if (type === 'exam' && papers.length > 0 && !selectedPaper) {
				const firstPaper = papers[0];
				if (firstPaper && firstPaper.id !== undefined) {
					selectedPaper = firstPaper.id;
				}
			}
			fetchChartData();
		}
	});

	// 监听参数变化
	$effect(() => {
		if (selectedPaper !== null || type === 'practice') {
			fetchChartData();
		}
	});
</script>

<div class="chart-container">
	<div class="header">
		<div class="title-section">
			<h2 class="section-title">成绩分布</h2>
			<button class="collapse-btn" onclick={toggleCollapse}>
				{isCollapsed ? '展开' : '收起'}
			</button>
		</div>

		{#if !isCollapsed}
			<div class="controls">
				{#if type === 'exam' && papers.length > 0}
					<div class="control-item">
						<label for="paper-select">选择试卷:</label>
						<Select
							id="paper-select"
							value={selectedPaper}
							placeholder="请选择试卷"
							on:change={handlePaperChange}
						>
							{#each papers as paper}
								{#if paper && paper.id !== undefined && paper.name}
									<Option value={paper.id} label={paper.name}>{paper.name}</Option>
								{/if}
							{/each}
						</Select>
					</div>
				{/if}

				<div class="control-item">
					<label for="column-select">分段数:</label>
					<Select
						id="column-select"
						value={columnCount}
						on:change={handleColumnChange}
					>
						{#each columnOptions as option}
							<Option value={option.value} label={option.label}>{option.label}</Option>
						{/each}
					</Select>
				</div>
			</div>
		{/if}
	</div>

	{#if !isCollapsed}
		<div class="chart-content">
			{#if loading}
				<div class="loading">加载中...</div>
			{:else if chartData.values.length === 0}
				<div class="empty">暂无成绩分布数据</div>
			{:else}
				<div class="chart-wrapper">
					<h3 class="chart-title">{chartData.title}</h3>
					<div class="bar-chart">
						{#each chartData.categories as category, index}
							{@const value = chartData.values[index] || 0}
							{@const maxValue = Math.max(...chartData.values)}
							{@const height = maxValue > 0 ? (value / maxValue) * 200 : 0}
							
							<div class="bar-item">
								<div class="bar-wrapper">
									<div 
										class="bar" 
										style="height: {height}px"
										title="{category}: {value}人"
									></div>
									<div class="bar-value">{value}</div>
								</div>
								<div class="bar-label">{category}</div>
							</div>
						{/each}
					</div>
				</div>
			{/if}
		</div>
	{/if}
</div>

<style lang="scss" scoped>
	.chart-container {
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
			display: flex;
			gap: 20px;
			flex-wrap: wrap;

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

	.chart-content {
		padding: 24px;

		.loading,
		.empty {
			text-align: center;
			padding: 40px;
			color: #6b7280;
			font-size: 14px;
		}

		.chart-wrapper {
			.chart-title {
				text-align: center;
				font-size: 16px;
				font-weight: 500;
				color: #1f2937;
				margin-bottom: 24px;
			}

			.bar-chart {
				display: flex;
				justify-content: center;
				align-items: flex-end;
				gap: 16px;
				min-height: 250px;
				padding: 20px 0;

				.bar-item {
					display: flex;
					flex-direction: column;
					align-items: center;
					min-width: 60px;

					.bar-wrapper {
						display: flex;
						flex-direction: column;
						align-items: center;
						height: 220px;
						justify-content: flex-end;

						.bar {
							width: 40px;
							background: linear-gradient(to top, #3b82f6, #60a5fa);
							border-radius: 4px 4px 0 0;
							transition: all 0.3s ease;
							cursor: pointer;
							min-height: 2px;

							&:hover {
								background: linear-gradient(to top, #2563eb, #3b82f6);
								transform: translateY(-2px);
							}
						}

						.bar-value {
							margin-top: 8px;
							font-size: 14px;
							font-weight: 500;
							color: #1f2937;
						}
					}

					.bar-label {
						margin-top: 8px;
						font-size: 12px;
						color: #6b7280;
						text-align: center;
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

			.controls {
				flex-direction: column;
				gap: 12px;

				.control-item {
					flex-direction: column;
					align-items: flex-start;
				}
			}
		}

		.chart-content {
			padding: 16px;

			.chart-wrapper .bar-chart {
				gap: 8px;
				overflow-x: auto;
				justify-content: flex-start;
				padding: 20px 10px;

				.bar-item {
					min-width: 50px;

					.bar-wrapper .bar {
						width: 30px;
					}
				}
			}
		}
	}
</style>
