<script>
	import Pagination from '$lib/components/Pagination/Pagination.svelte';
	import InputBox from '$lib/components/Input/InputBox.svelte';
	import { sget } from '$lib/utils';
	import { safeDisplayNumber, safeDisplayText } from '../../_utils/dataFormatter.js';

	/**
	 * @typedef {Object} ScoreItem
	 * @property {number} exam_session_id - 场次ID
	 * @property {number} score - 该场成绩
	 */

	/**
	 * @typedef {Object} StudentGrade
	 * @property {number} stu_id - 学生ID
	 * @property {string} phone - 电话号码
	 * @property {string} nickname - 昵称
	 * @property {string} name - 姓名
	 * @property {number} [score] - 成绩（考试单场次）
	 * @property {ScoreItem[]} [scores] - 成绩列表（考试多场次）
	 * @property {number} [highestScore] - 最高得分（练习）
	 * @property {number} [submitCount] - 提交次数（练习）
	 * @property {number} total_score - 总分
	 * @property {string} remark - 备注
	 */

	/**
	 * @typedef {Object} Props
	 * @property {'practice' | 'exam'} type - 类型
	 * @property {number} resourceId - 资源ID
	 * @property {StudentGrade[]} [students] - 学生成绩数据
	 * @property {Object[]} [papers] - 试卷信息（考试类型需要）
	 */

	/**
	 * @type {Props}
	 */
	let { type, resourceId, students = $bindable([]), papers = [] } = $props();

	// 内部状态
	let searchKeyword = $state('');
	let currentPage = $state(1);
	let pageSize = $state(10);
	let totalRecords = $state(0);
	let loading = $state(false);
	let isCollapsed = $state(false);

	// 分页配置
	let paginationConfig = $derived({
		total: totalRecords,
		page: currentPage,
		pageSize: pageSize,
		pageSizeOptions: [
			{ value: 10, label: '10条/页' },
			{ value: 20, label: '20条/页' },
			{ value: 50, label: '50条/页' }
		]
	});

	// 表格列配置
	const columnConfigs = {
		practice: [
			{ key: 'phone', label: '手机号', width: '15%' },
			{ key: 'nickname', label: '昵称', width: '15%' },
			{ key: 'name', label: '姓名', width: '15%' },
			{ key: 'highestScore', label: '最高得分', width: '15%' },
			{ key: 'submitCount', label: '提交次数', width: '15%' },
			{ key: 'total_score', label: '总分', width: '10%' },
			{ key: 'remark', label: '备注', width: '15%' }
		],
		exam: [
			{ key: 'phone', label: '手机号', width: '12%' },
			{ key: 'nickname', label: '昵称', width: '12%' },
			{ key: 'name', label: '姓名', width: '12%' },
			// 动态添加试卷列
			...papers.map((paper, index) => ({
				key: `paper_${paper.id}`,
				label: paper.idText || `试卷${index + 1}`,
				width: '10%',
				isPaper: true,
				paperId: paper.id
			})),
			{ key: 'total_score', label: '总分', width: '8%' },
			{ key: 'remark', label: '备注', width: '15%' }
		]
	};

	let columns = $derived(columnConfigs[type] || []);

	/**
	 * 获取学生成绩数据
	 */
	async function fetchStudentGrades() {
		loading = true;
		try {
			const endpoint = type === 'practice' 
				? `/api/teacher/practice-grade/student-grade-list`
				: `/api/teacher/exam-grade/examinee-grade-list`;

			const params = new URLSearchParams({
				[type === 'practice' ? 'practiceID' : 'examID']: resourceId.toString(),
				keyword: searchKeyword,
				page: currentPage.toString(),
				pageSize: pageSize.toString()
			});

			const response = await fetch(`${endpoint}?${params}`, {
				method: 'GET',
				credentials: 'include'
			});

			if (!response.ok) {
				throw new Error(`HTTP error! status: ${response.status}`);
			}

			const result = await response.json();
			
			if (result.status === 0) {
				students = formatStudentData(sget(result, 'data', []));
				totalRecords = sget(result, 'rowCount', 0);
			} else {
				console.error('获取学生成绩失败:', result.msg);
			}
		} catch (error) {
			console.error('获取学生成绩失败:', error);
		} finally {
			loading = false;
		}
	}

	/**
	 * 格式化学生数据
	 * @param {any[]} rawData - 原始数据
	 * @returns {StudentGrade[]} 格式化后的数据
	 */
	function formatStudentData(rawData) {
		if (type === 'practice') {
			return rawData;
		}

		// 考试数据需要按学生分组并合并多场次成绩
		const studentMap = new Map();
		
		rawData.forEach(item => {
			const studentId = item.stu_id;
			
			if (!studentMap.has(studentId)) {
				studentMap.set(studentId, {
					stu_id: studentId,
					phone: item.phone,
					nickname: item.nickname,
					name: item.name,
					scores: [],
					total_score: item.total_score,
					remark: item.remark
				});
			}
			
			const student = studentMap.get(studentId);
			student.scores.push({
				exam_session_id: item.exam_session_id,
				score: item.score
			});
		});

		return Array.from(studentMap.values());
	}

	/**
	 * 获取学生在指定试卷的成绩
	 * @param {StudentGrade} student - 学生数据
	 * @param {number} paperId - 试卷ID
	 * @returns {string} 成绩或占位符
	 */
	function getStudentPaperScore(student, paperId) {
		if (type === 'practice') {
			return safeDisplayNumber(student.score, 1);
		}

		const scoreItem = student.scores?.find(s => s.exam_session_id === paperId);
		return scoreItem ? safeDisplayNumber(scoreItem.score, 1) : '-';
	}

	/**
	 * 切换折叠状态
	 */
	function toggleCollapse() {
		isCollapsed = !isCollapsed;
	}

	/**
	 * 处理搜索
	 */
	function handleSearch() {
		currentPage = 1;
		fetchStudentGrades();
	}

	/**
	 * 处理分页变化
	 * @param {CustomEvent} event
	 */
	function handlePageChange(event) {
		currentPage = event.detail;
		fetchStudentGrades();
	}

	/**
	 * 处理页面大小变化
	 * @param {CustomEvent} event
	 */
	function handlePageSizeChange(event) {
		pageSize = event.detail;
		currentPage = 1;
		fetchStudentGrades();
	}

	// 搜索防抖
	let searchTimeout;
	$effect(() => {
		if (searchKeyword !== undefined) {
			clearTimeout(searchTimeout);
			searchTimeout = setTimeout(() => {
				handleSearch();
			}, 500);
		}
	});

	// 初始化时获取数据
	$effect(() => {
		if (resourceId) {
			fetchStudentGrades();
		}
	});
