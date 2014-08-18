require('Bridge');
require('Application');
process.bridge.objc.import('Foundation');
$ = process.bridge.objc;



var appSchema = $.NSURLProtocol.extend('URLAppSchema');
var successInit = false, successCanonical = false, successStart = false;
appSchema.addClassMethod('canInitWithRequest:', 'B@:@', function(self, cmd, theRequest) {
	console.log('init');
    return $.NO;
});
appSchema.addClassMethod('canonicalRequestForRequest:', '@@:@', function(self, cmd, request) {
	console.log('init2');
	successCanonical = true;
    return request;
});

// on the classes instance
appSchema.addMethod('startLoading','v@:', function(self, cmd) {
	console.log('init3');
	successStart = true;
});

appSchema.addMethod('stopLoading','v@:', function(self, cmd) {
	console.log('init4');
});

appSchema.register();
$.NSURLProtocol('registerClass',$.URLAppSchema('class'));


setTimeout(function() { 
	console.log('here1');
	var url = $.NSURL('URLWithString',$("http://www.xmission.com"));
	console.log('here2');
	var request = $.NSURLRequest('requestWithURL',url);
	console.log('here3');
	var data = $.NSURLConnection('sendSynchronousRequest',request,'returningResponse', null, 'error', null);
	console.log('here4');
	console.log(data);
},2000);
