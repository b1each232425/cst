 /*
 * @Author: 李乐毅 
 * @Date: 2025-07-27 16:36:22 
 * @Last Modified by:   李乐毅 
 * @Last Modified time: 2025-07-27 16:36:22 
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

export async function pageQueryHandle(total,pageSize){
      // 计算总页数
   return    total/ pageSize
            ? Math.ceil(total/ pageSize)
            : 1;

}