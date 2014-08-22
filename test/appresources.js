var fs = require('fs');
/**
 * @unit-test-setup
 * @ignore
 */
function setup() {
	require('Application');
	global.Window = require('Window');
}

function baseline() {
}

/**
 * @see {Notification}
 * @example
 */
function run($utils) {
	var data = application.resource('appresources.js');
  /* @hidden */ $utils.assert(fs.statSync('appresources.js').size == data.length); 
  /* @hidden */ $utils.assert(application.resource('doesnotexist.js') === null);
	/* @hidden */ $utils.ok();
}

/**
 * @unit-test-shutdown
 * @ignore
 */
function shutdown() {
}

module.exports = {
	setup:setup, 
	run:run, 
	shutdown:shutdown, 
	shell:false,
	name:"AppResources",
};