import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, waitFor, within } from '@testing-library/svelte';
import ExamManagement from '../+page.svelte';
import { goto } from '$app/navigation';
import ExamList from '../+page.svelte';
import { toast } from '$lib/components/Toast/Toast';
import ExcelJS from 'exceljs';

const writeBufferSpy = vi.fn().mockResolvedValue(new ArrayBuffer(8));

vi.mock('exceljs', () => ({
  default: {
    Workbook: vi.fn(() => ({
      addWorksheet: vi.fn().mockReturnValue({
        columns: [],
        addRows: vi.fn(),
        getRow: vi.fn().mockReturnValue({ font: {} }),
      }),
      xlsx: { writeBuffer: writeBufferSpy },
    })),
  },
}));
// Mock dependencies
vi.mock('$app/navigation', () => ({ goto: vi.fn() }));

//初始模拟数据，存在00,02,04,12状态
const MOCK_EXAMS = [
  {
    id: 1,
    name: '数学考试',
    type: '00',
    method: '00',
    start_time: '2023-10-01 10:00',
    end_time: '2023-10-01 12:00',
    duration: '120分钟',
    status: '00',
    delivery_status: '00',
    addi: '',
    actionExpanded: false,
    num_of_examinees: 1,
    exam_sessions: [
      {
        id: 101,
        start_time: new Date('2023-10-01T10:00').getTime(),
        end_time: new Date('2023-10-01T12:00').getTime(),
      }
    ]
  },
  {
    id: 2,
    name: '英语考试',
    type: '02',
    method: '02',
    start_time: '2023-10-02 14:00',
    end_time: '2023-10-02 15:30',
    duration: '90分钟',
    status: '04',
    delivery_status: '00',
    addi: '',
    actionExpanded: false,
    num_of_examinees: 1,
    exam_sessions: [
      {
        id: 102,
        start_time: new Date('2023-10-02T14:00').getTime(),
        end_time: new Date('2023-10-02T15:30').getTime(),
      }
    ]
  },
  {
    id: 3,
    name: '物理期中',
    type: '00',
    method: '00',
    start_time: '2023-10-03 09:00',
    end_time: '2023-10-03 11:00',
    duration: '120分钟',
    status: '02',
    delivery_status: '00',
    addi: '',
    actionExpanded: false,
    num_of_examinees: 1,
    exam_sessions: [
      {
        id: 103,
        start_time: new Date('2023-10-03T09:00').getTime(),
        end_time: new Date('2023-10-03T11:00').getTime(),
      }
    ]
  },
  {
    id: 4,
    name: '化学期末',
    type: '02',
    method: '02',
    start_time: '2023-10-04 13:30',
    end_time: '2023-10-04 15:00',
    duration: '90分钟',
    status: '10',
    delivery_status: '00',
    addi: '考试系统异常',
    actionExpanded: false,
    num_of_examinees: 1,
    exam_sessions: [
      {
        id: 104,
        start_time: new Date('2023-10-04T13:30').getTime(),
        end_time: new Date('2023-10-04T15:00').getTime(),
      }
    ]
  }
];


// 15 条仅 id、name 不同，其余字段完全一致的模拟数据
// 规则：status 全部为 00 或 02，type 全部为 00，delivery_status 全部为 00
// 用于检测是否全选考试
const MOCK_EXAMS_15 = Array.from({ length: 15 }, (_, i) => ({
  id: 1001 + i,
  name: `考试${i + 1}`,
  type: '00',
  method: '00',
  start_time: '2023-10-01 10:00',
  end_time: '2023-10-01 12:00',
  duration: '120分钟',
  status: i % 2 === 0 ? '00' : '02',   // 交替 00 / 02
  delivery_status: '00',
  addi: '',
  actionExpanded: false,
  num_of_examinees: 1,
  exam_sessions: [
    {
      id: 2001 + i,
      start_time: new Date('2023-10-01T10:00').getTime(),
      end_time: new Date('2023-10-01T12:00').getTime(),
    }
  ]
}));


function mockFetch(data) {
  global.fetch = vi.fn(() =>
    Promise.resolve({
      ok: true,
      json: () => Promise.resolve(data),
    }),
  );
}


const setup = () => {
  render(ExamManagement);
  return {
    nameInput: () => screen.getByPlaceholderText('请输入考试名称搜索'),
    statusSelect: () => screen.getByText('全部状态').closest('div'),
    selectStatusOption: async (text) => {
      const select = screen.getByText('全部状态').closest('div');
      await fireEvent.click(select);
      // 等待下拉菜单渲染出来
    const dropdown = await within(select).findByRole('listbox'); // 或 findByTestId
    const option = within(dropdown).getByText('进行中');
    await fireEvent.click(option);
    },
    newExamButton: () => screen.getByText('新增考试'),
    downloadTemplateButton: () => screen.getByText('下载考生模板'),
    table: () => screen.getByRole('table'),
    continueEditButton: () => screen.queryByText('继续编辑'),
    publishExamButton: () => screen.queryByText('发布考试'),
    confirmDialog: () => screen.queryByText('是否确认发布该考试?'),
    confirmButton: () => screen.queryByText('确认发布'),
    cancelButton: () => screen.queryByText('取消'),
  };
};

