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
  mainWindow.visible = true;
  var webview = new WebView();
  mainWindow.appendChild(webview);
  webview.top = webview.left = webview.right = webview.bottom = 0;

  webview.location = "app://assets/webview-transparency.html";
  //mainWindow.title = "You should be able to see this.";
  //mainWindow.frame = false;
  mainWindow.maximizeButton = false;
  mainWindow.minimizeButton = false;
  mainWindow.closeButton = false;
  mainWindow.titleVisible = false;
  /* @hidden */ $utils.assert(mainWindow.frame == true);
  mainWindow.frame = false;
  webview.transparent = true;
  mainWindow.backgroundColor = "rgba(0,255,0,0);"; // ensure we have a transparent "draw" color
  mainWindow.alpha = 1; // but also ensure child components can render.


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
  name:"WebViewTransparent2",
};