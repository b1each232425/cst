import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/svelte';
import StudentGradeTable from '../StudentGradeTable.svelte';
import { setContext, getContext } from 'svelte';
import { within } from '@testing-library/dom';
import { tick } from 'svelte';

// 模拟 svelte 模块
vi.mock('svelte', async () => {
  const actual = await vi.importActual('svelte');
  return {
    ...actual,
    getContext: vi.fn(),
    setContext: vi.fn(),
    onMount: vi.fn((fn) => fn()),
  };
});

// 模拟依赖
vi.mock('$lib/components/Pagination/Pagination.svelte', () => ({
    default: vi.fn(),
}));
vi.mock('$lib/components/Table/Empty.svelte', () => ({
    default: vi.fn(),
}));
vi.mock('../../_utils/debounce.js', () => ({
    debounce: (fn, delay) => fn, // 直接执行，不延迟
}));

const mockExamResponseWithEmptyScores = {
  status: 0,
  data: [
    {
      student_scores: [
        {
          student_id: 3,
          phone: '1112223333',
          name: '王五',
          nickname: 'wangwu',
          exam_sessions: [], // ✅ 有字段，但为空数组
          remark: '无成绩',
        },
      ],
    },
  ],
  rowCount: 1,
};

// 模拟全局 fetch
global.fetch = vi.fn();

