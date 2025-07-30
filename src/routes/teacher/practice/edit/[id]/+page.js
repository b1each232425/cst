 /*
 * @Author: 李乐毅 
 * @Date: 2025-07-27 16:36:22 
 * @Last Modified by:   李乐毅 
 * @Last Modified time: 2025-07-27 16:36:22 
 */ 
/** @param {Object} params - 加载函数参数
 * @param {Function} params.fetch - SvelteKit提供的fetch函数
 * @param {Object} params.params - 路由参数
 * @param {string} params.params.id - 练习ID
 */
export async function load({ fetch, params }) {
    const { id } = params;

    // 获取练习详情数据
    return fetch(`/api/practice?id=${id}`, {
        credentials: "include"
    }).then((response) => {
        if (!response.ok) {
            console.error("Failed to fetch practice detail.");
            return getDefaultValue(id);
        }
        return response.json();
    }).then((data) => {
        console.log("练习详情数据:", data);

        if (data.status !== 0 || !data.data) {
            console.error('获取练习详情响应格式错误:', data);
            return getDefaultValue(id);
        }

        // 转换练习状态显示
        let statusText = "未发布";
        if (data.data.practice.Status === "02") statusText = "已发布";

        // 构建表单所需的数据结构
        return {
            practice: {
                data: data.data,
                form: {
                    practice_name: data.data.practice.Name,
                    grading_method: data.data.practice.CorrectMode,
                    test: {
                        id: data.data.practice.PaperID||0,
                        name: data.data.paper_name || "",
                    },
                    status: statusText,
                    type: data.data.practice.Type,
                    students: data.data.student_count,
                }
            }
        };
    }).catch((error) => {
        console.error(`获取练习ID=${id}的详情失败:`, error);
        return getDefaultValue(id);
    });
}

function getDefaultValue(id) {
    return {
        practice: {
            data: { id: parseInt(id) },
            form: {
                practice_name: "",
                grading_method: "00",
                test: null,
                students: [],
                status: "未发布",
                type: "经典巩固"
            }
        }
    };
}