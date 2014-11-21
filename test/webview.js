
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
  webview.top = webview.left = webview.right = webview.bottom = 0;

  webview.addEventListener('load', function() {
    mainWindow.title = webview.title;
    webview.postMessage('hello');
    /* @hidden */ webview.postMessage('hello2');
    /* @hidden */ webview.postMessage('hello3');
  });
  /* @hidden */ var count = 1;
  webview.addEventListener('title', function() {
    /* @hidden */ $utils.assert(webview.title == 'Test'+count, 'expected window.title['+webview.title+'] == Test'+count);
    mainWindow.title = webview.title;
    /* @hidden */ if(count == 4) {
    /* @hidden */   setTimeout(function() { mainWindow.destroy();
    /* @hidden */   $utils.ok(); }, 1000);
    /* @hidden */ }
    /* @hidden */ count++;
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