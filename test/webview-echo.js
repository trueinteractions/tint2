
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
 * @see {WebView}
 * @example
 */
function run($utils) {
  /* @hidden */ var $ = process.bridge.objc;
  var themessage = "Hello "+Math.random();
  var mainWindow = new Window();
  mainWindow.visible = true;
  var webview = new WebView();
  mainWindow.appendChild(webview);
  webview.left = webview.right = webview.top = webview.bottom = 0;
  webview.addEventListener('message', function(e) {
    if($utils.debug) $utils.log('message received.');
    /* @hidden */ $utils.assert(e == themessage);
    /* @hidden */ $utils.ok();
  });
  webview.addEventListener('load', function() {
    if($utils.debug) $utils.log('loaded, sending message.');
    webview.postMessage(themessage);
  });
  webview.location = 'app://assets/webview-echo-test.html';
  if($utils.debug) $utils.log('setup end.');
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
  timeout:true,
  name:"WebViewCommunicationTest",
};