<!-- /**
  * 按钮组件使用说明
  *
  * 作者：段春茂
  * 邮箱：2162105974@qq.com
  *
  * 参数配置：
  * @param {Boolean} plain        是否为朴素按钮，样式为边框加文字，hover 时填充背景
  * @param {String} size          按钮尺寸，可选值："small" | "medium" | "large"，默认 "medium"
  * @param {String} type          按钮类型，可选值："primary" | "success" | "danger" | "warning" | "info"，默认 "primary"
  * @param {Boolean} disabled     是否禁用按钮，禁用后无法点击
  * @param {Boolean} round        是否为圆角按钮，开启后圆角更大
  * @param {String} icon          按钮左侧图标地址，支持本地或远程图片
  * @param {Function} onclick     点击事件处理函数，可传入自定义逻辑
  *
  * 插槽：
  * 默认插槽：用于定义按钮文本内容，可嵌入 HTML 或组件
  *
  * 使用示例：
  * <Button
  *   type="success"
  *   size="large"
  *   plain={true}                  // 或者 plain(表示true)
  *   round={true}
  *   icon="/icons/plus.svg"
  *   disabled={false}
  *   onclick={handleClick}
  * >
  *   添加数据
  * </Button>
  *
  * // 父组件中定义点击处理
  * function handleClick() {
  *   console.log('按钮被点击');
  * }
  */ -->
<script>
  let {
    plain = false,
    size = 'medium',
    type = 'primary',
    disabled = false,
    round = false,
    icon = '',
    onclick = null,
    children,
  } = $props();
  let classes = $state(
    [
      'Button',
      `Button-${size}`,
      `Button-${type}`,
      plain && 'Button-plain',
      disabled && 'Button-disabled',
      round && 'Button-round',
    ]
      .filter(Boolean)
      .join(' '),
  );
</script>

<button class={classes} {disabled} {onclick}>
  {#if icon}
    <img class="Button-icon" src={icon} alt="图标" />
  {/if}
  <span class="Button-text">{@render children()} </span>
</button>

<style lang="scss" scoped>
  :root {
    // 基础颜色
    --primary: var(--blue);
    --success: var(--green);
    --danger: var(--red);
    --warning: var(--orange);
    --info: var(--gray);
    // hover颜色(plain)
    --primary-hover-plain: var(--blue);
    --success-hover-plain: var(--green);
    --danger-hover-plain: var(--red);
    --warning-hover-plain: var(--orange);
    --info-hover-plain: var(--gray);
    // hover颜色(非plain)
    --primary-hover: #4280d6ff;
    --success-hover: #4fd872ff;
    --danger-hover: #ff4d4d;
    --warning-hover: #f7be58;
    --info-hover: #bfbfbf;
  }
  .Button {
    all: unset;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    padding: 0.5em 1em;
    font-size: 14px;
    border-radius: var(--btn-border-radius);
    transition: all 0.2s ease;
    color: #333;
    cursor: pointer;
    border: 1px solid #ffffff;
  }
  .Button-text {
    display: inline-block;
    white-space: nowrap;
    vertical-align: middle;
  }

  .Button-small {
    font-size: 12px;
    padding: 0.4em 1em;
  }
  .Button-medium {
    font-size: 14px;
    padding: 0.5em 1.1em;
  }
  .Button-large {
    font-size: 16px;
    padding: 0.6em 1.2em;
  }
  .Button-primary {
    background-color: var(--primary);
    color: white;
    &:hover {
      background-color: var(--primary-hover);
    }
  }
  .Button-success {
    background-color: var(--success);
    color: white;
    &:hover {
      background-color: var(--success-hover);
    }
  }
  .Button-danger {
    background-color: var(--danger);
    color: white;
    &:hover {
      background-color: var(--danger-hover);
    }
  }
  .Button-warning {
    background-color: var(--warning);
    color: black;
    &:hover {
      background-color: var(--warning-hover);
    }
  }
  .Button-info {
    background-color: var(--info);
    color: black;
    &:hover {
      background-color: var(--info-hover);
    }
  }
  .Button-plain.Button-primary {
    background-color: transparent;
    border: 1px solid var(--primary);
    color: var(--primary);
    &:hover {
      background-color: var(--primary-hover-plain);
      color: white;
    }
  }
  .Button-plain.Button-success {
    background-color: transparent;
    border: 1px solid var(--success);
    color: var(--success);
    &:hover {
      background-color: var(--success-hover-plain);
      color: white;
    }
  }
  .Button-plain.Button-danger {
    background-color: transparent;
    border: 1px solid var(--danger);
    color: var(--danger);
    &:hover {
      background-color: var(--danger-hover-plain);
      color: white;
    }
  }
  .Button-plain.Button-warning {
    background-color: transparent;
    border: 1px solid var(--warning);
    color: var(--warning);
    &:hover {
      background-color: var(--warning-hover-plain);
      color: black;
    }
  }
  .Button-plain.Button-info {
    background-color: transparent;
    border: 1px solid var(--info);
    color: var(--info);
    &:hover {
      background-color: var(--info-hover-plain);
      color: white;
    }
  }
  .Button-small .Button-icon {
    width: 1em;
    height: 1em;
    margin-right: 0.5em;
    display: inline-block;
    vertical-align: middle;
    object-fit: contain;
  }
  .Button-middle .Button-icon {
    width: 1.2em;
    height: 1.2em;
    margin-right: 0.5em;
    display: inline-block;
    vertical-align: middle;
    object-fit: contain;
  }
  .Button-large .Button-icon {
    width: 1.4em;
    height: 1.4em;
    margin-right: 0.5em;
    display: inline-block;
    vertical-align: middle;
    object-fit: cover;
  }
  .Button.Button-disabled {
    opacity: 0.5;
    pointer-events: none;
    cursor: not-allowed;
  }
  .Button-round {
    border-radius: 8px;
  }
</style>
