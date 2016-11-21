/**
 * main entry
 * 构造基本的Action
 * 实现Nodejs与Java的数据通信
 * 通过Adapter实现reducer的功能
 */
var ClassBase = require(APP_PATH + '/core/class');
var _ = require('lodash');
var JJV  = require('jjv');
var ServiceCaller = require(APP_PATH + '/adapters/service');
var allActions = require(APP_PATH + '/actions/index');
var Action = ClassBase.extend({
	req: {},
	actions: allActions,
	set: function(actions){
		this.actions = actions;
		return this;
	},
	setReq: function(req){
		// 添加req主要是为了加载auth token
		this.req = req;
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

		return ServiceCaller(actionName, paramsFiltered, action.schema, options, this.req.session);
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