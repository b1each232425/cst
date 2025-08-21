<!--
 * @Author: 段春茂 2162105974@qq.com
 * @Date: 2025-07-28 18:20:00
 * @LastEditors: 段春茂 2162105974@qq.com
 * @LastEditTime: 2025-08-19 22:00:00
 * @FilePath: src\lib\components\Upload\Upload.svelte
 * @Description: Upload-组件
 * @Copyright (c) 2025 by 广州近邻信息有限公司, All Rights Reserved. 
-->
<script>
  /**
   * @prop {boolean} multiple - 是否允许多文件上传，默认 false
   * @prop {number} limit - 最大文件上传数量（仅在 multiple 为 true 时有效）
   * @prop {boolean} disabled - 是否禁用组件，默认 false
   * @prop {string} accept - 接受的文件类型，例如 'image/*'，默认 ''
   * @prop {function} onChange - 文件选择时触发的回调函数，参数为文件列表
   */
  import { toast } from '$lib/components/Toast/Toast.js';
  import { validateAndAssign } from '$lib/utils/validate';

  let { multiple = true, limit = 20, disabled = false, accept = '', tip = '', onChange = () => {}, children } = $props();

  /**
   * 属性校验规则
   */
  const propRules = {
    multiple: { type: ['boolean'], default: true },
    limit: { type: ['number'], default: 20, check: (v) => v > 0, message: '最大上传数量必须大于 0' },
    disabled: { type: ['boolean'], default: false },
    accept: { type: ['string'], default: '' },
    onChange: { type: ['function'], default: () => {} },
  };
  const propMap = {
    multiple: { get: () => multiple, set: (v) => (multiple = v) },
    limit: { get: () => limit, set: (v) => (limit = v) },
    disabled: { get: () => disabled, set: (v) => (disabled = v) },
    accept: { get: () => accept, set: (v) => (accept = v) },
    onChange: { get: () => onChange, set: (v) => (onChange = v) },
  };
  Object.keys(propMap).forEach((k) => {
    validateAndAssign('Upload', propMap[k].get, propMap[k].set, propRules[k], k);
  });

  // 文件列表
  let files = $state([]);

  /**
   * 选择文件功能
   * @type {Function}
   */
  function openFileDialog() {
    if (disabled) return;

    const file = document.createElement('input');
    file.type = 'file';
    file.multiple = multiple;
    file.accept = accept;

    file.onchange = (e) => {
      const selected = Array.from(e.target.files);
      // 逐个判断是否重复，并过滤
      const newFiles = selected.filter((file) => !files.some((f) => f.name === file.name && f.size === file.size));
      if (newFiles.length === 0) {
        toast.warning('已选择的文件中没有新文件');
        return;
      }
      // 限制文件数量
      if (multiple && files.length + newFiles.length > limit) {
        toast.warning(`最多只能上传 ${limit} 个文件`);
        return;
      }
      files = multiple ? [...files, ...newFiles] : newFiles;
      onChange(files);
    };
    file.click();
  }

  /**
   * 预览文件功能
   * @param {File} file - 文件对象
   * @type {Function}
   */
  function previewFile(file) {
    const url = URL.createObjectURL(file);
    // 被预览的文件类型
    const previewableTypes = ['image/', 'text/', 'application/pdf', 'video/', 'audio/'];
    // 检查文件类型是否可预览（是否包含上面的文件类型）
    if (previewableTypes.some((type) => file.type.startsWith(type))) {
      window.open(url, '_blank');
    } else {
      const a = document.createElement('a');
      a.href = url;
      a.download = file.name;
      a.click();
    }

    setTimeout(() => URL.revokeObjectURL(url), 2000);
  }

  /**
   * 删除已经选择的文件
   * @param index
   */
  function removeFile(index) {
    files.splice(index, 1);
    files = [...files];
    onChange(files);
  }
</script>

<div class="upload">
  <!-- 触发区域 -->
  <button class="upload__trigger" onclick={openFileDialog} {disabled}>
    {@render children()}
  </button>

  <!-- 提示 -->
  {#if tip}
    <span class="upload__tip">
      {tip}
    </span>
  {/if}

  <!-- 文件列表 -->
  <div class="upload__list">
    {#each files as file, index (index)}
      <div class="list__item">
        <button class="list__item-name" onclick={() => previewFile(file)}>{file.name}</button>
        {#if !disabled}
          <button class="list__item-remove" onclick={() => removeFile(index)}>x</button>
        {/if}
      </div>
    {/each}
  </div>
</div>

<style lang="scss" scoped>
  .upload {
    display: flex;
    flex-wrap: wrap;
    gap: 10px;

    &__trigger {
      all: unset;

      &:disabled {
        cursor: not-allowed;
        opacity: 0.5;
      }
    }

    &__tip {
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 12px;
      color: #757575;
    }

    &__list {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;

      .list__item {
        display: flex;
        align-items: center;
        border-radius: 999px;
        padding: 2px 3px;
        background-color: #eff0f4;

        &-name {
          white-space: nowrap;
          border: none;
          border-radius: 999px;
          color: #757575;
          cursor: pointer;

          &:hover {
            text-decoration: underline;
            color: black;
          }
        }

        &-remove {
          border: none;
          color: black;
          padding: 2px 4px 2px 2px;
          border-radius: 999px;
          cursor: pointer;
        }
      }
    }
  }
</style>
