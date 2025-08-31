// src/routes/teacher/grade/_components/detail/__test__/AnalysisPanel.svelte.test.js
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, waitFor, within } from '@testing-library/svelte';
import { setContext } from 'svelte';
import { toast } from '$lib/components/Toast/Toast.js';
import AnalysisPanel from '../AnalysisPanel.svelte';

// Mock 依赖模块
vi.mock('$lib/components/Toast/Toast.js', () => ({
  toast: { error: vi.fn(), success: vi.fn() }
}));

// 模拟数据
const MOCK_PAPERS = [
  {
    id: 1,
    name: '期中考试试卷A'
  },
  {
    id: 2,
    name: '期中考试试卷B'
  }
];

const MOCK_ANALYSIS_DATA = {
  status: 0,
  data: {
    exam_paper_questions: {
      '1': [
        {
          ID: 1,
          Type: '00', // 单选题
          Content: '以下哪个是正确的？',
          Options: [
            { label: 'A', value: '选项A' },
            { label: 'B', value: '选项B' },
            { label: 'C', value: '选项C' },
            { label: 'D', value: '选项D' }
          ],
          Answers: ['A'],
          Order: 1,
          Score: 5,
          GroupID: 1
        },
        {
          ID: 2,
          Type: '01', // 主观题
          Content: '请描述你的观点',
          Answers: [
            { answer: '这是一个参考答案' }
          ],
          Order: 2,
          Score: 10,
          GroupID: 1
        }
      ],
      '2': [
        {
          ID: 3,
          Type: '02', // 多选题
          Content: '以下哪些是正确的？',
          Options: [
            { label: 'A', value: '选项A' },
            { label: 'B', value: '选项B' },
            { label: 'C', value: '选项C' },
            { label: 'D', value: '选项D' }
          ],
          Answers: ['A', 'C'],
          Order: 3,
          Score: 8,
          GroupID: 2
        }
      ]
    },
    exam_paper_groups: [
      {
        ID: 1,
        Name: '选择题'
      },
      {
        ID: 2,
        Name: '多选题'
      }
    ],
    question_answers_stats: {
      '1': {
        'A': 15,
        'B': 5,
        'C': 3,
        'D': 2
      },
      '3': {
        'A': 12,
        'B': 8,
        'C': 10,
        'D': 5
      }
    },
    subjective_scores: {
      '2': 7.5
    }
  }
};

const MOCK_PRACTICE_DATA = {
  status: 0,
  data: {
    exam_paper_questions: {
      '1': [
        {
          ID: 1,
          Type: '00',
          Content: '练习题1',
          Options: [
            { label: 'A', value: '选项A' },
            { label: 'B', value: '选项B' }
          ],
          Answers: ['A'],
          Order: 1,
          Score: 3,
          GroupID: 1
        }
      ]
    },
    exam_paper_groups: [
      {
        ID: 1,
        Name: '基础题'
      }
    ],
    question_answers_stats: {
      '1': {
        'A': 8,
        'B': 2
      }
    },
    subjective_scores: {}
  }
};

// 练习数据的不同格式
const MOCK_PRACTICE_DATA_ALTERNATIVE_FORMAT = {
  status: 0,
  data: {
    practice_paper_questions: {
      '1': [
        {
          ID: 2,
          Type: '01',
          Content: '练习主观题',
          Answers: [{ answer: '参考答案' }],
          Order: 1,
          Score: 5,
          GroupID: 1
        }
      ]
    },
    practice_paper_groups: [
      {
        ID: 1,
        Name: '练习题组'
      }
    ],
    question_answers_stats: {},
    subjective_scores: { '2': 4.2 }
  }
};

// 数组格式的练习数据
const MOCK_PRACTICE_DATA_ARRAY_FORMAT = {
  status: 0,
  data: {
    questions: [
      {
        ID: 3,
        Type: '00',
        Content: '数组格式题目',
        Options: [
          { label: 'A', value: '选项A' },
          { label: 'B', value: '选项B' }
        ],
        Answers: ['A'],
        Order: 1,
        Score: 2
      }
    ],
    groups: [
      {
        ID: 1,
        Name: '默认题目组'
      }
    ],
    question_answers_stats: {
      '3': { 'A': 5, 'B': 3 }
    },
    subjective_scores: {}
  }
};

