<script>
	let { selected = false, onclick } = $props();
</script>

<tr class="exam-list-head">
	<th class="exam-select">
		<button class="square-container {selected ? 'checked' : ''}" {onclick}>
			{#if selected}
				<div class="check-square"></div>
			{/if}
		</button>
	</th>
	<th class="exam-name">名称</th>
	<th class="exam-type">类型</th>
	<th class="exam-sessions">场次</th>
	<th class="exam-time">时间</th>
	<th class="exam-total-score">总分</th>
	<th class="exam-average-score">
		<span class="header-text">平均分</span>
		<span class="tooltip-container">
			<svg class="info-icon" viewBox="0 0 16 16" width="14" height="14">
				<circle cx="8" cy="8" r="7" fill="none" stroke="currentColor" stroke-width="1.5"/>
				<text x="8" y="12" text-anchor="middle" font-size="10" fill="currentColor">i</text>
			</svg>
			<div class="tooltip">计算方式:考试总分/考试次数</div>
		</span>
	</th>
	<th class="exam-scheduled-examinees">应考人数</th>
	<th class="exam-actual-examinees">实考人数</th>
	<th class="exam-pass-examinees">通过人数</th>
	<th class="exam-submitted">提交状态</th>
	<th class="operation">操作</th>
</tr>

<style lang="scss">
	.exam-list-head {
		height: 64px;
		background-color: transparent;

		th {
			font-size: 14px;
			font-weight: normal;
			color: rgb(0, 0, 0, 0.3);
			padding: 0 4px;
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

	.exam-select {
		width: 5%;
	}
	.exam-name {
		width: 16%;
		text-align: left;
	}
	.exam-time {
		width: 16%;
	}
	.exam-sessions {
		width: 15%;
	}
	.exam-total-score,
	.exam-average-score,
	.exam-scheduled-examinees,
	.exam-actual-examinees,
	.exam-pass-examinees,
	.exam-submitted {
		width: 8.5%;
	}
	.exam-type {
		width: 8.5%;
	}
	.operation {
		width: 14%;
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