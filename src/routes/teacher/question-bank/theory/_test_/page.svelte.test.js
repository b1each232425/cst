import {beforeEach, describe, expect, it, vi} from 'vitest';
import {fireEvent, render, screen, waitFor} from '@testing-library/svelte';
import bankPage from  '../+page.svelte'
// 模拟导航函数
vi.mock('$app/navigation', () => ({
	goto: vi.fn()
}));

//题库管理页面单元测试
describe('题库管理页面组件测试', ()=>{
/**
	 * 每个测试前的设置
	 */
	beforeEach(() => {
		// 清除所有模拟
		vi.clearAllMocks();
	});

/**
 * 测试基本元素渲染
 */
it('应该正确渲染题库页面的基本元素', async () => {
    
     render(bankPage);
 
    // 检查搜索题库输入框是否渲染
    expect(screen.getByPlaceholderText('请输入题库名/标签')).toBeInTheDocument();

    // 检查批量删除按钮是否渲染
    expect(screen.getByRole('button', { name: /批量删除/i })).toBeInTheDocument(); 
    // 检查批量取消选中按钮是否渲染
    expect(screen.getByRole('button', { name: /取消选中/i })).toBeInTheDocument(); 
    //检测添加题库文本是否存在
    expect(screen.getByRole('button', { name: /点击此处添加题库/i })).toBeInTheDocument(); 
    //检测添加题库图片是否存在

    const imgElement = document.querySelector('img[src="/programming_question_bank/icons/big_add.svg"]')
     expect(imgElement).toBeInTheDocument()
});

/**
 * 测试获取题库列表网络错误
 */
it('获取题库列表网络错误', async () => {
  
	// 模拟HTTP错误响应
		global.fetch = vi.fn().mockResolvedValue({
			ok: false,
			status: 500
		});

     render(bankPage);

      //等待toast报错
    await waitFor(() => {
    expect(screen.getByText('获取题库列表失败: 网络错误')).toBeInTheDocument();
  });
});


/**
 * 测试获取题库列表HTTP错误响应
 */
it('获取题库列表正确处理HTTP错误', async () => {
  
	// 模拟HTTP错误响应
		global.fetch = vi.fn().mockResolvedValue({
			ok: false,
			status: 500
		});

     render(bankPage);

      //等待toast报错
    await waitFor(() => {
    expect(screen.getByText('获取题库列表失败:HTTP错误')).toBeInTheDocument();
  });
});

/**
	 * 测试获取题库列表网络错误响应
	 */
	it('获取题库列表正确处理网络错误', async () => {
		// 模拟网络错误
		global.fetch = vi.fn().mockRejectedValue(new Error('网络连接失败'));

	 render(bankPage);
 //等待toast报错
    await waitFor(() => {
    expect(screen.getByText('获取题库列表失败:网络连接失败')).toBeInTheDocument();
	});
  });

  









})