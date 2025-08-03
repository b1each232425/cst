import { beforeEach, describe, expect, it, vi } from 'vitest';
import { act, getByText, render, screen ,waitFor,fireEvent} from '@testing-library/svelte';
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

/**
 * 测试获取题目成功响应
 */
it('获取题目正确响应', async () => {
  

		global.fetch = vi.fn().mockResolvedValue({
			ok: true,
      json: async () => ({
		  status: 0,
      msg: "success",
      rowCount:3,
      data:[{
            ID: 24,
            Type: "00",
            Content: "\u003cp\u003e\u003cspan style=\"font-size: 12pt\"\u003e单选题测试\u003c/span\u003e\u003c/p\u003e",
            Options: [
                {
                    label: "A",
                    value: "\u003cp\u003e\u003cspan style=\"font-size: 12pt\"\u003e2\u003c/span\u003e\u003c/p\u003e"
                },
                {
                    label: "B",
                  value: "\u003cp\u003e\u003cspan style=\"font-size: 12pt\"\u003e2\u003c/span\u003e\u003c/p\u003e"
                },
                {
                    label: "C",
                    value: "\u003cp\u003e\u003cspan style=\"font-size: 12pt\"\u003e2\u003c/span\u003e\u003c/p\u003e"
                },
                {
                    "label": "D",
                    "value": "\u003cp\u003e\u003cspan style=\"font-size: 12pt\"\u003e2\u003c/span\u003e\u003c/p\u003e"
                }
            ],
            Answers: [
                "A"
            ],
            Score: 2,
          Difficulty: 1,
            Tags: [],

      }
      ,{
 ID: 24,
            Type: "02",
            Content: "\u003cp\u003e\u003cspan style=\"font-size: 12pt\"\u003e多选题测试\u003c/span\u003e\u003c/p\u003e",
            Options: [
                {
                    label: "A",
                    value: "\u003cp\u003e\u003cspan style=\"font-size: 12pt\"\u003e2\u003c/span\u003e\u003c/p\u003e"
                },
                {
                    label: "B",
                    value: "\u003cp\u003e\u003cspan style=\"font-size: 12pt\"\u003e2\u003c/span\u003e\u003c/p\u003e"
                },
                {
                    label: "C",
                    value: "\u003cp\u003e\u003cspan style=\"font-size: 12pt\"\u003e2\u003c/span\u003e\u003c/p\u003e"
                },
                {
                    label: "D",
                    value: "\u003cp\u003e\u003cspan style=\"font-size: 12pt\"\u003e2\u003c/span\u003e\u003c/p\u003e"
                }
            ],
            Answers: [
                "A"
            ],
            Score: 2,
          Difficulty: 2,
            Tags: [],

      } ,
    {
      Type: "04",
            Content: "\u003cp\u003e\u003cspan style=\"font-size: 12pt\"\u003e判断题测试\u003c/span\u003e\u003c/p\u003e",
          
                Options: [
                {
                    label: "A",
                    value: "对"
                },
                {
                    label: "B",
                    value: "错"
                }
            ],
            Answers: [
                "A"
            ],
            Score: 2,
          Difficulty: 3,
            Tags: [],
    }
    ],
      }),
		});

     render(BankPage);

      //等待toast成功
    await waitFor(() => {
    expect(screen.getByText('获取试题列表成功')).toBeInTheDocument();
  });

  //查看题目是否都被渲染
 expect(screen.getByText('单选题测试')).toBeInTheDocument();
 expect(screen.getByText('多选题测试')).toBeInTheDocument();
 expect(screen.getByText('判断题测试')).toBeInTheDocument();
});


 

//模拟修改题库信息测试
  it('模拟修改题库信息测试', async () => {
  
// 模拟fetch
  global.fetch = vi.fn(async (url, options) => {
    const method = options?.method || 'GET';
 
    if (url.includes('/api/questions') && method === 'GET') {
      return Promise.resolve({ 
        ok: true, 
        json: () => Promise.resolve({  
          status: 0,
          msg: "success",
          rowCount: 0,
          data: [] ,
        }) 
      });
    }
 

 if (url.includes('/api/question-banks') && method === 'PUT') {
      return Promise.resolve({ 
        ok: true, 
        json: () => Promise.resolve({  
          status: 0,
          msg: "success",
          rowCount: 0,
          data: [] ,
        }) 
      });
    }

  });
		

     render(BankPage);

      //等待toast成功
    await waitFor(() => {
    expect(screen.getByText('获取试题列表成功')).toBeInTheDocument();
  });

    const input = screen.getByPlaceholderText('请输入题库名');
    
    // 模拟输入
    fireEvent.input(input, { target: { value: '新题库名称' } });
    
    // 验证输入框值已改变
    expect(input).toHaveValue('新题库名称');
    
    // 验证保存按钮变为可见
    expect(screen.getByText('保存修改')).toBeVisible();
    expect(screen.getByText('放弃修改')).toBeVisible();
     const clearBtn = screen.getByAltText('cleanIputImg').parentElement;
    fireEvent.click(clearBtn);
    expect(input).toHaveValue('');
   expect(screen.getByText('保存修改')).toBeDefined();
    expect(screen.getByText('放弃修改')).toBeDefined();
    
  // 模拟输入
    fireEvent.input(input, { target: { value: '新题库名称' } });
    
    // 验证输入框值已改变
    expect(input).toHaveValue('新题库名称');
    
    // 验证保存按钮变为可见
    expect(screen.getByText('保存修改')).toBeVisible();
    expect(screen.getByText('放弃修改')).toBeVisible();
      fireEvent.click(screen.getByText('保存修改'));
        await waitFor(() => {
    expect(screen.getByText('题库数据保存成功')).toBeInTheDocument();
  });
    
});




});




