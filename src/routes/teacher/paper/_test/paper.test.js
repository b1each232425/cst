import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { fetchPaperList } from '../_utils/api';

describe('fetchPaperList', () => {
  const mockResponse = {
    status: 200,
    json: () => Promise.resolve({ data: ['paper1', 'paper2'] }),
    ok: true
  };

  beforeEach(() => {
    // 模拟全局 fetch
    global.fetch = vi.fn(() => Promise.resolve(mockResponse));
  });

  afterEach(() => {
    vi.resetAllMocks(); // 清空 mock
  });

  it('should call fetch with correct URL and return data', async () => {
    const result = await fetchPaperList('语文', 'tag1,tag2', 2, 5, '模拟卷');
    
    expect(fetch).toHaveBeenCalledTimes(1);
    expect(fetch).toHaveBeenCalledWith(
      expect.stringContaining('/api/paper?'),
      expect.objectContaining({ method: 'GET' })
    );

    // 你可以更具体地断言 URL
    const calledUrl = fetch.mock.calls[0][0];
    expect(calledUrl).toContain('name=语文');
    expect(calledUrl).toContain('tags=tag1%2Ctag2');
    expect(calledUrl).toContain('page=2');
    expect(calledUrl).toContain('pageSize=5');
    expect(calledUrl).toContain('category=模拟卷');

    expect(result).toEqual({ data: ['paper1', 'paper2'] });
  });

  it('should return null if fetch fails', async () => {
    fetch.mockRejectedValueOnce(new Error('Network error'));
    
    const result = await fetchPaperList();
    expect(result).toBeNull();
  });

  it('should return null on non-ok response', async () => {
    fetch.mockResolvedValueOnce({ ok: false, status: 500 });
    
    const result = await fetchPaperList();
    expect(result).toBeNull();
  });
});
