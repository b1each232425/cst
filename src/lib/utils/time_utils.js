/*
 * @Author: Zpekii 3156752796@qq.com
 * @Date: 2025-04-08 15:05:30
 * @LastEditors: 8023time 2162105974@qq.com
 * @LastEditTime: 2025-09-15 23:52:48
 * @FilePath: src\lib\utils\time_utils.js
 * @Description: 时间相关处理工具函数
 * @Copyright (c) 2025 by Zpekii, All Rights Reserved. 
 */

 /**
 * 将时间戳转换为可读格式: YYYY-MM-DD HH:MM:SS
 * @param {number} timestamp - 时间戳(毫秒)
 * @param {{
 *      show_date?: boolean; // 是否显示日期
 *      show_time?: boolean; // 是否显示时间
 * }} [options] - 格式化字符串
 */
export function formatTimestamp(timestamp, options) {
    if (!options) {
        options = {
            show_date: true,
            show_time: true,
        };
    }

    if (options?.show_date == null) {
        options.show_date = true;
    }

    if (options?.show_time == null) {
        options.show_time = true;
    }

    const date = new Date(timestamp);

    const year = date.getFullYear();
    const month = (date.getMonth() + 1).toString().padStart(2, "0");
    const day = date.getDate().toString().padStart(2, "0");

    const hours = date.getHours().toString().padStart(2, "0");
    const minutes = date.getMinutes().toString().padStart(2, "0");
    const seconds = date.getSeconds().toString().padStart(2, "0");

    return `${options?.show_date ? `${year}-${month}-${day} ` : ""}${options?.show_time ? `${hours}:${minutes}:${seconds}` : ""}`;
}

/**
 * 将秒级时间戳转换为 YY-MM-DD HH:MM:SS 格式
 * @param {number} timestamp - 秒级时间戳
 * @return {string} - 格式化后的时间字符串
 */
export function formatSecondTimestamp(timestamp) {
    
    const date = new Date(timestamp * 1000);
    
    const year = date.getFullYear().toString();
    const month = (date.getMonth() + 1).toString().padStart(2, '0'); 
    const day = date.getDate().toString().padStart(2, '0');
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    const seconds = date.getSeconds().toString().padStart(2, '0');

    return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
}

/**
 * 将 ISO 格式(YYYY-MM-DDTHH:mm:ss.sssZ)的时间字符串转换为 YYYY-MM-DD HH:MM:SS 格式
 * @param {string} time_string 
 * @returns 
 */
export function formatISOString(time_string) {
    if (!time_string) {``
        return '';
    }
    
    const date = new Date(time_string);
    
    if (isNaN(date.getTime())) {
        console.error('Invalid ISO string format:', time_string);
        return '';
    }
    
    let year, month, day, hours, minutes, seconds;
    
    year = date.getFullYear();
    month = (date.getMonth() + 1).toString().padStart(2, '0');
    day = date.getDate().toString().padStart(2, '0');
    hours = date.getHours().toString().padStart(2, '0');
    minutes = date.getMinutes().toString().padStart(2, '0');
    seconds = date.getSeconds().toString().padStart(2, '0');
    
    return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
}

/**
 * 将HH:MM:SS格式转为小时、分钟、秒数
 * @param {string} timeString - 时间字符串，格式为HH:MM:SS
 * @return {{
 *      hours: number, // 小时
 *      minutes: number, // 分钟
 *      seconds: number // 秒数
 * }} - 包含小时、分钟、秒数的对象
 */
export function parseHMSTime(timeString) {
    const parts = timeString.split(':');
    if (parts.length !== 3) {
        throw new Error('Invalid time format. Expected HH:MM:SS');
    }

    const hours = parseInt(parts[0], 10);
    const minutes = parseInt(parts[1], 10);
    const seconds = parseInt(parts[2], 10);

    return { hours, minutes, seconds };
}

/**
 * 将HH:MM:SS格式的时间字符串转换为可读的时间格式, 例如 "2h30m15s"
 * @param {string} timeString 
 */
export function formatHMSTime(timeString) {

    const { hours, minutes, seconds } = parseHMSTime(timeString);
    
    let result = '';
    
    if (hours > 0) {
        result += `${hours}h`;
    }
    
    if (minutes > 0) {
        result += `${minutes}m`;
    }
    
    if (seconds > 0 || result === '') {
        result += `${seconds}s`;
    }
    
    return result;

}


/**
 * 将"2h30m15s"格式的时间字符串转换为HH:MM:SS格式
 * @param {string} timeString 
 * @return {string} - 转换后的时间字符串，格式为HH:MM:SS
 */
export function transformTimeToHMS(timeString) {

    let hours = 0;

    let minutes = 0;

    let seconds = 0;

    const hoursMatch = timeString.match(/(\d+)h/);
    if (hoursMatch) {
        hours = parseInt(hoursMatch[1], 10);
    }

    const minutesMatch = timeString.match(/(\d+)m/);
    if (minutesMatch) {
        minutes = parseInt(minutesMatch[1], 10);
    }

    const secondsMatch = timeString.match(/(\d+)s/);
    if (secondsMatch) {
        seconds = parseInt(secondsMatch[1], 10);
    }

    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
}

/**
 * 将HH:MM:SS格式的时间字符串转换为指定单位的时间值
 * @param {string} timeString 
 * @param {string} unit - 时间单位，支持 "s" (秒), "m" (分钟), "h" (小时)
 * @return {number} - 转换后的时间值
 */
export function transformHMSTimeExpression(timeString, unit) {

    const { hours, minutes, seconds } = parseHMSTime(timeString);
    
    switch (unit) {
        case 's':
            return hours * 3600 + minutes * 60 + seconds;
        case 'm':
            return hours * 60 + minutes + seconds / 60;
        case 'h':
            return hours + minutes / 60 + seconds / 3600;
        default:
            throw new Error('Unsupported time unit. Use "s", "m", or "h".');
    }

}