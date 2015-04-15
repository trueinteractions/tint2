require('Application');

var os = require('os');
var fs = require('fs');
var ismac = os.platform().toLowerCase() == "darwin";
var log = function(e) { process.stdout.write(e); };
var exit = function(code) { process.exit(code); };
var isappveyor = process.env['APPVEYOR'] ? true : false;
var debugappveyor = true;
var debug = debugappveyor && isappveyor;
var successMark = 'Pass';
var failureMark = 'Fail';
var $;
var nl = '\r\n';

if(ismac) {
  process.bridge.objc.import('Foundation');
  process.bridge.objc.import('Quartz');
  process.bridge.objc.import('Cocoa');
  process.bridge.objc.import('AppKit');
  process.bridge.objc.import('CoreGraphics');
  $ = process.bridge.objc;
  successMark = '✓';
  failureMark = '✕';
  nl = '\n';
} else {
  $ = process.bridge.dotnet;
  var $w32 = process.bridge.win32;
  log = function(e) {
    e = e.toString();
    while(e.length > 512) {
      fs.writeSync(1, e.substring(0,512));
      e = e.substring(512);
    }
    fs.writeSync(1, e);
  }
  exit = function(code) {
    process.exit(code);
  }
}

var exec = require('child_process').exec;
var spawn = require('child_process').spawn;
var args = require('./minimist');
var grayedOutBegin = '\033[90m';
var brightRedBegin = '\033[31m'
var brightBlueBegin = '\033[36m'
var colorEnd = '\033[0m';
var currentTest = null;
var createBaseline = false;
var ex = require('System');
var tintexec;


ex.writeImage = function writeImageToFile(image, path) {
    var bf = new Buffer(image.toString(), 'base64');
    var fs = require('fs');
    fs.writeFileSync(path,bf);
}

if (ismac) {
    ex.setupShell = function setupShell(name, cmd) {
      execAndPump("mkdir "+name+"-test", function() {
        execAndPump("cp -a -p tools/Shell.app "+name+"-test", function() {
          execAndPump("cp -a -p "+tintexec+" "+name+"-test/Shell.app/Contents/MacOS/Runtime", function() {
            execAndPump("cp "+name+".js ./"+name+"-test/Shell.app/Contents/Resources/test.js", function() {
              execAndPump("cat tools/shell-stub.js >> ./"+name+"-test/Shell.app/Contents/Resources/test.js", cmd, notok)
            }, notok);
          }, notok);
        }, notok);
      }, notok);
    }
    ex.runShell = function runShell(name, cb, err, options) {
      spawnAndPump("./"+name+"-test/Shell.app/Contents/MacOS/Runtime ./"+name+"-test/Shell.app/Contents/Resources/test.js tests", cb, err, options);
    }
    ex.runBaseline = function runBaseline(name, cb, err, options) {
      spawnAndPump("./"+name+"-test/Shell.app/Contents/MacOS/Runtime ./"+name+"-test/Shell.app/Contents/Resources/test.js baseline", cb, err, options);
    }
    ex.shutdownShell = function shutdownShell(name, cb) {
      execAndPump("rm -rf ./"+name+"-test/", cb, function() { console.log('*** FATAL *** Cannot cleanup!'); });
    }
} // END MAC SPECIFIC CODE
else 
{ // BEGIN WINDOWS SPECIFIC CODE
  ex.setupShell = function setupShell(name, cmd) { /* Do nothing */ }
  ex.runShell = function runShell(name, cb, err, options) { spawnAndPump(tintexec + " "+" name.js", cb, err, options); }
  ex.runBaseline = function runBaseline(name, cb, err, options) { /* Do nothing */ }
  ex.shutdownShell = function shutdownShell(name, cb) { /* Do nothing */ }

} // END WINDOWS SPECIFIC CODE

ex.assert = function assert(condition,value) {
  if(!condition) {
    var msg;
    try {
      throw new Error(value ? value : '');
    } catch(e) {
      msg = e;
    };
    log('assertion failed.');
    log(msg.message);
    log(msg.stack);
    exit(1);
  }
}
function spawnAndPump(cmd, cb, err, options) {
  var cmds = cmd.split(' ');
  var child = spawn(cmds[0], cmds.slice(1), { stdio: 'inherit' }).on('exit',function(code, signal) {
    if(code !== 0) {
      log(brightRedBegin+failureMark+colorEnd+' ["'+cmd.replace(new RegExp('\n','g'),'')+'"]'+nl+'\texited abnormally: '+code+' signal: '+signal);
      if(err) err(code,signal);
    } else {
      if(cb) cb();
    }
  });
  return child;
}
function execAndPump(cmd, cb, err, options) {
  var child =exec(cmd, options, function(error,stdout,stderr) { 
    if(error || stderr) {
      log('got error'+nl);
      if(error) log('\t'+error+nl);
      if(stderr) log('\t'+stderr+nl);
    } else if(stdout)
      log(stdout);
  }).on('exit',function(code, signal) {
    if(code != 0) {
      log(brightRedBegin+failureMark+colorEnd+' ["'+cmd.replace(new RegExp('\n','g'),'')+'"]'+nl+'\texited abnormally: '+code+' signal: '+signal);
      if(err) err(code,signal);
    } else {
      if(cb) cb();
    }
  });
  return child;
}
ex.ok = function ok() {
  if(currentTest && currentTest.shell && ismac) ex.shutdownShell(currentTest.name, function() {});
  log(brightBlueBegin + successMark + colorEnd +nl);
  exit(0);
}
ex.fail = function fail() {
  log('explicit fail thrown'+nl);
  exit(1);
}
function notok(code) {
  if(currentTest.shell && ismac) {
    ex.shutdownShell(currentTest.name, function() { exit(1); });
  }
  log(brightRedBegin+failureMark+colorEnd+' notok:['+code+']'+nl);
  exit(1);
}
ex.notok = notok;
ex.log = function(e) { log(e); }

if(process.argv[1] && process.argv[2] && process.argv[1].indexOf('utilities') > -1 && process.argv[2] != 'baseline' && process.argv[2] != 'tests') {
  tintexec = process.argv[2];
  var argv = args(process.argv.slice(3));
  if(argv.baseline == "true") createBaseline = true;
  var inputs = argv['_'];
  test(inputs[0]);
}

ex.debug = debug;

function test(item) {
  currentTest = require('../'+item);
  log(grayedOutBegin + ' ' + currentTest.name + ' ' + colorEnd);

  if(currentTest.shell && ismac) {
    ex.setupShell(currentTest.name,function() {
      if(createBaseline) ex.runBaseline(currentTest.name,ex.ok,notok,currentTest.shell_options); 
      else ex.runShell(currentTest.name,ex.ok,notok,currentTest.shell_options); 
    },notok);
  } else {
    try {
      ex.debug = debug;
      currentTest.setup();
      currentTest.run(ex);
      currentTest.shutdown();
      if(currentTest.timeout) {
        setTimeout(function() {
          log('timeout exceeded.'+nl);
          log(ex.takeSnapshotOfActiveScreen());
          exit(1);
        }, 50000);
      }
    } catch(e) {
      log(e.message);
      log(e.stack + '\n');
      notok(e.message);
    }
  }
}

module.exports = ex;

