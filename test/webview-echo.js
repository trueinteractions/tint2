
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
  var themessage = "Hello "+Math.random();
  var mainWindow = new Window();
  mainWindow.visible = true;
  var webview = new WebView();
  mainWindow.appendChild(webview);
  var gotLog = false;
  var gotWarn = false;
  var gotError = false;
  var gotInfo = false;
  var gotMessage = false;
  webview.left = webview.right = webview.top = webview.bottom = 0;
  webview.addEventListener('message', function(e) {
    $utils.assert(e == themessage, 'Expected '+themessage+' got '+e+' ');
    gotMessage = !gotMessage;
    if(gotLog && gotWarn && gotError && gotInfo && gotMessage) {
      $utils.ok();
    }
  });
  webview.addEventListener('load', function() {
    webview.postMessage(themessage);
  });
  webview.addEventListener('console', function(type, value) {
    if(type === 'log' && value[0] === 'log: ') gotLog = !gotLog;
    else if (type === 'warn' && value[0] === 'warn: ') gotWarn = !gotWarn;
    else if (type === 'error' && value[0] === 'error: ') gotError = !gotError;
    else if (type === 'info' && value[0] === 'info: ') gotInfo = !gotInfo;
    else {
      $utils.assert(false, 'Error, bad console message: ' + type + ' ' + value[0]);
    }
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
  timeout:true,
  name:"WebViewCommunicationTest",
};