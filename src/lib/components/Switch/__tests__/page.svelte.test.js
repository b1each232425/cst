import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/svelte';
import Switch from '../Switch.svelte';

describe('Switch 组件测试', () => {
  let is_checked = false;
  let handleClickSwitchButton;

  beforeEach(() => {
    // 在每个测试前，清空所有的模拟
    vi.restoreAllMocks();

    handleClickSwitchButton = vi.fn(() => {
      is_checked = !is_checked;
    });
  });

  /**
   * 测试 is_checked 参数
   */
  it('is_checked 参数为布尔值时，组件正常渲染', () => {
    render(Switch, { props: { is_checked: true } });
    const switchElement = screen.getByTestId('switch-ball');
    expect(switchElement).toHaveClass('checked');
  });

  it('is_checked 参数不是布尔值时，应输出警告并使用默认值 false', () => {
    const spy = vi.spyOn(console, 'warn');
    render(Switch, { props: { is_checked: 'true' } }); // 传入字符串
    expect(spy).toHaveBeenCalledWith('[Switch] is_checked 必须是布尔值，当前为 string');
    const switchElement = screen.getByTestId('switch-ball');
    expect(switchElement).toHaveClass('unchecked');
  });

  /**
   * 测试 ball_color 参数
   */
  it('ball_color 参数为字符串时，组件正常渲染', () => {
    render(Switch, { props: { ball_color: 'blue' } });
    const ballElement = screen.getByTestId('switch-ball');
    expect(ballElement.style.getPropertyValue('--ball-color')).toBe('blue');
  });

  it('ball_color 参数不是字符串时，应输出警告并使用默认值 white', () => {
    const spy = vi.spyOn(console, 'warn');
    render(Switch, { props: { ball_color: 123 } }); // 传入数字
    expect(spy).toHaveBeenCalledWith('[Switch] ball_color 必须是字符串，当前为 number');
    const ballElement = screen.getByTestId('switch-ball');
    expect(ballElement.style.getPropertyValue('--ball-color')).toBe('white');
  });

  /**
   * 测试 checked_background_color 参数
   */
  it('checked_background_color 参数为字符串时，组件正常渲染', () => {
    render(Switch, { props: { checked_background_color: '#ff0000', is_checked: true } });
    const switchElement = screen.getByRole('button');
    expect(switchElement.style.getPropertyValue('--background-color')).toBe('#ff0000');
  });

  it('checked_background_color 参数不是字符串时，应输出警告并使用默认值 #4a90e2', () => {
    const spy = vi.spyOn(console, 'warn');
    render(Switch, { props: { checked_background_color: 456, is_checked: true } }); // 传入数字
    expect(spy).toHaveBeenCalledWith('[Switch] checked_background_color 必须是字符串，当前为 number');
    const switchElement = screen.getByRole('button');
    expect(switchElement.style.getPropertyValue('--background-color')).toBe('#4a90e2');
  });

  /**
   * 测试 unchecked_background_color 参数
   */
  it('unchecked_background_color 参数为字符串时，组件正常渲染', () => {
    render(Switch, { props: { unchecked_background_color: '#ccc' } });
    const switchElement = screen.getByRole('button');
    expect(switchElement.style.getPropertyValue('--background-color')).toBe('#ccc');
  });

  it('unchecked_background_color 参数不是字符串时，应输出警告并使用默认值 #ccc', () => {
    const spy = vi.spyOn(console, 'warn');
    render(Switch, { props: { unchecked_background_color: true } }); // 传入布尔值
    expect(spy).toHaveBeenCalledWith('[Switch] unchecked_background_color 必须是字符串，当前为 boolean');
    const switchElement = screen.getByRole('button');
    expect(switchElement.style.getPropertyValue('--background-color')).toBe('#ccc');
  });

  /**
   * 测试 left_text 参数
   */
  it('left_text 参数为字符串时，组件正常渲染', () => {
    render(Switch, { props: { left_text: '关闭' } });
    const leftTextElement = screen.getByText('关闭');
    expect(leftTextElement).toBeInTheDocument();
  });

  it('left_text 参数不是字符串时，应输出警告并使用默认值 Off', () => {
    const spy = vi.spyOn(console, 'warn');
    render(Switch, { props: { left_text: 123 } }); // 传入数字
    expect(spy).toHaveBeenCalledWith('[Switch] left_text 必须是字符串，当前为 number');
    const leftTextElement = screen.getByText('Off');
    expect(leftTextElement).toBeInTheDocument();
  });

  /**
   * 测试 right_text 参数
   */
  it('right_text 参数为字符串时，组件正常渲染', () => {
    render(Switch, { props: { right_text: '开启' } });
    const rightTextElement = screen.getByText('开启');
    expect(rightTextElement).toBeInTheDocument();
  });

  it('right_text 参数不是字符串时，应输出警告并使用默认值 On', () => {
    const spy = vi.spyOn(console, 'warn');
    render(Switch, { props: { right_text: true } }); // 传入布尔值
    expect(spy).toHaveBeenCalledWith('[Switch] right_text 必须是字符串，当前为 boolean');
    const rightTextElement = screen.getByText('On');
    expect(rightTextElement).toBeInTheDocument();
  });

  /**
   * 测试 width 参数
   */
  it('width 参数为有效的 CSS 长度单位时，组件正常渲染', () => {
    render(Switch, { props: { width: '100px' } });
    const switchElement = screen.getByRole('button');
    expect(switchElement.style.getPropertyValue('--button-width')).toBe('100px');
  });

  it('width 参数不是有效的 CSS 长度单位时，应输出警告并使用默认值 80px', () => {
    const spy = vi.spyOn(console, 'warn');
    render(Switch, { props: { width: 100 } }); // 传入数字
    expect(spy).toHaveBeenCalledWith('[Switch] width 必须是有效的 CSS 长度单位，当前为 number');
    const switchElement = screen.getByRole('button');
    expect(switchElement.style.getPropertyValue('--button-width')).toBe('80px');
  });

  /**
   * 测试 clickSwitchButton 参数
   */
  it('clickSwitchButton 参数为函数时，组件正常渲染', () => {
    const handleClick = vi.fn();
    render(Switch, { props: { clickSwitchButton: handleClick } });
    const buttonElement = screen.getByRole('button');
    fireEvent.click(buttonElement);
    expect(handleClick).toHaveBeenCalled();
  });

  it('clickSwitchButton 参数不是函数时，应输出警告并使用默认空函数', () => {
    const spy = vi.spyOn(console, 'warn');
    render(Switch, { props: { clickSwitchButton: 'click' } }); // 传入字符串
    expect(spy).toHaveBeenCalledWith('[Switch] clickSwitchButton 必须是函数，当前为 string');
    const handleClick = vi.fn();
    const buttonElement = screen.getByRole('button');
    fireEvent.click(buttonElement);
    expect(handleClick).not.toHaveBeenCalled();
  });

  it('应该渲染正确的左侧文本和右侧文本', async () => {
    render(Switch, {
      props: {
        is_checked,
        left_text: '关闭',
        right_text: '开启',
      },
    });

    // 检查左侧文本
    expect(screen.getByText('关闭')).toBeInTheDocument();
    // 检查右侧文本
    expect(screen.getByText('开启')).toBeInTheDocument();
  });

  it('应该正确设置 --background-color', async () => {
    render(Switch, {
      props: {
        is_checked: true,
        checked_background_color: '#4a90e2',
        unchecked_background_color: '#ccc',
      },
    });

    const switchButton = screen.getByRole('button');
    const bgColorVar = switchButton.style.getPropertyValue('--background-color');
    expect(bgColorVar).toBe('#4a90e2');
  });

  it('应该在 is_checked 为 false 时应用关闭状态的背景色', async () => {
    render(Switch, {
      props: {
        is_checked: false,
        checked_background_color: '#4a90e2',
        unchecked_background_color: '#ccc',
      },
    });

    // 通过查询 switch 的背景色来验证状态
    const switchButton = screen.getByRole('button');
    const bgColorVar = switchButton.style.getPropertyValue('--background-color');
    expect(bgColorVar).toBe('#ccc');
  });

  it('应该切换 is_checked 状态并调用 clickSwitchButton 事件', async () => {
    const { rerender } = render(Switch, {
      props: {
        is_checked,
        clickSwitchButton: handleClickSwitchButton,
      },
    });

    // 初始状态检查
    expect(is_checked).toBe(false);
    expect(handleClickSwitchButton).not.toHaveBeenCalled();

    // 触发点击事件
    const switchButton = screen.getByRole('button');
    await fireEvent.click(switchButton);

    // 检查状态更新
    expect(is_checked).toBe(true);
    expect(handleClickSwitchButton).toHaveBeenCalledTimes(1);

    // 更新 props，重新渲染
    rerender({ is_checked, clickSwitchButton: handleClickSwitchButton });
    expect(is_checked).toBe(true); // 确保 is_checked 状态已更新
  });

  it('应该根据给定的 ball_color 应用白球颜色', async () => {
    render(Switch, {
      props: {
        is_checked: true,
        ball_color: 'red',
      },
    });

    // 通过 testid 查询
    const ball = screen.getByTestId('switch-ball');
    expect(ball.style.getPropertyValue('--ball-color')).toBe('red');
  });

  it('应该根据给定的 width 控制开关宽度', async () => {
    render(Switch, {
      props: {
        is_checked,
        width: '100px',
      },
    });

    // 检查开关的宽度
    const switchButton = screen.getByRole('button');
    expect(switchButton.style.getPropertyValue('--button-width')).toBe('100px');
  });

  it('应该正确计算并显示文本的大小', async () => {
    render(Switch, {
      props: {
        is_checked,
        width: '100px',
      },
    });

    // 获取左右文本的字体大小
    const leftText = screen.getByText('Off'); // 默认是 "Off"
    const rightText = screen.getByText('On'); // 默认是 "On"

    // 验证文本的大小（根据给定的宽度，预计字体大小为 20px）
    expect(leftText.style.getPropertyValue('--left-size')).toBe('20px');
    expect(rightText.style.getPropertyValue('--right-size')).toBe('20px');
  });
});
