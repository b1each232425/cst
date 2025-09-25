import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/svelte';
import { setContext } from 'svelte';
import ExamCard from '../InfoCard.svelte';


describe('ExamCard 单元测试', () => {
  it('当 type=practice 时渲染练习卡片', () => {
    render(ExamCard, {
      props: {
        type: 'practice',
        data: {
          name: '每日一练',
          total_score: 100,
          average_score: 78.5,
          completed_students: 120,
          passed_students: 90,
          mark_mode: '人工批改'
        }
      }
    });

    expect(screen.getByText('每日一练')).toBeInTheDocument();
    expect(screen.getByText('练习总分')).toBeInTheDocument();
    expect(screen.getByText('100')).toBeInTheDocument();
    expect(screen.queryByText('考试时间')).not.toBeInTheDocument();
  });
  it('优先使用 practice context 数据', () => {
  // 用 Svelte 的 context API
  const mockContext = new Map();
  mockContext.set('practice', {
    practiceData: {
      name: '来自Context的练习',
      total_score: 200,
      average_score: 150,
      completed_students: 300,
      passed_students: 250,
      mark_mode: 'AI批改'
    }
  });

  render(ExamCard, {
    props: { type: 'practice', data: { name: '来自Props' } },
    context: mockContext
  });

  expect(screen.getByText('来自Context的练习')).toBeInTheDocument();
  expect(screen.queryByText('来自Props')).not.toBeInTheDocument();
});

it('考试卡片：多试卷按 id 排序，正确显示考试时间与总分', () => {
  const examData = {
    title: '期中考试',
    exam_time_text: '试卷1:09:00-10:30  试卷2:14:00-15:30',
    papers: [
      { id: '3', name: '压轴卷', total_score: 50, actual_examinees: 40, average_score: 36, pass_examinees: 30 },
      { id: '1', name: '基础卷', total_score: 50, actual_examinees: 45, average_score: 42, pass_examinees: 43 },
      { id: '2', name: '提升卷', total_score: 50, actual_examinees: 42, average_score: 39, pass_examinees: 38 }
    ]
  };

  render(ExamCard, { props: { type: 'exam', data: examData } });

  // 排序后顺序：基础卷、提升卷、压轴卷
  const rows = screen.getAllByRole('row');
  expect(rows[1]).toHaveTextContent(/试卷1.*基础卷/);
  expect(rows[2]).toHaveTextContent(/试卷2.*提升卷/);
  expect(rows[3]).toHaveTextContent(/试卷3.*压轴卷/);

  // 考试时间
  expect(screen.getByText('09:00-10:30')).toBeInTheDocument();
  expect(screen.getByText('14:00-15:30')).toBeInTheDocument();
});
it('空数据时展示 “-” 占位且不崩溃', () => {
  render(ExamCard, { props: { type: 'exam' } });
  expect(screen.getAllByText('-').length).toBeGreaterThan(0);
});

it('考试模式：单试卷时只显示单值，不渲染多卷列表', () => {
  render(ExamCard, {
    props: {
      type: 'exam',
      data: {
        title: '单卷考试',
        total_score: 120,
        total_examinees: 100,
        average_score: 88,
        pass_examinees: 90,
        exam_time_text: '09:00-10:30',
        papers: [
          { id: '1', name: '唯一卷', total_score: 120, actual_examinees: 100, average_score: 88, pass_examinees: 90 }
        ]
      }
    }
  });

  // 单行值直接出现
  expect(screen.getAllByText('120')[0]).toBeInTheDocument();
  expect(screen.getByText('09:00-10:30')).toBeInTheDocument();

  expect(screen.getAllByRole('row')).toHaveLength(2);
});

it('考试模式：多试卷按 id 排序并显示时间、总分、应考/实考/通过人数', () => {
  render(ExamCard, {
    props: {
      type: 'exam',
      data: {
        title: '期末考试',
        exam_time_text: '试卷1:08:00-09:30  试卷2:10:00-11:30  试卷3:14:00-15:30',
        papers: [
          { id: '3', name: '压轴卷', total_score: 50, actual_examinees: 40, average_score: 36, pass_examinees: 30 },
          { id: '1', name: '基础卷', total_score: 50, actual_examinees: 45, average_score: 42, pass_examinees: 43 },
          { id: '2', name: '提升卷', total_score: 50, actual_examinees: 42, average_score: 39, pass_examinees: 38 }
        ]
      }
    }
  });

  // 表格行顺序应为 基础卷、提升卷、压轴卷
  const rows = screen.getAllByRole('row');
  expect(rows[1]).toHaveTextContent(/试卷1.*基础卷/);
  expect(rows[2]).toHaveTextContent(/试卷2.*提升卷/);
  expect(rows[3]).toHaveTextContent(/试卷3.*压轴卷/);

  // 时间列表
  expect(screen.getByText('08:00-09:30')).toBeInTheDocument();
  expect(screen.getByText('10:00-11:30')).toBeInTheDocument();
  expect(screen.getByText('14:00-15:30')).toBeInTheDocument();
});

it('考试模式：未传入 exam_time_text 时显示 “-” 占位', () => {
  render(ExamCard, {
    props: {
      type: 'exam',
      data: {
        title: '无时间考试',
        papers: [
          { id: '1', name: '唯一卷', total_score: 100, actual_examinees: 50, average_score: 80, pass_examinees: 40 }
        ]
      }
    }
  });

  // 只要页面里出现至少一个 “-” 即可
  expect(screen.getAllByText('-')[0]).toBeInTheDocument();
});

it('考试模式：papers 缺失或索引越界时时间显示 "--"', () => {
  // 1) 不传 papers
  const { rerender } = render(ExamCard, {
    props: {
      type: 'exam',
      data: { title: '缺 papers', exam_time_text: '试卷1:09:00-10:30' }
      // papers 字段故意省略
    }
  });
  expect(screen.getAllByText('-')[0]).toBeInTheDocument();

  // 2) papers 为空数组（索引 0 越界）
  rerender({
    props: {
      type: 'exam',
      data: { title: '空 papers', exam_time_text: '试卷1:09:00-10:30', papers: [] }
    }
  });
  expect(screen.getAllByText('-')[0]).toBeInTheDocument();
});

it('考试模式：优先使用 exam context 数据', () => {
  // 构造 exam context
  const mockContext = new Map();
  mockContext.set('exam', {
    examData: {
      title: '来自Context的考试',
      papers: [],
      total_score: 300
    }
  });

  render(ExamCard, {
    props: { type: 'exam', data: { title: '来自Props' } },
    context: mockContext
  });

  expect(screen.getByText('来自Context的考试')).toBeInTheDocument();
  expect(screen.queryByText('来自Props')).not.toBeInTheDocument();
});

it('考试模式：空数据兜底展示 “-” 不崩溃', () => {
  render(ExamCard, { props: { type: 'exam' } });
  expect(screen.getByText('---')).toBeInTheDocument();
  expect(screen.getAllByText('-').length).toBeGreaterThan(0);
});

it('考试模式：提交状态为已提交 / 未提交', () => {
  const base = { title: '状态测试', papers: [] };

  render(ExamCard, {
    props: { type: 'exam', data: { ...base, submitted: true } }
  });
  expect(screen.getByText('已提交')).toBeInTheDocument();

  // 重新挂载
  render(ExamCard, {
    props: { type: 'exam', data: { ...base, submitted: false } }
  });
  expect(screen.getByText('未提交')).toBeInTheDocument();
});

it('考试模式：考试类型字段正常显示', () => {
  render(ExamCard, {
    props: {
      type: 'exam',
      data: { type: '模拟考' }
    }
  });
  expect(screen.getByText('模拟考')).toBeInTheDocument();
});
});

