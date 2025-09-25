import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, waitFor, within } from '@testing-library/svelte';
import Title from '$lib/components/Title/Title.svelte';
import InputBox from '$lib/components/Input/InputBox.svelte';
import Empty from '$lib/components/Table/Empty.svelte';
import Pagination from '$lib/components/Pagination/Pagination.svelte';
import Select from '$lib/components/Select/Select.svelte';
import Option from '$lib/components/Select/Option.svelte';
import MessageBox from '$lib/components/MessageBox/MessageBox.svelte';
import EnrollManagement from '../+page.svelte';
import { goto } from '$app/navigation';

// 模拟导航函数
vi.mock('$app/navigation', () => ({
  goto: vi.fn(),
}));

const enroll_list = [
  {
    practiceName: '一道填空题',
    studentCount: 0,
    register: {
      ID: 38,
      Name: '法考报名计划01',
      Course: '02',
      CourseText: '理论',
      ReviewEndTime: 1757036580000,
      ReviewEndTimeText: '2025-09-05 18:23:00',
      MaxNumber: 0,
      StartTime: 1756863782000,
      StartTimeText: '2025-09-03 18:23:02',
      EndTime: 1756950180000,
      EndTimeText: '2025-09-04 18:23:00',
      ExamPlanLocation: '天津市 市辖区 河东区 建安学院',
      Status: '02',
      StatusText: '报名中',
    },
  },
  {
    practiceName: '8月操作系统练习',
    studentCount: 0,
    register: {
      ID: 36,
      Name: '软件工程考试报名20',
      Course: '04',
      CourseText: '实操',
      ReviewEndTime: 1756831261000,
      ReviewEndTimeText: '2025-09-02 20:21:01',
      MaxNumber: 9,
      StartTime: 1756823966000,
      StartTimeText: '2025-09-02 18:32:46',
      EndTime: 1756823966000,
      EndTimeText: '2025-09-02 18:32:46',
      ExamPlanLocation: '广东省湛江市',
      Status: '02',
      StatusText: '报名中',
    },
  },
  {
    practiceName: '练习测试2、一道填空题',
    studentCount: 4,
    register: {
      ID: 29,
      Name: '计组003',
      Course: '00',
      CourseText: '理论、实操',
      ReviewEndTime: 1757059200000,
      ReviewEndTimeText: '2025-09-06 00:00:00',
      MaxNumber: 80,
      StartTime: 1756800000000,
      StartTimeText: '2025-09-02 10:00:00',
      EndTime: 1756807200000,
      EndTimeText: '2025-09-02 12:00:00',
      ExamPlanLocation: '天津市 市辖区 河东区 花园小区16栋',
      Status: '00',
      StatusText: '未开始',
    },
  },
  {
    practiceName: '练习测试2、一道填空题、为练习',
    studentCount: 2,
    register: {
      ID: 21,
      Name: '计组报名01',
      Course: '00',
      CourseText: '理论、实操',
      ReviewEndTime: 1758067200000,
      ReviewEndTimeText: '2025-09-17 00:00:00',
      MaxNumber: 100,
      StartTime: 1757548800000,
      StartTimeText: '2025-09-11 00:00:00',
      EndTime: 1757635200000,
      EndTimeText: '2025-09-12 00:00:00',
      ExamPlanLocation: '天津市 市辖区 河东区 地址',
      Status: '00',
      StatusText: '未开始',
    },
  },
  {
    practiceName: '练习测试试卷',
    studentCount: 3,
    register: {
      ID: 20,
      Name: '测试报名计划',
      Course: '00',
      CourseText: '理论、实操',
      ReviewEndTime: 1756706686,
      ReviewEndTimeText: '2025-09-01 10:24:46',
      MaxNumber: 0,
      StartTime: 1756706686,
      StartTimeText: '2025-09-01 10:24:46',
      EndTime: 1756706686,
      EndTimeText: '2025-09-01 10:24:46',
      ExamPlanLocation: '北京市 市辖区 东城区',
      Status: '00',
      StatusText: '未开始',
    },
  },
  {
    practiceName: '',
    studentCount: 0,
    register: {
      ID: 4,
      Name: '测试计划',
      Course: '00',
      CourseText: '理论、实操',
      ReviewEndTime: 1756636675,
      ReviewEndTimeText: '2025-08-31 15:31:15',
      MaxNumber: 0,
      StartTime: 1756636674,
      StartTimeText: '2025-08-31 15:31:14',
      EndTime: 1756636674,
      EndTimeText: '2025-08-31 15:31:14',
      ExamPlanLocation: '测试地址',
      Status: '08',
      StatusText: '已结束',
    },
  },
  {
    practiceName: '离散数学刷题集',
    studentCount: 10,
    register: {
      ID: 50,
      Name: '离散数学-秋季01',
      Course: '02',
      CourseText: '理论',
      ReviewEndTime: 1757150000000,
      ReviewEndTimeText: '2025-09-06 04:13:20',
      MaxNumber: 60,
      StartTime: 1757063600000,
      StartTimeText: '2025-09-05 04:13:20',
      EndTime: 1757240000000,
      EndTimeText: '2025-09-07 04:13:20',
      ExamPlanLocation: '上海市 浦东新区 校区A',
      Status: '02',
      StatusText: '报名中',
    },
  },
  {
    practiceName: 'C语言期末专项',
    studentCount: 45,
    register: {
      ID: 51,
      Name: 'C语言期末-一班',
      Course: '00',
      CourseText: '理论、实操',
      ReviewEndTime: 1757409200000,
      ReviewEndTimeText: '2025-09-09 04:13:20',
      MaxNumber: 50,
      StartTime: 1757322800000,
      StartTimeText: '2025-09-08 04:13:20',
      EndTime: 1757572000000,
      EndTimeText: '2025-09-11 04:13:20',
      ExamPlanLocation: '杭州市 西湖区',
      Status: '00',
      StatusText: '已发布',
    },
  },
  {
    practiceName: '数据结构竞赛集训',
    studentCount: 30,
    register: {
      ID: 52,
      Name: '数据结构-春季赛道',
      Course: '04',
      CourseText: '实操',
      ReviewEndTime: 1756280000000,
      ReviewEndTimeText: '2025-08-27 04:13:20',
      MaxNumber: 0,
      StartTime: 1756193600000,
      StartTimeText: '2025-08-26 04:13:20',
      EndTime: 1756366400000,
      EndTimeText: '2025-08-28 04:13:20',
      ExamPlanLocation: '深圳市 南山区 创新园',
      Status: '04',
      StatusText: '已结束',
    },
  },
  {
    practiceName: '计算机网络强化',
    studentCount: 5,
    register: {
      ID: 53,
      Name: '计网-强化一期',
      Course: '02',
      CourseText: '理论',
      ReviewEndTime: 1757247200000,
      ReviewEndTimeText: '2025-09-07 06:13:20',
      MaxNumber: 20,
      StartTime: 1757067200000,
      StartTimeText: '2025-09-05 06:13:20',
      EndTime: 1757672000000,
      EndTimeText: '2025-09-12 06:13:20',
      ExamPlanLocation: '广州市 天河区',
      Status: '06',
      StatusText: '审核截止',
    },
  },
  {
    practiceName: '操作系统-Lab合集',
    studentCount: 0,
    register: {
      ID: 54,
      Name: 'OS-Lab-第2期',
      Course: '04',
      CourseText: '实操',
      ReviewEndTime: 1757060000000,
      ReviewEndTimeText: '2025-09-05 03:13:20',
      MaxNumber: 40,
      StartTime: 1757060000000,
      StartTimeText: '2025-09-05 03:13:20',
      EndTime: 1757664800000,
      EndTimeText: '2025-09-12 03:13:20',
      ExamPlanLocation: '南京市 玄武区',
      Status: '12',
      StatusText: '已取消',
    },
  },
  {
    practiceName: '数据库实训',
    studentCount: 12,
    register: {
      ID: 55,
      Name: '数据库-基础到进阶',
      Course: '00',
      CourseText: '理论、实操',
      ReviewEndTime: 1758000000000,
      ReviewEndTimeText: '2025-09-16 10:00:00',
      MaxNumber: 100,
      StartTime: 1757913600000,
      StartTimeText: '2025-09-15 10:00:00',
      EndTime: 1758172800000,
      EndTimeText: '2025-09-18 10:00:00',
      ExamPlanLocation: '天津市 河西区 教学楼3层',
      Status: '02',
      StatusText: '报名中',
    },
  },
  {
    practiceName: '软件测试方法',
    studentCount: 18,
    register: {
      ID: 56,
      Name: '软件测试-提高班',
      Course: '02',
      CourseText: '理论',
      ReviewEndTime: 1758700000000,
      ReviewEndTimeText: '2025-09-24 10:00:00',
      MaxNumber: 30,
      StartTime: 1758440800000,
      StartTimeText: '2025-09-21 10:00:00',
      EndTime: 1758872800000,
      EndTimeText: '2025-09-26 10:00:00',
      ExamPlanLocation: '成都市 高新区 A座',
      Status: '00',
      StatusText: '已发布',
    },
  },
];

