import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, waitFor, within } from '@testing-library/svelte';
import CorrectPage from '../+page@.svelte';
import { toast } from '$lib/components/Toast/Toast.js';
import MessageBox from '$lib/components/MessageBox/MessageBox.js';

vi.mock('$app/state', () => ({
  page: {
    url: new URL('http://localhost?name=数学期末&exam_session_id=8001'),
  },
}));
vi.mock('$lib/components/Toast/Toast.js', () => ({ toast: { error: vi.fn(), success: vi.fn() } }));
vi.mock('$lib/components/MessageBox/MessageBox.js', () => ({
  default: vi.fn(({ onConfirm }) => {
    onConfirm();
  }),
}));

import { page } from '$app/state';
import { json } from '@sveltejs/kit';

const MOCK_DATA = {
  question_sets: [
    {
      ID: 101,
      Order: 1,
      Score: 30,
      Name: '基础题组',
      Questions: [
        {
          ID: 1001,
          Order: 1,
          Score: 5,
          Type: '00', // 单选题
          Answers: [{ index: 1, score: 5, answer: 'B', grading_rule: 'exact', alternative_answer: 'b' }],
          GroupID: 101,
          Content: '下面哪个是 JavaScript 的关键字？',
        },
        {
          ID: 1002,
          Order: 2,
          Score: 10,
          Type: '02', // 多选题
          Answers: [
            { index: 1, score: 5, answer: 'A', grading_rule: 'exact', alternative_answer: 'a' },
            { index: 2, score: 5, answer: 'C', grading_rule: 'exact', alternative_answer: 'c' },
          ],
          GroupID: 101,
          Content: '以下哪些是 JavaScript 数据类型？',
        },
        {
          ID: 1003,
          Order: 3,
          Score: 5,
          Type: '04', // 判断题
          Answers: [{ index: 1, score: 5, answer: 'true', grading_rule: 'exact', alternative_answer: null }],
          GroupID: 101,
          Content: 'JavaScript 是一门静态类型语言。对吗？',
        },
      ],
    },
    {
      ID: 102,
      Order: 2,
      Score: 40,
      Name: '进阶题组',
      Questions: [
        {
          ID: 2001,
          Order: 1,
          Score: 10,
          Type: '06', // 填空题
          Answers: [
            { index: 1, score: 5, answer: 'function', grading_rule: 'exact', alternative_answer: null },
            { index: 2, score: 5, answer: 'const', grading_rule: 'exact', alternative_answer: null },
          ],
          GroupID: 102,
          Content: '请填空：______ 用于定义函数，______ 用于定义常量。',
        },
        {
          ID: 2002,
          Order: 2,
          Score: 10,
          Type: '08', // 简答题
          Answers: [
            {
              index: 1,
              score: 10,
              answer: '事件循环是JavaScript处理异步操作的机制。',
              grading_rule: 'keywords',
              alternative_answer: '事件循环机制',
            },
          ],
          GroupID: 102,
          Content: '简述 JavaScript 的事件循环机制。',
        },
        {
          ID: 2003,
          Order: 3,
          Score: 20,
          Type: '10', // 编程题
          Answers: [
            {
              index: 1,
              score: 20,
              answer: 'function add(a, b) { return a + b; }',
              grading_rule: 'exact',
              alternative_answer: null,
            },
          ],
          GroupID: 102,
          Content: '编写一个函数，实现两个数相加。',
        },
      ],
    },
  ],
  student_answers: [
    // 学生 1
    { QuestionID: 1001, ExamineeID: 5001, PracticeSubmissionID: 7001, Answer: { answer: ['B'] } },
    { QuestionID: 1002, ExamineeID: 5001, PracticeSubmissionID: 7001, Answer: { answer: ['A', 'C'] } },
    { QuestionID: 1003, ExamineeID: 5001, PracticeSubmissionID: 7001, Answer: { answer: ['false'] } },
    { QuestionID: 2001, ExamineeID: 5001, PracticeSubmissionID: 7001, Answer: { answer: ['function', 'const'] } },
    {
      QuestionID: 2002,
      ExamineeID: 5001,
      PracticeSubmissionID: 7001,
      Answer: { answer: ['事件循环是JavaScript处理异步操作的机制。'] },
    },
    {
      QuestionID: 2003,
      ExamineeID: 5001,
      PracticeSubmissionID: 7001,
      Answer: { answer: ['function add(a, b) { return a + b; }'] },
    },
    // 学生 2
    { QuestionID: 1001, ExamineeID: 5002, PracticeSubmissionID: 7002, Answer: { answer: ['A'] } },
    { QuestionID: 1002, ExamineeID: 5002, PracticeSubmissionID: 7002, Answer: { answer: ['A'] } },
    { QuestionID: 1003, ExamineeID: 5002, PracticeSubmissionID: 7002, Answer: { answer: ['true'] } },
    { QuestionID: 2001, ExamineeID: 5002, PracticeSubmissionID: 7002, Answer: { answer: ['function', 'let'] } },
    {
      QuestionID: 2002,
      ExamineeID: 5002,
      PracticeSubmissionID: 7002,
      Answer: { answer: ['事件循环是JS的异步处理机制。'] },
    },
    {
      QuestionID: 2003,
      ExamineeID: 5002,
      PracticeSubmissionID: 7002,
      Answer: { answer: ['function sum(a, b) { return a + b; }'] },
    },
    // 学生 3
    { QuestionID: 1001, ExamineeID: 5003, PracticeSubmissionID: 7003, Answer: { answer: ['B'] } },
    { QuestionID: 1002, ExamineeID: 5003, PracticeSubmissionID: 7003, Answer: { answer: ['A', 'C'] } },
    { QuestionID: 1003, ExamineeID: 5003, PracticeSubmissionID: 7003, Answer: { answer: ['false'] } },
    { QuestionID: 2001, ExamineeID: 5003, PracticeSubmissionID: 7003, Answer: { answer: ['func', 'const'] } },
    { QuestionID: 2002, ExamineeID: 5003, PracticeSubmissionID: 7003, Answer: { answer: ['事件循环机制。'] } },
    {
      QuestionID: 2003,
      ExamineeID: 5003,
      PracticeSubmissionID: 7003,
      Answer: { answer: ['function add(x, y) { return x + y; }'] },
    },
  ],
  student_infos: [
    { ExamineeID: 5001, OfficialName: '李四', SerialNumber: 1, PracticeSubmissionID: 7001 },
    { ExamineeID: 5002, OfficialName: '王五', SerialNumber: 2, PracticeSubmissionID: 7002 },
    { ExamineeID: 5003, OfficialName: '赵六', SerialNumber: 3, PracticeSubmissionID: 7003 },
  ],
  marking_results: [
    // 学生 1 批改结果
    {
      TeacherID: 9001,
      ExamineeID: 5001,
      ExamSessionID: 8001,
      PracticeID: 9001,
      PracticeSubmissionID: 7001,
      QuestionID: 1001,
      MarkDetails: [{ Index: 1, Score: 5 }],
      Score: 5,
    },
    {
      TeacherID: 9001,
      ExamineeID: 5001,
      ExamSessionID: 8001,
      PracticeID: 9001,
      PracticeSubmissionID: 7001,
      QuestionID: 1002,
      MarkDetails: [
        { Index: 1, Score: 5 },
        { Index: 2, Score: 5 },
      ],
      Score: 10,
    },
    {
      TeacherID: 9001,
      ExamineeID: 5001,
      ExamSessionID: 8001,
      PracticeID: 9001,
      PracticeSubmissionID: 7001,
      QuestionID: 1003,
      MarkDetails: [{ Index: 1, Score: 0 }],
      Score: 0,
    },
    {
      TeacherID: 9001,
      ExamineeID: 5001,
      ExamSessionID: 8001,
      PracticeID: 9001,
      PracticeSubmissionID: 7001,
      QuestionID: 2001,
      MarkDetails: [
        { Index: 1, Score: 5 },
        { Index: 2, Score: 5 },
      ],
      Score: 10,
    },
    {
      TeacherID: 9001,
      ExamineeID: 5001,
      ExamSessionID: 8001,
      PracticeID: 9001,
      PracticeSubmissionID: 7001,
      QuestionID: 2002,
      MarkDetails: [{ Index: 1, Score: 10 }],
      Score: 10,
    },
    {
      TeacherID: 9001,
      ExamineeID: 5001,
      ExamSessionID: 8001,
      PracticeID: 9001,
      PracticeSubmissionID: 7001,
      QuestionID: 2003,
      MarkDetails: [{ Index: 1, Score: 20 }],
      Score: 20,
    },
    // 学生 2 批改结果
    {
      TeacherID: 9002,
      ExamineeID: 5002,
      ExamSessionID: 8001,
      PracticeID: 9001,
      PracticeSubmissionID: 7002,
      QuestionID: 1001,
      MarkDetails: [{ Index: 1, Score: 0, Analyze: '单选题答错了。' }],
      Score: 0,
    },
    {
      TeacherID: 9002,
      ExamineeID: 5002,
      ExamSessionID: 8001,
      PracticeID: 9001,
      PracticeSubmissionID: 7002,
      QuestionID: 1002,
      MarkDetails: [
        { Index: 1, Score: 5 },
        { Index: 2, Score: 5 },
      ],
      Score: 10,
    },
    {
      TeacherID: 9002,
      ExamineeID: 5002,
      ExamSessionID: 8001,
      PracticeID: 9001,
      PracticeSubmissionID: 7002,
      QuestionID: 1003,
      MarkDetails: [{ Index: 1, Score: 5 }],
      Score: 5,
    },
    {
      TeacherID: 9002,
      ExamineeID: 5002,
      ExamSessionID: 8001,
      PracticeID: 9001,
      PracticeSubmissionID: 7002,
      QuestionID: 2001,
      MarkDetails: [
        { Index: 1, Score: 5 },
        { Index: 2, Score: 0 },
      ],
      Score: 5,
    },
    {
      TeacherID: 9002,
      ExamineeID: 5002,
      ExamSessionID: 8001,
      PracticeID: 9001,
      PracticeSubmissionID: 7002,
      QuestionID: 2002,
      MarkDetails: [{ Index: 1, Score: 8 }],
      Score: 8,
    },
    {
      TeacherID: 9002,
      ExamineeID: 5002,
      ExamSessionID: 8001,
      PracticeID: 9001,
      PracticeSubmissionID: 7002,
      QuestionID: 2003,
      MarkDetails: [{ Index: 1, Score: 15 }],
      Score: 15,
    },
    // 学生 3 批改结果
    {
      TeacherID: 9003,
      ExamineeID: 5003,
      ExamSessionID: 8001,
      PracticeID: 9001,
      PracticeSubmissionID: 7003,
      QuestionID: 1001,
      MarkDetails: [{ Index: 1, Score: 5 }],
      Score: 5,
    },
    {
      TeacherID: 9003,
      ExamineeID: 5003,
      ExamSessionID: 8001,
      PracticeID: 9001,
      PracticeSubmissionID: 7003,
      QuestionID: 1002,
      MarkDetails: [
        { Index: 1, Score: 5 },
        { Index: 2, Score: 5 },
      ],
      Score: 10,
    },
    {
      TeacherID: 9003,
      ExamineeID: 5003,
      ExamSessionID: 8001,
      PracticeID: 9001,
      PracticeSubmissionID: 7003,
      QuestionID: 1003,
      MarkDetails: [{ Index: 1, Score: 0 }],
      Score: 0,
    },
    {
      TeacherID: 9003,
      ExamineeID: 5003,
      ExamSessionID: 8001,
      PracticeID: 9001,
      PracticeSubmissionID: 7003,
      QuestionID: 2001,
      MarkDetails: [
        { Index: 1, Score: 0 },
        { Index: 2, Score: 5 },
      ],
      Score: 5,
    },
    {
      TeacherID: 9003,
      ExamineeID: 5003,
      ExamSessionID: 8001,
      PracticeID: 9001,
      PracticeSubmissionID: 7003,
      QuestionID: 2002,
      MarkDetails: [{ Index: 1, Score: 7 }],
      Score: 7,
    },
    {
      TeacherID: 9003,
      ExamineeID: 5003,
      ExamSessionID: 8001,
      PracticeID: 9001,
      PracticeSubmissionID: 7003,
      QuestionID: 2003,
      MarkDetails: [{ Index: 1, Score: 20 }],
      Score: 20,
    },
  ],
};

