<script>
	import { createGradeStore } from './../_stores/grade.svelte.js';
	import Title from '../_components/shared/Title.svelte';
	import Pagination from '../_components/shared/Pagination.svelte';
	import ExamFilterPanel from '../_components/exam/ExamFilterPanel.svelte';
	import ExamTable from '../_components/exam/ExamTable.svelte';

	const examGradeStore = createGradeStore();

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
			<Pagination store={examGradeStore} />
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
		padding: 0 33px;
		padding-bottom: 10px; /* 控制筛选区和表格的间距 */
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