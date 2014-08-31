
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
 * @see {Split}
 * @example
 */
function run($utils) {
  /*var win = new Window();
  var split = new Split();
  var webview1 = new WebView();
  var webview2 = new WebView();

  win.appendChild(split);
  split.appendChild(webview1);
  split.appendChild(webview2);
  split.left = 0;
  split.width = '500px';
  split.height = '500px';
  //webview2.left = webview2.top = 0;
  //webview1.left = webview1.right = webview1.top = webview1.bottom = 0;
  webview1.location = 'https://www.google.com';
  webview2.location = 'https://www.bing.com';*/
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
  name:"Split",
};