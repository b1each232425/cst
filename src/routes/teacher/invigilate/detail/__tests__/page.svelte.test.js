import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, waitFor, within } from '@testing-library/svelte';
import { toast } from '$lib/components/Toast/Toast.js';
import MessageBox from '$lib/components/MessageBox/MessageBox.js';
import InvigilateDetail from '../+page@.svelte';
import { page } from '$app/state';

vi.mock('$lib/components/Toast/Toast.js', () => ({ toast: { error: vi.fn() } }));
vi.mock('$lib/components/MessageBox/MessageBox.js', () => ({
  default: vi.fn(({ onConfirm, onCancel }) => {
    // 存储回调函数，但不自动调用
    // 测试时可以手动调用 MessageBox.mock.calls[0][0].onConfirm() 或 onCancel()
    return null;
  }),
}));
vi.mock('$app/state', () => ({
  page: {
    url: new URL('http://localhost?exam_session_id=1005&exam_room_id=2005'),
  },
}));

function setRightPath() {
  page.url = new URL('http://localhost?exam_session_id=1005&exam_room_id=2005');
}

const MOCK_INFO = {
  ExamSessionID: 1005,
  ExamRoomID: 2005,
  ExamSessionName: '2025年春季期末考试',
  ExamSiteName: '广州天河分校',
  ExamRoomName: '101多媒体教室',
  ExamRoomCapacity: 120,
  StartTime: new Date('2025-08-22 09:00:00').getTime(),
  EndTime: new Date('2025-08-22 11:30:00').getTime(),
  Status: '04',
  ExamMode: '00',
  ExamType: '00',
  BasicEval: '02',
  Record:
    '考试过程记录：发卷时间（8:55）、考试正式开始（9:00）、考生提问记录（张某询问答题卡填涂规范/10:15、刘某申请更换草稿纸/10:40）、中途离场记录（赵某因身体不适/11:00离场/由监考陪同）、收卷开始时间（11:25）、收卷完成时间（11:35）、试卷份数核对（实收28份/无遗漏）',
  ExamineeNum: 120,
  InvigilatorNum: 1,
  AbsenteeNum: 8,
  CheaterNum: 2,
  AbnormalExamineeNum: 2,
  ExtendedTimeNum: 2,
};

