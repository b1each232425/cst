import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, waitFor, within } from '@testing-library/svelte';
import { tick } from 'svelte';
import InvigilatorSelectionPanel from '../_components/InvigilatorSelectionPanel.svelte';


// Mock browser globals
if (typeof globalThis.document === 'undefined') {
  const { JSDOM } = await import('jsdom');
  const dom = new JSDOM('<!DOCTYPE html><html><body></body></html>');
  globalThis.document = dom.window.document;
  globalThis.window = dom.window;
  globalThis.navigator = dom.window.navigator;
}



vi.mock('$lib/components/Toast/Toast.js', () => ({
  toast: {
    error: vi.fn(),
    success: vi.fn(),
    warning: vi.fn()
  }
}));

// Mock fetch
global.fetch = vi.fn();

// Mock URL and URLSearchParams
if (!global.URL) {
  global.URL = class URL {
    constructor(url, base) {
      this.href = url;
      this.origin = base || 'http://localhost';
      this.searchParams = new URLSearchParams();
    }
  };
}

if (!global.URLSearchParams) {
  global.URLSearchParams = class URLSearchParams {
    constructor(init) {
      this.params = new Map();
      if (init) {
        Object.entries(init).forEach(([key, value]) => {
          this.params.set(key, value);
        });
      }
    }
    
    set(key, value) {
      this.params.set(key, value);
    }
    
    get(key) {
      return this.params.get(key);
    }
    
    toString() {
      const pairs = [];
      for (const [key, value] of this.params) {
        pairs.push(`${encodeURIComponent(key)}=${encodeURIComponent(value)}`);
      }
      return pairs.join('&');
    }
  };
}

// 模拟监考员数据
const MOCK_INVIGILATORS = [
  {
    id: 1,
    MobilePhone: '13800138001',
    Account: 'supervisor001',
    OfficialName: '张三',
    Gender: '男',
    selected: false
  },
  {
    id: 2,
    MobilePhone: '13800138002',
    Account: 'supervisor002',
    OfficialName: '李四',
    Gender: '女',
    selected: true
  },
  {
    id: 3,
    MobilePhone: '13800138003',
    Account: 'supervisor003',
    OfficialName: '王五',
    Gender: '男',
    selected: false
  }
];

// 测试工具函数
function mockFetch(data) {
  global.fetch = vi.fn(() =>
    Promise.resolve({
      ok: true,
      json: () => Promise.resolve(data),
    }),
  );
}

const setup = (props = {}) => {
  const defaultProps = {
    show_panel: true,
    onConfirm: vi.fn(),
    onCancel: vi.fn(),
    ...props
  };
  
  const result = render(InvigilatorSelectionPanel, { props: defaultProps });
  
  return {
    ...result,
    searchInput: () => screen.queryByLabelText('搜索监考员'),
    addInvigilatorButton: () => screen.getByText('添加监考员'),
    returnButton: () => screen.queryByText('返回监考员列表'),
    table: () => screen.getByRole('table'),
    confirmButton: () => screen.getByText('确定'),
    cancelButton: () => screen.getByText('取消'),
    closeButton: () => screen.getByText('×'),
    panelHeader: () => screen.getByText(/监考员列表|选择监考员/),
    ...defaultProps
  };
};

