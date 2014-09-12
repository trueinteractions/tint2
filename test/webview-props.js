
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
  //NOT working: webview.privateBrowsing = true;
  webview.allowAnimatedImages = false;
  webview.allowAnimatedImagesToLoop = false;
  webview.allowJava = false;
  webview.allowJavascript = false;
  webview.allowPlugins = false;
  webview.location = "https://www.google.com";

  webview.addEventListener('load', function() {
    //NOT working: $utils.assert(webview.privateBrowsing == true, 'private browsing was not true.');
    $utils.assert(webview.allowAnimatedImages == false, 'allow animated images was true.');
    $utils.assert(webview.allowAnimatedImagesToLoop == false, 'allow animated images to loop not true.');
    $utils.assert(webview.allowJava == false, 'allow java was true.');
    $utils.assert(webview.allowJavascript == false, 'allow javascript was true.');
    $utils.assert(webview.allowPlugins == false, 'allow plugins was true.');
    $utils.ok();
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
  name:"WebViewProperties",
};