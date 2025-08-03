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
  		height: 100%;
		height:500px;
		max-height: 70vh;
 		overflow: auto;
  		flex: 1;
  		min-height: 0;

  // 自定义滚动条
  &::-webkit-scrollbar {
    width: 10px;
    height: 10px;
  }

  &::-webkit-scrollbar-track {
    background: #f1f1f1;
    border-radius: 4px;
  }

  &::-webkit-scrollbar-thumb {
    background: #c1c1c1;
    border-radius: 4px;

    &:hover {
      background: #a8a8a8;
    }
  }
	}

	.exam-table {
  width: 100%;
  min-width: 1200px;
  border-collapse: collapse;
  table-layout: fixed;

  thead {
    position: sticky;
    top: 0;
    z-index: 10;
    background: #fff;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  }
}

	.no-data {
		text-align: center;
		padding: 40px;
		color: #999;
		font-size: 14px;
	}
</style>