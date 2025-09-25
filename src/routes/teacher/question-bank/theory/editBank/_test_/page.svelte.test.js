import { beforeEach, describe, expect, it, vi } from 'vitest';
import { act, getByText, render, screen ,waitFor,fireEvent,within} from '@testing-library/svelte';
import BankPage from '../+page.svelte';
import { goto } from '$app/navigation';
import { AddNewQuestion } from '../+page.svelte';
import { setResponse } from '@sveltejs/kit/node';
import userEvent from '@testing-library/user-event';
import { tick } from 'svelte';
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
     delete window.location;
  window.location = {
    ...window.location,
    search: '?bankID=123', // 确保测试用例正确设置
  };
   
  })
//测试能否渲染题库基本信息
it('应该正确渲染题库页面的基本元素', async () => {
    
  // 模拟fetch
  global.fetch = vi.fn(async (url, options) => {
    const method = options?.method || 'GET';
 
    if (url.includes('/api/question-banks') && method === 'GET') {
      return Promise.resolve({ 
        ok: true, 
        json: () => Promise.resolve({  
          status: 0,
          msg: "success",
          rowCount: 1,
          data: [{
            ID:123,
            Name:"测试题库",
            Type:"00",
            Tags:["测试标签"],
              QuestionTags: [
              "题目标签"
            ],
              CreateTime: 1755139059430,
            UpdateTime: 1755749603215,
            QuestionCount: 0,
          },],
        }) 
      });
    }
 
    // 模拟POST请求返回网络错误
    if (url.includes('/api/questions') && method === 'GET') {
     return Promise.resolve({ 
        ok: true, 
        json: () => Promise.resolve({  
          status: 0,
          msg: "success",
          rowCount: 0,
          data: [],
        }) 
      });
    }
 

  });

     render(BankPage);
   expect(fetch).toHaveBeenCalledWith(
    expect.stringContaining('bankID=123'), // 检查 URL 参数
    expect.objectContaining({ method: 'GET', credentials: 'include' })
  );
  expect(screen.findByText("测试题库"));
   expect(screen.findByText("题型"));
   expect(screen.findByText("试题列表"))
  expect(screen.findByText("试题筛选"))
    expect(screen.findByText("题型"))
      expect(screen.findByText("难度"))
 expect(screen.findByText("标签"))
 expect(screen.findByText("单选"))
 expect(screen.findByText("多选"))
 expect(screen.findByText("判断"))
  expect(screen.findByText("填空"))
    expect(screen.findByText("简答"))
      expect(screen.findByText("简单"))
        expect(screen.findByText("中等"))
          expect(screen.findByText("困难"))
            expect(screen.findByText("暂无题库数据"))
         expect(screen.findByText("题目标签"))
               expect(screen.findByText("   更新时间：2025/8/21 12:13:23"))
                expect(screen.findByText("创建时间：2025/8/14 10:37:39"))
});

/**
 * 测试获取题库信息HTTP错误响应
 */
it('获取题库正确处理HTTP错误', async () => {

  global.fetch = vi.fn(async (url, options) => {
    const method = options?.method || 'GET';
 
    if (url.includes('/api/question-banks') && method === 'GET') {
      return Promise.resolve({ 
        ok: false, 
        json: () => Promise.resolve({  
          status: 0,
          msg: "success",
          rowCount: 1,
          data: [{
            ID:123,
            Name:"测试题库",
            Type:"00",
            Tags:["测试标签"],
              CreateTime: 1755139059430,
            UpdateTime: 1755749603215,
            QuestionCount: 0,
          },],
        }) 
      });
    }
 
    // 模拟POST请求返回网络错误
    if (url.includes('/api/questions') && method === 'GET') {
     return Promise.resolve({ 
        ok: true, 
        json: () => Promise.resolve({  
          status: 0,
          msg: "success",
          rowCount: 0,
          data: [],
        }) 
      });
    }
 

  });

 
    await render(BankPage);

      //等待toast报错
    await waitFor(() => {
    expect(screen.getByText('获取题库信息失败:HTTP错误')).toBeInTheDocument();
  });
});


/**
 * 测试获取题库信息网络错误响应
 */
it('获取题库信息处理网络错误', async () => {

		global.fetch = vi.fn().mockRejectedValue(new Error('网络连接失败'));
    await render(BankPage);

      //等待toast报错
    await waitFor(() => {
    expect(screen.getByText('获取题库信息失败:网络连接失败')).toBeInTheDocument();
  });
});

