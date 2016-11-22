/**
 * main entry
 * 构造基本的Action
 * 实现Nodejs与Java的数据通信
 * 通过Adapter实现reducer的功能
 */
var ClassBase = require('./libs/class');
var _ = require('lodash');
var JJV  = require('jjv');
var HttpServiceCaller = require('/.adapters/http');

var Action = ClassBase.extend({
	options: {
		actions: {},
		defaultAdapter: 'http',
		// 调用http
		http: {},
	},
	initialize: function(options){
		
	},
	// 设置全局使用的actions
	useActions: function(actions){
		this.options.actions = actions;
		return this;
	},
	dispatch: function(actionName, params, options){
		var action;
		if(_.has(this.actions, actionName)){
			action = this.actions[actionName] ? this.actions[actionName] : {};
		}else{
			throw new Error('actionName: ' + actionName + ' is not exist!');
		}

		var paramsFiltered = this.validateParams(action.params, params);

		return HttpServiceCaller(actionName, paramsFiltered, action.schema, options, this.req.session);
	},
	validateParams: function(schema, params){
		if(_.isEmpty(schema)){
			return params;
		}

		var validator = new JJV();
		var errors = validator.validate(schema, params);
		if(!errors){
			return params;
		}else{
			console.log('[validate][fail]validate params Fail, for: ' + JSON.stringify(errors));
		}
	}

});

module.exports = Action;