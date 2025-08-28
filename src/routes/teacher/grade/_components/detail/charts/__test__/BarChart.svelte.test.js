import { describe, it, expect, vi, afterEach } from 'vitest';
import { render } from '@testing-library/svelte';
import BarChart from '../BarChart.svelte';
import { tick } from 'svelte';

let echartsSetOptionMock = vi.fn();
let echartsInstance;

vi.mock('echarts/core', async () => {
  const actual = await vi.importActual('echarts/core');
  return {
    ...actual,
    init: vi.fn(() => {
      echartsInstance = {
        setOption: echartsSetOptionMock,
        dispose: vi.fn(),
        showLoading: vi.fn(),
        hideLoading: vi.fn(),
        resize: vi.fn(),
      };
      return echartsInstance;
    }),
    use: vi.fn(),
  };
});

describe('BarChart 组件测试', () => {
  afterEach(() => {
    vi.clearAllMocks();
    echartsSetOptionMock.mockClear();
  });

  it('渲染出图表容器', () => {
    const { container } = render(BarChart);
    expect(container.querySelector('#chart-container')).toBeInTheDocument();
  });

  it('根据 props 设置自定义标题', async () => {
    render(BarChart, { props: { title_text: '我的图表' } });
    await new Promise(setImmediate);

    const lastCall = echartsSetOptionMock.mock.calls.at(-1)?.[0];
    expect(lastCall?.title?.text).toBe('我的图表');
  });

  it('当 show_title=false 时隐藏标题', () => {
    const { queryByText } = render(BarChart, {
      props: { title_text: '隐藏', show_title: false },
    });
    expect(queryByText('隐藏')).not.toBeInTheDocument();
  });

  it('当 props 变化时更新图表', async () => {
    const { rerender } = render(BarChart, {
      props: { xAxis_data: ['A', 'B'], series_data: [1, 2] },
    });
    rerender({ xAxis_data: ['A', 'B'], series_data: [10, 20] });
    await new Promise(setImmediate);
  });

  it('根据 loading 状态显示/隐藏加载动画', async () => {
    const { rerender } = render(BarChart, { props: { loading: false } });
    rerender({ loading: true });
    await new Promise(setImmediate);
    rerender({ loading: false });
    await new Promise(setImmediate);
  });

it('组件卸载时销毁图表实例', async () => {
  const spy = vi.spyOn(console, 'log').mockImplementation(() => {});
  const { unmount } = render(BarChart);
  
  // 等待组件挂载完成
  await tick();
  
  unmount();
  // 不需要额外的延迟，onDestroy 是同步的
  expect(spy).toHaveBeenCalledWith('destroy');
  spy.mockRestore();
});

  it('注册窗口 resize 事件监听器', () => {
    render(BarChart);
    window.dispatchEvent(new Event('resize'));
  });

  it('tooltip.formatter 返回正确提示文本', async () => {
    render(BarChart, {
      props: {
        xAxis_data: ['100分', '90-99分'],
        series_data: [120, 20],
      },
    });
    await new Promise(setImmediate);

    const option = echartsSetOptionMock.mock.calls.at(-1)?.[0];
    const formatter = option.tooltip.formatter;

    const mockParams = [
      { name: '90-99分', value: 20, dataIndex: 1 },
    ];
    const html = formatter(mockParams);
    expect(html).toBe('分数段：90-99分<br/>人数：20人');
  });

  it('tooltip.formatter 在空数组时返回空字符串', async () => {
    render(BarChart);
    await new Promise(setImmediate);

    const formatter =
      echartsSetOptionMock.mock.calls.at(-1)?.[0]?.tooltip?.formatter;
    expect(formatter([])).toBe('');
    expect(formatter(null)).toBe('');
  });

  
});