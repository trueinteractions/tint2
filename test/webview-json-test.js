
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
  var gotLog = false;
  var gotWarn = false;
  var gotError = false;
  var gotInfo = false;
  var gotMessage = false;
  webview.left = webview.right = webview.top = webview.bottom = 0;

  var jsonObject = {
    Hello:"Hel\\nlo",
    "Hello2":"Hello\nf\'oo",
    'foo':'y\tou'
  };

  webview.addEventListener('load', function() {
    webview.postMessage(JSON.stringify(jsonObject));
  });
  webview.addEventListener('console', function(type, value) {
    if(type === 'log' && value[0] === true) {
      $utils.ok();
    } else {
      $utils.notok();
    }
  });
  webview.location = 'app://assets/webview-json-test.html';
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
  name:"WebViewCommunicationTest",
};