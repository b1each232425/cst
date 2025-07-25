/**
 * 统计学生在各动态分数段的人数
 * @param {number} maxScore - 试卷的最大分数（如 100）
 * @param {Array<Object>} students - 学生数组，每个对象需包含 score 字段
 * @returns {Object} 返回 { labels: [], counts: [] }
 */
export function countScoreRanges(maxScore, students) {
  if (!Array.isArray(students)) {
    console.error('students must be an array')
    throw new Error('students must be an array');
  }

  if (!students.every(student => typeof student.score === 'number')) {
    console.error('students must contain score field')
    throw new Error('students must contain score field');
  }

  if (maxScore <= 0) {
    console.error('maxScore must be a positive number')
    throw new Error('maxScore must be a positive number');
  }

  // console.log(students)

  // 1. 定义分数段百分比范围（从60%开始，每10%一个区间，直到100%）
  const percentageRanges = [
    // { minPercent: 0.0, maxPercent: 0.3 },
    // { minPercent: 0.3, maxPercent: 0.6 },
    // { minPercent: 0.6, maxPercent: 0.7 },
    // { minPercent: 0.7, maxPercent: 0.8 },
    // { minPercent: 0.8, maxPercent: 0.9 },
    //
    { minPercent: 0.9, maxPercent: 1.0 },
    { minPercent: 0.8, maxPercent: 0.9 },
    { minPercent: 0.7, maxPercent: 0.8 },
    { minPercent: 0.6, maxPercent: 0.7 },
    { minPercent: 0.3, maxPercent: 0.6 },
    { minPercent: 0.0, maxPercent: 0.3 },
  ]

  // 2. 计算每个分数段的上下界（四舍五入）
  const scoreRanges = percentageRanges.map(range => {
    const min = Math.round(maxScore * range.minPercent);
    const max = Math.round(maxScore * range.maxPercent);
    return {
      min,
      max,
      label: `${min}~${max === maxScore ? max : max - 1}分` // 分数段描述，如 "60~69分"
    }
  })

  // 3. 初始化统计对象
  const scoreCount = {};
  scoreRanges.forEach(range => {
    scoreCount[range.label] = 0
  })

  // 4. 遍历学生数组，统计各分数段人数
  students.forEach(student => {
    const score = student.score
    for (const range of scoreRanges) {
      if (score >= range.min && score < range.max) {
        scoreCount[range.label]++
        break // 找到对应分数段后跳出循环
      }
    }
  })

  // 5. 提取 labels 和 counts 两个数组
  const labels = scoreRanges.map(range => range.label)
  const counts = scoreRanges.map(range => scoreCount[range.label])

  // 6. 返回结果
  return { labels, counts }
}