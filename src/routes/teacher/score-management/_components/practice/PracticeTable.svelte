<script>
	import PracticeTableHeader from './PracticeTableHeader.svelte';
	import PracticeTableRow from './PracticeTableRow.svelte';

	/** @type {{ store: ReturnType<import('$lib/stores/modules/practiceGrade.svelte.js').createPracticeGradeStore>}} */
	let { store } = $props();
	const { state } = store;
</script>

<div class="practice-table">
	<PracticeTableHeader {store} />
	<div class="table-body">
		{#if state.practices.length === 0}
			<p class="no-data">暂无数据</p>
		{:else}
			{#each state.practices as practice, i}
				<PracticeTableRow {practice} {store} isAlter={i % 2 === 1} />
			{/each}
		{/if}
	</div>
</div>

<style lang="scss">
	.practice-table {
		width: 100%;
		flex-grow: 1;
		display: flex;
		flex-direction: column;
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