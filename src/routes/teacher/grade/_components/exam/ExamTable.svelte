<script>
	import ExamTableHeader from './ExamTableHeader.svelte';
	import ExamTableRow from './ExamTableRow.svelte';

	/**
	 * @typedef {ReturnType<import('../../../_stores/grade.svelte.js').createGradeStore>} GradeStore
	 */

	/** @type {{ store: GradeStore }} */
	let { store } = $props();
	const { state } = store;
</script>

<div class="exam-table-container">
	<table class="exam-table">
		<thead>
			<ExamTableHeader selected={state.selectAll} onclick={() => store.toggleSelectAll()} />
		</thead>
		<tbody>
			{#if state.exams.length === 0}
				<tr>
					<td colspan="12" class="no-data">暂无数据</td>
				</tr>
			{:else}
				{#each state.exams as exam, index (exam.id)}
					<ExamTableRow {exam} {store} />
				{/each}
			{/if}
		</tbody>
	</table>
</div>

<style lang="scss">
	.exam-table-container {
		width: 100%;
		overflow-x: auto;
		flex-grow: 1;
	}

	.exam-table {
		width: 100%;
		border-collapse: collapse;
		table-layout: fixed; /* 关键：使用固定表格布局 */
	}

	.no-data {
		text-align: center;
		padding: 40px;
		color: #999;
	}
</style> 