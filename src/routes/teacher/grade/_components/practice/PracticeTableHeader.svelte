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
	<th class="practice-avg-score">
		<span class="header-text">平均分</span>
		<span class="tooltip-container">
			<svg class="info-icon" viewBox="0 0 16 16" width="14" height="14">
				<circle cx="8" cy="8" r="7" fill="none" stroke="currentColor" stroke-width="1.5"/>
				<text x="8" y="12" text-anchor="middle" font-size="10" fill="currentColor">i</text>
			</svg>
			<div class="tooltip">计算方式:练习总分/练习次数</div>
		</span>
	</th>
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
			vertical-align: middle;
			text-align: center;
			position: relative;
		}

		.header-text {
			display: inline-block;
		}

		.tooltip-container {
			position: relative;
			display: inline-block;
			margin-left: 4px;
			vertical-align: middle;
		}

		.info-icon {
			color: rgba(0, 0, 0, 0.4);
			cursor: help;
			transition: color 0.2s ease;
		}

		.info-icon:hover {
			color: rgba(0, 0, 0, 0.7);
		}

		.tooltip {
			position: absolute;
			bottom: 100%;
			left: 50%;
			transform: translateX(-50%);
			background-color: #333;
			color: white;
			padding: 6px 8px;
			border-radius: 4px;
			font-size: 12px;
			white-space: nowrap;
			opacity: 0;
			visibility: hidden;
			transition: opacity 0.2s ease, visibility 0.2s ease;
			z-index: 1000;
			margin-bottom: 4px;
		}

		.tooltip::after {
			content: '';
			position: absolute;
			top: 100%;
			left: 50%;
			transform: translateX(-50%);
			border: 4px solid transparent;
			border-top-color: #333;
		}

		.tooltip-container:hover .tooltip {
			opacity: 1;
			visibility: visible;
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
		margin: 0; /* 移除自动居中，让它左对齐 */
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