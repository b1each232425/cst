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
			const context = getContext('practice-detail');
			contextData = context?.practiceData?.();
		} else {
			const context = getContext('exam-detail');
			contextData = context?.examData?.();
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

			<div class="info-grid">
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
			<div class="info-grid">
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
					<span class="label">知识点涉及</span>
					<span class="value">-</span>
				</div>

				<div class="info-item">
					<span class="label">应考人数</span>
					<span class="value">{safeDisplayNumber(displayData.totalExaminees)}</span>
				</div>

				<div class="info-item">
					<span class="label">提交状态</span>
					<span class="value">{safeDisplayBoolean(displayData.submitted, '已提交', '未提交')}</span>
				</div>

				<div class="info-item">
					<span class="label">通过人数</span>
					<span class="value">{safeDisplayNumber(displayData.passExaminees)}</span>
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
