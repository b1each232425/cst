import { writable } from "svelte/store";

//用于预览的时候，把数据存放到此处预览
export const preview_exam_questions = writable([
  {
    id: 7,
    type: "04",
    group_name: "三、判断题题（9分）",
    content: `<p>According to the attachment ,select the correct answer.</p><p> <a target="_blank" rel="noopener noreferrer nofollow" href="" download="attachment.docx">attachment.docx</a> </p>`,
    options: [
      { label: "A", value: "<p>Software is computer programs.</p>" },
      {
        label: "B",
        value: `<p>Software is a collection of computer data and instructions 
organized in a specific order.</p>`,
      },
    ],
  },
  {
    id: 8,
    type: "06",
    group_name: "四. Web Services And SOAP（20分）",
    content: "<p>请简述 WSDL 的作用及其与 UDDI 的关系。（10分）</p>",
    answer_num: 2,
  },
]);
