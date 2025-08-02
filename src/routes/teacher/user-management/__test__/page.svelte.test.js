import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, fireEvent, screen, waitFor } from '@testing-library/svelte';
import { tick } from 'svelte';
import UserManagement from '../+page.svelte';

// 模拟外部依赖
vi.mock('$app/navigation', () => ({
  goto: vi.fn()
}));

// 模拟 fetch
global.fetch = vi.fn();

describe('用户管理 - 用户列表获取', () => {
  let component;
  let mockFetch;
  let mockGoto;

  beforeEach(async () => {
    // 重置所有模拟
    vi.clearAllMocks();
    
    // 获取模拟函数引用
    mockFetch = global.fetch;
    const { goto } = await import('$app/navigation');
    mockGoto = goto;

    // 渲染组件
    component = render(UserManagement);
    
    // 等待组件初始化
    await tick();
  });

  afterEach(() => {
    component.unmount();
  });

  describe('fetchUsers 函数', () => {
    it('组件挂载时自动调用 fetchUsers', async () => {
      // 验证 fetch 被调用
      expect(mockFetch).toHaveBeenCalled();
      expect(mockFetch.mock.calls[0][0]).toContain('/api/user');
    });

    it('成功获取用户列表后更新状态', async () => {
      // 模拟 API 成功响应
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          data: [
            {
              ID: 1,
              Account: 'test_user',
              OfficialName: '测试用户',
              Gender: '男',
              MobilePhone: '13800138000',
              Email: 'test@example.com',
              Type: '02',
              Category: '普通用户',
              CreateTime: Date.now(),
              Status: '00',
              Domains: ['cst.school^teacher']
            }
          ],
          rowCount: 1
        })
      });

      // 触发 fetchUsers
      await component.component.fetchUsers();
      await tick();
      await waitFor(() => {
        // 验证状态更新
        expect(component.component.users.length).toBe(1);
        expect(component.component.users[0].account).toBe('test_user');
        expect(component.component.users[0].name).toBe('测试用户');
        expect(component.component.totalItems).toBe(1);
        expect(component.component.totalPages).toBe(1);
        expect(component.component.loading).toBe(false);
      });
    });

    it('处理空用户列表情况', async () => {
      // 模拟空数据响应
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          data: [],
          rowCount: 0
        })
      });

      // 触发 fetchUsers
      await component.component.fetchUsers();
      await tick();
      await waitFor(() => {
        // 验证状态更新
        expect(component.component.users).toEqual([]);
        expect(component.component.totalItems).toBe(0);
        expect(component.component.totalPages).toBe(0);
        expect(component.component.loading).toBe(false);
      });
    });

    it('处理 API 错误情况', async () => {
      // 模拟网络错误
      mockFetch.mockRejectedValueOnce(new Error('Network error'));

      // 触发 fetchUsers
      await component.component.fetchUsers();
      await tick();
      await waitFor(() => {
        // 验证错误状态
        expect(component.component.users).toEqual([]);
        expect(component.component.error).toBe('获取用户列表失败: Network error');
        expect(component.component.loading).toBe(false);
      });
    });

    it('构建正确的请求参数', async () => {
      // 设置筛选条件
      component.component.searchAccount = 'test';
      component.component.searchName = '用户';
      component.component.filterGender = '男';
      component.component.filterStatus = '00';
      component.component.filterCreateTime = new Date('2023-01-01');
      component.component.filterRole = 'cst.school^teacher';
      component.component.currentPage = 2;
      component.component.pageSize = 20;

      // 触发 fetchUsers
      await component.component.fetchUsers();
      await tick();

      // 验证请求参数
      const url = mockFetch.mock.calls[0][0];
      expect(url).toContain('page=2');
      expect(url).toContain('pageSize=20');
      expect(url).toContain('account=test');
      expect(url).toContain('officialName=用户');
      expect(url).toContain('gender=男');
      expect(url).toContain('status=00');
      expect(url).toContain('domain=cst.school%5Eteacher');
      expect(url).toContain('createTime=');
    });

    it('当筛选条件为"全部"时不包含在请求参数中', async () => {
      // 设置"全部"筛选条件
      component.component.filterGender = 'all';
      component.component.filterStatus = 'all';

      // 触发 fetchUsers
      await component.component.fetchUsers();
      await tick();

      // 验证请求参数
      const url = mockFetch.mock.calls[0][0];
      expect(url).not.toContain('gender=');
      expect(url).not.toContain('status=');
    });
  });

  describe('筛选功能交互', () => {
    it('账号搜索触发 fetchUsers', async () => {
      const accountInput = screen.getByPlaceholderText('请输入账号');
      await fireEvent.input(accountInput, { target: { value: 'test' } });
      
      // 使用 waitFor 等待防抖
      await waitFor(() => {
        expect(component.component.searchAccount).toBe('test');
        expect(mockFetch).toHaveBeenCalledTimes(2); // 初始调用 + 搜索调用
      }, { timeout: 500 });
    });

    it('角色筛选触发 fetchUsers', async () => {
      // 打开角色选择器
      const roleSelect = screen.getAllByText('请选择角色')[0];
      await fireEvent.click(roleSelect);
      
      // 选择"超级管理员"
      const option = screen.getByText('超级管理员');
      await fireEvent.click(option);
      
      // 验证状态更新和API调用
      await waitFor(() => {
        expect(component.component.filterRole).toBe('cst.school^superAdmin');
        expect(mockFetch).toHaveBeenCalledTimes(2); // 初始调用 + 筛选调用
      });
    });

    it('日期筛选触发 fetchUsers', async () => {
      // 模拟日期选择器事件
      const testDate = new Date(2023, 0, 1);
      component.component.handleStartDateSelected({ detail: { date: testDate } });
      
      // 验证状态更新和API调用
      await waitFor(() => {
        expect(component.component.filterCreateTime).toEqual(testDate);
        expect(mockFetch).toHaveBeenCalledTimes(2); // 初始调用 + 筛选调用
      });
    });
  });

  describe('UI 渲染', () => {
    it('正确渲染用户列表', async () => {
      // 模拟 API 响应
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          data: [
            {
              ID: 1,
              Account: 'test_user',
              OfficialName: '测试用户',
              Gender: '男',
              MobilePhone: '13800138000',
              Email: 'test@example.com',
              Type: '02',
              Category: '普通用户',
              CreateTime: Date.now(),
              Status: '00',
              Domains: ['cst.school^teacher']
            }
          ],
          rowCount: 1
        })
      });

      // 触发 fetchUsers
      await component.component.fetchUsers();
      
      // 等待渲染更新
      await waitFor(() => {
        // 验证表格内容
        expect(screen.getByText('test_user')).toBeInTheDocument();
        expect(screen.getByText('测试用户')).toBeInTheDocument();
        expect(screen.getByText('男')).toBeInTheDocument();
        expect(screen.getByText('13800138000')).toBeInTheDocument();
        expect(screen.getByText('test@example.com')).toBeInTheDocument();
        expect(screen.getByText('注册用户')).toBeInTheDocument();
        expect(screen.getByText('普通用户')).toBeInTheDocument();
        expect(screen.getByText('教师')).toBeInTheDocument();
        expect(screen.getByText('启用')).toBeInTheDocument();
      });
    });

    it('显示空状态', async () => {
      // 模拟空数据响应
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          data: [],
          rowCount: 0
        })
      });

      // 触发 fetchUsers
      await component.component.fetchUsers();
      
      // 等待渲染更新
      await waitFor(() => {
        expect(screen.getByText('暂无用户数据')).toBeInTheDocument();
        expect(screen.queryByRole('table')).not.toBeInTheDocument();
      });
    });

    it('显示加载状态', async () => {
      // 创建延迟解析的 promise
      let resolveFetch;
      const fetchPromise = new Promise((resolve) => {
        resolveFetch = resolve;
      });
      
      mockFetch.mockReturnValueOnce(fetchPromise);

      // 触发 fetchUsers
      component.component.fetchUsers();
      await tick();
      
      // 验证加载状态
      // 注意：实际实现中可能需要添加加载指示器才能测试
      expect(component.component.loading).toBe(true);
      
      // 解析 promise
      resolveFetch({
        ok: true,
        json: () => Promise.resolve({ data: [], rowCount: 0 })
      });
      
      await waitFor(() => {
        expect(component.component.loading).toBe(false);
      });
    });

    it('显示错误状态', async () => {
      // 模拟错误响应
      mockFetch.mockRejectedValueOnce(new Error('API error'));
      
      // 触发 fetchUsers
      await component.component.fetchUsers();
      
      // 等待渲染更新
      await waitFor(() => {
        // 注意：实际实现中需要显示错误信息才能测试
        expect(component.component.error).toBe('获取用户列表失败: API error');
      });
    });
  });
});