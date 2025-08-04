import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/svelte';
import Switch from '../Switch.svelte';

describe('Switch 组件测试', () => {
  let is_checked = false;
  let handleClickSwitchButton;

  beforeEach(() => {
    handleClickSwitchButton = vi.fn(() => {
      is_checked = !is_checked;
    });
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
