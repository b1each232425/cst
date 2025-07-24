<script>
  import Title from "../_components/Title.svelte";
</script>

<div class="add-practice-container">
    <Title title="创建练习" />
<div class="action-container">
    <div class="search-button-container">
<div class="search-box">
<input type="text" placeholder="请输入关键字" class="search-input">


</div>

    </div>
</div>
    
</div>

<style lang="scss">
 :global(*) {
    box-sizing: border-box;
  }
  $border-color: #e5e6eb;
  $primary-color: var(--blue);
.search-box{

}


</style>