<script>
	import { createEventDispatcher } from 'svelte';
	import { goto } from '$app/navigation';

	const EXAM_TYPE_MAP = {
		'00': '平时考试',
		'02': '期末考试',
		'04': '资格证考试'
	};

	/**
	 * @typedef {import('$lib/stores/modules/grade.svelte.js').ExamInfo} ExamInfo
	 */

	/** @type {{ exam: ExamInfo, isSelected: boolean, index: number }} */
	let { exam, isSelected, index } = $props();

	const dispatch = createEventDispatcher();

	function handleSelect() {
		dispatch('select', { id: exam.id });
	}

	/**
	 * @param {'export' | 'submit'} actionType
	 */
	function handleAction(actionType) {
		dispatch(actionType, { exam });
	}
</script>

<tr class="exam-list-row">
	<td class="exam-select">
		<button class="square-container {isSelected ? 'checked' : ''}" onclick={handleSelect}>
			{#if isSelected}
				<div class="check-square"></div>
			{/if}
		</button>
	</td>
	<td class="exam-name" title={exam.name || '−'}>
		<span>{exam.name || '−'}</span>
	</td>
	<td class="exam-type" title={EXAM_TYPE_MAP[exam.type]}>
		<span>{EXAM_TYPE_MAP[/** @type {'00' | '02' | '04'} */ (exam.type)]}</span>
	</td>
	<td class="exam-sessions">
		{#each exam.sessions as session}
			<div class="session-row" title={session.paper_name || '−'}>
				<span>{session.paper_name || '−'}</span>
			</div>
		{/each}
	</td>
	<td class="exam-time">
		{#each exam.sessions as session}
			<div class="session-row" title={`${session.start_time} ~ ${session.end_time}`}>
				<span>{session.start_time} ~ {session.end_time}</span>
			</div>
		{/each}
	</td>
	<td class="exam-total-score">
		{#each exam.sessions as session}
			<div class="session-row" title={session.total_score}>
				<span class="score-text">{session.total_score}</span>
			</div>
		{/each}
	</td>
	<td class="exam-average-score">
		{#each exam.sessions as session}
			<div class="session-row" title={session.average_score}>
				<span class="score-text">{session.average_score}</span>
			</div>
		{/each}
	</td>
	<td class="exam-scheduled-examinees">
		{#each exam.sessions as session}
			<div class="session-row">
				<span>{session.scheduled_examinees}</span>
			</div>
		{/each}
	</td>
	<td class="exam-actual-examinees">
		{#each exam.sessions as session}
			<div class="session-row">
				<span>{session.actual_examinees}</span>
			</div>
		{/each}
	</td>
	<td class="exam-pass-examinees">
		{#each exam.sessions as session}
			<div class="session-row">
				<span>{session.pass_examinees}</span>
			</div>
		{/each}
	</td>
	<td class="exam-submitted" class:submitted={exam.submitted}>
		<span>{exam.submitted ? '已提交' : '未提交'}</span>
	</td>
	<td class="operation">
		<button class="details-btn" onclick={() => goto(`/teacher/grade-management/exam/detail?examId=${exam.id}`)}>
			详情
		</button>
		<button class="export-btn" onclick={() => handleAction('export')}>
			导出
		</button>
		{#if !exam.submitted}
			<button class="submit-btn" onclick={() => handleAction('submit')}>
				提交
			</button>
		{/if}
	</td>
</tr>

<style lang="scss">
	/* Styles from the old component, adapted for this row component */
	.exam-list-row {
		display: flex;
		width: 100%;
		min-height: 64px;
		justify-content: space-between;
		align-items: center;
		box-sizing: border-box;
		padding: 0 15px;
		border-bottom: 1px solid #e0e0e0;
	}

	td {
		color: #3d3d3d;
		font-size: 14px;
		font-family: 'Arial', sans-serif;
		padding: 0 4px;
		box-sizing: border-box;
		min-height: fit-content;
		/* --- 统一布局为 Flex --- */
		display: flex;
		justify-content: center;
		align-items: center;
	}

	.exam-select {
		width: 5%;
	}
	.exam-name {
		width: 16%;
		justify-content: flex-start; /* 左对齐 */
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
		justify-content: flex-end; /* 右对齐 */
	}

	/* 为所有包含多场次信息的列设置垂直flex布局 */
	.exam-sessions,
	.exam-time,
	.exam-total-score,
	.exam-average-score,
	.exam-scheduled-examinees,
	.exam-actual-examinees,
	.exam-pass-examinees {
		flex-direction: column;
	}

	.session-row {
		display: flex;
		justify-content: center;
		align-items: center;
		width: 100%;
		margin: 4px 0;
		min-height: 50px;

		span {
			display: -webkit-box;
			height: fit-content;
			max-height: 50px;
			overflow: hidden;
			text-overflow: ellipsis;
			-webkit-line-clamp: 2;
			-webkit-box-orient: vertical;
		}
	}

	.exam-name span {
		display: block;
		width: 100%; /* 让 span 占满单元格宽度 */
		text-overflow: ellipsis;
		overflow: hidden;
		white-space: nowrap;
	}

	.exam-submitted {
		color: #c9353f;
		&.submitted {
			color: #00a870;
		}
	}

	.operation button {
		border: none;
		background-color: transparent;
		margin: 1px;
		padding: 0;
		cursor: pointer;
		font-size: 14px;
	}

	.operation .details-btn,
	.operation .export-btn {
		color: #0052d9;
		margin: 0 4px; /* 增加按钮间距 */
	}

	.operation .submit-btn {
		color: #00a870;
		margin: 0 4px; /* 增加按钮间距 */
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