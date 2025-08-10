import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen } from '@testing-library/svelte';
import InfoCard from '../InfoCard.svelte';

describe('InfoCard 组件测试', () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	afterEach(() => {
		vi.restoreAllMocks();
	});

	describe('练习信息展示', () => {
		const practiceData = {
			name: '数学练习1',
			totalScore: 100,
			averageScore: 85.5,
			completedStudents: 30,
			passedStudents: 25
		};

		it('应该正确渲染练习信息', () => {
			render(InfoCard, {
				props: {
					type: 'practice',
					data: practiceData
				}
			});

			expect(screen.getByText('数学练习1')).toBeInTheDocument();
			expect(screen.getByText('练习总分')).toBeInTheDocument();
			expect(screen.getByText('100')).toBeInTheDocument();
			expect(screen.getByText('平均分')).toBeInTheDocument();
			expect(screen.getByText('85.5')).toBeInTheDocument();
			expect(screen.getByText('作答人数')).toBeInTheDocument();
			expect(screen.getByText('30')).toBeInTheDocument();
			expect(screen.getByText('通过人数')).toBeInTheDocument();
			expect(screen.getByText('25')).toBeInTheDocument();
			expect(screen.getByText('自动批改')).toBeInTheDocument();
		});

		it('应该处理空值数据', () => {
			const emptyData = {
				name: '练习2',
				totalScore: null,
				averageScore: undefined,
				completedStudents: 0,
				passedStudents: null
			};

			render(InfoCard, {
				props: {
					type: 'practice',
					data: emptyData
				}
			});

			expect(screen.getByText('练习2')).toBeInTheDocument();
			expect(screen.getAllByText('--')).toHaveLength(2); // totalScore 和 passedStudents
			expect(screen.getByText('0')).toBeInTheDocument(); // completedStudents
		});
	});

	describe('考试信息展示', () => {
		const examData = {
			title: '期中考试',
			examTimeText: '2023-12-25 10:00-12:00',
			totalScore: 120,
			type: '平时考试',
			averageScore: 92.3,
			totalExaminees: 50,
			submitted: true,
			passExaminees: 45,
			papers: [
				{
					idText: 'P001',
					name: '数学试卷A',
					markMode: '自动批改',
					actualExaminees: 48,
					totalScore: 100,
					averageScore: 85.2
				},
				{
					idText: 'P002',
					name: '数学试卷B',
					markMode: '人工批改',
					actualExaminees: 47,
					totalScore: 120,
					averageScore: null
				}
			]
		};

		it('应该正确渲染考试信息', () => {
			render(InfoCard, {
				props: {
					type: 'exam',
					data: examData
				}
			});

			expect(screen.getByText('期中考试')).toBeInTheDocument();
			expect(screen.getByText('考试时间')).toBeInTheDocument();
			expect(screen.getByText('2023-12-25 10:00-12:00')).toBeInTheDocument();
			expect(screen.getByText('考试总分')).toBeInTheDocument();
			expect(screen.getByText('120')).toBeInTheDocument();
			expect(screen.getByText('考试类型')).toBeInTheDocument();
			expect(screen.getByText('平时考试')).toBeInTheDocument();
			expect(screen.getByText('已提交')).toBeInTheDocument();
		});

		it('应该正确渲染试卷表格', () => {
			render(InfoCard, {
				props: {
					type: 'exam',
					data: examData
				}
			});

			// 检查表格标题
			expect(screen.getByText('选用试卷')).toBeInTheDocument();
			expect(screen.getByText('编号')).toBeInTheDocument();
			expect(screen.getByText('试卷名')).toBeInTheDocument();
			expect(screen.getByText('批改模式')).toBeInTheDocument();

			// 检查试卷数据
			expect(screen.getByText('P001')).toBeInTheDocument();
			expect(screen.getByText('数学试卷A')).toBeInTheDocument();
			expect(screen.getByText('自动批改')).toBeInTheDocument();
			expect(screen.getByText('85.2')).toBeInTheDocument();

			expect(screen.getByText('P002')).toBeInTheDocument();
			expect(screen.getByText('数学试卷B')).toBeInTheDocument();
			expect(screen.getByText('人工批改')).toBeInTheDocument();
			expect(screen.getAllByText('--')).toHaveLength(1); // averageScore 为 null
		});

		it('应该正确显示提交状态', () => {
			const submittedData = { ...examData, submitted: true };
			const { rerender } = render(InfoCard, {
				props: {
					type: 'exam',
					data: submittedData
				}
			});

			expect(screen.getByText('已提交')).toBeInTheDocument();
			expect(screen.getByText('已提交')).toHaveClass('status-success');

			// 测试未提交状态
			const unsubmittedData = { ...examData, submitted: false };
			rerender({
				props: {
					type: 'exam',
					data: unsubmittedData
				}
			});

			expect(screen.getByText('未提交')).toBeInTheDocument();
			expect(screen.getByText('未提交')).toHaveClass('status-error');
		});

		it('应该处理没有试卷的情况', () => {
			const dataWithoutPapers = {
				...examData,
				papers: []
			};

			render(InfoCard, {
				props: {
					type: 'exam',
					data: dataWithoutPapers
				}
			});

			expect(screen.queryByText('选用试卷')).not.toBeInTheDocument();
		});
	});

	describe('边界情况测试', () => {
		it('应该处理空数据', () => {
			render(InfoCard, {
				props: {
					type: 'practice',
					data: null
				}
			});

			// 组件应该不渲染任何内容
			expect(screen.queryByRole('heading')).not.toBeInTheDocument();
		});

		it('应该处理未知类型', () => {
			render(InfoCard, {
				props: {
					type: 'unknown',
					data: { name: '测试' }
				}
			});

			expect(screen.getByText('测试')).toBeInTheDocument();
			// 应该不显示任何字段，因为未知类型没有配置
		});

		it('应该优先显示 title 而不是 name', () => {
			const dataWithBoth = {
				name: '练习名称',
				title: '考试标题',
				totalScore: 100
			};

			render(InfoCard, {
				props: {
					type: 'exam',
					data: dataWithBoth
				}
			});

			expect(screen.getByText('考试标题')).toBeInTheDocument();
			expect(screen.queryByText('练习名称')).not.toBeInTheDocument();
		});
	});

	describe('样式和布局测试', () => {
		it('应该有正确的CSS类', () => {
			const { container } = render(InfoCard, {
				props: {
					type: 'practice',
					data: { name: '测试练习', totalScore: 100 }
				}
			});

			expect(container.querySelector('.info-card')).toBeInTheDocument();
			expect(container.querySelector('.title')).toBeInTheDocument();
			expect(container.querySelector('.info-grid')).toBeInTheDocument();
			expect(container.querySelector('.info-item')).toBeInTheDocument();
		});

		it('试卷表格应该有正确的结构', () => {
			const examData = {
				title: '测试考试',
				papers: [
					{
						idText: 'P001',
						name: '试卷1',
						markMode: '自动',
						actualExaminees: 10,
						totalScore: 100,
						averageScore: 80
					}
				]
			};

			const { container } = render(InfoCard, {
				props: {
					type: 'exam',
					data: examData
				}
			});

			expect(container.querySelector('.papers-wrapper')).toBeInTheDocument();
			expect(container.querySelector('.papers-table')).toBeInTheDocument();
			expect(container.querySelector('thead')).toBeInTheDocument();
			expect(container.querySelector('tbody')).toBeInTheDocument();
		});
	});
});
