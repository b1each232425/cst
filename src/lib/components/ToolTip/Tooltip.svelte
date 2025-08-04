<script>
  /**
   * @component Tooltip
   * @description 气泡提示组件
   *
   * @author 段春茂
   * @email 2162105974@qq.com
   *
   * @props
   * @property {Element} [target='']   - 触发气泡提示的元素，必填
   * @property {'top' | 'left' | 'right' | 'bottom'} [placement='bottom']   - 气泡框位置
   * @property {String} [content='']   - 气泡提示的内容
   * @property {String} [color='#ffffff']   - 组件背景颜色
   * @property {'click' | 'hover'} [hide_method='hover']   - 隐藏方式
   * @property {Boolean} [showActions=false]   - 使用对话框
   * @property {Boolean} [showTitle=false]   - 使用标题
   * @property {Boolean} [showCancel=true]   - 显示取消按钮
   * @property {Boolean} [title='']   - 标题内容
   * @property {Function} onConfirm   - 确认按钮回调函数
   * @property {Function} onCancel   - 取消按钮回调函数
   * @property {String} [onConfirmText='确认']  - 确认按钮文本
   * @property {String} [onCancelText='取消']  - 取消按钮文本
   */
  import { tick, onMount } from 'svelte';

  let { target, placement = 'bottom', content, color = '#ffffff', hide_method = 'hover', showActions = false, showCancel = true, showTitle = false, title, onConfirm = () => {}, onCancel = () => {}, onConfirmText = '确认', onCancelText = '取消' } = $props();

  // 状态数据
  let hideTimer;
  let isShow = $state(false);
  let Tooltip_Element = $state(null);
  let isAnimatingHide = $state(false);
  let isMouseOverTarget = $state(false);
  let isMouseOverTooltip = $state(false);
  let finalPlacement = $state('');

  // 防抖处理
  const debounce = (fn, delay) => {
    let timer;
    return (...args) => {
      clearTimeout(timer);
      timer = setTimeout(() => fn(...args), delay);
    };
  };

  // 节流函数
  function throttle(fn, wait = 100) {
    let lastTime = 0;
    return function (...args) {
      const now = Date.now();
      if (now - lastTime >= wait) {
        fn.apply(this, args);
        lastTime = now;
      }
    };
  }

  //动画效果
  function AnimatingHide() {
    isShow = false;
    isAnimatingHide = true;
    requestAnimationFrame(() => {
      setTimeout(() => {
        isAnimatingHide = false;
      }, 100);
    });
  }

  // 鼠标移动事件处理
  function handleMouseMove(event) {
    if (!target || !Tooltip_Element) return;
    if (isShow === (target.contains(event.target) || Tooltip_Element.contains(event.target))) return;
    if (target.contains(event.target) || Tooltip_Element.contains(event.target)) (clearTimeout(hideTimer), ((isShow = true), (isAnimatingHide = false)));
    else {
      hideTimer = setTimeout(() => {
        AnimatingHide();
      }, 500);
    }
  }
  const throttledHandleMouseMove = throttle(handleMouseMove, 100);

  // 处理滚轮事件
  function handlescroll() {
    if (isShow && target && Tooltip_Element) requestAnimationFrame(setPosition);
  }

  // 处理点击事件
  function handleClick(event) {
    if (!target || !Tooltip_Element) return;
    if (target.contains(event.target) && isShow === true) isShow = false;
    else if (isShow !== (target.contains(event.target) || Tooltip_Element.contains(event.target))) isShow = target.contains(event.target) || Tooltip_Element.contains(event.target);
  }

  // 处理气泡框位置
  function setPosition() {
    if (!Tooltip_Element || !target) return;
    const { width: targetWidth, height: targetHeight, x, y } = target.getBoundingClientRect();
    const { width: tooltipWidth, height: tooltipHeight } = Tooltip_Element.getBoundingClientRect();
    const setSite = (left, top) => ((Tooltip_Element.style.top = `${top}px`), (Tooltip_Element.style.left = `${left}px`));
    const position = {
      top: () => setSite(x + (targetWidth - tooltipWidth) / 2, y - (tooltipHeight + 5)),
      left: () => setSite(x - tooltipWidth - 5, y + (targetHeight - tooltipHeight) / 2),
      right: () => setSite(x + targetWidth + 5, y + (targetHeight - tooltipHeight) / 2),
      bottom: () => setSite(x + (targetWidth - tooltipWidth) / 2, y + targetHeight + 5),
    };
    // === 判断是否溢出视口并自动翻转 ===
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    finalPlacement = placement;
    const overflows = {
      top: y - tooltipHeight - 5 < 0,
      bottom: y + targetHeight + tooltipHeight + 5 > viewportHeight,
      left: x - tooltipWidth - 5 < 0,
      right: x + targetWidth + tooltipWidth + 5 > viewportWidth,
    };
    const flipMap = { top: 'bottom', bottom: 'top', left: 'right', right: 'left' };
    if (overflows[placement]) finalPlacement = flipMap[placement];
    return position[finalPlacement] ? position[finalPlacement]() : position.top();
  }
  const debouncedSetPosition = debounce(setPosition, 30);

  onMount(async () => {
    await tick();
    if (!target) return;
    setPosition();
    document.addEventListener('scroll', handlescroll);
    window.addEventListener('resize', debouncedSetPosition);
    if (hide_method === 'hover') window.addEventListener('mousemove', throttledHandleMouseMove);
    else window.addEventListener('click', handleClick);
    return () => {
      document.removeEventListener('scroll', handlescroll);
      window.removeEventListener('resize', debouncedSetPosition);
      if (hide_method === 'hover') window.removeEventListener('mousemove', throttledHandleMouseMove);
      else window.removeEventListener('click', handleClick);
    };
  });
