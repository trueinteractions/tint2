
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
  //UNSTABLE
  var count = 0;
  var win = new Window();
  var split = new Split();
  var webview1 = new WebView();
  var webview2 = new WebView();
  var webview3 = new WebView();
  win.appendChild(split);
  split.appendChild(webview1);
  split.appendChild(webview2);
  split.appendChild(webview3);
  split.left = split.right = split.top = split.bottom = 0;
  /* @hidden */ split.addEventListener('resized', function() {
  /* @hidden */   count++;
  /* @hidden */ });
  webview1.location = 'https://www.google.com';
  webview2.location = 'https://www.bing.com';
  webview3.location = 'https://www.yahoo.com';
  split.style = "thin";
  /* @hidden */ $utils.assert(split.orientation == "vertical");
  // The first value is a percentage indicating where the divider should be
  // placed, the second is the index of the divider which is n-1 the children.
  // or two in this case.
  split.setPosition(0.333,0);
  split.setPosition(0.666,1);
  /* @hidden */ //setTimeout(function() { 
  /* @hidden */ //  $utils.assert(split.style == "thin");
  /* @hidden */ //  $utils.assert(count > 3);
  /* @hidden */   
  /* @hidden */ //},1000);
  //$utils.ok();
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