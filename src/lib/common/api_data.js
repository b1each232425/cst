/*
 * @Author: 邹德伦 13815400+zou-delun@user.noreply.gitee.com
 * @Date: 2025-06-14 11:18:31
 * @LastEditors: 邹德伦 13815400+zou-delun@user.noreply.gitee.com
 * @LastEditTime: 2025-06-14 11:20:42
 * @FilePath: \tutorial-platform-fe\src\lib\common\api_data.js
 * @Description: 用于安全访问对象结构体内的属性
 */
/**
 * 安全访问对象结构体
 * @param obj 要访问的结构体
 * @param path 路径
 * @param defaultValue 默认值
 */
// @ts-nocheck
export function sget(obj, path, defaultValue) {
  const keyList = path.toString().split('.');
  const keyLength = keyList.length;

  let result = obj;
  if (keyLength > 0) {
    for (let i = 0; i < keyLength; i++) {
      if (result == null) {
        break;
      }
      result = result[keyList[i]];
    }
  }

  return result == null ? defaultValue : result;
}