<!--
 * @Author: 段春茂 2162105974@qq.com
 * @Date: 2025-07-28 18:20:00
 * @LastEditors: 段春茂 2162105974@qq.com
 * @LastEditTime: 2025-08-19 18:00:00
 * @FilePath: src\lib\components\Upload\UploadImage.svelte
 * @Description: UploadImage-组件
 * @Copyright (c) 2025 by 广州近邻信息有限公司, All Rights Reserved. 
-->
<script>
  /**
   * @param {Boolean} required       是否为必填项，显示红色 * 标记
   * @param {Boolean} show_label     是否显示标签文字
   * @param {Boolean} show_message   是否显示提示说明信息
   * @param {String}  label          标签文字
   * @param {String}  mode           模式，可选值：upload | preview（默认：upload）
   * @param {Boolean} disabled       是否禁用文件上传
   * @param {String}  accept         接受的文件类型（默认：image/*）
   * @param {String}  message        上传提示信息
   * @param {String}  previewUrl     图片预览地址（后端返回 URL）
   * @param {Number}  limit_size     上传文件大小限制（单位：MB，默认 10MB）
   * @param {Function} onfile        文件上传成功后触发的回调函数，返回上传的 File
   */
  import { toast } from '$lib/components/Toast/Toast.js';

  let {
    required = false,
    show_label = false,
    show_message = false,
    mode = 'upload',
    disabled = false,
    label = '',
    accept = 'image/*',
    message = '仅支持 PDF、JPG 和 PNG 格式。最大文件尺寸 10 MB。',
    previewUrl = '',
    limit_size = 10, // 1MB
    onfile = () => {},
  } = $props();

  /**
   * 文件上传成功后触发的回调函数
   * @param event
   */
  function handleChange(event) {
    const file = event.target.files[0];
    if (!file) return;
    if (file.size > limit_size * 1024 * 1024) {
      toast.error(`文件大小不能超过 ${limit_size} MB`);
      return;
    }
    previewUrl = URL.createObjectURL(file);
    onfile(file);
  }
</script>

<div class="upload">
  {#if show_label && label}
    <div class="upload__label">
      {#if required}<span class="upload__label--request">*</span>{/if}
      <label class="label" for="upload-image">{label}</label>
    </div>
  {/if}
  <div class="upload__inner" style:background-image={previewUrl ? `url(${previewUrl})` : 'none'} style:background-size="cover" style:background-position="center">
    <input type="file" {accept} onchange={handleChange} {disabled} />
    {#if !previewUrl}
      <div class="upload__inner-plus">+</div>
      {#if mode == 'upload'}
        <div class="upload__inner-text">Upload</div>
      {/if}
      {#if mode == 'preview'}
        <div class="upload__inner-text">暂无图片</div>
      {/if}
    {/if}
  </div>
  {#if show_message}
    <div class="upload__tip">{message}</div>
  {/if}
</div>

<style lang="scss" scoped>
  .upload {
    display: flex;
    align-items: center;
    gap: 16px;

    &__label {
      display: flex;

      &--request {
        color: red;
      }

      label {
        font-size: 13px;
        margin-right: 0.5rem;
      }
    }

    &__inner {
      width: 150px;
      height: 100px;
      border: 1px dashed #ccc;
      border-radius: 6px;
      background-color: #f9f9f9;
      cursor: pointer;
      text-align: center;
      padding: 10px;
      display: flex;
      flex-direction: column;
      justify-content: center;
      align-items: center;
      color: #666;
      position: relative;
      background-repeat: no-repeat;
      &:hover {
        border: 1px dashed #0052d9;
        background-color: #ecf0f7;
      }

      input {
        position: absolute;
        width: 100%;
        height: 100%;
        opacity: 0;
        top: 0;
        left: 0;
        cursor: pointer;
      }

      &-plus {
        font-size: 24px;
        margin-bottom: 4px;
      }

      &-text {
        font-size: 14px;
      }
    }

    &__tip {
      font-size: 13px;
      color: #888;
    }
  }
</style>
