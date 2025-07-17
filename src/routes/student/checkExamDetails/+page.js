/*
 * @Author: zdl <1311866870@qq.com>
 * @Date: 2025-06-14 10:55:34
 * @LastEditors: zdl 1311866870@qq.com
 * @LastEditTime: 2025-06-19 14:04:36
 * @FilePath: \tutorial-platform-fe\src\routes\student\checkExamDetails\+page.js
 * @Description: 
 */
import { sget } from '$lib/common/api_data.js';


export async function load({fetch , url}){
    // 获取这个到达页面的参数
    const examId = url.searchParams.get("examId");
    if (!examId){
        return {
            exam_paper:null
        }
    }
    try{
          // 这里就开始需要发送请求，去获取这个考试第一场次的信息
        const exam_details_res_json = await fetch(
            `/api/student/GetExamAnswerDetails?exam_id=${examId}`,
            { method: "GET", credentials: "include" }
        );
        const exam_details_res = await exam_details_res_json.json()

        
        const status = sget(exam_details_res,"status",-1);
        const msg = sget(exam_details_res,"msg","");
        if (status !== 0) {
            throw new Error(`Failed to fetch exam info,error msg:${msg}`);
        }
        // 然后开始获取这个数据
        const data = sget(exam_details_res,"data",{})
        // 当次考试排行榜
        let rank = sget(data,"rank",[])
        // 获取当前考试的试卷:携带考生作答情况
        let paper = sget(data,"questions",[])

        // 获取考试中第一场次的信息
        let examInfo = sget(data,"examInfo",{})
        // 获取考试中所有场次信息
        let examSessionInfo = sget(data,"examSessionInfo",[])
        let studentID = sget(data,"student_id",0)
        return {
            exam_paper:paper,
            rank:rank,
            examInfo:examInfo,
            examSessionInfo:examSessionInfo,
            studentID:studentID
        }
        
    }catch(e){
        console.error(e)
        return 
    }
}

