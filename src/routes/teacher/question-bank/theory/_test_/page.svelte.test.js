import {beforeEach, describe, expect, it, vi} from 'vitest';
import { tick } from 'svelte';
import userEvent from '@testing-library/user-event';
import {fireEvent, render, screen, waitFor} from '@testing-library/svelte';
import bankPage from  '../+page.svelte'
import { goto } from '$app/navigation';
import * as ToastModule from '$lib/components/Toast/Toast.js';
import BankCard from '../../_components/bankCard.svelte';
// 模拟导航函数
vi.mock('$app/navigation', () => ({
  goto: vi.fn(), // 模拟 goto 方法
  preloadCode: vi.fn(), 
  invalidate: vi.fn(),
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
 * 测试获取题库列表后端错误响应
 */
it('获取题库列表正确处理后端错误', async () => {
  

		global.fetch = vi.fn().mockResolvedValue({
			ok: true,
      json: async () => ({
		  status: -1,
        msg: "后端错误消息",
      }),
		});

     render(bankPage);

      //等待toast报错
    await waitFor(() => {
    expect(screen.getByText('获取题库列表失败:后端错误消息')).toBeInTheDocument();
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
  // mock获取题库列表api返回数据
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

  // 是否成功渲染获取的题库 
  expect(await screen.findByText('无标签题库')).toBeInTheDocument();
  expect(await screen.findByText('有标签题库')).toBeInTheDocument();
  expect(await screen.findByTitle('go')).toBeInTheDocument();
  expect(screen.getAllByPlaceholderText('+标签')).toHaveLength(3);
  const imgElement = document.querySelector('img[src="/programming_question_bank/icons/check_mark.svg"]');
  expect(imgElement).toBeInTheDocument();
});

/**
 * 测试新增题库HTTP错误响应
 */
it('新增题库处理正确处理HTTP错误', async () => {
  // 模拟fetch
  global.fetch = vi.fn(async (url, options) => {
    const method = options?.method || 'GET';
 
    if (url.includes('/api/question-banks') && method === 'GET') {
      return Promise.resolve({ 
        ok: true, 
        json: () => Promise.resolve({  
          status: 0,
          msg: "success",
          rowCount: 0,
          data: null,
        }) 
      });
    }
 
    // 模拟POST请求返回HTTP错误
    if (url.includes('/api/question-banks') && method === 'POST') {
      return Promise.resolve({ 
        ok: false,
        status: 500,
        json: () => Promise.resolve({ 
          status: 500,
          msg: "Internal Server Error"
        }) 
      });
    }
 

  });
 

  render(bankPage);
 
  // 找到并点击新增按钮（假设按钮文本是"新增题库"）
  const addButton = screen.getByText('点击此处添加题库'); // 根据实际按钮文本调整
  fireEvent.click(addButton);
 
  // 等待错误提示出现
  await waitFor(() => {
    // 根据实际toast显示文本调整
    expect(screen.getByText('新建题库失败:HTTP错误')).toBeInTheDocument();
  });
 
  // 验证fetch被调用
  expect(fetch).toHaveBeenCalledWith(
    '/api/question-banks',
    expect.objectContaining({
      method: 'POST'
    })
  );
});

/**
 * 测试新增题库网络错误响应
 */
it('新增题库处理正确处理网络错误', async () => {
  // 模拟fetch
  global.fetch = vi.fn(async (url, options) => {
    const method = options?.method || 'GET';
 
    if (url.includes('/api/question-banks') && method === 'GET') {
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
 
    // 模拟POST请求返回网络错误
    if (url.includes('/api/question-banks') && method === 'POST') {
    return Promise.reject(new Error('网络连接失败'));
    }
 

  });
 

  render(bankPage);
 
  // 找到并点击新增按钮
  const addButton = screen.getByText('点击此处添加题库'); // 根据实际按钮文本调整
  fireEvent.click(addButton);
 
  // 等待错误提示出现
  await waitFor(() => {
    // 根据实际toast显示文本调整
    expect(screen.getByText('新建题库失败:网络连接失败')).toBeInTheDocument();
  });
 
  // 验证fetch被调用
  expect(fetch).toHaveBeenCalledWith(
    '/api/question-banks',
    expect.objectContaining({
      method: 'POST'
    })
  );
});


/**
 * 测试新增题库后端错误响应
 */
it('新增题库处理后端错误', async () => {
  // 模拟fetch
  global.fetch = vi.fn(async (url, options) => {
    const method = options?.method || 'GET';
 
    if (url.includes('/api/question-banks') && method === 'GET') {
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
 
    // 模拟POST请求返回后端错误
    if (url.includes('/api/question-banks') && method === 'POST') {
   return Promise.resolve({ 
        ok: true,
        status: 500,
        json: () => Promise.resolve({ 
          status: -1,
          msg: "后端错误",
          data:[],
        }) 
      });
    }
 

  });
 

  render(bankPage);
 
  // 找到并点击新增按钮
  const addButton = screen.getByText('点击此处添加题库'); // 根据实际按钮文本调整
  fireEvent.click(addButton);
 
  // 等待错误提示出现
  await waitFor(() => {
    // 根据实际toast显示文本调整
    expect(screen.getByText('新建题库失败:后端错误')).toBeInTheDocument();
  });
 
  // 验证fetch被调用
  expect(fetch).toHaveBeenCalledWith(
    '/api/question-banks',
    expect.objectContaining({
      method: 'POST'
    })
  );
});

/**
 * 测试新增题库成功响应
 */
it('新增题库处理成功响应', async () => {
  global.fetch = vi.fn(async (url, options) => {
    const method = options?.method || 'GET';

    if (url.includes('/api/question-banks') && method === 'GET') {
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

    // 模拟POST请求返回后端信息
    if (url.includes('/api/question-banks') && method === 'POST') {
      return Promise.resolve({
        ok: true,
        status: 0,
        json: () => Promise.resolve({
          status: 0,
          msg: "success",
          data: {
            ID: 55,
            Type: "00",
            Name: "未命名题库",
            Tags: [],
            Creator: 1000
          }
        })
      });
    }
  });

  render(bankPage);

  // 找到“添加题库”按钮并点击（根据你的页面结构，按钮在 BankCard type="add" 里，文本为“点击此处添加题库”）
  const addBtn = await screen.findByText('点击此处添加题库');
  await fireEvent.click(addBtn);

  // 断言跳转路径
expect(goto).toHaveBeenCalledWith(expect.stringContaining('editBank?bankID=55'));
});


/**
 * 跳转编辑题库
 */
it('跳转编辑处理成功响应', async () => {
  // 模拟 localStorage
    const setItemSpy = vi.fn();
    Object.defineProperty(window, 'localStorage', {
      value: {
        setItem: setItemSpy,
        // 其他方法按需添加
      },
      writable: true,
    });

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
          data: [
          {ID: 11,
            Type: "00",
            Name: "有标签题库",
            Tags: ["go"],
            Creator: 1000,
            CreateTime: 1754114107180,
            UpdateTime: 1754114107180,},
          ],
        }) 
      });
    }
 
  });
 

  render(bankPage);
 
      
  
  const cardContainer = await screen.findByTitle('有标签题库'); // 建议添加 data-testid
  // 如果没有 data-testid，可以用其他选择器：

 
  
  await fireEvent.mouseEnter(cardContainer);
 
    const editButton = await screen.getByText('编辑');
  await fireEvent.click(editButton);
 

    // 验证导航被调用
    expect(goto).toHaveBeenCalledWith(expect.stringContaining('editBank?bankID=11'));
   
  
});


it('批量删除题库失败时弹出错误提示', async () => {
  // mock toast
  const errorSpy = vi.spyOn(ToastModule.toast, 'error');
  // mock fetch
  global.fetch = vi.fn(async (url, options) => {
    const method = options?.method || 'GET';
    if (url.includes('/api/question-banks') && method === 'GET') {
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve({
          status: 0,
          msg: "success",
          rowCount: 1,
          data: [
            { ID: 1, Name: "题库A", Tags: [], CreateTime: "", UpdateTime: "" }
          ]
        })
      });
    }
    if (url.includes('/api/question-banks') && method === 'DELETE') {
      // 返回失败
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve({
          status: 1,
          msg: "删除失败"
        })
      });
    }
  });

  render(bankPage);

  // 选中题库
  const card = await screen.findByText('题库A');
  await fireEvent.click(card);

  // 点击批量删除按钮
  const deleteBtn = screen.getByText('批量删除');
  await fireEvent.click(deleteBtn);

  // 等待弹窗出现并点击“确定”按钮
  const confirmBtn = await screen.findByText('确定');
  await fireEvent.click(confirmBtn);

  // 等待 toast.error 被调用
  await waitFor(() => {
    expect(errorSpy).toHaveBeenCalledWith(expect.stringContaining('删除题库失败:删除失败'));
  });
});


