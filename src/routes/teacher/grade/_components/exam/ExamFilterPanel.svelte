<script>
	import Select from '$lib/components/Select/Select.svelte';
	import Option from '$lib/components/Select/Option.svelte';
	import InputBox from '$lib/components/Input/InputBox.svelte';
	import { handleFeatureNotImplemented, handleSelectionError } from '../../_utils/errorHandler';
	/**
	 * @typedef {ReturnType<import('$lib/stores/modules/grade.svelte.js').createGradeStore>} GradeStore
	 */

	/** @type {{ store: GradeStore }} */
	let { store } = $props();

	const { state, setFilters } = store;

	let selectedCount = $derived(Object.keys(state.selected).filter(k => state.selected[Number(k)]).length);
	let hasSelection = $derived(selectedCount > 0);

	// 选项数组已内联到组件中，不再需要

	/**
	 * @param {keyof typeof state.filters} key
	 * @param {string | boolean} value
	 */
	function handleFilterChange(key, value) {
		setFilters({ [key]: value });
	}

	/**
	 * 处理搜索输入变化
	 * @param {string} value - 搜索值
	 */
	function handleSearchInput(value) {
		handleFilterChange('name', value);
	}

	// 事件处理函数已移除，使用双向绑定

	function handleBatchExport() {
		// TODO: 实现批量导出功能
		handleFeatureNotImplemented('批量导出');
	}
	function handleBatchSubmit() {
		const selectedIds = Object.keys(store.state.selected)
			.filter((id) => store.state.selected[Number(id)])
			.map(Number);

		if (selectedIds.length > 0) {
			store.submitGrades(selectedIds);
		} else {
			// 提示用户未选择任何项目
			handleSelectionError('提交');
		}
	}
	function handleShowLogs() {
		// TODO: 实现查看日志功能
		handleFeatureNotImplemented('查看日志');
	}
</script>

<div class="top-action-bar">
	<div class="filters">
		<div class="filter-group">
			<span class="filter-hint">考试类别</span>
			<div class="dropdown-wrapper">
				<Select bind:value={state.filters.type}>
					<Option value="" label="全部" />
					<Option value="00" label="平时考试" />
					<Option value="02" label="资格证考试" />
				</Select>
			</div>
		</div>
		<div class="search-wrapper">
			<InputBox
				label="搜索考试"
				placeholder="请输入考试名称"
				showLabel={true}
				clearable={true}
				onInput={handleSearchInput}
			/>
		</div>
		<div class="filter-group">
			<span class="filter-hint">提交状态</span>
			<div class="dropdown-wrapper">
				<Select bind:value={state.filters.submitted}>
					<Option value={-1} label="全部" />
					<Option value={1} label="已提交" />
					<Option value={0} label="未提交" />
				</Select>
			</div>
		</div>
	</div>
	<div class="actions">
		<div class="selection-info">
			<span>当前已选中</span>
			<span class="count">{selectedCount}</span>
			<span>项</span>
		</div>
		<button class="action-btn export" disabled={!hasSelection} onclick={handleBatchExport}>
			批量导出
		</button>
		<button class="action-btn submit" disabled={!hasSelection} onclick={handleBatchSubmit}>
			批量提交
		</button>
		<button class="action-btn log" onclick={handleShowLogs}>
			查看日志
		</button>
	</div>
</div>

<style lang="scss">
	.top-action-bar {
		display: flex;
		justify-content: flex-start;
		align-items: center;
		padding: 16px 0 0 0;
	}
	.filters {
		display: flex;
		align-items: center;
		gap: 5px; // 筛选控件之间的间距
		margin-right: 32px; // 在筛选器区域和右侧操作区域之间添加一些间距
	}
	.filter-group {
		display: flex;
		align-items: center;
	}
	.filter-hint {
		font-size: 14px;
		color: rgb(0, 0, 0, 0.6);
		padding: 0 9px 0 10px;
		min-width: 56px;
	}
	.dropdown-wrapper {
		min-width: 116px;
		width: 116px;
	}

	// 适配新的 Select 组件样式
	.dropdown-wrapper :global(.dropdown-container) {
		width: 100%;
		min-width: 116px;
	}

	.dropdown-wrapper :global(.dropdown-input) {
		height: 32px;
		border: 1px solid #ddd;
		border-radius: 3px;
		font-size: 14px;
		padding: 5px 36px 5px 12px;
		box-sizing: border-box;
	}

	.dropdown-wrapper :global(.dropdown-input:hover) {
		border-color: #0052d9;
	}

	.dropdown-wrapper :global(.dropdown-input:focus) {
		border-color: #0052d9;
		box-shadow: 0 0 0 2px rgba(0, 82, 217, 0.1);
	}

	.dropdown-wrapper :global(.dropdown-options) {
		z-index: 1000;
	}
	.search-wrapper {
		width: 200px;
	}
	.actions {
		display: flex;
		align-items: center;
		gap: 12px;
	}
	.selection-info {
		font-size: 14px;
		color: #555;
		display: flex;
		align-items: center;
		gap: 4px;
		.count {
			font-size: 16px;
			font-weight: bold;
			color: #0052d9;
			padding: 0 4px;
		}
	}
	.action-btn {
		padding: 8px 16px;
		border: none;
		border-radius: 4px;
		font-size: 14px;
		cursor: pointer;
		color: #fff;
		&.export { background-color: #0052d9; }
		&.submit { background-color: #067945; }
		&.log { background-color: #0052d9; }
		&:disabled {
			background-color: #bbd3fb;
			cursor: not-allowed;
			&.submit {
				background-color: #85dbbe;
			}
		}
	}
</style> 