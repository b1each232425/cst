<script>
  let { content } = $props();
</script>

<footer>
  <p class="copyright">{content}</p>
</footer>

<style lang="scss" scoped>
  footer {
    position: relative;
    left: 0;
    width: 100%;
    height: 52px;
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
