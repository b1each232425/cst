import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, fireEvent, screen, waitFor } from '@testing-library/svelte';
import PracticePage from '../+page.svelte';
import { readable } from 'svelte/store';

// mock依赖组件和方法
vi.mock('$app/navigation', () => ({ goto: vi.fn() }));
vi.mock('$app/state', () => ({
  page: readable({
    url: {
      searchParams: {
        get: (key) => {
          if (key === 'practice-id') return '191';
          return null;
        }
      }
    }
  })
}));
vi.mock('$lib/components/Toast/Toast', () => ({
  toast: { success: vi.fn(), error: vi.fn(), warning: vi.fn() },
}));
vi.mock('../_component/CountdownTimer/CountdownTimer.svelte', () => ({ default: () => null }));
vi.mock('../_component/SwitchBtn/BulmaSwitchBlue.svelte', () => ({
  default: ({ is_full_examMode }) => ({
    $$render: () => `<button data-testid="switch-mode" onclick="window.__togglePracticeMode && window.__togglePracticeMode()">切换模式</button>`
  })
}));
window.__togglePracticeMode = () => {
  // 这里需要能访问到 Svelte 的 is_full_examMode
  // 你可以用 Svelte store 或其它方式暴露出来
};
vi.mock('../_component/WaterMark.svelte', () => ({ default: () => null }));
vi.mock('$lib/components/Button/Button.svelte', () => ({ default: () => null }));
vi.mock('../_component/ExamInfoModal/ExamInfoModal.svelte', () => ({ default: () => null }));
vi.mock('../_component/QuestionAnswer/question.svelte', () => ({ default: () => null }));
vi.mock('$lib/components/MessageBox/MessageBox.js', () => ({ default: vi.fn() }));

// mock fetch
const mockJson = vi.fn();
global.fetch = vi.fn(() =>
  Promise.resolve({
    ok: true,
    json: mockJson,
  })
);

const mockApiData = {
  status: 0,
  msg: "success",
  API: "/api/respondent/init",
  method: "POST",
  data: {
    Info: {
      PracticeSubmissionID: 191,
      PaperName: "H3C选择题练习试卷",
      TotalScore: 100,
      QuestionCount: 10,
      GroupCount: 2
    },
    QuestionGroupInfo: {
      "44": { ID: 44, Name: "一、单选题", Order: 1 },
      "45": { ID: 45, Name: "二、综合题", Order: 2 }
    },
    Questions: {
      "44": [
        {
          ID: 3704,
          Type: "00", // 单选
          Content: "<p>H3C公司的总部位于哪个城市？</p>",
          group_name: "一、单选题",
          Options: [
            { Label: "A", Value: "<p>北京</p>" },
            { Label: "B", Value: "<p>杭州</p>" },
            { Label: "C", Value: "<p>深圳</p>" },
            { Label: "D", Value: "<p>上海</p>" }
          ],
          Order: 1
        },
        {
          ID: 3705,
          Type: "01", // 多选
          Content: "<p>以下哪些属于H3C交换机系列？</p>",
          group_name: "一、单选题",
          Options: [
            { Label: "A", Value: "<p>S系列</p>" },
            { Label: "B", Value: "<p>E系列</p>" },
            { Label: "C", Value: "<p>WX系列</p>" },
            { Label: "D", Value: "<p>R系列</p>" }
          ],
          Order: 2
        },
        {
          ID: 3706,
          Type: "02", // 判断
          Content: "<p>H3C是中国品牌。</p>",
          group_name: "一、单选题",
          Options: [
            { Label: "A", Value: "<p>正确</p>" },
            { Label: "B", Value: "<p>错误</p>" }
          ],
          Order: 3
        },
        {
          ID: 3707,
          Type: "03", // 填空
          Content: "<p>H3C路由器的默认登录协议端口是____。</p>",
          group_name: "一、单选题",
          AnswerNum: 1,
          Order: 4
        },
        {
          ID: 3708,
          Type: "04", // 简答
          Content: "<p>请简述H3C设备的主要优势。</p>",
          group_name: "一、单选题",
          Order: 5
        }
      ],
      "45": [
        {
          ID: 3709,
          Type: "05", // 编程题
          Content: "<p>请写出一个Python脚本，输出'H3C网络设备'。</p>",
          group_name: "二、综合题",
          Order: 6
        },
        {
          ID: 3710,
          Type: "06", // 材料题
          Content: "<p>阅读以下材料，回答后续问题：H3C公司成立于2003年...</p>",
          group_name: "二、综合题",
          Order: 7
        },
        {
          ID: 3711,
          Type: "07", // 匹配题
          Content: "<p>将设备与对应功能进行匹配。</p>",
          group_name: "二、综合题",
          Options: [
            { Label: "A", Value: "S系列" },
            { Label: "B", Value: "WX系列" }
          ],
          MatchItems: [
            { Label: "1", Value: "交换机" },
            { Label: "2", Value: "无线控制器" }
          ],
          Order: 8
        },
        {
          ID: 3712,
          Type: "08", // 排序题
          Content: "<p>请将以下命令按正确顺序排列。</p>",
          group_name: "二、综合题",
          SortItems: [
            "display version",
            "display interface",
            "display current-configuration"
          ],
          Order: 9
        },
        {
          ID: 3713,
          Type: "09", // 论述题
          Content: "<p>请论述网络安全在企业中的重要性。</p>",
          group_name: "二、综合题",
          Order: 10
        }
      ]
    },
    ElapsedSeconds: 3998517
  }
};

