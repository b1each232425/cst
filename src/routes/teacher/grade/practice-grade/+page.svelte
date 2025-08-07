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
		padding: 0 1px;
		padding-bottom: 10px;
	
	}

	.table-container {
  		display: flex;
  		flex-direction: column;
  		overflow: hidden;
  		min-height: 0;
		padding: 0 23px;
		flex: 1;
		padding-bottom: 60px; /* 为固定分页器留出空间 */
	}

	.table-content {
		flex: 1;
		overflow: hidden;
		min-width: 0;
	}

	.pagination-wrapper {
		flex-shrink: 0;
		position: fixed;
		bottom: 30px;
		right: 30px;
		padding: 16px;
		z-index: 100;
	}
</style> 