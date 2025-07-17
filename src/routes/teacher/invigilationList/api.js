/*
 * @Author: MIOZD && l317101@163.com
 * @Date: 2025-05-29 19:19:45
 * @LastEditors: Zpekii 3156752796@qq.com
 * @LastEditTime: 2025-07-07 18:47:14
 * @FilePath: \exam-fe\src\routes\teacher\invigilationList\api.js
 * @Description: 
 */
/**
 * @description 获取监考列表
 * @param {number} current_page - 当前页码
 * @param {number} page_size - 每页条数
 * @param {{
 * exam_room_name?: string
 * exam_session_name?: string
 * start_time?: number
 * end_time?: number
 * exam_status?: string
 * }} curr_filter - 当前筛选条件
 */
export async function getInvigilationList(current_page = 1, page_size = 10, curr_filter = {}) {
    let query_param = new URLSearchParams();
    query_param.append("page", current_page.toString());
    query_param.append("pageSize", page_size.toString());

    if (curr_filter) {
        if (curr_filter.exam_session_name) {
            query_param.append("examSessionName", curr_filter.exam_session_name);
        }
        if (curr_filter.start_time) {
            query_param.append("startTime", curr_filter.start_time.toString());
        }
        if (curr_filter.end_time) {
            query_param.append("endTime", curr_filter.end_time.toString());
        }
        if (curr_filter.exam_status) {
            query_param.append("examStatus", curr_filter.exam_status);
        }
    }

    try {
        const response = await fetch(`/api/teacher/invigilation-list/by-invigilator?${query_param.toString()}`, {
            method: "GET",
            credentials: "include",
        })

        if (!response.ok) {
            return {
                status: 1,
                msg: await response.text() || "获取监考场次信息失败"
            };
        }

        return await response.json()
    } catch (
    /**
     * @type {any}
     */
    err
    ) {
        if ("msg" in err) {
            return {
                status: 1,
                msg: err.msg
            }
        } else if ("message" in err) {
            return {
                status: 1,
                msg: err.message
            }
        } else {
            return {
                status: 1,
                msg: err
            }
        }
    }
}


/**
 * @description 获取监考场次信息
 * @param {number} current_page - 当前页码
 * @param {number} page_size - 每页条数
 * @param {string} exam_session_id - 监考场次ID
 * @param {number} exam_room_id - 监考教室ID
 */
export async function getInvigilationInfo(current_page = 1, page_size = 10, exam_session_id, exam_room_id, search_text = "") {
    let query_param = new URLSearchParams();
    query_param.append("page", current_page?.toString());
    query_param.append("pageSize", page_size?.toString());
    query_param.append("examSessionID", exam_session_id);
    query_param.append("examRoomID", exam_room_id?.toString() ?? "-1");
    if (search_text) {
        query_param.append("candidateID", search_text);
        query_param.append("examineeIdentityID", search_text);
        query_param.append("examineeName", search_text);
    }

    try {
        const response = await fetch(`/api/teacher/invigilation-info?${query_param.toString()}`, {
            method: "GET",
            credentials: "include",
        })

        if (!response.ok) {
            return {
                status: 1,
                msg: await response.text() || "获取监考场次信息失败"
            };
        }

        return await response.json()
    } catch (
    /**
     * @type {any}
     */
    err
    ) {
        if ("msg" in err) {
            return {
                status: 1,
                msg: err.msg
            }
        } else if ("message" in err) {
            return {
                status: 1,
                msg: err.message
            }
        } else {
            return {
                status: 1,
                msg: err
            }
        }
    }
}

/**
 * @description 更新某场次信息
 * @param {number} exam_session_id - 考试场次ID
 * @param {number} exam_room_id - 考场ID
 * @param {string} record - 记录
 * @param {string} basic_eval - 基础评价
 */
export async function updateInvigilationInfo(exam_session_id, exam_room_id, record, basic_eval) {

    try {
        const response = await fetch(`/api/teacher/invigilation-record`, {
            method: "PATCH",
            credentials: "include",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                exam_session_id,
                exam_room_id,
                record,
                basic_eval
            })
        })

        if (!response.ok) {
            return {
                status: 1,
                msg: await response.text() || "获取监考场次信息失败"
            };
        }

        return await response.json()
    } catch (
    /**
     * @type {any}
     */
    err
    ) {
        if ("msg" in err) {
            return {
                status: 1,
                msg: err.msg
            }
        } else if ("message" in err) {
            return {
                status: 1,
                msg: err.message
            }
        } else {
            return {
                status: 1,
                msg: err
            }
        }
    }
}


/**
 * @description 更新单/多个考生信息
 * @param {number[]} examinee_id - 考生ID
 * @param {string} status - 考生状态
 * @param {string} remark - 备注信息
 * @param {string} [extra_time] - 延长时间, 格式为 "HH:mm:ss"
 */
