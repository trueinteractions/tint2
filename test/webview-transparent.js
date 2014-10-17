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
 * @see {Window}
 * @example
 */
function run($utils) {
  var mainWindow = new Window(), alpha = 1;
  var webview = new WebView();
  mainWindow.visible = true;
  mainWindow.appendChild(webview);
  webview.top = webview.left = webview.right = webview.bottom = 0;

  webview.location = "app://assets/webview-transparency.html";
  mainWindow.title = "You should be able to see this.";
  //mainWindow.frame = false;
  webview.transparent = true;
  //mainWindow.alpha = 0;


  setTimeout(function() {
    mainWindow.destroy();
    $utils.ok();
  },2000);
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
  name:"WebViewTransparent",
};