/*
 * @Author: OuYang Haobin 1242968386@qq.com
 * @Date: 2025-05-27 00:16:59
 * @LastEditors: OuYang Haobin 1242968386@qq.com
 * @LastEditTime: 2025-05-27 00:52:34
 * @FilePath: /tutorial-platform-fe/src/lib/component/QuestionAnswer/utils.js
 * @Description: 一些通用的函数
 */

export class Answer {
  /**
   * @type {number}
   * @description 题目id
   * */
  question_id = -1;

  /**
   * @type {string[]}
   * @description 答案
   * */
  answer = [];

  /**
   * @type {string}
   * @description 答案类型
   */
  type = "";

}

/**
 * 获取答案附件路径
 * @param {Answer} stu_answer
 */
export function getAnswerFilesPath(stu_answer) {
  let htmlString = "";
  let type = stu_answer.type;
  //只有简答题和填空题需要查看附件路径的上传
  if (type === "00" || type === "02" || type === "04") {
    return [];
  }
  //获取html str
  for (let i = 0; i < stu_answer.answer.length; i++) {
    htmlString += stu_answer.answer[i];
  }

  const parser = new DOMParser();
  const doc = parser.parseFromString(htmlString, "text/html");

  /** @type {string[]} */
  const result = [];

  /**
   * 标准化路径格式并移除 origin
   * @param {string} url
   */
  const normalizePath = (url) => {
    try {
      const normalized = url.replace(/\\/g, "/").replace(/^\/+/, "/");

      const { pathname, search, hash } = new URL(
        normalized,
        window.location.origin
      );
      return pathname + search + hash;
    } catch {
      return url.replace(/\\/g, "/");
    }
  };

  // 处理图片和媒体资源
  doc.querySelectorAll("img, source").forEach((el) => {
    const value = el.getAttribute("src");
    if (value && !value.startsWith("data:")) {
      result.push(normalizePath(value));
    }
  });

  // 处理附件链接
  doc.querySelectorAll("a.piptap-attachment").forEach((a) => {
    const value = a.getAttribute("href");
    if (value && !value.startsWith("data:")) {
      result.push(normalizePath(value));
    }
  });

  return [...new Set(result)];
}
