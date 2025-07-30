import { describe, it, expect, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/svelte';
import ExamScorePage from '../+page.svelte';

// --- 核心步骤：模拟 API 模块 ---
vi.mock('../../_api/score.js', () => {
	// 这是我们的模拟数据
	const mockExams = [
		{
			id: 1,
			name: '期中模拟考试',
			type: '00',
			submitted: false,
			sessions: [
				{
					id: 101,
					paper_name: '数学第一卷',
					start_time: '2024-08-01 09:00',
					end_time: '2024-08-01 11:00',
					total_score: 150,
					average_score: 98.5,
					scheduled_examinees: 50,
					actual_examinees: 48,
					pass_examinees: 45
				}
			]
		},
		{
			id: 2,
			name: '单元测验',
			type: '04',
			submitted: true,
			sessions: [
				{
					id: 102,
					paper_name: '物理力学部分',
					start_time: '2024-08-02 14:00',
					end_time: '2024-08-02 15:00',
					total_score: 100,
					average_score: 85.0,
					scheduled_examinees: 50,
					actual_examinees: 50,
					pass_examinees: 48
				}
			]
		}
	];

	// 返回一个对象，这个对象的结构必须和真实的 _api/score.js 完全一样
	return {
		getExams: vi.fn().mockResolvedValue({
			data: mockExams,
			row_count: mockExams.length
		}),
		// 其他在这个模块中导出的函数，如果测试中用不到，可以简单模拟
		submitExamGrades: vi.fn(),
		getExamineeGradeList: vi.fn(),
		getGradeLogs: vi.fn(),
		getPractices: vi.fn(),
		exportPracticeGrades: vi.fn()
	};
});

// --- 测试套件 ---
describe('考试成绩管理页面 (ExamScoreManagement Page)', () => {
	it('应该能够成功渲染模拟的考试列表数据', async () => {
		// 1. 渲染组件
		render(ExamScorePage);

		// 2. 断言：等待并检查模拟数据是否已显示在屏幕上
		// 因为数据是在 $effect 中异步获取的，所以我们需要用 findBy* 方法来等待UI更新
		expect(await screen.findByText('期中模拟考试')).not.toBeNull();
		expect(await screen.findByText('单元测验')).not.toBeNull();
		
		// 也可以检查更具体的内容
		// 注意：对于布尔值或数字，需要确保它们以文本形式渲染
		expect(await screen.findByText('已提交')).not.toBeNull();
		expect(await screen.findByText('未提交')).not.toBeNull();

		// 检查一个子项是否被渲染
		await waitFor(() => {
			expect(screen.getByText('数学第一卷')).not.toBeNull();
		});
	});
}); 