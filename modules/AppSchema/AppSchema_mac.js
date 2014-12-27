module.exports = function(basepath) {
    var workingdir = process.cwd();
    if(workingdir[workingdir.length-1] !== '/') {
      workingdir += '/';
    }
    var fs = require('fs');
    global.requireNode = global.require;
    global.require = function() {
      var n = arguments[0];
      if(n[0] === '/') {
        n = n.substring(1);
      }
      var possible = workingdir + n;
      if(fs.existsSync(possible)) {
        global.requireNode(possible);
      } else {
        return global.requireNode.apply(null,arguments);
      }
    }
    global.require.__proto__ = global.requireNode;
}
