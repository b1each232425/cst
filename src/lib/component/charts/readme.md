# BarChart.svelte 组件使用说明

## 组件功能

这是一个基于 ECharts 的 Svelte 图表组件，目前主要支持柱状图的展示，可自定义标题、X轴数据、Y轴数据和系列数据等配置。

## 使用方法

## 可配置属性

| 属性名      | 类型    | 默认值                                                       | 描述                       |
| ----------- | ------- | ------------------------------------------------------------ | -------------------------- |
| title_text  | String  | '成绩分布图'                                                 | 图表主标题文本             |
| xAxis_data  | Array   | ['100分', '90-99分', '80-89分', '70-70分', '60-69分', '60分以下'] | X轴数据                    |
| series_data | Array   | [120, 20, 150, 80, 70, 110]                                  | 系列数据（柱状图的数据值） |
| loading     | Boolean | false                                                        | 是否显示加载动画           |

## 响应式更新

组件会自动响应 props 的变化并更新图表。当传递给组件的 props（如 `title_text`、`xAxis_data` 或 `series_data`）发生变化时，图表会自动重新渲染以反映新的数据。

## 完整示例

```svelte
<script>
  import BarChart from "$lib/component/charts/BarChart.svelte"
  let xAxis_data = $state([])
  let series_data = $state([])

</script>

<BarChart bind:xAxis_data={xAxis_data} bind:series_data={series_data}/>

```