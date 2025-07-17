/*
 * @Author: zdl <1311866870@qq.com>
 * @Date: 2025-06-17 10:52:53
 * @LastEditors: zdl 1311866870@qq.com
 * @LastEditTime: 2025-07-09 18:17:14
 * @FilePath: \tutorial-platform-fe\src\lib\excel_export\export_examinee_score.js
 * @Description: 支持导出单/多次考试考生成绩
 */
import ExcelJS from 'exceljs';
import { sget } from '$lib/common/api_data';
import JSZip from 'jszip';
import pkg from 'file-saver';
const { saveAs } = pkg;


/**
 * @typedef {Object} DefaultStudentData
 * @property {number} id  - 学生序号
 * @property {string} name  - 学生姓名
 * @property {number} student_id  - 学生学号
 * @property {number} score - 总得分
 */


/**
 * @typedef ExamSessionInfo
 * @property {number} id -考试场次
 * @property {string} paper_name -试卷名称
 * @property {string} start_time -考试开始时间
 * @property {string} end_time -考试结束时间
 * @property {number} total_score -考试总分
 * @property {number} average_score -考试平均分
 * @property {number} scheduled_examinees -计划应考人数
 * @property {number} actual_examinees -实际应考人数
 * @property {number} pass_examinees -考试通过人数
 *  @property {number} exam_session_id - 场次ID
 */

// 这个是一个考试的数据;    其实多个考试也是可以这个写的
const DEFAULT_EXAMSCORE_DATA = [
    {
        "stu_id": 1,
        "exam_id": "数学期中考试",
        "exam_session_id": 1748505600000,
        "name": "张三",
        "phone": "13800138001",
        "nickname": "440711200408223917",
        "score": 85,
        "remark": "文新221"
    },
    {
        "stu_id": 2,
        "exam_id": "数学期中考试",
        "exam_session_id": 1748505600000,
        "name": "李四",
        "phone": "13900139001",
        "nickname": "440711200409152112",
        "score": 92,
        "remark": "理工301"
    },
    {
        "stu_id": 1,
        "exam_id": "数学期中考试",
        "exam_session_id": 1748592000000,
        "name": "张三",
        "phone": "13800138001",
        "nickname": "440711200408223917",
        "score": 78,
        "remark": "文新221"
    },
    {
        "stu_id": 3,
        "exam_id": "数学期中考试",
        "exam_session_id": 1748592000000,
        "name": "王五",
        "phone": "13700137001",
        "nickname": "440711200410283456",
        "score": 90,
        "remark": "经管415"
    },
    {
        "stu_id": 2,
        "exam_id": "语文期中考试",
        "exam_session_id": 1748678400000,
        "name": "李四",
        "phone": "13900139001",
        "nickname": "440711200409152112",
        "score": 88,
        "remark": "理工301"
    },
    {
        "stu_id": 4,
        "exam_id": "语文期中考试",
        "exam_session_id": 1748678400000,
        "name": "赵六",
        "phone": "13600136001",
        "nickname": "440711200411124789",
        "score": 76,
        "remark": "外语502"
    },
    {
        "stu_id": 2,
        "exam_id": "语文期中考试",
        "exam_session_id": 1748764800000,
        "name": "李四",
        "phone": "13900139001",
        "nickname": "440711200409152112",
        "score": 94,
        "remark": "理工301"
    },
    {
        "stu_id": 5,
        "exam_id": "语文期中考试",
        "exam_session_id": 1748764800000,
        "name": "孙七",
        "phone": "13500135001",
        "nickname": "440711200412256123",
        "score": 81,
        "remark": "艺术208"
    },
    {
        "stu_id": 3,
        "exam_id": "英语期中考试",
        "exam_session_id": 1748851200000,
        "name": "王五",
        "phone": "13700137001",
        "nickname": "440711200410283456",
        "score": 79,
        "remark": "经管415"
    },
    {
        "stu_id": 1,
        "exam_id": "英语期中考试",
        "exam_session_id": 1748851200000,
        "name": "张三",
        "phone": "13800138001",
        "nickname": "440711200408223917",
        "score": 83,
        "remark": "文新221"
    },
    {
        "stu_id": 3,
        "exam_id": "英语期中考试",
        "exam_session_id": 1748937600000,
        "name": "王五",
        "phone": "13700137001",
        "nickname": "440711200410283456",
        "score": 87,
        "remark": "经管415"
    },
    {
        "stu_id": 4,
        "exam_id": "英语期中考试",
        "exam_session_id": 1748937600000,
        "name": "赵六",
        "phone": "13600136001",
        "nickname": "440711200411124789",
        "score": 91,
        "remark": "外语502"
    },
    {
        "stu_id": 4,
        "exam_id": "物理期中考试",
        "exam_session_id": 1749024000000,
        "name": "赵六",
        "phone": "13600136001",
        "nickname": "440711200411124789",
        "score": 84,
        "remark": "外语502"
    },
    {
        "stu_id": 5,
        "exam_id": "物理期中考试",
        "exam_session_id": 1749024000000,
        "name": "孙七",
        "phone": "13500135001",
        "nickname": "440711200412256123",
        "score": 77,
        "remark": "艺术208"
    },
    {
        "stu_id": 4,
        "exam_id": "物理期中考试",
        "exam_session_id": 1749110400000,
        "name": "赵六",
        "phone": "13600136001",
        "nickname": "440711200411124789",
        "score": 89,
        "remark": "外语502"
    },
    {
        "stu_id": 1,
        "exam_id": "物理期中考试",
        "exam_session_id": 1749110400000,
        "name": "张三",
        "phone": "13800138001",
        "nickname": "440711200408223917",
        "score": 75,
        "remark": "文新221"
    },
    {
        "stu_id": 5,
        "exam_id": "数学期中考试",
        "exam_session_id": 1748505600000,
        "name": "孙七",
        "phone": "13500135001",
        "nickname": "440711200412256123",
        "score": 82,
        "remark": "艺术208"
    },
    {
        "stu_id": 3,
        "exam_id": "语文期中考试",
        "exam_session_id": 1748678400000,
        "name": "王五",
        "phone": "13700137001",
        "nickname": "440711200410283456",
        "score": 73,
        "remark": "经管415"
    },
    {
        "stu_id": 2,
        "exam_id": "英语期中考试",
        "exam_session_id": 1748851200000,
        "name": "李四",
        "phone": "13900139001",
        "nickname": "440711200409152112",
        "score": 95,
        "remark": "理工301"
    },
    {
        "stu_id": 5,
        "exam_id": "英语期中考试",
        "exam_session_id": 1748937600000,
        "name": "孙七",
        "phone": "13500135001",
        "nickname": "440711200412256123",
        "score": 80,
        "remark": "艺术208"
    }
]

