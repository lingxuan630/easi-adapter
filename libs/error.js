/**
 * [Error 一些基本提示]
 */

/**
 * [HTTPError 用于http格式的错误提示]
 * @param {string} message    [错误提示]
 * @param {number} statusCode [返回码]
 */
function HTTPError(message, statusCode) {
   this.message = message || "默认信息";
   this.statusCode = statusCode;
   this.type = 'HTTPError';
}
HTTPError.prototype = new Error();
HTTPError.prototype.constructor = HTTPError;

module.exports = {
	'HTTPError': HTTPError
};
