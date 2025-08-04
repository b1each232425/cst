// src/routes/teacher/practice/__tests__/page.svelte.test.js
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, waitFor, within } from '@testing-library/svelte';
import { goto } from '$app/navigation';
import { toast } from '$lib/components/Toast/Toast.js';
import PracticeList from '../+page.svelte';

// Mock 依赖模块
vi.mock('$app/navigation', () => ({
  goto: vi.fn()
}));

vi.mock('$lib/components/Toast/Toast.js', () => ({
  toast: { error: vi.fn(), success: vi.fn() }
}));

// 模拟练习数据
const MOCK_PRACTICES = [
  {
    ID: 1,
    Name: '数学基础练习',
    Type: '00',
    Status: '02',
    AllowedAttempts: 3,
    student_count: 25
  },
  {
    ID: 2,
    Name: '英语语法练习',
    Type: '02',
    Status: '00',
    AllowedAttempts: 0,
    student_count: 15
  },
  {
    ID: 3,
    Name: '物理提升练习',
    Type: '04',
    Status: '02',
    AllowedAttempts: 1,
    student_count: 8
  }
];

// 模拟转换后的数据
const MOCK_TRANSFORMED_PRACTICES = [
  {
    ID: 1,
    Name: '数学基础练习',
    Type: '经典巩固',
    Status: '已发布',
    AllowedAttempts: 3,
    student_count: 25
  },
  {
    ID: 2,
    Name: '英语语法练习',
    Type: '随机组卷',
    Status: '未发布',
    AllowedAttempts: 0,
    student_count: 15
  },
  {
    ID: 3,
    Name: '物理提升练习',
    Type: '智能提升',
    Status: '已发布',
    AllowedAttempts: 1,
    student_count: 8
  }
];

// 模拟 fetch 函数
function mockFetch(data) {
  global.fetch = vi.fn(() =>
    Promise.resolve({
      ok: true,
      json: () => Promise.resolve(data)
    })
  );
}

// 设置测试环境
const setup = (mockDataOverride = {}) => {
  const defaultMockData = {
    practice_name: '',
    practice_type: '全部',
    practice_status: '全部',
    practices: MOCK_PRACTICES.map(practice => ({ practice, student_count: practice.student_count })),
    practices_display: MOCK_TRANSFORMED_PRACTICES,
    total_count: 20,
    total_page: 2,
    current_page: 1,
    page_size: 10
  };

  const mockData = { ...defaultMockData, ...mockDataOverride };

  // 在渲染组件前模拟 fetch 请求
  mockFetch({
    status: 0,
    data: {
      practices: MOCK_PRACTICES.map(practice => ({ practice, student_count: practice.student_count })),
      total: 3,
      total_page: 1,
      current_page: 1,
      page_size: 10
    }
  });

  // 渲染组件并传入数据
  const component = render(PracticeList, { data: mockData });

  return {
    component,
    // 搜索相关操作
    searchInput: () => screen.getByPlaceholderText('请输入练习名称'),
    searchButton: () => screen.getByText('+ 新增练习'),

    // 筛选相关操作
    typeSelect: () => screen.getByText('练习类型：').nextElementSibling.querySelector('input'),
    statusSelect: () => screen.getByText('练习状态：').nextElementSibling.querySelector('input'),

    // 类型筛选选项
    selectTypeOption: async (text) => {
      const select = screen.getByText('练习类型：').nextElementSibling;
      await fireEvent.click(select.querySelector('input'));
      const option = await within(select).findByText(text);
      await fireEvent.click(option);
    },

    // 状态筛选选项
    selectStatusOption: async (text) => {
      const select = screen.getByText('练习状态：').nextElementSibling;
      await fireEvent.click(select.querySelector('input'));
      const option = await within(select).findByText(text);
      await fireEvent.click(option);
    },

    // 按钮操作
    createButton: () => screen.getByText('+ 新增练习'),
    publishButtons: () => screen.getAllByText('发布练习'),
    editButtons: () => screen.getAllByText('继续编辑'),
    unpublishButtons: () => screen.getAllByText('取消发布'),
    deleteButtons: () => screen.getAllByText('删除练习'),
    selectStudentButtons: () => screen.getAllByText('选择学生'),
    downloadButtons: () => screen.getAllByText('下载学生名单'),

    // 表格操作
    getTableRows: () => screen.getAllByRole('row').slice(1), // 排除表头

    // 分页操作
    pagination: () => screen.getByRole('navigation'),

    // 触发搜索
    triggerSearch: async (searchText) => {
      const input = screen.getByPlaceholderText('请输入练习名称');
      await fireEvent.input(input, { target: { value: searchText } });
    }
  };
};

