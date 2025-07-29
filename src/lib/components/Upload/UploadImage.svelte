
<!--
  /**
   * 上传图片组件
   * 
   * 作者：段春茂
   * 邮箱：2162105974@qq.com
   *
   * 参数配置：
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
   *
   * 事件：
   * @event onfile - 文件上传成功后触发，携带上传的 File 
   * 
   * 使用示例：
   * <UploadImage
   *   label="上传头像"
   *   required
   *   show_label
   *   show_message
   *   previewUrl="/static/avatar.jpg"
   *   onfile={(file) => console.log(file)}
   * />
   *
   * 注意事项：
   * - 支持图片格式：由 accept 控制（如 image/* 或 .png,.jpg）
   * - 会限制文件大小，默认不能超过 10MB
   * - 提交时函数返回上传的 File 
   */
-->
<script>
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

<div class="UploadImage-box">
  {#if show_label && label}
    <div class="label-text">
      {#if required}<span class="required">*</span>{/if}
      <label class="label" for="upload-image">{label}</label>
    </div>
  {/if}
  <div
    class="UploadImage-button"
    style:background-image={previewUrl ? `url(${previewUrl})` : 'none'}
    style:background-size="cover"
    style:background-position="center"
  >
    <input type="file" {accept} onchange={handleChange} {disabled} />
    {#if !previewUrl}
      <div class="plus">+</div>
      {#if mode == 'upload'}
        <div class="text">Upload</div>
      {/if}
      {#if mode == 'preview'}
        <div class="text">暂无图片</div>
      {/if}
    {/if}
  </div>
  {#if show_message}
    <div class="UploadImage-message">{message}</div>
  {/if}
</div>

<style lang="scss" scoped>
  .UploadImage-box {
    display: flex;
    align-items: center;
    gap: 16px;
  }
  .label-text {
    display: flex;
  }
  .required {
    color: red;
  }
  .label {
    font-size: 13px;
    margin-right: 0.5rem;
  }
  .UploadImage-button {
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
  }
  .UploadImage-button input {
    position: absolute;
    width: 100%;
    height: 100%;
    opacity: 0;
    top: 0;
    left: 0;
    cursor: pointer;
  }
  .UploadImage-button .plus {
    font-size: 24px;
    margin-bottom: 4px;
  }
  .UploadImage-button .text {
    font-size: 14px;
  }
  .UploadImage-message {
    font-size: 13px;
    color: #888;
  }
</style>
