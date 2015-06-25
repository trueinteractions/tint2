
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
  
  webview.addEventListener('load', function() {
    webview.boundsOfElement('.someclass', function(r) { 
      $utils.assert(r.width === 200, 'Width was not 200. '+r.width);
      $utils.assert(r.height === 200, 'Height wasnt 200. '+r.height);
      $utils.assert(r.y === 1000, 'y was not 1000.' + r.y);
      $utils.assert(r.x === 1200, 'x was not 1200.' + r.x);
      $utils.ok();
    });
  });
  webview.location = 'app://assets/webview-dom-rect.html';
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
  name:"WebViewDomRectangle",
};