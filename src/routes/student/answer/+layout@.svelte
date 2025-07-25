
  <!-- /*
   * @Author: OuYang Haobin 1242968386@qq.com
   * @Date: 2025-04-14 10:55:37
<<<<<<< HEAD
 * @LastEditors: OuYang Haobin 1242968386@qq.com
 * @LastEditTime: 2025-05-28 23:59:56
=======
   * @LastEditors: OuYang Haobin 1242968386@qq.com
   * @LastEditTime: 2025-05-21 11:14:08
>>>>>>> 446234fc83efcf2149a8c8c3ad264bc38aac95a9
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