it('批量删除题库失败时弹出HTTP错误提示', async () => {
  // mock toast
  const errorSpy = vi.spyOn(ToastModule.toast, 'error');
  // mock fetch
  global.fetch = vi.fn(async (url, options) => {
    const method = options?.method || 'GET';
    if (url.includes('/api/question-banks') && method === 'GET') {
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve({
          status: 0,
          msg: "success",
          rowCount: 1,
          data: [
            { ID: 1, Name: "题库A", Tags: [], CreateTime: "", UpdateTime: "" }
          ]
        })
      });
    }
    if (url.includes('/api/question-banks') && method === 'DELETE') {
      // 返回失败
      return Promise.resolve({
        ok: false,
        json: () => Promise.resolve({
          status: 1,
          msg: "删除失败"
        })
      });
    }
  });

  render(bankPage);

  // 选中题库
  const card = await screen.findByText('题库A');
  await fireEvent.click(card);

  // 点击批量删除按钮
  const deleteBtn = screen.getByText('批量删除');
  await fireEvent.click(deleteBtn);

  // 等待弹窗出现并点击“确定”按钮
  const confirmBtn = await screen.findByText('确定');
  await fireEvent.click(confirmBtn);

  // 等待 toast.error 被调用
  await waitFor(() => {
    expect(errorSpy).toHaveBeenCalledWith(expect.stringContaining('删除题库失败:HTTP'));
  });
});
it('批量删除题库成功时弹出成功提示', async () => {
  // mock toast
  const successSpy = vi.spyOn(ToastModule.toast, 'success');

  // mock fetch
  global.fetch = vi.fn(async (url, options) => {
    const method = options?.method || 'GET';
    if (url.includes('/api/question-banks') && method === 'GET') {
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve({
          status: 0,
          msg: "success",
          rowCount: 1,
          data: [
            { ID: 1, Name: "题库A", Tags: [], CreateTime: "", UpdateTime: "" }
          ]
        })
      });
    }
    if (url.includes('/api/question-banks') && method === 'DELETE') {
      // 返回成功
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve({
          status: 0,
          msg: "删除成功"
        })
      });
    }
  });

  render(bankPage);