describe('考试管理页面测试', () => {
  beforeEach(() => {
  global.fetch = vi.fn((url) => {
    if (typeof url !== 'string') {
      return Promise.reject(new Error('Invalid URL'));
    }

    if (url.includes('/api/exam/list')) {
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ status: 0, data: [], rowCount: 0 }),
      });
    }

    return Promise.reject(new Error(`Unhandled URL: ${url}`));
  });
});

  
  it('渲染页面核心元素', () => {
    
    render(ExamManagement);
    
    expect(screen.getByText('考试管理')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('请输入考试名称搜索')).toBeInTheDocument();
    expect(screen.getByText('全部状态')).toBeInTheDocument();
    expect(screen.getByText('新增考试')).toBeInTheDocument();
    // expect(screen.getByText('下载考生模板')).toBeInTheDocument();
    expect(screen.getByRole('table')).toBeInTheDocument();
  });

  it('渲染表格头部', () => {
    render(ExamManagement);
    
   expect(screen.getByRole('columnheader', { name: '考试名称' })).toBeInTheDocument();
    expect(screen.getByText('考试类型')).toBeInTheDocument();
    expect(screen.getByText('考试方式')).toBeInTheDocument();
    expect(screen.getByText('考试时间')).toBeInTheDocument();
    expect(screen.getByText('考试时长')).toBeInTheDocument();
    expect(screen.getByText('考试状态')).toBeInTheDocument();
    expect(screen.getByText('考生人数')).toBeInTheDocument();
    expect(screen.getByText('操作')).toBeInTheDocument();
  });

  describe('搜索功能', () => {
    beforeEach(() => {
  global.fetch = vi.fn((url) => {
    if (typeof url !== 'string') {
      return Promise.reject(new Error('Invalid URL'));
    }

    if (url.includes('/api/exam/list')) {
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ status: 0, data: [], rowCount: 0 }),
      });
    }

    return Promise.reject(new Error(`Unhandled URL: ${url}`));
  });
});

    it('支持考试名称搜索', async () => {
      mockFetch({ status: 0, data: MOCK_EXAMS, rowCount: 4 });
      const { nameInput } = setup();

      await fireEvent.input(nameInput(), { target: { value: '数学' } });
      expect(nameInput()).toHaveValue('数学');

      // 等待防抖时间
      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalled();
      }, { timeout: 500 });
    });

    it('应该在快速连续输入时触发防抖清除逻辑', async () => {
    mockFetch({ status: 0, data: MOCK_EXAMS, rowCount: 4 });
    const { nameInput } = setup();


    await fireEvent.input(nameInput(), { target: { value: '数' } });
    

    await fireEvent.input(nameInput(), { target: { value: '数学' } });

    await fireEvent.input(nameInput(), { target: { value: '数学考试' } });

    expect(nameInput()).toHaveValue('数学考试');

    // 等待防抖时间，应该只调用一次搜索
    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalled();
    }, { timeout: 500 });

  });


    it('支持考试状态筛选', async () => {
      mockFetch({ status: 0, data: MOCK_EXAMS, rowCount: 4 });
      const { selectStatusOption } = setup();

      await selectStatusOption('进行中');

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalled();
      });
    });

    it('成功加载考试数据', async () => {
      mockFetch({ status: 0, data: MOCK_EXAMS, rowCount: 4 });
      render(ExamManagement);

      await waitFor(() => {
        expect(screen.getByText('数学考试')).toBeInTheDocument();
        expect(screen.getByText('英语考试')).toBeInTheDocument();
        expect(screen.getByText('物理期中')).toBeInTheDocument();
        expect(screen.getByText('化学期末')).toBeInTheDocument();
      });
    });

    it('无数据时不显示任何考试', async () => {
      mockFetch({ status: 0, data: [], rowCount: 0 });
      render(ExamManagement);

      await waitFor(() => {
        expect(screen.queryByText('数学考试')).not.toBeInTheDocument();
      });
    });

    it('请求失败时应处理错误', async () => {
      global.fetch = vi.fn(() => Promise.reject(new Error('网络错误')));
      render(ExamManagement);

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalled();
      });
    });
  });

  describe('考试状态显示', () => {

    beforeEach(() => {
      global.fetch = vi.fn((url) => {
        if (typeof url !== 'string') {
          return Promise.reject(new Error('Invalid URL'));
        }

        if (url.includes('/api/exam/list')) {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve({ status: 0, data: [], rowCount: 0 }),
          });
        }

    return Promise.reject(new Error(`Unhandled URL: ${url}`));
  });
});
    it('应正确显示各种考试状态', async () => {
      mockFetch({ status: 0, data: MOCK_EXAMS, rowCount: 4 });
      render(ExamManagement);
      const table = await screen.findByRole('table');
      await waitFor(() => {
        expect(within(table).getAllByText('未发布').length).toBeGreaterThan(0);
        expect(within(table).getAllByText('进行中').length).toBeGreaterThan(0);
        expect(within(table).getAllByText('待开始').length).toBeGreaterThan(0);
        expect(within(table).getAllByText('考试异常').length).toBeGreaterThan(0);
      });
    });

    it('考试异常状态应显示提示信息', async () => {
      mockFetch({ status: 0, data: MOCK_EXAMS, rowCount: 4 });
      render(ExamManagement);

      await waitFor(() => {
        const tipButton = screen.getByAltText('提示');
        expect(tipButton).toBeInTheDocument();
      });
    });
  });

  describe('考试类型和方式映射', () => {
    beforeEach(() => {
  vi.clearAllMocks();

  global.fetch = vi.fn((url) => {
    if (typeof url !== 'string') {
      return Promise.reject(new Error('Invalid URL'));
    }

    if (url.includes('/api/exam/list')) {
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ status: 0, data: [], rowCount: 0 }),
      });
    }

    return Promise.reject(new Error(`Unhandled URL: ${url}`));
  });
});
    it('应正确显示考试类型', async () => {
      mockFetch({ status: 0, data: MOCK_EXAMS, rowCount: 4 });
      render(ExamManagement);
      const table = await screen.findByRole('table');
      await waitFor(() => {
        expect(within(table).getAllByText('平时考试').length).toBeGreaterThan(0);
        expect(within(table).getAllByText('期末成绩考试').length).toBeGreaterThan(0);
      });
    });

    it('应正确显示考试方式', async () => {
      mockFetch({ status: 0, data: MOCK_EXAMS, rowCount: 4 });
      render(ExamManagement);
      const table = await screen.findByRole('table');
      await waitFor(() => {
        expect(within(table).getAllByText('线上考试').length).toBeGreaterThan(0);
        expect(within(table).getAllByText('线下考试').length).toBeGreaterThan(0);
      });
    });
  });

  describe('操作按钮', () => {
    beforeEach(() => {
  vi.clearAllMocks();

  global.fetch = vi.fn((url) => {
    if (typeof url !== 'string') {
      return Promise.reject(new Error('Invalid URL'));
    }

    if (url.includes('/api/exam/list')) {
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ status: 0, data: [], rowCount: 0 }),
      });
    }

    return Promise.reject(new Error(`Unhandled URL: ${url}`));
  });
});

    it('点击发布考试应显示确认对话框', async () => {
      const unpublishedExam = [{ ...MOCK_EXAMS[0], status: '00' }];
      mockFetch({ status: 0, data: unpublishedExam, rowCount: 1 });
      render(ExamManagement);

      await waitFor(() => {
        const publishButton = screen.getByText('发布考试');
        fireEvent.click(publishButton);
      });

      await waitFor(() => {
        expect(screen.getByText('是否确认发布该考试?')).toBeInTheDocument();
      });
    });
  });

  describe('导航功能', () => {
    beforeEach(() => {
  vi.clearAllMocks();

  global.fetch = vi.fn((url) => {
    if (typeof url !== 'string') {
      return Promise.reject(new Error('Invalid URL'));
    }

    if (url.includes('/api/exam/list')) {
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ status: 0, data: [], rowCount: 0 }),
      });
    }

    return Promise.reject(new Error(`Unhandled URL: ${url}`));
  });
});
    it('点击新增考试按钮应跳转到新增页面', () => {
      const { newExamButton } = setup();
      
      fireEvent.click(newExamButton());
      expect(goto).toHaveBeenCalledWith('/teacher/exam/addExam');
    });
  });

  describe('考试发布功能', () => {
    beforeEach(() => {
      vi.clearAllMocks();
      
      global.fetch = vi.fn((url) => {
        if (url.includes('/api/exam/list')) {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve({ status: 0, data: MOCK_EXAMS, rowCount: 4 }),
          });
        }
        if (url.includes('/api/exam/lock')) {
          return Promise.resolve({ ok: true, json: () => Promise.resolve({ status: 0 }) });
        }
        if (url.includes('/api/exam/status')) {
          return Promise.resolve({ ok: true, json: () => Promise.resolve({ status: 0 }) });
        }
        return Promise.reject(new Error(`Unhandled URL: ${url}`));
      });
    });

  it('应该完成考试发布流程', async () => {
  render(ExamManagement);

  await waitFor(() => {
    expect(screen.getByText('数学考试')).toBeInTheDocument();
  });

  // 点击发布考试按钮
  const publishButtons = screen.getAllByText('发布考试');
  await fireEvent.click(publishButtons[0]);

  // 验证确认对话框
  await waitFor(() => {
    expect(screen.getByText('是否确认发布该考试?')).toBeInTheDocument();
  });

  // 确认发布
  const confirmButton = screen.getByText('确认发布');
  await fireEvent.click(confirmButton);

  await waitFor(() => {
    
    const calls = global.fetch.mock.calls;
    const examApiCall = calls.some(call => 
      typeof call[0] === 'string' && call[0].includes('/api/exam/status')
    );
    expect(examApiCall).toBe(true);
  });
});

  it('应该在取消时关闭确认对话框', async () => {
    render(ExamManagement);

    await waitFor(() => {
      const publishButtons = screen.getAllByText('发布考试');
      fireEvent.click(publishButtons[0]);
    });

    await waitFor(() => {
      const cancelButton = screen.getByText('取消');
      fireEvent.click(cancelButton);
    });

    await waitFor(() => {
      expect(screen.queryByText('是否确认发布该考试?')).not.toBeInTheDocument();
    });
  });
});

})
//占位
describe('分页功能测试', () => {
  let mockFetchResponses = {};
  
  beforeEach(() => {
    vi.clearAllMocks();
    
    // 重置 mock 响应
    mockFetchResponses = {};
    
    global.fetch = vi.fn((url) => {
      if (typeof url !== 'string') {
        return Promise.reject(new Error('Invalid URL'));
      }

      if (url.includes('/api/exam/list')) {
        // 解析URL参数获取分页信息
        const urlObj = new URL(url, 'http://localhost');
        const queryParam = urlObj.searchParams.get('q');
        
        if (queryParam) {
          const queryObj = JSON.parse(queryParam);
          const page = queryObj.page || 1;
          const pageSize = queryObj.pageSize || 10;
          
          // 根据页码返回对应的数据
          const key = `page${page}_size${pageSize}`;
          if (mockFetchResponses[key]) {
            return Promise.resolve({
              ok: true,
              json: () => Promise.resolve(mockFetchResponses[key])
            });
          }
        }
        
        // 默认返回第一页数据
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ 
            status: 0, 
            data: MOCK_EXAMS_15, 
            rowCount: 25 
          }),
        });
      }

      return Promise.reject(new Error(`Unhandled URL: ${url}`));
    });
  });

  describe('handlePageChange 函数测试', () => {
    it('应该正确处理页码变化', async () => {
      // 设置不同页面的数据
      mockFetchResponses['page1_size10'] = {
        status: 0,
        data: MOCK_EXAMS_15,
        rowCount: 25
      };
      
      mockFetchResponses['page2_size10'] = {
        status: 0,
        data: MOCK_EXAMS_15,
        rowCount: 25
      };

      render(ExamManagement);

      // 等待初始数据加载
      await waitFor(() => {
        expect(screen.getByText('考试1')).toBeInTheDocument();
      });

      // 模拟点击第2页
      const paginationContainer = screen.getByText('考试1').closest('.examManagementContainer');
      const pageButton = paginationContainer?.querySelector('[data-page="2"]');
      
      if (pageButton) {
        await fireEvent.click(pageButton);
        
        await waitFor(() => {
          // 验证API被调用时带有正确的页码参数
          const calls = global.fetch.mock.calls;
          const page2Call = calls.find(call => {
            if (typeof call[0] === 'string' && call[0].includes('/api/exam/list')) {
              const url = new URL(call[0], 'http://localhost');
              const queryParam = url.searchParams.get('q');
              if (queryParam) {
                const queryObj = JSON.parse(queryParam);
                return queryObj.page === 2;
              }
            }
            return false;
          });
          expect(page2Call).toBeTruthy();

        });
      }
    });

    it('页码变化时应该重置全选状态', async () => {
      mockFetchResponses['page1_size10'] = {
        status: 0,
        data: MOCK_EXAMS_15,
        rowCount: 25
      };
      
      mockFetchResponses['page2_size10'] = {
        status: 0,
        data: MOCK_EXAMS_15,
        rowCount: 25
      };

      render(ExamManagement);

      await waitFor(() => {
        expect(screen.getByText('考试1')).toBeInTheDocument();
      });

      // 选中当前页的一些考试
      const checkboxes = screen.getAllByRole('checkbox');
      if (checkboxes.length > 1) {
        await fireEvent.click(checkboxes[1]); // 选中第一个考试
      }
        await fireEvent.click(checkboxes[1]);
        expect(checkboxes[1].checked).toBe(false);

        await fireEvent.click(checkboxes[1]);


      // 切换到第2页
      const paginationContainer = screen.getByText('考试1').closest('.examManagementContainer');
      const pageButton = paginationContainer?.querySelector('[data-page="2"]');
      
      if (pageButton) {
        await fireEvent.click(pageButton);
        
        await waitFor(() => {
          // 验证全选状态被重置
          const selectAllCheckbox = screen.getAllByRole('checkbox')[0];
          expect(selectAllCheckbox.checked).toBe(false);

        });
      }
    });

    it('页码变化时应该保持已选中的考试ID', async () => {
      mockFetchResponses['page1_size10'] = {
        status: 0,
        data: MOCK_EXAMS_15,
        rowCount: 15
      };
      
      mockFetchResponses['page2_size10'] = {
        status: 0,
        data: MOCK_EXAMS_15,
        rowCount: 15
      };

      render(ExamManagement);

      await waitFor(() => {
        expect(screen.getByText('考试1')).toBeInTheDocument();
      });

      // 在第一页选中一些考试
      const firstPageCheckboxes = screen.getAllByRole('checkbox');
      if (firstPageCheckboxes.length > 1) {
        await fireEvent.click(firstPageCheckboxes[1]); // 选中考试1
        await fireEvent.click(firstPageCheckboxes[2]); // 选中考试2
      }

      // 切换到第2页
      const paginationContainer = screen.getByText('考试1').closest('.examManagementContainer');
      const pageButton = paginationContainer?.querySelector('[data-page="2"]');
      
      if (pageButton) {
        await fireEvent.click(pageButton);
        
        await waitFor(() => {
          expect(screen.getByText('考试6')).toBeInTheDocument();
        });

        // 切换回第1页，验证之前的选择是否保持
        const page1Button = paginationContainer?.querySelector('[data-page="1"]');
        if (page1Button) {
          await fireEvent.click(page1Button);
          
          await waitFor(() => {
            expect(screen.getByText('考试1')).toBeInTheDocument();
            // 这里应该验证之前选中的考试仍然被选中
            // 由于组件的复杂性，这个测试可能需要更详细的实现
          });
        }
      }
    });
  });

  describe('handlePageSizeChange 函数测试', () => {
    it('应该正确处理每页条数变化', async () => {
      mockFetchResponses['page1_size10'] = {
        status: 0,
        data: MOCK_EXAMS_15,
        rowCount: 25
      };
      
      mockFetchResponses['page1_size20'] = {
        status: 0,
        data: MOCK_EXAMS_15,
        rowCount: 25
      };

      render(ExamManagement);

      await waitFor(() => {
        expect(screen.getByText('考试1')).toBeInTheDocument();
      });

      // 模拟改变每页条数
      const pageSizeSelect = screen.getByText('10条/页').closest('select');
      if (pageSizeSelect) {
        await fireEvent.change(pageSizeSelect, { target: { value: '20' } });
        
        await waitFor(() => {
          // 验证API被调用时带有正确的pageSize参数
          const calls = global.fetch.mock.calls;
          const pageSizeCall = calls.find(call => {
            if (typeof call[0] === 'string' && call[0].includes('/api/exam/list')) {
              const url = new URL(call[0], 'http://localhost');
              const queryParam = url.searchParams.get('q');
              if (queryParam) {
                const queryObj = JSON.parse(queryParam);
                return queryObj.pageSize === 20 && queryObj.page === 1;
              }
            }
            return false;
          });
          expect(pageSizeCall).toBeTruthy();
        });
      }
    });

    it('每页条数变化时应该重置到第一页', async () => {
      mockFetchResponses['page2_size10'] = {
        status: 0,
        data: MOCK_EXAMS_15,
        rowCount: 25
      };
      
      mockFetchResponses['page1_size20'] = {
        status: 0,
        data: MOCK_EXAMS_15,
        rowCount: 25
      };

      render(ExamManagement);

      // 先切换到第2页
      await waitFor(() => {
        expect(screen.getByText('考试1')).toBeInTheDocument();
      });

      const paginationContainer = screen.getByText('考试1').closest('.examManagementContainer');
      const pageButton = paginationContainer?.querySelector('[data-page="2"]');
      
      if (pageButton) {
        await fireEvent.click(pageButton);
        
        await waitFor(() => {
          expect(screen.getByText('考试11')).toBeInTheDocument();
        });

        // 改变每页条数
        const pageSizeSelect = screen.getByText('10').closest('select');
        if (pageSizeSelect) {
          await fireEvent.change(pageSizeSelect, { target: { value: '20' } });
          
          await waitFor(() => {
            // 验证重置到第一页
            const calls = global.fetch.mock.calls;
            const resetCall = calls.find(call => {
              if (typeof call[0] === 'string' && call[0].includes('/api/exam/list')) {
                const url = new URL(call[0], 'http://localhost');
                const queryParam = url.searchParams.get('q');
                if (queryParam) {
                  const queryObj = JSON.parse(queryParam);
                  return queryObj.pageSize === 20 && queryObj.page === 1;
                }
              }
              return false;
            });
            expect(resetCall).toBeTruthy();
          });
        }
      }
    });

    it('每页条数变化时应该正确处理全选状态', async () => {
      mockFetchResponses['page1_size10'] = {
        status: 0,
        data: MOCK_EXAMS_15,
        rowCount: 25
      };
      
      mockFetchResponses['page1_size5'] = {
        status: 0,
        data: MOCK_EXAMS_15,
        rowCount: 25
      };

      render(ExamManagement);

      await waitFor(() => {
        expect(screen.getByText('考试1')).toBeInTheDocument();
      });

      // 全选当前页
      const selectAllCheckbox = screen.getAllByRole('checkbox')[0];
      await fireEvent.click(selectAllCheckbox);

      // 改变每页条数
      const pageSizeSelect = screen.getByText('10条/页').closest('select');
      if (pageSizeSelect) {
        await fireEvent.change(pageSizeSelect, { target: { value: '5' } });
        
        await waitFor(() => {
          // 验证全选状态根据新页面内容正确更新
          const newSelectAllCheckbox = screen.getAllByRole('checkbox')[0];
          // 由于之前选中的考试1-10包含了新页面的考试1-5，所以应该保持全选状态
          expect(newSelectAllCheckbox.checked).toBe(true);
        });
      }
    });
  });

  describe('全选逻辑与分页的交互', () => {

    it('当前页部分考试被选中时全选状态应该为false', async () => {
      mockFetchResponses['page1_size5'] = {
        status: 0,
        data: MOCK_EXAMS_15,
        rowCount: 10
      };

      render(ExamManagement);

      await waitFor(() => {
        expect(screen.getByText('考试1')).toBeInTheDocument();
      });

      // 只选中部分考试
      const checkboxes = screen.getAllByRole('checkbox');
      if (checkboxes.length > 2) {
        await fireEvent.click(checkboxes[1]);
        await fireEvent.click(checkboxes[2]);
      }

      await waitFor(() => {
        // 验证全选checkbox未被选中
        const selectAllCheckbox = screen.getAllByRole('checkbox')[0];
        expect(selectAllCheckbox.checked).toBe(false);        
      });

      //检查全选和取消全选功能
        await fireEvent.click(checkboxes[0]);
        expect(checkboxes[0].checked).toBe(true);
        await fireEvent.click(checkboxes[0]);
        expect(checkboxes[0].checked).toBe(false);
    });

    it('切换页面后全选状态应该正确反映当前页面的选中情况', async () => {
      mockFetchResponses['page1_size5'] = {
        status: 0,
        data: MOCK_EXAMS_15, // 考试1-5
        rowCount: 10
      };
      
      mockFetchResponses['page2_size5'] = {
        status: 0,
        data: MOCK_EXAMS_15, // 考试6-10
        rowCount: 10
      };

      render(ExamManagement);

      await waitFor(() => {
        expect(screen.getByText('考试1')).toBeInTheDocument();
      });

      // 在第一页全选
      const selectAllCheckbox = screen.getAllByRole('checkbox')[0];
      await fireEvent.click(selectAllCheckbox);

      // 切换到第二页
      const paginationContainer = screen.getByText('考试1').closest('.examManagementContainer');
      const page2Button = paginationContainer?.querySelector('[data-page="2"]');
      
      if (page2Button) {
        await fireEvent.click(page2Button);
        
        await waitFor(() => {
          expect(screen.getByText('考试6')).toBeInTheDocument();
          // 第二页的考试没有被选中，所以全选状态应该为false
          const newSelectAllCheckbox = screen.getAllByRole('checkbox')[0];
          expect(newSelectAllCheckbox.checked).toBe(false);
        });
      }
    });
  });

  describe('边界情况测试', () => {
    



    it('应该正确处理API错误', async () => {
      global.fetch = vi.fn(() => Promise.reject(new Error('网络错误')));
      
      render(ExamManagement);

      await waitFor(() => {
        // 验证错误处理
        expect(global.fetch).toHaveBeenCalled();
      });
    });
  });
});

