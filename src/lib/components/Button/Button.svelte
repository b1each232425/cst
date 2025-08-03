<script>
  /**
   * @component Button
   * @description 通用按钮组件，支持图标、不同样式、尺寸、圆角、插槽等
   *
   * @author 段春茂
   * @email 2162105974@qq.com
   *
   * @props
   * @property {boolean} [plain=false] - 是否为朴素按钮，hover 时填充背景
   * @property {'small' | 'medium' | 'large'} [size='medium'] - 按钮尺寸
   * @property {'primary' | 'success' | 'danger' | 'warning' | 'info'} [type='primary'] - 按钮类型
   * @property {boolean} [disabled=false] - 是否禁用按钮
   * @property {boolean} [round=false] - 是否圆角按钮
   * @property {string} [icon=''] - 图标地址（URL 或本地路径）
   * 
   * @property {any} children - 默认插槽内容
   * @property {...any} restProps - 其他传入 button 的原生属性
   *
   * @slots
   * @slot default - 默认插槽,显示在按钮主体位置
   *
   * @example
   * <Button type="primary" size="large" round> 提交 </Button>
   * <Button type="danger" size="small" icon="/alert.svg"> 警告 </Button>
   */
  import { onMount } from 'svelte';

  let {
    plain = false,
    size = 'medium',
    type = 'primary',
    disabled = false,
    round = false,
    icon = '',
    alt = '',
    children,
    ...restProps
  } = $props();

  const validTypes = ['primary', 'success', 'danger', 'warning', 'info'];
  const validSizes = ['small', 'medium', 'large'];

  /**
   * 组合按钮的类名
   *  @type {string}
   * */
  let classes = $state(
    ['Button', `${size}`, `${type}`, plain && 'plain', disabled && 'disabled', round && 'round']
      .filter(Boolean)
      .join(' '),
  );

  /**
   * 检查传入参数的合法性
   * @type {function}
   */
  function checkProps() {
    if (!validTypes.includes(type.trim())) {
      console.warn(`Button 类型无效: '${type}'，应为 ${validTypes.join(', ')}`);
      type = 'primary';
    }
    if (!validSizes.includes(size.trim())) {
      console.warn(`Button 尺寸无效: '${size}'，应为 ${validSizes.join(', ')}`);
      size = 'medium';
    }
    if (typeof round !== 'boolean') {
      console.warn(`[Button] round 必须是布尔值`);
      round = false;
    }
    if (typeof plain !== 'boolean') {
      console.warn(`[Button] plain 必须是布尔值`);
      plain = false;
    }
    if (typeof disabled !== 'boolean') {
      console.warn(`[Button] disabled 必须是布尔值`);
      disabled = false;
    }
  }

  onMount(() => {
    checkProps();
  });
</script>

<button class={classes} {disabled} {...restProps}>
  {#if icon}
    <img class="icon" src={icon} alt={alt ? alt : '按钮图标'} />
  {/if}
  <span class="text">{@render children?.()} </span>
</button>

<style lang="scss" scoped>
  /** 内容居中布局 @mixin content-center*/
  @mixin content-center {
    display: flex;
    align-items: center;
    justify-content: center;
  }
  /** 默认按钮类型（填充型按钮）@param {Color} $color - 主题颜色 @mixin button-type*/
  @mixin button-type($color) {
    color: var(--text-white);
    background-color: $color;
    border: 1px solid $color;
    filter: opacity(0.8) contrast(0.9);
    transition: filter 0.3s ease;
    &:hover {
      filter: opacity(1) contrast(1);
    }
  }
  /** 朴素按钮类型（透明背景，hover 填充） @param {Color} $color - 边框与字体颜色 @mixin plain-button-type*/
  @mixin plain-button-type($color) {
    color: $color;
    border-color: $color;
    background-color: transparent;
    transition: all 0.3s ease;
    &:hover {
      color: var(--text-white);
      background-color: $color;
    }
  }
  /** 按钮图标尺寸 @param {Size} $size - 图标尺寸 @mixin icon-size*/
  @mixin icon-size($size) {
    width: $size;
    height: $size;
  }
  /** 按钮主样式 @block .Button */
  .Button {
    width: 100%;
    height: 100%;
    cursor: pointer;
    font-size: 14px;
    padding: 0.3em 0.6em;
    @include content-center;
    transition: all 0.3s ease;
    color: var(--text-primary);
    border: 1px solid var(--text-white);
    border-radius: var(--btn-border-radius);
    &:active {
      transform: scale(0.96);
    }
    $mobile: 480px;
    $tablet: 768px;
    $desktop: 1024px;
    @mixin responsive-styles {
      @media screen and (max-width: $mobile) {
        font-size: 12px;
        padding: 0.4em 0.8em;
      }
      @media screen and (min-width: ($mobile + 1)) and (max-width: $tablet) {
        font-size: 13px;
        padding: 0.5em 1em;
      }
      @media screen and (min-width: ($tablet + 1)) {
        font-size: 14px;
        padding: 0.6em 1.2em;
      }
    }
    @include responsive-styles;
    /** 图标区域 @element .icon*/
    .icon {
      margin-right: 0.5em;
      object-fit: cover;
      display: inline-block;
      vertical-align: middle;
      transition: all 0.3s ease;
      @mixin icon-responsive {
        @media screen and (max-width: $mobile) {
          @include icon-size(1em);
        }
        @media screen and (min-width: ($mobile + 1)) and (max-width: $tablet) {
          @include icon-size(1.1em);
        }
        @media screen and (min-width: ($tablet + 1)) {
          @include icon-size(1.2em);
        }
      }
      @include icon-responsive;
    }
    /** 文本区域 @element .text*/
    .text {
      display: inline-block;
      vertical-align: middle;
      max-width: 100%;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
    /** 禁用状态 @modifier .disabled */
    &.disabled {
      opacity: 0.6;
      cursor: not-allowed;
      position: relative;
      &:active {
        transform: scale(1);
      }
    }
    /** 圆角样式 @modifier .round */
    &.round {
      border-radius: 8px;
    }
    // === (type) 按钮类型 ===
    &.primary {
      @include button-type(var(--blue));
    }
    &.success {
      @include button-type(var(--green));
    }
    &.danger {
      @include button-type(var(--red));
    }
    &.warning {
      @include button-type(var(--orange));
    }
    &.info {
      @include button-type(var(--gray));
    }
    // === (size) 按钮尺寸 ===
    &.small {
      font-size: 12px;
      padding: 0.4em 1em;
      min-width: none;
      .icon {
        @include icon-size(1em);
      }
    }
    &.medium {
      font-size: 14px;
      padding: 0.5em 1.1em;
      .icon {
        @include icon-size(1.2em);
      }
    }
    &.large {
      font-size: 16px;
      padding: 0.6em 1.2em;
      .icon {
        @include icon-size(1.4em);
      }
    }
    // === 按钮（plain）样式组合 ===
    &.plain {
      &.primary {
        @include plain-button-type(var(--blue));
      }
      &.success {
        @include plain-button-type(var(--green));
      }
      &.danger {
        @include plain-button-type(var(--red));
      }
      &.warning {
        @include plain-button-type(var(--orange));
      }
      &.info {
        @include plain-button-type(var(--gray));
      }
    }
  }
</style>
