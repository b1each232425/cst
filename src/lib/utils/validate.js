/**
 * @description 判断是否为合法的手机号码
 * @param {string} mobile
 * @returns {Boolean}
 */
export function validMobile(mobile) {
  const reg = /^1[34578]\d{9}$/;
  return reg.test(mobile);
}

/**
 * @description 判断是否为合法的邮箱
 * @param {string} email
 * @returns {Boolean}
 */
export function validEmail(email) {
  const reg = /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
  return reg.test(email);
}

/**
 * @description 判断是否为合法的身份证号码
 * @param {string} str
 * @returns {Boolean}
 */
export function validIdCard(str) {
  const reg = /(^\d{15}$)|(^\d{18}$)|(^\d{17}(\d|X|x)$)/;
  return reg.test(str);
}

/**
 * @description 获取精确的数据类型
 * @param v 要获取类型的值
 * @returns {string} 类型名称
 */
export function getType(v) {
  return Object.prototype.toString.call(v).slice(8, -1).toLowerCase();
}

/**
 * @description 校验并赋值属性值
 * @param {string} name
 * @param {function} v
 * @param {function} s
 * @param {object} rule
 * @param {string} k
 */
export function validateAndAssign(name, v, s, rule, k) {
  const vl = v();
  let reason = '';
  if (!rule.type.includes(getType(vl))) {
    reason = `类型错误,期望类型为${rule.type.join('、')},实际类型为${getType(vl)}`;
  } else if (rule.check && !rule.check(vl)) {
    reason = rule.message ? rule.message : `不符合校验规则`;
  }
  if (reason) {
    console.warn(`[${name}] 属性 '${k}' 无效: ${reason}, 已使用默认值 '${rule.default}', 传入值为: '${vl}'`);
    s(rule.default);
  }
}