</script>

<div class="student-grade-container">
	<div class="header">
		<div class="title-section">
			<h2 class="section-title">学生成绩</h2>
			<button class="collapse-btn" onclick={toggleCollapse}>
				{isCollapsed ? '展开' : '收起'}
			</button>
		</div>
		
		{#if !isCollapsed}
			<div class="search-section">
				<InputBox
					label="搜索学生"
					placeholder="请输入学生电话/昵称/姓名"
					bind:value={searchKeyword}
				/>
			</div>
		{/if}
	</div>

	{#if !isCollapsed}
		<div class="table-container">
			{#if loading}
				<div class="loading">加载中...</div>
			{:else if students.length === 0}
				<div class="empty">暂无学生成绩数据</div>
			{:else}
				<table class="grade-table">
					<thead>
						<tr>
							{#each columns as column}
								<th style="width: {column.width}">{column.label}</th>
							{/each}
						</tr>
					</thead>
					<tbody>
						{#each students as student}
							<tr>
								{#each columns as column}
									<td>
										{#if column.isPaper}
											{getStudentPaperScore(student, column.paperId)}
										{:else if column.key === 'total_score' || column.key === 'score'}
											{safeDisplayNumber(student[column.key], 1)}
										{:else if column.key === 'phone' || column.key === 'nickname' || column.key === 'name' || column.key === 'remark'}
											{safeDisplayText(student[column.key])}
										{:else}
											{safeDisplayText(student[column.key])}
										{/if}
									</td>
								{/each}
							</tr>
						{/each}
					</tbody>
				</table>

				<div class="pagination-wrapper">
					<Pagination
						{...paginationConfig}
						on:pageChange={handlePageChange}
						on:pageSizeChange={handlePageSizeChange}
					/>
				</div>
			{/if}
		</div>
	{/if}
</div>

<style lang="scss" scoped>
	.student-grade-container {
		background: white;
		border-radius: 8px;
		box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
		margin-bottom: 24px;
	}

	.header {
		padding: 20px 24px;
		border-bottom: 1px solid #e5e7eb;

		.title-section {
			display: flex;
			justify-content: space-between;
			align-items: center;
			margin-bottom: 16px;

			.section-title {
				font-size: 18px;
				font-weight: 600;
				color: #1f2937;
				margin: 0;
			}

			.collapse-btn {
				padding: 6px 12px;
				background: #f3f4f6;
				border: 1px solid #d1d5db;
				border-radius: 6px;
				font-size: 14px;
				color: #374151;
				cursor: pointer;
				transition: all 0.2s;

				&:hover {
					background: #e5e7eb;
				}
			}
		}

		.search-section {
			max-width: 300px;
		}
	}

	.table-container {
		padding: 0 24px 24px;

		.loading,
		.empty {
			text-align: center;
			padding: 40px;
			color: #6b7280;
			font-size: 14px;
		}

		.grade-table {
			width: 100%;
			border-collapse: collapse;
			font-size: 14px;
			margin-bottom: 20px;

			th,
			td {
				padding: 12px 8px;
				text-align: center;
				border-bottom: 1px solid #f3f4f6;
			}

			th {
				background: #f9fafb;
				font-weight: 500;
				color: #374151;
				border-bottom: 1px solid #e5e7eb;
			}

			td {
				color: #1f2937;
			}

			tbody tr:hover {
				background: #f8fafc;
			}
		}

		.pagination-wrapper {
			display: flex;
			justify-content: flex-end;
		}
	}

	@media (max-width: 768px) {
		.header {
			padding: 16px;

			.title-section {
				flex-direction: column;
				align-items: flex-start;
				gap: 12px;
			}

			.search-section {
				max-width: 100%;
			}
		}

		.table-container {
			padding: 0 16px 16px;
			overflow-x: auto;

			.grade-table {
				min-width: 600px;
			}
		}
	}
</style>
