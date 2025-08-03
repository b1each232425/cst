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
	@import '../../_styles/responsive.scss';

	.exam-table-container {
		@include table-scroll-container;
	}

	.exam-table {
		@include responsive-table(1200px);
	}

	.no-data {
		text-align: center;
		padding: 40px;
		color: #999;
		font-size: 14px;

		@include respond-to(md) {
			padding: 20px;
			font-size: 13px;
		}

		@include respond-to(xs) {
			padding: 15px;
			font-size: 12px;
		}
	}
</style>