<!-- /*
 * @Author: wusaber33
 * @Date: 2025-04-07 20:05:21 
 * @Last Modified by: 段春茂 
 * @Last Modified time: 2025-08-15 20:05:21 
 * @FilePath: src\lib\components\Tag\UneditableHashTags.svelte
 * @Description: 生成标签颜色映射，使用HSL颜色模型
 * @Copyright: Copyright (c) 2025 by wusaber33, All Rights Reserved. 
 -->
<script>
  import { validateAndAssign } from '$lib/utils/validate';

  const DEFAULT_TAGS = ['frontend', 'backend', 'svelte', '前端', 'JavaScript', 'CSS', 'HTML', 'Node.js'];

  let { tags = DEFAULT_TAGS } = $props();

  /**
   * 校验参数是否合法,以及做一些默认处理
   */
  const propsRules = {
    tags: { type: ['array'], default: DEFAULT_TAGS },
  };
  const propMap = {
    tags: { get: () => tags, set: (v) => (tags = v) },
  };
  Object.keys(propMap).forEach((k) => {
    validateAndAssign('UneditableHashTags', propMap[k].get, propMap[k].set, propsRules[k], k);
  });

  /**
   * 字符串哈希函数
   * @param {string} str
   * @returns {number}
   */
  function stringHash(str) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      hash = (hash << 5) - hash + str.charCodeAt(i);
      hash = hash & hash; // 32位整数
    }
    return Math.abs(hash);
  }

  /**
   * 根据标签名称获取颜色,使用HSL颜色模型
   * * @param {string} tagName
   */
  function getTagColor(tagName) {
    const hash = stringHash(tagName);
    const hue = hash % 360; // 色相范围 0-360
    return `hsl(${hue}, 70%, 50%)`;
  }

  // 预先生成颜色映射
  let tagColorMap = new Map();
  tags.forEach((tag) => {
    if (!tagColorMap.has(tag)) {
      tagColorMap.set(tag, getTagColor(tag));
    }
  });
</script>

<div class="tags">
  {#each tags as tag, i (i)}
    <div class="tag">
      <span class="tag-square" style="background-color: {tagColorMap.get(tag)};"></span>
      <span class="tag-text">{tag}</span>
    </div>
  {/each}
</div>

<style lang="scss" scoped>
  $max-container-height: var(--max_container_height, 50px);
  $max-tag-width: var(--max_tag_width, 100px);

  .tags {
    display: flex;
    gap: 10px;
    flex-wrap: wrap;
    justify-content: flex-start;
    align-items: flex-start;
    overflow-y: auto;
    max-height: $max-container-height;

    .tag {
      display: flex;
      align-items: center;
      font-size: 14px;

      &-text {
        padding: 0 0 0 1px;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
        max-width: $max-tag-width;
        color: #797979;
      }

      &-square {
        width: 15px;
        height: 15px;
        border-radius: 3px;
      }
    }
  }
</style>
