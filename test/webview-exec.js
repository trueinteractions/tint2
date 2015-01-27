
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
  var mainWindow = new Window();
  mainWindow.visible = true;
  var webview = new WebView();
  mainWindow.appendChild(webview);
  webview.left = webview.right = webview.top = webview.bottom = 0;
  webview.location = 'app://assets/webview-echo-test.html';
  webview.addEventListener('load', function() {
    webview.execute('document.getElementById("foo").innerHTML', function(result) {
      $utils.assert(result == 'test value', "expected 'test value', got '"+result+"'");
      $utils.ok();
    });
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
  timeout:true,
  name:"WebViewExecuteJS",
};