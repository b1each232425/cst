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
		padding: 16px 33px 10px 33px; /* 控制筛选区和表格的间距 */
	}

	.table-container {
		flex-grow: 1;
		display: flex;
		flex-direction: column;
		padding: 0 37px; /* 移除顶部的 padding */
	}
	.pagination-wrapper {
		margin-top: auto; /* 将分页器推到底部 */
		padding-bottom: 35px;
	}
</style> 