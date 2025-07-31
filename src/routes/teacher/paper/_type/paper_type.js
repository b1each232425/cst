/**
 * 单个题目的类型
 */
export class PaperQuestion {
    /** @type {number|string} 题目ID */
    id = -1;
    /** @type {number} 题库题目ID */
    bank_question_id = -1;
    /** @type {string} 题型编码，00/02/04/… */
    type = '';
    /** @type {string} 题干内容 */
    content = '';
    /** @type {Option[]} 选项或填空项 */
    options = [];
    /** @type {(string | {index:number,answer:string,alternative_answers?:string[],score:number,grading_rule:string})[]} 正确答案 */
    answers = [];
    /** @type {number} 分值 */
    score = 0;
    /** @type {Array<number>|null} 主观题小题分值 */
    sub_score = [];
    /** @type {number} 题目难度 */
    difficulty = 0;
    /** @type {string} 解析 */
    analysis = '';
    /** @type {string} 编程题题干 */
    title = '';
    /** @type {string} 答案附件路径 */
    answer_file_path = '';
    /** @type {string} 测试附件路径 */
    test_file_path = '';
    /** @type {string} 输入说明 */
    input = '';
    /** @type {string} 输出说明 */
    output = '';
    /** @type {Object} 示例 */
    example = {};
    /** @type {number} 序号 */
    order = 0;
    /** @type {string[]} 题目标签 */
    tags = [];
    /** @type {boolean} 是否展开 */
    expanded = true;
}