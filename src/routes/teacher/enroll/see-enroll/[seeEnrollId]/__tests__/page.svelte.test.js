import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, waitFor, within } from '@testing-library/svelte';
import EnrollManagement from '../+page.svelte';
import Empty from '$lib/components/Table/Empty.svelte';
import { goto } from '$app/navigation';
import { page } from '$app/stores';
import { onMount } from 'svelte';
import { toast } from '$lib/components/Toast/Toast';
import { checkFileData } from '../../../_utils/handleFileInput';

// 模拟导航函数
vi.mock('$app/navigation', () => ({
  goto: vi.fn(),
}));

// 模拟 page store
vi.mock('$app/stores', () => ({
  page: {
    subscribe: vi.fn((callback) => {
      callback({
        url: new URL('http://localhost/teacher/enroll/see-enroll/1'),
        params: { seeEnrollId: '1' },
      });
      return () => {}; // unsubscribe function
    }),
  },
}));

// 模拟 fetch
global.fetch = vi.fn();

// 模拟 console
global.console.log = vi.fn();
global.console.error = vi.fn();

// 模拟 localStorage
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
};
global.localStorage = localStorageMock;

// 模拟 toast
vi.mock('$lib/components/Toast/Toast', () => ({
  toast: {
    error: vi.fn(),
    warning: vi.fn(),
    success: vi.fn(),
  },
}));

// 在文件顶部添加 checkFileData 的模拟
vi.mock('../../../_utils/handleFileInput', () => ({
  checkFileData: vi.fn(),
  formatDateTime: vi.fn(),
}));