/**
 * 测试获取题库后端错误响应
 */
it('获取题库正确处理后端错误', async () => {
  

global.fetch = vi.fn(async (url, options) => {
    const method = options?.method || 'GET';
 
    if (url.includes('/api/question-banks') && method === 'GET') {
      return Promise.resolve({ 
        ok: true, 
        json: () => Promise.resolve({  
          status: -1,
          msg: "后端错误消息",
          rowCount: 0,
          data: [],
        }) 
      });
    }
 
    // 模拟POST请求返回网络错误
    if (url.includes('/api/questions') && method === 'GET') {
     return Promise.resolve({ 
        ok: true, 
        json: () => Promise.resolve({  
          status: 0,
          msg: "success",
          rowCount: 0,
          data: [],
        }) 
      });
    }
 

  });

     render(BankPage);

      //等待toast报错
    await waitFor(() => {
    expect(screen.getByText('获取题库信息失败:后端错误消息')).toBeInTheDocument();
  });
});

/**
 * 测试获取题目HTTP错误响应
 */


it('获取题目HTTP错误响应', async () => {
    
  // 模拟fetch
  global.fetch = vi.fn(async (url, options) => {
    const method = options?.method || 'GET';
 
    if (url.includes('/api/question-banks') && method === 'GET') {
      return Promise.resolve({ 
        ok: true, 
        json: () => Promise.resolve({  
          status: 0,
          msg: "success",
          rowCount: 1,
          data: [{
            ID:123,
            Name:"测试题库",
            Type:"00",
            Tags:["测试标签"],
              QuestionTags: [
              "题目标签"
            ],
              CreateTime: 1755139059430,
            UpdateTime: 1755749603215,
            QuestionCount: 0,
          },],
        }) 
      });
    }
 
    // 模拟POST请求返回HTTP错误
    if (url.includes('/api/questions') && method === 'GET') {
     return Promise.resolve({ 
        ok: false, 
        json: () => Promise.resolve({  
          status: 0,
          msg: "success",
          rowCount: 0,
          data: [],
        }) 
      });
    }
 

  });

     render(BankPage);
   await waitFor(()=>{
     expect(screen.findByText("获取题目失败:HTTP错误"));
   })

});


/**
 * 测试获取题目后端错误响应
 */


it('获取题目HTTP错误响应', async () => {
    
  // 模拟fetch
  global.fetch = vi.fn(async (url, options) => {
    const method = options?.method || 'GET';
 
    if (url.includes('/api/question-banks') && method === 'GET') {
      return Promise.resolve({ 
        ok: true, 
        json: () => Promise.resolve({  
          status: 0,
          msg: "success",
          rowCount: 1,
          data: [{
            ID:123,
            Name:"测试题库",
            Type:"00",
            Tags:["测试标签"],
              QuestionTags: [
              "题目标签"
            ],
              CreateTime: 1755139059430,
            UpdateTime: 1755749603215,
            QuestionCount: 0,
          },],
        }) 
      });
    }
 
    // 模拟POST请求返回HTTP错误
    if (url.includes('/api/questions') && method === 'GET') {
     return Promise.resolve({ 
        ok: true, 
        json: () => Promise.resolve({  
          status: -1,
          msg: "后端错误消息",
          rowCount: 0,
          data: [],
        }) 
      });
    }
 

  });

     render(BankPage);
   await waitFor(()=>{
     expect(screen.findByText("获取题目失败:后端错误消息"));
   })

});

/**
 * 测试获取题目网络错误响应
 */


it('获取题目网络错误响应', async () => {
    
  // 模拟fetch
  global.fetch = vi.fn(async (url, options) => {
    const method = options?.method || 'GET';
 
    if (url.includes('/api/question-banks') && method === 'GET') {
      return Promise.resolve({ 
        ok: true, 
        json: () => Promise.resolve({  
          status: 0,
          msg: "success",
          rowCount: 1,
          data: [{
            ID:123,
            Name:"测试题库",
            Type:"00",
            Tags:["测试标签"],
              QuestionTags: [
              "题目标签"
            ],
              CreateTime: 1755139059430,
            UpdateTime: 1755749603215,
            QuestionCount: 0,
          },],
        }) 
      });
    }
 
    // 模拟POST请求返回HTTP错误
    if (url.includes('/api/questions') && method === 'GET') {
      return Promise.reject(new Error('网络连接失败'));
    }
 

  });

     render(BankPage);
   await waitFor(()=>{
     expect(screen.findByText("获取题目失败:网络错误"));
   })

});

