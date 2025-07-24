<script>
	/**
	 * @typedef {import('$lib/stores/modules/practiceGrade.svelte.js').PracticeInfo} PracticeInfo
	 */

	/**
	 * @typedef {ReturnType<import('$lib/stores/modules/practiceGrade.svelte.js').createPracticeGradeStore>} PracticeGradeStore
	 */

	/** @type {{ practice: PracticeInfo, store: PracticeGradeStore, isAlter: boolean }} */
	let { practice, store, isAlter } = $props();

	const { state, toggleSelect } = store;

	function handleSelect() {
		toggleSelect(practice.id);
	}
</script>

<div class="practice-list-row" class:alter={isAlter}>
	<table>
		<colgroup>
			<col class="practice-select" />
			<col class="practice-name" />
			<col class="practice-total-score" />
			<col class="practice-avg-score" />
			<col class="practice-completed" />
			<col class="practice-passed" />
			<col class="practice-operation" />
		</colgroup>
		<tbody>
			<tr>
				<td><input type="checkbox" checked={state.selected[practice.id] || false} on:change={handleSelect} /></td>
				<td>{practice.name}</td>
				<td>{practice.total_score}</td>
				<td>{practice.average_score}</td>
				<td>{practice.completed_students}</td>
				<td>{practice.passed_students}</td>
				<td class="operation">
					<button>详情</button>
				</td>
			</tr>
		</tbody>
	</table>
</div>

<style lang="scss">
	.practice-list-row {
		border-bottom: 1px solid #e0e0e0;
		&.alter {
			background-color: #f7f8fa;
		}
		padding: 0 20px;
		height: 50px;
		line-height: 50px;

		table {
			width: 100%;
			border-collapse: collapse;

			td {
				text-align: center;
				padding: 0 8px;
				color: #3d3d3d;

				&:first-child,
				&:nth-child(2) {
					text-align: left;
				}

				&.operation {
					text-align: right;
					button {
						color: #0052d9;
						background: none;
						border: none;
						cursor: pointer;
					}
				}
			}
		}
	}

	.practice-select {
		width: 5%;
	}
	.practice-name {
		width: 35%;
	}
	.practice-total-score {
		width: 10%;
	}
	.practice-avg-score {
		width: 10%;
	}
	.practice-completed {
		width: 15%;
	}
	.practice-passed {
		width: 10%;
	}
	.practice-operation {
		width: 15%;
	}
</style> 