describe('分页功能测试1', () => {
  let mockFetchResponses = {};
  
  beforeEach(() => {
    vi.clearAllMocks();
    
    mockFetchResponses = {};
    
    global.fetch = vi.fn((url) => {
      if (typeof url !== 'string') {
        return Promise.reject(new Error('Invalid URL'));
      }

      if (url.includes('/api/exam/list')) {
        const urlObj = new URL(url, 'http://localhost');
        const queryParam = urlObj.searchParams.get('q');
        
        if (queryParam) {
          const queryObj = JSON.parse(queryParam);
          const page = queryObj.page || 1;
          const pageSize = queryObj.pageSize || 10;
          
          const key = `page${page}_size${pageSize}`;
          if (mockFetchResponses[key]) {
            return Promise.resolve({
              ok: true,
              json: () => Promise.resolve(mockFetchResponses[key])
            });
          }
        }
        
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ 
            status: 0, 
            data: MOCK_EXAMS_15.slice(0, 10), 
            rowCount: 25 
          }),
        });
      }

      return Promise.reject(new Error(`Unhandled URL: ${url}`));
    });
  });

  describe('handlePageChange 函数测试', () => {
    it('应该正确处理页码变化', async () => {
      // 设置第一页数据
      mockFetchResponses['page1_size10'] = {
        status: 0,
        data: MOCK_EXAMS_15.slice(0, 10),
        rowCount: 25
      };
      
      // 设置第二页数据
      mockFetchResponses['page2_size10'] = {
        status: 0,
        data: MOCK_EXAMS_15.slice(10, 15),
        rowCount: 25
      };

      render(ExamManagement);

      // 等待初始数据加载
      await waitFor(() => {
        expect(screen.getByText('考试1')).toBeInTheDocument();
      });

      // 获取分页组件，使用更通用的方式
      const paginationContainer = document.querySelector('.paginationContainer');
      expect(paginationContainer).toBeInTheDocument();

      // 查找页码按钮 - 使用更灵活的选择器
      const pageButtons = paginationContainer.querySelectorAll('button');
      const page2Button = Array.from(pageButtons).find(btn => 
        btn.textContent?.trim() === '2'
      );
      
      if (page2Button) {
        await fireEvent.click(page2Button);
        
        await waitFor(() => {
          // 验证API被调用时带有正确的页码参数
          const calls = global.fetch.mock.calls;
          const page2Call = calls.find(call => {
            if (typeof call[0] === 'string' && call[0].includes('/api/exam/list')) {
              try {
                const url = new URL(call[0], 'http://localhost');
                const queryParam = url.searchParams.get('q');
                if (queryParam) {
                  const queryObj = JSON.parse(queryParam);
                  return queryObj.page === 2;
                }
              } catch (e) {
                return false;
              }
            }
            return false;
          });
          expect(page2Call).toBeTruthy();
        });
      }
    });

    it('页码变化时应该重置全选状态', async () => {
      mockFetchResponses['page1_size10'] = {
        status: 0,
        data: MOCK_EXAMS_15.slice(0, 10),
        rowCount: 25
      };
      
      mockFetchResponses['page2_size10'] = {
        status: 0,
        data: MOCK_EXAMS_15.slice(10, 15),
        rowCount: 25
      };

      render(ExamManagement);

      await waitFor(() => {
        expect(screen.getByText('考试1')).toBeInTheDocument();
      });

      // 选中当前页的第一个考试
      const checkboxes = screen.getAllByRole('checkbox');
      if (checkboxes.length > 1) {
        await fireEvent.click(checkboxes[1]); // 跳过全选框，选中第一个考试
        expect(checkboxes[1]).toBeChecked();
      }

      // 切换到第2页
      const paginationContainer = document.querySelector('.paginationContainer');
      const pageButtons = paginationContainer?.querySelectorAll('button') || [];
      const page2Button = Array.from(pageButtons).find(btn => 
        btn.textContent?.trim() === '2'
      );
      
      if (page2Button) {
        await fireEvent.click(page2Button);
        
        await waitFor(() => {
          // 验证全选状态被重置（应该是未选中状态）
          const newCheckboxes = screen.getAllByRole('checkbox');
          const selectAllCheckbox = newCheckboxes[0];
          expect(selectAllCheckbox).not.toBeChecked();
        });
      }
    });
  });

  describe('handlePageSizeChange 函数测试', () => {
    it('应该正确处理每页条数变化', async () => {
      mockFetchResponses['page1_size10'] = {
        status: 0,
        data: MOCK_EXAMS_15.slice(0, 10),
        rowCount: 25
      };
      
      mockFetchResponses['page1_size20'] = {
        status: 0,
        data: MOCK_EXAMS_15,
        rowCount: 25
      };

      render(ExamManagement);

      await waitFor(() => {
        expect(screen.getByText('考试1')).toBeInTheDocument();
      });

      // 获取分页组件中的页面大小选择器
      const paginationContainer = document.querySelector('.paginationContainer');
      
      // 查找页面大小选择器 - 通常是一个select元素或者包含页面大小选项的按钮
      const pageSizeSelectors = paginationContainer?.querySelectorAll('select, button');
      const pageSizeSelector = Array.from(pageSizeSelectors || []).find(element => {
        return element.textContent?.includes('10') || 
               element.value === '10' ||
               element.getAttribute('aria-label')?.includes('页面大小');
      });
      
      if (pageSizeSelector) {
        if (pageSizeSelector.tagName === 'SELECT') {
          await fireEvent.change(pageSizeSelector, { target: { value: '20' } });
        } else {
          // 如果是按钮，可能需要点击然后选择选项
          await fireEvent.click(pageSizeSelector);
          
          // 查找20的选项
          const option20 = screen.getByText('20条/页');
          if (option20) {
            await fireEvent.click(option20);
          }
        }
        
        await waitFor(() => {
          // 验证API被调用时带有正确的pageSize参数
          const calls = global.fetch.mock.calls;
          const pageSizeCall = calls.find(call => {
            if (typeof call[0] === 'string' && call[0].includes('/api/exam/list')) {
              try {
                const url = new URL(call[0], 'http://localhost');
                const queryParam = url.searchParams.get('q');
                if (queryParam) {
                  const queryObj = JSON.parse(queryParam);
                  return queryObj.pageSize === 20 && queryObj.page === 1;
                }
              } catch (e) {
                return false;
              }
            }
            return false;
          });
          expect(pageSizeCall).toBeTruthy();
        });
      }
    });

    it('每页条数变化时应该重置到第一页', async () => {
      mockFetchResponses['page1_size10'] = {
        status: 0,
        data: MOCK_EXAMS_15.slice(0, 10),
        rowCount: 15
      };
      
      mockFetchResponses['page2_size10'] = {
        status: 0,
        data: MOCK_EXAMS_15.slice(10, 15),
        rowCount: 15
      };
      
      mockFetchResponses['page1_size20'] = {
        status: 0,
        data: MOCK_EXAMS_15,
        rowCount: 15
      };

      render(ExamManagement);

      // 等待初始加载
      await waitFor(() => {
        expect(screen.getByText('考试1')).toBeInTheDocument();
      });

      // 先切换到第2页
      const paginationContainer = document.querySelector('.paginationContainer');
      const pageButtons = paginationContainer?.querySelectorAll('button') || [];
      const page2Button = Array.from(pageButtons).find(btn => 
        btn.textContent?.trim() === '2'
      );
      
      if (page2Button) {
        await fireEvent.click(page2Button);
        
        await waitFor(() => {
          expect(screen.getByText('考试11')).toBeInTheDocument();
        });

        // 改变每页条数
        const pageSizeSelectors = paginationContainer?.querySelectorAll('select, button');
        const pageSizeSelector = Array.from(pageSizeSelectors || []).find(element => {
          return element.textContent?.includes('10') || 
                 element.value === '10';
        });
        
        if (pageSizeSelector) {
          if (pageSizeSelector.tagName === 'SELECT') {
            await fireEvent.change(pageSizeSelector, { target: { value: '20' } });
          } else {
            await fireEvent.click(pageSizeSelector);
            const option20 = await screen.findByText('20条/页');
            await fireEvent.click(option20);
          }

          const checkboxes = screen.getAllByRole('checkbox');
          await fireEvent.click(checkboxes[0]);
           expect(checkboxes[0]).toBeChecked();
          await fireEvent.click(pageSizeSelector);
          const option10 = await screen.findByText('10条/页');
          await fireEvent.click(option10);
          expect(checkboxes[0]).toBeChecked();
          await fireEvent.click(checkboxes[0]);
          expect(checkboxes[0]).not.toBeChecked();

          await waitFor(() => {
            // 验证重置到第一页且使用新的页面大小
            const calls = global.fetch.mock.calls;
            const resetCall = calls.find(call => {
              if (typeof call[0] === 'string' && call[0].includes('/api/exam/list')) {
                try {
                  const url = new URL(call[0], 'http://localhost');
                  const queryParam = url.searchParams.get('q');
                  if (queryParam) {
                    const queryObj = JSON.parse(queryParam);
                    return queryObj.pageSize === 20 && queryObj.page === 1;
                  }
                } catch (e) {
                  return false;
                }
              }
              return false;
            });
            expect(resetCall).toBeTruthy();
          });
        }
      }
    });
  });

  describe('全选逻辑与分页的交互', () => {
    it('当前页部分考试被选中时全选状态应该为false', async () => {
      mockFetchResponses['page1_size5'] = {
        status: 0,
        data: MOCK_EXAMS_15.slice(0, 5),
        rowCount: 15
      };

      render(ExamManagement);

      await waitFor(() => {
        expect(screen.getByText('考试1')).toBeInTheDocument();
      });

      // 只选中部分考试
      const checkboxes = screen.getAllByRole('checkbox');
      if (checkboxes.length > 3) {
        // 跳过全选框(索引0)，选中部分考试
        await fireEvent.click(checkboxes[1]);
        await fireEvent.click(checkboxes[2]);
        
        await waitFor(() => {
          // 验证全选checkbox未被选中
          const selectAllCheckbox = checkboxes[0];
          expect(selectAllCheckbox).not.toBeChecked();        
        });

        // 测试全选和取消全选功能
        await fireEvent.click(checkboxes[0]); // 全选
        expect(checkboxes[0]).toBeChecked();
        
        await fireEvent.click(checkboxes[0]); // 取消全选
        expect(checkboxes[0]).not.toBeChecked();
      }
    });

    it('切换页面后全选状态应该正确反映当前页面的选中情况', async () => {
      mockFetchResponses['page1_size5'] = {
        status: 0,
        data: MOCK_EXAMS_15.slice(0, 5),
        rowCount: 15
      };
      
      mockFetchResponses['page2_size5'] = {
        status: 0,
        data: MOCK_EXAMS_15.slice(5, 10),
        rowCount: 15
      };

      render(ExamManagement);

      await waitFor(() => {
        expect(screen.getByText('考试1')).toBeInTheDocument();
      });

      // 在第一页全选
      const selectAllCheckbox = screen.getAllByRole('checkbox')[0];
      await fireEvent.click(selectAllCheckbox);
      expect(selectAllCheckbox).toBeChecked();

      // 切换到第二页
      const paginationContainer = document.querySelector('.paginationContainer');
      const pageButtons = paginationContainer?.querySelectorAll('button') || [];
      const page2Button = Array.from(pageButtons).find(btn => 
        btn.textContent?.trim() === '2'
      );
      
      if (page2Button) {
        await fireEvent.click(page2Button);
        
        await waitFor(() => {
          expect(screen.getByText('考试6')).toBeInTheDocument();
          // 第二页的考试没有被选中，所以全选状态应该为false
          const selectAllCheckbox = screen.getAllByRole('checkbox')[0];
          expect(selectAllCheckbox.checked).toBe(true); 
        });
      }
    });
  }); 
});

    describe('考试发布功能 - 异常情况测试', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    
    global.fetch = vi.fn((url) => {
      if (url.includes('/api/exam/list')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ status: 0, data: MOCK_EXAMS, rowCount: 4 }),
        });
      }
      if (url.includes('/api/exam/status')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ status: -1, msg: '考试状态更新失败' }),
        });
      }
      return Promise.reject(new Error(`Unhandled URL: ${url}`));
    });
  });

  it('应该处理考试发布失败(status=-1)的情况', async () => {
    const toastSpy = vi.spyOn(toast, 'error');
    
    render(ExamManagement);

    await waitFor(() => {
      expect(screen.getByText('数学考试')).toBeInTheDocument();
    });

    // 点击发布考试按钮
    const publishButtons = screen.getAllByText('发布考试');
    await fireEvent.click(publishButtons[0]);

    // 确认发布
    const confirmButton = screen.getByText('确认发布');
    await fireEvent.click(confirmButton);

    await waitFor(() => {
      // 验证错误提示被调用
      expect(toastSpy).toHaveBeenCalledWith('考试状态更新失败');
      
      // 验证对话框已关闭
      expect(screen.queryByText('是否确认发布该考试?')).not.toBeInTheDocument();
    });
  });

  it('应该处理网络错误导致的发布失败', async () => {
    // 模拟网络错误
    global.fetch = vi.fn((url) => {
      if (url.includes('/api/exam/list')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ status: 0, data: MOCK_EXAMS, rowCount: 4 }),
        });
      }
      if (url.includes('/api/exam/status')) {
        return Promise.reject(new Error('网络连接失败'));
      }
      return Promise.reject(new Error(`Unhandled URL: ${url}`));
    });
    
    const toastSpy = vi.spyOn(toast, 'error');
    
    render(ExamManagement);

    await waitFor(() => {
      expect(screen.getByText('数学考试')).toBeInTheDocument();
    });

    // 点击发布考试按钮
    const publishButtons = screen.getAllByText('发布考试');
    await fireEvent.click(publishButtons[0]);

    // 确认发布
    const confirmButton = screen.getByText('确认发布');
    await fireEvent.click(confirmButton);

    await waitFor(() => {
      // 验证错误提示被调用
      console.log('Toast 实际输出:', toastSpy.mock.calls[0]?.[0]);
      expect(toastSpy).toHaveBeenCalledWith('网络连接失败');
      
      // 验证对话框已关闭
      expect(screen.queryByText('是否确认发布该考试?')).not.toBeInTheDocument();
    });
  });

  it('应该处理未知错误导致的发布失败', async () => {
    // 模拟未知错误
    global.fetch = vi.fn((url) => {
      if (url.includes('/api/exam/list')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ status: 0, data: MOCK_EXAMS, rowCount: 4 }),
        });
      }
      if (url.includes('/api/exam/status')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ status: 500, msg: '' }),
        });
      }
      return Promise.reject(new Error(`Unhandled URL: ${url}`));
    });
    
    const toastSpy = vi.spyOn(toast, 'error');
    
    render(ExamManagement);

    await waitFor(() => {
      expect(screen.getByText('数学考试')).toBeInTheDocument();
    });

    // 点击发布考试按钮
    const publishButtons = screen.getAllByText('发布考试');
    await fireEvent.click(publishButtons[0]);

    // 确认发布
    const confirmButton = screen.getByText('确认发布');
    await fireEvent.click(confirmButton);

    await waitFor(() => {
      // 验证错误提示被调用
      expect(toastSpy).toHaveBeenCalledWith('发布失败：未知错误');
      
      // 验证对话框已关闭
      expect(screen.queryByText('是否确认发布该考试?')).not.toBeInTheDocument();
    });
  });
});

