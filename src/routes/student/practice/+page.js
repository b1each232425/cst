/*
 * @Author: chenyijun
 * @Date: 2025-04-29 20:22:08
 * @LastEditors: OuYang Haobin 1242968386@qq.com
 * @LastEditTime: 2025-05-30 23:01:26
 */
/**
 * @param {{ fetch: Function }} param0
 */
export async function load({ fetch }) {
    try {
		const response = await fetch('/api/student_practice?type=00&page=1&page_size=10', {
            credentials: "include"
        });
        if (!response.ok) {
            throw new Error('Failed to fetch practice list api: ' + await response.text());
        }
		const data = await response.json();
        console.log("data", data);     
        if (data.status === 0 && data.data) {
            console.log("练习列表数据:", data);
            return {
                practiceList: data.data?.records || [],
                pagination: {
                    total: data.rowCount || 0,
                    pages: data.data?.pages || 1,
                    current: data.data?.current || 1,
                    size: data.data?.size || 10
                }
            };
        } 
        console.error('获取练习列表响应格式错误:', data);
        return {
            practiceList: [],
            pagination: {
                total: 0,
                pages: 1,
                current: 1,
                size: 10
            }
        };
	} catch (error) {
        console.error('获取练习列表失败:', error);
        return {
            practiceList: [],
            pagination: {
                total: 0,
                pages: 1,
                current: 1,
                size: 10
            }
        };
	}
}