describe('报名管理计划展示页面测试', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    // mock fetch 返回 enroll_list
    vi.stubGlobal(
      'fetch',
      vi.fn(() =>
        Promise.resolve({
          ok: true,
          json: () =>
            Promise.resolve({
              data: {
                registers: enroll_list,
                total: enroll_list.length,
              },
            }),
        }),
      ),
    );
  });

  it('renders page title', () => {
    render(EnrollManagement);
    expect(screen.getByText('报名列表')).toBeInTheDocument();
  });

  it('renders search input and filters', () => {
    render(EnrollManagement);

    // 输入框
    expect(screen.getByPlaceholderText('请输入关键词')).toBeInTheDocument();

    // 下拉框 label
    expect(screen.getByText('计划状态')).toBeInTheDocument();
    expect(screen.getAllByText('考试科目').length).toBeGreaterThan(0);
  });

  it('renders action buttons', () => {
    render(EnrollManagement);

    expect(screen.getByText('新增')).toBeInTheDocument();
    expect(screen.getAllByText('批量删除').length).toBeGreaterThan(0);
    expect(screen.getAllByText('批量作废').length).toBeGreaterThan(0);
  });

  it('renders table headers', () => {
    render(EnrollManagement);

    expect(screen.getByText('名称')).toBeInTheDocument();
    expect(screen.getAllByText('考试科目').length).toBeGreaterThan(0);
    expect(screen.getByText('当前人数/计划人数')).toBeInTheDocument();
    expect(screen.getByText('审核截止时间')).toBeInTheDocument();
    expect(screen.getByText('开始时间 ~ 结束时间')).toBeInTheDocument();
    expect(screen.getByText('绑定练习')).toBeInTheDocument();
    expect(screen.getByText('状态')).toBeInTheDocument();
    expect(screen.getByText('操作')).toBeInTheDocument();
  });

  it('renders row action buttons depending on status', async () => {
    render(EnrollManagement);

    await waitFor(() => {
      // 未发布 -> 应该有 发布、编辑、删除
      expect(screen.getAllByText('发布')[0]).toBeInTheDocument();
      expect(screen.getAllByText('编辑')[0]).toBeInTheDocument();
      expect(screen.getAllByText('删除')[0]).toBeInTheDocument();

      // 已发布 -> 应该有 查看考生、编辑、作废
      expect(screen.getAllByText('查看考生').length).toBeGreaterThan(0);
      expect(screen.getAllByText('作废').length).toBeGreaterThan(0);

      // 审核截止 -> 只显示 查看考生
      expect(screen.getAllByText('查看考生').length).toBeGreaterThan(0);
    });
  });

  it('renders table rows after fetch', async () => {
    render(EnrollManagement);

    // 等待异步 fetch 结束后 DOM 更新
    await waitFor(() => {
      expect(screen.getByText('法考报名计划01')).toBeInTheDocument();
    });

    expect(screen.getByText('软件工程考试报名20')).toBeInTheDocument();
  });

  it('click 新增 跳转到新增页面', async () => {
    render(EnrollManagement);

    await waitFor(() => {
      expect(screen.getByText('新增')).toBeInTheDocument();
    });

    await fireEvent.click(screen.getByText('新增'));
    expect(goto).toHaveBeenCalledWith('/teacher/enroll/add-enroll');
  });

  it('未发布行：点击 发布 弹出确认框并确认后发送 PATCH', async () => {
    const fetchSpy = global.fetch;
    render(EnrollManagement);

    // 等待行渲染
    await waitFor(() => {
      expect(screen.getAllByText('发布')[0]).toBeInTheDocument();
    });

    // 第一条未发布记录为 ID=38
    await fireEvent.click(screen.getAllByText('发布')[0]);

    // 弹出确认框标题
    await waitFor(() => {
      expect(screen.getByText('确认发布')).toBeInTheDocument();
    });

    // 点击确认（MessageBox 内部按钮通常为“确定”）
    await fireEvent.click(screen.getByText('确定'));

    // 断言发起 PATCH 调用
    expect(fetchSpy).toHaveBeenCalledWith(
      expect.stringContaining('/api/registration?ids=38&status=00'),
      expect.objectContaining({ method: 'PATCH' }),
    );
  });

  it('未发布行：点击 编辑 跳转到编辑页', async () => {
    render(EnrollManagement);

    await waitFor(() => {
      // 针对第一条未发布记录（ID=38）
      expect(screen.getAllByText('编辑')[0]).toBeInTheDocument();
    });

    await fireEvent.click(screen.getAllByText('编辑')[0]);
    expect(goto).toHaveBeenCalledWith('/teacher/enroll/edit-enroll/38');
  });

  it('已发布行：点击 查看考生 跳转到查看页', async () => {
    render(EnrollManagement);

    // 第一条已发布记录在 mock 数据中为 ID=29
    await waitFor(() => {
      expect(screen.getAllByText('查看考生')[0]).toBeInTheDocument();
    });

    await fireEvent.click(screen.getAllByText('查看考生')[0]);
    expect(goto).toHaveBeenCalledWith('/teacher/enroll/see-enroll/29');
  });

  it('批量删除：仅未发布(状态02)为合法，弹出确认并确认后逐条 PATCH status=10', async () => {
    const fetchSpy = global.fetch;
    const { container } = render(EnrollManagement);

    // 等待表格渲染完成
    await waitFor(() => {
      expect(screen.getByText('法考报名计划01')).toBeInTheDocument();
    });

    // 勾选前两条未发布记录（ID=38, 36）
    const checkboxes = container.querySelectorAll('input.checkbox');
    // 第一个为表头全选，从第二个开始是数据行
    await fireEvent.click(checkboxes[1]);
    await fireEvent.click(checkboxes[2]);

    // 点击批量删除
    await fireEvent.click(screen.getByText('批量删除'));

    // 应出现“确认删除”
    await waitFor(() => {
      expect(screen.getByText('确认删除')).toBeInTheDocument();
    });

    // 确认
    await fireEvent.click(screen.getByText('确定'));

    // 对两条记录调用 PATCH status=10
    expect(fetchSpy).toHaveBeenCalledWith(
      expect.stringContaining('/api/registration?ids=38&status=10'),
      expect.objectContaining({ method: 'PATCH' }),
    );
    expect(fetchSpy).toHaveBeenCalledWith(
      expect.stringContaining('/api/registration?ids=36&status=10'),
      expect.objectContaining({ method: 'PATCH' }),
    );
  });

  it('批量作废：仅已发布(状态00)为合法，确认后逐条 PATCH status=08', async () => {
    const fetchSpy = global.fetch;
    const { container } = render(EnrollManagement);

    await waitFor(() => {
      expect(screen.getByText('计组003')).toBeInTheDocument();
    });

    // 勾选两条已发布（ID=29, 21）
    const checkboxes = container.querySelectorAll('input.checkbox');
    // 这里根据数据顺序：
    // 行顺序对应 enroll_list 顺序，找到对应的两行勾选
    // 表头是 index 0，数据行从 1 开始
    // 索引: 1->ID=38, 2->ID=36, 3->ID=29, 4->ID=21
    await fireEvent.click(checkboxes[3]); // ID=29
    await fireEvent.click(checkboxes[4]); // ID=21

    await fireEvent.click(screen.getByText('批量作废'));

    await waitFor(() => {
      expect(screen.getByText('确认作废')).toBeInTheDocument();
    });

    await fireEvent.click(screen.getByText('确定'));

    expect(fetchSpy).toHaveBeenCalledWith(
      expect.stringContaining('/api/registration?ids=29&status=08'),
      expect.objectContaining({ method: 'PATCH' }),
    );
    expect(fetchSpy).toHaveBeenCalledWith(
      expect.stringContaining('/api/registration?ids=21&status=08'),
      expect.objectContaining({ method: 'PATCH' }),
    );
  });

  it('单选后点击 批量删除：未发布单条合法，确认后 PATCH status=10', async () => {
    const fetchSpy = global.fetch;
    const { container } = render(EnrollManagement);

    await waitFor(() => {
      expect(screen.getByText('法考报名计划01')).toBeInTheDocument();
    });

    // 勾选第一条未发布（ID=38）
    const checkboxes = container.querySelectorAll('input.checkbox');
    await fireEvent.click(checkboxes[1]);

    await fireEvent.click(screen.getByText('批量删除'));

    await waitFor(() => {
      expect(screen.getByText('确认删除')).toBeInTheDocument();
    });

    await fireEvent.click(screen.getByText('确定'));

    expect(fetchSpy).toHaveBeenCalledWith(
      expect.stringContaining('/api/registration?ids=38&status=10'),
      expect.objectContaining({ method: 'PATCH' }),
    );
  });

  it('行内删除按钮：未发布行弹出确认并确认后 PATCH status=10', async () => {
    const fetchSpy = global.fetch;
    render(EnrollManagement);

    await waitFor(() => {
      // 第一条未发布行出现“删除”按钮
      expect(screen.getAllByText('删除')[0]).toBeInTheDocument();
    });

    await fireEvent.click(screen.getAllByText('删除')[0]);

    await waitFor(() => {
      expect(screen.getByText('确认删除')).toBeInTheDocument();
    });

    await fireEvent.click(screen.getByText('确定'));

    expect(fetchSpy).toHaveBeenCalledWith(
      expect.stringContaining('/api/registration?ids=38&status=10'),
      expect.objectContaining({ method: 'PATCH' }),
    );
  });

  it('单选后点击 批量作废：已发布单条合法，确认后 PATCH status=08', async () => {
    const fetchSpy = global.fetch;
    const { container } = render(EnrollManagement);

    await waitFor(() => {
      // 第一条已发布（根据数据为 ID=29）应出现在表中
      expect(screen.getByText('计组003')).toBeInTheDocument();
    });

    // 勾选 ID=29（第三条数据行，索引3）
    const checkboxes = container.querySelectorAll('input.checkbox');
    await fireEvent.click(checkboxes[3]);

    await fireEvent.click(screen.getByText('批量作废'));

    await waitFor(() => {
      expect(screen.getByText('确认作废')).toBeInTheDocument();
    });

    await fireEvent.click(screen.getByText('确定'));

    expect(fetchSpy).toHaveBeenCalledWith(
      expect.stringContaining('/api/registration?ids=29&status=08'),
      expect.objectContaining({ method: 'PATCH' }),
    );
  });

  it('行内作废按钮：已发布行弹出确认并确认后 PATCH status=08', async () => {
    const fetchSpy = global.fetch;
    render(EnrollManagement);

    await waitFor(() => {
      // 已发布行应包含“作废”按钮
      expect(screen.getAllByText('作废')[0]).toBeInTheDocument();
    });

    await fireEvent.click(screen.getAllByText('作废')[0]);

    await waitFor(() => {
      expect(screen.getByText('确认作废')).toBeInTheDocument();
    });

    await fireEvent.click(screen.getByText('确定'));

    // 第一条已发布为 ID=29
    expect(fetchSpy).toHaveBeenCalledWith(
      expect.stringContaining('/api/registration?ids=29&status=08'),
      expect.objectContaining({ method: 'PATCH' }),
    );
  });

  it('行内删除按钮（按行精确定位）：点击后确认，PATCH 对应 ID=36', async () => {
    const fetchSpy = global.fetch;
    const { container } = render(EnrollManagement);

    await waitFor(() => {
      expect(screen.getByText('软件工程考试报名20')).toBeInTheDocument();
    });

    const rowText = screen.getByText('软件工程考试报名20');
    const row = rowText.closest('tr');
    const scope = within(row);

    await fireEvent.click(scope.getByText('删除'));

    await waitFor(() => {
      expect(screen.getByText('确认删除')).toBeInTheDocument();
    });

    await fireEvent.click(screen.getByText('确定'));

    expect(fetchSpy).toHaveBeenCalledWith(
      expect.stringContaining('/api/registration?ids=36&status=10'),
      expect.objectContaining({ method: 'PATCH' }),
    );
  });

  it('行内作废按钮（按行精确定位）：点击后确认，PATCH 对应 ID=51', async () => {
    const fetchSpy = global.fetch;
    const { container } = render(EnrollManagement);

    await waitFor(() => {
      expect(screen.getByText('C语言期末-一班')).toBeInTheDocument();
    });

    const rowText = screen.getByText('C语言期末-一班');
    const row = rowText.closest('tr');
    const scope = within(row);

    await fireEvent.click(scope.getByText('作废'));

    await waitFor(() => {
      expect(screen.getByText('确认作废')).toBeInTheDocument();
    });

    await fireEvent.click(screen.getByText('确定'));

    expect(fetchSpy).toHaveBeenCalledWith(
      expect.stringContaining('/api/registration?ids=51&status=08'),
      expect.objectContaining({ method: 'PATCH' }),
    );
  });

  it('handleSelectAll：点击表头复选框应全选，再次点击应全不选', async () => {
    const { container } = render(EnrollManagement);

    // 等待数据渲染完成
    await waitFor(() => {
      expect(screen.getByText('法考报名计划01')).toBeInTheDocument();
    });

    const checkboxes = container.querySelectorAll('input.checkbox');
    const header = checkboxes[0];

    // 全选
    await fireEvent.click(header);

    // 所有行复选框应该被选中
    for (let i = 1; i < checkboxes.length; i += 1) {
      expect(checkboxes[i].checked).toBe(true);
    }

    // 取消全选
    await fireEvent.click(header);

    // 所有行复选框应该未选中
    for (let i = 1; i < checkboxes.length; i += 1) {
      expect(checkboxes[i].checked).toBe(false);
    }
  });

  it('handleSelectAll 后点击 批量作废：应出现 部分选择无效 提示', async () => {
    const { container } = render(EnrollManagement);

    await waitFor(() => {
      expect(screen.getByText('法考报名计划01')).toBeInTheDocument();
    });

    const checkboxes = container.querySelectorAll('input.checkbox');
    const header = checkboxes[0];

    // 全选
    await fireEvent.click(header);

    // 点击批量作废
    await fireEvent.click(screen.getByText('批量作废'));

    // 因为存在不符合作废条件的项，应出现“部分选择无效”
    await waitFor(() => {
      expect(screen.getByText('部分选择无效')).toBeInTheDocument();
    });
  });

  it('handlePageChange：触发分页事件应以新页码请求数据', async () => {
    const fetchSpy = global.fetch;
    const { container } = render(EnrollManagement);

    await waitFor(() => {
      expect(screen.getByText('法考报名计划01')).toBeInTheDocument();
    });

    // 模拟点击下一页按钮
    const nextButton = screen.getByTestId('right_jt');

    // 第二页
    await fireEvent.click(nextButton);
    expect(screen.getByText('2')).toHaveClass('active');
  });

  it('handlePageSizeChange：改变页面大小后再次触发分页，带上新的 pageSize', async () => {
    const fetchSpy = global.fetch;
    const { container } = render(EnrollManagement);

    await waitFor(() => {
      expect(screen.getByText('法考报名计划01')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('20条/页'));

    await waitFor(() => {
      const calls = fetchSpy.mock.calls;
      expect(calls.length).toBe(2);
      const lastCallUrl = String(calls[calls.length - 1]?.[0] || '');
      expect(lastCallUrl).toContain('/api/registration?page=1&pageSize=20&name=&status=&course=');
    });
  });

  it('handleInput：输入关键词应以 name 查询参数请求', async () => {
    const fetchSpy = global.fetch;
    render(EnrollManagement);

    await waitFor(() => {
      expect(screen.getByPlaceholderText('请输入关键词')).toBeInTheDocument();
    });

    const input = screen.getByPlaceholderText('请输入关键词');
    input.value = '计组';
    await fireEvent.input(input);

    await waitFor(() => {
      const calls = fetchSpy.mock.calls;
      expect(calls.length).toBeGreaterThan(1);
      const lastCallUrl = String(calls[calls.length - 1]?.[0] || '');
      expect(lastCallUrl).toContain('name=计组');
    });
  });

  it('handleChangePlan：选择计划状态应带上 status 参数', async () => {
    const fetchSpy = global.fetch;
    const { container } = render(EnrollManagement);

    await waitFor(() => {
      const selects = container.querySelectorAll('[data-testid="select"]');
      expect(selects.length).toBeGreaterThan(0);
    });

    const selects = container.querySelectorAll('[data-testid="select"]');
    const planSelect = selects[0];
    within(planSelect).getByRole('button', { name: 'Toggle dropdown' }).click();
    await fireEvent.click(within(planSelect).getByText('已发布'));

    await waitFor(() => {
      const calls = fetchSpy.mock.calls;
      expect(calls.length).toBeGreaterThan(1);
      const lastCallUrl = String(calls[calls.length - 1]?.[0] || '');
      expect(lastCallUrl).toContain('status=00');
    });
  });

  it('handleChangeSubject：选择考试科目应带上 course 参数', async () => {
    const fetchSpy = global.fetch;
    const { container } = render(EnrollManagement);

    await waitFor(() => {
      const selects = container.querySelectorAll('[data-testid="select"]');
      expect(selects.length).toBeGreaterThan(1);
    });

    const selects = container.querySelectorAll('[data-testid="select"]');
    const subjectSelect = selects[1];
    within(subjectSelect).getByRole('button', { name: 'Toggle dropdown' }).click();
    await fireEvent.click(within(subjectSelect).getByText('实操'));

    await waitFor(() => {
      const calls = fetchSpy.mock.calls;
      expect(calls.length).toBeGreaterThan(1);
      const lastCallUrl = String(calls[calls.length - 1]?.[0] || '');
      expect(lastCallUrl).toContain('course=04');
    });
  });

  it('getEnrollData：fetch 返回错误时显示空状态', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(() =>
        Promise.resolve({
          ok: false,
        }),
      ),
    );

    render(EnrollManagement);

    await waitFor(() => {
      // 确保已发起请求
      expect(global.fetch).toHaveBeenCalled();
    });

    // 保持为空则应展示空状态
    expect(screen.getByText('暂无报名数据')).toBeInTheDocument();
  });

  it('Course 不在映射中时，显示原始代码值', async () => {
    const custom_list = [
      {
        practiceName: '自定义练习',
        studentCount: 0,
        register: {
          ID: 101,
          Name: '未知科目报名',
          Course: '99',
          ReviewEndTime: 1757000000000,
          StartTime: 1756900000000,
          EndTime: 1757100000000,
          ExamPlanLocation: '测试',
          Status: '02',
        },
      },
    ];

    vi.stubGlobal(
      'fetch',
      vi.fn(() =>
        Promise.resolve({
          ok: true,
          json: () =>
            Promise.resolve({
              data: {
                registers: custom_list,
                total: 1,
              },
            }),
        }),
      ),
    );

    render(EnrollManagement);

    // 等待表格渲染
    await waitFor(() => {
      expect(screen.getByText('未知科目报名')).toBeInTheDocument();
    });

    const row = screen.getByText('未知科目报名').closest('tr');
    const scope = within(row);
    // 科目列应显示原始代码 '99'
    expect(scope.getByText('99')).toBeInTheDocument();
  });

  it('Status 不在映射中时，状态列显示原始代码值', async () => {
    const custom_list = [
      {
        practiceName: '状态未映射练习',
        studentCount: 0,
        register: {
          ID: 102,
          Name: '未知状态报名',
          Course: '02',
          ReviewEndTime: 1757000000000,
          StartTime: 1756900000000,
          EndTime: 1757100000000,
          ExamPlanLocation: '测试',
          Status: '99',
        },
      },
    ];

    vi.stubGlobal(
      'fetch',
      vi.fn(() =>
        Promise.resolve({
          ok: true,
          json: () =>
            Promise.resolve({
              data: {
                registers: custom_list,
                total: 1,
              },
            }),
        }),
      ),
    );

    render(EnrollManagement);

    await waitFor(() => {
      expect(screen.getByText('未知状态报名')).toBeInTheDocument();
    });

    const row = screen.getByText('未知状态报名').closest('tr');
    const scope = within(row);
    // 状态列应显示原始代码 '99'
    expect(scope.getByText('99')).toBeInTheDocument();
  });

  it('handleMessageBoxCancel：发布弹窗点击取消后不应触发 PATCH，弹窗关闭', async () => {
    const fetchSpy = global.fetch;
    render(EnrollManagement);

    await waitFor(() => {
      expect(screen.getAllByText('发布')[0]).toBeInTheDocument();
    });

    await fireEvent.click(screen.getAllByText('发布')[0]);

    await waitFor(() => {
      expect(screen.getByText('确认发布')).toBeInTheDocument();
      expect(screen.getByText('取消')).toBeInTheDocument();
    });

    await fireEvent.click(screen.getByText('取消'));

    // 弹窗应关闭
    await waitFor(() => {
      expect(screen.queryByText('确认发布')).not.toBeInTheDocument();
    });

    // 不应发送发布 PATCH 请求
    expect(fetchSpy).not.toHaveBeenCalledWith(
      expect.stringContaining('/api/registration?ids=38&status=00'),
      expect.objectContaining({ method: 'PATCH' }),
    );
  });

  it('handleMessageBoxCancel：批量删除弹窗点击取消后清空选择，再次点击不出现确认', async () => {
    const { container } = render(EnrollManagement);

    await waitFor(() => {
      expect(screen.getByText('法考报名计划01')).toBeInTheDocument();
    });

    const checkboxes = container.querySelectorAll('input.checkbox');
    // 勾选两条（确保能弹出批量删除）
    await fireEvent.click(checkboxes[1]);
    await fireEvent.click(checkboxes[2]);

    await fireEvent.click(screen.getByText('批量删除'));

    await waitFor(() => {
      expect(screen.getByText('确认删除')).toBeInTheDocument();
      expect(screen.getByText('取消')).toBeInTheDocument();
    });

    // 点击取消
    await fireEvent.click(screen.getByText('取消'));

    // 弹窗关闭
    await waitFor(() => {
      expect(screen.queryByText('确认删除')).not.toBeInTheDocument();
    });

    // 因为取消会清空选择，此时再次点击批量删除不应再出现确认弹窗
    await fireEvent.click(screen.getByText('批量删除'));

    await waitFor(() => {
      expect(screen.queryByText('确认删除')).not.toBeInTheDocument();
    });
  });
});
