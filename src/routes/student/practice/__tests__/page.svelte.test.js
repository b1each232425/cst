import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, waitFor, within } from '@testing-library/svelte';
import PracticeList from '../+page.svelte';
import { toast } from '$lib/components/Toast/Toast.js';
import { goto } from '$app/navigation';

vi.mock('$app/navigation', () => ({ goto: vi.fn() }));
vi.mock('$lib/components/Toast/Toast.js', () => ({ toast: { error: vi.fn() } }));

const MOCK_PRACTICES = [
  // 1. 全新未开始练习
  {
    ID: 1,
    Name: '基础语法练习',
    Type: '00',
    AttemptCount: 0,
    Difficulty: '00',
    AllowedAttempts: 3,
    QuestionCount: 10,
    WrongCount: 0,
    TotalScore: 0,
    HighestScore: 0,
    PaperTotalScore: 100,
    PaperID: 'paper_001',
    LatestUnsubmittedID: 0,
    LatestSubmittedID: 0,
    PendingMarkID: 0,
    Action: '00', // 预期: ["进入练习"]
  },

  // 2. 有未提交记录(首次练习)
  {
    ID: 2,
    Name: '数据结构入门',
    Type: '00',
    AttemptCount: 1,
    Difficulty: '02',
    AllowedAttempts: 5,
    QuestionCount: 8,
    WrongCount: 0,
    TotalScore: 0,
    HighestScore: 0,
    PaperTotalScore: 100,
    PaperID: 'paper_002',
    LatestUnsubmittedID: 21,
    LatestSubmittedID: 0,
    PendingMarkID: 0,
    Action: '10', // 预期: ["继续作答"]
  },

  // 3. 有未提交记录(非首次练习)
  {
    ID: 3,
    Name: '指针进阶训练',
    Type: '00',
    AttemptCount: 3,
    Difficulty: '04',
    AllowedAttempts: 5,
    QuestionCount: 15,
    WrongCount: 5,
    TotalScore: 75,
    HighestScore: 80,
    PaperTotalScore: 100,
    PaperID: 'paper_003',
    LatestUnsubmittedID: 32,
    LatestSubmittedID: 31,
    PendingMarkID: 0,
    Action: '04', // 预期: ["继续作答", "查看上次作答"]
  },

  // 4. 已完成但可重新作答
  {
    ID: 4,
    Name: '操作系统模拟',
    Type: '00',
    AttemptCount: 2,
    Difficulty: '02',
    AllowedAttempts: 5,
    QuestionCount: 20,
    WrongCount: 8,
    TotalScore: 85,
    HighestScore: 85,
    PaperTotalScore: 100,
    PaperID: 'paper_004',
    LatestUnsubmittedID: 0,
    LatestSubmittedID: 42,
    PendingMarkID: 0,
    Action: '02', // 预期: ["重新作答", "查看上次作答"]
  },

  // 5. 已达最大尝试次数
  {
    ID: 5,
    Name: '算法综合测试',
    Type: '00',
    AttemptCount: 5,
    Difficulty: '04',
    AllowedAttempts: 5,
    QuestionCount: 10,
    WrongCount: 3,
    TotalScore: 92,
    HighestScore: 95,
    PaperTotalScore: 100,
    PaperID: 'paper_005',
    LatestUnsubmittedID: 0,
    LatestSubmittedID: 53,
    PendingMarkID: 0,
    Action: '08', // 预期: ["查看上次作答"]
  },

  // 6. 等待批改中
  {
    ID: 6,
    Name: '网络协议练习',
    Type: '00',
    AttemptCount: 1,
    Difficulty: '06',
    AllowedAttempts: 3,
    QuestionCount: 12,
    WrongCount: 0,
    TotalScore: null,
    HighestScore: 88,
    PaperTotalScore: 100,
    PaperID: 'paper_006',
    LatestUnsubmittedID: 0,
    LatestSubmittedID: 61,
    PendingMarkID: 612,
    Action: '06', // 预期: ["等待批改完成"]
  },

  // 7. 异常状态
  {
    ID: 7,
    Name: '异常状态测试',
    Type: '00',
    AttemptCount: 1,
    Difficulty: '00',
    AllowedAttempts: 3,
    QuestionCount: 5,
    WrongCount: 0,
    TotalScore: 0,
    HighestScore: 0,
    PaperTotalScore: 100,
    PaperID: 'paper_007',
    LatestUnsubmittedID: 71, // 同时存在未提交记录
    LatestSubmittedID: 72, // 和已提交记录
    PendingMarkID: 1, // 但又有待批改记录
    // 这种组合状态在正常业务中不应该存在
    // 会触发getPracticeAction的默认返回'12'
    Action: '12', // 预期: ["操作异常"]
  },

  // 8. 无限次尝试
  {
    ID: 8,
    Name: '无限练习模式',
    Type: '00',
    AttemptCount: 10,
    Difficulty: '02',
    AllowedAttempts: 0,
    QuestionCount: 15,
    WrongCount: 5,
    TotalScore: 90,
    HighestScore: 95,
    PaperTotalScore: 100,
    PaperID: 'paper_008',
    LatestUnsubmittedID: 0,
    LatestSubmittedID: 82,
    PendingMarkID: 0,
    Action: '02', // 预期: ["重新作答", "查看上次作答"]
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

describe('练习列表组件测试', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockFetch({
      status: 0,
      data: {
        practices: MOCK_PRACTICES,
        total: MOCK_PRACTICES.length,
      },
    });
  });

  it('应渲染页面核心元素', () => {
    render(PracticeList);
    expect(screen.getByPlaceholderText('练习名称 / 知识点')).toBeInTheDocument();
    expect(screen.getByTestId('difficult-select')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '重置' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '搜索' })).toBeInTheDocument();
    expect(screen.getByRole('table')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '经典巩固' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '常练常新' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '智能提升' })).toBeInTheDocument();
  });

  it('支持输入练习名称/知识点和选择练习难度', async () => {
    render(PracticeList);
    const nameInput = screen.getByPlaceholderText('练习名称 / 知识点');
    await fireEvent.input(nameInput, { target: { value: '测试练习' } });
    expect(nameInput).toHaveValue('测试练习');

    await fireEvent.click(screen.getAllByRole('button', { name: 'Toggle dropdown' })[0]);
    const difficultSelect = screen.getByTestId('difficult-select');
    await within(difficultSelect).findByText('中等').then(fireEvent.click);
    expect(difficultSelect).toHaveTextContent('中等');
  });

  describe('搜索功能', () => {
    it('成功加载练习数据', async () => {
      render(PracticeList);
      await fireEvent.click(screen.getByRole('button', { name: '搜索' }));

      await waitFor(() => {
        MOCK_PRACTICES.forEach((practice) => {
          expect(screen.getByText(practice.Name)).toBeInTheDocument();
        });
      });
    });

    it('无数据时展示暂无信息', async () => {
      mockFetch({ status: 0, data: { practices: [], total: 0 } });
      render(PracticeList);
      await fireEvent.click(screen.getByRole('button', { name: '搜索' }));

      await waitFor(() => {
        expect(screen.getByText('暂无练习数据')).toBeInTheDocument();
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
      render(PracticeList);
      await fireEvent.click(screen.getByRole('button', { name: '搜索' }));

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
      render(PracticeList);
      await fireEvent.click(screen.getByRole('button', { name: '搜索' }));

      await waitFor(() => {
        expect(toast.error).toHaveBeenCalledWith('请求失败：400 Bad Request');
      });
    });

    it('请求失败显示后端返回的 msg', async () => {
      mockFetch({ status: -1, msg: '模拟失败消息' });
      render(PracticeList);
      await fireEvent.click(screen.getByRole('button', { name: '搜索' }));

      await waitFor(() => {
        expect(toast.error).toHaveBeenCalledWith('模拟失败消息');
      });
    });

    it('请求失败但无 msg，使用默认错误提示', async () => {
      mockFetch({ status: -1 });
      render(PracticeList);
      await fireEvent.click(screen.getByRole('button', { name: '搜索' }));

      await waitFor(() => {
        expect(toast.error).toHaveBeenCalledWith('获取练习列表失败');
      });
    });

    it('获取的 practices 为 null，但是不会报错', async () => {
      mockFetch({ status: 0, data: { practices: null } });
      render(PracticeList);
      await fireEvent.click(screen.getByRole('button', { name: '搜索' }));

      await waitFor(() => {
        expect(screen.getByText('暂无练习数据')).toBeInTheDocument();
      });
    });

    it('获取的 practices 非数组，使用默认错误提示', async () => {
      mockFetch({ status: 0, data: { practices: 0 } });
      render(PracticeList);
      await fireEvent.click(screen.getByRole('button', { name: '搜索' }));

      await waitFor(() => {
        expect(toast.error).toHaveBeenCalledWith('practice_list 数据类型错误');
      });
    });
  });

  describe('分页功能', () => {
    it('输入页号和页大小发送请求获取数据', async () => {
      mockFetch({
        status: 0,
        data: {
          practices: [...Array(15)].map((_, i) => ({
            ...MOCK_PRACTICES[0],
            ID: i + 1,
            Name: `练习 ${i + 1}`,
          })),
          total: 15,
        },
      });

      render(PracticeList);

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
  });

  describe('表格内容', () => {
    beforeEach(() => {
      render(PracticeList);
    });

    it('正确显示所有练习的基本信息', () => {
      // 检查表格行数是否正确（包括表头）
      const rows = screen.getAllByRole('row');
      expect(rows.length).toBe(MOCK_PRACTICES.length + 1);

      // 检查第一个练习（全新未开始）
      const row1 = screen.getByText('基础语法练习').closest('tr');
      expect(within(row1).getByText('0')).toBeInTheDocument(); // AttemptCount
      expect(within(row1).getByText('简单')).toBeInTheDocument(); // Difficulty
      expect(within(row1).getByText('3')).toBeInTheDocument(); // AllowedAttempts
      expect(within(row1).getByText('10')).toBeInTheDocument(); // QuestionCount
      expect(within(row1).getAllByText('--')).toHaveLength(3); // 未作答练习的WrongCount/TotalScore/HighestScore

      // 检查第四个练习（已完成可重新作答）
      const row4 = screen.getByText('操作系统模拟').closest('tr');
      expect(within(row4).getByText('2')).toBeInTheDocument(); // AttemptCount
      expect(within(row4).getByText('中等')).toBeInTheDocument(); // Difficulty
      expect(within(row4).getByText('8')).toBeInTheDocument(); // WrongCount
      expect(within(row4).getAllByText('85')).toHaveLength(2); // TotalScore、HighestScore
    });

    it('正确显示不同状态的分数信息', () => {
      // 未作答练习显示"--"
      const row1 = screen.getByText('基础语法练习').closest('tr');
      expect(within(row1).getAllByText('--')).toHaveLength(3);

      // 已作答练习显示实际分数
      const row3 = screen.getByText('指针进阶训练').closest('tr');
      expect(within(row3).getByText('75')).toBeInTheDocument();

      // 等待批改的练习显示"--"
      const row6 = screen.getByText('网络协议练习').closest('tr');
      expect(within(row6).getAllByText('--')).toHaveLength(2);
    });

    it('正确显示无限次尝试的文本', () => {
      const row8 = screen.getByText('无限练习模式').closest('tr');
      expect(within(row8).getByText('不限次数')).toBeInTheDocument();
    });
  });

  describe('操作按钮', () => {
    beforeEach(() => {
      vi.clearAllMocks();
      render(PracticeList);
    });

    it('操作异常提示“练习列表存在操作异常”，并且异常的练习操作爆红', async () => {
      expect(screen.getByRole('button', { name: '操作异常' })).toHaveClass('error');

      await waitFor(() => {
        expect(toast.error).toHaveBeenCalledWith('练习列表存在操作异常');
      });
    });

    it('未作答练习显示"进入练习"按钮并正确跳转', async () => {
      const enterBtn = screen.getByRole('button', { name: '进入练习' });
      expect(enterBtn).toBeInTheDocument();
      await fireEvent.click(enterBtn);
      expect(goto).toHaveBeenCalledWith('/student/answer/practice?practice-id=1');
    });

    it('第一次作答未完成显示"继续作答"按钮', async () => {
      const continueBtn = screen.getAllByRole('button', { name: '继续作答' })[0];
      expect(continueBtn).toBeInTheDocument();

      await fireEvent.click(continueBtn);
      expect(goto).toHaveBeenCalledWith('/student/answer/practice?practice-id=2');
    });

    it('有未完成作答显示"继续作答"和"查看上次作答"按钮', async () => {
      const continueBtn = screen.getAllByRole('button', { name: '继续作答' })[1];
      const viewBtn = screen.getAllByRole('button', { name: '查看上次作答' })[0];
      expect(continueBtn).toBeInTheDocument();
      expect(viewBtn).toBeInTheDocument();

      await fireEvent.click(continueBtn);
      expect(goto).toHaveBeenCalledWith('/student/answer/practice?practice-id=3');

      await fireEvent.click(viewBtn);
      expect(goto).toHaveBeenCalledWith('/student/answer/result/practice?practice-id=3');
    });

    it('可重新作答练习显示"重新作答"和"查看上次作答"按钮', async () => {
      const retryBtn = screen.getAllByRole('button', { name: '重新作答' })[0];
      const viewBtn = screen.getAllByRole('button', { name: '查看上次作答' })[1];
      expect(retryBtn).toBeInTheDocument();
      expect(viewBtn).toBeInTheDocument();

      await fireEvent.click(retryBtn);
      expect(goto).toHaveBeenCalledWith('/student/answer/practice?practice-id=4');

      await fireEvent.click(viewBtn);
      expect(goto).toHaveBeenCalledWith('/student/answer/result/practice?practice-id=4');
    });

    it('等待批改练习显示"等待批改完成"按钮且不可点击', async () => {
      const waitBtn = screen.getByRole('button', { name: '等待批改完成' });
      expect(waitBtn).toBeInTheDocument();

      await fireEvent.click(waitBtn);
      expect(goto).not.toHaveBeenCalled();
    });

    it('达到最大尝试次数显示"查看上次作答"按钮', async () => {
      const viewBtn = screen.getAllByRole('button', { name: '查看上次作答' })[2];
      expect(viewBtn).toBeInTheDocument();

      await fireEvent.click(viewBtn);
      expect(goto).toHaveBeenCalledWith('/student/answer/result/practice?practice-id=5');
    });
  });

  it('重置按钮清空所有筛选条件', async () => {
    render(PracticeList);
    const nameInput = screen.getByPlaceholderText('练习名称 / 知识点');
    await fireEvent.input(nameInput, { target: { value: '测试练习' } });
    expect(nameInput).toHaveValue('测试练习');

    await fireEvent.click(screen.getAllByRole('button', { name: 'Toggle dropdown' })[0]);
    const difficultSelect = screen.getByTestId('difficult-select');
    await within(difficultSelect).findByText('困难').then(fireEvent.click);
    expect(difficultSelect).toHaveTextContent('困难');

    await fireEvent.click(screen.getByRole('button', { name: '重置' }));

    const dropdownInput = within(difficultSelect).getByRole('textbox');
    expect(nameInput).toHaveValue('');
    expect(dropdownInput).toHaveValue('全部');
  });

  // TODO
  // describe('练习类型切换', () => {
  //   it('切换类型时更新当前类型', async () => {
  //     render(PracticeList);

  //     await fireEvent.click(screen.getByRole('button', { name: '常练常新' }));
  //     expect(screen.getByRole('button', { name: '常练常新' })).toHaveClass('selected');

  //     await fireEvent.click(screen.getByRole('button', { name: '智能提升' }));
  //     expect(screen.getByRole('button', { name: '智能提升' })).toHaveClass('selected');
  //   });

  //   it('切换类型时发送请求获取对应数据', async () => {
  //     render(PracticeList);

  //     await fireEvent.click(screen.getByRole('button', { name: '常练常新' }));
  //     expect(global.fetch).toHaveBeenCalledWith(expect.stringContaining('type=02'), expect.any(Object));

  //     await fireEvent.click(screen.getByRole('button', { name: '智能提升' }));
  //     expect(global.fetch).toHaveBeenCalledWith(expect.stringContaining('type=04'), expect.any(Object));
  //   });

  //   it('不同类型显示不同表格列', async () => {
  //     render(PracticeList);

  //     // 经典巩固类型
  //     expect(screen.getByText('试卷题数')).toBeInTheDocument();
  //     expect(screen.getByText('错题数')).toBeInTheDocument();

  //     // 切换到常练常新类型
  //     await fireEvent.click(screen.getByRole('button', { name: '常练常新' }));
  //     expect(screen.getByText('正确率')).toBeInTheDocument();
  //     expect(screen.getByText('时长')).toBeInTheDocument();

  //     // 切换到智能提升类型
  //     await fireEvent.click(screen.getByRole('button', { name: '智能提升' }));
  //     expect(screen.getByText('已作题数 / 题目存量')).toBeInTheDocument();
  //     expect(screen.getByText('错题数 / 题目存量')).toBeInTheDocument();
  //   });
  // });
});
