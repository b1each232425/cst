
import { sget } from '$lib/utils/index.js';
 
 /**
   * @description 跳转到上下场次的考试的考试详情
   * @param {number}examineID
   * @param {number}paperID
   * @param {number}examSessionID
   */
export async function changeExamPaper(examineID,paperID,examSessionID){
      // 获取这个到达页面的参数
       try{
          // 这里就开始需要发送请求，去获取这个考试第一场次的信息
        const exam_details_res_json = await fetch(
            `/api/student/GetExamAnswerDetails?examSession_id=${examSessionID}&examinee_id=${examineID}&paper_id=${paperID}`,
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

        console.log(data)
        // 当次考试排行榜
        let rank = sget(data,"rank",[])
        // 获取当前考试的试卷:携带考生作答情况
        let paper = sget(data,"questions",[])

        // 获取考试中第一场次的信息
        let examInfo = sget(data,"examInfo",{})
        // 获取考试中所有场次信息
        let studentID = sget(data,"student_id",0)
        return {
            exam_paper:paper,
            rank:rank,
            examInfo:examInfo,
            studentID:studentID
        }
    }catch(e){
        console.error(e)
        return null
    }
  
}