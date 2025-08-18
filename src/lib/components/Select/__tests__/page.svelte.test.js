import { render, screen, fireEvent, waitFor, cleanup } from '@testing-library/svelte';
import { vi, it, describe, beforeEach, expect } from 'vitest';

import Select from '../Select.svelte';
import Option from '../Option.svelte';
import { afterEach } from 'vitest';

describe('Select 与 Option 组件 单元测试', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    cleanup();
  });

  /**
   * 应该能够渲染基本的Select与Option组件
   */
  it('Select 与 Option 组件 正常渲染', async () => {
    // 渲染select组件，并渲染option子组件
    render(Select, {
      props: {
        children: () => [
          render(Option, { props: { value: '1', label: 'test Option 1' } }),
          render(Option, { props: { value: '2', label: 'test Option 2' } }),
          render(Option, { props: { value: '3', label: 'test Option 3' } }),
          render(Option, { props: { value: '4', label: 'test Option 4' } }),
        ],
      },
    });

    /**
     * 验证select组件是否正常渲染
     */
    const select = screen.getByTestId('select');
    expect(select).toBeInTheDocument();
    // 数据基本能渲染
    expect(screen.getByText('test Option 1')).toBeInTheDocument();
    expect(screen.getByText('test Option 2')).toBeInTheDocument();
    expect(screen.getByText('test Option 3')).toBeInTheDocument();
    expect(screen.getByText('test Option 4')).toBeInTheDocument();
    // 暂无数据能渲染，而且在文档内部
    expect(screen.getByText('暂无数据')).toBeInTheDocument();

    // 没有被禁止
    expect(select).not.toBeDisabled();
  });

  /**
   * 单选模式下应该能正常渲染
   */
  it('Select 与 Option 组件 单选模式选择事件', async () => {
    // 检查控制台
    const spy = vi.spyOn(console, 'log');

    // 定义changeValue回调函数
    const changeValue = vi.fn((value) => {
      console.log('changeValue 事件', value);
    });

    render(Select, {
      props: {
        value: '',
        changeValue,
        children: () => [render(Option, { props: { value: '1', label: 'Option 1' } }), render(Option, { props: { value: '2', label: 'Option 2' } })],
      },
    });

    // 打开下拉框
    const select = screen.getByTestId('select');
    const selectInput = select.querySelector('.select__input');
    await fireEvent.click(selectInput);

    // 确保下拉框已打开
    const optionsList = screen.getByTestId('select-options');
    await expect(optionsList).toHaveClass('bottom'); // 验证下拉框是否在底部

    // 点击第一个选项
    const firstOption = screen.getByText('Option 1');
    await fireEvent.click(firstOption);

    // 验证changeValue是否被调用，并传入了正确的值
    await waitFor(() => {
      expect(changeValue).toHaveBeenCalledWith('1');
      expect(spy).toHaveBeenCalledWith('changeValue 事件', '1');
    });

    // 验证下拉框是否关闭
    await expect(optionsList).toHaveClass('is-hidden');

    // 检查数据是否更新可见
    await expect(screen.getByText('Option 1')).toBeInTheDocument();
  });

  /**
   * 多选模式下应该能正常渲染
   */
  it('Select 与 Option 组件 多选模式选择事件', async () => {
    const changeValue = vi.fn();

    render(Select, {
      props: {
        value: [],
        multiple: true,
        changeValue,
        children: () => [
          render(Option, { props: { value: '1', label: 'Option 1' } }),
          render(Option, { props: { value: '2', label: 'Option 2' } }),
          render(Option, { props: { value: '3', label: 'Option 3' } }),
          render(Option, { props: { value: '4', label: 'Option 4' } }),
        ],
      },
    });

    // 打开下拉框
    const select = screen.getByTestId('select');
    const selectInput = select.querySelector('.select__input');
    await fireEvent.click(selectInput);

    // 点击第一个选项
    const firstOption = screen.getByText('Option 1');
    await fireEvent.click(firstOption);

    // 验证changeValue是否被调用，并传入了正确的值
    await waitFor(() => {
      expect(changeValue).toHaveBeenCalledWith(['1']);
    });

    // 点击第二个选项
    const secondOption = screen.getByText('Option 2');
    await fireEvent.click(secondOption);

    // 验证changeValue是否被调用，并传入了正确的值
    await waitFor(() => {
      expect(changeValue).toHaveBeenCalledWith(['1', '2']);
    });

    // 点击第三个选项
    const thirdOption = screen.getByText('Option 3');
    await fireEvent.click(thirdOption);

    // 验证changeValue是否被调用，并传入了正确的值
    await waitFor(() => {
      expect(changeValue).toHaveBeenCalledWith(['1', '2', '3']);
    });

    // 再次点击第一个选项，取消选择
    await fireEvent.click(firstOption);
    await waitFor(() => {
      expect(changeValue).toHaveBeenCalledWith(['2', '3']);
    });

    // 再次点击第一个数据，确定选择
    await fireEvent.click(firstOption);
    await waitFor(() => {
      expect(changeValue).toHaveBeenCalledWith(['1', '2', '3']);
    });
  });

  it('测试多选模式下不传入value属性的情况应该能正常渲染', () => {
    render(Select, {
      props: {
        multiple: true,
        children: () => [render(Option, { props: { value: '1', label: 'Option 1' } }), render(Option, { props: { value: '2', label: 'Option 2' } })],
      },
    });

    // 验证是否正常渲染
    const select = screen.getByTestId('select');
    expect(select).toHaveAttribute('data-testid', 'select');
    expect(select).toBeInTheDocument();
    expect(screen.getByText('Option 1')).toBeInTheDocument();
    expect(screen.getByText('Option 2')).toBeInTheDocument();
    // 暂无数据
    expect(screen.getByText('暂无数据')).toBeInTheDocument();

    // 没有被禁止
    expect(select).not.toBeDisabled();
  });

  /**
   * 应该能实现禁用功能
   */
  it('Select 组件 禁用状态', async () => {
    const changeValue = vi.fn();

    render(Select, {
      props: {
        value: '',
        disabled: true,
        changeValue,
        children: () => [render(Option, { props: { value: '1', label: 'Option 1' } })],
      },
    });

    // 尝试打开下拉框
    const select = screen.getByTestId('select');
    const selectInput = select.querySelector('.select__input');
    await fireEvent.click(selectInput);

    // 验证下拉框是否保持关闭状态
    const optionsList = select.querySelector('.select__options');
    expect(optionsList).toHaveClass('is-hidden');

    // 验证输入框是否被禁用
    expect(selectInput).toHaveAttribute('disabled');
    expect(selectInput).toBeDisabled();
    // 验证changeValue是否未被调用
    expect(changeValue).not.toHaveBeenCalled();
  });

  it('Option 组件 禁用状态', async () => {
    const changeValue = vi.fn();

    render(Select, {
      props: {
        value: '',
        changeValue,
        children: () => [render(Option, { props: { value: '1', label: 'Enabled Option' } }), render(Option, { props: { value: '2', label: 'Disabled Option', disabled: true } })],
      },
    });

    // 打开下拉框
    const select = screen.getByTestId('select');
    const selectInput = select.querySelector('.select__input');
    await fireEvent.click(selectInput);

    // 尝试点击禁用的选项
    const disabledOption = screen.getByText('Disabled Option');
    const disabledButton = disabledOption.closest('.option');
    expect(disabledButton).toHaveClass('is-disabled');

    await fireEvent.click(disabledOption);

    // 验证changeValue是否未被调用
    expect(changeValue).not.toHaveBeenCalled();

    // 不能点击
    expect(disabledButton).not.toHaveClass('is-active');

    // 点击启用的选项
    const enabledOption = screen.getByText('Enabled Option');
    await fireEvent.click(enabledOption);

    // 验证changeValue是否被调用
    expect(changeValue).toHaveBeenCalledWith('1');
  });

  /**
   * 应该能实现本地搜索功能
   */
  it('Select 组件 可搜索功能', async () => {
    const changeValue = vi.fn();

    render(Select, {
      props: {
        value: '',
        filterable: true,
        changeValue,
        children: () => [
          render(Option, { props: { value: '1', label: 'Apple' } }),
          render(Option, { props: { value: '2', label: 'Banana' } }),
          render(Option, { props: { value: '3', label: 'Orange' } }),
        ],
      },
    });

    // 打开下拉框
    const select = screen.getByTestId('select');
    const selectInput = select.querySelector('input');
    await fireEvent.click(selectInput);

    // 确保下拉框已打开
    const optionsList = screen.getByTestId('select-options');
    expect(optionsList).toHaveClass('bottom');

    // 输入搜索文本
    await fireEvent.input(selectInput, { target: { value: 'App' } });

    // 验证是否只显示匹配的选项
    expect(screen.getByText('Apple')).toBeVisible();

    // 输入不匹配的搜索文本
    await fireEvent.input(selectInput, { target: { value: 'Grape' } });

    // 验证是否显示"暂无数据"
    expect(screen.getByText('暂无数据')).toBeVisible();
  });

  /**
   * 测试单选模式下传入初始value的情况
   */
  it('Select 与 Option 组件 单选模式初始值渲染和选择', async () => {
    const changeValue = vi.fn();

    render(Select, {
      props: {
        value: '2',
        changeValue,
        children: () => [
          render(Option, { props: { value: '1', label: 'Option 1' } }),
          render(Option, { props: { value: '2', label: 'Option 2' } }),
          render(Option, { props: { value: '3', label: 'Option 3' } }),
        ],
      },
    });

    // 验证初始选中值显示
    expect(screen.getByText('Option 2')).toBeInTheDocument();

    // 打开下拉框
    const select = screen.getByTestId('select');
    const selectInput = select.querySelector('.select__input');
    await fireEvent.click(selectInput);

    // 选择另一个选项
    const newOption = screen.getByText('Option 3');
    await fireEvent.click(newOption);

    // 验证changeValue被调用
    await waitFor(() => {
      expect(changeValue).toHaveBeenCalledWith('3');
    });

    // 验证显示更新
    expect(screen.getByText('Option 3')).toBeInTheDocument();
  });

  /**
   * 测试多选模式下传入初始value的情况
   */
  it('Select 与 Option 组件 多选模式初始值渲染和取消', async () => {
    const changeValue = vi.fn();

    render(Select, {
      props: {
        value: ['1', '3'],
        multiple: true,
        changeValue,
        children: () => [
          render(Option, { props: { value: '1', label: 'Option 1' } }),
          render(Option, { props: { value: '2', label: 'Option 2' } }),
          render(Option, { props: { value: '3', label: 'Option 3' } }),
        ],
      },
    });

    // 验证初始选中值显示
    expect(screen.getByText('Option 1')).toBeInTheDocument();
    expect(screen.getByText('Option 3')).toBeInTheDocument();

    // 打开下拉框
    const select = screen.getByTestId('select');
    const selectInput = select.querySelector('.select__input');
    await fireEvent.click(selectInput);

    // 取消一个选项通过点击选项
    await fireEvent.click(screen.getByText('Option 1'));

    await waitFor(() => {
      expect(changeValue).toHaveBeenCalledWith(['3']);
    });
  });

  /**
   * 测试placeholder的渲染在单选和多选模式下
   */
  it('Select 组件 placeholder渲染', () => {
    render(Select, {
      props: {
        placeholder: '自定义占位符',
        children: () => [],
      },
    });

    // 单选模式下空值显示placeholder
    const selectInput = screen.getByTestId('select-input');
    expect(selectInput.placeholder).toBe('自定义占位符');

    render(Select, {
      props: {
        multiple: true,
        placeholder: '自定义占位符',
        children: () => [],
      },
    });

    // 多选模式下空数组显示placeholder(不是内部的input的placeholder，而是标签的placeholder)
    expect(screen.getByText('自定义占位符')).toBeInTheDocument();
  });

  /**
   * 测试没有选项时显示暂无数据
   */
  it('Select 组件 无选项时渲染暂无数据', async () => {
    render(Select, {
      props: {
        children: () => [],
      },
    });

    // 打开下拉框
    const select = screen.getByTestId('select');
    const selectInput = select.querySelector('.select__input');
    await fireEvent.click(selectInput);

    // 验证显示暂无数据
    expect(screen.getByText('暂无数据')).toBeInTheDocument();
  });

  /**
   * 测试Option的选中状态类名
   */
  it('Option 组件 选中状态类名验证', async () => {
    render(Select, {
      props: {
        value: '1',
        children: () => [render(Option, { props: { value: '1', label: 'Selected Option' } }), render(Option, { props: { value: '2', label: 'Unselected Option' } })],
      },
    });

    // 打开下拉框
    const select = screen.getByTestId('select');
    const selectInput = select.querySelector('.select__input');
    await fireEvent.click(selectInput);

    const unselectedOption = screen.getByText('Unselected Option');
    expect(unselectedOption).not.toHaveClass('is-active');
  });

  /**
   * 测试单选模式下重复选择相同值触发changeValue
   */
  it('Select 组件 单选模式重复选择触发change', async () => {
    const changeValue = vi.fn();

    render(Select, {
      props: {
        value: '1',
        changeValue,
        children: () => [render(Option, { props: { value: '1', label: 'Option 1' } })],
      },
    });

    // 打开下拉框
    const select = screen.getByTestId('select');
    const selectInput = select.querySelector('.select__input');
    await fireEvent.click(selectInput);

    // 点击相同选项
    await fireEvent.click(screen.getByText('Option 1'));

    // 验证changeValue被调用
    expect(changeValue).toHaveBeenCalled();
  });

  /**
   * 测试多选模式下取消所有选择后显示placeholder
   */
  it('Select 组件 多选模式取消所有选择显示placeholder', async () => {
    const changeValue = vi.fn();

    render(Select, {
      props: {
        value: ['1'],
        multiple: true,
        placeholder: '请选择',
        changeValue,
        children: () => [render(Option, { props: { value: '1', label: 'Option 1' } })],
      },
    });

    // 打开下拉框
    const select = screen.getByTestId('select');
    const selectInput = select.querySelector('.select__input');
    await fireEvent.click(selectInput);

    // 取消选择
    await fireEvent.click(screen.getByText('Option 1'));

    await waitFor(() => {
      expect(changeValue).toHaveBeenCalledWith([]);
    });

    // 验证显示placeholder
    expect(screen.getByText('请选择')).toBeInTheDocument();
  });

  /**
   * 测试OptionData.length为0时在下拉列表中显示暂无数据
   */
  it('Select 组件 OptionData.length为0时显示暂无数据', async () => {
    render(Select, {
      props: {
        filterable: true,
        children: () => [render(Option, { props: { value: '1', label: 'Option 1' } })],
      },
    });

    // 打开下拉框
    const select = screen.getByTestId('select');
    const selectInput = select.querySelector('input');
    await fireEvent.click(selectInput);

    // 输入不匹配搜索导致OptionData.length=0
    await fireEvent.input(selectInput, { target: { value: 'Nonexistent' } });

    expect(screen.getByText('暂无数据')).toBeInTheDocument();
  });

  /**
   * 测试单选模式下value为undefined的情况
   */
  it('Select 组件 单选模式value为undefined', () => {
    render(Select, {
      props: {
        value: undefined,
        placeholder: '请选择',
        children: () => [render(Option, { props: { value: '1', label: 'Option 1' } })],
      },
    });

    // 应该显示placeholder
    const selectInput = screen.getByTestId('select-input');
    expect(selectInput.placeholder).toBe('请选择');
  });

  /**
   * 测试单选模式下value为null的情况
   */
  it('Select 组件 单选模式value为null', () => {
    render(Select, {
      props: {
        value: null,
        placeholder: '请选择',
        children: () => [render(Option, { props: { value: '1', label: 'Option 1' } })],
      },
    });

    // 应该显示placeholder
    const selectInput = screen.getByTestId('select-input');
    expect(selectInput.placeholder).toBe('请选择');
  });

  /**
   * 测试单选模式下value为0的情况
   */
  it('Select 组件 单选模式value为0', async () => {
    const changeValue = vi.fn();

    render(Select, {
      props: {
        value: 0,
        changeValue,
        children: () => [render(Option, { props: { value: 0, label: 'Option 0' } }), render(Option, { props: { value: '1', label: 'Option 1' } })],
      },
    });

    // 验证初始选中值显示
    expect(screen.getByText('Option 0')).toBeInTheDocument();

    // 打开下拉框
    const select = screen.getByTestId('select');
    const selectInput = select.querySelector('.select__input');
    await fireEvent.click(selectInput);

    // 选择另一个选项
    await fireEvent.click(screen.getByText('Option 1'));

    await waitFor(() => {
      expect(changeValue).toHaveBeenCalledWith('1');
    });
  });

  /**
   * 测试多选模式下value为undefined的情况
   */
  it('Select 组件 多选模式value为undefined', () => {
    render(Select, {
      props: {
        value: undefined,
        multiple: true,
        placeholder: '请选择',
        children: () => [render(Option, { props: { value: '1', label: 'Option 1' } })],
      },
    });

    // 应该显示placeholder
    expect(screen.getByText('请选择')).toBeInTheDocument();
  });

  /**
   * 测试多选模式下value为null的情况
   */
  it('Select 组件 多选模式value为null', () => {
    render(Select, {
      props: {
        value: null,
        multiple: true,
        placeholder: '请选择',
        children: () => [render(Option, { props: { value: '1', label: 'Option 1' } })],
      },
    });

    // 应该显示placeholder
    expect(screen.getByText('请选择')).toBeInTheDocument();
  });

  /**
   * 测试多选模式下value包含0的情况
   */
  it('Select 组件 多选模式value包含0', async () => {
    const changeValue = vi.fn();

    render(Select, {
      props: {
        value: [0, '2'],
        multiple: true,
        changeValue,
        children: () => [
          render(Option, { props: { value: 0, label: 'Option 0' } }),
          render(Option, { props: { value: '1', label: 'Option 1' } }),
          render(Option, { props: { value: '2', label: 'Option 2' } }),
        ],
      },
    });

    // 验证初始选中值显示
    expect(screen.getByText('Option 0')).toBeInTheDocument();
    expect(screen.getByText('Option 2')).toBeInTheDocument();

    // 打开下拉框
    const select = screen.getByTestId('select');
    const selectInput = select.querySelector('.select__input');
    await fireEvent.click(selectInput);

    // 取消0选项
    await fireEvent.click(screen.getByText('Option 0'));

    await waitFor(() => {
      expect(changeValue).toHaveBeenCalledWith(['2']);
    });
  });

  /**
   * 测试Option label为0的情况
   */
  it('Option 组件 label为0', async () => {
    const changeValue = vi.fn();

    render(Select, {
      props: {
        value: '',
        changeValue,
        children: () => [render(Option, { props: { value: '1', label: 0 } })],
      },
    });

    // 打开下拉框
    const select = screen.getByTestId('select');
    const selectInput = select.querySelector('.select__input');
    await fireEvent.click(selectInput);

    // 验证label渲染为'0'
    expect(screen.getByText('0')).toBeInTheDocument();

    // 选择选项
    await fireEvent.click(screen.getByText('0'));

    await waitFor(() => {
      expect(changeValue).toHaveBeenCalledWith('1');
    });

    // 验证显示更新
    expect(screen.getByText('0')).toBeInTheDocument();
  });

  /**
   * 测试Option label为null或undefined的情况
   */
  it('Option 组件 label为null或undefined', () => {
    render(Select, {
      props: {
        children: () => [render(Option, { props: { value: '1', label: null } }), render(Option, { props: { value: '2', label: undefined } })],
      },
    });

    // 打开下拉框
    const select = screen.getByTestId('select');
    const selectInput = select.querySelector('.select__input');
    fireEvent.click(selectInput);

    // 假设label为null或undefined时渲染为空字符串或默认值，根据组件逻辑，可能不渲染或渲染空
    // 这里假设不报错，且能渲染
    expect(select).toBeInTheDocument();
  });

  /**
   * 测试搜索空字符串时显示所有选项
   */
  it('Select 组件 搜索空字符串显示所有选项', async () => {
    render(Select, {
      props: {
        filterable: true,
        children: () => [render(Option, { props: { value: '1', label: 'Apple' } }), render(Option, { props: { value: '2', label: 'Banana' } })],
      },
    });

    const select = screen.getByTestId('select');
    const selectInput = select.querySelector('input');
    await fireEvent.click(selectInput);

    // 输入空字符串
    await fireEvent.input(selectInput, { target: { value: '' } });

    expect(screen.getByText('Apple')).toBeInTheDocument();
    expect(screen.getByText('Banana')).toBeInTheDocument();
  });

  /**
   * 测试禁用状态下搜索不生效
   */
  it('Select 组件 禁用状态下搜索', async () => {
    render(Select, {
      props: {
        disabled: true,
        filterable: true,
        children: () => [render(Option, { props: { value: '1', label: 'Apple' } })],
      },
    });

    const select = screen.getByTestId('select');
    const selectInput = select.querySelector('input');

    // 尝试输入
    await fireEvent.input(selectInput, { target: { value: 'App' } });

    // 下拉框不应打开，搜索不应生效
    const optionsList = select.querySelector('.select__options');
    expect(optionsList).toHaveClass('is-hidden');
  });

  /**
   * 测试多选模式下标签取消所有后显示placeholder
   */
  it('Select 组件 多选模式标签取消所有', async () => {
    const changeValue = vi.fn();

    render(Select, {
      props: {
        value: ['1', '2'],
        multiple: true,
        placeholder: '请选择',
        changeValue,
        children: () => [render(Option, { props: { value: '1', label: 'Option 1' } }), render(Option, { props: { value: '2', label: 'Option 2' } })],
      },
    });

    // 打开下拉框
    const select = screen.getByTestId('select');
    const selectInput = select.querySelector('.select__input');
    await fireEvent.click(selectInput);

    // 点击第一个
    await fireEvent.click(screen.getByText('Option 1'));

    // 取消第一个
    await waitFor(() => {
      expect(changeValue).toHaveBeenCalledWith(['2']);
    });

    // 点击第二个
    await fireEvent.click(screen.getByText('Option 2'));

    // 取消第二个
    await waitFor(() => {
      expect(changeValue).toHaveBeenCalledWith([]);
    });

    // 显示placeholder
    expect(screen.getByText('请选择')).toBeInTheDocument();
  });

  /**
   * 测试Option value为0的情况在单选
   */
  it('Option 组件 value为0在单选', async () => {
    const changeValue = vi.fn();

    render(Select, {
      props: {
        value: '',
        changeValue,
        children: () => [render(Option, { props: { value: 0, label: 'Option 0' } })],
      },
    });

    const select = screen.getByTestId('select');
    const selectInput = select.querySelector('.select__input');
    await fireEvent.click(selectInput);

    await fireEvent.click(screen.getByText('Option 0'));

    await waitFor(() => {
      expect(changeValue).toHaveBeenCalledWith(0);
    });
  });

  /**
   * 测试selectedLabel.length === 0 时显示placeholder在多选
   */
  it('Select 组件 多选selectedLabel.length === 0', () => {
    render(Select, {
      props: {
        multiple: true,
        value: [],
        placeholder: '请选择',
        children: () => [],
      },
    });

    expect(screen.getByText('请选择')).toBeInTheDocument();
  });

  /**
   * 测试OptionData.length > 0 时渲染选项
   */
  it('Select 组件 OptionData.length > 0 渲染', async () => {
    render(Select, {
      props: {
        children: () => [render(Option, { props: { value: '1', label: 'Option 1' } })],
      },
    });

    const select = screen.getByTestId('select');
    const selectInput = select.querySelector('.select__input');
    await fireEvent.click(selectInput);

    expect(screen.getByText('Option 1')).toBeInTheDocument();
  });

  /**
   * 测试可以通过键盘操作打开下拉框
   */
  it('Select 组件 键盘操作打开下拉框', async () => {
    render(Select, {
      props: {
        children: () => [render(Option, { props: { value: '1', label: 'Option 1' } })],
      },
    });

    const select = screen.getByTestId('select');

    // 按下回车打开下拉框
    await fireEvent.keyDown(select, { key: 'Enter', code: 'Enter' });

    expect(screen.getByText('Option 1')).toBeInTheDocument();
  });
});
