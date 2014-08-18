
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
	console.log(data);
	$utils.ok();
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