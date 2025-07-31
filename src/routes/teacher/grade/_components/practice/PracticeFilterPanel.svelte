<script>
	import InputBox from '$lib/components/Input/InputBox.svelte';

	/**
	 * @typedef {ReturnType<import('../../../_stores/practiceGrade.svelte.js').createPracticeGradeStore>} PracticeGradeStore
	 */

	/** @type {{ store: PracticeGradeStore }} */
	let { store } = $props();

	const { state, setFilters, exportGrades } = store;

	let selectedCount = $derived(Object.keys(state.selected).filter(k => state.selected[Number(k)]).length);
	let hasSelection = $derived(selectedCount > 0);

	/**
	 * 处理搜索输入变化
	 * @param {string} value - 搜索值
	 */
	function handleSearchInput(value) {
		setFilters({ name: value });
	}
</script>

<div class="top-action-bar">
    <div class="filters">
        <div class="search-wrapper">
            <InputBox
                label="搜索练习"
                placeholder="请输入练习名称"
                showLabel={true}
                clearable={true}
                onInput={handleSearchInput}
            />
        </div>
    </div>
    <div class="actions">
        <div class="selection-info">
            <span>当前已选中</span>
            <span class="count">{selectedCount}</span>
            <span>项</span>
        </div>
        <button class="action-btn export" disabled={!hasSelection} onclick={exportGrades}>批量导出</button>
    </div>
</div>


<style lang="scss">
	.top-action-bar {
		display: flex;
		justify-content: flex-start;
		align-items: center;
		padding: 0 0 16px 0;
		gap: 100px;
	}

	.filters {
		display: flex;
		align-items: center;
		gap: 5px;
	}

	.search-wrapper {
		width: 300px;
	}

    .actions {
		display: flex;
		align-items: center;
		gap: 30px;
		color: #595959;
		font-size: 14px;

		.selection-info {
			display: flex;
			align-items: center;
			gap: 10px;

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