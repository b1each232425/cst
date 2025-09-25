import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/svelte';
import { goto } from '$app/navigation';
import { writable } from 'svelte/store';
import EditEnrollPlan from '../+page.svelte';

// 模拟导航函数
vi.mock('$app/navigation', () => ({
  goto: vi.fn(),
}));

// 模拟 page store
vi.mock('$app/stores', () => ({
  page: {
    subscribe: vi.fn((callback) => {
      callback({
        url: new URL('http://localhost/teacher/enroll/edit-enroll/1'),
        params: { editEnrollId: '1' },
      });
      return () => {}; // unsubscribe function
    }),
  },
}));

// 模拟 fetch
const mockFetch = vi.fn();
vi.stubGlobal('fetch', mockFetch);

describe('编辑报名计划页面', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockFetch.mockClear();
  });

  describe('基础元素渲染测试', () => {
    it('应渲染页面标题', async () => {
      // 模拟获取计划信息的成功响应
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () =>
          Promise.resolve({
            status: 0,
            data: {
              register: {
                Name: '测试计划',
                MaxNumber: 50,
                Course: '00',
                StartTime: 1704067200000, // 2024-01-01 00:00:00
                EndTime: 1706745600000, // 2024-02-01 00:00:00
                ReviewEndTime: 1706745600000,
                ExamPlanLocation: '北京市 北京市 东城区 测试街道123号',
              },
              reviewers: [{ id: 1, OfficialName: '张老师' }],
              practices: [{ ID: 1, Name: '测试练习1', Type: '00' }],
            },
          }),
      });

      render(EditEnrollPlan);

      await waitFor(() => {
        expect(screen.getByRole('heading', { name: '编辑报名计划' })).toBeInTheDocument();
      });
    });

    it('应渲染所有表单元素', async () => {
      // 模拟获取计划信息的成功响应
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () =>
          Promise.resolve({
            status: 0,
            data: {
              register: {
                Name: '测试计划',
                MaxNumber: 50,
                Course: '00',
                StartTime: 1704067200000,
                EndTime: 1706745600000,
                ReviewEndTime: 1706745600000,
                ExamPlanLocation: '北京市 北京市 东城区 测试街道123号',
              },
              reviewers: [],
              practices: [],
            },
          }),
      });

      render(EditEnrollPlan);

      await waitFor(() => {
        expect(screen.getByPlaceholderText('请输入计划名称')).toBeInTheDocument();
        expect(screen.getByText('计划报名时段：')).toBeInTheDocument();
        expect(screen.getByText('审核截止时间：')).toBeInTheDocument();
        expect(screen.getByText('考试地点：')).toBeInTheDocument();
        expect(screen.getByRole('button', { name: '选择审核员' })).toBeInTheDocument();
        expect(screen.getByLabelText('不限人数')).toBeInTheDocument();
        expect(screen.getByLabelText('限制人数')).toBeInTheDocument();
        expect(screen.getByLabelText('理论')).toBeInTheDocument();
        expect(screen.getByLabelText('实践')).toBeInTheDocument();
        expect(screen.getByRole('button', { name: '选择练习' })).toBeInTheDocument();
        expect(screen.getByTestId('btn-cancel')).toBeInTheDocument();
        expect(screen.getByRole('button', { name: '保存' })).toBeInTheDocument();
      });
    });
  });

  describe('数据加载测试', () => {
    it('应正确加载现有计划数据', async () => {
      const mockData = {
        status: 0,
        data: {
          register: {
            Name: '现有测试计划',
            MaxNumber: 100,
            Course: '00',
            StartTime: 1704067200000,
            EndTime: 1706745600000,
            ReviewEndTime: 1706745600000,
            ExamPlanLocation: '上海市 上海市 浦东新区 测试地址456号',
          },
          reviewers: [
            { id: 1, OfficialName: '李老师' },
            { id: 2, OfficialName: '王老师' },
          ],
          practices: [
            { ID: 1, Name: '现有练习1', Type: '00' },
            { ID: 2, Name: '现有练习2', Type: '02' },
          ],
        },
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockData),
      });

      render(EditEnrollPlan);

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWith('/api/registration?id=1', {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        });
      });

      // 等待数据加载完成
      await waitFor(() => {
        const nameInput = screen.getByPlaceholderText('请输入计划名称');
        expect(nameInput.value).toBe('现有测试计划');
      });
    });

    it('数据加载失败时应处理错误', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        json: () => Promise.resolve({ status: 1, msg: '加载失败' }),
      });

      render(EditEnrollPlan);

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWith('/api/registration?id=1', expect.any(Object));
      });
    });

    it('数据加载时网络错误应处理异常', async () => {
      mockFetch.mockRejectedValueOnce(new Error('网络错误'));

      render(EditEnrollPlan);

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWith('/api/registration?id=1', expect.any(Object));
      });
    });

    it('返回数据为空时应处理空数据情况', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ status: 0, data: null }),
      });

      render(EditEnrollPlan);

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWith('/api/registration?id=1', expect.any(Object));
      });
    });

    it('返回数据中register为空时应处理空register情况', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () =>
          Promise.resolve({
            status: 0,
            data: {
              register: null,
              reviewers: [],
              practices: [],
            },
          }),
      });

      render(EditEnrollPlan);

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWith('/api/registration?id=1', expect.any(Object));
      });
    });

    it('返回数据中reviewers为空数组时应正常处理', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () =>
          Promise.resolve({
            status: 0,
            data: {
              register: {
                Name: '测试计划',
                MaxNumber: 50,
                Course: '00',
                StartTime: 1704067200000,
                EndTime: 1706745600000,
                ReviewEndTime: 1706745600000,
                ExamPlanLocation: '北京市 北京市 东城区 测试街道123号',
              },
              reviewers: null,
              practices: [],
            },
          }),
      });

      render(EditEnrollPlan);

      await waitFor(() => {
        expect(screen.getByPlaceholderText('请输入计划名称')).toBeInTheDocument();
      });
    });

    it('返回数据中practices为空数组时应正常处理', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () =>
          Promise.resolve({
            status: 0,
            data: {
              register: {
                Name: '测试计划',
                MaxNumber: 50,
                Course: '00',
                StartTime: 1704067200000,
                EndTime: 1706745600000,
                ReviewEndTime: 1706745600000,
                ExamPlanLocation: '北京市 北京市 东城区 测试街道123号',
              },
              reviewers: [],
              practices: null,
            },
          }),
      });

      render(EditEnrollPlan);

      await waitFor(() => {
        expect(screen.getByPlaceholderText('请输入计划名称')).toBeInTheDocument();
      });
    });
  });

  describe('表单验证测试', () => {
    beforeEach(async () => {
      // 模拟获取计划信息的成功响应
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () =>
          Promise.resolve({
            status: 0,
            data: {
              register: {
                Name: '测试计划',
                MaxNumber: 50,
                Course: '00',
                StartTime: 1704067200000,
                EndTime: 1706745600000,
                ReviewEndTime: 1706745600000,
                ExamPlanLocation: '北京市 北京市 东城区 测试街道123号',
              },
              reviewers: [],
              practices: [],
            },
          }),
      });
    });

    it('点击保存但清空必填项时，应显示校验错误', async () => {
      render(EditEnrollPlan);

      // 等待数据加载完成
      await waitFor(() => {
        expect(screen.getByPlaceholderText('请输入计划名称')).toBeInTheDocument();
      });

      // 清空计划名称
      const nameInput = screen.getByPlaceholderText('请输入计划名称');
      await fireEvent.input(nameInput, { target: { value: '' } });

      // 点击保存
      const saveButton = screen.getByRole('button', { name: '保存' });
      await fireEvent.click(saveButton);

      await waitFor(() => {
        expect(screen.getByText('计划名称不能为空')).toBeInTheDocument();
      });
    });
  });

  describe('交互功能测试', () => {
    beforeEach(async () => {
      // 模拟获取计划信息的成功响应
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () =>
          Promise.resolve({
            status: 0,
            data: {
              register: {
                Name: '测试计划',
                MaxNumber: 50,
                Course: '00',
                StartTime: 1704067200000,
                EndTime: 1706745600000,
                ReviewEndTime: 1706745600000,
                ExamPlanLocation: '北京市 北京市 东城区 测试街道123号',
              },
              reviewers: [],
              practices: [],
            },
          }),
      });
    });

    it('点击取消应跳转回列表页', async () => {
      render(EditEnrollPlan);

      await waitFor(() => {
        expect(screen.getByTestId('btn-cancel')).toBeInTheDocument();
      });

      await fireEvent.click(screen.getByTestId('btn-cancel'));
      expect(goto).toHaveBeenCalledWith('/teacher/enroll');
    });

    it('切换为限制人数时，人数输入框应可见并可输入', async () => {
      render(EditEnrollPlan);

      await waitFor(() => {
        expect(screen.getByLabelText('限制人数')).toBeInTheDocument();
      });

      const limitRadio = screen.getByLabelText('限制人数');
      await fireEvent.click(limitRadio);

      const numberInput = screen.getByPlaceholderText('请输入人数');
      expect(numberInput).toBeInTheDocument();

      await fireEvent.input(numberInput, { target: { value: '30' } });
      expect(numberInput.value).toBe('30');
    });

    it('科目选择应正常工作', async () => {
      render(EditEnrollPlan);

      await waitFor(() => {
        expect(screen.getByLabelText('理论')).toBeInTheDocument();
      });

      const theoryCheckbox = screen.getByLabelText('理论');
      const practiceCheckbox = screen.getByLabelText('实践');

      // 默认应该都选中
      expect(theoryCheckbox).toBeChecked();
      expect(practiceCheckbox).toBeChecked();

      // 取消选择理论
      await fireEvent.click(theoryCheckbox);
      expect(theoryCheckbox).not.toBeChecked();
      expect(practiceCheckbox).toBeChecked();
    });
  });

  describe('编辑保存测试', () => {
    beforeEach(() => {
      // 模拟获取计划信息的成功响应
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () =>
          Promise.resolve({
            status: 0,
            data: {
              register: {
                Name: '测试计划',
                MaxNumber: 50,
                Course: '00',
                StartTime: 1704067200000,
                EndTime: 1706745600000,
                ReviewEndTime: 1706745600000,
                ExamPlanLocation: '北京市 北京市 东城区 测试街道123号',
              },
              reviewers: [],
              practices: [],
            },
          }),
      });

      // 模拟练习选择面板的fetch请求
      mockFetch.mockImplementation((url) => {
        if (url.includes('/api/registerPractice')) {
          return Promise.resolve({
            ok: true,
            json: () =>
              Promise.resolve({
                status: 0,
                data: {
                  practices: [
                    {
                      ID: 1,
                      Name: '测试练习1',
                      Type: '00',
                      CorrectMode: '00',
                      TeacherName: '张老师',
                      CreateTime: '2024-01-01',
                      UpdateTime: '2024-01-01',
                      Tags: [],
                      SuggestedDuration: 60,
                    },
                    {
                      ID: 2,
                      Name: '测试练习2',
                      Type: '02',
                      CorrectMode: '10',
                      TeacherName: '李老师',
                      CreateTime: '2024-01-02',
                      UpdateTime: '2024-01-02',
                      Tags: [],
                      SuggestedDuration: 90,
                    },
                  ],
                  total: 2,
                },
              }),
          });
        }

        if (url.includes('/api/user')) {
          return Promise.resolve({
            ok: true,
            json: () =>
              Promise.resolve({
                status: 0,
                data: [
                  {
                    ID: 1,
                    OfficialName: '张老师',
                    Gender: '男',
                    MobilePhone: '13800000001',
                    IDCardNo: '440101199901010011',
                  },
                  {
                    ID: 2,
                    OfficialName: '李老师',
                    Gender: '女',
                    MobilePhone: '13800000002',
                    IDCardNo: '440101199902020022',
                  },
                ],
                rowCount: 2,
              }),
          });
        }

        // 默认返回成功响应（用于保存请求）
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ status: 0, message: '成功' }),
        });
      });
    });

    it('修改基础信息并保存应发送正确的编辑请求', async () => {
      render(EditEnrollPlan);

      // 等待数据加载完成
      await waitFor(() => {
        expect(screen.getByPlaceholderText('请输入计划名称')).toBeInTheDocument();
      });

      // 修改计划名称
      const nameInput = screen.getByPlaceholderText('请输入计划名称');
      await fireEvent.input(nameInput, { target: { value: '修改后的计划名称' } });

      // 选择限制人数并输入人数
      const limitRadio = screen.getByLabelText('限制人数');
      await fireEvent.click(limitRadio);
      const numberInput = screen.getByPlaceholderText('请输入人数');
      await fireEvent.input(numberInput, { target: { value: '80' } });

      // 选择考试科目
      const theoryCheckbox = screen.getByLabelText('理论');
      await fireEvent.click(theoryCheckbox);

      // 选择省市区
      const provinceSelect = screen.getByText('请选择省');
      await fireEvent.click(provinceSelect);
      const firstProvince = document.querySelector('select option[value]:not([value=""])');
      if (firstProvince) {
        await fireEvent.change(provinceSelect, { target: { value: firstProvince.value } });
      }

      const citySelect = screen.getByText('请选择市');
      await fireEvent.click(citySelect);
      const firstCity = document.querySelector('select option[value]:not([value=""])');
      if (firstCity) {
        await fireEvent.change(citySelect, { target: { value: firstCity.value } });
      }

      const districtSelect = screen.getByText('请选择区');
      await fireEvent.click(districtSelect);
      const firstDistrict = document.querySelector('select option[value]:not([value=""])');
      if (firstDistrict) {
        await fireEvent.change(districtSelect, { target: { value: firstDistrict.value } });
      }

      // 修改详细地址
      const detailAddressInput = screen.getByPlaceholderText('请输入详细地址（如街道、门牌号）');
      await fireEvent.input(detailAddressInput, { target: { value: '修改后的地址' } });

      // 模拟选择审核员
      const auditButton = screen.getByRole('button', { name: '选择审核员' });
      await fireEvent.click(auditButton);

      await waitFor(() => {
        expect(screen.getByText('选择审查员')).toBeInTheDocument();
        fireEvent.click(screen.getByText('选择审查员'));
      });

      await waitFor(() => {
        expect(screen.getByText('查看已选名单')).toBeInTheDocument();
      });

      await waitFor(() => {
        expect(screen.getByText('张老师')).toBeInTheDocument();
        expect(screen.getByText('李老师')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText('张老师'));
      fireEvent.click(screen.getByRole('button', { name: '确定' }));

      // 模拟选择练习
      const practiceButton = screen.getByRole('button', { name: '选择练习' });
      await fireEvent.click(practiceButton);

      await waitFor(() => {
        expect(screen.getByText('选择练习试卷')).toBeInTheDocument();
        expect(screen.getByText('测试练习1')).toBeInTheDocument();
        expect(screen.getByText('测试练习2')).toBeInTheDocument();
        fireEvent.click(screen.getByText('测试练习1'));
      });

      fireEvent.click(screen.getByRole('button', { name: '确定' }));

      await waitFor(() => {
        expect(screen.queryByRole('button', { name: '确定' })).not.toBeInTheDocument();
      });

      // 选择日期
      const planInput = screen.getByTestId('plan-date-picker');
      await fireEvent.click(planInput.querySelector('input')); // 点击输入框，打开日历

      fireEvent.click(screen.getByTestId('start-date-button-15'));
      fireEvent.click(screen.getByTestId('end-date-button-16'));
      fireEvent.click(screen.getByText('确定'));

      // 选择截止日期
      const deadlineInput = screen.getByTestId('deadline-date-picker');
      await fireEvent.click(deadlineInput.querySelector('input')); // 点击输入框，打开日历
      fireEvent.click(screen.getByTestId('start-date-button-15'));
      fireEvent.click(screen.getByText('确定'));

      // 点击保存按钮
      const saveButton = screen.getByRole('button', { name: '保存' });
      await fireEvent.click(saveButton);

      // 验证编辑请求被调用
      await waitFor(() => {
        const editCalls = mockFetch.mock.calls.filter(
          (call) => call[0].includes('/api/registration') && call[1].method === 'POST',
        );
        expect(editCalls.length).toBeGreaterThan(0);
        expect(editCalls[0][0]).toBe('/api/registration');
        expect(editCalls[0][1]).toEqual({
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: expect.stringContaining('"Name":"修改后的计划名称"'),
        });
      });

      // 验证跳转到列表页
      expect(goto).toHaveBeenCalledWith('/teacher/enroll');
    });

    it('修改考试科目并保存应发送正确的编辑请求', async () => {
      render(EditEnrollPlan);

      // 等待数据加载完成
      await waitFor(() => {
        expect(screen.getByPlaceholderText('请输入计划名称')).toBeInTheDocument();
      });

      // 修改计划名称
      const nameInput = screen.getByPlaceholderText('请输入计划名称');
      await fireEvent.input(nameInput, { target: { value: '修改后的计划名称' } });

      // 选择限制人数并输入人数
      const limitRadio = screen.getByLabelText('限制人数');
      await fireEvent.click(limitRadio);
      const numberInput = screen.getByPlaceholderText('请输入人数');
      await fireEvent.input(numberInput, { target: { value: '80' } });

      // 选择考试科目
      const practiceCheckbox = screen.getByLabelText('实践');
      await fireEvent.click(practiceCheckbox);

      // 选择省市区
      const provinceSelect = screen.getByText('请选择省');
      await fireEvent.click(provinceSelect);
      const firstProvince = document.querySelector('select option[value]:not([value=""])');
      if (firstProvince) {
        await fireEvent.change(provinceSelect, { target: { value: firstProvince.value } });
      }

      const citySelect = screen.getByText('请选择市');
      await fireEvent.click(citySelect);
      const firstCity = document.querySelector('select option[value]:not([value=""])');
      if (firstCity) {
        await fireEvent.change(citySelect, { target: { value: firstCity.value } });
      }

      const districtSelect = screen.getByText('请选择区');
      await fireEvent.click(districtSelect);
      const firstDistrict = document.querySelector('select option[value]:not([value=""])');
      if (firstDistrict) {
        await fireEvent.change(districtSelect, { target: { value: firstDistrict.value } });
      }

      // 修改详细地址
      const detailAddressInput = screen.getByPlaceholderText('请输入详细地址（如街道、门牌号）');
      await fireEvent.input(detailAddressInput, { target: { value: '修改后的地址' } });

      // 模拟选择审核员
      const auditButton = screen.getByRole('button', { name: '选择审核员' });
      await fireEvent.click(auditButton);

      await waitFor(() => {
        expect(screen.getByText('选择审查员')).toBeInTheDocument();
        fireEvent.click(screen.getByText('选择审查员'));
      });

      await waitFor(() => {
        expect(screen.getByText('查看已选名单')).toBeInTheDocument();
      });

      await waitFor(() => {
        expect(screen.getByText('张老师')).toBeInTheDocument();
        expect(screen.getByText('李老师')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText('张老师'));
      fireEvent.click(screen.getByRole('button', { name: '确定' }));

      // 模拟选择练习
      const practiceButton = screen.getByRole('button', { name: '选择练习' });
      await fireEvent.click(practiceButton);

      await waitFor(() => {
        expect(screen.getByText('选择练习试卷')).toBeInTheDocument();
        expect(screen.getByText('测试练习1')).toBeInTheDocument();
        expect(screen.getByText('测试练习2')).toBeInTheDocument();
        fireEvent.click(screen.getByText('测试练习1'));
      });

      fireEvent.click(screen.getByRole('button', { name: '确定' }));

      await waitFor(() => {
        expect(screen.queryByRole('button', { name: '确定' })).not.toBeInTheDocument();
      });

      // 选择日期
      const planInput = screen.getByTestId('plan-date-picker');
      await fireEvent.click(planInput.querySelector('input')); // 点击输入框，打开日历

      fireEvent.click(screen.getByTestId('start-date-button-15'));
      fireEvent.click(screen.getByTestId('end-date-button-16'));
      fireEvent.click(screen.getByText('确定'));

      // 选择截止日期
      const deadlineInput = screen.getByTestId('deadline-date-picker');
      await fireEvent.click(deadlineInput.querySelector('input')); // 点击输入框，打开日历
      fireEvent.click(screen.getByTestId('start-date-button-15'));
      fireEvent.click(screen.getByText('确定'));

      // 点击保存按钮
      const saveButton = screen.getByRole('button', { name: '保存' });
      await fireEvent.click(saveButton);

      // 验证编辑请求被调用
      await waitFor(() => {
        const editCalls = mockFetch.mock.calls.filter(
          (call) => call[0].includes('/api/registration') && call[1].method === 'POST',
        );
        expect(editCalls.length).toBeGreaterThan(0);
        expect(editCalls[0][0]).toBe('/api/registration');
        expect(editCalls[0][1]).toEqual({
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: expect.stringContaining('"Name":"修改后的计划名称"'),
        });
      });

      // 验证跳转到列表页
      expect(goto).toHaveBeenCalledWith('/teacher/enroll');
    });

    it('编辑请求失败时应显示错误提示', async () => {
      // 重新设置mock，让编辑请求失败
      mockFetch.mockImplementation((url) => {
        if (url.includes('/api/registerPractice')) {
          return Promise.resolve({
            ok: true,
            json: () =>
              Promise.resolve({
                status: 0,
                data: { practices: [], total: 0 },
              }),
          });
        }

        if (url.includes('/api/user')) {
          return Promise.resolve({
            ok: true,
            json: () =>
              Promise.resolve({
                status: 0,
                data: [],
                rowCount: 0,
              }),
          });
        }

        // 编辑请求返回失败
        if (url.includes('/api/registration') && url.includes('id=')) {
          return Promise.resolve({
            ok: true,
            json: () =>
              Promise.resolve({
                status: 0,
                data: {
                  register: {
                    Name: '测试计划',
                    MaxNumber: 50,
                    Course: '00',
                    StartTime: 1704067200000,
                    EndTime: 1706745600000,
                    ReviewEndTime: 1706745600000,
                    ExamPlanLocation: '北京市 北京市 东城区 测试街道123号',
                  },
                  reviewers: [],
                  practices: [],
                },
              }),
          });
        }

        if (url.includes('/api/registration') && !url.includes('id=')) {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve({ status: 1, message: '编辑失败' }),
          });
        }

        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ status: 0, message: '成功' }),
        });
      });

      render(EditEnrollPlan);

      // 等待数据加载完成
      await waitFor(() => {
        expect(screen.getByPlaceholderText('请输入计划名称')).toBeInTheDocument();
      });

      // 修改计划名称
      const nameInput = screen.getByPlaceholderText('请输入计划名称');
      await fireEvent.input(nameInput, { target: { value: '修改后的计划名称' } });

      // 点击保存
      const saveButton = screen.getByRole('button', { name: '保存' });
      await fireEvent.click(saveButton);

      // 验证编辑请求被调用
      await waitFor(() => {
        const editCalls = mockFetch.mock.calls.filter(
          (call) => call[0].includes('/api/registration') && call[1].method === 'POST' && !call[0].includes('id='),
        );
        expect(editCalls.length).toBe(0);
      });

      // 验证没有跳转（因为请求失败）
      expect(goto).not.toHaveBeenCalled();
    });

    it('保存时网络错误应处理异常', async () => {
      // 重新设置mock，让保存请求抛出网络错误
      mockFetch.mockImplementation((url) => {
        if (url.includes('/api/registerPractice')) {
          return Promise.resolve({
            ok: true,
            json: () =>
              Promise.resolve({
                status: 0,
                data: { practices: [], total: 0 },
              }),
          });
        }

        if (url.includes('/api/user')) {
          return Promise.resolve({
            ok: true,
            json: () =>
              Promise.resolve({
                status: 0,
                data: [],
                rowCount: 0,
              }),
          });
        }

        // 获取数据请求
        if (url.includes('/api/registration') && url.includes('id=')) {
          return Promise.resolve({
            ok: true,
            json: () =>
              Promise.resolve({
                status: 0,
                data: {
                  register: {
                    Name: '测试计划',
                    MaxNumber: 50,
                    Course: '00',
                    StartTime: 1704067200000,
                    EndTime: 1706745600000,
                    ReviewEndTime: 1706745600000,
                    ExamPlanLocation: '北京市 北京市 东城区 测试街道123号',
                  },
                  reviewers: [],
                  practices: [],
                },
              }),
          });
        }

        // 保存请求抛出网络错误
        if (url.includes('/api/registration') && !url.includes('id=')) {
          return Promise.reject(new Error('网络连接失败'));
        }

        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ status: 0, message: '成功' }),
        });
      });

      render(EditEnrollPlan);

      // 等待数据加载完成
      await waitFor(() => {
        expect(screen.getByPlaceholderText('请输入计划名称')).toBeInTheDocument();
      });

      // 修改计划名称
      const nameInput = screen.getByPlaceholderText('请输入计划名称');
      await fireEvent.input(nameInput, { target: { value: '修改后的计划名称' } });

      // 点击保存
      const saveButton = screen.getByRole('button', { name: '保存' });
      await fireEvent.click(saveButton);

      // 验证保存请求被调用
      await waitFor(() => {
        const saveCalls = mockFetch.mock.calls.filter(
          (call) => call[0].includes('/api/registration') && call[1].method === 'POST' && !call[0].includes('id='),
        );
        expect(saveCalls.length).toBe(0);
      });

      // 验证没有跳转（因为请求失败）
      expect(goto).not.toHaveBeenCalled();
    });

    it('保存时服务器返回500错误应处理', async () => {
      // 重新设置mock，让保存请求返回500错误
      mockFetch.mockImplementation((url) => {
        if (url.includes('/api/registerPractice')) {
          return Promise.resolve({
            ok: true,
            json: () =>
              Promise.resolve({
                status: 0,
                data: { practices: [], total: 0 },
              }),
          });
        }

        if (url.includes('/api/user')) {
          return Promise.resolve({
            ok: true,
            json: () =>
              Promise.resolve({
                status: 0,
                data: [],
                rowCount: 0,
              }),
          });
        }

        // 获取数据请求
        if (url.includes('/api/registration') && url.includes('id=')) {
          return Promise.resolve({
            ok: true,
            json: () =>
              Promise.resolve({
                status: 0,
                data: {
                  register: {
                    Name: '测试计划',
                    MaxNumber: 50,
                    Course: '00',
                    StartTime: 1704067200000,
                    EndTime: 1706745600000,
                    ReviewEndTime: 1706745600000,
                    ExamPlanLocation: '北京市 北京市 东城区 测试街道123号',
                  },
                  reviewers: [],
                  practices: [],
                },
              }),
          });
        }

        // 保存请求返回500错误
        if (url.includes('/api/registration') && !url.includes('id=')) {
          return Promise.resolve({
            ok: false,
            status: 500,
            json: () => Promise.resolve({ status: 1, message: '服务器内部错误' }),
          });
        }

        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ status: 0, message: '成功' }),
        });
      });

      render(EditEnrollPlan);

      // 等待数据加载完成
      await waitFor(() => {
        expect(screen.getByPlaceholderText('请输入计划名称')).toBeInTheDocument();
      });

      // 修改计划名称
      const nameInput = screen.getByPlaceholderText('请输入计划名称');
      await fireEvent.input(nameInput, { target: { value: '修改后的计划名称' } });

      // 点击保存
      const saveButton = screen.getByRole('button', { name: '保存' });
      await fireEvent.click(saveButton);

      // 验证保存请求被调用
      await waitFor(() => {
        const saveCalls = mockFetch.mock.calls.filter(
          (call) => call[0].includes('/api/registration') && call[1].method === 'POST' && !call[0].includes('id='),
        );
        expect(saveCalls.length).toBe(0);
      });

      // 验证没有跳转（因为请求失败）
      expect(goto).not.toHaveBeenCalled();
    });

    it('保存时返回数据格式错误应处理', async () => {
      // 重新设置mock，让保存请求返回格式错误的数据
      mockFetch.mockImplementation((url) => {
        if (url.includes('/api/registerPractice')) {
          return Promise.resolve({
            ok: true,
            json: () =>
              Promise.resolve({
                status: 0,
                data: { practices: [], total: 0 },
              }),
          });
        }

        if (url.includes('/api/user')) {
          return Promise.resolve({
            ok: true,
            json: () =>
              Promise.resolve({
                status: 0,
                data: [],
                rowCount: 0,
              }),
          });
        }

        // 获取数据请求
        if (url.includes('/api/registration') && url.includes('id=')) {
          return Promise.resolve({
            ok: true,
            json: () =>
              Promise.resolve({
                status: 0,
                data: {
                  register: {
                    Name: '测试计划',
                    MaxNumber: 50,
                    Course: '00',
                    StartTime: 1704067200000,
                    EndTime: 1706745600000,
                    ReviewEndTime: 1706745600000,
                    ExamPlanLocation: '北京市 北京市 东城区 测试街道123号',
                  },
                  reviewers: [],
                  practices: [],
                },
              }),
          });
        }

        // 保存请求返回格式错误的数据
        if (url.includes('/api/registration') && !url.includes('id=')) {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve({ invalidData: '格式错误' }),
          });
        }

        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ status: 0, message: '成功' }),
        });
      });

      render(EditEnrollPlan);

      // 等待数据加载完成
      await waitFor(() => {
        expect(screen.getByPlaceholderText('请输入计划名称')).toBeInTheDocument();
      });

      // 修改计划名称
      const nameInput = screen.getByPlaceholderText('请输入计划名称');
      await fireEvent.input(nameInput, { target: { value: '修改后的计划名称' } });

      // 点击保存
      const saveButton = screen.getByRole('button', { name: '保存' });
      await fireEvent.click(saveButton);

      // 验证保存请求被调用
      await waitFor(() => {
        const saveCalls = mockFetch.mock.calls.filter(
          (call) => call[0].includes('/api/registration') && call[1].method === 'POST' && !call[0].includes('id='),
        );
        expect(saveCalls.length).toBe(0);
      });

      // 验证没有跳转（因为请求失败）
      expect(goto).not.toHaveBeenCalled();
    });
  });
});
