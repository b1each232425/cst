<!-- /*
 * @Author: OuYang Haobin 1242968386@qq.com
 * @Date: 2025-06-05 22:00:48
 * @LastEditors: OuYang Haobin 1242968386@qq.com
 * @LastEditTime: 2025-06-05 22:00:51
 * @FilePath: /tutorial-platform-fe/src/routes/student/studentAnswerPractice/+layout@.js
 * @Description: 这是默认设置,请设置`customMade`, 打开koroFileHeader查看配置 进行设置: https://github.com/OBKoro1/koro1FileHeader/wiki/%E9%85%8D%E7%BD%AE
 */ -->

<script>
  // 使用$props()获取子组件
  let { children } = $props();
</script>

<div>
  <!-- 渲染子组件内容 -->
  {@render children()}
</div>
