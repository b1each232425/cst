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

/**
	 * 成功获取题库列表数据
	 */
	it('成功获取题库列表并渲染', async () => {
		  //mock获取题库列表api返回数据
	global.fetch = vi.fn().mockResolvedValue({
     ok: true,
      json: async () => ({
        status: 0,
        msg: "success",
        rowCount: 2,
        data: [
          {
            ID: 10,
            Type: "00",
            Name: "无标签题库",
            Tags: [],
            Creator: 1000,
            CreateTime: 1754114107180,
            UpdateTime: 1754114107180,
          },
          {
            ID: 11,
            Type: "00",
            Name: "有标签题库",
            Tags: ["go"],
            Creator: 1000,
            CreateTime: 1754114107180,
            UpdateTime: 1754114107180,
          }
        ]
      }),
    });

	 render(bankPage);
    //toast是否显示成功
    await waitFor(() => {
    expect(screen.getByText('获取题库列表成功')).toBeInTheDocument();
	});

 //是否成功渲染获取的题库 
 expect(screen.getByText('无标签题库')).toBeInTheDocument();
 expect(screen.getByText('有标签题库')).toBeInTheDocument();
expect(screen.getByTitle('go')).toBeInTheDocument();
 expect(screen.getAllByPlaceholderText('+标签')).toHaveLength(3)
   const imgElement = document.querySelector('img[src="/programming_question_bank/icons/check_mark.svg"]')
   expect(imgElement).toBeInTheDocument()
  });












})