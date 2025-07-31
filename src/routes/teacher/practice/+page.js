/*
 * @Author: 李乐毅 
 * @Date: 2025-07-27 16:36:22 
 * @Last Modified by:   李乐毅 
 * @Last Modified time: 2025-07-27 16:36:22 
 */ 
import { practice_data_list,practice_data_list_display, practice_name_store, practice_type_store, practice_status_store, current_page_store, page_size_store, practice_filter } from "./store/practiceData";
import { get } from "svelte/store";
import { pageQueryHandle, transformPracticeData } from "./utils";
import { toast } from "$lib/components/Toast/Toast.js";

/** @param {Object} params - 加载函数参数
 * @param {Function} params.fetch - SvelteKit提供的fetch函数
 */
export async function load({ fetch }) {
    if(get(practice_filter)){
        return {
			practices: get(practice_data_list),
            practices_display:get(practice_data_list),
            practice_name: get(practice_name_store),
            practice_type: get(practice_type_store),
            practice_status: get(practice_status_store),
            current_page: get(current_page_store),
            page_size: get(page_size_store)
		};
    }
	// 从API获取练习列表数据
	
		await fetch('/api/practice?page=1&page_size=10', {
            credentials: "include"
        }).then((data)=>{
            if(!data.ok){
                throw new Error("Failed to fetch practice list.");
            }
            return data.json();
        }
        ).then((data)=>{
             practice_filter.set(true);
		if (data.status === 0 && data.data && data.data.practices) {
           const practices =transformPracticeData(data.data.practices);
            // 数据格式正确
            practice_data_list.set(practices);
            return {
                practices: practices,
                total_count: data.total || 0,
                total_page: pageQueryHandle(data.total,10),
                current_page: 1,
                page_size: 10
            };
        } 
         console.error('获取练习列表响应格式错误:', data);
        // 返回默认空数组
        return {
            practices: []
        };
        }).catch((error)=>{
            console.error('获取练习列表失败:', error);
            toast.error('获取练习列表失败');
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
        })
        .finally(() => {
        practice_filter.set(true);
    });
}