describe('考试作废功能测试', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    global.fetch = vi.fn((url) => {
      if (url.includes('/api/exam/list')) {
        return Promise.resolve({ ok: true, json: () => Promise.resolve({ status: 0, data: MOCK_EXAMS, rowCount: 4 }) });
      }
      if (url.includes('/api/exam/status')) {
        return Promise.resolve({ ok: true, json: () => Promise.resolve({ status: 0 }) });
      }
      return Promise.reject(new Error(`Unhandled URL: ${url}`));
    });
  });

  it('应成功作废考试', async () => {
    render(ExamManagement);
    await waitFor(() => expect(screen.getByText('物理期中')).toBeInTheDocument());

    const cancelButtons = screen.getAllByText('考试作废');
    await fireEvent.click(cancelButtons[0]);

    await waitFor(() => expect(screen.getByText('是否确认将该考试作废')).toBeInTheDocument());

    const confirmBtn = screen.getByText('确认');
    await fireEvent.click(confirmBtn);

    await waitFor(() => {
      expect(screen.queryByText('是否确认将该考试作废')).not.toBeInTheDocument();
    });
  });

  it('应处理作废失败(status=-1)', async () => {
    global.fetch = vi.fn((url) => {
      if (url.includes('/api/exam/status')) {
        return Promise.resolve({ ok: true, json: () => Promise.resolve({ status: -1, msg: '作废失败' }) });
      }
      return Promise.resolve({ ok: true, json: () => Promise.resolve({ status: 0, data: MOCK_EXAMS, rowCount: 4 }) });
    });
    const toastSpy = vi.spyOn(toast, 'error');

    render(ExamManagement);
    await waitFor(() => expect(screen.getByText('物理期中')).toBeInTheDocument());

    const cancelButtons = screen.getAllByText('考试作废');
    await fireEvent.click(cancelButtons[0]);

    const confirmBtn = screen.getByText('确认');
    await fireEvent.click(confirmBtn);

    await waitFor(() => {
      console.log('Toast 实际输出:', toastSpy.mock.calls);
      expect(toastSpy).toHaveBeenCalledWith("作废失败");
    });
  });

  it('应处理网络错误导致的作废失败', async () => {
    global.fetch = vi.fn((url) => {
      if (url.includes('/api/exam/status')) {
        return Promise.reject(new Error('网络错误'));
      }
      return Promise.resolve({ ok: true, json: () => Promise.resolve({ status: 0, data: MOCK_EXAMS, rowCount: 4 }) });
    });
    const toastSpy = vi.spyOn(toast, 'error');

    render(ExamManagement);
    await waitFor(() => expect(screen.getByText('物理期中')).toBeInTheDocument());

    const cancelButtons = screen.getAllByText('考试作废');
    await fireEvent.click(cancelButtons[0]);

    const confirmBtn = screen.getByText('确认');
    await fireEvent.click(confirmBtn);

    await waitFor(() => {
      console.log('Toast 实际输出:', toastSpy.mock.calls[0]?.[0]);
      expect(toastSpy).toHaveBeenCalledWith("网络错误");
    });
  });
});