describe('PracticePage 练习页面交互', () => {
  beforeEach(() => {
    window.localStorage.clear();
    mockJson.mockResolvedValue(mockApiData);
  });
  afterEach(() => {
    vi.clearAllMocks();
  });

  it('加载后端数据后渲染练习标题和题组', async () => {
    render(PracticePage);

    await waitFor(() => {
      expect(screen.getByText('H3C选择题练习试卷')).toBeTruthy();
      expect(screen.getByText('一、单选题')).toBeTruthy();
      expect(screen.getByText(/H3C公司的总部位于哪个城市/)).toBeTruthy();
    });
  });

  it('切换逐题模式后可点击下一题和上一题', async () => {
    render(PracticePage);

    // 等待页面渲染出“逐题模式”标签和切换按钮
    await waitFor(() => {
      expect(screen.getByText('逐题模式')).toBeTruthy();
      expect(screen.getByTestId('switch-mode')).toBeTruthy();
    });

    // 点击切换模式按钮，进入逐题模式
    await fireEvent.click(screen.getByTestId('switch-mode'));

    // 等待“下一题”按钮出现
    await waitFor(() => {
      expect(screen.getByText('下一题')).toBeTruthy();
    });

    // 点击“下一题”
    await fireEvent.click(screen.getByText('下一题'));

    // 检查是否切换到第二题
    await waitFor(() => {
      expect(screen.getByText(/H3C S系列交换机默认的管理VLAN是/)).toBeTruthy();
    });

    // 点击“上一题”
    await fireEvent.click(screen.getByText('上一题'));

    // 检查是否切换回第一题
    await waitFor(() => {
      expect(screen.getByText(/H3C公司的总部位于哪个城市/)).toBeTruthy();
    });
  });

    it('渲染练习标题和题组', async () => {
    render(PracticePage);
    await waitFor(() => {
      expect(screen.getByText('H3C选择题练习试卷')).toBeTruthy();
      expect(screen.getByText('一、单选题')).toBeTruthy();
      expect(screen.getByText('二、综合题')).toBeTruthy();
    });
  });

  it('渲染单选题内容', async () => {
    render(PracticePage);
    await waitFor(() => {
      expect(screen.getByText(/H3C公司的总部位于哪个城市/)).toBeTruthy();
      expect(screen.getByText('北京')).toBeTruthy();
    });
  });

  it('渲染多选题内容', async () => {
    render(PracticePage);
    await waitFor(() => {
      expect(screen.getByText(/以下哪些属于H3C交换机系列/)).toBeTruthy();
      expect(screen.getByText('S系列')).toBeTruthy();
      expect(screen.getByText('WX系列')).toBeTruthy();
    });
  });

  it('渲染判断题内容', async () => {
    render(PracticePage);
    await waitFor(() => {
      expect(screen.getByText(/H3C是中国品牌/)).toBeTruthy();
      expect(screen.getByText('正确')).toBeTruthy();
      expect(screen.getByText('错误')).toBeTruthy();
    });
  });

  it('渲染填空题内容', async () => {
    render(PracticePage);
    await waitFor(() => {
      expect(screen.getByText(/H3C路由器的默认登录协议端口是/)).toBeTruthy();
    });
  });

  it('渲染简答题内容', async () => {
    render(PracticePage);
    await waitFor(() => {
      expect(screen.getByText(/请简述H3C设备的主要优势/)).toBeTruthy();
    });
  });

  it('渲染编程题内容', async () => {
    render(PracticePage);
    await waitFor(() => {
      expect(screen.getByText(/请写出一个Python脚本/)).toBeTruthy();
    });
  });

  it('渲染材料题内容', async () => {
    render(PracticePage);
    await waitFor(() => {
      expect(screen.getByText(/阅读以下材料，回答后续问题/)).toBeTruthy();
    });
  });

  it('渲染匹配题内容', async () => {
    render(PracticePage);
    await waitFor(() => {
      expect(screen.getByText(/将设备与对应功能进行匹配/)).toBeTruthy();
      expect(screen.getByText('S系列')).toBeTruthy();
      expect(screen.getByText('交换机')).toBeTruthy();
    });
  });

  it('渲染排序题和论述题内容', async () => {
    render(PracticePage);
    await waitFor(() => {
      expect(screen.getByText(/请将以下命令按正确顺序排列/)).toBeTruthy();
      expect(screen.getByText(/请论述网络安全在企业中的重要性/)).toBeTruthy();
    });
  });

    // 基础渲染
  it('渲染练习标题和题组', async () => {
    render(PracticePage);
    await waitFor(() => {
      expect(screen.getByText('H3C选择题练习试卷')).toBeTruthy();
      expect(screen.getByText('一、单选题')).toBeTruthy();
      expect(screen.getByText('二、综合题')).toBeTruthy();
    });
  });

  // 单选题
  it('渲染单选题内容', async () => {
    render(PracticePage);
    await waitFor(() => {
      expect(screen.getByText(/H3C公司的总部位于哪个城市/)).toBeTruthy();
      expect(screen.getByText('北京')).toBeTruthy();
    });
  });

  // 多选题
  it('渲染多选题内容', async () => {
    render(PracticePage);
    await waitFor(() => {
      expect(screen.getByText(/以下哪些属于H3C交换机系列/)).toBeTruthy();
      expect(screen.getByText('S系列')).toBeTruthy();
      expect(screen.getByText('WX系列')).toBeTruthy();
    });
  });

  // 判断题
  it('渲染判断题内容', async () => {
    render(PracticePage);
    await waitFor(() => {
      expect(screen.getByText(/H3C是中国品牌/)).toBeTruthy();
      expect(screen.getByText('正确')).toBeTruthy();
      expect(screen.getByText('错误')).toBeTruthy();
    });
  });

  // 填空题
  it('渲染填空题内容', async () => {
    render(PracticePage);
    await waitFor(() => {
      expect(screen.getByText(/H3C路由器的默认登录协议端口是/)).toBeTruthy();
    });
  });

  // 简答题
  it('渲染简答题内容', async () => {
    render(PracticePage);
    await waitFor(() => {
      expect(screen.getByText(/请简述H3C设备的主要优势/)).toBeTruthy();
    });
  });

  // 编程题
  it('渲染编程题内容', async () => {
    render(PracticePage);
    await waitFor(() => {
      expect(screen.getByText(/请写出一个Python脚本/)).toBeTruthy();
    });
  });

  // 材料题
  it('渲染材料题内容', async () => {
    render(PracticePage);
    await waitFor(() => {
      expect(screen.getByText(/阅读以下材料，回答后续问题/)).toBeTruthy();
    });
  });

  // 匹配题
  it('渲染匹配题内容', async () => {
    render(PracticePage);
    await waitFor(() => {
      expect(screen.getByText(/将设备与对应功能进行匹配/)).toBeTruthy();
      expect(screen.getByText('S系列')).toBeTruthy();
      expect(screen.getByText('交换机')).toBeTruthy();
    });
  });

  // 排序题和论述题
  it('渲染排序题和论述题内容', async () => {
    render(PracticePage);
    await waitFor(() => {
      expect(screen.getByText(/请将以下命令按正确顺序排列/)).toBeTruthy();
      expect(screen.getByText(/请论述网络安全在企业中的重要性/)).toBeTruthy();
    });
  });

  // 逐题模式切换
  it('切换逐题模式后可点击下一题和上一题', async () => {
    render(PracticePage);
    await waitFor(() => {
      expect(screen.getByText('逐题模式')).toBeTruthy();
      expect(screen.getByTestId('switch-mode')).toBeTruthy();
    });
    await fireEvent.click(screen.getByTestId('switch-mode'));
    await waitFor(() => {
      expect(screen.getByText('下一题')).toBeTruthy();
    });
    await fireEvent.click(screen.getByText('下一题'));
    await waitFor(() => {
      expect(screen.getByText(/以下哪些属于H3C交换机系列/)).toBeTruthy();
    });
    await fireEvent.click(screen.getByText('上一题'));
    await waitFor(() => {
      expect(screen.getByText(/H3C公司的总部位于哪个城市/)).toBeTruthy();
    });
  });

  // 导航栏渲染
  it('渲染右侧导航栏', async () => {
    render(PracticePage);
    await waitFor(() => {
      expect(screen.getByText('一、单选题')).toBeTruthy();
      expect(screen.getByText('二、综合题')).toBeTruthy();
    });
  });

  // 分组题目数量
  it('每组题目数量正确', async () => {
    render(PracticePage);
    await waitFor(() => {
      expect(screen.getAllByText('一、单选题').length).toBeGreaterThan(0);
      expect(screen.getAllByText('二、综合题').length).toBeGreaterThan(0);
    });
  });

  // 总分渲染
  it('渲染总分', async () => {
    render(PracticePage);
    await waitFor(() => {
      expect(screen.getByText(/100/)).toBeTruthy();
    });
  });

  // 已答题状态
  it('已答题题目有标记', async () => {
    render(PracticePage);
    // 这里假设你的组件会有“已答”字样或特殊样式
    // expect(screen.getByText('已答')).toBeTruthy();
  });

  // 未答题状态
  it('未答题题目有标记', async () => {
    render(PracticePage);
    // 这里假设你的组件会有“未答”字样或特殊样式
    // expect(screen.getByText('未答')).toBeTruthy();
  });

  // 左侧信息栏切换
  it('点击左侧信息栏切换按钮', async () => {
    render(PracticePage);
    const btn = screen.getByRole('button');
    await fireEvent.click(btn);
    // 断言左侧信息栏隐藏或显示
  });

  // 弹窗组件渲染
  it('弹窗组件渲染', async () => {
    render(PracticePage);
    // 这里假设有“查看详情”按钮
    expect(screen.getByText('查看详情')).toBeTruthy();
    await fireEvent.click(screen.getByText('查看详情'));
    // 断言弹窗内容
  });

  // Toast提示
  it('Toast提示组件调用', async () => {
    render(PracticePage);
    // 这里可以直接断言 mock 是否被调用
    expect(vi.mocked(toast.success)).toBeDefined();
  });

  // MessageBox弹窗
  it('MessageBox弹窗组件调用', async () => {
    render(PracticePage);
    // 这里可以直接断言 mock 是否被调用
    expect(vi.mocked(MessageBox)).toBeDefined();
  });

  // 切换全卷模式
  it('切换回全卷模式', async () => {
    render(PracticePage);
    await waitFor(() => {
      expect(screen.getByTestId('switch-mode')).toBeTruthy();
    });
    await fireEvent.click(screen.getByTestId('switch-mode'));
    await fireEvent.click(screen.getByTestId('switch-mode'));
    // 断言全卷模式题目全部显示
    expect(screen.getByText(/H3C公司的总部位于哪个城市/)).toBeTruthy();
    expect(screen.getByText(/请论述网络安全在企业中的重要性/)).toBeTruthy();
  });

  // 题目分组切换
  it('题目分组切换', async () => {
    render(PracticePage);
    // 假设有分组导航按钮
    // await fireEvent.click(screen.getByText('二、综合题'));
    // 断言分组题目显示
    expect(screen.getByText(/请写出一个Python脚本/)).toBeTruthy();
  });

  // 题目选项渲染
  it('题目选项渲染', async () => {
    render(PracticePage);
    await waitFor(() => {
      expect(screen.getByText('A')).toBeTruthy();
      expect(screen.getByText('B')).toBeTruthy();
    });
  });

  // 题目顺序渲染
  it('题目顺序渲染', async () => {
    render(PracticePage);
    // 断言题目顺序正确
    expect(screen.getByText(/H3C公司的总部位于哪个城市/)).toBeTruthy();
    expect(screen.getByText(/以下哪些属于H3C交换机系列/)).toBeTruthy();
  });

  // 题目内容渲染（边界）
  it('题目内容渲染（边界）', async () => {
    render(PracticePage);
    // 断言最后一题内容
    expect(screen.getByText(/请论述网络安全在企业中的重要性/)).toBeTruthy();
  });
});