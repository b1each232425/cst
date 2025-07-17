/**
  * @description 上传处理器
  * @param {File} file 上传的文件对象
  * @param {string} uploadFormName 上传文件在 form-data 中对应的 key（比如 "file"）
  * @returns 上传结果（Promise）
  */
export async function customUploadHandler(file, uploadFormName) {
    const formData = new FormData();

    // 1. 添加文件字段
    formData.append("file", file);

    // 2. 添加文本字段（固定为 file_dir）
    formData.append("file_dir", "/mytest");

    // 3. 发起 POST 请求
    const res = await fetch("/api/uploadFiles", {
        method: "POST",
        body: formData,
    });

    // 错误处理（重复判断）
    if (!res.ok || res.status !== 200) {
        throw new Error(`上传失败，状态码 ${res.status}`);
    }

    // 4. 返回 JSON 结果
    let resp = await res.json();
    console.log(resp);
    let result = {
        errorCode: Number(resp.status),
        data: {
            src: resp.data[0],
            alt: "加载失败",
        },
    };
    console.log(result);
    return result;
};