import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, waitFor, within } from '@testing-library/svelte';
import InvigilateList from '../+page.svelte';
import { toast } from '$lib/components/Toast/Toast.js';
import { goto } from '$app/navigation';

vi.mock('$app/navigation', () => ({ goto: vi.fn() }));
vi.mock('$lib/components/Toast/Toast.js', () => ({ toast: { error: vi.fn() } }));
vi.mock('$app/navigation', () => ({ goto: vi.fn() }));

const MOCK_DATA = [
  {
    ExamSessionID: 1001,
    ExamRoomID: 2001,
    ExamSessionName: '2025年春季期末考试',
    ExamSiteName: '广州天河分校',
    ExamRoomName: '101多媒体教室',
    StartTime: new Date('2025-08-22 09:00:00').getTime(),
    EndTime: new Date('2025-08-22 11:30:00').getTime(),
    Status: '02',
    ExamineeNum: 120,
    AbsenteeNum: 8,
  },
  {
    ExamSessionID: 1002,
    ExamRoomID: 2002,
    ExamSessionName: '2025年春季期中考试',
    ExamSiteName: '北京海淀分校',
    ExamRoomName: '201标准考场',
    StartTime: new Date('2025-08-22 14:00:00').getTime(),
    EndTime: new Date('2025-08-22 15:30:00').getTime(),
    Status: '04',
    ExamineeNum: 80,
    AbsenteeNum: 3,
  },
  {
    ExamSessionID: 1003,
    ExamRoomID: 2003,
    ExamSessionName: '2025年春季模拟考试',
    ExamSiteName: '上海浦东分校',
    ExamRoomName: '301计算机房',
    StartTime: new Date('2025-08-21 10:00:00').getTime(),
    EndTime: new Date('2025-08-21 12:00:00').getTime(),
    Status: '06',
    ExamineeNum: 60,
    AbsenteeNum: 5,
  },
  {
    ExamSessionID: 1004,
    ExamRoomID: 2004,
    ExamSessionName: '2025年春季单元测试',
    ExamSiteName: '深圳南山分校',
    ExamRoomName: '401阶梯教室',
    StartTime: new Date('2025-08-20 15:00:00').getTime(),
    EndTime: new Date('2025-08-20 16:00:00').getTime(),
    Status: '08',
    ExamineeNum: 150,
    AbsenteeNum: 12,
  },
  {
    ExamSessionID: 1005,
    ExamRoomID: 2005,
    ExamSessionName: '2025年春季入学考试',
    ExamSiteName: '杭州西湖分校',
    ExamRoomName: '501语音室',
    StartTime: new Date('2025-08-19 08:30:00').getTime(),
    EndTime: new Date('2025-08-19 10:30:00').getTime(),
    Status: '10',
    ExamineeNum: 50,
    AbsenteeNum: 2,
  },
  {
    ExamSessionID: 1006,
    ExamRoomID: 2006,
    ExamSessionName: '2025年春季补考',
    ExamSiteName: '成都武侯分校',
    ExamRoomName: '601专用考场',
    StartTime: new Date('2025-08-18 13:00:00').getTime(),
    EndTime: new Date('2025-08-18 14:30:00').getTime(),
    Status: '12',
    ExamineeNum: 30,
    AbsenteeNum: 1,
  },
  {
    ExamSessionID: 1008,
    ExamRoomID: 2008,
    ExamSessionName: '2025年春季英语四级模拟考',
    ExamSiteName: '武汉江汉分校',
    ExamRoomName: '801听力教室',
    StartTime: new Date('2025-08-24 09:00:00').getTime(),
    EndTime: new Date('2025-08-24 11:20:00').getTime(),
    Status: '22',
    ExamineeNum: 45,
    AbsenteeNum: 0,
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

describe('监考管理列表页面测试', () => {
  beforeEach(() => vi.clearAllMocks());

  it('页面基本元素的渲染', async () => {
    render(InvigilateList);

    await waitFor(() => {
      expect(screen.getByText('考试场次：')).toBeInTheDocument();
      expect(screen.getByPlaceholderText('请输入信息')).toBeInTheDocument();
      expect(screen.getByText('考试时间：')).toBeInTheDocument();
      expect(screen.getByTestId('date-picker')).toBeInTheDocument();
      expect(screen.getByText('考试状态：')).toBeInTheDocument();
      expect(screen.getAllByPlaceholderText('请选择').length).toBeGreaterThan(0);
      expect(screen.getByRole('button', { name: '重置' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: '搜索' })).toBeInTheDocument();

      expect(screen.getByRole('table')).toBeInTheDocument();
      // 验证表头
      const tableHeaders = screen.getAllByRole('columnheader');
      expect(tableHeaders).toHaveLength(8);
      expect(tableHeaders[0]).toHaveTextContent('考试场次');
      expect(tableHeaders[1]).toHaveTextContent('考点');
      expect(tableHeaders[2]).toHaveTextContent('考场');
      expect(tableHeaders[3]).toHaveTextContent('考试时间');
      expect(tableHeaders[4]).toHaveTextContent('考试状态');
      expect(tableHeaders[5]).toHaveTextContent('考生人数');
      expect(tableHeaders[6]).toHaveTextContent('缺考人数');
      expect(tableHeaders[7]).toHaveTextContent('操作');
    });
  });

  describe('获取监考列表功能测试', () => {
    it('成功加载考试数据', async () => {
      mockFetch({ status: 0, data: MOCK_DATA, rowCount: MOCK_DATA.length });
      render(InvigilateList);

      await waitFor(() => {
        const tbody = screen.getByTestId('invigilate-tbody');
        const dataRows = tbody.querySelectorAll('tr');

        expect(dataRows.length).toBe(MOCK_DATA.length);
      });
    });

    it('无数据时展示暂无信息', async () => {
      mockFetch({ status: 0 });
      render(InvigilateList);

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
      render(InvigilateList);

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
      render(InvigilateList);

      await waitFor(() => {
        expect(toast.error).toHaveBeenCalledWith('请求失败：400 Bad Request');
      });
    });

    it('请求失败显示后端返回的 msg', async () => {
      mockFetch({ status: -1, msg: '模拟失败消息' });
      render(InvigilateList);

      await waitFor(() => {
        expect(toast.error).toHaveBeenCalledWith('模拟失败消息');
      });
    });

    it('请求失败但无 msg，使用默认错误提示', async () => {
      mockFetch({ status: -1 });
      render(InvigilateList);

      await waitFor(() => {
        expect(toast.error).toHaveBeenCalledWith('获取监考列表失败');
      });
    });

    it('获取的 exam_session_list 为 0，使用默认错误提示', async () => {
      mockFetch({ status: 0, data: 0 });
      render(InvigilateList);

      await waitFor(() => {
        expect(toast.error).toHaveBeenCalledWith('exam_session_list 数据类型错误');
      });
    });
  });

  it('输入页号和页大小获取数据', async () => {
    mockFetch({
      status: 0,
      data: [...Array(15)].map((_, i) => ({
        ...MOCK_DATA[0],
        ExamSessionID: i + 1,
        ExamSessionName: `考试 ${i + 1}`,
      })),
      rowCount: 15,
    });

    render(InvigilateList);

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
      data: MOCK_DATA,
    });

    render(InvigilateList);
    await fireEvent.click(within(screen.getByTestId('date-picker')).getByRole('textbox'));
    await fireEvent.click(screen.getAllByRole('button', { name: '25' })[0]);
    await fireEvent.click(screen.getAllByRole('button', { name: '26' })[2]);
    await fireEvent.click(screen.getByRole('button', { name: '确定' }));

    await fireEvent.click(screen.getByRole('button', { name: '搜索' }));

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledTimes(2);
    });
  });

  it('重置按钮清空所有筛选条件', async () => {
    render(InvigilateList);

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

  it('点击"查看详情"按钮跳转监考详情页', async () => {
    mockFetch({
      status: 0,
      data: [MOCK_DATA[0]],
    });

    render(InvigilateList);

    await waitFor(() => fireEvent.click(screen.getAllByText('查看详情')[0]));
    expect(goto).toHaveBeenCalledWith('/teacher/invigilate/detail?exam_session_id=1001&exam_room_id=2001');
  });

  it('点击"进入监考"按钮监考详情页', async () => {
    mockFetch({ status: 0, data: [MOCK_DATA[1]] });
    render(InvigilateList);

    await waitFor(() => fireEvent.click(screen.getAllByText('进入监考')[0]));
    expect(goto).toHaveBeenCalledWith('/teacher/invigilate/detail?exam_session_id=1002&exam_room_id=2002');
  });

  it('“未知状态”的考试无法操作', async () => {
    mockFetch({ status: 0, data: [MOCK_DATA[MOCK_DATA.length - 1]] });
    render(InvigilateList);

    await waitFor(() => fireEvent.click(screen.getByText('--')));
    expect(goto).not.toHaveBeenCalled();
  });
});
