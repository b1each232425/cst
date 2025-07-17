import { writable } from "svelte/store";

/**
 * @typedef {Object} Practice
 * @property {number} ID - 练习ID
 * @property {string} Name - 练习名称
 * @property {string} Type - 练习类型
 * @property {string} Status - 练习状态
 * @property {number}AllowedAttempts - 可作答的次数
 */

/** @type {import('svelte/store').Writable<Practice[]>} */
export const practice_data_list = writable([
  // 作为后备数据，如果API调用失败则使用
  {
    ID: 1,
    Name: "Svelte入门实战理论练习",
    Type: "经典巩固",
    Status: "未发布",
    AllowedAttempts: 1,
  },
  {
    ID: 6,
    Name: "Svelte入门实战理论练习",
    Type: "经典巩固",
    Status: "未发布",
    AllowedAttempts: 1,
  },
  {
    ID: 7,
    Name: "Svelte入门实战理论练习",
    Type: "经典巩固",
    Status: "未发布",
    AllowedAttempts: 1,
  },
  {
    ID: 8,
    Name: "Svelte入门实战理论练习",
    Type: "经典巩固",
    Status: "未发布",
    AllowedAttempts: 1,
  },
  {
    ID: 2,
    Name: "React入门实战课后练习",
    Type: "随机组卷",
    Status: "已发布",
    AllowedAttempts: 1,
  },
  {
    ID: 3,
    Name: "Nodejs入门实战课后练习",
    Type: "智能提升",
    Status: "已发布",
    AllowedAttempts: 1,
  },
  {
    ID: 4,
    Name: "Nodejs入门实战课后练习",
    Type: "智能提升",
    Status: "已发布",
    AllowedAttempts: 1,
  },
  {
    ID: 5,
    Name: "Nodejs入门实战课后练习",
    Type: "智能提升",
    Status: "已发布",
    AllowedAttempts: 1,
  },
  {
    ID: 9,
    Name: "Svelte入门实战理论练习",
    Type: "经典巩固",
    Status: "未发布",
    AllowedAttempts: 1,
  },
  {
    ID: 10,
    Name: "Svelte入门实战理论练习",
    Type: "经典巩固",
    Status: "未发布",
    AllowedAttempts: 1,
  },
  {
    ID: 11,
    Name: "Svelte入门实战理论练习",
    Type: "经典巩固",
    Status: "未发布",
    AllowedAttempts: 1,
  },
  {
    ID: 12,
    Name: "Svelte入门实战理论练习",
    Type: "经典巩固",
    Status: "未发布",
    AllowedAttempts: 1,
  },
  {
    ID: 13,
    Name: "React入门实战课后练习",
    Type: "随机组卷",
    Status: "已发布",
    AllowedAttempts: 1,
  },
  {
    ID: 14,
    Name: "Nodejs入门实战课后练习",
    Type: "智能提升",
    Status: "已发布",
    AllowedAttempts: 1,
  },
  {
    ID: 15,
    Name: "Nodejs入门实战课后练习",
    Type: "智能提升",
    Status: "已发布",
    AllowedAttempts: 1,
  },
  {
    ID: 16,
    Name: "Nodejs入门实战课后练习",
    Type: "智能提升",
    Status: "已发布",
    AllowedAttempts: 1,
  },
]);

/** @type {import('svelte/store').Writable<Practice[]>} */
export const practice_data_list_display = writable([]);

export const practice_name_store = writable("");
export const practice_type_store = writable("全部");
export const practice_status_store = writable("全部");
export const current_page_store = writable(1);
export const page_size_store = writable(10);
export const practice_filter = writable(false);
