<script>
	import PracticeTableHeader from './PracticeTableHeader.svelte';
	import PracticeTableRow from './PracticeTableRow.svelte';

	/** @type {{ store: ReturnType<import('$lib/stores/modules/practiceGrade.svelte.js').createPracticeGradeStore>}} */
	let { store } = $props();
	const { state } = store;
</script>

<div class="practice-table-container">
	<table class="practice-table">
		<thead>
			<PracticeTableHeader {store} />
		</thead>
		<tbody>
			{#if state.practices.length === 0}
				<tr>
					<td colspan="7" class="no-data">暂无数据</td>
				</tr>
			{:else}
				{#each state.practices as practice (practice.id)}
					<PracticeTableRow {practice} {store} />
				{/each}
			{/if}
		</tbody>
	</table>
</div>

<style lang="scss">

	.practice-table-container {
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

	.practice-table {
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