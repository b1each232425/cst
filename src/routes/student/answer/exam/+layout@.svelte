
  <!-- /*
   * @Author: PENG HAIFENG 1614818457@qq.com
   * @Date: 2025-04-14 10:55:37
 * @LastEditors: PENG HAIFENG 1614818457@qq.com
 * @LastEditTime: 2025-05-28 23:59:56
   * @FilePath: /tutorial-platform-fe/src/routes/student/studentAnswerExam/+layout.svelte
   * @Description: 考试练习作答布局
   */ -->
<script>
  // 使用$props()获取子组件
  let { children } = $props();
</script>

<div>
  <!-- 渲染子组件内容 -->
  {@render children()}
</div>
