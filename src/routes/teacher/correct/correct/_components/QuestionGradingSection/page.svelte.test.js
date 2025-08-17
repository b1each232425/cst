import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, fireEvent } from '@testing-library/svelte';
import QuestionGradingSection from './index.svelte';

describe('QuestionGradingSection 组件测试', () => {
  const BASE_PROPS = {
    question: {
      ID: 123,
      Order: 1,
      Type: '06', // 填空题
      Content: '<p>2 + 2等于多少？</p>',
      Score: 5,
      Answers: [
        {
          index: 1,
          score: 2,
          answer: '4',
          alternative_answer: '四',
          grading_rule: '必须是准确的数字或汉字',
        },
        {
          index: 2,
          score: 3,
          answer: '4',
          alternative_answer: null,
          grading_rule: '必须是准确的数字',
        },
      ],
    },
    student: { id: 's1', name: '张三' },
    answer_object: {
      answer: ['4', '4.0'],
    },
    old_mark_result: [
      { Index: 1, Score: 2 },
      { Index: 2, Score: 1 },
    ],
  };

  it('应正确渲染题目题干和评分输入框，且具有正确的 ID', () => {
    const { getByTestId, getByText, getAllByPlaceholderText } = render(QuestionGradingSection, { props: BASE_PROPS });

    const section = getByTestId('question-section');
    expect(section.id).toBe(`question-123`);

    expect(getByText('1.')).toBeInTheDocument();
    expect(getByText('填空题')).toBeInTheDocument();
    expect(getByText('(5分)')).toBeInTheDocument();
    expect(getByText('2 + 2等于多少？')).toBeInTheDocument();

    expect(getByText('得分：')).toBeInTheDocument();
    const inputs = getAllByPlaceholderText('输入得分');
    expect(inputs).toHaveLength(2);
    expect(getByText(/(2分)/)).toBeInTheDocument();
    expect(getByText(/(3分)/)).toBeInTheDocument();
  });

  it('应正确显示学生答案', () => {
    const { getByText } = render(QuestionGradingSection, { props: BASE_PROPS });

    expect(getByText('学生作答：')).toBeInTheDocument();
    expect(getByText('4', { selector: '.answer-content' })).toBeInTheDocument();
    expect(getByText('4.0', { selector: '.answer-content' })).toBeInTheDocument();
  });

  it('应显示已有批改分数的输入框', () => {
    const { getAllByPlaceholderText } = render(QuestionGradingSection, { props: BASE_PROPS });

    const inputs = getAllByPlaceholderText('输入得分');
    expect(inputs).toHaveLength(2);
    expect(inputs[0]).toHaveValue(2);
    expect(inputs[1]).toHaveValue(1);
  });

  it('应显示批改规则和答案', () => {
    const { getByText, getAllByText } = render(QuestionGradingSection, { props: BASE_PROPS });

    expect(getByText('【批改规则/提示词】')).toBeInTheDocument();
    expect(getAllByText('4')).toHaveLength(2);
    expect(getByText(/四/)).toBeInTheDocument();

    expect(getByText('【答案】')).toBeInTheDocument();
    expect(getByText('必须是准确的数字或汉字')).toBeInTheDocument();
    expect(getByText('必须是准确的数字')).toBeInTheDocument();
  });

  it('应正确处理分数变更事件', async () => {
    const mockSave = vi.fn();

    const { getAllByPlaceholderText } = render(QuestionGradingSection, {
      props: { ...BASE_PROPS, onSaveMark: mockSave },
    });

    const inputs = getAllByPlaceholderText('输入得分');

    // 修改第一个输入框
    await fireEvent.input(inputs[0], { target: { value: '1' } });
    expect(inputs[0]).toHaveValue(1);

    // 验证保存事件被触发
    expect(mockSave).toHaveBeenCalledTimes(1);
    expect(mockSave).toHaveBeenCalledWith({
      question_id: 123,
      new_mark_result: [
        { Index: 1, Score: 1 },
        { Index: 2, Score: 1 },
      ],
      total_score: 2,
    });
  });

  it('当输入不完整时不应保存', async () => {
    const mockSave = vi.fn();

    const { getAllByPlaceholderText } = render(QuestionGradingSection, {
      props: {
        ...BASE_PROPS,
        old_mark_result: [], // 初始无批改记录
        onSaveMark: mockSave,
      },
    });

    const inputs = getAllByPlaceholderText('输入得分');

    await fireEvent.input(inputs[0], { target: { value: '2' } });
    expect(inputs[0]).toHaveValue(2);

    // 验证保存事件未被触发
    expect(mockSave).not.toHaveBeenCalled();
  });

  it('应将分数限制在最大可能值内', async () => {
    const { getAllByPlaceholderText } = render(QuestionGradingSection, { props: BASE_PROPS });

    const inputs = getAllByPlaceholderText('输入得分');

    // 尝试输入超过最大值的分数
    await fireEvent.input(inputs[0], { target: { value: '5' } });
    expect(inputs[0]).toHaveValue(2); // 第一部分最大2分

    await fireEvent.input(inputs[1], { target: { value: '5' } });
    expect(inputs[1]).toHaveValue(3); // 第二部分最大3分
  });

  it('应阻止负分数输入', async () => {
    const { getAllByPlaceholderText } = render(QuestionGradingSection, { props: BASE_PROPS });

    const inputs = getAllByPlaceholderText('输入得分');

    // 尝试输入负数
    await fireEvent.input(inputs[0], { target: { value: '-1' } });
    expect(inputs[0]).toHaveValue(null); // 应被清空
  });

  it('应正确处理单空问题', () => {
    const props = {
      ...BASE_PROPS,
      question: {
        ...BASE_PROPS.question,
        Type: '06',
        Answers: [{ index: 1, score: 5, answer: 'A', grading_rule: '只有A是正确的' }],
      },
      answer_object: {
        answer: ['A'],
      },
      old_mark_result: [{ Index: 1, Score: 5 }],
    };

    const { queryByText, getByPlaceholderText } = render(QuestionGradingSection, { props });

    // 对于单答案题目不应显示(1)前缀
    expect(queryByText('(1)')).not.toBeInTheDocument();
    expect(getByPlaceholderText('输入得分')).toBeInTheDocument();
  });

  it('应正确处理删除分数输入', async () => {
    const mockSave = vi.fn();

    const { getAllByPlaceholderText } = render(QuestionGradingSection, {
      props: { ...BASE_PROPS, onSaveMark: mockSave },
    });

    const inputs = getAllByPlaceholderText('输入得分');

    // 清空第一个输入框
    await fireEvent.input(inputs[0], { target: { value: '' } });
    expect(inputs[0]).toHaveValue(null);

    // 验证保存事件未被触发
    expect(mockSave).not.toHaveBeenCalled();
  });

  it('应正确渲染不同题型', () => {
    const props = {
      ...BASE_PROPS,
      question: {
        ...BASE_PROPS.question,
        Type: '08', // 简答题
        Content: '<p>请简述你的观点</p>',
        Answers: [{ index: 1, score: 5, grading_rule: '按点给分' }],
      },
      answer_object: {
        answer: ['这是一个简答题的回答'],
      },
      old_mark_result: [{ Index: 1, Score: 3 }],
    };

    const { getByText } = render(QuestionGradingSection, { props });

    expect(getByText('简答题')).toBeInTheDocument();
    expect(getByText('请简述你的观点')).toBeInTheDocument();
    expect(getByText('这是一个简答题的回答', { selector: '.answer-content' })).toBeInTheDocument();
  });
});
