<script>
	/**
	 * @typedef {ReturnType<import('$lib/stores/modules/grade.svelte.js').createGradeStore>} GradeStore
	 */

	/** @type {{ store: GradeStore }} */
	let { store } = $props();

	const { state, setFilters } = store;

	/**
	 * @param {keyof typeof state.filters} key
	 * @param {string | boolean} value
	 */
	function handleFilterChange(key, value) {
		setFilters({ [key]: value });
	}

	/**
	 * @param {Event} e
	 * @param {'type' | 'name'} key
	 */
	function handleInputChange(e, key) {
		const target = e.target;
		if (target instanceof HTMLInputElement || target instanceof HTMLSelectElement) {
			handleFilterChange(key, target.value);
		}
	}

	/**
	 * @param {Event} e
	 */
	function handleSubmittedChange(e) {
		const target = e.target;
		if (target instanceof HTMLSelectElement) {
			const value = target.value;
			handleFilterChange('submitted', value === '' ? '' : value === 'true');
		}
	}
</script>

<div class="filter-panel">
	<div class="search-group">
		<span class="filter-hint">考试类别</span>
		<select onchange={(e) => handleInputChange(e, 'type')} value={state.filters.type}>
			<option value="">全部</option>
			<option value="00">平时考试</option>
			<option value="04">资格证考试</option>
		</select>
	</div>

	<div class="search-container">
		<input
			type="text"
			placeholder="请输入考试名称"
			value={state.filters.name}
			oninput={(e) => handleInputChange(e, 'name')}
		/>
	</div>

	<div class="search-group">
		<span class="filter-hint">提交状态</span>
		<select onchange={handleSubmittedChange} value={state.filters.submitted.toString()}>
			<option value="">全部</option>
			<option value="true">已提交</option>
			<option value="false">未提交</option>
		</select>
	</div>
</div>

<style lang="scss">
	.filter-panel {
		display: flex;
		align-items: center;
		gap: 20px;
		padding: 10px 0;

		.search-group {
			display: flex;
			align-items: center;
			gap: 8px;

			.filter-hint {
				font-size: 14px;
				color: #555;
			}

			select {
				padding: 8px;
				border-radius: 4px;
				border: 1px solid #ccc;
			}
		}

		.search-container {
			input {
				padding: 8px;
				border-radius: 4px;
				border: 1px solid #ccc;
				width: 250px;
			}
		}
	}
</style> 