</script>

<div class="Tooltip-wrapper {isShow ? 'show' : ''} {!isShow && isAnimatingHide ? 'fadeout' : ''}{!isShow && !isAnimatingHide ? 'hiddle' : ''}" bind:this={Tooltip_Element} data-placement={finalPlacement} role="tooltip">
  <div class="arrow"></div>
  <div class="content {showTitle ? 'with-title' : ''}" style="background-color: {color};">
    {#if showTitle}
      <div class="title">{title}</div>
    {/if}
    {@html content}
    {#if showActions}
      <div class="Actions">
        {#if showCancel}
          <button
            class="Cancel"
            onclick={async () => {
              await onCancel?.();
              AnimatingHide();
            }}>{onCancelText}</button
          >
        {/if}
        <button
          class="Confirm"
          onclick={async () => {
            await onConfirm?.();
            AnimatingHide();
          }}>{onConfirmText}</button
        >
      </div>
    {/if}
  </div>
</div>

<style scoped lang="scss">
  .Tooltip-wrapper {
  z-index: 9999;
  position: absolute;
  &.show {
    opacity: 1;
    transform: scale(1);
    pointer-events: auto;
    transition: all 0.3s ease-in-out;
  }
  &.fadeout {
    opacity: 0;
    transform: scale(0.8);
    pointer-events: none;
    transition: all 0.3s ease-in-out;
  }
  &.hiddle {
    opacity: 0;
    visibility: hidden;
    pointer-events: none;
  }
  .arrow {
    z-index: 10;
    position: absolute;
    width: 0;
    height: 0;
    &::after {
      content: '';
      position: absolute;
      border: 5px solid transparent;
    }
  }
  &[data-placement='top'] .arrow {
    bottom: 0;
    left: 50%;
    &::after {
      transform: translateX(-50%);
      border-top-color: #e2e2e2;
      top: 0;
    }
  }
  &[data-placement='bottom'] .arrow {
    top: -10px;
    left: 50%;
    &::after {
      transform: translateX(-50%);
      border-bottom-color: #e2e2e2;
      top: 0;
    }
  }
  &[data-placement='left'] .arrow {
    right: 0;
    top: 50%;
    &::after {
      transform: translateY(-50%);
      border-left-color: #e2e2e2;
      left: 0;
    }
  }
  &[data-placement='right'] .arrow {
    left: -10px;
    top: 50%;
    &::after {
      transform: translateY(-50%);
      border-right-color: #e2e2e2;
      left: 0;
    }
  }
  .content {
    padding: 0.3rem;
    border-radius: 0.2rem;
    box-shadow: 0 0 0.5rem rgba(0, 0, 0, 0.2);
    font-size: 9px;
    color: #333;
    z-index: 999;
    max-width: 300px;
    word-break: normal;
    white-space: nowrap;
    &.with-title {
      padding: 5px 7px;
    }
    .title {
      font-size: 0.8rem;
      font-weight: bold;
      margin-bottom: 0.2rem;
    }
    .Actions {
      display: flex;
      justify-content: flex-end;
      margin-top: 0.5rem;
      font-size: 0.8rem;
      button {
        all: unset;
      }
      .Confirm {
        margin-left: 0.2rem;
        background-color: #4280d6;
        color: #fff;
        border: none;
        padding: 0.2rem 0.3rem;
        border-radius: 0.2rem;
        cursor: pointer;
        &:hover {
          background-color: #5b8fd8;
        }
      }
      .Cancel {
        background-color: #919191;
        color: #fff;
        border: none;
        padding: 0.2rem 0.3rem;
        border-radius: 0.2rem;
        cursor: pointer;
        &:hover {
          background-color: rgb(162, 159, 159);
        }
      }
    }
  }
}
:global(.Tooltip-container) {
  position: fixed;
  top: 0;
  left: 0;
  z-index: 9999;
}
</style>
