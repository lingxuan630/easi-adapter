/**
 * [Utils 一些公共函数]
 */
var _ = require('lodash');
var Utils = {
  parseRestUrl: function(url, data){
		var reg = /\/:(\w+)/gi;
		var routeParams = url.match(reg);
		if(_.isEmpty(data)){
			return url;
		}
		
		if (!_.isEmpty(routeParams)) {
			_.each(routeParams, function(routeParam, index) {
				var keyName = routeParam.replace('/:', '');
				if (data[keyName]) {
					url = url.replace(':' + keyName, data[keyName]);
				}
			})
		}
		return url;
	},
	isHttp: function(url){
		if(_.isEmpty(url)){
			return false;
		}
		return url.indexOf('http://') === -1 || url.indexOf('https://') === -1;
	}
}

module.exports = Utils;