/**
 * 测试获取题目成功响应
 */
it('获取题目正确响应', async () => {
  
 global.fetch = vi.fn(async (url, options) => {
    const method = options?.method || 'GET';
 
    if (url.includes('/api/question-banks') && method === 'GET') {
      return Promise.resolve({ 
        ok: true, 
        json: () => Promise.resolve({  
          status: 0,
          msg: "success",
          rowCount: 1,
          data: [{
            ID:123,
            Name:"测试题库",
            Type:"00",
            Tags:["测试标签"],
              QuestionTags: [
              "题目标签"
            ],
              CreateTime: 1755139059430,
            UpdateTime: 1755749603215,
            QuestionCount: 0,
          },],
        }) 
      });
    }
 
  
    if (url.includes('/api/questions') && method === 'GET') {
     return Promise.resolve({ 
        ok: true, 
        json: () => Promise.resolve({  
          status: 0,
          msg: "success",
          rowCount: 0,
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
        }) 
      });
    }
 

  });
	
   await  render(BankPage);


 
  //查看题目是否都被渲染
await( screen.findByText('单选题测试'));
await( screen.findByText('多选题测试'));
await( screen.findByText('判断题测试'));
});


 

//模拟修改题库名称及标签测试
  it('模拟修改题库名称及标签测试', async () => {
    const user = userEvent.setup();
// 模拟fetch
  global.fetch = vi.fn(async (url, options) => {
    const method = options?.method || 'GET';
 
    if (url.includes('/api/question-banks') && method === 'GET') {
      return Promise.resolve({ 
        ok: true, 
        json: () => Promise.resolve({  
          status: 0,
          msg: "success",
          rowCount: 1,
          data: [{
            ID:123,
            Name:"测试题库",
            Type:"00",
            Tags:["测试标签"],
              QuestionTags: [
              "题目标签"
            ],
              CreateTime: 1755139059430,
            UpdateTime: 1755749603215,
            QuestionCount: 0,
          },],
        }) 
      });
    }
 
    // 模拟POST请求返回网络错误
    if (url.includes('/api/questions') && method === 'GET') {
     return Promise.resolve({ 
        ok: true, 
        json: () => Promise.resolve({  
          status: 0,
          msg: "success",
          rowCount: 0,
          data: [],
        }) 
      });
    }
 

  });

     await render(BankPage);
    await expect(screen.findByText("测试题库"))
 const bankinput = await screen.findByPlaceholderText('请输入题库名称'); // 改用 screen 方法
 
  // 1. 检查初始状态
  await expect(bankinput).toHaveValue('测试题库');
 
  fireEvent.input(bankinput, { target: { value: '新的题库名称' } });
  await tick();
   await expect(screen.findByText("新的题库名称"))

await waitFor(() => expect(bankinput).toHaveValue('新的题库名称'));

  await expect(screen.findByText("保存"));
    await expect(screen.findByText("放弃"));
    const disBtn=screen.findByText("放弃");
     const confirmBtn=screen.findByText("保存");
     await fireEvent.click(disBtn);
 await expect(bankinput).toHaveValue('测试题库');
});



it('点击"单选"按钮应该显示单选题编辑面板', async () => {

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
  });
   render(BankPage);
    
    // 初始状态不应该显示编辑面板
    expect(screen.queryByText('新增单选题')).toBeNull();
    
  // 1. 打开下拉菜单
   fireEvent.click(screen.getByText('添加题目'));
    fireEvent.click(screen.getByText('单选'));
   
  });
 
  it('点击"多选"按钮应该显示多选题编辑面板', async () => {
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
      });await page.getByRole('option', { name: '单选' }).click();
    }
  });
   render(BankPage);
    
    // 初始状态不应该显示编辑面板
    expect(screen.queryByText('新增多选题')).toBeNull();
    
  // 1. 打开下拉菜单
   fireEvent.click(screen.getByText('添加题目'));
    fireEvent.click(screen.getByText('多选'));
   
  });
 
  it('点击"判断"按钮应该显示判断题编辑面板', async () => {
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
  });
   render(BankPage);
    
    // 初始状态不应该显示编辑面板
    expect(screen.queryByText('新增判断题')).toBeNull();
    
  // 1. 打开下拉菜单
   fireEvent.click(screen.getByText('添加题目'));
    fireEvent.click(screen.getByText('判断'));
   
  });




});




