import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { createEmptyPaper, deletePaper, fetchPaperList } from "../+page.svelte"
import { fetchPaper, savePaper } from "../manual/+page@.svelte"
import { fetchBankQuestionList, fetchQuestionBankList } from "../_components/ImportQuestion/ImportQuestion.svelte"

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
    const RESULT = await fetchPaperList();

    expect(RESULT).toBeNull();
  });

  it("返回正常数据", async () => {
    // 模拟数据
    const MOCKRESPNSE = "我是返回的数据";

    // 配置 fetch mock 返回值
    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => MOCKRESPNSE
    })

    // 调用接口
    const RESULT = await fetchPaperList("试卷", "Svelte", 1, 10, "00");

    expect(RESULT).toEqual(MOCKRESPNSE);
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
    const RESUlt = await fetchQuestionBankList();

    expect(RESUlt).toBeNull();
  });

  it("返回正常数据", async () => {
    // 模拟数据
    const MOCKRESPONSE = "我是返回的数据";

    // 配置 fetch mock 返回值
    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => MOCKRESPONSE
    })

    // 调用接口
    const RESULT = await fetchQuestionBankList("题库", "1", "10", "205");

    expect(RESULT).toEqual(MOCKRESPONSE);
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
    const RESULT = await fetchBankQuestionList();

    expect(RESULT).toBeNull();
  });

  it("返回正常数据", async () => {
    // 模拟数据
    const MOCKRESPONSE = "我是返回的数据";

    // 配置 fetch mock 返回值
    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => MOCKRESPONSE
    })

    // 调用接口
    const RESULT = await fetchBankQuestionList(
      "205", 1, 10, "题目", "Svelte", "00", "00");

    expect(RESULT).toEqual(MOCKRESPONSE);
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
    const RESULT = await createEmptyPaper();

    expect(RESULT).toBeNull();
  });

  it("返回正常数据", async () => {
    // 模拟数据
    const MOCKRESPNSE = "我是返回的数据";

    // 配置 fetch mock 返回值
    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => MOCKRESPNSE
    })

    // 调用接口
    const RESULT = await createEmptyPaper();

    expect(RESULT).toEqual(MOCKRESPNSE);
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
    const RESULT = await fetchPaper();

    expect(RESULT).toBeNull();
  });

  it("返回正常数据", async () => {
    // 模拟数据
    const MOCKRESPONSE = "我是返回的数据";

    // 配置 fetch mock 返回值
    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => MOCKRESPONSE
    })

    // 调用接口
    const RESULT = await fetchPaper();

    expect(RESULT).toEqual(MOCKRESPONSE);
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
    const RESULT = await savePaper();

    expect(RESULT).toBeNull();
  });

  it("返回正常数据", async () => {
    // 模拟数据
    const MOCKRESPONSE = "我是返回的数据";

    // 配置 fetch mock 返回值
    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => MOCKRESPONSE
    })

    // 调用接口
    const RESULT = await savePaper();

    expect(RESULT).toEqual(MOCKRESPONSE);
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
    const RESULT = await deletePaper();

    expect(RESULT).toBeNull();
  });

  it("返回正常数据", async () => {
    // 模拟数据
    const MOCKRESPONSE = "我是返回的数据";

    // 配置 fetch mock 返回值
    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => MOCKRESPONSE
    })

    // 调用接口
    const RESULT = await deletePaper();

    expect(RESULT).toEqual(MOCKRESPONSE);
  });
});