<script>
	import { onMount, setContext } from 'svelte';
	import { page } from '$app/stores';
	import { sget } from '$lib/utils';
	import InfoCard from '../../_components/detail/InfoCard.svelte';
	import StudentGradeTable from '../../_components/detail/StudentGradeTable.svelte';
	import GradeChart from '../../_components/detail/GradeChart.svelte';
	import AnalysisPanel from '../../_components/detail/AnalysisPanel.svelte';

	/**
	 * @typedef {Object} ExamData
	 * @property {number} id - 考试ID
	 * @property {string} title - 考试标题
	 * @property {string} name - 考试名称
	 * @property {string} examTimeText - 考试时间文本
	 * @property {number} totalScore - 总分
	 * @property {string} type - 考试类型
	 * @property {number} averageScore - 平均分
	 * @property {number} totalExaminees - 总考生数
	 * @property {boolean} submitted - 是否已提交
	 * @property {number} passExaminees - 通过人数
	 * @property {Array} papers - 试卷列表
	 */

	/**
	 * @type {string|null}
	 */
	let examId = $state("");

	/**
	 * @type {ExamData|null}
	 * @description 当前考试数据
	 */
	let examData = $state(null);

	/**
	 * @type {boolean}
	 * @description 页面是否显示
	 * @default false
	 */
	let isShow = $state(false);

	// 设置 Context，传递考试数据
	setContext('exam-detail', {
		examData: () => examData,
		examId: () => examId
	});

	/**
	 * 获取考试数据
	 * @param {string} id - 考试ID
	 * @returns {Promise<ExamData|null>} 返回考试数据
	 */
	async function fetchExamData(id) {
		try {
			const response = await fetch(
				`/api/teacher/exam-grade?examID=${id}&courseID=0&classID=0&page=1&pageSize=10`,
				{
					method: "GET",
					credentials: "include",
				}
			);

			if (!response.ok) {
				console.error('获取考试数据失败:', response.status);
				return null;
			}

			const result = await response.json();

			if (result.status !== 0) {
				console.error('考试数据返回错误:', result.msg);
				return null;
			}

			const examList = sget(result, 'data', []);
			const exam = examList.find(e => e.id == id) || examList[0];

			if (!exam) {
				console.error('未找到考试数据');
				return null;
			}

			return {
				id: exam.id,
				title: exam.name || exam.title,
				name: exam.name || exam.title,
				examTimeText: formatExamTime(exam.start_time, exam.end_time),
				totalScore: exam.total_score || 0,
				type: getExamTypeText(exam.type),
				averageScore: exam.average_score || 0,
				totalExaminees: exam.total_examinees || exam.scheduled_examinees || 0,
				submitted: exam.submitted || false,
				passExaminees: exam.pass_examinees || 0,
				createTime: exam.create_time,
				updateTime: exam.update_time,
				papers: formatPapers(exam.sessions || exam.papers || [])
			};
		} catch (error) {
			console.error('获取考试数据异常:', error);
			return null;
		}
	}

	/**
	 * 格式化考试时间
	 */
	function formatExamTime(startTime, endTime) {
		if (!startTime) return '--';

		try {
			const start = new Date(startTime);
			const end = endTime ? new Date(endTime) : null;

			const startStr = start.toLocaleString('zh-CN', {
				year: 'numeric',
				month: '2-digit',
				day: '2-digit',
				hour: '2-digit',
				minute: '2-digit'
			});

			if (end) {
				const endStr = end.toLocaleString('zh-CN', {
					hour: '2-digit',
					minute: '2-digit'
				});
				return `${startStr} - ${endStr}`;
			}

			return startStr;
		} catch (error) {
			return '--';
		}
	}

	/**
	 * 获取考试类型文本
	 */
	function getExamTypeText(type) {
		const typeMap = {
			'00': '平时考试',
			'01': '期中考试',
			'02': '资格证考试',
			'03': '期末考试'
		};
		return typeMap[type] || '其他考试';
	}

	/**
	 * 格式化试卷信息
	 */
	function formatPapers(sessions) {
		if (!Array.isArray(sessions)) return [];

		return sessions.map((session, index) => ({
			id: session.exam_session_id || session.id || index,
			exam_session_id: session.exam_session_id || session.id || index,
			idText: session.paper_id || `P${String(index + 1).padStart(3, '0')}`,
			name: session.paper_name || session.name || `试卷${index + 1}`,
			markMode: session.mark_mode || '自动批改',
			actualExaminees: session.actual_examinees || 0,
			totalScore: session.total_score || 0,
			averageScore: session.average_score || 0
		}));
	}

	/**
	 * 提交考试成绩
	 */
	async function handleExamSubmitted(exam_ids) {
		try {
			const response = await fetch('/api/teacher/exam-grades', {
				method: 'PATCH',
				headers: {
					'Content-Type': 'application/json'
				},
				credentials: 'include',
				body: JSON.stringify({
					exam_ids: exam_ids
				})
			});

			if (!response.ok) {
				throw new Error(`HTTP error! status: ${response.status}`);
			}

			const result = await response.json();

			if (result.status === 0) {
				console.log('成绩提交成功');
				// 更新提交状态
				if (examData) {
					examData.submitted = true;
				}
			} else {
				throw new Error(result.msg || '提交失败');
			}
		} catch (err) {
			console.error('提交成绩失败:', err);
		}
	}

	// 页面初始化
	onMount(async () => {
		// 从 URL 参数获取考试 ID
		examId = $page.url.searchParams.get('id');

		if (!examId) {
			console.error('缺少考试ID参数');
			return;
		}

		// 获取考试数据
		examData = await fetchExamData(examId);
		console.log("获取考试数据成功:", examData);

		// 显示页面
		isShow = true;
	});
