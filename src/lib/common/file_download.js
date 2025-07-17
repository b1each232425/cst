// @ts-nocheck

const MIME_TYPE = {
    'csv': 'text/csv',
    'json': 'application/json',
    'pdf': 'application/pdf',
    'png': 'image/png',
    'svg': 'image/svg+xml',
    'txt': 'text/plain',
    'xml': 'application/xml',
    'zip': 'application/zip',
    'xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
}

/**
 * 下载文件
 * @param {ArrayBuffer} buffer 必填，文件数据缓存
 * @param {string} fileName 必填，文件名，包含扩展名
 */
export function downloadFile(buffer, fileName){

    if(buffer == null){
        throw new Error('缺少文件数据缓存');
    }

    if(fileName == null){
        throw new Error('缺少文件名');
    }

    let fileExtension = fileName.split('.').pop();

    if(fileExtension == null){
        throw new Error('文件名中缺少扩展名');
    }

    let mimeType = MIME_TYPE[fileExtension];

    if(mimeType == null){
        throw new Error('不支持的文件类型');
    }

    let blob = new Blob([buffer], {type: mimeType});

    let url = window.URL.createObjectURL(blob);

    let a = document.createElement('a');

    a.id = 'download-link';

    a.href = url;

    a.download = fileName;

    a.click();

    window.URL.revokeObjectURL(url);

    a.remove();
}