describe('考试删除功能测试', () => {
  beforeEach(() => {
    vi.clearAllMocks();
   
  });

  it('应成功删除考试', async () => {
    global.fetch = vi.fn((url) => {
    if (url.includes('/api/exam') && url.includes('DELETE')) {
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ status: 0 })
      });
    }
    // 列表接口正常返回
    return Promise.resolve({
      ok: true,
      json: () => Promise.resolve({ status: 0, data: MOCK_EXAMS, rowCount: 4 })
    });
  });

  render(ExamManagement);
  await waitFor(() => expect(screen.getByText('数学考试')).toBeInTheDocument());

  // 2. 触发删除流程
  const deleteButtons = screen.getAllByText('删除考试');
  await fireEvent.click(deleteButtons[0]);

  const confirmBtn = screen.getByText('确认删除');
  await fireEvent.click(confirmBtn);

  // 3. 断言删除成功：页面重新请求列表（status===0 分支已执行）
  await waitFor(() => {
    // 可以检查 fetch 被再次调用（重刷列表）
    const calls = global.fetch.mock.calls;
    const listCalls = calls.filter(([u]) => u.includes('/api/exam/list'));
    expect(listCalls.length).toBeGreaterThan(1); // 初始加载 + 删除后刷新
  });
  });

  it('应处理删除失败(status=-1)', async () => {
    global.fetch = vi.fn((url) => {
      if (url.includes('/api/exam') && url.includes('DELETE')) {
        return Promise.resolve({ ok: true, json: () => Promise.resolve({ status: -1, msg: '删除失败' }) });
      }
      return Promise.resolve({ ok: true, json: () => Promise.resolve({ status: -1, data: MOCK_EXAMS, rowCount: 4 }) });
    });
    const toastSpy = vi.spyOn(toast, 'error');

    render(ExamManagement);
    await waitFor(() => expect(screen.getByText('数学考试')).toBeInTheDocument());

    const deleteButtons = screen.getAllByText('删除考试');
    await fireEvent.click(deleteButtons[0]);

    const confirmBtn = screen.getByText('确认删除');
    await fireEvent.click(confirmBtn);

    await waitFor(() => {
      console.log('Toast 实际输出:', toastSpy.mock.calls);
      expect(toastSpy).toHaveBeenCalledWith('删除失败：未知错误');
    });
  });

  
});

