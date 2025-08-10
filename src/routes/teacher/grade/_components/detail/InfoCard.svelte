<script>
	/**
	 * 通用信息卡片组件
	 * 支持练习和考试两种类型的信息展示
	 */

	/**
	 * @typedef {Object} BasicInfo
	 * @property {string} name - 名称（练习名称或考试名称）
	 * @property {string} [title] - 标题（考试专用）
	 * @property {number} totalScore - 总分
	 * @property {number} averageScore - 平均分
	 * @property {number} [completedStudents] - 作答人数（练习专用）
	 * @property {number} [passedStudents] - 通过人数（练习专用）
	 * @property {number} [totalExaminees] - 应考人数（考试专用）
	 * @property {number} [passExaminees] - 通过人数（考试专用）
	 * @property {string} [examTimeText] - 考试时间（考试专用）
	 * @property {string} [type] - 考试类型（考试专用）
	 * @property {boolean} [submitted] - 是否已提交（考试专用）
	 * @property {PaperInfo[]} [papers] - 试卷信息（考试专用）
	 */

	/**
	 * @typedef {Object} PaperInfo
	 * @property {string} idText - 试卷编号
	 * @property {string} name - 试卷名称
	 * @property {string} markMode - 批改模式
	 * @property {number} actualExaminees - 实考人数
	 * @property {number} totalScore - 试卷总分
	 * @property {number} averageScore - 平均分
	 */

	/**
	 * @typedef {Object} Props
	 * @property {'practice' | 'exam'} type - 类型
	 * @property {BasicInfo} data - 数据
	 */

	/**
	 * @type {Props}
	 */
	let { type, data } = $props();

	// 根据类型配置显示字段
	const fieldConfigs = {
		practice: [
			{ label: '练习总分', key: 'totalScore' },
			{ label: '平均分', key: 'averageScore' },
			{ label: '作答人数', key: 'completedStudents' },
			{ label: '通过人数', key: 'passedStudents' },
			{ label: '批改方式', value: '自动批改' }
		],
		exam: [
			{ label: '考试时间', key: 'examTimeText' },
			{ label: '考试总分', key: 'totalScore' },
			{ label: '考试类型', key: 'type' },
			{ label: '考试平均分', key: 'averageScore' },
			{ label: '知识点涉及', value: '--' },
			{ label: '应考人数', key: 'totalExaminees' },
			{ label: '提交状态', key: 'submitted', isStatus: true },
			{ label: '通过人数', key: 'passExaminees' }
		]
	};

	let fields = $derived(fieldConfigs[type] || []);
	let displayName = $derived(data?.title || data?.name || '');

	/**
	 * 格式化字段值
	 * @param {Object} field - 字段配置
	 * @param {BasicInfo} data - 数据对象
	 * @returns {string} 格式化后的值
	 */
	function formatFieldValue(field, data) {
		if (field.value !== undefined) {
			return field.value;
		}

		if (field.isStatus && field.key === 'submitted') {
			return data[field.key] ? '已提交' : '未提交';
		}

		const value = data[field.key];
		return value !== undefined && value !== null ? value.toString() : '--';
	}

	/**
	 * 获取状态样式类
	 * @param {Object} field - 字段配置
	 * @param {BasicInfo} data - 数据对象
	 * @returns {string} CSS 类名
	 */
	function getStatusClass(field, data) {
		if (field.isStatus && field.key === 'submitted') {
			return data[field.key] ? 'status-success' : 'status-error';
		}
		return '';
	}
</script>

{#if data}
	<div class="info-card">
		<h1 class="title">{displayName}</h1>

		<div class="info-grid">
			{#each fields as field}
				<div class="info-item">
					<span class="label">{field.label}</span>
					<span class="value {getStatusClass(field, data)}">
						{formatFieldValue(field, data)}
					</span>
				</div>
			{/each}

			<!-- 考试特有的试卷表格 -->
			{#if type === 'exam' && data.papers && data.papers.length > 0}
				<div class="papers-wrapper">
					<div class="label">选用试卷</div>
					<div class="papers-table-container">
						<table class="papers-table">
							<thead>
								<tr>
									<th>编号</th>
									<th>试卷名</th>
									<th>批改模式</th>
									<th>实考人数</th>
									<th>总分</th>
									<th>平均分</th>
								</tr>
							</thead>
							<tbody>
								{#each data.papers as paper}
									<tr>
										<td>{paper.idText}</td>
										<td>{paper.name}</td>
										<td>{paper.markMode}</td>
										<td>{paper.actualExaminees}</td>
										<td>{paper.totalScore}</td>
										<td>{paper.averageScore != null ? paper.averageScore : '--'}</td>
									</tr>
								{/each}
							</tbody>
						</table>
					</div>
				</div>
			{/if}
		</div>
	</div>
{/if}

<style lang="scss" scoped>
	.info-card {
		width: 100%;
		height: 100%;
		margin-bottom: 40px;

		.title {
			font-size: 22px;
			font-weight: bold;
			margin-bottom: 20px;
			color: #1f2937;
		}

		.info-grid {
			display: grid;
			grid-template-columns: 60% 40%;
			gap: 16px 48px;

			.info-item {
				display: flex;
				align-items: flex-start;
				gap: 24px;

				.label {
					font-size: 14px;
					font-weight: 300;
					min-width: 80px;
					text-align: right;
					flex-shrink: 0;
					color: #6b7280;
				}

				.value {
					font-size: 14px;
					font-weight: 500;
					color: #1f2937;

					&.status-success {
						color: #10b981;
					}

					&.status-error {
						color: #ef4444;
					}
				}
			}
		}

		.papers-wrapper {
			display: flex;
			grid-column: 1 / -1;
			margin-top: 16px;

			.label {
				font-size: 14px;
				color: #6b7280;
				font-weight: 400;
				min-width: 80px;
				text-align: right;
				padding-top: 6px;
				margin-right: 24px;
				flex-shrink: 0;
			}

			.papers-table-container {
				flex: 1;

				.papers-table {
					width: 100%;
					border-collapse: collapse;
					font-size: 14px;
					background: #f9fafb;
					border-radius: 8px;
					overflow: hidden;

					th,
					td {
						text-align: center;
						padding: 12px 16px;
						white-space: nowrap;
					}

					th {
						font-weight: 500;
						background: #f3f4f6;
						color: #374151;
						border-bottom: 1px solid #e5e7eb;

						&:nth-child(1) { width: 60px; }
						&:nth-child(2) { width: 200px; }
						&:nth-child(3) { width: 100px; }
						&:nth-child(4) { width: 80px; }
						&:nth-child(5) { width: 60px; }
						&:nth-child(6) { width: 80px; }
					}

					td {
						font-weight: 400;
						color: #1f2937;
						border-bottom: 1px solid #f3f4f6;

						&:last-child {
							border-bottom: none;
						}
					}

					tbody tr:hover {
						background: #f8fafc;
					}
				}
			}
		}

		@media (max-width: 768px) {
			.info-grid {
				grid-template-columns: 1fr;
				gap: 12px;

				.info-item {
					gap: 16px;

					.label {
						min-width: 60px;
						text-align: left;
					}
				}
			}

			.papers-wrapper {
				flex-direction: column;

				.label {
					text-align: left;
					margin-bottom: 8px;
					margin-right: 0;
				}

				.papers-table-container {
					overflow-x: auto;
				}
			}
		}
	}
</style>
