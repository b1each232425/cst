<script>
	import { createGradeStore } from '$lib/stores/modules/grade.svelte.js';
	import ExamFilterPanel from '../_components/exam/ExamFilterPanel.svelte';
	import ExamTable from '../_components/exam/ExamTable.svelte';
	import Title from '../_components/shared/Title.svelte';
	import Pagination from '../_components/shared/Pagination.svelte';

	const examGradeStore = createGradeStore();

	$effect(() => {
		examGradeStore.fetchExams();
	});
</script>

<div class="grade-management-content">
	<Title title="考试成绩管理" />
	<div class="main-content">
		<div class="top-bar">
			<ExamFilterPanel store={examGradeStore} />
		</div>
		{#if examGradeStore.state.loading}
			<p>加载中...</p>
		{:else}
			<ExamTable store={examGradeStore} />
		{/if}
		<Pagination store={examGradeStore} />
	</div>
</div>

<style lang="scss">
	.grade-management-content {
		background-color: #fff;
		border-radius: 8px;
		display: flex;
		flex-direction: column;
		height: 100%;
		flex-grow: 1;

		.main-content {
			padding: 0 20px 20px 20px;
			flex-grow: 1;
			display: flex;
			flex-direction: column;

			.top-bar {
				display: flex;
				justify-content: space-between;
				align-items: center;
			}

			& > :last-child {
				margin-top: auto;
			}
		}
	}
</style> 