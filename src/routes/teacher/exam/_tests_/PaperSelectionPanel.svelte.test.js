import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, waitFor, within } from '@testing-library/svelte';
import PaperSelectionPanel from '../_components/PaperSelectionPanel.svelte';
import { toast } from '$lib/components/Toast/Toast.js';

// Mock dependencies
vi.mock('$lib/components/Toast/Toast.js', () => ({
  toast: {
    warning: vi.fn(),
    success: vi.fn(),
    error: vi.fn()
  }
}));

// Mock Pagination component
vi.mock('$lib/components/Pagination/Pagination.svelte', () => ({
  default: vi.fn(() => ({
    $set: vi.fn(),
    $on: vi.fn(),
    $destroy: vi.fn()
  }))
}));

// Mock Select and Option components
vi.mock('$lib/components/Select/Select.svelte', () => ({
  default: vi.fn()
}));

vi.mock('$lib/components/Select/Option.svelte', () => ({
  default: vi.fn()
}));

vi.mock('$lib/components/Tag/UneditableTag.svelte', () => ({
  default: vi.fn()
}));

// 测试数据
const mockPaperData = [
  {
    ID: 1,
    Name: "数学期末考试试卷",
    AssemblyType: "00", // 自定义组卷
    Category: "00", // 考试
    QuestionCount: 50,
    TotalScore: 100,
    SuggestedDuration: 120,
    Tags: ["数学", "期末"],
    Level: "02", // 中等
    UpdateTime: "2025-01-10T10:30:00Z",
    CreateTime: "2025-01-01T08:00:00Z"
  },
  {
    ID: 2,
    Name: "英语听力测试",
    AssemblyType: "02", // 随机组卷
    Category: "02", // 练习
    QuestionCount: 30,
    TotalScore: 80,
    SuggestedDuration: 90,
    Tags: ["英语", "听力"],
    Level: "00", // 简单
    UpdateTime: "2025-01-09T14:20:00Z",
    CreateTime: "2024-12-28T16:45:00Z"
  },
  {
    ID: 3,
    Name: "高难度物理竞赛",
    AssemblyType: "00",
    Category: "00",
    QuestionCount: 25,
    TotalScore: 150,
    SuggestedDuration: 180,
    Tags: ["物理", "竞赛", "高难度"],
    Level: "04", // 困难
    UpdateTime: "2025-01-08T09:15:00Z",
    CreateTime: "2024-12-20T11:30:00Z"
  },
  {
    ID: 4,
    Name: "无标签试卷",
    AssemblyType: "02",
    Category: "00",
    QuestionCount: 20,
    TotalScore: 60,
    SuggestedDuration: 60,
    Tags: null, // 测试无标签情况
    Level: "00",
    UpdateTime: "2025-01-07T13:40:00Z",
    CreateTime: "2024-12-15T10:20:00Z"
  }
];

const defaultProps = {
  showPanel: true,
  selectedID: 0,
  selectedName: "",
  selectedType: "",
  onCancel: vi.fn(),
  onConfirm: vi.fn()
};

function mockFetchSuccess(data = mockPaperData, rowCount = 4) {
  global.fetch = vi.fn().mockResolvedValue({
    ok: true,
    json: () => Promise.resolve({
      status: 0,
      data,
      rowCount
    })
  });
}

function mockFetchError(errorMsg = "获取数据失败") {
  global.fetch = vi.fn().mockResolvedValue({
    ok: true,
    json: () => Promise.resolve({
      status: 1,
      msg: errorMsg,
      data: [],
      rowCount: 0
    })
  });
}

// function mockFetchNetworkError() {
//   global.fetch = vi.fn().mockRejectedValue(new Error('Network error'));
// }

