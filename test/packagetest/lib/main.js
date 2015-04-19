require('Common');
var fs = require('fs');
if(application.packaged && application.resource('app:///lib/main.js') === null) {
	fs.writeFileSync('packagebuild.result', new Buffer('1'));
	process.exit(1);
} else if(application.packaged && application.resource('app:///lib/main.js') === null) {
	fs.writeFileSync('packagebuild.result', new Buffer('2'));
	process.exit(2);
} else if (!application.packaged && application.resource('app:///main.js') === null) {
	fs.writeFileSync('packagebuild.result', new Buffer('3'));
	process.exit(3);
} else if (!application.packaged && application.resource('app://main.js') === null) {
	fs.writeFileSync('packagebuild.result', new Buffer('4'));
	process.exit(4);
}
fs.writeFileSync('packagebuild.result', new Buffer('0'));
process.exit(0);