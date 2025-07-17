/*
 * @Author: Mayux && dbs45412@163.com
 * @Date: 2025-04-28 17:31:10
 * @LastEditors: Mayux && 1243805308@qq.com
 * @LastEditTime: 2025-06-05 12:38:04
 * @FilePath: \tutorial-platform-fe\src\lib\excel_export\export_invigilator_info.js
 * @Description: 导出并下载监考员信息的表格文件
 */
import ExcelJS from 'exceljs';

/**
 * @typedef {Object} InvigilatorData
 * @property {string} exam_name - 考试名称
 * @property {number} exam_session_id - 考试场次ID
 * @property {string} exam_session_name - 考试场次名称
 * @property {string} name - 监考员姓名
 * @property {string} start_time - 开始时间
 * @property {string} end_time - 结束时间
 * @property {number} exam_room_id - 考场ID
 * @property {string} exam_room_name - 考场名称
 * @property {number} exam_site_id - 考点ID
 * @property {string} exam_site_name - 考点名称
 */

/**
 * @typedef {Object} SessionData
 * @property {number} exam_session_id - 考试场次ID
 * @property {string} session_name - 场次名称
 * @property {string} start_time - 开始时间
 * @property {string} end_time - 结束时间
 * @property {InvigilatorData[]} invigilators - 监考员列表
 */

/**
 * @typedef {Object} SiteData
 * @property {string} site_name - 考点名称
 * @property {Record<string, SessionData>} sessions - 场次数据
 */

/**
 * @typedef {Record<number, SiteData>} InvigilatorsBySite
 */

/**
 * 格式化时间字符串为更友好的中文格式
 * @param {string} isoTimeString - ISO格式的时间字符串
 * @returns {string} 格式化后的时间字符串
 */
function formatTime(isoTimeString) {
    if (!isoTimeString) return '';
    const date = new Date(isoTimeString);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    return `${year}年${month}月${day}日 ${hours}:${minutes}`;
}

/**
 * 导出监考员信息到Excel
 * @param {InvigilatorData[]} data - 监考员数据列表
 */
export async function exportToInvigilatorExcel(data) {
    if (!data || data.length === 0) {
        console.error("获取失败，数据为空");    
        return "获取失败，数据为空";
    }

    // 按考点分组数据
    /** @type {InvigilatorsBySite} */
    const invigilatorsBySite = {};
    
    // 从数据中提取考点信息并分组
    data.forEach((invigilator) => {
        const siteId = invigilator.exam_site_id;
        if (!invigilatorsBySite[siteId]) {
            invigilatorsBySite[siteId] = {
                site_name: invigilator.exam_site_name || "未知考点",
                sessions: {}
            };
        }
        
        // 按考试场次分组
        const sessionKey = `${invigilator.exam_session_id}`;
        if (!invigilatorsBySite[siteId].sessions[sessionKey]) {
            invigilatorsBySite[siteId].sessions[sessionKey] = {
                exam_session_id: invigilator.exam_session_id,
                session_name: invigilator.exam_session_name || "未知场次（考卷未下发）",
                start_time: invigilator.start_time,
                end_time: invigilator.end_time,
                invigilators: []
            };
        }
        
        invigilatorsBySite[siteId].sessions[sessionKey].invigilators.push(invigilator);
    });

    // 为每个考点创建一个Excel文件
    for (const siteId in invigilatorsBySite) {
        const site = invigilatorsBySite[siteId];
        const workbook = new ExcelJS.Workbook();
        
        // 为每个考试场次创建一个sheet
        for (const sessionKey in site.sessions) {
            const session = site.sessions[sessionKey];
            const worksheet = workbook.addWorksheet(session.session_name);

            // 设置列宽
            worksheet.columns = [
                { key: 'serial_number', width: 10 },
                { key: 'name', width: 20 },
                { key: 'exam_room_name', width: 30 },
            ];
            
            // 添加场次名称和考点名称作为第一行
            const titleRow = worksheet.addRow([`${session.session_name}-${site.site_name}`]);
            worksheet.mergeCells(`A1:C1`);
            titleRow.getCell(1).alignment = { horizontal: 'center' };
            titleRow.getCell(1).font = { bold: true, size: 14 };
            
            // 添加考试时间作为第二行
            const timeRow = worksheet.addRow([`考试时间：${formatTime(session.start_time)} - ${formatTime(session.end_time)}`]);
            worksheet.mergeCells(`A2:C2`);
            timeRow.getCell(1).alignment = { horizontal: 'center' };
            timeRow.getCell(1).font = { size: 12 };
            
            // 添加表头
            const headerRow = worksheet.addRow(['编号', '姓名', '考场名称']);
            headerRow.eachCell((cell) => {
                cell.font = { bold: true };
            });
            
            // 添加监考员数据
            session.invigilators.forEach((invigilator, index) => {
                worksheet.addRow([
                    index + 1,
                    invigilator.name,
                    invigilator.exam_room_name
                ]);
            });

            // 设置所有单元格居中
            worksheet.eachRow((row) => {
                row.eachCell((cell) => {
                    cell.alignment = { vertical: 'middle', horizontal: 'center' };
                });
            });
        }

        // 生成二进制数据
        const buffer = await workbook.xlsx.writeBuffer();

        // 创建下载链接
        const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
        const url = URL.createObjectURL(blob);

        const link = document.createElement('a');
        link.href = url;
        link.download = `${site.site_name}监考员名单.xlsx`;
        link.click();

        URL.revokeObjectURL(url);
    }
}