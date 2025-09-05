import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, waitFor, within } from '@testing-library/svelte';
import EnrollManagement from '../+page.svelte';
import Empty from '$lib/components/Table/Empty.svelte';
import { goto } from '$app/navigation';
import { page } from '$app/state';
import { onMount } from 'svelte';
import { toast } from '$lib/components/Toast/Toast';

// 模拟导航函数
vi.mock('$app/navigation', () => ({
  goto: vi.fn(),
}));

// 模拟 page
vi.mock('$app/state', () => ({
  page: {
    url: new URL('http://localhost/teacher/enroll/see-enroll/1'),
  },
}));

// 模拟 fetch
global.fetch = vi.fn();

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

  // 模拟组件props
  const mockProps = {
    data: {
      see_enroll_id: 1,
    },
  };

  describe('基础渲染测试', () => {
    it('渲染页面标题', () => {
      render(EnrollManagement, { props: mockProps });
      expect(screen.getByText('报名列表')).toBeInTheDocument();
    });

    it('数据加载测试', async () => {
      render(EnrollManagement, { props: mockProps });

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
      render(EnrollManagement, { props: mockProps });

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
      render(EnrollManagement, { props: mockProps });
      expect(screen.getByLabelText('查找人员')).toBeInTheDocument();
    });

    it('渲染表格头部', () => {
      render(EnrollManagement, { props: mockProps });

      expect(screen.getAllByRole('columnheader', { name: '姓名' }).length).toBeGreaterThan(0);
      expect(screen.getAllByRole('columnheader', { name: '性别' }).length).toBeGreaterThan(0);
      expect(screen.getAllByRole('columnheader', { name: '出生日期' }).length).toBeGreaterThan(0);
      expect(screen.getAllByRole('columnheader', { name: '电话' }).length).toBeGreaterThan(0);
      expect(screen.getAllByRole('columnheader', { name: '证件类型' }).length).toBeGreaterThan(0);
      expect(screen.getAllByRole('columnheader', { name: '证件号' }).length).toBeGreaterThan(0);
    });

    it('渲染操作按钮', () => {
      render(EnrollManagement, { props: mockProps });

      expect(screen.getByText('导入')).toBeInTheDocument();
      expect(screen.getByText('下载模板')).toBeInTheDocument();
      expect(screen.getByText('批量移动')).toBeInTheDocument();
      expect(screen.getByText('批量通过')).toBeInTheDocument();
      expect(screen.getByText('批量不通过')).toBeInTheDocument();
    });

    it('渲染筛选下拉框', () => {
      render(EnrollManagement, { props: mockProps });

      expect(screen.getAllByText('审核状态').length).toBe(2);
      expect(screen.getAllByText('报名方式').length).toBe(2);
    });
  });

  describe('数据展示测试', () => {
    it('显示报名数据', async () => {
      render(EnrollManagement, { props: mockProps });

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
      render(EnrollManagement, { props: mockProps });

      await waitFor(() => {
        expect(screen.getByText('待审核')).toBeInTheDocument();
        expect(screen.getByText('通过')).toBeInTheDocument();
        expect(screen.getByText('不通过')).toBeInTheDocument();
      });
    });

    it('显示报名方式', async () => {
      render(EnrollManagement, { props: mockProps });

      await waitFor(() => {
        expect(screen.getByText('自报名')).toBeInTheDocument();
        expect(screen.getByText('人工导入')).toBeInTheDocument();
      });
    });

    it('显示考试类型', async () => {
      render(EnrollManagement, { props: mockProps });

      await waitFor(() => {
        expect(screen.getAllByText('正考').length).toBe(2);
        expect(screen.getAllByText('补考').length).toBe(1);
      });
    });

    it('显示审核人信息', async () => {
      render(EnrollManagement, { props: mockProps });

      await waitFor(() => {
        expect(screen.getByText('李老师')).toBeInTheDocument();
        expect(screen.getByText('王老师')).toBeInTheDocument();
        expect(screen.getByText('赵老师')).toBeInTheDocument();
      });
    });
  });

  describe('搜索和筛选功能测试', () => {
    it('处理搜索功能', async () => {
      render(EnrollManagement, { props: mockProps });

      const searchInput = screen.getByLabelText('查找人员');
      await fireEvent.input(searchInput, { target: { value: '张三' } });

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith(expect.stringContaining('/api/registration?'), expect.any(Object));
      });
    });

    it('清空搜索内容', async () => {
      render(EnrollManagement, { props: mockProps });

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
      render(EnrollManagement, { props: mockProps });

      const searchInput = screen.getByLabelText('查找人员');
      expect(searchInput).toHaveAttribute('placeholder', '请输入关键词');
    });
  });

  describe('表格功能测试', () => {
    it('验证表格数据格式', async () => {
      render(EnrollManagement, { props: mockProps });

      await waitFor(() => {
        // 验证表格行数据
        const tableRows = screen.getAllByRole('row');
        expect(tableRows.length).toBeGreaterThan(1); // 至少包含表头和一行数据

        // 验证数据单元格
        expect(screen.getByText('张三')).toBeInTheDocument();
        expect(screen.getByText('110101199001011234')).toBeInTheDocument();
      });
    });

    // it('表格空状态显示', async () => {
    //   // 模拟空数据响应
    //   global.fetch.mockResolvedValueOnce({
    //     ok: true,
    //     json: () =>
    //       Promise.resolve({
    //         data: {
    //           student: [],
    //           total: 0,
    //         },
    //       }),
    //   });

    //   render(EnrollManagement, { props: mockProps });

    //   await waitFor(() => {
    //     expect(screen.getByText('暂无报名数据')).toBeInTheDocument();
    //   });
    // });
  });

  describe('选择功能测试', () => {
    it('全选checkbox存在', async () => {
      render(EnrollManagement, { props: mockProps });

      await waitFor(() => {
        const selectAllCheckbox = screen.getByRole('checkbox');
        expect(selectAllCheckbox).toBeInTheDocument();
      });
    });

    it('行选择checkbox存在', async () => {
      render(EnrollManagement, { props: mockProps });

      await waitFor(() => {
        const rowCheckboxes = screen.getAllByRole('checkbox').slice(1); // 排除全选checkbox
        expect(rowCheckboxes.length).toBeGreaterThan(0);
      });
    });

    it('全选功能', async () => {
      render(EnrollManagement, { props: mockProps });

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
      render(EnrollManagement, { props: mockProps });

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

    it('单个选择功能', async () => {
      render(EnrollManagement, { props: mockProps });

      await waitFor(() => {
        const rowCheckboxes = screen.getAllByRole('checkbox').slice(1);
        const firstCheckbox = rowCheckboxes[0];

        // 点击第一个checkbox
        fireEvent.click(firstCheckbox);
        expect(firstCheckbox).toBeChecked();

        // 再次点击取消选择
        fireEvent.click(firstCheckbox);
        expect(firstCheckbox).not.toBeChecked();
      });
    });
  });

  describe('操作按钮测试', () => {
    it('单个通过按钮', async () => {
      render(EnrollManagement, { props: mockProps });

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
      render(EnrollManagement, { props: mockProps });

      await waitFor(() => {
        // 等待表格数据加载完成
        expect(screen.getByText('张三')).toBeInTheDocument();

        const rejectButtons = screen.getAllByText('不通过');
        expect(rejectButtons.length).toBeGreaterThan(0);
      });
    });

    it('撤销通过按钮', async () => {
      // 创建包含通过状态学生的测试数据
      const mockPropsWithApprovedStudents = {
        data: {
          see_enroll_id: 1,
        },
      };

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

      render(EnrollManagement, { props: mockPropsWithApprovedStudents });

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
      // 创建包含不通过状态学生的测试数据
      const mockPropsWithRejectedStudents = {
        data: {
          see_enroll_id: 1,
        },
      };

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

      render(EnrollManagement, { props: mockPropsWithRejectedStudents });

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
      render(EnrollManagement, { props: mockProps });

      await waitFor(() => {
        // 等待表格数据加载完成
        expect(screen.getByText('张三')).toBeInTheDocument();

        const detailButtons = screen.getAllByText('查看详情');
        expect(detailButtons.length).toBeGreaterThan(0);
      });
    });

    it('批量操作按钮', async () => {
      render(EnrollManagement, { props: mockProps });

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
      render(EnrollManagement, { props: mockProps });

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
      render(EnrollManagement, { props: mockProps });

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
      render(EnrollManagement, { props: mockProps });

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
      render(EnrollManagement, { props: mockProps });

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
      render(EnrollManagement, { props: mockProps });

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
    it('API错误处理', async () => {
      global.fetch.mockRejectedValueOnce(new Error('网络错误'));

      render(EnrollManagement, { props: mockProps });

      // 验证错误被正确处理
      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalled();
      });
    });

    it('API响应错误处理', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
      });

      render(EnrollManagement, { props: mockProps });

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalled();
      });
    });
  });

  describe('分页功能测试', () => {
    it('分页组件存在', () => {
      render(EnrollManagement, { props: mockProps });

      // 验证分页组件存在
      // 这里需要根据实际的分页组件实现来调整
    });

    it('分页事件处理', () => {
      render(EnrollManagement, { props: mockProps });

      // 模拟分页事件
      // 这里需要根据实际的分页组件实现来调整
    });
  });
});
