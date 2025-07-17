import { sget } from '$lib/common/api_data.js';

export async function load({fetch , url}){
    // 获取这个到达页面的参数
    const practiceID = url.searchParams.get("practiceID");
    if (!practiceID){
        return {
            exam_paper:null
        }
    }
    try{
          // 这里就开始需要发送请求，去获取这个考试第一场次的信息
        const exam_details_res_json = await fetch(
            `/api/student/GetPracticeAnswerDetails?practiceID=${practiceID}`,
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
        console.log("获取到的数据为：",data)

        // 获取当前考试的试卷:携带考生作答情况
        let paper = sget(data,"questions",[])
        // 获取考试中第一场次的信息
        let examInfo = sget(data,"practiceInfo",{})
        return {
            exam_paper:paper,
            examInfo:examInfo,
        }
        
    }catch(e){
        console.error(e)
        return 
    }
}