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
	@import '../_styles/responsive.scss';

	.page-container {
		@include page-container;
	}

	.filter-container {
		@include filter-container;
		padding: 0 13px;
		padding-bottom: 5px;

		@include respond-to(md) {
			padding-bottom: 8px;
		}
	}

	.table-container {
		@include table-container;
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

		@include respond-to(md) {
			margin-top: 8px;
			padding: 8px 0;
		}
	}
</style>