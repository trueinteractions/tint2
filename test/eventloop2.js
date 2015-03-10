
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
  var http = require('http');

  var options = {
    host: 'www.google.com',
    port: 80,
    path: '/'
  };

  http.get(options, function(resp){
    console.log(1);
    resp.on('data', function(chunk){
      console.log(2);
      $utils.assert(chunk);
      $utils.ok();
    });
  }).on("error", function(e){
    console.log(e);
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