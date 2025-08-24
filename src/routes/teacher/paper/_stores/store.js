/*
 * @Author: WangKaidun 1597225095@qq.com
 * @Date: 2025-08-07 11:10:19
 * @LastEditors: WangKaidun 1597225095@qq.com
 * @LastEditTime: 2025-08-07 11:35:06
 * @FilePath: \exam\src\routes\teacher\paper\_stores\store.js
 * @Description: 跨组件临时数据存储
 * Copyright (c) 2025 by WangKaidun 1597225095@qq.com, All Rights Reserved. 
 */
// @ts-nocheck

import { writable } from "svelte/store";

////////////////////// 试卷列表区 //////////////////////

// 当前编辑的试卷 ID
export const CURRENT_PAPER_ID = writable(0);        // 待编辑试卷 ID
export const SEARCH_PAPER_NAME = writable("");      // 搜索试卷名称
export const SEARCH_PAPER_TAGS = writable("");      // 搜索试卷标签
export const PAPER_PAGE_SIZE = writable(10);        // 页面大小
export const PAPER_PAGE = writable(1);              // 当前页码
export const SELECTED_PAPER_IDS = writable([]);     // 已选试卷 ID
export const ALL_PAPER_SELECTED = writable(false);  // 是否为全选状态

////////////////////// 试卷列表区 //////////////////////



//////////////////// 自定义组卷区 //////////////////////

// 题组展开状态
export const GROUP_OPEN_STATE = writable({});

// 试题展开状态
export const QUESTION_OPEN_STATE = writable({});

// 题组的每题分数
export const GROUP_AVERAGE_SCORE = writable({});

// 侧边栏折叠状态
export const SIDEBAR_COLLAPSED = writable(false);

//////////////////// 自定义组卷区 //////////////////////