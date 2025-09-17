<script>
  import { onMount, onDestroy } from 'svelte';
  
  let { 
    score = 40, 
    x = 50, // 现在表示距离左边的像素值
    y = 20, // 现在表示距离顶部的像素值
    visible = true,
    rotation = -8,
    duration = 0, // 设置为0，不自动消失
    onHide = () => {} // 消失时的回调函数
  } = $props();
  
  let isVisible = $state(visible);
  let timer = null;
  let windowWidth = $state(0);
  let windowHeight = $state(0);
  
  // 屏幕宽度检测 - 小于1200px时隐藏
  let shouldHideOnSmallScreen = $derived(windowWidth > 0 && windowWidth < 1200);
  let finalVisible = $derived(visible && !shouldHideOnSmallScreen);
  
  // 计算相对于视口的固定位置
  let fixedX = $derived.by(() => {
    // 如果x是百分比值（0-100），转换为像素值
    if (x <= 100) {
      return (windowWidth * x) / 100;
    }
    // 如果x已经是像素值，直接使用
    return x;
  });
  
  let fixedY = $derived.by(() => {
    // 如果y是百分比值（0-100），转换为像素值
    if (y <= 100) {
      return ((windowHeight * y) / 100) - 10;
    }
    // 如果y已经是像素值，直接使用
    return y;
  });
  
  onMount(() => {
    // 获取初始窗口尺寸
    windowWidth = window.innerWidth;
    windowHeight = window.innerHeight;
    
    // 监听窗口尺寸变化
    const handleResize = () => {
      windowWidth = window.innerWidth;
      windowHeight = window.innerHeight;
    };
    
    window.addEventListener('resize', handleResize);
    
    if (finalVisible && duration > 0) {
      // 设置定时器
      timer = setTimeout(() => {
        hideComponent();
      }, duration);
    }
    
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  });
  
  onDestroy(() => {
    if (timer) {
      clearTimeout(timer);
    }
  });
  
  function hideComponent() {
    // 直接隐藏，无动画
    isVisible = false;
    onHide();
  }
  
  // 监听 finalVisible 属性变化（包含屏幕宽度检测）
  $effect(() => {
    if (finalVisible) {
      isVisible = true;
      // 重新设置定时器
      if (timer) clearTimeout(timer);
      if (duration > 0) {
        timer = setTimeout(() => {
          hideComponent();
        }, duration);
      }
    } else {
      // 直接隐藏，无动画
      isVisible = false;
      if (timer) clearTimeout(timer);
    }
  });
</script>

{#if isVisible}
  <div 
  class="score-badge"
  style="left: {Math.round(fixedX)}px; top: {Math.round(fixedY)}px; transform: translate(-50%, -100%) rotate({rotation}deg);"
  tabindex="0"
  role="button"
  aria-label="分数: {score}"
>
  <div class="badge-circle">
    <!-- 内联 SVG 作为徽章背景，使用 currentColor 以便通过 CSS 控制颜色 -->
  <svg class="badge-svg" viewBox="0 0 1024 1024" xmlns="http://www.w3.org/2000/svg" width="100%" height="100%" role="img" aria-hidden="true" focusable="false" style="fill: currentColor;">
      <path d="M511.95 1010.01c-275.56 0-500-224.25-500-499.81s224.44-500.19 500-500.19 500 224.25 500 500.19-224.44 499.81-500 499.81z m0-989.96c-270.18 0-490.01 219.78-490.01 490.15s219.83 490.15 490.01 490.15 490.01-219.78 490.01-490.15S782.13 20.05 511.95 20.05z" p-id="1981"></path>
      <path d="M511.95 1020.01c-281.21 0-510-228.7-510-509.81C1.95 228.88 230.74 0.01 511.95 0.01c281.22 0 510 228.87 510 510.19 0 281.1-228.79 509.81-510 509.81z m0-989.96c-264.68 0-480.01 215.39-480.01 480.15 0 264.75 215.33 480.15 480.01 480.15 264.68 0 480.01-215.39 480.01-480.15S776.63 30.05 511.95 30.05z" p-id="1982"></path>
      <path d="M511.95 915.19c-223.08 0-405-181.55-405-405s181.92-405 405-405 405 181.55 405 405-181.56 405-405 405z m0-807.27c-221.68 0-401.83 180.19-401.83 401.93s180.16 401.93 401.83 401.93S913.78 731.6 913.78 509.85 733.63 107.92 511.95 107.92z" p-id="1983"></path>
      <path d="M256.95 742.66h510v3.37h-510z" p-id="1984"></path>
      <path d="M767.45 746.53h-511v-4.37h511v4.37z m-510-1h509v-2.37h-509v2.37z" p-id="1985"></path>
      <path d="M261.97 689.51h498.71v3.37H261.97z" p-id="1986"></path>
      <path d="M256.32 683.51h510v15.37h-510z" p-id="1987"></path>
    </svg>

    <div class="inner-circle">
      <span class="score-text">{score}</span>
    </div>

   
  </div>
</div>
{/if}

<style>
  .score-badge {
    position: fixed;
    z-index: 9999;
    user-select: none;
    transform-origin: center;
    /* 确保在不同设备上大小一致 */
    font-size: 16px; /* 基础字体大小 */
    /* 保留旋转的过渡效果 */
    transition: transform 0.3s ease;
    /* 默认徽章颜色（红色），SVG 使用 currentColor */
    color: #ef4444;
  }
  
  .badge-circle {
    /* 使用 SVG 图片作为背景层，保持固定大小 */
    width: 95px;
    height: 95px;
    min-width: 95px;
    min-height: 95px;
    max-width: 95px;
    max-height: 95px;
    display: flex;
    align-items: center;
    justify-content: center;
    position: relative;
    overflow: visible;
    flex-shrink: 0;
    transform-origin: center;
  }
  
  .inner-circle {
    position: absolute;
    inset: 0;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    pointer-events: none;
    z-index: 2;
  }
  
  .score-text {
    /* 使用固定像素值确保字体大小不变 */
    font-size: 32px;
    font-weight: bold;
    color: #ef4444;
    line-height: 1;
    position: relative;
    z-index: 2;
    white-space: nowrap;
    /* 向右上微移，使文本更贴合徽章视觉中心（根据需要调整数值） */
    transform: translate(0px, -4px);
  }

  /* 确保文字位于 SVG 之上 */
  .score-text {
    z-index: 2;
    position: relative;
  }

  /* SVG 背景图像 */
  .badge-svg {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
    object-fit: contain;
    pointer-events: none;
    z-index: 0;
    /* Improve sharpness at small sizes */
    shape-rendering: geometricPrecision;
    image-rendering: -webkit-optimize-contrast;
    vector-effect: non-scaling-stroke;
  }
  
  /* 注：以下装饰性元素已从 DOM 中移除，相关样式也被删除以避免 Svelte 的未使用选择器警告。 */

  /* 额外的渲染优化 */
  .score-badge {
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
    backface-visibility: hidden;
    transform: translateZ(0);
  }
  
  /* 媒体查询确保在不同屏幕尺寸下保持一致 */
  @media (max-width: 768px) {
    .score-badge {
      /* 在小屏幕上可以稍微调整，但保持相对固定 */
      font-size: 14px;
    }
    
    .badge-circle {
      /* 小屏幕上可以稍微缩小，但仍然固定 */
      width: 65px;
      height: 65px;
      min-width: 65px;
      min-height: 65px;
      max-width: 65px;
      max-height: 65px;
    }
    
    .score-text {
      font-size: 28px;
    }
  }
</style>
