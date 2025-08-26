import { describe, it, expect, vi, afterEach } from 'vitest'
import { render } from '@testing-library/svelte'
import BarChart from '../BarChart.svelte'

// 1. mock echarts/core
vi.mock('echarts/core', async () => {
  const actual = await vi.importActual('echarts/core')
  return {
    ...actual,
    init: vi.fn(() => ({
      setOption: vi.fn(),
      dispose: vi.fn(),
      showLoading: vi.fn(),
      hideLoading: vi.fn(),
      resize: vi.fn(),
    })),
    use: vi.fn(),
  }
})

describe('BarChart', () => {
  afterEach(() => {
    vi.clearAllMocks()
  })

  it('renders container', () => {
    const { container } = render(BarChart)
    expect(container.querySelector('#chart-container')).toBeInTheDocument()
  })

  it('shows custom title', () => {
    const { getByText } = render(BarChart, {
      props: { title_text: '我的图表' },
    })
    expect(getByText('我的图表')).toBeInTheDocument()
  })

  it('hides title when show_title=false', () => {
    const { queryByText } = render(BarChart, {
      props: { title_text: '隐藏', show_title: false },
    })
    expect(queryByText('隐藏')).not.toBeInTheDocument()
  })

  it('updates chart when props change', async () => {
    const { component } = render(BarChart, {
      props: { xAxis_data: ['A', 'B'], series_data: [1, 2] },
    })
    await component.$set({ series_data: [10, 20] })
  })

  it('shows/hides loading', async () => {
    const { component } = render(BarChart)
    await component.$set({ loading: true })
    await component.$set({ loading: false })
  })

  it('destroys chart on unmount', () => {
    const spy = vi.spyOn(console, 'log').mockImplementation(() => {})
    const { unmount } = render(BarChart)
    unmount()
    expect(spy).toHaveBeenCalledWith('destroy')
    spy.mockRestore()
  })

  it('registers resize listener', () => {
    render(BarChart)
    window.dispatchEvent(new Event('resize'))
  })
})