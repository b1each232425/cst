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
	<th class="exam-average-score">平均分</th>
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