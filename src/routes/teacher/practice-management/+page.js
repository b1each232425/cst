/*
 * @Author: chenyijun
 * @Date: 2025-04-20 20:20:00
 * @LastEditors: chenyijun
 * @LastEditTime: 2025-05-03 14:20:06
 */
import { practice_data_list,practice_data_list_display, practice_name_store, practice_type_store, practice_status_store, current_page_store, page_size_store, practice_filter } from "../../../lib/stores/practiceData";
import { get } from "svelte/store";
/** @param {Object} params - 加载函数参数
 * @param {Function} params.fetch - SvelteKit提供的fetch函数
 */
export async function load({ fetch }) {
    if(get(practice_filter)){
        return {
			practices: get(practice_data_list),
            practices_display:get(practice_data_list_display),
            practice_name: get(practice_name_store),
            practice_type: get(practice_type_store),
            practice_status: get(practice_status_store),
            current_page: get(current_page_store),
            page_size: get(page_size_store)
		};
    }
	// 从API获取练习列表数据
	try {
		const response = await fetch('/api/practices/list?page=1&page_size=10', {
            credentials: "include"
        });
		const data = await response.json();
        console.log("练习列表数据:", data);
        practice_filter.set(true);
		if (data.status === 0 && data.data && data.data.records) {
            // 数据格式正确
            practice_data_list.set(data.data.records);
            return {
                practices: data.data.records,
                total_count: data.rowCount || 0,
                total_page: data.data.pages,
                current_page: data.data.current,
                page_size: data.data.size
            };
        } 
        console.error('获取练习列表响应格式错误:', data);
        // 返回默认空数组
        return {
            practices: []
        };
        
	} catch (error) {
		console.error('获取练习列表失败:', error);
        practice_filter.set(true);
		return {
			practices: get(practice_data_list),
            practices_display:get(practice_data_list_display),
            practice_name: get(practice_name_store),
            practice_type: get(practice_type_store),
            practice_status: get(practice_status_store),
            current_page: get(current_page_store),
            page_size: get(page_size_store)
		};
	}
}