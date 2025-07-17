<!--/**
 * @Author: ZouYingXiong && 1584637407@qq.com
 * @Date: 2025-04-23 20:03:03
 * @LastEditors: ZouYingXiong config user.email
 * @LastEditTime: 2025-04-25 09:11:49
 * @FilePath: \tutorial-platform-fe\src\routes\student\+page.svelte
 * @Description: 学生登录页
 * @Copyright (c) 2025 by ZouYingXiong, All Rights Reserved. 
 */ -->
<script>
// @ts-nocheck

    import { page } from "$app/state";
    import Login from "./Login.svelte"
    import Footer from "$lib/layout/Footer.svelte";
    import {onMount} from "svelte";

    onMount(async() => {
        
        let response = await fetch("/api/checkLoginStatus", {
            method: 'GET',
            credentials: 'include',
        });

        if (!response.ok) {
            return;
        }

        let current_path = window.location.pathname;

        if (current_path != page.url.pathname) {
            return
        }

        window.location.href = "/student/exam";

    })
    

</script>

{#snippet logo()}
    <div
        class="logo"
        style="
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
    "
    >
        3min
    </div>
{/snippet}

<div class="main-container">
    <div class="main-content">
        <Login
            {logo}
            handle_funcs={{
                login: () => {
                    window.location.href = "/student/exam";
                },
            }}
        />
    </div>

    <footer>
        <Footer
            content={"广州近邻信息有限公司 Copyright © 2024-2034 w2w.me. All Rights Reserved."}
        />
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
