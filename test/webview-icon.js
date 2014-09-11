
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
  var webview = new WebView();
  var imagewell = new ImageWell();

  mainWindow.appendChild(webview);
  mainWindow.appendChild(imagewell);
  imagewell.left = imagewell.top = 0;
  imagewell.width = 20; imagewell.height = 20;

  webview.left = webview.right = webview.bottom = 0;
  webview.top = 30;
  webview.addEventListener('icon', function() {
    $utils.assert(webview.icon);
    imagewell.image = webview.icon;
    $utils.ok();
  });
  webview.location = 'http://www.reddit.com/';
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
  name:"WebViewIcon",
};