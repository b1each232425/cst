<script>

    import { page } from "$app/state";
    
    import Footer from "$lib/layout/Footer.svelte";

    let { children } = $props();

    function handleClickPracticeTab() {
        window.location.href = '/student/practice';
    }

    function handleClickExamTab() {
        window.location.href = '/student/exam';
    }
    
    async function handleLogOut() {
        let resp = await fetch("/api/logout", {
            method: 'GET',
            credentials: 'include',
        });

        if (resp.ok) {
            window.location.href = "/student/login";
        } else {
            alert("登出失败，请稍后再试！");
        }
    }

</script>

{#snippet logo()}
    <div class="logo" style="
        display: flex;
        width: fit-content;
        height: fit-content;
        border-radius: 3px;
        background-color: rgba(255, 255, 255, 0);
        box-sizing: border-box;
        font-family: 'ComicSansMS-Bold', 'Comic Sans MS Bold', 'Comic Sans MS', sans-serif;
        font-weight: 700;
        font-size: 36px;
        color: #0336ff;
        justify-content: center;
        align-items: center;
        white-space: nowrap;
    ">
        <span>3min</span>
    </div>
{/snippet}

<div class="app">
    
    <main>
        <header>
            <div class="header-container">
                
                <div class="logo">
                    {@render logo()}
                </div>

                <div class="nav-tab-container">
                    
                    <button class="nav-tab practice-tab" class:selected={page.url.pathname === '/student/practice'}
                        onclick={handleClickPracticeTab}
                    >
                        <span>练习</span>
                    </button>

                    <button class="nav-tab exam-tab" class:selected={page.url.pathname === '/student/exam'}
                        onclick={handleClickExamTab}
                    >
                        <span>考试</span>
                    </button>

                </div>

                <div class="user-options">
                    <button class="log-out-btn"
                        onclick={handleLogOut}
                    >
                        退出登录
                    </button>
                </div>
            
            </div>
        </header>

        <div class="content-container">

            {@render children()}

            <footer>
                <Footer content= {"广州近邻信息有限公司 Copyright © 2024-2034 w2w.me. All Rights Reserved."} />
            </footer>
        </div>
        
    </main>
    
</div>

<style lang="scss" scoped>
.app {
    display: flex;
    position: fixed;
    top:0;
    left: 0;
    width: 100%;
    height: 100vh;
}

main {
    display: block;
    flex-direction: column;
    width: 100%;
    height: 100%;
}

header {
    display: flex;
    position: relative;
    top: 0;
    left: 0;
    width: 100%;
    height: max-content;
    justify-content: center;
    align-items: center;
    padding-left: 15px;
    padding-right: 15px;
    box-sizing: border-box;
    z-index: 2;

    .logo {
        display: flex;
        justify-content: flex-start;
        align-items: center;
        position: relative;
        width: fit-content;
        height: 100%;
    }

    .header-container {
        padding: relative;
        display: flex;
        width: 100%;
        height: 55px;
        justify-content: flex-start;
        align-items: center;
        .nav-tab-container {
            position: relative;
            display: flex;
            height: 100%;

            .nav-tab {
                position: relative;
                display: flex;
                justify-content: center;
                align-items: center;
                width: 75px;
                height: 100%;
                padding-top: 8%;
                margin: 0 15px 0 15px ;
                border: none;
                border-bottom: 3px solid #0336ff00;
                background-color: rgba(255, 255, 255, 0);
                box-sizing: border-box;
                color: #333333;
                font-size: 20px;
                font-family: 'Arial', sans-serif;
                cursor: pointer;
                transition: all 0.1s ease-in-out;

                &:hover {
                    border-bottom: 3px solid #0336ff88;
                    font-weight: 600;
                }

                &.selected {
                    border-bottom: 3px solid #0336ff;
                }
            }
        }

        .user-options {
            position: absolute;
            display: flex;
            right: 20px;

            
        }

        .user-options .log-out-btn {
            border: none;
            background-color: transparent;
            font-size: 16px;
            cursor: pointer;
        }

    }

}

.content-container {
    display: flex;
    flex-direction: column;
    position: relative;
    width: 100%;
    height: 100%;
    background-color: #f7fafd;
    box-sizing: border-box;
    padding-bottom: 52px; /* set for footer height */
}

footer {
    display: flex;
    position: relative;
    bottom: 0;
    left: 0;
    width: 100%;
    height: 52px;
    z-index: 2;
}

</style>