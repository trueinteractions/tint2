
/**
 * @unit-test-setup
 * @ignore
 */
function setup() {
  require('Common');
}

function baseline() {
}

/**
 */
function run($utils) {
  var options = { 
    host: 'www.google.com',
    path: '/',
    method: 'GET',
    port: 443,
    headers: 
    {
      'User-Agent': 'node-XMLHttpRequest',
      Accept: '*/*',
      'Accept-Language': 'en_US',
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      Connection: 'keep-alive',
      Pragma: 'no-cache',
      'Accept-language': 'en_US',
      Expires: '0',
      'Content-Type': 'application/json',
      Host: 'www.google.com' 
    },
    agent: false 
  };
  var https = require('https');
  var req = https.request(options, function(response) {
    response.setEncoding('utf8');
    response.on('data', function() {

    });
    response.on('end', function() {
      $utils.ok();
    });
    response.on('error', function(er) {
      $utils.notok();
    })
  });
  req.on('error', function(err) {
    $utils.notok();
  });
  req.end();


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
  name:"SSL Test",
};