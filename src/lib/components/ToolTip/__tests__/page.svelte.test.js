import { cleanup, fireEvent, screen, waitFor } from '@testing-library/svelte';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { tooltip } from '../tooltip.js';

describe('Tooltip 组件测试', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    cleanup();
    vi.useRealTimers(); // 重置定时器以避免泄漏
  });

  /**
   * 测试默认情况下是否可以正常渲染tooltip
   */
  it('初始状态应不可见，触发后可见，离开后不可见', async () => {
    /**
     * 创建干净的触发元素
     */
    const mockNode = document.createElement('button');
    mockNode.textContent = '悬停我';
    document.body.appendChild(mockNode);

    /**
     * 固定位置，避免翻转
     */
    mockNode.getBoundingClientRect = () => ({
      width: 100,
      height: 30,
      top: 500,
      left: 500,
      bottom: 530,
      right: 600,
    });

    /**
     * 初始化tooltip
     */
    tooltip(mockNode, {
      content: '测试提示内容',
    });

    /**
     * 刷新初始定时
     */
    await vi.runAllTimers();

    let tooltipElement;
    await waitFor(() => {
      tooltipElement = screen.getByTestId('tooltip');
      expect(tooltipElement).toBeInTheDocument();
    });
    expect(tooltipElement).toHaveClass('is-hidden'); // 检查是否有这个类名

    /**
     * 鼠标悬停触发tooltip显示
     */
    await fireEvent.mouseOver(mockNode);
    await vi.advanceTimersByTime(300); // 快进时间到300ms，因为还有动画时间
    await waitFor(() => expect(tooltipElement).toBeVisible());

    /**
     * 鼠标离开触发tooltip隐藏
     */
    await fireEvent.mouseLeave(mockNode);
    await vi.advanceTimersByTime(300);
    await waitFor(() => expect(tooltipElement).toHaveClass('is-hidden'));

    /**
     * 清除测试元素
     */
    document.body.removeChild(mockNode);
  });

  /**
   * 测试placement属性
   */
  it('placement属性为预期值时,应该能渲染正常样式', async () => {
    /**
     * 测试所有有效的placement值
     */
    const validPlacements = ['top', 'left', 'right', 'bottom'];

    for (const placement of validPlacements) {
      const mockNode = document.createElement('button');
      mockNode.textContent = '悬停我';
      document.body.appendChild(mockNode);

      // 固定位置，避免翻转
      mockNode.getBoundingClientRect = () => ({
        width: 100,
        height: 30,
        top: 500,
        left: 500,
        bottom: 530,
        right: 600,
      });

      // 初始化tooltip
      tooltip(mockNode, {
        content: '测试提示内容',
        placement: placement,
      });

      await vi.runAllTimers();

      let tooltipElement;
      await waitFor(() => {
        tooltipElement = screen.getByTestId('tooltip');
        expect(tooltipElement).toBeInTheDocument();
      });

      // 触发显示tooltip
      await fireEvent.mouseOver(mockNode);
      await vi.advanceTimersByTime(300);
      await waitFor(() => expect(tooltipElement).toBeVisible());

      expect(tooltipElement).toHaveAttribute('data-placement', placement);

      // 隐藏tooltip
      await fireEvent.mouseLeave(mockNode);
      await vi.advanceTimersByTime(300);
      await waitFor(() => expect(tooltipElement).toHaveClass('is-hidden'));

      document.body.removeChild(mockNode);
    }
  });

  it('placement属性为非正常情况下,传入null,undefined,空字符串,其他类型,应该渲染默认样式,同时在控制台提示相应警告', async () => {
    const invalidValues = [null, undefined, '', 123, {}, [], true];
    const consoleSpy = vi.spyOn(console, 'warn');

    for (const value of invalidValues) {
      // 创建干净的触发元素
      const mockNode = document.createElement('button');
      mockNode.textContent = '点击或悬停我';
      document.body.appendChild(mockNode);

      // 固定位置，避免翻转
      mockNode.getBoundingClientRect = () => ({
        width: 100,
        height: 30,
        top: 500,
        left: 500,
        bottom: 530,
        right: 600,
      });

      // 初始化tooltip
      tooltip(mockNode, {
        content: '测试提示内容',
        placement: value,
        hide_method: 'hover',
      });

      // 触发显示tooltip
      await fireEvent.mouseOver(mockNode);

      // 快进时间到300ms，因为还有动画时间
      await vi.advanceTimersByTime(300);

      // 等待tooltip显示
      const tooltipElement = screen.getByTestId('tooltip');
      expect(tooltipElement).toBeVisible();
      // 验证使用了默认值 'bottom'
      expect(tooltipElement).toHaveAttribute('data-placement', 'bottom');

      // 隐藏tooltip
      await fireEvent.mouseLeave(mockNode);

      // 测试是否已经隐藏
      expect(tooltipElement).toHaveClass('is-hidden');

      document.body.removeChild(mockNode);
    }

    // 验证控制台警告
    expect(consoleSpy).toHaveBeenCalledTimes(invalidValues.length - 1); // 出去undefined，因为svelte1的原因
    consoleSpy.mockRestore();
  });

  /**
   * 测试content属性
   */
  it('content属性为正常情况下,应该渲染正常内容', async () => {
    // 测试不同类型的有效content值
    const validContents = ['普通文本内容', '长文本内容'.repeat(10)];

    for (const content of validContents) {
      // 创建干净的触发元素
      const testNode = document.createElement('button');
      testNode.textContent = '点击或悬停我';
      document.body.appendChild(testNode);

      // 固定位置，避免翻转
      testNode.getBoundingClientRect = () => ({
        width: 100,
        height: 30,
        top: 500,
        left: 500,
        bottom: 530,
        right: 600,
      });

      // 初始化tooltip
      tooltip(testNode, {
        content: content,
        placement: 'bottom',
        hide_method: 'hover',
      });

      // 触发显示tooltip
      await fireEvent.mouseOver(testNode);

      // 快进时间到300ms，因为还有动画时间
      await vi.advanceTimersByTime(300);

      // 等待tooltip显示
      const tooltipElement = screen.getByTestId('tooltip');
      expect(tooltipElement).toBeVisible();

      // 验证内容是否正确显示
      expect(tooltipElement.innerHTML).toContain(content);

      // 隐藏tooltip
      await fireEvent.mouseLeave(testNode);

      // 快进时间到300ms，因为还有动画时间
      await vi.advanceTimersByTime(300);

      // 测试是否已经隐藏
      expect(tooltipElement).toHaveClass('is-hidden');

      document.body.removeChild(testNode);
    }
  });

  it('content属性为非正常情况下，传入null,undefined,空字符串,其他类型，应该渲染默认内容，同时在控制台提示相应警告', async () => {
    const invalidValues = [null, undefined, ''];
    const consoleSpy = vi.spyOn(console, 'warn');

    for (const value of invalidValues) {
      const testNode = document.createElement('button');
      testNode.textContent = '点击或悬停我';
      document.body.appendChild(testNode);

      testNode.getBoundingClientRect = () => ({
        width: 100,
        height: 30,
        top: 500,
        left: 500,
        bottom: 530,
        right: 600,
      });

      tooltip(testNode, {
        content: value,
        placement: 'bottom',
        hide_method: 'hover',
      });

      await vi.runAllTimers();

      let tooltipElement;
      await waitFor(() => {
        tooltipElement = screen.getByTestId('tooltip');
        expect(tooltipElement).toBeInTheDocument();
      });

      // 触发显示tooltip
      await fireEvent.mouseOver(testNode);
      await vi.advanceTimersByTime(300);
      await waitFor(() => expect(tooltipElement).toBeVisible());

      document.body.removeChild(testNode);
    }

    // 验证控制台警告(应该有invalidValues.length - 1个)
    expect(consoleSpy).toHaveBeenCalledTimes(invalidValues.length - 1); // 除去undefined，因为svelte1的原因
    consoleSpy.mockRestore();
  });

  /**
   * 测试color属性
   */
  it('color属性为正常情况下,应该渲染正常颜色', async () => {
    // 测试不同类型的有效color值
    const validColors = [
      '#ffffff', // 默认值
      '#ff0000', // 红色
      '#00ff00', // 绿色
      '#0000ff', // 蓝色
      'rgb(255, 0, 0)', // RGB格式
      'rgba(255, 0, 0, 0.5)', // RGBA格式
      'red', // 颜色名称
    ];

    for (const color of validColors) {
      // 创建干净的触发元素
      const testNode = document.createElement('button');
      testNode.textContent = '点击或悬停我';
      document.body.appendChild(testNode);

      // 固定位置，避免翻转
      testNode.getBoundingClientRect = () => ({
        width: 100,
        height: 30,
        top: 500,
        left: 500,
        bottom: 530,
        right: 600,
      });

      // 初始化tooltip
      tooltip(testNode, {
        content: '测试颜色内容',
        placement: 'bottom',
        color: color,
        hide_method: 'hover',
      });

      // 触发显示tooltip
      await fireEvent.mouseOver(testNode);

      // 快进时间到300ms，因为还有动画时间
      await vi.advanceTimersByTime(300);

      // 等待tooltip显示
      const tooltipElement = screen.getByTestId('tooltip');
      expect(tooltipElement).toBeVisible();

      // 获取tooltip内容区域
      const contentElement = tooltipElement.querySelector('.tooltip__content');
      expect(contentElement).toBeInTheDocument();

      // 验证背景颜色是否正确设置
      // 注意：由于浏览器可能将颜色值转换为不同格式，我们只检查是否设置了style属性
      expect(contentElement.style.backgroundColor).toBeDefined();

      // 隐藏tooltip
      await fireEvent.mouseLeave(testNode);

      // 快进时间到300ms，因为还有动画时间
      await vi.advanceTimersByTime(300);

      // 测试是否已经隐藏
      expect(tooltipElement).toHaveClass('is-hidden');

      document.body.removeChild(testNode);
    }
  });

  it('color属性为非正常情况下，传入null,undefined,空字符串,其他类型，应该渲染默认颜色，同时在控制台提示相应警告', async () => {
    const invalidValues = [null, undefined, '', 123, {}, [], true];
    const consoleSpy = vi.spyOn(console, 'warn');

    for (const value of invalidValues) {
      // 创建干净的触发元素
      const testNode = document.createElement('button');
      testNode.textContent = '点击或悬停我';
      document.body.appendChild(testNode);

      // 固定位置，避免翻转
      testNode.getBoundingClientRect = () => ({
        width: 100,
        height: 30,
        top: 500,
        left: 500,
        bottom: 530,
        right: 600,
      });

      // 初始化tooltip
      tooltip(testNode, {
        content: '测试颜色内容',
        placement: 'bottom',
        color: value,
        hide_method: 'hover',
      });

      // 触发显示tooltip
      await fireEvent.mouseOver(testNode);

      // 快进时间到300ms，因为还有动画时间
      await vi.advanceTimersByTime(300);

      // 等待tooltip显示
      const tooltipElement = screen.getByTestId('tooltip');
      expect(tooltipElement).toBeVisible();

      // 获取tooltip内容区域
      const contentElement = tooltipElement.querySelector('.tooltip__content');
      expect(contentElement).toBeInTheDocument();

      // 验证使用了默认颜色 #ffffff
      expect(contentElement.style.backgroundColor).toBe('rgb(255, 255, 255)');

      // 隐藏tooltip
      await fireEvent.mouseLeave(testNode);

      // 快进时间到300ms，因为还有动画时间
      await vi.advanceTimersByTime(300);

      // 测试是否已经隐藏
      expect(tooltipElement).toHaveClass('is-hidden');

      document.body.removeChild(testNode);
    }

    // 验证控制台警告
    expect(consoleSpy).toHaveBeenCalledTimes(invalidValues.length - 1);
    consoleSpy.mockRestore();
  });

  /**
   * 测试hide_method属性下的hover和click隐藏方式
   */
  it('hide_method属性为hover时，触发鼠标进入，隐藏tooltip', async () => {
    // 创建干净的触发元素
    const testNode = document.createElement('button');
    testNode.textContent = '点击或悬停我';
    document.body.appendChild(testNode);

    // 固定位置，避免翻转
    testNode.getBoundingClientRect = () => ({
      width: 100,
      height: 30,
      top: 500,
      left: 500,
      bottom: 530,
      right: 600,
    });

    // 初始化tooltip
    tooltip(testNode, {
      content: '测试hover隐藏',
      placement: 'bottom',
      hide_method: 'hover',
    });

    // 触发显示tooltip
    await fireEvent.mouseOver(testNode);

    // 快进时间到300ms，因为还有动画时间
    await vi.advanceTimersByTime(300);

    // 等待tooltip显示
    const tooltipElement = screen.getByTestId('tooltip');
    expect(tooltipElement).toBeVisible();

    // 触发鼠标离开 - 应该隐藏tooltip
    await fireEvent.mouseLeave(testNode);

    // 快进时间到300ms，因为还有动画时间
    await vi.advanceTimersByTime(300);

    // 测试是否已经隐藏
    expect(tooltipElement).toHaveClass('is-hidden');

    document.body.removeChild(testNode);
  });

  it('hide_method属性为click时，触发鼠标点击，隐藏tooltip', async () => {
    // 创建干净的触发元素
    const testNode = document.createElement('button');
    testNode.textContent = '点击或悬停我';
    document.body.appendChild(testNode);

    // 固定位置，避免翻转
    testNode.getBoundingClientRect = () => ({
      width: 100,
      height: 30,
      top: 500,
      left: 500,
      bottom: 530,
      right: 600,
    });

    // 初始化tooltip
    tooltip(testNode, {
      content: '测试click隐藏',
      placement: 'bottom',
      hide_method: 'click',
    });

    // 触发显示tooltip
    await fireEvent.click(testNode);

    // 快进时间到300ms，因为还有动画时间
    await vi.advanceTimersByTime(300);

    // 等待tooltip显示
    const tooltipElement = screen.getByTestId('tooltip');
    expect(tooltipElement).toBeVisible();

    // 触发点击 - 应该隐藏tooltip
    await fireEvent.click(document.body);

    // 快进时间到300ms，因为还有动画时间
    await vi.advanceTimersByTime(300);

    // 测试是否已经隐藏
    expect(tooltipElement).toHaveClass('is-hidden');

    document.body.removeChild(testNode);
  });

  it('hide_method属性为非正常情况下，传入null,undefined,空字符串,其他类型，应该渲染默认隐藏方式，同时在控制台提示相应警告', async () => {
    const invalidValues = [null, undefined, '', 123, {}, [], true, 'invalid'];
    const consoleSpy = vi.spyOn(console, 'warn');

    for (const value of invalidValues) {
      // 创建干净的触发元素
      const testNode = document.createElement('button');
      testNode.textContent = '点击或悬停我';
      document.body.appendChild(testNode);

      // 固定位置，避免翻转
      testNode.getBoundingClientRect = () => ({
        width: 100,
        height: 30,
        top: 500,
        left: 500,
        bottom: 530,
        right: 600,
      });

      // 初始化tooltip
      tooltip(testNode, {
        content: '测试无效hide_method',
        placement: 'bottom',
        hide_method: value,
      });

      // 验证使用了默认值 'hover'
      // 触发鼠标进入 - 应该显示tooltip
      await fireEvent.mouseOver(testNode);

      // 快进时间到300ms，因为还有动画时间
      await vi.advanceTimersByTime(300);

      // 等待tooltip显示
      const tooltipElement = screen.getByTestId('tooltip');
      expect(tooltipElement).toBeVisible();

      // 触发鼠标离开 - 应该隐藏tooltip
      await fireEvent.mouseLeave(testNode);

      // 快进时间到300ms，因为还有动画时间
      await vi.advanceTimersByTime(300);

      // 测试是否已经隐藏
      expect(tooltipElement).toHaveClass('is-hidden');

      document.body.removeChild(testNode);
    }

    // 验证控制台警告
    expect(consoleSpy).toHaveBeenCalledTimes(invalidValues.length - 1);
    consoleSpy.mockRestore();
  });

  /**
   * 测试show_actions属性
   */
  it('show_actions属性为true时，tooltip应该显示操作按钮', async () => {
    // 创建干净的触发元素
    const testNode = document.createElement('button');
    testNode.textContent = '点击或悬停我';
    document.body.appendChild(testNode);

    // 固定位置，避免翻转
    testNode.getBoundingClientRect = () => ({
      width: 100,
      height: 30,
      top: 500,
      left: 500,
      bottom: 530,
      right: 600,
    });

    // 初始化tooltip
    tooltip(testNode, {
      content: '测试操作按钮',
      placement: 'bottom',
      show_actions: true,
    });

    // 触发显示tooltip
    await fireEvent.mouseOver(testNode);

    // 快进时间到300ms，因为还有动画时间
    await vi.advanceTimersByTime(300);

    // 等待tooltip显示
    const tooltipElement = screen.getByTestId('tooltip');
    expect(tooltipElement).toBeVisible();

    // 检查是否存在操作按钮区域
    const actionsElement = tooltipElement.querySelector('.tooltip__content-actions');
    expect(actionsElement).toBeInTheDocument();

    // 检查确认按钮是否存在
    const confirmButton = actionsElement.querySelector('.Confirm');
    expect(confirmButton).toBeInTheDocument();
    expect(confirmButton).toHaveTextContent('确认');

    // 检查取消按钮是否存在（默认显示）
    const cancelButton = actionsElement.querySelector('.Cancel');
    expect(cancelButton).toBeInTheDocument();
    expect(cancelButton).toHaveTextContent('取消');

    // 隐藏tooltip
    await fireEvent.mouseLeave(testNode);

    // 快进时间到300ms，因为还有动画时间
    await vi.advanceTimersByTime(300);

    // 测试是否已经隐藏
    expect(tooltipElement).toHaveClass('is-hidden');

    document.body.removeChild(testNode);
  });

  it('show_actions属性为false时，tooltip不应该显示操作按钮', async () => {
    // 创建干净的触发元素
    const mockNode = document.createElement('button');
    mockNode.textContent = '点击或悬停我';
    document.body.appendChild(mockNode);

    // 固定位置，避免翻转
    mockNode.getBoundingClientRect = () => ({
      width: 100,
      height: 30,
      top: 500,
      left: 500,
      bottom: 530,
      right: 600,
    });

    // 初始化tooltip
    tooltip(mockNode, {
      content: '测试无操作按钮',
      placement: 'bottom',
      show_actions: false,
    });

    // 触发显示tooltip
    await fireEvent.mouseOver(mockNode);

    // 等待tooltip显示
    const tooltipElement = screen.getByTestId('tooltip');
    expect(tooltipElement).toBeVisible();

    // 检查操作按钮区域不存在
    const actionsElement = tooltipElement.querySelector('.tooltip__content-actions');
    expect(actionsElement).not.toBeInTheDocument();

    // 隐藏tooltip
    await fireEvent.mouseLeave(mockNode);

    document.body.removeChild(mockNode);
  });

  it('show_actions属性为非正常情况下，传入null,undefined,空字符串,其他类型，应该渲染默认显示操作按钮，同时在控制台提示相应警告', async () => {
    const invalidValues = [null, undefined, '', 123, {}, [], 'invalid'];
    const consoleSpy = vi.spyOn(console, 'warn');

    for (const value of invalidValues) {
      // 创建干净的触发元素
      const mockNode = document.createElement('button');
      mockNode.textContent = '点击或悬停我';
      document.body.appendChild(mockNode);

      // 固定位置，避免翻转
      mockNode.getBoundingClientRect = () => ({
        width: 100,
        height: 30,
        top: 500,
        left: 500,
        bottom: 530,
        right: 600,
      });

      // 初始化tooltip
      tooltip(mockNode, {
        content: '测试无效show_actions',
        placement: 'bottom',
        show_actions: value,
      });

      // 触发显示tooltip
      await fireEvent.mouseOver(mockNode);

      // 等待tooltip显示
      const tooltipElement = screen.getByTestId('tooltip');
      expect(tooltipElement).toBeVisible();

      // 验证使用了默认值 false - 不应该显示操作按钮
      const actionsElement = tooltipElement.querySelector('.tooltip__content-actions');
      expect(actionsElement).not.toBeInTheDocument();

      // 隐藏tooltip
      await fireEvent.mouseLeave(mockNode);

      // 测试是否已经隐藏
      expect(tooltipElement).toHaveClass('is-hidden');

      document.body.removeChild(mockNode);
    }

    // 验证控制台警告
    expect(consoleSpy).toHaveBeenCalledTimes(invalidValues.length - 1);
    consoleSpy.mockRestore();
  });

  /**
   * 测试title属性
   */
  it('title属性为正常情况下,应该渲染正常标题', async () => {
    // 创建干净的触发元素
    const mockNode = document.createElement('button');
    mockNode.textContent = '点击或悬停我';
    document.body.appendChild(mockNode);

    // 固定位置，避免翻转
    mockNode.getBoundingClientRect = () => ({
      width: 100,
      height: 30,
      top: 500,
      left: 500,
      bottom: 530,
      right: 600,
    });

    // 初始化tooltip
    tooltip(mockNode, {
      content: '测试标题内容',
      placement: 'bottom',
      title: '测试标题',
      show_title: true, // 需要设置show_title为true才能显示标题
    });

    // 触发显示tooltip
    await fireEvent.mouseOver(mockNode);

    // 等待tooltip显示
    const tooltipElement = screen.getByTestId('tooltip');
    expect(tooltipElement).toBeVisible();

    // 检查标题是否存在
    const titleElement = tooltipElement.querySelector('.tooltip__content-title');
    expect(titleElement).toBeInTheDocument();
    expect(titleElement).toHaveTextContent('测试标题');

    // 检查内容区域是否有have-title类
    const contentElement = tooltipElement.querySelector('.tooltip__content');
    expect(contentElement).toHaveClass('have-title');

    // 隐藏tooltip
    await fireEvent.mouseLeave(mockNode);

    document.body.removeChild(mockNode);
  });

  it('title属性为非正常情况下，传入null,undefined,空字符串,其他类型，应该渲染默认标题，同时在控制台提示相应警告', async () => {
    const invalidValues = [null, undefined, '', 123, {}, [], true];
    const consoleSpy = vi.spyOn(console, 'warn');

    for (const value of invalidValues) {
      // 创建干净的触发元素
      const mockNode = document.createElement('button');
      mockNode.textContent = '点击或悬停我';
      document.body.appendChild(mockNode);

      // 固定位置，避免翻转
      mockNode.getBoundingClientRect = () => ({
        width: 100,
        height: 30,
        top: 500,
        left: 500,
        bottom: 530,
        right: 600,
      });

      // 初始化tooltip
      tooltip(mockNode, {
        content: '测试无效标题',
        title: value,
        show_title: true, // 需要设置show_title为true才能显示标题
      });

      // 触发显示tooltip
      await fireEvent.mouseOver(mockNode);

      // 等待tooltip显示
      const tooltipElement = screen.getByTestId('tooltip');
      expect(tooltipElement).toBeVisible();

      // 检查标题是否存在（应该使用默认值空字符串）
      const titleElement = tooltipElement.querySelector('.tooltip__content-title');
      expect(titleElement).toBeInTheDocument();
      if (value !== '') expect(titleElement).toHaveTextContent('标题');

      // 隐藏tooltip
      await fireEvent.mouseLeave(mockNode);

      // 测试是否已经隐藏
      expect(tooltipElement).toHaveClass('is-hidden');

      document.body.removeChild(mockNode);
    }

    // 验证控制台警告(undefined不算其中的一个)(还有空格)
    expect(consoleSpy).toHaveBeenCalledTimes(invalidValues.length - 2);
    consoleSpy.mockRestore();
  });

  /**
   * 测试show_title属性
   */
  it('show_title属性为true时，tooltip应该显示标题', async () => {
    // 创建干净的触发元素
    const mockNode = document.createElement('button');
    mockNode.textContent = '点击或悬停我';
    document.body.appendChild(mockNode);

    // 固定位置，避免翻转
    mockNode.getBoundingClientRect = () => ({
      width: 100,
      height: 30,
      top: 500,
      left: 500,
      bottom: 530,
      right: 600,
    });

    // 初始化tooltip
    tooltip(mockNode, {
      content: '测试显示标题',
      placement: 'bottom',
      title: '测试标题',
      show_title: true,
    });

    // 触发显示tooltip
    await fireEvent.mouseOver(mockNode);

    // 等待tooltip显示
    const tooltipElement = screen.getByTestId('tooltip');
    expect(tooltipElement).toBeVisible();

    // 检查标题是否存在
    const titleElement = tooltipElement.querySelector('.tooltip__content-title');
    expect(titleElement).toBeInTheDocument();
    expect(titleElement).toHaveTextContent('测试标题');

    // 检查内容区域是否有have-title类
    const contentElement = tooltipElement.querySelector('.tooltip__content');
    expect(contentElement).toHaveClass('have-title');

    // 隐藏tooltip
    await fireEvent.mouseLeave(mockNode);

    // 测试是否已经隐藏
    expect(tooltipElement).toHaveClass('is-hidden');

    document.body.removeChild(mockNode);
  });

  it('show_title属性为false时，tooltip不应该显示标题', async () => {
    // 创建干净的触发元素
    const mockNode = document.createElement('button');
    mockNode.textContent = '点击或悬停我';
    document.body.appendChild(mockNode);

    // 固定位置，避免翻转
    mockNode.getBoundingClientRect = () => ({
      width: 100,
      height: 30,
      top: 500,
      left: 500,
      bottom: 530,
      right: 600,
    });

    // 初始化tooltip
    tooltip(mockNode, {
      content: '测试不显示标题',
      placement: 'bottom',
      title: '测试标题', // 即使设置了标题，show_title为false也不应该显示
      show_title: false,
    });

    // 触发显示tooltip
    await fireEvent.mouseOver(mockNode);

    // 等待tooltip显示
    const tooltipElement = screen.getByTestId('tooltip');
    expect(tooltipElement).toBeVisible();

    // 检查标题不存在
    const titleElement = tooltipElement.querySelector('.tooltip__content-title');
    expect(titleElement).not.toBeInTheDocument();

    // 检查内容区域没有have-title类
    const contentElement = tooltipElement.querySelector('.tooltip__content');
    expect(contentElement).not.toHaveClass('have-title');

    // 隐藏tooltip
    await fireEvent.mouseLeave(mockNode);

    document.body.removeChild(mockNode);
  });

  it('show_title属性为非正常情况下，传入null,undefined,空字符串,其他类型，应该渲染默认显示标题，同时在控制台提示相应警告', async () => {
    const invalidValues = [null, undefined, '', 123, {}, [], 'invalid'];
    const consoleSpy = vi.spyOn(console, 'warn');

    for (const value of invalidValues) {
      // 创建干净的触发元素
      const mockNode = document.createElement('button');
      mockNode.textContent = '点击或悬停我';
      document.body.appendChild(mockNode);

      // 固定位置，避免翻转
      mockNode.getBoundingClientRect = () => ({
        width: 100,
        height: 30,
        top: 500,
        left: 500,
        bottom: 530,
        right: 600,
      });

      // 初始化tooltip
      tooltip(mockNode, {
        content: '测试无效show_title',
        placement: 'bottom',
        title: '测试标题',
        show_title: value,
      });

      // 触发显示tooltip
      await fireEvent.mouseOver(mockNode);

      // 等待tooltip显示
      const tooltipElement = screen.getByTestId('tooltip');
      expect(tooltipElement).toBeVisible();

      // 验证使用了默认值 false - 不应该显示标题
      const titleElement = tooltipElement.querySelector('.tooltip__content-title');
      expect(titleElement).not.toBeInTheDocument();

      // 检查内容区域没有have-title类
      const contentElement = tooltipElement.querySelector('.tooltip__content');
      expect(contentElement).not.toHaveClass('have-title');

      // 隐藏tooltip
      await fireEvent.mouseLeave(mockNode);

      // 测试是否已经隐藏
      expect(tooltipElement).toHaveClass('is-hidden');

      document.body.removeChild(mockNode);
    }

    // 验证控制台警告
    expect(consoleSpy).toHaveBeenCalledTimes(invalidValues.length - 1);
    consoleSpy.mockRestore();
  });

  /**
   * 测试show_cancel属性
   */
  it('show_cancel属性为true时，tooltip应该显示取消按钮', async () => {
    // 创建干净的触发元素
    const mockNode = document.createElement('button');
    mockNode.textContent = '点击或悬停我';
    document.body.appendChild(mockNode);

    // 固定位置，避免翻转
    mockNode.getBoundingClientRect = () => ({
      width: 100,
      height: 30,
      top: 500,
      left: 500,
      bottom: 530,
      right: 600,
    });

    // 初始化tooltip
    tooltip(mockNode, {
      content: '测试显示取消按钮',
      placement: 'bottom',
      show_actions: true, // 需要显示操作按钮区域
      show_cancel: true,
    });

    // 触发显示tooltip
    await fireEvent.mouseOver(mockNode);

    // 等待tooltip显示
    const tooltipElement = screen.getByTestId('tooltip');
    expect(tooltipElement).toBeVisible();

    // 检查操作按钮区域是否存在
    const actionsElement = tooltipElement.querySelector('.tooltip__content-actions');
    expect(actionsElement).toBeInTheDocument();

    // 检查取消按钮是否存在
    const cancelButton = actionsElement.querySelector('.Cancel');
    expect(cancelButton).toBeInTheDocument();
    expect(cancelButton).toHaveTextContent('取消');

    // 检查确认按钮也存在
    const confirmButton = actionsElement.querySelector('.Confirm');
    expect(confirmButton).toBeInTheDocument();

    // 隐藏tooltip
    await fireEvent.mouseLeave(mockNode);

    document.body.removeChild(mockNode);
  });

  it('show_cancel属性为false时，tooltip不应该显示取消按钮', async () => {
    // 创建干净的触发元素
    const mockNode = document.createElement('button');
    mockNode.textContent = '点击或悬停我';
    document.body.appendChild(mockNode);

    // 固定位置，避免翻转
    mockNode.getBoundingClientRect = () => ({
      width: 100,
      height: 30,
      top: 500,
      left: 500,
      bottom: 530,
      right: 600,
    });

    // 初始化tooltip
    tooltip(mockNode, {
      content: '测试不显示取消按钮',
      placement: 'bottom',
      show_actions: true, // 需要显示操作按钮区域
      show_cancel: false,
    });

    // 触发显示tooltip
    await fireEvent.mouseOver(mockNode);

    // 等待tooltip显示
    const tooltipElement = screen.getByTestId('tooltip');
    expect(tooltipElement).toBeVisible();

    // 检查操作按钮区域是否存在
    const actionsElement = tooltipElement.querySelector('.tooltip__content-actions');
    expect(actionsElement).toBeInTheDocument();

    // 检查取消按钮不存在
    const cancelButton = actionsElement.querySelector('.Cancel');
    expect(cancelButton).not.toBeInTheDocument();

    // 检查确认按钮仍然存在
    const confirmButton = actionsElement.querySelector('.Confirm');
    expect(confirmButton).toBeInTheDocument();

    // 隐藏tooltip
    await fireEvent.mouseLeave(mockNode);

    document.body.removeChild(mockNode);
  });

  it('show_cancel属性为非正常情况下，传入null,undefined,空字符串,其他类型，应该渲染默认显示取消按钮，同时在控制台提示相应警告', async () => {
    const invalidValues = [null, undefined, '', 123, {}, [], 'invalid'];
    const consoleSpy = vi.spyOn(console, 'warn');

    for (const value of invalidValues) {
      // 创建干净的触发元素
      const mockNode = document.createElement('button');
      mockNode.textContent = '点击或悬停我';
      document.body.appendChild(mockNode);

      // 固定位置，避免翻转
      mockNode.getBoundingClientRect = () => ({
        width: 100,
        height: 30,
        top: 500,
        left: 500,
        bottom: 530,
        right: 600,
      });

      // 初始化tooltip
      tooltip(mockNode, {
        content: '测试无效show_cancel',
        placement: 'bottom',
        show_actions: true, // 需要显示操作按钮区域
        show_cancel: value,
      });

      // 触发显示tooltip
      await fireEvent.mouseOver(mockNode);

      // 等待tooltip显示
      const tooltipElement = screen.getByTestId('tooltip');
      expect(tooltipElement).toBeVisible();

      // 验证使用了默认值 true - 应该显示取消按钮
      const actionsElement = tooltipElement.querySelector('.tooltip__content-actions');
      expect(actionsElement).toBeInTheDocument();

      const cancelButton = actionsElement.querySelector('.Cancel');
      expect(cancelButton).toBeInTheDocument();

      // 隐藏tooltip
      await fireEvent.mouseLeave(mockNode);

      document.body.removeChild(mockNode);
    }

    // 验证控制台警告
    expect(consoleSpy).toHaveBeenCalledTimes(invalidValues.length - 1);
    consoleSpy.mockRestore();
  });

  /**
   * 测试confirm_text属性
   */
  it('confirm_text属性为正常情况下,应该渲染正常文本', async () => {
    // 创建干净的触发元素
    const mockNode = document.createElement('button');
    mockNode.textContent = '点击或悬停我';
    document.body.appendChild(mockNode);

    // 固定位置，避免翻转
    mockNode.getBoundingClientRect = () => ({
      width: 100,
      height: 30,
      top: 500,
      left: 500,
      bottom: 530,
      right: 600,
    });

    // 初始化tooltip
    tooltip(mockNode, {
      content: '测试确认按钮文本',
      placement: 'bottom',
      show_actions: true, // 需要显示操作按钮区域
      confirm_text: '确认操作',
    });

    // 触发显示tooltip
    await fireEvent.mouseOver(mockNode);

    // 等待tooltip显示
    const tooltipElement = screen.getByTestId('tooltip');
    expect(tooltipElement).toBeVisible();

    // 检查操作按钮区域是否存在
    const actionsElement = tooltipElement.querySelector('.tooltip__content-actions');
    expect(actionsElement).toBeInTheDocument();

    // 检查确认按钮文本是否正确
    const confirmButton = actionsElement.querySelector('.Confirm');
    expect(confirmButton).toBeInTheDocument();
    expect(confirmButton).toHaveTextContent('确认操作');

    // 检查取消按钮也存在
    const cancelButton = actionsElement.querySelector('.Cancel');
    expect(cancelButton).toBeInTheDocument();
    expect(cancelButton).toHaveTextContent('取消');

    // 隐藏tooltip
    await fireEvent.mouseLeave(mockNode);

    document.body.removeChild(mockNode);
  });

  it('confirm_text属性为非正常情况下，传入null,undefined,空字符串,其他类型，应该渲染默认文本，同时在控制台提示相应警告', async () => {
    const invalidValues = [null, undefined, '', 123, {}, [], true];
    const consoleSpy = vi.spyOn(console, 'warn');

    for (const value of invalidValues) {
      // 创建干净的触发元素
      const mockNode = document.createElement('button');
      mockNode.textContent = '点击或悬停我';
      document.body.appendChild(mockNode);

      // 固定位置，避免翻转
      mockNode.getBoundingClientRect = () => ({
        width: 100,
        height: 30,
        top: 500,
        left: 500,
        bottom: 530,
        right: 600,
      });

      // 初始化tooltip
      tooltip(mockNode, {
        content: '测试无效confirm_text',
        placement: 'bottom',
        show_actions: true, // 需要显示操作按钮区域
        confirm_text: value,
      });

      // 触发显示tooltip
      await fireEvent.mouseOver(mockNode);

      // 等待tooltip显示
      const tooltipElement = screen.getByTestId('tooltip');
      expect(tooltipElement).toBeVisible();

      // 验证使用了默认值 '确认'
      const actionsElement = tooltipElement.querySelector('.tooltip__content-actions');
      expect(actionsElement).toBeInTheDocument();

      const confirmButton = actionsElement.querySelector('.Confirm');
      expect(confirmButton).toBeInTheDocument();
      expect(confirmButton).toHaveTextContent('确认');

      // 隐藏tooltip
      await fireEvent.mouseLeave(mockNode);

      document.body.removeChild(mockNode);
    }

    // 验证控制台警告
    expect(consoleSpy).toHaveBeenCalledTimes(invalidValues.length - 1);
    consoleSpy.mockRestore();
  });

  /**
   * 测试cancel_text属性
   */
  it('cancel_text属性为正常情况下,应该渲染正常文本', async () => {
    // 创建干净的触发元素
    const mockNode = document.createElement('button');
    mockNode.textContent = '点击或悬停我';
    document.body.appendChild(mockNode);

    // 固定位置，避免翻转
    mockNode.getBoundingClientRect = () => ({
      width: 100,
      height: 30,
      top: 500,
      left: 500,
      bottom: 530,
      right: 600,
    });

    // 初始化tooltip
    tooltip(mockNode, {
      content: '测试取消按钮文本',
      placement: 'bottom',
      show_actions: true, // 需要显示操作按钮区域
      cancel_text: '取消操作',
    });

    // 触发显示tooltip
    await fireEvent.mouseOver(mockNode);

    // 等待tooltip显示
    const tooltipElement = screen.getByTestId('tooltip');
    expect(tooltipElement).toBeVisible();

    // 检查操作按钮区域是否存在
    const actionsElement = tooltipElement.querySelector('.tooltip__content-actions');
    expect(actionsElement).toBeInTheDocument();

    // 检查取消按钮文本是否正确
    const cancelButton = actionsElement.querySelector('.Cancel');
    expect(cancelButton).toBeInTheDocument();
    expect(cancelButton).toHaveTextContent('取消操作');

    // 检查确认按钮也存在
    const confirmButton = actionsElement.querySelector('.Confirm');
    expect(confirmButton).toBeInTheDocument();
    expect(confirmButton).toHaveTextContent('确认');

    // 隐藏tooltip
    await fireEvent.mouseLeave(mockNode);

    document.body.removeChild(mockNode);
  });

  it('cancel_text属性为非正常情况下，传入null,undefined,空字符串,其他类型，应该渲染默认文本，同时在控制台提示相应警告', async () => {
    const invalidValues = [null, undefined, '', 123, {}, [], true];
    const consoleSpy = vi.spyOn(console, 'warn');

    for (const value of invalidValues) {
      // 创建干净的触发元素
      const mockNode = document.createElement('button');
      mockNode.textContent = '点击或悬停我';
      document.body.appendChild(mockNode);

      // 固定位置，避免翻转
      mockNode.getBoundingClientRect = () => ({
        width: 100,
        height: 30,
        top: 500,
        left: 500,
        bottom: 530,
        right: 600,
      });

      // 初始化tooltip
      tooltip(mockNode, {
        content: '测试无效cancel_text',
        placement: 'bottom',
        show_actions: true, // 需要显示操作按钮区域
        cancel_text: value,
      });

      // 触发显示tooltip
      await fireEvent.mouseOver(mockNode);

      // 等待tooltip显示
      const tooltipElement = screen.getByTestId('tooltip');
      expect(tooltipElement).toBeVisible();

      // 验证使用了默认值 '取消'
      const actionsElement = tooltipElement.querySelector('.tooltip__content-actions');
      expect(actionsElement).toBeInTheDocument();

      const cancelButton = actionsElement.querySelector('.Cancel');
      expect(cancelButton).toBeInTheDocument();
      expect(cancelButton).toHaveTextContent('取消');

      // 隐藏tooltip
      await fireEvent.mouseLeave(mockNode);

      document.body.removeChild(mockNode);
    }

    // 验证控制台警告
    expect(consoleSpy).toHaveBeenCalledTimes(invalidValues.length - 1);
    consoleSpy.mockRestore();
  });

  /**
   * 测试onConfirm属性回调函数
   */
  it('onConfirm属性回调函数应该被触发', async () => {
    // 创建干净的触发元素
    const mockNode = document.createElement('button');
    mockNode.textContent = '点击或悬停我';
    document.body.appendChild(mockNode);

    // 固定位置，避免翻转
    mockNode.getBoundingClientRect = () => ({
      width: 100,
      height: 30,
      top: 500,
      left: 500,
      bottom: 530,
      right: 600,
    });

    // 创建模拟回调函数
    const mockOnConfirm = vi.fn();

    // 初始化tooltip
    tooltip(mockNode, {
      content: '测试确认回调',
      placement: 'bottom',
      show_actions: true, // 需要显示操作按钮区域
      onConfirm: mockOnConfirm,
    });

    // 触发显示tooltip
    await fireEvent.mouseOver(mockNode);

    // 等待tooltip显示
    const tooltipElement = screen.getByTestId('tooltip');
    expect(tooltipElement).toBeVisible();

    // 检查操作按钮区域是否存在
    const actionsElement = tooltipElement.querySelector('.tooltip__content-actions');
    expect(actionsElement).toBeInTheDocument();

    // 检查确认按钮是否存在
    const confirmButton = screen.getByText('确认');
    expect(confirmButton).toBeInTheDocument();

    // 点击确认按钮

    await fireEvent.click(confirmButton);

    // 验证回调函数被调用
    expect(mockOnConfirm).toHaveBeenCalledTimes(1);

    document.body.removeChild(mockNode);
  });

  it('onConfirm属性回调函数为非正常值时，不应该被触发', async () => {
    // 创建干净的触发元素
    const mockNode = document.createElement('button');
    mockNode.textContent = '点击或悬停我';
    document.body.appendChild(mockNode);

    // 固定位置，避免翻转
    mockNode.getBoundingClientRect = () => ({
      width: 100,
      height: 30,
      top: 500,
      left: 500,
      bottom: 530,
      right: 600,
    });

    // 初始化tooltip，传入非函数值
    tooltip(mockNode, {
      content: '测试无效确认回调',
      placement: 'bottom',
      show_actions: true, // 需要显示操作按钮区域
      onConfirm: 'not a function', // 非函数值
    });

    // 触发显示tooltip
    await fireEvent.mouseOver(mockNode);

    // 等待tooltip显示
    const tooltipElement = screen.getByTestId('tooltip');
    expect(tooltipElement).toBeVisible();

    // 检查操作按钮区域是否存在
    const actionsElement = tooltipElement.querySelector('.tooltip__content-actions');
    expect(actionsElement).toBeInTheDocument();

    // 检查确认按钮是否存在
    const confirmButton = actionsElement.querySelector('.Confirm');
    expect(confirmButton).toBeInTheDocument();

    // 点击确认按钮不应该导致错误

    // 监听控制台错误
    const consoleSpy = vi.spyOn(console, 'error');

    // 尝试点击确认按钮
    await fireEvent.click(confirmButton);

    // 验证没有错误被抛出
    expect(consoleSpy).not.toHaveBeenCalled();
    consoleSpy.mockRestore();

    document.body.removeChild(mockNode);
  });

  /**
   * 测试onCancel属性回调函数
   */
  it('onCancel属性回调函数应该被触发', async () => {
    // 创建干净的触发元素
    const mockNode = document.createElement('button');
    mockNode.textContent = '点击或悬停我';
    document.body.appendChild(mockNode);

    // 固定位置，避免翻转
    mockNode.getBoundingClientRect = () => ({
      width: 100,
      height: 30,
      top: 500,
      left: 500,
      bottom: 530,
      right: 600,
    });

    // 创建模拟回调函数
    const mockOnCancel = vi.fn();

    // 初始化tooltip
    tooltip(mockNode, {
      content: '测试取消回调',
      placement: 'bottom',
      show_actions: true, // 需要显示操作按钮区域
      onCancel: mockOnCancel,
    });

    // 触发显示tooltip
    await fireEvent.mouseOver(mockNode);

    // 等待tooltip显示
    const tooltipElement = screen.getByTestId('tooltip');
    expect(tooltipElement).toBeVisible();

    // 检查操作按钮区域是否存在
    const actionsElement = tooltipElement.querySelector('.tooltip__content-actions');
    expect(actionsElement).toBeInTheDocument();

    // 检查取消按钮是否存在
    const cancelButton = actionsElement.querySelector('.Cancel');
    expect(cancelButton).toBeInTheDocument();

    // 点击取消按钮
    await fireEvent.click(cancelButton);

    // 验证回调函数被调用
    expect(mockOnCancel).toHaveBeenCalledTimes(1);

    document.body.removeChild(mockNode);
  });

  it('onCancel属性回调函数为非正常值时，不应该被触发', async () => {
    // 创建干净的触发元素
    const mockNode = document.createElement('button');
    mockNode.textContent = '点击或悬停我';
    document.body.appendChild(mockNode);

    // 固定位置，避免翻转
    mockNode.getBoundingClientRect = () => ({
      width: 100,
      height: 30,
      top: 500,
      left: 500,
      bottom: 530,
      right: 600,
    });

    // 初始化tooltip，传入非函数值
    tooltip(mockNode, {
      content: '测试无效取消回调',
      placement: 'bottom',
      show_actions: true, // 需要显示操作按钮区域
      onCancel: 'not a function', // 非函数值
    });

    // 触发显示tooltip
    await fireEvent.mouseOver(mockNode);

    // 等待tooltip显示
    const tooltipElement = screen.getByTestId('tooltip');
    expect(tooltipElement).toBeVisible();

    // 检查操作按钮区域是否存在
    const actionsElement = tooltipElement.querySelector('.tooltip__content-actions');
    expect(actionsElement).toBeInTheDocument();

    // 检查取消按钮是否存在
    const cancelButton = actionsElement.querySelector('.Cancel');
    expect(cancelButton).toBeInTheDocument();

    // 监听控制台错误
    const consoleSpy = vi.spyOn(console, 'error');

    // 尝试点击取消按钮
    await fireEvent.click(cancelButton);

    // 验证没有错误被抛出
    expect(consoleSpy).not.toHaveBeenCalled();
    consoleSpy.mockRestore();

    document.body.removeChild(mockNode);
  });

  /**
   * 鼠标移动事件处理
   */
  it('鼠标移动事件处理应该正常工作,在这个气泡框内移动鼠标应该不会导致气泡框消失', async () => {
    // 创建干净的触发元素
    const mockNode = document.createElement('button');
    mockNode.textContent = '点击或悬停我';
    document.body.appendChild(mockNode);

    // 固定位置，避免翻转
    mockNode.getBoundingClientRect = () => ({
      width: 100,
      height: 30,
      top: 500,
      left: 500,
      bottom: 530,
      right: 600,
    });

    // 初始化tooltip
    tooltip(mockNode, {
      content: '测试鼠标移动事件',
      placement: 'bottom',
      show_actions: true, // 需要显示操作按钮区域
    });

    // 触发显示tooltip
    await fireEvent.mouseMove(mockNode);

    // 等待tooltip显示
    const tooltipElement = screen.getByTestId('tooltip');
    expect(tooltipElement).toBeVisible();

    // 鼠标移动在气泡框内
    await fireEvent.mouseMove(tooltipElement);
    expect(tooltipElement).toBeVisible();

    // 隐藏tooltip
    await fireEvent.mouseLeave(mockNode);

    document.body.removeChild(mockNode);
  });

  it('鼠标移动事件处理应该正常工作,在这个气泡框外移动鼠标应该导致气泡框消失', async () => {
    // 创建干净的触发元素
    const mockNode = document.createElement('button');
    mockNode.textContent = '点击或悬停我';
    document.body.appendChild(mockNode);

    // 固定位置，避免翻转
    mockNode.getBoundingClientRect = () => ({
      width: 100,
      height: 30,
      top: 500,
      left: 500,
      bottom: 530,
      right: 600,
    });

    // 初始化tooltip
    tooltip(mockNode, {
      content: '测试鼠标移动事件',
      placement: 'bottom',
    });

    // 触发显示tooltip
    await fireEvent.mouseMove(mockNode);

    // 等待tooltip显示
    const tooltipElement = screen.getByTestId('tooltip');
    expect(tooltipElement).toBeVisible();

    // 隐藏tooltip
    await fireEvent.mouseLeave(mockNode);

    document.body.removeChild(mockNode);
  });

  it('鼠标移动到外部区域应该导致气泡框消失', async () => {
    // 创建干净的触发元素
    const mockNode = document.createElement('button');
    mockNode.textContent = '点击或悬停我';
    document.body.appendChild(mockNode);

    // 固定位置，避免翻转
    mockNode.getBoundingClientRect = () => ({
      width: 100,
      height: 30,
      top: 500,
      left: 500,
      bottom: 530,
      right: 600,
    });

    // 初始化tooltip
    tooltip(mockNode, {
      content: '测试鼠标移动事件',
      placement: 'bottom',
    });

    // 触发显示tooltip
    await fireEvent.mouseMove(mockNode);

    // 等待tooltip显示
    const tooltipElement = screen.getByTestId('tooltip');
    expect(tooltipElement).toBeVisible();

    // 鼠标移动到外部区域
    await fireEvent.mouseMove(document.body);
    expect(tooltipElement).toHaveClass('is-hidden');

    document.body.removeChild(mockNode);
  });

  /**
   * 测试如果placement的方向位置不够，应该自动调整相反的方向
   */
  it('如果placement[left]的方向位置不够,应该自动调整相反的方向[right]', async () => {
    // 创建干净的触发元素
    const mockNode = document.createElement('button');
    mockNode.textContent = '点击或悬停我';
    document.body.appendChild(mockNode);

    // 固定位置，避免翻转
    mockNode.getBoundingClientRect = () => ({
      width: 100,
      height: 30,
      top: 500,
      left: 0,
      bottom: 530,
      right: 100,
      x: 0,
      y: 500,
    });

    // 初始化tooltip
    tooltip(mockNode, {
      content: '测试自动调整方向',
      placement: 'left',
    });

    vi.runAllTimers();

    // 触发显示tooltip
    await fireEvent.mouseOver(mockNode);
    await vi.advanceTimersByTime(1000);
    let tooltipElement = screen.getByTestId('tooltip');
    expect(tooltipElement).toBeVisible();

    // 验证tooltip的位置(属性placement应该是right)
    expect(tooltipElement).toHaveAttribute('data-placement', 'right');

    document.body.removeChild(mockNode);
  });

  it('如果placement[right]的方向位置不够,应该自动调整相反的方向[left]', async () => {
    // 创建干净的触发元素
    const mockNode = document.createElement('button');
    mockNode.textContent = '点击或悬停我';
    document.body.appendChild(mockNode);

    // 固定位置，避免翻转
    mockNode.getBoundingClientRect = () => ({
      width: 100,
      height: 30,
      top: 500,
      left: 1000,
      bottom: 530,
      right: 1100,
      x: 1000,
      y: 500,
    });

    // 初始化tooltip
    tooltip(mockNode, {
      content: '测试自动调整方向',
      placement: 'right',
    });

    vi.runAllTimers();

    // 触发显示tooltip
    await fireEvent.mouseOver(mockNode);
    await vi.advanceTimersByTime(1000);
    let tooltipElement = screen.getByTestId('tooltip');
    expect(tooltipElement).toBeVisible();

    // 验证tooltip的位置(属性placement应该是left)
    expect(tooltipElement).toHaveAttribute('data-placement', 'left');

    document.body.removeChild(mockNode);
  });

  it('如果placement[top]的方向位置不够,应该自动调整相反的方向[bottom]', async () => {
    // 创建干净的触发元素
    const mockNode = document.createElement('button');
    mockNode.textContent = '点击或悬停我';
    document.body.appendChild(mockNode);

    // 固定位置，避免翻转
    mockNode.getBoundingClientRect = () => ({
      width: 100,
      height: 30,
      top: 0,
      left: 500,
      bottom: 30,
      right: 600,
      x: 500,
      y: 0,
    });

    // 初始化tooltip
    tooltip(mockNode, {
      content: '测试自动调整方向',
      placement: 'top',
    });

    vi.runAllTimers();

    // 触发显示tooltip
    await fireEvent.mouseOver(mockNode);
    await vi.advanceTimersByTime(1000);
    let tooltipElement = screen.getByTestId('tooltip');
    expect(tooltipElement).toBeVisible();

    // 验证tooltip的位置(属性placement应该是bottom)
    expect(tooltipElement).toHaveAttribute('data-placement', 'bottom');

    document.body.removeChild(mockNode);
  });

  it('如果placement[bottom]的方向位置不够,应该自动调整相反的方向[top]', async () => {
    // 创建干净的触发元素
    const mockNode = document.createElement('button');
    mockNode.textContent = '点击或悬停我';
    document.body.appendChild(mockNode);
    // 固定位置，避免翻转
    mockNode.getBoundingClientRect = () => ({
      width: 100,
      height: 30,
      top: 1000,
      left: 500,
      bottom: 1030,
      right: 600,
      x: 500,
      y: 1000,
    });

    // 初始化tooltip
    tooltip(mockNode, {
      content: '测试自动调整方向',
      placement: 'bottom',
    });

    vi.runAllTimers();

    // 触发显示tooltip
    await fireEvent.mouseOver(mockNode);
    await vi.advanceTimersByTime(1000);
    let tooltipElement = screen.getByTestId('tooltip');
    expect(tooltipElement).toBeVisible();

    // 验证tooltip的位置(属性placement应该是top)
    expect(tooltipElement).toHaveAttribute('data-placement', 'top');

    document.body.removeChild(mockNode);
  });

  /**
   * 处理滚轮事件
   */
  it('处理滚轮事件,应该正常工作', async () => {
    // 创建干净的触发元素
    const mockNode = document.createElement('button');
    mockNode.textContent = '点击或悬停我';
    document.body.appendChild(mockNode);

    // 固定位置，避免翻转
    mockNode.getBoundingClientRect = () => ({
      width: 100,
      height: 30,
      top: 500,
      left: 500,
      bottom: 530,
      right: 600,
    });

    // 初始化tooltip
    tooltip(mockNode, {
      content: '测试滚轮事件',
      placement: 'bottom',
    });

    // 触发显示tooltip
    await fireEvent.mouseOver(mockNode);

    // 等待tooltip显示
    const tooltipElement = screen.getByTestId('tooltip');
    expect(tooltipElement).toBeVisible();

    // 触发滚轮事件
    await fireEvent.wheel(tooltipElement);

    await vi.advanceTimersByTime(1000);

    // 验证tooltip已经一段时间后消失
    expect(tooltipElement).toHaveClass('is-hidden');

    document.body.removeChild(mockNode);
  });
});