</script>


{#if isShow}
<div class="page-container">
	<!-- 主要内容 -->
	<div class="detail-container">
		<!-- 基本信息卡片 -->
		 <div class="first-row">
			<section class="card info-section">
				<InfoCard type="exam" data={examData} />
			</section>
			<!-- 成绩分布图表 -->
			<section class="card chart-section">
			<GradeChart
				type="exam"
				resourceId={examId}
				papers={examData?.papers || []}
			/>
			</section>
		 </div>
		 <div class="second-row">
			<!-- 学生成绩表格 -->
		<section class="card grade-section">
			<StudentGradeTable
				type="exam"
				resourceId={examId}
				papers={examData?.papers || []}
			/>
		</section>
		 </div>
		
		 <div class="third-row">
			<!-- 试卷分析 -->
		<section class="card analysis-section">
			<AnalysisPanel
				type="exam"
				resourceId={examId}
				papers={examData?.papers || []}
			/>
		</section>
		 </div>
		
		 <div class="buttons-container">
			<button
				class="submit-button"
				onclick={() => handleExamSubmitted([Number(examId)])}
				disabled={examData?.submitted}
			>
				提交成绩
			</button>
		 </div>
	</div>
</div>
{/if}

<style lang="scss" scoped>
		.page-container{
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

			.card{
				box-sizing: border-box;
        		border: 1px solid #d7d7d7;
        		border-radius:4px;
        		padding: 10px;
			}
			.first-row{
				display: flex;
				gap: 10px;
				flex-shrink: 0;
				.info-section{
					flex: 0 0 calc(55% - 5px);
					min-width: 800px;
				}
				.chart-section{
					flex: 0 0 calc(45% - 5px);
					min-width: 680px;
				}
			}
			.second-row {
				.grade-section {
					min-width: 1490px;
				}
			}

			.third-row {
				.analysis-section {
					min-width: 1490px;
				}
			}
		}
		.buttons-container{
			display: flex;
      		position: fixed;
      		bottom: 24px;
      		right: 24px;
      		z-index: 1000;
      		gap: 20px;
			.submit-button {
				padding: 10px 20px;
				font-size: 14px;
				color: white;
				background-color: var(--green);
				border: none;
				border-radius: var(--btn-border-radius);
				cursor: pointer;
				box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
				transition: background-color 0.3s;

				&:hover {
					opacity: 0.8;
				}
				&:disabled {
					background-color: var(--gray);
					cursor: not-allowed;
					opacity: 0.6;
				}
			}
	}
}
</style>