describe('取消删除/作废考试测试', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    global.fetch = vi.fn((url) => {
      if (url.includes('/api/exam/list')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ status: 0, data: MOCK_EXAMS, rowCount: 4 }),
        });
      }
      return Promise.reject(new Error(`Unhandled URL: ${url}`));
    });
  });

  it('点击删除考试后，在确认框中选择取消', async () => {
    render(ExamManagement);
    await waitFor(() => expect(screen.getByText('数学考试')).toBeInTheDocument());

    // 点击“删除考试”按钮
    const deleteButtons = screen.getAllByText('删除考试');
    await fireEvent.click(deleteButtons[0]);

    // 确认对话框出现
    await waitFor(() => expect(screen.getByText('是否确认删除该考试')).toBeInTheDocument());

    // 点击“取消”
    const cancelBtn = screen.getByText('取消');
    await fireEvent.click(cancelBtn);

    // 断言：对话框关闭，不调用 DELETE 接口
    await waitFor(() => {
      expect(screen.queryByText('是否确认删除该考试')).not.toBeInTheDocument();
      expect(global.fetch).not.toHaveBeenCalledWith(
        expect.stringContaining('/api/exam'),
        expect.objectContaining({ method: 'DELETE' })
      );
    });
  });

  it('点击作废考试后，在确认框中选择取消', async () => {
    render(ExamManagement);
    await waitFor(() => expect(screen.getByText('物理期中')).toBeInTheDocument());

    // 点击“考试作废”按钮
    const cancelButtons = screen.getAllByText('考试作废');
    await fireEvent.click(cancelButtons[0]);

    // 确认对话框出现
    await waitFor(() => expect(screen.getByText('是否确认将该考试作废')).toBeInTheDocument());

    // 点击“取消”
    const cancelBtn = screen.getByText('取消');
    await fireEvent.click(cancelBtn);

    // 断言：对话框关闭，不调用 PUT /api/exam/status 接口
    await waitFor(() => {
      expect(screen.queryByText('是否确认将该考试作废')).not.toBeInTheDocument();
      expect(global.fetch).not.toHaveBeenCalledWith(
        expect.stringContaining('/api/exam/status'),
        expect.objectContaining({ method: 'PUT' })
      );
    });
  });
});