const MOCK_EXAMINEES = [
  {
    ExamineeID: 5001,
    ExamCard: '20250822001',
    IDCardNo: '440101199001011234',
    Name: '张三',
    Status: '02',
    Remark: '缺考',
  },
  {
    ExamineeID: 5002,
    ExamCard: '20250822002',
    IDCardNo: '440101199002022345',
    Name: '李四',
    Status: '10',
    Remark: '',
  },
  {
    ExamineeID: 5003,
    ExamCard: '20250822003',
    IDCardNo: '440101199003033456',
    Name: '王五',
    Status: '06',
    Remark: '正常参加考试',
  },
  {
    ExamineeID: 5004,
    ExamCard: '20250822004',
    IDCardNo: '440101199004044567',
    Name: '赵六',
    Status: '06',
    Remark: '提前交卷',
  },
  {
    ExamineeID: 5005,
    ExamCard: '20250822005',
    IDCardNo: '440101199005055678',
    Name: '钱七',
    Status: '14',
    Remark: '作弊嫌疑',
  },
  {
    ExamineeID: 5006,
    ExamCard: '20250822006',
    IDCardNo: '440101199006066789',
    Name: '孙八',
    Status: '14',
    Remark: '身体不适中途退场',
  },
  {
    ExamineeID: 5007,
    ExamCard: '20250822007',
    IDCardNo: '440101199007077890',
    Name: '周九',
    Status: '02',
    Remark: '缺考',
  },
  {
    ExamineeID: 5008,
    ExamCard: '20250822008',
    IDCardNo: '440101199008088901',
    Name: '吴十',
    Status: '14',
    Remark: '忘记带身份证',
  },
  {
    ExamineeID: 5009,
    ExamCard: '20250822009',
    IDCardNo: '440101199009099012',
    Name: '郑十一',
    Status: '06',
    Remark: '正常参加考试',
  },
  {
    ExamineeID: 5010,
    ExamCard: '20250822010',
    IDCardNo: '440101199010101123',
    Name: '王十二',
    Status: '06',
    Remark: '表现优秀',
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

describe('教师端监考详情页测试', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    setRightPath();
  });

  describe('应渲染页面基本元素', () => {
    it('进行中的考试，允许更新', async () => {
      mockFetch({
        status: 0,
        data: { info: MOCK_INFO, examinees: MOCK_EXAMINEES },
        rowCount: MOCK_EXAMINEES.length,
      });

      render(InvigilateDetail);

      await waitFor(() => {
        expect(screen.getByText('时间：')).toBeInTheDocument();
        expect(screen.getByText('地点：')).toBeInTheDocument();
        expect(screen.getByText('类型：')).toBeInTheDocument();
        expect(screen.getByText('模式：')).toBeInTheDocument();
        expect(screen.getByText('考试情况')).toBeInTheDocument();
        expect(screen.getByText('考场情况：')).toBeInTheDocument();
        expect(screen.getByText('监考员人数：')).toBeInTheDocument();
        expect(screen.getByText('缺考人数：')).toBeInTheDocument();
        expect(screen.getByText('作弊人数：')).toBeInTheDocument();
        expect(screen.getByText('考试异常人数：')).toBeInTheDocument();
        // expect(screen.getByText('已延长时间人数：')).toBeInTheDocument();
        expect(screen.getByText('考场记录：')).toBeInTheDocument();
        expect(screen.getByText('考生名单')).toBeInTheDocument();
        expect(screen.getByText('搜索：')).toBeInTheDocument();
        expect(screen.getByPlaceholderText('姓名、身份证号或准考证号')).toBeInTheDocument();
        expect(screen.getByText('批量标记：')).toBeInTheDocument();
        expect(screen.getAllByPlaceholderText('请选择').length).toBeGreaterThan(0);
        expect(screen.getByText('批量备注：')).toBeInTheDocument();
        expect(screen.getByPlaceholderText('请输入对选中考生的备注')).toBeInTheDocument();
        expect(screen.getByRole('button', { name: '取消选中' })).toBeInTheDocument();
        const countTip = screen.getByTestId('selected-count-tip');
        expect(countTip).toHaveTextContent('已选中 0 人');

        // 验证表头
        const tableHeaders = screen.getAllByRole('columnheader');
        expect(tableHeaders).toHaveLength(6);
        // 第0个是选择框
        expect(tableHeaders[1]).toHaveTextContent('姓名');
        expect(tableHeaders[2]).toHaveTextContent('身份证号');
        expect(tableHeaders[3]).toHaveTextContent('准考证号');
        expect(tableHeaders[4]).toHaveTextContent('异常标记');
        expect(tableHeaders[5]).toHaveTextContent('备注');
      });
    });

    it('考试不在进行中，且返回的 canUpdate 字段为 false，允许更新', async () => {
      mockFetch({
        status: 0,
        data: {
          info: {
            ...MOCK_INFO,
            Status: '02',
          },
          examinees: MOCK_EXAMINEES,
          canUpdate: false,
        },
        rowCount: MOCK_EXAMINEES.length,
      });

      render(InvigilateDetail);

      await waitFor(() => {
        expect(screen.queryByText('批量标记：')).not.toBeInTheDocument();
        expect(screen.queryByText('批量备注：')).not.toBeInTheDocument();
        expect(screen.queryByPlaceholderText('请输入对选中考生的备注')).not.toBeInTheDocument();
        expect(screen.queryByRole('button', { name: '取消选中' })).not.toBeInTheDocument();
        expect(screen.queryByTestId('selected-count-tip')).not.toBeInTheDocument();

        // 验证表头
        const tableHeaders = screen.getAllByRole('columnheader');
        expect(tableHeaders).toHaveLength(5); // 不存在选择框
      });
    });

    it('考试不在进行中，但返回的 canUpdate 字段为 true，允许更新', async () => {
      mockFetch({
        status: 0,
        data: {
          info: {
            ...MOCK_INFO,
            Status: '06',
          },
          examinees: MOCK_EXAMINEES,
          canUpdate: true,
        },
        rowCount: MOCK_EXAMINEES.length,
      });

      render(InvigilateDetail);

      await waitFor(() => {
        expect(screen.getByText('批量标记：')).toBeInTheDocument();
        expect(screen.getByText('批量备注：')).toBeInTheDocument();
        expect(screen.getByPlaceholderText('请输入对选中考生的备注')).toBeInTheDocument();
        expect(screen.getByRole('button', { name: '取消选中' })).toBeInTheDocument();
        const countTip = screen.getByTestId('selected-count-tip');
        expect(countTip).toHaveTextContent('已选中 0 人');

        // 验证表头
        const tableHeaders = screen.getAllByRole('columnheader');
        expect(tableHeaders).toHaveLength(6); // 存在选择框
      });
    });
  });

  describe('未知状态，应该显示红色警告提醒', () => {
    it('不允许更新的情况出现未知状态的考生，应爆红提醒', async () => {
      mockFetch({
        status: 0,
        data: {
          info: { ...MOCK_INFO, Status: '02' },
          examinees: [
            ...MOCK_EXAMINEES,
            {
              ExamineeID: 5012,
              ExamCard: '20250822010',
              IdentityID: '440101199010101123',
              Name: '王十二',
              Status: '11',
              Remark: '表现优秀',
            },
          ],
        },
        rowCount: MOCK_EXAMINEES.length,
      });

      render(InvigilateDetail);

      await waitFor(() => {
        expect(screen.getByText('未知状态')).toHaveClass('unknown');
      });
    });

    it('考试类型未知，应爆红提醒', async () => {
      mockFetch({
        status: 0,
        data: { info: { ...MOCK_INFO, ExamType: '22' }, examinees: MOCK_EXAMINEES },
        rowCount: MOCK_EXAMINEES.length,
      });

      render(InvigilateDetail);

      await waitFor(() => {
        expect(screen.getByText('未知状态')).toHaveClass('unknown');
      });
    });

    it('考试模式未知，应爆红提醒', async () => {
      mockFetch({
        status: 0,
        data: { info: { ...MOCK_INFO, ExamMode: '22' }, examinees: MOCK_EXAMINEES },
        rowCount: MOCK_EXAMINEES.length,
      });

      render(InvigilateDetail);

      await waitFor(() => {
        expect(screen.getByText('未知状态')).toHaveClass('unknown');
      });
    });

    it('考试状态未知，应爆红提醒', async () => {
      mockFetch({
        status: 0,
        data: { info: { ...MOCK_INFO, Status: '22' }, examinees: MOCK_EXAMINEES },
        rowCount: MOCK_EXAMINEES.length,
      });

      render(InvigilateDetail);

      await waitFor(() => {
        expect(screen.getByText('未知状态')).toHaveClass('unknown');
      });
    });
  });

  describe('路径参数错误，应弹出错误提示框', () => {
    it('路径参数 exam_room_id 缺少，应弹出错误提示框', async () => {
      page.url = new URL('http://localhost?exam_session_id=1005');

      render(InvigilateDetail);

      await waitFor(() => {
        expect(MessageBox).toHaveBeenCalledWith(
          expect.objectContaining({
            confirm_button_type: 'danger',
            title: '出错啦',
            content: '路径参数错误',
            type: 'danger',
          }),
        );
      });
    });

    it('路径参数 exam_room_id 非数字，应弹出错误提示框', async () => {
      page.url = new URL('http://localhost?exam_session_id=1005&exam_room_id=abc');

      render(InvigilateDetail);

      await waitFor(() => {
        expect(MessageBox).toHaveBeenCalledWith(
          expect.objectContaining({
            confirm_button_type: 'danger',
            title: '出错啦',
            content: '路径参数错误',
            type: 'danger',
          }),
        );
      });
    });
  });

  it('点击返回按钮应正确跳转', async () => {
    window.history.back = vi.fn(); // 重写 history.back

    render(InvigilateDetail);

    await waitFor(() => fireEvent.click(screen.getByText('返回')));
    expect(window.history.back).toHaveBeenCalledTimes(1);
  });

  it('不允许更新的情况考场记录字段为空的时候，显示“无”', async () => {
    mockFetch({
      status: 0,
      data: { info: { ...MOCK_INFO, Record: '', Status: '02' }, examinees: MOCK_EXAMINEES },
      rowCount: MOCK_EXAMINEES.length,
    });

    render(InvigilateDetail);

    await waitFor(() => {
      const record = screen.getByTestId('record');
      expect(record).toHaveTextContent('无');
    });
  });

  describe("异常状态status返回'00'或者'10'时，显示“无”", () => {
    it("允许更新的情况下，异常状态status返回'00'或者'10'时，显示“无”", async () => {
      mockFetch({
        status: 0,
        data: {
          info: MOCK_INFO,
          examinees: [
            {
              ExamineeID: 5010,
              ExamCard: '20250822010',
              IDCardNo: '440101199010101123',
              Name: '王十二',
              Status: '00',
              Remark: '表现优秀',
            },
            {
              ExamineeID: 5011,
              ExamCard: '20250822010',
              IDCardNo: '440101199010101123',
              Name: '王十二',
              Status: '10',
              Remark: '表现优秀',
            },
          ],
        },
        rowCount: MOCK_EXAMINEES.length,
      });

      render(InvigilateDetail);

      await waitFor(() => {
        const records = screen.getAllByTestId('single-select');
        expect(records[0]).toHaveTextContent('无');
        expect(records[1]).toHaveTextContent('无');
      });
    });

    it("不允许更新的情况异常状态status返回'00'或者'10'时，显示“无”", async () => {
      mockFetch({
        status: 0,
        data: {
          info: { ...MOCK_INFO, Status: '02' },
          examinees: [
            {
              ExamineeID: 5010,
              ExamCard: '20250822010',
              IDCardNo: '440101199010101123',
              Name: '王十二',
              Status: '00',
              Remark: '表现优秀',
            },
            {
              ExamineeID: 5011,
              ExamCard: '20250822010',
              IDCardNo: '440101199010101123',
              Name: '王十二',
              Status: '10',
              Remark: '表现优秀',
            },
          ],
        },
        rowCount: MOCK_EXAMINEES.length,
      });

      render(InvigilateDetail);

      await waitFor(() => {
        const records = screen.getAllByTestId('single-select');
        expect(records[0]).toHaveTextContent('无');
        expect(records[1]).toHaveTextContent('无');
      });
    });
  });

  describe('获取监考信息测试', () => {
    it('获取监考信息成功', async () => {
      mockFetch({
        status: 0,
        data: {
          info: MOCK_INFO,
          examinees: MOCK_EXAMINEES,
        },
        rowCount: MOCK_EXAMINEES.length,
      });

      render(InvigilateDetail);

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledTimes(1);

        const q = JSON.stringify({
          Filter: {
            SearchText: '',
          },
          Data: {
            ExamSessionID: MOCK_INFO.ExamSessionID,
            ExamRoomID: MOCK_INFO.ExamRoomID,
          },
          Page: 1,
          PageSize: 10,
        });
        expect(global.fetch).toHaveBeenCalledWith(`/api/invigilation?q=${q}`);

        expect(screen.getByText('2025年春季期末考试')).toBeInTheDocument();
        expect(screen.getByText(/2025-08-22 09:00/)).toBeInTheDocument();
        expect(screen.getByText(/2025-08-22 11:30/)).toBeInTheDocument();
        expect(screen.getByText(/广州天河分校/)).toBeInTheDocument();
        expect(screen.getByText(/101多媒体教室/)).toBeInTheDocument();
        expect(screen.getByText('线上考试')).toBeInTheDocument();
        expect(screen.getByText('平时考试')).toBeInTheDocument();
        expect(screen.getByText('进行中')).toBeInTheDocument();
        expect(screen.getByText('一般')).toBeInTheDocument();
        expect(
          screen.getByDisplayValue(
            '考试过程记录：发卷时间（8:55）、考试正式开始（9:00）、考生提问记录（张某询问答题卡填涂规范/10:15、刘某申请更换草稿纸/10:40）、中途离场记录（赵某因身体不适/11:00离场/由监考陪同）、收卷开始时间（11:25）、收卷完成时间（11:35）、试卷份数核对（实收28份/无遗漏）',
          ),
        ).toBeInTheDocument();

        const tbody = screen.getByTestId('examinee-tbody');
        const dataRows = tbody.querySelectorAll('tr');
        expect(dataRows.length).toBe(MOCK_EXAMINEES.length);
      });
    });

    it('无数据时展示暂无考生信息', async () => {
      mockFetch({ status: 0, data: { info: MOCK_INFO, examinees: [] }, rowCount: 0 });
      render(InvigilateDetail);

      await waitFor(() => {
        expect(screen.getByText('暂无考生数据')).toBeInTheDocument();
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
      render(InvigilateDetail);

      await waitFor(() => {
        expect(MessageBox).toHaveBeenCalledWith(
          expect.objectContaining({
            confirm_button_type: 'danger',
            title: '出错啦',
            content: '请求失败：400 Bad Request-请求失败',
            type: 'danger',
          }),
        );
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
      render(InvigilateDetail);

      await waitFor(() => {
        expect(MessageBox).toHaveBeenCalledWith(
          expect.objectContaining({
            confirm_button_type: 'danger',
            title: '出错啦',
            content: '请求失败：400 Bad Request',
            type: 'danger',
          }),
        );
      });
    });

    it('请求失败显示后端返回的 msg', async () => {
      mockFetch({ status: -1, msg: '模拟失败消息' });
      render(InvigilateDetail);

      await waitFor(() => {
        expect(MessageBox).toHaveBeenCalledWith(
          expect.objectContaining({
            confirm_button_type: 'danger',
            title: '出错啦',
            content: '模拟失败消息',
            type: 'danger',
          }),
        );
      });
    });

    it('请求失败但无 msg，使用默认错误提示', async () => {
      mockFetch({ status: -1 });
      render(InvigilateDetail);

      await waitFor(() => {
        expect(MessageBox).toHaveBeenCalledWith(
          expect.objectContaining({
            confirm_button_type: 'danger',
            title: '出错啦',
            content: '获取监考信息失败',
            type: 'danger',
          }),
        );
      });
    });

    it('获取的 info 为 0，提示类型错误', async () => {
      mockFetch({
        status: 0,
        data: {
          info: 0,
        },
        rowCount: 0,
      });
      render(InvigilateDetail);

      await waitFor(() => {
        expect(MessageBox).toHaveBeenCalledWith(
          expect.objectContaining({
            confirm_button_type: 'danger',
            title: '出错啦',
            content: 'invigilation_info 数据类型错误',
            type: 'danger',
          }),
        );
      });
    });

    it('获取的 info 为 {}，提示“监考信息为空”错误', async () => {
      mockFetch({
        status: 0,
        data: {
          info: {},
        },
      });
      render(InvigilateDetail);

      await waitFor(() => {
        expect(MessageBox).toHaveBeenCalledWith(
          expect.objectContaining({
            confirm_button_type: 'danger',
            title: '出错啦',
            content: '监考信息为空',
            type: 'danger',
          }),
        );
      });
    });

    it('获取的 examinee_list 为 0，提示类型错误', async () => {
      mockFetch({
        status: 0,
        data: {
          info: MOCK_INFO,
          examinees: 0,
        },
        rowCount: 0,
      });
      render(InvigilateDetail);

      await waitFor(() => {
        expect(MessageBox).toHaveBeenCalledWith(
          expect.objectContaining({
            confirm_button_type: 'danger',
            title: '出错啦',
            content: 'examinee_list 数据类型错误',
            type: 'danger',
          }),
        );
      });
    });
  });

  it('搜索功能测试', async () => {
    mockFetch({
      status: 0,
      data: {
        info: MOCK_INFO,
        examinees: [...Array(10)].map((_, i) => ({
          ...MOCK_EXAMINEES[0],
          ExamineeID: i + 1,
          Name: `考生 ${i + 1}`,
        })),
      },
      rowCount: 15,
    });

    render(InvigilateDetail);

    mockFetch({ status: 0 });

    const input = screen.getByPlaceholderText('姓名、身份证号或准考证号');
    await fireEvent.input(input, { target: { value: '考生123' } });

    expect(input).toHaveValue('考生123');

    await new Promise((resolve) => setTimeout(resolve, 1000));

    await waitFor(() => {
      const q = JSON.stringify({
        Filter: {
          SearchText: '考生123',
        },
        Data: {
          ExamSessionID: MOCK_INFO.ExamSessionID,
          ExamRoomID: MOCK_INFO.ExamRoomID,
        },
        Page: 1,
        PageSize: 10,
      });
      expect(global.fetch).toHaveBeenCalledWith(`/api/invigilation?q=${q}`);
    });
  });

  it('输入页号和页大小获取数据', async () => {
    mockFetch({
      status: 0,
      data: {
        info: MOCK_INFO,
        examinees: [...Array(15)].map((_, i) => ({
          ...MOCK_EXAMINEES[0],
          ExamineeID: i + 1,
          Name: `考生 ${i + 1}`,
        })),
      },
      rowCount: 15,
    });

    render(InvigilateDetail);
    vi.clearAllMocks();

    // 第二页只有 5 条
    mockFetch({
      status: 0,
      data: {
        info: MOCK_INFO,
        examinees: [...Array(5)].map((_, i) => ({
          ...MOCK_EXAMINEES[0],
          ExamineeID: i + 1,
          Name: `考生 ${i + 1}`,
        })),
      },
      rowCount: 5,
    });

    const input = screen.getByRole('spinbutton');
    await fireEvent.input(input, { target: { value: 2 } });
    await fireEvent.keyDown(input, { key: 'Enter', code: 'Enter', charCode: 13 }); // 发送一次请求

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledTimes(1);

      const q = JSON.stringify({
        Filter: {
          SearchText: '',
        },
        Data: {
          ExamSessionID: MOCK_INFO.ExamSessionID,
          ExamRoomID: MOCK_INFO.ExamRoomID,
        },
        Page: 2,
        PageSize: 10,
      });
      expect(global.fetch).toHaveBeenCalledWith(`/api/invigilation?q=${q}`);
    });

    const select = screen.getAllByRole('button', { name: 'Toggle dropdown' })[1];
    await screen.findByText('20条/页').then(fireEvent.click); // 发送一次请求

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledTimes(2);

      const q = JSON.stringify({
        Filter: {
          SearchText: '',
        },
        Data: {
          ExamSessionID: MOCK_INFO.ExamSessionID,
          ExamRoomID: MOCK_INFO.ExamRoomID,
        },
        Page: 1,
        PageSize: 20,
      });
      expect(global.fetch).toHaveBeenCalledWith(`/api/invigilation?q=${q}`);
    });
  });

  describe('批量选择功能测试', () => {
    beforeEach(async () => {
      mockFetch({ status: 0, data: { info: MOCK_INFO, examinees: MOCK_EXAMINEES }, rowCount: MOCK_EXAMINEES.length });
      render(InvigilateDetail);
      vi.clearAllMocks();

      // 等待 render
      await screen.findByTestId('examinee-tbody');
    });

    it('没有选中任何 checkbox 时，批量处理的功能是被禁止的', async () => {
      await waitFor(() => {
        expect(screen.getByRole('button', { name: '取消选中' })).toHaveClass('is-disabled');
        expect(screen.getByPlaceholderText('请输入对选中考生的备注')).toHaveClass('is-disabled');
      });
    });

    it('点击全选后，所有的 checkbox 都会选中，并正确显示选中信息', async () => {
      await fireEvent.click(screen.getByTestId('select-all')); // 等待render之后，点击全选

      // 获取所有单个选择按钮
      const singleCheckboxes = screen.getAllByTestId('select-single');

      await waitFor(() => {
        // 每个按钮内都应该存在选中状态的元素（check-square）
        singleCheckboxes.forEach((checkbox) => {
          expect(within(checkbox).getByTestId('check-square')).toBeInTheDocument();
        });

        // 验证选中数量提示正确（应等于考生总数）
        const countTip = screen.getByTestId('selected-count-tip');
        expect(countTip).toHaveTextContent(`已选中 ${MOCK_EXAMINEES.length} 人`);
      });
    });

    it('点击多个 checkbox 后，正确显示选中信息', async () => {
      const singleCheckboxes = screen.getAllByTestId('select-single');
      await fireEvent.click(singleCheckboxes[0]);
      await fireEvent.click(singleCheckboxes[1]);

      await waitFor(() => {
        // 验证选中数量提示正确
        const countTip = screen.getByTestId('selected-count-tip');
        expect(countTip).toHaveTextContent(`已选中 2 人`);
      });
    });

    it('全选后，点击单个 checkbox 后，全选按钮会取消选中', async () => {
      // 1. 先让全选按钮出现
      const allCheckbox = screen.getByTestId('select-all');

      // 2. 触发事件
      fireEvent.click(allCheckbox); // 全选
      const singleCheckboxes = screen.getAllByTestId('select-single');
      fireEvent.click(singleCheckboxes[0]); // 取消第 0 个

      // 3. 断言（如果组件里有异步状态更新，才需要 await waitFor）
      await waitFor(() => {
        expect(within(allCheckbox).queryByTestId('check-square')).not.toBeInTheDocument();
      });

      // 4. 同样的原则：下面这句同步就能拿到，不需要再包 waitFor
      const countTip = screen.getByTestId('selected-count-tip');
      expect(countTip).toHaveTextContent('已选中 9 人');
    });

    it('全选后，再次点击全选，所有的选中都会取消', async () => {
      await fireEvent.click(screen.getByTestId('select-all')); // 等待render之后，点击全选
      await fireEvent.click(screen.getByTestId('select-all')); // 再次点击

      // 获取所有单个选择按钮
      const singleCheckboxes = screen.getAllByTestId('select-single');

      await waitFor(() => {
        // 每个按钮内都应该存在选中状态的元素（check-square）
        singleCheckboxes.forEach((checkbox) => {
          expect(within(checkbox).queryByTestId('check-square')).not.toBeInTheDocument();
        });

        // 验证选中数量提示正确（应等于考生总数）
        const countTip = screen.getByTestId('selected-count-tip');
        expect(countTip).toHaveTextContent(`已选中 0 人`);
      });
    });

    it('点击“取消选中”后，所有的 checkbox 都会取消选中', async () => {
      const singleCheckboxes = screen.getAllByTestId('select-single');
      await fireEvent.click(singleCheckboxes[0]);
      await fireEvent.click(singleCheckboxes[1]);

      await fireEvent.click(screen.getByRole('button', { name: '取消选中' }));

      await waitFor(() => {
        expect(screen.queryByTestId('check-square')).not.toBeInTheDocument();

        // 验证选中数量提示正确
        const countTip = screen.getByTestId('selected-count-tip');
        expect(countTip).toHaveTextContent(`已选中 0 人`);
      });
    });
  });

  describe('更新监考场/考生信息功能测试', () => {
    beforeEach(async () => {
      mockFetch({ status: 0, data: { info: MOCK_INFO, examinees: MOCK_EXAMINEES }, rowCount: MOCK_EXAMINEES.length });
      render(InvigilateDetail);
      vi.clearAllMocks();

      // 等待 render
      await screen.findByTestId('examinee-tbody');
    });

    describe('更新考试情况', () => {
      it('点击保存，成功更新监考场基本情况', async () => {
        mockFetch({ status: 0 });

        await fireEvent.click(screen.getAllByRole('button', { name: 'Toggle dropdown' })[0]);
        const evalSelect = screen.getByTestId('basic-eval-select');
        await within(evalSelect).findByText('良好').then(fireEvent.click);
        expect(evalSelect).toHaveTextContent('良好');

        const textarea = screen.getByPlaceholderText('请输入考场记录...');
        await fireEvent.input(textarea, { target: { value: '模拟考场记录' } });

        await fireEvent.click(screen.getByRole('button', { name: '保存' }));

        await waitFor(() => {
          expect(global.fetch).toHaveBeenCalledTimes(1);

          const q = JSON.stringify({
            Data: {
              ExamSessionID: MOCK_INFO.ExamSessionID,
              ExamRoomID: MOCK_INFO.ExamRoomID,
              UpdateType: '00',
              Record: '模拟考场记录',
              BasicEval: '00',
            },
          });
          expect(global.fetch).toHaveBeenCalledWith(`/api/invigilation?q=${q}`, { method: 'PATCH' });

          expect(toast.error).not.toHaveBeenCalled();
        });
      });

      it('点击取消，考试情况恢复原样', async () => {
        mockFetch({ status: 0 });

        await fireEvent.click(screen.getAllByRole('button', { name: 'Toggle dropdown' })[0]);
        const evalSelect = screen.getByTestId('basic-eval-select');
        await within(evalSelect).findByText('良好').then(fireEvent.click);
        expect(evalSelect).toHaveTextContent('良好');

        const textarea = screen.getByPlaceholderText('请输入考场记录...');
        await fireEvent.input(textarea, { target: { value: '模拟考场记录' } });
        expect(screen.getByDisplayValue('模拟考场记录')).toBeInTheDocument();

        await fireEvent.click(screen.getByRole('button', { name: '取消' }));

        await waitFor(() => {
          expect(global.fetch).not.toHaveBeenCalled(); // 未调用更新接口
          expect(screen.getByText('一般')).toBeInTheDocument();
          expect(
            screen.getByDisplayValue(
              '考试过程记录：发卷时间（8:55）、考试正式开始（9:00）、考生提问记录（张某询问答题卡填涂规范/10:15、刘某申请更换草稿纸/10:40）、中途离场记录（赵某因身体不适/11:00离场/由监考陪同）、收卷开始时间（11:25）、收卷完成时间（11:35）、试卷份数核对（实收28份/无遗漏）',
            ),
          ).toBeInTheDocument();
        });
      });
    });

    describe('更新一个考生信息', () => {
      it('选择第一个考生的异常标记，选中其中一个，点击弹窗的确认按钮，成功更新考生的状态', async () => {
        mockFetch({ status: 0 });

        const tbody = await screen.findByTestId('examinee-tbody');
        await fireEvent.click(within(tbody).getAllByRole('button', { name: 'Toggle dropdown' })[0]);
        await fireEvent.click(within(screen.getAllByTestId('single-select')[0]).getAllByText('考试异常')[0]);

        expect(MessageBox).toHaveBeenCalledWith({
          title: '确认操作',
          content: '你确定要该考生的异常状态标记为“考试异常”吗？',
          on_close_by_click_outside: false,
          onConfirm: expect.any(Function),
          onCancel: expect.any(Function),
        });

        MessageBox.mock.calls[0][0].onConfirm();

        await waitFor(() => {
          expect(global.fetch).toHaveBeenCalledTimes(1);

          const q = JSON.stringify({
            Data: {
              ExamSessionID: MOCK_INFO.ExamSessionID,
              ExamRoomID: MOCK_INFO.ExamRoomID,
              UpdateType: '02',
              Examinees: [MOCK_EXAMINEES[0].ExamineeID],
              ExamineeStatus: '14',
            },
          });
          expect(global.fetch).toHaveBeenCalledWith(`/api/invigilation?q=${q}`, { method: 'PATCH' });

          expect(toast.error).not.toHaveBeenCalled();
        });
      });

      it('选择第一个考生的异常标记，选中其中一个，点击弹窗的取消按钮，没有更新考生的状态', async () => {
        mockFetch({ status: 0 });

        const tbody = await screen.findByTestId('examinee-tbody');
        await fireEvent.click(within(tbody).getAllByRole('button', { name: 'Toggle dropdown' })[0]);
        await fireEvent.click(within(screen.getAllByTestId('single-select')[0]).getAllByText('考试异常')[0]);

        MessageBox.mock.calls[0][0].onCancel();

        await waitFor(() => {
          expect(global.fetch).not.toHaveBeenCalled();

          // 考生的状态没有变化
          // 获取表格的第一行的状态
          const firstRowStatus = within(tbody).getAllByTestId('single-select')[0];
          expect(firstRowStatus).toHaveTextContent('缺考'); // 依旧是缺考
        });
      });

      it('选择第二个考生的异常标记，选中已有的标记，没有弹出弹窗，也没有更新', async () => {
        mockFetch({ status: 0 });

        const tbody = await screen.findByTestId('examinee-tbody');
        await fireEvent.click(within(tbody).getAllByRole('button', { name: 'Toggle dropdown' })[1]);
        await fireEvent.click(within(screen.getAllByTestId('single-select')[1]).getAllByText('无')[0]);

        await waitFor(() => {
          expect(MessageBox).not.toHaveBeenCalled();
          expect(global.fetch).not.toHaveBeenCalled();
        });
      });

      it('输入单个备注的输入框，成功更新', async () => {
        mockFetch({ status: 0 });

        const input = screen.getAllByPlaceholderText('暂无备注')[0];

        await fireEvent.input(input, { target: { value: '考生表现良好' } });

        expect(input).toHaveValue('考生表现良好');

        await new Promise((resolve) => setTimeout(resolve, 1000));

        await waitFor(() => {
          expect(global.fetch).toHaveBeenCalledTimes(1);

          const q = JSON.stringify({
            Data: {
              ExamSessionID: MOCK_INFO.ExamSessionID,
              ExamRoomID: MOCK_INFO.ExamRoomID,
              UpdateType: '04',
              Examinees: [MOCK_EXAMINEES[0].ExamineeID],
              ExamineeRemark: '考生表现良好',
            },
          });
          expect(global.fetch).toHaveBeenCalledWith(`/api/invigilation?q=${q}`, { method: 'PATCH' });

          expect(toast.error).not.toHaveBeenCalled();
        });
      });
    });

    describe('成功批量更新监考场/考生信息', () => {
      it('点击全选后，批量标记为“缺考”，点击弹窗的确认按钮，成功更新', async () => {
        mockFetch({ status: 0 });

        // 点击全选
        await fireEvent.click(screen.getByTestId('select-all'));

        // 批量标记
        await fireEvent.click(screen.getAllByRole('button', { name: 'Toggle dropdown' })[1]);
        const statusSelect = screen.getByTestId('batch-select');
        await within(statusSelect).findByText('缺考').then(fireEvent.click);
        expect(statusSelect).toHaveTextContent('缺考');

        expect(MessageBox).toHaveBeenCalledWith({
          title: '确认操作',
          content: '你确定要批量标记为“缺考”吗？',
          on_close_by_click_outside: false,
          onConfirm: expect.any(Function),
          onCancel: expect.any(Function),
        });

        MessageBox.mock.calls[0][0].onConfirm();

        // 等待表格加载完成
        const tbody = await screen.findByTestId('examinee-tbody');

        await waitFor(() => {
          expect(global.fetch).toHaveBeenCalledTimes(1);

          const q = JSON.stringify({
            Data: {
              ExamSessionID: MOCK_INFO.ExamSessionID,
              ExamRoomID: MOCK_INFO.ExamRoomID,
              UpdateType: '02',
              ExamineeStatus: '02',
              Examinees: MOCK_EXAMINEES.map((examinee) => examinee.ExamineeID),
            },
          });
          expect(global.fetch).toHaveBeenCalledWith(`/api/invigilation?q=${q}`, { method: 'PATCH' });

          expect(toast.error).not.toHaveBeenCalled();

          // 获取所有显示"缺考"的元素
          const absentOptions = within(tbody).getAllByText('缺考');

          // 验证数量与考生数据一致
          expect(absentOptions.length).toBe(MOCK_EXAMINEES.length);
        });
      });

      it('点击全选后，批量标记为“缺考”，点击弹窗的取消按钮，没有更新', async () => {
        mockFetch({ status: 0 });

        // 点击全选
        await fireEvent.click(screen.getByTestId('select-all'));

        // 批量标记
        await fireEvent.click(screen.getAllByRole('button', { name: 'Toggle dropdown' })[1]);
        const statusSelect = screen.getByTestId('batch-select');
        await within(statusSelect).findByText('缺考').then(fireEvent.click);
        expect(statusSelect).toHaveTextContent('缺考');

        MessageBox.mock.calls[0][0].onCancel();

        // 等待表格加载完成
        const tbody = await screen.findByTestId('examinee-tbody');

        await waitFor(() => {
          expect(global.fetch).not.toHaveBeenCalled();
        });
      });

      it('点击全选后，成功批量备注为“全部通过”', async () => {
        mockFetch({ status: 0 });

        // 点击全选
        await fireEvent.click(screen.getByTestId('select-all'));

        // 批量备注
        const input = screen.getByPlaceholderText('请输入对选中考生的备注');
        await fireEvent.input(input, { target: { value: '全部通过' } });
        expect(input).toHaveValue('全部通过');

        // 等待防抖结束
        await new Promise((resolve) => setTimeout(resolve, 1000));

        // 等待表格加载完成
        const tbody = await screen.findByTestId('examinee-tbody');

        await waitFor(() => {
          expect(global.fetch).toHaveBeenCalledTimes(1);

          const q = JSON.stringify({
            Data: {
              ExamSessionID: MOCK_INFO.ExamSessionID,
              ExamRoomID: MOCK_INFO.ExamRoomID,
              UpdateType: '04',
              ExamineeRemark: '全部通过',
              Examinees: MOCK_EXAMINEES.map((examinee) => examinee.ExamineeID),
            },
          });
          expect(global.fetch).toHaveBeenCalledWith(`/api/invigilation?q=${q}`, { method: 'PATCH' });

          expect(toast.error).not.toHaveBeenCalled();

          // 获取所有显示"全部通过"的元素
          const remarkInputs = within(tbody).getAllByPlaceholderText('暂无备注');

          // 验证所有考生的备注
          remarkInputs.forEach((input) => {
            expect(input).toHaveValue('全部通过');
          });
        });
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

      await fireEvent.click(screen.getAllByRole('button', { name: 'Toggle dropdown' })[0]);
      const evalSelect = screen.getByTestId('basic-eval-select');
      await within(evalSelect).findByText('良好').then(fireEvent.click);
      expect(evalSelect).toHaveTextContent('良好');

      const textarea = screen.getByPlaceholderText('请输入考场记录...');
      await fireEvent.input(textarea, { target: { value: '模拟考场记录' } });

      await fireEvent.click(screen.getByRole('button', { name: '保存' }));

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

      await fireEvent.click(screen.getAllByRole('button', { name: 'Toggle dropdown' })[0]);
      const evalSelect = screen.getByTestId('basic-eval-select');
      await within(evalSelect).findByText('良好').then(fireEvent.click);
      expect(evalSelect).toHaveTextContent('良好');

      const textarea = screen.getByPlaceholderText('请输入考场记录...');
      await fireEvent.input(textarea, { target: { value: '模拟考场记录' } });

      await fireEvent.click(screen.getByRole('button', { name: '保存' }));

      await waitFor(() => {
        expect(toast.error).toHaveBeenCalledWith('请求失败：400 Bad Request');
      });
    });

    it('请求失败显示后端返回的 msg', async () => {
      mockFetch({ status: -1, msg: '模拟失败消息' });

      await fireEvent.click(screen.getAllByRole('button', { name: 'Toggle dropdown' })[0]);
      const evalSelect = screen.getByTestId('basic-eval-select');
      await within(evalSelect).findByText('良好').then(fireEvent.click);
      expect(evalSelect).toHaveTextContent('良好');

      const textarea = screen.getByPlaceholderText('请输入考场记录...');
      await fireEvent.input(textarea, { target: { value: '模拟考场记录' } });

      await fireEvent.click(screen.getByRole('button', { name: '保存' }));

      await waitFor(() => {
        expect(toast.error).toHaveBeenCalledWith('模拟失败消息');
      });
    });

    it('请求失败但无 msg，使用默认错误提示', async () => {
      mockFetch({ status: -1 });

      await fireEvent.click(screen.getAllByRole('button', { name: 'Toggle dropdown' })[0]);
      const evalSelect = screen.getByTestId('basic-eval-select');
      await within(evalSelect).findByText('良好').then(fireEvent.click);
      expect(evalSelect).toHaveTextContent('良好');

      const textarea = screen.getByPlaceholderText('请输入考场记录...');
      await fireEvent.input(textarea, { target: { value: '模拟考场记录' } });

      await fireEvent.click(screen.getByRole('button', { name: '保存' }));

      await waitFor(() => {
        expect(toast.error).toHaveBeenCalledWith('更新监考信息失败');
      });
    });
  });

  describe('防抖测试', () => {
    beforeEach(async () => {
      mockFetch({ status: 0, data: { info: MOCK_INFO, examinees: MOCK_EXAMINEES }, rowCount: MOCK_EXAMINEES.length });
      render(InvigilateDetail);
      vi.clearAllMocks();

      // 等待 render
      await screen.findByTestId('examinee-tbody');
    });

    it('输入搜索框，防抖成功', async () => {
      mockFetch({ status: 0 });

      const input = screen.getByPlaceholderText('姓名、身份证号或准考证号');
      await fireEvent.input(input, { target: { value: '考' } });
      await fireEvent.input(input, { target: { value: '考生' } });
      await fireEvent.input(input, { target: { value: '考生1' } });
      await fireEvent.input(input, { target: { value: '考生12' } });
      await fireEvent.input(input, { target: { value: '考生123' } });

      expect(input).toHaveValue('考生123');

      await new Promise((resolve) => setTimeout(resolve, 1000));

      await expect(global.fetch).toHaveBeenCalledTimes(1);
    });

    it('输入批量备注的输入框，防抖成功', async () => {
      mockFetch({ status: 0 });

      await fireEvent.click(screen.getByTestId('select-all'));

      const input = screen.getByPlaceholderText('请输入对选中考生的备注');
      await fireEvent.input(input, { target: { value: '所' } });
      await fireEvent.input(input, { target: { value: '所有' } });
      await fireEvent.input(input, { target: { value: '所有考' } });
      await fireEvent.input(input, { target: { value: '所有考生表现良好' } });

      expect(input).toHaveValue('所有考生表现良好');

      await new Promise((resolve) => setTimeout(resolve, 1000));

      await expect(global.fetch).toHaveBeenCalledTimes(1);
    });

    it('输入单个备注的输入框，防抖成功', async () => {
      mockFetch({ status: 0 });

      const input = screen.getAllByPlaceholderText('暂无备注')[0];

      await fireEvent.input(input, { target: { value: '考' } });
      await fireEvent.input(input, { target: { value: '考生' } });
      await fireEvent.input(input, { target: { value: '考生表' } });
      await fireEvent.input(input, { target: { value: '考生表现良好' } });

      expect(input).toHaveValue('考生表现良好');

      await new Promise((resolve) => setTimeout(resolve, 1000));

      await expect(global.fetch).toHaveBeenCalledTimes(1);
    });
  });
});
