<script>
  /**
   * @type {{
   *   content: string; // 版权信息内容
   * }}
   */
  let { content } = $props();

  // 校验 content 参数
  (() => {
    if (typeof content !== 'string') {
      console.warn(`[Brand] content 应该是一个字符串，当前为 ${typeof content}`);
      content = ''; // 设置默认值为空字符串
    }
    if (content.trim() === '') {
      console.warn('[Brand] 版权信息内容不能为空');
      content = '版权所有'; // 设置默认值
    }
  })();
</script>

<footer>
  <p class="copyright">{content}</p>
</footer>

<style lang="scss" scoped>
  footer {
    position: relative;
    left: 0;
    width: 100%;
    height: 50px;
    padding: 2px 2px 2px 2px;
    margin: 0;
    color: #333333;
    border: 1px solid #f7f8fd;
    background-color: #f5f5f5;
    box-sizing: border-box;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .copyright {
    width: fit-content;
    height: 48%;
    background-color: rgba(255, 255, 255, 0);
    box-sizing: border-box;
    font-family: 'Arial', sans-serif;
    color: #333333;
    text-align: center;
    margin: 0;
  }
</style>