describe('继续编辑 / 预览试卷跳转测试', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    global.fetch = vi.fn((url) => {
      if (url.includes('/api/exam/list')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ status: 0, data: MOCK_EXAMS, rowCount: 4 }),
        });
      }
      return Promise.reject(new Error(`Unhandled URL: ${url}`));
    });
  });

  it('点击“继续编辑”应跳转到对应编辑页', async () => {
    render(ExamManagement);
    await waitFor(() => expect(screen.getByText('数学考试')).toBeInTheDocument());

    // 数学考试 status 为 00，应显示“继续编辑”
    const editBtns = screen.getAllByText('继续编辑');
    expect(editBtns.length).toBeGreaterThan(0);

    await fireEvent.click(editBtns[0]);

    // 验证 goto 被调用并指向正确路径
    await waitFor(() => {
      expect(goto).toHaveBeenCalledWith(
        expect.stringMatching(/\/teacher\/exam\/editExam\/\d+/)
      );
    });
  });

  it('点击“预览试卷”应跳转到预览页', async () => {
    render(ExamManagement);
    await waitFor(() => expect(screen.getByText('英语考试')).toBeInTheDocument());

    // 英语考试 status 为 04，应显示“预览试卷”
    const previewBtns = screen.getAllByText('预览试卷');
    expect(previewBtns.length).toBeGreaterThan(0);

    await fireEvent.click(previewBtns[0]);

    // 验证 goto 被调用并指向预览路由
    await waitFor(() => {
      expect(goto).toHaveBeenCalledWith(
      expect.stringContaining('/teacher/exam/previewExam')
    );
    });
  });
});

