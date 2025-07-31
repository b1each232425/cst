<script>
	/**
	 * @typedef {import('../../../_stores/practiceGrade.svelte.js').PracticeInfo} PracticeInfo
	 */

	/**
	 * @typedef {ReturnType<import('../../../_stores/practiceGrade.svelte.js').createPracticeGradeStore>} PracticeGradeStore
	 */

	/** @type {{ practice: PracticeInfo, store: PracticeGradeStore }} */
	let { practice, store } = $props();

	const { state, toggleSelect } = store;
</script>

<tr class="practice-list-row">
	<td class="practice-select">
		<button
			class="square-container {state.selected[practice.id] ? 'checked' : ''}"
			onclick={() => toggleSelect(practice.id)}
		>
			{#if state.selected[practice.id]}
				<div class="check-square"></div>
			{/if}
		</button>
	</td>
	<td class="practice-name">{practice.name ?? '-'}</td>
	<td class="practice-total-score">{practice.total_score ?? '-'}</td>
	<td class="practice-avg-score">{practice.average_score ?? '-'}</td>
	<td class="practice-completed">{practice.completed_students ?? '-'}</td>
	<td class="practice-passed">{practice.passed_students ?? '-'}</td>
	<td class="practice-operation">
		<button class="detail-btn">详情</button>
				</td>
			</tr>

<style lang="scss">
	.practice-list-row {
		width: 100%;
		border-bottom: 1px solid #e0e0e0;
		background-color: #fff; /* 统一白色背景 */

		td {
			font-size: 14px;
			color: #3d3d3d;
			padding: 8px 0;
			vertical-align: middle;
				text-align: center;
		}
	}

	.practice-select {
		width: 5%;
	}
	.practice-name {
		width: 35%;
		text-align: left;
	}
	.practice-total-score {
		width: 10%;
	}
	.practice-avg-score {
		width: 10%;
	}
	.practice-completed {
		width: 15%;
	}
	.practice-passed {
		width: 10%;
	}
	.practice-operation {
		width: 15%;
		text-align: right;
		padding-right: 15px;
	}

	.detail-btn {
		color: #0052d9;
		background: none;
		border: none;
		cursor: pointer;
		padding: 4px 8px;
	}

	.square-container {
		background-color: white;
		display: flex;
		justify-content: center;
		align-items: center;
		cursor: pointer;
		border: 1px solid #919191;
		border-radius: 3px;
		margin: 0; /* 移除自动居中，让它左对齐 */
		padding: 0;
		width: 16px;
		height: 16px;

		&:hover {
			background-color: #e0e0e0;
			border-color: #aaa;
		}
	}

	.check-square {
		width: 11px;
		height: 11px;
		background-color: #165dff;
	}
</style> 