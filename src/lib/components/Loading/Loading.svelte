<!--
   Loading 组件使用说明

   作者：熊炜
   邮箱：1062051028@qq.com

   参数配置：
   @param {Boolean} is_loading            控制加载状态的开关，true 为加载中，false 为加载完成  boolean
   @param {String} loading_text       自定义加载时显示的文本  string

   函数说明：
   @event bind:value                 绑定加载状态的值，在父组件控制加载的显示与隐藏  { value: boolean }

   使用示例：
   <Loading
     bind:value={is_loading}         // 控制加载状态（变量用下划线）
     loading_text="正在加载"         // 自定义加载提示文本（变量用下划线）
   />

   // 父组件控制加载状态（函数仍用驼峰命名）
   let is_loading = $state(false);  // 初始加载状态为 false
   function openLoading() {         // 函数名保持驼峰
     is_loading = true;
     setTimeout(() => {
       closeLoading();
     }, 10000);  // 10秒后自动关闭加载状态
   }
   function closeLoading() {        // 函数名保持驼峰
     is_loading = false;  // 关闭加载状态
   }
-->

<script>
  let { value: is_loading, loading_text } = $props();

  /**
   * 校验传入的参数是否合法
   */
  (() => {
    // 校验 is_loading 是否为布尔值
    if (typeof is_loading !== 'boolean') {
      console.warn(`[Loading] is_loading 应该是布尔值，当前为 ${typeof is_loading}`);
      is_loading = false; // 设置默认值
    }

    // 校验 loading_text 是否为字符串
    if (typeof loading_text !== 'string') {
      console.warn(`[Loading] loading_text 应该是字符串，当前为 ${typeof loading_text}`);
      loading_text = '加载中...'; // 设置默认值
    }
  })();
</script>

{#if is_loading}
  <div class="loading-overlay">
    <img class="loading-img" src="/loading/loading.svg" alt="Loading..." />
    <p>{loading_text}</p>
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
