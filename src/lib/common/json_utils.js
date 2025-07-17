/*
 * @Author: Zpekii 3156752796@qq.com
 * @Date: 2025-04-08 14:52:22
 * @LastEditors: Zpekii 3156752796@qq.com
 * @LastEditTime: 2025-04-08 15:10:39
 * @FilePath: \exam-fe\src\lib\common\json_utils.js
 * @Description: json对象相关处理工具函数
 * @Copyright (c) 2025 by Zpekii, All Rights Reserved. 
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


/**
 * 深拷贝Json对象
 * @template T extends object
 * @param {T} obj 
 * @returns {T} 
 */
export function deepCopy(obj) {

    if(!verify(obj)) {
        throw new Error('Invalid JSON object');
    }

    return JSON.parse(JSON.stringify(obj));
}