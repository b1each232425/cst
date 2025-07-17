/*
 * src/types.js
 * 集中定义项目中通用类型，带默认初始化，方便跨文件复用
 */

/**
 * 试卷题组类型定义
 */
export class QuestionGroup {
    /** @type {string|number} 题组ID，支持字符串或数字 */
    id = -1;
    /** @type {string} 题组名称 */
    name = '';
    /** @type {number} 题组题目数量 */
    question_count = 0;
    /** @type {number} 题组总分 */
    total_score = 0;
    /** @type {PaperQuestion[]} 题组包含的题目列表 */
    questions = [];
    /** @type {number} 每题基础分数 */
    score_per_question = 0;
    /** @type {boolean} 是否展开显示题组 */
    expanded = true;
}

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

/**
 * 单个选项类型
 */
export class Option {
    /** @type {string} 标签，例如 "A" */
    label = '';
    /** @type {string} 内容 */
    value = '';
}

/**
 * 试卷信息类型
 */
export class PaperInfo {
    /** @type {string|number} 试卷ID */
    id = -1;
    /** @type {string} 试卷名称 */
    name = '';
    /** @type {string} 用途编码 */
    category = '';
    /** @type {string} 难度编码 */
    level = '';
    /** @type {number} 时长（分钟） */
    duration = 0;
    /** @type {number} 总分 */
    total_score = 0;
    /** @type {string} 描述 */
    description = '';
    /** @type {number} 题目总数 */
    question_count = 0;
    /** @type {string[]} 标签列表 */
    tags = [];
    /** @type {string} 新增标签输入值 */
    add_tag_input = '';
}

/**
 * 试卷信息类型
 */
export class PaperInList {
    /** @type {number} 试卷ID */
    id = -1;
    /** @type {string} 试卷名称 */
    name = '';
    /** @type {string} 组卷方式 */
    assembly_type = '';
    /** @type {string} 用途编码 */
    category = '';
    /** @type {string} 难度编码 */
    level = '';
    /** @type {number} 时长（分钟） */
    duration = 0;
    /** @type {number} 总分 */
    total_score = 0;
    /** @type {number} 题目总数 */
    question_count = 0;
    /** @type {string[]} 标签列表 */
    tags = [];
    /** @type {string} 更新时间*/
    update_time = '';
    /** @type {string} 创建时间*/
    create_time = '';
    /** @type {boolean} 是否选中 */
    selected = false
    /** @type {boolean} 是否是创建者 */
    is_creator = false
    /**
     *  @type {number} 创建者
     */
    creator = -1;
    /** @type {string} 共享状态 */
    access_mode = '';
}
