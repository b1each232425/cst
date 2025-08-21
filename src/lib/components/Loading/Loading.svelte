<!--
   Loading 组件使用说明

   作者：熊炜
   邮箱：1062051028@qq.com

   参数配置：
   @param {Boolean} is_loading            控制加载状态的开关，true 为加载中，false 为加载完成，类型为 boolean。
   @param {String} loading_text           自定义加载时显示的文本，默认显示为 "加载中..."，类型为 string。
   @param {Boolean} is_fullscreen         控制 loading 是否为全屏显示，默认为 true。为 true 时，使用全屏模式，反之为局部模式，类型为 boolean。

   函数说明：
   @event bind:value                      绑定加载状态的值，在父组件中控制加载的显示与隐藏，类型为 { value: boolean }。

   全屏模式：
   <Loading
     bind:value={is_loading}              // 控制加载状态（变量名遵循下划线命名法）
     loading_text="正在加载"              // 自定义加载提示文本（变量名遵循下划线命名法）
   />

   // 父组件控制加载状态的函数示例（函数名遵循驼峰命名法）：
   let is_loading = $state(false);  // 初始加载状态为 false
   function openLoading() {         // 打开加载
     is_loading = true;
     setTimeout(() => {
       closeLoading();
     }, 10000);  // 10秒后自动关闭加载状态
   }

   function closeLoading() {        // 关闭加载
     is_loading = false;  // 关闭加载状态
   }

   局部模式：
   // 外面套一个自定义盒子，laoding会自动充满这个盒子
   <div class="parent-container">
      <p>hshsh</p>
      <Loading bind:value={is_loading} loading_text="加载中..." is_fullscreen={false} />
   </div>

   // 盒子样式要加上相对定位
  .parent-container {
    position: relative; /* 设置父容器为相对定位 */
    width: 100px; /* 可以设置固定宽度或百分比 */
    height: 300px; /* 设定高度 */
  }
-->

<script>
  let { value: is_loading, loading_text, is_fullscreen = true } = $props();

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

    // 校验 is_fullscreen 是否为布尔值
    if (typeof is_fullscreen !== 'boolean') {
      console.warn(`[Loading] is_fullscreen 应该是布尔值，当前为 ${typeof is_fullscreen}`);
      is_fullscreen = false; // 设置默认值
    }
  })();
</script>

{#if is_loading}
  {#if is_fullscreen}
    <!-- 全屏loading -->
    <div class="loading-fullscreen">
      <div class="loading-container">
        <img class="loading-img" src="/loading/loading.svg" alt="Loading..." />
        <p>{loading_text}</p>
      </div>
    </div>
  {:else}
    <!-- 局部loading，父元素需要设置相对定位 -->
    <div class="loading-overlay">
      <div class="loading-container">
        <img class="loading-img" src="/loading/loading.svg" alt="Loading..." />
        <p>{loading_text}</p>
      </div>
    </div>
  {/if}
{/if}

<style>
  /* 全屏loading */
  .loading-fullscreen {
    position: fixed; /* 使用fixed确保覆盖整个屏幕 */
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.5); /* 背景变暗 */
    display: flex;
    justify-content: center;
    align-items: center;
    z-index: 9999; /* 确保在最前面 */
  }

  /* 局部loading */
  .loading-overlay {
    position: absolute; /* 相对父容器定位 */
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.5); /* 背景变暗 */
    display: flex;
    justify-content: center;
    align-items: center;
    z-index: 9999; /* 确保在最前面 */
  }

  .loading-container {
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
  }

  .loading-img {
    width: 80px;
    height: 80px;
    animation: spin 1s linear infinite; /* 应用旋转动画 */
  }

  p {
    color: white;
    margin-top: 10px;
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
