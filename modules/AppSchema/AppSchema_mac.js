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
            else return global.requireNode.apply(null,arguments);
        }
    }
    global.require.__proto__ = global.requireNode;
}