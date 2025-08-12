import { render, fireEvent, waitFor, screen } from '@testing-library/svelte';
import DiaryLogPanel from '$lib/components/DiaryLogPanel/DiaryLogPanel.svelte';
import { vi } from 'vitest';

// 模拟静态日志数据
const staticLogs = [
  {
    id: 1,
    module: 'User Management',
    entity_id: 123,
    content: ['创建了一个新用户'],
    creator: 456,
    creator_account: 'admin',
    creator_name: '张三',
    create_time: '2025-07-25 12:00:00',
  },
  {
    id: 2,
    module: 'Product Management',
    entity_id: 456,
    content: ['修改了产品信息'],
    creator: 789,
    creator_account: 'editor',
    creator_name: '李四',
    create_time: '2025-07-25 14:00:00',
  },
  {
    id: 3,
    module: 'Order Management',
    entity_id: 789,
    content: ['创建了一个订单'],
    creator: 101,
    creator_account: 'manager',
    creator_name: '王五',
    create_time: '2025-07-26 08:00:00',
  },
  {
    id: 4,
    module: 'Inventory Management',
    entity_id: 101,
    content: ['更新了库存'],
    creator: 102,
    creator_account: 'superadmin',
    creator_name: '赵六',
    create_time: '2025-07-26 10:00:00',
  },
  {
    id: 5,
    module: 'User Management',
    entity_id: 123,
    content: ['删除了一个用户'],
    creator: 456,
    creator_account: 'admin',
    creator_name: '张三',
    create_time: '2025-07-26 11:00:00',
  },
  {
    id: 6,
    module: 'Product Management',
    entity_id: 456,
    content: ['新增了产品'],
    creator: 789,
    creator_account: 'editor',
    creator_name: '李四',
    create_time: '2025-07-27 12:00:00',
  },
  {
    id: 7,
    module: 'Order Management',
    entity_id: 789,
    content: ['修改了订单状态'],
    creator: 101,
    creator_account: 'manager',
    creator_name: '王五',
    create_time: '2025-07-27 15:00:00',
  },
  {
    id: 8,
    module: 'Inventory Management',
    entity_id: 101,
    content: ['库存警告，库存不足'],
    creator: 102,
    creator_account: 'superadmin',
    creator_name: '赵六',
    create_time: '2025-07-27 16:00:00',
  },
  {
    id: 9,
    module: 'User Management',
    entity_id: 123,
    content: ['更新了用户资料'],
    creator: 456,
    creator_account: 'admin',
    creator_name: '张三',
    create_time: '2025-07-28 09:00:00',
  },
  {
    id: 10,
    module: 'Product Management',
    entity_id: 456,
    content: ['下架了产品'],
    creator: 789,
    creator_account: 'editor',
    creator_name: '李四',
    create_time: '2025-07-28 10:00:00',
  },
  {
    id: 11,
    module: 'Order Management',
    entity_id: 789,
    content: ['取消了订单'],
    creator: 101,
    creator_account: 'manager',
    creator_name: '王五',
    create_time: '2025-07-28 11:00:00',
  },
  {
    id: 12,
    module: 'Inventory Management',
    entity_id: 101,
    content: ['调整库存数量'],
    creator: 102,
    creator_account: 'superadmin',
    creator_name: '赵六',
    create_time: '2025-07-29 12:00:00',
  },
];

// 模拟分页请求函数
const fetchLogsFunc = vi.fn().mockResolvedValue({
  data: staticLogs,
  total: staticLogs.length,
});

