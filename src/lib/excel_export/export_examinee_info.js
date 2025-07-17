/*
 * @Author: Mayux && dbs45412@163.com
 * @Date: 2025-04-28 17:31:10
 * @LastEditors: Mayux && 1243805308@qq.com
 * @LastEditTime: 2025-06-09 15:24:45
 * @FilePath: \tutorial-platform-fe\src\lib\excel_export\export_examinee_info.js
 * @Description: 导出并下载考生账号密码等信息的表格文件
 */
import ExcelJS from 'exceljs';

const DEFAULT_STUDENT_DATA = [
    {
        'serial_number':1,
        'official_name':"张三",
        'mobile_phone':13824087366,
        'account':"32402123492",
        'passwd':"123456",
        'id_card_no':"440711200408223917",
        'exam_room_id':1,
        'exam_room_name':"文新221",
        'exam_site_id':1,
        'exam_site_name':"广洲大学考点",
        'exam_card':"1234567890"
    },
    {
        'serial_number':1,
        'official_name':"张三",
        'mobile_phone':13824087366,
        'account':"32402123492",
        'passwd':"123456",
        'id_card_no':"440711200408223917",
        'exam_room_id':2,
        'exam_room_name':"文新222",
        'exam_site_id':1,
        'exam_site_name':"广洲大学考点",
        'exam_card':"1234567890"
    },
    {
        'serial_number':1,
        'official_name':"张三",
        'mobile_phone':13824087366,
        'account':"32402123492",
        'passwd':"123456",
        'id_card_no':"440711200408223917",
        'exam_room_id':1,
        'exam_room_name':"文新221",
        'exam_site_id':2,
        'exam_site_name':"中山大学考点",
        'exam_card':"1234567890"
    },
]

export async function exportToExcel(data) {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Sheet1');

    // 添加表头
    worksheet.columns = [
        { header: '编号', key: 'serial_number', width: 10 },
        { header: '姓名', key: 'official_name', width: 20 },
        { header: '手机号', key: 'mobile_phone', width: 15 },
        { header: '账号', key: 'account', width: 20 },
        { header: '密码', key: 'passwd', width: 20 },
    ];

    // 添加数据行
    data.forEach(item => {
        worksheet.addRow(item);
    });

    // 生成二进制数据
    const buffer = await workbook.xlsx.writeBuffer();

    // 创建下载链接
    const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    const url = URL.createObjectURL(blob);

    const link = document.createElement('a');
    link.href = url;
    link.download = '考生名单.xlsx';
    link.click();

    URL.revokeObjectURL(url);
}

/**
 * @param {any[]} student_data
 */
export async function exportToExcelOfflineExam(student_data) {
    if (!student_data || student_data.length === 0) {
        console.error("获取失败，数据为空");    
        return "获取失败,数据为空";
    }

    let student_data_list = student_data;

    // 按考点分组学生数据
    const studentsBySite = {};
    
    // 从学生数据中提取考点信息并分组
    student_data_list.forEach(student => {
        if (!studentsBySite[student.exam_site_id]) {
            studentsBySite[student.exam_site_id] = {
                site_name: student.exam_site_name?student.exam_site_name:"未知考点",
                rooms: {}
            };
        }
        
        // 按考场分组
        if (!studentsBySite[student.exam_site_id].rooms[student.exam_room_id]) {
            studentsBySite[student.exam_site_id].rooms[student.exam_room_id] = {
                room_name: student.exam_room_name?student.exam_room_name:"未知考场",
                students: []
            };
        }
        
        studentsBySite[student.exam_site_id].rooms[student.exam_room_id].students.push(student);
    });

    // 为每个考点创建一个Excel文件
    for (const siteId in studentsBySite) {
        const site = studentsBySite[siteId];
        const workbook = new ExcelJS.Workbook();
        
        // 为每个考室创建一个sheet
        for (const roomId in site.rooms) {
            const room = site.rooms[roomId];
            const worksheet = workbook.addWorksheet(room.room_name);

            worksheet.columns = [
                { key: 'serial_number', width: 10 },
                { key: 'official_name', width: 20 },
                { key: 'mobile_phone', width: 15 },
                { key: 'id_card_no', width: 20 },
                { key: 'examinee_number', width: 20 },
                { key: 'account', width: 20 },
                { key: 'passwd', width: 20 },
            ];
            
            // 添加考室名称作为第一行
            const titleRow = worksheet.addRow([`${site.site_name}-${room.room_name}`]);
            worksheet.mergeCells(`A1:G1`);
            titleRow.getCell(1).alignment = { horizontal: 'center' };
            titleRow.getCell(1).font = { bold: true, size: 14 };
            
            const headerRow = worksheet.addRow([
                '编号', '姓名', '手机号', '身份证号', '准考证号', '账号', '密码'
            ]);
            
            // 设置表头加粗
            headerRow.eachCell((cell) => {
                cell.font = { bold: true };
            });
            
            // 添加学生数据
            room.students.forEach(student => {
                worksheet.addRow([
                    student.serial_number,
                    student.official_name,
                    student.mobile_phone,
                    student.id_card_no,
                    student.examinee_number,
                    student.account,
                    student.passwd
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
        link.download = `${site.site_name}考生名单.xlsx`;
        link.click();

        URL.revokeObjectURL(url);
    }
}

//下载导入失败的考生名单
export async function downloadFailureList(data) {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Sheet1');

    // 添加表头
    worksheet.columns = [
        { header: '编号', key: 'serial_number', width: 10 },
        { header: '姓名', key: 'official_name', width: 20 },
        { header: '手机号', key: 'mobile_phone', width: 15 },
        { header: '身份证号', key: 'id_card', width: 20 },
    ];

    // 添加数据行
    data.forEach(item => {
        worksheet.addRow(item);
    });

    // 生成二进制数据
    const buffer = await workbook.xlsx.writeBuffer();   

    // 创建下载链接
    const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    const url = URL.createObjectURL(blob);

    const link = document.createElement('a');
    link.href = url;
    link.download = '导入失败考生名单.xlsx';
    link.click();

    URL.revokeObjectURL(url);
}
