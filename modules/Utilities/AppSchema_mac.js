module.exports = (function() {
    if($.URLAppSchema) return;

    var appSchema = $.NSURLProtocol.extend('URLAppSchema');

    // class
    appSchema.addClassMethod('canInitWithRequest:', 'c@:@', function(self, cmd, theRequest) {
        //if (theRequest('URL')('scheme')('caseInsensitiveCompare',$('app')) == $.NSOrderedSame)
        //    return $.YES;
        //else
            //console.log('canInitWithRequest:');
            return $.NO;
    });
    appSchema.addClassMethod('canonicalRequestForRequest:', '@@:@', function(self, cmd, request) {
        //console.log('canonicalRequestForRequest:')
        return request;
    });

    // instance
    appSchema.addInstanceMethod('startLoading','v@:', function(self, cmd) {
        //console.log('startLoading:');
    });

    appSchema.addInstanceMethod('stopLoading','v@:', function(self, cmd) {
        //console.log('stopLoading:');
    });
    //console.log('loaded.');
    // globally registers URLAppSchema;
    appSchema.register();

})();