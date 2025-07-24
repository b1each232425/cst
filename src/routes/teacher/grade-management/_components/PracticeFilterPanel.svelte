<script>
	/**
	 * @typedef {ReturnType<import('$lib/stores/modules/practiceGrade.svelte.js').createPracticeGradeStore>} PracticeGradeStore
	 */

	/** @type {{ store: PracticeGradeStore }} */
	let { store } = $props();

	const { state, setFilters } = store;

	function handleSearch() {
		setFilters({ practiceName: state.filters.practiceName });
	}
</script>

<div class="filter-panel">
	<span class="hint">搜索练习</span>
	<input
		type="text"
		placeholder="请输入练习名称"
		value={state.filters.practiceName}
		oninput={(e) => (state.filters.practiceName = e.currentTarget.value)}
		onkeydown={(e) => e.key === 'Enter' && handleSearch()}
	/>
	<button onclick={handleSearch}>搜索</button>
</div>

<style lang="scss">
	.filter-panel {
		display: flex;
		align-items: center;
		gap: 8px;
		padding: 16px 0;

		.hint {
			font-size: 14px;
		}

		input {
			padding: 8px;
			border-radius: 4px;
			border: 1px solid #ccc;
			width: 250px;
		}

		button {
			padding: 8px 16px;
			border: none;
			border-radius: 4px;
			background-color: #0052d9;
			color: white;
			cursor: pointer;
		}
	}
</style> 