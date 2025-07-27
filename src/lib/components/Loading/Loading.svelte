<!--
   Loading 组件使用说明

   作者：熊炜
   邮箱：1062051028@qq.com

   参数配置：
   @param {Boolean} isLoading            控制加载状态的开关，true 为加载中，false 为加载完成  boolean
   @param {String} loadingText       自定义加载时显示的文本  string

   函数说明：
   @event bind:value                 绑定加载状态的值，在父组件控制加载的显示与隐藏  { value: boolean }

   使用示例：
   <Loading
     bind:value={isLoading}         // 控制加载状态
     loadingText="正在加载"         // 自定义加载提示文本
   />

   // 父组件控制加载状态（这只是一个例子，你可以在有需要的地方改变isLoading，用来实现组件的动态加载）
   let isLoading = $state(false);  // 初始加载状态为 false
   function openLoading() {
     isLoading = true;
     setTimeout(() => {
       closeLoading();
     }, 10000);  // 10秒后自动关闭加载状态
   }
   function closeLoading() {
     isLoading = false;  // 关闭加载状态
   }
-->

<script>
  let { value: isLoading, loadingText } = $props();
</script>

{#if isLoading}
  <div class="loading-overlay">
    <img class="loading-img" src="/loading/loading.svg" alt="Loading..." />
    <p>{loadingText}</p>
  </div>
{/if}

<style>
  .loading-overlay {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.5); /* 背景变暗 */
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    z-index: 9999; /* 确保在最前面 */

    .loading-img {
      width: 80px;
      height: 80px;
      animation: spin 1s linear infinite; /* 应用旋转动画 */
    }

    p {
      color: white;
    }
  }

  /* 定义旋转动画 */
  @keyframes spin {
    0% {
      transform: rotate(0deg); /* 从 0 度开始 */
    }
    100% {
      transform: rotate(360deg); /* 旋转到 360 度 */
    }
  }
</style>
