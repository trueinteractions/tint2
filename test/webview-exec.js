
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
  var webview = new WebView();
  mainWindow.appendChild(webview);
  webview.left = webview.right = webview.top = webview.bottom = 0;
  webview.location = 'app://assets/webview-echo-test.html';
  webview.addEventListener('load', function() {
    var result = webview.execute('return document.getElementById("foo").innerHTML');
    /* @hidden */ $utils.assert(result == 'test value');
    /* @hidden */ $utils.ok();
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
  name:"WebViewExecuteJS",
};