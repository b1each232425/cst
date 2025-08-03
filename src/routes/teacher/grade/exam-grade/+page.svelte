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
		<div class="table-content">
			{#if examGradeStore.state.loading}
				<p>加载中...</p>
			{:else}
				<ExamTable store={examGradeStore} />
			{/if}
		</div>
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
  height: 100vh;
  min-height: 600px;
  overflow: hidden;
}

	.filter-container {
		flex-shrink: 0;
  		background: #fff;
 		border-bottom: 1px solid #e5e5e5;
  		z-index: 20;//下拉菜单优先级高于表头
		padding: 0 13px;
		padding-bottom: 5px;

	}

	.table-container {
		flex: 1;
  		display: flex;
  		flex-direction: column;
  		overflow: hidden;
  		min-height: 0;
		padding: 0 1px;
	}

	.table-content {
		flex: 1;
		overflow: hidden;
		min-height: 0;
	}

	.pagination-wrapper {
		flex-shrink: 0;
		display: flex;
		justify-content: flex-end;
		margin-top: 16px;
		padding: 16px 0;

	}
</style>