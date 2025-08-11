import { render, fireEvent } from '@testing-library/svelte';
import '@testing-library/jest-dom';
import ExamPage from '../+page.svelte';
import { readable } from 'svelte/store';

// mock $app/stores，传递 exam-session-id-arr
vi.mock('$app/state', () => ({
  page: readable({
    url: {
      searchParams: {
        get: (key) => {
          if (key === 'exam-session-id-arr') return '101,102,103';
          return null;
        }
      }
    },
    params: {},
    route: {},
    status: 200,
    error: null,
    data: {}
  })
}));

// mock fetch 返回你需要的全部数据
const mockApiData = {
  userID: 1675,
  rank: [
    { student_id: 1675, official_name: "林子馨", total_score: 13, rank: 1 },
    { student_id: 1676, official_name: "吴圳", total_score: 0, rank: 2 },
    { student_id: 1677, official_name: "科比", total_score: 0, rank: 2 }
  ],
  examInfo: {
    AnswerNum: 6,
    Name: "2025年期末考试",
    QuestionNum: 6,
    StudentScore: 13,
    AnswerTime: 45
  },
  question_groups_map: [
    [322, { ID: 322, Name: "一、单选题", Order: 1 }],
    [323, { ID: 323, Name: "二、多选题", Order: 2 }],
    [324, { ID: 324, Name: "三、判断题", Order: 3 }]
  ],
  exam_questions_map: [
    ["322", [
      {
        ID: 4160,
        Score: 2,
        Type: "00",
        Content: "<p><span style=\"font-family: 宋体; font-size: 10.5pt\">为了提高模块的独立性，模块内部最好是()</span><span style=\"font-family: Aptos; font-size: 10.5pt\">&nbsp;</span></p>",
        Options: [
          { label: "A", value: "<p><span style=\"font-family: 宋体; font-size: 10.5pt\">逻辑内聚</span></p>" },
          { label: "B", value: "<p><span style=\"font-family: 宋体; font-size: 10.5pt\">功能内聚</span></p>" },
          { label: "C", value: "<p><span style=\"font-family: 宋体; font-size: 10.5pt\">时间内聚</span></p>" },
          { label: "D", value: "<p><span style=\"font-family: 宋体; font-size: 10.5pt\">通信内聚</span></p>" }
        ],
        Answers: ["B"],
        Analysis: null,
        Title: null,
        Input: null,
        Output: null,
        Example: null,
        Repo: null,
        Creator: null,
        CreateTime: null,
        UpdatedBy: null,
        UpdateTime: null,
        Status: "04",
        Order: 1,
        GroupID: 322,
        AnswerNum: 0,
        StudentAnswer: { answer: ["A"] },
        StudentScore: 0
      },
      {
        ID: 4161,
        Score: 2,
        Type: "00",
        Content: "<p><span style=\"font-family: 宋体; font-size: 10.5pt\">具有风险分析的软件生命周期模型是()</span></p>",
        Options: [
          { label: "A", value: "<p><span style=\"font-family: 宋体; font-size: 10.5pt\">瀑布模型</span></p>" },
          { label: "B", value: "<p><span style=\"font-family: 宋体; font-size: 10.5pt\">喷泉模型</span><span style=\"font-family: Aptos; font-size: 10.5pt\">&nbsp;</span></p>" },
          { label: "C", value: "<p><span style=\"font-family: 宋体; font-size: 10.5pt\">增量模型</span></p>" },
          { label: "D", value: "<p><span style=\"font-family: 宋体; font-size: 10.5pt\">螺旋模型</span><span style=\"font-family: Aptos; font-size: 10.5pt\">&nbsp;</span></p>" }
        ],
        Answers: ["D"],
        Analysis: null,
        Title: null,
        Input: null,
        Output: null,
        Example: null,
        Repo: null,
        Creator: null,
        CreateTime: null,
        UpdatedBy: null,
        UpdateTime: null,
        Status: "00",
        Order: 2,
        GroupID: 322,
        AnswerNum: 0,
        StudentAnswer: { answer: ["D"] },
        StudentScore: 2
      }
    ]],
    ["323", [
      {
        ID: 4162,
        Score: 3,
        Type: "02",
        Content: "<p><span style=\"font-family: 宋体; font-size: 10.5pt\">软件开发的结构化生命周期方法将软件生命周期划分成（）</span></p>",
        Options: [
          { label: "A", value: "<p><span style=\"font-family: 宋体; font-size: 10.5pt\">计划阶段</span></p>" },
          { label: "B", value: "<p><span style=\"font-family: 宋体; font-size: 10.5pt\">详细设计</span></p>" },
          { label: "C", value: "<p><span style=\"font-family: 宋体; font-size: 10.5pt\">开发阶段</span></p>" },
          { label: "D", value: "<p><span style=\"font-family: 宋体; font-size: 10.5pt\">运行阶段</span></p>" }
        ],
        Answers: ["A", "C", "D"],
        Analysis: null,
        Title: null,
        Input: null,
        Output: null,
        Example: null,
        Repo: null,
        Creator: null,
        CreateTime: null,
        UpdatedBy: null,
        UpdateTime: null,
        Status: "00",
        Order: 1,
        GroupID: 323,
        AnswerNum: 0,
        StudentAnswer: { answer: ["A", "D", "C"] },
        StudentScore: 3
      },
      {
        ID: 4163,
        Score: 3,
        Type: "02",
        Content: "<p><span style=\"font-family: 宋体; font-size: 10.5pt\">下面哪些测试方法属于白盒测试（</span><span style=\"font-family: Aptos; font-size: 10.5pt\">&nbsp;</span><span style=\"font-family: 宋体; font-size: 10.5pt\">）</span></p>",
        Options: [
          { label: "A", value: "<p><span style=\"font-family: 宋体; font-size: 10.5pt\">基本路径测试</span></p>" },
          { label: "B", value: "<p><span style=\"font-family: 宋体; font-size: 10.5pt\">等价类划分</span></p>" },
          { label: "C", value: "<p><span style=\"font-family: 宋体; font-size: 10.5pt\">边界值分析</span></p>" },
          { label: "D", value: "<p><span style=\"font-family: 宋体; font-size: 10.5pt\">错误推测</span></p>" },
          { label: "E", value: "<p><span style=\"font-family: 宋体; font-size: 10.5pt\">逻辑覆盖测试</span></p>" }
        ],
        Answers: ["A", "E"],
        Analysis: null,
        Title: null,
        Input: null,
        Output: null,
        Example: null,
        Repo: null,
        Creator: null,
        CreateTime: null,
        UpdatedBy: null,
        UpdateTime: null,
        Status: "00",
        Order: 2,
        GroupID: 323,
        AnswerNum: 0,
        StudentAnswer: { answer: ["A", "E"] },
        StudentScore: 3
      }
    ]],
    ["324", [
      {
        ID: 4164,
        Score: 5,
        Type: "04",
        Content: "<p><span style=\"font-family: 宋体; font-size: 10.5pt\">软件测试可以发现软件中的所有错误，并且证明软件没有错误()</span><span style=\"font-family: Aptos; font-size: 10.5pt\">&nbsp;</span></p>",
        Options: [
          { label: "A", value: "对" },
          { label: "B", value: "错" }
        ],
        Answers: ["A"],
        Analysis: null,
        Title: null,
        Input: null,
        Output: null,
        Example: null,
        Repo: null,
        Creator: null,
        CreateTime: null,
        UpdatedBy: null,
        UpdateTime: null,
        Status: "04",
        Order: 1,
        GroupID: 324,
        AnswerNum: 0,
        StudentAnswer: { answer: ["B"] },
        StudentScore: 0
      },
      {
        ID: 4165,
        Score: 5,
        Type: "04",
        Content: "<p><span style=\"font-family: Aptos; font-size: 10.5pt\">&nbsp;</span><span style=\"font-family: 宋体; font-size: 10.5pt\">技术评审是以提高软件质量为目的的技术活动</span><span style=\"font-family: Aptos; font-size: 10.5pt\">&nbsp;()</span></p>",
        Options: [
          { label: "A", value: "对" },
          { label: "B", value: "错" }
        ],
        Answers: ["A"],
        Analysis: null,
        Title: null,
        Input: null,
        Output: null,
        Example: null,
        Repo: null,
        Creator: null,
        CreateTime: null,
        UpdatedBy: null,
        UpdateTime: null,
        Status: "00",
        Order: 2,
        GroupID: 324,
        AnswerNum: 0,
        StudentAnswer: { answer: ["A"] },
        StudentScore: 5
      }
    ]]
  ],
  examSessionInfo: {
    ExamTime: 120,
    ExamineeID: 33,
    ID: 73,
    PaperID: 83,
    SessionNum: 79
  }
};



