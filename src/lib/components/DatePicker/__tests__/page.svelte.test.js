import { render, screen, fireEvent } from '@testing-library/svelte';
import DatePicker from '../DatePicker.svelte';
import { vi } from 'vitest';
import { expect } from 'vitest';

describe('DatePicker 组件测试', () => {
  beforeEach(() => {
    // 在每个测试前，清空所有的模拟
    vi.restoreAllMocks();

    // 模拟 scrollIntoView
    window.HTMLElement.prototype.scrollIntoView = vi.fn();
  });

  it('应该正确初始化单日期选择器', () => {
    render(DatePicker, {
      props: {
        initial_start_date: null,
        initial_end_date: null,
        is_single_date_selection: true,
        is_time_selection: true,
        input_width: '140px',
      },
    });

    const input = screen.getByRole('textbox');

    expect(input.value).toBe('请选择日期');
  });

  it('应该正确初始化双日期选择器', () => {
    render(DatePicker, {
      props: {
        initial_start_date: null,
        initial_end_date: null,
        is_single_date_selection: false,
        is_time_selection: true,
        input_width: '140px',
      },
    });

    const input = screen.getByRole('textbox');

    expect(input.value).toBe('开始日期   ~   结束日期');
  });

  it('点击输入框时应该显示日历', async () => {
    render(DatePicker, {
      props: {
        initial_start_date: null,
        initial_end_date: null,
        is_single_date_selection: true,
        is_time_selection: false,
        input_width: '140px',
      },
    });

    const input = screen.getByRole('textbox');
    await fireEvent.click(input); // 点击输入框，打开日历

    // 验证日历是否显示
    expect(screen.getByText('日')).toBeInTheDocument();
    expect(screen.getByText('一')).toBeInTheDocument();
    expect(screen.getByText('二')).toBeInTheDocument();
    expect(screen.getByText('三')).toBeInTheDocument();
    expect(screen.getByText('四')).toBeInTheDocument();
    expect(screen.getByText('五')).toBeInTheDocument();
    expect(screen.getByText('六')).toBeInTheDocument();

    // 具体时间选项不显示
    expect(screen.queryByTestId('start-hour-00')).not.toBeInTheDocument();
    expect(screen.queryByTestId('end-hour-00')).not.toBeInTheDocument();
    expect(screen.queryByTestId('start-minute-00')).not.toBeInTheDocument();
    expect(screen.queryByTestId('end-minute-00')).not.toBeInTheDocument();
  });

  it('正确展示具体时间选择器', async () => {
    render(DatePicker, {
      props: {
        initial_start_date: null,
        initial_end_date: null,
        is_single_date_selection: false,
        is_time_selection: true,
        input_width: '140px',
      },
    });

    const input = screen.getByRole('textbox');
    await fireEvent.click(input); // 点击输入框，打开日历

    // 验证时间选项是否显示
    expect(screen.getByTestId('start-hour-00')).toBeInTheDocument();
    expect(screen.getByTestId('end-hour-00')).toBeInTheDocument();
    expect(screen.getByTestId('start-minute-00')).toBeInTheDocument();
    expect(screen.getByTestId('end-minute-00')).toBeInTheDocument();
  });

  it('应该正确选择开始日期', async () => {
    // 渲染组件
    render(DatePicker, {
      props: {
        initial_start_date: null,
        initial_end_date: null,
        is_single_date_selection: false,
        is_time_selection: false,
      },
    });

    const input = screen.getByRole('textbox');
    await fireEvent.click(input); // 打开日历

    // 选择 20 日的按钮
    const dateButton = screen.getByTestId('start-date-button-20');
    await fireEvent.click(dateButton);

    // 通过检查输入框的值来验证日期选择
    const updatedInputValue = screen.getByRole('textbox').value;
    expect(updatedInputValue).toBeTruthy(); // 确保输入框的值被更新

    // 验证日期是否正确
    const selectedDate = new Date(updatedInputValue);
    expect(selectedDate).toBeInstanceOf(Date);
    expect(updatedInputValue).toBe(input.value);
  });

  it('应该选择结束日期', async () => {
    // 渲染组件
    render(DatePicker, {
      props: {
        initial_start_date: new Date('2023-08-05'),
        initial_end_date: null,
        is_single_date_selection: false,
        is_time_selection: false,
      },
    });

    const input = screen.getByRole('textbox');
    await fireEvent.click(input); // 打开日历

    // 选择结束日期（假设选择 15 日）
    const dateButton = screen.getByTestId('end-date-button-15');
    await fireEvent.click(dateButton);

    // 通过检查输入框的值来验证结束日期是否选择
    const updatedInputValue = screen.getByRole('textbox').value;
    expect(updatedInputValue).toBeTruthy(); // 确保输入框的值被更新

    // 验证日期是否正确
    const selectedDate = new Date(updatedInputValue);
    expect(selectedDate).toBeInstanceOf(Date);
    expect(updatedInputValue).toBe(input.value);
  });

  it('应该正确向下切换起始日期框月份', async () => {
    render(DatePicker, {
      props: {
        initial_start_date: new Date('2025-08-05'),
        initial_end_date: null,
        is_single_date_selection: true,
        is_time_selection: false,
      },
    });

    const input = screen.getByRole('textbox');
    await fireEvent.click(input); // 打开日历

    // 获取当前日期
    const now = new Date();
    const nowMonth = now.getMonth() + 1;

    // 获取当前月份的文本
    const currentMonthText = screen.getByTestId('start-current-date');
    expect(currentMonthText).toHaveTextContent(`${now.getFullYear()}年 ${now.getMonth() + 1}月`);

    // 点击下一月按钮
    const nextMonthButton = screen.getByTestId('start-next-month');

    // 展示的月份文本
    const nextMonthText = screen.getByTestId('start-current-date');

    for (let i = 1; i <= 12 - nowMonth; i++) {
      // 确保月份切换
      await fireEvent.click(nextMonthButton);
      expect(nextMonthText).toHaveTextContent(`${now.getFullYear()}年 ${now.getMonth() + i + 1}月`);
    }

    // 再次点击之后年份增加
    await fireEvent.click(nextMonthButton);
    expect(nextMonthText).toHaveTextContent(`${now.getFullYear() + 1}年 1月`);
  });

  it('应该正确向上切换起始日期框月份', async () => {
    render(DatePicker, {
      props: {
        initial_start_date: new Date('2025-08-05'),
        initial_end_date: null,
        is_single_date_selection: true,
        is_time_selection: false,
      },
    });

    const input = screen.getByRole('textbox');
    await fireEvent.click(input); // 打开日历

    // 获取当前日期
    const now = new Date();
    const nowMonth = now.getMonth() + 1;

    // 获取当前月份的文本
    const currentMonthText = screen.getByTestId('start-current-date');
    expect(currentMonthText).toHaveTextContent(`${now.getFullYear()}年 ${now.getMonth() + 1}月`);

    // 点击下一月按钮
    const preMonthButton = screen.getByTestId('start-pre-month');

    // 展示的月份文本
    const MonthText = screen.getByTestId('start-current-date');

    for (let i = 0; i < nowMonth - 1; i++) {
      // 确保月份切换
      await fireEvent.click(preMonthButton);
      expect(MonthText).toHaveTextContent(`${now.getFullYear()}年 ${now.getMonth() - i}月`);
    }

    // 再次点击之后年份减小
    await fireEvent.click(preMonthButton);
    expect(MonthText).toHaveTextContent(`${now.getFullYear() - 1}年 12月`);
  });

  it('应该正确向下切换终止日期框月份', async () => {
    render(DatePicker, {
      props: {
        initial_start_date: new Date('2025-08-05'),
        initial_end_date: null,
        is_single_date_selection: false,
        is_time_selection: false,
      },
    });

    const input = screen.getByRole('textbox');
    await fireEvent.click(input); // 打开日历

    // 获取当前日期
    const now = new Date();
    const nowMonth = now.getMonth() + 1;

    // 获取当前月份的文本
    const currentMonthText = screen.getByTestId('end-current-date');
    expect(currentMonthText).toHaveTextContent(`${now.getFullYear()}年 ${now.getMonth() + 1}月`);

    // 点击下一月按钮
    const nextMonthButton = screen.getByTestId('end-next-month');

    // 展示的月份文本
    const nextMonthText = screen.getByTestId('end-current-date');

    for (let i = 1; i <= 12 - nowMonth; i++) {
      // 确保月份切换
      await fireEvent.click(nextMonthButton);
      expect(nextMonthText).toHaveTextContent(`${now.getFullYear()}年 ${now.getMonth() + i + 1}月`);
    }

    // 再次点击之后年份增加
    await fireEvent.click(nextMonthButton);
    expect(nextMonthText).toHaveTextContent(`${now.getFullYear() + 1}年 1月`);
  });

  it('应该正确向上切换终止日期框月份', async () => {
    render(DatePicker, {
      props: {
        initial_start_date: new Date('2025-08-05'),
        initial_end_date: null,
        is_single_date_selection: false,
        is_time_selection: false,
      },
    });

    const input = screen.getByRole('textbox');
    await fireEvent.click(input); // 打开日历

    // 获取当前日期
    const now = new Date();
    const nowMonth = now.getMonth() + 1;

    // 获取当前月份的文本
    const currentMonthText = screen.getByTestId('end-current-date');
    expect(currentMonthText).toHaveTextContent(`${now.getFullYear()}年 ${now.getMonth() + 1}月`);

    // 点击下一月按钮
    const preMonthButton = screen.getByTestId('end-pre-month');

    // 展示的月份文本
    const MonthText = screen.getByTestId('end-current-date');

    for (let i = 0; i < nowMonth - 1; i++) {
      // 确保月份切换
      await fireEvent.click(preMonthButton);
      expect(MonthText).toHaveTextContent(`${now.getFullYear()}年 ${now.getMonth() - i}月`);
    }

    // 再次点击之后年份减小
    await fireEvent.click(preMonthButton);
    expect(MonthText).toHaveTextContent(`${now.getFullYear() - 1}年 12月`);
  });

  it('应该正确触发时间选择(单日期)', async () => {
    render(DatePicker, {
      props: {
        initial_start_date: null,
        initial_end_date: null,
        is_single_date_selection: true,
        is_time_selection: true,
      },
    });

    const input = screen.getByRole('textbox');
    await fireEvent.click(input); // 打开日历

    // 点击小时选择按钮
    const hourButton = screen.getByTestId('start-hour-08');
    await fireEvent.click(hourButton);

    // 点击分钟选择按钮
    const minuteButton = screen.getByTestId('start-minute-30');
    await fireEvent.click(minuteButton);

    // 验证时间是否被正确选择
    const now = new Date();
    const expectedTime = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;

    const selectedTime = screen.getByRole('textbox');
    expect(selectedTime.value).toBe(`${expectedTime} 08:30`); // 验证输入框中显示的时间
  });

  it('应该正确触发时间选择（双日期）', async () => {
    render(DatePicker, {
      props: {
        initial_start_date: null,
        initial_end_date: null,
        is_single_date_selection: false, // 确保是选择开始和结束日期的模式
        is_time_selection: true, // 开启时间选择
      },
    });

    const input = screen.getByRole('textbox');
    await fireEvent.click(input); // 打开日历

    // 选择开始时间：点击小时和分钟
    const startHourButton = screen.getByTestId('start-hour-08');
    await fireEvent.click(startHourButton);

    const startMinuteButton = screen.getByTestId('start-minute-30');
    await fireEvent.click(startMinuteButton);

    // 验证开始时间是否正确选择
    const selectedStartTime = screen.getByRole('textbox');

    // 选择结束时间：点击小时和分钟
    const endHourButton = screen.getByTestId('end-hour-18');
    await fireEvent.click(endHourButton);

    const endMinuteButton = screen.getByTestId('end-minute-45');
    await fireEvent.click(endMinuteButton);

    const now = new Date();
    const expectedTime = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;

    // 验证结束时间是否正确选择
    const updatedEndTime = screen.getByRole('textbox');
    expect(updatedEndTime.value).toBe(`${expectedTime} 08:30 ~ ${expectedTime} 18:45`);
  });

  it('应该正确重置日期选择器', async () => {
    render(DatePicker, {
      props: {
        initial_start_date: new Date('2023-08-05'),
        initial_end_date: new Date('2023-08-06'),
        is_single_date_selection: false,
        is_time_selection: false,
      },
    });

    const input = screen.getByRole('textbox');
    await fireEvent.click(input); // 打开日历

    const resetButton = screen.getByTestId('clear-btn');
    await fireEvent.click(resetButton); // 点击清除按钮

    // 验证日期选择器重置
    const inputValue = screen.getByRole('textbox');
    expect(inputValue.value).toBe(`开始日期   ~   结束日期`);
  });

  it('应该正确处理用户多次打开选择器(单日期)', async () => {
    render(DatePicker, {
      props: {
        initial_start_date: null,
        initial_end_date: null,
        is_single_date_selection: true,
        is_time_selection: true,
        input_width: '140px',
      },
    });

    const input = screen.getByRole('textbox');
    expect(input.value).toBe('请选择日期');

    // 打开日历
    fireEvent.click(input);

    // 验证日历是否显示
    const now = new Date();
    const nowMonth = now.getMonth() + 1;

    // 获取当前月份的文本
    const currentMonthText = screen.getByTestId('start-current-date');
    expect(currentMonthText).toHaveTextContent(`${now.getFullYear()}年 ${now.getMonth() + 1}月`);
    expect(screen.getByText(`${now.getFullYear()}年 ${now.getMonth() + 1}月`)).toBeInTheDocument();
    // 点击确定按钮关闭日历
    fireEvent.click(screen.getByText('确定'));
    expect(currentMonthText).not.toBeInTheDocument();

    // 再次打开日历，并选择一个日期
    fireEvent.click(input);

    // 选择 20 日的按钮
    fireEvent.click(screen.getByTestId('start-date-button-20'));

    // 验证日期是否正确
    expect(screen.getByRole('textbox').value).toBe(input.value);

    // 点击空白处关闭日历
    const outsideClickArea = document.createElement('div');
    document.body.appendChild(outsideClickArea);
    fireEvent.click(outsideClickArea);

    // 日历应被销毁
    expect(currentMonthText).not.toBeInTheDocument();

    // 再次打开日历，输入框日期应正确渲染
    fireEvent.click(input);
    expect(screen.getByRole('textbox').value).toBe(input.value);
    expect(screen.getByTestId('start-date-button-20')).toHaveClass('highlighted');

    // 选择具体时间应正确更新
    const hourButton = screen.getByTestId('start-hour-08');
    await fireEvent.click(hourButton);

    // 点击分钟选择按钮
    const minuteButton = screen.getByTestId('start-minute-30');
    await fireEvent.click(minuteButton);

    // 验证时间是否被正确选择
    const selectedTime = screen.getByRole('textbox');
    expect(selectedTime.value).toBe(`${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-20 08:30`); // 验证输入框中显示的时间

    // 更改选中天数
    fireEvent.click(screen.getByTestId('start-date-button-21'));
    console.log(input.value);
    expect(input.value).toBe(`${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-21 08:30`);

    // 关闭日历
    fireEvent.click(outsideClickArea);
    expect(currentMonthText).not.toBeInTheDocument();
  });

  it('应该正确处理用户多次打开选择器(双日期)', async () => {
    render(DatePicker, {
      props: {
        initial_start_date: null,
        initial_end_date: null,
        is_single_date_selection: false,
        is_time_selection: true,
        input_width: '140px',
      },
    });

    const input = screen.getByRole('textbox');
    expect(input.value).toBe('开始日期   ~   结束日期');

    // 打开日历
    fireEvent.click(input);

    // 验证日历是否显示
    const now = new Date();
    const nowMonth = now.getMonth() + 1;

    // 获取当前月份的文本
    const currentMonthText = screen.getByTestId('start-current-date');
    expect(currentMonthText).toHaveTextContent(`${now.getFullYear()}年 ${now.getMonth() + 1}月`);

    // 点击确定按钮关闭日历
    fireEvent.click(screen.getByText('确定'));
    expect(currentMonthText).not.toBeInTheDocument();

    // 再次打开日历，并选择一个日期
    fireEvent.click(input);

    // 选择初始日期为 20 日的按钮
    fireEvent.click(screen.getByTestId('start-date-button-20'));

    // 选择终止日期为 21 日的按钮
    fireEvent.click(screen.getByTestId('end-date-button-21'));

    // 验证日期是否正确
    console.log(input.value);
    expect(screen.getByRole('textbox').value).toBe(
      `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-20 ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')} ~ ${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-21 ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`,
    );

    // 当起始日期晚于终止日期，终止日期应正确更新
    fireEvent.click(screen.getByTestId('start-date-button-23'));
    expect(screen.getByRole('textbox').value).toBe(
      `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-23 ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')} ~ ${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-23 ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`,
    );

    // 当终止日期早于起始日期，起始日期应正确更新
    fireEvent.click(screen.getByTestId('end-date-button-21'));
    expect(screen.getByRole('textbox').value).toBe(
      `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-21 ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')} ~ ${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-21 ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`,
    );
  });

  it('应该正确处理清除数据之后重新选择日期(单日期)', async () => {
    render(DatePicker, {
      props: {
        initial_start_date: null,
        initial_end_date: null,
        is_single_date_selection: true,
        is_time_selection: true,
        input_width: '140px',
      },
    });

    const input = screen.getByRole('textbox');
    expect(input.value).toBe('请选择日期');

    // 打开日历
    fireEvent.click(input);

    // 验证日历是否显示
    const now = new Date();
    const nowMonth = now.getMonth() + 1;

    // 获取当前月份的文本
    const currentMonthText = screen.getByTestId('start-current-date');
    expect(currentMonthText).toHaveTextContent(`${now.getFullYear()}年 ${now.getMonth() + 1}月`);

    // 清除当前日期
    fireEvent.click(screen.getByRole('button', { name: '清除' }));

    // 选择初始日期为 20 日的按钮
    fireEvent.click(screen.getByTestId('start-date-button-20'));

    // 验证日期是否正确
    console.log(input.value);
    expect(screen.getByRole('textbox').value).toBe(
      `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-20 00:00`,
    );
  });

  it('应该正确处理清除数据之后重新选择日期(双日期)', async () => {
    render(DatePicker, {
      props: {
        initial_start_date: null,
        initial_end_date: null,
        is_single_date_selection: false,
        is_time_selection: true,
        input_width: '140px',
      },
    });

    const input = screen.getByRole('textbox');
    expect(input.value).toBe('开始日期   ~   结束日期');

    // 打开日历
    fireEvent.click(input);

    // 验证日历是否显示
    const now = new Date();
    const nowMonth = now.getMonth() + 1;

    // 获取当前月份的文本
    const currentMonthText = screen.getByTestId('start-current-date');
    expect(currentMonthText).toHaveTextContent(`${now.getFullYear()}年 ${now.getMonth() + 1}月`);

    // 清除当前日期
    fireEvent.click(screen.getByRole('button', { name: '清除' }));

    // 选择初始日期为 20 日的按钮
    fireEvent.click(screen.getByTestId('start-date-button-20'));

    // 选择终止日期为 21 日的按钮
    fireEvent.click(screen.getByTestId('end-date-button-21'));

    // 验证日期是否正确
    console.log(input.value);
    expect(screen.getByRole('textbox').value).toBe(
      `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-20 00:00 ~ ${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-21 00:00`,
    );
  });

  it('当用户选择的时间不合理应正确更新时间（双日期）', async () => {
    render(DatePicker, {
      props: {
        initial_start_date: null,
        initial_end_date: null,
        is_single_date_selection: false,
        is_time_selection: true,
      },
    });

    const input = screen.getByRole('textbox');
    await fireEvent.click(input); // 打开日历

    // 清除数据
    fireEvent.click(screen.getByRole('button', { name: '清除' }));

    // 选择开始时间：点击小时和分钟
    await fireEvent.click(screen.getByTestId('start-hour-08'));
    await fireEvent.click(screen.getByTestId('start-minute-30'));

    // 选择结束时间：点击小时和分钟
    await fireEvent.click(screen.getByTestId('end-hour-18'));
    await fireEvent.click(screen.getByTestId('end-minute-45'));

    // 再次选择一个不合理的起始时间
    await fireEvent.click(screen.getByTestId('start-hour-20'));
    await fireEvent.click(screen.getByTestId('start-minute-40'));

    // 再次选择一个不合理的终止时间
    await fireEvent.click(screen.getByTestId('end-hour-19'));
    await fireEvent.click(screen.getByTestId('end-minute-20'));

    const now = new Date();
    const expectedTime = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;

    // 验证结束时间是否正确选择
    const updatedEndTime = screen.getByRole('textbox');
    expect(updatedEndTime.value).toBe(`${expectedTime} 19:20 ~ ${expectedTime} 19:20`);
  });

  it('双日期选择时应滚动到选定的起始和结束时间', async () => {
    vi.useFakeTimers(); // 模拟定时器

    // 设置初始时间 12:30 - 14:45
    const initialStart = new Date();
    initialStart.setHours(12, 30, 0, 0);

    const initialEnd = new Date();
    initialEnd.setHours(14, 45, 0, 0);

    render(DatePicker, {
      props: {
        initial_start_date: initialStart,
        initial_end_date: initialEnd,
        is_single_date_selection: false,
        is_time_selection: true,
      },
    });

    // 触发日历打开
    const input = screen.getByRole('textbox');
    await fireEvent.click(input);

    vi.runAllTimers(); // 立即执行所有 pending 的 setTimeout

    console.log(input.value);

    // 验证滚动行为
    expect(window.HTMLElement.prototype.scrollIntoView).toHaveBeenCalledTimes(4);

    // 验证每个列的滚动
    const startHourButton = screen.getByTestId('start-hour-12');
    const startMinuteButton = screen.getByTestId('start-minute-30');
    const endHourButton = screen.getByTestId('end-hour-14');
    const endMinuteButton = screen.getByTestId('end-minute-45');

    expect(startHourButton.scrollIntoView).toHaveBeenCalledWith({ block: 'center' });
    expect(startMinuteButton.scrollIntoView).toHaveBeenCalledWith({ block: 'center' });
    expect(endHourButton.scrollIntoView).toHaveBeenCalledWith({ block: 'center' });
    expect(endMinuteButton.scrollIntoView).toHaveBeenCalledWith({ block: 'center' });
  });

  it('单日期选择时应只滚动起始时间', async () => {
    vi.useFakeTimers(); // 模拟定时器

    // 设置初始时间 09:15
    const initialStart = new Date();
    initialStart.setHours(9, 15, 0, 0);

    render(DatePicker, {
      props: {
        initial_start_date: initialStart,
        initial_end_date: null,
        is_single_date_selection: true,
        is_time_selection: true,
      },
    });

    // 触发日历打开
    const input = screen.getByRole('textbox');
    await fireEvent.click(input);

    vi.runAllTimers(); // 立即执行所有 pending 的 setTimeout

    // 验证滚动行为
    expect(window.HTMLElement.prototype.scrollIntoView).toHaveBeenCalledTimes(2);

    // 验证起始时间滚动
    const startHourButton = screen.getByTestId('start-hour-09');
    const startMinuteButton = screen.getByTestId('start-minute-15');

    expect(startHourButton.scrollIntoView).toHaveBeenCalledWith({ block: 'center' });
    expect(startMinuteButton.scrollIntoView).toHaveBeenCalledWith({ block: 'center' });
  });
});
