<script>
	import ExamTableHeader from './ExamTableHeader.svelte';
	import ExamTableRow from './ExamTableRow.svelte';

	/**
	 * @typedef {ReturnType<import('$lib/stores/modules/grade.svelte.js').createGradeStore>} GradeStore
	 */

	/** @type {{ store: GradeStore }} */
	let { store } = $props();

	const { state, toggleSelect, toggleSelectAll, submitGrades, exportGrades } = store;

	function handleSelectAll() {
		toggleSelectAll();
	}

	/**
	 * @param {CustomEvent<{id: number}>} event
	 */
	function handleSelect(event) {
		toggleSelect(event.detail.id);
	}

	/**
	 * @param {CustomEvent<{exam: import('$lib/stores/modules/grade.svelte.js').ExamInfo}>} event
	 */
	function handleSubmit(event) {
		submitGrades([event.detail.exam.id]);
	}

	/**
	 * @param {CustomEvent<{exam: import('$lib/stores/modules/grade.svelte.js').ExamInfo}>} event
	 */
	function handleExport(event) {
		exportGrades([event.detail.exam.id]);
	}
</script>

<div class="table-container">
	<table>
		<thead>
			<ExamTableHeader selected={state.selectAll} on:selectAll={handleSelectAll} />
		</thead>
		<tbody>
			{#each state.exams as exam, index}
				<ExamTableRow
					{exam}
					index={index}
					isSelected={!!state.selected[exam.id]}
					on:select={handleSelect}
					on:submit={handleSubmit}
					on:export={handleExport}
				/>
			{/each}
		</tbody>
	</table>
</div>

<style lang="scss">
	.table-container {
		position: relative;
		display: flex;
		flex-direction: column;
		padding: 5px 37px 100px 37px;
		border-collapse: separate;
		border-spacing: 0;
		background: #fff;
		font-size: 15px;

		table {
			width: 100%;
		}
	}
</style> 