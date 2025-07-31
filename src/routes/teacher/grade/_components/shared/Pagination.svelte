<script>
	import DropdownGray from './DropdownGray.svelte';
	import { createEventDispatcher } from 'svelte';

	/**
	 * @typedef {ReturnType<import('$lib/stores/modules/grade.svelte.js').createGradeStore> | ReturnType<import('$lib/stores/modules/practiceGrade.svelte.js').createPracticeGradeStore>} AnyGradeStore
	 */

	/** @type {{ store: AnyGradeStore }} */
	let { store } = $props();

	const { state, setPage, setPageSize } = store;

	let totalPages = $derived(Math.ceil(state.totalRecords / state.pagination.pageSize) || 1);
	let pagesArray = $derived(calculatePagesArray(totalPages, state.pagination.page, 5));

	/** @param {boolean} isNext */
	function handlePageChange(isNext) {
		let newPage = state.pagination.page;
		if (isNext) {
			if (newPage < totalPages) newPage++;
		} else {
			if (newPage > 1) newPage--;
		}
		setPage(newPage);
	}

	/** @param {number} page */
	function handlePageChoose(page) {
		if (page !== state.pagination.page) {
			setPage(page);
		}
	}

	/** @param {number | string} value */
	function handlePageSizeChange(value) {
		setPageSize(Number(value));
	}

	/**
	 * @param {number} total
	 * @param {number} current
	 * @param {number} maxShow
	 */
	function calculatePagesArray(total, current, maxShow) {
		if (total <= maxShow) {
			return Array.from({ length: total }, (_, i) => i + 1);
		}

		let pages = [];
		const startPage = Math.max(2, current - 2);
		const endPage = Math.min(total - 1, current + 2);

		pages.push(1);
		if (startPage > 2) pages.push(0); 

		for (let i = startPage; i <= endPage; i++) {
			pages.push(i);
		}

		if (endPage < total - 1) pages.push(0);
		pages.push(total);

		return pages;
	}

	/** @param {KeyboardEvent & { currentTarget: HTMLInputElement }} e */
	function handleJump(e) {
		if (e.key === 'Enter') {
			const page = Number(e.currentTarget.value);
			if (page >= 1 && page <= totalPages) {
				handlePageChoose(page);
			}
		}
	}
</script>

<div class="pagination-container">
	<span class="total-text">总 {state.totalRecords} 条</span>

	<button class="nav-btn" on:click={() => handlePageChange(false)} disabled={state.pagination.page === 1}>
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
					on:click={() => handlePageChoose(page)}
				>
					{page}
				</button>
			{/if}
		{/each}
	</div>

	<button class="nav-btn" on:click={() => handlePageChange(true)} disabled={state.pagination.page === totalPages}>
		&gt;
	</button>

	<div class="per-page-selector">
		<DropdownGray
			options={[
				{ value: 5, label: '5条/页' },
				{ value: 10, label: '10条/页' },
				{ value: 20, label: '20条/页' }
			]}
			selected={state.pagination.pageSize}
			selectOptionFunc={handlePageSizeChange}
			expand_direction="up"
		/>
	</div>
	
	<span class="jump-text">前往</span>
	<input type="number" class="jump-input" min="1" max={totalPages} on:keydown={handleJump} />
</div>

<style lang="scss">
	.pagination-container {
		display: flex;
		align-items: center;
		justify-content: flex-end;
		padding: 16px 0;
		font-size: 12px;
		color: #86909c;
		gap: 8px;
	}

	.total-text, .jump-text {
		padding: 0 8px;
	}

	.per-page-selector {
		width: 96px;
		height: 25px;
	}

	.nav-btn, .page-btn {
		width: 25px;
		height: 25px;
		border: none;
		border-radius: 2px;
		background-color: transparent;
		cursor: pointer;
		font-size: 12px;
	}

	.page-numbers {
		display: flex;
		align-items: center;
		gap: 8px;
	}

	.page-btn {
		&.current {
			background-color: #e8f3ff;
			color: #165dff;
		}
	}
	
	.jump-input {
		width: 40px;
		height: 24px;
		border: none;
		border-radius: 2px;
		outline: none;
		background-color: #f2f3f5;
		font-size: 12px;
		text-align: center;
	}
</style> 