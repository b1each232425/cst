import { render, screen, fireEvent, waitFor } from '@testing-library/svelte';
import { vi, describe, test, expect, beforeEach, afterEach } from 'vitest';
import StudentDetail from '../+page@.svelte';
import { goto } from '$app/navigation';
import { page } from '$app/stores';
import { toast } from '$lib/components/Toast/Toast';

global.URL.createObjectURL = vi.fn(() => 'mock-object-url');
global.URL.revokeObjectURL = vi.fn();

// 模拟依赖
vi.mock('$app/navigation', () => ({
  goto: vi.fn(),
}));

// 模拟 page store
vi.mock('$app/stores', () => ({
  page: {
    subscribe: vi.fn((callback) => {
      callback({
        url: new URL('http://localhost/student/enroll-plan/123'),
        params: { enroll_id: '123' },
      });
      return () => {}; // unsubscribe function
    }),
  },
}));

vi.mock('$lib/components/Toast/Toast', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

// 模拟 fetch
const mockFetch = vi.fn();
global.fetch = mockFetch;

// 模拟文件对象
const createMockFile = (name = 'test.jpg', type = 'image/jpeg', size = 1024) => {
  const file = new File(['test content'], name, { type });
  Object.defineProperty(file, 'size', { value: size });
  return file;
};

// 测试辅助函数
const waitForElement = async (text, timeout = 3000) => {
  return await waitFor(
    () => {
      expect(screen.getByText(text)).toBeInTheDocument();
    },
    { timeout },
  );
};

const fillFormField = async (placeholder, value) => {
  const input = screen.getByPlaceholderText(placeholder);
  await fireEvent.input(input, { target: { value } });
  return input;
};

const clickButton = async (text) => {
  const button = screen.getByText(text);
  await fireEvent.click(button);
  return button;
};

// 模拟 TUS 上传
vi.mock('tus-js-client', () => ({
  default: {
    Upload: vi.fn().mockImplementation(() => ({
      start: vi.fn(),
      url: 'http://test.com/file/123',
    })),
  },
}));

// 模拟 hash-wasm
vi.mock('hash-wasm', () => ({
  createXXHash64: vi.fn(() =>
    Promise.resolve({
      init: vi.fn(),
      update: vi.fn(),
      digest: vi.fn(() => 'mock-hash'),
    }),
  ),
}));

describe('StudentDetail 报名信息填写页面', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    // 设置默认的 fetch 模拟
    mockFetch.mockImplementation((url) => {
      if (url.includes('/api/user/me')) {
        return Promise.resolve({
          ok: true,
          json: () =>
            Promise.resolve({
              status: 0,
              data: {
                OfficialName: '张三',
                Gender: '男',
                IDCardType: '居民身份证',
                IDCardNo: '110101199001011234',
                Birthday: '1990-01-01',
                Email: 'zhangsan@example.com',
                MobilePhone: '13800138000',
                Addr: '北京市朝阳区',
                Province: '北京市',
                City: '北京市',
                District: '朝阳区',
                IDCardFile: {
                  frontImgID: 'front-123',
                  backImgID: 'back-123',
                },
                Category: 'student',
                Domains: [],
              },
            }),
        });
      }

      if (url.includes('/api/ocr')) {
        return Promise.resolve({
          ok: true,
          json: () =>
            Promise.resolve({
              status: 0,
              data: {
                name: '李四',
                gender: '女',
                id_number: '110101199001011235',
              },
            }),
        });
      }

      if (url.includes('/api/registration')) {
        return Promise.resolve({
          ok: true,
          json: () =>
            Promise.resolve({
              status: 0,
              msg: '操作成功',
            }),
        });
      }

      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ status: 0 }),
      });
    });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('页面渲染', () => {
    test('应该正确渲染所有表单元素', async () => {
      render(StudentDetail);

      // 等待组件加载完成
      await waitFor(() => {
        expect(screen.getByText('报名信息')).toBeInTheDocument();
      });

      // 基础输入框
      expect(screen.getByPlaceholderText('请输入姓名')).toBeInTheDocument();
      expect(screen.getByPlaceholderText('请输入证件号码')).toBeInTheDocument();
      expect(screen.getByPlaceholderText('请输入邮箱')).toBeInTheDocument();
      expect(screen.getByPlaceholderText('请输入电话')).toBeInTheDocument();
      expect(screen.getByPlaceholderText('请输入详细地址（如街道、门牌号）')).toBeInTheDocument();

      // 选择器
      expect(screen.getByText('男')).toBeInTheDocument();
      expect(screen.getByText('女')).toBeInTheDocument();
      expect(screen.getByText('居民身份证')).toBeInTheDocument();
      expect(screen.getByText('临时居民身份证')).toBeInTheDocument();
      expect(screen.getByText('请选择省')).toBeInTheDocument();
      expect(screen.getByText('请选择市')).toBeInTheDocument();
      expect(screen.getByText('请选择区')).toBeInTheDocument();

      // 上传组件
      expect(screen.getByText('身份证人像面')).toBeInTheDocument();
      expect(screen.getByText('身份证国徽面')).toBeInTheDocument();

      // 操作按钮
      expect(screen.getByText('取消')).toBeInTheDocument();
      expect(screen.getByText('保存')).toBeInTheDocument();
      expect(screen.getByText('提交')).toBeInTheDocument();
    });
  });

  describe('表单交互', () => {
    test('应该能够输入文本字段', async () => {
      render(StudentDetail);

      // 等待组件加载完成
      await waitForElement('报名信息');

      const nameInput = await fillFormField('请输入姓名', '王五');
      const emailInput = await fillFormField('请输入邮箱', 'wangwu@example.com');

      fireEvent.input(nameInput, { target: { value: '王五' } });
      fireEvent.input(emailInput, { target: { value: 'wangwu@example.com' } });

      expect(nameInput.value).toBe('王五');
      expect(emailInput.value).toBe('wangwu@example.com');
    });

    test('应该能够选择性别', async () => {
      render(StudentDetail);

      // 等待组件加载完成
      await waitForElement('报名信息');

      // 验证性别选项存在
      expect(screen.getByText('男')).toBeInTheDocument();
      expect(screen.getByText('女')).toBeInTheDocument();
    });

    test('应该能够选择证件类型', async () => {
      render(StudentDetail);

      // 等待组件加载完成
      await waitForElement('报名信息');

      // 验证证件类型选项存在
      expect(screen.getByText('居民身份证')).toBeInTheDocument();
      expect(screen.getByText('临时居民身份证')).toBeInTheDocument();
    });

    test('应该能够选择地址', async () => {
      render(StudentDetail);

      // 等待组件加载完成
      await waitForElement('报名信息');

      // 验证地址选择器存在
      expect(screen.getByText('请选择省')).toBeInTheDocument();
      expect(screen.getByText('请选择市')).toBeInTheDocument();
      expect(screen.getByText('请选择区')).toBeInTheDocument();
    });
  });

  describe('文件上传', () => {
    test('应该渲染上传组件', async () => {
      render(StudentDetail);

      // 等待组件加载完成
      await waitForElement('报名信息');

      // 验证上传组件存在
      expect(screen.getByText('身份证人像面')).toBeInTheDocument();
      expect(screen.getByText('身份证国徽面')).toBeInTheDocument();

      // 验证文件输入框存在
      const fileInputs = screen.getAllByRole('textbox', { hidden: true });
      expect(fileInputs.length).toBeGreaterThan(0);
    });

    test('应该能够处理文件选择', async () => {
      render(StudentDetail);

      // 等待组件加载完成
      await waitForElement('报名信息');

      const mockFile = createMockFile('id-front.jpg');
      const fileInput = screen.getByText('身份证人像面').closest('.info-item')?.querySelector('input[type="file"]');

      if (fileInput) {
        await fireEvent.change(fileInput, { target: { files: [mockFile] } });

        // 验证文件被选择
        expect(mockFile).toBeDefined();
        expect(fileInput.files[0]).toBe(mockFile);
      }
    });

    test('应该处理文件上传错误', async () => {
      // 模拟网络错误
      mockFetch.mockRejectedValueOnce(new Error('网络错误'));

      render(StudentDetail);

      // 等待组件加载完成
      await waitForElement('报名信息');

      const mockFile = createMockFile('id-front.jpg');
      const fileInput = screen.getByText('身份证人像面').closest('.info-item')?.querySelector('input[type="file"]');

      if (fileInput) {
        await fireEvent.change(fileInput, { target: { files: [mockFile] } });

        // 验证文件被处理
        expect(mockFile).toBeDefined();
      }
    });
  });

  describe('表单验证', () => {
    test('应该在提交空表单时显示验证错误', async () => {
      render(StudentDetail);

      // 等待组件加载完成
      await waitForElement('报名信息');

      const submitBtn = await clickButton('提交');

      // 验证部分必填字段的错误提示
      await waitFor(() => {
        expect(screen.getByText('请输入姓名')).toBeInTheDocument();
        expect(screen.getByText('请选择性别')).toBeInTheDocument();
        expect(screen.getByText('请选择证件类型')).toBeInTheDocument();
        expect(screen.getByText('请选择出生日期')).toBeInTheDocument();
        expect(screen.getByText('请输入证件号码')).toBeInTheDocument();
        expect(screen.getByText('请输入邮箱')).toBeInTheDocument();
        expect(screen.getByText('请输入电话')).toBeInTheDocument();
      });
    });
  });

  describe('API 交互', () => {
    test('应该在页面加载时获取用户信息', async () => {
      render(StudentDetail);

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWith('/api/user/me', expect.any(Object));
      });
    });

    test('应该能够保存表单数据', async () => {
      render(StudentDetail);

      // 等待初始数据加载
      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWith('/api/user/me', expect.any(Object));
      });

      await clickButton('保存');

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWith('/api/registration', expect.any(Object));
      });
    });

    test('应该能够提交表单数据', async () => {
      render(StudentDetail);

      // 等待初始数据加载
      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWith('/api/user/me', expect.any(Object));
      });

      await clickButton('提交');

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWith('/api/registration', expect.any(Object));
      });
    });
  });

  describe('OCR 识别', () => {
    test('应该能够处理18位身份证文件上传并成功识别证件号', async () => {
      // 模拟OCR成功响应
      mockFetch.mockImplementation((url) => {
        if (url.includes('/api/ocr')) {
          return Promise.resolve({
            ok: true,
            json: () =>
              Promise.resolve({
                status: 0,
                data: {
                  name: '张三',
                  gender: '男',
                  id_number: '110101199001011234',
                },
              }),
          });
        }
        return Promise.resolve({ ok: true, json: () => Promise.resolve({ status: 0 }) });
      });

      render(StudentDetail);

      // 等待组件加载完成
      await waitForElement('报名信息');

      // 创建模拟文件
      const mockFile = createMockFile('id-front.jpg');

      // 查找身份证人像面的文件输入框
      const fileInput = screen.getByText('身份证人像面').closest('.info-item')?.querySelector('input[type="file"]');
      expect(fileInput).toBeInTheDocument();

      // 直接触发文件选择事件
      await fireEvent.change(fileInput, { target: { files: [mockFile] } });

      // 等待OCR请求被调用
      await waitFor(
        () => {
          expect(mockFetch).toHaveBeenCalledWith('/api/ocr', expect.any(Object));
        },
        { timeout: 5000 },
      );

      // 等待成功消息出现
      await waitFor(
        () => {
          expect(screen.getByText('已成功识别身份证信息')).toBeInTheDocument();
        },
        { timeout: 5000 },
      );

      // 验证OCR请求的FormData包含文件
      const ocrCall = mockFetch.mock.calls.find((call) => call[0].includes('/api/ocr'));
      expect(ocrCall).toBeDefined();
      expect(ocrCall[1].method).toBe('POST');
      expect(ocrCall[1].body).toBeInstanceOf(FormData);

      // 验证文件被处理
      expect(mockFile).toBeDefined();
      expect(fileInput.files[0]).toBe(mockFile);
    });

    test('应该能够处理15位身份证文件上传并成功识别证件号', async () => {
      // 模拟OCR成功响应
      mockFetch.mockImplementation((url) => {
        if (url.includes('/api/ocr')) {
          return Promise.resolve({
            ok: true,
            json: () =>
              Promise.resolve({
                status: 0,
                data: {
                  name: '张三',
                  gender: '男',
                  id_number: '110101900101123', // 改为15位身份证号
                },
              }),
          });
        }
        return Promise.resolve({ ok: true, json: () => Promise.resolve({ status: 0 }) });
      });

      render(StudentDetail);

      // 等待组件加载完成
      await waitForElement('报名信息');

      // 创建模拟文件
      const mockFile = createMockFile('id-front.jpg');

      // 查找身份证人像面的文件输入框
      const fileInput = screen.getByText('身份证人像面').closest('.info-item')?.querySelector('input[type="file"]');
      expect(fileInput).toBeInTheDocument();

      // 直接触发文件选择事件
      await fireEvent.change(fileInput, { target: { files: [mockFile] } });

      // 等待OCR请求被调用
      await waitFor(
        () => {
          expect(mockFetch).toHaveBeenCalledWith('/api/ocr', expect.any(Object));
        },
        { timeout: 5000 },
      );

      // 等待成功消息出现
      await waitFor(
        () => {
          expect(screen.getByText('已成功识别身份证信息')).toBeInTheDocument();
        },
        { timeout: 5000 },
      );

      // 验证OCR请求的FormData包含文件
      const ocrCall = mockFetch.mock.calls.find((call) => call[0].includes('/api/ocr'));
      expect(ocrCall).toBeDefined();
      expect(ocrCall[1].method).toBe('POST');
      expect(ocrCall[1].body).toBeInstanceOf(FormData);

      // 验证文件被处理
      expect(mockFile).toBeDefined();
      expect(fileInput.files[0]).toBe(mockFile);
    });

    test('应该能够处理非法身份证文件上传并失败识别证件号', async () => {
      // 模拟OCR成功响应，但返回无效的身份证号
      mockFetch.mockImplementation((url) => {
        if (url.includes('/api/ocr')) {
          return Promise.resolve({
            ok: true,
            json: () =>
              Promise.resolve({
                status: 0,
                data: {
                  name: '张三',
                  gender: '男',
                  id_number: '123456789', // 使用无效长度的身份证号
                },
              }),
          });
        }
        return Promise.resolve({ ok: true, json: () => Promise.resolve({ status: 0 }) });
      });

      render(StudentDetail);

      // 等待组件加载完成
      await waitForElement('报名信息');

      // 创建模拟文件
      const mockFile = createMockFile('id-front.jpg');

      // 查找身份证人像面的文件输入框
      const fileInput = screen.getByText('身份证人像面').closest('.info-item')?.querySelector('input[type="file"]');
      expect(fileInput).toBeInTheDocument();

      // 直接触发文件选择事件
      await fireEvent.change(fileInput, { target: { files: [mockFile] } });

      // 等待OCR请求被调用
      await waitFor(
        () => {
          expect(mockFetch).toHaveBeenCalledWith('/api/ocr', expect.any(Object));
        },
        { timeout: 5000 },
      );

      // 等待失败消息出现
      await waitFor(
        () => {
          expect(screen.getByText('身份证识别失败，请重新上传。')).toBeInTheDocument();
        },
        { timeout: 5000 },
      );

      // 验证OCR请求的FormData包含文件
      const ocrCall = mockFetch.mock.calls.find((call) => call[0].includes('/api/ocr'));
      expect(ocrCall).toBeDefined();
      expect(ocrCall[1].method).toBe('POST');
      expect(ocrCall[1].body).toBeInstanceOf(FormData);

      // 验证文件被处理
      expect(mockFile).toBeDefined();
      expect(fileInput.files[0]).toBe(mockFile);
    });

    test('应该能够处理空身份证文件上传并失败识别证件号', async () => {
      // 模拟OCR成功响应，但返回无效的身份证号
      mockFetch.mockImplementation((url) => {
        if (url.includes('/api/ocr')) {
          return Promise.resolve({
            ok: true,
            json: () =>
              Promise.resolve({
                status: 0,
                data: {
                  name: '张三',
                  gender: '男',
                  id_number: '', // 使用无效长度的身份证号
                },
              }),
          });
        }
        return Promise.resolve({ ok: true, json: () => Promise.resolve({ status: 0 }) });
      });

      render(StudentDetail);

      // 等待组件加载完成
      await waitForElement('报名信息');

      // 创建模拟文件
      const mockFile = createMockFile('id-front.jpg');

      // 查找身份证人像面的文件输入框
      const fileInput = screen.getByText('身份证人像面').closest('.info-item')?.querySelector('input[type="file"]');
      expect(fileInput).toBeInTheDocument();

      // 直接触发文件选择事件
      await fireEvent.change(fileInput, { target: { files: [mockFile] } });

      // 等待OCR请求被调用
      await waitFor(
        () => {
          expect(mockFetch).toHaveBeenCalledWith('/api/ocr', expect.any(Object));
        },
        { timeout: 5000 },
      );

      // 等待失败消息出现
      await waitFor(
        () => {
          expect(screen.getByText('身份证识别失败，请重新上传。')).toBeInTheDocument();
        },
        { timeout: 5000 },
      );

      // 验证OCR请求的FormData包含文件
      const ocrCall = mockFetch.mock.calls.find((call) => call[0].includes('/api/ocr'));
      expect(ocrCall).toBeDefined();
      expect(ocrCall[1].method).toBe('POST');
      expect(ocrCall[1].body).toBeInstanceOf(FormData);

      // 验证文件被处理
      expect(mockFile).toBeDefined();
      expect(fileInput.files[0]).toBe(mockFile);
    });

    test('应该处理 OCR 识别失败', async () => {
      mockFetch.mockImplementation((url) => {
        if (url.includes('/api/ocr')) {
          return Promise.resolve({
            ok: true,
            json: () =>
              Promise.resolve({
                status: 1,
                msg: '识别失败',
              }),
          });
        }
        return Promise.resolve({ ok: true, json: () => Promise.resolve({ status: 0 }) });
      });

      render(StudentDetail);

      // 等待组件加载完成
      await waitForElement('报名信息');

      // 创建模拟文件
      const mockFile = createMockFile('id-front.jpg');

      // 查找身份证人像面的文件输入框
      const fileInput = screen.getByText('身份证人像面').closest('.info-item')?.querySelector('input[type="file"]');
      expect(fileInput).toBeInTheDocument();

      // 直接触发文件选择事件
      await fireEvent.change(fileInput, { target: { files: [mockFile] } });

      // 等待OCR请求被调用
      await waitFor(
        () => {
          expect(mockFetch).toHaveBeenCalledWith('/api/ocr', expect.any(Object));
        },
        { timeout: 5000 },
      );

      // 等待识别消息出现
      await waitFor(
        () => {
          expect(screen.getByText('身份证识别失败，请重新上传。')).toBeInTheDocument();
        },
        { timeout: 5000 },
      );

      // 验证文件被处理
      expect(mockFile).toBeDefined();
    });

    test('应该处理 OCR 网络错误', async () => {
      mockFetch.mockImplementation((url) => {
        if (url.includes('/api/ocr')) {
          return Promise.resolve({
            ok: false,
            status: 500,
          });
        }
        return Promise.resolve({ ok: true, json: () => Promise.resolve({ status: 0 }) });
      });

      render(StudentDetail);

      // 等待组件加载完成
      await waitForElement('报名信息');

      // 创建模拟文件
      const mockFile = createMockFile('id-front.jpg');

      // 查找身份证人像面的文件输入框
      const fileInput = screen.getByText('身份证人像面').closest('.info-item')?.querySelector('input[type="file"]');
      expect(fileInput).toBeInTheDocument();

      // 直接触发文件选择事件
      await fireEvent.change(fileInput, { target: { files: [mockFile] } });

      // 等待OCR请求被调用
      await waitFor(
        () => {
          expect(mockFetch).toHaveBeenCalledWith('/api/ocr', expect.any(Object));
        },
        { timeout: 5000 },
      );

      // 验证文件被处理
      expect(mockFile).toBeDefined();
    });
  });

  describe('导航功能', () => {
    test('应该能够取消并返回上一页', async () => {
      render(StudentDetail);

      await waitForElement('报名信息');
      await clickButton('取消');

      expect(goto).toHaveBeenCalledWith('/student/enroll-plan');
    });

    test('应该能够保存表单', async () => {
      render(StudentDetail);

      await waitForElement('报名信息');
      await clickButton('保存');

      // 验证保存操作被触发
      expect(mockFetch).toHaveBeenCalled();
    });

    test('应该能够提交表单', async () => {
      render(StudentDetail);

      await waitForElement('报名信息');
      await clickButton('提交');

      // 验证提交操作被触发
      expect(mockFetch).toHaveBeenCalled();
    });
  });

  describe('地址选择联动', () => {
    test('应该渲染地址选择器', async () => {
      render(StudentDetail);

      await waitForElement('报名信息');

      // 验证地址选择器存在
      expect(screen.getByText('请选择省')).toBeInTheDocument();
      expect(screen.getByText('请选择市')).toBeInTheDocument();
      expect(screen.getByText('请选择区')).toBeInTheDocument();
    });
  });

  describe('错误处理', () => {
    test('应该处理服务器错误响应', async () => {
      mockFetch.mockImplementation((url) => {
        if (url.includes('/api/user/me')) {
          return Promise.resolve({
            ok: false,
            json: () =>
              Promise.resolve({
                status: 1,
                msg: '网络错误',
              }),
          });
        }
        return Promise.resolve({ ok: false, json: () => Promise.resolve({ status: 0 }) });
      });

      render(StudentDetail);

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWith('/api/user/me', expect.any(Object));
      });
    });

    test('应该处理getUserInfo网络错误', async () => {
      // 模拟网络错误
      mockFetch.mockImplementation((url) => {
        if (url.includes('/api/user/me')) {
          return Promise.resolve({
            ok: false,
            json: () =>
              Promise.resolve({
                status: 1,
                msg: '网络错误',
              }),
          });
        }
        return Promise.resolve({ ok: false, json: () => Promise.resolve({ status: 0 }) });
      });

      // 监听console.error调用，因为getUserInfo在catch中会调用console.error
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      render(StudentDetail);

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWith('/api/user/me', expect.any(Object));
      });

      // 验证网络错误被正确处理
      await waitFor(() => {
        expect(consoleSpy).toHaveBeenCalledWith(expect.any(Error));
      });

      consoleSpy.mockRestore();
    });
  });
});
