module.exports = (function() {
    var $ = process.bridge.objc;
    if($.URLAppSchema) return;

    var appSchema = $.NSURLProtocol.extend('URLAppSchema');

    // class
    appSchema.addClassMethod('canInitWithRequest:', 'c@:@', function(self, cmd, theRequest) {
        //if (theRequest('URL')('scheme')('caseInsensitiveCompare',$('app')) == $.NSOrderedSame)
        //    return $.YES;
        //else
            //console.log('canInitWithRequest:');
            
            //var url = theRequest('URL');
            //var scheme = url('scheme');
            //var path = url('path');
            //console.log(url);


        //console.log(process.cwd());
        return $.NO;
    });
    appSchema.addClassMethod('canonicalRequestForRequest:', '@@:@', function(self, cmd, request) {
        //console.log('canonicalRequestForRequest:')
        return request;
    });

    // instance
    appSchema.addMethod('startLoading','v@:', function(self, cmd) {
        //console.log('startLoading:');
    });

    appSchema.addMethod('stopLoading','v@:', function(self, cmd) {
        //console.log('stopLoading:');
    });
    //console.log('loaded.');
    // globally registers URLAppSchema;
    appSchema.register();
    $.NSURLProtocol('registerClass',$.URLAppSchema('class'));
})();