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
  style="left: {fixedX}px; top: {fixedY}px; transform: translate(-50%, -100%) rotate({rotation}deg);"
  tabindex="0"
  role="button"
  aria-label="分数: {score}"
>
  <div class="badge-circle">
    <div class="inner-circle">
      <span class="score-text">{score}</span>
      <div class="score-underline"></div>
      <div class="score-underline"></div>
    </div>
    <div class="decorative-lines">
      <div class="line line-1"></div>
      <div class="line line-2"></div>
      <div class="line line-3"></div>
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
  }
  
  .badge-circle {
    /* 使用固定像素值确保大小不变 */
    width: 75px;
    height: 75px;
    min-width: 75px;
    min-height: 75px;
    max-width: 75px;
    max-height: 75px;
    background-color: white;
    border: 3px solid #ef4444;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
    position: relative;
    overflow: hidden;
    flex-shrink: 0;
    /* 防止缩放 */
    transform-origin: center;
  }
  
  .inner-circle {
    position: relative;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
  }
  
  .score-text {
    /* 使用固定像素值确保字体大小不变 */
    font-size: 24px;
    font-weight: bold;
    color: #ef4444;
    line-height: 1;
    position: relative;
    z-index: 2;
    white-space: nowrap;
  }
  
  .score-underline {
    width: 30px;
    height: 2px;
    background-color: #ef4444;
    margin-top: 2px;
    border-radius: 1px;
    position: relative;
    z-index: 2;
  }
  
  .decorative-lines {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    pointer-events: none;
  }
  
  .line {
    position: absolute;
    background-color: #ef4444;
    opacity: 0.3;
    border-radius: 1px;
  }
  
  .line-1 {
    width: 20px;
    height: 1px;
    top: 15px;
    left: 10px;
    transform: rotate(25deg);
  }
  
  .line-2 {
    width: 15px;
    height: 1px;
    top: 45px;
    right: 8px;
    transform: rotate(-30deg);
  }
  
  .line-3 {
    width: 12px;
    height: 1px;
    bottom: 18px;
    left: 12px;
    transform: rotate(45deg);
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
      font-size: 20px;
    }
  }
</style>
