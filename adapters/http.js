/**
 * http adapter
 * 通过调用http服务实现数据调用
 * 核心入口：HttpServiceCaller
 * By linson
 */

'use strict';
var ClassBase = require('../libs/class');
var Request = require('request');
var _ = require('lodash');
var JJV  = require('jjv');
var Q = require('q');

/**
 * [HttpServiceCaller description]
 * @param {string} actionName [调用的名称]
 * @param {params} params     [参数]
 * @param {options} schema    [其他设置]
 */
var HttpServiceCaller = ClassBase.extend({
	options: {
		apis: {},
		baseUrl: '',
		headers: {
			"Content-Type" : 'application/json'
		}
	},
	initialize: function(options){
		this.options = _.extend(this.options, options);
		return this;
	},
	request: function(actionName, params, options){
		var deferred = Q.defer();
		var ts = (new Date()).getTime();
		if(!_.has(this.options.apis, actionName)){
			setTimeout(function(){
				deferred.reject('api ' + actions + );
			}, 1);
			return deferred.promise;
		}

		return deferred.promise; 
	}
})

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