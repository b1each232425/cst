import { beforeEach, describe, expect, it, vi } from 'vitest';
import { act, getByText, render, screen ,waitFor} from '@testing-library/svelte';
import BankPage from '../+page.svelte';
import { goto } from '$app/navigation';

// 模拟导航函数
vi.mock('$app/navigation', () => ({
  goto: vi.fn(),
  preloadCode: vi.fn(),
  invalidate: vi.fn(),
}));
describe('题库管理页面', () => {
  beforeEach(() => {
    // 重置所有 mock
    vi.resetAllMocks();
    
    // 设置 localStorage mock
    Storage.prototype.getItem = vi.fn((key) => {
      if (key === 'question_bank_data') {
        return JSON.stringify({
          id: 1,
          name: '测试题库',
          tags: ['数学', '物理'],
          create_time: Date.now(),
          update_time: Date.now()
        });
      }
      return null;
    });
    
   
  })
//测试能否渲染题库基本信息
it('应该正确渲染题库页面的基本元素', async () => {
    
     render(BankPage);
 
    // 检查搜索题库输入框是否渲染
 expect(screen.getByPlaceholderText('请输入题库名').value).toBe('测试题库');
//显示是否有标签
   expect(screen.getByTitle('数学')).toBeInTheDocument();
   expect(screen.getByTitle('物理')).toBeInTheDocument();
    // 验证题目数量显示
  expect(screen.getByText('返回题库列表')).toBeInTheDocument();

});

/**
 * 测试获取题目HTTP错误响应
 */
it('获取题目正确处理HTTP错误', async () => {

 global.fetch = vi.fn().mockResolvedValue({
			ok: false,
			status: 500
		});
 
    await render(BankPage);

      //等待toast报错
    await waitFor(() => {
    expect(screen.getByText('获取试题列表失败:HTTP错误')).toBeInTheDocument();
  });
});


/**
 * 测试获取题目网络错误响应
 */
it('获取题目正确处理网络错误', async () => {

		global.fetch = vi.fn().mockRejectedValue(new Error('网络连接失败'));
    await render(BankPage);

      //等待toast报错
    await waitFor(() => {
    expect(screen.getByText('获取试题列表失败:网络连接失败')).toBeInTheDocument();
  });
});

/**
 * 测试获取题目后端错误响应
 */
it('获取题目正确处理后端错误', async () => {
  

		global.fetch = vi.fn().mockResolvedValue({
			ok: true,
      json: async () => ({
		  status: -1,
        msg: "后端错误消息",
      }),
		});

     render(BankPage);

      //等待toast报错
    await waitFor(() => {
    expect(screen.getByText('获取试题列表失败:后端错误消息')).toBeInTheDocument();
  });
});










});




