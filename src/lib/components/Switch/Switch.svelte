<!--
   Switch 组件使用说明

   作者：熊炜
   邮箱：1062051028@qq.com

   参数配置：
   @param {Boolean} is_checked                  开关是否开启，true 表示开启，false 表示关闭  boolean
   @param {String} ball_color                   小球的颜色，支持任何合法的 CSS 颜色值            string
   @param {String} checked_background_color      开启状态下的背景色，支持任何合法的 CSS 颜色值   string
   @param {String} unchecked_background_color    关闭状态下的背景色，支持任何合法的 CSS 颜色值   string
   @param {String} left_text                    左侧文本，显示在开关左侧的标签文本              string
   @param {String} right_text                   右侧文本，显示在开关右侧的标签文本             string
   @param {String} width                       控制开关的宽度，单位为 px，默认单位为 "px"     string

   函数说明：
   @event clickSwitchButton                    点击开关时触发的事件，用于更新开关状态         { is_checked: boolean }

   使用示例：
   <Switch
     is_checked={is_checked}                     // 控制开关状态的变量，传入自定义 bool 值
     ball_color="white"                         // 小球的颜色，设置为白色
     checked_background_color="#4a90e2"          // 开启状态的背景色，设置为蓝色
     unchecked_background_color="#ccc"           // 关闭状态的背景色，设置为灰色
     left_text="Off"                            // 左侧文本，显示为 "Off"
     right_text="On"                            // 右侧文本，显示为 "On"
     width={"80px"}                             // 控制开关的宽度，设置为 80px
     clickSwitchButton={handleClickSwitchButton} // 点击开关按钮时触发的事件
   />

   let is_checked = $state(false);
   // 父组件更新开关状态（用户点击 switch 按钮之后的逻辑）
   function handleClickSwitchButton() {
     is_checked = !is_checked;   // 切换开关状态
   }
-->

<script>
  import { onMount } from 'svelte';

  let {
    is_checked = false,
    ball_color = 'white',
    checked_background_color = '#4a90e2', // 开启状态背景色
    unchecked_background_color = '#ccc', // 关闭状态背景色
    left_text = 'Off',
    right_text = 'On',
    width = '80px', // 可自定义宽度
    clickSwitchButton, // 点击事件
  } = $props();

  let l_text_element; // 绑定左文本span
  let switch_button_element; // 绑定switch按钮
  let ball_element; // 绑定小球span
  let r_text_element; // 绑定右文本span

  onMount(() => {
    // 计算高度，保持 8:3 的比例
    let height = (parseInt(width) * 3) / 8 + 'px';

    // 计算白球的大小，取高度的 0.66 作为球的直径，保持比例
    let ball_size = parseInt(height) * 0.66 + 'px';

    // 计算文本的字体大小，按宽度的比例来设置
    let text_size = parseInt(width) / 5 + 'px';

    // 初始化文本大小
    l_text_element.style.setProperty('--left-size', text_size);
    r_text_element.style.setProperty('--right-size', text_size);

    // 初始化按钮样式
    switch_button_element.style.setProperty(
      '--background-color',
      is_checked ? checked_background_color : unchecked_background_color,
    );
    switch_button_element.style.setProperty('--button-width', width);
    switch_button_element.style.setProperty('--button-height', height);
    switch_button_element.style.setProperty('--ball-size', ball_size);

    //初始化小球大小
    ball_element.style.setProperty('--ball-color', ball_color);
  });

  $effect(() => {
    switch_button_element.style.setProperty(
      '--background-color',
      is_checked ? checked_background_color : unchecked_background_color,
    );
  });
</script>

<div class="switch-wrapper">
  <span bind:this={l_text_element} class="left-text">{left_text}</span>
  <!-- svelte-ignore a11y_consider_explicit_label -->
  <button
    bind:this={switch_button_element}
    class="switch"
    aria-pressed={is_checked ? 'true' : 'false'}
    onclick={clickSwitchButton}
  >
    <span bind:this={ball_element} class={is_checked ? 'checked' : 'unchecked'} data-testid="switch-ball"></span>
  </button>
  <span bind:this={r_text_element} class="right-text">{right_text}</span>
</div>

<style>
  .switch-wrapper {
    display: flex;
    align-items: center;
    justify-content: center;
    width: fit-content;

    .switch {
      width: var(--button-width);
      height: var(--button-height);
      display: flex;
      align-items: center;
      justify-content: center;
      background-color: var(--background-color);
      border-radius: 50px;
      cursor: pointer;
      border: none;
      position: relative;
      padding: 0;
      transition: var(--background-color) 0.3s ease;

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
        background-color: var(--ball-color);
      }

      /* 白球在关闭状态下的样式 */
      .unchecked {
        left: 5px;
        background-color: var(--ball-color);
      }
    }

    .left-text {
      font-weight: bold;
      color: #000;
      margin: 0 15px;
      font-size: var(--left-size);
    }
    .right-text {
      font-weight: bold;
      color: #000;
      margin: 0 15px;
      font-size: var(--right-size);
    }
  }
</style>
