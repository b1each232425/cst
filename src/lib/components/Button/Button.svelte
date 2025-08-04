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
   * @property {string} [alt=''] - 图标的替代文字
   * @property {string} [width=''] - 按钮宽度
   * @property {string} [height=''] - 按钮高度
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
    type = 'primary',
    disabled = false,
    round = false,
    icon = '',
    size = 'medium',
    alt = '',
    width = '',
    height = '',
    children,
    ...restProps
  } = $props();

  const validTypes = ['primary', 'success', 'danger', 'warning', 'info'];
  const validSizes = ['small', 'medium', 'large'];

  checkProps();

  /**
   * 组合按钮的类名
   *  @type {string}
   * */
  let classes = $state(
    ['Button', `${type}`, plain && 'plain', `${size}`, disabled && 'disabled', round && 'round']
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
</script>

<button class={classes} {disabled} {...restProps} style={`width: ${width}; height: ${height};`}>
  {#if icon}
    <img class="icon" src={icon} alt={alt ? alt : '按钮图标'} />
  {/if}
  <span class="text">{@render children?.()} </span>
</button>

<style lang="scss" scoped>
  $small: 12px;
  $medium: 14px;
  $large: 16px;
  /** 默认按钮类型（填充型按钮）*/
  @mixin button-type($color) {
    color: var(--text-white);
    background-color: $color;
    border: 1px solid $color;
    filter: opacity(0.8) contrast(0.9);
    &:hover {
      filter: opacity(1) contrast(1);
    }
  }
  /** 朴素按钮类型（透明背景，hover 填充） */
  @mixin plain-button-type($color) {
    color: $color;
    border-color: $color;
    background-color: transparent;
    &:hover {
      color: var(--text-white);
      background-color: $color;
    }
  }
  /** size 按钮尺寸 */
  @mixin button-size($size) {
    font-size: $size;
    @if $size == $small {
      padding: 6px 10px;
    } @else if $size == $medium {
      padding: 8px 15px;
    } @else if $size == $large {
      padding: 10px 20px;
    } @else {
      padding: 8px 15px;
    }
    .icon {
      width: 1em;
      height: 1em;
    }
  }
  /** 按钮主样式  */
  .Button {
    cursor: pointer;
    appearance: none;
    display: inline-block;
    box-sizing: border-box;
    transition: all 0.3s ease;
    align-self: center;
    border-radius: var(--btn-border-radius);
    white-space: nowrap;
    &:active {
      transform: scale(0.95);
    }
    /** 图标区域 @element .icon*/
    .icon {
      margin-right: 0.5em;
      object-fit: cover;
      display: inline-block;
      vertical-align: middle;
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
      &:active {
        transform: scale(1);
      }
    }
    /** 圆角按钮 */
    &.round {
      border-radius: 9999px;
    }
    // === (size) 按钮尺寸 ===
    &.small {
      @include button-size($small);
    }
    &.medium {
      @include button-size($medium);
    }
    &.large {
      @include button-size($large);
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
    // === 按钮（plain）样式组合 ===
    &.plain.primary {
      @include plain-button-type(var(--blue));
    }
    &.plain.success {
      @include plain-button-type(var(--green));
    }
    &.plain.danger {
      @include plain-button-type(var(--red));
    }
    &.plain.warning {
      @include plain-button-type(var(--orange));
    }
    &.plain.info {
      @include plain-button-type(var(--gray));
    }
  }
  :global(.Button) + .Button {
    margin-left: 0.5em;
    @media screen and (max-width: 480px) {
      margin-left: 0.3em;
    }
    @media screen and (min-width: 481px) and (max-width: 768px) {
      margin-left: 0.4em;
    }
    @media screen and (min-width: 769px) {
      margin-left: 0.5em;
    }
  }
</style>
