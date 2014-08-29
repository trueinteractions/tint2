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
 * @see {Notification}
 * @example
 */
function run($utils) {
  var mainWindow = new Window();
  var urlLocation = new TextInput();
  var webView = new WebView();
  var toolbar = new Toolbar();
  var backButton = new Button();
  var forwardButton = new Button();

  backButton.image = 'back';
  forwardButton.image = 'forward';

  mainWindow.appendChild(webView);
  toolbar.appendChild([backButton, forwardButton, 'space', urlLocation, 'space']);
  mainWindow.toolbar = toolbar;

  mainWindow.titleVisible = false;
  mainWindow.preferences.animateOnSizeChange = true;
  mainWindow.preferences.animateOnPositionChange = true;

  urlLocation.alignment = 'center';
  urlLocation.linewrap = false;
  urlLocation.scrollable = true;

  backButton.addEventListener('click',function() { webView.back(); });
  forwardButton.addEventListener('click',function() { webView.forward(); });

  urlLocation.addEventListener('inputend', function() {
    var url = urlLocation.value;
    if(url.indexOf(':') == -1) url = "http://"+url;
    webView.location = url;
  });

  webView.addEventListener('load', function() { urlLocation.value = webView.location; });

  mainWindow.addLayoutConstraint({
    priority:'required', relationship:'=',
    firstItem:webView, firstAttribute:'top',
    secondItem:mainWindow, secondAttribute:'top',
    multiplier:1.0, constant:0.0
  });
  mainWindow.addLayoutConstraint({
    priority:'required', relationship:'=',
    firstItem:webView, firstAttribute:'bottom',
    secondItem:mainWindow, secondAttribute:'bottom',
    multiplier:1.0, constant:0
  });
  mainWindow.addLayoutConstraint({
    priority:'required', relationship:'=',
    firstItem:webView, firstAttribute:'left',
    secondItem:mainWindow, secondAttribute:'left',
    multiplier:1.0, constant:0.0
  });
  mainWindow.addLayoutConstraint({
    priority:'required', relationship:'=',
    firstItem:webView, firstAttribute:'right',
    secondItem:mainWindow, secondAttribute:'right',
    multiplier:1.0, constant:0
  });

  $utils.ok(); // add unit tests.
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
  name:"Toolbar",
};