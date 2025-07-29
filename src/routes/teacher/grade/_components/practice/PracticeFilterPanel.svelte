<script>
	import SearchInput from '../shared/SearchInput.svelte';

	/**
	 * @typedef {ReturnType<import('$lib/stores/modules/practiceGrade.svelte.js').createPracticeGradeStore>} PracticeGradeStore
	 */

	/** @type {{ store: PracticeGradeStore }} */
	let { store } = $props();

	const { state, setFilters, exportGrades, toggleSelect, toggleSelectAll } = store;

	/**
	 * @param {string} value
	 */
	function handleSearch(value) {
		setFilters({ practiceName: value });
	}

	function handleBatchExport() {
		exportGrades();
	}

	let selectedCount = $derived(Object.keys(state.selected).filter(k => state.selected[Number(k)]).length);
	let hasSelection = $derived(selectedCount > 0);
</script>

<div class="top-action-bar">
    <div class="filters">
        <div class="search-wrapper">
            <SearchInput
                purpose_text="搜索练习"
                place_holder="请输入练习名称"
                onSearchFunc={handleSearch}
            />
        </div>
    </div>
    <div class="actions">
        <div class="selection-info">
            <span>当前已选中</span>
            <span class="count">{selectedCount}</span>
            <span>项</span>
        </div>
        <button class="action-btn export" disabled={!hasSelection} on:click={handleBatchExport}>批量导出</button>
    </div>
</div>


<style lang="scss">
	.top-action-bar {
		display: flex;
		justify-content: flex-start;
		align-items: center;
		padding: 16px 0;
		gap: 24px;
	}

	.filters {
		display: flex;
		align-items: center;
		gap: 5px;
	}

	.search-wrapper {
		--search_input_container_width: 250px;
	}

    .actions {
		display: flex;
		align-items: center;
		gap: 12px;
		color: #595959;
		font-size: 14px;

		.selection-info {
			display: flex;
			align-items: center;
			gap: 4px;

			.count {
				color: #0052d9;
				font-weight: bold;
			}
		}

		.action-btn {
			padding: 0 16px;
			height: 32px;
			border: none;
			border-radius: 4px;
			color: white;
			cursor: pointer;
			font-size: 14px;
			transition: background-color 0.2s;

			&.export {
				background-color: #0052d9;
				&:hover {
					background-color: #0041ad;
				}
			}

			&:disabled {
				background-color: #bbd3fb !important;
				cursor: not-allowed;
			}
		}
	}
</style> 