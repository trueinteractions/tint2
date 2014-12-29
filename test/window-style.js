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
  application.exitAfterWindowsClose = false;
  var mainWindow = new Window(), alpha = 1;
  mainWindow.visible = true;
  var webview = new WebView();
  mainWindow.appendChild(webview);
  webview.top = webview.left = webview.right = webview.bottom = 30;
  
  webview.location = "http://www.reddit.com/r/javascript";
  mainWindow.title = "You should be able to see this.";
  var interval = setInterval(function() {
    mainWindow.backgroundColor = 'rgba('+alpha*255+',0,0,1);';
    alpha = alpha - 30/1000;
    if(alpha <= 0) { 
      alpha = 0;
      clearInterval(interval);
      interval = setInterval(function() {
        mainWindow.backgroundColor = 'rgba('+alpha*255+',0,0,1);';
        alpha = alpha + 30/1000;
        if(alpha >= 1) {
          clearInterval(interval);
          mainWindow.backgroundColor = "auto";
          mainWindow.destroy();
          $utils.ok();
        }
      },1000/30);
    }
  },1000/30);
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
  name:"WindowStyle",
};