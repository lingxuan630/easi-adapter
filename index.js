/**
 * main entry
 * 构造基本的Action
 * 实现Nodejs与Java的数据通信
 * 通过Adapter实现reducer的功能
 */

var _ = require('lodash');
var JJV = require('jjv');
var deepExtend = require('deep-extend');
var Q = require('q');

var ClassBase = require('./libs/class');
var HttpServiceCaller = require('./adapters/http');
var Errors = require('./libs/error');

var Action = ClassBase.extend({
  options: {
    actions: {},
    defaultAdapter: 'http',
    // 调用http所需要的配置
    http: {
      options: {},
      apis: {}
    }
  },
  initialize: function(options) {
    this.options = deepExtend(this.options, options);
    this.httpAdapter = new HttpServiceCaller(this.options.http.apis, this.options.http.options);
  },
  // 设置全局使用的actions
  useActions: function(actions) {
    this.options.actions = actions;
    return this;
  },
  dispatch: function(actionName, params, options) {
    var action;
    var vm = this;
    var deferred = Q.defer();
    if (_.has(this.options.actions, actionName)) {
      action = this.options.actions[actionName] ? this.options.actions[actionName] : {};
    } else {
      return Q.fcall(function(){
        throw new Error('actionName: ' + actionName + ' is not exist!');
      })
    }

    this.validateParams(action.params, params)
      .then(
        function(paramsFiltered) {
          vm.httpAdapter.request(actionName, paramsFiltered, options)
            .then(function(resp) {
            		deferred.resolve(resp);
              },
              function(error) {
              	deferred.reject(error);
              }
            )
        },
        function(error) {
        	deferred.reject(error);
        }
      );

    return deferred.promise;
  },
  validateParams: function(schema, params) {
    if (_.isEmpty(schema)) {
      return Q.when(params);
    }

    var validator = new JJV();
    return Q.when(function() {
      var errors = validator.validate(schema, params);
      if (!errors) {
        return params;
      } else {
        throw new Errors.HTTPError('[validate][fail]validate params Fail, for: ' + JSON.stringify(errors), 500);
      }
    })
  }

});

module.exports = Action;
