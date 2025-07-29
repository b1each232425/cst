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
				<p class="no-data">暂无数据</p>
			{:else}
				{#each state.practices as practice, i}
					<PracticeTableRow {practice} {store} isAlter={i % 2 === 1} />
				{/each}
			{/if}
		</tbody>
	</table>
</div>

<style lang="scss">
	.practice-table-container {
		width: 100%;
		overflow-x: auto;
	}

	.practice-table {
		width: 100%;
		border-collapse: collapse;
		table-layout: fixed; /* 关键：使用固定表格布局 */
	}

	.table-body {
		flex-grow: 1;
		overflow-y: auto;
	}

	.no-data {
		text-align: center;
		padding: 40px;
		color: #999;
	}
</style> 