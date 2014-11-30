
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

	var server = http.createServer(function (request, response) {
	  response.writeHead(200, {"Content-Type": "text/plain"});
	  response.end("Hello World\n");
	});
	server.listen(8210);

	var win = new Window();
	win.visible = true;

	var btn = new Button();
	btn.title = "Send HTTP Request";
	btn.addEventListener('click', function() {
		var options = {
		  hostname: '127.0.0.1',
		  port: 8210,
		  path: '/',
		  method: 'POST'
		};
		var req = http.request(options, function(res) {
		  res.setEncoding('utf8');
		  res.on('data', function (chunk) {
		  	$utils.assert(chunk == "Hello World\n");
		  	var req2 = http.request({hostname:'www.google.com', port:80, path:'/', method:'GET'}, function(res2) {
		  		res2.setEncoding('utf8');
		  		res2.on('data', function(chunk) {
		  			$utils.assert(chunk);
		  			$utils.ok();
		  		});
		  	});
	  		req2.end();
		  });
		});
		req.write('hello\n');
		req.end();
	});
	win.appendChild(btn);
	btn.left = btn.right = btn.middle = 0;

	setTimeout(function() { $utils.clickAtControl(btn); })
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
  name:"NodeHttp",
};