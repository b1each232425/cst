<script>
	import { onMount, setContext } from 'svelte';
	import { page } from '$app/stores';
	import InfoCard from '../../_components/detail/InfoCard.svelte';
	import StudentGradeTable from '../../_components/detail/StudentGradeTable.svelte';
	import GradeChart from '../../_components/detail/GradeChart.svelte';
	import AnalysisPanel from '../../_components/detail/AnalysisPanel.svelte';

	/**
	 * @typedef {Object} PracticeData
	 * @property {number} id - 练习ID
	 * @property {string} name - 练习名称
	 * @property {number} totalScore - 总分
	 * @property {number} averageScore - 平均分
	 * @property {number} completedStudents - 作答人数
	 * @property {number} passedStudents - 通过人数
	 */

	/**
	 * @type {string|null}
	 */
	let practiceId = $state("");

	/**
	 * @type {PracticeData|null}
	 * @description 当前练习数据
	 */
	let practiceData = $state(null);

	/**
	 * @type {boolean}
	 * @description 页面是否显示
	 * @default false
	 */
	let isShow = $state(false);

	// 设置上下文
	setContext("practice", {
		get practiceId() {
			return practiceId;
		},
		get practiceData() {
			return practiceData;
		},
	});

	/**
	 * 获取练习数据
	 * @param {string} id - 练习ID
	 * @returns {Promise<PracticeData|null>} 返回练习数据
	 */
	async function fetchPracticeData(id) {
		try {
			const response = await fetch(
				`/api/teacher/practice-grade?practiceID=${id}&courseID=0&classID=0&page=1&pageSize=10`,
				{
					method: "GET",
					credentials: "include",
				}
			);

			if (!response.ok) {
				console.error('获取练习数据失败:', response.status);
				return null;
			}

			const result = await response.json();
			
			if (result.status !== 0) {
				console.error('练习数据返回错误:', result.msg);
				return null;
			}

			const practiceList = result.data || [];
			const practice = practiceList.find(p => p.id == id) || practiceList[0];

			if (!practice) {
				console.error('未找到练习数据');
				return null;
			}

			return {
				id: practice.id,
				name: practice.name || practice.title,
				totalScore: practice.total_score || 0,
				averageScore: practice.average_score || 0,
				completedStudents: practice.completed_students || 0,
				passedStudents: practice.passed_students || 0,
				createTime: practice.create_time,
				updateTime: practice.update_time
			};
		} catch (error) {
			console.error('获取练习数据异常:', error);
			return null;
		}
	}

	// 页面初始化
	onMount(async () => {
		// 从 URL 参数获取练习 ID
		practiceId = $page.url.searchParams.get('id');
		
		if (!practiceId) {
			console.error('缺少练习ID参数');
			return;
		}

		// 获取练习数据
		practiceData = await fetchPracticeData(practiceId);
		
		// 显示页面
		isShow = true;
	});
</script>

{#if isShow}
	<div class="page-container">
		<div class="detail-container">
			<div class="first-row">
				<div class="card card1"><InfoCard type="practice" data={practiceData} /></div>
				<div class="card card2"><GradeChart type="practice" resourceId={practiceId} papers={[]} /></div>
			</div>
			<div class="second-row">
				<div class="card card3"><StudentGradeTable type="practice" resourceId={practiceId} papers={[]} /></div>
			</div>
			<div class="third-row">
				<div class="card card4"><AnalysisPanel type="practice" resourceId={practiceId} papers={[]} /></div>
			</div>
		</div>
	</div>
{/if}

<style lang="scss" scoped>
	.page-container {
		position: absolute;
    	top: 0px;                  
    	left: -16px;
    	right: -16px;
    	bottom: -50px;               // 覆盖 Footer 的 50px 高度
    	z-index: 10;                 // 高于 Footer
    	background-color: var(--bg-primary);
    	padding: 16px;
    	overflow: hidden;
		
		.detail-container {
			display: flex;
			flex-direction: column;
			height: 100%;
			width: 100%;
			background-color: var(--bg-primary);
			gap: 20px;
			overflow: auto;
			padding: 10px;

			.card {
				box-sizing: border-box;
				border: 1px solid #d7d7d7;
				border-radius: var(--border-radius-md);
				padding: 10px;
			}

			.first-row {
				display: flex;
				gap: 10px;
				flex-shrink: 0;

				.card1 {
					flex: 0 0 calc(55% - 5px);
					min-width: 800px;
				}

				.card2 {
					flex: 0 0 calc(45% - 5px);
					min-width: 680px;
				}
			}

			.second-row,
			.third-row {
				.card3,
				.card4 {
					min-width: 1480px;
				}
			}
		}
	}
</style>
