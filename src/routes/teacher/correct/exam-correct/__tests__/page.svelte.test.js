import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, waitFor, within } from '@testing-library/svelte';
import ExamCorrectList from '../+page.svelte';
import { toast } from '$lib/components/Toast/Toast.js';
import { goto } from '$app/navigation';
import MessageBox from '$lib/components/MessageBox/MessageBox.js';

vi.mock('$app/navigation', () => ({ goto: vi.fn() }));
vi.mock('$lib/components/Toast/Toast.js', () => ({ toast: { error: vi.fn(), success: vi.fn() } }));
vi.mock('$lib/components/MessageBox/MessageBox.js', () => ({
  default: vi.fn(({ onConfirm }) => {
    onConfirm();
  }),
}));

const MOCK_EXAMS = [
  {
    id: 1,
    name: '数学期末',
    type: '00',
    exam_sessions: [
      {
        id: 11,
        name: '数学考试A',
        start_time: new Date('2025-08-01T09:00').getTime(),
        end_time: new Date('2025-08-01T11:00').getTime(),
        mark_mode: '02',
        respondent_count: 12,
        unmarked_student_count: 10,
        status: '06',
        mark_status: '00',
      },
      {
        id: 12,
        name: '数学考试B',
        start_time: new Date('2025-08-01T13:00').getTime(),
        end_time: new Date('2025-08-01T15:00').getTime(),
        mark_mode: '02',
        respondent_count: 10,
        unmarked_student_count: 5,
        status: '10',
        mark_status: '01',
      },
      {
        id: 13,
        name: '数学考试C',
        start_time: new Date('2025-08-01T16:00').getTime(),
        end_time: new Date('2025-08-01T18:00').getTime(),
        mark_mode: '02',
        respondent_count: 15,
        unmarked_student_count: 0,
        status: '08',
        mark_status: '02',
      },
    ],
  },
  {
    id: 2,
    name: '语文期中',
    type: '00',
    exam_sessions: [
      {
        id: 21,
        name: '语文考试A',
        start_time: new Date('2025-08-02T09:00').getTime(),
        end_time: new Date('2025-08-02T11:00').getTime(),
        mark_mode: '10',
        respondent_count: 15,
        unmarked_student_count: 0,
        status: '10',
        mark_status: '02',
      },
      {
        id: 22,
        name: '语文考试B',
        start_time: new Date('2025-08-02T12:00').getTime(),
        end_time: new Date('2025-08-02T14:00').getTime(),
        mark_mode: '10',
        respondent_count: 20,
        unmarked_student_count: 10,
        status: '08',
        mark_status: '00',
      },
    ],
  },
  {
    id: 3,
    name: '英语模拟',
    type: '02',
    exam_sessions: [
      {
        id: 31,
        name: '英语考试A',
        start_time: new Date('2025-08-03T09:00').getTime(),
        end_time: new Date('2025-08-03T11:00').getTime(),
        mark_mode: '00',
        respondent_count: 8,
        unmarked_student_count: 3,
        status: '08',
        mark_status: '00',
      },
      {
        id: 32,
        name: '英语考试B',
        start_time: new Date('2025-08-03T12:00').getTime(),
        end_time: new Date('2025-08-03T14:00').getTime(),
        mark_mode: '00',
        respondent_count: 10,
        unmarked_student_count: 0,
        status: '10',
        mark_status: '02',
      },
      {
        id: 33,
        name: '英语考试C',
        start_time: new Date('2025-08-03T15:00').getTime(),
        end_time: new Date('2025-08-03T17:00').getTime(),
        mark_mode: '00',
        respondent_count: 12,
        unmarked_student_count: 0,
        status: '10',
        mark_status: '01',
      },
    ],
  },
  {
    id: 4,
    name: '物理测试',
    type: '01',
    exam_sessions: [
      {
        id: 41,
        name: '物理考试A',
        start_time: new Date('2025-08-04T09:00').getTime(),
        end_time: new Date('2025-08-04T11:00').getTime(),
        mark_mode: '01',
        respondent_count: 18,
        unmarked_student_count: 4,
        status: '06',
        mark_status: '00',
      },
      {
        id: 42,
        name: '物理考试B',
        start_time: new Date('2025-08-04T12:00').getTime(),
        end_time: new Date('2025-08-04T14:00').getTime(),
        mark_mode: '01',
        respondent_count: 20,
        unmarked_student_count: 0,
        status: '10',
        mark_status: '02',
      },
    ],
  },
  {
    id: 5,
    name: '物理测试C',
    type: '01',
    exam_sessions: [
      {
        id: 411,
        name: '物理考试A',
        start_time: new Date('2025-08-04T09:00').getTime(),
        end_time: new Date('2025-08-04T11:00').getTime(),
        mark_mode: '01',
        respondent_count: 18,
        unmarked_student_count: 4,
        status: '88',
        mark_status: '00',
      },
    ],
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

describe('考试批改列表组件测试', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockFetch({
      status: 0,
      data: {
        exam_list: MOCK_EXAMS,
      },
      rowCount: MOCK_EXAMS.length,
    });
  });

  it('应渲染页面核心元素', () => {
    render(ExamCorrectList);

    expect(screen.getByPlaceholderText('请输入信息')).toBeInTheDocument();
    expect(screen.getByTestId('date-picker')).toBeInTheDocument();

    // 验证表头
    const tableHeaders = screen.getAllByRole('columnheader');
    expect(tableHeaders).toHaveLength(10);
    expect(tableHeaders[0]).toHaveTextContent('考试名称');
    expect(tableHeaders[1]).toHaveTextContent('考试类型');
    expect(tableHeaders[2]).toHaveTextContent('考试场次');
    expect(tableHeaders[3]).toHaveTextContent('考试时间');
    expect(tableHeaders[4]).toHaveTextContent('考试状态');
    expect(tableHeaders[5]).toHaveTextContent('作答人数');
    expect(tableHeaders[6]).toHaveTextContent('待批改数');
    expect(tableHeaders[7]).toHaveTextContent('批阅方式');
    expect(tableHeaders[8]).toHaveTextContent('批改状态');
    expect(tableHeaders[9]).toHaveTextContent('操作');
  });

  describe('搜索功能', () => {
    it('输入考试名称应触发搜索', async () => {
      render(ExamCorrectList);

      const input = screen.getByPlaceholderText('请输入信息');
      await fireEvent.input(input, { target: { value: '数学' } });

      // 等待防抖
      await new Promise((resolve) => setTimeout(resolve, 600));

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith(expect.stringContaining('exam_name=数学'));
      });
    });

    it('快速输入应只触发一次搜索(防抖)', async () => {
      render(ExamCorrectList);

      const input = screen.getByPlaceholderText('请输入信息');

      // 快速输入多个字符
      await fireEvent.input(input, { target: { value: '数' } });
      await fireEvent.input(input, { target: { value: '数学' } });
      await fireEvent.input(input, { target: { value: '数学期' } });
      await fireEvent.input(input, { target: { value: '数学期末' } });

      // 等待防抖时间
      await new Promise((resolve) => setTimeout(resolve, 600));

      await waitFor(() => {
        // 初始加载一次 + 防抖后一次
        expect(global.fetch).toHaveBeenCalledTimes(2);
        expect(global.fetch).toHaveBeenLastCalledWith(expect.stringContaining('exam_name=数学期末'));
      });
    });

    it('选择日期应触发搜索', async () => {
      render(ExamCorrectList);

      await fireEvent.click(within(screen.getByTestId('date-picker')).getByRole('textbox'));
      await fireEvent.click(screen.getAllByRole('button', { name: '27' })[0]);
      await fireEvent.click(screen.getAllByRole('button', { name: '28' })[2]);
      await fireEvent.click(screen.getByRole('button', { name: '确定' }));

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledTimes(2);
      });
    });

    it('清空日期应触发搜索', async () => {
      render(ExamCorrectList);

      await fireEvent.click(within(screen.getByTestId('date-picker')).getByRole('textbox'));
      await fireEvent.click(screen.getAllByRole('button', { name: '25' })[0]);
      await fireEvent.click(screen.getAllByRole('button', { name: '26' })[2]);
      await fireEvent.click(screen.getByRole('button', { name: '确定' }));

      await fireEvent.click(within(screen.getByTestId('date-picker')).getByRole('textbox'));
      await fireEvent.click(screen.getByRole('button', { name: '清除' }));

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledTimes(3);
      });
    });
  });

  describe('分页功能', () => {
    beforeEach(() => {
      mockFetch({
        status: 0,
        data: {
          exam_list: [...Array(15)].map((_, i) => ({
            ...MOCK_EXAMS[0],
            id: i + 1,
            name: `考试 ${i + 1}`,
          })),
        },
        rowCount: 15,
      });
    });

    it('改变页码应触发新的请求', async () => {
      render(ExamCorrectList);

      const input = screen.getByRole('spinbutton');
      await fireEvent.input(input, { target: { value: 2 } });
      await fireEvent.keyDown(input, { key: 'Enter', code: 'Enter', charCode: 13 });

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith(expect.stringContaining('page=2'));
      });
    });

    it('改变每页数量应触发新的请求', async () => {
      render(ExamCorrectList);

      await fireEvent.click(screen.getByRole('button', { name: 'Toggle dropdown' }));
      await fireEvent.click(screen.getByText('20条/页'));

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith(expect.stringContaining('page_size=20'));
      });
    });
  });

  describe('操作按钮', () => {
    beforeEach(() => {
      render(ExamCorrectList);
    });

    it('可批改的考试应显示可点击的"进入批改"按钮', async () => {
      await waitFor(() => {
        const button = screen.getAllByRole('button', { name: '进入批改' })[0];
        expect(button).not.toHaveAttribute('disabled');
      });
    });

    it('自动批改的考试应显示禁用的"进入批改"按钮', async () => {
      await waitFor(() => {
        const row = screen.getByText('英语模拟').closest('tr');
        const button = within(row).getAllByRole('button', { name: '进入批改' })[0];
        expect(button).toHaveAttribute('disabled');
      });
    });

    it('点击"进入批改"应跳转到批改页面', async () => {
      await waitFor(() => {
        const button = screen.getAllByRole('button', { name: '进入批改' })[0];
        fireEvent.click(button);
        expect(goto).toHaveBeenCalledWith(
          '/teacher/correct/correct?name=数学期末&exam_session_name=数学考试A&exam_session_id=11',
        );
      });
    });

    describe('提交考试批改功能', () => {
      beforeEach(() => {
        render(ExamCorrectList);
      });

      it('可提交的按钮应启用且点击触发确认框', async () => {
        const submitButtons = screen.getAllByRole('button', { name: '提交' });

        // 获取第三个按钮（应为启用状态）
        const enabledButton = submitButtons[2];
        await expect(enabledButton).not.toBeDisabled();
        await fireEvent.click(enabledButton);

        // 验证MessageBox被正确调用
        await expect(MessageBox).toHaveBeenCalledTimes(1); // 确保只调用一次 // waitFor 可能导致次数不是一次（循环等待）
        await expect(MessageBox).toHaveBeenCalledWith({
          title: '确认操作',
          content: '批改完后才能提交，你确定要提交吗？',
          onConfirm: expect.any(Function),
        });
      });

      it('不可提交的按钮应禁用且点击无效', async () => {
        const submitButtons = screen.getAllByRole('button', { name: '提交' });

        // 获取第一个按钮（应为禁用状态）
        const disabledButton = submitButtons[0];
        await expect(disabledButton).toBeDisabled();
      });

      it('确认提交后应调用API并显示成功提示', async () => {
        mockFetch({ status: 0 });

        await waitFor(() => {
          const submitButtons = screen.getAllByRole('button', { name: '提交' });
          fireEvent.click(submitButtons[2]);
        });

        await waitFor(() => {
          expect(global.fetch).toHaveBeenCalledWith(
            expect.stringContaining('/api/mark/results-submission?exam_session_id=13'),
            { method: 'PATCH' },
          );
          expect(toast.success).toHaveBeenCalledWith('提交成功');
        });
      });

      it('提交失败应显示错误提示（有error_text）', async () => {
        global.fetch = vi.fn(() =>
          Promise.resolve({
            ok: false,
            status: 400,
            statusText: 'Bad Request',
            text: () => Promise.resolve('批改数据不完整'),
          }),
        );

        await waitFor(() => {
          const submitButtons = screen.getAllByRole('button', { name: '提交' });
          fireEvent.click(submitButtons[2]);
        });

        await waitFor(() => {
          expect(toast.error).toHaveBeenCalledWith('请求失败：400 Bad Request-批改数据不完整');
        });
      });

      it('提交失败应显示错误提示（无error_text）', async () => {
        global.fetch = vi.fn(() =>
          Promise.resolve({
            ok: false,
            status: 500,
            statusText: 'Internal Server Error',
            text: () => Promise.resolve(),
          }),
        );

        await waitFor(() => {
          const submitButtons = screen.getAllByRole('button', { name: '提交' });
          fireEvent.click(submitButtons[2]);
        });

        await waitFor(() => {
          expect(toast.error).toHaveBeenCalledWith('请求失败：500 Internal Server Error');
        });
      });

      it('提交失败应显示后端返回的错误消息', async () => {
        global.fetch = vi.fn(() =>
          Promise.resolve({
            ok: true,
            json: () => Promise.resolve({ status: -1, msg: '批改未完成' }),
          }),
        );

        await waitFor(() => {
          const submitButtons = screen.getAllByRole('button', { name: '提交' });
          fireEvent.click(submitButtons[2]);
        });

        await waitFor(() => {
          expect(toast.error).toHaveBeenCalledWith('批改未完成');
        });
      });

      it('提交失败但无错误消息时应显示默认提示', async () => {
        global.fetch = vi.fn(() =>
          Promise.resolve({
            ok: true,
            json: () => Promise.resolve({ status: -1 }),
          }),
        );

        await waitFor(() => {
          const submitButtons = screen.getAllByRole('button', { name: '提交' });
          fireEvent.click(submitButtons[2]);
        });

        await waitFor(() => {
          expect(toast.error).toHaveBeenCalledWith('提交失败');
        });
      });

      it('网络错误时应显示错误提示', async () => {
        global.fetch = vi.fn(() => Promise.reject(new Error('网络连接失败')));

        await waitFor(() => {
          const submitButtons = screen.getAllByRole('button', { name: '提交' });
          fireEvent.click(submitButtons[2]);
        });

        await waitFor(() => {
          expect(toast.error).toHaveBeenCalledWith('网络连接失败');
        });
      });
    });
  });

  describe('错误处理和类型判断', () => {
    describe('fetch请求错误处理', () => {
      it('非2xx响应应显示错误提示（有error_text）', async () => {
        global.fetch = vi.fn(() =>
          Promise.resolve({
            ok: false,
            status: 400,
            statusText: 'Bad Request',
            text: () => Promise.resolve('具体错误详情'),
          }),
        );

        render(ExamCorrectList);

        await waitFor(() => {
          expect(toast.error).toHaveBeenCalledWith('请求失败：400 Bad Request-具体错误详情');
          expect(screen.getByText('暂无考试数据')).toBeInTheDocument();
        });
      });

      it('非2xx响应应显示错误提示（无error_text）', async () => {
        global.fetch = vi.fn(() =>
          Promise.resolve({
            ok: false,
            status: 500,
            statusText: 'Internal Server Error',
            text: () => Promise.resolve(),
          }),
        );

        render(ExamCorrectList);

        await waitFor(() => {
          expect(toast.error).toHaveBeenCalledWith('请求失败：500 Internal Server Error');
          expect(screen.getByText('暂无考试数据')).toBeInTheDocument();
        });
      });

      it('网络错误应捕获并提示', async () => {
        global.fetch = vi.fn(() => Promise.reject(new Error('网络连接失败')));

        render(ExamCorrectList);

        await waitFor(() => {
          expect(toast.error).toHaveBeenCalledWith('网络连接失败');
          expect(screen.getByText('暂无考试数据')).toBeInTheDocument();
        });
      });
    });

    describe('后端返回数据处理', () => {
      it('后端返回错误状态应显示错误消息', async () => {
        mockFetch({
          status: -1,
          msg: '数据库查询失败',
        });

        render(ExamCorrectList);

        await waitFor(() => {
          expect(toast.error).toHaveBeenCalledWith('数据库查询失败');
          expect(screen.getByText('暂无考试数据')).toBeInTheDocument();
        });
      });

      it('后端返回错误状态但无msg应显示默认错误', async () => {
        mockFetch({
          status: -1,
        });

        render(ExamCorrectList);

        await waitFor(() => {
          expect(toast.error).toHaveBeenCalledWith('获取考试列表失败');
          expect(screen.getByText('暂无考试数据')).toBeInTheDocument();
        });
      });
    });

    describe('数据类型判断', () => {
      it('exam_list为null时应显示空状态', async () => {
        mockFetch({
          status: 0,
          data: {
            exam_list: null,
          },
          rowCount: 0,
        });

        render(ExamCorrectList);

        await waitFor(() => {
          expect(toast.error).not.toHaveBeenCalled();
          expect(screen.getByText('暂无考试数据')).toBeInTheDocument();
        });
      });

      it('exam_list为非数组时应显示错误', async () => {
        mockFetch({
          status: 0,
          data: {
            exam_list: 'invalid data',
          },
          rowCount: 0,
        });

        render(ExamCorrectList);

        await waitFor(() => {
          expect(toast.error).toHaveBeenCalledWith('exam_list 数据类型错误');
          expect(screen.getByText('暂无考试数据')).toBeInTheDocument();
        });
      });

      it('exam_list为0时应显示错误', async () => {
        mockFetch({
          status: 0,
          data: {
            exam_list: 0,
          },
          rowCount: 0,
        });

        render(ExamCorrectList);

        await waitFor(() => {
          expect(toast.error).toHaveBeenCalledWith('exam_list 数据类型错误');
          expect(screen.getByText('暂无考试数据')).toBeInTheDocument();
        });
      });

      it('exam_sessions为null时应显示空场次', async () => {
        mockFetch({
          status: 0,
          data: {
            exam_list: [
              {
                id: 1,
                name: '测试考试',
                type: '00',
                exam_sessions: null,
              },
            ],
          },
          rowCount: 1,
        });

        render(ExamCorrectList);

        await waitFor(() => {
          expect(toast.error).not.toHaveBeenCalled();
          const row = screen.getByText('测试考试').closest('tr');
          // 验证场次列为空
          expect(within(row).queryByText(/考试场次/)).toBeNull();
        });
      });

      // it('exam_sessions为非数组时应显示错误', async () => {
      //   mockFetch({
      //     status: 0,
      //     data: {
      //       exam_list: [
      //         {
      //           id: 1,
      //           name: '测试考试',
      //           type: '00',
      //           exam_sessions: 'invalid data',
      //         },
      //       ],
      //     },
      //     rowCount: 1,
      //   });

      //   render(ExamCorrectList);

      //   await waitFor(() => {
      //     expect(toast.error).toHaveBeenCalledWith('exam_sessions 数据类型错误');
      //     expect(screen.getByText('暂无考试数据')).toBeInTheDocument();
      //   });
      // });
    });

    describe('空数据处理', () => {
      it('无数据时应显示空状态提示', async () => {
        mockFetch({
          status: 0,
          data: {
            exam_list: [],
          },
          rowCount: 0,
        });

        render(ExamCorrectList);

        await waitFor(() => {
          expect(screen.getByText('暂无考试数据')).toBeInTheDocument();
        });
      });

      it('有数据但所有场次为空时应显示空状态', async () => {
        mockFetch({
          status: 0,
          data: {
            exam_list: [
              {
                id: 1,
                name: '空场次考试',
                type: '00',
                exam_sessions: [],
              },
            ],
          },
          rowCount: 1,
        });

        render(ExamCorrectList);

        await waitFor(() => {
          expect(screen.getByText('空场次考试')).toBeInTheDocument();
          const row = screen.getByText('空场次考试').closest('tr');
          // 验证场次列为空
          expect(within(row).queryByText(/考试场次/)).toBeNull();
        });
      });

      it('rowCount 没有返回，应默认为0', async () => {
        mockFetch({
          status: 0,
          data: {
            exam_list: null,
          },
        });

        render(ExamCorrectList);

        await waitFor(() => {
          expect(screen.getByText('暂无考试数据')).toBeInTheDocument();
        });
      });
    });
  });

  describe('状态映射', () => {
    it('应正确映射考试类型', async () => {
      render(ExamCorrectList);

      await waitFor(() => {
        // 验证数学期末的类型映射
        const mathRow = screen.getByText('数学期末').closest('tr');
        expect(within(mathRow).getByText('平时考试')).toBeInTheDocument();

        // 验证英语模拟的类型映射
        const englishRow = screen.getByText('英语模拟').closest('tr');
        expect(within(englishRow).getByText('期末考试')).toBeInTheDocument();

        // 验证物理测试的类型映射(未知类型)
        const physicsRow = screen.getByText('物理测试').closest('tr');
        expect(within(physicsRow).getByText('未知类型')).toBeInTheDocument();
      });
    });

    it('应正确映射批阅方式', async () => {
      render(ExamCorrectList);

      await waitFor(() => {
        const mathRow = screen.getByText('数学期末').closest('tr');
        expect(within(mathRow).getAllByText('全卷多评')).toHaveLength(3);

        const chineseRow = screen.getByText('语文期中').closest('tr');
        expect(within(chineseRow).getAllByText('单人批改')).toHaveLength(2);

        const englishRow = screen.getByText('英语模拟').closest('tr');
        expect(within(englishRow).getAllByText('自动批改')).toHaveLength(3);

        const unknownRow = screen.getByText('物理测试').closest('tr');
        expect(within(unknownRow).getAllByText('未知状态')).toHaveLength(2);
      });
    });

    it('应正确映射考试状态', async () => {
      render(ExamCorrectList);

      await waitFor(() => {
        // 验证已结束状态
        const endedRow = screen.getByText('数学考试A').closest('tr');
        expect(within(endedRow).getByText('已结束')).toBeInTheDocument();

        // 验证已批改状态
        const markedRow = screen.getByText('语文考试A').closest('tr');
        expect(within(markedRow).getByText('已批改')).toBeInTheDocument();

        // 验证批改中状态
        const markingRow = screen.getByText('语文考试B').closest('tr');
        expect(within(markingRow).getByText('批改中')).toBeInTheDocument();

        // 验证未知状态
        const unknownRow = screen.getByText('英语模拟').closest('tr');
        expect(within(unknownRow).getByText('未知状态')).toBeInTheDocument();
      });
    });

    it('应正确映射批改状态', async () => {
      render(ExamCorrectList);

      await waitFor(() => {
        // 验证正常状态
        const normalRow = screen.getByText('数学考试A').closest('tr');
        expect(within(normalRow).getByText('正常')).toBeInTheDocument();

        // 验证已改完状态
        const doneRow = screen.getByText('数学考试C').closest('tr');
        expect(within(doneRow).getByText('已改完')).toBeInTheDocument();

        // 验证未知状态
        const unknownRow = screen.getByText('英语考试C').closest('tr');
        expect(within(unknownRow).getByText('未知状态')).toBeInTheDocument();
      });
    });
  });
});
