import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, waitFor, within } from '@testing-library/svelte';
import CorrectPage from '../+page@.svelte';
import { toast } from '$lib/components/Toast/Toast.js';
import { goto } from '$app/navigation';
import MessageBox from '$lib/components/MessageBox/MessageBox.js';

vi.mock('$app/navigation', () => ({ goto: vi.fn() }));
vi.mock('$app/state', () => ({
  page: {
    url: new URL('http://localhost?name=数学期末&exam_session_id=8001'),
  },
}));
vi.mock('$lib/components/Toast/Toast.js', () => ({ toast: { error: vi.fn(), success: vi.fn() } }));
vi.mock('$lib/components/MessageBox/MessageBox.js', () => ({
  default: vi.fn(({ onConfirm }) => {
    onConfirm();
  }),
}));

const MOCK_DATA = {
  question_sets: [
    {
      ID: 101,
      Order: '1',
      Score: 30,
      Name: '基础题组',
      Questions: [
        {
          ID: 1001,
          Order: 1,
          Score: 5,
          Type: '00',
          Answers: [{ index: 1, score: 5, answer: 'B', grading_rule: 'exact', alternative_answer: 'b' }],
          GroupID: 101,
          Content: '下面哪个是 JavaScript 的关键字？',
        },
      ],
    },
  ],
  student_answers: [{ QuestionID: 1001, ExamineeID: 5001, PracticeSubmissionID: 7001, Answer: ['B'] }],
  student_infos: [{ ExamineeID: 5001, OfficialName: '李四', SerialNumber: 1, PracticeSubmissionID: 7001 }],
  marking_results: [
    {
      TeacherID: 9001,
      ExamineeID: 5001,
      ExamSessionID: 8001,
      PracticeID: 9001,
      PracticeSubmissionID: 7001,
      QuestionID: 1001,
      MarkDetails: [{ Index: 1, Score: 5, Analyze: '答对了单选题。' }],
      Score: 5,
    },
  ],
};

function mockFetch(data) {
  global.fetch = vi.fn(() =>
    Promise.resolve({
      ok: true,
      json: () => Promise.resolve(data),
    }),
  );
}

