
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
  application.exitAfterWindowsClose = false;
  var mainWindow = new Window();
  mainWindow.visible = true;
  var webview = new WebView();
  mainWindow.appendChild(webview);
  webview.top = webview.left = webview.right = webview.bottom = 0;

  webview.addEventListener('load', function() {
    mainWindow.title = webview.title;
    webview.postMessage('hello');
    webview.postMessage('hello2');
    webview.postMessage('hello3');
  });
  /* @hidden */ var count = 1;
  
  webview.addEventListener('title', function() {
    mainWindow.title = webview.title;
    $utils.assert(webview.title == 'Test'+count, 'expected window.title['+webview.title+'] == Test'+count);
    if(count == 4) {
      setTimeout(function() { 
        mainWindow.destroy();
        $utils.ok(); 
      }, 1000);
    }
    count++;
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