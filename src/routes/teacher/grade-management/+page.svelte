<script>
	import { createGradeStore } from '$lib/stores/modules/grade.svelte.js';
	import { createPracticeGradeStore } from '$lib/stores/modules/practiceGrade.svelte.js';
	import FilterPanel from './_components/FilterPanel.svelte';
	import ExamTable from './_components/ExamTable.svelte';
	import Title from './_components/Title.svelte';
	import Pagination from './_components/Pagination.svelte';
	import ActionToolbar from './_components/ActionToolbar.svelte';
	import PracticeFilterPanel from './_components/PracticeFilterPanel.svelte';
	import PracticeTable from './_components/PracticeTable.svelte';

	let activeTab = $state('exam');
	const examGradeStore = createGradeStore();
	const practiceGradeStore = createPracticeGradeStore();

	$effect(() => {
		if (activeTab === 'exam') {
			examGradeStore.fetchExams();
		} else if (activeTab === 'practice') {
			practiceGradeStore.fetchPractices();
		}
	});

	/**
	 * @param {'exam' | 'practice'} tab
	 */
	function selectTab(tab) {
		activeTab = tab;
	}
</script>

<div class="grade-management">
	<div class="tabs">
		<button class="tab-btn" class:active={activeTab === 'exam'} onclick={() => selectTab('exam')}>
			考试成绩
		</button>
		<button class="tab-btn" class:active={activeTab === 'practice'} onclick={() => selectTab('practice')}>
			练习成绩
		</button>
	</div>

	<div class="content">
		<div class="content-item" style="visibility: {activeTab === 'exam' ? 'visible' : 'hidden'};">
			<Title title="考试成绩管理" />
			<div class="main-content">
				<FilterPanel store={examGradeStore} />
				<ActionToolbar store={examGradeStore} />
				{#if examGradeStore.state.loading}
					<p>加载中...</p>
				{:else}
					<ExamTable store={examGradeStore} />
				{/if}
				<Pagination store={examGradeStore} />
			</div>
		</div>
		<div class="content-item" style="visibility: {activeTab === 'practice' ? 'visible' : 'hidden'};">
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
	</div>
</div>

<style lang="scss">
	.grade-management {
		display: flex;
		flex-direction: column;
		height: 100%;
		padding: 0; // Remove padding to allow full width content
		background-color: #f0f2f5; // Match old project background

		.tabs {
			flex-shrink: 0;
			background-color: #fff;
			padding-left: 20px;
			border-bottom: 1px solid #e0e0e0;

			.tab-btn {
				padding: 10px 20px;
				border: none;
				background-color: transparent;
				cursor: pointer;
				font-size: 16px;
				position: relative;
				color: #555;

				&.active {
					color: #007bff;
					border-bottom: 2px solid #007bff;
				}
			}
		}

		.content {
			flex-grow: 1;
			position: relative;
			padding: 20px;

			.content-item {
				position: absolute;
				top: 20px;
				left: 20px;
				right: 20px;
				bottom: 20px;
				background-color: #fff;
				border-radius: 8px;
				display: flex;
				flex-direction: column;

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
		}
	}
</style> 