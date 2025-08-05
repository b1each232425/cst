// 获取试卷列表
export function fetchPaperList(
    paperName = "", 
    paperTags = "", 
    paperPage = 1, 
    paperPageSize = 10, 
    paperCategory = ""
){
    const PARAMS = new URLSearchParams();

    if (paperName) PARAMS.append("name", paperName);
    if (paperTags) PARAMS.append("tags", paperTags);
    PARAMS.append("page", paperPage);
    PARAMS.append("pageSize", paperPageSize);
    if (paperCategory) PARAMS.append("category", paperCategory);

    return fetch(`/api/paper?${PARAMS.toString()}`, {
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
    const PARAMS = new URLSearchParams();

    if (bankKeyWord) PARAMS.append("keyword", bankKeyWord);
    if (bankPage) PARAMS.append("page", bankPage);
    if (bankPageSize) PARAMS.append("pageSize", bankPageSize);
    if (bankBankID) PARAMS.append("bankID", bankBankID);

    return fetch(`/api/question-banks?${PARAMS.toString()}`, {
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
    const PARAMS = new URLSearchParams();

    PARAMS.append("bankID", bankID);
    PARAMS.append("page", page);
    PARAMS.append("pageSize", pageSize);
    if (name) PARAMS.append("name", name);
    if (tags) PARAMS.append("tags", tags);
    if (type) PARAMS.append("type", type);
    if (diffculty) PARAMS.append("diffculty", diffculty);

    return fetch(`/api/questions?${PARAMS.toString()}`, {
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

    const HEADERS = {
        "Content-Type": "application/json"
    };

    // 发起 POST 请求
    return fetch(`/api/paper/manual`, {
        method: "POST",
        headers: HEADERS,
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
    const PARAMS = new URLSearchParams();

    PARAMS.append("paper_id", paperID);

    return fetch(`/api/paper/manual?${PARAMS.toString()}`, {
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

// 保存试卷
export function savePaper(
    paperID = 0,
    actionsArr = []
){
    const PARAMS = new URLSearchParams();

    PARAMS.append("paper_id", paperID);

    const DATA = {
        data: {
            actions: actionsArr
        }
    };

    const HEADERS = {
        "Content-Type": "application/json"
    };

    return fetch(`/api/paper/manual?${PARAMS.toString()}`, {
        headers: HEADERS,
        method: "PUT",
        credentials: "include",
        body: JSON.stringify(DATA)
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
            console.error('保存试卷出错：', error);
            return null;
        });
}

// 删除试卷
export function deletePaper(
    toDeletePapers = []
){

    const DATA = {
        data: toDeletePapers
    };

    const HEADERS = {
        "Content-Type": "application/json"
    };

    return fetch(`/api/paper`, {
        headers: HEADERS,
        method: "DELETE",
        credentials: "include",
        body: JSON.stringify(DATA)
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
            console.error('删除试卷出错：', error);
            return null;
        });
}