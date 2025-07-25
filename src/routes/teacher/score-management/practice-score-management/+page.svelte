<script>
	import { createPracticeGradeStore } from '../_stores/practiceGrade.svelte.js';
	import Title from '../_components/shared/Title.svelte';
	import Pagination from '../_components/shared/Pagination.svelte';
	import PracticeFilterPanel from '../_components/practice/PracticeFilterPanel.svelte';
	import PracticeTable from '../_components/practice/PracticeTable.svelte';

	const practiceGradeStore = createPracticeGradeStore();

	$effect(() => {
		practiceGradeStore.fetchPractices();
	});
</script>

<div class="grade-management-content">
	<Title title="练习成绩管理" />
	<div class="main-content">
		<PracticeFilterPanel store={practiceGradeStore} />
		{#if practiceGradeStore.state.loading}
			<p>加载中...</p>
		{:else}
			<PracticeTable store={practiceGradeStore} />
		{/if}
		<Pagination store={practiceGradeStore} />
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

			& > :last-child {
				margin-top: auto;
			}
		}
	}
</style> 