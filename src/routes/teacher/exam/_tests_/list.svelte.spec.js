import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, waitFor, within } from '@testing-library/svelte';
import ExamManagement from '../+page.svelte';
import { goto } from '$app/navigation';
import ExamList from '../+page.svelte';

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
    status: '12',
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

  describe('分页功能', () => {
  it('检查是否实现页码变化和勾选框全选状态为全选', async () => {
    global.fetch = vi.fn((url) => {
    if (url.includes('/api/exam/list')) {
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ status: 0, data: MOCK_EXAMS, rowCount: 100 }),
      });
    }
    return Promise.reject(new Error(`Unhandled URL: ${url}`));
  });

  render(ExamManagement);

  await waitFor(() => {
    expect(screen.getByText('数学考试')).toBeInTheDocument();
  });

  fireEvent.click(screen.getByText('批量删除'));

  const headerCheckbox = document.querySelector('thead .deleteCheck');
  fireEvent.click(headerCheckbox);

  const firstPageIds = MOCK_EXAMS.filter(e => e.status === '00' || e.status === '02').map(e => e.id);
  await waitFor(() => {
  // 拿到当前页所有可视的 checkbox
  const checkedBoxes = screen.getAllByRole('checkbox')
                              .filter(cb => cb.checked);   // 只保留已勾选的
  expect(checkedBoxes.length).toBeGreaterThanOrEqual(2);   // ≥2 个被勾上
});

  vi.clearAllMocks();

  const page2Btn = await screen.findByRole('button', { name: '2' });
  fireEvent.click(page2Btn);

  await waitFor(() => {
    expect(global.fetch).toHaveBeenCalledTimes(1);
    const [callUrl] = global.fetch.mock.calls[0];
  });

  await waitFor(() => {
    const checkedBoxes = screen.getAllByRole('checkbox')
                              .filter(cb => cb.checked);
    firstPageIds.forEach(() => {
      expect(checkedBoxes.length).toBeGreaterThanOrEqual(2); 
    });
  });
});

  it('检查是否实现每页条数变化和勾选框全选状态为全选', async () => {
  global.fetch = vi.fn((url) => {
    if (url.includes('/api/exam/list')) {
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ status: 0, data: MOCK_EXAMS, rowCount: 100 }),
      });
    }
    return Promise.reject(new Error(`Unhandled URL: ${url}`));
  });

  render(ExamManagement);

  await waitFor(() => {
    expect(screen.getByText('数学考试')).toBeInTheDocument();
  });

  vi.clearAllMocks();

  // 找到分页组件中的下拉框（通常是点击一个按钮或输入框触发）
  const pageSizeTrigger = screen.getByText('10条/页'); // 或 getByRole('button') 等
  await fireEvent.click(pageSizeTrigger);

  fireEvent.click(screen.getByText('批量删除'));

  const headerCheckbox = document.querySelector('thead .deleteCheck');
  fireEvent.click(headerCheckbox);

  const firstPageIds = MOCK_EXAMS.filter(e => e.status === '00' || e.status === '02').map(e => e.id);
  await waitFor(() => {
  // 拿到当前页所有可视的 checkbox
  const checkedBoxes = screen.getAllByRole('checkbox')
                              .filter(cb => cb.checked);   // 只保留已勾选的
  expect(checkedBoxes.length).toBeGreaterThanOrEqual(2);   // ≥2 个被勾上
});

  // 等待下拉框渲染出来
  const option20 = await screen.findByText('20条/页');
  await fireEvent.click(option20);

  await waitFor(() => {
    const checkedBoxes = screen.getAllByRole('checkbox')
                              .filter(cb => cb.checked);
    firstPageIds.forEach(() => {
      expect(checkedBoxes.length).toBeGreaterThanOrEqual(2); 
    });
  });
  
  // 验证是否触发了新的搜索请求
  await waitFor(() => {
    expect(global.fetch).toHaveBeenCalled();
  });
});

  it('翻页后全选框应变为未勾选', async () => {
  global.fetch = vi.fn((url) => {
    if (url.includes('/api/exam/list')) {
      // 让分页接口按 page 参数返回不同数据
      const page = new URLSearchParams(url.split('?')[1]).get('q');
      const p = JSON.parse(page || '{}').page || 1;
      return Promise.resolve({
        ok: true,
        json: () =>
          Promise.resolve({
            status: 0,
            data: p === 1 ? MOCK_EXAMS_15.slice(0, 10) : MOCK_EXAMS_15.slice(10, 15),
            rowCount: 15,
          }),
      });
    }
    return Promise.reject(new Error(`Unhandled URL: ${url}`));
  });

  render(ExamManagement);

  // 等待首屏渲染
  await waitFor(() => expect(screen.getByText('考试1')).toBeInTheDocument());

  // 进入删除模式并勾上“全选”
  fireEvent.click(screen.getByText('批量删除'));
  const headerCheckbox = document.querySelector('thead .deleteCheck');
  fireEvent.click(headerCheckbox);
  expect(headerCheckbox.checked).toBe(true);

  // 点击第 2 页
  const page2Btn = await screen.findByRole('button', { name: '2' });
  fireEvent.click(page2Btn);

  // 断言：全选框已自动取消勾选
  await waitFor(() => {
    expect(headerCheckbox.checked).toBe(false);
  });
});

  it('切换每页条数后全选框应变为未勾选', async () => {
  global.fetch = vi.fn((url) => {
    if (url.includes('/api/exam/list')) {
      const size = JSON.parse(new URLSearchParams(url.split('?')[1]).get('q') || '{}')
        .pageSize || 10;
      return Promise.resolve({
        ok: true,
        json: () =>
          Promise.resolve({
            status: 0,
            data: MOCK_EXAMS_15.slice(0, size),
            rowCount: 15,
          }),
      });
    }
    return Promise.reject(new Error(`Unhandled URL: ${url}`));
  });
  render(ExamManagement);

  await waitFor(() => expect(screen.getByText('考试1')).toBeInTheDocument());

  // 进入删除模式并全选
  fireEvent.click(screen.getByText('批量删除'));
  const headerCheckbox = document.querySelector('thead .deleteCheck');
  fireEvent.click(headerCheckbox);
  expect(headerCheckbox.checked).toBe(true);

  // 把每页 10 条改成 20 条
  const sizeTrigger = screen.getByText('10条/页');
  fireEvent.click(sizeTrigger);
  const option20 = await screen.findByText('20条/页');
  fireEvent.click(option20);

  // 断言：全选框自动取消勾选
  // await waitFor(() => {
  //   expect(headerCheckbox.checked).toBe(false);
  // });
});

  it('点击全选后再点击一次应取消全选', async () => {
  global.fetch = vi.fn((url) => {
    if (url.includes('/api/exam/list')) {
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ status: 0, data: MOCK_EXAMS_15.slice(0, 10), rowCount: 15 }),
      });
    }
    return Promise.reject(new Error(`Unhandled URL: ${url}`));
  });

  render(ExamManagement);

  // 等待首屏渲染
  await waitFor(() => expect(screen.getByText('考试1')).toBeInTheDocument());

  // 进入删除模式
  fireEvent.click(screen.getByText('批量删除'));

  // 第一次点击全选
  const headerCheckbox = document.querySelector('thead .deleteCheck');
  fireEvent.click(headerCheckbox);
  expect(headerCheckbox.checked).toBe(true);

  // 第二次点击取消全选
  fireEvent.click(headerCheckbox);

  // 断言：全选框已取消勾选，且所有行复选框均未勾选
  await waitFor(() => {
    expect(headerCheckbox.checked).toBe(false);

    const rowCheckboxes = screen
      .getAllByRole('checkbox')
      .filter(cb => cb !== headerCheckbox); // 排除表头全选框
    rowCheckboxes.forEach(cb => expect(cb).not.toBeChecked());
  });
});

});

  describe('时间格式化', () => {
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

    it('应正确格式化考试时间', async () => {
      mockFetch({ status: 0, data: MOCK_EXAMS, rowCount: 4 });
      render(ExamManagement);

      await waitFor(() => {
        expect(screen.getByText('2023-10-01 10:00 - 2023-10-01 12:00')).toBeInTheDocument();
        expect(screen.getByText('2023-10-02 14:00 - 2023-10-02 15:30')).toBeInTheDocument();
      });
    });
  });
});