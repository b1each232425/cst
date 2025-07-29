<!-- /**
  * 气泡提示组件使用说明
  *
  * 作者：段春茂
  * 邮箱：2162105974@qq.com
  *
  * 参数配置：
  * @param {Element} target      触发气泡提示的元素，必填
  * @param {String} placement    气泡框位置，可选值: top | left | right | bottom 
  * @param {String} content      气泡提示的内容，可以是文本或 HTML 内容
  * @param {String} color         组件背景颜色，默认值为 #ffffff
  * @param {String} hide_method  隐藏方式，可选值: click | hover
  * @param {Boolean} showActions  使用对话框  可选值: true | false
  * @param {Boolean} showTitle    使用标题  可选值: true | false
  * @param {Boolean} showCancel  显示取消按钮  可选值: true | false
  * @param {Boolean} title        标题内容  
  * @param {Function} onConfirm   确认按钮回调函数    
  * @param {Function} onCancel    取消按钮回调函数
  * @param {String} onConfirmText  确认按钮文本
  * @param {String} onCancelText   取消按钮文本
  * }
  *
  * 使用方式：
  * 使用方式请看同目录下的js文件，具体使用方法请参考该文件中的注释。
  * 这个不支持svelte组件式使用方式，只支持函数式调用。
  */ -->
<script>
  import { tick, onMount } from 'svelte';

  // 定义 props
  let { target, placement = 'bottom', content, color = '#ffffff', hide_method = 'hover', showActions = false, showCancel = true, showTitle = false, title, onConfirm = () => {}, onCancel = () => {}, onConfirmText = '确认', onCancelText = '取消' } = $props();

  // 状态数据
  let hideTimer;
  let isShow = $state(false);
  let Tooltip_Element = $state(null);
  let isAnimatingHide = $state(false);
  let isMouseOverTarget = $state(false);
  let isMouseOverTooltip = $state(false);

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

  function AnimatingHide() {
    isShow = false;
    isAnimatingHide = true;
    setTimeout(() => {
      isAnimatingHide = false;
    }, 300);
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
    const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
    const scrollLeft = window.pageXOffset || document.documentElement.scrollLeft;
    const setSite = (left, top) => ((Tooltip_Element.style.top = `${top + scrollTop}px`), (Tooltip_Element.style.left = `${left + scrollLeft}px`));
    const position = {
      top: () => setSite(x + (targetWidth - tooltipWidth) / 2, y - (tooltipHeight + 5)),
      left: () => setSite(x - tooltipWidth - 5, y + (targetHeight - tooltipHeight) / 2),
      right: () => setSite(x + targetWidth + 5, y + (targetHeight - tooltipHeight) / 2),
      bottom: () => setSite(x + (targetWidth - tooltipWidth) / 2, y + targetHeight + 5),
    };
    return position[placement] ? position[placement]() : position.top();
  }
  const debouncedSetPosition = debounce(setPosition, 33);

  onMount(async () => {
    await tick();
    setPosition();
    window.addEventListener('resize', debouncedSetPosition);
    if (hide_method === 'hover') document.addEventListener('mousemove', throttledHandleMouseMove);
    else document.addEventListener('click', handleClick);
    return () => {
      window.removeEventListener('resize', debouncedSetPosition);
      if (hide_method === 'hover') window.removeEventListener('mousemove', throttledHandleMouseMove);
      else window.removeEventListener('click', handleClick);
    };
  });
</script>

<div class="Tooltip-wrapper {isShow ? 'show' : ''} {!isShow && isAnimatingHide ? 'fadeout' : ''}{!isShow && !isAnimatingHide ? 'hiddle' : ''}" bind:this={Tooltip_Element} data-placement={placement} role="tooltip">
  <div class="Tooltip-arrow"></div>
  <div class="Tooltip-content {showTitle ? 'with-title' : ''}" style="background-color: {color};">
    {#if showTitle}
      <div class="Tooltip-title">{title}</div>
    {/if}
    {@html content}
    {#if showActions}
      <div class="Tooltip-Actions">
        {#if showCancel}
          <button
            class="Tooltip-Cancel"
            onclick={async () => {
              await onCancel?.();
              AnimatingHide();
            }}>{onCancelText}</button
          >
        {/if}
        <button
          class="Tooltip-Confirm"
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
    .Tooltip-arrow {
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
    &[data-placement='top'] .Tooltip-arrow {
      bottom: 0;
      left: 50%;
      &::after {
        transform: translateX(-50%);
        border-top-color: #e2e2e2;
        top: 0;
      }
    }
    &[data-placement='bottom'] .Tooltip-arrow {
      top: -10px;
      left: 50%;
      &::after {
        transform: translateX(-50%);
        border-bottom-color: #e2e2e2;
        top: 0;
      }
    }
    &[data-placement='left'] .Tooltip-arrow {
      right: 0;
      top: 50%;
      &::after {
        transform: translateY(-50%);
        border-left-color: #e2e2e2;
        left: 0;
      }
    }
    &[data-placement='right'] .Tooltip-arrow {
      left: -10px;
      top: 50%;
      &::after {
        transform: translateY(-50%);
        border-right-color: #e2e2e2;
        left: 0;
      }
    }
    .Tooltip-content {
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
      .Tooltip-title {
        font-size: 0.8rem;
        font-weight: bold;
        margin-bottom: 0.2rem;
      }
      .Tooltip-Actions {
        display: flex;
        justify-content: flex-end;
        margin-top: 0.5rem;
        font-size: 0.8rem;
        button {
          all: unset;
        }
        .Tooltip-Confirm {
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
        .Tooltip-Cancel {
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
