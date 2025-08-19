<script>
  import {onMount, onDestroy} from 'svelte'
  import * as echarts from 'echarts/core'
  import {
    TitleComponent,
    TooltipComponent,
    GridComponent,
    LegendComponent,
  } from 'echarts/components';
  import { CanvasRenderer } from 'echarts/renderers'
  import { BarChart } from 'echarts/charts'

  // 注册需要的组件
  echarts.use([
    TitleComponent,
    TooltipComponent,
    GridComponent,
    LegendComponent,
    CanvasRenderer,
    BarChart,   // 柱状图
  ])

  let {
    title_text = '成绩分布图',
    xAxis_data =  ['100分', '90-99分', '80-89分', '70-79分', '60-69分', '60分以下'],
    series_data = [120, 20, 150, 80, 70, 110],
    loading = false,
    show_title = true,
  } = $props()


  let option = {
    title: show_title ? {
      text: '成绩分布图',       // 主标题文本
      left: 'center',             // 标题水平居中
      top: '5%',                 // 标题位于顶部
      textStyle: {
        fontSize: 18,             // 标题字体大小
        fontWeight: 'normal',       // 标题字体粗细
        color: '#333'             // 标题字体颜色
      },
    } : null,
    tooltip: {
      trigger: 'axis', //坐标轴触发，主要在柱状图，折线图等会使用类目轴的图表中使用
      axisPointer: {// 坐标轴指示器，坐标轴触发有效
        type: 'shadow' // 默认为直线，可选为：'line' | 'shadow'
      }
    },

    grid: {
      top: show_title ? '20%' : '10%',
      bottom: '20%',
      left: '10%',
      right: '5%',
    },
    xAxis: {
      type: 'category',
      data: ['100分', '90-99分', '80-89分', '70-70分', '60-69分', '60分以下'],
      name: '分数段',
      nameLocation: 'middle',
      nameGap: 30,
      nameTextStyle: {
        fontSize: 14,
        color: '#333'
      },
      axisLabel: {
        //x轴文字的配置
        show: true,
        interval: 0,//使x轴文字显示全
      }
    },
    yAxis: {
      type: 'value',
      name: '人数',
      minInterval:1,
    },
    series: [
      {
        data: [120, 20, 150, 80, 70, 110],
        type: 'bar',
        barMaxWidth: 35,
        itemStyle: {
          color: "#5c7bd9",
        }
      }
    ]
  }

  let chartDom = null // DOM 元素引用
  let chartInstance = null // ECharts 实例

  // 初始化图表
  function initChart() {
    // console.log(chartDom)
    if (!chartDom) {
      console.log('chartDom is null')
      return
    }

    // 如果已存在实例，先销毁
    if (chartInstance) {
      chartInstance.dispose();
    }

    // 创建新实例
    chartInstance = echarts.init(chartDom);

    // 设置图表配置
    if (option) {
      chartInstance.setOption(option);
    }

    // 显示加载动画（如果需要）
    if (loading) {
      chartInstance.showLoading();
    } else {
      chartInstance.hideLoading();
    }

    window.addEventListener('resize', function () {
      // 改变图表尺寸，在容器大小发生改变时需要手动调用
      if (chartInstance) {
        // console.log('resize')
        chartInstance.resize()
      }
    })
  }

  // 更新图表（当 option 变化时）
  function updateChart() {
    // console.log('updateChart')
    if (chartInstance) {
      chartInstance.setOption(option)
      if (loading) {
        chartInstance.showLoading()
      } else {
        chartInstance.hideLoading()
      }
      if (chartInstance) {
        chartInstance.resize();
      }
    }
  }

  // 组件挂载后初始化图表
  onMount(() => {
    initChart()
  });

  // 当 option 变化时更新图表
  $effect(()=>{
    // console.log('effect: ', xAxis_data, series_data)
    if (show_title) {
      option.title.text = title_text
    }
    option.xAxis.data = JSON.parse(JSON.stringify(xAxis_data))
    option.series[0].data = JSON.parse(JSON.stringify(series_data))

    if (chartInstance) {
      chartInstance.setOption(option)
    }

    // console.log(option.series[0].data)

    updateChart()
  })

  // 组件销毁时释放资源
  onDestroy(() => {
    console.log('destroy')
    if (chartInstance) {
      chartInstance.dispose();
      chartInstance = null;
    }
  })

</script>

<!-- 图表容器 -->
<div id="chart-container" class="chart-container" bind:this={chartDom}></div>

<style>
    .chart-container {
        width: 100%;
        height: 100%;
    }
</style>