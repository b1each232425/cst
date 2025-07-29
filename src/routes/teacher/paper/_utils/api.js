// 获取试卷列表
export function getPaperList(
    paperName = "", 
    paperTags = "", 
    paperPage = 1, 
    paperPageSize = 10, 
    paperCategory = ""
) {
    const params = new URLSearchParams();

    if (paperName) params.append("name", paperName);
    if (paperTags) params.append("tags", paperTags);
    params.append("page", paperPage);
    params.append("pageSize", paperPageSize);
    if (paperCategory) params.append("category", paperCategory);

    return fetch(`/api/paper?${params.toString()}`, {
        method: "GET",
    })
        .then(response => {
            if (!response.ok) {
                throw new Error(`请求失败，状态码：${response.status}`);
            }
            return response.json();
        })
        .then(data => {
            console.log('试卷列表：', data);
            return data;
        })
        .catch(error => {
            console.error('获取试卷列表出错：', error);
            return null;
        });
}
