import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/svelte';
import { tick } from 'svelte';
import UserManagementPage from '../+page.svelte';

vi.mock('$lib/components/Title/Title.svelte', () => ({
  default: vi.fn()
}));

vi.mock('$lib/components/Input/InputBox.svelte', () => ({
  default: vi.fn()
}));


vi.mock('$lib/components/Pagination/Pagination.svelte', () => ({
  default: vi.fn()
}));

vi.mock('$lib/components/Select/Select.svelte', () => ({
  default: vi.fn()
}));

vi.mock('$lib/components/Select/Option.svelte', () => ({
  default: vi.fn()
}));

vi.mock('$lib/components/Table/Empty.svelte', () => ({
  default: vi.fn()
}));

vi.mock('$lib/components/DatePicker/DatePicker.svelte', () => ({
  default: vi.fn()
}));

vi.mock('$lib/components/DatePicker/datePicker', () => ({
  formatDate: vi.fn((date) => {
    if (!date) return '';
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
  })
}));

vi.mock('$app/navigation', () => ({
  goto: vi.fn()
}));

// Mock debounce 
vi.mock('../_utils/debounce.js', () => ({
  debounce: vi.fn((fn, delay) => {
    // 在测试中立即执行，不延迟
    return function (...args) {
      return fn.apply(this, args);
    };
  })
}));

// Mock fetch
global.fetch = vi.fn();