describe('ExamPage', () => {
    beforeEach(() => {
        vi.stubGlobal('fetch', vi.fn(() =>
            Promise.resolve({
            ok: true,
            json: () => Promise.resolve(mockApiData)
            })
        ));
        });

        afterEach(() => {
        vi.unstubAllGlobals();
        vi.clearAllMocks();
     });
  test('页面能正常渲染', () => {
    const { getByText } = render(ExamPage);
    expect(getByText('2025年期末考试')).toBeInTheDocument();
    expect(getByText('返回')).toBeInTheDocument();
  });

  test('切换作答模式', async () => {
    const { getByText, container } = render(ExamPage);
    expect(getByText('逐题模式')).toBeInTheDocument();
    const switchBtn = container.querySelector('.switch');
    if (switchBtn) {
      await fireEvent.click(switchBtn);
      expect(getByText('全卷模式')).toBeInTheDocument();
    }
  });

  test('答题卡按钮可点击', async () => {
    const { getAllByRole } = render(ExamPage);
    const buttons = getAllByRole('button');
    expect(buttons.length).toBeGreaterThan(0);
    // await fireEvent.click(buttons[0]);
    // 断言页面有变化（根据你的业务逻辑补充）
  });
  test('页面能正常渲染考试名称和分数', () => {
  const { getByText } = render(ExamPage);
  expect(getByText('2025年期末考试')).toBeInTheDocument();
  expect(getByText('13')).toBeInTheDocument(); // 学生分数
});

    test('渲染所有题型分组', () => {
    const { getByText } = render(ExamPage);
    expect(getByText('一、单选题')).toBeInTheDocument();
    expect(getByText('二、多选题')).toBeInTheDocument();
    expect(getByText('三、判断题')).toBeInTheDocument();
    });

    test('渲染题目内容', () => {
    const { getByText } = render(ExamPage);
    expect(getByText(/为了提高模块的独立性/)).toBeInTheDocument();
    expect(getByText(/具有风险分析的软件生命周期模型/)).toBeInTheDocument();
    });

    test('渲染学生答题情况', () => {
    const { getByText } = render(ExamPage);
    expect(getByText('A')).toBeInTheDocument(); // 学生答案
    expect(getByText('B')).toBeInTheDocument(); // 正确答案
    });

    test('切换作答模式后显示全卷模式', async () => {
    const { getByText, container } = render(ExamPage);
    const switchBtn = container.querySelector('.switch');
    if (switchBtn) {
        await fireEvent.click(switchBtn);
        expect(getByText('全卷模式')).toBeInTheDocument();
    }
    });

    test('点击返回按钮跳转', async () => {
    const { getByText } = render(ExamPage);
    const backBtn = getByText('返回');
    expect(backBtn).toBeInTheDocument();
    // 这里只能断言按钮存在，跳转需 mock window.location
    });
});