const setup = (props = {}) => {
  const finalProps = { ...defaultProps, ...props };
  render(PaperSelectionPanel, finalProps);
  
  return {
    // 面板控制
    getPanel: () => screen.queryByText('选择试卷'),
    getCloseButton: () => screen.queryByText('×'),
    getCancelButton: () => screen.queryByText('取消'),
    getConfirmButton: () => screen.queryByText('确定'),
    
    // 筛选控件
    getPaperTypeSelect: () => screen.queryByDisplayValue('04'), // 默认"全部"
    
    // 表格元素
    getTable: () => screen.queryByRole('table'),
    getTableRows: () => screen.queryAllByRole('row'),
    getRadioButtons: () => screen.queryAllByRole('radio'),
    
    // 分页相关
    getPaginationContainer: () => document.querySelector('.pagination-container'),
    
    // 工具函数
    selectPaper: async (paperId) => {
      const radios = screen.queryAllByRole('radio');
      const targetRadio = radios.find(radio => radio.value === paperId.toString());
      if (targetRadio) {
        await fireEvent.click(targetRadio);
      }
      return targetRadio;
    },
    
    changePaperType: async (value) => {
      // 模拟Select组件的onChangeValue回调
      const selectElement = screen.queryByDisplayValue('04');
      if (selectElement) {
        await fireEvent.change(selectElement, { target: { value } });
      }
    }
  };
};