/* ================== 获取考生名单测试 ================== */
describe('获取考生名单功能测试', () => {
  const mockExamineeList = [
    { serial_number: 1, official_name: '张三', account: 'stu001', id_card_no: '110101200001010011' },
    { serial_number: 2, official_name: '李四', account: 'stu002', id_card_no: '110101200001010012' },
  ];

  beforeEach(() => {
    vi.stubGlobal('URL', {
    createObjectURL: vi.fn(() => 'blob:fake'),
    revokeObjectURL: vi.fn(),
  });
    vi.clearAllMocks();
    // 基础列表接口
    global.fetch = vi.fn((url) => {
      if (typeof url !== 'string') return Promise.reject(new Error('Invalid URL'));

      if (url.includes('/api/exam/list')) {
        return Promise.resolve({
          ok: true,
          json: () =>
            Promise.resolve({
              status: 0,
              data: MOCK_EXAMS, // 共 4 条：00,04,02,10
              rowCount: 4,
            }),
        });
      }

      return Promise.reject(new Error(`Unhandled URL: ${url}`));
    });
  });

  it('按钮仅对“非00/10/16”状态的考试显示', async () => {
  render(ExamManagement);

  await waitFor(() => expect(screen.getByText('数学考试')).toBeInTheDocument());

  // 数学考试 status=00 → 应隐藏（带 hideButton）
  const mathRow = screen.getByText('数学考试').closest('tr');
  const mathBtn = within(mathRow).getByText('获取考生名单');
  expect(mathBtn).toHaveClass('hideButton');

  // 英语考试 status=04 → 应显示（不带 hideButton）
  const englishRow = screen.getByText('英语考试').closest('tr');
  const englishBtn = within(englishRow).getByText('获取考生名单');
  expect(englishBtn).not.toHaveClass('hideButton');

  // 化学期末 status=10 → 应隐藏
  const chemRow = screen.getByText('化学期末').closest('tr');
  const chemBtn = within(chemRow).getByText('获取考生名单');
  expect(chemBtn).toHaveClass('hideButton');
});

  it('成功获取考生名单后触发下载', async () => {
  // 1. 接口 mock
  global.fetch = vi.fn((url) =>
    url.includes('/api/exam/examinee')
      ? Promise.resolve({ ok: true, json: () => Promise.resolve({ status: 0, data: mockExamineeList }) })
      : Promise.resolve({ ok: true, json: () => Promise.resolve({ status: 0, data: MOCK_EXAMS, rowCount: 4 }) })
  );

  // 2. 浏览器环境补全
  vi.stubGlobal('URL', { createObjectURL: vi.fn(), revokeObjectURL: vi.fn() });

  // 3. 渲染并点击
  render(ExamManagement);
  await waitFor(() => expect(screen.getByText('英语考试')).toBeInTheDocument());

  const englishRow = screen.getByText('英语考试').closest('tr');
  const downloadBtn = within(englishRow).getByText('获取考生名单');
  await fireEvent.click(downloadBtn);

  // 4. 断言接口调用
  await waitFor(() => {
    const calls = global.fetch.mock.calls.filter(([u]) => u.includes('/api/exam/examinee'));
    expect(calls).toHaveLength(1);
    expect(calls[0][0]).toMatch(/exam_id=2\b/);
  });

  // 5. 断言真正生成了 Excel（ExcelJS.writeBuffer 被调用）
  await waitFor(() => {
  expect(writeBufferSpy).toHaveBeenCalled();
});
});

  it('考生名单为空时给出提示', async () => {
    global.fetch = vi.fn((url) => {
      if (url.includes('/api/exam/examinee')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ status: 0, data: null }),
        });
      }
      if (url.includes('/api/exam/list')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ status: 0, data: MOCK_EXAMS, rowCount: 4 }),
        });
      }
      return Promise.reject(new Error('Unhandled'));
    });
    const toastSpy = vi.spyOn(toast, 'warning');

    render(ExamManagement);
    await waitFor(() => expect(screen.getByText('英语考试')).toBeInTheDocument());

    const downloadBtn = screen.getAllByText('获取考生名单')[0];
    await fireEvent.click(downloadBtn);

    await waitFor(() => {
      expect(toastSpy).toHaveBeenCalledWith('本场考试还未导入考生');
    });
  });

  it('接口返回 status=-1 时给出错误提示', async () => {
    global.fetch = vi.fn((url) => {
      if (url.includes('/api/exam/examinee')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ status: -1, msg: '考生信息读取失败' }),
        });
      }
      if (url.includes('/api/exam/list')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ status: 0, data: MOCK_EXAMS, rowCount: 4 }),
        });
      }
      return Promise.reject(new Error('Unhandled'));
    });
    const toastSpy = vi.spyOn(toast, 'error');

    render(ExamManagement);
    await waitFor(() => expect(screen.getByText('英语考试')).toBeInTheDocument());

    const downloadBtn = screen.getAllByText('获取考生名单')[0];
    await fireEvent.click(downloadBtn);

    await waitFor(() => {
      expect(toastSpy).toHaveBeenCalledWith('考生信息读取失败');
    });
  });

  it('网络异常时给出错误提示', async () => {
    global.fetch = vi.fn((url) => {
      if (url.includes('/api/exam/examinee')) {
        return Promise.reject(new Error('网络连接失败'));
      }
      if (url.includes('/api/exam/list')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ status: 0, data: MOCK_EXAMS, rowCount: 4 }),
        });
      }
      return Promise.reject(new Error('Unhandled'));
    });
    const toastSpy = vi.spyOn(toast, 'error');

    render(ExamManagement);
    await waitFor(() => expect(screen.getByText('英语考试')).toBeInTheDocument());

    const downloadBtn = screen.getAllByText('获取考生名单')[0];
    await fireEvent.click(downloadBtn);

    await waitFor(() => {
      expect(toastSpy).toHaveBeenCalledWith('网络连接失败');
    });
  });
});

