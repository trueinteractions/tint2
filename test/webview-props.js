
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

  var mainWindow = new Window();
  var webview = new WebView();
  mainWindow.appendChild(webview);
  webview.left = webview.right = webview.top = webview.bottom = 0;
  webview.privateBrowsing = true;
  webview.allowAnimatedImages = false;
  webview.allowAnimatedImagesToLoop = false;
  webview.allowJava = false;
  webview.allowJavascript = false;
  webview.allowPlugins = false;

  $utils.assert(webview.privateBrowsing == true);
  $utils.assert(webview.allowAnimatedImages == false);
  $utils.assert(webview.allowAnimatedImagesToLoop == false);
  $utils.assert(webview.allowJava == false);
  $utils.assert(webview.allowJavascript == false);
  $utils.assert(webview.allowPlugins == false);
  $utils.ok();
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
  name:"WebViewProperties",
};