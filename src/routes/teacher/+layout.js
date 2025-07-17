/**
 * 布局加载函数，在进入/teacher路径时检查登录状态
 * @param {Object} params - 加载函数参数
 * @param {Function} params.fetch - SvelteKit提供的fetch函数
 * @param {Object} params.url - 当前URL信息
 */
export async function load({ fetch, url }) {
    // 如果当前路径是登录页面，则不需要检查登录状态
    if (url.pathname === '/teacher') {
        return {};
    }

    try {
        // 向后端发送GET请求检查登录状态，携带cookies
        const response = await fetch("/api/login/status", {
            method: 'GET',
            credentials: 'include',
        });

        // 如果响应成功，表示已登录，不需要做任何处理
        if (response.ok) {
            // 直接返回空对象，不解析响应体，不影响原先路由
            return {};
        } else {
            // 如果响应失败，表示未登录，重定向到登录页面
            // 注意：这里不直接执行重定向，而是返回一个标志，让客户端处理重定向
            // 因为SvelteKit的load函数不能直接执行重定向
            return {
                needLogin: true
            };
        }
    } catch (error) {
        console.error('检查登录状态时出错:', error);
        // 出错时也返回需要登录的标志
        return {
            needLogin: true,
            error: error instanceof Error ? error.message : '未知错误'
        };
    }
}
