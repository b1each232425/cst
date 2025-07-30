<script>
	/**
	 * @typedef {ReturnType<import('../../../_stores/practiceGrade.svelte.js').createPracticeGradeStore>} PracticeGradeStore
	 */

	/** @type {{ store: PracticeGradeStore }} */
	let { store } = $props();
	const { toggleSelectAll } = store;
</script>

<tr class="practice-list-head">
	<th class="practice-select">
		<button
			class="square-container {store.state.selectAll ? 'checked' : ''}"
			onclick={toggleSelectAll}
		>
			{#if store.state.selectAll}
				<div class="check-square"></div>
			{/if}
		</button>
	</th>
	<th class="practice-name">名称</th>
	<th class="practice-total-score">总分</th>
	<th class="practice-avg-score">平均分</th>
	<th class="practice-completed">作答人数</th>
	<th class="practice-passed">通过人数</th>
	<th class="practice-operation">操作</th>
</tr>

<style lang="scss">
	.practice-list-head {
		width: 100%;
		height: 50px;
		background-color: transparent;

		th {
			font-size: 14px;
			font-weight: normal;
			color: rgb(0, 0, 0, 0.3);
			padding: 0 4px;
			vertical-align: middle;
			text-align: center;
		}
	}

	.practice-select {
		width: 5%;
	}
	.practice-name {
		width: 35%;
		text-align: left;
	}
	.practice-total-score {
		width: 15%;
	}
	.practice-avg-score 
	.practice-completed 
	.practice-passed {
		width: 10%;
	}
	.practice-operation {
		width: 15%;
		text-align: right;
	}

	.square-container {
		background-color: white;
		display: flex;
		justify-content: center;
		align-items: center;
		cursor: pointer;
		border: 1px solid #919191;
		border-radius: 3px;
		margin: 0 auto;
		padding: 0;
		width: 16px;
		height: 16px;

		&:hover {
			background-color: #e0e0e0;
			border-color: #aaa;
		}
	}

	.check-square {
		width: 11px;
		height: 11px;
		background-color: #165dff;
	}
</style> 