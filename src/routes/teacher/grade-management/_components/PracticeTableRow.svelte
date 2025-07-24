<script>
	import { goto } from '$app/navigation';
	/**
	 * @typedef {import('$lib/stores/modules/practiceGrade.svelte.js').PracticeInfo} PracticeInfo
	 */
	/** @type {{ practice: PracticeInfo, index: number }} */
	let { practice, index } = $props();
</script>

<tr class="practice-list-row" class:alter={index % 2 === 1}>
	<td class="practice-name">{practice.name}</td>
	<td class="practice-total-score">{practice.total_score}</td>
	<td class="practice-average-score">{practice.average_score}</td>
	<td class="practice-actual-students">{practice.completed_students}</td>
	<td class="practice-pass-students">{practice.passed_students}</td>
	<td class="operation">
		<button class="details-btn" onclick={() => goto(`/teacher/gradeManagement/practice/detail?practiceId=${practice.id}`)}>
			详情
		</button>
		<button class="export-btn">导出</button>
	</td>
</tr>

<style lang="scss">
	.practice-list-row {
		&.alter {
			background-color: #f9f9f9;
		}
		td {
			padding: 12px 8px;
			text-align: center;
			border-bottom: 1px solid #eee;
		}
	}
	.operation button {
		border: none;
		background: none;
		color: #0052d9;
		cursor: pointer;
		margin: 0 5px;
	}
</style> 