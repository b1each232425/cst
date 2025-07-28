<!-- /*
 * @Author: OuYang Haobin 1242968386@qq.com
 * @Date: 2025-04-19 10:19:22
 * @LastEditors: OuYang Haobin 1242968386@qq.com
 * @LastEditTime: 2025-04-30 15:42:10
 * @FilePath: /tutorial-platform-fe/src/lib/component/QuestionAnswer/option.svelte
 * @Description: 显示选项
 */ -->

<script>
  let { option } = $props();
  import "@3min/cst-tiptap/dist/style.css";
</script>

<div class="piptap-content">
  {@html option.value}
</div>