function mockFetch(data) {
  global.fetch = vi.fn(() =>
    Promise.resolve({
      ok: true,
      json: () => Promise.resolve(data),
    }),
  );
}

function setExamCorrect() {
  page.url = new URL('http://localhost?name=数学考试&exam_session_id=8001');
}

function setPracticeCorrect() {
  page.url = new URL('http://localhost?name=数学练习&practice_id=9001');
}

describe('批改页面测试', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockFetch({
      status: 0,
      data: MOCK_DATA,
    });
  });

  it('应正确渲染页面核心元素', async () => {
    setExamCorrect();

    render(CorrectPage);

    await waitFor(() => {
      // 验证顶部信息
      expect(screen.getByText('返回')).toBeInTheDocument();
      expect(screen.getByText('数学考试')).toBeInTheDocument();
      expect(screen.getByText('总人数：')).toBeInTheDocument();
      expect(screen.getAllByText('3').length).toBeGreaterThan(0); // 验证总人数
      expect(screen.getByText('未批改人数：')).toBeInTheDocument();
      expect(screen.getAllByText('1').length).toBeGreaterThan(0); // 验证未批改人数
      expect(screen.getByText('总未批改题数：')).toBeInTheDocument();

      // 验证模式切换开关
      expect(screen.getByText(/全卷模式/)).toBeInTheDocument();
      expect(screen.getByText(/逐题模式/)).toBeInTheDocument();

      // 验证操作按钮
      expect(screen.getByText('上一位')).toBeInTheDocument();
      expect(screen.getByText('下一位')).toBeInTheDocument();

      // 验证右侧总览
      expect(screen.getByText('作答总览')).toBeInTheDocument();
      expect(screen.getByText('• 未批阅')).toBeInTheDocument();
      expect(screen.getByText('• 正确')).toBeInTheDocument();
      expect(screen.getByText('• 错误')).toBeInTheDocument();
      expect(screen.getByText('• 含错')).toBeInTheDocument();
    });
  });

  describe('路径参数错误报错提示测试', () => {
    it('路径参数不存在 exam_session_id 和 practice_id 时应报错', async () => {
      page.url = new URL('http://localhost');

      render(CorrectPage);

      await waitFor(() => {
        expect(global.fetch).not.toHaveBeenCalled();
        expect(MessageBox).toHaveBeenCalledWith(
          expect.objectContaining({
            confirm_button_type: 'danger',
            title: '出错啦',
            type: 'danger',
          }),
        );
      });
    });

    it('路径参数同时存在 exam_session_id 和 practice_id 时应报错', async () => {
      page.url = new URL('http://localhost?name=数学考试&exam_session_id=8001&practice_id=9001');

      render(CorrectPage);

      await waitFor(() => {
        expect(global.fetch).not.toHaveBeenCalled();
        expect(MessageBox).toHaveBeenCalledWith(
          expect.objectContaining({
            confirm_button_type: 'danger',
            title: '出错啦',
            type: 'danger',
          }),
        );
      });
    });
  });

  describe('获取批改数据功能测试', () => {
    beforeEach(() => {
      setExamCorrect();
    });

    it('应正确加载考试数据', async () => {
      render(CorrectPage);

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith('/api/mark/details?exam_session_id=8001');

        // 验证考生信息
        expect(screen.getByText('李四')).toBeInTheDocument();

        // 验证题目内容
        expect(screen.getAllByText(/基础题组/).length).toBe(2);
        expect(screen.getAllByText(/(30分)/).length).toBeGreaterThan(0);
        expect(screen.getByText('下面哪个是 JavaScript 的关键字？')).toBeInTheDocument();

        // 验证右侧总览
        expect(screen.getByText(/基础题组 \(.*分\/30分\)/)).toBeInTheDocument();
        expect(screen.getAllByRole('button', { name: '1' }).length).toBeGreaterThan(0);
      });
    });

    it('响应非2xx时应提示错误（有error_text）', async () => {
      global.fetch = vi.fn(() =>
        Promise.resolve({
          ok: false,
          status: 400,
          statusText: 'Bad Request',
          text: () => Promise.resolve('请求失败'),
        }),
      );

      render(CorrectPage);

      await waitFor(() => {
        expect(MessageBox).toHaveBeenCalledWith({
          confirm_button_type: 'danger',
          content: '请求失败：400 Bad Request-请求失败',
          onCancel: expect.any(Function),
          onConfirm: expect.any(Function),
          on_close_by_click_outside: false,
          show_cancel_button: false,
          title: '出错啦',
          type: 'danger',
        });
      });
    });

    it('响应非2xx时应提示错误（无error_text）', async () => {
      global.fetch = vi.fn(() =>
        Promise.resolve({
          ok: false,
          status: 400,
          statusText: 'Bad Request',
          text: () => Promise.resolve(),
        }),
      );

      render(CorrectPage);

      await waitFor(() => {
        expect(MessageBox).toHaveBeenCalledWith({
          confirm_button_type: 'danger',
          content: '请求失败：400 Bad Request',
          onCancel: expect.any(Function),
          onConfirm: expect.any(Function),
          on_close_by_click_outside: false,
          show_cancel_button: false,
          title: '出错啦',
          type: 'danger',
        });
      });
    });

    it('加载失败应显示错误并返回', async () => {
      global.fetch = vi.fn(() => Promise.reject(new Error('网络错误')));
      render(CorrectPage);

      await waitFor(() => {
        expect(MessageBox).toHaveBeenCalledWith(
          expect.objectContaining({
            confirm_button_type: 'danger',
            content: '网络错误',
            onCancel: expect.any(Function),
            onConfirm: expect.any(Function),
            on_close_by_click_outside: false,
            show_cancel_button: false,
            title: '出错啦',
            type: 'danger',
            content: '网络错误',
          }),
        );
      });
    });

    it('返回的status 非0且有 msg 应显示错误', async () => {
      mockFetch({
        status: -1,
        data: {},
        msg: '获取考试数据失败',
      });
      render(CorrectPage);

      await waitFor(() => {
        expect(MessageBox).toHaveBeenCalledWith(
          expect.objectContaining({
            content: '获取考试数据失败',
          }),
        );
      });
    });

    it('返回的status 非0且无 msg 应显示错误', async () => {
      mockFetch({
        status: -1,
      });
      render(CorrectPage);

      await waitFor(() => {
        expect(MessageBox).toHaveBeenCalledWith(
          expect.objectContaining({
            content: '获取批改信息失败',
          }),
        );
      });
    });

    it('question_sets 数据类型错误应显示错误', async () => {
      mockFetch({
        status: 0,
        data: {
          question_sets: 0,
        },
      });
      render(CorrectPage);

      await waitFor(() => {
        expect(MessageBox).toHaveBeenCalledWith(
          expect.objectContaining({
            content: 'question_sets 数据类型错误',
          }),
        );
      });
    });

    it('question_sets 获取为 null 应显示消息提示（考试模式）', async () => {
      setExamCorrect();

      mockFetch({
        status: 0,
        data: {
          question_sets: null,
        },
      });
      render(CorrectPage);

      await waitFor(() => {
        expect(MessageBox).toHaveBeenCalledWith({
          confirm_button_type: 'primary',
          content: '当前考试没有主观题目',
          onCancel: expect.any(Function),
          onConfirm: expect.any(Function),
          on_close_by_click_outside: false,
          show_cancel_button: false,
          title: '注意',
          type: 'primary',
        });
      });
    });

    it('question_sets 获取为 null 应显示消息提示（练习模式）', async () => {
      setPracticeCorrect();

      mockFetch({
        status: 0,
        data: {
          question_sets: null,
        },
      });
      render(CorrectPage);

      await waitFor(() => {
        expect(MessageBox).toHaveBeenCalledWith({
          confirm_button_type: 'primary',
          content: '当前练习没有主观题目',
          onCancel: expect.any(Function),
          onConfirm: expect.any(Function),
          on_close_by_click_outside: false,
          show_cancel_button: false,
          title: '注意',
          type: 'primary',
        });
      });
    });

    it('无主观题时应显示空状态', async () => {
      mockFetch({
        status: 0,
        data: {
          question_sets: null,
        },
      });
      render(CorrectPage);

      await waitFor(() => {
        expect(MessageBox).toHaveBeenCalledWith(
          expect.objectContaining({
            content: '当前考试没有主观题目',
          }),
        );
      });
    });

    it('student_answers 数据类型错误应显示错误', async () => {
      mockFetch({
        status: 0,
        data: {
          ...MOCK_DATA,
          student_answers: 0,
        },
      });
      render(CorrectPage);

      await waitFor(() => {
        expect(MessageBox).toHaveBeenCalledWith(
          expect.objectContaining({
            content: 'student_answers 数据类型错误',
          }),
        );
      });
    });

    it('student_answers 获取为 [] 应显示错误', async () => {
      mockFetch({
        status: 0,
        data: {
          ...MOCK_DATA,
          student_answers: [],
        },
      });
      render(CorrectPage);

      await waitFor(() => {
        expect(MessageBox).toHaveBeenCalledWith(
          expect.objectContaining({
            content: '获取学生答案失败',
          }),
        );
      });
    });

    it('student_answers 获取为 null 应显示错误', async () => {
      mockFetch({
        status: 0,
        data: {
          ...MOCK_DATA,
          student_answers: null,
        },
        rowCount: 0,
      });
      render(CorrectPage);

      await waitFor(() => {
        expect(MessageBox).toHaveBeenCalledWith(
          expect.objectContaining({
            content: '获取学生答案失败',
          }),
        );
      });
    });

    it('student_infos 数据类型错误应显示错误', async () => {
      mockFetch({
        status: 0,
        data: {
          ...MOCK_DATA,
          student_infos: 0,
        },
      });
      render(CorrectPage);

      await waitFor(() => {
        expect(MessageBox).toHaveBeenCalledWith(
          expect.objectContaining({
            content: 'student_infos 数据类型错误',
          }),
        );
      });
    });

    it('student_infos 获取为 [] 应显示错误', async () => {
      mockFetch({
        status: 0,
        data: {
          ...MOCK_DATA,
          student_infos: [],
        },
      });
      render(CorrectPage);

      await waitFor(() => {
        expect(MessageBox).toHaveBeenCalledWith(
          expect.objectContaining({
            content: '获取学生信息失败',
          }),
        );
      });
    });

    it('student_infos 获取为 null 应显示错误', async () => {
      mockFetch({
        status: 0,
        data: {
          ...MOCK_DATA,
          student_infos: null,
        },
      });
      render(CorrectPage);

      await waitFor(() => {
        expect(MessageBox).toHaveBeenCalledWith(
          expect.objectContaining({
            content: '获取学生信息失败',
          }),
        );
      });
    });

    it('marking_results 数据类型错误应显示错误', async () => {
      mockFetch({
        status: 0,
        data: {
          ...MOCK_DATA,
          marking_results: 0,
        },
      });
      render(CorrectPage);

      await waitFor(() => {
        expect(MessageBox).toHaveBeenCalledWith(
          expect.objectContaining({
            content: 'marking_results 数据类型错误',
          }),
        );
      });
    });

    it('marking_results 获取为 [] 应不会报错', async () => {
      mockFetch({
        status: 0,
        data: {
          ...MOCK_DATA,
          marking_results: [],
        },
      });
      render(CorrectPage);

      await waitFor(() => {
        expect(MessageBox).toHaveBeenCalledTimes(0);
      });
    });

    it('marking_results 获取为 null 应不会报错', async () => {
      mockFetch({
        status: 0,
        data: {
          ...MOCK_DATA,
          marking_results: null,
        },
      });
      render(CorrectPage);

      await waitFor(() => {
        expect(MessageBox).toHaveBeenCalledTimes(0);
      });
    });
  });

  describe('页面数据错误会显示错误', () => {
    it('学生分数为负数时右侧总览对应位置应显示错误', async () => {
      mockFetch({
        status: 0,
        data: {
          question_sets: [
            {
              ID: 101,
              Order: 1,
              Score: 30,
              Name: '基础题组',
              Questions: [
                {
                  ID: 1001,
                  Order: 1,
                  Score: 5,
                  Type: '00', // 单选题
                  Answers: [{ index: 1, score: 5, answer: 'B', grading_rule: 'exact', alternative_answer: 'b' }],
                  GroupID: 101,
                  Content: '下面哪个是 JavaScript 的关键字？',
                },
                {
                  ID: 1002,
                  Order: 2,
                  Score: 10,
                  Type: '02', // 多选题
                  Answers: [
                    { index: 1, score: 5, answer: 'A', grading_rule: 'exact', alternative_answer: 'a' },
                    { index: 2, score: 5, answer: 'C', grading_rule: 'exact', alternative_answer: 'c' },
                  ],
                  GroupID: 101,
                  Content: '以下哪些是 JavaScript 数据类型？',
                },
                {
                  ID: 1003,
                  Order: 3,
                  Score: 5,
                  Type: '04', // 判断题
                  Answers: [{ index: 1, score: 5, answer: 'true', grading_rule: 'exact', alternative_answer: null }],
                  GroupID: 101,
                  Content: 'JavaScript 是一门静态类型语言。对吗？',
                },
              ],
            },
            {
              ID: 102,
              Order: 2,
              Score: 40,
              Name: '进阶题组',
              Questions: [
                {
                  ID: 2001,
                  Order: 1,
                  Score: 10,
                  Type: '06', // 填空题
                  Answers: [
                    { index: 1, score: 5, answer: 'function', grading_rule: 'exact', alternative_answer: null },
                    { index: 2, score: 5, answer: 'const', grading_rule: 'exact', alternative_answer: null },
                  ],
                  GroupID: 102,
                  Content: '请填空：______ 用于定义函数，______ 用于定义常量。',
                },
                {
                  ID: 2002,
                  Order: 2,
                  Score: 10,
                  Type: '08', // 简答题
                  Answers: [
                    {
                      index: 1,
                      score: 10,
                      answer: '事件循环是JavaScript处理异步操作的机制。',
                      grading_rule: 'keywords',
                      alternative_answer: '事件循环机制',
                    },
                  ],
                  GroupID: 102,
                  Content: '简述 JavaScript 的事件循环机制。',
                },
                {
                  ID: 2003,
                  Order: 3,
                  Score: 20,
                  Type: '10', // 编程题
                  Answers: [
                    {
                      index: 1,
                      score: 20,
                      answer: 'function add(a, b) { return a + b; }',
                      grading_rule: 'exact',
                      alternative_answer: null,
                    },
                  ],
                  GroupID: 102,
                  Content: '编写一个函数，实现两个数相加。',
                },
              ],
            },
          ],
          student_answers: [
            // 学生 1
            { QuestionID: 1001, ExamineeID: 5001, PracticeSubmissionID: 7001, Answer: { answer: ['B'] } },
            { QuestionID: 1002, ExamineeID: 5001, PracticeSubmissionID: 7001, Answer: { answer: ['A', 'C'] } },
            { QuestionID: 1003, ExamineeID: 5001, PracticeSubmissionID: 7001, Answer: { answer: ['false'] } },
            {
              QuestionID: 2001,
              ExamineeID: 5001,
              PracticeSubmissionID: 7001,
              Answer: { answer: ['function', 'const'] },
            },
            {
              QuestionID: 2002,
              ExamineeID: 5001,
              PracticeSubmissionID: 7001,
              Answer: { answer: ['事件循环是JavaScript处理异步操作的机制。'] },
            },
            {
              QuestionID: 2003,
              ExamineeID: 5001,
              PracticeSubmissionID: 7001,
              Answer: { answer: ['function add(a, b) { return a + b; }'] },
            },
          ],
          student_infos: [{ ExamineeID: 5001, OfficialName: '李四', SerialNumber: 1, PracticeSubmissionID: 7001 }],
          marking_results: [
            // 学生 1 批改结果
            {
              TeacherID: 9001,
              ExamineeID: 5001,
              ExamSessionID: 8001,
              PracticeID: 9001,
              PracticeSubmissionID: 7001,
              QuestionID: 1001,
              MarkDetails: [{ Index: 1, Score: -5 }],
              Score: -5,
            },
            {
              TeacherID: 9001,
              ExamineeID: 5001,
              ExamSessionID: 8001,
              PracticeID: 9001,
              PracticeSubmissionID: 7001,
              QuestionID: 1002,
              MarkDetails: [
                { Index: 1, Score: 5 },
                { Index: 2, Score: 5 },
              ],
              Score: 10,
            },
            {
              TeacherID: 9001,
              ExamineeID: 5001,
              ExamSessionID: 8001,
              PracticeID: 9001,
              PracticeSubmissionID: 7001,
              QuestionID: 1003,
              MarkDetails: [{ Index: 1, Score: 0 }],
              Score: 0,
            },
            {
              TeacherID: 9001,
              ExamineeID: 5001,
              ExamSessionID: 8001,
              PracticeID: 9001,
              PracticeSubmissionID: 7001,
              QuestionID: 2001,
              MarkDetails: [
                { Index: 1, Score: 5 },
                { Index: 2, Score: 5 },
              ],
              Score: 10,
            },
            {
              TeacherID: 9001,
              ExamineeID: 5001,
              ExamSessionID: 8001,
              PracticeID: 9001,
              PracticeSubmissionID: 7001,
              QuestionID: 2002,
              MarkDetails: [{ Index: 1, Score: 10 }],
              Score: 10,
            },
            {
              TeacherID: 9001,
              ExamineeID: 5001,
              ExamSessionID: 8001,
              PracticeID: 9001,
              PracticeSubmissionID: 7001,
              QuestionID: 2003,
              MarkDetails: [{ Index: 1, Score: 20 }],
              Score: 20,
            },
          ],
        },
      });
      render(CorrectPage);

      await waitFor(() => {
        expect(screen.getAllByRole('button', { name: '1' })[0]).toHaveClass('unknown');
        expect(toast.error).toHaveBeenCalled('获取分数状态失败：question_id=1001, score=-5');
      });
    });
  });

  describe('批改模式切换功能测试', () => {
    beforeEach(() => {
      vi.clearAllMocks();

      setExamCorrect();
    });

    it('应正确切换全卷模式和逐题模式', async () => {
      render(CorrectPage);

      // 初始为全卷模式
      await waitFor(() => {
        expect(screen.queryByRole('button', { name: /上一题/ })).not.toBeInTheDocument();
        expect(screen.queryByRole('button', { name: /下一题/ })).not.toBeInTheDocument();
      });

      // 获取切换开关
      const switchBtn = within(screen.getByTestId('switch')).getByRole('button');
      await fireEvent.click(switchBtn);

      // 切换到逐题模式
      await waitFor(() => {
        expect(screen.getByRole('button', { name: /上一题/ })).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /下一题/ })).toBeInTheDocument();
      });
    });

    it('逐题模式下应正确切换题目', async () => {
      render(CorrectPage);

      // 切换到逐题模式
      const switchBtn = within(screen.getByTestId('switch')).getByRole('button');
      await fireEvent.click(switchBtn);

      // 切换到下一题
      await fireEvent.click(screen.getByText('下一题'));
      await waitFor(() => {
        expect(screen.getByText(/多选题/)).toBeInTheDocument();
      });

      // 切换回上一题
      await fireEvent.click(screen.getByText('上一题'));
      await waitFor(() => {
        expect(screen.getByText(/单选题/)).toBeInTheDocument();
      });
    });
  });

  describe('考生切换功能测试', () => {
    beforeEach(() => {
      setExamCorrect();
    });

    it('应正确切换到下一位考生（全卷模式）', async () => {
      render(CorrectPage);

      await waitFor(() => {
        expect(screen.getByText('李四')).toBeInTheDocument();
      });

      const nextButton = screen.getByText('下一位');
      await fireEvent.click(nextButton);

      await waitFor(() => {
        expect(screen.getByText('王五')).toBeInTheDocument();
      });
    });

    it('应正确切换到上一位考生（全卷模式）', async () => {
      render(CorrectPage);

      // 先切换到下一位
      await fireEvent.click(screen.getByText('下一位'));
      await waitFor(() => {
        expect(screen.getByText('王五')).toBeInTheDocument();
      });

      // 再切换回上一位
      const prevButton = screen.getByText('上一位');
      await fireEvent.click(prevButton);

      await waitFor(() => {
        expect(screen.getByText('李四')).toBeInTheDocument();
      });
    });

    it('应正确切换到下一位考生（逐题模式）', async () => {
      render(CorrectPage);

      await waitFor(() => {
        expect(screen.getByText('李四')).toBeInTheDocument();
      });

      // 切换到逐题模式
      const switchBtn = within(screen.getByTestId('switch')).getByRole('button');
      await fireEvent.click(switchBtn);

      const nextButton = screen.getByText('下一位');
      await fireEvent.click(nextButton);

      await waitFor(() => {
        expect(screen.getByText('王五')).toBeInTheDocument();
      });
    });

    it('应正确切换到上一位考生（逐题模式）', async () => {
      render(CorrectPage);

      // 先切换到下一位
      await fireEvent.click(screen.getByText('下一位'));
      await waitFor(() => {
        expect(screen.getByText('王五')).toBeInTheDocument();
      });

      // 切换到逐题模式
      const switchBtn = within(screen.getByTestId('switch')).getByRole('button');
      await fireEvent.click(switchBtn);

      // 再切换回上一位
      const prevButton = screen.getByText('上一位');
      await fireEvent.click(prevButton);

      await waitFor(() => {
        expect(screen.getByText('李四')).toBeInTheDocument();
      });
    });

    it('第一位考生时上一位按钮应禁用', async () => {
      render(CorrectPage);

      const prevButton = screen.getByText('上一位');
      expect(prevButton).toHaveClass('is-disabled');
    });

    it('最后一位考生时下一位按钮应变为提交按钮（考试模式）', async () => {
      render(CorrectPage);

      // 切换到下一位
      await fireEvent.click(screen.getByText('下一位'));
      await fireEvent.click(screen.getByText('下一位'));

      await waitFor(() => {
        expect(screen.getByText('上一位')).toBeInTheDocument();
        expect(screen.getByText(/提交/)).toBeInTheDocument();
        expect(screen.queryByText('下一位')).not.toBeInTheDocument();
      });
    });

    it('最后一位考生时下一位按钮应为禁用（练习模式）', async () => {
      setPracticeCorrect();

      render(CorrectPage);

      // 切换到下一位
      await fireEvent.click(screen.getByText('下一位'));
      await fireEvent.click(screen.getByText('下一位'));

      await waitFor(() => {
        expect(screen.getByText('上一位')).toBeInTheDocument();
        expect(screen.queryByText(/提交/)).not.toBeInTheDocument();
        expect(screen.getByText('下一位')).toBeInTheDocument();
      });
    });
  });

  describe('第一次批改更新考试状态由“已结束”改为“批改中”功能测试（考试模式）', () => {
    beforeEach(() => {
      setExamCorrect();

      mockFetch({
        status: 0,
        data: {
          ...MOCK_DATA,
          marking_results: [], // 没有批改记录
        },
      });

      render(CorrectPage);
      vi.clearAllMocks();
    });

    it('成功修改考试状态', async () => {
      mockFetch({ status: 0 });

      await waitFor(() => {
        const input = screen.getAllByPlaceholderText('输入得分')[0];
        fireEvent.input(input, { target: { value: 1 } });
      });

      await new Promise((resolve) => setTimeout(resolve, 600));

      await expect(global.fetch).toBeCalledTimes(2); // 一次是更新状态，一次是保存批改的分数
      await expect(global.fetch).toHaveBeenNthCalledWith(
        1,
        expect.stringContaining('/api/mark/state?exam_session_id=8001'),
        expect.objectContaining({ method: 'PATCH' }),
      );
    });

    it('响应码非2xx，应显示错误提示（有error_text）', async () => {
      global.fetch = vi.fn(() =>
        Promise.resolve({
          ok: false,
          status: 500,
          statusText: 'Internal Server Error',
          text: () => Promise.resolve('具体错误信息'),
        }),
      );

      await waitFor(() => {
        const input = screen.getAllByPlaceholderText('输入得分')[0];
        fireEvent.input(input, { target: { value: 1 } });
      });

      await new Promise((resolve) => setTimeout(resolve, 600));

      await expect(toast.error).toHaveBeenNthCalledWith(1, '请求失败：500 Internal Server Error-具体错误信息');
    });

    it('响应码非2xx，应显示错误提示（无error_text）', async () => {
      global.fetch = vi.fn(() =>
        Promise.resolve({
          ok: false,
          status: 500,
          statusText: 'Internal Server Error',
          text: () => Promise.resolve(),
        }),
      );

      await waitFor(() => {
        const input = screen.getAllByPlaceholderText('输入得分')[0];
        fireEvent.input(input, { target: { value: 1 } });
      });

      await new Promise((resolve) => setTimeout(resolve, 600));

      await expect(toast.error).toHaveBeenNthCalledWith(1, '请求失败：500 Internal Server Error');
    });

    it('返回的status非0，且有 msg，应显示错误提示', async () => {
      mockFetch({ status: -1, msg: '错误消息' });

      await waitFor(() => {
        const input = screen.getAllByPlaceholderText('输入得分')[0];
        fireEvent.input(input, { target: { value: 1 } });
      });

      await new Promise((resolve) => setTimeout(resolve, 600));

      await expect(toast.error).toHaveBeenNthCalledWith(1, '错误消息');
    });

    it('返回的status非0，且没有 msg，应显示默认错误提示', async () => {
      mockFetch({ status: -1 });

      await waitFor(() => {
        const input = screen.getAllByPlaceholderText('输入得分')[0];
        fireEvent.input(input, { target: { value: 1 } });
      });

      await new Promise((resolve) => setTimeout(resolve, 600));

      await expect(toast.error).toHaveBeenNthCalledWith(1, '更新考试场次的状态失败');
    });
  });

  describe('保存批改的分数功能测试（考试模式）', () => {
    beforeEach(() => {
      setExamCorrect();

      render(CorrectPage);
      vi.clearAllMocks();
    });

    it('成功保存批改分数', async () => {
      mockFetch({ status: 0 });

      await waitFor(() => {
        const input = screen.getAllByPlaceholderText('输入得分')[0];
        fireEvent.input(input, { target: { value: 1 } });
      });

      await new Promise((resolve) => setTimeout(resolve, 600));

      await expect(global.fetch).toBeCalledTimes(1);
      await expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/mark/marking-results'),
        expect.objectContaining({
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
        }),
      );
    });

    it('响应码非2xx，应显示错误提示（有error_text）', async () => {
      global.fetch = vi.fn(() =>
        Promise.resolve({
          ok: false,
          status: 500,
          statusText: 'Internal Server Error',
          text: () => Promise.resolve('具体错误信息'),
        }),
      );

      await waitFor(() => {
        const input = screen.getAllByPlaceholderText('输入得分')[0];
        fireEvent.input(input, { target: { value: 1 } });
      });

      await new Promise((resolve) => setTimeout(resolve, 600));

      await expect(toast.error).toHaveBeenCalledWith('请求失败：500 Internal Server Error-具体错误信息');
    });

    it('响应码非2xx，应显示错误提示（无error_text）', async () => {
      global.fetch = vi.fn(() =>
        Promise.resolve({
          ok: false,
          status: 500,
          statusText: 'Internal Server Error',
          text: () => Promise.resolve(),
        }),
      );

      await waitFor(() => {
        const input = screen.getAllByPlaceholderText('输入得分')[0];
        fireEvent.input(input, { target: { value: 1 } });
      });

      await new Promise((resolve) => setTimeout(resolve, 600));

      await expect(toast.error).toHaveBeenCalledWith('请求失败：500 Internal Server Error');
    });

    it('返回的status非0，且有 msg，应显示错误提示', async () => {
      mockFetch({ status: -1, msg: '错误消息' });

      await waitFor(() => {
        const input = screen.getAllByPlaceholderText('输入得分')[0];
        fireEvent.input(input, { target: { value: 1 } });
      });

      await new Promise((resolve) => setTimeout(resolve, 600));

      await expect(toast.error).toHaveBeenCalledWith('错误消息');
    });

    it('返回的status非0，且没有 msg，应显示默认错误提示', async () => {
      mockFetch({ status: -1 });

      await waitFor(() => {
        const input = screen.getAllByPlaceholderText('输入得分')[0];
        fireEvent.input(input, { target: { value: 1 } });
      });

      await new Promise((resolve) => setTimeout(resolve, 600));

      await expect(toast.error).toHaveBeenCalledWith('批改操作失败');
    });
  });

  describe('保存批改的分数功能测试（练习模式）', () => {
    beforeEach(() => {
      setPracticeCorrect();

      mockFetch({
        status: 0,
        data: {
          ...MOCK_DATA,
          marking_results: [], // 没有批改记录
        },
      });

      render(CorrectPage);
      vi.clearAllMocks();
    });

    it('成功保存批改分数（全卷模式）', async () => {
      mockFetch({ status: 0 });

      await waitFor(() => {
        const input = screen.getAllByPlaceholderText('输入得分')[0];
        fireEvent.input(input, { target: { value: 1 } });
      });

      await new Promise((resolve) => setTimeout(resolve, 600));

      await expect(global.fetch).toBeCalledTimes(1);
      await expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/mark/marking-results'),
        expect.objectContaining({
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
        }),
      );
    });

    it('成功保存批改分数（逐题模式）', async () => {
      mockFetch({ status: 0 });

      // 切换到逐题模式
      const switchBtn = within(screen.getByTestId('switch')).getByRole('button');
      await fireEvent.click(switchBtn);

      await waitFor(() => {
        const input = screen.getAllByPlaceholderText('输入得分')[0];
        fireEvent.input(input, { target: { value: 1 } });
      });

      await new Promise((resolve) => setTimeout(resolve, 600));

      await expect(global.fetch).toBeCalledTimes(1);
      await expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/mark/marking-results'),
        expect.objectContaining({
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
        }),
      );
    });

    it('响应码非2xx，应显示错误提示（有error_text）', async () => {
      global.fetch = vi.fn(() =>
        Promise.resolve({
          ok: false,
          status: 500,
          statusText: 'Internal Server Error',
          text: () => Promise.resolve('具体错误信息'),
        }),
      );

      await waitFor(() => {
        const input = screen.getAllByPlaceholderText('输入得分')[0];
        fireEvent.input(input, { target: { value: 1 } });
      });

      await new Promise((resolve) => setTimeout(resolve, 600));

      await expect(toast.error).toHaveBeenCalledWith('请求失败：500 Internal Server Error-具体错误信息');
    });

    it('响应码非2xx，应显示错误提示（无error_text）', async () => {
      global.fetch = vi.fn(() =>
        Promise.resolve({
          ok: false,
          status: 500,
          statusText: 'Internal Server Error',
          text: () => Promise.resolve(),
        }),
      );

      await waitFor(() => {
        const input = screen.getAllByPlaceholderText('输入得分')[0];
        fireEvent.input(input, { target: { value: 1 } });
      });

      await new Promise((resolve) => setTimeout(resolve, 600));

      await expect(toast.error).toHaveBeenCalledWith('请求失败：500 Internal Server Error');
    });

    it('返回的status非0，且有 msg，应显示错误提示', async () => {
      mockFetch({ status: -1, msg: '错误消息' });

      await waitFor(() => {
        const input = screen.getAllByPlaceholderText('输入得分')[0];
        fireEvent.input(input, { target: { value: 1 } });
      });

      await new Promise((resolve) => setTimeout(resolve, 600));

      await expect(toast.error).toHaveBeenCalledWith('错误消息');
    });

    it('返回的status非0，且没有 msg，应显示默认错误提示', async () => {
      mockFetch({ status: -1 });

      await waitFor(() => {
        const input = screen.getAllByPlaceholderText('输入得分')[0];
        fireEvent.input(input, { target: { value: 1 } });
      });

      await new Promise((resolve) => setTimeout(resolve, 600));

      await expect(toast.error).toHaveBeenCalledWith('批改操作失败');
    });
  });

  describe('提交功能测试（考试模式）', () => {
    beforeEach(async () => {
      setExamCorrect();

      render(CorrectPage);
      vi.clearAllMocks();

      // 切换到考试模式最后一位考生
      await fireEvent.click(screen.getByText('下一位'));
      await fireEvent.click(screen.getByText('下一位'));
    });

    it('应正确提交批改结果', async () => {
      mockFetch({ status: 0 });

      // 点击提交按钮
      await fireEvent.click(screen.getByText(/提交/));

      await waitFor(() => {
        expect(MessageBox).toHaveBeenCalledWith(
          expect.objectContaining({
            title: '确认操作',
            content: '你确定要提交吗？',
          }),
        );

        // 确认后应调用API
        expect(global.fetch).toHaveBeenCalledWith(
          '/api/mark/results-submission?exam_session_id=8001',
          expect.anything(),
        );

        expect(toast.success).toHaveBeenCalledWith('提交成功');
      });
    });

    it('响应码非2xx，应显示错误提示（有error_text）', async () => {
      global.fetch = vi.fn(() =>
        Promise.resolve({
          ok: false,
          status: 500,
          statusText: 'Internal Server Error',
          text: () => Promise.resolve('服务器错误'),
        }),
      );

      // 点击提交按钮
      await fireEvent.click(screen.getByText(/提交/));

      await waitFor(() => {
        expect(toast.error).toHaveBeenCalledWith('请求失败：500 Internal Server Error-服务器错误');
      });
    });

    it('响应码非2xx，应显示错误提示（无error_text）', async () => {
      global.fetch = vi.fn(() =>
        Promise.resolve({
          ok: false,
          status: 500,
          statusText: 'Internal Server Error',
          text: () => Promise.resolve(),
        }),
      );

      // 点击提交按钮
      await fireEvent.click(screen.getByText(/提交/));

      await waitFor(() => {
        expect(toast.error).toHaveBeenCalledWith('请求失败：500 Internal Server Error');
      });
    });

    it('返回的status非0，且有 msg，应显示错误提示', async () => {
      mockFetch({ status: -1, msg: '错误消息' });

      // 点击提交按钮
      await fireEvent.click(screen.getByText(/提交/));

      await waitFor(() => {
        // 确认后应调用API
        expect(global.fetch).toHaveBeenCalledWith(
          '/api/mark/results-submission?exam_session_id=8001',
          expect.anything(),
        );

        expect(toast.error).toHaveBeenCalledWith('错误消息');
      });
    });

    it('返回的status非0，且没有 msg，应显示默认错误提示', async () => {
      mockFetch({ status: -1 });

      // 点击提交按钮
      await fireEvent.click(screen.getByText(/提交/));

      await waitFor(() => {
        // 确认后应调用API
        expect(global.fetch).toHaveBeenCalledWith(
          '/api/mark/results-submission?exam_session_id=8001',
          expect.anything(),
        );

        expect(toast.error).toHaveBeenCalledWith('提交失败');
      });
    });
  });

  describe('提交功能测试（练习模式）', () => {
    beforeEach(async () => {
      setPracticeCorrect();

      mockFetch({ status: 0, data: MOCK_DATA });

      render(CorrectPage);
      vi.clearAllMocks();
    });

    it('应正确提交批改结果，且所有学生都提交会提示', async () => {
      mockFetch({ status: 0 });

      await waitFor(() => {
        const input = screen.getAllByPlaceholderText('输入得分')[0];
        fireEvent.input(input, { target: { value: 1 } });
      });

      await new Promise((resolve) => setTimeout(resolve, 600));

      await waitFor(() => {
        expect(global.fetch).toHaveBeenNthCalledWith(
          2, // 只断言第二次调用
          '/api/mark/results-submission?practice_id=9001&practice_submission_id=7001',
          { method: 'PATCH' },
        );

        expect(toast.success).toHaveBeenCalledWith('当前所有的学生已批改且提交成功，可以返回列表');
      });
    });

    it('响应码非2xx，应显示错误提示（有error_text）', async () => {
      // 第一次 fetch（保存批改）：成功
      global.fetch = vi
        .fn()
        .mockImplementationOnce(() =>
          Promise.resolve({
            ok: true,
            status: 200,
            json: () => Promise.resolve({ status: 0 }),
          }),
        )
        // 第二次 fetch（提交批改）：失败
        .mockImplementationOnce(() =>
          Promise.resolve({
            ok: false,
            status: 500,
            statusText: 'Internal Server Error',
            text: () => Promise.resolve('服务器错误'),
          }),
        );

      await waitFor(() => {
        const input = screen.getAllByPlaceholderText('输入得分')[0];
        fireEvent.input(input, { target: { value: 1 } });
      });

      await new Promise((resolve) => setTimeout(resolve, 600));

      await waitFor(() => {
        expect(toast.error).toHaveBeenCalledWith('请求失败：500 Internal Server Error-服务器错误');
      });
    });

    it('响应码非2xx，应显示错误提示（无error_text）', async () => {
      // 第一次 fetch（保存批改）：成功
      global.fetch = vi
        .fn()
        .mockImplementationOnce(() =>
          Promise.resolve({
            ok: true,
            status: 200,
            json: () => Promise.resolve({ status: 0 }),
          }),
        )
        // 第二次 fetch（提交批改）：失败
        .mockImplementationOnce(() =>
          Promise.resolve({
            ok: false,
            status: 500,
            statusText: 'Internal Server Error',
            text: () => Promise.resolve(),
          }),
        );

      await waitFor(() => {
        const input = screen.getAllByPlaceholderText('输入得分')[0];
        fireEvent.input(input, { target: { value: 1 } });
      });

      await new Promise((resolve) => setTimeout(resolve, 600));

      await waitFor(() => {
        expect(toast.error).toHaveBeenCalledWith('请求失败：500 Internal Server Error');
      });
    });

    it('返回的status非0，且有 msg，应显示错误提示', async () => {
      // 第一次 fetch（保存批改）：成功
      global.fetch = vi
        .fn()
        .mockImplementationOnce(() =>
          Promise.resolve({
            ok: true,
            status: 200,
            json: () => Promise.resolve({ status: 0 }),
          }),
        )
        // 第二次 fetch（提交批改）：失败
        .mockImplementationOnce(() =>
          Promise.resolve({
            ok: true,
            status: 200,
            json: () => Promise.resolve({ status: -1, msg: '错误消息' }),
          }),
        );

      await waitFor(() => {
        const input = screen.getAllByPlaceholderText('输入得分')[0];
        fireEvent.input(input, { target: { value: 1 } });
      });

      await new Promise((resolve) => setTimeout(resolve, 600));

      await waitFor(() => {
        expect(toast.error).toHaveBeenCalledWith('错误消息');
      });
    });

    it('返回的status非0，且无 msg，应显示默认错误提示', async () => {
      // 第一次 fetch（保存批改）：成功
      global.fetch = vi
        .fn()
        .mockImplementationOnce(() =>
          Promise.resolve({
            ok: true,
            status: 200,
            json: () => Promise.resolve({ status: 0 }),
          }),
        )
        // 第二次 fetch（提交批改）：失败
        .mockImplementationOnce(() =>
          Promise.resolve({
            ok: true,
            status: 200,
            json: () => Promise.resolve({ status: -1 }),
          }),
        );

      await waitFor(() => {
        const input = screen.getAllByPlaceholderText('输入得分')[0];
        fireEvent.input(input, { target: { value: 1 } });
      });

      await new Promise((resolve) => setTimeout(resolve, 600));

      await waitFor(() => {
        expect(toast.error).toHaveBeenCalledWith('提交失败');
      });
    });
  });

  describe('题目相关功能测试', () => {
    it('应正确显示题目批改状态', async () => {
      render(CorrectPage);

      await waitFor(() => {
        // 验证右侧总览中的题目状态
        const questionButton = screen.getAllByRole('button', { name: '1' })[0];
        expect(questionButton).toHaveClass('right');
      });
    });

    it('点击题目按钮应滚动到对应题目(全卷模式)', async () => {
      render(CorrectPage);

      await waitFor(() => {
        // 模拟滚动行为
        const mockScrollIntoView = vi.fn();
        window.HTMLElement.prototype.scrollIntoView = mockScrollIntoView;

        // 点击第二个题目按钮
        const questionButton = screen.getAllByRole('button', { name: '2' })[0];
        fireEvent.click(questionButton);

        expect(mockScrollIntoView).toHaveBeenCalled();
      });
    });

    it('点击题目按钮应切换到对应题目(逐题模式)', async () => {
      render(CorrectPage);

      // 切换到逐题模式
      const switchBtn = within(screen.getByTestId('switch')).getByRole('button');
      await fireEvent.click(switchBtn);

      await waitFor(() => {
        expect(screen.getByText('单选题')).toBeInTheDocument();
        expect(screen.queryByText('多选题')).not.toBeInTheDocument();
      });

      // 点击第二个题目按钮
      const questionButton = screen.getAllByRole('button', { name: '2' })[0];
      await fireEvent.click(questionButton);

      await waitFor(() => {
        expect(screen.getByText('多选题')).toBeInTheDocument();
        expect(screen.queryByText('单选题')).not.toBeInTheDocument();
      });
    });

    it('逐题模式下点击下一题按钮可以切换到下一题', async () => {
      render(CorrectPage);

      // 切换到逐题模式
      const switchBtn = within(screen.getByTestId('switch')).getByRole('button');
      await fireEvent.click(switchBtn);

      await waitFor(() => {
        expect(screen.getByText('单选题')).toBeInTheDocument();
        expect(screen.queryByText('多选题')).not.toBeInTheDocument();
      });

      // 点击下一题按钮
      const nextBtn = screen.getByRole('button', { name: '下一题' });
      await fireEvent.click(nextBtn);

      await waitFor(() => {
        expect(screen.getByText('多选题')).toBeInTheDocument();
        expect(screen.queryByText('单选题')).not.toBeInTheDocument();
      });
    });

    it('逐题模式下点击上一题按钮可以切换到上一题', async () => {
      render(CorrectPage);

      // 切换到逐题模式
      const switchBtn = within(screen.getByTestId('switch')).getByRole('button');
      await fireEvent.click(switchBtn);

      // 点击下一题按钮
      const nextBtn = screen.getByRole('button', { name: '下一题' });
      await fireEvent.click(nextBtn);
      await fireEvent.click(nextBtn);
      await fireEvent.click(nextBtn);
      await fireEvent.click(nextBtn);
      await fireEvent.click(nextBtn);

      await waitFor(() => {
        expect(screen.getByText('编程题')).toBeInTheDocument();
        expect(screen.queryByText('单选题')).not.toBeInTheDocument();
      });

      // 点击上一题按钮
      const prevBtn = screen.getByRole('button', { name: '上一题' });
      await fireEvent.click(prevBtn);
      await fireEvent.click(prevBtn);
      await fireEvent.click(prevBtn);
      await fireEvent.click(prevBtn);
      await fireEvent.click(prevBtn);

      await waitFor(() => {
        expect(screen.getByText('单选题')).toBeInTheDocument();
        expect(screen.queryByText('编程题')).not.toBeInTheDocument();
      });
    });

    it('最后一题的下一题按钮应为禁用', async () => {
      render(CorrectPage);

      // 切换到逐题模式
      const switchBtn = within(screen.getByTestId('switch')).getByRole('button');
      await fireEvent.click(switchBtn);

      await waitFor(() => {
        const nextBtn = screen.getByRole('button', { name: '下一题' });
        fireEvent.click(nextBtn); // 点击下一题按钮直至出现最后一题
        expect(nextBtn).toHaveClass('is-disabled');
      });
    });

    it('第一题的上一题按钮应为禁用', async () => {
      render(CorrectPage);

      // 切换到逐题模式
      const switchBtn = within(screen.getByTestId('switch')).getByRole('button');
      await fireEvent.click(switchBtn);

      await waitFor(() => {
        // 点击上一题按钮
        const prevBtn = screen.getByRole('button', { name: '上一题' });
        expect(prevBtn).toHaveClass('is-disabled');
      });
    });
  });
});
