import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { createEmptyPaper, deletePaper, fetchBankQuestionList, fetchPaper, fetchPaperList, fetchQuestionBankList, savePaper } from '../_utils/api';

describe("fetchPaperList 测试", () => {
  // 每个测试前 stub fetch
  beforeEach(() => {
    vi.stubGlobal("fetch", vi.fn());
  });

  // 每个测试后还原 fetch
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("出现异常", async () => {
    // 配置 fetch mock 返回值
    fetch.mockResolvedValueOnce({
      ok: false,
      status: 500
    })

    // 调用接口
    const result = await fetchPaperList();

    expect(result).toBeNull();
  });

  it("返回正常数据", async () => {
    // 模拟数据
    const mockResponse = "我是返回的数据";

    // 配置 fetch mock 返回值
    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockResponse
    })

    // 调用接口
    const result = await fetchPaperList("试卷", "Svelte", 1, 10, "00");

    expect(result).toEqual(mockResponse);
  });
});

describe("fetchQuestionBankList 测试", () => {
  // 每个测试前 stub fetch
  beforeEach(() => {
    vi.stubGlobal("fetch", vi.fn());
  });

  // 每个测试后还原 fetch
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("出现异常", async () => {
    // 配置 fetch mock 返回值
    fetch.mockResolvedValueOnce({
      ok: false,
      status: 500
    })

    // 调用接口
    const result = await fetchQuestionBankList();

    expect(result).toBeNull();
  });

  it("返回正常数据", async () => {
    // 模拟数据
    const mockResponse = "我是返回的数据";

    // 配置 fetch mock 返回值
    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockResponse
    })

    // 调用接口
    const result = await fetchQuestionBankList("题库", "1", "10", "205");

    expect(result).toEqual(mockResponse);
  });
});

describe("fetchBankQuestionList 测试", () => {
  // 每个测试前 stub fetch
  beforeEach(() => {
    vi.stubGlobal("fetch", vi.fn());
  });

  // 每个测试后还原 fetch
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("出现异常", async () => {
    // 配置 fetch mock 返回值
    fetch.mockResolvedValueOnce({
      ok: false,
      status: 500
    })

    // 调用接口
    const result = await fetchBankQuestionList();

    expect(result).toBeNull();
  });

  it("返回正常数据", async () => {
    // 模拟数据
    const mockResponse = "我是返回的数据";

    // 配置 fetch mock 返回值
    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockResponse
    })

    // 调用接口
    const result = await fetchBankQuestionList(
      "205", 1, 10, "题目", "Svelte", "00", "00");

    expect(result).toEqual(mockResponse);
  });
});

describe("createEmptyPaper 测试", () => {
  // 每个测试前 stub fetch
  beforeEach(() => {
    vi.stubGlobal("fetch", vi.fn());
  });

  // 每个测试后还原 fetch
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("出现异常", async () => {
    // 配置 fetch mock 返回值
    fetch.mockResolvedValueOnce({
      ok: false,
      status: 500
    })

    // 调用接口
    const result = await createEmptyPaper();

    expect(result).toBeNull();
  });

  it("返回正常数据", async () => {
    // 模拟数据
    const mockResponse = "我是返回的数据";

    // 配置 fetch mock 返回值
    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockResponse
    })

    // 调用接口
    const result = await createEmptyPaper();

    expect(result).toEqual(mockResponse);
  });
});

describe("fetchPaper 测试", () => {
  // 每个测试前 stub fetch
  beforeEach(() => {
    vi.stubGlobal("fetch", vi.fn());
  });

  // 每个测试后还原 fetch
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("出现异常", async () => {
    // 配置 fetch mock 返回值
    fetch.mockResolvedValueOnce({
      ok: false,
      status: 500
    })

    // 调用接口
    const result = await fetchPaper();

    expect(result).toBeNull();
  });

  it("返回正常数据", async () => {
    // 模拟数据
    const mockResponse = "我是返回的数据";

    // 配置 fetch mock 返回值
    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockResponse
    })

    // 调用接口
    const result = await fetchPaper();

    expect(result).toEqual(mockResponse);
  });
});

describe("savePaper 测试", () => {
  // 每个测试前 stub fetch
  beforeEach(() => {
    vi.stubGlobal("fetch", vi.fn());
  });

  // 每个测试后还原 fetch
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("出现异常", async () => {
    // 配置 fetch mock 返回值
    fetch.mockResolvedValueOnce({
      ok: false,
      status: 500
    })

    // 调用接口
    const result = await savePaper();

    expect(result).toBeNull();
  });

  it("返回正常数据", async () => {
    // 模拟数据
    const mockResponse = "我是返回的数据";

    // 配置 fetch mock 返回值
    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockResponse
    })

    // 调用接口
    const result = await savePaper();

    expect(result).toEqual(mockResponse);
  });
});

describe("deletePaper 测试", () => {
  // 每个测试前 stub fetch
  beforeEach(() => {
    vi.stubGlobal("fetch", vi.fn());
  });

  // 每个测试后还原 fetch
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("出现异常", async () => {
    // 配置 fetch mock 返回值
    fetch.mockResolvedValueOnce({
      ok: false,
      status: 500
    })

    // 调用接口
    const result = await deletePaper();

    expect(result).toBeNull();
  });

  it("返回正常数据", async () => {
    // 模拟数据
    const mockResponse = "我是返回的数据";

    // 配置 fetch mock 返回值
    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockResponse
    })

    // 调用接口
    const result = await deletePaper();

    expect(result).toEqual(mockResponse);
  });
});