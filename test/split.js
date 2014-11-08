
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
  var count = 0;
  var win = new Window();
  win.visible = true;
  var split = new Split();
  var webview1 = new WebView();
  var webview2 = new WebView();
  var webview3 = new WebView();
  win.appendChild(split);
  /* @hidden */ split.addEventListener('resized', function() {
  /* @hidden */   count++;
  /* @hidden */ });
  split.appendChild(webview1);
  split.appendChild(webview2);
  split.appendChild(webview3);
  split.left = split.right = split.top = split.bottom = 0;
  webview1.location = 'https://www.google.com';
  webview2.location = 'https://www.bing.com';
  webview3.location = 'https://www.yahoo.com';
  /*webview1.width='100%';
  webview1.height='100%';
  webview2.width='100%';
  webview2.height='100%';
  webview3.width='100%';
  webview3.height='100%';*/
  split.style = "thin";
  /* @hidden */ $utils.assert(split.orientation == "vertical");
  // The first value is a percentage indicating where the divider should be
  // placed, the second is the index of the divider which is n-1 the children.
  // or two in this case.
  split.setPosition(0.333,0);
  split.setPosition(0.666,1);
  /* @hidden */ setTimeout(function() { 
  /* @hidden */   $utils.assert(split.style == "thin");
  /* @hidden */   $utils.assert(count >= 3, 'count should be greater than 3, it was: '+count);
  /* @hidden */   $utils.ok();
  /* @hidden */ },1000);
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