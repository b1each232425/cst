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
		<div class="table-content">
			{#if practiceGradeStore.state.loading}
				<p>加载中...</p>
			{:else}
				<PracticeTable store={practiceGradeStore} />
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
		padding: 0 1px;
		padding-bottom: 10px;

		@include respond-to(xl) {
			padding-bottom: 8px;
		}

		@include respond-to(md) {
			padding-bottom: 6px;
		}
	}

	.table-container {
		@include table-container;
		padding: 0 23px;

		@include respond-to(xl) {
			padding: 0 16px;
		}

		@include respond-to(md) {
			padding: 0 8px;
		}

		@include respond-to(xs) {
			padding: 0 4px;
		}
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