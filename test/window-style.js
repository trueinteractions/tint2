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
  mainWindow.titleTextColor = "blue";
  mainWindow.appendChild(webview);
  mainWindow.addLayoutConstraint({
    priority:'required', relationship:'=',
    firstItem:webview, firstAttribute:'top',
    secondItem:mainWindow, secondAttribute:'top',
    multiplier:1.0, constant:30.0
  });
  mainWindow.addLayoutConstraint({
    priority:'required', relationship:'=',
    firstItem:webview, firstAttribute:'left',
    secondItem:mainWindow, secondAttribute:'left',
    multiplier:1.0, constant:30.0
  });
  mainWindow.addLayoutConstraint({
    priority:'required', relationship:'=',
    firstItem:webview, firstAttribute:'right',
    secondItem:mainWindow, secondAttribute:'right',
    multiplier:1.0, constant:-30.0
  });
  mainWindow.addLayoutConstraint({
    priority:'required', relationship:'=',
    firstItem:webview, firstAttribute:'bottom',
    secondItem:mainWindow, secondAttribute:'bottom',
    multiplier:1.0, constant:-30.0
  });
  webview.location = "http://www.reddit.com/r/javascript";
  mainWindow.title = "You should be able to see this.";
  var interval = setInterval(function() {
    mainWindow.backgroundColor = 'rgba(1,0,0,'+alpha+');';
    alpha = alpha - 30/1000;
    if(alpha <= 0) { 
      alpha = 0;
      clearInterval(interval);
      interval = setInterval(function() {
        mainWindow.backgroundColor = 'rgba(1,0,0,'+alpha+');';
        alpha = alpha + 30/1000;
        if(alpha >= 1) {
          clearInterval(interval);
          mainWindow.backgroundColor = "auto";
          mainWindow.close();
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