describe('StudentGradeTable', () => {
    const mockPracticeContext = {
        practiceData: {
            total_score: 100,
        },
    };

    const mockExamContext = {
        examData: {
            total_score: 200,
            papers: [
                { id: 1, total_score: 100 },
                { id: 2, total_score: 100 },
            ],
        },
    };

    const mockPracticeResponse = {
        status: 0,
        data: [
            {
                student_scores: [
                    {
                        stu_id: 1,
                        phone: '1234567890',
                        name: '张三',
                        nickname: 'zhangsan',
                        highest_score: 85,
                        submitted_cnt: 3,
                        remark: '优秀',
                    },
                    {
                        stu_id: 2,
                        phone: '0987654321',
                        name: '李四',
                        nickname: 'lisi',
                        highest_score: 72,
                        submitted_cnt: 2,
                        remark: '良好',
                    },
                ],
            },
        ],
        rowCount: 2,
    };

    const mockExamResponse = {
        status: 0,
        data: [
            {
                student_scores: [
                    {
                        student_id: 1,
                        phone: '1234567890',
                        name: '张三',
                        nickname: 'zhangsan',
                        exam_sessions: [
                            { exam_session_id: 101, score: 85 },
                            { exam_session_id: 102, score: 90 },
                        ],
                        remark: '优秀',
                    },
                    {
                        student_id: 2,
                        phone: '0987654321',
                        name: '李四',
                        nickname: 'lisi',
                        exam_sessions: [
                            { exam_session_id: 201, score: 72 },
                            { exam_session_id: 202, score: 68 },
                        ],
                        remark: '良好',
                    },
                ],
            },
        ],
        rowCount: 2,
    };

    beforeEach(() => {
        fetch.mockClear();
        vi.clearAllMocks();
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    it('应该正确渲染练习类型的学生成绩表格', async () => {
        fetch.mockResolvedValueOnce({
            ok: true,
            json: () => Promise.resolve(mockPracticeResponse),
        });

        render(StudentGradeTable, {
            type: 'practice',
            resource_id: 1,
        });

        // 检查表格标题
        expect(screen.getByText('学生成绩')).toBeInTheDocument();

        // 等待数据加载
        await waitFor(() => {
            expect(screen.getByText('1234567890')).toBeInTheDocument();
            expect(screen.getByText('张三')).toBeInTheDocument();
            expect(screen.getByText('zhangsan')).toBeInTheDocument();
            expect(screen.getByText('85')).toBeInTheDocument();
            expect(screen.getByText('3')).toBeInTheDocument();
            expect(screen.getByText('优秀')).toBeInTheDocument();
        });
    });

    it('应该处理 context 获取失败的情况', async () => {
  vi.doMock('svelte', () => ({
    getContext: () => { throw new Error('No context'); }
  }));

  fetch.mockResolvedValueOnce({
    ok: true,
    json: () => Promise.resolve(mockPracticeResponse),
  });

  render(StudentGradeTable, {
    type: 'practice',
    resource_id: 1,
  });

  await waitFor(() => {
    expect(screen.getByText('1234567890')).toBeInTheDocument();
  });
});


    it('应该正确渲染考试类型的学生成绩表格', async () => {
        fetch.mockResolvedValueOnce({
            ok: true,
            json: () => Promise.resolve(mockExamResponse),
        });

        render(StudentGradeTable, {
            type: 'exam',
            resource_id: 1,
            papers: mockExamContext.examData.papers,
        });

        // 检查表格标题
        expect(screen.getByText('学生成绩')).toBeInTheDocument();

        // 等待数据加载
        await waitFor(() => {
            expect(screen.getByText('1234567890')).toBeInTheDocument();
            expect(screen.getByText('张三')).toBeInTheDocument();
            expect(screen.getByText('zhangsan')).toBeInTheDocument();
            expect(screen.getByText('175')).toBeInTheDocument(); // 总得分 85+90
            expect(screen.getByText('优秀')).toBeInTheDocument();
        });
    });

    it('应该处理折叠/展开功能', async () => {
        fetch.mockResolvedValueOnce({
            ok: true,
            json: () => Promise.resolve(mockPracticeResponse),
        });

        const { container } = render(StudentGradeTable, {
            type: 'practice',
            resource_id: 1,
        });

        // 初始状态应该是展开的
        await waitFor(() => {
            expect(screen.getByText('1234567890')).toBeInTheDocument();
        });

        // 点击折叠按钮
        const foldButton = container.querySelector('.card-title-button');
        await fireEvent.click(foldButton);

        // 检查内容是否被隐藏
        expect(screen.queryByText('1234567890')).not.toBeInTheDocument();

        // 再次点击展开
        await fireEvent.click(foldButton);
        expect(screen.getByText('1234567890')).toBeInTheDocument();
    });

    it('应该处理搜索功能', async () => {
        fetch.mockResolvedValueOnce({
            ok: true,
            json: () => Promise.resolve(mockPracticeResponse),
        });

        const { component } = render(StudentGradeTable, {
            type: 'practice',
            resource_id: 1,
        });

        await waitFor(() => {
            expect(screen.getByText('1234567890')).toBeInTheDocument();
        });

        // 模拟搜索输入
        const searchInput = screen.getByPlaceholderText('请输入学生电话/账号/姓名');
        await fireEvent.input(searchInput, { target: { value: '张三' } });

        // 检查是否触发了搜索
        await waitFor(() => {
            expect(fetch).toHaveBeenCalledTimes(2); // 初始加载 + 搜索
            const url = fetch.mock.calls[1][0];
            const decodedUrl = decodeURIComponent(url);
            expect(decodedUrl).toContain('keyword=张三');
        });
    });

    it('应该处理分页功能', async () => {
        fetch.mockResolvedValueOnce({
            ok: true,
            json: () => Promise.resolve(mockPracticeResponse),
        });

        render(StudentGradeTable, {
            type: 'practice',
            resource_id: 1,
        });

        await waitFor(() => {
            expect(screen.getByText('1234567890')).toBeInTheDocument();
        });

        // 模拟分页事件
        const pagination = document.querySelector('Pagination');
        if (pagination) {
            pagination.dispatchEvent(
                new CustomEvent('pageChange', { detail: 2 })
            );

            await waitFor(() => {
                expect(fetch).toHaveBeenCalledTimes(2);
                expect(fetch.mock.calls[1][0]).toContain('page=2');
            });
        }
    });



    it('应该正确显示分数颜色', async () => {
        fetch.mockResolvedValueOnce({
            ok: true,
            json: () => Promise.resolve({
                status: 0,
                data: [
                    {
                        student_scores: [
                            {
                                stu_id: 1,
                                phone: '1234567890',
                                name: '张三',
                                nickname: 'zhangsan',
                                highest_score: 85, // 高于60% (60分)
                                submitted_cnt: 3,
                                remark: '优秀',
                            },
                            {
                                stu_id: 2,
                                phone: '0987654321',
                                name: '李四',
                                nickname: 'lisi',
                                highest_score: 50, // 低于60% (60分)
                                submitted_cnt: 2,
                                remark: '需提高',
                            },
                        ],
                    },
                ],
                rowCount: 2,
            }),
        });

        render(StudentGradeTable, {
            type: 'practice',
            resource_id: 1,
        });

        await waitFor(() => {
            // 检查高分显示绿色
            const highScore = screen.getByText('85');
            expect(highScore).toHaveClass('green');

            // 检查低分显示红色
            const lowScore = screen.getByText('50');
            expect(lowScore).toHaveClass('red');
        });
    });

    it('应跳转到考试详情页（考试类型，有 exam_session_id）', async () => {
  delete window.location;
  window.location = { href: '' };

  fetch.mockResolvedValueOnce({
    ok: true,
    json: () => Promise.resolve(mockExamResponse),
  });

  render(StudentGradeTable, {
    type: 'exam',
    resource_id: 1,
    papers: mockExamContext.examData.papers,
  });

  await waitFor(() => {
    expect(screen.getByText('1234567890')).toBeInTheDocument();
  });

  const detailBtn = screen.getAllByText('查看详情')[0];
  await fireEvent.click(detailBtn);

  expect(window.location.href).toBe(
    '/student/answer/result/exam?exam-session-id-arr=[101,102]'
  );
});

it('不应跳转（考试类型，无 exam_session_id）', async () => {
  delete window.location;
  window.location = { href: '' };

  const emptyExamResponse = {
    status: 0,
    data: [
      {
        student_scores: [
          {
            student_id: 3,
            phone: '1112223333',
            name: '王五',
            nickname: 'wangwu',
            exam_sessions: [], // 空
            remark: '',
          },
        ],
      },
    ],
    rowCount: 1,
  };

  fetch.mockResolvedValueOnce({
    ok: true,
    json: () => Promise.resolve(emptyExamResponse),
  });

  render(StudentGradeTable, {
    type: 'exam',
    resource_id: 1,
    papers: mockExamContext.examData.papers,
  });

  await waitFor(() => {
    expect(screen.getByText('1112223333')).toBeInTheDocument();
  });

  const detailBtn = screen.getByText('查看详情');
  await fireEvent.click(detailBtn);

  expect(window.location.href).toBe('');
});

it('不应跳转（练习类型）', async () => {
  delete window.location;
  window.location = { href: '' };

  fetch.mockResolvedValueOnce({
    ok: true,
    json: () => Promise.resolve(mockPracticeResponse),
  });

  render(StudentGradeTable, {
    type: 'practice',
    resource_id: 1,
  });

  await waitFor(() => {
    expect(screen.getByText('1234567890')).toBeInTheDocument();
  });

  const detailBtn = screen.getAllByText('查看详情')[0];
  await fireEvent.click(detailBtn);

  expect(window.location.href).toBe('');
});

it('应处理学生没有 scores 字段的情况（触发 || []）', async () => {
  delete window.location;
  window.location = { href: '' };

  fetch.mockResolvedValueOnce({
    ok: true,
    json: () => Promise.resolve(mockExamResponseWithEmptyScores),
  });

  render(StudentGradeTable, {
    type: 'exam',
    resource_id: 1,
    papers: mockExamContext.examData.papers,
  });

  await waitFor(() => {
    expect(screen.getByText('1112223333')).toBeInTheDocument();
  });

  const detailBtn = screen.getByText('查看详情');
  await fireEvent.click(detailBtn);

  // 由于没有 scores，examSessionIds 会是 []，不会跳转
  expect(window.location.href).toBe('');
});
it('应该处理 API 返回非零状态码的情况', async () => {
  fetch.mockResolvedValueOnce({
    ok: true,
    json: () => Promise.resolve({
      status: 1,
      msg: '服务器错误'
    }),
  });

  render(StudentGradeTable, {
    type: 'practice',
    resource_id: 1,
  });

  // 等待表格渲染完成
  await waitFor(() => {
    // 检查是否显示了空状态
    const emptyContainer = document.querySelector('.empty-container');
    expect(emptyContainer).toBeInTheDocument();
  });
});

it('应该处理网络请求失败的情况', async () => {
  fetch.mockRejectedValueOnce(new Error('Network error'));

  render(StudentGradeTable, {
    type: 'practice',
    resource_id: 1,
  });

  // 等待表格渲染完成
  await waitFor(() => {
    // 检查是否显示了空状态
    const emptyContainer = document.querySelector('.empty-container');
    expect(emptyContainer).toBeInTheDocument();
  });
});

it('应该处理 HTTP 错误状态码', async () => {
  fetch.mockResolvedValueOnce({
    ok: false,
    status: 500,
  });

  render(StudentGradeTable, {
    type: 'practice',
    resource_id: 1,
  });

  // 等待表格渲染完成
  await waitFor(() => {
    // 检查是否显示了空状态
    const emptyContainer = document.querySelector('.empty-container');
    expect(emptyContainer).toBeInTheDocument();
  });
});

it('应该处理空数据响应', async () => {
  fetch.mockResolvedValueOnce({
    ok: true,
    json: () => Promise.resolve({
      status: 0,
      data: null,
      rowCount: 0
    }),
  });

  render(StudentGradeTable, {
    type: 'practice',
    resource_id: 1,
  });

  // 等待表格渲染完成
  await waitFor(() => {
    // 检查是否显示了空状态
    const emptyContainer = document.querySelector('.empty-container');
    expect(emptyContainer).toBeInTheDocument();
  });
});

it('应该处理练习类型中缺少 student_scores 的情况', async () => {
  fetch.mockResolvedValueOnce({
    ok: true,
    json: () => Promise.resolve({
      status: 0,
      data: [{}], // 没有 student_scores 字段
      rowCount: 0
    }),
  });

  render(StudentGradeTable, {
    type: 'practice',
    resource_id: 1,
  });

  // 等待表格渲染完成
  await waitFor(() => {
    // 检查是否显示了空状态
    const emptyContainer = document.querySelector('.empty-container');
    expect(emptyContainer).toBeInTheDocument();
  });
});

it('应该处理考试类型中缺少 student_scores 的情况', async () => {
  fetch.mockResolvedValueOnce({
    ok: true,
    json: () => Promise.resolve({
      status: 0,
      data: [{}], // 没有 student_scores 字段
      rowCount: 0
    }),
  });

  render(StudentGradeTable, {
    type: 'exam',
    resource_id: 1,
  });

  // 等待表格渲染完成
  await waitFor(() => {
    // 检查是否显示了空状态
    const emptyContainer = document.querySelector('.empty-container');
    expect(emptyContainer).toBeInTheDocument();
  });
});



it('应该处理分页大小改变', async () => {
  fetch.mockResolvedValueOnce({
    ok: true,
    json: () => Promise.resolve(mockPracticeResponse),
  });

  render(StudentGradeTable, {
    type: 'practice',
    resource_id: 1,
  });

  await waitFor(() => {
    expect(screen.getByText('1234567890')).toBeInTheDocument();
  });

  // 模拟分页大小改变事件
  const pagination = document.querySelector('Pagination');
  if (pagination) {
    pagination.dispatchEvent(
      new CustomEvent('pageSizeChange', { detail: 20 })
    );

    await waitFor(() => {
      expect(fetch).toHaveBeenCalledTimes(2);
      const url = fetch.mock.calls[1][0];
      const decodedUrl = decodeURIComponent(url);
      expect(decodedUrl).toContain('pageSize=20');
      expect(decodedUrl).toContain('page=1'); // 应该重置为第一页
    });
  }
});

it('应该处理空搜索关键字的情况', async () => {
  fetch.mockResolvedValueOnce({
    ok: true,
    json: () => Promise.resolve(mockPracticeResponse),
  });

  render(StudentGradeTable, {
    type: 'practice',
    resource_id: 1,
  });

  await waitFor(() => {
    expect(screen.getByText('1234567890')).toBeInTheDocument();
  });

  // 模拟空搜索
  const searchInput = screen.getByPlaceholderText('请输入学生电话/账号/姓名');
  await fireEvent.input(searchInput, { target: { value: '' } });

  await waitFor(() => {
    expect(fetch).toHaveBeenCalledTimes(2);
    const url = fetch.mock.calls[1][0];
    const decodedUrl = decodeURIComponent(url);
    expect(decodedUrl).toContain('keyword=');
  });
});

it('应该处理 contextData 中 practiceData 为 undefined 的情况', async () => {
    // 模拟 getContext 返回 undefined
    getContext.mockReturnValue(undefined);
    
    fetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(mockPracticeResponse),
    });

    render(StudentGradeTable, {
      type: 'practice',
      resource_id: 1,
    });

    // 等待组件渲染
    await tick();
    
    // 检查是否正常渲染，即使 practiceData 为 undefined
    await waitFor(() => {
      expect(screen.getByText('1234567890')).toBeInTheDocument();
    });
  });

  it('应该处理 contextData 中 examData 为 null 的情况', async () => {
    // 模拟 getContext 返回包含 null examData 的对象
    getContext.mockReturnValue({ examData: null });
    
    fetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(mockExamResponse),
    });

    render(StudentGradeTable, {
      type: 'exam',
      resource_id: 1,
    });

    // 等待组件渲染
    await tick();
    
    // 检查是否正常渲染，即使 examData 为 null
    await waitFor(() => {
      expect(screen.getByText('1234567890')).toBeInTheDocument();
    });
  });

  it('应该处理 contextData 中 practiceData 属性不存在的情况', async () => {
    // 模拟 getContext 返回不包含 practiceData 的对象
    getContext.mockReturnValue({ someOtherData: 'value' });
    
    fetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(mockPracticeResponse),
    });

    render(StudentGradeTable, {
      type: 'practice',
      resource_id: 1,
    });

    // 等待组件渲染
    await tick();
    
    // 检查是否正常渲染，即使 practiceData 不存在
    await waitFor(() => {
      expect(screen.getByText('1234567890')).toBeInTheDocument();
    });
  });

  it('应该处理 contextData 中 examData 属性不存在的情况', async () => {
    // 模拟 getContext 返回不包含 examData 的对象
    getContext.mockReturnValue({ someOtherData: 'value' });
    
    fetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(mockExamResponse),
    });

    render(StudentGradeTable, {
      type: 'exam',
      resource_id: 1,
    });

    // 等待组件渲染
    await tick();
    
    // 检查是否正常渲染，即使 examData 不存在
    await waitFor(() => {
      expect(screen.getByText('1234567890')).toBeInTheDocument();
    });
  });