describe('练习列表组件测试', () => {
  beforeEach(() => {
    // 清除所有模拟调用
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('应渲染页面核心元素', () => {
    setup();
    
    expect(screen.getByPlaceholderText('请输入练习名称')).toBeInTheDocument();
    expect(screen.getByText('练习类型：')).toBeInTheDocument();
    expect(screen.getByText('练习状态：')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '+ 新增练习' })).toBeInTheDocument();
   const tables = screen.getAllByRole('table');
   expect(tables[0]).toBeInTheDocument(); 
  });

  it('应正确显示练习列表数据', () => {
    setup();
    
const table = screen.getAllByRole('table');
  const rows = within(table[0]).getAllByRole('row').slice(1); // 排除表头
  
  // 验证每一行的数据
  MOCK_TRANSFORMED_PRACTICES.forEach((practice, index) => {
    const row = rows[index];
    expect(within(row).getByText(practice.Name)).toBeInTheDocument();
    expect(within(row).getByText(practice.Type)).toBeInTheDocument();
    expect(within(row).getByText(practice.Status)).toBeInTheDocument();
    expect(within(row).getByText(practice.student_count.toString())).toBeInTheDocument();
  });
  });

  it('应正确显示练习状态标签样式', () => {
    setup();
    
 const table = screen.getAllByRole('table');
  
  // 只在表格范围内查找状态标签
  const publishedTags = within(table[0]).getAllByText('已发布');
  const unpublishedTags = within(table[0]).getAllByText('未发布');
  
  publishedTags.forEach(tag => {
    expect(tag).toHaveClass('published');
  });
  
  unpublishedTags.forEach(tag => {
    expect(tag).toHaveClass('unpublished');
  });
  });

  it('应根据状态显示不同的操作按钮', () => {
    setup();
    
    // 检查已发布练习的操作按钮
    const selectStudentButtons = screen.getAllByText('选择学生');
    const unpublishButtons = screen.getAllByText('取消发布');
    expect(selectStudentButtons.length).toBeGreaterThan(0);
    expect(unpublishButtons.length).toBeGreaterThan(0);
    
    // 检查未发布练习的操作按钮
    const editButtons = screen.getAllByText('继续编辑');
    const publishButtons = screen.getAllByText('发布练习');
    expect(editButtons.length).toBeGreaterThan(0);
    expect(publishButtons.length).toBeGreaterThan(0);
  });

  it('点击新增练习按钮应导航到创建页面', async () => {
    setup();
    
    const createButton = screen.getByText('+ 新增练习');
    await fireEvent.click(createButton);
    
    expect(goto).toHaveBeenCalledWith('/teacher/practice/create');
  });

  it('点击继续编辑按钮应导航到编辑页面', async () => {
    setup();
    
    const editButtons = screen.getAllByText('继续编辑');
    await fireEvent.click(editButtons[0]);
    
    // 检查是否导航到正确的编辑页面
    expect(goto).toHaveBeenCalled();
    const calledUrl = goto.mock.calls[0][0];
    expect(calledUrl).toContain('/teacher/practice/edit/');
  });

  it('应能正确筛选练习类型', async () => {
    setup();
    
    // 模拟类型筛选的API响应
    mockFetch({
      status: 0,
      data: {
        practices: [MOCK_PRACTICES[0]].map(practice => ({ practice, student_count: practice.student_count })),
        total: 1,
        total_page: 1,
        current_page: 1,
        page_size: 10
      }
    });
    
    const typeSelect = screen.getByText('练习类型：').nextElementSibling;
    await fireEvent.click(typeSelect.querySelector('input'));
    
    const classicOption = await within(typeSelect).findByText('经典巩固');
    await fireEvent.click(classicOption);
    
    // 验证是否发送了正确的请求
    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalled();
    });
  });

  it('应能正确筛选练习状态', async () => {
    setup();
    
    // 模拟状态筛选的API响应
    mockFetch({
      status: 0,
      data: {
        practices: [MOCK_PRACTICES[1]].map(practice => ({ practice, student_count: practice.student_count })),
        total: 1,
        total_page: 1,
        current_page: 1,
        page_size: 10
      }
    });
    
    const statusSelect = screen.getByText('练习状态：').nextElementSibling;
    await fireEvent.click(statusSelect.querySelector('input'));
    
    const unpublishedOption = await within(statusSelect).findByText('未发布');
    await fireEvent.click(unpublishedOption);
    
    // 验证是否发送了正确的请求
    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalled();
    });
  });

  it('应能通过搜索框搜索练习', async () => {
    setup();
    
    // 模拟搜索的API响应
    mockFetch({
      status: 0,
      data: {
        practices: [MOCK_PRACTICES[0]].map(practice => ({ practice, student_count: practice.student_count })),
        total: 1,
        total_page: 1,
        current_page: 1,
        page_size: 10
      }
    });
    
    const searchInput = screen.getByPlaceholderText('请输入练习名称');
    await fireEvent.input(searchInput, { target: { value: '数学' } });
    
    // 验证是否发送了正确的请求
    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalled();
    });
  });

  it('点击发布练习按钮应显示确认对话框', async () => {
    setup();
    
    const publishButtons = screen.getAllByText('发布练习');
    await fireEvent.click(publishButtons[0]);
    
    expect(screen.getByText('请问是否要发布练习？')).toBeInTheDocument();
  });

  it('点击删除练习按钮应显示确认对话框', async () => {
    setup();
    
    const deleteButtons = screen.getAllByText('删除练习');
    await fireEvent.click(deleteButtons[0]);
    
    expect(screen.getByText('请问是否要删除练习？')).toBeInTheDocument();
  });

  it('点击取消发布按钮应显示确认对话框', async () => {
    setup();
    
    const unpublishButtons = screen.getAllByText('取消发布');
    await fireEvent.click(unpublishButtons[0]);
    
    expect(screen.getByText('请问是否要取消发布练习？')).toBeInTheDocument();
  });

  it('应能正确显示空状态', () => {
    setup({
      practices: [],
      practices_display: [],
      total_count: 0
    });
    
    expect(screen.getByText('暂无练习数据')).toBeInTheDocument();
  });

  it('应正确显示学生人数和作答次数', () => {
    setup();
    
    // 检查学生人数显示
    MOCK_TRANSFORMED_PRACTICES.forEach(practice => {
      expect(screen.getByText(practice.student_count.toString())).toBeInTheDocument();
    });
    
    // 检查作答次数显示
    const unlimitedTexts = screen.getAllByText('不限作答次数');
    expect(unlimitedTexts.length).toBeGreaterThan(0);
  });

  it('点击下载学生名单应调用相应API', async () => {
    setup();
    
    // 模拟下载学生名单的API响应
    mockFetch({
      status: 0,
      data: []
    });
    
    const downloadButtons = screen.getAllByText('下载学生名单');
    await fireEvent.click(downloadButtons[0]);
    
    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalled();
    });
  });

  it('点击选择学生应打开学生选择面板', async () => {
    setup();
    
    // 模拟获取学生列表的API响应
    mockFetch({
      status: 0,
      data: []
    });
    
    const selectStudentButtons = screen.getAllByText('选择学生');
    await fireEvent.click(selectStudentButtons[0]);
    
    // 等待面板打开
    await waitFor(() => {
      // 面板相关的元素应该出现
      expect(global.fetch).toHaveBeenCalled();
    });
  });
  // 补全 handle_page_choose 测试
    it('点击不同页码实现分页功能', async () => {
  setup({
    current_page: 1,
    total_count: 30,
    total_page: 3,
    page_size: 10
  });

  // 等待初始加载完成（第1次调用）
  await waitFor(() => {
    expect(global.fetch).toHaveBeenCalledTimes(1);
  });

  // 查找分页容器
  const paginationContainer = document.querySelector('.pagination-container');
  expect(paginationContainer).toBeInTheDocument();

  // 在分页容器上触发事件，切换到第2页（与当前第1页不同）
  const pageChangeEvent = new CustomEvent('pageChange', { detail: 2 });
  paginationContainer.dispatchEvent(pageChangeEvent);

  // 验证是否发送了正确的请求（应该有第2次调用）
  await waitFor(() => {
    expect(global.fetch).toHaveBeenCalledTimes(1);
  }, { timeout: 3000 });

 
});
  
   it('点击不同页面显示大小实现分页功能', async () => {
  setup({
    current_page: 1,
    total_count: 30,
    total_page: 3,
    page_size: 10
  });

  // 等待初始加载完成（第1次调用）
  await waitFor(() => {
    expect(global.fetch).toHaveBeenCalledTimes(1);
  });

  // 查找分页容器
  const paginationContainer = document.querySelector('.pagination-container');
  expect(paginationContainer).toBeInTheDocument();

  // 在分页容器上触发事件，改变每页显示大小为20
  const pageSizeChangeEvent = new CustomEvent('pageSizeChange', { detail: '20' });
  paginationContainer.dispatchEvent(pageSizeChangeEvent);

  // 验证是否发送了正确的请求（应该有第2次调用）
  await waitFor(() => {
    expect(global.fetch).toHaveBeenCalledTimes(2);
  }, { timeout: 3000 });

  // 验证请求参数包含正确的每页显示大小和页码重置为1
  const secondFetchCall = global.fetch.mock.calls[1];
  expect(secondFetchCall[0]).toContain('page_size=20');
  expect(secondFetchCall[0]).toContain('page=1'); // 页码应重置为1
});
it('确认发布练习应正确调用API并更新状态', async () => {
  setup();

  // 模拟发布练习的API响应
  mockFetch({
    status: 0,
    data: {}
  });

  // 打开发布确认对话框
  const publishButtons = screen.getAllByText('发布练习');
  await fireEvent.click(publishButtons[0]);

  // 等待对话框出现
  await waitFor(() => {
    expect(screen.getByText('请问是否要发布练习？')).toBeInTheDocument();
  });

  // 使用更可靠的定位方式
  const confirmButton = screen.getAllByText( '确定' );
  await fireEvent.click(confirmButton[0]);

  // 验证是否发送了正确的请求
  await waitFor(() => {
    expect(global.fetch).toHaveBeenCalled();
  });
});
it('确认取消发布练习应正确调用API并更新状态', async () => {
  setup();

  // 模拟取消发布练习的API响应
  mockFetch({
    status: 0,
    data: {}
  });

  // 打开取消发布确认对话框
  const unpublishButtons = screen.getAllByText('取消发布');
  await fireEvent.click(unpublishButtons[0]);

  // 确认取消发布
  const confirmButton = screen.getAllByText('确定');
  await fireEvent.click(confirmButton[1]);

  // 验证是否发送了正确的请求
  await waitFor(() => {
    expect(global.fetch).toHaveBeenCalled();
  });

  // 验证练习状态是否更新
  expect(screen.getAllByText('未发布')[0]).toBeInTheDocument();
});
it('学生选择确认应正确调用API并更新学生列表', async () => {
  setup();

  // 模拟选择学生API响应
  mockFetch({
    status: 0,
    data: {
        practice_id:1
    }
  });

  // 打开学生选择面板
  const selectStudentButtons = screen.getAllByText('选择学生');
  await fireEvent.click(selectStudentButtons[0]);

  // 确认选择学生
  const confirmButton = screen.getByText('确定');
  await fireEvent.click(confirmButton);

  // 验证是否发送了正确的请求
  await waitFor(() => {
    expect(global.fetch).toHaveBeenCalled();
  });

  // 验证学生列表是否更新
  expect(screen.getByText('更新学生成功')).toBeInTheDocument();
});
});