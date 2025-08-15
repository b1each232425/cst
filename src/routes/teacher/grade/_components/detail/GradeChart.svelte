<script>
	import { onMount, getContext } from 'svelte';
	import Select from '$lib/components/Select/Select.svelte';
	import Option from '$lib/components/Select/Option.svelte';

	/**
	 * @typedef {Object} Props
	 * @property {'practice' | 'exam'} type - 类型
	 * @property {string|number} resourceId - 资源ID
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
	let xAxis_data = $state(['0-19', '20-39', '40-59', '60-79', '80-100']);
	let series_data = $state([]);
	let columnNum = $state(5);//直方图列数
	let currentPaperId = $state('');
	let options = $state([]);

	// 分布数据
	let distributionData = $state(null);

	/**
	 * 根据总分划分区间段（从低到高）
	 * @param {number} totalScore - 当前试卷总分
	 * @param {number} columnCount - 划分列数
	 * @returns {string[]} 区间段数组（从低到高）
	 */
	function getScoreSegments(totalScore, columnCount) {
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
	 * 获取考试成绩分布数据
	 */
	async function getExamDistributionData() {
		if (type === 'practice') {
			const url = `/api/grade/distribution?category=${type}&practiceID=${resourceId}&columnNum=${columnNum}`;

			const response = await fetch(url, {
				method: 'GET',
				credentials: 'include'
			});

			const response_data = await response.json();

			if (response_data.status < 0) {
				throw new Error(response_data.msg);
			}

			distributionData = {
				practiceId: response_data.data.practice_id,
				practiceName: response_data.data.practice_name,
				totalScore: response_data.data.total_score,
				totalStudents: response_data.data.total_students,
				gradeDistribution: response_data.data.grade_distribution
			};
		} else {
			const url = `/api/grade/distribution?category=${type}&examID=${resourceId}&columnNum=${columnNum}`;

			const response = await fetch(url, {
				method: 'GET',
				credentials: 'include'
			});

			const response_data = await response.json();

			if (response_data.status < 0) {
				throw new Error(response_data.msg);
			}

			distributionData = response_data.data;
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
	 * 更新系列数据
	 */
	function updateSeriesData() {
		if (type === 'practice') {
			if (distributionData) {
				series_data = distributionData.gradeDistribution.slice().reverse();
				xAxis_data = getScoreSegments(contextData?.totalScore || 100, columnNum);
			}
		} else {
			// 考试类型
			if (currentPaperId && distributionData) {
				const selectedPaper = papers.find((paper) => paper.id == currentPaperId);
				const selectedSession = distributionData.grade_distribution?.find(
					(session) => session.exam_session_id == selectedPaper?.id
				);

				if (selectedSession && selectedPaper) {
					series_data = selectedSession.score_distribution.slice().reverse();
					xAxis_data = getScoreSegments(selectedPaper.totalScore || 100, columnNum);
				} else {
					series_data = [];
					xAxis_data = [];
				}
			} else {
				series_data = [];
				xAxis_data = [];
			}
		}
	}

	/**
	 * 处理试卷选择变化
	 */
	function handlePaperChange(event) {
		currentPaperId = event.detail;
		updateSeriesData();
	}

	// 初始化
	onMount(async () => {
		await getExamDistributionData();

		if (type === 'exam') {
			options = examDataToOptions();
			currentPaperId = options.length > 0 ? options[0].value : '';
		}

		updateSeriesData();
	});
</script>

{#if (type === 'practice' && contextData) || (type === 'exam' && contextData)}
	<div class="chart-container">
		<div class="title">成绩分析</div>
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
		<div class="chart {type === 'exam' && papers.length > 1 ? 'small' : ''}">
			<div class="chart-content">
				<div class="chart-title">成绩分布图</div>
				{#if series_data.length === 0}
					<div class="empty-state">暂无成绩分布数据</div>
				{:else}
					<div class="bar-chart">
						{#each xAxis_data as category, index}
							{@const value = series_data[index] || 0}
							{@const maxValue = Math.max(...series_data)}
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
				{/if}
			</div>
		</div>
	</div>
{/if}

<style lang="scss" scoped>
	.chart-container {
		width: 100%;
		height: 100%;
		min-width: 600px;
		margin-bottom: 40px;

		.title {
			font-size: 22px;
			font-weight: bold;
			margin-top: 10px;
			margin-bottom: 20px;
		}

		.dropdown {
			margin-bottom: 20px;
		}

		.chart {
			width: 100%;
			height: 80%;
			border: 1px solid #e5e7eb;

			&.small {
				height: 60%;
			}

			.chart-content {
				width: 100%;
				height: 100%;
				padding: 20px;
				display: flex;
				flex-direction: column;

				.chart-title {
					text-align: center;
					font-size: 18px;
					font-weight: normal;
					color: #333;
					margin-bottom: 20px;
				}

				.empty-state {
					display: flex;
					align-items: center;
					justify-content: center;
					height: 100%;
					color: #666;
					font-size: 14px;
				}

				.bar-chart {
					display: flex;
					align-items: flex-end;
					justify-content: center;
					gap: 20px;
					height: 100%;
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
							margin-bottom: 8px;

							.bar {
								width: 35px;
								background-color: #5c7bd9;
								border-radius: 0;
								transition: all 0.3s ease;
								cursor: pointer;
								min-height: 2px;

								&:hover {
									opacity: 0.8;
								}
							}

							.bar-value {
								margin-top: 4px;
								font-size: 12px;
								color: #333;
								font-weight: normal;
							}
						}

						.bar-label {
							font-size: 12px;
							color: #333;
							text-align: center;
							white-space: nowrap;
						}
					}
				}
			}
		}
	}
</style>
