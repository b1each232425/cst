<!--
   Switch 组件使用说明

   作者：熊炜
   邮箱：1062051028@qq.com

   参数配置：
   @param {Boolean} isChecked                  开关是否开启，true 表示开启，false 表示关闭  boolean
   @param {String} ballColor                   小球的颜色，支持任何合法的 CSS 颜色值            string
   @param {String} checkedBackgroundColor      开启状态下的背景色，支持任何合法的 CSS 颜色值   string
   @param {String} uncheckedBackgroundColor    关闭状态下的背景色，支持任何合法的 CSS 颜色值   string
   @param {String} leftText                    左侧文本，显示在开关左侧的标签文本              string
   @param {String} rightText                   右侧文本，显示在开关右侧的标签文本             string
   @param {String} width                       控制开关的宽度，单位为 px，默认单位为 "px"     string

   函数说明：
   @event clickSwitchButton                    点击开关时触发的事件，用于更新开关状态         { isChecked: boolean }

   使用示例：
   <Switch
     isChecked={isChecked}                     // 控制开关状态的变量，传入自定义 bool 值
     ballColor="white"                         // 小球的颜色，设置为白色
     checkedBackgroundColor="#4a90e2"          // 开启状态的背景色，设置为蓝色
     uncheckedBackgroundColor="#ccc"           // 关闭状态的背景色，设置为灰色
     leftText="Off"                            // 左侧文本，显示为 "Off"
     rightText="On"                            // 右侧文本，显示为 "On"
     width="80px"                              // 控制开关的宽度，设置为 80px
     clickSwitchButton={handleClickSwitchButton} // 点击开关按钮时触发的事件
   />

   let isChecked = $state(false);
   // 父组件更新开关状态（用户点击 switch 按钮之后的逻辑）
   function handleClickSwitchButton() {
     isChecked = !isChecked;   // 切换开关状态
   }
-->

<script>
  let {
    isChecked = false,
    ballColor = 'white',
    checkedBackgroundColor = '#4a90e2', // 开启状态背景色
    uncheckedBackgroundColor = '#ccc', // 关闭状态背景色
    leftText = 'Off',
    rightText = 'On',
    width = '80px', // 可自定义宽度
    clickSwitchButton, // 点击事件
  } = $props();

  // 计算高度，保持 8:3 的比例
  let height = (parseInt(width) * 3) / 8 + 'px';

  // 计算白球的大小，取高度的 0.66 作为球的直径，保持比例
  let ballSize = parseInt(height) * 0.66 + 'px';

  // 计算文本的字体大小，按宽度的比例来设置
  let textSize = parseInt(width) / 5 + 'px';
</script>

<div class="switch-wrapper">
  <span class="left-text" style="font-size: {textSize};">{leftText}</span>
  <!-- svelte-ignore a11y_consider_explicit_label -->
  <button
    class="switch"
    aria-pressed={isChecked ? 'true' : 'false'}
    onclick={clickSwitchButton}
    style="--background-color: {isChecked
      ? checkedBackgroundColor
      : uncheckedBackgroundColor}; width: {width}; height: {height}; --ball-size: {ballSize}; "
  >
    <span class={isChecked ? 'checked' : 'unchecked'} style="background-color:{ballColor}"></span>
  </button>
  <span class="right-text" style="font-size: {textSize};">{rightText}</span>
</div>

<style>
  .switch-wrapper {
    display: flex;
    align-items: center;
    justify-content: center;
    width: fit-content;

    .switch {
      display: flex;
      align-items: center;
      justify-content: center;
      background-color: var(--background-color, #ccc);
      border-radius: 50px;
      cursor: pointer;
      border: none;
      position: relative;
      padding: 0;
      transition: background-color 0.3s ease;

      /* 计算白球大小 */
      .checked,
      .unchecked {
        position: absolute;
        top: 50%;
        transform: translateY(-50%); /* 使白球在垂直方向上居中 */
        width: var(--ball-size);
        height: var(--ball-size);
        border-radius: 50%;
        transition: left 0.3s ease;
      }

      /* 白球在开启状态下的样式 */
      .checked {
        left: calc(100% - var(--ball-size) - 5px);
      }

      /* 白球在关闭状态下的样式 */
      .unchecked {
        left: 5px;
      }
    }

    .left-text,
    .right-text {
      font-weight: bold;
      color: #000;
      margin: 0 15px;
    }
  }
</style>