describe('DiaryLogPanel Component', () => {
  beforeEach(() => {
    // 在每个测试前，清空所有的模拟
    vi.restoreAllMocks();

    fetchLogsFunc.mockResolvedValue({
      data: staticLogs,
      total: staticLogs.length,
    });
  });

  it('应正确展示静态数据', async () => {
    const { component } = render(DiaryLogPanel);

    // 获取组件实例
    const operationLogPanel = component;

    // 调用 showLogPanel 显示日志
    await operationLogPanel.showLogPanel(staticLogs);

    // 测试日志内容是否显示
    expect(screen.getByText('创建了一个新用户')).toBeInTheDocument();
    expect(screen.getByText('修改了产品信息')).toBeInTheDocument();
    expect(screen.getByText('创建了一个订单')).toBeInTheDocument();
    expect(screen.getByText('更新了库存')).toBeInTheDocument();
    expect(screen.getByText('删除了一个用户')).toBeInTheDocument();
    expect(screen.getByText('新增了产品')).toBeInTheDocument();
    expect(screen.getByText('修改了订单状态')).toBeInTheDocument();
    expect(screen.getByText('库存警告，库存不足')).toBeInTheDocument();
    expect(screen.getByText('更新了用户资料')).toBeInTheDocument();
    expect(screen.getByText('下架了产品')).toBeInTheDocument();
    expect(screen.queryByText('取消了订单')).not.toBeInTheDocument();
    expect(screen.queryByText('调整库存数量')).not.toBeInTheDocument();
  });

  it('应正确处理静态数据分页', async () => {
    const { component } = render(DiaryLogPanel);

    // 获取组件实例
    const operationLogPanel = component;

    // 调用 showLogPanel 显示日志
    await operationLogPanel.showLogPanel(staticLogs);

    // 测试日志内容是否正确显示
    expect(screen.getByText('创建了一个新用户')).toBeInTheDocument();
    expect(screen.getByText('修改了产品信息')).toBeInTheDocument();
    expect(screen.getByText('创建了一个订单')).toBeInTheDocument();
    expect(screen.getByText('更新了库存')).toBeInTheDocument();
    expect(screen.getByText('删除了一个用户')).toBeInTheDocument();
    expect(screen.getByText('新增了产品')).toBeInTheDocument();
    expect(screen.getByText('修改了订单状态')).toBeInTheDocument();
    expect(screen.getByText('库存警告，库存不足')).toBeInTheDocument();
    expect(screen.getByText('更新了用户资料')).toBeInTheDocument();
    expect(screen.getByText('下架了产品')).toBeInTheDocument();
    expect(screen.queryByText('取消了订单')).not.toBeInTheDocument();
    expect(screen.queryByText('调整库存数量')).not.toBeInTheDocument();

    // 点击分页器跳转到第二页
    fireEvent.click(screen.getByRole('button', { name: '2' }));

    // 测试日志内容是否正确显示
    expect(screen.queryByText('创建了一个新用户')).not.toBeInTheDocument();
    expect(screen.queryByText('修改了产品信息')).not.toBeInTheDocument();
    expect(screen.queryByText('创建了一个订单')).not.toBeInTheDocument();
    expect(screen.queryByText('更新了库存')).not.toBeInTheDocument();
    expect(screen.queryByText('删除了一个用户')).not.toBeInTheDocument();
    expect(screen.queryByText('新增了产品')).not.toBeInTheDocument();
    expect(screen.queryByText('修改了订单状态')).not.toBeInTheDocument();
    expect(screen.queryByText('库存警告，库存不足')).not.toBeInTheDocument();
    expect(screen.queryByText('更新了用户资料')).not.toBeInTheDocument();
    expect(screen.queryByText('下架了产品')).not.toBeInTheDocument();
    expect(screen.queryByText('取消了订单')).toBeInTheDocument();
    expect(screen.queryByText('调整库存数量')).toBeInTheDocument();
  });

  it('应正确展示动态数据', async () => {
    fetchLogsFunc.mockResolvedValue({
      data: staticLogs.slice(0, 10),
      total: staticLogs.length,
    });

    const { component } = render(DiaryLogPanel);

    // 获取组件实例
    const operationLogPanel = component;

    // 调用 showLogPanelWithPagination 显示日志
    await operationLogPanel.showLogPanelWithPagination(fetchLogsFunc);

    // 测试日志内容是否显示
    expect(screen.getByText('创建了一个新用户')).toBeInTheDocument();
    expect(screen.getByText('修改了产品信息')).toBeInTheDocument();
    expect(screen.getByText('创建了一个订单')).toBeInTheDocument();
    expect(screen.getByText('更新了库存')).toBeInTheDocument();
    expect(screen.getByText('删除了一个用户')).toBeInTheDocument();
    expect(screen.getByText('新增了产品')).toBeInTheDocument();
    expect(screen.getByText('修改了订单状态')).toBeInTheDocument();
    expect(screen.getByText('库存警告，库存不足')).toBeInTheDocument();
    expect(screen.getByText('更新了用户资料')).toBeInTheDocument();
    expect(screen.getByText('下架了产品')).toBeInTheDocument();
    expect(screen.queryByText('取消了订单')).not.toBeInTheDocument();
    expect(screen.queryByText('调整库存数量')).not.toBeInTheDocument();
  });

  it('应正确处理动态数据分页', async () => {
    fetchLogsFunc.mockResolvedValue({
      data: staticLogs.slice(0, 10),
      total: staticLogs.length,
    });

    const { component } = render(DiaryLogPanel);

    // 获取组件实例
    const operationLogPanel = component;

    // 调用 showLogPanelWithPagination 显示日志
    await operationLogPanel.showLogPanelWithPagination(fetchLogsFunc);

    // 测试日志内容是否正确显示
    expect(screen.getByText('创建了一个新用户')).toBeInTheDocument();
    expect(screen.getByText('修改了产品信息')).toBeInTheDocument();
    expect(screen.getByText('创建了一个订单')).toBeInTheDocument();
    expect(screen.getByText('更新了库存')).toBeInTheDocument();
    expect(screen.getByText('删除了一个用户')).toBeInTheDocument();
    expect(screen.getByText('新增了产品')).toBeInTheDocument();
    expect(screen.getByText('修改了订单状态')).toBeInTheDocument();
    expect(screen.getByText('库存警告，库存不足')).toBeInTheDocument();
    expect(screen.getByText('更新了用户资料')).toBeInTheDocument();
    expect(screen.getByText('下架了产品')).toBeInTheDocument();
    expect(screen.queryByText('取消了订单')).not.toBeInTheDocument();
    expect(screen.queryByText('调整库存数量')).not.toBeInTheDocument();

    // 点击分页器跳转到第二页
    fireEvent.click(screen.getByRole('button', { name: '2' }));

    fetchLogsFunc.mockResolvedValue({
      data: staticLogs.slice(10, 12),
      total: staticLogs.length,
    });

    // 调用 showLogPanelWithPagination 刷新日志
    await operationLogPanel.showLogPanelWithPagination(fetchLogsFunc);

    // 测试日志内容是否正确显示
    expect(screen.queryByText('创建了一个新用户')).not.toBeInTheDocument();
    expect(screen.queryByText('修改了产品信息')).not.toBeInTheDocument();
    expect(screen.queryByText('创建了一个订单')).not.toBeInTheDocument();
    expect(screen.queryByText('更新了库存')).not.toBeInTheDocument();
    expect(screen.queryByText('删除了一个用户')).not.toBeInTheDocument();
    expect(screen.queryByText('新增了产品')).not.toBeInTheDocument();
    expect(screen.queryByText('修改了订单状态')).not.toBeInTheDocument();
    expect(screen.queryByText('库存警告，库存不足')).not.toBeInTheDocument();
    expect(screen.queryByText('更新了用户资料')).not.toBeInTheDocument();
    expect(screen.queryByText('下架了产品')).not.toBeInTheDocument();
    expect(screen.queryByText('取消了订单')).toBeInTheDocument();
    expect(screen.queryByText('调整库存数量')).toBeInTheDocument();
  });

  test('无数据时应正确展示', async () => {
    const { component } = render(DiaryLogPanel);

    // 获取组件实例
    const operationLogPanel = component;

    // 调用 showLogPanelWithPagination 显示空数据
    await operationLogPanel.showLogPanelWithPagination(
      vi.fn().mockResolvedValue({
        data: [],
        total: 0,
      }),
    );

    // 测试“暂无日志数据”是否显示
    expect(screen.getByText('暂无日志数据')).toBeInTheDocument();
  });
});