describe('批改页面测试', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockFetch({
      status: 0,
      data: MOCK_DATA,
      rowCount: MOCK_DATA.student_infos.length,
    });
  });

  it('应正确渲染页面核心元素', async () => {
    render(CorrectPage);

    await waitFor(() => {
      // 验证顶部信息
      expect(screen.getByText('← 返回')).toBeInTheDocument();
      expect(screen.getByText('数学期末')).toBeInTheDocument();
      expect(screen.getByText('总人数：')).toBeInTheDocument();
      expect(screen.getByText('1')).toBeInTheDocument(); // 总人数

      // 验证模式切换开关
      expect(screen.getByText('全卷模式')).toBeInTheDocument();
      expect(screen.getByText('逐题模式')).toBeInTheDocument();

      // 验证考生信息
      expect(screen.getByText('当前考生：')).toBeInTheDocument();
      expect(screen.getByText('李四')).toBeInTheDocument();

      // 验证操作按钮
      expect(screen.getByText('上一位')).toBeInTheDocument();
      expect(screen.getByText('下一位')).toBeInTheDocument();

      // 验证题目内容
      expect(screen.getByText('1. 【基础题组】(30分)')).toBeInTheDocument();
      expect(screen.getByText('下面哪个是 JavaScript 的关键字？')).toBeInTheDocument();

      // 验证右侧总览
      expect(screen.getByText('作答总览')).toBeInTheDocument();
      expect(screen.getByText('• 未批阅')).toBeInTheDocument();
      expect(screen.getByText('• 正确')).toBeInTheDocument();
      expect(screen.getByText('基础题组 (5分/30分)')).toBeInTheDocument();
    });
  });

  describe('数据加载测试', () => {
    it('应正确加载考试数据', async () => {
      render(CorrectPage);

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith('/api/mark/details?exam_session_id=8001');
        expect(screen.getByText('李四')).toBeInTheDocument();
        expect(screen.getByText('基础题组')).toBeInTheDocument();
      });
    });

    it('加载练习数据应使用不同参数', async () => {
      page.url = new URL('http://localhost?practice_id=9001&name=数学练习');
      render(CorrectPage);

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith('/api/mark/details?practice_id=9001');
      });
    });

    it('加载失败应显示错误并返回', async () => {
      global.fetch = vi.fn(() => Promise.reject(new Error('网络错误')));
      render(CorrectPage);

      await waitFor(() => {
        expect(MessageBox).toHaveBeenCalledWith(
          expect.objectContaining({
            content: '网络错误',
            onConfirm: expect.any(Function),
          }),
        );
      });
    });

    it('无数据时应显示空状态', async () => {
      mockFetch({
        status: 0,
        data: {
          question_sets: [],
          student_answers: [],
          student_infos: [],
          marking_results: [],
        },
        rowCount: 0,
      });
      render(CorrectPage);

      await waitFor(() => {
        expect(MessageBox).toHaveBeenCalledWith(
          expect.objectContaining({
            content: '当前考试/练习没有主观题目',
          }),
        );
      });
    });
  });

  describe('考生切换功能', () => {
    beforeEach(() => {
      mockFetch({
        status: 0,
        data: {
          ...MOCK_DATA,
          student_infos: [
            ...MOCK_DATA.student_infos,
            { ExamineeID: 5002, OfficialName: '王五', SerialNumber: 2, PracticeSubmissionID: 7002 },
          ],
        },
        rowCount: 2,
      });
    });

    it('应正确切换到下一位考生', async () => {
      render(CorrectPage);

      await waitFor(() => {
        expect(screen.getByText('李四')).toBeInTheDocument();
      });

      const nextButton = screen.getByText('下一位');
      await fireEvent.click(nextButton);

      await waitFor(() => {
        expect(screen.getByText('王五')).toBeInTheDocument();
      });
    });

    it('应正确切换到上一位考生', async () => {
      render(CorrectPage);

      // 先切换到下一位
      await fireEvent.click(screen.getByText('下一位'));
      await waitFor(() => {
        expect(screen.getByText('王五')).toBeInTheDocument();
      });

      // 再切换回上一位
      const prevButton = screen.getByText('上一位');
      await fireEvent.click(prevButton);

      await waitFor(() => {
        expect(screen.getByText('李四')).toBeInTheDocument();
      });
    });

    it('第一位考生时上一位按钮应禁用', async () => {
      render(CorrectPage);

      const prevButton = screen.getByText('上一位');
      expect(prevButton).toHaveClass('is-disabled');
    });

    it('最后一位考生时下一位按钮应变为提交按钮(考试模式)', async () => {
      render(CorrectPage);

      // 切换到下一位
      await fireEvent.click(screen.getByText('下一位'));

      await waitFor(() => {
        expect(screen.getByText('提交')).toBeInTheDocument();
        expect(screen.queryByText('下一位')).not.toBeInTheDocument();
      });
    });
  });

  describe('批改模式切换', () => {
    it('应正确切换全卷模式和逐题模式', async () => {
      render(CorrectPage);

      // 初始为全卷模式
      expect(screen.getByText('1. 【基础题组】(30分)')).toBeInTheDocument();

      // 获取切换开关
      const switchInput = screen.getByRole('checkbox');
      await fireEvent.click(switchInput);

      // 切换到逐题模式
      await waitFor(() => {
        expect(screen.getByText('上一题')).toBeInTheDocument();
        expect(screen.getByText('下一题')).toBeInTheDocument();
      });
    });

    it('逐题模式下应正确切换题目', async () => {
      // 准备多题目数据
      mockFetch({
        status: 0,
        data: {
          ...MOCK_DATA,
          question_sets: [
            {
              ID: 101,
              Order: '1',
              Score: 30,
              Name: '基础题组',
              Questions: [
                {
                  ID: 1001,
                  Order: 1,
                  Score: 5,
                  Type: '00',
                  Content: '题目1',
                },
                {
                  ID: 1002,
                  Order: 2,
                  Score: 10,
                  Type: '00',
                  Content: '题目2',
                },
              ],
            },
          ],
        },
        rowCount: 1,
      });

      render(CorrectPage);

      // 切换到逐题模式
      const switchInput = screen.getByRole('checkbox');
      await fireEvent.click(switchInput);

      // 切换到下一题
      await fireEvent.click(screen.getByText('下一题'));

      await waitFor(() => {
        expect(screen.getByText('题目2')).toBeInTheDocument();
      });

      // 切换回上一题
      await fireEvent.click(screen.getByText('上一题'));

      await waitFor(() => {
        expect(screen.getByText('题目1')).toBeInTheDocument();
      });
    });
  });

  describe('批改提交功能', () => {
    it('应正确提交批改结果', async () => {
      mockFetch({ status: 0, msg: '批改提交成功' });
      render(CorrectPage);

      // 切换到考试模式最后一位考生
      await fireEvent.click(screen.getByText('下一位'));

      // 点击提交按钮
      await fireEvent.click(screen.getByText('提交'));

      await waitFor(() => {
        expect(MessageBox).toHaveBeenCalledWith(
          expect.objectContaining({
            title: '确认操作',
            content: '你确定要提交吗？',
          }),
        );

        // 确认后应调用API
        expect(global.fetch).toHaveBeenCalledWith(
          '/api/mark/results-submission?exam_session_id=8001',
          expect.anything(),
        );

        expect(toast.success).toHaveBeenCalledWith('批改提交成功');
      });
    });

    it('提交失败应显示错误提示', async () => {
      global.fetch = vi.fn(() =>
        Promise.resolve({
          ok: false,
          status: 500,
          statusText: 'Internal Server Error',
          text: () => Promise.resolve('服务器错误'),
        }),
      );
      render(CorrectPage);

      // 切换到考试模式最后一位考生
      await fireEvent.click(screen.getByText('下一位'));

      // 点击提交按钮
      await fireEvent.click(screen.getByText('提交'));

      await waitFor(() => {
        expect(toast.error).toHaveBeenCalledWith('请求失败：500 Internal Server Error-服务器错误');
      });
    });
  });

  describe('题目状态显示', () => {
    it('应正确显示题目批改状态', async () => {
      render(CorrectPage);

      await waitFor(() => {
        // 验证右侧总览中的题目状态
        const questionButton = screen.getByRole('button', { name: '1' });
        expect(questionButton).toHaveClass('right'); // 根据mock数据，此题已批改且正确
      });
    });

    it('点击题目按钮应滚动到对应题目(全卷模式)', async () => {
      // 准备多题目数据
      mockFetch({
        status: 0,
        data: {
          ...MOCK_DATA,
          question_sets: [
            {
              ID: 101,
              Order: '1',
              Score: 30,
              Name: '基础题组',
              Questions: [
                {
                  ID: 1001,
                  Order: 1,
                  Score: 5,
                  Type: '00',
                  Content: '题目1',
                },
                {
                  ID: 1002,
                  Order: 2,
                  Score: 10,
                  Type: '00',
                  Content: '题目2',
                },
              ],
            },
          ],
        },
        rowCount: 1,
      });

      render(CorrectPage);

      await waitFor(() => {
        // 模拟滚动行为
        const mockScrollIntoView = vi.fn();
        window.HTMLElement.prototype.scrollIntoView = mockScrollIntoView;

        // 点击第二个题目按钮
        const questionButton = screen.getByRole('button', { name: '2' });
        fireEvent.click(questionButton);

        expect(mockScrollIntoView).toHaveBeenCalled();
      });
    });

    it('点击题目按钮应切换到对应题目(逐题模式)', async () => {
      // 准备多题目数据
      mockFetch({
        status: 0,
        data: {
          ...MOCK_DATA,
          question_sets: [
            {
              ID: 101,
              Order: '1',
              Score: 30,
              Name: '基础题组',
              Questions: [
                {
                  ID: 1001,
                  Order: 1,
                  Score: 5,
                  Type: '00',
                  Content: '题目1',
                },
                {
                  ID: 1002,
                  Order: 2,
                  Score: 10,
                  Type: '00',
                  Content: '题目2',
                },
              ],
            },
          ],
        },
        rowCount: 1,
      });

      render(CorrectPage);

      // 切换到逐题模式
      const switchInput = screen.getByRole('checkbox');
      await fireEvent.click(switchInput);

      // 点击第二个题目按钮
      const questionButton = screen.getByRole('button', { name: '2' });
      await fireEvent.click(questionButton);

      await waitFor(() => {
        expect(screen.getByText('题目2')).toBeInTheDocument();
      });
    });
  });
});
