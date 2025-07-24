<script>
	/**
	 * @typedef {ReturnType<import('$lib/stores/modules/grade.svelte.js').createGradeStore>} GradeStore
	 */

	/** @type {{ store: GradeStore }} */
	let { store } = $props();

	const { state } = store;

	let selectedCount = $derived(Object.keys(state.selected).filter(k => state.selected[Number(k)]).length);
	let hasSelection = $derived(selectedCount > 0);

	function handleBatchExport() {
		// Dispatch event or call store action
		console.log('Batch Export');
	}

	function handleBatchSubmit() {
		// Dispatch event or call store action
		console.log('Batch Submit');
	}

	function handleShowLogs() {
		// Dispatch event or call store action
		console.log('Show Logs');
	}
</script>

<div class="action-toolbar">
	<div class="selection-info">
		<span>当前已选中</span>
		<span class="count">{selectedCount}</span>
		<span>项</span>
	</div>
	<div class="actions">
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
	.action-toolbar {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: 16px 0;
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

	.actions {
		display: flex;
		gap: 12px;
	}

	.action-btn {
		padding: 8px 16px;
		border: none;
		border-radius: 4px;
		font-size: 14px;
		cursor: pointer;
		color: #fff;
		transition: background-color 0.2s;

		&.export {
			background-color: #0052d9;
			&:hover {
				background-color: #0041ac;
			}
		}

		&.submit {
			background-color: #067945;
			&:hover {
				background-color: #045d35;
			}
		}

		&.log {
			background-color: #0052d9;
			&:hover {
				background-color: #0041ac;
			}
		}

		&:disabled {
			background-color: #bbd3fb;
			cursor: not-allowed;
		}
	}
</style> 