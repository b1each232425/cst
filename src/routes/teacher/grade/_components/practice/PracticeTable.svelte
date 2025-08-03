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
	@import '../../_styles/responsive.scss';

	.practice-table-container {
		@include table-scroll-container;
	}

	.practice-table {
		@include responsive-table(1000px);
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