import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/svelte';
import ExamDetailPage from '../+page.svelte';
import { readable } from 'svelte/store';

// mock $app/state 路由参数
vi.mock('$app/state', () => ({
  page: readable({
    url: {
      searchParams: {
        get: (key) => {
          if (key === 'exam-session-id') return '152';
          return null;
        }
      }
    }
  })
}));

// mock Toast
vi.mock('$lib/components/Toast/Toast', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  }
}));

// mock MessageBox
vi.mock('$lib/components/MessageBox/MessageBox.js', () => ({
  default: vi.fn()
}));

// mock goto
vi.mock('$app/navigation', () => ({
  goto: vi.fn()
}));

// mock sget
vi.mock('$lib/utils/index.js', () => ({
  sget: (obj, path, def) => {
    // 简单实现，只支持一层
    const keys = path.split('.');
    let val = obj;
    for (const k of keys) {
      val = val?.[k];
      if (val === undefined) return def;
    }
    return val;
  }
}));

// mock formatTimestamp
vi.mock('../_utils/time_utils', () => ({
  formatTimestamp: (ts) => `时间戳:${ts}`
}));

// mock fetch
const mockExamInfo = {
  status: 0,
  data: {
    examInfo: {
      Name: "网络技术考试",
      Rules: "<p>考试须知内容</p>",
      Files: [
        { save_path: "file1.pdf", file_name: "附件1.pdf" },
        { save_path: "file2.docx", file_name: "附件2.docx" }
      ]
    },
    examSessions: [
    {
        ID: 2002,
        ExamID: 1001,
        PaperID: "P001",
        PeriodMode: "00",
        StartTime: "2025-08-01T09:00:00Z",
        EndTime: "2025-08-01T11:00:00Z",
        Duration: 120,
        SessionNum: 1,
        ExamineeID: 3003,
        LateEntryTime: 10,
        EarlySubmissionTime: 30
    },
    {
        ID: 2003,
        ExamID: 1001,
        PaperID: "P002",
        PeriodMode: "00",
        StartTime: "2025-08-02T09:00:00Z",
        EndTime: "2025-08-02T11:00:00Z",
        Duration: 120,
        SessionNum: 2,
        ExamineeID: 3004,
        LateEntryTime: 10,
        EarlySubmissionTime: 30
    }
    ]
  }
};

const mockExamStatus = {
  status: 0,
  API: "/api/respondent/exam/status",
  method: "GET",
  data: 3 // 考试已提交
};

global.fetch = vi.fn((url) => {
  if (url.startsWith('/api/exam')) {
    return Promise.resolve({
      ok: true,
      json: () => Promise.resolve(mockExamInfo)
    });
  }
  if (url.startsWith('/api/respondent/exam/status')) {
    return Promise.resolve({
      ok: true,
      json: () => Promise.resolve(mockExamStatus)
    });
  }
  return Promise.reject(new Error('Unknown API'));
});

describe('ExamDetailPage 考试详情页', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('正常渲染考试标题、须知、附件、场次信息', async () => {
    render(ExamDetailPage);

    await waitFor(() => {
      expect(screen.getByText('网络技术考试')).toBeTruthy();
      expect(screen.getByText('考生须知')).toBeTruthy();
      expect(screen.getByText('考试须知内容')).toBeTruthy();
      expect(screen.getByText('附件1.pdf')).toBeTruthy();
      expect(screen.getByText('附件2.docx')).toBeTruthy();
      expect(screen.getByText('考试时长：')).toBeTruthy();
      expect(screen.getByText('120 分钟')).toBeTruthy();
      expect(screen.getByText('开始时间：')).toBeTruthy();
      expect(screen.getByText('结束时间：')).toBeTruthy();
      expect(screen.getByText('时间戳:')).toBeTruthy();
    });
  });

  it('考试状态为已提交时按钮文本正确', async () => {
    render(ExamDetailPage);

    await waitFor(() => {
      expect(screen.getByText('考试已提交')).toBeTruthy();
    });
  });

  it('点击返回按钮跳转到考试列表', async () => {
    render(ExamDetailPage);
    const btn = screen.getByText('返回');
    await fireEvent.click(btn);
    expect(window.location.href).toContain('/student/exam');
  });

  it('点击一键下载按钮会触发下载', async () => {
    render(ExamDetailPage);
    await waitFor(() => {
      expect(screen.getByText('一键下载')).toBeTruthy();
    });
    await fireEvent.click(screen.getByText('一键下载'));
    // 断言 toast.success 被调用
    expect(require('$lib/components/Toast/Toast').toast.success).toHaveBeenCalled();
  });

  it('点击展开按钮切换附件区域', async () => {
    render(ExamDetailPage);
    await waitFor(() => {
      expect(screen.getByText('展开')).toBeTruthy();
    });
    await fireEvent.click(screen.getByText('展开'));
    expect(screen.getByText('收起')).toBeTruthy();
  });

  it('点击上一场/下一场按钮切换场次', async () => {
    render(ExamDetailPage);
    await waitFor(() => {
      expect(screen.getByText('<<上一场')).toBeTruthy();
      expect(screen.getByText('下一场 >>')).toBeTruthy();
    });
    await fireEvent.click(screen.getByText('下一场 >>'));
    await fireEvent.click(screen.getByText('<<上一场'));
    // 断言场次切换逻辑（可根据 current_session 断言）
  });

  it('点击下一场/上一场按钮切换场次', async () => {
    render(ExamDetailPage);
    await waitFor(() => {
        expect(screen.getByText('下一场 >>')).toBeTruthy();
    });
    await fireEvent.click(screen.getByText('下一场 >>'));
    // 断言内容已切换到第二场
    await waitFor(() => {
        expect(screen.getByText(/P002/)).toBeTruthy();
    });
    await fireEvent.click(screen.getByText('<<上一场'));
    // 断言内容已切换回第一场
    await waitFor(() => {
        expect(screen.getByText(/P001/)).toBeTruthy();
    });
    });
});