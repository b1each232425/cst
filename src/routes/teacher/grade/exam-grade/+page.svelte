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
				total_items={state.totalRecords}
				page_size={state.pagination.pageSize}
				current_page={state.pagination.page}
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
  min-height: 600px;
  overflow: hidden;
  height:84vh;
  position: relative;
}

	.filter-container {
		flex-shrink: 0;
  		background: #fff;
  		z-index: 20;//下拉菜单优先级高于表头
		padding: 0 13px;
		padding-bottom: 5px;

	}

	.table-container {
  		display: flex;
  		flex-direction: column;
  		overflow: hidden;
		position: relative;
  		min-height: 0;
		padding: 0 1px;
		flex: 1;
		padding-bottom: 60px; /* 为固定分页器留出空间 */
	}

	.table-content {
		flex: 1;
		overflow: hidden;
		min-height: 0;
	}

	.pagination-wrapper {
		flex-shrink: 0;
		position: absolute;
		bottom: 10px;
		right: 20px;
	}
</style>