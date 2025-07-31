<script>
	import { createGradeStore } from './../_stores/grade.svelte.js';
	import Title from '$lib/components/Title/Title.svelte';
	import Pagination from '$lib/components/Pagination/Pagination.svelte';
	import ExamFilterPanel from '../_components/exam/ExamFilterPanel.svelte';
	import ExamTable from '../_components/exam/ExamTable.svelte';

	const examGradeStore = createGradeStore();
	const { state, setPage, setPageSize } = examGradeStore;

	$effect(() => {
		examGradeStore.fetchExams();
	});
</script>

<div class="page-container">
	<Title title="考试成绩管理" />

	<div class="filter-container">
		<ExamFilterPanel store={examGradeStore} />
	</div>

	<div class="table-container">
		{#if examGradeStore.state.loading}
			<p>加载中...</p>
		{:else}
			<ExamTable store={examGradeStore} />
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
		padding: 0 13px;
		padding-bottom: 5px; /* 控制筛选区和表格的间距 */
	}

	.table-container {
		flex-grow: 1;
		display: flex;
		flex-direction: column;
		padding: 0 1px; /* 移除顶部的 padding */
	}
	.pagination-wrapper {
		margin-top: auto; /* 将分页器推到底部 */
		padding-bottom: 35px;
	}
</style> 