/**
 * 
 * @param {Array<Object>} data 
 * @param {Record<string, string>} selectExam
 * @param {Map<number,ExamSessionInfo[]>} sessionMap
 */
export async function exportExamToExcel(data, selectExam, sessionMap) {


    const examNameMap = convertToNumberMap(selectExam)

    const sessionInfoMap = convertToNumberMap(sessionMap)

    // 先处理这个携带的考试ID + 考试名称的Map
    // 首先进来先要处理这个数据，看有多少个考试，现在传入几个就创建几个
    // 先根据exam_id进行分组
    /**
   * @type {Map<number, Array<Object>>}
   */
    const examMap = new Map()
    // 获取现在的考试ID
    /**
   * @type {number[]}
   */
    const examIDs = [];
    data.forEach(item => {
        const examID = sget(item, "exam_id", 0)
        if (examMap.has(examID)) {
            examMap.get(examID).push(item)
        } else {
            examMap.set(examID, [item])
            examIDs.push(examID)
        }
    })
    const examLengh = examIDs.length
    const zip = new JSZip();
    let zipName = "（" + examLengh + "场考试）学生考试成绩"
    const mainFolder = zip.folder(zipName)
    if (mainFolder == null) {
        console.error("创建jszip实体失败")
        return
    }
    await Promise.all(examIDs.map(async examID => {
        const exam = examMap.get(examID);
        const sessionInfo = sessionInfoMap.get(examID)
        const sheetName = examNameMap.get(examID);
        const excelBuffer = await generateExcel(exam, sessionInfo, sheetName);
        mainFolder.file(`${sheetName}(${examID}).xlsx`, excelBuffer);
    }));

    const content = await zip.generateAsync({ type: "blob" });
    saveAs(content, "考生考试成绩.zip");
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
 * @param {Array<Object>} examData - 当场考试所包含的所有学生信息
 * @param {ExamSessionInfo[]} sessionInfo 记录场次的信息
 * @param {string} examName 考试名称
 */
async function generateExcel(examData, sessionInfo, examName) {

    // 一次考试就是一个excel文件
    const workbook = new ExcelJS.Workbook();

    /**
 * @type {Map<number, Array<Object>>}
 */
    const examSessionMap = new Map()



    // 获取现在的考试ID
    /**
   * @type {number[]}
   */
    const examSessionIDs = [];



    // 对场次进行处理
    examData.forEach(item => {
        const examSessionID = sget(item, "exam_session_id", 0)
        if (examSessionMap.has(examSessionID)) {
            examSessionMap.get(examSessionID).push(item)
        } else {
            examSessionMap.set(examSessionID, [item])
            examSessionIDs.push(examSessionID)
        }
    })
    examSessionIDs.sort((a, b) => a - b);

    // 定义列头
    let columns = [
        { header: '序号', key: 'id', width: 20 },
        { header: '学号', key: 'student_id', width: 20 },
        { header: '姓名', key: 'name', width: 20 },
        { header: '得分', key: 'score', width: 20 },
        { header: '备注', key: 'remark', width: 20 }
    ]
    for (let i = 0; i < examSessionIDs.length; i++) {
        /**
        * @type {Map<number, Object>}
        */
        // 保存原学生数据结构
        const StudentMap = new Map()

        /**
        * @type {Array<number>}
        */
        let studentIDArray = []

        /**
        * @type {Array<object>}
        */
        let studentArray = []
        //当前场次的开始时间
        let sessionStartTime = ""
        //当前场次的结束时间
        let sessionEndTime = ""
        // 这里需要找出属于这个场次的考试时间
        for (let k = 0; k < sessionInfo.length; k++) {
            if (sessionInfo[k].exam_session_id === examSessionIDs[i]) {
                sessionStartTime = sessionInfo[k].start_time
                sessionEndTime = sessionInfo[k].end_time
                break
            }
            continue
        }
        const examSessionData = examSessionMap.get(examSessionIDs[i])
        let sessionNumScoreIndex = i + 1
        const worksheet = workbook.addWorksheet("场次" + sessionNumScoreIndex)
        if (!examSessionData) {
            return
        } else {
            // 添加场次名称和考点名称作为第一行
            const titleRow = worksheet.addRow([`考试名称：${examName}`]);
            worksheet.mergeCells(`A1:E1`);
            titleRow.getCell(1).alignment = { horizontal: 'center' };
            titleRow.getCell(1).font = { bold: true, size: 14 };

            // 添加考试时间作为第二行
            const timeRow = worksheet.addRow([`考试时间：${sessionStartTime} - ${sessionEndTime}`]);
            worksheet.mergeCells(`A2:E2`);
            timeRow.getCell(1).alignment = { horizontal: 'center' };
            timeRow.getCell(1).font = { size: 12 };
            // 这里已经是代表一次场次的数据了，就需要添加到
            examSessionData.forEach(session => {
                const studentID = sget(session, "stu_id", 0);
                if (session["score"] == null) {
                    session["score"] = 0
                }
                if (session["remark"] == null || session["remark"] == "") {
                    session["remark"] = "--"
                }
                let student = {
                    stu_id: session["stu_id"],
                    name: session["name"],
                    remark: session["remark"],
                    score: session["score"]
                }
                StudentMap.set(studentID, student)
                studentIDArray.push(studentID)
            })
        }

        for (let k = 0; k < studentIDArray.length; k++) {
            let student = StudentMap.get(studentIDArray[k])
            student["id"] = k + 1
            studentArray.push(student)
        }
        worksheet.columns = [
            { key: 'id', width: 20 },
            { key: 'stu_id', width: 20 },
            { key: 'name', width: 20 },
            { key: 'score', width: 20 },
            { key: 'remark', width: 20 }
        ]
        const headerRow = worksheet.addRow(['序号', '学号', '姓名', '得分', '备注']);
        headerRow.eachCell((cell) => {
            cell.font = { bold: true };
        });
        studentArray.forEach(item => {
            worksheet.addRow([
                item.id,
                item.stu_id,
                item.name,
                item.score,
                item.remark
            ])
        })
        worksheet.eachRow(row => {
            row.alignment = { vertical: 'middle', horizontal: 'center' };
        });
    }
    // 现在多个考试场次是多个excel文件
    return workbook.xlsx.writeBuffer();
}