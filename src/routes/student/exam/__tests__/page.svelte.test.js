import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, waitFor, within } from '@testing-library/svelte';
import ExamList from '../+page.svelte';
import { toast } from '$lib/components/Toast/Toast.js';
import { goto } from '$app/navigation';

vi.mock('$app/navigation', () => ({ goto: vi.fn() }));
vi.mock('$lib/components/Toast/Toast.js', () => ({ toast: { error: vi.fn() } }));

const MOCK_EXAMS = [
  {
    id: 1,
    name: '期中考试',
    exam_sessions: [
      {
        id: 101,
        paper_name: '语文试卷A',
        start_time: new Date('2025-08-01T09:00').getTime(),
        end_time: new Date('2025-08-01T11:00').getTime(),
        status: '04',
        examinee_status: '00', // 未交卷
        student_score: -1,
        total_score: 100,
      },
      {
        id: 102,
        paper_name: '数学试卷B',
        start_time: new Date('2025-08-02T09:00').getTime(),
        end_time: new Date('2025-08-02T11:00').getTime(),
        status: '02',
        examinee_status: '00', // 未交卷
        student_score: -1,
        total_score: 100,
      },
    ],
  },
  {
    id: 2,
    name: '期末考试',
    exam_sessions: [
      {
        id: 201,
        paper_name: '英语试卷C',
        start_time: new Date('2025-07-25T09:00').getTime(),
        end_time: new Date('2025-07-25T11:00').getTime(),
        status: '10',
        examinee_status: '10', // 已交卷
        student_score: 78,
        total_score: 100,
      },
    ],
  },
  {
    id: 3,
    name: '模拟考试',
    exam_sessions: [
      {
        id: 301,
        paper_name: '理综试卷D',
        start_time: new Date('2025-07-20T09:00').getTime(),
        end_time: new Date('2025-07-20T11:00').getTime(),
        status: '08',
        examinee_status: '10', // 已交卷
        student_score: -1,
        total_score: 150,
      },
    ],
  },
  {
    id: 4,
    name: '补考',
    exam_sessions: [
      {
        id: 401,
        paper_name: '数学补考试卷',
        start_time: new Date('2025-08-05T09:00').getTime(),
        end_time: new Date('2025-08-05T11:00').getTime(),
        status: '06',
        examinee_status: '04', // 补考
        student_score: 65,
        total_score: 100,
      },
    ],
  },
  {
    id: 5,
    name: '月考',
    exam_sessions: [
      {
        id: 501,
        paper_name: '语文试卷E',
        start_time: new Date('2025-07-15T09:00').getTime(),
        end_time: new Date('2025-07-15T11:00').getTime(),
        status: '10',
        examinee_status: '02', // 缺考
        student_score: 0,
        total_score: 100,
      },
      {
        id: 502,
        paper_name: '英语试卷F',
        start_time: new Date('2025-07-16T09:00').getTime(),
        end_time: new Date('2025-07-16T11:00').getTime(),
        status: '10',
        examinee_status: '06', // 作弊
        student_score: 0,
        total_score: 100,
      },
    ],
  },
  {
    id: 6,
    name: '随堂测验',
    exam_sessions: [
      {
        id: 601,
        paper_name: '物理小测',
        start_time: new Date('2025-08-03T09:00').getTime(),
        end_time: new Date('2025-08-03T09:30').getTime(),
        status: '12',
        examinee_status: '10', // 已交卷
        student_score: -1,
        total_score: 30,
      },
    ],
  },
  {
    id: 7,
    name: '分班考试',
    exam_sessions: [
      {
        id: 701,
        paper_name: '综合能力测试',
        start_time: new Date('2025-08-10T09:00').getTime(),
        end_time: new Date('2025-08-10T12:00').getTime(),
        status: '02',
        examinee_status: '00', // 未交卷
        student_score: -1,
        total_score: 200,
      },
    ],
  },
  {
    id: 8,
    name: '竞赛选拔',
    exam_sessions: [
      {
        id: 801,
        paper_name: '数学竞赛题',
        start_time: new Date('2025-07-30T09:00').getTime(),
        end_time: new Date('2025-07-30T11:00').getTime(),
        status: '10',
        examinee_status: '10', // 已交卷
        student_score: 92,
        total_score: 100,
      },
    ],
  },
  {
    id: 10,
    name: '竞赛选拔',
    exam_sessions: [
      {
        id: 801,
        paper_name: '英文竞赛题',
        start_time: new Date('2025-07-30T09:00').getTime(),
        end_time: new Date('2025-07-30T11:00').getTime(),
        status: '12',
        examinee_status: '10',
        student_score: 92,
        total_score: 100,
      },
    ],
  },
  {
    id: 9,
    name: '无场次考试',
    exam_sessions: null,
  },
];

