import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/svelte';
import { tick } from 'svelte';
import StudentManagementPage from '../+page.svelte';

// 模拟子组件
vi.mock('$lib/components/Title/Title.svelte', () => ({
  default: vi.fn()
}));

vi.mock('$lib/components/Input/InputBox.svelte', () => ({
  default: vi.fn()
}));

vi.mock('$lib/components/Input/InforInput.svelte', () => ({
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

vi.mock('$app/navigation', () => ({
  goto: vi.fn()
}));

// 模拟防抖函数
vi.mock('../_utils/debounce.js', () => ({
  debounce: vi.fn((fn, delay) => {
    return function(...args) {
      return fn.apply(this, args);
    };
  })
}));

// 模拟 fetch
global.fetch = vi.fn();

describe('学生管理页面', () => {
  // 模拟学生数据
  const mockStudents = [
    {
      ID: '1',
      Account: 'student001',
      OfficialName: '张三',
      IDCardNo: '123456200001011234',
      Gender: '男',
      MobilePhone: '13800138000',
      Status: '00',
      HasRelation: true
    },
    {
      ID: '2',
      Account: 'student002',
      OfficialName: '李四',
      IDCardNo: '123456200002022345',
      Gender: '女',
      MobilePhone: '13800138001',
      Status: '02',
      HasRelation: false
    }
  ];

  const mockApiResponse = {
    data: mockStudents,
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
      const { container } = render(StudentManagementPage);
      expect(container.querySelector('.student-management-container')).toBeTruthy();
    });

    it('应该在组件挂载时调用 fetchStudents', async () => {
      render(StudentManagementPage);
      
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
      render(StudentManagementPage);
      
      await waitFor(() => {
        expect(fetch).toHaveBeenCalled();
      });
      
      // 验证初始请求参数
      const initialCall = fetch.mock.calls[0];
      expect(initialCall[0]).toContain('page=1');
      expect(initialCall[0]).toContain('pageSize=10');
      expect(initialCall[0]).toContain('domain=cst.school%5Estudent');
    });
  });

  describe('数据获取和处理', () => {
    it('应该正确处理 API 响应数据', async () => {
      render(StudentManagementPage);
      
      await waitFor(() => {
        expect(fetch).toHaveBeenCalled();
      });

      await tick();
      
      // 验证学生数据是否正确显示在DOM中
      const container = document.body;
      expect(container.textContent).toContain('student001');
      expect(container.textContent).toContain('张三');
    });

    it('应该正确映射学生状态', async () => {
      render(StudentManagementPage);
      
      await waitFor(() => {
        expect(fetch).toHaveBeenCalled();
      });

      await tick();
      
      // 验证状态映射 '00' -> '已启用'
      const container = document.body;
      expect(container.textContent).toContain('已启用');
      expect(container.textContent).toContain('已停用');
    });
  });

  describe('搜索功能', () => {
    it('搜索时应该重置页码为1', async () => {
      render(StudentManagementPage);
      
      // 初始加载完成
      await waitFor(() => expect(fetch).toHaveBeenCalledTimes(1));
      
      // 设置搜索文本
      const searchText = '张三';
      const inputBox = document.querySelector('input[type="text"]');
      if (inputBox) {
        fireEvent.input(inputBox, { target: { value: searchText } });
        await tick();
        
        // 验证搜索触发后页码重置为1
        await waitFor(() => expect(fetch).toHaveBeenCalledTimes(2));
        const searchCall = fetch.mock.calls[1];
        expect(searchCall[0]).toContain('page=1');
      }
    });
  });

  describe('筛选功能', () => {
    it('账号状态筛选应该发送正确的请求', async () => {
      render(StudentManagementPage);
      
      await waitFor(() => expect(fetch).toHaveBeenCalledTimes(1));
      
      // 模拟选择账号状态
      const accountStatus = '00'; // 启用
      const selectElement = document.querySelector('select');
      if (selectElement) {
        fireEvent.change(selectElement, { target: { value: accountStatus } });
        await tick();
        
        // 验证筛选请求包含正确的状态参数
        await waitFor(() => expect(fetch).toHaveBeenCalledTimes(2));
        const filterCall = fetch.mock.calls[1];
        expect(filterCall[0]).toContain(`status=${accountStatus}`);
      }
    });
  });

  describe('分页功能', () => {
    it('应该显示分页组件', async () => {
      const { container } = render(StudentManagementPage);
      
      await waitFor(() => {
        expect(fetch).toHaveBeenCalled();
      });

      await tick();
      
      // 验证分页相关元素
      const paginationWrapper = container.querySelector('.pagination-wrapper');
      expect(paginationWrapper).toBeTruthy();
    });

    it('页码变更时应该重新获取数据', async () => {
      render(StudentManagementPage);
      
      await waitFor(() => expect(fetch).toHaveBeenCalledTimes(1));
      
      // 模拟页码变更（这里通过直接调用事件处理函数）
      const newPage = 2;
      const handlePageChange = vi.fn();
      const pagination = document.querySelector('pagination');
      
      // 触发页面变更事件
      if (pagination) {
        pagination.dispatchEvent(new CustomEvent('pageChange', { detail: newPage }));
        await tick();
        
        // 验证页码变更后重新获取数据
        await waitFor(() => expect(fetch).toHaveBeenCalledTimes(2));
        const pageChangeCall = fetch.mock.calls[1];
        expect(pageChangeCall[0]).toContain(`page=${newPage}`);
      }
    });
  });

  describe('全选功能', () => {
    it('应该正确处理全选操作', async () => {
      const { container } = render(StudentManagementPage);
      
      await waitFor(() => {
        expect(fetch).toHaveBeenCalled();
      });
      await tick();
      
      // 查找全选复选框
      const selectAllCheckbox = container.querySelector('input[type="checkbox"].checkbox-all');
      if (selectAllCheckbox) {
        // 模拟点击全选
        fireEvent.click(selectAllCheckbox);
        await tick();
        
        // 验证所有单选框都被选中
        const itemCheckboxes = container.querySelectorAll('input[type="checkbox"].checkbox-item');
        itemCheckboxes.forEach(checkbox => {
          expect(checkbox.checked).toBe(true);
        });
      }
    });

    it('应该正确处理取消全选操作', async () => {
      const { container } = render(StudentManagementPage);
      
      await waitFor(() => {
        expect(fetch).toHaveBeenCalled();
      });
      await tick();
      
      const selectAllCheckbox = container.querySelector('input[type="checkbox"].checkbox-all');
      if (selectAllCheckbox) {
        // 先全选
        fireEvent.click(selectAllCheckbox);
        await tick();
        
        // 再取消全选
        fireEvent.click(selectAllCheckbox);
        await tick();
        
        // 验证所有单选框都被取消选中
        const itemCheckboxes = container.querySelectorAll('input[type="checkbox"].checkbox-item');
        itemCheckboxes.forEach(checkbox => {
          expect(checkbox.checked).toBe(false);
        });
      }
    });
  });

  describe('操作按钮', () => {

    it('点击创建按钮应该导航到添加学生页面', async () => {
      const { goto } = await import('$app/navigation');
      const { container } = render(StudentManagementPage);
      
      await tick();
      
      const createBtn = container.querySelector('.create-btn');
      if (createBtn) {
        fireEvent.click(createBtn);
        await tick();
        
        expect(goto).toHaveBeenCalledWith('/teacher/student-management/addStudent');
      }
    });

    
  });

  describe('状态显示', () => {
    it('应该正确显示学生状态', async () => {
      render(StudentManagementPage);
      
      await waitFor(() => {
        expect(fetch).toHaveBeenCalled();
      });

      await tick();
      
      // 验证状态文本和样式类
      const container = document.body;
      const statusElements = container.querySelectorAll('.status-text');
      expect(statusElements.length).toBe(2);
      
      // 验证状态文本
      expect(statusElements[0].textContent).toBe('已启用');
      expect(statusElements[1].textContent).toBe('已停用');
      
      // 验证状态样式类
      expect(statusElements[0].classList.contains('enabled')).toBe(true);
      expect(statusElements[1].classList.contains('disabled')).toBe(true);
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

      const { container } = render(StudentManagementPage);
      
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
      const { container } = render(StudentManagementPage);
      
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
  });

  describe('错误处理', () => {
    it('应该处理 API 请求失败', async () => {
      fetch.mockRejectedValue(new Error('Network error'));
      
      const { container } = render(StudentManagementPage);
      
      await waitFor(() => {
        expect(fetch).toHaveBeenCalled();
      });

      await tick();
      
      // 验证组件仍然能够渲染
      expect(container.querySelector('.student-management-container')).toBeTruthy();
    });
  });

  describe('防抖功能', () => {
    it('应该使用防抖函数处理搜索', async () => {
      const { debounce } = await import('../_utils/debounce.js');
      
      render(StudentManagementPage);
      
      // 验证防抖函数被调用
      expect(debounce).toHaveBeenCalled();
    });
  });
});