<!--
 * @Author: Zpekii 3156752796@qq.com
 * @Date: 2025-04-07 15:25:05
 * @LastEditors: 段春茂 2162105974@qq.com
 * @LastEditTime: 2025-08-17 2:28:07
 * @FilePath: src\lib\components\Tag\EditableTag.svelte
 * @Description: 可编辑tag
 * @Copyright (c) 2025 by Zpekii, All Rights Reserved. 
-->
<script>
  import { validateAndAssign } from '$lib/utils/validate';

  /** 颜色列表 @tye {string[]} */
  const COLOR_LIST = [
    // 浅蓝色系列
    '#40d5ff', // 浅蓝色
    '#59dcff', // 稍亮的浅蓝色
    '#33c1e8', // 稍深的浅蓝色
    '#6adbff', // 更浅的蓝色
    '#26caef', // 青蓝色
    '#4dd6eb', // 浅青色
    '#6dcaf2', // 天蓝色
    '#52c2ff', // 亮蓝色
    '#7fd3f3', // 淡蓝色
    '#47d0db', // 绿松石色
    '#5bc8f2', // 粉蓝色
    '#40c4e0', // 中等浅蓝色
    '#72deff', // 亮天蓝色
    '#4fd4d9', // 浅绿蓝色
    '#83def5', // 非常浅的天蓝色

    // 浅橙色系列
    '#ffa040', // 浅橙色
    '#ffb359', // 杏橙色
    '#ffc26d', // 淡杏色
    '#ffcf85', // 米黄橙色

    // 浅粉色系列
    '#ff9eac', // 浅粉红
    '#ffb3c0', // 淡粉色
    '#ffc6d1', // 少女粉
    '#ffd9e0', // 浅蜜桃色

    // 浅紫色系列
    '#d5a6ff', // 浅紫色
    '#e0bfff', // 淡薰衣草色
    '#eed2ff', // 浅丁香色
    '#f2dcff', // 极淡紫色

    // 浅黄绿色系列
    '#c6ff8c', // 浅黄绿
    '#d9ff99', // 淡黄绿
    '#e0ffb3', // 浅草绿色
    '#e6ffcc', // 浅黄绿色
  ];

  /**
   * @type {{
   *      content: string;                    // tag内容
   *      handle_funcs?: {
   *          delete?: function;                          // 删除tag的处理函数
   *          input_blur?: (content: string) => void ;    // 输入框失去焦点的处理函数
   *          input_focus?: function;                     // 输入框获得焦点的处理函数
   *          input_change?: (content: string) => void;   // 输入框内容改变的处理函数, 输入时调用
   *          onchange?: (old_content: string, new_content: string) => void;       // 输入框内容改变的处理函数, 失去焦点时或按下回车时调用
   *      };                                  // 处理函数
   *      colors?: string[];                  // 颜色列表
   *      constraints?: {
   *          min_length?: number;    // 最小长度, 默认0
   *          max_length?: number;    // 最大长度, 默认30
   *          pattern?: string;       // 正则表达式, 默认不限制
   *      };                                  // 约束
   * }}
   */
  let { content = $bindable(''), handle_funcs, colors = COLOR_LIST, constraints } = $props();

  /**
   * 校验参数是否合法,以及做一些默认处理
   */
  const propsRules = {
    colors: { type: ['array'], default: COLOR_LIST },
    content: { type: ['string'], default: '' },
  };
  const propMap = {
    colors: { get: () => colors, set: (v) => (colors = v) },
    content: { get: () => content, set: (v) => (content = v) },
  };
  Object.keys(propMap).forEach((k) => {
    validateAndAssign('Tag', propMap[k].get, propMap[k].set, propsRules[k], k);
  });

  /** 是否显示清除按钮 @type {boolean} */
  let show_clear_btn = $state(false);
  /** @type {string} 原始内容 */
  let old_content = $state(content);
</script>

<div class="tag">
  <div class="tag__color" style="background-color: {COLOR_LIST[content.charAt(0).charCodeAt(0) % colors.length]}"></div>
  <div
    class="tag__content"
    role="textbox"
    tabindex="0"
    onfocus={() => {}}
    onmouseover={() => {
      show_clear_btn = true;
    }}
    onmouseleave={() => {
      show_clear_btn = false;
    }}
  >
    <input
      class="tag__input"
      bind:value={content}
      placeholder="+标签"
      title={content}
      onfocus={() => {
        handle_funcs?.input_focus?.();
      }}
      onblur={() => {
        handle_funcs?.input_blur?.(content);
      }}
      onchange={() => {
        handle_funcs?.onchange?.(old_content, content);
      }}
      oninput={() => {
        handle_funcs?.input_change?.(content);
      }}
      minlength={constraints?.min_length ?? 0}
      maxlength={constraints?.max_length ?? 30}
      pattern={constraints?.pattern ?? ''}
    />
    {#if show_clear_btn}
      <button
        class="tag__clear-btn"
        onmousedown={(e) => {
          e.preventDefault();
        }}
        onclick={() => {
          handle_funcs?.delete?.();
        }}
      >
        <span>⨉</span>
      </button>
    {/if}
  </div>
</div>

<style lang="scss" scoped>
  .tag {
    display: flex;
    flex-direction: row;
    justify-content: center;
    align-items: center;
    width: max-content;
    max-width: 150px;
    height: 15px;

    &__color {
      display: flex;
      justify-content: center;
      align-items: center;
      width: 12px;
      height: 12px;
      border-radius: 1px;
      background-color: #40d5ff;
      margin: 2px;
    }

    &__content {
      position: relative;
      display: flex;
      width: max-content;
      height: max-content;
      justify-content: center;
      align-items: center;

      .tag__input {
        display: block;
        justify-content: center;
        align-items: center;
        background-color: #f0f0f000;
        color: #999999;
        font-size: 12px;
        font-weight: 500;
        width: 50px;
        max-width: 96px;
        height: 100%;
        border: none;
        text-overflow: ellipsis;
        &:focus {
          color: #333333;
          outline: none;
          border-bottom: 1px solid #7792ff;
        }

        &:hover {
          border-bottom: 1px solid #7792ff;
        }
      }

      .tag__clear-btn {
        position: absolute;
        right: 2%;
        border: none;
        background-color: transparent;
        color: #3f3f3f;
        font-size: 12px;
        font-weight: 650;
        width: 20px;
        height: 20px;
        cursor: pointer;

        &:hover {
          color: #0336ff;
        }
      }
    }
  }
</style>
