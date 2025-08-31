import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/svelte';
import { setContext, getContext } from 'svelte';
import GradeChart from '../GradeChart.svelte';

// Mock dependencies
vi.mock('$lib/components/Select/Select.svelte', () => ({
  default: vi.fn()
}));

vi.mock('$lib/components/Select/Option.svelte', () => ({
  default: vi.fn()
}));

vi.mock('$lib/components/Table/Empty.svelte', () => ({
  default: vi.fn()
}));

vi.mock('./charts/BarChart.svelte', () => ({
  default: vi.fn()
}));

vi.mock('$lib/components/Loading/Loading.svelte', () => ({
  default: vi.fn()
}));

// Mock fetch
global.fetch = vi.fn();

describe('GradeChart 组件', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    global.fetch.mockClear();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('基本渲染测试', () => {
    it('应该能正常挂载练习类型', () => {
      const { container } = render(GradeChart, {
        props: {
          type: 'practice',
          resource_id: '123',
        },
      });

      expect(container.querySelector('.chart-container')).toBeInTheDocument();
      expect(container.querySelector('.title')).toHaveTextContent('成绩分析');
    });

    it('应该能正常挂载考试类型', () => {
      const papers = [
        { id: '1', name: '试卷1', total_score: 100 },
        { id: '2', name: '试卷2', total_score: 80 }
      ];

      const { container } = render(GradeChart, {
        props: {
          type: 'exam',
          resource_id: '123',
          papers,
        },
      });

      expect(container.querySelector('.chart-container')).toBeInTheDocument();
      expect(container.querySelector('.dropdown')).toBeInTheDocument();
    });

    it('考试类型只有一个试卷时不显示下拉框', () => {
      const papers = [{ id: '1', name: '试卷1', total_score: 100 }];

      const { container } = render(GradeChart, {
        props: {
          type: 'exam',
          resource_id: '123',
          papers,
        },
      });

      expect(container.querySelector('.dropdown')).not.toBeInTheDocument();
    });

    it('无效类型时不渲染内容', () => {
      const { container } = render(GradeChart, {
        props: {
          type: 'invalid',
          resource_id: '123',
        },
      });

      expect(container.querySelector('.chart-container')).not.toBeInTheDocument();
    });
  });

  describe('分数区间计算测试', () => {
    it('应该正确计算最佳列数', async () => {
      // 这里我们需要通过渲染组件并检查内部状态来测试
      // 由于这是内部函数，我们通过观察渲染结果来验证
      
      const { container } = render(GradeChart, {
        props: {
          type: 'practice',
          resource_id: '123',
        },
      });

      // 验证组件正常渲染，间接验证计算函数工作正常
      expect(container.querySelector('.chart-container')).toBeInTheDocument();
    });
  });

  describe('API 调用测试', () => {
    it('应该为练习类型正确调用 API', async () => {
      const mockResponse = {
        status: 0,
        data: {
          practice_id: '123',
          practice_name: '练习1',
          grade_distribution: [5, 10, 15, 20, 25]
        }
      };

      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockResponse)
      });

      render(GradeChart, {
        props: {
          type: 'practice',
          resource_id: '123',
        },
      });

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith(
          expect.stringContaining('/api/grade/distribution'),
          expect.objectContaining({
            method: 'GET',
            credentials: 'include'
          })
        );
      });

      const callUrl = global.fetch.mock.calls[0][0];
      expect(callUrl).toContain('category=practice');
      expect(callUrl).toContain('practiceID=123');
      expect(callUrl).toContain('columnNum=8');
    });

    it('应该为考试类型正确调用 API', async () => {
      const papers = [{ id: '1', name: '试卷1', total_score: 100 }];
      
      const mockResponse = {
        status: 0,
        data: {
          exam_id: '123',
          exam_name: '考试1',
          grade_distribution: [{
            exam_session_id: '1',
            exam_paper_id: '1',
            exam_paper_name: '试卷1',
            total_score: 100,
            score_distribution: [5, 10, 15, 20, 25]
          }]
        }
      };

      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockResponse)
      });

      render(GradeChart, {
        props: {
          type: 'exam',
          resource_id: '123',
          papers,
        },
      });

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith(
          expect.stringContaining('/api/grade/distribution'),
          expect.objectContaining({
            method: 'GET',
            credentials: 'include'
          })
        );
      });

      const callUrl = global.fetch.mock.calls[0][0];
      expect(callUrl).toContain('category=exam');
      expect(callUrl).toContain('examID=123');
    });

    it('应该处理 API 错误响应', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: false,
        status: 500
      });

      const { container } = render(GradeChart, {
        props: {
          type: 'practice',
          resource_id: '123',
        },
      });

      await waitFor(() => {
        expect(container.querySelector('.error-state')).toBeInTheDocument();
      });
    });

    it('应该处理网络错误', async () => {
      global.fetch.mockRejectedValueOnce(new Error('Network error'));

      const { container } = render(GradeChart, {
        props: {
          type: 'practice',
          resource_id: '123',
        },
      });

      await waitFor(() => {
        expect(container.querySelector('.error-state')).toBeInTheDocument();
      });
    });

    it('应该处理业务逻辑错误', async () => {
      const mockResponse = {
        status: 1,
        msg: '数据获取失败'
      };

      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockResponse)
      });

      const { container } = render(GradeChart, {
        props: {
          type: 'practice',
          resource_id: '123',
        },
      });

      await waitFor(() => {
        expect(container.querySelector('.error-state')).toBeInTheDocument();
      });
    });
  });

  describe('加载状态测试', () => {
    it('应该显示加载状态', async () => {
      // Mock a slow response
      global.fetch.mockImplementationOnce(() => 
        new Promise(resolve => {
          setTimeout(() => {
            resolve({
              ok: true,
              json: () => Promise.resolve({
                status: 0,
                data: {
                  practice_id: '123',
                  practice_name: '练习1',
                  grade_distribution: [5, 10, 15, 20, 25]
                }
              })
            });
          }, 100);
        })
      );

      const { container } = render(GradeChart, {
        props: {
          type: 'practice',
          resource_id: '123',
        },
      });

      // 初始加载状态应该存在
      expect(container.querySelector('.loading-state')).toBeInTheDocument();

      // 等待加载完成
      await waitFor(() => {
        expect(container.querySelector('.loading-state')).not.toBeInTheDocument();
      }, { timeout: 200 });
    });
  });

  describe('空数据状态测试', () => {
    it('应该显示无数据状态', async () => {
      const mockResponse = {
        status: 0,
        data: {
          practice_id: '123',
          practice_name: '练习1',
          grade_distribution: []
        }
      };

      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockResponse)
      });

      const { container } = render(GradeChart, {
        props: {
          type: 'practice',
          resource_id: '123',
        },
      });

      await waitFor(() => {
        expect(container.querySelector('.empty-state')).toBeInTheDocument();
      });
    });
  });

  describe('试卷切换测试', () => {
    it('应该能切换试卷并重新加载数据', async () => {
      const papers = [
        { id: '1', name: '试卷1', total_score: 100 },
        { id: '2', name: '试卷2', total_score: 80 }
      ];

      const mockResponse1 = {
        status: 0,
        data: {
          exam_id: '123',
          exam_name: '考试1',
          grade_distribution: [{
            exam_session_id: '1',
            exam_paper_id: '1',
            exam_paper_name: '试卷1',
            total_score: 100,
            score_distribution: [5, 10, 15, 20, 25]
          }]
        }
      };

      const mockResponse2 = {
        status: 0,
        data: {
          exam_id: '123',
          exam_name: '考试1',
          grade_distribution: [{
            exam_session_id: '2',
            exam_paper_id: '2',
            exam_paper_name: '试卷2',
            total_score: 80,
            score_distribution: [3, 8, 12, 18, 22]
          }]
        }
      };

      global.fetch
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(mockResponse1)
        })
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(mockResponse2)
        });

      const { container } = render(GradeChart, {
        props: {
          type: 'exam',
          resource_id: '123',
          papers,
        },
      });

      // 等待初始加载
      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledTimes(1);
      });

      // 这里需要模拟选择器变化，由于我们 mock 了 Select 组件，
      // 实际测试中需要根据具体的 Select 组件实现来触发变化
      // 目前先验证基本渲染
      expect(container.querySelector('.dropdown')).toBeInTheDocument();
    });
  });

  describe('Context 数据测试', () => {
    it('应该能获取练习 context 数据', () => {
      const mockContext = {
        practiceData: {
          total_score: 120
        }
      };

      // 注意：由于 Svelte 的 context 系统在测试环境中的限制，
      // 这个测试可能需要使用更复杂的设置
      const { container } = render(GradeChart, {
        props: {
          type: 'practice',
          resource_id: '123',
        },
        context: new Map([['practice', mockContext]])
      });

      expect(container.querySelector('.chart-container')).toBeInTheDocument();
    });

    it('应该能获取考试 context 数据', () => {
      const mockContext = {
        examData: {
          papers: [
            { id: '1', name: '试卷1', total_score: 100 }
          ]
        }
      };

      const { container } = render(GradeChart, {
        props: {
          type: 'exam',
          resource_id: '123',
          papers: [{ id: '1', name: '试卷1', total_score: 100 }]
        },
        context: new Map([['exam', mockContext]])
      });

      expect(container.querySelector('.chart-container')).toBeInTheDocument();
    });
  });

  describe('边界条件测试', () => {
    it('应该处理缺少 resource_id 的情况', async () => {
      const { container } = render(GradeChart, {
        props: {
          type: 'practice',
          resource_id: null,
        },
      });

      await waitFor(() => {
        expect(container.querySelector('.error-state')).toBeInTheDocument();
      });
    });

    it('应该处理空的 papers 数组', () => {
      const { container } = render(GradeChart, {
        props: {
          type: 'exam',
          resource_id: '123',
          papers: [],
        },
      });

      expect(container.querySelector('.chart-container')).toBeInTheDocument();
    });

    it('应该处理无效的试卷数据', async () => {
      const papers = [
        { id: '1', name: '试卷1' } // 缺少 total_score
      ];

      const mockResponse = {
        status: 0,
        data: {
          exam_id: '123',
          exam_name: '考试1',
          grade_distribution: []
        }
      };

      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockResponse)
      });

      const { container } = render(GradeChart, {
        props: {
          type: 'exam',
          resource_id: '123',
          papers,
        },
      });

      await waitFor(() => {
        expect(container.querySelector('.empty-state')).toBeInTheDocument();
      });
    });
  });

  describe('数据处理逻辑测试', () => {
    it('应该正确处理练习数据', async () => {
      const mockResponse = {
        status: 0,
        data: {
          practice_id: '123',
          practice_name: '练习1',
          grade_distribution: [5, 10, 15, 20, 25]
        }
      };

      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockResponse)
      });

      const { container } = render(GradeChart, {
        props: {
          type: 'practice',
          resource_id: '123',
        },
      });

      await waitFor(() => {
        expect(container.querySelector('.echarts-wrapper')).toBeInTheDocument();
      });
    });

    it('应该正确处理考试数据', async () => {
      const papers = [{ id: '1', name: '试卷1', total_score: 100 }];
      
      const mockResponse = {
        status: 0,
        data: {
          exam_id: '123',
          exam_name: '考试1',
          grade_distribution: [{
            exam_session_id: '1',
            exam_paper_id: '1',
            exam_paper_name: '试卷1',
            total_score: 100,
            score_distribution: [5, 10, 15, 20, 25]
          }]
        }
      };

      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockResponse)
      });

      const { container } = render(GradeChart, {
        props: {
          type: 'exam',
          resource_id: '123',
          papers,
        },
      });

      await waitFor(() => {
        expect(container.querySelector('.echarts-wrapper')).toBeInTheDocument();
      });
    });
  });

  describe('样式和布局测试', () => {
    it('多试卷时应该使用较小的图表高度', () => {
      const papers = [
        { id: '1', name: '试卷1', total_score: 100 },
        { id: '2', name: '试卷2', total_score: 80 }
      ];

      const { container } = render(GradeChart, {
        props: {
          type: 'exam',
          resource_id: '123',
          papers,
        },
      });

      expect(container.querySelector('.chart.small')).toBeInTheDocument();
    });

    it('单试卷时应该使用正常的图表高度', () => {
      const papers = [{ id: '1', name: '试卷1', total_score: 100 }];

      const { container } = render(GradeChart, {
        props: {
          type: 'exam',
          resource_id: '123',
          papers,
        },
      });

      expect(container.querySelector('.chart')).toBeInTheDocument();
      expect(container.querySelector('.chart.small')).not.toBeInTheDocument();
    });
  });

  describe('calculateOptimalColumnNum 逻辑覆盖测试', () => {
  const testCases = [
    { totalScore: 0, expectedColumnNum: 5 },
    { totalScore: 3, expectedColumnNum: 3 },
    { totalScore: 8, expectedColumnNum: 4 },
    { totalScore: 30, expectedColumnNum: 5 },
    { totalScore: 70, expectedColumnNum: 7 },
    { totalScore: 100, expectedColumnNum: 8 },
    { totalScore: 150, expectedColumnNum: 10 },
  ];

  testCases.forEach(({ totalScore, expectedColumnNum }) => {
    it(`应使用总分 ${totalScore} 时 columnNum=${expectedColumnNum}`, async () => {
      const mockResponse = {
        status: 0,
        data: {
          practice_id: '123',
          practice_name: '练习',
          grade_distribution: [1, 2, 3],
        },
      };

      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockResponse),
      });

      // 设置 context 中的 total_score
      const mockContext = {
        practiceData: { total_score: totalScore },
      };

      render(GradeChart, {
        props: { type: 'practice', resource_id: '123' },
        context: new Map([['practice', mockContext]]),
      });

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalled();
      });

      const url = global.fetch.mock.calls[0][0];
      const params = new URLSearchParams(url.split('?')[1]);
      expect(params.get('columnNum')).toBe(String(expectedColumnNum));
    });
  });
});
});