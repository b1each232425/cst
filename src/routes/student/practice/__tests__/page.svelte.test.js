import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, waitFor, within } from '@testing-library/svelte';
import PracticeList from '../+page.svelte';
import { toast } from '$lib/components/Toast/Toast.js';
import { goto } from '$app/navigation';

vi.mock('$app/navigation', () => ({ goto: vi.fn() }));
vi.mock('$lib/components/Toast/Toast.js', () => ({ toast: { error: vi.fn() } }));

const MOCK_PRACTICES = [
  // 00: 没有作答过 → 进入练习
  {
    ID: 1,
    Name: '练习一',
    Type: '00',
    AttemptCount: 0,
    Difficulty: '00',
    AllowedAttempts: 5,
    QuestionCount: 10,
    WrongCount: 0,
    TotalScore: null,
    HighestScore: null,
    PaperTotalScore: 100,
    PaperID: 101,
    LatestUnsubmittedID: 0,
    LatestSubmittedID: null,
    Action: '00', // 进入练习
  },
  // 02: 正常可重新作答 → 重新作答、查看上次作答
  {
    ID: 2,
    Name: '练习二',
    Type: '00',
    AttemptCount: 2,
    Difficulty: '00',
    AllowedAttempts: 5,
    QuestionCount: 8,
    WrongCount: 1,
    TotalScore: 80,
    HighestScore: 90,
    PaperTotalScore: 100,
    PaperID: 102,
    LatestUnsubmittedID: 0,
    LatestSubmittedID: 12,
    Action: '02', // 重新作答、查看上次作答
  },
  // 04: 存在未提交记录且不是第一次答题 → 继续作答、查看上次作答
  {
    ID: 3,
    Name: '练习三',
    Type: '00',
    AttemptCount: 2,
    Difficulty: '05',
    AllowedAttempts: 5,
    QuestionCount: 12,
    WrongCount: 2,
    TotalScore: 70,
    HighestScore: 85,
    PaperTotalScore: 100,
    PaperID: 103,
    LatestUnsubmittedID: 33,
    LatestSubmittedID: 22,
    Action: '04', // 继续作答、查看上次作答
  },
  // 06: 已提交但未批改（本次作答未批改，不能进行下一次作答）→ 等待批改完成
  {
    ID: 4,
    Name: '练习四',
    Type: '00',
    AttemptCount: 1,
    Difficulty: '02',
    AllowedAttempts: 5,
    QuestionCount: 15,
    WrongCount: 3,
    TotalScore: null,
    HighestScore: 92,
    PaperTotalScore: 100,
    PaperID: 104,
    LatestUnsubmittedID: 0,
    LatestSubmittedID: 44,
    Action: '06', // 等待批改完成
  },
  // 08: 达到最大尝试次数 → 查看上次作答
  {
    ID: 5,
    Name: '练习五',
    Type: '00',
    AttemptCount: 5,
    Difficulty: '02',
    AllowedAttempts: 5,
    QuestionCount: 10,
    WrongCount: 5,
    TotalScore: 75,
    HighestScore: 90,
    PaperTotalScore: 100,
    PaperID: 105,
    LatestUnsubmittedID: 0,
    LatestSubmittedID: 55,
    Action: '08', // 查看上次作答
  },
  // 10: 存在未提交记录且是第一次答题 → 继续作答
  {
    ID: 6,
    Name: '练习六',
    Type: '00',
    AttemptCount: 1,
    Difficulty: '04',
    AllowedAttempts: 0,
    QuestionCount: 20,
    WrongCount: 10,
    TotalScore: null,
    HighestScore: 88,
    PaperTotalScore: 100,
    PaperID: 106,
    LatestUnsubmittedID: 66,
    LatestSubmittedID: null,
    Action: '10', // 继续作答
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

  describe('操作按钮', () => {
    beforeEach(async () => {
      render(PracticeList);
      await waitFor(() => {
        expect(screen.getByText('练习一')).toBeInTheDocument();
      });
    });

    it('未作答练习显示"进入练习"按钮并正确跳转', async () => {
      const enterBtn = screen.getByRole('button', { name: '进入练习' });
      expect(enterBtn).toBeInTheDocument();
      await fireEvent.click(enterBtn);
      expect(goto).toHaveBeenCalledWith('/student/answer/practice?practice-id=1');
    });

    it('可重新作答练习显示"重新作答"和"查看上次作答"按钮', async () => {
      const retryBtn = screen.getByRole('button', { name: '重新作答' });
      const viewBtn = screen.getAllByRole('button', { name: '查看上次作答' })[0];
      expect(retryBtn).toBeInTheDocument();
      expect(viewBtn).toBeInTheDocument();

      await fireEvent.click(retryBtn);
      expect(goto).toHaveBeenCalledWith('/student/answer/practice?practice-id=2');

      await fireEvent.click(viewBtn);
      expect(goto).toHaveBeenCalledWith('/student/answer/result/practice?practice-id=2');
    });

    it('有未完成作答显示"继续作答"和"查看上次作答"按钮', async () => {
      const continueBtn = screen.getAllByRole('button', { name: '继续作答' })[0];
      const viewBtn = screen.getAllByRole('button', { name: '查看上次作答' })[1];
      expect(continueBtn).toBeInTheDocument();
      expect(viewBtn).toBeInTheDocument();

      await fireEvent.click(continueBtn);
      expect(goto).toHaveBeenCalledWith('/student/answer/practice?practice-id=3');

      await fireEvent.click(viewBtn);
      expect(goto).toHaveBeenCalledWith('/student/answer/result/practice?practice-id=3');
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

    it('第一次作答未完成显示"继续作答"按钮', async () => {
      const continueBtn = screen.getAllByRole('button', { name: '继续作答' })[1];
      expect(continueBtn).toBeInTheDocument();

      await fireEvent.click(continueBtn);
      expect(goto).toHaveBeenCalledWith('/student/answer/practice?practice-id=6');
    });
  });

  describe('表格内容', () => {
    beforeEach(async () => {
      render(PracticeList);
      await waitFor(() => {
        expect(screen.getByText('练习一')).toBeInTheDocument();
      });
    });

    it('正确显示练习基本信息', () => {
      const row = screen.getByText('练习一').closest('tr');
      expect(within(row).getByText('0')).toBeInTheDocument(); // AttemptCount
      expect(within(row).getByText('简单')).toBeInTheDocument(); // Difficulty
      expect(within(row).getByText('5')).toBeInTheDocument(); // AllowedAttempts
    });

    it('未作答练习显示"--"或空值', () => {
      const row = screen.getByText('练习一').closest('tr');
      expect(within(row).getAllByText('--')).toHaveLength(3); // WrongCount TotalScore HighestScore
    });

    it('已作答练习显示实际数据', () => {
      const row = screen.getByText('练习二').closest('tr');
      expect(within(row).getByText('1')).toBeInTheDocument(); // WrongCount
      expect(within(row).getByText('80')).toBeInTheDocument(); // TotalScore
      expect(within(row).getByText('90')).toBeInTheDocument(); // HighestScore
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
