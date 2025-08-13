import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, fireEvent, waitFor } from '@testing-library/svelte';
import { tick } from 'svelte';
import UserManagementPage from '../+page.svelte';

// 只mock必要的外部依赖，不mock Svelte组件
vi.mock('$app/navigation', () => ({
  goto: vi.fn()
}));

vi.mock('$lib/components/Toast/Toast.js', () => ({
  toast: {
    error: vi.fn(),
    success: vi.fn(),
    warning: vi.fn(),
    info: vi.fn()
  }
}));

// Mock fetch
global.fetch = vi.fn();

describe('用户管理页面 - 搜索防抖功能测试', () => {
  // 模拟用户数据
  const mockUsers = [
    {
      ID: '1',
      Account: 'admin001',
      Domains: ['cst.school^superAdmin'],
      OfficialName: '张三',
      IDCardNo: '110101199001011234',
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
      Account: 'teacher002',
      Domains: ['cst.school^teacher'],
      OfficialName: '李四',
      IDCardNo: '110101199002022345',
      Gender: '女',
      MobilePhone: '13800138001',
      Email: 'lisi@example.com',
      Type: '02',
      Category: 'normal',
      CreateTime: '2023-01-02T08:00:00Z',
      Status: '02'
    },
    {
      ID: '3',
      Account: 'student003',
      Domains: ['cst.school^student'],
      OfficialName: '王五',
      IDCardNo: '110101199003033456',
      Gender: '男',
      MobilePhone: '13800138002',
      Email: 'wangwu@example.com',
      Type: '02',
      Category: 'normal',
      CreateTime: '2023-01-03T08:00:00Z',
      Status: '00'
    }
  ];

  const mockApiResponse = {
    status: 0,
    data: mockUsers,
    rowCount: mockUsers.length,
    msg: 'success'
  };

  // 辅助函数：解码URL参数
  function decodeUrlParams(url) {
    const urlObj = new URL(url, 'http://localhost');
    const params = {};
    urlObj.searchParams.forEach((value, key) => {
      params[key] = decodeURIComponent(value);
    });
    return params;
  }

  // 辅助函数：检查URL是否包含指定的参数值
  function urlContainsParam(url, paramName, expectedValue) {
    try {
      const params = decodeUrlParams(url);
      return params[paramName] === expectedValue;
    } catch (error) {
      return false;
    }
  }

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

  describe('搜索输入框识别和基础功能', () => {
    it('应该能够找到搜索输入框', async () => {
      const { container } = render(UserManagementPage);
      
      // 等待组件初始化完成
      await waitFor(() => {
        expect(fetch).toHaveBeenCalledTimes(1);
      });
      await tick();
      
      // 查找搜索输入框 - 根据placeholder文本定位
      const searchInput = container.querySelector('input[placeholder*="姓名"]') || 
                         container.querySelector('input[placeholder*="账号"]') ||
                         container.querySelector('input[placeholder*="手机号"]') ||
                         container.querySelector('input[placeholder*="邮箱"]');
      
      expect(searchInput).toBeTruthy();
      expect(searchInput?.type).toBe('text');
    });

    it('搜索输入框应该有正确的placeholder文本', async () => {
      const { container } = render(UserManagementPage);
      
      await waitFor(() => {
        expect(fetch).toHaveBeenCalledTimes(1);
      });
      await tick();
      
      const searchInput = container.querySelector('input[type="text"]');
      expect(searchInput).toBeTruthy();
      
      if (searchInput) {
        const placeholder = searchInput.getAttribute('placeholder');
        expect(placeholder).toContain('姓名');
        expect(placeholder).toContain('账号');
        expect(placeholder).toContain('手机号');
        expect(placeholder).toContain('邮箱');
      }
    });

    it('搜索输入框初始值应该为空', async () => {
      const { container } = render(UserManagementPage);
      
      await waitFor(() => {
        expect(fetch).toHaveBeenCalledTimes(1);
      });
      await tick();
      
      const searchInput = container.querySelector('input[type="text"]');
      expect(searchInput?.value).toBe('');
    });
  });

  describe('搜索防抖基础功能测试', () => {
    it('应该在搜索输入时触发API请求', async () => {
      const { container } = render(UserManagementPage);
      
      // 等待初始加载完成
      await waitFor(() => {
        expect(fetch).toHaveBeenCalledTimes(1);
      });
      
      // 清除初始请求的记录
      vi.clearAllMocks();
      
      const searchInput = container.querySelector('input[type="text"]');
      expect(searchInput).toBeTruthy();
      
      if (searchInput) {
        // 模拟用户输入
        await fireEvent.input(searchInput, { target: { value: '张三' } });
        await tick();
        
        // 等待防抖完成和API调用
        await waitFor(() => {
          expect(fetch).toHaveBeenCalled();
        }, { timeout: 1000 });
        
        // 验证API请求包含搜索参数
        const lastCall = fetch.mock.calls[fetch.mock.calls.length - 1];
        const url = lastCall[0];
        
        // 使用辅助函数检查参数
        expect(urlContainsParam(url, 'fuzzyCondition', '张三')).toBe(true);
      }
    });

    it('应该在搜索时重置页码为1', async () => {
      const { container } = render(UserManagementPage);
      
      await waitFor(() => {
        expect(fetch).toHaveBeenCalledTimes(1);
      });
      
      vi.clearAllMocks();
      
      const searchInput = container.querySelector('input[type="text"]');
      
      if (searchInput) {
        await fireEvent.input(searchInput, { target: { value: '李四' } });
        await tick();
        
        await waitFor(() => {
          expect(fetch).toHaveBeenCalled();
        });
        
        // 验证页码被重置为1
        const lastCall = fetch.mock.calls[fetch.mock.calls.length - 1];
        const url = lastCall[0];
        expect(urlContainsParam(url, 'page', '1')).toBe(true);
      }
    });

    it('应该在搜索时清除用户选中状态', async () => {
      const { container } = render(UserManagementPage);
      
      await waitFor(() => {
        expect(fetch).toHaveBeenCalledTimes(1);
      });
      await tick();
      
      // 先选中一些用户
      const selectAllCheckbox = container.querySelector('input[type="checkbox"].checkbox-all');
      if (selectAllCheckbox) {
        await fireEvent.click(selectAllCheckbox);
        await tick();
        expect(selectAllCheckbox.checked).toBe(true);
      }
      
      vi.clearAllMocks();
      
      // 执行搜索
      const searchInput = container.querySelector('input[type="text"]');
      if (searchInput) {
        await fireEvent.input(searchInput, { target: { value: '搜索测试' } });
        await tick();
        
        await waitFor(() => {
          expect(fetch).toHaveBeenCalled();
        });
        
        // 验证选中状态被清除
        expect(selectAllCheckbox?.checked).toBe(false);
        
        // 验证所有单项选择也被清除
        const itemCheckboxes = container.querySelectorAll('input[type="checkbox"].checkbox-item');
        itemCheckboxes.forEach(checkbox => {
          expect(checkbox.checked).toBe(false);
        });
      }
    });
  });

  describe('防抖延迟机制测试', () => {
    it('应该在快速连续输入时只发送最后一次请求', async () => {
      const { container } = render(UserManagementPage);
      
      await waitFor(() => {
        expect(fetch).toHaveBeenCalledTimes(1);
      });
      
      vi.clearAllMocks();
      
      const searchInput = container.querySelector('input[type="text"]');
      
      if (searchInput) {
        // 快速连续输入，模拟用户打字
        await fireEvent.input(searchInput, { target: { value: 'a' } });
        await fireEvent.input(searchInput, { target: { value: 'ab' } });
        await fireEvent.input(searchInput, { target: { value: 'abc' } });
        await fireEvent.input(searchInput, { target: { value: 'admin' } });
        await tick();
        
        // 等待防抖延迟（400ms）完成
        await new Promise(resolve => setTimeout(resolve, 500));
        await tick();
        
        // 验证最终只有一次API请求，且使用最后的搜索值
        await waitFor(() => {
          expect(fetch).toHaveBeenCalledTimes(1);
        });
        
        const lastCall = fetch.mock.calls[0];
        const url = lastCall[0];
        expect(urlContainsParam(url, 'fuzzyCondition', 'admin')).toBe(true);
      }
    });

    it('应该在防抖期间新输入时重置计时器', async () => {
      const { container } = render(UserManagementPage);
      
      await waitFor(() => {
        expect(fetch).toHaveBeenCalledTimes(1);
      });
      
      vi.clearAllMocks();
      
      const searchInput = container.querySelector('input[type="text"]');
      
      if (searchInput) {
        // 第一次输入
        await fireEvent.input(searchInput, { target: { value: 'test1' } });
        await tick();
        
        // 等待200ms（少于防抖延迟400ms）
        await new Promise(resolve => setTimeout(resolve, 200));
        
        // 第二次输入，应该重置防抖计时器
        await fireEvent.input(searchInput, { target: { value: 'test2' } });
        await tick();
        
        // 再等待200ms（总共400ms，但防抖应该从第二次输入重新计时）
        await new Promise(resolve => setTimeout(resolve, 200));
        
        // 此时应该还没有发送请求
        expect(fetch).not.toHaveBeenCalled();
        
        // 再等待250ms，确保防抖完成
        await new Promise(resolve => setTimeout(resolve, 250));
        await tick();
        
        // 现在应该发送了请求，且使用最后的值
        await waitFor(() => {
          expect(fetch).toHaveBeenCalledTimes(1);
        });
        
        const lastCall = fetch.mock.calls[0];
        const url = lastCall[0];
        expect(urlContainsParam(url, 'fuzzyCondition', 'test2')).toBe(true);
      }
    });

    it('应该在输入停止后正确等待防抖延迟', async () => {
      const { container } = render(UserManagementPage);
      
      await waitFor(() => {
        expect(fetch).toHaveBeenCalledTimes(1);
      });
      
      vi.clearAllMocks();
      
      const searchInput = container.querySelector('input[type="text"]');
      
      if (searchInput) {
        const startTime = Date.now();
        
        // 输入搜索内容
        await fireEvent.input(searchInput, { target: { value: 'delay' } });
        await tick();
        
        // 等待防抖完成
        await waitFor(() => {
          expect(fetch).toHaveBeenCalled();
        }, { timeout: 1000 });
        
        const endTime = Date.now();
        const elapsedTime = endTime - startTime;
        
        // 验证防抖延迟大致正确（400ms左右，允许一些误差）
        expect(elapsedTime).toBeGreaterThan(350);
        expect(elapsedTime).toBeLessThan(600);
      }
    });
  });

  describe('搜索内容处理测试', () => {
    it('应该正确处理空字符串搜索', async () => {
      const { container } = render(UserManagementPage);
      
      await waitFor(() => {
        expect(fetch).toHaveBeenCalledTimes(1);
      });
      
      vi.clearAllMocks();
      
      const searchInput = container.querySelector('input[type="text"]');
      
      if (searchInput) {
        // 输入空字符串
        await fireEvent.input(searchInput, { target: { value: '' } });
        await tick();
        
        await waitFor(() => {
          expect(fetch).toHaveBeenCalled();
        });
        
        // 验证空搜索不包含fuzzyCondition参数
        const lastCall = fetch.mock.calls[fetch.mock.calls.length - 1];
        const url = lastCall[0];
        expect(url).not.toContain('fuzzyCondition');
      }
    });


    it('应该正确处理包含前后空白字符的搜索', async () => {
      const { container } = render(UserManagementPage);
      
      await waitFor(() => {
        expect(fetch).toHaveBeenCalledTimes(1);
      });
      
      vi.clearAllMocks();
      
      const searchInput = container.querySelector('input[type="text"]');
      
      if (searchInput) {
        // 输入包含前后空白字符的搜索内容
        await fireEvent.input(searchInput, { target: { value: '  张三  ' } });
        await tick();
        
        await waitFor(() => {
          expect(fetch).toHaveBeenCalled();
        });
        
        // 验证空白字符被正确trim处理
        const lastCall = fetch.mock.calls[fetch.mock.calls.length - 1];
        const url = lastCall[0];
        expect(urlContainsParam(url, 'fuzzyCondition', '张三')).toBe(true);
      }
    });

    it('应该正确处理特殊字符搜索', async () => {
      const { container } = render(UserManagementPage);
      
      await waitFor(() => {
        expect(fetch).toHaveBeenCalledTimes(1);
      });
      
      vi.clearAllMocks();
      
      const searchInput = container.querySelector('input[type="text"]');
      
      if (searchInput) {
        // 输入包含特殊字符的搜索内容
        const specialChars = '@test.com';
        await fireEvent.input(searchInput, { target: { value: specialChars } });
        await tick();
        
        await waitFor(() => {
          expect(fetch).toHaveBeenCalled();
        });
        
        // 验证特殊字符被正确处理
        const lastCall = fetch.mock.calls[fetch.mock.calls.length - 1];
        const url = lastCall[0];
        expect(urlContainsParam(url, 'fuzzyCondition', '@test.com')).toBe(true);
      }
    });

    it('应该正确处理中文字符搜索', async () => {
      const { container } = render(UserManagementPage);
      
      await waitFor(() => {
        expect(fetch).toHaveBeenCalledTimes(1);
      });
      
      vi.clearAllMocks();
      
      const searchInput = container.querySelector('input[type="text"]');
      
      if (searchInput) {
        // 输入中文字符
        await fireEvent.input(searchInput, { target: { value: '张三李四' } });
        await tick();
        
        await waitFor(() => {
          expect(fetch).toHaveBeenCalled();
        });
        
        // 验证中文字符被正确处理
        const lastCall = fetch.mock.calls[fetch.mock.calls.length - 1];
        const url = lastCall[0];
        expect(urlContainsParam(url, 'fuzzyCondition', '张三李四')).toBe(true);
      }
    });

    it('应该正确处理数字和字母混合搜索', async () => {
      const { container } = render(UserManagementPage);
      
      await waitFor(() => {
        expect(fetch).toHaveBeenCalledTimes(1);
      });
      
      vi.clearAllMocks();
      
      const searchInput = container.querySelector('input[type="text"]');
      
      if (searchInput) {
        // 输入数字和字母混合内容（如手机号、邮箱等）
        await fireEvent.input(searchInput, { target: { value: 'admin123' } });
        await tick();
        
        await waitFor(() => {
          expect(fetch).toHaveBeenCalled();
        });
        
        // 验证混合字符被正确处理
        const lastCall = fetch.mock.calls[fetch.mock.calls.length - 1];
        const url = lastCall[0];
        expect(urlContainsParam(url, 'fuzzyCondition', 'admin123')).toBe(true);
      }
    });
  });

  describe('搜索状态管理测试', () => {
    it('搜索前应该保持现有的选中状态', async () => {
      const { container } = render(UserManagementPage);
      
      await waitFor(() => {
        expect(fetch).toHaveBeenCalledTimes(1);
      });
      await tick();
      
      // 选中一些用户
      const firstCheckbox = container.querySelector('input[type="checkbox"].checkbox-item');
      if (firstCheckbox) {
        await fireEvent.click(firstCheckbox);
        await tick();
        expect(firstCheckbox.checked).toBe(true);
      }
      
      // 在搜索开始前，验证选中状态还存在
      const searchInput = container.querySelector('input[type="text"]');
      if (searchInput && firstCheckbox) {
        // 开始输入但还未触发搜索
        searchInput.value = 'test';
        expect(firstCheckbox.checked).toBe(true);
      }
    });

    it('搜索完成后应该清除所有选中状态', async () => {
      const { container } = render(UserManagementPage);
      
      await waitFor(() => {
        expect(fetch).toHaveBeenCalledTimes(1);
      });
      await tick();
      
      // 选中所有用户
      const selectAllCheckbox = container.querySelector('input[type="checkbox"].checkbox-all');
      if (selectAllCheckbox) {
        await fireEvent.click(selectAllCheckbox);
        await tick();
        
        // 验证选中状态
        const itemCheckboxes = container.querySelectorAll('input[type="checkbox"].checkbox-item');
        itemCheckboxes.forEach(checkbox => {
          expect(checkbox.checked).toBe(true);
        });
        expect(selectAllCheckbox.checked).toBe(true);
      }
      
      vi.clearAllMocks();
      
      // 执行搜索
      const searchInput = container.querySelector('input[type="text"]');
      if (searchInput) {
        await fireEvent.input(searchInput, { target: { value: 'clear' } });
        await tick();
        
        await waitFor(() => {
          expect(fetch).toHaveBeenCalled();
        });
        
        // 验证所有选中状态被清除
        expect(selectAllCheckbox?.checked).toBe(false);
        
        const itemCheckboxes = container.querySelectorAll('input[type="checkbox"].checkbox-item');
        itemCheckboxes.forEach(checkbox => {
          expect(checkbox.checked).toBe(false);
        });
      }
    });

    it('搜索时页码应该重置为1', async () => {
      const { container } = render(UserManagementPage);
      
      await waitFor(() => {
        expect(fetch).toHaveBeenCalledTimes(1);
      });
      
      vi.clearAllMocks();
      
      const searchInput = container.querySelector('input[type="text"]');
      
      if (searchInput) {
        // 多次搜索验证页码都重置为1
        await fireEvent.input(searchInput, { target: { value: 'first' } });
        await tick();
        
        await waitFor(() => {
          expect(fetch).toHaveBeenCalled();
        });
        
        let lastCall = fetch.mock.calls[fetch.mock.calls.length - 1];
        let url = lastCall[0];
        expect(urlContainsParam(url, 'page', '1')).toBe(true);
        
        vi.clearAllMocks();
        
        // 第二次搜索
        await fireEvent.input(searchInput, { target: { value: 'second' } });
        await tick();
        
        await waitFor(() => {
          expect(fetch).toHaveBeenCalled();
        });
        
        lastCall = fetch.mock.calls[fetch.mock.calls.length - 1];
        url = lastCall[0];
        expect(urlContainsParam(url, 'page', '1')).toBe(true);
      }
    });

    it('搜索应该保持其他筛选条件不变', async () => {
      const { container } = render(UserManagementPage);
      
      await waitFor(() => {
        expect(fetch).toHaveBeenCalledTimes(1);
      });
      
      // 先设置一些筛选条件（如果有下拉框的话）
      const selects = container.querySelectorAll('select');
      if (selects.length > 0) {
        const firstSelect = selects[0];
        await fireEvent.change(firstSelect, { target: { value: '02' } });
        await tick();
        
        await waitFor(() => {
          expect(fetch).toHaveBeenCalled();
        });
      }
      
      vi.clearAllMocks();
      
      // 执行搜索
      const searchInput = container.querySelector('input[type="text"]');
      if (searchInput) {
        await fireEvent.input(searchInput, { target: { value: 'filter' } });
        await tick();
        
        await waitFor(() => {
          expect(fetch).toHaveBeenCalled();
        });
        
        // 验证搜索参数和之前的筛选条件都存在
        const lastCall = fetch.mock.calls[fetch.mock.calls.length - 1];
        const url = lastCall[0];
        expect(urlContainsParam(url, 'fuzzyCondition', 'filter')).toBe(true);
        expect(urlContainsParam(url, 'page', '1')).toBe(true);
      }
    });
  });


});

