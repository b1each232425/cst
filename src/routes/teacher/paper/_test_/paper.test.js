import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { fetchPaperList } from '../_utils/api';

// mock 掉fetch请求
global.fetch = vi.fn(); 

describe("API 测试", () => {
  // 每个 it 测试函数执行前
  beforeEach(() => {
    // 每个测试前清空 mock
    fetch.mockReset();
  });

  it("返回正常数据", async () => {
    // 模拟数据
    const mockResponse = {
      ok: true,
      json: async () => mockResponse
    };
  });
});