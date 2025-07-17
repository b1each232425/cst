/*
 * @Author: chenyijun
 * @Date: 2025-04-20 20:20:00
 * @LastEditors: OuYang Haobin 1242968386@qq.com
 * @LastEditTime: 2025-06-18 13:06:23
 */
/** @param {Object} params - 加载函数参数
 * @param {Function} params.fetch - SvelteKit提供的fetch函数
 * @param {Object} params.params - 路由参数
 * @param {string} params.params.id - 练习ID
 */
export async function load({ fetch, params }) {
    const { id } = params;

    try {
        // 获取练习详情数据
        const response = await fetch(`/api/practices/detail?id=${id}`, {
            credentials: "include"
        });
        const data = await response.json();
        console.log("练习详情数据:", data);

        if (data.status !== 0 || !data.data) {
            console.error('获取练习详情响应格式错误:', data);
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

        // 转换练习状态显示
        let statusText = "未发布";
        if (data.data.status === "02") statusText = "已发布";

        // 转换练习类型显示
        console.log("编辑表单的数据:", data.data);
        // 构建表单所需的数据结构
        return {
            practice: {
                data: data.data,
                form: {
                    practice_name: data.data.name,
                    grading_method: data.data.correct_mode,
                    test: {
                        id: data.data.paper_id,
                        name: data.data.exam_name || "",
                    },
                    students: data.data.student_infos,
                    status: statusText,
                    type: data.data.type
                }
            }
        };

    } catch (error) {
        console.error(`获取练习ID=${id}的详情失败:`, error);
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
} 