expect(await screen.findByText('题库A')).toBeInTheDocument();
  // 选中题库
  const img = screen.getByAltText('选中');

 await fireEvent.click(img); // 选中题库
 

  // 点击批量删除按钮
  const deleteBtn = screen.getByText('批量删除');
  await fireEvent.click(deleteBtn);
const disbtn = screen.getAllByRole('button', { name: '取消' });
const disbtn1=disbtn[disbtn.length - 1];
  await fireEvent.click(disbtn1);
    await fireEvent.click(deleteBtn);
  // 等待弹窗出现并点击“确定”按钮
const button = screen.getAllByRole('button', { name: '确定' });
const confirmBtn = button[button.length - 1]; // 获取最后一个“确定”按钮
expect(confirmBtn).toBeInTheDocument();
  await fireEvent.click(confirmBtn);


});

it('选中题库与取消选中测试', async () => {
  // mock fetch 返回一个题库
  global.fetch = vi.fn().mockResolvedValue({
    ok: true,
    json: async () => ({
      status: 0,
      msg: "success",
      rowCount: 1,
      data: [
        { ID: 101, Name: "题库X", Tags: [], CreateTime: "", UpdateTime: "" }
      ]
    }),
  });

  await render(bankPage);
  expect(await screen.findByText('题库X')).toBeInTheDocument();
  // 等待题库渲染
  const img = screen.getByAltText('选中');

 await fireEvent.click(img); // 选中题库
   await fireEvent.click(img);// 取消选中
    await fireEvent.click(img); // 选中题库
    const img1 = screen.getByAltText('取消选中');
     await fireEvent.click(img1); // 取消题库
});



