import { render, screen, fireEvent, waitFor } from '@testing-library/svelte';
import { vi } from 'vitest';
import StudentDetail from '../+page.svelte';

// Mock fetch
global.fetch = vi.fn();

// Mock page store
const mockPage = {
  params: {
    personId: 'test-person-id',
    seeEnrollId: 'test-enroll-id',
  },
};

vi.mock('$app/stores', () => ({
  page: {
    subscribe: (fn) => {
      fn(mockPage);
      return () => {};
    },
  },
}));

// Mock toast
vi.mock('$lib/components/Toast/Toast', () => ({
  toast: {
    warning: vi.fn(),
  },
}));

// Mock localStorage
Object.defineProperty(window, 'localStorage', {
  value: {
    getItem: vi.fn(() => JSON.stringify({ courseText: '测试科目' })),
    setItem: vi.fn(),
    removeItem: vi.fn(),
  },
  writable: true,
});

describe('StudentDetail', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    // Mock fetch 根据不同的URL返回不同的数据
    fetch.mockImplementation((url) => {
      if (url.includes('/api/user')) {
        // 用户信息API
        return Promise.resolve({
          ok: true,
          json: () =>
            Promise.resolve({
              data: [
                {
                  OfficialName: '张三',
                  IDCardType: '身份证',
                  IDCardNo: '123456789012345678',
                  Birthday: '1990-01-01',
                  MobilePhone: '13800138000',
                  Email: 'test@example.com',
                  Addr: '北京市朝阳区',
                  Gender: '男',
                  IDCardFile: {
                    frontImgID: 'front.jpg',
                    backImgID: 'back.jpg',
                  },
                },
              ],
            }),
        });
      } else if (url.includes('/api/registration')) {
        // 报名信息API - 匹配后端数据结构
        return Promise.resolve({
          ok: true,
          json: () =>
            Promise.resolve({
              data: {
                student: [
                  {
                    detail: {
                      Status: '02',
                      Type: '00',
                      ExamType: '00',
                      RegisterTime: '2024-01-01 10:00:00',
                    },
                    reviewer: '审核员',
                    student: {
                      ID: 'student-1',
                      OfficialName: '张三',
                      IDCardType: '身份证',
                      IDCardNo: '123456789012345678',
                      Birthday: '1990-01-01',
                      MobilePhone: '13800138000',
                      Email: 'test@example.com',
                      Addr: '北京市朝阳区',
                      Gender: '男',
                      IDCardFile: {
                        frontImgID: 'front.jpg',
                        backImgID: 'back.jpg',
                      },
                    },
                  },
                ],
              },
            }),
        });
      } else if (url.includes('/api/registrationStudent')) {
        // 审核操作API
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ success: true }),
        });
      }

      // 默认返回
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ data: [] }),
      });
    });
  });

  describe('基本渲染功能', () => {
    it('渲染标题部分', () => {
      render(StudentDetail);
      expect(screen.getByText('报名信息')).toBeInTheDocument();
      expect(screen.getByText('审核信息')).toBeInTheDocument();
    });

    it('渲染所有信息字段标签', () => {
      render(StudentDetail);

      // 第一行字段
      expect(screen.getByText(/姓名：/)).toBeInTheDocument();
      expect(screen.getByText(/证件类型：/)).toBeInTheDocument();
      expect(screen.getByText(/身份证号：/)).toBeInTheDocument();

      // 第二行字段
      expect(screen.getByText(/出生日期：/)).toBeInTheDocument();
      expect(screen.getByText(/电话：/)).toBeInTheDocument();
      expect(screen.getByText(/邮箱：/)).toBeInTheDocument();

      // 第三行字段
      expect(screen.getByText(/住址：/)).toBeInTheDocument();
      expect(screen.getByText(/性别：/)).toBeInTheDocument();
      expect(screen.getByText(/报名方式：/)).toBeInTheDocument();

      // 第四行字段
      expect(screen.getByText(/考试科目：/)).toBeInTheDocument();
      expect(screen.getByText(/考试类型：/)).toBeInTheDocument();
      expect(screen.getByText(/报名时间：/)).toBeInTheDocument();
    });
  });

  describe('数据展示功能', () => {
    it('显示用户基础信息', async () => {
      render(StudentDetail);

      await waitFor(() => {
        expect(screen.getByText('张三')).toBeInTheDocument();
        expect(screen.getByText('身份证')).toBeInTheDocument();
        expect(screen.getByText('123456789012345678')).toBeInTheDocument();
        expect(screen.getByText('1990-01-01')).toBeInTheDocument();
        expect(screen.getByText('13800138000')).toBeInTheDocument();
        expect(screen.getByText('test@example.com')).toBeInTheDocument();
        expect(screen.getByText('北京市朝阳区')).toBeInTheDocument();
        expect(screen.getByText('男')).toBeInTheDocument();
      });
    });

    it('显示暂无信息当数据为空时', () => {
      fetch.mockImplementation((url) => {
        if (url.includes('/api/user')) {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve({ data: [{}] }),
          });
        } else if (url.includes('/api/registration')) {
          return Promise.resolve({
            ok: true,
            json: () =>
              Promise.resolve({
                data: {
                  student: [
                    {
                      detail: {},
                      student: {},
                    },
                  ],
                },
              }),
          });
        }
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ data: [] }),
        });
      });

      render(StudentDetail);

      expect(screen.getAllByText('暂无')).toHaveLength(13);
    });

    it('显示考试科目信息', () => {
      render(StudentDetail);
      expect(screen.getByText('测试科目')).toBeInTheDocument();
    });
  });

  describe('身份证图片功能', () => {
    it('渲染身份证图片', async () => {
      render(StudentDetail);

      await waitFor(() => {
        const frontImg = screen.getByAltText('身份证人像面');
        const backImg = screen.getByAltText('身份证国徽面');

        expect(frontImg).toBeInTheDocument();
        expect(backImg).toBeInTheDocument();
        expect(frontImg.src).toContain('front.jpg');
        expect(backImg.src).toContain('back.jpg');
      });
    });

    it('不显示身份证图片当IDCardFile为空时', () => {
      fetch.mockImplementation((url) => {
        if (url.includes('/api/user')) {
          return Promise.resolve({
            ok: true,
            json: () =>
              Promise.resolve({
                data: [
                  {
                    OfficialName: '张三',
                    IDCardFile: null,
                  },
                ],
              }),
          });
        } else if (url.includes('/api/registration')) {
          return Promise.resolve({
            ok: true,
            json: () =>
              Promise.resolve({
                data: {
                  student: [
                    {
                      detail: {},
                      student: {},
                    },
                  ],
                },
              }),
          });
        }
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ data: [] }),
        });
      });

      render(StudentDetail);

      expect(screen.queryByAltText('身份证人像面')).not.toBeInTheDocument();
      expect(screen.queryByAltText('身份证国徽面')).not.toBeInTheDocument();
    });
  });

  describe('审核信息部分', () => {
    it('显示审核人信息', () => {
      render(StudentDetail);
      expect(screen.getByText(/审核人：/)).toBeInTheDocument();
    });

    it('显示审核状态标签', async () => {
      render(StudentDetail);

      await waitFor(() => {
        const statusTag = screen.getByText('待审核');
        expect(statusTag).toBeInTheDocument();
        expect(statusTag).toHaveClass('Status-tag', 'unpublished');
      });
    });

    it('根据状态显示不同的状态标签样式', async () => {
      fetch.mockImplementation((url) => {
        if (url.includes('/api/user')) {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve({ data: [{ OfficialName: '张三' }] }),
          });
        } else if (url.includes('/api/registration')) {
          return Promise.resolve({
            ok: true,
            json: () =>
              Promise.resolve({
                data: {
                  student: [
                    {
                      detail: { Status: '04' },
                      student: { ID: 'student-1' },
                    },
                  ],
                },
              }),
          });
        }
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ data: [] }),
        });
      });

      render(StudentDetail);

      await waitFor(() => {
        const statusTag = screen.getByText('通过');
        expect(statusTag).toHaveClass('Status-tag', 'published');
      });
    });
  });

  describe('操作按钮功能', () => {
    it('待审核状态显示通过和不通过按钮', async () => {
      render(StudentDetail);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: '通过' })).toBeInTheDocument();
        expect(screen.getByRole('button', { name: '不通过' })).toBeInTheDocument();
      });
    });

    it('通过状态显示撤销通过按钮', async () => {
      fetch.mockImplementation((url) => {
        if (url.includes('/api/user')) {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve({ data: [{ OfficialName: '张三' }] }),
          });
        } else if (url.includes('/api/registration')) {
          return Promise.resolve({
            ok: true,
            json: () =>
              Promise.resolve({
                data: {
                  student: [
                    {
                      detail: { Status: '04' },
                      student: { ID: 'student-1' },
                    },
                  ],
                },
              }),
          });
        }
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ data: [] }),
        });
      });

      render(StudentDetail);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: '撤销通过' })).toBeInTheDocument();
        expect(screen.queryByRole('button', { name: '通过' })).not.toBeInTheDocument();
        expect(screen.queryByRole('button', { name: '不通过' })).not.toBeInTheDocument();
      });
    });

    it('不通过状态显示撤销不通过按钮', async () => {
      fetch.mockImplementation((url) => {
        if (url.includes('/api/user')) {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve({ data: [{ OfficialName: '张三' }] }),
          });
        } else if (url.includes('/api/registration')) {
          return Promise.resolve({
            ok: true,
            json: () =>
              Promise.resolve({
                data: {
                  student: [
                    {
                      detail: { Status: '06' },
                      student: { ID: 'student-1' },
                    },
                  ],
                },
              }),
          });
        }
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ data: [] }),
        });
      });

      render(StudentDetail);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: '撤销不通过' })).toBeInTheDocument();
        expect(screen.queryByRole('button', { name: '通过' })).not.toBeInTheDocument();
        expect(screen.queryByRole('button', { name: '不通过' })).not.toBeInTheDocument();
      });
    });

    it('点击通过按钮调用正确的API', async () => {
      render(StudentDetail);

      // 等待组件加载完成和按钮出现
      await waitFor(() => {
        expect(screen.getByRole('button', { name: '通过' })).toBeInTheDocument();
      });

      // 清除之前的fetch调用记录
      vi.clearAllMocks();

      // 点击通过按钮
      const passButton = screen.getByRole('button', { name: '通过' });
      fireEvent.click(passButton);

      // 等待API调用
      await waitFor(() => {
        expect(fetch).toHaveBeenCalledWith(
          expect.stringContaining('/api/registrationStudent'),
          expect.objectContaining({
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
          }),
        );
      });
    });
  });

  describe('不通过理由弹窗功能', () => {
    it('点击不通过按钮显示弹窗', async () => {
      render(StudentDetail);

      await waitFor(() => {
        const rejectButton = screen.getByRole('button', { name: '不通过' });
        fireEvent.click(rejectButton);
      });

      expect(screen.getByText('请输入不通过理由')).toBeInTheDocument();
      expect(screen.getByPlaceholderText('请输入理由')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: '取消' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: '确认' })).toBeInTheDocument();
    });

    it('点击取消按钮关闭弹窗', async () => {
      render(StudentDetail);

      await waitFor(() => {
        const rejectButton = screen.getByRole('button', { name: '不通过' });
        fireEvent.click(rejectButton);
      });

      const cancelButton = screen.getByRole('button', { name: '取消' });
      fireEvent.click(cancelButton);

      expect(screen.queryByText('请输入不通过理由')).not.toBeInTheDocument();
    });

    it('输入理由后点击确认提交', async () => {
      render(StudentDetail);

      await waitFor(() => {
        const rejectButton = screen.getByRole('button', { name: '不通过' });
        fireEvent.click(rejectButton);
      });

      const textarea = screen.getByPlaceholderText('请输入理由');
      fireEvent.input(textarea, { target: { value: '资料不完整' } });

      // 清除之前的fetch调用记录
      vi.clearAllMocks();

      const confirmButton = screen.getByRole('button', { name: '确认' });
      fireEvent.click(confirmButton);

      await waitFor(() => {
        expect(fetch).toHaveBeenCalledWith(
          expect.stringContaining('/api/registrationStudent'),
          expect.objectContaining({
            method: 'PATCH',
          }),
        );
      });
    });

    it('未输入理由时点击确认显示警告', async () => {
      const { toast } = await import('$lib/components/Toast/Toast');

      render(StudentDetail);

      await waitFor(() => {
        const rejectButton = screen.getByRole('button', { name: '不通过' });
        fireEvent.click(rejectButton);
      });

      const confirmButton = screen.getByRole('button', { name: '确认' });
      fireEvent.click(confirmButton);

      expect(toast.warning).toHaveBeenCalledWith('请输入不通过理由');
    });
  });

  describe('API调用功能', () => {
    it('组件挂载时调用获取用户信息API', () => {
      render(StudentDetail);

      expect(fetch).toHaveBeenCalledWith(
        '/api/user?page=1&pageSize=10&fuzzyCondition=test-person-id',
        expect.objectContaining({
          method: 'GET',
          headers: { 'Content-Type': 'application/json' },
        }),
      );
    });

    it('组件挂载时调用获取报名信息API', () => {
      render(StudentDetail);

      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/registration'),
        expect.objectContaining({
          method: 'GET',
          headers: { 'Content-Type': 'application/json' },
        }),
      );
    });

    it('处理API错误', async () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      fetch.mockRejectedValue(new Error('网络错误'));

      render(StudentDetail);

      await waitFor(() => {
        expect(consoleSpy).toHaveBeenCalled();
      });

      consoleSpy.mockRestore();
    });
  });

  describe('数据映射功能', () => {
    it('正确映射考试类型', async () => {
      fetch.mockImplementation((url) => {
        if (url.includes('/api/user')) {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve({ data: [{ OfficialName: '张三' }] }),
          });
        } else if (url.includes('/api/registration')) {
          return Promise.resolve({
            ok: true,
            json: () =>
              Promise.resolve({
                data: {
                  student: [
                    {
                      detail: {
                        ExamType: '00',
                        Type: '00',
                      },
                      student: { ID: 'student-1' },
                    },
                  ],
                },
              }),
          });
        }
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ data: [] }),
        });
      });

      render(StudentDetail);

      await waitFor(() => {
        expect(screen.getByText('正考')).toBeInTheDocument();
        expect(screen.getByText('自报名')).toBeInTheDocument();
      });
    });

    it('正确映射报名方式', async () => {
      fetch.mockImplementation((url) => {
        if (url.includes('/api/user')) {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve({ data: [{ OfficialName: '张三' }] }),
          });
        } else if (url.includes('/api/registration')) {
          return Promise.resolve({
            ok: true,
            json: () =>
              Promise.resolve({
                data: {
                  student: [
                    {
                      detail: {
                        ExamType: '02',
                        Type: '02',
                      },
                      student: { ID: 'student-1' },
                    },
                  ],
                },
              }),
          });
        }
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ data: [] }),
        });
      });

      render(StudentDetail);

      await waitFor(() => {
        expect(screen.getByText('补考')).toBeInTheDocument();
        expect(screen.getByText('人工导入')).toBeInTheDocument();
      });
    });
  });

  // describe('handleApproveOrReject 函数测试', () => {
  //   it('成功调用API并刷新数据', async () => {
  //     render(StudentDetail);

  //     // 等待组件加载完成
  //     await waitFor(() => {
  //       expect(screen.getByRole('button', { name: '通过' })).toBeInTheDocument();
  //     });

  //     // 清除之前的fetch调用记录
  //     vi.clearAllMocks();

  //     // 点击通过按钮
  //     const passButton = screen.getByRole('button', { name: '通过' });
  //     fireEvent.click(passButton);

  //     // 验证API调用
  //     await waitFor(() => {
  //       expect(fetch).toHaveBeenCalledWith(
  //         expect.stringContaining('/api/registrationStudent'),
  //         expect.objectContaining({
  //           method: 'PATCH',
  //           headers: { 'Content-Type': 'application/json' },
  //         }),
  //       );
  //     });

  //     // 验证调用参数
  //     const fetchCalls = fetch.mock.calls;
  //     const lastCall = fetchCalls[fetchCalls.length - 1];
  //     const url = lastCall[0];
  //     const urlParams = new URLSearchParams(url.split('?')[1]);

  //     expect(urlParams.get('ids')).toBe('student-1');
  //     expect(urlParams.get('status')).toBe('04');
  //     expect(urlParams.get('register_id')).toBe('test-enroll-id');
  //   });

  //   it('API调用失败时处理错误', async () => {
  //     const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

  //     // Mock API失败
  //     fetch.mockImplementation((url) => {
  //       if (url.includes('/api/registrationStudent')) {
  //         return Promise.resolve({
  //           ok: false,
  //           status: 500,
  //         });
  //       }
  //       // 其他API正常返回
  //       return Promise.resolve({
  //         ok: true,
  //         json: () => Promise.resolve({ data: [] }),
  //       });
  //     });

  //     render(StudentDetail);

  //     await waitFor(() => {
  //       expect(screen.getByRole('button', { name: '通过' })).toBeInTheDocument();
  //     });

  //     const passButton = screen.getByRole('button', { name: '通过' });
  //     fireEvent.click(passButton);

  //     // 等待错误处理
  //     await waitFor(() => {
  //       expect(consoleSpy).toHaveBeenCalledWith(expect.any(Error));
  //     });

  //     consoleSpy.mockRestore();
  //   });

  //   it('不通过操作时传递正确的理由', async () => {
  //     render(StudentDetail);

  //     // 打开不通过弹窗
  //     await waitFor(() => {
  //       const rejectButton = screen.getByRole('button', { name: '不通过' });
  //       fireEvent.click(rejectButton);
  //     });

  //     // 输入理由
  //     const textarea = screen.getByPlaceholderText('请输入理由');
  //     fireEvent.input(textarea, { target: { value: '资料不完整' } });

  //     // 清除之前的fetch调用记录
  //     vi.clearAllMocks();

  //     // 点击确认
  //     const confirmButton = screen.getByRole('button', { name: '确认' });
  //     fireEvent.click(confirmButton);

  //     // 验证API调用
  //     await waitFor(() => {
  //       expect(fetch).toHaveBeenCalledWith(
  //         expect.stringContaining('/api/registrationStudent'),
  //         expect.objectContaining({
  //           method: 'PATCH',
  //         }),
  //       );
  //     });

  //     // 验证调用参数包含理由
  //     const fetchCalls = fetch.mock.calls;
  //     const lastCall = fetchCalls[fetchCalls.length - 1];
  //     const url = lastCall[0];
  //     const urlParams = new URLSearchParams(url.split('?')[1]);

  //     expect(urlParams.get('ids')).toBe('student-1');
  //     expect(urlParams.get('status')).toBe('06');
  //     expect(urlParams.get('fail_reason')).toBe('资料不完整');
  //   });

  //   it('撤销通过操作时传递正确的状态', async () => {
  //     // Mock通过状态的数据
  //     fetch.mockImplementation((url) => {
  //       if (url.includes('/api/user')) {
  //         return Promise.resolve({
  //           ok: true,
  //           json: () => Promise.resolve({ data: [{ OfficialName: '张三' }] }),
  //         });
  //       } else if (url.includes('/api/registration')) {
  //         return Promise.resolve({
  //           ok: true,
  //           json: () =>
  //             Promise.resolve({
  //               data: {
  //                 student: [
  //                   {
  //                     detail: { Status: '04' },
  //                     student: { ID: 'student-1' },
  //                   },
  //                 ],
  //               },
  //             }),
  //         });
  //       }
  //       return Promise.resolve({
  //         ok: true,
  //         json: () => Promise.resolve({ data: [] }),
  //       });
  //     });

  //     render(StudentDetail);

  //     await waitFor(() => {
  //       expect(screen.getByRole('button', { name: '撤销通过' })).toBeInTheDocument();
  //     });

  //     // 清除之前的fetch调用记录
  //     vi.clearAllMocks();

  //     // 点击撤销通过按钮
  //     const revokeButton = screen.getByRole('button', { name: '撤销通过' });
  //     fireEvent.click(revokeButton);

  //     // 验证API调用
  //     await waitFor(() => {
  //       expect(fetch).toHaveBeenCalledWith(
  //         expect.stringContaining('/api/registrationStudent'),
  //         expect.objectContaining({
  //           method: 'PATCH',
  //         }),
  //       );
  //     });

  //     // 验证调用参数
  //     const fetchCalls = fetch.mock.calls;
  //     const lastCall = fetchCalls[fetchCalls.length - 1];
  //     const url = lastCall[0];
  //     const urlParams = new URLSearchParams(url.split('?')[1]);

  //     expect(urlParams.get('ids')).toBe('student-1');
  //     expect(urlParams.get('status')).toBe('02');
  //   });

  //   it('撤销不通过操作时传递正确的状态', async () => {
  //     // Mock不通过状态的数据
  //     fetch.mockImplementation((url) => {
  //       if (url.includes('/api/user')) {
  //         return Promise.resolve({
  //           ok: true,
  //           json: () => Promise.resolve({ data: [{ OfficialName: '张三' }] }),
  //         });
  //       } else if (url.includes('/api/registration')) {
  //         return Promise.resolve({
  //           ok: true,
  //           json: () =>
  //             Promise.resolve({
  //               data: {
  //                 student: [
  //                   {
  //                     detail: { Status: '06' },
  //                     student: { ID: 'student-1' },
  //                   },
  //                 ],
  //               },
  //             }),
  //         });
  //       }
  //       return Promise.resolve({
  //         ok: true,
  //         json: () => Promise.resolve({ data: [] }),
  //       });
  //     });

  //     render(StudentDetail);

  //     await waitFor(() => {
  //       expect(screen.getByRole('button', { name: '撤销不通过' })).toBeInTheDocument();
  //     });

  //     // 清除之前的fetch调用记录
  //     vi.clearAllMocks();

  //     // 点击撤销不通过按钮
  //     const revokeButton = screen.getByRole('button', { name: '撤销不通过' });
  //     fireEvent.click(revokeButton);

  //     // 验证API调用
  //     await waitFor(() => {
  //       expect(fetch).toHaveBeenCalledWith(
  //         expect.stringContaining('/api/registrationStudent'),
  //         expect.objectContaining({
  //           method: 'PATCH',
  //         }),
  //       );
  //     });

  //     // 验证调用参数
  //     const fetchCalls = fetch.mock.calls;
  //     const lastCall = fetchCalls[fetchCalls.length - 1];
  //     const url = lastCall[0];
  //     const urlParams = new URLSearchParams(url.split('?')[1]);

  //     expect(urlParams.get('ids')).toBe('student-1');
  //     expect(urlParams.get('status')).toBe('02');
  //   });

  //   it('成功调用后刷新数据和关闭弹窗', async () => {
  //     render(StudentDetail);

  //     // 打开不通过弹窗
  //     await waitFor(() => {
  //       const rejectButton = screen.getByRole('button', { name: '不通过' });
  //       fireEvent.click(rejectButton);
  //     });

  //     // 输入理由
  //     const textarea = screen.getByPlaceholderText('请输入理由');
  //     fireEvent.input(textarea, { target: { value: '资料不完整' } });

  //     // 点击确认
  //     const confirmButton = screen.getByRole('button', { name: '确认' });
  //     fireEvent.click(confirmButton);

  //     // 验证弹窗关闭
  //     await waitFor(() => {
  //       expect(screen.queryByText('请输入不通过理由')).not.toBeInTheDocument();
  //     });

  //     // 验证数据刷新（通过检查fetch调用次数）
  //     expect(fetch).toHaveBeenCalledWith(
  //       expect.stringContaining('/api/registration'),
  //       expect.objectContaining({
  //         method: 'GET',
  //       }),
  //     );
  //   });
  // });
});
