
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
	var data = application.resource('failing/appresources.js');
	console.log('data: ',data, ' length: ', data.length);
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