function mockFetch(data) {
  global.fetch = vi.fn(() =>
    Promise.resolve({
      ok: true,
      json: () => Promise.resolve(data),
    }),
  );
}

describe('考试列表组件测试', () => {
  beforeEach(() => vi.clearAllMocks());

  it('应渲染页面核心元素', () => {
    render(ExamList);
    expect(screen.getByPlaceholderText('请输入信息')).toBeInTheDocument();
    expect(screen.getByTestId('date-picker')).toBeInTheDocument();
    expect(screen.getAllByPlaceholderText('请选择').length).toBeGreaterThan(0);
    expect(screen.getByRole('button', { name: '搜索' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '重置' })).toBeInTheDocument();
    expect(screen.getByRole('table')).toBeInTheDocument();
  });

  it('支持输入考试名称和选择考试状态', async () => {
    render(ExamList);
    const nameInput = screen.getByPlaceholderText('请输入信息');
    await fireEvent.input(nameInput, { target: { value: '测试考试' } });
    expect(nameInput).toHaveValue('测试考试');

    await fireEvent.click(screen.getAllByRole('button', { name: 'Toggle dropdown' })[0]);
    const examStatusSelect = screen.getByTestId('exam-status-select');
    await within(examStatusSelect).findByText('进行中').then(fireEvent.click);
    expect(examStatusSelect).toHaveTextContent('进行中');
  });

  describe('fetch功能', () => {
    it('成功加载考试数据', async () => {
      mockFetch({ status: 0, data: MOCK_EXAMS, rowCount: MOCK_EXAMS.length });
      render(ExamList);

      await waitFor(() => {
        const rows = screen.getAllByRole('row');

        const tbody = screen.getByTestId('exam-tbody');
        const dataRows = tbody.querySelectorAll('tr');

        expect(dataRows.length).toBe(MOCK_EXAMS.length);
      });
    });

    it('无数据时展示暂无信息', async () => {
      mockFetch({ status: 0 });
      render(ExamList);

      await waitFor(() => {
        expect(screen.getByText('暂无考试数据')).toBeInTheDocument();
      });
    });

    it('响应非 2xx 应提示错误（有error_text）', async () => {
      global.fetch = vi.fn(() =>
        Promise.resolve({
          ok: false,
          status: 400,
          statusText: 'Bad Request',
          text: () => Promise.resolve('请求失败'),
        }),
      );
      render(ExamList);

      await waitFor(() => {
        expect(toast.error).toHaveBeenCalledWith('请求失败：400 Bad Request-请求失败');
      });
    });

    it('响应非 2xx 应提示错误（无error_text）', async () => {
      global.fetch = vi.fn(() =>
        Promise.resolve({
          ok: false,
          status: 400,
          statusText: 'Bad Request',
          text: () => Promise.resolve(),
        }),
      );
      render(ExamList);

      await waitFor(() => {
        expect(toast.error).toHaveBeenCalledWith('请求失败：400 Bad Request');
      });
    });

    it('请求失败显示后端返回的 msg', async () => {
      mockFetch({ status: -1, msg: '模拟失败消息' });
      render(ExamList);

      await waitFor(() => {
        expect(toast.error).toHaveBeenCalledWith('模拟失败消息');
      });
    });

    it('请求失败但无 msg，使用默认错误提示', async () => {
      mockFetch({ status: -1 });
      render(ExamList);

      await waitFor(() => {
        expect(toast.error).toHaveBeenCalledWith('获取考试列表失败');
      });
    });

    it('获取的exam_list 为 0，使用默认错误提示', async () => {
      mockFetch({ status: 0, data: 0 });
      render(ExamList);

      await waitFor(() => {
        expect(toast.error).toHaveBeenCalledWith('exam_list 数据类型错误');
      });
    });
  });

  it('输入页号和页大小发送请求获取数据', async () => {
    mockFetch({
      status: 0,
      data: [...Array(15)].map((_, i) => ({
        ...MOCK_EXAMS[0],
        id: i + 1,
        name: `考试 ${i + 1}`,
      })),
      rowCount: 15,
    });

    render(ExamList);

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledTimes(1); // onMount中会发送一次请求
    });

    const input = screen.getByRole('spinbutton');
    await fireEvent.input(input, { target: { value: 2 } });
    await fireEvent.keyDown(input, { key: 'Enter', code: 'Enter', charCode: 13 }); // 发送一次请求

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledTimes(2);
    });

    const select = screen.getAllByRole('button', { name: 'Toggle dropdown' })[1];
    await screen.findByText('20条/页').then(fireEvent.click); // 发送一次请求

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledTimes(3);
    });
  });

  it('选择开始和结束日期发送请求获取数据', async () => {
    mockFetch({
      status: 0,
      data: MOCK_EXAMS,
    });

    render(ExamList);
    await fireEvent.click(within(screen.getByTestId('date-picker')).getByRole('textbox'));
    await fireEvent.click(screen.getAllByRole('button', { name: '25' })[0]);
    await fireEvent.click(screen.getAllByRole('button', { name: '26' })[2]);
    await fireEvent.click(screen.getByRole('button', { name: '确定' }));

    await fireEvent.click(screen.getByRole('button', { name: '搜索' }));

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledTimes(2);
    });
  });

  it('点击"进入考试"按钮跳转考试页', async () => {
    mockFetch({
      status: 0,
      data: [MOCK_EXAMS[0]],
    });

    render(ExamList);

    await waitFor(() => fireEvent.click(screen.getAllByText('进入考试')[0]));
    expect(goto).toHaveBeenCalledWith(expect.stringContaining('/student/answer/exam-detail?exam-id=1'));
  });

  it('点击"查看试卷"按钮跳转详情页', async () => {
    mockFetch({ status: 0, data: MOCK_EXAMS });
    render(ExamList);

    await waitFor(() => fireEvent.click(screen.getAllByText('查看试卷')[2]));
    expect(goto).toHaveBeenCalledWith('/student/answer/result/exam?exam-session-id-arr=[301]');
  });

  it('重置按钮清空所有筛选条件', async () => {
    render(ExamList);

    // 考试名称
    const nameInput = screen.getByPlaceholderText('请输入信息');
    await fireEvent.input(nameInput, { target: { value: '测试考试' } });
    expect(nameInput).toHaveValue('测试考试');

    // 考试状态
    await fireEvent.click(screen.getAllByRole('button', { name: 'Toggle dropdown' })[0]);
    const examStatusSelect = screen.getByTestId('exam-status-select');
    await within(examStatusSelect).findByText('进行中').then(fireEvent.click);
    expect(examStatusSelect).toHaveTextContent('进行中');

    // 日期选择
    await fireEvent.click(within(screen.getByTestId('date-picker')).getByRole('textbox'));
    await fireEvent.click(screen.getAllByRole('button', { name: '28' })[0]);
    await fireEvent.click(screen.getAllByRole('button', { name: '28' })[2]);
    await fireEvent.click(screen.getByRole('button', { name: '确定' }));
    const input = within(screen.getByTestId('date-picker')).getByRole('textbox'); // 或 'input' 也行
    const value = input.value;
    expect(value).toMatch(/28.*28/); // 判断字符串里有两个28，且第二个28在第一个之后

    await fireEvent.click(screen.getByRole('button', { name: '重置' }));

    const dropdownInput = within(screen.getByTestId('exam-status-select')).getByRole('textbox');
    expect(nameInput).toHaveValue('');
    expect(dropdownInput).toHaveValue('全部');
    expect(screen.getByDisplayValue(/开始日期/)).toBeInTheDocument();
    expect(screen.getByDisplayValue(/结束日期/)).toBeInTheDocument();
  });

  it('获取到考生状态是“未知状态”', async () => {
    mockFetch({
      status: 0,
      data: [
        {
          id: 8,
          name: '竞赛选拔',
          exam_sessions: [
            {
              id: 444,
              paper_name: '数学竞赛题',
              start_time: new Date('2025-07-30T09:00').getTime(),
              end_time: new Date('2025-07-30T11:00').getTime(),
              status: '10',
              examinee_status: '22',
              student_score: 92,
              total_score: 100,
            },
          ],
        },
      ],
    });
    render(ExamList);

    await waitFor(() => {
      expect(screen.queryByText('未知状态')).toBeInTheDocument();
    });
  });

  it('获取到场次状态是“未知状态”', async () => {
    mockFetch({
      status: 0,
      data: [
        {
          id: 8,
          name: '竞赛选拔',
          exam_sessions: [
            {
              id: 444,
              paper_name: '数学竞赛题',
              start_time: new Date('2025-07-30T09:00').getTime(),
              end_time: new Date('2025-07-30T11:00').getTime(),
              status: '22',
              examinee_status: '10',
              student_score: 92,
              total_score: 100,
            },
          ],
        },
      ],
    });
    render(ExamList);

    await waitFor(() => {
      expect(screen.queryByText('未知状态')).toBeInTheDocument();
    });
  });
});
