/*
 * @Author: zdl <1311866870@qq.com>
 * @Date: 2025-06-14 10:55:34
 * @LastEditors: zdl 1311866870@qq.com
 * @LastEditTime: 2025-06-19 14:04:36
 * @FilePath: \tutorial-platform-fe\src\routes\student\checkExamDetails\+page.js
 * @Description: 
 */
import { sget } from '$lib/utils/index.js';


export async function load({fetch , url}){


    const exam_paper = [
        {
            id: 1,
            group_id: 1,
            group_name: "一、单选题",
            type: "02",
            content: "1. 下列哪个是 JavaScript 的关键字？",
            options: ["var", "int", "float", "char"],
            answers: { answer: ["var"] },
            student_answers: { answer: ["var"] },
            analysis: "JavaScript 使用 var 声明变量。",
            student_score: 2,
            score: 2,
            status: "00"
        },
        {
            id: 2,
            group_id: 1,
            group_name: "一、单选题",
            type: "02",
            content: "2. 下列哪个不是 JavaScript 的数据类型？",
            options: ["Number", "String", "Boolean", "Character"],
            answers: { answer: ["Character"] },
            student_answers: { answer: ["Boolean"] },
            analysis: "JavaScript 没有 Character 类型。",
            student_score: 0,
            score: 2,
            status: "04"
        },
        {
            id: 3,
            group_id: 2,
            group_name: "二、判断题",
            type: "04",
            content: "3. JavaScript 可以操作 DOM。",
            options: ["正确", "错误"],
            answers: { answer: ["正确"] },
            student_answers: { answer: ["正确"] },
            analysis: "JavaScript 可以操作 DOM。",
            student_score: 2,
            score: 2,
            status: "00"
        }
    ];

    const rank = [
        { official_name: "张三", total_score: 6, rank: 1, student_id: 1 },
        { official_name: "李四", total_score: 5, rank: 2, student_id: 2 },
        { official_name: "邹德伦", total_score: 4, rank: 3, student_id: 3 }
    ];

    const examInfo = {
        answerNum: 3,
        paperName: "JavaScript 基础测试卷",
        questionNum: 3,
        studentScore: 4,
        answerTime: 12
    };

    const examSessionInfo = [
        { ExamTime: 30, ExamineeID: 3, ID: 101, PaperID: 201, SessionNum: 1 },
        { ExamTime: 30, ExamineeID: 3, ID: 102, PaperID: 202, SessionNum: 2 }
    ];

    const studentID = 3;

    return {
        exam_paper,
        rank,
        examInfo,
        examSessionInfo,
        studentID
    };
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