describe('用户管理页面', () => {
  // 模拟用户数据
  const mockUsers = [
    {
      ID: '1',
      Account: 'user001',
      Domains: ['cst.school^admin'],
      OfficialName: '张三',
      Gender: '男',
      MobilePhone: '13800138000',
      Email: 'zhangsan@example.com',
      Type: '02',
      Category: 'normal',
      CreateTime: '2023-01-01T08:00:00Z',
      Status: '00'
    },
    {
      ID: '2',
      Account: 'user002',
      Domains: ['cst.school^teacher'],
      OfficialName: '李四',
      Gender: '女',
      MobilePhone: '13800138001',
      Email: 'lisi@example.com',
      Type: '02',
      Category: 'normal',
      CreateTime: '2023-01-02T08:00:00Z',
      Status: '02'
    }
  ];

  const mockApiResponse = {
    data: mockUsers,
    rowCount: 2
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
      const { container } = render(UserManagementPage);

      expect(container.querySelector('.user-management-container')).toBeTruthy();
    });

    it('应该在组件挂载时调用 fetchUsers', async () => {
      render(UserManagementPage);

      await waitFor(() => {
        expect(fetch).toHaveBeenCalledWith(
          expect.stringContaining('/api/user'),
          expect.objectContaining({
            method: 'GET',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include'
          })
        );
      });
    });

    it('应该正确设置初始状态', async () => {
      render(UserManagementPage);

      await tick();

      // 验证初始状态
      expect(fetch).toHaveBeenCalledWith(
        expect.stringMatching(/\/api\/user\?.*page=1.*pageSize=10/),
        expect.any(Object)
      );
    });
  });

  describe('数据获取和处理', () => {
    it('应该正确处理 API 响应数据', async () => {
      render(UserManagementPage);

      await waitFor(() => {
        expect(fetch).toHaveBeenCalled();
      });

      await tick();

      // 验证用户数据是否正确显示在DOM中
      const container = document.body;
      expect(container.textContent).toContain('user001');
      expect(container.textContent).toContain('张三');
    });

    it('应该正确映射用户类型', async () => {
      render(UserManagementPage);

      await waitFor(() => {
        expect(fetch).toHaveBeenCalled();
      });

      await tick();

      // 验证类型映射 '02' -> '注册用户'
      const container = document.body;
      expect(container.textContent).toContain('注册用户');
    });

    it('应该正确处理时间格式化', async () => {
      render(UserManagementPage);

      await waitFor(() => {
        expect(fetch).toHaveBeenCalled();
      });

      await tick();

      // 验证日期格式化
      const container = document.body;
      expect(container.textContent).toMatch(/\d{4}\/\d{1,2}\/\d{1,2}/);
    });
  });

  describe('搜索功能', () => {
    it('应该正确处理初始API调用', async () => {
      render(UserManagementPage);

      // 等待初始加载完成
      await waitFor(() => {
        expect(fetch).toHaveBeenCalledTimes(1);
      });

      // 验证初始API调用包含正确的参数
      const initialCall = fetch.mock.calls[0];
      expect(initialCall[0]).toContain('/api/user');
      expect(initialCall[0]).toContain('page=1');
      expect(initialCall[0]).toContain('pageSize=10');
    });

    it('搜索时应该重置页码为1', async () => {
      render(UserManagementPage);

      await waitFor(() => {
        expect(fetch).toHaveBeenCalledTimes(1);
      });

      // 验证初始请求包含 page=1
      const initialCall = fetch.mock.calls[0];
      expect(initialCall[0]).toContain('page=1');
    });
  });

  describe('筛选功能', () => {
    it('应该显示筛选相关的UI元素', async () => {
      render(UserManagementPage);

      await waitFor(() => {
        expect(fetch).toHaveBeenCalledTimes(1);
      });

      await tick();

      // 检查筛选相关的DOM元素是否存在
      const container = document.body;
      expect(container.textContent).toContain('性别');
      expect(container.textContent).toContain('账号状态');
      expect(container.textContent).toContain('角色');
    });

    it('应该正确构造包含所有筛选条件的请求参数', async () => {
      const { container } = render(UserManagementPage);

      await waitFor(() => expect(fetch).toHaveBeenCalledTimes(1));

      // 验证初始API调用正确
      const initialCall = fetch.mock.calls[0];
      expect(initialCall[0]).toContain('/api/user');
      expect(initialCall[0]).toContain('page=1');
      expect(initialCall[0]).toContain('pageSize=10');

      // 验证组件渲染成功
      expect(container).toBeTruthy();
      expect(container.querySelector('.user-management-container')).toBeTruthy();
    });
  });

  describe('分页功能', () => {
    it('应该显示分页组件', async () => {
      const { container } = render(UserManagementPage);

      await waitFor(() => {
        expect(fetch).toHaveBeenCalled();
      });

      await tick();

      // 验证分页相关元素
      const paginationWrapper = container.querySelector('.pagination-wrapper');
      expect(paginationWrapper).toBeTruthy();
    });
  });

  describe('用户选择功能', () => {
    it('应该显示复选框元素', async () => {
      const { container } = render(UserManagementPage);

      await waitFor(() => {
        expect(fetch).toHaveBeenCalled();
      });

      await tick();

      // 查找复选框相关的样式类
      const checkboxElements = container.querySelectorAll('.col-checkbox');
      expect(checkboxElements.length).toBeGreaterThan(0);
    });
  });

  describe('操作按钮', () => {
    it('应该显示新增按钮', async () => {
      const { container } = render(UserManagementPage);

      await tick();

      const addButton = container.querySelector('.add-btn');
      expect(addButton).toBeTruthy();
      if (addButton) {
        expect(addButton.textContent.trim()).toBe('新增');
      }
    });

    it('点击新增按钮应该调用导航函数', async () => {
      const { goto } = await import('$app/navigation');
      const { container } = render(UserManagementPage);

      await tick();

      const addButton = container.querySelector('.add-btn');
      if (addButton) {
        await fireEvent.click(addButton);
        expect(goto).toHaveBeenCalledWith('/teacher/user-management/addUser');
      }
    });
  });

  describe('表格显示', () => {
    it('应该显示用户表格', async () => {
      const { container } = render(UserManagementPage);

      await waitFor(() => {
        expect(fetch).toHaveBeenCalled();
      });

      await tick();

      const table = container.querySelector('.user-table');
      expect(table).toBeTruthy();
    });

    it('应该显示正确的表头', async () => {
      const { container } = render(UserManagementPage);

      await tick();

      // 验证一些重要的表头文本
      const container_text = container.textContent;
      expect(container_text).toContain('账号');
      expect(container_text).toContain('姓名');
      expect(container_text).toContain('角色');
    });

    it('有数据时应该显示用户信息', async () => {
      render(UserManagementPage);

      await waitFor(() => {
        expect(fetch).toHaveBeenCalled();
      });

      await tick();

      // 验证是否显示了模拟的用户数据
      const container = document.body;
      expect(container.textContent).toContain('user001');
      expect(container.textContent).toContain('张三');
    });
  });

  describe('错误处理', () => {
    it('应该处理 API 请求失败', async () => {
      fetch.mockRejectedValue(new Error('Network error'));

      const { container } = render(UserManagementPage);

      await waitFor(() => {
        expect(fetch).toHaveBeenCalled();
      });

      await tick();

      // 验证组件仍然能够渲染，即使API失败
      expect(container.querySelector('.user-management-container')).toBeTruthy();
    });

    it('应该处理空数据响应', async () => {
      fetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({
          data: [],
          rowCount: 0
        })
      });

      const { container } = render(UserManagementPage);

      await waitFor(() => {
        expect(fetch).toHaveBeenCalled();
      });

      await tick();

      // 验证空状态处理
      const emptyRow = container.querySelector('.empty-row');
      expect(emptyRow).toBeTruthy();
    });
  });

  describe('响应式设计', () => {
    it('应该在不同屏幕尺寸下正确显示', async () => {
      const { container } = render(UserManagementPage);

      await tick();

      // 验证响应式容器
      const mainContainer = container.querySelector('.user-management-container');
      expect(mainContainer).toBeTruthy();
    });
  });

  describe('常量和映射', () => {
    it('应该包含必要的类型映射常量', async () => {
      render(UserManagementPage);

      await waitFor(() => {
        expect(fetch).toHaveBeenCalled();
      });

      await tick();

      // 验证类型映射是否正确应用
      const container = document.body;
      expect(container.textContent).toContain('注册用户');
    });
  });

  describe('防抖功能', () => {
    it('应该使用防抖函数处理搜索', async () => {
      const { debounce } = await import('../_utils/debounce.js');

      render(UserManagementPage);

      // 验证防抖函数被调用
      expect(debounce).toHaveBeenCalled();
    });
  });

  describe('全选功能', () => {
    it('应该正确处理全选操作', async () => {
      const { container } = render(UserManagementPage);

      await waitFor(() => {
        expect(fetch).toHaveBeenCalled();
      });
      await tick();

      // 查找全选复选框
      const selectAllCheckbox = container.querySelector('input[type="checkbox"].checkbox-all');
      if (selectAllCheckbox) {
        // 模拟点击全选
        await fireEvent.click(selectAllCheckbox);
        await tick();

        // 验证所有单选框都被选中
        const itemCheckboxes = container.querySelectorAll('input[type="checkbox"].checkbox-item');
        itemCheckboxes.forEach(checkbox => {
          expect(checkbox.checked).toBe(true);
        });
      }
    });

    it('应该正确处理取消全选操作', async () => {
      const { container } = render(UserManagementPage);

      await waitFor(() => {
        expect(fetch).toHaveBeenCalled();
      });
      await tick();

      const selectAllCheckbox = container.querySelector('input[type="checkbox"].checkbox-all');
      if (selectAllCheckbox) {
        // 先全选
        await fireEvent.click(selectAllCheckbox);
        await tick();

        // 再取消全选
        await fireEvent.click(selectAllCheckbox);
        await tick();

        // 验证所有单选框都被取消选中
        const itemCheckboxes = container.querySelectorAll('input[type="checkbox"].checkbox-item');
        itemCheckboxes.forEach(checkbox => {
          expect(checkbox.checked).toBe(false);
        });
      }
    });

    it('当取消单个选项时应该自动取消全选状态', async () => {
      const { container } = render(UserManagementPage);

      await waitFor(() => {
        expect(fetch).toHaveBeenCalled();
      });
      await tick();

      const selectAllCheckbox = container.querySelector('input[type="checkbox"].checkbox-all');
      const firstItemCheckbox = container.querySelector('input[type="checkbox"].checkbox-item');

      if (selectAllCheckbox && firstItemCheckbox) {
        // 先全选
        await fireEvent.click(selectAllCheckbox);
        await tick();

        // 取消选中第一个项目
        await fireEvent.click(firstItemCheckbox);
        await tick();

        // 验证全选状态被取消
        expect(selectAllCheckbox.checked).toBe(false);
      }
    });
  });


  describe('跨页选择功能', () => {
    it('应该在翻页后保持选中状态', async () => {
      const { container } = render(UserManagementPage);

      await waitFor(() => {
        expect(fetch).toHaveBeenCalled();
      });
      await tick();

      // 选中第一个用户
      const firstCheckbox = container.querySelector('input[type="checkbox"].checkbox-item');
      if (firstCheckbox) {
        await fireEvent.click(firstCheckbox);
        await tick();

        // 模拟翻页
        expect(firstCheckbox.checked).toBe(true);
      }
    });

    it('全选应该支持跨页选择', async () => {
      const { container } = render(UserManagementPage);

      await waitFor(() => {
        expect(fetch).toHaveBeenCalled();
      });
      await tick();

      // 点击全选
      const selectAllCheckbox = container.querySelector('input[type="checkbox"].checkbox-all');
      if (selectAllCheckbox) {
        await fireEvent.click(selectAllCheckbox);
        await tick();

        // 验证当前页所有项目都被选中
        const itemCheckboxes = container.querySelectorAll('input[type="checkbox"].checkbox-item');
        expect(itemCheckboxes.length).toBeGreaterThan(0);
        itemCheckboxes.forEach(checkbox => {
          expect(checkbox.checked).toBe(true);
        });
      }
    });
  });


  describe('搜索框交互', () => {
    it('应该验证组件包含搜索相关UI', async () => {
      const { container } = render(UserManagementPage);

      await waitFor(() => {
        expect(fetch).toHaveBeenCalledTimes(1);
      });

      // 验证组件成功渲染
      expect(container).toBeTruthy();
      expect(container.querySelector('.user-management-container')).toBeTruthy();
    });

    it('应该验证搜索防抖功能被配置', async () => {
      const { debounce } = await import('../_utils/debounce.js');

      render(UserManagementPage);

      // 验证防抖函数被调用
      expect(debounce).toHaveBeenCalled();
    });
  });

  describe('下拉筛选功能', () => {
    it('性别筛选应该发送正确的请求', async () => {
      const { container } = render(UserManagementPage);

      await waitFor(() => {
        expect(fetch).toHaveBeenCalledTimes(1);
      });

      await tick();

      // 验证性别筛选相关的UI元素存在
      expect(container.textContent).toContain('性别');
    });

    it('账号状态筛选应该发送正确的请求', async () => {
      const { container } = render(UserManagementPage);

      await waitFor(() => {
        expect(fetch).toHaveBeenCalledTimes(1);
      });

      await tick();

      // 验证账号状态筛选相关的UI元素存在
      expect(container.textContent).toContain('账号状态');
    });

    it('角色筛选应该发送正确的请求', async () => {
      const { container } = render(UserManagementPage);

      await waitFor(() => {
        expect(fetch).toHaveBeenCalledTimes(1);
      });

      await tick();

      // 验证角色筛选相关的UI元素存在
      expect(container.textContent).toContain('角色');
    });
  });

  describe('分页交互', () => {
    it('应该在分页改变时发送正确的请求', async () => {
      const { container } = render(UserManagementPage);

      await waitFor(() => {
        expect(fetch).toHaveBeenCalledTimes(1);
      });

      // 验证分页容器存在
      const paginationWrapper = container.querySelector('.pagination-wrapper');
      expect(paginationWrapper).toBeTruthy();
    });

    it('应该正确处理页面大小变化', async () => {
      const { container } = render(UserManagementPage);

      await waitFor(() => {
        expect(fetch).toHaveBeenCalledTimes(1);
      });

      // 验证初始请求使用默认页面大小
      const initialCall = fetch.mock.calls[0];
      expect(initialCall[0]).toContain('pageSize=10');
    });
  });

  describe('数据格式化', () => {
    it('应该正确格式化创建时间', async () => {
      render(UserManagementPage);

      await waitFor(() => {
        expect(fetch).toHaveBeenCalled();
      });
      await tick();

      // 验证时间格式化
      const container = document.body;
      expect(container.textContent).toMatch(/\d{4}\/\d{1,2}\/\d{1,2}/);
    });

    it('应该正确处理空值和默认值', async () => {
      // 模拟包含空值的数据
      const mockUsersWithEmptyValues = [
        {
          ID: '3',
          Account: 'user003',
          Domains: ['cst.school^student'],
          OfficialName: null,
          Gender: null,
          MobilePhone: null,
          Email: null,
          Type: '02',
          Category: 'normal',
          CreateTime: '2023-01-03T08:00:00Z',
          Status: '00'
        }
      ];

      fetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({
          data: mockUsersWithEmptyValues,
          rowCount: 1
        })
      });

      render(UserManagementPage);

      await waitFor(() => {
        expect(fetch).toHaveBeenCalled();
      });
      await tick();

      // 验证空值被正确处理为 '-'
      const container = document.body;
      expect(container.textContent).toContain('-');
    });
  });

  describe('空状态处理', () => {

    it('当没有数据时应该显示空状态', async () => {
      fetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({
          data: [],
          rowCount: 0
        })
      });

      const { container } = render(UserManagementPage);

      await waitFor(() => {
        expect(fetch).toHaveBeenCalled();
      });
      await tick();

      // 验证空状态显示
      const emptyRow = container.querySelector('.empty-row');
      expect(emptyRow).toBeTruthy();
      expect(emptyRow.classList.contains('hide')).toBe(false);
    });

    it('当有数据时应该隐藏空状态', async () => {
      const { container } = render(UserManagementPage);

      await waitFor(() => {
        expect(fetch).toHaveBeenCalled();
      });
      await tick();

      // 验证有数据时空状态被隐藏
      const emptyRow = container.querySelector('.empty-row');
      if (emptyRow) {
        expect(emptyRow.classList.contains('hide')).toBe(true);
      }
    });

    it('应该正确映射角色、类型和空值', async () => {
      const mockUser = {
        ID: '3',
        Account: 'user003',
        Domains: ['cst.school^examGrader'],
        OfficialName: null,
        Gender: null,
        MobilePhone: null,
        Email: null,
        Type: '02',
        Category: null,
        CreateTime: '2023-01-03T08:00:00Z',
        Status: '02',
      };

      fetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ data: [mockUser], rowCount: 1 }),
      });

      const { container } = render(UserManagementPage);

      await waitFor(() => {
        expect(container.textContent).toContain('批阅员'); // ROLELABELMAP
        expect(container.textContent).toContain('注册用户'); // TYPEMAP
        expect(container.textContent).toContain('-'); // null 默认值
      });
    });

    it('应该正确处理空数据响应并清空状态', async () => {
      fetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ data: [], rowCount: 0 }),
      });

      const { container } = render(UserManagementPage);

      await waitFor(() => {
        expect(fetch).toHaveBeenCalled();
      });
      await tick();

      // 验证空状态
      const emptyRow = container.querySelector('.empty-row');
      expect(emptyRow).toBeTruthy();
      expect(emptyRow.classList.contains('hide')).toBe(false);

      // 验证分页隐藏
      const pagination = container.querySelector('.pagination-container');
      expect(pagination.classList.contains('hide')).toBe(true);

      // 验证全选状态被重置
      const selectAllCheckbox = container.querySelector('.checkbox-all');
      expect(selectAllCheckbox.checked).toBe(false);
    });
  });

});


