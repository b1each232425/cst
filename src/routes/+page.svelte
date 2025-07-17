<!--
 * @Author: Zpekii 3156752796@qq.com
 * @Date: 2025-03-31 22:02:53
 * @LastEditors: Zpekii 3156752796@qq.com
 * @LastEditTime: 2025-04-06 14:18:07
 * @FilePath: \exam-fe\src\routes\+page.svelte
 * @Description: 
 * @
 * @Copyright (c) 2025 by Zpekii, All Rights Reserved. 
-->
<script>
    import Login from "$lib/Login.svelte";
    import Footer from "$lib/layout/Footer.svelte";
    import { onMount } from "svelte";

    onMount(() => {
        window.location.href = "/teacher"
    })

</script>

{#snippet logo()}
    <div class="logo" style="
        width: fit-content;
        height: fit-content;
        border-radius: 3px;
        background-color: rgba(255, 255, 255, 0);
        box-sizing: border-box;
        font-family: 'ComicSansMS-Bold', 'Comic Sans MS Bold', 'Comic Sans MS', sans-serif;
        font-weight: 700;
        font-size: 32px;
        color: #0336ff;
        text-align: center;
        line-height: 25px;
        padding: 0;
    ">
        DevMentor
    </div>
{/snippet}

<div class="main-container">

    <div class="main-content">
        <Login {logo} />
    </div>

    <footer>
        <Footer content= {"广州近邻信息有限公司 Copyright © 2024-2034 w2w.me. All Rights Reserved."} />
    </footer>

</div>


<style lang="scss" scoped>
    
.main-container {
    position: fixed;
    display: block;
    left: 0px;
    top: 0px;
    justify-items: center;
    align-items: center;
    width: 100vw;
    height: 100%;
    background-color: #ffffff;
    z-index: 15;
}
 
.main-content {
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    width: 100%;
    height: 100%;
    min-height: max-content;
}

footer {
    display: flex;
    position: absolute;
    justify-content: center;
    align-items: center;
    width: 100%;
    z-index: 20;
    bottom: 0;
}
</style>