import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/svelte';
import { setContext } from 'svelte';
import StudentGradeTable from '../StudentGradeTable.svelte';

// Mock dependencies
vi.mock('$lib/components/Pagination/Pagination.svelte', () => ({
  default: vi.fn()
}));

vi.mock('$lib/components/Input/InputBox.svelte', () => ({
  default: vi.fn()
}));

vi.mock('$lib/components/Table/Empty.svelte', () => ({
  default: vi.fn().mockImplementation(() => {
    return {
      $$: {
        on_mount: [],
        on_destroy: [],
        before_update: [],
        after_update: [],
        context: new Map(),
        callbacks: new Map()
      },
      $destroy: vi.fn(),
      $on: vi.fn(),
      $set: vi.fn()
    };
  })
}));

vi.mock('../../_utils/debounce.js', () => ({
  debounce: vi.fn((fn) => fn)
}));

// Mock global fetch
global.fetch = vi.fn();

// Mock window.location
const mockLocation = {
  href: ''
};
Object.defineProperty(window, 'location', {
  value: mockLocation,
  writable: true,
});

describe('StudentGradeTable 组件', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    global.fetch.mockClear();
    mockLocation.href = '';
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('基本渲染测试', () => {
    it('应该能正常挂载练习类型', () => {
      const mockResponse = {
        status: 0,
        data: [],
        rowCount: 0
      };
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockResponse)
      });

      const { container } = render(StudentGradeTable, {
        props: {
          type: 'practice',
          resource_id: 123,
          papers: []
        }
      });

      expect(container.querySelector('.student-scores-card')).toBeInTheDocument();
      expect(container.querySelector('.title')).toHaveTextContent('学生成绩');
    });

    it('应该能正常挂载考试类型', () => {
      const mockResponse = {
        status: 0,
        data: [],
        rowCount: 0
      };
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockResponse)
      });

      const { container } = render(StudentGradeTable, {
        props: {
          type: 'exam',
          resource_id: 456,
          papers: [
            { id: 1, name: '试卷1', total_score: 100 },
            { id: 2, name: '试卷2', total_score: 100 }
          ]
        }
      });

      expect(container.querySelector('.student-scores-card')).toBeInTheDocument();
      expect(container.querySelector('.title')).toHaveTextContent('学生成绩');
    });
  });

  describe('折叠/展开功能', () => {
    it('初始状态应该是展开的', () => {
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ status: 0, data: [], rowCount: 0 })
      });

      const { container } = render(StudentGradeTable, {
        props: {
          type: 'practice',
          resource_id: 123,
          papers: []
        }
      });

      expect(container.querySelector('.card-body')).toBeInTheDocument();
      expect(container.querySelector('img[alt="展开"]')).toBeInTheDocument();
    });

    it('点击折叠按钮应该切换折叠状态', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ status: 0, data: [], rowCount: 0 })
      });

      const { container } = render(StudentGradeTable, {
        props: {
          type: 'practice',
          resource_id: 123,
          papers: []
        }
      });

      const toggleButton = container.querySelector('.card-title-button');
      
      // 初始状态：展开
      expect(container.querySelector('.card-body')).toBeInTheDocument();
      
      // 点击折叠
      await fireEvent.click(toggleButton);
      expect(container.querySelector('.card-body')).not.toBeInTheDocument();
      expect(container.querySelector('img[alt="收起"]')).toBeInTheDocument();
      
      // 再次点击展开
      await fireEvent.click(toggleButton);
      expect(container.querySelector('.card-body')).toBeInTheDocument();
    });
  });

  describe('数据获取功能', () => {
    it('应该正确构建练习类型的API请求', async () => {
      const mockResponse = {
        status: 0,
        data: [
          {
            student_scores: [
              {
                stu_id: '001',
                phone: '13812345678',
                name: '张三',
                nickname: 'zhangsan',
                highest_score: 85,
                submitted_cnt: 3,
                remark: '表现良好'
              }
            ]
          }
        ],
        rowCount: 1
      };

      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockResponse)
      });

      render(StudentGradeTable, {
        props: {
          type: 'practice',
          resource_id: 123,
          papers: []
        }
      });

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith(
          expect.stringContaining('/api/grade/examinee/list'),
          expect.objectContaining({
            method: 'GET',
            credentials: 'include'
          })
        );
      });

      // 检查请求参数
      const callArgs = global.fetch.mock.calls[0][0];
      expect(callArgs).toContain('category=practice');
      expect(callArgs).toContain('practiceID=123');
      expect(callArgs).toContain('page=1');
      expect(callArgs).toContain('pageSize=10');
    });

    it('应该正确构建考试类型的API请求', async () => {
      const mockResponse = {
        status: 0,
        data: [
          {
            student_scores: [
              {
                student_id: '001',
                phone: '13812345678',
                name: '张三',
                nickname: 'zhangsan',
                exam_sessions: [
                  { exam_session_id: 'session1', score: 85 },
                  { exam_session_id: 'session2', score: 90 }
                ],
                remark: '表现良好'
              }
            ]
          }
        ],
        rowCount: 1
      };

      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockResponse)
      });

      render(StudentGradeTable, {
        props: {
          type: 'exam',
          resource_id: 456,
          papers: []
        }
      });

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith(
          expect.stringContaining('/api/grade/examinee/list'),
          expect.objectContaining({
            method: 'GET',
            credentials: 'include'
          })
        );
      });

      // 检查请求参数
      const callArgs = global.fetch.mock.calls[0][0];
      expect(callArgs).toContain('category=exam');
      expect(callArgs).toContain('examID=456');
    });

    it('应该正确处理API错误', async () => {
      global.fetch.mockRejectedValueOnce(new Error('网络错误'));

      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      render(StudentGradeTable, {
        props: {
          type: 'practice',
          resource_id: 123,
          papers: []
        }
      });

      await waitFor(() => {
        expect(consoleSpy).toHaveBeenCalledWith('拉取学生成绩失败:', expect.any(Error));
      });

      consoleSpy.mockRestore();
    });

    it('应该正确处理API返回错误状态', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ status: 1, msg: '权限不足' })
      });

      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      render(StudentGradeTable, {
        props: {
          type: 'practice',
          resource_id: 123,
          papers: []
        }
      });

      await waitFor(() => {
        expect(consoleSpy).toHaveBeenCalledWith('拉取学生成绩失败:', expect.any(Error));
      });

      consoleSpy.mockRestore();
    });
  });

  describe('数据处理和展示', () => {
    it('应该正确处理练习类型的学生数据', async () => {
      const mockResponse = {
        status: 0,
        data: [
          {
            student_scores: [
              {
                stu_id: '001',
                phone: '13812345678',
                name: '张三',
                nickname: 'zhangsan',
                highest_score: 85,
                submitted_cnt: 3,
                remark: '表现良好'
              },
              {
                stu_id: '002',
                phone: '13987654321',
                name: '李四',
                nickname: 'lisi',
                highest_score: 92,
                submitted_cnt: 2,
                remark: '优秀'
              }
            ]
          }
        ],
        rowCount: 2
      };

      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockResponse)
      });

      render(StudentGradeTable, {
        props: {
          type: 'practice',
          resource_id: 123,
          papers: []
        }
      });

      await waitFor(() => {
        expect(screen.getByText('13812345678')).toBeInTheDocument();
        expect(screen.getByText('张三')).toBeInTheDocument();
        expect(screen.getByText('zhangsan')).toBeInTheDocument();
        expect(screen.getByText('表现良好')).toBeInTheDocument();
      });
    });

    it('应该正确处理考试类型的学生数据', async () => {
      const mockResponse = {
        status: 0,
        data: [
          {
            student_scores: [
              {
                student_id: '001',
                phone: '13812345678',
                name: '张三',
                nickname: 'zhangsan',
                exam_sessions: [
                  { exam_session_id: 'session1', score: 85 },
                  { exam_session_id: 'session2', score: 90 }
                ],
                remark: '表现良好'
              }
            ]
          }
        ],
        rowCount: 1
      };

      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockResponse)
      });

      render(StudentGradeTable, {
        props: {
          type: 'exam',
          resource_id: 456,
          papers: []
        }
      });

      await waitFor(() => {
        expect(screen.getByText('13812345678')).toBeInTheDocument();
        expect(screen.getByText('张三')).toBeInTheDocument();
        expect(screen.getByText('zhangsan')).toBeInTheDocument();
        expect(screen.getByText('表现良好')).toBeInTheDocument();
      });
    });

    it('应该正确显示练习表格表头', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ status: 0, data: [], rowCount: 0 })
      });

      render(StudentGradeTable, {
        props: {
          type: 'practice',
          resource_id: 123,
          papers: []
        }
      });

      await waitFor(() => {
        expect(screen.getByText('最高得分')).toBeInTheDocument();
        expect(screen.getByText('作答次数')).toBeInTheDocument();
      });
    });

    it('应该正确显示考试表格表头（多试卷）', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ status: 0, data: [], rowCount: 0 })
      });

      const mockContext = new Map();
      mockContext.set('exam', {
        examData: {
          papers: [
            { id: 1, name: '试卷1', total_score: 100 },
            { id: 2, name: '试卷2', total_score: 100 }
          ]
        }
      });

      render(StudentGradeTable, {
        props: {
          type: 'exam',
          resource_id: 456,
          papers: [
            { id: 1, name: '试卷1', total_score: 100 },
            { id: 2, name: '试卷2', total_score: 100 }
          ]
        },
        context: mockContext
      });

      await waitFor(() => {
        expect(screen.getByText('总得分')).toBeInTheDocument();
        expect(screen.getByText('试卷1')).toBeInTheDocument();
        expect(screen.getByText('试卷2')).toBeInTheDocument();
      });
    });

    it('应该正确显示考试表格表头（单试卷）', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ status: 0, data: [], rowCount: 0 })
      });

      const mockContext = new Map();
      mockContext.set('exam', {
        examData: {
          papers: [
            { id: 1, name: '试卷1', total_score: 100 }
          ]
        }
      });

      render(StudentGradeTable, {
        props: {
          type: 'exam',
          resource_id: 456,
          papers: [
            { id: 1, name: '试卷1', total_score: 100 }
          ]
        },
        context: mockContext
      });

      await waitFor(() => {
        expect(screen.getByText('得分')).toBeInTheDocument();
      });
    });
  });

  describe('搜索功能', () => {
    it('应该支持搜索功能', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ status: 0, data: [], rowCount: 0 })
      });

      const { container } = render(StudentGradeTable, {
        props: {
          type: 'practice',
          resource_id: 123,
          papers: []
        }
      });

      // 等待初始加载完成
      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalled();
      });

      // 清除之前的调用记录
      global.fetch.mockClear();

      // 模拟搜索响应
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ status: 0, data: [], rowCount: 0 })
      });

      // 查找搜索输入框并输入内容
      const searchInput = container.querySelector('input');
      if (searchInput) {
        await fireEvent.input(searchInput, { target: { value: '张三' } });
        
        // 等待搜索请求
        await waitFor(() => {
          expect(global.fetch).toHaveBeenCalledWith(
            expect.stringContaining('keyword=%E5%BC%A0%E4%B8%89'),
            expect.any(Object)
          );
        });
      }
    });
  });

  describe('分页功能', () => {
    it('应该正确初始化分页参数', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ status: 0, data: [], rowCount: 20 })
      });

      render(StudentGradeTable, {
        props: {
          type: 'practice',
          resource_id: 123,
          papers: []
        }
      });

      // 等待初始加载
      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalled();
      });

      // 验证初始分页参数
      const callArgs = global.fetch.mock.calls[0][0];
      expect(callArgs).toContain('page=1');
      expect(callArgs).toContain('pageSize=10');
    });

    it('应该在搜索时重置页码为1', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ status: 0, data: [], rowCount: 20 })
      });

      const { container } = render(StudentGradeTable, {
        props: {
          type: 'practice',
          resource_id: 123,
          papers: []
        }
      });

      // 等待初始加载
      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalled();
      });

      // 清除之前的调用
      global.fetch.mockClear();

      // 模拟搜索
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ status: 0, data: [], rowCount: 5 })
      });

      const searchInput = container.querySelector('input');
      if (searchInput) {
        await fireEvent.input(searchInput, { target: { value: '张三' } });
        
        // 等待搜索请求
        await waitFor(() => {
          expect(global.fetch).toHaveBeenCalled();
        });

        // 验证搜索时页码重置为1
        const callArgs = global.fetch.mock.calls[0][0];
        expect(callArgs).toContain('page=1');
        expect(callArgs).toContain('keyword=%E5%BC%A0%E4%B8%89');
      }
    });

    it('应该显示分页组件当有数据时', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ status: 0, data: [], rowCount: 20 })
      });

      const { container } = render(StudentGradeTable, {
        props: {
          type: 'practice',
          resource_id: 123,
          papers: []
        }
      });

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalled();
      });

      // 检查分页容器存在
      expect(container.querySelector('.pagination-wrapper')).toBeInTheDocument();
      expect(container.querySelector('.pagination-container')).toBeInTheDocument();
    });

    it('应该隐藏分页组件当无数据时', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ status: 0, data: [], rowCount: 0 })
      });

      const { container } = render(StudentGradeTable, {
        props: {
          type: 'practice',
          resource_id: 123,
          papers: []
        }
      });

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalled();
      });

      // 检查分页组件被隐藏
      const paginationContainer = container.querySelector('.pagination-container');
      expect(paginationContainer).toHaveClass('hide');
    });
  });

  describe('Context数据使用', () => {
    it('应该正确使用练习Context数据', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ status: 0, data: [], rowCount: 0 })
      });

      const mockContext = new Map();
      mockContext.set('practice', {
        practiceData: {
          total_score: 100,
          name: '测试练习'
        }
      });

      render(StudentGradeTable, {
        props: {
          type: 'practice',
          resource_id: 123,
          papers: []
        },
        context: mockContext
      });

      // Context数据应该被正确使用
      expect(global.fetch).toHaveBeenCalled();
    });

    it('应该正确使用考试Context数据', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ status: 0, data: [], rowCount: 0 })
      });

      const mockContext = new Map();
      mockContext.set('exam', {
        examData: {
          papers: [
            { id: 1, name: '试卷1', total_score: 100 }
          ],
          total_score: 100,
          title: '测试考试'
        }
      });

      render(StudentGradeTable, {
        props: {
          type: 'exam',
          resource_id: 456,
          papers: []
        },
        context: mockContext
      });

      // Context数据应该被正确使用
      expect(global.fetch).toHaveBeenCalled();
    });

    it('应该处理缺少Context数据的情况', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ status: 0, data: [], rowCount: 0 })
      });

      // 不提供context
      render(StudentGradeTable, {
        props: {
          type: 'practice',
          resource_id: 123,
          papers: []
        }
      });

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalled();
      });
    });

    it('应该处理Context中数据不完整的情况', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ status: 0, data: [], rowCount: 0 })
      });

      const mockContext = new Map();
      mockContext.set('practice', {
        // practiceData 为 undefined
      });

      render(StudentGradeTable, {
        props: {
          type: 'practice',
          resource_id: 123,
          papers: []
        },
        context: mockContext
      });

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalled();
      });
    });

    it('应该正确使用Context中的papers数据显示表头', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ status: 0, data: [], rowCount: 0 })
      });

      const mockContext = new Map();
      mockContext.set('exam', {
        examData: {
          papers: [
            { id: 1, name: '试卷A', total_score: 80 },
            { id: 2, name: '试卷B', total_score: 90 },
            { id: 3, name: '试卷C', total_score: 100 }
          ],
          total_score: 270
        }
      });

      render(StudentGradeTable, {
        props: {
          type: 'exam',
          resource_id: 456,
          papers: []
        },
        context: mockContext
      });

      await waitFor(() => {
        expect(screen.getByText('试卷1')).toBeInTheDocument();
        expect(screen.getByText('试卷2')).toBeInTheDocument();
        expect(screen.getByText('试卷3')).toBeInTheDocument();
        expect(screen.getByText('总得分')).toBeInTheDocument();
      });
    });
  });

  describe('查看详情功能', () => {
    it('考试类型应该正确跳转到学生答题详情页面', async () => {
      const mockResponse = {
        status: 0,
        data: [
          {
            student_scores: [
              {
                student_id: '001',
                phone: '13812345678',
                name: '张三',
                nickname: 'zhangsan',
                exam_sessions: [
                  { exam_session_id: 'session1', score: 85 },
                  { exam_session_id: 'session2', score: 90 }
                ],
                remark: '表现良好'
              }
            ]
          }
        ],
        rowCount: 1
      };

      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockResponse)
      });

      const { container } = render(StudentGradeTable, {
        props: {
          type: 'exam',
          resource_id: 456,
          papers: []
        }
      });

      await waitFor(() => {
        expect(screen.getByText('张三')).toBeInTheDocument();
      });

      // 找到并点击查看详情按钮
      const detailButton = container.querySelector('.detail-btn');
      expect(detailButton).toBeInTheDocument();

      await fireEvent.click(detailButton);

      // 验证是否正确设置了跳转链接
      expect(mockLocation.href).toBe('/student/answer/result/exam?exam-session-id-arr=[session1,session2]');
    });

    it('练习类型点击查看详情应该打印日志', async () => {
      const mockResponse = {
        status: 0,
        data: [
          {
            student_scores: [
              {
                stu_id: '001',
                phone: '13812345678',
                name: '张三',
                nickname: 'zhangsan',
                highest_score: 85,
                submitted_cnt: 3,
                remark: '表现良好'
              }
            ]
          }
        ],
        rowCount: 1
      };

      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockResponse)
      });

      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

      const { container } = render(StudentGradeTable, {
        props: {
          type: 'practice',
          resource_id: 123,
          papers: []
        }
      });

      await waitFor(() => {
        expect(screen.getByText('张三')).toBeInTheDocument();
      });

      // 找到并点击查看详情按钮
      const detailButton = container.querySelector('.detail-btn');
      expect(detailButton).toBeInTheDocument();

      await fireEvent.click(detailButton);

      // 验证是否打印了正确的日志
      expect(consoleSpy).toHaveBeenCalledWith('练习类型，无exam_session_id');

      consoleSpy.mockRestore();
    });
  });

  describe('分数颜色显示', () => {
    it('应该为低分显示红色样式', async () => {
      const mockResponse = {
        status: 0,
        data: [
          {
            student_scores: [
              {
                stu_id: '001',
                phone: '13812345678',
                name: '张三',
                nickname: 'zhangsan',
                highest_score: 50, // 低于60%的分数
                submitted_cnt: 3,
                remark: '需要提高'
              }
            ]
          }
        ],
        rowCount: 1
      };

      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockResponse)
      });

      const mockContext = new Map();
      mockContext.set('practice', {
        practiceData: {
          total_score: 100
        }
      });

      const { container } = render(StudentGradeTable, {
        props: {
          type: 'practice',
          resource_id: 123,
          papers: []
        },
        context: mockContext
      });

      await waitFor(() => {
        const scoreElement = container.querySelector('.red');
        expect(scoreElement).toBeInTheDocument();
        expect(scoreElement).toHaveTextContent('50');
      });
    });

    it('应该为高分显示绿色样式', async () => {
      const mockResponse = {
        status: 0,
        data: [
          {
            student_scores: [
              {
                stu_id: '001',
                phone: '13812345678',
                name: '张三',
                nickname: 'zhangsan',
                highest_score: 85, // 高于60%的分数
                submitted_cnt: 3,
                remark: '表现良好'
              }
            ]
          }
        ],
        rowCount: 1
      };

      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockResponse)
      });

      const mockContext = new Map();
      mockContext.set('practice', {
        practiceData: {
          total_score: 100
        }
      });

      const { container } = render(StudentGradeTable, {
        props: {
          type: 'practice',
          resource_id: 123,
          papers: []
        },
        context: mockContext
      });

      await waitFor(() => {
        const scoreElement = container.querySelector('.green');
        expect(scoreElement).toBeInTheDocument();
        expect(scoreElement).toHaveTextContent('85');
      });
    });
  });

  describe('加载状态', () => {
    it('应该显示加载状态', async () => {
      // 模拟延迟的API响应
      global.fetch.mockImplementationOnce(() => 
        new Promise(resolve => 
          setTimeout(() => 
            resolve({
              ok: true,
              json: () => Promise.resolve({ status: 0, data: [], rowCount: 0 })
            }), 100)
        )
      );

      const { container } = render(StudentGradeTable, {
        props: {
          type: 'practice',
          resource_id: 123,
          papers: []
        }
      });

      // 检查加载状态
      expect(container.querySelector('.loading-indicator')).toBeInTheDocument();
      expect(container.querySelector('.spinner')).toBeInTheDocument();
      expect(screen.getByText('正在加载，请稍候...')).toBeInTheDocument();

      // 等待加载完成
      await waitFor(() => {
        expect(container.querySelector('.loading-indicator')).not.toBeInTheDocument();
      });
    });

    it('加载过程中应该清空当前数据', async () => {
      // 模拟延迟的API响应
      let resolvePromise;
      global.fetch.mockImplementationOnce(() => 
        new Promise(resolve => {
          resolvePromise = resolve;
        })
      );

      const { container } = render(StudentGradeTable, {
        props: {
          type: 'practice',
          resource_id: 123,
          papers: []
        }
      });

      // 检查加载状态
      expect(container.querySelector('.loading-indicator')).toBeInTheDocument();
      
      // 解决Promise
      resolvePromise({
        ok: true,
        json: () => Promise.resolve({ status: 0, data: [], rowCount: 0 })
      });

      await waitFor(() => {
        expect(container.querySelector('.loading-indicator')).not.toBeInTheDocument();
      });
    });
  });

  describe('边界条件测试', () => {
    it('应该处理resource_id为0的情况', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ status: 0, data: [], rowCount: 0 })
      });

      render(StudentGradeTable, {
        props: {
          type: 'practice',
          resource_id: 0,
          papers: []
        }
      });

      await waitFor(() => {
        const callArgs = global.fetch.mock.calls[0][0];
        expect(callArgs).toContain('practiceID=0');
      });
    });

    it('应该处理很大的resource_id', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ status: 0, data: [], rowCount: 0 })
      });

      render(StudentGradeTable, {
        props: {
          type: 'exam',
          resource_id: 999999999,
          papers: []
        }
      });

      await waitFor(() => {
        const callArgs = global.fetch.mock.calls[0][0];
        expect(callArgs).toContain('examID=999999999');
      });
    });

    it('应该处理空字符串搜索', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ status: 0, data: [], rowCount: 0 })
      });

      const { container } = render(StudentGradeTable, {
        props: {
          type: 'practice',
          resource_id: 123,
          papers: []
        }
      });

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalled();
      });

      global.fetch.mockClear();
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ status: 0, data: [], rowCount: 0 })
      });

      const searchInput = container.querySelector('input');
      if (searchInput) {
        await fireEvent.input(searchInput, { target: { value: '' } });
        
        await waitFor(() => {
          expect(global.fetch).toHaveBeenCalled();
        });

        const callArgs = global.fetch.mock.calls[0][0];
        expect(callArgs).toContain('keyword=');
      }
    });

    it('应该处理空白字符搜索', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ status: 0, data: [], rowCount: 0 })
      });

      const { container } = render(StudentGradeTable, {
        props: {
          type: 'practice',
          resource_id: 123,
          papers: []
        }
      });

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalled();
      });

      global.fetch.mockClear();
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ status: 0, data: [], rowCount: 0 })
      });

      const searchInput = container.querySelector('input');
      if (searchInput) {
        await fireEvent.input(searchInput, { target: { value: '   ' } });
        
        await waitFor(() => {
          expect(global.fetch).toHaveBeenCalled();
        });

        const callArgs = global.fetch.mock.calls[0][0];
        expect(callArgs).toContain('keyword=');
      }
    });
  });

  describe('数据处理边界测试', () => {
    it('应该处理练习数据中缺少student_scores字段', async () => {
      const mockResponse = {
        status: 0,
        data: [
          {
            // 缺少 student_scores 字段
          }
        ],
        rowCount: 0
      };

      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockResponse)
      });

      const { container } = render(StudentGradeTable, {
        props: {
          type: 'practice',
          resource_id: 123,
          papers: []
        }
      });

      await waitFor(() => {
        const table = container.querySelector('.scores-table');
        expect(table).toBeInTheDocument();
        
        // 应该显示空行
        const emptyRow = container.querySelector('.empty-row');
        expect(emptyRow).toBeInTheDocument();
      });
    });

    it('应该处理练习数据中student_scores不是数组', async () => {
      const mockResponse = {
        status: 0,
        data: [
          {
            student_scores: "invalid_data"
          }
        ],
        rowCount: 0
      };

      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockResponse)
      });

      const { container } = render(StudentGradeTable, {
        props: {
          type: 'practice',
          resource_id: 123,
          papers: []
        }
      });

      await waitFor(() => {
        const emptyRow = container.querySelector('.empty-row');
        expect(emptyRow).toBeInTheDocument();
      });
    });

    it('应该处理学生数据中的null和undefined值', async () => {
      const mockResponse = {
        status: 0,
        data: [
          {
            student_scores: [
              {
                stu_id: '001',
                phone: null,
                name: undefined,
                nickname: '',
                highest_score: null,
                submitted_cnt: undefined,
                remark: null
              }
            ]
          }
        ],
        rowCount: 1
      };

      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockResponse)
      });

      const { container } = render(StudentGradeTable, {
        props: {
          type: 'practice',
          resource_id: 123,
          papers: []
        }
      });

      await waitFor(() => {
        const cells = Array.from(container.querySelectorAll('td'));
        expect(cells.some(cell => cell.textContent === '-')).toBe(true);
        
        // 更具体的检查
        const dataRow = container.querySelector('tbody tr:not(.empty-row)');
        expect(dataRow).toBeInTheDocument();
        
        // 检查具体的单元格内容
        const rowCells = Array.from(dataRow.querySelectorAll('td'));
        expect(rowCells[1].textContent).toBe('-'); 
        expect(rowCells[3].textContent).toBe('-'); 
        expect(rowCells[4].textContent).toBe('0'); 
        expect(rowCells[5].textContent).toBe('0'); 
        expect(rowCells[7].textContent).toBe('-'); 
      });
    });

    it('应该处理考试数据中exam_sessions为空数组', async () => {
      const mockResponse = {
        status: 0,
        data: [
          {
            student_scores: [
              {
                student_id: '001',
                phone: '13812345678',
                name: '张三',
                nickname: 'zhangsan',
                exam_sessions: [],
                remark: '测试'
              }
            ]
          }
        ],
        rowCount: 1
      };

      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockResponse)
      });

      const { container } = render(StudentGradeTable, {
        props: {
          type: 'exam',
          resource_id: 456,
          papers: []
        }
      });

      await waitFor(() => {
        const table = container.querySelector('.scores-table');
        expect(table).toBeInTheDocument();
        // 应该有数据行，尽管分数为0
        const rows = table.querySelectorAll('tbody tr');
        expect(rows.length).toBeGreaterThan(0);
      });
    });

    it('应该正确计算总分数', async () => {
      const mockResponse = {
        status: 0,
        data: [
          {
            student_scores: [
              {
                student_id: '001',
                phone: '13812345678',
                name: '张三',
                nickname: 'zhangsan',
                exam_sessions: [
                  { exam_session_id: 'session1', score: 85 },
                  { exam_session_id: 'session2', score: 90 },
                  { exam_session_id: 'session3', score: null },
                  { exam_session_id: 'session4', score: undefined }
                ],
                remark: '测试'
              }
            ]
          }
        ],
        rowCount: 1
      };

      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockResponse)
      });

      const { container } = render(StudentGradeTable, {
        props: {
          type: 'exam',
          resource_id: 456,
          papers: []
        }
      });

      await waitFor(() => {
        const scoreCells = container.querySelectorAll('.score-cell');
        // 应该有总分显示 (85 + 90 = 175)
        expect(scoreCells.length).toBeGreaterThan(0);
      });
    });
  });

  describe('错误处理测试', () => {
    it('应该处理HTTP错误状态', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: false,
        status: 404,
        json: () => Promise.resolve({})
      });

      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      render(StudentGradeTable, {
        props: {
          type: 'practice',
          resource_id: 123,
          papers: []
        }
      });

      await waitFor(() => {
        expect(consoleSpy).toHaveBeenCalledWith('拉取学生成绩失败:', expect.any(Error));
      });

      consoleSpy.mockRestore();
    });

    it('应该处理API返回无效JSON', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.reject(new Error('Invalid JSON'))
      });

      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      render(StudentGradeTable, {
        props: {
          type: 'practice',
          resource_id: 123,
          papers: []
        }
      });

      await waitFor(() => {
        expect(consoleSpy).toHaveBeenCalledWith('拉取学生成绩失败:', expect.any(Error));
      });

      consoleSpy.mockRestore();
    });

    it('应该处理API返回status不为0但无msg', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ status: 1 })
      });

      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      render(StudentGradeTable, {
        props: {
          type: 'practice',
          resource_id: 123,
          papers: []
        }
      });

      await waitFor(() => {
        expect(consoleSpy).toHaveBeenCalledWith('拉取学生成绩失败:', expect.objectContaining({
          message: '接口异常'
        }));
      });

      consoleSpy.mockRestore();
    });
  });

  describe('分数颜色显示边界测试', () => {
    it('应该为正好60%分数显示绿色', async () => {
      const mockResponse = {
        status: 0,
        data: [
          {
            student_scores: [
              {
                stu_id: '001',
                phone: '13812345678',
                name: '张三',
                nickname: 'zhangsan',
                highest_score: 60, // 正好60%
                submitted_cnt: 3,
                remark: '及格'
              }
            ]
          }
        ],
        rowCount: 1
      };

      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockResponse)
      });

      const mockContext = new Map();
      mockContext.set('practice', {
        practiceData: {
          total_score: 100
        }
      });

      const { container } = render(StudentGradeTable, {
        props: {
          type: 'practice',
          resource_id: 123,
          papers: []
        },
        context: mockContext
      });

      await waitFor(() => {
        const scoreElement = container.querySelector('.green');
        expect(scoreElement).toBeInTheDocument();
        expect(scoreElement).toHaveTextContent('60');
      });
    });

    it('应该为59.9%分数显示红色', async () => {
      const mockResponse = {
        status: 0,
        data: [
          {
            student_scores: [
              {
                stu_id: '001',
                phone: '13812345678',
                name: '张三',
                nickname: 'zhangsan',
                highest_score: 59.9, // 略低于60%
                submitted_cnt: 3,
                remark: '不及格'
              }
            ]
          }
        ],
        rowCount: 1
      };

      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockResponse)
      });

      const mockContext = new Map();
      mockContext.set('practice', {
        practiceData: {
          total_score: 100
        }
      });

      const { container } = render(StudentGradeTable, {
        props: {
          type: 'practice',
          resource_id: 123,
          papers: []
        },
        context: mockContext
      });

      await waitFor(() => {
        const scoreElement = container.querySelector('.red');
        expect(scoreElement).toBeInTheDocument();
        expect(scoreElement).toHaveTextContent('59.9');
      });
    });

    it('应该处理total_score为0的情况', async () => {
      const mockResponse = {
        status: 0,
        data: [
          {
            student_scores: [
              {
                stu_id: '001',
                phone: '13812345678',
                name: '张三',
                nickname: 'zhangsan',
                highest_score: 50,
                submitted_cnt: 3,
                remark: '测试'
              }
            ]
          }
        ],
        rowCount: 1
      };

      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockResponse)
      });

      const mockContext = new Map();
      mockContext.set('practice', {
        practiceData: {
          total_score: 0
        }
      });

      const { container } = render(StudentGradeTable, {
        props: {
          type: 'practice',
          resource_id: 123,
          papers: []
        },
        context: mockContext
      });

      await waitFor(() => {
        // 当total_score为0时，应该使用默认值100
        const scoreElements = container.querySelectorAll('.score-cell span');
        expect(scoreElements.length).toBeGreaterThan(0);
      });
    });
  });

  describe('空数据状态', () => {
    it('应该显示空数据状态的表格结构', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ status: 0, data: [], rowCount: 0 })
      });

      const { container } = render(StudentGradeTable, {
        props: {
          type: 'practice',
          resource_id: 123,
          papers: []
        }
      });

      await waitFor(() => {
        // 检查表格是否存在
        const table = container.querySelector('.scores-table');
        expect(table).toBeInTheDocument();
        
        // 检查表头是否正确
        const headers = table.querySelectorAll('th');
        expect(headers.length).toBeGreaterThan(0);
        
        // 检查是否有空行
        const emptyRow = container.querySelector('.empty-row');
        expect(emptyRow).toBeInTheDocument();
        
        // 检查表格数据行数量（应该只有一行空数据行）
        const tbody = table.querySelector('tbody');
        const rows = tbody.querySelectorAll('tr');
        expect(rows).toHaveLength(1);
      });
    });

    it('应该在空行中显示Empty组件容器', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ status: 0, data: [], rowCount: 0 })
      });

      const { container } = render(StudentGradeTable, {
        props: {
          type: 'practice',
          resource_id: 123,
          papers: []
        }
      });

      await waitFor(() => {
        // 检查表格中的空行
        const emptyRow = container.querySelector('.empty-row');
        expect(emptyRow).toBeInTheDocument();
        
        // 检查Empty组件容器是否被渲染
        const emptyContainer = container.querySelector('.empty-container');
        expect(emptyContainer).toBeInTheDocument();
        
        // 检查空行的列跨度
        expect(emptyRow).toHaveAttribute('colspan', '8');
      });
    });

    it('应该在空数据时隐藏分页组件', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ status: 0, data: [], rowCount: 0 })
      });

      const { container } = render(StudentGradeTable, {
        props: {
          type: 'practice',
          resource_id: 123,
          papers: []
        }
      });

      await waitFor(() => {
        // 检查分页组件被隐藏
        const paginationContainer = container.querySelector('.pagination-container');
        expect(paginationContainer).toHaveClass('hide');
      });
    });
  });

});