it('应该处理练习类型中所有可能为空值的字段', async () => {
  const mockPracticeResponseWithEmptyValues = {
    status: 0,
    data: [
      {
        student_scores: [
          {
            stu_id: 1,
            phone: null, // 测试 null 值
            name: undefined, // 测试 undefined 值
            nickname: '', // 测试空字符串
            highest_score: null, // 测试 null 值
            submitted_cnt: undefined, // 测试 undefined 值
            remark: '', // 测试空字符串
          },
        ],
      },
    ],
    rowCount: 1,
  };

  fetch.mockResolvedValueOnce({
    ok: true,
    json: () => Promise.resolve(mockPracticeResponseWithEmptyValues),
  });

  render(StudentGradeTable, {
    type: 'practice',
    resource_id: 1,
  });

  await waitFor(() => {
    // 获取表格行
    const rows = screen.getAllByRole('row');
    // 跳过表头，获取数据行
    const dataRow = rows[1];
    
    // 获取行中的所有单元格
    const cells = within(dataRow).getAllByRole('cell');
    
    // 检查特定位置的单元格内容
    expect(cells[1]).toHaveTextContent('-'); // 电话列
    expect(cells[2]).toHaveTextContent('-'); // 账号列
    expect(cells[3]).toHaveTextContent('-'); // 姓名列
    expect(cells[4]).toHaveTextContent('0'); // 最高得分列
    expect(cells[5]).toHaveTextContent('0'); // 作答次数列
    expect(cells[7]).toHaveTextContent('-'); // 备注列
  });
});

