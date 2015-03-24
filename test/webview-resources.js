
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

  var win = new Window();
  var webview = new WebView();

  win.appendChild(webview);
  webview.addEventListener('message', function(e) {
    $utils.assert(e === "success", "Got a failure message.");
    $utils.ok();
  });
  webview.location = "app://assets/webview-resources.html";
  win.visible = true;
  webview.left=webview.right=webview.top=webview.bottom=0;

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
  name:"WebViewResources",
};