describe('EnrollManagement', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    // 模拟成功的API响应 - 匹配正确的URL
    global.fetch.mockImplementation((url) => {
      if (url.includes('/api/registration')) {
        return Promise.resolve({
          ok: true,
          json: () =>
            Promise.resolve({
              data: {
                student: [
                  {
                    student: {
                      ID: '1',
                      OfficialName: '张三',
                      MobilePhone: '13800138000',
                      Email: 'zhangsan@example.com',
                      Gender: '男',
                      IDCardNo: '110101199001011234',
                      IDCardType: '身份证',
                    },
                    detail: {
                      RegisterTime: '2024-01-01T10:00:00Z',
                      Type: '00',
                      ExamType: '00',
                      Status: '02',
                    },
                    reviewer: '李老师',
                  },
                  {
                    student: {
                      ID: '2',
                      OfficialName: '李四',
                      MobilePhone: '13900139000',
                      Email: 'lisi@example.com',
                      Gender: '女',
                      IDCardNo: '110101199002021234',
                      IDCardType: '身份证',
                    },
                    detail: {
                      RegisterTime: '2024-01-02T10:00:00Z',
                      Type: '02',
                      ExamType: '02',
                      Status: '02',
                    },
                    reviewer: '王老师',
                  },
                  {
                    student: {
                      ID: '3',
                      OfficialName: '王五',
                      MobilePhone: '13700137000',
                      Email: 'wangwu@example.com',
                      Gender: '男',
                      IDCardNo: '110101199003031234',
                      IDCardType: '身份证',
                    },
                    detail: {
                      RegisterTime: '2024-01-03T10:00:00Z',
                      Type: '00',
                      ExamType: '00',
                      Status: '02',
                    },
                    reviewer: '赵老师',
                  },
                ],
                total: 3,
              },
            }),
        });
      }
      return Promise.reject(new Error('Unmocked URL: ' + url));
    });

    // 模拟localStorage数据
    localStorageMock.getItem.mockReturnValue(
      JSON.stringify({
        statusText: '报名中',
      }),
    );
  });

  describe('基础渲染测试', () => {
    it('渲染页面标题', () => {
      render(EnrollManagement);
      expect(screen.getByText('报名列表')).toBeInTheDocument();
    });

    it('数据加载测试', async () => {
      render(EnrollManagement);

      // 等待数据加载
      await waitFor(
        () => {
          expect(screen.getByText('张三')).toBeInTheDocument();
        },
        { timeout: 5000 },
      );

      // 验证表格数据
      expect(screen.getByText('李四')).toBeInTheDocument();
      expect(screen.getByText('王五')).toBeInTheDocument();
    });

    it('调试测试 - 检查fetch调用', async () => {
      render(EnrollManagement);

      // 等待一段时间让组件初始化
      await new Promise((resolve) => setTimeout(resolve, 100));

      // 检查fetch是否被调用
      expect(global.fetch).toHaveBeenCalled();

      // 打印fetch调用的参数
      console.log('Fetch calls:', global.fetch.mock.calls);

      // 等待数据加载
      await waitFor(
        () => {
          expect(screen.getByText('张三')).toBeInTheDocument();
        },
        { timeout: 5000 },
      );
    });

    it('渲染搜索框', () => {
      render(EnrollManagement);
      expect(screen.getByLabelText('查找人员')).toBeInTheDocument();
    });

    it('渲染表格头部', () => {
      render(EnrollManagement);

      expect(screen.getAllByRole('columnheader', { name: '姓名' }).length).toBeGreaterThan(0);
      expect(screen.getAllByRole('columnheader', { name: '性别' }).length).toBeGreaterThan(0);
      expect(screen.getAllByRole('columnheader', { name: '出生日期' }).length).toBeGreaterThan(0);
      expect(screen.getAllByRole('columnheader', { name: '电话' }).length).toBeGreaterThan(0);
      expect(screen.getAllByRole('columnheader', { name: '证件类型' }).length).toBeGreaterThan(0);
      expect(screen.getAllByRole('columnheader', { name: '证件号' }).length).toBeGreaterThan(0);
    });

    it('渲染操作按钮', () => {
      render(EnrollManagement);

      expect(screen.getByText('导入')).toBeInTheDocument();
      expect(screen.getByText('下载模板')).toBeInTheDocument();
      expect(screen.getByText('批量移动')).toBeInTheDocument();
      expect(screen.getByText('批量通过')).toBeInTheDocument();
      expect(screen.getByText('批量不通过')).toBeInTheDocument();
    });

    it('渲染筛选下拉框', () => {
      render(EnrollManagement);

      expect(screen.getAllByText('审核状态').length).toBe(2);
      expect(screen.getAllByText('报名方式').length).toBe(2);
    });
  });

  describe('数据展示测试', () => {
    it('显示报名数据', async () => {
      render(EnrollManagement);

      await waitFor(() => {
        expect(screen.getByText('张三')).toBeInTheDocument();
        expect(screen.getByText('李四')).toBeInTheDocument();
        expect(screen.getByText('王五')).toBeInTheDocument();
        expect(screen.getByText('13800138000')).toBeInTheDocument();
        expect(screen.getByText('13900139000')).toBeInTheDocument();
        expect(screen.getByText('13700137000')).toBeInTheDocument();
      });
    });

    it('显示审核状态标签', async () => {
      render(EnrollManagement);

      await waitFor(() => {
        expect(screen.getByText('待审核')).toBeInTheDocument();
        expect(screen.getByText('通过')).toBeInTheDocument();
        expect(screen.getByText('不通过')).toBeInTheDocument();
      });
    });

    it('显示报名方式', async () => {
      render(EnrollManagement);

      await waitFor(() => {
        expect(screen.getByText('自报名')).toBeInTheDocument();
        expect(screen.getByText('人工导入')).toBeInTheDocument();
      });
    });

    it('显示考试类型', async () => {
      render(EnrollManagement);

      await waitFor(() => {
        expect(screen.getAllByText('正考').length).toBe(2);
        expect(screen.getAllByText('补考').length).toBe(1);
      });
    });

    it('显示审核人信息', async () => {
      render(EnrollManagement);

      await waitFor(() => {
        expect(screen.getByText('李老师')).toBeInTheDocument();
        expect(screen.getByText('王老师')).toBeInTheDocument();
        expect(screen.getByText('赵老师')).toBeInTheDocument();
      });
    });
  });

  describe('搜索和筛选功能测试', () => {
    it('处理搜索功能', async () => {
      render(EnrollManagement);

      const searchInput = screen.getByLabelText('查找人员');
      await fireEvent.input(searchInput, { target: { value: '张三' } });

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith(expect.stringContaining('/api/registration?'), expect.any(Object));
      });
    });

    it('清空搜索内容', async () => {
      render(EnrollManagement);

      const searchInput = screen.getByLabelText('查找人员');

      // 先输入内容
      await fireEvent.input(searchInput, { target: { value: '张三' } });

      // 再清空内容
      await fireEvent.input(searchInput, { target: { value: '' } });

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith(expect.stringContaining('message='), expect.any(Object));
      });
    });

    it('搜索框占位符文本', () => {
      render(EnrollManagement);

      const searchInput = screen.getByLabelText('查找人员');
      expect(searchInput).toHaveAttribute('placeholder', '请输入关键词');
    });
  });

  describe('表格功能测试', () => {
    it('验证表格数据格式', async () => {
      render(EnrollManagement);

      await waitFor(() => {
        // 验证表格行数据
        const tableRows = screen.getAllByRole('row');
        expect(tableRows.length).toBeGreaterThan(1); // 至少包含表头和一行数据

        // 验证数据单元格
        expect(screen.getByText('张三')).toBeInTheDocument();
        expect(screen.getByText('110101199001011234')).toBeInTheDocument();
      });
    });
  });

  describe('选择功能测试', () => {
    it('全选checkbox存在', async () => {
      render(EnrollManagement);

      await waitFor(() => {
        const selectAllCheckbox = screen.getByRole('checkbox');
        expect(selectAllCheckbox).toBeInTheDocument();
      });
    });

    it('行选择checkbox存在', async () => {
      render(EnrollManagement);

      await waitFor(() => {
        const rowCheckboxes = screen.getAllByRole('checkbox').slice(1); // 排除全选checkbox
        expect(rowCheckboxes.length).toBeGreaterThan(0);
      });
    });

    it('全选功能', async () => {
      render(EnrollManagement);

      await waitFor(() => {
        const selectAllCheckbox = screen.getByRole('checkbox');
        const rowCheckboxes = screen.getAllByRole('checkbox').slice(1);

        // 点击全选
        fireEvent.click(selectAllCheckbox);

        // 验证所有行都被选中
        rowCheckboxes.forEach((checkbox) => {
          expect(checkbox).toBeChecked();
        });
      });
    });

    it('取消全选功能', async () => {
      render(EnrollManagement);

      await waitFor(() => {
        const selectAllCheckbox = screen.getByRole('checkbox');
        const rowCheckboxes = screen.getAllByRole('checkbox').slice(1);

        // 先全选
        fireEvent.click(selectAllCheckbox);

        // 再取消全选
        fireEvent.click(selectAllCheckbox);

        // 验证所有行都被取消选中
        rowCheckboxes.forEach((checkbox) => {
          expect(checkbox).not.toBeChecked();
        });
      });
    });
  });

  describe('操作按钮测试', () => {
    it('单个通过按钮', async () => {
      render(EnrollManagement);

      await waitFor(() => {
        // 等待表格数据加载完成
        expect(screen.getByText('张三')).toBeInTheDocument();

        // 使用getAllByTestId查找所有通过按钮，然后选择第一个
        const approveButtons = screen.getAllByTestId('approve-btn');
        expect(approveButtons.length).toBeGreaterThan(0);
        expect(approveButtons[0]).toBeInTheDocument();
      });
    });

    it('单个不通过按钮', async () => {
      render(EnrollManagement);

      await waitFor(() => {
        // 等待表格数据加载完成
        expect(screen.getByText('张三')).toBeInTheDocument();

        const rejectButtons = screen.getAllByText('不通过');
        expect(rejectButtons.length).toBeGreaterThan(0);
      });
    });

    it('撤销通过按钮', async () => {
      // 模拟包含通过状态学生的API响应
      global.fetch.mockImplementation((url) => {
        if (url.includes('/api/registration')) {
          return Promise.resolve({
            ok: true,
            json: () =>
              Promise.resolve({
                data: {
                  student: [
                    {
                      student: {
                        ID: '1',
                        OfficialName: '张三',
                        MobilePhone: '13800138000',
                        Email: 'zhangsan@example.com',
                        Gender: '男',
                        IDCardNo: '110101199001011234',
                        IDCardType: '身份证',
                      },
                      detail: {
                        RegisterTime: '2024-01-01T10:00:00Z',
                        Type: '00',
                        ExamType: '00',
                        Status: '04', // 通过状态
                      },
                      reviewer: '李老师',
                    },
                    {
                      student: {
                        ID: '2',
                        OfficialName: '李四',
                        MobilePhone: '13900139000',
                        Email: 'lisi@example.com',
                        Gender: '女',
                        IDCardNo: '110101199002021234',
                        IDCardType: '身份证',
                      },
                      detail: {
                        RegisterTime: '2024-01-02T10:00:00Z',
                        Type: '02',
                        ExamType: '02',
                        Status: '02', // 待审核状态
                      },
                      reviewer: '王老师',
                    },
                  ],
                  total: 2,
                },
              }),
          });
        }
        return Promise.reject(new Error('Unmocked URL: ' + url));
      });

      render(EnrollManagement);

      await waitFor(() => {
        // 等待表格数据加载完成
        expect(screen.getByText('张三')).toBeInTheDocument();

        // 现在应该能找到撤销通过按钮
        const revokeButtons = screen.getAllByText('撤销通过');
        expect(revokeButtons.length).toBeGreaterThan(0);
        expect(revokeButtons[0]).toBeInTheDocument();
      });
    });

    it('撤销不通过按钮', async () => {
      // 模拟包含不通过状态学生的API响应
      global.fetch.mockImplementation((url) => {
        if (url.includes('/api/registration')) {
          return Promise.resolve({
            ok: true,
            json: () =>
              Promise.resolve({
                data: {
                  student: [
                    {
                      student: {
                        ID: '1',
                        OfficialName: '张三',
                        MobilePhone: '13800138000',
                        Email: 'zhangsan@example.com',
                        Gender: '男',
                        IDCardNo: '110101199001011234',
                        IDCardType: '身份证',
                      },
                      detail: {
                        RegisterTime: '2024-01-01T10:00:00Z',
                        Type: '00',
                        ExamType: '00',
                        Status: '06', // 不通过状态
                      },
                      reviewer: '李老师',
                    },
                    {
                      student: {
                        ID: '2',
                        OfficialName: '李四',
                        MobilePhone: '13900139000',
                        Email: 'lisi@example.com',
                        Gender: '女',
                        IDCardNo: '110101199002021234',
                        IDCardType: '身份证',
                      },
                      detail: {
                        RegisterTime: '2024-01-02T10:00:00Z',
                        Type: '02',
                        ExamType: '02',
                        Status: '02', // 待审核状态
                      },
                      reviewer: '王老师',
                    },
                  ],
                  total: 2,
                },
              }),
          });
        }
        return Promise.reject(new Error('Unmocked URL: ' + url));
      });

      render(EnrollManagement);

      await waitFor(() => {
        // 等待表格数据加载完成
        expect(screen.getByText('张三')).toBeInTheDocument();

        // 现在应该能找到撤销不通过按钮
        const revokeButtons = screen.getAllByText('撤销不通过');
        expect(revokeButtons.length).toBeGreaterThan(0);
        expect(revokeButtons[0]).toBeInTheDocument();
      });
    });

    it('查看详情按钮', async () => {
      render(EnrollManagement);

      await waitFor(() => {
        // 等待表格数据加载完成
        expect(screen.getByText('张三')).toBeInTheDocument();

        const detailButtons = screen.getAllByText('查看详情');
        expect(detailButtons.length).toBeGreaterThan(0);
      });
    });

    it('批量操作按钮', async () => {
      render(EnrollManagement);

      await waitFor(() => {
        const batchApproveButton = screen.getByText('批量通过');
        const batchRejectButton = screen.getByText('批量不通过');

        expect(batchApproveButton).toBeInTheDocument();
        expect(batchRejectButton).toBeInTheDocument();
      });
    });
  });

  describe('交互功能测试', () => {
    it('单个通过操作', async () => {
      render(EnrollManagement);

      await waitFor(() => {
        // 等待表格数据加载完成
        expect(screen.getByText('张三')).toBeInTheDocument();

        // 使用getAllByTestId查找所有通过按钮，然后选择第一个
        const approveButtons = screen.getAllByTestId('approve-btn');
        expect(approveButtons.length).toBeGreaterThan(0);
        expect(approveButtons[0]).toBeInTheDocument();

        fireEvent.click(approveButtons[0]);

        // 验证确认对话框
        expect(screen.getByText('确认通过')).toBeInTheDocument();
        expect(screen.getByText('通过后，该名人员将被录用，确定要继续吗？')).toBeInTheDocument();
      });
    });

    it('单个不通过操作', async () => {
      render(EnrollManagement);

      await waitFor(() => {
        // 等待表格数据加载完成
        expect(screen.getByText('张三')).toBeInTheDocument();

        // 查找不通过按钮（在待审核状态的行中）
        const rejectButtons = screen.getAllByTestId('reject-btn');
        expect(rejectButtons.length).toBeGreaterThan(0);

        fireEvent.click(rejectButtons[0]);

        // 验证不通过理由输入框
        expect(screen.getByText('请输入不通过理由')).toBeInTheDocument();
      });
    });

    it('查看详情操作', async () => {
      render(EnrollManagement);

      await waitFor(() => {
        // 等待表格数据加载完成
        expect(screen.getByText('张三')).toBeInTheDocument();

        const detailButtons = screen.getAllByText('查看详情');
        const firstDetailButton = detailButtons[0];

        fireEvent.click(firstDetailButton);

        // 验证导航调用
        expect(goto).toHaveBeenCalledWith(expect.stringContaining('/person-detail/'));
      });
    });

    it('批量通过操作', async () => {
      render(EnrollManagement);

      // 等待表格数据加载完成
      await waitFor(
        () => {
          expect(screen.getByText('张三')).toBeInTheDocument();
        },
        { timeout: 10000 },
      );

      // 等待批量通过按钮出现
      const batchApproveButton = await waitFor(() => {
        return screen.getByRole('button', { name: '批量通过' });
      });

      // 等待checkbox出现
      const rowCheckboxes = await waitFor(() => {
        const checkboxes = screen.getAllByRole('checkbox');
        expect(checkboxes.length).toBeGreaterThan(1); // 至少应该有全选checkbox + 数据行checkbox
        return checkboxes.slice(1); // 排除全选checkbox
      });

      // 选择前两个checkbox
      fireEvent.click(rowCheckboxes[0]);
      fireEvent.click(rowCheckboxes[1]);

      // 点击批量通过
      fireEvent.click(batchApproveButton);

      // 等待确认对话框出现
      await waitFor(() => {
        expect(screen.getByText('确认通过')).toBeInTheDocument();
      });
    });

    it('批量不通过操作', async () => {
      render(EnrollManagement);

      await waitFor(() => {
        // 等待表格数据加载完成
        expect(screen.getByText('张三')).toBeInTheDocument();
      });

      const batchRejectButton = screen.getByText('批量不通过');
      const rowCheckboxes = screen.getAllByRole('checkbox').slice(1);

      // 选择第一个checkbox
      fireEvent.click(rowCheckboxes[0]);

      // 点击批量不通过
      fireEvent.click(batchRejectButton);

      // 等待不通过理由输入框出现
      await waitFor(() => {
        expect(screen.getByText('请输入不通过理由')).toBeInTheDocument();
      });
    });
  });

  describe('错误处理测试', () => {
    beforeEach(() => {
      // 清除 fetch 的调用记录
      global.fetch.mockClear();
    });

    it('getEnrollPersonData API错误处理', async () => {
      // 模拟API响应错误（response.ok为false）
      global.fetch.mockImplementation((url) => {
        if (url.includes('/api/registration')) {
          return Promise.resolve({
            ok: false,
            json: () =>
              Promise.resolve({
                data: {
                  student: [],
                  total: 0,
                },
              }),
          });
        }
        return Promise.reject(new Error('Unmocked URL: ' + url));
      });

      render(EnrollManagement);

      // 等待toast调用
      await waitFor(() => {
        expect(toast.error).toHaveBeenCalledWith('网络错误');
      });
    });

    it('handleApproveOrReject API错误处理', async () => {
      // 模拟API响应错误（response.ok为false）
      global.fetch.mockImplementation((url) => {
        if (url.includes('/api/registrationStudent')) {
          return Promise.resolve({
            ok: false,
            status: 500,
            // 不要提供json方法，或者让它抛出错误
          });
        }
        return Promise.reject(new Error('Unmocked URL: ' + url));
      });

      render(EnrollManagement);

      // 等待toast调用
      await waitFor(() => {
        expect(toast.error).toHaveBeenCalledWith('网络错误');
      });
    });
  });

  describe('handleApproveOrReject 函数测试', () => {
    beforeEach(() => {
      vi.clearAllMocks();

      // 重置全局状态
      global.fetch.mockClear();

      // 模拟成功的API响应
      global.fetch.mockImplementation((url) => {
        if (url.includes('/api/registrationStudent')) {
          return Promise.resolve({
            ok: true,
            json: () =>
              Promise.resolve({
                status: 0,
                msg: '操作成功',
              }),
          });
        }
        if (url.includes('/api/registration')) {
          return Promise.resolve({
            ok: true,
            json: () =>
              Promise.resolve({
                data: {
                  student: [
                    {
                      student: {
                        ID: '1',
                        OfficialName: '张三',
                        MobilePhone: '13800138000',
                        Email: 'zhangsan@example.com',
                        Gender: '男',
                        IDCardNo: '110101199001011234',
                        IDCardType: '身份证',
                      },
                      detail: {
                        RegisterTime: '2024-01-01T10:00:00Z',
                        Type: '00',
                        ExamType: '00',
                        Status: '02',
                      },
                      reviewer: '李老师',
                    },
                  ],
                  total: 1,
                },
              }),
          });
        }
        return Promise.reject(new Error('Unmocked URL: ' + url));
      });
    });

    it('应该通过点击通过按钮触发审核函数', async () => {
      render(EnrollManagement);

      // 等待数据加载
      await waitFor(() => {
        expect(screen.getByText('张三')).toBeInTheDocument();
      });

      // 查找并点击通过按钮
      const approveButton = screen.getByTestId('approve-btn');
      fireEvent.click(approveButton);

      // 等待确认对话框出现
      await waitFor(() => {
        expect(screen.getByText('确认通过')).toBeInTheDocument();
      });

      // 点击确认按钮 - 使用正确的文本"确定"
      const confirmButton = screen.getByText('确定');
      fireEvent.click(confirmButton);

      // 验证API调用
      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith(
          expect.stringContaining('/api/registrationStudent'),
          expect.objectContaining({
            method: 'PATCH',
            headers: {
              'Content-Type': 'application/json',
            },
          }),
        );
      });

      // 验证成功提示
      expect(toast.success).toHaveBeenCalledWith('审核成功');
    });

    it('应该通过点击不通过按钮触发审核函数', async () => {
      render(EnrollManagement);

      // 等待数据加载
      await waitFor(() => {
        expect(screen.getByText('张三')).toBeInTheDocument();
      });

      // 查找并点击不通过按钮
      const rejectButton = screen.getByTestId('reject-btn');
      fireEvent.click(rejectButton);

      // 等待不通过理由输入框出现
      await waitFor(() => {
        expect(screen.getByText('请输入不通过理由')).toBeInTheDocument();
      });

      // 输入不通过理由
      const reasonInput = screen.getByPlaceholderText('请输入理由');
      fireEvent.input(reasonInput, { target: { value: '不符合要求' } });

      // 点击确认按钮
      const confirmButton = screen.getByText('确定');
      fireEvent.click(confirmButton);

      // 验证API调用
      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith(
          expect.stringContaining('/api/registrationStudent'),
          expect.objectContaining({
            method: 'PATCH',
          }),
        );
      });

      // 验证成功提示
      expect(toast.success).toHaveBeenCalledWith('审核成功');
    });

    it('应该通过批量通过按钮触发审核函数', async () => {
      render(EnrollManagement);

      // 等待数据加载
      await waitFor(() => {
        expect(screen.getByText('张三')).toBeInTheDocument();
      });

      // 选择checkbox
      const checkbox = screen.getAllByRole('checkbox')[1]; // 第一个数据行checkbox
      fireEvent.click(checkbox);

      // 点击批量通过按钮
      const batchApproveButton = screen.getByText('批量通过');
      fireEvent.click(batchApproveButton);

      // 等待确认对话框出现
      await waitFor(() => {
        expect(screen.getByText('确认通过')).toBeInTheDocument();
      });

      // 点击确认按钮 - 使用正确的文本"确定"
      const confirmButton = screen.getByText('确定');
      fireEvent.click(confirmButton);

      // 验证API调用
      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith(
          expect.stringContaining('/api/registrationStudent'),
          expect.objectContaining({
            method: 'PATCH',
          }),
        );
      });
    });

    it('应该通过批量不通过按钮触发审核函数', async () => {
      render(EnrollManagement);

      // 等待数据加载
      await waitFor(() => {
        expect(screen.getByText('张三')).toBeInTheDocument();
      });

      // 选择checkbox
      const checkbox = screen.getAllByRole('checkbox')[1];
      fireEvent.click(checkbox);

      // 点击批量不通过按钮
      const batchRejectButton = screen.getByText('批量不通过');
      fireEvent.click(batchRejectButton);

      // 等待不通过理由输入框出现
      await waitFor(() => {
        expect(screen.getByText('请输入不通过理由')).toBeInTheDocument();
      });

      // 输入不通过理由
      const reasonInput = screen.getByPlaceholderText('请输入理由');
      fireEvent.input(reasonInput, { target: { value: '批量不通过理由' } });

      // 点击确认按钮 - 使用正确的文本"确认"
      const confirmButton = screen.getByText('确定');
      fireEvent.click(confirmButton);

      // 验证API调用
      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith(
          expect.stringContaining('/api/registrationStudent'),
          expect.objectContaining({
            method: 'PATCH',
          }),
        );
      });
    });

    it('应该处理API返回错误状态', async () => {
      // 先正常加载数据
      global.fetch.mockImplementation((url) => {
        if (url.includes('/api/registration')) {
          return Promise.resolve({
            ok: true,
            json: () =>
              Promise.resolve({
                data: {
                  student: [
                    {
                      student: {
                        ID: '1',
                        OfficialName: '张三',
                        MobilePhone: '13800138000',
                        Email: 'zhangsan@example.com',
                        Gender: '男',
                        IDCardNo: '110101199001011234',
                        IDCardType: '身份证',
                      },
                      detail: {
                        RegisterTime: '2024-01-01T10:00:00Z',
                        Type: '00',
                        ExamType: '00',
                        Status: '02',
                      },
                      reviewer: '李老师',
                    },
                  ],
                  total: 1,
                },
              }),
          });
        }
        return Promise.reject(new Error('Unmocked URL: ' + url));
      });

      render(EnrollManagement);

      // 等待数据加载
      await waitFor(() => {
        expect(screen.getByText('张三')).toBeInTheDocument();
      });

      // 现在模拟审核API返回错误
      global.fetch.mockImplementation((url) => {
        if (url.includes('/api/registrationStudent')) {
          return Promise.resolve({
            ok: true,
            json: () =>
              Promise.resolve({
                status: -1,
                msg: '操作失败',
              }),
          });
        }
        if (url.includes('/api/registration')) {
          return Promise.resolve({
            ok: true,
            json: () =>
              Promise.resolve({
                data: {
                  student: [
                    {
                      student: {
                        ID: '1',
                        OfficialName: '张三',
                        MobilePhone: '13800138000',
                        Email: 'zhangsan@example.com',
                        Gender: '男',
                        IDCardNo: '110101199001011234',
                        IDCardType: '身份证',
                      },
                      detail: {
                        RegisterTime: '2024-01-01T10:00:00Z',
                        Type: '00',
                        ExamType: '00',
                        Status: '02',
                      },
                      reviewer: '李老师',
                    },
                  ],
                  total: 1,
                },
              }),
          });
        }
        return Promise.reject(new Error('Unmocked URL: ' + url));
      });

      // 点击通过按钮
      const approveButton = screen.getByTestId('approve-btn');
      fireEvent.click(approveButton);

      // 点击确认
      await waitFor(() => {
        expect(screen.getByText('确认通过')).toBeInTheDocument();
      });

      const confirmButton = screen.getByText('确定');
      fireEvent.click(confirmButton);

      // 验证错误提示
      await waitFor(() => {
        expect(toast.error).toHaveBeenCalledWith('审核失败');
      });
    });

    it('应该处理网络错误', async () => {
      // 先正常加载数据
      global.fetch.mockImplementation((url) => {
        if (url.includes('/api/registration')) {
          return Promise.resolve({
            ok: true,
            json: () =>
              Promise.resolve({
                data: {
                  student: [
                    {
                      student: {
                        ID: '1',
                        OfficialName: '张三',
                        MobilePhone: '13800138000',
                        Email: 'zhangsan@example.com',
                        Gender: '男',
                        IDCardNo: '110101199001011234',
                        IDCardType: '身份证',
                      },
                      detail: {
                        RegisterTime: '2024-01-01T10:00:00Z',
                        Type: '00',
                        ExamType: '00',
                        Status: '02',
                      },
                      reviewer: '李老师',
                    },
                  ],
                  total: 1,
                },
              }),
          });
        }
        return Promise.reject(new Error('Unmocked URL: ' + url));
      });

      // 模拟 console.log
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

      render(EnrollManagement);

      // 等待数据加载
      await waitFor(() => {
        expect(screen.getByText('张三')).toBeInTheDocument();
      });

      // 现在模拟审核API网络错误
      global.fetch.mockImplementation((url) => {
        if (url.includes('/api/registrationStudent')) {
          return Promise.reject(new Error('网络连接失败'));
        }
        if (url.includes('/api/registration')) {
          return Promise.resolve({
            ok: true,
            json: () =>
              Promise.resolve({
                data: {
                  student: [
                    {
                      student: {
                        ID: '1',
                        OfficialName: '张三',
                        MobilePhone: '13800138000',
                        Email: 'zhangsan@example.com',
                        Gender: '男',
                        IDCardNo: '110101199001011234',
                        IDCardType: '身份证',
                      },
                      detail: {
                        RegisterTime: '2024-01-01T10:00:00Z',
                        Type: '00',
                        ExamType: '00',
                        Status: '02',
                      },
                      reviewer: '李老师',
                    },
                  ],
                  total: 1,
                },
              }),
          });
        }
        return Promise.reject(new Error('Unmocked URL: ' + url));
      });

      // 点击通过按钮
      const approveButton = screen.getByTestId('approve-btn');
      fireEvent.click(approveButton);

      // 点击确认
      await waitFor(() => {
        expect(screen.getByText('确认通过')).toBeInTheDocument();
      });

      const confirmButton = screen.getByText('确定');
      fireEvent.click(confirmButton);

      // 验证错误被记录
      await waitFor(() => {
        expect(consoleSpy).toHaveBeenCalledWith(expect.any(Error));
      });

      consoleSpy.mockRestore();
    });

    it('应该验证API调用参数正确性', async () => {
      render(EnrollManagement);

      // 等待数据加载
      await waitFor(() => {
        expect(screen.getByText('张三')).toBeInTheDocument();
      });

      // 点击通过按钮
      const approveButton = screen.getByTestId('approve-btn');
      fireEvent.click(approveButton);

      // 点击确认
      await waitFor(() => {
        expect(screen.getByText('确认通过')).toBeInTheDocument();
      });

      const confirmButton = screen.getByText('确定');
      fireEvent.click(confirmButton);

      // 验证API调用参数
      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith(
          expect.stringContaining('/api/registrationStudent'),
          expect.any(Object),
        );
      });

      const fetchCalls = global.fetch.mock.calls;
      const registrationCall = fetchCalls.find((call) => call[0].includes('/api/registrationStudent'));

      // 修复URL解析问题 - 使用完整的URL
      const fullUrl = registrationCall[0].startsWith('http')
        ? registrationCall[0]
        : `http://localhost${registrationCall[0]}`;

      const url = new URL(fullUrl);
      expect(url.searchParams.get('ids')).toBe('1');
      expect(url.searchParams.get('status')).toBe('04');
      expect(url.searchParams.get('register_id')).toBe('1');
    });
  });

  describe('handleFileUpload 函数测试', () => {
    // 在 describe 块开始时就设置模拟
    const mockCheckFileData = vi.mocked(checkFileData);
    const mockFormatDateTime = vi.fn();

    beforeEach(() => {
      vi.clearAllMocks();

      // 重置模拟函数
      mockCheckFileData.mockClear();
      mockFormatDateTime.mockClear();

      // 重置全局状态
      global.fetch.mockClear();

      // 模拟成功的API响应
      global.fetch.mockImplementation((url) => {
        if (url.includes('/api/registration')) {
          return Promise.resolve({
            ok: true,
            json: () =>
              Promise.resolve({
                data: {
                  student: [
                    {
                      student: {
                        ID: '1',
                        OfficialName: '张三',
                        MobilePhone: '13800138000',
                        Email: 'zhangsan@example.com',
                        Gender: '男',
                        IDCardNo: '110101199001011234',
                        IDCardType: '身份证',
                      },
                      detail: {
                        RegisterTime: '2024-01-01T10:00:00Z',
                        Type: '00',
                        ExamType: '00',
                        Status: '02',
                      },
                      reviewer: '李老师',
                    },
                  ],
                  total: 1,
                },
              }),
          });
        }
        return Promise.reject(new Error('Unmocked URL: ' + url));
      });
    });

    it('应该通过点击导入按钮触发文件上传', async () => {
      render(EnrollManagement);

      // 等待数据加载
      await waitFor(() => {
        expect(screen.getByText('张三')).toBeInTheDocument();
      });

      // 查找导入按钮
      const importButton = screen.getByText('导入');
      expect(importButton).toBeInTheDocument();

      // 点击导入按钮
      fireEvent.click(importButton);

      // 等待文件输入框出现
      await waitFor(() => {
        const fileInput = document.querySelector('input[type="file"]');
        expect(fileInput).toBeInTheDocument();
      });

      // 创建模拟文件
      const mockFile = new File(['test content'], 'test.xlsx', {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      });

      // 获取文件输入框
      const fileInput = document.querySelector('input[type="file"]');

      // 触发文件选择事件
      fireEvent.change(fileInput, { target: { files: [mockFile] } });
    });

    it('应该处理文件上传成功的情况', async () => {
      // 模拟 checkFileData 返回成功数据
      const mockSuccessData = [
        {
          name: '李四',
          phone: '13900139000',
          email: 'lisi@example.com',
          gender: '女',
          id_card: '110101199002021234',
          id_type: '身份证',
          birth: '1990-02-02',
          address: '北京市朝阳区',
          error: '',
          serial_number: 1,
        },
      ];

      mockCheckFileData.mockResolvedValue({
        error: null,
        data: mockSuccessData,
      });

      render(EnrollManagement);

      // 等待数据加载
      await waitFor(() => {
        expect(screen.getByText('张三')).toBeInTheDocument();
      });

      // 点击导入按钮
      const importButton = screen.getByText('导入');
      fireEvent.click(importButton);

      // 等待文件输入框出现
      await waitFor(() => {
        const fileInput = document.querySelector('input[type="file"]');
        expect(fileInput).toBeInTheDocument();
      });

      // 创建模拟文件
      const mockFile = new File(['test content'], 'test.xlsx', {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      });

      // 获取文件输入框
      const fileInput = document.querySelector('input[type="file"]');

      // 触发文件选择事件
      fireEvent.change(fileInput, { target: { files: [mockFile] } });

      // 等待异步操作完成
      await waitFor(() => {
        expect(mockCheckFileData).toHaveBeenCalledWith(mockFile);
      });

      // 验证 checkFileData 被调用
      expect(mockCheckFileData).toHaveBeenCalledTimes(1);
      expect(mockCheckFileData).toHaveBeenCalledWith(mockFile);
    });

    it('应该处理文件上传失败的情况', async () => {
      // 模拟 checkFileData 返回错误
      mockCheckFileData.mockResolvedValue({
        error: '文件格式错误',
        data: [],
      });

      render(EnrollManagement);

      // 等待数据加载
      await waitFor(() => {
        expect(screen.getByText('张三')).toBeInTheDocument();
      });

      // 点击导入按钮
      const importButton = screen.getByText('导入');
      fireEvent.click(importButton);

      // 等待文件输入框出现
      await waitFor(() => {
        const fileInput = document.querySelector('input[type="file"]');
        expect(fileInput).toBeInTheDocument();
      });

      // 创建模拟文件
      const mockFile = new File(['test content'], 'test.xlsx', {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      });

      // 获取文件输入框
      const fileInput = document.querySelector('input[type="file"]');

      // 触发文件选择事件
      fireEvent.change(fileInput, { target: { files: [mockFile] } });

      // 等待异步操作完成
      await waitFor(() => {
        expect(mockCheckFileData).toHaveBeenCalledWith(mockFile);
      });

      // 验证 checkFileData 被调用
      expect(mockCheckFileData).toHaveBeenCalledTimes(1);
      expect(mockCheckFileData).toHaveBeenCalledWith(mockFile);

      // 验证错误处理
      await waitFor(() => {
        expect(toast.error).toHaveBeenCalledWith('文件格式错误');
      });
    });

    it('应该处理空文件的情况', async () => {
      render(EnrollManagement);

      // 等待数据加载
      await waitFor(() => {
        expect(screen.getByText('张三')).toBeInTheDocument();
      });

      // 点击导入按钮
      const importButton = screen.getByText('导入');
      fireEvent.click(importButton);

      // 等待文件输入框出现
      await waitFor(() => {
        const fileInput = document.querySelector('input[type="file"]');
        expect(fileInput).toBeInTheDocument();
      });

      // 获取文件输入框
      const fileInput = document.querySelector('input[type="file"]');

      // 触发空文件上传
      fireEvent.change(fileInput, { target: { files: [] } });

      // 验证没有调用 checkFileData
      expect(mockCheckFileData).not.toHaveBeenCalled();
    });

    it('应该处理文件为空的情况', async () => {
      render(EnrollManagement);

      // 等待数据加载
      await waitFor(() => {
        expect(screen.getByText('张三')).toBeInTheDocument();
      });

      // 点击导入按钮
      const importButton = screen.getByText('导入');
      fireEvent.click(importButton);

      // 等待文件输入框出现
      await waitFor(() => {
        const fileInput = document.querySelector('input[type="file"]');
        expect(fileInput).toBeInTheDocument();
      });

      // 获取文件输入框
      const fileInput = document.querySelector('input[type="file"]');

      // 触发空文件上传
      fireEvent.change(fileInput, { target: { files: null } });

      // 验证没有调用 checkFileData
      expect(mockCheckFileData).not.toHaveBeenCalled();
    });

    it('应该处理 checkFileData 返回空数据的情况', async () => {
      // 模拟 checkFileData 返回空数据
      mockCheckFileData.mockResolvedValue({
        error: null,
        data: [],
      });

      render(EnrollManagement);

      // 等待数据加载
      await waitFor(() => {
        expect(screen.getByText('张三')).toBeInTheDocument();
      });

      // 点击导入按钮
      const importButton = screen.getByText('导入');
      fireEvent.click(importButton);

      // 等待文件输入框出现
      await waitFor(() => {
        const fileInput = document.querySelector('input[type="file"]');
        expect(fileInput).toBeInTheDocument();
      });

      // 创建模拟文件
      const mockFile = new File(['test content'], 'test.xlsx', {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      });

      // 获取文件输入框
      const fileInput = document.querySelector('input[type="file"]');

      // 触发文件选择事件
      fireEvent.change(fileInput, { target: { files: [mockFile] } });

      // 等待异步操作完成
      await waitFor(() => {
        expect(mockCheckFileData).toHaveBeenCalledWith(mockFile);
      });

      // 验证 checkFileData 被调用
      expect(mockCheckFileData).toHaveBeenCalledTimes(1);
      expect(mockCheckFileData).toHaveBeenCalledWith(mockFile);

      // 验证当数据为空时，函数提前返回，不执行后续逻辑
      // 这里可以添加更多验证，比如验证 is_show_import_panel 没有被设置为 true
    });

    it('应该处理文件扩展名检查', async () => {
      // 模拟 checkFileData 返回成功数据
      const mockSuccessData = [
        {
          name: '王五',
          phone: '13700137000',
          email: 'wangwu@example.com',
          gender: '男',
          id_card: '110101199003031234',
          id_type: '身份证',
          birth: '1990-03-03',
          address: '北京市海淀区',
          error: '',
          serial_number: 1,
        },
      ];

      mockCheckFileData.mockResolvedValue({
        error: null,
        data: mockSuccessData,
      });

      render(EnrollManagement);

      // 等待数据加载
      await waitFor(() => {
        expect(screen.getByText('张三')).toBeInTheDocument();
      });

      // 点击导入按钮
      const importButton = screen.getByText('导入');
      fireEvent.click(importButton);

      // 等待文件输入框出现
      await waitFor(() => {
        const fileInput = document.querySelector('input[type="file"]');
        expect(fileInput).toBeInTheDocument();
      });

      // 创建不同扩展名的模拟文件
      const mockFileXlsx = new File(['test content'], 'test.xlsx', {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      });

      const mockFileXls = new File(['test content'], 'test.xls', {
        type: 'application/vnd.ms-excel',
      });

      // 测试 .xlsx 文件
      const fileInput = document.querySelector('input[type="file"]');
      fireEvent.change(fileInput, { target: { files: [mockFileXlsx] } });

      await waitFor(() => {
        expect(mockCheckFileData).toHaveBeenCalledWith(mockFileXlsx);
      });

      // 重置文件输入框
      fileInput.value = null;

      // 测试 .xls 文件
      fireEvent.change(fileInput, { target: { files: [mockFileXls] } });

      await waitFor(() => {
        expect(mockCheckFileData).toHaveBeenCalledWith(mockFileXls);
      });

      // 验证 checkFileData 被调用了两次
      expect(mockCheckFileData).toHaveBeenCalledTimes(2);
    });
  });

  describe('通过和撤销通过事件测试', () => {
    beforeEach(() => {
      vi.clearAllMocks();
      global.fetch.mockClear();

      // 模拟成功的API响应
      global.fetch.mockImplementation((url) => {
        if (url.includes('/api/registration')) {
          return Promise.resolve({
            ok: true,
            json: () =>
              Promise.resolve({
                data: {
                  student: [
                    {
                      student: {
                        ID: '1',
                        OfficialName: '张三',
                        MobilePhone: '13800138000',
                        Email: 'zhangsan@example.com',
                        Gender: '男',
                        IDCardNo: '110101199001011234',
                        IDCardType: '身份证',
                      },
                      detail: {
                        RegisterTime: '2024-01-01T10:00:00Z',
                        Type: '00',
                        ExamType: '00',
                        Status: '02', // 待审核状态
                      },
                      reviewer: '李老师',
                    },
                  ],
                  total: 1,
                },
              }),
          });
        }
        return Promise.reject(new Error('Unmocked URL: ' + url));
      });
    });

    it('应该显示单个通过的确认对话框', async () => {
      render(EnrollManagement);

      // 等待数据加载
      await waitFor(() => {
        expect(screen.getByText('张三')).toBeInTheDocument();
      });

      // 使用更精确的选择器来查找表格中的通过按钮
      // 方法1：使用 data-testid
      const approveButton = screen.getByTestId('approve-btn');
      expect(approveButton).toBeInTheDocument();

      // 点击通过按钮
      fireEvent.click(approveButton);

      // 验证确认对话框出现
      await waitFor(() => {
        expect(screen.getByText('确认通过')).toBeInTheDocument();
        expect(screen.getByText('通过后，该名人员将被录用，确定要继续吗？')).toBeInTheDocument();
      });

      // 验证确认和取消按钮都存在
      await waitFor(() => {
        expect(screen.getByText('确定')).toBeInTheDocument();
      });
    });

    it('应该在确认对话框中点击取消后关闭对话框', async () => {
      render(EnrollManagement);

      // 等待数据加载
      await waitFor(() => {
        expect(screen.getByText('张三')).toBeInTheDocument();
      });

      // 使用 data-testid 查找通过按钮
      const approveButton = screen.getByTestId('approve-btn');
      fireEvent.click(approveButton);

      // 等待确认对话框出现
      await waitFor(() => {
        expect(screen.getByText('确认通过')).toBeInTheDocument();
      });

      // 获取所有取消按钮，然后找到确认对话框中的那个
      const cancelButtons = screen.getAllByText('取消');
      const messageBoxCancelButton = cancelButtons.find((button) => {
        // 检查按钮是否在确认对话框附近
        const messageBox = screen.getByText('确认通过');
        return (
          messageBox.contains(button) ||
          button.closest('[role="dialog"]') === messageBox.closest('[role="dialog"]') ||
          button.closest('.message-box') === messageBox.closest('.message-box')
        );
      });

      expect(messageBoxCancelButton).toBeInTheDocument();
      fireEvent.click(messageBoxCancelButton);

      // 验证没有调用通过API
      expect(global.fetch).not.toHaveBeenCalledWith(
        expect.stringContaining('/api/registration/approve'),
        expect.any(Object),
      );
    });
  });

  describe('通过和撤销通过事件测试', () => {
    beforeEach(() => {
      vi.clearAllMocks();
      global.fetch.mockClear();

      // 模拟成功的API响应 - 包含多种状态的数据
      global.fetch.mockImplementation((url) => {
        if (url.includes('/api/registration')) {
          return Promise.resolve({
            ok: true,
            json: () =>
              Promise.resolve({
                data: {
                  student: [
                    {
                      student: {
                        ID: '1',
                        OfficialName: '张三',
                        MobilePhone: '13800138000',
                        Email: 'zhangsan@example.com',
                        Gender: '男',
                        IDCardNo: '110101199001011234',
                        IDCardType: '身份证',
                      },
                      detail: {
                        RegisterTime: '2024-01-01T10:00:00Z',
                        Type: '00',
                        ExamType: '00',
                        Status: '02', // 待审核状态
                      },
                      reviewer: '李老师',
                    },
                    {
                      student: {
                        ID: '2',
                        OfficialName: '李四',
                        MobilePhone: '13900139000',
                        Email: 'lisi@example.com',
                        Gender: '女',
                        IDCardNo: '110101199002021234',
                        IDCardType: '身份证',
                      },
                      detail: {
                        RegisterTime: '2024-01-02T10:00:00Z',
                        Type: '00',
                        ExamType: '00',
                        Status: '02', // 待审核状态
                      },
                      reviewer: '王老师',
                    },
                    {
                      student: {
                        ID: '3',
                        OfficialName: '王五',
                        MobilePhone: '13700137000',
                        Email: 'wangwu@example.com',
                        Gender: '男',
                        IDCardNo: '110101199003031234',
                        IDCardType: '身份证',
                      },
                      detail: {
                        RegisterTime: '2024-01-03T10:00:00Z',
                        Type: '00',
                        ExamType: '00',
                        Status: '02', // 待审核状态
                      },
                      reviewer: '赵老师',
                    },
                    {
                      student: {
                        ID: '4',
                        OfficialName: '赵六',
                        MobilePhone: '13600136000',
                        Email: 'zhaoliu@example.com',
                        Gender: '女',
                        IDCardNo: '110101199004041234',
                        IDCardType: '身份证',
                      },
                      detail: {
                        RegisterTime: '2024-01-04T10:00:00Z',
                        Type: '00',
                        ExamType: '00',
                        Status: '04', // 已通过状态
                      },
                      reviewer: '孙老师',
                    },
                    {
                      student: {
                        ID: '5',
                        OfficialName: '钱七',
                        MobilePhone: '13500135000',
                        Email: 'qianqi@example.com',
                        Gender: '男',
                        IDCardNo: '110101199005051234',
                        IDCardType: '身份证',
                      },
                      detail: {
                        RegisterTime: '2024-01-05T10:00:00Z',
                        Type: '00',
                        ExamType: '00',
                        Status: '06', // 不通过状态
                      },
                      reviewer: '周老师',
                    },
                    {
                      student: {
                        ID: '6',
                        OfficialName: '孙八',
                        MobilePhone: '13400134000',
                        Email: 'sunba@example.com',
                        Gender: '女',
                        IDCardNo: '110101199006061234',
                        IDCardType: '身份证',
                      },
                      detail: {
                        RegisterTime: '2024-01-06T10:00:00Z',
                        Type: '00',
                        ExamType: '00',
                        Status: '02', // 待审核状态
                      },
                      reviewer: '吴老师',
                    },
                    {
                      student: {
                        ID: '7',
                        OfficialName: '周九',
                        MobilePhone: '13300133000',
                        Email: 'zhoujiu@example.com',
                        Gender: '男',
                        IDCardNo: '110101199007071234',
                        IDCardType: '身份证',
                      },
                      detail: {
                        RegisterTime: '2024-01-07T10:00:00Z',
                        Type: '00',
                        ExamType: '00',
                        Status: '04', // 已通过状态
                      },
                      reviewer: '郑老师',
                    },
                    {
                      student: {
                        ID: '8',
                        OfficialName: '吴十',
                        MobilePhone: '13200132000',
                        Email: 'wushi@example.com',
                        Gender: '女',
                        IDCardNo: '110101199008081234',
                        IDCardType: '身份证',
                      },
                      detail: {
                        RegisterTime: '2024-01-08T10:00:00Z',
                        Type: '00',
                        ExamType: '00',
                        Status: '06', // 不通过状态
                      },
                      reviewer: '王老师',
                    },
                  ],
                  total: 8,
                },
              }),
          });
        }
        return Promise.reject(new Error('Unmocked URL: ' + url));
      });
    });

    it('应该显示单个通过的确认对话框', async () => {
      render(EnrollManagement);

      // 等待数据加载
      await waitFor(() => {
        expect(screen.getByText('张三')).toBeInTheDocument();
        expect(screen.getByText('李四')).toBeInTheDocument();
        expect(screen.getByText('王五')).toBeInTheDocument();
        expect(screen.getByText('赵六')).toBeInTheDocument();
        expect(screen.getByText('钱七')).toBeInTheDocument();
        expect(screen.getByText('孙八')).toBeInTheDocument();
        expect(screen.getByText('周九')).toBeInTheDocument();
        expect(screen.getByText('吴十')).toBeInTheDocument();
      });

      // 方法1：使用 getAllByTestId 然后选择第一个
      const approveButtons = screen.getAllByTestId('approve-btn');
      expect(approveButtons.length).toBeGreaterThan(0);

      // 点击第一个通过按钮（张三的）
      const firstApproveButton = approveButtons[0];
      fireEvent.click(firstApproveButton);

      // 验证确认对话框出现
      await waitFor(() => {
        expect(screen.getByText('确认通过')).toBeInTheDocument();
        expect(screen.getByText('通过后，该名人员将被录用，确定要继续吗？')).toBeInTheDocument();
      });

      // 验证确认和取消按钮都存在
      await waitFor(() => {
        expect(screen.getByText('确定')).toBeInTheDocument();
      });
    });

    it('应该显示特定人员（张三）的通过确认对话框', async () => {
      render(EnrollManagement);

      // 等待数据加载
      await waitFor(() => {
        expect(screen.getByText('张三')).toBeInTheDocument();
      });

      // 方法2：通过人员姓名找到对应的行，然后在该行中查找按钮
      const table = screen.getByRole('table');
      const zhangSanRow = within(table).getByText('张三').closest('tr');
      const approveButton = within(zhangSanRow).getByTestId('approve-btn');

      fireEvent.click(approveButton);

      // 验证确认对话框出现
      await waitFor(() => {
        expect(screen.getByText('确认通过')).toBeInTheDocument();
        expect(screen.getByText('通过后，该名人员将被录用，确定要继续吗？')).toBeInTheDocument();
      });
    });

    it('应该显示特定人员（李四）的通过确认对话框', async () => {
      render(EnrollManagement);

      // 等待数据加载
      await waitFor(() => {
        expect(screen.getByText('李四')).toBeInTheDocument();
      });

      // 通过人员姓名找到对应的行，然后在该行中查找按钮
      const table = screen.getByRole('table');
      const liSiRow = within(table).getByText('李四').closest('tr');
      const approveButton = within(liSiRow).getByTestId('approve-btn');

      fireEvent.click(approveButton);

      // 验证确认对话框出现
      await waitFor(() => {
        expect(screen.getByText('确认通过')).toBeInTheDocument();
        expect(screen.getByText('通过后，该名人员将被录用，确定要继续吗？')).toBeInTheDocument();
      });
    });

    it('应该显示特定人员（王五）的撤销通过确认对话框', async () => {
      render(EnrollManagement);

      // 等待数据加载
      await waitFor(() => {
        expect(screen.getByText('王五')).toBeInTheDocument();
      });

      // 通过人员姓名找到对应的行，然后在该行中查找撤销通过按钮
      const table = screen.getByRole('table');
      const wangWuRow = within(table).getByText('王五').closest('tr');
      const revokeButton = within(wangWuRow).getByTestId('revoke-approve-btn');

      fireEvent.click(revokeButton);

      // 验证确认对话框出现
      await waitFor(() => {
        expect(screen.getByText('确认撤销通过')).toBeInTheDocument();
        expect(screen.getByText('撤销通过后，该名人员将重新进入待审核状态，确定要继续吗？')).toBeInTheDocument();
      });
    });

    it('应该显示批量通过的确认对话框', async () => {
      render(EnrollManagement);

      // 等待数据加载
      await waitFor(() => {
        expect(screen.getByText('张三')).toBeInTheDocument();
        expect(screen.getByText('李四')).toBeInTheDocument();
        expect(screen.getByText('王五')).toBeInTheDocument();
        expect(screen.getByText('孙八')).toBeInTheDocument();
      });

      // 选择多个复选框（选择待审核状态的记录）
      const checkboxes = screen.getAllByRole('checkbox');
      fireEvent.click(checkboxes[1]); // 选择张三（待审核）
      fireEvent.click(checkboxes[2]); // 选择李四（待审核）
      fireEvent.click(checkboxes[3]); // 选择王五（待审核）
      fireEvent.click(checkboxes[6]); // 选择孙八（待审核）

      // 点击批量通过按钮
      const batchApproveButton = screen.getByText('批量通过');
      expect(batchApproveButton).toBeInTheDocument();
      fireEvent.click(batchApproveButton);

      // 验证确认对话框出现
      await waitFor(() => {
        expect(screen.getByText('确认通过')).toBeInTheDocument();
        expect(screen.getByText('确定要通过选中的 4 条数据吗？')).toBeInTheDocument();
      });

      // 验证确认和取消按钮都存在
      expect(screen.getByText('确定')).toBeInTheDocument();
      expect(screen.getByText('取消')).toBeInTheDocument();
    });

    it('应该处理部分选择无效的情况', async () => {
      render(EnrollManagement);

      // 等待数据加载
      await waitFor(() => {
        expect(screen.getByText('张三')).toBeInTheDocument();
        expect(screen.getByText('李四')).toBeInTheDocument();
        expect(screen.getByText('王五')).toBeInTheDocument();
        expect(screen.getByText('赵六')).toBeInTheDocument();
        expect(screen.getByText('钱七')).toBeInTheDocument();
        expect(screen.getByText('孙八')).toBeInTheDocument();
        expect(screen.getByText('周九')).toBeInTheDocument();
        expect(screen.getByText('吴十')).toBeInTheDocument();
      });

      // 选择多个复选框（包含不同状态的记录）
      const checkboxes = screen.getAllByRole('checkbox');
      fireEvent.click(checkboxes[1]); // 选择张三（待审核）
      fireEvent.click(checkboxes[2]); // 选择李四（待审核）
      fireEvent.click(checkboxes[3]); // 选择王五（待审核）
      fireEvent.click(checkboxes[4]); // 选择赵六（已通过）
      fireEvent.click(checkboxes[5]); // 选择钱七（不通过）
      fireEvent.click(checkboxes[6]); // 选择孙八（待审核）
      fireEvent.click(checkboxes[7]); // 选择周九（已通过）
      fireEvent.click(checkboxes[8]); // 选择吴十（不通过）

      // 点击批量通过按钮
      const batchApproveButton = screen.getByText('批量通过');
      fireEvent.click(batchApproveButton);

      // 验证部分选择无效的对话框
      await waitFor(() => {
        expect(screen.getByText('部分选择无效')).toBeInTheDocument();
        expect(screen.getByText(/你选择的 8 条数据中，有 4 条不符合通过条件/)).toBeInTheDocument();
      });

      // 验证确认和取消按钮都存在
      expect(screen.getByText('确定')).toBeInTheDocument();
      expect(screen.getByText('取消')).toBeInTheDocument();
    });

    it('应该处理没有符合条件数据的情况', async () => {
      render(EnrollManagement);

      // 等待数据加载
      await waitFor(() => {
        expect(screen.getByText('张三')).toBeInTheDocument();
        expect(screen.getByText('李四')).toBeInTheDocument();
        expect(screen.getByText('王五')).toBeInTheDocument();
        expect(screen.getByText('赵六')).toBeInTheDocument();
        expect(screen.getByText('钱七')).toBeInTheDocument();
        expect(screen.getByText('孙八')).toBeInTheDocument();
        expect(screen.getByText('周九')).toBeInTheDocument();
        expect(screen.getByText('吴十')).toBeInTheDocument();
      });

      // 只选择已通过和不通过状态的记录
      const checkboxes = screen.getAllByRole('checkbox');
      fireEvent.click(checkboxes[4]); // 选择赵六（已通过）
      fireEvent.click(checkboxes[5]); // 选择钱七（不通过）
      fireEvent.click(checkboxes[7]); // 选择周九（已通过）
      fireEvent.click(checkboxes[8]); // 选择吴十（不通过）

      // 点击批量通过按钮
      const batchApproveButton = screen.getByText('批量通过');
      fireEvent.click(batchApproveButton);

      // 验证无效操作的对话框
      await waitFor(() => {
        expect(screen.getByText('无效操作')).toBeInTheDocument();
        expect(screen.getByText('所选人员中没有符合通过条件的数据。')).toBeInTheDocument();
      });
    });

    it('应该显示批量撤销通过的确认对话框', async () => {
      render(EnrollManagement);

      // 等待数据加载
      await waitFor(() => {
        expect(screen.getByText('张三')).toBeInTheDocument();
        expect(screen.getByText('李四')).toBeInTheDocument();
        expect(screen.getByText('王五')).toBeInTheDocument();
        expect(screen.getByText('赵六')).toBeInTheDocument();
        expect(screen.getByText('钱七')).toBeInTheDocument();
        expect(screen.getByText('孙八')).toBeInTheDocument();
        expect(screen.getByText('周九')).toBeInTheDocument();
        expect(screen.getByText('吴十')).toBeInTheDocument();
      });

      // 选择已通过状态的记录
      const checkboxes = screen.getAllByRole('checkbox');
      fireEvent.click(checkboxes[4]); // 选择赵六（已通过）
      fireEvent.click(checkboxes[7]); // 选择周九（已通过）

      // 点击批量撤销通过按钮
      const batchRevokeButton = screen.getByText('批量撤销通过');
      expect(batchRevokeButton).toBeInTheDocument();
      fireEvent.click(batchRevokeButton);

      // 验证确认对话框出现
      await waitFor(() => {
        expect(screen.getByText('确认撤销通过')).toBeInTheDocument();
        expect(screen.getByText('确定要撤销通过选中的 2 条数据吗？')).toBeInTheDocument();
      });

      // 验证确认和取消按钮都存在
      expect(screen.getByText('确定')).toBeInTheDocument();
      expect(screen.getByText('取消')).toBeInTheDocument();
    });

    it('应该在确认对话框中点击取消后关闭对话框', async () => {
      render(EnrollManagement);

      // 等待数据加载
      await waitFor(() => {
        expect(screen.getByText('张三')).toBeInTheDocument();
      });

      // 使用 getAllByTestId 选择第一个通过按钮
      const approveButtons = screen.getAllByTestId('approve-btn');
      const firstApproveButton = approveButtons[0];
      fireEvent.click(firstApproveButton);

      // 等待确认对话框出现
      await waitFor(() => {
        expect(screen.getByText('确认通过')).toBeInTheDocument();
      });

      // 获取所有取消按钮，然后找到确认对话框中的那个
      const cancelButtons = screen.getAllByText('取消');
      const messageBoxCancelButton = cancelButtons.find((button) => {
        // 检查按钮是否在确认对话框附近
        const messageBox = screen.getByText('确认通过');
        return (
          messageBox.contains(button) ||
          button.closest('[role="dialog"]') === messageBox.closest('[role="dialog"]') ||
          button.closest('.message-box') === messageBox.closest('.message-box')
        );
      });

      expect(messageBoxCancelButton).toBeInTheDocument();
      fireEvent.click(messageBoxCancelButton);

      // 验证没有调用通过API
      expect(global.fetch).not.toHaveBeenCalledWith(
        expect.stringContaining('/api/registration/approve'),
        expect.any(Object),
      );
    });

    it('应该在批量通过确认对话框中点击确定后执行通过操作', async () => {
      // 模拟批量通过API调用成功
      global.fetch.mockImplementation((url) => {
        if (url.includes('/api/registration')) {
          if (url.includes('approve')) {
            return Promise.resolve({
              ok: true,
              json: () => Promise.resolve({ success: true }),
            });
          }
          return Promise.resolve({
            ok: true,
            json: () =>
              Promise.resolve({
                data: {
                  student: [
                    {
                      student: {
                        ID: '1',
                        OfficialName: '张三',
                        MobilePhone: '13800138000',
                        Email: 'zhangsan@example.com',
                        Gender: '男',
                        IDCardNo: '110101199001011234',
                        IDCardType: '身份证',
                      },
                      detail: {
                        RegisterTime: '2024-01-01T10:00:00Z',
                        Type: '00',
                        ExamType: '00',
                        Status: '02',
                      },
                      reviewer: '李老师',
                    },
                    {
                      student: {
                        ID: '2',
                        OfficialName: '李四',
                        MobilePhone: '13900139000',
                        Email: 'lisi@example.com',
                        Gender: '女',
                        IDCardNo: '110101199002021234',
                        IDCardType: '身份证',
                      },
                      detail: {
                        RegisterTime: '2024-01-02T10:00:00Z',
                        Type: '00',
                        ExamType: '00',
                        Status: '02',
                      },
                      reviewer: '王老师',
                    },
                    {
                      student: {
                        ID: '3',
                        OfficialName: '王五',
                        MobilePhone: '13700137000',
                        Email: 'wangwu@example.com',
                        Gender: '男',
                        IDCardNo: '110101199003031234',
                        IDCardType: '身份证',
                      },
                      detail: {
                        RegisterTime: '2024-01-03T10:00:00Z',
                        Type: '00',
                        ExamType: '00',
                        Status: '02',
                      },
                      reviewer: '赵老师',
                    },
                    {
                      student: {
                        ID: '4',
                        OfficialName: '赵六',
                        MobilePhone: '13600136000',
                        Email: 'zhaoliu@example.com',
                        Gender: '女',
                        IDCardNo: '110101199004041234',
                        IDCardType: '身份证',
                      },
                      detail: {
                        RegisterTime: '2024-01-04T10:00:00Z',
                        Type: '00',
                        ExamType: '00',
                        Status: '04',
                      },
                      reviewer: '孙老师',
                    },
                    {
                      student: {
                        ID: '5',
                        OfficialName: '钱七',
                        MobilePhone: '13500135000',
                        Email: 'qianqi@example.com',
                        Gender: '男',
                        IDCardNo: '110101199005051234',
                        IDCardType: '身份证',
                      },
                      detail: {
                        RegisterTime: '2024-01-05T10:00:00Z',
                        Type: '00',
                        ExamType: '00',
                        Status: '06',
                      },
                      reviewer: '周老师',
                    },
                    {
                      student: {
                        ID: '6',
                        OfficialName: '孙八',
                        MobilePhone: '13400134000',
                        Email: 'sunba@example.com',
                        Gender: '女',
                        IDCardNo: '110101199006061234',
                        IDCardType: '身份证',
                      },
                      detail: {
                        RegisterTime: '2024-01-06T10:00:00Z',
                        Type: '00',
                        ExamType: '00',
                        Status: '02',
                      },
                      reviewer: '吴老师',
                    },
                    {
                      student: {
                        ID: '7',
                        OfficialName: '周九',
                        MobilePhone: '13300133000',
                        Email: 'zhoujiu@example.com',
                        Gender: '男',
                        IDCardNo: '110101199007071234',
                        IDCardType: '身份证',
                      },
                      detail: {
                        RegisterTime: '2024-01-07T10:00:00Z',
                        Type: '00',
                        ExamType: '00',
                        Status: '04',
                      },
                      reviewer: '郑老师',
                    },
                    {
                      student: {
                        ID: '8',
                        OfficialName: '吴十',
                        MobilePhone: '13200132000',
                        Email: 'wushi@example.com',
                        Gender: '女',
                        IDCardNo: '110101199008081234',
                        IDCardType: '身份证',
                      },
                      detail: {
                        RegisterTime: '2024-01-08T10:00:00Z',
                        Type: '00',
                        ExamType: '00',
                        Status: '06',
                      },
                      reviewer: '王老师',
                    },
                  ],
                  total: 8,
                },
              }),
          });
        }
        return Promise.reject(new Error('Unmocked URL: ' + url));
      });

      render(EnrollManagement);

      // 等待数据加载
      await waitFor(() => {
        expect(screen.getByText('张三')).toBeInTheDocument();
        expect(screen.getByText('李四')).toBeInTheDocument();
        expect(screen.getByText('王五')).toBeInTheDocument();
        expect(screen.getByText('孙八')).toBeInTheDocument();
      });

      // 选择多个复选框（选择待审核状态的记录）
      const checkboxes = screen.getAllByRole('checkbox');
      fireEvent.click(checkboxes[1]); // 选择张三（待审核）
      fireEvent.click(checkboxes[2]); // 选择李四（待审核）
      fireEvent.click(checkboxes[3]); // 选择王五（待审核）
      fireEvent.click(checkboxes[6]); // 选择孙八（待审核）

      // 点击批量通过按钮
      const batchApproveButton = screen.getByText('批量通过');
      fireEvent.click(batchApproveButton);

      // 等待确认对话框出现
      await waitFor(() => {
        expect(screen.getByText('确认通过')).toBeInTheDocument();
      });

      // 点击确定按钮
      const confirmButton = screen.getByText('确定');
      fireEvent.click(confirmButton);

      // 验证API被调用
      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith(
          expect.stringContaining('/api/registration/approve'),
          expect.objectContaining({
            method: 'POST',
            headers: expect.objectContaining({
              'Content-Type': 'application/json',
            }),
          }),
        );
      });
    });
  });
});
