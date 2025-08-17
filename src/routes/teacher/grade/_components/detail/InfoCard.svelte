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
</script>

{#if type === 'practice'}
	<!-- 练习信息卡片 -->
	{#if displayData}
		<div class="exam-card">
			<h1 class="title">{safeDisplayText(displayData.name)}</h1>

			<div class="info-grid practice-grid">
				<div class="info-item">
					<span class="label">练习总分</span>
					<span class="value">{safeDisplayNumber(displayData.totalScore)}</span>
				</div>

				<div class="info-item">
					<span class="label">平均分</span>
					<span class="value">{safeDisplayNumber(displayData.averageScore, 1)}</span>
				</div>

				<div class="info-item">
					<span class="label">作答人数</span>
					<span class="value">{safeDisplayNumber(displayData.completedStudents)}</span>
				</div>

				<div class="info-item">
					<span class="label">通过人数</span>
					<span class="value">{safeDisplayNumber(displayData.passedStudents)}</span>
				</div>

				<div class="info-item">
					<span class="label">批改方式</span>
					<span class="value">自动批改</span>
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
				<div class="info-item">
					<span class="label">考试时间</span>
					<span class="value">{safeDisplayText(displayData.examTimeText)}</span>
				</div>

				<div class="info-item">
					<span class="label">考试总分</span>
					<span class="value">{safeDisplayNumber(displayData.totalScore)}</span>
				</div>

				<div class="info-item">
					<span class="label">考试类型</span>
					<span class="value">{safeDisplayText(displayData.type)}</span>
				</div>

				<div class="info-item">
					<span class="label">考试平均分</span>
					<span class="value">{safeDisplayNumber(displayData.averageScore, 1)}</span>
				</div>



				<div class="info-item">
					<span class="label">应考人数</span>
					<span class="value">{safeDisplayNumber(displayData.totalExaminees)}</span>
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
					<span class="label">通过人数</span>
					<span class="value">{safeDisplayNumber(displayData.passExaminees)}</span>
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
								{#each (displayData.papers || []) as paper}
									<tr>
										<td>{safeDisplayText(paper.idText)}</td>
										<td>{safeDisplayText(paper.name)}</td>
										<td>{safeDisplayText(paper.markMode)}</td>
										<td>{safeDisplayNumber(paper.actualExaminees)}</td>
										<td>{safeDisplayNumber(paper.totalScore)}</td>
										<td>{safeDisplayNumber(paper.averageScore, 1)}</td>
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
					<span class="label">考试类型</span>
					<span class="value">-</span>
				</div>
				<div class="info-item">
					<span class="label">考试平均分</span>
					<span class="value">-</span>
				</div>
				<div class="info-item">
					<span class="label">知识点涉及</span>
					<span class="value">-</span>
				</div>
				<div class="info-item">
					<span class="label">应考人数</span>
					<span class="value">-</span>
				</div>
				<div class="info-item">
					<span class="label">提交状态</span>
					<span class="value">-</span>
				</div>
				<div class="info-item">
					<span class="label">通过人数</span>
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

						&:nth-child(1) { width: 60px; }  /* 编号 */
						&:nth-child(2) { width: 200px; } /* 试卷名 */
						&:nth-child(3) { width: 80px; }  /* 批改模式 */
						&:nth-child(4) { width: 60px; }  /* 实考人数 */
						&:nth-child(5) { width: 80px; }  /* 总分 */
						&:nth-child(6) { width: 80px; }  /* 平均分 */
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
