/**
 * http adapter
 * 通过调用http服务实现数据调用
 * 核心入口：HttpServiceCaller
 */

'use strict';

var Request = require('request');
var _ = require('lodash');
var JJV  = require('jjv');
var Q = require('q');
var APIs = require(APP_PATH + '/apis/index');
var config = require(APP_PATH + '/config');
var Utils = require(APP_PATH + '/helpers/utils');
var Crypt = require(APP_PATH + '/helpers/crypt');

/**
 * [HttpServiceCaller description]
 * @param {string} actionName [调用的名称]
 * @param {params} params     [参数]
 * @param {options} schema    [其他设置]
 */
var HttpServiceCaller = function(actionName, params, schema, cusOptions, session){
	var deferred = Q.defer();
	var api;
	var ts = (new Date()).getTime();
	if(_.has(APIs, actionName)){
		api = APIs[actionName];	
		// 判断是否有格式化工具
		api.parse = api.parse ? api.parse : function(resp){ return resp };
		// auth  default: true
		api.auth = !_.isUndefined(api.auth) ? api.auth : true;
		// alwaysCorrect default: false
		api.alwaysCorrect = !_.isUndefined(api.alwaysCorrect) ? api.alwaysCorrect : false;
		// 是否需要更新session
		api.sessionUpdate = !_.isUndefined(api.sessionUpdate) ? api.sessionUpdate : function(resp, session){};
		// 是否有自定义头部
		api.cusHeaders 	  = !_.isUndefined(api.cusHeaders) 	  ? api.cusHeaders	  : {};

		api.jsonBody	  = !_.isUndefined(api.jsonBody)	  ? api.jsonBody 	  : {};
	}else{
		throw new Error('api ' + actionName + ' is not exist');
	}

	var headers = {
		"Content-Type" : 'application/x-www-form-urlencoded'
	}

	//允许自定义请求头部
	if(!_.isUndefined(api.cusHeaders)){

		headers = _.extend(headers, api.cusHeaders);
	}	

	if(!_.isUndefined(params.clientIP)){

		headers['x-forwarded-for'] = params.clientIP;
	}

	if(api.auth === true){
		if(!_.isEmpty(session.userData)){
			headers.accessToken = session.userData.token;
			// 主要是为了兼容一些奇奇怪怪的接口居然需要传userId
			params.userId = session.userData.uid;
			params.uid = session.userData.uid;
			params.accessToken = session.userData.token;
		}
	}

	// 为了兼容验证token的接口
	// 但是这种写法是不安全的
	if(!_.isUndefined(params.accessToken)){
		headers['accessToken'] = params.accessToken;
	}

	// config url
	console.log('UUUUUUUUUUUUUUUUUUUUUUUUUUUUUUUUUUUUUUUUUUUUUUUUU');
	console.log(api.url);
	console.log('UUUUUUUUUUUUUUUUUUUUUUUUUUUUUUUUUUUUUUUUUUUUUUUUU');

	console.log('PPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPP');
	console.log(params);
	console.log('PPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPP');

	var realUrl;
	if(api.url.indexOf('http://') === -1){
		realUrl = config.get('serverUrl') + Utils.parseRestUrl(api.url, params)
	}else{
		realUrl = api.url;
	}

	var options = {
		method: api.method,
		uri: realUrl,
		headers: headers,
		json: true
	}
	if(cusOptions){
		options = _.extend(options, cusOptions);
	}

	if(!_.isEmpty(params)){
		if(api.method === 'GET'){
			options.qs = params;
		}

		if(api.method === 'POST' || api.method === 'PUT'){
			options.form = params;
		}		
		if(api.jsonBody === true){
			options.form = undefined;			
			options.body = params;
		}
	}

	console.log('#################################################################');
	console.log(options);
	Request(options, function(error, response, body){		

		console.log('---------------------------error---------------------------');
		console.log(error);
		console.log('---------------------------body----------------------------');
		console.log(body);
		console.log('#################################################################');

		if(error || response.statusCode > 200){			
			//if alwaysCorrect , return resp

			if(api.alwaysCorrect === true){

				api.sessionUpdate(respData, session);
				deferred.resolve({ message: response.data, statusCode: response.statusCode });
				return false;
			}

			var errorMessage = error ? error : response.body;
			deferred.reject(errorMessage);
			return false;
		}

		if(_.has(body, 'statusCode') && Number(body.statusCode) >= 400 ){

			//if alwaysCorrect , return resp
			if(api.alwaysCorrect === true){

				api.sessionUpdate(respData, session);
				deferred.resolve({ message: body });
				return false;
			}

			deferred.reject(body);
		}else{
			var respBody = body.data ? body.data : body;
			var respData = api.parse(respBody, body, session.userData);
			var validateResult = validateResp(respData, schema);
			if(validateResult.status === 'success'){

				api.sessionUpdate(respData, session);
				deferred.resolve(validateResult.resp, response);
			}else{
				deferred.reject(validateResult.errors);
			}
		}
		
	});
	return deferred.promise; 
}

// 校验返回数据的格式是否正确
function validateResp(resp, schema){
	if(_.isEmpty(schema)){
		return {status: 'success', resp: resp};
	}
	var validator = new JJV();
	var options = {
		removeAdditional: false
	};
	if(schema.removeAdditional && schema.removeAdditional === true){
		options.removeAdditional = true;
	}
	var errors = validator.validate(schema, resp, options);
	if(!errors){
		return {status: 'success', resp: resp};
	}else{
		return {status: 'fail', errors: '[validate][fail]validate response Fail, for: ' + JSON.stringify(errors)};
	}
}

module.exports = HttpServiceCaller;