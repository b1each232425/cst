/*
 * @Author: zdl 1311866870@qq.com
 * @Date: 2025-06-20 22:03:40
 * @LastEditors: zdl 1311866870@qq.com
 * @LastEditTime: 2025-07-07 11:53:17
 * @FilePath: \tutorial-platform-fe\src\lib\excel_export\export_practice_score.js
 * @Description: 
 */
import { sget } from '$lib/common/api_data';

import ExcelJS from 'exceljs';
import JSZip from 'jszip';
import pkg from 'file-saver';
const { saveAs } = pkg;



/**
 * @typedef {Object} Practice - 原试卷题目详情
 * @property {number} stu_id - 学生ID
 * @property {string} name - 学生名称
 * @property {string} remark - 备注
 * @property {number} highest_score - 最高成绩
 * @property {number} submitted_cnt - 尝试次数
 */



/**
 * 
 * @param {Array<Object>} data 
 * @param {Record<string, string>} selectPractice
 */
export async function exportPracticeToExcel(data, selectPractice) {
    const workbook = new ExcelJS.Workbook();
    const practiceNameMap = convertToNumberMap(selectPractice)
    // 先根据exam_id进行分组
    /**
   * @type {Map<number, Array<Object>>}
   */
    const practiceMap = new Map()
    /**
* @type {number[]}
*/
    const practicIDs = [];


    data.forEach(item => {
        const practicID = sget(item, "practice_id", 0)
        if (practiceMap.has(practicID)) {
            practiceMap.get(practicID).push(item)
        } else {
            practiceMap.set(practicID, [item])
            practicIDs.push(practicID)
        }
    })

    const practiceLengh = practicIDs.length
    const zip = new JSZip();
    let zipName = "（" + practiceLengh + "场练习）学生成绩"
    const mainFolder = zip.folder(zipName)
    if (mainFolder == null) {
        console.error("创建jszip实体失败")
        return
    }

    await Promise.all(practicIDs.map(async practiceID => {
        const practice = practiceMap.get(practiceID)
        let sheetName = practiceNameMap.get(practiceID)
        const excelBuffer = await generateExcel(practice);
        mainFolder.file(`${sheetName}.xlsx`, excelBuffer);
    }))
    const content = await zip.generateAsync({ type: "blob" });
    saveAs(content, "考生练习成绩.zip");
}

function convertToNumberMap(record) {
    const map = new Map();

    for (const [key, value] of Object.entries(record)) {
        const numKey = Number(key);

        // 检查是否是有效数字
        if (!isNaN(numKey)) {
            map.set(numKey, value);
        }
    }
    return map;
}

/**
 * @description 处理一场考试中的多个场次的问题，还要动态的添加不同的标头,要每一个考试创建一次workBook
 * @param {Array<Object>} practiceData - 当场考试所包含的所有学生信息
 */
async function generateExcel(practiceData) {
    // 一次考试就是一个excel文件
    const workbook = new ExcelJS.Workbook();

    const worksheet = workbook.addWorksheet("练习成绩")
    /**
* @type {Array<object>}
*/
    let studentArray = []
    let columns = [
        { header: '序号', key: 'id', width: 20 },
        { header: '学号', key: 'stu_id', width: 20 },
        { header: '姓名', key: 'name', width: 20 },
        { header: '最高得分', key: 'highest_score', width: 20 },
        { header: '提交次数', key: 'submitted_cnt', width: 20 },
        { header: "备注", key: "remark", width: 20 },
    ]
    practiceData.forEach((practice, index) => {

        if (practice["highest_score"] == null) {
            practice["highest_score"] = 0
        }
        if (practice["remark"] == null || practice["remark"] == "") {
            practice["remark"] = "--"
        }
        let student = {
            id: index + 1,
            stu_id: practice.stu_id,
            name: practice.name,
            highest_score: practice.highest_score,
            submitted_cnt: practice.submitted_cnt,
            remark: practice.remark
        }
        studentArray.push(student)
    })

    worksheet.columns = columns
    studentArray.forEach(item => {
        worksheet.addRow(item)
    })
    worksheet.eachRow(row => {
        row.alignment = { vertical: 'middle', horizontal: 'center' };
    });

    return workbook.xlsx.writeBuffer();
}