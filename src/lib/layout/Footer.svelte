<!--
 * @Author: Zpekii 3156752796@qq.com
 * @Date: 2025-04-06 00:31:15
 * @LastEditors: Zpekii 3156752796@qq.com
 * @LastEditTime: 2025-04-07 15:26:40
 * @FilePath: \exam-fe\src\lib\layout\Footer.svelte
 * @Description: 底部栏组件, 显示版权信息以及域名信息
 * @Copyright (c) 2025 by Zpekii, All Rights Reserved. 
-->
<script>

    /**
     * @type {{
     *   content: string; // 版权信息内容
     * }}
     */
    let { content } = $props();

</script>

<footer>
    <p class="copyright">{content}</p>
</footer>

<style lang="scss" scoped>
footer {
    position: relative;
    left: 0;
    width: 100%;
    height: 52px;
    padding: 2px 2px 2px 2px;
    margin: 0;
    color: #333333;
    border: 1px solid #f7f8fd;
    background-color: #f5f5f5;
    box-sizing: border-box;
    display: flex;
    align-items: center;
    justify-content: center;
}

.copyright {
    width: fit-content;
    height: 48%;
    background-color: rgba(255, 255, 255, 0);
    box-sizing: border-box;
    font-family: 'Arial', sans-serif;
    color: #333333;
    text-align: center;
    margin: 0;
}
</style>