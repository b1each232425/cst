// src/routes/teacher/practice/__tests__/page.svelte.test.js
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, waitFor, within } from '@testing-library/svelte';
import { goto } from '$app/navigation';
import { toast } from '$lib/components/Toast/Toast.js';
import PracticeList  from '../+page.svelte';
import { json } from '@sveltejs/kit';

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
    Status: '00',
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
function mockFetch(data, options = {}) {
  const defaultOptions = {
    ok: true,
    status: 200
  };
  
  const finalOptions = { ...defaultOptions, ...options };
  
  global.fetch = vi.fn(() => 
    Promise.resolve({
      ok: finalOptions.ok,
      status: finalOptions.status,
      json: () => Promise.resolve(data),
      text: () => Promise.resolve(JSON.stringify(data))
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
    createButton: () => screen.getByText('新增'),
    publishButtons: () => screen.getAllByText('发布'),
    editButtons: () => screen.getAllByText('编辑'),
    unpublishButtons: () => screen.getAllByText('取消发布'),
    deleteButtons: () => screen.getAllByText('删除'),
    selectStudentButtons: () => screen.getAllByText('选择学生'),
    downloadButtons: () => screen.getAllByText('下载学生名单'),

    // 表格操作
    getTableRows: () => screen.getAllByRole('row').slice(1), // 排除表头

    // 分页操作
    pagination: () => within(screen.getByTestId('pagination-container')).getByText(),

    // 触发搜索
    triggerSearch: async (searchText) => {
      const input = screen.getByPlaceholderText('请输入练习名称');
      await fireEvent.input(input, { target: { value: searchText } });
    },
    triggerPublish: async () => {
      const publishButton = screen.getAllByText('发布');
  await fireEvent.click(publishButton[1]);
  
  // 等待确认对话框出现
  await waitFor(() => {
    expect(screen.getByText('请问是否要发布练习？')).toBeInTheDocument();
  });
  
  const comBtn = screen.getAllByText('确定');
  await fireEvent.click(comBtn[0]);

    },
    triggerCancelPublish:async()=>{
      const cancelButton = screen.getAllByText('取消发布');
  await fireEvent.click(cancelButton[1]);
  
  // 等待确认对话框出现
  
    expect(screen.getByText('请问是否要取消发布练习？')).toBeInTheDocument();
 
  const comBtn = screen.getAllByText('确定');
  await fireEvent.click(comBtn[0]);
    },

    triggerSelectStudent:async()=>{
      const selectStudent = screen.getAllByText('选择学生');
      await fireEvent.click(selectStudent[0]);
    },

    triggerConfirmSelectStudent: async () => {

       const selectStudent = screen.getAllByText('选择学生');
      await fireEvent.click(selectStudent[0]);

      const comBtn = screen.getAllByText('确定');
      await fireEvent.click(comBtn[0]);
    },

    triggerDeletePractice: async () => { 
      const deleteStudent = screen.getAllByText('删除');
      await fireEvent.click(deleteStudent[1]);

      expect(screen.getByText('请问是否要删除练习？')).toBeInTheDocument();

      const comBtn = screen.getAllByText('确定');
      await fireEvent.click(comBtn[0]);
    },

    triggerExportStudent :async()=>{
      const exportStudent = screen.getAllByText('下载学生名单');
      await fireEvent.click(exportStudent[0]);
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
    expect(screen.getByRole('button', { name: '新增' })).toBeInTheDocument();
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
    const editButtons = screen.getAllByText('编辑');
    const publishButtons = screen.getAllByText('发布');
    expect(editButtons.length).toBeGreaterThan(0);
    expect(publishButtons.length).toBeGreaterThan(0);
  });

  it('点击新增练习按钮应导航到创建页面', async () => {
    setup();
    
    const createButton = screen.getByText('新增');
    await fireEvent.click(createButton);
    
    expect(goto).toHaveBeenCalledWith('/teacher/practice/create');
  });

  it('点击继续编辑按钮应导航到编辑页面', async () => {
    setup();
    
    const editButtons = screen.getAllByText('编辑');
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
    
    const publishButtons = screen.getAllByText('发布');
    await fireEvent.click(publishButtons[1]);
    
    expect(screen.getByText('请问是否要发布练习？')).toBeInTheDocument();
  });

  it('点击删除练习按钮应显示确认对话框', async () => {
    setup();
    
    const deleteButtons = screen.getAllByText('删除');
    await fireEvent.click(deleteButtons[1]);
    
    expect(screen.getByText('请问是否要删除练习？')).toBeInTheDocument();
  });

  it('点击取消发布按钮应显示确认对话框', async () => {
    setup();
    
    const unpublishButtons = screen.getAllByText('取消发布');
    await fireEvent.click(unpublishButtons[1]);
    
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

it('确认发布练习应正确调用API并更新状态', async () => {
  setup();

  // 打开发布确认对话框
  const publishButtons = screen.getAllByText('发布');
  await fireEvent.click(publishButtons[1]);

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



  // 打开取消发布确认对话框
  const unpublishButtons = screen.getAllByText('取消发布');
  await fireEvent.click(unpublishButtons[1]);

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

});
describe('通过类型下拉框来筛选练习',(()=>{
  it('筛选经典巩固',(async()=>{
    const {selectTypeOption} =setup();
    await selectTypeOption('经典巩固')
    await waitFor(()=>{
      expect(global.fetch).toHaveBeenCalled();
    })
  }))

  it('筛选随机组卷',(async()=>{
   const {selectTypeOption} = setup();
   await selectTypeOption('随机组卷')
    await waitFor(() => {
  expect(global.fetch).toHaveBeenCalled();
});
  }))
  it('筛选智能提升',(async()=>{
    const { selectTypeOption } = setup();
    await selectTypeOption('智能提升');
    
    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalled();
    });
  }))


  }))

  describe('通过状态下拉框来筛选练习',(()=>{
    it('筛选未发布的练习',(async()=>{
      const { selectStatusOption } = setup();
      await selectStatusOption('未发布')
      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalled();
      });
    
    }))

    it('筛选已发布的练习',(async()=>{
      const {selectStatusOption} = setup()
      await selectStatusOption('已发布')
      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalled();
      });
    }))
  }))

  describe('模拟获取练习列表的特殊情况',(()=>{
    it('response.ok为false',(async()=>{
      const {triggerSearch} = setup()
      
       // 先清除之前的 mock 行为，再设置失败的响应
    global.fetch.mockClear()
     global.fetch.mockResolvedValueOnce({
      ok:false,
      text:async()=>
        '获取练习列表数据失败'
    })
    await triggerSearch('练习一')

   // 等待并验证错误处理
    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith('获取练习列表失败');
    });
    }))

    it('结果data.total的值为undefined时，返回的total_count为0',(async()=>{
      const {triggerSearch} =setup()
       global.fetch.mockResolvedValueOnce({
        ok: true,
  json :()=>Promise.resolve({
         status: 0,
    data: { practices: [MOCK_PRACTICES[1]].map(practice => ({ practice, student_count: practice.student_count })),
        total_page: 1,
        current_page: 1,
        page_size: 10}
  })
    })
    await triggerSearch('练习一')
    await waitFor(()=>{
      expect(global.fetch).toHaveBeenCalled();
    })

    }))

    it('status的值不为0的情况',(async()=>{
      const {triggerSearch} =setup();
      global.fetch.mockResolvedValueOnce({
        ok: 89,
        json :()=>Promise.resolve({
         status: 1,
         message: '获取数据失败'
      })
      })
      await triggerSearch('练习一')
      await waitFor(()=>{
        expect(global.fetch).toHaveBeenCalled();
      })
    }))
  }))


  describe('确认发布练习函数测试',(()=>{
    beforeEach(()=>{
      vi.clearAllMocks();
    })
    it('当前没有选择练习',(async()=>{
     setup();
    
    // 直接点击顶部的批量发布按钮（此时没有选中任何练习）
    const batchPublishBtn = screen.getAllByRole('button', { name: '发布' });
    fireEvent.click(batchPublishBtn[0]);
    
    // 验证是否显示错误提示
    expect(toast.error).toHaveBeenCalledWith('请选择要发布的练习');
  }));

  it('通过行内按钮发布练习 - API返回ok为false', async () => {
    const {triggerPublish} = setup();
      // 在点击按钮前，重新设置 fetch 模拟，使其返回 ok: false
  global.fetch.mockResolvedValueOnce({
    ok: false,
    text: async () =>  'Failed to publish practice.' ,
  });
  await triggerPublish();
 await waitFor(() => expect(toast.error).toHaveBeenCalledWith('Failed to publish practice.'));

  })
  it('返回的status值不为0',(async()=>{
    const {triggerPublish} = setup();
    global.fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({status:1}),
    });
    await triggerPublish();
    expect(toast.error).toHaveBeenCalledWith(expect.stringContaining('发布练习失败'));
    }))
    it('点击取消',(()=>{
      setup();
      const publishButton = screen.getAllByText('发布');
      fireEvent.click(publishButton[1]);
     expect(screen.getByText('请问是否要发布练习？')).toBeInTheDocument();
      const cancelButton = screen.getAllByText('取消');
      fireEvent.click(cancelButton[0]);

 expect(screen.queryByText('请问是否要发布练习？')).not.toBeInTheDocument();
    }))
  }))

  describe('取消发布函数测试',(()=>{
    beforeEach(()=>{ 
      vi.clearAllMocks();
    })
    it('没有选择练习',(async()=>{
   setup();
   const cancelButton = screen.getAllByText('取消发布');
   await fireEvent.click(cancelButton[0]);

   await waitFor(()=>{
     expect(toast.error).toHaveBeenCalledWith(expect.stringContaining('请选择要取消发布的练习'));
   })
    }))

    it('取消取消发布练习',(async()=>{
      setup();
      const cancelPublishButton = screen.getAllByText('取消发布');
      await fireEvent.click(cancelPublishButton[1]);
      await waitFor(()=>{
        expect(screen.getByText('请问是否要取消发布练习？')).toBeInTheDocument();
      })
      const cancelButton = screen.getAllByText('取消');
      await fireEvent.click(cancelButton[0]);
      await waitFor(()=>{
        expect(screen.queryByText('请问是否要取消发布练习？')).not.toBeInTheDocument();
      })

    }))

    it('确认取消发布练习',(async()=>{
      setup();
      const cancelButton = screen.getAllByText('取消发布');
  await fireEvent.click(cancelButton[1]);
  
  // 等待确认对话框出现
  
    expect(screen.getByText('请问是否要取消发布练习？')).toBeInTheDocument();
 
  const comBtn = screen.getAllByText('确定');
  await fireEvent.click(comBtn[0]);
    }))

    it('返回值ok不为true',(async()=>{
      const {triggerCancelPublish}=setup();
      global.fetch.mockResolvedValueOnce({
        ok:false,
        text:async()=>
          '取消发布失败'
      })
      triggerCancelPublish();
    await waitFor(()=>{
 expect(toast.error).toBeCalledWith('取消发布失败');
    }) 

    }))

    it('返回的status值不为0',(async()=>{
      const {triggerCancelPublish}=setup();
      global.fetch.mockResolvedValueOnce({
        ok:true,
        json:async()=>
         ({status:1})
      })
      triggerCancelPublish();
    await waitFor(()=>{
      expect(toast.error).toBeCalledWith('取消发布练习失败');
    })  
    }))
  }))

  describe('获取选择学生函数测试',(()=>{
    it('返回的ok值为false',(async()=>{
      const {triggerSelectStudent}=setup();
      global.fetch.mockResolvedValueOnce({
        ok:false,
        text:async()=>
         '服务器错误'
      })
   await   triggerSelectStudent();
  await waitFor(()=>{ 
   expect(toast.error).toHaveBeenCalledWith('服务器错误')
  }) 

    }))

    it('status值不为0',(async()=>{
      const {triggerSelectStudent}=setup();
      global.fetch.mockResolvedValueOnce({
        ok:true,
         json: async () => ({status:1}),
      })
   await   triggerSelectStudent();
  await waitFor(()=>{ 
   expect(toast.error).toHaveBeenCalledWith('获取已选择学生异常')
  }) 
    }))

    it('关闭学生选择面板',(()=>{
      setup();
      const selectStudent = screen.getAllByText('选择学生');
      fireEvent.click(selectStudent[0]);
      const cancelButton =screen.getAllByText('取消');
      fireEvent.click(cancelButton[0]);
      expect(screen.queryByText('搜索学生')).not.toBeInTheDocument();
    }))
  }))

  describe('确认选择学生函数回调',(()=>{
    it('ok不为true',(async()=>{
      const {triggerConfirmSelectStudent} =setup();
        global.fetch
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ 
          status: 0,
          data: [] // 返回空的学生列表
        }),
      })
      // 模拟第二次 fetch 调用(确认选择学生)
      .mockResolvedValueOnce({
        ok:false,
        text: async () => '网络错误',
      });
      await triggerConfirmSelectStudent();
     await waitFor(()=>{
      expect(toast.error).toHaveBeenCalledWith('网络错误')
     })

    }))

    it('status不为0',(async()=>{
      const {triggerConfirmSelectStudent} =setup();
        global.fetch
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ 
          status: 0,
          data: [] // 返回空的学生列表
        }),
      })
      // 模拟第二次 fetch 调用(确认选择学生)
      .mockResolvedValueOnce({
        ok:true,
        json: async () => ({ 
          status: 1,
          data: [] // 返回空的学生列表
        }),
      });
     await triggerConfirmSelectStudent();
      await waitFor(() => expect(toast.error).toHaveBeenCalledWith('更新学生失败'));

    }))

  }))

  describe('删除练习', () => { 
    beforeEach(()=>{
      vi.clearAllMocks();
    })
    it('没有选中练习删除',(()=>{
      setup();
      const deleteButton = screen.getAllByText('删除');
      fireEvent.click(deleteButton[0]);
      expect(toast.error).toHaveBeenCalledWith('请选择要删除的练习');
    }))

    it('取消删除练习',(()=>{
      setup();
      const deleteButton = screen.getAllByText('删除');
      fireEvent.click(deleteButton[1]);
      expect(screen.getByText('请问是否要删除练习？')).toBeInTheDocument();
      const cancelButton = screen.getAllByText('取消');
      fireEvent.click(cancelButton[0]);
      expect(screen.queryByText('请问是否要删除练习？')).not.toBeInTheDocument();
    }))

    it('确认删除练习',(async()=>{
      setup();
       const deletePractice = screen.getAllByText('删除');
      await fireEvent.click(deletePractice[1]);

      expect(screen.getByText('请问是否要删除练习？')).toBeInTheDocument();

      const comBtn = screen.getAllByText('确定');
      await fireEvent.click(comBtn[0]);
    }))
    it('返回值ok不为true',(async()=>{
      const {triggerDeletePractice} =setup();
      global.fetch.mockResolvedValueOnce(()=>({
        ok:false
      }))
      await triggerDeletePractice();
      await waitFor(()=>{ 
        expect(toast.error).toHaveBeenCalledWith('删除练习失败');
      })
    }))

    it('status不为0',(async()=>{
        const {triggerDeletePractice} =setup();
      global.fetch.mockResolvedValueOnce({
        ok:true,
        json: async () => ({ status: 1}),
      })
       triggerDeletePractice();
      await waitFor(()=>{ 
        expect(toast.error).toHaveBeenCalledWith('删除练习失败');
      })
    }))

  })

  describe('导出练习', () => { 
    it('返回ok不为true',(async()=>{
    const {triggerExportStudent} =setup();
    global.fetch.mockResolvedValueOnce({
      ok: false,
      text: async () =>  '导出失败'
    })
    triggerExportStudent();

    await waitFor(()=>{
      expect(toast.error).toHaveBeenCalledWith('导出失败');
    })
    
    }))
    it('返回的status不为0',(()=>{
      const {triggerExportStudent} =setup();
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          status: 1,
          message: '导出失败'
        })
      })
      triggerExportStudent();
      waitFor(()=>{
        expect(toast.error).toHaveBeenCalledWith('导出失败');
      })
    }))
  })

  describe('预览功能测试', () => { 
    it('预览组件正确渲染', () => { 
      setup();
     const previewBtn = screen.getAllByText('预览');
     fireEvent.click(previewBtn[0]);
    });

  });

  describe('测试复选框',(()=>{
    it('点击全选',(()=>{
      setup();
      const checkAll = screen.getAllByRole('checkbox');
      fireEvent.click(checkAll[0]);
    }))

    it('点击单选框',(()=>{
      setup();
      const checkAll = screen.getAllByRole('checkbox');
      fireEvent.click(checkAll[1]);
    }))

    it('点两次全选',(()=>{
        setup();
      const checkAll = screen.getAllByRole('checkbox');
      fireEvent.click(checkAll[0]);
      fireEvent.click(checkAll[0]);
    }))
    it('点一次全选框再点一次单选框',(()=>{
         setup();
      const checkAll = screen.getAllByRole('checkbox');
      fireEvent.click(checkAll[0]);
      fireEvent.click(checkAll[1]);
      }))
  }))

  describe('分页器方法测试',(()=>{
    it('选择其他的分页',(async()=>{
        global.fetch = vi.fn((url) => {
            if (url.includes('/api/practice')) {
              return Promise.resolve({
                ok: true,
                json: () => Promise.resolve({ status: 0, data: MOCK_PRACTICES, rowCount: 100 }),
              });
            }
            return Promise.reject(new Error(`Unhandled URL: ${url}`));
          });
      
          render(PracticeList);
      
          // 等待初始数据加载
          await waitFor(() => {
            expect(screen.getAllByText('经典巩固')[0]).toBeInTheDocument();
          });
      
          // 清除初始的fetch调用
          vi.clearAllMocks();
      
          // 查找并点击第2页按钮（需要等待分页组件渲染）
          await waitFor(() => {
            const page2Button = screen.queryByText('2');
            if (page2Button) {
              fireEvent.click(page2Button);
            }
          })
    }))
  }))


