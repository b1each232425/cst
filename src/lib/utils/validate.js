
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
  const reg =
    /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
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



