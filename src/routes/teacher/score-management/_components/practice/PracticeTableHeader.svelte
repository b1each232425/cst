<script>
	/**
	 * @typedef {ReturnType<import('$lib/stores/modules/practiceGrade.svelte.js').createPracticeGradeStore>} PracticeGradeStore
	 */

	/** @type {{ store: PracticeGradeStore }} */
	let { store } = $props();
	const { state, toggleSelectAll } = store;
</script>

<div class="practice-list-head">
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
		<thead>
			<tr>
				<th><input type="checkbox" bind:checked={state.selectAll} on:change={toggleSelectAll} /></th>
				<th>名称</th>
				<th>总分</th>
				<th>平均分</th>
				<th>作答人数</th>
				<th>通过人数</th>
				<th>操作</th>
			</tr>
		</thead>
	</table>
</div>

<style lang="scss">
	.practice-list-head {
		background-color: transparent;
		padding: 0 20px;
		height: 50px;
		line-height: 50px;

		table {
			width: 100%;
			border-collapse: collapse;

			th {
				text-align: center;
				padding: 0 8px;
				font-weight: normal;
				color: rgb(0, 0, 0, 0.3);

				&:first-child,
				&:nth-child(2) {
					text-align: left;
				}

				&:last-child {
					text-align: right;
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