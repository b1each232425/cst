// 获取试卷列表
export function fetchPaperList(
    paperName = "", 
    paperTags = "", 
    paperPage = 1, 
    paperPageSize = 10, 
    paperCategory = ""
){
    const params = new URLSearchParams();

    if (paperName) params.append("name", paperName);
    if (paperTags) params.append("tags", paperTags);
    params.append("page", paperPage);
    params.append("pageSize", paperPageSize);
    if (paperCategory) params.append("category", paperCategory);

    return fetch(`/api/paper?${params.toString()}`, {
        method: "GET",
        credentials: "include"
    })
        .then(response => {
            if (!response.ok) {
                throw new Error(`请求失败，状态码：${response.status}`);
            }
            return response.json();
        })
        .then(data => {
            return data;
        })
        .catch(error => {
            console.error('获取试卷列表出错：', error);
            return null;
        });
}

// 获取题库列表
export function fetchQuestionBankList(
    bankKeyWord = "", 
    bankPage = "",
    bankPageSize = "",
    bankBankID = ""
){
    const params = new URLSearchParams();

    if (bankKeyWord) params.append("keyword", bankKeyWord);
    if (bankPage) params.append("page", bankPage);
    if (bankPageSize) params.append("pageSize", bankPageSize);
    if (bankBankID) params.append("bankID", bankBankID);

    return fetch(`/api/question-banks?${params.toString()}`, {
        method: "GET",
        credentials: "include"
    })
        .then(response => {
            if (!response.ok) {
                throw new Error(`请求失败，状态码：${response.status}`);
            }
            return response.json();
        })
        .then(data => {
            return data;
        })
        .catch(error => {
            console.error('获取题库列表出错：', error);
            return null;
        });
}

// 获取题库题目
export function fetchBankQuestionList(
    bankID = "", 
    page = 1,
    pageSize = 10,
    name = "",
    tags = "",
    type = "",
    diffculty = ""
){
    const params = new URLSearchParams();

    params.append("bankID", bankID);
    params.append("page", page);
    params.append("pageSize", pageSize);
    if (name) params.append("name", name);
    if (tags) params.append("tags", tags);
    if (type) params.append("type", type);
    if (diffculty) params.append("diffculty", diffculty);

    return fetch(`/api/questions?${params.toString()}`, {
        method: "GET",
        credentials: "include"
    })
        .then(response => {
            if (!response.ok) {
                throw new Error(`请求失败，状态码：${response.status}`);
            }
            return response.json();
        })
        .then(data => {
            return data;
        })
        .catch(error => {
            console.error('获取题库题目列表出错：', error);
            return null;
        });
}

// 自定义组卷
export function createEmptyPaper() {

    const headers = {
        "Content-Type": "application/json"
    };

    // 发起 POST 请求
    return fetch(`/api/paper/manual`, {
        method: "POST",
        headers: headers,
        credentials: "include"
    })
        .then(response => {
            if (!response.ok) {
                throw new Error(`请求失败，状态码：${response.status}`);
            }
            return response.json();
        })
        .then(data => {
            return data;
        })
        .catch(error => {
            console.error('自定义组卷出错：', error);
            return null;
        });
}

// 获取试卷详情
export function fetchPaper(
    paperID = 0
){
    const params = new URLSearchParams();

    params.append("paper_id", paperID);

    return fetch(`/api/paper/manual?${params.toString()}`, {
        method: "GET",
        credentials: "include"
    })
        .then(response => {
            if (!response.ok) {
                throw new Error(`请求失败，状态码：${response.status}`);
            }
            return response.json();
        })
        .then(data => {
            return data;
        })
        .catch(error => {
            console.error('获取试卷详情出错：', error);
            return null;
        });
}