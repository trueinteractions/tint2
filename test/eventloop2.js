
/**
 * @unit-test-setup
 * @ignore
 */
function setup() {
  require('Common');
}

function baseline() {
}

function run($utils) {
  if($utils.debug) $utils.ok(); // TODO: short circuit this for appveyor until we have a better control.
	var http = require('http');

	var options = {
	  host: 'www.google.com',
		port: 80,
	  path: '/'
	};

	http.get(options, function(resp){
	  resp.on('data', function(chunk){
	  	$utils.assert(chunk);
	    $utils.ok();
	  });
	}).on("error", function(e){
		$utils.notok();
	});
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
  name:"EventLoopHttp",
};