<script>
	import PracticeTableHeader from './PracticeTableHeader.svelte';
	import PracticeTableRow from './PracticeTableRow.svelte';

	/**
	 * @typedef {ReturnType<import('$lib/stores/modules/practiceGrade.svelte.js').createPracticeGradeStore>} PracticeGradeStore
	 */

	/** @type {{ store: PracticeGradeStore }} */
	let { store } = $props();

	const { state } = store;
</script>

<div class="table-container">
	<table>
		<PracticeTableHeader />
		<tbody>
			{#each state.practices as practice, index}
				<PracticeTableRow {practice} {index} />
			{/each}
		</tbody>
	</table>
</div>

<style lang="scss">
	.table-container {
		flex-grow: 1;
		overflow-y: auto;
		table {
			width: 100%;
			border-collapse: collapse;
		}
	}
</style> 