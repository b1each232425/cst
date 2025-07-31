<script>
	import { createPracticeGradeStore } from '../_stores/practiceGrade.svelte.js';
	import Title from '$lib/components/Title/Title.svelte';
	import Pagination from '$lib/components/Pagination/Pagination.svelte';
	import PracticeFilterPanel from '../_components/practice/PracticeFilterPanel.svelte';
	import PracticeTable from '../_components/practice/PracticeTable.svelte';

	const practiceGradeStore = createPracticeGradeStore();
	const { state, setPage, setPageSize } = practiceGradeStore;

	$effect(() => {
		practiceGradeStore.fetchPractices();
	});
</script>

<div class="page-container">
	<Title title="练习成绩管理" />
	<div class="filter-container">
		<PracticeFilterPanel store={practiceGradeStore} />
	</div>
	<div class="table-container">
		{#if practiceGradeStore.state.loading}
			<p>加载中...</p>
		{:else}
			<PracticeTable store={practiceGradeStore} />
		{/if}
		<div class="pagination-wrapper">
			<Pagination
				totalItems={state.totalRecords}
				pageSize={state.pagination.pageSize}
				currentPage={state.pagination.page}
				on:pageChange={(e) => setPage(e.detail)}
				on:pageSizeChange={(e) => setPageSize(e.detail)}
			/>
		</div>
	</div>
</div>

<style lang="scss">
	.page-container {
		display: flex;
		flex-direction: column;
		height: 100%;
	}

	.filter-container {
		padding: 0 1px; /* 控制筛选区和表格的间距 */
		padding-bottom: 10px;
	}

	.table-container {
		display: flex;
		flex-direction: column;
		padding: 0 23px; /* 移除顶部的 padding */
	}
	.pagination-wrapper {
		display: flex;
		justify-content: flex-end; /* 右对齐 */
		margin-top: 16px; /* 与表格保持适当间距 */
		padding: 16px 0; /* 上下内边距 */
	}
</style> 