/*
 * @Author: OuYang Haobin 1242968386@qq.com
 * @Date: 2025-06-04 14:24:46
 * @LastEditors: OuYang Haobin 1242968386@qq.com
 * @LastEditTime: 2025-06-18 13:33:27
 * @FilePath: /tutorial-platform-fe/src/routes/teacher/practiceManagement/utils.js
 * @Description: 这是默认设置,请设置`customMade`, 打开koroFileHeader查看配置 进行设置: https://github.com/OBKoro1/koro1FileHeader/wiki/%E9%85%8D%E7%BD%AE
 */
import ExcelJS from 'exceljs';
export async function exportToExcel(data) {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Sheet1');

    // 添加表头
    worksheet.columns = [
        { header: '学生ID', key: 'id', width: 10 },
        { header: '姓名', key: 'name', width: 20 },
        { header: '手机号', key: 'phone_number', width: 15 },
        { header: '身份证号', key: 'id_card', width: 20 },
        { header: '账号', key: 'account', width: 20 },
        { header: '密码', key: 'password', width: 20 },
    ];

    // 添加数据行
    data.forEach(item => {
        // 确保数据字段与 Golang 结构体字段匹配
        worksheet.addRow({
            id: item.id,
            name: item.official_name,
            phone_number: item.phone,
            id_card: item.id_card_no,
            account: item.account,
            password: item.password
        });
    });

    // 生成二进制数据
    const buffer = await workbook.xlsx.writeBuffer();

    // 创建下载链接
    const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    const url = URL.createObjectURL(blob);

    const link = document.createElement('a');
    link.href = url;
    link.download = '学生名单.xlsx';
    link.click();

    URL.revokeObjectURL(url);
}