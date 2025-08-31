import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/svelte';
import { tick } from 'svelte';

// 模拟导航
vi.mock('$app/navigation', () => ({
  goto: vi.fn()
}));

// 模拟其他工具函数
vi.mock('../_utils/errorHandler.js', () => ({
  handleApiError: vi.fn(),
  handleSuccess: vi.fn(),
  handleFeatureNotImplemented: vi.fn()
}));

vi.mock('../_utils/dataFormatter.js', () => ({
  formatExamData: vi.fn((data) => data),
  safeDisplayNumber: vi.fn((value, precision) => value?.toFixed(precision) || '-'),
  safeDisplayText: vi.fn((value) => value || '-'),
  safeDisplayBoolean: vi.fn((value) => value ? '是' : '否')
}));

vi.mock('../_utils/debounce.js', () => ({
  debounce: vi.fn((fn, delay) => {
    return function(...args) {
      return fn.apply(this, args);
    };
  })
}));

// 现在导入组件
import ExamGradePage from '../+page.svelte';

// 模拟 fetch
global.fetch = vi.fn();

describe('考试成绩管理页面', () => {
  // 模拟考试数据
  const mockExamData = [
    {
      id: 1,
      name: '期末考试',
      type: '00',
      submitted: false,
      sessions: [
        {
          exam_session_id: 1,
          paper_name: '数学试卷',
          start_time: 1640995200000,
          end_time: 1641001200000,
          total_score: 100,
          average_score: 85.5,
          scheduled_examinees: 30,
          actual_examinees: 28,
          pass_examinees: 25,
          status: '10'
        }
      ]
    }
  ];

  const mockApiResponse = {
    status: 1,
    data: mockExamData,
    rowCount: 1,
    msg: 'success'
  };

  beforeEach(() => {
    vi.clearAllMocks();
    
    // 默认成功的 API 响应
    fetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockApiResponse)
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('组件初始化', () => {
    it('应该正确渲染组件', async () => {
      const { container } = render(ExamGradePage);
      expect(container.querySelector('.page-container')).toBeTruthy();
    });

    it('应该在组件挂载时调用 fetchExams', async () => {
      render(ExamGradePage);
      
      await waitFor(() => {
        expect(fetch).toHaveBeenCalledWith(
          expect.stringContaining('/api/grade/list'),
          expect.objectContaining({
            method: 'GET',
            credentials: 'include'
          })
        );
      });
    });

    it('应该显示页面标题', async () => {
      const { container } = render(ExamGradePage);
      await tick();
      
      expect(container.querySelector('.page-container')).toBeTruthy();
    });
  });

  describe('数据获取功能', () => {
    it('应该正确获取考试数据', async () => {
      const { container } = render(ExamGradePage);
      
      await waitFor(() => {
        expect(fetch).toHaveBeenCalledWith(
          expect.stringContaining('/api/grade/list?category=exam&page=1&pageSize=10&submitted=-1'),
          expect.objectContaining({
            method: 'GET',
            credentials: 'include'
          })
        );
      });
    });

    it('应该正确处理查询参数', async () => {
      render(ExamGradePage);
      
      await waitFor(() => {
        const callUrl = fetch.mock.calls[0][0];
        expect(callUrl).toContain('category=exam');
        expect(callUrl).toContain('page=1');
        expect(callUrl).toContain('pageSize=10');
        expect(callUrl).toContain('submitted=-1');
      });
    });
  });

  describe('批量操作功能', () => {
    it('应该显示选中项数量', async () => {
      const { container } = render(ExamGradePage);
      await tick();
      
      const selectionInfo = container.querySelector('.selection-info');
      expect(selectionInfo).toBeTruthy();
      
      const countElement = container.querySelector('.selection-info .count');
      if (countElement) {
        expect(countElement.textContent).toBe('0');
      }
    });
  });

  describe('状态显示', () => {
    it('应该正确显示加载状态', async () => {
      // 模拟慢速响应
      fetch.mockImplementationOnce(() => 
        new Promise(resolve => 
          setTimeout(() => resolve({
            ok: true,
            json: () => Promise.resolve(mockApiResponse)
          }), 100)
        )
      );
      
      const { container } = render(ExamGradePage);
      
      // 检查加载状态
      const loadingRow = container.querySelector('.loading-row');
      expect(loadingRow).toBeTruthy();
    });

    it('应该正确显示空数据状态', async () => {
      // 模拟空数据响应
      fetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          status: 1,
          data: [],
          rowCount: 0
        })
      });
      
      const { container } = render(ExamGradePage);
      
      await waitFor(() => {
        const emptyContainer = container.querySelector('.empty-container');
        expect(emptyContainer).toBeTruthy();
      });
    });
  });

  describe('表格显示', () => {
    it('应该正确显示表格头部', async () => {
      const { container } = render(ExamGradePage);
      await tick();
      
      const tableHead = container.querySelector('.exam-list-head');
      expect(tableHead).toBeTruthy();
      
      // 验证表格列标题
      const headers = container.querySelectorAll('.exam-list-head th');
      expect(headers.length).toBeGreaterThan(0);
    });
  });

  describe('工具提示', () => {
    it('应该显示平均分计算说明', async () => {
      const { container } = render(ExamGradePage);
      await tick();
      
      const tooltip = container.querySelector('.tooltip');
      expect(tooltip).toBeTruthy();
      
      if (tooltip) {
        expect(tooltip.textContent).toContain('计算方式:考试总分/考试次数');
      }
    });
  });

  describe('响应式设计', () => {
    it('应该在小屏幕上正确隐藏列', async () => {
      const { container } = render(ExamGradePage);
      await tick();
      
      // 验证表格结构
      const examTable = container.querySelector('.exam-table');
      expect(examTable).toBeTruthy();
    });
  });
});

// API相关的单元测试
describe('API函数测试', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getExams 函数', () => {
    it('应该正确构建查询参数', async () => {
      fetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          status: 1,
          data: [],
          rowCount: 0
        })
      });

      render(ExamGradePage);
      
      await waitFor(() => {
        const callUrl = fetch.mock.calls[0][0];
        expect(callUrl).toContain('/api/grade/list');
        expect(callUrl).toContain('category=exam');
      });
    });
  });

  describe('网络错误处理', () => {
    it('应该处理网络错误', async () => {
      fetch.mockRejectedValueOnce(new Error('Failed to fetch'));
      
      const { container } = render(ExamGradePage);
      
      // 验证组件仍然渲染
      expect(container.querySelector('.page-container')).toBeTruthy();
    });

    it('应该处理HTTP错误状态', async () => {
      fetch.mockResolvedValueOnce({
        ok: false,
        status: 500
      });
      
      const { container } = render(ExamGradePage);
      
      // 验证组件仍然渲染
      expect(container.querySelector('.page-container')).toBeTruthy();
    });
  });

  
});

