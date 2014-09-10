
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
  var webview = new WebView();
  mainWindow.appendChild(webview);
  webview.left = webview.right = webview.top = webview.bottom = 0;
  webview.addEventListener('message', function(e) {
    /* @hidden */ $utils.assert(e == themessage);
    /* @hidden */ $utils.ok();
  });
  webview.addEventListener('load', function() {
    webview.postMessage(themessage);
  });
  webview.location = 'app://assets/webview-echo-test.html';
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
  name:"WebViewCommunicationTest",
};