export async function updateExamineeInfo(examinee_id, status, remark, extra_time) {
    
    let fetchData = {};

    if(status != "" && status != null){
        fetchData["status"] = status
    }

    if(remark != ""&& remark != null){
        fetchData["remark"] = remark
    }

    if(!examinee_id || examinee_id.length == 0 || examinee_id == null){
        console.error("examineeID must be positive")
        return 
    }

    if(extra_time != null && extra_time != undefined){
        fetchData["extra_time"] = extra_time
    }

    fetchData["examinee_id"] = examinee_id

    console.log(fetchData)

    try {
        const response = await fetch(`/api/teacher/invigilation-examinee`, {
            method: "PATCH",
            credentials: "include",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(fetchData)
        })

        if (!response.ok) {
            return {
                status: 1,
                msg: await response.text() || "获取监考场次信息失败"
            };
        }

        return await response.json()
    } catch (
    /**
     * @type {any}
     */
    err
    ) {
        if ("msg" in err) {
            return {
                status: 1,
                msg: err.msg
            }
        } else if ("message" in err) {
            return {
                status: 1,
                msg: err.message
            }
        } else {
            return {
                status: 1,
                msg: err
            }
        }
    }
}

/**
 * @description 恢复考生作答状态，重新允许考生进入考试
 * @param {number} exam_id - 考试ID
 * @param {number} examinee_id - 考生ID
 * @param {number} student_id - 学生ID
 */
export async function recoverExaminee(exam_id, examinee_id, student_id) {

    if (!exam_id) {
        throw new Error("exam_id is required");
    }

    if (!examinee_id) {
        throw new Error("examinee_id is required");
    }

    if (!student_id) {
        throw new Error("student_id is required");
    }

    if (typeof exam_id != "number") {
        exam_id = parseInt(exam_id);
        if (isNaN(exam_id)) {
            throw new Error("exam_id must be a number");
        }
    }

    if (typeof examinee_id != "number") {
        examinee_id = parseInt(examinee_id);
        if (isNaN(examinee_id)) {
            throw new Error("examinee_id must be a number");
        }
    }

    if (typeof student_id != "number") {
        student_id = parseInt(student_id);
        if (isNaN(student_id)) {
            throw new Error("student_id must be a number");
        }
    }

    let req_url = `/api/student/exam/enter`

    let resp = await fetch(req_url, {
        method: "POST",
        credentials: "include",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({
            data: {
                exam_id: exam_id,
                examinee_id: examinee_id,
                student_id: student_id
            }
        })
    })

    if (!resp.ok) {
        throw new Error(`${resp.statusText}`);
    }

    let respData = await resp.json();

    if (respData.status != 0) {
        throw new Error(`${respData.msg}`);
    }

    return

}

/**
 * @description 获取监考场次的证明图片
 * @param {string} exam_session_id 考试场次ID
 * @param {string} exam_room_id  考场ID
 * @return {Promise<string[]>}
 */
export async function getProofImg(exam_session_id, exam_room_id){

    /**
     * @description 证明图片URL列表
     * @type {Array<string>}
     */
    let result = []

    let reqUrl = `/api/files/invigilation/${exam_session_id}/${exam_room_id}`

    let response = await fetch(reqUrl, {
        method: "GET",
        credentials: "include"
    })

    if (!response.ok) {
        throw new Error(`${response.statusText}`);
    }

    let respData = null;

    try{
        respData = await response.text();
    }catch(e){
        throw new Error(`${e}`);
    }

    let a_tag_regex = /<a[^>]*href="([^"]+)"[^>]*>/gi;

    respData = respData.match(a_tag_regex);

    respData?.forEach(a_tag => {
        let url_match = a_tag.match(/href="([^"]+)"/);
        if (url_match && url_match[1]) {
            result.push(`/api/files/invigilation/${exam_session_id}/${exam_room_id}/${url_match[1]}`);
        }
    });

    return result

}

/**
 * 上传监考证明图片
 * @param {string} exam_session_id 
 * @param {string} exam_room_id 
 * @param {File[]} file 
 * @return {Promise<string[]>} url_path 返回上传的图片URL路径数组
 */
export async function uploadProofImg(exam_session_id, exam_room_id, ...file) {

    /**
     * @description 上传的图片URL路径数组
     * @type {Array<string>}
     */
    let result = [];

    let url_path = `/api/uploadFiles`

    let form_data = new FormData();

    file.forEach(f => {
        form_data.append("file", f);
    });

    form_data.append("file_dir", `invigilation/${exam_session_id}/${exam_room_id}`);

    let response = await fetch(url_path, {
        method: "POST",
        credentials: "include",
        body: form_data
    })

    if (!response.ok) {
        throw new Error(`${response.statusText}`);
    }

    let respData = await response.json();

    if (respData.status != "0") {
        throw new Error(`${respData.msg}`);
    }

    result = respData.data ?? [];

    return result;

}

/**
 * 
 * @param {string} exam_session_id 
 * @param {string} exam_room_id 
 * @param {string} file_name 
 */
export async function deleteProofImg(exam_session_id, exam_room_id, file_name) {

    let req_url = `/api/deleteFile`;

    let response = await fetch(req_url, {
        method: "POST",
        credentials: "include",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({
            file_name: `/invigilation/${exam_session_id}/${exam_room_id}/${file_name}`
        })
    });

    if (!response.ok) {
        throw new Error(`${response.statusText}`);
    }

    let respData = await response.json();

    if (respData.status != "0") {
        throw new Error(`${respData.msg}`);
    }

    return;
}