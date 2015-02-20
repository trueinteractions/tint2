
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
  //$utils.ok();
  var mainWindow = new Window();
  mainWindow.visible = true;
  var webview = new WebView();
  mainWindow.appendChild(webview);
  webview.left = webview.right = webview.top = webview.bottom = 0;
  
  webview.addEventListener('new-window', function(newWebView) {
    var newWindow = new Window();
    newWindow.visible = true;
    newWindow.x += 20;
    newWindow.appendChild(newWebView);
    newWebView.addEventListener('message', function(e) {
      if(e == "loaded!") {
        $utils.ok();
      } else {
        $utils.notok();
      }
    });
    newWebView.left=newWebView.right=newWebView.top=newWebView.bottom=0;
  });
  $utils.assert(webview.location === null);
  var b = webview.boundsOnScreen;
  //$utils.assert(webview.location === null);
  
  webview.addEventListener('load', function() {
    webview.boundsOnWindowOfElement('#newwin', function(coords) {
      $utils.clickAt(b.x + coords.x, b.y + coords.y);
    });

  //},1000)
  });

  webview.location = 'app://assets/webview-newwindow.html';
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
  name:"WebViewNewWindow",
};