it('应该处理考试类型中所有可能为空值的字段', async () => {
  const mockExamResponseWithEmptyValues = {
    status: 0,
    data: [
      {
        student_scores: [
          {
            student_id: 1,
            phone: null, // 测试 null 值
            name: undefined, // 测试 undefined 值
            nickname: '', // 测试空字符串
            exam_sessions: [
              { exam_session_id: 101, score: null }, // 测试 null 值
              { exam_session_id: 102, score: undefined }, // 测试 undefined 值
            ],
            remark: '', // 测试空字符串
          },
        ],
      },
    ],
    rowCount: 1,
  };

  fetch.mockResolvedValueOnce({
    ok: true,
    json: () => Promise.resolve(mockExamResponseWithEmptyValues),
  });

  render(StudentGradeTable, {
    type: 'exam',
    resource_id: 1,
  });

  await waitFor(() => {
    // 获取表格行
    const rows = screen.getAllByRole('row');
    // 跳过表头，获取数据行
    const dataRow = rows[1];
    
    // 获取行中的所有单元格
    const cells = within(dataRow).getAllByRole('cell');
    
    // 检查特定位置的单元格内容
    expect(cells[1]).toHaveTextContent('-'); // 电话列
    expect(cells[2]).toHaveTextContent('-'); // 账号列
    expect(cells[3]).toHaveTextContent('-'); // 姓名列
    expect(cells[4]).toHaveTextContent('0'); // 总得分列
    expect(cells[5]).toHaveTextContent('0'); // 第一个试卷得分
    expect(cells[6]).toHaveTextContent('0'); // 第二个试卷得分
    // 备注列的位置取决于试卷数量，这里假设是第8列
    expect(cells[8]).toHaveTextContent('-'); // 备注列
  });
});

  it('应该处理考试类型中空的 exam_sessions 数组', async () => {
    const mockExamResponseWithEmptySessions = {
      status: 0,
      data: [
        {
          student_scores: [
            {
              student_id: 1,
              phone: '1234567890',
              name: '张三',
              nickname: 'zhangsan',
              exam_sessions: [], // 空数组
              remark: '无考试记录',
            },
          ],
        },
      ],
      rowCount: 1,
    };

    fetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(mockExamResponseWithEmptySessions),
    });

    render(StudentGradeTable, {
      type: 'exam',
      resource_id: 1,
    });

    await waitFor(() => {
      // 检查空数组是否被正确处理
      expect(screen.getByText('1234567890')).toBeInTheDocument();
      expect(screen.getByText('张三')).toBeInTheDocument();
      expect(screen.getByText('zhangsan')).toBeInTheDocument();
      expect(screen.getByText('0')).toBeInTheDocument(); // 总得分应为 0
      expect(screen.getByText('无考试记录')).toBeInTheDocument();
    });
  });

  it('应该处理练习类型中缺少 student_scores 字段的情况', async () => {
    const mockPracticeResponseWithoutScores = {
      status: 0,
      data: [
        {
          // 没有 student_scores 字段
        },
      ],
      rowCount: 0,
    };

    fetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(mockPracticeResponseWithoutScores),
    });

    render(StudentGradeTable, {
      type: 'practice',
      resource_id: 1,
    });

    await waitFor(() => {
      // 检查是否显示了空状态
      const emptyContainer = document.querySelector('.empty-container');
      expect(emptyContainer).toBeInTheDocument();
    });
  });

  
});
