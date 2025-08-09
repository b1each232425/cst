/*
 * @Author: zdl 1311866870@qq.com
 * @Date: 2025-07-25 09:42:37
 * @LastEditors: zdl 1311866870@qq.com
 * @LastEditTime: 2025-07-25 09:42:56
 * @FilePath: \exam\src\lib\utils\index.js
 * @Description: 
 */
/**
 * @description 安全地访问结构体内的属性
 * @param obj 要访问的结构体
 * @param path 路径
 * @param defaultValue 默认值
 * @returns {Function} 结果值为 undefined 或 null 返回默认值，结果值为 0, "", false, NaN 这类 falsy 值会被返回
 */
export function sget (obj, path, defaultValue) {
  const keyList = path.toString().split('.')
  const keyLength = keyList.length

  let result = obj
  if (keyLength > 0) {
    for (let i = 0; i < keyLength; i++) {
      if (result == null) {
        break
      }
      result = result[keyList[i]]
    }
  }

  return result == null ? defaultValue : result
}