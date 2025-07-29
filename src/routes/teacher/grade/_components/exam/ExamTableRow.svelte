<script>
	/**
	 * @typedef {import('../../../_stores/grade.svelte.js').ExamInfo} ExamInfo
	 * @typedef {import('../../../_stores/grade.svelte.js').ExamSessionInfo} ExamSessionInfo
	 */

	/**
	 * @typedef {ReturnType<import('../../../_stores/grade.svelte.js').createGradeStore>} GradeStore
	 */

	/** @type {{ exam: ExamInfo, store: GradeStore }} */
	let { exam, store } = $props();
	const { state, toggleSelect } = store;
</script>

<tr class="exam-list-row">
	<td class="exam-select">
		<button
			class="square-container {state.selected[exam.id] ? 'checked' : ''}"
			onclick={() => toggleSelect(exam.id)}
		>
			{#if state.selected[exam.id]}
				<div class="check-square"></div>
			{/if}
		</button>
	</td>
	<td class="exam-name">{exam.name}</td>
	<td class="exam-type">{exam.type === '00' ? '平时考试' : '资格证考试'}</td>
	<td class="exam-sessions">
		{#each exam.sessions as session (session.exam_session_id)}
			<div class="session-item">{session.paper_name}</div>
		{/each}
	</td>
	<td class="exam-time">
		{#each exam.sessions as session (session.exam_session_id)}
			<div class="session-item">
				{new Date(session.start_time).toLocaleString()} - {new Date(session.end_time).toLocaleString()}
			</div>
		{/each}
	</td>
	<td class="exam-total-score">{exam.sessions.reduce((acc, s) => acc + s.total_score, 0)}</td>
	<td class="exam-average-score">
		{(
			exam.sessions.reduce((acc, s) => acc + s.average_score, 0) / exam.sessions.length
		).toFixed(1)}
	</td>
	<td class="exam-scheduled-examinees">
		{exam.sessions.reduce((acc, s) => acc + s.scheduled_examinees, 0)}
	</td>
	<td class="exam-actual-examinees">
		{exam.sessions.reduce((acc, s) => acc + s.actual_examinees, 0)}
	</td>
	<td class="exam-pass-examinees">
		{exam.sessions.reduce((acc, s) => acc + s.pass_examinees, 0)}
	</td>
	<td class="exam-submitted" class:submitted={exam.submitted} class:not-submitted={!exam.submitted}>
		{exam.submitted ? '已提交' : '未提交'}
	</td>
	<td class="operation">
		<button class="op-btn" onclick={() => console.log('详情', exam.id)}>详情</button>
		<button class="op-btn" onclick={() => store.exportGrades([exam.id])}>导出</button>
		<button class="op-btn op-btn-submit" onclick={() => store.submitGrades([exam.id])}>
			提交
		</button>
	</td>
</tr>

<style lang="scss">
	.exam-list-row {
		border-bottom: 1px solid #e0e0e0;
		background-color: #fff;

		td {
			font-size: 14px;
			color: #3d3d3d;
			padding: 8px 4px;
			vertical-align: middle;
			text-align: center;
		}
	}

	.exam-name,
	.exam-sessions,
	.exam-time {
		text-align: left;
	}

	.exam-submitted {
		&.submitted {
			color: #00a870; /* 绿色 */
		}
		&.not-submitted {
			color: #c9353f; /* 红色 */
		}
	}

	.session-item {
		padding: 2px 0;
	}

	.operation {
		text-align: right;
	}

	.op-btn {
		color: #0052d9;
		background: none;
		border: none;
		cursor: pointer;
		padding: 4px;
		margin: 0 2px;
	}

	.op-btn-submit {
		color: #00a870; /* 使用一个更明确的绿色 */
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