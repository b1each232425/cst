import { authMetadata } from "$lib/stores/permission";

// 获取用户权限元数据
export async function fetchAuthMetadata() {
    const response = await fetch("/api/auth-metadata", {
        method: "GET",
        headers: {
            "Content-Type": "application/json",
        },
        credentials: "include",
    });

    if (!response.ok) {
        throw new Error(`请求失败: ${response.status}`);
    }

    const result = await response.json();
    if (result && result.status === 0) {
        // 修改下权限的中文名，将里面的角色去掉
        result.data.roles.forEach(role => {
            role.description = role.description.replace(/角色/g, '');
        });
        // 修改下权限的中文名，将里面的角色去掉
        result.data.menu_permissions.forEach(menu_permission => {
            menu_permission.description = menu_permission.description.replace(/模块/g, '');
        });
        authMetadata.set(result.data);
        return result.data;
    } else {
        throw new Error(`获取用户权限元数据失败: ${result.message || "未知错误"}`);
    }
}

/**
 * 发送操作日志（content 为字符串，会被包装为 JSON 字符串以兼容后端 jsonb 类型）
 * @param {string} content - 日志内容字符串
 */
export function sendOperationLog(content) {
    fetch("/api/user-mgt/operation-log", {
        method: "POST",
        credentials: "include",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify({
            data: {
                content: content
            }
        }),
    })
        .then((response) => {
            if (!response.ok) {
                console.error("操作日志发送失败，状态码:", response.status);
            }
        })
        .catch((error) => {
            console.error("发送操作日志请求出错:", error);
        });
}