it('题库名字修改', async () => {
  const user = userEvent.setup();
  // Mock fetch
  global.fetch = vi.fn().mockResolvedValue({
    ok: true,
    json: async () => ({
      status: 0,
      msg: "success",
      rowCount: 1,
      data: [{ ID: 101, Name: "题库X" }]
    }),
  });
 
  await render(bankPage);
  const input = await screen.findByPlaceholderText('在此输入题库名称'); // 改用 screen 方法
 
  // 1. 检查初始状态
  expect(input).toHaveValue('题库X');
  expect(input).toHaveAttribute('title', '题库X');
 
  // 2. 修改题库名称
  fireEvent.input(input, { target: { value: '新题库名称' } });
  await tick(); // 等待 Svelte 更新
  expect(input).toHaveValue('新题库名称');
 
  // 3. 触发“放弃修改”按钮显示
const bankCard =  document.querySelector('.bank-normal-card');
  fireEvent.mouseOver(bankCard);
  const discardButton = await screen.findByText('放弃修改'); // 确保按钮出现
   const emptyInputs = screen.getAllByPlaceholderText('+标签');
  const newTagInput = emptyInputs[0]; // 取最后一个空输入框

  // 添加新标签
  await user.type(newTagInput, '新标签');
  await user.keyboard('{Enter}');
 

  expect(await screen.findByTitle('新标签')).toBeInTheDocument();
 

  const updatedInputs = screen.getAllByPlaceholderText('+标签');
  const newTagElement = updatedInputs.find(input => input.value === '新标签');
  expect(newTagElement).toBeInTheDocument();
  // 4. 点击“放弃修改”，验证按钮消失
  fireEvent.click(discardButton);
    await tick();

 
  fireEvent.mouseLeave(bankCard); // 触发鼠标移入以显示按钮
  await tick();
 expect(screen.queryByText('题库X')).toBeInTheDocument();
});

it('题库标签调用', async () => {
  const user = userEvent.setup();
  global.fetch = vi.fn().mockResolvedValue({
    ok: true,
    json: async () => ({
      status: 0,
      msg: "success",
      rowCount: 1,
      data: [{ ID: 101, Name: "题库X", Tags: ["1"], CreateTime: "", UpdateTime: "" }]
    }),
  });
 
  await render(bankPage);
  expect(await screen.findByText('题库X')).toBeInTheDocument();
 
  // 方法1：通过title属性查找标签输入框（更可靠）
  const tagInputs = screen.getAllByTitle('1'); // 先获取现有标签
  expect(tagInputs.length).toBe(1); // 初始应该只有1个标签
 
  // 找到空的标签输入框（通过placeholder）
  const emptyInputs = screen.getAllByPlaceholderText('+标签');
  const newTagInput = emptyInputs[0]; // 取最后一个空输入框

  // 添加新标签
  await user.type(newTagInput, '新标签');
  await user.keyboard('{Enter}');
 

  expect(await screen.findByTitle('新标签')).toBeInTheDocument();
 

  const updatedInputs = screen.getAllByPlaceholderText('+标签');
  const newTagElement = updatedInputs.find(input => input.value === '新标签');
  expect(newTagElement).toBeInTheDocument();
 
  // 编辑现有标签
  const existingTagInput = screen.getByDisplayValue('1'); // 获取值为"1"的输入框
  await user.clear(existingTagInput);
  await user.type(existingTagInput, '修改后的标签');
  await user.keyboard('{Enter}');
 
  // 验证编辑后的标签
  expect(await screen.findByTitle('修改后的标签')).toBeInTheDocument();
  // 或者检查输入框的值
  expect(screen.getByDisplayValue('修改后的标签')).toBeInTheDocument();  
 await fireEvent.mouseOver(existingTagInput);
expect(await document.querySelector('.tag__clear-btn'));
 const disbtn =document.querySelector('.tag__clear-btn');

 await fireEvent.click(disbtn);
  expect(screen.queryByTitle('修改后的标签')).not.toBeInTheDocument();
});


});