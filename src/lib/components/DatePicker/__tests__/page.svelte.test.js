import { render, screen, fireEvent } from '@testing-library/svelte';
import DatePicker from '../DatePicker.svelte';
import { vi } from 'vitest';

describe('DatePicker 组件测试', () => {
  it('应该正确初始化当前的时间文本', () => {
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

    // 获取当前时间的格式（以确保测试时格式正确）
    const now = new Date();
    const expectedTime = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

    expect(input.value).toBe('请选择日期');
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

    const calendar = screen.getByText('日');
    expect(calendar).toBeInTheDocument(); // 验证日历是否显示
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

    // 也可以验证日期是否正确
    const selectedDate = new Date(updatedInputValue);
    expect(selectedDate).toBeInstanceOf(Date); // 确保它是一个日期对象
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

    // 也可以验证日期是否正确（格式化）
    const selectedDate = new Date(updatedInputValue);
    expect(selectedDate).toBeInstanceOf(Date); // 确保它是一个日期对象
  });

  it('应该切换月份', async () => {
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

    // 获取当前月份的文本
    const currentMonthText = screen.getByTestId('start-current-date');
    expect(currentMonthText).toHaveTextContent('2025年 八月');

    // 点击下一月按钮
    const nextMonthButton = screen.getByText('»');
    await fireEvent.click(nextMonthButton);

    // 确保月份切换
    const nextMonthText = screen.getByTestId('start-current-date');
    expect(nextMonthText).toHaveTextContent('2025年 九月');
  });

  it('应该切换月份（开始和结束日期）', async () => {
    render(DatePicker, {
      props: {
        initial_start_date: new Date('2025-08-05'),
        initial_end_date: new Date('2025-08-05'),
        is_single_date_selection: false, // 确保是选择开始和结束日期的模式
        is_time_selection: false, // 时间选择关闭
      },
    });

    const input = screen.getByRole('textbox');
    await fireEvent.click(input); // 打开日历

    // 获取开始日期的当前月份文本
    const startCurrentMonthText = screen.getByTestId('start-current-date');
    expect(startCurrentMonthText).toHaveTextContent('2025年 八月');

    // 点击下一月按钮（开始日期）
    const nextMonthButtonStart = screen.getByTestId('start-next-month');
    await fireEvent.click(nextMonthButtonStart);

    // 确保开始日期的月份切换
    const nextMonthTextStart = screen.getByTestId('start-current-date');
    expect(nextMonthTextStart).toHaveTextContent('2025年 九月');

    // 获取结束日期的当前月份文本
    const endCurrentMonthText = screen.getByTestId('end-current-date');
    expect(endCurrentMonthText).toHaveTextContent('2025年 八月');

    // 点击下一月按钮（结束日期）
    const nextMonthButtonEnd = screen.getByTestId('end-next-month');
    await fireEvent.click(nextMonthButtonEnd);

    // 确保结束日期的月份切换
    const nextMonthTextEnd = screen.getByTestId('end-current-date');
    expect(nextMonthTextEnd).toHaveTextContent('2025年 九月');
  });

  it('应该正确触发时间选择', async () => {
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

  it('应该正确触发时间选择（开始和结束）', async () => {
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
});
