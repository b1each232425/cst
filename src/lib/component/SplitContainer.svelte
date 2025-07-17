<script>
  import { onMount, createEventDispatcher } from 'svelte';

  // 初始宽度比例
  let leftWidth = 50;
  let isDragging = false;

  // 创建事件分发器
  const dispatch = createEventDispatcher();

  // 处理鼠标按下事件
  function handleMouseDown(e) {
    isDragging = true;
    // 防止文本选择
    e.preventDefault();

    // 添加全局事件监听
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  }

  // 处理鼠标移动事件
  function handleMouseMove(e) {
    if (!isDragging) return;

    // 获取父容器
    const container = document.querySelector('.split-container');
    if (!container) return;

    // 计算鼠标在容器内的相对位置
    const rect = container.getBoundingClientRect();
    const x = e.clientX - rect.left;

    // 计算新的宽度比例(0-100)
    let newWidth = (x / rect.width) * 100;

    // 限制范围在10%-90%之间，避免一个容器完全消失
    newWidth = Math.max(10, Math.min(90, newWidth));

    // 更新状态
    leftWidth = newWidth;
  }

  // 处理鼠标释放事件
  function handleMouseUp() {
    isDragging = false;

    // 移除全局事件监听
    document.removeEventListener('mousemove', handleMouseMove);
    document.removeEventListener('mouseup', handleMouseUp);
  }

  // 组件销毁时清理事件监听
  onMount(() => {
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  });
</script>

<div class="split-container">
  <!-- 左侧容器 -->
  <div class="left" style="width: {leftWidth}%">
    <slot name="left">左侧内容</slot>
  </div>

  <!-- 分隔条 -->
  <div
    class="divider-container"
    on:mousedown={handleMouseDown}
  >
    <div class="divider"></div>

  </div>

  <!-- 右侧容器 -->
  <div class="right" style="width: {100 - leftWidth}%;">
    <slot name="right">右侧内容</slot>
  </div>
</div>

<style scoped >
    .split-container {
        display: flex;
        /*flex-direction: column;*/
        align-items: center;
        justify-content: center;
        width: 100%;
        height: 100%;
        /*position: relative;*/
        overflow: hidden;
    }

    .left, .right {
        height: 100%;
        overflow: auto;
        width: 50%;
    }

    .divider-container {
        width: 14px;
        /*margin-left: 4px;*/
        /*margin-right: 4px;*/
        height: 100%;
        /*background-color: #ddd;*/
        cursor: col-resize;
        flex-shrink: 0;
        transition: background-color 0.2s;
        display: flex;
        justify-content: center;
        align-items: center;
    }

    .divider {
        width: 2px;
        height: 20px;
        background-color: #7b7b7b;
        border-radius: 6px;
    }

    .divider-container:hover, .divider-container:active {
        /*background-color: #1a90ff;*/
        .divider {
            background-color: #1a90ff;
            height: 100%;
        }
    }
</style>