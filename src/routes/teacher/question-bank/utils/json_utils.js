/*
* @Author: Zpekii 3156752796@qq.com
 * @Date: 2025-07-24 03:08:56
 * @LastEditors:  qjj qiaojunjie6@qq.com
 * @LastEditTime: 2025-07-24 03:08:56
 * @FilePath: \exam-fe\src\routes\teacher\question-bank-management\utils\json_utils.js* @Description: json相关处理工具函数
 * @Description: json对象相关处理工具函数
 * @Copyright (c) 2025 by qjj, All Rights Reserved. 
 */

/**
 * 验证对象是否为Json对象
 * @param {any} obj 
 * @returns {boolean}
 */
export function verify(obj) {
    if (typeof obj !== 'object' || obj === null) {
        return false;
    }
    if (Array.isArray(obj)) {
        return obj.every(item => verify(item));
    }
    return true;
}


