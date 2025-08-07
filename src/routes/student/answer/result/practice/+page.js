import { sget } from '$lib/utils/index.js';

export async function load({fetch , url}){
    // 造假数据
    const exam_paper = [
        {
            id: 1,
            group_id: 1,
            group_name: "单选题",
            type: "02",
            content: "1. ECMAScript 规范主要描述了哪种语言？",
            options: ["Java", "JavaScript", "Python", "C++"],
            answers: { answer: ["JavaScript"] },
            student_answers: { answer: ["JavaScript"] },
            analysis: "ECMAScript 是 JavaScript 的标准规范。",
            student_score: 2,
            score: 2,
            status: "00"
        },
        {
            id: 2,
            group_id: 1,
            group_name: "单选题",
            type: "02",
            content: "2. JavaScript 中用于声明常量的关键字是？",
            options: ["var", "let", "const", "static"],
            answers: { answer: ["const"] },
            student_answers: { answer: ["let"] },
            analysis: "const 用于声明常量。",
            student_score: 0,
            score: 2,
            status: "04"
        },
        {
            id: 3,
            group_id: 2,
            group_name: "判断题",
            type: "04",
            content: "3. JavaScript 可以直接操作 DOM。",
            options: ["正确", "错误"],
            answers: { answer: ["正确"] },
            student_answers: { answer: ["正确"] },
            analysis: "JavaScript 可以直接操作 DOM。",
            student_score: 2,
            score: 2,
            status: "00"
        }
    ];

    const examInfo = {
        answerNum: 3,
        paperName: "JavaScript 练习题",
        questionNum: 3,
        studentScore: 4,
        totalScore: 6,
        answerTime: 10,
        suggestTime: 15
    };

    return {
        exam_paper,
        examInfo
    };


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