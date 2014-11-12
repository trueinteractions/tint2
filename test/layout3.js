
/**
 * @unit-test-setup
 * @ignore
 */
function setup() {
  require('Common');
}

function baseline() {
}

function run($utils) {

	var win = new Window();
	win.visible = true;
	win.width = 500;
	win.height = 500;
	var webview = new WebView();
	webview.left = 0;
	webview.right = '50%';
	webview.top = 0;
	webview.bottom = 0;
	webview.location = "http://www.reddit.com";
	win.appendChild(webview);
	setTimeout(function() { 
		var w = webview.boundsOnScreen.width;
		// Give the width some leeway, as its going to have frame/borders that constrain
		// its possible width from 250.
		$utils.assert(w > 225 && w <= 250, ' width was: '+w+' expected it between 225 and 275');
		$utils.ok();
	},1000);
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
  name:"Layout3",
};
