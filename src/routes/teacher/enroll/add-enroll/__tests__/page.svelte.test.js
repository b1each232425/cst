import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/svelte';
import { goto } from '$app/navigation';
import EnrollPlanCreate from '../+page.svelte';

// 模拟导航函数
vi.mock('$app/navigation', () => ({
  goto: vi.fn(),
}));

// 模拟 fetch
const mockFetch = vi.fn();
vi.stubGlobal('fetch', mockFetch);

describe('报名计划创建页面', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockFetch.mockClear();
  });

  describe('基础元素渲染测试', () => {
    it('应渲染页面标题', () => {
      render(EnrollPlanCreate);
      expect(screen.getByRole('heading', { name: '创建报名计划' })).toBeInTheDocument();
    });

    it('应渲染计划名称输入框', () => {
      render(EnrollPlanCreate);
      expect(screen.getByPlaceholderText('请输入计划名称')).toBeInTheDocument();
    });

    it('应渲染报名时段选择器', () => {
      render(EnrollPlanCreate);
      expect(screen.getByText('计划报名时段：')).toBeInTheDocument();
      // 检查日期选择器输入框
      const dateInputs = document.querySelectorAll('.date-picker-container input.date-picker');
      expect(dateInputs.length).toBeGreaterThanOrEqual(1);
    });

    it('应渲染审核截止时间选择器', () => {
      render(EnrollPlanCreate);
      expect(screen.getByText('审核截止时间：')).toBeInTheDocument();
    });

    it('应渲染审核员选择按钮', () => {
      render(EnrollPlanCreate);
      expect(screen.getByRole('button', { name: '选择审核员' })).toBeInTheDocument();
    });

    it('应渲染人数限制选项', () => {
      render(EnrollPlanCreate);
      expect(screen.getByLabelText('不限人数')).toBeInTheDocument();
      expect(screen.getByLabelText('限制人数')).toBeInTheDocument();
      expect(screen.getByPlaceholderText('请输入人数')).toBeInTheDocument();
    });

    it('应渲染科目选择选项', () => {
      render(EnrollPlanCreate);
      expect(screen.getByLabelText('理论')).toBeInTheDocument();
      expect(screen.getByLabelText('实践')).toBeInTheDocument();
    });

    it('应渲染练习选择按钮', () => {
      render(EnrollPlanCreate);
      expect(screen.getByRole('button', { name: '选择练习' })).toBeInTheDocument();
    });

    it('应渲染考试地点选择器', () => {
      render(EnrollPlanCreate);
      expect(screen.getByText('考试地点：')).toBeInTheDocument();
      expect(screen.getByPlaceholderText('请输入详细地址（如街道、门牌号）')).toBeInTheDocument();
    });

    it('应渲染底部操作按钮', () => {
      render(EnrollPlanCreate);
      expect(screen.getByTestId('btn-cancel')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: '保存' })).toBeInTheDocument();
    });

    it('应渲染省市区选择器', async () => {
      render(EnrollPlanCreate);

      await waitFor(() => {
        // 检查省份选择器选项
        const provinceOption = screen.getByText('请选择省');
        expect(provinceOption).toBeInTheDocument();

        // 检查城市选择器
        const cityOption = screen.getByText('请选择市');
        expect(cityOption).toBeInTheDocument();

        // 检查区县选择器 - 查找第三个select组件
        const districtOption = screen.getByText('请选择区');
        expect(districtOption).toBeInTheDocument();
      });
    });
  });

  describe('表单验证测试', () => {
    it('点击保存但未填写必填项时，应显示校验错误', async () => {
      render(EnrollPlanCreate);

      await fireEvent.click(screen.getByRole('button', { name: '保存' }));

      await waitFor(() => {
        expect(screen.getByText('计划名称不能为空')).toBeInTheDocument();
        expect(screen.getByText('请选择计划报名时段')).toBeInTheDocument();
        expect(screen.getByText('请选择截止日期')).toBeInTheDocument();
        expect(screen.getByText('请选择审核员')).toBeInTheDocument();
        expect(screen.getByText('请输入考试地点')).toBeInTheDocument();
        expect(screen.getByText('请选择练习')).toBeInTheDocument();
      });
    });

    it('填写计划名称后应清除名称错误提示', async () => {
      render(EnrollPlanCreate);

      // 先点击保存显示错误
      await fireEvent.click(screen.getByRole('button', { name: '保存' }));
      await waitFor(() => {
        expect(screen.getByText('计划名称不能为空')).toBeInTheDocument();
      });

      // 填写计划名称
      const nameInput = screen.getByPlaceholderText('请输入计划名称');
      await fireEvent.input(nameInput, { target: { value: '测试计划' } });

      // 再次点击保存，名称错误应消失
      await fireEvent.click(screen.getByRole('button', { name: '保存' }));
      await waitFor(() => {
        expect(screen.queryByText('计划名称不能为空')).not.toBeInTheDocument();
      });
    });
  });

  describe('交互功能测试', () => {
    it('点击取消应跳转回列表页', async () => {
      render(EnrollPlanCreate);

      await fireEvent.click(screen.getByTestId('btn-cancel'));
      expect(goto).toHaveBeenCalledWith('/teacher/enroll');
    });

    it('切换为限制人数时，人数输入框应可见并可输入', async () => {
      render(EnrollPlanCreate);

      const limitRadio = screen.getByLabelText('限制人数');
      await fireEvent.click(limitRadio);

      const numberInput = screen.getByPlaceholderText('请输入人数');
      expect(numberInput).toBeInTheDocument();

      await fireEvent.input(numberInput, { target: { value: '30' } });
      expect(numberInput.value).toBe('30');
    });

    it('切换为不限人数时，人数输入框应隐藏', async () => {
      render(EnrollPlanCreate);

      // 先选择限制人数
      const limitRadio = screen.getByLabelText('限制人数');
      await fireEvent.click(limitRadio);

      // 再选择不限人数
      const unlimitedRadio = screen.getByLabelText('不限人数');
      await fireEvent.click(unlimitedRadio);

      const numberInput = screen.getByPlaceholderText('请输入人数');
      // 检查输入框是否添加了hide类
      expect(numberInput).toHaveClass('hide');
    });

    it('科目选择应正常工作', async () => {
      render(EnrollPlanCreate);

      const theoryCheckbox = screen.getByLabelText('理论');
      const practiceCheckbox = screen.getByLabelText('实践');

      // 默认应该都选中
      expect(theoryCheckbox).toBeChecked();
      expect(practiceCheckbox).toBeChecked();

      // 取消选择理论
      await fireEvent.click(theoryCheckbox);
      expect(theoryCheckbox).not.toBeChecked();
      expect(practiceCheckbox).toBeChecked();

      // 取消选择实践
      await fireEvent.click(practiceCheckbox);
      expect(theoryCheckbox).not.toBeChecked();
      expect(practiceCheckbox).not.toBeChecked();
    });
  });

  describe('fetch请求测试', () => {
    beforeEach(() => {
      // 清除所有mock
      mockFetch.mockClear();

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

    it('填写所有信息并保存应发送正确的fetch请求', async () => {
      render(EnrollPlanCreate);

      // 填写计划名称
      const nameInput = screen.getByPlaceholderText('请输入计划名称');
      await fireEvent.input(nameInput, { target: { value: '测试报名计划' } });

      // 选择限制人数并输入人数
      const limitRadio = screen.getByLabelText('限制人数');
      await fireEvent.click(limitRadio);
      const numberInput = screen.getByPlaceholderText('请输入人数');
      await fireEvent.input(numberInput, { target: { value: '50' } });

      // 选择省市区
      const provinceSelect = screen.getByText('请选择省');
      await fireEvent.click(provinceSelect);
      // 模拟选择第一个省份
      const firstProvince = screen.getByText('北京市');
      if (firstProvince) {
        await fireEvent.click(firstProvince);
      }

      const citySelect = screen.getByText('请选择市');
      await fireEvent.click(citySelect);
      const firstCity = screen.getByText('市辖区');
      if (firstCity) {
        await fireEvent.click(firstCity);
      }

      const districtSelect = screen.getByText('请选择区');
      await fireEvent.click(districtSelect);
      const firstDistrict = screen.getByText('东城区');
      if (firstDistrict) {
        await fireEvent.click(firstDistrict);
      }

      // 填写详细地址
      const detailAddressInput = screen.getByPlaceholderText('请输入详细地址（如街道、门牌号）');
      await fireEvent.input(detailAddressInput, { target: { value: '测试街道123号' } });

      // 模拟选择审核员 - 通过触发事件来模拟选择
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

      // 模拟选择练习 - 通过触发事件来模拟选择
      const practiceButton = screen.getByRole('button', { name: '选择练习' });
      await fireEvent.click(practiceButton);

      // 等待练习选择面板显示
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

      // 检查错误提示
      const errorMessages = [
        '计划名称不能为空',
        '请选择计划报名时段',
        '请选择截止日期',
        '请选择审核员',
        '请输入考试地点',
        '请选择练习',
      ];

      const existingErrors = errorMessages.filter((msg) => screen.queryByText(msg) !== null);
      console.log('当前错误提示:', existingErrors);

      // 验证fetch被调用
      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWith('/api/registration', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: expect.stringContaining('"Name":"测试报名计划"'),
        });
      });

      // 验证跳转到列表页
      expect(goto).toHaveBeenCalledWith('/teacher/enroll');
    });

    it('正确更换考试科目、省份、城市、区县', async () => {
      render(EnrollPlanCreate);

      // 填写计划名称
      const nameInput = screen.getByPlaceholderText('请输入计划名称');
      await fireEvent.input(nameInput, { target: { value: '测试报名计划' } });

      // 选择限制人数并输入人数
      const limitRadio = screen.getByLabelText('限制人数');
      await fireEvent.click(limitRadio);
      const numberInput = screen.getByPlaceholderText('请输入人数');
      await fireEvent.input(numberInput, { target: { value: '50' } });

      // 选择考试科目
      const theoryCheckbox = screen.getByLabelText('理论');
      await fireEvent.click(theoryCheckbox);

      // 选择省市区
      const provinceSelect = screen.getByText('请选择省');
      await fireEvent.click(provinceSelect);
      // 模拟选择第一个省份
      const firstProvince = screen.getByText('北京市');
      if (firstProvince) {
        await fireEvent.click(firstProvince);
      }

      const citySelect = screen.getByText('请选择市');
      await fireEvent.click(citySelect);
      const firstCity = screen.getByText('市辖区');
      if (firstCity) {
        await fireEvent.click(firstCity);
      }

      const districtSelect = screen.getByText('请选择区');
      await fireEvent.click(districtSelect);
      const firstDistrict = screen.getByText('东城区');
      if (firstDistrict) {
        await fireEvent.click(firstDistrict);
      }

      // 填写详细地址
      const detailAddressInput = screen.getByPlaceholderText('请输入详细地址（如街道、门牌号）');
      await fireEvent.input(detailAddressInput, { target: { value: '测试街道123号' } });

      // 模拟选择审核员 - 通过触发事件来模拟选择
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

      // 模拟选择练习 - 通过触发事件来模拟选择
      const practiceButton = screen.getByRole('button', { name: '选择练习' });
      await fireEvent.click(practiceButton);

      // 等待练习选择面板显示
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

      // 检查错误提示
      const errorMessages = [
        '计划名称不能为空',
        '请选择计划报名时段',
        '请选择截止日期',
        '请选择审核员',
        '请输入考试地点',
        '请选择练习',
      ];

      const existingErrors = errorMessages.filter((msg) => screen.queryByText(msg) !== null);
      console.log('当前错误提示:', existingErrors);

      // 验证fetch被调用
      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWith('/api/registration', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: expect.stringContaining('"Name":"测试报名计划"'),
        });
      });

      // 验证跳转到列表页
      expect(goto).toHaveBeenCalledWith('/teacher/enroll');
    });
  });
});