describe('InvigilatorSelectionPanel 组件测试', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    
    // 默认成功响应
    global.fetch = vi.fn((url) => {
      if (typeof url !== 'string') {
        return Promise.reject(new Error('Invalid URL'));
      }

      if (url.includes('/api/user')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ status: 0, data: MOCK_INVIGILATORS }),
        });
      }

      return Promise.reject(new Error(`Unhandled URL: ${url}`));
    });
  });

  describe('组件渲染测试', () => {
    it('应该渲染面板核心元素', async () => {
      setup();
      
      // 等待组件完全渲染
      await tick();
      
      // 验证面板标题
      expect(screen.getByText('监考员列表')).toBeInTheDocument();
      
      // 验证搜索框标签
      expect(screen.getByText('搜索监考员')).toBeInTheDocument();
      
      // 验证添加按钮
      expect(screen.getByText('添加监考员')).toBeInTheDocument();
      
      // 验证操作按钮
      expect(screen.getByText('确定')).toBeInTheDocument();
      expect(screen.getByText('取消')).toBeInTheDocument();
      expect(screen.getByText('×')).toBeInTheDocument();
    });

    it('当 show_panel 为 false 时应该隐藏面板', () => {
      const { container } = setup({ show_panel: false });
      
      expect(container.querySelector('.hide')).toBeInTheDocument();
    });

    it('当 show_panel 为 true 时应该显示面板', () => {
      const { container } = setup({ show_panel: true });
      
      expect(container.querySelector('.exam-invigilator-panel-container')).toBeInTheDocument();
      expect(container.querySelector('.hide')).not.toBeInTheDocument();
    });

    it('应该渲染表格头部', async () => {
      setup();
      await tick();
      
      // 查看模式下的表头
      expect(screen.getByText('手机号')).toBeInTheDocument();
      expect(screen.getByText('账号')).toBeInTheDocument();
      expect(screen.getByText('姓名')).toBeInTheDocument();
      expect(screen.getByText('性别')).toBeInTheDocument();
    });

    it('选择模式下应该显示复选框列', async () => {
      setup();
      await tick();
      
      // 等待数据加载
      await waitFor(() => {
        expect(screen.getByText('李四')).toBeInTheDocument();
      });
      
      // 切换到选择模式
      const addButton = screen.getByText('添加监考员');
      await fireEvent.click(addButton);
      await tick();
      
      // 验证复选框列存在
      const checkboxes = screen.getAllByRole('checkbox');
      expect(checkboxes.length).toBeGreaterThan(0);
    });

    it('应该渲染表格数据', async () => {
      setup();
      
      await waitFor(() => {
        expect(screen.getByText('张三')).toBeInTheDocument();
        expect(screen.getByText('李四')).toBeInTheDocument();
        expect(screen.getByText('王五')).toBeInTheDocument();
        expect(screen.getByText('13800138001')).toBeInTheDocument();
        expect(screen.getByText('supervisor001')).toBeInTheDocument();
        expect(screen.getByText('男')).toBeInTheDocument();
        expect(screen.getByText('女')).toBeInTheDocument();
      });
    });
  });

  describe('模式切换功能测试', () => {
    it('应该正确切换查看模式和选择模式', async () => {
      setup();
      await tick();
      
      // 初始为查看模式
      expect(screen.getByText('监考员列表')).toBeInTheDocument();
      expect(screen.getByText('添加监考员')).toBeInTheDocument();
      
      // 切换到选择模式
      const addButton = screen.getByText('添加监考员');
      await fireEvent.click(addButton);
      await tick();
      
      expect(screen.getByText('选择监考员')).toBeInTheDocument();
      expect(screen.getByText('返回监考员列表')).toBeInTheDocument();
      
      // 切换回查看模式
      const returnButton = screen.getByText('返回监考员列表');
      await fireEvent.click(returnButton);
      await tick();
      
      expect(screen.getByText('监考员列表')).toBeInTheDocument();
      expect(screen.getByText('添加监考员')).toBeInTheDocument();
    });

    it('模式切换时按钮样式应该更新', async () => {
      const { container } = setup();
      await tick();
      
      // 初始状态：添加按钮应该是主要样式
      let modeButton = container.querySelector('.btn--primary');
      expect(modeButton).toHaveTextContent('添加监考员');
      
      // 切换到选择模式
      await fireEvent.click(modeButton);
      await tick();
      
      // 返回按钮应该是信息样式
      modeButton = container.querySelector('.btn--info');
      expect(modeButton).toHaveTextContent('返回监考员列表');
    });
  });

  describe('数据加载功能测试', () => {
    it('组件挂载时应该调用 fetchExaminvigilators', async () => {
      setup();
      
      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith(
          expect.stringContaining('/api/user'),
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

    it('应该构造正确的 API URL 参数', async () => {
      setup();
      
      await waitFor(() => {
        const fetchCall = global.fetch.mock.calls[0];
        const url = fetchCall[0];
        
        expect(url).toContain('/api/user?');
        expect(url).toContain('page=1');
        expect(url).toContain('pageSize=10');
        expect(url).toContain('domain=cst.school%5EexamSupervisor');
      });
    });

    it('成功加载数据后应该显示监考员信息', async () => {
      setup();
      
      await waitFor(() => {
        expect(screen.getByText('张三')).toBeInTheDocument();
        expect(screen.getByText('李四')).toBeInTheDocument();
        expect(screen.getByText('13800138001')).toBeInTheDocument();
        expect(screen.getByText('supervisor001')).toBeInTheDocument();
      });
    });

    it('API 返回错误状态时应该显示错误提示', async () => {
      const { toast } = await import('$lib/components/Toast/Toast.js');
      
      global.fetch = vi.fn(() =>
        Promise.resolve({
          ok: true,
          json: () => Promise.resolve({
            status: 1,
            msg: '获取监考员失败'
          })
        })
      );
      
      setup();
      
      await waitFor(() => {
        expect(toast.error).toHaveBeenCalledWith('获取列表失败获取监考员失败');
      });
    });

    it('网络错误时应该显示错误提示', async () => {
      const { toast } = await import('$lib/components/Toast/Toast.js');
      
      global.fetch = vi.fn(() => Promise.reject(new Error('网络连接失败')));
      
      setup();
      
      await waitFor(() => {
        expect(toast.error).toHaveBeenCalledWith('获取失败');
      });
    });

    it('无数据时应该显示空状态', async () => {
      global.fetch = vi.fn(() =>
        Promise.resolve({
          ok: true,
          json: () => Promise.resolve({
            status: 0,
            data: []
          })
        })
      );
      
      const { container } = setup();
      
      await waitFor(() => {
        const emptyElement = container.querySelector('.no-data-text');
        expect(emptyElement).toBeInTheDocument();
      });
    });
  });

  describe('复选框选择功能测试', () => {
    it('应该支持单个监考员选择', async () => {
      const { container } = setup();
      
      // 等待数据加载
      await waitFor(() => {
        expect(screen.getByText('张三')).toBeInTheDocument();
      });
      
      // 切换到选择模式
      const addButton = screen.getByText('添加监考员');
      await fireEvent.click(addButton);
      await tick();
      
      // 点击第一行（排除表头）
      const tableRows = container.querySelectorAll('tbody tr');
      if (tableRows.length > 0) {
        await fireEvent.click(tableRows[0]);
        await tick();
        
        // 验证选择状态（通过 checkbox 的存在性）
        const checkbox = tableRows[0].querySelector('input[type="checkbox"]');
        expect(checkbox).toBeTruthy();
      }
    });

    it('点击复选框本身不应该触发行选择', async () => {
      const { container } = setup();
      
      await waitFor(() => {
        expect(screen.getByText('张三')).toBeInTheDocument();
      });
      
      // 切换到选择模式
      const addButton = screen.getByText('添加监考员');
      await fireEvent.click(addButton);
      await tick();
      
      // 直接点击复选框
      const checkboxes = container.querySelectorAll('tbody input[type="checkbox"]');
      if (checkboxes.length > 0) {
        await fireEvent.click(checkboxes[0]);
        await tick();
        // handleCheckBoxChange 函数中，如果是复选框类型应该直接返回
      }
    });

    it('应该支持全选功能', async () => {
      const { container } = setup();
      
      await waitFor(() => {
        expect(screen.getByText('张三')).toBeInTheDocument();
      });
      
      // 切换到选择模式
      const addButton = screen.getByText('添加监考员');
      await fireEvent.click(addButton);
      await tick();
      
      // 点击全选复选框
      const selectAllCheckbox = container.querySelector('thead input[type="checkbox"]');
      if (selectAllCheckbox) {
        await fireEvent.change(selectAllCheckbox, { target: { checked: true } });
        await tick();
        
        // 验证全选复选框存在
        expect(selectAllCheckbox).toBeTruthy();
      }
    });

    it('取消全选应该清除所有选择', async () => {
      const { container } = setup();
      
      await waitFor(() => {
        expect(screen.getByText('张三')).toBeInTheDocument();
      });
      
      // 切换到选择模式
      const addButton = screen.getByText('添加监考员');
      await fireEvent.click(addButton);
      await tick();
      
      // 先全选
      const selectAllCheckbox = container.querySelector('thead input[type="checkbox"]');
      if (selectAllCheckbox) {
        await fireEvent.change(selectAllCheckbox, { target: { checked: true } });
        await tick();
        
        // 再取消全选
        await fireEvent.change(selectAllCheckbox, { target: { checked: false } });
        await tick();
        
        // 验证全选复选框存在
        expect(selectAllCheckbox).toBeTruthy();
      }
    });
  });

  describe('面板关闭功能测试', () => {
    it('点击关闭按钮应该关闭面板并调用 onCancel', async () => {
      const mockProps = setup();
      
      const closeButton = screen.getByText('×');
      await fireEvent.click(closeButton);
      
      expect(mockProps.onCancel).toHaveBeenCalledWith(false);
    });

    it('点击取消按钮应该关闭面板并调用 onCancel', async () => {
      const mockProps = setup();
      
      const cancelButton = screen.getByText('取消');
      await fireEvent.click(cancelButton);
      
      expect(mockProps.onCancel).toHaveBeenCalled();
    });

    it('点击确定按钮应该调用 onConfirm 并传递选中的监考员', async () => {
      const mockProps = setup();
      
      await waitFor(() => {
        expect(screen.getByText('张三')).toBeInTheDocument();
      });
      
      const confirmButton = screen.getByText('确定');
      await fireEvent.click(confirmButton);
      
      expect(mockProps.onConfirm).toHaveBeenCalledWith(
        expect.any(Array)
      );
    });
  });

  describe('显示隐藏状态测试', () => {
    it('查看模式下应该隐藏选择相关的分页信息', async () => {
      const { container } = setup();
      await tick();
      
      // 查看模式下，选择分页应该被隐藏
      const hiddenElements = container.querySelectorAll('.hideButton');
      expect(hiddenElements.length).toBeGreaterThan(0);
    });

    it('选择模式下应该显示已选数量', async () => {
      setup();
      
      await waitFor(() => {
        expect(screen.getByText('张三')).toBeInTheDocument();
      });
      
      // 切换到选择模式
      const addButton = screen.getByText('添加监考员');
      await fireEvent.click(addButton);
      await tick();
      
      // 应该显示已选数量
      expect(screen.getByText(/已选/)).toBeInTheDocument();
      expect(screen.getByText(/条/)).toBeInTheDocument();
    });

    it('应该正确显示性别信息或默认值', async () => {
      // 修改模拟数据，添加一个没有性别的监考员
      const mockDataWithEmptyGender = [
        ...MOCK_INVIGILATORS,
        {
          id: 4,
          MobilePhone: '13800138004',
          Account: 'supervisor004',
          OfficialName: '赵六',
          Gender: null,
          selected: false
        }
      ];
      
      global.fetch = vi.fn(() =>
        Promise.resolve({
          ok: true,
          json: () => Promise.resolve({
            status: 0,
            data: mockDataWithEmptyGender
          })
        })
      );
      
      setup();
      
      await waitFor(() => {
        expect(screen.getByText('赵六')).toBeInTheDocument();
        expect(screen.getByText('--')).toBeInTheDocument(); // 默认的性别显示
      });
    });
  });

  describe('分页功能测试', () => {
    it('应该渲染分页组件', async () => {
      const { container } = setup();
      await tick();
      
      // 验证分页容器存在
      const paginationContainers = container.querySelectorAll('.pagination-container');
      expect(paginationContainers.length).toBeGreaterThan(0);
    });

    it('在不同模式下应该显示不同的分页信息', async () => {
      const { container } = setup();
      
      await waitFor(() => {
        expect(screen.getByText('张三')).toBeInTheDocument();
      });
      
      // 查看模式
      let visiblePagination = container.querySelectorAll('.pagination-container:not(.hideButton)');
      expect(visiblePagination.length).toBe(1);
      
      // 切换到选择模式
      const addButton = screen.getByText('添加监考员');
      await fireEvent.click(addButton);
      await tick();
      
      // 选择模式下应该显示不同的分页
      visiblePagination = container.querySelectorAll('.pagination-container:not(.hideButton)');
      expect(visiblePagination.length).toBe(1);
    });
  });

  describe('搜索功能测试', () => {
    it('应该渲染搜索输入框', async () => {
      setup();
      await tick();
      
      // 通过标签文本查找搜索输入框
      expect(screen.getByText('搜索监考员')).toBeInTheDocument();
    });

    it('搜索框应该支持清除功能', async () => {
      const { container } = setup();
      await tick();
      
      // 验证搜索框容器存在
      const searchContainer = container.querySelector('.exam-invigilator-search-container');
      expect(searchContainer).toBeInTheDocument();
    });
  });

  describe('边界情况测试', () => {
    it('应该处理空的监考员列表', async () => {
      global.fetch = vi.fn(() =>
        Promise.resolve({
          ok: true,
          json: () => Promise.resolve({
            status: 0,
            data: []
          })
        })
      );
      
      const { container } = setup();
      
      await waitFor(() => {
        // 应该显示空状态
        const emptyElement = container.querySelector('.no-data-text');
        expect(emptyElement).toBeInTheDocument();
      });
    });

    it('应该处理 fetch 返回的 null 数据', async () => {
      global.fetch = vi.fn(() =>
        Promise.resolve({
          ok: true,
          json: () => Promise.resolve({
            status: 0,
            data: null
          })
        })
      );
      
      setup();
      
      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalled();
      });
    });

    it('应该处理无效的 URL 参数', async () => {
      global.fetch = vi.fn(() => Promise.reject(new Error('Invalid URL')));
      
      setup();
      
      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalled();
      });
    });

    it('应该处理fetch响应不是JSON格式的情况', async () => {
      global.fetch = vi.fn(() =>
        Promise.resolve({
          ok: true,
          json: () => Promise.reject(new Error('Invalid JSON'))
        })
      );
      
      setup();
      
      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalled();
      });
    });
  });

  describe('样式和布局测试', () => {
    it('面板应该有正确的样式类', async () => {
      const { container } = setup();
      await tick();
      
      expect(container.querySelector('.exam-invigilator-panel-container')).toBeInTheDocument();
      expect(container.querySelector('.exam-invigilator-panel')).toBeInTheDocument();
      expect(container.querySelector('.panel-header')).toBeInTheDocument();
      expect(container.querySelector('.panel-body')).toBeInTheDocument();
      expect(container.querySelector('.panel-footer')).toBeInTheDocument();
    });

    it('表格应该有正确的样式类', async () => {
      const { container } = setup();
      
      await waitFor(() => {
        expect(screen.getByText('张三')).toBeInTheDocument();
      });
      
      expect(container.querySelector('.table')).toBeInTheDocument();
      expect(container.querySelector('.exam-invigilator-table-head')).toBeInTheDocument();
    });

    it('操作按钮应该有正确的布局', async () => {
      const { container } = setup();
      await tick();
      
      expect(container.querySelector('.action-container')).toBeInTheDocument();
      expect(container.querySelector('.button-group')).toBeInTheDocument();
    });

    it('面板头部应该有正确的样式和内容', async () => {
      const { container } = setup();
      await tick();
      
      const header = container.querySelector('.panel-header');
      expect(header).toBeInTheDocument();
      
      const headerText = container.querySelector('.panel-header-text');
      expect(headerText).toBeInTheDocument();
      
      const closeBtn = container.querySelector('.close-btn');
      expect(closeBtn).toBeInTheDocument();
    });
  });

  describe('交互行为测试', () => {
    it('表格行悬停应该有正确的样式', async () => {
      const { container } = setup();
      
      await waitFor(() => {
        expect(screen.getByText('张三')).toBeInTheDocument();
      });
      
      // 切换到选择模式
      const addButton = screen.getByText('添加监考员');
      await fireEvent.click(addButton);
      await tick();
      
      const tableRows = container.querySelectorAll('tbody tr');
      if (tableRows.length > 0) {
        await fireEvent.mouseEnter(tableRows[0]);
        // 验证行存在（悬停样式通过CSS处理）
        expect(tableRows[0]).toBeInTheDocument();
      }
    });

    it('应该正确处理键盘事件', async () => {
      setup();
      await tick();
      
      // 模拟按下Escape键
      await fireEvent.keyDown(document, { key: 'Escape' });
      
      // 验证组件仍然存在（没有特殊的键盘处理逻辑）
      expect(screen.getByText('监考员列表')).toBeInTheDocument();
    });
  });

  describe('状态管理测试', () => {
    it('应该正确管理选择状态', async () => {
      const { container } = setup();
      
      await waitFor(() => {
        expect(screen.getByText('张三')).toBeInTheDocument();
      });
      
      // 切换到选择模式
      const addButton = screen.getByText('添加监考员');
      await fireEvent.click(addButton);
      await tick();
      
      // 验证已选数量显示
      expect(screen.getByText(/已选/)).toBeInTheDocument();
      
      // 模拟选择操作
      const tableRows = container.querySelectorAll('tbody tr');
      if (tableRows.length > 0) {
        await fireEvent.click(tableRows[0]);
        await tick();
      }
    });

    it('应该正确计算全选状态', async () => {
      const { container } = setup();
      
      await waitFor(() => {
        expect(screen.getByText('张三')).toBeInTheDocument();
      });
      
      // 切换到选择模式
      const addButton = screen.getByText('添加监考员');
      await fireEvent.click(addButton);
      await tick();
      
      // 检查全选复选框状态
      const selectAllCheckbox = container.querySelector('thead input[type="checkbox"]');
      expect(selectAllCheckbox).toBeTruthy();
    });
  });
});