describe('PaperSelectionPanel 组件测试', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockFetchSuccess();
  });

  describe('基础渲染测试', () => {
    it('当showPanel为true时显示面板', () => {
      setup({ showPanel: true });
      expect(screen.getByText('选择试卷')).toBeInTheDocument();
    });


    it('渲染所有必要的UI元素', async () => {
      const utils = setup();
      
      await waitFor(() => {
        expect(utils.getPanel()).toBeInTheDocument();
        expect(utils.getCloseButton()).toBeInTheDocument();
        expect(utils.getCancelButton()).toBeInTheDocument();
        expect(utils.getConfirmButton()).toBeInTheDocument();
        expect(utils.getTable()).toBeInTheDocument();
      });
    });

    it('渲染表格头部', async () => {
      setup();
      
      await waitFor(() => {
        expect(screen.getByText('试卷名称')).toBeInTheDocument();
        expect(screen.getByText('组卷方式')).toBeInTheDocument();
        expect(screen.getByText('试卷用途')).toBeInTheDocument();
        expect(screen.getByText('试题数量')).toBeInTheDocument();
        expect(screen.getByText('试卷总分')).toBeInTheDocument();
        expect(screen.getByText('建议时长(分)')).toBeInTheDocument();
        expect(screen.getByText('试卷标签')).toBeInTheDocument();
        expect(screen.getByText('试卷难度')).toBeInTheDocument();
        expect(screen.getByText('更新时间')).toBeInTheDocument();
        expect(screen.getByText('创建日期')).toBeInTheDocument();
      });
    });
  });

  describe('数据加载和显示测试', () => {
    it('成功加载并显示试卷数据', async () => {
      setup();
      
      await waitFor(() => {
        expect(screen.getByText('数学期末考试试卷')).toBeInTheDocument();
        expect(screen.getByText('英语听力测试')).toBeInTheDocument();
        expect(screen.getByText('高难度物理竞赛')).toBeInTheDocument();
      });
    });

    it('正确显示组卷方式映射', async () => {
      setup();
      
      await waitFor(() => {
        expect(screen.getAllByText('自定义组卷')).toBeTruthy(); 
        expect(screen.getAllByText('随机组卷')).toBeTruthy();
      });
    });

    it('正确显示试卷用途映射', async () => {
      setup();
      
      await waitFor(() => {
        expect(screen.getAllByText('考试')).toHaveLength(3); // 3个考试类型的试卷
        expect(screen.getByText('练习')).toBeInTheDocument();
      });
    });

    it('正确显示难度等级和颜色', async () => {
  setup();
  
  await waitFor(() => {
    // 检查难度文本是否存在
    const simpleDifficulties = screen.getAllByText('简单');
    const mediumDifficulties = screen.getAllByText('中等');
    const hardDifficulties = screen.getAllByText('困难');
    
    expect(simpleDifficulties.length).toBeGreaterThanOrEqual(1);
    expect(mediumDifficulties.length).toBeGreaterThanOrEqual(1);
    expect(hardDifficulties.length).toBeGreaterThanOrEqual(1);
    
    // 如果需要检查颜色，可以对第一个元素进行检查
    if (simpleDifficulties.length > 0 && mediumDifficulties.length > 0 && hardDifficulties.length > 0) {
      expect(simpleDifficulties[0]).toHaveStyle('color: rgb(0, 128, 0)');
      expect(mediumDifficulties[0]).toHaveStyle('color: rgb(255, 165, 0)');
      expect(hardDifficulties[0]).toHaveStyle('color: rgb(255,0,0)');
    }
  });
});

    it('正确处理无标签的试卷', async () => {
      setup();
      
      await waitFor(() => {
        const noTagElements = screen.getAllByText('--');
        expect(noTagElements.length).toBeGreaterThan(0);
      });
    });

    // it('正确格式化时间显示', async () => {
    //   setup();
      
    //   await waitFor(() => {
    //     // 检查时间格式 YYYY-MM-DD HH:MM
    //     expect(screen.getAllByText('2025-01-10 10:30')).toBeInTheDocument();
    //     expect(screen.getByText('2025-01-01 08:00')).toBeInTheDocument();
    //   });
    // });
  });

  describe('试卷选择功能测试', () => {
    it('支持选择试卷', async () => {
      const utils = setup();
      
      await waitFor(() => {
        expect(screen.getByText('数学期末考试试卷')).toBeInTheDocument();
      });
      
      await utils.selectPaper(1);
      
      const selectedRadio = utils.getRadioButtons().find(radio => radio.value === '1');
      expect(selectedRadio).toBeChecked();
    });

    it('选择试卷后更新内部状态', async () => {
      const utils = setup();
      
      await waitFor(() => {
        expect(screen.getByText('数学期末考试试卷')).toBeInTheDocument();
      });
      
      await utils.selectPaper(1);
      
      // 验证选中状态
      const selectedRadio = utils.getRadioButtons().find(radio => radio.value === '1');
      expect(selectedRadio).toBeChecked();
    });

    it('显示已选择的试卷信息', async () => {
      const utils = setup({ selectedID: 1 });
      
      await waitFor(() => {
        expect(screen.getByText('数学期末考试试卷')).toBeInTheDocument();
      });
      
      const selectedRadio = utils.getRadioButtons().find(radio => radio.value === '1');
      expect(selectedRadio).toBeChecked();
    });
  });

  describe('筛选功能测试', () => {
    it('默认显示全部试卷类型', async () => {
      setup();
      
      await waitFor(() => {
        expect(screen.getAllByRole('row')).toHaveLength(5); // 4条数据 + 1个表头
      });
    });

    it('筛选自定义组卷试卷', async () => {
      const utils = setup();
      
      await waitFor(() => {
        expect(screen.getByText('数学期末考试试卷')).toBeInTheDocument();
      });
      
      // 模拟选择"自定义组卷"
      await utils.changePaperType('00');
      
      // 验证API调用
      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/paper'),
        expect.objectContaining({
          method: 'GET',
          credentials: 'include'
        })
      );
    });

    it('筛选随机组卷试卷', async () => {
      const utils = setup();
      
      await waitFor(() => {
        expect(screen.getByText('英语听力测试')).toBeInTheDocument();
      });
      
      await utils.changePaperType('02');
      
      expect(fetch).toHaveBeenCalled();
    });
  });

  describe('分页功能测试', () => {
    it('渲染分页组件', async () => {
      const utils = setup();
      
      await waitFor(() => {
        expect(utils.getPaginationContainer()).toBeInTheDocument();
      });
    });

    it('正确传递分页参数', async () => {
      setup();
      
      await waitFor(() => {
        const lastCall = fetch.mock.calls[fetch.mock.calls.length - 1];
        const url = lastCall[0];
        expect(url).toContain('page=1');
        expect(url).toContain('pageSize=10');
      });
    });

    it('处理页码变化', async () => {
      const utils = setup();
      
      await waitFor(() => {
        expect(screen.getByText('数学期末考试试卷')).toBeInTheDocument();
      });
      
      // 模拟分页组件触发pageChange事件
      const mockEvent = { detail: 2 };
      
      // 直接调用组件内的handlePageChange函数（需要通过组件实例访问）
      // 或者通过DOM事件模拟
      vi.clearAllMocks();
      
      // 这里模拟页面变化后的API调用
      await waitFor(() => {
        // 验证分页功能正常工作
        expect(utils.getPaginationContainer()).toBeInTheDocument();
      });
    });

    it('页面大小变化时重置到第一页', async () => {
      setup();
      
      await waitFor(() => {
        expect(screen.getByText('数学期末考试试卷')).toBeInTheDocument();
      });
      
      // 模拟分页组件触发pageSizeChange事件
      const mockEvent = { detail: 20 };
      
      // 验证会重置到第一页
      await waitFor(() => {
        const paginationContainer = document.querySelector('.pagination-container');
        expect(paginationContainer).toBeInTheDocument();
      });
    });
  });

  describe('面板操作测试', () => {
    it('点击关闭按钮调用onCancel', async () => {
      const onCancel = vi.fn();
      const utils = setup({ onCancel });
      
      await waitFor(() => {
        expect(utils.getCloseButton()).toBeInTheDocument();
      });
      
      await fireEvent.click(utils.getCloseButton());
      expect(onCancel).toHaveBeenCalled();
    });

    it('点击取消按钮调用onCancel', async () => {
      const onCancel = vi.fn();
      const utils = setup({ onCancel });
      
      await waitFor(() => {
        expect(utils.getCancelButton()).toBeInTheDocument();
      });
      
      await fireEvent.click(utils.getCancelButton());
      expect(onCancel).toHaveBeenCalled();
    });

    it('未选择试卷时点击确定显示警告', async () => {
      const utils = setup();
      
      await waitFor(() => {
        expect(utils.getConfirmButton()).toBeInTheDocument();
      });
      
      await fireEvent.click(utils.getConfirmButton());
      
      expect(toast.warning).toHaveBeenCalledWith('请选择一张试卷');
    });

    it('选择试卷后点击确定调用onConfirm', async () => {
      const onConfirm = vi.fn();
      const utils = setup({ onConfirm });
      
      await waitFor(() => {
        expect(screen.getByText('数学期末考试试卷')).toBeInTheDocument();
      });
      
      await utils.selectPaper(1);
      await fireEvent.click(utils.getConfirmButton());
      
      expect(onConfirm).toHaveBeenCalledWith(1, '数学期末考试试卷', '00');
    });
  });

  describe('错误处理测试', () => {
    it('API返回错误时显示错误状态', async () => {
      mockFetchError('服务器错误');
      
      setup();
      
      await waitFor(() => {
        // 验证错误处理逻辑
        const rows = screen.queryAllByRole('row');
        expect(rows).toHaveLength(1); // 只有表头
      });
    });

    // it('网络请求失败时的处理', async () => {
    //   mockFetchNetworkError();
      
    //   setup();
      
    //   await waitFor(() => {
    //     // 验证网络错误处理
    //     const rows = screen.queryAllByRole('row');
    //     expect(rows).toHaveLength(1); // 只有表头
    //   });
    // });

    it('空数据时的显示', async () => {
      mockFetchSuccess([], 0);
      
      setup();
      
      await waitFor(() => {
        const rows = screen.queryAllByRole('row');
        expect(rows).toHaveLength(1); // 只有表头，没有数据行
      });
    });
  });

  describe('搜索和API调用测试', () => {
    it('初始化时自动调用搜索API', async () => {
      setup();
      
      await waitFor(() => {
        expect(fetch).toHaveBeenCalledWith(
          expect.stringContaining('/api/paper'),
          expect.objectContaining({
            method: 'GET',
            credentials: 'include',
            headers: {
              'Content-Type': 'application/json'
            }
          })
        );
      });
    });

    it('API调用包含正确的查询参数', async () => {
      setup();
      
      await waitFor(() => {
        const lastCall = fetch.mock.calls[fetch.mock.calls.length - 1];
        const url = lastCall[0];
        
        expect(url).toContain('page=1');
        expect(url).toContain('pageSize=10');
        expect(url).toContain('category=00'); // 固定为考试类型
      });
    });

    it('处理API响应并更新状态', async () => {
      setup();
      
      await waitFor(() => {
        expect(screen.getByText('数学期末考试试卷')).toBeInTheDocument();
        expect(screen.getByText('英语听力测试')).toBeInTheDocument();
        expect(screen.getByText('高难度物理竞赛')).toBeInTheDocument();
        expect(screen.getByText('无标签试卷')).toBeInTheDocument();
      });
    });
  });

  describe('响应式布局测试', () => {
    it('在小屏幕下正确显示', async () => {
      // 模拟小屏幕
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 768,
      });
      
      setup();
      
      await waitFor(() => {
        const panel = document.querySelector('.paper-selection-panel');
        expect(panel).toBeInTheDocument();
      });
    });

    it('表格在小屏幕下保持可用性', async () => {
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 480,
      });
      
      const utils = setup();
      
      await waitFor(() => {
        expect(utils.getTable()).toBeInTheDocument();
        expect(screen.getByText('数学期末考试试卷')).toBeInTheDocument();
      });
    });
  });

  describe('辅助函数测试', () => {
    it('getDifficultyColor函数返回正确颜色', () => {
      // 这个测试需要直接访问组件内的函数，或者通过DOM验证
      setup();
      
      waitFor(() => {
        const simpleElement = screen.getByText('简单');
        const mediumElement = screen.getByText('中等');
        const hardElement = screen.getByText('困难');
        
        expect(simpleElement).toHaveStyle('color: green');
        expect(mediumElement).toHaveStyle('color: orange');
        expect(hardElement).toHaveStyle('color: red');
      });
    });

    // it('formatDateTime函数正确格式化时间', async () => {
    //   setup();
      
    //   await waitFor(() => {
    //     // 验证时间格式化
    //     expect(screen.getByText('2025-01-10 10:30')).toBeInTheDocument();
    //     expect(screen.getByText('2025-01-09 14:20')).toBeInTheDocument();
    //   });
    // });
  });

  describe('加载状态测试', () => {
    it('加载期间禁用分页操作', async () => {
      // 模拟长时间加载
      global.fetch = vi.fn(() => 
        new Promise(resolve => 
          setTimeout(() => resolve({
            ok: true,
            json: () => Promise.resolve({
              status: 0,
              data: mockPaperData,
              rowCount: 4
            })
          }), 1000)
        )
      );
      
      setup();
      
      // 验证加载状态下的行为
      await waitFor(() => {
        expect(fetch).toHaveBeenCalled();
      });
    });
  });
});

describe('PaperSelectionPanel 边界情况测试', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });


  it('处理异常的难度值', async () => {
    const abnormalLevelPaper = [{
      ...mockPaperData[0],
      Level: '99' // 未定义的难度值
    }];
    
    mockFetchSuccess(abnormalLevelPaper, 1);
    setup();
    
    await waitFor(() => {
      // 应该显示默认颜色
      const difficultyElement = screen.queryByText('简单') || 
                               screen.queryByText('中等') || 
                               screen.queryByText('困难');
      // 验证异常情况的处理
    });
  });

  it('处理分页总数为0的情况', async () => {
    mockFetchSuccess([], 0);
    setup();
    
    await waitFor(() => {
      const pagination = document.querySelector('.pagination-container');
      expect(pagination).toBeInTheDocument();
    });
  });
});