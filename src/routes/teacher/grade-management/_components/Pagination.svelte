<script>
	/**
	 * @typedef {ReturnType<import('$lib/stores/modules/grade.svelte.js').createGradeStore>} GradeStore
	 */

	/** @type {{ store: GradeStore }} */
	let { store } = $props();

	const { state, setPage, setPageSize } = store;

	let totalPages = $derived(Math.ceil(state.totalRecords / state.pagination.pageSize) || 1);

	let pagesArray = $derived(calculatePagesArray(totalPages, state.pagination.page, 5));

	function handlePageChange(isNext) {
		let newPage = state.pagination.page;
		if (isNext) {
			if (newPage < totalPages) newPage++;
		} else {
			if (newPage > 1) newPage--;
		}
		setPage(newPage);
	}

	function handlePageChoose(page) {
		if (page !== state.pagination.page) {
			setPage(page);
		}
	}

	function handlePageSizeChange(value) {
		setPageSize(Number(value));
	}

	function calculatePagesArray(total, current, maxShow) {
		// Simplified pagination logic for brevity
		if (total <= maxShow) {
			return Array.from({ length: total }, (_, i) => i + 1);
		}

		let pages = [];
		const startPage = Math.max(2, current - 2);
		const endPage = Math.min(total - 1, current + 2);

		pages.push(1);
		if (startPage > 2) pages.push(0); // Represents '...'

		for (let i = startPage; i <= endPage; i++) {
			pages.push(i);
		}

		if (endPage < total - 1) pages.push(0);
		pages.push(total);

		return pages;
	}
</script>

<div class="pagination-container">
	<span class="total-text">总 {state.totalRecords} 条</span>

	<div class="per-page-selector">
		<select onchange={(e) => handlePageSizeChange(e.currentTarget.value)} value={state.pagination.pageSize}>
			<option value="10">10条/页</option>
			<option value="20">20条/页</option>
			<option value="50">50条/页</option>
		</select>
	</div>

	<button class="nav-btn" onclick={() => handlePageChange(false)} disabled={state.pagination.page === 1}>
		&lt;
	</button>

	<div class="page-numbers">
		{#each pagesArray as page}
			{#if page === 0}
				<span class="ellipsis">...</span>
			{:else}
				<button
					class="page-btn"
					class:current={page === state.pagination.page}
					onclick={() => handlePageChoose(page)}
				>
					{page}
				</button>
			{/if}
		{/each}
	</div>

	<button class="nav-btn" onclick={() => handlePageChange(true)} disabled={state.pagination.page === totalPages}>
		&gt;
	</button>
</div>

<style lang="scss">
	.pagination-container {
		display: flex;
		align-items: center;
		justify-content: flex-end;
		padding: 16px 0;
		font-size: 14px;
		color: #606266;
		gap: 10px;
	}

	.total-text {
		margin-right: 10px;
	}

	.per-page-selector select {
		padding: 6px;
		border-radius: 4px;
		border: 1px solid #dcdfe6;
	}

	.nav-btn,
	.page-btn {
		min-width: 32px;
		height: 32px;
		padding: 0 12px;
		border: 1px solid #dcdfe6;
		background-color: #fff;
		border-radius: 4px;
		cursor: pointer;
		transition: all 0.2s;

		&:hover {
			border-color: #409eff;
			color: #409eff;
		}

		&:disabled {
			cursor: not-allowed;
			color: #c0c4cc;
			border-color: #dcdfe6;
		}
	}

	.page-numbers {
		display: flex;
		align-items: center;
		gap: 5px;
	}

	.page-btn.current {
		background-color: #409eff;
		color: #fff;
		border-color: #409eff;
	}

	.ellipsis {
		padding: 0 10px;
	}
</style> 