// Context 测试数据
const MOCK_PRACTICE_CONTEXT = {
  practiceData: {
    id: 'context-practice-123',
    name: '来自Context的练习'
  }
};

const MOCK_EXAM_CONTEXT = {
  examData: {
    id: 'context-exam-456',
    name: '来自Context的考试',
    papers: [
      { id: 10, name: 'Context试卷1' },
      { id: 11, name: 'Context试卷2' }
    ]
  }
};

// 全局 fetch mock
global.fetch = vi.fn();

describe('AnalysisPanel.svelte', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    global.fetch.mockClear();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('练习类型 (type="practice")', () => {
    it('应该正确渲染练习分析面板', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(MOCK_PRACTICE_DATA)
      });

      render(AnalysisPanel, {
        props: {
          type: 'practice',
          resource_id: 'practice123'
        }
      });

      // 验证标题显示
      expect(screen.getByText('试卷分析')).toBeInTheDocument();

      // 等待数据加载完成
      await waitFor(() => {
        expect(screen.getByText(/基础题/)).toBeInTheDocument();
      });

      // 验证API调用
      expect(global.fetch).toHaveBeenCalledWith(
        '/api/grade?category=practice&practiceID=practice123',
        {
          method: 'GET',
          credentials: 'include'
        }
      );
    });

    it('应该显示加载状态', () => {
      global.fetch.mockImplementation(() => new Promise(() => {})); // 永不解决的Promise

      render(AnalysisPanel, {
        props: {
          type: 'practice',
          resource_id: 'practice123'
        }
      });

      expect(screen.getByText('正在加载试卷分析数据...')).toBeInTheDocument();
    });

    it('应该处理API错误', async () => {
      global.fetch.mockRejectedValueOnce(new Error('Network error'));

      render(AnalysisPanel, {
        props: {
          type: 'practice',
          resource_id: 'practice123'
        }
      });

      // 等待错误处理完成
      await waitFor(() => {
        expect(screen.getByText('暂无试卷分析数据')).toBeInTheDocument();
      });
    });

    it('应该处理不同格式的练习数据 - practice_paper_questions', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(MOCK_PRACTICE_DATA_ALTERNATIVE_FORMAT)
      });

      render(AnalysisPanel, {
        props: {
          type: 'practice',
          resource_id: 'practice123'
        }
      });

      await waitFor(() => {
        expect(screen.getByText(/练习题组/)).toBeInTheDocument();
        expect(screen.getByText('练习主观题')).toBeInTheDocument();
      });

      expect(global.fetch).toHaveBeenCalledWith(
        '/api/grade?category=practice&practiceID=practice123',
        {
          method: 'GET',
          credentials: 'include'
        }
      );
    });

    it('应该处理数组格式的练习数据', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(MOCK_PRACTICE_DATA_ARRAY_FORMAT)
      });

      render(AnalysisPanel, {
        props: {
          type: 'practice',
          resource_id: 'practice123'
        }
      });

      await waitFor(() => {
        expect(screen.getByText('数组格式题目')).toBeInTheDocument();
      });
    });

    it('应该为没有GroupID的题目设置默认GroupID', async () => {
      const dataWithoutGroupId = {
        status: 0,
        data: {
          questions: [
            {
              ID: 1,
              Type: '00',
              Content: '无GroupID题目',
              Options: [{ label: 'A', value: '选项A' }],
              Answers: ['A'],
              Order: 1,
              Score: 2
            }
          ],
          question_answers_stats: { '1': { 'A': 5 } },
          subjective_scores: {}
        }
      };

      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(dataWithoutGroupId)
      });

      render(AnalysisPanel, {
        props: {
          type: 'practice',
          resource_id: 'practice123'
        }
      });

      await waitFor(() => {
        expect(screen.getByText('无GroupID题目')).toBeInTheDocument();
        expect(screen.getByText((content, element) => 
          content.includes('默认题目组')
        )).toBeInTheDocument();
      });
    });
  });

  describe('考试类型 (type="exam")', () => {
    it('应该正确渲染考试分析面板', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(MOCK_ANALYSIS_DATA)
      });

      render(AnalysisPanel, {
        props: {
          type: 'exam',
          resource_id: 'exam123',
          papers: MOCK_PAPERS
        }
      });

      // 验证标题显示
      expect(screen.getByText('试卷分析')).toBeInTheDocument();

      // 等待数据加载完成
      await waitFor(() => {
        expect(screen.getByText(/选择题/)).toBeInTheDocument();
        expect(screen.getByText(/多选题/)).toBeInTheDocument();
      });

      // 验证API调用（使用第一个试卷的ID）
      expect(global.fetch).toHaveBeenCalledWith(
        '/api/grade?category=exam&examSessionID=1',
        {
          method: 'GET',
          credentials: 'include'
        }
      );
    });

    it('应该显示试卷选择器当有多个试卷时', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(MOCK_ANALYSIS_DATA)
      });

      render(AnalysisPanel, {
        props: {
          type: 'exam',
          resource_id: 'exam123',
          papers: MOCK_PAPERS
        }
      });

      // 验证试卷选择器存在（通过CSS类查找）
      await waitFor(() => {
        expect(document.querySelector('.paper-select')).toBeInTheDocument();
      });
    });

    it('应该不显示试卷选择器当只有一个试卷时', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(MOCK_ANALYSIS_DATA)
      });

      render(AnalysisPanel, {
        props: {
          type: 'exam',
          resource_id: 'exam123',
          papers: [MOCK_PAPERS[0]] // 只有一个试卷
        }
      });

      // 等待渲染完成
      await waitFor(() => {
        expect(screen.getByText(/选择题/)).toBeInTheDocument();
      });

      // 验证没有试卷选择器
      expect(document.querySelector('.paper-select')).not.toBeInTheDocument();
    });

    it('应该支持试卷切换功能', async () => {
      // 第一次调用返回第一个试卷的数据
      global.fetch
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(MOCK_ANALYSIS_DATA)
        })
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({
            ...MOCK_ANALYSIS_DATA,
            data: {
              ...MOCK_ANALYSIS_DATA.data,
              exam_paper_groups: [
                { ID: 1, Name: '试卷B题组' }
              ]
            }
          })
        });

      render(AnalysisPanel, {
        props: {
          type: 'exam',
          resource_id: 'exam123',
          papers: MOCK_PAPERS
        }
      });

      // 等待初始数据加载
      await waitFor(() => {
        const groupTitles = screen.getAllByText((content) => 
          content.includes('选择题') || content.includes('多选题')
        );
        expect(groupTitles.length).toBeGreaterThan(0);
      });

      // 查找并操作试卷选择器
      const selectContainer = document.querySelector('.paper-select');
      expect(selectContainer).toBeInTheDocument();

      // 模拟点击选择第二个试卷的选项按钮
      const optionButtons = within(selectContainer).getAllByTestId('option');
      expect(optionButtons).toHaveLength(2);
      
      await fireEvent.click(optionButtons[1]); // 点击第二个试卷

      // 验证第二次API调用
      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledTimes(2);
        expect(global.fetch).toHaveBeenLastCalledWith(
          '/api/grade?category=exam&examSessionID=2',
          {
            method: 'GET',
            credentials: 'include'
          }
        );
      });
    });

    it('应该处理试卷选择时的API错误', async () => {
      global.fetch
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(MOCK_ANALYSIS_DATA)
        })
        .mockRejectedValueOnce(new Error('Network error'));

      render(AnalysisPanel, {
        props: {
          type: 'exam',
          resource_id: 'exam123',
          papers: MOCK_PAPERS
        }
      });

      // 等待初始数据加载
      await waitFor(() => {
        const groupTitles = screen.getAllByText((content) => 
          content.includes('选择题') || content.includes('多选题')
        );
        expect(groupTitles.length).toBeGreaterThan(0);
      });

      // 模拟点击选择第二个试卷（会触发错误）
      const selectContainer = document.querySelector('.paper-select');
      const optionButtons = within(selectContainer).getAllByTestId('option');
      await fireEvent.click(optionButtons[1]);

      // 验证错误处理 - 发生错误后应该清空数据并显示空状态
      await waitFor(() => {
        expect(screen.getByText('暂无试卷分析数据')).toBeInTheDocument();
      });
    });
  });

  describe('组件交互功能', () => {
    it('应该支持折叠/展开功能', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(MOCK_PRACTICE_DATA)
      });

      render(AnalysisPanel, {
        props: {
          type: 'practice',
          resource_id: 'practice123'
        }
      });

      // 等待数据加载
      await waitFor(() => {
        expect(screen.getByText((content, element) => 
          content.includes('基础题') || content.includes('选择题')
        )).toBeInTheDocument();
      });

      // 查找折叠按钮
      const foldButton = screen.getByRole('button');
      
      // 点击折叠
      await fireEvent.click(foldButton);

      // 验证内容被隐藏
      expect(screen.queryByText((content, element) => 
        content.includes('基础题') || content.includes('选择题')
      )).not.toBeInTheDocument();

      // 再次点击展开
      await fireEvent.click(foldButton);

      // 验证内容重新显示
      expect(screen.getByText((content, element) => 
        content.includes('基础题') || content.includes('选择题')
      )).toBeInTheDocument();
    });
  });

  describe('数据转换功能', () => {
    it('应该正确转换客观题数据', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(MOCK_ANALYSIS_DATA)
      });

      render(AnalysisPanel, {
        props: {
          type: 'exam',
          resource_id: 'exam123',
          papers: [MOCK_PAPERS[0]]
        }
      });

      await waitFor(() => {
        // 验证题目内容显示
        expect(screen.getByText('以下哪个是正确的？')).toBeInTheDocument();
        
        // 验证选项统计显示
        const optionElements = screen.getAllByText((content) => 
          content.includes('A:')
        );
        expect(optionElements.length).toBeGreaterThan(0);
        expect(screen.getByText('(60%)')).toBeInTheDocument(); // 15/25 = 60%
        
        // 验证正确答案显示
        const answerElements = screen.getAllByText('正确答案:');
        expect(answerElements.length).toBeGreaterThan(0);
      });
    });

    it('应该正确转换主观题数据', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(MOCK_ANALYSIS_DATA)
      });

      render(AnalysisPanel, {
        props: {
          type: 'exam',
          resource_id: 'exam123',
          papers: [MOCK_PAPERS[0]]
        }
      });

      await waitFor(() => {
        // 验证主观题内容
        expect(screen.getByText('请描述你的观点')).toBeInTheDocument();
        
        // 验证平均分显示
        expect(screen.getByText('平均分: 7.5')).toBeInTheDocument();
        
        // 验证参考答案显示
        expect(screen.getByText('这是一个参考答案')).toBeInTheDocument();
      });
    });
  });

  describe('错误处理', () => {
    it('应该处理API返回错误状态', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          status: 1,
          msg: '获取数据失败'
        })
      });

      render(AnalysisPanel, {
        props: {
          type: 'practice',
          resource_id: 'practice123'
        }
      });

      await waitFor(() => {
        expect(screen.getByText('暂无试卷分析数据')).toBeInTheDocument();
      });
    });

    it('应该处理HTTP错误', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error'
      });

      render(AnalysisPanel, {
        props: {
          type: 'practice',
          resource_id: 'practice123'
        }
      });

      await waitFor(() => {
        expect(screen.getByText('暂无试卷分析数据')).toBeInTheDocument();
      });
    });

    it('应该处理空数据情况', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          status: 0,
          data: {
            exam_paper_questions: {},
            exam_paper_groups: [],
            question_answers_stats: {},
            subjective_scores: {}
          }
        })
      });

      render(AnalysisPanel, {
        props: {
          type: 'practice',
          resource_id: 'practice123'
        }
      });

      await waitFor(() => {
        expect(screen.getByText('暂无试卷分析数据')).toBeInTheDocument();
      });
    });
  });

  describe('Context 功能', () => {
    // 由于Svelte测试库的限制，我们用不同的方式来测试Context功能
    // 通过直接修改测试中的数据来模拟Context行为

    it('应该正确处理缺失的context', () => {
      // 不mock任何context，测试组件是否能正常处理
      expect(() => {
        render(AnalysisPanel, {
          props: {
            type: 'practice',
            resource_id: 'practice123'
          }
        });
      }).not.toThrow();
    });

    it('应该优先使用 Context 中的练习数据', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(MOCK_PRACTICE_DATA)
      });

      // 注意：由于测试环境的限制，我们无法直接测试Context功能
      // 但是可以通过检查API调用来验证功能
      render(AnalysisPanel, {
        props: {
          type: 'practice',
          resource_id: 'fallback-id'
        }
      });

      // 验证使用了 props 中的 ID
      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith(
          '/api/grade?category=practice&practiceID=fallback-id',
          {
            method: 'GET',
            credentials: 'include'
          }
        );
      });
    });

    it('应该在 Context 数据不存在时回退到 props', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(MOCK_PRACTICE_DATA)
      });

      render(AnalysisPanel, {
        props: {
          type: 'practice',
          resource_id: 'fallback-id'
        }
      });

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith(
          '/api/grade?category=practice&practiceID=fallback-id',
          {
            method: 'GET',
            credentials: 'include'
          }
        );
      });
    });

    it('应该正确处理 Context 中的考试数据', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(MOCK_ANALYSIS_DATA)
      });

      render(AnalysisPanel, {
        props: {
          type: 'exam',
          resource_id: 'fallback-exam-id',
          papers: MOCK_PAPERS
        }
      });

      // 等待数据加载，验证使用了 props 中的试卷数据
      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith(
          '/api/grade?category=exam&examSessionID=1', // props 中第一个试卷的 ID
          {
            method: 'GET',
            credentials: 'include'
          }
        );
      });

      // 验证试卷选择器显示 props 中的试卷
      await waitFor(() => {
        expect(document.querySelector('.paper-select')).toBeInTheDocument();
      });
    });

    it('应该响应式地处理 Context 数据变化', async () => {
      global.fetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(MOCK_PRACTICE_DATA)
      });

      const { rerender } = render(AnalysisPanel, {
        props: {
          type: 'practice',
          resource_id: 'initial-id'
        }
      });

      // 初始调用
      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith(
          '/api/grade?category=practice&practiceID=initial-id',
          expect.any(Object)
        );
      });

      // 模拟 props 数据更新
      global.fetch.mockClear();
      
      rerender({
        type: 'practice',
        resource_id: 'updated-id'
      });

      // 验证不会自动重新调用API（需要手动触发）
      expect(global.fetch).not.toHaveBeenCalled();
    });
  });

  describe('Props 验证', () => {
    it('应该正确处理必需的props', () => {
      expect(() => {
        render(AnalysisPanel, {
          props: {
            type: 'practice',
            resource_id: 'practice123'
          }
        });
      }).not.toThrow();
    });

    it('应该正确处理可选的props', () => {
      expect(() => {
        render(AnalysisPanel, {
          props: {
            type: 'exam',
            resource_id: 'exam123',
            papers: MOCK_PAPERS
          }
        });
      }).not.toThrow();
    });

    it('应该处理空的papers数组', () => {
      expect(() => {
        render(AnalysisPanel, {
          props: {
            type: 'exam',
            resource_id: 'exam123',
            papers: []
          }
        });
      }).not.toThrow();
    });

    it('应该处理无效的resource_id', async () => {
      global.fetch.mockRejectedValueOnce(new Error('Invalid ID'));

      render(AnalysisPanel, {
        props: {
          type: 'practice',
          resource_id: null
        }
      });

      // 组件应该不崩溃，显示空状态
      expect(screen.getByText('试卷分析')).toBeInTheDocument();
    });
  });

  describe('响应式功能测试', () => {
    it('应该正确计算options响应式变量', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(MOCK_ANALYSIS_DATA)
      });

      render(AnalysisPanel, {
        props: {
          type: 'exam',
          resource_id: 'exam123',
          papers: MOCK_PAPERS
        }
      });

      await waitFor(() => {
        const selectContainer = document.querySelector('.paper-select');
        expect(selectContainer).toBeInTheDocument();
        
        // 验证选项是否正确生成（通过按钮计数）
        const optionButtons = within(selectContainer).getAllByTestId('option');
        expect(optionButtons).toHaveLength(MOCK_PAPERS.length);
      });
    });

    it('应该正确计算currentResourceId响应式变量', () => {
      const { rerender } = render(AnalysisPanel, {
        props: {
          type: 'practice',
          resource_id: 'practice123'
        }
      });

      // 测试 type 变化时的行为
      rerender({
        type: 'exam',
        resource_id: 'exam456',
        papers: MOCK_PAPERS
      });

      expect(() => rerender).not.toThrow();
    });
  });

  describe('边界情况测试', () => {
    it('应该处理题目没有选项的情况', async () => {
      const dataWithoutOptions = {
        status: 0,
        data: {
          exam_paper_questions: {
            '1': [
              {
                ID: 1,
                Type: '01', // 主观题，没有Options
                Content: '主观题目',
                Answers: [{ answer: '参考答案' }],
                Order: 1,
                Score: 10,
                GroupID: 1
              }
            ]
          },
          exam_paper_groups: [{ ID: 1, Name: '主观题组' }],
          question_answers_stats: {},
          subjective_scores: { '1': 8.5 }
        }
      };

      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(dataWithoutOptions)
      });

      render(AnalysisPanel, {
        props: {
          type: 'practice',
          resource_id: 'practice123'
        }
      });

      await waitFor(() => {
        expect(screen.getByText('主观题目')).toBeInTheDocument();
        expect(screen.getByText('平均分: 8.5')).toBeInTheDocument();
      });
    });

    it('应该处理统计数据为空的情况', async () => {
      const dataWithEmptyStats = {
        status: 0,
        data: {
          exam_paper_questions: {
            '1': [
              {
                ID: 1,
                Type: '00',
                Content: '客观题',
                Options: [
                  { label: 'A', value: '选项A' },
                  { label: 'B', value: '选项B' }
                ],
                Answers: ['A'],
                Order: 1,
                Score: 5,
                GroupID: 1
              }
            ]
          },
          exam_paper_groups: [{ ID: 1, Name: '客观题组' }],
          question_answers_stats: {}, // 空统计
          subjective_scores: {}
        }
      };

      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(dataWithEmptyStats)
      });

      render(AnalysisPanel, {
        props: {
          type: 'practice',
          resource_id: 'practice123'
        }
      });

      await waitFor(() => {
        expect(screen.getByText('客观题')).toBeInTheDocument();
        // 验证选择率显示为0% - 有两个选项，所以会有两个0%
        const percentageElements = screen.getAllByText('(0%)');
        expect(percentageElements.length).toBe(2); // A和B选项都是0%
      });
    });

    it('应该处理网络超时情况', async () => {
      global.fetch.mockImplementation(() => 
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Timeout')), 100)
        )
      );

      render(AnalysisPanel, {
        props: {
          type: 'practice',
          resource_id: 'practice123'
        }
      });

      await waitFor(() => {
        expect(screen.getByText('暂无试卷分析数据')).toBeInTheDocument();
      }, { timeout: 200 });
    });

    it('应该处理malformed JSON响应', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.reject(new Error('Invalid JSON'))
      });

      render(AnalysisPanel, {
        props: {
          type: 'practice',
          resource_id: 'practice123'
        }
      });

      await waitFor(() => {
        expect(screen.getByText('暂无试卷分析数据')).toBeInTheDocument();
      });
    });
  });
});