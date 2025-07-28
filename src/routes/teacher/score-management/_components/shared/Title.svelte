<script>
    let { title } = $props();
</script>

<div class="title-bar">
    <div class="blue-bar"></div>
    <h1 class="title">{title}</h1>
    <div class="divider"></div>
</div>

<style lang="scss" scoped>
  .title-bar {
    padding: 0px 25px 5px 25px;
    display: flex;
    align-items: center;
  }

  .blue-bar {
    width: 10px;
    height: 26px;
    background-color: #0052d9; // Use explicit color for now
    border-radius: 5px;
  }

  .title {
    font-size: 20px;
    font-weight: bold;
    color: #333333;
    margin: 0 10px;
    line-height: 1;
  }

  .divider {
    height: 1px;
    flex: 1;
    background-color: #e0e0e0;
    margin-left: 15px;
    margin-right: 10px;
    min-height: 1px;
    position: relative;
  }
</style> 