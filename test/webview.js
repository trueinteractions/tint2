
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
  var trackLoc = false;
  application.exitAfterWindowsClose = false;
  var mainWindow = new Window();
  mainWindow.visible = true;
  var webview = new WebView();
  mainWindow.appendChild(webview);
  webview.top = webview.left = webview.right = webview.bottom = 0;

  webview.addEventListener('load', function() {
    mainWindow.title = webview.title;

    /* @hidden */ var count = 4;
    setTimeout(function() { 
      $utils.assert(webview.title === 'Test'+count, 'expected window.title['+webview.title+'] == Test'+count);
      $utils.ok(); 
    },1000);
    webview.postMessage('hello');
    webview.postMessage('hello2');
    webview.postMessage('hello3');
  });
  webview.addEventListener('location-change', function() {

  });
  webview.location = 'app://assets/webview-test.html';
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
  name:"WebView",
};