require('Common');
if(application.packaged && application.resource('app:///lib/main.js') == null) {
	process.exit(1);
} else if(application.packaged && application.resource('app://lib/main.js') === null) {
	process.exit(1);
} else if (!application.packaged && application.resource('app:///main.js') === null) {
	process.exit(1);
} else if (!application.packaged && application.resource('app://main.js') === null) {
	process.exit(1);
}
process.exit(0);