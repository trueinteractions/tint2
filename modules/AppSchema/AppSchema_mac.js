module.exports = function(basepath) {
    var $ = process.bridge.objc;
    var workingdir = process.cwd();
    if(workingdir[workingdir.length-1] != '/')
        workingdir += '/';
   
    global.requireNode = global.require;
    global.require = function() {
        var n = arguments[0];

        if(application.packaged) {
            // TODO: ...
        } else {
            if(n[0] == '/') n = n.substring(1);
            var possible = workingdir + n;
            if(fs.existsSync(possible)) requireNode(possible);
            else requireNode.apply(null,arguments);
        }
    }
    global.require.__proto__ = global.requireNode;
/*
    var appSchema = $.NSURLProtocol.extend('URLAppSchema');
    appSchema.addClassMethod('canInitWithRequest:', 'c@:@', function(self, cmd, theRequest) {
        console.log('received request');
        if (theRequest('URL')('scheme')('caseInsensitiveCompare',$('app')) == $.NSOrderedSame)
            return $.YES;
        else
            return $.NO;
    });
    appSchema.addClassMethod('canonicalRequestForRequest:', '@@:@', function(self, cmd, request) {
        return request;
    });
    appSchema.addMethod('startLoading','v@:', function(self, cmd) {
        console.log('starting load...');
        if(application.packaged) {
            // TODO
        } else {
            var url = self('request')('URL')('path');
            console.log('reading: ',url);
            if(url[0] == '/') url = url.substring(1);
            var possible = workingdir + url;
            if(!file.existsSync(possible)) {
                self('client')('URLProtocol',self,'didFailWithError',null);
            } else {
                var data = fs.readFileSync(possible);
                var response = $.NSURLResponse('alloc')('initWithURL',requestUrl,'MIMEType',mediaType,'expectedContentLength',data.length,'textEncodingName',$("utf-8"));
                self('client')('URLProtocol',self,'didReceiveResponse',response,'cacheStoragePolicy', $.NSURLCacheStorageAllowed);
                self('client')('URLProtocol',self,'didLoadData',$(data));
                self('client')('URLProtocolDidFinishLoading',self);
            }
        }
    });
    appSchema.addMethod('stopLoading','v@:', function(self, cmd) {
        if(application.packaged) {
            // TODO
        } else {
            
        }
    });
    appSchema.register();
    $.NSURLProtocol('registerClass',appSchema('class'));*/
}